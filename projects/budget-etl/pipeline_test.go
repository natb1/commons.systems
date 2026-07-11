package main

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/parse"
)

func TestParseStatementDir(t *testing.T) {
	tmp := t.TempDir()

	writeCSVFixture(t, filepath.Join(tmp, "bank_a", "1111", "2025-01", "stmt1.csv"), [][6]string{
		{"2025/01/05", "10.00", "PURCHASE ONE", "", "TXN-1", "DEBIT"},
		{"2025/01/10", "20.00", "PURCHASE TWO", "", "TXN-2", "DEBIT"},
	})
	writeCSVFixture(t, filepath.Join(tmp, "bank_b", "2222", "2025-01", "stmt2.csv"), [][6]string{
		{"2025/01/15", "30.00", "PURCHASE THREE", "", "TXN-3", "DEBIT"},
	})

	parsed, totalTxns, skipped, err := parseStatementDir(tmp, parse.DiscoverOpts{})
	if err != nil {
		t.Fatalf("parseStatementDir: %v", err)
	}
	if skipped != 0 {
		t.Errorf("skipped: got %d, want 0", skipped)
	}
	if len(parsed) != 2 {
		t.Fatalf("len(parsed): got %d, want 2", len(parsed))
	}
	if totalTxns != 3 {
		t.Errorf("totalTxns: got %d, want 3", totalTxns)
	}

	for _, pf := range parsed {
		if pf.sf.Period == "" {
			t.Errorf("sf.Period is empty for %s", pf.sf.Path)
		}
		if len(pf.result.Transactions) == 0 {
			t.Errorf("no transactions for %s", pf.sf.Path)
		}
	}
}

func TestBuildTransactions_Dedupes(t *testing.T) {
	sf := parse.StatementFile{
		Institution: "bank",
		Account:     "9999",
		Period:      "2025-02",
	}
	txn := parse.Transaction{
		TransactionID: "TXN-DUP",
		Date:          time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		Amount:        500,
		Description:   "DUPLICATE",
	}
	// Two parsedFiles with the same StatementID and same transaction
	pf1 := parsedFile{sf: sf, result: parse.ParseResult{Transactions: []parse.Transaction{txn}}}
	pf2 := parsedFile{sf: sf, result: parse.ParseResult{Transactions: []parse.Transaction{txn}}}

	allTxns, allDocIDs := buildTransactions([]parsedFile{pf1, pf2}, 0, nil)

	if len(allTxns) != 1 {
		t.Errorf("len(allTxns): got %d, want 1 (expected dedup)", len(allTxns))
	}
	if len(allDocIDs) != 1 {
		t.Errorf("len(allDocIDs): got %d, want 1", len(allDocIDs))
	}
	want := budget.TransactionDocID(sf.Institution, sf.Account, txn.TransactionID)
	if allDocIDs[0] != want {
		t.Errorf("allDocIDs[0]: got %q, want %q", allDocIDs[0], want)
	}
}

// TestBuildTransactions_StatementIndependentIdentity is the core Unit-1
// regression for clarification 3: the same (institution, account, FITID) carried
// by two overlapping exports whose inferred periods diverge must collapse to a
// single row. Under the old statement-embedded scheme these two files minted
// distinct doc IDs and both survived; under statement-independent identity they
// dedupe to one.
func TestBuildTransactions_StatementIndependentIdentity(t *testing.T) {
	txn := parse.Transaction{
		TransactionID: "TXN-SHARED",
		Date:          time.Date(2025, 1, 20, 0, 0, 0, 0, time.UTC),
		Amount:        700,
		Description:   "SHARED PURCHASE",
	}
	// Same institution/account, but the two exports inferred different periods
	// (Jan vs Feb) — so their StatementID()s differ. Identity must ignore that.
	sfJan := parse.StatementFile{Institution: "bank", Account: "1234", Period: "2025-01"}
	sfFeb := parse.StatementFile{Institution: "bank", Account: "1234", Period: "2025-02"}
	if sfJan.StatementID() == sfFeb.StatementID() {
		t.Fatalf("test setup: statement IDs should differ across periods")
	}
	pfJan := parsedFile{sf: sfJan, result: parse.ParseResult{Transactions: []parse.Transaction{txn}}}
	pfFeb := parsedFile{sf: sfFeb, result: parse.ParseResult{Transactions: []parse.Transaction{txn}}}

	allTxns, allDocIDs := buildTransactions([]parsedFile{pfJan, pfFeb}, 0, nil)

	if len(allTxns) != 1 {
		t.Fatalf("len(allTxns): got %d, want 1 (statement-independent collapse)", len(allTxns))
	}
	want := budget.TransactionDocID("bank", "1234", "TXN-SHARED")
	if allDocIDs[0] != want {
		t.Errorf("allDocIDs[0]: got %q, want %q", allDocIDs[0], want)
	}
}

