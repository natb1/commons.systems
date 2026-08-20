---
id: tactic-transition-node-scope-stale-test-coverage
kind: tactic
statement: "Add shell-level test coverage for transition-node's scope-stale
  handling: (a) a scope-stale main-qa node must transition to done rather than
  being demoted to implement, and (b) the scope-fingerprint stamp is
  read/refreshed at the main-checkout root (not the invoking PR-branch worktree)
  when transition-node runs with cwd inside a nested .claude/worktrees/<id>
  worktree. Surfaced by review-fix on PR #2882
  (tactic-graph-node-lane-write-hardening): the shell-only guard and MAIN_ROOT
  stamp-path resolution added there are exercised by no test
  (test-transition-node.sh has zero references to transition-node's scope-stale
  handling), so a regression -- the guard removed, a typo in the main-qa phase
  string, or MAIN_ROOT mis-resolving -- would silently re-demote an
  already-merged node to implement or reintroduce the stamp-missing bug with
  nothing to catch it."
owner: ai
status: codified
parent: null
rationale: null
reading: null
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
  - tactic-strategy-fingerprint-stamp-coverage
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add shell-level test coverage for transition-node's scope-stale handling

## Context

`transition-node` (`.claude/skills/dispatch-propagate/scripts/transition-node`) carries
two pieces of scope-custody logic that exist **only in bash** and are exercised by **no
test**:

1. **The main-qa exemption on the scope-stale demote guard.** At
   `transition-node:197` the guard reads
   `if [[ "$SCOPE_STALE" == "true" && "$PHASE" != "main-qa" ]]; then`, delegating to
   `demote-node-to-implement` at `:198-204`. The `&& "$PHASE" != "main-qa"` clause is the
   whole protection: `main-qa` is post-merge, so a scope-stale `main-qa` node must fall
   through to the normal transition (`main-qa -> done`) instead of being demoted back to
   `implement` and re-implementing already-merged work.
2. **`MAIN_ROOT` stamp-path resolution.** `REPO_ROOT` (`transition-node:50`) is derived
   from the script's own location and therefore resolves to the *invoking* worktree.
   `MAIN_ROOT` (`transition-node:51-54`) is `resolve_project_root()`
   (`.claude/skills/dispatch-propagate/scripts/lib.sh:2034-2039`:
   `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`), which from a
   linked worktree resolves to the **main checkout root**. That divergence is the point:
   the scope-fingerprint stamp lives at
   `STAMP_FILE="$MAIN_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"`
   (`transition-node:185`, passed to `compute-freshness.ts --stamp` at `:186-188`), and
   `refresh_stamp` passes `--main-root "$MAIN_ROOT"` to
   `restamp-scope-fingerprint.ts` (`transition-node:141-151`). If `MAIN_ROOT` mis-resolved
   to the worktree, the stamp would be read from and written to a path nothing else looks
   at — the stamp-missing bug.

**Failure scenario.** A regression — the `main-qa` clause removed, a typo in the
`"main-qa"` phase string, or `MAIN_ROOT` mis-resolving — would silently re-demote an
already-merged node to `implement`, or reintroduce the stamp-missing bug, with nothing to
catch it.

**Provenance.** Surfaced by the `code-review` finder during the `/review-fix` pass on
PR #2882 (`tactic-graph-node-lane-write-hardening`), which is where both the guard and
the `MAIN_ROOT` resolution landed. Recorded `execution.pr: 2882`. Adversarial verdict:
**not adversarially verified** — a `Deferred` test-coverage finding, so the review
Workflow's adversarial-verify step does not apply.

