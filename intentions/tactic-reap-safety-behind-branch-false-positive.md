---
id: tactic-reap-safety-behind-branch-false-positive
kind: tactic
statement: The session-reap safety gate proves reap-safety with a two-dot `git
  diff origin/main HEAD`, which reports every commit main gained since the
  branch was cut — so a branch that is strictly BEHIND with nothing of its own
  reads as unlanded content and is refused a reap permanently
owner: ai
status: codified
parent: null
rationale: "Confirmed live 2026-08-06 by direct measurement during an N+7
  monitor pass. THE DEFECT: `lib-session-reap.sh` gate 7b proves reap-safety
  with `git -C $wt_path diff --quiet origin/main HEAD -- . ':!intentions'`
  (lib-session-reap.sh:328). Two-dot was chosen deliberately over a commit count
  and that reasoning is SOUND and must be preserved — GitHub squash-merges, so a
  branch's individual commits are never ancestors of main, only their content
  is, and a commit-count gate therefore refuses a safe reap after every squash
  merge (recorded at length on the sibling tactic-self-close-reap-silent-noop).
  But two-dot is symmetric: it also reports every commit MAIN gained since the
  branch was cut. A worktree sitting on a branch with zero commits of its own,
  merely stale, therefore diffs against origin/main by main's entire subsequent
  history — rendered as deletions — and the gate reads that as the branch's own
  unlanded work. MEASURED: session 2551a780 on node
  tactic-fleet-alarm-unclaimed-hold logged SESSION_REAP_SKIP_UNLANDED_CONTENT
  every ~15 minutes for hours; its worktree was 0 commits ahead of origin/main
  and 182 behind, with a clean tree and no open PR — nothing whatsoever to lose.
  THE BLAST RADIUS: of 66 worktrees enumerated the same day, 32 were
  0-ahead-and-clean and would false-positive identically the moment a terminal
  session held one. THE CONSEQUENCE: the refusal is permanent, not transient — a
  stale branch only gets staler, so the diff only grows. The session stays
  registered, holds a live-session slot, and its node stays unselectable
  (worktree_has_live_session is NAME-keyed on the node id), which is the same
  double-bind the auto-heal contract exists to prevent. THE FIX DIRECTION
  (greenfield): the gate is safe if EITHER predicate holds — `git rev-list
  --count origin/main..HEAD` is 0 (the branch has nothing of its own, so it is
  trivially safe), OR the existing two-dot content diff is empty (the content
  already landed — the squash-merge case). Add the cheap rev-list short-circuit
  BEFORE the diff. It is a pure widening of the safe set: every worktree the
  gate accepts today it still accepts, and it must fail closed exactly as the
  rest of the file does — a git error on either arm still skips the session, per
  the file's standing UNKNOWN-toward-KEEP posture. SIBLING, worth citing when
  planning: tactic-graph-commit-noop-shortcircuit-head-behind carries the same
  strictly-behind theme in graph-commit — a HEAD behind origin/main misread as a
  state to act on. The nearest reap-lane neighbours do NOT own this:
  tactic-self-close-reap-silent-noop owns the `claude rm` decline (a later step
  in the same sweep, different failure),
  tactic-session-reap-authorization-durability owns gates 3/4 (job-dir-keyed
  authorization, a different gate), and tactic-graph-node-session-reap is phase:
  done. Dedup-checked 2026-08-06: free. FINALIZED 2026-08-06 via /align-tactics
  tactic-mode: plan authored on Opus after a clean drift pass (no Side-A/Side-B
  blockers, no unrecorded material premises), re-confirming the false positive
  mechanically in a scratch repo and grounding the fail-closed corner case (a
  missing origin/main ref fails both the rev-list and diff arms identically, so
  an unknown ahead-count can never reach a reap)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a reap-path correctness
    defect that permanently strands a worker slot and freezes its node — the
    same band as the other dispatch-containment fixes
    (tactic-graph-execute-fresh-main-read, tactic-probe-unknown-never-clear),
    which carry the identical boost."
  tier: 1
