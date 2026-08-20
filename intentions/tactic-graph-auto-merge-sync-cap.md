---
id: tactic-graph-auto-merge-sync-cap
kind: tactic
statement: graph-auto-merge's behind-branch sync arm must be capped by a count
  of THIS gate's own update-branch syncs — distinguished from a worker's local
  git merge by commit subject — so a PR that keeps losing the sync-versus-main
  race is held for a person instead of paying a full CI run every tick forever
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-13 to give a name to a tactic the shipped code already
  cites. graph-auto-merge names this id twice — at :95 in its ordered gate list
  and at :427 on the implementation block — and no such node existed.
  validate-graph only scans node prose for cross-references, so CI stayed green
  on a dangling code-to-graph citation; that is exactly the 2026-07-18 incident
  class the check was written for, and shipped code naming a phantom tactic is
  the failure it is supposed to make impossible. The substance covers PR #3073's
  review Units 10 and 12. Unit 10 added the cap: the sync arm introduced by
  tactic-graph-auto-merge-up-to-date-gate is self-limiting per HEAD (each sync
  moves the oid, so one oid is never synced twice) but NOT per PR, because the
  sync re-triggers a 10-20 minute CI run during which main can move again, so a
  PR under contention can lose that race indefinitely with no bound. Unit 12
  corrected the counter, which is the substantive half: counting every
  multi-parent commit held healthy PRs at the cap before this gate had synced
  them even once, because commit-merge-push runs `git merge origin/main` at the
  end of every implement unit and every fix pass. Measured on PR #3068: 4
  multi-parent commits, of which exactly 1 was this gate's own sync."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: dispatch-ladder-e2e-unblock
  pr: 3073
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T00:21:45Z
    mergeCommitSha: 3fea9f35f7aeaf5ae48623c87cbf0724c9f5f819
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-auto-merge's behind-branch sync arm must be capped by a count of THIS gate's own update-branch syncs — distinguished from a worker's local git merge by commit subject — so a PR that keeps losing the sync-versus-main race is held for a person instead of paying a full CI run every tick forever

## Why this node exists at all

This node is filed **retroactively, at `phase: done`**, because the shipped
code already cites it by id and no node answered to that id.

`graph-auto-merge` names `tactic-graph-auto-merge-sync-cap` twice — at `:95`,
in the header's ordered gate list, and at `:427`, on the implementation block
itself. `validate-graph.ts` resolves cross-references found in **node prose**,
so a code comment naming a nonexistent tactic does not fail it: CI stayed green
on a dangling citation.

That is precisely the 2026-07-18 incident class the prose-reference check was
written for. A reader of the code follows the id into the graph expecting the
decision record and finds nothing, and the graph — which is supposed to be the
authoritative account of why the dispatch harness behaves as it does — has a
hole exactly where a merge gate was added. Filing the node closes the citation;
it does not add or change any code.

## The defect the cap closes (Unit 10)

`tactic-graph-auto-merge-up-to-date-gate` added the sync arm: a reviewed,
green, mergeable PR whose branch is behind `origin/main` is not merged but
**synced** — `gh_pr_update_branch_rest` merges main into the PR head — and the
merge is deferred to a later tick that sees CI green on the now-current base.

That arm is self-limiting **per HEAD** and not **per PR**. Each sync moves the
head oid, so the same oid is never synced twice; but the sync re-triggers CI,
that run takes 10–20 minutes, main can move again inside that window, and the
next tick syncs again. Because this is the only autonomous merge path, a PR
under contention can lose that race indefinitely — paying a full CI run per
cycle, forever, with no bound and nothing that escalates.

The remedy is a cap, and a **hold** rather than a silent skip at the cap:
`held <id> (sync-cap: <n> syncs)` at `GRAPH_AUTO_MERGE_SYNC_MAX` (default 3).
A hold is right because a thrashing PR needs a person — rebase it, land it
manually, split it — which is exactly what the `held` verdict means here.

## What Unit 12 corrected, and why it is the substantive half

The first counter counted every multi-parent commit on the PR. That is wrong,
and wrong in the direction that hurts: it **held healthy PRs at the cap before
this gate had synced them even once**.

A multi-parent commit does not identify a sync. `commit-merge-push` runs
`git merge origin/main` at the end of every implement unit and every fix pass,
so an ordinary multi-unit PR carries several worker merges this gate never
made.

The two forms are distinguishable by commit subject, because different
mechanisms write them:

| Mechanism | Subject written |
|---|---|
| GitHub update-branch API (`gh_pr_update_branch_rest`) | `Merge branch 'main' into <head-ref>` |
| local `git merge origin/main` (commit-merge-push) | `Merge remote-tracking branch 'origin/main' into <head-ref>` |

So the counter selects multi-parent commits whose subject **starts with**
`Merge branch 'main'`. That count is this gate's own footprint, read straight
from GitHub, with nothing to persist, sweep or race — and correct across
processes and hosts, which a local counter would not be. The multi-parent
predicate is retained as well, since a non-merge commit could in principle
carry that subject.

### Measured evidence

On PR #3068: **4 multi-parent commits, of which exactly 1 was this gate's own
sync.** With `SYNC_MAX` at 3, the naive counter would have held that PR at the
cap after the gate had synced it once. The corrected counter reads 1.

### Two caveats, both recorded in the code

- A person who runs `git merge main` by hand (the local branch, not
  `origin/main`) writes the same subject and is counted. No script in this repo
  does that — every scripted merge names `origin/main` — so it takes a rare
  human action, and it **over**-counts, failing closed into an unnecessary
  hold, which is that person's call anyway.
- `per_page=100` bounds the listing (`gh_api_array` does not paginate), so a PR
  with more than 100 commits **under**-counts and fails open, permitting
  another sync. That is the better direction to be wrong on a large PR.

## Where it lives

- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:95-108` — the
  gate list entry and the doctrine.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:427-482` — the
  counter, the non-numeric guard, the hold, and the caveats.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:125` — the stdout
  protocol's `sync-cap: <n> syncs` hold reason.
- `GRAPH_AUTO_MERGE_SYNC_MAX` — the tunable, default 3.

Pinned by `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh`,
wired at `.github/workflows/unit-tests.yml:199`.

## Shipped 2026-08-13 — PR #3073, merge `3fea9f35`

Landed as review Units 10 and 12 of the `/dispatch-ladder` e2e-unblock PR
(`f3fcdbce` added the cap, `6f1f1e35` corrected the counter). No further code
work is owed by this node; it is a record, filed to make the code's citation
resolve.
