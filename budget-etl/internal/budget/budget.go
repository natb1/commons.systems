package budget

import (
	"crypto/sha256"
	"fmt"
	"math"
	"strings"
	"time"
)

// StatementData holds the fields for a parsed statement in a budget snapshot.
type StatementData struct {
	StatementID         string
	Institution         string
	Account             string
	Balance             int64 // cents; raw signed value from statement
	Period              string
	BalanceDate         *time.Time // LEDGERBAL DTASOF; nil if absent
	GroupID             string
	MemberEmails        []string
	LastTransactionDate *time.Time // nil when not yet computed or no transactions exist for this account
}

// StatementDocID generates a deterministic document ID from a statement ID
// using a truncated sha256 hash (10 bytes / 20 hex characters), matching
// the TransactionDocID scheme.
func StatementDocID(statementID string) string {
	if statementID == "" {
		panic("statementDocID: empty statementID")
	}
	h := sha256.Sum256([]byte(statementID))
	return fmt.Sprintf("%x", h[:10])
}

// TransactionData holds the fields for a parsed transaction in a budget snapshot.
type TransactionData struct {
	Institution     string
	Account         string
	Description     string
	Amount          int64 // cents; positive = spending, negative = income/credit
	Timestamp       time.Time
	StatementID     string
	StatementItemID string // immutable bank line id; empty for manual/virtual entries
	TransactionID   string
	Category        string // set by categorization rules; preserved across re-imports
	Budget          string // set by budget assignment rules; preserved across re-imports
	Virtual         bool   // true for ETL-generated virtual transactions
}

// StatementItemDocID generates a deterministic document ID from a statement-item ID
// using a truncated sha256 hash (10 bytes / 20 hex characters).
func StatementItemDocID(statementItemID string) string {
	if statementItemID == "" {
		panic("statementItemDocID: empty statementItemID")
	}
	h := sha256.Sum256([]byte(statementItemID))
	return fmt.Sprintf("%x", h[:10])
}

// NormTxn is a read-only view of a transaction used by normalization rules.
type NormTxn struct {
	DocID       string
	Description string
	Institution string
	Account     string
	Amount      int64 // cents
	Timestamp   time.Time
	StatementID string
}

// NormalizationUpdate holds the normalization fields to write back to a transaction document.
type NormalizationUpdate struct {
	DocID                 string
	NormalizedID          string // primary's doc ID; empty to clear
	NormalizedPrimary     bool
	NormalizedDescription string // canonical description; empty to clear
}

// DollarAmount converts int64 cents to float64 dollars.
func DollarAmount(cents int64) float64 { return float64(cents) / 100 }

// TransactionDocID generates a deterministic document ID from a statement ID
// and transaction ID using a truncated sha256 hash (10 bytes / 20 hex characters).
// Collision probability is negligible for the expected transaction volume
// (< 1 million documents).
func TransactionDocID(statementID, transactionID string) string {
	if statementID == "" || transactionID == "" {
		panic(fmt.Sprintf("transactionDocID: empty input (statement=%q, txn=%q)", statementID, transactionID))
	}
	h := sha256.Sum256([]byte(statementID + "/" + transactionID))
	return fmt.Sprintf("%x", h[:10])
}

// PeriodStart returns the Monday 00:00 UTC at or before t.
func PeriodStart(t time.Time) time.Time {
	t = t.UTC().Truncate(24 * time.Hour)
	weekday := t.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	offset := int(weekday) - int(time.Monday)
	return t.AddDate(0, 0, -offset)
}

// PeriodEnd returns the Monday 00:00 UTC after start (start + 7 days).
func PeriodEnd(start time.Time) time.Time {
	return start.AddDate(0, 0, 7)
}

// PeriodID returns the canonical period document ID: "{budgetID}-{YYYY-MM-DD}".
func PeriodID(budgetID string, start time.Time) string {
	return fmt.Sprintf("%s-%s", budgetID, start.Format("2006-01-02"))
}

// periodData holds aggregated transaction data for a single budget period.
type periodData struct {
	budgetID          string
	start             time.Time
	total             float64
	count             int
	categoryBreakdown map[string]float64
}

