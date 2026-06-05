package journal

import (
	"math"
	"reflect"
	"testing"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/export"
)

func ts(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return t
}

// legsByEntry indexes legs by their entry id.
func legsByEntry(legs []export.JournalLeg) map[string][]export.JournalLeg {
	m := map[string][]export.JournalLeg{}
	for _, l := range legs {
		m[l.EntryID] = append(m[l.EntryID], l)
	}
	return m
}

// assertBalanced checks that an entry's legs have equal total debits and
// credits within a cent.
func assertBalanced(t *testing.T, legs []export.JournalLeg) {
	t.Helper()
	var debit, credit float64
	for _, l := range legs {
		debit += l.Debit
		credit += l.Credit
	}
	if math.Abs(debit-credit) > 0.01 {
		t.Fatalf("entry not balanced: debits=%v credits=%v", debit, credit)
	}
}

// accountIDs returns the set of emitted account ids.
func accountIDs(accts []export.Account) map[string]string {
	m := map[string]string{}
	for _, a := range accts {
		m[a.ID] = string(a.AccountType)
	}
	return m
}

func TestExpenseLine(t *testing.T) {
	txns := []budget.TransactionData{
		{
			Institution:   "Example Bank",
			Account:       "Checking",
			Description:   "Grocery Store",
			Amount:        8450, // spending
			Timestamp:     ts("2025-02-05"),
			StatementID:   "stmt-1",
			TransactionID: "txn-1",
			Category:      "Groceries",
		},
	}
	r := Build(txns, nil, DefaultPairWindow)

	if len(r.Entries) != 1 || len(r.Legs) != 2 {
		t.Fatalf("expected 1 entry / 2 legs, got %d / %d", len(r.Entries), len(r.Legs))
	}
	assertBalanced(t, r.Legs)

	byEntry := legsByEntry(r.Legs)
	entryID := r.Entries[0].ID
	legs := byEntry[entryID]
	// Spending: credit Checking, debit Uncategorized Expense.
	var checking, expense export.JournalLeg
	for _, l := range legs {
		switch l.AccountID {
		case "Example Bank_Checking":
			checking = l
		case acctUncategorizedExpense:
			expense = l
		}
	}
	if checking.Credit != 84.50 || checking.Debit != 0 {
		t.Errorf("checking leg should be credit 84.50, got debit=%v credit=%v", checking.Debit, checking.Credit)
	}
	if expense.Debit != 84.50 || expense.Credit != 0 {
		t.Errorf("expense leg should be debit 84.50, got debit=%v credit=%v", expense.Debit, expense.Credit)
	}

	// journalEntryId mapping.
	docID := budget.TransactionDocID("stmt-1", "txn-1")
	if r.EntryIDByDocID[docID] != entryID {
		t.Errorf("EntryIDByDocID[%s]=%q, want %q", docID, r.EntryIDByDocID[docID], entryID)
	}

	// Account records: real account is asset, placeholder is expense.
	ids := accountIDs(r.Accounts)
	if ids["Example Bank_Checking"] != "asset" {
		t.Errorf("Checking should be asset, got %q", ids["Example Bank_Checking"])
	}
	if ids[acctUncategorizedExpense] != "expense" {
		t.Errorf("Uncategorized Expense should be expense, got %q", ids[acctUncategorizedExpense])
	}
	if _, ok := ids[acctUncategorizedIncome]; ok {
		t.Errorf("Uncategorized Income should not be emitted (unreferenced)")
	}

	// New-leg defaults.
	for _, l := range r.Legs {
		if l.Cleared || l.ReconciledAt != nil || l.ReconciledEventID != nil || l.StatementItemID != nil {
			t.Errorf("leg %s should carry new-import defaults", l.ID)
		}
	}
}

