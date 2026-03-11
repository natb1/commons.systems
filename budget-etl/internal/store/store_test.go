package store

import (
	"testing"
	"time"
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

func TestPeriodStart(t *testing.T) {
	tests := []struct {
		name string
		in   time.Time
		want time.Time
	}{
		{
			name: "Monday stays Monday",
			in:   time.Date(2025, 1, 6, 15, 30, 0, 0, time.UTC),
			want: time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC),
		},
		{
			name: "Wednesday goes back to Monday",
			in:   time.Date(2025, 1, 8, 10, 0, 0, 0, time.UTC),
			want: time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC),
		},
		{
			name: "Sunday goes back to Monday",
			in:   time.Date(2025, 1, 12, 23, 59, 59, 0, time.UTC),
			want: time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC),
		},
		{
			name: "Saturday goes back to Monday",
			in:   time.Date(2025, 1, 11, 0, 0, 0, 0, time.UTC),
			want: time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC),
		},
		{
			name: "non-UTC input is converted to UTC",
			in:   time.Date(2025, 1, 7, 3, 0, 0, 0, time.FixedZone("EST", -5*3600)),
			want: time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := PeriodStart(tt.in)
			if !got.Equal(tt.want) {
				t.Errorf("PeriodStart(%v) = %v, want %v", tt.in, got, tt.want)
			}
		})
	}
}

func TestPeriodEnd(t *testing.T) {
	start := time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC)
	want := time.Date(2025, 1, 13, 0, 0, 0, 0, time.UTC)
	got := PeriodEnd(start)
	if !got.Equal(want) {
		t.Errorf("PeriodEnd(%v) = %v, want %v", start, got, want)
	}
}

func TestPeriodID(t *testing.T) {
	start := time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC)
	got := PeriodID("food", start)
	want := "food-2025-01-06"
	if got != want {
		t.Errorf("PeriodID = %q, want %q", got, want)
	}
}
