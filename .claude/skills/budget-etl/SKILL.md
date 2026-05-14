---
name: budget-etl
description: Monthly QFX merge workflow — identifies bank statements, generates an inspection report, iterates on categorization rule patches, and writes an encrypted budget snapshot.
---

# budget-etl

Monthly statement merge workflow. Backed by `budget-etl/cmd/patch` (JSON-spec rule editor) and `budget-etl --report` (inspection report).

## Sandbox

Every `go run` that touches `budget-etl` or `budget-etl/cmd/patch` with `--keychain` needs `dangerouslyDisableSandbox: true` — `keychain.Get` shells out to `security`, which the sandbox blocks. See `.claude/rules/sandbox.md`.

## Step 1 — Move QFX downloads into the statements directory

Run from the worktree root:

```bash
bash .claude/skills/budget-etl/scripts/identify-qfx.sh ~/Downloads/*.qfx
```

The script prints `<file>\t<institution>\t<account>` rows. If it exits 1 with `unknown ORG: X`, ask the user which institution maps to that ORG before continuing.

Confirm the mapping with the user, then move each file:

```bash
mv <file> ~/statements/<institution>/<account>/
```

## Step 2 — Generate the inspect report

Run from `budget-etl/`. Use `dangerouslyDisableSandbox: true`.

```bash
INPUT=$(ls -t ~/Desktop/budget*.enc.json | head -1)
go run . --input "$INPUT" --dir ~/statements --report /tmp/inspect.json --allow-uncategorized --keychain budget
```

The report has three arrays:
- `new_statements` — per-statement summary (institution, account, period, txn_count, date_range, balance).
- `uncategorized` — transactions no existing rule covers.
- `new_transactions` — every newly-parsed transaction with its `doc_id` (used for trip-window budget overrides).

## Step 3 — Present the unhandled-transactions table

Sort `uncategorized` by date so trip clusters appear in date order. For each row print:

| institution | description | date | amount | recommended category | recommended budget |

Source recommendations from historical patterns via `cmd/dump` + `jq`. Run from `budget-etl/`:

```bash
go run ./cmd/dump "$INPUT" > /tmp/dump.json
```

Use `jq` to find past transactions with matching description substrings and propose category / budget targets already in the rule set.

Prompt the user about lodging anchors and non-home merchant clusters: "These entries near a hotel charge — vacation, business, or regular?" Convert answers into entries for the step-4 patch spec.

## Step 4 — Apply rule updates (iterative, hard cap 3 iterations)

Build or update `/tmp/budget-patch.json` from step-3 feedback. Spec shape:

```json
{
  "remove": {
    "by_id": ["rule-id-to-remove"],
    "by_predicate": [
      {"type": "budget_assignment", "matchCategory": "Travel", "target": "vacation", "pattern": ""}
    ]
  },
  "add": [
    {"id": "cat-headway", "type": "categorization", "pattern": "HEADWAY", "target": "Health:Therapy", "priority": 10},
    {"id": "bg-trip-dogfish", "type": "budget_assignment", "transactionId": "<doc-id>", "target": "vacation"}
  ]
}
```

Apply and re-merge. Both commands need `dangerouslyDisableSandbox: true`:

```bash
go run ./cmd/patch --input "$INPUT" --spec /tmp/budget-patch.json --output /tmp/stage1.enc.json --keychain budget
OUT=~/Desktop/budget-$(date +%Y-%m-%dT%H-%M-%S).enc.json
go run . --input /tmp/stage1.enc.json --dir ~/statements --output "$OUT" --keychain budget
```

On uncategorized regression: regenerate report with `--input /tmp/stage1.enc.json` and return to step 3 with the residual list. After 3 iterations without convergence, stop and surface the remaining uncategorized transactions to the user — do not loop further.

## Step 5 — Summary table

Print from `new_statements` plus the patch counts from step 4:

| institution | new txn count | first date | last date | balance |

Include a "Rules: N added, M removed" footer.
