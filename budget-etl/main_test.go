package main

import (
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
			{Description: "Coffee Shop", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "categorization", Target: "Food:Coffee", TransactionID: "doc-1"},
		}

		applyTransactionRules(txns, docIDs, txnRules)

		if txns[0].Category != "Food:Coffee" {
			t.Errorf("Category: got %q, want %q", txns[0].Category, "Food:Coffee")
		}
	})

	t.Run("budget_assignment rule pre-populates Budget", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Rent Payment", Amount: 150000, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "budget_assignment", Target: "budget-housing", TransactionID: "doc-1"},
		}

		applyTransactionRules(txns, docIDs, txnRules)

		if txns[0].Budget != "budget-housing" {
			t.Errorf("Budget: got %q, want %q", txns[0].Budget, "budget-housing")
		}
	})

	t.Run("non-existent transaction IDs are ignored", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Coffee Shop", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "categorization", Target: "Food:Coffee", TransactionID: "doc-nonexistent"},
		}

		applyTransactionRules(txns, docIDs, txnRules)

		if txns[0].Category != "" {
			t.Errorf("Category should be empty for non-matching rule, got %q", txns[0].Category)
		}
	})

	t.Run("multiple rules for same transaction", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Coffee Shop", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}
		txnRules := []export.Rule{
			{ID: "r1", Type: "categorization", Target: "Food:Coffee", TransactionID: "doc-1"},
			{ID: "r2", Type: "budget_assignment", Target: "budget-food", TransactionID: "doc-1"},
		}

		applyTransactionRules(txns, docIDs, txnRules)

		if txns[0].Category != "Food:Coffee" {
			t.Errorf("Category: got %q, want %q", txns[0].Category, "Food:Coffee")
		}
		if txns[0].Budget != "budget-food" {
			t.Errorf("Budget: got %q, want %q", txns[0].Budget, "budget-food")
		}
	})

	t.Run("empty txnRules is a no-op", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Coffee Shop", Amount: 500, Timestamp: ts, TransactionID: "t1"},
		}
		docIDs := []string{"doc-1"}

		applyTransactionRules(txns, docIDs, nil)

		if txns[0].Category != "" || txns[0].Budget != "" {
			t.Errorf("expected empty Category/Budget with nil rules, got %q / %q", txns[0].Category, txns[0].Budget)
		}
	})
}

func TestApplyTransactionRulesSkippedByGeneral(t *testing.T) {
	ts := time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)

	// Two transactions: one with transaction-specific rules, one without.
	txns := []store.TransactionData{
		{
			Description:   "Coffee Shop",
			Amount:        500,
			Timestamp:     ts,
			Institution:   "chase",
			Account:       "checking",
			StatementID:   "stmt-1",
			TransactionID: "t1",
		},
		{
			Description:   "Another Coffee Shop",
			Amount:        600,
			Timestamp:     ts,
			Institution:   "chase",
			Account:       "checking",
			StatementID:   "stmt-1",
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
	applyTransactionRules(txns, docIDs, txnSpecificRules)

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
