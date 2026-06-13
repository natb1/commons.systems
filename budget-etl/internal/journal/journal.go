// Package journal turns parsed bank transactions into balanced double-entry
// records — JournalEntry, JournalLeg, and Account — for emission into
// budget.json. It is a pure computation package: no IO, no mutable globals.
//
// Each imported line first becomes a tentative two-leg entry: one leg on the
// imported bank account and a balancing counter leg on a placeholder account
// (Uncategorized Expense / Uncategorized Income, or Unresolved Transfers for
// Transfer:* lines). After per-line emission, the batch is scanned for transfer
// pairs — opposite-sign amounts on different accounts within a time window,
// where at least one leg is categorized Transfer:* — and each matched pair is
// merged into a single entry that debits the destination account and credits
// the source account, dropping the placeholders.
package journal

import (
	"sort"
	"strings"
	"time"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/export"
)

// DefaultPairWindow is the default maximum timestamp delta between two lines to
// be considered a transfer pair.
const DefaultPairWindow = 3 * 24 * time.Hour

// Placeholder counter-account ids and types, matching the seed chart of accounts
// (budget/seeds/firestore.ts).
const (
	acctUncategorizedExpense = "Budget_Uncategorized Expense"
	acctUncategorizedIncome  = "Budget_Uncategorized Income"
	acctUnresolvedTransfers  = "Budget_Unresolved Transfers"

	placeholderInstitution = "Budget"
)

// centTolerance is the magnitude (in cents) within which two amounts are
// considered equal-and-opposite for pair detection, and within which an entry's
// debits and credits are considered balanced.
const centTolerance = 1

// Result holds the double-entry records derived from an import batch.
type Result struct {
	Entries        []export.JournalEntry
	Legs           []export.JournalLeg
	Accounts       []export.Account
	EntryIDByDocID map[string]string // docID -> journalEntryId
}

// accountID composes the account document id from institution and account,
// matching the seed/app convention "{institution}_{account}".
func accountID(institution, account string) string {
	return institution + "_" + account
}

// isTransfer reports whether a category marks the line as a transfer.
func isTransfer(category string) bool {
	return strings.HasPrefix(category, "Transfer:")
}

// tentative holds the per-line state needed for pair detection and final
// emission.
type tentative struct {
	docID      string
	txn        budget.TransactionData
	acctID     string // imported bank-account id
	counterID  string // placeholder counter-account id
	isTransfer bool
	paired     bool
}