phase: qa
execution:
  branch: tactic-reap-safety-behind-branch-false-positive
  pr: 3052
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-08-09
    attempt: 1
    pushed_sha: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A strictly-behind branch is not unlanded work

`session_reap_sweep`'s reap-safety gate (gate 7b) asks whether the worktree's
tree differs from `origin/main` outside `intentions/`:

```sh
git -C "$wt_path" diff --quiet origin/main HEAD -- . ':!intentions'
```

Two-dot `diff A B` compares two trees. It answers "do these differ", not "does
`B` carry work `A` lacks". Those coincide only when `B` is at or ahead of `A`.
When `B` is strictly BEHIND, the diff is populated entirely by `A`'s own newer
content, rendered as deletions — and the gate reads it as the branch's own
unlanded work, refusing the reap forever.

## Context

### Measured 2026-08-06

Session `2551a780`, node `tactic-fleet-alarm-unclaimed-hold`, logging on every
sweep interval for hours:

```
SESSION_REAP_SKIP_UNLANDED_CONTENT: name=tactic-fleet-alarm-unclaimed-hold
  session=2551a780-... worktree=.../tactic-fleet-alarm-unclaimed-hold
  branch=tactic-fleet-alarm-unclaimed-hold
  (tree differs from origin/main outside intentions/)
```

The worktree at that moment:

| probe | value |
|---|---|
| `rev-list --count origin/main..HEAD` | **0** |
| `rev-list --count HEAD..origin/main` | 182 |
| `status --porcelain --untracked-files=no` | empty |
| open PRs on the branch | 0 |

Nothing to lose, refused forever. The operator reaped it by hand, which is the
absence of an auto-heal rather than one.

Re-confirmed at plan time in a scratch repo: with `origin/main` one commit ahead
of a branch that has zero commits of its own, `rev-list --count
origin/main..HEAD` is `0` while `git diff --quiet origin/main HEAD -- .
':!intentions'` exits `1`. The false positive is mechanical and reproducible.

### Why it is systemic, not incidental

A worktree provisioned for a node and then left behind by `main` is the normal
resting state of the fleet, not an edge case. Of 66 worktrees enumerated on
2026-08-06, **32 were 0-ahead and clean** — every one would trip this gate
identically the moment a terminal session held it. The refusal is also monotone:
a stale branch only falls further behind, so the false diff only grows. There is
no interval after which the gate self-corrects.

The consequence is the double-bind the auto-heal contract exists to prevent: the
session stays registered, holds a live-session slot, and the node stays
unselectable (`worktree_has_live_session` is NAME-keyed on the node id).

### Do NOT "fix" this by reverting to a commit count

The two-dot choice is deliberate and its motivating case is real. GitHub
squash-merges: a branch's individual commits are never ancestors of `main`, only
their content is. A commit-count-ONLY gate therefore refuses a safe reap after
every squash merge — sessions measured 11 and 12 commits "ahead" on 2026-08-03
were entirely safe. That reasoning is recorded on
`tactic-self-close-reap-silent-noop` and in this file's own header
(`.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:96-108`); it
must survive this change intact.

The two gates fail in OPPOSITE directions, which is why the fix is a
**disjunction**, not a replacement.

### Greenfield design (what a from-scratch gate would be)

Gate 7b proves one property: *this worktree holds nothing that would be lost by
removing it*. Two independent, cheap proofs of that property exist, and the gate
should accept EITHER:

1. **Ahead-count arm.** `git rev-list --count origin/main..HEAD` is `0` — the
   branch has no commits of its own (in sync, or merely behind). Trivially safe:
   there is nothing that could have failed to land. Cheaper than a tree diff.
2. **Content arm.** The existing two-dot `diff --quiet origin/main HEAD -- .
   ':!intentions'` is empty — the branch's content already landed (the
   squash-merge case).

Arm 1 runs first as a short-circuit. This is a **pure widening**: every worktree
the gate accepts today it still accepts, and every worktree it newly accepts has
provably nothing of its own.

There is no brownfield migration path to describe — the greenfield gate IS the
one-file change, with no state, no schema, and no consumer contract altered (the
printed token vocabulary at `lib-session-reap.sh:243` is unchanged).

