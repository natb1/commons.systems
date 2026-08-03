---
id: tactic-office-hours-snapshot-wire-contract
kind: tactic
statement: "office-hours snapshot: extract a shared producer/reader
  wire-contract and fix the three breaks (GraphQL comments, missing version,
  missing memberEmails)"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review: the office-hours-snapshot
  producer -> dashboard reader pipeline is broken end-to-end in three
  independent ways, each masked by mocks/hand-built fixtures so CI is green
  around an integration that cannot work. Foundational for
  strategy-attention-surface's graph-native office-hours surface: the
  attention-surface rebuild subtree (signal-types, velocity-pace,
  analytics-collector) assumes a working producer/reader base. Land this before
  or alongside that subtree; it touches gh-fetchers.ts and snapshot.ts
  (serialize/decode), which the rebuild tactics largely do not, so keep it a
  distinct foundational fix rather than folding it in."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-office-hours-snapshot-wire-contract
  pr: 2805
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/review-fix: the code-review quality instrument could not be invoked
    this pass (Skill tool rejects nested code-review invocation under
    disable-model-invocation) -- the pass carries no Lane-A code-quality review,
    a coverage gap rather than a diff defect. All surfaced findings were
    otherwise resolved (2 fixed, 4 refuted, 4 out-of-scope, 12 informational);
    see PR comment 5161572240 and fix commit 4e979107."
  since: 2026-08-03
  recommendation: >-
    # Next steps: `tactic-office-hours-snapshot-wire-contract` (PR #2805)


    ## Short version


    The PR's own content is done. What parked it is a harness defect in
    `/review-fix` that is (a) confirmed systemic, (b) already tracked by a
    sibling node whose fix PR is green and mergeable right now. The
    highest-value action is **not** on this PR — it is merging the instrument
    fix, which stops every future review-fix pass from parking for the same
    reason.


    Suggested order: land the instrument fix, then clear this park. Both are
    short.


    ---


    ## 1. The defect is systemic — confirmed, and already measured


    Not a one-off. Grepping the session transcripts under
    `/home/n8/.claude/projects/` for the literal rejection `Skill code-review
    cannot be used`:


    | Date | Files with the rejection |

    |---|---|

    | 2026-07-19 | 1 |

    | 2026-07-21 | 5 |

    | 2026-07-22 | 10 |

    | 2026-07-23 | 8 |

    | 2026-07-25 | 8 |

    | 2026-07-28 | 5 |

    | 2026-07-30 | 5 |

    | 2026-07-31 | 114 |

    | 2026-08-01 | 14 |

    | 2026-08-02 | 16 |


    186 files total, spread across dozens of distinct worktree project
    directories. Every review-fix pass since at least 07-19 has run with zero
    Lane-A code-quality coverage.


    **The mechanism, confirmed.** There is no `.claude/skills/code-review/` in
    this repo — `code-review` is a Claude Code **built-in**, and it ships with
    `disable-model-invocation`. So there is no repo-side frontmatter to flip; a
    `Skill(skill: "code-review", …)` call from inside a subagent is structurally
    never invocable, regardless of what the workflow asks for. The call site is:


    - `.claude/workflows/review-fix.js:648-668` — `finderPrompt`'s `code-review`
    branch: *"Invoke the built-in `/code-review` skill via the Skill tool with
    the `max` effort argument AND the `--fix` flag."*

    - `security-review` (same file, `:670-690`) survives because that built-in
    does not carry the flag, not because it is invoked differently in any
    structural sense.


    This was already measured and written down on 07-31: the tracked node's
    `rationale` records *"all 18 invocations of Skill(code-review, 'max --fix')
    were rejected with disable-model-invocation, so the built-in never ran and
    the finder hand-rolled a review in its place."*


    ## 2. It is already tracked — file nothing new


    `intentions/tactic-review-code-review-invocation-contract.md` covers exactly
    this defect. Current state:


    - `phase: review`, PR #3007, `attention.boost: 55`, `tier: 1`, `pace_exempt:
    true`

    - Statement: *"replace the rejected Skill-tool call with the `claude -p`
    user-turn entry point, restore `--fix`, adopt `--comment`, and parse
    findings from text"*

    - `blocked_by: []` — its former blocker,
    `tactic-hold-conflict-review-code-review-invocation-contract`, is at `phase:
    done`

    - PR #3007: `MERGEABLE`, `mergeStateStatus: CLEAN`, **all 20 checks green**
    (including `hook-tests`, which is where the doctrine conflict lived)


    So the conflict that stalled it is behind it and the PR is ready to go. Do
    not file a new node or issue for this.


    **The loop worth breaking.** #3007 sits at `phase: review` with markers
    `[planned, qa-done]` and no `reviewed` marker. The next router tick will
    send it through the same `/review-fix` pass, which will hit the same
    rejection and escalate it to office-hours — the instrument fix parks on the
    instrument it fixes. That is the concrete reason to act on it by hand:


    ```

    # from a main-based checkout

    .claude/skills/dispatch-propagate/scripts/transition-node \
      tactic-review-code-review-invocation-contract --set-pr 3007
    ```


    If you want real review coverage on it first (reasonable — it rewrites the
    review harness), run `/code-review max --fix` yourself in a top-level
    session on that branch. Typed directly it works; only the nested Skill-tool
    path is refused.


    ## 3. Clearing this park (PR #2805)


    **Spot-check, don't re-derive.** Two things:


    - PR comment id `5161572240` (marker `<!-- dispatch:review-fix -->`) — the
    disposition table for all 22 findings.

    - Commit `4e979107` — two changes only: `"scope"` added to `LOCAL_ONLY_KEYS`
    in `office-hours-snapshot/src/parity.ts`, and `memberEmails` dropped from
    the offline wire in `office-hours/src/snapshot-wire.ts` (reader gains
    `requireMemberEmails: false` for the file-import path). Both verified green
    on merged head `b98bbea9`.


    Then:


    ```

    # from a main-based checkout

    .claude/skills/dispatch-propagate/scripts/transition-node \
      tactic-office-hours-snapshot-wire-contract --set-pr 2805
    ```


    Two gotchas:


    - **Run it from a main-based checkout**, not from the PR-branch worktree —
    from a PR worktree you have to apply the reset-dance `graph-commit` needs.

    - **Scope-freshness gate.** If `compute-freshness` reads the node's scope
    stamp as stale against current `origin/main`, `transition-node` **demotes
    the node to `implement`** instead of transitioning — losing the review work.
    Check freshness first, and restamp with `restamp-scope-fingerprint.ts` if
    the only delta is this PR's own fix commit.


    If you'd rather have genuine Lane-A coverage on this PR before clearing it,
    run `/code-review max --fix` directly against
    `tactic-office-hours-snapshot-wire-contract` first. Doing so on every parked
    PR is the expensive path — fixing the instrument (step 2) is the cheap one.


    References:

    - #2805: https://github.com/natb1/commons.systems/pull/2805

    - #3007: https://github.com/natb1/commons.systems/pull/3007
  session_type: other
pace_exempt: false
rounds: null
attributes:
  bug_fix: true
---
# office-hours snapshot: shared wire-contract + the three pipeline breaks

## Context

The office-hours-snapshot producer writes an encrypted `.benc` the dashboard
reader decodes. The 2026-07-05 review found the pipeline broken end-to-end in
three independent ways, each masked by mock runners and hand-built fixtures
so both isolated suites stay green. Root cause: the producer deep-imports
dashboard/functions internals via `../../office-hours/src/*.js` relative
paths instead of a shared wire-contract, so serializer and decoder drifted.

## Unit 1 — extract the shared wire contract

**Recommended model:** opus

Scope:
- Create a shared package (or module) owning the snapshot wire types and the
  serialize/decode pair, imported by both `office-hours-snapshot/src/` and
  `office-hours/src/`, replacing the `../../office-hours/src/*.js` deep
  imports in `produce.ts`, `snapshot.ts`, `parity.ts`, `run.ts`.
- Add ONE round-trip test feeding `serializeSnapshot` output straight into
  `decodeSnapshot` (no mocks) - the test that would have caught all three
  breaks.

## Unit 2 — fix the three breaks

**Recommended model:** opus

Scope:
- `office-hours-snapshot/src/gh-fetchers.ts:159,169,248`: `// type-safety-ok`
  comments sit inside GraphQL template literals (GraphQL comments are `#`),
  making every real query a syntax error. Move/relabel them.
- `snapshot.ts:246-265`: producer never emits `version`; reader
  (`office-hours/src/snapshot.ts:99`) rejects `version !== 1`. Emit it.
- `snapshot.ts:167-178`: serialized samples omit `memberEmails`, which the
  reader's strict parsers reject. Include it (and fix the parity checker,
  which strips it on both sides so it cannot catch the drift).

## Unit 3 — fold in the two related snapshot mediums

**Recommended model:** sonnet

Scope:
- `office-hours/src/backlog-runway.ts:43-49`: the `slope < 0` branch runs
  before the near-zero epsilon check, captioning a flat backlog
  "~1e16 days to clear". Reorder.
- `office-hours-snapshot/src/produce.ts:311-323`: `parked-only` scope
  fabricates a zeroed QueueMetricsSnapshot with no `scope` on the wire, so
  the dashboard shows a fabricated runway as real. Carry `scope` and render
  it as unmeasured.

## Verification

- The round-trip test passes; a real (non-mock) producer run writes a `.benc`
  the dashboard decodes with populated CAPACITY/PACE/HISTORY/BACKLOG panels.
  This also unblocks the queued main-qa verifications (#2704, #2698).

## Conflict resolution — 2026-07-23

The office-hours park (opened 2026-07-10, provision exit 11) is cleared. The
`origin/main` merge into PR #2805 conflicted in exactly two files against
PR #2783's analytics-collector work, which had landed `foldProjectSignals`
directly into `office-hours-snapshot/src/snapshot.ts` — the same file this
tactic replaces with a re-export shim over the new shared module. Both sides
are preserved; neither was dropped.

**Author decision (2026-07-23):** shown the placement options, the author chose
to fold `foldProjectSignals` into `office-hours/src/snapshot-wire.ts` — the
fold constructs an `OfficeHoursSnapshot`, so it belongs beside the type the
wire module owns. The park's own recipe additionally suggested exporting
`serializeProjectSignals`; the author rejected that as redundant. Both callers
(`serializeSnapshot` and `foldProjectSignals`) now live in the same module, so
it stays module-private.

What landed (merge commit `b30ad4b2`, follow-up `b44c48fd`; branch pushed, PR
left open for the normal lane):

- `office-hours-snapshot/src/snapshot.ts` — kept this branch's re-export shim.
- `office-hours/src/snapshot-wire.ts` — `SnapshotScope` gains `"analytics"`;
  `foldProjectSignals` ported in; `serializeProjectSignals` stays private.
- The ported no-prior-snapshot skeleton gains `version: 1`. #2783's skeleton
  predates the field; under the wire contract the type requires it, and it is
  also a genuine correctness fix — `decodeSnapshot` hard-rejects
  `raw.version !== 1`, so a version-less analytics skeleton would be written to
  disk and then refused by the reader. Called out on the PR as an intended
  behavior change rather than left to pass silently.
- `office-hours-snapshot/src/run.ts` — the conflicted hunk took `origin/main`'s
  `defaultReadPriorSnapshot` doc. Separately, the AUTO-MERGED (non-conflicted)
  `defaultReadPriorHistory` doc still claimed the serialized snapshot
  "intentionally drops" `memberEmails`, which this tactic makes false; the
  corrected wording was folded in there too. Resolving only the conflicted hunk
  would have landed a factually wrong comment.
- `office-hours-snapshot/src/parity.test.ts` — merge residue, not a conflict:
  #2861 added a second `SnapshotInput` literal while this branch made
  `memberEmails` a required field. Stamped `MEMBERS` on it.

Verification on the merged head: `tsc --noEmit` clean for both `office-hours`
and `office-hours-snapshot`; `run-unit-tests.sh` green (54 files / 542 tests,
plus the office-hours production build); `run-lint.sh` green.

Phase stays `implement`: PR #2805 is still an open DRAFT carrying no
`dispatch:*` label, and no implement→qa transition was ever written. The next
implement worker re-verifies CI on the merged head and writes the transition —
exactly what the park's own next-steps note anticipated.
