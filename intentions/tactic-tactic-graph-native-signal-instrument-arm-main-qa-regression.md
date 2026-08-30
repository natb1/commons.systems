---
id: tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression
kind: tactic
statement: "Post-merge Unit 3 of tactic-graph-native-signal-instrument-arm (PR
  #3060, merged 2026-08-10) has not executed: running `npm run read-sensors
  --prefix packages/intentionsutil` against a clean origin/main checkout and
  landing the single-node result via graph-commit was supposed to give
  strategy-graph-native-dispatch a non-null, four-segment reading, but
  origin/main's intentions/strategy-graph-native-dispatch.md still carries
  reading: null and gap: null as of 2026-08-10, even though PR #3060's Units 1-2
  code (LIFECYCLE_SENSOR_NAME re-point, src/census.ts,
  readBacklogBand/readBacklogSeries) is fully landed and verified present on
  main"
owner: ai
status: raw
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr16-node-mutation-scripts
  pr: 3138
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T00:43:02Z
    mergeCommitSha: 96d22cb13f56d4240305033b9ad9af76009f9ceb
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge Unit 3 of tactic-graph-native-signal-instrument-arm (PR #3060, merged 2026-08-10) has not executed: running `npm run read-sensors --prefix packages/intentionsutil` against a clean origin/main checkout and landing the single-node result via graph-commit was supposed to give strategy-graph-native-dispatch a non-null, four-segment reading, but origin/main's intentions/strategy-graph-native-dispatch.md still carries reading: null and gap: null as of 2026-08-10, even though PR #3060's Units 1-2 code (LIFECYCLE_SENSOR_NAME re-point, src/census.ts, readBacklogBand/readBacklogSeries) is fully landed and verified present on main

## Context

**Expected outcome** (needs-main residue item 9 on
`tactic-graph-native-signal-instrument-arm`, verified by `/qa-main`, node lane,
2026-08-10): "After this PR merges, running `npm run read-sensors --prefix
packages/intentionsutil` against a clean `origin/main` checkout and landing the
single-node result via `graph-commit` produces a non-null, four-segment
reading (`lifecycle:`, `router selections:`, `backlog:`, `backlog series
28d:`) on `strategy-graph-native-dispatch`, verified against `origin/main` (not
just locally)."

**Finding.** PR #3060 merged 2026-08-10T08:44:56Z. Verified on `origin/main`
at fetch time (2026-08-10):

- `packages/intentionsutil/scripts/read-sensors.ts` carries the re-pointed
  `LIFECYCLE_SENSOR_NAME` (`:454`) and the new `readBacklogBand` (`:669`) /
  `readBacklogSeries` (`:705`) exports, composed into `readLifecycleReading`
  (`:778-779`) — Units 1-2's code is fully landed.
- `packages/intentionsutil/src/census.ts` exists on `origin/main` — Unit 1's
  extraction landed.
- `git show origin/main:intentions/strategy-graph-native-dispatch.md | grep
  '^reading:'` → `reading: null` (and `gap: null`) — the fresh reading was
  never landed.
- No open PR touches `intentions/strategy-graph-native-dispatch.md`'s
  `reading` field (`gh pr list` against `strategy-graph-native-dispatch`
  returned four unrelated PRs: #3041, #3023, #2974, #3054).
- No prior attempt at this bug tactic exists (`intentions/tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression.md`
  did not exist at `origin/main` before this write).

This is expected: Unit 3 was explicitly scoped as post-merge, out-of-PR work
by the source tactic's own plan ("This unit changes no files in the PR. It is
post-merge work..."), and nothing in the dispatch chain runs it automatically
— it needs its own implement pass. Source node:
`tactic-graph-native-signal-instrument-arm`. Source PR: #3060.

## Scope — do exactly Unit 3 as originally planned

Reproduced verbatim from `tactic-graph-native-signal-instrument-arm`'s own
plan body (its Unit 3), since that PR has since merged and the node it lived
on is pruned once this bug tactic exists and the source transitions to `done`:

---

**Dependencies.** None remaining — Units 1 and 2 are confirmed merged to
`main` (see Finding above).

This unit changes **no files in a PR sense beyond one node's frontmatter**. It
runs `read-sensors` on a clean `main` checkout and lands exactly one node's
`reading`/`gap` fields via `graph-commit`.

**Scope.** In a checkout of `main` synced to `origin/main`, with a clean tree:

1. `git -C <repo> fetch origin main` and confirm `HEAD == origin/main` and
   `git status --porcelain` is empty. A stale or dirty checkout silently
   produces a stale reading and breaks `graph-commit`'s rebase.
2. **Capture the CAS base blob BEFORE any edit** —
   `git -C <repo> rev-parse origin/main:intentions/strategy-graph-native-dispatch.md`
   — and keep it. (Capturing it after the write makes `--base` vacuous.)
3. `npm run read-sensors --prefix packages/intentionsutil`.
   **Known destructive side effect:** this writes `reading` + `gap` into
   *every* node in `intentions/` that names a registered sensor, not just this
   one.
4. Preserve this node's file, then revert the rest — **in this order,
   checking the copy succeeded before the revert runs** (an unconditional
   revert after a failed copy destroys the reading):
   ```
   cp intentions/strategy-graph-native-dispatch.md /tmp/sgnd-reading.md   # must succeed
   git -C <repo> checkout -- intentions/
   cp /tmp/sgnd-reading.md intentions/strategy-graph-native-dispatch.md
   ```
5. Verify the result before landing: `git status --porcelain intentions/`
   names exactly one modified file, and
   `git diff -- intentions/strategy-graph-native-dispatch.md` touches only the
   `reading:` and `gap:` frontmatter fields — no body change, no
   `phase`/`execution`/`clarifications` change.
6. Land it:
   ```
   packages/intentionsutil/scripts/graph-commit -C <repo> \
     -m 'graph: land fresh reading on strategy-graph-native-dispatch' \
     --base strategy-graph-native-dispatch=<base-blob-from-step-2> \
     --expect strategy-graph-native-dispatch=$(git -C <repo> hash-object -- intentions/strategy-graph-native-dispatch.md) \
     strategy-graph-native-dispatch
   ```
   `graph-commit` stages exactly `intentions/<id>.md` per id, so no other
   node can ride along. `--base` is the compare-and-swap freshness check
   against `origin/main`; `--expect` is the wrong-repo targeting assertion
   (they are not interchangeable).
7. Confirm the landing on the remote, not locally:
   `git -C <repo> fetch origin main && git -C <repo> show origin/main:intentions/strategy-graph-native-dispatch.md | head -50`
   shows the non-null `reading:`. A local commit that was never pushed reads
   as success in the worktree and is not a landing.

**Out of scope.** Editing any other node's `reading`/`gap`; changing
`rounds`, `phase`, `attention`, or the `success_signal` itself; running
`read-sensors` from a worktree that is not `main`; any change to
`read-sensors.ts`, `census.ts`, or their tests (Units 1-2 already landed —
do not re-touch their code).

---

**Recommended model.** opus (compound multi-step git/graph-commit sequencing
with a destructive-side-effect revert dance — matches the source node's own
model choice for this same unit).

## Verification

```verify
git -C . fetch origin main && git -C . show origin/main:intentions/strategy-graph-native-dispatch.md | grep -A1 '^reading:'
```

Manual check: the shown `reading:` value is non-null and contains all four
segments (`lifecycle:`, `router selections:`, `backlog:`, `backlog series
28d:`); `git -C . show --stat origin/main -- intentions/` on the landing
commit shows exactly one changed node
(`intentions/strategy-graph-native-dispatch.md`).

## Verified, not re-implemented — 2026-08-30

Closed alongside #3138 (merge commit `96d22cb1`), Position 2 of the dispatch/RSI
serialized window. The fresh reading landed as `8a823862`.

This is a `main-qa` regression node: the code merged, the post-merge
verification did not happen. So the question was whether the merged instrument
arm actually produces a non-null four-segment reading — **not** whether to
rebuild it.

**The arm works.** It was run read-only against the live store and produced all
four segments (lifecycle, router selections, backlog, backlog series). A fresh
reading was then landed on `strategy-graph-native-dispatch` by its own
single-node write.

### What the fresh reading says, and why it matters

The value that had been sitting on the node was landed 2026-08-10 by a 12-node
RSI batch rather than the single-node write this node's scope prescribes, and it
was **19 days stale and flattering**:

```
backlog: 58/236 = 24.6% (band ≤35%); backlog series 28d: 47.6% → 38.2% → 31.4% → 24.6% (non-increasing)
```

The measured value now on `origin/main`:

```
backlog: 128/316 = 40.5% (band ≤35%); backlog series 28d: 28.0% → 20.4% → 44.6% → 40.5% (increasing)
```

The backlog has regressed **out of its ≤35% band** and the 28-day series has
turned from non-increasing to **increasing**. That is the signal this node
existed to make readable, and it is bad news — which is precisely why leaving the
stale flattering number in place would have been the wrong close.

### Corrections to this node's own text

- The `gap:` language is obsolete — `gap` is derived on read and never stored,
  so it is absent from frontmatter by design.
- The verification is complete for the arm itself; the regression it now reports
  is a separate matter for the strategy, not unfinished work on this node.
