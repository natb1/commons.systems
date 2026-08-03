# Step 0 — Node-lane target resolution

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
| 3 | the mechanical selection gate rejected the selection (phase, park, fingerprint, align-eligibility, reviewed marker) | clean stop, `exit 0` — a stale selection, not a defect; no graph write, no PR |
| 4 | `--pr-mode required` and no open PR | hard stop, `exit 1` |
| 5 | scope-stale — the tactic's scope changed after the previous phase ran | clean stop, `exit 0` — not a defect, the node wants demoting to `implement` |

The stdout sections bind the seams the rest of the skill keys off: the `PR:` line
→ `PR_NUM` (`none` → empty), `=== NODE-JSON ===` → `NODE_JSON` (the full
frontmatter as one compact JSON line), `=== NODE-BODY ===` → `NODE_BODY` (raw
markdown, replacing the former whole-file frontmatter-plus-body read everywhere
downstream).

## Parked re-entry guard — retired

The front door's selection gate owns the parked check — first-class
`office_hours` and the `attributes.office_hours` squatter alike
(`packages/intentionsutil/scripts/check-node-selection.ts:90-94`, applied at
`:268-270`). A parked node exits 3 above; there is nothing to re-check here.

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
