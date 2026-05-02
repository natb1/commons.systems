package main

import (
	"encoding/json"
	"math"
	"os"
	"testing"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/parse"
	"github.com/natb1/commons.systems/budget-etl/internal/rules"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

// TestApplySpecAndMerge exercises the full patch -> merge flow against a
// checked-in fixture. The input snapshot has rules that do not match any
// banktwo transactions; after applySpec, the resulting rule set must
// categorize every parsed transaction (zero uncategorized).
func TestApplySpecAndMerge(t *testing.T) {
	inputBytes, err := os.ReadFile("testdata/input.json")
	if err != nil {
		t.Fatal(err)
	}
	var input export.Output
	if err := json.Unmarshal(inputBytes, &input); err != nil {
		t.Fatal(err)
	}

	specBytes, err := os.ReadFile("testdata/spec.json")
	if err != nil {
		t.Fatal(err)
	}
	var spec Spec
	if err := json.Unmarshal(specBytes, &spec); err != nil {
		t.Fatal(err)
	}

	stage1, err := applySpec(input, spec)
	if err != nil {
		t.Fatalf("applySpec: %v", err)
	}

	if !ruleIDPresent(stage1.Rules, "cat-grocery") || !ruleIDPresent(stage1.Rules, "cat-payment") {
		t.Fatalf("expected stage1 to contain added rules, got %+v", ruleIDs(stage1.Rules))
	}

	pr, err := parse.ParseFile("testdata/statements/banktwo/5678/banktwo.ofx")
	if err != nil {
		t.Fatal(err)
	}
	if len(pr.Transactions) == 0 {
		t.Fatal("expected at least one parsed transaction in banktwo.ofx")
	}

	stmtID := "banktwo-5678-2025-05"
	txns := make([]store.TransactionData, len(pr.Transactions))
	for i, tx := range pr.Transactions {
		txns[i] = store.TransactionData{
			Institution:   "banktwo",
			Account:       "5678",
			Description:   tx.Description,
			Amount:        tx.Amount,
			Timestamp:     tx.Date,
			StatementID:   stmtID,
			TransactionID: tx.TransactionID,
		}
	}

	ruleSet, err := convertExportRulesForTest(stage1.Rules)
	if err != nil {
		t.Fatal(err)
	}
	uncategorized := rules.ApplyCategorization(txns, ruleSet)
	if len(uncategorized) > 0 {
		t.Fatalf("expected zero uncategorized, got %d: %+v", len(uncategorized), uncategorized)
	}
	for i, td := range txns {
		if td.Category == "" {
			t.Fatalf("txn %d (%s) has empty category after categorization", i, td.Description)
		}
	}
}

func ruleIDs(rs []export.Rule) []string {
	ids := make([]string, len(rs))
	for i, r := range rs {
		ids[i] = r.ID
	}
	return ids
}

func ruleIDPresent(rs []export.Rule, id string) bool {
	for _, r := range rs {
		if r.ID == id {
			return true
		}
	}
	return false
}

// convertExportRulesForTest mirrors the conversion used by main.go's
// convertExportRules. It is duplicated here because that helper is
// package-private to the parent budget-etl/main.go and cmd/patch can't
// import it.
func convertExportRulesForTest(exportRules []export.Rule) ([]rules.Rule, error) {
	out := make([]rules.Rule, len(exportRules))
	for i, r := range exportRules {
		out[i] = rules.Rule{
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
			MinAmount:       dollarsToCentsForTest(r.MinAmount),
			MaxAmount:       dollarsToCentsForTest(r.MaxAmount),
		}
	}
	return out, nil
}

func dollarsToCentsForTest(d *float64) *int64 {
	if d == nil {
		return nil
	}
	v := int64(math.Round(*d * 100))
	return &v
}
