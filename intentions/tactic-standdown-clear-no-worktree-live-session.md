---
id: tactic-standdown-clear-no-worktree-live-session
kind: tactic
statement: The stand-down sweep clears a marker whenever the node has no
  worktree, erasing the stand-down while a live session still holds the node
  name — rule (d) has already returned on n_live == 0 — silently re-creating the
  deadlock the protocol exists to remove; narrow that branch to a
  no-unpushed-work reason variant of the park, kind-agnostically, since both the
  strategy lane and the align-tactics rung spawn without a pre-provisioned
  worktree
owner: ai
status: codified
parent: null
rationale: "Filed 2026-07-31 by /review-fix on PR #2996
  (tactic-standdown-winner-liveness), classified Deferred (out of scope for that
  PR): the cleared-no-worktree branch in lib-standdown-recheck.sh drops the
  marker whenever <repo>/.claude/worktrees/<node> is missing, on the reasoning
  that no unpushed work is possible there. But rule (d) has already handled
  n_live == 0, so at that point at least one live session still holds the node
  name -- precisely the state rules (h)/(i) exist to surface. Finalized
  2026-08-19 by an /align-tactics tactic-mode round, which re-measured the
  finding against origin/main 24831933 and reconciled this node on three points.
  (1) The author ruling this draft asked for is NOT required: the rule line
  being deviated from is an /align-tactics-authored implementer note on
  tactic-standdown-winner-liveness (owner: ai, clarifications empty), and its
  direction is already forced by later-recorded doctrine -- strategy
  clarification 185 (every mechanical-tier gate fails toward keep/escalate,
  author-ratified 2026-08-04), clarification 204 (2026-08-05), and condition 10
  (the freeze must anchor on durable graph state). Both post-date the 2026-07-31
  rule table, making this a recorded-doctrine correction rather than an
  unrecorded premise. (2) The blast radius is wider than the original
  strategy-only framing: dispatch-graph-execute spawns BOTH kind == strategy AND
  the align-tactics rung with --cwd $PROJECT_ROOT and no pre-provisioned
  worktree, so a tactic-* node has the same no-worktree window; the fix is
  therefore kind-agnostic and no kind: parse is added. (3) A bare deletion of
  the branch is mechanically wrong -- worktree_in_sync and
  worktree_merged_in_sync both return 1 when git -C fails on a missing
  directory, so control would fall into rule (h) and park every no-worktree node
  with a false unpushed-work claim; the fix adds a third reason variant that
  makes no unpushed-work claim. Wiring the origin=declared producer stays with
  the separate raw sibling tactic-standdown-instruction-not-wired."
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

# The stand-down sweep's `cleared-no-worktree` branch erases a stand-down while a live session still holds the node name, silently re-creating the deadlock the stand-down protocol exists to remove

## Context

### Provenance

- **Source**: `/review-fix` on PR #2996 (`tactic-standdown-winner-liveness`), 2026-07-31, classified `Deferred` — a valid finding, out of scope for that PR.
- **Re-measured**: 2026-08-19 against `origin/main` `24831933`. Every `path:line` below was read at that commit; the original 2026-07-31 anchors (e.g. "line 619") had drifted and are superseded by the ones here.
- **Baseline**: `bash .claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh` → **95/95 passed, 0 failed** at `24831933`.

### The defect

`standdown_recheck_sweep` in `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh` walks a fixed rule ladder per marker; the ladder order is stated in the file's own header comment (lines 107–147) as "the correctness property".

- Rule **(d)** — `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:581-589` — `if (( n_live == 0 ))` → `standdown_clear`, `cleared-no-live-session`, `continue`. Nobody is holding the node, so there is nothing to surface.
- The **unlettered no-worktree branch** — `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:663-677` — runs *after* (d):

  ```sh
  local wt="$repo_root/.claude/worktrees/$node"
  if [[ ! -d "$wt" ]]; then
    standdown_clear "$node"
    cleared=$(( cleared + 1 ))
    printf 'lib-standdown-recheck: cleared-no-worktree %s (no worktree at %s)\n' "$node" "$wt" >&2
    _standdown_log_decision "$node" "$m_origin" "$m_winner" "$survivors" "" "cleared-no-worktree"
    continue
  fi
  ```

