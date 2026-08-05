---
id: tactic-align-tactics-mark-terminal-skipped
kind: tactic
statement: An /align-tactics tactic-mode session's Workflow can complete cleanly
  and Step 2 can land the graph write, yet the session dies/idles before calling
  mark-node-terminal -- leaving the node terminal-held with no disposition until
  a defensive sweep parks it, and clearing that park alone restarts the churn
  because the dead session is still un-reaped
owner: ai
status: codified
parent: null
rationale: "Confirmed THREE times in one 08-01 investigation session, all the
  same shape: (1) tactic-stale-hold-auto-resolve -- Workflow disposition
  completed_with_fixes, 0 parks, plan landed at 668186a7, session died before
  mark-node-terminal, park cleared ab63dbda; (2) tactic-attention-boost-scripts
  -- plan landed earlier at c1773223, mark-node-terminal skipped, caught by a
  separate terminal-without-disposition sweep (park 3fff8088), cleared 9fb3b7ae;
  (3) tactic-test-decision-log-prod-leak -- Workflow wf_54f470ca-95b.json
  completed_with_fixes 2026-08-01T02:30:36Z, Step 2 landed bd8a7e02 (body diffed
  materially identical to the Workflow's authored body_markdown),
  mark-node-terminal skipped, parked by the terminal-without-disposition sweep
  18 min later (6201012b), cleared 93e3ab38 -- but clearing alone did NOT close
  the loop: the still-un-reaped session (41df3a8c) triggered a
  concurrent-edit-conflict park (754c2916) from another actor racing the same
  node, then the SAME terminal-without-disposition sweep re-parked it (1de047b3)
  8 hours later because the job was still un-reaped and therefore still read as
  terminal-without-disposition. The loop only stopped once the session was
  actually reaped (worktree remove + claude rm, since its branch was never
  pushed to a remote) AND the park cleared afterward, together, in that order --
  final clear 241489ee. Direct proof that 'clear the park' and 'reap the
  session' are two separate required actions, and doing only the first is a
  no-op that gets re-undone by the same sweep that originally caught it."
reading: null
gap: Sized by this round's Unit 3 (dispatch-terminal-gap-audit), not resolved at
  plan time -- the audit is a re-runnable report-only script, not a one-time
  count; run it post-merge per the plan's Verification section and record the
  landed-then-skipped baseline in this node's needs-main residue.
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Gap decision — session-level hardening of Step 2's mark-node-terminal
      call, or sweep-level reap of the dead job, given condition 14 reserved the
      freeze-for-debug trade for the author?
    answer: "(Ruled 2026-08-04 /align interview, author-ratified.) Both, with the
      doctrine trade made: condition 14's keep-for-debug is amended
      (strategy-graph-native-dispatch 2026-08-04 clarification) — an undeclared
      terminal exit now routes to the invalid-state lane, whose intervention
      session consumes the debugging artifact autonomously (transcript review,
      find-or-create root-cause follow-up, then reap or park) instead of
      freezing until an operator debugs by hand. This node's class (Workflow
      completed, graph write landed, mark-node-terminal skipped) is the worked
      example the intervention resolves mechanically: the transcript shows the
      completed Workflow, so the intervention performs the missed
      mark-node-terminal disposition, reaps, and files the hardening follow-up —
      the runtime discriminator the park said was missing is supplied by reading
      the transcript, not by a sweep-time flag. Session-level hardening of
      /align-tactics Step 2 (move mark-node-terminal into the same block as the
      graph-commit it follows, mirroring park-node:310-317 and transition-node's
      mark_terminal helper) remains in scope as prevention, as does correcting
      the shipped park-recommendation text at lib-frozen-session-park.sh:1034
      and the one-time cross-check audit still recorded in gap. Re-run
      /align-tactics on this node to finalize against this ruling. Park
      cleared."
  - question: The 2026-08-04 park (commit 13f4efa7) blocked this node's finalize
      round on its serving strategy's own office_hours park. Does that block
      still stand?
    answer: "No — it was already void when it was written, and is now disproven by
      direct observation. (Ruled 2026-08-05, author-directed, during the
      bootstrap monitor pass.) 13f4efa7 landed at 23:25:02Z and gave as its sole
      reason that the /align-tactics drift-review gate 'requires the serving
      strategy's office_hours be null before it authors any plan, tactic-mode
      included', so the round returned decomposable=false and escalated. PR
      #2982 removed exactly that coupling and merged at 00:15:46Z — fifty
      minutes later. On the code now at origin/main, tactic mode sets
      eligibility.decomposable=true by construction (align-tactics.js:728) and
      the plan gate reads planProceed = isTactic ? proceed : proceed &&
      decomposable (align-tactics.js:474), so a parked serving strategy no
      longer blocks a tactic-mode finalize. Behavioural proof, not inference: at
      00:50Z tactic-reconcile-park-clobber — which also carries serves:
      [strategy-graph-native-dispatch], still parked — cleared its drift review
      with proceed=true and no parks, authored a full three-unit plan, and
      landed as status codified / phase implement (commit 4d737d0e). That is the
      identical shape this park declared impossible. Disposition: unpark and
      re-run /align-tactics to finalize. The alternative reading — that the bug
      ledger's note calling this node 'subsumed by the invalid-state lane (1d)'
      should close it instead — was considered and rejected, because 13f4efa7's
      own drift review recorded this tactic's three-item scope as intact and not
      deficient (Step 2 hardening, correcting lib-frozen-session-park.sh's
      park-recommendation text, and the one-time cross-check audit), and none of
      those three is covered by the invalid-state lane, which addresses
      detection and intervention rather than that script's wording. Note that
      the three record-completeness gaps 13f4efa7 raised against
      strategy-graph-native-dispatch itself (its office_hours missing from the
      drift agent's input dump; rounds.count 0 and rounds.last_aligned null
      despite a dozen-plus documented rounds; three attributes.conditions
      entries narrating mechanisms that are still open tactics) are independent
      of this ruling and remain owed to an /align sitting on the strategy — a
      tactic-target session never edits the serving strategy's frontmatter."
  - question: This round's /align-tactics drift review found two file:line citations
      in this node's own text had drifted (park-node:310-317 -> :396/:401-410;
      lib-frozen-session-park.sh:1034 -> :1146) and that the body's 'Shape of a
      fix' item 2 (sweep reaps the dead job) was superseded by the ratified
      three-item scope. Material to the plan?
    answer: "(Recorded 2026-08-05 /align-tactics tactic-mode drift review,
      immaterial — plan_depends=false, no park.) Both citation drifts are
      line-number-only; substance unchanged. The 'sweep reaps the job itself'
      alternative is superseded, not newly decided: Ruling 1 already resolved it
      the other way (mechanical resolution of an invalid state belongs to the
      invalid-state lane, not this tactic). The finalized plan body's 'Anchor
      drift corrected here' and 'Non-goals' sections carry the corrected
      citations and the superseded-alternative note directly, so no separate
      strategy-level clarification is needed for either observation — per the
      tactic-target doctrine, a per-node finalize session never edits the
      serving strategy's frontmatter regardless of how immaterial the
      observation is."
