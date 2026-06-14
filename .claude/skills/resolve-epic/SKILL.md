---
name: resolve-epic
description: Resolve-epic handler for the dispatch chain — judges whether a verifiably-complete parent epic's own acceptance criteria are genuinely met by the merged child work, then auto-closes it (dispatch-close-resolved) or escalates to office-hours (dispatch-mark-deviation) when a criterion is not autonomously verifiable.
---

# Resolve Epic

A dispatch worker runs this skill when the routed target is a **parent epic**
whose sub-issues are all closed, so the epic became the topological leaf with no
PR and no `dispatch:planned` label. Routing the epic to `/plan-issue` would find
nothing to build and stop without a completion marker, so `dispatch-stop.sh`
Branch A would park the epic on `dispatch:office-hours` for a human to merely
confirm-and-close. That confirm-and-close is pure ceremony when the epic is
genuinely done. See issue #1456.

This skill replaces that ceremony. It judges whether the epic's **own**
acceptance criteria are genuinely met by the merged child work, then either
**auto-closes** the epic (via `dispatch-close-resolved`, whose `resolved-closed`
sentinel `dispatch-stop.sh` Branch R reads to advance the chain) or **escalates
to office-hours** (via `dispatch-mark-deviation`, whose marker-absence
`dispatch-stop.sh` reads as Branch A, falling back to today's confirm-and-close
behavior) when a criterion is not autonomously verifiable.

`/resolve-epic` operates **in place** — the current worktree dictates the
target. The router enters the target worktree; this skill never switches.

## Sandbox

Run every `gh` call and every gh-invoking script with
`dangerouslyDisableSandbox: true` — `gh`'s TLS validation is blocked by the
sandbox (`.claude/rules/sandbox.md`). That covers:

- The `gh issue view` state check (Step 2).
- `dispatch-context-pack` (Step 3) — it calls `gh`.
- `dispatch-close-resolved` (Steps 2, 4) — it *looks* like a local script but
  calls `gh issue view`/`gh issue close` internally.

`dispatch-mark-deviation` (Step 4) is a pure local file write — it never calls
`gh`, so it needs **no** sandbox override.

## Steps

### 1. Derive `N` from the worktree branch

The session must be in the target worktree, whose branch is `<N>-…`:

```bash
BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$BRANCH" in
  [0-9]*-*) N="${BRANCH%%-*}" ;;
  *)
    echo "/resolve-epic: current branch '$BRANCH' is not a target worktree (expected '<N>-…')" >&2
    exit 1
    ;;
esac
```

### 2. Idempotency guard — already-closed epic

Read the epic's current state (`dangerouslyDisableSandbox: true` — `gh`):

```bash
STATE=$(gh issue view "$N" --json state --jq .state)
```

If the issue is **already CLOSED**, an interrupted prior run closed it but may
have died before the sentinel write. Re-affirm the closure through
`dispatch-close-resolved` (`dangerouslyDisableSandbox: true` — it calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-close-resolved \
  "$N" --reason "epic already resolved; re-affirming closure"
```

The script is state-aware: it skips the re-close and the duplicate comment, and
just writes the `resolved-closed` sentinel. Then **STOP**.

Do **not** do a bare return/stop here. A bare stop skips the sentinel write, so
`dispatch-stop.sh` falls through to Branch A and parks the (already-closed) epic
on `dispatch:office-hours` — the exact ceremony this skill exists to kill. The
sentinel is what routes a closed epic through Branch R instead.

If the issue is **OPEN**, continue to Step 3.

### 3. Gather evidence — METADATA ONLY

Make **one** context-pack call (`dangerouslyDisableSandbox: true` — it calls
`gh`) for the epic body (its acceptance-criteria checklist) and its children's
titles, states, and URLs:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --issue --relations
```

The `=== ISSUE #N ===` section carries the epic's body and its
acceptance-criteria checklist. The `=== RELATIONS #N ===` section carries the
sub-issues as titles + state + URL only.

For the judgment in Step 4 you may optionally inspect the closed-as-completed
children's merged PRs (their titles, descriptions, and changed-file lists) for
direct evidence that a criterion was met. That is the deepest you go. **Never
explore source code** — this is a metadata-only judgment.

### 4. Verdict gate

This gate is the crux of #1456. Walk the epic's **own** acceptance-criteria
checklist item by item. The router already established that every sub-issue is
closed — that is **not** the question. The question for each criterion is: can
you confirm it from the metadata and merged-child-PR evidence in hand, or is it
a claim only a runtime or a human can confirm?

- **Confirmable from metadata / merged-child evidence** — e.g. "the X parser is
  added" when a merged child PR adds `parser-x.go`; "the config gains a `Y`
  field" when a merged PR's diff shows the field; "all N sub-tasks are
  delivered" when each maps to a closed child whose PR did the work.
- **Requires runtime / behavioral / human confirmation** — e.g. "a
  `/dispatch --bg` run leaves no leak" (a runtime claim), "the page renders
  correctly in Chrome" (a behavioral observation), or an explicit
  human-sign-off criterion ("the user has accepted the redesign"). These cannot
  be confirmed from metadata, no matter how many children are closed.

Then take exactly one terminal action:

- **Autonomously verified complete** — *every* acceptance criterion the epic
  states is satisfied by the merged child work, and you can confirm each one
  from the metadata/PR evidence. Auto-close (`dangerouslyDisableSandbox: true` —
  it calls `gh`):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-close-resolved \
    "$N" --reason "<concise why-complete>"
  ```

  Then **STOP**. The `resolved-closed` sentinel routes the chain through
  `dispatch-stop.sh` Branch R.

- **Not autonomously verifiable** — the epic carries *any* criterion you cannot
  confirm on your own (a runtime/behavioral claim or an explicit human-sign-off
  criterion). Escalate to office-hours, **naming the specific unverifiable
  criterion** so the office-hours comment tells the human exactly what to check:

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
    "/resolve-epic: <the specific criterion that cannot be autonomously verified>"
  ```

  Then **STOP**. Marker-absence is read by `dispatch-stop.sh` as Branch A, which
  parks the epic on `dispatch:office-hours` — falling back to today's
  confirm-and-close behavior.

**The costs are asymmetric.** Closing a not-actually-done epic is the expensive
error this gate guards against; parking a done-but-unverifiable epic merely costs
a human glance. So "verify all work complete" must mean **genuinely**
verifiable — and **when in doubt, PARK rather than close.**

### 5. Stop

After either terminal call, **stop**. The Stop hook
(`.claude/hooks/dispatch-stop.sh`) reads the `resolved-closed` sentinel (the new
Branch R → chain advances) or its absence (Branch A → office-hours park) and
propagates the chain. Do **not** spawn ticks or apply labels by hand.
