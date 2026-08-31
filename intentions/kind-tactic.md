---
id: kind-tactic
kind: kind
statement: Tactic — a completable unit of execution
owner: human
status: codified
parent: null
rationale: >-
  Tactics are the bottom layer: concrete, completable work. A tactic is not
  always a leaf — it may be a subtree. An epic is a tactic whose children are
  tactics, linked by `parent` edges. Tactics are also the delegable layer —
  delegating a tactic is expected and beneficial (it buys attention at the
  strategic level), and doing so creates or extends a delegation record
  (kind-delegation) where the attachment is assessed.


  Transience. A tactic is transient: when it completes it is removed from the
  graph, and its edges go with it. Completion is marked by the author or by the
  dispatch workflow directly in the graph.


  Authority. The graph is the sole store: every tactic is authored here, and no
  external system feeds or mirrors tactic state. (Integration with an external
  tracking system such as GitHub is a separate strategy; design TBD.)


  Edges. `parent` links a tactic to a larger tactic. `serves` links a tactic to
  the strategies it advances; populating `serves` is dialectic work.


  Authoring test. If fully achieving it would make you delete the node, it is a
  tactic; if achieving everything currently under it leaves a standing,
  condition-monitored posture, it is a strategy.
reading: null
serves: []
recovers: []
clarifications:
  - question: A tactic is pruned on completion — where does doctrine it settled live?
    answer: "In the persistent layer, before the prune: settled doctrine, standing
      rules, and design decisions land on the strategy or kind node they belong
      to as part of completing the tactic — persistent intentions and beliefs
      belong in persistent layers by definition. Citing a pruned tactic id
      afterwards is legitimate (git history recovers it), but a citation is
      provenance, never the doctrine's home. Recorded 2026-07-09 interview."
  - question: What does a tactic node's markdown body carry?
    answer: The execution plan — clean-session-executable and authoritative
      (writeNode preserves tactic bodies verbatim across frontmatter rewrites),
      per kind-kind's body-function rule. Recorded 2026-07-09 interview.
  - question: Where does an interview outcome land — strategy layer or tactic layer?
    answer: "(Recorded 2026-07-21 interview.) By the authoring test, applied to the
      content: a standing requirement — one that must still hold after every
      tactic currently serving the strategy completes and is pruned — lands in
      the persistent layer (a strategy or kind clarification); a completable
      change — fully achieving it would delete the node — lands as a tactic. One
      outcome often splits: the standing invariant is a clarification, its
      implementing fix a tactic. Orthogonality of the content to the strategy's
      open children is a freeze-blast-radius input (the materiality
      classification deciding which children re-stamp) and never a placement
      criterion: a standing invariant no open child happens to depend on is
      still a standing invariant. Aristotelian grounding, Claude-drafted and
      held on trust pending tactic-reading-chunk-33-aristotle-energeia-kinesis:
      persistent-layer content is hexis-like — held and exercised, complete at
      every moment of its holding, never finished (the ratified
      hexis-in-energeia reading on tradition-aristotle) — while tactic-layer
      content is kinesis-like — a process incomplete while under way and
      complete only at its terminal end (NE X.4 1174a-b; Metaphysics Θ.6 1048b).
      delegation-philosophical-articulation's delegated scope is extended
      accordingly. Supersedes the orthogonality-of-open-children heuristic
      improvised in the same-day mitigation round, which misread blast-radius
      economics as placement semantics."
  - question: "Is `status: raw` together with `phase: done` a node defect to sweep?"
    answer: >-
      (Recorded 2026-08-30.) No. `status` and `phase` are independent axes with
      different writers, and the pair is the legitimate record of a common case.
      `status` is authoring provenance: it is written once at mint, and the
      dispatch ladder never advances it. `phase` is dispatch position, and is
      router-owned. So a tactic executed without an author dialectic — a filed
      follow-up, a ledger entry, a fleet alarm, a main-red diagnosis, a
      `/qa-main` bug node — finishes as `status: raw` with `phase: done`, and
      that pair is a true statement about it.


      Measured 2026-08-30 across the 780-node store: 62 nodes carry the pair and
      all 62 are tactics. Rewriting their `status` to `codified` would
      manufacture false provenance — asserting an author settled an execution
      plan where none did — and rewriting `phase` would reopen finished work.
      Neither is correct, and the cohort would regrow regardless: the producers
      of `status: raw` are live, and nothing in the transition machinery ever
      writes the field. The pair must not be swept.


      Where it reads as a defect, the fault is in the reader. `activeFrontier`
      (`packages/intentionsutil/src/goals.ts`) filters on `status !==
      "codified"` alone, so it retains every done leaf; the repair is a `phase`
      clause there, not a migration here. Gate on `phase`, never on `status !==
      "raw"` — the 3 nodes carrying `delegated` with `phase: done` are the
      standing proof that `status` is the wrong axis for the question.
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
attributes:
  goal_layer: true
  fields:
    - "attention: valid on this kind (goal_layer: true) — a TOP-LEVEL field, not
      an attributes entry; canonical definition on kind-kind's field list"
    - "measured_impact: list of summary measurement records {metric, value,
      unit, window, sensor, measured} about this tactic — queryable input to a
      ranking or classification act, never an ordering authority of its own;
      shape enforced by validateGraph rule 21"
    - "ledger_entry: true marks this tactic an evaluation finding ledger entry —
      one node per distinct recurring finding, merged not accumulated, and
      EXEMPT from unreferenced-pruning so a retirement keeps its
      measured_impact; absent or false on every other tactic"
  status_vocabulary:
    raw: not yet dialectically examined
    refining: under active dialectic
    delegated: Claude-authored on trust; the decisions remain the author's
    codified: the plan is written and the tactic is ready to dispatch — the author
      has settled its execution plan
    superseded: the intent moved to another node — abandoned, not completed;
      superseded_by names the successor
