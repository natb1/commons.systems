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
	want := budget.TransactionDocID(sf.StatementID(), txn.TransactionID)
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

// asOf parses a YYYY-MM-DD date into a *time.Time for a StatementData
// BalanceDate in the dedup table tests. Callers pass identical date strings to
// get equal instants (reflect.DeepEqual on the *time.Time compares by value).
func asOf(t *testing.T, date string) *time.Time {
	t.Helper()
	parsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		t.Fatalf("asOf: parsing %q: %v", date, err)
	}
	return &parsed
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
		wantErr bool
		// wantErrSubstrs must each appear in the error message. Required to be
		// non-empty whenever wantErr is true.
		wantErrSubstrs []string
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
			name: "two entries same StatementID different Balance",
			input: []budget.StatementData{
				{StatementID: "STMT-3", Balance: 1000, SourceFile: "bank/acct/2025-01/a.ofx"},
				{StatementID: "STMT-3", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
			},
			wantErr: true,
			wantErrSubstrs: []string{
				"STMT-3",
				"bank/acct/2025-01/a.ofx",
				"bank/acct/2025-01/b.ofx",
				"10.00",
				"20.00",
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
			name: "three entries same StatementID entry3 disagrees",
			input: []budget.StatementData{
				{StatementID: "STMT-5", Balance: 3000},
				{StatementID: "STMT-5", Balance: 3000},
				{StatementID: "STMT-5", Balance: 9999, SourceFile: "bank/acct/2025-02/c.ofx"},
			},
			wantErr: true,
			wantErrSubstrs: []string{
				"STMT-5",
				"<derived>",
				"bank/acct/2025-02/c.ofx",
				"30.00",
				"99.99",
			},
		},
		{
			name: "disagree, later as-of arrives second — later observation replaces earlier in place",
			input: []budget.StatementData{
				{StatementID: "STMT-6", Balance: 1000, BalanceDate: asOf(t, "2025-01-15"), SourceFile: "bank/acct/2025-01/early.ofx"},
				{StatementID: "STMT-6", Balance: 1200, BalanceDate: asOf(t, "2025-01-28"), SourceFile: "bank/acct/2025-01/late.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-6", Balance: 1200, BalanceDate: asOf(t, "2025-01-28"), SourceFile: "bank/acct/2025-01/late.ofx"},
			},
		},
		{
			name: "disagree, later as-of arrives first — earlier survivor kept",
			input: []budget.StatementData{
				{StatementID: "STMT-7", Balance: 1200, BalanceDate: asOf(t, "2025-01-28"), SourceFile: "bank/acct/2025-01/late.ofx"},
				{StatementID: "STMT-7", Balance: 1000, BalanceDate: asOf(t, "2025-01-15"), SourceFile: "bank/acct/2025-01/early.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-7", Balance: 1200, BalanceDate: asOf(t, "2025-01-28"), SourceFile: "bank/acct/2025-01/late.ofx"},
			},
		},
		{
			name: "disagree, prior has nil BalanceDate — set as-of wins",
			input: []budget.StatementData{
				{StatementID: "STMT-8", Balance: 1000, SourceFile: "bank/acct/2025-01/undated.ofx"},
				{StatementID: "STMT-8", Balance: 1300, BalanceDate: asOf(t, "2025-01-20"), SourceFile: "bank/acct/2025-01/dated.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-8", Balance: 1300, BalanceDate: asOf(t, "2025-01-20"), SourceFile: "bank/acct/2025-01/dated.ofx"},
			},
		},
		{
			name: "disagree, later entry has nil BalanceDate — set as-of survivor kept",
			input: []budget.StatementData{
				{StatementID: "STMT-9", Balance: 1300, BalanceDate: asOf(t, "2025-01-20"), SourceFile: "bank/acct/2025-01/dated.ofx"},
				{StatementID: "STMT-9", Balance: 1000, SourceFile: "bank/acct/2025-01/undated.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-9", Balance: 1300, BalanceDate: asOf(t, "2025-01-20"), SourceFile: "bank/acct/2025-01/dated.ofx"},
			},
		},
		{
			name: "disagree, both BalanceDate nil — still an error",
			input: []budget.StatementData{
				{StatementID: "STMT-10", Balance: 1000, SourceFile: "bank/acct/2025-01/a.ofx"},
				{StatementID: "STMT-10", Balance: 2000, SourceFile: "bank/acct/2025-01/b.ofx"},
			},
			wantErr: true,
			wantErrSubstrs: []string{
				"STMT-10",
				"bank/acct/2025-01/a.ofx",
				"bank/acct/2025-01/b.ofx",
				"10.00",
				"20.00",
			},
		},
		{
			name: "disagree, identical as-of instant — still an error",
			input: []budget.StatementData{
				{StatementID: "STMT-11", Balance: 1000, BalanceDate: asOf(t, "2025-01-31"), SourceFile: "bank/acct/2025-01/a.ofx"},
				{StatementID: "STMT-11", Balance: 2000, BalanceDate: asOf(t, "2025-01-31"), SourceFile: "bank/acct/2025-01/b.ofx"},
			},
			wantErr: true,
			wantErrSubstrs: []string{
				"STMT-11",
				"bank/acct/2025-01/a.ofx",
				"bank/acct/2025-01/b.ofx",
				"10.00",
				"20.00",
			},
		},
		{
			name: "reconciled replacement preserves surrounding first-seen order",
			input: []budget.StatementData{
				{StatementID: "STMT-P", Balance: 1000, BalanceDate: asOf(t, "2025-01-10"), SourceFile: "bank/acct/2025-01/p-early.ofx"},
				{StatementID: "STMT-Q", Balance: 2000, SourceFile: "bank/acct/2025-01/q.ofx"},
				{StatementID: "STMT-P", Balance: 1500, BalanceDate: asOf(t, "2025-01-25"), SourceFile: "bank/acct/2025-01/p-late.ofx"},
			},
			wantOut: []budget.StatementData{
				{StatementID: "STMT-P", Balance: 1500, BalanceDate: asOf(t, "2025-01-25"), SourceFile: "bank/acct/2025-01/p-late.ofx"},
				{StatementID: "STMT-Q", Balance: 2000, SourceFile: "bank/acct/2025-01/q.ofx"},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			out, err := dedupStatementData(tc.input)
			if tc.wantErr {
				if len(tc.wantErrSubstrs) == 0 {
					t.Fatal("wantErr is true but wantErrSubstrs is empty — set non-empty substrings to verify the error message")
				}
				if err == nil {
					t.Fatalf("dedupStatementData: got nil error, want error containing %q", tc.wantErrSubstrs)
				}
				for _, sub := range tc.wantErrSubstrs {
					if !strings.Contains(err.Error(), sub) {
						t.Errorf("error %q does not contain %q", err.Error(), sub)
					}
				}
				if out != nil {
					t.Errorf("out: got %v, want nil on error", out)
				}
				return
			}
			if err != nil {
				t.Fatalf("dedupStatementData: unexpected error: %v", err)
			}
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
