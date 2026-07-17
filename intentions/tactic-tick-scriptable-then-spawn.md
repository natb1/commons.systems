---
id: tactic-tick-scriptable-then-spawn
kind: tactic
statement: "Two-phase tick: run all scriptable non-worker dispositions (incl.
  the scope-stale demote, moved ahead of selection) before the worker-group
  spawn, so metadata writes never consume the launch budget"
owner: ai
status: codified
parent: null
rationale: Surfaced in the 2026-07-16 /align-strategy interview diagnosing a
  manual tick that scope-stale-demoted a node at launch and ended having
  launched 0 workers though SPAWN_N=1, headroom=5. Implements the
  scriptable-then-spawn contract clarification on
  strategy-graph-native-dispatch.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 7
  override: null
  rationale: "Author-directed 2026-07-16: the two-phase-tick fix (each tick
    performs all scriptable non-worker work, then spawns the worker group) is
    the current top-priority dispatch work — strictly the top of the ordinary
    queue (authored 12 = own 7 + inherited 5 from
    strategy-graph-native-dispatch), one above the concurrently-boosted
    tactic-graph-eligibility-last-aligned (authored 11), sequenced below
    strategy-main-health's guarded 100. Finalized to phase:implement by the
    2026-07-16 /align-tactics <tactic-id> per-node round
    (frozen-tactic-dispatch, clarification 52); the author-directed boost
    persists to rank this now-selectable work first."
