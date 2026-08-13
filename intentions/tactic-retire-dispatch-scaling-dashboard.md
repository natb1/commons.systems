---
id: tactic-retire-dispatch-scaling-dashboard
kind: tactic
statement: "Dispose of dispatch-scaling-dashboard.html — the repo's one
  pre-existing unmanaged artifact-class file: rebuild it under the artifact
  practice or delete it, but stop leaving it homeless at the repo root"
owner: ai
status: raw
parent: null
rationale: Found by the 2026-08-13 /align round's sweep for existing artifacts
  while establishing the claude-artifact delivery practice. It is the only loose
  HTML file at the repo root and is referenced by nothing in the repo, so it is
  invisible to every workspace-keyed CI mechanism by construction. It predates
  the practice this round recorded and is the concrete example of what the
  practice exists to prevent. Retained as a draft for /align-tactics;
  disposition is a real choice, not a foregone deletion.
reading: null
serves:
  - strategy-owned-web-platform
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
# Dispose of dispatch-scaling-dashboard.html — the repo's one pre-existing unmanaged artifact-class file: rebuild it under the artifact practice or delete it, but stop leaving it homeless at the repo root

## What it is

`dispatch-scaling-dashboard.html` — 499 lines, ~26KB, at the **repo root**. Added
2026-06-13 in `27b8fbfc` ("office-hours: add multi-panel dashboard design and
scaling visualization") together with `office-hours/multi-panel-dashboard-design.md`.
A standalone interactive visualization of the W→F→N dispatch worker scaling
model, with its own controls and canvas rendering.

Two facts about its history matter for disposition:

- **Its sibling was already cleaned up.** `office-hours/multi-panel-dashboard-design.md`
  no longer exists. That file was an ad-hoc design doc outside `intentions/`,
  which `/align` Step 4 explicitly forbids, and it was removed. The `.html` is
  the same violation in a different file type and it survived, presumably
  because a rendered page does not look like a design doc.
- **It has been maintained, by hand, once.** `78498347` (the anchored
  floor→shoulder→terminal weekly pace curve) touched it. So it is not
  abandoned — it is load-bearing enough that someone updated it, with no test
  to confirm the update was right.

## Why it is invisible

Referenced by **nothing**: no workspace, no `firebase.json` hosting target, no
`detect-changes.sh` path trigger, no vitest project, no eslint layering rule,
no intention node. Every quality mechanism in this repo is workspace- or
path-keyed and derives its list from the workspace manifest, so a loose root
file is not "untested by oversight" — it is *unreachable* by all of them, by
construction. It also hardcodes its own hex palette (`--accent: #4ea1ff`,
`--bad: #f85149`, …) rather than using DS tokens, and is dark-only.

It is the concrete example of what the practice recorded on
`strategy-owned-web-platform` (2026-08-13) exists to prevent, which is why it
was surfaced by that round's sweep.

## The disposition is a genuine choice

Do **not** treat deletion as foregone. Three live options, to be decided at
`/align-tactics` (and worth asking the author, since it encodes a judgment
about whether the scaling model still needs a visual):

1. **Rebuild under the practice** — workspace source, DS tokens, single-file
   build, CI contract check, published as a claude artifact with its URL
   recorded. Right if the scaling visualization still earns attention.
2. **Delete it** — right if the pace curve it visualizes is now adequately
   explained by the recorded doctrine and nobody opens it. Cheapest, and honest
   if the answer to "when did you last look at this?" is "never".
3. **Demote it explicitly** — move it out of the root into a clearly-marked
   scratch location that is *recorded* as unmaintained. Weakest option: it
   preserves the ambiguity that let it sit there, and this repo's
   clear-errors-over-fallbacks disposition argues against it.

Check first whether the model it renders is still accurate — the pace curve was
rewritten after this file was authored, and a stale visualization of a
superseded model argues for option 2.

## Out of scope

The artifact practice and its machinery (`tactic-artifact-build-and-ci-contract`).
Any other file: this sweep found exactly one loose HTML file at the repo root,
so this is not the first of a class.

## Verification

- No loose rendered-artifact file remains at the repo root.
- If rebuilt: it is covered by the artifact contract check and render smoke,
  uses DS tokens rather than a private palette, and its URL is recorded on this
  node.
- If deleted: the commit message records why, and no surviving reference points
  at it (the sweep found none, so this should be trivially true — confirm it
  still is).

Recorded 2026-08-13.
