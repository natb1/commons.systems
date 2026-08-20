---
id: tactic-eval-finding-ladder-ci-wait-swallows-blocked-node
kind: tactic
statement: graph-select-target collapses blocked/parked/done/absent/reviewed
  into one empty answer with the reason only in stderr prose, so
  dispatch-ladder-run classifies a permanently blocked node as the honest
  silence ci-wait and re-polls it for the full --ci-wait-s hour before halting
  idle — the word blocked never appears in the journal, events.jsonl or status
  output
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: phases_launched
      value: 0
      unit: count
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: ci_wait_burned_before_manual_stop_s
      value: 420
      unit: seconds
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: ci_wait_budget_that_would_have_burned_s
      value: 3600
      unit: seconds
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: dispatch-ladder-run --ci-wait-s default
      measured: 2026-08-14
    - metric: reconcile_passes_with_no_progress
      value: 8
      unit: count
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: events.jsonl + graph-select-target --node
      measured: 2026-08-14
---
# A blocked node is indistinguishable from pending CI to the ladder driver

`/dispatch-ladder tactic-attention-unified-relation-cycle-rule` ran for 8
minutes and 8 reconcile passes without ever launching a phase, and would have
run the full `--ci-wait-s` hour before halting exit 10 `idle`. The node was
never launchable: it carries `blocked_by: [tactic-attention-namespaced-rank]`,
and the blocker sits at phase `main-qa`. No amount of waiting could change
that — nothing the driver does advances another node.

## Context

### The mechanism (re-verified against the working tree 2026-08-18)

`graph-select-target --node <id>` collapses every structurally different
"not a candidate" answer into one stdout token `empty`, with the reason emitted
only as English prose on stderr
(`.claude/skills/dispatch-propagate/scripts/graph-select-target:1272-1279`):

```
graph-select-target: node <id> is not selectable
(not found, done, parked, blocked, or already reviewed — inspect
intentions/<id>.md directly for the reason)
```

`dispatch-ladder-advance:224-230` sees no `^node <id> ` line in that stdout and
prints the single fixed token `idle $NODE_ID not-selectable`, exit 10.
`dispatch-ladder-run:1471-1524` maps that reason into the default `*)` arm,
which runs `phase_is_done` (`:809-819`), then `reconcile_pass`, then — on a
quiet pass — logs `idle <QUIET_REASON>` and accrues `ci_waited` against
`CI_WAIT_S` (default 3600s) before halting `10 idle` at `:1518-1522`.

"The PR's CI is still running" and "this node is blocked by an unfinished node"
are not the same kind of silence. The first resolves on its own inside the
window; the second provably cannot. The `ci-wait` disposition is therefore
load-bearing and wrong here: every event line the run wrote says `ci-wait`, so
`events.jsonl` — the record `/rsi` reads — attributes an hour of wall clock to
CI latency that was actually a permanent structural block.

### Why the driver cannot currently tell

The distinction exists one layer down and is discarded at a stdout boundary.
`packages/intentionsutil/src/router.ts:402-406` drops a tactic with an
incomplete `blocked_by` edge with a bare `continue` and pushes **no**
`SelectionEvent` (unlike the freeze case at `:383-388`, which does). So the
node never reaches `graph-select-target`'s per-candidate loop at all —
`NODE_PRESENT` stays `0` (`:1162-1165`) — and the generic prose at `:1274` is
genuinely the only trace at the shell layer. The driver has no machine-readable
reason code to branch on, and correctly refuses to re-derive eligibility itself
(`dispatch-ladder-run:13-40`, "IT SEQUENCES; IT NEVER GATES").

### What the operator sees today

Nothing actionable. The journal repeats `merge - no-merge`, `absorb - noop`,
`idle - ci-wait` once a minute. The word `blocked` appears nowhere in the
journal, in `events.jsonl`, or in `dispatch-ladder-status` output. Diagnosing it
took a hand-run of `graph-select-target --node` plus reading the node's
frontmatter at `origin/main` — exactly the manual inspection the selector's own
error string tells you to go do, from a detached driver with nobody attached to
read it.

