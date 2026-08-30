---
id: tactic-eval-finding-detached-code-review-dies-with-launcher
kind: tactic
statement: The /code-review pre-stage the review phase launches as a detached
  run is not detached from its launching Bash tool call — interrupting that call
  killed the child session 3ms later and both in-flight max-effort angle
  subagents 96ms later, destroying a 4.5-hour-budgeted review 63 seconds after
  it started and leaving the phase with no graph change
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: phase_price_proxy_usd_discarded
      value: 37.75
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: detached_review_subagent_price_proxy_usd_killed
      value: 6.99
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13T21:48:36Z..21:49:38Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: child_death_lag_after_parent_interrupt_ms
      value: 3
      unit: ms
      window: tactic-attention-namespaced-rank review 2026-08-13T21:49:38Z
      sensor: session-transcript-mtime
      measured: 2026-08-13
    - metric: detached_review_lifetime_s
      value: 63
      unit: s
      window: tactic-attention-namespaced-rank review 2026-08-13T21:48:35Z..21:49:38Z
      sensor: code-review-lock+session-transcript
      measured: 2026-08-13
    - metric: review_launches_on_node
      value: 3
      unit: count
      window: tactic-attention-namespaced-rank ladder
        2026-08-12T20:01Z..2026-08-13T21:52Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: cumulative_review_fix_price_proxy_usd
      value: 135.09
      unit: usd
      window: tactic-attention-namespaced-rank all sessions
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: distinct_observations
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
    - metric: setsid_present_in_version_that_ran
      value: 1
      unit: boolean
      window: dispatch-code-review at base_sha 2614faf3, 2026-08-13T21:48:35Z
      sensor: git-show
      measured: 2026-08-14
    - metric: child_survived_parent_interrupt
      value: 0
      unit: boolean
      window: tactic-attention-namespaced-rank review 2026-08-13T21:49:38Z
      sensor: session-transcript-mtime
      measured: 2026-08-13
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# The "detached" code-review dies with the Bash call that launched it

> **Recurrence 2 is a body correction, not a second observation.** There has
> been exactly **one** occurrence of this finding (2026-08-13). The count moved
> to 2 on 2026-08-14 only because `dispatch-eval-finding` has no amend mode —
> the sole path that refreshes a body increments the count, and the alternative
> (`--resolved-by`) would have asserted a fix that does not exist. Read
> `distinct_observations` in `measured_impact`, not `recurrence_count`. What
> changed is the diagnosis: the original body blamed process-group inheritance
> and prescribed `setsid`. That is **falsified** — see "Corrected diagnosis".

> **Layer placement (answered 2026-08-19 at finalize time).** This node carries
> `attributes.ledger_entry: true` and `attributes.measured_impact`; it is a
> finding record, and `intentions/kind-tactic.md` holds that "an entry is a
> record, not a task". Finalizing it to `phase: implement` is a positive
> judgment that the observation **is** work, made on three grounds. (1) The
> remedy is a bounded mechanism swap in one script with exactly one caller, and
> the mechanism already exists in-repo, in production, with its own test
> harness (`dispatch-ladder-spawn`). (2) The measured cost of one occurrence —
> $37.75 phase price proxy discarded for zero graph change, against $135.09
> cumulative `review-fix` spend on a node whose review phase still had not
> completed — exceeds the fix cost by a wide margin. (3) The blocker the body
> feared is dissolved: "establish the reaper first" is specifiable as an
> autonomous unit after all, because the two candidate reapers are
> discriminated by reading `/proc/<pid>/cgroup`, not by staging a human
> interrupt. The measurement record below is preserved intact alongside the
> plan; it is not replaced by it.

## What was observed

`tactic-attention-namespaced-rank`, `review` phase, ladder launch
`2026-08-13T21:42:01Z` (`--since 1786657321`), halted `2026-08-13T21:51:58Z`
with ladder exit 12, disposition `stalled`.

The review-fix worker reached Step 1b and ran the prescribed launch:

```
cd /home/n8/natb1/commons.systems/.claude/worktrees/tactic-attention-namespaced-rank
...
CR_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-code-review \
  --target "$REVIEW_BASE..HEAD" --out-dir "tmp/code-review-$N" \
  --effort "$CR_EFFORT" --deadline-seconds "$CR_DEADLINE_S" 2>"tmp/code-review-$N.err")
```

The launch **succeeded**. The advisory sidecar
`.claude/worktrees/tactic-attention-namespaced-rank.code-review-lock` was
written at `21:48:35Z` (`pid=2790475 effort=max model=opus deadline_s=16200
target=c3bafccd..HEAD`), and the detached review session
`4328c9ed-97ae-45f0-a62e-e80e9aeda0df` started at `21:48:36.314Z` and spawned
two angle subagents (`agent-a79a2c3f3c15e889b` at `21:48:36.981Z`,
`agent-a34ac99010b84a930` at `21:49:31.384Z`).

