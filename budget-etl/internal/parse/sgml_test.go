package parse

import (
	"path/filepath"
	"testing"
	"time"
)

func TestParseSGML(t *testing.T) {
	path := filepath.Join("testdata", "pnc.qfx")
	result, err := parseSGML(path)
	if err != nil {
		t.Fatalf("parseSGML: %v", err)
	}
	if result.Skipped {
		t.Fatal("expected non-skipped result")
	}

	txns := result.Transactions
	if len(txns) != 2 {
		t.Fatalf("expected 2 transactions, got %d", len(txns))
	}

	// First: DEBIT, TRNAMT=-81.71 → budget amount = +81.71
	t.Run("debit", func(t *testing.T) {
		txn := txns[0]
		if txn.TransactionID != "5306485111202510172" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "5306485111202510172")
		}
		wantDate, _ := time.Parse("20060102150405", "20251017120000")
		if !txn.Date.Equal(wantDate) {
			t.Errorf("Date = %v, want %v", txn.Date, wantDate)
		}
		if txn.Amount != 81.71 {
			t.Errorf("Amount = %f, want %f", txn.Amount, 81.71)
		}
		if txn.Description != "Debit Card Purchase Wholefds Ihbh #10638" {
			t.Errorf("Description = %q, want %q", txn.Description, "Debit Card Purchase Wholefds Ihbh #10638")
		}
	})

	// Second: CREDIT, TRNAMT=3001.83 → budget amount = -3001.83
	t.Run("credit", func(t *testing.T) {
		txn := txns[1]
		if txn.TransactionID != "5306485111202510101" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "5306485111202510101")
		}
		if txn.Amount != -3001.83 {
			t.Errorf("Amount = %f, want %f", txn.Amount, -3001.83)
		}
	})
}

func TestParseSGML_InvestmentSkip(t *testing.T) {
	path := filepath.Join("testdata", "investment.qfx")
	result, err := parseSGML(path)
	if err != nil {
		t.Fatalf("parseSGML: %v", err)
	}
	if !result.Skipped {
		t.Fatal("expected skipped result for investment account")
	}
	if result.SkipReason == "" {
		t.Fatal("expected non-empty skip reason")
	}
}
