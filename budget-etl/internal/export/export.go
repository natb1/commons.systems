package export

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/crypto/pbkdf2"
)

// BENC encrypted file format (shared with budget/src/crypto-core.ts):
//   [magic 4B "BENC"][salt 16B][IV 12B][AES-256-GCM ciphertext + 16B auth tag]
// Key derivation: PBKDF2-HMAC-SHA256, 600k iterations, 256-bit key.
const (
	saltLen          = 16
	ivLen            = 12
	keyLen           = 32
	pbkdf2Iterations = 600000
	headerLen        = 4 + saltLen + ivLen // magic + salt + IV = 32
)

var magicBytes = [4]byte{'B', 'E', 'N', 'C'}

// IsEncrypted checks whether data starts with the BENC magic bytes.
func IsEncrypted(data []byte) bool {
	return len(data) >= len(magicBytes) && [4]byte(data[:4]) == magicBytes
}

func deriveKey(password string, salt []byte) []byte {
	return pbkdf2.Key([]byte(password), salt, pbkdf2Iterations, keyLen, sha256.New)
}

func newGCM(password string, salt []byte) (cipher.AEAD, error) {
	key := deriveKey(password, salt)
	block, err := aes.NewCipher(key)
	clear(key)
	if err != nil {
		return nil, fmt.Errorf("creating cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("creating GCM: %w", err)
	}
	return gcm, nil
}

func encryptJSON(plaintext []byte, password string) ([]byte, error) {
	if password == "" {
		return nil, fmt.Errorf("password must not be empty for encryption")
	}
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return nil, fmt.Errorf("generating salt: %w", err)
	}
	iv := make([]byte, ivLen)
	if _, err := rand.Read(iv); err != nil {
		return nil, fmt.Errorf("generating IV: %w", err)
	}

	gcm, err := newGCM(password, salt)
	if err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nil, iv, plaintext, nil)

	out := make([]byte, 0, headerLen+len(ciphertext))
	out = append(out, magicBytes[:]...)
	out = append(out, salt...)
	out = append(out, iv...)
	out = append(out, ciphertext...)
	return out, nil
}

// decryptJSON decrypts BENC-formatted data.
// Caller must verify magic bytes via IsEncrypted before calling;
// this function does not check the magic prefix.
func decryptJSON(data []byte, password string) ([]byte, error) {
	if len(data) < headerLen {
		return nil, fmt.Errorf("file too short to be encrypted")
	}
	salt := data[4 : 4+saltLen]
	iv := data[4+saltLen : headerLen]
	ciphertext := data[headerLen:]

	gcm, err := newGCM(password, salt)
	if err != nil {
		return nil, err
	}

	plaintext, err := gcm.Open(nil, iv, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption failed (wrong password or corrupted file): %w", err)
	}
	return plaintext, nil
}

// Output is the top-level JSON structure written by budget-etl --output.
type Output struct {
	Version            int                 `json:"version"`
	ExportedAt         string              `json:"exportedAt"`
	GroupID            string              `json:"groupId"`
	GroupName          string              `json:"groupName"`
	Transactions       []Transaction       `json:"transactions"`
	Statements         []Statement         `json:"statements"`
	Budgets            []Budget            `json:"budgets"`
	BudgetPeriods      []BudgetPeriod      `json:"budgetPeriods"`
	Rules              []Rule              `json:"rules"`
	NormalizationRules []NormalizationRule `json:"normalizationRules"`
	WeeklyAggregates   []WeeklyAggregate   `json:"weeklyAggregates"`
	JournalEntries     []JournalEntry      `json:"journalEntries"`
	JournalLegs        []JournalLeg        `json:"journalLegs"`
	Accounts           []Account           `json:"accounts"`
}

// WeeklyAggregate is a pre-computed weekly credit and unbudgeted spending total.
type WeeklyAggregate struct {
	ID              string  `json:"id"`
	WeekStart       string  `json:"weekStart"`
	CreditTotal     float64 `json:"creditTotal"`
	UnbudgetedTotal float64 `json:"unbudgetedTotal"`
}

