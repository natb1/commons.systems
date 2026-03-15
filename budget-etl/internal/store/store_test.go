package store

import (
	"math"
	"testing"
	"time"
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

func makeTxn(budget, category string, amount, reimbursement float64, ts time.Time) txnFieldMap {
	return txnFieldMap{
		id: "txn-test",
		data: map[string]interface{}{
			"budget":        budget,
			"category":      category,
			"amount":        amount,
			"reimbursement": reimbursement,
			"timestamp":     ts,
		},
	}
}

func TestAggregateTransactionData(t *testing.T) {
	mon := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC)     // Monday
	wed := time.Date(2025, 1, 8, 10, 0, 0, 0, time.UTC)     // Wednesday same week
	nextMon := time.Date(2025, 1, 13, 9, 0, 0, 0, time.UTC) // Next Monday

	t.Run("single transaction", func(t *testing.T) {
		txns := []txnFieldMap{makeTxn("food", "Food:Groceries", 52.30, 0, mon)}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		pd := periods["food-2025-01-06"]
		if pd == nil {
			t.Fatal("missing period food-2025-01-06")
		}
		if pd.total != 52.30 {
			t.Errorf("total = %v, want 52.30", pd.total)
		}
		if pd.count != 1 {
			t.Errorf("count = %d, want 1", pd.count)
		}
		if pd.categoryBreakdown["Food:Groceries"] != 52.30 {
			t.Errorf("categoryBreakdown[Food:Groceries] = %v, want 52.30", pd.categoryBreakdown["Food:Groceries"])
		}
	})

	t.Run("multiple transactions same period", func(t *testing.T) {
		txns := []txnFieldMap{
			makeTxn("food", "Food:Groceries", 50.0, 0, mon),
			makeTxn("food", "Food:Dining", 30.0, 0, wed),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.total != 80.0 {
			t.Errorf("total = %v, want 80.0", pd.total)
		}
		if pd.count != 2 {
			t.Errorf("count = %d, want 2", pd.count)
		}
		if pd.categoryBreakdown["Food:Groceries"] != 50.0 {
			t.Errorf("Food:Groceries = %v, want 50.0", pd.categoryBreakdown["Food:Groceries"])
		}
		if pd.categoryBreakdown["Food:Dining"] != 30.0 {
			t.Errorf("Food:Dining = %v, want 30.0", pd.categoryBreakdown["Food:Dining"])
		}
	})

	t.Run("transactions across different periods", func(t *testing.T) {
		txns := []txnFieldMap{
			makeTxn("food", "Food", 50.0, 0, mon),
			makeTxn("food", "Food", 25.0, 0, nextMon),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(periods) != 2 {
			t.Fatalf("got %d periods, want 2", len(periods))
		}
		if periods["food-2025-01-06"].total != 50.0 {
			t.Errorf("week1 total = %v, want 50.0", periods["food-2025-01-06"].total)
		}
		if periods["food-2025-01-13"].total != 25.0 {
			t.Errorf("week2 total = %v, want 25.0", periods["food-2025-01-13"].total)
		}
	})

	t.Run("reimbursement float64", func(t *testing.T) {
		txns := []txnFieldMap{makeTxn("food", "Food", 100.0, 50.0, mon)}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.total != 50.0 {
			t.Errorf("total = %v, want 50.0 (50%% reimbursement)", pd.total)
		}
	})

	t.Run("reimbursement int64", func(t *testing.T) {
		txn := txnFieldMap{
			id: "txn-int",
			data: map[string]interface{}{
				"budget":        "food",
				"category":      "Food",
				"amount":        100.0,
				"reimbursement": int64(100),
				"timestamp":     mon,
			},
		}
		periods, err := aggregateTransactionData([]txnFieldMap{txn})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.total != 0.0 {
			t.Errorf("total = %v, want 0.0 (100%% reimbursement)", pd.total)
		}
	})

	t.Run("reimbursement nil/zero", func(t *testing.T) {
		txn := txnFieldMap{
			id: "txn-nil",
			data: map[string]interface{}{
				"budget":        "food",
				"category":      "Food",
				"amount":        75.0,
				"reimbursement": nil,
				"timestamp":     mon,
			},
		}
		periods, err := aggregateTransactionData([]txnFieldMap{txn})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if periods["food-2025-01-06"].total != 75.0 {
			t.Errorf("total = %v, want 75.0 (nil reimbursement = 0)", periods["food-2025-01-06"].total)
		}
	})

	t.Run("negative amount produces negative total", func(t *testing.T) {
		txns := []txnFieldMap{makeTxn("food", "Food", -20.0, 0, mon)}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.total != -20.0 {
			t.Errorf("total = %v, want -20.0", pd.total)
		}
	})

	t.Run("credits exceed debits produces negative total", func(t *testing.T) {
		txns := []txnFieldMap{
			makeTxn("food", "Food", 10.0, 0, mon),
			makeTxn("food", "Food", -30.0, 0, wed),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.total != -20.0 {
			t.Errorf("total = %v, want -20.0", pd.total)
		}
	})

	t.Run("category breakdown accumulation", func(t *testing.T) {
		txns := []txnFieldMap{
			makeTxn("food", "Food:Groceries", 30.0, 0, mon),
			makeTxn("food", "Food:Groceries", 20.0, 0, wed),
			makeTxn("food", "Food:Dining", 15.0, 0, mon),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.categoryBreakdown["Food:Groceries"] != 50.0 {
			t.Errorf("Food:Groceries = %v, want 50.0", pd.categoryBreakdown["Food:Groceries"])
		}
		if pd.categoryBreakdown["Food:Dining"] != 15.0 {
			t.Errorf("Food:Dining = %v, want 15.0", pd.categoryBreakdown["Food:Dining"])
		}
	})

	t.Run("unassigned transactions skipped", func(t *testing.T) {
		txns := []txnFieldMap{
			makeTxn("", "Food", 100.0, 0, mon),
			makeTxn("food", "Food", 25.0, 0, mon),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		if periods["food-2025-01-06"].total != 25.0 {
			t.Errorf("total = %v, want 25.0", periods["food-2025-01-06"].total)
		}
	})

	t.Run("uncategorized transaction in total but not breakdown", func(t *testing.T) {
		txns := []txnFieldMap{
			makeTxn("food", "", 40.0, 0, mon),
			makeTxn("food", "Food", 10.0, 0, wed),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		if pd.total != 50.0 {
			t.Errorf("total = %v, want 50.0", pd.total)
		}
		if len(pd.categoryBreakdown) != 1 {
			t.Errorf("categoryBreakdown has %d entries, want 1", len(pd.categoryBreakdown))
		}
		if pd.categoryBreakdown["Food"] != 10.0 {
			t.Errorf("Food = %v, want 10.0", pd.categoryBreakdown["Food"])
		}
	})

	t.Run("rounding to 2 decimal places verified upstream", func(t *testing.T) {
		// aggregateTransactionData accumulates raw floats; rounding happens in
		// RecalculatePeriods. Verify the raw accumulation is precise enough.
		txns := []txnFieldMap{
			makeTxn("food", "Food", 10.01, 0, mon),
			makeTxn("food", "Food", 20.02, 0, wed),
		}
		periods, err := aggregateTransactionData(txns)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		pd := periods["food-2025-01-06"]
		// After rounding (as RecalculatePeriods does):
		rounded := math.Round(pd.total*100) / 100
		if rounded != 30.03 {
			t.Errorf("rounded total = %v, want 30.03", rounded)
		}
	})

	t.Run("error on non-time timestamp", func(t *testing.T) {
		txn := txnFieldMap{
			id: "txn-bad-ts",
			data: map[string]interface{}{
				"budget":        "food",
				"category":      "Food",
				"amount":        10.0,
				"reimbursement": 0.0,
				"timestamp":     "not-a-time",
			},
		}
		_, err := aggregateTransactionData([]txnFieldMap{txn})
		if err == nil {
			t.Fatal("expected error for non-time timestamp")
		}
	})

	t.Run("error on non-float64 amount", func(t *testing.T) {
		txn := txnFieldMap{
			id: "txn-bad-amt",
			data: map[string]interface{}{
				"budget":        "food",
				"category":      "Food",
				"amount":        "not-a-number",
				"reimbursement": 0.0,
				"timestamp":     mon,
			},
		}
		_, err := aggregateTransactionData([]txnFieldMap{txn})
		if err == nil {
			t.Fatal("expected error for non-float64 amount")
		}
	})

	t.Run("error on non-numeric reimbursement", func(t *testing.T) {
		txn := txnFieldMap{
			id: "txn-bad-reimb",
			data: map[string]interface{}{
				"budget":        "food",
				"category":      "Food",
				"amount":        10.0,
				"reimbursement": "bad",
				"timestamp":     mon,
			},
		}
		_, err := aggregateTransactionData([]txnFieldMap{txn})
		if err == nil {
			t.Fatal("expected error for non-numeric reimbursement")
		}
	})
}

func TestAggregateTransactionData_SkipsNonPrimary(t *testing.T) {
	mon := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC)
	txn := txnFieldMap{
		id: "txn-norm-secondary",
		data: map[string]interface{}{
			"budget":            "food",
			"category":          "Food:Groceries",
			"amount":            50.0,
			"reimbursement":     0.0,
			"timestamp":         mon,
			"normalizedId":      "some-id",
			"normalizedPrimary": false,
		},
	}
	periods, err := aggregateTransactionData([]txnFieldMap{txn})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(periods) != 0 {
		t.Errorf("got %d periods, want 0 (non-primary normalized txn should be skipped)", len(periods))
	}
}

func TestAggregateTransactionData_PrimaryIncluded(t *testing.T) {
	mon := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC)
	txn := txnFieldMap{
		id: "txn-norm-primary",
		data: map[string]interface{}{
			"budget":            "food",
			"category":          "Food:Groceries",
			"amount":            75.0,
			"reimbursement":     0.0,
			"timestamp":         mon,
			"normalizedId":      "some-id",
			"normalizedPrimary": true,
		},
	}
	periods, err := aggregateTransactionData([]txnFieldMap{txn})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(periods) != 1 {
		t.Fatalf("got %d periods, want 1", len(periods))
	}
	pd := periods["food-2025-01-06"]
	if pd == nil {
		t.Fatal("missing period food-2025-01-06")
	}
	if pd.total != 75.0 {
		t.Errorf("total = %v, want 75.0", pd.total)
	}
	if pd.count != 1 {
		t.Errorf("count = %d, want 1", pd.count)
	}
}

func TestAggregateTransactionData_NullNormalizedId(t *testing.T) {
	mon := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC)
	txn := txnFieldMap{
		id: "txn-no-norm",
		data: map[string]interface{}{
			"budget":        "food",
			"category":      "Food:Dining",
			"amount":        30.0,
			"reimbursement": 0.0,
			"timestamp":     mon,
			"normalizedId":  nil,
		},
	}
	periods, err := aggregateTransactionData([]txnFieldMap{txn})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(periods) != 1 {
		t.Fatalf("got %d periods, want 1", len(periods))
	}
	pd := periods["food-2025-01-06"]
	if pd == nil {
		t.Fatal("missing period food-2025-01-06")
	}
	if pd.total != 30.0 {
		t.Errorf("total = %v, want 30.0", pd.total)
	}
	if pd.count != 1 {
		t.Errorf("count = %d, want 1", pd.count)
	}
}
