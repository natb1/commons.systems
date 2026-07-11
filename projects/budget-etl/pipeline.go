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

// dedupStatementData collapses balance-anchor observations that share an
// identical anchor ID (StatementID), preserving first-seen order. Anchor IDs
// are keyed by as-of date (see budget.AnchorID), so observations of the same
// account-month at different as-of dates carry distinct IDs and are all kept —
// this is the keep-all-distinct-observations contract. Only a genuine same-key
// collision is resolved here:
//
//   - Equal balance: the duplicate is dropped (first-seen wins).
//   - Different balance: the two are observations of the same institution,
//     account, and as-of date that disagree on the amount. The collision is
//     resolved deterministically — the observation whose SourceFile sorts
//     lexicographically later wins (a real observation's non-empty path beats
//     an ETL-derived anchor's empty one) — and a single reconciliation line
//     naming both source files, both balances, and the delta is logged (log
//     output stays on the operator's machine, so amounts are fine there). The
//     winner takes the earlier entry's output position, so first-seen order is
//     preserved.
//
// There is no error path: cross-date disagreements are now distinct
// observations, not collisions.
func dedupStatementData(stmts []budget.StatementData) []budget.StatementData {
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
		log.Printf(
			"statement %q: reconciling overlapping balance anchors at the same as-of date — %s ($%.2f) vs %s ($%.2f), delta $%.2f; keeping the later-sorting source file",
			s.StatementID,
			srcOrDerived(prior.SourceFile), budget.DollarAmount(prior.Balance),
			srcOrDerived(s.SourceFile), budget.DollarAmount(s.Balance),
			budget.DollarAmount(s.Balance-prior.Balance),
		)
		if s.SourceFile > prior.SourceFile {
			out[pos] = s
		}
	}
	return out
}

// srcOrDerived renders a StatementData.SourceFile for log messages,
// substituting a placeholder for the empty path of an ETL-synthesized anchor.
func srcOrDerived(src string) string {
	if src == "" {
		return "<derived>"
	}
	return src
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