### Fail-closed, and how it reconciles with pure-widening

The file's standing posture is UNKNOWN → KEEP, and this change keeps it. The
resolution recorded here (a decision the node's own text left implicit): a
`rev-list` FAILURE or non-numeric output does not itself emit a skip token — it
leaves the ahead-count unknown and **falls through to arm 2**, which already
fails closed (`rc > 1` → `skip-diff-error`, never a reap).

That is both fail-closed and purely widening, and the two are not in tension
here because both probes resolve the SAME `origin/main` ref. Measured at plan
time: with `refs/remotes/origin/main` absent, `rev-list --count
origin/main..HEAD` exits **128** and `diff --quiet origin/main HEAD` exits
**128** — they fail together. So an unknown ahead-count can never reach a reap
except when arm 2 independently proves the content already landed, which is
exactly today's accepted behavior.

Deliberately NOT chosen: a new `skip-rev-list-error` token. It would extend a
token vocabulary that three other files consume
(`lib-session-reap.sh:243`, `dispatch-node-reap:46`,
`.claude/skills/dispatch-invalid-state/SKILL.md:163`) to describe a state that,
per the measurement above, is unreachable without `skip-diff-error` also firing.

## Units of work

### Unit 1 — Make gate 7b a disjunction, and rewrite the header doctrine

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh`.

1. **Gate 7b itself — `lib-session-reap.sh:323-343`.** Wrap the existing content
   diff in an ahead-count short-circuit. The existing `local diff_rc=0`, the
   `git ... diff --quiet ...` line, and the three-way `case` (`0` / `1` →
   `skip-unlanded-content` / `*` → `skip-diff-error`) move INTO the `else` branch
   **verbatim** — same log strings, same tokens, same `return 0`s. Target shape:

   ```sh
         # (7b) REAP-SAFETY gate — a DISJUNCTION. Either arm independently
         # proves the worktree holds nothing that removing it would lose. See
         # the header for why neither arm alone is sufficient.
         #
         # Arm 1 — AHEAD COUNT. `rev-list --count origin/main..HEAD` counts the
         # commits HEAD has that origin/main does not. ZERO means the branch has
         # NOTHING of its own (in sync, or merely BEHIND), so there is nothing
         # that could have failed to land. This arm exists because arm 2 is
         # SYMMETRIC: a strictly-behind branch diffs against origin/main by
         # main's own newer content, rendered as deletions, and arm 2 alone
         # reads that as the branch's unlanded work.
         #
         # A `rev-list` failure or non-numeric output emits NO token of its own:
         # the count is simply unknown and the gate falls through to arm 2,
         # which fails closed on its own error. Both probes resolve the same
         # `origin/main`, so a ref that arm 1 cannot read is one arm 2 cannot
         # read either (both exit 128) — an unknown count can never reach a reap.
         local ahead=""
         ahead=$(git -C "$wt_path" rev-list --count origin/main..HEAD 2>/dev/null) || ahead=""
         if [[ "$ahead" == "0" ]]; then
           _lsr_log "$log_file" "$log_tag" \
             "SESSION_REAP_NOTHING_AHEAD: name=$name session=$sid worktree=$wt_path branch=$branch (0 commits ahead of origin/main; content diff not consulted)"
         else
           # Arm 2 — CONTENT DIFF. `--quiet` exits 0 for "no diff", 1 for
           # "diff", >1 for an error (UNKNOWN → keep). `-C` puts the cwd at the
           # worktree root, so `.` and `:!intentions` are both anchored there.
           local diff_rc=0
           git -C "$wt_path" diff --quiet origin/main HEAD -- . ':!intentions' 2>/dev/null || diff_rc=$?
           case "$diff_rc" in
             0) ;;
             1)
               ... existing skip-unlanded-content block, unchanged ...
               ;;
             *)
               ... existing skip-diff-error block, unchanged ...
               ;;
           esac
         fi
   ```

   Required details: the comparison is the exact string test `[[ "$ahead" == "0" ]]`
   (so any non-numeric or empty output falls through, no numeric-context
   evaluation of garbage); the new log tag is `SESSION_REAP_NOTHING_AHEAD`, which
   deliberately contains no `SKIP` substring so existing `SESSION_REAP_SKIP`
   greps and the sweep's skipped-counter are unaffected; no new printed token.

2. **Gate enumeration — `lib-session-reap.sh:92-93`.** The gate-6 bullet
   currently reads "`git diff origin/main HEAD -- . ':!intentions'` is EMPTY".
   Restate it as the disjunction: `rev-list --count origin/main..HEAD` is 0 OR
   that diff is empty.

3. **Header doctrine — `lib-session-reap.sh:96-108`.** Retitle the block from
   "WHY THE REAP-SAFETY GATE IS A CONTENT DIFF, NOT A COMMIT COUNT" to a
   disjunction framing (e.g. "WHY THE REAP-SAFETY GATE IS A DISJUNCTION"). Keep
   the whole squash-merge paragraph and the `worktree_in_sync` /
   `worktree_merged_in_sync` non-reuse rationale intact and still true — it is
   why arm 2 survives. ADD, as a second case, the strictly-behind measurement
   (session `2551a780`, 0 ahead / 182 behind, 32 of 66 worktrees the same shape
   on 2026-08-06) and the symmetry argument for why arm 1 is needed. State
   explicitly that arm 1 is `origin/main..HEAD` (ahead), NOT `HEAD..origin/main`
   (behind) — transposing them inverts the gate.

4. **Token doc — `lib-session-reap.sh:243`.** No new token. Sharpen the
   `skip-unlanded-content` line to say what it now means: the branch has commits
   of its own AND their content has not landed outside `intentions/`.

**Out of scope for this unit:** every other gate, the `claude rm` step, the
tests (Unit 2), and any consumer file.

**Recommended model:** opus.

### Unit 2 — Regression coverage for the strictly-behind shape

**Scope.** Two files:
`.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh` and one
comment line in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-node-reap.sh`.

