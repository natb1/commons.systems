---
id: tactic-graph-auto-merge-behind-arm-out-of-band
kind: tactic
statement: Split compare status `behind` out of graph-auto-merge's shared
  behind|diverged sync arm into its own visible hold — `held <id>
  (already-landed)`, spending no update-branch mutation — because a PR head that
  is already an ancestor of main has nothing to sync toward, the sync cap cannot
  bound it, and no sweep in the repo owns that state; then re-pin test n2 to the
  chosen behaviour and reconcile the ladder driver's stale behind/synced prose
owner: ai
status: codified
parent: null
rationale: "Raised by the second /code-review high round on PR #3073 and filed
  2026-08-13 with the reviewer's failure model already corrected: the behind arm
  does not make the ladder throw, and there is no per-tick error. Finalized
  2026-08-20 by an /align-tactics per-node round that measured the shipped code
  and disproved two further claims the node carried, so the plan is built on the
  corrections rather than on the filing. (1) The filed body asserted BOTH that
  an out-of-band-landed PR is silently skipped at the mergeable gate AND that
  the path spends a wasted update-branch call. Those are mutually exclusive —
  the mergeable == MERGEABLE gate (graph-auto-merge:344-345, not :341-342 as
  filed) continues the enclosing while before the compare at :399 ever runs —
  and which one occurs turns on what GitHub REST reports for .mergeable on an
  OPEN PR whose head is already an ancestor of its base, which is not
  determinable from this repo. The plan therefore takes a reading that is
  correct under both: under the reachable reading the new arm is live, under the
  unreachable one it is dead-but-correct and the case belongs to the conflict
  lane (clarification 85). (2) The shipped in-arm comment's claim that
  reconcile-graph-merged absorbs the already-merged case on a later tick is
  FALSE as written: that reconciler admits only CLOSED|MERGED and no-ops on OPEN
  (reconcile-graph-merged:176-190), and reconcile-graph-review-stall reads a
  still-OPEN green PR as healthy, so nothing in the repo owns an OPEN-but-behind
  PR. What is open is therefore narrower than the review claimed and broader
  than the filing recorded: observability (the router can name this state
  exactly and discards that knowledge) plus boundedness (the sync cap counts
  update-branch merge commits, which a behind head never produces, so the
  escalation can never fire). The chosen answer is a visible hold rather than a
  silent skip, because whether an out-of-band landing is the node's complete
  intended change is a question no script here can answer. The greenfield
  alternative — widening the absorber to admit an ancestor-of-main head and
  close the empty PR — is recorded in the plan body as separate, author-visible
  work, not built here. Severity stays low: a rare path by construction, since
  the owned merge path squash-merges and a squash never makes a head an ancestor
  of main."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
## Context

`graph-auto-merge` is the owned auto-merge gate
(`.claude/skills/dispatch-propagate/scripts/graph-auto-merge`, 525 lines at
`origin/main` f114df8c). Its last gate before merging is the up-to-date gate
(`tactic-graph-auto-merge-up-to-date-gate`, landed): it reads the live
`origin/main` tip once per sweep (`MAIN_SHA`, :309), compares it against the
PR head (`CMP=$(gh_commit_is_ancestor_rest "$MAIN_SHA" "$HEAD_OID")`, :399),
and branches on the four-way compare vocabulary in `case "$CMP"` (:408-503).

Today `behind` and `diverged` share one arm (:413-495). They are not the same
condition:

- **`diverged`** — main has commits the head lacks. The green CI verdict on
  that head ran on a stale base. Syncing (`gh_pr_update_branch_rest`, :487)
  merges main into the head, re-triggers CI on the fresh base, emits
  `synced #<pr> (<id>)` (:493), and defers the merge. Correct, bounded by the
  sync cap (:469-484).
- **`behind`** — the head is an *ancestor* of the main tip. Its commits are
  already on main; they landed out of band. There is nothing to sync toward
  and nothing to merge that main does not already contain.

