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
  (packages/intentionsutil/src/transitions.ts:449), the documented bootstrap
  fail-open, so on a fresh clone or a second machine every node reads as fresh
  and the chain-of-custody guarantee silently evaporates. This contradicts the
  standing preference that the graph always reflects target state (strategy
  clarification 2026-07-27): the state deciding whether the graph can be trusted
  is not in the graph. It also forces every legitimate author documentation edit
  through an out-of-band side-channel write (restamp-scope-fingerprint.ts) that
  leaves no trace in git and no reviewable record that a scope-inert
  classification was made. Distinct from tactic-scope-fingerprint-plan-substance
  (phase: qa, PR #2974), which narrows WHAT the fingerprint hashes but leaves
  the stamp out-of-graph, and from tactic-transition-node-stamp-landed-body
  (phase: done, PR #2973, merged 2026-07-30), which repairs the stamp's CONTENT
  SOURCE — restamp-scope-fingerprint.ts now reads the landed text via `git show
  <sha>:<path>` (--from-rev / restampScopeFromRev) instead of the post-`git
  reset --hard` worktree copy, not its timing (refresh_stamp still runs after
  graph-commit, unchanged). Filed 2026-07-27 /align-strategy; corrected
  2026-08-03 /align-tactics park round (line citation and sibling-fix
  characterization — see body Park Note)."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 20
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Finalizing this node's plan this round would reverse an explicit,
    four-day-old, by-name author decision without author input. Entry 141 ruling
    (6) of strategy-graph-native-dispatch, recorded 2026-07-30 with the author
    present, states: 'tactic-scope-stamp-in-graph stays RAW AND UNBOOSTED for
    now' — the author accepted the carrier's diagnosis (entry 115 confirms entry
    102's shape leaves exactly the residual hole this tactic names) but declined
    to boost or chain it, because 'four nodes are already serialized on this
    seam with nothing landed in five days, and adding a fifth to the queue would
    buy no throughput.' A finalize promotes status: raw -> codified and phase:
    null -> implement, which is the literal state the ruling directed the node
    to stay out of. Fresh measurement taken this round (2026-08-03, read
    directly from intentions/*.md frontmatter): the cited premise has changed —
    tactic-transition-node-stamp-landed-body is now phase: done,
    tactic-scope-fingerprint-plan-substance and
    tactic-phase-evidence-fingerprint-bound are both phase: qa, and only
    tactic-demote-node-stale-local-read is still raw/null. That the premise
    moved is a reason for the AUTHOR to re-rule, not license for this round to
    re-resolve a human-decided priority call; attention.boost and blocked_by are
    author-owned (see body Park Note for the full measurement and two supporting
    corrections landed on this node's own rationale/body this round). A second,
    subordinate ambiguity rides the same ratification: any future plan must
    repoint four stamp-consumption sites
    (packages/intentionsutil/src/scope-sweep.ts:33-58/:103,
    packages/intentionsutil/scripts/check-node-selection.ts:341,
    .claude/skills/dispatch-propagate/scripts/transition-node:185-193 via
    compute-freshness,
    packages/intentionsutil/scripts/demote-node-to-implement:41-52), and
    tactic-scope-fingerprint-plan-substance (PR #2974, phase: qa, unmerged) is
    scheduled to widen isScopeStale's signature to `string | readonly string[]`
    across that same surface — so the plan either takes a blocked_by edge onto
    that sibling or is authored signature-agnostic against the existing
    ScopeStamp|null shape, and either choice is exactly the kind of chaining
    decision ruling (6) declined to make."
  since: 2026-08-03
  recommendation: "Re-rule on entry 141 ruling (6) given the changed
    queue-congestion premise: either confirm tactic-scope-stamp-in-graph stays
    raw/unboosted, or explicitly boost/chain it and decide whether it takes a
    blocked_by edge onto tactic-scope-fingerprint-plan-substance (PR #2974,
    phase: qa) given its pending isScopeStale signature widening. If re-ruled in
    favor, re-run /align-tactics tactic-scope-stamp-in-graph to author the plan
    — the reuse surface is already inventoried in this node's body Park Note:
    execution.strategy_fingerprint (schema.ts:494 field, :571-604 validator) as
    the field/validator precedent to copy, ScopeStamp {fingerprint, sha}
    (transitions.ts:424-441) as the shape to keep verbatim, and
    apply-node-transition.ts (:88-125/:159-172) as the writer path that folds
    the stamp write into the transition's existing writeNode call."
  session_type: requirement-discovery
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

- `isScopeStale(null, fp)` returns `false` (`transitions.ts:449`) — the
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

- `tactic-scope-fingerprint-plan-substance` (`phase: qa`, PR #2974) narrows
  **what** the fingerprint hashes — plan substance only, excluding
  machinery-appended sections. It does not move the stamp, and it does not
  stop author documentation edits from tripping the gate. Orthogonal; both
  are wanted. It also widens `isScopeStale`'s signature to
  `string | readonly string[]` (see Park Note below) — a future plan on this
  tactic must sequence against that.
- `tactic-transition-node-stamp-landed-body` (`phase: done`, PR #2973, merged
  2026-07-30) repairs the stamp's **content source**: `restamp-scope-fingerprint.ts`
  now reads the landed text via `git show <sha>:<path>` (`--from-rev` /
  `restampScopeFromRev`) instead of the post-`git reset --hard` worktree copy.
  `refresh_stamp` still runs after `graph-commit`, unchanged — the fix is WHAT
  content gets hashed, not WHEN the hashing runs (corrected 2026-08-03; see
  Park Note). Orthogonal to this tactic: it fixes the writer, not the stamp's
  location.
- Entry 73's `restamp-scope-fingerprint.ts` is the author-present escape hatch
  this tactic would make unnecessary as a side-channel, folding it into a
  normal graph write.

## Park Note (2026-08-03 /align-tactics round)

This round found the node ready to finalize on every mechanical gate
(draft/raw, no blockers, no failed `attributes.conditions` entry) but parked
it instead on a Side-B drift finding: strategy clarification entry 141 ruling
(6), recorded 2026-07-30 with the author present, explicitly left this tactic
"RAW AND UNBOOSTED for now," citing four sibling nodes on the same
scope-custody seam serialized with nothing landed in five days. Finalizing
this round (`status: raw` → `codified`, `phase: null` → `implement`) would be
the literal state that ruling directed the node to stay out of, without new
author input.

Fresh measurement this round (2026-08-03, read directly from
`intentions/*.md` frontmatter in a worktree cut from `origin/main`): of the
four nodes ruling (6) cited, three have since moved —
`tactic-transition-node-stamp-landed-body` is `status: codified` / `phase:
done` (PR #2973, merged 2026-07-30, chain head landed);
`tactic-scope-fingerprint-plan-substance` is `status: codified` / `phase: qa`
(PR #2974, `blocked_by: [tactic-transition-node-stamp-landed-body]`);
`tactic-phase-evidence-fingerprint-bound` is `status: codified` / `phase: qa`
(PR #2975, `blocked_by: [tactic-scope-fingerprint-plan-substance,
tactic-transition-node-stamp-landed-body]`, `office_hours: null`); only
`tactic-demote-node-stale-local-read` remains `status: raw` / `phase: null`
(`blocked_by: [tactic-phase-evidence-fingerprint-bound]`). So the specific
congestion premise ruling (6) cited ("nothing landed in five days") no longer
describes current state — offered here as evidence for the author to re-rule
with, not as license for this session to re-decide a human-owned priority
call (see `office_hours.recommendation`).

A second, subordinate finding: `tactic-scope-fingerprint-plan-substance` (PR
#2974, still unmerged at `phase: qa`) is scheduled to widen `isScopeStale`'s
signature from `(stamp: ScopeStamp | null, fingerprint: string)` to accept
`string | readonly string[]`, touching the same four consumption sites
(`scope-sweep.ts:33-58`/`:103`, `check-node-selection.ts:341`,
`transition-node:185-193`, `demote-node-to-implement:41-52`) any plan for
this tactic must repoint. A future plan should either add an explicit
`blocked_by` edge onto that sibling, or be authored signature-agnostic
against the current `ScopeStamp | null` shape — an open call for whoever
re-runs `/align-tactics tactic-scope-stamp-in-graph` once the author
re-rules.

Two corrections landed on this node this round, both verified directly
against current code before being applied (not taken on an agent's claim):
the `## Context` section's `isScopeStale` line citation (`transitions.ts:331`
→ `:449`, drifted by the two sibling tactics editing that file), and the
`## Relationship to siblings` bullet above, which previously said
`tactic-transition-node-stamp-landed-body` "repairs WHEN the machinery
refresh runs" — wrong; it repairs the stamp's content source, not the
refresh's timing.

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
