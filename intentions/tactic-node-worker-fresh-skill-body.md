---
id: tactic-node-worker-fresh-skill-body
kind: tactic
statement: Spawn the exit-11 conflict lane with --cwd on the primary checkout
  instead of on the node's own worktree — keeping --name "$id" so occupancy and
  Stop-hook reaping are unchanged — and make dispatch-conflict Lane 3 drive the
  node worktree explicitly by absolute path (git -C / explicit entry plus
  assert-worktree-fresh) from whatever cwd it was spawned with, so the lane
  never reads its own instructions out of the checkout whose origin/main merge
  just failed
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Observed live: Lane 3 landed on main 2026-07-28T16:05 and the tick
  spawned it at 16:39 into a worktree 142 commits behind whose
  dispatch-conflict/SKILL.md carried only Lanes 1-2; the session read pre-Lane-3
  instructions, found office_hours null, took Lane 2's 'wrong tool for this
  node' dead end, and the real conflict went unresolved. Structural, not
  incidental: provision exit 11 fires BECAUSE the worktree's merge with
  origin/main failed (provision-node-worktree:126-129), and
  dispatch-graph-execute:274 then spawns the lane with --cwd on that same
  checkout. Generalizes to every phase skill spawned into a node worktree.
  Candidate directions (not yet decided): freshen the checkout before the lane
  reads its body, or source skill bodies from the primary checkout at spawn
  time. Needs /align-tactics to pick one and plan it. SCOPE NARROWED 2026-07-29
  (same day, after reading provision-node-worktree:98-132): this is an
  exit-11-only defect, not a general phase-skill defect. Line 126's merged-tree
  guarantee means every successful provision already refreshes the worktree's
  skill bodies before spawning; exit 11 is the one path that spawns after that
  merge failed and was aborted. Worktrees are reused (provision creates only
  when the directory is absent), so staleness accumulates between merges.
  DECIDED FIX DIRECTION (was two open candidates): spawn with --cwd on the
  primary checkout, keeping --name \"$id\". The root cause is that --cwd
  conflates where the git work happens with where instructions come from; Lane 3
  already receives the node id as an argument and can drive the node worktree by
  absolute path via `git -C`, which its subagent absolute-path contract already
  requires. The primary checkout is the freshest reliably-available tree: a
  recorded condition pins it to main and dispatch-select-tick step 1 ff-syncs it
  every tick. Both contracts dispatch-graph-execute's own REAP CONTRACT comment
  warns about were verified to survive: worktree_has_live_session matches the
  session NAME (column 3 of claude agents --json) against the worktree basename
  and never inspects the session's cwd, so occupancy is cwd-independent; and
  dispatch-stop.sh:63 keys on JOB_NAME plus intentions/<JOB_NAME>.md existing at
  the hook root, both of which hold in the primary checkout. Side benefit: a
  node whose branch edits dispatch-conflict/SKILL.md gets the lane running the
  SHIPPED version of itself rather than its own in-flight edit. REJECTED: `git
  checkout origin/main -- .claude/` before the spawn — 20 of 47 live node
  branches (43%) modify .claude/, disproportionately the dispatch-machinery
  nodes most likely to conflict there, so it would clobber in-flight
  self-modification work exactly where the fix is most needed. Also rejected:
  any in-skill freshness self-check, since the stale body is the thing being
  read and an old body predates the check — the fix must live in the spawner.
  OPEN FOR PLANNING: whether any Lane 3 step relies on relative paths assuming
  cwd, and whether it needs the worktree-scoped direnv step provisioning
  performs. RECURRED 2026-07-30 with a strictly worse outcome, during the
  dispatch bootstrap's Stage 4 drain. The tick spawned Lane 3 into the
  tactic-graph-tick-node-lane-auto-merge worktree - 365 commits behind
  origin/main (HEAD 165a589e, 2026-07-23) - whose dispatch-conflict/SKILL.md
  carried ZERO '## Lane' sections and ZERO mark-node-terminal calls, a body
  predating the three-lane split entirely. The session applied the old
  single-lane Step 1 gate (branch must match '<N>-...'), correctly concluded the
  skill did not apply to a node-id target, and stopped having written no marker.
  dispatch-stop.sh discriminator 2 handed it to dispatch-self-close --node,
  which HOLDs absent a node-terminal marker, so the session stayed live and idle
  for over an hour. Because worktree_has_live_session is name-keyed on the node
  id, that simultaneously consumed one of only three worker slots AND made the
  node unselectable, with no autonomous recovery path; it was freed by hand.
  This is worse than the 2026-07-29 observation (an unresolved conflict) because
  a body predating the terminal-declaration contract cannot declare even in
  principle - it converts dispatch-graph-execute's REAP CONTRACT assumption
  ('Lane 3 therefore declares it on BOTH terminal paths') into a deadlock rather
  than a missed resolution. Note the compounding: exit 11 fires BECAUSE the
  worktree is far behind, so the staler the worktree the likelier the spawn -
  and worktree GC had itself been down via tactic-sweep-timer-unit-dir-leak,
  which is what let this worktree survive seven days past its own PR merge.
  FINALIZED 2026-07-31 (/align-tactics round): decomposed to a single
  claude-eligible tactic (no split needed — the fix is one cohesive change plus
  its two required companions). Full 3-unit plan landed in the node body: Unit 1
  (sonnet) the one-line dispatch-graph-execute spawn change plus its pinned
  test; Unit 2 (sonnet) an independent prerequisite letting
  subagent-contamination-guard take an explicit worktree path, since after Unit
  1 the guard's cwd-is-primary-checkout SKIP would otherwise go vacuous at
  exactly the site where the hazard is now highest; Unit 3 (opus) making
  dispatch-conflict Lane 3 drive the node worktree explicitly by absolute path
  from any spawn cwd, plus a doctrine-ratchet test and required CI wiring. See
  body for the full plan, reuse citations, and verification."
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
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Promoted into Wave A after the defect recurred live
    during the bootstrap Stage 4 drain and deadlocked a node worker - a stale
    worktree served a dispatch-conflict body predating the terminal-declaration
    contract, so the session could not declare, which permanently consumed a
    worker slot and made the node unselectable with no autonomous recovery path.
    It belongs in this band on the band's own criterion: it takes fleet capacity
    down rather than corrupting one node. blocked_by is empty, so this promotion
    lifts no blocker and cannot compound - contrast the 65.33 sum
    tactic-dispatch-test-monolith-split produced when it kept its own boost
    while being lifted. status stays raw and phase stays null so the selector
    emits it as an /align-tactics candidate for planning, not as an implement
    candidate. Interim scaffolding only - tactic-attention-tier-ranking replaces
    the whole numeric scheme with lexicographic (tier, rank) and max-lifting,
    and tactic-attention-boost-scripts converts these boosts to tier/bug_fix
    marks."
