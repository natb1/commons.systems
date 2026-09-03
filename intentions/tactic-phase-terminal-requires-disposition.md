---
id: tactic-phase-terminal-requires-disposition
kind: tactic
statement: A phase skill that terminates on a needs-human judgment item must
  land an office_hours park before exiting — ending a phase with the node still
  at its entry phase and office_hours null is indistinguishable from work never
  started, so releasing the node re-selects it into an identical pass that
  reaches an identical dead end, a churn loop that never converges
owner: ai
status: codified
parent: null
rationale: "Observed live 2026-07-31 during the dispatch-pipeline bootstrap, on
  two Wave A nodes at once. A /qa-fix worker on
  tactic-graph-commit-intentions-base-stale-restore ran a complete and correct
  QA pass — all six script-verifiable items green (test-graph-commit.sh 50/50,
  test-park-node.sh 21/21, test-transition-node.sh 3/3, intentionsutil vitest
  717/717, lint clean, code inspection), no defects — then terminated on one
  genuine needs-human item: whether to accept the fail-closed
  park-the-whole-invocation tradeoff in ensure_intentions_only_base()'s
  three-way-merge replay. It exited done with the node still phase: qa and
  office_hours: null. The churn was directly measured, not inferred: reaping the
  holder at 00:49Z produced a fresh worker that redid the entire pass and was
  done by 01:01Z with the node unchanged. Crucially, the second session did NOT
  simply forget to park — it drafted the park reason and a full line-numbered
  recommendation, wrote both to its job directory, and ended expecting the Stop
  hook to fire park-node; the hook did not, and the session named the mechanism
  itself: the Stop hook does not reliably fire the park after a session awaits a
  background Workflow. So the defect has two distinct shapes that must both be
  closed — a skill that never writes a disposition at all, and a skill that
  delegates the write to a Stop hook that silently no-ops. This is the same
  class as tactic-qa-fix-node-terminal-declaration, whose fix-finalize path
  declares no node-terminal marker and freezes its own node, and the fix should
  be planned against both: the general rule is that a phase terminating with the
  node at its entry phase and no disposition is an ERROR, not a normal exit, and
  should be detected mechanically rather than left to each skill's good
  behavior. Note the operational trap this creates, which is the opposite of the
  tactic-stopped-session-blocks-node playbook: reaping a done session whose node
  never advanced is what RESTARTS the loop, so a terminal session on an
  unadvanced node is a symptom to diagnose, never garbage to collect. Filed
  together with tactic-denied-command-parks-node and
  tactic-standdown-winner-liveness — all three are the same root confusion, that
  'held' and 'being worked' are not the same predicate and no code distinguishes
  them, with tactic-router-spawn-window-duplicate-worker the fourth member.
  Interim attention scaffolding only — tactic-attention-tier-ranking replaces
  the numeric scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.
  Finalized 2026-07-31: blocked_by now names tactic-denied-command-parks-node
  (the lib-frozen-session-park.sh sweep framework this tactic's predicate
  extends does not exist on origin/main until that PR lands), so this Wave A
  promotion lifts no unblocked node and cannot compound until that dependency
  clears."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.05
  rationale: >-
    Bootstrap re-scale 2026-07-31: Wave A of the three-band interim scale (50 /
    20 / 10) that puts write-path and pipeline-integrity work above ordinary
    feature work. Belongs in this band on the band's own criterion — it burns a
    full autonomous phase pass per iteration on a node that cannot advance, and
    it held two Wave A nodes simultaneously on 2026-07-31, contributing directly
    to the measured zero-productive-worker state. Finalized 2026-07-31
    (/align-tactics tactic-mode round): status is now codified and phase
    implement, with a full plan in the body; blocked_by names
    tactic-denied-command-parks-node, so the router will not select this node
    for implementation until that PR lands lib-frozen-session-park.sh.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 50 to 0.05 so this
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
  branch: tactic-phase-terminal-requires-disposition
  pr: 3004
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-07-31T20:15:44Z
    mergeCommitSha: c06c72950f96061b392dedfb05aeeb2b0ee094d8
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: "Re-read at the full ~5-day/34k-line observation window (PR #3004 merged
    2026-07-31T20:15:44Z to now 2026-08-05). 3 of 4 needs-main items now resolve
    clean via journalctl -t dispatch-tick: (1) design-2-grace-cap-defaults — 86
    real parks across 1218 sweeps, min idle-at-park 329s (grace=300s, zero
    premature), park_max=2 cap hit exactly 9 times and never exceeded — defaults
    hold against real volume (also confirms the stale-description mismatch the
    prior pass flagged: residue text says cap default \"3\", shipped default is
    2, doc-only, no code defect); (2) design-3-unmeasurable-keep —
    unmeasurable=0 across all 1218 sweeps, re-confirmed over the fuller window;
    (4) design-5-best-effort-retry-forever — 28 \"will retry next tick\" events
    across 11 distinct nodes (more than the prior 4h sample's single instance,
    some nodes retried up to 7x during a 2026-08-04 05:25-05:47 burst of
    concurrent dispatch-tick contention), but every case resolved — none
    retried-and-failed indefinitely. Item 3, design-4-daemon-unknown, is
    genuinely WAIT rather than resolvable now: zero \"daemon unqueryable\" lines
    occurred in the full window (grep -c against dispatch-tick journal) because
    no real daemon outage has happened yet to exercise the noticed-vs-not
    question — the mechanism itself is confirmed sound by code inspection (same
    syslog PRIORITY=6 as routine lines, no elevation), it just has nothing to
    observe yet."
  since: 2026-08-05
  recommendation: "No author decision needed — re-selection only, once a real
    daemon outage occurs or enough further time has passed to make its continued
    absence itself informative. On re-check: grep the dispatch-tick journal
    since this park's `since` date for `lib-frozen-session-park: daemon
    unqueryable` (also the duplicate-name-set and live-session-registry
    unqueryable variants in the same file). If a real occurrence is found,
    confirm from `journalctl -o json` whether it was emitted at an elevated
    PRIORITY or stayed at routine PRIORITY=6, and whether the outage window
    shows a gap in \"terminal-disposition sweep complete\" lines that nobody
    flagged. Items 1 (design-2-grace-cap-defaults), 2
    (design-3-unmeasurable-keep) and 4 (design-5-best-effort-retry-forever) are
    resolved with direct 5-day journal evidence above and do not need further
    review. Separately, worth a future editorial fix (not blocking): the residue
    text above still describes the park-cap default as \"3\"; the shipped
    default in lib-frozen-session-park.sh is 2."
  session_type: other
pace_exempt: true
rounds: null
attributes:
  pre_namespacing_boost: 50
---
# A phase skill that terminates on a needs-human judgment item must land an office_hours park before exiting — ending a phase with the node still at its entry phase and office_hours null is indistinguishable from work never started, so releasing the node re-selects it into an identical pass that reaches an identical dead end, a churn loop that never converges

## Context

A graph node worker that finishes a phase pass on a needs-human judgment item
must land an `office_hours` park before its session ends. Today it frequently
does not, and the resulting state — node still at its entry `phase`,
`office_hours: null` on `origin/main` — is **indistinguishable from work never
started**. The router re-selects the node, a fresh worker redoes the identical
pass, reaches the identical dead end, and the loop never converges. This was
measured on 2026-07-31, not inferred: reaping the holder at 00:49Z produced a
successor that redid a full `/qa-fix` pass and was `done` by 01:01Z with the
node unchanged at `phase: qa`.

The failure has two shapes. **Shape 1**: the skill never writes a disposition.
**Shape 2**: the skill *does* draft the escalation (writes
`$CLAUDE_JOB_DIR/office-hours-reason` and `office-hours-recommendation`) and
delegates the landing to the `.claude/hooks/dispatch-stop.sh` Stop-hook
backstop — which then silently no-ops.

Shape 2 is quantified: the Stop-hook backstop was **0 for 5** on 2026-07-31
across five nodes and four phase lanes, while in-session `park-node` calls
succeeded four times the same day. Three structural reasons it cannot work from
that call site:

1. **Wrong base.** The hook runs `park-node` from the worker's own PR-branch
   worktree; `graph-commit`'s `ensure_intentions_only_base()` fires on any
   worktree ahead of `origin/main` carrying non-`intentions/` changes — i.e.
   every PR branch.
2. **No budget.** `graph-commit`'s landing budget is
   `MAX_PUSH_ATTEMPTS x (CHECK_TIMEOUT_SECONDS + 30)` = 1050s; a tick's own
   reconcile routinely holds `refs/graph/landing-lock` ~10 minutes. A
   session-teardown hook has no such budget.
3. **Failure is swallowed three times over.** `dispatch-stop.sh:92` runs
   `park-node` under `>/dev/null 2>&1`; the `else` warning at `:95` reaches no
   journal (zero `[dispatch-stop] WARNING` lines in the whole journal); and the
   hook exits 0 by contract (`:41-42`).

The residue is durable and nobody reads it: a local `graph: park <id>` commit on
the worker's branch reachable from no remote ref, a dirty `M intentions/<id>.md`
that reads as a stray manual edit, and the still-present
`$CLAUDE_JOB_DIR/office-hours-reason` (deleted only on success,
`dispatch-stop.sh:93`). Meanwhile `park-node` writes the `node-terminal` marker
only on success, so no park means no marker, so `dispatch-self-close --node`
**HOLDs the job alive** — leaving the node simultaneously re-selectable *and*
held.

### The intended outcome

Move the disposition write from a fire-once session-teardown hook to a
**per-tick sweep that runs from the main checkout and retries next tick**. The
sweep detects the terminal-without-disposition condition mechanically, re-lands
the worker's own drafted escalation text when it exists, and synthesizes a park
otherwise. The Stop-hook backstop is then **deleted**, not repaired — a
fire-once writer with the wrong base, no budget, and a swallowed exit code
cannot be made reliable, and its presence hides the failure it was added to
prevent.

### Greenfield design (lead)

One sweep framework in
`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` carrying
several named predicates over the same skeleton — frozen-at-denial
(`tactic-denied-command-parks-node`), terminal-without-disposition (this node),
and stand-down recheck (`tactic-standdown-winner-liveness`) — rather than three
near-duplicate sweep files. Every predicate shares the four properties that make
the pattern correct:

- invoke `park-node` by a path rooted at the **main checkout**, so invariant I1
  holds;
- **keep the evidence and retry on the next tick** rather than swallowing a
  failed land;
- fail-safe: never park without positive evidence (UNKNOWN daemon, unreadable
  transcript, missing node file all mean *keep*);
- emit **one greppable stderr line per disposition** plus one summary count, so
  a growing population is visible rather than silent.

Disposition landing is a tick-owned, retrying, main-checkout operation. Session
teardown owns only the marker-gated **reap decision**, never a graph write.

### Brownfield migration path

The framework file does not exist on `origin/main` yet — it ships in PR #2994
(`tactic-denied-command-parks-node`, currently `phase: qa`, branch
`tactic-denied-command-parks-node`, `state: OPEN`, `mergedAt: null` as of
2026-07-31). Verified: `git ls-tree origin/main` has no
`lib-frozen-session-park.sh`. So:

1. **Precondition (blocking).** #2994 must be merged before Unit 2 can start.
2. Add the new predicate to that framework (Unit 2), after adding its candidate
   lister (Unit 1).
3. Wire it into `dispatch-tick` on both cadences (Unit 3).
4. Only **then** delete the Stop-hook backstop and reword the SKILL.md prose
   that names it (Unit 4) — the replacement must be live before the seam is
   uncovered.

### Dependency note — why `blocked_by` is empty

This node previously carried `blocked_by: [tactic-denied-command-parks-node]`,
encoding "step 2 depends on step 1" from the bootstrap plan. That edge was
removed 2026-07-31 once PR #2994 merged (17:15:22Z, `03a15623`).

The real dependency is **the sweep framework must exist to add a predicate to
it**, and `lib-frozen-session-park.sh` is on `main` — Unit 0 below asserts
exactly that, which is the right place for it. What the `blocked_by` edge
actually gated was the *blocker node reaching `done`*, and that node went to
`main-qa` carrying `## needs-main` residue whose item 1 is verifiable only
against a real live classifier denial occurring by chance. Left in place, the
edge would have held this node until an unrelated external event happened.

