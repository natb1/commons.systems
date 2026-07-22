---
id: tactic-graph-main-self-heal
kind: tactic
statement: "graph-native red-main self-heal: main-health sensor, auto-created
  high-rank fix tactic, diagnose-main rewritten graph-native, legacy issue-latch
  cleanup"
owner: ai
status: codified
parent: null
rationale: "Finalized by a 2026-07-18 /align-tactics per-node pass. Retained
  from the 2026-07-12 red-main episode and refined across two 2026-07-13 author
  interviews (strategy-graph-native-dispatch.md:1330-1373): the legacy
  dispatch-diagnose-main flow re-enabled the repo's disabled has_issues feature
  to file its dispatch:main-broken latch issue, regressing the drain ratchet.
  This tactic replaces the gh-issue latch with a graph-native one: main-health
  is a registered sensor (SensorRegistry, local-first per read-sensors.ts's
  own-pipeline-CI doctrine) reading origin/main HEAD's check conclusions; on a
  red read, dispatch-diagnose-main (rewritten to write a graph node, never a gh
  issue) find-or-creates the fix tactic (tactic-main-red-<shortsha> shape, one
  open node per episode, redacted diagnosis in the body); the fix tactic
  serves+validates strategy-main-health (the persistent signal owner, created
  2026-07-13 per the persistent-layer doctrine,
  tactic-align-persistent-layer-doctrine) and inherits its standing boost 100
  undecayed through the normal downward attention flow; boost dominance is
  maintained by a new validateGraph rule (write-path guard), never by ranking
  logic. Reconciled coordination note: tactic-dispatch-legacy-rewire (PR #2869)
  merged and already extracted the CI probe itself into repo-health
  --main-broken-sha as a label-free two-source aggregation (check-runs +
  workflow runs) -- this tactic replaces the remaining gh-issue-based
  ANNOUNCEMENT/latch surface that PR left in place (dispatch-select-tick Step
  1c's OPEN_MB, dispatch-diagnose-main's issue filing), superseding that
  implementer latitude per the strategy's 2026-07-12 clarification (steelman --
  a gh-issue notification mirror -- considered and diverged from: re-enabling
  issues re-imports the dependency this strategy recovers). The graph latch and
  the legacy-reader rewire land in one PR so the auto-merge gate is never left
  ungated mid-transition (sequencing hazard: dispatch-select-tick's OPEN_MB
  currently gates BOTH the recovery-detection latch AND auto-merge itself)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-graph-main-self-heal
  pr: 2919
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# graph-native red-main self-heal: main-health sensor, auto-created high-rank fix tactic, diagnose-main rewritten graph-native, legacy issue-latch cleanup

Finalized by a 2026-07-18 `/align-tactics tactic-graph-main-self-heal` per-node
pass. One PR, five units, landing atomically (the graph latch and the
legacy-reader rewire must land together — the legacy `OPEN_MB` gate currently
guards both recovery-detection AND auto-merge, so replacing only one side
mid-transition would leave a window where auto-merge runs ungated).

## Context

The 2026-07-12 red-main episode: the legacy `dispatch-diagnose-main` skill's
find-or-create-issue mandate led its job to re-enable the repo's disabled
`has_issues` feature via an ad-hoc PATCH so `gh issue create` would succeed —
regressing the drain-state-monotonicity condition (no new work enters via gh;
see `strategy-graph-native-dispatch.md`'s 2026-07-12 clarification). The
author's decided shape (two 2026-07-13 interviews, same strategy doc,
lines 1330-1373): main health becomes a **sensor**, flowing through the
general sensor/signal machinery instead of a bespoke gh-issue latch — no gh
issue, no label, no re-enabled repo features.

