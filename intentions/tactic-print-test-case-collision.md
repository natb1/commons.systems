---
id: tactic-print-test-case-collision
kind: tactic
statement: Delete print/test/pages/Home.test.tsx — the repo's only
  case-colliding tracked path, a stale byte-for-byte subset of the
  actively-maintained print/test/pages/home.test.tsx that makes every
  macOS/Windows checkout permanently dirty
owner: ai
status: codified
parent: null
rationale: "Minted by the 2026-07-23 orphaned-PR queue audit as the missing
  tracker for PR #2786 (branch 0-fix-print-test-case-collision, opened
  2026-07-06 — the oldest open PR). The branch uses the retired issue-lane
  naming convention with a placeholder issue number 0; GitHub issues are
  disabled repo-wide, so nothing could ever dispatch it, and no intention node
  referenced it — it was on neither queue. Serves strategy-autonomous-execution
  rather than strategy-main-health: the harm is a checkout-integrity hazard for
  the chain's per-node fresh worktrees, and strategy-main-health carries a
  standing boost 100 that would wrongly rank this hygiene fix above real
  red-main work. The change itself is verified complete and coverage-neutral;
  the node is born parked because the blocking check is red BY DESIGN and only
  the author can authorize the path forward."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: 0-fix-print-test-case-collision
  pr: 2786
  attempts: {}
  markers: []
  strategy_fingerprint:
    strategy-autonomous-execution:
      hash: dd3961ce32c3f94852763ecd1212f9799714b6002b418e430bf2c9477437c9de
      sha: 1759c122ff5a0c06ec0b869ab0e44aba451a1913
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Delete print/test/pages/Home.test.tsx — the repo's only case-colliding tracked path, a stale byte-for-byte subset of the actively-maintained print/test/pages/home.test.tsx that makes every macOS/Windows checkout permanently dirty

## Context

`print/test/pages/Home.test.tsx` and `print/test/pages/home.test.tsx` are both
tracked on `origin/main`. They are the **only** case collision in the entire
repository:

```
git ls-tree -r --name-only origin/main | tr 'A-Z' 'a-z' | sort | uniq -d
  → print/test/pages/home.test.tsx
```

(`print/src/pages/Home.tsx` vs `print/src/pages/home.ts` is *not* a collision —
the extensions differ.)

On a case-insensitive filesystem — macOS APFS by default, Windows NTFS — git
writes both blobs to one physical path. The last writer wins and the other path
shows as permanently modified in `git status` on every fresh clone, checkout,
and worktree, with no local edit to explain it. CI's own `darwin-build` job runs
`actions/checkout` on `macos-14`, so the hazard is reproduced in CI, not only on
developer machines. On Linux the two files coexist and vitest runs 22 duplicated
test declarations on every suite pass.

The upper-case file is stale. `home.test.tsx` was extended past it by
`97f536b1` (cursor pagination) with Load-more coverage that never reached
`Home.test.tsx`; the lower-case path has an older, independent history
(`37e4b793`, `598ae232`) that the upper-case path does not share.

## Scope

In scope — one deletion, no other change:

- Delete `print/test/pages/Home.test.tsx`.

Out of scope:

- `print/test/pages/home.test.tsx` — untouched; it is the surviving file.
- Any source under `print/src/` — nothing imports or references the upper-case
  filename; vitest discovery is glob-based.
- The `test-integrity` check script itself — see `tactic-test-integrity-waiver`.

## Evidence — the deletion is coverage-neutral

A byte-level diff of the two blobs at `origin/main` yields exactly four hunks
and nothing else:

1. the import line gains `wireLoadMore`;
2. the `makeCloudPage` helper is moved below `makeMediaItem` (a pure reorder);
3. +111 lines of new declarations.

Line counts confirm the diff is exhaustive: 350 (upper) + 111 = 461 (lower).
Every remaining byte of `Home.test.tsx` is identical to the corresponding
region of `home.test.tsx`.

Declaration-title comparison is therefore a strict superset. All 21 `it(...)`
titles and both `describe(...)` titles in `Home.test.tsx` appear verbatim in
`home.test.tsx`, which adds six more (three Load-more render cases and a
`wireLoadMore` block). **No assertion is lost by the deletion.** This is a
duplicate removal, not a weakening — the project rule in
`.claude/rules/test-integrity.md` is not violated.

Post-merge verification on the refreshed branch: `npx vitest run --project
print --root .` → 35 files passed, 1 skipped, 640 tests passed, 0 failed.

## Why the `test-integrity` check is red, and why no autonomous fix exists

`.github/scripts/check-test-integrity.sh` fires two signals here:

- **Signal 2** — 22 net test declarations removed. Counted by `grep` over
  `git diff` lines; the script has no notion of a declaration surviving in a
  *different* file.
- **Signal 3** — a whole test file deleted.

