---
id: tactic-standdown-winner-liveness
kind: tactic
statement: The duplicate-worker stand-down protocol must re-check that the
  winner is still live and its work pushed — the loser's deliberate choice not
  to write a park is correct only while the winner lives, so when the winner
  dies mid-work the loser waits forever on a session that no longer exists,
  holding the node with the fix unpushed in the shared worktree and no liveness
  check, timeout or surfacing to break it
owner: ai
status: codified
parent: null
rationale: "Observed live 2026-07-31T01:07Z during the dispatch-pipeline
  bootstrap. This is the AFTERMATH of
  tactic-router-spawn-window-duplicate-worker, not a duplicate of it: the
  duplicate spawn is that node's defect, and what happens next is this one's.
  Session d8f6f60a correctly self-detected a duplicate on
  tactic-graph-commit-noop-landing-false-failure and stood down exactly by the
  book — 'the session with uncommitted build wins; the empty session stands
  down', and deliberately wrote no office-hours-reason marker because writing
  one would spuriously park a node another session was actively working.
  Textbook behavior, and correct for as long as the premise held. Then the
  winner (3059d43c) died before pushing. Final state: the winner's remedy — a
  git merge origin/main producing 94bf49b3, the exact fix for the stale-head
  flake — sat unpushed in the worktree while the remote was still at e525bed0,
  PR #2981 still failed hook-tests, the loser stayed alive and idle indefinitely
  waiting on a dead session, and the node was frozen one git push away from
  green. Nothing timed out and nothing surfaced it. The stand-down protocol has
  no liveness check on the winner and no deadline, and the loser's correct
  decision not to park is precisely what makes the resulting deadlock silent.
  Remedied by hand at the time by reaping d8f6f60a; the unpushed merge was
  trivially reproducible, so nothing was lost, but the recovery required a human
  noticing. Direction for planning, not a plan: the stand-down must be
  conditional and re-checked rather than one-shot — if the winner is no longer
  live and its work is unpushed, the loser must either take over the work or
  park the node, and either outcome must be observable. Any timeout chosen must
  not reintroduce the silent expiry that tactic-stopped-session-blocks-node
  exists to remove. Filed together with tactic-denied-command-parks-node and
  tactic-phase-terminal-requires-disposition — all three are the same root
  confusion, that 'held' and 'being worked' are not the same predicate and no
  code distinguishes them, with tactic-router-spawn-window-duplicate-worker the
  fourth member and the direct upstream cause of this one. Interim attention
  scaffolding only — tactic-attention-tier-ranking replaces the numeric scheme
  with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.
  blocked_by is empty, so this Wave A promotion lifts no blocker and cannot
  compound."
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
    strands a node indefinitely with a completed fix unpushed, and it compounds
    tactic-router-spawn-window-duplicate-worker by converting every duplicate
    spawn into a potential permanent freeze. blocked_by is empty, so this
    promotion lifts no blocker and cannot compound. Finalized 2026-07-31 via
    /align-tactics (tactic-target round): status is now codified and phase
    implement, carrying the full plan in the body; the boost is unchanged."
phase: main-qa
execution:
  branch: tactic-standdown-winner-liveness
  pr: 2996
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-31T10:10:04Z
    mergeCommitSha: 2c8a150695066780aedb41f5324882ae3a7cbdaf
    graphCommitSha: null
validates: []
blocked_by:
  - tactic-hold-residue-standdown-winner-liveness
office_hours:
  reason: >-
    /qa-main: both needs-main residue items on tactic-standdown-winner-liveness
    (PR #2996) are not browser-verifiable — neither has a real url_path (both
    say "current", not a web page) and both require inspecting live
    dispatch-fleet infrastructure state or making a human judgment call, not
    observing a deployed URL via Claude-in-Chrome:

    1. "Live-fleet behavior of the sweep" — requires reading the tick journal
    for `standdown_recheck_sweep` run lines, checking `tmp/dispatch-standdown/`
    stays empty in steady state, and confirming a
    `standdown-winner-dead-work-unpushed` park record (once one occurs) carries
    recoverable context.

    2. "Ruling on the shared grace/park-cap defaults" — explicitly asks a human
    to accept or re-tune `DISPATCH_STANDDOWN_IDLE_GRACE_S=900` /
    `DISPATCH_STANDDOWN_PARK_MAX=3`; the node's own text says this duplicates an
    already-open office-hours item on sibling node
    tactic-denied-command-parks-node (commit 0f6af041).
  since: 2026-07-31
  recommendation: >-
    For item 1: check the dispatch tick journal for `lib-standdown-recheck:
    sweep complete (…)` lines appearing on both the paused and normal ticks; `ls
    tmp/dispatch-standdown/` on the fleet host and confirm it's empty in steady
    state (a marker lingering more than a tick or two is a problem); if/when a
    `standdown-winner-dead-work-unpushed` park has occurred, pull it from the
    office-hours queue and confirm its reason text alone (worktree path,
    unpushed sha, winner sid) is enough to recover the work without reading a
    session transcript.


    For item 2: this is a pure tuning judgment call, no observation needed —
    decide whether DISPATCH_STANDDOWN_IDLE_GRACE_S=900s and
    DISPATCH_STANDDOWN_PARK_MAX=3 are acceptable defaults (they mirror the
    sibling sweep lib-frozen-session-park.sh). Since the identical question is
    already parked on sibling node tactic-denied-command-parks-node (commit
    0f6af041), consider ruling on both at once rather than treating them as
    separate decisions — a single answer likely resolves both.


    Once both are dispositioned, clear the office_hours park on
    tactic-standdown-winner-liveness (clear-park) so the node can advance
    main-qa → done.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# The duplicate-worker stand-down protocol must re-check that the winner is still live and its work pushed — the loser's deliberate choice not to write a park is correct only while the winner lives, so when the winner dies mid-work the loser waits forever on a session that no longer exists, holding the node with the fix unpushed in the shared worktree and no liveness check, timeout or surfacing to break it

