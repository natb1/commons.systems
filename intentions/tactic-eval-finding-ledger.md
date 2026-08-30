---
id: tactic-eval-finding-ledger
kind: tactic
statement: Retire the finding ledger as a distinct graph primitive — drop
  attributes.ledger_entry as a class marker, re-key the prune exemption to any
  node carrying attributes.measured_impact, and widen the mint-or-reuse search
  from the tactic-eval-finding-* namespace to the whole open tactic set
owner: ai
status: codified
parent: null
rationale: Rewritten 2026-08-14 by the /align round that dissolved the ledger
  primitive on author ruling. This node previously planned the ledger's
  construction; the construction landed, and what is now owed is retiring the
  part of it that made rsi findings a privileged class. Reused rather than
  superseded by a fresh node, which is the merge discipline this round records,
  practised on itself. The general rule it serves lives on
  strategy-graph-native-dispatch; the rsi-specific retirement lives on
  strategy-recursive-self-improvement.
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-rsi-delegated-prioritization
  - strategy-graph-native-dispatch
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Retire the finding ledger as a distinct graph primitive

Rewritten 2026-08-14 by the `/align` round that dissolved the ledger primitive,
and planned 2026-08-19. This node previously planned the ledger's
*construction*; the construction landed, and the author's ruling retires the
part of it that made rsi findings a privileged class. The id is deliberately
unchanged — an id is addressing, not membership, and it is cited in node bodies,
commit subjects and at least one shipped fix message. Reusing this node rather
than minting a successor is also the discipline this round records, practised on
itself.

Read the amended "What is the graph's role for harness optimizations"
clarification on `strategy-recursive-self-improvement` for which of the four
original requirements survive, and the "How is a finding recorded on the graph"
clarification on `strategy-graph-native-dispatch` for the general rule that
replaces them. Both are already summarized below; a clean session does **not**
need to read them to execute this plan.

## Context

Findings on this graph are recorded as ordinary draft tactics. Today a subset of
them — the ones `dispatch-eval-finding` writes — are additionally marked as a
privileged class, and three mechanisms key on that class:

1. **`attributes.ledger_entry` as a class marker.** `isLedgerEntry`
   (`packages/intentionsutil/src/schema.ts:529`) with its single live call site
   at `packages/intentionsutil/scripts/graph-census-debt.ts:143`, carrying the
   owed-prune exemption.
2. **The `tactic-eval-finding-*` id namespace as a membership test.** The
   mint-or-reuse search (`list_entries()`,
   `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:419-474`)
   scopes its candidate set to that prefix, OR'd with the class attribute.
3. **A writer private to one strategy**, which stamps the class marker on mint
   (`:1147`) and re-stamps it on every recurrence (`:1248`).

The measured damage of (2) is on `tactic-eval-finding-eval-finding-list-misses-nonledger`:
two nodes minted ten minutes apart for one defect, the shipped fix citing the
node **outside** the namespace while the recurrence count stayed stranded on the
one inside it — an outcome a namespace-scoped search structurally could not have
caught. That sibling widened the membership test from attribute-only to
prefix-OR-attribute; it is still a namespace, so the defect class is still open.
Measured 2026-08-19: **four** tactics carry `attributes.measured_impact` outside
the prefix and are therefore invisible to today's search —
`tactic-align-tactics-premise-preflight`,
`tactic-claim-containment-durable-anchor`,
`tactic-graph-commit-orphan-refusal-misattributed-content-failure`,
`tactic-sandbox-config-lock-phantom-mount-blocks-git-config-writes`.

**Intended outcome.** No code path reads `attributes.ledger_entry`. The
owed-prune exemption is re-keyed to *carrying measurements* — never prune a node
that holds `attributes.measured_impact`, whoever wrote it — which is a general
rule rather than a class exemption. The mint-or-reuse search reads the whole
open tactic population, and a match anywhere in it is addressable, so a
recurrence lands on the existing node instead of minting a near-duplicate.

### What survives, generalized

- **Merge, not accumulate.** One node per distinct finding; a recurrence updates
  `attributes.measured_impact` and mints nothing.
