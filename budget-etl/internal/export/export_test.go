package export

import (
	"encoding/json"
	"flag"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

var generateGolden = flag.Bool("generate-golden", false, "generate golden file for cross-implementation interop testing")

func TestWriteFileRoundTrip(t *testing.T) {
	budget := "groceries"
	normID := "norm-abc"
	normDesc := "GROCERY STORE"

	out := Output{
		Version:    1,
		ExportedAt: FormatTimestamp(time.Date(2025, 6, 15, 10, 30, 0, 0, time.UTC)),
		GroupID:    "group-123",
		GroupName:  "household",
		Statements: []Statement{
			{
				ID:          "stmt-doc-001",
				StatementID: "bankone-1234-2025-06",
				Institution: "bankone",
				Account:     "1234",
				Balance:     1429.61,
				Period:      "2025-06",
			},
		},
		Transactions: []Transaction{
			{
				ID:                    "txn-001",
				Institution:           "bankone",
				Account:               "1234",
				Description:           "KROGER #1234",
				Amount:                52.30,
				Timestamp:             FormatTimestamp(time.Date(2025, 6, 10, 0, 0, 0, 0, time.UTC)),
				StatementID:           "bankone-1234-2025-06",
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
				Institution:           "banktwo",
				Account:               "5678",
				Description:           "RESTAURANT XYZ",
				Amount:                25.00,
				Timestamp:             FormatTimestamp(time.Date(2025, 6, 11, 0, 0, 0, 0, time.UTC)),
				StatementID:           "banktwo-5678-2025-06",
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
				Allowance: 150.00,
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
			{
				ID:            "rule-002",
				Type:          "categorization",
				Pattern:       "",
				Target:        "Food:Dining",
				Priority:      20,
				Institution:   "banktwo",
				Account:       "5678",
				TransactionID: "txn-002",
			},
		},
		NormalizationRules: []NormalizationRule{
			{
				ID:                   "norm-rule-001",
				Pattern:              "KROGER",
				PatternType:          "contains",
				CanonicalDescription: "GROCERY STORE",
				DateWindowDays:       3,
				Institution:          "bankone",
				Account:              "",
				Priority:             5,
			},
		},
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "budget.json")

	if err := WriteFile(path, out, ""); err != nil {
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

	// Verify statements
	if len(got.Statements) != 1 {
		t.Fatalf("statements count = %d, want 1", len(got.Statements))
	}
	if got.Statements[0].Balance != 1429.61 {
		t.Errorf("statement[0].balance = %v, want 1429.61", got.Statements[0].Balance)
	}
	if got.Statements[0].StatementID != "bankone-1234-2025-06" {
		t.Errorf("statement[0].statementId = %q, want bankone-1234-2025-06", got.Statements[0].StatementID)
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
	if len(got.Rules) != 2 {
		t.Fatalf("rules count = %d, want 2", len(got.Rules))
	}
	if got.Rules[0].TransactionID != "" {
		t.Errorf("rules[0].transactionId = %q, want empty", got.Rules[0].TransactionID)
	}
	if got.Rules[1].TransactionID != "txn-002" {
		t.Errorf("rules[1].transactionId = %q, want txn-002", got.Rules[1].TransactionID)
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
				Institution:           "bankone",
				Account:               "1234",
				Description:           "KROGER #1234",
				Amount:                52.30,
				Timestamp:             "2025-06-10T00:00:00Z",
				StatementID:           "bankone-1234-2025-06",
				Category:              "Food:Groceries",
				Budget:                &budget,
				NormalizedID:          &normID,
				NormalizedPrimary:     true,
				NormalizedDescription: &normDesc,
			},
		},
		Budgets: []Budget{
			{ID: "food", Name: "food", Allowance: 375, Rollover: "none"},
		},
		BudgetPeriods: []BudgetPeriod{},
		Rules: []Rule{
			{ID: "r1", Type: "categorization", Pattern: "KROGER", Target: "Food:Groceries", Priority: 10},
		},
		NormalizationRules: []NormalizationRule{
			{ID: "nr1", Pattern: "KROGER", PatternType: "substring", CanonicalDescription: "GROCERY STORE", DateWindowDays: 0, Institution: "bankone", Priority: 10},
		},
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "budget.json")

	if err := WriteFile(path, original, ""); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	got, err := ReadFile(path, "")
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
	_, err := ReadFile("/nonexistent/path.json", "")
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
	_, err := ReadFile(path, "")
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
			_, err := ReadFile(path, "")
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

func TestRuleTransactionIDRoundTrip(t *testing.T) {
	withTxnID := Rule{
		ID:            "rule-with-txn",
		Type:          "categorization",
		Pattern:       "SPECIFIC CHARGE",
		Target:        "Food:Dining",
		Priority:      10,
		Institution:   "bankone",
		Account:       "1234",
		TransactionID: "abc123",
	}

	withoutTxnID := Rule{
		ID:       "rule-without-txn",
		Type:     "categorization",
		Pattern:  "KROGER",
		Target:   "Food:Groceries",
		Priority: 5,
	}

	// Marshal both
	bWith, err := json.Marshal(withTxnID)
	if err != nil {
		t.Fatalf("Marshal withTxnID: %v", err)
	}
	bWithout, err := json.Marshal(withoutTxnID)
	if err != nil {
		t.Fatalf("Marshal withoutTxnID: %v", err)
	}

	// Verify transactionId presence/absence in raw JSON
	withStr := string(bWith)
	if want := `"transactionId":"abc123"`; !strings.Contains(withStr, want) {
		t.Errorf("JSON with TransactionID missing %s, got: %s", want, withStr)
	}

	withoutStr := string(bWithout)
	if strings.Contains(withoutStr, `"transactionId"`) {
		t.Errorf("JSON without TransactionID should omit key, got: %s", withoutStr)
	}

	// Unmarshal and verify round-trip
	var gotWith Rule
	if err := json.Unmarshal(bWith, &gotWith); err != nil {
		t.Fatalf("Unmarshal withTxnID: %v", err)
	}
	if gotWith.TransactionID != "abc123" {
		t.Errorf("round-trip TransactionID = %q, want abc123", gotWith.TransactionID)
	}
	if gotWith.ID != "rule-with-txn" {
		t.Errorf("round-trip ID = %q, want rule-with-txn", gotWith.ID)
	}
	if gotWith.Target != "Food:Dining" {
		t.Errorf("round-trip Target = %q, want Food:Dining", gotWith.Target)
	}

	var gotWithout Rule
	if err := json.Unmarshal(bWithout, &gotWithout); err != nil {
		t.Fatalf("Unmarshal withoutTxnID: %v", err)
	}
	if gotWithout.TransactionID != "" {
		t.Errorf("round-trip TransactionID = %q, want empty", gotWithout.TransactionID)
	}
}

func TestWriteFileAtomicity(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "subdir", "budget.json")

	// Writing to nonexistent subdirectory should fail (not create it)
	err := WriteFile(path, Output{Version: 1}, "")
	if err == nil {
		t.Fatal("expected error writing to nonexistent directory")
	}
}

// minimalOutput returns a valid Output with one transaction and the given groupName.
// Reduces boilerplate in tests that only need a round-trippable payload.
func minimalOutput(groupName string) Output {
	return Output{
		Version:            1,
		GroupName:          groupName,
		Transactions:       []Transaction{{ID: "t1", Institution: "x", Account: "1", Description: "X", Amount: 1, Timestamp: "2025-01-01T00:00:00Z", StatementID: "x-1-2025-01", Category: "C"}},
		Budgets:            []Budget{},
		BudgetPeriods:      []BudgetPeriod{},
		Rules:              []Rule{},
		NormalizationRules: []NormalizationRule{},
	}
}

func TestEncryptDecryptRoundTrip(t *testing.T) {
	original := minimalOutput("household")

	dir := t.TempDir()
	path := filepath.Join(dir, "encrypted.json")

	if err := WriteFile(path, original, "hunter2"); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	got, err := ReadFile(path, "hunter2")
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	if got.Version != original.Version {
		t.Errorf("version = %d, want %d", got.Version, original.Version)
	}
	if got.GroupName != original.GroupName {
		t.Errorf("groupName = %q, want %q", got.GroupName, original.GroupName)
	}
	if len(got.Transactions) != len(original.Transactions) {
		t.Fatalf("transactions = %d, want %d", len(got.Transactions), len(original.Transactions))
	}
	if got.Transactions[0].ID != original.Transactions[0].ID {
		t.Errorf("txn[0].id = %q, want %q", got.Transactions[0].ID, original.Transactions[0].ID)
	}
}

func TestEncryptedWrongPassword(t *testing.T) {
	original := minimalOutput("test")

	dir := t.TempDir()
	path := filepath.Join(dir, "encrypted.json")

	if err := WriteFile(path, original, "passwordA"); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	_, err := ReadFile(path, "passwordB")
	if err == nil {
		t.Fatal("expected error when reading with wrong password")
	}
	if !strings.Contains(err.Error(), "wrong password") {
		t.Errorf("error = %q, want it to contain 'wrong password'", err.Error())
	}
}

func TestPlaintextBackwardCompat(t *testing.T) {
	original := minimalOutput("compat-test")

	dir := t.TempDir()
	path := filepath.Join(dir, "plaintext.json")

	if err := WriteFile(path, original, ""); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	got, err := ReadFile(path, "")
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	if got.GroupName != "compat-test" {
		t.Errorf("groupName = %q, want compat-test", got.GroupName)
	}
	if len(got.Transactions) != 1 {
		t.Errorf("transactions = %d, want 1", len(got.Transactions))
	}
}

func TestIsEncrypted(t *testing.T) {
	tests := []struct {
		name string
		data []byte
		want bool
	}{
		{"BENC magic", []byte{'B', 'E', 'N', 'C', 0x00, 0x01}, true},
		{"plaintext JSON", []byte(`{"version":1}`), false},
		{"empty", []byte{}, false},
		{"too short", []byte{'B', 'E', 'N'}, false},
		{"wrong magic", []byte{'X', 'E', 'N', 'C'}, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsEncrypted(tt.data); got != tt.want {
				t.Errorf("IsEncrypted(%v) = %v, want %v", tt.data, got, tt.want)
			}
		})
	}
}

func TestEncryptedFileNoPassword(t *testing.T) {
	original := minimalOutput("test")

	dir := t.TempDir()
	path := filepath.Join(dir, "encrypted.json")

	if err := WriteFile(path, original, "secret"); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	_, err := ReadFile(path, "")
	if err == nil {
		t.Fatal("expected error reading encrypted file without password")
	}
	if !strings.Contains(err.Error(), "file is encrypted but no password was provided") {
		t.Errorf("error = %q, want it to contain 'file is encrypted but no password was provided'", err.Error())
	}
}

func TestPlaintextFileWithPassword(t *testing.T) {
	original := minimalOutput("test")

	dir := t.TempDir()
	path := filepath.Join(dir, "plaintext.json")

	if err := WriteFile(path, original, ""); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	// Reading plaintext with a password should succeed — the password
	// is only used for encrypting output.
	got, err := ReadFile(path, "some-password")
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if got.GroupName != original.GroupName {
		t.Errorf("GroupName = %q, want %q", got.GroupName, original.GroupName)
	}
}

func TestJournalEntryRoundTrip(t *testing.T) {
	note := "quarterly adjustment"
	entryID := "je-001"

	entry := JournalEntry{
		ID:          entryID,
		Timestamp:   "2025-06-15T10:30:00Z",
		Description: "Transfer to savings",
		Note:        &note,
		LegCount:    2,
	}

	b, err := json.Marshal(entry)
	if err != nil {
		t.Fatalf("Marshal JournalEntry: %v", err)
	}

	var got JournalEntry
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("Unmarshal JournalEntry: %v", err)
	}

	if got.ID != entryID {
		t.Errorf("id = %q, want %q", got.ID, entryID)
	}
	if got.Timestamp != "2025-06-15T10:30:00Z" {
		t.Errorf("timestamp = %q, want 2025-06-15T10:30:00Z", got.Timestamp)
	}
	if got.Description != "Transfer to savings" {
		t.Errorf("description = %q, want Transfer to savings", got.Description)
	}
	if got.Note == nil || *got.Note != note {
		t.Errorf("note = %v, want %q", got.Note, note)
	}
	if got.LegCount != 2 {
		t.Errorf("legCount = %d, want 2", got.LegCount)
	}

	// Nil note round-trips as JSON null.
	entryNoNote := JournalEntry{
		ID:          "je-002",
		Timestamp:   "2025-06-15T10:30:00Z",
		Description: "Paycheck",
		Note:        nil,
		LegCount:    2,
	}
	b2, err := json.Marshal(entryNoNote)
	if err != nil {
		t.Fatalf("Marshal JournalEntry (nil note): %v", err)
	}
	var got2 JournalEntry
	if err := json.Unmarshal(b2, &got2); err != nil {
		t.Fatalf("Unmarshal JournalEntry (nil note): %v", err)
	}
	if got2.Note != nil {
		t.Errorf("note = %v, want nil", got2.Note)
	}
}

