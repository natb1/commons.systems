---
id: tactic-graph-auto-merge-office-hours-gate
kind: tactic
statement: graph-auto-merge must decline to merge a node-lane PR while its node
  carries a live office_hours park
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-08-01 while investigating a stopped-node QA subagent's
  review of PR #3006 (tactic-lane-instrument-substitution-guard). Direct read of
  .claude/skills/dispatch-propagate/scripts/graph-auto-merge (lines 78-94,
  113-173) confirms: the candidate-enumeration query selects every kind:tactic
  node at phase:review whose execution.pr is non-null and whose
  execution.markers includes \"reviewed\" — it does not read node.office_hours
  anywhere. The per-candidate merge gates that follow (PR state OPEN, mergeable
  MERGEABLE, CI verdict passing, tactic-scope-fingerprint freshness) likewise
  never consult office_hours. So a node at phase:review carrying BOTH the
  reviewed marker AND a live, unresolved office_hours park is currently
  indistinguishable to this script from a clean reviewed node — it merges the PR
  regardless. This is a real code-level gap, confirmed by reading the script
  directly. (Resolved 2026-08-04 /align-tactics finalize round: the PR #3006
  timeline is now confirmed benign — it merged 2026-07-31T22:45:49Z while the
  node was at phase:review with office_hours: null, was reconciled to main-qa
  still unparked, and was parked by /qa-main only afterward at the downstream
  main-qa phase. The gap is a live but not-yet-observed code path, not an
  incident; see the body's resolved-timeline table for the full commit trail.)"
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Item 10 — ratify or reject the ungated-reconciler asymmetry (a node
      advanced to phase done while its office_hours park stays live)?
    answer: "(Ruled 2026-08-04 /align interview.) Option A ratified, plus option B's
      follow-up: done-but-parked is a VALID state — phase and office_hours are
      conceptually orthogonal dimensions (a park means a human owes a decision;
      the merge and phase advance are orthogonal to that debt, and author
      escalation may be required even after the code lands). The reconciler
      stays ungated per Unit 2's design. PR #3033 lands unchanged; item 10
      closes as accepted-behavior. Greenfield consequence: the office-hours
      queue presents BOTH dimensions — parked entries annotate the node's phase
      (e.g. phase done, underlying work already merged) — retained as draft
      tactic-office-hours-queue-phase-annotation. The orthogonality doctrine is
      recorded on strategy-graph-native-dispatch (2026-08-04 clarification).
      Park cleared on this ruling."
tooling_goals: []
success_signal:
  observable: "graph-auto-merge's per-candidate gate skips (holds, does not merge)
    any phase:review node whose office_hours is non-null, verified by a test
    fixture: a reviewed, green, fresh, mergeable PR whose node also carries a
    non-null office_hours must NOT be merged."
  sensor: test-graph-auto-merge.sh
  threshold: new test case passes; existing test-graph-auto-merge.sh suite unaffected
  is_proxy: false
attention:
  boost: 0.03
  override: null
  rationale: >-
    Author-directed 2026-08-03: prioritize bug-ledger fixes directly BELOW the
    token-efficiency cluster. Boost 12 resolves to 17.33 because an inbound
    distributor adds 5.33 — under that cluster's 20.00 and above the 5.33
    undecomposed baseline. Simulated over the live store before writing: 0 tier
    changes, 0 value drift onto non-target nodes.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 12 to 0.03 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: main-qa
execution:
  branch: tactic-graph-auto-merge-office-hours-gate
  pr: 3033
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-06T02:00:42Z
    mergeCommitSha: 09468eac70282674cd7df38eec0b1a14ff296cf3
    graphCommitSha: null
validates: []
blocked_by: []
office_hours:
  reason: needs-main residue item 11 asks whether to invest in a one-time backward
    audit of already-merged node-lane PRs against their nodes' office_hours park
    history — a scoping/prioritization call on the user's product intent, not an
    objective check any tool can settle; no MACHINE items exist on this node to
    run first
  since: 2026-08-09
  recommendation: "Decide: is a backward audit of already-merged node-lane PRs vs
    their office_hours park history worth running as separate follow-up work?
    Context from the merged PR #3033 (merged 2026-08-06T02:00:42Z, confirmed via
    gh pr view): this tactic hardens graph-auto-merge to hold (not merge) any
    phase:review node carrying a live office_hours park, closing a gap that was
    never observed firing in production (the original motivating case, PR #3006,
    was investigated and confirmed benign — its park was set post-merge at the
    downstream main-qa phase). Acceptance evidence is the two new/updated test
    suites cited in the PR body (test-graph-auto-merge.sh and the intentionsutil
    vitest reconcile-graph suite), not a before/after production comparison,
    since there is no historical incident to reproduce. If a backward audit is
    wanted, scope and file it as a new tactic; otherwise this residue item can
    be dismissed as accepted-risk."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 12
