---
id: tactic-review-cross-lane-dedup
kind: tactic
statement: Deduplicate built-in-lane residue against owned-lens findings for fix
  assignment only, leaving skeptic eligibility unchanged
owner: ai
status: codified
parent: null
rationale: "laneAResidue never enters the allFindings/dedup pool
  (review-fix.js:1256, confirmed live at HEAD), so a defect both lanes find is
  fixed once by the Lane-B fix fan-out and then handled again by the Opus
  residue-disposition agent — duplicated Opus draw and a redundant
  disposition-ledger entry, not a concurrent-edit hazard (residue is sequenced
  strictly after fix fully resolves). The historic duplicate-draw and per-fix
  cost figures from the 2026-07-27..07-31 window descend from a hand-rolled Opus
  stand-in for the built-in /code-review, not the real instrument
  (strategy-token-economy clarification 17), so under condition 6 they are not
  admissible as a measured warrant; the slice is warranted structurally instead
  — condition 5 sanctions deduplication as a lever, and the exclusion is
  code-confirmed. Five binding author rulings recorded 2026-08-03 on
  strategy-token-economy resolve the design questions this plan implements
  verbatim: (1) Lane-B always wins dedupMerge representative selection on a
  cross-lane group; (2) the merge sequences at or after the existing
  code-review-residue skeptic pre-gate (commit 7c772829); (3) per-file batching
  of that pre-gate is out of scope here (sibling
  tactic-review-verify-per-file-batching); (4) absorption requires the Lane-B
  twin to have survived verify AND been fixed — Refuted, Unverified, and
  merely-Deferred-queued Lane-B findings never absorb; (5) reordering the
  deferred_filings computation to change that is out of scope (a re-plan, not a
  plan). See the node body for the full plan, the invariant proof, and
  verification."
reading: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.04
  rationale: >-
    Author-directed 2026-08-01: prioritize review-phase token/agent-cost
    reduction. Puts this tactic ahead of the undecomposed baseline and on par
    with other tier-2 improvement work, without contending with active
    reliability fixes (top-of-band ~55-61).


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-review-cross-lane-dedup
  pr: 3028
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T00:30:23Z
    mergeCommitSha: 0710dc0e204bf7c9284ebcf4f7f30ef16c17ae84
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Deduplicate built-in-lane residue against owned-lens findings for fix assignment only, leaving skeptic eligibility unchanged

## Context

`.claude/workflows/review-fix.js` runs two review lanes that never see each
other:

- **Lane A** (`code-review`, `security-review` — the set at
  `review-fix.js:355`) runs the built-in skills, lets them apply their own
  edits, and returns a `{ fixed, residue }` envelope (`LANE_A_SCHEMA`,
  `review-fix.js:199-247`). Its un-auto-fixed residue is collected into
  `laneAResidue` at `review-fix.js:1223-1233` and flows straight to
  `phase('residue')` (`review-fix.js:1720`).
- **Lane B** (domain-sweep, cost, codeql, npm, erosion) is gathered into
  `allFindings` at `review-fix.js:1254-1272` and flows through
  dedup (`1315`) → classify (`1400`) → verify (`1497`) → fix (`1627`).

The gather loop skips Lane A outright — `if (LANE_A.has(name)) continue;` at
`review-fix.js:1256`. **`laneAResidue` therefore never enters the dedup pool,
so no deduplication happens across the lanes.** That exclusion is still
present at HEAD; this is the defect the tactic exists to remove.

Consequence today: a defect both lanes found at the same location is fixed by
the Lane-B Opus fix fan-out (`review-fix.js:1646-1695`) and then handed AGAIN
to the Opus residue-disposition agent (`review-fix.js:1963-1971`), which reads
the file and may edit it a second time. That is duplicated Opus draw on a
defect already fixed, plus a redundant edit to code the fix agent just
rewrote.

**Correction to the draft's stated harm:** the draft called this a
"concurrent-edit hazard". It is not concurrent — `phase('residue')` is
explicitly sequenced after the fix fan-out fully resolves precisely so no two
agents edit the tree at once (comment at `review-fix.js:1711-1719`). The real
harm is sequential double-work: a second Opus pass over an already-fixed
root, and a second disposition ledger entry for one defect.

