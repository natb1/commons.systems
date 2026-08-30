---
id: tactic-review-fix-residue-death-coverage
kind: tactic
statement: "review-fix residue phase: surface/file Lane-A residue when the
  disposition agent dies"
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
phase: main-qa
execution:
  branch: tactic-review-fix-residue-death-coverage
  pr: 3022
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-03T16:00:23Z
    mergeCommitSha: cf913deae9fd43e2bdc52c95d805145899746e23
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  bug_fix: true
---
# review-fix residue phase: surface/file Lane-A residue when the disposition agent dies

## Context

`.claude/workflows/review-fix.js` is the Workflow-tool script behind the `/review-fix`
phase. Its **residue phase** takes the findings that the built-in `/code-review` and
`/security-review` skills surfaced but did *not* auto-fix (`laneAResidue`) and hands
them to a single Opus subagent that decides `resolve` / `defer` / `ignore` per item.

When that disposition subagent dies (the injected `agent()` helper already retries
internally, so a `null` return means a genuine outage), the code silently degrades:

```js
const items = (residueRes && residueRes.items) || [];   // review-fix.js:1526
```

`items` becomes `[]`, the zip-back loop (`:1579-1661`) never runs, and therefore:

- `laneADispositions` stays empty → no residue finding reaches `dispositions[]`
  (`:1848`) → nothing renders in the Step-6 PR comment's bucket tables;
- `laneADeferred` stays empty → nothing is filed as a follow-up (`deferred_filings`);
- `coverage_incomplete` / `coverage_note` are not touched → the partial-coverage line
  in the PR comment gives no hint that residue disposition was degraded.

The only surviving fail-safe is the deviation gate (`:1795-1809`), which reads
`laneAResidue` + `residueResolvedByIdx` directly and so still escalates **high-severity
`security-review`** residue. Everything else — all `code-review` residue and all
medium/low `security-review` residue — is lost without a trace.

This is asymmetric with the file's own precedents for agent death:

- quality-finder death sets `coverage_incomplete` + a fixed reason string (`:797-801`);
- an unverified instrument sets `coverage_incomplete` and **appends** a second cause to
  the same note (`:940-948`);
- Lane-B `Unverified` findings (every skeptic failed) are still filed as follow-ups
  rather than dropped (`deferred_filings`, `:1693+`).

It also violates the serving strategy's recorded condition 9 — *phase progress whose
only home is the worker session is a defect; workers flush findings to durable state*.

**Intended outcome.** Every Lane-A residue item that the disposition phase never
triaged is (a) surfaced in `dispositions[]` as a `Deferred`-bucket audit entry so it
appears in the PR comment, (b) filed as a follow-up so it survives the PR merge, and
(c) accounted for in `coverage_incomplete` / `coverage_note` so the partial-coverage
line names the degradation. Plus offline test coverage, because `.claude/workflows/*`
has no automatic CI vector.

### Design decisions taken here (the tactic body left these open)

1. **Reuse `coverage_incomplete` / `coverage_note`; do not add a new flag.** The note is
   already an order-independent composable string, the envelope is already documented as
   the generic degraded-coverage signal in `.claude/skills/review-fix/SKILL.md:296-312`
   and `.claude/skills/review-fix/references/pr-comment.md:57-62`, and no consumer
   branches on the cause. A distinct flag would need plumbing through three files for no
   behavioral gain. The in-file comment that currently narrows the field to a throttle
   back-off (`:1899-1901`) is corrected instead.

2. **Key on per-item undispositioned-ness, not on `residueRes === null`.** After the zip
   loop, `residueResolvedByIdx` has an entry for exactly the `laneAResidue` indices that
   received a valid disposition. Any index *absent* from that map is undispositioned.
   That single rule covers total agent death (empty map), a short/partial `items` list,
   and refs that map to no original item (`:1580-1585`) — and it matches the deviation
   gate's existing note that the agent can drop individual items (`:1789-1790`).

