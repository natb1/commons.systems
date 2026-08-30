---
id: tactic-mechanical-park-producers
kind: tactic
statement: "Mechanical retry holds stop being office_hours parks: the
  provision-exit-11 path and the fix-attempt-cap park emit blocked_by edges
  against a tracked fix tactic instead, and tactic-router-failure-fuses is
  re-scoped to match"
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-25 concurrency/serialization review,
  implementing the park-taxonomy clarification recorded the same day. A park
  asserts that no autonomous path forward exists and a human is required, but a
  merge conflict against a moving main has an autonomous resolver to route to.
  At recording time roughly five of the most recent commits on main were
  provision-exit-11 parks, burying the genuinely author-required parks.
  Finalized 2026-07-25 /align-tactics (per-node finalize): the plan converts
  both named producers to a shared hold-node primitive (find-or-create a
  born-parked incident tactic + blocked_by edge on the source, never
  office_hours on the source itself), reusing the graph-census-debt.ts
  decision/land split and park-node's fresh-main/rollback mechanics. Producer
  1's ideal greenfield (an orthogonal execution.conflict interrupt routed to
  /dispatch-conflict) is already specced and in-flight as
  tactic-graph-router-conflict-routing (blocked_by
  tactic-dispatch-conflict-branch-merge-lane, repointed 2026-07-27 after
  tactic-dispatch-conflict-greenfield shipped as PR #2951 and was pruned) — this
  tactic ships the interim brownfield bridge (a free local-retry tier, then a
  tracked hold) rather than duplicating that design; Unit 3's comments record
  the convergence so the strike/hold branch is deleted when that tactic lands."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Is "a merge conflict against a moving main frequently self-resolves" a
      valid premise for de-parking the mechanical retry producers?
    answer: "(Recorded 2026-08-01, author-directed.) No — the premise is factually
      invalid and is struck from this node's text. It was already superseded on
      2026-07-29: `intentions/strategy-graph-native-dispatch.md` clarification
      134 AMENDS the 2026-07-25 park-taxonomy clarification's stated premise —
      'a merge conflict is not expected to self-heal ... the 2026-07-25
      clarification's CONCLUSION survives unchanged (a conflict is not an
      office_hours park), but its REASON is corrected: conflicts are de-parked
      because an autonomous resolver exists to route them to, not because they
      resolve themselves.' This node's own text simply had not been updated to
      match until now. The correction is textual only: the conclusion, the unit
      list, and the explicitly-out-of-scope list are unchanged. Corrected in
      four places — the `rationale` field, the `## Context` producer-1
      paragraph, the out-of-scope catch-all bullet ('not a self-resolving retry
      state' → 'no autonomous resolver to route it to ... not a mechanical retry
      state'), and the Unit `case 0` parenthetical ('the conflict self-resolved'
      → 'the conflict is resolved')."
  - question: Does the provision-conflict producer keep the hold-node shape once the
      greenfield conflict interrupt lands, as this node's convergence note
      directs?
    answer: "(Recorded 2026-08-03, author-confirmed.) No — that direction is
      SUPERSEDED for the conflict producer, and the supersession runs the
      opposite way from what this node's `## Context` convergence note states.
      That note says [[tactic-graph-router-conflict-routing]]'s
      `execution.conflict.attempt` cap will call `hold-node` instead of parking;
      the target design is the reverse — that cap calls `park-node` on the
      SOURCE node, and the two interim provision-conflict hold producers
      (`/dispatch-conflict` Lane 3's `hold-node --kind provision-conflict`, and
      `dispatch-graph-execute` case 11's strike/hold ladder) collapse into the
      same direct park. WHY: a conflict is handled exactly like a failing CI
      check — detecting it interrupts phase progression and launches the
      resolution skill directly; the worker is selected by normal ranking on the
      source; it assesses mechanical-vs-author-intention; and only when author
      attention is required does it park, on the source's own `office_hours`,
      with the reason and recommended next step. That is precisely
      `/fix-checks`' and `/qa-fix`' existing escalation shape, and the hold
      indirection buys nothing over it here while costing the source's real
      queue priority (the defect [[tactic-unclaimed-hold-alerting]] measured:
      hold 5.33 vs source 60.33). Of this node's five original reasons for
      hold-over-direct-park, three no longer bear on the conflict producer:
      reason 1 (conflicts self-resolve) was struck in the clarification above;
      reasons 2 and 5 (no autonomous ladder can execute cross-branch
      remediation; a laundered retry loop) describe a generic unattended re-run,
      which the shipped first-responder design never does — case 11 already
      dispatches a real resolver against the node's own branch. WHAT SURVIVES:
      `hold-node` is NOT deleted. It stays for the `fix-attempt-cap` producer
      and any future kind, on a reason specific to those: `blocked_by` is a
      LIST, so a hold node can represent a source blocked by several
      independent, separately-resolvable things at once, and resolving one
      auto-resumes the source through `blockersComplete` with zero writes on the
      source. The conflict producer needs neither property — a conflict is a
      single condition whose resolution is the resolver's own terminal state.
      Retiring it for conflicts is therefore a narrowing of this node's scope,
      not a reversal of its doctrine. This node's `## Context` convergence note
      and Unit 3's in-code comment both need updating to match when the
      greenfield lands; until then this clarification is the authority."
tooling_goals: []
success_signal: null
attention:
  boost: 10
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: demoted from the pre-bootstrap 85-90
    band to 10. These are ordinary improvements, not integrity defects; at 85-90
    they outranked strategy-main-health (101 resolved) and flooded the selector
    hot band. Interim scaffolding only; tactic-attention-tier-ranking and
    tactic-attention-boost-scripts retire this numeric scheme."
  tier: 1
phase: done
execution:
  branch: tactic-mechanical-park-producers
  pr: 2970
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-07-26T05:07:00Z
    mergeCommitSha: 3e3bcca64eace2931d8fc69d4c293abfaa9ba4de
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Mechanical retry holds stop being office_hours parks: the provision-exit-11 path and the fix-attempt-cap park emit blocked_by edges against a tracked fix tactic instead, and tactic-router-failure-fuses is re-scoped to match

## Context

A park (`office_hours` on a node) asserts that **no autonomous path forward
exists and a human is required**. Two producers violate that assertion by
writing parks for *mechanical retry states*, and both park the **work item
itself** rather than an incident:

1. **provision-exit-11** — `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:197-204`
   calls `park-node` when `provision-node-worktree` (`:118-123`) cannot merge
   `origin/main` into the tactic's own persistent worktree branch. A conflict
   against a moving main is not expected to self-heal — but it has an
   autonomous resolver to route it to (the conflict-resolution lane), which is
   why it is not a park (`intentions/strategy-graph-native-dispatch.md`,
   clarification 134, 2026-07-29 interview: *"conflicts are de-parked because
   an autonomous resolver exists to route them to, not because they resolve
   themselves"*). At recording time roughly five of the most recent commits on
   main were exit-11 parks, burying genuinely author-required parks beneath
   them.
2. **fix-attempt-cap** — `packages/intentionsutil/scripts/apply-fix-state.ts:259-285`
   (`applyParkCheck`, mode `--park-if-capped`), called from
   `.claude/skills/dispatch-propagate/scripts/graph-select-target:306-320`,
   writes `node.office_hours` directly onto the source tactic when
   `execution.fix.attempt` exceeds `FIX_ATTEMPT_CAP`
   (`packages/intentionsutil/src/transitions.ts:101`, = 3).

The park-taxonomy clarification (`intentions/strategy-graph-native-dispatch.md`,
2026-07-25 interview, author-ratified) rejects a park-kind schema field and
prescribes the terminal-disposition doctrine instead: *a mechanical hold
converts to `blocked_by` edges against a tracked fix tactic and clears in the
same `graph-commit`*. This plan makes both producers follow it.

**The mechanism — the "tracked hold".** A mechanical hold is expressed as two
things landed in one `graph-commit`:

- a **hold tactic** — a small, self-contained incident node (`kind: tactic`,
  deterministic id `tactic-hold-<kind-slug>-<source-slug>`,
  `attributes.hold_for: <source-id>`, `attributes.hold_kind: <kind>`, `serves`
  copied verbatim from the source), **born `office_hours`-parked**, carrying
  the diagnosis and a resolution recommendation;
- a **`blocked_by` edge** appended idempotently to the SOURCE tactic naming
  that hold tactic.

The source tactic's own `office_hours` is **never** written. It becomes
unselectable by *edge*, not by *park* — `blockersComplete`
(`packages/intentionsutil/src/router.ts:162-168`, gated at `:297,325`)
re-admits it on the very next tick once the hold tactic reaches `phase: done`
or is pruned, with **zero writes on the source node**.

### Ideal greenfield vs. what this PR does (Producer 1)

Per `.claude/rules/design-proposals.md`, the ideal design first, independent
of migration cost: provision exit 11 is not a park and not a new node — it is
an **orthogonal interrupt on the source node**, `execution.conflict`, at exact
parity with `execution.fix`. The router emits phase `conflict`; the tick
dispatches `/dispatch-conflict <node-id>` against the source node's own
worktree, where the conflict actually lives. The interrupt is attempt-capped,
and only cap exhaustion produces a tracked hold. No new node, no `blocked_by`,
no park, in the common case.

That greenfield is **already designed and already in flight as two separate
tactics** — verified on `origin/main`: `intentions/tactic-graph-router-conflict-routing.md`
(`phase: implement`, `blocked_by: [tactic-dispatch-conflict-branch-merge-lane]`)
specifies exactly this (a mergeable sensor, an `apply-conflict-state.ts`
primitive, `execution.conflict.attempt` capping, and the dispatch call site),
gated on the tactic that gives `/dispatch-conflict` a lane able to reproduce a
live git conflict against a node-id target — precisely the gate the `case 11`
comment at `dispatch-graph-execute:198-201` already names. **Reaching the
greenfield is not this tactic's PR, and
attempting it here would duplicate work already in flight.** So this PR ships
the interim brownfield step: a free local-retry tier, then a tracked hold on
persistent exhaustion. The `hold-node` primitive built here is the durable
piece — when `tactic-graph-router-conflict-routing` lands, its
`execution.conflict.attempt` cap calls this same `hold-node` instead of
parking, and Unit 3's strike/hold branch is deleted. Unit 3's comments must
record this convergence note.

**Repointed 2026-07-27 `/align-strategy`.** This section originally named
`tactic-dispatch-conflict-greenfield` (`phase: review`) as the gate. That
tactic shipped as PR #2951 and was pruned, and the prune cleared the
`blocked_by` edge on `tactic-graph-router-conflict-routing` to `[]`. Clearing
it was wrong: greenfield delivered `/dispatch-conflict` **Lane 2**, which
accepts a node id but explicitly does not reproduce a live git conflict — it
services only `graph-commit` concurrent-edit parks and refuses anything else,
while **Lane 1** reproduces live conflicts but rejects node ids. Node-id
acceptance was therefore only half the gate this section describes, so the
edge was repointed to `tactic-dispatch-conflict-branch-merge-lane`, which owns
the residual capability. Editing this body is safe at `phase: main-qa`: main-qa
is not scope-chained (`SCOPE_CHAINED_PHASES` is `{qa, review}` in
`packages/intentionsutil/src/scope-sweep.ts:31`), so no demotion follows.

### The crux decision: the hold tactic is born-`office_hours`-parked, not `phase: implement`

Applies to both producers. Justification:

1. **The cap is an *earned* assertion, not an assumed one.** The doctrine's
   objection is that a park *assumes* no autonomous path exists before trying.
   After N free autonomous retries have demonstrably failed, the assertion is
   true by observation. The queue-noise reduction comes from the retry tier
   producing **no record at all**, not from changing the terminal record's
   phase.
2. **Cross-branch ladder mismatch is decisive (Producer 1).** Remediation must
   land on the SOURCE node's own branch. A `phase: implement` node is
   provisioned its own worktree/branch named after itself
   (`provision-node-worktree:104-110`) and the ladder expects a PR on that
   branch — a branch with no diff for a *new* node. No autonomous ladder can
   execute cross-branch remediation today; minting a `phase: implement` hold
   node would feed the router work it structurally cannot complete.
3. **Doctrine fidelity.** The clarification prescribes the *edge shape*
   ("blocked_by edges against a tracked fix tactic"), not the fix tactic's
   phase. Its complaint is parking the *work item* for a mechanical state.
   Born-parked incident tactics are established precedent:
   `packages/intentionsutil/scripts/graph-census-debt.ts:164-172` (born-parked
   census) and the systemic breaker in `tactic-router-failure-fuses.md:97-116`.
4. **Strictly better resume semantics.** Resolving the incident (`phase:
   done` → pruned, repairing the inbound `blocked_by` edge in the same
   commit) auto-resumes the source with no write on it — versus today, where a
   human must clear `office_hours` on the source, entangling the incident's
   resolution with the work item's own state.
5. **Producer 2 specifically:** `phase: implement` on the hold tactic would be
   a retry loop laundered through a new node id — "make PR #N green" is
   exactly what `/fix-checks` just failed at three times, with nothing
   changed about why.

**Load-bearing consequence every hold recommendation must state:**
`blockersComplete` clears only on `phase === "done"` or absence. A human who
merely clears the hold tactic's `office_hours` without setting `phase: done`
leaves the source blocked forever. Every hold recommendation text must say:
*resolve the hold tactic to `phase: done` (then prune) — clearing
`office_hours` alone does not unblock the source.*

**Explicitly out of scope (verified, not this tactic's job):**

- `dispatch-graph-execute`'s default catch-all case (any `provision-node-worktree`
  exit other than 0/10/11/12/13 — bad node id, unresolvable project root,
  failed git fetch/worktree-add) stays an `office_hours` park. It is a genuine
  environment/infra failure with no autonomous resolver to route it to, not a
  mechanical retry state, and the doctrine names only the merge-conflict case
  (11).
- `packages/intentionsutil/scripts/graph-commit`'s own concurrent-edit-conflict
  park (`graph-commit:900`) and `.claude/skills/dispatch-conflict/SKILL.md`'s
  Lane 2 (which already autonomously resolves and clears most of these via an
  opus subagent, staying parked only on genuine ambiguity) stay untouched —
  architecturally already-autonomous, and not named by the doctrine.
- `packages/intentionsutil/scripts/graph-census-debt.ts`'s census-tactic park
  stays untouched — a genuine backlog/housekeeping notice, not a retry state.

## Units of work

### Unit 1 — `hold-node-decide.ts`: the pure decision + construction half

**Scope.** New file `packages/intentionsutil/scripts/hold-node-decide.ts`.
Modeled directly on `packages/intentionsutil/scripts/graph-census-debt.ts`
(the network-free, testable DECISION half; the bash caller owns the LANDING
half — the same split as `reconcile-graph.ts` ↔ `reconcile-graph-merged`).

CLI: `node --import tsx/esm hold-node-decide.ts --source <id> --kind
<provision-conflict|fix-attempt-cap> --reason-file <f> --recommendation-file
<f> [--body-file <f>] [--now <YYYY-MM-DD>] [--intentions <dir>]`.
Reason/recommendation come from **files**, not argv (both carry multi-line
diagnostic text).

Behavior — reads the store via `listNodes`/`readNode`
(`packages/intentionsutil/src/store.ts`), writes **nothing**, calls no
git/gh, prints one JSON object:

- Derive `hold_id = "tactic-hold-" + kindSlug + "-" + sourceId.replace(/^tactic-/,
  "")`, where `kindSlug` is `conflict` for `provision-conflict` and `fix-cap`
  for `fix-attempt-cap`. Assert the result matches the node-id regex used at
  `provision-node-worktree:56` (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`); fail loud if
  not. Deterministic ids make find-or-create idempotent by existence — the
  find key here is *structural* ("is there already an unresolved hold for
  this exact source"), not content-derived, so no fingerprint is needed.
- Reserve a third `kindSlug`, `no-progress`, in the kind vocabulary's doc
  comment for `tactic-router-failure-fuses`' per-node fuse; do **not**
  implement a producer for it here.
- Dispositions:
  - `NONE` — no node at `hold_id`. Emit a fully-constructed born-parked `node`
    object and `node_body` markdown.
  - `EXISTING` — node at `hold_id` with `phase !== "done"`. Emit
    `node_body_append` (a dated occurrence stanza) only; do **not** refresh
    `office_hours.since` (its age is signal), do **not** touch `phase`.
  - `REOPENED` — node at `hold_id` with `phase === "done"` (resolved but not
    yet pruned). Emit a fresh `office_hours` record, `phase: null` (back to
    the born-parked latch state), and `node_body_append`.
- Also emit `source_blocked_by`: the source's current `blocked_by` array with
  `hold_id` appended **only if absent** (idempotent), plus a boolean
  `source_edge_needed`.
- Constructed node fields: `kind: "tactic"`, `owner: "ai"`, `status:
  "codified"`, `parent: null`, `serves` **copied verbatim** from the source
  node's own `serves` array (never forced onto a strategy — `align-tactics`
  clarification 27), `execution: null`, `validates: []`, `blocked_by: []`,
  `phase` omitted (null), `office_hours: { reason, since: now, recommendation
  }`, `attributes: { hold_for: <source-id>, hold_kind: <kind> }`.
- The generated `node_body` must state the source id, the kind, the diagnosis
  (`--body-file` contents when given), and a **How to resolve** section
  ending with the mandatory sentence from Context above. Mirror
  `graph-census-debt.ts:180-205`'s body-construction style.

New test file `packages/intentionsutil/test/hold-node-decide.test.ts`,
modeled on `packages/intentionsutil/test/graph-census-debt.test.ts`. Cases:
id derivation for both kinds; id-regex rejection of a pathological source id;
`NONE`/`EXISTING`/`REOPENED` dispositions; `serves` copied verbatim including
a multi-entry source; `source_edge_needed` false when the edge already
exists (idempotent re-entry); constructed node passes `validateNode`
(`packages/intentionsutil/src/schema.ts`); body contains the mandatory
resolution sentence.

Out of scope: any file write, any git call, any `office_hours` write on the
source.

**Recommended model:** opus — new module that fixes the id/attribute
conventions and the doctrine-carrying recommendation text the rest of the
plan (and `tactic-router-failure-fuses`) consume.

**Dependencies:** none.

### Unit 2 — `hold-node`: the landing half (the `park-node` sibling)

**Scope.** New bash script `packages/intentionsutil/scripts/hold-node`, a
direct structural sibling of `packages/intentionsutil/scripts/park-node` and
the landing counterpart of Unit 1, modeled on
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-census` (the
census landing half).

Usage: `hold-node <source-node-id> --kind <provision-conflict|fix-attempt-cap>
--reason-file <f> --recommendation-file <f> [--body-file <f>]
[--reset-fix-attempt]`. Exit codes mirroring `park-node:41-43`: `0` held and
landed; `1` write/`graph-commit` failed (including a refused
compare-and-swap); `2` usage error. Stdout: one line, `held <hold-id>
(<disposition>)`.

Sequence:

1. Fetch `origin/main` and apply **park-node's fresh-main invariant**
   (`park-node:60-80`): overwrite the local `intentions/<source>.md` from
   `origin/main` before reading it, capturing `SOURCE_BLOB` for `--base`.
   Same for the hold node's file when it already exists (capture
   `HOLD_BLOB`); when it does not, apply `dispatch-graph-census`'s inverted
   probe (`dispatch-graph-census:96-101`) — absence is the expected
   born-fresh case.
2. Run Unit 1's decision script; parse `disposition`, `hold_id`, `node`,
   `node_body`/`node_body_append`, `source_blocked_by`, `source_edge_needed`.
3. Write the hold node's frontmatter through `write-node.ts` (the single
   validation gate). For `NONE`, replace the generated placeholder body
   wholesale using `dispatch-graph-census:130-150`'s exact recipe
   (`writeNode` emits a `# <statement>` placeholder for a new node; appending
   would produce a malformed two-H1 body). For `EXISTING`/`REOPENED`,
   **append** `node_body_append` to the existing body — never replace.
4. When `source_edge_needed`, write the source's updated `blocked_by` through
   `write-node.ts`. **Via `write-node.ts` + `graph-commit`, never
   `transition-node`** — `transition-node` only handles `phase`/`--set-pr`
   and has no `blocked_by` handling (the same deliberate deviation
   `.claude/skills/fix-checks/SKILL.md`'s node lane documents for the flake
   edge).
5. When `--reset-fix-attempt`, invoke `apply-fix-state.ts <source>
   --reset-attempt` (Unit 4's new mode) **after** the fresh-main refresh, so
   the reset is not clobbered by step 1. This is the one narrow, documented
   producer-specific flag on an otherwise generic primitive; comment why the
   reset cannot happen in the caller (it would be overwritten by the
   refresh).
6. Land **both files in one commit**: `graph-commit --base
   "<source>=$SOURCE_BLOB" [--base "<hold>=$HOLD_BLOB"] -m "graph: hold
   <source> on <hold-id> (<kind>)" <source> <hold-id>`. Multi-id and
   repeatable `--base` are supported (`graph-commit:32,37-41`). This
   satisfies the doctrine's "clears in the same graph-commit".
7. `EXIT` trap rollback covering both files, combining `park-node:78-100`
   (restore from the captured blob) and `dispatch-graph-census:104-125`
   (delete a born-fresh file, restore a pre-existing one), gated on a
   `MUTATED` flag so a pre-mutation failure never touches a file the script
   did not write. A failed land must leave no dirty `intentions/*.md` — else
   `graph-commit`'s `assert_clean_outside_ids` guard trips for every other
   node.

New test `packages/intentionsutil/scripts/test-hold-node.sh`, modeled on
`packages/intentionsutil/scripts/test-park-node.sh` (stub `graph-commit`,
assert argv). Cases: born-fresh hold + edge in one commit with both ids
passed; idempotent re-entry (edge already present → no duplicate entry);
`EXISTING` body-append does not replace; `REOPENED` resets phase to null and
re-parks; source's `office_hours` stays `null` in **every** disposition (the
load-bearing assertion); `graph-commit` failure rolls both files back;
`--base` tokens present for pre-existing files only.

Out of scope: any change to `park-node` itself, to `graph-commit`'s own
conflict park (`graph-commit:900`), or to `graph-census-debt.ts`.

**Recommended model:** opus — git compare-and-swap, two-file atomic landing,
and a rollback trap covering a create-and-an-edit; a subtle bug here is
expensive.

**Dependencies:** Unit 1.

### Unit 3 — Producer 1: free-retry tier, then a tracked hold, in `dispatch-graph-execute`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`,
`case 11` at `:197-204` and `case 0` at `:172-186`.

Replace the `$PARK_NODE` call at `:199-204` with a two-tier disposition:

- Define a baked-in `CONFLICT_STRIKE_CAP=5` near the top of the script,
  alongside a comment explaining it is a constant, not a `dispatch.config`
  tunable (parity with `FIX_ATTEMPT_CAP` at `transitions.ts:101`). 5, not 3:
  ticks are frequent, and the point is to spend cheap ticks rather than
  records.
- **Strike counter with no graph write.** Sidecar file
  `$PROJECT_ROOT/.claude/worktrees/$id.conflict-strikes` holding an integer,
  following the existing worktree-adjacent sidecar convention
  (`provision-node-worktree:81-83`'s `.scope-fingerprint`: outside every
  checkout, so it never dirties a tree). A retry costs **zero graph writes
  and zero commits** — this is the change that actually removes the queue
  noise. The state is deliberately local and fail-open: a lost counter
  (daemon restart, reaped worktree) just grants more free retries, which is
  harmless.
- `case 11` with `strikes < CAP`: increment the sidecar, `reservation_clear
  "$id"`, emit `conflict-retry $id (strike N/CAP)`, make **no** graph write.
  Mirror `case 12`'s clear-and-yield shape (`:207-211`).
- `case 11` with `strikes >= CAP`: call `hold-node "$id" --kind
  provision-conflict --reason-file … --recommendation-file …`. Reason:
  `origin/main has not merged clean into this tactic's branch for N
  consecutive ticks (provision exit 11)`. Recommendation: resolve the
  conflict by hand in `.claude/worktrees/<source-id>`, push the branch, then
  resolve **this hold tactic** to `phase: done` and prune it — plus the
  mandatory "clearing `office_hours` alone does not unblock the source"
  sentence. On success emit `held $id`; on failure emit `failed $id
  hold-failed` and bump `FAILURES` (identical shape to today's `park-failed`
  branch at `:203-206`). Reset the strike file after a successful hold.
- `case 0`: delete the strike sidecar on a successful provision (the
  conflict is resolved). This reset is what makes the counter mean
  "consecutive".
- Update the `case 11` comment block at `:198-201` to record the convergence
  note: this strike/hold branch is the interim step and is **replaced** by
  the `execution.conflict` interrupt when `tactic-graph-router-conflict-routing`
  lands, at which point that cap calls the same `hold-node` primitive.
- Update `provision-node-worktree`'s header prose where it asserts the
  caller's disposition — `:26-29` ("The caller routes /dispatch-conflict …
  or parks the node") and `:13-14`. Doc-only; **do not change any exit code
  or behavior in that script.**

Extend `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`
(stubs `park-node`/`demote-node-to-implement` under `$PKG_DIR` at `:79-91`,
drives `PROV_RC`/`PARK_RC` at `:18`). Add a `hold-node` stub with a
`HOLD_LOG`/`HOLD_RC` alongside them. Rewrite Case 5 (`:177-184`) and Case 10
(`:227-232`), and add: exit 11 below cap emits `conflict-retry` with an
**empty** `PARK_LOG` and **empty** `HOLD_LOG`; strikes accumulate across
repeated exit-11 runs; the cap-th run calls `hold-node` with `--kind
provision-conflict`; `HOLD_RC=1` yields `failed <id> hold-failed` and exit 1;
exit 0 clears the strike file. Case 8 (`:209-216`, the default catch-all park
at `:224-230`) must remain **unchanged and still asserting `park-node`** —
the environment/infra park is explicitly out of scope.

**Out of scope, do not touch:** the default catch-all case; `graph-commit`'s
concurrent-edit park (`graph-commit:900`) and `/dispatch-conflict` Lane 2;
`graph-census-debt.ts`'s census park.

**Recommended model:** sonnet — mechanical wiring into an existing,
well-stubbed test harness, with the design decisions already fixed by Units
1-2 and this plan.

**Dependencies:** Unit 2.

### Unit 4 — Producer 2a: split `--park-if-capped` into a pure check and a write-only reset

**Scope.** `packages/intentionsutil/scripts/apply-fix-state.ts`. Delete
`applyParkCheck` (`:259-285`) and the `--park-if-capped` mode, replacing it
with two modes, and update the header mode table at `:44-53` and the usage
string at `:56-58`.

- `--check-cap` — **pure, writes nothing.** Returns `{ mode: "check-cap", id,
  capped: boolean, consumed: number, attempt: number }` where `consumed =
  fix.attempt - 1`. Errors when no interrupt is set (parity with today's
  `requireFix` behavior at `:264`).
- `--reset-attempt` — **write-only.** Sets `execution.fix.attempt = 1`,
  preserving `since`/`pushed_sha` and the ladder `phase`. Returns `{ mode:
  "reset-attempt", id, wrote: true, attempt: 1 }`. Errors when no interrupt
  is set.

This split exists because `apply-fix-state.ts` is documented as pure of
git/gh (`:1-9`) — it may not call `graph-commit`, so it cannot land a hold.
The decision must be readable without a write (the caller decides), and the
reset must be applicable *after* `hold-node`'s fresh-main refresh (Unit 2
step 5) or it would be clobbered. Keep the `office_hours` reason and
recommendation prose from `:271-282` — do not delete it; **move it** into
Unit 2's caller-supplied reason/recommendation files in Unit 5, adapted so
it names the hold tactic's resolution procedure instead of "clear
office_hours on this node".

