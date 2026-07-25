# Idempotency — finding existing children and resuming a partial run

`/align-tactics` decomposes one strategy into N tactics, so idempotency is
**per-tactic**, not a single strategy-level marker. Before planning, read
the strategy's existing non-draft child tactics.

## Finding a strategy's children

The store serializes arrays as YAML **block sequences**, so `serves`
renders as `serves:` on its own line followed by `  - <strategy-id>` — an
inline-flow grep for `serves: [<strategy-id>]` matches nothing. Find the
children with:

```bash
grep -rl '^  - <strategy-id>$' intentions/tactic-*.md
```

or, to see the surrounding `serves:` block:

```bash
grep -B1 -A2 '^  - <strategy-id>$' intentions/tactic-*.md
```

Both anchor on the target id, so neither returns tactics serving a
*different* strategy.

## Classifying each candidate

Read each candidate's `phase` and keep the `phase`-set, non-`draft`/non-`done`
ones:

- A tactic already at `phase: implement` with a plan in its body is done
  work — do not re-plan it.
- A partial prior run (some tactics landed, some not) resumes by planning
  only the missing ones.
- Draft tactics (`phase` absent) are **input**, not landed work: they are
  consumed by the strategy-target flow's decompose phase (finalize / split
  / merge / prune) — **but first check `office_hours`**: a `phase`-absent
  child with `office_hours` set is not an `/align-strategy`-retained draft,
  it is a **born-parked** tactic from a prior round, already-decided
  human-owned work. Skip it (at most reconfirm it is still needed); never
  run it through the finalize/split/merge/prune draft path.

This same `grep -rl` recipe and draft-vs-born-parked disambiguation is what
the strategy-wide re-evaluation sweep uses to enumerate a strategy's open
children (see `references/tactic-target.md`).
