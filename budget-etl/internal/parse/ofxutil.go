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
	if strings.TrimSpace(raw.DtPosted) == "" {
		return Transaction{}, fmt.Errorf("FITID %s: missing DTPOSTED", fitid)
	}
	if strings.TrimSpace(raw.TrnAmt) == "" {
		return Transaction{}, fmt.Errorf("FITID %s: missing TRNAMT", fitid)
	}

	date, err := parseOFXDate(raw.DtPosted)
	if err != nil {
		return Transaction{}, fmt.Errorf("FITID %s: parsing date %q: %w", fitid, raw.DtPosted, err)
	}

	amount, err := parseCents(raw.TrnAmt)
	if err != nil {
		return Transaction{}, fmt.Errorf("FITID %s: parsing amount %q: %w", fitid, raw.TrnAmt, err)
	}
	// OFX/SGML: negative = debit (spending), positive = credit (income)
	// Transaction.Amount: positive = spending, negative = income
	amount = -amount

	return Transaction{
		TransactionID: fitid,
		Date:          date,
		Amount:        amount,
		Description:   strings.TrimSpace(raw.Name),
		Memo:          strings.TrimSpace(raw.Memo),
	}, nil
}

// parseOFXDate parses the date portion (YYYYMMDD) from OFX date strings.
// Timezone offsets and intraday timestamps are discarded because OFX files
// use varying offsets and transaction dates are business dates.
//
// Accepted input formats:
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
	// Use only the date portion to avoid timezone offset issues.
	return time.Parse("20060102", s[:8])
}

// parseCents parses a decimal amount string to integer cents.
// Handles formats like "400.00", "-16.19", "3001.83".
func parseCents(s string) (int64, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, fmt.Errorf("empty amount")
	}
	neg := false
	if s[0] == '-' {
		neg = true
		s = s[1:]
	}
	parts := strings.SplitN(s, ".", 2)
	dollars, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, err
	}
	var cents int64
	if len(parts) == 2 && len(parts[1]) > 0 {
		frac := parts[1]
		if len(frac) > 2 {
			frac = frac[:2]
		}
		c, err := strconv.ParseInt(frac, 10, 64)
		if err != nil {
			return 0, err
		}
		if len(parts[1]) == 1 {
			c *= 10
		}
		cents = c
	}
	total := dollars*100 + cents
	if neg {
		total = -total
	}
	return total, nil
}
