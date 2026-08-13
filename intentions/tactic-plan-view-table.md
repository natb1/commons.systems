---
id: tactic-plan-view-table
kind: tactic
statement: Build the office-hours plan view — a rank-ordered table of every
  non-done tactic with tier and band-spine lineage columns, an off-spine
  ancestor lane gutter, label chips with a phase pip, position-derived ETA, and
  tier/label filters
owner: ai
status: raw
parent: null
rationale: Recorded by the 2026-08-13 /align interview that absorbed the harness
  plan view into this strategy after strategy-rsi-plan-surface was pruned.
  Carries the format contract recorded in that round's plan-view clarifications
  on strategy-attention-surface; where this body and those clarifications
  differ, the clarifications win. Specified against the GREENFIELD rank key, not
  the resolver on main.
reading: null
serves:
  - strategy-attention-surface
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
# Build the office-hours plan view — a rank-ordered table of every non-done tactic with tier and band-spine lineage columns, an off-spine ancestor lane gutter, label chips with a phase pip, position-derived ETA, and tier/label filters

## Draft context (2026-08-13 /align interview)

Authoritative format contract: the plan-view clarifications on
`strategy-attention-surface` recorded by this round. Read them first — this
body is the implementation decomposition, and where the two differ the
clarifications win.

**Specified against the GREENFIELD rank model, not the resolver on main.** A
worker taking this node must read `tactic-attention-namespaced-rank` first.
The rank key is the lexicographic quadruple `(tier, band, score, depth)`
descending, over one parent relation: a node's parents are its `parent`
field, everything it `serves`, every delegation it `recovers`, and every node
listing it in `blocked_by`. `score` is a deduplicated lineage sum, `band` is
the max parent score, `depth` is the distinct-lineage-node count.

### Purpose, stated so the columns are not read as arbitrary

The author's purpose (2026-08-13): *see which parts of the graph dominate the
focus of the author and the delegatees, and track progress in those areas.*
The lineage columns are therefore the **primary content** and the tactic rows
are the evidence beneath them — the inverse of the pruned rsi-plan design,
where lineage was a group header over a queue readout.

### Columns, in the author's specified order

`tier` · `lineage column group` · `node id` · `labels` · `ETA`

The lane gutter sits between the lineage group and the node id. The
hot-lineage panel is **not** a column — it is a separate panel, owned by
`tactic-plan-view-hot-lineage-panel`.

### Row set

Every **non-done** tactic — drafts included, parked rows included and marked,
never dropped. Measured 2026-08-13 (restate the count with any recount; the
figures move):

| | rows |
|---|---|
| open tactics | 415 |
| selectable → carries a real ETA | 223 |
| — drafts, emitted at the `align-tactics` rung | 175 |
| — phase-set executable | 48 |
| no position: parked / blocked / subtree container | 144 / 45 / 3 |

**Drafts ARE router-selectable.** `selectGraphTargets`' frozen-tactic
candidate loop emits them at the `align-tactics` directive rung, gated on
`office_hours` null, blockers all `done`, and not being another tactic's
`parent`. Do not reintroduce the assumption that a draft is inert — it was
the error this round was corrected on.

### ETA

`today + (row's 1-based position in the router's selection order / velocity)`,
velocity being the dispatch queue's 28-day closure rate in closures/day. Zero
velocity (paused queue) renders `unavailable`, never a date.

Unit-consistency was verified this round rather than assumed: the two
candidate loops in `selectGraphTargets` are **disjoint**, so each tactic emits
exactly one candidate per tick and position counts distinct tactics.

Rows with no position render a **typed reason**, never a blank cell:
`unavailable — parked`, `unavailable — blocked by <id>`, `unavailable —
container`. Parked rows are excluded from the position counter that feeds
every other row's ETA — otherwise the unselectable rows inflate every real
date on the page.

**ETA is ABSOLUTE under a filter** and never recomputes over the filtered set.
Hiding rows does not make the router arrive sooner. The hot-lineage panel
deliberately does the opposite; that asymmetry is intended.

### Lineage column group — band spine

Rowspan requires a **laminar** family (any two blocks nested or disjoint), and
ancestor sets in a DAG are not laminar. Render the one sub-DAG that is a tree:
each row's **band spine** — its band-defining parent, then that parent's
band-defining parent, to a root. Spines are paths, so they nest exactly,
recursively, spans growing leftward. The spine is *what set the row's rank*,
not an arbitrary reduction.

Two caveats:

- Contiguity holds on the band **value**, not on the band-defining parent
  **node**. Distinct parents with equal score share a block, and blocks
  fragment on ties. Band 0 is a large degenerate bucket until
  `tactic-attention-per-tier-boost-migration` lands.
- A span exceeding the loaded window renders as a **sticky header**, never a
  literal growing rowspan — a rowspan must know its extent at render time,
  which infinite scroll cannot supply. A span that mutates as rows stream
  causes layout thrash; one that breaks at a page boundary shows a pagination
  artifact as data. **This applies to the tier column too.**

