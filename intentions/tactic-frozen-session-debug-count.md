---
id: tactic-frozen-session-debug-count
kind: tactic
statement: Minimal operator-visible count of node-worker sessions held-for-debug
  (non-transitioned, non-parked terminal exits kept alive by the narrowed
  auto-close default) so frozen-node accumulation is visible
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-19 /align-strategy interview (reap-scope-narrowing
  clarification, resolution (c)). The narrowed auto-close default keeps every
  non-transitioned, non-parked terminal exit alive for local debugging, which —
  by design — freezes the node (worktree_has_live_session stays TRUE) until
  manual reap. The author chose 'yes — minimal count' over 'no new surface' so
  silent accumulation of frozen nodes does not go invisible. /align-tactics
  2026-07-22: finalized into a 2-unit plan — a new
  claude_agents_count_held_for_debug library function (mirroring
  claude_agents_count_busy_workers's count shape and
  claude_sessions_with_name_all's --all-direct query, since the reap-narrowing
  self-close mechanism does not exist yet so this deliberately reads a stable 0
  in the interim — see blocked_by) and a dispatch-sweep summary log line
  consuming it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: review
execution:
  branch: tactic-frozen-session-debug-count
  pr: 3000
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by:
  - tactic-graph-node-session-reap
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Minimal operator-visible count of node-worker sessions held-for-debug (non-transitioned, non-parked terminal exits kept alive by the narrowed auto-close default) so frozen-node accumulation is visible

Finalized 2026-07-22 by `/align-tactics` into a 2-unit plan. Draft context
from the 2026-07-19 `/align-strategy` interview (reap-scope-narrowing
clarification on `strategy-graph-native-dispatch`, resolution (c)) is retained
below under Context/Related nodes; the Decision/Units/Reuse/Verification
sections that follow are the finalized plan a fresh session executes.

## Context

The reap-scope-narrowing clarification keeps every non-transitioned,
non-parked terminal node-worker exit (hard crash, error, silent no-progress
exit) alive for local debugging until an operator manually reaps it. By design
that freezes the node: the kept session keeps `worktree_has_live_session`
TRUE, so the router will not re-select the node and the no-progress fuse will
not count re-selections. These failures are deliberately NOT parked to
office-hours, so they never appear on the office-hours PARKED panel — there is
no dashboard signal that they exist. Without any surface, frozen nodes could
accumulate invisibly (the author chose "yes — minimal count" over "no new
surface" for exactly this reason).

This tactic adds the single missing surface: a minimal, operator-visible COUNT
of held-for-debug sessions. It is a GC/hygiene metric only — it reports "N
nodes are frozen for debug" (and at most the node ids), never session content.
It must not re-couple observability to session persistence: real escalations
still park to office-hours and surface via PARKED; recovery still never
resumes from a kept session (session attach/resume is not a supported
recovery path). This count only makes accumulation non-silent.

## Decision: concrete surface

**Greenfield-ideal (chosen — no phasing needed):** one new library function
owning the "held-for-debug" predicate and count, surfaced passively as a
machine-wide summary line in `dispatch-sweep`'s existing log output.

Weighed against the design intent's four candidate surfaces:

- **A `dispatch-sweep` summary line — CHOSEN.** `dispatch-sweep` already runs
  on the existing worker-Stop cadence, already sources `lib-claude-agents.sh`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-sweep:40`), already
  loops machine-wide, and already emits operational lines to the log operators
  consult when reasoning about reap state. It has no machine-wide total-count
  summary today. This surfaces the count passively on an existing cadence —
  the operator sees it climb without asking, which is what "accumulation is
  visible" wants. Smallest diff: one function + one `log()` call before the
  script's final `exit 0`.
- **A standalone CLI script — deferred, not in scope.** On-demand-only
  surfacing is strictly weaker for *accumulation* visibility (the operator
  must remember to run it) and would add a new script plus its own test
  harness for no marginal visibility over the sweep line. Because the chosen
  function is a reusable primitive, a thin CLI wrapper stays trivial to add
  later if an on-demand query is ever wanted.
- **The office-hours dashboard (`ChainHealth`) — rejected for this tactic.**
  `ChainHealth`/`chainHealth`
  (`office-hours-snapshot/src/snapshot.ts`, `office-hours-snapshot/src/produce.ts`
  `defaultProbeChainHealth()`) is produced and persisted into the encrypted
  snapshot but rendered by **no** UI component anywhere in the repo — it is not
  actually operator-visible today. Wiring it to a human view is net-new UI
  work, materially larger than a log line, and over-couples a hygiene metric to
  the escalation dashboard (which the design intent explicitly warns against).
- **A combination — unnecessary.** The single function + sweep line is
  sufficient and minimal.

No brownfield migration path is required (`.claude/rules/design-proposals.md`):
there is no existing surface to migrate *from*, and the design is additive
(one new log line, one new library function).

## Held-for-debug predicate

- **Query shape:** `"${CLAUDE_AGENTS_CMD:-claude}" agents --json --all`,
  queried DIRECTLY — not via `_claude_agents_raw`/`DISPATCH_AGENTS_SNAPSHOT` —
  because that snapshot is captured without `--all` and lacks terminal-state
  rows. Mirror `claude_sessions_with_name_all`
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:308-346`):
  `2>/dev/null`, non-zero exit → return 1 (UNKNOWN), zero exit with
  empty/whitespace output → return 1, single JSON-array-guarded `jq` pass.
