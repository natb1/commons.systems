package parse

import (
	"os"
	"path/filepath"
	"strings"
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

// TestParseSGMLBalance_Bounded verifies that parseSGMLBalance is clamped to the
// LEDGERBAL aggregate and does not borrow tag values from a later unrelated block.
func TestParseSGMLBalance_Bounded(t *testing.T) {
	t.Run("empty BALAMT does not borrow from later block", func(t *testing.T) {
		// First LEDGERBAL has no BALAMT; a later unrelated block carries one.
		// Before the fix, parseSGMLBalance would scan past </LEDGERBAL> and find
		// the later BALAMT, silently returning 999.99. After the fix it must error.
		text := `<LEDGERBAL>
<DTASOF>20250101
</LEDGERBAL>
<OTHERBLOCK>
<BALAMT>999.99
</OTHERBLOCK>`
		_, err := parseSGMLBalance(text)
		if err == nil {
			t.Fatal("expected error for LEDGERBAL with empty BALAMT, got nil")
		}
		if !strings.Contains(err.Error(), "BALAMT is empty") {
			t.Errorf("error = %q, want it to contain %q", err.Error(), "BALAMT is empty")
		}
	})

	t.Run("well-formed LEDGERBAL parses correctly", func(t *testing.T) {
		text := `<LEDGERBAL>
<BALAMT>123.45
<DTASOF>20250101
</LEDGERBAL>`
		bal, err := parseSGMLBalance(text)
		if err != nil {
			t.Fatalf("parseSGMLBalance: %v", err)
		}
		if bal.cents != 12345 {
			t.Errorf("cents = %d, want 12345", bal.cents)
		}
	})
}

// TestDecodeWindows1252 verifies the CP1252 byte-to-rune decoding, including the
// 0x80–0x9F high range and the five CP1252-undefined bytes mapped to U+FFFD.
func TestDecodeWindows1252(t *testing.T) {
	tests := []struct {
		name string
		in   []byte
		want string
	}{
		{"ascii identity", []byte("Hello"), "Hello"},
		{"euro sign 0x80", []byte{0x80}, string(rune(0x20AC))},
		{"left double quote 0x93", []byte{0x93}, string(rune(0x201C))},
		{"right double quote 0x94", []byte{0x94}, string(rune(0x201D))},
		{"latin1 e-acute 0xE9", []byte{0xE9}, string(rune(0xE9))},
		{"undefined 0x81", []byte{0x81}, "�"},
		{"undefined 0x8D", []byte{0x8D}, "�"},
		{"undefined 0x8F", []byte{0x8F}, "�"},
		{"undefined 0x90", []byte{0x90}, "�"},
		{"undefined 0x9D", []byte{0x9D}, "�"},
		{"mixed right single quote", []byte{0x41, 0x92, 0x42}, "A’B"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := decodeWindows1252(tt.in); got != tt.want {
				t.Errorf("decodeWindows1252(%v) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

// TestSGMLCharset verifies CHARSET: header extraction.
func TestSGMLCharset(t *testing.T) {
	tests := []struct {
		name   string
		header string
		want   string
	}{
		{
			name:   "charset present",
			header: "OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\nCHARSET:1252\nCOMPRESSION:NONE\n",
			want:   "1252",
		},
		{
			name:   "charset absent",
			header: "OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\nCOMPRESSION:NONE\n",
			want:   "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := sgmlCharset(tt.header); got != tt.want {
				t.Errorf("sgmlCharset() = %q, want %q", got, tt.want)
			}
		})
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
