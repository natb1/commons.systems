package export

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
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
}

// Statement is a statement-level record in the JSON output.
type Statement struct {
	ID                  string  `json:"id"`
	StatementID         string  `json:"statementId"`
	Institution         string  `json:"institution"`
	Account             string  `json:"account"`
	Balance             float64 `json:"balance"`
	Period              string  `json:"period"`
	LastTransactionDate *string `json:"lastTransactionDate"`
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
// If password is non-empty, the file is decrypted first. Encryption
// state must match strictly: an encrypted file without a password, or
// a plaintext file with a password, both return an error.
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
	if !encrypted && password != "" {
		return Output{}, fmt.Errorf("file is not encrypted but a password was provided")
	}
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
	return out, nil
}

// WriteFile marshals data as indented JSON and writes it atomically to path
// via a temp file and rename. If password is non-empty, the output is encrypted.
func WriteFile(path string, data Output, password string) error {
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
