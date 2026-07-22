---
id: tactic-graph-commit-cwd-repo-resolution
kind: tactic
statement: graph-commit resolves its target repo from the caller's cwd, not the
  invoked script's checkout, so a worktree invocation never silently commits the
  primary checkout.
owner: ai
status: codified
parent: null
rationale: "Surfaced live in a 2026-07-21 office-hours drain: clearing a park
  via the emulated clear-park sequence, graph-commit was invoked as
  `../../../packages/intentionsutil/scripts/graph-commit` from inside a
  worktree. Because graph-commit derives REPO_ROOT from the invoked script's own
  location, the `../../../` path resolved to the primary checkout's copy of the
  script, so it staged the primary checkout (where the edit did not exist),
  printed `no new changes to stage ... landing current HEAD`, and falsely
  reported `landed`. The worktree edit stayed uncommitted, leaving the FORBIDDEN
  still-parked terminal state despite a success message. A localized
  tool-correctness defect in the sanctioned graph-write path."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-commit-cwd-repo-resolution
  pr: 2938
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit target-repo resolution

## Context

`graph-commit` (`packages/intentionsutil/scripts/graph-commit`) resolves the
repo it operates on from the **physical location of the script file**, not
from the caller:

- `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` (line 85)
- `REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"` (line 86), then
  `cd "$REPO_ROOT"` as the first line of `main()` (line 1002).

Because the script cd's to its own three-parents-up directory and stages
`intentions/<id>.md` there (`commit_files()`, lines 495-499), *which repo gets
committed is fixed by which on-disk copy of the file was invoked* — the
primary checkout's copy vs. a worktree's own copy — regardless of the
caller's shell cwd. A session working in worktree A that invokes the primary
checkout's `graph-commit` (e.g. via a `../../../`-climbing path, or a
`$SCRIPT_DIR` that points at the primary copy) silently commits the
**primary checkout**, then prints `graph-commit: landed <id> on main`
(message constructed line 1140, emitted line 1144) as if it had committed the
intended worktree. The failure is silent: no error, a success message, wrong
repo. Live incident: see `rationale`, above.

**Intended outcome.** `graph-commit` derives its target repo from the caller
— cwd by default, or an explicit `-C <path>` / `--repo <path>` override —
never from the script's own location. Sibling-script lookups keep using
`$SCRIPT_DIR`. When asked to commit `<id>` but the resolved repo has no
staged change for it, a fail-loud guard distinguishes a benign
already-landed case from a wrong-repo case, so a mis-targeted invocation
errors instead of printing a false "landed".

**Audit result (Unit 1).** 19 call sites exist. 6 are real script/CLI sites;
of those, 4 need an explicit `-C` added and 2 are already correct. 11
SKILL.md sites already run from the correct worktree per skill doctrine and
need no code change (cwd-derivation makes their existing correctness
explicit rather than accidental). 2 are throwaway-clone test invocations.

**Sibling defect, explicitly OUT OF SCOPE.**
`packages/intentionsutil/scripts/dump-node.ts:33-35` derives its own
`repoRoot` from `import.meta.url` — the identical bug class — but the
author-approved greenfield design names only `graph-commit`. Do **not** fix
it here and do **not** expand any unit to cover it. Worth a follow-up tactic
(sibling defect: dump-node.ts self-location repo resolution).

**Design decisions (author-approved 2026-07-21, do not re-litigate).**

1. Derive `REPO_ROOT` from the caller: `git -C <resolved> rev-parse
   --show-toplevel` where `<resolved>` is the `-C`/`--repo` argument when
   given, else cwd. Keep `$SCRIPT_DIR` for locating sibling scripts
   (`store.js`, `merge-node.ts`) only. If cwd is not inside a git repo and no
   `-C` was given, error clearly (`.claude/rules/code-style.md`: prefer clear
   errors over defensive fallbacks) — never fall back to the script's own
   checkout.
2. Fail-loud guard: when there is no staged change for `<id>`, compare the
   resolved repo's `<id>` blob against origin/main. Equal → benign (already
   landed out-of-band — see memories `qa-fix-content-on-main-outofband-close-pr-done`,
   `graph-tick-outofband-merge-mainqa-absorption`), proceed. Differing →
   error, do not print "landed". With design #1 in place this residual case
   only arises from a mis-pointed `-C`.

## Unit 1 — Confirm audit scope and fix the stale-path doc bug

**Scope.** No behavior change to `graph-commit`. Two deliverables:

1. Re-confirm the 6 real call sites still match their cited anchors (guards
   against drift between planning and execution):
   - `packages/intentionsutil/scripts/demote-node-to-implement:77` —
     `"$SCRIPT_DIR/graph-commit" -m "$MSG" "$NODE_ID"` (no global `cd`;
     relies on graph-commit's internal cd).
   - `packages/intentionsutil/scripts/park-node:98` —
     `"$SCRIPT_DIR/graph-commit" --base "$NODE_ID=$FRESH_BLOB" -m "..."
     "$NODE_ID"`.
   - `.claude/skills/dispatch-propagate/scripts/transition-node:154` —
     `"$GRAPH_COMMIT" -m "..." "$NODE_ID"` (NOT `cd`-wrapped, unlike siblings
     at 77, 88-89, 109, 113, 138).
   - `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:118` —
     `"$GRAPH_COMMIT" "${GC_ARGS[@]}"` (NOT `cd`-wrapped, unlike siblings
     in-file).
   - `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:120-122`
     — already `(cd "$REPO_ROOT" && "$GRAPH_COMMIT" ...)` — already correct.
   - `.claude/skills/dispatch-propagate/scripts/graph-select-target:215` —
     `_graph_commit_fix()` already `(cd "$NATIVE_ROOT" &&
     packages/intentionsutil/scripts/graph-commit ...)` — already correct,
     has deliberate native-main-worktree resolution; do not touch.
2. Fix the stale-path documentation bug at
   `.claude/skills/fix-checks/SKILL.md:99`, which references
   `.claude/skills/dispatch-propagate/scripts/graph-commit` — a path
   confirmed absent on disk (the only real `graph-commit` is
   `packages/intentionsutil/scripts/graph-commit`). Correct the path.

**Decision (sole-tracker guidance).** Fix the stale path **here, in this
unit**, rather than filing a separate tactic. Rationale: it is a zero-design
one-line documentation correction discovered during this tactic's own audit,
and spinning up a tracked node for a one-liner costs more than it returns.
It carries no behavioral risk and belongs with the audit that found it.

**Out of scope.** No change to `graph-commit` itself; no change to the 11
doctrine-correct SKILL.md sites; no `dump-node.ts` change.

**Recommended model.** sonnet — mechanical verification plus a one-line doc
fix.

## Unit 2 — Core `graph-commit` change: `-C`/`--repo` flag, cwd-derivation, and fail-loud guard

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

**(a) Caller-derived `REPO_ROOT`.**
- Split the current script-location resolution (lines 82-91, comment at
  82-84 explicitly documenting "never from cwd" — that comment must be
  rewritten). Keep `SCRIPT_DIR` (line 85) exactly as-is — it must continue to
  locate sibling scripts: `STORE_MODULE`/`store.js` (line 89),
  `MERGE_NODE_SCRIPT`/`merge-node.ts` (line 91). **Only** `REPO_ROOT` (line
  86) and its derivative `INTENTIONS_DIR` (line 87) move to
  caller-derivation.
- Add a `-C|--repo)` case to the option-parsing `while` loop in `main()`
  (lines 1006-1019: currently handles `-m|--message`, `--prune`, `--base`,
  `-h|--help`, `--`, unknown `-*`), modeled on the existing cases. Primary
  form `-C <path>`; `--repo <path>` as a long alias in the same case. Store
  into a `REPO_ARG` variable. **`-C` is the primary/canonical form** — the
  blocked consumer tactic `tactic-graph-commit-invocation-classifier-bypass`
  will write `permissions.allow` matchers against `graph-commit -C <path>
  ...`, so `-C` must be the documented, stable spelling.
- Because `REPO_ROOT` now depends on the parsed `-C` argument, it can no
  longer be a top-of-file constant resolved before `main()` runs. Resolve it
  **inside `main()` after option parsing, before the `cd`**: set
  `RESOLVE_FROM="${REPO_ARG:-$(pwd)}"`, then `REPO_ROOT="$(git -C
  "$RESOLVE_FROM" rev-parse --show-toplevel)"`. If that `git rev-parse`
  fails (cwd/`-C` not inside a git repo), `die` with a clear message naming
  the resolved-from path and stating that `-C <path>` is required when not
  run from inside the target repo — **never** fall back to
  `$SCRIPT_DIR/../../..`. Then set `INTENTIONS_DIR="$REPO_ROOT/intentions"`
  and `cd "$REPO_ROOT"` (the existing `cd` currently at line 1002 moves to
  after this resolution). The current line 1002 `cd "$REPO_ROOT"` is the
  *first* line of `main()`, before option parsing — the reorder must ensure
  `cd` happens *after* parse+resolve. Anything before the `cd` that reads
  `REPO_ROOT`/`INTENTIONS_DIR` must be checked and moved below the
  resolution.

**(b) Fail-loud guard.** In the "nothing to stage" branch — the `else` at
line 1132, reached when `id_files_dirty` is false — replace the
unconditional "no new changes / landing current HEAD" message-then-proceed
with a per-id guard, for each id in `ALL_IDS`:
- Compare the resolved repo's committed blob for `intentions/<id>.md`
  against origin/main. Use the `FETCH_HEAD:` idiom, matching
  `check_base_freshness()` (lines 216-285), which already runs `git fetch
  origin main` at line 238 and reads `FETCH_HEAD:<path>` at lines 243-247. A
  fetch has already happened earlier in `main()`'s flow before this branch
  (`check_base_freshness` runs before `ensure_intentions_only_base`, which
  precedes the `id_files_dirty` check) — do not add a second fetch.
- Compute `LOCAL_BLOB="$(git rev-parse "HEAD:intentions/<id>.md"
  2>/dev/null)"` and `MAIN_BLOB="$(git rev-parse
  "FETCH_HEAD:intentions/<id>.md" 2>/dev/null)"`.
- Equal → benign (already landed out-of-band); keep the existing
  informational message (line 1132) and proceed to `land`.
- Differ → `die` loudly: the resolved repo holds `<id>` content differing
  from origin/main but has nothing staged, which with design (a) in place
  can only mean a mis-pointed `-C`/wrong checkout. Do **not** reach the
  "landed" emission (lines 1140-1144).
- (`MAIN_BLOB` empty — id absent on origin/main — with nothing staged
  locally and a local blob present is also an anomaly; treat present-local
  vs absent-main as "differ" → error. If both absent, preserve current
  behavior.)

**Out of scope.** No change to the dirty-path (`commit_files`, lines
495-499) flow; no change to `land`/push/rebase logic; no new exit codes
beyond the guard's `die` (reuse the existing `die`/exit-2-class convention).
Callers are Unit 3; tests are Unit 4.

**Recommended model.** opus — judgment-heavy: the plan leaves the exact
reorder of `main()`'s `cd`/resolution and the audit of any pre-`cd`
`REPO_ROOT`/`INTENTIONS_DIR` reads to implementation time; the guard's
blob-comparison edge cases (absent-on-main, benign vs. wrong-repo) need
care; and this is a cross-cutting change to a load-bearing
concurrency-sensitive script.

**Dependencies.** None strictly, but implement after Unit 1 confirms scope.

## Unit 3 — Update the four internal script callers to pass explicit `-C`

**Scope.** Add an explicit `-C "$REPO_ROOT"` argument to the four script
call sites that invoke `graph-commit` without a `cd` into the target repo
and therefore relied on the old file-location resolution. Each of these
scripts already computes its own `$REPO_ROOT`, so the fix is mechanical:

1. `packages/intentionsutil/scripts/demote-node-to-implement:77` —
   `"$SCRIPT_DIR/graph-commit" -C "$REPO_ROOT" -m "$MSG" "$NODE_ID"`.
2. `packages/intentionsutil/scripts/park-node:98` — add `-C "$REPO_ROOT"`
   before `--base`.
3. `.claude/skills/dispatch-propagate/scripts/transition-node:154` — add
   `-C "$REPO_ROOT"` (this closes the real gap: every sibling call in-file
   `cd`-wraps, this one does not, so post-fix its target would otherwise
   depend on `transition-node`'s own launch cwd).
4. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:118` —
   add `-C "$REPO_ROOT"` to the `GC_ARGS` invocation (same gap as #3).

**Explicitly do not touch:**
- `dispatch-graph-census:120-122` — already `(cd "$REPO_ROOT" && ...)`;
  cwd-derivation covers it. (Optional simplification to drop the subshell
  `cd` in favor of `-C` is permitted but not required.)
- `graph-select-target:215` (`_graph_commit_fix`) — already correct with
  deliberate `NATIVE_ROOT` (main-branch worktree) resolution that must be
  preserved. Leave untouched.
- The 11 SKILL.md invocations (fix-checks:438,459,511; context-chunks:126;
  align-init:192; align-tactics:150,576-577; align-strategy:497-498;
  grounding-research:124; reading-review:579). These invoke `graph-commit`
  via the repo-root-relative path `packages/intentionsutil/scripts/graph-commit`
  from the worktree their own skill doctrine already established. Under
  design (a), "no `-C` = use my cwd," and cwd is already the correct
  worktree — so they need no change; the fix converts their
  accidental-via-script-location correctness into enforced-via-cwd
  correctness.
- The two indirect sites — `.claude/skills/implement/SKILL.md:91` and
  `.claude/skills/qa-main/SKILL.md:118-131` — invoke `transition-node` (#3
  above), not `graph-commit` directly, so they are covered by fixing #3.

**Out of scope.** SKILL.md literal-command edits (the 11 doctrine-correct
sites); test harness.

**Recommended model.** sonnet — four mechanical single-argument insertions
with an explicit diff shape.

**Dependencies.** Unit 2 (the `-C` flag must exist before callers pass it).

## Unit 4 — Test the fix and wire the harness into CI

**Scope.** `packages/intentionsutil/scripts/test-graph-commit.sh` and
`.github/workflows/unit-tests.yml`.

**(a) New regression case reproducing the original bug and asserting the
fix.** Extend the existing harness (953 lines, 22 cases documented lines
1-46). The harness builds a throwaway bare `origin.git` + clone and copies
the real script into the scratch clone at line 112 (`cp "$GC_SCRIPT"
"$SEED/packages/intentionsutil/scripts/graph-commit"`) so its self-location
resolution lands inside the scratch clone. The invocation helper `run_gc()`
(lines 403-413) cd's into the clone and runs `bash
packages/intentionsutil/scripts/graph-commit "$@"`. Add a case that
exercises caller-derived targeting from *outside* the clone's own tree:
- **Bug-repro / `-C` targeting:** invoke the copied script from an unrelated
  cwd (a second throwaway dir, or the harness's own cwd) with `-C
  <scratch-clone-path>`, and assert it stages/lands in the scratch clone —
  the scenario that silently hit the wrong repo pre-fix.
- **cwd-derivation:** invoke with no `-C` from inside the clone and assert
  unchanged behavior (regression guard on the default path).
- **No-repo error:** invoke with no `-C` from a non-git cwd and assert a
  clear non-zero error (never a silent fall-back to the script's own
  checkout).
- **Guard:** construct the "nothing staged but resolved-repo blob differs
  from origin/main" state and assert a loud error (no "landed"); construct
  the equal-blob already-landed-out-of-band state and assert benign
  proceed.

**(b) Update the existing Case 2 assertion.** Case 2 (idempotent re-run /
"nothing to stage" path, lines 431-437) asserts on the literal string `'no
new changes to stage'` — the message at line 1132. The guard (Unit 2b)
reshapes that branch; update this assertion so the benign already-landed
path still passes and the assertion matches whatever message the guard
keeps for the benign case. Do **not** weaken or delete the case — adjust it
to the new benign-path contract (`.claude/rules/test-integrity.md`).

**(c) Wire `test-graph-commit.sh` into CI.** `.github/workflows/unit-tests.yml`
runs `test-park-node.sh` (line 197) but does **not** run
`test-graph-commit.sh` anywhere (confirmed via repo-wide grep); today it
runs only by hand. Add a step invoking `bash
packages/intentionsutil/scripts/test-graph-commit.sh` alongside the
`test-park-node.sh` step.

**Decision.** Wire the harness into CI **as part of this tactic**, not as a
deferred follow-up. Rationale: this unit adds the exact case that
reproduces the silent-wrong-repo bug; if the harness never runs in CI, the
regression guard is inert and the tactic's durability claim is hollow.

**Out of scope.** No vitest/bats coverage (graph-commit is bash-only;
`packages/intentionsutil/package.json`'s `"test": "vitest run"` covers only
`.ts` scripts with `test/*.test.ts` siblings). No change to the harness's
copy-in mechanism beyond what the new case needs.

**Recommended model.** sonnet — test authoring with explicitly enumerated
cases plus a rote CI-step addition, against a well-understood harness.

**Dependencies.** Unit 2 (behavior under test). Prefer after Unit 3 so the
full-system state is final, but the harness copies the script in isolation,
so it can validate Unit 2 independently.

## Reuse

- **`-C <path>` flag convention** (git's own, pervasive here — model the new
  flag on it): `packages/intentionsutil/scripts/park-node:67,70,74`;
  `packages/intentionsutil/scripts/demote-node-to-implement:52`;
  `.claude/skills/dispatch-propagate/scripts/graph-select-target:162,168,190`.
  The test harness's git stub already implements `-C <path>` prefix
  detection at
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:6835`,
  confirming it is a first-class tested convention here.
- **`git rev-parse --show-toplevel`** (cwd-derived root; the design-(a)
  fallback): already used at
  `.claude/skills/dispatch-propagate/scripts/commit-merge-push:232` and
  `.claude/skills/dispatch-propagate/scripts/dispatch-escalate-sync-broken:105`.
- **Option-parsing shape** for the new `-C|--repo)` case: `graph-commit`'s
  own `-m`/`--prune`/`--base`/`-h` block, lines 1006-1019.
- **`FETCH_HEAD:<path>` blob-compare idiom** for the guard: `graph-commit`'s
  own `check_base_freshness()`, lines 216-285 (fetch at 238, `FETCH_HEAD:`
  read at 243-247). Mirror this rather than a bare `origin/main:` ref to
  avoid a second fetch. Related origin/main blob-compare precedents:
  `park-node:70`, `.claude/skills/dispatch-propagate/scripts/office-hours-graph:70`.
- **Test harness** to extend (do not create a new test file):
  `packages/intentionsutil/scripts/test-graph-commit.sh` — copy-in at line
  112, `run_gc()` at 403-413, Case 2 at 431-437.
- **No first-instance risk:** no existing script defines its *own*
  `-C`/`--repo` flag (all pass `-C` through to `git`). This tactic
  establishes the first, modeled on graph-commit's existing option-parsing
  shape — intentional, and the blocked consumer tactic depends on `-C` being
  the canonical form.
- **Sibling defect for a follow-up tactic (do not fix here):**
  `packages/intentionsutil/scripts/dump-node.ts:33-35`
  (`import.meta.url`-derived `repoRoot`).

## Reuse / neighbors (from the original draft interview)

- Analog draft (different surface, same failure family — silent write to
  the primary checkout): `tactic-subagent-cwd-worktree-guard` (subagent
  relative `Write` landing in the primary checkout). Worth a shared
  cwd-safety helper if both land together.
- Invocation-ergonomics sibling: `tactic-graph-commit-invocation-classifier-bypass`
  is `blocked_by` this tactic — it adds the same `-C <path>` flag's
  consumption (a `permissions.allow` matcher covering
  `graph-commit -C <path> ...`) once this tactic lands the flag. Coordinate
  so `-C` (not `--repo`) is the canonical, matcher-targeted form (settled
  above).
- Memory: `graph-commit-repo-root-from-script-location` records the live
  symptom and the worktree-local-invocation workaround that stands in until
  this lands.

## Verification

Auto-runnable — run the extended harness (validates Units 2-4):

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

Auto-runnable — confirm the harness is now wired into CI (Unit 4c):

```verify
grep -q 'test-graph-commit.sh' .github/workflows/unit-tests.yml
```

Auto-runnable — the park-node harness must still pass (Unit 3 edits
`park-node`):

```verify
bash packages/intentionsutil/scripts/test-park-node.sh
```

Manual / judgment checks:

- **No script-location fallback remains.** Read the final `graph-commit`:
  `REPO_ROOT` is derived only from `-C`/`--repo` or cwd via `git rev-parse
  --show-toplevel`; `$SCRIPT_DIR` is used solely for sibling-script paths
  (`store.js`, `merge-node.ts`); the old `$SCRIPT_DIR/../../..` root
  derivation is gone; a non-git cwd with no `-C` errors rather than falling
  back.
- **`cd` ordering.** Confirm `main()` parses options and resolves
  `REPO_ROOT` *before* `cd "$REPO_ROOT"`, and that nothing before the `cd`
  reads `REPO_ROOT`/`INTENTIONS_DIR`.
- **Caller parity.** The four updated callers
  (demote-node-to-implement:77, park-node:98, transition-node:154,
  reconcile-graph-merged:118) each pass `-C "$REPO_ROOT"`;
  `dispatch-graph-census` and `graph-select-target`'s `_graph_commit_fix` are
  unchanged and still correct.
- **Doc fix.** `.claude/skills/fix-checks/SKILL.md:99` no longer references
  the non-existent `.claude/skills/dispatch-propagate/scripts/graph-commit`.
- **Guard semantics in situ.** Optionally, from a real worktree, invoke
  `graph-commit -C <that worktree>` for a node with nothing staged whose
  blob differs from origin/main and confirm it errors loudly (no "landed");
  confirm the equal-blob already-landed case proceeds benignly.