func TestJournalLegRoundTrip(t *testing.T) {
	reconciledAt := "2025-06-20T00:00:00Z"
	reconciledEventID := "event-999"
	statementItemID := "stmt-item-42"

	leg := JournalLeg{
		ID:                "jl-001",
		EntryID:           "je-001",
		AccountID:         "acct-bankone-1234",
		Debit:             52.30,
		Credit:            0,
		Timestamp:         "2025-06-15T10:30:00Z",
		Cleared:           true,
		ReconciledAt:      &reconciledAt,
		ReconciledEventID: &reconciledEventID,
		StatementItemID:   &statementItemID,
	}

	b, err := json.Marshal(leg)
	if err != nil {
		t.Fatalf("Marshal JournalLeg: %v", err)
	}

	var got JournalLeg
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("Unmarshal JournalLeg: %v", err)
	}

	if got.ID != "jl-001" {
		t.Errorf("id = %q, want jl-001", got.ID)
	}
	if got.EntryID != "je-001" {
		t.Errorf("entryId = %q, want je-001", got.EntryID)
	}
	if got.AccountID != "acct-bankone-1234" {
		t.Errorf("accountId = %q, want acct-bankone-1234", got.AccountID)
	}
	if got.Debit != 52.30 {
		t.Errorf("debit = %v, want 52.30", got.Debit)
	}
	if got.Credit != 0 {
		t.Errorf("credit = %v, want 0", got.Credit)
	}
	if !got.Cleared {
		t.Errorf("cleared = false, want true")
	}
	if got.ReconciledAt == nil || *got.ReconciledAt != reconciledAt {
		t.Errorf("reconciledAt = %v, want %q", got.ReconciledAt, reconciledAt)
	}
	if got.ReconciledEventID == nil || *got.ReconciledEventID != reconciledEventID {
		t.Errorf("reconciledEventId = %v, want %q", got.ReconciledEventID, reconciledEventID)
	}
	if got.StatementItemID == nil || *got.StatementItemID != statementItemID {
		t.Errorf("statementItemId = %v, want %q", got.StatementItemID, statementItemID)
	}

	// Nil optional fields round-trip as JSON null.
	legNoOptionals := JournalLeg{
		ID:        "jl-002",
		EntryID:   "je-001",
		AccountID: "acct-bankone-1234",
		Debit:     0,
		Credit:    100.00,
		Timestamp: "2025-06-15T10:30:00Z",
		Cleared:   false,
	}
	b2, err := json.Marshal(legNoOptionals)
	if err != nil {
		t.Fatalf("Marshal JournalLeg (nil optionals): %v", err)
	}
	var got2 JournalLeg
	if err := json.Unmarshal(b2, &got2); err != nil {
		t.Fatalf("Unmarshal JournalLeg (nil optionals): %v", err)
	}
	if got2.ReconciledAt != nil {
		t.Errorf("reconciledAt = %v, want nil", got2.ReconciledAt)
	}
	if got2.ReconciledEventID != nil {
		t.Errorf("reconciledEventId = %v, want nil", got2.ReconciledEventID)
	}
	if got2.StatementItemID != nil {
		t.Errorf("statementItemId = %v, want nil", got2.StatementItemID)
	}
	if got2.Cleared {
		t.Errorf("cleared = true, want false")
	}
	if got2.Debit != 0 {
		t.Errorf("debit = %v, want 0", got2.Debit)
	}
	if got2.Credit != 100.00 {
		t.Errorf("credit = %v, want 100.00", got2.Credit)
	}
}

