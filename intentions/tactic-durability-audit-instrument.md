---
id: tactic-durability-audit-instrument
kind: tactic
statement: "Build the durability audit instrument: an owner-editable owned-data
  manifest, an audit script reporting per-class copy redundancy and readability,
  and a household restore runbook"
owner: ai
status: codified
parent: null
rationale: "strategy-durable-owned-data's sensor is owner review at
  office-hours, but its threshold quantifies over owned-data classes, copy
  counts, and rehearsed restores that nothing currently enumerates or checks -
  the 2026-07-02 reading is an unaided interview. This tactic buys the
  instrument: a manifest of owned-data classes (first-pass inventory in strategy
  clarification 4, carried as data the owner can amend), an audit script that
  reports each class's copy redundancy against the threshold, and a
  household-readable RESTORE runbook. tactic-durability-restore-rehearsal
  (born-parked) runs both to produce the strategy's fresh reading. Decomposed
  2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-durable-owned-data
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-durability-audit-instrument
  pr: 2854
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: 68a324156abf9b4ee033c0578a9e3fcd0753a38fa70be3c3a21e996eca0525f5
validates:
  - strategy-durable-owned-data
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the durability audit instrument: an owner-editable owned-data manifest, an audit script reporting per-class copy redundancy and readability, and a household restore runbook

## Context

