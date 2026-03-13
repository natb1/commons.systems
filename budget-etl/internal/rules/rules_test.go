package rules

import (
	"testing"

	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func TestMatch(t *testing.T) {
	tests := []struct {
		name        string
		rule        Rule
		desc        string
		institution string
		account     string
		want        bool
	}{
		{
			name: "case-insensitive substring match",
			rule: Rule{Pattern: "coffee"},
			desc: "STARBUCKS COFFEE #1234", institution: "PNC", account: "Checking",
			want: true,
		},
		{
			name: "no match",
			rule: Rule{Pattern: "pizza"},
			desc: "STARBUCKS COFFEE #1234", institution: "PNC", account: "Checking",
			want: false,
		},
		{
			name: "institution filter matches",
			rule: Rule{Pattern: "coffee", Institution: "PNC"},
			desc: "STARBUCKS COFFEE", institution: "PNC", account: "Checking",
			want: true,
		},
		{
			name: "institution filter rejects",
			rule: Rule{Pattern: "coffee", Institution: "Chase"},
			desc: "STARBUCKS COFFEE", institution: "PNC", account: "Checking",
			want: false,
		},
		{
			name: "account filter matches",
			rule: Rule{Pattern: "coffee", Account: "checking"},
			desc: "STARBUCKS COFFEE", institution: "PNC", account: "Checking",
			want: true,
		},
		{
			name: "account filter rejects",
			rule: Rule{Pattern: "coffee", Account: "Savings"},
			desc: "STARBUCKS COFFEE", institution: "PNC", account: "Checking",
			want: false,
		},
		{
			name: "both filters match",
			rule: Rule{Pattern: "coffee", Institution: "pnc", Account: "checking"},
			desc: "STARBUCKS COFFEE", institution: "PNC", account: "Checking",
			want: true,
		},
		{
			name: "empty pattern matches everything",
			rule: Rule{Pattern: ""},
			desc: "anything", institution: "any", account: "any",
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.rule.Match(tt.desc, tt.institution, tt.account)
			if got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestApplyCategorization(t *testing.T) {
	rules := []Rule{
		{Type: "categorization", Pattern: "starbucks", Target: "Food:Coffee", Priority: 10},
		{Type: "categorization", Pattern: "coffee", Target: "Food:Coffee", Priority: 20},
		{Type: "categorization", Pattern: "electric", Target: "Housing:Utilities", Priority: 10},
		{Type: "budget_assignment", Pattern: "starbucks", Target: "food", Priority: 10}, // should be ignored
	}

	t.Run("priority ordering first-match-wins", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "STARBUCKS COFFEE #1234", StatementID: "s1", TransactionID: "t1"},
			{Description: "Electric Company", StatementID: "s1", TransactionID: "t2"},
		}
		err := ApplyCategorization(txns, rules)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if txns[0].Category != "Food:Coffee" {
			t.Errorf("txn[0].Category = %q, want Food:Coffee", txns[0].Category)
		}
		if txns[1].Category != "Housing:Utilities" {
			t.Errorf("txn[1].Category = %q, want Housing:Utilities", txns[1].Category)
		}
	})

	t.Run("error for uncategorized transactions", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "STARBUCKS", StatementID: "s1", TransactionID: "t1"},
			{Description: "UNKNOWN MERCHANT", StatementID: "s1", TransactionID: "t2"},
		}
		err := ApplyCategorization(txns, rules)
		if err == nil {
			t.Fatal("expected error for uncategorized transaction")
		}
		if txns[0].Category != "Food:Coffee" {
			t.Errorf("matched txn should still be categorized: %q", txns[0].Category)
		}
	})

	t.Run("skips already-categorized transactions", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "STARBUCKS", Category: "Manual:Override", StatementID: "s1", TransactionID: "t1"},
		}
		err := ApplyCategorization(txns, rules)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if txns[0].Category != "Manual:Override" {
			t.Errorf("should preserve existing category: got %q", txns[0].Category)
		}
	})

	t.Run("100% coverage no error", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "Starbucks #5", StatementID: "s1", TransactionID: "t1"},
		}
		err := ApplyCategorization(txns, rules)
		if err != nil {
			t.Errorf("expected nil error for full coverage, got: %v", err)
		}
	})
}

func TestApplyBudgetAssignment(t *testing.T) {
	rules := []Rule{
		{Type: "budget_assignment", Pattern: "starbucks", Target: "food", Priority: 10},
		{Type: "budget_assignment", Pattern: "electric", Target: "housing", Priority: 10},
		{Type: "categorization", Pattern: "starbucks", Target: "Food:Coffee", Priority: 10}, // should be ignored
	}

	t.Run("assigns budgets by pattern", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "STARBUCKS #1234", StatementID: "s1", TransactionID: "t1"},
			{Description: "Electric Company", StatementID: "s1", TransactionID: "t2"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "food" {
			t.Errorf("txn[0].Budget = %q, want food", txns[0].Budget)
		}
		if txns[1].Budget != "housing" {
			t.Errorf("txn[1].Budget = %q, want housing", txns[1].Budget)
		}
	})

	t.Run("no error for unmatched", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "UNKNOWN MERCHANT", StatementID: "s1", TransactionID: "t1"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "" {
			t.Errorf("unmatched txn should have empty budget, got %q", txns[0].Budget)
		}
	})

	t.Run("skips already-assigned transactions", func(t *testing.T) {
		txns := []store.TransactionData{
			{Description: "STARBUCKS", Budget: "vacation", StatementID: "s1", TransactionID: "t1"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "vacation" {
			t.Errorf("should preserve existing budget: got %q", txns[0].Budget)
		}
	})
}
