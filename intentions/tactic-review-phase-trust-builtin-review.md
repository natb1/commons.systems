---
id: tactic-review-phase-trust-builtin-review
kind: tactic
statement: "review phase trusts /code-review max + /security-review built-in
  fix: drop the findings-only wrapper and the adversarial-verify/opus-fix
  pipeline for those two sources, run both on opus with defaults, opus subagent
  classifies and dispositions only the unfixed residue"
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-11 /align-strategy interview
  (strategy-graph-native-dispatch clarification refining clarification 19). The
  review phase currently double-wraps /code-review as a findings-only finder
  feeding a separate verify/fix pipeline; the author directs trusting the review
  skills' own built-in review+fix instead. Finalized to phase: implement by a
  2026-07-16 per-node /align-tactics run."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 4
  override: null
  rationale: "Author-directed 2026-07-11 boost 4 (own boost 4 +
    strategy-graph-native-dispatch inherited boost 5 -> authored 9), retained
    through the 2026-07-16 per-node /align-tactics finalize. Companion nodes
    tactic-graph-phase-launch-per-phase and tactic-graph-frozen-tactic-dispatch
    were boosted together in the same round to the same tier. The original
    'decomposes first once /align-tactics runs' framing is discharged: this node
    is now finalized to phase: implement with a full clean-session plan, and the
    retained boost keeps the implement-phase work top-ranked for router
    selection."
phase: qa
execution:
  branch: tactic-review-phase-trust-builtin-review
  pr: 2887
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# review phase trusts /code-review max + /security-review built-in fix

## Context

The dispatch **review phase** (`.claude/workflows/review-fix.js`, the Workflow-tool
port invoked by `.claude/skills/review-fix/SKILL.md`) currently **double-wraps**
the built-in `/code-review` and `/security-review` skills. Both run as
"findings-only" finders (`review-fix.js:322-342`) that emit findings into a
single shared pipeline — `gather → dedup → classify → adversarial-verify
(:650-744) → Opus-fix fan-out (:780-850) → file`. This throws away the built-ins'
own fix capability and their own internal verification, then pays a second time
for the workflow's skeptics and Opus fixers to re-derive and re-fix what those
skills already handle.

`strategy-graph-native-dispatch`'s 2026-07-11 clarification (refining
clarification 19) directs the review phase to **trust the built-in
review-and-fix** for these two sources instead: run them with their defaults on
opus, let them apply their own edits, and handle only the residue they do not
auto-fix. The 2026-07-13 **fix-everything-cheap** amendment (to clarification 19)
governs how that residue is dispositioned: a three-way resolve-in-scope / defer /
ignore split, not "file follow-ups wholesale."

**Intended outcome.** A two-lane finder fan-out. Lane A (`code-review`,
`security-review`) trusts the built-ins and dispositions their residue with one
opus contract-aware pass; Lane B (every other finder) keeps the existing pipeline
verbatim. The return envelope keeps its exact current shape so the consuming
SKILL body is behaviorally untouched.

**Two facts pinned during planning (verified against the compiled built-ins;
they bound the design):**

1. **`/code-review` has `--fix`; `/security-review` does not.** `/code-review max
   --fix` applies its own working-tree edits and re-reports each finding via the
   `ReportFindings` tool with a per-finding `outcome` of `fixed` /
   `no_change_needed` / `skipped`. `/security-review` is **findings-only** — no
   `--fix` flag, edits nothing, returns a markdown report — but it carries its
   own internal verification (per-finding false-positive filter scoring
   confidence 1–10, dropping below 8, HIGH/MEDIUM only). So `security-review`'s
   *entire* output is residue (nothing pre-fixed), already confirmed by its own
   filter. The clarification's "works with whatever they output **and edit**"
   phrasing is descriptively loose for `security-review` (it outputs, does not
   edit); this does not change the ratified doctrine — its findings simply flow
   100% into the residue path. Do **not** try to pass `--fix` to
   `/security-review`.

2. **The SKILL body is agnostic to *how* fixes are produced**, provided the
   envelope arrays keep their shape. `.claude/skills/review-fix/SKILL.md` reads
   only `dispositions[]` (builds the PR comment, organized by bucket),
   `deferred_filings[]` / `security_followup_input[]` (files them — on a
   graph-node target these are written as **draft tactic nodes** via
   `write-node.ts` + `graph-commit`, not gh issues), `verify_report[]`, and the
   scalar/count fields. It does **not** read `fixed[]` beyond its count
   (`fixes_applied`) and commits the working tree wholesale from `git status`
   regardless of who edited it. So Lane A must still populate `dispositions[]`
   (buckets Fixed / Required / Deferred / Informational), contribute to `fixed[]`
   (at least for the count), and push expensive out-of-contract residue into
   `deferred_filings[]`.

