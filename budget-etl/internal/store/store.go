package store

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
)

// Client wraps a Firestore client with budget-specific operations.
type Client struct {
	fs  *firestore.Client
	env string
}

// NewClient creates a Firestore client using the Firebase Admin SDK
// with Application Default Credentials. If projectID is empty, the
// Firebase SDK attempts to infer it (e.g., from metadata server).
// Callers should resolve the project ID explicitly when possible.
func NewClient(ctx context.Context, projectID, env string) (*Client, error) {
	if env == "" {
		return nil, fmt.Errorf("env must not be empty")
	}
	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: projectID})
	if err != nil {
		return nil, fmt.Errorf("initializing firebase app: %w", err)
	}

	fs, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating firestore client: %w", err)
	}

	return &Client{fs: fs, env: env}, nil
}

// Close closes the underlying Firestore client.
func (c *Client) Close() error {
	return c.fs.Close()
}

// GroupInfo holds group document data needed for transaction upsert.
type GroupInfo struct {
	ID           string
	MemberEmails []string
}

// LookupGroup queries budget/{env}/groups for a group with the given name
// that contains the given email in its members array.
func (c *Client) LookupGroup(ctx context.Context, email, groupName string) (GroupInfo, error) {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/groups", c.env))
	docs, err := col.Where("members", "array-contains", email).Documents(ctx).GetAll()
	if err != nil {
		return GroupInfo{}, fmt.Errorf("querying groups: %w", err)
	}

	for _, doc := range docs {
		name, ok := doc.Data()["name"].(string)
		if !ok || name != groupName {
			continue
		}
		members, ok := doc.Data()["members"].([]interface{})
		if !ok {
			return GroupInfo{}, fmt.Errorf("group %q: members field is not an array", groupName)
		}
		emails := make([]string, 0, len(members))
		for _, m := range members {
			s, ok := m.(string)
			if !ok {
				return GroupInfo{}, fmt.Errorf("group %q: non-string member value: %v", groupName, m)
			}
			emails = append(emails, s)
		}
		return GroupInfo{ID: doc.Ref.ID, MemberEmails: emails}, nil
	}

	return GroupInfo{}, fmt.Errorf("no group named %q found containing member %s", groupName, email)
}


// StatementData holds the fields to write to a Firestore statement document.
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

// UpsertStatements writes statement documents to Firestore in batches of 500.
// Full overwrite (no merge) — statements have no user-editable fields.
func (c *Client) UpsertStatements(ctx context.Context, stmts []StatementData) error {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/statements", c.env))

	const maxBatch = 500
	for i := 0; i < len(stmts); i += maxBatch {
		end := i + maxBatch
		if end > len(stmts) {
			end = len(stmts)
		}
		batch := c.fs.Batch()
		for _, stmt := range stmts[i:end] {
			ref := col.Doc(StatementDocID(stmt.StatementID))
			balanceDate := ""
			if stmt.BalanceDate != nil {
				balanceDate = stmt.BalanceDate.Format("2006-01-02")
			}
			batch.Set(ref, map[string]interface{}{
				"statementId":         stmt.StatementID,
				"institution":         stmt.Institution,
				"account":             stmt.Account,
				"balance":             DollarAmount(stmt.Balance),
				"period":              stmt.Period,
				"balanceDate":         balanceDate,
				"groupId":             stmt.GroupID,
				"memberEmails":        stmt.MemberEmails,
				"lastTransactionDate": stmt.LastTransactionDate,
			})
		}
		if _, err := batch.Commit(ctx); err != nil {
			return fmt.Errorf("committing statement batch: %w", err)
		}
	}

	log.Printf("upserted %d statements", len(stmts))
	return nil
}