func TestAccountRoundTrip(t *testing.T) {
	openingBalance := 500.00
	openingBalanceDate := "2025-01-01T00:00:00Z"

	acct := Account{
		ID:                 "acct-bankone-1234",
		Institution:        "bankone",
		Account:            "1234",
		AccountType:        "asset",
		OpeningBalance:     &openingBalance,
		OpeningBalanceDate: &openingBalanceDate,
	}

	b, err := json.Marshal(acct)
	if err != nil {
		t.Fatalf("Marshal Account: %v", err)
	}

	var got Account
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("Unmarshal Account: %v", err)
	}

	if got.ID != "acct-bankone-1234" {
		t.Errorf("id = %q, want acct-bankone-1234", got.ID)
	}
	if got.Institution != "bankone" {
		t.Errorf("institution = %q, want bankone", got.Institution)
	}
	if got.Account != "1234" {
		t.Errorf("account = %q, want 1234", got.Account)
	}
	if got.AccountType != "asset" {
		t.Errorf("accountType = %q, want asset", got.AccountType)
	}
	if got.OpeningBalance == nil || *got.OpeningBalance != openingBalance {
		t.Errorf("openingBalance = %v, want %v", got.OpeningBalance, openingBalance)
	}
	if got.OpeningBalanceDate == nil || *got.OpeningBalanceDate != openingBalanceDate {
		t.Errorf("openingBalanceDate = %v, want %q", got.OpeningBalanceDate, openingBalanceDate)
	}

	// Nil optional fields round-trip as JSON null.
	acctNoOptionals := Account{
		ID:          "acct-banktwo-5678",
		Institution: "banktwo",
		Account:     "5678",
		AccountType: "liability",
	}
	b2, err := json.Marshal(acctNoOptionals)
	if err != nil {
		t.Fatalf("Marshal Account (nil optionals): %v", err)
	}
	var got2 Account
	if err := json.Unmarshal(b2, &got2); err != nil {
		t.Fatalf("Unmarshal Account (nil optionals): %v", err)
	}
	if got2.OpeningBalance != nil {
		t.Errorf("openingBalance = %v, want nil", got2.OpeningBalance)
	}
	if got2.OpeningBalanceDate != nil {
		t.Errorf("openingBalanceDate = %v, want nil", got2.OpeningBalanceDate)
	}
}

