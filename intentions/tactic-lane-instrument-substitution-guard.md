---
id: tactic-lane-instrument-substitution-guard
kind: tactic
statement: Fail a dispatch lane that cannot invoke its named instrument, instead
  of letting the agent substitute itself and report under the instrument's name
owner: ai
status: codified
parent: null
rationale: Surfaced by the 2026-07-31 /code-review investigation. Across 18
  review-fix runs every Skill(code-review) call was rejected with
  disable-model-invocation; the finder agent substituted its own review and the
  workflow reported the result as the built-in's output, undetected for four
  days, and a strategy divergence was recorded on it. This is the generic guard,
  independent of the review rewiring. See the substitution-invariant
  clarification on strategy-graph-native-dispatch and clarification 25 on
  strategy-token-economy.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 56
  override: null
  rationale: "Author-directed 2026-07-31: top-of-band boost so the generic
    lane-instrument substitution guard is picked first. /code-review ships with
    disable-model-invocation, so all 18 Skill(code-review) calls across
    07-27..07-31 were rejected and the finder substituted its own review under
    the built-in's name — undetected for four days. This node is the generic
    loud-failure guard; it is deliberately ranked one above
    tactic-review-code-review-invocation-contract (55), honoring that node's own
    stated ordering without a blocked_by edge, so a guard stall cannot deadlock
    the target. Top-of-band, not maximum: trunk-health work still outranks it
    (strategy-main-health = 101). Part of the interim 50/20/10 scale's inventory
    — convert to a tier/bug_fix mark when tactic-attention-tier-ranking and
    tactic-attention-boost-scripts retire the interim scale; do not orphan this
    boost."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Fail a dispatch lane that cannot invoke its named instrument, instead of letting the agent substitute itself and report under the instrument's name

## Context

On 2026-07-31 an investigation found that `/code-review` had **never run** inside
the review-fix workflow. Across 18 runs (2026-07-27 → 07-31) every
`Skill(skill: "code-review")` call was rejected with:

```
<tool_use_error>Skill code-review cannot be used with Skill tool due to
disable-model-invocation</tool_use_error>
```

The finder subagent read the rejection, wrote "the built-in `/code-review` skill
is not model-invocable in this environment. I'll perform the review directly at
max effort", ran ~39 tool calls of its own review, and the workflow merged that
output under the built-in's name. Nothing detected it for four days. A strategy
divergence was then recorded on a "$2.31 per applied fix, highest yield of any
stage" figure that in fact measured our own agent.

The agent's substitution was locally reasonable. The defect is that **the
pipeline had no way to tell the difference**, and substituted output entered a
strategy decision wearing the instrument's name.

The invariant this node encodes (recorded the same day as a clarification on
`strategy-graph-native-dispatch`): *a lane that cannot invoke its named
instrument fails the lane; it never substitutes an ad-hoc equivalent, and never
reports substituted output under that instrument's name.* Scope is **every**
named instrument a lane delegates to — a vendor skill, one of our own scripts,
an external service. The paired half on `strategy-token-economy`: a yield metric
may only be credited to a named instrument when that instrument's invocation was
**verified** (exit status + output signature), never from an agent's self-report.

Intended outcome: `.claude/workflows/review-fix.js` — the site where this
happened, and the only lane today that delegates to a named external instrument
— gets a general, reusable instrument gate. An unverified instrument invocation
discards that instrument's payload (it is never merged, never credited in the
outcome envelope) and escalates the lane to a human, carrying the verbatim
failure text.

**Explicitly out of scope for this node:** rewiring `/code-review` onto a working
entry point. That is the sibling `tactic-review-code-review-invocation-contract`.
This node ships the guard that makes a rejected invocation loud, and holds while
that rewiring is in flight. The two must not be sequenced as blockers of each
other — there is no `blocked_by` edge between them, and this plan must not
assume the rewiring has landed. Unit 1's registry carries a `kind` field
(`skill` | `command`) precisely so that when the sibling lands, only the registry
entry changes and the gate keeps working unmodified.

Also out of scope: fallbacks that are *designed and recorded* (a documented
retry-then-degrade path). The invariant targets **undeclared substitution**, not
every fallback.

