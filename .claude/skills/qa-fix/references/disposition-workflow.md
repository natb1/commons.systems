# Step 3.5 — Disposition + gated fix-planning Workflow

This reference carries the full `args` build, the `result` schema, and the
report-only contract for the Step 3.5 Workflow invocation in `SKILL.md`. The body
holds the guard (run only when the residue list is non-empty) and the terse
"invoke the Workflow, consume its result" control flow.

## Build `args`

```
args = {
  pr_num:             <PR_NUM>,            // from the idempotency preamble
  issue_num:          <N>,                 // the issue number from Step 0
  app_dir:            <app dir from Step 1, or null if no browser component>,
  browser_available:  <bool>,              // true only when a browser component
                                           // was detected in Step 1 AND the
                                           // Chrome tools loaded successfully in
                                           // Step 3c; false if "Chrome extension
                                           // unavailable" was noted in Step 3c,
                                           // or no browser component was detected
  firestore_caveat:   <bool>,              // derived in Step 1
  residue:            [ ...in-memory residue list... ],
                                           // each entry: {id, title, kind,
                                           //   url_path, expected_outcome,
                                           //   finding, page_text,
                                           //   screenshot_path,
                                           //   planned_deferral}  // optional bool
  plan_fix:           <bool>,              // (ATTEMPT_N < CAP) from the
                                           //   idempotency preamble — a
                                           //   read-only pre-gate: false at
                                           //   the cap so NO Opus is spent
                                           //   planning a fix that could
                                           //   never run. The Workflow runs
                                           //   the gated fix-plan phase only
                                           //   when plan_fix is true AND ≥1
                                           //   opus-fixable item exists.
  acceptance_criteria: <string>,           // the `--issue` section of the
                                           //   Step-2a context pack
                                           //   (dispatch-context-pack "$N"
                                           //   --issue --pr --diff). REUSE
                                           //   that capture; do NOT re-run
                                           //   the pack.
  changed_files:      <string>,            // the `--diff` section of that
                                           //   SAME Step-2a pack. REUSE it;
                                           //   do NOT re-run the pack.
  prior_attempt_summary: <string>,         // PRIOR_SUMMARY from the preamble
                                           //   (the prior pass's QA summary,
                                           //   or '' on the first attempt).
                                           //   ADVISORY: lets the fix-planner
                                           //   skip findings a prior pass
                                           //   already resolved. Does NOT
                                           //   change plan_fix gating.
  prior_phase_log:    <string>             // PRIOR_PHASE_LOG from the preamble
                                           //   (the cross-phase handoff note,
                                           //   or '' when none). ADVISORY,
                                           //   same as prior_attempt_summary;
                                           //   does NOT change plan_fix gating.
}
```

`plan_fix`, `acceptance_criteria`, `changed_files`, `prior_attempt_summary`,
and `prior_phase_log` are captured already: `ATTEMPT_N`/`CAP` in the
idempotency preamble, `PRIOR_SUMMARY` / `PRIOR_PHASE_LOG` likewise in the
preamble, and the `--issue` / `--diff` sections in the single Step-2a pack
call. Reuse them — issue **no** extra `dispatch-context-pack` call here.

## Invoke the Workflow and consume its result

**Invoke the Workflow tool on the registered `qa-fix` workflow**, passing `args`.
This skill is a sanctioned caller of that Workflow — no `ultracode` keyword
needed. The Workflow runs in the background and returns one compact result:

```
result = {
  dispositions:      [ {id, title, kind, class, aesthetic, verify, rationale} ],
  already_satisfied: [ {id, title, kind, rationale} ],  // dropped-as-PASS items partitioned out of dispositions
  verify_report:     [ {id, verdict, skeptic_votes, rationale} ],
  fix_plan:          { units, deviation, deviation_reason } | null,
  deviation:         <bool>
}
```

- `dispositions[].class` is the final class for items still in the set:
  `opus-fixable` | `needs-main` | `needs-human`. `verify` is `Upheld` |
  `Refuted` | `Unverified` | `n/a`. `dispositions` excludes already-satisfied
  items — those are partitioned into `result.already_satisfied` by the Workflow.
- The **four-class disposition axis** is: `opus-fixable` | `needs-main` |
  `needs-human` | `already-satisfied`. Items the Workflow classifies
  `already-satisfied` are **dropped as PASS** in the Workflow's aggregation:
  excluded from `result.dispositions`, never reaching fix-plan, never entering
  the escalation set, and surfaced separately in `result.already_satisfied`
  carrying `{id, title, kind, rationale}`.
- `verify_report` has one entry per non-aesthetic, non-planned-deferral
  `needs-human` candidate that went through the skeptic fan-out (`verdict`:
  `upheld` | `refuted` | `unverified`).
- `result.fix_plan` is the ordered Opus fix plan when the gated `fix-plan`
  phase ran — `{ units, deviation, deviation_reason }`, where each unit is
  `{ id, scope, model, dependencies, commit_intent, context, resolves_ids }`.
  It is **`null`** when the phase did not run: `plan_fix` was false (at the
  cap), no opus-fixable disposition existed, **or** the planning agent died.
- `result.deviation` is **LIVE**: `fix_plan.deviation` when the phase ran, else
  `false`. It signals a scope-deviation the planner refused to author a fix for
  — Step 3.7 branches on it.

Consume `result.dispositions` and `result.verify_report` for the Step 4
PR-comment disposition section, and `result.fix_plan` / `result.deviation` for
the Step 3.7 auto-fix lane.

## The Workflow itself stays report-only

It classifies and adversarially verifies residue items and returns the
dispositions, but acts on none of them — no auto-fix, no escalation, no filing.
All action lives in the **skill**, across two classes: Step 3.6 files a
`blocked_by` follow-up per `needs-main` item, and Step 3.7 runs the bounded Opus
auto-fix lane on `opus-fixable` items. Only the **`needs-human`** class remains
report-only — its dispositions are informational for the PR comment and it still
escalates to office-hours under Step 6 exactly as before.
