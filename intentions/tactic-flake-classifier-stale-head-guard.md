---
id: tactic-flake-classifier-stale-head-guard
kind: tactic
statement: Guard the flake classifier's NONE path against stale-head false
  positives, so a deterministic CI failure on an out-of-date PR head is not
  filed as a new flake tracking tactic
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-flake-classifier-stale-head-guard
  pr: 2950
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Guard the flake classifier's NONE path against stale-head false positives

## Context

`dispatch-flake-dedup-node` decides whether a CI failure is a new flake, a
recurrence of a tracked one, or a stale-head false positive. It already has a
stale-head gate — but only on the `phase: done` branch. Its own header says so:

> `--head-ref` is REQUIRED only when this branch is actually reached (a
> `phase: done` match found) ... OPEN/NONE never consult it.

The `NONE` branch (no existing node tracks this fingerprint) returns immediately
with no staleness check at all, and the caller files a fresh flake tactic. So a
failure that is fully deterministic on an out-of-date head — already fixed on
`origin/main` — gets minted as a brand-new flake node that no one can reproduce.

This fired on 2026-07-22. A shadowed `case` arm in the fake-git stub of
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` made the
`select-tick ... guard halts (exit 2)` wiring test fail deterministically: the
first arm matched every `-C <path> symbolic-ref --short HEAD` call and returned
`main`, so the guard never fired and four assertions failed. The arms were later
unified on `origin/main` (one arm honoring `SEL_PRIMARY_CHECKOUT_BRANCH` ->
`FAKE_GIT_PRIMARY_BRANCH` -> `FAKE_GIT_BRANCH` -> `main`). Four PR heads that
predated the unification kept emitting the failure and produced **two** separate
flake tactic nodes (filed 3 minutes apart), both since pruned. Neither was
reproducible at `origin/main`, because main already carried the fix.

Failing heads (all four must classify stale): `9bd0b2a6`, `9f01d16b`,
`78fbbedd`, `51f190b9` — runs 29961207775, 29961388502, 29961657353,
29963123433. Green heads at the same time: `2d4a2ac3`, `dc387443`.

Two design facts constrain the fix:

1. On `NONE` there is no prior node and therefore **no fix commit to test
   ancestry against**, so the existing `git merge-base --is-ancestor` technique
   does not apply. The decisive question must be behavioral: does the failure
   still reproduce at current `origin/main`?
2. The caller already resolves `HEAD_SHA` unconditionally
   (`.claude/skills/fix-checks/SKILL.md`, the node-lane Flake sub-path: "needed
   only when the guard reaches a `phase: done` node, but always safe to
   resolve"), so the guard's input needs no new plumbing.

## Unit 1 — `dispatch-flake-stale-head-check` script

**Recommended model:** opus

**Scope.** Add a new executable
`.claude/skills/dispatch-propagate/scripts/dispatch-flake-stale-head-check`.

Usage:

```
dispatch-flake-stale-head-check --head-ref <sha> --reproduce-cmd <cmd> [--repo-root <path>]
```

It prints exactly one line: `CURRENT` (head contains main's tip — failure is
trustworthy, file the flake) or `STALE-HEAD` (failure does not reproduce at
`origin/main` — do not file). Two tiers, cheapest first:

1. `git merge-base --is-ancestor origin/main <head-ref>` exits 0 -> head already
   contains main's tip -> print `CURRENT`, exit 0. No suite run.
2. Otherwise run `<reproduce-cmd>` against a checkout of `origin/main`. Exit 0
   (passes at main) -> print `STALE-HEAD`. Non-zero (still fails at main) ->
   print `CURRENT`.

Tier 2 must not mutate the caller's worktree: run it in a throwaway `git
worktree add --detach origin/main` under a `mktemp -d`, and remove it in an
`EXIT` trap. Fail loud on a missing/invalid `--head-ref` or unrunnable
reproduce command (exit 2) rather than defaulting to either disposition — a
guard that silently answers `CURRENT` on error would re-open the exact hole
this closes (`.claude/rules/code-style.md`).

**Explicitly out of scope.** Do not modify `dispatch-flake-dedup-node`. Its
contract is "purely a search+decide+print tool", "NO NETWORK", and it never
executes anything; running a test suite inside it would break all three. This
stays a separate sibling script.

**Reuse.** Mirror the CLI shape, `set -euo pipefail` style, loud-error
conventions, and the repo-root resolution
(`repo_root=$(git rev-parse --show-toplevel)`) of
`.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup-node`.

## Unit 2 — tests

**Recommended model:** sonnet

**Dependencies.** Unit 1.

**Scope.** Add
`.claude/skills/dispatch-propagate/scripts/test-flake-stale-head-check.sh`,
following the `assert_eq` / setup / teardown harness style already used by the
sibling `test-*.sh` files in that directory. `run-unit-tests.sh` globs
`"$SCRIPTS"/test-*.sh`, so the new file is picked up by the `unit-tests` job
automatically. Also add an explicit `hook-tests` step for it in
`.github/workflows/unit-tests.yml`, alongside the other per-script steps.

Cases: tier-1 short-circuit when main's tip is an ancestor (no suite run — assert
the reproduce command was NOT invoked); tier-2 pass-at-main -> `STALE-HEAD`;
tier-2 fail-at-main -> `CURRENT`; missing `--head-ref` -> exit 2; unrunnable
reproduce command -> exit 2; and the throwaway worktree is removed on both the
success and failure paths.

**Explicitly out of scope.** Do not add cases to `test-dispatch-scripts.sh` —
that file is already ~23k lines and is itself the subject of this incident.

## Unit 3 — wire into fix-checks

**Recommended model:** opus

**Dependencies.** Units 1-2.

**Scope.** In `.claude/skills/fix-checks/SKILL.md`, node-lane Flake sub-path:
run the new guard on the `NONE` disposition, before the "write a new flake
tactic node" step. On `STALE-HEAD`, skip the node write entirely and record the
outcome as `STALE-HEAD-SUPPRESSED` in the accumulator, alongside the existing
`STALE-SUPPRESSED` value in the flake-tracking-id bullet; the PR's remedy is to
merge `origin/main` and re-run, which the skill should state. On `CURRENT`,
behavior is unchanged.

**Explicitly out of scope.** The legacy GitHub-Issues lane
(`dispatch-flake-dedup`) — it pivots on the real closing-commit metadata and is
not affected by this gap.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-flake-stale-head-check.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh
```

Replay the real incident as the acceptance check. Against a reproduce command of
`bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, the
four failing heads `9bd0b2a6`, `9f01d16b`, `78fbbedd`, `51f190b9` must each
print `STALE-HEAD`. This is the regression test that the guard actually closes
the hole it was written for; run it manually, since it depends on those SHAs
remaining reachable and takes a few minutes per stale head. Verified during
implementation for `78fbbedd` and `9f01d16b` — both `STALE-HEAD`.

CORRECTION to this plan as originally written: it also required the green heads
`2d4a2ac3` / `dc387443` to print `CURRENT`. That criterion is meaningless and has
been dropped — those heads PASSED CI, so the flake classifier never runs on them
and the guard is never asked. The meaningful `CURRENT` cases are tier 1 (head
already contains main's tip) and tier 2 with a red main; both are covered by unit
tests in Unit 2 rather than by SHA replay.

Known residual, deliberately not addressed here: the two pruned nodes carried
*different* fingerprints for the identical failure (one keyed on `file:line`,
one on the test name), so fingerprint dedup never had a chance to collapse them.
This guard blocks both regardless, which is why fingerprint stability is left as
a smaller separate follow-up rather than a blocker.
