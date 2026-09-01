---
id: tactic-strategy-fingerprint-stamp-coverage
kind: tactic
statement: "The strategy soft-freeze is inert: no open tactic serving
  strategy-graph-native-dispatch carries a strategy_fingerprint entry for it,
  because no production code path has ever written one -- wire the live-router
  stamp write through transition-node so a strategy edit has a real freeze blast
  radius"
owner: ai
status: codified
parent: null
rationale: "Measured 2026-07-28 during an /align-strategy round that amended
  this strategy's success_signal and attributes.conditions -- both inputs to
  strategyFingerprint (packages/intentionsutil/src/router.ts) -- using the
  authoritative predicate (readNode + isFingerprintStale), not a grep: the
  edit's freeze blast radius was ZERO. Finalized via /align-tactics 2026-08-03:
  the cause is now established, not merely hypothesized, and recorded in the
  body's Context section -- apply-node-transition.ts's stamp-merge logic is
  correct and already tested, but its only two production callers
  (transition-node, demote-node-to-implement) never pass
  --strategy-fingerprint/--strategy-sha, and the upstream compute-freshness.ts
  discards the hash it already computes; every one of the graph's existing
  stamps traces to a hand/session write, never the router. Re-measured at
  finalize time against a fresh origin/main: 46 open tactics serve this strategy
  (33 at the 2026-07-28 measurement), graph-wide 123 open tactics (108 at that
  measurement), 0 keyed to this strategy, 35 stamped some other way (29
  bare-string, 6 map-form). See the body for the full plan. A sibling
  malformed-shape defect (tactic-strategy-fingerprint-stamp-shape, serving a
  different strategy) is a related but distinct failure mode and is explicitly
  out of scope here."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.04
  rationale: >-
    Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim scale (50 /
    20 / 10) - dispatch-containment and evidence-custody work that follows the
    Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme.


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
phase: qa
execution:
  branch: tactic-strategy-fingerprint-stamp-coverage
  pr: 3023
  attempts: {}
  markers:
    - planned
  strategy_fingerprint:
    strategy-graph-native-dispatch:
      hash: fa468b7e6ffb9949e6bba0120a0d46a7b2312ff42969edfc2452f9d70125d7fc
      sha: fb1eba64f05751d8e8c4b606a06e1b40ae7c544d
  fix:
    since: 2026-08-03
    attempt: 1
    pushed_sha: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# The strategy soft-freeze is inert: no open tactic serving strategy-graph-native-dispatch carries a `strategy_fingerprint` entry for it, because no production code path has ever written one — wire the live-router stamp

## Context

`strategy_fingerprint` is the soft-freeze trigger of strategy clarification 10: when a strategy's substance changes, its open tactics whose stamped hash no longer matches are frozen out of their normal phase skill and re-surface as `/align-tactics` re-evaluation candidates (`packages/intentionsutil/src/router.ts:397-409` and the soft-freeze scan at `:462-480`). The predicate is `isStrategyStale` → `isFingerprintStale` (`packages/intentionsutil/src/transitions.ts:483-507`), which treats a **null stamp** and a **map lacking the strategy's key** as NOT stale — by design, so a tactic is never born frozen against a strategy it does not yet track.

The consequence, measured with the authoritative predicate (never a grep — `strategy_fingerprint: null` matches a grep for the field name; `.claude/skills/align-strategy/SKILL.md:606-616`):

**Measurement re-run 2026-08-03 against `origin/main` at `71512715`** (the 2026-07-28 rationale figures have since moved; these supersede them):

- Open tactics (`phase` set, not `draft`, not `done`) serving `strategy-graph-native-dispatch` — resolved through `servingStrategyIds` (`router.ts:162`), which walks the `parent` chain, not a frontmatter grep: **46**.
- Of those 46: **0** carry a map entry keyed `strategy-graph-native-dispatch`; **0** carry a legacy bare string; **46** are null (of which **15** carry `execution: null` outright). `isStrategyStale` returns **false for all 46**. A `/align-strategy` edit to this strategy has a freeze blast radius of **zero**.
- Graph-wide: **123** open tactics, **35** carrying any stamp — **29** deprecated bare-string, **6** map-form.