**Single biggest correctness constraint:** scope the pipeline removal to the
`code-review` + `security-review` sources **only**. The domain security finders
(`input-validation`, `secrets`, `red-team`, `auth`, `data-exposure`, `firebase`),
the `cost` finder, the prescanned `codeql`/`npm` findings, and the `erosion`
findings MUST still flow through the existing dedup → classify → adversarial-verify
→ Opus-fix → file pipeline unchanged.

This is one PR (one leaf tactic). The units below are its ordered internal
breakdown; they are tightly coupled (a partial landing leaves the workflow
broken) and land together.

---

## Units of work

### Unit 1 — Lane-A schemas + finder prompts (code-review `--fix`, security-review findings-only)

**Scope.** In `.claude/workflows/review-fix.js`:

- Add a `LANE_A_SCHEMA` near the schema block (`review-fix.js:57-175`):
  `{ fixed: [{location, fix_summary, touched_files[]}],
     residue: [{location, description, severity(enum high|medium|low), category,
     exploit_scenario, recommended_fix}] }` — one shape for both sources
  (`security-review` returns `fixed: []`).
- Add a module-level `const LANE_A = new Set(['code-review', 'security-review'])`.
- Rewrite `finderPrompt`'s two branches (`review-fix.js:322-342`):
  - **code-review (`:322-331`)** — drop the "You are a findings-only code-review
    subagent" line and the `--fix`-forbidden instruction (`:326`). New prompt:
    invoke the built-in `/code-review` skill with `max` effort **and `--fix`**;
    after it applies edits and re-reports via `ReportFindings`, collect
    `outcome: fixed` → `fixed[]` (with touched files + one-line summaries) and
    `outcome: skipped` → `residue[]`; **ignore `outcome: no_change_needed`**.
    Return `LANE_A_SCHEMA`.
  - **security-review (`:333-342`)** — new prompt: invoke `/security-review`
    (state explicitly it has **no `--fix`** and edits nothing); normalize its
    markdown report (already HIGH/MEDIUM, confidence ≥ 8, false-positive filtered)
    into `residue[]` (location, description, severity, category, exploit
    scenario, recommended fix); return `{ fixed: [], residue: [...] }`.

**Out of scope.** The dedup/classify/verify/fix bodies; the domain/cost finder
prompts (`:344-372`) stay verbatim.

**Recommended model:** opus — the subagent prompt + return schema are designed
from scratch with no `.claude/workflows/*.js` precedent for a workflow agent
running a built-in skill with `--fix`; the fixed-vs-residue capture semantics are
subtle.

### Unit 2 — Two-lane launch + result routing (preserve the throttle probe)

**Scope.** In the finders phase (`review-fix.js:392-465`):

- Keep the wave-1/wave-2 split and the `qualityDead` throttle-probe gate
  (`:426-445`) **unchanged**: `code-review` stays wave-1 and doubles as the
  throttle probe (a `null` result → skip the security wave, set
  `coverage_incomplete`); a throttled wave-1 now also correctly means "no
  self-fixes applied."
- Change `launchFinder` (`:416-423`) to branch on `LANE_A.has(name)`: Lane-A
  names use the Unit-1 prompt + `LANE_A_SCHEMA`; Lane-B names use the existing
  `finderPrompt` + `FINDINGS_SCHEMA`.
- Capture the two Lane-A results separately: the code-review result from
  `qualityResults`, and the security-review result from within `securityResults`
  (it is a wave-2, `surface==='code'` finder — `agentFinderSet` and its spec
  `dispatch-review-finders` are unchanged). **Exclude both from `allFindings`**:
  the gather loop (`:449-454`) concatenates only Lane-B finder results +
  `prescanned_findings`.
- Seed `fixed[]` early with code-review's own applied fixes (synthesize ids
  `code-review-fix-<n>`; each `{id, location, fix_summary, touched_files}`).

**Out of scope.** `agentFinderSet` (`:182-194`) and its normative spec
`dispatch-review-finders` — the finder *set* is identical; only routing changes.

**Recommended model:** opus — routing is the load-bearing correctness constraint
(Lane-A findings must never re-enter the Lane-B pipeline; the throttle-probe
semantics must survive).

**Dependencies.** Unit 1.

### Unit 3 — New `residue` phase: contract-aware three-way disposition + apply

**Scope.** In `review-fix.js`:

- Add `{ title: 'residue' }` to `meta.phases` (`:47-54`), sequenced **after
  `fix` and before `file`** (so no agent edits the working tree concurrently with
  the Lane-B Opus fix fan-out).
- Build a combined residue list = code-review residue + security-review residue,
  tagging each item with its `source`.
