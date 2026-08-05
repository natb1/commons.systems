---
id: tactic-invalid-state-lane
kind: tactic
statement: Give the router one common invalid-state lane — selection-time
  occupancy discrimination (occupied-by-terminal vs occupied-by-live) and
  sweep-time detection route a node the phase ladder cannot progress to an
  optional mechanical-resolution tier, then an intervention skill session, then
  an office-hours park — generalizing the ad-hoc conflict/CI/sweep handling
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-08-04 /align interview (author-designed,
  ratified with refinements). See the strategy's 2026-08-04 invalid-state-lane
  clarification for the ratified doctrine: dual detection points,
  intervention-attempt cap parking to office-hours at the cap, find-or-create
  dedup on filed follow-ups, mechanical tiers failing toward keep/escalate, and
  the fleet-level latch-node arm for invalid states with no node to route. The
  conflict lane (provision exit 11 -> dispatch-conflict) is the worked
  precedent."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-invalid-state-lane
  pr: 3048
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Give the router one common invalid-state lane — selection-time occupancy discrimination (occupied-by-terminal vs occupied-by-live) and sweep-time detection route a node the phase ladder cannot progress to an optional mechanical-resolution tier, then an intervention skill session, then an office-hours park — generalizing the ad-hoc conflict/CI/sweep handling

## Context

A dispatch node can reach a state its phase ladder cannot progress from: a
session that ended without declaring a disposition but is still registered (so
`worktree_has_live_session` keeps its node frozen forever), a session frozen at
a permission/classifier denial, a `claude rm` reap that exited 0 while
declining, a provision merge conflict, a red CI loop past its cap. Today each of
these has its own ad-hoc handling, invented separately:

- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:250-388`
  (provision exit 11) — kick `/dispatch-conflict` Lane 3 first, then a sidecar
  strike counter, then `hold-node --kind provision-conflict` at the cap. This is
  the **worked precedent** the lane generalizes; its own comment (lines 274-281)
  says the strike ladder is interim and expected to be replaced.
- `dispatch-graph-execute:409-460` (exit 14, worktree residue) — the sibling
  "no mechanical tier, escalate on first occurrence" shape.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:266-590`
  (`frozen_session_sweep`) and `:625-1269`
  (`terminal_without_disposition_sweep`) — detect and go **straight to an
  office-hours park**, with no mechanical tier and no intervention hop.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:784-798` — the
  selection-time occupancy check folds occupied-by-terminal (an invalid state)
  and occupied-by-live (a valid skip) into one undifferentiated `live-session`
  skip, so the invalid state is invisible at the moment the router notices it.

The ratified doctrine (strategy `strategy-graph-native-dispatch`, 2026-08-04
`/align` interview) is **one common lane**: detect → an optional
mechanical-resolution tier → an intervention skill session → an office-hours
park as the fallback. Guards ratified with it: a per-node intervention-attempt
cap that escalates at the cap; find-or-create dedup on anything the lane files;
every mechanical-tier gate fails toward keep/escalate; and fleet-level invalid
states with no node to route mint a find-or-create latch node (the
`tactic-main-red-*` shape) that is simultaneously the alarm, the work item and
the dedup key.

Two doctrine amendments this tactic must honor exactly:

1. **Condition 14 keep-for-debug is amended.** An undeclared terminal exit now
   routes to this lane, whose intervention session consumes the debugging
   artifact (reads the transcript, files the root-cause follow-up, then reaps or
   parks). Freeze-until-operator survives only as the fallback when the
   intervention itself parks. **The lane never reaps** — only the intervention
   session or a human does (2026-07-31 clarification: a sweep that parks a
   frozen node surfaces the freeze but does not resolve it; `park-node`'s
   trailing `mark-node-terminal` no-ops under its ownership gate).
2. **The park tier must never fire for a retry-shaped state.** A merge conflict
   against a moving main, or a bounded-retry-by-design short of its cap, routes
   to `hold-node` / `blocked_by`, never `office_hours` on the source
   (2026-07-25 clarification, tracked as `tactic-mechanical-park-producers`).
   Which primitive applies is a per-kind property the lane must carry
   generically: `hold-node` for mechanical/bounded-retry shapes, `park-node` for
   genuinely human-required shapes.

Explicit non-goals and standing caveats, carried forward:

- **The intervention session's own internals are out of scope.** They belong to
  the sibling draft `tactic-invalid-state-transcript-intervention`. Do not edit
  `intentions/tactic-invalid-state-transcript-intervention.md` from this work.
  This tactic builds the detection, the routing, the mechanical tier, the
  attempt cap and the escalation hand-off; it defines the invocation contract
  the sibling implements (`/dispatch-invalid-state <node-id>`, skill directory
  `.claude/skills/dispatch-invalid-state/`) and **degrades cleanly while that
  skill does not exist** — the intervention tier is skipped when the skill
  directory is absent, leaving today's behavior intact.
- **done-but-parked is a VALID state** (2026-08-04 author ruling): phase and
  `office_hours` are orthogonal dimensions. The lane must never classify a node
  at `phase: done` with a live `office_hours` as invalid, and must never try to
  resolve it mechanically.
- **`dispatch-self-close` keeps its `claude rm` fast path.** The retired Step 2
  of `tactic-self-close-reap-silent-noop` (delete the reap line) stays retired;
  `tactic-worker-self-close-configurable`'s default-off keep-all gate lands on
  that same call site as planned. This lane is the guaranteed net behind both,
  not a replacement for either.
- **No park/hold call may run from inside the Stop hook.**
  `.claude/hooks/dispatch-stop.sh:18-20` records an in-hook `park-node` measured
  at 0/5 successes versus 4/4 in-session; it was deleted for that reason. Every
  write this lane makes runs from a sweep process or an in-session skill, never
  the hook.
- **A lane detector never reaps and never spawns into a live claim.** A node
  whose occupancy is `live` is a valid skip, full stop.

### Greenfield design (the shape to aim at)

One router script owns the whole ladder for every invalid-state kind:

```
detect (any detector)  →  dispatch-invalid-state-route --node <id> --kind <k>
                            ├─ tier 1  mechanical resolution (per-kind, optional, fails toward keep/escalate)
                            ├─ tier 2  intervention skill session (per-node attempt cap)
                            └─ tier 3  escalation, primitive chosen by the kind's class:
                                         retry-shaped → hold-node --kind <k>   (never office_hours on the source)
                                         human-shaped → park-node              (recommendation names the manual reap verbatim)
