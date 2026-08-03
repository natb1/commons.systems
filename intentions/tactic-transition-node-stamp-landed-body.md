---
id: tactic-transition-node-stamp-landed-body
kind: tactic
statement: transition-node's refresh_stamp hashes the post-`git reset --hard`
  worktree body, so every node-lane worker stamps the PRE-edit scope fingerprint
  — repair it to stamp what actually landed on origin/main
owner: ai
status: codified
parent: null
rationale: "Found 2026-07-25 while diagnosing repeated /qa-fix sessions closing
  as 'qa already complete but phase was not progressed'. transition-node:178-183
  lands the write via graph-commit and THEN calls refresh_stamp; graph-commit's
  cleanup does `git reset --hard $ORIG_HEAD` (graph-commit:301-303) to restore
  the far-ahead PR-branch tip it moved off to land an intentions/-only SHA.
  refresh_stamp then reads REPO_ROOT's intentions/<id>.md — by that point
  reverted to the branch copy — and writes that stale fingerprint to
  <main>/.claude/worktrees/<id>.scope-fingerprint. Result: stamp != origin/main
  whenever the transition also changed the body, which is exactly the /qa-fix
  Step 3.6 `## needs-main residue` case. The next dispatch-graph-scope-sweep
  tick reads that as scope drift and calls demote-node-to-implement, which wipes
  execution.markers to [] (dropping qa-done and planned) and discards completed
  QA custody. Note the stamp PATH is already correct (MAIN_ROOT is resolved
  deliberately for this, transition-node:48-51) — the defect is the CONTENT
  SOURCE, which is why tactic-transition-node-scope-stale-test-coverage does not
  cover it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: null
  override: 60
  rationale: "Bootstrap re-scale 2026-07-30: override 60 pins the head of the
    fingerprint-custody chain. After the 2026-07-30 re-serialization (d2b161a3)
    the cluster is linear - tactic-demote-node-stale-local-read ->
    tactic-phase-evidence-fingerprint-bound ->
    tactic-scope-fingerprint-plan-substance -> HERE - and this node, blocked by
    nothing, is the repair the 2026-07-30 sitting moved to the front. The
    override holds it at 60, above the 55.33 the rest of the chain inherits from
    the single anchor on tactic-demote-node-stale-local-read, so the ratified
    land-the-repair-first order is expressed in rank. TWO CAVEATS, recorded so a
    later round need not rediscover them. (1) An override REPLACES the outgoing
    set with {(self, 60)} and discards everything incoming
    (attention.ts:243-254, 364-365), so this node no longer inherits through
    blocked_by. That costs nothing - red-main preemption does not travel by rank
    at all (it comes from dispatch-graph-main-red-sync minting
    tactic-main-red-<sha> born pace_exempt, plus the --main-broken-sha bypass at
    dispatch-select-tick:672) - but the insulation is deliberate. (2) This is
    temporary scaffolding for the chain serialization, not a standing judgment:
    once this node is done the cap has no subject, and
    tactic-attention-boost-scripts must retire it along with the interim
    50/20/10 boosts. Under tactic-attention-tier-ranking lexicographic (tier,
    rank) with max-lifting the cap has no job at all."
phase: done
execution:
  branch: tactic-transition-node-stamp-landed-body
  pr: 2973
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-30T20:11:21Z
    mergeCommitSha: 0848a10eb4b10ee7a716b648032d2704f9623142
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# transition-node's refresh_stamp hashes the post-`git reset --hard` worktree body, so every node-lane worker stamps the PRE-edit scope fingerprint — repair it to stamp what actually landed on origin/main

## Context

`transition-node` (`.claude/skills/dispatch-propagate/scripts/transition-node`) is the
graph-native forward phase-transition writer. After it lands a node's state-only write on
`origin/main` via `graph-commit`, it refreshes the node's chain-of-custody scope stamp at
`<main-root>/.claude/worktrees/<id>.scope-fingerprint`, so that machinery-driven body
appends made during the phase do not later read as scope drift.

