---
id: tactic-preview-deploy-on-demand
kind: tactic
statement: Dedicate a skill to on-demand PR preview deploys and remove the
  automatic preview-and-smoke job from pr-checks
owner: ai
status: codified
parent: null
rationale: "Author directive at the 2026-07-07 /align-strategy
  operational-mechanics round: preview channels stay available but only when
  explicitly requested (for example during office-hours-parked QA), so remove
  the preview-and-smoke job from .github/workflows/pr-checks.yml (and rehome its
  merge-time cleanup-preview coupling in prod-deploy.yml to the skill's
  lifecycle) and add a skill that runs the existing change-scoped
  run-all-preview-deploy-smoke.sh path on demand. CI verification must remain
  change-scoped for speed — the skill reuses get-changed-apps.sh scoping, it
  does not reintroduce deploy-everything. Finalized 2026-07-11 /align-tactics
  round; the ruleset flip is split to the born-parked admin gate
  tactic-preview-smoke-ruleset-gate and this tactic is blocked_by it
  (ruleset-first ordering — see body). Gate recorded 2026-07-09:
  preview-and-smoke is one of the four required status contexts on main's
  ruleset that the graph/** fast path stamps (strategy-graph-native-dispatch's
  branch-protection clarification, 2026-07-03; graph-commit polls exactly these
  four before fast-forwarding to main). Removing the job must, in the same
  change, update the ruleset's required contexts and the fast-path/graph-commit
  stamping list — otherwise every direct graph push to main is rejected."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-preview-deploy-on-demand
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: f51f76ac14405b0ccbb0e47f33e0fae1e341c60a45ec9ae6b329170b7227ae05
validates: []
blocked_by:
  - tactic-preview-smoke-ruleset-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Dedicate a skill to on-demand PR preview deploys and remove the automatic preview-and-smoke job from pr-checks

## Context

Preview capability stays, but author-requested only (2026-07-07 author
directive): every-PR preview deploys spend deploy minutes, hosting-channel
quota, and credential exposure on artifacts the autonomous path never looks
at. The trap: `preview-and-smoke` is one of the FOUR required status contexts
on main's ruleset — the `graph/**` fast path stamps it
(`.github/workflows/graph-fast-path.yml:61`) and `graph-commit` polls exactly
those four (`packages/intentionsutil/scripts/graph-commit:17`, jq filter at
`:344`). Removing the job without shrinking the required set rejects every
direct graph push to main; removing the required context after this PR's
branch deletes the job is impossible (the context never reports, the PR can
never merge). Hence ruleset-first ordering: the born-parked admin gate
`tactic-preview-smoke-ruleset-gate` drops the required context, THEN this
lands. CI verification stays change-scoped (`get-changed-apps.sh`) — the
skill must not reintroduce deploy-everything.

## Unit 1 — remove the job; shrink the stamped/polled context set to three

**Recommended model:** opus

Scope:
- Preflight (an implementation step, since `blocked_by` gating is not
  re-verified at merge time): `gh api /repos/natb1/commons.systems/rulesets`
  (then the per-id GET) and assert `preview-and-smoke` is no longer a
  required status check — abort loudly if the gate has not actually cleared.
- `.github/workflows/pr-checks.yml:38-75`: delete the `preview-and-smoke`
  job (acceptance/lint/unit-tests jobs stay).
- `.github/workflows/graph-fast-path.yml:61-66`: delete the
  `preview-and-smoke` stamp job.
- `packages/intentionsutil/scripts/graph-commit`: drop `preview-and-smoke`
  from the required-context polling — header doc (`:17`), the jq name filter
  (`:344`), and every "four checks/contexts" wording; update
  `packages/intentionsutil/scripts/test-graph-commit.sh` expectations to the
  three-context set.
- `.github/workflows/prod-deploy.yml:83-102`: delete the `cleanup-preview`
  job (its lifecycle moves to the skill, Unit 2).
- Repo-wide `grep -rn 'preview-and-smoke'` sweep for stragglers (docs,
  skills, intentions bodies are fine to leave — code and workflow references
  must go).

## Unit 2 — the on-demand preview skill

**Recommended model:** sonnet

Dependencies: Unit 1.

Scope:
- New skill `.claude/skills/preview-deploy/SKILL.md`: on author request
  (`/preview-deploy [<channel>]`, defaulting the channel to the current
  branch's PR number as `pr-<N>`), run the existing change-scoped
  `.claude/skills/dispatch-propagate/scripts/run-all-preview-deploy-smoke.sh
  <channel>` (it already scopes via `get-changed-apps.sh`), surface the
  preview URLs, and document teardown via
  `run-all-cleanup-preview.sh <channel>` when the author is done — the
  lifecycle rehomed from prod-deploy's merge-time cleanup.
- Note: SKILL.md is agent-behavior config — an auto-mode dispatch worker may
  need a human grant at commit time; if the commit is denied, park rather
  than dropping the unit.

## Reuse

- `run-all-preview-deploy-smoke.sh`, `run-all-cleanup-preview.sh`,
  `get-changed-apps.sh` (all under
  `.claude/skills/dispatch-propagate/scripts/`).

## Verification

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

Prose: after merge, land any state-only graph write and confirm the fast
path stamps three contexts and `graph-commit` fast-forwards; confirm a PR
merges without a `preview-and-smoke` check; run `/preview-deploy` on a
branch touching one app and confirm a single change-scoped preview channel
deploys with smoke, then clean it up via the documented teardown.

## Implementation notes

Two units, one PR; implement each unit in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.
