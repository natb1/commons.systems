---
id: tactic-verify-landed-unknown-arm-untested
kind: tactic
statement: verify-landed's per-spec `unknown` status is driven by no test on
  either of its two --jq routes, so the any-unknown-wins reduction branch -- the
  property the 0/4/1 split exists for -- is never executed by
  test-verify-landed.sh; the fetch-failure route IS covered (case 5) but
  short-circuits before the reduction, so covering it again would pin nothing
owner: ai
status: codified
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d), whose closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. AMENDED 2026-08-20 by the /align-tactics round that
  finalized this node, per clarification 115 (correct a node's record to match
  reality rather than defer). As filed this node claimed verify-landed's exit-1
  unknown arm \"has no test\" and \"is not reachable read-only\". Both halves
  are false and were already false at filing time:
  packages/intentionsutil/scripts/test-verify-landed.sh landed 2026-08-10 in
  commit 94037673 -- five days BEFORE PR #3095 -- and its case 5 drives a real
  fetch failure read-only, asserting exit 1, verdict=unknown, and that the word
  not-landed appears nowhere. That suite is CI-registered
  (.github/workflows/unit-tests.yml, step \"Run verify-landed tests\") and runs
  25 passed / 0 failed on origin/main today, so no CI-registration work is owed
  either. The node is PARTIALLY superseded -- a scope narrowing under
  clarification 26's per-unit doomed-drop, preserved by clarification 239, not a
  supersession park. The residual is real and is what this node now covers: the
  per-spec unknown status set only in --jq mode (readNodeAtRef failure, and jq
  runtime error), and the ANY_UNKNOWN reduction branch those are the only way to
  reach. Case 5 exits through an early `report unknown \"\"` before the per-spec
  loop runs, which is exactly why the suite can be green at 12 case groups and
  still never execute the reduction. The severity is unchanged: roughly a
  hundred remaining node closures in the serialized graph write-path plan verify
  themselves through this script, and the untested branch is specifically the
  one that stops a false `landed`.
  AMENDED 2026-08-31: the premise in the sentence above is REFUTED.
  graph-commit's --base is a per-id opt-in, not a whole-batch mode.
  check_base_freshness returns early on an empty manifest and otherwise
  iterates only the manifest's own keys, so a positional id absent from the
  manifest is simply not CAS-checked; and the ordinary-id guard asks only
  that intentions/<id>.md exist on disk, never on origin/main. The header
  documents --prune as mixable with ordinary positional ids. One invocation
  can therefore carry creates, edits and prunes together. Only the stated
  REASON was wrong: the decision it explains -- filing PR1's residuals as
  their own nodes rather than folding them into that batch -- stands on its
  own merits and is not disturbed by this correction."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr16-node-mutation-scripts
  pr: 3138
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T00:43:02Z
    mergeCommitSha: 96d22cb13f56d4240305033b9ad9af76009f9ceb
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Cover `verify-landed`'s per-spec `unknown` status and the "any unknown wins" reduction

## Context

`packages/intentionsutil/scripts/verify-landed` is the one place that answers
"did this actually land on origin/main?". Its header is emphatic that its
verdict is three-way and that the three are never collapsed into two:

```
#   exit 0  landed      every spec is satisfied at origin/main
#   exit 4  not-landed  the read SUCCEEDED and at least one spec is
#                       definitively unsatisfied
#   exit 1  unknown     could not determine (fetch failed, git error, tsx or
#                       jq failure) — nothing is claimed either way
#   exit 2  usage error
#
# The 0/4/1 split is the whole point.
```

`unknown` is *the absence of evidence*. Collapsing it into `landed` reports
success for a write that may not exist; collapsing it into `not-landed`
triggers retries and rollbacks against a graph that may already be correct.
Roughly a hundred remaining node closures in the serialized graph write-path
plan use this script as their independent second verification, so an untested
arm here is an untested arm in that plan's entire bookkeeping.

### The filed premise was wrong; here is the measured one

This node was filed 2026-08-18 claiming the exit-1 arm "has no test". **That is
false and was already false at filing time.** Every statement below was
re-measured on this worktree on 2026-08-20 before this plan was written; do not
re-derive them on trust, but do not re-litigate them either.

- `packages/intentionsutil/scripts/test-verify-landed.sh` **exists** (209 lines,
  12 numbered case groups) and landed 2026-08-10 in commit `94037673`,
  implementing `tactic-graph-commit-landing-signal-unreliable` Unit 1 — five
  days *before* PR #3095 (`fe0b1c4d`), whose residual this node claims to be.
- Running it today: **25 passed, 0 failed.** That is the baseline.
- It **is** wired into CI: `.github/workflows/unit-tests.yml:306-307`, step
  "Run verify-landed tests". **No CI-registration work is owed by this node.**
  The filed body's closing instruction to "confirm the new suite is actually
  invoked by a CI job" is discharged by this measurement.
- Case 5 (`test-verify-landed.sh:127-137`) **already covers the fetch-failure
  route** the filed body named as its minimum ask: it clones the scratch origin,
  repoints `origin` at a nonexistent path, and asserts exit 1, `verdict=unknown`,
  and that the word `not-landed` appears nowhere. **Do not re-add it.** A unit
  that re-covers case 5 is duplicate work.

### What is genuinely uncovered — and it is the filed body's own stated point

The fetch-failure route is an **early short-circuit**: the fetch block calls
`report unknown ""` *before* the per-spec loop ever runs. Case 5 therefore exits
through `report` directly and **never reaches the reduction at the tail of the
script**.

The per-spec `unknown` status is set only in `--jq` mode, at exactly two sites:

- **Route A — `readNodeAtRef` failure.** `if ! node_json="$(node_json_at_main "$id")"; then`
  → `status="unknown"`, with the stderr line
  `could not read $id at origin/main (readNodeAtRef failed) — the outcome is undetermined`.
- **Route B — jq runtime error.** `jq_rc` outside `{0,1}` → the `*)` branch,
  `status="unknown"`, with the stderr line
  `jq filter '$want' failed on $id — the outcome is undetermined`.

**No case in the suite sets any spec's status to `unknown`.** Therefore
`ANY_UNKNOWN=1` is never set, and the `if [[ $ANY_UNKNOWN -eq 1 ]]` branch —
the "any unknown wins outright" reduction, the entire reason the 0/4/1 split
exists — **is never executed by the suite.** That is the real remaining gap,
and it is exactly the property the filed body named: *"A case mixing a genuine
`landed` id with an `unknown` one must exit 1, not 0."*

So this node is still real work, but **narrower than filed**: its subject is the
per-spec `unknown` status and the reduction branch, not the fetch route.

### The arm is correct — this is coverage of shipped behaviour

The filed body's out-of-scope clause says: *"If writing the test reveals the arm
is wrong, that is a separate node — say so rather than quietly correcting it
under a test-coverage heading."* It does **not** reveal that. All four
behaviours were driven end-to-end and produced exactly the documented verdicts.
**No behaviour change to `verify-landed` is warranted or permitted by this node.**

### Greenfield lead

The ideal design is that every verdict arm is driven through the script's real
public argument interface, with no test-only production flag and no shimmed
binary — the harness's own header states "nothing is shimmed and nothing is
copied into the scratch tree", and that property is worth keeping. **That ideal
is fully achievable here** (both routes are reachable with plain seed content
and plain arguments; see Unit 1), so there is no brownfield gap and no migration
path is proposed. In particular the `PATH`-shim reuse the filed body pointed at
is **not needed** — see "Rejected alternative" in Unit 1.

## Units of work

### Unit 1 — Drive the per-spec `unknown` status on both routes, and pin the reduction

**File changed:** `packages/intentionsutil/scripts/test-verify-landed.sh` only.

**Out of scope:** any edit to `packages/intentionsutil/scripts/verify-landed`
(the arm is correct — measured); any new test file; any CI workflow edit
(already registered); any `PATH` shim; re-covering the fetch-failure route
(case 5 already does).

#### Locate by symbol, not by line

Every `path:line` anchor in this node's originally-filed body was stale.
`verify-landed` is **301 lines** today. Corrected anchors, re-measured:

| Thing | Where |
|---|---|
| three-way verdict table in the header | ~`:11`–`:23` |
| `report()` definition | `:175`; its `verdict=` print at `:182` |
| fetch-failure `report unknown ""` | `:203`–`:209` |
| "could not resolve origin/main" `report unknown ""` | `:211`–`:214` |
| `ANY_UNKNOWN=0` / `ANY_UNSATISFIED=0` init | `:219`–`:220` |
| `node_json_at_main()` definition | `:235`–`:251` |
| Route A: `readNodeAtRef failed` → `status="unknown"` | `:267`–`:269` |
| Route B: `jq_rc` `*)` → `status="unknown"` | `:279`–`:284` |
| `[[ "$status" == "unknown" ]] && ANY_UNKNOWN=1` | `:292` |
| the reduction (`if [[ $ANY_UNKNOWN -eq 1 ]]`) | `:296`–`:301` |

Prefer the quoted symbol/line text above over the numbers; the file moves.

#### Seed change: add one malformed node

Append a third seed node beside the existing `t-plain` (`:60`–`:69`) and
`t-parked` (`:71`–`:84`) blocks, before the `git -C "$SEED" add -A` at `:86`:

```bash
# Schema-invalid ON PURPOSE: `status` is absent and `kind` is not a real kind,
# so readNode throws IntentionSchemaError and readNodeAtRef propagates it —
# driving verify-landed's Route A `unknown` (verify-landed:267-269) with no
# shim. Safe to keep in the shared seed: verify-landed NEVER enumerates the
# store — readNodeAtRef reads exactly one file — so this node is invisible to
# every other case. Case 14b is the standing control that proves it.
cat >"$SEED/intentions/t-malformed.md" <<'NODE'
---
id: t-malformed
kind: not-a-real-kind
statement: 12345
owner: nobody
---
# malformed on purpose
NODE
```

#### New cases, appended after case 12 (`:205`), before the summary at `:207`

Use the existing `run <expected-exit> <label> -- <args...>` helper (`:98`–`:111`,
which captures combined stdout+stderr into `$OUT`) and `ok`/`no` (`:44`–`:46`).

**Case 13 — Route B, jq runtime error → per-spec `unknown`.**

```bash
run 1 "a jq filter that ERRORS at runtime is unknown, not unsatisfied" -- \
  -C "$CLONE" --no-fetch --node t-plain --jq '.office_hours | keys'
```

Then assert, with here-strings: `verdict=unknown` present; the per-spec line
`mode=jq status=unknown` present; `jq filter` + `failed on t-plain` present;
and — mirroring case 5's idiom at `:132`–`:137` — that `not-landed` appears
**nowhere** in `$OUT`.

> **Trap, measured.** The filter must target **`t-plain`**, which has no
> `office_hours`. Against `t-parked` the very same filter **succeeds**
> (`keys` → `["reason","recommendation","since"]` → truthy → `satisfied`,
> exit 0) and the case would silently test nothing. Put that reason in a
> comment above the case so a future edit does not "tidy" the id.

Why this filter is legal: the `--jq` validator (`finish_spec`, `verify-landed`
`:126`–`:129`) rejects only `#`, `env`, and `$ENV`. `.office_hours | keys`
passes validation and errors at *runtime* — jq exits **5**, which is the `*)`
branch. Measured: `jq: error (at <stdin>:0): null (null) has no keys`, `rc=5`.

**Case 14 — Route A, `readNodeAtRef` failure → per-spec `unknown`.**

```bash
run 1 "a node that is malformed at origin/main is unknown, not unsatisfied" -- \
  -C "$CLONE" --no-fetch --node t-malformed --jq '.office_hours != null'
```

Assert `verdict=unknown`, the per-spec `mode=jq status=unknown` line, and the
substring `readNodeAtRef failed`.

> **Expected noise, measured.** This route lets a raw Node stack trace reach
> stderr (`Error: readNodeAtRef: ... is not a valid intention node:
> IntentionSchemaError: Expected string for status, got undefined`). `run()`
> captures stderr into `$OUT`, so the trace **will** be in `$OUT`. That is
> shipped behaviour and is **not** to be suppressed by editing `verify-landed`.
> Key assertions on the `verify-landed:` lines. A `not-landed` negative
> assertion is still safe here — measured: the trace contains no such string.

**Case 14b — isolation control (do not omit).**

```bash
run 0 "a malformed sibling node does not poison an unrelated jq read" -- \
  -C "$CLONE" --no-fetch --node t-parked --jq '.office_hours != null'
```

This is what makes the shared-seed change safe, and it must stay green forever.

**Case 15 — the reduction: any `unknown` wins outright.** This is the property
the whole node exists for; it cannot be observed from a single-id test.

```bash
# 15a — a genuine landed spec + an unknown spec ⇒ unknown, NOT landed.
run 1 "one unknown spec overrides an otherwise-satisfied multi-spec verdict" -- \
  -C "$CLONE" --no-fetch --node t-plain --blob "$PLAIN_BLOB" \
                         --node t-plain --jq '.office_hours | keys'

# 15b — POSITIVE CONTROL: same two specs, non-erroring filter ⇒ landed.
run 0 "the same multi-spec call is landed when the filter does not error" -- \
  -C "$CLONE" --no-fetch --node t-plain --blob "$PLAIN_BLOB" \
                         --node t-plain --jq '.id == "t-plain"'

# 15c — unknown OUTRANKS unsatisfied: exit 1, never exit 4.
run 1 "an unknown spec outranks an unsatisfied one (unknown, not not-landed)" -- \
  -C "$CLONE" --no-fetch --node t-plain --blob "$WRONG_BLOB" \
                         --node t-plain --jq '.office_hours | keys'
```

For 15a and 15c assert `verdict=unknown`; for 15c additionally assert
`status=unsatisfied` **is** present on the blob spec line (proving the
unsatisfied spec really was evaluated and then outranked) while the terminal
verdict is still `unknown`. For 15b assert `verdict=landed`. 15b is what stops
15a from passing vacuously.

**Case 16 — `--json` reports a per-spec `unknown`.** Follow case 10's shape
(`:170`–`:187`), reusing its `sed -n '/^{/,$p'` JSON-tail extraction (`:175`):
run `--json` with the satisfied blob + erroring filter, expect exit 1, and
assert via one `jq -e` over the extracted body that
`.verdict == "unknown"`, `(.specs|length) == 2`,
`.specs[0].status == "satisfied"`, `.specs[1].status == "unknown"`, and
`.specs[1].observed == null`.

#### Header reconciliation (same file, same unit)

1. Extend the `Covers:` list (`:14`–`:33`) with entries 13, 14, 14b, 15a/b/c and
   16, in the existing style. Landing new cases without listing them would leave
   the file's own self-description false.
2. **Correct pre-existing stale prose at `:10`:** the header still says
   "...for the `@<jq-filter>` mode's tsx call". That single-token spec form was
   **retired** — the suite's own case 9 (`:147`) asserts it is now a usage
   error. Reword to name the `--jq` mode. This is incidental hygiene in the file
   already being edited, explicitly not a separate node.

#### Rejected alternative (record the reason; do not silently revisit)

The filed body's Reuse section pointed at the `PATH`-shim pattern
(`test-graph-commit.sh:711-750`, a `node` shim that wraps `REAL_NODE` and
intercepts `node --import tsx/esm`) as the mechanism for Route A. **It is not
needed.** `readNodeAtRef` (`packages/intentionsutil/scripts/lib-store-at-ref.ts:100-164`)
reads a **single** node file through `readNode` — it does **not** go through
`listNodesStrict` — so a malformed seed node throws for its own id only. That
was measured (case 14b is the standing proof). Prefer the seed over the shim: it
preserves the harness's stated no-shim design, keeps the other cases running
against the real `node`/`tsx`/`jq`/`git`, and adds no `PATH` save/restore
bookkeeping.

#### Shell conventions this unit must honour

- **`.claude/rules/shell-json.md`:** never `echo "$VAR" | jq`. Use here-strings
  (`jq ... <<<"$OUT"`), as the file already does. This is mechanically enforced
  on net-new added lines in committed `.sh` files by
  `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh`
  (pattern at `:15`), run via `run-lint.sh` in CI.
- The file ends `[[ $FAIL -eq 0 ]]` (`:208`); leave that last line last.
- Every new case asserts on the **`verdict=` text** as well as the exit code —
  the filed body is right that the output contract, not the exit code alone, is
  what a refactor breaks.

**Recommended model:** `sonnet` — unit-test writing with explicit cases; every
recipe, argument vector, expected exit code, and assertion string above was
measured and is quoted verbatim, leaving no design decision for implementation
time.

## Reuse

- `packages/intentionsutil/scripts/test-verify-landed.sh:41-96` — the scratch
  fixture (`$WORK` under one `mktemp -d` with an `EXIT` trap, bare
  `$ORIGIN`/`$SEED`/`$CLONE`, `$PLAIN_BLOB`, `$WRONG_BLOB`). Append to this
  harness; stand up no parallel one.
- `packages/intentionsutil/scripts/test-verify-landed.sh:98-111` — the
  `run <expected-exit> <label> -- <args...>` helper and its `$OUT`
  combined-capture, plus `ok`/`no` at `:44-46` and the `$PASS`/`$FAIL` tally.
- `packages/intentionsutil/scripts/test-verify-landed.sh:60-84` — the existing
  `t-plain` (no `office_hours`) and `t-parked` (`office_hours` set) seeds. Both
  new routes need them; only the malformed node is new.
- `packages/intentionsutil/scripts/test-verify-landed.sh:132-137` — case 5's
  "the word `not-landed` appears nowhere" negative-assertion idiom, to be
  mirrored on the new unknown cases.
- `packages/intentionsutil/scripts/test-verify-landed.sh:170-187` — case 10's
  `--json` assertion shape and its `sed -n '/^{/,$p'` tail extraction, reused
  by case 16.
- `packages/intentionsutil/scripts/verify-landed:175-198` — the `report` helper,
  whose `verify-landed: verdict=<v> ids=<csv> main=<sha>` line is the real
  machine-readable output contract the new assertions key on.
- `packages/intentionsutil/scripts/lib-store-at-ref.ts:100-164` — `readNodeAtRef`,
  whose single-file `readNode` path is what makes the malformed-seed recipe both
  work and stay isolated.
- `packages/intentionsutil/scripts/test-graph-commit.sh:711-750` — the
  `REAL_NODE`-passthrough `PATH`-shim precedent. Cited so the next reader knows
  it was considered; **deliberately not used** (see Unit 1's rejected
  alternative).

## Verification

```verify
packages/intentionsutil/scripts/test-verify-landed.sh
```

The suite is self-tallying and exits non-zero on any failure. Baseline before
this work is **25 passed, 0 failed**; the new cases should raise the pass count
and keep failures at zero.

**Do not use `npm test --prefix packages/intentionsutil`.** That package's
`test` script is `vitest run` (`packages/intentionsutil/package.json:13`), which
runs the vitest suites only and executes no `test-*.sh`. The originally-filed
body carried that fence; it would have gone **green without ever executing the
new coverage**. That is why the fence above invokes the shell suite directly.

CI needs no change: `.github/workflows/unit-tests.yml:306-307` already runs this
exact path as the step "Run verify-landed tests". Confirm by inspection that
those lines are unchanged; a new workflow step is a sign the unit drifted out of
scope.

### Manual, judgment-call steps (not auto-runnable)

1. **Prove the new cases are not vacuous.** Temporarily invert the reduction in
   a scratch copy of `verify-landed` — e.g. change `if [[ $ANY_UNKNOWN -eq 1 ]]`
   to `if false` — and confirm cases 15a and 15c go **red** (they should report
   exit 0 and exit 4 respectively instead of 1). Revert the scratch edit. A
   reduction test that stays green when the reduction is removed is not a test.
   Do not commit this edit; `verify-landed` is out of scope.
2. **Confirm the malformed seed stays invisible.** Case 14b must be green. If a
   future change makes `verify-landed` enumerate the store rather than read one
   node, 14b is the case that will catch it — leave its comment explaining why
   it exists.
3. **Eyeball the stderr noise on case 14.** A raw Node stack trace in the
   harness output is expected and documented above. If a reviewer asks to
   suppress it, that is a change to `verify-landed`'s failure reporting and
   belongs to a separate node — say so rather than making the edit here.
4. **Lint the new shell lines.** Run
   `.claude/skills/dispatch-propagate/scripts/run-lint.sh` and confirm
   `lint-prose-rules.sh` reports no `echo "$VAR" | jq` on the added lines.

## What shipped — 2026-08-30, rescoped

Landed in #3138 (merge commit `96d22cb1`), Position 2 of the dispatch/RSI
serialized window, as PR16 Unit 11.

### This node's premise was partly false, and the unit was rescoped

The filing says the exit-1 "unknown" arm "was never reached … it is not
reachable read-only". That is wrong as written. `verify-landed` has **four**
`unknown` producers, and one was already covered:

| arm | covered before this? |
|---|---|
| `git fetch origin main` fails | **yes** — the existing "unreachable origin is unknown" case |
| `git rev-parse origin/main` fails | no — shadowed by the fetch arm |
| jq-mode `readNodeAtRef` fails | no |
| jq exits non-0/1 (filter runtime error) | no |

All three genuinely-uncovered arms are now driven, and — contrary to the initial
read — **all three were reachable without modifying `verify-landed`**, which is
byte-identical to `HEAD`:

- the `rev-parse` arm via a clone with `origin` configured but never fetched,
  invoked with `--no-fetch` so the fetch step is skipped and the arm is no
  longer shadowed;
- the `readNodeAtRef` arm via a seeded node with invalid YAML frontmatter;
- the jq filter arm via a filter that passes parse-time charset validation but
  fails at eval (`string + number`).

### Non-vacuity, by mutation

Each new case was proven to discriminate: `verify-landed` was copied to a
scratch file, the specific arm under test mutated to forge a wrong verdict, and
the case confirmed to FAIL against the mutant and pass against the real script.
The jq-filter mutant, for example, turned `verdict=unknown`/exit 1 into
`not-landed`/exit 4 — caught by all three of that case's assertions. A case that
passed both ways would have proven nothing, which matters especially here.

### Why it matters

`verify-landed` is the second, independent verification every node closure in
this window runs. An untested arm in it is an untested arm in the bookkeeping of
roughly 100 remaining closures, where the failure mode is a node recorded as
done whose content never reached `main`.

**Verification:** `test-verify-landed.sh` 25/0 → **28/0**, with all 25
pre-existing cases matched name-for-name against the baseline;
`test-graph-commit.sh` 124/0; `run-lint.sh` clean.
