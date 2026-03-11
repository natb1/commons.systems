package parse

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// rawTransaction holds field values extracted from an OFX/SGML STMTTRN element.
type rawTransaction struct {
	FITID    string
	DtPosted string
	TrnAmt   string
	Name     string
	Memo     string
}

// convertRawTransaction converts raw OFX/SGML fields into a Transaction.
// Used by both the OFX XML parser and the SGML tag scanner.
func convertRawTransaction(raw rawTransaction) (Transaction, error) {
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
	// OFX/SGML: negative = debit (spending), positive = credit (income)
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

// parseOFXDate parses OFX date formats:
//
//	"20250522000000.000"         — 14-digit timestamp
//	"20251023083735.186[-4:EDT]" — timestamp with timezone offset
//	"20251017120000"             — 14-digit without fractional seconds
//	"20250522"                   — 8-digit date only
func parseOFXDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	// Strip timezone bracket suffix if present (e.g., "[-4:EDT]")
	if idx := strings.Index(s, "["); idx >= 0 {
		s = s[:idx]
	}
	// Strip fractional seconds if present
	if idx := strings.Index(s, "."); idx >= 0 {
		s = s[:idx]
	}
	if len(s) < 8 {
		return time.Time{}, fmt.Errorf("OFX date too short: %q", s)
	}
	switch len(s) {
	case 8:
		return time.Parse("20060102", s)
	case 14:
		return time.Parse("20060102150405", s)
	default:
		return time.Time{}, fmt.Errorf("unexpected OFX date format: %q", s)
	}
}

// parseOFXAmount parses an OFX amount string like "-16.19" or "400.00".
func parseOFXAmount(s string) (float64, error) {
	return strconv.ParseFloat(strings.TrimSpace(s), 64)
}
