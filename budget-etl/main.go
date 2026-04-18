package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/keychain"
	"github.com/natb1/commons.systems/budget-etl/internal/parse"
	"github.com/natb1/commons.systems/budget-etl/internal/rules"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func main() {
	dir := flag.String("dir", "", "Path to statement directory")
	group := flag.String("group", "", "Group name to upload transactions for")
	env := flag.String("env", "prod", "Firestore environment namespace")
	dryRun := flag.Bool("dry-run", false, "Parse and print summary without writing to Firestore")
	projectID := flag.String("project", "", "Firebase project ID (default: inferred from environment)")
	outputPath := flag.String("output", "", "Write JSON file instead of Firestore")
	firestoreFlag := flag.Bool("firestore", false, "Write to Firestore (required when --output is not set)")
	inputPath := flag.String("input", "", "Read rules/budgets/transactions from existing JSON file")
	keychainFlag := flag.String("keychain", "", "macOS Keychain account name for encrypt/decrypt password")

	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: budget-etl [--dir <path>] --group <name> [--output <path> | --firestore] [--input <path>] [--keychain <name>] [--env <env>] [--dry-run]")
		flag.PrintDefaults()
	}
	flag.Parse()

	if *inputPath != "" && *firestoreFlag {
		fmt.Fprintln(os.Stderr, "Error: --input and --firestore are mutually exclusive")
		os.Exit(1)
	}
	if *inputPath != "" && *outputPath == "" {
		fmt.Fprintln(os.Stderr, "Error: --input requires --output")
		os.Exit(1)
	}

	// Resolve password early so keychain errors fail fast before file I/O
	var password string
	if *keychainFlag != "" {
		pw, err := keychain.Get(*keychainFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		password = pw
		log.Printf("retrieved password from keychain (account: %s)", *keychainFlag)
	}

	if *inputPath != "" && *dir != "" {
		if err := runMerge(fileOpts{path: *inputPath, password: password}, *dir, *group, fileOpts{path: *outputPath, password: password}); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}
	if *inputPath != "" {
		if err := runInputJSON(fileOpts{path: *inputPath, password: password}, fileOpts{path: *outputPath, password: password}); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	if *dir == "" || *group == "" {
		flag.Usage()
		os.Exit(1)
	}
	if *outputPath != "" && *firestoreFlag {
		fmt.Fprintln(os.Stderr, "Error: --output and --firestore are mutually exclusive")
		os.Exit(1)
	}
	if *outputPath == "" && !*firestoreFlag && !*dryRun {
		fmt.Fprintln(os.Stderr, "Error: specify --output <path> or --firestore")
		os.Exit(1)
	}

	if err := run(*dir, *group, *env, *projectID, *dryRun, fileOpts{path: *outputPath, password: password}, *firestoreFlag); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

type fileOpts struct {
	path     string
	password string
}

type parsedFile struct {
	sf     parse.StatementFile
	result parse.ParseResult
}

func run(dir, groupName, env, projectID string, dryRun bool, output fileOpts, firestoreMode bool) error {
	// Discover statement files
	files, err := parse.DiscoverFiles(dir)
	if err != nil {
		return fmt.Errorf("discovering files in %s: %w", dir, err)
	}
	log.Printf("discovered %d statement files", len(files))

	// Parse all files concurrently
	type fileResult struct {
		sf     parse.StatementFile
		result parse.ParseResult
		err    error
	}
	ch := make(chan fileResult, len(files))
	for _, sf := range files {
		go func() {
			result, err := parse.ParseFile(sf.Path)
			ch <- fileResult{sf: sf, result: result, err: err}
		}()
	}

	var parsed []parsedFile
	var totalTxns int
	var skipped int
	for range files {
		r := <-ch
		if r.err != nil {
			return r.err
		}
		if r.result.Skipped {
			log.Printf("skipping %s: %s", r.sf.Path, r.result.SkipReason)
			skipped++
			continue
		}
		// Override path-derived period with document-inferred period before any
		// downstream use of sf (StatementID, buildStatementData, etc.).
		if inferred := r.result.InferPeriod(); inferred != "" {
			r.sf.Period = inferred
		} else {
			log.Printf("could not infer period from document data for %s, using path-derived period %q", r.sf.Path, r.sf.Period)
		}
		parsed = append(parsed, parsedFile{sf: r.sf, result: r.result})
		totalTxns += len(r.result.Transactions)
	}

	log.Printf("parsed %d transactions from %d files (%d skipped)", totalTxns, len(parsed), skipped)

	// Build all TransactionData, StatementItemData, and StatementData across all files.
	// Dedup by doc ID: overlapping statement files (same statementId) can
	// produce duplicate transactions with the same OFX FITID. Statement items
	// are deduped by their canonical id ({institution}_{account}_{fitid}), which
	// collapses the same bank line appearing in multiple statement files
	// (e.g., an item that crosses a month boundary).
	seen := make(map[string]bool, totalTxns)
	seenItems := make(map[string]bool, totalTxns)
	allTxns := make([]store.TransactionData, 0, totalTxns)
	allItems := make([]store.StatementItemData, 0, totalTxns)
	for _, pf := range parsed {
		for _, t := range pf.result.Transactions {
			docID := store.TransactionDocID(pf.sf.StatementID(), t.TransactionID)
			if seen[docID] {
				continue
			}
			seen[docID] = true
			stmtItemID := buildStatementItemID(pf.sf.Institution, pf.sf.Account, t.TransactionID)
			allTxns = append(allTxns, store.TransactionData{
				Institution:     pf.sf.Institution,
				Account:         pf.sf.Account,
				Description:     t.Description,
				Amount:          t.Amount,
				Timestamp:       t.Date,
				StatementID:     pf.sf.StatementID(),
				StatementItemID: stmtItemID,
				TransactionID:   t.TransactionID,
			})
			if seenItems[stmtItemID] {
				continue
			}
			seenItems[stmtItemID] = true
			// Statement items use the raw bank sign (negative = debit); TransactionData
			// has already inverted it. Undo the inversion from convertRawTransaction.
			allItems = append(allItems, store.StatementItemData{
				StatementItemID: stmtItemID,
				StatementID:     pf.sf.StatementID(),
				Institution:     pf.sf.Institution,
				Account:         pf.sf.Account,
				Period:          pf.sf.Period,
				Amount:          -t.Amount,
				Timestamp:       t.Date,
				Description:     t.Description,
				FITID:           t.TransactionID,
			})
		}
	}
	maxDates := maxTransactionDates(allTxns)
	allStmts := buildStatementData(parsed, maxDates)
	allStmts = append(allStmts, deriveMonthlyStatements(parsed)...)

	if dryRun {
		printSummary(parsed, totalTxns, skipped)
		return nil
	}

	if output.path != "" {
		return runOutputJSON(allTxns, allStmts, groupName, output)
	}

	// Resolve project ID
	if projectID == "" {
		projectID = os.Getenv("GOOGLE_CLOUD_PROJECT")
	}
	if projectID == "" {
		p, err := readFirebaseRC()
		if err != nil {
			return fmt.Errorf("resolving project ID: %w\nSpecify --project or set GOOGLE_CLOUD_PROJECT", err)
		}
		projectID = p
	}
	log.Printf("using project %s", projectID)

	// Connect to Firestore
	ctx := context.Background()
	client, err := store.NewClient(ctx, projectID, env)
	if err != nil {
		return err
	}
	defer client.Close()

	// Authenticate and lookup group
	email, err := resolveGHEmail()
	if err != nil {
		return err
	}
	log.Printf("authenticated as %s", email)
	groupInfo, err := client.LookupGroup(ctx, email, groupName)
	if err != nil {
		return err
	}
	log.Printf("group %q (id=%s)", groupName, groupInfo.ID)

	// Load rules from Firestore and convert dollar amounts to cents
	ruleDocs, err := client.LoadRules(ctx, groupInfo.ID)
	if err != nil {
		return err
	}
	ruleSet, err := convertRuleDocs(ruleDocs)
	if err != nil {
		return err
	}

	// Apply categorization rules (error if <100% coverage)
	if err := rules.ApplyCategorization(allTxns, ruleSet); err != nil {
		return fmt.Errorf("categorization: %w", err)
	}

	// Apply budget assignment rules
	rules.ApplyBudgetAssignment(allTxns, ruleSet)

	return runFirestore(ctx, client, groupInfo, allTxns, allStmts, allItems, parsed)
}

// runOutputJSON writes parsed transactions and statements as a JSON file
// without applying rules. Category, budget, and normalization fields are
// left empty. Use --input to apply rules in a subsequent pass.
func runOutputJSON(allTxns []store.TransactionData, allStmts []store.StatementData, groupName string, output fileOpts) error {
	exportTxns := make([]export.Transaction, len(allTxns))
	for i, txn := range allTxns {
		exportTxns[i] = export.Transaction{
			ID:                store.TransactionDocID(txn.StatementID, txn.TransactionID),
			Institution:       txn.Institution,
			Account:           txn.Account,
			Description:       txn.Description,
			Amount:            store.DollarAmount(txn.Amount),
			Timestamp:         export.FormatTimestamp(txn.Timestamp),
			StatementID:       txn.StatementID,
			Note:              "",
			Reimbursement:     0,
			NormalizedPrimary: true,
		}
	}

	exportStmts := buildExportStatements(allStmts)

	out := export.Output{
		Version:            1,
		ExportedAt:         export.FormatTimestamp(time.Now()),
		GroupName:          groupName,
		Transactions:       exportTxns,
		Statements:         exportStmts,
		Budgets:            []export.Budget{},
		BudgetPeriods:      []export.BudgetPeriod{},
		Rules:              []export.Rule{},
		NormalizationRules: []export.NormalizationRule{},
		WeeklyAggregates:   []export.WeeklyAggregate{},
	}

	if err := export.WriteFile(output.path, out, output.password); err != nil {
		return fmt.Errorf("writing output file: %w", err)
	}
	log.Printf("wrote %d transactions, %d statements to %s", len(exportTxns), len(exportStmts), output.path)
	return nil
}

// virtualSynchronyResult holds generated virtual Synchrony spending transactions and statements.
type virtualSynchronyResult struct {
	transactions []store.TransactionData
	docIDs       []string
	statements   []export.Statement
}

// generateVirtualSynchrony creates virtual spending transactions on synchrony/virtual
// for each PNC->Synchrony card payment, plus virtual zero-balance statements per period.
// Deduplicates by (date, amount) so that normalized transaction pairs don't produce
// duplicate virtual transactions.
//
// Filter criteria: institution=pnc, account=5111, category=Transfer:CardPayment,
// description contains "SYNCHRONY" (case-insensitive).
// Output: category=Pet:Veterinarian, budget=pet.
// These values match the current PNC/Synchrony account setup; update if account details change.
func generateVirtualSynchrony(
	allTxns []store.TransactionData,
	txnDocIDs []string,
) virtualSynchronyResult {
	type dateAmount struct {
		date   string
		amount int64
	}
	seen := make(map[dateAmount]bool)
	var result virtualSynchronyResult
	periods := make(map[string]bool)
	for i, txn := range allTxns {
		if txn.Institution != "pnc" || txn.Account != "5111" {
			continue
		}
		if txn.Category != "Transfer:CardPayment" {
			continue
		}
		if !strings.Contains(strings.ToUpper(txn.Description), "SYNCHRONY") {
			continue
		}
		key := dateAmount{date: txn.Timestamp.Format("2006-01-02"), amount: txn.Amount}
		if seen[key] {
			continue
		}
		seen[key] = true
		period := txn.Timestamp.Format("2006-01")
		stmtID := "synchrony-virtual-" + period
		result.transactions = append(result.transactions, store.TransactionData{
			Institution:   "synchrony",
			Account:       "virtual",
			Description:   txn.Description,
			Amount:        txn.Amount,
			Timestamp:     txn.Timestamp,
			StatementID:   stmtID,
			TransactionID: "virtual-" + txnDocIDs[i],
			Category:      "Pet:Veterinarian",
			Budget:        "pet",
			Virtual:       true,
		})
		result.docIDs = append(result.docIDs, "virtual-"+txnDocIDs[i])
		periods[period] = true
	}
	// Generate virtual statements per unique period
	for period := range periods {
		stmtID := "synchrony-virtual-" + period
		result.statements = append(result.statements, export.Statement{
			ID:          store.StatementDocID(stmtID),
			StatementID: stmtID,
			Institution: "synchrony",
			Account:     "virtual",
			Balance:     0,
			Period:      period,
			Virtual:     true,
		})
	}
	return result
}

// computePetBudget computes a pet budget from virtual Synchrony transactions.
// Returns nil if no virtual transactions exist.
// Note: the returned Allowance field holds the monthly average because
// AllowancePeriod is "monthly".
func computePetBudget(virtualTxns []store.TransactionData) *export.Budget {
	if len(virtualTxns) == 0 {
		return nil
	}
	var total float64
	var earliest, latest time.Time
	for _, txn := range virtualTxns {
		total += store.DollarAmount(txn.Amount)
		if earliest.IsZero() || txn.Timestamp.Before(earliest) {
			earliest = txn.Timestamp
		}
		if latest.IsZero() || txn.Timestamp.After(latest) {
			latest = txn.Timestamp
		}
	}
	months := latest.Sub(earliest).Hours() / (24 * 30.44) // approximate months
	if months < 1 {
		months = 1
	}
	monthlyAvg := total / months
	return &export.Budget{
		ID:              "pet",
		Name:            "Pet",
		Allowance: math.Round(monthlyAvg*100) / 100,
		AllowancePeriod: "monthly",
		Rollover:        "none",
	}
}

// appendPetBudgetIfNeeded adds a pet budget to the list if virtual Synchrony
// transactions exist and the budget is not already present.
func appendPetBudgetIfNeeded(budgets []export.Budget, virtualTxns []store.TransactionData) []export.Budget {
	for _, b := range budgets {
		if b.ID == "pet" {
			return budgets
		}
	}
	pet := computePetBudget(virtualTxns)
	if pet == nil {
		return budgets
	}
	return append(budgets, *pet)
}

// runInputJSON reads an existing JSON export, recomputes categorization,
// budget assignment, and normalization from rules, computes budget periods,
// and writes the updated result. Category and budget from the input file are
// not carried forward — the conversion to TransactionData starts with empty
// fields, then transaction-specific rules pre-populate before general rules
// fill the rest. This ensures rule changes take effect on every run.
func runInputJSON(input fileOpts, output fileOpts) error {
	inp, err := export.ReadFile(input.path, input.password)
	if err != nil {
		return fmt.Errorf("reading input: %w", err)
	}
	if inp.Version != 1 {
		return fmt.Errorf("unsupported input version %d (expected 1)", inp.Version)
	}
	log.Printf("read %d transactions, %d rules, %d normalization rules, %d budgets from %s",
		len(inp.Transactions), len(inp.Rules), len(inp.NormalizationRules), len(inp.Budgets), input.path)

	// Split rules into transaction-specific and general
	txnRules, generalExportRules := splitRules(inp.Rules)

	// Convert general export rules to rules.Rule
	ruleSet, err := convertExportRules(generalExportRules)
	if err != nil {
		return err
	}

	// Convert transactions to store.TransactionData for categorization/budget assignment.
	// Skip virtual transactions — they are regenerated fresh each run.
	var allTxns []store.TransactionData
	var txnDocIDs []string
	for _, t := range inp.Transactions {
		if t.Virtual {
			continue
		}
		ts, err := time.Parse(time.RFC3339, t.Timestamp)
		if err != nil {
			return fmt.Errorf("transaction %s: invalid timestamp %q: %w", t.ID, t.Timestamp, err)
		}
		allTxns = append(allTxns, store.TransactionData{
			Institution:   t.Institution,
			Account:       t.Account,
			Description:   t.Description,
			Amount:        int64(math.Round(t.Amount * 100)),
			Timestamp:     ts,
			StatementID:   t.StatementID,
			TransactionID: t.ID,
		})
		txnDocIDs = append(txnDocIDs, t.ID)
	}

	// Apply transaction-specific rules (pre-populate category/budget)
	if err := applyTransactionRules(allTxns, txnDocIDs, txnRules); err != nil {
		return err
	}

	// Apply general categorization (skips transactions assigned by transaction-specific rules)
	if err := rules.ApplyCategorization(allTxns, ruleSet); err != nil {
		return fmt.Errorf("categorization: %w", err)
	}

	// Apply general budget assignment (skips transactions assigned by transaction-specific rules)
	rules.ApplyBudgetAssignment(allTxns, ruleSet)

	// Generate virtual Synchrony spending transactions and statements
	vsr := generateVirtualSynchrony(allTxns, txnDocIDs)
	allTxns = append(allTxns, vsr.transactions...)
	txnDocIDs = append(txnDocIDs, vsr.docIDs...)

	// Apply normalization
	normTxns := buildNormTxns(allTxns, txnDocIDs)
	normMap, err := applyNormToMap(normTxns, convertNormRules(inp.NormalizationRules))
	if err != nil {
		return fmt.Errorf("normalization: %w", err)
	}

	// Build edits map from input transactions
	editsMap := make(map[string]txnEdits, len(inp.Transactions))
	for _, t := range inp.Transactions {
		editsMap[t.ID] = txnEdits{note: t.Note, reimbursement: t.Reimbursement}
	}

	// Rebuild export transactions with categorization, budget, and normalization applied
	exportTxns := buildExportTxns(allTxns, txnDocIDs, normMap, editsMap)
	fullTxns := buildFullTransactions(exportTxns, allTxns)
	budgetPeriods := computeExportPeriodsFromFull(fullTxns)
	weeklyAggregates := computeExportWeeklyAggregatesFromFull(fullTxns)

	// Compute lastTransactionDate on statements from all transactions.
	// Filter out virtual statements from prior runs.
	maxDates := maxTransactionDates(allTxns)
	var updatedStmts []export.Statement
	for _, s := range inp.Statements {
		if s.Virtual {
			continue
		}
		updated := s
		key := accountKey(s.Institution, s.Account)
		if t, ok := maxDates[key]; ok {
			v := export.FormatTimestamp(*t)
			updated.LastTransactionDate = &v
		}
		updatedStmts = append(updatedStmts, updated)
	}
	// Append virtual Synchrony statements
	updatedStmts = append(updatedStmts, vsr.statements...)

	// Append pet budget if virtual Synchrony transactions exist
	budgets := appendPetBudgetIfNeeded(inp.Budgets, vsr.transactions)

	return writeOutputAndLog(output, export.Output{
		Version:            inp.Version,
		ExportedAt:         export.FormatTimestamp(time.Now()),
		GroupID:             inp.GroupID,
		GroupName:           inp.GroupName,
		Transactions:       exportTxns,
		Statements:         updatedStmts,
		Budgets:            budgets,
		BudgetPeriods:      budgetPeriods,
		Rules:              inp.Rules,
		NormalizationRules: inp.NormalizationRules,
		WeeklyAggregates:   weeklyAggregates,
	})
}

func dollarsToOptionalCents(d *float64) *int64 {
	if d == nil {
		return nil
	}
	v := int64(math.Round(*d * 100))
	return &v
}

// splitRules separates transaction-specific rules (with TransactionID) from general rules.
func splitRules(exportRules []export.Rule) (txnRules, general []export.Rule) {
	for _, r := range exportRules {
		if r.TransactionID != "" {
			txnRules = append(txnRules, r)
		} else {
			general = append(general, r)
		}
	}
	return txnRules, general
}

// buildRule converts dollar amounts to cents and validates min/max bounds.
// All other fields are passed through unchanged on the input rule.
func buildRule(r rules.Rule, minAmountDollars, maxAmountDollars *float64) (rules.Rule, error) {
	r.MinAmount = dollarsToOptionalCents(minAmountDollars)
	r.MaxAmount = dollarsToOptionalCents(maxAmountDollars)
	if r.MinAmount != nil && r.MaxAmount != nil && *r.MinAmount > *r.MaxAmount {
		return rules.Rule{}, fmt.Errorf("rule %s: minAmount (%d) > maxAmount (%d)", r.ID, *r.MinAmount, *r.MaxAmount)
	}
	return r, nil
}

// convertRuleDocs converts store.RuleDoc (from Firestore) to rules.Rule.
func convertRuleDocs(docs []store.RuleDoc) ([]rules.Rule, error) {
	ruleSet := make([]rules.Rule, len(docs))
	for i, rd := range docs {
		r, err := buildRule(rules.Rule{
			ID:              rd.ID,
			Type:            rd.Type,
			Pattern:         rd.Pattern,
			Target:          rd.Target,
			Priority:        rd.Priority,
			Institution:     rd.Institution,
			Account:         rd.Account,
			ExcludeCategory: rd.ExcludeCategory,
			MatchCategory:   rd.MatchCategory,
			Category:        rd.Category,
		}, rd.MinAmount, rd.MaxAmount)
		if err != nil {
			return nil, err
		}
		ruleSet[i] = r
	}
	return ruleSet, nil
}

// convertExportRules converts export.Rule to rules.Rule for the rules engine.
func convertExportRules(exportRules []export.Rule) ([]rules.Rule, error) {
	ruleSet := make([]rules.Rule, len(exportRules))
	for i, r := range exportRules {
		built, err := buildRule(rules.Rule{
			ID:              r.ID,
			Type:            r.Type,
			Pattern:         r.Pattern,
			Target:          r.Target,
			Priority:        r.Priority,
			Institution:     r.Institution,
			Account:         r.Account,
			ExcludeCategory: r.ExcludeCategory,
			MatchCategory:   r.MatchCategory,
			Category:        r.Category,
		}, r.MinAmount, r.MaxAmount)
		if err != nil {
			return nil, err
		}
		ruleSet[i] = built
	}
	return ruleSet, nil
}

// applyTransactionRules pre-populates Category/Budget on transactions that have
// matching transaction-specific rules. These rules target a specific transaction
// by doc ID rather than matching by pattern. General rules skip pre-populated
// transactions (existing behavior in ApplyCategorization/ApplyBudgetAssignment).
func applyTransactionRules(txns []store.TransactionData, txnDocIDs []string, txnRules []export.Rule) error {
	if len(txnRules) == 0 {
		return nil
	}
	idIndex := make(map[string]int, len(txnDocIDs))
	for i, id := range txnDocIDs {
		idIndex[id] = i
	}
	for _, r := range txnRules {
		idx, ok := idIndex[r.TransactionID]
		if !ok {
			continue
		}
		switch r.Type {
		case "categorization":
			txns[idx].Category = r.Target
		case "budget_assignment":
			txns[idx].Budget = r.Target
		default:
			return fmt.Errorf("transaction-specific rule %s: unrecognized type %q (expected \"categorization\" or \"budget_assignment\")", r.ID, r.Type)
		}
	}
	return nil
}

// convertNormRules converts export normalization rules to rules engine format.
func convertNormRules(exportRules []export.NormalizationRule) []rules.NormalizationRule {
	out := make([]rules.NormalizationRule, len(exportRules))
	for i, r := range exportRules {
		out[i] = rules.NormalizationRule{
			ID:                   r.ID,
			Pattern:              r.Pattern,
			PatternType:          r.PatternType,
			CanonicalDescription: r.CanonicalDescription,
			DateWindowDays:       r.DateWindowDays,
			Institution:          r.Institution,
			Account:              r.Account,
			Priority:             r.Priority,
		}
	}
	return out
}

// buildNormTxns converts transaction data and doc IDs to normalization input format.
func buildNormTxns(allTxns []store.TransactionData, docIDs []string) []store.NormTxn {
	out := make([]store.NormTxn, len(allTxns))
	for i, t := range allTxns {
		out[i] = store.NormTxn{
			DocID:       docIDs[i],
			Description: t.Description,
			Institution: t.Institution,
			Account:     t.Account,
			Amount:      t.Amount,
			Timestamp:   t.Timestamp,
			StatementID: t.StatementID,
		}
	}
	return out
}

// applyNormToMap applies normalization rules and returns a map keyed by doc ID.
func applyNormToMap(normTxns []store.NormTxn, normRules []rules.NormalizationRule) (map[string]store.NormalizationUpdate, error) {
	normUpdates, err := rules.ApplyNormalization(normTxns, normRules)
	if err != nil {
		return nil, err
	}
	normMap := make(map[string]store.NormalizationUpdate, len(normUpdates))
	for _, u := range normUpdates {
		normMap[u.DocID] = u
	}
	return normMap, nil
}

// txnEdits holds user-editable fields preserved across re-imports.
type txnEdits struct {
	note          string
	reimbursement float64
}

// buildExportTxns converts internal transaction data to export format, applying
// normalization results and user edits.
func buildExportTxns(allTxns []store.TransactionData, docIDs []string, normMap map[string]store.NormalizationUpdate, editsMap map[string]txnEdits) []export.Transaction {
	exportTxns := make([]export.Transaction, len(allTxns))
	for i, txn := range allTxns {
		docID := docIDs[i]
		et := export.Transaction{
			ID:                docID,
			Institution:       txn.Institution,
			Account:           txn.Account,
			Description:       txn.Description,
			Amount:            store.DollarAmount(txn.Amount),
			Timestamp:         export.FormatTimestamp(txn.Timestamp),
			StatementID:       txn.StatementID,
			Category:          txn.Category,
			NormalizedPrimary: true,
			Virtual:           txn.Virtual,
		}
		if txn.Budget != "" {
			b := txn.Budget
			et.Budget = &b
		}
		if edits, ok := editsMap[docID]; ok {
			et.Note = edits.note
			et.Reimbursement = edits.reimbursement
		}
		if nu, ok := normMap[docID]; ok {
			nid := nu.NormalizedID
			et.NormalizedID = &nid
			et.NormalizedPrimary = nu.NormalizedPrimary
			ndesc := nu.NormalizedDescription
			et.NormalizedDescription = &ndesc
		}
		exportTxns[i] = et
	}
	return exportTxns
}

// computeExportPeriodsFromFull builds sorted budget periods from pre-built full transactions.
func computeExportPeriodsFromFull(fullTxns []store.FullTransaction) []export.BudgetPeriod {
	periods := store.ComputePeriods(fullTxns)
	sort.Slice(periods, func(i, j int) bool {
		return periods[i].ID < periods[j].ID
	})
	budgetPeriods := make([]export.BudgetPeriod, len(periods))
	for i, p := range periods {
		budgetPeriods[i] = export.BudgetPeriod{
			ID:                p.ID,
			BudgetID:          p.BudgetID,
			PeriodStart:       export.FormatTimestamp(p.Start),
			PeriodEnd:         export.FormatTimestamp(p.End),
			Total:             p.Total,
			Count:             p.Count,
			CategoryBreakdown: p.CategoryBreakdown,
		}
	}
	return budgetPeriods
}

// buildFullTransactions converts export transactions and internal transaction data
// to store.FullTransaction for aggregation functions.
func buildFullTransactions(exportTxns []export.Transaction, allTxns []store.TransactionData) []store.FullTransaction {
	fullTxns := make([]store.FullTransaction, len(exportTxns))
	for i, et := range exportTxns {
		ft := store.FullTransaction{
			ID:                et.ID,
			Category:          allTxns[i].Category,
			Amount:            store.DollarAmount(allTxns[i].Amount),
			Reimbursement:     et.Reimbursement,
			Timestamp:         allTxns[i].Timestamp,
			NormalizedPrimary: et.NormalizedPrimary,
		}
		if allTxns[i].Budget != "" {
			ft.Budget = allTxns[i].Budget
		}
		if et.NormalizedID != nil {
			ft.NormalizedID = *et.NormalizedID
		}
		fullTxns[i] = ft
	}
	return fullTxns
}

// computeExportWeeklyAggregatesFromFull computes sorted weekly aggregates from pre-built full transactions.
func computeExportWeeklyAggregatesFromFull(fullTxns []store.FullTransaction) []export.WeeklyAggregate {
	aggregates := store.ComputeWeeklyAggregates(fullTxns)
	sort.Slice(aggregates, func(i, j int) bool {
		return aggregates[i].WeekStart.Before(aggregates[j].WeekStart)
	})
	result := make([]export.WeeklyAggregate, len(aggregates))
	for i, a := range aggregates {
		result[i] = export.WeeklyAggregate{
			ID:              a.WeekStart.Format("2006-01-02"),
			WeekStart:       export.FormatTimestamp(a.WeekStart),
			CreditTotal:     a.CreditTotal,
			UnbudgetedTotal: a.UnbudgetedTotal,
		}
	}
	return result
}

// writeOutputAndLog writes the export output to a file and logs a summary.
func writeOutputAndLog(output fileOpts, out export.Output) error {
	if err := export.WriteFile(output.path, out, output.password); err != nil {
		return fmt.Errorf("writing output: %w", err)
	}

	var categorized, budgeted, normalized int
	for _, et := range out.Transactions {
		if et.Category != "" {
			categorized++
		}
		if et.Budget != nil {
			budgeted++
		}
		if et.NormalizedID != nil && !et.NormalizedPrimary {
			normalized++
		}
	}
	log.Printf("wrote %d transactions (%d categorized, %d budgeted, %d non-primary normalized), %d budget periods to %s",
		len(out.Transactions), categorized, budgeted, normalized, len(out.BudgetPeriods), output.path)
	return nil
}

// runMerge combines new transactions from statement files (--dir) with existing
// transactions from an input JSON file (--input). New transactions from statements
// are merged with input by transaction doc ID. User edits (note, reimbursement)
// from input are preserved. Transaction-specific rules pre-populate category/budget,
// then general rules fill in the rest. Normalization rules are applied and budget
// periods are computed for the merged result. The output is written to --output.
func runMerge(input fileOpts, dir, groupName string, output fileOpts) error {
	// Read input JSON
	inp, err := export.ReadFile(input.path, input.password)
	if err != nil {
		return fmt.Errorf("reading input: %w", err)
	}
	if inp.Version != 1 {
		return fmt.Errorf("unsupported input version %d (expected 1)", inp.Version)
	}

	// Resolve group name: flag overrides input file
	if groupName == "" {
		groupName = inp.GroupName
	}
	if groupName == "" {
		return fmt.Errorf("--group is required when input file has no groupName")
	}

	// Parse statements from dir
	files, err := parse.DiscoverFiles(dir)
	if err != nil {
		return fmt.Errorf("discovering files in %s: %w", dir, err)
	}
	log.Printf("discovered %d statement files", len(files))

	type fileResult struct {
		sf     parse.StatementFile
		result parse.ParseResult
		err    error
	}
	ch := make(chan fileResult, len(files))
	for _, sf := range files {
		go func() {
			result, err := parse.ParseFile(sf.Path)
			ch <- fileResult{sf: sf, result: result, err: err}
		}()
	}

	var parsed []parsedFile
	var totalTxns int
	var skipped int
	for range files {
		r := <-ch
		if r.err != nil {
			return r.err
		}
		if r.result.Skipped {
			log.Printf("skipping %s: %s", r.sf.Path, r.result.SkipReason)
			skipped++
			continue
		}
		// Override path-derived period with document-inferred period before any
		// downstream use of sf (StatementID, buildStatementData, etc.).
		if inferred := r.result.InferPeriod(); inferred != "" {
			r.sf.Period = inferred
		} else {
			log.Printf("could not infer period from document data for %s, using path-derived period %q", r.sf.Path, r.sf.Period)
		}
		parsed = append(parsed, parsedFile{sf: r.sf, result: r.result})
		totalTxns += len(r.result.Transactions)
	}
	log.Printf("parsed %d transactions from %d files (%d skipped)", totalTxns, len(parsed), skipped)

	// Build statements from dir-parsed files (maxDates computed later after merge)
	dirStmts := buildStatementData(parsed, nil)
	dirStmts = append(dirStmts, deriveMonthlyStatements(parsed)...)

	// Build input lookup by doc ID
	inputByID := make(map[string]export.Transaction, len(inp.Transactions))
	for _, t := range inp.Transactions {
		inputByID[t.ID] = t
	}

	// Build TransactionData from dir, tracking which input IDs are covered
	dirDocIDs := make(map[string]bool, totalTxns)
	editsMap := make(map[string]txnEdits)

	var allTxns []store.TransactionData
	var allDocIDs []string

	for _, pf := range parsed {
		for _, t := range pf.result.Transactions {
			docID := store.TransactionDocID(pf.sf.StatementID(), t.TransactionID)
			if dirDocIDs[docID] {
				continue // already seen from another file with the same statementId
			}
			dirDocIDs[docID] = true

			td := store.TransactionData{
				Institution:   pf.sf.Institution,
				Account:       pf.sf.Account,
				Description:   t.Description,
				Amount:        t.Amount,
				Timestamp:     t.Date,
				StatementID:   pf.sf.StatementID(),
				TransactionID: t.TransactionID,
			}

			if inputTxn, ok := inputByID[docID]; ok {
				editsMap[docID] = txnEdits{
					note:          inputTxn.Note,
					reimbursement: inputTxn.Reimbursement,
				}
			}

			allTxns = append(allTxns, td)
			allDocIDs = append(allDocIDs, docID)
		}
	}

	// Append input-only transactions (not in dir), skipping virtual transactions
	for _, t := range inp.Transactions {
		if dirDocIDs[t.ID] || t.Virtual {
			continue
		}
		ts, err := time.Parse(time.RFC3339, t.Timestamp)
		if err != nil {
			return fmt.Errorf("transaction %s: invalid timestamp %q: %w", t.ID, t.Timestamp, err)
		}
		allTxns = append(allTxns, store.TransactionData{
			Institution:   t.Institution,
			Account:       t.Account,
			Description:   t.Description,
			Amount:        int64(math.Round(t.Amount * 100)),
			Timestamp:     ts,
			StatementID:   t.StatementID,
			TransactionID: t.ID,
		})
		allDocIDs = append(allDocIDs, t.ID)
		editsMap[t.ID] = txnEdits{
			note:          t.Note,
			reimbursement: t.Reimbursement,
		}
	}

	log.Printf("merged: %d from dir, %d input-only, %d total",
		len(dirDocIDs), len(allTxns)-len(dirDocIDs), len(allTxns))

	// Split rules and apply
	txnRules, generalExportRules := splitRules(inp.Rules)
	ruleSet, err := convertExportRules(generalExportRules)
	if err != nil {
		return err
	}

	if err := applyTransactionRules(allTxns, allDocIDs, txnRules); err != nil {
		return err
	}

	if err := rules.ApplyCategorization(allTxns, ruleSet); err != nil {
		return fmt.Errorf("categorization: %w", err)
	}
	rules.ApplyBudgetAssignment(allTxns, ruleSet)

	// Generate virtual Synchrony spending transactions and statements
	vsr := generateVirtualSynchrony(allTxns, allDocIDs)
	allTxns = append(allTxns, vsr.transactions...)
	allDocIDs = append(allDocIDs, vsr.docIDs...)

	// Apply normalization
	normTxns := buildNormTxns(allTxns, allDocIDs)
	normMap, err := applyNormToMap(normTxns, convertNormRules(inp.NormalizationRules))
	if err != nil {
		return fmt.Errorf("normalization: %w", err)
	}

	// Build export transactions
	exportTxns := buildExportTxns(allTxns, allDocIDs, normMap, editsMap)
	fullTxns := buildFullTransactions(exportTxns, allTxns)
	budgetPeriods := computeExportPeriodsFromFull(fullTxns)
	weeklyAggregates := computeExportWeeklyAggregatesFromFull(fullTxns)

	// Merge statements: dir overrides by statementID, retain input-only
	maxDates := maxTransactionDates(allTxns)
	exportStmts := mergeStatements(dirStmts, inp.Statements, maxDates)
	// Append virtual Synchrony statements
	exportStmts = append(exportStmts, vsr.statements...)

	// Append pet budget if virtual Synchrony transactions exist
	budgets := appendPetBudgetIfNeeded(inp.Budgets, vsr.transactions)

	return writeOutputAndLog(output, export.Output{
		Version:            inp.Version,
		ExportedAt:         export.FormatTimestamp(time.Now()),
		GroupID:             inp.GroupID,
		GroupName:           groupName,
		Transactions:       exportTxns,
		Statements:         exportStmts,
		Budgets:            budgets,
		BudgetPeriods:      budgetPeriods,
		Rules:              inp.Rules,
		NormalizationRules: inp.NormalizationRules,
		WeeklyAggregates:   weeklyAggregates,
	})
}

// mergeStatements merges dir-parsed statements with input statements.
// Dir statements override input by statementID; input-only statements are retained.
// Uses maxDates to set LastTransactionDate on all statements (dir and input-only).
func mergeStatements(dirStmts []store.StatementData, inputStmts []export.Statement, maxDates map[string]*time.Time) []export.Statement {
	for i := range dirStmts {
		key := accountKey(dirStmts[i].Institution, dirStmts[i].Account)
		dirStmts[i].LastTransactionDate = maxDates[key]
	}
	dirExport := buildExportStatements(dirStmts)

	dirByStmtID := make(map[string]bool, len(dirExport))
	for _, s := range dirExport {
		dirByStmtID[s.StatementID] = true
	}

	result := append([]export.Statement{}, dirExport...)
	for _, s := range inputStmts {
		if dirByStmtID[s.StatementID] || s.Virtual {
			continue
		}
		// Update input-only statement's LastTransactionDate from merged transactions
		key := accountKey(s.Institution, s.Account)
		if t, ok := maxDates[key]; ok {
			v := export.FormatTimestamp(*t)
			s.LastTransactionDate = &v
		}
		result = append(result, s)
	}
	return result
}

func runFirestore(ctx context.Context, client *store.Client, groupInfo store.GroupInfo, allTxns []store.TransactionData, allStmts []store.StatementData, allItems []store.StatementItemData, parsed []parsedFile) error {
	// Upsert all transactions
	result, err := client.UpsertTransactions(ctx, groupInfo, allTxns)
	if err != nil {
		return fmt.Errorf("upserting transactions: %w", err)
	}
	log.Printf("upsert: %d created, %d updated across %d statements", result.Created, result.Updated, len(parsed))

	// Upsert statements with group info
	for i := range allStmts {
		allStmts[i].GroupID = groupInfo.ID
		allStmts[i].MemberEmails = groupInfo.MemberEmails
	}
	if err := client.UpsertStatements(ctx, allStmts); err != nil {
		return fmt.Errorf("upserting statements: %w", err)
	}

	// Upsert statement items (immutable bank record) with group info
	for i := range allItems {
		allItems[i].GroupID = groupInfo.ID
		allItems[i].MemberEmails = groupInfo.MemberEmails
	}
	if err := client.UpsertStatementItems(ctx, allItems); err != nil {
		return fmt.Errorf("upserting statement items: %w", err)
	}

	// Apply normalization (auto + rules, post-upsert, pre-recalculation)
	type normRulesResult struct {
		docs []store.NormalizationRuleDoc
		err  error
	}
	normRulesCh := make(chan normRulesResult, 1)
	go func() {
		docs, err := client.LoadNormalizationRules(ctx, groupInfo.ID)
		normRulesCh <- normRulesResult{docs, err}
	}()
	allDocs, err := client.LoadAllTransactions(ctx, groupInfo)
	if err != nil {
		return err
	}
	normRulesRes := <-normRulesCh
	if normRulesRes.err != nil {
		return normRulesRes.err
	}
	normRuleDocs := normRulesRes.docs
	normTxns := make([]store.NormTxn, 0, len(allDocs))
	for _, td := range allDocs {
		desc, ok := td.Data["description"].(string)
		if !ok {
			return fmt.Errorf("transaction %s: field 'description' is not a string (got %T)", td.ID, td.Data["description"])
		}
		inst, ok := td.Data["institution"].(string)
		if !ok {
			return fmt.Errorf("transaction %s: field 'institution' is not a string (got %T)", td.ID, td.Data["institution"])
		}
		acct, ok := td.Data["account"].(string)
		if !ok {
			return fmt.Errorf("transaction %s: field 'account' is not a string (got %T)", td.ID, td.Data["account"])
		}
		amt, ok := td.Data["amount"].(float64)
		if !ok {
			return fmt.Errorf("transaction %s: field 'amount' is not a float64 (got %T)", td.ID, td.Data["amount"])
		}
		ts, ok := td.Data["timestamp"].(time.Time)
		if !ok {
			return fmt.Errorf("transaction %s: field 'timestamp' is not a time.Time (got %T)", td.ID, td.Data["timestamp"])
		}
		stmtID, ok := td.Data["statementId"].(string)
		if !ok {
			return fmt.Errorf("transaction %s: field 'statementId' is not a string (got %T)", td.ID, td.Data["statementId"])
		}
		normTxns = append(normTxns, store.NormTxn{
			DocID:       td.ID,
			Description: desc,
			Institution: inst,
			Account:     acct,
			Amount:      int64(math.Round(amt * 100)),
			Timestamp:   ts,
			StatementID: stmtID,
		})
	}
	normRules := make([]rules.NormalizationRule, len(normRuleDocs))
	for i, rd := range normRuleDocs {
		normRules[i] = rules.NormalizationRule{
			ID:                   rd.ID,
			Pattern:              rd.Pattern,
			PatternType:          rd.PatternType,
			CanonicalDescription: rd.CanonicalDescription,
			DateWindowDays:       rd.DateWindowDays,
			Institution:          rd.Institution,
			Account:              rd.Account,
			Priority:             rd.Priority,
		}
	}
	normUpdates, err := rules.ApplyNormalization(normTxns, normRules)
	if err != nil {
		return fmt.Errorf("normalization: %w", err)
	}
	// Clear stale normalization on transactions that were previously normalized
	// but are no longer part of any normalization group
	updatedDocIDs := make(map[string]bool, len(normUpdates))
	for _, u := range normUpdates {
		updatedDocIDs[u.DocID] = true
	}
	for _, td := range allDocs {
		if updatedDocIDs[td.ID] {
			continue
		}
		if td.Data["normalizedId"] != nil {
			normUpdates = append(normUpdates, store.NormalizationUpdate{
				DocID:                 td.ID,
				NormalizedID:          "",
				NormalizedPrimary:     true, // standalone entry counts toward budget totals
				NormalizedDescription: "",
			})
		}
	}
	if len(normUpdates) > 0 {
		if err := client.UpdateNormalization(ctx, normUpdates); err != nil {
			return fmt.Errorf("updating normalization: %w", err)
		}
	}

	// Build normalization overlay from updates applied above
	normState := make(map[string]store.NormalizationUpdate, len(normUpdates))
	for _, u := range normUpdates {
		normState[u.DocID] = u
	}

	// Compute and upsert weekly aggregates from all transactions
	fullTxnsForAgg := make([]store.FullTransaction, 0, len(allDocs))
	for _, td := range allDocs {
		ft, err := store.FullTransactionFromDoc(td.ID, td.Data)
		if err != nil {
			return err
		}
		// Apply fresh normalization state (allDocs predates UpdateNormalization)
		if nu, ok := normState[ft.ID]; ok {
			ft.NormalizedID = nu.NormalizedID
			ft.NormalizedPrimary = nu.NormalizedPrimary
		}
		fullTxnsForAgg = append(fullTxnsForAgg, ft)
	}
	weeklyAggs := store.ComputeWeeklyAggregates(fullTxnsForAgg)
	if err := client.UpsertWeeklyAggregates(ctx, groupInfo, weeklyAggs); err != nil {
		return fmt.Errorf("upserting weekly aggregates: %w", err)
	}

	// Recalculate affected budget periods
	if len(allTxns) > 0 {
		minTime := allTxns[0].Timestamp
		maxTime := allTxns[0].Timestamp
		for _, txn := range allTxns[1:] {
			if txn.Timestamp.Before(minTime) {
				minTime = txn.Timestamp
			}
			if txn.Timestamp.After(maxTime) {
				maxTime = txn.Timestamp
			}
		}
		if err := client.RecalculatePeriods(ctx, groupInfo, minTime, maxTime); err != nil {
			return fmt.Errorf("recalculating periods: %w", err)
		}
	}

	log.Printf("done")
	return nil
}

func resolveGHEmail() (string, error) {
	cmd := exec.Command("gh", "api", "user/emails", "--jq", `.[] | select(.primary) | .email`)
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("resolving email via gh CLI: %w\nRun: gh auth login && gh auth refresh -s user", err)
	}
	email := strings.TrimSpace(string(out))
	if email == "" {
		return "", fmt.Errorf("gh returned no primary email; run: gh auth refresh -s user")
	}
	return email, nil
}

// readFirebaseRC finds the nearest .firebaserc by walking up from the
// current directory and returns the default project ID.
func readFirebaseRC() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		path := filepath.Join(dir, ".firebaserc")
		data, err := os.ReadFile(path)
		if err == nil {
			var rc struct {
				Projects map[string]string `json:"projects"`
			}
			if err := json.Unmarshal(data, &rc); err != nil {
				return "", fmt.Errorf("parsing %s: %w", path, err)
			}
			if id, ok := rc.Projects["default"]; ok && id != "" {
				return id, nil
			}
			return "", fmt.Errorf("%s has no default project", path)
		}
		if !errors.Is(err, os.ErrNotExist) {
			return "", fmt.Errorf("reading %s: %w", path, err)
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no .firebaserc found")
		}
		dir = parent
	}
}

