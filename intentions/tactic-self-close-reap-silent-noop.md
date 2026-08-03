---
id: tactic-self-close-reap-silent-noop
kind: tactic
statement: "`claude rm` exits 0 while DECLINING to remove a session whose
  worktree has no verifiable repository, so dispatch-self-close's terminating
  `exec claude rm` reports success, nothing retries, and the session holds its
  node's live-session slot permanently — the reap's failure mode is a silent
  pass"
owner: ai
status: raw
parent: null
rationale: "Confirmed live 2026-08-03 by direct reproduction. THE DEFECT:
  dispatch-self-close ends with `exec \"$CLAUDE_CMD\" rm \"$JOB_ID\"`, and
  treats that exec as the reap. But when the session's worktree cannot be
  verified against a repository, `claude rm` does not remove it — it prints
  `kept <id> — worktree has files but no repository to verify them against`
  and exits **0**. Reproduced verbatim against session e2636150. Because the
  exit status is 0, the Stop hook sees a successful reap, no error is logged,
  no retry is scheduled, and no detect fires. The session stays registered in
  `claude agents --json --all` forever. THE CONSEQUENCE: graph-select-target's
  occupancy check (`worktree_has_live_session`) is NAME-keyed on the node id,
  so a permanently-registered terminal session makes its node permanently
  unselectable while also consuming a live-session slot — the exact
  double-bind the auto-heal contract exists to prevent, arrived at through a
  path that reports success at every step. THE TRIGGER, and why this is
  systemic rather than incidental: the unverifiable-worktree condition holds
  whenever the node's branch was never pushed to origin. An `/align-tactics`
  round lands its work by `graph-commit` direct-push to `main` and never
  pushes a branch named for the node, so EVERY align-round node worker ends in
  this state. Measured 2026-08-03: of 5 stranded terminal sessions, 4 carried
  a correct `node-terminal` marker with `disposition=align-round` and all 4
  had `remote=NO` for their node branch — the reap gate passed and the reap
  itself silently did nothing. Since the router autonomously decomposes draft
  tactics through `/align-tactics` (the fleet's most frequent unattended
  phase), this leaks a session per align-round indefinitely. THE FIX
  DIRECTION: `claude rm`'s decline is detectable — it is reported on stdout
  and the session remains present in a subsequent listing — so self-close must
  verify the removal rather than trust the exit code, and on a detected
  decline either remove the worktree first (the documented remedy) and retry,
  or emit a loud, detectable failure. This is the project's recurring
  silent-PASS class: an instrument or action whose failure mode is
  indistinguishable from success."
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

# `claude rm` reports success when it declines to reap

`dispatch-self-close` treats `exec claude rm "$JOB_ID"` as the reap itself. The
command exits 0 in two materially different cases:

- the session and its worktree were removed;
- the session was **kept**, because its worktree has files but no repository to
  verify them against.

Only the first is a reap. Nothing downstream distinguishes them.

## Observed 2026-08-03

Five sessions sat terminal and unreaped. Four of them had a valid
`$CLAUDE_JOB_DIR/node-terminal` marker naming their own node with
`disposition=align-round`, so `dispatch-self-close`'s terminal-disposition
invariant passed and it proceeded to `claude rm`. Reproducing that call by hand:

```
$ claude rm e2636150
kept e2636150 — worktree has files but no repository to verify them against —
  remove the directory manually, or delete from the agents view to discard it
  worktree kept at .../.claude/worktrees/tactic-review-cross-lane-dedup
$ echo $?
0
```

All four node branches existed locally and **not** on `origin`. The remedy that
works is the one already documented for the interactive case: `git worktree
remove` first, then `claude rm` succeeds.

The fifth session was a separate, already-tracked cause — a `/qa-fix` pass that
never wrote a `node-terminal` marker at all, so self-close correctly HELD it
(`tactic-qa-fix-node-terminal-declaration`).

## Why this is not covered by existing tracking

`tactic-graph-node-session-reap` extended the Stop hook to *call* self-close on
terminal exit; that landed and works. This defect is one layer down: the call is
made, the gate passes, and the primitive silently declines. `dispatch-sweep`
does not compensate — it reaps worktrees and branches, never sessions, and its
`HELD_FOR_DEBUG_COUNT` is explicitly documented as an observability metric that
nothing acts on.

## Scope note

Out of scope: changing when `claude rm` is called, the terminal-disposition
invariant, or the held-for-debug default. In scope: making self-close verify
that the removal actually happened, and making a decline loud.
