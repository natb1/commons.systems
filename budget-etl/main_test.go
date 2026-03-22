package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/rules"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func TestSplitRules(t *testing.T) {
	input := []export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "coffee", Target: "Food:Coffee", TransactionID: ""},
		{ID: "r2", Type: "categorization", Pattern: "", Target: "Groceries", TransactionID: "txn-abc"},
		{ID: "r3", Type: "budget_assignment", Pattern: "rent", Target: "budget-housing", TransactionID: ""},
		{ID: "r4", Type: "budget_assignment", Pattern: "", Target: "budget-food", TransactionID: "txn-def"},
	}

	txnRules, general := splitRules(input)

	if len(txnRules) != 2 {
		t.Fatalf("expected 2 transaction-specific rules, got %d", len(txnRules))
	}
	if len(general) != 2 {
		t.Fatalf("expected 2 general rules, got %d", len(general))
	}

	// Verify transaction-specific rules
	if txnRules[0].ID != "r2" {
		t.Errorf("expected txnRules[0].ID = %q, got %q", "r2", txnRules[0].ID)
	}
	if txnRules[1].ID != "r4" {
		t.Errorf("expected txnRules[1].ID = %q, got %q", "r4", txnRules[1].ID)
	}

	// Verify general rules
	if general[0].ID != "r1" {
		t.Errorf("expected general[0].ID = %q, got %q", "r1", general[0].ID)
	}
	if general[1].ID != "r3" {
		t.Errorf("expected general[1].ID = %q, got %q", "r3", general[1].ID)
	}
}

func TestSplitRulesEmpty(t *testing.T) {
	txnRules, general := splitRules(nil)
	if txnRules != nil {
		t.Errorf("expected nil txnRules for nil input, got %v", txnRules)
	}
	if general != nil {
		t.Errorf("expected nil general for nil input, got %v", general)
	}
}

func TestConvertExportRules(t *testing.T) {
	input := []export.Rule{
		{
			ID:          "r1",
			Type:        "categorization",
			Pattern:     "coffee",
			Target:      "Food:Coffee",
			Priority:    10,
			Institution: "chase",
			Account:     "checking",
		},
		{
			ID:       "r2",
			Type:     "budget_assignment",
			Pattern:  "rent",
			Target:   "budget-housing",
			Priority: 5,
		},
	}

	result := convertExportRules(input)

	if len(result) != 2 {
		t.Fatalf("expected 2 rules, got %d", len(result))
	}

	// Verify all fields mapped correctly for first rule
	r := result[0]
	if r.ID != "r1" {
		t.Errorf("ID: got %q, want %q", r.ID, "r1")
	}
	if r.Type != "categorization" {
		t.Errorf("Type: got %q, want %q", r.Type, "categorization")
	}
	if r.Pattern != "coffee" {
		t.Errorf("Pattern: got %q, want %q", r.Pattern, "coffee")
	}
	if r.Target != "Food:Coffee" {
		t.Errorf("Target: got %q, want %q", r.Target, "Food:Coffee")
	}
	if r.Priority != 10 {
		t.Errorf("Priority: got %d, want %d", r.Priority, 10)
	}
	if r.Institution != "chase" {
		t.Errorf("Institution: got %q, want %q", r.Institution, "chase")
	}
	if r.Account != "checking" {
		t.Errorf("Account: got %q, want %q", r.Account, "checking")
	}

	// Verify second rule
	r2 := result[1]
	if r2.ID != "r2" {
		t.Errorf("second rule ID: got %q, want %q", r2.ID, "r2")
	}
	if r2.Institution != "" {
		t.Errorf("second rule Institution: got %q, want empty", r2.Institution)
	}
	if r2.Account != "" {
		t.Errorf("second rule Account: got %q, want empty", r2.Account)
	}
}

func TestConvertExportRulesEmpty(t *testing.T) {
	result := convertExportRules(nil)
	if len(result) != 0 {
		t.Errorf("expected empty result for nil input, got %d", len(result))
	}
}

