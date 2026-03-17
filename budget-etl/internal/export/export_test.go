package export

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestWriteFileRoundTrip(t *testing.T) {
	budget := "groceries"
	normID := "norm-abc"
	normDesc := "GROCERY STORE"

	out := Output{
		Version:    1,
		ExportedAt: FormatTimestamp(time.Date(2025, 6, 15, 10, 30, 0, 0, time.UTC)),
		GroupID:    "group-123",
		GroupName:  "household",
		Transactions: []Transaction{
			{
				ID:                    "txn-001",
				Institution:           "pnc",
				Account:               "5111",
				Description:           "KROGER #1234",
				Amount:                52.30,
				Timestamp:             FormatTimestamp(time.Date(2025, 6, 10, 0, 0, 0, 0, time.UTC)),
				StatementID:           "pnc-5111-2025-06",
				Category:              "Food:Groceries",
				Budget:                &budget,
				Note:                  "",
				Reimbursement:         0,
				NormalizedID:          &normID,
				NormalizedPrimary:     true,
				NormalizedDescription: &normDesc,
			},
			{
				ID:                    "txn-002",
				Institution:           "capital_one",
				Account:               "4549",
				Description:           "RESTAURANT XYZ",
				Amount:                25.00,
				Timestamp:             FormatTimestamp(time.Date(2025, 6, 11, 0, 0, 0, 0, time.UTC)),
				StatementID:           "capital_one-4549-2025-06",
				Category:              "Food:Dining",
				Budget:                nil,
				Note:                  "work lunch",
				Reimbursement:         50,
				NormalizedID:          nil,
				NormalizedPrimary:     true,
				NormalizedDescription: nil,
			},
		},
		Budgets: []Budget{
			{
				ID:              "budget-food",
				Name:            "groceries",
				WeeklyAllowance: 150.00,
				Rollover:        "debt",
			},
		},
		BudgetPeriods: []BudgetPeriod{
			{
				ID:          "budget-food-2025-06-09",
				BudgetID:    "budget-food",
				PeriodStart: FormatTimestamp(time.Date(2025, 6, 9, 0, 0, 0, 0, time.UTC)),
				PeriodEnd:   FormatTimestamp(time.Date(2025, 6, 16, 0, 0, 0, 0, time.UTC)),
				Total:       52.30,
				Count:       1,
				CategoryBreakdown: map[string]float64{
					"Food:Groceries": 52.30,
				},
			},
		},
		Rules: []Rule{
			{
				ID:          "rule-001",
				Type:        "categorization",
				Pattern:     "KROGER",
				Target:      "Food:Groceries",
				Priority:    10,
				Institution: "",
				Account:     "",
			},
		},
		NormalizationRules: []NormalizationRule{
			{
				ID:                   "norm-rule-001",
				Pattern:              "KROGER",
				PatternType:          "contains",
				CanonicalDescription: "GROCERY STORE",
				DateWindowDays:       3,
				Institution:          "pnc",
				Account:              "",
				Priority:             5,
			},
		},
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "budget.json")

	if err := WriteFile(path, out); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	var got Output
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	// Verify top-level fields
	if got.Version != 1 {
		t.Errorf("version = %d, want 1", got.Version)
	}
	if got.ExportedAt != "2025-06-15T10:30:00Z" {
		t.Errorf("exportedAt = %q, want 2025-06-15T10:30:00Z", got.ExportedAt)
	}
	if got.GroupID != "group-123" {
		t.Errorf("groupId = %q, want group-123", got.GroupID)
	}
	if got.GroupName != "household" {
		t.Errorf("groupName = %q, want household", got.GroupName)
	}

	// Verify transactions
	if len(got.Transactions) != 2 {
		t.Fatalf("transactions count = %d, want 2", len(got.Transactions))
	}
	txn0 := got.Transactions[0]
	if txn0.ID != "txn-001" {
		t.Errorf("txn[0].id = %q, want txn-001", txn0.ID)
	}
	if txn0.Amount != 52.30 {
		t.Errorf("txn[0].amount = %v, want 52.30", txn0.Amount)
	}
	if txn0.Budget == nil || *txn0.Budget != "groceries" {
		t.Errorf("txn[0].budget = %v, want groceries", txn0.Budget)
	}
	if txn0.NormalizedID == nil || *txn0.NormalizedID != "norm-abc" {
		t.Errorf("txn[0].normalizedId = %v, want norm-abc", txn0.NormalizedID)
	}
	if txn0.NormalizedDescription == nil || *txn0.NormalizedDescription != "GROCERY STORE" {
		t.Errorf("txn[0].normalizedDescription = %v, want GROCERY STORE", txn0.NormalizedDescription)
	}

	txn1 := got.Transactions[1]
	if txn1.Budget != nil {
		t.Errorf("txn[1].budget = %v, want nil", txn1.Budget)
	}
	if txn1.NormalizedID != nil {
		t.Errorf("txn[1].normalizedId = %v, want nil", txn1.NormalizedID)
	}
	if txn1.NormalizedDescription != nil {
		t.Errorf("txn[1].normalizedDescription = %v, want nil", txn1.NormalizedDescription)
	}
	if txn1.Note != "work lunch" {
		t.Errorf("txn[1].note = %q, want work lunch", txn1.Note)
	}
	if txn1.Reimbursement != 50 {
		t.Errorf("txn[1].reimbursement = %v, want 50", txn1.Reimbursement)
	}

	// Verify budgets
	if len(got.Budgets) != 1 {
		t.Fatalf("budgets count = %d, want 1", len(got.Budgets))
	}
	if got.Budgets[0].Rollover != "debt" {
		t.Errorf("budget[0].rollover = %q, want debt", got.Budgets[0].Rollover)
	}

	// Verify budget periods
	if len(got.BudgetPeriods) != 1 {
		t.Fatalf("budgetPeriods count = %d, want 1", len(got.BudgetPeriods))
	}
	bp := got.BudgetPeriods[0]
	if bp.Total != 52.30 {
		t.Errorf("budgetPeriod.total = %v, want 52.30", bp.Total)
	}

	// Verify rules
	if len(got.Rules) != 1 {
		t.Fatalf("rules count = %d, want 1", len(got.Rules))
	}

	// Verify normalization rules
	if len(got.NormalizationRules) != 1 {
		t.Fatalf("normalizationRules count = %d, want 1", len(got.NormalizationRules))
	}
}

