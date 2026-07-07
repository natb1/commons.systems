---
id: tactic-sync-reader-skill
kind: tactic
statement: "Draft: /sync-reader skill — sync curriculum reading excerpts from
  the print share to the USB reader, priority-named, retiring resolved chunks"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy interview
  (retain-not-refine): the author's requirement for reading-delivery tooling
  serving the tradition-reading recovery loop. The graph is the curriculum
  source (tactic-reading-chunk-* nodes), the print share is the text source, the
  chunk-node lifecycle is the retirement trigger. Full requirement and interview
  design decisions in the node body."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# Draft: /sync-reader skill — sync curriculum reading excerpts from the print share to the USB reader, priority-named, retiring resolved chunks

Retained context from the 2026-07-06 /align-strategy interview. Author's
requirement, with the interview's design resolutions folded in. `/align-tactics`
refines this into a plan; nothing here is final except where it restates a
recorded clarification on `strategy-philosophical-grounding`.

## Requirement (author, 2026-07-06)

A skill `/sync-reader` that takes the path to a USB-mounted directory of epubs
(the e-reader) and another directory for the print project network share, or
uses configured directories. It identifies the reading curriculum (needed to
mitigate deferral to traditions/delegates), extracts the referenced excerpts
from what's available in the print share (noting missing references for the
author when executing the skill), and syncs with the reader directory
(removing references for resolved nodes), using a naming convention that
orders the reading by priority.

## Design resolutions from the interview

- **Curriculum source is the graph**: unresolved `tactic-reading-chunk-*`
  nodes (per-chunk office-hours tactics, ~30 author-minutes each). No
  hardcoded node list and no prose parsing once
  `tactic-curriculum-chunk-metadata` lands machine-readable reading
  references on the chunk nodes; until then the chunk bodies' `## Text`
  sections are the interim source.
- **Extraction: extract, else report.** Build one excerpt epub per chunk from
  the cited passage (e.g. Republic VII 514a–521b) when the source epub's
  TOC/sections allow locating it. A passage that cannot be located goes in the
  same author-facing report as a book absent from the share — no silent
  whole-book fallback (clear errors over defensive fallbacks). Missing texts
  are author-actionable acquisitions (buy DRM-free), not tooling gaps.
- **Naming orders by priority**: a sort-order prefix derived from the
  curriculum working order (currently 1, 2, 5, 3, 4, 6, 7, 8, 9 per
  `strategy-recovery-critical-path`'s 2026-07-06 revision), so the device
  lists reading in execution order. Known trade-off: a later priority
  revision renames files, which may lose device-side reading position on a
  renamed file — accepted.
- **Retirement is keyed to the chunk node lifecycle** (recorded clarification):
  a chunk tactic resolved and removed from the graph has its excerpt file
  deleted from the reader on the next sync. The node lifecycle is the single
  per-chunk resolution mechanism — no parallel done-marker convention. One
  excerpt file per chunk makes retirement exact even when several chunks cite
  the same book (NE appears in five chunks).
- **Directories**: positional args (reader dir, share dir) with configured
  defaults; where the config lives is an `/align-tactics` decision.
- **Sibling skill**: chunk resolution itself happens in the office-hours flow
  (`tactic-reading-review-skill`); this skill only reads graph state and
  moves files.

## Dependencies

- `tactic-curriculum-chunk-metadata` — machine-readable reading references and
  priority on every chunk node — is the enabler for a prose-free
  implementation; the two can land in either order if this skill starts from
  the interim body-parsing path.
