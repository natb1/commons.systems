package main

import (
	"strings"
	"testing"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

func baseOutput(rules []export.Rule) export.Output {
	return export.Output{
		Version:      1,
		ExportedAt:   "2026-05-02T00:00:00Z",
		GroupID:      "g",
		GroupName:    "Test",
		Transactions: []export.Transaction{},
		Statements:   []export.Statement{},
		Rules:        rules,
	}
}

func TestApplySpec_RemoveByID(t *testing.T) {
	in := baseOutput([]export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "foo", Target: "Food"},
		{ID: "r2", Type: "categorization", Pattern: "bar", Target: "Drink"},
		{ID: "r3", Type: "categorization", Pattern: "baz", Target: "Misc"},
	})
	spec := Spec{Remove: RemoveSpec{ByID: []string{"r2"}}}

	out, err := applySpec(in, spec)
	if err != nil {
		t.Fatal(err)
	}
	if len(out.Rules) != 2 {
		t.Fatalf("expected 2 rules, got %d", len(out.Rules))
	}
	if out.Rules[0].ID != "r1" || out.Rules[1].ID != "r3" {
		t.Fatalf("expected [r1 r3], got [%s %s]", out.Rules[0].ID, out.Rules[1].ID)
	}
}

func TestApplySpec_RemoveByPredicate(t *testing.T) {
	in := baseOutput([]export.Rule{
		{ID: "b1", Type: "budget_assignment", MatchCategory: "Travel", Target: "vacation"},
		{ID: "b2", Type: "budget_assignment", MatchCategory: "Travel", Target: "business"},
		{ID: "b3", Type: "budget_assignment", MatchCategory: "Food", Target: "groceries"},
	})
	spec := Spec{Remove: RemoveSpec{ByPredicate: []export.Rule{
		{Type: "budget_assignment", MatchCategory: "Travel", Target: "vacation"},
	}}}

	out, err := applySpec(in, spec)
	if err != nil {
		t.Fatal(err)
	}
	if len(out.Rules) != 2 {
		t.Fatalf("expected 2 rules, got %d: %+v", len(out.Rules), out.Rules)
	}
	if out.Rules[0].ID != "b2" || out.Rules[1].ID != "b3" {
		t.Fatalf("expected [b2 b3], got [%s %s]", out.Rules[0].ID, out.Rules[1].ID)
	}
}

func TestApplySpec_AddPatternRule(t *testing.T) {
	in := baseOutput([]export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "foo", Target: "Food", Priority: 10},
	})
	spec := Spec{Add: []export.Rule{
		{ID: "r2", Type: "categorization", Pattern: "headway", Target: "Health:Therapy", Priority: 20},
	}}

	out, err := applySpec(in, spec)
	if err != nil {
		t.Fatal(err)
	}
	if len(out.Rules) != 2 {
		t.Fatalf("expected 2 rules, got %d", len(out.Rules))
	}
	last := out.Rules[len(out.Rules)-1]
	if last.ID != "r2" || last.Pattern != "headway" || last.Target != "Health:Therapy" || last.Priority != 20 {
		t.Fatalf("unexpected last rule: %+v", last)
	}
}

func TestApplySpec_AddTransactionIDRule(t *testing.T) {
	docID := store.TransactionDocID("pnc-5111-2026-05", "fitid-1")
	in := baseOutput(nil)
	spec := Spec{Add: []export.Rule{
		{ID: "bg-trip", Type: "budget_assignment", TransactionID: docID, Target: "vacation"},
	}}

	out, err := applySpec(in, spec)
	if err != nil {
		t.Fatal(err)
	}
	if len(out.Rules) != 1 {
		t.Fatalf("expected 1 rule, got %d", len(out.Rules))
	}
	if out.Rules[0].TransactionID != docID {
		t.Fatalf("expected TransactionID %q, got %q", docID, out.Rules[0].TransactionID)
	}
}

func TestApplySpec_AddIDCollision(t *testing.T) {
	in := baseOutput([]export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "foo", Target: "Food"},
	})
	spec := Spec{Add: []export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "bar", Target: "Drink"},
	}}

	_, err := applySpec(in, spec)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "collides") {
		t.Fatalf("expected error mentioning 'collides', got %q", err.Error())
	}
}

func TestApplySpec_AddIDIntraSpecCollision(t *testing.T) {
	in := baseOutput(nil)
	spec := Spec{Add: []export.Rule{
		{ID: "dup", Type: "categorization", Pattern: "a", Target: "A"},
		{ID: "dup", Type: "categorization", Pattern: "b", Target: "B"},
	}}

	_, err := applySpec(in, spec)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "duplicated") {
		t.Fatalf("expected error mentioning 'duplicated', got %q", err.Error())
	}
}

func TestApplySpec_PredicateAllZero(t *testing.T) {
	in := baseOutput([]export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "foo", Target: "Food"},
	})
	spec := Spec{Remove: RemoveSpec{ByPredicate: []export.Rule{{}}}}

	_, err := applySpec(in, spec)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "every rule") {
		t.Fatalf("expected error mentioning 'every rule', got %q", err.Error())
	}
}

func TestApplySpec_AddDocIDFormat(t *testing.T) {
	in := baseOutput(nil)
	spec := Spec{Add: []export.Rule{
		{ID: "bg-bad", Type: "budget_assignment", TransactionID: "not-a-valid-doc-id", Target: "vacation"},
	}}

	_, err := applySpec(in, spec)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "doc ID") {
		t.Fatalf("expected error mentioning 'doc ID', got %q", err.Error())
	}
}

func TestApplySpec_AddEmptyID(t *testing.T) {
	in := baseOutput(nil)
	spec := Spec{Add: []export.Rule{
		{Type: "categorization", Pattern: "foo", Target: "Food"},
	}}

	_, err := applySpec(in, spec)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "id is required") {
		t.Fatalf("expected error mentioning 'id is required', got %q", err.Error())
	}
}

func TestApplySpec_DoesNotMutateInput(t *testing.T) {
	in := baseOutput([]export.Rule{
		{ID: "r1", Type: "categorization", Pattern: "foo", Target: "Food"},
	})
	originalRules := in.Rules
	spec := Spec{
		Remove: RemoveSpec{ByID: []string{"r1"}},
		Add:    []export.Rule{{ID: "r2", Type: "categorization", Pattern: "bar", Target: "Drink"}},
	}

	if _, err := applySpec(in, spec); err != nil {
		t.Fatal(err)
	}
	if len(in.Rules) != 1 || &in.Rules[0] != &originalRules[0] {
		t.Fatalf("input rules slice was mutated")
	}
	if in.Rules[0].ID != "r1" {
		t.Fatalf("input rule was mutated: %+v", in.Rules[0])
	}
}

func TestRunPatch_InputEqualsOutput(t *testing.T) {
	err := runPatch("spec.json", "/tmp/same.json", "/tmp/same.json", "")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "must differ") {
		t.Fatalf("expected error mentioning 'must differ', got %q", err.Error())
	}
}

func TestRunPatch_MissingSpec(t *testing.T) {
	if err := runPatch("", "/tmp/a.json", "/tmp/b.json", ""); err == nil {
		t.Fatal("expected error for missing --spec")
	}
}