phase: done
execution:
  branch: tactic-node-worker-fresh-skill-body
  pr: 3001
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-31T15:46:11Z
    mergeCommitSha: be86cd497cfb7eb3f0eff8d2b0fa9a988ebf82f3
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Spawn the exit-11 conflict lane with --cwd on the primary checkout instead of on the node's own worktree — keeping --name "$id" so occupancy and Stop-hook reaping are unchanged — and make dispatch-conflict Lane 3 drive the node worktree explicitly by absolute path, so the lane never reads its own instructions out of the checkout whose origin/main merge just failed

## Context

`provision-node-worktree` exits **11** when `origin/main` does not merge clean into a
graph node's own branch. `dispatch-graph-execute`'s case-11 branch responds by
spawning `/dispatch-conflict <node-id>` — the skill's **Lane 3** — with
`--cwd` set to that node's own worktree
(`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:259,286`).

That checkout is **guaranteed stale**: exit 11 fires *because* its merge with
`origin/main` just failed and was aborted. A Claude session reads its skill body,
its hooks, and every relatively-invoked helper script from its spawn cwd — so the
lane reads *its own instructions* out of the one tree that is known to be behind.

Observed twice, live:

- **2026-07-28** — spawned into a worktree 142 commits behind whose
  `dispatch-conflict/SKILL.md` carried only Lanes 1–2. The session found
  `office_hours: null`, took Lane 2's "wrong tool for this node" dead end, and the
  real conflict went unresolved.
- **2026-07-30** — spawned into a worktree **365 commits behind** (HEAD from
  2026-07-23) whose `dispatch-conflict/SKILL.md` predated the three-lane split
  entirely and contained **zero** `mark-node-terminal` calls. The session applied
  the old single-lane `<N>-…` branch gate, concluded the skill did not apply, and
  stopped **having written no node-terminal marker**. `dispatch-stop.sh`
  discriminator 2 handed it to `dispatch-self-close --node`, which **HOLDs** absent
  that marker — so the session stayed live and idle for over an hour, consuming one
  of three worker slots while `worktree_has_live_session` (name-keyed on the node
  id) simultaneously made the node unselectable. Freed by hand; no autonomous
  recovery path exists.

The second outcome is strictly worse than the first: a body predating the
terminal-declaration contract cannot declare **even in principle**, converting
`dispatch-graph-execute`'s own REAP CONTRACT assumption into a deadlock. The defect
also compounds — exit 11 fires *because* the worktree is far behind, so the staler
the worktree, the likelier the spawn.

