---
id: tactic-multiserve-fingerprint-stamp
kind: tactic
statement: Per-strategy strategy_fingerprint stamps — a single stamp
  false-freezes every other serving strategy of a multi-serves tactic; make the
  stamp a per-strategy map
owner: ai
status: codified
parent: null
rationale: "Found by the 2026-07-11 freeze re-evaluation of
  strategy-attention-surface: the soft-freeze compares
  execution.strategy_fingerprint (one string) against EVERY serving strategy's
  current substance fingerprint (router.ts freeze scan, compute-freshness.ts
  transition gate), while mint-time stamping writes only the decomposing
  strategy's fingerprint. An honest multi-serves tactic (artifact-owner
  placement, strategy-graph-native-dispatch clarification 27) is therefore born
  permanently stale against its other serving strategies — no string equals two
  different substance hashes. Observed live: tactic-fork-derivative-sensor and
  tactic-goals-page-mount-views froze strategy-attention-surface's whole subtree
  while each stamp was FRESH against its primary strategy;
  tactic-ratchet-teeth-census froze strategy-reversible-institution the same
  way. Re-stamping with the frozen strategy's fingerprint would freeze the
  primary strategy instead — a ping-pong of re-evaluation sessions. The interim
  fix nulled both attention-surface stamps (null is never stale), trading away
  mid-flight-edit protection until this lands; every future align round minting
  a multi-serves tactic recreates the freeze until then."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Per-strategy strategy_fingerprint stamps — a single stamp false-freezes every other serving strategy of a multi-serves tactic; make the stamp a per-strategy map

## Context

The soft-freeze trigger (strategy-graph-native-dispatch clarification 10)
compares `execution.strategy_fingerprint` — a single string — against the
current substance fingerprint of **every** serving strategy of a tactic:

- Selector freeze scan: `packages/intentionsutil/src/router.ts:233-247`
  (`selectGraphTargets`), children resolved via `servingStrategyIds`
  (`router.ts:133`).
- Transition freshness gate:
  `packages/intentionsutil/scripts/compute-freshness.ts:92-105`, which loops
  `servingStrategyIds` and calls `isStrategyStale`
  (`packages/intentionsutil/src/transitions.ts:355-363`).

Mint-time stamping writes only the *decomposing* strategy's fingerprint. An
honest multi-serves tactic — `serves` naming every strategy whose artifact it
changes, per artifact-owner placement (strategy-graph-native-dispatch
clarification 27) — is therefore born permanently stale against its other
serving strategies: no single string can equal two different substance
hashes.

