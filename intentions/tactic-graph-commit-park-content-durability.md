---
id: tactic-graph-commit-park-content-durability
kind: tactic
statement: park_write preserves the losing writer's unlanded content only as a
  pointer into a per-run mktemp dir its own recommendation text concedes is
  machine-local and may not outlive the session, so the record that exists to
  save that content cannot durably hold it; and on the delete/modify branch the
  office_hours record never reaches origin/main at all, so no pointer of any
  kind survives
owner: ai
status: raw
parent: null
rationale: null
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
  branch: pr18-durable-write-fence
  pr: 3134
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-29T22:46:37Z
    mergeCommitSha: 478cc3242048cfdee675dceda46a6e59827f1d10
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-graph-commit-snap-dir-merge-clobbers-original
  - tactic-eval-finding-noop-verdict-hides-dropped-node-edit
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A park preserves the losing writer's content only as a pointer into a per-run tmpdir, so the record that exists to save that content cannot outlive the session that wrote it

## The defect

`park_write()` (`packages/intentionsutil/scripts/graph-commit:3029`) is the
fail-closed path: a concurrent writer landed an overlapping edit, this writer's
content was NOT landed, and the node is parked so a human can merge the two by
hand. The whole purpose of the record is to preserve what the losing writer
meant to say.

It preserves it by **pointing at a path**, not by carrying the content:

- `SNAP_DIR` is a bare `mktemp -d` (`:3770`). `park_and_exit()` (`:3324`) sets
  `KEEP_SNAP=1` (`:3329`) so `cleanup()` (`:884`) does not delete it — but that
  survives the process only, not the machine, the tmp reaper, or the container.
- The recommendation text says so itself. `preservedContent()` (`:3107-3125`)
  is the single composer of the "where does the human find it" wording, and its
  ordinary-branch string ends `(this machine only — may not survive past this
  session)` (`:3119`). Both the ordinary branch (`:3233-3240`) and the
  delete/modify branch (`:3215-3232`) call it.

That fails this strategy's recorded condition that a park whose context lives
only in the parking session is a defect. It is candidate **(c)** of strategy
clarification 241 (2026-08-15), which adopted candidate (b) — the `SNAP_DIR`
immutability contract owned by
tactic-graph-commit-snap-dir-merge-clobbers-original — and left this one open:
"(b) and (c) are complements, not substitutes; (c) should be filed as its own
tactic rather than folded in."

## Three branches, and only one is fixable the obvious way

`park_write` composes three recommendations, and they differ in whether the
record reaches `origin/main` at all:

| Branch | Anchor | Does the `office_hours` record land? |
|---|---|---|
| Ordinary lost writer | `:3233-3240` | **Yes** — the park commits `origin/main`'s content plus the `office_hours` block |
| Prune vs concurrent edit | `:3207-3214` | **Yes** — same landing path; carries neither a snapshot path nor content (a `--prune` id has no snapshot at all) |
| Delete/modify divergence | `:3215-3232` | **No** — by its own text, "this `office_hours` record itself is LOCAL ONLY — it exists nowhere on origin/main, because the node does not" (the stderr line is `:3246`) |

So the obvious shape — carry the content in `office_hours.recommendation` —
repairs the first branch and does nothing whatever for the third, where the
writer's edit survives only as an untracked local file that the same tmpdir
caveat is attached to. A fix that addresses only the first branch must say so
rather than claim the whole class.

## Three constraints any fix must satisfy

1. **Verdict idempotence — the original framing of this constraint was measured
   FALSE on 2026-08-21 and is corrected here.** `PARK_CONTENT_DIR` (declared
   `:495`, doc comment `:449-452`, populated `:3285-3290`) holds each parked
   node's post-park content, and `print_verdict()` (`:2203`) compares it
   byte-for-byte against `origin/main` to decide `parked` versus `not-landed`
   (the `PARK_CONTENT_DIR` branch at `:2307-2321`, doctrine comment at
   `:2280-2305`, `parked` status defined at `:150-161`).

   This node previously recorded that the recommendation "does not vary with
   the writer's content — so a second losing writer parking the same node
   produces a byte-identical block and reaches the idempotent-retry arm", and
   concluded that embedding content would break that arm. **It already varies.**
   `preservedContent(id)` interpolates `snapOriginal(id)` = `$SNAP_DIR/<id>.md`
   (`:3093`), and `SNAP_DIR` is a per-run `mktemp -d` (`:3770`) — a fresh random
   path every invocation. The existing regression case states the consequence in
   its own words: `packages/intentionsutil/scripts/test-graph-commit.sh:2909`
   case 59 is built on a `--prune` id, and its comment (`:2924-2925`) gives the
   reason — "C's prune then conflicts identically and re-parks onto B's
   already-landed record — byte for byte, since **the prune recommendation
   carries no per-run path**."

   Corrected constraint: embedding the losing writer's content in the
   **ordinary** branch's recommendation costs no idempotence that is not
   already lost there. The arm that must actually be preserved is the **prune**
   branch (`:3207-3214`), which carries neither a path nor content today. Any
   fix must leave the prune branch's recommendation content-independent, or
   move the carried content outside the compared region.

