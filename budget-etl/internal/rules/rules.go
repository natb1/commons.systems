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
	ID              string
	Type            string // "categorization" or "budget_assignment"
	Pattern         string // case-insensitive substring to match against description
	Target          string // categorization: category path (e.g. "Food:Coffee"); budget_assignment: budget ID
	Priority        int    // lower number = higher priority
	Institution     string // optional: restrict to this institution
	Account         string // optional: restrict to this account
	MinAmount       *int64 // optional: minimum amount in cents (inclusive); nil = no filter
	MaxAmount       *int64 // optional: maximum amount in cents (inclusive); nil = no filter
	ExcludeCategory string // optional: reject if category == this or starts with this+":"
	MatchCategory   string // optional: require category == this or starts with this+":"
	Category        string // optional: require category starts with this string (case-insensitive prefix)
}

// matchFields checks whether a pattern/institution/account filter matches the
// given transaction fields. Pattern is a case-insensitive substring of description.
// Institution and account filters are optional; when non-empty they must match
// exactly (case-insensitive).
func matchFields(pattern, ruleInstitution, ruleAccount, description, institution, account string) bool {
	if !strings.Contains(strings.ToLower(description), strings.ToLower(pattern)) {
		return false
	}
	if ruleInstitution != "" && !strings.EqualFold(ruleInstitution, institution) {
		return false
	}
	if ruleAccount != "" && !strings.EqualFold(ruleAccount, account) {
		return false
	}
	return true
}