---
# graph-auto-merge must decline to merge a node-lane PR while its node carries a live office_hours park

## Context

`.claude/skills/dispatch-propagate/scripts/graph-auto-merge` is, per its own
header comment (`graph-auto-merge:2-4`), "the ONLY code that merges a node-lane
PR." It does not read `office_hours` anywhere. Re-confirmed at commit
`28118669`: `grep -c office_hours` returns **0** for
`.claude/skills/dispatch-propagate/scripts/graph-auto-merge`,
`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`, and
`packages/intentionsutil/scripts/reconcile-graph.ts`.

Its candidate enumeration (`graph-auto-merge:87-98`) selects every `kind:tactic`
node at `phase:review` whose `execution.pr` is non-null and whose
`execution.markers` includes `reviewed`:

```js
if (n.kind !== "tactic") continue;
if (n.phase !== "review") continue;
const pr = n.execution && n.execution.pr;
if (pr === null || pr === undefined) continue;
const markers = (n.execution && n.execution.markers) || [];
if (!markers.includes("reviewed")) continue;
```

The per-candidate gates that follow are all orthogonal to `office_hours` too:
PR state `OPEN` (`graph-auto-merge:131-132`), `mergeable === MERGEABLE`
(`:134-135`), CI verdict `passing` (`:137-147`), and the fail-closed
tactic-scope-fingerprint freshness re-check (`:149-177`). A node satisfying all
of them is squash-merged (`gh_pr_merge_rest`, `:189`) regardless of whether it
also carries a live `office_hours` park.

Every other write path in the fleet treats a non-null `office_hours` as a hard
stop — the router's candidate loops (`packages/intentionsutil/src/router.ts:495`,
`:541`, `:575`), the scope sweep (`packages/intentionsutil/src/scope-sweep.ts:98`),
and the phase-skill front door (`dispatch-derive-node-target:60-79`, exit 3).
`graph-auto-merge` is the one autonomous write path that never asks.

### Why it matters

A node can reach `phase:review` with the `reviewed` marker set and *then*
accumulate an `office_hours` park — e.g. a `/review-fix` or Stop-hook backstop
park landing after an earlier clean pass already wrote the marker, while the PR
sits waiting for CI across several ticks. The selector deliberately excludes
reviewed nodes from re-selection (`router.ts:495-500`), so in that window
**nothing but the tick's `graph-auto-merge` sweep acts on the node** — and today
it merges. The park is then left dangling on a node whose PR has already
shipped, and whatever the park was flagging never got human eyes before the code
landed. Per the serving strategy, an `office_hours` park asserts "no autonomous
path forward exists — a human is required"; merging is the most consequential
autonomous step there is.

### The historical question is RESOLVED — PR #3006 was a red herring

The draft recorded an open question (the frontmatter `gap`, now cleared):
whether PR #3006 was actually merged while
`tactic-lane-instrument-substitution-guard` carried a live park. It was not.
Confirmed from the commit trail at `28118669` (timestamps normalized to UTC):

| When (UTC) | Commit | Node state |
|---|---|---|
| 2026-07-31T22:37:21Z | `ff11018c` | `phase: review`, `office_hours: null` |
| 2026-07-31T22:45:49Z | — | **PR #3006 merged** |
| 2026-07-31T23:00:53Z | `0a83f2ca` | reconciled to `phase: main-qa`, `office_hours: null` |
| 2026-07-31T23:15:59Z | `0428a3b1` | `/qa-main` parks it — at `main-qa`, **post-merge** |

So the park was set *after* a clean merge, at the downstream `main-qa` phase.
The motivating case is benign; **the code-level gap is real but has not yet been
observed to fire.** This fix is preventative hardening of the only autonomous
merge path, not incident remediation.

### Greenfield design, and what actually ships here