func TestReadFile(t *testing.T) {
	budget := "groceries"
	normID := "norm-abc"
	normDesc := "GROCERY STORE"

	original := Output{
		Version:    1,
		ExportedAt: FormatTimestamp(time.Date(2025, 6, 15, 10, 30, 0, 0, time.UTC)),
		GroupName:  "household",
		Transactions: []Transaction{
			{
				ID:                    "txn-001",
				Institution:           "pnc",
				Account:               "5111",
				Description:           "KROGER #1234",
				Amount:                52.30,
				Timestamp:             "2025-06-10T00:00:00Z",
				StatementID:           "pnc-5111-2025-06",
				Category:              "Food:Groceries",
				Budget:                &budget,
				NormalizedID:          &normID,
				NormalizedPrimary:     true,
				NormalizedDescription: &normDesc,
			},
		},
		Budgets: []Budget{
			{ID: "food", Name: "food", WeeklyAllowance: 375, Rollover: "none"},
		},
		BudgetPeriods: []BudgetPeriod{},
		Rules: []Rule{
			{ID: "r1", Type: "categorization", Pattern: "KROGER", Target: "Food:Groceries", Priority: 10},
		},
		NormalizationRules: []NormalizationRule{
			{ID: "nr1", Pattern: "KROGER", PatternType: "substring", CanonicalDescription: "GROCERY STORE", DateWindowDays: 0, Institution: "pnc", Priority: 10},
		},
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "budget.json")

	if err := WriteFile(path, original); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	got, err := ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	if got.Version != 1 {
		t.Errorf("version = %d, want 1", got.Version)
	}
	if got.GroupName != "household" {
		t.Errorf("groupName = %q, want household", got.GroupName)
	}
	if len(got.Transactions) != 1 {
		t.Fatalf("transactions = %d, want 1", len(got.Transactions))
	}
	if got.Transactions[0].Category != "Food:Groceries" {
		t.Errorf("category = %q, want Food:Groceries", got.Transactions[0].Category)
	}
	if got.Transactions[0].Budget == nil || *got.Transactions[0].Budget != "groceries" {
		t.Errorf("budget = %v, want groceries", got.Transactions[0].Budget)
	}
	if len(got.Rules) != 1 {
		t.Errorf("rules = %d, want 1", len(got.Rules))
	}
	if len(got.NormalizationRules) != 1 {
		t.Errorf("normRules = %d, want 1", len(got.NormalizationRules))
	}
	if len(got.Budgets) != 1 {
		t.Errorf("budgets = %d, want 1", len(got.Budgets))
	}
}