**The general rule, which holds beyond this node: validating a fix must not
block progress that depends only on the fix having landed.** A node awaiting
deferred observation is a legitimate state; propagating that wait to its
dependents is not. Where a dependent needs merged code, gate it on the code
(assert the file/function exists, as Unit 0 does) rather than on the producing
node's phase.

### Unit 0 — precondition check (do this first, no code)

From the worktree root, after `git fetch origin main`:

```
git show origin/main:.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh >/dev/null
```

- **Exit 0** — the framework has landed. Merge `origin/main` into the working
  branch and proceed with Unit 1.
- **Non-zero** — PR #2994 has not merged. Do **not** invent a second sweep file
  and do **not** partially implement. Stop and park this node via
  `packages/intentionsutil/scripts/park-node
  tactic-phase-terminal-requires-disposition "<reason>" "<recommendation>"`
  with the reason "blocked on PR #2994 (tactic-denied-command-parks-node)
  landing `lib-frozen-session-park.sh`, the sweep framework this node's author
  ruling directs this predicate to extend" and the recommendation "merge PR
  #2994, then clear-park this node".

Recommended model: sonnet.

---

## Unit 1 — `claude_agents_list_terminal_workers` in `lib-claude-agents.sh`

### Scope

**Changes** `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`:

- Add a new function `claude_agents_list_terminal_workers`, placed immediately
  after `claude_agents_count_held_for_debug` (origin/main `:1080-1115`) and
  before `verify_agent_registered_under`. On the post-#2994 tree,
  `claude_agents_list_blocked_workers` sits at roughly `:1119-1170` — the new
  function is its sibling and must read as an obvious pair with it.