**Ideal greenfield.** Merge eligibility is a predicate over graph state, and the
serving strategy's condition that "selection, transition, and provisioning
mechanics live in owned, offline-testable code (tsx modules and primitive
scripts)" applies to it. The predicate — kind/phase/pr/`reviewed`/`office_hours`
— belongs in `packages/intentionsutil` as an exported, vitest-covered function
(e.g. `autoMergeCandidates(nodes)`), with `graph-auto-merge` reduced to thin
composition: call one owned script for the candidate list, sense GitHub, merge.
Today that predicate is an inline `node -e` snippet whose logic is covered only
indirectly, because the bash fixture *stubs `node`* (`test-graph-auto-merge.sh:67-86`)
and re-implements the filter in jq — so the real filter has no direct test at
all.

**What ships here, and why (migration path).** This tactic lands the
`office_hours` conjunct in place, at the existing inline enumeration and gate
loop. Reasons, stated so a later session does not read this as the preferred end
state: (1) this is the only code that merges node-lane PRs, and a
behavior-preserving extraction multiplies the blast radius of a one-conjunct
correctness fix; (2) the extraction changes no behavior and is cleanly
separable; (3) the fleet-wide convention today is exactly this local guard
(`router.ts:495`, `scope-sweep.ts:98`, `dispatch-derive-node-target:60-79` each
carry their own). The extraction is **explicitly out of scope** for this tactic
and is recommended as a separate follow-up tactic — this plan does not create
it.

### Design ruling: the merge gate is added, the reconcilers are deliberately NOT gated

The draft flagged that a fix "likely also touches `reconcile-graph-merged`'s
post-merge phase advancement." It should not, and this plan rules it out
explicitly so a future session does not "complete" the fix by adding one:

- `graph-auto-merge` **decides**: it takes an irreversible autonomous action
  (squash-merge) on the author's behalf. A park revokes that authority. Gate it.
- `reconcile-graph-merged` / `reconcile-graph.ts` **record reality**: the PR is
  already merged or closed; the sweep only makes the graph say so
  (`reconcile-graph-merged:2-24`, `reconcile-graph.ts:152-171`). Refusing to
  reconcile a parked node would strand it at `phase:review` with a merged PR —
  graph state diverging from GitHub, which is the exact failure this reconciler
  exists to prevent, and it would hand the office-hours drain session a
  misleading phase. The park is **not** lost by reconciling: `office_hours` is a
  frontmatter field the phase write never touches, `officeHoursQueue`
  (`packages/intentionsutil/src/officeHours.ts:48-75`) keys only on
  `office_hours !== null` with no phase filter, and `hold-sweep.ts:92,128`
  already treats `phase: done && office_hours === null` as the terminal test — so
  a parked node stays in the office-hours queue after reconciliation.

The observed PR #3006 sequence is this ruling working correctly: a merge that had
authority, reconciled to `main-qa`, then parked by `/qa-main` for a human.

---

## Unit 1 — Gate `graph-auto-merge` on `office_hours`, with a visible hold (script + fixture together)

**Scope.**

Files changed: `.claude/skills/dispatch-propagate/scripts/graph-auto-merge` and
`.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh`.

These two **must land in one unit**: the enumeration's stdout shape changes, and
the test's fake `node` re-implements that enumeration. Splitting them leaves the
suite red between commits.

1. **Carry the park state through the enumeration** — `graph-auto-merge:87-98`.
   Do *not* drop parked nodes from the candidate set; a silent skip gives the
   operator no signal on a condition that persists until a human drains it.
   Keep every existing `continue` unchanged and extend only the emit line
   (`:96`) to a third tab-separated field:

   ```js
   process.stdout.write(n.id + "\t" + pr + "\t" + (n.office_hours == null ? "clean" : "parked") + "\n");
   ```

   First-class `office_hours` only. Do **not** use the squatter-aware
   `readParked` helper (`packages/intentionsutil/scripts/check-node-selection.ts:90-94`):
   tactic nodes carry `office_hours` first-class (`router.ts:495`), and that
   helper re-fetches origin/main, duplicating this script's own Step 3 snapshot.

