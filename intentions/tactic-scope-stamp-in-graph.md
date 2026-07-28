---
id: tactic-scope-stamp-in-graph
kind: tactic
statement: Move the tactic scope-custody stamp out of gitignored machine-local
  files and into the graph, so the gate that decides whether a node's phase
  state is trustworthy is itself part of the record rather than local filesystem
  state a fresh clone silently lacks
owner: ai
status: raw
parent: null
rationale: "The scope-custody chain gates every pre-merge phase transition, but
  its stamp lives at <main-root>/.claude/worktrees/<id>.scope-fingerprint, which
  .gitignore:1 (`worktrees/`) excludes from the repo — 0 of 60 live stamps are
  tracked. isScopeStale treats a null stamp as NOT stale
  (packages/intentionsutil/src/transitions.ts:331), the documented bootstrap
  fail-open, so on a fresh clone or a second machine every node reads as fresh
  and the chain-of-custody guarantee silently evaporates. This contradicts the
  standing preference that the graph always reflects target state (strategy
  clarification 2026-07-27): the state deciding whether the graph can be trusted
  is not in the graph. It also forces every legitimate author documentation edit
  through an out-of-band side-channel write (restamp-scope-fingerprint.ts) that
  leaves no trace in git and no reviewable record that a scope-inert
  classification was made. Distinct from
  tactic-scope-fingerprint-plan-substance, which narrows WHAT the fingerprint
  hashes but leaves the stamp out-of-graph, and from
  tactic-transition-node-stamp-landed-body, which repairs WHEN the machinery
  refresh runs. Filed 2026-07-27 /align-strategy."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# Move the tactic scope-custody stamp out of gitignored machine-local files and into the graph, so the gate that decides whether a node's phase state is trustworthy is itself part of the record rather than local filesystem state a fresh clone silently lacks

## Context

The tactic scope-custody chain (strategy `§Fingerprint & Freeze`, entry 39) is
the guarantee that a pre-merge phase runs only against the scope the previous
phase ran against. Its enforcement reads one file per node:

- `<main-root>/.claude/worktrees/<id>.scope-fingerprint`, format
  `<fingerprint> <origin-main-sha>` (`parseScopeStamp`,
  `packages/intentionsutil/src/transitions.ts:319`).

That path is **gitignored** — `.gitignore:1` is `worktrees/` — and nothing
writes it into the repo. Measured 2026-07-27: 60 live stamps on this machine,
**0** tracked in git.

The consequence is a silent, total loss of the guarantee off this machine:

- `isScopeStale(null, fp)` returns `false` (`transitions.ts:331`) — the
  documented bootstrap fail-open.
- `listScopeStaleTactics` skips any node whose stamp file is missing
  (`packages/intentionsutil/src/scope-sweep.ts`, `readStampedFingerprint`
  ENOENT → `null` → `continue`).
- So on a fresh clone, a second machine, or after any loss of
  `.claude/worktrees/`, **every** node reads as scope-fresh and no node is ever
  demoted. The chain is reported intact while unenforced.

A second cost falls on ordinary authoring. Because the stamp is out-of-band,
the sanctioned scope-inert re-stamp (entry 73, shipped as
`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts`) writes a file
that leaves no trace in git — no diff, no reviewer visibility, no record that
an author classified an edit as scope-inert. The classification is fail-closed
by policy but unauditable by construction.

## Target behavior

The stamp becomes part of the graph record, so that the state gating phase
progression travels with the repo and is reviewable in a diff. Sketch, to be
settled at `/align-tactics`:

- The per-phase scope stamp is persisted on the node (natural home:
  `execution`, beside `strategy_fingerprint`, which already carries the
  analogous `{hash, sha}` shape and already lives in the graph).
- The gate reads the node, not the filesystem. `isScopeStale` /
  `listScopeStaleTactics` / `check-node-selection.ts` check 5 change source,
  not semantics.
- A scope-inert re-stamp becomes an ordinary graph write with a visible diff
  and a commit message, replacing the invisible file write.
- The bootstrap fail-open narrows: a node that has *never* been stamped is
  distinguishable from a node whose stamp was lost, because absence is now a
  recorded fact rather than a missing file.

## Relationship to siblings

- `tactic-scope-fingerprint-plan-substance` (`phase: qa`) narrows **what** the
  fingerprint hashes — plan substance only, excluding machinery-appended
  sections. It does not move the stamp, and it does not stop author
  documentation edits from tripping the gate. Orthogonal; both are wanted.
- `tactic-transition-node-stamp-landed-body` (`phase: review`, PR #2973)
  repairs **when** the machinery refresh runs (`refresh_stamp` after
  `graph-commit`'s `git reset --hard` hashes the reverted body). Also
  orthogonal: it fixes the writer, not the stamp's location.
- Entry 73's `restamp-scope-fingerprint.ts` is the author-present escape hatch
  this tactic would make unnecessary as a side-channel, folding it into a
  normal graph write.

## Known risk

Moving the stamp into the node means a stamp write is a graph write, and graph
writes contend (`refs/graph/landing-lock`) and cost a commit. Per-phase
stamping happens on every phase transition of every node-lane worker, so the
write volume is real and must be budgeted — the current design chose a local
file partly to keep launch cheap ("never a per-launch graph write", entry 39).
A viable answer must show the write rides an *existing* transition commit
rather than adding one.

## Open questions for /align-tactics

1. Does the stamp ride `execution` on the node, or a sibling structure? If
   `execution`, does it reuse the `{hash, sha}` shape and the per-strategy map
   convention of `strategy_fingerprint`?
2. Can every stamp write be folded into a commit the transition already makes,
   satisfying entry 39's "never a per-launch graph write" constraint in
   substance if not in letter?
3. What is the migration for the 60 existing local stamps — opportunistic
   promotion at next re-stamp (the pattern entry 70 used for bare-hash
   strategy stamps), or a one-shot backfill?
4. Once stamps are in-graph, should the bootstrap fail-open be retired
   outright, and what becomes of nodes that legitimately carry no stamp
   (`implement`, `main-qa`)?
5. Does `restamp-scope-fingerprint.ts` survive as a thin graph-writing wrapper,
   or is it deleted in favour of the ordinary node-write path?
