---
id: tactic-node-verify-fence-dead-test-path-sweep
kind: tactic
statement: 21 non-`done` intention nodes still name the deleted
  `test-dispatch-scripts.sh` in their bodies — 11 of them inside a live `
  ```verify ` fence — so `dispatch-run-verification` exits 1 with `No such file
  or directory` at each node's own gate, and every phase lane that treats a
  verify failure as ambiguous parks the node rather than judging it; repoint the
  dead path to its successor across all non-`done` nodes in one sweep
owner: ai
status: codified
parent: null
rationale: "Filed 2026-08-09 at the office-hours sitting that ratified
  tactic-hold-conflict-manual-path-reservation-sweep. That hold is the FIRST
  CASUALTY of this class, not a one-off, and the class is GROWING rather than
  draining: the park recorded 19 non-`done` nodes carrying the dead path on
  2026-08-03; a re-count at the sitting measured 21. ROOT CAUSE:
  tactic-dispatch-test-monolith-split (now `phase: done`) split the
  `test-dispatch-scripts.sh` monolith and deleted it, but its Unit 3 scoped
  `intentions/*.md` bodies out of the rename as `historical records`. That is
  true for `done` nodes, whose bodies are an archive, and WRONG for non-`done`
  nodes, whose ` ```verify ` fences are executable contracts that a phase lane
  will actually run. MECHANISM: Lane 3 and the other verify-running lanes treat
  ANY non-zero exit from `dispatch-run-verification` as ambiguous with no
  exception, so a dead path in the fence is indistinguishable from a real defect
  in resolved code; the lane reverts its work and parks for a human. Each of the
  21 will hit this at its own gate. MEASURED 2026-08-09 against `origin/main`:
  `test-dispatch-scripts.sh` is absent (`git ls-tree` returns nothing);
  `test-dispatch-select-tick.sh` is present and owns the `sel_tick` fixtures the
  monolith used to hold. Affected nodes span every live phase — 4 at
  `implement`, 4 at `main-qa`, 4 at `qa`, and 9 at `phase: null`. FIX DIRECTION:
  a single mechanical sweep repointing the dead path in every non-`done` node,
  plus whatever guard keeps a future file deletion from stranding executable
  fences again — a deletion that removes a path named inside a live verify fence
  should fail loudly at deletion time, not silently at each downstream node's
  gate. Do NOT rewrite `done` nodes: their bodies are the historical record the
  original scoping decision correctly protected. NOTE the one-hop-stale sibling
  reference the sitting also found: `sel_tick_setup` now lives in
  `test-dispatch-select-tick.sh`, and the `rl_setup` dead-session-sweep
  reference test moved to `test-lib-reservation-ledger.sh` — a sweep should
  catch prose references to both, not only the fenced ones."
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
  rationale: "Band 1 of the bootstrap three-band interim scale (50/20/10),
    author-directed at the 2026-08-09 office-hours sitting ('file it and boost
    it') so this sweep outranks the individual casualties it prevents. Band 1 is
    warranted on blast radius rather than severity-per-node: 21 live nodes each
    carry a latent park, 11 of them in executable fences, and every one of those
    parks costs a full human office-hours sitting to clear — the same cost this
    single node discharges once. It is also strictly upstream of those nodes'
    own progress, so leaving it at baseline would let the casualties it prevents
    outrank their own remedy."
  tier: 1
phase: done
execution:
  branch: tactic-node-verify-fence-dead-test-path-sweep
  pr: 3055
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix:
    since: 2026-08-10
    attempt: 2
    pushed_sha: 1f2f0842a34baf57992895df6a86dbbe66a76974
  conflict: null
  completion:
    mergedAt: 2026-08-10T05:15:35Z
    mergeCommitSha: 9054327f536f539c613e3a8aaf0de7ea9f934382
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# The deleted test monolith is still named in live node bodies

## Context

`tactic-dispatch-test-monolith-split` (now `phase: done`, PR #2971, merged
2026-07-31) split
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` into ~88
per-SUT sibling files and **deleted** it. Its Unit 3 deliberately scoped
`intentions/*.md` bodies out of the rename, reasoning that node bodies are
"historical records"
(`intentions/tactic-dispatch-test-monolith-split.md:513-543`).

That reasoning holds for `done` nodes, whose bodies are an archive. It does
**not** hold for nodes still in flight, because a node body's ` ```verify `
fence is not a record — it is the contract `dispatch-run-verification`
executes when the node reaches its phase gate.

### Why it parks instead of failing usefully

`dispatch-run-verification`'s exit-code contract, as consumed by Lane 3
(`.claude/skills/dispatch-conflict/SKILL.md:1188-1214`): exit 0 = proceed,
exit 3 = no Verification section = proceed, exit 1 = "a verify block failed …
treat this as ambiguous and go to Step 10" (revert + park), exit 4/5 = loud
stop-and-report. A dead path produces a generic exit 1 with
`No such file or directory`, indistinguishable from a genuine regression. So
the failure mode is not a red test — it is a **silently reverted piece of
correct work plus a human office-hours sitting**.

`tactic-hold-conflict-manual-path-reservation-sweep` was the first casualty:
its Lane-3 pass had resolved a conflict cleanly, with the ported suite at
189/189, and threw the resolution away because the fence named a deleted file.
(That node is now `phase: done`, closed at the 2026-08-09 sitting by commit
`73f8699f`.)

This is a router-*input* defect, not a router-failure-containment defect: the
park is condition 10 working correctly on a bad input. The fix is upstream.

### Population — RECOUNTED against `origin/main` at plan time

The `21 nodes / 11 in-fence` figure recorded when this tactic was filed is
**stale** and must not be trusted. Commit `eccce157` landed later the same day
and incidentally repointed `intentions/tactic-manual-path-reservation-sweep.md`
in full. Live recount against `origin/main`:

- **43** `intentions/*.md` files name `test-dispatch-scripts.sh`.
- **24** are `phase: done` → **out of scope, do not touch** (their bodies are
  the historical record the original scoping decision correctly protected).
- **19** are non-`done`. One of those is this node itself → **18 edit
  targets**.
- **9** of the 18 name the dead path inside a fence that
  `dispatch-run-verification` will actually execute (a ` ```verify ` fence
  inside the `## Verification` section — the only fences the extractor
  captures, per its state machine at
  `.claude/skills/dispatch-propagate/scripts/dispatch-run-verification:93-134`).

| phase | targets | of which executable-fence |
|---|---|---|
| `implement` | 4 | 4 |
| `main-qa` | 3 | 3 |
| `qa` | 3 | 2 |
| `null` | 8 | 0 |

The remaining 9 targets carry the dead path only in prose (Scope/Reuse bullets,
narrative). Those do not park a lane, but they mislead the next implementer and
are in scope.

### Two hazards discovered at plan time that change how this must execute

1. **Editing an in-flight node's body demotes it.** The chain-of-custody gate
   recomputes `tacticScopeFingerprint(statement, body)` and demotes any tactic
   whose `.scope-fingerprint` stamp no longer matches back to `phase:
   implement` (`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:1-42`).
   **7 of the 18 targets carry a live stamp** under
   `/home/n8/natb1/commons.systems/.claude/worktrees/<id>.scope-fingerprint`.
   A naive sweep would mass-demote seven in-flight nodes — a strictly worse
   outcome than the parks it fixes. Restamping is mandatory, and must happen
   **after** the edit lands on `origin/main`.
2. **A single-file repoint would narrow the gate.** All 9 executable
   occurrences invoke the *whole* monolith (bare path, `bash <path>`, or piped),
   never a single case. The faithful whole-suite successor is
   `run-unit-tests.sh --pr-scripts`, which globs every `test-*.sh` — measured at
   plan time: **338s, 505 suites, 0 failures**. It is rejected anyway, because
   at 338s per gate it also exposes every node to unrelated sibling-suite
   flakes, which produces exactly the ambiguous exit-1 park this tactic exists
   to eliminate. Instead each fence is repointed to the successor file(s)
   covering *that node's own* scope — matching the `eccce157` precedent — with
   the whole-suite net left to CI, where `unit-tests.yml:43-44` already runs
   `run-unit-tests.sh` unconditionally on every PR.

### Intended outcome

Zero non-`done` nodes name the dead path; every path named in a live verify
fence exists on disk; and a future deletion that orphans a fence-named path
fails loudly at deletion time in CI rather than silently at each downstream
node's gate.

---

## Unit 1 — Repoint the dead path across all 18 non-`done` nodes

**Scope.** Edit only `intentions/*.md`. Land as **one** `graph-commit`
(intentions-only, direct-push path). Do not touch any `phase: done` node. Do
not touch `intentions/tactic-manual-path-reservation-sweep.md` (already
repointed by `eccce157` — cite it as the template, it has zero remaining
references) or `intentions/tactic-pace-exempt-ceiling-fanout.md` (verified at
plan time: already names `test-dispatch-select-tick.sh` correctly with valid
`:22`/`:413` anchors — **no action**).

**(a) The 9 executable fences — the park-causing subset. Repoint these first.**
Line numbers are against `origin/main` at plan time; re-locate by string match,
not by line number.

| node (`intentions/<id>.md`) | line | replace the monolith invocation with |
|---|---|---|
| `tactic-graph-select-target-node-tests` | 183 | `test-dispatch-select-tick.sh` **and** `test-graph-select-target.sh` |
| `tactic-qa-main-park-base-cas` | 267 | `test-dispatch-stop-hook.sh` |
| `tactic-align-tactics-tactic-mode-drift-gate` | 601 | `test-align-tactics-gates.sh` |
| `tactic-graph-tick-node-lane-auto-merge` | 321 | `test-graph-auto-merge.sh` |
| `tactic-office-hours-drain-claim` | 332 | `test-lib-reservation-ledger.sh` **and** `test-dispatch-sweep.sh` |
| `tactic-legacy-office-hours-entry-removal` | 272 | `test-office-hours-select-target.sh` **and** `test-office-hours.sh` |
| `tactic-graph-ref-split` | 937 | `test-provision-node-worktree.sh` **and** `test-assert-worktree-fresh.sh` |
| `tactic-graph-auto-merge-up-to-date-gate` | 386 | `test-graph-auto-merge.sh` **and** `test-lib-gh-rest.sh` |
| `tactic-worker-self-close-configurable` | 435 | `test-dispatch-self-close.sh` **and** `test-dispatch-config-load.sh` |

All paths are under
`.claude/skills/dispatch-propagate/scripts/`. All 14 were verified present and
executable on `origin/main` at plan time. Preserve each fence's existing call
form (bare path / `bash <path>` / trailing `2>&1 | tail -20`) and its sibling
lines; change only the monolith line, expanding to two lines where the table
names two files.

**(b) Drop the foreign-worktree `cd` prefix on two of those fences.**
`tactic-qa-main-park-base-cas:267` and
`tactic-graph-auto-merge-up-to-date-gate:386` read
`cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && …`.
That runs the node's own gate inside a *different* node's worktree, so it
verifies the wrong tree — repointing the path without removing the prefix would
leave the fence still broken. Delete the `cd … &&` prefix so the command runs in
the node's own worktree. This is the same defect class `eccce157` recorded as
"A2 nested-cd". Apply it **only** to the two fence lines being repointed here;
do not sweep nested-`cd` fences repo-wide (out of scope).

**(c) The prose references in all 18 targets.** Repoint the filename, and
**delete any `:<line>` or `:<line>-<line>` anchor** rather than carrying it
over — the monolith's line numbers are meaningless in the successor files, and
a repointed path with a stale range is a *confidently wrong* anchor, worse than
an obviously dead one. Replace each dropped range with the greppable fixture or
section name already named in the surrounding sentence.

Mechanical procedure for choosing the successor for any prose reference:
`grep -lF -- '<fixture-symbol>' .claude/skills/dispatch-propagate/scripts/test-*.sh`.
Verified at plan time:

| symbol | now lives in |
|---|---|
| `computePhaseGates` | `test-align-tactics-gates.sh` |
| `gam_fresh` | `test-graph-auto-merge.sh` |
| `selfclose_setup` | `test-dispatch-self-close.sh` |
| `config_setup` / `config_teardown` | `test-dispatch-config-load.sh` |
| `gh_pr_merge_rest` / `gh_pr_view_rest` | `test-lib-gh-rest.sh` |
| `sel_tick_setup` | `test-dispatch-select-tick.sh` (also `test-dispatch-tick.sh`, `test-graph-select-target.sh`) |
| `rl_setup` | `test-lib-reservation-ledger.sh` (also `test-dispatch-schedule-rate-limit-resume.sh`) |

The `sel_tick_setup` / `rl_setup` rows are the "one-hop-stale sibling
reference" the filing rationale flagged: a sweep must catch prose naming these
symbols, not only the fenced paths. Cross-checked at plan time — no non-`done`
node outside this target list needs them repointed.

**Out of scope:** all 24 `phase: done` nodes; any change to test *content*;
`intentions/tactic-manual-path-reservation-sweep.md`;
`intentions/tactic-pace-exempt-ceiling-fanout.md`; repo-wide nested-`cd` fence
cleanup; the stale premise in
`intentions/tactic-provision-worktree-script-tests.md:12,50` (it asserts "no
provision-node-worktree test harness exists", but
`test-provision-node-worktree.sh` and `test-dispatch-provision-worktree.sh`
both exist on `origin/main` — repoint its dead path only, and leave the
now-false premise for that node's own re-plan).

**Execution note.** Cut the working worktree from freshly-fetched
`origin/main`. Two targets have live worktrees at plan time
(`tactic-graph-select-target-node-tests`, `tactic-qa-main-park-base-cas`); edit
the store copy on main and land via `graph-commit` — never edit inside those
workers' worktrees. The sweep is idempotent and re-runnable if a worker later
clobbers a body from a stale copy.

**Recommended model:** sonnet

---

## Unit 2 — Restamp scope fingerprints for the stamped in-flight targets

**Scope.** No file in the repo tree changes. After Unit 1's commit is on
`origin/main`, restamp each edited node that carries a live
`.scope-fingerprint`, so the chain-of-custody gate does not demote it for a
body edit that is scope-inert by construction:

```
npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts \
  --from-rev <the landed sha> <node-id>
```

Stamped targets confirmed at plan time (7):
`tactic-graph-select-target-node-tests`, `tactic-qa-main-park-base-cas`,
`tactic-align-tactics-tactic-mode-drift-gate`,
`tactic-graph-tick-node-lane-auto-merge`, `tactic-office-hours-drain-claim`,
`tactic-graph-ref-split`, `tactic-worker-self-close-configurable`.

Confirmed **unstamped**, so no restamp needed:
`tactic-legacy-office-hours-entry-removal`,
`tactic-graph-auto-merge-up-to-date-gate`,
`tactic-align-session-claiming-liveness-correction`, and all 8 `phase: null`
targets. Re-check presence of
`/home/n8/natb1/commons.systems/.claude/worktrees/<id>.scope-fingerprint`
before stamping rather than trusting this list — stamps appear and disappear as
nodes enter and leave phases.

Use `--from-rev`, not disk mode: it reads the node's committed text at the
landed sha, which is what the gate will compare against.

**Out of scope:** stamping any node Unit 1 did not edit.

**Dependencies:** Unit 1 (must be landed on `origin/main` first).

**Recommended model:** sonnet

---

## Unit 3 — Fail loudly at deletion time, not at each downstream gate

**Scope.** The class fix. A commit that removes a path named inside a live
verify fence must fail in CI on that commit.

**Placement finding — this is load-bearing.** The obvious host,
`packages/intentionsutil/scripts/validate-graph.ts`, is **wrong**. Verified at
plan time: it is invoked from exactly one place,
`.github/workflows/graph-fast-path.yml:32`, which runs only on `graph/**`
branches whose push `check-graph-fast-path.sh` classifies as intentions-only. A
PR that deletes a script touches code, never takes that lane, and so would
never run the guard — which is precisely the shape of the original incident.
The guard must live in the lane every PR takes:
`.claude/skills/dispatch-propagate/scripts/run-lint.sh`, run by
`.github/workflows/unit-tests.yml:126-127` unconditionally.

**(a) Extract the fence parser into a shared library.** Create
`.claude/skills/dispatch-propagate/scripts/lib-verify-fence.sh` exposing
`extract_verify_blocks` — the state machine currently inlined at
`dispatch-run-verification:93-134` (tracks `in_section` / `in_fence` /
`capturing`; captures only fences whose info string is exactly `verify` inside
a `## Verification` section; treats an unclosed fence as malformed). Move it
verbatim and have `dispatch-run-verification` source it. One parser, two
consumers, so the checker can never drift from the executor — a checker that
parses fences differently from the thing that runs them is worthless. Preserve
`dispatch-run-verification`'s exit codes exactly (0/1/2/3/4/5); this script
gates every node, so behavior must be unchanged.

**(b) New checker**
`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh`:
for each `intentions/*.md` whose frontmatter `phase` is not `done`, extract the
verify blocks via `lib-verify-fence.sh`, pull candidate path tokens, and assert
each exists on disk. Fail non-zero listing `<node-id>: <path>` for each miss,
with the remediation inline.

Token rule, kept deliberately conservative to avoid false positives (which
would be their own park generator): consider a whitespace-delimited token only
if it contains `/`, contains none of `$ * ? { } ( )`, is not a URL, and its
first path segment is an existing top-level repo entry (`.claude`, `packages`,
`.github`, `intentions`, `apps`, …). Strip a trailing `:<line>` or
`:<line>-<line>` anchor before the existence test. Everything else is ignored.
Scan `done` nodes never — their bodies are archives by design.

Add a grandfather baseline file alongside it, following the established
`prose-ref-baseline.json` / `loadPlanBodyBaseline` rollout pattern
(`packages/intentionsutil/scripts/validate-graph.ts:19-24,40-62`;
`packages/intentionsutil/src/planlint.ts:44-64`). Because Unit 1 clears every
violation first, **the baseline ships empty** — that is the strong outcome, and
a non-empty baseline at merge time means Unit 1 was incomplete.

**(c) Wire it in.** Call the checker from `run-lint.sh` **unconditionally** —
do *not* gate it on the existing `RUN_PROSE` flag. `RUN_PROSE` is set only when
a changed path satisfies `is_shell_script` (`lib.sh:37-51`), which returns true
for `*.sh` by extension but false for a *deleted* extensionless script (it
stats the file, which no longer exists). Several dispatch scripts are
extensionless (`dispatch-run-verification`, `dispatch-api-call-site`), so
gating on `RUN_PROSE` would leave exactly the deletion shape uncovered. Follow
the wiring form at `run-lint.sh:118-127` and append to `FAILURES` on failure.

**(d) Tests.** Add
`.claude/skills/dispatch-propagate/scripts/test-lint-verify-fence-paths.sh` —
auto-discovered by `run-unit-tests.sh:186-204`'s `test-*.sh` glob, so no runner
change. Cover: a live fence naming an existing path passes; a live fence naming
a missing path fails and names the node; a `done` node naming a missing path
passes (archive exemption); a fence outside `## Verification` is ignored; a
non-`verify` fence is ignored; `$VAR`/glob/URL tokens are ignored; a
`path:12-34` anchor is stripped before the test. Add a case asserting
`dispatch-run-verification`'s exit codes are unchanged after the extraction in
(a).

**Out of scope:** changing what `dispatch-run-verification` does with a failing
block (the exit-1 ambiguity is Lane 3's contract, correct as designed);
teaching lanes to distinguish "missing path" from "real failure" at runtime —
this tactic prevents the bad input instead; any change to
`validate-graph.ts`; the `lint-prose-rules.sh` net-new-diff machinery (scoped
to committed `.sh` files, unrelated content).

**Dependencies:** Unit 1 (the store must be clean, or the new check fails CI on
its own PR).

**Recommended model:** opus

---

## Reuse

- `intentions/tactic-manual-path-reservation-sweep.md:113-138` via
  `git show eccce157 -- intentions/tactic-manual-path-reservation-sweep.md` —
  the literal template for Unit 1: a fence line swapped 1:1, plus
  `**Scope:**` / `**Reuse:**` prose rewritten to name the successor and say
  where `sel_tick_setup` and the `rl_setup` group now live.
- `.claude/skills/dispatch-propagate/scripts/dispatch-run-verification:93-134`
  — the fence-extraction state machine Unit 3(a) moves into
  `lib-verify-fence.sh`. Also the authority on which fences are executable.
- `.claude/skills/dispatch-propagate/scripts/run-lint.sh:118-127` — the wiring
  form for a new lint check (`FAILURES+=(…)`, PASS/FAIL echo).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:37-51` — `is_shell_script`,
  read here as the reason Unit 3(c) must **not** gate on `RUN_PROSE`.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-204` — the
  `test-*.sh` glob that auto-discovers Unit 3(d)'s new suite; also the
  `--pr-scripts` whole-suite runner (measured 338s/505 suites) considered and
  rejected as a fence target.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts` — Unit 2's
  tool; its header documents disk vs `--from-rev` modes.
- `packages/intentionsutil/scripts/list-scope-stale-tactics.ts` — read-only
  enumerator used in Verification to prove Unit 2 worked.
- `packages/intentionsutil/scripts/validate-graph.ts:19-24,40-62` and
  `packages/intentionsutil/src/planlint.ts:44-64` — the grandfather-baseline
  rollout pattern Unit 3(b) imitates.
- `packages/intentionsutil/src/schema.ts:1318-1333` (`mentionsRef`) — design
  precedent for an exemption keyed off other nodes' text, if a residual
  grandfather case appears.
- `packages/intentionsutil/scripts/audit-fork-docs.ts:26-46` — injected-FS
  facade precedent, if Unit 3's checker is written in TS instead of bash.
- `.claude/skills/fix-checks/SKILL.md:596` and
  `.claude/skills/align-tactics/references/idempotency.md:33` — the established
  `grep -rlF -- '<pattern>' intentions/*.md` enumeration idiom used throughout
  Unit 1.
- No bulk path-repoint utility exists in this repo (searched
  `.claude/skills/**`, `.github/`); every `sed -i` in the scripts dir is scoped
  to a single fixture inside a test's own setup. Unit 1 is hand-edits, as
  `eccce157` and monolith-split Unit 3 both were.

## Verification

Run every block from the repo root. **Run these sandbox-off.** Verified at plan
time: `test-dispatch-select-tick.sh` reports 109/220 with `sync-failed` under
the sandbox and **220/220 sandbox-off** — a sandbox artifact, not a defect. A
sandboxed run of the suite blocks below will false-fail.

No non-`done` node still names the dead path (proves Unit 1 complete). One
exception, found during implementation and deliberately excluded: the
`computePhaseGates: sliced + eval'd by test-dispatch-scripts.sh (align-tactics)`
line in `tactic-align-tactics-tactic-mode-drift-gate.md` is not a dead path
reference at all — it is a byte-identical sentinel *comment string* that
`align-tactics-gates-probe.mjs`'s slice-and-eval mechanism matches verbatim
against the same string shipped in `.claude/workflows/align-tactics.js:466`
and `align-tactics-gates-probe.mjs:30`. Renaming it would break the probe's
exact-match slicing, not fix anything — the sentinel's *name* is historical and
does not assert the file exists (it never did double as a path check). The
check below therefore ignores lines containing that sentinel phrase and no
other:

```verify
cd "$(git rev-parse --show-toplevel)"
fail=0
for f in intentions/*.md; do
  ph=$(sed -n '/^---$/,/^---$/p' "$f" | grep -m1 '^phase:' | awk '{print $2}')
  [ "$ph" = "done" ] && continue
  if grep -qF 'test-dispatch-scripts.sh' "$f" && grep -F 'test-dispatch-scripts.sh' "$f" | grep -qv "sliced + eval'd by test-dispatch-scripts.sh"; then
    echo "DEAD PATH still present: $f"
    fail=1
  fi
done
exit $fail
```

Every successor suite named by a repointed fence exists and is green:

```verify
cd "$(git rev-parse --show-toplevel)"
S=.claude/skills/dispatch-propagate/scripts
for t in test-dispatch-select-tick.sh test-graph-select-target.sh \
         test-dispatch-stop-hook.sh test-align-tactics-gates.sh \
         test-graph-auto-merge.sh test-lib-reservation-ledger.sh \
         test-dispatch-sweep.sh test-office-hours-select-target.sh \
         test-office-hours.sh test-provision-node-worktree.sh \
         test-assert-worktree-fresh.sh test-lib-gh-rest.sh \
         test-dispatch-self-close.sh test-dispatch-config-load.sh; do
  if [ ! -x "$S/$t" ]; then echo "MISSING: $t"; exit 1; fi
  if ! "$S/$t" >/dev/null 2>&1; then echo "FAILED: $t"; exit 1; fi
done
echo "all successor suites present and green"
```

No swept node is scope-stale after Unit 2's restamp (proves the sweep did not
mass-demote in-flight nodes):

```verify
cd "$(git rev-parse --show-toplevel)"
mkdir -p /tmp/claude
npx tsx packages/intentionsutil/scripts/list-scope-stale-tactics.ts \
  --dir intentions --stamp-dir .claude/worktrees > /tmp/claude/stale.txt || exit 1
rc=0
for id in tactic-graph-select-target-node-tests tactic-qa-main-park-base-cas \
          tactic-align-tactics-tactic-mode-drift-gate \
          tactic-graph-tick-node-lane-auto-merge tactic-office-hours-drain-claim \
          tactic-graph-ref-split tactic-worker-self-close-configurable; do
  if grep -qx "$id" /tmp/claude/stale.txt; then
    echo "SCOPE-STALE after restamp: $id"; rc=1
  fi
done
exit $rc
```

Unit 3's guard and its tests:

```verify
cd "$(git rev-parse --show-toplevel)"
bash .claude/skills/dispatch-propagate/scripts/test-lint-verify-fence-paths.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh
```

`dispatch-run-verification` still behaves identically after the parser
extraction, and the graph still validates:

```verify
cd "$(git rev-parse --show-toplevel)"
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-run-verification.sh || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Full lint lane, which is where the new guard runs in CI:

```verify
cd "$(git rev-parse --show-toplevel)"
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / judgment checks.**

- *The guard actually catches the original incident.* On a scratch branch,
  `git rm` one file named by a live fence (e.g.
  `test-align-tactics-gates.sh`), commit, and confirm
  `lint-verify-fence-paths.sh` fails naming
  `tactic-align-tactics-tactic-mode-drift-gate`. This is the one check that
  proves the class is closed rather than the instance; a green suite with a
  guard that would not have fired is a failed unit. Revert the scratch branch.
- *Baseline is empty.* Inspect Unit 3(b)'s baseline file at merge. A non-empty
  baseline means Unit 1 missed a node — fix the node, do not grandfather it.
- *No `done` node was rewritten.* `git diff --stat origin/main` on Unit 1's
  landing should list exactly the 18 target files and no other
  `intentions/*.md`. Any `done` node in that diff is a scope violation of this
  plan's own rule.
- *Per-node fence judgment.* For each of the 9 repointed fences, read the
  surrounding Scope prose and confirm the named successor actually covers that
  node's SUT. The Unit 1 table was derived by grepping each node's named
  fixture symbols across the split files, but a node whose scope shifted since
  filing may need a different successor. If a node's scope no longer maps to
  any successor, repoint to the closest covering suite and note it in that
  node's body rather than leaving the dead path.
- *Observe in production.* After landing, watch the next Lane-3 or phase-gate
  pass over any of the 9 formerly-affected nodes and confirm it reaches a
  progression or a substantive disposition rather than an exit-1 ambiguous
  park. The success condition for this tactic is the absence of that park
  class, which only shows up in the selection log over subsequent ticks.