Observed 2026-07-11: `tactic-fork-derivative-sensor` (stamp equal to
strategy-distribute-workflow's current fingerprint) and
`tactic-goals-page-mount-views` (stamp equal to strategy-graph-mounts')
froze strategy-attention-surface's entire subtree;
`tactic-ratchet-teeth-census` froze strategy-reversible-institution the same
way. Re-stamping with the frozen strategy's fingerprint would freeze the
primary strategy instead — a non-terminating ping-pong of re-evaluation
sessions. The 2026-07-11 re-evaluation cleared the attention-surface freeze
by nulling both stamps (a null stamp is never stale), which trades away the
mid-flight-edit protection those stamps existed to provide. Every future
align round that mints a multi-serves tactic recreates the freeze until this
fix lands.

**Greenfield design**: the stamp becomes a per-strategy map
`Record<strategy-id, fingerprint>`. A serving strategy is stale iff the map
carries a key for it AND the value differs from that strategy's current
fingerprint; a serving strategy absent from the map is never stale
(per-strategy null semantics, matching today's null-stamp rule). A
re-evaluation of strategy S re-stamps only the S entry, leaving other
entries untouched.

**Migration path** (single PR, no state migration commit): the validator
accepts the legacy bare-string form transiently and preserves today's
compare-against-all semantics for it; every writer emits map form from now
on; remaining legacy strings convert by natural churn — each re-stamp or
re-evaluation rewrites the field. No `intentions/*.md` rewrite rides this
PR.

Implement each unit in a subagent launched with the unit's recommended model
(Agent/Task tool, `model: sonnet` or `model: opus`), passing the unit's
context and scope; constrain it to working-tree edits only.

## Units of work

### Unit 1 — schema, freeze semantics, writers, tests

Recommended model: opus

Scope:

- `packages/intentionsutil/src/schema.ts:328-334` — `Execution` interface:
  `strategy_fingerprint: string | Record<string, string> | null` (document
  the string form as deprecated-legacy). `validateExecution`
  (`schema.ts:388-399`) validates the map form: plain object, string values;
  keep the existing string acceptance for the legacy form.
- `packages/intentionsutil/src/transitions.ts:355-363` — `isStrategyStale`
  gains the serving strategy id:
  `isStrategyStale(execution, strategyId, currentFingerprint)`. Legacy
  string: stale iff it differs (today's behavior). Map: stale iff the map
  has a `strategyId` key whose value differs from `currentFingerprint`.
  Null / missing key: never stale.
- `packages/intentionsutil/src/router.ts:233-247` — the freeze scan's stale
  filter uses the per-strategy semantics (it already iterates per
  (strategy, child) pair; route the comparison through the updated
  `isStrategyStale` rather than the inline `!==`).
- `packages/intentionsutil/scripts/compute-freshness.ts:92-105` — pass each
  `sid` into `isStrategyStale`.
- `packages/intentionsutil/scripts/apply-node-transition.ts:84-86,133-136`
  — `--strategy-fingerprint` currently takes a bare hash and cannot say
  which strategy it belongs to. Change it to a repeatable
  `--strategy-fingerprint <strategy-id>=<hash>` form that merges entries
  into the map (preserving other keys); reject the bare form with a clear
  error (code-style rule: clear errors over fallbacks).
  `defaultExecution` (`apply-node-transition.ts:103`) keeps
  `strategy_fingerprint: null`.
- `packages/intentionsutil/scripts/check-node-selection.ts:93-98` — the
  fingerprint check handles the map form (follow that script's existing
  comparison intent for the first-class vs squatted stamp).
- Tests (`packages/intentionsutil/test/`): `router.test.ts` (multi-serves
  fixture — a tactic serving two strategies with a map stamp fresh against
  both produces NO freeze event; a map entry stale against one strategy
  freezes only that strategy; legacy string behaves as today),
  `transitions.test.ts` (per-strategy `isStrategyStale` cases),
  `schema.test.ts` (map validation, legacy string acceptance, malformed map
  rejection), `apply-node-transition.test.ts` (keyed stamp merge),
  `check-node-selection.test.ts` (map-form check).

Out of scope: rewriting existing stamped `intentions/*.md` nodes (natural
churn migrates them); consolidating the prose fingerprint recipe
(`tactic-fingerprint-recipe-single-callsite`, a separate draft); any change
to the scope-fingerprint (chain-of-custody) gate.

### Unit 2 — align-tactics skill text

Recommended model: sonnet

Dependencies: Unit 1.

Scope:

- `.claude/skills/align-tactics/SKILL.md` — the "Fingerprint honesty"
  paragraph in Step 5 still says no fingerprint machinery exists; replace it
  with the map convention: mint-time stamping writes
  `{<decomposed-strategy-id>: <fingerprint>}`; the "Re-evaluation mode"
  step 3 re-stamps only the re-evaluated strategy's entry, leaving other
  serving strategies' entries untouched. Keep both passages pointing at
  `strategyFingerprint` (`packages/intentionsutil/src/router.ts:82`) as the
  only computation path (never a hand-computed hash).

## Reuse

- `strategyFingerprint` — `packages/intentionsutil/src/router.ts:82` (the
  canonical substance hash; do not re-derive).
- `servingStrategyIds` — `packages/intentionsutil/src/router.ts:133`
  (serves + parent-chain membership; both freeze sites already use it).
- `isStrategyStale` — `packages/intentionsutil/src/transitions.ts:361`
  (single home of the staleness predicate; keep it that way).

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Prose: from the repo root, print
`selectGraphTargets(listNodes('intentions')).events` (a small
`node --import tsx/esm -e` one-liner importing from
`packages/intentionsutil/src/store.ts` and `router.ts`) before and after the
change: freeze events driven purely by a multi-serves stamp mismatch (the
class this fixes) must disappear, while a freeze from a genuinely edited
strategy (a map entry differing from that same strategy's current
fingerprint) must survive. If `tactic-ratchet-teeth-census` still carries
its single legacy stamp when this lands, its strategy-reversible-institution
freeze persisting under legacy-string semantics is expected until that
node's own re-evaluation re-stamps it — correct behavior, not a regression.
