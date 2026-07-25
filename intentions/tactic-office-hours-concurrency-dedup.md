---
id: tactic-office-hours-concurrency-dedup
kind: tactic
statement: "office-hours-graph gains liveness-based concurrency dedup mirroring
  graph-select-target: the graph-native office-hours lane runs in the node-id
  worktree under the bare node-id session name, an untargeted launch skips a
  parked node with a live session (office-hours or worker) and returns the
  next-ranking parked node, and an explicit target on a live-session node errors
  (a new `held` directive)"
owner: ai
status: codified
parent: null
rationale: Byproduct of the 2026-07-18 office-hours-concurrency interview.
  selectOfficeHours/officeHoursQueue
  (packages/intentionsutil/src/officeHours.ts) order parked nodes purely by
  resolved attention rank with no live-session filter, and office-hours-graph
  launches sessions named `office-hours-$node_id` in a cwd that is never
  provisioned into the node-id worktree — so worktree_has_live_session
  (name-keyed on the bare node id) can never detect a live office-hours session,
  and a second concurrent launch always returns the same queue head. This tactic
  closes the gap entirely in the bash entry script (office-hours-graph), reusing
  the same liveness-keyed mechanism worker sessions already use, without
  touching the pure TS selector (finalized this round; see node body for the
  full plan).
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-25: the queue-serialization work
    (dispatch-queue claim integrity, office-hours drain claiming, and the
    cross-queue landing path) is the current focus — boosted to parity with
    tactic-graph-router-live-worker-read-robust, the existing author-set boost
    on this same defect class, and deliberately below strategy-main-health's
    standing 100 so the main-health signal keeps its recorded dominance."
phase: implement
execution:
  branch: tactic-office-hours-concurrency-dedup
  pr: 2945
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# office-hours-graph gains liveness-based concurrency dedup mirroring graph-select-target: the graph-native office-hours lane runs in the node-id worktree under the bare node-id session name, an untargeted launch skips a parked node with a live session and returns the next-ranking parked node, and an explicit target on a live-session node errors