**The cause is now established, not hypothesized.** Confirm it in Unit 1, do not re-derive it:

1. `apply-node-transition.ts` is the only code in the repo that can write the field. It merges a keyed `<sid>=<hash>` map into `execution.strategy_fingerprint`, preserving other keys and converting a legacy bare string on re-stamp (`packages/intentionsutil/scripts/apply-node-transition.ts:91-130` parse, `:165-173` merge). It is **correct and already tested** (`packages/intentionsutil/test/apply-node-transition.test.ts:115-226`). The defect is not here.
2. It has exactly two production callers, and **neither passes the flags**: `.claude/skills/dispatch-propagate/scripts/transition-node:208-216` builds `APPLY_FLAGS=("$NODE_ID")` and appends only `--strategy-stale` and `--set-pr`; `packages/intentionsutil/scripts/demote-node-to-implement:104` passes only `--scope-stale`. A repo-wide grep for `--strategy-fingerprint` / `--strategy-sha` outside `.md` files returns **only** `packages/intentionsutil/test/apply-node-transition.test.ts`. So `args.strategyFingerprint` is `null` on every production invocation and the merge branch has never executed.
3. `transition-node` has nothing to forward even if the flag were added: `compute-freshness.ts` computes `strategyFingerprint(strategy)` per serving strategy inside its staleness loop and then **discards the hash**, returning only booleans (`packages/intentionsutil/scripts/compute-freshness.ts:67-72` `FreshnessResult`, `:93-107` the loop). `transition-node:254` reads the field only to print `held … (strategy-fingerprint freeze)`; it never writes it.
4. Every existing stamp traces to a hand/session write, not the router. `intentions/tactic-sync-reader-skill.md`'s stamp entered in commit `02f02bd5` (2026-07-09, "graph: tactic-sync-reader-skill implement->qa") as a hand-written bare string during the pre-script era; the map-form stamps on `tactic-dispatch-config-template` / `tactic-wezterm-windows-install-lock-resilient` (`2ef620ce`) and `tactic-node-toolchain-single-source` / `tactic-practitioner-support-boundary` (`8f974053`) entered in `/align-*` round-landing commits — the bootstrap-interim hand-stamp of `.claude/skills/align-tactics/references/write-path.md:290-330`. **Automated coverage is 0 graph-wide, structurally, not just under this strategy.**
5. The doctrine is self-contradictory, which is why the manual step is skipped. `write-path.md:111-135` (esp. `:123-124`) instructs "Leave `execution: null`" for every minted/finalized tactic; `write-path.md:290-330` says the session hand-stamps `{hash, sha}` at mint time and admits at `:320-321` that "a tactic not yet advanced still carries `execution: null` (no map to stamp); the map is seeded the first time an `execution` object exists" — but no execution-creating call site (`apply-node-transition.ts:133-135`, `apply-fix-state.ts:159`, `park-node:257-262`) seeds the map when it creates that first object. `tactic-target.md:61-76` closes the loop: re-stamping fires only on an already-stale tactic and explicitly skips a tactic at `execution: null`. `router.ts:408-409` states the rule that makes the cycle unbreakable: "Null fingerprints are not stale — stamping starts when the align machinery lands." Nothing lands it.

**Intended outcome:** the live router seeds and refreshes the per-strategy stamp map at every forward phase transition, so a strategy edit thereafter has a real, non-zero freeze blast radius; the measurement becomes a committed, repeatable census rather than an ad-hoc scan.

### Ideal greenfield design (recorded; NOT this PR)

`strategy_fingerprint` records **custody of the strategy substance the plan was authored against**. Custody is taken at *plan* time, not at *execution* time, so in a from-scratch design it is a first-class node field written by the plan writer (`write-node.ts`), required for any tactic landing with a non-draft `phase`, and enforced by a `validate-graph` rule that rejects a non-draft tactic missing a `{hash, sha}` entry for every serving strategy. Under that design the "no map to stamp because `execution` is null" circularity cannot exist, the freeze covers a tactic's whole life including its longest phase (`implement`), and the stamp is unforgettable because the write fails loud.