Because rule (d) already `continue`d on `n_live == 0`, **`n_live >= 1` is an invariant at line 669**: at least one live session is still registered under this node name, waiting on a winner that is gone. That is precisely the state rules (h)/(i) exist to PARK. The branch instead erases the only durable record of it, so the node returns to a silent stall with no office-hours escalation and no operator-visible evidence. Confirmed by reading the file, not inferred.

The branch's own comment justifies the clear as "no unpushed work is possible and nothing is held in a checkout". Only the first half is true. A missing worktree says nothing about whether the *node* is held — `n_live >= 1` says it is.

### Measured blast radius — WIDER than this node's original statement

The 2026-07-31 filing scoped the gap to `^strategy-` names. Measured at `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:205-215`, the no-pre-provision spawn condition is:

```sh
if [[ "$kind" == "strategy" || "$phase" == "align-tactics" ]]; then
  ... dispatch-spawn-job --no-verify --name "$id" --cwd "$PROJECT_ROOT" ...
```

So **both** the strategy lane **and** the frozen-tactic `align-tactics` rung spawn with `--cwd "$PROJECT_ROOT"` and no `provision-node-worktree` call — the session claims its own worktree. Every other phase pre-provisions (`dispatch-graph-execute:222-240`). A `tactic-*` node selected at the `align-tactics` rung therefore has the same no-worktree window as a `strategy-*` node, for the whole interval between spawn and the session's own worktree claim. And `claude_agents_list_duplicate_node_names` keys on `^tactic-|^strategy-` (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1457-1459`), so both kinds reach this sweep.

This plan's narrative supersedes the strategy-only framing in the node's `statement` and `rationale`: the strategy lane is the *worst* case, not the only one.

### Greenfield design

Building the ladder from scratch, **"does a worktree exist?" is not a ladder rule at all** — it produces no disposition of its own. It is an *input to the park's reason/recommendation selection*, sitting beside the two sync predicates at the (h)/(i) site:

- Rule (d) owns the one legitimate release: nobody holds the node → clear.
- Rules (h)/(i) own the park; the worktree's absence selects a third reason variant (`standdown-winner-dead-node-held-no-worktree`) that makes **no unpushed-work claim** and points the operator at the held session rather than at a path that is not on disk.
- The disposition set becomes: keep / clear-on-nobody-left / park (three reason variants) / defer-on-cap. No path releases a node that a live session still holds.

This is one-PR-sized and backwards-compatible: stand-down markers are ephemeral files under `tmp/dispatch-standdown/` with no schema change, `_standdown_log_decision`'s `disposition` field is a free-form string (`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:356-388`) with no enum to migrate, and grep confirms `cleared-no-worktree` has **no consumer outside this file and its own test**. **No brownfield migration path is warranted** — the greenfield design ships directly.

### Two alternatives, both rejected — read this before implementing

**(1) Bare deletion of the branch (fall straight through to (h)/(i)) — WRONG, mechanically.** `worktree_in_sync` and `worktree_merged_in_sync` both open with `git -C "$path" status --porcelain` and **`return 1` when it fails** (`.claude/skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh:50-55` and `:93-98`). On a missing directory `git -C` fails, so *both* predicates are false — exactly the rule (h) condition. A bare deletion would park every no-worktree node as `standdown-winner-dead-work-unpushed`, asserting stranded unpushed work in a worktree that does not exist, with a recommendation telling the operator to "push them from there FIRST" from a nonexistent path. The distinct reason variant is not cosmetic; it is what keeps the park honest.

