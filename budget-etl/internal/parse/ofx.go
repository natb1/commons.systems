package parse

import (
	"encoding/xml"
	"fmt"
	"os"
	"strings"
	"time"
)

// OFX 2.x XML structures. We parse only the transaction list from both
// BANKMSGSRSV1 (bank accounts) and CREDITCARDMSGSRSV1 (credit cards).
// Intermediate wrapper elements (STMTTRNRS>STMTRS, CCSTMTTRNRS>CCSTMTRS)
// are traversed via nested XML path tags.

type ofxLedgerBal struct {
	BalAmt string `xml:"BALAMT"`
	DtAsOf string `xml:"DTASOF"`
}

type ofxDoc struct {
	XMLName  xml.Name     `xml:"OFX"`
	BankTxns []ofxStmtTrn `xml:"BANKMSGSRSV1>STMTTRNRS>STMTRS>BANKTRANLIST>STMTTRN"`
	CCTxns   []ofxStmtTrn `xml:"CREDITCARDMSGSRSV1>CCSTMTTRNRS>CCSTMTRS>BANKTRANLIST>STMTTRN"`
	BankBal  *ofxLedgerBal `xml:"BANKMSGSRSV1>STMTTRNRS>STMTRS>LEDGERBAL"`
	CCBal    *ofxLedgerBal `xml:"CREDITCARDMSGSRSV1>CCSTMTTRNRS>CCSTMTRS>LEDGERBAL"`
	InvMsgs  *struct{}    `xml:"INVSTMTMSGSRSV1"`
}

type ofxStmtTrn struct {
	DtPosted string `xml:"DTPOSTED"`
	TrnAmt   string `xml:"TRNAMT"`
	FITID    string `xml:"FITID"`
	Name     string `xml:"NAME"`
	Memo     string `xml:"MEMO"`
}

func (t ofxStmtTrn) raw() rawTransaction {
	return rawTransaction{
		FITID:    t.FITID,
		DtPosted: t.DtPosted,
		TrnAmt:   t.TrnAmt,
		Name:     t.Name,
		Memo:     t.Memo,
	}
}

func parseOFX(path string) (ParseResult, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return ParseResult{}, err
	}

	// Strip XML processing instructions that encoding/xml can't handle
	content := string(data)
	if idx := strings.Index(content, "<OFX>"); idx >= 0 {
		content = content[idx:]
	}

	var doc ofxDoc
	if err := xml.Unmarshal([]byte(content), &doc); err != nil {
		return ParseResult{}, fmt.Errorf("parsing OFX XML %s: %w", path, err)
	}

	if doc.InvMsgs != nil {
		return ParseResult{Skipped: true, SkipReason: "investment account (INVSTMTMSGSRSV1)"}, nil
	}

	rawTxns := append(doc.BankTxns, doc.CCTxns...)
	if len(rawTxns) == 0 {
		return ParseResult{}, fmt.Errorf("no bank or credit card transactions in %s", path)
	}

	txns := make([]Transaction, 0, len(rawTxns))
	for _, st := range rawTxns {
		t, err := convertRawTransaction(st.raw())
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: %w", path, err)
		}
		txns = append(txns, t)
	}

	var balance int64
	var balanceDate time.Time
	bal := doc.BankBal
	if bal == nil {
		bal = doc.CCBal
	}
	if bal != nil {
		b, err := parseCents(bal.BalAmt)
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: parsing LEDGERBAL BALAMT %q: %w", path, bal.BalAmt, err)
		}
		balance = b
		if bal.DtAsOf != "" {
			bd, err := parseOFXDate(bal.DtAsOf)
			if err != nil {
				return ParseResult{}, fmt.Errorf("%s: parsing LEDGERBAL DTASOF %q: %w", path, bal.DtAsOf, err)
			}
			balanceDate = bd
		}
	}

	return ParseResult{Transactions: txns, Balance: balance, BalanceDate: balanceDate}, nil
}