`tactic-dispatch-legacy-rewire` (PR #2869, merged) already did **half** of
this: it extracted the CI probe itself out of the legacy selector into
`repo-health --main-broken-sha` (a label-free, two-source aggregation —
check-runs + workflow runs — `.claude/skills/dispatch-propagate/scripts/repo-health:170-192`).
What's left, and what this tactic builds:

1. A registered `main-health` sensor so the signal is machine-readable graph
   state (`strategy-main-health`'s `reading`/`gap`), not just a bash variable.
2. The auto-create/auto-complete automation: on red, mint a fix tactic; on
   green, complete it.
3. A write-path guard keeping `strategy-main-health`'s standing boost 100
   dominant.
4. `dispatch-diagnose-main` rewritten to write the graph node instead of a gh
   issue.
5. Retiring the gh-issue announcement surface `dispatch-select-tick` Step 1c
   still reads (`OPEN_MB`), and the one-time cleanup (re-disable `has_issues`,
   close the 2026-07-12 issue) that step's sequencing hazard gates on this
   replacement landing first.

## Unit 1 — register the `main-health` sensor

**Recommended model:** sonnet (mechanical — mirrors the existing
`tokenEconomySensor` registration exactly; every string this unit must
produce is spelled out below).

**Scope:** `packages/intentionsutil/scripts/read-sensors.ts` only.

- Add a `mainHealthSensor: Sensor` object (near `tokenEconomySensor`,
  read-sensors.ts:96 area) whose `read()`:
  - Shells to `.claude/skills/dispatch-propagate/scripts/repo-health --main-broken-sha`
    via `execFileSync`, `cwd: repoRoot` (same `repoRoot` constant,
    read-sensors.ts:45-46) — but with its **own** exec-options block, not the
    shared no-network `execOpts` constant (read-sensors.ts:56-60), since this
    command calls `gh`.
  - `repo-health --main-broken-sha` prints origin/main HEAD's full SHA on
    stdout when a check has failed, and prints nothing when green
    (`repo-health:178-192`).
  - Empty stdout → return the literal string
    `"green: every check on the current origin/main HEAD concludes success (or neutral/skipped)"`
    — this must match `strategy-main-health`'s `success_signal.threshold`
    verbatim (case/whitespace-insensitive per `deriveGap`,
    `packages/intentionsutil/src/sensors.ts:98-112`, but otherwise identical)
    so `deriveGap` resolves `gap: null` on green.
  - Non-empty stdout (a 40-char sha) → return
    `` `red: ${sha} has one or more failing checks` `` (never redacted content —
    just the sha and a fixed phrase, no log lines).
  - A `repo-health` invocation failure (non-zero exit, e.g. a `gh` error that
    exhausted `gh_retry`) must NOT throw — the total-sensor contract
    (read-sensors.ts:52-55). Catch and return `"unknown"` (never equals the
    threshold, so `gap` stays non-null — fails safe, never a false green).
- Register it: `registry.register(mainHealthSensor);` alongside the existing
  `registry.register(tokenEconomySensor);` (read-sensors.ts:660-664).
- Update the file's header doc comment (read-sensors.ts:9-10, 21-24), which
  currently reads as "no gh API, no analytics, no network" for this driver:
  add a sentence noting that own-pipeline CI/check-run status is explicitly
  classed local-first despite calling `gh`, per the
  `strategy-graph-native-dispatch` 2026-07-13 doctrine — distinct from the
  deliberately-excluded external/analytics sensors — so this addition doesn't
  read as contradicting the driver's own stated contract.

**Dependencies:** none.

## Unit 2 — rewrite `dispatch-diagnose-main` to write the graph node

**Recommended model:** opus (judgment-heavy: swaps an existing multi-step
skill's entire persistence backend and idempotency logic while preserving its
diagnosis/redaction steps — a shallow find/replace on the gh commands would
miss the idempotency and redaction-shape requirements below).

**Scope:** `.claude/skills/dispatch-diagnose-main/SKILL.md` only.

- Keep Steps 1 ("Enumerate failing checks") and 2 ("Fetch evidence")
  unchanged — this is how the "likely cause" prose gets synthesized from the
  actual CI output. Keep the redaction rule verbatim (current lines 46-62: no
  raw log lines, no secrets, no CI internals beyond the failing
  check/step name and a high-level error category; neutralize any `#N` next
  to a closing keyword per `.claude/rules/issue-references.md`).
- Replace Step 3 ("File the diagnosis as a dispatch:main-broken issue",
  current lines 44-108) entirely with a graph-write step:
  - Compute `shortsha = $(git rev-parse --short=8 <red-sha>)` — 8 hex chars
    (matches GitHub's own UI convention; no prior "shortsha" convention exists
    elsewhere in this codebase to match instead, so this session picks 8 for
    a little extra collision margin over git's 7-char default).
  - Node id: `tactic-main-red-<shortsha>`.
  - **Find-or-create, idempotent per episode:** check whether
    `intentions/tactic-main-red-<shortsha>.md` already exists via a
    `node --import tsx/esm -e '...'` one-liner importing `listNodes`/`readNode`
    from `store.js` — mirror the enumerate idiom in
    `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:44-54`.
    - **Absent** (first detection for this sha): construct the full node JSON
      and land it via `write-node.ts --file` + `graph-commit` (no `--base` —
      brand-new node, nothing for `dump-node.ts` to dump):
      - `kind: "tactic"`, `owner: "ai"`, `status: "raw"`, `phase: null`,
        `execution: null` (draft shape — this node is diagnosis only, no plan;
        a later `/align-tactics tactic-main-red-<shortsha>` finalizes it into
        an actual fix plan, same as any other draft tactic).
      - `serves: ["strategy-main-health"]`, `validates: ["strategy-main-health"]`.
      - `success_signal: {observable: "origin/main HEAD check-run conclusions at <sha>", sensor: "main-health", threshold: "green: every check on the current origin/main HEAD concludes success (or neutral/skipped)", is_proxy: false}`
        (the literal threshold string, matching Unit 1's sensor exactly — the
        same sensor that detected the episode validates the fix).
      - `pace_exempt: true`.
      - `attention: null` (rank is purely inherited via the `serves` edge — no
        machine-authored boost; strategy clarification: "no machine-authored
        boosts remain in the model").
      - `statement`: e.g. `"origin/main red at <shortsha>: <top failing check name(s)>"`.
      - `rationale`: `"Auto-created by dispatch-diagnose-main on a failing main-health sensor read."`
      - Body: the redacted diagnosis prose from Steps 1-2 (check/step names,
        high-level error category, likely cause).
    - **Present and still open** (`phase` not `"done"`, `office_hours` null):
      a re-detection during the same episode. Re-run Steps 1-2; overwrite the
      body ONLY if the freshly-redacted diagnosis text differs from the
      on-disk body (avoid a no-op commit on every re-detection tick). Use
      `dump-node.ts` + `graph-commit --base` for this edit path (a
      pre-existing node), per this skill's own Step-5 "capture a base
      manifest" mechanic.
    - **Present and done/parked:** a stale sha match from a since-resolved
      episode reusing the same short prefix — vanishingly unlikely at 8 hex
      chars, but if hit, treat as absent (mint a new node) rather than
      touching a closed node.
  - Drop entirely: `gh issue list/create/edit --label dispatch:main-broken`
    (current lines 71, 78, 86-88), the `gh label create dispatch:main-broken`
    bootstrap (current lines 90-98), and the closing-note prose (current lines
    104-108) about `dispatch-select-tick` closing the issue — replace with a
    note that `dispatch-select-tick`'s graph-lane check (Unit 3) completes the
    tactic on green.
  - No code path in the rewritten skill may call any `has_issues`-flipping
    command — removing the gh-issue write path removes the failure mode that
    led the prior job to improvise the runtime PATCH.

**Dependencies:** none (parallel to Unit 1 — this unit computes red/green
itself via `repo-health` directly, same as its current Step 1, independent of
the sensor registration).

## Unit 3 — rewire `dispatch-select-tick`'s latch off the gh issue

**Recommended model:** opus (this script gates production auto-merge and lock
release; ordering and fail-safe semantics must be preserved exactly under a
different backing store — high blast-radius).

**Scope:** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`
only.

- **Step 1c** (current lines ~387-420): replace
  `OPEN_MB=$(gh_issue_list_rest --label "dispatch:main-broken" --state open | jq -r '.[].number')`
  with a graph read producing an equivalent variable `OPEN_MAIN_RED`
  (newline-separated list of open `tactic-main-red-*` node ids, or the literal
  string `UNKNOWN` on a read failure — mirror the existing fail-safe-to-UNKNOWN
  shape at current lines 397-399): a `node --import tsx/esm -e '...'`
  one-liner over `listNodes` filtering `id` prefix `tactic-main-red-`,
  `phase !== "done"`, `office_hours === null`.
- Replace the close-on-green branch (current lines 411-420,
  `gh_issue_close_rest`): when `repo-health --main-broken-sha` returns empty
  (green) and `OPEN_MAIN_RED` lists node ids, write `phase: "done"` directly to
  each listed node (`write-node.ts` + `graph-commit --base`) **only when that
  node's `execution` is still `null`** — no build has started on it yet. A
  node already past draft with a live `execution` (an in-flight fix with its
  own PR) is left alone; its own PR/qa/review lifecycle completes it normally,
  so this mechanical completion never preempts real in-progress work.
- Rename every use of `OPEN_MB` to `OPEN_MAIN_RED` in: the at-cap bypass
  emission gate (current line 627), the normal-path emission gate (current
  lines 816-821), and the auto-merge gate (current line 437,
  `if [[ -z "$OPEN_MB" ]]; then dispatch-auto-merge; fi`) — preserving the
  exact empty/non-empty/`UNKNOWN` semantics (a failed graph read must suppress
  auto-merge exactly as a failed `gh` call does today — fail-safe, never
  fail-open).
- Update every comment referencing "the gh-labeled dispatch:main-broken issue"
  or "diagnose-main has filed it" (current lines 405-408, 624, 808-815) to
  describe the graph node instead.

**Dependencies:** Unit 2 (this unit's reader needs `tactic-main-red-*` nodes to
exist before it has anything to read) — same PR, sequenced within it.

## Unit 4 — boost-dominance write-path guard

**Recommended model:** opus (a new cross-node validation rule with a
deliberately narrow, documented escape hatch — getting the comparison
direction or the self-edit exemption wrong silently defeats the guard).

**Scope:** `packages/intentionsutil/src/schema.ts` only (the `validateGraph`
function and its docstring rule list).

- Add rule 17 (after the existing 16, `schema.ts:597-626` docstring, enforced
  in the function body): for every node **other than** `strategy-main-health`,
  if `attention.boost !== null && attention.boost >= <strategy-main-health's live boost>`
  or `attention.override !== null && attention.override >= <that value>`, this
  is a validation error — **unless** that node's `attention.rationale`
  contains the literal substring `"ACK: main-health-dominance"` (the explicit
  author-override marker; free-text, mirroring this codebase's existing
  convention of embedding directives/provenance sentences directly in
  rationale/clarification prose rather than adding a new schema field).
- Read `strategy-main-health`'s **current** `attention.boost`/`override` from
  the same node list `validateGraph` already receives — never hardcode `100`
  — so the guard tracks whatever the strategy's own attention is currently
  authored as. Editing `strategy-main-health`'s own `attention` is never
  blocked by this rule (only *other* nodes attempting to match or exceed it
  are) — a node freely editing its own field needs no escape hatch.
- `strategy-main-health` is deliberately a hardcoded protected id here, not a
  generic new field: the strategy's own clarification frames this as "a
  main-specific instance of the general signal-ranking rule," not a general
  mechanism (`strategy-graph-native-dispatch.md:1356-1360`).
- No change needed to `graph-commit` or `write-node.ts`: `validate-graph.ts`
  already runs as one of the four required checks on every push
  (`.github/workflows/graph-fast-path.yml:52`), so rule 17 is enforced
  automatically pre-merge with no extra wiring.

**Dependencies:** none.

## Unit 5 — one-time legacy-latch cleanup (manual, post-merge)

**Recommended model:** sonnet (two mechanical `gh` commands, no code change).

Run once, after Units 1-4 are confirmed merged and live on `origin/main` (this
unit is the sequencing hazard's resolution — the legacy reader must already be
replaced before removing what it reads):

- `gh api -X PATCH repos/{owner}/{repo} -F has_issues=false` — re-disable the
  repo feature the 2026-07-12 episode's ad-hoc PATCH left enabled.
- Find and close the still-open 2026-07-12 latch issue:
  `gh issue list --label dispatch:main-broken --state open --json number -q '.[0].number'`,
  then `gh issue close <n> --comment "Superseded by the graph-native main-health latch (tactic-graph-main-self-heal); origin/main is green."`

**Dependencies:** Units 2 and 3 merged and live.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/repo-health --main-broken-sha`
  (two-source CI aggregation, already label-free) — Units 1, 2, 3 all consume
  this instead of re-deriving CI status.
- `packages/intentionsutil/scripts/write-node.ts`,
  `packages/intentionsutil/scripts/graph-commit`,
  `packages/intentionsutil/scripts/dump-node.ts` — the standard graph write
  path, Units 2 and 3.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:44-54` —
  the `node --import tsx/esm -e '...'` enumerate-via-`listNodes` idiom, reused
  by Units 2 and 3 for reading open `tactic-main-red-*` nodes.
- `packages/intentionsutil/src/sensors.ts`'s `SensorRegistry`/`deriveGap` —
  Unit 1 registers against this; no changes needed to `sensors.ts` itself.
- `.claude/skills/dispatch-propagate/scripts/lib.sh`'s `gh_retry` — already
  wraps every `gh` call `repo-health` makes; no new retry logic needed.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual / observed:

- Point `repo-health --main-broken-sha` at a simulated red SHA (or stub `gh`
  in a scratch clone) and confirm the `main-health` sensor's `read()` returns
  the exact red string, and that running `read-sensors.ts` updates
  `strategy-main-health`'s `reading`/`gap` correctly (`gap` non-null while red,
  `null` once the exact green string is read).
- Manually drive the rewritten `dispatch-diagnose-main` steps against a known
  or simulated red sha and confirm it mints `tactic-main-red-<shortsha>.md`
  with a redacted body (no raw log lines, no secrets) and the frontmatter
  shape in Unit 2 (`serves`/`validates` `strategy-main-health`, `pace_exempt: true`,
  `phase: null`). Re-run it against the same sha and confirm no duplicate node
  and no no-op commit when the diagnosis text is unchanged.
- Run `dispatch-select-tick` against the freshly-minted node (or a scratch
  fixture) and confirm auto-merge is suppressed while `OPEN_MAIN_RED` is
  non-empty, and that the node transitions to `phase: done` once
  `repo-health --main-broken-sha` reports green and the node's `execution` is
  still `null`.
- Author a scratch node with `attention: {boost: 100, override: null, rationale: "test"}`
  and run `validate-graph.ts` — expect a rule-17 failure naming
  `strategy-main-health`. Add `"ACK: main-health-dominance"` to its rationale
  and re-run — expect it to pass. Confirm an edit to `strategy-main-health`'s
  own `attention.boost` is never blocked by this rule.
- Unit 5, observe in production: after merge, confirm
  `gh api repos/{owner}/{repo}` reports `has_issues: false` and the
  2026-07-12 latch issue is closed.

## Coordination (resolved)

`tactic-dispatch-legacy-rewire` (PR #2869) is merged — its Unit 1 already
extracted the CI probe into `repo-health --main-broken-sha`. This tactic
replaces the remaining piece that PR's implementer latitude left in place (the
gh-issue announcement/latch surface), per the strategy's 2026-07-12
clarification superseding that latitude. No live-node reconciliation is
needed; the prior "fold into Unit 1 or block on it" coordination note is
stale now that Unit 1 has already landed and closed.

The current red episode that motivated this round is tracked separately by
`tactic-graph-fastpath-guard-diff-base` (phase: qa, its own office-hours park)
— unrelated file surface (a GitHub Actions guard job), no overlap with this
tactic's scope.

## needs-main residue

Filed by `/qa-fix` (PR #2919) — two acceptance-criteria items the node body
itself flags as "manual/observed, deferred to qa/main-qa"; neither is
script-verifiable in a read-only QA pass against the current repo state, so
both are deferred here for post-merge verification.

### 1. Rule-18 boost-dominance guard fires, respects the ACK escape, never blocks strategy-main-health's own attention

- id: 9
- URL path: current
- Expected outcome: Guard errors on a dominating scratch node, passes once the
  ACK substring is present, and never blocks edits to strategy-main-health
  itself, with the threshold read live from the graph.
- Finding: requires authoring/mutating scratch graph nodes to exercise
  validateGraph rule 18's boost/override/ACK-escape branches directly — a
  write-path exercise out of scope for a read-only QA pass. Partial
  confirmation already obtained script-verifiably during QA: `validate-graph`
  passes cleanly against the real 408-node graph with rule 18 active,
  confirming the guard is correctly inert against every existing node (no
  false positives on real data).

### 2. Red-main end-to-end: sensor read → diagnose-main node minting → select-tick suppression → green auto-completion

- id: 10
- URL path: current
- Expected outcome: the full red→suppress→green→complete lifecycle behaves as
  designed end-to-end, with drain-state monotonicity preserved (no gh issue,
  no label, no re-enabled repo feature at any step).
- Finding: requires simulating a genuinely red origin/main and a full
  dispatch-tick run to exercise the complete lifecycle end-to-end; not safely
  script-verifiable in a QA pass (main is currently genuinely red for an
  unrelated, already-tracked reason — `tactic-graph-fastpath-guard-diff-base`
  — which is not this tactic's episode to simulate against). Each individual
  mechanism was independently confirmed piecewise during QA: the
  `main-health` sensor's read matches real `repo-health` output (including
  the current real red state), `dispatch-graph-main-red-sync` runs cleanly
  against the real graph and exits 0, and the `OPEN_MAIN_RED` gating wiring in
  `dispatch-select-tick` is fully renamed off `OPEN_MB` with no leftover
  gh-issue latch.