func TestTransactionJournalEntryIDRoundTrip(t *testing.T) {
	jeID := "je-001"

	txnWithID := Transaction{
		ID:             "txn-001",
		Institution:    "bankone",
		Account:        "1234",
		Description:    "KROGER #1234",
		Amount:         52.30,
		Timestamp:      "2025-06-10T00:00:00Z",
		StatementID:    "bankone-1234-2025-06",
		Category:       "Food:Groceries",
		JournalEntryID: &jeID,
	}

	b, err := json.Marshal(txnWithID)
	if err != nil {
		t.Fatalf("Marshal Transaction with JournalEntryID: %v", err)
	}

	var got Transaction
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("Unmarshal Transaction with JournalEntryID: %v", err)
	}

	if got.JournalEntryID == nil || *got.JournalEntryID != jeID {
		t.Errorf("journalEntryId = %v, want %q", got.JournalEntryID, jeID)
	}

	// Nil JournalEntryID round-trips as JSON null.
	txnNoID := Transaction{
		ID:          "txn-002",
		Institution: "bankone",
		Account:     "1234",
		Description: "ATM WITHDRAWAL",
		Amount:      20.00,
		Timestamp:   "2025-06-11T00:00:00Z",
		StatementID: "bankone-1234-2025-06",
		Category:    "Cash",
	}
	b2, err := json.Marshal(txnNoID)
	if err != nil {
		t.Fatalf("Marshal Transaction without JournalEntryID: %v", err)
	}
	var got2 Transaction
	if err := json.Unmarshal(b2, &got2); err != nil {
		t.Fatalf("Unmarshal Transaction without JournalEntryID: %v", err)
	}
	if got2.JournalEntryID != nil {
		t.Errorf("journalEntryId = %v, want nil", got2.JournalEntryID)
	}

	// Verify JSON key name is camelCase.
	if !strings.Contains(string(b), `"journalEntryId":"je-001"`) {
		t.Errorf("JSON missing journalEntryId key, got: %s", string(b))
	}
}