**Why a shell test and not a vitest unit test.** `decideTransition`
(`packages/intentionsutil/src/transitions.ts`, the `if (scopeStale)` branch) demotes on
`scopeStale` **unconditionally**, with no `main-qa` exception, and its own doc comment
states the caller must not invoke it on a merged tactic. `transition-node` never forwards
a `--scope-stale` flag to `apply-node-transition.ts` at all — its `APPLY_FLAGS` list is
`--strategy-stale` / `--set-pr` only (`transition-node:206-209`). So the `main-qa`
exemption is unreachable from the pure layer's tests. **Do not "cover" this by adding a
`transitions.test` case.**

**Where the test file actually lives.** `packages/intentionsutil/scripts/test-transition-node.sh`
(653 lines on `origin/main` at `c9bf5320`) — *not* under
`.claude/skills/dispatch-propagate/scripts/`. It is already CI-wired as a `hook-tests`
step at `.github/workflows/unit-tests.yml:296-297`
(`run: packages/intentionsutil/scripts/test-transition-node.sh`), so **no new CI wiring is
needed** for cases appended to this file. Do not create a new `test-*.sh` file — an
un-wired suite is invisible.

**Confirmed coverage gap, and the harness actively blocks the path today.**

- The `node` PATH shim's `*compute-freshness.ts)` arm hardcodes `"scopeStale":false`
  (test-transition-node.sh:~415-432). Nothing in the file can currently reach the guard.
- The seeded `demote-node-to-implement` stub is a deliberate loud-fail (`:113-118`):
  it prints `demote-node-to-implement stub: unexpectedly invoked (scope-stale path not
  under test)` and exits 1. Existing cases depend on that default never firing — **keep it
  intact as the default**.
- The `node` shim has **no arm for `restamp-scope-fingerprint.ts`**; that invocation falls
  to the `*)` "unexpected invocation" arm (exit 1). `refresh_stamp` is best-effort, so
  today this only emits a stderr warning — which means the `--main-root` argument is
  entirely unobserved.

**Harness constraints that bind every new case.**

- CI runs this suite with **no `setup-node`, no `npm ci`** — no `node_modules`, no `tsx`,
  no `yaml` (documented at test-transition-node.sh:23-36). Every shim must stay pure
  bash + git + jq. **Do not introduce a real `node`/`tsx` dependency.**
- The `npx` shim is a hard `exit 127` by design (message: `npx must not be invoked (tsx
  now runs via node --import tsx/esm)`). **Do not route anything back through `npx`.**
- `mark_terminal` (`transition-node:63`) invokes `$UTIL_SCRIPTS/mark-node-terminal`, which
  the harness does not seed; the call is `|| true` with output suppressed, so its absence
  is already harmless. Leave it unseeded.

**Serialization — do not race PR #3023.** `tactic-strategy-fingerprint-stamp-coverage`
(phase `qa`, `execution.pr: 3023`) is **open and unmerged** as of 2026-08-20 and extends
this same file, taking it from 3 cases to 5 and adding shim plumbing this plan builds
directly on: env-driven `TN_STRATEGY_STALE` / `TN_FPS_JSON` in the `*compute-freshness.ts)`
arm, an `TN_ARGV_LOG` argv recorder in the `*apply-node-transition.ts)` arm, and seed nodes
`t-fpseed` / `t-fphold`. This node should be `blocked_by` that node. **The plan below is
written to be order-independent anyway** — every anchor is grep-derived, and Unit 2/3
number their cases relative to what is already in the file.

**Deliberate divergence from the earlier draft.** An earlier note on this node suggested
forcing `scopeStale:true` by planting a mismatching stamp file rather than by an env
var. That is not viable: the harness's `compute-freshness` shim is a pure-bash emulation
that never computes `tacticScopeFingerprint`, so a planted stamp cannot make it report
`scopeStale:true`. Env-driven control is both the honest option and the precedent PR #3023
already set with `TN_STRATEGY_STALE`. The stamp file is still used — as the *observable*
for `MAIN_ROOT` in Unit 3.

## Unit 1 — Parameterize the harness shims for the scope-stale path