3. **Surface AND file** (not just note). Bucket is `Deferred` for every synthesized
   entry: it is the honest bucket (not fixed, follow-up filed), it keeps the
   outcome-envelope invariant `fixes_applied === count of Fixed-bucket dispositions`
   (`.claude/docs/outcome-envelope.md`, cited at `:1852-1856`), and it makes the items
   count toward `findings_actionable` (`:1881-1882`). The synthesized entries carry no
   `recommended_fix` key, matching the existing rule that only `Fixed`/`Required`
   entries do (`:1657-1659`); the recommended fix instead goes into the filed
   follow-up body.

> Line anchors below were re-read at commit `8522942d`. The tactic's own Provenance
> cites pre-drift numbers (`:1355`, `:1447-1460`) — ignore those. If the file has moved
> again, grep the quoted text rather than trusting the numbers.

---

## Unit 1 — Synthesize audit + follow-up records for undispositioned Lane-A residue

**Recommended model:** `opus`

### Scope

All changes in `.claude/workflows/review-fix.js`.

**1a. Add a pure, sliceable helper inside sentinel comments.**

The residue phase currently opens with (`:1429-1440`):

```js
phase('residue');

// Local truncation — inlined to avoid an ordering dependency on the `truncate`
// function declaration defined later in file-prep.
const residueTruncate = (text) => (text || '').trim().replace(/\s+/g, ' ').slice(0, 140);
// Blocker-issue attribution for defer filings — mirrors the Lane-B `blockerNums`
// computation (defined later in file-prep); duplicated here since that const is
// out of scope at this insertion point.
const residueBlockerNums =
  _a.implementing_issues && _a.implementing_issues.length
    ? _a.implementing_issues
    : 'independent';
```

Restructure this region so that a **sentinel-delimited block containing
`residueTruncate` and one new pure function** sits between `phase('residue');` and the
`residueBlockerNums` const. `residueBlockerNums` **must stay outside** the sentinels —
it references the injected global `_a`, which would throw `ReferenceError` when the
probe evals the slice. Target shape:

```js
phase('residue');

// >>> residue death coverage: sliced + eval'd by review-fix-residue-death-probe.mjs >>>
// Local truncation — inlined to avoid an ordering dependency on the `truncate`
// function declaration defined later in file-prep.
const residueTruncate = (text) => (text || '').trim().replace(/\s+/g, ' ').slice(0, 140);

// Records for Lane-A residue items the disposition phase never triaged — the
// disposition subagent died after retries (agent() already retries internally, so a
// null result is a genuine outage), returned a short items list, or echoed refs that
// mapped to no original item. Without this, those findings are dropped silently:
// laneADispositions/laneADeferred stay empty, so they reach neither the PR comment
// nor a follow-up. Mirrors the quality-finder-death and instrument-gate fail-safes.
//
// `dispositionedIdx` is read via `.has(idx)` ONLY — pass residueResolvedByIdx (a Map
// keyed by original residue index); presence, not value, means "was triaged".
// Pure: no injected globals, no I/O. Slice-tested by
// .claude/skills/dispatch-propagate/scripts/review-fix-residue-death-probe.mjs.
function undispositionedResidueRecords(residue, dispositionedIdx, opts) {
  const list = residue || [];
  const prNum = (opts && opts.pr_num) || '';
  const blockerNums = opts && opts.blocker_issue_nums;
  const dispositions = [];
  const deferred = [];
  list.forEach((orig, idx) => {
    if (!orig) return;
    if (dispositionedIdx && dispositionedIdx.has(idx)) return;
    dispositions.push({
      id: `residue-${idx}`,
      short_desc: residueTruncate(orig.description),
      location: orig.location,
      bucket: 'Deferred',
      sources: [orig.source],
    });
    deferred.push({
      title: residueTruncate(orig.description).slice(0, 80),
      body: [
        orig.description,
        '',
        `Recommended fix: ${orig.recommended_fix}`,
        '',
        'Rationale: the review-fix residue-disposition agent died after retries, so ' +
          'this Lane-A finding was never triaged (resolve/defer/ignore). Filed ' +
          'unconditionally so it is not lost — triage it here.',
        '',
        `Backlink: #${prNum}`,
      ].join('\n'),
      blocker_issue_nums: blockerNums,
    });
  });
  const note = dispositions.length
    ? `Lane-A residue disposition degraded: ${dispositions.length} of ${list.length} ` +
      'finding(s) were never triaged because the residue-disposition agent died after ' +
      'retries. Each is listed under Deferred and filed as a follow-up.'
    : '';
  return { dispositions, deferred, note };
}
// <<< residue death coverage <<<
```

Field names are load-bearing and must match the existing shapes exactly: the
disposition entry mirrors `:1650-1656`, the deferred entry mirrors `:1631-1635`, and
the `orig.*` reads mirror `residueForAgent` at `:1457-1466`. The wording "died after
retries" reuses the file's existing convention (`transcriptVerdictDetail`, `:442-459`).

**1b. Wire the helper at the end of the residue phase.**

Immediately **after** the zip-back `for (const item of items) { … }` loop closes
(currently `:1661`) and **before** the summary `log(...)` at `:1662-1665`, still inside
the `else` branch opened at `:1454` (so `laneAResidue.length > 0` is guaranteed), insert:

```js
  // Any laneAResidue index absent from residueResolvedByIdx got no valid disposition —
  // total agent death, a short items list, or a ref that mapped to no original. Surface
  // + file each so it is not silently dropped, and flag degraded coverage.
  const undisposed = undispositionedResidueRecords(laneAResidue, residueResolvedByIdx, {
    pr_num: _a.pr_num,
    blocker_issue_nums: residueBlockerNums,
  });
  if (undisposed.dispositions.length) {
    laneADispositions.push(...undisposed.dispositions);
    laneADeferred.push(...undisposed.deferred);
    coverage_incomplete = true;
    // Preserve any note the throttle / instrument-gate paths already set.
    coverage_note = [coverage_note, undisposed.note].filter(Boolean).join(' ');
    log(
      `residue: ${undisposed.dispositions.length} undispositioned item(s) surfaced as ` +
        'Deferred and filed as follow-ups (disposition agent died after retries).'
    );
  }