func TestOutputCarriesJournalCollections(t *testing.T) {
	note := "initial entry"
	reconciledAt := "2025-06-20T00:00:00Z"
	openingBalance := 1000.00
	openingBalanceDate := "2025-01-01T00:00:00Z"
	jeID := "je-001"

	out := Output{
		Version:   1,
		GroupName: "household",
		Transactions: []Transaction{
			{
				ID:             "txn-001",
				Institution:    "bankone",
				Account:        "1234",
				Description:    "KROGER #1234",
				Amount:         52.30,
				Timestamp:      "2025-06-10T00:00:00Z",
				StatementID:    "bankone-1234-2025-06",
				Category:       "Food:Groceries",
				JournalEntryID: &jeID,
			},
		},
		JournalEntries: []JournalEntry{
			{
				ID:          "je-001",
				Timestamp:   "2025-06-10T00:00:00Z",
				Description: "KROGER #1234",
				Note:        &note,
				LegCount:    2,
			},
		},
		JournalLegs: []JournalLeg{
			{
				ID:           "jl-001",
				EntryID:      "je-001",
				AccountID:    "acct-bankone-1234",
				Debit:        52.30,
				Credit:       0,
				Timestamp:    "2025-06-10T00:00:00Z",
				Cleared:      true,
				ReconciledAt: &reconciledAt,
			},
		},
		Accounts: []Account{
			{
				ID:                 "acct-bankone-1234",
				Institution:        "bankone",
				Account:            "1234",
				AccountType:        "asset",
				OpeningBalance:     &openingBalance,
				OpeningBalanceDate: &openingBalanceDate,
			},
		},
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "budget.json")

	if err := WriteFile(path, out, ""); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	var got Output
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	if len(got.JournalEntries) != 1 {
		t.Fatalf("journalEntries count = %d, want 1", len(got.JournalEntries))
	}
	if got.JournalEntries[0].ID != "je-001" {
		t.Errorf("journalEntries[0].id = %q, want je-001", got.JournalEntries[0].ID)
	}
	if got.JournalEntries[0].LegCount != 2 {
		t.Errorf("journalEntries[0].legCount = %d, want 2", got.JournalEntries[0].LegCount)
	}

	if len(got.JournalLegs) != 1 {
		t.Fatalf("journalLegs count = %d, want 1", len(got.JournalLegs))
	}
	if got.JournalLegs[0].Debit != 52.30 {
		t.Errorf("journalLegs[0].debit = %v, want 52.30", got.JournalLegs[0].Debit)
	}
	if !got.JournalLegs[0].Cleared {
		t.Errorf("journalLegs[0].cleared = false, want true")
	}
	if got.JournalLegs[0].ReconciledAt == nil || *got.JournalLegs[0].ReconciledAt != reconciledAt {
		t.Errorf("journalLegs[0].reconciledAt = %v, want %q", got.JournalLegs[0].ReconciledAt, reconciledAt)
	}

	if len(got.Accounts) != 1 {
		t.Fatalf("accounts count = %d, want 1", len(got.Accounts))
	}
	if got.Accounts[0].AccountType != "asset" {
		t.Errorf("accounts[0].accountType = %q, want asset", got.Accounts[0].AccountType)
	}

	if got.Transactions[0].JournalEntryID == nil || *got.Transactions[0].JournalEntryID != "je-001" {
		t.Errorf("transactions[0].journalEntryId = %v, want je-001", got.Transactions[0].JournalEntryID)
	}
}