**Magnitude caveat (2026-07-31 second interview, carried forward):** the
"7 of 27 confirmed findings", "9 of 27 shared a location", and "31 of 40
(run, file) pairs" figures measured over 18 runs 2026-07-27..2026-07-31
compare two OWNED reviews — the built-in `/code-review` never actually ran in
that window (strategy clarification 17). The defect is unaffected and still
real; only the magnitude is unmeasured against the real instrument. One figure
from that window IS load-bearing here and survives the caveat: **2 of the 9
same-location pairs were genuinely distinct defects sharing a source line.**
A ~22% false-merge rate is why this plan keeps the semantic same-root
partition agent and does not absorb on bare location equality.

**Interaction with clarification 24 (carried forward):** serializing the
built-in ahead of the owned lenses (lenses run against the post-fix tree)
already removes the *fixed-finding* half of the historic overlap
structurally. This node's remaining job is the residue half — findings the
built-in reports but does not fix.

### Binding author rulings (2026-08-03, recorded on strategy-token-economy)

These are settled. Implement them; do not re-derive or re-open them.

1. **Lane-B is always the surviving representative.** When a same-root group
   spans both lanes, the Lane-B record's `Source`/`id`/`bucket` survives and
   the Lane-A record is discarded into the `sources` union — never the
   existing Confidence-desc/`_idx`-asc winner. This makes it structurally
   impossible for a Lane-A-derived entry to acquire bucket `Required`. A
   group that is Lane-A-only or Lane-B-only keeps today's merge behavior
   unchanged.
2. **The merge runs at or after the existing code-review-residue skeptic
   pre-gate** (landed by commit `7c772829`, now at `review-fix.js:1797-1885`,
   filtering `laneAResidue` in place at `review-fix.js:1883`), so it can never
   merge an already-refuted item. A pre-gate-upheld Lane-A item stays
   non-verify-eligible.
3. **Per-file batching of that pre-gate is OUT OF SCOPE here.** It belongs to
   sibling `tactic-review-verify-per-file-batching`. Do not fold it in; only
   coordinate ordering (see the sibling note below).
4. **Only a Lane-B finding that survived verify AND was actually fixed
   absorbs its Lane-A twin.** A Refuted or Unverified-dropped Lane-B finding
   never absorbs. A Lane-B finding merely queued for Deferred filing does not
   absorb either — ledger-completeness wins over dedup-perfection; accept the
   residual duplicate on that root.
5. **Do not reorder the `deferred_filings` computation** (`review-fix.js:2157`,
   which runs after `phase('residue')`) to make the Deferred case absorb. That
   reordering is a re-plan, not a plan. If it resurfaces, flag it as an open
   question; do not solve it here.

### The invariant this must not break