---

### Greenfield design — the instrument receipt

A stage whose contract is "invoke instrument X" carries three obligations:

1. **Declaration.** The instrument is named in data, not prose — a registry entry
   keyed by finder name, carrying the invocation `kind` and the payload signature
   that instrument's real output must satisfy.
2. **Receipt.** The invoking agent returns, alongside its payload, a receipt
   `{ name, invoked, failure_text }`. Its prompt states that an unavailable
   instrument is a **terminal** condition and that self-performing the work is a
   false report, not a fallback.
3. **Gate.** The consuming stage refuses the payload unless *two independent
   sources* agree: the receipt (`invoked === true` plus a payload signature
   consistent with the instrument) **and** an independent transcript verdict
   produced by a separate, minimally-scoped agent that reads the actual tool-call
   record — fed no finding text, so a prompt-injection payload in an untrusted
   finding description cannot steer it.

Both halves are needed. The receipt's `invoked: false` path is the trustworthy
direction (an agent reporting "it did not work" is not lying in the direction
that hurts) and is exactly the path that failed in this incident — the agent
narrated the rejection openly and nothing consumed the narration. The
`invoked: true` path is the fabricable one, and the transcript verdict is what
makes it non-fabricable.

This is the same shape already proven in this file at
`.claude/workflows/review-fix.js:1181-1256` (residue-tree-verify): a fix-applying
agent self-reports `applied: true, touched_files: [...]`, and a separate
`model: 'sonnet'` agent fed *only* a `git diff --name-only HEAD` instruction
checks the claim against reality; an unconfirmed claim is logged and treated as
unresolved rather than silently accepted. This node generalizes that from
"did the edit land" to "did the instrument run".

**Brownfield migration path:** none needed beyond ordering. The gate is additive
to one workflow script plus one new verification script, and the four units below
are the whole migration. Units 1–3 alone already close the observed incident (the
honest-agent path); Unit 4 closes the fabrication path. Implement in order.

---

## Unit 1 — Instrument registry, receipt schema, and the fail-closed gate

**Recommended model:** opus

### Scope

Single file: `.claude/workflows/review-fix.js`. No other file changes in this
unit.

**1a. Registry + pure verdict helper.** Add, immediately after the `LANE_A` set
definition at `.claude/workflows/review-fix.js:289`, a sentinel-delimited block
containing both the registry and a pure verdict function. The sentinels matter:
Unit 3's probe slices exactly this text out and `eval`s it, so the block must be
**self-contained** — no references to anything outside it.

```js
// >>> instrument gate: sliced + eval'd by review-fix-instrument-probe.mjs >>>
const INSTRUMENTS = {
  'code-review': {
    label: '/code-review',
    kind: 'skill',        // 'skill' → Skill tool; 'command' → Bash command
    skill: 'code-review', // the Skill-tool `skill` argument to look for
    edits_nothing: false, // runs with --fix, so it applies its own edits
  },
  'security-review': {
    label: '/security-review',
    kind: 'skill',
    skill: 'security-review',
    edits_nothing: true,  // no --fix flag; it is inherently findings-only
  },
};

// Pure. Returns { ok, checked, reason }.
//   checked:false  → the gate does not apply (no named instrument, or the
//                    finder returned nothing at all — see the null note below).
function instrumentVerdict(name, res) { /* rules below */ }
// <<< instrument gate <<<
```

`instrumentVerdict` rules, in this order:

- `INSTRUMENTS[name]` absent → `{ ok: true, checked: false, reason: '' }`. Lane-B
  lenses (`cost`, `input-validation`, `red-team`, …) are the agent's *own* work
  by design; they name no instrument and the gate must not touch them.
- `res` is null/undefined → `{ ok: true, checked: false, reason: '' }`.
  **This is load-bearing and must not be changed to a failure.** A `null` finder
  result is the existing probe-wave throttle signal
  (`.claude/workflows/review-fix.js:589-600`, documented at
  `.claude/skills/review-fix/references/schema-edge-cases-notes.md:88-108`),
  which deliberately still applies `dispatch:reviewed` and writes the marker. A
  dead finder contributed no payload, so there is nothing attributed to the
  instrument and nothing to guard. Turning it into a lane failure would park the
  node on every rate-limit.