---
# Tactic — a completable unit of execution

A tactic node's body is its execution plan — clean-session-executable and
authoritative. This section is the exception that makes the rule usable: it is
the normative detail for the four fields only tactic nodes may carry. The
all-nodes field list, the shared shapes, and the full graph rule set live on
kind-kind, which is the schema authority; nothing here restates it.

Every node file carries these four fields and `validateNode` defaults them
uniformly (`phase: null`, `execution: null`, `validates: []`, `blocked_by: []`).
What makes them tactic-scoped is graph rule 10: `validateGraph` rejects a
non-null `phase` or `execution`, or a non-empty `validates` or `blocked_by`, on
any node whose `kind` is not `tactic`.

The last two sections cover `attributes.measured_impact` and
`attributes.ledger_entry` instead — not top-level fields but attributes
sub-keys, declared in this kind node's `attributes.fields` list. They are
documented here for the same reason: they carry normative detail no shape rule
does.

## `phase`

The persisted dispatch phase this tactic sits in, one of `draft`,
`align-tactics`, `implement`, `qa`, `review`, `main-qa`, `done`. The router
transitions it; the schema only checks the value is a member of the enum. `null`
means no dispatch state — a tactic authored but not yet entered into the
workflow.

`fix` is deliberately NOT a phase. The CI-fix interrupt lives entirely in the
orthogonal `execution.fix` record, set and cleared off the live CI verdict
independent of whatever phase the tactic is in — so a tactic under CI repair
does not lose its place in the lifecycle.

`superseded` is deliberately NOT a phase either. `done` is the COMPLETION
terminal; abandonment is the second terminal and is carried on `status`, with
`superseded_by` naming the successor. A superseded tactic keeps whatever phase
it reached, so a reader asking "is this node still live work" must consult
`status` too, while a reader that specifically means "reached the completed
terminal" keeps the literal `phase === "done"` test. The full rationale — and
why a `superseded` phase would deadlock the ladder and could not mark a
superseded strategy at all — lives on kind-kind under Supersession, which is the
authority for cross-kind fields; it is not restated here.

## `execution`

The live in-flight record a router stamps on a tactic: `branch`, `pr`,
per-phase `attempts`, `markers`, the `strategy_fingerprint` soft-freeze stamp,
the `fix` interrupt record, and the `completion` merge evidence. Field-by-field
shapes and validation rules are on kind-kind under the `Execution` shape.

Two parts of it carry tactic-specific meaning worth naming here. The
`strategy_fingerprint` map keys each strategy this tactic `serves` to that
strategy's substance hash at the moment the tactic was planned: when a serving
strategy is later edited, the mismatch is what tells a mid-flight tactic its
plan was written against a strategy that has since moved. A serving strategy
absent from the map is never stale. And `completion` is what lets a
merge-verification gate confirm the tactic's work actually reached `main`
without trusting `execution.pr` alone — the tactic layer is transient, so the
evidence must be captured before the node is pruned.

## `validates`

Ids of the strategies whose `success_signal` this tactic validates — a factual
edge, distinct from `serves`. `serves` says which strategies the tactic
advances; `validates` says the tactic's completion is itself evidence about a
strategy's signal. `validateGraph` rule 14 requires every entry to resolve to an
existing `kind: strategy` node; unlike `serves` and `parent`, this edge owns its
own dangling case, so a `validates` entry naming a non-existent id is reported
directly rather than by a separate existence rule.

## `blocked_by`

Ids of the tactics that must complete before this one begins. The gate is
subtree-wide: no tactic in a blocked subtree starts until the blocking tactics
complete. `validateGraph` rule 13 requires every entry to resolve to an existing
`kind: tactic` node (again owning its dangling case), and rule 15 rejects cycles
— a depth-first walk over the resolved edges flags every node that participates
in a cycle, since a tactic transitively blocked by itself can never start.
Dangling edges are reported by rule 13 rather than traversed.

