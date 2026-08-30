---
id: tactic-graph-node-session-reap
kind: tactic
statement: Node-worker sessions are reaped from the agents list on terminal exit
  — extend the node-lane Stop-hook branch to call the foreground-safe self-close
  primitive on both clean-advance and escalation-park. The originally-planned
  dispatch-sweep mid-phase-dead-job reap (reap_job_for_branch) was dropped from
  scope — origin/main independently landed a broader NODE-arm worktree-reap
  subsystem covering the same ground, and it conflicted directly with this
  addition
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-16 /align-strategy interview: the legacy gh
  issue-worker Stop hook reaped a session that terminated without variance and
  needed no author follow-up (dispatch-self-close -> `claude rm`), but the
  node-lane branch of dispatch-stop.sh does nothing for a node worker 'parked or
  clean', so completed and parked node-worker sessions accumulate in `claude
  agents --json`. Graph-native doctrine demotes session persistence (a park's
  context lives in the node, not the session), so the reap widens to every
  terminal exit. /align-tactics 2026-07-18: finalized into a 2-unit plan —
  Stop-hook self-close (dispatch-self-close, reused unmodified) and a
  dispatch-sweep extension (new claude_job_id_for_name_all in
  lib-claude-agents.sh) for mid-phase-dead orphaned jobs. 2026-07-2X
  office-hours drain (provision exit 11): origin/main independently landed a
  broader NODE-arm worktree-reap subsystem (node_completion_state,
  node_worktree_age_s, node_cwd_has_live_session, and a bare node-id removal arm
  in dispatch-sweep) that deletes this tactic's reap_job_for_branch function and
  its 3 call sites outright — a real conflict, not a stale one. Human decision:
  drop reap_job_for_branch from scope entirely as redundant with main's NODE-arm
  reap; keep the new shared claude_job_id_for_name_all lib function and the
  office-hours job_id_for_name dedup (2a/2d), since both stand alone and merged
  clean with no conflict."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-graph-node-session-reap
  pr: 2922
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-26T05:51:57Z
    mergeCommitSha: 464b1f81fc5e125bbd5fbfe168bb904ff29598bc
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Node-worker sessions are reaped from the agents list on terminal exit — extend the node-lane Stop-hook branch to call the foreground-safe self-close primitive on both clean-advance and escalation-park (mid-phase-dead-job reap dropped, redundant with main's NODE-arm)

## Context

Graph-native node-worker background sessions (Claude Code `--bg` jobs whose
`state.json .name` is an intention-graph node id such as `tactic-foo`)
currently never leave the `claude agents --json` registry when they finish —
the Stop hook's node-lane branch only runs the escalation-park backstop and
exits, and a worker that dies mid-phase without firing a clean Stop never
reaches the hook at all. Both paths leak entries into the registry
indefinitely, which violates graph-native doctrine (sessions are disposable
execution substrate, not persistent state) and pollutes `claude agents --json`
for every future liveness query. This PR closes both leaks by reusing two
scripts that already do the right thing for other callers: `dispatch-self-close`
(self-deletion, already interactive-safe and router-aware) and `dispatch-sweep`
(the existing worktree-GC pass, already gated on confirmed-dead liveness).

**Scope note (2026-07-2X office-hours drain):** the mid-phase-dead-job reap
originally planned as Unit 2's `dispatch-sweep` addition (`reap_job_for_branch`,
3 call sites) was dropped. While this PR sat in office-hours, origin/main
independently landed a broader NODE-arm worktree-reap subsystem in
`dispatch-sweep` (`node_completion_state`, `node_worktree_age_s`,
`node_cwd_has_live_session`, and a bare node-id removal arm) that reaps exactly
this class of orphaned worktree/job — and its merge deleted this tactic's
`reap_job_for_branch` function and call sites outright. Per human decision,
`reap_job_for_branch` is dropped from scope as redundant; main's NODE-arm is
the sole reap mechanism for mid-phase-dead node workers going forward. Unit 2
is narrowed to the parts that stood alone and merged clean: the shared
`claude_job_id_for_name_all` lookup in `lib-claude-agents.sh` and the
`office-hours` `job_id_for_name()` dedup that consumes it (2a/2d below).

## Units of work

Both units land in ONE PR (this tactic). They touch disjoint files, have no
dependency on each other, and can be implemented/verified in either order.

### Unit 1: Stop-hook self-close on every node-worker terminal exit

**Scope**

File: `.claude/hooks/dispatch-stop.sh` (76 lines today).

The node-lane block is:

```
50: if [[ -n "$JOB_NAME" && -n "$_HOOK_ROOT" && -f "$_HOOK_ROOT/intentions/$JOB_NAME.md" ]]; then
51:   _OH_REASON_FILE="$CLAUDE_JOB_DIR/office-hours-reason"
52:   if [ -s "$_OH_REASON_FILE" ]; then
...
71:     fi
72:   fi
73: fi
75: # Node worker (parked or clean) and routers alike: nothing more for this hook.
76: exit 0
```

Insert a new, unconditional (within the node-lane `if`) self-close call
between the current line 72 and line 73 — i.e. after the entire
office-hours-reason/park-backstop block closes (whether or not a park actually
ran), but still inside the `if [[ -n "$JOB_NAME" && ... ]]; then ... fi`
node-lane guard so routers and non-node jobs are unaffected:

```bash
  _SELF_CLOSE="$_HOOK_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close"
  if [ -x "$_SELF_CLOSE" ]; then
    # Reap this node worker's job entry from `claude agents --json` on every
    # terminal exit — clean and parked alike. Runs AFTER the park backstop above
    # so a durable office_hours write lands before the session disappears.
    # dispatch-self-close is CLAUDE_JOB_DIR-gated and a no-op for interactive
    # sessions; node-worker names never match `dispatch-*`, so it self-closes
    # unconditionally here (its router continuation-invariant branch never
    # triggers for this caller).
    "$_SELF_CLOSE" >/dev/null 2>&1 \
      || echo "[dispatch-stop] WARNING: dispatch-self-close for '$JOB_NAME' failed (non-fatal)" >&2
  fi
