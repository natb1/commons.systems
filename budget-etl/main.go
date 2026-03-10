package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/natb1/commons.systems/budget-etl/internal/parse"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func main() {
	dir := flag.String("dir", "", "Path to statement directory (required)")
	group := flag.String("group", "", "Group name to upload transactions for (required)")
	env := flag.String("env", "prod", "Firestore environment namespace")
	dryRun := flag.Bool("dry-run", false, "Parse and print summary without writing to Firestore")
	projectID := flag.String("project", "", "Firebase project ID (default: inferred from environment)")

	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: budget-etl --dir <path> --group <name> [--env <env>] [--dry-run]")
		flag.PrintDefaults()
	}
	flag.Parse()

	if *dir == "" || *group == "" {
		flag.Usage()
		os.Exit(1)
	}

	if err := run(*dir, *group, *env, *projectID, *dryRun); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

type parsedFile struct {
	sf     parse.StatementFile
	result parse.ParseResult
}

func run(dir, groupName, env, projectID string, dryRun bool) error {
	// Resolve user email from gh CLI
	email, err := resolveGHEmail()
	if err != nil {
		return err
	}
	log.Printf("authenticated as %s", email)

	// Discover statement files
	files, err := parse.DiscoverFiles(dir)
	if err != nil {
		return fmt.Errorf("discovering files in %s: %w", dir, err)
	}
	log.Printf("discovered %d statement files", len(files))

	// Parse all files
	var parsed []parsedFile
	var totalTxns int
	var skipped int

	for _, sf := range files {
		result, err := parse.ParseFile(sf)
		if err != nil {
			return fmt.Errorf("parsing %s: %w", sf.Path, err)
		}
		if result.Skipped {
			log.Printf("skipping %s: %s", sf.Path, result.SkipReason)
			skipped++
			continue
		}
		parsed = append(parsed, parsedFile{sf: sf, result: result})
		totalTxns += len(result.Transactions)
	}

	log.Printf("parsed %d transactions from %d files (%d skipped)", totalTxns, len(parsed), skipped)

	if dryRun {
		printSummary(parsed, totalTxns, skipped)
		return nil
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

	// Lookup group
	groupInfo, err := client.LookupGroup(ctx, email, groupName)
	if err != nil {
		return err
	}
	log.Printf("group %q (id=%s, members=%v)", groupName, groupInfo.ID, groupInfo.MemberEmails)

	// Upsert transactions
	var totalCreated, totalUpdated int
	for _, pf := range parsed {
		txnData := make([]store.TransactionData, len(pf.result.Transactions))
		for i, t := range pf.result.Transactions {
			txnData[i] = store.TransactionData{
				Institution:   pf.sf.Institution,
				Account:       pf.sf.Account,
				Description:   t.Description,
				Amount:        t.Amount,
				Memo:          t.Memo,
				Timestamp:     t.Date,
				StatementID:   pf.sf.StatementID(),
				TransactionID: t.TransactionID,
			}
		}
		result, err := client.UpsertTransactions(ctx, groupInfo, txnData)
		if err != nil {
			return fmt.Errorf("upserting %s: %w", pf.sf.StatementID(), err)
		}
		totalCreated += result.Created
		totalUpdated += result.Updated
	}

	log.Printf("done: %d created, %d updated across %d statements", totalCreated, totalUpdated, len(parsed))
	return nil
}

func resolveGHEmail() (string, error) {
	// Try gh api user/emails (requires "user" scope)
	cmd := exec.Command("gh", "api", "user/emails", "--jq", `.[] | select(.primary) | .email`)
	out, err := cmd.Output()
	if err == nil {
		email := strings.TrimSpace(string(out))
		if email != "" {
			return email, nil
		}
	}

	// Fallback: git config user.email
	cmd = exec.Command("git", "config", "user.email")
	out, err = cmd.Output()
	if err == nil {
		email := strings.TrimSpace(string(out))
		if email != "" {
			return email, nil
		}
	}

	return "", fmt.Errorf("could not resolve email; configure git (git config user.email) or grant gh the user scope (gh auth refresh -s user)")
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