### Brownfield migration path (what is in scope, and what is deferred)

Arming the greenfield validation rule today would fail `validate-graph` on all 46 open children at once, so coverage must be grown before the ratchet is armed. Sequenced:

1. **This PR** — wire the live-router producer (transition time) so coverage begins accruing on every transition, and land the census that measures it.
2. **Follow-up, not this PR** — make mint-time stamping real in code: a `--strategy-fingerprint-sha <sha>` flag on `write-node.ts` that seeds `execution.strategy_fingerprint` for every serving strategy when landing a tactic at a non-draft `phase`, called from the `/align-tactics` write path.
3. **Follow-up, not this PR** — arm the `validate-graph` rule once open-tactic coverage reaches 100%, and drop the deprecated bare-string form (already sequenced as "migration step 4" at `write-path.md:327-330`).

Steps 2 and 3 should be minted as a sibling tactic serving this strategy. This plan authors no graph writes; it records the recommendation only.

### Explicitly out of scope

- **No bulk backfill** of stamps onto the 46 existing open tactics. Backfill is not the fix and must not substitute for it; coverage accrues from the producer.
- **No change to `isFingerprintStale` / `isStrategyStale` semantics.** The 29 existing bare-string stamps must keep passing the legacy branch (`transitions.ts:494-495`) unchanged, and an absent key must keep reading not-stale.
- **The malformed-shape defect** (a flat `{hash, sha}` with no strategy-id key — `tactic-node-toolchain-single-source`, `tactic-practitioner-support-boundary`) belongs to the sibling `tactic-strategy-fingerprint-stamp-shape`, which serves `strategy-graph-self-description`. Do not fold it in; do not "fix" those two nodes here.
- **A mis-keyed stamp defect found during this planning pass and owned by neither tactic:** `intentions/tactic-sync-reader-skill.md` `serves: [strategy-philosophical-grounding]` but carries a stamp keyed `strategy-graph-native-dispatch` — a stamp for a strategy it does not serve, inert in both directions. Record it in Unit 1's census output; do not repair it here.
- `dispatch-graph-execute` plays no part: it calls neither `transition-node` nor `apply-node-transition.ts`. Do not touch it.

---

## Unit 1 — Confirm the diagnosis and land a repeatable stamp census

**Scope**

Deliver `packages/intentionsutil/scripts/strategy-stamp-census.ts` (new) plus `packages/intentionsutil/test/strategy-stamp-census.test.ts` (new), and export one helper from `packages/intentionsutil/src/router.ts`.