## Context

Observed live **2026-07-31T01:07Z** during the dispatch-pipeline bootstrap.
This is the **aftermath** of `tactic-router-spawn-window-duplicate-worker`, not
a duplicate of it: the duplicate spawn is that node's defect, and what happens
*next* is this one's.

Session `d8f6f60a` correctly self-detected a duplicate on
`tactic-graph-commit-noop-landing-false-failure` and stood down **by the book**
— "the session with uncommitted build wins; the empty session stands down … No
`office-hours-reason` marker — writing one would spuriously park the node."
Textbook behavior, and correct for exactly as long as its premise held. **Then
the winner (`3059d43c`) died before pushing.**

### Final state (the incident, recorded verbatim from the node body)

| element | state |
|---|---|
| winner's remedy | `git merge origin/main` producing `94bf49b3` — the exact fix for the stale-head flake |
| where it lived | **unpushed**, in the shared worktree; remote still at `e525bed0` |
| PR #2981 | still failing `hook-tests` |
| loser | alive, idle, **waiting forever** on a session that no longer existed |
| node | frozen **one `git push` away from green** |

Nothing timed out. Nothing surfaced it.

### Why the stand-down protocol makes this silent (verbatim)

The protocol has **no liveness check on the winner and no deadline**. It is a
one-shot decision, evaluated once against a premise ("a winner is working this")
that can stop being true at any moment afterwards.

And the loser's decision **not** to write a park — which is *correct* while the
winner lives, precisely because a spurious park would knock a node another
session is actively working out of the lane — is exactly what makes the
resulting deadlock invisible. The protocol's one careful, correct choice is the
thing that hides the failure.

Remedied by hand by reaping `d8f6f60a`. Nothing was lost — the unpushed merge
was trivially reproducible — but recovery required a human noticing.

### Author's direction for planning (verbatim; the design constraint)

The stand-down must be **conditional and re-checked**, not one-shot: if the
winner is no longer live and the work is unpushed, the loser must either take
over the work or park the node. Either outcome must be **observable** — the
current failure mode produces no signal of any kind.

**Constraint on any timeout chosen:** it must not reintroduce the silent expiry
that `tactic-stopped-session-blocks-node` exists to remove. That node's
author-stated requirement is that release is an explicit human act; a bare
"stand-down expires after N minutes" would re-litigate it in a different file.
The liveness of the *winner* is the correct trigger, not the age of the loser's
wait.

### Read this with its three siblings — do not plan it alone (verbatim)

`tactic-denied-command-parks-node`, `tactic-phase-terminal-requires-disposition`,
`tactic-standdown-winner-liveness` and
`tactic-router-spawn-window-duplicate-worker` are **one family**: the fleet
cannot reliably tell whether a node is being worked on. Same root confusion —
**"held" and "being worked" are not the same predicate, and no code
distinguishes them.**

`tactic-router-spawn-window-duplicate-worker` is the direct upstream cause of
this node: every duplicate spawn it permits is a potential permanent freeze
here. That makes the two worth sequencing together, but they are **not** the
same fix — the duplicate can be eliminated and a winner can still die mid-work
for unrelated reasons (an API error, a classifier denial per
`tactic-denied-command-parks-node`, an OOM).

### Current state of the code (verified at `174c3c7c`)

- **There is no stand-down code at all.** `grep` for `stand.down` / `standdown`
  / "duplicate worker" across `.claude/skills/**` and `.claude/hooks/**` returns
  nothing outside `intentions/*.md` narrative. The protocol is emergent session
  judgment. This work is greenfield, not an amendment.
- **Every existing sweep is blind to this shape, by design.** The loser is a
  live session registered under the node id (both duplicates are spawned
  `--name "$id"` by `dispatch-graph-execute:215`/`:285`), so:
  `dispatch-sweep`'s NODE arm logs `SKIP_NODE_LIVE_SESSION`
  (`dispatch-sweep:450-453`); `reservation_sweep` rule (a) sees a live worker of
  that name and reclaims the marker as benign; `graph-select-target`'s
  `worktree_has_live_session` guard (`:669`) reports the node occupied forever.
  Each is individually correct. Together they mean a stood-down loser holds its
  node permanently and silently.
