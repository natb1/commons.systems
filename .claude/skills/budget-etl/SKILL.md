---
name: budget-etl
description: Monthly QFX merge workflow — identifies bank statements, generates an inspection report, iterates on categorization rule patches, and writes an encrypted budget snapshot.
---

# budget-etl

Monthly statement merge workflow. Backed by `budget-etl/cmd/patch` (JSON-spec rule editor) and `budget-etl --report` (inspection report).

## Sandbox

Every `go run` that touches `budget-etl` or `budget-etl/cmd/patch` with `--keychain` needs `dangerouslyDisableSandbox: true` — `keychain.Get` shells out to `security`, which the sandbox blocks. See `.claude/rules/sandbox.md`.

## Precondition — Export BUDGET_ETL_PASSWORD

Claude Code runs from the worktree root, where the nested
`budget-etl/.envrc` is **not** active. Before any `go run`, export the
password into the shell:

```bash
export BUDGET_ETL_PASSWORD="$(pass show budget-etl/main)"
```

If `pass show` errors with `gpg: decryption failed`, the gpg-agent cache is
cold and pinentry can't prompt in Claude's non-interactive shell — see
`.claude/rules/sandbox.md`. Run `pass show budget-etl/main` once in the host
terminal to warm the cache, then re-export here.

macOS users with the `budget` keychain entry may alternatively pass
`--keychain budget` to each `go run` instead of exporting the env var.

## Step 0 — Resolve config

All paths come from `dispatch.config/budget-etl.json` (uncommitted, per-machine). Load and parse it from the worktree root:

```bash
CFG=$(.claude/skills/dispatch-propagate/scripts/dispatch-config-load budget-etl) || {
  echo "budget-etl config present but invalid — see the error above" >&2
  exit 1
}
if [[ "$CFG" == "no-config" ]]; then
  echo "no dispatch.config/budget-etl.json — copy .claude/skills/dispatch-propagate/scripts/budget-etl.example.json to dispatch.config/budget-etl.json and set the four paths" >&2
  exit 1
fi
downloads=$(jq -r '.downloads'   <<<"$CFG")
statements=$(jq -r '.statements'  <<<"$CFG")
snapshotDir=$(jq -r '.snapshotDir' <<<"$CFG")
current=$(jq -r '.current'     <<<"$CFG")
```

A non-zero exit from `dispatch-config-load` means the file is present but invalid — its stderr already explains. Stop and surface that error.

Verify the directories exist and fail loudly if not (no silent fallback to a stale local path — see `.claude/rules/code-style.md`):

```bash
[[ -d "$downloads" ]] || { echo "downloads dir missing: $downloads" >&2; exit 1; }
[[ -d "$statements" ]] || { echo "Drive mount missing (statements): $statements" >&2; exit 1; }
[[ -d "$(dirname "$current")" ]] || { echo "Drive mount missing (parent of current): $(dirname "$current")" >&2; exit 1; }
[[ -d "$snapshotDir" ]] || [[ -d "$(dirname "$snapshotDir")" ]] || { echo "Drive mount missing (snapshotDir): $snapshotDir" >&2; exit 1; }
```

`current` itself may not exist on a first run, but its parent (the Drive mount) must. `$statements` is expected to already exist as a pre-existing archive directory — if the Drive is unmounted it will not be present, so the check catches a missing/stale mount before any files are moved. `$downloads`, `$statements`, `$snapshotDir`, and `$current` carry through the later steps — every reference stays double-quoted because paths may contain spaces (`My Drive`).

## Step 1 — Ingest downloads into the statements archive

Run from the worktree root:

```bash
bash .claude/skills/budget-etl/scripts/ingest-downloads.sh "$downloads" "$statements"
```

The script classifies each statement file in `"$downloads"` via the sibling `identify-qfx.sh` and moves it to `"$statements"/<institution>/<account>/`, printing one `<src> to <dest>` line per move. Moving a file out of `"$downloads"` is the dedup for "new statement".

It classifies all files first and moves nothing until every file classifies. If it exits non-zero with an unknown-ORG / unclassifiable stop, map the ORG in `identify-qfx.sh`'s `ORG_MAP` (or confirm the institution with the user), then re-run.

## Step 2 — Generate the inspect report

Run from `budget-etl/`. Use `dangerouslyDisableSandbox: true`. `"$current"` is the authoritative input — it supplies both the categorization rules and the prior transactions.

```bash
INPUT="$current"
go run . --input "$INPUT" --dir "$statements" --report /tmp/inspect.json --allow-uncategorized
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

Apply and re-merge. Both commands need `dangerouslyDisableSandbox: true`. The patch reads from `"$current"`; the final merge writes a new immutable snapshot into `"$snapshotDir"`, then replaces `"$current"` with a copy of it:

```bash
go run ./cmd/patch --input "$current" --spec /tmp/budget-patch.json --output /tmp/stage1.enc.json
TS=$(date +%Y-%m-%dT%H-%M-%S)
OUT="$snapshotDir/budget-$TS.enc.json"
go run . --input /tmp/stage1.enc.json --dir "$statements" --output "$OUT"
cp -f "$OUT" "$current"   # current becomes an equal copy; the snapshot stays in snapshotDir as history
```

Use `cp -f`, not `mv -f`: the snapshot must remain in `"$snapshotDir"` as history while `"$current"` becomes an equal copy of the newest snapshot. A symlink is deliberately not used because `ln -s` fails on the `/mnt/g` Google Drive mount — the copy keeps `"$current"` a real file.

On uncategorized regression: regenerate report with `--input /tmp/stage1.enc.json` and return to step 3 with the residual list. After 3 iterations without convergence, stop and surface the remaining uncategorized transactions to the user — do not loop further.

## Step 5 — Summary table

Print from `new_statements` plus the patch counts from step 4:

| institution | new txn count | first date | last date | balance |

Include a "Rules: N added, M removed" footer. Note the new snapshot path (`"$snapshotDir"/budget-<ts>.enc.json`) and confirm `"$current"` now equals it.