- **Name-match regex:** `test("^[0-9]+-|^tactic-|^strategy-")` — identical to
  `claude_agents_count_busy_workers`
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:582`),
  matching the worker keyspaces (`<N>-<slug>` issue workers,
  `tactic-`/`strategy-` node workers) and excluding routers
  (`dispatch-<short-id>`). Type-guard the name
  (`.name | type == "string" and test(...)`) so a null name never aborts the
  pass.
- **Status exclusion:** `select(.status != "busy" and .status != "idle")` —
  the complement of the two confirmed LIVE statuses anywhere in this
  codebase's conventions. Do **not** hardcode a `done`/`error`/`crashed`/
  `stopped`/`killed`/`failed` enum — no fixture or doc in this repo commits to
  an exhaustive terminal-status enumeration, and "not busy, not idle" is total
  and forward-compatible. An `idle` live worker is alive and could resume, so
  it is correctly excluded from held-for-debug.
- **Return:** count via `... | length`. Return-code contract identical to
  `claude_agents_count_busy_workers`: return 0 with the count (possibly 0) on
  stdout; return 1 = UNKNOWN (daemon unqueryable) — the caller MUST NOT treat
  UNKNOWN as 0.

## Units of work

### Unit 1 — `claude_agents_count_held_for_debug` library function + tests

**Scope:**
- Add a new function `claude_agents_count_held_for_debug()` to
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`, inside the
  existing `if [[ -z "${_LIB_CLAUDE_AGENTS_LOADED:-}" ]]; then ... fi`
  whole-file guard. Insertion point: immediately after
  `claude_agents_count_busy_workers()` (ends at line 590), its structural
  twin.
- Model the count/return-code shape on `claude_agents_count_busy_workers`
  (lines 562-590), but take the `--all`-direct query body from
  `claude_sessions_with_name_all` (lines 308-346, not `_claude_agents_raw`) —
  it must see terminal-state rows. One JSON-array-guarded `jq` pass applying
  the predicate above (`test("^[0-9]+-|^tactic-|^strategy-")` on `.name` AND
  `.status != "busy" and .status != "idle"`).
- Follow the file's doc-comment convention: one-line usage summary, the 0/1
  (UNKNOWN) return contract, `${CLAUDE_AGENTS_CMD:-claude}` as the queried
  command, `2>/dev/null` daemon-noise suppression, an explicit note that it
  queries `--all` directly and why, and that the predicate deliberately does
  not enumerate terminal statuses (see "Held-for-debug predicate" above).