- **The loser cannot simply exit.** `dispatch-self-close`'s Invariant 2 holds a
  node worker alive unless a `$CLAUDE_JOB_DIR/node-terminal` marker names its
  node (`dispatch-self-close:39-83`), and the self-close call is `claude rm
  <job-id>`, which **deletes the session *and its worktree***. Both duplicates
  share ONE worktree (runbook recorded at
  `intentions/tactic-router-spawn-window-duplicate-worker.md:565-568`), so a
  loser that self-closes destroys the winner's unpushed work. Any design that
  resolves the stand-down by reaping the loser is therefore **wrong today**;
  the fix must surface, not reap.

### Greenfield design

Make "a node is *held* by a stood-down duplicate" a **first-class, durable,
machine-readable state**, and re-check it from **outside** the frozen session:

1. **A stand-down ledger** — a sidecar record per node, outside every checkout
   (same convention as the reservation ledger and the `.conflict-strikes`
   sidecar), naming the node, the winner's session id, and every session
   observed under that node name.
2. **A tick-cadence re-check keyed on the winner's liveness** — not on the age
   of the loser's wait. While the winner is live (or the daemon is unqueryable),
   the sweep keeps waiting, at any age. The instant the winner is *definitely*
   gone, the sweep reads the shared worktree: if the work is unpushed it parks
   the node with the unpushed sha, the worktree path and a recovery runbook in
   the park record; if nothing is unpushed but the node is still held by an idle
   survivor, it parks with a different, greppable reason.
3. **A declared entry point** (`dispatch-standdown`) so the standing-down
   session records the winner authoritatively instead of improvising, plus an
   **observed** fallback the sweep writes itself when it sees two live sessions
   under one node id — so coverage does not depend on the loser's goodwill.

The action is always a **park** (a surfacing), never a release. That is what
keeps the timeout constraint satisfied: nothing expires, nothing is
auto-released, and the only clock in the design (an idle grace on the
*observed* path) exists solely to avoid parking a healthy in-flight worker.

**Explicitly rejected designs**, and why — do not re-derive them:

- *Auto-reap the loser (`claude rm`) once the winner is gone.* `claude rm`
  deletes the shared worktree, which is where the unpushed fix lives. Even when
  the tree is in sync it re-litigates `tactic-stopped-session-blocks-node`
  ("release is an explicit human act").
- *Have the loser `claude stop` itself.* A stopped session drops out of
  `claude agents --json` (no `--all`), so the node is released while the winner
  is still working in the same worktree — reintroducing the duplicate.
- *Have the sweep push the winner's unpushed commits.* That pushes unverified
  work under another session's authorship. Recorded as a follow-on: the safe
  form is a `git merge-tree --write-tree` re-derivation
  (`dispatch-preflight.sh:56-73`), which is more machinery than this node needs.
- *A bare "stand-down expires after N minutes" release.* Forbidden by the
  author constraint above.

**Brownfield note.** There is nothing to migrate — no stand-down code exists.
The one sequencing constraint is with the open sibling PR (see Dependencies on
Unit 1).

---

## Unit 1 — session-id and duplicate-name liveness primitives

**Scope**