Update `packages/intentionsutil/test/apply-fix-state.test.ts`: rewrite
`:165-181` (at/below cap) and `:182-203` (above cap) against `--check-cap`,
asserting the crucial new invariant — **`node.office_hours` stays `null` and
the node file is not written at all**. Rewrite the end-to-end test at
`:212-233` as set-fix → three spends → `--check-cap` reports `capped: true,
consumed: 3` with no write → `--reset-attempt` sets `attempt: 1` and still
leaves `office_hours` null. Update the `parseArgs` cases at `:257-274` for
the two new flags and their mutual exclusion with the other modes.

**Recommended model:** sonnet — a well-specified mode split with explicitly
enumerated test cases.

**Dependencies:** none (parallel with Units 1-3; but Unit 5 needs both this
and Unit 2).

### Unit 5 — Producer 2b: wire `graph-select-target` to `hold-node`

**Scope.** `.claude/skills/dispatch-propagate/scripts/graph-select-target`,
the failing-again branch of `_gate_fix_active` at `:306-320`, plus the
header comment at `:32`.

Replace the `--park-if-capped` + `_graph_commit_fix` sequence with:

1. `out=$(_apply_fix "$id" --check-cap)`; on `capped != true`, `echo "fix";
   return 0` (unchanged retry path).
