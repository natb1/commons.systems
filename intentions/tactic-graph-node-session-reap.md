---
id: tactic-graph-node-session-reap
kind: tactic
statement: Node-worker sessions are reaped from the agents list on terminal exit
  — extend the node-lane Stop-hook branch to call the foreground-safe self-close
  primitive on both clean-advance and escalation-park, and reap mid-phase-dead
  jobs via the tick/sweep ledger pass
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
  lib-claude-agents.sh) for mid-phase-dead orphaned jobs."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-node-session-reap
  pr: 2922
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Node-worker sessions are reaped from the agents list on terminal exit — extend the node-lane Stop-hook branch to call the foreground-safe self-close primitive on both clean-advance and escalation-park, and reap mid-phase-dead jobs via the tick/sweep ledger pass

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

### Unit 2: Sweep-pass job reap for mid-phase-dead orphaned jobs

**Scope**

Files:
1. `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` (607
   lines today) — add one new sourced function.
2. `.claude/skills/dispatch-propagate/scripts/dispatch-sweep` (335 lines
   today) — add one local helper and 3 call sites.
3. `.claude/skills/dispatch-propagate/scripts/office-hours` — small dedup
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
  # default active-only listing) is still resolvable: the mid-phase-dead-worker
  # reap this backs needs exactly that visibility. Consolidates office-hours'
  # inline job_id_for_name() jq pattern into one shared implementation.
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

**2b. `dispatch-sweep`: new helper `reap_job_for_branch`**

Insert a new function directly after `reap_or_skip_not_in_sync()` closes
(currently line 177) and before the `# ---- Step 1` comment (currently line
179):

```bash
# reap_job_for_branch <wt_branch> — best-effort: if a live/done background job is
# registered under a name exactly matching <wt_branch>, delete it via `claude rm`.
# For a graph-native node worker, the worktree's branch name IS the node id AND
# the worktree basename IS the node id (both equal wt_branch — the same identity
# worktree_has_live_session already keys its name-match on), so a name match here
# means the worktree's owning job entry is orphaned (its worktree is being reaped,
# so its job is confirmed dead by worktree_has_live_session having already
# returned false at every call site that reaches here — see call-site comments).
# A legacy issue-numbered branch (e.g. `42-feature`) never matches a job by this
# name, so this is a harmless no-op there. Never aborts the sweep: every failure
# is logged and this always returns 0.
reap_job_for_branch() {
  local wt_branch="$1"
  local job_id
  if ! job_id=$(claude_job_id_for_name_all "$wt_branch"); then
    log "REAP_JOB_LOOKUP_UNKNOWN: branch=$wt_branch (daemon unqueryable; any orphaned job entry left in place)"
    return 0
  fi
  if [[ -z "$job_id" ]]; then
    return 0
  fi
  if "${DISPATCH_SWEEP_CLAUDE_CMD:-claude}" rm "$job_id" >/dev/null 2>&1; then
    log "REAP_JOB: branch=$wt_branch job_id=$job_id"
  else
    log "REAP_JOB_FAILED: branch=$wt_branch job_id=$job_id"
  fi
  return 0
}
```

Add `DISPATCH_SWEEP_CLAUDE_CMD` to the script's env-override header comment
block (currently lines 22-24, "Environment overrides for testability")
alongside `DISPATCH_SWEEP_LOG_FILE` / `DISPATCH_SWEEP_NOW`, documented as
"The `claude` command used for the mid-phase-dead job reap's `claude rm` call.
Default: `claude`." `lib-claude-agents.sh` is already sourced by
`dispatch-sweep` (line 40), so `claude_job_id_for_name_all` is available with
no new `source` line.

**2c. `dispatch-sweep`: 3 call sites**, each immediately after the worktree
removal + branch-delete + marker-clear steps succeed, right before that
block's own terminal `log` line:

- Site 1, inside `reap_or_skip_not_in_sync()`, after
  `reap_marker_clear "$PROJECT_ROOT" "$wt_basename" || true` (currently line
  171) and before `log "REAP_${suffix}_NOT_IN_SYNC: ..."` (currently line
  172): add `reap_job_for_branch "$wt_branch"`.
- Site 2, the CLOSED-issue removal path, after
  `reap_marker_clear "$PROJECT_ROOT" "$(basename "$wt_path")" || true`
  (currently line 267) and before `log "REMOVE_CLOSED_ISSUE: ..."` (currently
  line 268): add `reap_job_for_branch "$wt_branch"`.
- Site 3, the MERGED removal path, after
  `reap_marker_clear "$PROJECT_ROOT" "$(basename "$wt_path")" || true`
  (currently line 304) and before `log "REMOVE_MERGED: ..."` (currently line
  305): add `reap_job_for_branch "$wt_branch"`.

All 3 sites already have `wt_branch` in scope at that point. At every one of
these 3 sites, `worktree_has_live_session "$wt_path"` has already returned
false earlier in the same code path (line 257 for the CLOSED branch feeding
site 2, and site 1's own `reap_or_skip_not_in_sync` calls at lines 273/310 are
themselves only reached from the `elif`/`else` arms after that same
line-257/288 liveness check) — so the "confirmed dead" precondition already
holds at all 3 sites by construction; no new liveness check needs to be
added.

**2d. `office-hours` dedup (small, low-risk cleanup within this unit)**

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

Out of scope for Unit 2: any change to the not-in-sync grace/quarantine
logic, the PR/issue-state precedence logic, or `worktree_has_live_session`
itself — Unit 2 only adds a reap call after removal already happens through
the existing gates.