### The design: fix the reporting contract, add no gate

**Greenfield.** The selector already computes the reason — it is the predicate
that dropped the node — and throws it away. So the reason becomes part of the
selection contract, end to end, in one closed vocabulary:

1. `selectGraphTargets` gains an **explain** mode: asked about one id, it
   reports which guard excluded it, computed by the *same* predicates the
   candidate loops use.
2. `graph-select-target --node <id>` prints `empty <reason> [<detail>]` instead
   of bare `empty`. Fleet mode (`--top`) is untouched and still prints bare
   `empty`.
3. `dispatch-ladder-advance` passes the reason through as
   `idle <id> <reason> [<detail>]` — a shape its own header already documents —
   and splits its exit code: **10** for a reason that can resolve by waiting,
   **18** for one that provably cannot.
4. `dispatch-ladder-run` halts immediately on 18, with the reason as the event
   `disposition`, so `blocked` reaches `events.jsonl`, `state.json` and
   `dispatch-ladder-status`.

No new eligibility rule appears anywhere. The driver still branches on an exit
code a primitive handed it; the terminal/waitable judgement lives in `advance`,
which already owns the selector-answer → exit-code mapping. This is a reporting
change on four files plus the ledger of tests.

There is no brownfield migration to stage: `empty` is consumed by exactly two
production callers (`dispatch-ladder-advance:216`,
`dispatch-select-tick:1115`), and both parse `^node <id> ` lines rather than
comparing against the literal string, so the suffix is backward compatible on
day one. Unknown or missing tokens fall back to today's exact behaviour.

### The reason vocabulary (closed)

Router-side (the node produced no candidate at all):

| token | condition | anchor |
| --- | --- | --- |
| `absent` | id not in the store snapshot | — |
| `parked` | `office_hours !== null` | `router.ts:403`, `:445`, `:475` |
| `blocked` | an incomplete `blocked_by` edge | `router.ts:406`, `:446` |
| `done` | `phase === "done"` | `router.ts:144-146` |
| `subtree-parent` | a draft that is another tactic's `parent` | `router.ts:396-399`, `:447` |
| `children-open` | open child on the signal path | `router.ts:495` |
| `signal-validated` | `!isSignalUnvalidated(s)` | `router.ts:498` |
| `rounds-cap` | `rounds.count >= 2` | `router.ts:504-510` |
| `stale-reading` | no reading newer than `rounds.last_aligned` | `router.ts:513-533` |
| `ineligible` | fallback; must be unreachable for tactics | — |

No token may start with a node-kind prefix (`strategy-`, `tactic-`, `virtue-`,
`kind-`). The two strategy-arm tokens were drafted with a strategy- prefix
(strategy-children-open, strategy-signal-validated — deliberately unquoted
here) and are renamed above for that reason:
`validateGraphProseRefs` (`packages/intentionsutil/src/schema.ts:1628-1678`)
reads any backtick-quoted, id-shaped token in a node body as a reference to a
node id, so the drafted names made this very body fail
`validate-graph.ts` and blocked the round from landing. Implement the
renamed tokens; do not restore the prefixed forms.

Shell-side (the node *was* a candidate and an environmental gate skipped it) —
these tokens already exist as `skip_note` reasons and are reused verbatim, not
invented: `reserved` (`graph-select-target:1177`), `terminal-session`
(`:1201`), `live-session` (`:1212`), and every `sensor_gate` skip token
(`:1227`, e.g. `ci-pending`, `no-pr`, `pr-not-merged`, `mergeable-clean`,
`pr-merged-awaiting-reconcile`).

`reviewed` is **not** in the vocabulary. The selector's prose still lists
"already reviewed", but `router.ts:407-420` records that the reviewed-marker
exclusion was deliberately removed — a reviewed node surfaces as a
`pending-merge` candidate. That clause in the message is stale and is deleted
by Unit 2.

