---
id: tactic-provision-exit11-worktree-residue
kind: tactic
statement: provision-node-worktree must distinguish an UNUSABLE worktree (dirty
  tracked tree, in-progress rebase/merge, detached HEAD) from a genuine content
  conflict rather than collapsing both into exit 11 — and graph-commit's
  cleanup() must abort a rebase it strands — so the conflict lane is never
  dispatched into a state its own contract says cannot occur
owner: ai
status: codified
parent: null
rationale: "Planned 2026-07-30 by the dispatch-pipeline bootstrap through a
  parallel Workflow fan-out rather than an /align-tactics round, so that skill's
  two-sided drift review and its census were bypassed (deliberate: ten
  concurrent align rounds would mean ten concurrent graph-commits, the exact
  hazard the bootstrap exists to avoid). Each plan was authored against the
  node's own cited code and then independently verified by a second agent; all
  reported citation and substance gaps were applied before landing. A later
  /align-tactics round should treat this body as unreviewed by the normal path."
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
    (50 / 20 / 10) that puts write-path integrity work above ordinary feature
    work. This band holds the silent graph-write-corruption defects plus the two
    paths the bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: qa
execution:
  branch: tactic-provision-exit11-worktree-residue
  pr: 2992
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# provision-node-worktree: separate an unusable worktree from a genuine merge conflict, align to the pushed tip, and prune orphan registrations

## Context

`.claude/skills/dispatch-propagate/scripts/provision-node-worktree` is the graph
lane's one-command worktree provisioning primitive. `dispatch-graph-execute`
calls it once per selected node and routes entirely on its exit code
(`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:195-372`).
Three separate defects in that script all funnel a node into the same wrong lane
— the exit-11 conflict lane — and all three are **steady states** that no number
of retries can clear.

### Defect 1 — three distinct worktree states collapse into exit 11

The merged-tree-guarantee block is at
`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:123-130`
(the node's prose cites `:125-129`; the citation has drifted — the `if` is now at
`:126`, the `merge --abort` at `:127`, the `exit 11` at `:129`):

```bash
if ! git -C "$WT" merge --no-edit origin/main 1>&2; then
  git -C "$WT" merge --abort 1>&2 || true
  echo "provision-node-worktree: origin/main does not merge clean into $NODE_ID" >&2
  exit 11
fi
```

Any non-zero `git merge` becomes "origin/main does not merge clean". But `git
merge` also fails when the tree is dirty or an operation is already in progress,
and in those cases the following `git merge --abort` **also** fails — swallowed
by `|| true`, so the residue survives and the message is a false statement about
the branch.

`.claude/skills/dispatch-conflict/SKILL.md:701-703` (Lane 3, Step 1) documents
the invariant it depends on verbatim:

> Exit 11 leaves the worktree and branch **in place**, with the merge already
> **aborted** and the tree clean

That holds only for a genuine content conflict. Three observed modes:

- **Mode A — dirty tracked tree** (uncommitted graph write left by a session
  whose `graph-commit` never landed). Provision's merge fails rc=1
  ("Your local changes … would be overwritten by merge"); the abort fails rc=128
  ("There is no merge to abort (MERGE_HEAD missing)"); the tree stays modified.
  Lane 3 reproduces the same failure, computes an **empty** conflicted set, and
  falls through Steps 4-7 with nothing to resolve.