tooling_goals: []
success_signal:
  observable: an /align-tactics tactic-mode session that completes its Workflow to
    disposition completed_with_fixes always has mark-node-terminal recorded
    before the session goes idle, verified by cross-referencing the session's
    workflows/wf_*.json completion timestamp against its mark-node-terminal call
    in the same session's transcript
  sensor: test-align-tactics-terminal-marker.sh (Unit 1) plus
    dispatch-terminal-gap-audit (Unit 3) as the recurring production check
  threshold: test-align-tactics-terminal-marker.sh asserts land-align-round is the
    only land path named in write-path.md/SKILL.md and that mark-node-terminal
    no longer stands alone as a later prose step; dispatch-terminal-gap-audit's
    landed-then-skipped count trends to zero across re-runs after the merge
  is_proxy: false
attention: null
phase: review
execution:
  branch: tactic-align-tactics-mark-terminal-skipped
  pr: 3047
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# An /align-tactics tactic-mode session's Workflow can complete cleanly and Step 2 can land the graph write, yet the session dies/idles before calling mark-node-terminal -- leaving the node terminal-held with no disposition until a defensive sweep parks it, and clearing that park alone restarts the churn because the dead session is still un-reaped

## Context

### The defect

`/align-tactics` lands a decomposition round with a `graph-commit` Bash call,
then — several tool calls and at least one turn later — is instructed by
prose to call `mark-node-terminal <node-id> align-round`. Nothing in the
system guarantees the session survives to make that second call. When it does
not, the round's content is landed and durable but the node carries no
declared disposition: `dispatch-self-close` holds the job (correctly — it
reads only `^node=` in `$CLAUDE_JOB_DIR/node-terminal`), the node stays
occupied, and the dispatch-tick `terminal_without_disposition_sweep` parks it
to `office_hours` some minutes later.

This is a genuine gap, not a theoretical one. Every other terminal writer in
the fleet already closes it by bundling the marker write into the *same shell
process* as the landing write:

- `packages/intentionsutil/scripts/park-node:396` lands the park via
  `graph-commit`; the very next statement at `park-node:410` is
  `"$SCRIPT_DIR/mark-node-terminal" "$NODE_ID" park >/dev/null 2>&1 || true`,
  with a comment block at `park-node:401-409` stating outright that this makes
  a landed disposition reapable *without depending on a later, separate step*.
- `.claude/skills/dispatch-propagate/scripts/transition-node:63` defines
  `mark_terminal() { "$UTIL_SCRIPTS/mark-node-terminal" "$NODE_ID" "$1" >/dev/null 2>&1 || true; }`
  once and calls it at every terminal exit: `transition-node:199`
  (`mark_terminal demote`) and `transition-node:240` (`mark_terminal advance`,
  the statement immediately following the `graph-commit` at
  `transition-node:230`, with a comment at `transition-node:235-239` explaining
  it sits there specifically to cover every downstream exit-0 outcome).