// TransactionData holds the fields to write to a Firestore transaction document.
type TransactionData struct {
	Institution   string
	Account       string
	Description   string
	Amount        int64 // cents; positive = spending, negative = income/credit
	Timestamp     time.Time
	StatementID   string
	TransactionID string
	Category      string // set by categorization rules; preserved across re-imports
	Budget        string // set by budget assignment rules; preserved across re-imports
	Virtual       bool   // true for ETL-generated virtual transactions
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

// UpsertResult tracks how many transactions were created vs updated.
type UpsertResult struct {
	Created int
	Updated int
}

// importFieldPaths lists the fields set by import that overwrite on re-import.
// Any field set as a default on create but excluded from this list is
// user-editable and preserved across re-imports (note, reimbursement).
// Category and budget are set by the rule engine for new transactions and
// preserved across re-imports, even if rules have changed. Normalization
// fields are also excluded; they are managed by the post-upsert normalization step.
var importFieldPaths = []firestore.FieldPath{
	{"institution"},
	{"account"},
	{"description"},
	{"amount"},
	{"timestamp"},
	{"statementId"},
	{"groupId"},
	{"memberEmails"},
}

// UpsertTransactions writes transactions to Firestore in batches.
// For each batch of up to 500 transactions:
//   - Batch-read existing documents via GetAll
//   - New documents: Set with all fields. Defaults: note="", reimbursement=0.
//     Category and budget are set by the rule engine before upsert.
//     ApplyCategorization enforces 100% coverage, so category is always
//     non-empty for new transactions. Budget is nil when no assignment rule matches.
//   - Existing documents: Set with merge to update only import-sourced fields, preserving user edits
func (c *Client) UpsertTransactions(ctx context.Context, group GroupInfo, txns []TransactionData) (UpsertResult, error) {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/transactions", c.env))
	var result UpsertResult

	const maxBatch = 500
	for i := 0; i < len(txns); i += maxBatch {
		end := i + maxBatch
		if end > len(txns) {
			end = len(txns)
		}
		chunk := txns[i:end]

		// Build document references
		refs := make([]*firestore.DocumentRef, len(chunk))
		for j, txn := range chunk {
			refs[j] = col.Doc(TransactionDocID(txn.StatementID, txn.TransactionID))
		}

		// Batch read to check which documents exist
		snaps, err := c.fs.GetAll(ctx, refs)
		if err != nil {
			// GetAll returns NotFound for missing docs in the snapshot array,
			// not as an error. A top-level error means a real failure.
			return result, fmt.Errorf("checking existing transactions: %w", err)
		}

		// Batch write: Set new docs, merge-update existing docs
		batch := c.fs.Batch()
		var creates, updates int
		for j, txn := range chunk {
			if snaps[j].Exists() {
				batch.Set(refs[j], importFields(txn, group), firestore.Merge(importFieldPaths...))
				updates++
			} else {
				batch.Set(refs[j], allFields(txn, group))
				creates++
			}
		}
		if _, err := batch.Commit(ctx); err != nil {
			return result, fmt.Errorf("committing transaction batch: %w", err)
		}
		result.Created += creates
		result.Updated += updates
	}

	log.Printf("upsert complete: %d created, %d updated", result.Created, result.Updated)
	return result, nil
}

// DollarAmount converts int64 cents to float64 dollars.
func DollarAmount(cents int64) float64 { return float64(cents) / 100 }

// allFields returns a map of all transaction document fields including user-editable defaults.
// Amount is converted from int64 cents to float64 dollars for the Firestore schema.
// Budget is nil (not "") when unassigned so the client can distinguish "no budget" from
// "empty string budget". Category is expected to be non-empty; ApplyCategorization
// enforces 100% coverage before upsert.
// Normalization fields default to unnormalized: normalizedId=nil, normalizedPrimary=true,
// normalizedDescription=nil.
func allFields(txn TransactionData, group GroupInfo) map[string]interface{} {
	m := importFields(txn, group)
	m["note"] = ""
	m["category"] = txn.Category
	m["reimbursement"] = 0
	if txn.Budget != "" {
		m["budget"] = txn.Budget
	} else {
		m["budget"] = nil
	}
	m["normalizedId"] = nil
	m["normalizedPrimary"] = true
	m["normalizedDescription"] = nil
	return m
}

// importFields returns a map of only the import-sourced fields for merge updates.
func importFields(txn TransactionData, group GroupInfo) map[string]interface{} {
	return map[string]interface{}{
		"institution":  txn.Institution,
		"account":      txn.Account,
		"description":  txn.Description,
		"amount":       DollarAmount(txn.Amount),
		"timestamp":    txn.Timestamp,
		"statementId":  txn.StatementID,
		"groupId":      group.ID,
		"memberEmails": group.MemberEmails,
	}
}

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

// RuleDoc holds a rule document read from Firestore.
type RuleDoc struct {
	ID              string
	Type            string
	Pattern         string
	Target          string
	Priority        int
	Institution     string
	Account         string
	MinAmount       *float64
	MaxAmount       *float64
	ExcludeCategory string
	MatchCategory   string
	Category        string
}

// LoadRules reads rules from budget/{env}/rules, filtered by groupId.
func (c *Client) LoadRules(ctx context.Context, groupID string) ([]RuleDoc, error) {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/rules", c.env))
	docs, err := col.Where("groupId", "==", groupID).Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("querying rules: %w", err)
	}

	result := make([]RuleDoc, 0, len(docs))
	for _, doc := range docs {
		d := doc.Data()
		r := RuleDoc{
			ID: doc.Ref.ID,
		}
		v, ok := d["type"].(string)
		if !ok {
			return nil, fmt.Errorf("rule %s: field 'type' is not a string (got %T)", doc.Ref.ID, d["type"])
		}
		r.Type = v
		if v != "categorization" && v != "budget_assignment" {
			return nil, fmt.Errorf("rule %s: unknown type %q (expected categorization or budget_assignment)", doc.Ref.ID, v)
		}
		v, ok = d["pattern"].(string)
		if !ok {
			return nil, fmt.Errorf("rule %s: field 'pattern' is not a string (got %T)", doc.Ref.ID, d["pattern"])
		}
		r.Pattern = v
		v, ok = d["target"].(string)
		if !ok {
			return nil, fmt.Errorf("rule %s: field 'target' is not a string (got %T)", doc.Ref.ID, d["target"])
		}
		r.Target = v
		if p, ok := d["priority"].(int64); ok {
			r.Priority = int(p)
		} else if p, ok := d["priority"].(float64); ok {
			r.Priority = int(p)
		} else {
			return nil, fmt.Errorf("rule %s: field 'priority' is not a number (got %T)", doc.Ref.ID, d["priority"])
		}
		if v, ok := d["institution"].(string); ok {
			r.Institution = v
		} else if d["institution"] != nil {
			return nil, fmt.Errorf("rule %s: field 'institution' is not a string (got %T)", doc.Ref.ID, d["institution"])
		}
		if v, ok := d["account"].(string); ok {
			r.Account = v
		} else if d["account"] != nil {
			return nil, fmt.Errorf("rule %s: field 'account' is not a string (got %T)", doc.Ref.ID, d["account"])
		}
		if v, ok := d["minAmount"].(float64); ok {
			r.MinAmount = &v
		} else if v, ok := d["minAmount"].(int64); ok {
			f := float64(v)
			r.MinAmount = &f
		} else if d["minAmount"] != nil {
			return nil, fmt.Errorf("rule %s: field 'minAmount' is not a number (got %T)", doc.Ref.ID, d["minAmount"])
		}
		if v, ok := d["maxAmount"].(float64); ok {
			r.MaxAmount = &v
		} else if v, ok := d["maxAmount"].(int64); ok {
			f := float64(v)
			r.MaxAmount = &f
		} else if d["maxAmount"] != nil {
			return nil, fmt.Errorf("rule %s: field 'maxAmount' is not a number (got %T)", doc.Ref.ID, d["maxAmount"])
		}
		if v, ok := d["excludeCategory"].(string); ok {
			r.ExcludeCategory = v
		} else if d["excludeCategory"] != nil {
			return nil, fmt.Errorf("rule %s: field 'excludeCategory' is not a string (got %T)", doc.Ref.ID, d["excludeCategory"])
		}
		if v, ok := d["matchCategory"].(string); ok {
			r.MatchCategory = v
		} else if d["matchCategory"] != nil {
			return nil, fmt.Errorf("rule %s: field 'matchCategory' is not a string (got %T)", doc.Ref.ID, d["matchCategory"])
		}
		if v, ok := d["category"].(string); ok {
			r.Category = v
		} else if d["category"] != nil {
			return nil, fmt.Errorf("rule %s: field 'category' is not a string (got %T)", doc.Ref.ID, d["category"])
		}
		result = append(result, r)
	}

	log.Printf("loaded %d rules for group %s", len(result), groupID)
	return result, nil
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

// RecalculatePeriods recomputes total, count, and categoryBreakdown for all
// budget periods overlapping [minTime, maxTime] for the given group.
// Aggregates stored category and budget values, which may reflect different
// rule versions for different transactions.
func (c *Client) RecalculatePeriods(ctx context.Context, group GroupInfo, minTime, maxTime time.Time) error {
	periodStart := PeriodStart(minTime)
	periodEnd := PeriodEnd(PeriodStart(maxTime))

	// Load existing budget periods overlapping the time range
	periodCol := c.fs.Collection(fmt.Sprintf("budget/%s/budget-periods", c.env))
	periodDocs, err := periodCol.
		Where("groupId", "==", group.ID).
		Where("periodStart", ">=", periodStart).
		Where("periodStart", "<", periodEnd).
		Documents(ctx).GetAll()
	if err != nil {
		return fmt.Errorf("querying budget periods: %w", err)
	}

	existingPeriods := make(map[string]bool, len(periodDocs))
	for _, doc := range periodDocs {
		existingPeriods[doc.Ref.ID] = true
	}

	// Load all transactions for the group in [periodStart, periodEnd)
	txnCol := c.fs.Collection(fmt.Sprintf("budget/%s/transactions", c.env))
	txnDocs, err := txnCol.
		Where("groupId", "==", group.ID).
		Where("timestamp", ">=", periodStart).
		Where("timestamp", "<", periodEnd).
		Documents(ctx).GetAll()
	if err != nil {
		return fmt.Errorf("querying transactions for recalculation: %w", err)
	}

	// Convert Firestore docs to FullTransaction for aggregation
	fullTxns := make([]FullTransaction, 0, len(txnDocs))
	for _, doc := range txnDocs {
		ft, err := FullTransactionFromDoc(doc.Ref.ID, doc.Data())
		if err != nil {
			return err
		}
		fullTxns = append(fullTxns, ft)
	}
	periods := aggregateTransactions(fullTxns)

	// Collect all batch operations
	type batchOp struct {
		ref      *firestore.DocumentRef
		fields   map[string]interface{}
		mergeOpt []firestore.SetOption
	}
	var ops []batchOp
	var updates, creates int

	for key, pd := range periods {
		ref := periodCol.Doc(key)
		// Round to 2 decimal places to avoid floating-point drift
		total := math.Round(pd.total*100) / 100

		roundedBreakdown := make(map[string]float64, len(pd.categoryBreakdown))
		for cat, val := range pd.categoryBreakdown {
			roundedBreakdown[cat] = math.Round(val*100) / 100
		}

		fields := map[string]interface{}{
			"budgetId":          pd.budgetID,
			"periodStart":       pd.start,
			"periodEnd":         PeriodEnd(pd.start),
			"total":             total,
			"count":             pd.count,
			"categoryBreakdown": roundedBreakdown,
			"groupId":           group.ID,
			"memberEmails":      group.MemberEmails,
		}

		ops = append(ops, batchOp{ref: ref, fields: fields})
		if existingPeriods[key] {
			updates++
		} else {
			creates++
		}
	}

	// Also update existing periods that have no transactions in this range (set total/count to 0)
	for id := range existingPeriods {
		if _, hasTransactions := periods[id]; !hasTransactions {
			ref := periodCol.Doc(id)
			ops = append(ops, batchOp{
				ref: ref,
				fields: map[string]interface{}{
					"total":             0,
					"count":             0,
					"categoryBreakdown": map[string]float64{},
				},
				mergeOpt: []firestore.SetOption{firestore.Merge(
					firestore.FieldPath{"total"},
					firestore.FieldPath{"count"},
					firestore.FieldPath{"categoryBreakdown"},
				)},
			})
			updates++
		}
	}

	// Write in chunks of 500 (Firestore batch limit)
	const maxBatch = 500
	for i := 0; i < len(ops); i += maxBatch {
		end := i + maxBatch
		if end > len(ops) {
			end = len(ops)
		}
		batch := c.fs.Batch()
		for _, op := range ops[i:end] {
			batch.Set(op.ref, op.fields, op.mergeOpt...)
		}
		if _, err := batch.Commit(ctx); err != nil {
			return fmt.Errorf("committing period batch %d/%d: %w", i/maxBatch+1, (len(ops)+maxBatch-1)/maxBatch, err)
		}
	}

	log.Printf("periods recalculated: %d updated, %d created", updates, creates)
	return nil
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

// UpsertWeeklyAggregates writes weekly aggregate documents to Firestore in batches of 500.
// Document ID format: "{groupId}-{YYYY-MM-DD}".
func (c *Client) UpsertWeeklyAggregates(ctx context.Context, group GroupInfo, aggregates []WeeklyAggregateResult) error {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/weekly-aggregates", c.env))

	// Query existing weekly-aggregate docs for this group
	existingDocs, err := col.Where("groupId", "==", group.ID).Documents(ctx).GetAll()
	if err != nil {
		return fmt.Errorf("querying existing weekly-aggregates: %w", err)
	}
	existingIDs := make(map[string]bool, len(existingDocs))
	for _, doc := range existingDocs {
		existingIDs[doc.Ref.ID] = true
	}

	// Build set of computed doc IDs
	computedIDs := make(map[string]bool, len(aggregates))

	type batchOp struct {
		ref    *firestore.DocumentRef
		fields map[string]interface{}
		merge  []firestore.SetOption
		delete bool
	}
	var ops []batchOp

	for _, agg := range aggregates {
		docID := fmt.Sprintf("%s-%s", group.ID, agg.WeekStart.Format("2006-01-02"))
		computedIDs[docID] = true
		ops = append(ops, batchOp{
			ref: col.Doc(docID),
			fields: map[string]interface{}{
				"weekStart":       agg.WeekStart,
				"creditTotal":     agg.CreditTotal,
				"unbudgetedTotal": agg.UnbudgetedTotal,
				"groupId":         group.ID,
				"memberEmails":    group.MemberEmails,
			},
		})
	}

	// Delete stale docs not in the computed set
	var deleted int
	for id := range existingIDs {
		if !computedIDs[id] {
			ops = append(ops, batchOp{
				ref:    col.Doc(id),
				delete: true,
			})
			deleted++
		}
	}

	const maxBatch = 500
	for i := 0; i < len(ops); i += maxBatch {
		end := i + maxBatch
		if end > len(ops) {
			end = len(ops)
		}
		batch := c.fs.Batch()
		for _, op := range ops[i:end] {
			if op.delete {
				batch.Delete(op.ref)
			} else {
				batch.Set(op.ref, op.fields, op.merge...)
			}
		}
		if _, err := batch.Commit(ctx); err != nil {
			return fmt.Errorf("committing weekly-aggregates batch: %w", err)
		}
	}

	log.Printf("weekly aggregates: %d upserted, %d deleted", len(aggregates), deleted)
	return nil
}

// NormalizationRuleDoc holds a normalization rule document read from Firestore.
type NormalizationRuleDoc struct {
	ID                   string
	Pattern              string
	PatternType          string
	CanonicalDescription string
	DateWindowDays       int
	Institution          string
	Account              string
	Priority             int
}

// LoadNormalizationRules reads normalization rules from budget/{env}/normalization-rules,
// filtered by groupId.
func (c *Client) LoadNormalizationRules(ctx context.Context, groupID string) ([]NormalizationRuleDoc, error) {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/normalization-rules", c.env))
	docs, err := col.Where("groupId", "==", groupID).Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("querying normalization rules: %w", err)
	}

	result := make([]NormalizationRuleDoc, 0, len(docs))
	for _, doc := range docs {
		d := doc.Data()
		r := NormalizationRuleDoc{ID: doc.Ref.ID}
		v, ok := d["pattern"].(string)
		if !ok {
			return nil, fmt.Errorf("normalization rule %s: field 'pattern' is not a string (got %T)", doc.Ref.ID, d["pattern"])
		}
		r.Pattern = v
		if v, ok := d["patternType"].(string); ok {
			r.PatternType = v
		} else if d["patternType"] != nil {
			return nil, fmt.Errorf("normalization rule %s: field 'patternType' is not a string (got %T)", doc.Ref.ID, d["patternType"])
		}
		v, ok = d["canonicalDescription"].(string)
		if !ok {
			return nil, fmt.Errorf("normalization rule %s: field 'canonicalDescription' is not a string (got %T)", doc.Ref.ID, d["canonicalDescription"])
		}
		r.CanonicalDescription = v
		if p, ok := d["dateWindowDays"].(int64); ok {
			r.DateWindowDays = int(p)
		} else if p, ok := d["dateWindowDays"].(float64); ok {
			r.DateWindowDays = int(p)
		} else if d["dateWindowDays"] != nil {
			return nil, fmt.Errorf("normalization rule %s: field 'dateWindowDays' is not a number (got %T)", doc.Ref.ID, d["dateWindowDays"])
		}
		if v, ok := d["institution"].(string); ok {
			r.Institution = v
		} else if d["institution"] != nil {
			return nil, fmt.Errorf("normalization rule %s: field 'institution' is not a string (got %T)", doc.Ref.ID, d["institution"])
		}
		if v, ok := d["account"].(string); ok {
			r.Account = v
		} else if d["account"] != nil {
			return nil, fmt.Errorf("normalization rule %s: field 'account' is not a string (got %T)", doc.Ref.ID, d["account"])
		}
		if p, ok := d["priority"].(int64); ok {
			r.Priority = int(p)
		} else if p, ok := d["priority"].(float64); ok {
			r.Priority = int(p)
		} else {
			return nil, fmt.Errorf("normalization rule %s: field 'priority' is not a number (got %T)", doc.Ref.ID, d["priority"])
		}
		result = append(result, r)
	}

	log.Printf("loaded %d normalization rules for group %s", len(result), groupID)
	return result, nil
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

// FullTransactionFromDoc converts a TransactionDoc (ID + raw field map) into a
// FullTransaction. Returns an error if required fields (amount, timestamp) are
// missing or have the wrong type, or if reimbursement has a non-numeric type.
func FullTransactionFromDoc(id string, d map[string]interface{}) (FullTransaction, error) {
	ft := FullTransaction{
		ID:                id,
		NormalizedPrimary: true,
	}
	ft.Budget, _ = d["budget"].(string)
	ft.Category, _ = d["category"].(string)
	if v, ok := d["amount"].(float64); ok {
		ft.Amount = v
	} else {
		return ft, fmt.Errorf("transaction %s: field 'amount' is not a float64 (got %T)", id, d["amount"])
	}
	switch v := d["reimbursement"].(type) {
	case float64:
		ft.Reimbursement = v
	case int64:
		ft.Reimbursement = float64(v)
	case nil:
		// no reimbursement, default 0 is correct
	default:
		return ft, fmt.Errorf("transaction %s: field 'reimbursement' is not a number (got %T)", id, d["reimbursement"])
	}
	if v, ok := d["timestamp"].(time.Time); ok {
		ft.Timestamp = v
	} else {
		return ft, fmt.Errorf("transaction %s: field 'timestamp' is not a time.Time (got %T)", id, d["timestamp"])
	}
	if nid, ok := d["normalizedId"].(string); ok {
		ft.NormalizedID = nid
	}
	if primary, ok := d["normalizedPrimary"].(bool); ok {
		ft.NormalizedPrimary = primary
	}
	return ft, nil
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

// TransactionDoc holds a transaction document's Firestore ID and field data.
type TransactionDoc struct {
	ID   string
	Data map[string]interface{}
}

// LoadAllTransactions reads all transactions for a group from Firestore.
func (c *Client) LoadAllTransactions(ctx context.Context, group GroupInfo) ([]TransactionDoc, error) {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/transactions", c.env))
	docs, err := col.Where("groupId", "==", group.ID).Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("loading all transactions: %w", err)
	}

	result := make([]TransactionDoc, 0, len(docs))
	for _, doc := range docs {
		result = append(result, TransactionDoc{ID: doc.Ref.ID, Data: doc.Data()})
	}
	log.Printf("loaded %d transactions for group %s", len(result), group.ID)
	return result, nil
}

// normalizationFieldPaths lists the normalization fields for merge updates.
var normalizationFieldPaths = []firestore.FieldPath{
	{"normalizedId"},
	{"normalizedPrimary"},
	{"normalizedDescription"},
}

// UpdateNormalization batch-updates normalization fields on transaction documents.
func (c *Client) UpdateNormalization(ctx context.Context, updates []NormalizationUpdate) error {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/transactions", c.env))

	const maxBatch = 500
	for i := 0; i < len(updates); i += maxBatch {
		end := i + maxBatch
		if end > len(updates) {
			end = len(updates)
		}
		batch := c.fs.Batch()
		for _, u := range updates[i:end] {
			ref := col.Doc(u.DocID)
			var normalizedID interface{} = u.NormalizedID
			var normalizedDescription interface{} = u.NormalizedDescription
			if u.NormalizedID == "" {
				normalizedID = nil
				normalizedDescription = nil
			}
			batch.Set(ref, map[string]interface{}{
				"normalizedId":          normalizedID,
				"normalizedPrimary":     u.NormalizedPrimary,
				"normalizedDescription": normalizedDescription,
			}, firestore.Merge(normalizationFieldPaths...))
		}
		if _, err := batch.Commit(ctx); err != nil {
			return fmt.Errorf("committing normalization batch: %w", err)
		}
	}

	log.Printf("normalization: updated %d transactions", len(updates))
	return nil
}