- **Mode B — abandoned rebase** (a `graph-commit` killed mid-`git pull
  --rebase`). Provision's merge fails rc=128 ("Merging is not possible because
  you have unmerged files"); abort fails; the tree keeps `UU` paths, HEAD stays
  **detached**, and the `rebase-merge` state dir survives. Lane 3 gets a
  plausible-looking conflicted set (the *rebase's* paths), resolves it, and
  commits **onto a detached HEAD inside a live rebase** — the commit never
  reaches the branch.
- **Mode C — genuine conflict** behaves as documented.

Neither A nor B is transient: nothing a later tick does changes a dirty file or
an abandoned rebase, so the strike ladder in
`dispatch-graph-execute:293-331` burns its cap deterministically and births a
hold whose stated reason ("origin/main has not merged clean … for N consecutive
ticks") is factually wrong — both branches merge clean the instant the residue is
cleared.

### Defect 2 — a stale LOCAL branch shadows the pushed tip

At `provision-node-worktree:108-121`, the remote-branch arm (`:109-111`) is:

```bash
if git -C "$PROJECT_ROOT" ls-remote --heads --exit-code origin "$NODE_ID" >/dev/null 2>&1; then
  git -C "$PROJECT_ROOT" fetch origin "$NODE_ID" 1>&2 \
    && git -C "$PROJECT_ROOT" worktree add "$WT" "$NODE_ID" 1>&2
```

`git fetch origin "$NODE_ID"` updates only `refs/remotes/origin/<id>`. `git
worktree add "$WT" "$NODE_ID"` then resolves `<id>` to the **local** branch when
one exists, so the fetched tip is discarded.

A failed provisioning run manufactures exactly that stale local ref: `git
worktree add` DWIMs the local branch into existence from the remote-tracking ref
*before* the checkout, so a failed checkout leaves the branch frozen at that
moment's tip with no worktree. Every later run silently prefers the frozen ref.

Measured on 2026-07-30: `tactic-mount-schema`'s local ref was created at
2026-07-28 14:09:13 and never moved, while the pushed branch advanced at 14:50:33
— `git rev-list --left-right --count tactic-mount-schema...origin/tactic-mount-schema`
returned `0 1258`. For `tactic-dependency-justification-audit`, `git merge
origin/main` from the stale local ref **conflicts** on
`intentions/strategy-graph-native-dispatch.md` and
`packages/intentionsutil/scripts/read-sensors.ts`; after fast-forwarding to the
pushed tip the same merge is **clean**. So the stale checkout does not merely
hand an agent old code — it **manufactures false exit-11 dispatches**, from a
third direction into the same broken lane.

### Defect 3 — orphan worktree registrations are never pruned

`provision-node-worktree` never runs `git worktree prune`. A registration under
`.git/worktrees/<name>` whose checkout directory is gone stays in `git worktree
list` forever, and git refuses to re-register a path it still believes is taken.
Live as of 2026-07-30 in this repo: `git worktree prune --dry-run -v` reports two
orphans (`worktrees/oh-baseline-monolith`, `worktrees/graph-tx-reap-close`).

### Defect 4 — `graph-commit` strands the rebase that produces Mode B

`packages/intentionsutil/scripts/graph-commit`'s `cleanup()` (`:335`, the EXIT
trap installed at `:1401`) has best-effort backstops for the landing lock, the
scratch branch, and the snapshot dir, but none for an in-progress rebase. The
only `git rebase --abort` is the single explicit site at `:932`, inside
`try_land()`'s layer-2 failure path. Any exit that misses that site — a Claude
tool timeout, a session reap, or an unexpected `die()` between `git pull
--rebase` (`:924`) and the layer-2 handling — strands the rebase in the node's
worktree permanently. This cannot be made complete (a SIGKILL fires no trap at
all), which is why the provision-side guard is the primary defense and this is
secondary.

### Intended outcome

`provision-node-worktree` asserts the precondition it advertises rather than
inferring it from a merge exit code; mechanical residue gets its own exit code
(**14**) and its own disposition (auto-repair where safe, a tracked hold where
not); the local branch is aligned to its own pushed tip before the origin/main
merge; orphan registrations are pruned; and `graph-commit` stops producing the
residue in the first place. The exit-11 conflict lane then only ever receives the
state its own contract describes.

### Notes for the implementer

- **This tactic is self-modifying.** It edits `.claude/skills/**`, which auto-mode
  workers cannot commit (`intentions/strategy-graph-native-dispatch.md:4075-4086`).
  Expect the commit to be denied by the permission classifier; complete all work
  with the branch staged and let the office-hours self-modification drain approve
  it. Do not restructure the change to avoid `.claude/**` — the fix belongs there.
- The node's frontmatter `statement` still describes only the exit-11 /
  unusable-worktree defect. Defects 2 and 3 were added later and the statement was
  deliberately left unedited. Widening it is appropriate but is a frontmatter edit,
  outside these units.
- Out of scope: changing the strike/hold ladder itself
  (`dispatch-graph-execute:249-331`). `tactic-graph-router-conflict-routing` is
  expected to replace that whole branch with an `execution.conflict` interrupt,
  and the branch's own comment says it is "expected to be replaced wholesale at
  that point, not extended". The guard belongs in `provision-node-worktree`,
  which survives that replacement.

---

## Unit 1 — provision-node-worktree: prune, precondition guard (exit 14), verified aborts, pushed-tip alignment

- **Recommended model**: `opus`

**Scope.** All edits in
`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`. The script
runs `set -uo pipefail` (`:48`) — no `-e` — so every step needs its own explicit
check.

1. **Prune orphan registrations.** Insert
   `git -C "$PROJECT_ROOT" worktree prune 1>&2 || true` immediately **before**
   the `if [[ ! -d "$WT" ]]` test at `:108`. It is cheap, idempotent, and only
   touches registrations whose checkout is already gone, so it is safe to run
   unconditionally against a shared repo with a live fleet.

2. **Hoist the remote-branch probe + fetch above the add block.** The add block
   at `:108-121` probes `ls-remote` and fetches only on the fresh-worktree path;
   step 4 below needs `origin/$NODE_ID` on the reused-worktree path too. Compute
   once, before the add block:

   ```bash
   REMOTE_BRANCH=0
   if git -C "$PROJECT_ROOT" ls-remote --heads --exit-code origin "$NODE_ID" >/dev/null 2>&1; then
     REMOTE_BRANCH=1
     if ! git -C "$PROJECT_ROOT" fetch origin "$NODE_ID" 1>&2; then
       echo "provision-node-worktree: git fetch origin $NODE_ID failed" >&2
       exit 2
     fi
   fi
   ```

   Then rewrite the add block's first arm to test `[[ "$REMOTE_BRANCH" -eq 1 ]]`
   and drop its now-redundant inline `ls-remote`/`fetch`. Keep the other two arms
   (`rev-parse --verify` local branch, then `worktree add -b … origin/main`)
   unchanged. A fetch failure is a broken environment — exit 2 with a clear
   error, never a silent fall-through (`.claude/rules/code-style.md`).

3. **Precondition guard on `$WT` — the new exit 14.** Insert a new block after
   the add block (after the current `:121`) and before everything else that
   touches `$WT`. It must run on **both** the fresh and reused paths.

   Resolve the operation-state paths with `git rev-parse --git-path`, never a
   hardcoded `.git/…` — `graph-commit`'s `rebase_in_progress()`
   (`packages/intentionsutil/scripts/graph-commit:559-564`) is the correct
   pattern and the reuse reference. One caveat that pattern does not cover:
   `git -C "$WT" rev-parse --git-path X` prints a path relative to **`$WT`**, not
   to the caller's cwd. For a linked worktree it happens to be absolute (verified
   in this repo: `git -C .claude/worktrees/<name> rev-parse --git-path
   rebase-merge` prints an absolute path), but for a plain repo it is relative and
   a bare `[[ -d ]]` from another cwd would silently miss it. Normalize:

   ```bash
   wt_git_path() {   # $1 = git-path name; prints an absolute path
     local p
     p=$(git -C "$WT" rev-parse --git-path "$1") || return 1
     [[ "$p" == /* ]] || p="$WT/$p"
     printf '%s\n' "$p"
   }
   ```

   Detect, in this order:

   - **In-progress operation**: any of `rebase-merge`, `rebase-apply` (dirs) or
     `MERGE_HEAD`, `CHERRY_PICK_HEAD` (files) present.
   - **Detached HEAD**: `git -C "$WT" symbolic-ref -q HEAD >/dev/null` returns
     non-zero.
   - **Dirty tracked tree**: `git -C "$WT" status --porcelain
     --untracked-files=no` is non-empty. `--untracked-files=no` is load-bearing:
     node worktrees routinely carry build output and untracked files must not trip
     the check.

   Repair policy is **deliberately asymmetric**:

   - *In-progress operation:* **auto-repair**, then re-check. `git -C "$WT"
     rebase --abort` for a rebase state dir, `git -C "$WT" merge --abort` for
     `MERGE_HEAD`, `git -C "$WT" cherry-pick --abort` for `CHERRY_PICK_HEAD`.
     Aborting restores the pre-operation branch tip, reattaches HEAD, and is
     non-destructive with respect to committed work; the residue is by definition
     unattended (the session that created it is gone). Print a one-line stderr
     note naming what was repaired so the tick journal records it. Then re-run
     the full detection.
   - *Detached HEAD with no operation in progress:* do **not** try to repair —
     the commits there may be unreferenced. Exit 14.
   - *Dirty tracked tree:* **never** auto-discard. The uncommitted edit could be
     the sole copy of unlanded work. Exit 14.

   On exit 14, write to stderr: a first line naming the condition, then the raw
   evidence the drain needs —

   ```
   provision-node-worktree: worktree unusable for <id> (<condition>); not a content conflict
   ```

   followed by the output of `git -C "$WT" status --porcelain
   --untracked-files=no` and `git -C "$WT" diff --stat`. `<condition>` is one of
   `dirty-tracked-tree`, `detached-head`, `operation-in-progress`.