2. **Gate first in the per-candidate loop** — `graph-auto-merge:119-120`.
   Change the read to `while IFS=$'\t' read -r id pr parked; do`, and insert the
   gate immediately after the existing `[[ -n "$id" && -n "$pr" ]] || continue`
   at `:120`, i.e. **before** `gh_pr_view_rest` — a parked node needs no PR
   sensing at all, so the hold is emitted even when the PR would hard-error, and
   one REST call per parked candidate is saved:

   ```bash
   # ---- office_hours park gate (fail closed, before any GitHub sensing) -----
   # A parked node awaits a human decision; merging its PR would ship the code
   # the park was flagging. Decline VISIBLY and never demote — same posture as
   # the freshness gate below. Fail closed: anything other than the literal
   # `clean` (an empty third field from a desynced enumeration included) HOLDS.
   if [[ "$parked" != "clean" ]]; then
     echo "held $id (office-hours)"
     continue
   fi
   ```

   The hold token is exactly `office-hours`. This overrides the draft's
   tentative `(parked)` suggestion: "parked" collides with worktree/reservation
   holds elsewhere in the fleet, while `office-hours` names the queue the node
   is waiting in. Pin this token — Unit 1's test asserts it byte-for-byte.

   Fail-closed on a non-`clean` value is deliberate and matches this script's
   existing freshness posture (`:165-173`): a desynced enumeration should stop
   merging loudly, not merge on an unread field.

3. **Update the two docstrings.**
   - `graph-auto-merge:18-31` ("Merge gates, in order") — add the office_hours
     gate as the **first** bullet, since it is evaluated first: a non-null
     `node.office_hours` HOLDS (`held <id> (office-hours)`), never demotes; the
     node stays at `phase:review` for the human to drain via office-hours.
   - `graph-auto-merge:38-40` (stdout protocol) — enumerate `office-hours`
     alongside the existing hold reasons so the contract stays complete.

4. **Fixture faithfulness** — `test-graph-auto-merge.sh:79-84`. The fake `node`'s
   jq projection must mirror the new third field:

   ```
   | "\(.id)\t\(.execution.pr)\t\(if .office_hours == null then "clean" else "parked" end)"
   ```

   jq treats a missing key as `null`, so existing fixtures (a)-(f), which carry
   no `office_hours` key, keep emitting `clean` and keep passing unchanged.

5. **New test case (g)** — insert **before** `rm -rf "$GAM_ROOT" "$GAM_BARE"`
   (`test-graph-auto-merge.sh:225`), modeled on case (e)'s hold assertions
   (`:188-207`) and case (a)'s otherwise-merge-eligible fixture (`:127-143`).
   The node must satisfy *every* other gate so the test isolates the new one:
   `reviewed` marker, `state: open`, `mergeable: true`, CI `passing`, a present
   `.scope-fingerprint` stamp, and `gam_fresh`.

   ```bash
   # ---- (g) live office_hours park → held (declines, no merge) ---------------
   gam_reset
   printf '%s\n' '[{"id":"tactic-g","kind":"tactic","phase":"review","execution":{"pr":107,"markers":["planned","qa-done","reviewed"]},"office_hours":{"reason":"fixture park","since":"2026-08-01","recommendation":null,"session_type":"other"}}]' \
     > "$GAM_ROOT/stub/nodes.json"
   printf '%s\n' '{"number":107,"title":"Tactic G","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-g","sha":"sha107"},"labels":[]}' \
     > "$GAM_ROOT/stub/pr-107.json"
   echo passing > "$GAM_ROOT/cache/sha107"
   echo fp > "$GAM_ROOT/.claude/worktrees/tactic-g.scope-fingerprint"
   gam_fresh tactic-g
   gam_g_out=$(run_gam 2>/dev/null); gam_g_rc=$?
   assert_eq "graph-auto-merge (g): office_hours-parked node is held" \
     "held tactic-g (office-hours)" "$gam_g_out"
   assert_eq "graph-auto-merge (g): exit 0" "0" "$gam_g_rc"
   if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_g_m=present; else gam_g_m=absent; fi
   assert_eq "graph-auto-merge (g): office_hours hold issues no merge" "absent" "$gam_g_m"
   ```

   The `office_hours` object shape is `{reason, since, recommendation,
   session_type}` per `packages/intentionsutil/src/schema.ts:506-511`;
   `session_type: other` matches the working fixture at
   `test-assert-node-selection.sh:160-166`. No schema change is needed — a
   tactic is a goal-layer kind and may legitimately carry `office_hours`
   (`schema.ts:871-889`).

**Out of scope for this unit.** Extracting the enumeration predicate into
`packages/intentionsutil` (see Context). Any change to the OPEN/MERGEABLE/CI
gates. The PR-up-to-date-with-main conjunct (owned by the sibling
`tactic-graph-auto-merge-up-to-date-gate`, not this node). Any change to
`reconcile-graph-merged` or `reconcile-graph.ts` (that is Unit 2, and it is
documentation + a pinning test only). Any CI registration —
`run-unit-tests.sh:190` already globs `test-*.sh` in this directory, so
`test-graph-auto-merge.sh` is already wired into
`.github/workflows/unit-tests.yml:44`.

