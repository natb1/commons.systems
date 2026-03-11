package store

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
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
// user-editable and preserved across re-imports (note, category,
// reimbursement, budget).
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
//   - New documents: Set with all fields (defaults: note="", category="", reimbursement=0, budget=nil)
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