4. **Align the local branch to its own pushed tip.** After the guard, before the
   origin/main merge, when `REMOTE_BRANCH=1`:

   ```bash
   if ! git -C "$WT" merge --no-edit "origin/$NODE_ID" 1>&2; then
     if ! git -C "$WT" merge --abort 1>&2; then
       echo "provision-node-worktree: worktree unusable for $NODE_ID (failed-merge-abort); not a content conflict" >&2
       exit 14
     fi
     echo "provision-node-worktree: origin/$NODE_ID does not merge clean into the local $NODE_ID branch" >&2
     exit 11
   fi
   ```

   A **merge**, not a reset, is the deliberate choice. `git worktree add -B
   "$NODE_ID" "origin/$NODE_ID"` is shorter and would fix both observed cases
   (each stale ref was a strict ancestor of the remote tip), but `-B`
   force-moves the local ref and would silently discard genuinely-unpushed local
   commits in the ahead-or-diverged case. The merge is a no-op fast-forward when
   the local ref is behind or equal, preserves a local ref that is ahead, and
   surfaces a true divergence through the existing conflict disposition rather
   than by destroying one side. Placing it after the add block also covers the
   **reused-worktree** path, which the current code never checks at all.

5. **Verify the origin/main abort.** In the existing block at `:126-130`, replace
   `git -C "$WT" merge --abort 1>&2 || true` with a checked abort that exits 14
   (same `failed-merge-abort` message shape as above) when the abort fails. With
   the guard in front this should be unreachable; it is a defensive assertion at
   a system edge, not a fallback — a failed abort means the state was never
   mergeable and must not be reported as a conflict.