func TestIncomeLine(t *testing.T) {
	txns := []budget.TransactionData{
		{
			Institution:   "Example Bank",
			Account:       "Checking",
			Description:   "Payroll Deposit",
			Amount:        -240000, // income
			Timestamp:     ts("2025-02-14"),
			StatementID:   "stmt-1",
			TransactionID: "txn-2",
			Category:      "Income",
		},
	}
	r := Build(txns, nil, DefaultPairWindow)
	assertBalanced(t, r.Legs)

	byEntry := legsByEntry(r.Legs)
	legs := byEntry[r.Entries[0].ID]
	var checking, income export.JournalLeg
	for _, l := range legs {
		switch l.AccountID {
		case "Example Bank_Checking":
			checking = l
		case acctUncategorizedIncome:
			income = l
		}
	}
	// Income: debit Checking, credit Uncategorized Income.
	if checking.Debit != 2400 || checking.Credit != 0 {
		t.Errorf("checking leg should be debit 2400, got debit=%v credit=%v", checking.Debit, checking.Credit)
	}
	if income.Credit != 2400 || income.Debit != 0 {
		t.Errorf("income leg should be credit 2400, got debit=%v credit=%v", income.Debit, income.Credit)
	}

	ids := accountIDs(r.Accounts)
	if ids[acctUncategorizedIncome] != "income" {
		t.Errorf("Uncategorized Income should be income, got %q", ids[acctUncategorizedIncome])
	}
}

func TestMatchingPairMerge(t *testing.T) {
	txns := []budget.TransactionData{
		{ // outflow from Checking (source)
			Institution:   "Example Bank",
			Account:       "Checking",
			Description:   "Transfer to Savings",
			Amount:        30000,
			Timestamp:     ts("2025-02-18"),
			StatementID:   "stmt-chk",
			TransactionID: "out-1",
			Category:      "Transfer:Savings",
		},
		{ // inflow to Savings (destination)
			Institution:   "Example Credit Union",
			Account:       "Savings",
			Description:   "Transfer from Checking",
			Amount:        -30000,
			Timestamp:     ts("2025-02-19"),
			StatementID:   "stmt-sav",
			TransactionID: "in-1",
			Category:      "Transfer:Savings",
		},
	}
	r := Build(txns, nil, DefaultPairWindow)

	if len(r.Entries) != 1 {
		t.Fatalf("expected 1 merged entry, got %d", len(r.Entries))
	}
	if len(r.Legs) != 2 {
		t.Fatalf("expected 2 legs, got %d", len(r.Legs))
	}
	assertBalanced(t, r.Legs)

	legs := legsByEntry(r.Legs)[r.Entries[0].ID]
	var dst, src export.JournalLeg
	for _, l := range legs {
		switch l.AccountID {
		case "Example Credit Union_Savings":
			dst = l
		case "Example Bank_Checking":
			src = l
		}
	}
	if dst.Debit != 300 || dst.Credit != 0 {
		t.Errorf("destination (Savings) should be debit 300, got debit=%v credit=%v", dst.Debit, dst.Credit)
	}
	if src.Credit != 300 || src.Debit != 0 {
		t.Errorf("source (Checking) should be credit 300, got debit=%v credit=%v", src.Debit, src.Credit)
	}

	// Placeholder counter legs dropped.
	ids := accountIDs(r.Accounts)
	if _, ok := ids[acctUnresolvedTransfers]; ok {
		t.Errorf("Unresolved Transfers should not be emitted for a matched pair")
	}

	// Both docIDs map to the merged entry.
	docOut := budget.TransactionDocID("stmt-chk", "out-1")
	docIn := budget.TransactionDocID("stmt-sav", "in-1")
	if r.EntryIDByDocID[docOut] != r.Entries[0].ID || r.EntryIDByDocID[docIn] != r.Entries[0].ID {
		t.Errorf("both docIDs should map to merged entry")
	}
	// Merged id is order-independent min.
	want := mergedEntryID(docOut, docIn)
	if r.Entries[0].ID != want {
		t.Errorf("merged entry id = %q, want %q", r.Entries[0].ID, want)
	}
}

func TestUnmatchedTransferFallback(t *testing.T) {
	txns := []budget.TransactionData{
		{
			Institution:   "Example Bank",
			Account:       "Checking",
			Description:   "Transfer to Savings",
			Amount:        30000,
			Timestamp:     ts("2025-02-18"),
			StatementID:   "stmt-chk",
			TransactionID: "lonely",
			Category:      "Transfer:Savings",
		},
	}
	r := Build(txns, nil, DefaultPairWindow)
	assertBalanced(t, r.Legs)

	legs := legsByEntry(r.Legs)[r.Entries[0].ID]
	var foundUnresolved bool
	for _, l := range legs {
		if l.AccountID == acctUnresolvedTransfers {
			foundUnresolved = true
		}
	}
	if !foundUnresolved {
		t.Errorf("lone transfer line should land a leg on Unresolved Transfers")
	}
	ids := accountIDs(r.Accounts)
	if ids[acctUnresolvedTransfers] != "asset" {
		t.Errorf("Unresolved Transfers should be a clearing asset, got %q", ids[acctUnresolvedTransfers])
	}
}

