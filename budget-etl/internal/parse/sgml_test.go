package parse

import (
	"os"
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

	// Balance: LEDGERBAL BALAMT=8500.00 → 543210 cents
	if result.Balance != 543210 {
		t.Errorf("Balance = %d, want %d", result.Balance, 543210)
	}

	// First: DEBIT, TRNAMT=-81.71 → budget amount = +8171 cents
	t.Run("debit", func(t *testing.T) {
		txn := txns[0]
		if txn.TransactionID != "1234567890202510172" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "1234567890202510172")
		}
		// Date-only parsing: 20251017120000 → 2025-10-17
		wantDate, _ := time.Parse("20060102", "20251017")
		if !txn.Date.Equal(wantDate) {
			t.Errorf("Date = %v, want %v", txn.Date, wantDate)
		}
		if txn.Amount != 8171 {
			t.Errorf("Amount = %d, want %d", txn.Amount, 8171)
		}
		if txn.Description != "Debit Card Purchase Grocery Store #456" {
			t.Errorf("Description = %q, want %q", txn.Description, "Debit Card Purchase Grocery Store #456")
		}
	})

	// Second: CREDIT, TRNAMT=3000.00 → budget amount = -300183 cents
	t.Run("credit", func(t *testing.T) {
		txn := txns[1]
		if txn.TransactionID != "1234567890202510101" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "1234567890202510101")
		}
		if txn.Amount != -300183 {
			t.Errorf("Amount = %d, want %d", txn.Amount, -300183)
		}
	})
}

func TestParseSGML_NoTransactions(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "empty.qfx")
	content := "OFXHEADER:100\nDATA:OFXSGML\n<OFX>\n<BANKMSGSRSV1>\n</BANKMSGSRSV1>\n</OFX>\n"
	if err := os.WriteFile(tmp, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := parseSGML(tmp)
	if err == nil {
		t.Fatal("expected error for SGML with no transactions")
	}
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
