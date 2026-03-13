package rules

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

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

// rulesOfType filters rules by type and returns them sorted by priority (ascending).
func rulesOfType(rules []Rule, ruleType string) []Rule {
	filtered := make([]Rule, 0, len(rules))
	for _, r := range rules {
		if r.Type == ruleType {
			filtered = append(filtered, r)
		}
	}
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].Priority < filtered[j].Priority
	})
	return filtered
}

// ApplyCategorization applies categorization rules to transactions.
// Rules are matched in priority order (ascending); first match wins.
// Only transactions with an empty Category field are categorized.
// Returns an error listing uncategorized transactions if any remain.
func ApplyCategorization(txns []store.TransactionData, rules []Rule) error {
	catRules := rulesOfType(rules, "categorization")

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
	budgetRules := rulesOfType(rules, "budget_assignment")

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

// NormalizationRule defines a rule for grouping duplicate transactions.
type NormalizationRule struct {
	ID                   string
	Pattern              string // case-insensitive substring (or regex if PatternType=="regex")
	PatternType          string // "substring" (default) or "regex"
	CanonicalDescription string
	DateWindowDays       int // max days between adjacent grouped transactions (single-linkage)
	Institution          string
	Account              string
	Priority             int
}

// compiledNormRule holds a normalization rule with a pre-compiled regex (nil for substring).
type compiledNormRule struct {
	rule  NormalizationRule
	regex *regexp.Regexp
}

// matchNormRule returns true if the rule matches the given transaction.
func matchNormRule(rule NormalizationRule, re *regexp.Regexp, txn store.NormTxn) bool {
	if re != nil {
		if !re.MatchString(txn.Description) {
			return false
		}
	} else {
		if !strings.Contains(strings.ToLower(txn.Description), strings.ToLower(rule.Pattern)) {
			return false
		}
	}
	if rule.Institution != "" && !strings.EqualFold(rule.Institution, txn.Institution) {
		return false
	}
	if rule.Account != "" && !strings.EqualFold(rule.Account, txn.Account) {
		return false
	}
	return true
}

// groupByAmountAndDate partitions matched transactions by exact amount
// then clusters by date using single-linkage within DateWindowDays.
func groupByAmountAndDate(matches []store.NormTxn, rule NormalizationRule) [][]store.NormTxn {
	if len(matches) == 0 {
		return nil
	}

	// Partition by exact amount — duplicates from overlapping statements
	// always have the same amount.
	type amountKey = int64
	partitions := make(map[amountKey][]store.NormTxn)
	for _, txn := range matches {
		partitions[txn.Amount] = append(partitions[txn.Amount], txn)
	}

	var groups [][]store.NormTxn
	window := time.Duration(rule.DateWindowDays) * 24 * time.Hour

	for _, partition := range partitions {
		// Sort by timestamp for single-linkage clustering
		sort.Slice(partition, func(i, j int) bool {
			return partition[i].Timestamp.Before(partition[j].Timestamp)
		})

		if rule.DateWindowDays <= 0 {
			// No date window: all matches in one group
			groups = append(groups, partition)
			continue
		}

		// Single-linkage: start new cluster when gap exceeds window
		cluster := []store.NormTxn{partition[0]}
		for i := 1; i < len(partition); i++ {
			if partition[i].Timestamp.Sub(partition[i-1].Timestamp) <= window {
				cluster = append(cluster, partition[i])
			} else {
				groups = append(groups, cluster)
				cluster = []store.NormTxn{partition[i]}
			}
		}
		groups = append(groups, cluster)
	}

	return groups
}

// selectPrimary picks the primary transaction from a group: latest statement
// period (alphabetically greatest StatementID), then doc ID as tiebreak.
func selectPrimary(group []store.NormTxn) store.NormTxn {
	best := group[0]
	for _, txn := range group[1:] {
		if txn.StatementID > best.StatementID ||
			(txn.StatementID == best.StatementID && txn.DocID > best.DocID) {
			best = txn
		}
	}
	return best
}

// autoNormKey is the grouping key for auto-normalization.
type autoNormKey struct {
	description string // lowercased
	amount      int64
	day         string // "2006-01-02" in UTC
}

// autoNormalize groups transactions with identical description, amount, and
// date from different statements. These are exact duplicates from overlapping
// statement periods that don't require a rule.
func autoNormalize(txns []store.NormTxn, normalized map[string]bool) []store.NormalizationUpdate {
	groups := make(map[autoNormKey][]store.NormTxn)
	for _, txn := range txns {
		key := autoNormKey{
			description: strings.ToLower(txn.Description),
			amount:      txn.Amount,
			day:         txn.Timestamp.UTC().Truncate(24 * time.Hour).Format("2006-01-02"),
		}
		groups[key] = append(groups[key], txn)
	}

	var updates []store.NormalizationUpdate
	for _, group := range groups {
		if len(group) < 2 {
			continue
		}
		// Only form groups where 2+ transactions have different StatementID values
		stmtIDs := make(map[string]bool)
		for _, txn := range group {
			stmtIDs[txn.StatementID] = true
		}
		if len(stmtIDs) < 2 {
			continue
		}

		primary := selectPrimary(group)
		for _, txn := range group {
			normalized[txn.DocID] = true
			updates = append(updates, store.NormalizationUpdate{
				DocID:                 txn.DocID,
				NormalizedID:          primary.DocID,
				NormalizedPrimary:     txn.DocID == primary.DocID,
				NormalizedDescription: primary.Description,
			})
		}
	}
	return updates
}

// ApplyNormalization groups duplicate transactions and returns updates that
// assign normalizedId, normalizedPrimary, and normalizedDescription.
//
// Step 1: Auto-normalize — transactions with identical description, amount,
// and date from different statements are grouped without a rule.
//
// Step 2: Rule-based — remaining transactions are matched against rules
// evaluated in priority order; each transaction is claimed by the first
// rule whose group it joins.
func ApplyNormalization(txns []store.NormTxn, rules []NormalizationRule) ([]store.NormalizationUpdate, error) {
	normalized := make(map[string]bool)
	var updates []store.NormalizationUpdate

	// Step 1: Auto-normalize exact duplicates across different statements
	updates = append(updates, autoNormalize(txns, normalized)...)

	// Step 2: Rule-based normalization
	sorted := make([]NormalizationRule, len(rules))
	copy(sorted, rules)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Priority < sorted[j].Priority
	})

	compiled := make([]compiledNormRule, len(sorted))
	for i, r := range sorted {
		compiled[i].rule = r
		if r.PatternType == "regex" {
			re, err := regexp.Compile("(?i)" + r.Pattern)
			if err != nil {
				return nil, fmt.Errorf("normalization rule %s: invalid regex %q: %w", r.ID, r.Pattern, err)
			}
			compiled[i].regex = re
		}
	}

	for _, cr := range compiled {
		var matches []store.NormTxn
		for _, txn := range txns {
			if normalized[txn.DocID] {
				continue
			}
			if matchNormRule(cr.rule, cr.regex, txn) {
				matches = append(matches, txn)
			}
		}

		groups := groupByAmountAndDate(matches, cr.rule)
		for _, group := range groups {
			if len(group) < 2 {
				continue
			}
			primary := selectPrimary(group)
			for _, txn := range group {
				normalized[txn.DocID] = true
				updates = append(updates, store.NormalizationUpdate{
					DocID:                 txn.DocID,
					NormalizedID:          primary.DocID,
					NormalizedPrimary:     txn.DocID == primary.DocID,
					NormalizedDescription: cr.rule.CanonicalDescription,
				})
			}
		}
	}

	return updates, nil
}
