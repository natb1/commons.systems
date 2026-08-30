---
id: tactic-eval-finding-review-fix-workflow-args-rederived-each-pass
kind: tactic
statement: The /review-fix worker re-derives the Workflow args contract from
  .claude/workflows/review-fix.js on every pass — three greps costing about 100
  seconds into a context already at 193827 tokens — because the contract is
  hand-maintained in two places, SKILL.md and the script's own JSDoc, with
  neither declared authoritative and the two already drifted (23 fields
  documented, 20 actually read); give each of the three Workflow scripts a
  machine-declared ARGS_CONTRACT that validates args at entry, point the
  skill-side blocks at it as the canonical home, and pin the pair with a CI
  ratchet
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications:
  - question: Which of the two candidate fixes in this node's original finding does
      the serving strategy settle on, and what constrains how it is built?
    answer: "(Recorded 2026-08-19 /align-tactics per-node drift review.) The node
      body offers two fixes and calls option 2 \"strictly better\" without
      saying what settles it; the serving strategy already does. Condition 21
      rules that \"Restating the doctrine in each producer's PROSE is not
      compliance\", and the 2026-08-14 lens-catalog clarification rules that the
      structural fix is to make a carrier-less thing one that CANNOT BE INVOKED
      rather than one that quietly does not run. Both point the same way: option
      1 alone (a SKILL.md paragraph asserting the block is complete, plus a
      pairing obligation) is prose discipline with no gate, and the node body
      itself concedes it \"depends on the pairing obligation being honoured\".
      The recorded resolution is therefore option 2 as the primary —
      review-fix.js validates args at entry and fails loudly on a
      missing/unknown field — with option 1's SKILL.md half kept as the cheap
      complement rather than the whole fix. Two build limits owned at record
      time. FIRST, there is no schema-validation engine to call: no ajv/zod
      dependency exists anywhere in the repo, and review-fix.js's ~14 `*_SCHEMA`
      constants (e.g. FINDING_ITEM_SCHEMA at :111) constrain SUBAGENT output via
      the Workflow tool's `schema:` param and are never runtime-validated
      against themselves. The validator must be hand-written imperative field
      checks hooked in right after the existing normalization at
      review-fix.js:1547, imitating the shape of the two checks at :1561 and
      :1577 (per-field guard, `throw new Error()` naming the exact field and the
      upstream step that should have set it, per .claude/rules/code-style.md).
      This would be the FIRST generalization of that pattern, not a reuse of an
      existing helper — no validateArgs/requireField/assertArgs helper exists in
      .claude/workflows/*.js. SECOND, the SKILL.md half has an exact in-repo
      precedent to copy rather than invent: .claude/rules/planning.md cites
      \"the PLAN BODY SCHEMA block inlined in buildPlanPrompt
      (.claude/workflows/align-tactics.js), summarized in
      .claude/skills/align-tactics/SKILL.md\", and
      .claude/skills/align-tactics/SKILL.md:330-335 points at that block as
      \"the schema's canonical home\" without restating it — the same
      one-canonical-home phrasing .claude/skills/implement-unit/SKILL.md:17-18
      uses for the model heuristic. Apply that citation style to review-fix
      rather than writing new prose."
  - question: Is this node a duplicate of
      tactic-eval-finding-review-orchestration-outspends-review-lenses, given
      both were measured from the same session window, and what does the answer
      mean for this plan’s scope?
    answer: "(Recorded 2026-08-19 /align-tactics per-node drift review.) This node
      is NOT a duplicate of
      tactic-eval-finding-review-orchestration-outspends-review-lenses, and the
      scope boundary between them is already recorded on that sibling rather
      than inferred here: its \"What would have to change\" section names this
      node by id as one of three component entries with \"concrete, non-redesign
      fixes\", together accounting for roughly 270s and $5.50 of the parent's
      830s / $62 orchestration floor (the siblings being
      tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-\
      lane and
      tactic-eval-finding-workflow-file-writes-cost-subagent-roundtrips). Both
      nodes are drafts measured from the same window — the review phase of
      tactic-attention-namespaced-rank, 2026-08-13T22:44:24Z-23:01:54Z — so the
      shared window is expected and is not evidence of a merge failure. Recorded
      because this strategy's own success_signal counts \"no two tactics
      recording the same root-cause defect\" and its baseline
      (duplicate_finding_nodes_same_defect 2, measured 2026-08-13 on
      tactic-eval-finding-eval-finding-list-misses-nonledger) makes a
      wrongly-judged pair a regression against a live sensor. The consequence
      for a plan authored on this node: its scope is bounded to the ~100s args
      re-derivation — the SKILL.md args block and review-fix.js's args entry
      point — and it must NOT widen to the orchestrator's remaining 41-Bash-call
      setup floor, which is the parent entry's own scope."
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
    - metric: args_rederivation_wall_clock_s
      value: 100
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: args_rederivation_bash_calls
      value: 3
      unit: calls
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: orchestrator_peak_context_tokens
      value: 193827
      unit: tokens
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Give the Workflow `args` contract one machine-declared home per script

## Context

### The observed defect

`tactic-attention-namespaced-rank`, phase `review`, 2026-08-13, worker session
`6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`.

Between finishing the `/code-review` pre-stage (22:51:23Z) and calling the
Workflow tool (22:53:03Z) the worker spent **100 seconds and 8 Bash calls**
assembling the Workflow `args`. Three of those calls exist only to re-derive,
from source, which fields `review-fix.js` actually consumes:

```
wc -l .claude/workflows/review-fix.js
grep -n "args\.\|args\[" .claude/workflows/review-fix.js | head -80

grep -n "args\.review_plan\|args\.pr_num\|args\.surface\|args\.deps\b\|args\.implementing_issues\|args\.security_note\|args\.prior_phase_log\|args\.prescanned_findings" .claude/workflows/review-fix.js | head -30

grep -n "^const {" .claude/workflows/review-fix.js | head -5
grep -n "= args\b\|const args" .claude/workflows/review-fix.js | head -10
sed -n '1,60p' .claude/workflows/review-fix.js
```

That is up to 80 `args.` reference lines plus the script's first 60 lines pulled
into a context already at `peak_context=193827` — the highest of any session in
the phase.

Evidence: worker transcript `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl`,
`tool_use` entries timestamped 22:51:55.719Z, 22:51:58.908Z and 22:52:02.380Z,
descriptions "Inspect review-fix.js Workflow script for expected args fields",
"Check additional args field usages", "Check top of script for args
destructuring".

### Root cause — duplication, not absence

`.claude/skills/review-fix/SKILL.md` **does** carry a Workflow args block. The
worker read it and went to the source anyway, and it was **right to**: the two
copies genuinely disagree.

Re-measured 2026-08-19 on origin/main `43cf33f6`. Locate every anchor below by
**content**, not by line number — the edits in this plan shift them:

- `.claude/skills/review-fix/SKILL.md` — the fenced `args = {` block opens at
  **:871** and closes at **:908**. (`review_base_recorded` is at **:876**; an
  older finding cited `:874`.) Trailing prose at **:910-912** instructs the
  worker to pass `prior_phase_log`.
- Nothing anywhere declares that block complete or authoritative.
  `grep -in "authoritative"` over that SKILL.md returns exactly two hits, both
  unrelated (`:904` "the AUTHORITATIVE fixed[] constraint" about
  `code_review.touched_files`; `:992` about Step 7's flush guard). No
  "do not read the script to confirm this" sentence exists.
- `.claude/workflows/review-fix.js` (4385 lines) carries its **own** `args IN:`
  contract as a JSDoc block at **:19-58**. Two hand-maintained copies, in two
  files, neither declared primary.
- The script performs **no schema validation of `args`**. It has exactly two
  ad-hoc hand-written contract checks, both `throw new Error`:
  - **:1561-1566** — `args.code_review` missing or `status !== 'ok'`
  - **:1577-1582** — `args.result_out_dir` missing/empty

  Both sit immediately after
  `const _a = typeof args === 'string' ? JSON.parse(args) : (args || {});` at
  **:1551**.

**The drift is already live.** SKILL.md documents **23** fields; the script
reads **20**. Three documented fields are never read by any code:

| Field | Status in `review-fix.js` |
|---|---|
| `deps` | JSDoc header only (`:21`); no code reads it |
| `review_base_source` | JSDoc header only (`:26`); no code reads it |
| `prior_phase_log` | **zero** occurrences — not even in the JSDoc |

So a worker that re-derives the list from source today finds a *genuine*
mismatch. That is exactly why the re-derivation keeps paying off and keeps
recurring, and it is why a bare "this block is authoritative" sentence would be
a lie the moment it landed: it would enshrine three phantom fields.

The 20 fields `review-fix.js` actually consumes (union of `args.*` and `_a.*`):
`api_call_site`, `app_or_rules`, `blast_radius_files`, `blast_radius_generic`,
`blast_radius_truncated`, `changed_files`, `code_review`, `implementing_issues`,
`merge_base`, `prescanned_findings`, `prior_findings`, `pr_num`,
`result_out_dir`, `review_base`, `review_base_recorded`, `review_changed_files`,
`review_plan`, `run_started_at`, `security_note`, `surface`.

### The same defect in both sibling Workflow scripts (measured 2026-08-19)

`.claude/workflows/` contains exactly three scripts. Neither sibling has **any**
args contract check, and both have live doc/code drift of the same shape:

- **qa-fix** — args block at
  `.claude/skills/qa-fix/references/disposition-workflow.md:11` (not in
  `SKILL.md`). Documents **11** fields; `.claude/workflows/qa-fix.js`
  (625 lines) reads **6**: `acceptance_criteria`, `browser_available`,
  `changed_files`, `firestore_caveat`, `plan_fix`, `residue`. Unread:
  `pr_num`, `issue_num`, `app_dir`, `prior_attempt_summary`, `prior_phase_log`.
  Normalization at `qa-fix.js:249`.
- **align-tactics** — args blocks at
  `.claude/skills/align-tactics/SKILL.md:250` (strategy mode) and
  `.claude/skills/align-tactics/references/tactic-target.md:90` (tactic mode).
  `.claude/workflows/align-tactics.js` (1354 lines) reads **6**: `mode`,
  `strategy`, `target_node`, `draft_tactics`, `existing_children`,
  `reuse_hunts`. Unread: `existing_ids` — and its JSDoc at `align-tactics.js:54`
  says why: *"for the caller's resolveTempRefs pass"*. That is a **legitimate**
  reserved-for-caller field, not a phantom, and the design below must be able to
  express the difference rather than delete it. Normalization at
  `align-tactics.js:1017`.

### Intended outcome

A worker building `args` reads one place, is told that place is complete, and
gets a cheap loud correction if it is wrong anyway. The re-derivation cost
(~100s and ~140 lines of context per pass, forever) goes to zero, and the
doc/code drift that justified the re-derivation is closed and kept closed by CI.

### Design — greenfield

The Workflow script is the **single canonical home** of its own args contract,
declared as data rather than as prose:

1. Each script carries a sentinel-bounded `ARGS_CONTRACT` object — one entry per
   field, with `required` and `consumed` flags and a one-line purpose — plus a
   `validateWorkflowArgs()` loop run immediately after `args` normalization. It
   throws on a missing required field and on an **undeclared** field. The two
   existing hand-written checks are absorbed into it.
2. The skill-side args block stops being an independent restatement and becomes
   a **pointer plus caller-side build guidance**: it names `ARGS_CONTRACT` as
   canonical, states the list is complete, and says explicitly that the script
   must not be read to confirm it.
3. A CI guard asserts the two never drift again — the field-name set in the
   skill-side block must equal `Object.keys(ARGS_CONTRACT)`.

This is the repo's own established pattern, not a new invention.
`.claude/workflows/align-tactics.js:944` inlines a `PLAN BODY SCHEMA` block that
`.claude/skills/align-tactics/SKILL.md:330-335` points at and calls "the schema's
canonical home" without restating it; `.claude/rules/planning.md` cites it that
way; `.claude/skills/implement-unit/SKILL.md:17-18` uses the identical
"single canonical home … reference this section rather than restating it"
phrasing. What this plan adds over those precedents is that the canonical home is
**machine-readable and runtime-enforced**, so option 1's pairing obligation
(update the block in the same commit) is a CI failure rather than a hope.

**Why the validator is per-script and not shared.** Workflow scripts run in a
restricted context with no filesystem and no Node.js API access; `import` /
`require` are unavailable (confirmed: none of the three scripts contains an
`import` or `require(` for a module — the only `require`-substring hit in the
tree is the identifier `requiredFindings` at `review-fix.js:2732`). A validator
therefore **cannot** be factored into a shared module the three scripts import.
Each script carries its own inline copy; the "one home" is enforced by the CI
guard, which is a convention-plus-lint, not a shared runtime import. Do not spend
time trying to build a shared module — that constraint is the reason the design
looks duplicated.

**No schema library.** No JSON-Schema engine (`ajv`, `zod`, …) exists anywhere in
the repo. `review-fix.js` already contains ~13 JSON-Schema-shaped constants
(`FINDING_ITEM_SCHEMA` at `:111-161`, `LANE_A_SCHEMA`, `CLASSIFY_SCHEMA`,
`FIX_SCHEMA`, `RESIDUE_SCHEMA`, `DUMP_SCHEMA` at `:1052, 1655, 1766, 1862, 2183,
2603, 2804, 3024, 3337, 3541, 4129, 4184`), but those constrain **subagent
output** via the Workflow tool's `schema:` param on `agent()` calls and are never
runtime-validated against anything. The repo convention for a real runtime
validator is hand-written imperative field checks that throw a typed error —
`packages/intentionsutil/src/schema.ts:956` `validateNode()` is the canonical
example. Follow the imperative style, not a schema library.

### Design — brownfield / migration

There is no backwards-incompatibility to migrate: each Workflow script has
exactly one caller (its own skill), both live in this repo, and both change in
the same commit. The only sequencing constraint is that the script-side contract
must land at or before the skill-side pointer, so the migration path is simply
the unit order below. No feature flag, no dual-read period.

### Explicit non-collision with `tactic-workflow-launch-contract-home`

`tactic-workflow-launch-contract-home` (phase `null`, draft) proposes giving the
Workflow **launch** contract — the registry `name` vs `scriptPath` form — one
home under `.claude/rules/`, repointing five sites:
`.claude/skills/review-fix/SKILL.md:284`,
`.claude/skills/qa-fix/SKILL.md:324`,
`.claude/skills/align-tactics/SKILL.md:210`,
`.claude/skills/align-tactics/references/tactic-target.md:100`,
`.claude/skills/qa-fix/references/disposition-workflow.md:69`.

That is the launch **form**; this node is the args **field list**. They are
adjacent — the "Invoke the Workflow tool on the registered X workflow" sentence
sits a few lines from each args block — and they must **not** be merged.

This plan therefore **adds no `.claude/rules/` file** and edits none of those
five anchor sentences. Composition, stated so a later reader does not have to
re-derive it: if that node later lands a `.claude/rules/workflow-launch.md`, the
skill-side args blocks this plan rewrites will sit beside a pointer to it, and
the two pointers coexist (one names the launch form, one names the field list).
An implementer of *this* plan who finds itself editing an "Invoke the Workflow
tool on …" sentence has strayed out of scope — revert that hunk.

### Precedent for the cheap form

The sibling ledger entry `tactic-eval-finding-qa-fix-workflow-named-by-path`
(phase `done`) was closed by a one-line SKILL.md correction. A prose-only fix is
an accepted shape for this class here. This plan is larger than that only because
the measured drift makes the prose-only fix untrue on the day it lands; Units 1
and 4 are what make the prose true and keep it true.

---

## Unit 1 — Declare and enforce `review-fix.js`'s args contract

### Scope

Edit only `.claude/workflows/review-fix.js`.

**Add a sentinel-bounded `ARGS_CONTRACT` + validator, immediately after the
normalization line.** Insert after
`const _a = typeof args === 'string' ? JSON.parse(args) : (args || {});`
(currently `:1551`) and its `log(...)` line, and **before** the existing
`if (!_a.code_review …)` check at `:1561`.

Sentinel comments must follow the existing convention in this file exactly (see
`review-fix.js:975-976, 1292, 3178-3186` and the consumer
`.claude/skills/dispatch-propagate/scripts/review-fix-xlane-dedup-probe.mjs:37-42`):

```js
// >>> args contract: sliced + eval'd by workflow-args-contract-probe.mjs >>>
const ARGS_CONTRACT = { /* … */ };
function validateWorkflowArgs(a, contract, scriptName) { /* … */ }
// <<< args contract <<<
```

The sliced region must be **self-contained**: it may not reference `log`, `_a`,
or any Workflow global, because the probe evals it standalone (same requirement
the file already documents at `:1292` and `:3178-3186`).

**`ARGS_CONTRACT` shape** — one entry per field:

```js
const ARGS_CONTRACT = {
  pr_num: { required: true, consumed: true, note: 'PR number under review' },
  // …
  deps: { required: false, consumed: false, note: 'accepted, currently unread by this script' },
};
```

Declare **all 23** fields the skill passes. Set `consumed: false` on exactly
these three, with a `note` saying so:

- `deps` — documented in the JSDoc at `:21`, no code reads it
- `review_base_source` — documented in the JSDoc at `:26`, no code reads it
- `prior_phase_log` — documented only in SKILL.md `:899` / `:910-912`

Do **not** delete them from the skill's call. Declaring-and-marking is what makes
the authority claim true without changing caller behaviour, and it preserves the
JSDoc's stated intent for `deps` / `review_base_source`. (The
`align-tactics.js:54` `existing_ids` case — a field passed deliberately for the
*caller's* own later use — is why the `consumed` flag exists rather than a
delete-the-phantoms rule.)

`required: true` for the fields whose absence breaks the run: `pr_num`,
`merge_base`, `changed_files`, `surface`, `code_review`, `result_out_dir`,
`run_started_at`, `prescanned_findings`, `implementing_issues`. Everything else
`required: false` — in particular `review_plan` (SKILL.md explicitly says "OMIT
it on any fail-open path", and the JSDoc at `:35-42` says it **fails OPEN,
always**), `security_note` (`<string or omit>`), and every `blast_radius_*` /
`review_base*` field. Getting this wrong turns a fail-open path into a hard
throw — when in doubt, `required: false`.

**`validateWorkflowArgs(a, contract, scriptName)` semantics:**

- Missing/`undefined` required field → collect.
- Key present in `a` but absent from `contract` → collect as undeclared.
- If anything was collected, `throw new Error()` with a message that names the
  script, lists the offending fields, and points the reader at `ARGS_CONTRACT` as
  the canonical list. Imitate the message shape of the two existing throws at
  `:1561-1566` and `:1577-1582`: name the exact field, why it is required, what
  upstream step should have set it, and cite `.claude/rules/code-style.md`
  ("a clear error, never a defensive fallback").
- No fallbacks, no warn-and-continue. Per `.claude/rules/code-style.md`.

**Absorb the two existing checks.** Call
`validateWorkflowArgs(_a, ARGS_CONTRACT, 'review-fix.js')` where those checks sit
today, then keep only the residual *semantic* half of each — `code_review` is now
presence-checked by the loop, so its own `if` narrows to
`_a.code_review.status !== 'ok'`; `result_out_dir` is presence-checked by the
loop, so its own `if` narrows to the non-empty-string check. Both keep their
existing explanatory comments and their existing error text verbatim; those
comments carry ground (`:1554-1560`, `:1571-1576`) that must not be lost.

**Update the JSDoc `args IN:` block at `:19-58`** to stop being a second
authority: replace the field enumeration's *authority* framing with a one-line
pointer — "the complete, authoritative field list is `ARGS_CONTRACT` below; this
header narrates the non-obvious fields only". Keep the long explanatory prose on
`review_base` / `review_base_recorded` / `review_plan` / `run_started_at` /
`code_review` — that prose is ground, not duplication, and deleting it loses
information the contract object cannot carry.

**Out of scope:** any behaviour change to the fan-out, the finders, the dedup, or
the return envelope. No edits to `qa-fix.js` or `align-tactics.js` (Unit 3). No
`.claude/rules/` file. No edits to any "Invoke the Workflow tool on …" sentence.

### Recommended model

opus

---

## Unit 2 — Point `review-fix/SKILL.md` at the canonical home

### Scope

Edit only `.claude/skills/review-fix/SKILL.md`, Step 2's "Build `args` and invoke
the Workflow" section (the fenced `args = {` block at `:871-908` and the prose
immediately around it — locate by content; Unit 1 does not move these lines but
this unit does).

**Add the authority declaration** immediately above the fenced block, in the
repo's existing phrasing (mirror `.claude/skills/align-tactics/SKILL.md:330-335`
and `.claude/skills/implement-unit/SKILL.md:17-18`):

> `ARGS_CONTRACT` in `.claude/workflows/review-fix.js` is the **single canonical
> home** of this field list. The block below is complete and authoritative as
> written — **do not read `review-fix.js` to confirm it.** If the Workflow rejects
> an args object, its error names the offending field; fix the call from that
> error, not from a source read. Any new `args.` field in `review-fix.js` updates
> `ARGS_CONTRACT` **and** this block in the same commit —
> `test-workflow-args-contract.sh` fails the PR otherwise.

**Keep the fenced block**, and keep every per-field comment in it — the caller
genuinely needs the build guidance (how `REVIEW_BASE_RECORDED` is derived, that
`code_review.touched_files` is the authoritative `fixed[]` constraint, that
`review_plan` is omitted on any fail-open path). This block is *caller-side build
instructions* that happen to enumerate the same names; the contract object is the
*authority*. That division is the point — do not reduce this to a bare pointer,
and do not delete the surrounding prose at `:910-912`.

**Mark the three unconsumed fields inline** so a reader who notices the asymmetry
does not go to the source to check it — append to each of `deps`,
`review_base_source`, `prior_phase_log` a comment in the form
`// declared, currently unread by review-fix.js (ARGS_CONTRACT: consumed:false)`.
This is the sentence whose absence caused the finding: it pre-empts the exact
question the worker went to source to answer.

**Field-name set must equal Unit 1's `Object.keys(ARGS_CONTRACT)` exactly** — 23
names, same spelling. Unit 4's guard asserts this.

**Out of scope:** every other section of this SKILL.md, including Step 1a/1b, the
Per-finding schema section, and the "Invoke the Workflow tool on the registered
`review-fix` workflow" sentence at `:284`.

### Recommended model

sonnet

### Dependencies

Unit 1.

---

## Unit 3 — Apply the same contract to `qa-fix` and `align-tactics`

### Scope

The finding asks that the sibling Workflow skills be checked; they were, and both
have the same defect. Repeat Unit 1 + Unit 2 for each, using the field lists
measured below so no re-derivation is needed.

**`.claude/workflows/qa-fix.js`** — insert the sentinel-bounded `ARGS_CONTRACT` +
the same `validateWorkflowArgs` implementation (copied verbatim from
`review-fix.js`; it cannot be imported) immediately after
`const _a = typeof args === 'string' ? JSON.parse(args) : (args || {});` at
`:249`. This script has **no** existing contract check to absorb. Declare all
**11** documented fields: `pr_num`, `issue_num`, `app_dir`, `browser_available`,
`firestore_caveat`, `residue`, `plan_fix`, `acceptance_criteria`,
`changed_files`, `prior_attempt_summary`, `prior_phase_log`. Mark
`consumed: false` on the five the script does not read: `pr_num`, `issue_num`,
`app_dir`, `prior_attempt_summary`, `prior_phase_log`. `required: true` on the
six it does read: `acceptance_criteria`, `browser_available`, `changed_files`,
`firestore_caveat`, `plan_fix`, `residue`.

**`.claude/skills/qa-fix/references/disposition-workflow.md`** — the args block
at `:11`. Add the same authority declaration above the fence (naming
`qa-fix.js`'s `ARGS_CONTRACT`) and the same inline `consumed:false` markers.

**`.claude/workflows/align-tactics.js`** — same insertion after `:1017`. No
existing contract check to absorb. Declare all **7** documented fields: `mode`,
`strategy`, `target_node`, `draft_tactics`, `existing_children`, `reuse_hunts`,
`existing_ids`. Mark `existing_ids` `consumed: false` with the note the JSDoc at
`:54` already gives — *"passed for the caller's own `resolveTempRefs` pass; this
script never reads it"* — which is a reserved-for-caller field, **not** a
phantom. `required: true` on `mode`, `strategy`, `target_node`; the rest
`required: false` (`target_node` is tactic-mode-only in practice — if making it
unconditionally required would break strategy mode, mark it `required: false` and
leave the mode-specific check to existing code rather than inventing conditional
`required` semantics).

**`.claude/skills/align-tactics/SKILL.md:250`** (strategy mode) and
**`.claude/skills/align-tactics/references/tactic-target.md:90`** (tactic mode) —
both get the authority declaration and the `existing_ids` marker. Note the
tactic-mode block at `tactic-target.md:99` documents `existing_ids` while the
strategy-mode block at `SKILL.md:263` documents it too; both must carry the same
7 names as `ARGS_CONTRACT` so the guard's set comparison passes for both blocks.
If tactic mode genuinely does not pass a field, still list it in both blocks with
a comment saying which mode uses it — the contract is per-script, not per-mode,
and inventing per-mode contracts is out of scope for this unit.

**Do not deviate from the `ARGS_CONTRACT` / `validateWorkflowArgs` shape Unit 1
established.** Three near-identical copies is the intended outcome given the
no-import constraint; a clever divergence defeats the CI guard.

**Out of scope:** any behaviour change in either script; any edit to
`.claude/skills/qa-fix/SKILL.md:324`,
`.claude/skills/align-tactics/SKILL.md:210`, or
`.claude/skills/qa-fix/references/disposition-workflow.md:69` (those are
`tactic-workflow-launch-contract-home`'s launch-form sites).

### Recommended model

sonnet

### Dependencies

Unit 1.

---

## Unit 4 — CI guard: the two copies can never drift again

### Scope

Add two files and one CI step.

**`.claude/skills/dispatch-propagate/scripts/workflow-args-contract-probe.mjs`**
— modeled directly on
`.claude/skills/dispatch-propagate/scripts/review-fix-xlane-dedup-probe.mjs`
(read it first; reuse its structure, its path-resolution comment, and its
fail-loudly sentinel-count check verbatim in spirit). Takes the script basename
as `argv[2]`, resolves it at `../../../workflows/<name>` relative to
`import.meta.url`, slices the `// >>> args contract:` … `// <<< args contract <<<`
region, `eval`s it standalone, and prints JSON on stdout:

```json
{ "fields": ["…"], "required": ["…"], "unconsumed": ["…"],
  "missing_required_throws": true, "undeclared_throws": true, "clean_passes": true }
```

The last three come from driving `validateWorkflowArgs` with synthetic objects:
one omitting a required field (must throw), one carrying an undeclared key (must
throw), one carrying exactly the required set (must not throw). Fail loudly if a
sentinel appears zero or more than once — reuse
`review-fix-xlane-dedup-probe.mjs`'s `countOccurrences` guard.

The probe must **not** import or execute the Workflow script itself: these
scripts have top-level `await` and injected globals and cannot be run by node
(the existing probe's header documents exactly this at its lines 15-17).

**`.claude/skills/dispatch-propagate/scripts/test-workflow-args-contract.sh`** —
a doctrine ratchet modeled on
`.claude/skills/dispatch-propagate/scripts/test-align-tactics-terminal-marker.sh`
(read it first). Use its exact preamble:

```bash
set -euo pipefail
FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"
```

and its `assert_eq` / `report_results` helpers (defined in
`dispatch-test-fixture.sh:51` and used throughout that file). Resolve the repo
root the same way that test does: `GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)`.
Give each requirement its own assertion rather than one pass/fail, and carry the
same header note that suite carries: if an expectation legitimately changes,
update the row and confirm the guarantee still holds — never drop a row to make
the suite green (`.claude/rules/test-integrity.md`).

Assertions, per `(script, doc-file, doc-block-marker)` triple — three triples:
`review-fix.js` ↔ `.claude/skills/review-fix/SKILL.md`;
`qa-fix.js` ↔ `.claude/skills/qa-fix/references/disposition-workflow.md`;
`align-tactics.js` ↔ both `.claude/skills/align-tactics/SKILL.md` **and**
`.claude/skills/align-tactics/references/tactic-target.md`:

1. **Set equality** — the field names in the doc's fenced `args = {` block equal
   `Object.keys(ARGS_CONTRACT)`. Extract doc names with `awk` bounded by the
   `args = {` line and the closing `}` line (the awk-between-markers technique
   `test-align-tactics-terminal-marker.sh:46-50` uses), matching `^ *([a-z_]+):`
   at the block's top nesting level only — `code_review`'s nested keys
   (`status`, `findings_path`, `patch_path`, `touched_files`) and `strategy`'s
   nested keys must **not** be counted. Compare sorted, newline-joined, via
   `assert_eq`; a mismatch prints both sides so the failure names the drifted
   field.
2. **Authority sentence present** — the doc contains both `ARGS_CONTRACT` and a
   "canonical home" phrase, and the "do not read … to confirm it" clause.
3. **Validator wired** — the script calls
   `validateWorkflowArgs(_a, ARGS_CONTRACT, '<script>')`, and the call appears
   **after** the `const _a = typeof args === 'string'` normalization line
   (compare `grep -n` line numbers; the ordering is the point, exactly as
   `test-review-plan-gate.sh:237-260` pins two independently-stated contracts
   with an explicit equality and says "THE EQUALITY IS THE POINT").
4. **Probe behavioural assertions** — `missing_required_throws`,
   `undeclared_throws`, `clean_passes` are all `true`.
5. **Unconsumed fields are marked in the doc** — every name in the probe's
   `unconsumed` list appears in the doc with a `consumed:false` marker on or
   adjacent to its line.

**Register the step in `.github/workflows/unit-tests.yml`**, in the hook-tests
job, alongside the existing `test-review-fix-*.sh` steps at `:249-263` and the
doctrine ratchets at `:271-275`. Follow the exact two-line shape used there:

```yaml
      - name: Run Workflow args-contract doctrine ratchet
        run: .claude/skills/dispatch-propagate/scripts/test-workflow-args-contract.sh
```

This registration is **load-bearing and must not be skipped**:
`run-unit-tests.sh` has no mapping for `.claude/workflows/*`, and its
`test-*.sh` glob over the scripts directory only runs when `RUN_PR_SCRIPTS` is
set — which auto-detect sets solely for changed paths under
`.claude/skills/dispatch-propagate/scripts/` (`run-unit-tests.sh:88`). The
hook-tests job in `unit-tests.yml` is the only vector that runs on every PR.
`review-fix-xlane-dedup-probe.mjs`'s header documents this same trap; carry an
equivalent note into the new probe and test headers.

**Out of scope:** `run-lint.sh` and `lint-prose-rules.sh`. This is a
two-structured-sources drift check, not a net-new-added-lines ERE scan, so it
belongs in the test-guard family (`test-align-tactics-terminal-marker.sh`,
`test-review-plan-gate.sh`), not the prose-lint family. Do not add a
`.claude/rules/*.md` file or a suppression marker.

### Recommended model

sonnet

### Dependencies

Units 1, 2, 3.

---

## Reuse

- `.claude/workflows/review-fix.js:1551` — `const _a = typeof args === 'string' ? JSON.parse(args) : (args || {})`.
  The existing normalize-then-validate entry point. Hook the validator in right
  after it; do not duplicate the string-vs-object handling. Same line at
  `qa-fix.js:249` and `align-tactics.js:1017`.
- `.claude/workflows/review-fix.js:1561-1566` and `:1577-1582` — the two
  hand-written `throw new Error` contract checks. The message shape to imitate
  (name the field, why it is required, which upstream step sets it, cite
  `.claude/rules/code-style.md`) and the two checks Unit 1 absorbs. There is no
  existing `validateArgs`/`requireField`/`assertArgs`/`checkArgs` helper anywhere
  in `.claude/workflows/*.js` or the repo — this is the first generalization of
  the pattern, not a reuse of a helper.
- `.claude/workflows/review-fix.js:975-976`, `:1292`, `:3178-3186` — the existing
  sentinel-bounded-region convention, including the requirement that a sliced
  region reference no Workflow global so it stays eval-able standalone.
- `.claude/skills/dispatch-propagate/scripts/review-fix-xlane-dedup-probe.mjs` —
  the whole slice-and-eval probe mechanism: `import.meta.url` path resolution,
  `readFileSync`, sentinel constants, the `countOccurrences` fail-loudly guard,
  and the CI-vector header note. Unit 4's probe is this file with a different
  region and a JSON summary.
- `.claude/skills/dispatch-propagate/scripts/test-align-tactics-terminal-marker.sh` —
  the doctrine-ratchet shape: fixture sourcing, `GUARD_ROOT` resolution,
  awk-extract-a-section-then-assert, one assertion per requirement, the
  test-integrity header note, `report_results`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:51` —
  `assert_eq`; `:1950`/`:1964` `assert_contains_local` / `assert_not_contains_local`.
  Note `.claude/rules/shell-json.md`: never `echo` captured JSON into `jq`; use
  `<<<` or `printf '%s'`. The probe's stdout is piped directly to `jq`, which is
  safe.
- `.claude/skills/dispatch-propagate/scripts/test-review-plan-gate.sh:237-260` —
  the cross-value equality assertion precedent ("THE EQUALITY IS THE POINT") for
  pinning two independently-stated contracts.
- `.claude/skills/align-tactics/SKILL.md:330-335` and
  `.claude/skills/implement-unit/SKILL.md:17-18` — the exact "single canonical
  home … reference this section rather than restating it" phrasing to reuse in
  Units 2 and 3. `.claude/rules/planning.md` cites the first of these as the
  repo's established `.js`-is-authoritative / `.md`-summarizes-and-cites pattern.
- `packages/intentionsutil/src/schema.ts:956` `validateNode()` and
  `packages/intentionsutil/src/errors.ts:1-6` `IntentionSchemaError` — the
  repo-wide convention of hand-written imperative field checks that throw. The
  Workflow scripts use plain `throw new Error('<script>.js: …')` with a
  file-prefixed message; match that, not the typed-subclass form (Workflow
  scripts have no module system to define one in cleanly).
- `.github/workflows/unit-tests.yml:249-275` — the hook-tests job step shape to
  copy for registration.
- **Negative reuse, recorded so it is not re-attempted:** `review-fix.js:111-113`
  notes that `FINDING_ITEM_SCHEMA` "mirrors the Per-finding schema section of
  SKILL.md" — but that sync is manual, `SCHEMA_BLURB` at `:1099` is hand-written
  prose rather than generated from the constant, and no test checks one against
  the other. That is a precedent for the **problem**, not for a solution.

## Verification

```verify
node --check .claude/workflows/review-fix.js || exit 1
node --check .claude/workflows/qa-fix.js || exit 1
node --check .claude/workflows/align-tactics.js
```

```verify
node .claude/skills/dispatch-propagate/scripts/workflow-args-contract-probe.mjs review-fix.js || exit 1
node .claude/skills/dispatch-propagate/scripts/workflow-args-contract-probe.mjs qa-fix.js || exit 1
node .claude/skills/dispatch-propagate/scripts/workflow-args-contract-probe.mjs align-tactics.js
```

```verify
.claude/skills/dispatch-propagate/scripts/test-workflow-args-contract.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-xlane-dedup.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-review-fix-diff-context.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-review-fix-skeptic-batch.sh
```

The last fence is the regression guard for Unit 1: those six suites slice other
sentinel-bounded regions out of `review-fix.js`, so they fail if the new sentinel
block was inserted in a way that breaks an existing region boundary.

```verify
grep -q 'test-workflow-args-contract.sh' .github/workflows/unit-tests.yml
```

**Negative check — this fence must FAIL on today's tree and PASS after the
change.** Confirm it fails first, or it is vacuous
(`.claude/rules/planning.md` / the negated-fence trap):

```verify
grep -q 'ARGS_CONTRACT' .claude/skills/review-fix/SKILL.md || exit 1
grep -q 'ARGS_CONTRACT' .claude/skills/qa-fix/references/disposition-workflow.md || exit 1
grep -q 'ARGS_CONTRACT' .claude/skills/align-tactics/SKILL.md || exit 1
grep -q 'ARGS_CONTRACT' .claude/skills/align-tactics/references/tactic-target.md
```

**Manual — the drift guard actually bites.** Machine checks cannot prove the
guard catches drift, only that it passes today. Do this once by hand and revert:
add a throwaway field `zz_probe: { required: false, consumed: false }` to
`review-fix.js`'s `ARGS_CONTRACT`, run
`test-workflow-args-contract.sh`, and confirm it FAILS on assertion 1 naming
`zz_probe`. Then remove it and confirm the suite goes green. A guard that passes
in both states is a vacuous guard and the unit is not done.

**Manual — the end-to-end behaviour the finding is about.** The real success
criterion is a `/review-fix` worker that builds `args` without reading
`review-fix.js`. That cannot be asserted mechanically; observe it on the next
review phase. In the phase's session, confirm there is **no** `grep`/`sed`/`wc`
against `.claude/workflows/review-fix.js` between the `/code-review` pre-stage
finishing and the Workflow tool call. Read it from the session's own transcript
or from `aggregate-usage.sh` at node scope; do not hand-read a multi-megabyte
transcript.

**Manual — fail-open paths still fail open.** The one way Unit 1 can regress
production is by marking a genuinely-optional field `required: true`. Before
merging, re-read `.claude/skills/review-fix/SKILL.md` Step 1a's fail-open prose
and `review-fix.js:35-42` and confirm `review_plan` is `required: false` in
`ARGS_CONTRACT`; likewise `security_note` ("`<string or omit>`", set for
empty/docs/tests, omitted for code) and every `blast_radius_*` and `review_base*`
field. A `required: true` on any of these turns a documented omission into a hard
throw on a live review phase.

**Manual — scope boundary.** Confirm the diff touches none of
`.claude/skills/review-fix/SKILL.md:284`,
`.claude/skills/qa-fix/SKILL.md:324`,
`.claude/skills/align-tactics/SKILL.md:210`,
`.claude/skills/align-tactics/references/tactic-target.md:100`,
`.claude/skills/qa-fix/references/disposition-workflow.md:69`, and adds no file
under `.claude/rules/`. Those belong to
`tactic-workflow-launch-contract-home`.
