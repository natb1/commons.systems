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

func makeTxn(budget, category string, amount, reimbursement float64, ts time.Time) FullTransaction {
	return FullTransaction{
		ID:                "txn-test",
		Budget:            budget,
		Category:          category,
		Amount:            amount,
		Reimbursement:     reimbursement,
		Timestamp:         ts,
		NormalizedPrimary: true,
	}
}

func TestAggregateTransactions(t *testing.T) {
	mon := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC)     // Monday
	wed := time.Date(2025, 1, 8, 10, 0, 0, 0, time.UTC)     // Wednesday same week
	nextMon := time.Date(2025, 1, 13, 9, 0, 0, 0, time.UTC) // Next Monday

	t.Run("single transaction", func(t *testing.T) {
		txns := []FullTransaction{makeTxn("food", "Food:Groceries", 52.30, 0, mon)}
		periods := aggregateTransactions(txns)
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
		txns := []FullTransaction{
			makeTxn("food", "Food:Groceries", 50.0, 0, mon),
			makeTxn("food", "Food:Dining", 30.0, 0, wed),
		}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.total != 80.0 {
			t.Errorf("total = %v, want 80.0", pd.total)
		}
		if pd.count != 2 {
			t.Errorf("count = %d, want 2", pd.count)
		}
	})

	t.Run("transactions across different periods", func(t *testing.T) {
		txns := []FullTransaction{
			makeTxn("food", "Food", 50.0, 0, mon),
			makeTxn("food", "Food", 25.0, 0, nextMon),
		}
		periods := aggregateTransactions(txns)
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

	t.Run("reimbursement reduces total", func(t *testing.T) {
		txns := []FullTransaction{makeTxn("food", "Food", 100.0, 50.0, mon)}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.total != 50.0 {
			t.Errorf("total = %v, want 50.0 (50%% reimbursement)", pd.total)
		}
	})

	t.Run("full reimbursement", func(t *testing.T) {
		txns := []FullTransaction{makeTxn("food", "Food", 100.0, 100.0, mon)}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.total != 0.0 {
			t.Errorf("total = %v, want 0.0 (100%% reimbursement)", pd.total)
		}
	})

	t.Run("negative amount produces negative total", func(t *testing.T) {
		txns := []FullTransaction{makeTxn("food", "Food", -20.0, 0, mon)}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.total != -20.0 {
			t.Errorf("total = %v, want -20.0", pd.total)
		}
	})

	t.Run("credits exceed debits produces negative total", func(t *testing.T) {
		txns := []FullTransaction{
			makeTxn("food", "Food", 10.0, 0, mon),
			makeTxn("food", "Food", -30.0, 0, wed),
		}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.total != -20.0 {
			t.Errorf("total = %v, want -20.0", pd.total)
		}
	})

	t.Run("category breakdown accumulation", func(t *testing.T) {
		txns := []FullTransaction{
			makeTxn("food", "Food:Groceries", 30.0, 0, mon),
			makeTxn("food", "Food:Groceries", 20.0, 0, wed),
			makeTxn("food", "Food:Dining", 15.0, 0, mon),
		}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.categoryBreakdown["Food:Groceries"] != 50.0 {
			t.Errorf("Food:Groceries = %v, want 50.0", pd.categoryBreakdown["Food:Groceries"])
		}
		if pd.categoryBreakdown["Food:Dining"] != 15.0 {
			t.Errorf("Food:Dining = %v, want 15.0", pd.categoryBreakdown["Food:Dining"])
		}
	})

	t.Run("unassigned transactions skipped", func(t *testing.T) {
		txns := []FullTransaction{
			makeTxn("", "Food", 100.0, 0, mon),
			makeTxn("food", "Food", 25.0, 0, mon),
		}
		periods := aggregateTransactions(txns)
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		if periods["food-2025-01-06"].total != 25.0 {
			t.Errorf("total = %v, want 25.0", periods["food-2025-01-06"].total)
		}
	})

	t.Run("uncategorized transaction in total but not breakdown", func(t *testing.T) {
		txns := []FullTransaction{
			makeTxn("food", "", 40.0, 0, mon),
			makeTxn("food", "Food", 10.0, 0, wed),
		}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		if pd.total != 50.0 {
			t.Errorf("total = %v, want 50.0", pd.total)
		}
		if len(pd.categoryBreakdown) != 1 {
			t.Errorf("categoryBreakdown has %d entries, want 1", len(pd.categoryBreakdown))
		}
	})

	t.Run("rounding verified upstream", func(t *testing.T) {
		txns := []FullTransaction{
			makeTxn("food", "Food", 10.01, 0, mon),
			makeTxn("food", "Food", 20.02, 0, wed),
		}
		periods := aggregateTransactions(txns)
		pd := periods["food-2025-01-06"]
		rounded := math.Round(pd.total*100) / 100
		if rounded != 30.03 {
			t.Errorf("rounded total = %v, want 30.03", rounded)
		}
	})

	t.Run("skips non-primary normalized", func(t *testing.T) {
		txn := FullTransaction{
			ID: "t1", Budget: "food", Category: "Food:Groceries", Amount: 50.0,
			Timestamp: mon, NormalizedID: "some-id", NormalizedPrimary: false,
		}
		periods := aggregateTransactions([]FullTransaction{txn})
		if len(periods) != 0 {
			t.Errorf("got %d periods, want 0 (non-primary normalized txn should be skipped)", len(periods))
		}
	})

	t.Run("includes primary normalized", func(t *testing.T) {
		txn := FullTransaction{
			ID: "t1", Budget: "food", Category: "Food:Groceries", Amount: 75.0,
			Timestamp: mon, NormalizedID: "some-id", NormalizedPrimary: true,
		}
		periods := aggregateTransactions([]FullTransaction{txn})
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		if periods["food-2025-01-06"].total != 75.0 {
			t.Errorf("total = %v, want 75.0", periods["food-2025-01-06"].total)
		}
	})

	t.Run("includes non-normalized", func(t *testing.T) {
		txn := FullTransaction{
			ID: "t1", Budget: "food", Category: "Food:Dining", Amount: 30.0,
			Timestamp: mon, NormalizedPrimary: true,
		}
		periods := aggregateTransactions([]FullTransaction{txn})
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		if periods["food-2025-01-06"].total != 30.0 {
			t.Errorf("total = %v, want 30.0", periods["food-2025-01-06"].total)
		}
	})
}

func TestComputePeriods(t *testing.T) {
	mon := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC)
	wed := time.Date(2025, 1, 8, 10, 0, 0, 0, time.UTC)
	nextMon := time.Date(2025, 1, 13, 9, 0, 0, 0, time.UTC)

	t.Run("basic aggregation", func(t *testing.T) {
		txns := []FullTransaction{
			{ID: "t1", Budget: "food", Category: "Food:Groceries", Amount: 50.0, Timestamp: mon, NormalizedPrimary: true},
			{ID: "t2", Budget: "food", Category: "Food:Dining", Amount: 30.0, Timestamp: wed, NormalizedPrimary: true},
			{ID: "t3", Budget: "food", Category: "Food", Amount: 25.0, Timestamp: nextMon, NormalizedPrimary: true},
		}
		periods := ComputePeriods(txns)
		if len(periods) != 2 {
			t.Fatalf("got %d periods, want 2", len(periods))
		}
		byID := make(map[string]PeriodResult)
		for _, p := range periods {
			byID[p.ID] = p
		}
		w1 := byID["food-2025-01-06"]
		if w1.Total != 80.0 {
			t.Errorf("week1 total = %v, want 80.0", w1.Total)
		}
		if w1.Count != 2 {
			t.Errorf("week1 count = %d, want 2", w1.Count)
		}
		if w1.BudgetID != "food" {
			t.Errorf("week1 budgetID = %q, want food", w1.BudgetID)
		}
		w2 := byID["food-2025-01-13"]
		if w2.Total != 25.0 {
			t.Errorf("week2 total = %v, want 25.0", w2.Total)
		}
	})

	t.Run("skips non-primary normalized", func(t *testing.T) {
		txns := []FullTransaction{
			{ID: "t1", Budget: "food", Category: "Food", Amount: 50.0, Timestamp: mon, NormalizedID: "norm-1", NormalizedPrimary: false},
			{ID: "t2", Budget: "food", Category: "Food", Amount: 30.0, Timestamp: mon, NormalizedPrimary: true},
		}
		periods := ComputePeriods(txns)
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		if periods[0].Total != 30.0 {
			t.Errorf("total = %v, want 30.0 (non-primary excluded)", periods[0].Total)
		}
	})

	t.Run("skips unassigned", func(t *testing.T) {
		txns := []FullTransaction{
			{ID: "t1", Budget: "", Category: "Food", Amount: 100.0, Timestamp: mon, NormalizedPrimary: true},
		}
		periods := ComputePeriods(txns)
		if len(periods) != 0 {
			t.Errorf("got %d periods, want 0", len(periods))
		}
	})

	t.Run("reimbursement reduces total", func(t *testing.T) {
		txns := []FullTransaction{
			{ID: "t1", Budget: "food", Category: "Food", Amount: 100.0, Reimbursement: 50.0, Timestamp: mon, NormalizedPrimary: true},
		}
		periods := ComputePeriods(txns)
		if len(periods) != 1 {
			t.Fatalf("got %d periods, want 1", len(periods))
		}
		if periods[0].Total != 50.0 {
			t.Errorf("total = %v, want 50.0", periods[0].Total)
		}
	})

	t.Run("rounds to 2 decimal places", func(t *testing.T) {
		txns := []FullTransaction{
			{ID: "t1", Budget: "food", Category: "Food", Amount: 10.01, Timestamp: mon, NormalizedPrimary: true},
			{ID: "t2", Budget: "food", Category: "Food", Amount: 20.02, Timestamp: wed, NormalizedPrimary: true},
		}
		periods := ComputePeriods(txns)
		if periods[0].Total != 30.03 {
			t.Errorf("total = %v, want 30.03", periods[0].Total)
		}
	})

	t.Run("period start and end are correct", func(t *testing.T) {
		txns := []FullTransaction{
			{ID: "t1", Budget: "food", Category: "Food", Amount: 10.0, Timestamp: wed, NormalizedPrimary: true},
		}
		periods := ComputePeriods(txns)
		p := periods[0]
		wantStart := time.Date(2025, 1, 6, 0, 0, 0, 0, time.UTC)
		wantEnd := time.Date(2025, 1, 13, 0, 0, 0, 0, time.UTC)
		if !p.Start.Equal(wantStart) {
			t.Errorf("start = %v, want %v", p.Start, wantStart)
		}
		if !p.End.Equal(wantEnd) {
			t.Errorf("end = %v, want %v", p.End, wantEnd)
		}
	})
}