6. **Header exit-code table.** Add `14` to the table at `:26-44`, alongside
   10/11/12/13/2, describing it as: *worktree unusable — mechanical residue from
   a dead session (dirty tracked tree, or a detached HEAD / in-progress operation
   that could not be auto-repaired). The tree is left EXACTLY as found; the
   caller routes it to a tracked hold, not to the conflict lane.* Also update the
   step-3 summary at `:13-16` to mention the precondition guard and the
   pushed-tip alignment, and step 2 at `:11-12` to mention the prune.

**Out of scope for this unit.** Any change to `dispatch-graph-execute` (Unit 3),
to `graph-commit` (Unit 4), or to the strike/hold ladder. No new test harness here
(Unit 2).

**Reuse.**
- `packages/intentionsutil/scripts/graph-commit:559-564` — `rebase_in_progress()`,
  the correct `--git-path` idiom to model the detection on.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh` —
  `resolve_main_worktree`, already sourced at `:52`; do not re-implement project-root
  resolution.
- The existing exit-2 error style in the same script (`:76-79`, `:117-120`,
  `:148-151`) for fetch/add failures.

---

## Unit 2 — script-level harness for provision-node-worktree

- **Recommended model**: `sonnet`

**Dependencies.** Unit 1.

**Scope.** A new executable file
`.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`, plus
one registration line in `.github/workflows/unit-tests.yml`.

No `provision-node-worktree` harness exists today. `test-dispatch-scripts.sh`
(33k lines) is a `gh`-stub harness with no git-worktree fixtures and is the wrong
host; every comparable script-level suite in this repo is its own file
(`test-dispatch-graph-execute.sh`, `test-graph-write-rollback.sh`,
`test-park-node.sh`). Follow that pattern. Note the sibling node
`intentions/tactic-provision-worktree-script-tests.md` tracks the *gate*
plumbing (arg forwarding, exit-12/13 pass-through, stamp write) for this same
script; this harness does not have to cover that, but it creates the fixture
scaffolding that tactic can extend, so say so in the file header.

**This is a deliberate deviation from the node's own Verification section**
(`intentions/tactic-provision-exit11-worktree-residue.md:322-330`), which directs
adding the script-level cases to the existing `test-dispatch-scripts.sh`, and
from the sibling node `tactic-provision-worktree-script-tests`, whose frontmatter
`statement` also names `test-dispatch-scripts.sh` as the target file. The
node text further flags that the two tactics "should be sequenced or merged" over
that shared host. The deviation is taken because `test-dispatch-scripts.sh` is a
`gh`-stub harness with no git-worktree fixtures, and forcing worktree fixtures
into it would be worse for both tactics than one purpose-built file. **The
obligation that comes with taking it:** say so explicitly in the new file's
header and in the PR body, and update
`tactic-provision-worktree-script-tests`' statement to name
`test-provision-node-worktree.sh` instead — otherwise the sibling lands a second,
uncoordinated harness location and the "sequenced or merged" instruction is
silently lost. If you would rather not carry that obligation, extend
`test-dispatch-scripts.sh` as the node says; either choice is defensible, but do
not leave the two nodes pointing at different files.

**Harness construction** (model the stub style on
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:39-119`,
and the assertion helpers on `test-helpers.sh`, which that file sources at `:24`
and which provides `assert_eq`, `assert_contains`, `report_results`):

