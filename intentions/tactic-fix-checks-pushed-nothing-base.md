---
id: tactic-fix-checks-pushed-nothing-base
kind: tactic
statement: "fix-checks node-lane: the pushed-nothing completion branch still
  runs graph-commit without --base CAS — extend the write-recipes-base-cas
  pattern to that branch"
owner: ai
status: codified
parent: null
rationale: "Residual of tactic-graph-write-recipes-base-cas: its Unit 1 fixes
  the record-push completion recipe, but the branch that pushed nothing still
  graph-commits stale-unguarded (sites near
  .claude/skills/fix-checks/SKILL.md:108 and :122 as of 2026-07-23). Dedup
  against that node PR #2939 landed scope at finalization. Planned 2026-07-30 by
  the dispatch-pipeline bootstrap through a parallel Workflow fan-out rather
  than an /align-tactics round, so that skill's two-sided drift review and its
  census were bypassed (deliberate: ten concurrent align rounds would mean ten
  concurrent graph-commits, the exact hazard the bootstrap exists to avoid).
  Each plan was authored against the node's own cited code and then
  independently verified by a second agent; all reported citation and substance
  gaps were applied before landing. A later /align-tactics round should treat
  this body as unreviewed by the normal path."
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
phase: done
execution:
  branch: tactic-fix-checks-pushed-nothing-base
  pr: 2987
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-30T20:11:16Z
    mergeCommitSha: c267a8232a10dce1bbaba90c63f29d78146a6303
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fix-checks node-lane: the pushed-nothing completion branch still runs graph-commit without --base CAS — extend the write-recipes-base-cas pattern to that branch

## Context

`graph-commit` (`packages/intentionsutil/scripts/graph-commit`) does **whole-file
replacement** of `intentions/<id>.md`: the bytes it lands are whatever is on disk
when it starts. A completion recipe that reads/mutates/writes the LOCAL node file
without first refreshing it from `origin/main` therefore silently reverts any
sibling frontmatter field another writer landed in the meantime — no textual
conflict, no error. The fixing primitive is `graph-commit --base <id>=<blobsha>`,
an opt-in compare-and-swap that re-checks the blob against `origin/main`
(`packages/intentionsutil/scripts/graph-commit:277-327`, `check_base_freshness`)
and either three-way-merges or parks instead of clobbering. The canonical caller
shape is `packages/intentionsutil/scripts/park-node`: fetch → resolve
`FRESH_BLOB` → overwrite the local file from `origin/main` → mutate →
`graph-commit --base`.

This node was filed as the residual of `tactic-graph-write-recipes-base-cas`. That
tactic's plan fixed the fix-checks node-lane **record-push** recipe and explicitly
declared the **pushed-nothing** branch out of scope.

**Verified 2026-07-30 against `origin/main` (`b552dfa2`): the residual is already
closed.** PR #2939 (merge commit `c063f490`, "Graph-write completion recipes:
CAS-guard fix-checks and transition-node") applied the fetch → `FRESH_BLOB` →
refresh → `--base` pattern to **both** branches, going beyond its own plan's
stated scope. Current state of `.claude/skills/fix-checks/SKILL.md` (line numbers
drift — locate by the bullet text):

- Record-push recipe — bullet "**If this iteration pushed a commit**" at line 132,
  bash block at lines 141-162; guard at `:143-154`, `--base "$N=$FRESH_BLOB"` at
  `:160`.
- Pushed-nothing recipe — bullet "**If this iteration pushed NOTHING**" at line
  164, bash block at lines 171-189; guard at `:172-183`, `--base
  "$N=$FRESH_BLOB"` at `:187`.

The node's own citations (`:108` and `:122`, dated 2026-07-23) have drifted to the
blocks above; the recipe text they pointed at now carries the guard.

