---
id: tactic-verify-landed-unknown-arm-untested
kind: tactic
statement: "verify-landed's exit-1 unknown arm has no test -- it is not
  reachable read-only, so PR #3095's post-merge QA pass could not drive it,
  leaving an untested arm in the one script every node closure in the serialized
  graph write-path plan uses as its independent second verification"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. PR1's post-merge QA exercised
  verify-landed at 0/4/4/2 and confirmed the absent-node path returns exit 4
  rather than a false landed. The exit-1 arm was never reached. The severity is
  not in the script's own size: roughly a hundred remaining node closures in the
  serialized plan verify themselves through it, so an untested arm here is an
  untested arm in that plan's entire bookkeeping."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Cover `verify-landed`'s exit-1 arm

## Context

`packages/intentionsutil/scripts/verify-landed` reports a three-way verdict and
its header (`:11`, `:16`, `:20`) is emphatic that the three are never collapsed
into two:

```
#   exit 1  unknown     could not determine (fetch failed, git error, tsx or
# The 0/4/1 split is the whole point. Collapsing `unknown` into `landed`
```

The `unknown` arm is reached from several places — a failed fetch (`:207`,
`:213`), a `jq` error (`:275`), an unresolvable main sha (`:297`) — and the
design turns on it: `unknown` is *the absence of evidence*, and the script
reduces so that any `unknown` wins outright over a `landed`.

**It has no test.** PR #3095's post-merge QA drove the script at 0/4/4/2 and
confirmed the absent-node path returns exit 4 rather than a false `landed`. It
could not reach exit 1, because that arm is not reachable from a read-only
verification pass — every route to it requires inducing a failure (an
unreachable remote, a broken git invocation, a malformed `jq` result) that a
read-only pass has no way to cause.

The severity is not in the script's own size. Roughly a hundred remaining node
closures in the serialized graph write-path plan verify themselves through this
script as their independent second check. An untested arm here is an untested
arm in that plan's entire bookkeeping — and it is specifically the arm that
exists to stop a false `landed`.

## Scope

Add shell-level coverage that drives the `unknown` arm **deliberately**, at
minimum for the fetch-failure route (`:201`–`:213`), which is the one the
header calls out by name: *"A fetch failure yields `unknown`, NEVER
`not-landed`: an unreachable remote..."*.

The point is not one passing assertion. The property to pin is the reduction:
**any `unknown` wins outright**. A case mixing a genuine `landed` id with an
`unknown` one must exit 1, not 0. That is the behaviour a future refactor is
most likely to break, and it cannot be observed from a single-id test.

Follow the existing `PATH`-shim convention the sibling suites already use to
control what a spawned command does — do not add a network dependency or a
production flag whose only purpose is testability.

Out of scope: changing `verify-landed`'s behaviour. This is coverage of what it
already does. If writing the test reveals the arm is wrong, that is a separate
node — say so rather than quietly correcting it under a test-coverage heading.

## Dependencies

None.

## Reuse

- The `PATH`-shim harness pattern in
  `packages/intentionsutil/scripts/test-graph-commit.sh` and its siblings —
  they already emulate a spawned command by shadowing it on `PATH`, which is
  exactly the mechanism needed to make a fetch fail on demand.
- `verify-landed`'s own `report` helper (`:182`) prints the verdict line the
  test should assert against, so assertions can key on the script's real
  output contract rather than on its exit code alone.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

The new shell suite is not auto-discovered by CI — `test-*.sh` files under
`packages/intentionsutil/scripts/` are run by explicit registration, not by
glob. **Confirm the new suite is actually invoked by a CI job before calling
this node done**; a test that never runs is worse than no test, because it
reads as coverage.