**(2) Gate the clear on `kind == tactic` (read `kind:` from the already-fetched frontmatter) — WRONG, incomplete.** This appears in the gathered reuse evidence as a rival design. It fixes only the strategy lane and leaves the `align-tactics`-rung tactic window (measured above) wide open — a `tactic-*` node stranded before its own worktree claim would still be silently cleared. It also adds a frontmatter read and a kind-dependent branch to buy nothing: the correct predicate is already in hand (`n_live >= 1`), and it is kind-agnostic. Do **not** implement the kind gate; do not add a `kind:` parse to this file.

### The author-ruling question this draft was filed to ask — RESOLVED from recorded doctrine

The 2026-07-31 filing asked whether changing the rule is a "deliberate deviation" from `tactic-standdown-winner-liveness`'s shipped rule table needing a fresh author sitting. It is not. The serving strategy's own later-recorded doctrine already decides it:

- Clarification **185** (recorded 2026-08-04, author-ratified) ratifies, for the invalid-state lane, that **every mechanical-tier gate fails toward keep/escalate**. The `cleared-no-worktree` branch is a mechanical gate that fails toward *release*.
- Clarification **204** (2026-08-05) restates it: "on any uncertainty about which session to stop, nothing is stopped and the case escalates."
- Condition 10 (router failure containment) holds only where "the freeze must anchor on **durable graph state** rather than on a process-level session registry". The stand-down marker plus the park it produces are that durable anchor; erasing the marker while the holder is live destroys the evidence and reproduces the silent re-iteration the condition exists to prevent.

Both clarifications post-date the 2026-07-31 rule table. This is therefore a **recorded-doctrine correction to a shipped rule table**, not an unrecorded premise — the change proceeds without a fresh sitting.

### Explicitly out of scope

- `.claude/skills/dispatch-propagate/scripts/dispatch-standdown` (the at-decision liveness re-check and its winner-absent exit 3) — a different surface.
- **Wiring the `origin=declared` producer.** Today only the `observed` path is reachable in production: Step 0 of the sweep writes its own markers (`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:426-429`), while `dispatch-standdown` has no caller in any live worker skill. That gap is the separate raw sibling node **`tactic-standdown-instruction-not-wired`** (`phase: null`, filed by the same 2026-07-31 `/review-fix` pass); do **not** absorb it. The fix below must be correct on *both* origins, since both converge on the same branch — and the unit tests exercise the `declared` origin directly via `standdown_write`, so the fix is covered ahead of that sibling landing.
- `lib-frozen-session-park.sh` and `lib-worktree-in-sync.sh` — read-only dependencies.
- **Graph writes of any kind.** In particular `intentions/tactic-standdown-winner-liveness.md:396` still documents the old rule in a `phase: done` node body; that is a historical record of what shipped and is not edited by this work.

## Unit 1 — Narrow the no-worktree branch from a release to a reason variant, and invert its test

### Scope

Two files change. Nothing else.

**A. `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh` — the branch (currently lines 663–677).**

Replace the clear-and-`continue` with a flag computation. The `wt` path derivation itself is unchanged (it must still be computed here, because the (h)/(i) reason and recommendation strings interpolate it):

```sh
# Worktree path, DERIVED (never read from the daemon), mirroring
# dispatch-graph-execute's CONFLICT_WT composition. A MISSING directory means
# no unpushed work is possible — it does NOT mean the node is free: rule (d)
# has already returned for n_live == 0, so at this point at least one live
# session still holds the node name. Two lanes never pre-provision a worktree
# at all (dispatch-graph-execute: kind == strategy, and the align-tactics
# rung of the tactic lane both spawn with --cwd "$PROJECT_ROOT"), so
# "no worktree" is a NORMAL state for a genuinely stranded node. It therefore
# selects the no-unpushed-work REASON VARIANT below and skips the sync
# predicates (both fail on a missing dir and would be misread as "unpushed").
# It never clears: clearing here would erase the only durable record of a
# stand-down whose holder is still live.
local wt="$repo_root/.claude/worktrees/$node"
local no_wt=0
[[ -d "$wt" ]] || no_wt=1
```

Rule (g), the park cap (currently lines 678–685), stays exactly where it is and is now reached by no-worktree markers too — intended: a no-worktree park consumes cap budget like any other and is `deferred` when the cap is spent.

