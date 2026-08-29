---
id: tactic-dispatch-conflict-substance-allowlist
kind: tactic
statement: Export STATE_FIELDS from schema.ts and replace /dispatch-conflict's
  prompt-level doctrine guard with a mechanical check that refuses any non-state
  field write to a durable-layer node
owner: ai
status: codified
parent: null
rationale: "Ruled 2026-08-14 as violation V2 of strategy-graph-native-dispatch's
  autonomous-substance invariant. /dispatch-conflict's Lane 2 reconciliation
  builds an unconstrained jq filter from an opus subagent's output and sets
  whatever fields diverged on any node kind, with
  virtue/strategy/tradition/delegation doctrine fields explicitly in scope. The
  only guard is a sentence in a prompt; no code refuses a substance field on a
  durable-layer id. Ruled 2026-08-14 as a six-field positive allowlist and
  corrected 2026-08-15 to a negative not-in-STATE_FIELDS check, after the
  pre-commit review showed the positive form omits rationale — the field the
  skill's own ratified doctrine names first — along with attributes, owner and
  parent. Model the refuse-before-mutation contract on park-node's --base pin
  rather than on graph-commit's, which auto-merges a stale blob instead of
  refusing. FINALIZED 2026-08-20 (/align-tactics tactic-mode round) into a
  three-unit plan: export STATE_FIELDS plus a single canonical
  DURABLE_LAYER_KINDS from schema.ts (deduping coverage.ts onto it and
  cross-referencing grounding.ts's deliberately narrower set); a new owned
  primitive check-substance-write.ts with a pure testable core and a dedicated
  exit 3 modelled on park-node; and a Lane 2 rewire that makes the subagent's
  diverged-field list machine-readable, runs the gate between the dump and the
  jq, routes exit 3 into Lane 2's existing already-parked ambiguous path, and
  pins the whole contract with a SKILL.md doctrine ratchet. Two questions the
  draft left open are answered in the plan rather than deferred: the draft's
  'not measured' provenance question (git log shows Lane 2's resolved path has
  never landed a commit, so this is a live hole and not past damage), and the
  attributes sub-key question (neither re-homing nor sub-key granularity is owed
  — the three cited writers either target tactics they mint themselves or run
  from an attended surface)."
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
## Context

`strategy-graph-native-dispatch`'s clarification *"Which lanes violate the
autonomous-substance invariant today"* enumerates four lanes that write
**substance** to durable-layer nodes with no human ruling on the write. This
node is **V2** and V2 only — V1 is carried by
`tactic-align-tactics-immaterial-drift-redirect`, V3 (`node-merge.ts`) is a
**recorded structural exception explicitly not assigned a fix**, and V4 is
carried by `tactic-review-fix-porcelain-guard-script`. Do not gate any of them
here.

**The gap.** `/dispatch-conflict`'s Lane 2 resolves a `graph-commit`
mechanical-unresolved park by launching an opus subagent, then applying whatever
fields it says diverged through an **unconstrained `jq` filter** and
`write-node.ts`. The filter is literally
`jq '<.field1 = value1 | .field2 = value2 | …> | .office_hours = null'`
(`.claude/skills/dispatch-conflict/SKILL.md:628-629`), fed from
`dump-node.ts`'s full-node JSON (`:617-618`) and landed by `graph-commit`
(`:640-641`). There is **no field-name validation anywhere on that path**, and
the lane runs on **any node kind**.

The only thing stopping the lane from rewriting a virtue's `statement` is a
prose blockquote at `SKILL.md:576-583` telling the subagent to resolve "only
mechanical divergence … never synthesizing new substance". **A prompt is not a
gate.** `write-node.ts` cannot backstop it either: its own comment records that
`validateNode` *drops unknown keys* and re-applies defaults — it has no concept
of durable-layer kind or of which caller is proposing the write, and it is also
the write path an **attended** office-hours disposition uses, so a blanket
refusal inside it would break the legitimate path.

Lane classification is genuinely arguable — a human types `/dispatch-conflict`
— but under the ruled definition of *attended* (a human rules on the **write**,
not on the invocation) nothing reviews the reconciliation before it lands, so
the lane is **autonomous** and may not EDIT-SUBSTANCE a durable-layer node.

**Intended outcome.** Export the router-/sensor-owned `STATE_FIELDS` set from
`schema.ts`, and put a mechanical refusal on Lane 2's path: when the target id
resolves to a durable-layer kind, refuse any proposed field for which
`!STATE_FIELDS.has(field)` holds, before any mutation, with a dedicated exit
code — and route the refusal into Lane 2's existing already-parked
`ambiguous` shape so a human decides. The prose blockquote stays as
documentation; it stops being the control.

### Negative form, not a positive allowlist — settled, do not relitigate

This was ruled 2026-08-14 as a **positive** six-field allowlist (the
`strategyFingerprint` fields) and **corrected 2026-08-15** to the negative
`!STATE_FIELDS.has(field)` form after the pre-commit adversarial review showed
the positive form **fails open**. Verified against current `origin/main`:

- `strategyFingerprint()` (`packages/intentionsutil/src/router.ts:103-118`,
  exported at `src/index.ts:23`) hashes exactly `statement`, `clarifications`,
  `attributes.conditions`, sorted `serves`, `success_signal`, `tooling_goals`.
- **`rationale` is not in it** — and `rationale` is the field the skill's own
  ratified doctrine names *first*
  (`SKILL.md:576-577`: "virtue/strategy/tradition/delegation `statement`,
  `rationale`, clarification text"). The positive form left the guard's primary
  target unprotected.
- Also falling through: `attributes` (graph-semantics-bearing — `validateGraph`
  keys on `attributes.goal_layer` at `schema.ts:1043` and
  `attributes.status_vocabulary`; `/grounding-research` writes
  `attributes.grounding` / `attributes.curriculum` onto durable nodes today),
  `owner` and `pace_exempt` (authority fields), plus `parent`, `recovers`,
  `validates`, `kind`.

Under the negative form a field added to the schema tomorrow defaults to
**substance**, which is the fail-safe direction, and there is no second list to
keep in sync. **Do not resolve any downstream awkwardness by widening a
positive form back out** — that is exactly the failure this correction fixed.

### Provenance: this is theoretical, not historical — measured, do not re-plan

The stored draft flagged "not measured: whether this has ever fired on a durable
node." **It is measured now.** Lane 2's `resolved` path commits with the literal
message `graph: reconcile mechanical-unresolved conflict on $NODE_ID`
(`SKILL.md:641`). Re-verified 2026-08-20 on this worktree at `origin/main`:

- `git log --all --oneline --grep="reconcile mechanical-unresolved conflict"`
  → **0 commits**.
- `git log --all --oneline --grep="mechanical-unresolved"` → only
  graph-commit / dispatch-conflict **build** commits (`23d34e44`, `c5b2b90a`,
  `bc1d5a23`, `af90ee45`, `a6a07ced`, `4a83dfc1`) and one park-clearing commit
  on a *tactic* (`63625f5b`).

**No durable-layer doctrine text has ever been model-reconciled by this lane.**
Do **not** plan or execute a git-history-search unit — it is done. This is a
guard against a live hole, not a cleanup of past damage.

### Verified state of the world (2026-08-20, `origin/main`)

- `STATE_FIELDS` **does not exist**: `grep -rn "STATE_FIELDS"
  packages/intentionsutil/src packages/intentionsutil/scripts` returns nothing.
  Unit 1 is a genuine net-new export, not a move.
- `interface IntentionNode` is declared at
  `packages/intentionsutil/src/schema.ts:220-251` (mirror `IntentionNodeInput`
  at `:259-282`) with exactly **21** fields:
  `id`, `kind`, `statement`, `owner`, `status`, `parent`, `serves`, `recovers`,
  `rationale`, `reading`, `clarifications`, `tooling_goals`, `success_signal`,
  `attention`, `phase`, `execution`, `validates`, `blocked_by`, `office_hours`,
  `pace_exempt`, `rounds`, `attributes`.
  Subtracting the 8 state fields leaves **14** substance fields the gate refuses
  on a durable-layer id: `id`, `kind`, `statement`, `owner`, `parent`, `serves`,
  `recovers`, `rationale`, `clarifications`, `tooling_goals`, `success_signal`,
  `validates`, `pace_exempt`, `attributes`.
- `SKILL.md` is 1572 lines. Lane 2 = `:510`; subagent launch = `:561`; doctrine
  blockquote = `:576-583`; `resolved` write-back section = `:592`; checkout +
  dump fence = `:613-619`; **`jq` fence = `:627-630`**; `write-node.ts` +
  `graph-commit` fence = `:637-646`; "Why no `--base`" = `:648`;
  **`ambiguous` path = `:675`**; **Lane 3 starts at `:736`** — the second
  `write-node.ts`/`graph-commit` pair at `:717-726` is **Lane 3's; do not gate
  it**.
- `.claude/skills/dispatch-conflict/` contains **only** `SKILL.md`. There is no
  `scripts/` dir there and nothing globs one.

## Unit 1 — Export `STATE_FIELDS` and a single canonical `DURABLE_LAYER_KINDS` from `schema.ts`

### Scope

**Changes**

`packages/intentionsutil/src/schema.ts` — add two module-level exports next to
the `IntentionNode` declaration (the natural textual home is immediately after
the interface at `:220-251`; the interface's own
`// Graph-native dispatch state (see strategy-graph-native-dispatch)` comment at
`:240-241` marks the region, but **its membership is not the ratified set — use
the location, not the grouping**: that comment covers `validates` and
`pace_exempt`, which are substance):

```ts
/**
 * The router- and sensor-owned fields: a write confined to these is
 * EDIT-STATE — mechanical, freeze-inert, unrestricted on tactics.
 *
 * This set is the NEGATIVE half of the substance/state line ratified on
 * strategy-graph-native-dispatch: EDIT-SUBSTANCE is defined as every field
 * NOT in this set, so a field added to IntentionNode tomorrow defaults to
 * substance — the fail-safe direction. Do NOT re-express this as a positive
 * list of substance fields; that form was ruled 2026-08-14 and corrected
 * 2026-08-15 because it silently exempts every field nobody thought to list
 * (it omitted `rationale`, `attributes`, `owner` and `parent`).
 *
 * Typed `ReadonlySet<string>` rather than `ReadonlySet<keyof IntentionNode>`
 * on purpose: callers test caller-supplied field NAMES, including names that
 * are not IntentionNode keys at all (a stray `body`, a typo, an injected
 * key). Those must land on the substance side, and a `keyof` type would make
 * `.has(x)` uncallable for them without a cast.
 */
export const STATE_FIELDS: ReadonlySet<string> = new Set([
  "phase",
  "execution",
  "office_hours",
  "reading",
  "attention",
  "rounds",
  "status",
  "blocked_by",
]);

/**
 * The durable layer: the kinds whose substance is human-decided. An
 * autonomous entry point may CREATE tactics only, may EDIT-STATE freely, and
 * may NOT EDIT-SUBSTANCE a node of one of these kinds.
 *
 * Canonical home for this membership. `coverage.ts` imports it. NOT the same
 * set as `grounding.ts`'s `DURABLE_KINDS`, which deliberately EXCLUDES
 * `tradition` because tradition-* records ARE the grounding — that one
 * answers "which kinds must carry grounding marks", a different question.
 */
export const DURABLE_LAYER_KINDS: ReadonlySet<string> = new Set([
  "virtue",
  "strategy",
  "delegation",
  "kind",
  "tradition",
]);
```

`packages/intentionsutil/src/coverage.ts:32-38` — delete the local
`const DURABLE_KINDS` and import `DURABLE_LAYER_KINDS` from `./schema.js`
instead, updating its single use at `coverage.ts:182`. **This is a pure dedup
with zero behavior change**: the local set is
`{virtue, strategy, kind, tradition, delegation}`, byte-identical membership to
the new canonical one. Keep the existing explanatory comment (tactics excluded,
etc.) attached to the import site.

`packages/intentionsutil/src/grounding.ts:26-35` — **do not change the set or
its name.** Add one cross-reference line to its doc comment recording that it is
deliberately narrower than `schema.ts`'s `DURABLE_LAYER_KINDS` (no `tradition`)
and answers a different question. Renaming the export is out of scope.

`packages/intentionsutil/src/index.ts:1` — add `STATE_FIELDS` and
`DURABLE_LAYER_KINDS` to the existing `export { … } from "./schema.js"` line
(which today exports `validateNode, validateGraph, OWNERS, STATUSES,
TOOLING_KINDS`).

`packages/intentionsutil/test/schema.test.ts` — add a `STATE_FIELDS` /
`DURABLE_LAYER_KINDS` describe block with:

1. Exact-membership pins for both sets (8 and 5 members).
2. **A completeness ratchet that fires when a schema field is added.** Build a
   default node at runtime via `validateNode` on a minimal input, take
   `Object.keys(node)`, and assert it equals the union of `STATE_FIELDS` and an
   explicitly pinned 14-member substance list (the list in "Verified state of
   the world" above). When someone adds a 22nd field to `IntentionNode` this
   test fails, forcing a deliberate classification — that is the fail-safe
   direction made observable. Add a comment saying exactly that, and saying the
   fix is to add the new field to the substance list unless it is genuinely
   router-owned.
3. A negative case: `STATE_FIELDS.has("rationale")`, `.has("attributes")`,
   `.has("owner")`, `.has("parent")` are all **false** — the four fields the
   rejected positive form missed, pinned by name so the regression is loud.
4. `STATE_FIELDS.has("body")` is **false** — a non-`IntentionNode` name lands on
   the substance side.

**Out of scope**

- Any `validateGraph` rule. The gate is a read-time membership test at
  reconciliation time, not a graph-validation rule. Do **not** add a checker
  function in the `checkGoalLayerOnlyFields` (`schema.ts:1137-1160`) family.
- `node-merge.ts`'s `LIST_FIELDS` / `SCALAR_FIELDS` (`:35-64`). They partition
  a **different axis** (how a field merges), not state-vs-substance —
  `clarifications` is a `LIST_FIELD` and emphatically substance. Reuse their
  *shape convention* (module-level export, doc comment naming the rule it
  governs); do not touch or conflate their membership.
- `strategyFingerprint` / `tacticScopeFingerprint` (`router.ts:103-139`). They
  stay as the deliberately-narrower freeze readings. Freeze coverage is narrower
  than substance by design.

### Greenfield note on durable-layer membership — decision required in review, recorded here

**The ideal greenfield design is kind data, not a code literal.** Durable-layer
membership belongs on the kind nodes as `attributes.durable_layer: true`,
read through a `kindIsDurableLayer(kind, byId)` helper mirroring
`kindIsNotGoalLayer` (`schema.ts:1041-1044`), exactly as `goal_layer` already
works — `kind-kind.md:446-449` states the convention verbatim: kinds are
goal-layer "because their kind node sets the `goal_layer` flag, not because code
names them."

**This node deliberately does not take that path, and the reason is the
invariant itself.** Writing `attributes.durable_layer: true` into the frontmatter
of `intentions/kind-{virtue,strategy,delegation,kind,tradition}.md` is an
EDIT-SUBSTANCE on five durable-layer nodes. Under the invariant this very node
exists to enforce, an autonomous `/implement-unit` session **must not** make that
write; it requires an attended `/align` round. Landing the flag autonomously
here would be the guard committing the violation it forbids on its first commit.

**Migration path to the greenfield form** (separate, attended, not this node):
(1) an attended `/align` round adds `attributes.durable_layer: true` to the five
kind nodes plus the `kind-kind.md` normative paragraph and rule-list entries
mirroring `goal_layer`'s at `:446-449` / `:671` / `:683`; (2) a follow-up
tactic adds `kindIsDurableLayer` and repoints `DURABLE_LAYER_KINDS`'s consumers
at it, keeping the literal as the fallback for a store with no kind nodes
loaded. Until then the code literal in `schema.ts` is the single canonical home
and every other copy imports it.

**Do not reach for `kindIsNotGoalLayer` as a shortcut.** Verified: `grep -n
goal_layer intentions/kind-*.md` shows `goal_layer: true` in the frontmatter of
`kind-strategy.md:95` and `kind-tactic.md:83` only (`kind-kind.md`'s hits at
`:316`, `:446`, `:449`, `:671`, `:683` are **prose**, not frontmatter). So
`strategy` is goal-layer **and** durable-layer, and a `goal_layer`-derived test
would let a strategy substance write straight through — the exact failure this
node exists to prevent.

### Recommended model

`sonnet` — mechanical, fully specified, no design latitude left.

## Unit 2 — New owned primitive `check-substance-write.ts` (pure core, refuse before mutation)

### Scope

**New file** `packages/intentionsutil/scripts/check-substance-write.ts`.

Modeled structurally on `packages/intentionsutil/scripts/check-node-selection.ts`
— read its header (`:1-40`), its exported pure core `evaluateSelection`
(`:214`), and its thin `main` (`:438-442`) before writing. Same shape: an
exported pure function returning `{ exitCode, stdout, stderr }` so it is
unit-testable without spawning a process, and a `main` that maps the result onto
real stdio and `process.exit`.

**Contract**

```
Usage: npx tsx packages/intentionsutil/scripts/check-substance-write.ts \
         --dir <intentions-dir> <node-id> <field> [<field>...]
```

- `--dir` is **required**, no default. (Repo convention: `dump-node.ts`,
  `write-node.ts` and `validate-graph.ts` all require an explicit store path so
  invoking a script by absolute path from a foreign cwd cannot silently target
  the wrong tree.)
- Reads the node with `readNode` from `../src/store.js`. Does **not** read the
  body — `readNode` returns no body, and no field name it checks needs one.
- **No writes, no `git`, no `gh`, no network.** Pure read plus an exit code.

**Behavior**

1. If `<node-id>` does not resolve in `--dir`, or the store read throws
   (`IntentionSchemaError` from `../src/errors.js`): exit **1**, one clear line
   on stderr. Per `.claude/rules/code-style.md`, do not fall back to "allow" on
   an unreadable node — a misconfigured store must fail loudly, and failing
   *closed* is also the safe direction for a guard.
2. If `!DURABLE_LAYER_KINDS.has(node.kind)`: exit **0**, silent. Tactics and any
   future non-durable kind are unrestricted here.
3. Otherwise partition the supplied field names on `STATE_FIELDS.has(field)`.
   - all state → exit **0**, silent.
   - any non-state → exit **3**, and print one stderr message carrying, in
     order: the literal token `substance-refused`, the node id **and its kind**,
     the refused field names (sorted, comma-separated), the allowed state
     fields that were also proposed if any, a one-line statement that an
     autonomous lane may not EDIT-SUBSTANCE a durable-layer node and that a
     human must rule on this write, and the literal sentence
     **`Nothing was written.`**
4. Malformed invocation — missing `--dir`, no node id, zero field names, a node
   id failing `^[A-Za-z0-9._-]+$` (copy park-node's id guard at
   `park-node:197-200`) — exit **2** with a usage line.

**Exit-code table, documented in the header** (mirroring `park-node:105-113`'s
four-part shape — header contract / documented exit codes / cheap pre-flight
resolution before any side effect / refuse-with-both-values-and-nothing-was-
written):

```
0  every proposed field is writable on this node
1  the node could not be read from --dir (absent, or a malformed store entry)
2  usage error
3  substance-refused — the target is a durable-layer node and at least one
   proposed field is not in STATE_FIELDS. Nothing was written. Route to a
   human; do NOT retry, and do NOT drop the refused field and land the rest.
```

The header must state that **3 is this script's own code**, structurally
parallel to `park-node`'s `3 = stale-diagnosis` (refuse-before-mutation, zero
side effects, route back to a human rather than to a retry) but a different
meaning — and that the model is `park-node`'s `--base`, **explicitly not
`graph-commit`'s**. Verified contrast, worth restating in the header comment so
nobody re-derives it: `graph-commit`'s `check_base_freshness()` comments
"Attempt a structural three-way merge instead of refusing" and its
`emit_verdict_and_exit()` parks with `exit 1`, never 3, despite the file's own
header claiming otherwise. `park-node:355-362` is the working precedent: the pin
check runs "before ANY mutation … a stale pin has zero side effects to roll
back", and its message names both values and ends "Nothing was written."

**New test file** `packages/intentionsutil/test/check-substance-write.test.ts`,
modeled on `packages/intentionsutil/test/check-node-selection.test.ts` (same dir,
same in-memory/tmp-fixture style). Cases, all against the pure core:

1. Durable `strategy` node + `["rationale"]` → 3. *(The field the rejected
   positive form missed — pin it by name.)*
2. Durable `virtue` node + `["statement"]` → 3.
3. Durable `strategy` node + `["attributes"]` → 3.
4. Durable `delegation` node + `["owner"]` → 3.
5. Durable `strategy` node + `["office_hours"]` → **0** — the park clear is a
   state write and must stay legal, or Lane 2 deadlocks on its own guard.
6. Durable `strategy` node + `["reading"]` → 0.
7. Durable `strategy` node + `["office_hours", "rationale"]` → 3, with **both**
   the refused and the allowed field named in stderr.
8. `tactic` node + `["statement", "rationale"]` → 0.
9. Durable node + `["body"]` → 3 — a name that is not an `IntentionNode` key at
   all lands on the substance side.
10. Each of the five durable kinds is refused for `statement`; `tactic` is not.
11. Absent node id → 1. Missing `--dir` → 2. Zero fields → 2. Malformed id → 2.
12. Refusal stderr contains the literal `substance-refused` and the literal
    `Nothing was written.` — the two tokens Unit 3's lane text and its ratchet
    both key on.

**Out of scope**

- Any change to `write-node.ts`. The gate is caller-invoked, not embedded:
  `write-node.ts` is also the write path an **attended** office-hours
  disposition uses, so a refusal inside it would break the legitimate path, and
  `validateNode` has no notion of caller attendance. Its own comment already
  records that it drops unknown keys — which is *why* it cannot be the backstop.
- Wiring any caller other than `/dispatch-conflict`. The primitive is written to
  be reusable (that is why `STATE_FIELDS` lives in `schema.ts` rather than
  inside the script), but this node's blast radius is V2 only.
- Sub-key granularity beneath `attributes` — see the recorded decision below.

### The `attributes` sub-key open question — decision, recorded, not implemented

The stored draft flagged three measured sites writing `attributes` sub-keys that
are plainly *state*, and asked whether they are further violators or whether
`STATE_FIELDS` needs sub-key granularity. **Re-measured 2026-08-20; the question
resolves without either change:**

- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` writes
  `attributes.resolved_by` (jq at `:1064`) and
  `attributes.ledger_entry` / `first_seen` / `measured_impact`
  (`:1147-1149` mint, `:1248-1250` merge). Autonomous — **but every one of those
  writes lands on a ledger node it mints itself with `kind: "tactic"`
  (`:1125`)**. Autonomous lanes may CREATE tactics and edit them freely, so
  these are not violations under any granularity, and the gate never sees them.
- `.claude/skills/reading-review/SKILL.md:527` stamps
  `attributes.irreversibility.last_exercised` on a `delegation-*` node — durable
  layer, but `/reading-review` is an **attended** surface (a human rules on the
  write at the sitting), so EDIT-SUBSTANCE is permitted there by the invariant.

**Decision: neither re-homing nor sub-key granularity is owed.** `attributes`
stays whole-field substance. The residual exposure is narrow and stated
explicitly for the next reader: a *future* gate that keys `STATE_FIELDS` on
**tactic** writes would refuse `dispatch-eval-finding` — but that would be
enforcing a different invariant than the one ruled (which restricts
EDIT-SUBSTANCE on durable-layer nodes only), so it would be that gate's design
problem, not this one's. **Do not resolve any of this by widening a positive
form back out.**

This decision must not contradict `intentions/tactic-finding-search-all-producers.md`
(status `raw`, `phase: null`), which states the same negative `STATE_FIELDS`
definition and carries the `attributes` sub-key problem in its own body. That
node is a **draft**, so it cannot be a `blocked_by` dependency — the two nodes
simply must agree on the definition, and they do. Its cited anchors have drifted
(`dispatch-eval-finding` is ~1287 lines and has been edited); the anchors above
are the re-measured ones.

### Dependencies

Unit 1 (imports `STATE_FIELDS` and `DURABLE_LAYER_KINDS`).

### Recommended model

`opus` — a new primitive whose whole value is a subtle negative-form contract
and a fail-closed exit-code space that a later reader will be tempted to soften.

## Unit 3 — Rewire Lane 2 to the mechanical gate, ratchet the doctrine

### Scope

All edits in `.claude/skills/dispatch-conflict/SKILL.md`, **Lane 2 only**
(`:510` through `:735`). Lane 3 begins at `:736`; its own
`write-node.ts` / `graph-commit` fence at `:717-726` belongs to Lane 2's
`ambiguous` path's dump and to Lane 3 respectively — **gate neither.**

**3a. Make the subagent's field list machine-readable** (`SKILL.md:561-591`).

Today the subagent is told to end with "`resolved` — its reconciled value(s) for
each diverged field", freeform, and the lane substitutes assignments into the
`jq` filter by hand. A gate fed by a model's prose extraction is not mechanical.
Change the `resolved` contract to require, immediately after the `resolved`
token, a single fenced ```json block containing **one flat object whose keys are
top-level `IntentionNode` field names and whose values are the reconciled
values**, and nothing else — e.g. `{"statement": "…"}`. State that
`office_hours` must **not** appear in it (the lane clears the park itself), that
keys must be top-level field names only (no `.a.b` paths, no `body`), and that
the object is the input to a mechanical guard which will refuse the whole
reconciliation if it names a substance field on a durable-layer node.

Add one sentence to the doctrine blockquote's surrounding prose — **leave the
blockquote at `:576-583` itself verbatim; it is ratified doctrine quoted from
`intentions/strategy-graph-native-dispatch.md`** — recording that as of this
change the doctrine is *also* enforced mechanically for durable-layer nodes by
`check-substance-write.ts`, and that the blockquote is now documentation of a
rule the code enforces rather than the rule's only enforcement.

**3b. Insert the gate between the dump and the `jq`** — new prose + fence
between `SKILL.md:619` (close of the dump fence) and `:627` (open of the `jq`
fence). It runs after `git checkout origin/main -- "intentions/$NODE_ID.md"`
(`:614`) so it reads current `origin/main` content, and before anything is
written:

```bash
printf '%s' "$RESOLVED_JSON" > "$SCRATCH/$NODE_ID.fields.json"
GATE_RC=0
npx tsx packages/intentionsutil/scripts/check-substance-write.ts \
  --dir intentions "$NODE_ID" \
  $(jq -r 'keys[]' "$SCRATCH/$NODE_ID.fields.json") || GATE_RC=$?
```

(`$RESOLVED_JSON` is the fenced object from 3a. Capture the exit code with
`|| GATE_RC=$?` — the surrounding block must not be under `set -e`, the same
reason `assert-node-selection:118-134` runs `set -uo pipefail` and not `-e`:
the non-zero exit is the signal, not a fatal.)

Then case-dispatch, in prose the model can follow:

- `0` — proceed to the `jq` fence at `:627-630` unchanged.
- `3` — **substance-refused.** Take Lane 2's existing
  `ambiguous <reason>` path (`:675`) verbatim, with
  `<reason>` = `substance-write-refused on <kind> <NODE_ID>: <fields>`. Write
  **nothing**: no `jq`, no `write-node.ts`, no `graph-commit`, **no phase-completed
  marker**. The node is **already parked** by `graph-commit`, and that path is
  already documented at `:675-735` as a *no-op park-confirmation, not a fresh
  park* — so it deliberately does **not** invoke
  `.claude/skills/dispatch-propagate/escalation-recommend.md`, and it must not
  overwrite `graph-commit`'s field-breakdown `office_hours.recommendation`.
  Report the refusal to the caller/log and stop.
- `1` or `2` — a tooling failure, not a verdict. Do **not** fall through to the
  write. Report and stop the same way; treat it as fail-closed.

**3c. Record why the gate is here and not further down.** Add a short prose
paragraph after the fence, in the register of the existing "Why no `--base`"
note at `:648`:

- The gate is **caller-side and refuse-before-mutation** because
  `write-node.ts` cannot be it: `validateNode` drops unknown keys and re-applies
  defaults with no notion of durable-layer kind or caller attendance, and the
  same script is the write path an attended office-hours disposition uses.
- `office_hours` is in `STATE_FIELDS`, so clearing the park is always allowed —
  **the guard can never deadlock the lane it guards.** A durable-layer node
  whose *only* divergence is state still resolves autonomously; only a substance
  divergence routes to a human.
- The only side effect preceding a refusal is `git checkout origin/main --
  intentions/$NODE_ID.md`, a local refresh **to** `origin/main`'s own content.
  That is not a graph write; "Nothing was written." binds on `origin/main`, which
  is where it matters.

**3d. New doctrine ratchet**
`.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-substance-gate-ratchet.sh`.

Place it in that directory on purpose: `run-unit-tests.sh:186-192` globs
`test-*.sh` **only** under `.claude/skills/dispatch-propagate/scripts`,
`.github/scripts`, `.claude/skills/rsi-audit/scripts` and
`.claude/skills/file-issue/scripts`, so a test placed there is auto-discovered.
A test placed under `packages/intentionsutil/scripts/` would need its own
explicit `unit-tests.yml` line or it is dead code.

Copy the structure of the sibling
`.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`
(a prose/fenced-block guard over another skill's `SKILL.md`, not a functional
harness): `source "$FIXTURE_DIR/dispatch-test-fixture.sh"`, the `awk`
section-extractor keyed on the `## Lane 2` heading to the next `## `, a second
extractor for the **fenced content only** of that section (prose mentions of a
command are not invocations), `TOTAL`/`FAIL` counters and `report_results`. Carry
over its closing warning verbatim in spirit: *if an expectation legitimately
changes, update the assertion and confirm the property still holds another way —
never delete a row to make the suite green* (`.claude/rules/test-integrity.md`).

Assertions:

1. Lane 2's fenced content invokes `check-substance-write.ts` **at all**.
2. The `check-substance-write.ts` invocation appears **before** the `jq '<.field1`
   filter line in the Lane 2 fenced content (byte/line order — the whole point is
   refuse-*before*-mutation).
3. The `check-substance-write.ts` invocation passes `--dir`.
4. Lane 2's prose names exit `3` and the `substance-refused` token.
5. Lane 2's prose routes the refusal to the `ambiguous` path and states that no
   marker is written.
6. The ratified doctrine blockquote at `:576-583` still contains the literal
   `statement`, `rationale` and `clarification text` — the quoted doctrine is
   still present, i.e. the mechanical gate **added** enforcement rather than
   deleting the documentation.
7. Lane 2's prose still requires the subagent's `resolved` reply to carry a
   fenced JSON object of field names.
8. **Negative-form ratchet**: Lane 2's text does not name `strategyFingerprint`
   or any six-field positive allowlist as the gate's basis. Write this as a
   positive assertion over extracted text with an explicit non-empty-haystack
   precondition — a bare negated `grep` over a possibly-empty extraction is a
   vacuous pass.

**3e. CI wiring.** Add one `run:` step to `.github/workflows/unit-tests.yml`'s
hook-tests job, immediately after the existing
`- name: Run dispatch-conflict Lane 3 cwd doctrine ratchet` /
`run: .claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`
pair (currently around `:306`), following that block's naming convention. The
glob already picks the file up via `run-unit-tests.sh`; the explicit line matches
what every existing ratchet in that directory carries and keeps the failure
attributable to a named step.

**Out of scope**

- Lane 1 and Lane 3 in their entirety.
- Lane 2's "Why no `--base`" decision (`:648-674`) — the reconciliation write
  deliberately lands bare so `graph-commit`'s layers 1-3 take a concurrent-write
  race. **Do not add `--base` to the `graph-commit` call**; the `--base` model
  this node borrows from `park-node` is a *shape* (refuse before mutation, own
  exit code), applied to the new field gate, not a CAS pin added to Lane 2's
  land.
- Any `office_hours` write on the refusal path.

### Dependencies

Units 1 and 2.

### Recommended model

`opus` — doctrine-bearing skill-body text, an ordering property a ratchet must
express, and several adjacent structures (Lane 3, the ratified blockquote, the
no-`--base` rationale) that must be left untouched.

## Reuse

- `packages/intentionsutil/scripts/check-node-selection.ts:1-40` (header
  contract), `:214` (`evaluateSelection`, the exported pure core returning
  `{exitCode, stdout, stderr}`), `:438-442` (thin `main`) — the exact
  pure-core-plus-thin-main shape Unit 2 copies so the logic is vitest-testable
  without spawning a process.
- `packages/intentionsutil/scripts/park-node:75-83` (contract prose),
  `:105-113` (exit-code table, `3 = stale-diagnosis`), `:202-238` (pin resolved
  before any network call so a malformed value is a cheap usage error),
  `:197-200` (node-id regex guard), `:355-362` (the refusal itself: both values
  named, `Nothing was written.`, `exit 3`, checked "before ANY mutation") — the
  four-part refuse-before-mutation shape Unit 2 models on.
  `packages/intentionsutil/scripts/clear-park` carries the same block verbatim
  and `release-wait` a third copy, confirming it is the family convention and
  that no shared bash lib factors it out. **Do not model on `graph-commit`'s
  `--base`**: its `check_base_freshness()` auto-merges ("Attempt a structural
  three-way merge instead of refusing") and its `emit_verdict_and_exit()` parks
  with `exit 1`, never 3.
- `packages/intentionsutil/src/schema.ts:220-251` (`IntentionNode`, the field
  list `STATE_FIELDS`'s complement is computed from), `:259-282`
  (`IntentionNodeInput` mirror), `:240-241` (the "Graph-native dispatch state"
  comment — **location** for the new exports, **not** their membership),
  `:1041-1044` (`kindIsNotGoalLayer` — the shape a future
  `kindIsDurableLayer` copies, and the helper that must **not** be reused as-is
  here because `strategy` is both goal-layer and durable-layer).
- `packages/intentionsutil/src/coverage.ts:32-38, :182` — the existing
  `DURABLE_KINDS` whose membership is byte-identical to the new canonical set;
  Unit 1 replaces it with an import.
- `packages/intentionsutil/src/grounding.ts:26-35` — a deliberately different
  durable set (no `tradition`); cross-reference only, do not merge or rename.
- `packages/intentionsutil/src/node-merge.ts:35-41` (`LIST_FIELDS`, exported),
  `:50-64` (`SCALAR_FIELDS`, not exported) — the in-repo convention for a named
  field-subset const with a doc comment naming the rule it governs. Reuse the
  convention; their membership answers a different question.
- `packages/intentionsutil/src/router.ts:103-118` (`strategyFingerprint`),
  `:132-139` (`tacticScopeFingerprint`) — the two narrower freeze readings that
  stay unchanged, and the positive form Unit 1 must not rebuild.
- `packages/intentionsutil/src/store.js` `readNode` / `packages/intentionsutil/src/errors.js`
  `IntentionSchemaError` — the node read and the one existing custom error class
  in this package.
- `packages/intentionsutil/src/index.ts:1` — the existing `schema.js` re-export
  line the two new symbols join.
- `packages/intentionsutil/test/check-node-selection.test.ts`,
  `packages/intentionsutil/test/schema.test.ts`,
  `packages/intentionsutil/test/strategy-fingerprint.test.ts` — sibling test
  files whose fixture style Unit 1 and Unit 2's tests follow.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`
  (whole file) and `dispatch-test-fixture.sh` — the SKILL.md prose-ratchet
  harness Unit 3d copies, including its `awk` section/fence extractors and
  `report_results`.
- `.claude/skills/dispatch-propagate/scripts/assert-node-selection:118-134` — the
  canonical "bash wrapper shells out to `npx tsx <pure check>.ts`, captures `$?`,
  case-dispatches known codes" pattern, and the reason the block runs
  `set -uo pipefail` rather than `-e`. Unit 3b applies the same discipline inline
  in the SKILL.md fence; **no new wrapper script is needed.**
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-192` — the
  `test-*.sh` glob that makes Unit 3d's placement auto-discovered.
- `.github/workflows/unit-tests.yml` (the hook-tests block, `~:290-340`;
  Lane 3 ratchet at `~:306`, `test-park-node.sh` at `~:319`) — the explicit
  `run:` convention Unit 3e follows.

## Verification

Run every fence from the **repo/worktree root**. `run-typecheck.sh` passes
vacuously from a foreign cwd.

```verify
npx vitest run --project packages/intentionsutil --root .
```

The workspace **path** is required — `--project intentionsutil` fails with "No
projects matched the filter". `npm test --prefix packages/intentionsutil` is an
equivalent fence.

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-substance-gate-ratchet.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh
```

End-to-end behavior of the new primitive against the **real** store — the three
cases that matter, each asserting an exact exit code rather than merely
not-crashing:

```verify
rc=0
npx tsx packages/intentionsutil/scripts/check-substance-write.ts \
  --dir intentions strategy-graph-native-dispatch rationale >/dev/null 2>&1 || rc=$?
[ "$rc" = "3" ] || { echo "FAIL: substance field on a strategy expected exit 3, got $rc"; exit 1; }
echo "OK: substance field on a durable-layer node refused with exit 3"
```

```verify
rc=0
npx tsx packages/intentionsutil/scripts/check-substance-write.ts \
  --dir intentions strategy-graph-native-dispatch office_hours >/dev/null 2>&1 || rc=$?
[ "$rc" = "0" ] || { echo "FAIL: office_hours on a strategy expected exit 0, got $rc"; exit 1; }
echo "OK: the park clear stays legal on a durable-layer node"
```

```verify
rc=0
npx tsx packages/intentionsutil/scripts/check-substance-write.ts \
  --dir intentions tactic-dispatch-conflict-substance-allowlist statement rationale >/dev/null 2>&1 || rc=$?
[ "$rc" = "0" ] || { echo "FAIL: substance fields on a tactic expected exit 0, got $rc"; exit 1; }
echo "OK: tactics unrestricted"
```

The refusal message carries the two tokens the lane text and the ratchet key on:

```verify
OUT=$(npx tsx packages/intentionsutil/scripts/check-substance-write.ts \
  --dir intentions strategy-graph-native-dispatch rationale 2>&1 || true)
[ -n "$OUT" ] || { echo "FAIL: refusal produced no message"; exit 1; }
printf '%s' "$OUT" | grep -q 'substance-refused' || { echo "FAIL: missing substance-refused token"; exit 1; }
printf '%s' "$OUT" | grep -q 'Nothing was written' || { echo "FAIL: missing 'Nothing was written.'"; exit 1; }
echo "OK: refusal message contract holds"
```

The graph still validates after Unit 1's schema edits:

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

### Manual / judgment checks

- **Read the refusal as a human would.** Trigger the exit-3 message once and
  confirm it tells a person, with no other context, what was refused, on which
  node, why an autonomous lane may not make that write, and that nothing landed.
  A guard whose message does not survive being read cold has moved the failure
  rather than fixed it.
- **Walk Lane 2's rewritten text end to end as a fresh reader.** Confirm the
  gate call is unambiguously before the `jq`, that the exit-3 branch reaches the
  `ambiguous` path and writes nothing (no `jq`, no `write-node.ts`, no
  `graph-commit`, no phase-completed marker), that exit 1 and 2 fail closed
  rather than falling through, and that Lane 3 (`:736`+) is untouched.
- **Confirm the guard cannot deadlock the lane.** By inspection: a durable-layer
  node whose only divergence is a state field must still resolve autonomously,
  because `office_hours` and every other `STATE_FIELDS` member pass. If any
  reading of the new text implies a durable node can never be auto-resolved, the
  gate is over-broad.
- **Reconcile the `attributes` decision with the sibling.** Re-read
  `intentions/tactic-finding-search-all-producers.md` and confirm this node's
  recorded decision (no sub-key granularity; the three cited sites are not
  violations — two write tactics, one is attended) does not contradict it. That
  node is a draft and therefore not a `blocked_by`; agreement is the only
  requirement.
- **Provenance re-check before landing** (one second each, cheap):
  `git log --all --oneline --grep="reconcile mechanical-unresolved conflict"`
  should still return 0 commits. If it ever returns one, this node's framing
  changes from *theoretical hole* to *historical damage* and the landed commit
  must be inspected for a durable-node substance write.

## What shipped — 2026-08-29, all three units

Shipped as PR18 Unit 2 of the dispatch/RSI serialized window
(`plans/dispatch-rsi-serialized-pr-plan.md` § PR18), merged as `478cc324`
(#3134). All three units landed. Two divergences from the plan text above, both
deliberate.

**Unit 1 — landed as specified.** `packages/intentionsutil/src/schema.ts` exports
`STATE_FIELDS` (`:560`) and `DURABLE_LAYER_KINDS` (`:584`), plus
`refusedDurableFields(kind, fields)` (`:624`) and `isDurableLayerKind` /
`isDurableWriteRefused`. The check is **negative** as this node settled: durable
kind AND field outside `STATE_FIELDS` means refuse, so a field name nobody
anticipated refuses by default.

`DURABLE_LAYER_KINDS` is a **separate five-kind constant** rather than a reuse of
`grounding.ts`'s existing `DURABLE_KINDS`. That was not an oversight:
`DURABLE_KINDS` is four kinds and deliberately excludes `tradition`, because
tradition records *are* the grounding. Importing it would have put every
`tradition-*` node on the permitted side of exactly this fence. The divergence
carries a comment at the definition.

**Unit 2 — landed under a different name.** The primitive is
`packages/intentionsutil/scripts/check-durable-write-fence.ts`, not
`check-substance-write.ts` as the unit above names it. Same contract: pure read
plus exit code, no graph writes, exit 0 permit / 1 usage-or-read error / 3
refuse. Two hardenings beyond the spec, both because the writer that composed the
candidate is the party whose honesty is in question — it **diffs base against
candidate itself** rather than trusting a caller-declared field list, and it reads
`kind` from the **base**, so a candidate that rewrites `kind` cannot escape (and
`kind` is not a `STATE_FIELDS` member, so that rewrite is itself refused).

**Unit 3 — landed as specified.** `/dispatch-conflict` Lane 2 invokes the gate
between the model-composed `jq` filter and `write-node.ts`
(`.claude/skills/dispatch-conflict/SKILL.md:678` and `:806`).

Lane 2's parse gained one instruction that came out of review, worth keeping in
view because it is prose, not a mechanical guard: on a **twice-parked** node the
embedded copy of the node carries the previous park's `Diverged field` lines in
its own frontmatter, so the lane would ingest stale conflict blocks. Lane 2 is
told to cut at the embed's begin marker before parsing. There is no script to
hook this on — Lane 2's parse is a model-performed string operation — so it stays
an instruction.

### Still owed, unchanged by this closure

The two questions this node recorded as decided-but-not-implemented are exactly as
recorded, and neither is assigned in the serialized plan:

- **The greenfield form is kind data, not a code literal** — `attributes.durable_layer:
  true` on the five kind nodes read through a `kindIsDurableLayer` helper. This
  node explains why it could not take that path itself: writing that flag is an
  edit-substance on five durable-layer nodes, which is the very write this guard
  forbids an unattended session from making. The two-step attended migration path
  is in the "Greenfield note on durable-layer membership" section above.
- **The `attributes` sub-key granularity question**, recorded in its own section
  above, remains recorded and not implemented.

A third item came out of PR18's review and is new here: the argument that the
fence belongs **inside `write-node.ts`** rather than in a skill step, since
nothing forces a skill step to run. That is a fair criticism of this design and a
much larger change than this node's ruled scope. It is recorded, not acted on.