65 seconds into that still-running Bash call, the permission layer recorded
`toolUseResult: "User rejected tool use"` on the worker at
**`21:49:38.668Z`**, followed by `[Request interrupted by user for tool use]`.

Every session in the tree stopped writing at the same instant:

| session | role | last transcript write |
| --- | --- | --- |
| `e68cfcc4-…` | review-fix worker | `21:49:38.668Z` (rejection record) |
| `4328c9ed-…` | detached `/code-review` child | `21:49:38.671Z` |
| `agent-a79a2c3f3c15e889b` | angle subagent | `21:49:38.764Z` |
| `agent-a34ac99010b84a930` | angle subagent | `21:49:38.764Z` |

3 ms and 96 ms after the parent's interrupt. Both angle subagents were
mid-work — `a79a2c3` was spawning its own nested "Angle A line-by-line scan"
agent, `a34ac99` was still reading `diff.patch`. `pid=2790475` is gone.

## Corrected diagnosis (2026-08-14)

The original body asserted that "the child is evidently in the launching Bash
call's process group" and prescribed `setsid` or a double-fork. **Both are
wrong: the script already does this, and it did not help.**

Verified against the exact version that ran — `dispatch-code-review` at
`base_sha 2614faf3`, the sha recorded in the code-review lock, unchanged
between then and `origin/main` today:

- line 1089/1099 — `LAUNCH_CMD=( setsid bash -c … )` / `LAUNCH_CMD=( setsid "${CHILD_CMD[@]}" )`
- line 1102/1103 — `"${LAUNCH_CMD[@]}" </dev/null >/dev/null 2>&1 &` then `disown`
- line 369/370 — the script **hard-refuses to run** if `setsid` is absent:
  "it is the measured detached-launch mechanism … and there is no synchronous
  fallback"

So the child was already a session leader in its own process group, with stdin
and both output streams detached from the caller, and disowned by the calling
shell — and it still died 3 ms after the parent's interrupt, taking two
in-flight subagents with it.

This makes the finding **stronger, not weaker**. A pgid- or session-scoped kill
cannot explain the death; the reaper must be walking the descendant tree (or
tearing down a container/cgroup/namespace that encloses the whole worker),
against which `setsid` offers no protection. The kill also arrives from
Claude Code's own tool-interrupt path, not from the ladder — the ladder's halt
came 2m20s *later*, at `21:51:58Z`.

## Why it matters

`dispatch-code-review` is built specifically so the child outlives the caller:
its header documents the child running under `flock -w 1 <sidecar>` with the
kernel holding the node lock "for exactly the child's lifetime", a
`--deadline-seconds` backstop (16200 s here) instead of a foreground timeout,
and a sidecar body it explicitly warns is stale text a crashed run "leaves
behind forever". Every one of those assumptions is false in practice, and the
one mechanism the script relies on to make them true is already in place.

The consequence is that the entire review phase hangs off the survival of one
foreground tool call. When that call was interrupted, a `max`-effort Opus
review with a 4.5-hour budget — already past plan-gating, already fanned out —
was destroyed 63 seconds after it started, and the ladder saw only "the worker
stopped with no graph change".

## Measured cost of the one occurrence

- Phase price proxy **$37.75** (cost $9.25) for **zero** graph change.
- Of that, **$6.99** was the detached review's own already-spawned angle
  subagents, killed mid-turn.
- Worker `e68cfcc4`: 61 turns, peak context 166811, hit ratio 0.943,
  13 sandbox overrides, 1 permission rejection.
- This is the node's **third** review launch (14:30:52 → `reviewed` then
  CI-failed into `fix`; 18:35:04 → no terminal ladder event at all;
  21:42:01 → this halt). Cumulative `review-fix` worker spend on the node is
  $135.09 price proxy with the phase still not complete.

Related: the interrupt that triggered this was recorded separately as
`unattended-worker-tool-use-rejected-midflight`, which has since been resolved
by `1092a403` and retired. That retirement addressed the *interrupt*; it did
not address this entry's defect, which is that the review does not survive one.

---

## Context