func TestApplyTransactionRules(t *testing.T) {
	ts := time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)

	t.Run("categorization rule pre-populates Category", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Test Item A", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "categorization", Target: "Food:Coffee", TransactionID: "doc-1"},
		}

		if err := applyTransactionRules(txns, docIDs, txnRules); err != nil {
			t.Fatalf("applyTransactionRules: %v", err)
		}

		if txns[0].Category != "Food:Coffee" {
			t.Errorf("Category: got %q, want %q", txns[0].Category, "Food:Coffee")
		}
	})

	t.Run("budget_assignment rule pre-populates Budget", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Test Item B", Amount: 150000, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "budget_assignment", Target: "budget-housing", TransactionID: "doc-1"},
		}

		if err := applyTransactionRules(txns, docIDs, txnRules); err != nil {
			t.Fatalf("applyTransactionRules: %v", err)
		}

		if txns[0].Budget != "budget-housing" {
			t.Errorf("Budget: got %q, want %q", txns[0].Budget, "budget-housing")
		}
	})

	t.Run("non-existent transaction IDs are ignored", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Test Item C", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "categorization", Target: "Food:Coffee", TransactionID: "doc-nonexistent"},
		}

		if err := applyTransactionRules(txns, docIDs, txnRules); err != nil {
			t.Fatalf("applyTransactionRules: %v", err)
		}

		if txns[0].Category != "" {
			t.Errorf("Category should be empty for non-matching rule, got %q", txns[0].Category)
		}
	})

	t.Run("multiple rules for same transaction", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Test Item D", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "categorization", Target: "Food:Coffee", TransactionID: "doc-1"},
			{ID: "r2", Type: "budget_assignment", Target: "budget-food", TransactionID: "doc-1"},
		}

		if err := applyTransactionRules(txns, docIDs, txnRules); err != nil {
			t.Fatalf("applyTransactionRules: %v", err)
		}

		if txns[0].Category != "Food:Coffee" {
			t.Errorf("Category: got %q, want %q", txns[0].Category, "Food:Coffee")
		}
		if txns[0].Budget != "budget-food" {
			t.Errorf("Budget: got %q, want %q", txns[0].Budget, "budget-food")
		}
	})

	t.Run("empty txnRules is a no-op", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Test Item E", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}

		if err := applyTransactionRules(txns, docIDs, nil); err != nil {
			t.Fatalf("applyTransactionRules: %v", err)
		}

		if txns[0].Category != "" || txns[0].Budget != "" {
			t.Errorf("expected empty Category/Budget with nil rules, got %q / %q", txns[0].Category, txns[0].Budget)
		}
	})

	t.Run("unrecognized rule type returns error", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Test Item F", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "invalid_type", Target: "something", TransactionID: "doc-1"},
		}

		err := applyTransactionRules(txns, docIDs, txnRules)
		if err == nil {
			t.Fatal("expected error for unrecognized rule type")
		}
	})
}

