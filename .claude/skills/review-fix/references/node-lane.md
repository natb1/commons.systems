# Node-target lane detail (`TARGET_KIND=node`)

Referenced from the idempotency preamble. On the node lane, `$N` is the node id
(keys `tmp/` filenames); never pass `--issue`. **On the node lane no gh issue is
ever read or written.**

## Re-keyed seams

Every step runs unchanged except these re-keyed seams:

- **Completion.** Do **not** apply `dispatch:reviewed` via
  `dispatch-complete-phase`, and do **not** call `dispatch-mark-complete` /
  `dispatch-finalize-phase`. Invoke the graph-native transition writer, which
  records the `reviewed` marker in `execution.markers` and — on a clean review —
  arms gh auto-merge (same config gate as today), all as one state-only
  graph-commit on `origin/main`; the reconciler sweep absorbs the out-of-band
  merge to `done`:

  ```bash
  .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"
  ```

  The graph-tick worker runs it with the reset-dance a PR-branch worktree needs;
  the skill hands it the node id and never writes the graph directly.
- **Deferred findings (Step 5).** On the node lane, deferred/security follow-up
  findings become **draft tactic nodes**, not gh follow-up issues — see the
  node-lane branch in Step 5.
- **Escalation.** Instead of `dispatch:office-hours`, write the reason to
  `$CLAUDE_JOB_DIR/office-hours-reason` (and best-next-steps to
  `$CLAUDE_JOB_DIR/office-hours-recommendation`); the Stop hook parks the node via
  `park-node`. See `.claude/hooks/dispatch-stop.sh`.

## Node-lane re-entry marker check

The node lane has no `dispatch:reviewed` label to test — `transition-node`
records this skill's terminal action as a `reviewed` marker in
`execution.markers`, not a gh label (see the Completion seam above). So the
parallel node-lane check keys on that marker: if `reviewed` is a member of the
node's `execution.markers` list, this is an interrupted prior run — **skip Steps
1–6** and go straight to Step 7's terminal flush, exactly as the label check
routes the issue lane.

Parse this from the already-fetched `NODE_MD` (the `intentions/$NODE_ID.md`
frontmatter read from `origin/main` in the preamble) with a **scoped** match —
not a naive `grep -q reviewed <<<"$NODE_MD"`. `execution.markers` is a nested
YAML list (`  markers:` under the top-level `execution:` key, with `    -
<marker>` items), so a bare `grep` for the token `reviewed` would false-match it
appearing in the node body, the `validates`/`serves` edges, a rationale, or any
other field, and wrongly trigger the skip-Steps-1–6 re-entry path — bypassing
the actual review pass. Isolate the markers list to the execution block and test
for an exact `reviewed` list item:

```bash
NODE_REVIEWED=$(printf '%s\n' "$NODE_MD" | awk '
  $0 == "execution:"          { in_exec = 1; next }
  in_exec && /^[^[:space:]]/  { exit }                  # new top-level key ends the execution block
  in_exec && /^  markers:/    { in_markers = 1; next }
  in_exec && in_markers && /^  [^[:space:]]/ { in_markers = 0 }  # next execution key ends the list
  in_markers && /^    - reviewed[[:space:]]*$/ { print "1"; exit }
')
# Non-empty NODE_REVIEWED => the reviewed marker is already written: skip Steps 1–6.
```

The `reviewed` marker is the node lane's terminal action and is already written,
so re-entry is a no-op beyond that flush, which likewise carries any commits an
interrupted prior run left stranded.

On this re-entry path the Workflow has not run — so Step 7 **skips the phase-log
write entirely** (the prior accurate entry stays durable), treats the deviation
criterion as not met (`result.deviation` is absent), skips the outcome-envelope
emit, and writes the phase-completed marker. Otherwise run all steps in order.
