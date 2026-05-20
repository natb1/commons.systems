---
name: budget-parser
description: Guide a user through adding a new bank-statement parser to budget-etl for an unsupported export format. Trigger when the user runs /budget-parser <path-to-statement-file>.
---

# budget-parser

Adds a new parser to `budget-etl/internal/parse/` for a bank export format not already handled (QFX/OFX/CSV). The user provides a sample statement file; this skill identifies the format, generates the parser and test, registers the format in the dispatch table, and runs `go test`.

## Step 1 — Check prerequisites

Run `go version`. If not found or non-zero, report that Go is required (https://go.dev/dl/) and stop.

Confirm `budget-etl/internal/parse/` exists relative to the current directory. If not, the user is not in a clone of this repo — report and stop.

## Step 2 — Identify the format and record a header marker

Read the file the user provided. Then identify:

- **Syntax type**: delimiter-separated, XML/tag markup with closing tags, SGML-style markup without closing tags, fixed-width, JSON, or other.
- **Transaction boundaries**: enclosing tags, row delimiters, blank-line separators, etc.
- **Field positions**: where dates, amounts, descriptions appear within each transaction.
- **Balance**: whether a ledger balance and balance date are present, and where.
- **Header marker**: a stable substring within the first 512 bytes that uniquely identifies this format (e.g. `<?xml`, `OFXHEADER:`). This will be reused in Step 7's `detectFormat` branch; record it now so the format is not re-sniffed.

Report the structure to the user in plain language before proceeding.

## Step 3 — Read the canonical types and the closest existing parser

Read `budget-etl/internal/parse/parse.go` (defines `Transaction`, `ParseResult`, `detectFormat`, `ParseFile`) and `budget-etl/internal/parse/ofxutil.go` (defines the shared helpers `parseCents`, `parseOFXDate`, `convertRawTransaction`, and the `rawTransaction` struct).

Pick the closest analog to the new format and read that parser:

- Line-oriented delimited text → `csv.go`.
- Tag/markup with closing tags (valid XML) → `ofx.go`.
- Tag/markup without closing tags (SGML-style) → `sgml.go`.

You may read the other parsers for cross-reference if helpful, but only the analog is required.

Reuse the shared helpers where their semantics fit:

- `parseCents` — decimal amount string → integer cents.
- `parseOFXDate` — OFX `YYYYMMDD[...]` date strings → `time.Time`.
- `rawTransaction` + `convertRawTransaction` — only when the source provides OFX-named fields (`FITID`, `DtPosted`, `TrnAmt`, `Name`, `Memo`). Populate a `rawTransaction` and call `convertRawTransaction(raw)`; it validates required fields, inverts the OFX sign convention, and joins `Name`/`Memo` into `Description` as `"Name | Memo"` when they differ. Do **not** call it with non-OFX field semantics.

If the new format has account types your code should not parse as transactions (e.g. investment accounts in OFX), set `ParseResult.Skipped = true` and `SkipReason = "<reason>"` and return early — see `parseSGML` and `parseOFX` for the pattern.

## Step 4 — Generate the parser

Write `budget-etl/internal/parse/<format>.go` with a function:

```go
func parse<Format>(path string) (ParseResult, error)
```

Follow the chosen template from Step 3. Key requirements:

- **Amount sign**: `Transaction.Amount` is positive = spending. If you use `convertRawTransaction`, sign inversion is handled for you. Otherwise map the source's sign convention to `Transaction.Amount` explicitly (e.g. CSV reads a DEBIT/CREDIT type field).
- **Date parsing**: use `parseOFXDate` for OFX-style dates; `time.Parse` with the appropriate layout for others.
- **TransactionID uniqueness**: if the source provides a stable per-transaction ID, use it directly. If IDs may repeat (as in CSV), apply the `idCounts` de-dup pattern from `csv.go`: track seen IDs in a `map[string]int`, and append `-N` (N ≥ 2) to duplicates. If the format has no ID field at all, this is a new convention — pause and discuss with the user before inventing one.

## Step 5 — Add the test fixture

Before copying the user's sample file into the repo, **ask the user** whether it contains personal data (account numbers, names, addresses). Offer to redact — replace sensitive values with clearly fake placeholders — before the file is committed.

Once confirmed, copy to:

```
budget-etl/internal/parse/testdata/<institution>.<ext>
```

Fixtures are keyed by institution name, not format name (see existing `bankone.qfx`, `banktwo.ofx`, `bankone.csv`). Pick a short, distinct institution identifier with the user.

## Step 6 — Write the test

Create `budget-etl/internal/parse/<format>_test.go`. Use `sgml_test.go` as the template, or `csv_test.go` if the format is delimited (its `TestParseCSV_EmptyFile` is the closer analog for empty-input handling).

- A primary `TestParse<Format>` function that calls the parser directly against the fixture.
- For at least one transaction, assert all four fields: `TransactionID`, `Date`, `Amount`, `Description`. Derive expected values by reading the fixture directly.
- If a balance is present in the fixture, assert `result.Balance` and `result.BalanceDate`.
- An error-case test for empty/malformed input (see `TestParseSGML_NoTransactions` or `TestParseCSV_EmptyFile`).

Transaction count is covered by `TestParseFile_Dispatch` in Step 7 — don't duplicate it here.

## Step 7 — Register the format in the dispatch table

Make three edits to `budget-etl/internal/parse/parse.go` in one pass:

1. Add a `format<Format>` constant to the `format` iota block after the existing constants.
2. Add a branch to `detectFormat` that returns `format<Format>` when the header matches the marker recorded in Step 2.
3. Add a `case format<Format>:` branch in `ParseFile`'s switch that calls `parse<Format>(path)`.

Then extend the existing tests in `budget-etl/internal/parse/parse_test.go`. The `TestParseFile_Dispatch` row fields are `{name, path, wantTxns int, wantSkipped bool}`:

- Add a `{"<Format>", filepath.Join("testdata", "<institution>.<ext>"), <count>, false}` row to `TestParseFile_Dispatch`.
- Add a `{"<Format>", filepath.Join("testdata", "<institution>.<ext>"), format<Format>}` row to `TestDetectFormat`.

## Step 8 — Run `go test`

From `budget-etl/`, run:

```bash
go test ./internal/parse/...
```

Report the full output to the user. If any test fails, stop and walk through the failure with the user — do not silently retry or make speculative fixes without showing the error first.

## Step 9 — Summarize

Report:

- New files created (parser, test, fixture).
- Format identified in Step 2.
- Transaction count parsed from the sample.
- A reminder that the user can commit the changes and open a PR to the upstream repo (or keep them in their fork) to make the parser available to others.