### Read the corrected failure model first

This node was raised by the second `/code-review high` round on PR #3073 with
its failure model wrong. The wrong model is recorded here on purpose, so the
implementer does not go hunting for a crash that does not happen.

**What the review reported:** the `behind` arm makes the ladder throw every
tick.

**What actually happens:** it does not throw, and there is no per-tick error.
The arm takes the ordinary sync-and-defer path. Severity is **low** — a rare
path, no incorrect merge, no wedge. Reversing a tested behaviour was
explicitly out of PR #3073's scope, which is why this node was filed instead
of a patch.

Two further claims that were on this node as filed are **corrected here**, and
the plan below is built on the corrections, not on the originals:

1. The filed body asserted both that a `behind` PR is *silently skipped at the
   `mergeable` gate* **and** that it *spends a wasted `update-branch` call*.
   Those are mutually exclusive: the `mergeable == MERGEABLE` gate at
   **:344-345** `continue`s the enclosing `while` before the compare at :399
   ever runs. Which one occurs turns on what GitHub REST reports for
   `.mergeable` on an OPEN PR whose head is already an ancestor of its base —
   **not determinable from this repo** (`gh_pr_view_rest`, `lib.sh:1190-1245`,
   just maps REST's boolean `.mergeable` to `MERGEABLE`/`CONFLICTING`/
   `UNKNOWN`; there is no fixture and no recorded production observation).
   **The reading this plan takes:** plan the arm so it is correct under
   *both*. Under the reachable reading the change is live; under the
   unreachable reading the arm is dead-but-correct and the case is owned by
   the conflict lane instead (a not-`MERGEABLE` PR routes to
   `execution.conflict` per clarification 85 — a different owner, out of this
   node's scope). Nothing in the plan depends on resolving the ambiguity.
   Note the shipped test **does** exercise the arm: `gam_n_setup`
   (`test-graph-auto-merge.sh:534-548`) stubs
   `{"mergeable":true,"mergeable_state":"clean", ...}`, so in the harness the
   behind candidate passes the mergeable gate and reaches the compare.
2. The shipped in-arm comment (:414-418) says `reconcile-graph-merged`
   "absorbs the genuinely-already-merged case on a later tick". **That is
   false.** `reconcile-graph-merged:176-190` admits only `CLOSED|MERGED`;
   `OPEN) : ;;` is an explicit no-op ("nothing to reconcile"), keyed purely on
   PR state, never on compare status. An OPEN-but-`behind` PR is invisible to
   it. `reconcile-graph-review-stall` does not own it either (its header,
   :23-36, states a still-OPEN PR with no regression is a no-op). **No sweep
   in the repo owns this state today.**

### What is genuinely open

Narrower than the review claimed, and worth doing on its own terms.

**Observability.** The router can name this state *exactly* — it holds the
compare status — and then discards that knowledge. A silent skip, or a
`synced` line that misdescribes what happened, is indistinguishable to an
operator from ordinary ineligibility. The one case where the system knows
precisely why it is not merging is the case where it says least.

**Boundedness.** The sync cap (:469-484) counts multi-parent commits whose
subject starts with `Merge branch 'main'` — GitHub's update-branch form. That
count is the gate's own footprint. For a `behind` head the sync makes no
progress the cap can measure: whatever GitHub's update-branch does to a head
that is already an ancestor of base (a fast-forward, or nothing), it adds no
such merge commit, so `SYNC_COUNT` stays put. The `behind` path is therefore
**outside the escalation the sync cap exists to provide** — potentially a
per-tick REST mutation forever, with no hold and no person ever called.

### Design

**Greenfield (ideal, stated on its own terms).** `behind` means the node's
code is on main; the lifecycle's correct next state is the post-merge absorb,
not another merge. The ideal split of responsibility keeps each script's
discipline intact:

- `graph-auto-merge` **declines visibly** on `behind`, spending no mutation.
  It only merges or declines; it never routes (the one-gate invariant,
  clarification 198, extended by 225 — a withheld node is not merge-eligible
  whatever the form of the withholding, and a fifth predicate must sit *inside*
  the single admission decision, not beside it).
- `reconcile-graph-merged` — already the named absorber of out-of-band merges
  — **widens its landed predicate** from "PR state is `CLOSED|MERGED`" to
  "`CLOSED|MERGED`, or the PR head is an ancestor of `origin/main`", absorbing
  the node through the existing `reconcileMergedPhase` /
  `reconcileClosedPhase` decision functions
  (`packages/intentionsutil/src/transitions.ts:361,366`) and closing the
  now-empty PR.

**Why this node does not build the second half.** The widening costs a compare
call per OPEN candidate on every reconciler sweep (or a local-object fetch to
avoid it), and it changes the absorber's admission — a decision about REST
spend and about whether an unaudited out-of-band landing should advance a node
to `done` without anyone looking. That is a separate, author-visible change
with its own idempotency questions, and it is not needed to remove the defect
this node names. It is recorded above so whoever picks it up files it as its
own node rather than re-deriving it.

**What this node ships (the first half, independently valuable).** Split
`behind` into its own arm that emits `held <id> (already-landed)` and spends
no `update-branch` PUT.

The `held` verdict is deliberately reused rather than a fourth stdout token
being invented, and the consequences are chosen, not accidental:

- **It answers the closure question.** A skip that merely goes quiet would
  strand the node at `phase: review` with no actor to close it (nothing owns
  the state — see the correction above). A `held` verdict names the closer: a
  person. That is the same rationale the sync-cap hold already carries in this
  file — "a hold, not a silent skip, because a thrashing PR needs a person" —
  and it is the honest one here, because *how* the commits landed out of band,
  and whether the landing is the node's complete intended change, is a
  question no script in this repo can answer.
- **It needs no consumer code change.** `dispatch-ladder-run:1136-1139` greps
  `^held <NODE_ID> ` for *any* reason and `halt 11 throw`s. That halt is the
  intended routing: a person's call, never retried in the driver. The two tick
  callers (`dispatch-select-tick:518-523`, `dispatch-tick:649-657`) are
  token-agnostic passthroughs that prefix every line with `merge: `, so the
  hold surfaces as `merge: held <id> (already-landed)` with no change there.
- **It needs no new log.** Clarification 196 rejected duplicating skip reasons
  into a second home; `graph-auto-merge` writes no journal and communicates
  only through stdout and stderr, and this change keeps it that way.
- **Repeat-hold escalation is already owned elsewhere.**
  `intentions/tactic-graph-auto-merge-office-hours-hold-observability.md`
  (draft, `phase: null`) owns surfacing held counts to the tick alarm and
  escalating a node held across many consecutive ticks. That generic machinery
  covers a repeated `already-landed` hold. **Do not absorb or restate its
  scope here.**

**The trade, stated plainly.** If GitHub's `update-branch` on a behind head
fast-forwards it to the main tip, today's path *accidentally* terminates: the
next tick reads `identical`, an empty-diff squash merges, and the absorber
advances the node. This change replaces that with a person's call. That is a
deliberate choice — advancing a node to `done` off an empty squash of an
unaudited out-of-band landing asserts more than the evidence supports — and no
recorded clarification rules the direction. If the author prefers automatic
absorption, the greenfield above names exactly what to build instead; it is a
different, larger change to the absorber, not a tweak to this arm.

**Not racing a sibling.** As of 2026-08-20 the gate-predicate tactics named in
clarifications 198/225 have all landed (`-up-to-date-gate`, `-blocked-by-gate`,
`-main-health-gate` at `phase: done`; `-office-hours-gate` at `main-qa`), so
this node opens no third racer on the gate surface.

---

### Unit 1 — Split `behind` out of the sync arm and hold it

**Scope.** `.claude/skills/dispatch-propagate/scripts/graph-auto-merge` only.
Locate every site by symbol; the line numbers below were measured at
`origin/main` f114df8c and will drift.

1. In `case "$CMP"` (:408-503), insert a new arm **before** the existing
   `behind|diverged)` arm, and narrow that arm's pattern to `diverged)`:

   ```sh
       behind)
         # The head is an ANCESTOR of the live main tip: every commit on this
         # PR is already reachable from main. It landed out of band (a
         # fast-forward, a hand-push, or a merge this gate did not make) —
         # this gate squash-merges, and a squash never makes a head an
         # ancestor of main, so it cannot be our own footprint.
         #
         # Not a sync case. There is nothing for update-branch to move the
         # head toward, and the sync cap below cannot bound it either: the cap
         # counts `Merge branch 'main' into <ref>` commits, and syncing a head
         # that already contains main adds none, so SYNC_COUNT never advances
         # and the escalation never fires. Spending a REST mutation per tick
         # forever, silently, is the failure that shape produces.
         #
         # Not an absorb case either, contrary to what this arm's comment used
         # to claim: reconcile-graph-merged admits only CLOSED|MERGED
         # (reconcile-graph-merged:176-190, `OPEN) : ;;`), so a still-OPEN
         # behind PR is invisible to it. NOTHING in this repo owns this state.
         #
         # So HOLD, with the reason named. Same posture as the sync cap: a
         # hold rather than a silent skip, because whether the out-of-band
         # landing is this node's complete intended change is a question no
         # script here can answer. dispatch-ladder-run halts 11 on any `held`
         # line; the tick callers pass it through as `merge: held ...`.
         echo "held $id (already-landed)"
         continue
         ;;
   ```