func TestBuildTransactions_Visit(t *testing.T) {
	sf := parse.StatementFile{
		Institution: "bank",
		Account:     "1234",
		Period:      "2025-03",
	}
	txns := []parse.Transaction{
		{TransactionID: "A", Date: time.Date(2025, 3, 1, 0, 0, 0, 0, time.UTC), Amount: 100, Description: "A"},
		{TransactionID: "B", Date: time.Date(2025, 3, 2, 0, 0, 0, 0, time.UTC), Amount: 200, Description: "B"},
	}
	pf := parsedFile{sf: sf, result: parse.ParseResult{Transactions: txns}}

	var visitCount int
	allTxns, _ := buildTransactions([]parsedFile{pf}, 0, func(td *budget.TransactionData, docID string, sf parse.StatementFile, t parse.Transaction) {
		visitCount++
		td.Category = "cat-" + t.TransactionID
	})

	if visitCount != 2 {
		t.Errorf("visitCount: got %d, want 2", visitCount)
	}
	if len(allTxns) != 2 {
		t.Fatalf("len(allTxns): got %d, want 2", len(allTxns))
	}
	if allTxns[0].Category != "cat-A" {
		t.Errorf("allTxns[0].Category: got %q, want %q", allTxns[0].Category, "cat-A")
	}
	if allTxns[1].Category != "cat-B" {
		t.Errorf("allTxns[1].Category: got %q, want %q", allTxns[1].Category, "cat-B")
	}
}

func TestBuildTransactions_NilVisit(t *testing.T) {
	sf := parse.StatementFile{
		Institution: "bank",
		Account:     "5678",
		Period:      "2025-04",
	}
	txn := parse.Transaction{
		TransactionID: "Z",
		Date:          time.Date(2025, 4, 1, 0, 0, 0, 0, time.UTC),
		Amount:        999,
		Description:   "Z",
	}
	pf := parsedFile{sf: sf, result: parse.ParseResult{Transactions: []parse.Transaction{txn}}}

	allTxns, allDocIDs := buildTransactions([]parsedFile{pf}, 0, nil)

	if len(allTxns) != 1 {
		t.Fatalf("len(allTxns): got %d, want 1", len(allTxns))
	}
	if allTxns[0].Category != "" {
		t.Errorf("Category: got %q, want empty", allTxns[0].Category)
	}
	if len(allDocIDs) != 1 {
		t.Errorf("len(allDocIDs): got %d, want 1", len(allDocIDs))
	}
}