**Recommended model:** sonnet. Both the new lib function and the sweep call
sites are mechanical extensions of an existing, extremely well-documented
pattern (`claude_sessions_with_name_all` for the lib function's shape;
`reap_marker_clear` for the "extra cleanup step tucked into an already-
successful removal branch" shape) — no new architecture, just following what
is already there 3 times.

**Dependencies:** none on Unit 1 — Unit 1 touches only `dispatch-stop.sh`
(and its test block); Unit 2 touches only `lib-claude-agents.sh`,
`dispatch-sweep`, and `office-hours` (and their test blocks). Fully disjoint
files, independently testable and mergeable within this one PR.

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
- `worktree_has_live_session`'s already-established liveness gating
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`, line
  497) — Unit 2 adds no new liveness check; it piggybacks on the fact that
  all 3 `dispatch-sweep` removal call sites are already downstream of a
  `worktree_has_live_session` check returning false.

## Verification

Both units are covered by the repo's single monolithic shell test suite, run
whole (it takes no filter/subset argument — `SCRIPT_DIR` is derived from `$0`
only, no `--filter`/pattern mechanism exists):

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
echo "exit code: $?"
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

**Unit 2 test additions** (inside the existing `dispatch-sweep` test block,
currently starting at line 6704):

- Add a new fake-claude helper, modeled on `sweep_fake_claude_sessions_by_name`
  (currently around lines 6994-7014) but (a) including a `.id` field distinct
  from `.sessionId`/`.name` per entry (mirroring the `office_hours_fake_claude`
  convention already used elsewhere in this file, e.g. around lines 3696-3720,
  where `id` is `"j-$name"` vs `sessionId` `"s-$name"`), (b) handling a
  `rm <id>` invocation by logging it to `$STUB_DIR/claude-rm-calls.log` and
  exiting 0 (existing sweep fakes only ever serve `agents --json` and ignore
  all other args), and (c) — **load-bearing, verified against the real
  `worktree_has_live_session`/`claude_agents_list_all`/`_claude_agents_raw`
  chain in `lib-claude-agents.sh`** — the fake MUST discriminate `agents
  --json --all` from plain `agents --json`, serving the registered entries
  ONLY for `--all` and an empty `[]` for the plain form. `_claude_agents_raw`
  (called by `claude_agents_list_all`, which `worktree_has_live_session`
  uses for its liveness gate) issues plain `agents --json` with **no**
  `--all` flag; `claude_job_id_for_name_all` (the new reap-lookup function)
  issues `agents --json --all` directly. If the fake served the same payload
  for both, `worktree_has_live_session` would see the registered "done" job
  and report the worktree OCCUPIED — the sweep would skip removal entirely,
  the reap call would never run, and `claude-rm-calls.log` would stay empty,
  failing every test case below. The discrimination is what makes the fixture
  correctly simulate "a job in a terminal state, invisible to the plain
  active-only listing, but visible to `--all`" — exactly the mid-phase-dead
  scenario Unit 2 exists to reap:
  ```bash
  sweep_fake_claude_sessions_by_name_with_id() {
    local fake="$TMPDIR_TEST/fake/claude"
    local all_payload="[" entry name rest sid jid first=1
    for entry in "$@"; do
      # entry form: name=sid:jid
      name="${entry%%=*}"; rest="${entry#*=}"; sid="${rest%%:*}"; jid="${rest#*:}"
      if (( first )); then first=0; else all_payload+=","; fi
      all_payload+="{\"sessionId\":\"$sid\",\"id\":\"$jid\",\"pid\":1,\"status\":\"done\",\"name\":\"$name\",\"cwd\":\"\"}"
    done
    all_payload+="]"
    printf '%s' "$all_payload" > "$TMPDIR_TEST/fake/all-payload.json"
    cat > "$fake" <<'FAKE'
  #!/usr/bin/env bash
  STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
  FAKE_DIR="$(cd "$(dirname "$0")" && pwd)"
  if [[ "${1:-}" == "rm" ]]; then
    echo "$2" >> "$STUB_DIR/claude-rm-calls.log"
    exit 0
  fi
  if [[ "${1:-}" == "agents" && "${2:-}" == "--json" && "${3:-}" == "--all" ]]; then
    cat "$FAKE_DIR/all-payload.json"
    exit 0
  fi
  # Plain `agents --json` (no --all) — the worktree_has_live_session query
  # path. The registered entries are DONE jobs, not live sessions, so this
  # must stay empty or the liveness gate would report the worktree occupied.
  echo '[]'
  exit 0
  FAKE
    chmod +x "$fake"
    export CLAUDE_AGENTS_CMD="$fake"
    export DISPATCH_SWEEP_CLAUDE_CMD="$fake"
  }
  ```
- Add new test cases (adapting existing fixture patterns from the surrounding
  merged/closed/not-in-sync tests in this block):
  1. MERGED site: register worktree with branch `42-feature`, call
     `sweep_fake_claude_sessions_by_name_with_id "42-feature=sess-1:job-1"`
     before running the sweep, assert `$STUB_DIR/claude-rm-calls.log`
     contains exactly `job-1`.
  2. CLOSED-issue site: same shape, driving the issue-state fixture instead
     of the PR fixture.
  3. Not-in-sync force-reap site (site 1): pre-age a reap marker past
     `NOT_IN_SYNC_GRACE_S` (following the existing not-in-sync-grace test
     pattern elsewhere in this block) so `reap_or_skip_not_in_sync` reaches
     the force-remove branch, and assert the same `claude-rm-calls.log`
     entry.
  4. Negative case: a legacy issue-numbered worktree (e.g. `42-feature`) with
     NO fake job registered under that name (default `sweep_setup` fake,
     which returns `[]`) — assert the sweep still removes the
     worktree/branch normally and `claude-rm-calls.log` is empty or absent
     (harmless no-op, confirming the unconditional call at all 3 sites
     doesn't regress the legacy-issue path).
  5. UNKNOWN-daemon case for the reap lookup specifically — **must isolate
     the reap lookup's UNKNOWN from the liveness gate's own UNKNOWN
     handling**, which is a distinct, already-covered failure mode (an
     UNKNOWN liveness read fails safe toward "occupied" and skips removal
     entirely — see `worktree_has_live_session`'s doc comment — so if this
     test naively points `CLAUDE_AGENTS_CMD` at a nonexistent binary with no
     other override, the worktree is never removed in the first place and
     the reap-lookup path under test never runs). `worktree_has_live_session`
     → `claude_agents_list_all` → `_claude_agents_raw` prefers
     `$DISPATCH_AGENTS_SNAPSHOT` when set and readable, falling back to
     `${CLAUDE_AGENTS_CMD:-claude} agents --json` only when the snapshot is
     absent/unreadable; `claude_job_id_for_name_all` (the new function) never
     reads the snapshot — it always calls
     `${CLAUDE_AGENTS_CMD:-claude} agents --json --all` directly. So: write a
     valid snapshot file containing `[]` and export
     `DISPATCH_AGENTS_SNAPSHOT` to it (satisfying the liveness gate — the
     worktree is free, removal proceeds), while separately pointing
     `CLAUDE_AGENTS_CMD` at a nonexistent binary (the pattern already used
     elsewhere in this file, e.g. around line 187) so only the reap lookup
     fails. Assert the sweep still completes successfully (worktree/branch
     still removed, a `REAP_JOB_LOOKUP_UNKNOWN` log line present, but no
     fatal abort, and `claude-rm-calls.log` empty or absent) — proving the
     job-reap lookup failure is isolated per the "best-effort,
     log-and-continue, never abort the sweep" contract.
- The `office-hours` `job_id_for_name()` refactor (2d) needs no new
  office-hours-specific test (the delegation is behavior-preserving given
  both env vars default identically in production and every existing test
  fixture sets both together) — the full-suite run above is the check that
  proves it.

**Manual/judgment verification** (not exercised by the shell-fixture tests,
which fake `claude` entirely via `CLAUDE_AGENTS_CMD` /
`DISPATCH_SWEEP_CLAUDE_CMD` / `DISPATCH_SELF_CLOSE_CLAUDE_CMD` PATH/env
overrides and never invoke a real daemon):

- A real `claude agents --json --all` / `claude rm <id>` / `claude attach
  <id>` call against the live local daemon requires
  `dangerouslyDisableSandbox: true` when driven interactively from a Claude
  session (per `.claude/rules/sandbox.md § claude agents --json`) — the
  shipped bash scripts themselves need no such flag since they run as
  ordinary background-job/hook/cron processes with normal daemon-socket
  access; this only matters to whoever manually re-verifies post-merge
  behavior by running `claude agents --json --all` before/after a real
  node-worker session's Stop hook fires, or before/after a `dispatch-sweep`
  run against a worktree whose owning job actually died mid-phase.
- After a node worker completes a phase and its Stop fires, `claude agents
  --json` shows no lingering job for that node id, and the node's persisted
  phase advanced on origin/main.
- After an escalation-park, likewise no lingering job, and the node's
  `office_hours` is set (durable before the reap).
- An interactive `/align` or `/office-hours` session is never auto-reaped
  (`CLAUDE_JOB_DIR` gate).
- A mid-phase-dead worker's orphaned job is removed by the sweep pass, not
  left indefinitely.

## needs-main residue

- **id:** 10
- **title:** Real-daemon reap and interactive-session safety observed in production
- **url_path:** current
- **expected outcome:** Terminal node-worker exits (clean, parked, and mid-phase-dead) leave no registry entry, phase/office_hours state is durable, and interactive sessions are preserved.
- **finding:** Requires live `claude agents --json` / `claude rm` calls against the local daemon (which the shell fixtures fake entirely) and observation of real session lifecycle; only verifiable downstream in production, not at PR-merge time in this sandboxed session. Planned deferral: the acceptance criteria for real-daemon reap/self-close and interactive-session safety are documented as non-assertable at merge time — verify by observing `claude agents --json` before/after a real node-worker Stop-hook fire and a real `dispatch-sweep` pass against a worktree whose owning job died mid-phase.