func TestApplyTransactionRulesSkippedByGeneral(t *testing.T) {
	ts := time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)

	// Two transactions: one with transaction-specific rules, one without.
	txns := []store.TransactionData{
		{
			Description:   "test coffee purchase",
			Amount:        500,
			Timestamp:     ts,
			Institution:   "test_bank",
			Account:       "1234",
			StatementID:   "test_bank-1234-2025-01",
			TransactionID: "t1",
		},
		{
			Description:   "another test coffee purchase",
			Amount:        600,
			Timestamp:     ts,
			Institution:   "test_bank",
			Account:       "1234",
			StatementID:   "test_bank-1234-2025-01",
			TransactionID: "t2",
		},
	}
	docIDs := []string{"doc-1", "doc-2"}

	// Transaction-specific rules for doc-1 only
	txnSpecificRules := []export.Rule{
		{ID: "r-txn-cat", Type: "categorization", Target: "Food:SpecialCoffee", TransactionID: "doc-1"},
		{ID: "r-txn-bud", Type: "budget_assignment", Target: "budget-special", TransactionID: "doc-1"},
	}

	// General rules that match both transactions by pattern
	generalRules := []rules.Rule{
		{ID: "r-gen-cat", Type: "categorization", Pattern: "coffee", Target: "Food:GenericCoffee", Priority: 1},
		{ID: "r-gen-bud", Type: "budget_assignment", Pattern: "coffee", Target: "budget-generic", Priority: 1},
	}

	// Step 1: Apply transaction-specific rules
	if err := applyTransactionRules(txns, docIDs, txnSpecificRules); err != nil {
		t.Fatalf("applyTransactionRules: %v", err)
	}

	// Verify transaction-specific values applied to doc-1
	if txns[0].Category != "Food:SpecialCoffee" {
		t.Fatalf("after txn rules, txns[0].Category = %q, want %q", txns[0].Category, "Food:SpecialCoffee")
	}
	if txns[0].Budget != "budget-special" {
		t.Fatalf("after txn rules, txns[0].Budget = %q, want %q", txns[0].Budget, "budget-special")
	}

	// Step 2: Apply general categorization (should skip doc-1, categorize doc-2)
	if err := rules.ApplyCategorization(txns, generalRules); err != nil {
		t.Fatalf("ApplyCategorization: %v", err)
	}

	// Step 3: Apply general budget assignment (should skip doc-1, assign doc-2)
	rules.ApplyBudgetAssignment(txns, generalRules)

	// Verify doc-1 kept transaction-specific values (not overwritten by general rules)
	if txns[0].Category != "Food:SpecialCoffee" {
		t.Errorf("txns[0].Category overwritten by general rules: got %q, want %q", txns[0].Category, "Food:SpecialCoffee")
	}
	if txns[0].Budget != "budget-special" {
		t.Errorf("txns[0].Budget overwritten by general rules: got %q, want %q", txns[0].Budget, "budget-special")
	}

	// Verify doc-2 was categorized/budgeted by general rules
	if txns[1].Category != "Food:GenericCoffee" {
		t.Errorf("txns[1].Category: got %q, want %q", txns[1].Category, "Food:GenericCoffee")
	}
	if txns[1].Budget != "budget-generic" {
		t.Errorf("txns[1].Budget: got %q, want %q", txns[1].Budget, "budget-generic")
	}
}

// writeCSVFixture writes a minimal bank statement CSV file to path.
// Each entry is [date, amount, description, "", txnID, type].
func writeCSVFixture(t *testing.T, path string, rows [][6]string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatalf("creating fixture dir: %v", err)
	}
	var lines []string
	lines = append(lines, "0000000000,2025/01/01,2025/01/31,100.00,50.00")
	for _, r := range rows {
		lines = append(lines, strings.Join(r[:], ","))
	}
	if err := os.WriteFile(path, []byte(strings.Join(lines, "\n")+"\n"), 0644); err != nil {
		t.Fatalf("writing fixture: %v", err)
	}
}