- `mktemp -d`, trap-cleaned. Build a bare origin repo, a `main` checkout at
  `$TMP/main` (this is `PROJECT_ROOT`), and export
  `DISPATCH_GRAPH_MAIN_WORKTREE="$TMP/main"` so `resolve_main_worktree` skips
  `git worktree list`.
- Copy the SUT and `lib-graph-worktree.sh` into a `$TMP/scripts` dir so
  `"$SCRIPT_DIR/<name>"` resolves to sibling stubs.
- Sibling stub `dispatch-ci-ready` exiting 0 (the CI gate is not under test).
- PATH shims for `npx` (the script runs `npx tsx …/check-node-selection.ts` at
  `:90-91` — the shim prints a fixed fingerprint on stdout and exits 0) and for
  `direnv` (`:148-151`, exit 0).
- A `run_prov <id>` helper that runs the SUT with those overrides and captures
  stdout, stderr and rc.

**Cases** (all of these are the node's own verification list):

- clean tree + conflicting content on the branch → exit **11**, and
  `git -C "$WT" status --porcelain --untracked-files=no` is **empty** afterwards.
- dirty tracked file → exit **14**, and the file's content is byte-identical to
  what it was before the run (nothing auto-discarded).
- `rebase-merge` state present → exit **0** after auto-repair, HEAD reattached to
  the branch at its pre-rebase tip, and `git -C "$WT" merge-tree --write-tree
  HEAD origin/main` returns 0.
- detached HEAD with no operation in progress → exit **14**.
- untracked-only files → exit **0** (regression guard on `--untracked-files=no`).
- local branch strictly **behind** `origin/<id>` → provisioned worktree HEAD
  equals the pushed tip, not the stale local ref.
- local branch **ahead** of `origin/<id>` → the local commits survive
  provisioning (the regression guard against `worktree add -B`).
- local branch **diverged** from `origin/<id>` with a conflicting change → exit
  **11**, tree clean afterwards.
- orphan registration: create the worktree, `rm -rf` its directory, leave
  `.git/worktrees/<name>` in place, then provision → the add succeeds because
  `git worktree prune` ran first.

**CI registration.** Add to the `hook-tests` job in
`.github/workflows/unit-tests.yml` (the block at lines 195-235, beside `- name:
Run dispatch-graph-execute tests`):

```yaml
      - name: Run provision-node-worktree tests
        run: .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

**Out of scope.** Changing `test-dispatch-scripts.sh`. Covering the
`check-node-selection` gate plumbing (that is
`tactic-provision-worktree-script-tests`).

**Reuse.**
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh` — `assert_eq`,
  `assert_contains`, `report_results`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:39-119`
  — the sibling-stub + `DISPATCH_GRAPH_MAIN_WORKTREE` harness shape.
- `packages/intentionsutil/scripts/test-graph-commit.sh:131-233,435-466` — the
  bare-origin + clone + PATH-shim fixture shape, if a richer git fixture is
  wanted.

The file is a `.sh` and therefore linted by
`.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` (run from
`run-lint.sh` in CI): never pipe a captured JSON variable through `echo` into
`jq` — use `jq <<<"$VAR"` (`.claude/rules/shell-json.md`).

---

## Unit 3 — route exit 14 to a `worktree-residue` tracked hold

- **Recommended model**: `opus`

**Dependencies.** Unit 1 (exit 14 must exist).

**Scope.** Four files.

1. **`packages/intentionsutil/scripts/hold-node-decide.ts`** — add a third hold
   kind. `HOLD_KINDS` at `:53` is the single source of truth; `KIND_SLUGS` at
   `:57-60` and `isHoldKind` at `:63-65` derive from it. Add
   `"worktree-residue"` with slug `residue` (so the deterministic id is
   `tactic-hold-residue-<source-id minus its leading "tactic-">`, per `holdIdFor`
   at `:105-109`), extend the doc comment at `:35-52` describing it, and extend
   `isHoldKind`. Update the `--kind` usage strings at `:21` and `:291-293` and the
   `Usage:` header. Do **not** touch `RESERVED_KIND_SLUGS` at `:68` (`no-progress`
   stays reserved for a different tactic).

   Note: the comment at `:100-102` cites
   `provision-node-worktree:56` for the node-id slug regex; the regex is actually
   at `:60`. **The identical stale citation also appears at `:70`** (`/** The
   node-id slug shape provision-node-worktree:56 enforces. */`, immediately above
   `NODE_ID_RE`). Correct **both** while in the file.

2. **`packages/intentionsutil/scripts/hold-node`** — update the two `--kind`
   usage strings (`:34` in the header block and the `USAGE=` at `:63`) to list
   `worktree-residue`. No logic change: the script makes no decisions of its own,
   it forwards `--kind` to `hold-node-decide.ts`.

3. **`packages/intentionsutil/test/hold-node-decide.test.ts`** — add unit tests
   mirroring the existing `provision-conflict` / `fix-attempt-cap` cases: the
   `residue` slug id derivation (beside the cases at `:60-73`), and a
   `decideHold` case asserting `attributes.hold_kind === "worktree-residue"`
   (beside `:142-147`).

4. **`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`** — a new
   `14)` arm in the `case "$prov_rc"` at `:197-372`, placed between the `13)` arm
   (ending `:359`) and the `*)` catch-all at `:360`. Behavior:

   - **No strike ladder.** Exit 14 is a steady state with no autonomous repair
     path, so it escalates on the *first* occurrence. Do not reuse
     `CONFLICT_STRIKE_CAP` or the `.conflict-strikes` sidecar.
   - Compose the hold evidence from the deterministic worktree path (the same
     composition the `11)` arm already does at `:248`:
     `RESIDUE_WT="$PROJECT_ROOT/.claude/worktrees/$id"`). Write a
     `--reason-file` containing the sentence *"provision-node-worktree refused
     to provision this tactic's worktree: it carries mechanical residue from a
     dead session (exit 14), not a content conflict. `origin/main` merges clean
     once the residue is cleared."* followed by the literal output of
     `git -C "$RESIDUE_WT" status --porcelain --untracked-files=no` and
     `git -C "$RESIDUE_WT" diff --stat`. Write a `--recommendation-file` telling
     the drain to inspect that diff, decide whether the uncommitted content is
     unlanded work (land it via `graph-commit` / a branch push) or safely
     discardable (`git restore`), and then resolve **the hold tactic** to `phase:
     done` and prune it — clearing `office_hours` alone does not unblock the
     source.
   - Call `"$HOLD_NODE" "$id" --kind worktree-residue --reason-file … 
     --recommendation-file …` (`HOLD_NODE` is already resolved at `:119`), using
     the same `mktemp -d` / `rm -rf` scaffolding as the `11)` arm at `:313-330`.
   - On success print `held $id worktree-residue`; on failure print
     `failed $id hold-failed` and bump `FAILURES`. Do **not** call `park-node` —
     the source's own `office_hours` is never written by this producer.
   - The script runs `set -uo pipefail` (no `-e`), so the `git status` / `git
     diff` calls cannot abort the loop; still guard them so an unreadable
     worktree yields an explanatory line in the reason file rather than an empty
     one.
   - Update the header: the stdout verb list at `:52-77` (add `held <id>
     worktree-residue`) and the exit-code paragraph at `:78-82`.

5. **`.claude/skills/dispatch-conflict/SKILL.md`** — two small doc edits so Lane
   3's contract matches reality:

   - Step 1's invariant paragraph at `:701-703`: keep the claim, and add that it
     is now *enforced* by `provision-node-worktree`'s precondition guard — a
     worktree carrying mechanical residue exits **14** and never reaches this
     lane — plus a note that exit 11 has a second cause, a local branch that
     does not merge its own `origin/<id>` tip cleanly, in which case Step 3
     should merge `origin/$SOURCE_ID` before reproducing the `origin/main` merge.
   - The discriminator at `:174-215`: note in case 4 ("report and stop") that a
     `tactic-hold-residue-*` hold (`attributes.hold_kind == "worktree-residue"`)
     lands here deliberately — it has no branch and no conflict to reproduce, so
     `/dispatch-conflict` is the wrong tool for it and it is drained by
     office-hours from the hold's own recommendation text.

6. **`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`**
   — add a case after Case 8 (`:285-293`) asserting: `PROV_RC=14` produces stdout
   `held <id> worktree-residue`, exit 0, no `dispatch-spawn-job` call, no
   `park-node` call, and a `hold-node` call whose argv contains
   `--kind worktree-residue`. The existing `hold-node` stub at `:92-96` already
   logs argv and honors `HOLD_RC`; add a second case with `HOLD_RC=1` asserting
   `failed <id> hold-failed` and exit 1.

**Out of scope.** Changing the exit-11 strike ladder, the hold-node CAS/landing
logic, or `office-hours-graph` / `resolve-hold` (a `worktree-residue` hold is an
ordinary born-parked hold tactic — those tools are kind-agnostic).

**Reuse.**
- `packages/intentionsutil/scripts/hold-node` — the whole landing path; only its
  usage strings change.
- The `11)` arm's `mktemp -d` + reason/recommendation-file scaffolding at
  `dispatch-graph-execute:313-330`.
- `packages/intentionsutil/scripts/hold-node-decide.ts:74-76` —
  `RESOLUTION_SENTENCE`, the load-bearing closing sentence; the recommendation
  text must not contradict it.

---

## Unit 4 — graph-commit: refuse a pre-existing rebase, and abort one it strands

- **Recommended model**: `opus`

**Scope.** `packages/intentionsutil/scripts/graph-commit` plus a case in
`packages/intentionsutil/scripts/test-graph-commit.sh`.

Two changes that together make "a rebase is in progress at exit" unambiguously
mean "graph-commit left it":

1. **Refuse a pre-existing rebase.** In `main()`, immediately before
   `assert_clean_outside_ids` (called at `:1413`; defined at `:1253`) and after
   `cd "$REPO_ROOT"` (`:1341`), add:

   ```bash
   if rebase_in_progress; then
     die "a rebase is already in progress in $REPO_ROOT — graph-commit will not run on a mid-operation worktree; finish or 'git rebase --abort' it first"
   fi
   ```

   `rebase_in_progress()` is defined at `:559-564` and `die()` at `:200`; both are
   defined before `main()` runs, so ordering is fine. This is a clear error at a
   system edge, not a fallback. It also protects a caller's own `edit`-stopped
   rebase (which leaves a *clean* tree and would otherwise slip past
   `assert_clean_outside_ids`) from being aborted by change 2.

2. **Abort a stranded rebase in `cleanup()`.** `cleanup()` is at `:335-360` and
   is installed as the EXIT trap at `:1401` (with `INT`/`TERM` converted to a
   normal exit at `:1405`; its explanatory comment is at `:1403`). Insert, as the **first** thing in the function body
   after `local rc=$?`:

   ```bash
   if rebase_in_progress; then
     git rebase --abort >&2 || true
   fi
   ```

   It must precede the `RESTORE_HEAD` / `git reset --hard "$ORIG_HEAD"` block at
   `:343-345`: a `reset --hard` inside a live rebase leaves the state dir behind.
   Best-effort with `|| true`, on the same footing as the lock release at
   `:356-358` and the scratch-branch delete at `:349-351` — its failure must never
   mask the real exit status (`cleanup()` returns `$rc`).

   Because of change 1, any rebase present at exit was started by this run, so
   there is no need for a separate "did we start it" flag. State that reasoning in
   a comment — it is the load-bearing premise.

   This is deliberately incomplete: a SIGKILL fires no trap at all, which is why
   Unit 1's provision-side guard is the primary defense and this is the secondary
   one. Say so in the comment.

3. **Tests** in `packages/intentionsutil/scripts/test-graph-commit.sh`, modelled
   on Case 24 (`:975-990`), which already shows the "pre-flight refuses, main
   untouched, zero gh calls" assertion shape and the `run_gc` / `make_clone` /
   `origin_sha` helpers (`:435-466`; `make_clone` is separate, at `:204-208`):

   - **Pre-existing rebase → refuse.** In a fresh clone, start a rebase that
     stops (conflicting commits on a scratch branch), then run `graph-commit` on
     an edited node. Assert non-zero rc, the "already in progress" message on
     stderr, `origin_sha` unchanged, and `gh_calls` == 0.
   - **Stranded rebase → aborted by cleanup.** Drive `graph-commit` down a path
     that dies while a rebase is in progress. The cheapest lever is the existing
     concluded-check-failure `die` (Case 5, `:540-556`, uses `set_mode` to make
     the stubbed `gh` report a non-success conclusion) combined with a concurrent
     overlapping edit that forces the `git pull --rebase` at `:924` into a
     conflict layer 2 cannot resolve. If that combination proves not to reach
     `cleanup()` with a live rebase, fall back to sourcing `graph-commit` (its
     tail guards `main "$@"` behind `[[ "${BASH_SOURCE[0]}" == "${0}" ]]`, so
     sourcing defines the functions without running anything), hand-starting a
     conflicting rebase in a fixture clone, and calling `cleanup` directly —
     asserting `rebase_in_progress` is false afterwards and HEAD is back on the
     branch. Prefer the end-to-end form; use the sourced form only if the
     end-to-end one cannot be made deterministic, and say which you used in the
     case comment.

**Out of scope.** Any change to `try_land()`'s layer-2 conflict handling or to the
explicit `git rebase --abort` at `:932` (it stays; the cleanup check makes it a
no-op on that path). Any change to the lock, snapshot, or scratch-branch
backstops.

**Reuse.**
- `rebase_in_progress()` at `graph-commit:559-564` — do not write a second
  detector.
- `die()` at `graph-commit:200`.
- `test-graph-commit.sh:435-466` — `run_gc`, `sync_clone`,
  `origin_sha`, `gh_calls`, `set_mode`, `ok`/`no`.

---

## Verification

Run from the worktree root.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-graph-commit.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-hold-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx vitest run --project packages/intentionsutil --root .
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-typecheck.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Notes on the verify list:

- `test-provision-node-worktree.sh` does not exist yet — it is created by Unit 2.
  It will exist by the time the block runs.
- `test-hold-node.sh` exists but is **not** wired into CI today. Do **not**
  conclude from that that CI wiring is rare in this directory — it is not. The
  `hook-tests` job in `.github/workflows/unit-tests.yml` wires up at least nine
  `test-*.sh` files from `.claude/skills/dispatch-propagate/scripts/`:
  `test-dispatch-graph-execute.sh`, `test-dispatch-scripts.sh`,
  `test-dispatch-derive-node-target.sh`, `test-dispatch-daemon-liveness.sh`,
  `test-write-phase-log.sh`, `test-flake-stale-head-check.sh`,
  `test-run-smoke-tests.sh`, `test-lint-prose-rules.sh` and
  `test-lint-ds-drift.sh`. `test-hold-node.sh` is simply an unwired one. Run it
  locally anyway — Unit 3 changes `hold-node`'s usage strings. Wiring it into CI
  is a separate concern, not part of this tactic.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` is
  untouched by this plan but is the largest consumer of the shared lib files; run
  it if any `lib*.sh` ends up modified (it should not).

Manual checks, outside the verify block:

- **The three defects in situ.** This repo currently carries live orphan
  registrations — `git worktree prune --dry-run -v` at the repo root reported
  `worktrees/oh-baseline-monolith` and `worktrees/graph-tx-reap-close` on
  2026-07-30. Confirm the pruning arm of Unit 1 clears them (or that they were
  cleared out of band) rather than assuming.
- **Post-landing observation.** Confirm no node accumulates consecutive
  `conflict-retry` / `conflict-lane` tick dispositions while its worktree has a
  non-empty `git status --porcelain --untracked-files=no` or a `rebase-merge`
  directory. Any such node after landing means the guard is being bypassed.
- **First real exit 14.** When the first `tactic-hold-residue-*` hold is born,
  read its body and confirm the reason carries a usable `git status` + `git diff
  --stat` — the whole point of the asymmetric policy is that the drain has the
  evidence in hand without re-entering the worktree.
- **Self-modification commit.** Expect the commit touching `.claude/skills/**` to
  be denied by the permission classifier. Complete every unit, leave the branch
  staged, and route to the office-hours self-modification drain rather than
  reshaping the change to dodge the denial.