### Terminal vs waitable

`advance` maps `absent`, `parked`, `blocked`, `done`, `subtree-parent`,
`children-open`, `signal-validated`, `rounds-cap` and
`stale-reading` to **exit 18**. Everything else — every gate token, every
unrecognised or missing token — stays **exit 10** and keeps today's
reconcile-then-ci-wait behaviour verbatim. The fail-open direction is
deliberate: a future selector token that this table has never seen must never
cause a wrong immediate halt.

### Known sequencing hazard — read this first

`tactic-dispatch-ladder-exit-code-space` is at phase `implement` right now and
rewrites the *same* `case "$adv_rc"` statement: it carves `advance` exit 10 into
`15` (idle-wait), `16` (idle-requeue) and `17` (await complete), keeping `10` as
the open-ended catch-all, and in a later unit deletes the driver's inner
`case "$REASON"`. Its plan names this node explicitly as the owner of the
selector's under-differentiation and does **not** touch it.

`18` is free in both worlds (the union of taken codes across the three scripts
is 0,1,2,3,10,11,12,13,14,15,16,17,20,21; 4, 7 and 9 are reserved by that
node's analysis), so this plan works either way. **Before editing
`dispatch-ladder-run`, `grep -n '^        15)' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`:**

- **no match** — the sibling has not landed. Insert the new `18)` arm
  immediately before the existing `10)` arm at `:1471`.
- **match** — the sibling has landed. Insert `18)` alongside `15)` / `16)` /
  `17)`, and take the `phase_is_done`-then-reconcile body from wherever the
  `10)` arm then lives.

Either way: do not renumber, re-merge or re-split any code the sibling owns, and
do not touch `phase_is_done` (`:809-819`), `classify_terminus` (`:821-889`) or
`halt()` (`:708-733`).

### Adjacent observation, not filed separately

The run also emitted a `main-conflict-prediction` advisory (clean → conflict)
for a node whose branch will not be merged for as long as it stays blocked. The
advisory is explicitly non-gating and did no harm; it is noted only because it
is more evidence the driver had no idea the node was parked behind another.

---

## Unit 1 — `selectGraphTargets` explains why one id is not a candidate

**Scope**

- `packages/intentionsutil/src/router.ts`:
  - Add and export `incompleteBlockers(tactic, byId): string[]` beside
    `blockersComplete` (`:239-245`), returning the ids of blockers that are
    present in `byId` and not `phase: "done"`. Redefine `blockersComplete` as
    `incompleteBlockers(t, byId).length === 0` so there is **one**
    implementation and the absent-blocker-is-complete fail-open semantics its
    doc comment (`:215-238`) argues for are preserved exactly. Do not change
    that doc comment's claims; extend it to name the new helper.
  - Add `export interface NodeExclusion { id: string; reason: string; detail: string }`
    beside `SelectionEvent` (`:71-77`), with `reason` documented as the closed
    vocabulary in this plan's Context table and `detail` as an optional
    comma-joined id list (empty string when there is none).
  - Add `exclusion?: NodeExclusion | null` to `GraphSelection` (`:78-88`),
    documented as populated **only** when the caller passed an explain id and
    that id produced no candidate.
  - Widen the signature at `:331` to
    `selectGraphTargets(nodes, options?: { explain?: string }): GraphSelection`.
    The parameter is optional, so `check-node-selection`, `frozenTacticSelectable`,
    `strategyAlignSelectable` and every other existing caller compile unchanged.
  - Add a private `explainExclusion(id, ctx)` computed **after** the candidate
    loops and only when `options.explain` is set and no candidate carries that
    id. Order of checks, first match wins: not in `byId` → `absent`;
    `office_hours !== null` → `parked`; `incompleteBlockers().length > 0` →
    `blocked` with `detail` = the joined blocker ids; tactic with
    `phase === "done"` → `done`; draft tactic in `subtreeParentIds` →
    `subtree-parent`; strategy arms mirroring `:495` / `:498` / `:504` / `:513-533`
    → `children-open` / `signal-validated` / `rounds-cap` /
    `stale-reading`; otherwise `ineligible`. Reuse the same `byId`, `onPath`,
    `childrenOf`, `subtreeParentIds`, `frozenTacticIds` and `isSignalUnvalidated`
    values the loops already computed — do not recompute any of them.
  - Return `{ candidates, events, exclusion }` at `:553`; `exclusion` is
    `undefined` when no explain id was passed, and `null` when the explain id
    IS among the candidates.
- `packages/intentionsutil/scripts/select-targets.ts`: accept
  `--explain <node-id>` in the arg loop (`:44-58`, same shape as `--dir`,
  rejecting a missing value), pass it as `{ explain }` to `selectGraphTargets`,
  and document the flag in the usage header (`:11-13`). Unknown args must keep
  throwing.
- `packages/intentionsutil/test/router.test.ts`, using the existing `tactic()`
  / `strategy()` / `anode()` fixtures (`:14-56`):
  - one case per vocabulary token above, asserting `exclusion.reason` and, for
    `blocked`, that `exclusion.detail` names the incomplete blocker id and not
    a `done` or absent one;
  - `exclusion === null` when the explain id is a selectable candidate;
  - `exclusion === undefined` when no explain id is passed;
  - **the anti-drift invariant**: over a synthetic store mixing every fixture
    shape used above, assert for every node id that
    `explain(id).exclusion == null` **iff** that id appears in
    `candidates`. This is what keeps the explainer from drifting away from the
    loops it mirrors; write it as a loop over the fixture store, not as a
    hand-listed set.

Out of scope: any change to which nodes are candidates, to ordering, to
`SelectionEvent`, or to `terminus.ts` (`classifyTerminus` shares
`blockersComplete` and must keep compiling untouched — its doc comment at
`:46-56` explains why the sharing is safe and stays accurate).

**Recommended model** — opus.

## Unit 2 — `graph-select-target --node` prints `empty <reason> [<detail>]`

**Scope**

- `.claude/skills/dispatch-propagate/scripts/graph-select-target`:
  - `:486-488` — pass `--explain "$NODE_TARGET"` to `select-targets.ts` when
    `NODE_TARGET` is non-empty, and nothing otherwise. Build the argument list
    so an empty `NODE_TARGET` adds no stray argument (the script's own
    `--dir`/`--top` handling nearby is the model; a bash array is fine).
  - `:1272-1279` — replace the single prose sentence and the bare `echo "empty"`
    with a reason-carrying answer, **for `--node` mode only**:
    - `NODE_PRESENT == 0`: read `.exclusion.reason` / `.exclusion.detail` from
      `$SELECTION` with `jq` (here-string, never `echo` — `.claude/rules/shell-json.md`),
      defaulting to `ineligible` / empty when the field is missing.
    - `NODE_PRESENT == 1`: the node was a candidate and a gate skipped it —
      take the reason from `SKIPPED_JSON` (`skip_note`, `:503-506`) with
      `jq -r --arg id "$NODE_TARGET" 'map(select(.id==$id)) | last | .reason // empty'`,
      defaulting to `gated`.
    - Print `empty <reason>` on stdout, or `empty <reason> <detail>` when
      `detail` is non-empty. `<reason>` and `<detail>` must contain no spaces —
      the joined blocker list uses commas.
    - Keep a human sentence on stderr, now naming the reason and the detail
      instead of the five-way "not found, done, parked, blocked, or already
      reviewed" list, and **drop the stale `already reviewed` clause** (see
      Context). Keep pointing the reader at `intentions/<id>.md`.
    - Set `DISPOSITION` to the reason token rather than the fixed `not-found` /
      `empty`, so the selection decision log carries it too.
  - Fleet mode (`NODE_TARGET` empty) still prints bare `empty` — assert this in
    the tests; `dispatch-select-tick`'s `--top` lane must see no change.
  - Update the script's own stdout-protocol header comment to document
    `empty <reason> [<detail>]` as the `--node` answer and the closed
    vocabulary.
