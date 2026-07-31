---
id: tactic-denied-command-parks-node
kind: tactic
statement: A worker frozen by an auto-mode classifier denial must park its node
  instead of holding it silently — a denied command leaves the session at state
  blocked / status waiting, which drops it out of
  claude_agents_count_busy_workers (so the concurrency gate sees a free slot)
  while worktree_has_live_session still holds the node, with no timeout, no
  office_hours park and no journal line, making the frozen node invisible to
  every existing fleet check
owner: ai
status: codified
parent: null
rationale: "Observed live 2026-07-31T00:42:30Z during the dispatch-pipeline
  bootstrap, on what was then the fleet's serial critical-path node
  (tactic-dispatch-test-monolith-split). The worker issued a sandbox-off `git
  reset --hard` and the auto-mode classifier denied it; the session went state:
  blocked, status: waiting, waitingFor: \"input needed\", and stayed there. Its
  transcript stopped growing — the denial was the last entry — so the freeze is
  distinguishable from slowness by mtime alone. The denial was gratuitous: the
  worktree was already at the target sha and clean, so the reset was a no-op
  whose only effect was freezing the session. The structural defect is that two
  predicates disagree about the same session: claude_agents_count_busy_workers
  (lib-claude-agents.sh) selects status == busy and so stops counting a waiting
  session, while worktree_has_live_session (graph-select-target:669) matches ANY
  session in the worktree and so keeps holding the node. The router therefore
  sees a free slot and keeps selecting, but every node it wants is pinned by a
  session doing no work — the measured consequence on 2026-07-31T01:50Z was BUSY
  = 1 (the human's own monitoring session) against target_n: 3, with six nodes
  held and zero productive fleet workers. Denial is not rare and not confined to
  gh: within one hour the classifier also denied a compound read-only `gh pr
  list && git ls-remote`, a `claude agents --json | jq` plus `gh pr list` pair,
  and `claude rm <id>` twice having ALLOWED two identical `claude rm` calls
  minutes earlier — so it is nondeterministic across identical inputs and cannot
  be avoided by construction. Routing around a denial is explicitly not the
  remedy; failing loudly is. Filed together with
  tactic-phase-terminal-requires-disposition and
  tactic-standdown-winner-liveness: all three are the same root confusion —
  'held' and 'being worked' are not the same predicate and no code distinguishes
  them — and tactic-router-spawn-window-duplicate-worker is the fourth member,
  spawning a second worker onto a node already claimed. Whoever plans any of
  them should read all four together, because fixing them piecemeal will keep
  producing variants. tactic-stopped-session-blocks-node is adjacent but
  distinct and must NOT be deduped against this node: there the hold is the
  author-stated REQUIREMENT (release is an explicit human act), whereas here the
  hold is an accident of a frozen session. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks. blocked_by is empty, so this Wave A
  promotion lifts no blocker and cannot compound."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    converts a concurrency slot into a permanently frozen node with no
    surfacing, and it was one of the three defects that took measured fleet
    throughput to zero on 2026-07-31 (BUSY = 1, and that one the human's
    monitoring session). blocked_by is empty, so this promotion lifts no blocker
    and cannot compound. Finalized 2026-07-31 by /align-tactics to phase:
    implement with a full clean-session plan in the body; the boost carries over
    unchanged, since attention rank is independent of phase."
phase: qa
execution:
  branch: tactic-denied-command-parks-node
  pr: 2994
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-07-31
    attempt: 2
    pushed_sha: 27b80fad84c5c66234ee90a5d99c021f45c16dcb
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A worker frozen by an auto-mode classifier denial must park its node instead of holding it silently — a denied command leaves the session at state blocked / status waiting, which drops it out of claude_agents_count_busy_workers (so the concurrency gate sees a free slot) while worktree_has_live_session still holds the node, with no timeout, no office_hours park and no journal line, making the frozen node invisible to every existing fleet check

## Context

Observed live **2026-07-31T00:42:30Z** on the fleet's then-serial critical-path
node (`tactic-dispatch-test-monolith-split`). A node worker issued a sandbox-off
`git reset --hard`; the auto-mode classifier denied it; the session went
`state: blocked` / `status: waiting` / `waitingFor: "input needed"` and stayed
there. Its transcript stopped growing — the denial was the last entry.

The structural defect is that two predicates disagree about that one session:

| predicate | reads | effect |
|---|---|---|
| `claude_agents_count_busy_workers` (`lib-claude-agents.sh:600-628`) | `status == "busy"` only | **stops counting it** — the concurrency gate sees a free slot |
| `worktree_has_live_session` (`graph-select-target:669`) | name match, any status | **keeps holding the node** |

So the router sees headroom and keeps selecting, while the nodes it wants are
pinned by sessions doing no work. There is **no timeout, no `office_hours` park,
no journal line and nothing in `routing-decisions.jsonl`** — the frozen node is
invisible to every existing fleet check. Measured consequence at
2026-07-31T01:50Z: `BUSY = 1` (the human's own monitoring session) against
`target_n: 3`, with six nodes held and zero productive fleet workers.

Denial is **nondeterministic across identical inputs** (within one hour the same
classifier denied a read-only `gh pr list && git ls-remote`, a
`claude agents --json | jq` pair, and `claude rm <id>` twice after *allowing*
two identical `claude rm` calls minutes earlier). It cannot be avoided by
constructing commands more carefully, and **routing around a denial is not the
remedy — failing loudly is.**

**Intended outcome:** a worker frozen at a denial gets its node parked to
`office_hours` with a reason naming the freeze and a recommendation naming the
recovery, plus a greppable journal line and a `routing-decisions.jsonl` record —
so the node leaves the selection lane and surfaces to a human instead of
silently pinning a worktree.

### Design decisions this plan commits to (greenfield-ideal; no migration path needed — the change is purely additive, there is no existing surface to migrate from)

1. **Detection is external to the frozen session.** The existing self-declared
   park path (`.claude/hooks/dispatch-stop.sh:63-98` — the worker writes
   `$CLAUDE_JOB_DIR/office-hours-reason` and the Stop hook calls `park-node`)
   is **unreachable from this state**: the session sits at a permission prompt
   and never yields a turn, so Stop never fires and the worker never gets a turn
   to write the marker. A detector that runs in another process is therefore
   structurally required, not merely convenient.

2. **The detector lives in `dispatch-tick`, not `dispatch-sweep`.**
   `dispatch-sweep` is fired by the worker Stop hook (`dispatch-spawn-sweep`);
   in the exact failure being fixed — every worker frozen, zero Stops — it never
   runs. `dispatch-tick` runs on the systemd heartbeat unconditionally, and
   already sweeps the reservation ledger on **both** its paused early-exit
   branch (`dispatch-tick:267-298`) and its normal path. The frozen-session
   sweep mirrors those two call sites for the same reason.

3. **The predicate is positive evidence only: `state == "blocked"` AND the
   session's transcript has stopped growing for a grace window.** Blocked alone
   is not enough (a human may be about to answer); transcript staleness alone is
   not enough (a long tool call looks idle). Both together are exactly "frozen
   at a prompt, doing no work". Transcript mtime is used rather than a new
   marker ledger: it is stateless, self-healing (a session that recovers resets
   its own clock), needs no GC, and it is the recipe the incident report itself
   validated. `waitingFor` is **not** in the predicate — it was absent from
   every row available to inspect while planning, so it is treated as advisory
   context only (see Verification).

4. **Park; do not reap.** The detector calls `park-node` and leaves the frozen
   session alive. Reaping is wrong here: the correct human remedies named by the
   incident are *attach the session and answer the prompt*, *run the command
   yourself*, or *add a standing permission rule* — all of which need the
   session. This is also already an informative surface rather than a black
   hole: `office-hours-graph:262-275` skips a parked node whose name a live
   session holds and reports `all-held N`, whose message
   (`office-hours-graph:308-311`) tells the human to `claude agents --all` and
   attach the holding job. Note that `mark-node-terminal`'s ownership gate makes
   `park-node`'s trailing `mark-node-terminal <id> park` a **no-op** for an
   external caller, so `dispatch-self-close` will not reap the frozen job — that
   is accepted, not overlooked, and is stated in the park recommendation text.

5. **`claude_agents_count_busy_workers` is deliberately NOT changed.** Making a
   blocked session count against the concurrency cap would throttle spawning on
   behalf of a session consuming no budget — the wrong half of the
   "either it counts or it does not hold" dilemma. Parking resolves the
   disagreement the right way: the held node leaves the lane
   (`router.ts:300,344,374` gate candidacy on `office_hours !== null`), so
   "held but not worked" stops being a state the router can be starved by. The
   general unification of "held" vs "being worked" belongs to the three sibling
   tactics this node names (`tactic-phase-terminal-requires-disposition`,
   `tactic-standdown-winner-liveness`,
   `tactic-router-spawn-window-duplicate-worker`) and is out of scope here.

6. **Do not dedupe against `tactic-stopped-session-blocks-node`.** There the
   hold is the author-stated requirement (release is an explicit human act);
   here it is an accident. The predicates differ: this detector matches
   `state == "blocked"` only, never a terminal/`done`/`stopped` state, so it
   cannot fire on that node's case.

---

## Unit 1 — `claude_agents_list_blocked_workers` in `lib-claude-agents.sh`

**Scope**

Add one function to
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`, inside the
existing whole-file load guard (`if [[ -z "${_LIB_CLAUDE_AGENTS_LOADED:-}" ]]`,
opens at line 187, closes at line 663). Insertion point: immediately after
`claude_agents_count_busy_workers()` (which ends at line 628), before the
`verify_agent_registered_under` doc comment at line 630.

```
claude_agents_list_blocked_workers
```

- No arguments. Reads the raw array via `_claude_agents_raw` (lines 199-205) —
  **snapshot-aware**, so it costs zero extra daemon round-trips inside a tick
  that already exported `DISPATCH_AGENTS_SNAPSHOT`. Do **not** query
  `--all` directly: a `state: "blocked"` session is an ACTIVE session and is
  present in the default (non-`--all`) listing — this was verified live against
  the running daemon while planning, and is also proved by the defect itself
  (`worktree_has_live_session`, which reads the same non-`--all` array via
  `claude_agents_list_all`, still matched the frozen session). `--all` would
  additionally surface `state: "done"` rows, which belong to a different tactic.
- One JSON-array-guarded `jq` pass, modelled line-for-line on
  `claude_agents_count_busy_workers` (lines 600-628):
  - `select(.name | type == "string" and test("^[0-9]+-|^tactic-|^strategy-"))`
    — the identical worker-keyspace regex at line 620; do not re-derive it. It
    excludes routers (`dispatch-<short-id>`).
  - `select(.state == "blocked")` — positive match only.
  - project `[.sessionId, .name, .cwd] | @tsv`.
- Return-code contract **identical** to every other machine-wide helper in the
  file: `return 0` with zero or more TSV lines on stdout (empty output +
  return 0 is a definite "no blocked workers"); `return 1` = UNKNOWN with empty
  stdout, on `_claude_agents_raw` failure, whitespace-only output, or a `jq`
  failure. Callers MUST treat UNKNOWN as "cannot reconcile", never as "none".
- Add the function name to the usage list in the file header (lines 10-19) and
  write a header doc-comment block in the established style: what it emits, why
  it uses the snapshot rather than `--all`, that `state` (not `status`) is the
  discriminator, and the 0/1 contract.

**Tests** — add to
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh`, reusing
its existing `ca_setup` / `write_fake_claude` / `ca_teardown` helpers
(lines 27-53) and `assert_eq` from `dispatch-test-fixture.sh`. Cases:

1. Mixed registry — a `busy`/`working` `tactic-*` worker, a `blocked`
   `tactic-*` worker, a `blocked` `dispatch-abc123` router, a `blocked`
   `<N>-slug` worker → exactly the two worker rows are emitted (router
   excluded), in `sessionId<TAB>name<TAB>cwd` order.
2. No blocked rows → return 0 with empty stdout.
3. `[]` → return 0 with empty stdout (definite none, NOT unknown).
4. Fake `claude` exits non-zero → return 1, empty stdout.
5. Fake `claude` emits a JSON object (non-array) → return 1.
6. A row with a null/absent `.name` does not abort the pass (type guard).
7. Snapshot faithfulness — set `DISPATCH_AGENTS_SNAPSHOT` to a file and point
   `CLAUDE_AGENTS_CMD` at a fake that would exit non-zero; assert the snapshot
   is read (proves the function did not bypass `_claude_agents_raw`).

**Out of scope:** any change to `claude_agents_count_busy_workers`,
`worktree_has_live_session`, or the snapshot capture; any consumer wiring.

**Recommended model:** sonnet.

**Dependencies:** none.

> Landing note: `tactic-frozen-session-debug-count` (phase `implement`) adds
> `claude_agents_count_held_for_debug` at the *same* insertion point in this
> file. If that has landed on `origin/main` by implementation time, place
> `claude_agents_list_blocked_workers` after it and keep both — they are
> different predicates (terminal-status count vs blocked-state list) and neither
> supersedes the other.

---

## Unit 2 — `lib-frozen-session-park.sh`: the sweep that parks a frozen node

**Scope**

New file
`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`, a
sourceable library exporting one function, `frozen_session_sweep`. Structure,
error posture, and header-comment style copy `reservation_sweep`
(`.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:415-524`):
whole-file `_LIB_FROZEN_SESSION_PARK_LOADED` guard, `set -uo pipefail`, no
`set -e`, `return 0 — ALWAYS` (the sweep is bookkeeping; it must never abort a
tick), one greppable stderr line per disposition, and one liveness fetch for the
whole sweep.

`frozen_session_sweep` — no arguments. Steps:

1. Fetch candidates once: `claude_agents_list_blocked_workers`. On UNKNOWN
   (return 1), print
   `lib-frozen-session-park: daemon unqueryable; parking nothing` to stderr and
   `return 0`. Empty output → nothing to do, emit the summary line, `return 0`.
2. Resolve `now` from `${DISPATCH_FROZEN_SESSION_NOW_EPOCH:-$(date -u +%s)}`,
   integer-guarded with fallback (copy the guard idiom at
   `lib-reservation-ledger.sh:443-452`). Same guard shape for:
   - `DISPATCH_FROZEN_SESSION_GRACE_S` — default **900**. Idle time a blocked
     worker must exceed before it is parked.
   - `DISPATCH_FROZEN_SESSION_PARK_MAX` — default **3**. Maximum parks per
     sweep. `park-node` pushes to `main` through `graph-commit`'s landing lock,
     so an unbounded batch would serialize N pushes inside one tick; the excess
     is logged and picked up by the next tick.
   - `DISPATCH_FROZEN_SESSION_PROJECTS_ROOT` — default `$HOME/.claude/projects`
     (mirrors `DISPATCH_RECLAIM_PROJECTS_ROOT`,
     `dispatch-reclaim-audit:119`).
   - `DISPATCH_FROZEN_SESSION_REPO_ROOT` — default `$(resolve_project_root)`
     (`lib.sh`). If it cannot be resolved, log one line and `return 0`.
   - `DISPATCH_FROZEN_SESSION_PARK_NODE` — default
     `<repo-root>/packages/intentionsutil/scripts/park-node`. This mirrors
     `dispatch-graph-execute:433` (`PARK_NODE="$PROJECT_ROOT/packages/intentionsutil/scripts/park-node"`),
     the existing precedent for an external process parking another node.
3. Per candidate row (`sessionId<TAB>name<TAB>cwd`), in this order — each branch
   logs exactly one stderr line and continues; nothing below runs on a miss:
   1. **Name shape.** If `name` matches `^[0-9]+-` it is a legacy issue worker
      with no graph node: log
      `lib-frozen-session-park: frozen worker <name> has no graph node (session=<sid>); not parking`
      and continue. Otherwise require
      `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` — the identical node-id validation
      `office-hours-graph:356` applies before the id becomes a path component —
      and skip with a log line if it fails.
   2. **Session-id shape.** Require `^[0-9a-fA-F-]+$` before the id is used in a
      path glob (input validation at a system edge, per
      `.claude/rules/code-style.md`); skip with a log line otherwise.
   3. **Idle time.** Locate the transcript as
      `find "$PROJECTS_ROOT" -mindepth 2 -maxdepth 2 -name "<sid>.jsonl"`. This
      keys on the globally-unique session id, deliberately avoiding both the
      hand-built escaped-cwd path and `dispatch-reclaim-audit`'s
      basename-suffix `find_project_dir` (`dispatch-reclaim-audit:245-260`) —
      neither assumption is needed when the id is in hand. Take the **newest**
      `mtime` across matches (`stat -c %Y`). If no match or `stat` fails, this
      is UNKNOWN: log
      `lib-frozen-session-park: keeping <name> (state=blocked, transcript unreadable — idle time unmeasurable)`
      and continue — **never park without positive evidence of staleness.**
      Otherwise `idle=$(( now - mtime ))`.
   4. **Grace.** If `idle < grace`, log
      `lib-frozen-session-park: observing <name> (state=blocked, idle_seconds=<idle> < grace_seconds=<grace>, session=<sid>)`
      and continue. A negative/future `idle` is `< grace` and so is kept (the
      safe direction, matching `reservation_sweep`'s future-stamp handling).
   5. **Lazy fetch, once.** The first candidate that reaches this step runs
      `git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || true`
      (non-fatal, exactly as `office-hours-graph:280-282` does) and sets a flag
      so later candidates in the same sweep do not refetch. No network call
      happens on a tick with no aged candidate.
   6. **Node exists on `origin/main`.** `git -C "$REPO_ROOT" show
      "origin/main:intentions/<name>.md"`; on failure log
      `lib-frozen-session-park: keeping <name> (no intentions/<name>.md on origin/main; not a graph node)`
      and continue.
   7. **Already parked.** From that same captured content, extract the YAML
      frontmatter (between the first two `---` fences) and test for a
      column-0 `office_hours:` line that is not `null`. Use the **exact**
      `awk`/`grep -qE` idiom of `park_live_on_main`
      (`packages/intentionsutil/scripts/office-hours-graph:143-158`) — the
      frontmatter scoping is load-bearing: a column-0 `office_hours:` line in a
      node's markdown body would otherwise be misread as park state. Copy it
      verbatim with a comment naming the source; do **not** extract it into a
      shared lib in this unit (that would make a `packages/intentionsutil`
      script depend on a `dispatch-propagate` lib, a coupling this repo does not
      have today). If already parked, log
      `lib-frozen-session-park: skipping <name> (already parked to office_hours)`
      and continue.
   8. **Cap.** If `parked_count >= park_max`, log
      `lib-frozen-session-park: deferring <name> (park cap <max> reached this sweep)`
      and continue.
   9. **Park.** Invoke `"$PARK_NODE" "<name>" "<reason>" "<recommendation>"` —
      the 3-positional-arg contract (`park-node:73`); the recommendation is a
      separate argument, never folded into the reason. Do **not** pass `--pr`
      (this caller is `gh`-free and has no PR number) and do **not** pass
      `--base` (there is no diagnosis/execution gap to pin; `park-node`'s own
      fresh-`origin/main` re-read is the correct guard here).
      - Reason: `worker session froze at a permission/classifier denial — claude agents reports state=blocked and the transcript has had no activity for <idle>s; the session cannot make progress and cannot park itself (a blocked session never reaches the Stop hook), so the dispatch-tick frozen-session sweep parked this node`
      - Recommendation: `Find the holding job with 'claude agents --all' and attach it ('claude attach <job-id>'), then answer the pending prompt. If the denied command was gratuitous, cancel it and let the worker continue; if it is genuinely needed, run it yourself or add a standing permission rule — do NOT rewrite the command to route around the classifier. If the session is unrecoverable, stop it ('claude rm <job-id>'), let dispatch-sweep reap the worktree, then run clear-park <node-id> to return the node to the lane. Until that session is gone, office-hours reports this node as 'all-held' rather than launching a review session for it, because the frozen session still holds the node-id session name.`
      - On exit 0: increment `parked_count`, log
        `lib-frozen-session-park: parked <name> (denied-command-frozen after <idle>s; session=<sid>)`.
      - On any non-zero exit `rc` (including 1 = write/CAS refused, 2 = usage,
        3 = stale diagnosis): log
        `lib-frozen-session-park: park failed for <name> (park-node exit <rc>); will retry next tick`
        and continue. A park failure is never fatal to the sweep or the tick.
   10. **Decision-log record.** For every candidate that reached step 3.9
       (parked or park-failed), append one JSONL record. Source
       `lib-decision-log.sh` (guarded, `2>/dev/null || true`, exactly as
       `dispatch-select-tick:98-99` does) and call `decision_log_append` behind
       `command -v decision_log_append >/dev/null 2>&1 && ... || true`
       (`dispatch-select-tick:141`). Build it with `jq -c -n --arg`, matching
       the field convention of the two existing emitters:
       `{ts, site: "frozen-session-sweep", node, session, state: "blocked", idle_seconds, disposition}` where
       `disposition` is `parked` or `park-failed`. This closes the "nothing in
       `routing-decisions.jsonl`" half of the defect.
4. Emit exactly one summary line before returning:
   `lib-frozen-session-park: sweep complete (blocked=<n> parked=<p> observing=<o> unmeasurable=<u> deferred=<d>)`.
   `return 0`.

Style constraints that are mechanically enforced and will fail CI if missed:
never pipe a captured JSON variable through `echo` into `jq` — use
`jq <<<"$VAR"` or `printf '%s'` (`.claude/rules/shell-json.md`; the linter
checks net-new added lines in committed `.sh` files). Avoid inline
`VAR=value command` prefixes.

**Tests** — new file
`.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`
(auto-discovered by `run-unit-tests.sh`'s `"$SCRIPTS"/test-*.sh` glob at
line 190 — no registration needed). Follow the shape of
`test-lib-reservation-ledger.sh` / `test-lib-claude-agents.sh`: `set -euo
pipefail`, source `dispatch-test-fixture.sh` for `assert_eq` /
`report_results`, source both `lib-claude-agents.sh` and the new lib, and wrap
each call in an `if` to capture its return code.

Harness per test:
- Fake `claude` via `CLAUDE_AGENTS_CMD` (copy `write_fake_claude`,
  `test-lib-claude-agents.sh:41-53`) emitting a controlled registry array.
- A scratch git repo as `DISPATCH_FROZEN_SESSION_REPO_ROOT`: `git init`, write
  `intentions/<id>.md` files, commit, then
  `git update-ref refs/remotes/origin/main HEAD`. No bare remote is needed —
  the lib only ever reads `git show origin/main:...` and its `fetch` is
  non-fatal.
- A scratch `DISPATCH_FROZEN_SESSION_PROJECTS_ROOT` containing
  `<proj>/<sid>.jsonl` files whose mtime is set with `touch -d`.
- A fake `park-node` at `DISPATCH_FROZEN_SESSION_PARK_NODE` that appends its
  argv to a log file and exits a test-controlled code.
- `DISPATCH_FROZEN_SESSION_NOW_EPOCH` for a deterministic clock;
  `DISPATCH_DECISION_LOG_DIR` pointed at a scratch dir
  (`lib-decision-log.sh:49`).

Cases:
1. Blocked node worker, transcript idle past grace, node present and unparked →
   `park-node` invoked exactly once with the node id as `$1` and three
   positional args; stderr contains `parked <id> (denied-command-frozen`; one
   `routing-decisions.jsonl` line with `site == "frozen-session-sweep"` and
   `disposition == "parked"`.
2. Blocked but idle **below** grace → no `park-node` invocation; stderr contains
   `observing`.
3. Blocked, transcript **missing** → no invocation; stderr contains
   `transcript unreadable`. (Explicit guard against parking on absent evidence.)
4. Blocked, aged, but the node's `origin/main` frontmatter already has a
   non-null `office_hours` → no invocation; stderr contains `already parked`.
   Add a companion node whose **markdown body** contains a column-0
   `office_hours:` line while its frontmatter is `null` → it IS parked (proves
   the frontmatter scoping).
5. `busy`/`working` sessions only → no invocation; summary line reports
   `blocked=0`.
6. Daemon unqueryable (fake `claude` exits non-zero) → no invocation; stderr
   contains `daemon unqueryable`; return 0.
7. `park-node` exits 1 → sweep still returns 0, stderr contains
   `park failed for`, decision record `disposition == "park-failed"`, and a
   second aged candidate in the same sweep is still processed (failure
   isolation).
8. Cap: four aged candidates with `DISPATCH_FROZEN_SESSION_PARK_MAX=2` → exactly
   two invocations, two `deferring` lines.
9. A blocked `dispatch-abc123` router and a blocked `<N>-slug` worker → the
   router is absent from candidates entirely (Unit 1's regex) and the `<N>-`
   worker logs `has no graph node` without invoking `park-node`.
10. A blocked worker whose name fails the node-id regex (e.g. `tactic-Bad_Id`)
    → no invocation, no path built from it.

**Out of scope:** any change to `park-node`, `mark-node-terminal`,
`office-hours-graph`, `dispatch-sweep`, or `graph-select-target`; reaping or
stopping the frozen session; extracting `park_live_on_main` into a shared lib.

**Recommended model:** opus.

**Dependencies:** Unit 1 (the candidate list function must exist).

---

## Unit 3 — Wire the sweep into `dispatch-tick` on both cadences

**Scope**

`.claude/skills/dispatch-propagate/scripts/dispatch-tick`, two call sites,
mirroring exactly how `reservation_sweep` is already wired:

1. **Paused branch** (`dispatch-tick:265-299`). That branch is documented as the
   only autonomous path that never reaches `dispatch-select-tick`'s own
   `reservation_sweep`, which is why it sweeps before its `exit 0`. A node
   frozen while dispatch is paused must still surface, so add the frozen-session
   sweep there too. Reuse the branch's existing conditional-source idiom
   (lines 275-284): source `lib-claude-agents.sh` and the new
   `lib-frozen-session-park.sh` only if the function is not already defined,
   then verify with `declare -f frozen_session_sweep >/dev/null 2>&1` and, on
   failure, print a loud greppable line
   (`dispatch-tick: lib-frozen-session-park.sh failed to load; frozen-session sweep NOT run this tick`)
   rather than absorbing it with `|| true` — the same fail-loud reasoning
   spelled out at lines 286-293 (`.claude/rules/code-style.md`). Redirect the
   sweep's stderr with `frozen_session_sweep 1>&2`, matching
   `reservation_sweep 1>&2` at line 292.
2. **Normal path.** Insert immediately **after** the per-tick snapshot capture
   block (`dispatch-tick:392-414`, which sources `lib-claude-agents.sh` and
   exports `DISPATCH_AGENTS_SNAPSHOT`) and **before** Step 1's
   `dispatch-select-tick` invocation (lines 416-425). This ordering is
   load-bearing twice over: the sweep reuses the tick's single daemon snapshot
   instead of adding a round-trip, and any node parked by the sweep is excluded
   from *this* tick's selection because `park-node` has already landed
   `office_hours` on `main` (`router.ts:300,344,374`). Source
   `lib-frozen-session-park.sh` here (a plain
   `source "$SCRIPT_DIR/lib-frozen-session-park.sh"` alongside the existing
   `source "$SCRIPT_DIR/lib-claude-agents.sh"` at line 403) and call
   `frozen_session_sweep 1>&2`. Guard identically: if the function is
   undefined, print the loud line and continue the tick.

Add a short paragraph to `dispatch-tick`'s header "Behavior" block naming the
new step, its two cadences, and the reason it runs before selection.

`dispatch-tick` already runs the whole headless chain sandbox-disabled
(`.claude/rules/sandbox.md`), which is what the Unix-socket-backed
`claude agents` read and the `git fetch` require — no new sandbox handling.

**Tests** — add to
`.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh`, extending its
existing `tick_setup` (lines 24-70). That harness copies `dispatch-tick` plus
its sourced libs into `TMPDIR_TEST` so `SCRIPT_DIR`-relative sourcing resolves
inside the scratch tree — so it must also `cp
"$SCRIPT_DIR/lib-frozen-session-park.sh" "$TMPDIR_TEST/"`, and export the
Unit-2 seams (`DISPATCH_FROZEN_SESSION_*`, `DISPATCH_DECISION_LOG_DIR`) into the
scratch tree. Follow the same defensive default the harness already applies to
`reservation_sweep` (lines 51-64): point the seams at scratch paths so a tick
test can never park a real production node. Add the new vars to the teardown
`unset` list at line 133. Cases:

1. Paused tick (pause sentinel present, no `--manual`) with one aged blocked
   candidate → the fake `park-node` argv log records the park, and the tick
   still exits 0 with its `paused` message.
2. Normal tick → the sweep runs **before** the fake `dispatch-select-tick` is
   invoked (assert by ordering: have the fake `park-node` and the fake
   `dispatch-select-tick` append to the *same* log file and assert the park line
   precedes the select line).
3. `lib-frozen-session-park.sh` absent from `TMPDIR_TEST` → the tick prints the
   loud `failed to load` line and still completes its normal routing (the sweep
   is observability/containment, never a gate).

**Out of scope:** `dispatch-select-tick`, `dispatch-sweep`,
`dispatch-spawn-sweep`, and the systemd unit definitions — the existing
heartbeat cadence is used as-is; no new timer.

**Recommended model:** sonnet.

**Dependencies:** Units 1 and 2.

---

## Reuse

- `_claude_agents_raw` + `DISPATCH_AGENTS_SNAPSHOT` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:199-205`
  (one daemon query per tick).
- `claude_agents_count_busy_workers` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:600-628`
  (the worker-keyspace regex at line 620, the single-`jq`-pass shape, and the
  0/1 UNKNOWN contract Unit 1 copies).
- `claude_sessions_with_name_all` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:309-347`
  (the precedent for reading the granular `.state` field).
- `reservation_sweep` —
  `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:415-524`
  (the whole sweep template: one liveness fetch, integer-guarded env
  now/grace/TTL resolution at 443-452, per-row disposition branches, one
  greppable stderr line each, `return 0` always).
- `reservation_sweep`'s two call sites —
  `.claude/skills/dispatch-propagate/scripts/dispatch-tick:275-296` (paused
  branch, conditional source + fail-loud verify) and the normal path via
  `dispatch-select-tick` — the wiring Unit 3 mirrors.
- `park-node` — `packages/intentionsutil/scripts/park-node:73` (usage), whole
  script. The write path: fetches `origin/main`, overwrites the local node file
  from it, writes `office_hours = {reason, since, recommendation}` via
  `store.ts` `writeNode`, lands through `graph-commit` with a `--base` CAS, and
  restores byte-identically on failure. Call it; author no `office_hours`
  mutation.
- `dispatch-graph-execute:431-440` — the precedent for an external process
  invoking `park-node` against another node with an inline reason +
  recommendation, and for resolving the script path as
  `$PROJECT_ROOT/packages/intentionsutil/scripts/park-node`.
- `park_live_on_main` —
  `packages/intentionsutil/scripts/office-hours-graph:143-158` (the
  frontmatter-scoped `awk` + anchored `grep -qE` idiom for reading live park
  state off `origin/main`; copy verbatim with attribution).
- Node-id validation regex —
  `packages/intentionsutil/scripts/office-hours-graph:356`.
- `decision_log_append` + `DECISION_LOG_FILE` / `DISPATCH_DECISION_LOG_DIR` —
  `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:76-107`; record
  shape and guarded call style from
  `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:111-141` and
  `graph-select-target:217-232`.
- `resolve_project_root` — `.claude/skills/dispatch-propagate/scripts/lib.sh`
  (used the same way by `reservation_dir`,
  `lib-reservation-ledger.sh:203-212`).
- `DISPATCH_RECLAIM_PROJECTS_ROOT` convention —
  `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:119`
  (the `$HOME/.claude/projects` default and its env-override naming).
- `write_fake_claude` / `ca_setup` / `ca_teardown` —
  `.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh:27-53`.
- `assert_eq`, `report_results`, `setup`, `teardown` —
  `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:36,50,64,1228`.
- `tick_setup` and its env-seam conventions —
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh:24-70,133`.
- Test auto-discovery — `run-unit-tests.sh:190` globs `"$SCRIPTS"/test-*.sh`; a
  new `test-*.sh` needs no registration.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

Manual / judgment checks (not machine-checkable in CI):

- **Confirm the blocked-state literal against a real denial.** The fixtures pin
  `state == "blocked"` from the incident report, and a live read of
  `claude agents --json` during planning confirmed that `state` is present on
  every active row in the default (non-`--all`) listing — but no session was
  actually blocked at that moment, so the `blocked` literal itself was not
  observed live. Before merging, provoke one denial in a throwaway session
  (issue a command the classifier will refuse) and run, sandbox-disabled:
  `claude agents --json | jq -c '.[] | {name,status,state,waitingFor}'`.
  Confirm the frozen row reads `state: "blocked"`. If the literal differs, fix
  Unit 1's predicate and its fixtures — **do not** widen the predicate to a
  `status != busy` complement, which would collide with
  `tactic-stopped-session-blocks-node` and
  `tactic-frozen-session-debug-count`.
- **Observe one real park end to end.** With the throwaway blocked session still
  alive and `DISPATCH_FROZEN_SESSION_GRACE_S=0`, run `dispatch-tick` (manual,
  sandbox-disabled) and confirm: the journal carries the
  `lib-frozen-session-park: parked <node>` line; `git show
  origin/main:intentions/<node>.md` shows a non-null `office_hours` with both a
  `reason` and a `recommendation`; a `site: "frozen-session-sweep"` record
  appears in `~/.local/share/commons-dispatch/routing-decisions.jsonl`.
- **Confirm the node leaves the lane.** Run `graph-select-target --top 20` and
  confirm the parked node no longer appears as a candidate — the router's
  `office_hours !== null` gate should exclude it without any change to
  `graph-select-target:669`'s `worktree_has_live_session` check (which will
  still report the worktree occupied; that is expected and is precisely the
  "held but not selectable" state the park is meant to produce).
- **Confirm the human-facing surface.** Run `office-hours-graph` (or the
  office-hours selector `--list`) with the frozen session still alive and
  confirm it reports the node as `all-held` with the
  `claude agents --all` / attach guidance, rather than reporting an empty queue.
- **Confirm idempotence over consecutive ticks.** Run `dispatch-tick` a second
  time with the node still parked and the session still frozen; confirm the
  journal shows `skipping <node> (already parked to office_hours)` and that no
  second `graph-commit` landed (`git log origin/main -- intentions/<node>.md`
  gains no new commit).
- **Confirm recovery.** Attach the frozen session, answer or cancel the prompt,
  `claude rm` the job, let `dispatch-sweep` reap the worktree, then
  `clear-park <node-id>` and confirm the node returns to the selectable set.