```

Also update the now-stale comment at line 75 (`# Node worker (parked or
clean) and routers alike: nothing more for this hook.`) — reword to
`# Routers and non-node jobs: nothing more for this hook.` The final
`exit 0` at line 76 is unchanged.

`_HOOK_ROOT` is already computed at line 49 and used to build `_PARK` at line
58 — reuse it identically for `_SELF_CLOSE`, no new root-resolution logic.

Out of scope for this unit: any change to `dispatch-self-close` itself (it
needs none — its `CLAUDE_JOB_DIR` gate at lines 67-70 and router-only
continuation invariant at line 84, keyed on a `dispatch-*` name prefix a node
id never matches, already fall through to the unconditional
`exec "$CLAUDE_CMD" rm "$JOB_ID"` at line 123 for this caller). Also out of
scope: any change to the park-node backstop logic itself, and any change to
Discriminator 1/2 (lines 30-48).

**Recommended model:** sonnet. This is a small, mechanical addition inside an
already-well-understood file, following the exact call-shape precedent the
`_PARK` variable already establishes two lines above the insertion point — no
new architecture or judgment calls.

**Dependencies:** none.

### Unit 2: Shared job-lookup helper + office-hours dedup

**DROPPED FROM SCOPE:** the `dispatch-sweep` mid-phase-dead-job reap
(`reap_job_for_branch`, one new helper + 3 call sites in `dispatch-sweep`) —
redundant with main's independently-landed NODE-arm worktree-reap subsystem,
which reaps orphaned bare node-id worktrees (and, transitively, their owning
job entries are left to that subsystem's own future reap, not this tactic's
concern). Per human decision on this office-hours drain: main's NODE arm is
the sole reap mechanism for mid-phase-dead node workers; this tactic does not
reintroduce `reap_job_for_branch` or its call sites.

**Scope (as narrowed)**

Files:
1. `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` (607
   lines today) — add one new sourced function.
2. `.claude/skills/dispatch-propagate/scripts/office-hours` — small dedup
   refactor of its existing `job_id_for_name()` (lines 160-169) to delegate to
   the new shared lib function, eliminating the duplicate jq pattern.

**2a. `lib-claude-agents.sh`: new function `claude_job_id_for_name_all`**

Insert immediately after `claude_sessions_with_name_all()` closes (currently
line 338) and before the `claude_sessions_with_name_prefix_all` doc comment
(currently line 340), inside the same
`if [[ -z "${_LIB_CLAUDE_AGENTS_LOADED:-}" ]]; then ... fi` namespace-guard
block that already wraps every other function in this file (the guard opens
at line 178 — verified: it is a single guard block spanning the whole file,
closed by the final `fi` at end-of-file; add the new function inside it, no
new guard needed):

