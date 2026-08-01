---
id: tactic-fleet-alarm-mint-rollback-corruption
kind: tactic
statement: dispatch-fleet-alarm's mint-failure rollback can leave a corrupted
  0-byte node file that breaks listNodes() fleet-wide, stalling all dispatch
  for hours
owner: ai
status: raw
parent: null
rationale: "Discovered 2026-08-01 while investigating why the fleet showed 0
  busy workers for 6+ hours. Root cause: two untracked, 0-byte files —
  intentions/tactic-fleet-alarm-busy-stall.md and
  intentions/tactic-fleet-alarm-watch-unknown.md — existed on disk in the main
  checkout (/home/n8/natb1/commons.systems) but were absent from git entirely
  (git ls-files empty, git status showed `??`). packages/intentionsutil/src/store.ts's
  listNodes() throws IntentionSchemaError (\"missing an opening \\\"---\\\"
  frontmatter fence\") on ANY malformed file in intentions/, uncaught, which
  crashes every caller that enumerates the whole directory — confirmed crashing
  dispatch-graph-main-red-sync (reported UNKNOWN instead of a real red-sync
  read) and strongly suspected of crashing dispatch-select-tick's node
  enumeration (routing-decisions.jsonl showed target:none / at-cap-no-priority
  with target_n:0, effective_live:0 for hours — consistent with, though not yet
  proven to be caused by, every candidate-selection pass failing before it
  could select anything). journald showed dispatch-fleet-watch (the new
  systemd-based watchdog shipped by tactic-fleet-watchdogs-session-scoped /
  PR #3008, whose broken systemd install this same investigation session had
  just repaired) calling dispatch-fleet-alarm to mint an alarm node for a
  detected busy-stall condition, and dispatch-fleet-alarm's own log recorded
  \"minting tactic-fleet-alarm-watch-unknown failed; the write was rolled
  back\" — i.e. the script's OWN rollback path (dispatch-fleet-alarm lines
  568-579: on failure, restore_from_blob if a PRE_BLOB existed, else `rm -f
  \"$NODE_FILE\" \"$NODE_FILE.tmp\"`) ran and still left a 0-byte file behind.
  Not yet pinned to one exact line: write-node.ts's own writeNode()
  (store.ts:44-55) writes via a single atomic writeFileSync of fully-assembled
  content, which should not itself produce a 0-byte file, so the corruption's
  precise origin (a step before writeNode failing to have created anything yet
  contradicts the observed 0-byte file existing at all; or the splice_body
  shell function at dispatch-fleet-alarm:341-344, whose `{ awk ...; cat
  \"$BODY_FILE\"; } > \"$NODE_FILE.tmp\" && mv \"$NODE_FILE.tmp\" \"$NODE_FILE\"`
  idiom creates/truncates NODE_FILE.tmp via shell redirection regardless of
  whether the awk/cat pipeline inside actually produced content, is the
  strongest remaining suspect) needs a session with time to trace it with
  captured stderr from a live failure, not reconstructed after the fact.
  Removing both stray files (git status confirmed untracked, so deletion was
  purely a local filesystem cleanup, no git history at risk) immediately fixed
  listNodes() (verified: 468 nodes enumerate cleanly again) and is presumed but
  not yet confirmed to have unstuck the fleet — the next tick's outcome is the
  actual confirmation."
reading: null
gap: "Not yet confirmed: (1) the exact code path that leaves the 0-byte file
  despite the rollback branch executing (splice_body's redirection-before-
  pipeline-check idiom is the leading suspect but unverified against a live
  repro); (2) whether this was the ROOT cause of the 6h busy-stall or a
  compounding secondary failure that started ~2h16m after the stall began
  (busy-stall counter read 22515s since epoch 1785555951 = 2026-08-01T03:45:51Z;
  the corrupted files' mtime was 2026-08-01T06:01:08Z) — the earlier gap
  (03:45Z-06:01Z) has a separate, still-unexplained cause; (3) whether the
  fleet actually resumed dispatching after this session removed the corrupted
  files, or whether some other blocker remains — check the next tick's
  routing-decisions.jsonl entries and BUSY count once enough time has passed."
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: "dispatch-fleet-alarm's mint-failure path never leaves a
    malformed file in intentions/ on disk, verified by a fault-injection test
    (force write-node.ts or splice_body to fail mid-mint) that asserts the
    target file is either fully absent or fully valid frontmatter afterward"
  sensor: test-dispatch-fleet-alarm.sh
  threshold: "new fault-injection test case passes; existing suite unaffected;
    additionally, listNodes() gains a defensive per-file try/catch so ONE
    malformed node file degrades to a per-file skip+warning rather than
    crashing every caller that enumerates the whole directory (a much larger,
    separately-scoped hardening — record here as a candidate, decide scope in
    /align-tactics)"
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# dispatch-fleet-alarm's mint-failure rollback can leave a corrupted 0-byte node file that breaks listNodes() fleet-wide, stalling all dispatch for hours

Draft finding, not yet decomposed — recorded here per the standing rule that
findings and UNKNOWNs land as graph nodes, never journald or plan prose alone.
This is a HIGH-severity finding: the observed blast radius was the entire
fleet's dispatch pipeline, not one node.

## What was observed

On 2026-08-01, `claude agents --json --all` showed 0 busy workers with the
concurrency cap at 3, and `dispatch-graph-main-red-sync` returned `UNKNOWN`
with a crash trace:

```
IntentionSchemaError: Node tactic-fleet-alarm-busy-stall is missing an opening "---" frontmatter fence
    at extractFrontmatter (.../packages/intentionsutil/src/frontmatter.ts:15:11)
    at parseNodeRaw (.../packages/intentionsutil/src/store.ts:107:29)
    at readNode (.../packages/intentionsutil/src/store.ts:119:10)
    at listNodes (.../packages/intentionsutil/src/store.ts:148:6)
```

Two files existed on disk in the main checkout, both untracked (`git status`
showed `??`, `git ls-files` returned nothing for either) and both exactly
0 bytes:

- `intentions/tactic-fleet-alarm-busy-stall.md`
- `intentions/tactic-fleet-alarm-watch-unknown.md`

`journalctl --user -t dispatch-fleet-watch` recorded the mint attempts and
their failure directly:

```
dispatch-fleet-alarm: minting tactic-fleet-alarm-watch-unknown failed; the write was rolled back
dispatch-fleet-watch: dispatch-fleet-alarm --kind watch-unknown failed; this pass is journald-only for that finding
```

`dispatch-fleet-alarm`'s own rollback branch (the script that logged that
message) is designed to clean up on failure:

