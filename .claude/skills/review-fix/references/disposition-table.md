# Step 4 disposition table

Referenced from Step 4. Every finding from every source appears exactly once in
one of these buckets. The Workflow's classifier preserves **both** vocabularies:
the security pass's `required` / `out-of-scope` / `false-positive` axis and the
code-review `Fixed` / `Informational` / `Dismissed` / `Deferred` axis.

| Bucket | Source vocabulary | Meaning |
|---|---|---|
| Fixed | code-review | A concrete, in-scope code change applicable to this PR — applied by the Workflow's Opus fix agents. |
| Required | security | A real vulnerability or weakness in the changed code. Adversarially verified; upheld Required findings applied by the Workflow's Opus fix agents. |
| Refuted | security | A Required finding refuted by the adversarial-verify step — dropped before any Opus fix, recorded in verify_report. |
| Informational | code-review | FYIs, notes, observations surfaced for human reference; no change required. |
| Dismissed | code-review | Nits, incorrect findings, or not applicable; no change, each with a one-line rationale. |
| False-positive | security | Not an actual vulnerability — a misread of the code or a non-issue; each with a one-line rationale. |
| Deferred | code-review | Valid but out of scope for this PR; filed as a `blocked_by` follow-up in Step 6. |
| Out-of-scope | security | A genuine concern, but in pre-existing code the diff did not touch; meaningful CodeQL/npm out-of-scope findings are filed as `security` follow-ups in Step 6. |

For `code-review` and `security-review` sources specifically, these buckets are
populated differently from the rest of this table: code-review's own outcome
(`fixed` / `skipped` / `no_change_needed`, from its `--fix` run) and the residue
phase's resolve/defer/ignore disposition fill these buckets directly — this
pipeline's own classify/verify/fix stages never run over Lane-A findings, and
now only classify Lane-B sources (domain security finders, cost, codeql, npm,
erosion).

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
