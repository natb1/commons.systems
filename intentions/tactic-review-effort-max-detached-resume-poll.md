---
id: tactic-review-effort-max-detached-resume-poll
kind: tactic
statement: Raise the review phase's nested `/code-review` pre-stage from `low`
  to `high` effort, together with the detached-launch / bounded-await invocation
  harness and the node lock that make it survivable — the harness exists because
  a measured `max` run on a real diff ran 39m23s and was killed having produced
  ZERO bytes (`claude -p` buffers all output until completion), so raising the
  effort constant alone converts every review into a total loss; the same
  harness is what makes the shipped `high` level reachable. Node id retains
  `max` as a historical handle; the shipped level is `high`.
owner: ai
status: codified
parent: null
rationale: >-
  Author-decided 2026-08-09 at the office-hours sitting that closed
  tactic-review-code-review-invocation-contract. That node's needs-main residue
  item 3 asked whether `low` is the right cost/quality point for the review
  phase; the author ruled that it is not, and directed `max`. This node exists
  because `max` CANNOT be reached by changing the effort argument — the coupling
  is a hard measured constraint, not a preference. MEASUREMENT (recorded in
  `.claude/skills/review-fix/references/code-review-invocation.md` section 1.2,
  taken 2026-07-31, and re-read at the sitting): `claude -p '/code-review max
  c06c7295~1..c06c7295' --permission-mode acceptEdits` ran 2363 s (39 m 23 s),
  produced no output, and was terminated with `exit=143`; captured
  `stdout+stderr` was 0 bytes. Structurally the run spawned one root
  `general-purpose` review subagent which fanned out 10 angle subagents at
  `spawnDepth: 1`; the 10 angles finished at ~24 min and the ROOT agent was
  still in synthesis/dedup at 39 min when killed. THREE CONSEQUENCES the
  reference doc records, all load-bearing here: (1) a `max` review of a real
  non-trivial diff exceeds the Bash tool's 600 000 ms cap AND the proposed
  `DISPATCH_CODE_REVIEW_TIMEOUT:-540`, falsifying the assumption that a `max`
  run fits in one Bash call; (2) `claude -p` buffers all output until the run
  completes, so a killed run yields zero bytes — the `rc == 124 -> exit 4` path
  is a TOTAL LOSS of a very expensive run, not a degraded result; (3) the doc's
  own conclusion is that the invocation must either run detached/backgrounded
  with a resume-poll or drop the effort level, and explicitly warns: `Design
  this deliberately; do not just raise the timeout constant.` The author chose
  the first branch. SCOPE COUPLING (deliberate, do not split): the effort raise
  and the detached resume-poll harness ship as ONE deliverable, so `max` can
  never land without the harness that makes it viable — splitting them would
  leave a window in which the review lane is deterministically broken. Target
  form per the reference doc: a range target (`<sha>..HEAD`), never a bare SHA —
  `dispatch-code-review` already rejects a non-range `--target` with exit 2,
  because a bare SHA reviews only the single commit at that SHA. Cost is NOT
  unattributed: section 5.2 confirms every assistant message in the review
  subagent transcripts carries `attributionSkill: "code-review"`, so the spend
  lands on a `code-review` phase line rather than in `<none>`. PLANNED
  2026-08-09 by an /align-tactics tactic-target session (drift review found no
  blocker; the 2026-08-09 sitting's ruling is a self-standing author decision,
  not conditional on strategy-token-economy's clarifications array — see that
  node for the standing routing-approval condition's application here). Full
  plan landed in the body; see
  `.claude/skills/review-fix/references/code-review-invocation.md` for the
  underlying measurement this plan builds on.


  AMENDED 2026-08-13 (Unit F of the graph-correction round, same-day follow-up):
  the 2026-08-09 `max` ruling recorded above was itself superseded the same day
  this node's harness shipped — strategy-token-economy clarification 44 records
  the author's directed change from `max` to `high`, a deliberate supersession
  rather than an interim operating point. This node's id deliberately RETAINS
  `max` as a historical handle per author ruling this session — no rename, no
  prose repointing, no prune — while its statement and plan body reflect the
  shipped `high` level. Landed as PR #3078 (branch
  `review-lane-code-review-high-detached`), which also ships the node lock
  (sibling node tactic-code-review-detached-node-lock) that condition 9 requires
  ship in the same PR as the effort raise.
reading: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.04
  override: null
  rationale: >-
    Band 2 of the bootstrap three-band interim scale (50/20/10). A deliberate
    author-directed quality investment with a known, measured implementation
    constraint — not a defect and not an outage, so not band 1. Above baseline
    because it is the sole open remainder of a node the sitting otherwise
    closed, and because the review phase runs on every PR the fleet produces, so
    both the quality gain and the token cost compound across the whole lane.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: implement
