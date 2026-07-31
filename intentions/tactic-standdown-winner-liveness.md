---
id: tactic-standdown-winner-liveness
kind: tactic
statement: The duplicate-worker stand-down protocol must re-check that the
  winner is still live and its work pushed — the loser's deliberate choice not
  to write a park is correct only while the winner lives, so when the winner
  dies mid-work the loser waits forever on a session that no longer exists,
  holding the node with the fix unpushed in the shared worktree and no liveness
  check, timeout or surfacing to break it
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-07-31T01:07Z during the dispatch-pipeline
  bootstrap. This is the AFTERMATH of
  tactic-router-spawn-window-duplicate-worker, not a duplicate of it: the
  duplicate spawn is that node's defect, and what happens next is this one's.
  Session d8f6f60a correctly self-detected a duplicate on
  tactic-graph-commit-noop-landing-false-failure and stood down exactly by the
  book — 'the session with uncommitted build wins; the empty session stands
  down', and deliberately wrote no office-hours-reason marker because writing
  one would spuriously park a node another session was actively working.
  Textbook behavior, and correct for as long as the premise held. Then the
  winner (3059d43c) died before pushing. Final state: the winner's remedy — a
  git merge origin/main producing 94bf49b3, the exact fix for the stale-head
  flake — sat unpushed in the worktree while the remote was still at e525bed0,
  PR #2981 still failed hook-tests, the loser stayed alive and idle indefinitely
  waiting on a dead session, and the node was frozen one git push away from
  green. Nothing timed out and nothing surfaced it. The stand-down protocol has
  no liveness check on the winner and no deadline, and the loser's correct
  decision not to park is precisely what makes the resulting deadlock silent.
  Remedied by hand at the time by reaping d8f6f60a; the unpushed merge was
  trivially reproducible, so nothing was lost, but the recovery required a human
  noticing. Direction for planning, not a plan: the stand-down must be
  conditional and re-checked rather than one-shot — if the winner is no longer
  live and its work is unpushed, the loser must either take over the work or
  park the node, and either outcome must be observable. Any timeout chosen must
  not reintroduce the silent expiry that tactic-stopped-session-blocks-node
  exists to remove. Filed together with tactic-denied-command-parks-node and
  tactic-phase-terminal-requires-disposition — all three are the same root
  confusion, that 'held' and 'being worked' are not the same predicate and no
  code distinguishes them, with tactic-router-spawn-window-duplicate-worker the
  fourth member and the direct upstream cause of this one. Interim attention
  scaffolding only — tactic-attention-tier-ranking replaces the numeric scheme
  with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.
  blocked_by is empty, so this Wave A promotion lifts no blocker and cannot
  compound."
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
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    strands a node indefinitely with a completed fix unpushed, and it compounds
    tactic-router-spawn-window-duplicate-worker by converting every duplicate
    spawn into a potential permanent freeze. blocked_by is empty, so this
    promotion lifts no blocker and cannot compound. status stays raw and phase
    stays null so the selector emits it as an /align-tactics candidate for
    planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The duplicate-worker stand-down protocol must re-check that the winner is still live and its work pushed — the loser's deliberate choice not to write a park is correct only while the winner lives, so when the winner dies mid-work the loser waits forever on a session that no longer exists, holding the node with the fix unpushed in the shared worktree and no liveness check, timeout or surfacing to break it

## Context

Observed live **2026-07-31T01:07Z**. This is the **aftermath** of
`tactic-router-spawn-window-duplicate-worker`, not a duplicate of it: the
duplicate spawn is that node's defect, and what happens *next* is this one's.

Session `d8f6f60a` correctly self-detected a duplicate on
`tactic-graph-commit-noop-landing-false-failure` and stood down **by the book**:

> "the session with uncommitted build wins; the empty session stands down … No
> `office-hours-reason` marker — writing one would spuriously park the node."

Textbook behavior, and correct for exactly as long as its premise held.

**Then the winner (`3059d43c`) died before pushing.**

## Final state

| element | state |
|---|---|
| winner's remedy | `git merge origin/main` producing `94bf49b3` — the exact fix for the stale-head flake |
| where it lived | **unpushed**, in the shared worktree; remote still at `e525bed0` |
| PR #2981 | still failing `hook-tests` |
| loser | alive, idle, **waiting forever** on a session that no longer existed |
| node | frozen **one `git push` away from green** |

Nothing timed out. Nothing surfaced it.

## Why the stand-down protocol makes this silent

The protocol has **no liveness check on the winner and no deadline**. It is a
one-shot decision, evaluated once against a premise ("a winner is working this")
that can stop being true at any moment afterwards.

And the loser's decision **not** to write a park — which is *correct* while the
winner lives, precisely because a spurious park would knock a node another
session is actively working out of the lane — is exactly what makes the resulting
deadlock invisible. The protocol's one careful, correct choice is the thing that
hides the failure.

Remedied by hand by reaping `d8f6f60a`. Nothing was lost — the unpushed merge was
trivially reproducible — but recovery required a human noticing.

## Direction for planning (not a plan)

The stand-down must be **conditional and re-checked**, not one-shot: if the winner
is no longer live and the work is unpushed, the loser must either take over the
work or park the node. Either outcome must be **observable** — the current failure
mode produces no signal of any kind.

**Constraint on any timeout chosen:** it must not reintroduce the silent expiry
that `tactic-stopped-session-blocks-node` exists to remove. That node's
author-stated requirement is that release is an explicit human act; a bare
"stand-down expires after N minutes" would re-litigate it in a different file.
The liveness of the *winner* is the correct trigger, not the age of the loser's
wait.

## Read this with its three siblings — do not plan it alone

`tactic-denied-command-parks-node`, `tactic-phase-terminal-requires-disposition`,
`tactic-standdown-winner-liveness` and
`tactic-router-spawn-window-duplicate-worker` are **one family**: the fleet cannot
reliably tell whether a node is being worked on. Same root confusion — **"held"
and "being worked" are not the same predicate, and no code distinguishes them.**

`tactic-router-spawn-window-duplicate-worker` is the direct upstream cause of this
node: every duplicate spawn it permits is a potential permanent freeze here. That
makes the two worth sequencing together, but they are **not** the same fix — the
duplicate can be eliminated and a winner can still die mid-work for unrelated
reasons (an API error, a classifier denial per
`tactic-denied-command-parks-node`, an OOM).
