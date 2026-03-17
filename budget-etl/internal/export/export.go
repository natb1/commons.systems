package export

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// Output is the top-level JSON structure written by budget-etl --output.
type Output struct {
	Version            int                 `json:"version"`
	ExportedAt         string              `json:"exportedAt"`
	GroupID            string              `json:"groupId"`
	GroupName          string              `json:"groupName"`
	Transactions       []Transaction       `json:"transactions"`
	Budgets            []Budget            `json:"budgets"`
	BudgetPeriods      []BudgetPeriod      `json:"budgetPeriods"`
	Rules              []Rule              `json:"rules"`
	NormalizationRules []NormalizationRule `json:"normalizationRules"`
}

// Transaction is a single transaction in the JSON output.
type Transaction struct {
	ID                      string  `json:"id"`
	Institution             string  `json:"institution"`
	Account                 string  `json:"account"`
	Description             string  `json:"description"`
	Amount                  float64 `json:"amount"`
	Timestamp               string  `json:"timestamp"`
	StatementID             string  `json:"statementId"`
	Category                string  `json:"category"`
	Budget                  *string `json:"budget"`
	Note                    string  `json:"note"`
	Reimbursement           float64 `json:"reimbursement"`
	NormalizedID            *string `json:"normalizedId"`
	NormalizedPrimary       bool    `json:"normalizedPrimary"`
	NormalizedDescription   *string `json:"normalizedDescription"`
}

// Budget is a budget definition in the JSON output.
type Budget struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	WeeklyAllowance float64 `json:"weeklyAllowance"`
	Rollover        string  `json:"rollover"`
}

// BudgetPeriod is an aggregated budget period in the JSON output.
type BudgetPeriod struct {
	ID                string             `json:"id"`
	BudgetID          string             `json:"budgetId"`
	PeriodStart       string             `json:"periodStart"`
	PeriodEnd         string             `json:"periodEnd"`
	Total             float64            `json:"total"`
	Count             int                `json:"count"`
	CategoryBreakdown map[string]float64 `json:"categoryBreakdown"`
}

// Rule is a categorization or budget assignment rule in the JSON output.
type Rule struct {
	ID            string `json:"id"`
	Type          string `json:"type"`
	Pattern       string `json:"pattern"`
	Target        string `json:"target"`
	Priority      int    `json:"priority"`
	Institution   string `json:"institution"`
	Account       string `json:"account"`
	TransactionID string `json:"transactionId,omitempty"`
}

// NormalizationRule is a normalization rule in the JSON output.
type NormalizationRule struct {
	ID                   string `json:"id"`
	Pattern              string `json:"pattern"`
	PatternType          string `json:"patternType"`
	CanonicalDescription string `json:"canonicalDescription"`
	DateWindowDays       int    `json:"dateWindowDays"`
	Institution          string `json:"institution"`
	Account              string `json:"account"`
	Priority             int    `json:"priority"`
}

// FormatTimestamp formats a time.Time as ISO 8601 (RFC 3339) in UTC.
func FormatTimestamp(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}

// ReadFile reads and unmarshals a JSON file into an Output struct.
// Returns an error if the file is missing, contains invalid JSON, or
// is missing required fields (version, groupName, transactions).
func ReadFile(path string) (Output, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Output{}, fmt.Errorf("reading %s: %w", path, err)
	}
	var out Output
	if err := json.Unmarshal(data, &out); err != nil {
		return Output{}, fmt.Errorf("parsing %s: %w", path, err)
	}
	if out.Version == 0 {
		return Output{}, fmt.Errorf("parsing %s: missing or zero 'version' field", path)
	}
	if out.GroupName == "" {
		return Output{}, fmt.Errorf("parsing %s: missing required field 'groupName'", path)
	}
	if out.Transactions == nil {
		return Output{}, fmt.Errorf("parsing %s: missing required field 'transactions'", path)
	}
	return out, nil
}

// WriteFile marshals data as indented JSON and writes it atomically to path
// via a temp file and rename.
func WriteFile(path string, data Output) error {
	b, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling JSON: %w", err)
	}
	b = append(b, '\n')

	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".budget-etl-*.json")
	if err != nil {
		return fmt.Errorf("creating temp file: %w", err)
	}
	tmpPath := tmp.Name()

	if _, err := tmp.Write(b); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("writing temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("closing temp file: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("renaming temp file: %w", err)
	}
	return nil
}