execution:
  branch: review-lane-code-review-high-detached
  pr: 3078
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# `high` review effort requires a detached resume-poll harness to be reachable

Node id retains `max` as a historical handle — see "Node id" at the end.

## Context

The review phase's nested `/code-review` pre-stage ran at `low` effort. The
author ruled at the 2026-08-09 office-hours sitting (closing
`tactic-review-code-review-invocation-contract`) that `low` was not the right
cost/quality point, and directed `max`. Measured on a real diff, `max` ran
2363 s (39 m 23 s) before being killed, produced ZERO bytes (`claude -p`
buffers all output until the run completes, so a killed run is a total loss,
not a degraded result), at a $371.54 price proxy. `medium` did not complete in
300 s; only `low` (14-30 s) is measured to complete inside the Bash tool's
600 000 ms cap. So no foreground call can run anything between `medium` and
`max`, `max` included, which is why the invocation must be detached — the
reference doc's own conclusion (`code-review-invocation.md` §1.2's
consequence 3) warns explicitly: "Design this deliberately; do not just raise
the timeout constant."

**Superseded 2026-08-13.** The 2026-08-09 `max` ruling was itself superseded
the same day, before this node's harness shipped: `strategy-token-economy`
clarification 44 records the author's directed change from `max` to `high`, a
deliberate supersession rather than an interim operating point. What the
measured record forbids is `max` synchronously; `high` is unmeasured, not
refuted — the reference doc's §7 already named the untested `medium`/`high`/
`xhigh` middle as "where the usable operating point probably sits." The
detached/bounded-await harness this node ships is unchanged by which effort
level it carries: it is what makes ANY raised effort — `high` as shipped, or
`max` had the earlier ruling stood — reachable at all.

**Scope coupling, still deliberate.** Landing `high` without the harness
leaves the review lane deterministically broken (every review a $372-shaped
zero-byte loss); landing the harness without the node lock (see below) leaves
the corruption case open; landing the harness without the effort raise leaves
the author's decision unimplemented. All three ship together in PR #3078.

## Shipped in PR #3078 (`review-lane-code-review-high-detached`)

Six files: `dispatch-code-review`, `lib-claude-agents.sh`, their two test
suites, `review-fix/SKILL.md`, and
`review-fix/references/code-review-invocation.md`. Tests 115/115 and 266/266.

**Recommended model** — opus, per the original plan (Units 1-3 each carried
this tag); all units are now shipped, so this is a historical record, not an
open instruction.

### Unit A (was Unit 1) — measured before building on it, as shipped

Recorded in `code-review-invocation.md` §9. Only the cheap probe ran:

- **§9.1, detached-child survival.** A `setsid`-launched child survives both
  the launching Bash call returning cleanly AND the launching call's own
  process chain being killed outright (`kill -9` on the launcher's wrapper
  shell and its foreground `sleep`) — the child keeps its own session id,
  untouched. A **sandboxed** launch does not survive either shape: each
  sandboxed Bash call gets its own PID namespace, so the recorded pid is
  namespace-local and the child is gone by the next call.
  `DETACHED_LAUNCH_MECHANISM: setsid` — this is what Unit 2's launch uses.
- **§9.2**, `flock` and `setsid` both resolve from the same `util-linux`
  derivation at a fixed Nix store path — measured present, not assumed.
- **§9.3**, `high` itself stays **inferred, not measured**: nothing about
  `high` was run in this unit. It sits, unmeasured, between measured `medium`
  (>300 s) and measured `max` (>2363 s, killed, zero bytes) — which is
  exactly why the harness ships before any `high` run, not after: there is no
  foreground-call-shaped way to take that measurement safely at all.

**Probe 2 was dropped** — the plan's one real `max` run to completion
(~40 min, ~$372 price proxy). Recorded as a deliberate deviation
(`code-review-invocation.md` §9.4): the shipped level is `high`, not `max`, so
a completed `max` run would not source any constant this node needs; the
5400 s deadline was fixed independently by the author (clarification 45), not
derived from a `max` completion time; and clarification 46 already rules that
the **first production `high` runs** record realized wall clock, price proxy
and findings count, asserting no threshold in advance. Running `max` to
completion would have spent real money measuring a level nothing downstream
uses.

### Unit 2 — `dispatch-code-review`, as shipped

There is no mode: every run launches (or resumes) detached under `setsid`,
and every invocation is a bounded **await** with a new exit **5** — call
again with identical arguments to resume the same run. `low` still finishes
inside the first await window and behaves byte-identically to before.

Shipped shape:

- `EFFORT="high"` is the new default (was `low`); `--effort` stays
  overridable, and `review-fix` deliberately never passes it.
- **`--model opus`** is a new, explicit pin, joining the resume cache's run
  identity — see "Model pin" below.
