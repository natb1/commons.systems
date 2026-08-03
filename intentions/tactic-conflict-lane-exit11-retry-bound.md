---
id: tactic-conflict-lane-exit11-retry-bound
kind: tactic
statement: "Bound the exit-11 conflict-lane kicks: a Lane 3 dispatch-conflict
  session that stops without declaring a terminal disposition must still reach a
  tracked hold — today it silently freezes its node forever, with the conflict
  unresolved and nothing recorded in the graph"
owner: ai
status: codified
parent: null
rationale: "Byproduct of a review-fix pass on PR #2977
  (tactic-dispatch-conflict-branch-merge-lane), finding residue-3:
  dispatch-graph-execute's case 11 now spawns a /dispatch-conflict Lane 3
  session on every provision exit 11, and the pre-existing CONFLICT_STRIKE_CAP
  strike-then-hold ladder only bounds a launch FAILURE, leaving a
  launched-but-stuck Lane 3 session uncounted. Filed as a deferred, unverified
  finding pending 'production observation' to confirm whether such a session
  holds a permanent live-session slot or respawns per tick. Finalized 2026-07-31
  via /align-tactics (tactic mode, draft/raw finalize): the question is settled
  from landed code, not observation — worktree_has_live_session now reads the
  REGISTERED (--all) view with no timeout (tactic-stopped-session-blocks-node,
  already on origin/main), so a Lane 3 session that dies without a node-terminal
  marker HOLDS and graph-select-target skips the node forever; there is exactly
  ONE kick per freeze episode, never accumulation. The defect is therefore a
  SILENT permanent stall with no graph record, not unbounded retries. The fix
  moves out of the selection-side path entirely into an external tick sweep
  (Unit 2's lib-conflict-lane-hold.sh, modeled on lib-standdown-recheck.sh) that
  detects a stuck conflict-lane session via a producer-scoped sidecar marker
  (Unit 1) and escalates via the existing hold-node primitive
  (tactic-mechanical-park-producers, --kind provision-conflict — reused, not a
  new kind), wired into dispatch-tick on both cadences (Unit 3). Explicitly NOT
  superseded by tactic-review-stall-conflict-lane per the author's 2026-07-29
  /align-strategy ratification ('bounds ineffective lane kicks ... remains the
  backstop for a lane that runs and does not resolve'); disjoint from
  tactic-denied-command-parks-node (PR #2994, unmerged, detects a LIVE session
  blocked at a permission prompt, not a terminal held one) and from
  tactic-node-worker-fresh-skill-body (a different exit-11 fix, checkout
  currency); built to converge cheaply with
  tactic-graph-router-conflict-routing's future execution.conflict interrupt
  (depends on case 11 for exactly the marker write). attention.boost preserved
  unchanged at 20 per the finalize contract."
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
  tier: 1
phase: qa
execution:
  branch: tactic-conflict-lane-exit11-retry-bound
  pr: 3018
  attempts: {}
  markers:
    - planned
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
# Bound the exit-11 conflict-lane kicks: a Lane 3 dispatch-conflict session that stops without declaring a terminal disposition must still reach a tracked hold — today it silently freezes its node forever, with the conflict unresolved and nothing recorded in the graph

## Context

`dispatch-graph-execute` (`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`)
routes each node's `provision-node-worktree` exit code. On **exit 11**
(merge-conflict) the first responder is a `/dispatch-conflict` **Lane 3**
session, spawned at `dispatch-graph-execute:308-310` with
`--name "$id" --cwd "$PROJECT_ROOT/.claude/worktrees/$id"`. On a successful
spawn the code at `:311-316` does exactly four things — `rm -f "$STRIKE_FILE"`,
`hand_off_reservation "$id"`, `echo "conflict-lane $id"`, `continue` — and
tracks nothing further. The `CONFLICT_STRIKE_CAP=5` strike-then-hold ladder
(`:145`, `:319-374`) only runs in the `else` branch where the **spawn call
itself failed**. A lane that launches but never resolves is counted nowhere.

**What actually happens then — settled by reading the code, not speculation.**
The node node body's Provenance section says this "needs production observation
to confirm"; it does not. The current code answers it:

1. Lane 3 is spawned with `--name "$id"`, so `.claude/hooks/dispatch-stop.sh`
   discriminator 2 (`dispatch-stop.sh:57-63`) matches it as a graph-native node
   worker and hands it to `dispatch-self-close --node "$id"`
   (`dispatch-stop.sh:100-116`).
2. `dispatch-self-close` reaps (`claude rm`) **only** on a
   `$CLAUDE_JOB_DIR/node-terminal` marker naming that node
   (`dispatch-self-close:99-102, 210-213`). Lane 3 writes one on both of its
   declared terminal paths — but not when it dies on an API error, exhausts
   context, or crashes. Absent the marker the job is **HELD**: not reaped, row
   left in the daemon registry.
3. `worktree_has_live_session` now reads the **REGISTERED** view
   (`claude agents --json --all`, via `claude_agents_list_registered` at
   `lib-claude-agents.sh:673`) — see its contract at
   `lib-claude-agents.sh:102-145`: *"a session that has STOPPED but has not been
   `claude rm`'d still occupies its worktree … NO TIMEOUT. The block is
   permanent until a human releases it with `claude rm <id>`."*
4. `graph-select-target:684` skips any node whose worktree
   `worktree_has_live_session` reports occupied.

So the failure mode is **not** unbounded per-tick kicks: there is exactly **one**
Lane 3 launch per freeze episode, after which the node is permanently
unselectable and case 11 never fires for it again. The real defect is the
opposite of noisy — it is **silent**: the conflict stays unresolved, one
live-session slot stays consumed forever, and **nothing is written to the graph**.
No hold node, no `blocked_by` edge, no `office_hours`, no decision-log record.
The node simply vanishes from the lane until a human happens to notice.

The statement's requirement — *"must still reach a tracked hold"* — is therefore
the right requirement, reached by a different mechanism than a strike counter in
case 11. A per-tick counter there is provably dead code for this failure: case 11
is never re-entered for a node whose slot is held.

**Greenfield design (what to build from scratch).** The invariant worth
enforcing is general: *a node worktree blocked by a registered session that can
no longer make progress must carry a tracked hold in the graph.* Registration is
the claim and is released only by a human `claude rm` — that is deliberate
(`lib-claude-agents.sh:140-144`, "Accumulation of held nodes is the intended
trade"), so the fix must **never** auto-release a session. It must make the block
**visible and actionable** instead. The enforcement point cannot be inside
`dispatch-graph-execute` (which only runs for *selected* nodes, and a held node
is never selected); it must be an **external sweep over the tick**, exactly like
`standdown_recheck_sweep` (`lib-standdown-recheck.sh:394`) and
`reservation_sweep` (`lib-reservation-ledger.sh:415-524`).

**Scope of this tactic (brownfield/interim narrowing).** This tactic owns the
conflict-lane producer only, per its statement. The general form would overlap
two in-flight siblings, so the sweep is built **general in shape but narrowed by
a producer marker**: case 11 drops a `.claude/worktrees/<id>.conflict-lane`
sidecar on a successful kick, and the sweep only escalates nodes carrying that
marker. Widening later is deleting the marker filter. Disambiguation for the
corpus (both siblings also touch "exit-11 conflict-lane" territory — name them in
the PR body):

- `tactic-node-worker-fresh-skill-body` — a *different* exit-11 conflict-lane
  fix (checkout currency, `--cwd "$PROJECT_ROOT"`). Not this.
- `tactic-denied-command-parks-node` (PR #2994, phase `qa`, **not merged**) —
  parks a node whose session is frozen **live** at a permission prompt
  (`state == "blocked"`). Disjoint from this tactic's condition (session in a
  **terminal** state, held un-reaped). Do **not** depend on its unmerged files.
- `tactic-graph-router-conflict-routing` (phase `implement`) — will replace
  case 11 wholesale with an `execution.conflict` interrupt
  (`dispatch-graph-execute:274-281` CONVERGENCE NOTE). This plan is built for
  that: the sweep depends on case 11 for exactly **one line** (the marker write).
  When the interrupt lands it keeps writing the same marker and the sweep is
  untouched.

Intended outcome: a Lane 3 session that dies without declaring a disposition
produces, within one tick after its grace window, a born-parked hold tactic
(`tactic-hold-conflict-<slug>`) blocking the source, whose recommendation names
`claude rm <session-id>` verbatim as the human's own required act.

---

## Unit 1 — case 11 writes a `.conflict-lane` marker; exit 0 and the backstop clear it

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`
only (plus its test file). Three edits, all in the existing `case "$prov_rc"`:

1. Declare the sidecar path beside the existing strike-file declaration at
   `:289` (`STRIKE_FILE="$PROJECT_ROOT/.claude/worktrees/$id.conflict-strikes"`):
   `LANE_FILE="$PROJECT_ROOT/.claude/worktrees/$id.conflict-lane"`. Same
   convention as `.conflict-strikes` and `provision-node-worktree:124`'s
   `.scope-fingerprint`: a plain file **outside every checkout**, so it never
   dirties a tree and is never a graph write; **fail-open** on loss (losing it
   just means no hold is ever raised for that episode — never a spurious one).

2. In the **successful-kick** branch (`:308-317`, between the existing
   `rm -f "$STRIKE_FILE"` at `:311` and `hand_off_reservation "$id"` at `:314`),
   write the marker atomically:
   `printf 'spawned=%s\n' "$(date -u +%s)" > "$LANE_FILE"` — one fixed line so a
   reader can `sed -n 's/^spawned=//p' | head -n1` (the parse shape
   `lib-standdown-recheck.sh:44-51` documents for its markers). Overwrite, do not
   append: a later kick for the same node starts a new episode. The write is
   best-effort — guard it `|| echo "dispatch-graph-execute: WARNING: could not
   write $LANE_FILE; a stuck conflict lane for $id will not be escalated" >&2`
   and never let it change the branch's disposition (`echo "conflict-lane $id"`,
   `continue`, exit code) — the worker is already launched.

3. Clear the marker at the two points that mean "this episode is over":
   - **exit 0** (`:230-235`): add `rm -f` of the `.conflict-lane` path next to
     the existing `rm -f "$PROJECT_ROOT/.claude/worktrees/$id.conflict-strikes"`
     at `:235`. This is **load-bearing for correctness, not tidiness**: a
     successful provision is what precedes every phase-worker spawn, and phase
     workers carry the *same* `--name "$id"`. Clearing here guarantees the sweep
     can never misattribute a later phase worker's stuck session to the conflict
     lane.
   - **backstop hold success** (`:367`, next to `rm -f "$STRIKE_FILE"`): the
     launch-failure ladder already raised the hold for this node; the marker
     would only produce a second escalation for the same state.

**Out of scope:** any change to `CONFLICT_STRIKE_CAP`, the strike ladder's
counting or hold text, cases 10/12/13/14, the spawn arguments, and anything
outside this file.

**Tests** — extend
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`
(harness described at its lines 1-60; case 5 at `:201-247` is the exit-11 case to
extend; `MAIN_WT/.claude/worktrees` is the sidecar dir the fixture already uses):

1. Case 5 (successful kick) additionally asserts `<MAIN_WT>/.claude/worktrees/tactic-c.conflict-lane`
   is **present** and its content matches `^spawned=[0-9]+$`.
2. A pre-existing marker is **overwritten** (not appended) by a second kick.
3. Provision exit 0 with a pre-seeded marker → marker **gone**, and the existing
   exit-0 assertions still hold.
4. Case 5b (`:254-281`, cap-th run with an unlaunchable lane) with a pre-seeded
   marker → after the `hold-node` call succeeds the marker is **gone**.
5. Exit 14 with a pre-seeded marker → marker **untouched** (case 14 must not
   acquire marker semantics it does not own).

**Recommended model:** sonnet.

---

## Unit 2 — `lib-conflict-lane-hold.sh`: the sweep that turns a stuck lane into a tracked hold

**Scope.** One new file,
`.claude/skills/dispatch-propagate/scripts/lib-conflict-lane-hold.sh`, a
sourceable library exporting exactly one function,
`conflict_lane_hold_sweep`, plus one new test file. No consumer wiring in this
unit (Unit 3 does that).

**Structure, error posture and header-comment style copy
`lib-standdown-recheck.sh`** (whole-file `_LIB_CONFLICT_LANE_HOLD_LOADED` guard
at `lib-standdown-recheck.sh:209-210`, `set -uo pipefail` with **no** `set -e`,
tunables resolved **once** at the top of the function with the integer-guard
idiom at `lib-standdown-recheck.sh:397-408`, one greppable stderr line per
node per pass, exactly one summary line, and **`return 0` on every path** — this
is containment/observability, never a gate, so an unqueryable daemon, an
unresolvable root, or a failed `hold-node` must all still return 0).

`conflict_lane_hold_sweep` — no arguments. Steps:

1. **Resolve the sidecar directory.** `MAIN_WT` from
   `resolve_main_worktree` (`lib-graph-worktree.sh:27-42`, honors
   `DISPATCH_GRAPH_MAIN_WORKTREE`) — the *same* resolver
   `dispatch-graph-execute:118` uses, so the sweep and the producer agree on the
   root byte-for-byte. Overridable for tests by
   `DISPATCH_CONFLICT_LANE_ROOT`. If it cannot be resolved: one stderr line,
   `return 0`. Sidecar dir = `$MAIN_WT/.claude/worktrees`.
2. **Enumerate candidates.** Every file matching `*.conflict-lane` in that dir
   (skip dotfiles and `.tmp*`, as `reservation_sweep` does). Zero candidates →
   emit the summary line and `return 0` **without any daemon query** — the
   common case must cost nothing.
3. **Tunables** (integer-guarded, each with the `lib-standdown-recheck.sh:397-408`
   fallback idiom):
   - `DISPATCH_CONFLICT_LANE_NOW_EPOCH` — test clock, default `date -u +%s`.
   - `DISPATCH_CONFLICT_LANE_GRACE_S` — default **1800**. Transcript idle time a
     stuck lane must exceed. Deliberately larger than the stand-down sweep's 900:
     a conflict lane runs long-lived subagents, and a *mid-turn yield* also
     produces a HOLD from `dispatch-self-close`, so the grace is the guard
     against escalating a lane that is still working.
   - `DISPATCH_CONFLICT_LANE_HOLD_MAX` — default **3**. Holds per sweep;
     `hold-node` pushes to `main` through `graph-commit`'s landing lock, so an
     unbounded batch would serialize N pushes inside one tick. Excess is logged
     and picked up next tick.
   - `DISPATCH_CONFLICT_LANE_PROJECTS_ROOT` — default `$HOME/.claude/projects`
     (mirrors `DISPATCH_RECLAIM_PROJECTS_ROOT`, `dispatch-reclaim-audit:119`).
   - `DISPATCH_CONFLICT_LANE_HOLD_NODE` — default
     `$MAIN_WT/packages/intentionsutil/scripts/hold-node`. It **must** be the
     copy under the main worktree: `hold-node` derives its `REPO_ROOT` from its
     own script path (`hold-node:56-57`).
4. **Per candidate**, in this exact order — each branch logs one stderr line and
   `continue`s; nothing below runs on a miss:
   1. **Node-id shape.** `id` = basename minus the `.conflict-lane` suffix; it
      must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (the identical validation at
      `dispatch-graph-execute:174`). Otherwise `unsafe-id`, keep the file, next.
   2. **Registry rows for this name.** `claude_sessions_with_name_all "$id"`
      (`lib-claude-agents.sh:496`) → `sessionId<TAB>state` per row, from the
      `--all` REGISTERED view. Non-zero = UNKNOWN → log
      `daemon unqueryable; observing <id>` and next (**never** escalate or GC on
      UNKNOWN). **Split each line by hand** (`sid="${line%%$'\t'*}"`,
      `state="${line#*$'\t'}"`) — `IFS=$'\t' read` collapses runs of tabs and the
      daemon reports `null` fields as empty, which is exactly the held session
      this sweep exists to see; `lib-standdown-recheck.sh:459-468` documents this
      trap and its fix.
   3. **Zero rows → GC.** The lane's session was reaped (resolved normally, or
      already `claude rm`'d). Remove the marker **only if** the marker is older
      than the grace (`now - spawned >= grace`); a younger marker with no row is
      the spawn/registration lag window (case 11 spawns with `--no-verify`), so
      keep it. Log `cleared` or `observing (awaiting registration)`.
   4. **Any live row → observe.** For each sid, `claude_session_id_is_live "$sid"`
      (`lib-claude-agents.sh:893`) and read `CLAUDE_SESSION_ID_LIVE_STATE`
      (`live` | `stopped` | `absent` | `unknown`). If **any** row is `live` or
      `unknown`, log `observing <id> (session <sid> state=<s>)` and next. Reuse
      this predicate rather than re-enumerating terminal state names — the
      enumeration already exists in two places
      (`claude_session_id_is_live`, `claude_agents_count_held_for_debug`) and a
      third copy would be free to drift.
   5. **All rows `stopped` → candidate.** Pick the newest such sid (registry
      order, last wins) as the reported holder.
   6. **Idle grace.** Locate the transcript with
      `find "$PROJECTS_ROOT" -mindepth 2 -maxdepth 2 -name "<sid>.jsonl"` (keyed
      on the globally-unique session id; prior art for the projects-root walk is
      `dispatch-reclaim-audit:245-292`), take the newest `mtime`
      (`stat -c %Y`), `idle=$(( now - mtime ))`. No match or `stat` failure =
      UNKNOWN → log
      `keeping <id> (transcript unreadable — idle time unmeasurable)` and next:
      **never escalate without positive evidence of staleness.** `idle < grace`
      → log `observing` and next (a negative/future idle is `< grace`, the safe
      direction).
   7. **Cap.** `held_count >= hold_max` → log `deferring <id>` and next.
   8. **Hold.** `mktemp -d`; write reason and recommendation files; call
      `"$HOLD_NODE" "$id" --kind provision-conflict --reason-file <f>
      --recommendation-file <f>`; `rm -rf` the tmpdir. **Reuse
      `--kind provision-conflict`** — do not add a hold kind. The underlying
      state *is* the unresolved provision conflict, the kind vocabulary is a
      closed enum (`hold-node-decide.ts:63-75`; the reserved `no-progress` slug
      at `:57-61` is explicitly earmarked for a different tactic), and sharing
      the kind means this hold and the launch-failure backstop's hold resolve to
      the **same** id `tactic-hold-conflict-<slug>` — one hold per node per
      conflict, with `decideHold`'s `EXISTING` disposition appending an
      occurrence stanza instead of forking a second record.
      - Reason (substitute the observed values; state facts, do not assert what
        the lane did or did not accomplish):
        `This tactic's branch did not merge clean (provision exit 11) and the /dispatch-conflict Lane 3 session dispatched to resolve it has stopped without declaring a terminal disposition: 'claude agents --json --all' reports session <sid> for '<id>' in state <state>, its transcript has had no activity for <idle>s, and no node-terminal marker was written — so dispatch-self-close held the job instead of reaping it. A registered session keeps claiming its node by design, so '<id>' is skipped by every selection tick until that job is removed by hand: the conflict is unresolved and nothing autonomous will retry it.`
      - Recommendation — it **must name the manual reap verbatim**, because
        nothing autonomous will ever perform it (`dispatch-self-close` holds,
        `worktree_has_live_session` has no timeout by design):
        `First release the node: 'claude rm <sid>'. A stopped-but-not-removed session keeps blocking its node by design and nothing autonomous reaps it. If the session's transcript holds work worth keeping, attach it first ('claude attach <sid>'). Then resolve the conflict: run '/dispatch-conflict <id>' by hand (Lane 3 reproduces and resolves the merge on the node's own branch; it merges origin/<id> before reproducing the origin/main merge, which covers both causes of exit 11), or resolve it directly in .claude/worktrees/<id> and push the branch. Then resolve THIS HOLD TACTIC to 'phase: done' and prune it — clearing 'office_hours' alone does not unblock the source. 'resolve-hold <id> --kind provision-conflict' does the resolve and the source's blocked_by clear in one landed write.`
      - On exit 0: `rm -f` the marker (one hold per episode), increment
        `held_count`, log `held <id> (stuck conflict lane, idle <idle>s, session <sid>)`.
      - On any non-zero exit: **keep** the marker, log
        `hold failed for <id> (hold-node exit <rc>); will retry next tick`, next.
        A failed hold is never fatal to the sweep or the tick.
   9. **Decision-log record** for every candidate that reached step 4.8 (held or
      hold-failed). Source `lib-decision-log.sh` guarded
      (`... 2>/dev/null || true`, as `dispatch-select-tick:99` does) and call
      `decision_log_append` behind
      `command -v decision_log_append >/dev/null 2>&1 && ... || true`
      (`dispatch-select-tick:141`). Build with `jq -c -n --arg`:
      `{ts, site: "conflict-lane-hold", node, session, state, idle_seconds, disposition}`
      where `disposition` is `held` or `hold-failed`.
5. **Summary line.** One final stderr line:
   `lib-conflict-lane-hold: swept <n> marker(s): <held> held, <observing> observing, <cleared> cleared, <deferred> deferred`.

**Out of scope:** any change to `lib-claude-agents.sh`, `dispatch-graph-execute`,
`hold-node`, `hold-node-decide.ts`, or `dispatch-tick`; any auto-reap of a
session (`claude rm` is the human's act — never call it here); any `park-node`
call on the source (doctrine: the hold carries the park, the source's
`office_hours` is never written).

**Tests** — new file
`.claude/skills/dispatch-propagate/scripts/test-lib-conflict-lane-hold.sh`,
harness copied from `test-lib-standdown-recheck.sh` (see its header, lines 1-20,
and `ca_setup`-style setup/teardown at `:60-95`): fake `claude` via
`CLAUDE_AGENTS_CMD` printing a controlled registry array, sidecar dir via
`DISPATCH_CONFLICT_LANE_ROOT`, transcripts via
`DISPATCH_CONFLICT_LANE_PROJECTS_ROOT` with `touch -d`-set mtimes, `hold-node`
stubbed via `DISPATCH_CONFLICT_LANE_HOLD_NODE` (a script logging its argv and
exiting `$HOLD_RC`), clock via `DISPATCH_CONFLICT_LANE_NOW_EPOCH`. Assertions
use `test-helpers.sh`. Cases:

1. No markers → no daemon query at all (point `CLAUDE_AGENTS_CMD` at a script
   that exits 1 and assert the sweep still returns 0 and logs no unqueryable
   line), summary says 0 markers.
2. Marker + a `working` row → `observing`, no hold, marker kept.
3. Marker + a `done` row, transcript idle > grace → **one** `hold-node` call with
   `<id> --kind provision-conflict`, reason file containing the sid and
   `provision exit 11`, recommendation containing the literal `claude rm <sid>`
   **and** `resolve-hold <id> --kind provision-conflict`; marker removed.
4. Same, but transcript idle < grace → no hold, marker kept.
5. Same, but no transcript file → no hold, marker kept, `unmeasurable` logged.
6. Marker + zero rows, marker age > grace → marker removed, no hold.
7. Marker + zero rows, marker age < grace → marker kept, no hold.
8. Daemon UNKNOWN (fake `claude` exits non-zero) with an aged marker → no hold,
   no GC, marker kept.
9. Two `done` rows for one name → exactly one hold.
10. Four eligible markers with `DISPATCH_CONFLICT_LANE_HOLD_MAX=2` → exactly 2
    `hold-node` calls, 2 `deferring` lines, the two deferred markers kept.
11. `hold-node` exits 1 → marker **kept**, `hold failed` logged, sweep returns 0.
12. A marker whose basename fails the node-id regex → no daemon query for it, no
    hold, file kept, `unsafe-id` logged.
13. Decision-log: with `DISPATCH_DECISION_LOG_DIR` set, a held candidate appends
    one JSONL record with `site == "conflict-lane-hold"`.
14. `conflict_lane_hold_sweep` returns 0 in every case above.

**Recommended model:** opus — the rule ladder's ordering is the correctness
property, the fail-safe posture (UNKNOWN never escalates, never GCs) has to be
right on every branch, and the TSV/`null`-field parse trap is the kind of detail
that silently disables the whole sweep if it is fumbled.

**Dependencies:** Unit 1 (the sweep reads the marker Unit 1 writes; the tests
fabricate markers directly, so the units can be *written* in parallel, but
Unit 1 must land for the sweep to ever fire).

---

## Unit 3 — wire the sweep into `dispatch-tick` (both cadences) and into CI

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-tick` and
`.github/workflows/unit-tests.yml`.

1. **Normal path.** Insert the call immediately **after** the stand-down
   re-check sweep block (`dispatch-tick:475-490`) and **before** Step 1 target
   selection (`:492`). Placement matters for the same two reasons that block
   documents: it runs after both daemon snapshots are captured (`:438-472`) so
   its registry reads are snapshot-backed rather than extra round-trips, and
   before selection so a hold it lands on `main` is visible to this tick's own
   selection. Use the identical conditional-source + verify + loud-failure idiom
   (`if ! declare -f conflict_lane_hold_sweep >/dev/null 2>&1; then source
   "$SCRIPT_DIR/lib-conflict-lane-hold.sh"; fi`, then call it with `1>&2`, else
   `echo "dispatch-tick: lib-conflict-lane-hold.sh failed to load; stuck
   conflict lanes NOT swept this tick" >&2`). Do **not** absorb the load failure
   with `|| true` — the sweep's contract is "always returns 0", so a non-zero
   status can only mean the source failed (`.claude/rules/code-style.md`).
2. **Paused branch.** Add the same block to the pause branch
   (`dispatch-tick:276-322`), after `standdown_recheck_sweep` and before the
   `echo "dispatch-tick: paused …"` / `exit 0` at `:320-322`. Rationale, verbatim
   from the two sweeps already there: the pause sentinel gates worker
   **spawning**, never bookkeeping, and this `exit 0` is the only autonomous path
   that never reaches the normal-path sweeps — a lane that froze before a pause
   would otherwise stay invisible for the whole pause. Note in the comment that
   on this branch no snapshot exists yet, so the sweep's registry reads fall
   back to live per-call queries (bounded by the marker count, normally zero).
3. **CI.** Add a step to `.github/workflows/unit-tests.yml` in the same
   scripts job that runs the other dispatch script suites (pattern at `:221-222`,
   `- name: Run dispatch-graph-execute tests` /
   `run: .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`):
   `- name: Run conflict-lane hold sweep tests` running
   `.claude/skills/dispatch-propagate/scripts/test-lib-conflict-lane-hold.sh`.

**Out of scope:** any change to the existing sweeps' call sites or ordering; any
change to snapshot capture; wiring `test-lib-standdown-recheck.sh` /
`test-lib-claude-agents.sh` into CI (they are unwired today — a real gap, but
another node's).

**Tests** — extend
`.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh`: assert the
paused branch invokes `conflict_lane_hold_sweep` (stub the lib on the fixture's
script dir and assert its call log), and that a normal tick invokes it exactly
once before `dispatch-select-tick` runs. If the existing fixture cannot observe
ordering, assert invocation only and verify ordering by inspection.

**Recommended model:** sonnet — rote wiring against two explicit call-site
templates in the same file.

**Dependencies:** Unit 2.

---

## Reuse

- `hold-node` — `packages/intentionsutil/scripts/hold-node` (usage at `:33-52`;
  already the exit-11 backstop's escalation at `dispatch-graph-execute:365-366`
  and case 14's at `:446-447`). Interface: `hold-node <source-id> --kind
  provision-conflict --reason-file <f> --recommendation-file <f>`; stdout
  `held <hold-id> (<disposition>)`; exit 0 landed / 1 write-or-CAS failure /
  2 usage. Invent no new hold mechanism.
- `hold-node-decide.ts` — `HOLD_KINDS` / `KIND_SLUGS` (`:63-75`), `holdIdFor`
  (`:124-138`, `tactic-hold-conflict-<slug>`), `decideHold` dispositions
  NONE/EXISTING/REOPENED (`:229-273`). Read-only here; the plan deliberately adds
  no kind.
- `resolve-hold` — `packages/intentionsutil/scripts/resolve-hold` (usage `:78`):
  `resolve-hold <source-node-id> [--kind provision-conflict]`. Named in the
  recommendation text, exactly as case 14 names it
  (`dispatch-graph-execute:445`).
- `claude_sessions_with_name_all` — `lib-claude-agents.sh:496`; `--all`
  REGISTERED view, projects `sessionId<TAB>state`.
- `claude_session_id_is_live` + `CLAUDE_SESSION_ID_LIVE_STATE` —
  `lib-claude-agents.sh:877-975`; the single owner of the terminal-state
  enumeration (`done|stopped|killed|failed|errored|error|cancelled|canceled|terminated`)
  and of the UNKNOWN-folds-to-live posture. Do not re-derive either.
- `resolve_main_worktree` — `lib-graph-worktree.sh:27-42`; honors
  `DISPATCH_GRAPH_MAIN_WORKTREE`, the same resolver
  `dispatch-graph-execute:118` uses.
- `standdown_recheck_sweep` — `lib-standdown-recheck.sh:394-…`; the structural
  template for the new lib (load guard `:209-210`, tunable integer-guard idiom
  `:397-408`, per-node one-line stderr dispositions, hand-split TSV parse
  `:459-468`, always-return-0).
- `reservation_sweep` — `lib-reservation-ledger.sh:415-524`; the older sweep
  whose file-enumeration and dotfile/`.tmp` skipping conventions
  `lib-standdown-recheck.sh` itself copies.
- `decision_log_append` — `lib-decision-log.sh:76`; call idiom and `jq -c -n
  --arg` record shape at `dispatch-select-tick:99, 118-141`.
- Sidecar-file convention — `provision-node-worktree:124` (`.scope-fingerprint`)
  and `dispatch-graph-execute:289, 324-328` (`.conflict-strikes`): a plain file
  at `.claude/worktrees/<id>.<suffix>`, outside every checkout, fail-open on
  loss, never a graph write.
- Test harnesses — `test-lib-standdown-recheck.sh` (fake-`claude` +
  env-override fixture), `test-dispatch-graph-execute.sh:1-60` (SUT-copy +
  sibling-stub fixture), `test-helpers.sh` (`assert_eq` / `assert_contains`).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-conflict-lane-hold.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute && bash -n .claude/skills/dispatch-propagate/scripts/lib-conflict-lane-hold.sh && bash -n .claude/skills/dispatch-propagate/scripts/dispatch-tick
```

```verify
.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh
```

Manual / judgment checks:

- **End-to-end dry run, no real freeze required.** Create a scratch marker for a
  disposable node id, point `DISPATCH_CONFLICT_LANE_ROOT`,
  `DISPATCH_CONFLICT_LANE_PROJECTS_ROOT`, `DISPATCH_CONFLICT_LANE_HOLD_NODE` and
  `CLAUDE_AGENTS_CMD` at fixtures, source the lib and run
  `conflict_lane_hold_sweep`. Read the stderr transcript end to end and confirm
  every line names the node and its disposition — the log *is* the operator
  surface for this defect.
- **Confirm the marker is written by the real producer.** With
  `DISPATCH_GRAPH_MAIN_WORKTREE` pointed at a scratch root and stubbed
  `provision-node-worktree` / `dispatch-spawn-job`, run
  `dispatch-graph-execute tactic-x:tactic:implement` on provision exit 11 and
  confirm `.claude/worktrees/tactic-x.conflict-lane` appears with the
  `spawned=<epoch>` line, then that a subsequent exit-0 run removes it.
- **Confirm the hold is human-actionable.** Inspect a hold node this sweep
  actually births (or the reason/recommendation files the stub captured) and
  check by reading that (a) the recommendation names `claude rm <sid>` verbatim
  as the human's own act, (b) it names `resolve-hold <id> --kind
  provision-conflict`, and (c) it carries the mandatory closing sentence about
  resolving the hold to `phase: done` (`RESOLUTION_SENTENCE`,
  `hold-node-decide.ts:92-95`). A recommendation that only *describes* reaping
  is the known failure of this class of hold — nothing autonomous performs it.
- **Observe in production.** After merge, watch the tick journal
  (`journalctl` for the dispatch heartbeat, greppable prefix
  `lib-conflict-lane-hold:`) across a day of ticks. Expected steady state: the
  summary line reporting `0 marker(s)` on almost every tick, a short-lived
  `observing` run while a real conflict lane works, and `cleared` when it
  finishes. A `held` line is the payoff case; verify the named node really is
  stuck (its session is in `claude agents --json --all` in a terminal state) and
  that removing the session plus resolving the hold returns the node to
  selection.
- **Confirm no throughput regression.** The sweep must add zero daemon queries
  on a tick with no markers. Grep a no-marker tick's journal for
  `lib-conflict-lane-hold:` and confirm exactly one summary line and no
  `unqueryable`/`observing` lines.
