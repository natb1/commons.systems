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
  `park-node`. See `.claude/hooks/dispatch-stop.sh`. Also write the
  already-bound `PR_NUM` to `$CLAUDE_JOB_DIR/office-hours-pr` (same atomic
  tempfile+`mv` write) so the park records `execution.pr`
  (tactic-office-hours-pr-custody).

## Node-lane re-entry marker check

The node lane has no `dispatch:reviewed` label to test — `transition-node`
records this skill's terminal action as a `reviewed` marker in
`execution.markers`, not a gh label (see the Completion seam above). So the
parallel node-lane check keys on that marker: if a `reviewed` marker **valid for
the current scope** is a member of the node's `execution.markers` list, this is an
interrupted prior run — **skip Steps 1–6** and go straight to Step 7's terminal
flush, exactly as the label check routes the issue lane.

"Valid for the current scope" is what makes the check evidence-bound rather than
name-bound. A marker entry is either a bare string (legacy, unbound) or an object
`{ marker, fingerprint, sha }` bound to the scope fingerprint the phase started
under (`packages/intentionsutil/src/schema.ts`'s `MarkerEntry`). Three cases,
matching `markerEvidenceStale` in
`packages/intentionsutil/src/transitions.ts`:

- **bound, fingerprint == `SCOPE_FINGERPRINT`** — valid: the review that wrote it
  covered the scope now in force. Re-entry is a no-op.
- **bound, fingerprint != `SCOPE_FINGERPRINT`** — the node's scope changed after
  the review ran, so that evidence ratifies a superseded plan. **Not** valid:
  run Steps 1–6 in full.
- **unbound (bare string)** — grandfathered as valid. No fingerprint was
  recorded, so staleness is unknowable and the entry fails OPEN. That fail-open
  is a bootstrap policy, not the end state — it flips to fail-CLOSED once every
  marker writer binds a fingerprint and the pre-existing unbound entries have
  churned out of the store.

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
if jq -e --arg fp "$SCOPE_FINGERPRINT" '
      [ (.execution.markers // [])[]
        | if type == "string" then { marker: ., fingerprint: null } else . end ]
      | any(.marker == "reviewed" and (.fingerprint == null or .fingerprint == $fp))
    ' <<<"$NODE_JSON" >/dev/null; then
  NODE_REVIEWED=1
fi
# Non-empty NODE_REVIEWED => valid terminal evidence for the CURRENT scope: skip
# Steps 1–6. A reviewed marker bound to a DIFFERENT fingerprint leaves this
# empty, so the phase re-runs in full instead of being ratified.
```

The normalizing map (`if type == "string" then { marker: ., fingerprint: null }`)
is what lets one expression read both marker shapes; the `fingerprint == null`
disjunct is the legacy grandfather.

When the marker is valid, it is the node lane's terminal action and is already
written, so re-entry is a no-op beyond that flush, which likewise carries any
commits an interrupted prior run left stranded.

On this re-entry path the Workflow has not run — so Step 7 **skips the phase-log
write entirely** (the prior accurate entry stays durable), treats the deviation
criterion as not met (`result.deviation` is absent), skips the outcome-envelope
emit, and writes the phase-completed marker. Otherwise run all steps in order.
