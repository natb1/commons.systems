---
id: tactic-consolidation-operation
kind: tactic
statement: Build the sanctioned consolidation (restatement) operation —
  authority-gated node rewrites with git as deep history — and its trigger
  heuristics in the digest parsimony tables
owner: ai
status: codified
parent: null
rationale: "Delegated by the 2026-08-31 /align doctrine-alignment round under
  the ratified consolidation disposition (strategy-explicit-intent, 2026-08-31).
  Tradition references carried from the round: common-law restatements; Plato,
  Phaedrus 274-277. For an LLM-operated store node size is read cost —
  strategy-graph-native-dispatch carries 254 clarifications and
  strategy-explicit-intent 30; every consumer pays that forever until
  consolidation exists."
reading: null
serves:
  - strategy-explicit-intent
  - strategy-graph-integrity
recovers: []
clarifications:
  - question: Drift review [1] - are the rationale's read-cost figures still current
      (2026-09-01)?
    answer: (Re-measured 2026-09-01 during this node's /align-tactics finalize.) The
      rationale's read-cost figures are stale and understate the problem. `grep
      -c '^  - question:'` returns 267 clarifications on
      strategy-graph-native-dispatch (rationale cites 254) and 34 on
      strategy-explicit-intent (cites 30); `wc -c` returns 645,248 and 78,573
      bytes for the two files. The condition this operation defends —
      strategy-explicit-intent's "graph maintenance stays cheap enough that
      nodes track reality rather than decorating it" — is degrading rather than
      holding steady, which is the tactic's motivation, not a failed premise.
      Treat the rationale's numbers as a floor and re-measure at implementation
      time rather than quoting them.
  - question: Drift review [2] - is legacy-null content inside the AI-invoked
      consolidation path (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node finalize; derived from
      recorded doctrine, not a new author disposition.) Legacy-null content is
      out of the AI-invoked consolidation path. Measured the same day:
      strategy-graph-native-dispatch carries 267 clarifications against 4 inline
      `decision:` stamps, strategy-explicit-intent 34 against 10 — so the corpus
      this operation must consolidate is overwhelmingly stamp-absent. The
      2026-08-30 migration clarification puts pre-model, stamp-absent author
      dispositions on virtue/strategy/kind nodes in state NULL: not doctrine,
      subject to review, becoming doctrine only via an /exetasis sitting or
      /align adjacency. The 2026-08-31 overrule algebra grants AI overrule over
      delegated and deferred dispositions alone and does not enumerate null;
      read as exhaustive, that gates this operation conservatively. The plan
      therefore ships two entry points rather than one autonomous rewriter: an
      interview-invocable restatement surface (/align, /exetasis) covering
      ratified and legacy-null content — where the /align adjacency duty already
      requires every touched legacy-null disposition to be dispositioned in that
      round — and an autonomous fold covering delegated/deferred blocks plus the
      operational-layer records. An author ruling widening the AI path to
      null-state content would enlarge this scope, not invalidate it."
  - question: Drift review [3] - does the operational store the evidence fold reads
      exist yet, and what does the plan target meanwhile (2026-09-01)?
    answer: "(Measured 2026-09-01 during this node's /align-tactics finalize.) `ls
      packages/intentionsutil/src` shows no operational-records.ts and no
      operational-store.ts — the append-only operational store the
      evidence-folding half of this node's scope reads
      (tactic-intent-orchestration-layer-schema Unit 6, phase implement,
      unlanded) is not yet built. Plan against that exact interface (evidence.v1
      / claim.v1, one file per record under intentions/operational/,
      create-only, no update and no delete primitive — that unit explicitly
      hands folding to this node), carry the dependency as a blocked_by edge,
      and if the store is still absent at claim time use the fallback contract
      already recorded on tactic-migration-frontier-projection Unit 2: the same
      create-only one-file-per-record layout plus a TODO naming the swap. Do not
      invent a shared mutable ledger file and do not rebuild the store here.
      intentions/operational/**/*.json stays invisible to listNodes'
      top-level-*.md scan (packages/intentionsutil/src/store.ts:187-232), so the
      layout cannot be mistaken for graph nodes."
  - question: Drift review [4] - how does the restatement writer coexist with
      writeNode's body-loss guard (2026-09-01)?
    answer: "(Measured 2026-09-01 during this node's /align-tactics finalize.) The
      body-rewrite constraint the plan must take an explicit position on:
      `writeNode` (packages/intentionsutil/src/store.ts:52) accepts frontmatter
      only and re-reads the existing body from disk via `readExistingBody`
      (:128), with `assertNoBodyLoss` (:104) throwing if a regenerated
      placeholder would clobber an authored body — so the dump-node/write-node
      round trip can never change a node body, only its frontmatter. A
      restatement that rewrites body prose must either mirror merge-node.ts's
      explicit-body serialization
      (packages/intentionsutil/scripts/merge-node.ts:119, which already
      reproduces writeNode's validate-then-fence contract) or add an opt-in
      body-override parameter to writeNode. The plan states which and why;
      silently reproducing a bypass is how a second, unguarded node-writer path
      gets born. The choice is Claude's under the delegated tooling scope of the
      2026-08-31 consolidation disposition."
  - question: Drift review [5] - what sibling-carried scope and coordination
      constraints bind this node (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node finalize.) Scope carried
      in from siblings, which the node body did not yet state.
      tactic-bootstrap-operation's P1 sequencing assigns this node \"folding in
      the deferred-queue deriver and one-ruling-one-stamp normalization\", and
      tactic-migration-frontier-projection hands off the deferred-decision queue
      deriver — interim surface `grep -rln 'decision: deferred' intentions/`,
      measured 16 files on 2026-09-01, not the 15 that node cites — along with
      evidence folding and unmatched-evidence detection. The gap-note store's
      `disposed_by` field has no claimed writer in either sibling plan; this
      plan records it as a deliberately unclaimed open seam (Unit 6) — the
      frontier plan documents the note store as data the deriver reads, never a
      hand-edited gating surface, so a fold marking disposal needs the frontier
      owner's agreement to that contract change, not a unilateral claim here.
      Two coordination constraints hold: the digest parsimony trigger tables are
      extended in place (packages/intentionsutil/src/digest.ts `renderTables`,
      following tableStoredDefaults' LIMIT-constant and overflow-line shape),
      never forked, since the digest's charter home is tactic-rsi-graph-review;
      and decision stamps are parsed through tactic-node-review-skill's
      `parseDispositions` rather than a second stamp parser, so this operation's
      whole-block rewrites and rsi-graph-review's per-disposition append-only
      overrules do not become two incompatible stamp-mutation paths."
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the sanctioned consolidation (restatement) operation — authority-gated node rewrites with git as deep history — and its trigger heuristics in the digest parsimony tables

## Retained interview context (2026-08-31 /align doctrine-alignment round)

Carried forward verbatim in substance; this plan implements it, does not
redefine it.

- **Authority gating per the overrule algebra**: ratified content consolidates
  only in interview; delegated/deferred content consolidates by AI, with the
  consolidation itself a deferred disposition entering the author queue.
  Source: `intentions/strategy-explicit-intent.md`, the overrule-algebra
  clarification (2026-08-31, `tactic-rsi-graph-review` finalize interview) and
  the CONSOLIDATION clarification of the same round. Do not re-derive the
  algebra from memory — cite it.
- **The append rule as restated**: appends are the cheap default edit mode
  *between* consolidations; rewrites happen only through this operation;
  disposition stamps still append in-file; git carries the permanent deep
  history.
- **Trigger heuristics live in the digest's parsimony tables** (node size /
  clarification count / read-cost signals). The digest tool's charter home is
  `tactic-rsi-graph-review` — **extend its tables in place, never fork the
  tool**.
- Tradition references from the round: common-law restatements (an
  authoritative consolidation of accreted precedent that cites what it
  consolidates); Plato, *Phaedrus* 274–277 (the record stays alive through
  re-derivation, not accretion).

## Amendment (2026-09-01 ladder-reconciliation round)

Scope extends to the operational layer: **evidence-log folding** (journal to
ledger, the double-entry bookkeeping tradition) — fold to per-criterion current
state at a target-size threshold (trigger family shared with
materialized-context compaction); git history is the archive. The clarifications
consolidation and evidence folding are **one operation family with two
carriers**.

## Surface ownership (2026-09-01, finding-6 fix)

Under the strategy-scoped reconciliation architecture
(`strategy-graph-native-dispatch`, 2026-09-01, carrier exception), this node
owns **evidence folding** and **unmatched-evidence detection**.
`tactic-ladder-reconciliation-observe` integrates this surface via a
`blocked_by` edge and does not rebuild it. The reciprocal statement is recorded
on `intentions/tactic-migration-frontier-projection.md:201-206`.

## Folded scope (2026-09-01 adversarial-review rulings 1 and 4)

Two further surfaces were assigned to this node at finalization, quoted from
`intentions/strategy-graph-native-dispatch.md` (the "interim mechanics and
initiation protocol" clarification, ~:7163-7186):

- Ruling (4): *"CONSOLIDATION SCOPE FOLDS, to be added to
  tactic-consolidation-operation at finalization: one-ruling-one-stamp
  normalization of multi-ruling clarifications (the folding pass), and the
  deferred-queue deriver from (1)."*
- Ruling (1): *"DEFERRED-QUEUE SHIM … the deferred-disposition review queue's
  target mechanism is a stamp-derived queue; no deriver exists yet; the interim
  surface is mechanical — `grep -rn "decision: deferred" intentions/` — the
  documented office-hours practice until the deriver lands; liquidation
  condition: deriver live, with deriver ownership assigned to
  tactic-consolidation-operation at its finalization."*

So this plan owns, in addition to the two folding carriers: **(a) the
deferred-disposition queue deriver**, whose landing liquidates shim (1), and
**(b) the one-ruling-one-stamp folding pass** for multi-ruling clarifications.

## Context

**The problem.** For an LLM-operated store, node size *is* read cost. Every
consumer — every dispatch session, every audit, every plan-authoring run — pays
the accreted size of a node forever, because the graph's only sanctioned edit
mode today is *append*. There is no sanctioned rewrite path, so nothing ever
shrinks. The 2026-08-31 doctrine-alignment round ratified that a consolidation
(restatement) operation exists; nothing builds it. This node is that build.

**Measured 2026-09-01 on `origin/main` at `72cc7c0a`** (these figures supersede
the stale ones in this node's `rationale` frontmatter field, which says "254
clarifications" and "30" — both were already wrong when written and are further
out of date now; never cite the rationale's figures as current):

```
$ grep -c '^  - question:' intentions/strategy-explicit-intent.md intentions/strategy-graph-native-dispatch.md
intentions/strategy-explicit-intent.md:34
intentions/strategy-graph-native-dispatch.md:267

$ ls -S intentions/*.md | head -4 | xargs -I{} sh -c 'printf "%8d  %s\n" $(wc -c < {}) {}'
  645248  intentions/strategy-graph-native-dispatch.md
  182431  intentions/strategy-recursive-self-improvement.md
  117583  intentions/strategy-token-economy.md
   78573  intentions/strategy-explicit-intent.md

$ du -sh intentions/ ; ls intentions/*.md | wc -l
13M     intentions/
795
```

A single node is **645 KB**. Reading it whole is roughly 160k tokens — larger
than most session budgets. That is the cost this operation exists to bound.

**Disposition-stamp population, measured the same day** (the input to the
deferred-queue deriver and the one-ruling-one-stamp pass):

```
$ grep -rho "(decision:" intentions/*.md | wc -l          # 87 stamps total
$ grep -rho "decision: deferred" intentions/*.md | wc -l  # 25 deferred stamps
$ grep -rl 'decision: deferred' intentions/ | wc -l       # 16 files
```

Treat 16/25 as a **moving population**, never a fixed list — the frontier
sibling's plan recorded 15 files a day earlier. Over the same tree there are
**1021 clarifications**; only **4** carry two or more `(decision:` stamps, while
**130** carry two or more distinct ALL-CAPS ruling labels under **at most one**
stamp (measured by the heuristic in Unit 5). That asymmetry is the whole
one-ruling-one-stamp defect: the graph does not lack stamps *per clarification*,
it lacks stamps *per ruling*, so a single stamp silently claims authority over
rulings it was never issued for.

**Intended outcome.** One operation family, two carriers, one authority gate:

1. an intent-carrier fold (a node's clarifications and body restated), and
2. an operational-carrier fold (the append-only evidence log folded to
   per-criterion current state),

both gated by the same disposition-authority rule, both leaving git as the
archive, and both surfaced by the same trigger heuristic rendered into the
digest's parsimony tables.

## Design

### Greenfield design

The consolidation operation is a **restatement**: a read of an append-accreted
journal, and a write of a ledger holding its current state, with a citation of
what was consolidated and a stamp recording who had the authority to do it. The
same shape applies to both carriers — that is what "one operation family with
two carriers" means in code, not just in prose.

```
                 ┌──────────────────────────────────────────┐
   JOURNAL       │  authority gate (overrule algebra)        │      LEDGER
   (append-only) │  ratified → refuse; deferred → inherit    │  (restated)
                 │  deferred; delegated → become deferred    │
 clarifications ─┤                                          ├─→ restated node
 evidence log   ─┤  fold planner → RestatementPlan          ├─→ folded ledger
                 └──────────────────────────────────────────┘
                        git history = deep archive
```

Four properties are load-bearing and each has a mechanical home in this plan:

- **The authority gate is one function, consulted by both carriers.** Not two
  parallel implementations that can drift (Unit 1).
- **The write is a replace, never a merge.** Consolidation is the one operation
  whose whole purpose is that content *disappears*, and the graph's layer-2
  three-way merge is measured to **drop a field removal** and to **duplicate an
  element rewrite** (`packages/intentionsutil/src/node-merge.ts`,
  `packages/intentionsutil/scripts/merge-node.ts`). A consolidation landed
  through that merge silently resurrects the folded content. The design position
  is therefore explicit: **every consolidation lands with
  `graph-commit --base <id>=<blobsha>`**, whose compare-and-swap *refuses before
  any local commit is made* when the blob has moved
  (`packages/intentionsutil/scripts/graph-commit:49-52`). A concurrent divergence
  must park, not merge. This is stated as a hard rule in Unit 4 and is the single
  most important design decision in this plan.
- **The write path cannot be `writeNode`.** `writeNode`
  (`packages/intentionsutil/src/store.ts:52`) takes no body parameter: it
  unconditionally re-reads the existing file's body from disk
  (`readExistingBody`, `:128`) and `assertNoBodyLoss` (`:104`) *throws* if the
  write would replace an authored body. That guard is correct and stays — it is
  what makes every ordinary write body-safe. Consolidation is the one sanctioned
  exception, so it gets its own narrow writer that mirrors `writeNode`'s exact
  serialization rather than weakening `writeNode` with an opt-out flag any caller
  could reach for (Unit 3).
- **Nothing is deleted without a citation.** A restatement records what it
  consolidated (source stamp keys, source byte counts, the fold's own stamp).
  Git is the deep history; the citation is the pointer into it. This is the
  common-law-restatement tradition applied literally.

### Why not the alternatives

- **Not `superseded_by` / `status: superseded`**
  (`packages/intentionsutil/src/schema.ts:286,299`, validateGraph rules 24–25).
  That trio is the right mechanism for *node-level* supersession — one whole node
  retired in favour of another of the same kind — and this plan does **not**
  reimplement it. But consolidation as ratified is *intra-node*: the same node id
  survives with a shorter, restated body. There is no second node id to point at.
  Where a future consolidation genuinely folds two node ids into one, it must use
  `superseded_by` on the loser plus `graph-commit --prune <loser-id>`
  (`packages/intentionsutil/scripts/graph-commit:45-47,443-445,1328`) — that path
  already exists and is **out of scope here**, recorded so a later claim does not
  rebuild it.
- **Not a new `attributes.*` key for "consolidated_into".** Nothing would read
  it, and `strategy-graph-self-description`'s stored-defaults signal already
  penalises fields nothing consumes.
- **Not a mutable ledger file for the folded evidence.** The ratified layout is
  create-only, one file per record, precisely so concurrent appends are
  commutative. The fold writes a *new* record and leaves the folded ones in git;
  it never edits in place (Unit 6).

### Brownfield migration path

Three of this plan's dependencies are **planned but unbuilt** — confirmed by
direct file check on 2026-09-01:

```
$ ls packages/intentionsutil/src/review.ts packages/intentionsutil/src/checks.ts \
     packages/intentionsutil/src/high-water.ts packages/intentionsutil/src/operational-store.ts
ls: cannot access ...: No such file or directory   (all four)
$ ls intentions/operational
ls: cannot access 'intentions/operational': No such file or directory
```

So this plan is written to **build against the interfaces those plans state,
behind seams**, and never to block on them:

- `parseDispositions` is specified by `tactic-node-review-skill` (its Unit 2,
  `packages/intentionsutil/src/review.ts`). Unit 1 defines a
  `DispositionSource` seam and ships a conforming implementation; if
  `review.ts` has landed by claim time, the seam is satisfied by importing it
  and no second parser is written.
- `appendEvidence` / the evidence record layout are specified by
  `tactic-intent-orchestration-layer-schema` (its Unit 6,
  `packages/intentionsutil/src/operational-store.ts` /
  `operational-records.ts`). Unit 6 here follows the frontier sibling's stated
  fallback contract verbatim: build against the same create-only,
  one-file-per-record convention directly, leave a
  `TODO(tactic-intent-orchestration-layer-schema)` naming the swap, and **never**
  invent a shared mutable ledger file.

Migration sequencing of the corpus itself (which node gets consolidated first) is
deliberately **not** in this plan. This plan builds the operation; applying it is
a later claim driven by the trigger table Unit 7 renders. The one exception is
the `.claude/rules/` source-side diet, addressed in Unit 7's scope note.

### No data-viz unit

Every surface this plan ships renders as deterministic monospace text (digest
check tables, a queue report, JSON for tooling). Nothing here is a chart, plot,
dashboard, or other data-viz surface, so `/dataviz` does not apply and no unit
carries a data-viz guidance field.

## Unit 1 — The authority gate and the disposition-source seam

**Scope.** New pure module `packages/intentionsutil/src/consolidation.ts`, tests
in `packages/intentionsutil/test/consolidation.test.ts`. Pure and fs-free, like
`node-merge.ts` and `digest.ts`; the fs/argv lives in the CLIs of Units 2 and 4.

Export:

- `type DispositionState = "ratified" | "deferred" | "delegated"`.
- `interface DispositionRecord { nodeId: string; state: DispositionState;
  delegatee: string | null; date: string; key: string; excerpt: string }` —
  field-for-field the shape `tactic-node-review-skill`'s Unit 2 specifies
  (`intentions/tactic-node-review-skill.md:448-470`), so the two are one type
  when `review.ts` lands. `key` is `<nodeId>#<ordinal>` over stamps in document
  order.
- `interface DispositionSource { dispositions(nodeId: string, kind: string,
  text: string): DispositionRecord[] }` — the seam. Every consumer in this plan
  takes the interface, never a concrete parser.
- `parseStampGrammar(nodeId, kind, text): DispositionRecord[]` — the conforming
  implementation of the interim tag grammar recorded on
  `strategy-explicit-intent` (the three-state clarification): `(decision:
  <state>, <delegatee-mount-id>, YYYY-MM-DD)`. State normalization is **tolerant
  by design and must match `review.ts`'s stated table exactly**:
  `author-ratified` and `ratified` → `ratified`; `delegated-pending-review` →
  `deferred`; `delegated-review-declined` → `delegated`; bare `deferred` →
  `deferred`; bare `delegated` → `delegated`. This mirrors `isFingerprintStale`'s
  three-shape tolerance (`packages/intentionsutil/src/transitions.ts:508-534`).
  An unrecognized state token throws `IntentionSchemaError`
  (`packages/intentionsutil/src/errors.ts`) naming the node and the excerpt —
  never silently skipped (`.claude/rules/code-style.md`).
  **Guard:** if `packages/intentionsutil/src/review.ts` exists at claim time and
  exports `parseDispositions`, do NOT write `parseStampGrammar` — export a thin
  adapter satisfying `DispositionSource` over it and say so in the module header.
- `MOUNT_KINDS = ["tradition", "delegation"]`. Dispositions found on a mount
  record are a defect, not queue members (mount points are never doctrine).
- **The gate itself**, the one function both carriers consult:

  `consolidationVerdict(states: readonly DispositionState[]):
  { permitted: boolean; resultState: DispositionState | null; reason: string }`

  implementing the ratified overrule algebra
  (`intentions/strategy-explicit-intent.md`, overrule-algebra clarification,
  2026-08-31) with no re-derivation:
  - any `ratified` among the folded states → `permitted: false`, reason naming
    rule (1): a ratified disposition is overruled only in interview. AI
    consolidation stops here and routes to the author queue.
  - all folded states `deferred` → `permitted: true`, `resultState: "deferred"`
    (rule 3: a disposition overruling a deferred one *inherits* the deferred
    stamp).
  - any `delegated` present, none `ratified` → `permitted: true`,
    `resultState: "deferred"` (rule 4: an AI disposition overruling a delegated
    one *becomes* deferred and enters the author review queue).
  - empty input → `permitted: false`, reason `"no disposition stamps found —
    authority is unknown, treat as binding"` (`.claude/rules/measurement-and-provenance.md`:
    unrecoverable provenance is treated as binding, never dropped).
- `renderStamp(state, delegatee, date): string` — emits the canonical interim
  tag grammar so no call site hand-formats a stamp.

**Tests.** The verdict matrix exhaustively, each row asserted individually (the
three non-`ratified` rows are the sanction gate and must not be grouped):
ratified-only, ratified+deferred, ratified+delegated, deferred-only,
delegated-only, deferred+delegated, empty. Plus grammar parsing: each accepted
spelling, a mount-kind defect, an unrecognized token throwing with the node id in
the message, and `key` ordinal stability across two parses of the same text.

**Out of scope.** Any write. Any fs. The queue derivation (Unit 2). Any change to
how `/align` writes stamps.

**Recommended model:** opus.

## Unit 2 — The deferred-disposition queue deriver (liquidates shim 1)

**Scope.** Add `deferredQueue(nodes, bodyById, source): DeferredQueue` to
`packages/intentionsutil/src/consolidation.ts`, and a new CLI
`packages/intentionsutil/scripts/deferred-queue.ts`. Tests extend
`packages/intentionsutil/test/consolidation.test.ts`; a CLI test goes in
`packages/intentionsutil/test/deferred-queue-cli.test.ts`, following
`packages/intentionsutil/test/merge-node-cli.test.ts`'s shape.

- `DeferredQueue = { items: DispositionRecord[]; defects: string[] }`. Items are
  every disposition whose normalized state is `deferred`, from **both**
  `node.clarifications[].answer` and the node body — the parser needs bodies, not
  just frontmatter, because deferred clauses live in both (this node's own
  Retained-interview-context section is a body example;
  `strategy-explicit-intent`'s live in clarification answers). Dispositions found
  on `MOUNT_KINDS` nodes go to `defects`, never to `items`.
- Ordering is deterministic: by node id, then by stamp ordinal. No wall-clock, no
  environment data, so two runs on the same store emit byte-identical output —
  the same determinism contract `digest.ts:13-15` states.
- The CLI reads the store with `listNodes`
  (`packages/intentionsutil/src/store.ts:232`) and bodies with `readNodeBody`
  (`:166`), takes `--dir <abs intentions path>` as a **required** argument (never
  inferred from the script's own location — see
  `.claude/rules/sandbox.md`, "git -C is auto-approved for worktrees"), supports
  `--json`, and adopts merge-node.ts's **three-way exit-code contract verbatim**
  (`packages/intentionsutil/scripts/merge-node.ts:12-33`): exit 0 = ran and
  reached a verdict; exit 3 = ran and failed on its inputs; anything else = never
  ran. Use `process.exitCode`, never `process.exit()`, for the reason recorded at
  `merge-node.ts:151-163` (a large payload on a pipe is truncated by `exit()`).
- A zero-item run prints an explicit `0 deferred dispositions across N nodes`
  line and exits 0 — never a silent vacuous pass, per the `CHECKED == 0`
  discipline at
  `.claude/skills/dispatch-propagate/scripts/run-typecheck.sh:287-293`.
- The module header must state, in one paragraph, that this deriver is the
  liquidation of the 2026-09-01 deferred-queue shim recorded on
  `strategy-graph-native-dispatch`, and that the interim
  `grep -rn "decision: deferred" intentions/` practice is retired by its landing.

**Shim-parity check (a test, not a hope).** A test asserts that on the live
`intentions/` store the deriver's item count is **≥** the raw grep's match count
for `decision: deferred`, and reports the delta. `≥` and not `==` on purpose: the
grep counts raw text occurrences and cannot normalize
`delegated-pending-review` into `deferred`, so the deriver legitimately finds
more. A deriver finding *fewer* is a parser bug and fails the test.

**Out of scope.** Any office-hours skill wiring, any node write, any change to the
review-queue priority function (that is `tactic-node-review-skill`'s virtual
review node).

**Dependencies.** Unit 1.

**Recommended model:** sonnet.

## Unit 3 — The restatement writer

**Scope.** New `packages/intentionsutil/src/restate.ts` (pure planning) plus the
one narrow fs writer, tests in
`packages/intentionsutil/test/restate.test.ts`.

The problem this unit exists to solve, stated so a clean session does not
rediscover it: **`writeNode` cannot change a body.** `writeNode`
(`packages/intentionsutil/src/store.ts:52-62`) accepts only frontmatter, re-reads
the existing body via `readExistingBody` (`:128-141`), and `assertNoBodyLoss`
(`:104-127`) throws if a rewrite would replace an authored body. The
dump-node → edit-JSON → write-node round trip therefore can never restate a body.

- `planRestatement(input): RestatementPlan` — pure. Input carries the node, its
  body, the disposition records covering the content being folded, and the
  restated text. Output carries `{ permitted, resultState, restatedBody,
  restatedClarifications, citation, refusal }`. It calls
  `consolidationVerdict` (Unit 1) and **refuses** rather than producing a plan
  whenever the verdict does. A refusal is a first-class result, not a throw —
  the CLI renders it and exits 0 with a verdict, matching merge-node.ts's
  "resolved: false" precedent.
- `citation` is the common-law-restatement half: a deterministic block naming
  every consolidated source (stamp `key`s, the source clarification indices, the
  pre-fold byte count, the post-fold byte count, and the fold's own stamp from
  `renderStamp`). It is appended to the restated body under a fixed
  `## Consolidation record` heading so a reader can always find what was folded
  and reach it in git.
- `writeRestatedNode(dir, node, body): void` — the **only** sanctioned
  body-rewriting writer. It mirrors `writeNode`'s serialization exactly, copying
  the established precedent at
  `packages/intentionsutil/scripts/merge-node.ts:114-120`: validate first, then
  `` `---\n${stringify(validateNode(node))}---\n${body}` ``, and publish through
  the same atomic temp-file-then-rename discipline `writeFileAtomic`
  (`store.ts:74-92`) uses. Do **not** reinvent the fence format and do **not**
  add a body-override parameter to `writeNode` — the guard there protects ~21
  call sites and must stay unconditional.
- Two guards on the writer, both throwing `IntentionSchemaError`:
  1. the restated body must be non-empty and must contain the
     `## Consolidation record` citation block (a fold with no citation is not a
     restatement);
  2. the restated body must be **strictly smaller** than the body it replaces, or
     the caller must pass an explicit `allowGrowth` reason string recorded in the
     citation. A "consolidation" that grows the node is either a mistake or a
     deliberate restructure that owes an explanation.

**Tests.** A refusal path per verdict row; the citation block's determinism
(two identical inputs → byte-identical output); the serialization matching
`writeNode`'s for an unchanged body (round-trip through `readNode`); both
guards firing; and an assertion that `writeRestatedNode` is *not* exported from
`packages/intentionsutil/src/index.ts` (this is a deliberate, narrow tool — keep
it off the public barrel so it is not reached for casually).

**Out of scope.** The CLI (Unit 4). Landing (Unit 4). Multi-node folds via
`superseded_by`/`--prune` (recorded above as out of scope for this plan
entirely).

**Dependencies.** Unit 1.

**Recommended model:** opus.

## Unit 4 — The `consolidate-node` CLI and the landing discipline

**Scope.** New `packages/intentionsutil/scripts/consolidate-node.ts`; test in
`packages/intentionsutil/test/consolidate-node-cli.test.ts`.

- Arguments: `--dir <abs intentions path>` (required, never inferred),
  `--id <node-id>`, `--file <restatement JSON>` (the restated clarifications and
  body), `--dry-run`. Same three-way exit-code contract and `process.exitCode`
  discipline as Unit 2.
- `--dry-run` prints the plan and the citation and writes nothing. This is the
  default posture for a reviewer.
- On a permitted plan it writes via `writeRestatedNode` and prints the blob sha
  of the **pre-edit** file (`git hash-object` semantics) so the caller can pass
  it straight to `graph-commit --base`.
- **The landing rule, stated in the CLI's own header and enforced by the exit
  contract**: a consolidation is landed with

  ```
  packages/intentionsutil/scripts/graph-commit -C <abs repo root> \
    -m 'graph: consolidate <id>' --base <id>=<pre-edit-blobsha> <id>
  ```

  `--base` is **mandatory** for a consolidation, not optional. Rationale, in the
  header: the layer-2 three-way merge is measured to drop a field removal and to
  duplicate an element rewrite, and a consolidation is by construction a removal
  plus an element rewrite — so a merge would silently resurrect the folded
  content. `--base` refuses before any local commit is made when the blob has
  moved (`packages/intentionsutil/scripts/graph-commit:49-52`), which is the
  behaviour this operation needs: **park, never merge.**
  The header must also carry the two sandbox facts a clean session needs:
  `graph-commit` requires an explicit `-C <abs repo root>` (it resolves the repo
  root from `-C`/`--repo`, else **cwd**, never from its own location —
  `.claude/rules/sandbox.md`), and it must be run with
  `dangerouslyDisableSandbox: true` on the **first** attempt, because its internal
  rebase reverts the uncommitted node edit on a sandboxed failure and there is
  nothing left to retry on.
- The CLI never invokes `graph-commit` itself. It prepares the edit and prints
  the exact command. A tool that both rewrites and lands in one step removes the
  reviewer's stopping point, and the whole operation is authority-gated.

**Out of scope.** Any automatic landing. Any batch mode over multiple nodes.

**Dependencies.** Unit 3.

**Recommended model:** sonnet.

## Unit 5 — One-ruling-one-stamp normalization

**Scope.** Add `splitMultiRuling(clarification): RulingSplit[]` and
`multiRulingCandidates(nodes): Candidate[]` to
`packages/intentionsutil/src/consolidation.ts`; tests extend
`packages/intentionsutil/test/consolidation.test.ts`. This is ruling (4)'s
"folding pass" half.

The defect, measured 2026-09-01 over 1021 clarifications: 4 clarifications carry
≥2 `(decision:` stamps, but **130** carry ≥2 distinct ALL-CAPS ruling labels
under at most one stamp. A single stamp is silently claiming authority over
rulings it was never issued for — and under the overrule algebra that
mis-attribution is load-bearing, because it decides whether AI may revise the
text at all.

- `multiRulingCandidates` is the **detector**, and it is deliberately a
  shortlist, not a disposition — exactly the posture `tableNearDup` documents for
  itself (`packages/intentionsutil/src/digest.ts:239-251`). Heuristic, stated
  explicitly so it can be argued with: a clarification answer is a candidate when
  it contains ≥2 *distinct* ALL-CAPS labels of the form
  `/\b[A-Z][A-Z-]{3,}(?:[ ][A-Z][A-Z-]{2,}){0,5}\b(?=[,:])/g` and carries ≤1
  `(decision:` stamp. That heuristic yielded 130 candidates on the live store;
  the test asserts the count is >0 and that
  `intentions/strategy-graph-native-dispatch.md`'s "items 1-8" clarification is
  among them (it carries four numbered rulings under one delegated stamp — the
  canonical instance, and the very clarification that assigned this scope).
- `splitMultiRuling` is the **normalizer**: given one clarification, it returns
  the per-ruling segments with the label, the text span, and the stamp that
  currently covers them. It never guesses a *new* authority state — an unstamped
  segment inherits the clarification's single stamp if there is exactly one, and
  is reported as `authority: "unknown"` when there is none or more than one.
  `authority: "unknown"` is a refusal, routed to the author queue, not a default.
- The normalization **write** is a restatement, so it goes through Unit 3's
  planner and Unit 4's CLI. This unit adds no second write path.

**Out of scope.** Actually normalizing any clarification in the store — that is an
application claim driven by the trigger table, not a build. Changing how `/align`
writes new stamps.

**Dependencies.** Units 1, 3, 4.

**Recommended model:** opus.

## Unit 6 — Evidence-log folding and unmatched-evidence detection

**Scope.** New pure module `packages/intentionsutil/src/evidence-fold.ts`, tests
in `packages/intentionsutil/test/evidence-fold.test.ts`. This is the second
carrier of the one operation family, per the 2026-09-01 Amendment above.

Read the input layout from `tactic-intent-orchestration-layer-schema`'s Unit 6
(`intentions/tactic-intent-orchestration-layer-schema.md:552-621`) rather than
inventing one. `evidence.v1` entries live at
`intentions/operational/evidence/<strategy-id>/<YYYYMMDD>-<hash12>.json`, one
file per entry, create-only, with shape `{schema, strategy, criterion|gap
(exactly one non-null), finding, disposition: fixed|frontier-routed|refuted|null,
proof (at least one of sha/pr/stamp/check), recurrence_key, claim, observed_at}`.
That plan states verbatim: *"No update and no delete primitive exists. Correction
is a new entry that supersedes, never an edit. Folding is
tactic-consolidation-operation's surface and is not built here."*

**Cross-node dependency, stated so a clean session does not guess.**
`packages/intentionsutil/src/operational-store.ts` and `operational-records.ts`
**do not exist on disk** (checked 2026-09-01), and neither does
`intentions/operational/`. If they are still absent when this unit is claimed,
build the reader against the **same** create-only, one-file-per-record convention
directly and leave a `TODO(tactic-intent-orchestration-layer-schema)` naming the
swap — following the fallback contract the frontier sibling already states at
`intentions/tactic-migration-frontier-projection.md:394-420`. **Do not invent a
shared mutable ledger file**: per-record files are what make concurrent appends
commutative, and a hot file is exactly what the ratified layout forbids.

Export:

- `foldEvidence(entries, opts): { ledger: LedgerEntry[]; folded: string[];
  citation: string }` — the journal-to-ledger fold. One `LedgerEntry` per
  `(strategy, criterion|gap)` pair holding **current state**: the latest
  `disposition`, the recurrence count keyed on `recurrence_key`, the newest and
  oldest `observed_at`, and the proof references of the entries it subsumes.
  Deterministic ordering (strategy id, then criterion id, then recurrence key).
- The fold's output is written as a **new create-only record** under
  `intentions/operational/evidence-ledger/<strategy-id>/<YYYYMMDD>-<hash12>.json`
  with `schema: "evidence-ledger.v1"` and a `folds: [<entry-path>...]` citation
  array. The folded entries are **left on disk untouched** by this unit — their
  removal is a separate, later gesture whose archive is git, and separating the
  two means a fold can never lose an entry it failed to record.
- `unmatchedEvidence(entries, criteria): UnmatchedEntry[]` — the
  unmatched-evidence detector this node owns. An entry whose `criterion` names no
  criterion in the strategy's recorded set, and whose `gap` is null, is
  unmatched. This is the mechanical form of the ratified rule *"Diff satisfying
  no criterion is an unmatched-evidence digest finding"*
  (`intentions/strategy-graph-native-dispatch.md`, the evidence-log-compaction
  clarification, ~:6892-6933). It returns findings; it never edits an entry.
- `shouldFold(entries, targetBytes): boolean` — the target-size threshold. It
  takes the budget as an argument rather than hard-coding one, because the
  ratified text places this in the **same trigger family** as
  materialized-context compaction (`tactic-context-materialization`'s surface) —
  a shared threshold must be settable from one place when that lands, not
  duplicated as a literal here.
- The gap-note store's `disposed_by` field
  (`intentions/tactic-migration-frontier-projection.md:710-720`,
  `intentions/operational/gap-notes/<note-id>.json`, shape `{subject, detail,
  recorded_at, disposed_by}`) is claimed by **no** sibling plan as a writer.
  Record in this module's header that a disposed gap-note is folded by the same
  operation — but do **not** write `disposed_by` in this unit; the note store is
  documented there as "data the deriver reads, never a hand-edited gating
  surface", so changing that contract needs the frontier owner's agreement, not a
  unilateral write. Recorded here as an open seam, deliberately unclaimed.

**Landing note (must appear in the module header).** `graph-commit` stages
**exactly** `intentions/$id.md` per node id
(`packages/intentionsutil/scripts/graph-commit:1534,1549`), so nothing under
`intentions/operational/` can land through it. The landing path for operational
records is `tactic-ladder-reconciliation-observe`'s integration surface, exactly
as the schema sibling's Unit 6 already states. This unit writes records; it does
not land them.

**Tests.** The fold's determinism and idempotence (folding a ledger's own inputs
twice yields the same record path); recurrence counting across entries sharing a
`recurrence_key`; `unmatchedEvidence` finding a criterion-less entry and *not*
flagging a legitimate `gap` entry; `shouldFold` at, below, and above the
threshold; and a create-only collision test (identical content at the same path
is a no-op, differing content throws).

**Out of scope.** Writing the tick that produces evidence. Deleting folded
entries. Landing anything. Any change to `evidence.v1` itself.

**Dependencies.** Unit 1.

**Recommended model:** opus.

## Unit 7 — Trigger heuristics in the digest parsimony tables

**Scope.** One pure candidate function plus two consumers.

- Add `consolidationCandidates(records: readonly SizeRecord[], opts):
  Candidate[]` to `packages/intentionsutil/src/consolidation.ts`, over a
  deliberately generic `SizeRecord = { id: string; bytes: number; units: number;
  latestDate: string | null }`. Generic because two corpora feed it (below) and
  one implementation must serve both.
- Add **two tables** to `packages/intentionsutil/src/digest.ts`, each registered
  by appending to the fixed array `renderTables` returns
  (`packages/intentionsutil/src/digest.ts:412-425`):
  - `[CONSOLIDATION-DEBT]` — nodes ranked by read cost, fed from the per-node
    inputs the digest already gathers (`DigestInput.bodies` for bytes,
    `node.clarifications.length` for units — both already rendered on the
    per-node line at `digest.ts:93-107`). Header carries the graph-wide total
    bytes and the candidate count; rows are the top `CONSOLIDATION_DEBT_LIMIT`
    (set to 40) by bytes, with an `... and N more` overflow line.
  - `[MULTI-RULING]` — Unit 5's `multiRulingCandidates`, rows
    `<count> <renderId(id)>#<ordinal>`, capped by `MULTI_RULING_LIMIT` (set to
    40).
  Both tables **must** follow the file's existing conventions exactly: every id
  through `renderId` (`digest.ts:56-68` — the control-character escape that every
  render boundary owes, because the digest is fed to an LLM auditor and an
  unescaped id can forge table lines); count-then-id sorted; a `LIMIT` constant
  with an overflow line, as `tableStoredDefaults` does (`digest.ts:372-406`); no
  wall-clock or environment data, preserving the byte-identity contract
  (`digest.ts:13-15`).
  Both tables are **shortlists for a human/AI disposition, never dispositions** —
  state that in each table's doc comment, in the same words `tableNearDup` uses
  (`digest.ts:239-251`).
- **Charter.** The digest tooling's charter home is `tactic-rsi-graph-review`
  (its Unit 1 names `renderTables`, "7 check tables"). These two tables make it
  nine. **Extend `digest.ts` in place — do not fork a parallel table module, and
  do not create a second digest CLI.** The charter node's prose is that node's to
  update; this unit changes only code and tests.
- **`.claude/rules/` source side.** The rules corpus is operational text inside
  this node's consolidation scope on the **source** side (fold/compact the source
  records); the **projection** side — rules as mechanically materialized
  projections of graph doctrine, with pins — is `tactic-context-materialization`'s
  and must not be double-claimed here. Concretely, this unit ships a
  `--corpus rules` mode on `consolidate-node.ts` that feeds the same
  `consolidationCandidates` function with `SizeRecord`s built from
  `.claude/rules/*.md` (bytes from the file, `units` from the `^## ` heading
  count) and prints the same shortlist. Measured 2026-09-01: the corpus is
  41,754 bytes across 12 files, `sandbox.md` alone 18,682 — i.e. one file is 45%
  of everything every session loads. Shipping the signal is this unit's job;
  acting on it is a later application claim.

**Tests.** Extend `packages/intentionsutil/test/digest.test.ts`: both tables
render with the documented header shape; the `LIMIT` overflow line appears when
exceeded; ids containing a control character are escaped in both tables; and two
renders over the same input are byte-identical.

**Out of scope.** Consolidating anything. Changing any existing table. Any rules
file edit. Any projection-side work.

**Dependencies.** Units 1 and 5.

**Recommended model:** sonnet.

## Reuse

Reuse these; do not re-derive them.

- `packages/intentionsutil/src/store.ts:52` `writeNode` — the single frontmatter
  write gate (~21 call sites). Leave it unconditional; Unit 3's writer is the
  narrow exception beside it, never a flag on it.
- `packages/intentionsutil/src/store.ts:104` `assertNoBodyLoss`, `:128`
  `readExistingBody` — the guards that make `writeNode` body-safe and the exact
  reason a consolidation cannot route through it.
- `packages/intentionsutil/src/store.ts:74-92` `writeFileAtomic` — temp-file +
  rename publication. Unit 3's writer publishes through this discipline.
- `packages/intentionsutil/src/store.ts:166` `readNodeBody`, `:232` `listNodes`,
  `:187` `listNodesResilient` — the store readers. `listNodesResilient`'s
  top-level-`*.md`-only scan is why `intentions/operational/**/*.json` is
  invisible to `validateGraph` and safe to build on.
- `packages/intentionsutil/scripts/merge-node.ts:114-120` — the one existing
  precedent for writing a node file with an explicit caller-supplied body while
  mirroring `writeNode`'s serialization. Unit 3 follows it.
- `packages/intentionsutil/scripts/merge-node.ts:12-33,151-163` — the three-way
  exit-code contract (0 verdict / 3 content failure / other = never ran) and the
  `process.exitCode`-not-`process.exit()` pipe fix. Both CLIs adopt it verbatim.
- `packages/intentionsutil/src/node-merge.ts:103` `eq` — order-independent
  structural equality, the right primitive for deduping folded list entries. Do
  **not** call `mergeIntentionNodes` for a consolidation: its base/ours/theirs
  shape assumes one logical id diverging, and its measured field-removal and
  element-duplication behaviour is precisely what a consolidation must avoid.
- `packages/intentionsutil/src/digest.ts:56` `renderId`, `:118` `sortedIds`,
  `:372-406` `tableStoredDefaults`, `:239-251` `tableNearDup`, `:412` `renderTables`
  — the table conventions Unit 7 mirrors.
- `packages/intentionsutil/src/sensors.ts:26-58` `SensorRegistry` — the
  register/names/resolve shape (throws `IntentionSchemaError` naming the missing
  id, no silent skip) to mirror if a trigger-rule registry is needed.
- `packages/intentionsutil/src/errors.ts` `IntentionSchemaError` — the one error
  class the store/schema layer throws through. Every new validator uses it.
- `packages/intentionsutil/src/transitions.ts:508-534` — the three-shape
  tolerance idiom Unit 1's state normalization mirrors.
- `packages/intentionsutil/src/router.ts:103-113` `strategyFingerprint` — the
  canonical sha256-over-canonical-JSON recipe. Any hashing in this plan (the
  `hash12` record ids) follows this recipe's shape; do not invent a second
  hashing convention.
- `packages/intentionsutil/scripts/node-ancestry.ts:173`
  `buildAncestryProjection` — reuse for ancestor context rather than re-walking
  parent/serves edges.
- `packages/intentionsutil/scripts/graph-commit:45-52` (`--prune`, `--base`),
  `:1534,1549` (stages exactly `intentions/$id.md`) — the landing primitives and
  their exact scope.
- `.claude/skills/dispatch-propagate/scripts/run-typecheck.sh:287-293` — the
  `CHECKED == 0` explicit-zero discipline both CLIs adopt.
- `intentions/strategy-explicit-intent.md` — the overrule-algebra clarification
  (2026-08-31) and the CONSOLIDATION clarification (2026-08-31). Cite; never
  restate from memory.
- `intentions/tactic-intent-orchestration-layer-schema.md:552-621` — the
  `evidence.v1` / `claim.v1` shapes and the create-only operational layout Unit 6
  builds against.
- `intentions/tactic-migration-frontier-projection.md:394-420` — the stated
  fallback contract when `operational-store.ts` is absent; `:710-720` — the
  gap-note record shape.
- `intentions/tactic-node-review-skill.md:448-470` — the `parseDispositions`
  spec Unit 1's seam conforms to.

## Verification

All fences run from the repo root.

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The graph must still validate after any node write (and the digest must still be
deterministic):

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only > /tmp/digest-a.txt && node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only > /tmp/digest-b.txt && cmp /tmp/digest-a.txt /tmp/digest-b.txt && echo "digest deterministic"
```

The shim-parity check for Unit 2, self-contained and repo-runnable (it asserts
the deriver's directional relationship to the grep shim it liquidates, and fails
loudly on a deriver that finds fewer):

```verify
node --import tsx/esm packages/intentionsutil/scripts/deferred-queue.ts --dir "$PWD/intentions" --json > /tmp/dq.json && node -e 'const fs=require("fs");const q=JSON.parse(fs.readFileSync("/tmp/dq.json","utf8"));const {execSync}=require("child_process");const raw=parseInt(execSync("grep -rho \"decision: deferred\" intentions/ | wc -l").toString().trim(),10);const n=q.items.length;console.log("deriver:",n,"grep:",raw);if(n<raw){console.error("FAIL: deriver found fewer deferred dispositions than the raw grep — parser bug");process.exit(1)}console.log("shim parity OK")'
```

Note on the `npx tsx` spelling: every script invocation above uses
`node --import tsx/esm`, never `npx tsx`, which dies with `listen EPERM` under
the sandbox before it parses its arguments (`.claude/rules/sandbox.md`).

### Manual and judgment checks

- **Landing discipline, checked by reading, not by a fence.** Confirm
  `consolidate-node.ts`'s header states that `--base` is mandatory for a
  consolidation and gives the merge-resurrection reason. No automated check can
  verify a human passed `--base`; the header is the actuator, and its absence is
  the defect.
- **Authority-gate correctness against the source text.** Re-read the
  overrule-algebra clarification on `intentions/strategy-explicit-intent.md` and
  confirm `consolidationVerdict`'s four rows match its four rules, including that
  an AI disposition overruling a *delegated* one becomes **deferred** (rule 4,
  the author's refinement of Claude's proposal) rather than staying delegated.
  Getting this row backwards silently removes content from the author's review
  queue, which is the one failure this whole operation must not have.
- **A real dry run, end to end.** Run `consolidate-node.ts --dry-run` against
  `intentions/strategy-explicit-intent.md` and read the printed plan and
  citation. Expect a **refusal** on any ratified clarification and a permitted
  plan only on deferred/delegated content. A dry run that permits folding
  ratified doctrine is a stop-the-line defect, not a tuning problem.
- **Trigger table sanity.** Run the digest and read `[CONSOLIDATION-DEBT]`.
  `strategy-graph-native-dispatch` (645 KB) must be row one. If it is not, the
  ranking is wrong.
- **Observe in use, not at build time.** Whether the target-size threshold in
  `shouldFold` is set sensibly cannot be judged from the empty evidence log that
  exists today (`intentions/operational/` does not exist yet). Leave it as a
  caller-supplied argument, and revisit once
  `tactic-ladder-reconciliation-observe` is producing real evidence.

## Deliberately not built here

Recorded so a later claim does not rebuild them and this claim does not sprawl:

- **Multi-node consolidation** (folding two node ids into one). The mechanism
  exists — `superseded_by` / `status: superseded` /
  `supersession_expiry` (`packages/intentionsutil/src/schema.ts:286,299`,
  validateGraph rules 24–25) on the loser, plus
  `graph-commit --prune <loser-id>`. This plan is intra-node only.
- **Applying the operation to any node.** Building the operation and running it
  are separate claims. The trigger table drives the second.
- **The projection side of the rules corpus** — `tactic-context-materialization`.
- **Landing operational records** — `tactic-ladder-reconciliation-observe`.
- **The review queue's priority function and the virtual review node** —
  `tactic-node-review-skill`.
- **The charter prose for the digest tables** — `tactic-rsi-graph-review`.
- **Writing `disposed_by` on a gap-note record** — an unclaimed seam, noted in
  Unit 6, needing the frontier owner's agreement rather than a unilateral write.