// Statement is a statement-level record in the JSON output.
type Statement struct {
	ID                  string  `json:"id"`
	StatementID         string  `json:"statementId"`
	Institution         string  `json:"institution"`
	Account             string  `json:"account"`
	Balance             float64 `json:"balance"`
	Period              string  `json:"period"`
	BalanceDate         string  `json:"balanceDate"`
	LastTransactionDate *string `json:"lastTransactionDate"`
	Virtual             bool    `json:"virtual"`
}

// Transaction is a single transaction in the JSON output.
type Transaction struct {
	ID                    string  `json:"id"`
	Institution           string  `json:"institution"`
	Account               string  `json:"account"`
	Description           string  `json:"description"`
	Amount                float64 `json:"amount"`
	Timestamp             string  `json:"timestamp"`
	StatementID           string  `json:"statementId"`
	Category              string  `json:"category"`
	Budget                *string `json:"budget"`
	Note                  string  `json:"note"`
	Reimbursement         float64 `json:"reimbursement"`
	NormalizedID          *string `json:"normalizedId"`
	NormalizedPrimary     bool    `json:"normalizedPrimary"`
	NormalizedDescription *string `json:"normalizedDescription"`
	Virtual               bool    `json:"virtual"`
	JournalEntryID        *string `json:"journalEntryId"`
}

// AccountType is the kind of a financial account. Mirrors the TypeScript
// ACCOUNT_TYPES enum in budget/src/schema/enums.ts.
type AccountType string

const (
	AccountTypeAsset     AccountType = "asset"
	AccountTypeLiability AccountType = "liability"
	AccountTypeEquity    AccountType = "equity"
	AccountTypeIncome    AccountType = "income"
	AccountTypeExpense   AccountType = "expense"
)

var validAccountTypes = map[AccountType]bool{
	AccountTypeAsset:     true,
	AccountTypeLiability: true,
	AccountTypeEquity:    true,
	AccountTypeIncome:    true,
	AccountTypeExpense:   true,
}

// Valid reports whether t is one of the recognized account types.
func (t AccountType) Valid() bool { return validAccountTypes[t] }

// Account is a financial account record in the JSON output.
type Account struct {
	ID                 string      `json:"id"`
	Institution        string      `json:"institution"`
	Account            string      `json:"account"`
	AccountType        AccountType `json:"accountType"`
	OpeningBalance     *float64    `json:"openingBalance"`
	OpeningBalanceDate *string     `json:"openingBalanceDate"`
}

// Validate checks the account-type enum invariant, mirroring the TypeScript
// parseRawAccount enum check (requireUploadEnum against ACCOUNT_TYPES).
func (a Account) Validate() error {
	if !a.AccountType.Valid() {
		return fmt.Errorf("account type %q is not one of asset, liability, equity, income, expense", a.AccountType)
	}
	return nil
}

// JournalEntry is a double-entry journal entry in the JSON output.
type JournalEntry struct {
	ID          string  `json:"id"`
	Timestamp   string  `json:"timestamp"`
	Description string  `json:"description"`
	Note        *string `json:"note"`
	LegCount    int     `json:"legCount"`
}

// JournalLeg is a single leg of a double-entry journal entry in the JSON output.
type JournalLeg struct {
	ID                string  `json:"id"`
	EntryID           string  `json:"entryId"`
	AccountID         string  `json:"accountId"`
	Debit             float64 `json:"debit"`
	Credit            float64 `json:"credit"`
	Timestamp         string  `json:"timestamp"`
	Cleared           bool    `json:"cleared"`
	ReconciledAt      *string `json:"reconciledAt"`
	ReconciledEventID *string `json:"reconciledEventId"`
	StatementItemID   *string `json:"statementItemId"`
}