func TestRunMerge(t *testing.T) {
	tmp := t.TempDir()

	// Create a statement dir: test_bank/1234/2025-01/stmt.csv
	// Two transactions: txn-A (5.00 debit) and txn-B (12.50 debit)
	csvPath := filepath.Join(tmp, "statements", "test_bank", "1234", "2025-01", "stmt.csv")
	writeCSVFixture(t, csvPath, [][6]string{
		{"2025/01/10", "5.00", "TEST PURCHASE ALPHA", "", "TXN-A", "DEBIT"},
		{"2025/01/15", "12.50", "TEST PURCHASE BETA", "", "TXN-B", "DEBIT"},
	})

	// Compute expected doc IDs for the dir transactions
	docA := store.TransactionDocID("test_bank-1234-2025-01", "TXN-A")
	docB := store.TransactionDocID("test_bank-1234-2025-01", "TXN-B")

	// Create an input JSON with:
	// - txn docA with a user note (overlaps with dir)
	// - txn "input-only-1" (not in dir, retained)
	// - A categorization rule matching "TEST PURCHASE" and a transaction-specific rule for docA
	// - A budget assignment rule and budget definition
	inputJSON := export.Output{
		Version:   1,
		GroupName: "test-group",
		Transactions: []export.Transaction{
			{
				ID:                docA,
				Institution:       "test_bank",
				Account:           "1234",
				Description:       "TEST PURCHASE ALPHA",
				Amount:            5.00,
				Timestamp:         "2025-01-10T00:00:00Z",
				StatementID:       "test_bank-1234-2025-01",
				Category:          "Old:Category",
				Note:              "user note on alpha",
				Reimbursement:     50,
				NormalizedPrimary: true,
			},
			{
				ID:                "input-only-1",
				Institution:       "other_bank",
				Account:           "5678",
				Description:       "TEST INPUT ONLY",
				Amount:            20.00,
				Timestamp:         "2025-01-20T00:00:00Z",
				StatementID:       "other_bank-5678-2025-01",
				Category:          "Old:InputOnly",
				NormalizedPrimary: true,
			},
		},
		Rules: []export.Rule{
			{ID: "cat-test", Type: "categorization", Pattern: "TEST PURCHASE", Target: "Test:General", Priority: 10},
			{ID: "cat-test-input", Type: "categorization", Pattern: "TEST INPUT", Target: "Test:InputOnly", Priority: 10},
			{ID: "txn-cat-a", Type: "categorization", Target: "Test:OverrideAlpha", TransactionID: docA},
			{ID: "bud-test", Type: "budget_assignment", Pattern: "TEST", Target: "test-budget", Priority: 10},
		},
		Budgets: []export.Budget{
			{ID: "test-budget", Name: "Test Budget", WeeklyAllowance: 100},
		},
		NormalizationRules: []export.NormalizationRule{},
	}

	inputPath := filepath.Join(tmp, "input.json")
	if err := export.WriteFile(inputPath, inputJSON, ""); err != nil {
		t.Fatalf("writing input JSON: %v", err)
	}

	outputPath := filepath.Join(tmp, "output.json")
	statementsDir := filepath.Join(tmp, "statements")

	if err := runMerge(fileOpts{path: inputPath}, statementsDir, "", fileOpts{path: outputPath}); err != nil {
		t.Fatalf("runMerge: %v", err)
	}

	// Read and verify output
	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("reading output: %v", err)
	}
	var out export.Output
	if err := json.Unmarshal(data, &out); err != nil {
		t.Fatalf("parsing output: %v", err)
	}

	// Should have 3 transactions: docA, docB from dir + input-only-1
	if len(out.Transactions) != 3 {
		t.Fatalf("expected 3 transactions, got %d", len(out.Transactions))
	}

	txnByID := make(map[string]export.Transaction)
	for _, txn := range out.Transactions {
		txnByID[txn.ID] = txn
	}

	// docA: transaction-specific rule overrides category, user edits preserved
	txnA := txnByID[docA]
	if txnA.Category != "Test:OverrideAlpha" {
		t.Errorf("docA category: got %q, want %q", txnA.Category, "Test:OverrideAlpha")
	}
	if txnA.Note != "user note on alpha" {
		t.Errorf("docA note: got %q, want %q", txnA.Note, "user note on alpha")
	}
	if txnA.Reimbursement != 50 {
		t.Errorf("docA reimbursement: got %v, want 50", txnA.Reimbursement)
	}
	// Amount comes from dir (cents -> dollars): 500 cents = 5.00
	if txnA.Amount != 5.00 {
		t.Errorf("docA amount: got %v, want 5.00", txnA.Amount)
	}

	// docB: new from dir, general rule assigns category/budget
	txnB := txnByID[docB]
	if txnB.Category != "Test:General" {
		t.Errorf("docB category: got %q, want %q", txnB.Category, "Test:General")
	}
	if txnB.Budget == nil || *txnB.Budget != "test-budget" {
		t.Errorf("docB budget: got %v, want test-budget", txnB.Budget)
	}

	// input-only-1: retained from input, general rule re-categorizes
	txnInput := txnByID["input-only-1"]
	if txnInput.ID == "" {
		t.Fatal("input-only-1 missing from output")
	}
	if txnInput.Category != "Test:InputOnly" {
		t.Errorf("input-only category: got %q, want %q", txnInput.Category, "Test:InputOnly")
	}
	if txnInput.StatementID != "other_bank-5678-2025-01" {
		t.Errorf("input-only statementId: got %q, want preserved", txnInput.StatementID)
	}

	// Group name: resolved from input file (no --group flag passed)
	if out.GroupName != "test-group" {
		t.Errorf("groupName: got %q, want %q", out.GroupName, "test-group")
	}

	// Budget periods should exist (at least one, since we have budgeted transactions)
	if len(out.BudgetPeriods) == 0 {
		t.Error("expected at least one budget period")
	}

	// Rules preserved in output (including transaction-specific)
	if len(out.Rules) != 4 {
		t.Errorf("expected 4 rules in output, got %d", len(out.Rules))
	}

	// Statements: one from dir (test_bank-1234-2025-01) with balance from CSV metadata
	if len(out.Statements) != 1 {
		t.Fatalf("expected 1 statement, got %d", len(out.Statements))
	}
	stmt := out.Statements[0]
	if stmt.StatementID != "test_bank-1234-2025-01" {
		t.Errorf("statement.statementId = %q, want %q", stmt.StatementID, "test_bank-1234-2025-01")
	}
	if stmt.Balance != 50.00 {
		t.Errorf("statement.balance = %v, want 50.00", stmt.Balance)
	}
	if stmt.Institution != "test_bank" {
		t.Errorf("statement.institution = %q, want %q", stmt.Institution, "test_bank")
	}
	if stmt.Period != "2025-01" {
		t.Errorf("statement.period = %q, want %q", stmt.Period, "2025-01")
	}
}

