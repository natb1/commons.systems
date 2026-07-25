---
name: budget
description: Encrypted monthly statement-merge sync — ingests new bank downloads, categorizes the unhandled transactions through a dialog, and writes a fresh encrypted snapshot the hosted budget app reloads. Trigger on `/budget`, "sync my statements", or "merge this month's statements".
---

# budget

This skill runs the monthly statement-merge sync entirely on the user's machine.
Each run ingests new bank downloads into the statements archive, generates an
inspection report, walks the user through categorizing any unhandled
transactions, and writes a fresh encrypted snapshot that the hosted budget app
picks up automatically.

Two orchestrator scripts do the heavy lifting. You drive them and own the
user-facing dialog:

- `bash .claude/skills/budget/scripts/budget-sync` — the read-only half. It
  resolves the per-user config, resolves the distributed binary, requires
  `BUDGET_ETL_PASSWORD`, bootstraps the snapshot on first run, ingests new
  downloads, and writes the inspection report to `/tmp/inspect.json`. Platform
  detection and binary resolution are encapsulated inside this script — you no
  longer do them yourself.
- `bash .claude/skills/budget/scripts/budget-apply [spec]` — the mutating half.
  It applies a patch spec (default `/tmp/budget-patch.json`), merges the
  statements into a fresh encrypted snapshot `snapshotDir/budget-<ts>.enc.json`,
  publishes it onto `current` with `cp -f`, and re-reports residual
  uncategorized into `/tmp/inspect.json`.

## Privacy invariant

Transaction data does not leave the user's machine. You must not send
transaction contents, descriptions, amounts, account numbers, the input files,
or any snapshot to a network endpoint.

The snapshot written to the user-configured `snapshotDir` and `current` is
**encrypted** (`.enc.json`). Even when those locations are inside a cloud-synced
folder (e.g. a Google Drive mount), only the holder of `BUDGET_ETL_PASSWORD` can
decrypt the contents — the cloud provider stores ciphertext only. The password
lives in the environment and is never written to a snapshot or transmitted.

The only outbound network call permitted is the one-time binary download
(an HTTPS GET to `https://github.com/natb1/commons.systems/releases`), and only
when no local binary is already present. That request transfers no transaction
data. If a step would otherwise need to send transaction data anywhere, stop and
surface the situation to the user instead.

## Precondition — BUDGET_ETL_PASSWORD

Every snapshot read and write is encrypted, so the password is mandatory.
Before running either script, the user must export it into the environment:

```bash
export BUDGET_ETL_PASSWORD=...
```

The binary reads `BUDGET_ETL_PASSWORD` from the environment itself — it is never
passed as a flag. macOS users with a keychain entry may alternatively pass
`--keychain <entry>` to the binary, as the binary's own help notes.

If `budget-sync` exits 1 reporting a missing password, surface the message and
have the user export the variable, then re-run.

## Step 1 — Sync

Run the read-only half:

```bash
bash .claude/skills/budget/scripts/budget-sync
```

Branch on its exit code:

- **Exit 3 (`no-config`)** — the per-user config file is absent. This is the
  first-run signal. Go to the config interview below, then re-run `budget-sync`.
- **Exit 1** — invalid config, a missing directory or Drive mount, an
  unsupported platform, a binary download failure, or a missing password. The
  script's stderr already names the offending path or variable. Surface it to
  the user and stop; do not retry blindly.
- **Any other non-zero exit** — a binary call failed and propagated its own exit
  code. If its stderr names a decryption failure reading the existing `current`
  snapshot, that is a password problem, not a config problem — go to
  "Wrong-password handling" below. Otherwise surface the binary's stderr and
  stop.
- **Exit 0** — the report was produced. Read `/tmp/inspect.json` and continue to
  step 2.

### First-run config interview (exit 3 only)

When `budget-sync` exits 3, walk the user through creating the config file at:

```
${XDG_CONFIG_HOME:-$HOME/.config}/commons-systems/budget-etl.json
```

It is a JSON object with four required keys, each an **absolute** path:

