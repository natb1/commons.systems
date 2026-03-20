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
	keychainFlag := flag.String("keychain", "", "Keychain account name for encrypt/decrypt password")

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
		parsed = append(parsed, parsedFile{sf: r.sf, result: r.result})
		totalTxns += len(r.result.Transactions)
	}

	log.Printf("parsed %d transactions from %d files (%d skipped)", totalTxns, len(parsed), skipped)

	// Build all TransactionData and StatementData across all files
	allTxns := make([]store.TransactionData, 0, totalTxns)
	for _, pf := range parsed {
		for _, t := range pf.result.Transactions {
			allTxns = append(allTxns, store.TransactionData{
				Institution:   pf.sf.Institution,
				Account:       pf.sf.Account,
				Description:   t.Description,
				Amount:        t.Amount,
				Timestamp:     t.Date,
				StatementID:   pf.sf.StatementID(),
				TransactionID: t.TransactionID,
			})
		}
	}
	allStmts := buildStatementData(parsed)

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

	// Load rules from Firestore
	ruleDocs, err := client.LoadRules(ctx, groupInfo.ID)
	if err != nil {
		return err
	}
	ruleSet := make([]rules.Rule, len(ruleDocs))
	for i, rd := range ruleDocs {
		ruleSet[i] = rules.Rule{
			ID:          rd.ID,
			Type:        rd.Type,
			Pattern:     rd.Pattern,
			Target:      rd.Target,
			Priority:    rd.Priority,
			Institution: rd.Institution,
			Account:     rd.Account,
		}
	}

	// Apply categorization rules (error if <100% coverage)
	if err := rules.ApplyCategorization(allTxns, ruleSet); err != nil {
		return fmt.Errorf("categorization: %w", err)
	}

	// Apply budget assignment rules
	rules.ApplyBudgetAssignment(allTxns, ruleSet)

	return runFirestore(ctx, client, groupInfo, allTxns, allStmts, parsed)
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
	}

	if err := export.WriteFile(output.path, out, output.password); err != nil {
		return fmt.Errorf("writing output file: %w", err)
	}
	log.Printf("wrote %d transactions, %d statements to %s", len(exportTxns), len(exportStmts), output.path)
	return nil
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
	ruleSet := convertExportRules(generalExportRules)

	// Convert transactions to store.TransactionData for categorization/budget assignment
	allTxns := make([]store.TransactionData, len(inp.Transactions))
	txnDocIDs := make([]string, len(inp.Transactions))
	for i, t := range inp.Transactions {
		ts, err := time.Parse(time.RFC3339, t.Timestamp)
		if err != nil {
			return fmt.Errorf("transaction %s: invalid timestamp %q: %w", t.ID, t.Timestamp, err)
		}
		allTxns[i] = store.TransactionData{
			Institution:   t.Institution,
			Account:       t.Account,
			Description:   t.Description,
			Amount:        int64(math.Round(t.Amount * 100)),
			Timestamp:     ts,
			StatementID:   t.StatementID,
			TransactionID: t.ID,
		}
		txnDocIDs[i] = t.ID
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
	budgetPeriods := computeExportPeriods(exportTxns, allTxns)

	return writeOutputAndLog(output, export.Output{
		Version:            inp.Version,
		ExportedAt:         export.FormatTimestamp(time.Now()),
		GroupID:             inp.GroupID,
		GroupName:           inp.GroupName,
		Transactions:       exportTxns,
		Statements:         inp.Statements,
		Budgets:            inp.Budgets,
		BudgetPeriods:      budgetPeriods,
		Rules:              inp.Rules,
		NormalizationRules: inp.NormalizationRules,
	})
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

// convertExportRules converts export.Rule to rules.Rule for the rules engine.
func convertExportRules(exportRules []export.Rule) []rules.Rule {
	ruleSet := make([]rules.Rule, len(exportRules))
	for i, r := range exportRules {
		ruleSet[i] = rules.Rule{
			ID:          r.ID,
			Type:        r.Type,
			Pattern:     r.Pattern,
			Target:      r.Target,
			Priority:    r.Priority,
			Institution: r.Institution,
			Account:     r.Account,
		}
	}
	return ruleSet
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

// computeExportPeriods builds budget periods from export transactions and internal
// transaction data. Returns sorted budget periods.
func computeExportPeriods(exportTxns []export.Transaction, allTxns []store.TransactionData) []export.BudgetPeriod {
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
		parsed = append(parsed, parsedFile{sf: r.sf, result: r.result})
		totalTxns += len(r.result.Transactions)
	}
	log.Printf("parsed %d transactions from %d files (%d skipped)", totalTxns, len(parsed), skipped)

	// Build statements from dir-parsed files
	dirStmts := buildStatementData(parsed)

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

	// Append input-only transactions (not in dir)
	for _, t := range inp.Transactions {
		if dirDocIDs[t.ID] {
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
	ruleSet := convertExportRules(generalExportRules)

	if err := applyTransactionRules(allTxns, allDocIDs, txnRules); err != nil {
		return err
	}

	if err := rules.ApplyCategorization(allTxns, ruleSet); err != nil {
		return fmt.Errorf("categorization: %w", err)
	}
	rules.ApplyBudgetAssignment(allTxns, ruleSet)

	// Apply normalization
	normTxns := buildNormTxns(allTxns, allDocIDs)
	normMap, err := applyNormToMap(normTxns, convertNormRules(inp.NormalizationRules))
	if err != nil {
		return fmt.Errorf("normalization: %w", err)
	}

	// Build export transactions
	exportTxns := buildExportTxns(allTxns, allDocIDs, normMap, editsMap)
	budgetPeriods := computeExportPeriods(exportTxns, allTxns)

	// Merge statements: dir overrides by statementID, retain input-only
	exportStmts := mergeStatements(dirStmts, inp.Statements)

	return writeOutputAndLog(output, export.Output{
		Version:            inp.Version,
		ExportedAt:         export.FormatTimestamp(time.Now()),
		GroupID:             inp.GroupID,
		GroupName:           groupName,
		Transactions:       exportTxns,
		Statements:         exportStmts,
		Budgets:            inp.Budgets,
		BudgetPeriods:      budgetPeriods,
		Rules:              inp.Rules,
		NormalizationRules: inp.NormalizationRules,
	})
}

// mergeStatements merges dir-parsed statements with input statements.
// Dir statements override input by statementID; input-only statements are retained.
func mergeStatements(dirStmts []store.StatementData, inputStmts []export.Statement) []export.Statement {
	dirExport := buildExportStatements(dirStmts)

	dirByStmtID := make(map[string]bool, len(dirExport))
	for _, s := range dirExport {
		dirByStmtID[s.StatementID] = true
	}

	result := append([]export.Statement{}, dirExport...)
	for _, s := range inputStmts {
		if !dirByStmtID[s.StatementID] {
			result = append(result, s)
		}
	}
	return result
}

func runFirestore(ctx context.Context, client *store.Client, groupInfo store.GroupInfo, allTxns []store.TransactionData, allStmts []store.StatementData, parsed []parsedFile) error {
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

// buildStatementData converts parsed files to store.StatementData.
func buildStatementData(parsed []parsedFile) []store.StatementData {
	out := make([]store.StatementData, len(parsed))
	for i, pf := range parsed {
		out[i] = store.StatementData{
			StatementID: pf.sf.StatementID(),
			Institution: pf.sf.Institution,
			Account:     pf.sf.Account,
			Balance:     pf.result.Balance,
			Period:      pf.sf.Period,
		}
	}
	return out
}

// buildExportStatements converts store.StatementData to export.Statement.
func buildExportStatements(stmts []store.StatementData) []export.Statement {
	out := make([]export.Statement, len(stmts))
	for i, s := range stmts {
		out[i] = export.Statement{
			ID:          store.StatementDocID(s.StatementID),
			StatementID: s.StatementID,
			Institution: s.Institution,
			Account:     s.Account,
			Balance:     store.DollarAmount(s.Balance),
			Period:      s.Period,
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