**Ideal greenfield design.** `--cwd` conflates two unrelated things: *where the git
work happens* and *where the session's instructions come from*. They should be
separate. Instructions come from the freshest reliably-available tree — the
**primary checkout** (pinned to `main`, ff-synced by `dispatch-select-tick` step 1
every tick). The target tree is an **explicit argument** the lane drives by absolute
path. `dispatch-graph-execute`'s strategy lane already has exactly this shape
(`dispatch-graph-execute:185-200`: `--cwd "$PROJECT_ROOT"`, `--name "$id"`, skill
enters its own worktree).

**Scope of this change: the exit-11 path only.** This was deliberately narrowed —
every *successful* provision (exit 0) refreshes the worktree's skill bodies via its
own merged-tree guarantee before spawning, so exit 11 is the single path that spawns
after that merge failed. Generalizing the split to every phase-skill spawn is a
separate, larger tactic.

**Rejected alternatives** (do not re-litigate during implementation):

- `git checkout origin/main -- .claude/` before the spawn — 20 of 47 live node
  branches (43%) modify `.claude/`, disproportionately the dispatch-machinery nodes
  most likely to conflict there; it would clobber in-flight self-modification work
  exactly where the fix is most needed.
- Any in-skill freshness self-check as *the* fix — the stale body is the thing being
  read, and an old body predates the check. The fix must live in the spawner.

**Two contracts were verified to survive the `--cwd` move** and must not be
re-derived:

1. `worktree_has_live_session` (`lib-claude-agents.sh:532-569`) matches the session
   **name** (column 3 of a machine-wide `claude agents --json` fetch) against the
   worktree basename. It never inspects a session's cwd — occupancy stays correct as
   long as `--name "$id"` is unchanged.