// accountKey returns a composite map key for an (institution, account) pair.
func accountKey(institution, account string) string {
	return institution + "\x00" + account
}

// buildStatementItemID is the canonical statement-item id: "{institution}_{account}_{fitid}".
// It is stable across statement-file boundaries so the same bank line appearing in multiple
// OFX downloads produces a single statement-item document.
func buildStatementItemID(institution, account, fitid string) string {
	return institution + "_" + account + "_" + fitid
}

// maxTransactionDates computes the latest transaction date per (institution, account)
// from a slice of transactions.
func maxTransactionDates(txns []store.TransactionData) map[string]*time.Time {
	m := make(map[string]*time.Time)
	for _, txn := range txns {
		key := accountKey(txn.Institution, txn.Account)
		if existing, ok := m[key]; !ok || txn.Timestamp.After(*existing) {
			t := txn.Timestamp
			m[key] = &t
		}
	}
	return m
}

// deriveMonthlyStatements generates intermediate monthly balance anchors for
// accounts that have exactly one parsed statement file with a balance snapshot
// but transactions spanning multiple months. For each month boundary between
// the earliest transaction and the balance date, it derives the balance by
// reversing transaction sums from the known balance.
//
// This allows computeNetWorth to track the account's balance over time instead
// of treating it as NULL until the single statement's period.
func deriveMonthlyStatements(parsed []parsedFile) []store.StatementData {
	// Group parsed files by (institution, account)
	type acctKey struct{ inst, acct string }
	byAccount := make(map[acctKey][]parsedFile)
	for _, pf := range parsed {
		k := acctKey{pf.sf.Institution, pf.sf.Account}
		byAccount[k] = append(byAccount[k], pf)
	}

	var derived []store.StatementData
	for k, pfs := range byAccount {
		// Only derive for accounts with exactly one statement file
		if len(pfs) != 1 {
			continue
		}
		pf := pfs[0]
		// Skip accounts with zero balance or missing balance date
		if pf.result.Balance == 0 || pf.result.BalanceDate.IsZero() {
			continue
		}
		if len(pf.result.Transactions) == 0 {
			continue
		}

		// Find earliest transaction date
		earliest := pf.result.Transactions[0].Date
		for _, t := range pf.result.Transactions[1:] {
			if t.Date.Before(earliest) {
				earliest = t.Date
			}
		}

		// Compute month boundaries: first of each month from earliest through balance date
		balDate := pf.result.BalanceDate
		firstMonth := time.Date(earliest.Year(), earliest.Month(), 1, 0, 0, 0, 0, time.UTC)
		balMonth := time.Date(balDate.Year(), balDate.Month(), 1, 0, 0, 0, 0, time.UTC)

		// Need at least 2 distinct months to generate intermediate statements
		if !firstMonth.Before(balMonth) {
			continue
		}

		// For each month boundary (first of month), derive the balance by computing
		// the sum of all transactions on or after that boundary, then:
		//   derived_balance = known_balance + txn_sum_from_boundary_onward
		// This reverses the effect of those transactions to get the earlier balance.
		//
		// Skip the balance date's own month — the original statement already covers it.
		beforeLen := len(derived)
		for m := firstMonth; m.Before(balMonth); m = m.AddDate(0, 1, 0) {
			// Sum all transactions with date >= boundary (first of this month)
			var txnSum int64
			for _, t := range pf.result.Transactions {
				if !t.Date.Before(m) {
					txnSum += t.Amount
				}
			}

			// Addition is correct: txnSum is positive for spending that reduced the balance, so adding it back recovers the earlier (higher) balance.
			derivedBalance := pf.result.Balance + txnSum

			period := m.Format("2006-01")
			lastDay := m.AddDate(0, 1, -1)
			bd := lastDay

			stmtID := k.inst + "-" + k.acct + "-" + period

			derived = append(derived, store.StatementData{
				StatementID: stmtID,
				Institution: k.inst,
				Account:     k.acct,
				Balance:     derivedBalance,
				Period:      period,
				BalanceDate: &bd,
			})
		}
		if count := len(derived) - beforeLen; count > 0 {
			log.Printf("derived %d intermediate balance anchors for %s/%s", count, k.inst, k.acct)
		}
	}
	return derived
}

