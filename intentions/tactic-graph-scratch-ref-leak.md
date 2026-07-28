---
id: tactic-graph-scratch-ref-leak
kind: tactic
statement: "origin's orphaned refs/heads/graph/* scratch branches are swept, and
  the reason graph-commit writers keep leaking them — the cleanup is a
  best-effort EXIT-trap step a killed or hard-failing writer never reaches — is
  diagnosed and closed"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours drain sitting. Verified the
  same day with 'git ls-remote origin refs/heads/graph/**': exactly 10 orphaned
  scratch refs on origin, spanning 2026-07-05 to 2026-07-28 — so the leak is
  ongoing, not a one-time historical residue. Examples with their tip commit
  dates: refs/heads/graph/tactic-align-strategy-skill-prune-3251902
  (2026-07-05), refs/heads/graph/tactic-grounding-gap-analysis-3891250
  (2026-07-10),
  refs/heads/graph/tactic-strategy-fingerprint-stamp-shape-1396011 (2026-07-23),
  refs/heads/graph/tactic-drain-disposition-diagnosis-cas-431144 (2026-07-25),
  and refs/heads/graph/tactic-drain-disposition-diagnosis-cas-733697 with a tip
  from 2026-07-28 11:19:53, hours before this filing. graph-commit names each
  scratch branch 'graph/$ref_id-$$' (graph-commit:1392) and deletes it in its
  EXIT-trap cleanup with 'git push origin --delete \"$SCRATCH_BRANCH\" >&2 ||
  true' (graph-commit:350) — best-effort, failure swallowed, and never reached
  at all if the writer is SIGKILLed or the process dies outside the trap. The
  accumulation is therefore a SIGNAL that writers are dying mid-landing, which
  is the more valuable half of this node: test-graph-commit.sh already asserts
  the invariant this violates (case 1, 'scratch branch deleted on origin after
  landing', asserted via scratch_refs() at test-graph-commit.sh:447/477-480), so
  the mechanism is known-good under a clean exit and the leaked refs are
  evidence about writer mortality, not about the delete call. One ref,
  refs/heads/graph/tactic-align-tactics-skill-prune-manual, carries no '-<pid>'
  suffix and so was not produced by graph-commit's own naming — it needs a
  separate provenance check before being swept."
reading: null
gap: null
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
# Leaked refs/heads/graph/* scratch branches on origin

## Context

`packages/intentionsutil/scripts/graph-commit` lands each intention-node edit by
pushing a scratch branch to `origin`, waiting for the required checks to stamp
that exact SHA, and then fast-forwarding `main`. The scratch branch is named:

```
SCRATCH_BRANCH="graph/$ref_id-$$"          # graph-commit:1392
```

— the node id plus the writer's PID. It is removed in the script's EXIT-trap
cleanup:

```
if [[ "$SCRATCH_PUSHED" -eq 1 && -n "$SCRATCH_BRANCH" ]]; then
  git push origin --delete "$SCRATCH_BRANCH" >&2 || true   # graph-commit:350
fi
```

`packages/intentionsutil/scripts/test-graph-commit.sh` already asserts the
resulting invariant — case 1, "scratch branch deleted on origin after landing",
checked by `scratch_refs()` (`:447`) at `:477-480`, plus case 32's related
assertion that the landing lock ref stays disjoint from the
`refs/heads/graph/**` namespace. So under a clean exit the mechanism works and
is covered.

## Verified state (2026-07-28)

`git ls-remote origin 'refs/heads/graph/**'` returns **10** refs:

| ref | tip date |
| --- | --- |
| `graph/tactic-align-strategy-skill-prune-3251902` | 2026-07-05 |
| `graph/tactic-align-tactics-skill-implqa-3432988` | 2026-07-05 |
| `graph/tactic-align-tactics-skill-prune-manual` | 2026-07-05 |
| `graph/strategy-diversify-income-2897651` | 2026-07-07 |
| `graph/tactic-review-lows-attention-tools-2907955` | 2026-07-07 |
| `graph/tactic-budget-overlap-anchor-merge-3891520` | 2026-07-10 |
| `graph/tactic-grounding-gap-analysis-3891250` | 2026-07-10 |
| `graph/tactic-strategy-fingerprint-stamp-shape-1396011` | 2026-07-23 |
| `graph/tactic-drain-disposition-diagnosis-cas-431144` | 2026-07-25 |
| `graph/tactic-drain-disposition-diagnosis-cas-733697` | 2026-07-28 11:19 |

The newest is from the morning of this filing, so the leak is **live**, not a
historical backlog that has since been fixed.

Two shapes are present:

- Nine match `graph/<id>-<pid>` and are genuine graph-commit scratch refs.
- One, `graph/tactic-align-tactics-skill-prune-manual`, has no numeric PID
  suffix and therefore was not produced by `graph-commit`'s naming. Its
  provenance must be established before it is swept — it may be a deliberate
  hand-created branch.

Note the `tactic-drain-disposition-diagnosis-cas` pair (`-431144`, `-733697`):
two different PIDs leaking refs for the same node id, three days apart.

## Scope

Two halves, the second the more valuable:

1. **Sweep.** Delete the orphaned scratch refs from `origin`, after confirming
   none is reachable from `main` and none is a live in-flight landing (a
   scratch ref for a writer currently mid-stamp must not be deleted out from
   under it — a freshness/age threshold or a liveness check is needed, not a
   blind wildcard delete). Handle
   `graph/tactic-align-tactics-skill-prune-manual` separately per its unknown
   provenance.

2. **Diagnose the leak.** Each leaked ref marks a `graph-commit` invocation
   that pushed a scratch branch and then never reached its EXIT trap — a writer
   killed mid-landing, or dying by a path that bypasses cleanup. Work the
   question of why, and close it. Candidate directions for a planning pass to
   settle:
   - Which exits skip the trap entirely (SIGKILL, the fleet's session reaping,
     a harness timeout), and whether any of them is routine enough to fix at
     the source.
   - Whether the trap's `|| true` is masking real delete failures that should
     be surfaced (`.claude/rules/code-style.md`: prefer clear errors over
     silent fallbacks) — at minimum a leaked ref should be *reported*, not
     swallowed.
   - Whether a periodic reaper belongs alongside the existing landing-lock TTL
     steal (`tactic-graph-commit-landing-lock`), so refs orphaned by an
     unavoidable kill are collected rather than accumulating forever.

The accumulation is a sensor for writer mortality; the sweep alone restores the
namespace but discards the reading.

## Reuse

- `packages/intentionsutil/scripts/graph-commit:1392` (scratch-branch naming),
  `:340-358` (the EXIT-trap cleanup block, including the scratch delete and the
  lock-release backstop).
- `packages/intentionsutil/scripts/test-graph-commit.sh:447` (`scratch_refs()`),
  `:477-480` (case 1's cleanup assertion), and case 32's namespace-disjointness
  assertion — the existing coverage to extend for whatever reaper or reporting
  lands.
- `tactic-graph-commit-landing-lock` — its CAS-claimed lock ref with TTL steal
  is the closest existing precedent for collecting state abandoned by a dead
  writer.
- `tactic-graph-node-session-reap` — session reaping is a plausible source of
  the kills; check for overlap before planning.
- `tactic-graph-ref-split` — the ratified greenfield direction retires the
  CI-stamp/scratch-branch mechanic entirely by landing on a dedicated
  `graph-main` branch. If that lands first, the scratch namespace disappears
  and only the sweep half of this node survives; sequence accordingly rather
  than building a reaper that ships dead.

## Out of scope

- Any change to how `main` is stamped or protected.
- The `refs/graph/landing-lock` ref, which is deliberately outside
  `refs/heads/graph/**` and is owned by `tactic-graph-commit-landing-lock`.
- No implementation plan is written here; this node is `status: raw`,
  `phase: null` for a later `/align-tactics` pass.