**Scope.** `packages/intentionsutil/scripts/test-transition-node.sh` only. Five edits;
locate each by the quoted text, not by line number (the file may already carry PR #3023's
cases 4 and 5).

1. **`seed_node` — optional phase argument.** The helper (find the
   `seed_node() { # <id> <statement>` definition, ~`:196`) hardcodes `phase: implement` in
   its heredoc. Add an optional third argument: `seed_node() { # <id> <statement> [phase]`
   with `local phase="${3:-implement}"` and `phase: $phase` in the heredoc. Every existing
   two-argument call site must be byte-unchanged in behavior.

2. **`*compute-freshness.ts)` arm — test-controlled `scopeStale`, and record the stamp
   path.** Find the line printing the freshness JSON (it contains
   `"scopeStale":false,"strategyStale"`). Change the hardcoded `scopeStale` value to
   `${TN_SCOPE_STALE:-false}`, exactly mirroring how `strategyStale` is (or, pre-#3023,
   will be) driven by `${TN_STRATEGY_STALE:-false}`. The default `false` must reproduce
   today's behavior for every existing case. In the same arm, after the `--stamp` value is
   parsed, add: when `TN_STAMP_LOG` is set, `printf '%s\n' "$stamp" >"$TN_STAMP_LOG"`.
   Both additions are opt-in via unset-by-default env vars.

3. **`demote-node-to-implement` stub — recording mode, loud-fail default.** Find the
   heredoc writing `$SEED/$UTIL_DIR_REL/demote-node-to-implement` (the one printing
   `scope-stale path not under test`). Replace its body with:
   when `TN_DEMOTE_LOG` is set, append `"$1"` to that file and `exit 0` (a successful
   demotion, recorded); otherwise keep the existing message and `exit 1` **verbatim**. The
   loud default is load-bearing for Unit 2's `main-qa` case — do not remove it.

4. **`node` shim — add a `*restamp-scope-fingerprint.ts)` arm.** Insert it before the
   final `*)` "unexpected invocation" arm and after the `*.mts)` arm (a `.ts` path cannot
   match `*.mts`). `refresh_stamp` invokes it as
   `node --import tsx/esm <path>/restamp-scope-fingerprint.ts --repo-root <dir> --main-root <dir> --from-rev origin/main <id>`;
   the shim has already stripped `--import tsx/esm`. The arm must:
   - `shift` off the script path, then parse `--repo-root`, `--main-root`, `--from-rev`
     (two-arg each) and the trailing positional `<id>`;
   - when `TN_RESTAMP_LOG` is set, write the received `--repo-root` and `--main-root` to
     it, one `key=value` per line, so a case can assert on both;
   - write the stamp the real script writes:
     `mkdir -p "$main_root/.claude/worktrees"` then
     `printf 'fp-%s %s\n' "$sha" "$sha" > "$main_root/.claude/worktrees/$id.scope-fingerprint"`
     where `sha` is `git rev-parse HEAD 2>/dev/null || echo none`. Two whitespace-separated
     fields is the shape `parseScopeStamp` (`packages/intentionsutil/src/transitions.ts`)
     expects, and the path convention matches `writeScopeStamp`
     (`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:97-99`:
     `join(mainRoot, ".claude", "worktrees", `${id}.scope-fingerprint`)`);
   - print the same line to stdout and `exit 0`.
   Also add `: >"$SEED/$UTIL_DIR_REL/restamp-scope-fingerprint.ts"` next to the existing
   empty placeholders for `compute-freshness.ts` / `apply-node-transition.ts`, for symmetry
   (the shim matches on the path glob and never reads the file).