`strategy-durable-owned-data`'s success signal is "every owned-data class has
a redundant off-machine copy and a rehearsed restore, in a form the household
can read"; the sensor is owner review at office-hours; the threshold is "no
owned-data class has a single copy, a restore has been rehearsed within the
review cycle, and the household can read the archive". The current reading is
an unaided interview ("ad-hoc copies (Google Drive shared drive, dev machine);
no tested restore", 2026-07-02) — nothing enumerates the classes or checks
copy state, so the review cannot produce a pass/fail reading at threshold
granularity.

This tactic builds the instrument: (1) an owner-editable manifest of
owned-data classes with expected copy locations, (2) an audit script that
reads the manifest and reports per-class copy redundancy, freshness, and
readability, and (3) a household-readable restore runbook. Consumers:
`tactic-durability-redundancy-design` (born-parked) ratifies or amends the
inventory — the manifest is data, so an amendment needs no re-plan;
`tactic-durability-restore-rehearsal` (born-parked, blocked on this tactic)
runs the audit and the runbook at office-hours to produce the strategy's
fresh reading.

First-pass class inventory (strategy clarification 4): encrypted budget
`.benc` snapshots (user-held file + the Google Drive shared-drive copy at
`/mnt/g/Shared drives/budget`); bank statements (plaintext downloads on the
same shared drive); app sidecar state (plain-JSON `.commons-*` directories
inside the user's own media folders — see `packages/sidecar/src/factory.ts:50`);
git repositories including the intention graph (local checkout + GitHub).

## Unit 1 — manifest + audit script

**Recommended model:** opus

**Scope:** create a new `ops/durability/` directory (the `ops/` tree currently
holds only `ops/monitoring/` and `ops/scripts/apply-alerts.sh`; no build
integration — the script runs via `node --import tsx/esm`) containing:

- `ops/durability/manifest.json` — an array of class entries:
  `{id, description, min_copies (default 2), verify: "benc-magic" | "git" |
  "exists", copies: [{path, off_machine: boolean}]}`. Seed it with the
  clarification-4 inventory above; host-specific paths (e.g.
  `/mnt/g/Shared drives/budget`) are data the owner edits, never constants in
  the script.
- `ops/durability/audit.ts` — reads `--manifest <path>`; for each class and
  copy location reports existence, file count, and newest mtime; runs the
  class's verify hook (`benc-magic`: first 4 bytes equal `BENC` — the magic at
  `packages/crypto-core/src/crypto-core.ts:8` — on every `*.benc` in the
  location; `git`: the path is a git work tree with an `origin` remote;
  `exists`: presence only). A class PASSES when found copies ≥ `min_copies`,
  at least one found copy has `off_machine: true`, and every verify hook
  passed. Output: a plain markdown report to stdout (per-class table plus an
  overall PASS/FAIL against the strategy threshold). Exit 0 only when every
  class passes; a missing path is a per-class FAIL line, an unreadable or
  invalid manifest is a fatal error (clear errors over fallbacks —
  `.claude/rules/code-style.md`).
- Optional `--decrypt-verify` flag: shells out to the budget-etl `dump`
  subcommand (`projects/budget-etl/dump.go:17`, password resolved from
  `BUDGET_ETL_PASSWORD` via `projects/budget-etl/internal/password`) on the
  newest `.benc` copy and checks the output parses as JSON — a true
  end-to-end readability proof. Off by default: it needs the secret warmed
  (see `.claude/rules/sandbox.md`, pass/GPG pinentry) and a built
  `budget-etl` binary (accept a `--budget-etl <path>` flag; when absent,
  skip with a SKIPPED line, never a silent pass).

Out of scope: scheduling/cron, any write to the archive, creating new backup
legs (that is `tactic-durability-redundancy-design`'s decision), changes to
app code or budget-etl.

## Unit 2 — RESTORE runbook

**Recommended model:** sonnet

**Dependencies:** Unit 1 (mirrors the manifest's classes and locations).

**Scope:** create `ops/durability/RESTORE.md`, written for the household in
plain language (no repo jargon): what each owned-data class is, where its
copies live (mirroring `manifest.json`), and step-by-step restore per class —
`.benc` snapshot: open the hosted budget app and load the file with the
household password, or run `budget-etl dump`; where the password lives is a
pointer to the key-continuity practice (`strategy-secure-identity-root` owns
it) and the secret itself is NEVER written in this file; bank statements:
plain files, copy back; sidecar state: plain JSON inside the media folder,
re-pick the folder in the print/audio app; repositories: `git clone` from
GitHub. End with a short "Rehearsal" section scripting the office-hours
rehearsal (`tactic-durability-restore-rehearsal`): run the audit, restore one
snapshot on a non-dev machine or profile, household read-through. Note in the
document that the owner copies it to the archive root so the guide travels
with the archive.

This is household/practitioner operational reference, not in-scope marketing
copy (`strategy-author-approved-copy`'s gate does not apply); the author
reviews the wording at the rehearsal itself.

## Reuse

- BENC header constants: `packages/crypto-core/src/crypto-core.ts:8-12`
  (`MAGIC`, `SALT_LEN`, `IV_LEN`, `HEADER_LEN`) — duplicate only the 4 magic
  bytes in the script with a comment citing the source (ops/ is not a
  workspace package; do not add a package dependency for 4 bytes).
- Decrypt path for `--decrypt-verify`: budget-etl `dump`
  (`projects/budget-etl/dump.go:17`).
- Report style: plain markdown to stdout; no reporting framework.

## Verification

```verify
set -e
TMP=$(mktemp -d)
mkdir -p "$TMP/a" "$TMP/b"
printf 'BENCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' > "$TMP/a/s.benc"
cp "$TMP/a/s.benc" "$TMP/b/s.benc"
printf '[{"id":"benc","description":"t","min_copies":2,"verify":"benc-magic","copies":[{"path":"%s","off_machine":false},{"path":"%s","off_machine":true}]}]' "$TMP/a" "$TMP/b" > "$TMP/pass.json"
node --import tsx/esm ops/durability/audit.ts --manifest "$TMP/pass.json"
printf '[{"id":"benc","description":"t","min_copies":2,"verify":"benc-magic","copies":[{"path":"%s","off_machine":false}]}]' "$TMP/a" > "$TMP/fail.json"
if node --import tsx/esm ops/durability/audit.ts --manifest "$TMP/fail.json"; then echo "expected single-copy FAIL to exit nonzero"; exit 1; fi
rm -rf "$TMP"
```

Manual: the owner runs
`node --import tsx/esm ops/durability/audit.ts --manifest ops/durability/manifest.json`
against the real archive at the rehearsal (`/mnt/g` may need
`sudo systemctl restart mount-gdrive` if the Drive mount is stale); RESTORE.md
readability is judged by the household read-through — both are
`tactic-durability-restore-rehearsal` steps, not CI checks.