2. **The delete/modify branch** (above) needs either a different durable
   location or an explicit statement that it stays out of scope. It cannot be
   repaired by a node-embedded record: `RESURRECTED_IDS` is excluded from the
   park commit so a landed deletion is never reverted, so the `office_hours`
   record for that limb exists nowhere on `origin/main` by construction.

3. **Schema and size — corrected 2026-08-21.** `office_hours` is
   `{reason, since, recommendation, session_type}`
   (`packages/intentionsutil/src/schema.ts:701-707`), not the three-field shape
   this node previously recorded. The validator (`:924-937`) treats
   `recommendation` as `optionalString` with **no** length cap. A node body is
   arbitrary markdown containing its own `---` fences and frontmatter, and can
   be long. Whether this needs escaping, a size cap, a new field, or a different
   store is still a `schema.ts` decision, not a string-formatting one.

## Reuse — measured 2026-08-21, no re-gathering needed

- **The seam already exists.** `tactic-graph-commit-snap-dir-merge-clobbers-original`
  (phase done) introduced `preservedContent(id)` (`:3107-3125`, with
  `snapOriginal` `:3093`, `snapMerged` `:3094-3100`, `snapIntended` `:3101`) and
  its own comment declares it "the ONE place that decides which content a human
  is pointed at and how the two are described — every recovery branch below
  calls `preservedContent(id)` rather than composing its own path wording." A
  fix goes through `preservedContent` and what it points at, not through
  re-editing the branch strings.
- **graph-commit already pushes the content to origin, then throws it away.**
  Every landing attempt force-pushes the writer's full commit to
  `refs/heads/graph/<id>-<pid>` on origin (`:2841`; the name is constructed at
  `:3762`), and the EXIT trap deletes that ref behind a `|| true` (`:902-903`).
  At park time the writer's content has therefore **already reached origin
  durably**, and cleanup discards it, while the park record instead points the
  human at the machine-local `$SNAP_DIR`. Not landing that delete — or renaming
  the ref into a namespace outside `graph-scratch-sweep`'s
  `refs/heads/graph/**` scope — is a far smaller change than inventing a
  parallel content-preservation path. This does not settle which substrate
  should hold park content; that is the ruling this node is parked for.
- **CAS-write precedent.** The landing-lock `build_lock_commit` / `refs/graph`
  compare-and-swap pattern at `graph-commit:2571-2695` (lock ref named at
  `:369`) is the in-script precedent for writing a durable non-branch ref.
- **Test harness.** `packages/intentionsutil/scripts/test-graph-commit.sh`
  carries the park-record assertions to mirror: case 22 (`:1660`) and case 22b
  (`:1692`) on the `SNAP_DIR` contract, case 58 (`:2855`) and case 59 (`:2909-2955`) on
  the park verdict and the idempotent park retry.

## Out of scope

The `SNAP_DIR` immutability contract itself (candidate (b), owned by
tactic-graph-commit-snap-dir-merge-clobbers-original). The merge algorithm and
`snap_intended_file()` (`:1009`). The delete/modify park's test and downstream
coverage, owned by tactic-graph-commit-delete-vs-edit-park-hardening.
`build_recommendation()` (`:2974`), which renders the field-level divergence
breakdown appended *after* the base text — a different layer from
`preservedContent`.

## Blockers — both cleared 2026-08-21

`blocked_by` named two nodes this would collide with in the same file, both
units of the graph-write-path PR:

- tactic-graph-commit-snap-dir-merge-clobbers-original — now `phase: done`. It
  landed the `preservedContent` seam described under Reuse, exactly as
  predicted, so this node's change is localized rather than a second sweep.
- tactic-eval-finding-noop-verdict-hides-dropped-node-edit — now `phase: done`.
  It rewrote the verdict path constraint 1 turns on.

Both are complete. This node is workable on the code side; what blocks it now
is the author ruling recorded in `office_hours`, not a code dependency.

## Round record — 2026-08-21 /align-tactics round, escalated

This round ran `/align-tactics tactic-graph-commit-park-content-durability` as
a per-node finalize. It did **not** finalize: the two-sided drift review
returned `proceed: false` with two parks on this node, both recorded in
`office_hours` above — (A) the serving strategy's armed maintenance-burden band
condition failing on both limbs, and (B) the durable-substrate design choice the
author explicitly left unruled in clarification 241. No plan body was authored,
`phase` stays null and `status` stays `raw`.

What this round changed in this node, so the next round does not re-derive it:

- Re-anchored every `path:line` citation. `graph-commit` had grown to 4012
  lines and every anchor the body carried was stale (`park_write` had moved
  `:2778` → `:3029`, `SNAP_DIR` `:3479` → `:3770`, and so on).
- Corrected constraint 1's premise, which was measured false (see above).
- Corrected constraint 3's `office_hours` schema shape, which was missing
  `session_type` and asserted an unstated size question.
- Added the prune branch to the branch table — it was absent, and it is the
  branch whose idempotence a fix must actually protect.
- Replaced the "Why this is blocked" section: both `blocked_by` nodes reached
  `phase: done`.