- **Summary metrics, not an occurrence array.** Unchanged — `measured_impact` is
  already documented on `intentions/kind-tactic.md` as a general tactic
  attribute and validated for any tactic by `validateGraph` rule 21
  (`packages/intentionsutil/src/schema.ts:1322-1360`). Nothing about it was ever
  rsi-specific.
- **Merge is a judgment.** Unchanged in kind, widened in scope: the search set
  becomes the whole open tactic population rather than one namespace.
- **Durability, re-keyed** — as above. This is the one place the class marker was
  actually load-bearing.
- **`pace_exempt: true` is not retired.** Recording a finding is not paced work
  for any producer, so it generalizes with the rest rather than going away.
- **The mint namespace stays.** New ids are still minted as
  `tactic-eval-finding-<slug>`; only *membership for search* and *addressing for
  update* widen. An id is addressing, not membership.

### Out of scope (whole plan)

- **Merging the five private finding writers into one surface.**
  `dispatch-invalid-state-followup`, `dispatch-security-followup` (with
  `dispatch-followup-exists`), `dispatch-qa-needs-main-followup` and
  `dispatch-fleet-alarm` are **not touched by any unit here**. That consolidation
  is `tactic-finding-search-all-producers`, which states the division of labour
  in its own body: *"That node removes the PRIMITIVE; this one supplies the
  single writer that replaces the five."*
- **The find-before-minting step inside each producer's skill** — same sibling.
- **Building the duplicate-findings sensor** — `tactic-duplicate-finding-sensor`.
- **Bulk-stripping `attributes.ledger_entry` from the 40 nodes that carry it.**
  It is dropped opportunistically as each node is touched, the same
  deprecated-legacy treatment the bare-string `strategy_fingerprint` form is
  being retired under. No unit edits `intentions/*.md` node files.
- `packages/intentionsutil/scripts/ledger-census.ts` is **unrelated** (it is the
  delegation-record ledger for `strategy-complete-ledger`). Do not touch it.

### Environment caveats a clean session needs

- `.claude/skills/` is a **read-only carve-out** in the sandbox
  (`sandbox.filesystem` `denyWithinAllow`). Edits to files under it need
  `dangerouslyDisableSandbox: true`; in auto mode the **commit** of a skill edit
  can also be denied and may need an interactive turn.