`/align-tactics` alone has no such wrapper. Its land is a bare `graph-commit`
tool invocation issued by the agent per prose
(`.claude/skills/align-tactics/references/write-path.md:65` for the
single-node tactic-target form, `:194` for the batch form), and its marker
call is a separate prose step at `.claude/skills/align-tactics/SKILL.md:360-372`.
That cross-turn gap *is* the failure mode.

### The three confirmed occurrences (carried forward)

All three were hit by one 2026-08-01 investigation session while resolving
unrelated stopped-node reports.

| node | Workflow completion | graph write | mark-node-terminal | caught by | cleared |
|---|---|---|---|---|---|
| `tactic-stale-hold-auto-resolve` | `completed_with_fixes`, 0 parks | landed `668186a7` | skipped | found directly by the investigation session | `ab63dbda` |
| `tactic-attention-boost-scripts` | `completed_with_fixes` | landed earlier, `c1773223` | skipped | terminal-without-disposition sweep, park `3fff8088` | `9fb3b7ae` |
| `tactic-test-decision-log-prod-leak` | `completed_with_fixes`, `wf_54f470ca-95b.json`, 2026-08-01T02:30:36Z | landed `bd8a7e02` (body diffed materially identical to the Workflow's `body_markdown`) | skipped | terminal-without-disposition sweep 18 min later, park `6201012b` | `93e3ab38`, but see below |

In all three the authored plan content was never lost — it landed. The only
gap is the mechanical marker call.

### Why "clear the park" alone is a no-op — direct evidence

`tactic-test-decision-log-prod-leak`'s clear (`93e3ab38`) did not close the
loop. The originating session (`41df3a8c`) was still alive-but-idle and
un-reaped. Over the following hours a second actor raced the same node and
landed a concurrent-edit-conflict park (`754c2916`); then the *same*
terminal-without-disposition sweep re-parked it (`1de047b3`), because from the
sweep's point of view the job was still terminal with no disposition —
clearing `office_hours` does not change that. The loop stopped only once the
session was actually reaped (`git worktree remove`, then `claude rm` — its
branch had never been pushed to a remote, a known reap gotcha) **and then**
the park was cleared again (`241489ee`), in that order.

**Clearing a park without reaping the session that produced it is a no-op.**
The condition the sweep detects — a terminal, un-reaped session with no
recorded disposition — is unchanged by the clear, so the next sweep pass
re-catches it.

The shipped park recommendation gets this backwards. At
`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:1146`
(inside `terminal_without_disposition_sweep()`, which begins at line 754) the
synthesized text currently reads:

> Read the session's transcript or attach the held job (`claude agents --all`,
> `claude attach <job-id>`) to see what it concluded. Decide the judgment item
> it stopped on, then either answer it here and `clear-park <node-id>`, or stop
> the session (`claude stop <job-id>`), let `dispatch-sweep` reap the worktree,
> and `clear-park <node-id>` to return the node to the lane. Do NOT simply reap
> the terminal session and release the node — that is what restarts the churn
> loop.

It offers "answer it here and `clear-park`" — with no reap — as a standalone
valid path, and its only warning covers reap-*without*-clear-park. The
evidence above is the exact opposite: clear-park *without* reap is what
restarted the churn. Whenever the terminal session is still present, the
mandatory sequence is reap **then** clear-park, in that order.

### Rulings governing this plan

**Ruling 1 (2026-08-04 /align interview, author-ratified — this node's
clarification 1).** Both session-level hardening and the shipped-text
correction are in scope, per `strategy-graph-native-dispatch`'s 2026-08-04
condition-14 amendment: an undeclared terminal exit now routes to the
invalid-state lane's transcript-driven intervention session rather than
freezing for manual debugging. This node's class is that lane's worked
example. Session-level hardening of `/align-tactics` Step 2 (bundle
`mark-node-terminal` into the same process as the `graph-commit` it follows,
mirroring `park-node` and `transition-node`) remains in scope as *prevention*,
as does correcting the park-recommendation text and running the one-time
cross-check audit.

