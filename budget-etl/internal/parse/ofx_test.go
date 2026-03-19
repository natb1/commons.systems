package parse

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestParseOFX(t *testing.T) {
	path := filepath.Join("testdata", "banktwo.ofx")
	result, err := parseOFX(path)
	if err != nil {
		t.Fatalf("parseOFX: %v", err)
	}
	if result.Skipped {
		t.Fatal("expected non-skipped result")
	}

	txns := result.Transactions
	if len(txns) != 2 {
		t.Fatalf("expected 2 transactions, got %d", len(txns))
	}

	// First: DEBIT, TRNAMT=-16.19 → budget amount = +1619 cents (spending)
	t.Run("debit", func(t *testing.T) {
		txn := txns[0]
		if txn.TransactionID != "202505221122069" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "202505221122069")
		}
		wantDate, _ := time.Parse("2006-01-02", "2025-05-22")
		if !txn.Date.Equal(wantDate) {
			t.Errorf("Date = %v, want %v", txn.Date, wantDate)
		}
		if txn.Amount != 1619 {
			t.Errorf("Amount = %d, want %d", txn.Amount, 1619)
		}
		if txn.Description != "GROCERY STORE #123" {
			t.Errorf("Description = %q, want %q", txn.Description, "GROCERY STORE #123")
		}
	})

	// Balance: LEDGERBAL BALAMT=-1234.56 → -123456 cents (raw signed, no inversion)
	if result.Balance != -123456 {
		t.Errorf("Balance = %d, want %d", result.Balance, -123456)
	}

	// Second: CREDIT, TRNAMT=50.00 → budget amount = -5000 cents (income)
	t.Run("credit", func(t *testing.T) {
		txn := txns[1]
		if txn.TransactionID != "202505201234567" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "202505201234567")
		}
		if txn.Amount != -5000 {
			t.Errorf("Amount = %d, want %d", txn.Amount, -5000)
		}
	})
}

func TestParseOFX_NoMessageBlocks(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "empty.ofx")
	content := `<?xml version="1.0" encoding="UTF-8"?>` + "\n" + `<OFX></OFX>`
	if err := os.WriteFile(tmp, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := parseOFX(tmp)
	if err == nil {
		t.Fatal("expected error for OFX with no message blocks")
	}
}