```bash
if ! ( cd "$REPO_ROOT" || exit 1; "${WRITE_NODE_CMD[@]}" --file "$TMP_DIR/$ID.json" || exit 1 ) 1>&2 \
   || ! splice_body || ! run_graph_commit -m "graph: fleet alarm $KIND" "$ID"; then
  if [[ -n "$PRE_BLOB" ]]; then
    restore_from_blob "$PRE_BLOB"
  else
    rm -f "$NODE_FILE" "$NODE_FILE.tmp"
  fi
  log "minting $ID failed; the write was rolled back"
  exit 1
fi
```

For a fresh mint (`absent` state), `PRE_BLOB` is empty (the node has no prior
`origin/main` content), so the rollback should take the `rm -f "$NODE_FILE"
"$NODE_FILE.tmp"` branch — yet the 0-byte `$NODE_FILE` (i.e.
`intentions/$ID.md`) survived. Either that `rm -f` line did not run (the
overall `if` condition may not have been true — i.e. something downstream of
the file being created returned success despite the file being empty), or it
ran and something re-created the empty file afterward, or the crash happened
in a way bash's error propagation didn't route through this `if` at all (e.g.
a `set -e`-style abort, or a signal).

## Why this broke the whole fleet, not just one node

`listNodes()` (`store.ts:148`) has no per-file error isolation — it maps every
`.md` file in `intentions/` through `readNode`, and a single malformed file
throws an uncaught exception that propagates out of the entire call. Every
script that calls `listNodes()` over the full directory (not a single-node
`readNode`) inherits this fragility: `dispatch-graph-main-red-sync` (confirmed
crashing → `UNKNOWN`), and very likely `dispatch-select-tick`'s own candidate
enumeration and `validate-graph.ts` (unconfirmed — the routing log showed
`target:none` / `at-cap-no-priority` / `target_n:0` / `effective_live:0` for
hours, consistent with every tick's selection pass failing before it could
select anything, but this session did not directly instrument a crash trace
for `dispatch-select-tick` itself — flagged as unconfirmed in the node's
`gap`).

Separately, this session's own live investigation observed several OTHER
tactic nodes (`tactic-attention-boost-scripts`, `tactic-graph-router-live-
worker-read-robust`, `tactic-stale-hold-auto-resolve`) sitting with dirty,
uncommitted `execution.fix` markers in the main checkout's working tree with
unusually high `attempt` counters (26, 28) — consistent with repeated failed
write-then-commit cycles (each retry incrementing the counter, each attempt
presumably crashing on the same `listNodes()` corruption before it could
land), though this session did not fully trace those specific failures back
to this root cause and that correlation should be treated as a working
hypothesis, not a confirmed fact.

## Immediate remediation taken (this session, 2026-08-01)

Both stray files were untracked (confirmed via `git status --porcelain` and
`git ls-files` before touching them — no git history at risk), so they were
removed directly (`rm intentions/tactic-fleet-alarm-busy-stall.md
intentions/tactic-fleet-alarm-watch-unknown.md`). `listNodes()` was
re-verified working immediately after (468 nodes enumerated cleanly). The
dirty `execution.fix`-marker files in the main checkout were left untouched —
they may represent legitimate in-flight retry state that the fleet's own next
cycle can resolve now that the blocker is gone; discarding them without
understanding the writer's intent would risk losing real state.

## Open questions (see `gap` in frontmatter)

Whether this was the actual root cause of the ~6h busy-stall, or whether an
earlier, separate cause (the stall's own start time, 03:45:51Z, precedes the
corrupted files' mtime of 06:01:08Z by over 2 hours) needs its own
explanation. Whether the fleet actually resumed after this session's fix
needs to be confirmed against a later tick's `routing-decisions.jsonl` and a
fresh `BUSY` read, not assumed.

## Shape of a fix (not yet decided — decompose in `/align-tactics`)

1. Harden `listNodes()` (or add an opt-in wrapper) to skip and warn on a
   single malformed file rather than throwing for the whole directory —
   the single highest-leverage fix, since it bounds the blast radius of
   ANY future corruption (from this bug or any other future writer bug) to
   one node instead of the whole fleet.
2. Trace and fix `dispatch-fleet-alarm`'s actual rollback gap — likely in
   `splice_body`'s shell redirection ordering, but confirm against a live
   fault-injection repro rather than guessing.
3. Add a fault-injection test to `test-dispatch-fleet-alarm.sh` that forces
   a mint failure partway through and asserts the target file is fully
   absent or fully valid afterward, never a partial/empty write.
