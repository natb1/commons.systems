---
id: tactic-office-hours-drain-claim
kind: tactic
statement: Every office-hours drain joins the node-id reservation ledger
  regardless of launch path — subagent fan-out and interactive drains included —
  so a drain cannot race the fleet or a second drain
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-25 concurrency/serialization review on
  strategy-graph-native-dispatch. tactic-office-hours-concurrency-dedup closes
  the duplicate-launch window only for sessions launched through
  office-hours-graph, whose occupancy check keys on the session name
  office-hours-<node-id>. A drain launched any other way writes no reservation
  marker and registers no matching session name, so it is invisible to both
  halves of the claimed set and races the dispatch fleet. Finalized 2026-07-25
  (/align-tactics tactic-office-hours-drain-claim, per-node finalize): the claim
  step lands in the office-hours SKILL.md itself (the one funnel all three
  launch paths execute), not in office-hours-graph alone. blocked_by
  tactic-office-hours-concurrency-dedup (PR #2945, open at plan time) because
  that tactic is concurrently rewriting the exact office-hours-graph
  control-flow blocks this tactic's Unit 3 also touches, and the bare-node-id
  session naming it ships is a precondition for Unit 3's
  worktree_has_live_session check to mean anything for this node kind; the plan
  below is written against that post-merge shape."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.02
  rationale: >-
    Bootstrap re-scale 2026-07-30: demoted from the pre-bootstrap 85-90 band to
    10. These are ordinary improvements, not integrity defects; at 85-90 they
    outranked strategy-main-health (101 resolved) and flooded the selector hot
    band. Interim scaffolding only; tactic-attention-tier-ranking and
    tactic-attention-boost-scripts retire this numeric scheme.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 10 to 0.02 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-office-hours-drain-claim
  pr: 3035
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T06:47:20Z
    mergeCommitSha: edddaad820a127429fdc520515d71bfeeb9d3717
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-office-hours-concurrency-dedup
office_hours:
  reason: "needs-main item 6 (two-concurrent-/office-hours-drain race) requires
    two live sessions racing the reservation ledger against a real parked node
    at the same instant; a single bounded Lane-M pass provides no mechanism to
    orchestrate that live scenario, and the source PR #3035's own Test plan
    already marks this specific check observational and non-auto-runnable"
  since: 2026-08-04
  recommendation: "Lane-M results already obtained, all passing: bash -n on
    lib-reservation-ledger.sh and office-hours-graph (syntax OK); grep of
    .claude/skills/office-hours/SKILL.md confirms the claim step references
    reservation_owner, reservation_write, and worktree_has_live_session, with
    reservation_clear appearing only in the deliberate never-issue warning prose
    (matches Unit 2's design); test-lib-reservation-ledger.sh 92/92 passed
    including the new reservation_owner assertions (Unit 1);
    test-office-hours.sh 42/42 passed. No author decision is needed —
    re-selection or a manual two-session drill would close this out: run
    /office-hours <node-id> in one session, then the same command against the
    same parked node in a second live session while the first is still running,
    and confirm the second halts at the claim step (reporting the collision,
    before surfacing park context) while tmp/dispatch-reservations/<node-id>'s
    session= line records only the first session's id throughout."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 10
---
# Every office-hours drain joins the node-id reservation ledger regardless of launch path — subagent fan-out and interactive drains included — so a drain cannot race the fleet or a second drain

Finalized 2026-07-25 (`/align-tactics tactic-office-hours-drain-claim`,
per-node finalize of a draft byproduct of the 2026-07-25
concurrency/serialization review on `strategy-graph-native-dispatch`). Explore
+ Plan (opus) fan-out ran this round; the plan below is this session's
transcription of that Plan output, reconciled against the current source.

## Context

An office-hours "drain" reviews a parked graph intention node (`office_hours`
non-null) and reaches a disposition the human then executes. Three launch
paths exist: (a) `packages/intentionsutil/scripts/office-hours-graph` spawns a
`--bg` session (post-#2945: named bare `$node_id`, cwd
`.claude/worktrees/$node_id`); (b) a human types `/office-hours <node-id>` in
an arbitrarily-named live session; (c) an Agent-tool subagent runs the skill
in-process with no daemon-registered session of its own.

None writes to the node-id reservation ledger
(`.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh`) that
`graph-select-target:405` (`if reservation_exists "$id"`) and
`dispatch-graph-scope-sweep:115` consult, and that `dispatch-select-tick:224`
writes as `reservation_write "$id" "$id" "${CLAUDE_CODE_SESSION_ID:-}"`
(node-id-keyed-marker precedent; the 2nd positional is just the node id
again). Because `office_hours !== null` already excludes a node from ordinary
phase selection (`packages/intentionsutil/src/router.ts:294,324,354`), the
only live race is drain-vs-drain (or drain vs. another autonomous
park-clearing actor) — realised 2026-07-25: while one session held an
unexecuted author grant for one resolution of
`tactic-graph-router-live-worker-visibility`, a concurrent actor landed the
opposite resolution and cleared the park first. The only race detector that
fired was a non-fast-forward push rejection — late by construction.

**Design answers (decided this round):**

1. **Where the claim is written:** in `.claude/skills/office-hours/SKILL.md`'s
   Graph-native mode, as a new step between "Read the node" and "Surface the
   park reason". SKILL.md is the single funnel all three paths execute; a
   bash-only fix in `office-hours-graph` covers only path (a). The claim is
   keyed by `$CLAUDE_CODE_SESSION_ID`, which is exported into every session's
   environment and inherited by subagent Bash calls (documented at
   `.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard:48`:
   "subagent `CLAUDE_CODE_SESSION_ID` equals the PARENT session id"), so path
   (c) claims under its live parent session id. `resolve_project_root`
   (`.claude/skills/dispatch-propagate/scripts/lib.sh:1803-1807`,
   `git rev-parse --path-format=absolute --git-common-dir`) resolves to the
   shared main-repo root regardless of which worktree cwd is inside, so the
   ledger is correctly shared with no explicit `cd` needed.
2. **Already claimed:** check both halves of the claimed set exactly as
   `graph-select-target:405-414` does — ledger marker *and* a live session
   named `<node-id>` — with self-exclusion via
   `worktree_has_live_session <path> "$CLAUDE_CODE_SESSION_ID"`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:512`,
   the same self-exclusion `.claude/skills/align-tactics/SKILL.md` Step 0 uses).
   Owner equal to this session's own id → re-entrant, re-write (refreshes the
   timestamp) and continue. Owner is a different id, or the marker exists but
   is malformed → **stop** before any diagnosis; report the holder. Run
   `reservation_sweep` once first so a stale/dead owner is reclaimed before the
   check (its own daemon-UNKNOWN path is fail-safe).
3. **No explicit `reservation_clear` anywhere in this flow.**
   `reservation_sweep`'s existing rules already govern the claim's lifetime
   correctly with zero ledger-semantics changes: a marker is kept indefinitely
   while the reserving session id stays live (age-independent), and reclaimed
   only once that session is dead and the marker has aged past the 30s boot
   grace. "Review is quick, the human then keeps driving THIS session" → the
   claim persists exactly as long as the human is working the node: correct.
   "Review says engage a different worktree/session" → the claim persists
   until *this* drain session ends, a deliberate bounded over-claim (the human
   is mid-decision on this exact park; clearing early would reopen the very
   race this tactic closes, since the human has not yet executed anything),
   and it self-heals on session exit. An explicit clear at the skill's final
   "Stop" step would be actively wrong — it would drop the claim at the exact
   moment the human is still deciding. The stop paths that precede the claim
   (node not parked; already held by another) never write a marker, so no
   clear path is needed there either.
4. **`office-hours-graph` gets an inline pre-check** (no sourcing of the
   shared lib — it deliberately sources nothing from
   `.claude/skills/dispatch-propagate/`, own header comment) so an
   already-claimed node is not spawned into. Advisory only — Unit 2's
   in-skill check is authoritative; this only avoids a wasted spawn in the
   common case.
5. **A new `reservation_owner` helper** is added to
   `lib-reservation-ledger.sh` to avoid duplicating the sweep's inline `sed`
   parse, with a test added to `test-lib-reservation-ledger.sh` in the existing
   style.

`validates: []` stands — this is infrastructure hardening, not a
signal-producing tactic. `office-hours-select.ts` / `officeHours.ts` (the pure
offline TS selector) are **not** touched — mirrors
`tactic-office-hours-concurrency-dedup`'s own design decision 1: daemon/
liveness-derived state never enters the pure offline selector; this claim
check is daemon-derived (via `claude agents --json`) too.

## Unit 1 — `reservation_owner` in the ledger lib, plus tests

**Scope:** `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh`.

- Add `reservation_owner <worktree-basename>` beside `reservation_exists`.
  Contract: the same `*..*|*/*|*[[:cntrl:]]*` path guard already used by
  `reservation_write`/`_clear`/`_exists`; print the first `session=` value
  (`sed -n 's/^session=//p' "$dir/$wt_name" | head -n1`); **return 0** with
  that value on success; **return 1** when the argument is missing/unsafe,
  the ledger dir is unresolvable, the marker is absent, **or** the marker has
  no readable `session=` line (malformed). Callers thereby distinguish "no
  claim" (`reservation_exists` false) from "claim with unknown owner"
  (`reservation_exists` true, `reservation_owner` non-zero) — the fail-safe
  case, mirroring `reservation_sweep`'s own malformed-marker rule.
- Document it in the header contract block alongside the other primitives
  (the names list and the per-function contract comments).
- Refactor `reservation_sweep`'s inline `sed -n 's/^session=//p' "$f" ...`
  parse to call `reservation_owner "$bn"` instead (`marker_sid=$(reservation_owner
  "$bn") || marker_sid=""`) so exactly one parser exists. Leave the
  `timestamp=` parse untouched.
- Tests in
  `.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh`,
  appended to the existing `lib-reservation-ledger.sh` test section (reuse
  `rl_setup`/`rl_teardown` and the `assert_eq` helper; Test 1
  (`reservation_write` + `reservation_count`) is the style template): owner of
  a freshly written marker; return 1 on an absent marker; return 1 + empty
  stdout on a marker whose `session=` line was stripped; return 1 on an
  unsafe basename (`../escape`).

**Recommended model:** sonnet — a mechanical addition mirroring three
existing sibling functions verbatim, with a fixed test template to copy.

**Dependencies:** none.

## Unit 2 — Claim step in the office-hours graph-native skill

**Scope:** `.claude/skills/office-hours/SKILL.md`, section "Graph-native mode
(`/office-hours <node-id>`)" — locate by heading text, not by today's line
numbers (a concurrent PR is also editing this section's prose). Insert a new
numbered step between step 1 ("Read the node", which stops if `office_hours`
is null) and step 2 ("Surface the park reason"), renumbering steps 2-6 to
3-7. Amend the section's own preamble so its "no graph write" claim reads as
still-true, with the new claim explicitly named as a non-graph, ledger-only
scheduling marker — not a graph write, not a park.

The new step, run as one Bash call
(`dangerouslyDisableSandbox: true` — the liveness helpers reach the daemon
over a Unix socket, mirroring `office-hours-graph`'s own header note),
specifies, in order:

```bash
source .claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh
reservation_sweep   # reclaim dead-session markers before checking
```

1. `worktree_has_live_session "<project-root>/.claude/worktrees/<node-id>"
   "$CLAUDE_CODE_SESSION_ID"` (self-excluded) → success means **another**
   live session already holds the node by name (post-#2945, that is an
   `office-hours-graph`-launched drain or a phase worker) → **stop**, report
   the collision, do not proceed to diagnosis.
2. `reservation_exists "<node-id>"` → if true, `reservation_owner
   "<node-id>"`: owner equals `$CLAUDE_CODE_SESSION_ID` → re-entrant, proceed;
   owner is another id, or `reservation_owner` fails (malformed) → **stop**,
   report the collision.
3. Otherwise `reservation_write "<node-id>" "<node-id>"
   "$CLAUDE_CODE_SESSION_ID"` (identical argument shape to
   `dispatch-select-tick:224`). A failed write **stops** the drain (unlike
   the tick's proceed-anyway posture) — here the marker is the only race
   guard, so a silent failure would defeat the tactic's own purpose.

The stop path prints the holding session id and the node id and ends the
run: no park-reason surfacing, no recommendation subagent, no `gh pr diff`. A
held claim is **dedup, not a defect and not a park** — the same framing
`.claude/skills/align-tactics/SKILL.md` Step 0 uses for its own held-claim
check. State explicitly, in the step text itself, that **no
`reservation_clear` is ever issued by this skill**, with the one-line
rationale from Context item 3, so a later editor does not "fix" the
perceived leak.

**Recommended model:** opus — self-vs-other and live-name-vs-marker
interaction, fail-safe check ordering (sweep, then check, then write), and a
written contract other sessions rely on.

**Dependencies:** Unit 1 (`reservation_owner`).

## Unit 3 — Inline ledger pre-check in `office-hours-graph`

**Scope:** `packages/intentionsutil/scripts/office-hours-graph`, read fresh
against its post-#2945 shape (bare `$node_id` launch name, worktree
provisioning at `.claude/worktrees/$node_id`, the `held <node-id> <job-id>`
verb, and the untargeted next-rank skip for a live-named node — see
`tactic-office-hours-concurrency-dedup`'s own node body for the shipped
line numbers once merged). This script sources nothing from
`.claude/skills/dispatch-propagate/` (its own header comment: "that lib is
scheduled for deletion") — respect that boundary; do not source
`lib-reservation-ledger.sh` here.

- Add an inline `reserved_owner_for <node-id>` helper beside `job_id_for_name`
  and `park_live_on_main`: ledger dir =
  `${DISPATCH_RESERVATION_DIR:-$(dirname "$(git -C "$SCRIPT_DIR" rev-parse
  --path-format=absolute --git-common-dir)")/tmp/dispatch-reservations}` (the
  inlined mirror of `reservation_dir`/`resolve_project_root`, matching this
  script's existing `git -C "$SCRIPT_DIR"` cwd-independence convention); print
  the `session=` value if the marker file exists, else empty; never fail
  (`|| true`).
- Queue-head walk (the `while` loop in `resolve_directive`): add a third skip
  alongside the park-freshness and (post-#2945) live-session skips, with a
  stderr note in the same voice as the existing false-positive note:
  `office-hours: skipping $nid — reserved by session <id> (a drain is
  already reviewing it).`
- Targeted branch: after `park_live_on_main "$TARGET"` and after #2945's
  `held` check, emit `reserved $TARGET <session-id>` and return; add a
  `reserved)` arm to the `case "$verb"` dispatch beside `cleared)`/`empty)`/
  `held)`/`launch)` that prints the holder and `exit 1`. Add `reserved` to
  the header's directive-vocabulary comment.
- Do **not** clear or write markers here — this is read-only pre-flight. The
  TOCTOU window between this check and the launched session's own claim
  (Unit 2) is closed by Unit 2, which is authoritative; this unit is a
  wasted-spawn optimization only.

**Recommended model:** sonnet — a mechanical mirror of two skip/verb
patterns `tactic-office-hours-concurrency-dedup` already establishes at the
same sites.

**Dependencies:** Unit 2 (the authoritative gate must exist first). The
whole tactic is `blocked_by: [tactic-office-hours-concurrency-dedup]`
(frontmatter) because this unit touches the exact `office-hours-graph`
control-flow blocks that PR is concurrently rewriting.

## Reuse

- `reservation_write`/`_exists`/`_clear`/`_sweep` —
  `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh`;
  node-id-keyed call shape from `dispatch-select-tick:224`.
- Both-halves claimed-set check pattern — `graph-select-target:405-414`.
- Self-excluded liveness check — `worktree_has_live_session`
  (`lib-claude-agents.sh:512`) as used by `align-tactics/SKILL.md` Step 0.
- Bash-only directive-verb precedent — `office-hours-graph`'s existing
  `cleared` verb (and `tactic-office-hours-concurrency-dedup`'s `held`).
- Test harness — `test-lib-reservation-ledger.sh`'s existing
  `lib-reservation-ledger.sh` test section (`rl_setup`/`rl_teardown`,
  `assert_eq`, Test 1 as the style template).

## Verification

```verify
bash -n .claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh || exit 1
bash -n packages/intentionsutil/scripts/office-hours-graph
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh > "${TMPDIR:-/tmp}/test-lib-reservation-ledger.sh.log" 2>&1; rc=$?
tail -20 "${TMPDIR:-/tmp}/test-lib-reservation-ledger.sh.log"
[ "$rc" -eq 0 ] || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-sweep.sh > "${TMPDIR:-/tmp}/test-dispatch-sweep.sh.log" 2>&1; rc=$?
tail -20 "${TMPDIR:-/tmp}/test-dispatch-sweep.sh.log"
[ "$rc" -eq 0 ] || exit 1
```

Expect `0 failed`, with the new `reservation_owner` assertions passing and
the pre-existing sweep tests (dead-session-stranded, live-worker-redundant,
boot-grace) unchanged — the regression proof for the sweep refactor in Unit 1.

```verify
grep -n "reservation_owner\|reservation_write\|worktree_has_live_session\|reservation_clear" .claude/skills/office-hours/SKILL.md
```

Expect the new claim step to reference `reservation_owner`,
`reservation_write`, and `worktree_has_live_session`, and **zero**
`reservation_clear` occurrences anywhere in the file.

Manual/observational:

- **Two-drain race.** In session A, run `/office-hours <parked-node>`. While
  A is still live, run `/office-hours <same-node>` in session B. B must stop
  at the claim step naming A's session id, before surfacing any park
  context.
- **Subagent path.** Fan out the office-hours skill via the Agent tool on a
  parked node; confirm the written marker's `session=` line equals the
  *parent* session's `$CLAUDE_CODE_SESSION_ID` (an id present in `claude
  agents --json`), so the next `reservation_sweep` keeps it rather than
  reclaiming it as stranded.
- **Lifetime.** With the drain session still live, run `reservation_sweep`
  by hand — the marker survives via the alive-reserving-session rule. End
  the session; after the 30s boot grace, the next sweep reclaims it as
  dead-session-stranded.

## Related

`tactic-office-hours-concurrency-dedup` (the launch-path half),
`tactic-drain-disposition-diagnosis-cas` (the write-time half of the same race),
`tactic-claim-dedup-only` (claiming is scheduling dedup, never an edit block).

## needs-main residue

- **id 6** — Two concurrent `/office-hours <node-id>` drains — second stops at
  the claim step.
  - URL path: current
  - Expected outcome: the second drain halts at the claim step, before
    surfacing any park context, and reports the node as already held by the
    live first session; the first session completes normally.
  - Finding: multi-session concurrency scenario the PR (#3035) documents as
    observational and non-auto-runnable in its own Test plan (unchecked item:
    "Manual: two concurrent `/office-hours <node-id>` drains — second stops
    at the claim step before surfacing park context (observational, not
    auto-runnable)"). Cannot be reproduced or asserted from within a single
    QA session; needs a real concurrent-drain scenario to observe.
  - Verifiability: MACHINE
  - Check: launch two `/office-hours <node-id>` sessions concurrently against
    the same parked node (post-#3035, on `origin/main`); confirm via
    `tmp/dispatch-reservations/<node-id>` (the reservation marker's
    `session=` line) and each session's own transcript/output that only the
    first session's `session=` id is recorded, and that the second session's
    output reports the collision and stops before any park-reason surfacing
    — no `gh pr diff` call, no recommendation subagent output in its
    transcript.