- `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`:
  - Make the GSN fake `npx` (`:174-180`) `cat` a rewritable payload file
    (`$GSN_ROOT/npx-payload.json`), exactly as the fake `claude` stub at
    `:195-201` already does, and have `gsn_reset` (`:225-229`) restore the
    default one-candidate payload. This is what lets a case simulate a router
    exclusion without running the real selector.
  - Case 2 (`:241-251`): expected stdout becomes `empty absent`, with the
    stderr assertion updated to the new sentence via `assert_contains_local`.
  - Case 3 (`:253-263`): stdout becomes `empty reserved`.
  - Case 4 (`:265-276`): stdout becomes `empty live-session`.
  - New cases driven by the payload file, asserting stdout exactly:
    `empty blocked tactic-blocker-id` (exclusion with a detail),
    `empty parked`, `empty done`, and one unrecognised-shape payload (no
    `exclusion` key at all) still yielding `empty ineligible` and exit 0.
  - New case: fleet mode (no `--node`) with an empty candidate list still prints
    bare `empty`, pinning that this change is `--node`-scoped.

Out of scope: `dispatch-select-tick`'s consumption (Unit 5), the sensor gates
themselves, and `--standalone` / `--top` / `--pace-exempt-only` behaviour.

**Recommended model** — sonnet.

