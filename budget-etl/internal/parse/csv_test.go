package parse

import (
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
		amount float64
		desc   string
		typ    string // for documentation
	}{
		{0, "088790257", "2025-06-11", -400.00, "Mobile Deposit Reference No.  088790257", "CREDIT"},
		{1, "000251620", "2025-06-13", -3001.83, "Direct Deposit - Reg-Salary Johns Hopkins", "CREDIT"},
		{2, "MACEX03922", "2025-06-16", 202.00, "ATM Withdrawal 15555 Eastern Ave baltimore MD", "DEBIT"},
		{3, "MACEX03922", "2025-06-16", 3.00, "ATM Transaction Fee - Withdrawal", "DEBIT"},
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
				t.Errorf("Amount = %f, want %f", txn.Amount, tt.amount)
			}
			if txn.Description != tt.desc {
				t.Errorf("Description = %q, want %q", txn.Description, tt.desc)
			}
		})
	}
}