2. On `capped == true`, build the reason and recommendation files
   (multi-line, so files not argv), carrying the diagnosis text moved from
   `apply-fix-state.ts:271-282`: attempts consumed, PR number from
   `execution.pr`, `execution.fix.since`, `FIX_ATTEMPT_CAP`. The
   recommendation names the hold tactic's resolution procedure (`phase:
   done` + prune), **not** "clear office_hours on this node".
3. **Reuse the existing accumulator as the hold body rather than re-deriving
   a diagnosis.** `/fix-checks` writes `tmp/fix-checks-summary.md` in the
   node's worktree as its only cross-iteration memory
   (`.claude/skills/fix-checks/SKILL.md:17,31,716`) and posts it as PR
   comments (`:285,686`). `graph-select-target` runs from the main checkout,
   so the path is `$PROJECT_ROOT/.claude/worktrees/<id>/tmp/fix-checks-summary.md`.
   Pass it as `--body-file` **when it exists**; when it does not (worktree
   reaped), omit the flag and let Unit 1's constructed body stand alone. Do
   not fabricate a fallback file.
4. `hold-node "$id" --kind fix-attempt-cap --reason-file …
   --recommendation-file … [--body-file …] --reset-fix-attempt`. On success
   `echo "fix-attempt-cap-held"; return 1`; on failure `echo
   "fix-cap-hold-failed"; return 1` (same shape as the existing `:315-318`
   failure branch).
5. Update `:32`'s header prose and the inline comment at `:307-311`, which
   currently states "`--park-if-capped` writes office_hours (+ budget reset)
   and this node leaves the eligible set". It now leaves the eligible set via
   a `blocked_by` edge.

Also sweep for stale prose asserting these two paths park: `park-node`'s
header line naming "an unroutable merge conflict" among its use cases
(`park-node:4-6`), and any `/fix-checks` or office-hours SKILL prose
describing the cap escalation as a park on the source node. Prose only — no
behavior change to `park-node`.

**Recommended model:** sonnet — rote wiring in bash against an interface
Units 2 and 4 fully define.

**Dependencies:** Units 2 and 4.

## Reuse

- **The flake pattern's scripts are NOT directly reusable, and this plan
  deliberately does not extend them.**
  `.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup-node`
  dedups by a **content fingerprint** (a literal `Fingerprint: <fp>` grep
  over `intentions/tactic-*.md`) and is a search-only tool whose actual node
  writes are performed by an LLM executing `.claude/skills/fix-checks/SKILL.md`'s
  node lane. Both producers here are non-LLM code paths inside the tick
  (bash and TypeScript), and their find key is *structural*
  (`hold_for = <source-id>`, expressible as a deterministic id), not
  content-derived. What IS reused from that pattern is its **shape and write
  mechanics**, verbatim: find-or-create with `NONE`/`EXISTING`/`REOPENED`
  dispositions; `serves` copied verbatim from the source; the tracked node is
  the *blocker* and the source is the *blocked* one; base capture +
  `write-node.ts` + `graph-commit --base`; **never `transition-node`**; no
  `office_hours` on the source anywhere in the flow.
- **`packages/intentionsutil/scripts/graph-census-debt.ts` +
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census`** — the
  decision/land split, born-parked node construction (`:164-172`), body
  construction style (`:180-205`), placeholder-body replacement recipe
  (`dispatch-graph-census:130-150`), and inverted absent-node probe +
  rollback trap (`:96-125`). Unit 1-2's primary template.