Baseline before the change: `118/118 passed, 0 failed`.

1. **Extend the fixture factory — `test-lib-session-reap.sh:257-296`.** Add a
   `behind)` arm to `sr_worktree`'s `case`, and add `behind` to the function's
   `# sr_worktree <node-id> <clean|squash|content|intentions|dirty>` doc comment.
   The arm runs AFTER the `git worktree add` at line 266, and must advance
   `origin/main` past the worktree's HEAD. This needs a SECOND `update-ref`:
   `sr_setup` pins `refs/remotes/origin/main` once, as a static snapshot, before
   any worktree exists (`test-lib-session-reap.sh:96`), and there is no real
   remote to fetch from. Commit on `$SR_REPO` (its primary checkout is on
   `main`), touching a path OUTSIDE `intentions/` so the `':!intentions'`
   carve-out does not neutralize the diff:

   ```sh
       behind)
         # Zero commits of its own, several commits BEHIND origin/main — the
         # normal resting state of a fleet worktree. The two-dot diff renders
         # main's own newer content as deletions; the ahead-count arm must see
         # through that. origin/main is a static snapshot taken in sr_setup, so
         # move it forward explicitly after the worktree was cut.
         for i in 1 2 3; do
           printf '%s\n' "$i" > "$SR_REPO/main-only.txt"
           "$REAL_GIT" -C "$SR_REPO" add -A
           "$REAL_GIT" -C "$SR_REPO" commit -q -m "main advances $i"
         done
         "$REAL_GIT" -C "$SR_REPO" update-ref refs/remotes/origin/main HEAD
         ;;
   ```

   Mirror the `squash)` arm's comment style
   (`test-lib-session-reap.sh:282-286`), which states the property the fixture
   proves. Keep the git side REAL, per the file's header mandate
   (`test-lib-session-reap.sh:5-11`) — no shimming of `rev-list`.