func TestJournalLegValidate(t *testing.T) {
	tests := []struct {
		name    string
		leg     JournalLeg
		wantErr bool
	}{
		{"valid debit-only", JournalLeg{Debit: 52.30, Credit: 0}, false},
		{"valid credit-only", JournalLeg{Debit: 0, Credit: 100.00}, false},
		{"both zero", JournalLeg{Debit: 0, Credit: 0}, false},
		{"both positive", JournalLeg{Debit: 10, Credit: 10}, true},
		{"negative debit", JournalLeg{Debit: -1, Credit: 0}, true},
		{"negative credit", JournalLeg{Debit: 0, Credit: -1}, true},
		{"NaN debit", JournalLeg{Debit: math.NaN(), Credit: 0}, true},
		{"+Inf credit", JournalLeg{Debit: 0, Credit: math.Inf(1)}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.leg.Validate()
			if tt.wantErr && err == nil {
				t.Errorf("Validate() = nil, want error")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("Validate() = %v, want nil", err)
			}
		})
	}
}

func TestAccountValidate(t *testing.T) {
	tests := []struct {
		name    string
		acctType AccountType
		wantErr bool
	}{
		{"asset", AccountTypeAsset, false},
		{"liability", AccountTypeLiability, false},
		{"equity", AccountTypeEquity, false},
		{"income", AccountTypeIncome, false},
		{"expense", AccountTypeExpense, false},
		{"unknown", AccountType("checking"), true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := Account{ID: "a1", AccountType: tt.acctType}.Validate()
			if tt.wantErr && err == nil {
				t.Errorf("Validate() = nil, want error")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("Validate() = %v, want nil", err)
			}
		})
	}
}

