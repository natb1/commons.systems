# Node-target lane detail (`TARGET_KIND=node`)

Referenced from the idempotency preamble. On the node lane, `$N` is the node id
(keys `tmp/` filenames); never pass `--issue`. **On the node lane no gh issue is
ever read or written.**

## Re-keyed seams

Every step runs unchanged except these re-keyed seams:

- **Completion.** Do **not** apply `dispatch:reviewed` via
  `dispatch-complete-phase`, and do **not** call `dispatch-mark-complete` /
  `dispatch-finalize-phase`. Invoke the graph-native transition writer, which
  records the `reviewed` marker in `execution.markers` as one state-only
  graph-commit on `origin/main` and then stops — it does **not** arm or perform any
  merge itself:

  ```bash
  .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"
  ```

  **The Step 7 lint gate precedes this call, exactly as it precedes the issue
  lane's `dispatch:reviewed` apply** — `run-lint.sh` must come back green before
  `transition-node` writes the `reviewed` marker, and a gate still red after its
  two fix attempts skips this call and escalates instead (see
  `terminal-actions.md`, "Gate on the local lint bundle"). The marker is what
  `graph-auto-merge` keys on, so writing it over a red bundle arms the merge of a
  branch this pass itself broke.

  The graph-tick worker runs it with the reset-dance a PR-branch worktree needs;
  the skill hands it the node id and never writes the graph directly. Merging is
  deferred entirely to the tick's `graph-auto-merge` reconciler, which runs every
  tick keyed off the `reviewed` marker: for each reviewed-marked node it senses the
  PR and — only when it is `mergeable == MERGEABLE`, green on CI, the node's
  tactic-scope fingerprint is fresh against `origin/main`, and the branch is up
  to date with the live `origin/main` tip — squash-merges it label-free. A
  branch that is behind is **not** merged: the reconciler updates it against
  main (`PUT .../pulls/<n>/update-branch`, which re-triggers CI on the fresh
  base), reports `merge: synced #<pr> (<id>)`, and defers the merge to a later
  tick that sees CI green on that now-current base.
  `reconcile-graph-merged` then absorbs that out-of-band merge to
  `done`/`main-qa` on a later tick.
- **Deferred findings (Step 5).** On the node lane, deferred/security follow-up
  findings become **draft tactic nodes**, not gh follow-up issues — see the
  node-lane branch in Step 5.
- **Escalation.** Instead of `dispatch:office-hours`, write the reason to
  `$CLAUDE_JOB_DIR/office-hours-reason` (and best-next-steps to
  `$CLAUDE_JOB_DIR/office-hours-recommendation`); `dispatch-tick`'s
  `terminal_without_disposition_sweep` parks the node via `park-node`. See
  `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`. Also write the
  already-bound `PR_NUM` to `$CLAUDE_JOB_DIR/office-hours-pr` (same atomic
  tempfile+`mv` write) so the park records `execution.pr`
  (tactic-office-hours-pr-custody).

## Node-lane re-entry marker check

The node lane has no `dispatch:reviewed` label to test — `transition-node`
records this skill's terminal action as a `reviewed` marker in
`execution.markers`, not a gh label (see the Completion seam above). So the
parallel node-lane check keys on that marker: if `reviewed` is a member of the
node's `execution.markers` list, this is an interrupted prior run — **skip Steps
1–6** and go straight to Step 7's terminal flush, exactly as the label check
routes the issue lane.

Query this from the front door's structured `NODE_JSON` (the full
`intentions/$NODE_ID.md` frontmatter as real JSON, emitted by
`dispatch-derive-node-target` in the preamble). Because `NODE_JSON` is already
parsed JSON, a `jq` query on the exact `.execution.markers` path has no
scraping-ambiguity to guard against — the hazard the superseded `awk` scrape
existed to dodge (a bare `grep` for the token `reviewed` false-matching the node
body, the `validates`/`serves` edges, or a rationale, and wrongly triggering the
skip-Steps-1–6 re-entry path) cannot arise against a typed path. Apply the same
discipline the audit baseline uses — derive from `NODE-JSON`/`origin/main` state,
never from anything that could echo attacker-controlled PR-body text:

```bash
NODE_REVIEWED=""
if jq -e '(.execution.markers // []) | index("reviewed") != null' <<<"$NODE_JSON" >/dev/null; then
  NODE_REVIEWED=1
fi
# Non-empty NODE_REVIEWED => the reviewed marker is already written: skip Steps 1–6.
```

The `reviewed` marker is the node lane's terminal action and is already written,
so re-entry is a no-op beyond that flush, which likewise carries any commits an
interrupted prior run left stranded.

On this re-entry path the Workflow has not run — so Step 7 **skips the phase-log
write entirely** (the prior accurate entry stays durable), treats the deviation
criterion as not met (`result.deviation` is absent), skips the outcome-envelope
emit, and writes the phase-completed marker. Otherwise run all steps in order.
