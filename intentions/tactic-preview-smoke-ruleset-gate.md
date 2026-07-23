---
id: tactic-preview-smoke-ruleset-gate
kind: tactic
statement: "ruleset gate: remove preview-and-smoke from main required status
  contexts before the preview-deploy-on-demand code change lands"
owner: human
status: delegated
parent: null
rationale: "Ordering gate for tactic-preview-deploy-on-demand: preview-and-smoke
  is one of the four required contexts the graph/** fast path stamps and
  graph-commit polls; a PR whose branch deletes the job can never satisfy a
  required context that no longer runs, so the ruleset must drop it first.
  Editing branch protection is repo-admin action on the merge-safety substrate —
  author work, not autonomous work. Born-parked per /align-tactics Step 4.
  Recorded 2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
  reason: "Needs a repo admin: remove the preview-and-smoke required status check
    from the main branch ruleset BEFORE tactic-preview-deploy-on-demand can land
    (its PR deletes the job, so the required context would never report and the
    PR could not merge; the graph fast path stamps exactly the required set).
    Roughly 5 author-minutes."
  since: 2026-07-11
  recommendation: "GitHub → Settings → Rules → the main ruleset → required status
    checks: delete preview-and-smoke, keeping acceptance, lint, unit-tests. CLI
    alternative: gh api /repos/natb1/commons.systems/rulesets to find the
    ruleset id, then gh api -X PUT with the required_status_checks list minus
    preview-and-smoke. Then clear this park — the blocked code tactic becomes
    selectable."
pace_exempt: false
rounds: null
attributes: {}
---
# ruleset gate: drop preview-and-smoke from main's required status contexts

Born-parked admin gate. Ruleset-first ordering: `preview-and-smoke` is one of
the four required contexts the `graph/**` fast path stamps and `graph-commit`
polls; a PR whose branch deletes the job can never satisfy a required context
that no longer runs. Remove it from the main ruleset's required status checks
(keeping `acceptance`, `lint`, `unit-tests`) per `office_hours.recommendation`,
then clear this park — `tactic-preview-deploy-on-demand` becomes selectable
and its implementation preflight re-verifies the ruleset before merging.