2. Delete the `behind:` bullet from the (now `diverged)`) arm's leading
   comment at :414-418 — the three lines beginning `# behind: the head is an
   ancestor of the main tip` — so the arm describes only the condition it
   still handles. **Leave the rest of that arm byte-identical**, including the
   `--expected-head-sha` CAS prose, the entire sync-cap block (:439-484), the
   `gh_pr_update_branch_rest` call (:487) and `echo "synced #$pr ($id)"` (:493).

3. Do **not** touch the `ahead|identical)` arm (:409-412) or the fail-closed
   `*)` default arm (:495-501).

4. Update the header's up-to-date-gate prose (the block at :80-95). The
   sentence "`behind`/`diverged` SYNCS instead of merging" is now wrong.
   Replace it so `diverged` syncs and defers, and `behind` — the head already
   an ancestor of main, i.e. landed out of band — HOLDS as
   `held <id> (already-landed)`, spending no mutation, because nothing in the
   repo owns that state and the sync cap cannot bound it.

5. Update the header's **Stdout protocol** block (:125-133), which is the
   single normative description of the contract. Add `already-landed` to the
   reason enum, which becomes: `office-hours`, `missing-stamp`, `scope-stale`,
   `sync-cap: <n> syncs`, `already-landed`. Leave the `merged #<pr> (<id>)`
   and `synced #<pr> (<id>)` lines and the "NOTHING for a plain skip"
   sentence unchanged.