- Add the name to the function index in the file header (origin/main `:18-23`,
  where `claude_agents_count_held_for_debug` and `claude_session_id_is_live` are
  already listed).

**Contract** (document it in the same comment style as the neighbours):

- Emits one TSV line per matching row: `sessionId<TAB>name<TAB>cwd`.
- Match set: rows whose `.name` is a string matching the worker keyspace
  `^[0-9]+-|^tactic-|^strategy-` (identical to
  `claude_agents_count_held_for_debug` and `claude_agents_list_blocked_workers`;
  it excludes routers named `dispatch-<short-id>`) **and** whose resolved state
  `(((.state // .status) // "") | tostring)` is a member of the terminal
  enumeration `["done","stopped","killed","failed","errored","error",
  "cancelled","canceled","terminated"]` — reuse the `terminal_states` jq `def`
  verbatim from `claude_agents_count_held_for_debug` (origin/main `:1102-1105`),
  and reuse its `.state`-then-`.status` fallback resolution and its rationale
  comment (`:1094-1099`).
- Query the daemon **directly** with `"${CLAUDE_AGENTS_CMD:-claude}" agents
  --json --all 2>/dev/null` — **not** `_claude_agents_raw`. This is the point
  where it diverges from `claude_agents_list_blocked_workers`, and the reason
  must be in the comment: the tick snapshot (`DISPATCH_AGENTS_SNAPSHOT`) is
  captured without `--all`, so it lacks the terminal rows this function exists
  to find. `claude_agents_count_held_for_debug:1085-1088` already carries the
  same note — mirror it.
- Return codes: `0` = daemon queried successfully; stdout carries zero or more
  TSV lines, and **zero matches is a definite "none", not a failure** (emit
  nothing, still return 0). `1` = UNKNOWN — `claude` missing, non-zero exit,
  whitespace-only stdout, or jq failure on non-array input (use the same
  `error("claude agents --json output is not a JSON array")` arm). Callers MUST
  treat UNKNOWN as "cannot reconcile", never as "none".
- Note in the comment that this reaches the local Claude daemon over a Unix
  socket, so callers must run it with `dangerouslyDisableSandbox: true` — a
  sandboxed call yields `[]`, a definite "no terminal workers", which is
  fail-safe here (parks nothing).

**Also changes** `.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh`
— append a test block for the new function using that file's existing
`CLAUDE_AGENTS_CMD` fake-script harness. Cases:

1. A `state: "done"` row named `tactic-foo` → one TSV line
   `<sid>\ttactic-foo\t<cwd>`.
2. A `state: "busy"` row and a `state: "blocked"` row → excluded.
3. A row with no `.state` but `status: "stopped"` → included (fallback
   resolution).
4. A row with neither `.state` nor `.status` → excluded.
5. A `state: "done"` row named `dispatch-ab12cd34` (router) → excluded.
6. `[]` registry → rc 0, empty stdout.
7. Non-array JSON (`{}`) → rc 1, empty stdout.
8. `CLAUDE_AGENTS_CMD` pointing at a script that exits 1 → rc 1.
9. `DISPATCH_AGENTS_SNAPSHOT` set to a registry that contains **no** terminal
   rows, while the fake `claude` reports one → the function still finds it
   (proves it bypasses the snapshot).