Finalized 2026-07-22 (`/align-tactics tactic-office-hours-concurrency-dedup`,
per-node finalize of a draft byproduct of the 2026-07-18
office-hours-concurrency interview on `strategy-graph-native-dispatch`,
"Does dispatch's concurrency dedup key on live sessions or worktree
existence…"). Explore + Plan (opus) fan-out ran this round; the plan below is
this session's transcription of that Plan output, reconciled against the
current source.

## Context

Requirement (author, 2026-07-18): office-hours sessions must be safe for
concurrent selection — running the office-hours entry script while an
office-hours session is already in progress on a node selects the
next-ranking office-hours node instead, using the SAME liveness-keyed
concurrency mechanism dispatch worker sessions already use (not
worktree-existence — a stale/un-reaped worktree must not hide a node from the
queue). Concretely, three behaviors are required:

1. Office-hours runs in the node-id worktree, under a session name that
   liveness-detection actually recognizes.
2. An untargeted `/office-hours` launch skips a parked node that already has a
   live session and returns the next-ranking parked node.
3. An explicit `/office-hours <node-id>` on an already-live node ERRORS
   (a deliberate human target on an occupied node is a collision to surface,
   never a silent fall-through or duplicate launch).

**Current implementation, verified this round:**

- `packages/intentionsutil/src/officeHours.ts` (99 lines, pure — no fs/env/
  network) has `officeHoursQueue(nodes)` (`:24-39`, orders parked nodes by
  resolved attention rank desc / id asc, **no liveness filter**),
  `openBlockers` (`:53-67`), the `OfficeHoursSelection` union (`:72-75`:
  `launch` / `empty` / `not-parked`), and `selectOfficeHours(nodes, target?)`
  (`:84-99`). No liveness/claimed-set parameter exists anywhere in this file.
- `packages/intentionsutil/scripts/office-hours-select.ts` (126 lines) is
  documented "no gh, no daemon, no network" in its own header. Its
  `resolveSessionCwd(repoRoot, nodeId)` (`:52-61`) returns the node-id
  worktree if it **already exists**, else the repo root — it never creates
  one. `formatDisposition` (`:73-91`) is a switch over `OfficeHoursSelection`
  with no `default`/`assertNever` (a missed arm fails typecheck via "not all
  code paths return a value," not an explicit guard).
- `packages/intentionsutil/scripts/office-hours-graph` (bash, 206 lines) is the
  actual entry point. It sources nothing from
  `.claude/skills/dispatch-propagate/` (that lib is scheduled for deletion —
  header `:11-13`) and has its own inline `job_id_for_name` dedup (`:47-53`,
  queries `claude agents --json --all`, filters `status != "stopped"`). It
  launches named `"office-hours-$node_id"` (`:160`) via `--bg --name "$name"`
  (`:176-177`), cwd'd into whatever `office-hours-select.ts` returned — never
  provisioning a worktree.
- `.claude/skills/office-hours/SKILL.md` graph lane (`:308-386`) is explicit
  read-only "report-and-stop": for a tactic node it only **names**
  `.claude/worktrees/<node-id>` and tells the *human* to run
  `assert-worktree-fresh` themselves (`:370-378`); it never provisions/enters
  a worktree.

**The critical constraint (why office-hours is invisible to liveness today):**
`worktree_has_live_session <path> [exclude_sid]`
(`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:512-549`) is
**100% name-keyed, never checks cwd**: `base=$(basename "$path")`,
`num="${base%%-*}"` (text before the first dash), then matches the live
session name column against either `base` exactly or `office-hours-$num`
exactly (`:540-542`) — that second pattern is a **legacy** convention for
`<N>-slug` numeric-issue worktrees (a human office-hours session for issue
`<N>` is named `office-hours-<N>`), not a generic "any office-hours session"
pattern. For a node-id worktree path like this tactic's own
`.claude/worktrees/tactic-office-hours-concurrency-dedup`,
`base="tactic-office-hours-concurrency-dedup"` and `num="tactic"`, so the
function looks for a session named `tactic-office-hours-concurrency-dedup` or
`office-hours-tactic` — **neither matches** `office-hours-graph`'s actual
launch name for that node,
`office-hours-tactic-office-hours-concurrency-dedup`. Worker/phase sessions
ARE detected because
they launch `--name "$id"` (the bare node id, matching `base`) — e.g.
`dispatch-spawn-job --name "$id"` per `graph-select-target:372`
(`worktree_has_live_session "$NATIVE_ROOT/.claude/worktrees/$id"`).

## Design decisions (made this round, with rationale)

1. **All liveness/skip logic lives in `office-hours-graph` (bash) — zero
   changes to `officeHours.ts` or `office-hours-select.ts`.** Computing the
   live-session set requires a daemon query (`claude agents --json`), which
   only ever happens in bash; injecting a daemon-derived claimed set into
   either TS file would violate their own documented "no daemon, no network"
   contracts. This also mirrors the real precedent exactly:
   `graph-select-target` (the shell wrapper) does its claimed-set filtering
   itself (`:365-375`) — the pure TS selector `router.ts`'s
   `selectGraphTargets` takes **no** claimed-set parameter at all (confirmed
   by reading `select-targets.ts`, which only threads `--dir`).
2. **The "explicit target already live" disposition is a new bash-only
   directive verb `held <node-id> <job-id>`, not a new `OfficeHoursSelection`
   union kind.** `office-hours-graph` already invents bash-only directive
   verbs with no TS union member — `cleared <node-id>` (`:106`, handled at
   `:145-148`) — for exactly the same reason (state the offline TS selector
   cannot see). `held` follows that precedent.
3. **The dedup mechanism is `office-hours-graph`'s own `job_id_for_name`,
   re-keyed onto the bare node id** (replacing `office-hours-$node_id`).
   Once office-hours sessions launch named `$node_id` (bare), `job_id_for_name
   "$node_id"` detects both a live worker AND a live office-hours session on
   that node — the identical name keyspace `worktree_has_live_session` reads —
   so this genuinely is "the same liveness-keyed mechanism," not a parallel
   one. A worker/office-hours name collision on one node is intentional and
   safe: a node reaches office-hours park only after its worker session
   already terminated, so a live simultaneous pair is rare (a stale unreaped
   worker, or two concurrent office-hours launches) — and the shared name is
   exactly what makes that collision *detectable*, which is the requirement.
4. **The no-PR reaping gap for bare node-id worktrees is closed in the same
   round** (see Unit 2) — otherwise every worktree this tactic starts
   provisioning accumulates forever, since `dispatch-sweep` today only reaps a
   branch with a numeric issue-number prefix or a PR.

## Units of work

### Unit 1 — `office-hours-graph`: worktree-resident bare-node-id launch + liveness dedup + `held` error

Delivers all three required behaviors. File:
`packages/intentionsutil/scripts/office-hours-graph`.

**Scope:**

- **Behavior 1 (worktree-resident, detectable name).**
  - Change the launch name from `name="office-hours-$node_id"` (`:160`) to
    `name="$node_id"` (bare node id). This alone makes both the existing
    `job_id_for_name` guard and the standard `worktree_has_live_session`
    convention detect the session.
  - Add a node-lane worktree provisioner in the `launch)` case (`:157-200`),
    before the launch kick, translated from the hook
    `.claude/hooks/worktree-create.sh:107-133` (that file is a
    `WorktreeCreate` hook — it fires only through the `EnterWorktree` tool
    inside an already-running Claude session, which does not exist yet at
    this point in `office-hours-graph`; do **not** call it directly, and do
    **not** use `provision-node-worktree` — that primitive does CI-ready
    gating (`dispatch-ci-ready`, requires a PR), merge-conflict handling
    (exit 11), and scope-staleness checks (exit 13), all worker/phase
    machinery wrong for a read-only, no-commit, no-PR session). Concrete
    logic, git scoped via `git -C "$SCRIPT_DIR"` (matching this script's
    existing cwd-independence convention, e.g. `park_live_on_main`):
    - Resolve the project root the same way `graph-select-target:190-192`
      does: `git -C "$SCRIPT_DIR" worktree list --porcelain | awk
      '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print
      wt; f=1}}'`; hard error if empty.
    - `NEW_PATH="$PROJECT_ROOT/.claude/worktrees/$node_id"`.
    - Reuse-then-create, mirroring the hook's node lane exactly: if
      `NEW_PATH` exists → reuse as-is; elif a remote branch named `$node_id`
      exists (`git ls-remote --heads --exit-code origin "$node_id"`) → fetch
      it and `git worktree add "$NEW_PATH" "$node_id"`; elif a local branch
      named `$node_id` exists → `git worktree add "$NEW_PATH" "$node_id"`;
      else → `git -C "$SCRIPT_DIR" fetch origin main` then `git worktree add
      -b "$node_id" "$NEW_PATH" origin/main`.
    - direnv warm-up mirroring the hook (`:132-133`), but **best-effort**
      (log a warning to stderr, never fatal) — office-hours is read-only, so a
      direnv blip must not block a human review session.
    - Set `cwd="$NEW_PATH"`, overriding the selector-emitted cwd (`$b`).
      `resolveSessionCwd` in `office-hours-select.ts` is unchanged and stays
      advisory-only for this launch path (its output is now overridden here,
      not removed — still used correctly for the `--list`/other callers that
      don't provision).
- **Behavior 2 (untargeted skip-to-next-rank).** In `resolve_directive`'s
  queue-head `while` loop (`:122-130`), add a second skip condition alongside
  the existing `park_live_on_main` check (`:125`): if `job_id_for_name "$nid"`
  returns non-empty, skip to the next rank with a stderr note mirroring the
  existing false-positive note at `:129`, e.g. `"office-hours: skipping $nid —
  a live session (job <id>) is already in progress."`. The first
  ranked node that is both parked-on-main AND not-live is launched (emit its
  `office-hours-select.ts` line as today, `:126`). If the walk exhausts, the
  existing `echo "empty"` (`:131`) stands unchanged.
- **Behavior 3 (explicit target on live node → `held`).** In
  `resolve_directive`'s target branch (`:90-111`), after `park_live_on_main
  "$TARGET"` succeeds (`:91`) and before invoking the selector (`:92`), check
  `job_id_for_name "$TARGET"`; if non-empty, `echo "held $TARGET $job_id"` and
  `return 0` (this must run BEFORE the `npx tsx office-hours-select.ts
  "$TARGET"` call on that line, not after — the held check preempts the
  normal launch directive entirely). Add a `held)` arm to the dispatch `case
  "$verb"` (`:144-205`, alongside `cleared)` / `empty)` / `launch)`) that
  prints a distinct error naming the live job id (mirroring the existing
  duplicate-name error text at `:167`) and `exit 1`. Update the header's
  directive-vocabulary comment (`:19-24`) to add the `held` line.
- **Keep the launch-time race guard as-is.** The existing `job_id_for_name
  "$name"` check at `:165-169` — now keyed on the bare `$node_id` after the
  rename above — remains the last-moment TOCTOU gate between selection and
  launch (a node that went live in that narrow window errors rather than
  double-launching).

**Out of scope for this unit:** any change to `officeHours.ts`,
`office-hours-select.ts`, or `office-hours.test.ts` (design decision 1/2
above); the numeric-issue legacy lane in `.claude/skills/office-hours/SKILL.md`.

**Recommended model:** opus (concurrency/ordering judgment, TOCTOU reasoning,
translating hook bash logic into a plain script across execution contexts).

### Unit 2 — `dispatch-sweep`: reap bare node-id worktrees with no PR

File: `.claude/skills/dispatch-propagate/scripts/dispatch-sweep`.

**Scope:** Verified this round — a worktree whose branch has no issue-number
prefix (`wt_num` empty, computed at `lib.sh:2205-2212`, `^([1-9][0-9]*)-`) and
no PR (`pr_num` empty) reaches `if [[ -n "$wt_num" ]]` at `:252`, skips the
entire issue-lookup/removal block (`:252-287`), and falls straight to the
bare `continue` at `:288` — **a bare node-id worktree (e.g. a branch named
after a tactic id, no leading digits, no PR ever opened) is invisible to
every removal path today**, regardless of staleness or liveness. This is a
pre-existing
gap, not created by this tactic, but Unit 1's newly-provisioned office-hours
worktrees fall straight into it (branch = bare `$node_id`, never a PR), so it
ships in the same round or those worktrees accumulate forever.

Ideal (greenfield) answer: a node-id worktree should be reaped whenever it is
clean and unoccupied, regardless of branch-name shape or PR existence. Ship
the narrowest correct form of that now: add an `else` to the `if [[ -n
"$wt_num" ]]` block (`:252-287`), reached only when both `pr_num` and
`wt_num` are empty, reusing the two guards the CLOSED-issue arm already uses
(`:261-278`) verbatim:

- `if worktree_has_live_session "$wt_path"` → log a skip (mirror
  `SKIP_CLOSED_LIVE_SESSION`, e.g. `SKIP_NODE_LIVE_SESSION`), `continue` — a
  live office-hours OR worker session (both now named `$node_id` after Unit 1)
  protects its own worktree from reaping.
- `elif worktree_in_sync "$wt_path" "$LOG_FILE" "dispatch-sweep"` → `git
  worktree remove` + `git worktree prune` + `git branch -D "$wt_branch"` +
  `reap_marker_clear`, mirroring `:263-272` exactly.
- `else` → `reap_or_skip_not_in_sync` with a new kind tag (e.g. `NODE`) and
  extra-info `"node=$wt_branch"`, mirroring the call shape at `:277`, so an
  out-of-sync node-id worktree gets the same grace-timestamp treatment as
  every other kind rather than being force-removed.

No `gh`/issue lookup on this new path — there is no issue to query.

**Out of scope:** the numeric-issue and merged/open-PR arms (unchanged);
GitHub reaping semantics generally. This is the one place a bug could
over-reap live work, so keep it to reusing the two guards verbatim rather
than inventing new logic.

**Recommended model:** opus (touches the shared reaping hot path for every
worktree kind; over-reap risk demands careful guard reuse, not just
mechanical copy-paste).

**Dependencies:** none — independently landable (only shares the naming
convention Unit 1 also relies on, which `dispatch-sweep` already assumes for
worker worktrees today).

### Unit 3 — Documentation sync

Files: `packages/intentionsutil/scripts/office-hours-graph` (header
`:1-29`), `.claude/skills/office-hours/SKILL.md` (graph lane `:308-386`,
especially the "the human should run `assert-worktree-fresh` themselves" /
"never provisions/enters a worktree" text at `:370-380`), and
`packages/intentionsutil/scripts/office-hours-select.ts` (header comment
`:13-14` describing the cwd contract).

**Scope:** Update prose to match the shipped behavior: office-hours now
provisions and enters the node-id worktree itself, launches named `$node_id`
(bare), skips a live-session node to the next rank when untargeted, and
errors (`held`) on an explicitly-targeted live node. Correct the SKILL.md
graph-lane claim that it "never provisions/enters a worktree" and that
worktree freshening is the human's job for a tactic node (Unit 1 now
provisions fresh from `origin/main` itself, so a *freshly launched* session
starts current; the human still needs `assert-worktree-fresh` only if
re-engaging a worktree that has since gone stale while the session sat idle —
narrow that claim rather than delete it). No behavioral/code change in this
unit.

**Out of scope:** the numeric-issue legacy lane; any code change.

**Recommended model:** sonnet (rote prose sync to already-decided,
already-implemented behavior).

**Dependencies:** Units 1 and 2 (documents their shipped behavior).

## Reuse

- Reuse-then-create worktree pattern: `.claude/hooks/worktree-create.sh:107-133`
  (node lane) — translate into plain bash inside `office-hours-graph`; it is a
  hook, not directly callable from a pre-session script.
- Project-root resolution one-liner:
  `graph-select-target:190-192`'s `git worktree list --porcelain | awk ...`.
- Inline liveness query: `job_id_for_name`, already defined in
  `office-hours-graph:47-53` — re-key onto the bare `$node_id`; no new
  primitive needed.
- Reaping guards: `worktree_has_live_session`
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:512-549`,
  already sourced by `dispatch-sweep`) and `worktree_in_sync` +
  `reap_or_skip_not_in_sync` + `reap_marker_clear` (all already defined/used
  in `dispatch-sweep`, see `:261-277`).