```bash
  # claude_job_id_for_name_all <name> — echo the daemon JOB ID (the short `.id`
  # field of `claude agents --json --all` — the 8-hex-char basename
  # dispatch-self-close derives from $CLAUDE_JOB_DIR, NOT `.sessionId`) of the
  # live/done background job whose `.name` exactly equals <name>, or empty if
  # none. --all so a job in a terminal state (done/stopped/etc — hidden from the
  # default active-only listing) is still resolvable: office-hours' attach path
  # needs to find a job by name even after it has finished. Consolidates
  # office-hours' inline job_id_for_name() jq pattern into one shared
  # implementation.
  #     return 0 — daemon queried successfully. Stdout is the job id, or empty if
  #               no name match. Empty stdout + return 0 is a definite "no such job".
  #     return 1 — UNKNOWN. `claude` missing, non-zero exit, or non-array output.
  #               Stdout is empty. Callers MUST NOT treat this as "no job" — see
  #               each call site's own fail-safe handling.
  claude_job_id_for_name_all() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
      printf 'lib-claude-agents: claude_job_id_for_name_all requires a <name> argument\n' >&2
      return 1
    fi

    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    jq -r --arg n "$name" '
      if type == "array"
      then (first(.[] | select(.name == $n) | .id) // empty)
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null || return 1
    return 0
  }
```

Also add `claude_job_id_for_name_all <name>` to the file's top-of-file usage
list (the block starting at line 10-18) alongside the other listed functions.

**2b/2c (DROPPED): `dispatch-sweep` helper `reap_job_for_branch` + 3 call
sites.** Not implemented — see "DROPPED FROM SCOPE" above. Main's NODE-arm
(`node_completion_state`, `node_worktree_age_s`, `node_cwd_has_live_session`,
and the bare node-id removal arm in `dispatch-sweep`) covers mid-phase-dead
node-worker worktree reap; this tactic does not duplicate it.

**2d. `office-hours` dedup (small, low-risk cleanup, retained)**

Replace the body of `job_id_for_name()` (currently lines 163-169) with a thin
delegate to the new shared function:

```bash
job_id_for_name() {
  claude_job_id_for_name_all "$1" 2>/dev/null || true
}
```

Safe because `office-hours` already sources `lib-claude-agents.sh` (line
110). `office-hours`'s own `CLAUDE_CMD` reads `OFFICE_HOURS_CLAUDE_CMD` while
the shared lib function reads `CLAUDE_AGENTS_CMD` — grepped production call
sites: `OFFICE_HOURS_CLAUDE_CMD` is set NOWHERE outside the test file, so in
production both always default to plain `claude` together. Every existing
test fixture that sets one also sets the other (verified by grep across
`test-dispatch-scripts.sh`). Re-run the full suite (below) to catch any case
this misses.

Out of scope for Unit 2 (as narrowed): any change to `dispatch-sweep` at all
— the mid-phase-dead-job reap it would have hosted is dropped (see above); any
change to the not-in-sync grace/quarantine logic, the PR/issue-state
precedence logic, or `worktree_has_live_session`.

