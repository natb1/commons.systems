package store

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Client wraps a Firestore client with budget-specific operations.
type Client struct {
	fs  *firestore.Client
	env string
}

// NewClient creates a Firestore client using the Firebase Admin SDK
// with Application Default Credentials. If projectID is empty, it
// is inferred from the environment.
func NewClient(ctx context.Context, projectID, env string) (*Client, error) {
	if env == "" {
		return nil, fmt.Errorf("env must not be empty")
	}
	conf := &firebase.Config{}
	if projectID != "" {
		conf.ProjectID = projectID
	}

	app, err := firebase.NewApp(ctx, conf)
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
		name, _ := doc.Data()["name"].(string)
		if name == groupName {
			members, _ := doc.Data()["members"].([]interface{})
			emails := make([]string, 0, len(members))
			for _, m := range members {
				if s, ok := m.(string); ok {
					emails = append(emails, s)
				}
			}
			return GroupInfo{ID: doc.Ref.ID, MemberEmails: emails}, nil
		}
	}

	return GroupInfo{}, fmt.Errorf("no group named %q found containing member %s", groupName, email)
}

// TransactionData holds the fields to write to a Firestore transaction document.
type TransactionData struct {
	Institution   string
	Account       string
	Description   string
	Amount        float64
	Timestamp     time.Time
	StatementID   string
	TransactionID string
}

// UpsertResult tracks how many transactions were created vs updated.
type UpsertResult struct {
	Created int
	Updated int
}

// UpsertTransactions writes transactions to Firestore. For each transaction:
// - Generate deterministic doc ID from sha256(statementId/transactionId)
// - Try Create with all fields (defaults: note="", category="", reimbursement=0, budget=nil)
// - On AlreadyExists, Update only import-sourced fields to preserve user edits
func (c *Client) UpsertTransactions(ctx context.Context, group GroupInfo, txns []TransactionData) (UpsertResult, error) {
	col := c.fs.Collection(fmt.Sprintf("budget/%s/transactions", c.env))
	var result UpsertResult

	for _, txn := range txns {
		docID := transactionDocID(txn.StatementID, txn.TransactionID)
		ref := col.Doc(docID)

		_, err := ref.Create(ctx, map[string]interface{}{
			"institution":  txn.Institution,
			"account":      txn.Account,
			"description":  txn.Description,
			"amount":       txn.Amount,
			"note":         "",
			"category":     "",
			"reimbursement": 0,
			"budget":       nil,
			"timestamp":    txn.Timestamp,
			"statementId":  txn.StatementID,
			"groupId":      group.ID,
			"memberEmails": group.MemberEmails,
		})
		if err == nil {
			result.Created++
			continue
		}

		if status.Code(err) != codes.AlreadyExists {
			return result, fmt.Errorf("creating transaction %s: %w", docID, err)
		}

		// Document exists — update only import-sourced fields, preserving user edits
		// (note, category, reimbursement, budget).
		_, err = ref.Update(ctx, []firestore.Update{
			{Path: "institution", Value: txn.Institution},
			{Path: "account", Value: txn.Account},
			{Path: "description", Value: txn.Description},
			{Path: "amount", Value: txn.Amount},
			{Path: "timestamp", Value: txn.Timestamp},
			{Path: "statementId", Value: txn.StatementID},
			{Path: "groupId", Value: group.ID},
			{Path: "memberEmails", Value: group.MemberEmails},
		})
		if err != nil {
			return result, fmt.Errorf("updating transaction %s: %w", docID, err)
		}
		result.Updated++
	}

	log.Printf("upsert complete: %d created, %d updated", result.Created, result.Updated)
	return result, nil
}

// transactionDocID generates a deterministic Firestore document ID
// from a statement ID and transaction ID using sha256.
func transactionDocID(statementID, transactionID string) string {
	h := sha256.Sum256([]byte(statementID + "/" + transactionID))
	return fmt.Sprintf("%x", h[:10]) // 20 hex characters
}
