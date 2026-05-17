// Command patch applies a JSON-spec rule edit to a budget snapshot.
//
// Usage:
//
//	patch --spec <path> --input <path> --output <path> [--keychain <name>]
//
// The spec adds and removes rules in the snapshot's Rules array. See Spec for the
// JSON shape. Output path must differ from input. When --keychain is set, input
// is decrypted and output is encrypted with the keychain password.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"regexp"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/keychain"
	"github.com/natb1/commons.systems/budget-etl/internal/store"
)

// Spec is the top-level patch specification read from --spec.
type Spec struct {
	Remove RemoveSpec    `json:"remove"`
	Add    []export.Rule `json:"add"`
}

// RemoveSpec describes which rules to drop from the snapshot.
// ByPredicate items are partial export.Rule values; non-zero fields form an
// AND filter applied to each existing rule.
type RemoveSpec struct {
	ByID        []string      `json:"by_id"`
	ByPredicate []export.Rule `json:"by_predicate"`
}

// docIDPattern matches the format produced by store.TransactionDocID:
// truncated SHA-256 (10 bytes / 20 lowercase hex chars).
var docIDPattern = regexp.MustCompile(`^[0-9a-f]{20}$`)

func main() {
	spec := flag.String("spec", "", "Path to JSON spec file (required)")
	input := flag.String("input", "", "Path to input snapshot (required)")
	output := flag.String("output", "", "Path to output snapshot (required; must differ from --input)")
	keychainAccount := flag.String("keychain", "", "macOS Keychain account name; if empty, treat input/output as plaintext")
	flag.Parse()

	if err := runPatch(*spec, *input, *output, *keychainAccount); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func runPatch(specPath, inputPath, outputPath, keychainAccount string) error {
	if specPath == "" {
		return fmt.Errorf("--spec is required")
	}
	if inputPath == "" {
		return fmt.Errorf("--input is required")
	}
	if outputPath == "" {
		return fmt.Errorf("--output is required")
	}
	if inputPath == outputPath {
		return fmt.Errorf("--input and --output must differ")
	}

	var password string
	if keychainAccount != "" {
		pw, err := keychain.Get(keychainAccount)
		if err != nil {
			return err
		}
		password = pw
	}

	inp, err := export.ReadFile(inputPath, password)
	if err != nil {
		return err
	}

	specBytes, err := os.ReadFile(specPath)
	if err != nil {
		return fmt.Errorf("reading spec: %w", err)
	}
	var spec Spec
	if err := json.Unmarshal(specBytes, &spec); err != nil {
		return fmt.Errorf("parsing spec: %w", err)
	}

	out, err := applySpec(inp, spec)
	if err != nil {
		return err
	}

	return export.WriteFile(outputPath, out, password)
}

// applySpec returns a copy of out with rules removed (by_id + by_predicate)
// and rules appended (add[]). Errors on:
//   - any add[].ID empty, intra-spec duplicate, or collision with an existing rule
//   - any add[] transaction-specific rule whose TransactionID isn't a valid
//     store.TransactionDocID-formatted doc ID
//   - any remove.by_predicate item with all zero fields (would match every rule)
func applySpec(out export.Output, spec Spec) (export.Output, error) {
	existingIDs := make(map[string]bool, len(out.Rules))
	for _, r := range out.Rules {
		existingIDs[r.ID] = true
	}

	addIDs := make(map[string]bool, len(spec.Add))
	for i, r := range spec.Add {
		if r.ID == "" {
			return export.Output{}, fmt.Errorf("add[%d]: id is required", i)
		}
		if existingIDs[r.ID] {
			return export.Output{}, fmt.Errorf("add[%d]: rule id %q collides with existing rule", i, r.ID)
		}
		if addIDs[r.ID] {
			return export.Output{}, fmt.Errorf("add[%d]: rule id %q duplicated within add[]", i, r.ID)
		}
		addIDs[r.ID] = true
		if err := validateAddRule(r, i); err != nil {
			return export.Output{}, err
		}
	}

	for i, pred := range spec.Remove.ByPredicate {
		if predicateIsEmpty(pred) {
			return export.Output{}, fmt.Errorf("remove.by_predicate[%d]: all fields are zero, predicate would match every rule", i)
		}
	}

	removeByID := make(map[string]bool, len(spec.Remove.ByID))
	for _, id := range spec.Remove.ByID {
		removeByID[id] = true
	}

	kept := make([]export.Rule, 0, len(out.Rules))
	for _, r := range out.Rules {
		if removeByID[r.ID] {
			continue
		}
		matched := false
		for _, pred := range spec.Remove.ByPredicate {
			if predicateMatches(r, pred) {
				matched = true
				break
			}
		}
		if matched {
			continue
		}
		kept = append(kept, r)
	}

	kept = append(kept, spec.Add...)

	mutated := out
	mutated.Rules = kept
	return mutated, nil
}

// validateAddRule checks transaction-specific rules carry a valid doc ID.
// The format is whatever store.TransactionDocID produces — 20 lowercase hex
// chars from a truncated SHA-256. We reuse the helper directly elsewhere
// (e.g. tests construct doc IDs via store.TransactionDocID) rather than
// reimplementing the truncation here.
func validateAddRule(r export.Rule, idx int) error {
	if r.TransactionID == "" {
		return nil
	}
	if !docIDPattern.MatchString(r.TransactionID) {
		return fmt.Errorf("add[%d]: transactionId %q is not a valid doc ID (expected %d lowercase hex chars from store.TransactionDocID)", idx, r.TransactionID, len(store.TransactionDocID("x", "y")))
	}
	return nil
}

// predicateIsEmpty returns true iff every field of pred is the zero value.
// Used to reject unbounded by_predicate entries that would match every rule.
func predicateIsEmpty(pred export.Rule) bool {
	return pred.ID == "" &&
		pred.Type == "" &&
		pred.Pattern == "" &&
		pred.Target == "" &&
		pred.Priority == 0 &&
		pred.Institution == "" &&
		pred.Account == "" &&
		pred.MinAmount == nil &&
		pred.MaxAmount == nil &&
		pred.ExcludeCategory == "" &&
		pred.MatchCategory == "" &&
		pred.Category == "" &&
		pred.TransactionID == ""
}

// predicateMatches returns true iff every non-zero field on pred equals the
// corresponding field on r. *float64 fields require both nil-equivalence and
// equal pointed-to values when pred sets them.
func predicateMatches(r, pred export.Rule) bool {
	if pred.ID != "" && r.ID != pred.ID {
		return false
	}
	if pred.Type != "" && r.Type != pred.Type {
		return false
	}
	if pred.Pattern != "" && r.Pattern != pred.Pattern {
		return false
	}
	if pred.Target != "" && r.Target != pred.Target {
		return false
	}
	if pred.Priority != 0 && r.Priority != pred.Priority {
		return false
	}
	if pred.Institution != "" && r.Institution != pred.Institution {
		return false
	}
	if pred.Account != "" && r.Account != pred.Account {
		return false
	}
	if pred.ExcludeCategory != "" && r.ExcludeCategory != pred.ExcludeCategory {
		return false
	}
	if pred.MatchCategory != "" && r.MatchCategory != pred.MatchCategory {
		return false
	}
	if pred.Category != "" && r.Category != pred.Category {
		return false
	}
	if pred.TransactionID != "" && r.TransactionID != pred.TransactionID {
		return false
	}
	if pred.MinAmount != nil {
		if r.MinAmount == nil || *r.MinAmount != *pred.MinAmount {
			return false
		}
	}
	if pred.MaxAmount != nil {
		if r.MaxAmount == nil || *r.MaxAmount != *pred.MaxAmount {
			return false
		}
	}
	return true
}
