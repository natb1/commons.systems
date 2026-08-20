---
id: tactic-graph-digest-quality-followups-drift-observations
kind: tactic
statement: "Observation carrier, no plan, do not dispatch: two immaterial drift
  observations from the 2026-08-20 /align-tactics per-node finalize of
  tactic-graph-digest-quality-followups -- all six deferred digest.ts findings
  re-confirmed live at origin/main a0bfd20d, and strategy-graph-integrity's own
  success signal has still never produced a reading"
owner: human
status: delegated
parent: null
rationale: "Born parked as an observation carrier for the immaterial Side-B
  drift raised by the 2026-08-20 /align-tactics per-node finalize of
  tactic-graph-digest-quality-followups. Neither observation gated the finalize
  (drift returned proceed: true with no park), and neither has another legal
  destination: an autonomous session may not write clarifications onto a serving
  strategy (strategy-graph-native-dispatch clarification 118, OVERTURNED
  2026-08-15 by violation V1). A human promotes whichever of these is worth
  keeping into a strategy clarification at office hours, or drops it."
reading: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked as an observation carrier -- there is no plan here and
    nothing to dispatch. The 2026-08-20 /align-tactics per-node finalize of
    tactic-graph-digest-quality-followups produced two immaterial drift
    observations, recorded in full in this node's body. (1) All six quality
    findings deferred from the PR #2865 review are still live and unfixed in
    packages/intentionsutil/src/digest.ts at origin/main a0bfd20d, re-verified
    by direct read rather than against the 3dbaf24f anchor the draft cited: the
    pairwise double loop in tableNearDup (digest.ts:251-273), tableClosure's
    outermost-frame-only false-caching (digest.ts:173), stop-word-free
    statementTokens (digest.ts:220-227), the generic isDefaultValue heuristic
    (digest.ts:359-365), the five hand-rolled table shapes plus the two
    duplicated truncation trailers (digest.ts:267-271, 401-405), and the
    unvalidated bodies/rawTexts keying behind the ?? \"\" fallbacks
    (digest.ts:112, 307). Only two commits have ever touched the file --
    4f12acac (PR #2865, which introduced it) and 5ccfeb59 (PR #2899, which
    extracted the DANGLING-REFS matchers into id-refs.ts). (2) The /align-audit
    skill landed at 97085e52 (PR #2879), but strategy-graph-integrity still
    carries reading: null and rounds.count 0 -- no audit cycle has completed
    against its threshold. That absent reading is the strategy's own recorded
    gap, not drift, and it does not gate the tactic: the digest is the audit's
    reading surface, so bounding its cost is preparatory to the first cycle
    rather than dependent on it. The cadence condition is NOT treated as failed
    -- its mechanism exists. Also recorded for the author: the finalizing
    session's own Workflow lost its clause-coverage evidence agent to a
    StructuredOutput retry cap, so the Side-A condition review ran without
    per-condition repo evidence and the round was landed anyway on an explicit
    judgment, named in the finalized node's Provenance section."
  since: 2026-08-20
  recommendation: "At office hours, pick one disposition per observation.
    Observation 1: drop it -- it is provenance already carried in the finalized
    node's own rationale and Provenance section, and duplicating it as a
    strategy clarification would violate the parsimony requirement this strategy
    owns. Observation 2 has three candidate dispositions: (a) drop it as
    already-recorded, since reading: null and the derived gap say the same thing
    mechanically; (b) promote it to a dated clarification on
    strategy-graph-integrity recording that the audit skill landing and the
    audit cycle running are distinct milestones, and that the cadence condition
    is judged against the second, not the first; or (c) treat the never-yet-run
    cycle as the cadence-lapse the fourth condition names and open a round to
    schedule the first real /align-audit pass. Option (c) is the only one that
    changes what gets built."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---

## Observation carrier — no plan, do not dispatch

This node exists only to hold the two immaterial Side-B drift observations the
2026-08-20 `/align-tactics` per-node finalize of
`tactic-graph-digest-quality-followups` produced. Neither gated that finalize —
the drift review returned `proceed: true` with no park — and neither has any
other legal destination: an autonomous session may not append clarifications to
a serving strategy (`strategy-graph-native-dispatch` clarification 118 is
OVERTURNED as of 2026-08-15 by violation V1). There is no plan here and nothing
to build. A human reads this at office hours, promotes whatever is worth keeping
into a clarification on `strategy-graph-integrity`, and resolves the node.

## Observation 1 — all six deferred digest.ts findings are still live

Re-verified by direct read at `origin/main` `a0bfd20d`, not inferred from the
`3dbaf24f` anchor the draft body cited. Every finding deferred from the PR #2865
`/review-fix` review is still present and unfixed in
`packages/intentionsutil/src/digest.ts`:

| Finding | Current anchor | State |
|---|---|---|
| NEAR-DUP is O(n²) pairwise | `digest.ts:251-273` | explicit `i, j` double loop; `NEAR_DUP_LIMIT` (`digest.ts:242`) slices only printed rows |
| CLOSURE memoizes only at the outermost frame | `digest.ts:173` | guard `if (result || stack.size === 0)` unchanged |
| no stop-word filter | `digest.ts:220-227` | `statementTokens` drops empty tokens only |
| STORED-DEFAULTS heuristic untied to schema | `digest.ts:359-365` | generic `null`/`false`/`[]`/`{}` shape test |
| five duplicated table shapes | `digest.ts:267-271`, `401-405` | two of them also duplicate the slice + `... and N more` trailer |
| unvalidated `DigestInput` keying | `digest.ts:112`, `307`, `386` | `bodies.get(id) ?? ""` fallbacks and a `rawTexts`-absent `continue` |

Only two commits have ever touched the file: `4f12acac` (PR #2865, which
introduced it) and `5ccfeb59` (PR #2899, which extracted the DANGLING-REFS
matchers into `packages/intentionsutil/src/id-refs.ts`). Neither addressed any
deferred finding.

**Why it is immaterial:** the finalized plan does not hinge on this being
recorded anywhere — it is provenance, and it is already carried in the finalized
node's own `rationale` and `## Provenance` section. Recording it a second time on
the serving strategy would work against the content-parsimony requirement that
strategy owns.

## Observation 2 — the strategy's own signal has still never produced a reading

`strategy-graph-integrity` carries `reading: null` and `rounds.count: 0`. Its
derived gap reads "no reading yet (threshold: a cycle completes with zero
undispositioned findings and zero repeats of the prior cycle's findings)". The
enforcement mechanism it names — the recurring `/align-audit` evaluation — does
exist: the skill landed at commit `97085e52` (PR #2879) and
`tactic-align-audit-skill` is at `phase: done`. What has not happened is a real
cycle running against the threshold.

The finalizing session deliberately did **not** treat the strategy's fourth
condition ("the audit cadence actually recurs") as failed. A condition about a
cadence recurring is not falsified by the mechanism having only just landed, and
the strategy's own recorded gap already says the reading is absent. The
observation is recorded here because it is about the serving strategy's signal
rather than about the tactic, and it is recorded nowhere else.

**Why it is immaterial to the finalize:** the tactic is read-only-tool hardening
of the digest. The digest is the surface the audit reads first, so bounding its
cost is preparatory to the first cycle, not dependent on one having run.

## Also recorded: the finalizing round ran with degraded drift evidence

The `/align-tactics` Workflow for that round lost its clause-coverage evidence
agent to a `StructuredOutput` retry cap. That agent gathers the per-condition
repo evidence the Side-A reviewer judges from, and the Workflow's null-guard
substitutes an empty evidence set silently — so the returned result is
byte-indistinguishable from a fully-evidenced clean pass. The round was landed
anyway, on the explicit judgment that a single-package, read-only-tooling change
cannot plausibly fail any of this strategy's four recorded conditions, and that
the one condition it does touch (token-bounded reading) it strengthens. That
judgment is stated in the finalized node's `## Provenance` section so it is not
mistaken for an evidenced pass.

This degradation is a known Workflow defect with its own carrier already on the
graph (`tactic-align-tactics-gather-agent-death-silent`, born-parked
2026-08-19). Nothing new is owed here — it is named so this round's evidence
quality is legible to whoever reads the two observations above.

## Generalization worth the author's eye

Observation 1 is a shape that will recur on every draft filed by `/review-fix`
and finalized months later: the draft anchors its findings to the review commit,
and the finalizing session must re-anchor them to current `HEAD`. Here the
re-anchor was cheap because the file had barely moved. It will not always be.
Whether that re-validation should be a stated obligation of the finalize (rather
than a habit) is an author call, not something an autonomous round should decide.