Changes `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` and
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh` only.

Two new functions, defined after `worktree_has_live_session`
(`lib-claude-agents.sh:550-587`) and documented in the header usage list
(`:10-19`) with their own contract paragraphs in the same style as the existing
entries (`:87-108`):

**1a. `claude_session_id_is_live <sid>`** — the winner-liveness predicate.
- Builds on ONE `claude_agents_list_all` fetch (`:436-470`, TSV
  `sessionId<TAB>status<TAB>name`), never a bespoke `claude agents --json` call.
- Exact-matches column 1 against `<sid>` with `awk -F'\t'` (never a substring
  grep — session ids share prefixes).
- **Fail direction, load-bearing:** `return 0` (live) on a match *and* on
  UNKNOWN (a `claude_agents_list_all` non-zero return); `return 1` only on a
  definite absence from a successfully-queried registry. A caller that parks on
  `return 1` therefore never parks because the daemon hiccupped — the spurious
  park this whole tactic exists to avoid. State this inversion in the doc
  comment: it is the same fail-safe posture as `worktree_has_live_session`
  (occupied-on-unknown), applied to an id instead of a name.
- Empty/missing `<sid>` argument: stderr diagnostic + `return 0` (fail safe),
  mirroring `worktree_has_live_session:551-555`.

**1b. `claude_agents_list_duplicate_node_names`** — the observed-pair detector.
- One `claude_agents_list_all` fetch. Keeps rows whose name (column 3) matches
  the graph-node worker shape `^tactic-|^strategy-` — the same keyspace
  `claude_agents_count_busy_workers` counts (`:620`), which excludes routers
  (`dispatch-<short-id>`) and legacy `<N>-slug` issue workers (those have no
  graph node to park).
- Groups by name and emits one line per name with **two or more** live sessions:
  `name<TAB>sid1,sid2,...`, sids in the order the registry returned them,
  names sorted for deterministic test output. A single `awk` pass is enough;
  do not shell out per name.
- Same UNKNOWN contract as the other machine-wide helpers: `return 1` with empty
  stdout when `claude_agents_list_all` returns non-zero; `return 0` with empty
  stdout when the registry is readable and holds no duplicate (a definite "no
  duplicates").

**1c. Tests** — extend `test-lib-claude-agents.sh` in place (do **not** add a
parallel file). It already has a `write_fake_claude` helper and the
`CLAUDE_AGENTS_CMD` seam (documented at `lib-claude-agents.sh:150-152`); reuse
them. Add at least:
1. `sid-live-exact` — registry with sids `aaa`,`aab`; `claude_session_id_is_live
   aaa` → 0, `... aab` → 0, `... aa` → **1** (no substring match).
2. `sid-live-absent` — sid not present in a well-formed `[]`-or-populated
   registry → 1.
3. `sid-live-unknown` — fake `claude` exits non-zero (and, separately, prints
   non-array output) → **0** both times (fail safe to "live").
4. `sid-live-empty-arg` — no argument → 0, with a stderr diagnostic.
5. `dup-names-pair` — two rows named `tactic-x` plus one `tactic-y` and one
   `dispatch-abc` and one `1234-slug` → exactly one output line,
   `tactic-x<TAB><sid1>,<sid2>`.
6. `dup-names-none` — one row per name → return 0, empty stdout.
7. `dup-names-unknown` — daemon failure → return 1, empty stdout.

**Recommended model** — sonnet. Two self-contained helpers that mirror an
existing, well-documented pattern in the same file, with an explicit contract
and mechanical tests.

**Dependencies** — none, but see the merge note: the open sibling PR **#2994**
(`tactic-denied-command-parks-node`, branch
`origin/tactic-denied-command-parks-node`) adds a different function
(`claude_agents_list_blocked_workers`) to this same file and wires a different
sweep into `dispatch-tick`. Merge `origin/main` first; if that PR has landed,
append the new functions *after* its function rather than resolving a hunk
conflict, and keep both sweeps' `dispatch-tick` call sites side by side.

---

## Unit 2 — `lib-standdown-recheck.sh`: the ledger and the winner-liveness sweep

**Dependencies** — Unit 1 (calls both new helpers).

**Scope**

Adds `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh` and
`.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh`. No
other file changes in this unit (the `dispatch-tick` wiring is Unit 3).

**Structural template — copy it, do not invent a new sweep style.** Read
`origin/tactic-denied-command-parks-node:.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
(`git show` it; it is the sibling family's already-implemented sweep) and mirror
it line-for-line: the header contract block, the `_lfsp_dir`-style
`BASH_SOURCE` sibling sourcing, the load guard, the "ALWAYS returns 0" posture,
one greppable stderr line per node per pass, exactly one summary line, the lazy
one-`git fetch`-per-invocation latch, the park cap, and the
`jq -c -n` + `command -v decision_log_append` logging helper. If that PR has not
merged, read it from the branch and copy anyway — its shape is the convention.

**2a. Ledger.** `standdown_dir()` — print `$DISPATCH_STANDDOWN_DIR` when set
(no git repo required, so tests can point at a scratch dir), else
`<resolve_project_root>/tmp/dispatch-standdown`. Copy
`reservation_dir` verbatim in shape (`lib-reservation-ledger.sh:203-214`),
including its path-safety guard on the basename (`*..*`, `*/*`, control chars).

`standdown_write <node-id> <origin> <winner-sid> <sessions-csv>` — atomic
tempfile + `mv` into `<dir>/<node-id>` with `mkdir -p -m 0700`, exactly as
`reservation_write` does (`:216-273`). Record format, four lines, order fixed
(read back with `sed -n 's/^winner=//p' | head -n1`, the ledger's own idiom):

```
origin=<declared|observed>
winner=<sid|>
sessions=<sid1,sid2,...>
observed=<epoch-seconds>
```

`origin=declared` means a standing-down session named the winner (Unit 4);
`winner=` is authoritative there. `origin=observed` means this sweep saw two
live sessions under the node name and cannot attribute the work, so `winner=` is
empty. `standdown_clear <node-id>` — `rm -f` the marker, guarded by the same
basename check. `standdown_exists <node-id>` — file test.

**2b. `standdown_recheck_sweep`** — no arguments, ALWAYS returns 0.

Step 0: one `claude_agents_list_duplicate_node_names` call. For each duplicate
name with no existing marker, `standdown_write <name> observed "" <sids>` and
log `recorded`. An UNKNOWN return records nothing (fail safe) and does **not**
abort the pass — the re-check below still runs against existing markers.

Then, for each marker in `standdown_dir` (skip `.tmp`/dot files, exactly as
`reservation_sweep` does), in this order — the order IS the correctness
property:

| # | condition | disposition |
|---|---|---|
| a | node id fails `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` | log `unsafe-id`, keep, next |
| b | `origin=declared` and `claude_session_id_is_live <winner>` | log `observing` (winner alive — **age-independent, this is the whole point**), next |
| c | `origin=observed` and ≥2 live sessions still named `<node>` | log `observing-pair`, next |
| d | live sessions named `<node>` == 0 | `standdown_clear`, log `cleared-no-live-session`, next |
| e | `origin=observed` and the surviving session's transcript idle < grace | log `observing` (the survivor is progressing), next |
| f | node absent from `origin/main`, or already parked | log `not-a-node` / `already-parked`, keep, next |
| g | park cap already spent this pass | log `deferred`, keep, next |
| h | worktree not in sync | **park** `standdown-winner-dead-work-unpushed` |
| i | otherwise (in sync, node still held) | **park** `standdown-winner-dead-node-held` |

Notes the implementer must honor:

- Rule (b) has **no age term at all**. A declared stand-down waits forever while
  the winner lives; only the winner's definite absence advances it. Rule (e)'s
  idle grace applies **only** to the `observed` path, where the sweep cannot
  tell winner from loser, and it gates a *park* (a surfacing) — never a release.
  Say so in a comment citing `tactic-stopped-session-blocks-node`.
- Live-name set: derive it from the same
  `claude_agents_list_duplicate_node_names` fetch where possible, else a
  `claude_agents_list_all` pass filtered on column 3 == node id. UNKNOWN from
  either → treat every marker as `observing` and park nothing.
- Transcript idle (rule e): copy the recipe from `lib-frozen-session-park.sh`
  (`find <projects-root> -mindepth 2 -maxdepth 2 -name "<sid>.jsonl"`, newest
  `stat -c %Y`, unreadable ⇒ UNKNOWN ⇒ keep). Implement it as a local
  `_standdown_session_idle_s <sid>` and add a comment noting it duplicates that
  sibling's block deliberately (the sibling is unmerged; extraction into a
  shared helper is a follow-up, not this PR's job).
- Worktree path is derived, not read from the daemon:
  `<repo-root>/.claude/worktrees/<node-id>`, the same composition
  `dispatch-graph-execute` uses for `CONFLICT_WT` (`:259`). A missing directory
  is `cleared-no-worktree` (clear the marker, log, next).
- "Not in sync" (rule h) is `! worktree_in_sync "$WT"` **and**
  `! worktree_merged_in_sync "$WT"` — both from
  `.claude/skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh` (`:38`,
  `:80`). The second is what keeps a post-squash-merge local merge commit from
  being mis-read as stranded work (that file's own `#1845` note). Source it via
  the `BASH_SOURCE` dirname, and be aware sourcing it sets `-u`/`-o pipefail`.
- Already-parked check (rule f): inline the frontmatter-scoped idiom copied
  VERBATIM from `park_live_on_main`
  (`packages/intentionsutil/scripts/office-hours-graph:143-158`) —
  `awk` the block between the first two `---` fences, then
  `grep -qE '^office_hours:[[:space:]]*null'`. Frontmatter scoping is
  load-bearing: a column-0 `office_hours:` line in a node's markdown body must
  never read as park state.
- Park call: `"$park_node" "$node" "$reason" "$recommendation"` — three
  positional args, no `--pr`, no `--base` (`packages/intentionsutil/scripts/park-node:87`,
  `:145-150`). park-node re-reads fresh `origin/main` itself and calls
  `mark-node-terminal` unconditionally (`:317`), whose ownership gate makes that
  a no-op from this sweep. A non-zero exit is logged (`park-failed`) and never
  fatal; the next tick retries.
- Reason (h) must carry recoverable context: the dead winner's sid, the loser
  sid(s), the worktree path, and the unpushed head — capture it with
  `git -C "$WT" log --oneline -n 3 origin/main..HEAD` (empty on failure, never
  fatal). Reason (i) states that no work is unpushed and the node is held only
  by a session that is waiting on a session that no longer exists.
- Recommendation (both): attach the holding job (`claude agents --all`,
  `claude attach <job-id>`), verify and push the unpushed commits from the
  worktree, then `clear-park <node-id>`. It MUST say: **use `claude stop` on the
  holding session, never `claude rm`, while unpushed work is in the shared
  worktree — `claude rm` deletes the session *and its worktree*.** Also state
  the accepted residual, identical to the sibling's: while a live session holds
  the node-id name, office-hours reports the node `all-held` rather than
  launching a review session for it.
- Decision log: one record per acted-on node via `decision_log_append`
  (`lib-decision-log.sh:76-107`) behind a `command -v` guard, built with
  `jq -c -n`, fields `{ts, site:"standdown-recheck-sweep", node, origin,
  winner, survivors, unpushed:<bool>, disposition}`.

**2c. Env overrides**, each integer-guarded with a `[[ =~ ^[0-9]+$ ]] || x=<default>`
fallback and documented in a "Test overrides" header block modeled on
`lib-reservation-ledger.sh:151-178`:
`DISPATCH_STANDDOWN_DIR`, `DISPATCH_STANDDOWN_NOW_EPOCH`,
`DISPATCH_STANDDOWN_IDLE_GRACE_S` (default **900**, matching the sibling sweep's
grace), `DISPATCH_STANDDOWN_PARK_MAX` (default **3**),
`DISPATCH_STANDDOWN_PROJECTS_ROOT` (default `$HOME/.claude/projects`),
`DISPATCH_STANDDOWN_REPO_ROOT`, `DISPATCH_STANDDOWN_PARK_NODE` (default
`<repo-root>/packages/intentionsutil/scripts/park-node`), plus the inherited
`CLAUDE_AGENTS_CMD` and `DISPATCH_DECISION_LOG_DIR`.

**2d. Tests** — new `test-lib-standdown-recheck.sh`, built on
`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` and the
fixture idiom of
`origin/tactic-denied-command-parks-node:.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`
(fake `claude` via
`CLAUDE_AGENTS_CMD`; fake `park-node` that logs argv and exits a
test-controlled code; a scratch git repo whose `refs/remotes/origin/main`
carries `intentions/<node>.md`; scratch worktrees under
`<repo>/.claude/worktrees/<node>`; `touch -d` for transcript mtimes; a pinned
clock). Cases, at minimum:

1. `declared-winner-live-old` — declared marker, winner in the registry,
   `observed` 10 days old → **no park**, stderr matches `observing`. This is the
   regression guard for the timeout constraint.
2. `declared-winner-dead-unpushed` — winner absent, loser live, worktree with a
   local commit not on `origin/main` → park called once, argv[1] == node id,
   reason matches `standdown-winner-dead-work-unpushed` and contains the
   worktree path and the winner sid.
3. `declared-winner-dead-in-sync` — same but the worktree is clean and pushed →
   park called with `standdown-winner-dead-node-held`.
4. `declared-winner-unknown` — fake `claude` fails → **no park**, marker kept.
5. `observed-pair-recorded` — two live sessions named `tactic-x` and no marker →
   a marker is written with `origin=observed`, `winner=` empty, both sids in
   `sessions=`; no park.
6. `observed-pair-shrunk-idle` — marker `origin=observed`, one live session left,
   transcript mtime `now - 1000`, grace 900, unpushed work → park.
7. `observed-pair-shrunk-busy` — same but transcript mtime `now - 10` → **no
   park**, stderr matches `observing`.
8. `no-live-session` — marker with zero live sessions of that name → marker
   removed, no park.
9. `already-parked` — node's `origin/main` frontmatter has non-null
   `office_hours` → no park, marker kept, stderr matches `already-parked`.
10. `body-office-hours-not-park` — node whose *body* contains a column-0
    `office_hours:` line but whose frontmatter is `null` → park still happens
    (the frontmatter-scoping guard).
11. `park-cap` — four eligible nodes, cap 2 → exactly 2 park invocations, two
    `deferred` lines.
12. `park-failure-nonfatal` — fake park-node exits 3 → sweep returns 0, stderr
    matches `park failed`, marker kept.
13. `always-returns-zero` — a missing ledger dir, an unresolvable repo root, and
    a daemon failure each return 0 with one summary line.

**Recommended model** — opus. The unit is a rule ladder whose branch order and
fail-directions are the entire correctness property, its failure modes are a
spurious park (knocking a live worker's node out of the lane) and a missed park
(the silent freeze this tactic exists to remove), and it composes four
libraries' UNKNOWN contracts.

---

## Unit 3 — wire the sweep into `dispatch-tick` on both cadences

**Dependencies** — Unit 2.

**Scope**

Changes `.claude/skills/dispatch-propagate/scripts/dispatch-tick` and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh` only.

**3a.** Source `lib-standdown-recheck.sh` and call `standdown_recheck_sweep
1>&2` at exactly two sites, using the same conditional-source +
`declare -f` verify + loud-failure idiom the paused-branch reservation sweep
already uses (`dispatch-tick:277-296`):

1. **The paused branch** (`dispatch-tick:267-299`), immediately after the
   existing `reservation_sweep` call and before the `paused` echo. Same reason
   the reservation sweep is there and stated in that comment: this `exit 0` is
   the only autonomous path that never reaches `dispatch-select-tick`'s sweeps.
   A stand-down freeze must still surface while dispatch is paused.
2. **The normal path**, after the snapshot capture
   (`dispatch-tick:405-406`, which exports `DISPATCH_AGENTS_SNAPSHOT`) and
   before `# --- Step 1: select the target` (`:416`). Running before selection
   is deliberate and must be stated in the comment: the sweep reuses this tick's
   single daemon snapshot instead of an extra round-trip, and any node it parks
   lands `office_hours` on `main` before `dispatch-select-tick` runs, so this
   tick's own selection already excludes it.

**3b.** A load failure is logged loudly (`dispatch-tick:
lib-standdown-recheck.sh failed to load; stand-down re-check NOT run this
tick`) and never aborts the tick — the sweep is containment/observability, not
a gate. Do not swallow it with `|| true` (`.claude/rules/code-style.md`).

**3c.** Extend the `Behavior:` header block (`dispatch-tick:66+`) with a numbered
entry describing the sweep and both cadences, matching the style of the existing
entries.

**3d. Tests** — extend `test-dispatch-tick.sh` in place: (1) the paused branch
invokes the sweep (assert via a stub function exported into the tick's
environment or the sweep's own summary line on stderr, whichever the existing
harness already does for `reservation_sweep`); (2) the normal path invokes it
after the snapshot export and before selection; (3) a deliberately unreadable
`lib-standdown-recheck.sh` produces the loud diagnostic and the tick still
completes.

**Recommended model** — sonnet. Two call sites copied from an adjacent, working
idiom in the same file, plus header prose and harness-shaped tests.

---

## Unit 4 — `dispatch-standdown`: the declared entry point and the written protocol

**Dependencies** — Unit 2 (writes through `standdown_write`).

**Scope**

Adds `.claude/skills/dispatch-propagate/scripts/dispatch-standdown` and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-standdown.sh`; edits
`.claude/skills/dispatch-propagate/reference.md` and the header comment of
`.claude/skills/dispatch-propagate/scripts/dispatch-self-close`.

**4a. `dispatch-standdown <node-id> --winner <session-id>`** — the one command a
session runs when it discovers it is the duplicate and decides to stand down.
Behavior, in order:

1. Validate `<node-id>` against `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (the regex
   `mark-node-terminal:66-70` uses) and `<session-id>` against
   `^[0-9a-fA-F-]+$`. A bad argument is a clear error, exit 2 — never a
   fallback.
2. Re-check the premise **now**: `claude_session_id_is_live <winner>`. If it
   returns 1 (a definite absence), print `winner-absent` on stdout, write no
   marker, and exit 3 — the caller must NOT stand down; there is no winner to
   stand down for. This is the "conditional, not one-shot" requirement applied
   at the decision point itself.
3. Otherwise `standdown_write <node-id> declared <winner-sid>
   "<winner-sid>,<own-sid>"`, where own-sid is `${CLAUDE_CODE_SESSION_ID:-}` when
   set (omit the trailing comma when it is empty). Append one
   `decision_log_append` record (`site:"standdown-declared"`).
4. Print exactly one stdout token — `stood-down` (marker written) or
   `winner-absent` — and exit 0 / 3 respectively. Follow the single-token stdout
   protocol `dispatch-resume-worker:59-71` documents.
5. The header comment must state, in the imperative, what the caller does next:
   **yield the turn without writing a `node-terminal` marker.** The Stop hook
   then HOLDS the job (`dispatch-self-close:39-83`) instead of reaping it —
   which is correct and now *safe*, because the hold is recorded in the ledger
   and `standdown_recheck_sweep` owns the re-check from here. It must also state
   why the loser must not self-close: `claude rm` deletes the shared worktree
   and the winner's unpushed work with it.

**4b. Written protocol.** Add a `## Duplicate-worker stand-down` section to
`.claude/skills/dispatch-propagate/reference.md` (a peer of `## Per-worktree
invariant`, `reference.md:179`) stating the protocol as four rules: the session
with uncommitted/unpushed work wins; the other calls `dispatch-standdown` and
yields; it writes no park (a park would knock a node another session is actively
working out of the lane); it never `claude rm`s itself, because the worktree is
shared. Add a one-line pointer from `dispatch-self-close`'s Invariant-2 header
block (`dispatch-self-close:39-83`) — the place a reader asking "why is my job
held?" actually looks — naming `dispatch-standdown` and the sweep.

**4c. Tests** — new `test-dispatch-standdown.sh` using `dispatch-test-fixture.sh`
and `CLAUDE_AGENTS_CMD` + `DISPATCH_STANDDOWN_DIR`:
1. winner live → exit 0, stdout `stood-down`, marker exists with
   `origin=declared` and the winner sid.
2. winner definitely absent → exit 3, stdout `winner-absent`, **no** marker.
3. daemon UNKNOWN → exit 0, `stood-down` (fail safe: assume the winner lives,
   let the sweep re-check).
4. bad node id / bad session id / missing `--winner` → exit 2, no marker.
5. `CLAUDE_CODE_SESSION_ID` unset → `sessions=` holds just the winner sid, no
   trailing comma.

**Recommended model** — sonnet. A small argument-validating CLI over a primitive
Unit 2 already defines, plus doctrine prose.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` —
  `claude_agents_list_all` (`:436-470`) is the single-fetch primitive both new
  helpers build on; `worktree_has_live_session` (`:550-587`, contract at
  `:87-108`) is the fail-safe-predicate template, including its optional
  `exclude_sid` argument; `CLAUDE_AGENTS_CMD` (`:150-152`) is the test seam.
  Never call `claude agents --json` directly.
- `origin/tactic-denied-command-parks-node:.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
  — the structural template for Unit 2 (sweep contract, lazy fetch, park cap,
  decision-log helper, transcript-idle recipe, always-return-0). Its test file
  `test-lib-frozen-session-park.sh` is the fixture template.
- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh` —
  `reservation_dir` (`:203-214`), `reservation_write` (`:216-273`),
  `reservation_clear` (`:277`) for the ledger's dir resolution, path-safety
  guard, `mkdir -p -m 0700`, atomic tempfile+`mv`, and `k=v` line format; the
  "Test overrides" header block (`:151-178`) for the env-knob documentation
  shape; `reservation_sweep` (`:415-524`) for the rule-ladder + one-line-per-
  disposition style.
- `.claude/skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh` —
  `worktree_in_sync` (`:38`) and `worktree_merged_in_sync` (`:80`) are the
  "is the winner's fix still unpushed" predicates. Do not hand-roll
  `git status` / `rev-list`.
- `packages/intentionsutil/scripts/park-node` (`:87` usage, `:145-150` args,
  `:317` `mark-node-terminal`) — the only sanctioned office_hours writer.
- `packages/intentionsutil/scripts/office-hours-graph:143-158` — the
  frontmatter-scoped already-parked idiom, copied verbatim.
- `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:76-107` —
  `decision_log_append`, called behind a `command -v` guard as
  `dispatch-select-tick:111-141` does.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — the
  shared test fixture every `test-*.sh` in that directory sources.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:277-296` — the
  conditional-source + `declare -f` verify + loud-failure wiring idiom.
- `.claude/skills/dispatch-propagate/scripts/dispatch-resume-worker:59-71` — the
  single-token stdout protocol style for Unit 4.

## Verification

All four new/edited suites live in
`.claude/skills/dispatch-propagate/scripts/`, so `run-unit-tests.sh` picks them
up by its `test-*.sh` glob (`run-unit-tests.sh:187-190`, gated on a changed path
under that directory) — no `.github/workflows/unit-tests.yml` edit is needed.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-standdown.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

If any of these fail with a read-only-filesystem error from `mktemp -d`, re-run
the same command with `dangerouslyDisableSandbox: true` — the suites write
scratch dirs and fake `claude` binaries under `$TMPDIR`.

**Manual check — the timeout constraint is structurally satisfied.** After the
change, `grep -n 'GRACE\|TTL\|idle' .claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh`
must show the idle grace referenced **only** inside the `origin=observed`
branch. Any age term reachable from an `origin=declared` marker is a bug: it
would make a stand-down expire on a clock, which
`tactic-stopped-session-blocks-node` forbids. Equally, no branch may `claude rm`,
`claude stop`, or `git push` — the sweep's only mutating action is `park-node`.

**Manual end-to-end rehearsal (no fleet needed).** In a scratch checkout:
create a node worktree with one unpushed commit, write a `declared` marker whose
`winner=` names a session id that does not exist, install a fake `claude`
returning a registry containing only the loser, and run `standdown_recheck_sweep`.
The node must be parked, the park reason must contain the worktree path and the
unpushed sha, and `intentions/<node>.md` on the scratch `origin/main` must carry
a non-null `office_hours`. Re-run: the second pass must log `already-parked` and
park nothing.

**Observe in production (post-merge, judgment call — this is the real signal).**
The defect is a live-fleet race no unit test reproduces end to end:

1. In the tick journal, `lib-standdown-recheck: sweep complete (…)` must appear
   once per tick, on both the paused and the normal path.
2. `tmp/dispatch-standdown/` should be **empty** in steady state. A marker that
   appears and clears within a tick or two is the healthy shape (a duplicate
   spawned and one session finished).
3. A `recorded` line is the direct observable for
   `tactic-router-spawn-window-duplicate-worker`'s defect — a duplicate spawn
   that node's fix is meant to eliminate. A steady stream of `recorded` lines
   after that node lands means its fix is not holding; record it there, do not
   reopen this work for it.
4. The line that matters is
   `parked … standdown-winner-dead-work-unpushed`. Each one is an instance of
   the 2026-07-31 incident that would previously have been silent. Confirm from
   the office-hours queue that the park record carried enough context to recover
   the work **without** reading any session transcript — that is this node's
   actual success condition.
5. Watch for the inverse failure: a node parked while a live winner was in fact
   still working (check the park timestamp against that session's transcript
   activity). If it happens, the fail-direction of `claude_session_id_is_live`
   or the rule-(b)/(c) ordering is wrong — fix the predicate, do not add a
   longer grace.

**What this does not verify.** It does not prevent the duplicate spawn
(`tactic-router-spawn-window-duplicate-worker`), does not make a stood-down
loser exit (that needs a reap-session-without-removing-worktree capability the
daemon does not expose today), and does not take over the winner's work — the
sweep surfaces, a human resolves. Record those as separate work.

## needs-main residue

Filed by `/qa-fix` (PR #2996) — both items are planned deferrals with no
merge-time-verifiable content; deferred here per the node's own Verification
section rather than escalated. Drained by `tactic-main-qa-phase` after
`review → main-qa` fires post-merge.

1. **Live-fleet behavior of the sweep**
   - url_path: current
   - expected_outcome: The 2026-07-31 stranded-stand-down incident class becomes visible instead of silent once deployed to the live dispatch fleet: the tick journal shows `standdown_recheck_sweep` running each tick, `tmp/dispatch-standdown/` stays empty in steady state, and the first `standdown-winner-dead-work-unpushed` park carries enough context (worktree path, unpushed sha, winner sid) to recover the work without reading a session transcript.
   - finding: Not assertable at merge time in a single-PR QA pass — this is a live-fleet race across two concurrent Claude sessions racing on tick cadence, explicitly documented in this node's own Verification section as "Observe in production (post-merge, judgment call — this is the real signal)". All 8 script-verifiable QA items (invariant checks + full test-suite integration) passed; this is the residual post-merge observation the node's author already called out as not unit-testable.

2. **Ruling on the shared grace/park-cap defaults**
   - url_path: current
   - expected_outcome: `DISPATCH_STANDDOWN_IDLE_GRACE_S=900` and `DISPATCH_STANDDOWN_PARK_MAX=3` are accepted as reasonable operational defaults, or a human re-tunes them.
   - finding: These values mirror the sibling sweep `lib-frozen-session-park.sh`'s defaults. The identical tuning question (900s grace / 3-park cap) is already parked to office-hours on the sibling node `tactic-denied-command-parks-node` (commit `0f6af041`, which reclassified it as needing a human ruling). Re-raising it as a fresh blocker here would duplicate an already-open queue item. The blast radius of a wrong value is bounded: it only affects the `origin=observed` path's park timing — never a release, never a spurious park of a declared stand-down (verified during this QA pass).
