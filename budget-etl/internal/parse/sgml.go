package parse

import (
	"bytes"
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

	// Strip a leading UTF-8 BOM so it does not pollute the header scan or the
	// first tag, then decode per the declared CHARSET. The OFX SGML header is a
	// block of KEY:VALUE lines (OFXHEADER:, CHARSET:, …) ending at the <OFX> tag.
	data = bytes.TrimPrefix(data, []byte{0xEF, 0xBB, 0xBF})
	header := string(data)
	if i := strings.Index(header, "<OFX"); i >= 0 {
		header = header[:i]
	}
	var text string
	switch charset := sgmlCharset(header); charset {
	case "1252":
		text = decodeWindows1252(data)
	case "":
		// CHARSET is absent: default to UTF-8.
		text = string(data)
	default:
		// A declared but unsupported charset must error rather than silently
		// decode as UTF-8, which would mangle non-ASCII bytes to garbage.
		return ParseResult{}, fmt.Errorf("unsupported CHARSET %q in %s; only 1252 is supported", charset, path)
	}

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

	// Detect credit-card statements: OFX 1.x SGML card exports carry the
	// CREDITCARDMSGSRSV1 message set. Mirrors the XML path's len(doc.CCTxns) > 0
	// check so the journal layer types the account as a liability.
	result.IsCreditCard = strings.Contains(text, "CREDITCARDMSGSRSV1")

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
	end := indexFrom(text, "</LEDGERBAL>", idx)
	if end < 0 {
		end = len(text)
	}
	block := text[idx:end]
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

// cp1252High maps Windows-1252 bytes 0x80–0x9F to their Unicode runes
// (index = byte - 0x80). 0x00–0x7F are ASCII identity and 0xA0–0xFF are
// Latin-1 identity, so only this 32-entry high range needs a table. The five
// bytes undefined in CP1252 (0x81, 0x8D, 0x8F, 0x90, 0x9D) map to U+FFFD.
// Reference: the Unicode CP1252 0x80–0x9F mapping.
var cp1252High = [32]rune{
	'€', '�', '‚', 'ƒ', '„', '…', '†', '‡',
	'ˆ', '‰', 'Š', '‹', 'Œ', '�', 'Ž', '�',
	'�', '‘', '’', '“', '”', '•', '–', '—',
	'˜', '™', 'š', '›', 'œ', '�', 'ž', 'Ÿ',
}

// decodeWindows1252 decodes a Windows-1252 (CP1252) byte slice to a UTF-8 Go
// string. Bytes 0x00–0x7F and 0xA0–0xFF map to rune(b); bytes 0x80–0x9F use the
// cp1252High table (with the five CP1252-undefined bytes mapped to U+FFFD).
func decodeWindows1252(data []byte) string {
	var b strings.Builder
	b.Grow(len(data))
	for _, c := range data {
		if c >= 0x80 && c <= 0x9F {
			b.WriteRune(cp1252High[c-0x80])
		} else {
			b.WriteRune(rune(c))
		}
	}
	return b.String()
}

// sgmlCharset scans an OFX SGML header for a standalone CHARSET: line (e.g.
// "CHARSET:1252") and returns the trimmed token after the colon (e.g. "1252").
// Returns "" if no CHARSET line is present.
func sgmlCharset(header string) string {
	for _, line := range strings.Split(header, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "CHARSET:") {
			return strings.TrimSpace(strings.TrimPrefix(line, "CHARSET:"))
		}
	}
	return ""
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
