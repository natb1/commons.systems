---
id: tactic-mainqa-instance-flake-personalization
kind: tactic
statement: Verify instance-flake personalization on real machines — Darwin
  pure-eval switch, git-identity clear-error path, office-hours-nate example
  flake builds against merged overlays
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issues 2594, 2582, 2771. The practitioner
  instance-flake entry point (personalized identity, example consumer flakes) is
  target-state for workflow distribution; verification needs the real personal
  machines."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution: null
validates: []
blocked_by: []
office_hours:
  reason: needs the owner's real Darwin and downstream example machines — not
    automatable
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Verify instance-flake personalization on real machines — Darwin pure-eval switch, git-identity clear-error path, office-hours-nate example flake builds against merged overlays

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issues (closed, content
preserved here): 2594, 2582, 2771 — needs-main residue from the
pure-eval/identity personalization work (issues 2448 and 61; PRs 2591, 2581)
and the overlay split (issue 2769, PR 2770). The practitioner instance-flake
entry point is how
`strategy-distribute-workflow` is exercised; verification needs the owner's
real machines.

## Verification checklist

1. **Darwin pure-eval switch** (was 2594, PR 2591): the instance flake's
   home-manager/darwin-rebuild switch on the real Darwin machine completes
   under pure evaluation (no `--impure`) with the git-identity assertion
   passing.
2. **Git-identity clear-error path** (was 2582, PR 2581): on a
   home-manager-managed host with no `GIT_AUTHOR_*` env vars and no `[user]`
   stanza, `git commit` fails with git's native `Author identity unknown`
   error naming `user.name`/`user.email` — no silent hardcoded fallback
   identity.
3. **office-hours-nate example flake builds** (was 2771, PR 2770): the
   downstream example flake (pinned to github:natb1/commons.systems) still
   builds now that it can see the merged overlay split (`overlays.default`
   kept its prior value; `mkPkgs` untouched).

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