**The defect.** `refresh_stamp()` (`transition-node:83-98`) computes the fingerprint from
`REPO_ROOT`'s *local* `intentions/<id>.md`, read *after* `graph-commit` has already run.
When `transition-node` runs from a node-lane PR-branch worktree whose HEAD is ahead of
`origin/main` with code changes — the normal case for every node worker —
`graph-commit`'s `ensure_intentions_only_base()` (`packages/intentionsutil/scripts/graph-commit:459-480`)
does `git reset --hard <origin/main>`, re-materializes the node file from its snapshot,
commits and lands it; then `graph-commit`'s `cleanup()` EXIT trap
(`packages/intentionsutil/scripts/graph-commit:311-321`) does `git reset --hard "$ORIG_HEAD"`,
returning the worktree to the PR-branch tip. By the time `refresh_stamp` reads
`REPO_ROOT/intentions/<id>.md`, that file is the **PR-branch copy — the pre-transition
body**, not what landed. The stamp therefore records the *pre-edit* fingerprint while
`origin/main` carries the *post-edit* body.

**The observed harm.** `tacticScopeFingerprint(statement, body)`
(`packages/intentionsutil/src/router.ts:109`) hashes statement + body only, so a pure
frontmatter/phase transition is unaffected. The bug bites whenever the transition *also*
carries a body edit — which is exactly `/qa-fix`'s Step 3.6 node lane: it appends a
`## needs-main residue` H2 to the tactic's own body as an **uncommitted worktree edit** that
"rides in the Step-4 `transition-node` commit" (`.claude/skills/qa-fix/SKILL.md:340-355`,
and `.claude/skills/qa-fix/SKILL.md:170-181` for the completion seam). The transition lands
the residue on `origin/main`, then stamps the residue-free body. The next
`dispatch-graph-scope-sweep` tick (`.claude/skills/dispatch-propagate/scripts/dispatch-graph-scope-sweep:1-50`)
compares the stamp against `origin/main` via `isScopeStale`
(`packages/intentionsutil/src/transitions.ts:331-334`), reads drift, and calls
`demote-node-to-implement`, which wipes `execution.markers` to `[]` — dropping the
`qa-done` and `planned` markers and discarding completed QA custody. Symptom seen in
production 2026-07-25: repeated `/qa-fix` sessions closing as "qa already complete but phase
was not progressed".

**Intended outcome.** `refresh_stamp` stamps the fingerprint of the content that actually
landed on `origin/main`, read from git — never from the post-`reset --hard` worktree. The
stamp path resolution (`MAIN_ROOT`, `transition-node:48-51`) is already correct and does not
change; only the **content source** does.

**Design (greenfield).** The stamp writer should take an explicit *content source* rather
than implicitly trusting the working tree. That primitive already exists in embryo:
`restampScope(intentionsDir, repoRoot, mainRoot, id)`
(`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:71-90`) already separates the
node-content directory from the git-metadata repo and from the stamp-write location. The
ideal shape is: one tested TS primitive with two content modes — *from disk* (today's
align-round re-stamp) and *from a git rev* (what landed) — and `transition-node`'s bash
`refresh_stamp` reduced to a single guarded invocation of it in the git-rev mode. That
removes the duplicated bash hash recipe entirely while keeping the fail-open (transition
wrapper) vs fail-loud (align re-stamp) distinction where it belongs: at the **caller**.

No brownfield migration path is needed — this is a single PR, the new CLI flag is additive,
and the existing `restampScope` signature and CLI invocation are unchanged.

**Explicitly out of scope for this tactic:**
- `graph-commit`'s reset-and-restore behaviour. It is correct (it must return the worktree
  to the PR tip); `refresh_stamp` routes around it rather than changing it.
- Any change to `tacticScopeFingerprint`, `parseScopeStamp`, `isScopeStale`,
  `compute-freshness.ts`, or `dispatch-graph-scope-sweep`. The consumers are correct; only
  the producer is broken.
