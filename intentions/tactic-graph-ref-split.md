---
id: tactic-graph-ref-split
kind: tactic
statement: "Greenfield: the intention graph lands on a dedicated graph-main
  branch validated by the write path alone (no CI stamp) — graph-commit becomes
  plumbing-based CAS push against origin/graph-main, replacing the
  CI-stamp/scratch-branch mechanic and the busy-main exhaustion it causes"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-18 by an /align-tactics per-node pass
  (Explore/Plan fan-out: 2 Explore agents mapped every graph-tooling and
  worktree-provisioning touchpoint; 2 independent Plan agents produced distinct
  framings — a same-repo branch+local-merge design and a same-repo
  dedicated-worktree+symlink design — synthesized here into a combined design
  taking the symlink approach's simpler read-side materialization and the
  plumbing-based write path's immunity to cross-session checkout races). Root
  cause (unchanged from the retained draft): intention nodes shared main with
  application code, so graph-only commits inherited code-grade branch protection
  (four checks green on the exact SHA) and contended with every code merge;
  MAX_PUSH_ATTEMPTS=5 exhausted with zero progress three times under fleet load
  (recorded 2026-07-19 in strategy clarification 80). Two facts verified live
  during finalization, not assumed: (1) `gh api
  repos/natb1/commons.systems/rulesets/12884700 --jq
  '.conditions.ref_name.include'` returns `[\"~DEFAULT_BRANCH\"]` — the ruleset
  targets only `main`, so any other branch in this same repo is automatically
  exempt from all four required checks with zero admin action, which is what
  makes an in-repo dedicated branch (not a separate GitHub repo, not a custom
  refs/graph/* namespace) sufficient. (2) `git log --all --
  '*materialize-spawn*'` confirms `dispatch-materialize-spawn` (a call site the
  original draft's open questions worried about) was deleted in
  tactic-dispatch-legacy-rewire (commits 638f78a5, a8c4898d) before this
  finalization ran — the stale brownfield-duplicate comment referencing it is
  dead and is deleted as part of this plan, not worked around. Correction from
  an opus validation pass run immediately after initial landing: this node
  originally asserted tactic-graph-commit-landing-lock was status:raw/phase:null
  and set blocked_by to [] on that basis. That was true when first checked but
  went stale — a concurrent session finalized tactic-graph-commit-landing-lock
  to status:codified/phase:implement (also dated 2026-07-18) with a full plan
  that adds a CAS-claimed lock ref (refs/graph/landing-lock) into graph-commit's
  existing try_land(), before this node's graph-commit was landed. Since
  landing-lock is now dispatch-eligible and its plan targets the CURRENT
  graph-commit (still on main with the CI-stamp mechanic), this tactic now
  carries blocked_by: [tactic-graph-commit-landing-lock] so landing-lock's plan
  executes against a stable target first; Unit 2's rewrite (which replaces
  try_land() wholesale) additionally deletes landing-lock's
  refs/graph/landing-lock CAS-lock acquisition/release code as part of that
  replacement — see Unit 2's updated scope. This reverses the prior 'proceeds
  independently' framing, which was reasoned soundly from stale information, not
  a research gap."
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
execution: null
validates: []
blocked_by:
  - tactic-align-entrypoint-consolidation
  - tactic-align-tactics-tactic-mode-drift-gate
  - tactic-attention-surface-instrument
  - tactic-census-scripted-tick
  - tactic-claim-dedup-only
  - tactic-clarification-citation-ids
  - tactic-delegation-classification-derivation
  - tactic-demo-saas-acceptance
  - tactic-dependency-justification-audit
  - tactic-dispatch-test-monolith-split
  - tactic-explicit-node-reservation-sweep-policy
  - tactic-first-sensor-pass
  - tactic-flake-fingerprint-stability
  - tactic-frozen-session-debug-count
  - tactic-gap-derive-on-read
  - tactic-graph-commit-delete-vs-edit-park-hardening
  - tactic-graph-review-exclusion-stall-recovery
  - tactic-graph-router-conflict-routing
  - tactic-graph-select-target-node-tests
  - tactic-graph-tick-node-lane-auto-merge
  - tactic-legacy-office-hours-entry-removal
  - tactic-main-red-sync-completion-test
  - tactic-manual-path-reservation-sweep
  - tactic-mount-schema
  - tactic-nix-clean-system-drill
  - tactic-node-ancestry-context
  - tactic-office-hours-drain-claim
  - tactic-office-hours-graph-read-cwd-whitespace
  - tactic-office-hours-select-fresh-main
  - tactic-office-hours-session-type
  - tactic-omit-default-serialization
  - tactic-phase-evidence-fingerprint-bound
  - tactic-preview-deploy-on-demand
  - tactic-realignment-coverage-sensor
  - tactic-schema-drift-guard
  - tactic-scope-fingerprint-plan-substance
  - tactic-transition-node-stamp-landed-body
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Greenfield: the intention graph lands on a dedicated `graph-main` branch, validated by the write path alone

## Context

`packages/intentionsutil/scripts/graph-commit` lands every `intentions/*.md`
edit on `main`. Because `intentions/` shares git history with application
code, every graph-only commit inherits `main`'s branch-protection ruleset:
four required status checks (`acceptance`, `preview-and-smoke`, `lint`,
`unit-tests`) must be green on the exact SHA before push is accepted.
`graph-commit` satisfies this today via a throwaway `graph/**` scratch branch
that triggers `.github/workflows/graph-fast-path.yml` (a CI fast path
stamping those four checks in ~30-60s), then fast-forwards onto `main`. Under
fleet load, `MAX_PUSH_ATTEMPTS=5` (the commit→rebase→stamp→push retry loop)
exhausted with zero progress three times (recorded 2026-07-19 in strategy
clarification 80). `tactic-graph-commit-landing-lock` is a **separate,
already-finalized** tactic (`phase: implement`) that adds an interim
CAS-claimed serialization lock (`refs/graph/landing-lock`) into the
*current* `graph-commit`'s `try_land()`, targeting the CI-stamp mechanic this
tactic replaces. This tactic is `blocked_by: [tactic-graph-commit-landing-lock]`
so that plan lands against a stable target first; Unit 2 below additionally
deletes the lock-acquisition/release code it introduces as part of replacing
`try_land()` wholesale (see rationale for the correction history — this
tactic originally shipped without that dependency, based on a stale read of
landing-lock's status).

**Design: `intentions/*.md` moves onto its own persistent branch,
`graph-main`, in the same repo.** Verified live via `gh api
repos/natb1/commons.systems/rulesets/12884700 --jq
'.conditions.ref_name.include'` → `["~DEFAULT_BRANCH"]`: the ruleset targets
only `main`, so `graph-main` is automatically exempt from all four required
checks — no GitHub admin action needed for correctness. Every worktree that
needs `intentions/` gets it via a **symlink** to one shared, long-lived
worktree checked out from `graph-main` (not a local merge into each
worktree's own branch — that alternative was evaluated and rejected because
it forces the `main`-checkout project-root worktree, which
`.claude/rules/sandbox.md`'s canonical case keeps strictly `--ff-only`
against `origin/main`, into an unresolvable conflict with also carrying a
`graph-main` merge commit). `graph-commit` itself writes via **git plumbing**
directly against the calling worktree's own `.git` (which shares the same
bare object database as every other worktree — confirmed via `cat .git` →
`gitdir: .../.bare/worktrees/<name>`) rather than by checking out or mutating
any worktree's working tree — this is what makes the shared graph worktree
safe to refresh concurrently from many sessions (a `git reset --hard
origin/graph-main` is idempotent and never races against a plumbing-only
writer).

History migrates with `git subtree split` (not a fresh start), because four
sensor scripts depend on walkable git history for velocity/lifecycle/
provenance data that a fresh-start history would permanently lose. `main`
loses `intentions/` in one ordinary cutover PR, sequenced **last**, after
every other unit is deployed and verified — so no worktree ever pulls a
`main` update that has lost `intentions/` before it already has `graph-main`
wired in.

---

## Cutover procedure (READ BEFORE IMPLEMENTING)

This section is not background. It is the operating procedure for the session
that implements this node, and it overrides the normal dispatch workflow.

**This node does not hand off between phases.** Every other tactic runs
`implement` → PR → `qa` → `review` → merge, with a different session picking up
each phase. This one cannot: between the moment `main` loses `intentions/`
(Unit 8) and the moment every worktree has the `intentions` symlink, the graph
tooling that drives the handoff is itself broken. A session that stops halfway
leaves the fleet unable to read its own queue, and the recovery path
(`park-node`, `office-hours-graph`) is part of what is broken. So the
implementing session runs Units 1-8 through to merge in one sitting, or it does
not start.

**Stop and hand control to the human before changing anything.** The first
action of the implementing session is to report that it is about to freeze
dispatch and wait for the human to confirm. Do not fetch, do not branch, do not
edit.

**Freeze lever.** The only lever that holds is the pause sentinel:

```bash
touch ~/.local/share/commons-dispatch/paused
```

`dispatch-tick` checks it at `.claude/skills/dispatch-propagate/scripts/dispatch-tick:266-298`
(`DISPATCH_PAUSE_FLAG`, defaulting to
`${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused`) and exits 0
before it ever reaches `dispatch-select-tick`. Because the check sits ahead of
selection, it also suppresses the pace-exempt / main-broken bypass documented at
`dispatch-tick:48-58` — that bypass lives inside `dispatch-select-tick` and is
never reached. A `dispatch --manual` run deliberately overrides the sentinel, so
nobody may run one during the cutover. Resume by removing the file.

Things that do **not** hold the freeze:

- Stopping the systemd timers. `ensure_heartbeat_units` re-arms them within
  minutes, and the tick comes back with no warning.
- Stopping `dispatch-claude-daemon.service`. Do not touch it — it supervises
  unrelated background sessions, and killing it takes those down with it.

**Drain, do not kill.** With the sentinel in place no new workers spawn, but
live ones keep running. Watch them out:

```bash
claude agents --json   # needs dangerouslyDisableSandbox: true
```

(Sandboxed, this returns `[]` whether or not sessions are live — see
`.claude/rules/sandbox.md`, "claude agents --json". A sandboxed empty result is
not evidence of a drained fleet.) Wait until only the implementing session
remains. Never kill a worker: a killed session leaves a half-written
`intentions/*.md` and, worse, a half-landed `graph-commit`, and the cutover then
starts from a graph nobody can trust.

**Tag a rollback point before anything moves.** Before Unit 1's
`git subtree split`, tag the current `origin/main` tip (e.g.
`git tag graph-cutover-rollback origin/main && git push origin graph-cutover-rollback`).
The cutover deletes `intentions/` from `main`'s tree in Unit 8; without a tag,
recovering the pre-cutover state means archaeology across a
fleet-quiet-but-not-empty history.

**Leave every in-flight worktree resumable.** After Unit 8 merges, each
registered worktree needs both `main`'s new content and the symlink, and the
order is not free:

1. `git -C <wt> merge origin/main` (or `--ff-only` where that is the worktree's
   contract) — **first**.
2. `ln -s "$GRAPH_WT" <wt>/intentions` — **second**.

Symlink-first fails. The merge that removes tracked `intentions/*.md` aborts
with `untracked working tree file would be overwritten` because the symlink now
occupies that path, and the worktree is left mid-merge. Merge first, then
symlink; the `[ -e ... ] ||` guard from Unit 3 keeps a re-run idempotent.

The registered worktree population is larger and messier than
`ls .claude/worktrees/` suggests. At the time this plan was written
`git worktree list --porcelain` reported 54 registrations, of which 15 were
detached-HEAD. Re-count at implementation time. Two facts hold regardless:

- **Detached-HEAD worktrees cannot merge.** They have no upstream branch to
  merge into. Reap them rather than trying to fix them — a detached worktree is
  already outside the dispatch workflow.
- **A `.claude/worktrees/*` directory walk misses registrations outside the
  repo tree.** `/tmp/claude/clear-park-wt` is registered and lives outside it,
  and the project-root worktree (`/home/n8/natb1/commons.systems`) is not under
  `.claude/worktrees/` either. Iterate `git worktree list --porcelain`, which is
  the authoritative registry, never a directory glob.

**Verification must exercise the escalation path.** Green unit suites are not
sufficient evidence that this cutover worked — the suites stub the git layer
that this change moves. Before declaring done, run a real park cycle end to end
on a scratch node: `park-node <scratch-id> "cutover smoke"`, confirm the park
lands on `graph-main`, confirm `office-hours-graph` lists it, then
`clear-park <scratch-id>` and `transition-node` it, and confirm each landed.
If `park-node` cannot park, the fleet has no escalation path and the cutover
must be rolled back, whatever the test suites say.

**Re-verify the break-list before trusting it.** This node carries a large
`blocked_by` set, and its blockers change these exact files. Known collisions:

- `tactic-census-scripted-tick` **deletes**
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census`.
- `tactic-dispatch-test-monolith-split` **deletes or splits** the old
  `.claude/skills/dispatch-propagate/scripts/` test monolith into per-SUT
  files, including `test-provision-node-worktree.sh` and
  `test-assert-worktree-fresh.sh`, which Unit 7 extends.
- `tactic-legacy-office-hours-entry-removal` **rewrites**
  `.claude/hooks/worktree-create.sh`, which Unit 3 edits.

So re-run the audit before touching anything, and treat this plan's file lists
as a starting point rather than a manifest:

```bash
grep -rn "origin/main:intentions\|origin/main intentions\|origin/main -- intentions" \
  --exclude-dir=node_modules --exclude-dir=.git .
grep -rn '\^intentions\\\?/' --exclude-dir=node_modules --exclude-dir=.git .
```

Every hit outside `intentions/*.md` itself (node bodies describing the old
mechanic are prose, not code) belongs in Unit 4a, Unit 4b, or Unit 5. A hit this
plan does not name is a plan gap, not a false positive.

---

## Unit 1 — Subtree-split migration: create `graph-main`, seed the shared graph worktree

**Scope.** From the `main` project-root worktree (not a throwaway clone —
this is a one-time, low-risk-if-verified operation on shared history that
must end up pushed to `origin`, so do it where the push is a simple
`git push origin graph-main`):

1. `git subtree split --prefix=intentions -b graph-main` — walks `main`'s
   full history, elides commits that never touched `intentions/`, and
   produces a new branch whose tree root **is** what used to be
   `intentions/`'s contents (the `intentions/` prefix is stripped by
   `subtree split` — this is accepted, not corrected: every downstream unit
   below treats the shared graph worktree's root as the node-file directory
   directly, with no nested `intentions/` subdirectory inside it).
2. Verify before pushing: `git ls-tree -r --name-only graph-main | grep -c '\.md$'`
   is close to `ls intentions/*.md | wc -l`; `git show graph-main:<some-known-id>.md`
   diffs clean against `git show main:intentions/<some-known-id>.md` for a
   handful of ids spanning old and recent history.
3. `git push origin graph-main`.
4. `git worktree add .claude/worktrees/.graph-store graph-main` — the one
   shared, long-lived graph worktree. The leading dot keeps the *directory
   name* outside the node-id branch regex (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`,
   `.claude/hooks/worktree-create.sh`), so no reap/sweep/session-liveness
   tooling that scans `.claude/worktrees/*` for node-id or issue-number
   directory names mistakes it for one. This does **not** protect the
   *branch* name — `graph-main` itself matches that same node-id-shaped
   regex, so any sweep keyed on branch names rather than directory names
   could still misclassify it. Confirm by reading whatever sweep/reap logic
   actually exists (what it iterates over — tracked identities vs. a blind
   walk, and whether it keys on directory or branch name) before relying on
   either protection silently.

Out of scope: branch-protection configuration on `graph-main` (optional,
non-blocking — see Verification); the cutover PR removing `intentions/` from
`main` (Unit 8).

**Recommended model:** opus — a one-time operation on shared, pushed git
history; getting the verification thorough enough to trust before `git push`
is genuine judgment, not mechanical execution.

---

## Unit 2 — Rewrite `graph-commit`: plumbing-based CAS push against `graph-main`

**Scope.** `packages/intentionsutil/scripts/graph-commit`, a structural
rewrite of the landing mechanism, not a find-and-replace of `main` →
`graph-main`:

- **Delete entirely** (dead once the CI stamp and scratch branch go away):
  the `await_checks` polling function and its `CHECK_POLL_SECONDS`/
  `CHECK_TIMEOUT_SECONDS` globals; the `SCRATCH_BRANCH`/`SCRATCH_PUSHED`
  globals and their cleanup; `ensure_intentions_only_base()` (the
  far-ahead-worktree rebuild hazard this exists for is structurally
  impossible once landing never touches a worktree's checkout); the
  `ORIG_HEAD`/`RESTORE_HEAD` globals and their `cleanup()` restore logic.
  **Also delete** the `refs/graph/landing-lock` CAS-lock acquisition/release
  code that `tactic-graph-commit-landing-lock` adds to `try_land()` — this
  tactic is now `blocked_by` that one (see rationale), so by the time this
  unit runs, that lock code exists in `graph-commit` and must be removed as
  part of replacing `try_land()` wholesale, not left dangling as dead code
  that still tries to claim a lock ref nothing else respects.
- **Keep unchanged**: id validation, `--base`/`--prune` argument parsing,
  `snapshot()` (still the sole surviving copy of a writer's content on the
  fail-closed park path), `park_write`'s existing `readNode`/`writeNode`-via-
  tsx mechanism (only what directory it's pointed at changes, not its
  internals).
- **New landing loop**, bounded at `MAX_PUSH_ATTEMPTS` (env-overridable as
  today via `GRAPH_COMMIT_MAX_ATTEMPTS`; each attempt is now a cheap network
  round-trip, not a 30-180s CI wait, so the existing bound is generous, not
  tight). Per attempt, using a scratch `GIT_INDEX_FILE` against the calling
  worktree's own `.git` (never a working-directory checkout):
  1. `git fetch origin graph-main`.
  2. `git read-tree origin/graph-main` into the scratch index.
  3. Per edited id: `git hash-object -w <file>` then
     `git update-index --add --cacheinfo 100644,<blob>,<id>.md` (no
     `intentions/` prefix — the tree root is the node-file directory
     directly, per Unit 1). Per pruned id:
     `git update-index --force-remove <id>.md`.
  4. `git write-tree`. If the resulting tree SHA equals `origin/graph-main`'s
     current tree SHA, there is nothing to land — success, no push (this
     replaces the old `id_files_dirty`/clean-exit case).
  5. Materialize the candidate tree
     (`git archive <candidate-tree> | tar -x -C <tmp>`, the same idiom
     `graph-select-target` already uses) and run
     `npx tsx packages/intentionsutil/scripts/validate-graph.ts <tmp>` —
     refuse to push on failure, no retry (content-deterministic, mirrors the
     old "concluded check failure" semantics). This is the check that
     replaces `.github/workflows/graph-fast-path.yml`'s guard job.
  6. `git commit-tree <tree> -p <origin/graph-main sha> -m "$MSG"`.
  7. `git push origin <sha>:refs/heads/graph-main` — a plain push, no
     `--force`; git's fast-forward-only ref-update semantics reject it if
     `graph-main` moved since step 1's fetch, which is CAS with no extra
     flag needed. On rejection, loop (refetch, rebuild, retry) — this is the
     busy-retry path. A concurrent edit to the *same* id is naturally caught
     by step 3 rebuilding the index from the freshly fetched tree each
     attempt — the losing writer's own edit simply gets overwritten in its
     local index build by the newly-landed content unless it re-applies its
     own edit on top, which it does each retry, so two writers touching
     *different* ids both land independently (same effective granularity as
     today), while two writers touching the *same* id race normally and the
     loser's content differs from what it started from — detect this via the
     existing `--base`-style blob comparison (compare the id's blob in the
     freshly fetched `origin/graph-main` tree against what the writer
     originally read before editing) and take the existing fail-closed park
     path on mismatch, unchanged in spirit from today's conflict handling.
  8. Exhausting `MAX_PUSH_ATTEMPTS` with only busy-rejections (never a
     content conflict) returns busy-exhausted, same exit code as today.
- **Retarget** `check_base_freshness`: `git fetch origin main` →
  `git fetch origin graph-main`; compare against `FETCH_HEAD:<id>.md` (no
  `intentions/` prefix).
- **Park path rewrite**: on a same-id conflict, materialize
  `origin/graph-main`'s current blobs for the affected ids into a temp
  directory (`git show origin/graph-main:<id>.md > ...`), then invoke the
  existing `park_write` against that temp directory. `park_write` today
  hardcodes the global `$INTENTIONS_DIR` when it calls its embedded tsx
  script — it does **not** already take a directory argument, so this
  requires a small, deliberate change: either add a directory parameter to
  `park_write` and thread the temp directory through, or reassign
  `INTENTIONS_DIR` to the temp directory before the call (and restore it
  after). Either is fine; the point is this is a real, small edit to
  `park_write`, not a zero-change reuse.
- Update the file's header comment to describe the new mechanic.

**Recommended model:** opus — the highest-judgment unit in this plan:
redesigning the landing mechanism as pure git plumbing that never touches a
working-directory checkout, while preserving every documented edge case
(idempotent re-invocation, conflict-vs-busy-main disposition, `--prune`,
`--base`, the fail-closed park guarantee) exactly.

**Dependencies:** Unit 1.

---

## Unit 3 — Worktree provisioning: symlink materialization + shared graph-worktree refresh

**Scope.** A shared idiom, reused verbatim at every site below (mirrors the
existing `PROJECT_ROOT` lookup precedent in
`.claude/hooks/worktree-create.sh`):

```bash
GRAPH_WT=$(git worktree list --porcelain | awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/graph-main$/{if(!f){print wt; f=1}}')
```

- **`.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh`** —
  stays detect-only (per its own header, it never merges or fixes). Add a
  parallel guard: resolve `GRAPH_WT`, `git -C "$GRAPH_WT" fetch origin
  graph-main`, and fail with a clear message if `GRAPH_WT`'s `HEAD` is behind
  `origin/graph-main` — mirroring the existing `origin/main` behind-count
  check exactly.
- **`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`** —
  two separate insertion points, in this order:
  1. **Before** the existing pre-provision revalidation gate
     (`check-node-selection.ts --dir "$PROJECT_ROOT/intentions"`), resolve
     `GRAPH_WT` and refresh it (`git -C "$GRAPH_WT" fetch origin graph-main
     && git -C "$GRAPH_WT" reset --hard origin/graph-main` — safe because
     nothing ever writes into `GRAPH_WT`'s working tree directly, only
     `graph-commit`'s plumbing writes objects/refs, so a hard reset to the
     fetched tip is always correct and idempotent under concurrent callers).
     This ordering matters: the gate reads `$PROJECT_ROOT/intentions`
     (a symlink to `GRAPH_WT` once the project-root worktree itself has the
     symlink installed, per Unit 8's backfill), and today's `main` fast-
     forward sync (`dispatch-select-tick`) does not freshen the graph store
     at all post-cutover — only this refresh does, so it must run before the
     gate reads through the symlink, not after.
  2. **After** creating/merging the worktree against `origin/main` (existing
     logic, unchanged), `[ -e "$WT/intentions" ] || ln -s "$GRAPH_WT"
     "$WT/intentions"` for the new worktree itself (`GRAPH_WT` is already
     resolved and fresh from step 1).
- **`.claude/skills/dispatch-propagate/scripts/dispatch-merge-main`** — after
  its existing `origin/main` fetch+merge block, add the same
  resolve-`GRAPH_WT`-and-refresh-plus-symlink step. Because
  `dispatch-provision-worktree` `exec`s into this script and
  `dispatch-provision-from-remote` in turn `exec`s into
  `dispatch-provision-worktree`, both inherit the fix automatically — no
  code change needed in either of those two files beyond a header-comment
  note.
- **`.claude/hooks/worktree-create.sh`** (the hook behind the native
  `EnterWorktree` tool, wired via `.claude/settings.json`) — for the
  node-lane branch only (new or reused), add the same resolve-refresh-symlink
  step before the `direnv allow`/`direnv exec` calls. On a `GRAPH_WT`
  resolution or refresh failure, fail the hook — its existing
  `WORKTREE_REGISTERED` cleanup trap already rolls back the worktree on any
  non-zero exit.
- Idempotency: every `ln -s` is guarded (`[ -e ... ] ||`) so re-running
  provisioning against an already-symlinked worktree is a no-op.
- Sandbox: this is a plain file write inside an already-allowlisted worktree
  directory (`../../worktrees`) targeting a path also inside that same
  allowlisted container — no `.claude/settings.json` change needed. It still
  needs `dangerouslyDisableSandbox: true` for the same reason the existing
  `origin/main` merges in these scripts already do (per
  `.claude/rules/sandbox.md`'s tree-updating-ops section).

**Recommended model:** sonnet — a fully mechanical clone of one pinned-down
pattern (resolve `GRAPH_WT`, refresh, symlink, guard) across four call sites
whose existing fetch/merge structure already dictates exactly where the new
step slots in.

**Dependencies:** Units 1, 2.

---

## Unit 4a — Retarget the shared `origin/main` CAS recipe wherever it is cloned

**Scope.** Six shell scripts and one skill body carry the *same* recipe, copied
inline rather than shared: `git fetch origin main` → `rev-parse
origin/main:intentions/<id>.md` into a `FRESH_BLOB` (hard error if absent) →
`git show origin/main:intentions/<id>.md > "$INTENTIONS_DIR/<id>.md"` →
readNode/mutate/writeNode → `graph-commit --base "<id>=$FRESH_BLOB"`.
`packages/intentionsutil/scripts/park-node:188-215` is the canonical template —
`intentions/tactic-graph-write-recipes-base-cas.md` names it as such and
deliberately declined to extract a shared helper. **Every clone must be
retargeted together and identically**, because they interlock: they all pin
`--base` against the same ref, and a half-migrated set produces writers pinning
`origin/main` blobs against a `graph-main` tree, which `graph-commit` sees as a
permanent stale-base conflict and parks on.

At every site below the retarget is the same three-part substitution: `fetch
origin main` → `fetch origin graph-main`; `origin/main:intentions/<id>.md` →
`origin/graph-main:<id>.md` (branch changes **and** the `intentions/` prefix
drops, because `graph-main`'s tree root is the node-file directory per Unit 1);
error strings mentioning `origin/main` reworded. Do not change the control flow,
the exit codes, the `MUTATED` gating, or the rollback traps.

- **`packages/intentionsutil/scripts/park-node:188-215`** — the canonical
  template, and the reason this unit exists. `park-node:192` hard-exits 1 with
  "cannot park a node that is not landed" when the blob is absent, and
  `park-node:210` is the refresh. Post-cutover both fail for *every* node,
  because `origin/main` no longer has an `intentions/` tree at all. `park-node`
  is the Stop-hook escalation path: post-cutover, every office-hours escalation
  dies at the exact moment a broken fleet most needs one. Note also
  `park-node:176-207`'s `--base` pin check, which compares `PINNED_BASE` against
  `FRESH_BLOB` and exits 3 on mismatch — the pin's *provenance* moves to
  `graph-main` with it, so any caller capturing a diagnosis-time base (see
  `.claude/skills/ref-diagnosis-time-cas/SKILL.md`) must capture it from
  `origin/graph-main` too, or every drain disposition exits 3.
- **`packages/intentionsutil/scripts/clear-park:123,128`** — the inverse
  operation; same recipe, same two lines, plus the `MUTATED=1` arming between
  them at `clear-park:125`. Retarget both.
- **`packages/intentionsutil/scripts/resolve-park:80,84`** — same recipe;
  its comment at `resolve-park:73-74` cites park-node's fresh-main invariant by
  name, so reword it to match.
- **`packages/intentionsutil/scripts/hold-node:129,133,156,157,158`** — **five**
  sites across two blocks. `hold-node:129,133` refresh the *source* node
  (SOURCE_BLOB, hard error if absent). `hold-node:156-158` refresh the *hold*
  node with the probe **inverted**: absence there is the expected born-fresh
  case and presence is re-entry, so `hold-node:156`'s `rev-parse -q --verify`
  must stay a soft probe and must not be converted to a hard error while
  retargeting. `hold-node:163-167`'s "present locally but not on origin/main"
  branch also needs its ref name and message reworded.
- **`packages/intentionsutil/scripts/demote-node-to-implement:72`** — the
  pre-mutation `FRESH_BLOB` capture; hard-exits 1 when absent. Its header
  comment at `demote-node-to-implement:20` describes the
  `git log <stamped-sha>..origin/main -- intentions/<id>.md` range. **This is
  the stamp-sha coupling**, and it is the one genuinely non-mechanical part of
  this unit. `graph-main` has a history disjoint from `main` (Unit 1's `subtree
  split`), so a range whose start is a `main` sha and whose end is
  `origin/graph-main` excludes nothing and silently returns the node's *entire*
  graph-main history rather than the since-phase-start delta. Retarget the range
  end **and both stamp-write sites that produce the range start, in the same
  change**:
  1. `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`'s
     `ORIGIN_SHA=$(git rev-parse origin/main)` stamp write (see its own comment
     at `provision-node-worktree:102`, which spells the range out).
  2. `.claude/skills/dispatch-propagate/scripts/transition-node`'s
     `refresh_stamp`, which records `git rev-parse origin/main`.
  Landing the read side without the write sites degrades the range invisibly —
  it is best-effort and never errors.
- **`.claude/skills/dispatch-propagate/scripts/transition-node:95,99,157`** —
  three couplings in one file. `transition-node:95` is the `FRESH_BLOB`
  rev-parse, `transition-node:99` the refresh `show`; both follow the canonical
  recipe. `transition-node:157` is a different shape:
  `git archive origin/main intentions | tar -x -C "$SNAP_DIR"`, feeding the
  scope/strategy freshness gates via `compute-freshness.ts` — retarget to
  `git archive origin/graph-main | tar -x -C "$SNAP_DIR"` and **drop the
  `intentions` archive subpath**, then fix whatever downstream path assumes a
  nested `intentions/` inside `$SNAP_DIR`. Left unfixed this yields an empty
  snapshot post-cutover and quietly disables scope-drift gating instead of
  erroring. Plus `refresh_stamp` per the bullet above.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:99,100`** —
  the same recipe with the probe inverted (absence is the expected born-fresh
  case, presence the same-day id-collision race), which its comment at
  `dispatch-graph-census:93-97` explains by reference to park-node. Retarget
  both lines and update the cross-reference. **If `tactic-census-scripted-tick`
  has already deleted this file, skip it** — verify, do not assume either way.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:116`**
  — the per-node `FRESH_BLOB` capture inside a `while read` loop, whose refusal
  is `continue`, not `exit 1`. Retarget the ref only; leave the `continue`.
- **`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:156`** —
  the per-id snapshot rev-parse, a hard error on miss ("no rollback path").
  Retarget the ref.
- **`.claude/skills/fix-checks/SKILL.md:147,151,176,180`** — **two** complete
  copies of the recipe inlined as fenced bash in the skill body (the
  pushed-something arm and the pushed-nothing arm), each with its own
  `fetch origin main` above it. Both must be retargeted. These are instructions
  a session executes verbatim, so a stale copy here breaks the fix-checks node
  lane exactly as a stale copy in a script would — treat them as code, not
  documentation.
- **`packages/intentionsutil/scripts/office-hours-graph:148,176`** — the two
  `git -C "$SCRIPT_DIR" show "origin/main:intentions/${nid}.md"` reads.
  `park_live_on_main` (`office-hours-graph:143-158`) treats a read failure as
  "not a live park" and returns 1, so post-cutover **every** parked node is
  silently filtered out and the office-hours queue reports empty — no error,
  no clue. `node_kind_on_main` (`office-hours-graph:174-186`) hard-errors
  instead, which at least fails loudly. This script is in this unit rather than
  Unit 4b because it is the read half of the escalation path: with `park-node`
  unable to write a park and `office-hours-graph` unable to see one, the human
  loses both ends at once.

Out of scope: `packages/intentionsutil/scripts/graph-commit`'s own landing path
(Unit 2 rewrites it wholesale); the read-only router/reconciler readers and
doc-comment prose (Unit 4b); the git-history sensors (Unit 5).

**Recommended model:** opus. The original plan's "sonnet — well-specified
find-and-retarget" judgment was made against a three-site list that did not
include the escalation path, and it does not survive the corrected list. This
unit now spans eleven files, ~25 call sites, three distinct probe polarities
(hard-error-on-absent, soft-probe-on-absent, `continue`-on-absent) that a
uniform find-and-replace would flatten, one cross-file semantic coupling (the
stamp-sha trio, which is wrong-but-silent if half-landed), and the single code
path the fleet uses to ask a human for help. A mechanical pass over this is how
you get a fleet that cannot escalate.

**Dependencies:** Unit 1.

---

## Unit 4b — Retarget the read-only ref-qualified readers and the stale prose

**Scope.** Everything that reads `intentions/` at a ref but writes nothing, plus
the doc comments that describe the old mechanic.

- **`.claude/skills/dispatch-propagate/scripts/graph-select-target:390,396`** —
  `git cat-file -e origin/main:intentions` (the store-exists probe) and
  `git archive origin/main intentions | tar -x -C "$SNAPSHOT_DIR"` (the
  selection snapshot). Retarget both to `origin/graph-main` and drop the
  `intentions` archive subpath, since the ref's tree root **is** the node-file
  directory per Unit 1. Then update the downstream
  `select-targets.ts --dir "$SNAPSHOT_DIR/intentions"` call to
  `--dir "$SNAPSHOT_DIR"`, and the header doc at `graph-select-target:19`
  describing the snapshot idiom and "the store is read at origin/main ONLY".
  This is the router's only view of the queue: unfixed, the router selects
  nothing forever.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-sweep:258`** — the
  `git show "origin/main:intentions/$node_id.md"` frontmatter read that decides
  whether a node worktree is reapable. Note the failure mode is *safe*: a read
  miss falls through to `unknown-origin-main` / `return 1` and the worktree is
  **not** reaped, so post-cutover the sweep stops reaping rather than reaping
  wrongly. Retarget it anyway — an unreaped fleet fills the disk — but it is not
  a correctness emergency, and it must keep failing closed after the change.
- **`.claude/skills/align-strategy/SKILL.md:298`** — the doctrinal-consistency
  gate's instruction to read intention docs at
  `git show origin/main:intentions/<id>.md`; reword to
  `git show origin/graph-main:<id>.md`. Leave every other `origin/main`
  reference in that file alone — they concern code review or unrelated
  provenance, not the graph read location.
- **`packages/intentionsutil/src/schema.ts:340`** — the `StrategyStampValue` /
  soft-freeze stamp-map doc comment describing `sha` as "the `origin/main`
  commit the hash was computed against", including its worked example
  (`git diff <sha>..origin/main -- intentions/<strategy-id>.md` →
  `git diff <sha>..origin/graph-main -- <strategy-id>.md`, dropping the prefix
  so the example stays internally consistent). Doc comment only — no validator
  in this file parses the `sha` string's ref origin. Leave
  `apply-node-transition.ts --strategy-sha`'s stamped *values* alone: staleness
  compares `.hash`, not `.sha` (`transitions.ts`), so an `origin/main`-sourced
  `sha` stays valid provenance after the cutover. This is a reword, not a value
  migration.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-provision-from-remote`**
  — delete the stale "Brownfield note" referencing `dispatch-materialize-spawn`
  as an un-consolidated duplicate call site. That file was deleted upstream in
  `tactic-dispatch-legacy-rewire` (commits `638f78a5`, `a8c4898d`), so there is
  no duplicate left to flag. Remove the paragraph outright, no replacement TODO.
- **Doc-comment sweep** — stale if left, harmless if skipped:
  `packages/intentionsutil/scripts/dump-node.ts`'s header ("against
  origin/main"), `select-targets.ts`'s header ("origin/main into a temp dir"),
  and `validate-graph.ts`'s header (which references the `graph/**` CI fast path
  Unit 6 deletes). None is functionally load-bearing — `dump-node` hashes
  on-disk content, so `--base` CAS still matches across the branch/path move
  regardless of the comment.

Out of scope: every writer in Unit 4a; the git-history sensors in Unit 5.

**Recommended model:** sonnet. Each change is a single-line ref swap or a prose
reword, with no cross-file coupling and no branching semantics to preserve — the
judgment calls that pushed Unit 4a to opus all landed in Unit 4a. The one risk
here is failure mode rather than difficulty: `graph-select-target` and
`dispatch-sweep` both degrade to "returns nothing, exits 0" when wrong, so a
diff that reads correctly can still be broken. Verification of this unit
therefore may not be diff review — each of those two scripts must be run and
observed to return a non-empty result (see Verification).

**Dependencies:** Unit 1.

---

## Unit 5 — Repoint the history-dependent sensors and the `^intentions/` path regexes

**Scope.** Each site below shells `git log` / `git show` against implicit `HEAD`
with an `intentions/`-prefixed pathspec, or matches git output against a regex
anchored on `^intentions/`. Both assumptions die at once: the graph's history
moves to `graph-main` (never merged into any consuming worktree's branch), and
its paths lose the `intentions/` prefix. The shared graph worktree (`GRAPH_WT`,
Units 1/3) is the new execution root, resolved as
`fs.realpathSync(intentionsDir)`.

(`git subtree split` can preserve merge commits from `main`'s history where
`intentions/` was touched by a merge, so "single linear history" is not
guaranteed. The load-bearing property is only "not merged into a *consuming*
worktree's branch".)

- **`packages/intentionsutil/scripts/read-sensors.ts`** — `readTacticVelocity`
  (`read-sensors.ts:297`) and `readLifecyclePhaseHistory`
  (`read-sensors.ts:477`) take `repoDir` as a parameter; change the caller to
  resolve `graphWorktreeRoot = fs.realpathSync(intentionsDir)` and pass it
  instead of `repoRoot`, and drop the `intentions/` prefix from the `git log`
  pathspecs (`tactic-*.md`, not `intentions/tactic-*.md`) and from the
  `git show <commit>:<path>` targets. **Also fix `read-sensors.ts:580`** —
  `bestPath.replace(/^intentions\//, "")` inside `readLifecyclePhaseHistory`.
  The original plan named this file but not this line. Post-cutover the strip is
  a no-op, `id` keeps a stale shape, and because both functions are
  `try/catch`-wrapped total sensors the result is a wrong string, never an
  error.
- **`packages/intentionsutil/scripts/lib-deleted-node-ids.ts`** — **the original
  plan attributed this regex to `graph-digest.ts`. That is wrong.** The regex
  lives at `lib-deleted-node-ids.ts:72` (`line.match(/^intentions\/(.+)\.md$/)`)
  together with the `git log --diff-filter=D --no-renames --name-only ... --
  intentions/` call at `lib-deleted-node-ids.ts:65-70` and a module-relative
  repo-root resolution at `lib-deleted-node-ids.ts:16-17`.
  `graph-digest.ts` only *imports* it (`graph-digest.ts:26`, called at
  `graph-digest.ts:51`); the header at `graph-digest.ts:36-37` records that the
  function was moved out of that file precisely so `validate-graph.ts` could
  share it.

  This is the highest-consequence item in the unit, and it is not cosmetic.
  `validate-graph.ts:82` calls `deletedNodeIds()` to decide whether a dangling
  prose reference is `pruned` (tolerated) or `missing` (a violation). After
  Unit 8's cutover PR runs `git rm -r intentions/` on `main`, a `git log
  --diff-filter=D -- intentions/` against `main` reports **every node id in the
  repo** as deleted — so every dangling prose reference silently reclassifies as
  `pruned` and the prose gate stops failing. Unit 2 makes that same
  `validate-graph.ts` run the **only** pre-push gate on `graph-main`. Left
  unfixed, this cutover quietly removes the one check standing between a broken
  graph and `origin/graph-main`.

  Fix: resolve the root to the graph worktree rather than the module-relative
  repo root, and drop both the `intentions/` pathspec and the `^intentions\/`
  regex prefix. Reuse the existing `repoRootOverride` parameter
  (`lib-deleted-node-ids.ts:33`) rather than adding a second plumb. Then thread
  the graph root through **both** call sites — `graph-digest.ts:51` and
  `validate-graph.ts:82` — and note that Unit 2 invokes `validate-graph.ts`
  against a *materialized temp directory that is not a git repository at all*,
  so that invocation must pass the shared graph worktree explicitly; deriving it
  from the temp dir cannot work. Update the scratch-repo fixtures in
  `packages/intentionsutil/test/deleted-node-ids.test.ts` (which build
  `intentions/<id>.md` paths and assert on the shallow-clone guard at
  `lib-deleted-node-ids.ts:57-63`) to the new path shape; keep the shallow guard
  and its error text intact — it is a deliberate fail-loud, not a fallback.
- **`packages/intentionsutil/scripts/trace-decisions.ts`** — `scanDecisionTrace`:
  pass `graphWorktreeRoot` as `repoDir`; drop the `intentions/` directory
  pathspec entirely (equivalent to `.`, since the whole worktree is the store).
  **Strip the `^intentions\/` prefix from all four regexes**, verified present
  at `trace-decisions.ts:76` (`STRATEGY_PATH`), `:77`
  (`STRATEGY_OR_VIRTUE_PATH`), `:78` (`NODE_PATH`), and `:94` (`nodeIdFromPath`).
  Any one left anchored matches nothing and `scanDecisionTrace` returns zero
  events instead of erroring.
- **`packages/intentionsutil/scripts/ledger-census.ts`** — `gitEntryDate(root,
  id)`: pass `graphWorktreeRoot` as `root`, so its shallow-clone guard checks
  the graph worktree's shallowness rather than the (now irrelevant) calling
  worktree's; pathspec `intentions/${id}.md` → `${id}.md`.
- **`packages/intentionsutil/scripts/graph-commit:502`** — the
  `grep -v '^intentions/'` guard. **Do not edit this line.** It sits inside
  `ensure_intentions_only_base()` (`graph-commit:496-514`), which Unit 2 deletes
  wholesale. Confirm the function is gone after Unit 2 lands; if Unit 2's
  deletion was descoped for any reason, this guard becomes live and inverts —
  post-cutover it would treat every changed path as a non-intentions change and
  trigger a pointless rebuild on every call.
- Preserve each function's existing error-handling contract exactly. The
  contracts differ per file, so "never throws" is not a blanket property:
  `read-sensors.ts`'s two functions are `try/catch`-wrapped total sensors;
  `ledger-census.ts`'s `gitEntryDate` throws by design on a shallow checkout;
  `trace-decisions.ts`'s `scanDecisionTrace` throws by design (an operator-run
  digest, not a total sensor, per its own docstring);
  `lib-deleted-node-ids.ts` throws by design on a shallow clone. Only the
  `cwd`/pathspec/regex arguments change — do not add or remove try/catch.
- Confirm during implementation that the shared graph worktree's root contains
  only `<id>.md` node files (per `write-node.ts`'s ``join(dir, `${id}.md`)``),
  so the simplified regexes cannot start matching unrelated paths.

**Recommended model:** opus — unchanged from the original judgment, and
reinforced by the corrected list. Five files with different signatures and four
different error contracts, one mis-attribution that would have sent a mechanical
implementer to the wrong file, and one site (`lib-deleted-node-ids.ts`) whose
failure silently disables the gate Unit 2 depends on. Every failure mode here is
a wrong answer rather than an exception.

**Dependencies:** Units 1, 3 (needs the `intentions` symlink installed and
resolvable via `fs.realpathSync`). `graph-commit:502`'s confirmation step also
needs Unit 2.

---

## Unit 6 — CI cleanup

**Scope.**
- Delete `.github/workflows/graph-fast-path.yml` entirely. No slimmed-down
  replacement job: Unit 2 already adds a mandatory client-side
  `validate-graph.ts` gate before every push, and `graph-main` requires no
  status checks by design (confirmed via the live ruleset query in Context)
  — a CI job here would add ongoing Actions minutes for zero required-check
  value.
- `.github/workflows/unit-tests.yml` — its trigger is `branches-ignore`, so
  this is an ignore-list edit, not a run-list edit: remove `'graph/**'` from
  the ignore list (dead pattern once `graph-commit` no longer creates
  scratch branches under that glob) and add `graph-main` to the *same*
  ignore list (a real, ongoing need — running the full app suite on every
  intentions/-only push is pure waste). `graph-main` is excluded from this
  workflow's triggers, not included.
- `packages/intentionsutil/SEPARABILITY.md` (Gap 3) — append a one-line note
  that this change helps the documented portability gap: dropping the
  `gh`/CI/branch-protection coupling from `graph-commit`'s landing path
  removes the sharpest piece of that gap's blocker. Documentation only, not
  a further unit of work.

**Recommended model:** sonnet — a deletion, a two-token config edit, and a
one-paragraph doc note; the underlying decision (delete, not slim down) is
already stated and justified above.

**Dependencies:** Unit 2 (the client-side `validate-graph.ts` gate must exist
before the CI guard job is safe to delete).

---

## Unit 7 — Test harness updates

**Scope.**
- `packages/intentionsutil/scripts/test-graph-commit.sh` — delete the cases
  exercising the `gh` check-run-poll shim (concluded-check-failure,
  gh-hard-failure, pending-timeout) and the far-ahead-worktree rebuild cases
  (moot by construction once landing never touches a worktree's checkout).
  Retarget every remaining case's assertions from `main`'s tree/log to
  `graph-main`'s, seeding the harness's scratch origin with a `graph-main`
  branch directly (no need to replicate Unit 1's real historical migration —
  just a `graph-main` ref with a node-file tree to land onto). Add a case
  asserting the new `validate-graph.ts` pre-push gate refuses to push invalid
  content with no retry.
- `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`
  and `.claude/skills/dispatch-propagate/scripts/test-assert-worktree-fresh.sh`
  — add coverage asserting each of Unit 3's four provisioning entrypoints
  creates the `intentions` symlink pointed at the resolved `GRAPH_WT`, is a
  no-op when the symlink already exists, and that `assert-worktree-fresh`
  fails when `GRAPH_WT` is behind `origin/graph-main`.

**Recommended model:** sonnet — every change is directly dictated by Units
2-3's now-fully-specified contracts; no open design decisions remain.

**Dependencies:** Units 2, 3.

---

## Unit 8 — One-time backfill sweep + cutover PR

**Scope.**
- **Backfill sweep** (a one-time throwaway script, not part of the permanent
  tooling surface): iterate `git worktree list --porcelain` across every
  registered worktree — including the **project-root worktree itself** (the
  one with `main` checked out) — and for each, if `intentions` is missing or
  not a symlink, create it pointed at `GRAPH_WT` (Unit 3's idiom). Confirm no
  existing sweep/reap logic (e.g. any `lib-worktree-reap.sh`-style tooling)
  treats `.claude/worktrees/.graph-store` as an orphan to reap — inspect what
  it actually iterates over (tracked node-id/issue identities, not a blind
  directory walk) rather than assuming.
- **Cutover PR** on `main`: `git rm -r intentions/`, add `/intentions` to
  `.gitignore` (so the symlink every worktree now has never shows as
  untracked in `git status`). An ordinary PR through the normal review/CI
  process — not a `graph-commit` write, not special-cased.
- **Sequencing: this unit lands last**, after Units 1-7 are merged and
  verified — by this point `graph-main` exists with full history,
  `graph-commit` already lands there, every provisioning entrypoint already
  symlinks `intentions`, every ref-qualified reader and sensor already points
  at `graph-main`, and CI cleanup is already done — so there is no window
  where a worktree pulls a `main` update that has lost `intentions/` before
  it already has the symlink.

**Recommended model:** sonnet — mechanical PR content and a narrow,
well-specified sweep script; the risky judgment (sequencing, ruleset-scope
confirmation, the symlink-vs-merge design choice) was already resolved
earlier in this plan and doesn't need re-litigating here.

**Dependencies:** Units 1-7.

---

## Reuse

- `packages/intentionsutil/src/store.ts`'s `readNode`/`writeNode`/`listNodes` —
  already take `dir` as an explicit argument; zero changes needed for the ~17 TS
  CLI scripts that merely do file I/O against `join(repoRoot, "intentions")`,
  since the symlink resolves transparently.
- `packages/intentionsutil/scripts/park-node:188-215` — the canonical
  fetch → `rev-parse` FRESH_BLOB → `show` → mutate → `graph-commit --base` CAS
  recipe, named as canonical by
  `intentions/tactic-graph-write-recipes-base-cas.md`. **It is reused as the
  template shape for its five siblings in Unit 4a, not as unchanged code — the
  script itself is retargeted there.** (An earlier revision of this plan claimed
  `park-node` "needs no changes"; that was wrong. `park-node:192` hard-exits 1
  when `origin/main:intentions/<id>.md` is absent, which post-cutover is always,
  and `park-node` is the Stop-hook escalation path.) Do not extract a shared
  helper while retargeting — none exists today, and that refactor is larger than
  this tactic.
- `office-hours-graph:143-158`'s `park_live_on_main` awk frontmatter-scoping
  idiom, mirrored by `dispatch-sweep:258-266` — reused as-is by Unit 4a/4b;
  only the ref inside each changes, not the frontmatter parsing.
- `packages/intentionsutil/scripts/lib-deleted-node-ids.ts:33`'s existing
  `repoRootOverride` parameter — reused by Unit 5 to point the deleted-id walk
  at the graph worktree, instead of adding a new plumb.
- `.claude/hooks/worktree-create.sh`'s existing `PROJECT_ROOT` lookup precedent
  — the exact pattern Unit 3's `GRAPH_WT` resolution mirrors. (Confirm it still
  exists: `tactic-legacy-office-hours-entry-removal` rewrites this file.)
- `.claude/skills/dispatch-propagate/scripts/graph-select-target`'s existing
  `git archive <ref> intentions | tar -x` snapshot idiom — reused by Unit 2's
  pre-push `validate-graph.ts` materialization step, and shared with
  `transition-node:157`.
- `packages/intentionsutil/scripts/select-targets.ts`'s existing `--dir`
  override flag — reused unchanged by Unit 4b's `graph-select-target` caller
  change.
- `packages/intentionsutil/scripts/test-graph-commit.sh`'s existing
  bare-origin-plus-clones scaffold — extended, not replaced, in Unit 7.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:266-298`'s pause
  sentinel — reused as the cutover freeze lever; no code change.

## Verification

```verify
# Unit 1 precondition — the ruleset scope this whole design depends on.
# Use -c (compact, one line) so this doesn't false-fail on gh --jq's
# multi-line pretty-printed array output.
gh api repos/natb1/commons.systems/rulesets/12884700 --jq '.conditions.ref_name.include' | jq -c . | grep -qx '\["~DEFAULT_BRANCH"\]' \
  || { echo "FAIL: ruleset targets more than ~DEFAULT_BRANCH — re-derive the plan before proceeding"; exit 1; }
```

```verify
# Unit 1 — subtree-split produced a non-empty, history-bearing graph-main and
# the shared graph worktree resolves to it.
git rev-parse --verify graph-main
git -C .claude/worktrees/.graph-store rev-parse --abbrev-ref HEAD | grep -qx graph-main
test "$(git -C .claude/worktrees/.graph-store log --oneline | wc -l)" -gt 1
```

```verify
# Units 2, 7 — end to end: rewritten graph-commit harness and provisioning
# test suites both green.
bash packages/intentionsutil/scripts/test-graph-commit.sh
bash .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
bash .claude/skills/dispatch-propagate/scripts/test-assert-worktree-fresh.sh
```

```verify
# Unit 3 — a freshly provisioned worktree gets a working intentions/ symlink
# pointed at the resolved graph worktree.
GRAPH_WT=$(git worktree list --porcelain | awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/graph-main$/{if(!f){print wt; f=1}}')
test -L .claude/worktrees/<freshly-provisioned-node-id>/intentions
test "$(readlink -f .claude/worktrees/<freshly-provisioned-node-id>/intentions)" = "$(readlink -f "$GRAPH_WT")"
```

```verify
# Units 4, 6 — package-level typecheck and unit suite pass with the
# doc-comment-only and CI-config changes in place.
cd packages/intentionsutil && npx tsc --noEmit && npm test
```

```verify
# Unit 5 — sensors resolve against the shared graph worktree with no thrown
# errors (manual: eyeball non-"unknown" output for known tactic ids).
npx tsx -e "
  import { readTacticVelocity } from './packages/intentionsutil/scripts/read-sensors.ts';
  console.log(readTacticVelocity(process.cwd()));
"
```

Manual/judgment verification (not auto-runnable):

- After Unit 2 lands, deliberately race two `write-node.ts` writers against
  the same node id and confirm `graph-commit` still exercises the conflict-
  park path correctly (office_hours set, content preserved) under the new
  plumbing mechanic — the highest-risk correctness surface in this plan.
- After Unit 8's sweep runs, spot-check several long-lived pre-existing
  worktrees (from `git worktree list`) to confirm `intentions/` resolved to
  a working symlink and no session sees `intentions/` as missing, including
  the project-root worktree itself.
- Confirm no existing sweep/reap logic treats `.claude/worktrees/.graph-store`
  as reapable, by reading what it actually iterates over rather than
  assuming.
- Observe in production over 1-2 weeks post-cutover that `graph-commit`'s
  retry-exhaustion failure mode (the original trigger for this tactic) no
  longer recurs under fleet load.
- Optional, non-blocking hardening: recommend the repo admin enable
  "restrict force pushes" on `graph-main` via GitHub's branch-protection UI
  for defense-in-depth against an accidental force-push clobbering history.
  Unlike the precedent at `intentions/tactic-preview-smoke-ruleset-gate.md`
  (a hard blocking prerequisite, because it required deleting a required
  check that would otherwise be permanently unsatisfiable), this tactic
  deliberately requires zero status checks on `graph-main`, so there is no
  such hazard and this step must never gate the rest of the plan.

These supplement the existing `## Verification` blocks; they do not replace
them.

```verify
# Units 4a, 4b, 5 — no ref-qualified read of the graph at origin/main survives
# outside node bodies (which describe the old mechanic as prose, not code).
# git grep, not `grep -r .`: grep exits 2 on the sandbox's unreadable phantom
# entries EVEN WHEN it also matched, and `!` maps 2 -> 0, so the negated form
# passed unconditionally. git grep walks tracked files only (so the
# node_modules/.git excludes are unnecessary) and rc>1 is a hard failure here.
hits=$(LC_ALL=C git grep -an \
  -e 'origin/main:intentions' \
  -e 'origin/main intentions' \
  -e 'origin/main -- intentions' \
  -- . ':(exclude)intentions'); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: ref-qualified origin/main graph reads remain"; exit 1; }
echo OK
```

```verify
# Unit 5 — no ^intentions/ path anchor survives outside node bodies.
# git grep, not `grep -r .`: see the exit-2 note on the sibling fence above.
# ERE '\^intentions\\?/' is the exact equivalent of the original BRE
# '\^intentions\\\?/': a literal ^, then "intentions", then an OPTIONAL literal
# backslash, then /.
hits=$(LC_ALL=C git grep -anE '\^intentions\\?/' -- . ':(exclude)intentions'); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: ^intentions/ path anchors remain"; exit 1; }
echo OK
```

```verify
# Unit 4b — the router's queue view is non-empty, not merely non-erroring.
# A silently empty selection exits 0 and looks identical to a drained queue.
.claude/skills/dispatch-propagate/scripts/graph-select-target --dry-run 2>&1 | tee /dev/stderr | grep -q .
```

```verify
# Unit 5 — deletedNodeIds resolves against the graph worktree and returns a
# plausible count, not the every-node-deleted result a main-rooted walk gives
# after the cutover PR.
npx tsx -e "
  import { deletedNodeIds } from './packages/intentionsutil/scripts/lib-deleted-node-ids.js';
  const ids = deletedNodeIds();
  if (ids.length === 0) { console.error('FAIL: empty deleted-id set'); process.exit(1); }
  console.log('deleted ids:', ids.length);
"
```

Manual verification, mandatory — green suites are not sufficient evidence for
this node:

- **Escalation-path smoke test on a scratch node**, per the Cutover procedure:
  `park-node` → confirm the park landed on `graph-main` → `office-hours-graph`
  lists it → `clear-park` → `transition-node`. Every step must land. If
  `park-node` cannot park, roll back.
- Run `dispatch-sweep` in whatever dry-run/report mode it offers and confirm it
  still refuses to reap a parked or active-phase node — it must keep failing
  closed after the retarget, not merely stop erroring.
- Confirm `validate-graph.ts` still *rejects* a deliberately broken prose
  reference after Unit 5's `deletedNodeIds` change. A gate that passes
  everything is the exact failure this unit exists to prevent, and it is
  invisible from a green run.
