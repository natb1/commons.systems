---
id: tactic-eval-finding-sidecar-monitor-post-filter-self-conceals
kind: tactic
statement: aggregate-usage.sh computes window.sidecar_eligible/present/rate over
  the post-filter session list, so under --node a session missing its sidecar
  leaves both numerator and denominator and the monitor the stamping hook
  designates as its failure signal reports eligible:0 / rate:null —
  indistinguishable from "no workers scanned" — exactly when the stamping it
  monitors has failed
owner: ai
status: codified
parent: null
rationale: "Auto-created by dispatch-eval-finding as an evaluation finding
  ledger entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. Finalized 2026-08-18 by
  /align-tactics: the body now carries the finding and the clean-session plan
  that applies it, superseding the entry's original recommendation-only closing
  line."
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: sidecar_eligible_reported_at_node_scope
      value: 0
      unit: worker sessions
      window: tactic-align-review-skill align-tactics 2026-08-14
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: worker_sessions_actually_present_in_scope
      value: 1
      unit: worker sessions
      window: tactic-align-review-skill align-tactics 2026-08-14
      sensor: filesystem
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
## Context

`.claude/hooks/stamp-dispatch-session.sh` designates one signal as its own
failure detector. Its header (`stamp-dispatch-session.sh:20-32`):

> MONITOR: rsi-audit now surfaces `window.sidecar_eligible` … `window.sidecar_present`
> … and a derived `window.sidecar_present_rate` … **A drop in
> `sidecar_present_rate` for worker sessions is observable from existing
> transcripts** — this is the data-driven signal for the two uncertainties above.

That monitor cannot fire at `--node` scope, because it is computed *after* the
filter that the missing sidecar already removed the session from.

### Mechanism

`aggregate-usage.sh:1346-1354` computes all three fields over `$sessions`:

```jq
sidecar_eligible:  ( [ $sessions[] | select(.type=="worker") ] | length ),
sidecar_present:   ( [ $sessions[] | select(.type=="worker" and .artifact!=null) ] | length ),
sidecar_present_rate:
  ( ( [ $sessions[] | select(.type=="worker") ] | length ) as $elig
    | if $elig==0 then null else … end )
```

`$sessions` is the **post-filter** list. The `--node` filter at
`aggregate-usage.sh:1437-1442` `continue`s on a missing sidecar *before*
`FILES_SCANNED` is incremented (`:1444`) and before the session ever reaches the
stage-1 pipeline (`:1447-1455`). So a session with no sidecar leaves the
numerator **and** the denominator together — the rate is not depressed, it is
undefined.

The observed output for `--node tactic-align-review-skill` (2026-08-14,
`align-tactics` phase, exit-11 ladder run):

```json
"sidecar_eligible": 0,
"sidecar_present": 0,
"sidecar_present_rate": null
```

`null` is documented to mean "no workers were scanned." Here it means "every
worker was scanned and every one was silently discarded." The two states are
indistinguishable in the output, and the second is precisely the failure the
monitor exists to catch.

### Measured this planning round — the defect is stronger than first recorded

A three-case fixture probe (two worker transcripts, one stamped for
`fixture-probe`, one unstamped; run at fleet scope, at node scope, and again at
node scope with the stamp deleted) produced:

| run | `files_scanned` | `eligible` | `present` | `rate` |
|---|---|---|---|---|
| fleet (2 workers, 1 stamped) | 2 | 2 | 1 | **0.5** |
| `--node fixture-probe` (stamping healthy) | 1 | 1 | 1 | **1** |
| `--node fixture-probe` (stamp deleted) | 0 | 0 | 0 | **null** |

So under `--node` the rate is not merely *able* to read `null` during a stamping
failure — it is **structurally incapable of taking any value other than `1` or
`null`**. Node-scope membership is *defined* by possessing a matching sidecar
(`:1439`), and a non-subagent survivor's stage-1 stamp path
(`stamp="${file%.jsonl}.dispatch-stamp.json"`, `:1447`) is the same file the gate
just proved exists, so `artifact != null` for every surviving worker. There is no
partial-coverage state to observe. The original body's "indistinguishable from
no workers scanned" understates it: the field carries *zero* information at the
one scope the monitor's most frequent reader uses.

### Why it matters