phase: qa
execution:
  branch: tactic-tick-scriptable-then-spawn
  pr: 2881
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: all script-verifiable QA items passed (vitest 502/502, shell
    syntax clean, phase-1-before-selection ordering confirmed, exit-13
    reservation_clear confirmed, listScopeStaleTactics export confirmed). Two
    acceptance-criteria items remain: the node's own ## Verification section's
    manual end-to-end live-tick checks (phase-1-demote + phase-2-launch same
    tick; single-pass convergence; liveness guard; exit-13 safety net). These
    need claude agents --json (dangerouslyDisableSandbox, live daemon socket)
    and can mutate live production graph state (demote real in-flight tactics)
    if run carelessly — unsafe to auto-run in an isolated QA session. qa-main's
    autonomous verifier is browser-only (Claude-in-Chrome against deployed prod)
    and has no mechanism to run a dispatch tick or query the daemon, so it
    cannot perform this check either. Escalating directly to office-hours for a
    human to run the manual checks, rather than deferring to a main-qa pass that
    would only fail the same way."
  since: 2026-07-17
  recommendation: >-
    ## Recommendation: `tactic-tick-scriptable-then-spawn` (PR #2881)


    ### Status going in


    The autonomous `/qa-fix` pass already cleared everything script-verifiable:
    vitest 502/502, clean shell syntax, the phase-1 sweep call confirmed ahead
    of the real selection call sites (the earlier ordering false-fail was a
    doc-comment grep artifact, discounted), the exit-13 `reservation_clear`
    addition present, and the `listScopeStaleTactics` export present. No code
    change is owed for any of that. What's left is the node's own `##
    Verification` section's two **manual** end-to-end checks — they were parked
    (not attempted) because they need `claude agents --json` (daemon socket,
    `dangerouslyDisableSandbox: true`) and can mutate live graph state, which
    neither the autonomous QA lane nor `/qa-main`'s browser-only verifier can do
    safely unattended. This is confirmation-only work for a human at a terminal.


    ### Before you touch anything: work on a throwaway, not a live tactic


    Both checks demote a scope-stale tactic. Do not pick a real in-flight tactic
    as the subject — a demote to `implement` is a production graph mutation.
    Either:


    - Create a disposable test tactic in `qa`/`fix`/`review` phase with no live
    worker, or

    - Snapshot the graph state first (`git status` on `intentions/`, note the
    target node's current `phase`/`execution.pr`) so any accidental demote is
    trivially reverted with `git checkout intentions/<id>.md` before you
    `graph-commit` anything.


    Confirm the chosen subject has no live session: run `claude agents --json`
    (with `dangerouslyDisableSandbox: true`) and verify nothing is running under
    its worktree.


    ### Check 1 — live-tick end-to-end (scriptable→spawn regression)


    This is the exact bug the tactic fixes: a scope-stale demote at launch time
    used to consume a `SPAWN_N` slot silently, so a tick with headroom could
    launch zero workers.


    1. Force a fingerprint mismatch on the test tactic. Two ways, pick one:
       - Edit its stamp file `.claude/worktrees/<id>.scope-fingerprint` to a bogus value, or
       - Hand-edit the tactic's statement/body in `intentions/<id>.md` so its recomputed scope fingerprint diverges from the stamped value.
    2. Run the tick manually with headroom > 1 and sandbox off:

       `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` — run with `dangerouslyDisableSandbox: true`, tee stdout to a file so you can grep ordering.
    3. Confirm both halves in the captured stdout:
       - (a) A `scope-sweep: scope-stale <id>` line appears before the selection decision line — grep for `scope-sweep: scope-stale` and confirm its line number precedes the selection decision. This is the phase-1 demote landing before selection, per the Step-1d wiring in `dispatch-select-tick` and the sweep script `dispatch-graph-scope-sweep`.
       - (b) The tick still launches a worker in phase 2 despite the demote — headroom was not silently consumed. Confirm a worker actually spawns.

    If both hold, the regression fix is verified.


    ### Check 2 — convergence / liveness guard / safety net


    Three sub-checks, all against the sweep + `dispatch-graph-execute` case
    `13)` path:


    - (a) Single-pass convergence: a node just demoted to `implement` in phase 1
    is not immediately re-swept in the same tick. Confirm the demoted node shows
    one `scope-stale` line, not a re-sweep.

    - (b) Liveness protects a live worker: take a scope-stale tactic that does
    have a live worker (start/point a session at its worktree so `claude agents
    --json` reports it live), run the tick, and confirm it is not swept — no
    `scope-stale` demote line for it.

    - (c) Safety-net + reservation clear: simulate residual staleness introduced
    between the sweep and worker-launch (re-dirty the fingerprint after the
    sweep step but before launch). Confirm the tick hits the exit-13 path in
    `dispatch-graph-execute` (case `13)`), and that the new `reservation_clear`
    fires so the node is freed for next-tick re-selection (verify the
    reservation is cleared, not left held).


    The demote primitive underneath all of this is
    `packages/intentionsutil/scripts/demote-node-to-implement` — read it if you
    need to understand what state a demote writes.


    ### If both checks pass


    There is no residue item and no needs-main follow-up expected — this is
    confirmation-only. Clean up any test-tactic / stamp edits (`git checkout`
    the touched `intentions/*.md` and stamp files so no experimental mutation
    leaks), then manually clear the node's `office_hours` park and let it
    continue its normal ladder:


    - Read the node, set `office_hours` to null, write it back, and
    `graph-commit` from a state where `HEAD == origin/main` (the standard
    clear-park inverse of `park-node`). No phase override, no needs-main
    routing.


    ### If either check reveals an actual bug


    That is new information, not this park's scope — it means the fix is
    incomplete. Don't patch it inline from the office-hours session. Escalate it
    as a fresh code-fix against PR #2881's branch: either a new tactic/issue
    scoped to the specific failing behavior (name which of
    `dispatch-select-tick`, `dispatch-graph-scope-sweep`, or
    `dispatch-graph-execute` case `13)` misbehaved and how), or route the PR
    through a `fix-checks` pass. Keep the node parked (`office_hours` intact)
    until that fix lands, rather than clearing it.
pace_exempt: false
rounds: null
attributes: {}
---
# Two-phase tick: run all scriptable non-worker dispositions (incl. the scope-stale demote, moved ahead of selection) before the worker-group spawn, so metadata writes never consume the launch budget

## Context

A dispatch tick must finish by managing worker count. Today it does not when a
selected node resolves to a metadata-only disposition. The scope-staleness
demote runs at worker-**launch** time: `provision-node-worktree` re-validates the
selected node, `check-node-selection.ts`'s scope-chain check (check 5) returns
exit 13, and `dispatch-graph-execute`'s `13)` case demotes the node
`review→implement` and launches **nothing** — but `dispatch-select-tick` has
already spent a `SPAWN_N` slot selecting that node. So the tick ends having
launched zero workers. Observed live 2026-07-16: a manual tick with `SPAWN_N=1
(headroom=5, gap=0, live=3)` selected `tactic-participation-log-instrument`,
demoted it review→implement (scope drift), and launched nothing.

The contract (recorded on `strategy-graph-native-dispatch`, scriptable-then-spawn
clarification, strategy lines 1542–1575): a tick runs two ordered phases —
(1) ALL scriptable, non-worker dispositions to completion, then (2) one
worker-group selection-and-spawn sized to the pace target against the state
phase 1 produced. `SPAWN_N` counts workers actually **LAUNCHED**, never selection
slots a metadata write can silently spend. The scope-staleness demote is a
phase-1 disposition (the strategy lists it alongside the reconcile sweep,
out-of-band absorptions, parks, node reaps, census births) that today wrongly
runs in phase 2. This tactic moves it into phase 1.

**Surface note (greenfield-relevance):** the touched scripts are graph-native
router code — `dispatch-graph-execute`, `check-node-selection.ts`, and the graph
path of `dispatch-select-tick` — the target design's own owned code, not the
draining legacy gh lane (`tactic-legacy-router-removal`). Not doomed surface.

## Units of work

### Unit 1 — Pure scope-stale enumeration in intentionsutil

**Recommended model:** opus — router-selection correctness. Mis-handling the
stamp fail-open or the phase/liveness filter silently under- or over-demotes
in-flight tactics; the semantics (which nodes are scope-stale with no live
worker) are the load-bearing core of the whole fix.

**Scope.** Add an exported pure function — `listScopeStaleTactics` — to
intentionsutil that returns the tactic ids the pre-selection sweep must demote.
Signature (offline-testable; liveness is dependency-injected, never read inside):
given the loaded graph nodes, the stamp directory
(`<repo>/.claude/worktrees/`), and the set of live node ids, return each node
where **all** hold: `kind === "tactic"`; `office_hours` is null; `phase ∈
{fix, qa, review}` (`SCOPE_CHAINED_PHASES`, `check-node-selection.ts:60`); the
node id is **not** in the live set; a scope-fingerprint stamp file
`<stamp-dir>/<id>.scope-fingerprint` exists; and its stamped fingerprint (the
first whitespace-delimited field) `!==` the node's current
`tacticScopeFingerprint(statement, body)`. A **missing** stamp is **not** stale
(bootstrap fail-open parity with `check-node-selection.ts:220–230`).

- Home the function next to the existing scope-chain logic — either in
  `packages/intentionsutil/src/router.ts` beside `tacticScopeFingerprint`
  (`router.ts:112–114`), or a small new `src/scope-sweep.ts` re-exported from the
  package index; match whatever the store/router modules already do for
  node-set helpers.
- Read node bodies with the same `readNodeBody` helper
  `check-node-selection.ts` uses, and read the stamp with the same
  `<id>.scope-fingerprint` path convention and first-field parse
  (`check-node-selection.ts:210–233`, `demote-node-to-implement:45–61`). Do not
  duplicate the fingerprint or stamp-format logic — reuse it.
- Add unit tests in `packages/intentionsutil/test/scope-sweep.test.ts` (or
  extend `check-node-selection.test.ts`): a stale fix/qa/review node → returned;
  a matching-stamp node → excluded; a missing-stamp node → excluded (fail-open);
  an `implement`/`main-qa`/`done` node → excluded (phase filter); a stale node
  whose id is in the live set → excluded; a parked (`office_hours` set) node →
  excluded.

**Out of scope:** any graph mutation, any shell/liveness gathering, any
`demote-node-to-implement` call — Unit 1 is pure read-only enumeration.

**Anchors:** `packages/intentionsutil/src/router.ts:95–114`
(`tacticScopeFingerprint`), `packages/intentionsutil/scripts/check-node-selection.ts:60`
(`SCOPE_CHAINED_PHASES`), `:210–241` (scope-chain check 5 — the per-node analog
this generalizes), `:220–230` (missing-stamp fail-open),
`packages/intentionsutil/src/store.ts` (graph loader / `readNodeBody`).

### Unit 2 — Pre-selection scope-stale sweep, wired into the tick

**Recommended model:** opus — this is the ordering-critical change the whole
tactic exists for (phase-1-before-selection) plus the `claude agents` liveness
gathering (a known sandbox trap) and correct placement relative to the existing
Step 1d sweeps.

**Scope.** Add a shell sweep that runs the Unit-1 enumeration and demotes each
returned node **before** selection, then wire it into the tick's pre-selection
disposition block.

- New helper script `.claude/skills/dispatch-propagate/scripts/dispatch-graph-scope-sweep`
  (peer of `dispatch-graph-census`): gather the live node-id set from
  `claude agents --json` via the `lib-claude-agents.sh` helpers
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`
  — the `claude_sessions_under`/liveness helpers); invoke the Unit-1 enumerator
  (a thin `tsx` entry printing the stale ids, one per line, passing the live set
  in); for each stale id run `demote-node-to-implement <id>` and echo a
  `scope-stale <id>` passthrough line; keep it best-effort (a failed demote logs
  and continues, matching the other Step 1d sweeps).
- Wire the call into `dispatch-select-tick` **Step 1d** disposition block
  (`dispatch-select-tick:416–487`), after `reconcile-graph-merged`
  (`:454–469`) and `dispatch-graph-census` (`:471–484`) and **before** the
  concurrency gate / selection (Step 3, `graph-select-target` at `:862–863`),
  echoing its passthrough lines exactly as the sibling sweeps do.
- The sweep does **not** re-implement selection or the ledger; it only mutates
  phase via the existing primitive, so it is a plain phase-1 disposition.

**Dependencies:** Unit 1 (the enumerator it calls).

**Sandbox note:** `claude agents --json` returns `[]` under the sandbox's
network-namespace isolation (`.claude/rules/sandbox.md`) — the helper and any
verification of it must run with `dangerouslyDisableSandbox: true`, or a live
node is wrongly swept. Follow the same convention the other liveness callers use.

**Anchors:** `dispatch-select-tick:416–487` (Step 1d sweep block, insertion
point), `:454–469` (`reconcile-graph-merged` — pattern to mirror),
`:471–484` (`dispatch-graph-census` — closest structural peer),
`packages/intentionsutil/scripts/demote-node-to-implement` (the demote
primitive, `demote-node-to-implement <node-id>`),
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` (liveness).

### Unit 3 — Demote the launch-time exit-13 path to a documented safety net

**Recommended model:** sonnet — localized, well-specified shell edit mirroring an
adjacent case.

**Scope.** With the sweep (Unit 2) handling the common case pre-selection, the
launch-time `13)` path becomes a safety net for residual staleness introduced
**between** the sweep and launch (a concurrent author/session edit). Two changes
in `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`:

- **Add `reservation_clear "$id" || true`** to the `13)` case
  (`dispatch-graph-execute:208–217`) — today it demotes but does **not** clear
  the reservation (unlike the `12)` stale-selection case at `:204–207` which
  does). Without the clear, the demoted node's slot stays counted and the node
  is not freed for next-tick re-selection. Clearing it makes the skip fall to
  next-tick re-selection — the existing worker-DEATH recovery path — so the
  demoted node (now at `implement`) is picked next tick.
- **Update the comments** on the `13)` case and the stdout-contract doc comment
  (`dispatch-graph-execute:57`) to state the demote now normally happens in the
  pre-selection sweep (Unit 2); this launch-time path remains only as the
  post-sweep safety re-check, and its rare skip is a next-tick re-selection, not
  a routine under-fill.

**Out of scope:** the exit-13 producer itself (`check-node-selection.ts` check 5
and `provision-node-worktree`) stays as the safety re-check — unchanged.

**Dependencies:** none (independent of Units 1–2, but only meaningful once Unit 2
lands the pre-selection sweep).

**Anchors:** `dispatch-graph-execute:208–217` (`13)` case),
`:204–207` (`12)` case — the `reservation_clear` pattern to mirror),
`:57` (stdout-contract doc comment).

## Reuse

- `packages/intentionsutil/scripts/demote-node-to-implement` — the existing
  backward-transition primitive (demote to `implement`, clear
  `execution.markers`, land via `graph-commit`); called from the sweep instead
  of only from the launch path.
- `tacticScopeFingerprint` (`packages/intentionsutil/src/router.ts:112–114`) and
  the scope-chain check-5 logic (`check-node-selection.ts:210–241`,
  `SCOPE_CHAINED_PHASES` at `:60`, fail-open at `:220–230`) — the Unit-1
  enumerator generalizes this per-node check to a graph-wide sweep; do not
  re-derive the fingerprint or stamp format.
- The Step 1d sweep pattern in `dispatch-select-tick:416–487`
  (`reconcile-graph-merged`, `dispatch-graph-census`) — capture sub-script
  stdout, echo prefixed passthrough lines, best-effort continue.
- `lib-claude-agents.sh` liveness helpers and the `reservation_clear` helper
  already in `dispatch-graph-execute` / the ledger — the sweep and the safety
  net reuse them; selection stays the ledger's enforcement point.

## Verification

```verify
# Unit 1 — enumerator unit tests (CI-equivalent form: root at repo root,
# select the intentionsutil project so hoisted deps resolve).
npx vitest run --project packages/intentionsutil --root .
```

End-to-end (manual, `dangerouslyDisableSandbox` for the `claude agents`
liveness read):

- Reproduce the live case. Take a tactic in `fix`/`qa`/`review` whose scope
  changed after its phase-start stamp (edit its body so
  `tacticScopeFingerprint` differs from the stamped value) and with **no** live
  worker. Run a manual tick with `headroom > 1`. Confirm the tick both
  (a) demotes the node `review→implement` in the **phase-1 sweep** (a
  `scope-stale <id>` line appears before the selection decision line) **and**
  (b) launches a worker in phase 2 — the demoted node now at `implement`, or the
  next-ranked task — rather than ending with 0 workers.
- **Single-pass convergence** (no loop needed): confirm a node demoted to
  `implement` is not re-swept — `implement ∉ SCOPE_CHAINED_PHASES`, so the sweep
  is one pass and phase-2 selection spawns it directly. There is no
  select→demote→select ping-pong to bound.
- **Liveness guard:** confirm a scope-stale node that **does** have a live worker
  is **not** swept (its in-flight worker owns the phase; the worker-start and
  transition-time gates handle it).
- **Safety net:** simulate residual staleness (edit the node between the sweep
  and launch so provision returns exit 13). Confirm the `13)` path demotes,
  **clears the reservation**, and the node is re-selected on the next tick — no
  permanently-held slot, no under-fill loop.