Verify eligibility must be unchanged by the merge. The predicate is
`applyVerifyDrop`'s `f.bucket === 'Required' || (f.Source === 'erosion' &&
f.bucket === 'Fixed')` (`review-fix.js:575-597`, called at
`review-fix.js:1592`). Lane-A residue is never routed to the adversarial
skeptic stage **at the verify phase**. Two reasons:

1. The residue disposition prompt frames these items as already confirmed by
   the built-ins' own internal verification (`review-fix.js:1909-1913`) — a
   framing that holds for `security-review` residue, which carries a verified
   instrument receipt.
2. Arithmetic: ~103 Lane-A residue items per window would add roughly 100
   skeptic agents at the verify phase, cancelling the entire gain from
   `tactic-review-verify-per-file-batching`.

The pre-gate added by `7c772829` is **not** the verify stage this invariant
protects — the exclusion names the verify stage specifically. Ruling 2 above
keeps the merge downstream of that pre-gate's refute filter.

In this plan the invariant is preserved **structurally, not by convention**:
the merge point (`review-fix.js:1886`, immediately after the pre-gate filter)
is downstream of `phase('verify')` entirely, and no Lane-A item is ever
appended to `allFindings` or to `deduped` as a new entry. Lane-A items are
projected into finding shape only to be *absorbed into* an existing Lane-B
`deduped` entry, whose `Source`/`id`/`bucket` are unchanged by the merge.

### Explicitly out of scope

- Appending Lane-A residue into `allFindings` (`review-fix.js:1272`) or into
  the main dedup phase. That would drag Lane-A through classify/verify and is
  exactly what the invariant forbids.
- Per-file batching of the residue skeptic pre-gate (ruling 3).
- Moving or re-sourcing `deferred_filings` (ruling 5).
- Lane-A-internal deduplication (two Lane-A residue items at one location).
  The residue agent already sees them together in one prompt.
- File-level (rather than `path:line`-level) cross-lane grouping. The
  normative spec is "group by trimmed Location; distinct locations never
  merge" (`dispatch-review-dedup:29-31`); widening the grouping key is a
  semantics change. The unmeasured recall left on the table is noted below
  under judgment checks.
- `.claude/skills/review-fix/SKILL.md` frontmatter/description. The change is
  internal to the Workflow; the normative doc that must move is
  `disposition-table.md` (Unit 5).

### Sibling coordination

`tactic-review-verify-per-file-batching` (also a raw draft) owns per-file
batching of the residue skeptic pre-gate at `review-fix.js:1797-1885`. This
tactic inserts a new block at `review-fix.js:1886`, immediately after that
pre-gate's `laneAResidue` filter. **The two land in adjacent code and will
conflict textually if implemented concurrently.** Land this tactic first if
possible: it consumes the pre-gate's *output* (the filtered `laneAResidue`)
and is agnostic to how the pre-gate's agents are batched, whereas the sibling
rewrites the pre-gate's internals. If the sibling lands first, this tactic's
insertion point is unchanged — it is still "after the statement that
reassigns `laneAResidue` to the upheld subset".

Note also for that sibling's implementer: its own node body still states its
scope as `phase('verify')` lines 858-935 only, with no mention of the residue
pre-gate. Those line numbers are ~600 lines stale and the scope statement
predates the ruling that extends it to the pre-gate. That reconciliation
belongs to that node, not this one.

---

## Unit 1 — Pin Lane-B as the dedupMerge representative

**Scope.**

- `.claude/workflows/review-fix.js:517-557` — `CONF_RANK`, `rankConf`,
  `dedupMerge`. Add a lane-priority term to the ordering sort at
  `review-fix.js:530-532` so the comparator becomes
  `(laneA-last, Confidence desc, _idx asc)`: a member whose `Source` is in
  `LANE_A` (`review-fix.js:355`) sorts after every non-Lane-A member, so
  `ordered[0]` — the representative whose `id`/`Source`/`bucket`/`Location`
  and all passthrough fields survive — is always the Lane-B record when the
  group spans lanes. Everything else about `dedupMerge` is unchanged: max
  Confidence, first-non-empty OWASP/STRIDE in the (now lane-aware) order, and
  the sorted-unique `sources` union.
- Update the function's leading comment (`review-fix.js:515-516`) to state the
  lane-priority term and why (a Lane-A win would narrow verify eligibility by
  stripping a Lane-B `Required` finding's bucket).
- Wrap `CONF_RANK`/`rankConf`/`dedupMerge` in probe sentinels for Unit 4:
  `// >>> dedup merge: sliced + eval'd by review-fix-xlane-dedup-probe.mjs >>>`
  before line 517 and `// <<< dedup merge <<<` after `dedupMerge`'s closing
  brace. Each sentinel must appear exactly once in the file (the probes fail
  loudly otherwise — see `review-fix-residue-death-probe.mjs:44-61`). The
  sliced region must not reference `LANE_A`, or the probe cannot eval it in
  isolation: inline the membership test as a local
  `const LANE_A_SOURCES = new Set(['code-review', 'security-review']);`
  **inside** the sentinel region and leave the existing `LANE_A` at line 355
  as-is for the rest of the file, OR (preferred) move the sentinel START
  *above* nothing else and instead have `dedupMerge` take lane membership from
  a module-level constant defined inside the region. Pick one and keep the
  duplication commented as deliberate, with a pointer at `review-fix.js:355`
  naming the sliced copy so the two never drift.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-dedup` — the
  normative spec this JS mirrors (declared at `review-fix.js:514` and in that
  script's own Consumer note at lines 45-46). Mirror the same tie-break in the
  jq: the representative sort at `dispatch-review-dedup:90` and the
  OWASP/STRIDE ordering sorts at `dispatch-review-dedup:96-108` all become
  `sort_by([(lane-a-flag), (Confidence|confrank|-.), .idx])` where the flag is
  `1` for `Source` in `["code-review","security-review"]` and `0` otherwise.
  Update the header's "Merge arithmetic per group" prose at
  `dispatch-review-dedup:30-38` to state the rule.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-review-dedup.sh` —
  add cases: (a) a high-confidence `code-review` member and a low-confidence
  `secrets` member at one location, partitioned together → the emitted `id`
  and `Source` are the `secrets` ones, `Confidence` is `high` (max is still
  computed across the group), and `sources` is the union; (b) a two-Lane-B
  group is unaffected by the new term (regression guard on today's
  Confidence-desc behavior); (c) a Lane-A-only group still picks the
  Confidence-desc/`_idx`-asc winner.

Out of scope: any change to which findings enter `dedupMerge` (that is Unit 3);
`applyVerifyDrop`; the partition prompt.