**Ruling 2 (2026-08-05, author-directed — this node's clarification 2).** The
2026-08-04 park on this node (`13f4efa7`), which blocked finalize on the
serving strategy's own `office_hours` park, is VOID: it was already stale when
written (PR #2982 removed that coupling 50 minutes earlier) and is disproven
by direct observation — sibling `tactic-reconcile-park-clobber` cleared drift
with `proceed=true` and finalized to phase `implement` (`4d737d0e`) under the
same parked serving strategy. This node's own park was cleared at `37113eec`.
The three-item scope below was reconfirmed intact and is NOT subsumed by the
invalid-state-lane tactics.

### Anchor drift corrected here

Two anchors quoted in this node's earlier draft prose have moved; the
substance is unchanged and the corrected anchors are what this plan uses:

- `park-node:310-317` → **`park-node:396` (land) / `park-node:401-410`
  (comment + marker call)**.
- `lib-frozen-session-park.sh:1034` → **`lib-frozen-session-park.sh:1146`**.
  Line 1034 in the current file is an unrelated diagnosis-time-CAS comment.

### Intended outcome

After this plan lands: an `/align-tactics` round that reaches its landing
`graph-commit` declares a disposition in the same process, so the
skipped-marker class stops being produced; when a terminal-without-disposition
park is nevertheless minted, its recommendation states the proven-correct
reap-then-clear sequence; and the standing population of nodes already
silently sitting in this state is measured rather than guessed.

---

## Unit 1 — `land-align-round`: bundle the terminal marker into the land

**Recommended model:** opus

### Scope

**New file — `packages/intentionsutil/scripts/land-align-round`** (executable
bash, `set -euo pipefail`). A thin wrapper that lands a round via
`graph-commit` and writes the terminal marker in the same shell process, so
no cross-turn gap can swallow it. Placed alongside `graph-commit`,
`park-node`, and `mark-node-terminal` in `packages/intentionsutil/scripts/`
so it can resolve both siblings via `SCRIPT_DIR` exactly as `park-node:396`
and `park-node:410` do.

Contract:

```
land-align-round --terminal <node-id> [--base <manifest>] -m <message> <id> [<id> ...]
```

- `--terminal <node-id>` is **required** and names exactly one node: the node
  whose worker session this is (the tactic-target id in tactic mode; the
  strategy id in strategy mode). It is deliberately *not* inferred from the
  positional ids — a strategy round lands child tactic ids that must never
  authorize a reap.
- `--base` and `-m` and the positional ids are passed through to
  `graph-commit` verbatim. Omit `--base` for a round that only creates new
  nodes, exactly as today.

Behavior, keyed on `graph-commit`'s exit:

1. Invoke `"$SCRIPT_DIR/graph-commit" [--base "$BASE"] -m "$MSG" "$@"`,
   capturing stderr while still re-emitting it to the caller's stderr (so the
   agent sees the same diagnostics it sees today).
2. **exit 0** → `"$SCRIPT_DIR/mark-node-terminal" "$TERMINAL_NODE" align-round >/dev/null 2>&1 || true`,
   then exit 0. Best-effort `|| true`: a marker failure must never demote a
   landed round to a script failure (`park-node:401-409` states the same
   rationale).
3. **exit 1 whose stderr contains `parking node(s) — this writer's content is
   NOT landed`** (emitted at `graph-commit:1578` and `graph-commit:1585`) →
   this is a concurrent-edit conflict: the node landed with `office_hours`
   set. That IS a terminal disposition, so call
   `mark-node-terminal "$TERMINAL_NODE" park || true`, then exit 1. The
   session must still report and stop — the wrapper changes the marker, never
   the caller's stop-or-continue decision.
4. **any other non-zero** (notably the busy-main exhaustion error ending
   `... retry later`, `graph-commit:1308`) → **no marker**; propagate
   `graph-commit`'s exit code. Nothing landed and nothing parked, so the
   session is a genuine stall and must stay held.

No additional ownership guard: `mark-node-terminal:88-97` already refuses to
write unless `$CLAUDE_JOB_DIR/state.json`'s `.name` equals the node id, and
`mark-node-terminal:82-85` no-ops entirely when `CLAUDE_JOB_DIR` is unset
(interactive run). Both make the unconditional call safe. Do not re-implement
either check.

**Edit — `.claude/skills/align-tactics/references/write-path.md:60-66`** (the
single-node tactic-target land recipe) and **`:188-199`** (Step 4, "Land via
`graph-commit`"). Replace the round's **final** land command with
`land-align-round --terminal <target-node-id> ...`. State explicitly that
only the round's FINAL `graph-commit` is replaced: a multi-call round keeps
bare `graph-commit` for every earlier call, because a marker written after
call 1 of 3 would make a *partially* landed round reapable, converting a
failure the sweep currently catches into a silent one.

Also fold the exit-1 discrimination the wrapper now performs into the prose
at `write-path.md:215-232` — the agent still reports and stops on either
exit-1 case, but no longer has to decide which marker to write.

**Edit — `.claude/skills/align-tactics/SKILL.md:360-372`.** Delete the
standalone `mark-node-terminal ... align-round` step and its fenced block.
Replace with prose stating that the marker is written by `land-align-round`
in the same process as the land, and that `validate-graph.ts` now runs
*after* the marker. Add the consequence explicitly: a `validate-graph.ts`
failure on an already-landed round is reported and filed as a follow-up, not
held as a live session — the graph is already invalid on `main`, and holding
the session does not fix it. This mirrors `transition-node:235-239`'s
rationale for marking before its downstream outcomes.

**Out of scope for this unit:**

- `.claude/skills/align-tactics/SKILL.md:130-140` — the exit-12 `no-claim`
  marker call. That path lands nothing, so there is no write to bundle it
  with; it stays a bare prose call.
- `graph-commit` itself. It stays generic and marker-free; the wrapper is
  where align-tactics' node identity is known.
- `park-node` and `transition-node`. They already have the guarantee.

### Tests

**New — `packages/intentionsutil/scripts/test-land-align-round.sh`**, sited
next to `test-park-node.sh` and `test-transition-node.sh` and following their
shape: fake `graph-commit` and fake `mark-node-terminal` installed as argv
loggers at the paths the wrapper resolves via `SCRIPT_DIR`, with
test-controlled exit codes and stderr. Cover, at minimum:

1. `graph-commit` exit 0 → exactly one `mark-node-terminal` call, args
   `<terminal-node> align-round`; wrapper exits 0.
2. `graph-commit` exit 1 with the parking message on stderr → exactly one
   `mark-node-terminal` call with `park`; wrapper exits 1; graph-commit's
   stderr is re-emitted.
3. `graph-commit` exit 1 with the busy-main `... retry later` message → zero
   `mark-node-terminal` calls; wrapper propagates exit 1.
4. `graph-commit` exit 2 (or any other non-zero) → zero marker calls; exit
   code propagated.
5. `mark-node-terminal` exiting non-zero after a successful land → wrapper
   still exits 0 (the `|| true` guarantee).
6. Missing `--terminal` → exit 2 with a usage error, no `graph-commit` call.
7. `--base`, `-m`, and the positional ids reach `graph-commit` unchanged,
   including the multi-id batch form.

**New — `.claude/skills/dispatch-propagate/scripts/test-align-tactics-terminal-marker.sh`**,
a doctrine ratchet over the align-tactics prose, modeled directly on
`.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh`
(same fixture sourcing, same `GUARD_ROOT` resolution, same one-assertion-per-
requirement style). Assert:

1. `write-path.md` names `land-align-round` in both the tactic-target recipe
   and the Step 4 land section.
2. `SKILL.md` no longer carries a standalone `mark-node-terminal ... align-round`
   fenced command (the exit-12 `no-claim` call at `SKILL.md:130-140` must
   still be present — assert both, so the ratchet cannot be satisfied by
   deleting the wrong one).
3. `SKILL.md` states that `validate-graph.ts` runs after the marker.
4. `packages/intentionsutil/scripts/land-align-round` exists and is executable.

Per `.claude/rules/test-integrity.md`: if a wording expectation legitimately
changes, update the row — never drop an assertion to make the suite green.

**CI wiring — `.github/workflows/unit-tests.yml`, `hook-tests` job (job
begins line 184; the existing align-tactics and intentionsutil steps are at
lines 208-232 and 246-252).** Both new suites guard SUTs *outside*
`.claude/skills/dispatch-propagate/scripts/`, so `run-unit-tests.sh`'s
`RUN_PR_SCRIPTS` glob (`run-unit-tests.sh:88,187-190`) is not a CI vector for
them — it only fires for changed paths under that scripts dir. Add both as
unconditional steps in `hook-tests`, alongside
`Run align-tactics write-path freshness doctrine ratchet` and
`Run park-node CAS-guard tests`, and keep the in-file comment block at
`unit-tests.yml:197-206` accurate.

---

## Unit 2 — correct the terminal-without-disposition park recommendation

**Recommended model:** sonnet

### Scope

**Edit — `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:1146`**,
the `recommendation=` assignment inside `terminal_without_disposition_sweep()`
(function starts line 754; the synthesized-reason branch is at lines
1142-1147, reached only when the session wrote no
`$job_dir/office-hours-reason`).

Replace the text so that:

1. The diagnostic opening is kept verbatim — reading the transcript or
   attaching the held job (`claude agents --all`, `claude attach <job-id>`) is
   still the first step.
2. The "either answer it here and `clear-park <node-id>`, **or** stop the
   session ... and `clear-park`" fork is removed. Reap-then-clear-park becomes
   a single mandatory sequence, in that order, whenever the terminal session
   is still present. Answering the judgment item is something you do *in
   addition to* the reap, never instead of it.
3. The trailing warning is inverted to match the evidence: warn that clearing
   the park while the session is still present is a **no-op** — the same sweep
   re-parks the node on its next pass, because the condition it detects (a
   terminal, un-reaped session with no recorded disposition) is unchanged by
   the clear. Cite the observed shape: park cleared, session left alive, node
   re-parked twice.

Keep the existing reap mechanism wording — `claude stop <job-id>`, then let
`dispatch-sweep` reap the worktree. Do **not** promote `claude rm` to the
generic instruction: `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:697`
documents that `claude rm` deletes the session *and* its worktree, which is
only safe when the branch is pushed or the content is disposable. The
`worktree remove` + `claude rm` sequence used for `41df3a8c` was correct for
that specific case (unpushed branch, content already landed) and should be
mentioned only as the fallback for a session `claude stop` + `dispatch-sweep`
does not clear.

**Out of scope:**

- `lib-frozen-session-park.sh:544` — `frozen_session_sweep()`'s
  permission-denial recommendation. Different failure mode, no ordering bug,
  already reads reap-then-`clear-park`. Leave it.
- `lib-standdown-recheck.sh:697`. Reference only.
- The `reason=` string at `lib-frozen-session-park.sh:1143-1145`. Unchanged —
  Unit 3's classifier matches on it.
- The verbatim-reason path (`lib-frozen-session-park.sh:1128-1132`), where the
  session wrote its own `office-hours-reason`/`-recommendation`. Untouched.
- `park-node`'s `--base` CAS threading at `lib-frozen-session-park.sh:1176-1180`
  — that is `tactic-terminal-disposition-sweep-park-without-cas`'s landed fix;
  build on it, do not disturb it.

### Tests

**Extend — `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`**,
in the `=== terminal_without_disposition_sweep ===` section (begins line 687;
Test 20, "an aged terminal worker whose node is at a working phase is parked",
is at lines 1027-1042). The fixture already logs every `park-node` argv:
`td_park_arg 5` is the recommendation positional (`ARGC=5`; `--base`,
`<id>=<sha>`, node, reason, recommendation — see the park-args assembly at
`lib-frozen-session-park.sh:1170-1174`). Add assertions to Test 20:

1. The recommendation contains the mandatory reap-then-`clear-park` ordering
   statement.
2. The recommendation does **not** contain the retired
   "Do NOT simply reap the terminal session and release the node" sentence.
3. The recommendation does **not** offer clear-park as a standalone path (a
   negative assertion on the removed "either ... or" fork).

Also add a case asserting the verbatim path is unaffected: a session that
wrote its own `office-hours-recommendation` (via `td_write_job_file`) still
has that text threaded through unchanged — the correction applies only to the
synthesized branch.

No `unit-tests.yml` change: this suite's SUT lives under
`.claude/skills/dispatch-propagate/scripts/`, so `RUN_PR_SCRIPTS`
(`run-unit-tests.sh:88`) already covers it.

---

## Unit 3 — `dispatch-terminal-gap-audit`: measure the standing population

**Recommended model:** opus

**Dependencies:** Unit 2 — the audit prints the remediation sequence for each
hit, and it must quote the same corrected reap-then-clear-park wording Unit 2
lands, not the retired text.

### Scope

The node's original item 3 called for a one-time manual cross-check. The
greenfield form is a **re-runnable, report-only diagnostic script** — the same
cross-check is the only way to answer "did Unit 1 actually stop producing this
class?" after the change lands, and a procedure that exists only in prose
cannot be re-run. Model it on
`.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit` (a
re-runnable report-only diagnostic with an explicit classification taxonomy
and a two-source rate-vs-cause design). Writes nothing; touches no `gh`; takes
no action.

**New file — `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit`**
(executable bash, `set -euo pipefail`).

Sources:

- **Parked nodes (left side).** `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list`,
  which reads the `intentions/` store **at a git ref** (default `origin/main`,
  `--ref` overridable) rather than the local checkout — see its header at
  `office-hours-select.ts:1-45`. Pass the audit's own `--ref` through. Do not
  reimplement park enumeration by grepping `intentions/*.md`; a local checkout
  answers from whatever it last synced.
- **Workflow completion records (right side).** For each parked node id,
  derive its transcript project directory from the Claude Code project-slug
  encoding of the node's worktree path: `<repo-root>/.claude/worktrees/<node-id>`
  with `/` and `.` replaced by `-` (observed shape:
  `-home-n8-natb1-commons-systems--claude-worktrees-<node-id>`). Under
  `<projects-root>/<slug>/<session-id>/workflows/wf_*.json`, select records
  where `.workflowName` begins `align-tactics` and `.status` is `completed`.
  Read `.timestamp` and `.result` for the report. Follow
  `.claude/rules/shell-json.md`: `jq` reads each file directly — never
  `echo "$VAR" | jq`.

Classification — each parked node lands in exactly one bucket:

- **`landed-then-skipped`** — a completed `align-tactics` Workflow record
  exists for the node AND the node's park reason is the sweep's synthesized
  terminal-without-disposition text (match on the stable prefix
  `phase session ended without declaring a disposition`, from
  `lib-frozen-session-park.sh:1143-1145`). This is the population the audit
  exists to size: the Workflow finished, the write landed, the marker was
  never written.
- **`parked-by-design`** — the park reason is not the synthesized
  terminal-without-disposition text (a session that escalated deliberately, a
  concurrent-edit park, a config park).
- **`no-workflow-record`** — the park reason matches, but no completed
  `align-tactics` record is found (transcripts pruned, or a non-align lane
  produced the park). Report separately; do not fold into either bucket above.
- **`unmeasurable`** — the projects directory exists but is unreadable, or the
  slug derivation finds no directory at all. Never silently reclassify as
  `no-workflow-record`.

Output: one row per parked node (`node-id`, bucket, workflow timestamp if any,
session id if any), then a one-line summary counting each bucket. For every
`landed-then-skipped` row, print the two-step remediation — reap the session,
*then* `clear-park <node-id>` — quoting Unit 2's corrected sequence. **Print
only.** The script never reaps, never clears, never writes.

Env overrides for testability, mirroring
`lib-frozen-session-park.sh:791-792`'s pattern:
`DISPATCH_TERMINAL_GAP_PROJECTS_ROOT` (default `$HOME/.claude/projects`) and
`DISPATCH_TERMINAL_GAP_REPO_ROOT` (default: resolved from the script's own
location, per `.claude/skills/dispatch-propagate/scripts/transition-node`'s
`REPO_ROOT` convention).

**Out of scope:**

- Any automatic remediation. Mechanical reap of an invalid-state node belongs
  to `intentions/tactic-invalid-state-lane.md` and
  `intentions/tactic-invalid-state-transcript-intervention.md`, not here.
- Wiring the audit into `dispatch-tick`. It is operator-invoked.
- The `~/.claude/jobs/<jid>/state.json` registry. The project-slug path is a
  sufficient and simpler key; the jobs registry is only needed when a session
  is still live, which the audit does not require.

### Tests

**New — `.claude/skills/dispatch-propagate/scripts/test-dispatch-terminal-gap-audit.sh`**,
following `test-lib-frozen-session-park.sh`'s fixture style: a scratch
`projects-root` populated with synthetic `<slug>/<sid>/workflows/wf_*.json`
records, and a stubbed `office-hours-select.ts` output (a fixture file the
script reads via an injected command, or a scratch repo whose
`refs/remotes/origin/main` carries hand-written parked nodes — whichever the
implementer finds simpler to keep hermetic). Cover one vector per bucket plus:

- exit 0 and a well-formed summary line when there are zero parked nodes;
- a node whose Workflow record has `.status: "killed"` classifies as
  `no-workflow-record`, not `landed-then-skipped`;
- a malformed `wf_*.json` classifies as `unmeasurable`, not as a silent skip;
- the script performs no writes (assert the scratch repo is clean and no
  `clear-park`/`park-node`/`claude` binary was invoked, via argv-logger stubs
  on `PATH`).

No `unit-tests.yml` change needed: SUT and suite both live under
`.claude/skills/dispatch-propagate/scripts/`, covered by `RUN_PR_SCRIPTS`.

---

## Non-goals (recorded, not dropped)

- **The sweep reaping the dead job itself.** This node's earlier draft floated
  it as an alternative item 2. Ruling 1 resolved it the other way: mechanical
  resolution of an invalid state is the invalid-state lane's job
  (`intentions/tactic-invalid-state-lane.md`,
  `intentions/tactic-invalid-state-transcript-intervention.md` — both still
  `status: raw`, `phase: null`). This plan's Unit 2 corrects the *instruction*
  a human or intervention session follows; it does not add a reap to the
  sweep. Do not make either lane tactic a blocker of this plan — the three
  items here stand alone.
- **`strategy-graph-native-dispatch`'s own record-completeness gaps** —
  `office_hours` missing from the drift agent's input dump, `rounds.count 0`
  against a dozen-plus documented rounds, and three `attributes.conditions`
  entries narrating still-open mechanisms. Explicitly out of scope for this
  node per its clarification 2.
- **The strategy's own `office_hours` park.** Still live at HEAD (sensor-name
  / threshold ratification, unrelated). Tactic mode's plan gate does not read
  it — `computePhaseGates` at `.claude/workflows/align-tactics.js:466-475`
  computes `planProceed = isTactic ? proceed : proceed && decomposable`, and
  the tactic-mode eligibility prose at `align-tactics.js:715-733` instructs
  the agent not to evaluate it. Do not re-litigate.

## Reuse

- `packages/intentionsutil/scripts/park-node:396` (land) and `:401-410`
  (comment block + `mark-node-terminal ... park >/dev/null 2>&1 || true`) —
  the canonical land-then-mark-in-one-process pattern Unit 1 mirrors, and the
  canonical rationale comment to paraphrase.
- `.claude/skills/dispatch-propagate/scripts/transition-node:63` (`mark_terminal()`
  helper), `:199` (`mark_terminal demote`), `:230` (`graph-commit`), `:235-240`
  (comment + `mark_terminal advance`) — the second instance of the same
  pattern, including its "marked HERE so it covers all downstream exit-0
  outcomes" reasoning that Unit 1's validate-graph ordering change reuses.
- `packages/intentionsutil/scripts/mark-node-terminal` — the primitive.
  `align-round` is already a validated disposition (`:27` vocabulary comment,
  `:74` case list); the ownership gate is at `:88-97` and the interactive
  no-op at `:82-85`. Reuse both instead of adding any new guard in Unit 1.
- `packages/intentionsutil/scripts/graph-commit` — exit contract Unit 1
  discriminates on: parking message at `:1578` and `:1585`
  (`parking node(s) — this writer's content is NOT landed`), busy-main
  exhaustion at `:1308` (`... retry later`).
- `.claude/skills/align-tactics/references/write-path.md:60-66` (single-node
  tactic-target land), `:188-199` (Step 4 batch land), `:215-232` (exit-1
  discrimination prose) — Unit 1's edit targets.
- `.claude/skills/align-tactics/SKILL.md:360-372` (the fragile marker step
  Unit 1 removes) and `:130-140` (the exit-12 `no-claim` call that stays).
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:754`
  (`terminal_without_disposition_sweep()` entry), `:1128-1132` (verbatim
  reason/recommendation path), `:1142-1147` (synthesized branch; `:1146` is
  Unit 2's edit target), `:1170-1174` (park-args assembly, which fixes the
  recommendation as `park-node` positional 5).
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:697` —
  reference for the `claude stop` vs `claude rm` distinction Unit 2 must not
  flatten.
- `packages/intentionsutil/scripts/office-hours-select.ts` — `--list` and
  `--ref` are Unit 3's parked-node enumeration; read-at-a-ref rationale in its
  header (`:1-45`).
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:1-50` —
  the report-only re-runnable diagnostic shape Unit 3 follows (explicit
  taxonomy, one bucket per event, rate-vs-cause separation).
- `.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh`
  — the doctrine-ratchet test pattern Unit 1's prose guard copies
  (`GUARD_ROOT` resolution, one assertion per requirement, the
  "update the row, never drop it" banner).
- `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh:687`
  onward — the `td_*` fixture (`td_write_node`, `td_write_job_file`,
  `td_park_arg`, `td_run`) Unit 2 extends and Unit 3's suite models itself on.
- `packages/intentionsutil/scripts/test-park-node.sh` and
  `test-transition-node.sh` — the sibling-fake harness shape for Unit 1's
  functional suite, and the CI precedent for wiring an intentionsutil suite
  into `hook-tests`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` —
  `assert_eq` / `report_results` / `SCRIPT_DIR` / `REPO_ROOT`, sourced by
  every suite above.

## Verification

### Auto-runnable

Unit 1's functional suite (new):

```verify
packages/intentionsutil/scripts/test-land-align-round.sh
```

Unit 1's align-tactics doctrine ratchet (new):

```verify
.claude/skills/dispatch-propagate/scripts/test-align-tactics-terminal-marker.sh
```

Unit 2's extended sweep suite:

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh
```

Unit 3's audit suite (new):

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-terminal-gap-audit.sh
```

Regression guard — the pre-existing align-tactics suites must stay green
across Unit 1's prose edits:

```verify
.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-mark-node-terminal.sh
```

Syntax check on both new scripts:

```verify
bash -n packages/intentionsutil/scripts/land-align-round && bash -n .claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit
```

Prose-rule lint (enforces `.claude/rules/shell-json.md` on net-new added lines
in committed `.sh` files — both new scripts parse JSON):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

### Manual

- **Confirm the CI wiring is a real vector.** After adding the two Unit 1
  steps to `.github/workflows/unit-tests.yml`'s `hook-tests` job, verify on the
  PR that both steps actually ran. `run-unit-tests.sh` sets `RUN_PR_SCRIPTS`
  only for changed paths under `.claude/skills/dispatch-propagate/scripts/`
  (`run-unit-tests.sh:88`), so a PR touching only
  `packages/intentionsutil/scripts/land-align-round` or the align-tactics
  SKILL prose would otherwise merge with nothing run — the exact hazard the
  comment at `unit-tests.yml:197-206` documents.
- **Run the audit once and record the number.** Post-merge, on the host (it
  reads `$HOME/.claude/projects`, which exists nowhere else):
  `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit`.
  Record the `landed-then-skipped` count in this node's `needs-main` residue.
  This is the answer to the node's original item 3 — "how many more nodes are
  silently sitting in this state right now" — and the baseline the post-Unit-1
  re-run is compared against. Cannot run in CI.
- **Remediate what the audit finds, in the proven order.** For each
  `landed-then-skipped` node: reap the session first (`claude stop <job-id>`,
  let `dispatch-sweep` reap the worktree; fall back to `git worktree remove` +
  `claude rm` for an unpushed branch whose content already landed), *then*
  `clear-park <node-id>`. Doing only the clear is the no-op this node
  documents. Judgment call per node — do not script it.
- **Observe in production that the class stops.** Over the week following the
  merge, watch dispatch-tick's stderr for
  `terminal-disposition sweep complete (terminal=N parked=M ...)` lines whose
  parked node had a completed `align-tactics` Workflow. Re-run the audit and
  compare `landed-then-skipped` against the recorded baseline. A non-zero count
  of *newly* produced instances means Unit 1's wrapper is being bypassed —
  most likely a round that used bare `graph-commit` for its final land — and is
  a follow-up, not a re-open of this node.
- **Read the corrected recommendation in situ.** The next
  terminal-without-disposition park minted after the merge should carry the
  reap-then-clear-park mandate. Confirm the rendered `office_hours.recommendation`
  on that node reads correctly in context (the test asserts substrings; only a
  human can judge whether an operator following it would do the right thing).

## needs-main residue

- **id 10 — Post-merge baseline re-run of the gap audit against real host state.**
  Expected outcome: a recorded `landed-then-skipped` baseline count from running
  `dispatch-terminal-gap-audit` against the host's real `~/.claude/projects` and
  a freshly-fetched `origin/main`, with a follow-up cadence confirming the count
  stays flat (not growing) after `land-align-round` ships. Finding: this PR's own
  body calls the baseline run out as a follow-up step, not automatable from CI —
  the audit reads a live host transcript store and live `origin/main` park state,
  neither of which exists at merge time. This is the plan's own Verification
  section item ("Run the audit once and record the number"), carried here as
  `needs-main` residue per the qa-fix disposition triage (PR #3047, first
  qa-fix pass).
  - Verifiability: MACHINE
  - Check: `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit`
    run on the host after `git fetch origin main`; record the printed
    `landed-then-skipped=<N>` count as the baseline, then re-run periodically and
    compare against it (see the plan's Verification § Manual bullets above for
    the full remediation/observation cadence).

