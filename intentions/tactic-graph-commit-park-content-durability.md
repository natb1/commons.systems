---
id: tactic-graph-commit-park-content-durability
kind: tactic
statement: park_write preserves the losing writer's unlanded content only as a
  pointer into a per-run mktemp dir its own recommendation text concedes is
  machine-local and may not outlive the session, so the record that exists to
  save that content cannot durably hold it; and on the delete/modify branch the
  office_hours record never reaches origin/main at all, so no pointer of any
  kind survives
owner: ai
status: raw
parent: null
rationale: null
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
blocked_by:
  - tactic-graph-commit-snap-dir-merge-clobbers-original
  - tactic-eval-finding-noop-verdict-hides-dropped-node-edit
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A park preserves the losing writer's content only as a pointer into a per-run tmpdir, so the record that exists to save that content cannot outlive the session that wrote it

## The defect

`park_write()` (`packages/intentionsutil/scripts/graph-commit:2778`) is the
fail-closed path: a concurrent writer landed an overlapping edit, this writer's
content was NOT landed, and the node is parked so a human can merge the two by
hand. The whole purpose of the record is to preserve what the losing writer
meant to say.

It preserves it by **pointing at a path**, not by carrying the content:

- `SNAP_DIR` is a bare `mktemp -d` (`:3479`). `park_and_exit()` sets
  `KEEP_SNAP=1` (`:3038`) so `cleanup()` (`:862`) does not delete it — but that
  survives the process only, not the machine, the tmp reaper, or the container.
- The recommendation text says so itself, twice: the losing writer's content is
  "preserved at `${snapDir}/${id}.md` (this machine only — may not survive past
  this session)" (`:2947`, and again on the delete/modify branch at `:2932`).

That fails this strategy's recorded condition that a park whose context lives
only in the parking session is a defect. It is candidate **(c)** of strategy
clarification 241 (2026-08-15), which adopted candidate (b) — the `SNAP_DIR`
immutability contract owned by
tactic-graph-commit-snap-dir-merge-clobbers-original — and left this one open:
"(b) and (c) are complements, not substitutes; (c) should be filed as its own
tactic rather than folded in."

## Two branches, and only one is fixable the obvious way

`park_write` composes two different recommendations, and they differ in whether
the record reaches `origin/main` at all:

| Branch | Anchor | Does the `office_hours` record land? |
|---|---|---|
| Ordinary lost writer | `:2944-2952` | **Yes** — the park commits `origin/main`'s content plus the `office_hours` block |
| Delete/modify divergence | `:2925-2943` | **No** — by its own text, "this `office_hours` record itself is LOCAL ONLY — it exists nowhere on origin/main, because the node does not" |

So the obvious shape — carry the content in `office_hours.recommendation` —
repairs the first branch and does nothing whatever for the second, where the
writer's edit survives only as an untracked local file that the same tmpdir
caveat is attached to. A fix that addresses only the first branch must say so
rather than claim the whole class.

## Three constraints any fix must satisfy

1. **Verdict idempotence.** `PARK_CONTENT_DIR` (`:428-433`) holds each parked
   node's post-park content, and `print_verdict` compares it byte-for-byte
   against `origin/main` to decide `parked` versus `not-landed` (`:2138-2144`).
   Today the recommendation is a function of the id, the conflict shape and
   `since` — it does **not** vary with the writer's content — so a second losing
   writer parking the same node produces a byte-identical block and reaches the
   idempotent-retry arm documented at `:150-161`. Embedding the writer's own
   content makes the block writer-dependent, and that arm stops firing. Decide
   deliberately whether that is acceptable, or whether the carried content must
   live outside the compared region.

2. **The delete/modify branch** (above) needs either a different durable
   location or an explicit statement that it stays out of scope.

3. **Schema and size.** `office_hours` is `{reason, since, recommendation}`, and
   `recommendation` is a YAML prose scalar. A node body is arbitrary markdown
   containing its own `---` fences and frontmatter, and can be long. Whether
   this needs escaping, a size cap, a new field, or a different store is a
   `packages/intentionsutil/src/schema.ts` decision, not a string-formatting one.

## Out of scope

The `SNAP_DIR` immutability contract itself (candidate (b), owned by
tactic-graph-commit-snap-dir-merge-clobbers-original). The merge algorithm. The
delete/modify park's test and downstream coverage, owned by
tactic-graph-commit-delete-vs-edit-park-hardening.

## Why this is blocked

`blocked_by` names the two nodes this would collide with in the same file, both
of which are units of the graph-write-path PR:

- tactic-graph-commit-snap-dir-merge-clobbers-original rewrites the exact
  recommendation text at `:2944-2952` that a fix here rewrites again. Its unit
  is instructed to leave the seam — to keep the "which content, and where does
  the human find it" decision in one place rather than duplicated across the two
  branches — so this node's change is localized rather than a second sweep.
- tactic-eval-finding-noop-verdict-hides-dropped-node-edit rewrites the verdict
  path that constraint 1 turns on.

Both close when that PR merges. This node is workable after that and not before.

## Reuse

`packages/intentionsutil/scripts/test-graph-commit.sh` is the existing harness
for park-record assertions — case 22 (`:1551-1581`) asserts what `SNAP_DIR`
retains on an unresolved merge, and the prune-direction cases 17 and 23 are the
shape to mirror for a new durability case.