Because tactics are transient, a blocking tactic disappears when it completes;
the blocked tactic's entry must be removed at the same time, or rule 13 will
report it as unresolved.

## `measured_impact`

A list of summary measurement records about this tactic — the ledger's
prioritization column. Each record is
`{metric, value, unit, window, sensor, measured}`: `metric` names what was
measured (`recurrence_count` and `recoverable_tokens` are two `metric` values in
this one shape, not two separate fields), `value` is the figure, `unit` its unit,
`window` the period it aggregates, `sensor` the instrument it came from, and
`measured` the `YYYY-MM-DD` day it was taken. `validateGraph` rule 21 enforces
that shape: `metric`/`unit`/`window`/`sensor` non-empty strings, `value` a finite
number, `measured` a date. `attributes` is otherwise free-form, so without the
rule a malformed measurement would reach every consumer unchallenged.

Four properties bound the field (recorded on
`strategy-rsi-delegated-prioritization`, 2026-08-12).

**It never orders.** A measurement is queryable INPUT to a within-band attention
write or to a classification act — never an ordering authority of its own. Rule
21 checks shape and never reads a value, and no machinery writes `attention` or
`attributes.tier` from a measurement. Crossing a recurrence threshold makes a
tactic ELIGIBLE for an act the model is already permitted — adding
`attributes.bug_fix: true` when the recurrence is genuinely a defect — which
lifts tier 1→2 through `ownTier`'s existing derivation. The measurement is the
cited justification for that act, not a new kind of act.

**It must be cited.** A delegated attention write justified by a measurement
names the record in its `attributes.priority_log` rationale, so the anti-thrash
log carries the evidence and not just the assertion.

**It is sensor-attributed.** The `sensor` field brings a record under
`strategy-token-economy`'s standing condition that a yield metric credited to a
named instrument is verified to have come from that instrument. An unverified
attribution is not admissible ranking input.

**It is summary, not an event log.** Re-measuring rewrites the record for that
`metric`/`window`; it never appends an occurrence. This is the deliberate
difference from `attributes.priority_log`, which the field otherwise resembles,
and it is what bounds both node growth and the re-measurement write surface.

Re-measurement is fingerprint-safe by construction, so it never freezes a
tactic's open children. `strategyFingerprint` hashes an explicit allowlist of six
substance fields — `statement`, `clarifications`, `attributes.conditions`,
`serves`, `success_signal`, `tooling_goals` — and `tacticScopeFingerprint` hashes
only `(statement, body)`, no frontmatter at all. `measured_impact` is exempt
because neither allowlist names it, not because either carries an exclusion for
it; a regression test in the router suite locks that in.

## `ledger_entry`

`true` marks this tactic an **evaluation finding ledger entry**: the durable
record of one recurring evaluation finding, carrying that finding's summary
figures on `attributes.measured_impact`. Absent (or `false`) on every other
tactic. Written only by
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`.

**One node per distinct finding — never one per occurrence.** Similar findings
MERGE. A recurrence refreshes the entry's body and increments the
`recurrence_count` record on `measured_impact`; it does not mint a second node.
Deciding whether a finding in hand *is* an existing entry is a similarity
judgment the calling evaluator makes against the ledger (`dispatch-eval-finding
--list`), not a lookup in a closed taxonomy — the set of findings that recur is
exactly what the ledger exists to discover, so it cannot be enumerated up front.
The entry's slug is only the addressing mechanism for that judgment.

**Retirement keeps the figures.** An entry retires by transitioning to `phase:
"done"` with `measured_impact` intact. Nothing is reset, because a recurrence
after retirement is evidence the landed fix did not hold, and the count is what
says how many times. Such a recurrence therefore RESUMES the entry — the count
continues and `phase` clears back to `null` — rather than starting a fresh
record at 1.

**Exempt from unreferenced-pruning.** Resumption only works if the retired node
still exists, so a ledger entry is excluded from the owed-prune census's
prunable set (`computeDebt` in
`packages/intentionsutil/scripts/graph-census-debt.ts`). That is where the
exemption has to live: `graph-commit --prune` is content-blind, so nothing
downstream can honour a convention the candidate query does not encode, and a
convention the pruner does not read is not an exemption. `phase: "done"` on a
ledger entry consequently does NOT mean "finished, drop it" the way it does
elsewhere; `isLedgerEntry` (`packages/intentionsutil/src/schema.ts`) is the one
predicate every such consumer shares, and `rsi.ts`'s §6 task plan is the other
caller — an entry is a record, not a task, and rendering one there would raise a
permanent `task-done` staleness flag whose remedy is precisely what must never
happen to it. §7 of `rsi-plan.md` renders the ledger instead.

**It never orders.** Like `measured_impact` itself, a recurrence count is
queryable input to a ranking act, not an ordering authority. An entry is minted
with `attention: null` — rank is never machine-injected — and with
`pace_exempt: true`, because recording a finding is not paced work.
