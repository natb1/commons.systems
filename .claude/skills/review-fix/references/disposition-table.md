# Step 4 disposition table

Referenced from Step 4. Every finding from every source appears exactly once in
one of these buckets. The Workflow's classifier preserves **both** vocabularies:
the security pass's `required` / `out-of-scope` / `false-positive` axis and the
code-review `Fixed` / `Informational` / `Dismissed` / `Deferred` axis.

| Bucket | Source vocabulary | Meaning |
|---|---|---|
| Fixed | code-review | A concrete, in-scope code change applicable to this PR — applied by the Workflow's Opus fix agents. |
| Required | security | A real vulnerability or weakness in the changed code. Adversarially verified; upheld Required findings applied by the Workflow's Opus fix agents. |
| Refuted | security, code-review residue | A Required finding refuted by the adversarial-verify step — dropped before any Opus fix, recorded in verify_report. Also a code-review residue item refuted by the residue phase's skeptic gate — dropped before the residue agent can edit for it. |
| Informational | code-review | FYIs, notes, observations surfaced for human reference; no change required. |
| Dismissed | code-review | Nits, incorrect findings, or not applicable; no change, each with a one-line rationale. |
| False-positive | security | Not an actual vulnerability — a misread of the code or a non-issue; each with a one-line rationale. |
| Deferred | code-review | Valid but out of scope for this PR; filed as a `blocked_by` follow-up in Step 6. |
| Out-of-scope | security | A genuine concern, but in pre-existing code the diff did not touch; meaningful CodeQL/npm out-of-scope findings are filed as `security` follow-ups in Step 6. |

For `code-review` and `security-review` sources specifically, these buckets are
populated differently from the rest of this table — this pipeline's own
classify/verify/fix stages never run over Lane-A findings, and only classify
Lane-B sources (domain security finders, cost, codeql, npm, erosion). That
holds even after cross-lane absorption below: absorption is a later,
mechanical merge over already-fixed Lane-B `deduped` records, not classify/
verify/fix processing of a Lane-A item — no Lane-A finding is ever classified,
verified, or fixed by this pipeline's own stages. Lane A's buckets are filled
directly from two inputs:

- **code-review's `fixed[]` is derived from the git diff, not from any report.**
  `dispatch-code-review` (SKILL.md Step 1b) takes a before/after `git diff`
  around the `claude -p '/code-review low --fix'` run and emits the exact list of
  files the built-in actually edited. The Workflow's Sonnet `parse:code-review`
  subagent structures the run's free-form findings text against that patch, and
  the Workflow then **mechanically** drops any claimed fix whose `touched_files`
  is empty or not a subset of the git-derived list (an empty list ⇒ `fixed` is
  `[]`, whatever the review text narrates). The built-in decides for itself
  whether to apply each fix and has been observed narrating fixes it declined to
  write, so its self-report is never credited as yield — only the diff is.
- **Everything else the review reported becomes residue**, and the residue
  phase's resolve/defer/ignore disposition fills the remaining buckets — the same
  path `security-review`'s findings-only output takes. Provenance differs by
  source, so code-review residue is gated before it reaches that disposition
  agent (which edits the working tree): its text is a free-text parse of the
  pre-stage report, carrying no instrument receipt, so the Workflow **drops any
  item whose `location` is outside `changed_files`** and runs **one adversarial
  skeptic** per surviving item, dropping refuted (or unvoted) ones as `Refuted`.
  `security-review` residue skips both gates — it arrives with a verified
  instrument receipt and the built-in's own confidence>=8 false-positive filter.

After the pre-gate and before disposition, surviving Lane-A residue (both
`code-review` and `security-review`, except as noted below) is checked for
**cross-lane absorption** against the Lane-B findings this run actually fixed.
A residue item sharing a same-root `path:line` location with a
fixed Lane-B finding is absorbed: the Lane-B `deduped` record survives with
both lanes recorded in its `sources`, and the Lane-A twin is dropped from the
residue ledger rather than disposed of separately — the defect is dispositioned
and fixed exactly once instead of drawing a second, redundant residue pass.
Absorption requires the Lane-B finding to have survived adversarial-verify and
been actually fixed; Refuted, Unverified, and Deferred Lane-B findings never
absorb, so their Lane-A twins stay in the residue ledger and go through
disposition normally. High-severity `security-review` residue is never
absorbed, so the deviation/escalation gate is unaffected. Absorption only
merges records for deduplication and fix-assignment bookkeeping — it never
changes verify eligibility, and it never routes a Lane-A item into the verify
phase's adversarial skeptics.

A finding is **never Dismissed/Disregarded purely because the change is small.**
If a code-review finding is a real improvement within the PR's scope,
classify it Fixed and implement it — regardless of how trivial the diff is.
Dismissed is for false positives, trivially wrong findings, or style preferences
that are not actual improvements; smallness alone never qualifies (out-of-scope
items go to Deferred, not Dismissed). When a code-review finding is
ambiguous, default to Informational rather than inventing a code change.

**`Source "cost"` findings are ADVISORY.** A confirmed cost/scaling pattern
(unbounded collection query, a high-frequency amplifier layered over a scan, or an
N+1 read loop) always routes to `Deferred` — filed as a non-blocking follow-up
feeding the deterministic cost sensor (#2687). Even a cost finding that names a
concrete pattern but is not obviously actionable still classifies `Deferred`
(so it reaches the sensor) rather than `Informational`. Cost findings are
**never** `Fixed` (not auto-fixed in this PR), **never** `Required`
(not merge-blocking), and **never** verify-eligible (the adversarial-verify
step is skipped for cost). When the classify agent returns no verdict for a cost
finding, the Workflow falls back to `Deferred` so it is filed as a follow-up
rather than silently dropped.