// Build computes the double-entry records for a batch of parsed transactions.
// window is the maximum timestamp delta for transfer-pair detection; pass
// DefaultPairWindow for the default.
//
// docIDs, if non-nil, must be a parallel slice of pre-computed document IDs (one
// per transaction). When provided, Build uses docIDs[i] directly instead of
// calling budget.TransactionDocID(txn.StatementID, txn.TransactionID). This is
// required when transactions are reconstructed from an existing budget.json, where
// TransactionID already holds the hashed document ID rather than the original FITID.
//
// normMap, if non-nil, carries the normalization decisions for the batch keyed by
// doc ID. A transaction that is a non-primary normalized duplicate (its
// budget.NormalizationUpdate has NormalizedID != "" && !NormalizedPrimary) gets no
// entry or legs of its own; instead its doc ID is mapped, in EntryIDByDocID, to the
// primary's journal entry, so the bank account is credited only once for the real
// transaction. A nil normMap means no normalization filtering (back-compat).
func Build(txns []budget.TransactionData, docIDs []string, normMap map[string]budget.NormalizationUpdate, window time.Duration) Result {
	// skippedDup records each non-primary normalized duplicate skipped in the import loop below, so
	// its doc ID can be linked to the primary's entry after EntryIDByDocID is built.
	type skippedDup struct{ dupDocID, primaryDocID string }
	var skippedDups []skippedDup

	tents := make([]*tentative, 0, len(txns))
	for i := range txns {
		txn := txns[i]
		var docID string
		if docIDs != nil {
			docID = docIDs[i]
		} else {
			docID = budget.TransactionDocID(txn.StatementID, txn.TransactionID)
		}
		// Skip non-primary normalized duplicates: they share a real transaction
		// with their primary, so they must not get their own entry/legs and must
		// not be eligible for transfer-pair detection below.
		if normMap != nil {
			if nu, ok := normMap[docID]; ok && nu.NormalizedID != "" && !nu.NormalizedPrimary {
				skippedDups = append(skippedDups, skippedDup{dupDocID: docID, primaryDocID: nu.NormalizedID})
				continue
			}
		}
		t := &tentative{
			docID:      docID,
			txn:        txn,
			acctID:     accountID(txn.Institution, txn.Account),
			isTransfer: isTransfer(txn.Category),
		}
		switch {
		case t.isTransfer:
			t.counterID = acctUnresolvedTransfers
		case txn.Amount > 0: // spending
			t.counterID = acctUncategorizedExpense
		default: // income / credit (amount <= 0)
			t.counterID = acctUncategorizedIncome
		}
		tents = append(tents, t)
	}

	pairs := detectPairs(tents, window)

	entries := []export.JournalEntry{}
	legs := []export.JournalLeg{}
	entryIDByDocID := map[string]string{}
	// referencedAccounts collects every account id touched by an emitted leg,
	// so the placeholder accounts emitted are exactly those referenced.
	referencedAccounts := map[string]bool{}

	// Merged pairs first.
	for _, p := range pairs {
		a, b := tents[p.i], tents[p.j]
		// Destination = inflow (amount < 0); source = outflow (amount > 0).
		dst, src := a, b
		if a.txn.Amount > 0 {
			dst, src = b, a
		}
		entryID := mergedEntryID(a.docID, b.docID)
		amount := dollarsAbs(dst.txn.Amount)
		// Description from the source (outflow) line.
		entry := export.JournalEntry{
			ID:          entryID,
			Timestamp:   export.FormatTimestamp(src.txn.Timestamp),
			Description: src.txn.Description,
			Note:        nil,
			LegCount:    2,
		}
		debitLeg := newLeg(entryID+"-d", entryID, dst.acctID, amount, 0, entry.Timestamp)
		creditLeg := newLeg(entryID+"-c", entryID, src.acctID, 0, amount, entry.Timestamp)

		entries = append(entries, entry)
		legs = append(legs, debitLeg, creditLeg)
		referencedAccounts[dst.acctID] = true
		referencedAccounts[src.acctID] = true
		entryIDByDocID[a.docID] = entryID
		entryIDByDocID[b.docID] = entryID
	}

	// Unpaired lines: tentative single-line entries.
	for _, t := range tents {
		if t.paired {
			continue
		}
		entryID := "je-" + t.docID
		amount := dollarsAbs(t.txn.Amount)
		ts := export.FormatTimestamp(t.txn.Timestamp)
		entry := export.JournalEntry{
			ID:          entryID,
			Timestamp:   ts,
			Description: t.txn.Description,
			Note:        nil,
			LegCount:    2,
		}

		var debitLeg, creditLeg export.JournalLeg
		if t.txn.Amount > 0 {
			// Spending: credit the imported account, debit the counter account.
			debitLeg = newLeg(entryID+"-d", entryID, t.counterID, amount, 0, ts)
			creditLeg = newLeg(entryID+"-c", entryID, t.acctID, 0, amount, ts)
		} else {
			// Income / credit: debit the imported account, credit the counter account.
			debitLeg = newLeg(entryID+"-d", entryID, t.acctID, amount, 0, ts)
			creditLeg = newLeg(entryID+"-c", entryID, t.counterID, 0, amount, ts)
		}

		entries = append(entries, entry)
		legs = append(legs, debitLeg, creditLeg)
		referencedAccounts[t.acctID] = true
		referencedAccounts[t.counterID] = true
		entryIDByDocID[t.docID] = entryID
	}

	// Link each skipped non-primary duplicate to its primary's entry, so an
	// export transaction for the duplicate resolves to the same real entry. Only
	// link when the primary's entry exists in this batch; if it is absent, leave
	// the duplicate unmapped rather than fabricate an entry.
	for _, d := range skippedDups {
		if eid, ok := entryIDByDocID[d.primaryDocID]; ok {
			entryIDByDocID[d.dupDocID] = eid
		}
	}

	accounts := buildAccounts(tents, referencedAccounts)

	sort.Slice(entries, func(i, j int) bool { return entries[i].ID < entries[j].ID })
	sort.Slice(legs, func(i, j int) bool { return legs[i].ID < legs[j].ID })
	sort.Slice(accounts, func(i, j int) bool { return accounts[i].ID < accounts[j].ID })

	return Result{
		Entries:        entries,
		Legs:           legs,
		Accounts:       accounts,
		EntryIDByDocID: entryIDByDocID,
	}
}

// newLeg constructs a JournalLeg with the new-import defaults: uncleared, no
// reconciliation linkage, no statement item.
func newLeg(id, entryID, accountID string, debit, credit float64, timestamp string) export.JournalLeg {
	return export.JournalLeg{
		ID:                id,
		EntryID:           entryID,
		AccountID:         accountID,
		Debit:             debit,
		Credit:            credit,
		Timestamp:         timestamp,
		Cleared:           false,
		ReconciledAt:      nil,
		ReconciledEventID: nil,
		StatementItemID:   nil,
	}
}