At the (h)/(i) site (currently lines 686–707), add the variant as the **first** arm so the sync predicates are never called on a missing directory:

```sh
local unpushed_flag reason_tag reason recommendation unpushed_head="" rec_wt_clause
if (( no_wt )); then
  unpushed_flag="false"
  reason_tag="standdown-winner-dead-node-held-no-worktree"
  printf -v reason \
    'standdown-winner-dead-node-held-no-worktree: a session stood down for this node in favour of winner session %s, which is no longer registered with the Claude daemon. No worktree exists at %s — this node lane spawns without one (strategy nodes and the align-tactics rung claim their own), so NO work can be unpushed — but the node is still held by session(s) %s waiting on a session that no longer exists, so nothing will advance it without intervention.' \
    "${m_winner:-(unattributed — observed duplicate, no winner declared)}" "$wt" "${survivors:-none}"
elif ! worktree_in_sync "$wt" && ! worktree_merged_in_sync "$wt"; then
  ... existing standdown-winner-dead-work-unpushed arm, verbatim ...
else
  ... existing standdown-winner-dead-node-held arm, verbatim ...
fi
```

The `recommendation` string (currently line 707) stays **one shared template**; only its worktree sentence is interpolated, so the two-branch duplication of that long prose is avoided:

```sh
if (( no_wt )); then
  rec_wt_clause="No worktree exists at $wt, so no unpushed work is at risk — do NOT create one."
else
  rec_wt_clause="If the worktree at $wt has unpushed commits, verify them and push them from there FIRST."
fi
recommendation="Find the holding job with 'claude agents --all' and attach it ('claude attach <job-id>') to see where it stopped. $rec_wt_clause To release the holding session use 'claude stop <job-id>' — NEVER 'claude rm', ...<rest of the existing string verbatim, through the accepted-residual sentence>..."
```

The whole park tail below it (currently lines 709–762) — the `"$park_node" "$node" "$reason" "$recommendation"` call, the mandatory re-fetch, the `verify-landed --no-fetch -C "$repo_root" --node "$node" --jq '.office_hours != null'` landed confirmation, and the `parked` / `park-not-landed` / `park-failed` `_standdown_log_decision` calls — is already keyed only on `$reason_tag` / `$reason` / `$recommendation` / `$unpushed_flag`. **Change none of it.** The new variant simply falls into it, and gets its stderr line for free.

`standdown_clear` remains called from exactly one place in the ladder: rule (d).

**B. Same file — the rule-ladder header comment (currently lines 107–147).** This file's convention is that the header ladder is the authoritative contract, with a matching bullet per rule; it must change in the SAME commit. Required content:

- Delete the unlettered `-` bullet at lines **133–135** ("worktree directory missing → clear the marker, `cleared-no-worktree`, next…"). The `cleared-no-worktree` disposition ceases to exist.
- Replace it with an unlettered bullet in the same slot stating: worktree directory missing → **no clear**; it selects the no-worktree reason variant of the park below and skips both sync predicates (which fail on a missing directory and would be misread as "unpushed"). State the invariant that makes this correct: rule (d) has already returned on `n_live == 0`, so a marker reaching this point is held by at least one live session. Name the two lanes that never pre-provision (`kind == strategy`, and the `align-tactics` rung).
- Extend the (h)/(i) description so the park's reason tags read as three, not two: `standdown-winner-dead-work-unpushed`, `standdown-winner-dead-node-held`, `standdown-winner-dead-node-held-no-worktree`.

**C. `.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh` — invert Test 15 and add two cases.**