2. **Sweep-level regression test.** Add after Test 9
   (`test-lib-session-reap.sh:503-526`), using that block's exact call sequence
   (`sr_setup` / `sr_worktree` / `sr_job` / `sr_transcript` / `sr_add_session` /
   `sr_install_registry` / `sr_run` / `assert_eq` / `sr_teardown`) and a header
   comment naming the defect. Use fresh, unused ids (e.g. node tactic-behind,
   job `7777aaaa`, sid `07b1-1111`). Assert, in order:
   - the fixture really is 0 ahead:
     `"$REAL_GIT" -C "$SR_WTROOT/tactic-behind" rev-list --count origin/main..HEAD` is `0`;
   - the fixture really is behind:
     `"$REAL_GIT" -C "$SR_WTROOT/tactic-behind" rev-list --count HEAD..origin/main` is `3`;
   - `SR_RC` is `0`;
   - `sr_contains 'SESSION_REAPED: name=tactic-behind'` is `yes`;
   - `sr_contains 'SESSION_REAP_SKIP_UNLANDED_CONTENT'` is `no` — **this is the
     assertion that fails before Unit 1**;
   - the worktree is gone from disk.

3. **Direct-call regression test.** Add alongside the `session_reap_node` block
   (`test-lib-session-reap.sh:756-830`), using `srn_run`
   (`test-lib-session-reap.sh:751-754`): a `behind` worktree yields token
   `reaped`, not `skip-unlanded-content`.

4. **Fail-closed test — an unreadable `origin/main` never reaps.** New test:
   `sr_worktree "tactic-noref" clean`, then delete the ref
   (`"$REAL_GIT" -C "$SR_REPO" update-ref -d refs/remotes/origin/main`), then
   `srn_run`. Assert the token is `skip-diff-error`, the worktree survives, and
   `sr_rm_calls` is `0`. This pins that an unknown ahead-count cannot reach a
   reap.

5. **Prove the tests are real regression tests before committing.** Locally
   revert only the Unit-1 gate hunk (e.g. `git stash` the working tree, or edit
   the `if [[ "$ahead" == "0" ]]` condition to `false` in a scratch copy), run
   the suite, and confirm the two new behind tests FAIL with
   `SESSION_REAP_SKIP_UNLANDED_CONTENT`; then restore and confirm green. Do NOT
   commit a red state — every commit on the branch stays green.

6. **Stale count reference.** `test-dispatch-node-reap.sh:4` hardcodes
   "118 cases" when describing this suite. Update it to the new total printed by
   `report_results`.

**Out of scope for this unit:** any change to `lib-session-reap.sh`; any change
to `dispatch-test-fixture.sh`; new assertion helpers (`sr_contains`,
`sr_line_of`, `sr_rm_calls` at `test-lib-session-reap.sh:309-328` suffice).

**Dependencies:** Unit 1.

**Recommended model:** sonnet.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:323-343` — the
  existing content-diff block. EXTEND into a disjunction; the diff branch, its
  two log strings, and its three-way `case` are preserved verbatim.
- `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:96-108` — the
  header's "why a content diff, not a commit count" doctrine. EXTEND, never
  replace: the squash-merge rationale stays true.
- `.claude/skills/dispatch-propagate/scripts/dispatch-resolve-worktree:120` —
  `rev-list --count "origin/${pr_head}..${wt_branch}"`, the codebase's proven
  spelling of exactly this ahead-count. Reuse the idiom rather than inventing
  one.
- `.claude/skills/dispatch-propagate/scripts/assert-node-fresh:11` — uses
  `rev-list --count HEAD..origin/main`, the OPPOSITE direction. Do not transpose
  the arguments when copying the idiom.
- `.claude/skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh:62,106-118`
  — `worktree_in_sync` / `worktree_merged_in_sync`. Confirmed NOT reusable and
  NOT to be modified: the first is the reachability gate this file's header
  explicitly rejects for the squash-merge reason; the second is a whole-tree
  identity gate with no way to express the `:!intentions` carve-out.
  `worktree_merged_in_sync`'s structure is still the stylistic template for the
  new branch.
- `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:270-291` —
  `$wt_path`, `$branch`, `$name`, `$sid`, `$log_file`, `$log_tag` are all
  already in scope at gate 7b. No new `DISPATCH_SESSION_REAP_*` env seam is
  needed.
- `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:206-215` —
  `_lsr_log`, for the new `SESSION_REAP_NOTHING_AHEAD` line.
- `.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh:257-296` —
  `sr_worktree`, the fixture factory to extend with a `behind` arm.
- `.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh:503-526` —
  Test 9's block structure, the direct template for the new sweep-level test.
- `.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh:309-328,
  751-754` — `sr_contains`, `sr_line_of`, `sr_rm_calls`, `srn_run`. Sufficient;
  add no new helpers.

## Verification

Run the owning suite; it must go from `118/118` to the new total with zero
failures:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh
```

