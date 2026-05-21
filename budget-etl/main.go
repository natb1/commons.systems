package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/parse"
	"github.com/natb1/commons.systems/budget-etl/internal/password"
	"github.com/natb1/commons.systems/budget-etl/internal/rules"
)

func main() {
	dir := flag.String("dir", "", "Path to statement directory")
	group := flag.String("group", "", "Group name to upload transactions for")
	outputPath := flag.String("output", "", "Write JSON file")
	inputPath := flag.String("input", "", "Read rules/budgets/transactions from existing JSON file")
	keychainFlag := flag.String("keychain", "", "macOS Keychain account name for encrypt/decrypt password")
	plaintextFlag := flag.Bool("plaintext", false, "skip password prompt and write plaintext JSON output (cannot be combined with --keychain or BUDGET_ETL_PASSWORD)")
	reportPath := flag.String("report", "", "Write JSON inspection report instead of merging. Requires --allow-uncategorized; --output is ignored.")
	allowUncategorized := flag.Bool("allow-uncategorized", false, "Allow report mode to emit uncategorized transactions as data instead of erroring. Use only with --report.")
	institution := flag.String("institution", "", "Institution name for flat directory layout (requires --account)")
	account := flag.String("account", "", "Account name for flat directory layout (requires --institution)")

	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: budget-etl [--dir <path>] --group <name> --output <path> [--input <path>] [--keychain <name>] [--plaintext] [--report <path> --allow-uncategorized]")
		fmt.Fprintln(os.Stderr, "  "+password.UsageNote)
		fmt.Fprintln(os.Stderr, "  --plaintext skips password resolution entirely and writes unencrypted JSON; it cannot be combined with --keychain or "+password.EnvVar+".")
		flag.PrintDefaults()
	}
	flag.Parse()

	if *reportPath != "" && !*allowUncategorized {
		fmt.Fprintln(os.Stderr, "Error: --report requires --allow-uncategorized")
		os.Exit(1)
	}
	if *allowUncategorized && *reportPath == "" {
		fmt.Fprintln(os.Stderr, "Error: --allow-uncategorized requires --report")
		os.Exit(1)
	}
	if *reportPath != "" && *inputPath == "" {
		fmt.Fprintln(os.Stderr, "Error: --report requires --input")
		os.Exit(1)
	}
	if *reportPath != "" && *dir == "" {
		fmt.Fprintln(os.Stderr, "Error: --report requires --dir")
		os.Exit(1)
	}

	if *inputPath != "" && *outputPath == "" && *reportPath == "" {
		fmt.Fprintln(os.Stderr, "Error: --input requires --output")
		os.Exit(1)
	}

	if (*institution != "") != (*account != "") {
		fmt.Fprintln(os.Stderr, "Error: --institution and --account must be set together")
		os.Exit(1)
	}
	disc := parse.DiscoverOpts{Institution: *institution, Account: *account}

	var pw string
	if *plaintextFlag {
		if *keychainFlag != "" {
			fmt.Fprintln(os.Stderr, "Error: --plaintext cannot be combined with --keychain")
			os.Exit(1)
		}
		if _, ok := os.LookupEnv(password.EnvVar); ok {
			fmt.Fprintf(os.Stderr, "Error: --plaintext cannot be combined with %s being set in the environment; unset it to write plaintext output\n", password.EnvVar)
			os.Exit(1)
		}
	} else {
		resolved, err := password.Resolve(*keychainFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		pw = resolved
	}

	if *reportPath != "" {
		if err := runReport(fileOpts{path: *inputPath, password: pw}, *dir, disc, *reportPath); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	if *inputPath != "" && *dir != "" {
		if err := runMerge(fileOpts{path: *inputPath, password: pw}, *dir, *group, disc, fileOpts{path: *outputPath, password: pw}); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}
	if *inputPath != "" {
		if err := runInputJSON(fileOpts{path: *inputPath, password: pw}, fileOpts{path: *outputPath, password: pw}); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	if *dir == "" || *group == "" {
		flag.Usage()
		os.Exit(1)
	}
	if *outputPath == "" {
		fmt.Fprintln(os.Stderr, "Error: --output is required")
		os.Exit(1)
	}

	if err := runDirJSON(*dir, *group, disc, fileOpts{path: *outputPath, password: pw}); err != nil {
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

// runDirJSON discovers and parses statement files from dir, dedups transactions
// by doc ID, and writes a JSON budget file with no rules applied. Use --input
// to apply rules in a subsequent pass.
func runDirJSON(dir, groupName string, disc parse.DiscoverOpts, output fileOpts) error {
	parsed, totalTxns, _, err := parseStatementDir(dir, disc)
	if err != nil {
		return err
	}

	// Build all TransactionData and StatementData across all files.
	// Dedup by doc ID: overlapping statement files (same statementId) can
	// produce duplicate transactions with the same OFX FITID.
	allTxns, _ := buildTransactions(parsed, totalTxns, nil)
	maxDates := maxTransactionDates(allTxns)
	allStmts := buildStatementData(parsed, maxDates)
	allStmts = append(allStmts, deriveMonthlyStatements(parsed)...)

	return runOutputJSON(allTxns, allStmts, groupName, output)
}

// runOutputJSON writes parsed transactions and statements as a JSON file
// without applying rules. Category, budget, and normalization fields are
// left empty. Use --input to apply rules in a subsequent pass.
func runOutputJSON(allTxns []budget.TransactionData, allStmts []budget.StatementData, groupName string, output fileOpts) error {
	exportTxns := make([]export.Transaction, len(allTxns))
	for i, txn := range allTxns {
		exportTxns[i] = export.Transaction{
			ID:                budget.TransactionDocID(txn.StatementID, txn.TransactionID),
			Institution:       txn.Institution,
			Account:           txn.Account,
			Description:       txn.Description,
			Amount:            budget.DollarAmount(txn.Amount),
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
	transactions []budget.TransactionData
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
	allTxns []budget.TransactionData,
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
		result.transactions = append(result.transactions, budget.TransactionData{
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
			ID:          budget.StatementDocID(stmtID),
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
func computePetBudget(virtualTxns []budget.TransactionData) *export.Budget {
	if len(virtualTxns) == 0 {
		return nil
	}
	var total float64
	var earliest, latest time.Time
	for _, txn := range virtualTxns {
		total += budget.DollarAmount(txn.Amount)
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
		Allowance:       math.Round(monthlyAvg*100) / 100,
		AllowancePeriod: "monthly",
		Rollover:        "none",
	}
}

// appendPetBudgetIfNeeded adds a pet budget to the list if virtual Synchrony
// transactions exist and the budget is not already present.
func appendPetBudgetIfNeeded(budgets []export.Budget, virtualTxns []budget.TransactionData) []export.Budget {
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

	// Convert transactions to budget.TransactionData for categorization/budget assignment.
	// Skip virtual transactions — they are regenerated fresh each run.
	var allTxns []budget.TransactionData
	var txnDocIDs []string
	for _, t := range inp.Transactions {
		if t.Virtual {
			continue
		}
		ts, err := time.Parse(time.RFC3339, t.Timestamp)
		if err != nil {
			return fmt.Errorf("transaction %s: invalid timestamp %q: %w", t.ID, t.Timestamp, err)
		}
		allTxns = append(allTxns, budget.TransactionData{
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
	if uncategorized := rules.ApplyCategorization(allTxns, ruleSet); len(uncategorized) > 0 {
		return fmt.Errorf("categorization: %w", formatUncategorizedError(uncategorized))
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
		GroupID:            inp.GroupID,
		GroupName:          inp.GroupName,
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
func applyTransactionRules(txns []budget.TransactionData, txnDocIDs []string, txnRules []export.Rule) error {
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
func buildNormTxns(allTxns []budget.TransactionData, docIDs []string) []budget.NormTxn {
	out := make([]budget.NormTxn, len(allTxns))
	for i, t := range allTxns {
		out[i] = budget.NormTxn{
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
func applyNormToMap(normTxns []budget.NormTxn, normRules []rules.NormalizationRule) (map[string]budget.NormalizationUpdate, error) {
	normUpdates, err := rules.ApplyNormalization(normTxns, normRules)
	if err != nil {
		return nil, err
	}
	normMap := make(map[string]budget.NormalizationUpdate, len(normUpdates))
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
func buildExportTxns(allTxns []budget.TransactionData, docIDs []string, normMap map[string]budget.NormalizationUpdate, editsMap map[string]txnEdits) []export.Transaction {
	exportTxns := make([]export.Transaction, len(allTxns))
	for i, txn := range allTxns {
		docID := docIDs[i]
		et := export.Transaction{
			ID:                docID,
			Institution:       txn.Institution,
			Account:           txn.Account,
			Description:       txn.Description,
			Amount:            budget.DollarAmount(txn.Amount),
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
func computeExportPeriodsFromFull(fullTxns []budget.FullTransaction) []export.BudgetPeriod {
	periods := budget.ComputePeriods(fullTxns)
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
// to budget.FullTransaction for aggregation functions.
func buildFullTransactions(exportTxns []export.Transaction, allTxns []budget.TransactionData) []budget.FullTransaction {
	fullTxns := make([]budget.FullTransaction, len(exportTxns))
	for i, et := range exportTxns {
		ft := budget.FullTransaction{
			ID:                et.ID,
			Category:          allTxns[i].Category,
			Amount:            budget.DollarAmount(allTxns[i].Amount),
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
func computeExportWeeklyAggregatesFromFull(fullTxns []budget.FullTransaction) []export.WeeklyAggregate {
	aggregates := budget.ComputeWeeklyAggregates(fullTxns)
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

// formatUncategorizedError formats UncategorizedRecord entries into the standard
// error message: "{N} uncategorized transactions:\n  {stmtID}/{txnID}: "{desc}"..."
func formatUncategorizedError(records []rules.UncategorizedRecord) error {
	msgs := make([]string, len(records))
	for i, r := range records {
		msgs[i] = fmt.Sprintf("%s/%s: %q", r.StatementID, r.TransactionID, r.Description)
	}
	return fmt.Errorf("%d uncategorized transactions:\n  %s",
		len(records), strings.Join(msgs, "\n  "))
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

type UncategorizedTxn struct {
	Institution string  `json:"institution"`
	Account     string  `json:"account"`
	StatementID string  `json:"statement_id"`
	FITID       string  `json:"fitid"`
	DocID       string  `json:"doc_id"`
	Date        string  `json:"date"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

type NewStatement struct {
	Institution string    `json:"institution"`
	Account     string    `json:"account"`
	Period      string    `json:"period"`
	TxnCount    int       `json:"txn_count"`
	DateRange   [2]string `json:"date_range"`
	Balance     float64   `json:"balance"`
}

type NewTransactionEntry struct {
	Institution string  `json:"institution"`
	Account     string  `json:"account"`
	StatementID string  `json:"statement_id"`
	FITID       string  `json:"fitid"`
	DocID       string  `json:"doc_id"`
	Date        string  `json:"date"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Budget      string  `json:"budget,omitempty"`
}

type StatementSummary struct {
	NewStatements   []NewStatement        `json:"new_statements"`
	NewTransactions []NewTransactionEntry `json:"new_transactions"`
}

// parseAndClassify discovers and parses statement files in dir, then identifies
// transactions not already present in input. It applies rules to classify the
// new transactions, collecting (rather than erroring on) uncategorized ones.
// Returns the parsed files, uncategorized transaction details, a summary of new
// statements and transactions, and any fatal error.
func parseAndClassify(input *export.Output, dir string, disc parse.DiscoverOpts) (
	parsed []parsedFile,
	uncategorized []UncategorizedTxn,
	summary StatementSummary,
	err error,
) {
	files, ferr := parse.Discover(dir, disc)
	if ferr != nil {
		err = fmt.Errorf("discovering files in %s: %w", dir, ferr)
		return
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
			result, perr := parse.ParseFile(sf.Path)
			ch <- fileResult{sf: sf, result: result, err: perr}
		}()
	}

	var skipped int
	for range files {
		r := <-ch
		if r.err != nil {
			err = r.err
			return
		}
		if r.result.Skipped {
			log.Printf("skipping %s: %s", r.sf.Path, r.result.SkipReason)
			skipped++
			continue
		}
		if inferred := r.result.InferPeriod(); inferred != "" {
			r.sf.Period = inferred
		} else {
			log.Printf("could not infer period from document data for %s, using path-derived period %q", r.sf.Path, r.sf.Period)
		}
		parsed = append(parsed, parsedFile{sf: r.sf, result: r.result})
	}
	log.Printf("parsed files: %d usable, %d skipped", len(parsed), skipped)

	// Build set of doc IDs already in input
	inputIDs := make(map[string]bool, len(input.Transactions))
	for _, t := range input.Transactions {
		inputIDs[t.ID] = true
	}

	// Build new (dir-only) transactions, deduplicating within dir
	dirSeen := make(map[string]bool)
	var newTxns []budget.TransactionData
	var newDocIDs []string

	for _, pf := range parsed {
		for _, t := range pf.result.Transactions {
			docID := budget.TransactionDocID(pf.sf.StatementID(), t.TransactionID)
			if dirSeen[docID] || inputIDs[docID] {
				continue
			}
			dirSeen[docID] = true
			newTxns = append(newTxns, budget.TransactionData{
				Institution:   pf.sf.Institution,
				Account:       pf.sf.Account,
				Description:   t.Description,
				Amount:        t.Amount,
				Timestamp:     t.Date,
				StatementID:   pf.sf.StatementID(),
				TransactionID: t.TransactionID,
			})
			newDocIDs = append(newDocIDs, docID)
		}
	}

	// Apply rules to new transactions
	txnRules, generalExportRules := splitRules(input.Rules)
	ruleSet, rerr := convertExportRules(generalExportRules)
	if rerr != nil {
		err = rerr
		return
	}
	if aerr := applyTransactionRules(newTxns, newDocIDs, txnRules); aerr != nil {
		err = aerr
		return
	}
	uncatRecords := rules.ApplyCategorization(newTxns, ruleSet)
	rules.ApplyBudgetAssignment(newTxns, ruleSet)

	// Build UncategorizedTxn list
	for _, rec := range uncatRecords {
		txn := newTxns[rec.Index]
		uncategorized = append(uncategorized, UncategorizedTxn{
			Institution: txn.Institution,
			Account:     txn.Account,
			StatementID: txn.StatementID,
			FITID:       txn.TransactionID,
			DocID:       newDocIDs[rec.Index],
			Date:        txn.Timestamp.Format("2006-01-02"),
			Amount:      budget.DollarAmount(txn.Amount),
			Description: txn.Description,
		})
	}

	// Build NewStatements summary
	for _, pf := range parsed {
		var first, last string
		for _, t := range pf.result.Transactions {
			d := t.Date.Format("2006-01-02")
			if first == "" || d < first {
				first = d
			}
			if last == "" || d > last {
				last = d
			}
		}
		summary.NewStatements = append(summary.NewStatements, NewStatement{
			Institution: pf.sf.Institution,
			Account:     pf.sf.Account,
			Period:      pf.sf.Period,
			TxnCount:    len(pf.result.Transactions),
			DateRange:   [2]string{first, last},
			Balance:     budget.DollarAmount(pf.result.Balance),
		})
	}

	// Build NewTransactions summary
	for i, txn := range newTxns {
		entry := NewTransactionEntry{
			Institution: txn.Institution,
			Account:     txn.Account,
			StatementID: txn.StatementID,
			FITID:       txn.TransactionID,
			DocID:       newDocIDs[i],
			Date:        txn.Timestamp.Format("2006-01-02"),
			Amount:      budget.DollarAmount(txn.Amount),
			Description: txn.Description,
			Category:    txn.Category,
			Budget:      txn.Budget,
		}
		summary.NewTransactions = append(summary.NewTransactions, entry)
	}

	return
}

// runReport parses statement files, classifies new transactions against input rules,
// and writes a JSON inspection report. It exits 0 even when uncategorized transactions
// exist — the caller decides how to handle them. The encrypted output write is skipped;
// only the report file is written.
func runReport(input fileOpts, dir string, disc parse.DiscoverOpts, reportPath string) error {
	inp, err := export.ReadFile(input.path, input.password)
	if err != nil {
		return fmt.Errorf("reading input: %w", err)
	}
	if inp.Version != 1 {
		return fmt.Errorf("unsupported input version %d (expected 1)", inp.Version)
	}

	_, uncategorized, summary, err := parseAndClassify(&inp, dir, disc)
	if err != nil {
		return err
	}

	report := struct {
		NewStatements   []NewStatement        `json:"new_statements"`
		Uncategorized   []UncategorizedTxn    `json:"uncategorized"`
		NewTransactions []NewTransactionEntry `json:"new_transactions"`
	}{
		NewStatements:   summary.NewStatements,
		Uncategorized:   uncategorized,
		NewTransactions: summary.NewTransactions,
	}

	// Ensure nil slices marshal as [] not null
	if report.NewStatements == nil {
		report.NewStatements = []NewStatement{}
	}
	if report.Uncategorized == nil {
		report.Uncategorized = []UncategorizedTxn{}
	}
	if report.NewTransactions == nil {
		report.NewTransactions = []NewTransactionEntry{}
	}

	b, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling report: %w", err)
	}
	b = append(b, '\n')

	rdir := filepath.Dir(reportPath)
	tmp, err := os.CreateTemp(rdir, ".budget-etl-report-*.json")
	if err != nil {
		return fmt.Errorf("creating temp file: %w", err)
	}
	tmpPath := tmp.Name()
	if _, err := tmp.Write(b); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("writing temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("closing temp file: %w", err)
	}
	if err := os.Rename(tmpPath, reportPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("renaming temp file: %w", err)
	}

	log.Printf("wrote report: %d new statements, %d uncategorized, %d new transactions to %s",
		len(summary.NewStatements), len(uncategorized), len(summary.NewTransactions), reportPath)
	return nil
}

// runMerge combines new transactions from statement files (--dir) with existing
// transactions from an input JSON file (--input). New transactions from statements
// are merged with input by transaction doc ID. User edits (note, reimbursement)
// from input are preserved. Transaction-specific rules pre-populate category/budget,
// then general rules fill in the rest. Normalization rules are applied and budget
// periods are computed for the merged result. The output is written to --output.
func runMerge(input fileOpts, dir, groupName string, disc parse.DiscoverOpts, output fileOpts) error {
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

	// Parse and classify new (dir-only) transactions
	parsed, uncatTxns, _, err := parseAndClassify(&inp, dir, disc)
	if err != nil {
		return err
	}
	if len(uncatTxns) > 0 {
		recs := make([]rules.UncategorizedRecord, len(uncatTxns))
		for i, u := range uncatTxns {
			recs[i] = rules.UncategorizedRecord{
				StatementID:   u.StatementID,
				TransactionID: u.FITID,
				Description:   u.Description,
			}
		}
		return fmt.Errorf("categorization: %w", formatUncategorizedError(recs))
	}

	// Build statements from dir-parsed files (maxDates computed later after merge)
	dirStmts := buildStatementData(parsed, nil)
	dirStmts = append(dirStmts, deriveMonthlyStatements(parsed)...)

	// Build input lookup by doc ID
	inputByID := make(map[string]export.Transaction, len(inp.Transactions))
	for _, t := range inp.Transactions {
		inputByID[t.ID] = t
	}

	// Build TransactionData from dir, tracking which input IDs are covered.
	// parseAndClassify does not return a transaction count, so pass 0 — the
	// only cost is losing the pre-allocation capacity hint.
	editsMap := make(map[string]txnEdits)
	allTxns, allDocIDs := buildTransactions(parsed, 0, func(td *budget.TransactionData, docID string, sf parse.StatementFile, t parse.Transaction) {
		if inputTxn, ok := inputByID[docID]; ok {
			editsMap[docID] = txnEdits{
				note:          inputTxn.Note,
				reimbursement: inputTxn.Reimbursement,
			}
		}
	})
	dirDocIDs := make(map[string]bool, len(allDocIDs))
	for _, id := range allDocIDs {
		dirDocIDs[id] = true
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
		allTxns = append(allTxns, budget.TransactionData{
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

	// Split rules and apply to merged set (input txns start with empty Category/Budget
	// so rules re-apply to honor any rule changes).
	txnRules, generalExportRules := splitRules(inp.Rules)
	ruleSet, err := convertExportRules(generalExportRules)
	if err != nil {
		return err
	}

	if err := applyTransactionRules(allTxns, allDocIDs, txnRules); err != nil {
		return err
	}

	if uncategorized := rules.ApplyCategorization(allTxns, ruleSet); len(uncategorized) > 0 {
		return fmt.Errorf("categorization: %w", formatUncategorizedError(uncategorized))
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
		GroupID:            inp.GroupID,
		GroupName:          groupName,
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
func mergeStatements(dirStmts []budget.StatementData, inputStmts []export.Statement, maxDates map[string]*time.Time) []export.Statement {
	for i := range dirStmts {
		key := accountKey(dirStmts[i].Institution, dirStmts[i].Account)
		dirStmts[i].LastTransactionDate = maxDates[key]
	}
	dirExport := buildExportStatements(dirStmts)

	dirByStmtID := make(map[string]bool, len(dirExport))
	for _, s := range dirExport {
		dirByStmtID[s.StatementID] = true
	}

	result := dirExport
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

// accountKey returns a composite map key for an (institution, account) pair.
func accountKey(institution, account string) string {
	return institution + "\x00" + account
}

// maxTransactionDates computes the latest transaction date per (institution, account)
// from a slice of transactions.
func maxTransactionDates(txns []budget.TransactionData) map[string]*time.Time {
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
func deriveMonthlyStatements(parsed []parsedFile) []budget.StatementData {
	// Group parsed files by (institution, account)
	type acctKey struct{ inst, acct string }
	byAccount := make(map[acctKey][]parsedFile)
	for _, pf := range parsed {
		k := acctKey{pf.sf.Institution, pf.sf.Account}
		byAccount[k] = append(byAccount[k], pf)
	}

	var derived []budget.StatementData
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

			derived = append(derived, budget.StatementData{
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

// buildStatementData converts parsed files to budget.StatementData.
func buildStatementData(parsed []parsedFile, maxDates map[string]*time.Time) []budget.StatementData {
	out := make([]budget.StatementData, len(parsed))
	for i, pf := range parsed {
		key := accountKey(pf.sf.Institution, pf.sf.Account)
		var balanceDate *time.Time
		if !pf.result.BalanceDate.IsZero() {
			bd := pf.result.BalanceDate
			balanceDate = &bd
		}
		out[i] = budget.StatementData{
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

// buildExportStatements converts budget.StatementData to export.Statement.
func buildExportStatements(stmts []budget.StatementData) []export.Statement {
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
			ID:                  budget.StatementDocID(s.StatementID),
			StatementID:         s.StatementID,
			Institution:         s.Institution,
			Account:             s.Account,
			Balance:             budget.DollarAmount(s.Balance),
			Period:              s.Period,
			BalanceDate:         balanceDate,
			LastTransactionDate: ltd,
		}
	}
	return out
}