**Dependencies** — Unit 1.

## Unit 3 — `dispatch-ladder-advance` carries the reason and splits exit 18

**Scope**

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance`:
  - `:224-230` — when no `^node <id> ` line is present, parse the answer:
    read fields 2 and 3 of the `^empty ` line from `$SELECTION` as
    `SEL_REASON` / `SEL_DETAIL`, defaulting `SEL_REASON` to `not-selectable`
    when absent (a pre-change selector, or a bare `empty`). Print
    `idle $NODE_ID $SEL_REASON` — with ` $SEL_DETAIL` appended when non-empty —
    and exit **18** when `SEL_REASON` is in the terminal set
    (`absent parked blocked done subtree-parent children-open
    signal-validated rounds-cap stale-reading`), **10** otherwise.
    Keep the existing stderr sentence, rewritten to name the reason.
  - Header stdout block (`:64-90`): document `idle <id> <reason> [<detail>]`
    and the closed vocabulary, noting `<detail>` is presently only the
    comma-joined incomplete blocker ids for `blocked`.
  - Header `Exit codes:` block (`:91-113`): add
    `18  idle-terminal: the node cannot become selectable by waiting — the
    stdout reason says which`, and restate 10 as the waitable/catch-all case.
    State the governing rule this follows — a distinct exit code iff the caller
    takes a distinct action — and that the terminal/waitable split lives HERE
    rather than in the driver, so the driver keeps branching on codes only.
  - `:432-443` (`ci-waiting` / `stale-selection` / `scope-stale-demoted`) are
    **not** touched by this unit; they belong to
    `tactic-dispatch-ladder-exit-code-space`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh`,
  using `run_case` (`:164-188`, prefix-matches stdout) with the select-line
  written into `$SELECT_OUT`:
  - `empty blocked tactic-blocker` → exit 18, stdout
    `idle tactic-fixture-node blocked tactic-blocker`;
  - `empty parked` → exit 18, stdout `idle tactic-fixture-node parked`;
  - `empty ci-pending` → exit **10**, stdout `idle tactic-fixture-node ci-pending`;
  - bare `empty` (a selector that has not been updated) → exit **10**, stdout
    `idle tactic-fixture-node not-selectable` — the backward-compatibility pin;
  - `empty some-token-nobody-has-seen` → exit **10** — the fail-open pin.

Out of scope: `dispatch-ladder-run`, `dispatch-ladder-await`, `SKILL.md`.

**Recommended model** — sonnet.

**Dependencies** — Unit 2 (the token it parses).

## Unit 4 — the driver halts on a terminal reason instead of burning the CI budget

**Scope**