```

Every existing ad-hoc site becomes a *detector* that calls the router: the two
defensive sweeps, the selection-time occupancy check, and
`dispatch-graph-execute` cases 11 and 14. Fleet-level invalid states with no
node to route call the same router in `--fleet` mode, which mints a
find-or-create latch node instead of touching a source.

### Brownfield migration (what this plan lands)

Landing all of that in one PR would rewrite `lib-frozen-session-park.sh`'s
1269 lines of carefully-proven park machinery (base-CAS pinning, landing-proof
confirmation, marker deletion only on proof, stand-down interlock) and both
conflict-lane cases at once. This plan instead:

- lands the classifier, the router, and both **new** detection points;
- wires the two existing sweeps to consult the router as a **pre-tier**, keeping
  their proven park path as the escalation (tier 3 for those callers stays
  caller-owned this round);
- leaves `dispatch-graph-execute` cases 11 and 14 on their inline ladder, with
  the router's kind table already carrying their escalation classes so the
  follow-on is a call-site swap.

**Declared residuals** (do NOT attempt in this PR; they are follow-on tactics a
later round files): (a) extracting the sweeps' park-with-landing-proof block
into the router so tier 3 has one implementation instead of two; (b) rewiring
`dispatch-graph-execute` cases 11/14 onto the router.

---

## Unit 1 — Promote occupied-by-terminal to a first-class occupancy verdict

**Scope.** `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`.

Today `worktree_has_live_session` (lines ~945-1050) already *sees* the
distinction — when the matched registry row's `state == "done"` it prints an
operator diagnostic naming the session id and the `claude rm <sid>` release act
(~line 1041) — and then throws it away, folding terminal and live into a single
`return 0` (occupied). Add:

```
worktree_occupancy_state <path> [exclude_sid]
```

- Prints exactly one token to stdout and **always returns 0** (the token, not
  the exit code, is the contract — the same shape `dispatch_pause_state` uses in
  `.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh:30-45`): `free`
  | `live` | `terminal` | `unknown`. Reuse this four-state vocabulary verbatim
  from `claude_session_id_is_live` / `CLAUDE_SESSION_ID_LIVE_STATE`
  (lib-claude-agents.sh:~1052-1145) rather than inventing a new state set.
- Also sets two globals for callers that need the evidence:
  `WORKTREE_OCCUPANCY_STATE` (mirrors stdout) and
  `WORKTREE_OCCUPANCY_SESSION_ID` (the matched row's sessionId; empty for
  `free`/`unknown`). Initialize both at file scope so a read before the first
  call is not an unbound-variable error under `set -u` (same idiom as
  `CLAUDE_SESSION_ID_LIVE_STATE`).
- Verdict rules, reusing the existing single `claude_agents_list_registered`
  fetch, the existing two-name match (worktree basename + `office-hours-<N>`
  only for a genuine numeric prefix) and the existing `exclude_sid` semantics:
  fetch failure → `unknown`; no matching row → `free`; matching row whose
  `(.state // .status)` is in the terminal enumeration → `terminal`; any other
  matching row → `live`.
- The terminal enumeration MUST be the same one
  `claude_agents_count_held_for_debug` (~line 1295) and
  `claude_agents_list_terminal_workers` (~line 1375) already use
  (`done, stopped, killed, failed, errored, error, cancelled, canceled,
  terminated`). Those two currently duplicate the jq `def terminal_states:`
  block verbatim; extract it once into a single shell constant (e.g.
  `CLAUDE_AGENTS_TERMINAL_STATES_JQ`) or one shared helper and have all three
  consume it, so the three can never drift apart. Keep the documented posture
  that a *new* daemon state reads as live (not terminal) until added here —
  under-report rather than invent frozen nodes.
- Rewrite `worktree_has_live_session` as a thin wrapper: `free` → `return 1`,
  everything else (`live`, `terminal`, `unknown`) → `return 0`. **Its
  return-code contract, its fail-safe UNKNOWN fold, and the wording of the
  `done`-holder stderr diagnostic must not change for existing callers** — the
  only permitted change to that diagnostic is generalizing it to name whichever
  terminal state matched instead of only `done`. Every current caller
  (`graph-select-target`, `dispatch-sweep`, `lib-graph-worktree.sh`,
  `lib-standdown-recheck.sh`, `.claude/hooks/worktree-remove.sh`) must keep
  behaving identically.

Out of scope: any caller behavior change (Unit 2 owns the first one); any change
to `claude_agents_list_terminal_workers`' output columns; any new daemon query
(this must stay one fetch per call).

**Tests.** Extend
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh` (1580
lines; `CLAUDE_AGENTS_CMD` points at a fake `claude` printing a controlled JSON
array — reuse the existing per-test fixture pattern in that file). New cases:
free; live (`state: working`); terminal for at least `done` and `error`;
`unknown` on a daemon-failure exit and on whitespace-only output; `exclude_sid`
suppressing a self-match; and a regression case asserting
`worktree_has_live_session` still returns 0 for a terminal row and 1 for a free
worktree.

**Recommended model:** opus — the file's UNKNOWN folds and fail-safe posture are
load-bearing for fleet concurrency, and a wrong fold double-books nodes.

---

## Unit 2 — Selection-time detection: discriminate the skip

**Scope.** `.claude/skills/dispatch-propagate/scripts/graph-select-target`
(occupancy check at lines 784-798; `skip_note` at 457-460; the selection-log
emitter at 217-243).

Replace the `worktree_has_live_session` call in the claimed-set block with
`worktree_occupancy_state "$NATIVE_ROOT/.claude/worktrees/$id"` and branch:

- `free` → fall through (unchanged).
- `live` → `skip_note "$id" "live-session"` (unchanged wording; existing tests
  assert it).
- `terminal` → `skip_note "$id" "terminal-session"` and, on the `--node`
  path, a stderr line naming the holding session id and that the node is
  **occupied-by-terminal (an invalid state), not occupied-by-live**.
- `unknown` → `skip_note "$id" "live-session"` — the fail-safe fold is
  unchanged; UNKNOWN must never be reported as an invalid state, because that
  would let a daemon hiccup manufacture interventions.

In all four cases the node is still **skipped**. This unit adds no routing, no
spawn, and no graph write: the selector's writes stay exactly the CI-fix
interrupt and `hold-node` calls it already makes (see its header, lines 22-50).
The routing act for this detection point lives in Unit 4, which runs immediately
before selection over the same predicate — keeping session spawning out of a
script that humans also invoke standalone.

The discriminated reason flows into the decision log automatically through
`SKIPPED_JSON` / `_selection_log_emit`, which is what makes the invalid state
attributable in the selection log instead of hiding inside `live-session`.

Out of scope: `dispatch-sweep`'s and `lib-graph-worktree.sh`'s calls (they keep
the boolean wrapper).

**Tests.** Extend
`.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` (the
existing live-session case is at lines ~85-100 and already fakes the registry
via `CLAUDE_AGENTS_CMD`): add a terminal-row case asserting the run still prints
`empty` AND that the emitted decision-log record carries `terminal-session` for
that id (the suite already redirects `DISPATCH_DECISION_LOG_DIR` into a tmp
sandbox via `lib-test-decision-log-guard.sh`, sourced from
`dispatch-test-fixture.sh`).

**Dependencies:** Unit 1.

**Recommended model:** sonnet — a well-specified branch swap plus one test case,
with the exact wordings fixed by this plan.

---

## Unit 3 — The lane router: `dispatch-invalid-state-route`

**Scope.** New executable
`.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-route`, plus a
new
`.claude/skills/dispatch-propagate/scripts/test-dispatch-invalid-state-route.sh`.
No existing file changes in this unit.

This is the one common ladder every detector calls.

```
dispatch-invalid-state-route --node <id> --kind <kind> --evidence-file <f>
                             [--session <sid>] [--job-id <jid>] [--no-intervene]
```

**Kinds and their escalation class** — a single table in the script, the generic
form of the `hold-node`-vs-`park-node` discrimination the 2026-07-31
clarification resolved for exit-11 lineage:

| kind | mechanical tier | escalation class | escalation primitive |
|---|---|---|---|
| `terminal-session` | re-probe occupancy | human | `park-node` (caller-owned this round) |
| `frozen-session` | none | human | `park-node` (caller-owned this round) |
| `provision-conflict` | (reserved) | retry | `hold-node --kind provision-conflict` |
| `worktree-residue` | (reserved) | retry | `hold-node --kind worktree-residue` |
| `fix-attempt-cap` | (reserved) | retry | `hold-node --kind fix-attempt-cap` |

The three `(reserved)` rows carry no caller in this PR — they exist so the
follow-on call-site swap for `dispatch-graph-execute` cases 11/14 and the
fix-attempt cap is a one-line change, and so the class discrimination is written
down once. The router MUST refuse (exit 2) a `--kind` whose class is `retry`
combined with any request that would write `office_hours` on the source; assert
this with a test, because it is the standing rule from the 2026-07-25
clarification that this tactic must not regress.

**Ladder.**

1. **Preconditions** (each failure is loud on stderr, never silent): valid node
   id (reuse the regex at `packages/intentionsutil/scripts/mark-node-terminal:66`
   / `dispatch-graph-execute:138`); repo root via `resolve_project_root`
   (`.claude/skills/dispatch-propagate/scripts/lib.sh:1867`);
   `assert_primary_checkout_on_main` (`lib.sh:1885`); `intentions/<id>.md`
   exists on `origin/main`. A precondition failure exits `10` (escalate — the
   caller's existing path still runs) except an invalid node id, which is exit
   `2`. Unit 6 hangs the fleet latch off this block.
2. **Mechanical tier** — per-kind, optional, and every gate **fails toward
   keep/escalate**:
   - `terminal-session`: re-probe with `worktree_occupancy_state`. `free` → the
     state resolved itself (the session was reaped between detection and now):
     clear the attempt sidecar and exit `4` (keep — nothing to do). `live` →
     exit `4` (a live claim is a valid skip; never spawn into it). `unknown` →
     exit `4` (no positive evidence). `terminal` → continue.
   - Stand-down interlock for every kind: if `standdown_exists "$id"`
     (`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:307`,
     the same helper the sweeps use — see the interlock rationale at
     `lib-frozen-session-park.sh:649-661`) or another **live** session is
     registered under the node name, exit `4`. A stood-down loser has this exact
     shape by design.
   - `phase: done` + non-null `office_hours` on `origin/main` → exit `4`.
     done-but-parked is a valid state (2026-08-04 ruling), never an invalid one.
   - The tier NEVER reaps and NEVER writes the graph.
3. **Intervention tier** — bounded by a per-node attempt cap:
   - Sidecar counter at
     `<project-root>/.claude/worktrees/<id>.invalid-state-attempts`, **outside
     every checkout** so it never dirties a tree and is never a graph write —
     the same convention as the `.conflict-strikes` sidecar
     (`dispatch-graph-execute:341`) and `provision-node-worktree`'s
     `.scope-fingerprint`. Losing it is deliberately fail-open (more free
     attempts), exactly as the strike sidecar documents.
   - `INVALID_STATE_INTERVENTION_CAP=3`, a named constant at the top of the
     script beside a comment pointing at `FIX_ATTEMPT_CAP`
     (`packages/intentionsutil/src/transitions.js`, read via
     `packages/intentionsutil/scripts/apply-fix-state.ts --check-cap`) and
     `CONFLICT_STRIKE_CAP` (`dispatch-graph-execute:145`) as the two precedents
     this mirrors.
   - Availability guard: if `.claude/skills/dispatch-invalid-state/SKILL.md`
     does not exist (the sibling tactic has not landed), log one line and exit
     `10` — the tier is inert, today's behavior is preserved exactly.
   - Otherwise spawn via `dispatch-spawn-job --no-verify --name "$id" --cwd
     "$PROJECT_ROOT" --model opus "/dispatch-invalid-state $id"`, passing the
     evidence file path in the prompt. **`--cwd` is the project root, never the
     node's own worktree** — `dispatch-graph-execute:311-320` records two
     incidents where spawning into the node worktree ran a stale skill body and
     deadlocked a worker slot for over an hour. `--name "$id"` is required: it
     is what makes `.claude/hooks/dispatch-stop.sh`'s discriminator 2 hand the
     session to `dispatch-self-close --node "$id"`, and therefore what obliges
     the intervention to declare a disposition. Record that obligation in the
     script header, pointing at `mark-node-terminal:22-35`.
   - On a successful kick: increment the sidecar, emit a decision-log record
     (`decision_log_append`,
     `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:76`, behind
     the same `command -v` guard the sweeps use), print
     `intervened <id> <attempt>/<cap>` and exit `0`.
   - On a failed kick, or when the sidecar already sits at the cap: exit `10`
     (escalate). The ratified "cap parks to office-hours" guard is satisfied by
     the caller's escalation tier — say so in the header, and log the
     distinction (`cap-exhausted` vs `spawn-failed`) in the decision record.
   - `--no-intervene` skips this tier entirely and goes straight to exit `10`
     (used by tests and by an operator dry run).
4. **Escalation tier** — in THIS PR the router **performs no escalation write**.
   Exit `10` means "the ladder is exhausted; the caller owns the escalation".
   The kind table above records which primitive each kind's escalation must use
   so the follow-on extraction has no decisions left to make. The router MUST
   NOT call `park-node`, `hold-node`, `claude rm`, or `graph-commit` anywhere in
   this unit; assert that with a grep-shaped test.

**Exit codes** (documented in the header, and the contract every detector codes
against): `0` handled — an intervention was launched, caller must not escalate
this pass and must not delete any escalation markers; `4` keep — positive
evidence to do nothing this pass; `10` escalate — caller runs its own
escalation; `1` router failure (caller treats as escalate: fail toward
escalate); `2` usage error.

**Tests.** New `test-dispatch-invalid-state-route.sh` sourcing
`dispatch-test-fixture.sh` and `lib-claude-agents.sh`, faking the registry via
`CLAUDE_AGENTS_CMD` and the spawner via an argv-logging stub (mirror how
`test-lib-frozen-session-park.sh` overrides
`DISPATCH_FROZEN_SESSION_PARK_NODE`; give the router the analogous
`DISPATCH_INVALID_STATE_SPAWN_JOB` override with the same
resolves-inside-the-scripts-dir provenance check the sweep applies to
`park-node`, `lib-frozen-session-park.sh:333-352`). Cases: free → 4; live → 4;
unknown → 4; stand-down marker → 4; done-but-parked → 4; terminal with skill
absent → 10; terminal with skill present → 0 and sidecar incremented and one
spawn logged; three terminal passes then a fourth → 10 with `cap-exhausted`; a
`free` observation resets the sidecar; a `retry`-class kind never produces a
`park-node` invocation; an invalid node id → 2; non-primary-checkout → 10.

**Recommended model:** opus — new cross-cutting machinery whose failure modes
(spawning into a live claim, unbounded respawn, a park on a retry-shaped state)
are exactly the ones the doctrine forbids.

---

## Unit 4 — Selection-time routing arm: `dispatch-invalid-state-sweep`

**Scope.** New
`.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-sweep` plus
its wiring into `dispatch-select-tick` beside the existing pre-selection scope
sweep (`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:555-571`),
and a new `test-dispatch-invalid-state-sweep.sh`.

Model it directly on
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-scope-sweep:1-40`,
which is the same shape (pre-selection, enumerate then act, decision/liveness/
landing split) and whose header states the invariant this script must also
respect verbatim: **the claimed set it honors must match
`graph-select-target`'s exactly**.

Behavior:

1. Enumerate candidate node ids: worker sessions in a terminal registry state
   via `claude_agents_list_terminal_workers` (`lib-claude-agents.sh:1355`,
   columns `sessionId<TAB>id<TAB>name<TAB>cwd`; `.id` is the job id and is NOT a
   prefix of the sessionId — key any job-dir lookup on that column), keeping
   only names matching the graph node-id regex with an existing
   `intentions/<name>.md`. UNKNOWN from that helper aborts the sweep for this
   tick with a diagnostic — never treat UNKNOWN as an empty set (the same rule
   `dispatch-graph-scope-sweep` states for `claude_agents_list_all`).
2. Skip any id with `reservation_exists` (a reserved node is one the selector
   will not touch either).
3. For each survivor, confirm with `worktree_occupancy_state` that the node's
   own-id worktree really is `terminal`, then call
   `dispatch-invalid-state-route --node <id> --kind terminal-session --session
   <sid> --job-id <jid> --evidence-file <f>`, where the evidence file records
   the registry row, the transcript path, and the absence of a
   `$CLAUDE_JOB_DIR/node-terminal` marker.
4. Map the router's exit: `0` → count `intervened`; `4` → count `kept`; `10` →
   count `escalate-deferred` and log one line naming that
   `terminal_without_disposition_sweep` owns the escalation. **This arm never
   parks, never holds, never reaps.** That is deliberate and is the single
   escalation-owner rule: `dispatch-tick` runs both defensive sweeps *before*
   `dispatch-select-tick` on both cadences
   (`.claude/skills/dispatch-propagate/scripts/dispatch-tick:60-101`, `:382-410`,
   `:600-630`), so the sweep tier is always the escalation path and duplicating
   a park here would create a second, unproven park implementation.
5. Bound the work: at most `DISPATCH_INVALID_STATE_SWEEP_MAX` (default 2) router
   calls per invocation, since this runs inline on the tick's scheduling path.
   Always exit 0; print one summary line
   (`candidates=… intervened=… kept=… escalate-deferred=…`).
6. Wire it into `dispatch-select-tick` immediately after the scope-sweep block
   at line 565, with the same `|| true` best-effort posture and the same `while
   IFS= read -r` echo loop prefixing lines with `invalid-state:`. Note in the
   comment (as the scope-sweep comment does) that `dispatch-select-tick` runs
   with the sandbox disabled, which covers the daemon socket read.

Out of scope: any change to `graph-select-target` (Unit 2 owns it); any
escalation.

**Tests.** New `test-dispatch-invalid-state-sweep.sh`: a fake registry with one
terminal worker whose node file exists → one router call with the right argv
(assert via a router stub that logs argv); a reserved id → no call; an UNKNOWN
registry → no calls and a diagnostic; a name outside the node keyspace
(`^[0-9]+-`) → no call; the per-invocation cap honored.

**Dependencies:** Units 1 and 3.

**Recommended model:** opus — the claimed-set invariant against the selector and
the UNKNOWN posture are the parts that go wrong quietly.

---

## Unit 5 — Sweep-time detection routes through the lane

**Scope.** `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
— `frozen_session_sweep` (266-590) and `terminal_without_disposition_sweep`
(625-1269) — and `test-lib-frozen-session-park.sh`.

Both sweeps become the lane's second detection point by consulting the router as
a **pre-tier**, immediately before the park block each already has, and after
every one of their existing gates (name shape, session-id shape, idle grace,
stand-down interlock, `phase: done` gate, park cap, base-blob pin):

```
invalid_state_route_gate <node> <kind> <sid> [job-id]   # thin internal helper, one per sweep
```

- `0` (handled) → count a new `routed` disposition, write a decision record with
  disposition `routed-to-lane` via the file's existing
  `_frozen_session_log_decision` / `_terminal_disposition_log_decision` helpers
  (`:236-264`, `:594-624`), **do not park**, **do not delete the job dir's
  `office-hours-*` markers**, continue to the next candidate.
- `4` (keep) → count `kept`, decision record `kept-by-lane`, continue.
- `10`, `1`, `2`, a timeout, or a missing/unresolvable router → **fall through to
  the existing park path unchanged** (fail toward escalate).

Everything else in these two functions stays byte-for-byte as it is. In
particular do NOT touch: the base-blob pin and `--base` CAS token (`:489-500`,
`:1038-1050`), the landing-proof re-read at step (13) and the marker deletion
that only fires on proof (`:1181-1235`), the `park-not-landed` /
`stale-diagnosis` / `park-timeout` / `park-failed` decision-record vocabulary,
the park cap, or the provenance guards. The router call itself must be bounded
by the same `timeout` binary the file already resolves and refuses to run
without (`:305-315`), with its own short budget
(`DISPATCH_INVALID_STATE_ROUTE_TIMEOUT_S`, default 60), and must be resolved
through the same "executable regular file whose real directory is the scripts
dir" provenance check the file applies to `park-node` (`:333-352`), honoring a
`DISPATCH_INVALID_STATE_ROUTE_CMD` override for tests.

Kinds: `frozen_session_sweep` passes `--kind frozen-session`;
`terminal_without_disposition_sweep` passes `--kind terminal-session`.

Update both function headers to describe the new pre-tier and to state
explicitly that the sweep still owns escalation this round, and that a routed
candidate is *deferred*, not resolved — the freeze persists until the
intervention session (or a human) reaps.

**Tests.** Extend `test-lib-frozen-session-park.sh` (it already fakes the
registry, the transcript store, the graph repo, `park-node` and the clock):
router stub returning 0 → no `park-node` invocation, markers still present,
summary counts a routed candidate; stub returning 4 → no park, no markers
deleted; stub returning 10 → the existing park path runs exactly as today (reuse
an existing park-path assertion as the oracle); router binary missing → park
path runs (fail toward escalate); router hanging past its timeout → park path
runs.

**Dependencies:** Unit 3.

**Recommended model:** opus — this edits the most safety-critical file in the
change set, where the failure mode is deleting a session's only copy of its
escalation text.

---

## Unit 6 — Fleet-level latch for invalid states with no node to route

**Scope.** `dispatch-invalid-state-route` (`--fleet` mode) and its test file.

Some invalid states have no node to route: the router's own preconditions fail
fleet-wide (repo root unresolvable, primary checkout not on `main`, the
intervention spawner or `intentions/` unreadable), so *no* node can be
dispositioned and today the failure is a silent `return`/exit. Per the ratified
doctrine these mint a **find-or-create latch node** that is simultaneously the
alarm, the work item and the dedup key — the `tactic-main-red-*` shape.

- Trigger: the Unit 3 precondition block. Count consecutive failures of the same
  precondition in a sidecar at
  `<project-root>/.claude/worktrees/.invalid-state-fleet-<slug>` (outside every
  checkout) and mint only at `INVALID_STATE_FLEET_LATCH_MIN_OBSERVATIONS=2`, so
  a single transient drift (a dirty `main`, a mid-fetch tree) does not mint a
  node. Reset the sidecar on any successful precondition pass.
- Id: `tactic-invalid-state-<8hex>`, where `<8hex>` is the first 8 hex chars of
  a sha256 over `<kind>:<precondition-slug>` — stable across ticks, so the id
  itself is the dedup key.
- Any reader of these ids MUST use an **anchored** regex
  `^tactic-invalid-state-[0-9a-f]{8}$`, never a bare prefix test. An unanchored
  prefix match is a known live production bug: see
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:88-120`
  and the postmortem in `intentions/tactic-main-red-sync-completion-test.md`'s
  rationale, where a prefix match caught an unrelated hand-authored tactic id
  and deadlocked auto-merge for weeks.
- Find-or-create: reuse the three-way classify/mint/edit-in-place idiom
  documented at `.claude/skills/dispatch-diagnose-main/SKILL.md:80-135` — a
  `node --import tsx/esm -e` `readNode` classify into `open` / `closed` /
  `absent`; `absent` (and `closed`) mint a full schema-valid node JSON via
  `packages/intentionsutil/scripts/write-node.ts --file` +
  `packages/intentionsutil/scripts/graph-commit`; `open` edits in place with a
  `--base` CAS token. `hold-node` is deliberately NOT reusable here: it requires
  a source node to carry the `blocked_by` edge, and this case has none — say so
  in the comment so a later reader does not "fix" it.
- The minted node: `kind: tactic`, `owner: ai`, `status: raw`,
  `serves: [strategy-graph-native-dispatch]`, born-parked with
  `office_hours.reason` naming the failing precondition and its observed values,
  and `office_hours.recommendation` naming the concrete operator act.
  Born-at-birth context is a standing condition of this strategy: everything a
  fresh office-hours sitting needs must be in the node, because session
  attach/resume is not a recovery path.
- Bound: at most one latch per router invocation; a mint failure is logged and
  never changes the router's exit code for the node it was called about.

**Tests.** First failing observation → no mint; second consecutive → exactly one
mint with the expected id and a schema-valid node (assert by running
`write-node.ts` / `validate-graph` against a scratch intentions dir); a third
observation with the latch `open` → an edit-in-place, not a second node; a
successful precondition pass resets the sidecar; the anchored-regex reader
rejects `tactic-invalid-state-lane` (this very node's id shares the prefix — a
direct regression test for the unanchored-prefix bug class).

**Dependencies:** Unit 3.

**Recommended model:** opus — graph-minting from an unattended sweep, with a
known catastrophic prefix-matching precedent to avoid.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:945-1050` —
  `worktree_has_live_session`; its single-fetch two-name match, `exclude_sid`
  semantics, fail-safe UNKNOWN fold and `done`-holder diagnostic are extended,
  not rewritten (Unit 1).
- `lib-claude-agents.sh:~1052-1145` — `claude_session_id_is_live` /
  `CLAUDE_SESSION_ID_LIVE_STATE`: the four-state verdict vocabulary
  (`live|stopped|absent|unknown`) the new classifier's token set mirrors.
- `lib-claude-agents.sh:1292-1300, 1355-1394` —
  `claude_agents_count_held_for_debug` and
  `claude_agents_list_terminal_workers`: the terminal-state enumeration
  (deduplicate into one definition) and the candidate lister for Unit 4.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:307`
  `standdown_exists`, plus `claude_agents_list_duplicate_node_names` — the
  stand-down interlock the router's mechanical tier reuses (rationale at
  `lib-frozen-session-park.sh:649-661`).
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:457-460,
  217-243, 784-798` — `skip_note`, `_selection_log_emit`, the claimed-set block.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-scope-sweep:1-40` —
  the pre-selection sweep template (claimed-set invariant, UNKNOWN posture,
  decision/landing split) Unit 4 copies.
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:555-571` — the
  wiring slot and its best-effort echo idiom.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:250-388`
  (case 11: intervention-first, sidecar strikes, `hold-node` at cap; the spawn
  cwd and `--name` reap-contract comments at 296-322) and `:409-460` (case 14:
  no mechanical tier, escalate on first occurrence). `CONFLICT_STRIKE_CAP` at
  `:145`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:19-96` — the
  spawn interface (`--no-verify --name --cwd --model <prompt>`) and its exit
  codes.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` — the
  provenance guards (`:324-352`), the base-blob pin (`:489-500`, `:1038-1050`),
  the landing-proof + marker-deletion block (`:1181-1235`), and the two
  decision-record helpers (`:236-264`, `:594-624`).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1867` `resolve_project_root`,
  `:1885` `assert_primary_checkout_on_main`.
- `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:76`
  `decision_log_append` (always behind a `command -v` guard).
- `.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh:30-45` — the
  "token on stdout, always return 0" tri-state contract the new classifier
  mirrors.
- `packages/intentionsutil/scripts/hold-node:1-100` (`--kind
  provision-conflict|fix-attempt-cap|worktree-residue`, born-parked hold +
  idempotent `blocked_by`, one `graph-commit`, never `office_hours` on the
  source), `packages/intentionsutil/scripts/hold-node-decide.ts` (the
  network-free decision half), `packages/intentionsutil/src/holds.ts:66`
  `RESOLUTION_SENTENCE` (any hold recommendation must carry it verbatim, never a
  paraphrase).
- `packages/intentionsutil/scripts/park-node` — the fresh-`origin/main`
  invariant, `--base` CAS token and write-failure rollback the escalation tier
  must keep using.
- `packages/intentionsutil/scripts/mark-node-terminal:1-80` — the disposition
  vocabulary the intervention session must declare on every terminal path.
- `packages/intentionsutil/scripts/apply-fix-state.ts` `--check-cap` /
  `FIX_ATTEMPT_CAP` (`packages/intentionsutil/src/transitions.js`) — the
  bounded-attempt-counter precedent the intervention cap mirrors.
- `.claude/skills/dispatch-diagnose-main/SKILL.md:80-135` — the find-or-create
  classify/mint/edit-in-place latch idiom (Unit 6).
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:88-120`
  — the anchored latch-id regex and the always-exit-0 /
  UNKNOWN-never-silently-healthy contract.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — the
  shared shell-test harness (`assert_eq`, `report_results`, decision-log and
  systemd leak guards) every new test file sources.