### Lane gutter — the off-spine ancestors

Everything the spine drops (a second `serves`, a `recovers` delegation, a
reverse-`blocked_by` blocker) renders as vertical lanes painted **per
viewport**, not as table cells: no span extent is needed, a lane repeats
segments where an ancestor is non-contiguous, and several lanes light on one
row for a multi-parent node.

**Lane hue encodes ancestor KIND** (strategy / delegation / blocker — three
fixed categorical slots), never ancestor identity: there are 57 strategies and
22 delegations, and `/dataviz` forbids generating a 9th categorical hue.
Identity is carried by lane position, label, and hover.

### Labels column

Six chips — `bug`, `security`, `outage`, `parked`, `delegated`, `blocked` —
plus a compact 5-segment phase ladder pip carrying per-row progress, so the
author's column order is unchanged. `Badge` is the DS chip primitive.

`delegated` (`owner: ai`) and `parked` (`office_hours` non-null) are
**independent facts** and both render when both hold — measured 2026-08-13:
318 delegated, 144 parked, 53 both.

The overlap between the tier column and `bug`/`security`/`outage` is
**deliberate**: tier 2 is *derived* from those marks and tier 3 is
`strategy-main-health`'s reserve, so the chip says *why* a row is lifted. Do
not remove it as duplication.

### Filters

Filter by tier and by label, one control row above the table. `parked` and
`blocked` being chips makes each excluded class filterable, so a date-dense
view stays one click away. Filtering changes the hot-lineage panel's scope; it
must **not** change any ETA.

### Ordering

Read rank and selection order from the same resolver and selector the router
uses. **Do not invent a comparator** — a table that computes its own order can
drift from the queue it claims to show.

### Substrate — AMENDED 2026-08-13: this is a published claude artifact

**Supersedes the in-app substrate this node originally carried.** The plan view
is built as a **published claude artifact**, not an office-hours panel — the
first instance of the artifact-delivery practice recorded on
`strategy-owned-web-platform` (see its clarifications on the practice, the
runtime constraints, and the CI split). The author's framing: prior development
has been mostly Firebase applications, and this table is meant to be a claude
artifact instead.

What that fixes, and it is the paragraph this node previously worried about:
`router.ts` is **not** browser-safe — it imports `node:crypto` for
`strategyFingerprint`, and the `@commons-systems/intentionsutil/graph` subpath
exports only the fs-free modules. The original design therefore had to make
selection order reachable from the browser, i.e. reimplement or re-export it,
in tension with the "do not invent a comparator" rule above. **That work is no
longer owed.** The artifact's rows are baked in at build time by a **Node**
step, which calls `selectGraphTargets` and the resolver *directly*. The
strictest reading of `strategy-attention-surface` condition 7 is now literally
satisfied rather than approximately.

What that costs. A published artifact **cannot read the graph at runtime by any
route** — the capability set is `downloads` and `mcp` only, a strict CSP blocks
every external host including fetch/XHR, and there is no File System Access
path. The page is a **snapshot**. It must therefore stamp, prominently, the
`origin/main` sha and the build timestamp it was built from. That replaces the
`STALE_CLONE_THRESHOLD_MS` guard inherited from
`office-hours/src/graph-source.ts`, which no longer applies: there is no live
clone read to go stale, only a build that has a date. Do **not** port that
guard; port its *intent*, which is that the reader never mistakes old rank for
current rank.

`office-hours/src/graph-source.ts` remains the reference for the read shape
(per-file YAML parse and validate, `buildTree`, `resolveAttention`) even though
the plan view no longer runs through it — the build step performs the same
reads in Node, against the working clone rather than an FSA handle.

Build and delivery obligations, from the practice on
`strategy-owned-web-platform`: source lives in a **workspace** so the
manifest-derived CI mechanisms cover it with no registration; the build emits
**one** self-contained file with all CSS/JS inlined; CI runs the artifact
contract check and a headless from-disk render smoke; a session publishes; and
the returned **URL and contract pin are recorded on this node** — republishing
without the existing url creates a second artifact rather than updating the
live one.

### Verification

- Every row with a position shows a date; every row without one shows a typed
  reason, never a blank.
- Removing a parked row from the graph shifts no unparked row's ETA — the
  check that parked rows were excluded from the position counter rather than
  merely blanked.
- Applying any filter changes no row's ETA.
- A node that is both `owner: ai` and parked shows **both** chips.
- A multi-`serves` node lights more than one gutter lane on its row.
- Spine columns nest without a ragged break within a band; a span crossing the
  viewport renders sticky rather than re-rendering as rows stream.
- The order rendered equals the order `selectGraphTargets` produces, asserted
  against the live store rather than a fixture alone.
- The built page is exactly one self-contained file, references zero external
  hosts, and opens from `file://` with the network disabled — the artifact
  contract check plus the from-disk render smoke.
- The rendered sha and build timestamp match the commit the build ran against.