Read the *Known sequencing hazard* section above before editing
`dispatch-ladder-run`; it decides where the new arm goes.

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`:
  - New `18)` arm in the `case "$adv_rc"` statement (`:1340-1543`):
    - parse `REASON=$(awk '{print $3; exit}' <<<"$ADV_OUT")` and
      `REASON_DETAIL=$(awk '{print $4; exit}' <<<"$ADV_OUT")`;
    - `if phase_is_done; then halt 0 complete "$NODE_ID is at phase 'done' at origin/main"; fi`
      first, unchanged and for the unchanged reason — `verify-landed` is the one
      landing signal and a selector token is not evidence a transition landed;
    - then `case "$REASON"`:
      - `blocked)` → `halt 11 blocked "blocked_by ${REASON_DETAIL:-unknown} is not done — no amount of ci-wait polling can advance another node; run /dispatch-ladder on the blocker, or clear the edge"`;
      - `parked)` → `halt 11 parked "office_hours is set on $NODE_ID — run /office-hours $NODE_ID; the ladder never clears a park"`;
      - `absent)` → `halt 10 absent "$NODE_ID is not present at origin/main; the terminus field says whether it was pruned or never existed"`;
      - `*)` → `halt 10 "$REASON" "nothing to launch for $NODE_ID and waiting cannot change it (advance reason: $REASON${REASON_DETAIL:+ $REASON_DETAIL})"`;
    - the arm must **not** call `reconcile_pass` and must **not** touch
      `ci_waited` — halting on the first pass is the whole point.
  - `11` for `blocked` / `parked` is deliberate and already documented: the
    SKILL's exit-11 row names "Parked, blocked-by" as attended-engagement
    cases. Everything else terminal stays inside the exit-10 idle family with
    its own disposition, so no new caller-visible exit code is introduced.
  - `halt()` (`:708-733`), `write_state` (`:521-545`) and `log_event`
    (`:559-568`) are reused **unchanged** — the disposition string is what
    carries the word `blocked` into `events.jsonl`, `state.json` and
    `dispatch-ladder-status`.
  - Header EXIT CODES block (`:270-296`): note that 10's disposition is now the
    selector's reason token when the driver halted immediately, and that 11
    covers a selection-time park or block. Header `WHY EXIT 10 IS SPLIT BY
    REASON` (`:112-116`): add that a reason which cannot resolve by waiting now
    arrives as advance's own exit 18 and halts on the first pass.
- `.claude/skills/dispatch-ladder/SKILL.md`:
  - Halt-dispositions table (`:296-310`): amend the `10` row to say the
    disposition names the selector's reason (`absent`, a gate token, …) when the
    driver halted immediately rather than on the budget; amend the `11` row to
    say a park or a `blocked_by` edge observed **at selection time** now halts
    on the first pass with disposition `parked` / `blocked`, and that the
    remedy for `blocked` is to run the ladder on the blocker.
  - "Stepping one phase by hand" (`:325-340`): document `advance` exit 18.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`, using
  `reset_seqs` (`:254`), `set_seq` (`:188`), `run_ladder` (`:278`), `calls`
  (`:196`) and `events_have` (`:284`):
  - `set_seq advance '18|idle tactic-fixture-node blocked tactic-blocker'` →
    `$RC == 11`; `calls advance == 1`; `calls merge == 0` (no reconcile pass
    ran); and — the assertion this whole node exists for — the halt event's
    detail names the blocker, following the established idiom at `:882-899`:
    `jq -r 'select(.event=="halt") | .detail' "$STATE_DIR/events.jsonl" | grep -q 'tactic-blocker'`,
    plus `events_have halt blocked == 1`;
  - `set_seq advance '18|idle tactic-fixture-node parked'` → `$RC == 11`,
    `events_have halt parked == 1`;
  - `set_seq advance '18|idle tactic-fixture-node absent'` → `$RC == 10`,
    `events_have halt absent == 1`;
  - a budget pin: run the blocked case with `--ci-wait-s 600` and assert the
    run still exits within the suite's ordinary time and `calls advance == 1` —
    proving the halt does not consume the CI budget;
  - `assert_eq` on `jq -r .disposition "$STATE_DIR/state.json"` being `blocked`,
    so `dispatch-ladder-status` (a pure consumer of `state.json`,
    `dispatch-ladder-status:36-46`) reports it without any change of its own;
  - leave the `'7|weird …'` (`:927-931`) and `'9|surprise …'` (`:944-948`)
    unmapped-code cases untouched, and leave every existing exit-10
    `not-selectable` case passing unchanged.