- `.claude/hooks/dispatch-stop.sh:18-20, 38-93` — the record of why no park/hold
  call may live in the Stop hook.

## Verification

Both auto-runnable checks below must pass from the worktree root. The dispatch
shell suite is the primary oracle: `--pr-scripts` runs every `test-*.sh` in
`.claude/skills/dispatch-propagate/scripts/`, including the three new files and
the three extended ones.

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The intentionsutil unit suite is unchanged by this plan but is cheap insurance
that no primitive contract was disturbed:

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual and judgment checks:

- **Doctrine grep (no park on a retry-shaped state).** Confirm
  `dispatch-invalid-state-route` contains no `park-node`, `hold-node`,
  `graph-commit`, or `claude rm` invocation outside the Unit 6 fleet-latch
  block, and that the kind table's `retry` rows cannot reach a `park-node` call
  path. The router's escalation this round is exit code 10 only.
- **No reap.** Confirm no file changed by this work invokes `claude rm`. The
  lane surfaces and routes; only the intervention session or a human reaps
  (2026-07-31 clarification).
- **Degradation while the sibling is unbuilt.** With
  `.claude/skills/dispatch-invalid-state/` absent (the state on landing), run a
  tick end to end against a fake registry containing one terminal worker and
  confirm the observable behavior is identical to today's: the sweeps park as
  before, the selector still skips, and the only new artifacts are the
  `terminal-session` skip reason and the router's `10 (skill absent)` log lines.