- **Invert Test 15** (currently lines 712–727, "a marker whose node has no worktree is cleared"). Its fixture is already exactly the defect scenario: `sd_write_node "tactic-no-worktree" unparked`, `sd_add_session "0bb2-2222" "tactic-no-worktree"` (a **live** holder), `standdown_write "tactic-no-worktree" declared "0aa1-1111" ...` (a winner never registered, i.e. dead), and no `sd_write_worktree` call. Keep the fixture; rewrite the title and all three behavioural assertions:
  - `sd_park_calls` is **1**, not 0 (line 723 inverts).
  - the marker is **kept**, not removed (lines 724–725 invert; the park tail never clears the marker — rule (f)'s `already-parked` keeps it on the next pass).
  - `sd_park_reason` carries `standdown-winner-dead-node-held-no-worktree` (line 726's `cleared-no-worktree` stderr assertion is replaced).
  - add an assertion that stderr does **not** contain `cleared-no-worktree`.
  - **Test integrity**: this is an intentional contract inversion carried by a rule-table change, not a weakened test. The test stays enabled and the assertion count does not shrink.
- **New case — the clear path was narrowed, not removed.** Copy the rule-(d) fixture at lines 504–518 (the tactic-nobody-left fixture) but omit its `sd_write_worktree` call: node fixture + `sd_commit_nodes` + `sd_add_session "0cc3-3333" "tactic-some-other-node"` (a session under a *different* name — required, because a fully empty registry is treated as UNKNOWN by the uncorroborated-empty guard and would park nothing) + `sd_install_claude 0` + `standdown_write <node> declared "0aa1-1111" ...`. Assert: `sd_park_calls` is 0, the marker is removed, and stderr reports `cleared-no-live-session <node>`.
- **New case — the motivating strategy-lane scenario end to end.** `sd_write_node` currently hardcodes `kind: tactic` in all three of its variants (lines 168, 188, 205). Add a **fourth variant** (or an optional third `kind` parameter defaulting to `tactic` — the implementer's call; do not change the existing three call signatures) emitting `kind: strategy`. `validateNode` (`packages/intentionsutil/src/schema.ts:960-1000`) treats `kind` as any non-empty string and makes `success_signal` optional, so a strategy fixture passes the real `verify-landed` strict read the fake `park-node` triggers. Then mirror the inverted Test 15 on a `strategy-*` node id, asserting the same no-worktree park.
- **Tighten the latent false-pass in Test 3** (lines 384–388). Its reason-tag check is `case "$(sd_park_reason)" in standdown-winner-dead-node-held*)` — a prefix glob the **new** tag also matches. Change it to `standdown-winner-dead-node-held:*` (the reason string is `<tag>: <prose>`), so the two tags can never be confused. This is a strengthening; Test 3's fixture is unchanged and it must still pass.
- Reuse the existing harness verbatim: `sd_setup` / `sd_write_node` / `sd_commit_nodes` / `sd_add_session` / `sd_install_claude` / `standdown_write` / `sd_run` / `sd_park_calls` / `sd_park_reason` / `sd_marker_field` / `sd_contains` / `sd_log_dispositions` / `sd_teardown`. **No new test infrastructure** beyond the `sd_write_node` kind variant.

### Out of scope for this unit

Everything under "Explicitly out of scope" above. Additionally: do **not** add a `reason_tag` field to `_standdown_log_decision`'s JSONL record — the new variant is distinguished in stderr by its tag and in the log by `disposition: "parked"` with `unpushed: false`, the same as the existing node-held park. Widening the decision-log schema is a separate concern with its own consumers.

### Recommended model

`opus` — the change is a correctness edit to an ordered rule ladder whose own header calls the order the correctness property, with a fail-safe posture to preserve and a live-predicate invariant (`n_live >= 1`) that must not be re-derived incorrectly.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:686-707` — the `reason_tag` / `printf -v reason` / `recommendation` construction shape. Clone the `standdown-winner-dead-node-held` arm's structure for the new variant; do **not** invent new prose conventions.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:709-762` — the `park_node` call, the mandatory post-park fetch, the `verify-landed` landed confirmation, and the `parked` / `park-not-landed` / `park-failed` bookkeeping. Reason-agnostic already; fall into it unchanged.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:536-537` — `survivors="${live_sids[$node]:-}"` and `n_live="${live_count[$node]:-0}"`, computed once per marker. The fix needs **no** new liveness query: neither `worktree_has_live_session` nor `claude_agents_list_duplicate_node_names` is called again.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:356-388` — `_standdown_log_decision`; free-form `disposition` string, `<unpushed>` is `"true"`/`"false"`/empty. No change needed.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:544-547` — the file's convention for a defensive edge check that keeps-and-logs rather than proceeding on bad input. The posture to preserve.
- `.claude/skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh:38-98` — `worktree_in_sync` / `worktree_merged_in_sync`. Read-only; the reason this fix must branch *before* calling them.
- `.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh:104-267` — the full fixture toolkit (`sd_write_node`, `sd_write_park_node`, `sd_add_session`, `sd_install_claude`, `sd_commit_nodes`, `sd_write_worktree`, `sd_write_transcript`, `sd_run`, `sd_contains`, `sd_park_calls`).
- `.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh:371-389` — Test 3, the model for a park-disposition assertion.
- `.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh:503-518` — the rule-(d) clear test, the model for the new `n_live == 0` + no-worktree case (note its `sd_add_session` under a *different* node name).
- `packages/intentionsutil/scripts/office-hours-graph:173-201` — `node_kind_on_main()`, whose doc records the invariant this defect turns on ("Only a TACTIC node has a worktree… a strategy node has no worktree, no PR"). Cited as the reason the fix must be kind-agnostic; **not** sourced or mirrored, since the corrected design reads no `kind:` at all.

## Verification

Run the suite that owns this file. It is auto-discovered in CI: `run-unit-tests.sh` sets `RUN_PR_SCRIPTS=true` for any change under `.claude/skills/dispatch-propagate/scripts/*` (`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88`) and then runs every `test-*.sh` in that directory (`:186-200`). Baseline at `24831933` is **95/95 passed, 0 failed**; after this unit the count must be **higher** (Test 15's assertions are rewritten in place and two cases are added), never lower.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh
```

The full dispatch-scripts lane exactly as CI runs it:

```verify
bash .claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

The contract change itself — the first assertion fails today because the tag does not exist; the second and third fail today because the string is present in both files.

**Every non-final statement gates its own exit.** `dispatch-run-verification` runs
a fence body as `bash "$tmp"` with no `set -e`
(`.claude/skills/dispatch-propagate/scripts/dispatch-run-verification:109-111`), so
a bare multi-statement block is decided by its **last** line alone and the earlier
assertions are silently discarded — a fence that greens on unimplemented work.
`set -e` would not fix it either: errexit is exempt for a command preceded by `!`,
so `! grep -q …` would still not abort. Hence the explicit `|| exit 1` / `&& exit 1`
on every line, and the terminal `exit 0`:

```verify
grep -q 'standdown-winner-dead-node-held-no-worktree' .claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh || exit 1
grep -q 'cleared-no-worktree' .claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh && exit 1
grep -q 'cleared-no-worktree' .claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh && exit 1
exit 0
```

Manual review, not auto-runnable:

- Read the rewritten header ladder (lines ~107–147) against the implementation and confirm every disposition the code can emit has a matching bullet and vice versa — this file's stated convention, and the reason a stale header is itself a defect.
- Confirm `standdown_clear` is called from exactly one place in the ladder (rule (d)) plus its own definition, and that the sweep still `return 0`s on every path including a failed park.
- Confirm the emitted no-worktree `reason` makes **no** unpushed-work claim and that its `recommendation` omits the "push them from there FIRST" instruction — read one real reason string out of a test run's `$SD_PARKLOG` rather than reasoning about the format string.
- `bash .claude/skills/dispatch-propagate/scripts/run-lint.sh` before pushing (it runs `lint-prose-rules.sh` and the type-safety escape check over net-new added lines).
- Observe in production after merge: on the next tick that reaches this sweep with a no-worktree marker, `journalctl` for `lib-standdown-recheck: parked … standdown-winner-dead-node-held-no-worktree` and confirm the node shows in the office-hours PARKED panel rather than vanishing. There is no way to force this state safely, so this is an observe-when-it-occurs check, not a gate.