- `provision-node-worktree` (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:83-100`)
  — it stamps from the main checkout, which `dispatch-select-tick` keeps fast-forwarded to
  `origin/main`, so it is already correct.
- `demote-node-to-implement` (`packages/intentionsutil/scripts/demote-node-to-implement:46`)
  — it only *reads* the stamp; it writes none.
- The separate question of whether a demotion should clear/refresh the stamp (it currently
  does neither). Not this bug.
- The sibling tactic `intentions/tactic-transition-node-scope-stale-test-coverage.md`, which
  covers the `main-qa` scope-stale guard and `MAIN_ROOT` path resolution. Disjoint from this
  unit's coverage; do not absorb or duplicate it.

---

## Unit 1 — Add a git-rev content source to the scope-stamp primitive

**Scope**

Files that change:

1. `packages/intentionsutil/src/store.ts` — extract the raw-text parse that `readNode`
   already performs into an exported, fs-free helper, so a caller holding node text from
   `git show` can produce the same validated node without a disk read.
   - `readNode(dir, id)` today is `store.ts:101-105`:
     `assertPathSafeId(id)` → `readFileSync(join(dir, id + ".md"), "utf8")` →
     `validateNode(parse(extractFrontmatter(raw, id)))`.
   - Add `export function parseNodeRaw(raw: string, id: string): IntentionNode` containing
     `validateNode(parse(extractFrontmatter(raw, id)))`, and rewrite `readNode`'s body to
     `return parseNodeRaw(readFileSync(...), id)` — a pure extraction, zero behaviour change.
     Keep `assertPathSafeId(id)` in `readNode` (it guards the *path*, not the text); do not
     call it from `parseNodeRaw`.
   - Do **not** add a raw body helper: `extractBody(raw, id)`
     (`packages/intentionsutil/src/frontmatter.ts:29`) is already the fs-free body extractor
     `readNodeBody` (`store.ts:114-118`) delegates to. Import and use it directly.

2. `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts` — split the content source
   from the stamp write, and add the git-rev mode.
   - Extract the write half from `restampScope` (currently `restamp-scope-fingerprint.ts:71-90`)
     into a new exported helper:
     `export function writeScopeStamp(mainRoot: string, id: string, statement: string, body: string, sha: string): { fingerprint: string; sha: string }`
     — computes `tacticScopeFingerprint(statement, body)`, `mkdirSync(dirname(stampPath), { recursive: true })`,
     writes `` `${fingerprint} ${sha}\n` `` to
     `join(mainRoot, ".claude", "worktrees", `${id}.scope-fingerprint`)`, returns both fields.
   - Keep `restampScope(intentionsDir, repoRoot, mainRoot, id)` with its **exact current
     signature and semantics** (disk read + `git rev-parse origin/main`), now delegating to
     `writeScopeStamp`. Existing callers and its unit tests must keep passing untouched.
   - Add
     `export function restampScopeFromRev(repoRoot: string, mainRoot: string, id: string, rev: string, intentionsDir?: string): { fingerprint: string; sha: string }`:
     1. `sha = execFileSync("git", ["rev-parse", rev], { cwd: repoRoot, encoding: "utf8" }).trim()`
        — resolve **once**, then read the blob at that exact `sha`, so a concurrent
        `origin/main` advance cannot split the pair (a real TOCTOU in the current code, which
        reads sha and content independently).
     2. Compute the in-tree path: `relPath = relative(repoRoot, intentionsDir ?? join(repoRoot, "intentions"))`
        (from `node:path`), normalized to forward slashes, then
        `gitPath = `${relPath}/${id}.md``. `git show` requires a repo-root-relative,
        forward-slash path.
     3. `raw = execFileSync("git", ["show", `${sha}:${gitPath}`], { cwd: repoRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })`
        — set `maxBuffer` explicitly; node bodies routinely exceed the 1 MB default is not
        yet true but the default is a silent-truncation hazard, and a clear large limit costs
        nothing.
     4. `statement = parseNodeRaw(raw, id).statement`, `body = extractBody(raw, id)`, then
        `return writeScopeStamp(mainRoot, id, statement, body, sha)`.
     5. Fail LOUD (let every error propagate) — same contract as `restampScope`. The
        fail-open policy is the caller's (Unit 2 applies it in bash).
   - CLI (`run()`, `restamp-scope-fingerprint.ts:103-176`): add an optional
     `--from-rev <rev>` flag, parsed in the same style as `--repo-root` / `--main-root`
     (index lookup, missing-value error, add both indices to the `consumed` set so the
     unknown-flag rejection at lines 152-159 still works). When present, call
     `restampScopeFromRev(repoRoot, mainRoot, id, rev, intentionsDir)`; when absent, the
     existing `restampScope(intentionsDir, repoRoot, mainRoot, id)` path is unchanged.
     Print `` `${fingerprint} ${sha}\n` `` to stdout in both modes. Extend the `USAGE` string.
   - **Update the header comment at `restamp-scope-fingerprint.ts:16-25`.** It currently
     states this script is "NOT a shared helper" and "does not modify `transition-node` or its
     `refresh_stamp()` function in any way". Unit 2 makes `transition-node` a caller, so that
     sentence becomes false. Rewrite the block to say: this IS now the single home of the
     scope-stamp recipe, with two content modes (disk / git-rev); the fail-open vs fail-loud
     distinction is preserved but has moved to the **callers** — this script always fails
     loud, the align re-stamp lets that surface, and `transition-node`'s `refresh_stamp`
     swallows it (`|| return 0`) to keep its best-effort contract.

3. `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts` — add a `describe("restampScopeFromRev")`
   block alongside the existing `describe("restampScope")` (file is 104 lines; mirror its
   assertion style, which asserts exact `` `${fingerprint} ${sha}\n` `` content and uses
   `mkdtempSync` scratch dirs so the real `.claude/worktrees/` is never touched). Cases:
   - **Stamps the committed content, not the working-tree content** (the regression this
     tactic exists for). Build a throwaway git repo in a temp dir: `git init -b main`,
     `git config user.email/user.name`, write `intentions/<id>.md` with body A, commit; then
     overwrite the same file on disk with body B (leave it uncommitted). Call
     `restampScopeFromRev(repoDir, mainRootTmp, id, "main")`. Assert the stamp's fingerprint
     equals `tacticScopeFingerprint(statementA, bodyA)` and **not**
     `tacticScopeFingerprint(statementA, bodyB)`, and that the sha field equals
     `git rev-parse main` in that repo.
   - **Needs-main residue fixture**: use a body B that adds a `## needs-main residue`
     section and assert `hasNeedsMainResidue(bodyB) === true`
     (`packages/intentionsutil/src/transitions.ts:222-232`) so the fixture is the real
     scenario, and that the two fingerprints differ. (Direction check: it is body B — the
     landed one in production — that carries the residue; construct the fixture whichever way
     reads clearest, but assert both fingerprints differ.)
   - **Round-trips through `parseScopeStamp`**: read the stamp file and assert
     `parseScopeStamp(content)` (`packages/intentionsutil/src/transitions.ts:287-296`) returns
     `{ fingerprint, sha }` matching the returned object — reuse that parser rather than
     re-deriving the whitespace split.
   - **Fails loud on a rev/path that does not exist**: `expect(() => restampScopeFromRev(repo, mainRoot, "tactic-not-on-main", "main")).toThrow()`.
   - Also add one test that `parseNodeRaw(raw, id)` and `readNode(dir, id)` agree for the same
     file (put it in the existing store test file if one exists for `store.ts`; otherwise keep
     it in this file — it is a one-liner guarding the Unit-1 extraction).

Out of scope for this unit: `transition-node` (Unit 2), the bash harness (Unit 3), any change
to `restampScope`'s observable behaviour, and any change to `tacticScopeFingerprint`.

**Recommended model:** sonnet

---

## Unit 2 — Point `transition-node`'s `refresh_stamp` at what landed

**Scope**

Single file: `.claude/skills/dispatch-propagate/scripts/transition-node`.

Replace the body of `refresh_stamp()` (`transition-node:83-98` — currently the comment block
plus a `git rev-parse origin/main` and an inline `node --import tsx/esm -e` block that calls
`readNode`/`readNodeBody` against `./intentions`) with a single guarded invocation of the
Unit-1 CLI:

```bash
# Refresh the phase-start stamp to the fingerprint of what ACTUALLY LANDED on
# origin/main, plus that same sha — so machinery body appends made during the
# phase (e.g. /qa-fix Step 3.6's `## needs-main residue`) do not later read as
# scope drift and trip dispatch-graph-scope-sweep's demotion.
#
# The content MUST come from git, never from the local worktree: graph-commit's
# cleanup() (packages/intentionsutil/scripts/graph-commit:311-321) resets this
# worktree back to the PR-branch tip after landing, so REPO_ROOT's
# intentions/<id>.md is the PRE-transition body by the time we get here.
#
# Best-effort by design: every failure is swallowed (`|| return 0`). The
# primitive itself fails LOUD; the fail-open policy lives here, at the caller.
refresh_stamp() {
  (cd "$REPO_ROOT" && node --import tsx/esm "$UTIL_SCRIPTS/restamp-scope-fingerprint.ts" \
    --repo-root "$REPO_ROOT" --main-root "$MAIN_ROOT" --from-rev origin/main \
    "$NODE_ID") >/dev/null 2>&1 || return 0
}
```

Notes for the implementer:
- `UTIL_SCRIPTS` is already defined at `transition-node:52` as
  `$REPO_ROOT/packages/intentionsutil/scripts`; `MAIN_ROOT` at `transition-node:51`. The
  `node --import tsx/esm "$UTIL_SCRIPTS/<script>.ts"` invocation form matches how this same
  script already calls `compute-freshness.ts` (`transition-node:132`) and
  `apply-node-transition.ts` (`transition-node:162`).
- The stamp path is unchanged: `$MAIN_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint`
  (the `stamp_file` local at `transition-node:86` and `STAMP_FILE` at `transition-node:131`
  are the same path; the new call reproduces it inside `writeScopeStamp`). The local
  `stamp_file` variable in `refresh_stamp` goes away with the old body.
- Do **not** add a `git fetch` before the restamp. A successful `graph-commit` land ends with
  `git push origin "$sha:main"` (`packages/intentionsutil/scripts/graph-commit:718-775`),
  which updates the local `refs/remotes/origin/main` tracking ref (verified empirically); and
  a no-op `graph-commit` still fetched at `graph-commit:256`/`:466`. An extra fetch here buys
  nothing and risks the known ref-lock-stealing hazard.
- The call site (`transition-node:183`, `refresh_stamp` after the `graph-commit` at
  `transition-node:178`) does not move.

Out of scope: everything else in `transition-node` — the freshness gates, the `main-qa`
scope-stale guard at `transition-node:144`, the `MUTATED`/rollback trap at
`transition-node:113-127`, and the auto-merge arming at `transition-node:186-193`.

**Recommended model:** sonnet

**Dependencies:** Unit 1.

---

## Unit 3 — End-to-end regression case: the reset-dance must not poison the stamp

**Scope**

Single file: `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh`
(currently 4 cases; add a fifth, appended before the final
`echo "passed: $PASS  failed: $FAIL"` block at the end of the file). This harness stands up a
throwaway bare origin plus a real clone with the real `packages/intentionsutil/src` copied in
and a `node_modules` symlink, so the real TS primitives execute for real; see its header
comment (`test-graph-write-rollback.sh:1-40`) and helpers `new_origin`,
`build_seed_repo`, `init_and_push`, `clone_with_node_modules` (`:60-115`), `ok`/`no`
(`:56-58`). Case 1 (`:118-160`) is the shape to clone.

**Harness prerequisite:** add
`cp "$UTIL_SCRIPTS_SRC/restamp-scope-fingerprint.ts" "$dst/packages/intentionsutil/scripts/restamp-scope-fingerprint.ts"`
to `build_seed_repo` (`test-graph-write-rollback.sh:74-93`), next to the existing
`apply-node-transition.ts` / `compute-freshness.ts` copies. Without it Unit 2's call resolves
to nothing and the new case silently proves the wrong thing. (`src/` is already copied
wholesale via `cp -r`, so `frontmatter.ts`, `store.ts`, `router.ts`, `transitions.ts` are
present.)

**The graph-commit stand-in.** The real `graph-commit` cannot run offline: `try_land`
(`packages/intentionsutil/scripts/graph-commit:718-775`) pushes a `graph/**` scratch branch and
blocks in `await_checks` waiting for GitHub to stamp four required contexts. So this case needs
a *faithful stub* — not the existing `fail_graph_commit` helper — that reproduces exactly the
observable sequence the bug depends on. Add a sibling helper next to `fail_graph_commit`
(`test-graph-write-rollback.sh:117-124`), e.g. `landing_graph_commit <dir>`, writing a stub that:

1. Parses `-C <dir> -m <msg> <id>` (the invocation at `transition-node:178`; the stub can
   simply take the last argument as the id and ignore `-m`).
2. `ORIG_HEAD=$(git rev-parse HEAD)`; copy `intentions/<id>.md` to a temp file.
3. `git fetch -q origin main`; `git reset --hard FETCH_HEAD` — emulating
   `ensure_intentions_only_base()` (`graph-commit:459-480`).
4. Copy the temp file back over `intentions/<id>.md`; `git add`; `git commit -q`;
   `git push -q origin HEAD:main` — the land.
5. `git reset --hard "$ORIG_HEAD"` — emulating `cleanup()` (`graph-commit:311-321`). Note this
   is the whole point of the case, and note step 5 runs with **no post-push fetch**, matching
   the real script, so the case also proves the push updated the local `origin/main` tracking
   ref that Unit 2 relies on.
6. `exit 0`.

Add a stub-header comment stating why the real `graph-commit` is not used (offline check
stamping) and that the stub's contract is exactly steps 3-5 above.

**Case 5 setup.**
- `new_origin t5`; `build_seed_repo "$T5"`; copy in `transition-node` and mark it executable
  (mirroring Case 1 at `:120-122`).
- Seed `intentions/t-stamp.md` at `phase: qa` with `execution` carrying a branch and a `pr`
  (the frontmatter shape Case 1 uses, plus `phase: qa`; if `writeNode` validation rejects a
  hand-written `execution`, use `null` — `apply-node-transition` supplies
  `defaultExecution`). Body: a plain `# ...` heading, **no** residue section. `init_and_push`.
- `clone_with_node_modules "$C5"`; `landing_graph_commit "$C5"`.
- Make the clone **far ahead with non-intentions changes** (so the state matches a real
  node-lane PR-branch worktree): create and commit a file outside `intentions/` on a branch,
  e.g. `git -C "$C5" checkout -qb t-stamp`, write `src-change.txt`, commit. Do not push it.
- Seed the phase-start stamp the way `provision-node-worktree` would
  (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:83-100`): compute
  `tacticScopeFingerprint(statement, body)` over the **origin/main** copy via a one-line
  `node --import tsx/esm -e` in the clone, and write
  `"<fp> $(git rev-parse origin/main)"` to `$C5/.claude/worktrees/t-stamp.scope-fingerprint`.
  (`resolve_project_root` — `.claude/skills/dispatch-propagate/scripts/lib.sh:1837-1841` —
  resolves `MAIN_ROOT` to the clone root here, since the clone's git-common-dir is
  `$C5/.git`.) This makes the pre-transition freshness gate correctly report
  `scopeStale=false`.
- Append the `## needs-main residue` section to `$C5/intentions/t-stamp.md` and **leave it
  uncommitted** — exactly what `/qa-fix` Step 3.6 does
  (`.claude/skills/qa-fix/SKILL.md:340-355`).

**Case 5 run and assertions.** Run
`cd "$C5" && bash .claude/skills/dispatch-propagate/scripts/transition-node t-stamp`, then assert
all of:

1. `rc -eq 0` and stdout matches `transitioned t-stamp qa -> review` (`forwardPhase`
   routes `qa → review` unconditionally — `packages/intentionsutil/src/transitions.ts`;
   residue only affects the *later* `review` hop, which routes to `main-qa` when residue
   is present and `done` otherwise). Corrected 2026-07-27 `/align-strategy`: this
   assertion previously read `qa -> main-qa`, citing a `qa → main-qa` edge that
   `forwardPhase` has never had — `main-qa` is post-merge by definition and is not
   reachable from `qa`. The implementer wrote the correct value, so the shipped test
   asserts `qa -> review` and no code is affected; only this plan text was wrong.
2. **The trap actually fired** (guards the test against silently not reproducing the bug):
   `git -C "$C5" show origin/main:intentions/t-stamp.md` contains `needs-main`, while the
   working-tree `$C5/intentions/t-stamp.md` does **not** — i.e. the reset dance really did
   revert the local copy.
3. **The fix**: extract `intentions/` from `origin/main` into a temp dir with the existing
   idiom `git archive origin/main intentions | tar -x -C "$SNAP"` (the same call
   `transition-node:128` uses), then run
   `node --import tsx/esm packages/intentionsutil/scripts/compute-freshness.ts t-stamp --snapshot "$SNAP/intentions" --stamp "$C5/.claude/worktrees/t-stamp.scope-fingerprint"`
   and assert the JSON has `.scopeStale == false` and `.stampMissing == false`. This is the
   behavioural assertion that matters — it is precisely the computation
   `dispatch-graph-scope-sweep` performs before demoting.
4. Belt-and-braces: the stamp file's second field equals `git -C "$C5" rev-parse origin/main`.

Confirm the case FAILS assertion 3 when Unit 2 is reverted (run it once against the old
`refresh_stamp` to prove the test has teeth) before finishing.

Out of scope: modifying Cases 1-4, the `fail_graph_commit` helper, or any other test script.

**Recommended model:** opus

**Dependencies:** Units 1 and 2.

---

## Reuse

- `tacticScopeFingerprint(statement, body)` — `packages/intentionsutil/src/router.ts:109`.
  The single hash function. Unchanged; only its *content source* moves.
- `restampScope(intentionsDir, repoRoot, mainRoot, id)` —
  `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:71-90`. Signature and disk
  semantics preserved; refactored to delegate to the new `writeScopeStamp`.
- `extractFrontmatter(raw, id)` / `extractBody(raw, id)` —
  `packages/intentionsutil/src/frontmatter.ts:12` and `:29`. Pure, fs-free content-string
  parsers already used this way by `digest.ts`. The raw-text path uses these directly.
- `readNode` / `readNodeBody` — `packages/intentionsutil/src/store.ts:101` and `:114`. `readNode`'s
  parse half is extracted as `parseNodeRaw`; no behaviour change to either export.
- `parseScopeStamp(content)` — `packages/intentionsutil/src/transitions.ts:287-296`. Canonical
  `<fingerprint> <sha>` parser; use it in test assertions rather than re-deriving the split.
- `isScopeStale(stamp, fingerprint)` — `packages/intentionsutil/src/transitions.ts:331-334`.
  The consumer whose verdict the fix must flip; unchanged.
- `hasNeedsMainResidue(body)` — `packages/intentionsutil/src/transitions.ts:222-232`. Use to
  build a realistic residue fixture in Unit 1's tests.
- `compute-freshness.ts` — `packages/intentionsutil/scripts/compute-freshness.ts`. Reused
  as-is as the Unit-3 oracle (`--snapshot <origin/main intentions> --stamp <file>`).
- `git archive origin/main intentions | tar -x -C "$SNAP_DIR"` — the snapshot idiom at
  `.claude/skills/dispatch-propagate/scripts/transition-node:128`. Reused verbatim in Unit 3.
- `build_seed_repo` / `new_origin` / `init_and_push` / `clone_with_node_modules` / `ok` / `no` —
  `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh:56-115`. Unit 3's
  harness helpers.
- Existing test style for the stamp file's exact `<fingerprint> <sha>\n` content —
  `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts` (104 lines). Mirror it.
- `resolve_project_root` — `.claude/skills/dispatch-propagate/scripts/lib.sh:1837-1841`.
  Already used at `transition-node:51` for `MAIN_ROOT`; unchanged.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --app packages/intentionsutil
```

CLI smoke — both modes still parse, and the unknown-flag rejection survives the new flag:

```verify
npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts --help
```

Manual / judgment checks:

- **Prove the test has teeth.** Before finishing Unit 3, stash the Unit-2 edit (restore the
  original `refresh_stamp` body) and re-run `test-graph-write-rollback.sh`. Case 5 assertion 3
  (`scopeStale == false`) must FAIL, and Case 5 assertion 2 must still PASS (the trap fires
  either way). Then restore Unit 2 and confirm all five cases pass. A Case 5 that passes on
  the unfixed code proves nothing and must be reworked.
- **No behavioural drift in the align lane.** The three existing `restampScope` tests in
  `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts` must pass unmodified — the
  disk mode and its fail-loud contract are unchanged. Do not edit them to accommodate the
  refactor; if one fails, the refactor is wrong.
- **Header-comment truthfulness.** Re-read
  `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:16-25` after the change and
  confirm no sentence still claims the script does not modify or share with `transition-node`.
- **Observe in production (post-merge, main-qa).** After this lands, the next node-lane
  `/qa-fix` pass that appends a `## needs-main residue` section should leave the node at
  `phase: main-qa` and survive the following `dispatch-graph-scope-sweep` tick without
  demotion. Confirm by checking that the node's `execution.markers` still contain `qa-done`
  and `planned` (not `[]`) and its `phase` is still `main-qa` on `origin/main` one tick after
  the transition — via
  `git show origin/main:intentions/<id>.md`. A demotion back to `implement` with emptied
  markers is the regression signature.