2. `dispatch-stop.sh:61-63` keys discriminator 2 on `JOB_NAME` **plus**
   `intentions/<JOB_NAME>.md` existing at `_HOOK_ROOT` (derived from the hook
   script's own path, i.e. the spawn checkout). Graph writes are direct-push to
   `main`, so every node file exists in the primary checkout — the discriminator
   holds there identically.

**Side benefit:** a node whose own branch edits `dispatch-conflict/SKILL.md` gets the
lane running the **shipped** version of itself rather than its own in-flight edit.

**Self-modification note for the implementer.** This PR's entire diff is under
`.claude/**`. Per `strategy-graph-native-dispatch`'s self-modification doctrine the
commit may be **denied by the permission classifier** in an auto-mode session. That
is expected: complete all edits, leave the branch staged, and park on the commit
denial for the office-hours config-grant drain (the doctrine's fallback lane) rather
than weakening or abandoning the change.

---

## Unit 1 — Spawn the exit-11 conflict lane on the primary checkout

**Scope.**

`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`, case `11` only:

- Line **286**: change `--cwd "$CONFLICT_WT"` to `--cwd "$PROJECT_ROOT"`.
  `PROJECT_ROOT` is already computed once at line **113** via `resolve_main_worktree`
  (`lib-graph-worktree.sh:5-27`, honors `DISPATCH_GRAPH_MAIN_WORKTREE` for tests) —
  reuse that variable; do **not** add a second resolution call.
- Line **259**: delete `CONFLICT_WT="$PROJECT_ROOT/.claude/worktrees/$id"`. It has
  exactly two occurrences in the file (259 definition, 286 use) and becomes dead.
  Lane 3 derives the worktree path itself from the node id (Unit 3), which keeps the
  lane entry-path-agnostic.
- Keep **everything else in the block byte-identical**: `--name "$id"`,
  `--no-verify`, `--model "$ORCH_MODEL"`, the deliberate absence of
  `"${EFFORT_ARGS[@]}"`, the prompt `"/dispatch-conflict $id"`, the `STRIKE_FILE`
  reset, `reservation_clear`, the `conflict-lane $id` stdout word, and the whole
  strike-then-hold backstop below it.
- Rewrite the **REAP CONTRACT** comment (lines **267-281**). Its reasoning is correct
  and must be preserved verbatim in substance; only its cwd premise changes. It
  currently opens `# REAP CONTRACT: --name "$id" under the node's own worktree makes
  this session a graph-native NODE WORKER`. Replace the "under the node's own
  worktree" clause with the accurate one: the session is a node worker because of
  **`--name "$id"` alone** — `dispatch-stop.sh` discriminator 2 keys on `JOB_NAME`
  plus `intentions/<id>.md` at the hook root, and both hold in the primary checkout
  (graph writes are direct-push to `main`). Add two sentences recording why the cwd
  moved: the node worktree is guaranteed stale on this path (its `origin/main` merge
  is what just failed), so spawning there made the lane read its own instructions out
  of a stale tree — twice landing a session whose body predated the lane, once
  deadlocking a worker slot; and Lane 3 drives the node worktree by absolute path
  instead. Keep the existing closing warning ("Do not spawn this session under a name
  that is NOT the node id without first teaching the selector's occupancy check about
  that name") unchanged.
- Do **not** touch case `0` (line ~213), which correctly spawns the node's phase
  skill with `--cwd "$WT"` — the exit-0 merge guarantee already freshened that tree.

`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`, Case 5
(lines **185-217**):

- Replace the assertion at lines **198-199** (`"conflict-lane --cwd is the node's own
  worktree"` / `"--cwd $MAIN_WT/.claude/worktrees/tactic-c"`) with one asserting the
  project root.
- **Exactness trap — do not write `assert_contains "--cwd $MAIN_WT"`.** The spawn
  stub logs `"$*"` (space-joined argv), so `--cwd $MAIN_WT` is a **prefix** of
  `--cwd $MAIN_WT/.claude/worktrees/tactic-c` and that needle would pass under the
  old, buggy behavior. Assert the needle **including the following flag** —
  `"--cwd $MAIN_WT --model"` — and add a companion
  `assert_not_contains "conflict-lane --cwd is NOT the node's own worktree"
  "$MAIN_WT/.claude/worktrees/tactic-c" "$SPAWN"` (the helper is defined at the top of
  this file, lines 28-38; the prompt is `/dispatch-conflict tactic-c`, which does not
  contain the worktree path, so the negative assertion is safe).
- Leave the other Case 5 assertions (lines 194-207: stdout word, exit 0, prompt,
  `--name tactic-c`, `--model sonnet`, `--no-verify`, no park/hold write, no strike
  file, reservation cleared) unchanged. Also leave Case 3's project-root assertion
  (line 172) alone — out of scope.

**Out of scope:** `provision-node-worktree`, the strike/hold ladder's own semantics,
`dispatch-spawn-job` itself (only the argument value changes; its dedup/verify
semantics are untouched), and every other provision-exit case (0/10/12/13/14/2).

**Recommended model:** sonnet.

---

## Unit 2 — Let `subagent-contamination-guard` take an explicit worktree path

**Scope.**

`.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard`.

Why this is needed: the guard derives the launching worktree as
`CUR="$(git rev-parse --show-toplevel)"` (line **45**) and, when `CUR` **is** the
primary checkout, writes `SKIP` and passes vacuously (lines **99-106**). After Unit 1,
Lane 3's session cwd *is* the primary checkout — so the guard would go permanently
vacuous at exactly the site where the hazard is now highest (a subagent whose cwd is
pinned to the primary checkout writing there instead of into the node worktree).

Change:

- Accept an **optional third positional** `[worktree-path]`:
  `subagent-contamination-guard <baseline|check> <label> [worktree-path]`. When
  present, `CUR` is that path (resolve it to an absolute, symlink-free path the same
  way the script's other path handling does — e.g. `cd "$path" && pwd -P`, or
  `git -C "$path" rev-parse --show-toplevel`); when absent, keep today's
  `git rev-parse --show-toplevel` behavior byte-identically.
- Fail with the existing usage exit **2** when the path does not exist or is not
  inside a git repository — a clear error, not a fallback to cwd
  (`.claude/rules/code-style.md`).
- Update `usage()` (lines **27-30**) and the header comment block (lines **1-19**) to
  document the argument and *why* it exists: a caller whose own cwd is the primary
  checkout must name the worktree it is really operating on, or the guard silently
  SKIPs.
- `SNAP` (line **64**) already keys the snapshot filename on `CUR`, so `baseline` and
  `check` must be passed the **same** path — state that in the header comment.
- Everything else — the `CLAUDE_CODE_SESSION_ID` requirement, the SKIP path, the
  consume-and-delete of the snapshot, the check-time `PRIMARY` re-resolution guard,
  the exit-code contract (0 clean / 1 contamination / 2 wiring error) — is unchanged.

`.claude/skills/dispatch-propagate/scripts/test-subagent-contamination-guard.sh`
(185 lines, cases 1-8): add cases covering the new argument, keeping the existing
eight untouched:

- `baseline`+`check` with an explicit worktree path that is **not** the primary
  checkout, from a cwd that **is** the primary checkout → the guard does **not**
  SKIP; a file newly created in the primary checkout between baseline and check is
  reported as contamination (exit **1**, stderr names the file and the `Repair:`
  line). This is the regression that matters — mirror case 3's structure (lines
  ~85-104).
- `baseline` with an explicit path and `check` **without** it → exit **2**
  (missing baseline), because the `SNAP` key differs. This pins the
  "pass it to both or not at all" contract.
- A nonexistent explicit path → exit **2** with a usage-shaped error.

**Out of scope:** every other caller of the guard (`implement-unit/SKILL.md:50-68`
and Lane 1's Steps 5/6 at `dispatch-conflict/SKILL.md:343,373`) — the argument is
optional and their two-argument calls must keep working unchanged.

**Recommended model:** sonnet.

**Dependencies:** none (independent of Unit 1).

---

## Unit 3 — Make Lane 3 drive the node worktree explicitly by absolute path

**Scope.**

`.claude/skills/dispatch-conflict/SKILL.md` only (plus one new test and one CI wiring
line, below). Lane 3 currently assumes its cwd **is** the node's worktree. After
Unit 1 it is spawned into the primary checkout, so every implicit-cwd dependency
must become explicit. The lane must work from **any** cwd.

### 3a. Prose changes

**Lines 82-90, "Who enters each lane".** The Lane 3 bullet states `--cwd` is set to
`<project-root>/.claude/worktrees/<node-id>`, the node's own worktree. Rewrite: the
tick spawns `/dispatch-conflict <node-id>` with `--cwd` on the **primary checkout**
and `--name "<node-id>"`, deliberately — the node's own worktree is guaranteed stale
on the exit-11 path (its `origin/main` merge is what just failed), and a session
reads its skill body from its spawn cwd. Keep the existing "must hold up unattended /
Steps 9 and 10 are what the reap contract depends on" sentences unchanged.

**Lines 92-128, "Select the lane and resolve the target in place".** The opening
sentence ("`/dispatch-conflict` operates in place — the **current worktree** (or an
explicit node id) dictates the target") is no longer true for Lane 3. Add: the tick's
Lane 3 entry always passes an **explicit node id**, and the branch-derivation block
below is not a valid fallback from the primary checkout (whose branch is `main`,
never a node id). Add a clear-error guard to that block (line 117 region): when
`ARGUMENTS` is empty **and** the current worktree is the primary checkout (compare
`git rev-parse --show-toplevel` against `resolve_main_worktree` from
`.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh`, or detect branch
`main`), stop with
`/dispatch-conflict: no ARGUMENTS and cwd is the primary checkout — pass an explicit
node id` rather than falling into Rule 3 with a garbage `NODE_ID`. Rules 1 and 2 and
Lane 1's behavior are otherwise unchanged.

**Lines 706-736, Lane 3 Step 1.** This is the core edit. Replace "Then enter
`<project-root>/.claude/worktrees/$SOURCE_ID`" with an explicit two-variable setup
that every later step references:

```bash
PROJECT_ROOT=$(.claude/skills/dispatch-propagate/scripts/… resolve_main_worktree)  # or: git rev-parse --show-toplevel from the primary checkout
WT="$PROJECT_ROOT/.claude/worktrees/$SOURCE_ID"
```

State the contract in prose, at the top of Step 1:

- `WT` is the **node's own worktree** — every git operation on the node's branch
  targets it via `git -C "$WT" …`. Never `cd` into it and never rely on the session's
  cwd being it. (`git -C <path>` on a worktrees-root path is auto-approved by the
  PreToolUse hook per `.claude/rules/sandbox.md`; a `cd … && …` compound is not.)
- `PROJECT_ROOT` is the **primary checkout**, this session's cwd and the tree its
  instructions came from. **Every helper script Lane 3 invokes must be invoked by
  absolute path under `$PROJECT_ROOT`** — never by a relative `.claude/…` path that
  could resolve inside `$WT`, which is precisely the stale tree this whole change
  exists to stop reading from.
- If `$WT` does not exist, stop loudly (it is a should-never-happen: exit 11 leaves
  the worktree in place) — **but** write the node-terminal marker first (see the
  terminal-marker rule below).
- **Freshness.** Run
  `"$PROJECT_ROOT/.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh"
  "$PROJECT_ROOT"` (detect-only; fetches `origin/main` and exits 1 if HEAD is behind
  — `assert-worktree-fresh:1-72`). On exit 1, freshen with
  `git -C "$PROJECT_ROOT" merge --ff-only origin/main`
  (`dangerouslyDisableSandbox: true` — a tree-updating op that routinely touches the
  read-only `.claude/` carve-out, per `.claude/rules/sandbox.md`) and re-assert. If it
  still fails, **warn on stderr and continue** — spell out why in the prose so this
  does not read as an unprincipled fallback: Lane 3's authoritative reads are all
  `origin/main`-fetched (the preamble's `git fetch` + `git archive origin/main` node
  read at lines 145-157, and Step 3's live merge against a freshly fetched
  `origin/main`), so a primary checkout a few commits behind is a soft risk to helper
  scripts only, and a momentarily unmergeable primary is `dispatch-select-tick`'s
  defect to report, not grounds to escalate a node to a human hold.
- **Never run `assert-worktree-fresh` against `$WT`.** On the exit-11 path the node's
  worktree is behind `origin/main` **by construction** — that staleness is the
  conflict being resolved. Asserting freshness there would fail 100% of the time.
  Say this explicitly in the prose; it is the obvious wrong turn.

Keep Step 1's existing content otherwise intact: the hold-vs-source `SOURCE_ID`
resolution (lines 708-714), the exit-11 clean-tree invariant and the exit-14
worktree-residue note (lines 716-728), and the **second exit-11 cause** — merge
`origin/$SOURCE_ID` first when it is not already a no-op, *before* Step 3's
`origin/main` reproduction (lines 730-736). Re-express that merge as
`git -C "$WT" merge origin/$SOURCE_ID`; do not re-derive the ordering, and do not
duplicate `provision-node-worktree`'s merge logic (`provision-node-worktree:334-370`
owns it).

**Step 3 (lines 764-790).** `git merge --no-edit origin/main` →
`git -C "$WT" merge --no-edit origin/main` (`dangerouslyDisableSandbox: true`, as the
header at lines 53-56 already requires for Lane 3). Same for
`git -C "$WT" diff --name-only --diff-filter=U`. The already-up-to-date sub-case and
its jump to the `resolved` tail are unchanged, except that its
`git push origin HEAD` becomes `git -C "$WT" push origin HEAD`.

**Step 4 (lines 791-817).** Both halves change:
`git -C "$WT" diff --name-only --diff-filter=U |
"$PROJECT_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-config-scope"`.
The predicate contract (exit 1 = non-empty `.claude/` subset, record and **continue**)
and the self-modification-doctrine quotation are unchanged.

**Step 5 (lines 818-871).** Three changes:

1. The guard calls at lines **825** and **869** take the explicit worktree path added
   in Unit 2:
   `"$PROJECT_ROOT/.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard"
   baseline dispatch-conflict "$WT"` and the matching `check … "$WT"`. Add a
   sentence: both calls must pass the **same** `$WT` (the snapshot filename is keyed
   on it), and passing it is what keeps the guard live now that the session's own cwd
   is the primary checkout — without it the guard SKIPs and detects nothing.
2. **Lines 835-836 are a live bug after Unit 1** and are the single most important
   fix in this unit. The subagent brief currently says: *"The launching worktree root
   is `<WT>` (from `git rev-parse --show-toplevel`)"*. From the primary checkout that
   expression now returns `$PROJECT_ROOT` — it would point the resolver subagent at
   the **wrong checkout**, which is exactly the lost-work failure
   `implement-unit/SKILL.md:50-68` documents. Replace it with the explicitly resolved
   `$WT` from Step 1 and drop the `git rev-parse --show-toplevel` parenthetical. Keep
   the pointer to implement-unit Step 1 for the full contract and rationale; do not
   compose new wording for the constraint itself.
3. The per-file history commands (lines 845-848) become
   `git -C "$WT" log --oneline …`.

The Lane-1-reuse contract (untrusted-data fence, `resolved` / `ambiguous <reason>`
verdict shape, the no-hunk-content/no-paths/no-credential-like-strings constraint) and
the two Lane-3-specific resolution rules (the `intentions/*.md` main-is-authoritative
rule, and "upstream already did this" as a first-class outcome) are unchanged.

**Step 6 (lines 872-947).** `git -C "$WT"` for `add` / `diff --cached --check` /
`commit --no-edit` / `push origin HEAD`, and grep the staged files by absolute path
under `$WT`. The **verification** call at lines 907-936 is the one place where cwd is
genuinely load-bearing — `dispatch-run-verification` runs each `verify` block via
`bash` **in the current working directory**, and those blocks must run against the
merged node tree, not the primary checkout. Use a scoped subshell so the session's cwd
is never mutated:

```bash
( cd "$WT" && printf '%s' "$NODE_MD" \
    | "$PROJECT_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-run-verification" )
```

Say explicitly that the `cd` is **scoped to this subshell** and that the script comes
from `$PROJECT_ROOT` while the blocks run in `$WT`. Everything else in Step 6 —
commit-before-verify rationale, the H2-`## Verification` heading requirement, the
0/3/1/4/5 exit-code branch table, and the `PR_NUM`-guarded push — is unchanged.

**Steps 7, 8, 9, 10 (lines 948-1094).** Invoke the package primitives by absolute
path under `$PROJECT_ROOT`, not the relative `packages/intentionsutil/scripts/…` form
(lines 964, 985, 1013, 1067, 1081). Running a graph write out of a stale checkout is a
known origin/main-reverting hazard, and `$PROJECT_ROOT` is the fresh tree:

- Step 7: `"$PROJECT_ROOT/packages/intentionsutil/scripts/park-node" "$SOURCE_ID" …`
  (still both a `<reason>` and a `[recommendation]`, still the source node not the
  hold). The `escalation-recommend.md` reference becomes
  `$PROJECT_ROOT/.claude/skills/dispatch-propagate/escalation-recommend.md`.
- Step 8: `"$PROJECT_ROOT/packages/intentionsutil/scripts/resolve-hold" "$SOURCE_ID"`;
  non-zero stays a hard stop.
- Step 9: `"$PROJECT_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete"
  --phase fix-conflicts` and
  `"$PROJECT_ROOT/packages/intentionsutil/scripts/mark-node-terminal" "$SOURCE_ID"
  conflict-resolved`. Both write under `$CLAUDE_JOB_DIR` and are cwd-independent —
  only their *resolution* path changes. **Fix the stale premise in lines 1020-1022**:
  "spawns the Lane 3 session with `--name "$SOURCE_ID"` **under the node's own
  worktree**" → the session is a node worker by **name**, wherever it is spawned.
  Leave the rest of that paragraph (the HOLD/unselectable/slot-consumption
  consequence) verbatim — it is the recorded failure this whole tactic exists to
  prevent.
- Step 10: `hold-node` and `mark-node-terminal` likewise; `git -C "$WT" merge --abort`
  and `git -C "$WT" reset --hard HEAD~1` (`dangerouslyDisableSandbox: true`).

**Terminal-marker rule (add once, in Step 1).** State that **every** way Lane 3 can
stop — including the new loud-stop paths added in this unit (missing `$WT`, the
no-ARGUMENTS-from-primary-checkout guard) — must first write
`"$PROJECT_ROOT/packages/intentionsutil/scripts/mark-node-terminal" "$SOURCE_ID"
conflict-hold` when `SOURCE_ID` is known. `mark-node-terminal` is a silent no-op
unless this job's `state.json` `.name` equals `$SOURCE_ID`
(`mark-node-terminal:81-102`), so the call is always safe. An undeclared stop is the
2026-07-30 deadlock verbatim.

### 3b. New doctrine-ratchet test

Add `.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`,
modeled on `test-fix-checks-cas-guard.sh:1-40` and
`test-dispatch-chain-worktree-ratchet.sh` (prose/fenced-block guards over another
skill's `SKILL.md`; both source `dispatch-test-fixture.sh` for `assert_eq` /
`report_results`). It must fail if Lane 3 regresses to implicit-cwd operation. Assert
over the `## Lane 3` section of `.claude/skills/dispatch-conflict/SKILL.md`
(extract from the `## Lane 3 — node-branch git conflict` heading to EOF):

1. The section contains **no** `git rev-parse --show-toplevel` — the subagent's
   worktree root must come from the explicitly resolved `$WT`.
2. Every `git ` invocation inside a fenced block in the section that operates on the
   node's branch (`merge`, `add`, `commit`, `push`, `diff`, `log`, `reset`) carries
   `-C "$WT"`.
3. Both `subagent-contamination-guard` calls in the section pass `"$WT"`.
4. The section states that `assert-worktree-fresh` is run against the **primary
   checkout** and never against `$WT` (assert both the `assert-worktree-fresh
   "$PROJECT_ROOT"` form and a `never` / `$WT` prohibition sentence are present).
5. The `dispatch-run-verification` call runs inside a `cd "$WT"` subshell **and**
   names the script by a `$PROJECT_ROOT`-prefixed path.
6. Every `packages/intentionsutil/scripts/` and
   `.claude/skills/dispatch-propagate/scripts/` invocation in the section is prefixed
   with `$PROJECT_ROOT`.
7. The "Who enters each lane" Lane 3 bullet (lines 82-90) says the tick spawns with
   `--cwd` on the primary checkout — and does **not** say the node's own worktree.

Print a per-assertion PASS/FAIL and exit non-zero on any failure, matching the
existing ratchets' output shape.

### 3c. CI wiring (required — do not skip)

`.github/workflows/unit-tests.yml`. Per the comment at lines **198-206**,
`run-unit-tests.sh`'s `test-*.sh` glob only fires when a changed path matches
`.claude/skills/dispatch-propagate/scripts/*` — so a PR touching **only**
`dispatch-conflict/SKILL.md` would run nothing and merge green. Add the new ratchet to
the unconditional list (alongside the entries at lines 207-228), e.g.:

```yaml
      - name: Run dispatch-conflict Lane 3 cwd doctrine ratchet
        run: .claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh
```

**Out of scope:** Lane 1 and Lane 2 (they keep their in-place cwd contract and their
existing two-argument guard calls), the shared preamble's `origin/main` node read
(already fetch-fresh and cwd-agnostic), `provision-node-worktree`,
`dispatch-self-close`, and `dispatch-stop.sh` (both already name-keyed and
cwd-independent — verified, no change needed).

**Recommended model:** opus.

**Dependencies:** Unit 1 (the spawn contract the prose documents) and Unit 2 (the
guard's explicit worktree-path argument the prose calls).

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:185-200` — the
  strategy-lane spawn block: the exact target shape (`--cwd "$PROJECT_ROOT"`,
  `--name "$id"`, skill enters its own worktree). Copy its shape; do not invent one.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:113` — existing
  `PROJECT_ROOT` variable. Reuse it; no second `resolve_main_worktree` call.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:5-27` —
  `resolve_main_worktree()`, the standard primary-checkout resolver (honors
  `DISPATCH_GRAPH_MAIN_WORKTREE` for tests).
- `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh:1-72` — the
  purpose-built detect-only freshness guard (fetches `origin/main`, exit 1 if behind,
  never merges). Use it; do not hand-roll a `rev-list --count` check.
- `.claude/skills/align-tactics/SKILL.md:103-119` — the existing playbook for
  "entered a worktree by means other than `provision-node-worktree` → assert
  freshness, then freshen by merging `origin/main`". Lane 3's Step 1 follows the same
  sequencing.
- `.claude/skills/implement-unit/SKILL.md:50-68` — the absolute-worktree-path
  constraint for subagents launched from a session whose cwd may differ. Lane 3's Step
  5 already points at it; keep the pointer and fix only the `<WT>` value.
- `.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard` — the
  second line of defense; extended in Unit 2, not replaced.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:532-569` —
  `worktree_has_live_session()`: name-keyed, machine-wide, cwd-independent. The
  occupancy contract that survives the `--cwd` move; no new occupancy logic.
- `.claude/hooks/dispatch-stop.sh:61-63` — discriminator 2 (`JOB_NAME` +
  `intentions/<JOB_NAME>.md` at `_HOOK_ROOT`). Unchanged; confirms the primary
  checkout is a valid spawn cwd.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:1-40` — the
  `--name`/`--cwd`/`<prompt>` contract. Only the `--cwd` value changes; dedup already
  keys on `--name`.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:334-370` — owns
  the only `origin/<id>` + `origin/main` merge into a node worktree. Do **not**
  duplicate it in Lane 3 or in the case-11 branch.
- `.claude/skills/dispatch-propagate/scripts/test-fix-checks-cas-guard.sh:1-40` and
  `test-dispatch-chain-worktree-ratchet.sh` — the doctrine-ratchet pattern for Unit 3b.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` and
  `test-helpers.sh` — shared `assert_eq` / `assert_contains` / `report_results`
  harness for all three units' tests.

## Verification

Auto-runnable:

```verify
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute || exit 1
bash -n .claude/skills/dispatch-propagate/scripts/subagent-contamination-guard || exit 1
bash -n .claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-subagent-contamination-guard.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh
```

Regression sweep — every other consumer of the two changed scripts must still pass
(this PR touches `.claude/skills/dispatch-propagate/scripts/*`, so CI's
`run-unit-tests.sh` runs the whole `test-*.sh` glob anyway):

```verify
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-mark-node-terminal.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh
```

Manual / judgment checks:

- **Confirm the negative assertion actually bites.** Temporarily revert Unit 1's
  one-line `--cwd` change and re-run `test-dispatch-graph-execute.sh`: Case 5 must
  **fail**. If it still passes, the assertion fell into the prefix trap described in
  Unit 1 and must be tightened. Restore the change afterward.
- **Confirm the ratchet actually bites.** Temporarily re-insert
  `git rev-parse --show-toplevel` into Lane 3's Step 5 brief and re-run the new
  ratchet: it must fail. Restore afterward.
- **Read Lane 3 end-to-end as a cold session** and answer: from a cwd that is the
  primary checkout, does every step name the tree it operates on? Any step that is
  ambiguous about which checkout it touches is a defect — the entire failure mode
  being fixed is a session acting on an implicit cwd.
- **Observe in production.** The next real provision exit 11 is the end-to-end test.
  Confirm from the tick logs that the lane spawned with `--cwd` on the primary
  checkout, that the session's `claude agents --json` name is still the node id, and
  that it reached a terminal disposition (`node-terminal` marker written, job reaped,
  node selectable again). The regression signature to watch for is the recorded one:
  a Lane 3 session that stops without a marker and stays live and idle.
- **Landing this PR needs a permission grant.** The whole diff is `.claude/**`; expect
  the commit to be denied in an auto-mode session and route it through the
  office-hours config-grant drain with the branch staged (the self-modification
  doctrine's fallback lane).