**Out of scope.** No change to the `mergeable` gate (:344-345), the CI verdict
gate, the freshness gate, the office_hours gate, `reconcile-graph-merged`,
`reconcile-graph.ts`, `transitions.ts`, or any exit code. No new stdout token
beyond a new `held` reason. No new log file, journal, or metric. No PR close
and no graph write — this script still only merges or declines.
`.claude/skills/review-fix/references/node-lane.md:37-42` describes a
not-up-to-date branch being synced in colloquial English (it is describing the
`diverged` case); leave it unchanged.

**Recommended model.** sonnet

---

### Unit 2 — Re-pin test n2 deliberately, and prove the sync cap is not spent

**Scope.** `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh`
only (777 lines; the n-series is :529-620).

Test **n2** (:569-580) currently asserts a `behind` branch emits
`synced #116 (tactic-n)`. It is a deliberate pin of the old behaviour, and per
`.claude/rules/test-integrity.md` it is **updated deliberately to encode the
newly-chosen behaviour — never relaxed, skipped, or deleted to make a change
pass.**

1. Rewrite the n2 block in place. Keep `gam_n_setup behind` and `run_gam`
   verbatim; change only the comment and the assertions:
   - stdout is exactly `held tactic-n (already-landed)`
   - exit 0
   - `$GAM_ROOT/stub/merge-calls.log` is **absent** (no merge PUT) — keep the
     existing `if [[ -f ... ]]` / `assert_eq` shape used at :577-579
   - `$GAM_ROOT/stub/update-branch-calls.log` is **absent** (this is the new
     assertion: no sync mutation is spent), mirroring the n3 shape at :587-588