The script carries exactly two exemptions and neither reaches this case:

- the **basename co-deletion** exemption requires a non-test impl file of
  matching basename to be deleted in the same PR — nothing else is deleted here;
- the **import-based** exemption (issue #2637) requires every symbol the test
  file stopped importing to be absent from the post-PR source tree —
  `loadMediaHtml`, `afterRenderHome`, `wireDownloadActions` and `Home` all
  still exist, so the check correctly biases to fire.

There is no third exemption for "a duplicate test file whose declarations
survive verbatim in a sibling path", and inventing one by adding declarations
elsewhere would be gaming the gate. So the check is red by design and no
in-PR fix can clear it — precisely the residual class
`tactic-test-integrity-waiver` exists for (its provenance case was PR #2835).
That node's park side is the doctrine this node follows: park to office hours
with the proposed waiver object; never fix-loop a red-by-design check.

## State

Branch `0-fix-print-test-case-collision`, draft PR #2786, one commit
(`a505a952`), one file deleted. The branch has been refreshed against
`origin/main` (clean merge, no conflicts) and re-pushed by the 2026-07-23 queue
audit; the deletion still applies and the collision is still present on main.
Every check except `test-integrity` is green, including `unit-tests`,
`typecheck`, `lint`, `acceptance` and `preview-and-smoke`.

Naming residual: the branch keeps the retired issue-lane form
`<issue-number>-<slug>` with a placeholder `0`. `execution.branch` is read as a
literal by the graph tooling — no code derives it from the node id — so the
mismatch is cosmetic. Renaming would orphan PR #2786's head, so it is
deliberately left alone.

## Verification

```verify
npx vitest run --project print --root .
```

Beyond the suite, the collision fix itself is verified by a shell check that
must return empty on `origin/main` after merge:

```
git ls-tree -r --name-only origin/main | tr 'A-Z' 'a-z' | sort | uniq -d
```

A non-empty result means a case collision is tracked again. The
human-observable confirmation is a fresh clone on macOS producing a clean
`git status`.

## RESOLVED — author-ratified override-merge, 2026-07-23 — DO NOT RE-PARK

**This node's office-hours park is CLOSED and must not be re-opened. PR #2786
is MERGED. There is nothing left here to decide, implement, fix, review, or
escalate.**

On **2026-07-23** the repo author was shown the full evidence recorded above
and ratified option (a) of the park recommendation verbatim: **override-merge
on the recorded evidence**. The `test-integrity` red on PR #2786 is a **known
false positive with no exemption class** — Signals 2 and 3 are syntactic grep
counts over the diff with no notion of a declaration surviving in a *different*
file, and both exemptions in `.github/scripts/check-test-integrity.sh`
correctly decline. The gate was overridden deliberately, exactly as it was for
PR #2835. No test was weakened, no check was disabled, no force-push was made.

Merge record:

- PR #2786 marked ready for review and **squash-merged 2026-07-23T16:15:34Z**.
- Merge commit **`bfc45d05854a2780f0dca281266a9255a9820612`** on `origin/main`.
- `--admin` was **not** required. The `default branch` ruleset lists exactly
  four required status checks — `acceptance`, `preview-and-smoke`, `lint`,
  `unit-tests` — all green. `test-integrity` is advisory, so the ordinary
  merge path accepted it.
- Pre-merge re-verification: the diff against `origin/main` was still exactly
  `D print/test/pages/Home.test.tsx` and nothing else; `test-integrity` was the
  only non-passing check; `print/` had no changes on `main` since the branch's
  merge base, so the net effect of the merge was precisely that one deletion.
- Coverage re-checked at merge time: all **22** `it`/`describe` titles in the
  deleted file appear verbatim among the **29** in `print/test/pages/home.test.tsx`
  (`comm -23` of the two sorted title sets is empty). Zero coverage lost.
- Post-merge verification on `origin/main`: `print/test/pages/Home.test.tsx` is
  gone, `print/test/pages/home.test.tsx` remains, and the collision probe
  `git ls-tree -r --name-only origin/main | tr 'A-Z' 'a-z' | sort | uniq -d`
  returns **empty** — zero case collisions repo-wide.

Remaining state: `phase` is left at `review` only until the next
`reconcile-graph-merged` sweep, which absorbs a merged tactic carrying no
`## needs-main` residue to `done` and **prunes** this node file in the same
graph-commit. That prune is the intended terminal state, not a loss of record —
this section and its authorization are permanent in the landing commit and in
PR #2786's comment thread.

**Instruction to any future session that encounters this node:** do not park
it, do not re-run the review / fix / QA lanes, do not re-litigate the
`test-integrity` red, and do not reopen or revert PR #2786. The only correct
action is to let the reconciler prune it — or prune it directly via
`graph-commit --prune tactic-print-test-case-collision`.