**Out of scope:** any change to `claude_agents_count_held_for_debug`,
`claude_agents_count_busy_workers`, `claude_session_id_is_live`,
`_claude_agents_raw`, or `claude_agents_list_blocked_workers`. Do not refactor
the shared jq into a helper — the existing file deliberately repeats these
filters inline.

### Recommended model

sonnet

### Dependencies

Unit 0 (precondition check passed; `origin/main` merged into the branch).

---

## Unit 2 — `terminal_without_disposition_sweep` in `lib-frozen-session-park.sh`

### Scope

**Changes** `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
(the file PR #2994 adds). Add, inside the existing
`_LIB_FROZEN_SESSION_PARK_LOADED` load guard, alongside
`frozen_session_sweep`:

- `_terminal_disposition_log_decision <node> <session> <idle> <disposition>` —
  a near-copy of `_frozen_session_log_decision` (in the same file, immediately
  above `frozen_session_sweep`). Same shape: build with `jq -c -n`, hand to
  `decision_log_append` behind a `command -v` guard, never fail the caller,
  always return 0. Record fields: `{ts, site: "terminal-disposition-sweep",
  node, session, state: "terminal", idle_seconds, disposition}`.
- `terminal_without_disposition_sweep` — no arguments, **ALWAYS returns 0** on
  every path (daemon failure, unresolvable repo root, failed `park-node`). At
  most one daemon query and at most one `git fetch` per invocation, the fetch
  **lazy** (only once a candidate has actually aged past the grace). One
  greppable `printf ... >&2` line per disposition and exactly one summary line.

**Why the predicate is sound** — put this in the function's header comment,
because it is the non-obvious part. `dispatch-self-close --node <id>` reaps a
node worker's job with `claude rm` **only** when a `$CLAUDE_JOB_DIR/node-terminal`
marker names that node (`dispatch-self-close:203-220`), and otherwise HOLDs the
job alive. A reaped job is gone from the registry entirely. Therefore a row that
is **still present in `claude agents --json --all` in a terminal state** is, by
construction, a session that ended **without declaring a disposition** — exactly
the population this sweep must act on. The grace period below covers the
teardown window; the accepted residual (a declaring session whose `claude rm`
itself failed) is noted under "Accepted residuals".

**Rule ladder**, per `sid<TAB>name<TAB>cwd` candidate from
`claude_agents_list_terminal_workers` (mirror `frozen_session_sweep`'s ladder
structure, numbering, and comment style step for step):

1. **Daemon query.** `if ! candidates=$(claude_agents_list_terminal_workers);
   then printf 'lib-frozen-session-park: daemon unqueryable; parking nothing\n'
   >&2; return 0; fi`. UNKNOWN parks nothing.
2. **Empty candidate set** → emit the summary line and return 0.
3. **Tunables computed once, before the loop**, using the integer-guard idiom
   (`[[ "$x" =~ ^[0-9]+$ ]] || x=<default>`) copied from `frozen_session_sweep`:
   - `DISPATCH_TERMINAL_DISPOSITION_NOW_EPOCH` — test clock, default `date -u +%s`
   - `DISPATCH_TERMINAL_DISPOSITION_GRACE_S` — default **300**
   - `DISPATCH_TERMINAL_DISPOSITION_PARK_MAX` — default **3**
   - `DISPATCH_TERMINAL_DISPOSITION_PROJECTS_ROOT` — default `$HOME/.claude/projects`
   - `DISPATCH_TERMINAL_DISPOSITION_JOBS_ROOT` — default `$HOME/.claude/jobs`
   - `DISPATCH_TERMINAL_DISPOSITION_REPO_ROOT` — default `resolve_project_root`
     (`lib.sh:1837`); unresolvable → one stderr line, summary line, return 0
   - `DISPATCH_TERMINAL_DISPOSITION_PARK_NODE` — default
     `$repo_root/packages/intentionsutil/scripts/park-node`
   Document each in the file header's "Environment overrides" block.
4. **Name shape.** `^[0-9]+-` (legacy issue worker) → skip, no graph node.
5. **Node-id validation.** `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` — the canonical regex
   from `packages/intentionsutil/scripts/office-hours-graph:356`, applied before
   the name becomes a path component in `git show origin/main:intentions/<name>.md`.
   Non-matching → skip.
6. **Session-id validation.** `^[0-9a-fA-F-]+$` before it feeds a `find -name`
   glob and a job-dir path. Non-matching → skip.
7. **Idle time.** `find "$projects_root" -mindepth 2 -maxdepth 2 -name
   "${sid}.jsonl"`, take the **newest** `stat -c %Y` across matches. No match or
   unreadable mtime → `unmeasurable`, keep, never park. Copy this block verbatim
   from `frozen_session_sweep` step (3).
8. **Grace.** `idle < grace` → `observing`, keep. (A negative/future-stamped
   idle is `< grace` too, which is the safe direction.) The grace exists because
   a row can be terminal for the seconds between session end and
   `dispatch-self-close`'s reap; 300s is far past that and far short of a real
   stall.
9. **Lazy fetch, once per sweep.** `git -C "$repo_root" fetch origin main
   --quiet 2>/dev/null || true` behind a `fetched=0/1` latch. A fetch failure is
   non-fatal — fall back to the `origin/main` ref this checkout already has.
10. **Node exists on `origin/main`.** `body=$(git -C "$repo_root" show
    "origin/main:intentions/${name}.md")`; failure → keep, "not a graph node".
11. **Already parked.** Extract frontmatter with
    `awk 'NR==1&&/^---/{f=1;next} f&&/^---[[:space:]]*$/{exit} f' <<<"$body"`,
    then treat a present-but-not-`null` `office_hours:` as parked. This idiom is
    copied **verbatim** from `park_live_on_main`
    (`packages/intentionsutil/scripts/office-hours-graph:143-158`) — the
    frontmatter scoping is load-bearing, so a column-0 `office_hours:` line in
    the markdown *body* can never be misread as park state. `frozen_session_sweep`
    step (7) already carries this block and its source comment; reuse it, do not
    extract a shared helper (the deliberate-duplication decision is recorded in
    both sweep files' headers).
12. **Phase gate — new, and the discriminator this predicate adds.** Against the
    same `$frontmatter`, require `! grep -qE '^phase:[[:space:]]*done[[:space:]]*$'`.
    A node at `phase: done` is finished and must never be parked. Everything else
    — any in-flight phase, and `phase: null` — is "still at a working phase" and
    is a candidate. This is exactly the `active-phase` classification
    `node_completion_state` already computes in
    `.claude/skills/dispatch-propagate/scripts/dispatch-sweep:242-289`; match its
    column-0 anchoring and its "anything other than the exact `done` literal
    reads as not finished" rule.
13. **Park cap.** `parked_count >= park_max` → `deferred`, picked up next tick
    rather than serializing N landing-lock pushes inside one tick.
14. **Recover the worker's own escalation text.** The job dir is
    `"$jobs_root/${sid%%-*}"` — job directories are named by the first
    hyphen-delimited field of the session id (verified on this machine:
    `~/.claude/jobs/91d5be85/state.json` carries `sessionId:
    "91d5be85-9edc-474a-9eaa-32c77482e0ce"`; the `claude agents --json` row's
    `.id` is the same 8-hex prefix). Then:
    - If `$job_dir/office-hours-reason` is non-empty, use its contents as
      `<reason>` and `$job_dir/office-hours-recommendation` (when non-empty) as
      `<recommendation>`. **Do not re-derive the text** — this automates the
      manual recovery procedure the node body prescribes.
    - If `$job_dir/office-hours-pr` holds a value matching `^[0-9]+$`, thread it
      as `--pr <n>`, preserving the `execution.pr` custody the deleted backstop
      provided (`tactic-office-hours-pr-custody`;
      `dispatch-stop.sh:71-77,84-87`). No `gh` call — this only reads a file the
      session already wrote, so the sweep stays gh-free.
    - Otherwise synthesize:
      `reason` = "phase session ended without declaring a disposition — `claude
      agents --all` reports the session for this node in a terminal state and it
      has had no transcript activity for `<idle>`s, while `origin/main` still
      shows the node at a working phase with `office_hours: null`; the node is
      therefore both re-selectable and held, so the dispatch-tick
      terminal-without-disposition sweep parked it";
      `recommendation` = "Read the session's transcript or attach the held job
      (`claude agents --all`, `claude attach <job-id>`) to see what it concluded.
      Decide the judgment item it stopped on, then either answer it here and
      `clear-park <node-id>`, or stop the session (`claude stop <job-id>`), let
      `dispatch-sweep` reap the worktree, and `clear-park <node-id>` to return
      the node to the lane. Do NOT simply reap the terminal session and release
      the node — that is what restarts the churn loop."
15. **Park.** `"$park_node" [--pr <n>] "$name" "$reason" "$recommendation"
    >/dev/null || rc=$?`. Invoke by path, exactly as `frozen_session_sweep`
    (`"$park_node" "$name" "$reason" "$recommendation"`) and
    `lib-standdown-recheck.sh:699` do — `park-node` resolves its repo root from
    its own script location, so a `park_node` path under `$repo_root` satisfies
    invariant I1 regardless of the tick's cwd. Add that as a comment; it is the
    single most important difference from the deleted Stop-hook backstop.
    - `rc == 0` → increment `parked`, log the disposition line, call
      `_terminal_disposition_log_decision ... "parked"`, **and** `rm -f` the
      three job-dir marker files (`office-hours-reason`,
      `office-hours-recommendation`, `office-hours-pr`) so a later sweep cannot
      re-land stale text — mirroring `dispatch-stop.sh:93`'s on-success cleanup,
      which is the only behaviour of the backstop worth keeping.
    - `rc != 0` → log `park failed for <name> (park-node exit <rc>); will retry
      next tick`, call `_terminal_disposition_log_decision ... "park-failed"`,
      **keep the marker files**, and continue to the next candidate. Never fatal.
16. **Summary line.** `lib-frozen-session-park: terminal-disposition sweep
    complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)`.

**Accepted residuals** — record these in the function header:

- A session that *did* declare but whose `claude rm` reap itself failed lingers
  as a terminal row and could be parked spuriously. This is rare, the grace
  window and the `phase: done` gate absorb most of it, and a spurious park is
  cheap and recoverable (`clear-park <node-id>`) — the same cost model
  `dispatch-self-close:225-233` already records for parks.
- A node at `phase: null` with a held terminal `/align-tactics` session is
  included by design: an align pass that ended without a claim and without a
  `no-claim` marker is the same churn shape.

**Also changes**
`.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh` —
append a `=== terminal_without_disposition_sweep ===` block reusing that file's
existing fixture shape (`fs_setup`-style: scratch `mktemp -d`, fake `claude` via
`CLAUDE_AGENTS_CMD`, scratch git repo whose `refs/remotes/origin/main` is set by
hand, transcript files whose mtimes `touch -d` sets, an argv-logging fake
`park-node` with a test-controlled exit code, a fixed clock). Add a
`td_setup`/`td_teardown` pair rather than mutating `fs_setup`. Every call wrapped
in an `if` to capture the return code (the test shell runs `set -e`). Cases:

1. Terminal row + node at `phase: qa`, `office_hours: null`, idle > grace →
   `park-node` invoked once with the node id.
2. Same, but `phase: done` → not parked.
3. Same, but `office_hours` non-null already → not parked ("already parked").
4. A markdown **body** line `office_hours: something` outside the frontmatter →
   still parked (frontmatter scoping holds).
5. idle < grace → `observing`, not parked.
6. No transcript file for the sid → `unmeasurable`, not parked.
7. `claude_agents_list_terminal_workers` returning rc 1 (fake `claude` exits 1)
   → sweep returns 0, parks nothing, logs "daemon unqueryable".
8. Name `123-some-slug` → skipped, not parked.
9. Name `Bad_Id!` → skipped, not parked.
10. No `intentions/<name>.md` on the scratch `origin/main` → not parked.
11. Job dir carries `office-hours-reason` + `office-hours-recommendation` →
    `park-node` argv carries **those exact strings**, and all three marker files
    are removed on success.
12. Job dir carries `office-hours-pr` = `2994` → argv is `--pr 2994 <node>
    <reason> <reco>`; a non-numeric `office-hours-pr` → no `--pr` flag.
13. No job dir at all → synthesized reason used; `park-node` still invoked.
14. `park-node` exits 1 → sweep still returns 0, marker files **retained**, and
    stderr carries "will retry next tick".
15. Four eligible candidates with `DISPATCH_TERMINAL_DISPOSITION_PARK_MAX=2` →
    exactly 2 parks, `deferred=2` in the summary line.
16. Two eligible candidates → exactly **one** `git fetch` (assert via a fetch
    counter, or by asserting the sweep completes against a repo with no remote —
    match whatever technique the existing `frozen_session_sweep` fetch test uses).
17. Sweep always returns 0 on every case above.

**Out of scope:** any behaviour change to `frozen_session_sweep` or
`_frozen_session_log_decision`; renaming the file; extracting the shared ladder
steps into helpers. Two predicates in one file with parallel structure is the
intended end state; a third (`standdown_recheck_sweep`) stays in
`lib-standdown-recheck.sh` and is **not** migrated by this unit.

### Recommended model

opus

### Dependencies

Unit 1.

---

## Unit 3 — wire the sweep into `dispatch-tick` on both cadences

### Scope

**Changes** `.claude/skills/dispatch-propagate/scripts/dispatch-tick`:

- **Paused early-exit branch.** Immediately after the `frozen_session_sweep`
  block that PR #2994 adds there (post-merge, around `:344-355`; it follows the
  `standdown_recheck_sweep` block at `:329-337`, which itself follows the
  `reservation_sweep` block), add a fourth block in the identical idiom:

  ```
  if ! declare -f terminal_without_disposition_sweep >/dev/null 2>&1; then
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/lib-claude-agents.sh"
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/lib-frozen-session-park.sh"
  fi
  if declare -f terminal_without_disposition_sweep >/dev/null 2>&1; then
    terminal_without_disposition_sweep 1>&2
  else
    echo "dispatch-tick: lib-frozen-session-park.sh failed to load; terminal-disposition sweep NOT run this tick" >&2
  fi
  ```

  With the same justifying comment the siblings carry: this `exit 0` path is the
  **only** autonomous tick path that never reaches `dispatch-select-tick`'s own
  sweeps, so a node held by an undeclared terminal session would otherwise stay
  invisible for the whole pause.
- **Normal path.** Add the same pair after the post-snapshot,
  pre-selection `standdown_recheck_sweep` / `frozen_session_sweep` calls (on
  origin/main the standdown call sits at `:483-490`; post-#2994 the frozen call
  sits just after, near `:518-530`). Same conditional-source + `declare -f`
  verify + **loud failure, never `|| true`** posture required by
  `.claude/rules/code-style.md`.
- Update the numbered duty list in the file's header comment (origin/main
  `:99-107`; post-#2994 the frozen-session entry is at `:70,:83`) to name the
  terminal-disposition sweep as another per-tick duty on both cadences.

**Also changes** `.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh`
— extend it in the same way #2994 extends it for `frozen_session_sweep`:

1. Paused tick (pause sentinel present) → the terminal-disposition sweep runs
   (assert on its summary stderr line).
2. Normal tick → it runs.
3. A `lib-frozen-session-park.sh` that fails to define the function → the tick
   prints the loud "NOT run this tick" line and **still completes** (never
   aborts).

**Out of scope:** reordering, deduplicating, or factoring the four
conditional-source blocks into a loop; changing when the tick captures
`DISPATCH_AGENTS_SNAPSHOT`; any selection/ranking behaviour.

### Recommended model

sonnet

### Dependencies

Unit 2.

---

## Unit 4 — delete the Stop-hook escalation-park backstop

Do this **after** Unit 3, so the replacement is live before the seam is
uncovered.

### Scope

**Changes** `.claude/hooks/dispatch-stop.sh` (line numbers are origin/main's):

- **Delete lines 64-98** — the whole `_OH_REASON_FILE` / `_OH_REASON` /
  `_OH_RECO` / `_OH_PR` / `_PARK` block including its enclosing `if [ -s
  "$_OH_REASON_FILE" ]; then ... fi`. That is the entire backstop park.
- **Keep lines 100-117 unchanged** — the `dispatch-self-close --node "$JOB_NAME"`
  call, its comment, and its `>/dev/null || echo WARNING` handling. The
  marker-gated reap decision is a separate concern and stays exactly as it is.
  Its comment's phrase "Runs AFTER the park backstop above…" (`:107-109`) must be
  edited, since there is no longer a park above it.
- **Keep lines 47-63 and 118-121 unchanged** — the two discriminators and the
  trailing `exit 0`.
- **Rewrite the header comment (lines 1-42).** Today it claims (`:5-7`) this
  hook is where the escalation park "is guaranteed to land". Replace that claim
  with: the hook's only duty is the marker-gated reap delegation to
  `dispatch-self-close`; the escalation park is landed by `dispatch-tick`'s
  `terminal_without_disposition_sweep`
  (`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`),
  which runs from the main checkout so invariant I1 holds and retries on the
  next tick. Record why the backstop was removed rather than repaired: measured
  **0 successes in 5 attempts on 2026-07-31** against 4/4 for in-session
  `park-node` the same day; wrong base, no budget for a 1050s landing budget in
  a teardown hook, and a three-times-swallowed failure. Keep the `CRITICAL`
  turn-yield paragraph (`:31-39`) and the best-effort contract note (`:41-42`).

**Changes** `.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh`
(376 lines; registered in CI at `.github/workflows/unit-tests.yml:212`):

- Remove the assertions that a non-empty `office-hours-reason` causes
  `park-node` to be called, the `--pr` threading assertions, the park-failure
  best-effort branch assertions, and the park-before-self-close **ordering**
  assertions in `order.log`.
- Keep the fake-script harness (`park-calls.log`, `self-close-calls.log`,
  `order.log`) and every `dispatch-self-close` delegation assertion, including
  the existing "no `office-hours-reason` → delegate to the gated self-close"
  case (`~:137-175`).
- Add a **ratchet** test: with a node worker job dir containing a non-empty
  `office-hours-reason`, `office-hours-recommendation`, and `office-hours-pr`,
  assert `park-calls.log` has **zero** lines and `self-close-calls.log` has
  exactly one `--node <name>` line, and that the three marker files are still
  present afterwards (the hook no longer consumes them; the sweep does).
- Update the file's own header comment (`:17-40`) to describe the hook's reduced
  duty.

**Changes — prose only, one-sentence rewords.** Each of these currently tells a
skill that the Stop hook lands its park. The **escalation seam is unchanged** —
skills still write `$CLAUDE_JOB_DIR/office-hours-reason` (and
`-recommendation` / `-pr`) via `dispatch-mark-deviation`, because
`terminal_without_disposition_sweep` reads exactly those files. Only the
*sentence naming dispatch-stop.sh as the parker* changes, to name the tick sweep
instead. Do not restructure any escalation procedure.

- `.claude/skills/fix-checks/SKILL.md:104-108`, `:217`, `:320-334`
- `.claude/skills/qa-fix/SKILL.md:13`, `:190`
- `.claude/skills/qa-main/SKILL.md:200`
- `.claude/skills/review-fix/SKILL.md:154` and
  `.claude/skills/review-fix/references/node-lane.md:34`
- `.claude/skills/implement/SKILL.md:128`
- `.claude/skills/dispatch-conflict/SKILL.md:453-455`
- `.claude/skills/office-hours/SKILL.md:22`
- `.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation:20-21`
  (header comment: it currently says the marker is one "that dispatch-stop.sh's
  … reads")

**Out of scope:** changing `dispatch-mark-deviation`'s behaviour or its file
format; changing `dispatch-self-close` in any way; adding a new disposition value
to `mark-node-terminal` (its 8-member enum at `:73-79` already contains `park`
and needs nothing); touching `.claude/settings.json`'s Stop-hook registration
(the hook still exists and still has a duty).

### Recommended model

sonnet

### Dependencies

Unit 3.

---

## Collision to flag, not to action

The stop-backstop-comment sibling tactic (pruned 2026-09-02 as moot: c06c7295
had already deleted its target before it ran) was separately planned to *reword* `dispatch-stop.sh:62-63` on the premise that the
backstop is now "far-ahead-safe." Unit 4 above **deletes** the block that
reword targets. Whichever plan lands second conflicts with the other's diff.
This plan does not touch that sibling node — do not action it from here.
Recommended resolution, for whoever lands either PR: land this node's Unit 4
first and then close that sibling as moot, since its target text will no
longer exist. (Done: resolved as moot and pruned in the 2026-09-02 /align round.)

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` (PR
  #2994) — `frozen_session_sweep` and `_frozen_session_log_decision`: the
  framework the new predicate joins. Copy its ladder structure, numbering,
  comment style, tunable-guard idiom, lazy-fetch latch, park cap with per-sweep
  deferral, and always-return-0 contract.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:1-720`
  (landed, `tactic-standdown-winner-liveness` PR #2996) — the same pattern in
  its already-merged form; `:699` is the canonical `"$park_node" "$node"
  "$reason" "$recommendation" >/dev/null || rc=$?` invocation, and `:700-712` the
  keep-evidence-and-retry-next-tick failure arm.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1080-1115` —
  `claude_agents_count_held_for_debug`: the exact `terminal_states` jq `def`,
  the worker-keyspace filter, the `--all`-direct rationale, and the
  `.state`-then-`.status` resolution. Adapt into a lister; do not call the count
  function.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` (post-#2994)
  — `claude_agents_list_blocked_workers`: the TSV projection, the return-code
  contract wording, and the "zero matches is a definite none" note.
- `packages/intentionsutil/scripts/office-hours-graph:143-158` —
  `park_live_on_main`: the frontmatter-scoped already-parked test. Copy verbatim
  with a source comment (both existing sweeps do; deliberately not shared).
- `packages/intentionsutil/scripts/office-hours-graph:356` — the canonical
  node-id regex `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-sweep:242-289` —
  `node_completion_state`: the `active-phase` classification (column-0
  frontmatter anchoring, "anything but the exact `done` literal is not
  finished") that the new phase gate reproduces.
- `packages/intentionsutil/scripts/park-node:69-100` — the
  `park-node [--pr <n>] <node-id> <reason> [recommendation]` contract and its
  exit codes (0 parked, 1 write/CAS failed, 2 usage, 3 stale diagnosis). No
  `--base` here: there is no diagnosis/execution gap to pin, and `park-node`'s
  own fresh `origin/main` re-read is the correct guard.
- `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:1-49` —
  `decision_log_append`; already sourced non-fatally by
  `lib-frozen-session-park.sh`. Gate every call on `command -v`.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1837` —
  `resolve_project_root()`.
- `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`
  and `test-lib-standdown-recheck.sh:1-50` — the env-var fake harness shape
  (`CLAUDE_AGENTS_CMD`, `DISPATCH_*_{REPO_ROOT,PROJECTS_ROOT,PARK_NODE,NOW_EPOCH}`)
  plus `dispatch-test-fixture.sh`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh:52-85` —
  the existing fake `park-node` / fake `dispatch-self-close` / `order.log`
  harness; reuse it rather than writing a new one.
- `packages/intentionsutil/scripts/mark-node-terminal:22-36,73-79,87-98` — the
  8-member disposition enum (already contains `park`) and the ownership gate
  that makes an external sweep's park unable to self-authorize a reap. Read
  only; unchanged.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:133` —
  precedent for a non-worker process invoking `park-node` against another node's
  id.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick` — the two-cadence
  conditional-source + `declare -f` verify + loud-failure wiring idiom, in three
  instances (reservation, standdown, frozen-session) to pattern-match against.

## Verification

Every check below runs from the worktree root. The Claude-daemon-touching
suites use faked `claude` binaries via `CLAUDE_AGENTS_CMD`, so they are
sandbox-safe; only the manual live check needs `dangerouslyDisableSandbox: true`.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Guard against the backstop silently coming back — assert the park call site is
gone and the self-close delegation survives:

```verify
bash -c 'set -e; ! grep -q "park-node" .claude/hooks/dispatch-stop.sh; grep -q "dispatch-self-close" .claude/hooks/dispatch-stop.sh; echo "dispatch-stop backstop removed, self-close delegation intact"'
```

### Manual and observe-in-production checks

1. **Live sweep, dry population.** With `dangerouslyDisableSandbox: true` (the
   sweep reaches the Claude daemon over a Unix socket — a sandboxed call returns
   `[]` and vacuously parks nothing, which would make this check meaningless):

   ```
   bash -c 'source .claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh
            source .claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh
            terminal_without_disposition_sweep'
   ```

   Expect one summary line and, on a healthy fleet, `parked=0`. Cross-check the
   `terminal=` count against `claude agents --json --all | jq '[.[] | select(.name
   | test("^tactic-|^strategy-")) | select(((.state // .status) // "") | IN("done",
   "stopped","killed","failed","errored","error","cancelled","canceled",
   "terminated"))] | length'`.

