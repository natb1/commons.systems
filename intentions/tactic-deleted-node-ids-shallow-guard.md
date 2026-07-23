---
id: tactic-deleted-node-ids-shallow-guard
kind: tactic
statement: Make deletedNodeIds fail loud on a shallow clone, so validate-graph
  cannot report false prose-reference violations from a silently truncated git
  history
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
  branch: tactic-deleted-node-ids-shallow-guard
  pr: 2949
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
# Make deletedNodeIds fail loud on a shallow clone

## Context

`packages/intentionsutil/scripts/lib-deleted-node-ids.ts` builds the set of node
ids whose `intentions/<id>.md` was deleted at some point, by shelling out to:

```
git log --diff-filter=D --no-renames --name-only --pretty=format: -- intentions/
```

`validate-graph.ts` uses that set to classify a prose id-reference as `pruned`
(fine) rather than `missing` (a violation). The helper's own doc comment states
the intent: "a git failure surfaces as a clear error rather than a silent empty
list (see .claude/rules/code-style.md)."

A **shallow clone** defeats exactly that intent without any git failure to
catch. `git log` succeeds, exits 0, and returns a truncated deletion list. Every
node pruned before the shallow cutoff becomes invisible, so every prose
reference to one is reported as an unresolved violation. The result is a
confident, detailed, entirely false failure report.

Observed 2026-07-23 on this machine: the local clone was shallow (grafted at
2026-07-18), so `deletedNodeIds()` returned 37 ids instead of 240, and
`validate-graph` reported **15** prose-reference violations across unrelated
tactics. CI (which checks out with `fetch-depth: 0`) reported `0 unresolved` for
the same tree at the same commit. `git fetch --unshallow` locally took the count
to 240 and the violations to 0, confirming the cause.

The failure mode is worse than a plain false negative because it is *plausible*:
the violations name real nodes and real referencing tactics, so the natural
reading is "main is broken" rather than "my clone is truncated". It cost real
investigation time before the shallow flag was noticed, and it would mislead any
agent or human running the validator locally.

## Unit 1 — shallow guard in `deletedNodeIds`

**Recommended model:** sonnet

**Scope.** In `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`, before
running the `git log`, detect a shallow repository and throw a clear error
instead of returning a truncated set:

```
git -C <repoRoot> rev-parse --is-shallow-repository
```

Returns the literal string `true` / `false`. On `true`, throw an error naming
the cause and the remedy — that the deletion history is truncated, so prose-ref
classification would produce false `missing` violations, and that the fix is
`git fetch --unshallow`. Use the same `repoRoot` resolution and `execFileSync`
style already in the file; do not add a fallback path that proceeds with a
partial list (`.claude/rules/code-style.md`).

**Explicitly out of scope.** Do not change `validateGraphProseRefs` in
`packages/intentionsutil/src/schema.ts`, and do not add entries to
`packages/intentionsutil/prose-ref-baseline.json` — the 15 observed violations
were never real, so baselining them would permanently blind the check to 15
genuine future regressions. `src/` must also stay pure (no git shell-outs), which
is precisely why this helper lives under `scripts/`.

**Reuse.** The existing `repoRoot` constant and `execFileSync` import in the same
file; no new dependencies.

## Unit 2 — test

**Recommended model:** sonnet

**Dependencies.** Unit 1.

**Scope.** Add a test asserting the guard fires: create a scratch shallow clone
(`git clone --depth 1 file://<path>`), run the helper against it, and assert it
throws with a message naming `--unshallow`. Also assert the non-shallow path
still returns the expected deletion ids, so the guard is not simply refusing
everything. Place it alongside the package's existing script tests, following
whichever harness those use.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

That must print `ok — <n> nodes` and `ok — prose refs: 0 unresolved` on a FULL
clone. To exercise the guard itself, run the validator inside a `--depth 1`
clone and confirm it now fails with the explicit shallow-clone error rather than
a list of fabricated prose-reference violations.

Note for whoever picks this up: if your own clone is shallow, `git fetch
--unshallow` first — otherwise the first verify block fails for the very reason
this tactic exists.
