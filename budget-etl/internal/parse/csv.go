package parse

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// parseCSV parses a PNC-format CSV file.
// PNC CSV format:
//   Line 1: account header (skipped)
//   Lines 2+: Date,Amount,Description,,TransactionID,Type
// Amount is always positive in the file. Type is "DEBIT" or "CREDIT".
// Convention: DEBIT → positive (spending), CREDIT → negative (income).
func parseCSV(path string) (ParseResult, error) {
	f, err := os.Open(path)
	if err != nil {
		return ParseResult{}, err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	// PNC CSV has variable field counts: the header line has 5 fields,
	// data lines have 6. Disable field count checking.
	reader.FieldsPerRecord = -1
	records, err := reader.ReadAll()
	if err != nil {
		return ParseResult{}, fmt.Errorf("parsing CSV %s: %w", path, err)
	}

	if len(records) < 2 {
		return ParseResult{}, nil
	}

	var txns []Transaction
	for i, row := range records[1:] {
		if len(row) < 6 {
			return ParseResult{}, fmt.Errorf("%s: line %d: expected 6 fields, got %d", path, i+2, len(row))
		}

		date, err := time.Parse("2006/01/02", row[0])
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: line %d: parsing date %q: %w", path, i+2, row[0], err)
		}

		amount, err := strconv.ParseFloat(row[1], 64)
		if err != nil {
			return ParseResult{}, fmt.Errorf("%s: line %d: parsing amount %q: %w", path, i+2, row[1], err)
		}

		txnType := strings.TrimSpace(row[5])
		switch txnType {
		case "DEBIT":
			// positive = spending (already positive)
		case "CREDIT":
			amount = -amount
		default:
			return ParseResult{}, fmt.Errorf("%s: line %d: unknown transaction type %q", path, i+2, txnType)
		}

		txnID := strings.TrimSpace(row[4])
		if txnID == "" {
			return ParseResult{}, fmt.Errorf("%s: line %d: missing transaction ID", path, i+2)
		}

		txns = append(txns, Transaction{
			TransactionID: txnID,
			Date:          date,
			Amount:        amount,
			Description:   strings.TrimSpace(row[2]),
		})
	}

	return ParseResult{Transactions: txns}, nil
}
