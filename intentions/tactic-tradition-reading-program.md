---
id: tactic-tradition-reading-program
kind: tactic
statement: Chunked personal reading program — verify each tradition record
  against its cited texts, load-bearing doctrine first
owner: human
status: codified
parent: null
rationale: "Finalized 2026-07-06 /align-tactics round (from the 2026-07-05
  retained draft): the recovery path of delegation-philosophical-articulation,
  chunked to ≤30-minute author sessions and ordered by how much graph doctrine
  each text underwrites. Finishing a chunk means re-reading the named tradition
  record against the text — amend it where the reading contradicts it (the
  reading wins), ratify it where it holds — and flipping the record delegated →
  codified once its texts are covered. This node is the program record and the
  parent of the chunk leaves. Round 1 breaks out the capture-doctrine path —
  chunks 1, 2, 5, per the 2026-07-06 order revision from
  strategy-recovery-critical-path — as born-parked child tactics; chunks 3, 4,
  6–9 stay recorded in this body for later rounds to break out."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# Chunked personal reading program — verify each tradition record against its cited texts, load-bearing doctrine first

Subtree parent and index of the tradition-reading curriculum. As of the
2026-07-06 /align-tactics round (reader-sync scope), all nine chunks are
per-chunk born-parked office-hours tactic nodes carrying their own Text /
Questions / Completion sections and machine-readable `attributes.curriculum`
metadata (`{priority, passages: [{work, range}]}`) — the chunk nodes are the
single home of that content; this node only indexes them.

Each chunk is one office-hours sitting of at most 30 author-minutes.
Finishing a chunk = re-read the named record against the text; amend where
the reading contradicts it (the reading wins — see the clarification on
`strategy-philosophical-grounding`), ratify where it holds. A record flips
`status: delegated → codified` when all its chunks are done; the delegation's
`last_exercised` stamps per chunk. `/sync-reader`
(`tactic-sync-reader-skill`) delivers each chunk's cited passages to the
author's e-reader and retires them when the chunk node resolves
(`phase: done`).

## Working order

Per `strategy-recovery-critical-path` (2026-07-06 revision): 1, 2, 5, then
3, 4, 6, 7, 8, 9 — the capture-doctrine path (Cave → hexis → phronesis)
completes first. `attributes.curriculum.priority` on each chunk node encodes
exactly this order; the graph is its single home, maintained by
`strategy-recovery-critical-path` applications.

| Priority | Chunk node | Texts | Record(s) |
|---|---|---|---|
| 1 | `tactic-reading-chunk-1-plato-cave` | Republic VII 514a–521b | tradition-plato |
| 2 | `tactic-reading-chunk-2-aristotle-hexis` | NE II.5–6 | tradition-aristotle |
| 3 | `tactic-reading-chunk-5-aristotle-phronesis` | NE VI | tradition-aristotle |
| 4 | `tactic-reading-chunk-3-kant-humanity-servility` | Groundwork 4:429; MM 6:434–437 | tradition-kant |
| 5 | `tactic-reading-chunk-4-sophrosyne-ordered-soul` | NE III.10–12; Republic IV | tradition-aristotle, tradition-plato |
| 6 | `tactic-reading-chunk-6-precision-externals` | NE I.3; I.8–10 | tradition-aristotle |
| 7 | `tactic-reading-chunk-7-liberality-schole` | NE IV.1; X.7; Politics I.2 | tradition-aristotle |
| 8 | `tactic-reading-chunk-8-stoicism-drills` | Enchiridion 1; Seneca Letters 18, 91 | tradition-stoicism (declined) |
| 9 | `tactic-reading-chunk-9-mill-justice` | Mill, Utilitarianism ch. 2, 4 (5) | tradition-utilitarianism (declined) |

Chunk numbers in node ids are stable names from the original list, not the
working order. Chunk 6 carries the capstone rule: after chunks 1–6 are done,
wherever they fall in the working order, revisit the apex question itself.
