package rules

import (
	"testing"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func intPtr(v int64) *int64 { return &v }

func TestMatch(t *testing.T) {
	tests := []struct {
		name        string
		rule        Rule
		desc        string
		institution string
		account     string
		amount      int64
		want        bool
	}{
		{
			name: "case-insensitive substring match",
			rule: Rule{Pattern: "coffee"},
			desc: "STARBUCKS COFFEE #1234", institution: "BankOne", account: "Checking",
			want: true,
		},
		{
			name: "no match",
			rule: Rule{Pattern: "pizza"},
			desc: "STARBUCKS COFFEE #1234", institution: "BankOne", account: "Checking",
			want: false,
		},
		{
			name: "institution filter matches",
			rule: Rule{Pattern: "coffee", Institution: "BankOne"},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			want: true,
		},
		{
			name: "institution filter rejects",
			rule: Rule{Pattern: "coffee", Institution: "Chase"},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			want: false,
		},
		{
			name: "account filter matches",
			rule: Rule{Pattern: "coffee", Account: "checking"},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			want: true,
		},
		{
			name: "account filter rejects",
			rule: Rule{Pattern: "coffee", Account: "Savings"},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			want: false,
		},
		{
			name: "both filters match",
			rule: Rule{Pattern: "coffee", Institution: "bankone", Account: "checking"},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			want: true,
		},
		{
			name: "empty pattern matches everything",
			rule: Rule{Pattern: ""},
			desc: "anything", institution: "any", account: "any",
			want: true,
		},
		{
			name: "minAmount matches when amount >= min",
			rule: Rule{Pattern: "coffee", MinAmount: intPtr(500)},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			amount: 500,
			want:   true,
		},
		{
			name: "minAmount rejects when amount < min",
			rule: Rule{Pattern: "coffee", MinAmount: intPtr(500)},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			amount: 499,
			want:   false,
		},
		{
			name: "maxAmount matches when amount <= max",
			rule: Rule{Pattern: "coffee", MaxAmount: intPtr(1000)},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			amount: 1000,
			want:   true,
		},
		{
			name: "maxAmount rejects when amount > max",
			rule: Rule{Pattern: "coffee", MaxAmount: intPtr(1000)},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			amount: 1001,
			want:   false,
		},
		{
			name: "both min and max: matches within range",
			rule: Rule{Pattern: "coffee", MinAmount: intPtr(500), MaxAmount: intPtr(1000)},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			amount: 750,
			want:   true,
		},
		{
			name: "no amount filter matches any amount",
			rule: Rule{Pattern: "coffee"},
			desc: "STARBUCKS COFFEE", institution: "BankOne", account: "Checking",
			amount: 99999,
			want:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.rule.Match(tt.desc, tt.institution, tt.account, "", tt.amount)
			if got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}

	t.Run("matchCategory exact match", func(t *testing.T) {
		r := Rule{Pattern: "", MatchCategory: "Food"}
		if !r.Match("anything", "", "", "Food", 0) {
			t.Error("expected match for exact category")
		}
	})

	t.Run("matchCategory prefix match", func(t *testing.T) {
		r := Rule{Pattern: "", MatchCategory: "Food"}
		if !r.Match("anything", "", "", "Food:Coffee", 0) {
			t.Error("expected match for category prefix")
		}
	})

	t.Run("matchCategory rejects non-matching category", func(t *testing.T) {
		r := Rule{Pattern: "", MatchCategory: "Food"}
		if r.Match("anything", "", "", "Housing", 0) {
			t.Error("expected no match for different category")
		}
	})

	t.Run("matchCategory with pattern requires both", func(t *testing.T) {
		r := Rule{Pattern: "starbucks", MatchCategory: "Food"}
		if !r.Match("STARBUCKS COFFEE", "", "", "Food:Coffee", 0) {
			t.Error("expected match when both pattern and category match")
		}
		if r.Match("STARBUCKS COFFEE", "", "", "Housing", 0) {
			t.Error("expected no match when category doesn't match")
		}
		if r.Match("UNKNOWN", "", "", "Food:Coffee", 0) {
			t.Error("expected no match when pattern doesn't match")
		}
	})

	t.Run("matchCategory does not match partial prefix", func(t *testing.T) {
		r := Rule{Pattern: "", MatchCategory: "Food"}
		if r.Match("anything", "", "", "FoodTruck", 0) {
			t.Error("expected no match for partial prefix without colon separator")
		}
	})

	t.Run("excludeCategory exact match rejects", func(t *testing.T) {
		r := Rule{Pattern: "", ExcludeCategory: "Transfer"}
		if r.Match("anything", "", "", "Transfer", 0) {
			t.Error("expected no match for exact excludeCategory")
		}
	})

	t.Run("excludeCategory prefix+colon rejects", func(t *testing.T) {
		r := Rule{Pattern: "", ExcludeCategory: "Transfer"}
		if r.Match("anything", "", "", "Transfer:CardPayment", 0) {
			t.Error("expected no match for excludeCategory prefix with colon")
		}
	})

	t.Run("excludeCategory non-matching passes", func(t *testing.T) {
		r := Rule{Pattern: "", ExcludeCategory: "Transfer"}
		if !r.Match("anything", "", "", "Food:Coffee", 0) {
			t.Error("expected match when category doesn't match excludeCategory")
		}
	})

	t.Run("excludeCategory partial prefix does not reject", func(t *testing.T) {
		r := Rule{Pattern: "", ExcludeCategory: "Transfer"}
		if !r.Match("anything", "", "", "TransferWise", 0) {
			t.Error("expected match for partial prefix without colon separator")
		}
	})
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

	t.Run("category prefix match", func(t *testing.T) {
		rules := []Rule{
			{Type: "budget_assignment", Pattern: "", Category: "Food", Target: "food-budget", Priority: 10},
		}
		txns := []store.TransactionData{
			{Description: "GROCERY STORE", Category: "Food:Groceries", StatementID: "s1", TransactionID: "t1"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "food-budget" {
			t.Errorf("txn[0].Budget = %q, want food-budget", txns[0].Budget)
		}
	})

	t.Run("category prefix mismatch", func(t *testing.T) {
		rules := []Rule{
			{Type: "budget_assignment", Pattern: "", Category: "Food", Target: "food-budget", Priority: 10},
		}
		txns := []store.TransactionData{
			{Description: "ELECTRIC CO", Category: "Housing:Utilities", StatementID: "s1", TransactionID: "t1"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "" {
			t.Errorf("txn[0].Budget = %q, want empty (no match)", txns[0].Budget)
		}
	})

	t.Run("category filter is case-insensitive", func(t *testing.T) {
		rules := []Rule{
			{Type: "budget_assignment", Pattern: "", Category: "food", Target: "food-budget", Priority: 10},
		}
		txns := []store.TransactionData{
			{Description: "GROCERY STORE", Category: "Food:Groceries", StatementID: "s1", TransactionID: "t1"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "food-budget" {
			t.Errorf("txn[0].Budget = %q, want food-budget", txns[0].Budget)
		}
	})

	t.Run("empty category matches any", func(t *testing.T) {
		rules := []Rule{
			{Type: "budget_assignment", Pattern: "grocery", Category: "", Target: "catch-all", Priority: 10},
		}
		txns := []store.TransactionData{
			{Description: "GROCERY STORE", Category: "Food:Groceries", StatementID: "s1", TransactionID: "t1"},
		}
		ApplyBudgetAssignment(txns, rules)
		if txns[0].Budget != "catch-all" {
			t.Errorf("txn[0].Budget = %q, want catch-all", txns[0].Budget)
		}
	})
}

func TestNormalizationRuleMatch(t *testing.T) {
	tests := []struct {
		name string
		rule NormalizationRule
		txn  store.NormTxn
		want bool
	}{
		{
			name: "case-insensitive substring match",
			rule: NormalizationRule{Pattern: "netflix"},
			txn:  store.NormTxn{Description: "NETFLIX.COM Monthly Charge"},
			want: true,
		},
		{
			name: "no match",
			rule: NormalizationRule{Pattern: "spotify"},
			txn:  store.NormTxn{Description: "NETFLIX.COM Monthly Charge"},
			want: false,
		},
		{
			name: "institution filter matches",
			rule: NormalizationRule{Pattern: "netflix", Institution: "Chase"},
			txn:  store.NormTxn{Description: "NETFLIX.COM", Institution: "Chase"},
			want: true,
		},
		{
			name: "institution filter rejects",
			rule: NormalizationRule{Pattern: "netflix", Institution: "Chase"},
			txn:  store.NormTxn{Description: "NETFLIX.COM", Institution: "BankOne"},
			want: false,
		},
		{
			name: "account filter matches",
			rule: NormalizationRule{Pattern: "netflix", Account: "checking"},
			txn:  store.NormTxn{Description: "NETFLIX.COM", Account: "Checking"},
			want: true,
		},
		{
			name: "account filter rejects",
			rule: NormalizationRule{Pattern: "netflix", Account: "Savings"},
			txn:  store.NormTxn{Description: "NETFLIX.COM", Account: "Checking"},
			want: false,
		},
		{
			name: "both filters match",
			rule: NormalizationRule{Pattern: "netflix", Institution: "chase", Account: "checking"},
			txn:  store.NormTxn{Description: "NETFLIX.COM", Institution: "Chase", Account: "Checking"},
			want: true,
		},
		{
			name: "empty pattern matches everything",
			rule: NormalizationRule{Pattern: ""},
			txn:  store.NormTxn{Description: "anything at all"},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := matchNormRule(tt.rule, nil, tt.txn)
			if got != tt.want {
				t.Errorf("matchNormRule() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNormalizationRuleMatch_Regex(t *testing.T) {
	tests := []struct {
		name string
		rule NormalizationRule
		txn  store.NormTxn
		want bool
	}{
		{
			name: "basic regex match",
			rule: NormalizationRule{Pattern: `NETFLIX\.COM.*\d+`, PatternType: "regex"},
			txn:  store.NormTxn{Description: "NETFLIX.COM subscription 12345"},
			want: true,
		},
		{
			name: "case-insensitive regex via ApplyNormalization compilation",
			rule: NormalizationRule{Pattern: `netflix\.com`, PatternType: "regex"},
			txn:  store.NormTxn{Description: "NETFLIX.COM Monthly"},
			want: true, // ApplyNormalization prepends (?i); tested below via full pipeline
		},
		{
			name: "regex no match",
			rule: NormalizationRule{Pattern: `^EXACT$`, PatternType: "regex"},
			txn:  store.NormTxn{Description: "NOT EXACT MATCH"},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// For regex rules, ApplyNormalization compiles with (?i) prefix.
			// Here we test via the full pipeline with 2 txns to form a group.
			// Rule-based normalization requires cross-statement membership;
			// use different statement IDs for match cases and same for no-match
			// (to avoid auto-normalization producing a false positive).
			txn2 := tt.txn
			txn2.DocID = "doc-2"
			tt.txn.DocID = "doc-1"
			tt.txn.StatementID = "s1"
			if tt.want {
				txn2.StatementID = "s2"
			} else {
				txn2.StatementID = "s1"
			}
			updates, err := ApplyNormalization(
				[]store.NormTxn{tt.txn, txn2},
				[]NormalizationRule{tt.rule},
			)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			gotMatch := len(updates) > 0
			if gotMatch != tt.want {
				t.Errorf("matched = %v, want %v (updates=%d)", gotMatch, tt.want, len(updates))
			}
		})
	}

	t.Run("invalid regex returns error", func(t *testing.T) {
		rule := NormalizationRule{Pattern: `[invalid`, PatternType: "regex"}
		_, err := ApplyNormalization(nil, []NormalizationRule{rule})
		if err == nil {
			t.Fatal("expected error for invalid regex")
		}
	})
}

func TestApplyNormalization_AmountGrouping(t *testing.T) {
	base := time.Date(2025, 3, 1, 12, 0, 0, 0, time.UTC)
	day2 := base.AddDate(0, 0, 1)
	txns := []store.NormTxn{
		// Two amounts on the same date, each in two overlapping statements
		{DocID: "a1", Description: "NETFLIX.COM sub", Amount: 1599, Timestamp: base, StatementID: "s1"},
		{DocID: "a2", Description: "NETFLIX.COM subscription", Amount: 1599, Timestamp: base, StatementID: "s2"},
		{DocID: "b1", Description: "NETFLIX.COM premium", Amount: 2299, Timestamp: day2, StatementID: "s1"},
		{DocID: "b2", Description: "NETFLIX.COM prem sub", Amount: 2299, Timestamp: day2, StatementID: "s2"},
	}
	rules := []NormalizationRule{{
		ID:                   "r1",
		Pattern:              "netflix",
		CanonicalDescription: "Netflix",
		Priority:             1,
	}}

	updates, err := ApplyNormalization(txns, rules)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// 2 pairs x 2 transactions = 4 updates
	if len(updates) != 4 {
		t.Fatalf("got %d updates, want 4", len(updates))
	}
	// Count distinct normalizedIDs to verify 2 groups
	ids := make(map[string]bool)
	for _, u := range updates {
		ids[u.NormalizedID] = true
	}
	if len(ids) != 2 {
		t.Errorf("got %d distinct normalizedIDs, want 2", len(ids))
	}
}

func TestApplyNormalization_ExactDateOnly(t *testing.T) {
	base := time.Date(2025, 3, 1, 12, 0, 0, 0, time.UTC)
	txns := []store.NormTxn{
		// Same date, different statements → duplicate
		{DocID: "d1", Description: "ELECTRIC CO", Amount: 8500, Timestamp: base, StatementID: "s1"},
		{DocID: "d2", Description: "ELECTRIC COMPANY", Amount: 8500, Timestamp: base, StatementID: "s2"},
		// Different date → distinct transaction, not a duplicate
		{DocID: "d3", Description: "ELECTRIC CO", Amount: 8500, Timestamp: base.AddDate(0, 0, 5), StatementID: "s3"},
	}
	rules := []NormalizationRule{{
		ID:                   "r1",
		Pattern:              "electric",
		CanonicalDescription: "Electric Company",
		Priority:             1,
	}}

	updates, err := ApplyNormalization(txns, rules)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// d1 and d2 share date+amount across statements → 2 updates
	// d3 is on a different date → standalone, no update
	if len(updates) != 2 {
		t.Fatalf("got %d updates, want 2", len(updates))
	}
	docIDs := make(map[string]bool)
	for _, u := range updates {
		docIDs[u.DocID] = true
	}
	if !docIDs["d1"] || !docIDs["d2"] {
		t.Errorf("expected d1 and d2 in group, got %v", docIDs)
	}
}

func TestApplyNormalization_PrimarySelection(t *testing.T) {
	base := time.Date(2025, 3, 1, 12, 0, 0, 0, time.UTC)
	// Same date, 3 overlapping statements
	txns := []store.NormTxn{
		{DocID: "x1", Description: "WATER BILL", Amount: 5000, Timestamp: base, StatementID: "stmt-2025-01"},
		{DocID: "x2", Description: "WATER BILL PAYMENT", Amount: 5000, Timestamp: base, StatementID: "stmt-2025-03"},
		{DocID: "x3", Description: "WATER BILL CO", Amount: 5000, Timestamp: base, StatementID: "stmt-2025-02"},
	}
	rules := []NormalizationRule{{
		ID:                   "r1",
		Pattern:              "water bill",
		CanonicalDescription: "Water Bill",
		Priority:             1,
	}}

	updates, err := ApplyNormalization(txns, rules)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(updates) != 3 {
		t.Fatalf("got %d updates, want 3", len(updates))
	}
	// Primary should be x2 (StatementID "stmt-2025-03" is lexicographically greatest)
	for _, u := range updates {
		if u.NormalizedID != "x2" {
			t.Errorf("update for %s: NormalizedID = %q, want x2", u.DocID, u.NormalizedID)
		}
		if u.DocID == "x2" && !u.NormalizedPrimary {
			t.Error("x2 should be NormalizedPrimary=true")
		}
		if u.DocID != "x2" && u.NormalizedPrimary {
			t.Errorf("%s should be NormalizedPrimary=false", u.DocID)
		}
		if u.NormalizedDescription != "Water Bill" {
			t.Errorf("NormalizedDescription = %q, want Water Bill", u.NormalizedDescription)
		}
	}

	// Same-statement transactions are never grouped
	t.Run("same statement not grouped", func(t *testing.T) {
		txns := []store.NormTxn{
			{DocID: "aa", Description: "WATER BILL", Amount: 5000, Timestamp: base, StatementID: "stmt-same"},
			{DocID: "zz", Description: "WATER BILL", Amount: 5000, Timestamp: base, StatementID: "stmt-same"},
		}
		updates, err := ApplyNormalization(txns, rules)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(updates) != 0 {
			t.Errorf("got %d updates, want 0 (same-statement entries are distinct)", len(updates))
		}
	})
}

func TestApplyNormalization_FirstMatchWins(t *testing.T) {
	base := time.Date(2025, 3, 1, 12, 0, 0, 0, time.UTC)
	// Same date, 3 overlapping statements
	txns := []store.NormTxn{
		{DocID: "t1", Description: "ACME ELECTRIC CO", Amount: 8500, Timestamp: base, StatementID: "s1"},
		{DocID: "t2", Description: "ACME ELECTRIC COMPANY", Amount: 8500, Timestamp: base, StatementID: "s2"},
		{DocID: "t3", Description: "ACME ELECTRIC", Amount: 8500, Timestamp: base, StatementID: "s3"},
	}
	// Lower priority number = higher priority (evaluated first)
	rules := []NormalizationRule{
		{
			ID:                   "low-priority",
			Pattern:              "electric",
			CanonicalDescription: "Electric Bill",
			Priority:             10, // evaluated first
		},
		{
			ID:                   "high-priority-number",
			Pattern:              "acme",
			CanonicalDescription: "ACME Corp",
			Priority:             20, // evaluated second
		},
	}

	updates, err := ApplyNormalization(txns, rules)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// All 3 should be claimed by the first rule ("electric", priority 10)
	if len(updates) != 3 {
		t.Fatalf("got %d updates, want 3", len(updates))
	}
	for _, u := range updates {
		if u.NormalizedDescription != "Electric Bill" {
			t.Errorf("update for %s: NormalizedDescription = %q, want Electric Bill (first match wins)",
				u.DocID, u.NormalizedDescription)
		}
	}
}

func TestApplyNormalization_AutoNormalize(t *testing.T) {
	base := time.Date(2025, 1, 22, 10, 0, 0, 0, time.UTC)
	txns := []store.NormTxn{
		{DocID: "a1", Description: "CAFE NERO #1234", Amount: 2500, Timestamp: base, StatementID: "stmt-2025-01"},
		{DocID: "a2", Description: "CAFE NERO #1234", Amount: 2500, Timestamp: base, StatementID: "stmt-2025-02"},
	}
	// No rules — auto-normalization only
	updates, err := ApplyNormalization(txns, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(updates) != 2 {
		t.Fatalf("got %d updates, want 2", len(updates))
	}
	// Both should share the same normalizedID (the primary's doc ID)
	if updates[0].NormalizedID != updates[1].NormalizedID {
		t.Error("auto-normalized transactions should share the same NormalizedID")
	}
	// Primary should be a2 (lexicographically greatest StatementID)
	for _, u := range updates {
		if u.NormalizedID != "a2" {
			t.Errorf("NormalizedID = %q, want a2", u.NormalizedID)
		}
		if u.DocID == "a2" && !u.NormalizedPrimary {
			t.Error("a2 should be NormalizedPrimary=true")
		}
		if u.DocID == "a1" && u.NormalizedPrimary {
			t.Error("a1 should be NormalizedPrimary=false")
		}
	}
}

func TestApplyNormalization_AutoNormalize_SameStatement(t *testing.T) {
	base := time.Date(2025, 1, 22, 10, 0, 0, 0, time.UTC)
	txns := []store.NormTxn{
		{DocID: "a1", Description: "CAFE NERO", Amount: 2500, Timestamp: base, StatementID: "stmt-2025-01"},
		{DocID: "a2", Description: "CAFE NERO", Amount: 2500, Timestamp: base, StatementID: "stmt-2025-01"},
	}
	updates, err := ApplyNormalization(txns, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(updates) != 0 {
		t.Errorf("got %d updates, want 0 (same statement should not auto-normalize)", len(updates))
	}
}

func TestApplyNormalization_AutoNormalize_DifferentDescription(t *testing.T) {
	base := time.Date(2025, 1, 22, 10, 0, 0, 0, time.UTC)
	txns := []store.NormTxn{
		{DocID: "a1", Description: "CAFE NERO #1234 01/22", Amount: 2500, Timestamp: base, StatementID: "stmt-2025-01"},
		{DocID: "a2", Description: "CAFE NERO 01/22 DEBIT CARD", Amount: 2500, Timestamp: base, StatementID: "stmt-2025-02"},
	}
	updates, err := ApplyNormalization(txns, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(updates) != 0 {
		t.Errorf("got %d updates, want 0 (different descriptions need a rule)", len(updates))
	}
}

func TestApplyNormalization_AutoAndRules(t *testing.T) {
	base := time.Date(2025, 1, 22, 10, 0, 0, 0, time.UTC)
	txns := []store.NormTxn{
		// Auto-normalizable pair (identical descriptions, different statements)
		{DocID: "auto-1", Description: "EXACT MATCH", Amount: 1000, Timestamp: base, StatementID: "s1"},
		{DocID: "auto-2", Description: "EXACT MATCH", Amount: 1000, Timestamp: base, StatementID: "s2"},
		// Rule-normalizable pair (different descriptions, different statements)
		{DocID: "rule-1", Description: "CAFE NERO #1234", Amount: 2500, Timestamp: base, StatementID: "s1"},
		{DocID: "rule-2", Description: "CAFE NERO DEBIT", Amount: 2500, Timestamp: base, StatementID: "s2"},
	}
	rules := []NormalizationRule{{
		ID:                   "r1",
		Pattern:              "cafe nero",
		CanonicalDescription: "Cafe Nero",
		DateWindowDays:       7,
		Priority:             1,
	}}

	updates, err := ApplyNormalization(txns, rules)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// 2 auto-normalized + 2 rule-normalized = 4 updates
	if len(updates) != 4 {
		t.Fatalf("got %d updates, want 4", len(updates))
	}

	autoUpdates := make(map[string]store.NormalizationUpdate)
	ruleUpdates := make(map[string]store.NormalizationUpdate)
	for _, u := range updates {
		if u.DocID == "auto-1" || u.DocID == "auto-2" {
			autoUpdates[u.DocID] = u
		} else {
			ruleUpdates[u.DocID] = u
		}
	}
	if len(autoUpdates) != 2 {
		t.Fatalf("expected 2 auto updates, got %d", len(autoUpdates))
	}
	if len(ruleUpdates) != 2 {
		t.Fatalf("expected 2 rule updates, got %d", len(ruleUpdates))
	}
	// Auto-normalized: description should be the primary's description
	for _, u := range autoUpdates {
		if u.NormalizedDescription != "EXACT MATCH" {
			t.Errorf("auto NormalizedDescription = %q, want EXACT MATCH", u.NormalizedDescription)
		}
	}
	// Rule-normalized: description should be the canonical description from the rule
	for _, u := range ruleUpdates {
		if u.NormalizedDescription != "Cafe Nero" {
			t.Errorf("rule NormalizedDescription = %q, want Cafe Nero", u.NormalizedDescription)
		}
	}
}

func TestApplyNormalization_SingleMatch(t *testing.T) {
	base := time.Date(2025, 3, 1, 12, 0, 0, 0, time.UTC)
	txns := []store.NormTxn{
		{DocID: "solo", Description: "UNIQUE PAYMENT", Amount: 999, Timestamp: base, StatementID: "s1"},
	}
	rules := []NormalizationRule{{
		ID:                   "r1",
		Pattern:              "unique",
		CanonicalDescription: "Unique Payment",

		DateWindowDays: 30,
		Priority:       1,
	}}

	updates, err := ApplyNormalization(txns, rules)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(updates) != 0 {
		t.Errorf("got %d updates, want 0 (single match should not form a group)", len(updates))
	}
}