- `res.instrument` missing or not an object → `{ ok: false, checked: true,
  reason: '<name>: no instrument receipt returned (schema violation)' }`.
- `res.instrument.name !== spec.skill` → `ok: false`, reason naming both the
  expected and the reported name.
- `res.instrument.invoked !== true` → `ok: false`, reason
  `'<name>: instrument reported NOT invoked — <failure_text verbatim, trimmed to
  300 chars>'`. Use the existing `truncate()` helper
  (`.claude/workflows/review-fix.js:1458`) if it is in scope at the call site;
  inside the sliced block, do the slice inline so the block stays self-contained.
- Payload signature:
  - `spec.edits_nothing === true` and `res.fixed` is non-empty → `ok: false`,
    reason `'<name>: payload signature mismatch — this instrument applies no
    edits, but the payload reports <n> fix(es)'`.
  - `spec.edits_nothing === false` and any `res.fixed[]` entry has a missing or
    empty `touched_files` → `ok: false`, reason `'<name>: payload signature
    mismatch — a "fixed" entry reports no touched_files'`. A real `--fix` run
    edits a file for every fix it reports.
- Otherwise `{ ok: true, checked: true, reason: '' }`.

Add a comment above the signature rules stating honestly what they do and do not
buy: they raise the cost of a fabricated receipt, they do not make one
impossible; the independent transcript verdict (Unit 4) is the non-fabricable
evidence.

**1b. Receipt in the schema and the blurb.** Extend `LANE_A_SCHEMA`
(`.claude/workflows/review-fix.js:185-220`): add `'instrument'` to `required`,
and a property

```js
instrument: {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'invoked', 'failure_text'],
  properties: {
    name: { type: 'string' },
    invoked: { type: 'boolean' },
    failure_text: { type: 'string' },
  },
},
```

Append the matching three bullets to `LANE_A_BLURB`
(`.claude/workflows/review-fix.js:407-421`) so the prompt's stated return shape
matches the schema. (The prompt *wording* about terminality is Unit 2; this unit
only adds the field description.)

**1c. The gate.** Insert between `finderResults`
(`.claude/workflows/review-fix.js:608-610`) and the Lane-A capture
(`.claude/workflows/review-fix.js:612-621`):

```js
const instrumentFailures = [];   // [{ instrument, reason }]
const instrumentFailed = new Set();
for (const { name, res } of finderResults) {
  const v = instrumentVerdict(name, res);
  if (v.ok) continue;
  instrumentFailures.push({ instrument: name, reason: v.reason });
  instrumentFailed.add(name);
  log(`finders: INSTRUMENT GATE FAILED — ${v.reason}`);
}
```

Then make the two capture consts discard a failed instrument's payload
**entirely** — the payload is never merged, never dispositioned, never credited:

```js
const codeReviewResult = instrumentFailed.has('code-review')
  ? null
  : (qualityResults[qualityFinders.indexOf('code-review')] || null);
```

and the same guard on `securityReviewResult`. Everything downstream
(`laneAFixed` at :627, `laneAResidue` at :636, the residue phase, `fixed[]`,
`dispositions[]`, `fixes_applied`) already degrades correctly from a `null`
capture, so no further downstream edits are needed. This is also what satisfies
the `strategy-token-economy` half: a discarded payload contributes zero to
`fixes_applied`, so no yield can be credited to an unverified instrument.

**1d. Surface the failure.** After the gate loop, when `instrumentFailures` is
non-empty, set `coverage_incomplete = true` (declared `let` at
`.claude/workflows/review-fix.js:584-585`) and append to `coverage_note` one
sentence per failure:

> `Instrument not verified — <reason>. Its output was DISCARDED, not merged under the instrument's name.`

Preserve any existing `coverage_note` text (join with a space) — the throttle
path may have set it already. `coverage_note` is already rendered into the PR
comment's partial-coverage line
(`.claude/skills/review-fix/references/pr-comment.md:58`), so this needs no new
plumbing to reach the human.

