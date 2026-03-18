package parse

import (
	"encoding/csv"
	"fmt"
	"os"
	"strings"
	"time"
)

// parseCSV parses a bank statement CSV file.
// Bank CSV format:
//
//	Line 1: account metadata [acctNumber, fromDate, toDate, balance, available] — balance extracted
//	Lines 2+: positional data rows with 6 fields:
//	  [0] Date, [1] Amount, [2] Description, [3] (empty), [4] TransactionID, [5] Type
//
// Amount is always positive in the file. Type is "DEBIT" or "CREDIT".
// Convention: DEBIT → positive (spending), CREDIT → negative (income).
func parseCSV(path string) (ParseResult, error) {
	f, err := os.Open(path)
	if err != nil {
		return ParseResult{}, err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	// Bank CSV has variable field counts: the metadata line has 5 fields,
	// data lines have 6. Disable field count checking.
	reader.FieldsPerRecord = -1
	records, err := reader.ReadAll()
	if err != nil {
		return ParseResult{}, fmt.Errorf("parsing CSV %s: %w", path, err)
	}

	if len(records) < 2 {
		return ParseResult{}, fmt.Errorf("%s: CSV file has no data rows", path)
	}

	// Extract balance from metadata line (line 1) if available.
	// Bank CSV metadata format: [acctNumber, fromDate, toDate, balance, available]
	var balance int64
	meta := records[0]
	if len(meta) >= 5 && meta[3] != "" {
		b, err := parseCents(meta[3])
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: parsing balance %q from metadata: %w", path, meta[3], err)
		}
		balance = b
	}

	var txns []Transaction
	idCounts := make(map[string]int)
	for i, row := range records[1:] {
		if len(row) < 6 {
			return ParseResult{}, fmt.Errorf("%s: line %d: expected 6 fields, got %d", path, i+2, len(row))
		}

		date, err := time.Parse("2006/01/02", row[0])
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: line %d: parsing date %q: %w", path, i+2, row[0], err)
		}

		amount, err := parseCents(row[1])
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: line %d: parsing amount %q: %w", path, i+2, row[1], err)
		}

		txnType := strings.TrimSpace(row[5])
		switch txnType {
		case "DEBIT":
		case "CREDIT":
			amount = -amount
		default:
			return ParseResult{}, fmt.Errorf("%s: line %d: unknown transaction type %q", path, i+2, txnType)
		}

		txnID := strings.TrimSpace(row[4])
		if txnID == "" {
			return ParseResult{}, fmt.Errorf("%s: line %d: missing transaction ID", path, i+2)
		}

		idCounts[txnID]++
		if n := idCounts[txnID]; n > 1 {
			txnID = fmt.Sprintf("%s-%d", txnID, n)
		}

		txns = append(txns, Transaction{
			TransactionID: txnID,
			Date:          date,
			Amount:        amount,
			Description:   strings.TrimSpace(row[2]),
		})
	}

	return ParseResult{Transactions: txns, Balance: balance}, nil
}