- Recorded the Reuse findings above from this round's reuse hunts.

**Immaterial drift observations — disposition.** The round surfaced two
observations classed immaterial (they gate no plan). Both are recorded here
rather than in a separate born-parked observation carrier, and that placement is
deliberate: a carrier exists as a destination for observations with no legal
home, and both of these have one on this node, which is itself parked to the
same office-hours sitting a carrier would route to. Minting one would also add a
node to the very backlog numerator blocker (A) parks over. No autonomous write
to the serving strategy's `clarifications` was made, which is the invariant
clarification 245 / V1 protects.

1. *The band counts its own inert output.* Born-parked observation carriers
   serving this strategy went 12 → 39 in ten days (more than tripled) while open
   went 46 → 82, and `strategyBacklogBand`
   (`packages/intentionsutil/src/census.ts:26-40`) scores born-parked as
   backlog — so the immaterial-drift channel the graph adopted writes directly
   into the counter the burden condition reads. This does not clear the
   condition: excluding born-parked entirely gives 20.5% → 29.8%, which passes
   the ≤35% level limb but still fails the non-increasing limb. Carried into
   the `office_hours.recommendation` above as an input to the band ruling.
2. *graph-commit already pushes the content it later says it cannot preserve.*
   Recorded under Reuse above.

## What shipped, and the residue — 2026-08-29

Shipped as PR18 Unit 5 of the dispatch/RSI serialized window
(`plans/dispatch-rsi-serialized-pr-plan.md` § PR18), merged as `478cc324`
(#3134). The fix is scoped to the **ordinary lost-writer branch** only. This
section is constraint 2's required explicit out-of-scope statement, and the
record of what the other two branches got.

**Ordinary lost writer — fixed.** `park_write()` now carries the losing writer's
content verbatim inside `office_hours.recommendation`, which lands on
`origin/main`, instead of only naming a path into the per-run `mktemp -d`. A new
`ownContentEmbed(id)` helper reads the frozen original and returns a delimited
block; it is appended last, after the prose and the field breakdown, so a human
reads the instructions before the payload. The block begins with the literal
line `----- BEGIN this session's unlanded content for <id> (verbatim) -----`.

`preservedContent()` was rebuilt around three explicit states — no embed,
truncated, whole — because an embed is not guaranteed: `snapMerged()` can exist
with no frozen original beside it, and the previous wording promised a carried
copy that would not be there. The "may not survive past this session" caveat is
now attached to every `SNAP_DIR` path and to nothing else; it had migrated onto
the embedded copy, which is the one path where it is false.

The embed is capped at 65536 bytes and states exactly how many of how many bytes
were dropped — never a silent truncation. The cut lands on a UTF-8 codepoint
boundary (then prefers a line boundary when the window holds one), and `omitted`
is derived from the byte index rather than from a post-decode length, so the
figure in the landed record is exact rather than off by the width of a split
sequence.

**Prune branch — untouched, and deliberately so.** Constraint 1 above requires
the prune recommendation stay content-independent, because that is the arm whose
byte-identical re-park reaches the idempotent-retry path
(`test-graph-commit.sh` case 59). It does. A `--prune` id has no snapshot, so
`ownContentEmbed` finds no frozen original and returns `null`, and the shared
composition line appends nothing. The constraint is preserved by the helper's
own precondition, not by a branch-specific special case.

**Delete/modify branch — RESIDUE. Not fixed, and not fixable this way.** The
embed *is* appended on this branch, since the id does have a snapshot — but that
buys nothing durable, and the branch's own text still says why: the whole
`office_hours` record is **local only**. It exists nowhere on `origin/main`
because the node does not; `RESURRECTED_IDS` is excluded from the park commit so
a landed deletion is never reverted. Embedding content in a record that never
lands does not make the content durable.

The concrete residue, stated plainly because it is easy to miss: on this branch
the losing writer's edit survives **only** as the re-materialized
`intentions/<id>.md`, which is an **untracked local file**. Nothing tracks it and
nothing pushes it. A reaped worktree destroys it — as do a container exit, a tmp
reaper, or a plain `git clean`. The 2026-08-15 clarification-241 framing that a
park whose context lives only in the parking session is a defect therefore still
holds against this branch, unchanged, after this PR.

Repairing it needs a durable substrate that does not depend on the node existing
on `origin/main` — the substrate choice clarification 241 explicitly left
unruled. The Reuse section above already names the most promising lead: every
landing attempt force-pushes the writer's full commit to
`refs/heads/graph/<id>-<pid>` on origin and the EXIT trap then deletes it, so the
content has already reached origin durably at park time and is thrown away. Not
landing that delete, or renaming the ref outside `graph-scratch-sweep`'s scope,
is a far smaller change than inventing a parallel path. That remains a ruling
this node did not receive and PR18 did not take.

Adjacent but not the same work: `tactic-graph-commit-delete-vs-edit-park-hardening`
(`phase: main-qa`) owns the delete/modify park's test and downstream coverage, per
the "Out of scope" section above. It is not recorded here as the owner of the
durable-substrate question.
