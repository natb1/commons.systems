---
name: budget-parser
description: Guide a user through adding a new bank-statement parser to budget-etl for an unsupported export format. Trigger when the user runs /budget-parser <path-to-statement-file>.
---

# budget-parser

Adds a new parser to `budget-etl/internal/parse/` for a bank export format not already handled (QFX/OFX/CSV). The user provides a sample statement file; this skill identifies the format, generates the parser and test, registers the format in the dispatch table, and runs `go test`.

## Step 1 — Check Go toolchain

Run:

```bash
go version
```

If the command is not found or exits non-zero, report to the user that Go is required and direct them to https://go.dev/dl/. Stop — do not proceed without a working Go toolchain.

## Step 2 — Read the sample file and identify its structure

Read the file the user provided (the skill argument). Inspect at minimum the first 512 bytes plus a structural scan of the full file. Identify:

- Syntax type: delimiter-separated, XML/tag markup with closing tags, SGML-style markup without closing tags, fixed-width, JSON, or other.
- How individual transactions are bounded (e.g., enclosing tags, row delimiters, blank-line separators).
- Where dates, amounts, and descriptions appear within each transaction.
- Whether a ledger balance and balance date are present, and where.

Report the identified structure to the user in plain language before proceeding.

## Step 3 — Reference the existing parsers as templates

Read `budget-etl/internal/parse/sgml.go`, `ofx.go`, and `csv.go`. Pick the closest analog to the new format:

- Line-oriented delimited text → model after `csv.go`.
- Tag/markup with closing tags (valid XML) → model after `ofx.go`.
- Tag/markup without closing tags (SGML-style) → model after `sgml.go`.

The new parser must produce a `ParseResult` containing a `[]Transaction` slice. Each `Transaction` has:

| Field | Type | Convention |
|---|---|---|
| `TransactionID` | `string` | Unique per transaction; see Step 4 for synthesizing IDs |
| `Date` | `time.Time` | Posting date |
| `Amount` | `int64` | Cents, signed: **positive = spending, negative = income/credit** |
| `Description` | `string` | Merchant name or memo text |

`ParseResult` also carries optional `Balance int64` (cents) and `BalanceDate time.Time`.

Reuse shared helpers where their semantics fit:
- `parseCents(s string) (int64, error)` — parse a decimal amount string to integer cents.
- `parseOFXDate(s string) (time.Time, error)` — parse OFX YYYYMMDD[...] date strings.
- `convertRawTransaction(raw rawTransaction) (Transaction, error)` — convert OFX/SGML `STMTTRN` fields; only applicable when the source uses OFX field names (`FITID`, `DTPOSTED`, `TRNAMT`, `NAME`, `MEMO`).

## Step 4 — Generate the parser

Write `budget-etl/internal/parse/<format>.go` with a function:

```go
func parse<Format>(path string) (ParseResult, error)
```

Follow the chosen template from Step 3. Key requirements:

- **Amount sign**: the `Transaction.Amount` convention is positive = spending. OFX/SGML invert the raw sign (`convertRawTransaction` handles this). CSV uses a DEBIT/CREDIT type field. For other formats, map the source's sign convention to the `Transaction.Amount` convention explicitly.
- **Date parsing**: use `parseOFXDate` for OFX-format dates; use `time.Parse` with the appropriate layout for others.
- **TransactionID uniqueness**: if the source format provides a unique ID per transaction, use it directly. If IDs may repeat (as in CSV), apply the `idCounts` de-dup pattern from `csv.go`: track seen IDs in a `map[string]int`, and append `-N` (where N ≥ 2) to any duplicate. If the format has no ID field, synthesize one from a stable combination of fields (e.g., date + amount + description hash).

## Step 5 — Add the test fixture

Before copying the user's sample file into the codebase, **ask the user** whether it contains identifying personal data (account numbers, names, addresses). Offer to redact — replace sensitive values with clearly fake placeholders — before committing the file to the repo.

Once the user confirms (redacted or as-is), copy to:

```
budget-etl/internal/parse/testdata/<format>-sample.<ext>
```

## Step 6 — Write the test

Create `budget-etl/internal/parse/<format>_test.go` following the structure of `sgml_test.go`:

- A primary `TestParse<Format>` function that calls the parser directly against the fixture.
- Assert transaction count matches the fixture.
- If a balance is present in the fixture, assert `result.Balance` and `result.BalanceDate`.
- For at least one transaction, assert all four fields: `TransactionID`, `Date`, `Amount`, `Description`. Derive expected values by reading the fixture directly.
- Add an error-case test for an empty or malformed input (equivalent to `TestParseSGML_NoTransactions`).

## Step 7 — Register the format in the dispatch table

Make three edits to `budget-etl/internal/parse/parse.go`:

1. Add a `format<Format>` constant to the `format` iota block after the existing constants.
2. Add a header-sniffing branch to `detectFormat` that returns `format<Format>` when the first 512 bytes match a reliable marker for the new format.
3. Add a `case format<Format>:` branch in `ParseFile`'s switch that calls `parse<Format>(path)`.

Then extend the existing tests in `budget-etl/internal/parse/parse_test.go`:

- Add a `{"<Format>", filepath.Join("testdata", "<format>-sample.<ext>"), <count>, false}` row to `TestParseFile_Dispatch`.
- Add a `{"<Format>", filepath.Join("testdata", "<format>-sample.<ext>"), format<Format>}` row to `TestDetectFormat`.

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