- Directive-verb precedent: the existing bash-only `cleared` verb
  (`office-hours-graph:106,145-148`) — model `held` on it.
- Do **not** reuse `provision-node-worktree` (heavy CI/merge/PR gating, wrong
  for a read-only session) or the `EnterWorktree` hook path (unavailable
  before a session exists).

## Verification

```verify
npx vitest run --project packages/intentionsutil --root /home/n8/natb1/commons.systems office-hours
```

```verify
bash -n packages/intentionsutil/scripts/office-hours-graph && bash -n .claude/skills/dispatch-propagate/scripts/dispatch-sweep
```

Manual / observational (stub `claude` via `OFFICE_HOURS_CLAUDE_CMD` per the
script's own header `:37-38` to record `--bg`/`agents` calls without a real
daemon spawn; run with `dangerouslyDisableSandbox: true` since `claude agents
--json` reaches the daemon over a Unix socket):

- **Behavior 1:** run `office-hours-graph <node-id>` for a parked node with no
  existing worktree; confirm `.claude/worktrees/<node-id>` is created fresh
  off `origin/main` and the `--bg` launch uses `--name "<node-id>"` (bare)
  with cwd = that worktree.
- **Behavior 2:** with two parked nodes A (higher rank) and B, stub `claude
  agents` to report a live session named exactly `A`; run untargeted
  `office-hours-graph` and confirm it emits a stderr skip note for A and
  launches B. With no live sessions, confirm it launches A.