5. **Delete the dead `tacticScopeFingerprint` branch and correct the stale comments.** In
   the `-e)` arm, the `if [[ "$code" == *tacticScopeFingerprint* ]]` branch is dead:
   `transition-node` no longer computes the fingerprint via `node -e`, it calls
   `restamp-scope-fingerprint.ts` (`transition-node:141-151`). Remove the branch, leaving
   the `-e` arm as the `read_node_json` emulation only. Then correct the two comment sites
   that claim the four `node --import tsx/esm` call sites include "refresh_stamp's
   fingerprint" via `-e ... tacticScopeFingerprint` — the file-header block (~`:29-36`) and
   the `node` shim's own header (~`:219-222`) — to name the current set: `read_node_json`
   (`-e`), `compute-freshness.ts`, `apply-node-transition.ts`, and
   `restamp-scope-fingerprint.ts`.

**Out of scope.** No production-code change. No change to `lib.sh`, to
`resolve_project_root`, or to its deliberate byte-for-byte duplicate in
`.claude/skills/dispatch-propagate/scripts/lib-repo-roots.sh` (see the comment at
lib.sh:2021-2033; `test-lib-repo-roots.sh` asserts the two agree — **do not collapse
them**). No new test file, no `.github/workflows/unit-tests.yml` change. No behavior change
for cases already in the file: after this unit the suite must still report the same
`passed: N failed: 0`.

**Recommended model.** opus

## Unit 2 — Cases for the main-qa scope-stale exemption, with a positive control