// Validate checks the debit/credit invariants, mirroring the TypeScript
// parseRawJournalLeg rules: both debit and credit must be finite,
// non-negative numbers, and they cannot both be positive simultaneously.
// Both-zero is allowed.
func (l JournalLeg) Validate() error {
	if math.IsNaN(l.Debit) || math.IsInf(l.Debit, 0) || l.Debit < 0 {
		return fmt.Errorf("journal leg debit must be a non-negative finite number (got %v)", l.Debit)
	}
	if math.IsNaN(l.Credit) || math.IsInf(l.Credit, 0) || l.Credit < 0 {
		return fmt.Errorf("journal leg credit must be a non-negative finite number (got %v)", l.Credit)
	}
	if l.Debit > 0 && l.Credit > 0 {
		return fmt.Errorf("journal leg cannot have both a debit and a credit (debit=%v, credit=%v)", l.Debit, l.Credit)
	}
	return nil
}

// Budget is a budget definition in the JSON output.
type Budget struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	Allowance float64 `json:"allowance"`
	AllowancePeriod string  `json:"allowancePeriod,omitempty"`
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
	ID              string   `json:"id"`
	Type            string   `json:"type"`
	Pattern         string   `json:"pattern"`
	Target          string   `json:"target"`
	Priority        int      `json:"priority"`
	Institution     string   `json:"institution"`
	Account         string   `json:"account"`
	MinAmount       *float64 `json:"minAmount,omitempty"`
	MaxAmount       *float64 `json:"maxAmount,omitempty"`
	ExcludeCategory string   `json:"excludeCategory,omitempty"`
	MatchCategory   string   `json:"matchCategory,omitempty"`
	Category        string   `json:"category,omitempty"`
	TransactionID   string   `json:"transactionId,omitempty"`
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
// If password is non-empty and the file is encrypted, it is decrypted
// first. An encrypted file without a password returns an error.
// Plaintext files are accepted regardless of password.
// Returns an error if the file is missing, contains invalid JSON, or
// is missing required fields (version, groupName, transactions).
func ReadFile(path, password string) (Output, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Output{}, fmt.Errorf("reading %s: %w", path, err)
	}

	encrypted := IsEncrypted(data)
	if encrypted && password == "" {
		return Output{}, fmt.Errorf("file is encrypted but no password was provided")
	}
	// Allow reading plaintext input even when a password is provided —
	// the password is still used for encrypting output.
	if encrypted {
		data, err = decryptJSON(data, password)
		if err != nil {
			return Output{}, fmt.Errorf("decrypting %s: %w", path, err)
		}
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
	// Note: ReadFile intentionally does not call out.Validate(). Validation is
	// enforced at the serialization boundary (WriteFile) so that a file written
	// by an older ETL version still loads; refusing to read it would strand the
	// user with no migration path. Callers that re-emit a read Output go back
	// through WriteFile, which re-validates before writing.
	return out, nil
}

// Validate checks the double-entry invariants on the journal legs and accounts
// before serialization, mirroring the TypeScript upload-path validation so the
// two halves stay in lockstep. WriteFile calls Validate before serializing;
// callers that only need the check can call Validate directly.
func (o Output) Validate() error {
	for i, l := range o.JournalLegs {
		if err := l.Validate(); err != nil {
			return fmt.Errorf("journalLegs[%d]: %w", i, err)
		}
	}
	for i, a := range o.Accounts {
		if err := a.Validate(); err != nil {
			return fmt.Errorf("accounts[%d]: %w", i, err)
		}
	}
	return nil
}

// WriteFile marshals data as indented JSON and writes it atomically to path
// via a temp file and rename. If password is non-empty, the output is encrypted.
func WriteFile(path string, data Output, password string) error {
	if err := data.Validate(); err != nil {
		return fmt.Errorf("validating output: %w", err)
	}

	b, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling JSON: %w", err)
	}
	b = append(b, '\n')

	if password != "" {
		b, err = encryptJSON(b, password)
		if err != nil {
			return fmt.Errorf("encrypting: %w", err)
		}
	}

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