- Run-state (`.run`, `.output`, `.rc`, `.untracked-before`) lives in
  `CACHE_DIR`, **never** `--out-dir` — `--out-dir` sits inside the reviewed
  worktree, writable by the very PR under review, so a planted `rc=0` marker
  there would let a review that never ran report `status=ok`.
  `CACHE_VERSION` bumped 2 → 3.
- **`DISPATCH_CODE_REVIEW_TIMEOUT` is retired, not aliased.** Setting it now
  exits **2** naming its replacements, `--await-seconds` (default 540 s) and
  `--deadline-seconds` (default 5400 s, the author's ruling in clarification
  45) — a stale value would otherwise set a meaningless budget
  (`.claude/rules/code-style.md`: clear errors over silent fallbacks).
- **New exit 6** — the reviewed worktree's `.code-review-lock` sidecar is
  already held by a different detached run; nothing was launched, no review
  ran. Distinct from exit 1 on purpose: a failed lock acquire is a different
  fact from a child that failed, and must never be reported as either.
- **Rollback stays one line**: `EFFORT="high"` back to `EFFORT="low"`. The
  harness stays correct at `low` — the run completes inside the first await
  window — so rollback is an effort change, never a structural one.

**Model pin — contract fact (`code-review-invocation.md` §9.5).** A nested
`claude -p` does not inherit the launching session's model. At `high` effort
the model is the dominant cost and quality term, so an unpinned run would
leave clarification 46's realized-cost measurement uninterpretable — a later
reader could not tell whether a recorded price proxy reflects `opus` or some
other default. `model` therefore joins effort level, target and flags as part
of the detached run's identity for the resume cache: two runs differing only
in model are different runs, never resumed against each other.

