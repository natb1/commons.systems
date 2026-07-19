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
  MAX_PUSH_ATTEMPTS=5 exhausted with zero progress three times on 2026-07-19
  under fleet load. Two facts verified live during finalization, not assumed:
  (1) `gh api repos/natb1/commons.systems/rulesets/12884700 --jq
  '.conditions.ref_name.include'` returns `[\"~DEFAULT_BRANCH\"]` — the ruleset
  targets only `main`, so any other branch in this same repo is automatically
  exempt from all four required checks with zero admin action, which is what
  makes an in-repo dedicated branch (not a separate GitHub repo, not a custom
  refs/graph/* namespace) sufficient. (2) `git log --all --
  '*materialize-spawn*'` confirms `dispatch-materialize-spawn` (a call site the
  original draft's open questions worried about) was deleted in
  tactic-dispatch-legacy-rewire (commits 638f78a5, a8c4898d) before this
  finalization ran — the stale brownfield-duplicate comment referencing it is
  dead and is deleted as part of this plan, not worked around. Supersedes its
  own prior stated sequencing: the retained draft said this tactic 'lands after
  tactic-graph-commit-landing-lock; its completion deletes the lock code' — but
  tactic-graph-commit-landing-lock is still status:raw/phase:null (a design
  sketch, no code ever written), so there is no lock-acquisition code for this
  tactic's graph-commit rewrite to delete, and gating the real greenfield fix
  behind first building a throwaway interim mitigation would be pure waste. This
  tactic proceeds without blocked_by on it; a future pass should prune or park
  tactic-graph-commit-landing-lock now that its premise is superseded (not done
  here — a per-node finalize session doesn't touch sibling tactic nodes)."
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
blocked_by: []
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
exhausted with zero progress three times on 2026-07-19. The interim
mitigation `tactic-graph-commit-landing-lock` would add a CAS-claimed
serialization lock around the critical section — but per this node's
rationale, it is still `status: raw` / `phase: null` (an unimplemented design
sketch), so this tactic proceeds independently rather than waiting on it (see
rationale for the full argument).

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
   shared, long-lived graph worktree. The leading dot keeps it outside the
   node-id branch regex (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`,
   `.claude/hooks/worktree-create.sh`) so no reap/sweep/session-liveness
   tooling that scans `.claude/worktrees/*` for node-id or issue-number
   identities mistakes it for one — confirm this by reading whatever sweep
   logic exists before relying on it silently.

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
  directory (`git show origin/graph-main:<id>.md > ...`), invoke the
  existing `park_write` pointed at that temp directory (it already takes an
  `intentionsDir` argument, so this needs no change to `park_write` itself),
  then land the office_hours-mutated result via the same plumbing steps
  above.
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
  after creating/merging the worktree against `origin/main` (existing logic,
  unchanged), resolve `GRAPH_WT`, refresh it
  (`git -C "$GRAPH_WT" fetch origin graph-main && git -C "$GRAPH_WT" reset
  --hard origin/graph-main` — safe because nothing ever writes into
  `GRAPH_WT`'s working tree directly, only `graph-commit`'s plumbing writes
  objects/refs, so a hard reset to the fetched tip is always correct and
  idempotent under concurrent callers), then
  `[ -e "$WT/intentions" ] || ln -s "$GRAPH_WT" "$WT/intentions"`. This also
  resolves the pre-provision revalidation gate (`check-node-selection.ts
  --dir "$PROJECT_ROOT/intentions"`): once the **project-root worktree
  itself** has the same symlink installed (Unit 8's one-time backfill covers
  it, since the symlink never touches the project-root's own branch/history
  and so never conflicts with its `--ff-only` sync), that gate needs no
  special-casing at all — it just reads through the ordinary symlink like
  every other consumer.
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

## Unit 4 — Repoint ref-qualified readers from `origin/main` to `origin/graph-main`

**Scope.**
- `.claude/skills/dispatch-propagate/scripts/graph-select-target` — retarget
  `git cat-file -e origin/main:intentions` and
  `git archive origin/main intentions | tar -x -C "$SNAPSHOT_DIR"` to
  `origin/graph-main` (dropping the `intentions` archive subpath, since the
  ref's tree root **is** the node-file directory per Unit 1); update its
  header doc describing "the store is read at origin/main ONLY"; update the
  downstream `select-targets.ts --dir "$SNAPSHOT_DIR/intentions"` call to
  `--dir "$SNAPSHOT_DIR"`.
- `packages/intentionsutil/scripts/demote-node-to-implement` — the
  `git log <stamped-sha>..origin/main -- intentions/<id>.md` range: retarget
  the range end to `origin/graph-main` and drop the `intentions/` path
  prefix. Not cosmetic — once `intentions/` is gone from `main`'s tree
  (Unit 8), this call would otherwise silently return nothing rather than
  erroring, quietly dropping provenance notes.
- `packages/intentionsutil/src/schema.ts` — the `StrategyStampValue` and
  soft-freeze stamp-map doc comments describing `sha` as "the `origin/main`
  commit the hash was computed against": reword to `origin/graph-main`. Doc
  comment only — no validator in this file parses or interprets the `sha`
  string's ref origin, so no runtime behavior changes.
- `.claude/skills/align-strategy/SKILL.md` — the doctrinal-consistency-gate
  instruction to read intention docs "at `origin/main`... `git show
  origin/main:intentions/<id>.md`": reword to `origin/graph-main:<id>.md`.
  Leave every other `origin/main` reference in that file alone — they concern
  strategy/tactic code review or unrelated provenance values, not the
  intention-graph read location.
- Delete the stale "Brownfield note" in
  `.claude/skills/dispatch-propagate/scripts/dispatch-provision-from-remote`
  referencing `dispatch-materialize-spawn` as an un-consolidated duplicate
  call site — that file was deleted upstream in `tactic-dispatch-legacy-
  rewire` (commits `638f78a5`, `a8c4898d`) before this finalization ran, so
  there is no remaining duplicate to fix or flag; remove the paragraph
  outright, no replacement TODO.

**Recommended model:** sonnet — every change is a well-specified
find-and-retarget; the one semantically load-bearing change
(`demote-node-to-implement`) is a single-line ref swap already fully
justified above, not a design decision left open.

**Dependencies:** Unit 1.

---

## Unit 5 — Repoint the four history-dependent sensor scripts to the shared graph worktree

**Scope.** Each of these currently shells `git log`/`git show` against
implicit `HEAD` with an `intentions/`-prefixed pathspec, assuming the graph's
history lives in the calling worktree's own ancestry. Because the shared
graph worktree (`GRAPH_WT`, Unit 1/3) has its own single, clean,
un-merged-into-anything history — not a merge-introduced duplicate ancestry —
repointing each script's execution `cwd`/pathspec at `GRAPH_WT` (resolved via
`fs.realpathSync` of the `intentions` symlink) instead of `repoRoot` is a
direct substitution, not a de-duplication fix:

- `packages/intentionsutil/scripts/read-sensors.ts` — `readTacticVelocity`
  and `readLifecyclePhaseHistory` (and their `git show <commit>:<path>`
  calls) take `repoDir` as a parameter; change the caller to resolve
  `graphWorktreeRoot = fs.realpathSync(intentionsDir)` and pass it instead of
  `repoRoot`; drop the `intentions/` prefix from both the `git log` pathspec
  (`tactic-*.md` instead of `intentions/tactic-*.md`) and the `git show`
  target paths.
- `packages/intentionsutil/scripts/ledger-census.ts` — `gitEntryDate(root,
  id)`: pass `graphWorktreeRoot` as `root` (its shallow-clone guard then
  correctly checks the graph worktree's own shallow-ness, not the calling
  worktree's, which is now irrelevant); pathspec `intentions/${id}.md` →
  `${id}.md`.
- `packages/intentionsutil/scripts/trace-decisions.ts` — `scanDecisionTrace`:
  pass `graphWorktreeRoot` as `repoDir`; drop the `intentions/` directory
  pathspec entirely (equivalent to `.`, since the whole worktree is now the
  store).
- `packages/intentionsutil/scripts/graph-digest.ts` — `deletedNodeIds()`:
  retarget the `git -C repoRoot log` call to `graphWorktreeRoot`; drop the
  `intentions/` pathspec; simplify the deleted-path-matching regex from
  `/^intentions\/(.+)\.md$/` to `/^(.+)\.md$/`.
- Preserve every function's "total sensor, never throws" contract exactly —
  only the `cwd`/pathspec arguments feeding the existing `try/catch`-wrapped
  `execFileSync` calls change.
- Confirm during implementation that the shared graph worktree's root
  contains only `<id>.md` node files (per `write-node.ts`'s
  `join(dir, \`${id}.md\`)`), so the simplified regex in `graph-digest.ts`
  cannot start matching unrelated paths.

**Recommended model:** opus — cross-cutting across four files with subtly
different signatures, each requiring careful preservation of the
never-throws and shallow-checkout-safety contracts while relocating both the
execution `cwd` and the pathspec shape simultaneously; a careless
find-replace risks silently breaking the total-sensor guarantee.

**Dependencies:** Units 1, 3 (needs the `intentions` symlink installed and
resolvable via `fs.realpathSync`).

---

## Unit 6 — CI cleanup

**Scope.**
- Delete `.github/workflows/graph-fast-path.yml` entirely. No slimmed-down
  replacement job: Unit 2 already adds a mandatory client-side
  `validate-graph.ts` gate before every push, and `graph-main` requires no
  status checks by design (confirmed via the live ruleset query in Context)
  — a CI job here would add ongoing Actions minutes for zero required-check
  value.
- `.github/workflows/unit-tests.yml` — remove the `'graph/**'` branch
  exclusion (dead pattern once `graph-commit` no longer creates scratch
  branches under that glob) and add `graph-main` (a real, ongoing need —
  running the full app suite on every intentions/-only push is pure waste).
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
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — add
  coverage asserting each of Unit 3's four provisioning entrypoints creates
  the `intentions` symlink pointed at the resolved `GRAPH_WT`, is a no-op
  when the symlink already exists, and that `assert-worktree-fresh` fails
  when `GRAPH_WT` is behind `origin/graph-main`.

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

- `packages/intentionsutil/src/store.ts`'s `readNode`/`writeNode`/`listNodes`
  — already take `dir` as an explicit argument; zero changes needed for the
  ~17 TS CLI scripts that merely do file I/O against
  `join(repoRoot, "intentions")`, since the symlink resolves transparently.
- `.claude/hooks/worktree-create.sh`'s existing `PROJECT_ROOT` lookup
  precedent — the exact pattern Unit 3's `GRAPH_WT` resolution mirrors.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target`'s existing
  `git archive <ref> intentions | tar -x` snapshot idiom — reused by Unit
  2's pre-push `validate-graph.ts` materialization step.
- `packages/intentionsutil/scripts/select-targets.ts`'s existing `--dir`
  override flag — reused unchanged by Unit 4's `graph-select-target` caller
  change.
- `packages/intentionsutil/scripts/park-node` — needs **no changes**; its
  existing `INTENTIONS_DIR`/`graph-commit` composition already works
  unchanged once Units 2-3 land.
- `packages/intentionsutil/scripts/test-graph-commit.sh`'s existing
  bare-origin-plus-clones scaffold — extended, not replaced, in Unit 7.

## Verification

```verify
# Unit 1 precondition — the ruleset scope this whole design depends on.
gh api repos/natb1/commons.systems/rulesets/12884700 --jq '.conditions.ref_name.include' | grep -qx '\["~DEFAULT_BRANCH"\]' \
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
# Units 2, 7 — end to end: rewritten graph-commit harness and dispatch-scripts
# suite both green.
bash packages/intentionsutil/scripts/test-graph-commit.sh
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
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