The CLI wrapper and the sweep wiring must stay green (the sweep's summary
counters and `dispatch-node-reap`'s token passthrough both observe this gate):

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-node-reap.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-sweep.sh
```

The full shell-test sweep CI runs:

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh
```

Prose-rule lint over the net-new lines in the committed `.sh` files:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

**Manual / judgment checks.**

- *Read the diff for the pure-widening property.* Confirm by inspection that no
  path which reaches `claude rm` today can now reach a skip: the diff branch is
  moved, not edited, and the only new exit from arm 1 is into the reap path.
- *Prove the regression test bites.* Per Unit 2 step 5, run the suite once with
  the Unit-1 short-circuit disabled locally and confirm the two behind tests fail
  on `SESSION_REAP_SKIP_UNLANDED_CONTENT`. A test that passes both before and
  after is not covering this defect.
- *Observe in production (post-merge, needs-main).* On the next sweep after the
  fix lands, grep the dispatch sweep log for `SESSION_REAP_NOTHING_AHEAD` and
  confirm at least one previously-stuck 0-ahead worktree is reaped, and that
  `SESSION_REAP_SKIP_UNLANDED_CONTENT` no longer repeats on the same node every
  ~15 minutes. Note this arm only fires for a session that already passed the
  terminal-marker gate (gate 4), so a quiet fleet may show nothing — absence of
  the line is not evidence of failure.
- *Spot-check a real behind worktree read-only* before merging: pick any
  0-ahead-and-clean worktree under `.claude/worktrees/` and confirm
  `git -C <wt> rev-list --count origin/main..HEAD` is `0` while
  `git -C <wt> diff --quiet origin/main HEAD -- . ':!intentions'` exits `1`.
  That pairing is the defect; the fix makes the first probe decide.

## Explicitly out of scope

- The `claude rm` decline that follows a successful gate pass — owned by
  `tactic-self-close-reap-silent-noop`.
- The worktree-path derivation at `lib-session-reap.sh:291`
  (`/align-tactics` sessions provisioned at `align-tactics-<suffix>` while
  registering under the bare node id, so the sweep targets the wrong directory)
  — a separate, independently confirmed defect, also recorded on
  `tactic-self-close-reap-silent-noop`.
- The job-dir-keyed authorization gates 3 and 4 — owned by
  `tactic-session-reap-authorization-durability`.
- The terminal-marker requirement (gate 4 / Invariant 2) — deliberately
  unchanged. Declaration governs WHETHER a reap is attempted; this gate governs
  whether an attempted reap is SAFE.
- `.claude/skills/dispatch-invalid-state/SKILL.md:163`, which routes
  `skip-unlanded-content` to an `author-required` park. Its text stays correct
  and needs no edit — the fix only removes the false-positive population feeding
  that route.
- `worktree_in_sync` / `worktree_merged_in_sync` in `lib-worktree-in-sync.sh` —
  not modified, for the reasons in ## Reuse.
- The durability of the `worktree_has_live_session` freeze that contains an
  undeclared pass — owned by `tactic-claim-containment-durable-anchor`.

## Sibling worth citing

`tactic-graph-commit-noop-shortcircuit-head-behind` carries the same
strictly-behind theme in `graph-commit`: a HEAD behind `origin/main` misread as a
state to act on. Same root shape (a symmetric comparison mistaken for a
directional one), different subsystem; neither node subsumes the other.
