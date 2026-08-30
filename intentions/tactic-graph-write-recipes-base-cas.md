---
id: tactic-graph-write-recipes-base-cas
kind: tactic
statement: Graph-write completion recipes must pass graph-commit's --base
  compare-and-swap so a write from a stale local worktree cannot silently
  clobber sibling frontmatter fields that advanced on origin/main.
owner: ai
status: codified
parent: null
rationale: "Observed 2026-07-22 on tactic-thin-oversized-skill-bodies (PR
  #2927). The fix-checks node-lane completion records a pushed sha via
  `apply-fix-state --record-push` + `graph-commit`. Commit 91c9cb1d, whose
  message is `record fix push 97917093...` and which should have changed only
  `execution.fix.pushed_sha: null -> 97917093...`, ALSO silently reverted
  `blocked_by: [tactic-flake-park-node-concurrent-write-refusal] -> []`,
  dropping a suppression link that the prior iteration had already landed on
  origin/main (commit 33aa5ab8). This is NOT a defect in apply-fix-state
  --record-push, which is field-precise: apply-fix-state.ts:202 does
  `node.execution = { ...execution, fix: { ...currentFix, pushed_sha: sha } }`,
  preserving everything readNode returned. The clobber is the
  stale-local-worktree class: the worker read its LOCAL intentions/<id>.md
  (which never picked up the blocked_by that iteration 1 landed on main), set
  pushed_sha, and graph-commit rebuilt the WHOLE file onto origin/main.
  graph-commit does whole-file replacement, so the field that advanced on main
  reverted to the stale local value with no textual conflict and no error. The
  fixing primitive already exists: graph-commit supports `--base <id>=<blobsha>`
  (a compare-and-swap that refuses to land if the blob moved on origin/main
  after a fetch) plus a layer-2 rebase-conflict field merge. But the completion
  recipes omit --base -- the header's own words, `Omit entirely to keep pre-CAS
  behavior` -- so the pre-CAS silent-clobber path is live for every caller that
  does readNode(local) -> writeNode -> graph-commit without a --base manifest.
  Greenfield fix: every graph-write completion/park/transition recipe passes a
  --base CAS manifest pinned to the origin/main blob it read. Concretely: (1)
  the fix-checks node-lane record-push + graph-commit in
  .claude/skills/fix-checks/SKILL.md; (2) audit park-node and transition-node
  for the same omission -- both do readNode(local) -> writeNode -> graph-commit,
  and project notes record park-node reverting body revisions and
  transition-node reverting office_hours from stale PR-branch worktrees (same
  class). Sole-tracker relation: sibling
  tactic-prune-conflict-recovery-silent-loss covers the --prune path of this
  same silent-loss class; this tactic covers the ordinary field-write path.
  Prior fix tactics named in project notes
  (tactic-park-node-fresh-main-clobber-fix,
  tactic-graph-commit-auto-serialization) no longer exist on origin/main -- the
  --base primitive shipping absorbed the general-primitive tactic -- leaving
  this caller-side gap (recipes not passing --base) untracked. The observed
  instance was benign because the clobbered link pointed at a mis-filed flake
  node whose work was already done by 13f1206a, but the clobber is a real latent
  defect that will silently revert genuine concurrent field advances. (Finalized
  2026-07-22 /align-tactics per-node session: audit confirmed park-node already
  implements the fresh-refresh + --base pattern correctly; transition-node and
  the fix-checks node-lane recipe were confirmed broken and are this tactic's
  plan scope. Also found the fix-checks recipe references a nonexistent
  graph-commit path, folded into Unit 1.)"
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
  branch: tactic-graph-write-recipes-base-cas
  pr: 2939
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-26T05:52:13Z
    mergeCommitSha: c063f4906c77912298b97da322f29cd9103b5b80
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Graph-write completion recipes must pass graph-commit's --base compare-and-swap so a write from a stale local worktree cannot silently clobber sibling frontmatter fields that advanced on origin/main.

## Context

Graph-write completion recipes follow the shape `readNode(local ./intentions)` → mutate one field → `writeNode(local)` → `graph-commit`. `graph-commit` does **whole-file replacement**: the bytes it lands are exactly whatever is in `intentions/<id>.md` on disk when it starts (its PR-branch "reset-dance", `ensure_intentions_only_base` at `packages/intentionsutil/scripts/graph-commit:447-465`, only relocates git ancestry — it re-materializes that same on-disk file). So when a worker runs from a stale local worktree that never picked up a sibling field another iteration already landed on origin/main, its small field-precise diff applies cleanly onto the advanced main and **silently reverts** the sibling field — no textual conflict, no error.

Observed 2026-07-22 on `tactic-thin-oversized-skill-bodies` (PR #2927): commit `91c9cb1d` ("record fix push 97917093…"), which should have changed only `execution.fix.pushed_sha: null -> 97917093…`, ALSO reverted `blocked_by: [tactic-flake-park-node-concurrent-write-refusal] -> []`, dropping a suppression link a prior iteration had landed on main (`33aa5ab8`). The per-field writers (`apply-fix-state.ts`, `apply-node-transition.ts`) are NOT at fault — they are field-precise, preserving everything `readNode` returned. The defect is the stale-local-worktree class: the worker read its stale local file, and `graph-commit` rebuilt the whole file onto main.

The fixing primitive already ships: `graph-commit --base <id>=<blobsha>` is a compare-and-swap that fetches origin/main and **refuses** the land (non-zero exit, "stale base") if the node's blob moved after the base was pinned, plus a layer-2/3 rebase-conflict field merge. But it is opt-in ("Omit entirely to keep pre-CAS behavior", `graph-commit:233`), and the completion recipes omit it, leaving the silent-clobber path live for every `readNode(local) → writeNode → graph-commit` caller.

Greenfield fix: every graph-write completion recipe must (a) refresh the local node file from origin/main **before** it reads/mutates it, and (b) pass `graph-commit` a `--base` token pinned to the exact origin/main blob it read — so a concurrent advance is refused, never clobbered. `park-node` (`packages/intentionsutil/scripts/park-node:60-101`) already does exactly this and is the canonical template: `git fetch origin main` → `FRESH_BLOB=$(git rev-parse origin/main:intentions/<id>.md)` (hard-error if absent on main) → `git show origin/main:intentions/<id>.md > local-path` → readNode/mutate/writeNode → `graph-commit --base "<id>=$FRESH_BLOB"`. This tactic brings the two recipes that omit it up to that standard. `park-node` is already correct and unchanged. Sibling `tactic-prune-conflict-recovery-silent-loss` covers the `--prune` path of this same silent-loss class; this tactic covers the ordinary field-write path.

Scope is exactly the two broken recipes below. The single-id, dedicated-read/mutate/write shape of both is why `park-node`'s inline pattern is the right fit rather than the multi-id `dump-node.ts` manifest mechanic (which hashes local disk without refreshing) — reuse park-node's inline pattern directly; there is no shared helper today and park-node itself does not call out to one.

## Units

### Unit 1 — Fix the fix-checks node-lane completion recipe (`--base` + refresh + correct graph-commit path)

**Scope.** `.claude/skills/fix-checks/SKILL.md`, the node-lane completion `bash` recipe at lines 95-101 (the block introduced at line 86 "If this iteration pushed a commit"; recipe currently reads `HEAD_SHA=$(git rev-parse HEAD)` → `apply-fix-state.ts "$N" --record-push "$HEAD_SHA"` → `graph-commit -m … "$N"`). Three coupled changes to this one block:

1. **Refresh-from-origin/main before the mutate.** Before the `apply-fix-state.ts --record-push` call, add park-node's inline refresh against `$N`: `git fetch origin main`; `FRESH_BLOB=$(git rev-parse "origin/main:intentions/$N.md")` with a hard-error-and-stop if `$N` is absent on origin/main (never fall back to the local PR-branch copy — a fix node under an active interrupt is by definition landed); `git show "origin/main:intentions/$N.md" > "intentions/$N.md"`. `apply-fix-state.ts` reads default dir `./intentions` (`packages/intentionsutil/scripts/apply-fix-state.ts` readNode ~line 146, writeNode ~line 202) and is correctly git-blind — the refresh responsibility lives in this SKILL.md recipe, exactly as park-node keeps it in the bash wrapper, not in the `.ts`.
2. **Pass `--base` to graph-commit.** Change the commit line to `--base "$N=$FRESH_BLOB" -m "graph: record fix push $HEAD_SHA on $N" "$N"`.
3. **Fix the wrong graph-commit path (pre-existing bug, fold in here — same lines, trivial).** The recipe invokes `.claude/skills/dispatch-propagate/scripts/graph-commit`, which does not exist; the real script is `packages/intentionsutil/scripts/graph-commit`. Correct the path on the same commit line.

Keep the parenthetical at lines 92-93 ("same as `/implement`'s node-lane completion did with `transition-node`") intact and accurate — it refers to the reset-dance, which is unchanged, and after Unit 2 the parallel to transition-node strengthens (both now refresh + `--base`). `grep -n "node-lane" .claude/skills/dispatch-propagate/scripts/transition-node` returns nothing — there is no reciprocal comment in transition-node to update.

**Out of scope.** No change to `apply-fix-state.ts`. No change to the node-target resolution block at lines 42-68 (its origin/main `git archive` read into a scratch temp dir is a discarded gate-only read of `execution.fix` and is fine as-is — the completion recipe still needs its own refresh of the real `intentions/$N.md`). Do not touch the "pushed NOTHING" branch (lines 103-107, no graph write) or the disarm-auto-merge block (lines 117-125).

**Recommended model:** sonnet — mechanical edit to a documented bash recipe with a clear diff shape; park-node lines 66-98 are the exact copy-from template.

### Unit 2 — Fix transition-node (refresh-from-origin/main before read + `--base` on the state-only land)

**Scope.** `.claude/skills/dispatch-propagate/scripts/transition-node`. Mirror park-node's shape:

1. **Add refresh + FRESH_BLOB pin before any read.** Insert after argument parsing (after line 73, before `read_node_json`'s first use at line 101): `git -C "$REPO_ROOT" fetch origin main` (there is currently **no** fetch anywhere in transition-node — this also freshens the origin/main ref the freshness snapshot at line 109 archives from, a strict improvement to the scope/strategy gates); `FRESH_BLOB=$(git -C "$REPO_ROOT" rev-parse "origin/main:intentions/$NODE_ID.md")` with hard-error-and-exit if absent on origin/main (a node being transitioned is landed by definition; never fall back to local); `git -C "$REPO_ROOT" show "origin/main:intentions/$NODE_ID.md" > "$REPO_ROOT/intentions/$NODE_ID.md"`. Placing this before `read_node_json` (lines 76-81, reads local `./intentions`) means `PHASE`/`PR` (lines 101-104) and the subsequent `apply-node-transition.ts` mutation (`packages/intentionsutil/scripts/apply-node-transition.ts`, readNode ~155 / writeNode ~201, correctly git-blind) all operate on origin/main's current content.
2. **Pass `--base` on the final land.** Change line 154 from `"$GRAPH_COMMIT" -m "graph: transition $NODE_ID to $NEW_PHASE" "$NODE_ID"` to include `--base "$NODE_ID=$FRESH_BLOB"`.

**Out of scope.** No change to `apply-node-transition.ts` (git-blind by design; the refresh responsibility belongs in this bash wrapper, mirroring park-node). No change to `compute-freshness.ts` or the SNAP_DIR freshness-snapshot mechanism (lines 106-118) beyond benefiting from the added fetch. No `--base` needed on the demotion branch (line 126 delegates to `demote-node-to-implement`, which owns its own land) or the hold/arm branches (lines 147-151, 153-157, 162-169) which either make no graph-commit or are the branch this unit fixes. **Callers need no change**: transition-node is invoked by `.claude/skills/implement/SKILL.md`, `.claude/skills/qa-fix/SKILL.md`, `.claude/skills/qa-main/SKILL.md`; fixing transition-node fixes all three transitively.

**Recommended model:** opus — placement interacts with read-ordering (must precede `read_node_json` and the freshness snapshot), the demote/hold/arm branch structure, and the PR-branch-vs-main-checkout doctrine in the header (lines 22-25); judgment about exact insertion point and error handling matters.

### Unit 3 — Regression harness for the transition-node guard

**Scope.** New bash harness `packages/intentionsutil/scripts/test-transition-node.sh`, modeled directly on `packages/intentionsutil/scripts/test-park-node.sh` (throwaway bare origin + writer clones, `git`/`jq` only, `GRAPH_COMMIT_*` env overrides, `PATH`-shimmed `gh`). Cover the two park-node cases translated to a phase transition: (1) a stale far-ahead PR-branch worktree transition does NOT revert a concurrently-landed sibling field (the exact clobber class); (2) a concurrent origin/main advance between FRESH_BLOB resolution and graph-commit's `--base` check is REFUSED (reuse test-park-node.sh's graph-commit wrapper trick, its Case 2). Wire the harness into `.github/workflows/unit-tests.yml`'s `hook-tests` job, alongside the existing "Run park-node CAS-guard tests" step (currently at line 196-197: `- name: Run park-node CAS-guard tests` / `run: packages/intentionsutil/scripts/test-park-node.sh`) — add a new step immediately after it: `- name: Run transition-node CAS-guard tests` / `run: packages/intentionsutil/scripts/test-transition-node.sh`.

**Note / risk.** Unlike park-node's writer (a single tsx one-liner cleanly shimmed by a fake `npx`), transition-node invokes real `node --import tsx/esm` for `apply-node-transition.ts` **and** `compute-freshness.ts`, which resist shimming. The harness will likely need either real tsx execution (slower; needs deps present in CI, which they are for the existing intentionsutil tests) or a tailored shim; deciding that is implementation-time judgment.

**Out of scope.** No harness for the fix-checks recipe — it is a SKILL.md-documented bash snippet, not an executable script, so it has no direct test surface; its guard is the same refresh + `--base` pattern this harness and the existing test-park-node.sh/test-graph-commit.sh already exercise.

**Recommended model:** opus — the plan leaves the shim-vs-real-tsx decision open and the two-writer race harness for a multi-tsx-dependency script is judgment-heavy.

**Dependencies:** Unit 2 (the harness tests the fixed transition-node).

## Reuse

- **`packages/intentionsutil/scripts/park-node:60-98`** — the canonical fetch → `rev-parse origin/main:intentions/<id>.md` (FRESH_BLOB, hard-error if absent) → `show origin/main:… > local` → readNode/mutate/writeNode → `graph-commit --base "<id>=$FRESH_BLOB"` recipe. Copy this inline pattern into Units 1 and 2 verbatim in shape; do **not** extract a shared helper (none exists today and park-node does not use one — a shared helper is a larger refactor than this tactic warrants).
- **`packages/intentionsutil/scripts/graph-commit`** — the `--base <id>=<blobsha>` compare-and-swap already implemented (`check_base_freshness`, lines ~216-282; usage lines ~32-51). No change to graph-commit itself; both units are pure callers.
- **`packages/intentionsutil/scripts/test-park-node.sh`** — structural template for Unit 3 (scratch origin, writer clones, gh/npx shims, the graph-commit-wrapper concurrent-advance trick).

## Verification

Existing harnesses that exercise the `--base` primitive and the exact refresh-then-CAS pattern both fixes mirror — these must stay green:

```verify
packages/intentionsutil/scripts/test-park-node.sh || exit 1
packages/intentionsutil/scripts/test-graph-commit.sh
```

New regression harness from Unit 3 (auto-runnable once it lands):

```verify
packages/intentionsutil/scripts/test-transition-node.sh
```

Manual / judgment checks not covered mechanically:

- **fix-checks recipe** (no executable test surface — it is a SKILL.md snippet). Manually stage a two-writer race: land a sibling `blocked_by` (or any frontmatter field) on origin/main for a node carrying an `execution.fix` interrupt, then from a stale PR-branch worktree that predates that land, run the completion recipe (`apply-fix-state --record-push` + the corrected `graph-commit --base`). Confirm `execution.fix.pushed_sha` is recorded AND the sibling field survives on origin/main; confirm that if origin/main advances the node's blob again before the land, `graph-commit` refuses (non-zero, "stale base") rather than clobbering. Also confirm the corrected graph-commit path (`packages/intentionsutil/scripts/graph-commit`) actually resolves — the previous `.claude/skills/dispatch-propagate/scripts/graph-commit` path did not exist, so the recipe must be run end-to-end at least once.
- **transition-node** — same two-writer race against a phase transition (this is what Unit 3 automates; run it manually first if Unit 3 is deferred). Verify a transition from a stale PR-branch worktree preserves a concurrently-landed sibling field and refuses on a concurrent blob advance, and that the demote/hold/arm branches (which take no `--base`) are unaffected.

## Out-of-scope same-class omissions (noted for a future audit, deliberately NOT fixed here)

The rationale scopes this tactic to fix-checks + transition-node (park-node already correct). These confirmed same-class omissions should be named for a follow-up audit but are excluded from this PR:

- `.claude/skills/context-chunks/SKILL.md:126`, `.claude/skills/grounding-research/SKILL.md:124`, `.claude/skills/reading-review/SKILL.md:579` — each bundles new-node creation with edits to pre-existing nodes in one `graph-commit` call with no `--base`.
- `packages/intentionsutil/scripts/demote-node-to-implement:77` — `readNode(local) → … → graph-commit` with no `--base`, invoked by transition-node's scope-stale branch (`transition-node:126`). Same class; strongly recommended as the immediate follow-up since it is reached from the very script this tactic fixes, but it is a distinct backward-transition primitive outside this tactic's explicit forward-field-write scope.

No migration/rollout path is warranted beyond the units above — these are internal dev-tooling scripts with no external consumers, and the fixes are backward-compatible (`--base` is additive; refuse-on-advance replaces silent-clobber, which is the intended behavior change).