- **Behavior 3:** with the stub reporting a live session named `<node-id>`,
  run `office-hours-graph <node-id>` and confirm it prints the `held`
  collision error naming the live job id and exits non-zero (no `--bg` launch
  occurs).
- **Reaping (Unit 2):** create a bare node-id worktree (branch `tactic-*`, no
  PR), leave it clean with no live session, run `dispatch-sweep`, confirm it
  is removed and its branch deleted; repeat with a live session named
  `<node-id>` and confirm it is skipped; repeat with an uncommitted change and
  confirm it is held for grace rather than force-removed.

## needs-main residue

QA pass (2026-07-22, PR #2945): every script-verifiable acceptance item
passed (grep-verified bare-node-id naming, the `held` directive emission and
case arm, the untargeted skip-to-next-rank loop, the worktree provisioner,
the `dispatch-sweep` reap arm; `bash -n` on both changed scripts; the
`office-hours` vitest suite, 16/16). The three items below are the PR's own
documented manual/end-to-end scenarios (stubbed `OFFICE_HOURS_CLAUDE_CMD`,
live-daemon session state) that cannot be mechanically re-created in an
autonomous QA pass — planned deferrals, not defects — so they carry forward
for post-merge verification against deployed main.

- **id:** 8
  **title:** End-to-end `held` collision on a targeted live node (stubbed claude)
  **url_path:** current
  **expected_outcome:** Targeted launch on a live node errors with the `held <node-id> <job-id>` message and exits 1 without launching.
  **finding:** PR test plan lists this stubbed-claude end-to-end scenario as an unchecked manual item; live-session dedup can't be safely re-created mechanically in this pass.
- **id:** 9
  **title:** End-to-end untargeted skip-to-next-rank with a stubbed live session
  **url_path:** current
  **expected_outcome:** Untargeted launch skips the live node (stderr note) and launches the next rank; with no live sessions it launches the top-ranked node.
  **finding:** Depends on live daemon/session state the PR documents as manual-only; not mechanically re-verifiable here.
- **id:** 10
  **title:** End-to-end worktree provisioning (fresh off origin/main, cwd override)
  **url_path:** current
  **expected_outcome:** Provisioning creates/reuses the node-id worktree correctly, launches with bare name and cwd set to the provisioned path.
  **finding:** Requires a real `git worktree add` / launch cycle with stubbed claude that the PR lists as an unchecked manual scenario.