func TestTwoCandidatePairsNearestTime(t *testing.T) {
	// Two outflows from Checking and two inflows to Savings, all same amount,
	// within the window. Greedy nearest-time should pair each outflow to its
	// closest inflow, not cross-pair.
	txns := []budget.TransactionData{
		{ // out A
			Institution: "Example Bank", Account: "Checking",
			Description: "out-A", Amount: 10000, Timestamp: ts("2025-02-01"),
			StatementID: "s", TransactionID: "outA", Category: "Transfer:Savings",
		},
		{ // in A (nearest to out A)
			Institution: "Example Credit Union", Account: "Savings",
			Description: "in-A", Amount: -10000, Timestamp: ts("2025-02-01"),
			StatementID: "s", TransactionID: "inA", Category: "Transfer:Savings",
		},
		{ // out B
			Institution: "Example Bank", Account: "Checking",
			Description: "out-B", Amount: 10000, Timestamp: ts("2025-02-03"),
			StatementID: "s", TransactionID: "outB", Category: "Transfer:Savings",
		},
		{ // in B (nearest to out B)
			Institution: "Example Credit Union", Account: "Savings",
			Description: "in-B", Amount: -10000, Timestamp: ts("2025-02-03"),
			StatementID: "s", TransactionID: "inB", Category: "Transfer:Savings",
		},
	}
	r := Build(txns, nil, DefaultPairWindow)

	if len(r.Entries) != 2 {
		t.Fatalf("expected 2 merged entries, got %d", len(r.Entries))
	}
	for _, e := range r.Entries {
		assertBalanced(t, legsByEntry(r.Legs)[e.ID])
	}

	docOutA := budget.TransactionDocID("s", "outA")
	docInA := budget.TransactionDocID("s", "inA")
	docOutB := budget.TransactionDocID("s", "outB")
	docInB := budget.TransactionDocID("s", "inB")

	// outA must pair with inA (same day), not inB.
	if r.EntryIDByDocID[docOutA] != r.EntryIDByDocID[docInA] {
		t.Errorf("outA should pair with inA")
	}
	if r.EntryIDByDocID[docOutB] != r.EntryIDByDocID[docInB] {
		t.Errorf("outB should pair with inB")
	}
	if r.EntryIDByDocID[docOutA] == r.EntryIDByDocID[docOutB] {
		t.Errorf("the two pairs must be distinct entries")
	}

	// No Unresolved Transfers (both pairs matched).
	if _, ok := accountIDs(r.Accounts)[acctUnresolvedTransfers]; ok {
		t.Errorf("no Unresolved Transfers expected when all transfers pair")
	}
}

func TestCreditCardLiabilityDerivation(t *testing.T) {
	txns := []budget.TransactionData{
		{
			Institution:   "Example Bank",
			Account:       "Credit Card",
			Description:   "Hardware Store",
			Amount:        4500,
			Timestamp:     ts("2025-02-10"),
			StatementID:   "stmt-cc",
			TransactionID: "cc-1",
			Category:      "Home",
			IsCreditCard:  true,
		},
	}
	r := Build(txns, nil, DefaultPairWindow)
	ids := accountIDs(r.Accounts)
	if ids["Example Bank_Credit Card"] != "liability" {
		t.Errorf("credit-card account should be liability, got %q", ids["Example Bank_Credit Card"])
	}

	assertBalanced(t, r.Legs)

	// A positive (spending) charge on a credit card credits the liability
	// account and debits the expense placeholder.
	byEntry := legsByEntry(r.Legs)
	legs := byEntry[r.Entries[0].ID]
	var card, expense export.JournalLeg
	for _, l := range legs {
		switch l.AccountID {
		case "Example Bank_Credit Card":
			card = l
		case acctUncategorizedExpense:
			expense = l
		}
	}
	if card.Credit != 45.00 || card.Debit != 0 {
		t.Errorf("credit-card leg should be credit 45.00, got debit=%v credit=%v", card.Debit, card.Credit)
	}
	if expense.Debit != 45.00 || expense.Credit != 0 {
		t.Errorf("expense leg should be debit 45.00, got debit=%v credit=%v", expense.Debit, expense.Credit)
	}
}

