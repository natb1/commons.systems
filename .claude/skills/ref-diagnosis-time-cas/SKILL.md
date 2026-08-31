---
name: ref-diagnosis-time-cas
description: Diagnosis-time compare-and-swap reference — how a batched drain captures each node's base blob at diagnosis time and pins it through park-node/clear-park --base, and why an exit-3 stale-diagnosis refusal must route back to re-diagnosis rather than to a park.
---

# Diagnosis-Time Compare-and-Swap

## When this applies

The rule is stated by shape, not by caller class: any caller that makes a
decision from a read of a node and later writes that node must capture the
blob at the deciding read and pin it through `--base`. It does not matter
whether the gap is a human interview or a loop over subprocess calls — what
matters is whether a decision was made from a read that a later write could
silently invalidate.

Canonical case: a batched office-hours drain diagnoses several parked nodes,
then interviews the human author about each proposed disposition before
executing any of them — minutes can pass. Without a pin, a fleet write landing
during that interview window would be silently absorbed by park-node's /
clear-park's own execution-time self-refresh of origin/main, including one
that changes what the human should have decided. This is the widest instance
of the shape, not the only one.

Worked example of a narrower instance: `dispatch-tick`'s `frozen_session_sweep`
and `terminal_without_disposition_sweep`
(`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`) fetch
`origin/main` once per sweep, then loop over N candidates, each candidate's
already-parked guard read served from that single fetch, each candidate's
`park-node` call bounded by a 120s timeout over a 60s landing-lock wait.
Observed windows were not "a handful of subprocesses": 351s, 441s, and 809s.
`park-node`'s own fresh `origin/main` re-read is not the guard for this
hazard — it protects against a stale local copy diverging from origin/main,
but it does nothing for a park that lands inside the caller's own
guard-to-write window, because absent `--base` `park-node` has no
already-parked check of its own and overwrites `office_hours`
unconditionally. Before these two sweeps threaded a diagnosis-time `--base`
(this pin landed in this PR), that gap produced four confirmed clobbers on
origin/main in four days — a specific
human-authored `office_hours` park silently overwritten with generic
"session ended without declaring a disposition" boilerplate on the same node:

- `tactic-attention-surface-graph-read` — specific park `1c09ccf1`, clobbered 351s later
- `tactic-explicit-node-reservation-sweep-policy` — `ac4c24f7`, 441s later
- `tactic-office-hours-select-fresh-main` — `69cf82b3`, 809s later

Both sweeps now thread `--base` through their diagnosis-time reads exactly as
described in this reference.

The only genuine exemption is a caller with no guard decision at all: an
unconditional park that would write the same thing regardless of what it
read. That is not a compare-and-swap situation because there is no decision
for a later write to invalidate.

## The three-step protocol

**1. Capture** — at diagnosis time, dump every node under consideration:

```bash
node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts --dir intentions \
  --out-dir <dir> <id>...
```

Prints the manifest path on stdout: `<dir>/base-manifest.txt`, containing
`<id>=<blobsha>` lines, one per id passed.

**2. Interview** — the human reviews the diagnosis and grants (or withholds)
a disposition. No command; this is the human-in-the-loop step that creates the
gap this mechanism protects against.

**3. Execute** — once granted, replay the disposition pinned to the captured
manifest:

```bash
park-node --base <manifest-path> <id> <reason> [recommendation]
clear-park -C <repo-root> --base <manifest-path> <id> [note]
```

One manifest covers a whole batch of nodes: each invocation of park-node or
clear-park selects only its own id's line out of the shared manifest, so a
single `dump-node.ts` capture at the start of a drain serves every disposition
executed later in that drain.

`clear-park` mirrors park-node's `--base <blobsha>|<id>=<blobsha>|<manifest-file>`
shape exactly.

## Exit-code contract

This is park-node's actual exit contract (applies identically to clear-park):

| exit | meaning | caller action |
|---|---|---|
| 0 | landed | done |
| 1 | write / graph-commit failed, or origin/main unreachable / node absent | genuine failure; surface it |
| 2 | usage error (including a malformed or unresolvable `--base`) | fix the invocation |
| 3 | `stale-diagnosis` — the pinned base no longer matches origin/main | re-read the node, re-diagnose, re-interview, retry with a freshly captured base |

`stale-diagnosis` is the stable, machine-greppable marker both scripts print
on stderr on exit 3.

## The re-diagnosis loop

On exit 3: re-dump the node (a fresh manifest), re-read its current content,
re-decide the disposition, re-interview the human if the change is material
to the question originally asked, then retry.

Never convert an exit-3 refusal into an `office_hours` park. The node is
already parked, or already under active human review — re-parking it would
misrecord a mechanical failure where what actually happened is the diagnosis
went stale between capture and execution. Bound the retry loop (2-3 attempts)
and escalate to the human if it won't converge.

## Why not just `graph-commit --base`

`graph-commit`'s own `--base` compare-and-swap (`packages/intentionsutil/scripts/graph-commit`,
`check_base_freshness`, lines ~216-285) does not refuse on a stale base — it
attempts a structural three-way auto-merge and, failing that, silently writes
an `office_hours` park. That's the silent absorption this reference exists to
prevent, and parking a node the human is currently being interviewed about is
the wrong terminal state for an interview-window divergence already under
human review. The pin here is checked earlier, inside the disposition script
itself, before any mutation, with its own exit code (3) distinct from
graph-commit's exit 1.
