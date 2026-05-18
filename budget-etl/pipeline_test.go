package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/parse"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
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

	parsed, totalTxns, skipped, err := parseStatementDir(tmp)
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
	want := store.TransactionDocID(sf.StatementID(), txn.TransactionID)
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
	allTxns, _ := buildTransactions([]parsedFile{pf}, 0, func(td *store.TransactionData, docID string, sf parse.StatementFile, t parse.Transaction) {
		visitCount++
		td.StatementItemID = "item-" + t.TransactionID
	})

	if visitCount != 2 {
		t.Errorf("visitCount: got %d, want 2", visitCount)
	}
	if len(allTxns) != 2 {
		t.Fatalf("len(allTxns): got %d, want 2", len(allTxns))
	}
	if allTxns[0].StatementItemID != "item-A" {
		t.Errorf("allTxns[0].StatementItemID: got %q, want %q", allTxns[0].StatementItemID, "item-A")
	}
	if allTxns[1].StatementItemID != "item-B" {
		t.Errorf("allTxns[1].StatementItemID: got %q, want %q", allTxns[1].StatementItemID, "item-B")
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
	if allTxns[0].StatementItemID != "" {
		t.Errorf("StatementItemID: got %q, want empty", allTxns[0].StatementItemID)
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

	parsed, totalTxns, skipped, err := parseStatementDir(tmp)
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

	_, _, _, err := parseStatementDir(missing)
	if err == nil {
		t.Fatal("parseStatementDir: got nil error, want a discovery error")
	}
	if !strings.Contains(err.Error(), "discovering files in") {
		t.Errorf("error %q does not contain %q", err.Error(), "discovering files in")
	}
}