func TestWriteFileValidatesOutput(t *testing.T) {
	validLeg := JournalLeg{
		ID: "jl-001", EntryID: "je-001", AccountID: "acct-1",
		Debit: 52.30, Credit: 0, Timestamp: "2025-06-10T00:00:00Z",
	}
	validAcct := Account{
		ID: "acct-1", Institution: "bankone", Account: "1234",
		AccountType: AccountTypeAsset,
	}

	t.Run("valid output round-trips", func(t *testing.T) {
		out := minimalOutput("household")
		out.JournalLegs = []JournalLeg{validLeg}
		out.Accounts = []Account{validAcct}

		path := filepath.Join(t.TempDir(), "budget.json")
		if err := WriteFile(path, out, ""); err != nil {
			t.Fatalf("WriteFile: %v", err)
		}
		got, err := ReadFile(path, "")
		if err != nil {
			t.Fatalf("ReadFile: %v", err)
		}
		if len(got.JournalLegs) != 1 || len(got.Accounts) != 1 {
			t.Fatalf("round-trip lost journal collections: legs=%d accounts=%d", len(got.JournalLegs), len(got.Accounts))
		}
	})

	t.Run("invalid leg writes no file", func(t *testing.T) {
		out := minimalOutput("household")
		out.JournalLegs = []JournalLeg{{ID: "jl-bad", Debit: 10, Credit: 10}}
		out.Accounts = []Account{validAcct}

		path := filepath.Join(t.TempDir(), "budget.json")
		err := WriteFile(path, out, "")
		if err == nil {
			t.Fatal("WriteFile: expected error for invalid leg")
		}
		if !strings.Contains(err.Error(), "journalLegs[0]") {
			t.Errorf("error should name the offending leg index, got %v", err)
		}
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Errorf("file should not exist after validation failure, stat err = %v", err)
		}
	})

	t.Run("invalid account writes no file", func(t *testing.T) {
		out := minimalOutput("household")
		out.JournalLegs = []JournalLeg{validLeg}
		out.Accounts = []Account{{ID: "acct-bad", AccountType: AccountType("checking")}}

		path := filepath.Join(t.TempDir(), "budget.json")
		err := WriteFile(path, out, "")
		if err == nil {
			t.Fatal("WriteFile: expected error for invalid account")
		}
		if !strings.Contains(err.Error(), "accounts[0]") {
			t.Errorf("error should name the offending account index, got %v", err)
		}
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Errorf("file should not exist after validation failure, stat err = %v", err)
		}
	})
}