- Add `claude_agents_count_held_for_debug` to the file's top-of-file usage
  list (lines 10-18).
- Add unit tests to
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` (the
  single monolithic test file — no filter/subset mechanism exists). Build a
  new terminal-status fixture modeled on the argv-branching-on-`--all` SHAPE
  of `office_hours_state_fake_claude` (lines 3809-3839 — branches on whether
  `--all` is in argv before revealing non-live rows), adapted to key on
  `.status`/`.name` (matching the real `.[] | select(.name==...) | .status`
  shape this function reads — NOT the `.state`-keyed office-hours shape). Cover
  at minimum:
  1. Mixed set — a `busy` worker + an `idle` worker + a terminal worker (e.g.
     `status:"done"` or `status:"error"`) + a `dispatch-*` router with a
     terminal status → count is exactly the number of terminal *worker* rows;
     routers and busy/idle rows excluded.
  2. All-live set → count 0.
  3. Empty array `[]` → count 0, return 0.
  4. Daemon-unqueryable (fake `claude` exits non-zero) → return 1 (UNKNOWN);
     assert the non-zero rc, never a `0` count.
  5. `--all` faithfulness — the fixture reveals terminal rows only when
     `--all` is in argv, and the function is asserted to pass `--all` (guards
     against a regression to a snapshot/no-`--all` query).

**Out of scope:** consumer wiring (Unit 2); a node-ids projection variant; any
change to `claude_agents_count_busy_workers` or the snapshot path.

**Recommended model:** sonnet. Well-specified, mechanical: the function is a
near-mechanical composition of two existing templates with the predicate
fully pinned above, and the test-fixture shape to imitate is named to the
line. No design decisions are left for implementation time.

**Dependencies:** none.

### Unit 2 — Wire the machine-wide summary line into `dispatch-sweep` + test

**Scope:**
- In `.claude/skills/dispatch-propagate/scripts/dispatch-sweep`, emit one
  machine-wide summary line via the existing `log()` helper (lines 59-62).
  Insertion point: near the end, alongside/after the "GC vanished markers"
  block and before the script's final `exit 0`. `lib-claude-agents.sh` is
  already sourced (line 40).
- Call `claude_agents_count_held_for_debug`; honor the UNKNOWN contract: on
  return 0 log `HELD_FOR_DEBUG_COUNT: n=<count>`; on return 1 log
  `HELD_FOR_DEBUG_COUNT: n=UNKNOWN (daemon unqueryable)` — never log `0` for
  UNKNOWN. Follow `dispatch-sweep`'s `set -uo pipefail` / non-`set -e`
  convention (line 32): guard the call's rc so a non-zero return under
  `pipefail` never aborts the sweep.
- Add a `dispatch-sweep` integration test to `test-dispatch-scripts.sh`
  reusing the Unit 1 fixture: run the sweep with the fake `claude` and the
  existing `DISPATCH_SWEEP_LOG_FILE`/worktree-root test seams (lines 51-56),
  then assert the log contains the expected `HELD_FOR_DEBUG_COUNT:` line for
  (a) a nonzero terminal count and (b) the UNKNOWN case.

**Out of scope:** changing the sweep's reap/GC logic; adding a CLI script;
any office-hours/`ChainHealth` change.

**Recommended model:** sonnet. Rote wiring — one library call plus one
`log()` line in an existing script, plus a fixture-reusing integration test
with explicit assertions.

**Dependencies:** depends on Unit 1 (the function must exist). Land Unit 1
first.

## Reuse

- `claude_agents_count_busy_workers` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:562-590`
  (count/return-code template + name regex).
- `claude_sessions_with_name_all` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:308-346`
  (the `--all`-direct query body + UNKNOWN guards, bypassing the snapshot).
- `log()` helper and test seams (`DISPATCH_SWEEP_LOG_FILE`, worktree-root
  overrides) — `.claude/skills/dispatch-propagate/scripts/dispatch-sweep:51-62`.
- `office_hours_state_fake_claude` argv-branch-on-`--all` fixture shape —
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:3809-3839`
  (imitate the shape; adapt keys to `.status`/`.name`).

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Not machine-checkable in CI (confirm at review):

