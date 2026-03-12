package rules

import (
	"fmt"
	"sort"
	"strings"

	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

// Rule defines a categorization or budget assignment rule.
type Rule struct {
	ID          string
	Type        string // "categorization" or "budget_assignment"
	Pattern     string // case-insensitive substring to match against description
	Target      string // categorization: category path (e.g. "Food:Coffee"); budget_assignment: budget ID
	Priority    int    // lower number = higher priority
	Institution string // optional: restrict to this institution
	Account     string // optional: restrict to this account
}

// Match returns true if the rule matches the given transaction fields.
// Pattern is matched as a case-insensitive substring of description.
// Institution and Account filters are optional; when non-empty, they must
// match exactly (case-insensitive).
func (r Rule) Match(description, institution, account string) bool {
	if !strings.Contains(strings.ToLower(description), strings.ToLower(r.Pattern)) {
		return false
	}
	if r.Institution != "" && !strings.EqualFold(r.Institution, institution) {
		return false
	}
	if r.Account != "" && !strings.EqualFold(r.Account, account) {
		return false
	}
	return true
}

func sortByPriority(rules []Rule) []Rule {
	sorted := make([]Rule, len(rules))
	copy(sorted, rules)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Priority < sorted[j].Priority
	})
	return sorted
}

// ApplyCategorization applies categorization rules to transactions.
// Rules are matched in priority order (ascending); first match wins.
// Only transactions with an empty Category field are categorized.
// Returns an error listing uncategorized transactions if any remain.
func ApplyCategorization(txns []store.TransactionData, rules []Rule) error {
	catRules := make([]Rule, 0, len(rules))
	for _, r := range rules {
		if r.Type == "categorization" {
			catRules = append(catRules, r)
		}
	}
	catRules = sortByPriority(catRules)

	var uncategorized []string
	for i := range txns {
		if txns[i].Category != "" {
			continue
		}
		matched := false
		for _, r := range catRules {
			if r.Match(txns[i].Description, txns[i].Institution, txns[i].Account) {
				txns[i].Category = r.Target
				matched = true
				break
			}
		}
		if !matched {
			uncategorized = append(uncategorized, fmt.Sprintf("%s/%s: %q",
				txns[i].StatementID, txns[i].TransactionID, txns[i].Description))
		}
	}

	if len(uncategorized) > 0 {
		return fmt.Errorf("%d uncategorized transactions:\n  %s",
			len(uncategorized), strings.Join(uncategorized, "\n  "))
	}
	return nil
}

// ApplyBudgetAssignment applies budget assignment rules to transactions.
// Rules are matched in priority order (ascending); first match wins.
// Only transactions with an empty Budget field are assigned.
// Unmatched transactions are left with an empty budget (no error).
func ApplyBudgetAssignment(txns []store.TransactionData, rules []Rule) {
	budgetRules := make([]Rule, 0, len(rules))
	for _, r := range rules {
		if r.Type == "budget_assignment" {
			budgetRules = append(budgetRules, r)
		}
	}
	budgetRules = sortByPriority(budgetRules)

	for i := range txns {
		if txns[i].Budget != "" {
			continue
		}
		for _, r := range budgetRules {
			if r.Match(txns[i].Description, txns[i].Institution, txns[i].Account) {
				txns[i].Budget = r.Target
				break
			}
		}
	}
}