Out of scope: `dispatch-ladder-await`, `dispatch-ladder-status`,
`dispatch-ladder-spawn`, `classify_terminus`, `phase_is_done`, the
`ADV_ERR_LAST` fold (that is
`tactic-eval-finding-ladder-halt-drops-captured-cause`'s territory — preserve
the existing fold verbatim and add nothing), and `halt()`'s event fields.

**Recommended model** — opus.

**Dependencies** — Unit 3.

## Unit 5 — the tick's explicit-node lane names the reason too

The same collapse exists on the other driver: `dispatch-select-tick:1128-1135`
prints `node-not-selectable $NODE_ARG` with no reason, and
`dispatch-tick:847-851` reports it to the operator the same way. This is a
reporting-only change; the tick takes no different action.

**Scope**

- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`:
  - `:1115-1117` — the `--node` lane already captures the selector's stdout in
    `GRAPH_OUT`. At `:1129-1134`, parse the reason (fields 2 and 3 of the
    `^empty ` line, via a here-string, never `echo`) and emit
    `node-not-selectable $NODE_ARG <reason>` — omitting the third field when no
    reason is available, so the line degrades to today's exact shape. Set
    `DLOG_DISPOSITION="node-not-selectable:<reason>"` when a reason is present.
  - Do not change the failure fallback at `:1116` (`GRAPH_OUT="empty"`), which
    correctly yields no reason.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick`: `:847-851` reads
  `${2:-}` after `set -- $DECISION` (`:842-844`), so a third field is already
  safe; extend the stderr message to name `${3:-}` when present. No `case`
  change.
- Tests: `test-dispatch-select-tick.sh:1738-1751` — the decision-line assertion
  becomes the reason-carrying form for a fixture whose stubbed selector prints
  `empty absent`, plus one case pinning the no-reason degradation to the
  original `node-not-selectable <id>`. `test-dispatch-tick.sh:951-963` —
  `TICK_DECISION="node-not-selectable foo-bar blocked"` still exits 1 with no
  `graph-execute` call.

Out of scope: any routing or spawn behaviour change in either script; the tick
lane still refuses to fall through to Step 3b's aux triggers (`:1128-1131`).

**Recommended model** — sonnet.

**Dependencies** — Unit 2.

---

## Reuse

- `packages/intentionsutil/src/router.ts:239-245` `blockersComplete` — the
  predicate that drops the node; `incompleteBlockers` becomes its single
  implementation rather than a parallel one. Its fail-open doc comment
  (`:215-238`) and `terminus.ts:46-56`'s counter-argument both stay true.
- `packages/intentionsutil/src/router.ts:383-388` — the existing `events.push`
  for the freeze case: the precedent for reporting a drop reason out of the
  router instead of swallowing it.
- `packages/intentionsutil/src/terminus.ts:16-56` `classifyTerminus` /
  `TerminusClassification` — the same five-way vocabulary
  (`done` / `excused-parked` / `excused-blocked` / …) already exists for the
  ladder's *terminus* question. Reuse its ordering discipline (first match wins,
  total, deterministic) for `explainExclusion`; do **not** call it — its leading
  `not-merged` arm answers a different question and would misclassify an
  unmerged blocked node.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:503-506`
  `skip_note` — the gate reason tokens already recorded per skipped id; Unit 2
  reads them rather than inventing a second vocabulary.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance:167-198`
  `worktree_occupancy_state` — the precedent, in the same file, for splitting a
  previously-collapsed signal into named tokens ("only the TOKEN changes").
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:708-733` `halt()`,
  `:521-545` `write_state`, `:559-568` `log_event` — the terminal path is reused
  unchanged; the new arm only calls it earlier and with a truthful disposition.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-status:36-46` — a
  pure consumer of `state.json`; it already renders whatever disposition and
  terminus the driver wrote, so it needs no change.