func TestRunMergeGroupNameOverride(t *testing.T) {
	tmp := t.TempDir()

	// Minimal statement dir with one transaction
	csvPath := filepath.Join(tmp, "statements", "test_bank", "1234", "2025-01", "stmt.csv")
	writeCSVFixture(t, csvPath, [][6]string{
		{"2025/01/10", "5.00", "TEST ITEM", "", "TXN-X", "DEBIT"},
	})

	docX := store.TransactionDocID("test_bank-1234-2025-01", "TXN-X")
	inputJSON := export.Output{
		Version:   1,
		GroupName: "original-group",
		Transactions: []export.Transaction{
			{
				ID:                docX,
				Institution:       "test_bank",
				Account:           "1234",
				Description:       "TEST ITEM",
				Amount:            5.00,
				Timestamp:         "2025-01-10T00:00:00Z",
				StatementID:       "test_bank-1234-2025-01",
				NormalizedPrimary: true,
			},
		},
		Rules: []export.Rule{
			{ID: "cat-test", Type: "categorization", Pattern: "TEST", Target: "Test:Cat", Priority: 1},
		},
		NormalizationRules: []export.NormalizationRule{},
	}

	inputPath := filepath.Join(tmp, "input.json")
	if err := export.WriteFile(inputPath, inputJSON, ""); err != nil {
		t.Fatalf("writing input: %v", err)
	}

	outputPath := filepath.Join(tmp, "output.json")
	if err := runMerge(fileOpts{path: inputPath}, filepath.Join(tmp, "statements"), "override-group", fileOpts{path: outputPath}); err != nil {
		t.Fatalf("runMerge: %v", err)
	}

	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("reading output: %v", err)
	}
	var out export.Output
	if err := json.Unmarshal(data, &out); err != nil {
		t.Fatalf("parsing output: %v", err)
	}

	if out.GroupName != "override-group" {
		t.Errorf("groupName: got %q, want %q", out.GroupName, "override-group")
	}
}