**1e. Fail the lane.** OR `instrumentFailures.length > 0` into the `deviation`
expression at `.claude/workflows/review-fix.js:1443-1456`, with a comment
explaining that an unverified instrument escalates unconditionally — it is not
severity-scaled, because the failure is that the review did not happen, not that
a finding went unfixed. This reuses the existing escalation path: the skill's
Step 7 (`.claude/skills/review-fix/SKILL.md:425-448`) already routes
`result.deviation === true` to `dispatch-mark-deviation` instead of the
phase-completed marker.

**1f. Return + header.** Add `instrument_failures: instrumentFailures` to the
returned object (`.claude/workflows/review-fix.js:1538-1557`) and to the
`return OUT` header comment at `.claude/workflows/review-fix.js:26-33`.

### Out of scope for Unit 1

Prompt wording (Unit 2), any test file (Unit 3), any transcript reading (Unit 4),
and any change to the throttle short-circuit's behavior.

---

## Unit 2 — A finder may not silently replace its own contract

**Recommended model:** sonnet

**Dependencies:** Unit 1 (the receipt fields must exist in `LANE_A_SCHEMA` before
a prompt instructs an agent to fill them).

### Scope

Single file: `.claude/workflows/review-fix.js`, `finderPrompt` region only
(`.claude/workflows/review-fix.js:450-519`).

Today `finderPrompt` says only "Invoke the built-in `/code-review` skill via the
Skill tool with the `max` effort argument AND the `--fix` flag"
(`.claude/workflows/review-fix.js:455`) and the parallel line for
`/security-review` at `.claude/workflows/review-fix.js:477`. Neither says what
happens if that invocation is rejected — the fallback is left to the agent's
judgment, which is how the substitution happened.

Add one shared helper immediately above `finderPrompt`, so any future
instrument-invoking prompt inherits the clause instead of restating it:

```js
function instrumentClause(spec) { /* returns a joined string */ }
```