This is a self-concealing instrument. The per-phase evaluator prescribed by the
serving strategy's condition 14 runs at node scope by construction (`/rsi`
SKILL.md Step 2 passes `--node <node-id>`), so the evaluator best positioned to
notice that stamping has broken is the one configuration in which the detector
is guaranteed to read `1` or `null`. Detection is possible only from a
fleet-scope run that nobody is obliged to make, and only if that run happens
before the transcripts age out.

Companion finding: the stamping gap this monitor failed to report is
`ladder-worker-unstamped-audit-blind`, landed the same run — $81.94 price-proxy
and 314 turns of one phase left unmeasured.

### Two premises recorded this round (2026-08-18)

The drift review surfaced two premises this plan depends on that the serving
strategy's record does not carry. Both were judged **immaterial** (neither
blocks authoring this plan), and a per-node `/align-tactics` session never
writes the serving strategy's frontmatter, so they are recorded here on the
node they qualify rather than as strategy clarifications.

**1. The node-scope framing is a property of today's `/rsi`, not a permanent
one.** `.claude/skills/rsi/SKILL.md:29-42` passes `--node <node-id> --since
<epoch>` and states outright that "there is no per-phase session id, and
inventing one is not this job's business".
`tactic-rsi-session-sweep-trigger` (status raw, phase null) plans to replace
exactly that with `--session <sid>` recovered from the dispatch-stamp sidecar
sweep — and under `--session` the filter matches the transcript basename
rather than the sidecar (`aggregate-usage.sh:1426-1431`), so a stampless
worker survives into `$sessions` with `artifact == null` and the rate is
correctly depressed rather than undefined. Neither consequence gates this
work: the `--node` defect is real and unfixed regardless (verified
2026-08-18 at `:1346-1354` and `:1437-1442`), and the serving strategy's
condition 8 keeps `--node` a first-class `/rsi-audit` scope, so the fix does
not go dead if the sweep lands. What must not happen is restating "the
evaluator reads `null` by construction" as a permanent property of the
harness.

**2. Only the additive remedy sits inside already-recorded doctrine.** Of the
two remedies the original finding offered, counting eligibility over the
pre-filter `find` sweep would, at `--node` scope, report a window-wide
population as the denominator of a node-scoped field — because the sidecar
**is** the node-membership key (`:1437-1442`) and a stampless session has no
other node-attribution route. That silently changes what a documented field
means and would need an author ruling. Emitting a distinguishable count of
candidates dropped for want of a stamp needs no such ruling: it is the
serving strategy's condition 16 ("a skipped session is COUNTED, never
silently dropped … so recurrence stays interpretable as a RATE against a
known denominator") applied to the instrument itself, and it follows the
`FILES_FAILED` precedent the script already documents at `:66-68`. Units 1–3
below take the additive shape for that reason. A future round that instead
redefines the node-scope denominator owes an author ruling and must park
for it.

### Design: greenfield, and why this plan builds the second-best

**Greenfield ideal.** Sidecar coverage is a property of the *stamping population
in the window*, not of the scoped session set. The ideal aggregator drops the
shell-level scope gate entirely, runs stage-1 over every candidate transcript in
the window, and applies `--node`/`--session` inside stage-2 jq — so stage 2 holds
both the full classified population (from which coverage is computed, identically
at every scope) and the scoped subset (from which everything else is computed).
That design makes the monitor scope-invariant by construction, with no new field.

