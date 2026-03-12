package store

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"math"
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
}

// UpsertResult tracks how many transactions were created vs updated.
type UpsertResult struct {
	Created int
	Updated int
}

// importFieldPaths lists the fields set by import that overwrite on re-import.
// Any field set as a default on create but excluded from this list is
// user-editable and preserved across re-imports (note, reimbursement).
// Category and budget are set by the rule engine on first import and
// preserved across re-imports, even if rules have changed.
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
			refs[j] = col.Doc(transactionDocID(txn.StatementID, txn.TransactionID))
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

// dollarAmount converts int64 cents to float64 dollars for the Firestore schema.
func dollarAmount(cents int64) float64 { return float64(cents) / 100 }

// allFields returns a map of all transaction document fields including user-editable defaults.
// Amount is converted from int64 cents to float64 dollars for the Firestore schema.
// Budget is nil (not "") when unassigned so the client can distinguish "no budget" from
// "empty string budget". Category is expected to be non-empty; ApplyCategorization
// enforces 100% coverage before upsert.
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
	return m
}

// importFields returns a map of only the import-sourced fields for merge updates.
func importFields(txn TransactionData, group GroupInfo) map[string]interface{} {
	return map[string]interface{}{
		"institution":  txn.Institution,
		"account":      txn.Account,
		"description":  txn.Description,
		"amount":       dollarAmount(txn.Amount),
		"timestamp":    txn.Timestamp,
		"statementId":  txn.StatementID,
		"groupId":      group.ID,
		"memberEmails": group.MemberEmails,
	}
}

// transactionDocID generates a deterministic Firestore document ID from a
// statement ID and transaction ID using a truncated sha256 hash (10 bytes /
// 20 hex characters). Collision probability is negligible for the expected
// transaction volume (< 1 million documents).
func transactionDocID(statementID, transactionID string) string {
	if statementID == "" || transactionID == "" {
		panic(fmt.Sprintf("transactionDocID: empty input (statement=%q, txn=%q)", statementID, transactionID))
	}
	h := sha256.Sum256([]byte(statementID + "/" + transactionID))
	return fmt.Sprintf("%x", h[:10])
}

// RuleDoc holds a rule document read from Firestore.
type RuleDoc struct {
	ID          string
	Type        string
	Pattern     string
	Target      string
	Priority    int
	Institution string
	Account     string
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

// txnFieldMap holds a transaction document's ID and field map for aggregation.
type txnFieldMap struct {
	id   string
	data map[string]interface{}
}

// aggregateTransactionData groups transactions by budget period and computes
// total, count, and categoryBreakdown for each period. Transactions with a
// nil or empty budget are skipped (unassigned). Returns a map keyed by period ID.
func aggregateTransactionData(txns []txnFieldMap) (map[string]*periodData, error) {
	periods := make(map[string]*periodData)

	for _, txn := range txns {
		d := txn.data
		budgetID, _ := d["budget"].(string)
		if budgetID == "" {
			continue // unassigned transactions don't affect periods
		}
		timestamp, ok := d["timestamp"].(time.Time)
		if !ok {
			return nil, fmt.Errorf("transaction %s: field 'timestamp' is not a time.Time (got %T)", txn.id, d["timestamp"])
		}
		amount, ok := d["amount"].(float64)
		if !ok {
			return nil, fmt.Errorf("transaction %s: field 'amount' is not a float64 (got %T)", txn.id, d["amount"])
		}
		var reimbursement float64
		switch v := d["reimbursement"].(type) {
		case float64:
			reimbursement = v
		case int64:
			reimbursement = float64(v)
		default:
			if v != nil {
				return nil, fmt.Errorf("transaction %s: field 'reimbursement' is not a number (got %T)", txn.id, v)
			}
		}
		category, _ := d["category"].(string)

		net := amount * (1 - reimbursement/100)

		ps := PeriodStart(timestamp)
		key := PeriodID(budgetID, ps)

		pd, exists := periods[key]
		if !exists {
			pd = &periodData{
				budgetID:          budgetID,
				start:             ps,
				categoryBreakdown: make(map[string]float64),
			}
			periods[key] = pd
		}
		pd.total += net
		pd.count++
		// total includes all transactions; categoryBreakdown skips those with empty
		// category. Currently ApplyCategorization enforces 100% coverage, but this
		// guard handles legacy data or future callers that skip categorization.
		if category != "" {
			pd.categoryBreakdown[category] += net
		}
	}

	return periods, nil
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

	// Extract transaction field maps for aggregation
	txnMaps := make([]txnFieldMap, 0, len(txnDocs))
	for _, doc := range txnDocs {
		txnMaps = append(txnMaps, txnFieldMap{id: doc.Ref.ID, data: doc.Data()})
	}
	periods, err := aggregateTransactionData(txnMaps)
	if err != nil {
		return err
	}

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
			return fmt.Errorf("committing period batch: %w", err)
		}
	}

	log.Printf("periods recalculated: %d updated, %d created", updates, creates)
	return nil
}