2. **Reason-recovery on a real residue.** If any job dir under
   `~/.claude/jobs/<8-hex>/` still holds an `office-hours-reason` for a node
   that is unparked on `origin/main`, run the sweep and confirm the resulting
   `office_hours.reason` on `origin/main` is that file's text verbatim (not the
   synthesized fallback), and that the three marker files were removed.

3. **Read the park back from `origin/main`.** A park is healed only when it has
   been read back — a `graph-commit` exit 0 is not evidence anything landed
   (invariant I2). After any park this sweep reports, run
   `git fetch origin main && git show origin/main:intentions/<id>.md | head -40`
   and confirm `office_hours` is non-null there. If it is still `null`, the sweep
   must have logged `park failed … will retry next tick`; confirm the next tick
   retries it.

4. **Journal observation over a full day.** Confirm the tick journal carries the
   `lib-frozen-session-park: terminal-disposition sweep complete (...)` line on
   both the paused and normal cadences, and that `parked=` stays at 0 while the
   fleet is healthy. A steadily growing `terminal=` with `parked=0` and
   `observing=0` would mean the phase gate or the already-parked gate is
   rejecting everything — investigate rather than raising the cap.

5. **Judgment call — do not reap into the loop.** While validating, remember
   this node's operational trap: reaping a `done` session whose node is still at
   its pre-session phase is what *restarts* the churn. Check the node's `phase`
   and `office_hours` on `origin/main` before reaping anything; unadvanced plus
   unparked means diagnose, not collect.