- Launch **one opus** subagent (`agentType: 'general-purpose'`, `phase: 'residue'`,
  increment `subagentsLaunched`) that:
  - receives the residue list + contract context (`_a.merge_base`,
    `_a.changed_files`) and is told to inspect the introduced diff read-only to
    judge in-contract;
  - is told these findings are **already confirmed** by the built-ins' own
    verification — do **not** re-run the workflow's adversarial skeptics; only
    decide disposition;
  - applies the three-way rule verbatim from the recorded doctrine (clarification
    19 + fix-everything-cheap):
    - **Resolve** (apply the fix to the working tree): confirmed AND breaks the
      tactic's own contract — the deliverable its plan claims, or the
      security/integrity of what the diff itself **introduced** — always,
      regardless of cost; OR confirmed out-of-contract AND **cheaper to fix than
      to defer**.
    - **Defer** (file a follow-up): confirmed, real, out-of-contract, and
      **expensive** to fix (pre-existing surface the diff merely touched,
      defense-in-depth where the design already fails closed, robustness under
      conditions no signal path exercises).
    - **Ignore** (audit-line only): refuted, unreachable failure scenario, below
      the meaningfulness threshold, or a fix that would add a defensive fallback
      contrary to `.claude/rules/code-style.md`.
  - **applies resolves in-session** (non-isolated Edit — edits land in the
    caller's worktree, exactly like the existing fix fan-out at `:823-831`,
    including the "Read before Edit" instruction at `:816`);
  - returns per item: `{ ref, source, severity, in_contract,
    disposition('resolve'|'defer'|'ignore'), applied, touched_files, fix_summary,
    rationale, followup_title, followup_body }`.
- Record outputs: resolve+applied → append to `fixed[]`; build `laneADispositions[]`
  (bucket `Fixed` for an applied resolve, `Required` for an unresolved
  in-contract security-review finding, `Deferred` for a defer, `Informational`
  for an ignore) and `laneADeferred[]` (defer items → filing entries).

**Out of scope.** Lane-B `verify_report[]` and `security_followup_input[]` — Lane
A contributes to neither (the codeql/npm security-followup lane is Lane B).

**Recommended model:** opus — the most architecturally complex, subtle-reasoning
unit (contract judgment + in-session edits + escalation inputs).

**Dependencies.** Unit 2.

### Unit 4 — Converge Lane A into the return envelope (dispositions, fixed, deferred_filings, deviation, counts)

**Scope.** In file-prep + return (`review-fix.js:866-1040`):

- Append `laneADeferred[]` to `deferred_filings` — reuse `shortTitle` (`:870-875`),
  `blockerNums` (`:876-879`), and the same body layout (`:906-916`) as the Lane-B
  builder (`:881-922`).
- Append `laneADispositions[]` to `dispositions` (`:971-996`), carrying
  `recommended_fix` for `Fixed`/`Required` entries so the Step-6 PR comment
  renders them in the existing buckets.
- Extend the **`deviation`** gate (`:957-964`): OR in a Lane-A contribution
  computed in JS, mirroring the existing predicate style — a confirmed
  **high-severity in-contract** security-review finding left unresolved must
  escalate the PR, e.g.
  `residue.some(r => r.source==='security-review' && r.severity==='high' &&
   r.in_contract && !(r.disposition==='resolve' && r.applied))`. Erosion is Lane B
  and untouched, so the non-escalation invariant holds.
- Confirm the count fields (`:998-1012`) still hold — `fixes_applied`,
  `findings_surfaced`, `findings_actionable`, `followups_deferred`, `disposition`
  all derive from the merged `dispositions`/`fixed`/`deferred_filings` arrays, so
  they recompute correctly once Lane A is appended.

**Out of scope.** Envelope key names/shape (`:1021-1040`) — unchanged.

**Recommended model:** opus — deviation semantics and bucket-mapping are subtle
and cross-cutting.

**Dependencies.** Unit 3. (Units 3 and 4 may land as one commit.)

### Unit 5 — Doc + test-guard sync

**Scope.**

- Update `.claude/skills/review-fix/SKILL.md` prose that now misdescribes reality:
  the frontmatter `description` (`:3`), the finder descriptions (`:339-353`, the
  code-review/security-review bullets), the Step-2 pipeline sentence, the
  Disposition-table framing (`:488-507`), and the model-split note (`:1060-1070`).
  Describe the two-lane fan-out and the residue disposition.
