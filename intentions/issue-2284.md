---
id: issue-2284
statement: "dispatch: migrate dispatch-stop.sh statusCheckRollup to REST
  check-runs (last GraphQL-only PR field beyond closingIssuesReferences)"
owner: human
status: raw
parent: null
rationale: >-
  - Refactor the CI-verdict derivation in `dispatch-stop.sh` to call
    `dispatch_ci_verdict_rest <sha>` (lib.sh) per relevant PR rather than reading
    the batched `statusCheckRollup`.
  - Drop `statusCheckRollup` from `pr_list_open`'s requested fields if no other
    consumer needs it; update the holdout comment accordingly so it cites only
    `closingIssuesReferences`.
  - This is a CI-verdict refactor with its own test surface (the
    `dispatch_classify_rollup` / `dispatch_ci_verdict_rest` paths and the
    dispatch-stop routing tests) — verify behavior is identical against the
    dispatch script test suite.
reading: >-
  - Refactor the CI-verdict derivation in `dispatch-stop.sh` to call
    `dispatch_ci_verdict_rest <sha>` (lib.sh) per relevant PR rather than reading
    the batched `statusCheckRollup`.
  - Drop `statusCheckRollup` from `pr_list_open`'s requested fields if no other
    consumer needs it; update the holdout comment accordingly so it cites only
    `closingIssuesReferences`.
  - This is a CI-verdict refactor with its own test surface (the
    `dispatch_classify_rollup` / `dispatch_ci_verdict_rest` paths and the
    dispatch-stop routing tests) — verify behavior is identical against the
    dispatch script test suite.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# dispatch: migrate dispatch-stop.sh statusCheckRollup to REST check-runs (last GraphQL-only PR field beyond closingIssuesReferences)