- Test harnesses reused as-is: `run_case`
  (`test-dispatch-ladder-advance.sh:164-188`); `set_seq` / `calls` /
  `reset_seqs` / `run_ladder` / `events_have`
  (`test-dispatch-ladder-run.sh:188`, `:196`, `:254`, `:278`, `:284`);
  `assert_contains_local` (shared `dispatch-test-fixture.sh`, sourced at
  `test-graph-select-target.sh:8`); the GSN real-git + fake-npx + fake-claude
  fixture (`test-graph-select-target.sh:168-229`); `tactic()` / `strategy()` /
  `anode()` (`router.test.ts:14-56`).

**CI wiring.** No new test file is created, so no `.github/workflows/unit-tests.yml`
step is needed: `test-graph-select-target.sh` rides `run-unit-tests.sh`'s
`test-*.sh` glob (`run-unit-tests.sh:5,190-201`), the two `dispatch-ladder-*`
suites already have named steps (`unit-tests.yml:305,309`), and the router tests
ride vitest. If a unit does add a new `test-*.sh` under
`.claude/skills/dispatch-ladder/scripts/`, it MUST also get its own explicit
`run:` step there or it will silently never run in CI.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
bash .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
```

```verify
bash .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Run the two shell suites and the typecheck from the worktree root; a foreign cwd
makes `run-typecheck.sh` / `run-lint.sh` pass vacuously.

### Manual checks (judgment; not auto-runnable)

1. **End-to-end on the real graph, read-only.** Pick a node that currently
   carries an incomplete `blocked_by` edge (`grep -l 'blocked_by:' intentions/*.md`
   then check the blocker's phase) and run
   `.claude/skills/dispatch-propagate/scripts/graph-select-target --node <id>`
   with `dangerouslyDisableSandbox: true` (its sensor gates call `gh` and the
   liveness read needs the daemon socket). Expect stdout
   `empty blocked <blocker-id>` and a stderr sentence naming the same thing.
   Then run `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance <id>`
   and confirm `idle <id> blocked <blocker-id>` with exit 18. Neither command
   writes anything.
2. **The reported symptom is gone.** Spawn `/dispatch-ladder <that-id>` and
   confirm it halts within one poll interval instead of an hour, with
   `dispatch-ladder-status <id>` reporting disposition `blocked` and terminus
   `excused-blocked`, and `grep -c blocked <state-dir>/events.jsonl` non-zero.
   This is the finding's own acceptance test: the word `blocked` must appear in
   the journal, in `events.jsonl` and in the status output, none of which it did
   before.
3. **Nothing else changed.** Confirm a healthy node still walks the ladder:
   spawn the ladder on a genuinely selectable node and check the first advance
   still exits 0 with `launched …`, and that a node whose PR has pending CI
   still logs `idle ci-wait` and re-polls rather than halting.
4. **Live-ladder hazard.** `systemctl --user list-units 'dispatch-ladder-*'`
   before merging. A ladder already detached mid-run loads the old driver but
   calls the freshly-merged `advance`, so it would see exit 18 and take its
   `*) halt 1 internal` arm — loud, not silent. Re-spawn any node whose run
   halted `internal` across the merge.
5. **Tick lane, unvalidated end-to-end.** Dispatch is paused by author directive
   since 2026-08-10, so Unit 5's path is exercised only by its unit tests, not
   by a live tick. Record that in the PR description; it needs no main-qa
   follow-up because the change is a stdout-string addition with a
   degrade-to-today fallback, but do not claim it was observed running.
