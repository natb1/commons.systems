package parse

import (
	"fmt"
	"os"
	"strings"
)

// parseSGML parses OFX 1.x / QFX SGML files by scanning for SGML tags.
// SGML tags are not self-closing and can't be parsed with encoding/xml.
// Format: <TAG>value (no closing tags for leaf elements).
// Aggregates like <STMTTRN> use </STMTTRN> as a closing tag.
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

	return parseSGMLTransactions(text, path)
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
	fitid := sgmlTagValue(block, "FITID")
	dtPosted := sgmlTagValue(block, "DTPOSTED")
	trnAmt := sgmlTagValue(block, "TRNAMT")
	name := sgmlTagValue(block, "NAME")
	memo := sgmlTagValue(block, "MEMO")

	if fitid == "" {
		return Transaction{}, fmt.Errorf("STMTTRN block missing FITID")
	}

	date, err := parseOFXDate(dtPosted)
	if err != nil {
		return Transaction{}, fmt.Errorf("FITID %s: parsing date %q: %w", fitid, dtPosted, err)
	}

	amount, err := parseOFXAmount(trnAmt)
	if err != nil {
		return Transaction{}, fmt.Errorf("FITID %s: parsing amount %q: %w", fitid, trnAmt, err)
	}
	// OFX/SGML: negative = debit (spending), positive = credit (income)
	// Budget app: positive = spending, negative = income
	amount = -amount

	return Transaction{
		TransactionID: fitid,
		Date:          date,
		Amount:        amount,
		Description:   name,
		Memo:          memo,
	}, nil
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