// Match returns true if the rule matches the given transaction fields.
// Amount is in cents. Filters applied after pattern/institution/account matching:
//   - MinAmount/MaxAmount: inclusive bounds on transaction amount
//   - ExcludeCategory: rejects if category equals this or has this+":" prefix
//   - MatchCategory: requires category to equal this or have this+":" prefix
//   - Category: requires category to start with this prefix (case-insensitive)
func (r Rule) Match(description, institution, account, category string, amount int64) bool {
	if !matchFields(r.Pattern, r.Institution, r.Account, description, institution, account) {
		return false
	}
	if r.MinAmount != nil && amount < *r.MinAmount {
		return false
	}
	if r.MaxAmount != nil && amount > *r.MaxAmount {
		return false
	}
	if r.ExcludeCategory != "" {
		if category == r.ExcludeCategory || strings.HasPrefix(category, r.ExcludeCategory+":") {
			return false
		}
	}
	if r.MatchCategory != "" {
		if category != r.MatchCategory && !strings.HasPrefix(category, r.MatchCategory+":") {
			return false
		}
	}
	if r.Category != "" {
		if !strings.HasPrefix(strings.ToLower(category), strings.ToLower(r.Category)) {
			return false
		}
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
			if r.Match(txns[i].Description, txns[i].Institution, txns[i].Account, txns[i].Category, txns[i].Amount) {
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
// Matching checks pattern, institution, account, amount range (MinAmount/MaxAmount),
// category prefix (Category), exact-or-colon category (MatchCategory), and
// category exclusion (ExcludeCategory) — see Rule.Match for details.
// Only transactions with an empty Budget field are assigned.
// Unmatched transactions are left with an empty budget (no error).
func ApplyBudgetAssignment(txns []store.TransactionData, rules []Rule) {
	budgetRules := rulesOfType(rules, "budget_assignment")

	for i := range txns {
		if txns[i].Budget != "" {
			continue
		}
		for _, r := range budgetRules {
			if r.Match(txns[i].Description, txns[i].Institution, txns[i].Account, txns[i].Category, txns[i].Amount) {
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
	DateWindowDays       int // unused in grouping logic; preserved in JSON export and Firestore schemas
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
// When re is non-nil (regex pattern), it is used for description matching
// instead of a substring check.
func matchNormRule(rule NormalizationRule, re *regexp.Regexp, txn store.NormTxn) bool {
	if re != nil {
		if !re.MatchString(txn.Description) {
			return false
		}
		// Regex matched description; delegate institution/account filtering
		// to matchFields with an empty pattern (always passes substring check).
		return matchFields("", rule.Institution, rule.Account, txn.Description, txn.Institution, txn.Account)
	}
	return matchFields(rule.Pattern, rule.Institution, rule.Account, txn.Description, txn.Institution, txn.Account)
}

// amountDateKey groups transactions by exact amount and calendar date.
type amountDateKey struct {
	amount int64
	day    string // "2006-01-02"
}

// groupByAmountAndDate partitions matched transactions by exact amount
// and exact calendar date (UTC). Duplicates from overlapping statements
// share the same amount and date; different dates are different transactions.
func groupByAmountAndDate(matches []store.NormTxn) [][]store.NormTxn {
	if len(matches) == 0 {
		return nil
	}

	partitions := make(map[amountDateKey][]store.NormTxn)
	for _, txn := range matches {
		key := amountDateKey{
			amount: txn.Amount,
			day:    txn.Timestamp.UTC().Truncate(24 * time.Hour).Format("2006-01-02"),
		}
		partitions[key] = append(partitions[key], txn)
	}

	var groups [][]store.NormTxn
	for _, partition := range partitions {
		groups = append(groups, partition)
	}
	return groups
}

// groupAcrossStatements takes transactions with the same amount and date and
// returns sub-groups that span different statements. Each statement contributes
// at most one transaction per sub-group. If a statement has N transactions and
// another has M, min(N,M) sub-groups are formed; the remaining max(N,M)-min(N,M)
// transactions are standalone (not duplicates).
func groupAcrossStatements(group []store.NormTxn) [][]store.NormTxn {
	byStmt := make(map[string][]store.NormTxn)
	for _, txn := range group {
		byStmt[txn.StatementID] = append(byStmt[txn.StatementID], txn)
	}
	if len(byStmt) < 2 {
		return nil
	}
	stmtIDs := make([]string, 0, len(byStmt))
	for id := range byStmt {
		stmtIDs = append(stmtIDs, id)
	}
	sort.Strings(stmtIDs)
	for _, txns := range byStmt {
		sort.Slice(txns, func(i, j int) bool { return txns[i].DocID < txns[j].DocID })
	}

	maxCount := 0
	for _, txns := range byStmt {
		if len(txns) > maxCount {
			maxCount = len(txns)
		}
	}

	var result [][]store.NormTxn
	for i := 0; i < maxCount; i++ {
		var subgroup []store.NormTxn
		for _, sid := range stmtIDs {
			txns := byStmt[sid]
			if i < len(txns) {
				subgroup = append(subgroup, txns[i])
			}
		}
		if len(subgroup) >= 2 {
			result = append(result, subgroup)
		}
	}
	return result
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

// autoNormalize groups transactions with matching description (case-insensitive),
// amount, and date from different statements. These are exact duplicates from
// overlapping statement periods that don't require a rule.
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
		pairs := groupAcrossStatements(group)
		for _, pair := range pairs {
			primary := selectPrimary(pair)
			for _, txn := range pair {
				normalized[txn.DocID] = true
				updates = append(updates, store.NormalizationUpdate{
					DocID:                 txn.DocID,
					NormalizedID:          primary.DocID,
					NormalizedPrimary:     txn.DocID == primary.DocID,
					NormalizedDescription: primary.Description,
				})
			}
		}
	}
	return updates
}

// ApplyNormalization groups duplicate transactions and returns updates that
// assign normalizedId, normalizedPrimary, and normalizedDescription.
//
// Step 1: Auto-normalize — transactions with matching description (case-insensitive), amount,
// and date from different statements are grouped without a rule.
//
// Step 2: Rule-based — remaining transactions are matched against rules
// evaluated in priority order; each transaction is claimed by the first
// rule that matches it and groups it with at least one other transaction.
// Singleton groups (size 1) are discarded so the transaction remains
// available for lower-priority rules. Regex rules use case-insensitive
// matching.
//
// Returns an error if a rule has an invalid regex pattern or an unrecognized
// PatternType.
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
		} else if r.PatternType != "" && r.PatternType != "substring" {
			return nil, fmt.Errorf("normalization rule %s: unknown patternType %q (expected \"substring\" or \"regex\")", r.ID, r.PatternType)
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

		groups := groupByAmountAndDate(matches)
		for _, group := range groups {
			pairs := groupAcrossStatements(group)
			for _, pair := range pairs {
				primary := selectPrimary(pair)
				for _, txn := range pair {
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
	}

	return updates, nil
}