2. Add a case **n2b** immediately after, proving the sync-cap listing is not
   spent either — the assertion that pins "behind never enters the cap block".
   Reuse the existing stub knob: `gam_n_setup behind`, then
   `touch "$GAM_ROOT/stub/pr-commits-fail"`, then `run_gam`. Assert stdout is
   still exactly `held tactic-n (already-landed)` and exit is still **0**. (If
   the arm reached the cap, `gh_api_array` on `pulls/116/commits` would fail,
   producing the `could not list commits` stderr line, `HARD_ERROR=1` and exit
   1 — so a clean exit 0 is proof the listing was never attempted.)
3. Leave **n1** (`diverged`, :553-567), **n3** (`identical`, :582-590), **n4**
   (:592-601), **n5** (:603-612) and **n6** (:614-620) byte-identical — none
   of those arms change.
4. Update the section banner comment at :529-533 if it claims behind is
   synced.

**Out of scope.** No change to `gam_n_setup` (:534-548), `gam_reset` /
`run_gam` / `gam_fresh` (:195-214), the fake `gh` (:145-192) or the fake `node`
(:87-124) — the new case needs no new stub surface. No new test file: the
suite is already CI-discovered by `run-unit-tests.sh`'s
`for test_script in "$SCRIPTS"/test-*.sh` loop over
`.claude/skills/dispatch-propagate/scripts/`, so no wiring change is needed.

**Recommended model.** sonnet

**Dependencies.** Unit 1.

---

### Unit 3 — Reconcile the ladder driver's documentation and cover the new reason

**Scope.** `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` and
`.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`. No
behaviour change in the driver — its `^held $NODE_ID ` grep already matches
any reason.

1. `dispatch-ladder-run`, `reconcile_pass` header outcome table (:217-228).
   The `synced #N (<id>)` row asserts "The up-to-date gate found the PR
   **behind** origin/main and merged main INTO it instead" — now wrong for the
   compare status of that name. Reword it to describe the `diverged` case
   (main has commits the head lacks), and add a line to the `held <id> (...)`
   row noting `already-landed` — a PR whose commits are already on main — as
   one of the reasons that reach it.
2. `dispatch-ladder-run:1136-1139`, the `halt 11 throw` message. It enumerates
   "office-hours, a missing scope stamp and a stale scope" and **already omits
   `sync-cap`** — a pre-existing staleness this change should not extend.
   De-enumerate it rather than adding a fourth item: the halt text should say
   that a hold is a person's call and is never retried here, letting the
   grepped `held ...` line the message already interpolates carry the specific
   reason.
3. `dispatch-ladder-run:1144-1150`, the `^synced #` branch comment. Change
   "the PR was behind origin/main" to the `diverged` wording, matching (1).
   Leave the branch's code and `log_event` call unchanged.