// TestWriteGoldenFile generates a BENC-encrypted golden file for cross-implementation
// interop testing (Go encrypts → TypeScript decrypts). Skipped unless -generate-golden
// flag is set. Run manually:
//
//	go test -run TestWriteGoldenFile -args -generate-golden
func TestWriteGoldenFile(t *testing.T) {
	if !*generateGolden {
		t.Skip("skipped unless -generate-golden flag is set")
	}

	plaintext := Output{
		Version:            1,
		GroupName:          "golden",
		Transactions:       []Transaction{},
		Budgets:            []Budget{},
		BudgetPeriods:      []BudgetPeriod{},
		Rules:              []Rule{},
		NormalizationRules: []NormalizationRule{},
	}

	plaintextJSON, err := json.MarshalIndent(plaintext, "", "  ")
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	plaintextJSON = append(plaintextJSON, '\n')

	encrypted, err := encryptJSON(plaintextJSON, "interop-test")
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}

	// Verify round-trip in Go before writing
	decrypted, err := decryptJSON(encrypted, "interop-test")
	if err != nil {
		t.Fatalf("decrypt round-trip: %v", err)
	}
	var roundTrip Output
	if err := json.Unmarshal(decrypted, &roundTrip); err != nil {
		t.Fatalf("unmarshal round-trip: %v", err)
	}
	if roundTrip.GroupName != "golden" {
		t.Fatalf("round-trip groupName = %q, want golden", roundTrip.GroupName)
	}

	fixtureDir := filepath.Join("..", "..", "..", "budget", "test", "fixtures")
	if err := os.MkdirAll(fixtureDir, 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}

	goldenPath := filepath.Join(fixtureDir, "golden.benc")
	if err := os.WriteFile(goldenPath, encrypted, 0644); err != nil {
		t.Fatalf("write golden.benc: %v", err)
	}
	t.Logf("wrote %s (%d bytes)", goldenPath, len(encrypted))

	plaintextPath := filepath.Join(fixtureDir, "golden-plaintext.json")
	if err := os.WriteFile(plaintextPath, plaintextJSON, 0644); err != nil {
		t.Fatalf("write golden-plaintext.json: %v", err)
	}
	t.Logf("wrote %s (%d bytes)", plaintextPath, len(plaintextJSON))
}
