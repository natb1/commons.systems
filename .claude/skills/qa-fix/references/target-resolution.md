# Step 0 — Node-lane target resolution and parked re-entry guard

Node-lane target resolution runs **once**, in `SKILL.md`'s Idempotency preamble,
through the shared front door `dispatch-derive-node-target`. Step 0 re-derives
nothing — by the time it runs, `N`, `TARGET_KIND`, `PR_NUM`, `NODE_JSON`, and
`NODE_BODY` are already bound. This reference carries the front door's contract,
its exit-code routing, and the parked-guard rationale.

Before `tactic-dispatch-skill-input-contract`, qa-fix derived the node target
**twice** — once in the preamble (a `gh pr list --head` PR lookup) and again at
Step 0 (a `git archive | tar -xO` + `sed`/`grep`/`awk` frontmatter scrape), by two
mutually inconsistent conventions. Both are now the single front-door call below.

## The front-door call (Idempotency preamble)

```bash
FRONT_DOOR=$(.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target \
  "$NODE_ID" --expect-phase qa --pr-mode required)
```

The script validates the node-id slug, asserts the current branch equals
`$NODE_ID`, snapshots `intentions/$NODE_ID.md` from `origin/main`, reads it via
the `intentionsutil` store primitives, gates on `phase == qa`, and resolves the
open PR. `--pr-mode required` is correct for qa-fix: qa never runs without an
open PR, so a miss is a real error, not the legitimate `PR: none` plan-phase
case.

Exit-code routing (`rc`), preserving qa-fix's existing behavior on each path:

| `rc` | Meaning | qa-fix routing |
|---|---|---|
| 0 | success | continue; parse the structured stdout |
| 1 | node absent from `origin/main` / read failure | hard stop, `exit 1` |
| 2 | usage error or branch/node-id mismatch | hard stop, `exit 1` |
| 3 | phase is not `qa` | hard stop, `exit 1` (stderr names the persisted phase) |
| 4 | `--pr-mode required` and no open PR | hard stop, `exit 1` |

The stdout sections bind the seams the rest of the skill keys off: the `PR:` line
→ `PR_NUM` (`none` → empty), `=== NODE-JSON ===` → `NODE_JSON` (the full
frontmatter as one compact JSON line), `=== NODE-BODY ===` → `NODE_BODY` (raw
markdown, replacing the former whole-file frontmatter-plus-body read everywhere
downstream).

## Parked re-entry guard

Parking sets `office_hours` without changing `phase`, so a stale self-scheduled
wakeup re-firing mid-session (bypassing the selector's `office_hours`-null gate)
must not re-run qa-fix against a node already handed to a human. The guard must
agree with the canonical selection gate `readParked`
(`packages/intentionsutil/scripts/check-node-selection.ts:90-93`): a node is
parked iff the first-class `office_hours` is non-null **OR** a populated
`attributes.office_hours` squatter block is present (the squatter convention is
live until `tactic-schema-migration-backfill` lands, and a squatter-parked node
keeps the literal top-level `office_hours: null` alongside the populated block —
so a top-level-only check would miss it).

Against the front door's `NODE_JSON` this is a two-part `jq` OR on typed paths,
not a frontmatter scrape — which also retires the scrape's own hazard of a prose
body line reading exactly `office_hours: null` being mistaken for state:

```bash
PARKED=$(jq -r 'if (.office_hours != null) or ((.attributes.office_hours // null) != null) then "1" else "" end' <<<"$NODE_JSON")
if [ -n "$PARKED" ]; then
  echo "/qa-fix: node '$NODE_ID' is already office_hours-parked at origin/main — nothing to do" >&2
  exit 0
fi
```

`$N` keys the remaining steps' `tmp/` filenames (the issue number on the legacy
lane, the node id on the node lane). `$TARGET_KIND` selects the lane at the seams
that differ — see **Node-target lane** in `SKILL.md`. **On the node lane no gh
issue is ever read or written.**

## Node-lane Step 0.5 — why the in-session `origin/main` merge is skipped

On the node lane, `SKILL.md` Step 0.5 is skipped entirely: the graph launcher
already merged `origin/main` into this worktree before the session started.
`dispatch-graph-execute` provisions the phase-worker's worktree via
`provision-node-worktree`, which runs `git merge --no-edit origin/main`
(`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:123`) as its
step 3 *before* `dispatch-spawn-job` spawns this qa-fix session, so the working
branch is guaranteed post-merge on entry. Re-running the merge in session would be
wasted round-trips.

This mirrors `/review-fix`, which dropped the same redundant merge for its own
phase under design decision `#1426` (see review-fix/SKILL.md Idempotency preamble:
"the dispatch tick merges `origin/main` before spawning this skill"). Like
review-fix, qa-fix still derives every merge-relative value fresh in-session (the
Step 1 local diff, the Step 2a `--diff` pack) rather than trusting a precomputed
value — only the redundant *merge action* is dropped, not any derived value.

The merge-conflict-escalation guarantee is preserved without the in-session merge:
a conflict between this branch and `origin/main` would already have surfaced at
launch time, where `provision-node-worktree` aborts the merge and exits 11 (lines
124-126), failing the launch itself rather than deferring the conflict into the
session.