1. **Confirm, do not re-derive.** Re-run the five numbered checks in ## Context against a freshly-fetched `origin/main` (`git fetch origin main` first). Specifically re-verify: (a) `grep -rn -- "--strategy-fingerprint\|--strategy-sha" .claude packages | grep -v '\.md:'` returns only `packages/intentionsutil/test/apply-node-transition.test.ts`; (b) `.claude/skills/dispatch-propagate/scripts/transition-node:208-216` still appends only `--strategy-stale` / `--set-pr`; (c) `packages/intentionsutil/scripts/compute-freshness.ts:107` still returns booleans only. **If any check contradicts the recorded diagnosis, STOP** — do not proceed to Unit 2 on a different theory; record the contradiction and escalate to office hours, because Unit 2's design depends on this causal chain.
2. **Export `isOpenTactic` from `router.ts`.** It is currently module-private (`packages/intentionsutil/src/router.ts:151-155`, over private `isDraft` at `:147-149`). Add `export` to `isOpenTactic` only — leave `isDraft` private. Duplicating an open-phase set in the new script is not acceptable; the census must use the router's own definition of "open".
3. **Write `strategy-stamp-census.ts`.** Network-free, `readNode`/`listNodes`-based. Structure it on `packages/intentionsutil/scripts/graph-census-debt.ts:1-55` — a long header doc comment stating *why the script exists* (this is where Unit 1's confirmed diagnosis is recorded durably: the flag-passing gap, the doctrine contradiction, and the "all 35 stamps are hand-written" finding), an exported pure function, an `Args` parser, and a `main()` guarded by the `import.meta.url === pathToFileURL(process.argv[1]).href` idiom.
   - Usage: `node --import tsx/esm packages/intentionsutil/scripts/strategy-stamp-census.ts [--intentions <dir>] [--strategy <strategy-id>]`.
   - Exported `strategyStampCensus(dir: string): CensusResult`. For every `kind: "strategy"` node, over its open tactics (`isOpenTactic`, membership via `servingStrategyIds(tactic, byId)` — the parent-chain walk, `router.ts:162`), classify each child's `execution.strategy_fingerprint` into exactly one bucket: `keyed` (object with a key for this strategy), `misKeyed` (object, non-empty, no key for this strategy — includes the flat `{hash, sha}` shape), `bareString`, `nullStamp` (covers both `execution: null` and `strategy_fingerprint: null`). Also record `stale` via `isStrategyStale(child.execution, sid, strategyFingerprint(strategy))`.
   - Output one JSON object on stdout: per-strategy counts plus a graph-wide roll-up (`openTactics`, `anyStamp`, `bareString`, `mapForm`) and, per strategy, the id list per bucket so a reader can act on it. `--strategy <id>` narrows to one strategy.
   - Use `strategyFingerprint` from `router.ts:111-121` and `stampHash` from `transitions.ts:462` — never re-derive the hash recipe or re-implement staleness (`write-path.md:307-309`).
4. **Test it** with a temp-dir fixture store (follow `packages/intentionsutil/test/graph-census-debt.test.ts` for fixture construction): a strategy with one keyed-fresh child, one keyed-stale child, one bare-string child, one `execution: null` child, and one mis-keyed child; assert each lands in its bucket and that only the keyed-stale one counts as `stale`.

Out of scope for this unit: any change to `transition-node`, `compute-freshness.ts`, or `apply-node-transition.ts`; any node-file edit under `intentions/`.

**Recommended model:** opus

---

## Unit 2 — Wire the live-router stamp write through `transition-node`

**Scope**

Change `packages/intentionsutil/scripts/compute-freshness.ts`, `.claude/skills/dispatch-propagate/scripts/transition-node`, and the tests below. **Do not modify `apply-node-transition.ts`** — its CLI contract (repeatable `--strategy-fingerprint <sid>=<hash>`, plus one shared `--strategy-sha <sha>`, both required together) is correct and is the contract to consume verbatim.

1. **`compute-freshness.ts` — surface the hashes it already computes.**
   - Widen `FreshnessResult` (`:67-72`) with `strategyFingerprints: Record<string, string>` — serving-strategy id → current substance hash.
   - In the loop at `:97-105`, populate that map for **every** serving strategy that resolves in the snapshot. The loop currently `break`s on the first stale strategy; restructure so all hashes are collected while `strategyStale` keeps its exact current meaning (true iff *any* serving strategy is stale). No behavior change to `scopeStale`, `strategyStale`, `stampMissing`, or `nodeOnMain`.
   - The early return at `:78-80` (node absent from the `origin/main` snapshot) must also return `strategyFingerprints: {}` so the shape is uniform.
   - Update the stdout-shape comment at `:26-28`.
2. **`transition-node` — pass the flags, on the fresh path only.**
   - After the `git fetch origin main` at `:94-97` and alongside `FRESH_BLOB` at `:98`, resolve the **commit** sha: `MAIN_SHA="$(git -C "$REPO_ROOT" rev-parse origin/main)"`, failing loud on error (`.claude/rules/code-style.md` — no fallback). `FRESH_BLOB` is the node file's **blob** sha (`rev-parse origin/main:intentions/<id>.md`) and is the wrong value for `--strategy-sha`; do not reuse it. Resolving it from the same fetched ref that the `git archive origin/main` snapshot at `:182` reads keeps hash and sha consistent.
   - After `STRATEGY_STALE` is read at `:190`, extract the new map with `jq` from the same `$FRESH` blob already in hand (use a here-string, `jq -r … <<<"$FRESH"`, matching `:189-190` and `.claude/rules/shell-json.md` — never `echo "$VAR" | jq`).
   - Append to `APPLY_FLAGS` (`:208-210`) one `--strategy-fingerprint "<sid>=<hash>"` pair per map entry, plus a single `--strategy-sha "$MAIN_SHA"` — **only when `STRATEGY_STALE == "false"` and the map is non-empty.** Append nothing when the map is empty (`apply-node-transition.ts:118-123` throws if `--strategy-sha` arrives without a `--strategy-fingerprint`, and a bare `--strategy-fingerprint` with no `=` is rejected at `:94-99`).
   - **The `STRATEGY_STALE == true` guard is load-bearing, not defensive.** On a stale stamp `apply-node-transition` *holds* the phase (`transition-node:250-253` prints `held … (strategy-fingerprint freeze)`). If the fresh hash were written on that path, the hold would re-stamp itself fresh and the very next tick would see a non-stale node — the freeze would silently self-clear without the `/align-tactics` re-evaluation it exists to trigger. Re-stamping a *stale* node is the re-evaluation's job (`tactic-target.md:61-76`), never the transition's.
   - The scope-stale demotion branch (`:198-206`) returns before `APPLY_FLAGS` is built, so it needs no change.
   - Update the script's freshness-gate header comment (`:28-35`) to state that a forward transition now seeds/refreshes the per-strategy stamp map, and that a held (stale) transition deliberately does not.
   - Resulting semantics, which must be stated in the code comment: **null → seeded** at the first forward transition; **fresh → refreshed** (hash unchanged, `sha` advanced); **stale → held and left stale** until re-evaluation re-stamps it.
3. **Tests.**
   - New `packages/intentionsutil/test/compute-freshness.test.ts`: over a temp fixture store, assert `strategyFingerprints` carries an entry for **every** serving strategy (including a multi-serves tactic and a parent-chain-inherited strategy), that each value equals `strategyFingerprint(strategy)`, that `strategyStale` is still true when any one is stale, and that the node-absent early return yields `{}`.
   - Extend `packages/intentionsutil/scripts/test-transition-node.sh` — this is the tactic's mandated end-to-end assertion ("a node transitioned through the graph lane comes out with a `{hash, sha}` map entry for each serving strategy"), and it must exercise the real `transition-node` bash, not `apply-node-transition.ts` in isolation (already covered at `apply-node-transition.test.ts:115-226` — do not re-test the merge logic). Note the harness PATH-shims `node` and pattern-matches the four `node --import tsx/esm` call sites (`:95-135` setup, `:240-275` the `compute-freshness.ts` and `apply-node-transition.ts` shims), and that CI runs it with **no `node_modules` and no `tsx`** (`:23-35`) — the shims must stay pure bash/jq.
     - Update the `*compute-freshness.ts` shim (`:245-260`) to emit the new `strategyFingerprints` field.
     - Add a case: forward transition with `strategyStale:false` → assert `apply-node-transition.ts` received `--strategy-fingerprint <sid>=<hash>` for each seeded strategy **and** `--strategy-sha <a 40-hex commit sha, not the node blob sha>`; have the `*apply-node-transition.ts` shim record its argv to a file the assertion reads.
     - Add a case: `strategyStale:true` → assert the transition holds **and** that neither `--strategy-fingerprint` nor `--strategy-sha` was passed.
   - No new CI wiring needed: `test-transition-node.sh` is already a step in `.github/workflows/unit-tests.yml:239-240`.

Out of scope: `apply-node-transition.ts`, `demote-node-to-implement`, `park-node`, `apply-fix-state.ts`. Those three also construct a default `execution` without a stamp (`apply-node-transition.ts:133-135`, `apply-fix-state.ts:159`, `park-node:257-262`); under this design the map is seeded at the next forward transition instead, which is acceptable — note it, do not change them.

**Recommended model:** opus

**Dependencies:** Unit 1 (its confirmation gates whether this design is the right fix).

---

## Unit 3 — Reconcile the stamp doctrine and ratchet it

**Scope**

The doc contradiction is why the manual step was skipped for a year of mints; leaving it standing beside a working producer guarantees the next reader re-breaks it.

1. **`.claude/skills/align-tactics/references/write-path.md`.**
   - At `:111-135` (the "Leave `execution: null`" instruction, `:123-124`): keep the instruction, but state explicitly that this is correct *because* the live router now seeds the per-strategy map at the tactic's first forward transition — with a pointer to `transition-node`'s `APPLY_FLAGS` block. Remove the implication that a mint-time hand-stamp is expected on a node this step just wrote as `execution: null`.
   - At `:290-330` ("Fingerprint honesty"): replace the "bootstrap-interim hand-stamp path … a live router passes it through `apply-node-transition.ts --strategy-sha`" framing with what is now true — the live router **does** pass it, via `transition-node` → `apply-node-transition.ts`, on every non-held forward transition, for every serving strategy. Keep unchanged: the `strategy-fingerprint.ts` CLI as the only way to obtain a hash (`:301-309`), the never-emit-bare-string rule (`:322`), and the deprecation sequencing at `:327-330`.
   - Add a short, explicit residual note: transition-time seeding does **not** cover the window between mint and a tactic's first forward transition. A strategy edit landing while a tactic sits at `implement` is *laundered* by that first transition's fresh stamp. Closing that window is the deferred mint-time work in ## Context's migration path, step 2.
2. **`.claude/skills/align-tactics/references/tactic-target.md:61-76`** — the soft-frozen re-plan bullet: keep the re-stamp rule, and note that a tactic at `execution: null` will now be seeded by the router rather than staying permanently unstampable.
3. **`.claude/skills/align-strategy/SKILL.md`** — `:606-616` (measure via the predicate, never a grep) gains a pointer to the new `strategy-stamp-census.ts` as the runnable way to do that; `:631-645` and `:664-669` (materiality-scoped freeze, which today only ever *re-stamps* an existing entry and so structurally never engages) are updated to say the live router seeds the entry.
4. **Doctrine ratchet.** Add `.claude/skills/dispatch-propagate/scripts/test-strategy-stamp-doctrine.sh`, modeled on `.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh` (a prose/fenced-block guard, not a functional harness; it sources `dispatch-test-fixture.sh` and asserts per requirement so a regression in any one row is legible on its own). Keep it to four assertions: (a) `transition-node` constructs `--strategy-fingerprint` in `APPLY_FLAGS`; (b) `transition-node` guards that construction on the not-stale branch; (c) `write-path.md` names the router as the seeding producer; (d) `write-path.md` still forbids emitting the bare-string form. Wire it into `.github/workflows/unit-tests.yml` next to the other doctrine ratchets (`:225-231`).

Out of scope: any rewording of the fingerprint *recipe* or of `isFingerprintStale`'s documented semantics.

**Recommended model:** sonnet

**Dependencies:** Unit 2 (the docs must describe what actually landed).

---

## Reuse

Reuse these verbatim; write no new fingerprint, staleness, or landing logic.

- `packages/intentionsutil/src/router.ts:111-121` — `strategyFingerprint(strategy)`, the canonical sha256 substance-hash recipe (statement / clarifications / conditions / serves / success_signal / tooling_goals). Never re-derive it inline.
- `packages/intentionsutil/src/router.ts:162` — `servingStrategyIds(tactic, byId)`: the parent-chain walk that defines "serves". Returns a `Set` — spread it before `.includes`. A frontmatter grep on `serves:` is **not** equivalent and will undercount.
- `packages/intentionsutil/src/router.ts:147-155` — `isDraft` / `isOpenTactic` (private; Unit 1 exports `isOpenTactic`). The router's own definition of an open tactic.
- `packages/intentionsutil/src/router.ts:397-409, 462-480` — `selectGraphTargets`'s soft-freeze scan: the authoritative consumer whose behavior this fix restores.
- `packages/intentionsutil/src/transitions.ts:462` (`stampHash`), `:483-507` (`isFingerprintStale` / `isStrategyStale`) — the only interpreters of a stamp. Reuse directly.
- `packages/intentionsutil/src/schema.ts:436-494, 653` — `StrategyStampValue` / `validateStrategyFingerprint`: the map-of-`{hash, sha}` contract new writes must satisfy.
- `packages/intentionsutil/scripts/apply-node-transition.ts:91-130, 165-173` — the writer and its CLI contract. Consume it; do not change it, and do not invent a new flag shape.
- `packages/intentionsutil/scripts/strategy-fingerprint.ts:76-91` — `strategyFingerprintFor(dir, id)` and its CLI, the single runnable hash callsite named by both `write-path.md` and `tactic-target.md`.
- `packages/intentionsutil/scripts/compute-freshness.ts:74-108` — already computes the hashes Unit 2 needs; extend, do not duplicate.
- `packages/intentionsutil/scripts/graph-census-debt.ts:1-55` — the network-free census script shape (header doc comment, exported pure function, `Args` parser, `main()` guard) for Unit 1's new script.
- `packages/intentionsutil/src/store.ts:232` (`listNodes`) and `readNode` — the only store readers to use.
- `packages/intentionsutil/scripts/test-transition-node.sh:95-135, 240-275` — the `node`-shim harness (bash + git + jq only, no `node_modules` in CI) to extend for the end-to-end assertion.
- `packages/intentionsutil/test/apply-node-transition.test.ts:115-226` — existing merge/parse coverage. Evidence the writer works; do not duplicate it.
- `.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh` — the doctrine-ratchet template for Unit 3.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts` — the analogous script for the *other* (tactic-scope) fingerprint; structural reference only. Note it re-stamps but never mints, mirroring the gap fixed here.

## Verification

Run from the worktree root.

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
packages/intentionsutil/scripts/test-transition-node.sh
```

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-strategy-stamp-doctrine.sh
```

Manual / observe-in-production checks:

1. **Baseline census, before merge.** Run `node --import tsx/esm packages/intentionsutil/scripts/strategy-stamp-census.ts --strategy strategy-graph-native-dispatch` against a freshly-fetched `origin/main`. Record the four bucket counts in the PR body. As of `origin/main` `71512715` (2026-08-03) this must read approximately: 46 open children, 0 keyed, 0 bare-string, 46 null, 0 stale. The population drifts — the load-bearing assertion is **`keyed == 0`**, not the exact 46.
2. **Post-merge, after the first real transition (`needs-main`).** This is the only check that proves the producer fires in production and cannot be run pre-merge. After any tactic serving any strategy completes a phase through `transition-node` on `origin/main`, re-run the census and confirm that node moved from the `null` bucket to the `keyed` bucket with a `{hash, sha}` entry whose `hash` equals `npx tsx packages/intentionsutil/scripts/strategy-fingerprint.ts <serving-strategy-id>` and whose `sha` is a real `origin/main` commit (`git cat-file -t <sha>` → `commit`, not `blob`).
3. **Freeze non-regression, by inspection.** Confirm the graph-wide `bareString` count is unchanged by this PR (29 as of the baseline) — the legacy branch of `isFingerprintStale` must keep working untouched. Confirm no `intentions/*.md` file is modified by the PR diff: `git diff --stat origin/main -- intentions/` must be empty. Any stamp appearing on a node file in this PR's diff is the forbidden bulk backfill.
4. **Judgment call, for review.** Unit 2 stamps *every* serving strategy at transition time, which extends `write-path.md:311-321`'s mint-time rule of stamping only the decomposed strategy. Rationale to confirm at review: recording the current hash is honest (it never fabricates a *stale* stamp), and stamping only one strategy would leave a multi-serves tactic permanently un-freezable against its other parents — the exact inertness this tactic exists to fix. If the author rejects this, the fallback is to stamp only strategies already keyed in the map, which restores zero coverage and would mean parking this tactic rather than shipping a partial fix.

## Re-stamp orthogonality judgment (2026-09-01)

Re-stamped against the 2026-09-01 errata edits to
strategy-graph-native-dispatch. Judgment, recorded this time (the
2026-09-01 round's mechanical re-stamp recorded none - an
adversarial-review finding): this node's plan is stamp-coverage
machinery - which nodes carry fingerprint stamps and how they are
verified - and is orthogonal to the doctrine content of the amended
clarifications. The stamp shape itself is reconfirmed {hash, sha} by
migrated decision D5.
