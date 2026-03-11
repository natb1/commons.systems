package parse

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestParseCSV(t *testing.T) {
	path := filepath.Join("testdata", "pnc.csv")
	result, err := parseCSV(path)
	if err != nil {
		t.Fatalf("parseCSV: %v", err)
	}
	if result.Skipped {
		t.Fatal("expected non-skipped result")
	}

	txns := result.Transactions
	if len(txns) != 4 {
		t.Fatalf("expected 4 transactions, got %d", len(txns))
	}

	tests := []struct {
		idx    int
		id     string
		date   string
		amount int64 // cents
		desc   string
		typ    string // for documentation
	}{
		{0, "088790257", "2025-06-11", -40000, "Mobile Deposit Reference No.  088790257", "CREDIT"},
		{1, "000251620", "2025-06-13", -300183, "Direct Deposit - Reg-Salary Johns Hopkins", "CREDIT"},
		{2, "MACEX03922", "2025-06-16", 20200, "ATM Withdrawal 15555 Eastern Ave baltimore MD", "DEBIT"},
		{3, "MACEX03922-2", "2025-06-16", 300, "ATM Transaction Fee - Withdrawal", "DEBIT"},
	}

	for _, tt := range tests {
		t.Run(tt.id, func(t *testing.T) {
			txn := txns[tt.idx]
			if txn.TransactionID != tt.id {
				t.Errorf("TransactionID = %q, want %q", txn.TransactionID, tt.id)
			}
			wantDate, _ := time.Parse("2006-01-02", tt.date)
			if !txn.Date.Equal(wantDate) {
				t.Errorf("Date = %v, want %v", txn.Date, wantDate)
			}
			if txn.Amount != tt.amount {
				t.Errorf("Amount = %d, want %d", txn.Amount, tt.amount)
			}
			if txn.Description != tt.desc {
				t.Errorf("Description = %q, want %q", txn.Description, tt.desc)
			}
		})
	}
}

func TestParseCSV_EmptyFile(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "empty.csv")
	if err := os.WriteFile(tmp, []byte("Date,Amount,Description,,TransactionID,Type\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := parseCSV(tmp)
	if err == nil {
		t.Fatal("expected error for CSV with no data rows")
	}
}

func TestParseCSV_DuplicateIDs(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "dupes.csv")
	content := "00000000005306485111,2025/06/11,2025/07/10,14296.14,9864.10\n" +
		"2025/06/16,202.00,\"ATM Withdrawal\",,\"MACEX03922\",\"DEBIT\"\n" +
		"2025/06/16,3.00,\"ATM Fee\",,\"MACEX03922\",\"DEBIT\"\n" +
		"2025/06/16,5.00,\"ATM Fee 2\",,\"MACEX03922\",\"DEBIT\"\n"
	if err := os.WriteFile(tmp, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	result, err := parseCSV(tmp)
	if err != nil {
		t.Fatalf("parseCSV: %v", err)
	}
	txns := result.Transactions
	if len(txns) != 3 {
		t.Fatalf("expected 3 transactions, got %d", len(txns))
	}
	if txns[0].TransactionID != "MACEX03922" {
		t.Errorf("txn 0: ID = %q, want %q", txns[0].TransactionID, "MACEX03922")
	}
	if txns[1].TransactionID != "MACEX03922-2" {
		t.Errorf("txn 1: ID = %q, want %q", txns[1].TransactionID, "MACEX03922-2")
	}
	if txns[2].TransactionID != "MACEX03922-3" {
		t.Errorf("txn 2: ID = %q, want %q", txns[2].TransactionID, "MACEX03922-3")
	}
}