- `dispatch-eval-finding` is invoked live by `/rsi`, spawned fire-and-forget at
  every ladder phase boundary with its transcript discarded. Its stdout contract
  (`landed` / `noop` / `skipped-in-flight` / `skipped-locked`) and its exit codes
  (`0`, `1` write failed and rolled back, `64` usage, `69` environment, `70`
  dirty node file) are consumed by caller prose and **must not change shape**.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` **is**
  auto-run by `run-unit-tests.sh:190` (it globs `$SCRIPTS/test-*.sh`), so shell
  test edits are CI-gating, not optional.

---

## Unit 1 — Re-key the owed-prune exemption from the class marker to measurements

**Scope.**

- `packages/intentionsutil/src/schema.ts:511-532` — replace `isLedgerEntry` with
  `hasMeasurements(node)`: `node.kind === "tactic" && Array.isArray(attributes.measured_impact) && attributes.measured_impact.length > 0`.
  Rewrite the doc comment: it currently claims two consumers, and the second —
  *"`rsi.ts`'s §6 task plan"* — is **stale**; `rsi.ts` does not exist anywhere in
  the repo (it was retired with the rsi-plan render; see
  `packages/intentionsutil/src/spend.ts:14` "Formerly src/rsi.ts"). The new
  comment states the general rule (never prune a node that holds measurements,
  whoever wrote it), names the one live consumer, and names no namespace.
- `packages/intentionsutil/scripts/graph-census-debt.ts:50` (import), `:143`
  (`if (n.phase === "done" && !isLedgerEntry(n)) donePresent.push(n.id);`) —
  repoint to `hasMeasurements`. Rewrite the comment block at `:129-142` and the
  header bullet at `:13-15`: both currently justify the exemption in
  ledger-specific terms. The *reason* the exemption must live in this candidate
  query is unchanged and must be carried forward verbatim in substance —
  `graph-commit --prune` is content-blind, so nothing downstream can honour a
  convention the query does not encode.
- `packages/intentionsutil/test/graph-census-debt.test.ts` — edit, do not
  duplicate:
  - `:60-90` `retiredLedgerEntry()` fixture: rename to `retiredFindingRecord()`
    and **drop `ledger_entry: true`** from its attributes, keeping the
    `measured_impact` array. Its id argument should stay an arbitrary tactic id;
    add a second call with an id **outside** the `tactic-eval-finding-` prefix to
    lock in that the exemption is namespace-free.
  - `:153-168` `"does not exempt a done node whose ledger_entry is not literally true"`
    encodes the retired semantics. Replace it with the analogous
    measurement-keyed cases: a done node with **no** `attributes.measured_impact`
    is in `donePresent`; a done node with an **empty** `measured_impact: []` is in
    `donePresent`; a done node whose `measured_impact` is a non-empty array is
    exempt.
  - `:145-151` and `:170+` — update fixture names/ids to match.

**Measured blast radius (2026-08-19, 618 tactics / 158 done).** Exactly **zero**
nodes lose their exemption (every `done` node carrying `ledger_entry: true` also
carries `measured_impact`) and exactly **one** gains it —
`tactic-graph-commit-orphan-refusal-misattributed-content-failure`. Census
`total` goes 137 → 136. That single-node delta is the unit's verification anchor.

**Out of scope for this unit:** `dispatch-eval-finding`, `kind-tactic.md`, any
`intentions/*.md` node file.

**Recommended model:** sonnet.

---

## Unit 2 — Stop writing the class marker in `dispatch-eval-finding`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`
only.

- `:1147` — remove `ledger_entry: true,` from the mint-time `jq -n` attributes
  object literal.
- `:1248` — remove `ledger_entry: true,` from the recurrence-update `jq` pipe's
  `.attributes = ($attrs + { ... })` object. These are the **only two** writers
  of the attribute in the script (grep-confirmed; no third site). Removing one
  and not the other leaves an inconsistent writer.
- Comment sweep, same file: `:72`, `:156`, `:965`, `:1020` all narrate the
  attribute as live. Rewrite each to the measurement-keyed rule. `:965`'s claim
  that the census "exempts `attributes.ledger_entry` nodes precisely so this
  record survives" becomes the `measured_impact` rule (matching Unit 1).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` —
  `:20` (header index), `:335`
  (`assert_eq "(3) attributes.ledger_entry is true"`) must become an assertion
  that the minted node carries **no** `ledger_entry` key, and the mint-shape
  assertions around it stay. Fixture JSON at `:354`, `:381`, `:402`, `:431`,
  `:583`, `:850` keeps `ledger_entry: true` **only** where the fixture represents
  a legacy landed node (proving the writer neither reads nor re-stamps it); drop
  it where the fixture represents this writer's own output.

**Explicitly not removed:** `pace_exempt: true` in the mint object (`:1145`
region) and `attributes.first_seen`. Both generalize; neither is a class marker.

**Out of scope for this unit:** `list_entries()` membership (Unit 3), argument
handling (Unit 4).

**Recommended model:** sonnet.

---

## Unit 3 — Widen the mint-or-reuse search to the whole open tactic population

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`
`list_entries()` at `:419-474`, its explanatory header at `:401-418`, the
`usage()` block at `:271+`, and the shell test's `(15)` block at
`:606-787`.

**The membership predicate.** Today: `hasPrefix` (`:430-431`, excluding the
doctrine root `tactic-eval-finding-ledger`) OR `hasAttr` (`:432`,
`attributes.ledger_entry === true`), with `unregistered` (`:440-467`) flagging
rows where the two disagree. Replace all of it with one namespace-free test:

> a node is a candidate iff `kind === "tactic"` **and**
> (`phase !== "done"` **or** it carries a non-empty `attributes.measured_impact`).

Rationale to record in the comment: the open tactic set is the search set
(a duplicate is minted against an *open* node); retired nodes carrying
measurements stay in the set because a recurrence after retirement **resumes**
the count rather than restarting at 1, which only works if the retired record is
still visible to the judgment. The doctrine-root exclusion is **dropped** — under
a whole-population set, excluding this node would be exactly the special-casing
being retired.

**Consequences to implement, not to leave as prose.**

- `unregistered` is **removed, not reworded.** Its whole purpose was surfacing a
  class-marker/prefix mismatch that `ledger_entry` created; with a single
  membership test there is nothing left to disagree about.
- `recurrence_count` / `last_seen` are no longer forced to `0`/`null` for rows
  this script did not write. They are read from the row's own
  `measured_impact` `recurrence_count` record wherever one exists (`0`/`null`
  when absent), because `measured_impact` is now the general recurrence carrier
  for every producer, not a script-managed private figure.
- `slug` stays: the prefix suffix for ids under `tactic-eval-finding-`, `null`
  otherwise. It is the mint namespace, still live.
- Add `addressable_by` to each row (`"slug"` or `"id"`) so the caller knows which
  flag Unit 4 wants. (If Unit 4 is not yet merged when this unit is implemented,
  emit the field anyway — it is inert until then.)

**Bounding the output — required, and the judgment call of this unit.**
Measured 2026-08-19: the widened population is **482 rows / 216,764 bytes / ~59k
tokens** (today's `--list` prints 40 rows). `/rsi` calls this at every ladder
phase boundary, so an unbounded dump would regress the very per-workflow spend
fold `strategy-recursive-self-improvement` measures itself by. Bound it
**without** reintroducing a namespace:

- `--list` with no further flags keeps printing the **whole** candidate
  population. This is the audit view and the thing the Verification fence tests.
- `--list --like <text>` scores **every** member of the population by lexical
  overlap between `<text>` and the member's `id + " " + statement`
  (lowercase, split on non-alphanumerics, drop tokens shorter than 3 chars and a
  small stopword set, score = shared-token count normalised by the smaller token
  set), then emits: the top `--limit` rows (default `40`), **plus every member
  carrying a non-empty `measured_impact` regardless of score** (26 rows today —
  the durable records that must never be elided). Rows gain a numeric `score`
  field and sort by `score` desc, then `recurrence_count` desc, then `id`.
- **Disclose the elision.** stdout stays a bare JSON array (callers already
  `jq` it). Write one line to **stderr**:
  `population=<n> emitted=<n> elided=<n> score_cut=<f>`. An elision the caller
  cannot see is the same defect as a namespace; an elision it can see and widen
  with `--limit` is not.
- `--like` and `--limit` are rejected (exit 64) outside `--list`, alongside the
  existing mode-validation at `:477-479` and `:533-535`.

**Shell test `(15)` rewrite** (`:606-787`). Reuse its existing shape — an
isolated `$LIST_DIR` of full schema-valid node bodies driven through
`DISPATCH_EVAL_FINDING_INTENTIONS_DIR`, with the already-defined `assert_eq` /
`assert_contains` helpers — but the four fixtures change meaning:
(a) an open tactic under the prefix carrying `measured_impact`;
(b) an open tactic under the prefix with `attributes: {}`;
(c) an open tactic **outside** the prefix carrying `measured_impact` — the row
today's search misses;
(d) a `phase: done` tactic **outside** the prefix carrying `measured_impact`
(retired-but-visible); and add
(e) a `phase: done` tactic with no `measured_impact`, which must be **absent**.
Assert: four rows, `tactic-eval-finding-ledger` itself is now **present** when
present in the fixture dir, no row carries `unregistered`, (a)'s real
`recurrence_count` is reported, (c)'s real `recurrence_count` is reported (not
zeroed), and `--like` with a phrase matching only (c) puts (c) first while still
emitting (a)/(d) on the measurement-carrier floor.

**Out of scope for this unit:** writing to a matched node (Unit 4), caller skill
prose (Unit 5).

**Recommended model:** opus. The membership rule, the elision contract and the
test rewrite are design decisions, not a mechanical diff.

**Dependencies:** Unit 2 (the `hasAttr` arm it deletes must no longer be written
by the same script).

---

## Unit 4 — Make every matched node addressable, and stop the write clobbering foreign bodies

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`
argument handling (`:307-350`, `:586-600`), `splice_body` (`:751-769`), the
recurrence arm (`:1194-1290`), the commit-message strings at `:998`, `:1069`,
`:1168`, `:1264`, `usage()`, and the shell test suite.

**Why this unit exists.** A widened search that returns a node the writer cannot
update is not a widened search — the caller's only remaining act is to mint the
near-duplicate the widening exists to prevent. Today `ID` is *always*
`"$ID_PREFIX$SLUG"` (`:593`) behind an anchored regex (`:597`), so a match
outside the prefix is unaddressable.

**4a — `--id <node-id>` as the addressing flag.**

- Accept `--id <node-id>`; keep `--slug <slug>` as an exact alias for
  `--id tactic-eval-finding-<slug>` so every existing caller and test keeps
  working unchanged. Reject supplying both (exit 64).
- The slug-shape guard (`SLUG_RE`, `SLUG_MAX`, `:588-591`) still applies to
  `--slug`. For `--id`, validate the id against the general node-id shape
  `^[a-z0-9]+(-[a-z0-9]+)*$` and require the `tactic-` prefix.
- **The mint path keeps the namespace.** Move the anchored guard at `:597` from
  "always" to "only when `STATE == absent`": minting requires
  `^tactic-eval-finding-[a-z0-9]+(-[a-z0-9]+)*$`, and an `--id` outside it that
  classifies `absent` exits 64 with "refusing to mint outside the
  `tactic-eval-finding-` namespace; pass `--slug` to mint". Recurrence, retire
  and `--resolved-by` accept any valid tactic id.
- Commit messages at `:998`, `:1069`, `:1168`, `:1264` interpolate `$SLUG`, which
  is empty under `--id`. Interpolate `$ID` instead. Keep the message prefixes
  (`graph: record finding …`, `… recurred`, `… resolved by …`, `retire …`) —
  they are grepped in ops prose.

**4b — Never destroy a body this writer did not author.** `splice_body`
(`:751-769`) copies the frontmatter and then **replaces everything after it**
with `$BODY_FILE`. Pointed at an ordinary planned tactic — which the widened
search now returns — that silently destroys its execution plan. Make the splice
**delimited and idempotent**, one rule with no branching:

- The written body is wrapped in `<!-- finding:body -->` … `<!-- /finding:body -->`.
- If the existing body already contains that delimiter pair, the region between
  them is replaced in place and everything outside it is preserved.
- Otherwise the wrapped block is **appended** below the existing body (which is
  empty for a fresh mint, so mint output is unchanged apart from the two comment
  lines).

This also removes an existing destructive behaviour: today a recurrence on the
writer's own entry discards whatever prose a human added to it.

**4c — Refuse targets whose lifecycle is owned elsewhere.** The existing
in-flight guard (`:1201-1206`, `execution != null` → `skipped-in-flight`, exit 0)
is kept and **widened**: also refuse when the target's `phase` is non-null and
not `"done"`. A node in the dispatch ladder has a live
`tacticScopeFingerprint` over `(statement, body)`; rewriting its body mis-parks
the session working it. Emit the same `skipped-in-flight` word and exit 0, with a
log line naming the phase — the caller contract is unchanged.

**Shell tests.** Extend `test-dispatch-eval-finding.sh` using its existing
`run_ef` / `written` / `assert_eq` harness (stubs `STUB_STATE`, `STUB_NODE_JSON`,
`STUB_GC_LAND` are already defined): `--slug X` and `--id tactic-eval-finding-X`
produce byte-identical writes; `--id` on an out-of-namespace node classified
`open` records the recurrence and lands; `--id` on an out-of-namespace node
classified `absent` exits 64 without writing; a second recurrence replaces only
the delimited region and leaves surrounding prose intact; a target with
`phase: "implement"` prints `skipped-in-flight` and writes nothing.

**Out of scope for this unit:** the five sibling writers; any change to the
`landed` / `noop` / `skipped-*` vocabulary or the exit-code set.

**Recommended model:** opus. Body-clobber safety and the mint/update asymmetry
are exactly the kind of ordering hazard the heuristic reserves for opus.

**Dependencies:** Unit 3.

---

## Unit 5 — Make the normative docs and the caller prose agree with the code

**Scope.**

- `intentions/kind-tactic.md`:
  - Frontmatter `attributes.fields` (`:87-94`): delete the `ledger_entry` bullet.
    Nothing validates this list against actual node attributes (checked: no
    `validateGraph` rule and no test reads it), so the 40 nodes still carrying
    the attribute stay valid; the list is normative documentation, and leaving a
    retired field declared is the doc/code disagreement
    `strategy-graph-self-description` forbids.
  - Prose intro (`:116-120`): it currently says "The last two sections cover
    `attributes.measured_impact` and `attributes.ledger_entry`". Reduce to one.
  - `## measured_impact` (`:176-222`): fold in the surviving content —
    merge-not-accumulate, retirement keeps the figures and a recurrence resumes
    the count, and the **pruning exemption is keyed on carrying this field**
    (naming `computeDebt` in
    `packages/intentionsutil/scripts/graph-census-debt.ts` as the one place the
    exemption is mechanical, and `graph-commit --prune`'s content-blindness as
    why).
  - `## ledger_entry` (`:223-265`): replace with a short **retired** stub —
    what it meant, that it is retired, what carries each half now, and that the
    attribute survives on legacy nodes and is dropped opportunistically as those
    nodes are touched. Delete the stale `rsi.ts` §6 and `rsi-plan.md` §7
    citations outright (`:255-259`); neither file exists.
- `.claude/skills/rsi/SKILL.md:207-232` — Step 6's ledger read. `--list` is
  described as "prints open **and retired** entries"; it now prints the whole
  candidate population, so the step must call
  `--list --like '<the candidate finding statement>'` and must say that stderr
  reports what was elided and that `--limit` widens it. The three-way decision
  ("same finding → reuse", "retired entry → reuse", "genuinely new → mint") is
  unchanged in substance, but "reuse that entry's `slug`" becomes "reuse that
  entry's `id` — `--slug <slug>` for a row whose `addressable_by` is `slug`,
  `--id <id>` otherwise". Add the row fields `score` and `addressable_by`, and
  delete `unregistered` if it is named.
- `.claude/skills/rsi-audit/SKILL.md:168` (step 6.1) — same two changes:
  `--like` on the read, `--id` as an addressing option. `:164` and `:171`
  describe the writer's find-or-create semantics correctly and need no change
  beyond the `slug`→`id` wording; `:204`'s "a different graph surface than
  routing policy" stays true and is left alone.
- `.claude/skills/dispatch-ladder/SKILL.md:402-408` — the closing-synthesis
  paragraph's parenthetical `(dispatch-eval-finding: --list first, …)` gets the
  same `--like` correction.

**Out of scope for this unit:** any code change; any `intentions/*.md` node file
other than `kind-tactic.md` (which is a kind node, not a tactic).

**Recommended model:** sonnet.

**Dependencies:** Units 1-4 (the docs describe their landed behaviour).

---

## Reuse

- `packages/intentionsutil/src/schema.ts:511-532` — `isLedgerEntry`, the single
  shared predicate. Narrow it in place to `hasMeasurements` rather than
  open-coding a measurement test at the call site; the doc comment's own
  argument (a consumer that spells it differently silently un-exempts the
  record) survives the re-keying intact.
- `packages/intentionsutil/scripts/graph-census-debt.ts:129-143` — `computeDebt`'s
  `donePresent` exemption and its rationale comment. Edit in place; the
  `isCensusNode` exclusion three lines below is the same shape and the model to
  match.
- `packages/intentionsutil/test/graph-census-debt.test.ts:55-90,145-175` — the
  `retiredLedgerEntry` / `doneTactic` / `strategy` fixture builders and the
  existing exemption cases. Edit these; do not add a parallel test file.
- `packages/intentionsutil/src/schema.ts:1310-1360` — rule 21's
  `measured_impact` shape validation. Already general to any tactic; nothing to
  change, and it is what makes the re-keyed predicate safe to trust.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:258`
  `ID_PREFIX` and `:267` `SLUG_RE`/`SLUG_MAX` — keep as the **mint** namespace
  and slug-shape guard. Do not repurpose `ID_PREFIX` as a search filter.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:419-474`
  `list_entries()` — the inline `node --import tsx/esm` read over
  `packages/intentionsutil/src/store.js`'s `listNodes`, plus the
  `DISPATCH_EVAL_FINDING_LIST_CMD` stub hook at `:395-399` and the
  `DISPATCH_EVAL_FINDING_INTENTIONS_DIR` override. Extend this function; do not
  add a second reader.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:735-769` —
  `origin_blob` / `restore_from_blob` / `splice_body`, and `run_graph_commit` /
  `verify_landed` below them. The rollback-and-landing discipline is unchanged;
  only `splice_body`'s internals move.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` —
  `run_ef`, `written`, `assert_eq`, `assert_contains`, the `STUB_*` fixtures and
  the isolated `$LIST_DIR` node-body fixtures at `:606-787`. Reuse this harness
  for every new case; write no parallel test file.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-200` — already
  globs and runs every `test-*.sh` in that directory. No runner wiring needed.

## Verification

Run from the repo root (or the worktree root). Every fence below **fails on
today's `origin/main`** — verified 2026-08-19 — so none of them can pass
vacuously.

Baselines confirmed green before any change: `177/177` in the shell suite and
`1044/1044` across 50 files in the vitest suite.

The class marker is no longer read or written anywhere in code:

```verify
if grep -q 'ledger_entry: true' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding"; exit 1; fi
```

```verify
if grep -q 'export function isLedgerEntry' packages/intentionsutil/src/schema.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/src/schema.ts"; exit 1; fi
```

The stale `rsi.ts` / `rsi-plan.md` citations are gone from both places that carry
them (the same defect in the doc and in the code comment):

```verify
if grep -qE 'rsi\.ts|rsi-plan\.md' intentions/kind-tactic.md; then echo "FAIL: the forbidden pattern is still present in intentions/kind-tactic.md"; exit 1; fi
```

```verify
if grep -qE 'rsi\.ts' packages/intentionsutil/src/schema.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/src/schema.ts"; exit 1; fi
```

The owed-prune census exempts a `phase: done` node **because it carries
measurements**, in no particular namespace — this id is a done tactic carrying
`attributes.measured_impact` and no `ledger_entry`, and it is in `donePresent`
today:

```verify
node --import tsx/esm packages/intentionsutil/scripts/graph-census-debt.ts --intentions intentions | jq -e '.donePresent | index("tactic-graph-commit-orphan-refusal-misattributed-content-failure") == null'
```

The mint-or-reuse search returns a finding node outside the
`tactic-eval-finding-*` namespace — this id carries `measured_impact` and is
invisible to today's search:

```verify
.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding --list | jq -e '[.[] | select(.id == "tactic-sandbox-config-lock-phantom-mount-blocks-git-config-writes")] | length == 1'
```

The two suites:

```verify
npm test --prefix packages/intentionsutil
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

Lint (it runs the type-safety escape check unconditionally):

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / judgment checks.**

- **A retired finding survives a prune sweep and resumes its count.** Not
  auto-runnable — `graph-commit --prune` deletes node files and pushes. Confirm
  by reading `computeDebt`'s output for a `phase: done` node carrying
  `measured_impact` (the fence above does exactly this for one node) and by the
  vitest cases added in Unit 1; the end-to-end sweep is observed in production on
  the next census drain.
- **The elision is honest.** Run
  `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding --list --like 'graph-commit prune deletes a node that holds measurements' 2>&1 >/dev/null`
  and read the stderr line: `population` must be the full candidate count
  (~482 today), and raising `--limit` must monotonically raise `emitted`. A
  `population` figure that shrinks when `--like` is passed means the filter moved
  into the search set, which is the namespace defect returning under another
  name.
- **`--like` finds a known duplicate.** Pass the statement of
  `tactic-eval-finding-eval-finding-list-misses-nonledger` and confirm the
  matching non-namespaced node ranks in the emitted set. This is the concrete
  historical failure the widening exists to prevent.
- **No foreign body is destroyed.** Before merging Unit 4, hand-run the writer
  against a scratch intentions dir (`DISPATCH_EVAL_FINDING_INTENTIONS_DIR`)
  holding a tactic with a long plan body and confirm the plan text is still
  present after a recurrence lands, with the finding prose appended inside the
  `<!-- finding:body -->` delimiters.
- **Caller prose still executes.** Read `/rsi` Step 6 and `/rsi-audit` step 6
  end to end after Unit 5 and confirm a clean session can follow them with no
  knowledge of `attributes.ledger_entry`.