```json
{
  "downloads":   "/absolute/path/to/where/bank/exports/land",
  "statements":  "/absolute/path/to/the/statements/archive",
  "snapshotDir": "/absolute/path/to/the/encrypted/snapshot/history",
  "current":     "/absolute/path/to/the/current/snapshot/the/app/reads"
}
```

- `downloads` — where your bank's exported statement files land (e.g. a browser
  downloads folder).
- `statements` — the archive the synced files are filed into, by
  institution/account. This persists across runs.
- `snapshotDir` — where each run's immutable encrypted snapshot
  (`budget-<ts>.enc.json`) is kept as history.
- `current` — the single snapshot the hosted app reads. Each run overwrites it
  in place with a copy of the newest snapshot.

`snapshotDir` and `current` may live in a cloud-synced folder — the snapshot is
encrypted, so this is safe (see the privacy invariant). Also remind the user to
export `BUDGET_ETL_PASSWORD` (or use `--keychain` on macOS) if they have not
already. Once the file exists, re-run `budget-sync`.

## Step 2 — Decide whether to categorize

Read the report:

```bash
new_statements=$(jq '.new_statements | length' /tmp/inspect.json)
uncategorized=$(jq '.uncategorized | length' /tmp/inspect.json)
```

- **`uncategorized == 0` and `new_statements == 0`** — nothing changed. Report a
  clean no-op and stop. There is no snapshot to write.
- **`uncategorized == 0` and `new_statements > 0`** — every new transaction is
  already covered by existing rules, but the new statements still need to merge
  into a fresh snapshot. Skip the dialog. Write a no-op patch spec (empty `add`
  and `remove`) to `/tmp/budget-patch.json`:

  ```json
  { "remove": { "by_id": [], "by_predicate": [] }, "add": [] }
  ```

  Then go straight to step 4 (Apply) with this spec.
- **`uncategorized > 0`** — enter the categorization dialog (step 3).

## Step 3 — Categorization dialog

The report has three arrays:

- `new_statements` — per-statement summary (institution, account, period,
  txn_count, date_range, balance).
- `uncategorized` — transactions no existing rule covers.
- `new_transactions` — every newly-parsed transaction with its `doc_id` (used
  for trip-window budget overrides).

**Source recommendations from history.** Dump the prior snapshot's transactions
through the binary's `dump` subcommand, which takes the snapshot path as a
positional argument and reads the password from the environment. `budget-sync`
already printed the resolved binary path on its first line. budget-sync runs in
a subprocess, so its bindings don't persist — re-bind them in your shell first:

```bash
BUDGET_ETL_BIN=$(...)   # the path from budget-sync's "using binary <path>" line
current=$(jq -r '.current' <<<"$(.claude/skills/budget/scripts/budget-config-load)")
"$BUDGET_ETL_BIN" dump "$current" > /tmp/dump.json
```

Use `jq` over `/tmp/dump.json` to find past transactions whose descriptions
share a substring with each uncategorized entry, and propose the category /
budget target that history already used.

**Print the unhandled-transactions table.** Sort `uncategorized` by date so trip
clusters appear in date order. For each row print:

| institution | description | date | amount | recommended category | recommended budget |

**Prompt for clusters.** Ask about lodging anchors and non-home merchant
clusters — e.g. "These charges near a hotel stay — vacation, business, or
regular?" Convert the answers into the patch spec below.

### Patch-spec shape

Write `/tmp/budget-patch.json` as a top-level object with `remove` and `add`:

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

- `remove.by_id` removes rules by their id.
- `remove.by_predicate` removes rules matching a set of fields.
- `add[]` entries are either `categorization` rules (match a `pattern`, assign a
  `target` category, with a `priority`) or `budget_assignment` rules (assign a
  `target` budget). A trip override targets a single transaction by its doc-id
  via `transactionId` (read the doc-id from `new_transactions` in the report).

## Step 4 — Apply, then loop (hard cap 3 iterations)

Run the mutating half with the patch spec:

```bash
bash .claude/skills/budget/scripts/budget-apply /tmp/budget-patch.json
```

It patches `current`, merges the statements into a fresh encrypted snapshot,
publishes that onto `current` with `cp -f`, and re-reports into
`/tmp/inspect.json`.