**Recommended model.** sonnet.

---

## Unit 2 — Pin the reconciler asymmetry: record reality, do not gate it

**Scope.**

This unit adds **no behavior change**. It converts the Context's design ruling
into code the next session cannot silently undo, because the natural (and wrong)
follow-through after Unit 1 is "add the same guard to the reconciler."

Files changed:

1. `packages/intentionsutil/scripts/reconcile-graph.ts` — add a comment
   immediately above the Pass 1 classification loop (currently `:152-159`,
   the `for (const [id, entry] of Object.entries(prStates))` loop guarded by
   `isOpen(node.phase)` at `:159`) recording: this pass deliberately does **not**
   filter on `office_hours`. `graph-auto-merge` gates on the park because it
   *decides* (an irreversible merge); this pass only *records* an already-terminal
   PR. Refusing to reconcile a parked node would strand it at a stale phase with
   graph state contradicting GitHub. The park survives the write untouched —
   `office_hours` is frontmatter the phase write never touches, and
   `officeHoursQueue` (`src/officeHours.ts:48-75`) keys on `office_hours !== null`
   with no phase filter, so the node stays in the office-hours queue.

2. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` — add the
   same ruling, one short paragraph, to the header block (after the GRACE-window
   paragraph at `:37-38`, before the Doctrine paragraph at `:40`), so a reader of
   the bash wrapper's `OPEN_TACTICS` enumeration (`:67-77`) finds the answer
   without opening the TS.

3. `packages/intentionsutil/test/reconcile-graph.test.ts` — add one regression
   case pinning the behavior. Use the existing `node()` helper (`:13-46`), which
   already accepts `office_hours` via `partial.office_hours ?? null` (`:34`), and
   the `prStates()` helper (`:48-56`). Model it on the first `describe` case
   (`:59-101`):

   - Seed `kind-tactic` (and `kind-strategy` if a serving strategy is used), plus
     a tactic at `phase: "review"` with
     `execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null }`
     and a non-null `office_hours`
     (`{ reason: "parked", since: "2026-08-01", recommendation: null, session_type: "other" }`).
   - Call `reconcileGraph` with a `merged` pr-state.
   - Assert: `plan.reconciled` contains `{ id, target: "done" }`; the node's
     `phase` is `"done"`; `execution.completion` carries the merge evidence; and
     — the point of the test — `readNode(dir, id).office_hours` is still
     non-null and deep-equals what was seeded.
   - Name it so its intent survives a future refactor, e.g.
     `"reconciles a merged tactic that carries a live office_hours park (recording reality is not an autonomous decision) and preserves the park"`.

**Out of scope for this unit.** Adding any `office_hours` filter to
`reconcile-graph.ts` or `reconcile-graph-merged` — that is the outcome this unit
exists to prevent. Any change to Pass 2 / Pass 3 write logic
(`reconcile-graph.ts:173-191`, `:193-222`). Any change to the round-stamping
rule.

**Recommended model.** sonnet.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:87-98` — the Step 2
  inline `node --import tsx/esm` enumeration over `listNodesStrict`. Extend its
  emit line; do not add a new pass or a second node invocation.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:149-177` — the
  existing `held $id (missing-stamp)` / `held $id (scope-stale)` fail-closed hold
  pattern. The new gate copies this shape exactly: `echo "held $id (<reason>)";
  continue` — declines, never demotes, node stays at `phase:review`.
- `packages/intentionsutil/src/router.ts:495` (also `:541`, `:575`),
  `packages/intentionsutil/src/scope-sweep.ts:98` — the canonical
  `if (x.office_hours !== null) continue;` idiom. No helper exists or is needed;
  `office_hours` is a plain nullable field.
- `packages/intentionsutil/src/officeHours.ts:5-6,48-75` — the canonical
  definition of "parked" (`office_hours !== null`, no phase filter). Semantics
  reference for both units; not imported by the bash script.
- `packages/intentionsutil/src/schema.ts:506-511` (`interface OfficeHours`) and
  `:871-889` (`checkGoalLayerOnlyFields`) — field shape for the fixtures, and
  confirmation that a tactic may carry `office_hours` with no schema change.
- `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh:33-125` —
  the GAM harness (`gam_reset`, `run_gam`, `gam_fresh`, the fake `node`/`gh`
  stubs, the local bare-remote git seed). Reused as-is; only the stub's jq
  projection (`:79-84`) changes, plus new fixture data.
- `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh:188-207` —
  case (e), the exact assertion template for a `held <id> (<reason>)` stdout line
  plus an absent `merge-calls.log`.
- `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh:160-166`
  — a working `office_hours` fixture block (YAML); transliterate to JSON for
  `stub/nodes.json`.
- `packages/intentionsutil/test/reconcile-graph.test.ts:13-56` — the `node()` and
  `prStates()` fixture helpers; `node()` already threads `office_hours` through.
- `packages/intentionsutil/src/hold-sweep.ts:92,128` — precedent for the
  composite `phase === "done" && office_hours === null` terminal test; cited in
  Unit 2's comment as evidence a parked done node is not treated as finished.

**Deliberately NOT reused:**
`packages/intentionsutil/scripts/check-node-selection.ts:90-94` (`readParked`) —
the squatter-aware variant. Tactic nodes carry `office_hours` first-class, and
that helper's origin/main re-fetch duplicates `graph-auto-merge`'s own Step 3
snapshot (`graph-auto-merge:102-115`).

---

## Verification

Both suites below pass on an unmodified tree at `28118669`
(`test-graph-auto-merge.sh`: 22/22; `reconcile-graph.test.ts`: 9/9), so any
failure after the change is attributable to the change.

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

The vitest project name is the **workspace directory**, `packages/intentionsutil`
— not a bare package name (`vitest.config.ts:12-21` sets `test.name = dir`).

**CI wiring.** No registration work is needed:
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190` globs
`test-*.sh` in the dispatch-propagate scripts directory, and
`.github/workflows/unit-tests.yml:44` runs `run-unit-tests.sh`. The vitest suite
runs through the same workflow.

