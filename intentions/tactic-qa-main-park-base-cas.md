---
id: tactic-qa-main-park-base-cas
kind: tactic
statement: /qa-main's cannot-verify Stop-hook park calls park-node with no
  --base CAS, so an in-flight qa-main session can revert a phase transition that
  landed on origin/main after it read the node — and the pinned form must also
  be made invocable under auto mode, which currently denies the --base flag
owner: ai
status: raw
parent: null
rationale: "Observed clobber on tactic-execution-pr-merge-verification,
  2026-07-28: an in-flight /qa-main session reverted the author's just-landed
  done transition 54 seconds later and re-parked on a residue item the author
  had already waived, deadlocking tactic-census-scripted-tick (which is
  blocked_by that node). park-node already supports --base with an exit-3
  stale-diagnosis refusal that would have caught it. Distinct producer from
  tactic-graph-write-recipes-base-cas, tactic-drain-disposition-diagnosis-cas,
  tactic-demote-node-stale-local-read, and
  tactic-fix-checks-pushed-nothing-base."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path integrity work above ordinary feature
    work. This band holds the silent graph-write-corruption defects plus the two
    paths the bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /qa-main's cannot-verify Stop-hook park calls park-node with no --base CAS, so an in-flight qa-main session can revert a phase transition that landed on origin/main after it read the node — and the pinned form must also be made invocable under auto mode, which currently denies the --base flag

## Interview context (2026-07-30, office-hours drain byproduct — raw, for /align-tactics)

The fix has **two halves**. Shipping half (i) alone produces a skill that either
fails closed on every park or silently degrades to the unpinned form, so both
must land together.

### (i) Wire `--base` into the `/qa-main` cannot-verify park path

`.claude/skills/qa-main/SKILL.md:198-206` (line numbers drift — locate by the
`cannot-verify` bullet) documents the safety valve: the session writes its reason
and recommendation to `$CLAUDE_JOB_DIR/office-hours-reason` and
`office-hours-recommendation`, and the Stop hook (`.claude/hooks/dispatch-stop.sh`)
parks the node via `park-node`. No `--base` compare-and-swap is passed anywhere on
that path, so the park lands unconditionally on whatever `origin/main` holds at
Stop-hook time — including a phase transition that landed after the session read
the node.

`park-node` already supports the pin: `packages/intentionsutil/scripts/park-node:69`
(usage) and `:206` (the exit-3 `stale-diagnosis` refusal, which prints
"the node changed between diagnosis and execution … Nothing was written"). That
refusal would have caught the clobber below exactly. The work is to capture the
node's `origin/main` blob at qa-main **diagnosis** time, thread it to the Stop
hook, and route an exit-3 back to re-diagnosis rather than to a blind re-park.

### (ii) Make the pinned form invocable under auto mode

Measured 2026-07-30 during this drain: `graph-commit --base <id>=<sha> -m … <id>`
was **denied by the auto-mode classifier**. The identical command with `--base`
removed was permitted, and `graph-commit --help` passed — isolating the denial to
the `--base` flag itself, not to the sandbox setting and not to the commit message
text (two different messages were tried). The drain therefore had to land
unpinned and verify the landed blob against `origin/main` afterward.

This means a `--base` mandate is currently unenforceable in an autonomous lane:
the harness denies the safer form and permits only the form that caused the
defect. Any fix must include making the pinned invocation pass the classifier
(a permission rule, an argument shape the classifier accepts, or a wrapper).
Re-measure before implementing — the classifier's behavior may have changed.

### The clobber this came from (2026-07-28, `tactic-execution-pr-merge-verification`)

All four commits are on `main`, same day:

| time | commit | effect |
|---|---|---|
| 11:14:29 | `71c013b8` | author records the human-override waiver of needs-main residue item 12 |
| 11:17:18 | `6d7adefb` | `phase: main-qa` → `phase: done` |
| 11:18:12 | `fd9b3d6f` | `/qa-main` park: reverts `phase: done` → `main-qa`, writes `office_hours` |

`fd9b3d6f`'s **parent is `6d7adefb`** — the writer had `phase: done` in its git
base and wrote `main-qa` anyway, 54 seconds later. It was an in-flight `/qa-main`
session that had read the node before 11:17 and wrote its stale copy; `graph-commit`
rebased and landed the whole-file revert with nothing to compare against. The
author has since confirmed they personally authored both the 11:14 waiver and the
11:17 transition, so the park was a clobber, not a legitimate re-park.

Blast radius beyond the single node: the re-park held the node at `main-qa`, and
`tactic-census-scripted-tick` is `blocked_by` it, so `blockersComplete`
(`packages/intentionsutil/src/router.ts:156-168`) held census blocked. The park's
own recommendation told the human to wait for census to progress — a cycle the
park itself created. Drained 2026-07-30 by restoring `phase: done` +
`office_hours: null`.

### Dedup (checked 2026-07-30, re-check at finalization)

Four nodes touch `--base` CAS; none covers this producer.

- `tactic-graph-write-recipes-base-cas` — `phase: done`. Completion recipes.
- `tactic-drain-disposition-diagnosis-cas` — `phase: done`. Batched drain
  dispositions; it is what *added* `park-node --base`. This node is a consumer
  that was never wired up.
- `tactic-demote-node-stale-local-read` — `phase: null`, `status: raw`. Scoped to
  `demote-node-to-implement`.
- `tactic-fix-checks-pushed-nothing-base` — `phase: null`, `status: raw`. Closest
  structural sibling (same "a specific producer still graph-commits unpinned"
  shape), but the fix-checks node-lane pushed-nothing branch, not the qa-main park.

Half (ii) appears in none of them, and it may generalize: if the classifier denies
`--base` broadly, `tactic-fix-checks-pushed-nothing-base` and
`tactic-demote-node-stale-local-read` inherit the same blocker. Consider whether
(ii) should be split out as a shared prerequisite at finalization.