```

The `[coverage_note, ...].filter(Boolean).join(' ')` idiom is copied verbatim from
`:947` so all three causes compose regardless of order. `coverage_incomplete` and
`coverage_note` are `let`-declared at top level (`:791-792`) and are in scope here.

Placing this **before** the existing summary `log` at `:1662-1665` means its
`audit=${laneADispositions.length}` / `deferred=${laneADeferred.length}` counts already
include the synthesized records — no edit to that log line is needed.

**1c. Correct three doc comments.**

- `:1899-1901` — the comment above `coverage_incomplete` in the return object currently
  says it flags *only* a launch-efficiency back-off. Rewrite to name all three causes:
  security wave skipped on quality-finder death, an unverified instrument, and Lane-A
  residue left undispositioned by a dead disposition agent.
- `:28-36` — the header `return OUT` block. Keep the shape identical (no new field);
  add a one-line note that `coverage_note` is a space-joined composition of every
  degraded-coverage cause.
- `:1789-1790` — the deviation-gate comment says a high-severity item the agent dropped
  "has no map entry (!== true) and therefore also escalates". Still true; append that it
  now *also* gets a `Deferred` audit entry and a filed follow-up, so escalation and
  durable capture are independent.

### Out of scope

- No change to `RESIDUE_SCHEMA` (`:243-282`) or any other schema.
- No new field in the returned envelope — `coverage_incomplete` / `coverage_note` /
  `deferred_filings` / `dispositions` carry everything.
- No change to the deviation gate's logic (`:1795-1809`), only its comment.
- No change to `residueDispositions` (`:1442`, `:1527`), the `laneAResidueFixed` path
  (`:1606-1614` — nothing was actually fixed, so nothing may be pushed there), or the
  Lane-B pipeline.
- No cap or sampling on the number of synthesized follow-ups.

---

## Unit 2 — Offline probe + shell test + CI wiring

**Recommended model:** `sonnet`

**Dependencies:** Unit 1 (the sentinels and the helper must exist).

### Scope

`.claude/workflows/*` has **no** automatic CI vector: `run-unit-tests.sh` sets
`RUN_PR_SCRIPTS=true` only for changed paths under
`.claude/skills/dispatch-propagate/scripts/`, so a PR touching only `review-fix.js`
runs nothing. The established workaround is a *probe* that slices a pure region out of
`review-fix.js` between sentinel comments and `eval`s it, driven by a `test-*.sh` wired
unconditionally into the `hook-tests` job. Copy that pattern.

**2a. New file `.claude/skills/dispatch-propagate/scripts/review-fix-residue-death-probe.mjs`.**

Model it directly on the existing
`.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs` — same
structure, same failure modes, same comments-explaining-why. Reuse verbatim: the
`fileURLToPath(new URL('../../../workflows/review-fix.js', import.meta.url))` path
resolution (probe:27-29), the `countOccurrences` + exit-1-on-not-exactly-once sentinel
guard (probe:38-61), the `.trim()`ed slice and the empty-slice guard (probe:63-79), and
the IIFE-`eval` shape (probe:81-84) — here returning `undispositionedResidueRecords`
instead of `instrumentVerdict`:

```js
const START = '// >>> residue death coverage: sliced + eval\'d by review-fix-residue-death-probe.mjs >>>';
const END = '// <<< residue death coverage <<<';
...
return eval(`(function () { ${sliceSource}\nreturn undispositionedResidueRecords; })()`);
```

Keep the existing probe's `// eslint-disable-next-line no-eval` + `// type-safety-ok:`
comment on the `eval` line — the slice again has two top-level statements
(`const residueTruncate` and `function undispositionedResidueRecords`), so
`new Function('return ' + src)()` is not usable.

Fixture set (build a `residue` array whose items carry `description`, `location`,
`recommended_fix`, `source`, `severity`), run the helper per case, and print
`JSON.stringify(results)` keyed by case id:

| case id | input | asserts |
|---|---|---|
| `all-triaged` | 2 items, `dispositionedIdx = new Map([[0,true],[1,false]])` | 0 dispositions, 0 deferred, `note === ''` |
| `total-death` | 2 items, `new Map()` | 2 dispositions + 2 deferred; ids `residue-0`,`residue-1`; every bucket `Deferred`; note non-empty and contains `2 of 2` |
| `partial-drop` | 3 items, `new Map([[1,true]])` | 2 records; ids exactly `residue-0`,`residue-2` |
| `empty-residue` | `[]`, `new Map()` | 0/0, `note === ''` |
| `fields` | 1 item with a >200-char description, `source:'security-review'`, `recommended_fix:'RFX'`, `opts:{pr_num:4242, blocker_issue_nums:[7,9]}` | `short_desc.length === 140`; `title.length === 80`; `sources === ['security-review']`; body contains `Recommended fix: RFX`, `Backlink: #4242`, and `died after retries`; `blocker_issue_nums === [7,9]`; disposition entry has **no** `recommended_fix` key |
| `independent-blockers` | 1 item, `opts:{pr_num:1, blocker_issue_nums:'independent'}` | `blocker_issue_nums === 'independent'` |

**2b. New file `.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh`.**

Model on `.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh`:
`set -euo pipefail`, `source "$FIXTURE_DIR/dispatch-test-fixture.sh"` (supplies
`assert_eq`, `report_results`, `SCRIPT_DIR`, `REPO_ROOT`), one `out=$(node
"$SCRIPT_DIR/review-fix-residue-death-probe.mjs")` call, then `jq` assertions over
`$out` for the table above, then `report_results`. Make the file executable
(`chmod +x`).

**Shell-JSON rule** (`.claude/rules/shell-json.md`, mechanically linted for net-new
lines in committed `.sh`): never `echo "$out" | jq`. Use `printf '%s' "$out" | jq …` or
`jq … <<<"$out"`, matching the existing test file's style.

Add the same **call-site / doctrine greps** the instrument test uses (test file:59-94)
as anti-regression teeth, so a future edit that keeps the helper but stops calling it
still fails:

```bash
assert_eq "residue death: helper call site present" "1" \
  "$(grep -c 'undispositionedResidueRecords(laneAResidue, residueResolvedByIdx' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "residue death: results pushed into laneADispositions" "1" \
  "$(grep -c 'laneADispositions.push(...undisposed.dispositions)' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "residue death: results pushed into laneADeferred" "1" \
  "$(grep -c 'laneADeferred.push(...undisposed.deferred)' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
```

Also assert `coverage_incomplete = true` now appears at **three** sites in
`review-fix.js` (throttle `:798`, instrument gate `:941`, residue death) — count the
occurrences first with `grep -c 'coverage_incomplete = true'` and pin the number the
implementation actually produces.

**2c. Wire it into CI.** In `.github/workflows/unit-tests.yml`, `hook-tests` job, add a
step immediately after the existing `Run review-fix instrument-gate tests` step
(`unit-tests.yml:211-212`):

```yaml
      - name: Run review-fix residue-death coverage tests
        run: .claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh
```

The block comment above that list (`unit-tests.yml:196-204`) already states the rule —
suites whose SUT lives outside the dispatch scripts dir must be wired here — so no
comment change is needed.

### Out of scope

- No change to `run-unit-tests.sh`, no new vitest project, no change to
  `test-review-fix-instrument.sh` or `review-fix-instrument-probe.mjs`.
- No integration test that actually launches subagents — the helper is pure by design
  precisely so it can be tested offline.

---

## Unit 3 — Update the skill-side and PR-comment docs

**Recommended model:** `sonnet`

**Dependencies:** Unit 1 (documents its semantics).

### Scope

**3a. `.claude/skills/review-fix/SKILL.md`.** The `result = { … }` envelope block at
`:296-312` needs **no schema change** (that is the point of reusing the pair). Add one
sentence after the block stating that `coverage_incomplete` / `coverage_note` are the
generic degraded-coverage signal with three causes — security wave skipped on
quality-finder death, an unverified instrument, and Lane-A residue left undispositioned
because the residue-disposition agent died — and that `coverage_note` is a space-joined
composition when several co-occur.

**3b. `.claude/skills/review-fix/references/pr-comment.md`.** The partial-coverage
sentence at `:57-62` currently parenthesizes only the throttle cause:

> When `result.coverage_incomplete` is true, include `result.coverage_note` in this
> partial-coverage line (the probe-wave skipped the security finders because both
> quality finders died — the model was likely throttled).

Generalize the parenthetical to "the note names the cause — a throttled probe wave, an
unverified instrument, or Lane-A residue left undispositioned by a dead
residue-disposition agent — and may name more than one". The instruction itself
("include `result.coverage_note`") stays as-is.

Also note, in the **Deferred** bucket bullet at `:49-50`, that a Deferred entry may be
an *untriaged* Lane-A residue item that the residue phase never reached (its follow-up
is filed the same way, via Step 5), so a reader does not mistake it for a deliberate
defer decision.

### Out of scope

- No change to Step 5's filing mechanism (`SKILL.md:392-416`) or to
  `references/followup-filing.md` — the synthesized entries use the existing
  `deferred_filings` shape and need no new handling.
- No change to `references/disposition-table.md` buckets.

---

## Reuse

| What | Where | Used for |
|---|---|---|
| Composable coverage-note append `[coverage_note, ...notes].filter(Boolean).join(' ')` | `.claude/workflows/review-fix.js:940-948` | Verbatim idiom for the third cause (Unit 1b) |
| Throttle-death coverage branch (`coverage_incomplete = true` + fixed reason string) | `.claude/workflows/review-fix.js:791-801` | Template for the degraded-coverage signal |
| `transcriptVerdictDetail` "died after retries" wording convention | `.claude/workflows/review-fix.js:442-459` | Reuse the phrasing; do not invent new wording |
| `residueTruncate` (140-char single-line truncation) | `.claude/workflows/review-fix.js:1433` | `short_desc` and the 80-char title fallback; moved inside the sentinels, not duplicated |
| `residueBlockerNums` (`implementing_issues` or `'independent'`) | `.claude/workflows/review-fix.js:1437-1440` | `blocker_issue_nums` on each filing; stays OUTSIDE the sentinels (touches `_a`) |
| `laneADispositions` entry shape `{id, short_desc, location, bucket, sources}` + the `recommended_fix`-only-for-Fixed/Required rule | `.claude/workflows/review-fix.js:1650-1660` | Exact shape of each synthesized audit entry |
| `laneADeferred` entry shape `{title, body, blocker_issue_nums}` + title/body fallback templates | `.claude/workflows/review-fix.js:1616-1636` | Exact shape of each synthesized filing |
| `residueForAgent` field list (`location`, `description`, `recommended_fix`, `source`, `severity`) | `.claude/workflows/review-fix.js:1457-1466` | The `orig.*` fields the helper may read |
| `residueResolvedByIdx` (Map keyed by original residue index) | `.claude/workflows/review-fix.js:1450`, `:1604` | Membership source for "was triaged"; read via `.has()` only |
| Sentinel-slice-and-eval probe (path resolution, `countOccurrences` guard, IIFE eval, eslint/type-safety comments) | `.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs` | Structural template for the new probe (Unit 2a) |
| Shell test harness (`assert_eq`, `report_results`, `SCRIPT_DIR`, `REPO_ROOT`) | `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` | Sourced by the new test (Unit 2b) |
| Probe-driver test + call-site grep teeth | `.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh` | Structural template for the new test (Unit 2b) |
| `hook-tests` unconditional-suite list | `.github/workflows/unit-tests.yml:184-215` | CI wiring (Unit 2c) |
| Outcome-envelope invariants (`fixes_applied === Fixed-bucket count`, `findings_actionable`) | `.claude/docs/outcome-envelope.md`, enforced at `review-fix.js:1852-1856`, `:1873-1882` | Why the synthesized bucket is `Deferred`, never `Fixed` |

---

## Verification

Auto-runnable:

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

```verify
node --check .claude/workflows/review-fix.js
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

The instrument-gate suite is re-run deliberately: it greps `review-fix.js` for exact
call-site strings and pins `grep -c 'instrumentFailures.length' == 2`, so an edit that
disturbs the finders-phase coverage block would show up there.

Manual / judgment checks:

1. **Slice hygiene.** `node .claude/skills/dispatch-propagate/scripts/review-fix-residue-death-probe.mjs`
   must print JSON and exit 0. If it exits 1 with a sentinel error, the sentinels are
   missing or duplicated; if it throws `ReferenceError: _a is not defined`, something
   that touches an injected global (most likely `residueBlockerNums`) was pulled inside
   the sentinel block — move it out.
2. **Both fail-safes still fire together.** Confirm by reading `:1795-1809` that a
   high-severity `security-review` residue item with no disposition still sets
   `deviation = true` (escalation) *and* now appears once — not twice — in
   `dispositions[]`. Duplication would mean the synthesized entry collided with a real
   one; the `dispositionedIdx.has(idx)` guard is what prevents it.
3. **Observe in production on the next real `/review-fix` run** whose residue agent
   dies: the PR comment's partial-coverage line should name the residue degradation,
   the Deferred bucket should list the untriaged findings, and Step 5 should file one
   follow-up record per item. Until such a run occurs naturally this is unverifiable
   from the working tree — it belongs in `## needs-main` residue, not in a blocking
   check.
4. **Volume sanity.** On that first real occurrence, check how many follow-ups were
   filed. There is no cap by design; if the count is disruptive, that is an author
   decision to revisit, not a defect of this change.

## Planning-round premises

Recorded by the `/align-tactics` planning round (2026-08-02), for a fresh
implementer session to weigh — not itself a plan step:

- The residue-agent-death signal reuses the existing `coverage_incomplete` /
  `coverage_note` pair rather than a distinct residue-coverage flag (see "Design
  decisions taken here" above for the full rationale).
- The fix is keyed on per-item undispositioned-ness (any `laneAResidue` index absent
  from `residueResolvedByIdx` after the zip loop), not on the narrower
  `residueRes === null` case the original finding described. This subsumes total
  agent death, a partial `items` list, and refs mapping to no original item under one
  rule.
- Every undispositioned item is both surfaced as a `Deferred`-bucket disposition and
  filed as a follow-up, not merely noted. Consequence to weigh: on a total agent
  death with a large Lane-A residue list, this files one follow-up record per residue
  item, with no cap by design.
- The `.claude/workflows/*` CI-coverage gap is load-bearing for this plan's
  verification: `run-unit-tests.sh` only runs suites under
  `.claude/skills/dispatch-propagate/scripts/` for changed-path detection, so Unit 2's
  explicit `hook-tests` wiring is required or this change ships untested in CI.
- The tactic's own Provenance section cites line anchors from source PR #2887 that
  are stale against the current checkout (re-read at commit `8522942d`); the plan's
  own anchors were re-verified fresh this round, but an implementer should still grep
  the quoted text rather than trust bare line numbers if the file has moved again.
