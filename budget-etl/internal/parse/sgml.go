package parse

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// parseSGML parses OFX 1.x / QFX SGML files by scanning for SGML tags.
// SGML leaf elements have no closing tags (e.g., <FITID>12345 instead of
// <FITID>12345</FITID>), so encoding/xml cannot parse them.
// Aggregates like <STMTTRN> use </STMTTRN> as a closing tag. If </STMTTRN>
// is absent, the next <STMTTRN> or end-of-file is used as the block boundary.
func parseSGML(path string) (ParseResult, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return ParseResult{}, err
	}

	text := string(data)

	// Check for investment account
	if strings.Contains(text, "INVSTMTMSGSRSV1") {
		return ParseResult{Skipped: true, SkipReason: "investment account (INVSTMTMSGSRSV1)"}, nil
	}

	result, err := parseSGMLTransactions(text, path)
	if err != nil {
		return ParseResult{}, err
	}

	bal, err := parseSGMLBalance(text)
	if err != nil {
		return ParseResult{}, fmt.Errorf("%s: %w", path, err)
	}
	result.Balance = bal.cents
	result.BalanceDate = bal.balanceDate

	return result, nil
}

func parseSGMLTransactions(text, path string) (ParseResult, error) {
	var txns []Transaction
	pos := 0

	for {
		// Find next <STMTTRN> block
		start := indexFrom(text, "<STMTTRN>", pos)
		if start < 0 {
			break
		}
		end := indexFrom(text, "</STMTTRN>", start)
		if end < 0 {
			// Some files don't have closing tags; try next <STMTTRN> as boundary
			end = indexFrom(text, "<STMTTRN>", start+9)
			if end < 0 {
				end = len(text)
			}
		}
		block := text[start:end]
		pos = end

		t, err := parseSGMLBlock(block)
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: %w", path, err)
		}
		txns = append(txns, t)
	}

	if len(txns) == 0 {
		return ParseResult{}, fmt.Errorf("no transactions found in %s", path)
	}

	return ParseResult{Transactions: txns}, nil
}

func indexFrom(s, substr string, start int) int {
	if start >= len(s) {
		return -1
	}
	idx := strings.Index(s[start:], substr)
	if idx < 0 {
		return -1
	}
	return start + idx
}

// parseSGMLBlock extracts tag values from a single <STMTTRN> block.
func parseSGMLBlock(block string) (Transaction, error) {
	return convertRawTransaction(rawTransaction{
		FITID:    sgmlTagValue(block, "FITID"),
		DtPosted: sgmlTagValue(block, "DTPOSTED"),
		TrnAmt:   sgmlTagValue(block, "TRNAMT"),
		Name:     sgmlTagValue(block, "NAME"),
		Memo:     sgmlTagValue(block, "MEMO"),
	})
}

type sgmlBalance struct {
	cents       int64
	balanceDate time.Time
}

// parseSGMLBalance extracts the ledger balance and DTASOF from a LEDGERBAL block.
// Returns zero values if no LEDGERBAL block is found.
func parseSGMLBalance(text string) (sgmlBalance, error) {
	idx := strings.Index(text, "<LEDGERBAL>")
	if idx < 0 {
		return sgmlBalance{}, nil
	}
	block := text[idx:]
	balAmt := sgmlTagValue(block, "BALAMT")
	if balAmt == "" {
		return sgmlBalance{}, fmt.Errorf("LEDGERBAL block found but BALAMT is empty")
	}
	cents, err := parseCents(balAmt)
	if err != nil {
		return sgmlBalance{}, fmt.Errorf("parsing LEDGERBAL BALAMT %q: %w", balAmt, err)
	}
	var balanceDate time.Time
	dtAsOf := sgmlTagValue(block, "DTASOF")
	if dtAsOf != "" {
		bd, err := parseOFXDate(dtAsOf)
		if err != nil {
			return sgmlBalance{}, fmt.Errorf("parsing LEDGERBAL DTASOF %q: %w", dtAsOf, err)
		}
		balanceDate = bd
	}
	return sgmlBalance{cents: cents, balanceDate: balanceDate}, nil
}

// sgmlTagValue extracts the value following <TAG> in SGML content.
// Returns empty string if tag not found.
func sgmlTagValue(content, tag string) string {
	needle := "<" + tag + ">"
	idx := strings.Index(content, needle)
	if idx < 0 {
		return ""
	}
	start := idx + len(needle)
	// Value continues until next '<' or end of content
	end := strings.Index(content[start:], "<")
	if end < 0 {
		return strings.TrimSpace(content[start:])
	}
	return strings.TrimSpace(content[start : start+end])
}