**Scope.** `packages/intentionsutil/scripts/test-transition-node.sh` only. Append two new
`Case N` blocks after the last existing case and before the closing
`echo "passed: $PASS  failed: $FAIL"` summary. Number them relative to what is in the file:
if `TN_STRATEGY_STALE` is present (PR #3023 has merged) they are Cases 6 and 7; otherwise
Cases 4 and 5. Follow the existing block shape exactly — a `# ---` banner, a prose comment
explaining what is under test and why, `make_clone` + `sync_clone`, `run_tn`, then a single
`if … then ok "…" else no "…"; printf … fi`. Use the file's own `ok()` / `no()` counters,
**not** `test-helpers.sh`.

Add two seed nodes next to the existing `seed_node` calls, using Unit 1's new phase
argument:

```
seed_node t-mainqa-stale "scope-stale post-merge node that must not demote" main-qa
seed_node t-qa-stale     "scope-stale pre-merge node that must demote"      qa
```

**Case A — a scope-stale `main-qa` node transitions to `done`, never demotes.**
Fresh clone, `sync_clone`, then `export TN_SCOPE_STALE=true` (and **not** `TN_DEMOTE_LOG`,
so the loud-fail stub still guards the path), `run_tn <clone> t-mainqa-stale`, then `unset`.
Assert all of:
- `rc -eq 0`;
- stdout contains `transitioned t-mainqa-stale main-qa -> done`;
- stdout does **not** contain `demoted` and does not contain
  `scope-stale path not under test`;
- `origin_show t-mainqa-stale` contains `^phase: done`.

**Case B — the positive control: a scope-stale `qa` node *does* demote.**
This case exists so Case A cannot pass vacuously: if `TN_SCOPE_STALE` plumbing broke and
the shim silently reported `scopeStale:false`, Case A would still be green while proving
nothing. Fresh clone, `sync_clone`, then set `TN_SCOPE_STALE=true` **and**
`TN_DEMOTE_LOG="$WORK/demote-log.txt"` (`: >` it first), `run_tn <clone> t-qa-stale`, then
`unset` both. Assert all of:
- `rc -eq 0`;
- stdout contains `demoted t-qa-stale -> implement (scope drift)`;
- the demote log contains `t-qa-stale`;
- `origin_show t-qa-stale` still contains `^phase: qa` (the recording stub lands nothing,
  so origin is deliberately unchanged — state this in the case's comment so a future reader
  does not mistake it for a bug).

Extend the file-header `# Covers:` list with one numbered entry per new case, matching the
style of entries 1-3.

**Out of scope.** No production-code change. No new `vitest` test (see Context). Do not
touch existing cases.

**Dependencies.** Unit 1.

**Recommended model.** sonnet

## Unit 3 — Case for MAIN_ROOT resolution from a nested linked worktree

**Scope.** `packages/intentionsutil/scripts/test-transition-node.sh` only. Append one more
`Case N` block after Unit 2's, in the same shape.

**Why a real `git worktree`, not another clone.** Cases 1-3 use independent `git clone`
directories, each with its own `.git`, so `resolve_project_root` trivially resolves
`MAIN_ROOT` to the clone itself and `MAIN_ROOT == REPO_ROOT` — which defeats the test.
`resolve_project_root`'s contract (`git rev-parse --path-format=absolute --git-common-dir`)
only diverges from `REPO_ROOT` inside a **real linked worktree**.

**Fixture.** Reuse the `git worktree add` pattern already CI-wired elsewhere
(`.claude/skills/dispatch-propagate/scripts/test-lib-worktree-residue.sh:50-55`;
`test-provision-node-worktree.sh:181,232,251,270,295,311,505`):

```
seed_node t-wt-node "transition invoked from a nested linked worktree"   # with the other seed_node calls
...
H="$WORK/h"; make_clone "$H" writer-h; sync_clone "$H"
WT="$H/.claude/worktrees/t-wt-node"
mkdir -p "$H/.claude/worktrees"
git -C "$H" worktree add -q -b t-wt-node "$WT" main
```

Also add a `.gitignore` line to the seed tree containing `.claude/worktrees/`, mirroring
the real repo (`.gitignore:1 worktrees/`), so no guard anywhere can trip on the nested
checkout as untracked content. Add it alongside the other `$SEED` writes, before the seed
commit.

`run_tn` already `cd`s into its first argument, so it is reusable verbatim for the
worktree: `run_tn "$WT" t-wt-node`. `transition-node`'s `SCRIPT_DIR`/`REPO_ROOT` then
resolve to `$WT`, while `MAIN_ROOT` resolves to `$H` — exactly the production shape.

**Assertions.** Before the run, `: >` both `TN_STAMP_LOG="$WORK/stamp-path.txt"` and
`TN_RESTAMP_LOG="$WORK/restamp-args.txt"` and export them (plus nothing else — leave
`TN_SCOPE_STALE` unset so this case takes the ordinary forward path
`implement -> qa`). After the run, `unset` them and assert all of:

- `rc -eq 0` and stdout contains `transitioned t-wt-node implement -> qa`;
- **read side:** the recorded `--stamp` path equals
  `$H/.claude/worktrees/t-wt-node.scope-fingerprint` exactly;
- **write side:** the restamp log records `main-root=$H` and `repo-root=$WT`, and the two
  differ (assert `[[ "$H" != "$WT" ]]` explicitly, so the case cannot pass by both being
  the same string);
- the stamp file exists at `$H/.claude/worktrees/t-wt-node.scope-fingerprint` (a **sibling**
  of the worktree directory);
- the REPO_ROOT-relative path `$WT/.claude/worktrees/t-wt-node.scope-fingerprint` does
  **not** exist — that is the mis-resolution this case forbids.

**Implementation note.** `refresh_stamp` runs *after* `graph-commit` and after
`mark_terminal advance` (`transition-node:240-242`), so the restamp assertions are only
reachable when the land succeeds. `graph-commit` lands with `git push origin "$sha:main"`
and restores the tree with `git reset --hard "$ORIG_HEAD"` — it never checks out `main` by
name, so a linked worktree on branch `t-wt-node` is fine. If the run nonetheless fails from
the linked worktree, **diagnose and fix the fixture; do not weaken the assertions or drop
the case** (`.claude/rules/test-integrity.md`).

Extend the file-header `# Covers:` list with this case.

**Out of scope.** No production-code change. Do not assert on the stamp's *content*
(the shim's `fp-<sha>` string is deliberately arbitrary — the real fingerprint is covered by
`tacticScopeFingerprint`'s own unit tests); this case asserts the **path** only.

**Dependencies.** Unit 1 (needs the `*restamp-scope-fingerprint.ts)` shim arm, the
`TN_STAMP_LOG` recorder, and `seed_node`'s phase argument). Independent of Unit 2, but
append after it so the case numbering is contiguous.

**Recommended model.** opus

## Unit 4 — Correct the false code-anchor citations in transition-node's guard comment

**Scope.** `.claude/skills/dispatch-propagate/scripts/transition-node` only, comment text
only — no executable line changes.

The comment block immediately above the scope-stale guard (currently `:192-196`, find it by
its text `main-qa is post-merge by definition`) carries two wrong citations, verified
against `origin/main` at `c9bf5320`:

- it cites `check-node-selection.ts:242` for "main-qa is post-merge by definition", but
  `:242` there is prose about the **align-tactics** selection gate. The correct anchor for
  the scope-chained set is `packages/intentionsutil/scripts/check-node-selection.ts:61`
  (`const SCOPE_CHAINED_PHASES = new Set(["fix", "qa", "review"]);`), which the comment
  already cites separately.
- it cites `transitions.ts:176-179` for "decideTransition's scope-stale branch", but that
  range is the doc comment stating the caller owns the precomputed gate booleans; the
  branch itself is a dozen lines further down.

Rewrite both citations **symbolically rather than by line number**, e.g. cite
`SCOPE_CHAINED_PHASES` in `packages/intentionsutil/scripts/check-node-selection.ts` and
`decideTransition`'s `if (scopeStale)` branch in `packages/intentionsutil/src/transitions.ts`.
Symbolic anchors do not decay; that is the point of doing it this way rather than
substituting fresh numbers.

**Sequencing caution.** `tactic-transition-node-needs-main-residue-clobbered` (phase
`implement`) is concurrently editing the demote branch at `transition-node:197-207`,
directly below this comment. Apply this edit by matching the comment text, never by line
number, and land it last to minimize conflict surface. If the comment has already been
corrected by that sibling when this unit runs, verify and skip — a no-op is the correct
outcome, not a rewrite.

**Out of scope.** No behavior change; no edit to the guard condition itself; no edit to
`check-node-selection.ts` or `transitions.ts`.

**Recommended model.** sonnet

## Reuse

- `packages/intentionsutil/scripts/test-transition-node.sh` — the target file and the
  harness to **extend, not replace**. Already provides everything the new cases need:
  the scratch bare `ORIGIN` + `SEED` + `make_clone`/`sync_clone` writers, the
  `gh`/`npx`/`node` PATH shims, the `GRAPH_COMMIT_*` env shrinks, `run_tn`, `origin_show`
  / `origin_sha`, `seed_node`, `add_blocked_by`, the `ok()`/`no()` counters and the closing
  `passed: N failed: N` summary.
- `packages/intentionsutil/scripts/test-transition-node.sh` — the loud-fail
  `demote-node-to-implement` stub (`:113-118`): reuse it verbatim as the **default**
  assertion primitive for Unit 2 Case A. No new stub needed there.
- `packages/intentionsutil/scripts/test-transition-node.sh` — the
  `*apply-node-transition.ts)` shim arm already maps `main-qa -> done` in its ladder switch,
  so the `main-qa` leg needs **no shim change**.
- `.claude/skills/dispatch-propagate/scripts/test-lib-worktree-residue.sh:50-55` — the
  `mk_wt()` pattern (`git worktree add -q -b <id> <path> main`) for Unit 3's fixture.
  Same pattern at `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh:181,232,251,270,295,311,505`.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:97-99` (`writeScopeStamp`)
  — the authoritative stamp path convention
  (`join(mainRoot, ".claude", "worktrees", "<id>.scope-fingerprint")`) and the two-field
  `<fingerprint> <sha>\n` content shape the Unit 1 shim arm must emulate. Its usage block
  (`:34-45`) is the `--repo-root` / `--main-root` / `--from-rev` CLI contract to parse.
- `packages/intentionsutil/src/transitions.ts` — `parseScopeStamp` (whitespace split,
  exactly two fields) for the stamp content shape; `decideTransition`'s `if (scopeStale)`
  branch and its doc comment for the citation in Unit 4 and for why this coverage cannot
  live in `transitions.test`.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:2034-2039` (`resolve_project_root`) —
  the function under test for `MAIN_ROOT`. **Read only.** Its byte-identical duplicate in
  `lib-repo-roots.sh` is deliberate (lib.sh:2021-2033) and guarded by
  `test-lib-repo-roots.sh`; do not collapse, and do not make `lib.sh` source anything new —
  ~17 fixtures `cp` it by name and would break at source time.
- `.github/workflows/unit-tests.yml:296-297` — the existing `Run transition-node CAS-guard
  tests` step. Already unconditional; **no workflow edit needed** because every new case
  lands in the same file.
- `packages/intentionsutil/scripts/test-demote-node-to-implement.sh` — the sibling suite
  covering `demote-node-to-implement`'s own CAS guard. Confirms the gap: it tests the
  primitive, never `transition-node`'s decision to *skip* calling it for `main-qa`.
  **Do not add these cases there.**

## Verification

The suite runs with no `node_modules` — pure bash + git + jq — so it can be run directly
from a clean checkout.

```verify
bash packages/intentionsutil/scripts/test-transition-node.sh
```

The run must end `failed: 0`, and its `passed:` count must be strictly greater than the
count before the change (2 more from Unit 2, 1 more from Unit 3, plus PR #3023's cases if
those have landed).

Assert the loud-fail default of the demote stub survived Unit 1's parameterization — if
this string is gone, Unit 2 Case A no longer guards anything:

```verify
grep -q 'scope-stale path not under test' packages/intentionsutil/scripts/test-transition-node.sh
```

Assert the new shim arm and the test-controlled scope-stale flag are actually present
(guards against a unit landing the cases without the plumbing, which would make them
vacuous):

```verify
grep -q 'restamp-scope-fingerprint.ts)' packages/intentionsutil/scripts/test-transition-node.sh && grep -q 'TN_SCOPE_STALE' packages/intentionsutil/scripts/test-transition-node.sh && grep -q 'TN_STAMP_LOG' packages/intentionsutil/scripts/test-transition-node.sh
```

Assert the guard under test is unchanged by this work (this tactic adds coverage; it must
not alter the behavior it covers):

```verify
grep -q '"\$SCOPE_STALE" == "true" && "\$PHASE" != "main-qa"' .claude/skills/dispatch-propagate/scripts/transition-node
```

**Manual / judgment steps.**

- **Mutation-check the new cases before calling them done.** Temporarily delete
  `&& "$PHASE" != "main-qa"` from `transition-node:197` and re-run the suite: Unit 2
  Case A must go red (the loud stub fires, `demoted` appears). Then restore it and
  temporarily change `MAIN_ROOT="$(resolve_project_root)"` to
  `MAIN_ROOT="$REPO_ROOT"`: Unit 3's case must go red on both the stamp-path and the
  restamp-arg assertions. Revert both probes. A case that stays green under its own
  mutation is not coverage.
- **Confirm order-independence against PR #3023.** If
  `tactic-strategy-fingerprint-stamp-coverage` merges while this work is in flight, merge
  `origin/main` and re-run the suite. The only expected interaction is case numbering and
  the shared `*compute-freshness.ts)` arm, where `TN_SCOPE_STALE` and `TN_STRATEGY_STALE`
  are independent `${VAR:-false}` substitutions in the same `printf`.
- **Do not re-wire CI.** Confirm `.github/workflows/unit-tests.yml` is untouched in the
  final diff; a new step would mean the work landed in the wrong file.