// aggregateTransactions groups transactions by budget period and computes
// total, count, and categoryBreakdown for each period. Non-primary normalized
// transactions are excluded. Transactions with an empty budget are skipped
// (unassigned). Returns a map keyed by period ID.
func aggregateTransactions(txns []FullTransaction) map[string]*periodData {
	periods := make(map[string]*periodData)

	for _, txn := range txns {
		if txn.NormalizedID != "" && !txn.NormalizedPrimary {
			continue
		}
		if txn.Budget == "" {
			continue
		}

		net := txn.Amount * (1 - txn.Reimbursement/100)
		ps := PeriodStart(txn.Timestamp)
		key := PeriodID(txn.Budget, ps)

		pd, exists := periods[key]
		if !exists {
			pd = &periodData{
				budgetID:          txn.Budget,
				start:             ps,
				categoryBreakdown: make(map[string]float64),
			}
			periods[key] = pd
		}
		pd.total += net
		pd.count++
		if txn.Category != "" {
			pd.categoryBreakdown[txn.Category] += net
		}
	}

	return periods
}

// WeeklyAggregateResult holds pre-computed weekly credit and unbudgeted spending totals.
type WeeklyAggregateResult struct {
	WeekStart       time.Time
	CreditTotal     float64 // positive: absolute value of net amount for credit transactions (where net < 0)
	UnbudgetedTotal float64 // positive: sum of net amount for unbudgeted spending
}

// isCardPaymentCategory returns true for Transfer:CardPayment and its subcategories.
func isCardPaymentCategory(cat string) bool {
	return strings.HasPrefix(cat, "Transfer:CardPayment:") || cat == "Transfer:CardPayment"
}

// ComputeWeeklyAggregates groups transactions into Monday-aligned weeks and computes
// credit totals and unbudgeted spending totals per week.
//
// Excluded: non-primary normalized transactions.
// Credit filter: net < 0, not Transfer:CardPayment* category.
// Unbudgeted filter: Budget == "", net > 0.
func ComputeWeeklyAggregates(txns []FullTransaction) []WeeklyAggregateResult {
	type weekData struct {
		creditTotal     float64
		unbudgetedTotal float64
	}
	weeks := make(map[time.Time]*weekData)

	for _, txn := range txns {
		if txn.NormalizedID != "" && !txn.NormalizedPrimary {
			continue
		}

		net := txn.Amount * (1 - txn.Reimbursement/100)
		ps := PeriodStart(txn.Timestamp)

		wd, exists := weeks[ps]
		if !exists {
			wd = &weekData{}
			weeks[ps] = wd
		}

		// Credit: negative net, not card payment
		if net < 0 && !isCardPaymentCategory(txn.Category) {
			wd.creditTotal += -net
		}

		// Unbudgeted spending: no budget, positive net, not card payment
		if txn.Budget == "" && net > 0 && !isCardPaymentCategory(txn.Category) {
			wd.unbudgetedTotal += net
		}
	}

	result := make([]WeeklyAggregateResult, 0, len(weeks))
	for weekStart, wd := range weeks {
		result = append(result, WeeklyAggregateResult{
			WeekStart:       weekStart,
			CreditTotal:     math.Round(wd.creditTotal*100) / 100,
			UnbudgetedTotal: math.Round(wd.unbudgetedTotal*100) / 100,
		})
	}
	return result
}

// FullTransaction holds all fields needed for period aggregation.
type FullTransaction struct {
	ID                string
	Budget            string // empty when unassigned
	Category          string
	Amount            float64 // dollars
	Reimbursement     float64 // percentage (0-100)
	Timestamp         time.Time
	NormalizedID      string // empty when not normalized
	NormalizedPrimary bool
}

// PeriodResult holds aggregated data for a single budget period.
type PeriodResult struct {
	ID                string
	BudgetID          string
	Start             time.Time
	End               time.Time
	Total             float64
	Count             int
	CategoryBreakdown map[string]float64
}

// ComputePeriods groups transactions by budget period and computes total, count,
// and categoryBreakdown for each period. Non-primary normalized transactions
// are excluded. Transactions with an empty budget are skipped (unassigned).
func ComputePeriods(txns []FullTransaction) []PeriodResult {
	periods := aggregateTransactions(txns)

	result := make([]PeriodResult, 0, len(periods))
	for key, pd := range periods {
		total := math.Round(pd.total*100) / 100
		roundedBreakdown := make(map[string]float64, len(pd.categoryBreakdown))
		for cat, val := range pd.categoryBreakdown {
			roundedBreakdown[cat] = math.Round(val*100) / 100
		}
		result = append(result, PeriodResult{
			ID:                key,
			BudgetID:          pd.budgetID,
			Start:             pd.start,
			End:               PeriodEnd(pd.start),
			Total:             total,
			Count:             pd.count,
			CategoryBreakdown: roundedBreakdown,
		})
	}
	return result
}