**Rejected on cost, deliberately.** Stage 1 is a ~1000-line jq program run once
per file over multi-megabyte transcripts; the shell gate exists precisely so that
a `--node` run — fired once per phase boundary by a fire-and-forget `/rsi` job —
does not pay a fleet-scale scan. The serving strategy's condition 17 makes this
exact argument in the reverse direction ("running it at every session boundary to
decide whether to spend a model turn would cost more than the model turn it
gates"). Making every per-phase evaluation cost a fleet scan to fix a reporting
ambiguity is a bad trade.

**What this plan builds instead (the brownfield path).** Keep the cheap shell
gate and make the shell *account for what it drops*, applying the
clear-errors-over-fallback discipline already documented for `FILES_FAILED` at
`aggregate-usage.sh:66-68` ("Corrupt files are reported to stderr and tallied in
`window.files_failed` — never silently dropped"). Three additive flat fields and
one stderr diagnostic; no existing field changes meaning or type.

**One honest limit, accepted at design time.** The shell cannot know whether a
dropped transcript is a *worker*: worker-ness is decided by stage 1's
`worker_skills` alternation (`aggregate-usage.sh:441-449`, explicitly labelled
SINGLE SOURCE), which never runs on a dropped file. Re-deriving worker-ness in
the shell would fork that single source. So the new counters count **candidate
transcripts, not workers** — a superset that in any real window includes ordinary
interactive sessions. They are therefore a *disambiguator*, never a threshold:
they let a reader tell "nothing was scanned" from "things were scanned and
dropped for want of a stamp", and they bound the population to inspect. This
limit must be written into the field contract, not left for a reader to discover.

**Supersedes the original body's closing line.** That body ended "Recommendation
only — not applied." This plan is the application; the recommendation is no
longer open.

---

## Unit 1 — Account for what the `--node` gate drops, and mark node-scope coverage unmeasurable

**Scope.** `.claude/skills/rsi-audit/scripts/aggregate-usage.sh` only.

1. **Declare two counters** beside the existing ones at `:1393-1394`
   (`FILES_SCANNED=0` / `FILES_FAILED=0`):
   `SCOPE_DROPPED_UNSTAMPED=0` and `SCOPE_DROPPED_OTHER_NODE=0`.

2. **Increment them at the `--node` gate**, `:1437-1442`. The gate today is one
   compound condition; split it so the two drop reasons are distinguishable, and
   increment *before* `continue`:
   - `[[ ! -f "$node_stamp" ]]` → `SCOPE_DROPPED_UNSTAMPED`, then `continue`.
   - stamp exists but `jq -r '.node_id // empty'` ≠ `$NODE_ID` →
     `SCOPE_DROPPED_OTHER_NODE`, then `continue`.
   Keep `$node_stamp` resolved from `session_stem` (`:1406-1408`) exactly as
   today — the parent-stem resolution for subagent transcripts must not change,
   or every subagent of a matched node starts counting as an unstamped drop.
   Do not add a second `find` pass; both counters increment on the same
   iteration that already performs these tests.

3. **Thread both into `WINDOW_JSON`** via the existing
   `jq -n --argjson …` assembly (`:~1480-1499`), emitting
   `scope_filter_dropped_unstamped` and `scope_filter_dropped_other_node` as
   siblings of `files_scanned` / `files_failed`. **Both the unbounded and the
   bounded branch** must be edited — they are near-duplicates and an edit to one
   only is the failure mode here.

4. **Add `sidecar_coverage_measurable`** to the same `WINDOW_JSON` object:
   `false` when `$NODE_ID` is set, `true` otherwise. Compute it shell-side next
   to the existing `SCOPE_TYPE`/`SCOPE_ID` derivation at `:1463-1472` so the two
   branches share one value.

5. **Do not change** `sidecar_eligible` / `sidecar_present` /
   `sidecar_present_rate` at `:1346-1354`. They stay literal counts over
   `$sessions`, which is an honest description of the scoped set; the new flag is
   what tells a reader not to read them as *hook coverage*. Overloading
   `sidecar_present_rate: null` with a third meaning is the ambiguity being
   fixed, not a fix. This also leaves the
   `requireNumber(win, "window", "sidecar_eligible"/"sidecar_present")`
   fail-closed contract at `audit-aggregate-writer.mjs:280-286` untouched.

6. **Emit a stderr diagnostic** when a `--node` run scans nothing but dropped
   something, placed with the other post-scan stderr diagnostics (the
   `files_failed` message at `:1453-1454` is the shape to follow):

   ```
   aggregate-usage.sh: --node <ID> matched 0 transcripts; N candidate transcript(s)
   in the window carried no dispatch-stamp sidecar — sidecar coverage is
   UNMEASURABLE at node scope, not zero
   ```

   Fire it only when `NODE_ID` is set, `FILES_SCANNED == 0`, and
   `SCOPE_DROPPED_UNSTAMPED > 0`. stdout must stay a pure JSON document — the
   script's existing contract.

7. **Document all three fields in the BEHAVIOR CONTRACT header** (the block
   starting at `:62`, beside the `files_failed` bullet at `:66-68`). The text must
   state, in this order: that `sidecar_coverage_measurable` is `false` under
   `--node` *because node membership requires a sidecar, so `present == eligible`
   by construction and the rate can only read `1` or `null`*; that the two drop
   counters are `0` at fleet and session scope by construction (neither gate
   tests for a stamp); and — explicitly — that the counters count **candidate
   transcripts, not worker sessions**, because worker classification happens in
   stage 1 which a dropped file never reaches, so a nonzero value is normal and
   is a disambiguator rather than an alarm.

**Out of scope.** Any change to what `--node` selects; any change to the three
existing sidecar fields; moving the scope filter into stage 2; `stamp-dispatch-session.sh`
behavior; anything in `audit-aggregate-writer.mjs`.

**Caveat for the implementer.** `.claude/rules/shell-json.md` is mechanically
enforced on net-new added lines in committed `.sh` files by `lint-prose-rules.sh`.
Never `echo "$VAR" | jq` — use `<<<"$VAR"` or `printf '%s'`.

**Recommended model:** sonnet — a well-specified shell edit with a clear diff
shape and exact anchors; the only trap (two near-duplicate `WINDOW_JSON`
branches) is called out above.

## Unit 2 — Regression tests for the node-scope self-concealment

**Scope.** `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh` only.

**Trap to avoid, stated first.** `write_min_session()` (`:1580-1588`) stamps
`<command-name>/file-issue</command-name>` at `:1583`. `file-issue` is **not** in
`worker_skills` (`aggregate-usage.sh:441-449`), so every session built with that
helper classifies as type `"other"`, not `"worker"`. A `sidecar_eligible`
assertion written on top of it would read `0` for the wrong reason — type
mismatch, not the bug under test. Any new fixture asserting on the sidecar fields
must use a real worker command name (`/qa-fix`, `/review-fix`, `/align-tactics`,
`/plan-issue`), following the inline-`printf` fixture shape used by the
sidecar-coverage block at `:1240-1262` rather than `write_min_session`.

Add one new isolated fixture block (own `mktemp -d` root, own `trap`, `rm -rf` at
the end — the established shape at `:1236-1288`) with three runs over the same
tree. The tree: two worker transcripts, `sess-cov-node-a` stamped with
`node_id: "fixture-cov-node"`, `sess-cov-node-b` with **no** sidecar; plus a third,
`sess-cov-node-c`, stamped with `node_id: "fixture-cov-other"`.

- **(1) fleet scope** — regression guard that Unit 1 changed nothing at fleet
  scope: `sidecar_eligible == 3`, `sidecar_present == 2`, rate `== 2/3` computed
  via `jq -n '2/3'` into a shell variable (the `EXPECTED_COV_RATE` pattern at
  `:1279-1283`, never a hardcoded literal), and
  `sidecar_coverage_measurable == true`,
  `scope_filter_dropped_unstamped == 0`, `scope_filter_dropped_other_node == 0`.
- **(2) `--node fixture-cov-node`, stamping partly broken** —
  `files_scanned == 1`, `sidecar_coverage_measurable == false`,
  `scope_filter_dropped_unstamped == 1` (`sess-cov-node-b`),
  `scope_filter_dropped_other_node == 1` (`sess-cov-node-c`). Also assert
  `sidecar_present_rate == 1` and add an inline comment recording *why* that is
  the expected value: it is the structural artefact this tactic exists to make
  legible, not a healthy reading.
- **(3) `--node fixture-cov-node` with `sess-cov-node-a`'s sidecar deleted** — the
  total-stamping-failure case: `files_scanned == 0`,
  `sidecar_present_rate == null`, `sidecar_coverage_measurable == false`,
  `scope_filter_dropped_unstamped == 2`. This is the assertion that distinguishes
  the failure from a genuinely empty node; it is the point of the whole tactic.

Also extend the two existing node-scope blocks rather than duplicating them:

- `:1108-1112` (the `by_node` / align-family block, fleet-scope run) — add
  `sidecar_coverage_measurable == true` and both counters `== 0`.
- `:1891-1929` (the `(B) --node ID selects the node's sessions AND their
  subagents` block) — add `scope_filter_dropped_other_node == 1`
  (`sess-scope-y`) and `scope_filter_dropped_unstamped == 1` (`sess-scope-z`).
  Note in a comment that `sess-scope-z` is built by `write_min_session` and so
  types `"other"`, which is exactly why the drop counters are untyped: it is
  still counted as an unstamped drop. Leave that block's existing assertions
  untouched.

**Out of scope.** Any change to the existing zero-worker null-rate case
(`:1329-1360`) or the fleet coverage case (`:1232-1283`) beyond the additive
assertions named above; `test-audit-aggregate-writer.sh` (run unchanged, as a
regression check).

**Dependencies.** Unit 1.

**Recommended model:** sonnet — explicit, enumerated test cases with the one
non-obvious trap spelled out.

## Unit 3 — Correct the documented monitor contract

**Scope.** Three prose sites; no behavior changes.

1. `.claude/hooks/stamp-dispatch-session.sh:20-32` — the `MONITOR:` block. It
   currently claims a drop in `sidecar_present_rate` is observable from existing
   transcripts, full stop. Rewrite it to state that the rate is a **fleet-scope**
   signal; that at `--node` scope it is structurally `1`-or-`null` and
   `window.sidecar_coverage_measurable` is `false`; and that the node-scope
   substitute is `window.scope_filter_dropped_unstamped` — with the
   candidate-transcripts-not-workers caveat carried over verbatim from Unit 1's
   contract text. Leave the `ESCALATION:` paragraph's substance intact.
2. `.claude/skills/rsi-audit/SKILL.md` — the sidecar narration at `:98-102` and
   `:489`. Add one sentence naming the three new `window.*` fields and the
   fleet-versus-node reading rule. Do not restate the caveat in full here; point
   at the script's BEHAVIOR CONTRACT as its single home.
3. `.claude/skills/rsi/SKILL.md:128-132` — the "**An empty selection is a missing
   measurement, not a zero**" paragraph. It already teaches the right instinct for
   the `sessions` array; extend it with the concrete instrument: on a `--node`
   run, read `window.scope_filter_dropped_unstamped` to tell "this node had no
   sessions" from "this node's sessions were dropped for want of a stamp", and
   report the sidecar-coverage lens as **unmeasured** whenever
   `window.sidecar_coverage_measurable` is `false` rather than reporting a rate.

**Out of scope.** `otel-trial-notes.md` (a dated design-history record; it
correctly describes what was true when written and should not be back-edited).
Any change to `/rsi`'s lens list, scope, or bounds.

**Dependencies.** Unit 1 (the field names must exist and match exactly).

**Recommended model:** sonnet — bounded prose edits with the target text quoted.

---

## Reuse

- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1393-1394, 1444, 1453` —
  `FILES_SCANNED` / `FILES_FAILED`. The declare-then-increment shell-counter
  shape the two new counters must copy. Note `FILES_SCANNED` counts only
  post-filter survivors; the new counters deliberately increment *before* the
  gate's `continue`.
- `aggregate-usage.sh:1406-1408` — `session_stem` resolution (subagent → parent
  stem). Single source for all three sidecar-keyed checks; reuse the existing
  variable, do not re-derive.
- `aggregate-usage.sh:1437-1442` — the `--node` stamp-match gate. The single site
  deciding node-scope membership, and the only place the new counters may hook in.
- `aggregate-usage.sh:1463-1472` — the `SCOPE_TYPE`/`SCOPE_ID` derivation.
  `sidecar_coverage_measurable` is computed here so both `WINDOW_JSON` branches
  share one value.
- `aggregate-usage.sh:~1480-1499` — `WINDOW_JSON` assembly, `jq -n --argjson`.
  The established mechanism for threading a shell counter into the window object;
  both branches must be edited.
- `aggregate-usage.sh:441-449` — `worker_skills` / `worker_cmd_re`, labelled
  SINGLE SOURCE. Reused only as the *reason* the shell counters are untyped; it
  must not be duplicated into the shell loop.
- `aggregate-usage.sh:66-68` — the `files_failed` BEHAVIOR CONTRACT bullet. The
  house precedent (clear errors over defensive fallbacks) this fix follows: a
  distinct counter plus a stderr line, never a fallback value.
- `aggregate-usage.sh:1346-1354` — the `window: ( $win + { … } )` merge site.
  Untouched by this plan; the new fields ride in on `$win`.
- `.claude/skills/rsi-audit/scripts/audit-aggregate-writer.mjs:280-286` —
  `requireNumber` fail-closed validation of `sidecar_eligible` / `sidecar_present`.
  Left intact by keeping those fields flat and numeric. Only fleet runs reach the
  writer (`aggregate-usage.sh:1534-1540` skips persist for any scoped run), but
  the shape is preserved anyway.
- `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:1232-1283` — the
  sidecar-coverage fixture block: isolated `mktemp -d` root, inline `printf`
  worker transcripts using real phase-skill command names, `EXPECTED_COV_RATE`
  derived via `jq -n` rather than hardcoded. The template for Unit 2's new block.
- `test-aggregate-usage.sh:1329-1360` — the genuine zero-worker `null`-rate case.
  The contrast case the new node-scope assertions must not disturb.
- `test-aggregate-usage.sh:1891-1929` — the `(B) --node` fixture, which already
  builds a stamped-other-node session (`sess-scope-y`) and a sidecar-less one
  (`sess-scope-z`). Extend in place.
- `test-aggregate-usage.sh:1580-1588` — `write_min_session()`. Reusable, but see
  the `/file-issue` type trap in Unit 2 before asserting on sidecar fields with it.
- `test-aggregate-usage.sh:20-33` — `assert_eq` (and the numeric-tolerance
  variant immediately below it). Use `assert_eq` for all integer/boolean
  assertions here; no float comparison is introduced.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:206-222` — the
  rsi-audit test-script loop. It globs `.claude/skills/rsi-audit/scripts/test-*.sh`,
  so both suites already run under CI's unit-test job with no wiring change.

## Verification

Run the two rsi-audit suites. The first covers the new behavior; the second is
the regression guard that the writer's `window` contract is unchanged.

```verify
bash .claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

```verify
bash .claude/skills/rsi-audit/scripts/test-audit-aggregate-writer.sh
```

Lint, because Unit 1 adds net-new lines to a committed `.sh` file and
`.claude/rules/shell-json.md` is mechanically enforced on exactly those:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual end-to-end check (the one that actually demonstrates the fix).** Build a
throwaway fixture tree and run the aggregator three times against it, mirroring
the probe recorded in Context. Write the fixture as a script file and run it —
a worktree-isolated session refuses compound shell commands with loops and
redirects.

1. Under `$TMPDIR`, create `<root>/-home-x-worktrees-probe/` with two minimal
   two-line worker transcripts (first line
   `{"type":"user","message":{"content":"<command-name>/qa-fix</command-name>"}}`,
   second an assistant line with a `usage` object), one carrying a sibling
   `<stem>.dispatch-stamp.json` with `node_id: "fixture-probe"`.
2. `DISPATCH_AUDIT_PROJECTS_ROOT=<root> bash .claude/skills/rsi-audit/scripts/aggregate-usage.sh --days 7`
   → expect `sidecar_present_rate: 0.5`, `sidecar_coverage_measurable: true`,
   both drop counters `0`.
3. Same with `--node fixture-probe` → expect `sidecar_coverage_measurable: false`,
   `scope_filter_dropped_unstamped: 1`.
4. Delete the remaining sidecar and re-run step 3 → expect `files_scanned: 0`,
   `sidecar_present_rate: null`, `sidecar_coverage_measurable: false`,
   `scope_filter_dropped_unstamped: 2`, **and the stderr diagnostic naming the
   node id and the drop count**. This last run is the pass/fail criterion: before
   the change its output is indistinguishable from a node that simply had no
   sessions; after it, the document and stderr both say so.

**Observe in production.** On the next `/rsi` per-phase run, confirm the emitted
`$TMPDIR/ladder-eval-<node-id>-<phase>.json` carries the three new `window`
fields and that `sidecar_coverage_measurable` is `false` — this is the ordinary
node-scope path and the only one exercised at every phase boundary. Judgment
call, not automatable here: whether the untyped
`scope_filter_dropped_unstamped` figure on a real busy window is small enough to
be legible to a reader. If it routinely lands in the hundreds, the follow-up is
to type it — which requires the stage-2 relocation this plan rejected on cost —
and that is a separate finding, not a fix to make here.