**Consumer wiring (manual, sandbox-off).** `dispatch-select-tick:481-493` is the
sole consumer of `graph-auto-merge`'s stdout: it prefixes each line with
`merge: ` and parses nothing, so a new hold reason is non-breaking. If that
wiring is touched, run
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh` **with
`dangerouslyDisableSandbox: true`** — verified at `28118669`, it reports
199/199 sandbox-off but false-fails 98/199 sandboxed (it stubs
`graph-auto-merge`, so it is unaffected by this change either way). Do **not**
put it in a `verify` block; auto-run verification is sandboxed and would
false-fail.

**Observe in production (judgment call, post-merge).** The gate fires on a path
that has never been observed live (see the resolved historical question above),
so a `merge: held <id> (office-hours)` line in `journalctl -u dispatch-tick`
should be **rare or absent**. If one appears, it is a genuine catch, not a
regression: confirm the named node is at `phase:review`, carries the `reviewed`
marker, and has non-null `office_hours` — and that its PR is still open. A burst
of `held ... (office-hours)` lines across *many* nodes at once means the
fail-closed third field desynced (the enumeration and the read disagreeing), not
that the fleet parked itself; check `graph-auto-merge:96` against `:119` first.

**Manual review point (judgment call).** Confirm at review time that no
`office_hours` filter crept into `reconcile-graph.ts` or `reconcile-graph-merged`
— Unit 2's whole purpose is that the reconcilers stay ungated, and the
regression test plus the two comments are the record of that ruling.

## needs-main residue

- id: 11 — Preventative-only hardening: no live incident to reproduce
  - URL path: current
  - Expected outcome: QA does not manufacture a false reproduction of a
    nonexistent incident; the backward-audit scoping question is surfaced to a
    human rather than silently answered.
  - Finding: this PR frames itself as closing a gap that has not been observed
    firing in production (the PR #3006 timeline was investigated and confirmed
    benign — a park set post-merge, at the downstream `main-qa` phase, not
    before). There is no historical incident to reproduce, so the acceptance
    evidence is the two test suites (`test-graph-auto-merge.sh` 25/25,
    `packages/intentionsutil` vitest 784/784), not a before/after production
    comparison. Open question: is a one-time backward audit of already-merged
    node-lane PRs against their nodes' park history worth running as separate
    follow-up work?
  - Verifiability: AUTHOR — whether to invest in a backward audit is a
    scoping/prioritization call (the user's product intent), not an objective
    check any tool can settle.