**The node lock** ships as part of this unit's launch path (`setsid flock -n
<sidecar> <child>`) but is designed and recorded on the sibling node
`tactic-code-review-detached-node-lock` — see "Node lock" below.

### Unit 3 — `review-fix` Step 1b, as shipped: Variant B only

The carrier's own two-variant fork (`background-notify` vs. `foreground-poll`,
gated on a harness-notification probe) resolved to **Variant B
(`foreground-poll`) without running that probe** — recorded as the second
deliberate deviation (`code-review-invocation.md` §9.4). The carrier's own
text already called Variant B known-safe: "A busy foreground Bash call is not
`blocked`, so the foreground shape is known safe." A shape already known safe
by the plan's own reasoning does not need a probe to select it.

Shipped: a bounded re-invocation loop, at most **10 attempts**, each one Bash
call with `dangerouslyDisableSandbox: true, timeout: 600000` running the exact
same command with identical arguments. Exit 5 → loop again. Exit 0 → leave the
loop. Exit 6 → **not** retryable, hard-stop immediately (a lock conflict means
nothing was launched, and looping on it burns attempts waiting on a run this
session does not own). Anything else → the existing `case $CR_RC` hard-stops
the phase. Exhausting the cap is a **failure, not a pass** — it takes the `4`
branch, named "attempt cap exhausted."

The cap is **10, not the 8 this node recorded when PR #3078 first landed**
(corrected 2026-08-13, same day, author-ruled). At 8 the arithmetic was
8 × 540 s = 4320 s, 18 minutes short of the script's own 5400 s deadline, and
this node stated that gap approvingly — "the caller's cap trips first." That
was a **deviation from a ruling this strategy already carried**, not an intent:
`strategy-token-economy`'s 2026-08-13 `/align` round, ruling (2) of "when the
built-in's detached run outlives its await window, what holds the node, and
what ends the run", states that the hard stop "fires at deadline exhaustion,
**never at the await boundary**". Cap exhaustion is a count of await
boundaries, so at 8 the script's exit-4 path — the only thing that kills the
detached run and releases the worktree `flock` — was unreachable, and the phase
hard-stopped while the run kept writing an abandoned worktree for ~18 more
minutes, holding the node lock and blocking `dispatch-ladder-advance` /
`graph-select-target`, with the finished review never collected.

10 × 540 s = 5400 s makes the two bounds **exactly** equal, and equality is
sufficient: the script's await loop computes its per-call window as
`min(--await-seconds, deadline - elapsed)`, so `window_end` can never fall past
the deadline instant, and it tests `elapsed >= DEADLINE_SECONDS` **before**
`now >= window_end`, so on a tie the deadline branch wins and the call returns
4, not 5. Per-call overhead counts toward `elapsed` and so only brings the
deadline forward in attempt count. The alternative — lowering
`--deadline-seconds` to 4320 s — was rejected because it would override
clarification 45's independently-chosen 5400 s figure. Cap exhaustion survives
as a fail-closed backstop for the cases that bypass the arithmetic (an
overridden `--await-seconds`, or a call returning 5 early).

**Variant A (`background-notify`) is an explicit open follow-up**, gated on a
later probe of harness completion-notification behavior. No `ScheduleWakeup`
fallback may be added alongside it in the meantime: `strategy-token-economy`
clarification 11 records that a self-scheduled fallback timer for
harness-tracked work fires redundantly after the auto-notification has
already resumed and finished the work, burning a no-progress round.

The `*)` catch-all and its rationale are unchanged and load-bearing — without
it a stale worktree (127), a lost `+x` bit or sandbox denial (126), or a
signal (128+n) all leave `CR_OUT` empty and would otherwise pass the
Workflow's contract check on a review that never ran.

### Node lock — carried by the sibling node, not implemented here

Condition 9 (`strategy-token-economy`, 2026-08-13) requires the node stay
locked for the detached run's own lifetime, independently of whether the
launching session survives — the carrier node itself was parked office_hours
for exactly that failure mode (a frozen-session park evaporating the claim
while a `--fix` run kept writing). This node's Unit 2 launches the child
under the lock (`setsid flock -n <sidecar> <child>`); the lock's design — why
a kernel `flock`, the sidecar path convention, the `unknown`/`live` fold, and
the "one insertion point not four" finding — is recorded on
`tactic-code-review-detached-node-lock`, which this effort raise must not
ship without: a survivor with no lock is the corruption case.

## Defect found and fixed during implementation

The test unit surfaced a real race: two invocations awaiting the *same*
in-flight run could have the loser see `.rc` already collected-and-deleted by
the winner, plus a dead pid, and report exit 1 — "recorded no exit code" — on
a run that had actually **succeeded**. Under the Step 1b loop that hard-stops
the whole review phase and discards a completed, expensive `high`-effort
review as a crash.

Fixed with a bounded retry poll (60 attempts × 0.5 s, no sleep after the
final attempt, fail closed on exhaustion — the same shape as
`lib-claude-agents.sh`'s `verify_agent_registered_under_state`) that accepts
either observation as proof the run finished: `.rc` reappearing, or a CURRENT
authenticated completed-summary cache entry (the other awaiter's own Step 7
replay target). Only exhausting the retry with neither signal concludes a
real crash and exits 1. This is the same empty-read discipline
`lib-claude-agents.sh` already applies to every liveness probe: an ambiguous
observation folds toward "still running," never toward "finished" or
"failed." Reproduced 15/15 against the pre-fix path; 98/100 clean after (the
2 outliers were external SIGTERMs to the awaiting script, not this path).

## Verification (as landed)

```
bash -n dispatch-code-review                    OK
bash -n lib-claude-agents.sh                    OK
test-dispatch-code-review.sh                    115/115 passed
test-lib-claude-agents.sh                       266/266 passed
run-lint.sh                                     all checks passed
```

Both suites run in CI via `run-unit-tests.sh`'s `RUN_PR_SCRIPTS` path (any
changed `.claude/skills/dispatch-propagate/scripts/*` path), no workflow edit
needed. Cross-file contract check: every exit code the script can return
(0/1/2/3/4/5/6) has a branch in `review-fix/SKILL.md`'s `case $CR_RC`; the
catch-all is intact; no parsed summary field was renamed;
`DISPATCH_CODE_REVIEW_TIMEOUT` appears nowhere outside the script's own
rejection message and historical prose.

**Still owed — manual verification on the first real dispatch review pass**
(cannot be simulated): the launching call returns quickly with exit 5 rather
than blocking; await rounds resume the same run (the `code-review` subagent
count does not multiply); the summary carries `effort=high` and `model=opus`
with non-empty `findings_path`/`patch_path`; the lock file exists and
`flock -n` is refused mid-run while the router does not spawn a second
worker; and, post-merge, a `/dispatch-token-audit 7d` recording realized cost
and throughput per clarification 46 — asserting no threshold. This is the
missing-lens gap tracked as `tactic-audit-review-effort-yield-lens`
(clarification 46): findings at `high` against the `low` baseline is not yet
computed by any sensor.

## Rollback

One line: `dispatch-code-review`'s `EFFORT="high"` back to `EFFORT="low"`.
The harness stays correct at `low`, so rollback is an effort change, never a
structural one. Per condition 3, an effort reversion still requires explicit
author approval — an auto-reverting completion-rate gate was put to the
author and declined (clarification 46) for exactly that reason.

## Node id

This node's id, `tactic-review-effort-max-detached-resume-poll`, deliberately
retains `max` as a historical handle even though the shipped level is `high`.
Author ruling, this session (2026-08-13, Unit F of the graph-correction
round): no rename, no prose repointing, no prune — a later reader who notices
the id says `max` while the statement and this body say `high` should read
that as the id's origin, not as drift.
