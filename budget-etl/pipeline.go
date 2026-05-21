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
			})
			allDocIDs = append(allDocIDs, docID)
			if visit != nil {
				visit(&allTxns[len(allTxns)-1], docID, pf.sf, t)
			}
		}
	}
	return allTxns, allDocIDs
}
