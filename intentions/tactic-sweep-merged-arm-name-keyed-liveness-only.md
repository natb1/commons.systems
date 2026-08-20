---
id: tactic-sweep-merged-arm-name-keyed-liveness-only
kind: tactic
statement: Give dispatch-sweep's MERGED arm the cwd-keyed liveness check the node
  arm already has — its guard is name-keyed only (worktree_has_live_session,
  exact match on the worktree basename), so a live session whose registered name
  differs from that basename is invisible to it and the sweep deletes the
  working directory out from under the running session
owner: ai
status: raw
parent: null
rationale: "Observed live on 2026-08-13T04:12:32Z: dispatch-sweep logged
  REMOVE_MERGED for
  .claude/worktrees/dispatch-ladder-skill (branch fix-node-lane-escalate-park,
  pr #3076) while an interactive Claude session was running in that exact
  directory as its cwd. The session's working directory vanished mid-turn; every
  subsequent Bash call failed with 'Working directory was deleted', two
  background pollers died on their cd, and recovery required an
  ExitWorktree/EnterWorktree pair (EnterWorktree refuses to create a worktree
  while the session still believes it is inside one). No SKIP_MERGED_LIVE_SESSION
  line appears in the log for that pass, confirming the guard did not fire. The
  cause is the guard's keying: dispatch-sweep's merged arm gates only on
  worktree_has_live_session, which lib-claude-agents.sh documents as NAME-keyed
  with an EXACT match against the worktree basename. The occupying session's
  registered name was 'implement dispatch ladder skill'; the basename was
  'dispatch-ladder-skill'. No match, so no skip. The cwd-keyed complement
  node_cwd_has_live_session -- whose own header says it exists 'complementing the
  NAME-keyed worktree_has_live_session' -- would have matched, since it resolves
  via claude_sessions_under <path> and the session's cwd WAS that path; but it is
  applied only in the node arm, not the merged arm. The escalation path made it
  worse: at 03:57:22Z the same worktree was SKIP_MERGED_NOT_IN_SYNC with the
  grace clock started, i.e. protected solely because its tree differed from
  origin/main. At ~04:06Z the session ran git reset --hard origin/main -- the
  discipline the graph-write rules require ('reset any working checkout to
  origin/main before a graph write') -- which made the tree in-sync and removed
  the only thing shielding it. The next sweep, six minutes later, reaped it.
  Following the documented pre-write discipline is what exposed the session."
reading: null
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
## The gap

`dispatch-sweep` has two liveness primitives and applies them unevenly:

| Arm | Guard |
|---|---|
| node | `worktree_has_live_session` **and** `node_cwd_has_live_session` |
| merged | `worktree_has_live_session` only |
| closed-issue | `worktree_has_live_session` only |

`worktree_has_live_session` is name-keyed and matches the worktree basename
exactly. That is the right key for a *dispatch worker*, which is deliberately
named for the node/worktree it owns. It is the wrong key for every other
occupant — an interactive session, an `EnterWorktree` session, or any ad-hoc
session — because those carry a human-chosen name that has no reason to equal
the directory basename.

`node_cwd_has_live_session` closes exactly that hole, and its own header says so.
It is simply not wired into the merged or closed-issue arms.

## Why the observed case was survivable, and why the next one may not be

The reaped tree was clean and fully pushed, so nothing was lost but the
session's footing. That is luck, not design:

- The merged arm reaches `git worktree remove` only when `worktree_in_sync`
  passes, so committed-and-pushed work is safe by construction.
- **Uncommitted** work is not protected by that check the way it looks. It is
  protected by the not-in-sync skip — which is a *grace clock*, not a veto. Once
  `MERGED_GRACE_S` expires, the merged arm quarantines and force-reaps. The
  quarantine (`lib-worktree-reap.sh`) does capture all three divergence kinds,
  so the work is recoverable — but the live session still loses its working
  directory mid-edit, with its uncommitted state relocated somewhere it does not
  know to look.

The sharper hazard is the interaction with the pre-write discipline. A session
that obeys "reset any working checkout to `origin/main` before a graph write"
converts itself from not-in-sync (protected by grace) to in-sync (immediately
reapable) at precisely the moment it is about to do graph work. The rule and the
sweep are individually reasonable and jointly hostile.

## Directions

1. **Add `node_cwd_has_live_session` to the merged and closed-issue arms.** One
   `elif` each, reusing the function that already exists for this purpose. This
   is the whole mechanical fix and it is small.

2. **Prefer cwd-keyed liveness as the default guard, with name-keyed as the
   addition.** Occupancy is a property of the directory, not of what the
   occupant happens to be called. The name-keyed check is a useful *extra* for
   catching a worker registered under the node name whose cwd has drifted, but
   it is the weaker signal to lead with, and leading with it is what produced
   this failure.

3. **Treat an unreadable registry as occupied in these arms too.** `claude
   agents --json` answers `[]` at exit 0 under sandbox network-namespace
   isolation, and `claude_sessions_under` already folds an uncorroborated `[]`
   into UNKNOWN for callers that ask. Any new gate here must inherit that
   fail-safe rather than reading a blocked socket as "nobody home".

Direction 1 is the immediate fix; direction 2 is the ordering the guard should
have had from the start.

## Resolved

Fixed by PR #3077, merged 2026-08-13 as `7410e07f`.

**Direction 1 was taken.** `node_cwd_has_live_session` is now wired into both
the merged arm (`SKIP_MERGED_LIVE_SESSION_CWD`) and the closed-issue arm
(`SKIP_CLOSED_LIVE_SESSION_CWD`) in
`.claude/skills/dispatch-propagate/scripts/dispatch-sweep`. The function's
section header, which read "NODE-arm gates", was retitled — it is no longer
node-specific.

**Direction 2 was NOT taken and is still the better answer.** Making cwd-keyed
liveness the *default* guard, with name-keyed as the addition, is the ordering
the guard should have had from the start. Direction 1 leaves the weaker signal
leading and bolts the stronger one on beside it. That is a smaller change, not
a better design. It stays open.

**Direction 3 is satisfied by construction**, with no new code:
`claude_sessions_under` returns rc 1 on an uncorroborated `[]`, and
`node_cwd_has_live_session` maps that rc to "occupied", so both new gates
inherit the fail-safe from the function they call.

**What the new tests do and do not prove.** The harness stub ignores `--cwd`
and returns its payload unconditionally — it does not emulate the daemon's own
`--cwd` filtering. So the new rows prove the guard is **wired** (the arm calls
`node_cwd_has_live_session` and reacts correctly to a non-empty result), not
that the `--cwd` filter works. That filter's semantics are covered separately
in `test-lib-claude-agents.sh`.

## Related

- [[tactic-ladder-await-phase-only-completion-test]] — the other defect surfaced
  by the same ladder run.