- **Interim value is 0, by design, not by bug.** The narrowed auto-close
  default this count depends on is not implemented anywhere yet:
  `dispatch-self-close`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-self-close:81-123`)
  `exec`s an unconditional `claude rm "$JOB_ID"` for any non-router session,
  and `tactic-graph-node-session-reap` (PR #2922, open) currently plans the
  unconditional reap-on-every-terminal-exit version, with the skip-reap
  narrowing recorded as future re-plan work on that *other* tactic (see
  `blocked_by`, below, and "Related nodes"). Once #2922 merges as currently
  planned, every terminal node-worker session (clean or crashed) is `rm`'d
  immediately and `--all` shows nothing lingering — this function reads a
  real, stable **0** in steady state until the narrowing lands elsewhere.
  Manually confirm against the live daemon that a fresh `dispatch-sweep` run
  logs `HELD_FOR_DEBUG_COUNT: n=0` (or `n=UNKNOWN` if the daemon is down).
  This is a documented, accepted interim state — re-planning
  `tactic-graph-node-session-reap` to add the narrowing is explicitly out of
  scope for this tactic.
- **UNKNOWN is not 0.** Confirm by review that the sweep line logs `UNKNOWN`
  (not `0`) on a non-zero rc from the function, and that the
  daemon-unqueryable unit test asserts the non-zero return code rather than a
  `0` count.

## Graph frontmatter notes

- `blocked_by: [tactic-graph-node-session-reap]` is set: the count is only
  ever able to report non-zero once that tactic's Stop-hook self-close
  mechanism exists at all (today `.claude/hooks/dispatch-stop.sh`'s node-lane
  branch never calls `dispatch-self-close`). Even after that blocker clears,
  this count reads 0 until the narrowing itself (a separate, not-yet-planned
  follow-up on that other tactic) lands — a documented interim limitation, not
  a defect of this plan.
- `validates: []` (no signal-validating edge): this tactic is off-path
  hygiene/observability tooling — a GC/hygiene metric, not a recovery
  substrate or escalation channel. It observes a side-effect of the
  reap-narrowing (frozen-node accumulation) rather than producing
  `strategy-graph-native-dispatch`'s own success-signal reading, so it carries
  no `validates` edge.

## Related nodes

- `tactic-graph-node-session-reap` — adds the node-lane reap in the first
  place; its Unit 2 (sweep-reap of mid-phase-dead orphaned jobs) reverses under
  the narrowed default and must be re-planned — that re-plan is a separate
  session's work, out of scope here. This count and that re-plan were
  surfaced together (the "held-for-debug" predicate is the complement of
  "reaped"), which is why this tactic is `blocked_by` it.
- `tactic-worker-self-close-configurable` — the default-off keep-ALL toggle,
  which layers on top of the narrowed default; its draft framing must be
  re-scoped to the narrowed default (unrelated to this tactic's own units,
  noted here only for context continuity).

## needs-main residue

- **id 10** — Interim value: the count reads a stable 0 on the real fleet
  until the narrowed auto-close mechanism exists.
  - URL path: current
  - Expected outcome: The operator sees `n=0` consistently in `dispatch-sweep`'s
    log, which is the documented correct interim reading; the metric becomes
    informative only once the blocker tactic lands.
  - Finding: the PR description and this node body both document that
    `HELD_FOR_DEBUG_COUNT` reads a real, stable `n=0` in production until
    `tactic-graph-node-session-reap`'s narrowed auto-close mechanism exists at
    all (that tactic is a `blocked_by` dependency here). The informative
    (nonzero) reading is verifiable only downstream of that tactic landing,
    not at this PR's merge — a planned deferral, not a defect. Verify against
    deployed main/prod once that blocker clears.
