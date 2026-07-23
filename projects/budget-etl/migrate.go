package main

import (
	"log"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/export"
)

// buildLegacyRemap builds a mapping from each parsed transaction's LEGACY doc ID
// (the pre-clarification-3 formula: sha256(statementID + "/" + FITID)) to its new
// statement-independent doc ID (sha256(institution + "/" + account + "/" + FITID)).
//
// Period inference is deterministic on file content, so re-parsing the statement
// files reproduces every legacy ID whose source file is still in the statements
// dir — including the divergent-month duplicates that motivated the change (each
// file reproduces the legacy ID it originally minted, and all of them map to the
// single new ID). A transaction whose source file has been deleted from the dir
// has no entry here; migrateSnapshotIDs leaves those rows on their old IDs.
func buildLegacyRemap(parsed []parsedFile) map[string]string {
	remap := make(map[string]string)
	for _, pf := range parsed {
		for _, t := range pf.result.Transactions {
			legacy := budget.LegacyTransactionDocID(pf.sf.StatementID(), t.TransactionID)
			newID := budget.TransactionDocID(pf.sf.Institution, pf.sf.Account, t.TransactionID)
			remap[legacy] = newID
		}
	}
	return remap
}

// migrateSnapshotIDs rewrites a snapshot's transaction doc IDs and
// transaction-specific rule targets from the legacy statement-embedded scheme to
// the new statement-independent scheme, in place, using remap (built by
// buildLegacyRemap from the current statement files).
//
// Behavior:
//
//   - Identity on miss: a doc ID not in remap is left unchanged. This makes the
//     function idempotent — already-migrated snapshots and native new-scheme IDs
//     pass through untouched, so running merge twice yields byte-identical
//     transaction IDs. It also preserves rows whose source export was deleted
//     from the dir (they cannot collide with new-scheme IDs; their edits/rules
//     stay keyed consistently on the old ID).
//
//   - Duplicate collapse: when two transaction rows remap to the same new ID
//     (the divergent-month legacy duplicates), keep one row. User edits are
//     merged per field — a non-empty Note or non-zero Reimbursement beats an
//     empty one; if both rows carry conflicting non-empty values for the same
//     field, the row appearing LATER in the Transactions array wins and a
//     warning is logged. The same later-wins rule applies to two
//     transaction-specific rules of the same Type collapsing onto one new
//     TransactionID; the dropped rule is logged.
//
// Virtual transactions are migrated like any other row via remap; their IDs are
// regenerated every run, so a miss (identity) is harmless.
func migrateSnapshotIDs(inp *export.Output, remap map[string]string) {
	// --- Transactions: remap IDs, then collapse duplicates by new ID. -------
	migrated := make([]export.Transaction, 0, len(inp.Transactions))
	indexByID := make(map[string]int, len(inp.Transactions)) // new ID -> index in migrated
	for _, t := range inp.Transactions {
		if newID, ok := remap[t.ID]; ok {
			t.ID = newID
		}
		// (miss = identity: t.ID left unchanged)
		if existingIdx, seen := indexByID[t.ID]; seen {
			// Collapse: t (later row) merges onto the already-kept survivor.
			mergeCollapsedEdits(&migrated[existingIdx], t)
			continue
		}
		indexByID[t.ID] = len(migrated)
		migrated = append(migrated, t)
	}
	inp.Transactions = migrated

	// --- Transaction-specific rules: remap TransactionID, collapse by (Type,
	// new TransactionID) keeping the later rule. General rules (empty
	// TransactionID) are untouched and preserved in order. --------------------
	rulesOut := make([]export.Rule, 0, len(inp.Rules))
	// key "type\x00newTxnID" -> index in rulesOut, for txn-specific rules only.
	ruleIndex := make(map[string]int, len(inp.Rules))
	for _, r := range inp.Rules {
		if r.TransactionID == "" {
			rulesOut = append(rulesOut, r)
			continue
		}
		if newID, ok := remap[r.TransactionID]; ok {
			r.TransactionID = newID
		}
		key := r.Type + "\x00" + r.TransactionID
		if existingIdx, seen := ruleIndex[key]; seen {
			log.Printf("migrate: transaction-specific %s rule %q collapses onto rule %q for txn %s; keeping the later rule",
				r.Type, rulesOut[existingIdx].ID, r.ID, r.TransactionID)
			rulesOut[existingIdx] = r // later rule wins
			continue
		}
		ruleIndex[key] = len(rulesOut)
		rulesOut = append(rulesOut, r)
	}
	inp.Rules = rulesOut
}

// mergeCollapsedEdits merges the user-editable fields of a collapsed later row
// (dup) onto the surviving earlier row in place. Per field: a non-empty value on
// the survivor is kept unless the later row also carries a conflicting non-empty
// value, in which case the later row wins and a warning is logged. An empty
// survivor field adopts the later row's value silently.
func mergeCollapsedEdits(survivor *export.Transaction, dup export.Transaction) {
	// Note (string).
	if dup.Note != "" {
		if survivor.Note != "" && survivor.Note != dup.Note {
			log.Printf("migrate: doc %s collapse: conflicting note %q vs %q; keeping later %q",
				survivor.ID, survivor.Note, dup.Note, dup.Note)
		}
		survivor.Note = dup.Note
	}
	// Reimbursement (float; zero = unset).
	if dup.Reimbursement != 0 {
		if survivor.Reimbursement != 0 && survivor.Reimbursement != dup.Reimbursement {
			log.Printf("migrate: doc %s collapse: conflicting reimbursement %v vs %v; keeping later %v",
				survivor.ID, survivor.Reimbursement, dup.Reimbursement, dup.Reimbursement)
		}
		survivor.Reimbursement = dup.Reimbursement
	}
	// Preserve a stable bank id on the survivor if it lacked one.
	if survivor.TransactionID == "" && dup.TransactionID != "" {
		survivor.TransactionID = dup.TransactionID
	}
}
