package main

import (
	"fmt"
	"log"

	"github.com/natb1/commons.systems/budget-etl/internal/budget"
	"github.com/natb1/commons.systems/budget-etl/internal/parse"
)

// parseStatementDir discovers and parses all statement files in dir
// concurrently, infers the period from document data when possible, and
// returns the successfully parsed files, the total transaction count across
// them, and the count of skipped files.
func parseStatementDir(dir string, disc parse.DiscoverOpts) (parsed []parsedFile, totalTxns, skipped int, err error) {
	files, err := parse.Discover(dir, disc)
	if err != nil {
		return nil, 0, 0, fmt.Errorf("discovering files in %s: %w", dir, err)
	}
	log.Printf("discovered %d statement files", len(files))

	type fileResult struct {
		sf     parse.StatementFile
		result parse.ParseResult
		err    error
	}
	ch := make(chan fileResult, len(files))
	for _, sf := range files {
		go func() {
			result, err := parse.ParseFile(sf.Path)
			ch <- fileResult{sf: sf, result: result, err: err}
		}()
	}

	for range files {
		r := <-ch
		if r.err != nil {
			return nil, 0, 0, r.err
		}
		if r.result.Skipped {
			log.Printf("skipping %s: %s", r.sf.Path, r.result.SkipReason)
			skipped++
			continue
		}
		// Override path-derived period with document-inferred period before any
		// downstream use of sf (StatementID, buildStatementData, etc.).
		if inferred := r.result.InferPeriod(); inferred != "" {
			r.sf.Period = inferred
		} else {
			log.Printf("could not infer period from document data for %s, using path-derived period %q", r.sf.Path, r.sf.Period)
		}
		parsed = append(parsed, parsedFile{sf: r.sf, result: r.result})
		totalTxns += len(r.result.Transactions)
	}

	log.Printf("parsed %d transactions from %d files (%d skipped)", totalTxns, len(parsed), skipped)
	return parsed, totalTxns, skipped, nil
}

// dedupStatementData deduplicates a slice of StatementData by StatementID,
// preserving first-seen order. Equal-balance duplicates are silently dropped.
//
// When two entries share a StatementID but disagree on Balance, they are
// overlapping observations of the same account-month anchor. The collision is
// resolved by as-of date (BalanceDate): the later observation is kept and a
// single reconciliation line naming both source files, both balances, and the
// delta is logged (log output stays on the operator's machine, so amounts are
// fine there). A nil BalanceDate loses to a non-nil one. When there is no basis
// to choose — both BalanceDate nil, or the same instant — the disagreement
// stays an error naming both source files and balances. When a later entry
// replaces an earlier survivor it takes the earlier entry's output position, so
// first-seen order is preserved.
func dedupStatementData(stmts []budget.StatementData) ([]budget.StatementData, error) {
	idx := make(map[string]int, len(stmts)) // StatementID -> index into out
	out := make([]budget.StatementData, 0, len(stmts))
	for _, s := range stmts {
		pos, dup := idx[s.StatementID]
		if !dup {
			idx[s.StatementID] = len(out)
			out = append(out, s)
			continue
		}
		prior := out[pos]
		if s.Balance == prior.Balance {
			continue
		}
		srcA := srcOrDerived(prior.SourceFile)
		srcB := srcOrDerived(s.SourceFile)
		winner, ok := laterAnchor(prior, s)
		if !ok {
			return nil, fmt.Errorf(
				"statement %q: balance disagreement between %s ($%.2f) and %s ($%.2f)",
				s.StatementID,
				srcA, budget.DollarAmount(prior.Balance),
				srcB, budget.DollarAmount(s.Balance),
			)
		}
		log.Printf(
			"statement %q: reconciling overlapping balance anchors by as-of date — %s ($%.2f) vs %s ($%.2f), delta $%.2f; keeping the later observation",
			s.StatementID,
			srcA, budget.DollarAmount(prior.Balance),
			srcB, budget.DollarAmount(s.Balance),
			budget.DollarAmount(s.Balance-prior.Balance),
		)
		out[pos] = winner
	}
	return out, nil
}

// srcOrDerived renders a StatementData.SourceFile for log/error messages,
// substituting a placeholder for the empty path of an ETL-synthesized anchor.
func srcOrDerived(src string) string {
	if src == "" {
		return "<derived>"
	}
	return src
}

// laterAnchor chooses between two same-statement anchors that disagree on
// Balance by their as-of date (BalanceDate): the later observation wins, and a
// nil BalanceDate loses to a non-nil one. ok is false when there is no basis to
// choose — both BalanceDate nil, or the same instant.
func laterAnchor(a, b budget.StatementData) (winner budget.StatementData, ok bool) {
	switch {
	case a.BalanceDate == nil && b.BalanceDate == nil:
		return budget.StatementData{}, false
	case a.BalanceDate == nil:
		return b, true
	case b.BalanceDate == nil:
		return a, true
	case b.BalanceDate.After(*a.BalanceDate):
		return b, true
	case a.BalanceDate.After(*b.BalanceDate):
		return a, true
	default: // identical instant — no basis to choose
		return budget.StatementData{}, false
	}
}

// buildTransactions iterates parsed files and deduplicates transactions by
// transaction doc ID: overlapping statement files (same statementId) can
// produce duplicate transactions with the same OFX FITID. The visit callback
// (may be nil) fires once per unique transaction so callers can build side
// artifacts (e.g., an edits map keyed by doc ID) and may mutate td in place;
// the td pointer is valid only for the duration of the callback. Returns the
// deduplicated transactions and a parallel slice of their doc IDs —
// allTxns[i] corresponds to allDocIDs[i].
//
// totalTxns is a capacity hint for pre-allocating the dedup map and result
// slices; pass the value from parseStatementDir (or 0 if unknown — only the
// pre-allocation is lost).
func buildTransactions(
	parsed []parsedFile,
	totalTxns int,
	visit func(td *budget.TransactionData, docID string, sf parse.StatementFile, t parse.Transaction),
) (allTxns []budget.TransactionData, allDocIDs []string) {
	seen := make(map[string]bool, totalTxns)
	allTxns = make([]budget.TransactionData, 0, totalTxns)
	allDocIDs = make([]string, 0, totalTxns)
	for _, pf := range parsed {
		for _, t := range pf.result.Transactions {
			docID := budget.TransactionDocID(pf.sf.StatementID(), t.TransactionID)
			if seen[docID] {
				continue
			}
			seen[docID] = true
			allTxns = append(allTxns, budget.TransactionData{
				Institution:   pf.sf.Institution,
				Account:       pf.sf.Account,
				Description:   t.Description,
				Amount:        t.Amount,
				Timestamp:     t.Date,
				StatementID:   pf.sf.StatementID(),
				TransactionID: t.TransactionID,
				IsCreditCard:  pf.result.IsCreditCard,
			})
			allDocIDs = append(allDocIDs, docID)
			if visit != nil {
				visit(&allTxns[len(allTxns)-1], docID, pf.sf, t)
			}
		}
	}
	return allTxns, allDocIDs
}