**So the code edit named by this node's statement is a no-op today. What is still
missing is durability.** `tactic-graph-write-recipes-base-cas`'s Unit 3 built a
regression harness for `transition-node` only and explicitly declined one for the
fix-checks recipes ("it is a SKILL.md-documented bash snippet, not an executable
script, so it has no direct test surface"). The pushed-nothing branch's guard was
added incidentally, against its own plan's out-of-scope note, so nothing in the
repo records it as intentional and nothing detects its removal: a future edit that
drops `--base` or the refresh from either recipe leaves every CI check green, and
the silent-clobber path (observed 2026-07-22 on `tactic-thin-oversized-skill-bodies`,
PR #2927, where a `pushed_sha` write reverted a `blocked_by` edge) comes back.

Intended outcome: (a) confirm the guard is still present, restoring it if it has
regressed since this verification, and (b) make it a mechanical ratchet in the
existing doctrine-guard style already used in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, so the
pattern cannot silently leave the file again.

If a reviewer judges the ratchet unwanted, the correct alternative disposition is
to prune this node as absorbed by PR #2939 — do **not** open an empty PR. Pruning
is safe for the three prose references to this id in
`intentions/tactic-qa-main-park-base-cas.md`: `validate-graph`'s prose-ref pass
resolves references to pruned nodes via `deletedNodeIds`
(`packages/intentionsutil/scripts/lib-deleted-node-ids.ts`), and no node carries a
`blocked_by` edge to this id (checked 2026-07-30).

## Unit 1 — Re-verify the CAS pattern on both node-lane completion recipes

**Recommended model**: sonnet

**Scope.** Read-only check of `.claude/skills/fix-checks/SKILL.md`, plus a
conditional repair. Run from the worktree root:

```bash
S=.claude/skills/fix-checks/SKILL.md
for k in 'FRESH_BLOB="$(git rev-parse "origin/main:intentions/$N.md"' \
         'git show "origin/main:intentions/$N.md" > "intentions/$N.md"' \
         '--base "$N=$FRESH_BLOB"'; do
  printf '%s => %s\n' "$k" "$({ grep -cF -- "$k" "$S" || true; })"
done
```

Each key must report **2** (one occurrence in each of the two completion recipes).
That was the measured state on `origin/main` at `b552dfa2` on 2026-07-30.

- **All three report 2 (expected)** — no edit to `SKILL.md`. This unit contributes
  no diff; go straight to Unit 2.
- **Any key reports fewer than 2** — the guard regressed after this plan was
  written. Restore it by copying `park-node`'s inline shape
  (`packages/intentionsutil/scripts/park-node`, its fetch / `FRESH_BLOB` /
  `git show` / `graph-commit --base` sequence) into the deficient recipe, so the
  block reads:

  ```bash
  if ! git fetch origin main >&2; then
    echo "fix-checks: could not fetch origin/main to refresh $N before recording the attempt" >&2
    exit 1
  fi
  if ! FRESH_BLOB="$(git rev-parse "origin/main:intentions/$N.md" 2>/dev/null)"; then
    echo "fix-checks: intentions/$N.md does not exist on origin/main — cannot refresh a node that is not landed" >&2
    exit 1
  fi
  if ! git show "origin/main:intentions/$N.md" > "intentions/$N.md"; then
    echo "fix-checks: could not refresh intentions/$N.md from origin/main" >&2
    exit 1
  fi
  node --import tsx/esm packages/intentionsutil/scripts/apply-fix-state.ts \
    "$N" --spend-attempt
  packages/intentionsutil/scripts/graph-commit \
    --base "$N=$FRESH_BLOB" \
    -m "graph: record fix attempt (no push) on $N" "$N"
  ```

  (The record-push recipe is identical plus `HEAD_SHA=$(git rev-parse HEAD)`
  captured **before** the refresh, a second `apply-fix-state.ts "$N" --record-push
  "$HEAD_SHA"` call, and the `record fix attempt + push $HEAD_SHA on $N` message.)
  Hard-error on a missing node rather than falling back to the local copy — a node
  under an active CI-fix interrupt is landed by definition
  (`.claude/rules/code-style.md`).

**Out of scope.**

- `packages/intentionsutil/scripts/apply-fix-state.ts` — field-precise and
  correctly git-blind; the refresh responsibility belongs in the SKILL.md recipe,
  exactly as `park-node` keeps it in its bash wrapper.
- The three other `graph-commit` invocations in this file, all in Step 4's flake
  sub-path — `SKILL.md:636` (brand-new flake node, no `--base`), `:661`
  (`--base "$BASE"` from `dump-node.ts`), `:716` (`--base "$BASE_N"`). Checked
  2026-07-30: none is a silent-clobber path. `:661`/`:716` already pass a `--base`
  manifest, and a stale manifest fails closed (CAS mismatch → layer-3 merge or
  park), never a silent revert. `:636` creates a file that does not exist on
  `origin/main`; a same-id concurrent mint produces an add/add rebase conflict
  inside `graph-commit`, not a silent overwrite — and `graph-commit`'s
  `add_base_pair` (`packages/intentionsutil/scripts/graph-commit:231-239`) rejects
  an empty blob sha, so there is no "must not exist" base sentinel to pass anyway.
  Adding one is a `graph-commit` feature change, not this node's scope.
- The auto-mode classifier denial of `graph-commit --base` measured 2026-07-30 —
  tracked by `tactic-qa-main-park-base-cas` (its half (ii)), which explicitly
  considers splitting it out as a shared prerequisite. Do not duplicate it here.

**Reuse.**

- `packages/intentionsutil/scripts/park-node` — the canonical fetch → `FRESH_BLOB`
  → refresh → mutate → `graph-commit --base` inline pattern. Copy its shape; do
  not extract a shared helper (none exists and `park-node` does not use one).
- `.claude/skills/fix-checks/SKILL.md:141-162` — the record-push recipe, already
  correct, is the in-file template for the pushed-nothing recipe.

## Unit 2 — Ratchet the CAS pattern in `test-dispatch-scripts.sh`

**Recommended model**: sonnet

**Dependencies**: Unit 1 (the assertion must match the file's actual, verified
state).

**Scope.** One new test section appended to
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, immediately
**before** its final summary block (the last lines of the file are a `# =====` /
`# summary` / `# =====` comment banner followed by a bare `report_results` call;
the file is ~33,433 lines, so locate the anchor by `grep -n '^report_results$'`
rather than by line number).

Model the block directly on the existing doctrine ratchet in the same file, the
"dispatch chain: no EnterWorktree/ExitWorktree mid-session" section (find it with
`grep -n 'no EnterWorktree/ExitWorktree mid-session'`, currently around line
20931): a banner comment explaining WHY, a repo-root computation, a fixed-string
`grep` count per key, and `assert_eq` per key. That block requires no PATH shims
and calls neither `setup` nor `teardown`; neither does this one.

The block must:

1. Compute its own repo root rather than depending on the earlier section's
   variable: `FIXCHECKS_GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)`.
   `SCRIPT_DIR` is set at the top of the harness to
   `.claude/skills/dispatch-propagate/scripts`, four levels below the repo root.
2. Fail loudly if `.claude/skills/fix-checks/SKILL.md` is missing (mirror the
   chain-guard's `[[ ! -f ... ]]` branch, which increments `TOTAL`/`FAIL` and
   prints a FAIL line).
3. Assert an exact count of **2** for each of these three **fixed** strings in
   that file. Single-quote each in bash so `$N`, `$(` and the embedded double
   quotes stay literal, and guard `grep -c` under `set -e` (a zero-match `grep`
   exits 1):

   - `--base "$N=$FRESH_BLOB"`
   - `FRESH_BLOB="$(git rev-parse "origin/main:intentions/$N.md"`
   - `git show "origin/main:intentions/$N.md" > "intentions/$N.md"`

   e.g. `actual=$({ grep -cF -- '--base "$N=$FRESH_BLOB"' "$SKILL" || true; })`.
4. Assert an exact count of **5** for `packages/intentionsutil/scripts/graph-commit`
   in that file (2 completion-seam invocations + the 3 flake-path ones listed as
   out of scope in Unit 1). This is the tripwire that makes a **new**
   `graph-commit` call site force a deliberate revisit of the guard.
5. Carry a comment above the assertions stating: the two node-lane completion
   recipes must refresh `intentions/$N.md` from `origin/main` and pass
   `graph-commit --base`; `graph-commit` does whole-file replacement, so an
   unpinned write from a stale worktree silently reverts sibling frontmatter
   (observed 2026-07-22 on PR #2927); the pattern was landed by PR #2939 and is
   tracked by `tactic-graph-write-recipes-base-cas` and
   `tactic-fix-checks-pushed-nothing-base`. Say explicitly what to do when a count
   legitimately changes: update the expected number **and** confirm every recipe
   still carries the full refresh + `--base` sequence — never lower a count to
   make the suite green.

All measured counts above were confirmed on the worktree at `b552dfa2`
(2026-07-30). Re-measure with the Unit 1 command before writing the literals; if
Unit 1 had to repair the file, the counts should then match these values anyway.

**Out of scope.**

- No change to `.github/workflows/unit-tests.yml`. `test-dispatch-scripts.sh` is
  already wired into the `hook-tests` job (`unit-tests.yml:198-199`, "Run dispatch
  script tests"), so the new section runs in CI with no workflow edit.
- No new test file, and no new rule in
  `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` — that linter is
  scoped to net-new added lines in shell scripts and would not see a `--base`
  *removal* from a Markdown file.
- No scan of `.claude/skills/fix-checks/references/*.md`: that directory does not
  exist today. If a future thinning splits the completion seam out of `SKILL.md`,
  the count assertions will fail and force the guard to be widened then — which is
  the intended ratchet behavior.

**Reuse.**

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — its
  `assert_eq` helper (defined near the top, ~line 27) and the
  `CHAIN_GUARD_EXPECTED` doctrine-ratchet section (~line 20931) as the structural
  template, including the missing-file branch and the `grep`-count idiom.
- `.github/workflows/unit-tests.yml:184-199` — the `hook-tests` job that already
  runs this harness.

## Verification

Baseline before the change, measured 2026-07-30 on `b552dfa2`:
`test-dispatch-scripts.sh` reports `3219/3219 passed, 0 failed`. After Unit 2 the
count must rise by exactly the number of assertions added (4 with the four keys
above) with zero failures.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh || exit 1
.claude/skills/dispatch-propagate/scripts/run-lint.sh || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual / judgment checks:

- **Prove the ratchet is load-bearing.** In the working tree, temporarily delete
  the ` --base "$N=$FRESH_BLOB" \` line from the pushed-nothing recipe in
  `.claude/skills/fix-checks/SKILL.md`, re-run
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, and
  confirm the new assertion FAILS (expected 2, actual 1). Restore the line and
  confirm the suite returns to green. Do not commit the mutated file. Without this
  step a guard that greps for the wrong string passes vacuously and protects
  nothing — the same mutation check `tactic-graph-write-recipes-base-cas`'s Unit 3
  used.
- **Confirm the completion recipe is still executable prose.** Read both bash
  blocks end to end and check that `HEAD_SHA` is captured *before* the refresh
  overwrites `intentions/$N.md` (the refresh must not be able to change the sha
  being recorded), and that the recipe path is
  `packages/intentionsutil/scripts/graph-commit` — the pre-#2939 text named
  `.claude/skills/dispatch-propagate/scripts/graph-commit`, which does not exist.
- **Do not attempt a live two-writer race.** These recipes are SKILL.md prose
  executed by a `/fix-checks` worker, not a script with a callable entry point;
  the equivalent race is already covered mechanically by
  `packages/intentionsutil/scripts/test-park-node.sh`,
  `packages/intentionsutil/scripts/test-transition-node.sh`, and
  `packages/intentionsutil/scripts/test-graph-commit.sh`, all green in the
  `hook-tests` job.