func TestReadFileNotFound(t *testing.T) {
	_, err := ReadFile("/nonexistent/path.json")
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestReadFileInvalidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bad.json")
	if err := os.WriteFile(path, []byte("{invalid"), 0644); err != nil {
		t.Fatal(err)
	}
	_, err := ReadFile(path)
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}

func TestReadFileValidation(t *testing.T) {
	dir := t.TempDir()

	tests := []struct {
		name    string
		content string
	}{
		{"missing version", `{"groupName":"test","transactions":[]}`},
		{"zero version", `{"version":0,"groupName":"test","transactions":[]}`},
		{"missing groupName", `{"version":1,"transactions":[]}`},
		{"missing transactions", `{"version":1,"groupName":"test"}`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(dir, tt.name+".json")
			if err := os.WriteFile(path, []byte(tt.content), 0644); err != nil {
				t.Fatal(err)
			}
			_, err := ReadFile(path)
			if err == nil {
				t.Fatalf("expected validation error for %s", tt.name)
			}
		})
	}
}

func TestTimestampsAreISO8601(t *testing.T) {
	ts := FormatTimestamp(time.Date(2025, 1, 6, 15, 30, 45, 0, time.UTC))
	if ts != "2025-01-06T15:30:45Z" {
		t.Errorf("timestamp = %q, want ISO 8601 format", ts)
	}

	// Non-UTC input should be converted to UTC
	est := time.FixedZone("EST", -5*3600)
	ts2 := FormatTimestamp(time.Date(2025, 1, 6, 10, 30, 45, 0, est))
	if ts2 != "2025-01-06T15:30:45Z" {
		t.Errorf("non-UTC timestamp = %q, want UTC conversion", ts2)
	}
}

func TestNullFieldsSerialization(t *testing.T) {
	txn := Transaction{
		ID:                    "txn-null",
		Institution:           "test",
		Account:               "1234",
		Description:           "TEST",
		Amount:                10.00,
		Timestamp:             "2025-01-06T00:00:00Z",
		StatementID:           "test-1234-2025-01",
		Category:              "Uncategorized",
		Budget:                nil,
		NormalizedID:          nil,
		NormalizedPrimary:     true,
		NormalizedDescription: nil,
	}

	b, err := json.Marshal(txn)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(b, &raw); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	// budget, normalizedId, normalizedDescription should be JSON null
	for _, field := range []string{"budget", "normalizedId", "normalizedDescription"} {
		v, exists := raw[field]
		if !exists {
			t.Errorf("field %q missing from JSON", field)
		} else if v != nil {
			t.Errorf("field %q = %v, want null", field, v)
		}
	}
}

func TestNoMemberEmailsOrGroupIDInTransactions(t *testing.T) {
	txn := Transaction{
		ID:          "txn-test",
		Institution: "test",
		Account:     "1234",
		Description: "TEST",
		Amount:      10.00,
		Timestamp:   "2025-01-06T00:00:00Z",
		StatementID: "test-1234-2025-01",
		Category:    "Test",
	}

	b, err := json.Marshal(txn)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(b, &raw); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	for _, field := range []string{"memberEmails", "groupId"} {
		if _, exists := raw[field]; exists {
			t.Errorf("field %q should not be present in transaction JSON", field)
		}
	}
}

func TestWriteFileAtomicity(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "subdir", "budget.json")

	// Writing to nonexistent subdirectory should fail (not create it)
	err := WriteFile(path, Output{Version: 1})
	if err == nil {
		t.Fatal("expected error writing to nonexistent directory")
	}
}