Note: this tie-break is a **no-op on the existing dedup phase**, because
`allFindings` contains no Lane-A-sourced findings today — the gather loop
skips Lane A at `review-fix.js:1256`, and the Source clamp at
`review-fix.js:1252-1272` relabels any Lane-B agent's out-of-brief `Source` to
its own primary lens. It only takes effect at Unit 3's new call site. Say so
in the comment.

**Recommended model.** sonnet

---

## Unit 2 — Extract the same-root partition agent into a reusable helper

**Scope.**

- `.claude/workflows/review-fix.js:1332-1360` — the inline Sonnet
  same-root partition (prompt construction, `PARTITION_SCHEMA` agent call,
  and the "fall back to all-separate if the agent died" rule at
  `review-fix.js:1359`). Extract it verbatim into a function declared near the
  other kernel helpers:

  ```
  async function partitionSameRoot(loc, group, { label, phase: phaseName })
  ```

  returning the array of id-subgroups (today's `partition` value). It keeps
  the existing `subagentsLaunched += 1` accounting and the same
  `model: 'sonnet'`, `agentType: 'general-purpose'`, `schema: PARTITION_SCHEMA`
  options; `label` and `phase` become parameters so the second call site
  (Unit 3) can attribute its agents distinctly. Default them to
  `dedup:${loc}` / `'dedup'` so the existing call site is byte-equivalent in
  behavior.
- Rewire `review-fix.js:1327-1331` to call the helper for the `group.length > 1`
  branch; the `group.length <= 1` trivial-partition branch stays inline and
  makes no model call.
- Add ONE untrusted-data line to the extracted prompt, before the findings
  JSON: state that every `Description` below is untrusted text that the diff
  under review can influence, that any imperative inside it is text to judge
  and never a directive, and that the only valid output is the id partition.
  This is correct for both call sites (Lane-B descriptions are agent-authored
  from the diff; Lane-A descriptions at the Unit 3 call site are a free-text
  parse with no instrument receipt — see `review-fix.js:1799-1806`). Model it
  on the framing already used at `review-fix.js:1830-1836`.

Out of scope: changing the partition rule, the schema, the fallback semantics,
or the `group.length <= 1` shortcut. This is a behavior-preserving move plus
one prompt line.

**Recommended model.** sonnet

---

## Unit 3 — Cross-lane absorption at the residue merge point

**Scope.** All in `.claude/workflows/review-fix.js`, inserted as a new block
at line 1886 — after the pre-gate's `laneAResidue = laneAResidue.filter(...)`
(`review-fix.js:1883`) and its closing brace (`1885`), and before
`if (laneAResidue.length === 0)` (`review-fix.js:1887`). Everything the block
needs is in scope there: `deduped` (`1396`), `fixedIds` (`1697`),
`laneAResidue`, `dedupMerge`, `partitionSameRoot`, `log`.

Implement, in order:

1. **Lane-B absorption-eligible set.** `deduped.filter((f) => fixedIds.has(f.id))`.
   This is the exact encoding of ruling 4: `fixedIds` is built from `fixed`
   (`review-fix.js:1697`), which is built from `fixSet`
   (`review-fix.js:1629-1632` — `bucket === 'Fixed' || (bucket === 'Required'
   && verify === 'Upheld')`), which is drawn from `keptFindings`, i.e.
   `applyVerifyDrop`'s survivors. A Refuted or Unverified finding is in
   `refutedFindings`, never in `fixed`. A `Deferred`-bucket finding never
   enters `fixSet`. So "survived verify AND was actually fixed" is exactly
   `fixedIds` membership, and the Refuted / Unverified / Deferred exclusions
   fall out structurally with no extra predicate. `fixedIds` is Lane-B-only at
   this point — the Lane-A push happens later at `review-fix.js:2143` (see the
   comment at `2136-2142`). Comment this reasoning at the call site; it is the
   whole of ruling 4 and it is not obvious from the identifier name.

2. **Lane-A absorption-candidate set.** Every surviving `laneAResidue` entry
   **except** those with `source === 'security-review' && severity === 'high'`.
   Rationale (comment it): those are the only Lane-A items wired to the
   `deviation` escalation gate (`review-fix.js:2266-2277`, which iterates
   `laneAResidue` by index). Lane-B `fixed[]` entries come from the fix agent's
   self-reported `resolved_ids` (`review-fix.js:1683-1694`) with **no**
   working-tree verification — unlike the residue path's `appliedVerified`
   check (`review-fix.js:2039-2046`). Absorbing a high-severity
   security-review item against an unverified Lane-B fix claim would silently
   suppress a human escalation. Leaving those items unabsorbed costs at most
   one duplicate disposition and preserves the gate. This exclusion is a
   detection-preservation guard under strategy condition 5; it is additive to
   the author's rulings, not a substitute for any of them.

3. **Project each candidate into finding shape** (non-destructively — the
   ORIGINAL `laneAResidue` object must still reach the residue disposition
   prompt unchanged, so build a separate projection and carry the original
   array index on it):
   `Location` ← `location.trim()`, `Description` ← `description`,
   `Confidence` ← `severity` (the `LANE_A_SCHEMA` enum at
   `review-fix.js:220` is `high|medium|low`, identical to
   `FINDING_ITEM_SCHEMA`'s `Confidence` enum at `review-fix.js:110`),
   `'Recommended fix'` ← `recommended_fix`, `Source` ← `r.source` (already
   `'code-review'` / `'security-review'` from `review-fix.js:1225/1228`),
   `OWASP` ← `''`, `STRIDE` ← `''` (`dedupMerge`'s `firstNonEmpty` handles
   `''` — `review-fix.js:544-550`), `id` ← `` `laneA-residue-${i}` ``,
   `_idx` ← `allFindings.length + 1 + i` (so a Lane-A item can never win the
   `_idx` tie-break either — belt and braces alongside Unit 1's lane term),
   and `_laneAIdx` ← `i`. `category` / `exploit_scenario` have no Lane-B
   analog and are simply absent from the projection; they are never read by
   the merge and the original object still carries them.

4. **Group and partition.** Build a Map keyed by trimmed `Location` over the
   union of (1) and (3). Keep only *contested* groups — those with at least one
   member from each side. For each contested group call
   `partitionSameRoot(loc, group, { label: \`xlane-dedup:${loc}\`, phase: 'residue' })`.
   Use `phase: 'residue'` (these agents genuinely run in the residue phase, so
   the token audit attributes them honestly, and the verify-phase agent-count
   arithmetic the sibling tactic is justified by stays untouched); the distinct
   `label` prefix is what separates them in the audit. Agent count is bounded
   by `min(|fixedIds|, |laneAResidue|)` and in practice by the number of exact
   `path:line` collisions — typically a handful; no cap is added.

5. **Absorb.** For each returned subgroup containing ≥1 Lane-B member AND ≥1
   Lane-A member: call `dedupMerge(members)`. Assert the result's `id` equals
   the (single) Lane-B member's `id` — if it does not, `log` a loud line and
   **skip the absorption** (fail closed: keep both records). This is a cheap
   structural check that Unit 1's pinning actually held, and it is the only
   thing standing between a regression in `dedupMerge` and a narrowed verify
   ledger. Replace that entry in `deduped` with the merged object (same array
   position, same `id`), and add each Lane-A member's `_laneAIdx` to an
   `absorbedIdx` Set. A subgroup with ≥2 Lane-B members and ≥1 Lane-A member
   is possible only if the main dedup phase left two same-location Lane-B
   entries unmerged (a distinct-root partition); in that case absorb into the
   first Lane-B member in `deduped` order and record the others' `sources`
   through the normal union.
   Subgroups that are Lane-A-only or Lane-B-only are no-ops.

6. **Suppress the absorbed Lane-A twins.**
   `laneAResidue = laneAResidue.filter((r, i) => !absorbedIdx.has(i));`
   — the same in-place filter pattern the pre-gate already uses at
   `review-fix.js:1883`. Every downstream consumer re-derives its indices from
   the filtered array (`residueForAgent` at `review-fix.js:1892`,
   `residueResolvedByIdx`, `undispositionedResidueRecords` at
   `review-fix.js:2111`, the `deviation` clause at `review-fix.js:2272`), so
   no index remapping is needed — but state that dependency in a comment,
   because it is the one thing a future edit could silently break.

7. **Log.** One line: contested-location count, absorbed-item count, and the
   `laneAResidue` before → after sizes.

**Audit-record semantics (get this right — it is where the invariant lives).**
An absorbed Lane-A item gets **no** new `laneADispositions` entry. Its record
is the `sources` union on the surviving Lane-B entry, which
`review-fix.js:2285-2312` already renders as
`sources: f.sources && f.sources.length ? f.sources : [f.Source]` — so the
merged entry surfaces under the Lane-B `id`/`Source`/`bucket` with both lanes
listed in `sources`, exactly as ruling 1 specifies. Do **not** emit a
`Fixed`-bucket disposition for the absorbed item: `fixes_applied` is
`fixed.length` (`review-fix.js:2342`) and
`.claude/docs/outcome-envelope.md:106` pins the invariant
`fixes_applied === count of Fixed-bucket dispositions`. An extra `Fixed`
disposition with no matching `fixed[]` entry would break it and inflate
`hit_rate`. With absorption, `findings_surfaced` correctly drops by one per
absorbed duplicate while `fixes_applied` is unchanged.

**Downstream safety (verify before writing, then comment).** The only mutated
field on the `deduped` entry is `sources` (plus `Confidence`, which is
recomputed as the group max). Confirm by inspection that nothing after
`review-fix.js:1886` reads `deduped[].Confidence`: `deferred_filings`
(`2157-2196`) keys on `bucket`/`unverifiedIds`/`upheldErosionIds` and reads
`Description`/`Location`/`'Recommended fix'`; `security_followup_input`
(`2201-2234`) keys on `Source`/`security_class`; `dispositions` (`2285-2312`)
reads `id`/`Description`/`Location`/`bucket`/`sources`/`Source`; the
`deviation` gate (`2263-2277`) reads `keptFindings` and `laneAResidue`, not
`deduped`. A `fixedIds` member is by construction neither `Deferred` nor in
`unverifiedIds`, and the `upheldErosionIds && !fixedIds` clause excludes it —
so absorption cannot change which entries file follow-ups.

Out of scope in this unit: touching the pre-gate block (`1797-1885`) at all;
any change to `allFindings`, `phase('dedup')`, `phase('classify')`,
`phase('verify')`, or `phase('fix')`.

**Recommended model.** opus

**Dependencies.** Unit 1, Unit 2.

---

## Unit 4 — CI coverage for the pure cross-lane logic

`.claude/workflows/*` has no vitest mapping and `run-unit-tests.sh` only sets
`RUN_PR_SCRIPTS=true` for changed paths under
`.claude/skills/dispatch-propagate/scripts/` (`run-unit-tests.sh:88`), so a PR
touching only `review-fix.js` runs no suite. The established vector is the
unconditional `hook-tests` job in `.github/workflows/unit-tests.yml:184-216`,
fed by a slice-and-eval probe. Follow that pattern exactly.

**Scope.**

- Refactor the Unit 3 block so its pure parts are named, side-effect-free
  functions inside a second sentinel pair
  (`// >>> cross-lane dedup: sliced + eval'd by review-fix-xlane-dedup-probe.mjs >>>`
  … `// <<< cross-lane dedup <<<`), with the imperative glue (`log`,
  `partitionSameRoot` await, reassigning `laneAResidue`) left outside:
  - `laneAAbsorbCandidates(laneAResidue)` → `[{ i, r }]`, applying the
    high-severity-security-review exclusion;
  - `projectLaneAResidue(entry, idxOffset)` → the finding-shaped projection;
  - `contestedLocationGroups(laneBEligible, laneAProjections)` → `Map<loc, members[]>`
    restricted to groups with both lanes present;
  - `applyXlaneAbsorption({ deduped, subgroups, merge })` → `{ deduped, absorbedIdx, skipped }`,
    with `merge` injected so the probe can supply the real sliced `dedupMerge`.
- New `.claude/skills/dispatch-propagate/scripts/review-fix-xlane-dedup-probe.mjs`,
  modeled on `review-fix-residue-death-probe.mjs` (resolve `review-fix.js` via
  `new URL('../../../workflows/review-fix.js', import.meta.url)`; assert each
  sentinel appears **exactly once**; eval each slice in an IIFE). It slices
  **two** regions — the Unit 1 `dedup merge` region and the cross-lane region —
  and evals them into one scope so the absorption function can be driven by the
  real `dedupMerge`. Print a JSON result table on stdout.
- New `.claude/skills/dispatch-propagate/scripts/test-review-fix-xlane-dedup.sh`,
  modeled on `test-review-fix-residue-death.sh`: source
  `dispatch-test-fixture.sh`, run the probe once, assert with `assert_eq` over
  `jq` filters. Fixtures must cover:
  - **Lane-B wins the representative** — Lane-A `high` + Lane-B `low` at one
    location, partitioned together → surviving `id`/`Source`/`bucket` are
    Lane-B's, `sources` is the union, and the Lane-A index is in `absorbedIdx`.
    This is the discriminating assertion for ruling 1; without Unit 1's
    tie-break it fails.
  - **Distinct roots at one location do not absorb** — partition returns two
    subgroups → nothing absorbed, `deduped` unchanged.
  - **Refuted / Unverified / Deferred Lane-B never absorbs** — those ids absent
    from the injected `fixedIds`-eligible input → no absorption (ruling 4).
  - **High-severity security-review Lane-A is never a candidate.**
  - **Medium/low-severity security-review and any-severity code-review Lane-A
    are candidates.**
  - **Fail-closed** — an injected `merge` that returns a Lane-A `id` → the
    absorption is skipped, `deduped` is unchanged, and `skipped` is non-zero.
  - **Empty inputs** — empty `laneAResidue`, empty eligible set → no-op, no
    throw.
- Wire one step into `.github/workflows/unit-tests.yml` in the `hook-tests`
  job, alongside the sibling review-fix suites at lines 211-216:
  `- name: Run review-fix cross-lane dedup tests` /
  `run: .claude/skills/dispatch-propagate/scripts/test-review-fix-xlane-dedup.sh`.
  The comment block at `unit-tests.yml:199-206` explicitly asks new suites
  whose SUT lives outside the scripts dir to be added here — do it.

Out of scope: converting the other probes; adding a vitest mapping for
`.claude/workflows/*`.

**Recommended model.** sonnet

**Dependencies.** Unit 1, Unit 3.

---

## Unit 5 — Reflect cross-lane absorption in the normative disposition spec

**Scope.**

- `.claude/skills/review-fix/references/disposition-table.md` — the normative
  disposition spec. It currently documents (a) that the pipeline's
  classify/verify/fix stages never run over Lane-A findings and only classify
  Lane-B sources (lines 20-24), (b) the code-review residue pre-gate in the
  `Refuted` row (line 12) and the "Everything else the review reported becomes
  residue" paragraph (lines 35-44). Add a short paragraph immediately after
  that residue paragraph stating:
  - after the pre-gate and before disposition, Lane-A residue is matched
    against the Lane-B findings this run actually fixed;
  - a same-root match at the same `path:line` is absorbed — the Lane-B record
    survives with both lanes in `sources`, and the Lane-A twin is dropped from
    the residue ledger so the defect is dispositioned and fixed exactly once;
  - absorption requires the Lane-B finding to have survived verify and been
    fixed: Refuted, Unverified, and Deferred Lane-B findings never absorb, so
    their Lane-A twins stay in the ledger;
  - high-severity `security-review` residue is never absorbed, so the
    escalation gate is unaffected;
  - the merge is for deduplication and fix assignment only — it does not
    change verify eligibility, and no Lane-A item ever reaches the verify
    phase's adversarial skeptics.
- Keep the statement at lines 20-24 true: classify/verify/fix still never run
  over Lane-A findings. If the added paragraph makes that phrasing read
  ambiguously, tighten it rather than leaving both standing.

Out of scope: `.claude/skills/review-fix/SKILL.md`; the Step-4 bucket table
rows (no new bucket is introduced).

**Recommended model.** sonnet

**Dependencies.** Unit 3.

---

## Reuse

- `dedupMerge` — `.claude/workflows/review-fix.js:521-557`. The merge
  arithmetic. Extended once (Unit 1), then reused verbatim for cross-lane
  groups. Do not write a second merge function.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-dedup` — the
  normative jq spec that `dedupMerge` mirrors (declared at
  `review-fix.js:514`, Consumer note at `dispatch-review-dedup:45-46`). Any
  merge-semantics change updates both, plus
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-review-dedup.sh`.
- `LANE_A` — `.claude/workflows/review-fix.js:355`. The existing lane
  membership Set. `Source` + `LANE_A.has(Source)` **is** the lane tag the
  rulings call for; do not invent a parallel constant or a new per-finding
  field.
- The same-root partition agent — `.claude/workflows/review-fix.js:1332-1360`
  with `PARTITION_SCHEMA`. Extracted in Unit 2 and reused; the cross-lane call
  site adds no new prompt.
- `fixedIds` — `.claude/workflows/review-fix.js:1697`. The existing Lane-B
  fixed-id membership Set. It is the absorption-eligibility predicate; do not
  build a new tracking structure.
- The in-place `laneAResidue` filter — `.claude/workflows/review-fix.js:1883`
  (the pre-gate's own suppression step). Unit 3's suppression copies this
  pattern exactly, so downstream index derivation stays correct.
- `LANE_A_SCHEMA` residue field names — `.claude/workflows/review-fix.js:199-247`
  (`location`, `description`, `severity`, `category`, `exploit_scenario`,
  `recommended_fix`) vs `FINDING_ITEM_SCHEMA` — `review-fix.js:76-114`
  (`Location`, `Description`, `Confidence`, `OWASP`, `STRIDE`,
  `'Recommended fix'`). The field-mapping shim is derived from these two, not
  guessed.
- `applyVerifyDrop` — `.claude/workflows/review-fix.js:575-597`. Read it to
  confirm the eligibility predicate; it is not modified by any unit.
- `review-fix-residue-death-probe.mjs` and `test-review-fix-residue-death.sh`
  (both in `.claude/skills/dispatch-propagate/scripts/`) — the slice-and-eval
  probe pattern and its bash driver, including the fail-loudly
  exactly-once sentinel check (`review-fix-residue-death-probe.mjs:44-61`).
  Copy the structure; do not invent a new test harness.
- `dispatch-test-fixture.sh` — `.claude/skills/dispatch-propagate/scripts/`.
  Supplies `assert_eq` and `$SCRIPT_DIR` to the new driver.
- `.claude/docs/outcome-envelope.md:100-130` — the envelope counting rules and
  the `fixes_applied === Fixed-bucket dispositions` invariant that constrains
  Unit 3's audit-record choice.
- The untrusted-data prompt framing at `.claude/workflows/review-fix.js:1830-1836`
  — model Unit 2's added partition-prompt line on it.

## Verification

Auto-runnable:

```verify
node --check .claude/workflows/review-fix.js
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-review-dedup.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-xlane-dedup.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh
```

The last three are regression guards: they slice `review-fix.js` between their
own sentinels, so an edit that disturbs those regions or duplicates a sentinel
fails them loudly.

Manual / judgment checks — the ones a suite cannot make:

- **Read the diff against ruling 1.** In the merged code, trace one
  hypothetical cross-lane group by hand and confirm the surviving entry's
  `id`, `Source`, and `bucket` are the Lane-B ones. The fail-closed assertion
  in Unit 3 step 5 should make a violation impossible, but confirm it is
  actually wired and not commented out.
- **Confirm the merge point.** `git grep -n "laneAResidue = laneAResidue.filter"`
  must show the pre-gate's filter strictly BEFORE the cross-lane block's
  filter, and both strictly after `phase('residue')`. If the cross-lane block
  ever moves above the pre-gate, ruling 2 is violated and an already-refuted
  item can be merged.
- **Confirm no verify-phase change.** `git diff` must show zero edits between
  `phase('verify')` and `phase('fix')` (`review-fix.js:1497-1626`) and zero
  edits to `applyVerifyDrop`. The verify-phase skeptic agent count is
  unchanged by construction; there is no run-time counter to compare.
- **Observe in production, first review run after merge.** In the workflow log,
  look for the `xlane-dedup:` labelled agents and the absorption summary line.
  Confirm: `residue` count drops by exactly the absorbed count; the PR comment
  shows the absorbed root once, under the Lane-B source, with both lanes in
  `sources`; `fixes_applied` equals the count of `Fixed`-bucket dispositions
  (the outcome-envelope invariant); and no file appears in both a Lane-B
  `fixed[]` entry's `touched_files` and a `laneAResidueFixed` entry's
  `touched_files` for the same root.
- **Confirm a Refuted/Unverified/Deferred Lane-B twin did not absorb.** On a
  run that produces one, check the Lane-A item still appears in the residue
  ledger with its own disposition. This is ruling 4's accepted-duplicate case;
  seeing the duplicate is the pass condition, not a defect.
- **Unmeasured, worth measuring before trusting the cost estimate** (carried
  forward from the strategy clarification, still true): nobody has counted how
  often a Deferred Lane-B finding shares a root with a Lane-A residue item.
  The duplicate rate ruling 4 accepts could be near zero or material. No probe
  or audit script in the repo computes it. Likewise, the yield of this change
  against the REAL `/code-review` instrument is unmeasured — the original
  overlap figures came from a hand-rolled stand-in (strategy clarification 17)
  and the invocation path was only fixed by `7c772829`. After a few real runs,
  the absorption-count log line is the measurement; read it before claiming a
  magnitude.
- **Recall left on the table.** Absorption keys on exact trimmed
  `path:line` equality. Two lanes describing one defect but citing lines a few
  apart will not group. The historic file-level overlap was much heavier than
  the location-level overlap (31 of 40 vs 9 of 27 in the 2026-07-27..07-31
  window), so a file-level grouping key would raise recall — at the cost of
  deviating from the normative "distinct locations never merge" rule and
  running many more partition agents. Left out deliberately; revisit only with
  real-instrument data.
