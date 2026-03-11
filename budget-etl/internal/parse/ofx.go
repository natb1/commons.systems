package parse

import (
	"encoding/xml"
	"fmt"
	"os"
	"strings"
)

// OFX 2.x XML structures. We parse only the transaction list from both
// BANKMSGSRSV1 (bank accounts) and CREDITCARDMSGSRSV1 (credit cards).

type ofxDoc struct {
	XMLName  xml.Name       `xml:"OFX"`
	BankMsgs *ofxBankMsgs   `xml:"BANKMSGSRSV1"`
	CCMsgs   *ofxCCMsgs     `xml:"CREDITCARDMSGSRSV1"`
	InvMsgs  *ofxInvMsgs    `xml:"INVSTMTMSGSRSV1"`
}

type ofxBankMsgs struct {
	StmtTrnRs ofxStmtTrnRs `xml:"STMTTRNRS"`
}

type ofxCCMsgs struct {
	CCStmtTrnRs ofxCCStmtTrnRs `xml:"CCSTMTTRNRS"`
}

type ofxInvMsgs struct{}

type ofxStmtTrnRs struct {
	StmtRs ofxStmtRs `xml:"STMTRS"`
}

type ofxCCStmtTrnRs struct {
	CCStmtRs ofxCCStmtRs `xml:"CCSTMTRS"`
}

type ofxStmtRs struct {
	BankTranList ofxBankTranList `xml:"BANKTRANLIST"`
}

type ofxCCStmtRs struct {
	BankTranList ofxBankTranList `xml:"BANKTRANLIST"`
}

type ofxBankTranList struct {
	Transactions []ofxStmtTrn `xml:"STMTTRN"`
}

type ofxStmtTrn struct {
	DtPosted string `xml:"DTPOSTED"`
	TrnAmt  string `xml:"TRNAMT"`
	FITID   string `xml:"FITID"`
	Name    string `xml:"NAME"`
	Memo    string `xml:"MEMO"`
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

	if doc.BankMsgs == nil && doc.CCMsgs == nil {
		return ParseResult{}, fmt.Errorf("no bank or credit card message blocks in %s", path)
	}

	var rawTxns []ofxStmtTrn
	if doc.BankMsgs != nil {
		rawTxns = append(rawTxns, doc.BankMsgs.StmtTrnRs.StmtRs.BankTranList.Transactions...)
	}
	if doc.CCMsgs != nil {
		rawTxns = append(rawTxns, doc.CCMsgs.CCStmtTrnRs.CCStmtRs.BankTranList.Transactions...)
	}

	txns := make([]Transaction, 0, len(rawTxns))
	for _, raw := range rawTxns {
		t, err := convertRawTransaction(rawTransaction{
			FITID:    raw.FITID,
			DtPosted: raw.DtPosted,
			TrnAmt:   raw.TrnAmt,
			Name:     raw.Name,
			Memo:     raw.Memo,
		})
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: %w", path, err)
		}
		txns = append(txns, t)
	}

	return ParseResult{Transactions: txns}, nil
}