- **Observe in production, one tick.** After merge, on the next real tick with a
  terminal-held node, check `journalctl` for the `invalid-state:` summary line
  and the decision log for a record whose skipped reason is `terminal-session`.
  A node previously skipped forever as `live-session` must now be attributable.
  Nothing should be parked that would not have been parked before.
- **Non-regression on the frozen-session path.** Confirm from the tick journal
  that a genuinely denial-frozen node still reaches `office_hours` (routed
  candidates are *deferred*, and with the intervention tier inert every
  candidate must fall through to the existing park).
- The PR title must be `tactic-invalid-state-lane: <short description>` — the
  literal node id verbatim, per the standing PR-title condition.

## needs-main residue

- id: 16
  title: One real tick with a terminal-held node routes through the lane and behaves identically to today
  url_path: current
  expected_outcome: Observable behavior identical to pre-merge, with two new artifacts present — the `terminal-session` skip reason and the router's skill-absent log lines. On the next real `dispatch-select-tick` with a genuinely terminal-held node, the tick journal shows the `invalid-state:` prefixed summary line (`candidates=… intervened=… kept=… escalate-deferred=…`), the router logs its skill-absent line and exits 10, the defensive sweep then parks exactly as it would have before this PR, the selector reports `terminal-session` rather than `live-session` for that node, and no node is spawned into, no session reaped, and no fleet-latch node minted.
  finding: This is the node's own declared "Observe in production, one tick" planned deferral (see the Verification section above) — not a defect found by QA. All 15 script-verifiable QA items passed this qa-fix pass (router exit-code contract, mechanical-tier keep/escalate logic, the retry/human class discrimination, the anchored fleet-latch regex, the lane-never-reaps grep, the unchanged park-machinery fallback, and the full 675-assertion PR-scripts suite plus 820/820 intentionsutil vitest), giving strong static/test confidence this production observation will also hold. Recorded here per the disposition workflow's needs-main routing for planned-deferral items.
  Verifiability: WAIT — awaits a future tick episode where the live registry holds a genuinely terminal-held node (a session that ended without declaring a disposition but is still registered); no such episode has occurred yet against this PR's merged code.
  Check: `journalctl` (or the tick-log equivalent) grep for a `dispatch-select-tick` run whose output contains `invalid-state:` — confirm it names a `terminal-session` skip in `graph-select-target`'s stderr and a matching decision-log record with disposition `terminal-session` / `routed-to-lane` / `kept-by-lane`, cross-referenced against `dispatch-invalid-state-route`'s own stderr line naming the skill-absent escalation.
