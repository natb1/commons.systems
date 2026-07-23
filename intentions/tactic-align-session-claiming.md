---
id: tactic-align-session-claiming
kind: tactic
statement: "human-invoked align/graph sessions claim their node id:
  worktree-as-claim step in both align skills, automatic base manifest through
  the write path, and a selector claimed-set assertion covering human-created
  worktrees"
owner: ai
status: codified
parent: null
rationale: "Implements the human-session half of the 2026-07-06
  concurrency-safety clarification on strategy-graph-native-dispatch. The router
  half is already planned and largely at qa: claimed set + reservation ledger
  spanning keyspaces (tactic-graph-router-selector Unit 2), node-id worktrees +
  provision primitive (Unit 3), soft-freeze fingerprint detection (same tactic),
  fail-closed write safety (tactic-graph-commit + hardening), and the
  base-version check (tactic-graph-commit-prune-support Unit 2). Nothing yet
  makes a HUMAN-invoked align session claim its node id, author in a worktree,
  or pass a base manifest - the exact gaps the 2026-07-06 doctrine round hit
  live (two sessions authoring in the shared checkout; a stale dump nearly
  clobbering live phase state). Off the minimum signal path: supporting
  infrastructure, demoted by derived attention, no validates edge."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 (refined): tactics that directly edit
    .claude/skills/align-strategy/SKILL.md or
    .claude/skills/align-tactics/SKILL.md content rank above the rest of
    strategy-graph-native-dispatch's subtree (boost 3, added on top of the
    strategy's own boost 5, authored 8) — above curriculum-execution tooling
    (boost 7) and above every other tactic in this strategy's subtree (inherited
    5, unboosted)."
phase: done
execution:
  branch: tactic-align-session-claiming
  pr: 2804
  attempts: {}
  markers:
    - planned
    - reviewed
  strategy_fingerprint: 7964be73bb6a26bb77ec516c22d07677de94ee20965f93b02442867fff492731
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# human-invoked align sessions: claim, isolate, and write fresh

## Context

The 2026-07-06 concurrency-safety clarification on
`strategy-graph-native-dispatch` commits to uniform claiming across launch
modes: interactive and human-invoked bg align sessions enter the same
node-id reservation discipline as router workers and author in worktrees,
never the shared main checkout. The router half is implemented elsewhere
(selector Units 2–3, prune-support Unit 2); this tactic carries the
human-session half. Motivating incidents, same day: two human-invoked
sessions authored concurrently in the shared checkout (one's dirty tracked
file blocked the other's `graph-commit` rebase), and a stale `readNode`
dump nearly clobbered a tactic's live `phase: qa` state.

Recorded observation (informs, does not gate): the semantic-drift
reconciler — the `/align-strategy` improvement pass carrying the greenfield
gate — has no scheduler; its cadence is human practice. Promote it to a
scheduled sweep only if doctrine-vs-content drift recurs despite claiming
and freshness landing.

## Unit 1 — claim-and-isolate step in both align skills

**Recommended model:** sonnet

Scope:
- `.claude/skills/align-strategy/SKILL.md` (insert after "Trigger and
  input", ~line 27) and `.claude/skills/align-tactics/SKILL.md` (insert
  after "Trigger and input", ~line 39): a **Step 0 — Claim and isolate**.
  Resolve the target node id (the strategy argument; for an
  /align-strategy improvement pass or doctrine round, the primary strategy
  being edited, claimed before the first write). If
  `<project-root>/.claude/worktrees/<node-id>` exists with a live session
  (`worktree_has_live_session`,
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15` —
  requires `dangerouslyDisableSandbox: true`), the claim is held: stop and
  report; do not park the node. Otherwise create/enter the worktree
  (native `EnterWorktree`, or the `provision-node-worktree` primitive from
  selector Unit 3) and author there. The worktree is the claim — the same
  live-session ⇔ worktree liveness rule the router uses.
- Same step, one more sentence in `/align-strategy` only: a
  doctrine-recording round pins the pace curve
  (`dispatch.config/target-workers.json`: floor 0 / terminal 1) for its
  audit window and restores 50/100 after — the practice the clarification
  records.
- Note the node-id worktree name clears `worktree-create.sh:56`'s
  numeric-only regex only after selector Unit 3 lands (hence the
  `blocked_by` edge).
- Landing caveat: `.claude/skills/**` edits are agent-behavior config —
  dispatch auto mode denies the commit; park for interactive landing if hit.

## Unit 2 — automatic base manifest through the write path

**Recommended model:** sonnet

**Dependencies:** `tactic-graph-commit-prune-support` Unit 2 (the
`--base` flag).

Scope:
- New `packages/intentionsutil/scripts/dump-node.ts`: given node ids,
  write each node's JSON (same shape `readNode` returns) into a target
  directory AND a base manifest recording each id's blob
  (`git hash-object intentions/<id>.md` of the file actually read); print
  the manifest path. This replaces the ad-hoc per-session dump one-liners.
- Both align SKILL.mds' record steps (align-strategy Step 5,
  align-tactics Step 5): dump via `dump-node.ts`, pass the manifest to
  `graph-commit --base <manifest>` so stale reads fail mechanically
  rather than by rebase luck.

## Unit 3 — selector claimed-set covers human-created worktrees

**Recommended model:** sonnet

**Dependencies:** `tactic-graph-router-selector` merged (the
`graph-select-target` script exists).

Scope:
- Shipped (PR 2804): `graph-select-target`'s claimed-set gate
  (`.claude/skills/dispatch-propagate/scripts/graph-select-target:368-372`)
  skips a node id when `reservation_exists "$id"` OR
  `worktree_has_live_session "$NATIVE_ROOT/.claude/worktrees/$id"` — bare
  worktree-directory existence alone is NOT a claim (matches Unit 1's own
  live-session ⇔ worktree liveness rule; per the #1474 doctrine an orphan
  worktree fails open). The shipped test
  (`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`,
  "graph-select-target — live session in a human-created node-id worktree
  is skipped (Unit 3)") covers a human-invoked session's worktree — one
  that claims by authoring in `<root>/.claude/worktrees/<node-id>` and
  never writes a router reservation-ledger marker — on two cases: (a) the
  worktree has a live session named `<node-id>` — skipped; (b) the same
  worktree with no live session (a bare/orphan worktree, daemon reports
  `[]`) — still selected, the negative control proving directory existence
  alone is not a claim.

## Reuse

- `worktree_has_live_session` / `claude_sessions_under` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`
- `EnterWorktree` (native) and `provision-node-worktree` (selector Unit 3)
- `graph-commit --base` (prune-support Unit 2); `readNode` in
  `packages/intentionsutil/src/store.ts:74`

## Verification

```verify
grep -q 'Claim and isolate' .claude/skills/align-strategy/SKILL.md && grep -q 'Claim and isolate' .claude/skills/align-tactics/SKILL.md && npx tsx packages/intentionsutil/scripts/dump-node.ts --help >/dev/null 2>&1; test $? -le 1 && echo OK
```

- Manual: run an align round end-to-end from a node-id worktree; start a
  second session against the same id and confirm it stops on the held
  claim; land a node edit through `dump-node.ts` → `graph-commit --base`
  and confirm a deliberately staled base is refused.