The plan below supersedes the body's original three-item "What would have to
change" list. Items 2 and 3 are carried forward as Units 2 and 3. Item 1
("Establish the reaper first … identify which before choosing a remedy,
because the two need different fixes") is carried forward as Unit 1 but with
its **ordering claim corrected**: the two candidate reapers do *not* need
different fixes here, because the single remedy proposed — re-parenting the
launch to a `systemd-run --user` transient unit — defeats both. A transient
unit's main process is started by the user's systemd manager, so there is no
ancestry chain from the launching Bash call to walk, *and* it lives in its own
cgroup under `user@<uid>.service`, so a cgroup/unit teardown of the launching
session does not enclose it. Unit 1 is therefore retained as a **measurement
that records which reaper it was** (and that verifies the remedy actually
moves the child out of the launching session's cgroup), not as a gate the
remedy waits on.

Two alternative hypotheses were checked at planning time and are recorded here
so a later reader does not re-derive them:

- **"The launch was sandboxed, and a sandboxed Bash call's private PID
  namespace killed it."** Refuted by the record above.
  `references/code-review-invocation.md` §9.1 measured that a sandboxed launch
  records a *namespace-local* pid (it observed `7`) and is dead by the next
  call. The 2026-08-13 sidecar recorded `pid=2790475` — a host pid — and the
  child actually ran for 63 s and spawned two subagents. The launch was
  sandbox-off, as Step 1b requires.
- **"§9.1 already proved `setsid` survives the launcher being killed, so the
  finding must be wrong."** No: §9.1's Variant B killed the launcher's *process
  chain* with `kill -9` from a separate call, and the child survived. The
  2026-08-13 death came from Claude Code's own tool-interrupt path, which §9.1
  never exercised. **The probe and production disagree, and the disagreement is
  the diagnosis.** §9.1 must be read, not deleted — and any unit claiming to
  "establish the reaper" must not simply re-run §9.1's `kill -9` recipe, which
  already passes and would conclude nothing.

Current-state anchors, re-verified against this worktree at `origin/main`
`89031064` (`dispatch-code-review` is 1411 lines):

- `:369-370` — the hard refusal when `setsid` is absent.
- `:1026-1028` — the **false claim written into the code**, verbatim:
  "`setsid` is the measured mechanism (references/code-review-invocation.md
  §9.1): the child gets its own session, so it survives both a clean return of
  this call AND the launching call being killed outright." This comment is the
  wrong premise embedded in the script and must be reconciled.
- `:1030-1067` — `CHILD_SCRIPT` / `CHILD_CMD`: the child records its own pid via
  `$$` (not `$!`, because `setsid` may fork or exec), writes the lock body
  inside the lock, and writes `.rc` atomically (`.tmp` then `mv`).
- `:1068-1099` — the `flock -w 1 -E 111` wrapper and the two `LAUNCH_CMD=(
  setsid … )` forms (locked and unlocked).
- `:1102-1103` — `"${LAUNCH_CMD[@]}" </dev/null >/dev/null 2>&1 &` then `disown`.
- `:1111-1146` — the launch-verification loop (`LAUNCH_ATTEMPTS=50` ×
  `LAUNCH_INTERVAL_S=0.2`), which distinguishes a lost `flock` (`RUN_CONFLICT`
  → exit 6) from a child that never started (exit 1).
- `:1148-1156` — the not-alive-and-no-`.rc` check (exit 1).
- `:1220-1232` — the deadline kill via `kill_tree` (exit 4).
- `:1251-1265` — the await loop's dead-child branch: "the detached
  `/code-review` run (pid=…) is gone and recorded no exit code" (exit 1).
- `:459-470` — `CACHE_DIR` precedence: `$DISPATCH_CODE_REVIEW_CACHE_DIR`, else
  `$CLAUDE_JOB_DIR/dispatch-code-review`, else
  `${XDG_STATE_HOME:-$HOME/.local/state}/dispatch-code-review`; plus the hard
  exit 2 if `CACHE_DIR` resolves inside `GIT_ROOT`.
- `:488-499` — the run-state file set keyed on `CACHE_KEY`: `.run`, `.output`,
  `.rc`, `.pid`, `.untracked-before`, `.lock`, `.lock-conflict`.
- `:385` — `GIT_ROOT` is bound here; it is the reviewed worktree and the cwd
  the child must run in.
- Useful symbols: `LAUNCH_CMD`, `CHILD_CMD`, `CHILD_SCRIPT`, `run_is_alive`,
  `proc_starttime`, `kill_tree`, `discard_run_record`,
  `discard_or_restore_run_record`, `run_identity_matches`,
  `await_concurrent_completion`, `worktree_code_review_lock_path`,
  `acquire_lock`.

**Sole caller.** `dispatch-code-review` is invoked from exactly one place:
`.claude/skills/review-fix/SKILL.md` Step 1b (heading `:526`, the launch block
`:631`, the `case $CR_RC` exit-code contract `:704-711`). `review-plan/SKILL.md`
and `review-fix/references/*.md` mention it only in prose. There is no second
caller to keep in sync.

**Near-miss, do not touch.** The deadline path (`:1220-1232`) and `kill_tree`
are the script killing its *own* child deliberately when `--deadline-seconds`
is exceeded; the `flock` / node-lock machinery (`:137-154`, `:393-421`,
`:1120-1140`) is correct as designed. Neither is implicated in this finding.
Do not weaken either while re-parenting the launch. Likewise the resume-cache
security boundary (header "Resume cache and run state — why they do NOT live in
`--out-dir`"): every run-state file must stay outside the reviewed worktree,
and the exit-2 guard at `:469-470` stays.

**Nothing has half-fixed this.** Grepping `intentions/` for this node's id
returns only the node itself; the re-parent/systemd topic returns only
`tactic-sweep-timer-unit-dir-leak` and `tactic-playwright-watchdog-orphan-sleep`,
both `phase: done` and unrelated. `dispatch-code-review` is unchanged in
substance since `base_sha 2614faf3`.

---

## Unit 1 — Measure which reaper, and record it as a new §9.6

**Scope.** No production code changes. Run a measurement, then append a new
`### 9.6` section to
`.claude/skills/review-fix/references/code-review-invocation.md` (§9 starts at
`:506`; §9.1 "The probe" at `:514`; the
`DETACHED_LAUNCH_MECHANISM: setsid` fenced line sits at the end of §9.1).

**Do not edit or delete §9.1's measurements.** They are a dated record and they
remain true for what they measured. Add exactly one forward-pointer sentence at
the end of §9.1 — immediately before the `DETACHED_LAUNCH_MECHANISM` fence —
saying that §9.1's Variant B exercised a `kill -9` of the launcher's process
chain, that the production failure recorded on
`tactic-eval-finding-detached-code-review-dies-with-launcher` came from a
different path (Claude Code's tool-interrupt), and that §9.6 measures the
structural reason. Change nothing else in §9.1–§9.5.

**Method** (every command with `dangerouslyDisableSandbox: true` — a sandboxed
Bash call gets its own PID namespace and the probe would measure the sandbox
instead of the host; see §9.1's sandbox paragraph):

1. From Bash call A, record the *launching call's own* control group and the
   hosting session's: `cat /proc/self/cgroup`, and
   `ps -o pid,ppid,sid,cmd -p $$ -p "$PPID"`. Then launch §9.1's exact probe
   payload into a scratch dir under `$TMPDIR`:
   `setsid bash -c 'echo $$ >"$P"; sleep 300' </dev/null >/dev/null 2>&1 &` then
   `disown`.
2. From Bash call B (a **separate** call), read back:
   `cat /proc/"$(cat "$P")"/cgroup` and
   `ps -o pid,ppid,sid,cmd -p "$(cat "$P")"`.
3. Compare the two cgroup paths.
   - **Same cgroup** ⇒ the cgroup/unit-teardown hypothesis is *sufficient*:
     `setsid` provably changes the session and process group but not the
     cgroup, so a teardown of the launching session's cgroup reaps the child
     regardless. This is exactly what
     `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn:51-60`
     already asserts, in its header, for a structurally identical case.
   - **Different cgroup** ⇒ the cgroup hypothesis is refuted for this host and
     the descendant-tree-walk hypothesis stands. Record that instead.
4. From Bash call C, launch the same payload as a transient unit —
   `systemd-run --user --collect --unit="probe-cr-$$" --setenv=PATH="$PATH"
   bash -c 'echo $$ >"$P2"; sleep 300'` — and from Bash call D read
   `cat /proc/"$(cat "$P2")"/cgroup` and `ps -o pid,ppid,sid,cmd -p "$(cat "$P2")"`.
   Confirm the unit child sits under a **distinct** `…/user@<uid>.service/…`
   cgroup with `ppid` 1 (or the user manager), i.e. in neither the launching
   call's cgroup nor its process ancestry. Clean up:
   `systemctl --user stop probe-cr-<n>.service` (best effort) and kill the probe
   pids.

**Deliverable.** §9.6 records: the three cgroup paths verbatim, the two `ps`
lines, the verdict from step 3, and one explicit sentence stating that
`systemd-run --user` defeats **both** candidate reapers, so the remedy does not
depend on the verdict. If step 4 fails (no systemd user manager, D-Bus denied),
record the failure verbatim and **stop** — do not proceed to Unit 2; that
outcome invalidates the chosen remedy and belongs in office-hours.

**Out of scope.** Any change to `dispatch-code-review`; any attempt to stage a
real permission rejection or tool interrupt (that stays a manual confirmation
in ## Verification below).

**Recommended model:** sonnet

## Unit 2 — Re-parent the detached launch to a `systemd-run --user` transient unit

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-code-review`,
its test suite
`.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh`, and
the two prose surfaces that assert the falsified `setsid` guarantee.

**Greenfield design.** The child is launched as a transient
`systemd-run --user` service. That is the ideal design independent of migration
cost: the user's systemd manager owns the process, so the review has no
ancestry relationship to the Bash tool call at all, and it lives in its own
cgroup rather than the launching session's. It is also the design the repo has
already converged on twice for exactly this problem —
`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn:139-181` and
`.claude/skills/dispatch-propagate/scripts/dispatch-spawn-tick:36-99,187-250`.
Reuse that shape; do not invent a third detach mechanism.

**Concrete changes.**

1. **Wrap, do not replace, `LAUNCH_CMD`.** Keep the existing
   `setsid`+`flock`+`CHILD_CMD` payload at `:1068-1099` byte-identical in
   behavior. Build the launch as
   `systemd-run --user <flags> -- "${LAUNCH_CMD[@]}"`. Keeping `setsid` inside
   the unit is deliberate and costs nothing: it preserves the process-group
   isolation the test suite's `cr-fake-crash` stub depends on (`kill -9 0` must
   never reach the harness), and it makes the payload identical whether it runs
   under real systemd or under a test stub.
2. **Run `systemd-run` in the foreground, not `& disown`.** Replace
   `:1102-1103`. `systemd-run --user` returns as soon as the unit is created.
   Capture its exit code directly into a variable — after `if cmd; then … fi`,
   `$?` is the `if` construct's status, not the command's (see
   `dispatch-ladder-spawn:151-160`). A non-zero `systemd-run` is a launch
   failure: emit one stderr line naming the unit and systemd's stderr, and exit
   **2** (unusable run state / launch error), not 1 — `/review-fix` maps exit 1
   to "the nested run crashed", which would mis-report a launch that never
   happened. Leave the existing launch-verification loop at `:1111-1146`
   unchanged; it still proves the child came up by polling for `RUN_PIDFILE`,
   and it is still what distinguishes a lost `flock` (exit 6) from a child that
   never started (exit 1).
3. **Flags, each with a recorded reason:**
   - `--unit="dispatch-code-review-${CACHE_KEY:0:16}-$(date +%s)"` — **unique
     per launch**, a deliberate divergence from `dispatch-ladder-spawn`'s fixed
     name. There the unit name *is* the dedup because nothing else serializes
     ladder runs; here the `flock` node lock plus the `.run` identity record
     already serialize, and the supersede path at `:846-880` kills a stale run
     by pid and relaunches immediately — a fixed name would collide with the
     dying unit and turn a correct relaunch into a spurious failure. State this
     divergence in a comment.
   - `--collect` — GC the finished or failed transient unit.
   - `--working-directory="$GIT_ROOT"` — **load-bearing**. The current child
     inherits the launcher's cwd; a systemd unit does not, and
     `/code-review` reviews the repo it is run in. `GIT_ROOT` is bound at
     `:385`.
   - `--setenv=PATH="$PATH"` — without it the unit inherits the user manager's
     minimal PATH, which omits the nix store, so `/usr/bin/env` cannot resolve
     bash on NixOS/WSL (exit 127) and `claude`/`git`/`gh` are unfindable. Same
     reason recorded at `dispatch-ladder-spawn:63-66`.
   - `--setenv=HOME="$HOME"` — the `claude` CLI resolves credentials and config
     under `$HOME`.
   - **No `--property=KillMode=process`**, and say why in a comment: this is the
     considered divergence from `dispatch-ladder-spawn:51-60`. There the unit's
     cgroup contained unrelated `claude --bg` fleet workers, so a group kill
     would reap the fleet. Here the cgroup contains exactly one review tree
     (the angle subagents are in-process API calls, not processes), so the
     default `KillMode=control-group` is correct containment — it means the
     deadline kill and any `systemctl stop` reap the whole review rather than
     orphaning a `claude` session while releasing the `flock`.
   - **No `OnFailure=`** — a failed review must never fire a recovery chain,
     for the same reason `dispatch-ladder-spawn:41-49` omits it.
4. **Reset lingering failed units.** Because names are unique, a failed
   transient unit is a slow leak in the manager's memory rather than a wedged
   name. Before each launch, best-effort
   `"$SYSTEMCTL_CMD" --user reset-failed 'dispatch-code-review-*' >/dev/null 2>&1 || true`.
   Never abort a launch on `systemctl`'s account.
5. **Replace the availability refusal at `:369-372`.** `setsid` alone is no
   longer sufficient, so the check becomes: `setsid` **and** `systemd-run` must
   both resolve, and `systemctl --user is-system-running` must not fail
   outright. On failure, exit 2 with a message naming which one is missing and
   citing `references/code-review-invocation.md` §9.6. **Do not add a `setsid`-only
   fallback** — a fallback here silently reintroduces the exact defect this
   node records, which `.claude/rules/code-style.md` forbids ("prefer clear
   errors over defensive fallbacks").
6. **Test seams.** Add `DISPATCH_CODE_REVIEW_SYSTEMD_RUN_CMD` and
   `DISPATCH_CODE_REVIEW_SYSTEMCTL_CMD`, mirroring
   `DISPATCH_LADDER_SPAWN_SYSTEMD_RUN_CMD` / `..._SYSTEMCTL_CMD`
   (`dispatch-ladder-spawn:80-83,135-136`). Document both in the header's
   existing environment-overrides block (near `:80`).
7. **Reconcile the false claims in prose.** Three sites:
   - `dispatch-code-review:1026-1028` — the comment asserting `setsid` makes the
     child survive "the launching call being killed outright". Rewrite it to
     state what is now measured: `setsid` gives the child its own session but
     **not** its own cgroup, so it does not survive a tool-interrupt teardown of
     the launching session (§9.6); the transient unit is what provides
     survival, and `setsid` is retained only for process-group isolation.
     Keep the surrounding paragraphs about `$$` vs `$!` and the atomic `.rc`
     write intact — they are still true.
   - `dispatch-code-review:38-40` — "The run is ALWAYS launched detached
     (`setsid`)" in the header. Update the mechanism name.
   - `.claude/skills/review-fix/SKILL.md:600-612` — "`dispatch-code-review`
     therefore launches the run detached (`setsid`)" and the sandbox paragraph.
     Update the mechanism name and add one clause noting that
     `systemd-run --user` talks over D-Bus, which is a **third** independent
     reason the call needs `dangerouslyDisableSandbox: true` (alongside the
     `--fix` write-allowlist reason and the PID-namespace reason already
     documented there). Do **not** change the `case $CR_RC` block at `:704-711`
     — no new exit code is introduced; a `systemd-run` launch failure routes to
     the existing exit 2 branch, whose prose already reads "argument,
     empty-output, or unusable run-state error".
8. **Test changes**, all in the already-CI-registered
   `test-dispatch-code-review.sh` (auto-discovered by
   `run-unit-tests.sh:150-176`'s `test-*.sh` glob for anything under
   `.claude/skills/dispatch-propagate/scripts/`; no
   `.github/workflows/unit-tests.yml` edit is needed because the SUT and the
   suite both live there — the suite already reaches *out* to
   `review-fix/SKILL.md` in its doctrine-ratchet block at `:1355-1394` and needs
   no separate registration):
   - Add a fake `systemd-run` to the suite's stub set and export
     `DISPATCH_CODE_REVIEW_SYSTEMD_RUN_CMD` pointing at it in `cr_setup`. The
     stub **must** log its full argv to a file and then strip the leading
     `--user`/`--unit=…`/`--collect`/`--property=…`/`--working-directory=…`/
     `--setenv=…` flags and the optional `--` and `exec` the remainder, honoring
     `--working-directory` with a `cd`. **This is the load-bearing test
     constraint:** the existing ~30 cases (notably 29/30 at `:1138`/`:1227`, and
     the crash case at `:791`) drive the real child through to completion, and
     `cr-fake-crash`'s `kill -9 0` is only safe because the payload runs under
     `setsid`. Keeping `setsid` inside the payload (change 1) preserves that.
     Also export `DISPATCH_CODE_REVIEW_SYSTEMCTL_CMD` at a no-op stub, so the
     fixture's host-systemd leak guard
     (`dispatch-test-fixture.sh:81-116,177-197`) stays green.
   - New case: **the launch shells `systemd-run --user` with the required
     flags** — assert the logged argv contains `--user`, a `--unit=` beginning
     `dispatch-code-review-`, `--collect`, `--working-directory=<repo>` and
     `--setenv=PATH=`.
   - New case: **negative assertion, no `KillMode=process` and no `OnFailure=`**
     in the logged argv, each with its own assertion so a later edit that copies
     `dispatch-ladder-spawn` wholesale trips a test rather than silently
     changing containment semantics.
   - New case: **a `systemd-run` that exits non-zero without launching anything
     yields exit 2**, with stderr naming the unit — not exit 1.
   - New case: **two launches for the same out-dir get different unit names**
     (the supersede/relaunch path must not collide), asserted by comparing the
     two `--unit=` values in the argv log across the case-29 relaunch shape.
   - Extend the existing doctrine-ratchet block at `:1355-1394`: assert that
     `review-fix/SKILL.md` no longer contains the string `detached (\`setsid\`)`
     and does contain the new mechanism sentence, so the prose cannot drift back.

**Out of scope.** The `flock` node-lock machinery, `kill_tree`, the deadline
path, the resume-cache identity test, the await loop's branch structure, and
`CACHE_DIR` location (Unit 3 owns that). No new exit code.

**Dependencies:** Unit 1 (its step 4 is the go/no-go on whether
`systemd-run --user` is available at all in the environment these workers run
in).

**Recommended model:** opus

## Unit 3 — Make a surviving run findable by the next session

**Scope.** `dispatch-code-review:459-470` (the `CACHE_DIR` precedence block),
its header documentation at `:79-83`, and one new case in
`test-dispatch-code-review.sh`.

**The gap, stated precisely.** In-loop detection of a dead child already works
and needs nothing: `run_is_alive` false with no `.rc` exits 1 with "the detached
`/code-review` run (pid=…) is gone and recorded no exit code" (`:1251-1265`),
distinct from the deadline kill's exit 4 and the lock-contention exit 6. The
gap is one level up. The tool-interrupt killed the launching *session*, so no
later await call was ever made — and `CACHE_DIR` defaults to
`"$CLAUDE_JOB_DIR/dispatch-code-review"` whenever `CLAUDE_JOB_DIR` is set. That
directory is deleted with the job, so a **fresh** `review-fix` session cannot
find the previous run's `.run`/`.pid`/`.rc`/`.output` at all, and the run
becomes unreconstructable even when it survived. Unit 2 makes the child
genuinely outlive its launcher, which makes this seam *more* load-bearing, not
less: a surviving review nobody can collect is still a total loss of the spend.

**Change.** Drop the `$CLAUDE_JOB_DIR` branch. Precedence becomes
`$DISPATCH_CODE_REVIEW_CACHE_DIR` (test seam / explicit override), else
`${XDG_STATE_HOME:-$HOME/.local/state}/dispatch-code-review` — a host-stable
location that outlives any one job or session. Update the header block at
`:79-83` and the "Resume cache and run state" prose to match, adding one
sentence recording *why* the job-dir branch was removed (it made a surviving
detached run invisible to the next session; this node's finding).

**Why this is safe, argued rather than assumed.** Every guard that made the
job-scoped location acceptable is keyed on content, not on location:
- The security boundary is "outside the reviewed worktree", enforced by the
  exit-2 check at `:469-470`, which is unchanged and still fires.
- Cross-session staleness is already covered by `run_identity_matches` /
  `cache_is_current`: a cached summary replays only when cache-schema version,
  out-dir, `--target`, both resolved target commits, HEAD, `--effort`,
  `--model` and the `--comment` flag **all** match, and the artifacts it points
  at still exist. Anything else re-runs. An in-flight record is resumed under
  the same test, and branch (c) (`:846-880`) kills a superseded in-flight run
  and relaunches with the before-image rule the header documents.
- An abandoned `LOCK_DIR` is already broken after `LOCK_STALE_S` (`:815-826`).

**Test.** One new case: with `CLAUDE_JOB_DIR` set and
`DISPATCH_CODE_REVIEW_CACHE_DIR` unset, assert the run-state files land under
`${XDG_STATE_HOME}` (point `XDG_STATE_HOME` at the suite's tmp sandbox) and
**not** under `$CLAUDE_JOB_DIR`. Keep the existing case at `:700` (run-state
artifacts live under `CACHE_DIR`, never under `--out-dir`) untouched.

**Out of scope.** Any new bookkeeping file — the existing `.run`/`.pid`/`.rc`/
`.output`/`.untracked-before`/`.lock-conflict` set is sufficient and must be
reused, not extended. Any change to the identity test. Any read-back UI beyond
what exit 5's `status=running` block already prints.

**Dependencies:** Unit 2.

**Recommended model:** opus

---

## Reuse

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn:139-181` — the
  `systemd-run --user` launch block to copy: unit naming, `--collect`, the
  `is-failed`/`reset-failed` guard (#2013), `--working-directory`,
  `--setenv=PATH`, direct `RC=$?` capture, stderr pass-through.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn:51-60` — the
  header rationale stating that `setsid` changes the session/process group, not
  the cgroup. The in-repo, independently-recorded confirmation of this
  finding's mechanism.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn:80-88` — the
  environment-override seam names and the "needs `dangerouslyDisableSandbox`
  because `systemd-run --user` talks over D-Bus" note.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-tick:36-99,187-250` —
  the sibling instance of the same template; read alongside `dispatch-ladder-spawn`
  to see which flags are load-bearing versus situational.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-spawn.sh:30-60` —
  the fake `systemd-run` / `systemctl` stub shape and argv-log assertions, so no
  real systemd is needed in tests.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh:1-113`
  — `cr_setup`, `write_fake_code_review_claude`, `cr_reset_stubs` and the
  `cr-fake-*` stub-file protocol. Extend this harness; do not build a second one.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh:1355-1394`
  — the existing doctrine-ratchet block (`grep -c -F` over
  `review-fix/SKILL.md` and `references/`). Extend it rather than adding a new
  file, which would need its own unconditional CI step.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` —
  `setup()`, `TMPDIR_TEST`, `SAVED_PATH`, the host-systemd leak guard, and
  (via `test-helpers.sh:15-99`) `assert_eq`, `assert_contains`,
  `assert_exit_nonzero`, `assert_file_contains`, `report_results`.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:2376` — `kill_tree`, already
  sourced at `dispatch-code-review:231` and used at `:880` and `:1227`. Reuse
  for any cleanup path; add no bespoke kill.
- `dispatch-code-review:653-680` — `proc_starttime` / `run_is_alive`, the one
  liveness primitive the whole script routes through. Add no second probe.
- `.claude/skills/review-fix/references/code-review-invocation.md:506-600` — §9
  and §9.1: the existing measured detached-launch record and the probe recipe
  Unit 1 extends into §9.6.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:150-176` — the
  `test-*.sh` auto-discovery loop that already covers this suite.

## Verification

Run the script's own suite (it is the CI vector for both units):

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh
```

Run the lint bundle the review phase itself gates on:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Confirm no `setsid`-only launch survives in the script, and that the transient
unit is what launches the child (this must FAIL on today's `origin/main`):

```verify
grep -q 'systemd-run' .claude/skills/dispatch-propagate/scripts/dispatch-code-review
```

Confirm the falsified claim is gone from the code comment:

```verify
! grep -q 'so it survives both a clean return of' .claude/skills/dispatch-propagate/scripts/dispatch-code-review
```

**Manual / observe-in-production checks.**

- **The finding's own stated after-test, run by hand.** From a session with
  `dangerouslyDisableSandbox: true`, launch a real `low`-effort review on a
  scratch branch, note `pid=` from `<worktrees-root>/<worktree>.code-review-lock`,
  then **interrupt the launching Bash tool call by rejecting a permission prompt
  or pressing escape mid-call** — the exact path §9.1 never exercised. From a
  fresh Bash call afterwards, confirm `kill -0 <pid>` succeeds, that
  `ps -o pid,ppid,cgroup -p <pid>` shows it under its own
  `dispatch-code-review-*.service` cgroup, and that the child transcript keeps
  growing. Then confirm the *next* invocation with identical arguments resumes
  that same run (exit 5 `status=running`, then exit 0) rather than paying for a
  second review. This is the one check that cannot be automated — it needs a
  human to trigger the interrupt — and it is the definitive close of this
  finding.

  **RULED 2026-08-29 — the proxy is accepted, and this check no longer gates
  anything.** *(Author batch-execution sitting; recorded in commit `08870461` /
  PR #3132, whose body states "PR6 interrupt gate ruled: proxy accepted, Units 2-3
  ship without the attended interrupt test", and indexed in
  `plans/dispatch-rsi-author-rulings.md`.)* The author accepted the
  **background-teardown demonstration** as satisfying the owed confirmation: a
  detached run survived the teardown of the launching Bash tool call and ran to
  completion, writing its marker 12s later. That exercises the same
  `systemd-run --user` re-parenting mechanism. **Honest limit, stated at the
  sitting:** the demonstration killed a *background* task — the same class of
  teardown, but not literally a human interrupting a foreground tool call. So the
  attended check above is a **confirmation, not a discovery**, and it is an
  optional follow-up the author may run at any attended moment. **Units 2 and 3
  ship without it.** The 2026-08-28 sitting had established topology only (PPID
  314, own `app.slice` cgroup, `flock` released on child exit) and explicitly not
  survival of a launcher teardown; that is the gap this ruling closes.
- **Live smoke test of the unit's environment**, run once before trusting Unit 2
  in production. A systemd unit does **not** inherit the launching session's
  environment; only `PATH` and `HOME` are forwarded. Run one real `low`-effort
  review end-to-end and confirm exit 0 with `status=ok`. If the nested `claude`
  fails to authenticate or cannot resolve a binary, diff the launching session's
  `env` against `systemctl --user show-environment`, and forward the missing
  variable with an additional explicit `--setenv=` (documented, one per
  variable) rather than forwarding the environment wholesale — `--setenv` values
  are readable via `systemctl --user show`, so anything secret-shaped should be
  left to `$HOME`-based credentials instead.
- **Journal check.** After a run, `journalctl --user -u 'dispatch-code-review-*'`
  should show the unit started and exited; the review's own output still goes to
  `$RUN_OUTPUT`, not the journal. Confirm no unit lingers in `failed` state
  after several runs (`systemctl --user list-units --failed`), which is what the
  `reset-failed` sweep in Unit 2 change 4 exists to prevent.
- **Judgment call for the implementer.** If Unit 1 step 4 shows no usable
  `systemd-run --user` in the environment `review-fix` workers actually run in,
  stop and park to office-hours. The remedy has no second-best form that is
  worth landing: a `setsid`-only fallback is precisely the mechanism this node
  measured as insufficient.
