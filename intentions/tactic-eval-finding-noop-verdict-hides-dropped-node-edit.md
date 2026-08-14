---
id: tactic-eval-finding-noop-verdict-hides-dropped-node-edit
kind: tactic
statement: When local main carries any unpushed commit, graph-commits far-ahead
  rebuild path resets the tree to origin/main and its false-landed guard then
  compares two blobs that are equal by construction, so an EDIT to an existing
  node can be dropped while graph-commit reports verdict landed context=noop and
  dispatch-eval-finding prints landed — and the callers own post-write
  verification cannot catch it because it hashes the local working-tree path
  graph-commit is entitled to leave on a different base, false-negating on every
  successful write in the same batch
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: silent_write_losses
      value: 1
      unit: writes
      window: dispatch-eval-finding batch landing the tactic-attention-namespaced-rank
        review-phase findings, 2026-08-14T02:00Z-02:25Z
      sensor: rsi
      measured: 2026-08-14
    - metric: writes_attempted_in_batch
      value: 5
      unit: writes
      window: dispatch-eval-finding batch landing the tactic-attention-namespaced-rank
        review-phase findings, 2026-08-14T02:00Z-02:25Z
      sensor: rsi
      measured: 2026-08-14
    - metric: false_negative_post_write_verifications
      value: 4
      unit: verifications
      window: dispatch-eval-finding batch landing the tactic-attention-namespaced-rank
        review-phase findings, 2026-08-14T02:00Z-02:25Z
      sensor: rsi
      measured: 2026-08-14
    - metric: guards_present_but_unreachable_on_path
      value: 2
      unit: guards
      window: graph-commit rebuild path plus dispatch-eval-finding post-write check,
        read at 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: node_body_bytes_lost_then_recovered
      value: 5670
      unit: bytes
      window: dispatch-eval-finding batch landing the tactic-attention-namespaced-rank
        review-phase findings, 2026-08-14T02:00Z-02:25Z
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed

2026-08-14, main checkout, while landing the five `review`-phase findings of
`tactic-attention-namespaced-rank` through `dispatch-eval-finding`.

Four of the five were **new** nodes and landed. The fifth was an **edit** to an
existing node (a recurrence of `eval-write-blocked-by-unrelated-main-dirt`: a
~5.7 KB body append plus a `recurrence_count` bump 2 → 3). It did not land, and
every layer reported that it had:

```
graph-commit: worktree HEAD is ahead of origin/main with non-intentions changes
  — rebuilding the edit on an intentions/-only base (HEAD restored on exit)
HEAD is now at 4666cf8a graph: record finding ledger entry workflow-file-writes-...
graph-commit: no new changes to stage for tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt
  and HEAD is already origin/main (4666cf8a) — nothing to push; skipping the landing cycle
graph-commit: verdict: landed ids=... pushed=none main=4666cf8a context=noop
dispatch-eval-finding: recorded a recurrence of ... (was open)
landed
```

`origin/main` still held the pre-edit body and `recurrence_count: 2`. Confirmed
by reading the node back at `origin/main`, not by inference:

```
git show origin/main:intentions/tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt.md \
  | grep -c 'post-write check reads the wrong tree'   # -> 0
```

Re-running the identical invocation from a checkout at `origin/main` landed it
for real (`pushed=b546b1df`, body 8597 → 14267 bytes, count 2 → 3). Nothing about
the body file, the statement or the impact records changed between the two calls.
**The only difference was local `main` sitting one commit ahead of
`origin/main`** — an unpushed `flake.lock` bump, itself committed to clear
graph-commit's unrelated-dirty-tracked-file refusal.

# The finding: two guards exist for exactly this, and both are structurally blind

This is not "a guard was missing". Two were present and neither could fire.

### Guard 1 — graph-commit's own false-`landed` die cannot see a reset tree

`graph-commit:3261` dies with *"Refusing to emit a false 'landed' for a tree that
was never going to carry the caller's edit."* It keys the decision on
`HEAD:intentions/<id>.md` vs `MAIN_SHA:intentions/<id>.md` (`:3252-3254`).

The far-ahead rebuild path (`ensure_intentions_only_base`, `:3201`) has just run
`git reset --hard "$MAIN_SHA"` (`:1192`). After that reset those two blobs are
equal **by construction**, for every id, always. So `:3254` `continue`s, the die
at `:3261` is unreachable on this path, control falls to the
`head_sha == main_sha` short-circuit at `:3270`, and `emit_verdict_and_exit noop`
reports success.

