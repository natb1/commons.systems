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
	TrnType string `xml:"TRNTYPE"`
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

	var rawTxns []ofxStmtTrn
	if doc.BankMsgs != nil {
		rawTxns = append(rawTxns, doc.BankMsgs.StmtTrnRs.StmtRs.BankTranList.Transactions...)
	}
	if doc.CCMsgs != nil {
		rawTxns = append(rawTxns, doc.CCMsgs.CCStmtTrnRs.CCStmtRs.BankTranList.Transactions...)
	}

	txns := make([]Transaction, 0, len(rawTxns))
	for _, raw := range rawTxns {
		t, err := convertOFXTransaction(raw)
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: %w", path, err)
		}
		txns = append(txns, t)
	}

	return ParseResult{Transactions: txns}, nil
}

func convertOFXTransaction(raw ofxStmtTrn) (Transaction, error) {
	fitid := strings.TrimSpace(raw.FITID)
	if fitid == "" {
		return Transaction{}, fmt.Errorf("STMTTRN missing FITID")
	}

	date, err := parseOFXDate(raw.DtPosted)
	if err != nil {
		return Transaction{}, fmt.Errorf("FITID %s: parsing date %q: %w", fitid, raw.DtPosted, err)
	}

	amount, err := parseOFXAmount(raw.TrnAmt)
	if err != nil {
		return Transaction{}, fmt.Errorf("FITID %s: parsing amount %q: %w", fitid, raw.TrnAmt, err)
	}
	// OFX: negative = debit (spending), positive = credit (income)
	// Budget app: positive = spending, negative = income
	amount = -amount

	return Transaction{
		TransactionID: fitid,
		Date:          date,
		Amount:        amount,
		Description:   strings.TrimSpace(raw.Name),
		Memo:          strings.TrimSpace(raw.Memo),
	}, nil
}
