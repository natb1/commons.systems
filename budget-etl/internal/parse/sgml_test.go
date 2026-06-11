package parse

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/journal"
)

func TestParseSGML(t *testing.T) {
	path := filepath.Join("testdata", "bankone.qfx")
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

	// Balance: LEDGERBAL BALAMT=8500.00 → 850000 cents
	if result.Balance != 850000 {
		t.Errorf("Balance = %d, want %d", result.Balance, 850000)
	}

	// Guard: a bank/checking statement must not be detected as a credit card.
	if result.IsCreditCard {
		t.Errorf("bankone.qfx: expected IsCreditCard == false, got true")
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

	// Second: CREDIT, TRNAMT=3000.00 → budget amount = -300000 cents
	t.Run("credit", func(t *testing.T) {
		txn := txns[1]
		if txn.TransactionID != "1234567890202510101" {
			t.Errorf("TransactionID = %q, want %q", txn.TransactionID, "1234567890202510101")
		}
		if txn.Amount != -300000 {
			t.Errorf("Amount = %d, want %d", txn.Amount, -300000)
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

// TestParseSGML_CreditCardLiability covers both acceptance criteria of #1270 at
// the real seam: parseSGML detects CREDITCARDMSGSRSV1 and sets IsCreditCard, and
// the journal layer then types the card account as a liability.
func TestParseSGML_CreditCardLiability(t *testing.T) {
	path := filepath.Join("testdata", "creditcard.qfx")
	result, err := parseSGML(path)
	if err != nil {
		t.Fatalf("parseSGML: %v", err)
	}
	if result.Skipped {
		t.Fatal("expected non-skipped result for credit-card statement")
	}
	if len(result.Transactions) == 0 {
		t.Fatal("expected at least one transaction")
	}
	// Criterion 1: the SGML parser detects the credit-card message set.
	if !result.IsCreditCard {
		t.Fatal("expected IsCreditCard == true for a CREDITCARDMSGSRSV1 statement")
	}
	// Balance: LEDGERBAL BALAMT=-45.00 → -4500 cents.
	if result.Balance != -4500 {
		t.Errorf("Balance = %d, want -4500", result.Balance)
	}

	// Convert parsed transactions into budget.TransactionData, mirroring the
	// field mapping in main.go, and carry the IsCreditCard flag through.
	const inst, acct = "Test Bank", "Test Card"
	var txns []budget.TransactionData
	for _, tr := range result.Transactions {
		txns = append(txns, budget.TransactionData{
			Institution:   inst,
			Account:       acct,
			Description:   tr.Description,
			Amount:        tr.Amount,
			Timestamp:     tr.Date,
			StatementID:   "test-stmt",
			TransactionID: tr.TransactionID,
			IsCreditCard:  result.IsCreditCard,
		})
	}

	// Criterion 2: the journal layer types the card account as a liability.
	r := journal.Build(txns, nil, nil, journal.DefaultPairWindow)
	wantID := inst + "_" + acct
	var found bool
	for _, a := range r.Accounts {
		if a.ID == wantID {
			found = true
			if a.AccountType != export.AccountTypeLiability {
				t.Errorf("account %q AccountType = %q, want %q", a.ID, a.AccountType, export.AccountTypeLiability)
			}
		}
	}
	if !found {
		t.Fatalf("account %q not found in journal result", wantID)
	}
}
