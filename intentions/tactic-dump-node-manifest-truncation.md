---
id: tactic-dump-node-manifest-truncation
kind: tactic
statement: "dump-node.ts must not silently weaken compare-and-swap coverage: a
  second single-node dump into the same --out-dir truncates the shared
  base-manifest.txt, dropping the earlier node's base token with no warning"
owner: ai
status: raw
parent: null
rationale: Hit live 2026-07-25 during the /align-strategy round that recorded
  the queue-serialization review. The session dumped two strategy nodes with two
  sequential dump-node.ts calls sharing one --out-dir; the second call's
  writeFileSync truncated base-manifest.txt, so the graph-commit that followed
  enforced CAS on only one of the two edited nodes. The tool is not wrong — it
  accepts multiple ids in a single call — but the failure is silent, and the
  only signal is a count in a graph-commit log line that reads as normal output.
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
# dump-node.ts must not silently weaken compare-and-swap coverage: a second single-node dump into the same --out-dir truncates the shared base-manifest.txt, dropping the earlier node's base token with no warning

## Context

Retained byproduct of the 2026-07-25 `/align-strategy` round on
`strategy-graph-native-dispatch`. Not yet planned. Low severity, high silence.

`dump-node.ts --out-dir <dir> <id> [<id> ...]` writes `<dir>/<id>.json` per node
and one shared `<dir>/base-manifest.txt`, via `writeFileSync` — a truncating
write. Dumping N nodes is therefore correct **only** as a single call. Two
sequential single-node calls into the same directory leave a manifest holding
just the last id, and `graph-commit --base <manifest>` then enforces
compare-and-swap on that one node while the others land unguarded.

Observed: a round editing two strategies dumped them one at a time, and
`graph-commit` reported `checking --base freshness for 1 node(s)` while landing
two edited strategies plus six new tactics. Nothing failed — the write landed —
but the staleness guard the round believed it had was covering half of what it
was meant to cover. That is the dangerous shape: the protection is absent
exactly when the operator believes it is present.

## Scope sketch (for /align-tactics, not a plan)

- In scope: make the failure loud or impossible. Options for the planning round,
  in rough order of preference — (a) merge rather than truncate when the
  manifest already holds ids not in this call; (b) warn on stderr when
  truncating a non-empty manifest that names other ids; (c) have `graph-commit`
  warn when the id set it is landing is wider than the `--base` set it was
  handed, which catches the whole class regardless of how the manifest was
  produced. Option (c) is the most general and is the one to prefer if only one
  is taken.
- Out of scope: the concurrent-session `--out-dir` collision already known as an
  operator trap (two sessions sharing a scratch dir). This is a single-session,
  single-directory defect and reproduces with no concurrency at all.

## Related

`tactic-graph-write-recipes-base-cas` owns the base-CAS recipe this defect
silently undermines.