// dollarsAbs returns the absolute dollar value of a signed cents amount.
func dollarsAbs(cents int64) float64 {
	if cents < 0 {
		cents = -cents
	}
	return budget.DollarAmount(cents)
}

// mergedEntryID returns the deterministic, order-independent id for a merged
// transfer pair.
func mergedEntryID(docA, docB string) string {
	if docB < docA {
		docA = docB
	}
	return "je-" + docA
}

// pair identifies two tentative lines, by index, that form a transfer pair.
type pair struct {
	i, j int
}

// detectPairs finds transfer pairs via greedy nearest-time matching. A
// candidate pair has different (institution, account), opposite-sign amounts
// equal within a one-cent tolerance, at least one leg categorized Transfer:*,
// and |Δtimestamp| <= window. Candidates are consumed in ascending
// timestamp-delta order, skipping lines already taken, so two pairs in one
// window match to their nearest partner. Marks matched tentatives as paired and
// returns the chosen pairs.
func detectPairs(tents []*tentative, window time.Duration) []pair {
	type candidate struct {
		i, j  int
		delta time.Duration
	}
	var cands []candidate
	for i := 0; i < len(tents); i++ {
		a := tents[i]
		for j := i + 1; j < len(tents); j++ {
			b := tents[j]
			if a.acctID == b.acctID {
				continue
			}
			// Opposite sign.
			if (a.txn.Amount > 0) == (b.txn.Amount > 0) {
				continue
			}
			// Equal magnitude within tolerance.
			if absInt64(a.txn.Amount+b.txn.Amount) > centTolerance {
				continue
			}
			// At least one leg must be categorized Transfer:* to merge — otherwise two
			// unrelated equal-and-opposite amounts would be falsely merged.
			if !a.isTransfer && !b.isTransfer {
				continue
			}
			delta := a.txn.Timestamp.Sub(b.txn.Timestamp)
			if delta < 0 {
				delta = -delta
			}
			if delta > window {
				continue
			}
			cands = append(cands, candidate{i: i, j: j, delta: delta})
		}
	}

	// Greedy nearest-time: smallest delta first. Ties broken by indices for
	// determinism.
	sort.Slice(cands, func(x, y int) bool {
		if cands[x].delta != cands[y].delta {
			return cands[x].delta < cands[y].delta
		}
		if cands[x].i != cands[y].i {
			return cands[x].i < cands[y].i
		}
		return cands[x].j < cands[y].j
	})

	var pairs []pair
	for _, c := range cands {
		if tents[c.i].paired || tents[c.j].paired {
			continue
		}
		tents[c.i].paired = true
		tents[c.j].paired = true
		pairs = append(pairs, pair{i: c.i, j: c.j})
	}
	return pairs
}

func absInt64(v int64) int64 {
	if v < 0 {
		return -v
	}
	return v
}

// buildAccounts emits one Account per real (institution, account) touched, with
// accountType derived from IsCreditCard, plus the placeholder accounts actually
// referenced by an emitted leg.
func buildAccounts(tents []*tentative, referenced map[string]bool) []export.Account {
	type realAcct struct {
		institution string
		account     string
		liability   bool
	}
	reals := map[string]*realAcct{}
	for _, t := range tents {
		ra, ok := reals[t.acctID]
		if !ok {
			ra = &realAcct{institution: t.txn.Institution, account: t.txn.Account}
			reals[t.acctID] = ra
		}
		if t.txn.IsCreditCard {
			ra.liability = true
		}
	}

	accounts := []export.Account{}
	for id, ra := range reals {
		acctType := export.AccountTypeAsset
		if ra.liability {
			acctType = export.AccountTypeLiability
		}
		accounts = append(accounts, export.Account{
			ID:          id,
			Institution: ra.institution,
			Account:     ra.account,
			AccountType: acctType,
		})
	}

	// Placeholder accounts: emit only those referenced by an emitted leg.
	for _, ph := range []struct {
		id, account string
		acctType    export.AccountType
	}{
		{acctUncategorizedExpense, "Uncategorized Expense", export.AccountTypeExpense},
		{acctUncategorizedIncome, "Uncategorized Income", export.AccountTypeIncome},
		{acctUnresolvedTransfers, "Unresolved Transfers", export.AccountTypeAsset},
	} {
		if !referenced[ph.id] {
			continue
		}
		accounts = append(accounts, export.Account{
			ID:          ph.id,
			Institution: placeholderInstitution,
			Account:     ph.account,
			AccountType: ph.acctType,
		})
	}

	return accounts
}