## needs-main residue

`/qa-fix` (PR #3004) ran the full script-verifiable + guard + lint suite green
(178/178, 136/136, 121/121, 29/29, 83/83 tests; both `park-node`-removed and
`dispatch-self-close`-intact guards confirmed; lint clean) and classified five
design-judgment items through the disposition Workflow. Four downgraded to
`needs-main` (their acceptance criterion is only observable from live post-merge
tick behavior, per `planned_deferral: true`) and are filed here rather than as
separate follow-up nodes, to be verified once this reaches `main-qa`:

1. **id `design-2-grace-cap-defaults`** — grace default (300s,
   `DISPATCH_TERMINAL_DISPOSITION_GRACE_S`) and park-cap default (3,
   `DISPATCH_TERMINAL_DISPOSITION_PARK_MAX`) in `lib-frozen-session-park.sh`.
   Expected outcome: both defaults hold up against the normal fleet's actual
   terminal-worker volume and idle-time distribution over live tick runs; no
   evidence of nodes parked too aggressively or too slowly.
2. **id `design-3-unmeasurable-keep`** — a terminal worker with an
   unreadable/rotated transcript is always kept, never parked (fail-safe
   miss, an accepted residual per this node's own "Accepted residuals"
   section). Expected outcome: this miss stays rare in practice and does not
   accumulate a population of permanently-unparked terminal-without-disposition
   nodes.
3. **id `design-4-daemon-unknown`** — `claude_agents_list_terminal_workers`
   returning UNKNOWN (daemon unreachable/non-array JSON) makes the sweep
   no-op that tick, with no louder signal than the summary stderr line.
   Expected outcome: a real daemon outage does not silently disable the sweep
   for an extended period without being noticed via the tick journal.
4. **id `design-5-best-effort-retry-forever`** — a structurally-failing
   `park-node` call retries every tick indefinitely (always returns 0, no
   escalation, no distinct signal beyond "will retry next tick" in stderr).
   Expected outcome: no candidate is observed retrying-and-failing
   indefinitely in production; if one does, that is itself the residue to
   act on.
