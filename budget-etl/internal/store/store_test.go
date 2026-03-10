package store

import (
	"testing"
)

func TestTransactionDocID(t *testing.T) {
	tests := []struct {
		statementID   string
		transactionID string
	}{
		{"pnc-5111-2025-07", "MACEX03922"},
		{"capital_one-4549-2025-05", "202505221122069"},
		{"pnc-5111-2025-10", "5306485111202510172"},
	}

	for _, tt := range tests {
		t.Run(tt.statementID+"/"+tt.transactionID, func(t *testing.T) {
			id := TransactionDocID(tt.statementID, tt.transactionID)

			// Must be exactly 20 hex characters
			if len(id) != 20 {
				t.Errorf("len = %d, want 20", len(id))
			}
			for _, c := range id {
				if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
					t.Errorf("non-hex character %c in doc ID %q", c, id)
				}
			}

			// Must be deterministic
			id2 := TransactionDocID(tt.statementID, tt.transactionID)
			if id != id2 {
				t.Errorf("not deterministic: %q != %q", id, id2)
			}
		})
	}

	// Different inputs must produce different IDs
	a := TransactionDocID("stmt-a", "txn-1")
	b := TransactionDocID("stmt-b", "txn-1")
	if a == b {
		t.Errorf("different statements produced same doc ID: %q", a)
	}
}