- **`packages/intentionsutil/scripts/park-node`** — the fresh-`origin/main`
  refresh invariant, `--base` compare-and-swap capture, and blob-pinned
  rollback trap (`:60-100`). Reused wholesale by `hold-node`; `park-node`
  itself is left untouched, still serving the three out-of-scope park
  producers.
- **`packages/intentionsutil/scripts/graph-commit`** — multi-id landing and
  repeatable `--base` (`:32,37-41`), which is what makes "clears in the same
  graph-commit" literally true. Prune-time inbound-`blocked_by` repair is
  what cleans the source's array when a resolved hold is pruned.
- **`packages/intentionsutil/src/router.ts:162-168`** (`blockersComplete`) —
  the unblock mechanism. No new router code: the source is re-admitted
  automatically once the hold reaches `done` or is pruned.
- **`packages/intentionsutil/src/officeHours.ts`** — the office-hours
  selector already lists any node with `office_hours !== null` regardless of
  `phase`. Born-parked hold tactics surface in the queue with no selector
  change.
- **`packages/intentionsutil/scripts/write-node.ts`** — the single
  validation gate; every hold node passes through it.
- **`tmp/fix-checks-summary.md`** — Producer 2's diagnosis body, reused
  rather than re-derived.
- **Test harnesses reused rather than recreated:**
  `packages/intentionsutil/test/graph-census-debt.test.ts` (Unit 1's model),
  `packages/intentionsutil/scripts/test-park-node.sh` (Unit 2's model), and
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`'s
  existing stub/`*_RC` harness (Unit 3).
- **`hold-node` is the one new shared primitive**, shared three ways: both
  producers here, plus `tactic-router-failure-fuses`' per-node fuse
  (`--kind no-progress`, vocabulary reserved in Unit 1).

## Verification

```verify
npx vitest run --project packages/intentionsutil --root . || exit 1
npx tsc --noEmit -p packages/intentionsutil || exit 1
bash packages/intentionsutil/scripts/test-hold-node.sh || exit 1
bash packages/intentionsutil/scripts/test-park-node.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

```verify
# Doctrine regression guard: no producer converted by this tactic may still
# write office_hours. Each grep must find NOTHING.
if grep -n 'PARK_NODE' .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute | grep -n '11)'; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute"; exit 1; fi
if grep -n 'office_hours' packages/intentionsutil/scripts/apply-fix-state.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/scripts/apply-fix-state.ts"; exit 1; fi
if grep -n 'park-if-capped\|park-node' .claude/skills/dispatch-propagate/scripts/graph-select-target; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/graph-select-target"; exit 1; fi
# The three out-of-scope park producers must still park:
grep -q 'PARK_NODE' .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute || exit 1
grep -q 'office_hours' packages/intentionsutil/scripts/graph-census-debt.ts || exit 1
grep -q 'office_hours' packages/intentionsutil/scripts/graph-commit
```

Manual and observational checks:

- **End-to-end hold, on a scratch clone only.** Seed a synthetic source
  tactic and run `hold-node <source> --kind provision-conflict …`. Inspect
  the resulting commit: it must touch exactly two files, the source's
  `office_hours` must still be `null`, its `blocked_by` must contain the
  hold id exactly once, and the hold node must be born-parked with `serves`
  byte-identical to the source's. Re-run the identical command and confirm
  the second run appends an occurrence stanza without duplicating the
  `blocked_by` entry.
- **Unblock semantics.** With the hold in place, confirm `graph-select-target`
  does not select the source. Set the hold tactic to `phase: done` and
  confirm the source is selected on the very next tick with no write having
  been made to the source node. This is the doctrine's central claim and the
  one behavior no unit test covers end to end.
- **The stuck-state trap.** Confirm that clearing the hold tactic's
  `office_hours` *without* setting `phase: done` leaves the source blocked —
  and that the hold node's own recommendation text says so explicitly.
- **Queue-noise outcome (observe on main over the following week).** The
  success signal for this tactic is that transient exit-11 conflicts produce
  **no graph record at all** — zero `tactic-hold-conflict-*` entries in a
  week where main is moving normally, versus ~5 exit-11 parks per equivalent
  window at recording time. A `tactic-hold-conflict-*` node appearing is the
  intended signal for a genuine structural conflict, and warrants checking
  whether `CONFLICT_STRIKE_CAP=5` is tuned too tight.
- **Strike-file hygiene.** Confirm the sidecar is deleted on a successful
  provision and does not accumulate for reaped worktrees.

## needs-main residue

QA (PR #2970, attempt 1) found one item that is not assertable at merge time
and is deferred to `/qa-main` observation on deployed main:

- **id:** 15
- **title:** Queue-noise reduction: fewer tracked holds than today's exit-11 park rate
- **url_path:** current
- **expected_outcome:** Materially fewer `tactic-hold-conflict-*` / `tactic-hold-fix-cap-*`
  records than the baseline of roughly 5 exit-11 parks per week, observed on
  main over the following week (the plan's own Verification section names
  this as a planned deferral, not gatable pre-merge).
- **finding:** This is an observe-on-main-over-time signal. Check the rate at
  which `tactic-hold-*` nodes are created on `origin/main` over the week
  following merge, and confirm holds that do land correspond to genuinely
  stuck conflicts/fix-cap exhaustions rather than routine noise.

## Office-hours sitting 2026-08-09 — residue item 15 resolved, no code change

**Disposition: the hold-creation rate is acceptable; the fix worked.** Author
ruling at the 2026-08-09 sitting. `phase: done`, park cleared.

The park (2026-08-05) could not be judged because its only counter-evidence was
that the fleet had not been running. That confound is now gone and the
measurement was re-taken against `origin/main` at the sitting:

| | park (08-05) | sitting (08-09) |
|---|---|---|
| holds total | 12 (6 conflict, 6 fix-cap) | 16 (9 conflict, 7 fix-cap) |
| resolved `phase: done` | 0 | 10 |
| still open | 12 | 6 |
| created since 08-05 | — | 4, all on 08-09 |

The decisive fact is the resolution column, not the creation column. The park
recorded 12 holds with **none** resolved, which is what made the producer look
like pure queue noise. Ten have since drained. The mechanism produces holds that
get resolved, which is the intended behaviour — a hold is a routing artifact,
not a defect.

Creation timeline: 08-06, 08-07 and 08-08 produced zero holds (the pace curve
was closed and no work ran); 08-09 produced 4 in roughly six active hours. Two
of those four are on #2974 and #3023 — the conflict backlog that was expected to
drain once the curve reopened; it was picked up, and both hit provision-conflict
immediately.

**Residual confound, recorded honestly and NOT resolved by this disposition.**
The free-retry tier (`CONFLICT_STRIKE_CAP=5`) means a self-resolved conflict
leaves zero graph record. So every number above counts holds *created*, never
conflicts *encountered* — the raw exit-11 incidence rate this fix was built to
filter remains unobservable from git history. A future judgment on whether the
cap is tuned correctly needs an instrument that records conflicts below the cap;
none exists today, and the sitting did not file one.
