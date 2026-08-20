---
id: tactic-artifact-url-inventory-sensor
kind: tactic
statement: Sense published-artifact inventory — every published artifact
  resolves to an owning intention node recording its URL and contract pin, and
  every recorded URL still resolves
owner: ai
status: raw
parent: null
rationale: Surfaced at the 2026-08-13 /align round recording claude artifacts as
  a production delivery substrate. Republishing without passing the existing url
  creates a SECOND artifact rather than updating the live one, so under
  graph-native dispatch — where every worker starts with no memory of the
  publishing round — an unrecorded URL silently orphans a live deliverable. The
  round made URL-in-the-graph a recorded practice; this is the sensor that reads
  whether it is actually being kept. It is the sensor tooling_goal the round
  added to strategy-owned-web-platform, and it is deliberately separate from
  that strategy's success_signal, which reads dependency justification. Retained
  as a draft for /align-tactics.
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
# Sense published-artifact inventory — every published artifact resolves to an owning intention node recording its URL and contract pin, and every recorded URL still resolves

## Context

`strategy-owned-web-platform` recorded (2026-08-13) that a published claude
artifact's URL and runtime-contract pin are recorded on the intention node that
owns the surface. This node is the sensor that reads whether that is actually
being kept.

## Why this is not bookkeeping

Republishing **without** passing the existing `url` creates a **separate**
artifact at a new URL rather than updating in place. Under graph-native
dispatch every worker starts as a fresh session with only the graph — so a
session that republishes a surface whose URL was never recorded will silently
orphan the live deliverable and hand back a second link, with no error and no
signal. The author then has two artifacts, one of which is quietly abandoned,
and no way to tell which link anyone else is holding.

The recorded URL is also what a later round reads to decide whether to move the
`contract` pin. Moving it changes how a shipped page behaves and is meant to be
a deliberate gesture, never a side effect of editing — which requires knowing
what it is pinned to now.

## Two directions to check

Both, because they fail differently:

1. **Graph → world.** Every intention node recording an artifact URL: does that
   URL still resolve, and does its recorded contract pin still match what is
   deployed? Catches a deleted or superseded artifact whose node still claims
   it is live.
2. **World → graph.** Every artifact the account has published (the Artifact
   tool's own listing is the enumeration source): does it map to an owning
   node? Catches exactly the orphaning failure above — an artifact alive in the
   world that the graph does not know about.

## Where the field lives

Undecided, deliberately, and it is a real decision for `/align-tactics` rather
than an omission: a dedicated frontmatter field on the owning node is
machine-readable but widens the node schema (`strategy-graph-self-description`
holds that kind nodes are the sole schema authority, so a new field is a kind
change, not a quiet addition); a recorded clarification is schema-free but
needs parsing. Decide it there, and note that the sensor's shape follows from
the choice.

## Out of scope

The build and CI machinery (`tactic-artifact-build-and-ci-contract`). Any
attempt to publish or update artifacts automatically.

## Verification

- A node recording a URL that no longer resolves is reported.
- An artifact published with no owning node is reported.
- A node whose recorded contract pin differs from the deployed one is reported
  as drift, not as an error.
- The sensor reads clean against the state left by the first published artifact
  (the plan view).

## Note on this strategy's success_signal

This sensor is deliberately **not** folded into
`strategy-owned-web-platform`'s `success_signal`, which reads dependency
justification — a different observable. Artifact inventory is carried by this
node as its own sensor `tooling_goal`. Do not widen that signal to absorb it
without a fresh interview.

Recorded 2026-08-13.
