---
id: tactic-office-hours-graph-read-cwd-whitespace
kind: tactic
statement: "Harden office-hours-graph directive parsing so a launch cwd containing whitespace is not truncated: `read -r verb a b _ <<<\"$directive\"` word-splits the cwd across `b`/`_`; drop the trailing `_` so a 3-var `read -r verb a b` assigns the line remainder (spaces intact) to `b`."
owner: ai
status: raw
parent: null
rationale: "Deferred review finding from the tactic-office-hours-graph-entry terminal review during the 2026-07-07 graph-native router tick. In packages/intentionsutil/scripts/office-hours-graph the disposition line is parsed with `read -r verb a b _ <<<\"$directive\"`. With 4 target vars, a `launch <node-id> <cwd>` line whose <cwd> contains a space splits the cwd: `b` gets the first whitespace-delimited chunk and `_` swallows the rest, so the subsequent `cd \"$cwd\"` targets a truncated path and the attach fails. Environment-unreachable today: the launch cwd is always `<repoRoot>/.claude/worktrees/<nodeId>` or `<repoRoot>`, the repo lives at a space-free path, and node ids are path-safe (store's assertPathSafeId rejects `/ \\ ..`, and ids are space-free by convention), so no space can appear. Latent only if the repo is relocated under a spaced path. Fix (one line): change `read -r verb a b _ <<<\"$directive\"` to `read -r verb a b <<<\"$directive\"`. With 3 vars, `read` assigns the entire remainder of the line (spaces preserved) to `b`, so a spaced cwd survives; the `empty` and `empty not-parked <id>` lines still parse correctly (verb=empty, a=not-parked, b=<id>). No caller change. Low severity; batch into any other office-hours-graph edit rather than spending a standalone CI cycle."
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

# Harden office-hours-graph directive parsing so a launch cwd containing whitespace is not truncated: `read -r verb a b _ 

In packages/intentionsutil/scripts/office-hours-graph the disposition line is parsed with `read -r verb a b _ <<<"$directive"`. With 4 target vars, a `launch <node-id> <cwd>` line whose <cwd> contains a space splits the cwd: `b` gets the first whitespace-delimited chunk and `_` swallows the rest, so the subsequent `cd "$cwd"` targets a truncated path and the attach fails.

Environment-unreachable today: the launch cwd is always `<repoRoot>/.claude/worktrees/<nodeId>` or `<repoRoot>`, the repo lives at a space-free path, and node ids are path-safe (store's assertPathSafeId rejects `/ \ ..`, and ids are space-free by convention), so no space can appear. Latent only if the repo is relocated under a spaced path.

Fix (one line): change `read -r verb a b _ <<<"$directive"` to `read -r verb a b <<<"$directive"`. With 3 vars, `read` assigns the entire remainder of the line (spaces preserved) to `b`, so a spaced cwd survives; the `empty` and `empty not-parked <id>` lines still parse correctly (verb=empty, a=not-parked, b=<id>). No caller change. Low severity; batch into any other office-hours-graph edit rather than spending a standalone CI cycle.