- **Re-point the `#1172` test guard** at
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:21011-21025`.
  It currently asserts `SKILL.md` contains **no** `/code-review max --fix`
  (the old "detection-only" doctrine — line 21024 greps `RF_SKILL` for
  `/code-review max --fix` and asserts `no`). The new doctrine deliberately
  reverses that invariant, so **re-point** the assertion to the *current*
  invariant (e.g. assert `.claude/workflows/review-fix.js` invokes `/code-review
  max --fix`, mirroring the structural call-site assert used for qa-fix at
  `test-dispatch-scripts.sh:33344`). Per `.claude/rules/test-integrity.md` this
  is **not** weakening a red test — it is re-pointing a guard whose asserted
  doctrine the author reversed; **state this justification explicitly in the
  commit message** so the review phase reads it as an authorized doctrine
  reversal, not a cheat. Keep the companion `model: opus` guard (`:21019-21021`)
  as-is — Lane A still runs on opus, so it stays satisfied. Optionally add a
  structural anchor asserting `review-fix.js` contains the `residue` phase.

**Out of scope.** The route/restore/kernel tests (`dispatch-review-dedup`,
`dispatch-review-verify-drop`, `dispatch-review-finders` sections) — the Lane-B
kernels are unchanged.

**Recommended model:** sonnet — mechanical text edits, with care on the guard
rewording and the commit-message justification.

**Dependencies.** Units 1–4.

---

## Reuse

Existing helpers in `.claude/workflows/review-fix.js` to reuse rather than
reinvent:

- `filePath` (`:788-792`) — file grouping and the `Files:` line for Lane-A defer
  bodies and fixed entries.
- `shortTitle` (`:870-875`) and `blockerNums` (`:876-879`) — Lane-A
  `deferred_filings` entries, identical shape to the Lane-B builder (`:881-922`).
- `truncate` (`:966-969`) — `short_desc` for `laneADispositions`.
- The `fixed[]` recording shape (`:842-848`) and the non-isolated fix-agent
  prompt conventions (`:813-831`, incl. the "Read before Edit" line at `:816`) —
  mirrored by the residue subagent.
- The `subagentsLaunched` accumulator convention (`:390`, incremented at each
  spawn) — extend for the residue subagent.
- Untouched and depended-upon (the Lane-B path): `dedupMerge` (`:203-239`),
  `applyVerifyDrop` (`:257-276`), the classify block (`:553-648`), the verify
  block (`:650-744`), `security_followup_input` (`:924-953`), `upheldErosionIds`
  (`:862-864`) — all remain verbatim for the domain/cost/codeql/npm/erosion
  findings.

Also reuse the existing qa-fix call-site assert pattern at
`test-dispatch-scripts.sh:33344` as the model for the re-pointed `#1172` guard.

## Verification

There is **no executable test of `review-fix.js`** — it calls the `agent()` /
`parallel()` / `phase()` Workflow runtime globals, which do not exist outside a
live Workflow run. CI coverage is (a) grep-based structural asserts in
`test-dispatch-scripts.sh`, (b) the pure kernel scripts `dispatch-review-dedup` /
`dispatch-review-verify-drop` / `dispatch-review-finders` (which mirror the
untouched Lane-B helpers), and (c) SKILL.md content guards. No `node --check`
runs in CI, and no vitest project covers `.claude/workflows/`.

Auto-runnable checks:

```verify
# 1. The workflow script still parses.
node --check .claude/workflows/review-fix.js

# 2. The dispatch-script suite stays green — proves the untouched Lane-B kernels
#    (dedup, verify-drop, finder-set) still behave, and the re-pointed #1172
#    guard passes under the new doctrine.
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Manual / observe-in-production (cannot be unit-tested — the Lane-A agent behavior
is only exercised in a live Workflow run):

- Drive one `/review-fix` on a real `surface=code` PR and confirm on the PR
  comment: code-review self-fixes land in the **Fixed** bucket (and in the
  working-tree commit `/commit-merge-push` makes from `git status`);
  security-review residue is dispositioned across **Fixed / Required / Deferred /
  Informational**; expensive out-of-contract residue is filed as `blocked_by`
  follow-ups (draft tactic nodes on a graph-node target, gh issues on the legacy
  issue target).
- Confirm a deliberately-unresolved high-severity **in-contract** security
  finding sets `deviation` and parks to office-hours, while an out-of-contract
  or erosion finding does **not** escalate (non-escalation invariant intact).
- Confirm a throttled wave-1 (`null` code-review result) still sets
  `coverage_incomplete`, skips the security wave, and the run still applies
  `dispatch:reviewed`.
- Confirm the Lane-B finders (domain security, cost, codeql/npm, erosion) still
  produce dedup → classify → adversarial-verify → Opus-fix → file behavior
  unchanged (their dispositions appear in the same PR comment buckets as before).

## Optional enhancement (not required for a functional refactor)

The residue subagent infers "in-contract" from the introduced diff (`merge_base`,
`changed_files`). The doctrine's "deliverable its plan claims" clause is sharper
with the persisted plan text in hand; threading a `plan`/`contract` arg from
`SKILL.md` Step 2 into the workflow `args` would strengthen the contract judgment.
This is a small `SKILL.md` + `review-fix.js` arg touch — recommended but out of
scope for the minimum refactor.