**Recommended model:** sonnet. The new lib function and the office-hours dedup
are mechanical extensions of an existing, extremely well-documented pattern
(`claude_sessions_with_name_all` for the lib function's shape) — no new
architecture.

**Dependencies:** none on Unit 1 — Unit 1 touches only `dispatch-stop.sh`
(and its test block); Unit 2 (as narrowed) touches only
`lib-claude-agents.sh` and `office-hours` (and their test blocks). Fully
disjoint files, independently testable and mergeable within this one PR.

## Reuse

- `dispatch-self-close`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-self-close`) — reused
  unmodified by Unit 1. Its `CLAUDE_JOB_DIR`-presence gate (lines 67-70) makes
  it a safe no-op for any interactive invocation; its router-only continuation
  invariant (`SESSION_NAME == dispatch-*`, line 84) never triggers for a
  node-id name, so it falls through to the unconditional
  `exec "$CLAUDE_CMD" rm "$JOB_ID"` at line 123.
- `park-node`'s call-ordering precedent — Unit 1's self-close call is placed
  strictly after the existing `_PARK` invocation block (inside the same outer
  `if`), matching the "backstop write must land before teardown" ordering
  invariant.
- `office-hours`'s `job_id_for_name()` pattern
  (`.claude/skills/dispatch-propagate/scripts/office-hours`, currently lines
  160-169) — the exact query shape (`claude agents --json --all` piped to a
  `first(.[] | select(.name == $n) | .id) // empty` jq filter) is lifted into
  the new `claude_job_id_for_name_all` in `lib-claude-agents.sh`, and
  `office-hours` itself is refactored to call the shared version.
- `lib-claude-agents.sh`'s existing function-doc-comment convention — every
  function in this file (see `claude_sessions_with_name_all` at line 300,
  `worktree_has_live_session` at line 497) documents: a one-line usage
  summary, a `return 0` / `return 1` (UNKNOWN) contract,
  `${CLAUDE_AGENTS_CMD:-claude}` as the queried command, `2>/dev/null`
  daemon-noise suppression, and a single JSON-array-guarded jq pass.
  `claude_job_id_for_name_all` follows this convention exactly and lives
  inside the same `_LIB_CLAUDE_AGENTS_LOADED` idempotent-load guard block as
  every sibling function.

## Verification

Both units are covered by the repo's single monolithic shell test suite, run
whole (it takes no filter/subset argument — `SCRIPT_DIR` is derived from `$0`
only, no `--filter`/pattern mechanism exists):

```verify
# The monolithic test-dispatch-scripts.sh named here was DELETED by
# tactic-dispatch-test-monolith-split (58e5bc34, 2026-07-30), which split it
# into per-script suites — one day AFTER this node reached phase done
# (1657ef09, 2026-07-29). The two successors that carry this node's cases are
# named below; each one's header records the move verbatim.
for t in test-dispatch-stop-hook.sh test-lib-claude-agents.sh; do
  f=".claude/skills/dispatch-propagate/scripts/$t"
  test -f "$f" || { echo "FAIL: successor suite missing: $f"; exit 1; }
  bash "$f" || { echo "FAIL: $t failed"; exit 1; }
done
echo OK
```

The suite's final `report_results` call prints
`Results: $PASS/$TOTAL passed, $FAIL failed` and the script's own exit code is
`0` iff `FAIL -eq 0` — a clean run with exit code 0 and `0 failed` in the
printed summary is the pass bar for both units, since they share this one
test file.

**Unit 1 test additions** (inside the existing `dispatch-stop` test block,
currently lines 19133-19248, in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`):

- Extend `stopnc_setup()` (currently lines 19138-19158) to also
  `mkdir -p "$ROOT/.claude/skills/dispatch-propagate/scripts"` and drop a
  fake `dispatch-self-close` there that (a) appends `"self-close"` to a
  shared `$ROOT/order.log` (mirroring how the `dispatch-finalize-phase` tests
  elsewhere in this same file assert ordering via a shared order.log) and (b)
  appends a line to `$ROOT/self-close-calls.log`, and honors an optional
  `$ROOT/self-close-exit` override file (mirroring `park-exit`) so a test can
  drive the best-effort-failure branch:
  ```bash
  cat > "$ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close" <<'FAKE'
  #!/usr/bin/env bash
  _root="$(cd "$(dirname "$0")/../../../.." && pwd)"
  echo "self-close" >> "$_root/order.log"
  echo "called" >> "$_root/self-close-calls.log"
  if [[ -f "$_root/self-close-exit" ]]; then exit "$(cat "$_root/self-close-exit")"; fi
  exit 0
  FAKE
  chmod +x "$ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close"
  : > "$ROOT/order.log"
  : > "$ROOT/self-close-calls.log"
  ```
  (Path check: from `$ROOT/.claude/skills/dispatch-propagate/scripts/`,
  `$(dirname "$0")` is that `scripts` dir, and `../../../..` walks
  scripts→dispatch-propagate→skills→.claude→`$ROOT` — 4 levels, matching the
  real nesting depth under `$ROOT`.)
  Also make the existing fake `park-node` (lines 19149-19156) append `"park"`
  to the same `$ROOT/order.log` (one added line inside its heredoc), so
  ordering is observable end-to-end.
- Extend the existing 6 test cases' assertions:
  - "no CLAUDE_JOB_DIR" (19176-19182): add an assertion that
    `self-close-calls.log` has 0 lines (self-close never invoked when the
    hook exits at Discriminator 1).
  - "state.json absent" (19185-19190): same self-close-not-called assertion.
  - "router name" (19193-19200): same self-close-not-called assertion
    (routers never reach the new code, since Discriminator 2 already excludes
    them).
  - "node worker with no office-hours-reason" (19203-19210): CHANGE the
    expectation — after this unit ships, self-close IS called on a clean node
    exit. Add an assertion that `self-close-calls.log` has exactly 1 line.
  - "node worker + office-hours-reason" (19213-19223): add an assertion that
    `self-close-calls.log` has exactly 1 line, and an assertion that
    `order.log` reads `park` then `self-close` (self-close runs after
    park-node).
  - "park-node failure is non-fatal" (19239-19248): add an assertion that
    self-close still ran despite the park-node failure (`self-close-calls.log`
    has exactly 1 line), proving best-effort independence between the two
    backstops.
- Add one new test case: "dispatch-stop self-close failure is non-fatal (hook
  still exits 0)" — set up a node worker with no reason file, write `1` to
  `$ROOT/self-close-exit`, run the hook, assert `rc == 0` and that
  `self-close-calls.log` shows exactly one attempt.

**Unit 2 test additions (as narrowed):** the dropped `dispatch-sweep`
mid-phase-dead-job reap (`reap_job_for_branch`, the
`sweep_fake_claude_sessions_by_name_with_id` fixture, and test cases J1-J5)
is not implemented and carries no tests here — main's own NODE-arm reap
subsystem in `dispatch-sweep` has its own independent test coverage on
origin/main, out of this tactic's scope.

The retained surface — `claude_job_id_for_name_all` (2a) and the
`office-hours` `job_id_for_name()` dedup (2d) — needs no new dedicated test:
the delegation is behavior-preserving (both `OFFICE_HOURS_CLAUDE_CMD` and
`CLAUDE_AGENTS_CMD` default identically to plain `claude` in production, and
every existing test fixture that sets one sets the other), and `office-hours`
`attach_session_by_name` already exercises `job_id_for_name()` indirectly in
the existing `office-hours` test block. The full-suite run above (3076/3076
passed on the merged, redacted state) is the check that proves both hold.

**Manual/judgment verification** (not exercised by the shell-fixture tests,
which fake `claude` entirely via `CLAUDE_AGENTS_CMD` /
`DISPATCH_SELF_CLOSE_CLAUDE_CMD` PATH/env overrides and never invoke a real
daemon):

- A real `claude agents --json --all` / `claude rm <id>` / `claude attach
  <id>` call against the live local daemon requires
  `dangerouslyDisableSandbox: true` when driven interactively from a Claude
  session (per `.claude/rules/sandbox.md § claude agents --json`) — the
  shipped bash scripts themselves need no such flag since they run as
  ordinary background-job/hook/cron processes with normal daemon-socket
  access; this only matters to whoever manually re-verifies post-merge
  behavior by running `claude agents --json --all` before/after a real
  node-worker session's Stop hook fires.
- After a node worker completes a phase and its Stop fires, `claude agents
  --json` shows no lingering job for that node id, and the node's persisted
  phase advanced on origin/main.
- After an escalation-park, likewise no lingering job, and the node's
  `office_hours` is set (durable before the reap).
- An interactive `/align` or `/office-hours` session is never auto-reaped
  (`CLAUDE_JOB_DIR` gate).
- A mid-phase-dead worker's orphaned job/worktree is removed — NOT by this
  tactic (the `dispatch-sweep` reap it would have added is dropped), but by
  main's independently-landed NODE-arm worktree-reap subsystem. Verifying
  that is out of this tactic's scope.

## needs-main residue

- **id:** 10
- **title:** Real-daemon self-close and interactive-session safety observed in production
- **url_path:** current
- **expected outcome:** Terminal node-worker exits (clean and parked) leave no registry entry via the Stop-hook self-close, phase/office_hours state is durable, and interactive sessions are preserved. (Mid-phase-dead-worker reap is no longer this tactic's concern — see the scope note above; main's own NODE-arm subsystem owns that verification on its own PR.)
- **finding:** Requires live `claude agents --json` / `claude rm` calls against the local daemon (which the shell fixtures fake entirely) and observation of real session lifecycle; only verifiable downstream in production, not at PR-merge time in this sandboxed session. Planned deferral: the acceptance criteria for real-daemon self-close and interactive-session safety are documented as non-assertable at merge time — verify by observing `claude agents --json` before/after a real node-worker Stop-hook fire.

**Disposition (2026-07-29).** `/qa-main` parked this residue item as
cannot-verify: its `url_path` is the literal string `current`, not a real page,
and the check it asks for — observing `claude agents --json --all` / `claude rm`
against the live local Claude daemon across a real node-worker session lifecycle
— is not browser-observable, so Claude-in-Chrome cannot assert it against
deployed main. The author reviewed the park in-session and elected to **skip**
the rehearsal rather than hold the node open pending a manufactured or
naturally-occurring daemon-level observation; the node is closed to `done` on
that basis. The source PR #2922 merged 2026-07-26T05:51:57Z, so the fix is
deployed and the full shell suite (3076/3076) covers both units at the fixture
level; what is waived is only the four live-daemon observations enumerated in
the park recommendation (parked-exit reap, durable-before-teardown ordering,
clean-advance reap, interactive-session no-op). Those remain unrehearsed — the
next real node-worker Stop-hook fire is the first production validation. If any
of them turns out to be broken, file a fresh bug against `dispatch-stop.sh` /
`dispatch-self-close` rather than reopening this already-merged PR.
