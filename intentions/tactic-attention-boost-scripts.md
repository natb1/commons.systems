---
id: tactic-attention-boost-scripts
kind: tactic
statement: Script the author's attention-write operations — boost-to-top-rank
  (now) and tier-change (gated on the tier model) — each a considered act
  requiring a rationale, with the tier-change re-selecting a fresh boost in the
  target tier's per-tier namespace
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-21 /align-strategy interview. Today 'escalating an
  issue means authoring a boost on its tactic node' is a hand-edit of
  attention.boost; the author wants it scripted. Finalized 2026-07-31
  /align-tactics round: this plan delivers only the ungated boost-to-top-rank
  slice (a pure planner plus a preview/write CLI plus a landing wrapper with CAS
  + post-land verification). The tier-aware default and the distinct tier-change
  script are explicitly deferred — no tier concept exists in code yet, and
  tactic-attention-tier-ranking (PR #2997, unmerged and parked) has not shipped
  the per-tier boost namespace's storage shape; those units are follow-up work
  gated on that tactic landing."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-attention-boost-scripts
  pr: 3012
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-08-01
    attempt: 1
    pushed_sha: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

# Script the author's attention-write operations

## Context

Today, escalating work in the intention graph means hand-editing
`attention.boost` in a node's YAML frontmatter and eyeballing the result
against the selector. That hand-edit is error-prone in a specific, recurring
way: the `boost:` field holds a node's OWN authored claim, but ranking order is
the COMPOSED rank that `resolveAttention` produces by summing every distinct
source claim that flows into the node (down `parent`/`serves`, backward along
`blocked_by`). A boost sized against the raw `boost:` column of the current
leader therefore lands at #2, not #1 — the recorded failure mode. There is also
a hard schema ceiling (rule 18: no node's `attention.boost` may match or exceed
`strategy-main-health`'s live boost, currently 100, without the literal
`ACK: main-health-dominance` in its rationale), which a hand-edit discovers only
when `graph-commit` refuses the land.

`strategy-graph-drives-dispatch` records the contract this work implements
(2026-07-21 interview clarifications): "boost to top rank" becomes a first-class
scripted operation a session runs on author request — a CONSIDERED act, not a
mechanical max+epsilon race. The script computes the MINIMAL boost that tops the
node's current ranking scale, shows the author the current ranking it computed
against, and requires an author-supplied `rationale` (already a mandatory schema
field). Pre-tier there is exactly one ranking scale, so "top of tier" is "top of
the resolved-rank scale".

Intended outcome: an author-invoked script pair — a read-only preview that shows
the live ranking and the minimal boost that would top it, and a landing path that
writes `attention` through the validated writer and lands it via `graph-commit`
with a compare-and-swap guard — replacing the hand-edit practice.

**Explicitly deferred, not planned here.** The tactic statement also names a
tier-change operation and a tier-aware default (top-of-**current-tier**, per-tier
boost namespace). No tier concept exists in the code today: `grep -n tier
packages/intentionsutil/src/schema.ts packages/intentionsutil/src/attention.ts`
returns no tier logic, `Attention` (schema.ts:121-125) is a single scalar
`boost`, and the tactic that introduces tiers (`tactic-attention-tier-ranking`,
PR #2997) is unmerged and parked. Those two units are gated on that tactic
landing and must be planned fresh against the storage shape it actually ships;
building them now would be speculative. This plan delivers the ungated slice
(the boost-to-top-rank operation) and stops there. Unit 3's script header must
state that the tier-aware default and the tier-change script are follow-up work
gated on `tactic-attention-tier-ranking`.

---

## Unit 1 — pure boost planner (`packages/intentionsutil/src/boost.ts`)

**Scope.** New file `packages/intentionsutil/src/boost.ts` plus new test file
`packages/intentionsutil/test/boost.test.ts`. Two small exports added to
`packages/intentionsutil/src/schema.ts` (no behavior change there).

Everything in this unit is pure: nodes in, plan object out. No filesystem, no
git, no process I/O.

Exports from `src/boost.ts`:

```ts
/** One row of the ranking table shown to the author. */
export interface RankRow {
  id: string;
  kind: "strategy" | "tactic";
  phase: string;            // GraphCandidate.phase (the directive rung)
  rank: number;             // composed rank from resolveAttention
  own_boost: number | null; // the node's OWN authored boost, for contrast
  own_override: number | null;
  exempt: boolean;          // main-health-derived; not part of the top-rank contest
}

export type BoostMode =
  | { kind: "top-candidate" }          // beat every non-exempt selector candidate
  | { kind: "rank"; value: number };   // reach at least this composed rank

export interface BoostPlan {
  target: string;
  target_is_candidate: boolean;        // target appears in selectGraphTargets()
  target_current_rank: number | null;  // resolved rank today, null if not goal-layer-eligible
  ranking: RankRow[];                  // full candidate list, rank desc (selector order)
  incumbent: RankRow | null;           // highest-ranked non-exempt candidate other than target
  recommended_boost: number | null;    // MINIMAL own-boost meeting the mode, or null
  resulting_rank: number | null;       // target's composed rank at recommended_boost
  ceiling: number | null;              // strategy-main-health's live boost, or null
  needs_ack: boolean;                  // recommended_boost >= ceiling
  unreachable_reason: string | null;   // set iff recommended_boost is null
}

export function planBoost(
  nodes: IntentionNode[],
  targetId: string,
  mode: BoostMode,
  opts?: { includeExempt?: boolean; maxBoost?: number },
): BoostPlan;
```

Algorithm, in order:

1. Look up `targetId` in `nodes`; a missing id throws `IntentionSchemaError`
   (`src/errors.ts`) — clear error, no fallback (`.claude/rules/code-style.md`).
2. Reject a target whose kind is not goal-layer: reuse
   `kindIsNotGoalLayer(kind, byId)` (schema.ts:718) — change its declaration to
   `export function kindIsNotGoalLayer` so this unit reuses the single
   definition instead of re-deriving `kind-<kind>.attributes.goal_layer`. Throw
   `IntentionSchemaError` naming rule 5 (schema.ts:814-833) when it fires.
   Do NOT touch `resolveAttention`'s private `isEligible` (attention.ts:288-291)
   — refactoring the hot path is out of scope here.
3. Build the ranking: `selectGraphTargets(nodes)` (router.ts:249) gives the
   authoritative ordered candidate list (`GraphCandidate`, router.ts:22-58 —
   rank desc, progression ordinal desc, id asc; ordering doc at router.ts:244-247).
   Never re-derive ordering rules. `resolveAttention(nodes)` (attention.ts:285)
   gives each node's `ResolvedAttention` (attention.ts:13-31) whose `sources[]`
   is used for the exemption test below.
4. Exemption set: a candidate is `exempt` when its id is `strategy-main-health`
   or its `ResolvedAttention.sources` contains `"strategy-main-health"`. Rationale:
   main-health and its subtree are the always-on trunk-health signal, not
   discretionary work; "top ranking" means #1 *below* main-health. `opts.includeExempt`
   drops the exemption (an author who genuinely wants to outrank trunk health —
   which will normally also set `needs_ack`).
5. Ceiling: `ceiling = dominantMainHealthBoost(nodes)`. Add that helper plus
   `export const MAIN_HEALTH_DOMINANCE_ACK = "ACK: main-health-dominance"` to
   `src/schema.ts`, extracted from the inline read at schema.ts:1051-1058 and the
   inline literal at schema.ts:926/933/938, and have `validateGraph` /
   `checkAttentionDominance` use them so the threshold and the ACK literal have
   one definition each. Behavior of rule 18 must not change.
6. Feasibility predicate `topsAt(b)`: clone the node array replacing the target's
   `attention` with `{ boost: b, override: null, rationale: <target's existing
   rationale or a non-empty placeholder> }` (rationale is never empty — schema
   requires non-empty, and `validateAttention`, schema.ts:309, is the gate), then
   re-run `selectGraphTargets`. `topsAt(b)` is true when the target is present in
   `candidates` AND its rank is STRICTLY greater than every non-exempt other
   candidate's rank. Strictly, not `>=`: a tie is broken by progression ordinal
   then id, which is not "top by attention" — the honest-ties discipline this
   strategy records. For `{ kind: "rank", value }` the predicate is instead
   "target's composed rank >= value".
7. Minimal `b`: integer binary search over `[1, hi]` where
   `hi = ceiling !== null ? ceiling - 1 : (opts.maxBoost ?? 1000)`.
   Justification for binary search, which MUST appear as a code comment: a boost
   `b` on X adds the single claim `(X, b)` to X's outgoing set, which flows to
   exactly the same set of distributees at every `b`, so each peer's rank is
   either constant in `b` or rises by exactly `b` — peer differences are
   monotone non-decreasing in `b`, making `topsAt` monotone.
   Because that argument depends on `resolveAttention`'s current flow model
   (which `tactic-attention-blocking-orthogonal` may still change), the search
   must SELF-CHECK: after finding `b`, assert `topsAt(b)` and `!topsAt(b - 1)`
   (for `b > 1`). A failed self-check throws `IntentionSchemaError` naming the
   non-monotone graph — it must never silently return a wrong minimum.
8. Unreachable / ACK handling:
   - If `topsAt(hi)` is false and `ceiling !== null`, re-run the search over
     `[ceiling, ceiling * 10]`. If a `b` is found there, return it with
     `needs_ack: true` and `unreachable_reason: null` — the caller decides
     whether the author acknowledges rule 18.
   - If still false: `recommended_boost: null`, `needs_ack: false`, and
     `unreachable_reason` naming WHY, distinguishing the two real causes:
     (a) one or more peers receive the target's own claim through the flow
     relation (they are in the target's subtree or list it in their
     `blocked_by`) and stay ahead by a constant delta at every boost — name
     those ids and the delta; (b) the search bound was hit. Never loop.
9. `ranking` is returned in selector order (candidate order), truncated by the
   caller, not here.

Out of scope for this unit: any write path, any git, any CLI, tiers, and any
change to `attention.ts` or `router.ts`.

**Tests** (`test/boost.test.ts`). Build fixtures with the `anode()` helper
pattern copied from `test/check-node-selection.test.ts:15-41` (a full
`IntentionNode` with defaults) — and note that fixtures need `kind-tactic` /
`kind-strategy` nodes carrying `attributes: { goal_layer: true }`, or nothing is
attention-eligible. Cases:

- serves-only childless tactic: `recommended_boost` beats the incumbent's
  COMPOSED rank, and is strictly less than the value that would be picked by
  naively matching the incumbent's `own_boost` column (the recorded mis-sizing
  trap);
- inherited-source arithmetic: a target serving a boosted strategy composes to
  `own boost + inherited`, so `recommended_boost` is the OWN value, not the
  composed target;
- exemption: `strategy-main-health` and a tactic whose `sources` include it are
  marked `exempt` and are not the incumbent; with `includeExempt: true` they are;
- `needs_ack: true` when topping requires `b >= ceiling`, with `ceiling` read
  live from the fixture's main-health boost (not hardcoded 100);
- `ceiling: null` when main-health is absent or its attention is null → search
  uses `maxBoost`;
- unreachable: a peer that lists the target in its `blocked_by` (so it receives
  the target's claim) and starts ahead → `recommended_boost: null` with a
  reason naming that peer;
- `{ kind: "rank", value }` mode returns the minimal boost reaching that
  composed rank;
- target not in the candidate list (e.g. `office_hours` set) →
  `target_is_candidate: false`; `top-candidate` mode returns
  `recommended_boost: null` with a reason, `rank` mode still computes;
- non-goal-layer target and unknown id both throw `IntentionSchemaError`.

**Recommended model.** opus.

---

## Unit 2 — CLI: `packages/intentionsutil/scripts/boost-node.ts`

**Scope.** New file `packages/intentionsutil/scripts/boost-node.ts` and new test
file `packages/intentionsutil/test/boost-node.test.ts`. No git, no `gh`, no
`graph-commit` — this unit is store-level only; Unit 3 wraps it.

Follow the established shape of `scripts/check-node-selection.ts`: an exported
pure function returning `{ exitCode, stdout, stderr }`
(`SelectionResult`, check-node-selection.ts:70-78; `evaluateSelection`,
check-node-selection.ts:182) with a thin `main()` mapping it onto real stdio
(check-node-selection.ts:384-401). Resolve the default intentions dir from
`import.meta.url`, never cwd — copy the three-lines-up derivation in
`scripts/select-targets.ts:29-33`.

```
Usage:
  npx tsx packages/intentionsutil/scripts/boost-node.ts <node-id> [--dir <intentions-dir>]
      [--rank <n>] [--include-exempt] [--json] [--top <n>]
  npx tsx packages/intentionsutil/scripts/boost-node.ts <node-id> --write --rationale <text>
      [--dir <dir>] [--boost <n>] [--rank <n>] [--include-exempt] [--ack]
```

Preview mode (no `--write`) — the default, and the "shows the current ranking
for the author" half of the contract:

- `listNodes(dir)` (store.ts:143) → `planBoost(nodes, id, mode)`.
- Human-readable output: the top `--top <n>` (default 10) rows of `plan.ranking`
  as a fixed-width text table — id, kind, phase, composed rank, own boost, an
  `*` marker on exempt rows — followed by the target's current rank, the
  incumbent, `recommended_boost`, the rank it would reach, and, when
  `needs_ack`, the exact rule-18 consequence and the `--ack` flag that opts in.
  With `--json`, emit `BoostPlan` as one JSON object instead (machine-readable
  for a session that wants to reason over it).
  This is a terminal table, not a chart/dashboard — no data-viz surface is
  introduced by this tactic, so no `/dataviz` guidance applies.
- Exit 0 always when the plan computed, including when `recommended_boost` is
  null (a preview that reports "unreachable, because …" is a successful preview);
  exit 2 on usage errors; exit 1 on a thrown `IntentionSchemaError`, printing
  its message.

Write mode (`--write`):

- `--rationale <text>` is MANDATORY: missing, empty, or whitespace-only → exit 2
  with a message stating that the attention field requires an author rationale
  and that this script never synthesizes one. This is the enforcement point for
  the "considered act" contract.
- Boost value: `--boost <n>` uses the author's explicit value verbatim (still
  printing the plan so the author sees where it lands); otherwise the value is
  `plan.recommended_boost` for the mode. A null `recommended_boost` → exit 4
  printing `unreachable_reason`. Never invent a fallback value.
- Rule 18: when the chosen value `>= plan.ceiling` and `--ack` was not passed →
  exit 4 explaining that the write would be refused by `validateGraph`, and that
  `--ack` appends the literal acknowledgement. With `--ack`, append
  `MAIN_HEALTH_DOMINANCE_ACK` (from Unit 1's schema export) to the rationale as
  a separate clause — never silently, always echoed in the output.
- The write itself: `readNode(dir, id)` (store.ts:116) → set
  `node.attention = { boost, override: null, rationale }` → `validateNode(node)`
  (schema.ts:638) → `writeNode(dir, validated)` (store.ts:44). This mirrors
  `writeNodeFromJson` (scripts/write-node.ts:34-39), which is the single
  validation gate; a full-node JSON round-trip is unnecessary here since only
  one field changes and `readNode`/`writeNode` preserve the rest (the same
  read-modify-write `park-node` uses, park-node:255-268).
- Before writing, run `validateGraph(nodesWithMutation)` (schema.ts:1047) so a
  rule 5 / rule 18 violation surfaces here with a clear message rather than at
  `graph-commit` land time.
- On success print the node id, the written boost, the rationale, and the
  predicted resulting rank. Exit 0.

Exit codes (document them in the header comment): 0 ok · 1 schema/graph error ·
2 usage (including missing rationale) · 4 no usable boost (unreachable, or ACK
required and not given).

**Tests** (`test/boost-node.test.ts`): drive the exported pure function against a
`mkdtempSync` store seeded with `writeNode` (same pattern as
check-node-selection.test.ts:11-45). Cover: preview writes nothing to disk (the
node file's bytes are unchanged) and exits 0; `--write` without `--rationale`
exits 2 and writes nothing; a successful `--write` sets exactly `attention` and
leaves every other frontmatter field byte-identical; `--write` needing ACK
without `--ack` exits 4 and writes nothing; with `--ack` the rationale contains
the literal and the write lands; `--boost` overrides the recommendation.

**Dependencies.** Unit 1.

**Recommended model.** sonnet.

---

## Unit 3 — landing wrapper `packages/intentionsutil/scripts/boost-node`, harness, CI step

**Scope.** New executable bash script
`packages/intentionsutil/scripts/boost-node` (no extension, `chmod +x`, mirroring
`scripts/park-node`), new harness
`packages/intentionsutil/scripts/test-boost-node.sh`, and one new step in
`.github/workflows/unit-tests.yml` next to the existing
`- name: Run park-node CAS-guard tests` step (unit-tests.yml:237-238).

```
Usage: boost-node [--base <blobsha>|<id>=<blobsha>|<manifest-file>]
                  [--boost <n>] [--rank <n>] [--include-exempt] [--ack]
                  [--preview] <node-id> [<rationale>]
```

Structure — follow `scripts/park-node` line-for-line where the concern is the
same; the anchors below are the precedent to copy, not to import:

1. `SCRIPT_DIR` / `REPO_ROOT` / `INTENTIONS_DIR` derivation (park-node:82-85).
   `REPO_ROOT` comes from the script's own location, so a caller invoking the
   main checkout's copy by absolute path from a worktree targets the main
   checkout — this is deliberate and must be documented in the header.
2. Leading-flags-only argv parse with the first non-flag argument ending flag
   parsing (park-node:92-155): `<rationale>` is free text that may start with
   `-`. `--base` resolution to a 40-hex sha from a bare sha, an `<id>=<sha>`
   pair, or a `dump-node.ts` base-manifest file (park-node:158-201), including
   the "explicitly-empty `--base` is a usage error, not a silent degradation"
   distinction (park-node:104-110).
3. `--preview` (or no `<rationale>`): snapshot origin/main and print the plan,
   making NO writes. The snapshot matters — the router selects from origin/main,
   never a worktree — so use the same primitive the selector wrapper uses:
   `git -C "$REPO_ROOT" fetch origin main`, then
   `git -C "$REPO_ROOT" archive origin/main intentions | tar -x -C "$SNAPSHOT"`
   into an `mktemp -d`, then
   `npx tsx packages/intentionsutil/scripts/boost-node.ts <id> --dir "$SNAPSHOT/intentions"`
   (the pattern at
   `.claude/skills/dispatch-propagate/scripts/graph-select-target:401-421`).
   Exit with the CLI's exit code.
4. Landing path, with `<rationale>` supplied:
   - `git fetch origin main`; `FRESH_BLOB=$(git rev-parse
     "origin/main:intentions/<id>.md")`; a node absent from origin/main is exit 1
     (park-node:196-213).
   - `--base` pin check BEFORE any mutation → exit 3 `stale-diagnosis`
     (park-node:215-221); the contract and caller loop are
     `.claude/skills/ref-diagnosis-time-cas/SKILL.md`.
   - Overwrite the local node file from origin/main (park-node:223-226), then
     `MUTATED` flag + `EXIT` trap restoring the file from the immutable
     `FRESH_BLOB` (never the moving ref) via a temp file + `mv`
     (park-node:228-250).
   - Mutate by invoking Unit 2's CLI:
     `npx tsx "$REPO_ROOT/packages/intentionsutil/scripts/boost-node.ts" <id>
     --dir "$INTENTIONS_DIR" --write --rationale "<rationale>" [flags]`.
     Propagate its exit code: a 2/4 refusal must exit before `graph-commit`
     with nothing landed.
   - `EXPECT_BLOB=$(git -C "$REPO_ROOT" hash-object -- intentions/<id>.md)`;
     a hashing failure is a hard error, never an omitted `--expect`
     (park-node:276-283).
   - Land: `"$SCRIPT_DIR/graph-commit" -C "$REPO_ROOT" --base "<id>=$FRESH_BLOB"
     --expect "<id>=$EXPECT_BLOB" -m "graph: boost <id> (<first line of
     rationale, truncated>)" <id>` (park-node:303). `graph-commit`'s header
     documents the flags and the six observable outcomes
     (packages/intentionsutil/scripts/graph-commit:1-90).
   - Post-land verification (the "verifies the node now sorts top via the
     selector" half of the contract): re-`fetch`, re-`archive` origin/main into
     a fresh temp dir, run `select-targets.ts --dir "$SNAPSHOT2/intentions"`
     (scripts/select-targets.ts), and assert with `jq` that the target is the
     first candidate among non-exempt ones; print the new top 5. A failed
     assertion exits 6 and reports the landed state — it must NOT roll back or
     re-write, because the write already landed on main.
5. Do NOT call `mark-node-terminal` (park-node:317): a boost is not a terminal
   disposition for a node worker, and this script is author-invoked, not a
   phase worker.

**Harness** `test-boost-node.sh`, modeled on `scripts/test-park-node.sh`
(1028 lines; read its header at test-park-node.sh:1-60 for the scaffolding
contract: throwaway bare origin + writer clones, `gh`/`npx` PATH shims,
`GRAPH_COMMIT_*` env overrides shrinking poll windows, scripts copied into the
scratch repo at their real repo-relative paths so `REPO_ROOT`/`SCRIPT_DIR`
resolve inside the scratch clone). This script's mutation runs the REAL
`boost-node.ts` (and therefore the real `src/`), so copy the scratch-repo setup
used by test-park-node.sh's case 5 (the `demote-node-to-implement` case), which
already stages the real `packages/intentionsutil/src` alongside the shims.
Cases:

1. `--preview` prints a recommended boost and creates NO commit on origin
   (origin/main's sha is unchanged).
2. Landing writes `attention.boost` + the verbatim rationale and the change is
   present on origin/main.
3. No `<rationale>` and no `--preview` → exit 2, nothing written.
4. Stale `--base` → exit 3 before any mutation (node file byte-identical).
5. `graph-commit` failure (the wrapper trick test-park-node.sh already uses)
   rolls `intentions/<id>.md` back byte-identically — asserted via an empty
   `git diff` against the clone's HEAD, not merely "file exists".
6. A boost that would need ACK, without `--ack` → exit 4, nothing written.

CI: add, immediately after unit-tests.yml:237-238,

```yaml
      - name: Run boost-node tests
        run: packages/intentionsutil/scripts/test-boost-node.sh
```

Without this step the harness never runs — these shell harnesses are wired one
explicit step at a time (unit-tests.yml:208-250), not globbed.

**Explicitly out of scope for this unit:** any edit under `.claude/skills/**`.
Registering the new operation in a skill body would be the natural
discoverability move, but skill-file edits are denied at commit time for
autonomous sessions, which would strand this PR. Discoverability is carried by
the two script headers instead (park-node's header is the precedent for how much
prose belongs there): state the contract, the exit codes, the rule-18 ceiling,
and the deferred tier units.

**Dependencies.** Units 1 and 2.

**Recommended model.** opus.

---

## Reuse

- `packages/intentionsutil/src/attention.ts:285` — `resolveAttention(nodes)`, the
  pure composed-rank resolver, with `ResolvedAttention { value, sources[], terms[] }`
  at attention.ts:13-31. The `sources[]` list is the exemption test. Never
  reimplement ranking.
- `packages/intentionsutil/src/router.ts:249` — `selectGraphTargets(nodes)`, the
  authoritative eligibility + ordering source (`GraphCandidate` at router.ts:22-58,
  `GraphSelection` at router.ts:60-65, ordering doc at router.ts:244-247).
- `packages/intentionsutil/src/schema.ts:121-125` — the `Attention` interface
  (exactly one of boost/override; boost finite `> 0`; rationale required
  non-empty), validated by `validateAttention` at schema.ts:309.
- `packages/intentionsutil/src/schema.ts:917-941` — `checkAttentionDominance`
  (rule 18) and its live threshold read at schema.ts:1051-1058; rule 18's doc
  comment at schema.ts:1028-1035. Unit 1 extracts the threshold read and the ACK
  literal into shared exports rather than duplicating either.
- `packages/intentionsutil/src/schema.ts:718` — `kindIsNotGoalLayer`, the rule-5
  goal-layer eligibility test (used at schema.ts:814-833); export it and reuse.
- `packages/intentionsutil/src/schema.ts:638` / `src/store.ts:44,116,143` —
  `validateNode`, `writeNode`, `readNode`, `listNodes`: the validated
  read-modify-write path.
- `packages/intentionsutil/scripts/write-node.ts:34-39` — `writeNodeFromJson`, the
  canonical "single validation gate" comment and shape to mirror.
- `packages/intentionsutil/scripts/select-targets.ts:29-33,38-56` — thin-CLI
  template: intentions dir resolved from `import.meta.url`, `--dir` override,
  pure function, JSON to stdout.
- `packages/intentionsutil/scripts/check-node-selection.ts:70-78,182,384-401` —
  the exported-pure-function + thin-`main()` split for a logic-bearing script.
- `packages/intentionsutil/scripts/park-node` — the whole-script precedent for a
  rationale-bearing single-node write that lands on main: argv parse (92-155),
  `--base` resolver (158-201), fetch + `FRESH_BLOB` (196-213), stale-diagnosis
  exit 3 (215-221), local refresh (223-226), `MUTATED` + rollback trap (228-250),
  `EXPECT_BLOB` hash (276-283), `graph-commit --base/--expect` land (303).
- `packages/intentionsutil/scripts/graph-commit:1-90` — the single land primitive;
  every write ends here, never a raw commit.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:401-421` — the
  `git archive origin/main intentions | tar -x` store-snapshot idiom plus the
  `select-targets.ts --dir <snapshot>` invocation.
- `packages/intentionsutil/scripts/test-park-node.sh:1-60` — harness scaffolding
  contract to copy for `test-boost-node.sh`.
- `packages/intentionsutil/test/check-node-selection.test.ts:15-45` — the
  `anode()` full-node fixture builder and `mkdtempSync` store seeding.
- `.claude/skills/ref-diagnosis-time-cas/SKILL.md` — the `--base` diagnosis-time
  pin contract and the exit-3 caller loop.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --app packages/intentionsutil --prose
```

```verify
packages/intentionsutil/scripts/test-boost-node.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual / judgment checks (not auto-runnable):

- **Preview against the live graph reads correctly.** Run
  `packages/intentionsutil/scripts/boost-node --preview tactic-first-sensor-pass`
  from the repo root. Confirm the table's top rows match
  `npx tsx packages/intentionsutil/scripts/select-targets.ts | jq -r
  '.candidates[:10][] | "\(.rank)\t\(.id)"'` in both order and rank values —
  the preview must agree with the selector exactly, since the selector is what
  the router uses. Confirm `strategy-main-health` (and any node whose sources
  include it) is marked exempt, and that the recommended boost is BELOW the
  incumbent's composed rank but ABOVE what the raw `boost:` column alone would
  suggest — that gap is the whole point of the tool.
- **Refusals are honest.** Preview a node whose `blocked_by` peers receive its
  own claim and confirm the unreachable message names those peers rather than
  returning a large number. Preview with `--rank 120` (above the current
  main-health boost of 100) and confirm the output states the rule-18
  consequence and the `--ack` opt-in rather than silently proposing it.
- **One real landing, observed end to end.** With the author present, run the
  landing path once on a real node with a real author-supplied rationale.
  Confirm: the commit on `origin/main` touches only `intentions/<id>.md`;
  `attention.rationale` is the author's text verbatim (no synthesized
  rationale, no appended ACK unless `--ack` was passed); the post-land
  verification prints the node at #1 among non-exempt candidates; and a
  subsequent `dispatch-tick` selection picks it up. Landing is the irreversible
  half of this tactic — do not treat the harness as a substitute for watching
  one real land.
- **Deferred-scope statement is present.** Confirm both script headers state
  that the tier-aware default and the tier-change script are follow-up work
  gated on `tactic-attention-tier-ranking`, so a future reader does not mistake
  the shipped script for the full tactic statement.