The binary's `merge` step hard-errors if any transaction is still uncategorized
— that gate is intentional, and it is what drives the loop. Because
`budget-apply` runs under `set -e`, a failed `merge` exits the script before it
publishes or re-reports: the remaining uncategorized transactions are named in
the **merge step's stderr**, and `/tmp/inspect.json` is not refreshed on this
path. So on a non-zero exit whose stderr names remaining uncategorized
transactions, take the residual list from that stderr, return to the step-3
dialog to extend the patch spec, and re-run `budget-apply`.

**Hard cap: 3 iterations.** After three apply attempts without convergence,
stop and surface the remaining uncategorized transactions to the user. Do not
loop further.

A successful `budget-apply` (exit 0) means every transaction categorized, the
merge completed, and `current` was overwritten in place; `/tmp/inspect.json` is
then refreshed with a zero residual.

## Step 5 — Summary

`budget-apply` prints the per-statement summary table on success:

| institution | new txn count | first date | last date | balance |

Report that table plus a "Rules: N added, M removed" line derived from the patch
spec you applied. Name the new snapshot path
(`snapshotDir/budget-<ts>.enc.json`, echoed by `budget-apply`) and confirm that
`current` was overwritten in place with a fresh mtime — that fresh mtime is what
triggers the hosted app to re-read the snapshot.

### Stamp the strategy reading

`strategy-recover-finance`'s success signal is "statements merged and
categorized monthly", sensed by this snapshot history. After a successful
publish (Step 4 exit 0, a fresh snapshot on `current`), record the sync on the
strategy node so its `reading` stays current. Do this once per successful
`/budget`, and only when a fresh snapshot actually landed.

1. Dump the strategy node to JSON, capturing the compare-and-swap base:

   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts \
     --out-dir "$TMPDIR" strategy-recover-finance
   ```

   This writes `$TMPDIR/strategy-recover-finance.json` (the shape `write-node.ts`
   consumes) and `$TMPDIR/base-manifest.txt`.

2. In that JSON, set `reading` to
   `"<YYYY-MM> statements merged and categorized; snapshot <filename>"`, where
   `<YYYY-MM>` is the merged statement month and `<filename>` is the basename of
   the just-published snapshot (`budget-<ts>.enc.json`, echoed by
   `budget-apply`). Set `gap` to `null` when the merged month is the most recent
   complete month; otherwise name the shortfall (e.g. the months still unmerged).
   Change nothing else.

3. Write it back through the validation gate, then land it:

   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/write-node.ts \
     --file "$TMPDIR/strategy-recover-finance.json"
   packages/intentionsutil/scripts/graph-commit \
     --base "$TMPDIR/base-manifest.txt" strategy-recover-finance
   ```

`reading` and `gap` are sensor-writable state fields, excluded from the strategy
substance fingerprint, so this stamp never triggers a soft freeze on the
strategy. The snapshot filename carries a timestamp only — no transaction data —
so it is safe for the public graph. The privacy invariant above otherwise
applies unchanged: never put transaction contents, descriptions, amounts, or
account identifiers into the stamped `reading`.

## Wrong-password handling

A decryption failure when reading an existing `current` snapshot is a
**password or snapshot problem, not a config problem** — keep the two distinct
(see `.claude/rules/code-style.md`). The config interview will not help here.
Tell the user the snapshot at `current` could not be decrypted with the
`BUDGET_ETL_PASSWORD` in the environment, and that they should export the same
password used to write that snapshot (or, on macOS, point the binary at the
keychain entry that holds it) and re-run. Do not fall back to rewriting the
config or bootstrapping a new snapshot.

## `/budget-parser` fallback — unrecognized statement format

If the binary fails with stderr containing `unrecognized statement format`, the
user's bank uses an export format the bundled parsers don't cover. Tell them:

> Your bank's export format isn't recognized by the bundled parsers. To teach
> the tool a new format:
>
> 1. Fork the project: https://github.com/natb1/commons.systems/fork
> 2. Open your fork in Claude Desktop or Claude Code.
> 3. Run `/budget-parser <path-to-your-file>` — that skill walks Claude through
>    writing and testing a new parser for your bank.