4. `test-dispatch-ladder-run.sh`: add one case mirroring the existing
   office-hours hold test at :628-636 exactly — same `set_seq` /
   `assert_eq` shape — with `set_seq merge '0|held tactic-fixture-node
   (already-landed)'`, asserting exit 11, the absorb never reached, `state.json`
   status `halted`, and the lock released before halting. Leave the
   office-hours case itself unchanged.

**Out of scope.** No change to `dispatch-select-tick:518-523` or
`dispatch-tick:649-657` (token-agnostic `merge: ` passthroughs). No change to
`.github/workflows/unit-tests.yml` — `test-dispatch-ladder-run.sh` is already
wired there (:312-313). No change to the ladder's exit-code space or to
`dispatch-ladder-advance` / `-await`.

**Recommended model.** sonnet

**Dependencies.** Unit 1.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib.sh:1119-1156` —
  `gh_commit_is_ancestor_rest(base, head, [--repo])`. Already produces the
  four-way `ahead|identical|behind|diverged` vocabulary from GitHub's compare
  endpoint. The sensing is unchanged; only the handling of one value changes.
  No new `gh` wrapper is needed.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:483` — the
  existing `held $id (sync-cap: $SYNC_COUNT syncs)` line. Copy its shape
  exactly for the new hold: `echo "held $id (<reason>)"` then `continue`.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:125-133` — the
  Stdout protocol header block, the single normative home of the contract.
  Extend the reason enum there; do not describe the protocol anywhere new.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1136-1139` — the
  `^held $NODE_ID ` → `halt 11 throw` triage. Reason-agnostic by construction,
  which is why a new reason needs no driver code.
- `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh:534-548`
  (`gam_n_setup`), `:195-214` (`gam_reset` / `run_gam` / `gam_fresh`),
  `:145-192` (fake `gh`, including the `stub/pr-commits-fail` knob and the
  `update-branch-calls.log` / `merge-calls.log` recorders), `:87-124` (fake
  `node`). The complete rig for the up-to-date gate — extend the cases, add no
  fixture machinery.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh:16,41` —
  `assert_eq` / `assert_contains`, already sourced. Keep the existing
  `if [[ -f ... ]]; then x=present; else x=absent; fi` + `assert_eq` idiom
  (`test-graph-auto-merge.sh:577-579,587-588`) rather than a new assertion
  style.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:628-636`
  — the office-hours `held` → halt-11 case; the exact template for Unit 3's
  new case.

## Verification

The whole change is offline-testable; both suites are already CI-wired.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh
```

```verify
bash .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

Confirm the new reason reached the normative protocol doc, not just the code:

```verify
grep -q 'already-landed' .claude/skills/dispatch-propagate/scripts/graph-auto-merge
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/graph-auto-merge
```

Manual / judgment checks, not auto-runnable:

- **Read the diff of `case "$CMP"` and confirm the `diverged)` arm is
  otherwise byte-identical.** The sync cap, the `--expected-head-sha` CAS
  guard and the `synced` line must all still be reachable from `diverged`; the
  only structural change is the pattern narrowing and the new arm above it.
- **Do not attempt to reproduce the state in production.** `behind` requires a
  genuine out-of-band fast-forward, merge, or hand-push of a PR branch's own
  commits onto main; the owned path squash-merges, and a squash never makes a
  head an ancestor of main. Fabricating one to watch the hold fire would mean
  pushing a branch's commits to main out of band, which is exactly the thing
  the repo's direct-push restriction forbids. The harness case is the
  verification.
- **Observe-in-production (passive).** If the state ever occurs, it now shows
  as `merge: held <id> (already-landed)` in the tick log and as a `halt 11
  throw` naming that line in a `/dispatch-ladder` run's journal. Either is the
  signal that a person owes the node a decision (close the PR, or absorb the
  node by hand). A node held this way repeatedly is the concern of
  `tactic-graph-auto-merge-office-hours-hold-observability`, not of this node.