func TestPairWindowExcludesFarApart(t *testing.T) {
	// Opposite-sign matching amounts on different accounts but timestamps
	// beyond the window must NOT pair.
	txns := []budget.TransactionData{
		{
			Institution: "Example Bank", Account: "Checking",
			Description: "out", Amount: 10000, Timestamp: ts("2025-02-01"),
			StatementID: "s", TransactionID: "out", Category: "Transfer:Savings",
		},
		{
			Institution: "Example Credit Union", Account: "Savings",
			Description: "in", Amount: -10000, Timestamp: ts("2025-02-20"),
			StatementID: "s", TransactionID: "in", Category: "Transfer:Savings",
		},
	}
	r := Build(txns, nil, DefaultPairWindow)
	if len(r.Entries) != 2 {
		t.Fatalf("expected 2 unmerged entries, got %d", len(r.Entries))
	}
	// Both fall back to Unresolved Transfers.
	if accountIDs(r.Accounts)[acctUnresolvedTransfers] != "asset" {
		t.Errorf("expected Unresolved Transfers for unpaired transfers")
	}
}

func TestIdempotency(t *testing.T) {
	txns := []budget.TransactionData{
		{
			Institution: "Example Bank", Account: "Checking",
			Description: "Grocery", Amount: 8450, Timestamp: ts("2025-02-05"),
			StatementID: "s", TransactionID: "a", Category: "Groceries",
		},
		{
			Institution: "Example Bank", Account: "Checking",
			Description: "Payroll", Amount: -240000, Timestamp: ts("2025-02-14"),
			StatementID: "s", TransactionID: "b", Category: "Income",
		},
		{
			Institution: "Example Bank", Account: "Checking",
			Description: "out", Amount: 30000, Timestamp: ts("2025-02-18"),
			StatementID: "s", TransactionID: "out", Category: "Transfer:Savings",
		},
		{
			Institution: "Example Credit Union", Account: "Savings",
			Description: "in", Amount: -30000, Timestamp: ts("2025-02-19"),
			StatementID: "s", TransactionID: "in", Category: "Transfer:Savings",
		},
	}
	r1 := Build(txns, nil, DefaultPairWindow)
	r2 := Build(txns, nil, DefaultPairWindow)

	if !reflect.DeepEqual(r1.Entries, r2.Entries) {
		t.Errorf("entries differ across runs")
	}
	if !reflect.DeepEqual(r1.Legs, r2.Legs) {
		t.Errorf("legs differ across runs")
	}
	if !reflect.DeepEqual(r1.Accounts, r2.Accounts) {
		t.Errorf("accounts differ across runs")
	}
	if !reflect.DeepEqual(r1.EntryIDByDocID, r2.EntryIDByDocID) {
		t.Errorf("EntryIDByDocID differs across runs")
	}

	// Sorted by id.
	for i := 1; i < len(r1.Entries); i++ {
		if r1.Entries[i-1].ID >= r1.Entries[i].ID {
			t.Errorf("entries not sorted by id")
		}
	}
	for i := 1; i < len(r1.Legs); i++ {
		if r1.Legs[i-1].ID >= r1.Legs[i].ID {
			t.Errorf("legs not sorted by id")
		}
	}
	for i := 1; i < len(r1.Accounts); i++ {
		if r1.Accounts[i-1].ID >= r1.Accounts[i].ID {
			t.Errorf("accounts not sorted by id")
		}
	}
}

func TestEmptyInputNonNilSlices(t *testing.T) {
	r := Build(nil, nil, DefaultPairWindow)
	if r.Entries == nil || r.Legs == nil || r.Accounts == nil {
		t.Errorf("slices must be non-nil so they serialize as [] not null")
	}
	if len(r.Entries) != 0 || len(r.Legs) != 0 || len(r.Accounts) != 0 {
		t.Errorf("expected empty result")
	}
}
