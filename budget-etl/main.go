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
	"strings"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/parse"
	"github.com/natb1/commons.systems/budget-etl/internal/rules"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func main() {
	dir := flag.String("dir", "", "Path to statement directory (required)")
	group := flag.String("group", "", "Group name to upload transactions for (required)")
	env := flag.String("env", "prod", "Firestore environment namespace")
	dryRun := flag.Bool("dry-run", false, "Parse and print summary without writing to Firestore")
	projectID := flag.String("project", "", "Firebase project ID (default: inferred from environment)")
	outputPath := flag.String("output", "", "Write JSON file instead of Firestore")
	firestoreFlag := flag.Bool("firestore", false, "Write to Firestore (required when --output is not set)")

	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: budget-etl --dir <path> --group <name> [--output <path> | --firestore] [--env <env>] [--dry-run]")
		flag.PrintDefaults()
	}
	flag.Parse()

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

	if err := run(*dir, *group, *env, *projectID, *dryRun, *outputPath, *firestoreFlag); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

type parsedFile struct {
	sf     parse.StatementFile
	result parse.ParseResult
}

func run(dir, groupName, env, projectID string, dryRun bool, outputPath string, firestoreMode bool) error {
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

	// Build all TransactionData across all files
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

	if dryRun {
		printSummary(parsed, totalTxns, skipped)
		return nil
	}

	if outputPath != "" {
		return runOutputJSON(allTxns, groupName, outputPath)
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

	return runFirestore(ctx, client, groupInfo, allTxns, parsed)
}

func runOutputJSON(allTxns []store.TransactionData, groupName string, outputPath string) error {
	// Build export transactions (no categorization, no normalization, no budgets)
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

	out := export.Output{
		Version:            1,
		ExportedAt:         export.FormatTimestamp(time.Now()),
		GroupName:          groupName,
		Transactions:       exportTxns,
		Budgets:            []export.Budget{},
		BudgetPeriods:      []export.BudgetPeriod{},
		Rules:              []export.Rule{},
		NormalizationRules: []export.NormalizationRule{},
	}

	if err := export.WriteFile(outputPath, out); err != nil {
		return fmt.Errorf("writing output file: %w", err)
	}
	log.Printf("wrote %d transactions to %s", len(exportTxns), outputPath)
	return nil
}

func runFirestore(ctx context.Context, client *store.Client, groupInfo store.GroupInfo, allTxns []store.TransactionData, parsed []parsedFile) error {
	// Upsert all transactions
	result, err := client.UpsertTransactions(ctx, groupInfo, allTxns)
	if err != nil {
		return fmt.Errorf("upserting transactions: %w", err)
	}
	log.Printf("upsert: %d created, %d updated across %d statements", result.Created, result.Updated, len(parsed))

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

func printSummary(parsed []parsedFile, totalTxns, skipped int) {
	fmt.Println("\n=== Dry Run Summary ===")
	fmt.Printf("Total transactions: %d\n", totalTxns)
	fmt.Printf("Statement files:   %d\n", len(parsed))
	fmt.Printf("Skipped files:     %d\n\n", skipped)

	for _, pf := range parsed {
		fmt.Printf("  %-40s %4d transactions\n", pf.sf.StatementID(), len(pf.result.Transactions))
	}
}