Its text follows the established house style for a missing named dependency —
name the dependency, state the failure condition, arrow to a terminal
disposition, forbid the fallback explicitly, no hedging. Precedents to match for
terseness and shape: `.claude/skills/qa-main/SKILL.md:329-330` ("If ToolSearch
fails or the tools are unavailable → environment barrier → **cannot-verify**.
Do **not** loop or retry."), `.claude/skills/qa-main/SKILL.md:350-354`, and
`.claude/skills/dispatch-conflict/SKILL.md:261-272` ("Say that plainly and stop
— do not attempt a merge."). Required content:

- Invoking `<spec.label>` is this agent's **entire** contract.
- If the invocation is rejected, errors, or the instrument is unavailable →
  that is a **terminal** condition for this agent. Do **not** loop or retry.
- Performing the review yourself is **not** an acceptable fallback. Output you
  produced yourself, reported under `<spec.label>`'s name, is a false report.
- On that terminal condition, return
  `{ "fixed": [], "residue": [], "instrument": { "name": "<skill>", "invoked": false, "failure_text": "<the VERBATIM error text you received, unedited>" } }`
  and stop.
- On a successful invocation, return the normal payload with
  `"instrument": { "name": "<skill>", "invoked": true, "failure_text": "" }`.
- Report `"invoked": true` **only** if you received a non-error result from
  `<spec.label>` itself. Your own analysis is never that result.

Insert `instrumentClause(INSTRUMENTS['code-review'])` into the `code-review`
branch and `instrumentClause(INSTRUMENTS['security-review'])` into the
`security-review` branch, each placed immediately before the closing
`LANE_A_BLURB` element so the terminal rule is the last thing the agent reads
before the schema.

### Out of scope for Unit 2

Lane-B prompts (`.claude/workflows/review-fix.js:491-518`) — those lenses name no
instrument and must keep their current wording. Any schema change (Unit 1).

---

## Unit 3 — CI coverage for the gate and the clause

**Recommended model:** sonnet

**Dependencies:** Units 1 and 2.

### Scope

Three files, following an existing template exactly.

`.claude/workflows/*.js` has **no** vitest mapping and is **not** covered by
`run-unit-tests.sh`'s `test-*.sh` glob (that glob only fires when a changed path
is under `.claude/skills/dispatch-propagate/scripts/`). The only CI vector for a
workflow script is the unconditional `hook-tests` job in
`.github/workflows/unit-tests.yml:184-232`. Without the wiring below a regression
in Unit 1 merges green.

**3a.** `.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs`
— copy the structure of
`.claude/skills/dispatch-propagate/scripts/qa-fix-partition-probe.mjs` verbatim:
resolve `../../../workflows/review-fix.js` relative to `import.meta.url`, read it,
assert each sentinel appears **exactly once** (fail loudly with a nonzero exit
otherwise), slice the text between them, `eval` the slice, then run
`instrumentVerdict` over a fixture set and print one JSON document to stdout.
`review-fix.js` is a Workflow-tool script (top-level `await` + injected globals),
so it cannot be imported or executed by node — slicing is the only option.

Fixture cases the probe must emit (as `{ id, ok, checked, reason }`):

| id | input | expected |
|---|---|---|
| `lane-b` | name `cost`, any res | `ok:true, checked:false` |
| `null-res` | name `code-review`, res `null` | `ok:true, checked:false` |
| `no-receipt` | valid payload, no `instrument` key | `ok:false` |
| `wrong-name` | receipt `name:'security-review'` under finder `code-review` | `ok:false` |
| `not-invoked` | `invoked:false, failure_text:'Skill code-review cannot be used with Skill tool due to disable-model-invocation'` | `ok:false`, reason contains the verbatim text |
| `sig-no-touched-files` | `code-review`, `invoked:true`, one `fixed[]` entry with `touched_files: []` | `ok:false` |
| `sig-security-edited` | `security-review`, `invoked:true`, non-empty `fixed[]` | `ok:false` |
| `clean-code-review` | `invoked:true`, every `fixed[]` entry with non-empty `touched_files` | `ok:true, checked:true` |
| `clean-security-review` | `invoked:true`, `fixed: []` | `ok:true, checked:true` |

**3b.** `.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh`
— model on `.claude/skills/dispatch-propagate/scripts/test-qa-fix-partition.sh`:
`set -euo pipefail`, source `dispatch-test-fixture.sh` from the script's own
directory, run the probe once, assert each row above with `assert_eq` over `jq`
selections, then add the call-site / doctrine greps that same file uses
(`grep -c … | assert_eq`), covering:

- `instrumentVerdict(` appears at the gate call site (not only in its definition);
- `instrumentFailed.has('code-review')` and `instrumentFailed.has('security-review')`
  both guard their capture const;
- `instrument_failures` appears in the returned object;
- the `deviation` expression contains `instrumentFailures.length`;
- `instrumentClause(` appears in **both** Lane-A prompt branches (count `2`);
- `'instrument'` is in `LANE_A_SCHEMA`'s `required` list.

The greps are the anti-regression teeth: a future edit that keeps
`instrumentVerdict` but stops calling it would otherwise pass every unit case.

**3c.** `.github/workflows/unit-tests.yml` — add a step to the `hook-tests` job
immediately after the `align-tactics resolveTempRefs` step at
`.github/workflows/unit-tests.yml:209-210`:

```yaml
      - name: Run review-fix instrument-gate tests
        run: .claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

The comment block at `.github/workflows/unit-tests.yml:204-206` explicitly asks
that this list be kept in sync when adding a suite whose SUT is outside the
dispatch-propagate scripts dir — this is exactly that case.

### Out of scope for Unit 3

Any change to `run-unit-tests.sh`'s mapping logic. Any test of Unit 4's script
(that test ships with Unit 4).

---

## Unit 4 — Independent transcript verification of the invocation

**Recommended model:** opus

**Dependencies:** Units 1–3.

### Scope

Four files.

**4a.** New script
`.claude/skills/dispatch-propagate/scripts/dispatch-verify-instrument-invocation`
(extensionless, executable, `#!/usr/bin/env bash`, `set -euo pipefail`).

```
usage: dispatch-verify-instrument-invocation --instrument <name> --kind skill|command
         [--skill <skill-arg>] [--command-pattern <ERE>]
         --since <ISO8601> --cwd <abs-path>
         [--wait-secs <N>]
```

Behavior:

- Transcript root is `${DISPATCH_AUDIT_PROJECTS_ROOT:-$HOME/.claude/projects}` —
  the same seam
  `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:10-18` already
  documents and its tests already drive. Recursive `find` for `*.jsonl` picks up
  both top-level session transcripts and nested subagent transcripts; workflow
  subagent transcripts live at
  `<projects-root>/<slug>/<sessionId>/subagents/workflows/wf_<id>/agent-*.jsonl`.
- Every record carries `.cwd`, `.timestamp`, and `.sessionId`. Filter on
  `.cwd == $cwd` and `.timestamp >= $since` — **do not** derive the project
  directory from a path slug. Filtering on the record's own `cwd` is what makes
  this fleet-safe: a concurrent session in a different worktree cannot contribute
  a record.
- Count, over the filtered records:
  - **rejections** — `.type == "user"` with any
    `.message.content[]? | select(.type == "tool_result" and .is_error == true)`
    whose `.content | tostring` matches
    `Skill <instrument> cannot be used with Skill tool`. Capture the first
    matching text verbatim as `failure_text`.
  - **invocations** — for `--kind skill`: `.type == "assistant"` with any
    `.message.content[]? | select(.type == "tool_use" and .name == "Skill" and .input.skill == $skill)`;
    collect each such `.id` into a set. For `--kind command`: the same over
    `.name == "Bash"` with `.input.command | test($pattern)`.
  - **succeeded** — `tool_result` records whose `.tool_use_id` is in that set and
    whose `.is_error` is not `true`. (The `tool_use` and its result appear in the
    same transcript file, so pairing by id within the file is sufficient.)
- `verified` is true iff `succeeded >= 1` **and** `rejections == 0`.
- Flush lag: if `invocations == 0` and `rejections == 0`, poll (1s interval) up
  to `--wait-secs` (default 10) for a matching record before concluding. The
  verdict when the window expires with no evidence either way is
  `verified: false` with `reason: "no invocation record found"` — fail-closed,
  per the invariant. This bounded wait is evidence-gathering, not a substitute
  invocation.
- Print exactly one JSON document to **stdout** in all non-usage cases:
  `{"instrument":…,"kind":…,"invocations":N,"succeeded":N,"rejections":N,"verified":bool,"failure_text":"…","reason":"…"}`.
  Exit `0` when verified, `1` when not verified (JSON still printed), `2` on a
  usage or environment error with a diagnostic on stderr and **no** JSON. Per
  `.claude/rules/code-style.md`, a missing transcript root or an unparseable
  `--since` is exit 2 — never a silent `verified:false`.
- Follow `.claude/rules/shell-json.md`: never `echo "$VAR" | jq`; use `jq <<<`
  or a direct pipe. This file is mechanically linted for that rule.

**4b.** New test
`.claude/skills/dispatch-propagate/scripts/test-dispatch-verify-instrument-invocation.sh`
— source `dispatch-test-fixture.sh`, build a temp projects root under
`"$TMPDIR"`, point `DISPATCH_AUDIT_PROJECTS_ROOT` at it, and write hand-authored
`.jsonl` fixtures. Cases:

1. a successful `Skill` invocation (`tool_use` + non-error `tool_result`) → exit 0,
   `verified == true`;
2. the real rejection record → exit 1, `verified == false`, `rejections == 1`,
   `failure_text` carrying the verbatim `<tool_use_error>…</tool_use_error>` text;
3. a rejection recorded under a **different** `.cwd` → exit 1 with
   `reason == "no invocation record found"` (proving the `cwd` scoping works and
   another worktree cannot poison the verdict);
4. a successful invocation whose `.timestamp` predates `--since` → not counted;
5. `--kind command` matching a Bash `tool_use` against `--command-pattern`
   (forward-compatibility with the sibling's `claude -p` rewiring);
6. missing `--instrument` → exit 2, no stdout JSON.

Wire it into `.github/workflows/unit-tests.yml`'s `hook-tests` job next to the
Unit 3 step. Its SUT *is* under the dispatch-propagate scripts dir, so
`run-unit-tests.sh`'s glob also covers it — the explicit step is belt-and-braces
and matches how sibling suites there are listed.

**4c.** Wire the verdict into `.claude/workflows/review-fix.js`:

- Capture `const runStartedAt = new Date().toISOString();` immediately after the
  `_a` normalization at `.claude/workflows/review-fix.js:529-530`, before any
  finder launches.
- After `finderResults` (`.claude/workflows/review-fix.js:608-610`) and
  **before** the Unit 1 gate loop, when at least one Lane-A finder returned a
  non-null result, spawn exactly **one** verifier agent, modelled on
  residue-tree-verify at `.claude/workflows/review-fix.js:1196-1210`:
  `model: 'sonnet'`, `agentType: 'general-purpose'`,
  `label: 'instrument-verify'`, `phase: 'finders'`, and increment
  `subagentsLaunched` at the spawn (not on the result), matching the accounting
  rule documented at `.claude/workflows/review-fix.js:532-537`.
- Its prompt contains **only** the command lines to run and the return shape —
  no finding text, no residue, no diff context. This is deliberate and must be
  preserved: it is what keeps a prompt-injection payload in an untrusted finding
  description from steering the verifier. State in the prompt that a **non-zero
  exit is expected and normal** when the instrument was not verified, and that
  the agent must return the JSON printed on stdout regardless of exit status —
  otherwise the agent will treat exit 1 as its own failure and retry.
- Schema `INSTRUMENT_VERIFY_SCHEMA`:
  `{ results: [{ instrument, verified: bool, rejections: int, failure_text, reason }] }`,
  placed next to `RESIDUE_TREE_SCHEMA` (`.claude/workflows/review-fix.js:274-281`)
  with a comment in the same spirit.
- Merge into the gate: a Lane-A finder whose transcript verdict is
  `verified !== true` fails the gate with
  `'<name>: instrument invocation not verified in the transcript record — <reason|failure_text>'`,
  **even when its receipt claims `invoked: true`**. Receipt-and-transcript
  disagreement is the substitution signature. A `null` verifier result (agent
  dead after retries) also fails the gate — the check is not optional.
- No settings change is required: the PreToolUse hook
  `.claude/hooks/approve-workflow-commands.sh:26` auto-approves any command
  matching `(^|/)\.claude/skills/[a-zA-Z0-9_-]+/scripts/[…]$`, which this script
  is. **Do not** add a `permissions.allow` entry for it.

**4d.** Documentation: add the `instrument_failures` field to the `result` shape
in `.claude/skills/review-fix/SKILL.md:294-301`, and a short subsection to
`.claude/skills/review-fix/references/schema-edge-cases-notes.md` (next to the
throttle short-circuit note at lines 88-108) stating: an unverified instrument
discards that instrument's payload, sets `coverage_incomplete`, and sets
`deviation` — and that this is deliberately *not* the throttle path, where a
`null` finder result still applies `dispatch:reviewed`.

### Out of scope for Unit 4

Reading transcripts for any purpose other than the invocation verdict. Any change
to `aggregate-usage.sh`. Any retry of the instrument itself.

---

## Reuse

- `.claude/workflows/review-fix.js:1181-1256` — residue-tree-verify: the
  independent-verification pattern (separate agent, minimal prompt, no untrusted
  text, claim checked against reality, unconfirmed claim treated as unresolved).
  Copy its shape for Unit 4's verifier agent; its schema comment at
  `.claude/workflows/review-fix.js:268-281` is the model for
  `INSTRUMENT_VERIFY_SCHEMA`'s comment.
- `.claude/workflows/review-fix.js:584-600` — `coverage_incomplete` /
  `coverage_note`, already rendered into the PR comment via
  `.claude/skills/review-fix/references/pr-comment.md:58`. Reuse instead of
  adding new plumbing.
- `.claude/workflows/review-fix.js:1443-1456` and
  `.claude/skills/review-fix/SKILL.md:425-448` — the existing `deviation` →
  `dispatch-mark-deviation` escalation. This is the "fail the lane" mechanism;
  do not invent a new one.
- `.claude/workflows/review-fix.js:1458-1461` — `truncate()` for bounding
  `failure_text` at the call sites outside the sliced block.
- `.claude/skills/dispatch-propagate/scripts/qa-fix-partition-probe.mjs` and
  `.claude/skills/dispatch-propagate/scripts/test-qa-fix-partition.sh` — the
  sentinel-slice-and-eval template for testing a pure helper inside a
  Workflow-tool script, plus the `grep -c | assert_eq` call-site-coverage
  convention. Copy both structures rather than inventing a harness.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — the
  shared `assert_eq` / `$SCRIPT_DIR` fixture both new test scripts source.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:10-18` — the
  transcript-layout contract and the `DISPATCH_AUDIT_PROJECTS_ROOT` test seam
  Unit 4 reuses verbatim.
- `.claude/skills/dispatch-propagate/scripts/dispatch-recover-session-id:1-20` —
  precedent for a pure-filesystem, daemon-free, sandbox-safe transcript reader
  with an env-var root seam and a documented exit-code contract (0 / 1 / 2).
  Unit 4's script follows the same contract style.
- `.claude/hooks/approve-workflow-commands.sh:26` — the `SCRIPT_RE` that
  auto-approves scripts under any skill's `scripts/` directory; the reason Unit 4
  needs no `permissions.allow` entry.
- `packages/intentionsutil/src/sensors.ts:44-59` (`SensorRegistry.resolve`) —
  the house precedent for "a named instrument that cannot be resolved throws,
  listing what was requested and what is available; there is no silent
  substitute". Unit 1's registry-miss and receipt-mismatch reasons should name
  both the expected and the reported instrument in the same spirit.
- `.claude/skills/qa-main/SKILL.md:329-330`, `:350-354`, `:393-395` and
  `.claude/skills/dispatch-conflict/SKILL.md:261-272` — the house wording for
  "named dependency unavailable → terminal, do not retry, do not substitute".
  Unit 2's clause matches this register: short, unconditional, no hedge.
- `.github/workflows/unit-tests.yml:184-232` (`hook-tests`) — the only CI vector
  for `.claude/workflows/*.js`; both new suites wire in here.

## Verification

Run from the worktree root.

```verify
node --check .claude/workflows/review-fix.js
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-verify-instrument-invocation.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual and judgment checks:

- **Live no-false-failure run (required before this node leaves QA).** Run the
  real `/review-fix` pass this PR's own branch triggers and confirm the
  instrument gate passes on a genuine run: `result.instrument_failures` is `[]`,
  `deviation` is not set by the gate, and the workflow log shows the
  `instrument-verify` agent returning `verified: true`. This is the check that
  the bounded transcript-flush wait in Unit 4a is long enough; a `reason: "no
  invocation record found"` on a run where the instrument genuinely ran is a real
  defect, not a tuning nit — route it back rather than raising `--wait-secs`
  without understanding why.
- **Induced-unavailability check.** Make the instrument unreachable (e.g. point
  the registry's `skill` at a name that does not exist) and confirm the lane
  **fails**: the Lane-A payload is discarded, `coverage_note` carries the
  verbatim rejection or "not verified" text, `deviation` is true, and the skill
  takes the `dispatch-mark-deviation` park path at Step 7 rather than writing the
  phase-completed marker. Confirm the park's recorded reason contains the
  underlying error text — a park that says only "instrument failed" fails this
  check.
- **Non-regression on the throttle path.** Confirm a `null` `code-review` result
  still takes the existing short-circuit
  (`coverage_incomplete: true`, security wave skipped, `dispatch:reviewed`
  applied, marker written) and does **not** park the node. The unit fixture
  `null-res` covers the helper; this check covers the wiring.
- **Transcript sweep (judgment, against live transcripts).** Over a window of
  workflow subagent transcripts, find occurrences of
  `cannot be used with Skill tool due to disable-model-invocation` and confirm no
  occurrence is followed by findings from the same agent being merged. This is
  deliberately not a source-tree grep — the string appears only in tool results,
  never in committed code, so a repo grep would assert nothing.
- **`strategy-token-economy` sensor reading.** Confirm that on an
  instrument-failure run the outcome envelope credits no yield to the discarded
  instrument: `fixes_applied` counts zero fixes from it, and it contributes no
  `Fixed`-bucket disposition. This is the paired half of the invariant — no yield
  metric may be credited to an instrument whose invocation was not verified.

