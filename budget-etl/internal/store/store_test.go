package store

import (
	"testing"
)

func TestTransactionDocID(t *testing.T) {
	tests := []struct {
		statementID   string
		transactionID string
	}{
		{"bankone-1234-2025-07", "ATM0055566"},
		{"banktwo-5678-2025-05", "202501011000001"},
		{"bankone-1234-2025-10", "1234567890202510172"},
	}

	for _, tt := range tests {
		t.Run(tt.statementID+"/"+tt.transactionID, func(t *testing.T) {
			id := transactionDocID(tt.statementID, tt.transactionID)

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
			id2 := transactionDocID(tt.statementID, tt.transactionID)
			if id != id2 {
				t.Errorf("not deterministic: %q != %q", id, id2)
			}
		})
	}

	// Different inputs must produce different IDs
	a := transactionDocID("stmt-a", "txn-1")
	b := transactionDocID("stmt-b", "txn-1")
	if a == b {
		t.Errorf("different statements produced same doc ID: %q", a)
	}
}