// buildStatementData converts parsed files to store.StatementData.
func buildStatementData(parsed []parsedFile, maxDates map[string]*time.Time) []store.StatementData {
	out := make([]store.StatementData, len(parsed))
	for i, pf := range parsed {
		key := accountKey(pf.sf.Institution, pf.sf.Account)
		var balanceDate *time.Time
		if !pf.result.BalanceDate.IsZero() {
			bd := pf.result.BalanceDate
			balanceDate = &bd
		}
		out[i] = store.StatementData{
			StatementID:         pf.sf.StatementID(),
			Institution:         pf.sf.Institution,
			Account:             pf.sf.Account,
			Balance:             pf.result.Balance,
			Period:              pf.sf.Period,
			BalanceDate:         balanceDate,
			LastTransactionDate: maxDates[key],
		}
	}
	return out
}

// buildExportStatements converts store.StatementData to export.Statement.
func buildExportStatements(stmts []store.StatementData) []export.Statement {
	out := make([]export.Statement, len(stmts))
	for i, s := range stmts {
		balanceDate := ""
		if s.BalanceDate != nil {
			balanceDate = s.BalanceDate.Format("2006-01-02")
		}
		var ltd *string
		if s.LastTransactionDate != nil {
			v := export.FormatTimestamp(*s.LastTransactionDate)
			ltd = &v
		}
		out[i] = export.Statement{
			ID:                  store.StatementDocID(s.StatementID),
			StatementID:         s.StatementID,
			Institution:         s.Institution,
			Account:             s.Account,
			Balance:             store.DollarAmount(s.Balance),
			Period:              s.Period,
			BalanceDate:         balanceDate,
			LastTransactionDate: ltd,
		}
	}
	return out
}

func printSummary(parsed []parsedFile, totalTxns, skipped int) {
	fmt.Println("\n=== Dry Run Summary ===")
	fmt.Printf("Total transactions: %d\n", totalTxns)
	fmt.Printf("Statement files:   %d\n", len(parsed))
	fmt.Printf("Skipped files:     %d\n\n", skipped)

	for _, pf := range parsed {
		balStr := ""
		if pf.result.Balance != 0 {
			balStr = fmt.Sprintf("  balance: $%.2f", store.DollarAmount(pf.result.Balance))
		}
		fmt.Printf("  %-40s %4d transactions%s\n", pf.sf.StatementID(), len(pf.result.Transactions), balStr)
	}
}
