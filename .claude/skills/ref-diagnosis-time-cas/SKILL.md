---
name: ref-diagnosis-time-cas
description: Diagnosis-time compare-and-swap reference — how a batched drain captures each node's base blob at diagnosis time and pins it through park-node/clear-park --base, and why an exit-3 stale-diagnosis refusal must route back to re-diagnosis rather than to a park.
---

# Diagnosis-Time Compare-and-Swap

## When this applies

Any caller with a gap between DECIDING a disposition for a node and EXECUTING
it. Canonical case: a batched office-hours drain diagnoses several parked
nodes, then interviews the human author about each proposed disposition before
executing any of them — minutes can pass. Without a pin, a fleet write landing
during that interview window would be silently absorbed by park-node's /
clear-park's own execution-time self-refresh of origin/main, including one
that changes what the human should have decided.

NOT needed for immediate mechanical parks that diagnose and execute in the
same breath — e.g. the Stop-hook backstop (`.claude/hooks/dispatch-stop.sh`),
which parks right after detecting a failure, with no interview gap.

## The three-step protocol

**1. Capture** — at diagnosis time, dump every node under consideration:

```bash
npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir <dir> <id>...
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
clear-park --base <manifest-path> <id> [note]
```

One manifest covers a whole batch of nodes: each invocation of park-node or
clear-park selects only its own id's line out of the shared manifest, so a
single `dump-node.ts` capture at the start of a drain serves every disposition
executed later in that drain.

`clear-park` is described here even though it may not exist yet on
`origin/main` — it lands via the sibling tactic `tactic-clear-park-primitive`,
mirroring park-node's `--base <blobsha>|<id>=<blobsha>|<manifest-file>` shape
exactly.

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
