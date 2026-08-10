---
id: tactic-reap-session-worktree-classification
kind: tactic
statement: Classify a reap candidate as having-a-node-worktree versus
  running-at-the-repo-root before the sweep resolves any worktree path, so the
  reap never treats a repo-root session's checkout as a removable node worktree
owner: ai
status: raw
parent: null
rationale: "Split out of tactic-session-reap-authorization-durability's migration
  step 1 at the 2026-08-10 office-hours sitting, but deliberately NOT on the
  scope that node recorded. That park proposed making lib-session-reap.sh read a
  recorded worktree path instead of deriving \"$worktrees_root/$name\", calling
  it small and independent; measurement on 2026-08-10 falsified both halves.
  provision-node-worktree:113 places EVERY provisioned node worktree at exactly
  PROJECT_ROOT/.claude/worktrees/<node-id> — the same path lib-session-reap.sh
  derives at :286-291 — so the derivation is correct by construction for
  provisioned worktrees and the recorded fix addresses nothing there. The actual
  divergence is a different population: sessions registered under a node id that
  run at the REPO ROOT, which strategy-node and office-hours-graph sessions do
  BY DESIGN. For those the derived worktree is simply absent, and the recorded
  fix — record the session's actual cwd and reap that — would point the sweep's
  `git worktree remove` (lib-session-reap.sh:374) at the MAIN CHECKOUT. So the
  naive fix converts a benign decline into a destructive one. Harm from the
  current behaviour is real and ongoing: tactic-fleet-alarm-busy-stall declined
  every ~15 minutes, 2268 journal mentions in the trailing 3 days as of
  2026-08-10. Live instance recorded the same day: session
  tactic-hold-conflict-strategy-fingerprint-stamp-coverage, idle, cwd at the
  repo root, derived worktree absent."
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
  rationale: "Filed at the 2026-08-10 office-hours sitting above the 20-band its
    parent and siblings sit in, because unlike them it is not blocked on any
    author question and it is causing measured, ongoing waste today (a node
    declining every ~15 minutes). The author's instruction at that sitting was
    to split it out precisely so it would not wait behind the claim-anchor
    ratification."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Classify reap candidates by worktree class before resolving a worktree path

## Context

`lib-session-reap.sh` resolves a candidate's worktree by derivation:

```
local worktrees_root="${DISPATCH_SESSION_REAP_WORKTREES_ROOT:-$repo_root/.claude/worktrees}"
# (7) The worktree. Its path is derived, never taken from the registry's
# `cwd`: provision-node-worktree puts a node's checkout at exactly
# <project-root>/.claude/worktrees/<node-id> on a branch of the same name.
local wt_path="$worktrees_root/$name"
```

(`lib-session-reap.sh:286-291`.)

The comment is accurate for the population it describes. Verified 2026-08-10:
`provision-node-worktree:113` places every provisioned node worktree at exactly
`PROJECT_ROOT/.claude/worktrees/<node-id>`. For a provisioned worker the
derivation cannot be wrong.

The problem is that a second population exists. Sessions registered under a
node id may run **at the repo root** — `strategy-node` and `office-hours-graph`
sessions do so by design. For those, the derived path names a worktree that
does not exist, and the sweep declines the candidate. That decline repeats
every sweep: `tactic-fleet-alarm-busy-stall` accounted for 2268 journal
mentions in the trailing 3 days as of 2026-08-10.

## The fix that must NOT be implemented

`tactic-session-reap-authorization-durability`'s park recorded the remedy as
"make `lib-session-reap.sh` read a recorded worktree path instead of deriving
it". Implemented literally, that is worse than the current behaviour: the
recorded path for a repo-root session IS the repo root, so the sweep's

```
git worktree remove ...
```

(`lib-session-reap.sh:374`) would be pointed at the **main checkout** for
exactly the sessions that currently decline harmlessly. A benign false decline
would become a destructive false accept.

## Units of work

### Unit 1 — classify the candidate before resolving a path

**Recommended model:** opus — the unit is small in lines but the whole point is
a safety-critical distinction whose naive form is destructive; it needs
judgment about which signal actually identifies the class.

**Scope:** `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh`,
gate (7) at lines 286-291. Before any worktree path is resolved, classify the
candidate into exactly one of:

- **has-a-node-worktree** — a provisioned node worker. The derived path
  `$worktrees_root/$name` is authoritative and stays exactly as it is today.
- **runs-at-the-repo-root** — `strategy-node` / `office-hours-graph` and any
  other session registered under a node id whose cwd is the repo root.

The classification must be positive evidence of the worktree class, not the
mere absence of the derived directory: a provisioned worktree that a human
removed by hand must not be silently reclassified as a repo-root session.
Prefer a signal tied to how the session was launched over one inferred from
the filesystem.

**Out of scope:** gates 3, 4, and 6, and the reap-safety content triple. This
unit changes only which worktree (if any) a candidate is associated with.

**Reuse:** the existing `repo_root` and `worktrees_root` resolution already in
this function; `claude_sessions_under` / `worktree_has_live_session` in
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` for how
sessions are enumerated and matched to node ids.

### Unit 2 — the repo-root class must never reach worktree removal

**Recommended model:** sonnet — a guard plus its test, once Unit 1 has defined
the class.

**Scope:** same file, the `git worktree remove` path at
`lib-session-reap.sh:374`. A candidate classified `runs-at-the-repo-root` must
never reach it. Removal applies only to the `has-a-node-worktree` class.

Decide and record explicitly what the repo-root class SHOULD do — reap the
session registration without touching any checkout is the expected answer, but
it must be stated rather than left implicit, since that is the behaviour change
that stops the every-15-minute decline.

**Dependencies:** Unit 1.

**Reuse:** the existing skip-reason logging convention
(`SESSION_REAP_SKIP_*`, e.g. `lib-session-reap.sh:548` and `:557`) so the new
class is observable in `tmp/dispatch-sweep.log` the same way the existing gates
are.

### Unit 3 — tests for both classes

**Recommended model:** sonnet — mechanical, following the existing harness.

**Scope:** the `lib-session-reap.sh` test file alongside it in
`.claude/skills/dispatch-propagate/scripts/`. Cover, at minimum:

- a provisioned node worker: classified `has-a-node-worktree`, derived path
  used, existing behaviour unchanged;
- a repo-root session registered under a node id: classified
  `runs-at-the-repo-root`, **`git worktree remove` never invoked**, and the
  candidate no longer declines forever;
- a provisioned worker whose worktree directory was removed by hand: NOT
  reclassified as repo-root.

The second case is the regression guard for the destructive fix this node
exists to avoid; assert on the absence of the removal call, not merely on the
exit code.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh
```

Live confirmation after merge: `tactic-fleet-alarm-busy-stall` stops appearing
as a recurring decline in `tmp/dispatch-sweep.log`, and no
`git worktree remove` is ever issued against the repo root.