// investmentQFX mirrors internal/parse/testdata/investment.qfx: an SGML/QFX
// file whose INVSTMTMSGSRSV1 marker causes the parser to skip it.
const investmentQFX = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20250525155800.345[-4:EDT]
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1>
<INVSTMTTRNRS>
<TRNUID>0
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
</INVSTMTTRNRS>
</INVSTMTMSGSRSV1>
</OFX>
`

func TestParseStatementDir_SkipsInvestment(t *testing.T) {
	tmp := t.TempDir()

	writeCSVFixture(t, filepath.Join(tmp, "bank_a", "1111", "2025-01", "stmt.csv"), [][6]string{
		{"2025/01/05", "10.00", "PURCHASE ONE", "", "TXN-1", "DEBIT"},
		{"2025/01/10", "20.00", "PURCHASE TWO", "", "TXN-2", "DEBIT"},
	})

	// An investment statement at the same {institution}/{account}/{period}/{file}
	// depth — DiscoverFiles finds it, ParseFile reports it Skipped.
	qfxPath := filepath.Join(tmp, "bank_b", "2222", "2025-01", "invest.qfx")
	if err := os.MkdirAll(filepath.Dir(qfxPath), 0755); err != nil {
		t.Fatalf("creating qfx fixture dir: %v", err)
	}
	if err := os.WriteFile(qfxPath, []byte(investmentQFX), 0644); err != nil {
		t.Fatalf("writing qfx fixture: %v", err)
	}

	parsed, totalTxns, skipped, err := parseStatementDir(tmp, parse.DiscoverOpts{})
	if err != nil {
		t.Fatalf("parseStatementDir: %v", err)
	}
	if skipped != 1 {
		t.Errorf("skipped: got %d, want 1", skipped)
	}
	if len(parsed) != 1 {
		t.Fatalf("len(parsed): got %d, want 1 (the skipped .qfx is excluded)", len(parsed))
	}
	if totalTxns != 2 {
		t.Errorf("totalTxns: got %d, want 2 (only the good CSV's transactions)", totalTxns)
	}
}

func TestParseStatementDir_DiscoverError(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "does-not-exist")

	_, _, _, err := parseStatementDir(missing, parse.DiscoverOpts{})
	if err == nil {
		t.Fatal("parseStatementDir: got nil error, want a discovery error")
	}
	if !strings.Contains(err.Error(), "discovering files in") {
		t.Errorf("error %q does not contain %q", err.Error(), "discovering files in")
	}
}

func TestDedupStatementData(t *testing.T) {
	cases := []struct {
		name  string
		input []budget.StatementData
		// wantLen is the expected output length. It is consulted only when
		// wantOut is nil; when wantOut is set the length is derived from it.
		wantLen int
		// wantOut, when non-nil, asserts out equals this exactly (per-entry,
		// via reflect.DeepEqual so *time.Time fields compare by value).
		wantOut []budget.StatementData
	}{
		{
			name:    "empty slice",
			input:   []budget.StatementData{},
			wantLen: 0,
		},
		{
			name:    "nil slice",
			input:   nil,
			wantLen: 0,
		},
		{
			name: "single entry",
			input: []budget.StatementData{
				{StatementID: "STMT-1", Balance: 1000},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-1", Balance: 1000},
			},
		},
		{
			name: "two entries same StatementID equal Balance keeps first-seen",
			input: []budget.StatementData{
				{StatementID: "STMT-2", Balance: 5000, SourceFile: "bank/acct/2025-01/first.ofx"},
				{StatementID: "STMT-2", Balance: 5000, SourceFile: "bank/acct/2025-01/second.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-2", Balance: 5000, SourceFile: "bank/acct/2025-01/first.ofx"},
			},
		},
		{
			name: "multiple distinct StatementIDs preserve first-seen order",
			input: []budget.StatementData{
				{StatementID: "STMT-A", Balance: 1000, SourceFile: "bank/acct/2025-01/a1.ofx"},
				{StatementID: "STMT-B", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
				{StatementID: "STMT-A", Balance: 1000, SourceFile: "bank/acct/2025-01/a2.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-A", Balance: 1000, SourceFile: "bank/acct/2025-01/a1.ofx"},
				{StatementID: "STMT-B", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
			},
		},
		{
			// Two observations of one account-month at different as-of dates now
			// carry distinct anchor IDs (see budget.AnchorID), so both are kept —
			// the keep-all-distinct-observations contract.
			name: "distinct as-of dates same account-month both kept",
			input: []budget.StatementData{
				{StatementID: "bank-acct-2025-01-15", Balance: 1000, SourceFile: "bank/acct/2025-01/mid.ofx"},
				{StatementID: "bank-acct-2025-01-28", Balance: 1200, SourceFile: "bank/acct/2025-01/late.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "bank-acct-2025-01-15", Balance: 1000, SourceFile: "bank/acct/2025-01/mid.ofx"},
				{StatementID: "bank-acct-2025-01-28", Balance: 1200, SourceFile: "bank/acct/2025-01/late.ofx"},
			},
		},
		{
			// Same anchor ID (same as-of date), disagreeing balances: the
			// lexicographically-later SourceFile wins. Here b.ofx arrives second
			// and sorts later, so it replaces a.ofx in place.
			name: "same anchor different Balance — later SourceFile arrives second and wins",
			input: []budget.StatementData{
				{StatementID: "STMT-3", Balance: 1000, SourceFile: "bank/acct/2025-01/a.ofx"},
				{StatementID: "STMT-3", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-3", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
			},
		},
		{
			// The later-sorting SourceFile arrives first: it is the survivor and
			// the second (earlier-sorting) entry does not displace it.
			name: "same anchor different Balance — later SourceFile arrives first and is kept",
			input: []budget.StatementData{
				{StatementID: "STMT-3", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
				{StatementID: "STMT-3", Balance: 1000, SourceFile: "bank/acct/2025-01/a.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-3", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
			},
		},
		{
			// A real observation (non-empty SourceFile) beats an ETL-derived
			// anchor (empty SourceFile) at the same anchor ID, regardless of
			// arrival order, because any non-empty path sorts after "".
			name: "same anchor — real observation beats derived anchor",
			input: []budget.StatementData{
				{StatementID: "STMT-D", Balance: 1000, SourceFile: ""},
				{StatementID: "STMT-D", Balance: 2000, SourceFile: "bank/acct/2025-01/real.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-D", Balance: 2000, SourceFile: "bank/acct/2025-01/real.ofx"},
			},
		},
		{
			name: "three entries same StatementID all equal Balance keeps first-seen",
			input: []budget.StatementData{
				{StatementID: "STMT-4", Balance: 7500, SourceFile: "bank/acct/2025-01/x.ofx"},
				{StatementID: "STMT-4", Balance: 7500, SourceFile: "bank/acct/2025-01/y.ofx"},
				{StatementID: "STMT-4", Balance: 7500, SourceFile: "bank/acct/2025-01/z.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-4", Balance: 7500, SourceFile: "bank/acct/2025-01/x.ofx"},
			},
		},
		{
			// The tie-break winner takes the earlier entry's output position, so
			// surrounding first-seen order is preserved.
			name: "reconciled replacement preserves surrounding first-seen order",
			input: []budget.StatementData{
				{StatementID: "STMT-P", Balance: 1000, SourceFile: "bank/acct/2025-01/p-early.ofx"},
				{StatementID: "STMT-Q", Balance: 2000, SourceFile: "bank/acct/2025-01/q.ofx"},
				{StatementID: "STMT-P", Balance: 1500, SourceFile: "bank/acct/2025-01/p-late.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-P", Balance: 1500, SourceFile: "bank/acct/2025-01/p-late.ofx"},
				{StatementID: "STMT-Q", Balance: 2000, SourceFile: "bank/acct/2025-01/q.ofx"},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			out := dedupStatementData(tc.input)
			if tc.wantOut != nil {
				if len(out) != len(tc.wantOut) {
					t.Fatalf("out: got %d entries, want %d", len(out), len(tc.wantOut))
				}
				for i := range tc.wantOut {
					if !reflect.DeepEqual(out[i], tc.wantOut[i]) {
						t.Errorf("out[%d]: got %+v, want %+v", i, out[i], tc.wantOut[i])
					}
				}
			} else if len(out) != tc.wantLen {
				t.Errorf("len(out): got %d, want %d", len(out), tc.wantLen)
			}
		})
	}
}