The invariant nobody checks: **the writer's intended content is never compared
against what reached `origin/main`.** `SNAP_DIR` is documented at `:885` as
holding "the content THIS RUN INTENDS TO LAND" and is deliberately captured at
`:3176` before both the freshness check and the reset — but no code path
compares it to the landed result. Every guard compares two views of the
repository to each other, never either one to the caller's intent.

Note the lineage: the `noop` short-circuit at `:3270` exists because of
tactic-graph-commit-noop-landing-false-failure, which cured a no-op write being
reported as a *false failure*. The cure introduced the opposite error on a path
that fix did not consider. This finding is that fix's regression surface.

### Guard 2 — the caller's post-write verification reads the wrong tree

`dispatch-eval-finding` already performs a post-write blob verification — the
correct instinct, and the doctrine tactic-graph-commit-landing-signal-unreliable
codified ("no caller can tell a landed write from an orphaned one without
re-parsing origin/main"). But it hashes the **local working-tree path**, which
graph-commit is explicitly entitled to leave on a different base. On all four
*successful* mints in this same batch it printed:

```
fatal: could not open '.../intentions/tactic-eval-finding-<slug>.md': No such file or directory
dispatch-eval-finding: could not hash ... for post-write verification
dispatch-eval-finding: minting tactic-eval-finding-<slug> could not be verified on origin/main
```

All four were present at `origin/main`. So the verifier is a **false negative on
every success** and **silent on the one real loss** — it says "could not be
verified on origin/main" while reading a path that is not `origin/main` at all.
Having cried wolf on four healthy writes, it carries no signal for the fifth.

# What would have to change

Two edits, independent, either of which catches this class:

1. **`dispatch-eval-finding` — verify against `origin/main`, not the checkout.**
   Replace the local-path hash with
   `git show origin/main:intentions/<id>.md`, or hash the pushed sha graph-commit
   already reports in its verdict line. This is the cheap one: a couple of lines,
   it fixes the false negative and the false positive together, and it is what
   the script's own message already claims to be doing.

2. **`graph-commit` — assert intent against outcome before `noop`.**
   Before `emit_verdict_and_exit noop` at `:3276`, for each id compare
   `SNAP_DIR/<id>.md` against `MAIN_SHA:intentions/<id>.md`. Byte-identical is a
   genuine no-op; different means the caller's edit was dropped — die or park,
   never report `landed`. This is the same reasoning already written at `:3261`,
   applied to the one path where the reset erases the difference it looks for.

A `noop` verdict on an invocation that passed `--base` for an **already-existing**
node deserves particular suspicion: the caller demonstrably believed it was
changing something.

# Still open: where the edit was actually lost

The mechanism above explains why the loss was **reported as success**. It does
not explain the loss. Evidence rules out the obvious candidate: graph-commit took
its `! id_files_dirty` branch (`:3207`), so the working tree already matched HEAD
when graph-commit ran; and the fork and main blobs were identical
(`2a8fe22d57ce218b4520d62610afa2b219d35198` at both `c59b5f1c` and `4666cf8a`),
so `replay_snapshot_onto_base` would have taken its fast path (`:1123-1126`) and
copied the snapshot back. The spliced body therefore appears to have been absent
from disk **before** `snapshot()` ran at `:3176` — i.e. lost inside
`dispatch-eval-finding`'s recurrence path (`splice_body`, invoked at `:801-802`),
not inside graph-commit.

That is unresolved and should be reproduced directly: commit any non-intentions
change to a main checkout without pushing, then drive a recurrence through
`dispatch-eval-finding` and inspect the node file on disk immediately before the
`graph-commit` call. An earlier write-up of this occurrence asserted that
`reset --hard` discarded the edit; the blob evidence above contradicts that, and
the wrong mechanism would send the fix to the wrong file.

# Trigger and blast radius

Armed by **any unpushed local commit on the main checkout** — including one made
to satisfy graph-commit's own dirty-tree refusal. Committing unrelated dirt to
unblock a graph write therefore trades a loud failure for a silent one; only
pushing clears both. Every graph write from that checkout takes the rebuild path
until it is pushed, and on that path any write that is an *edit to an existing
node* can be dropped while reporting `landed`.

Not applied here; this is a record.

Related: tactic-graph-commit-noop-landing-false-failure (whose fix this
regresses), tactic-graph-commit-landing-signal-unreliable (whose doctrine guard 2
implements against the wrong tree), tactic-graph-commit-rebuild-snapshot-stale-revert
(the same rebuild path, opposite direction — landing stale content rather than
dropping fresh content), tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt
(the refusal whose workaround arms this).
