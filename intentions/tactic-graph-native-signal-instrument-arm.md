---
id: tactic-graph-native-signal-instrument-arm
kind: tactic
statement: "Arm this strategy's success_signal so its reading stops being
  permanently null: re-point LIFECYCLE_SENSOR_NAME
  (packages/intentionsutil/scripts/read-sensors.ts:443, registered :932, used
  via SensorRegistry.resolve which is exact-match and throws with no fallback,
  src/sensors.ts:47-58) at the amended recorded success_signal.sensor string
  verbatim; extend readLifecycleReading (read-sensors.ts:625-632) with a third
  defect-backlog segment reporting the declared band — open (phase set, not
  done) plus born-parked tactics serving this strategy as a percentage of all
  tactics serving it, reusing align-tactics-census.ts's classify() semantics
  (align-tactics-census.ts:23-30); and derive the consecutive-sample series from
  intentions/ git history at read time rather than storing it, following the
  readTacticVelocity (read-sensors.ts:303) / readLifecyclePhaseHistory (:483)
  git-log precedent and sampling historical points through listNodesAtRef
  (packages/intentionsutil/scripts/lib-store-at-ref.ts:47) — noting that helper
  calls listNodesStrict and THROWS on a node unreadable at a historical ref, so
  each sample must be individually guarded to preserve the total-sensor contract
  (degrade to a skipped/unknown sample, never a throw). Update
  packages/intentionsutil/test/lifecycle-sensor.test.ts (its
  LIFECYCLE_SENSOR_NAME constant at line 13 must move in lockstep) and add
  fixture-repo coverage for the backlog segment and the derived series.
  Post-merge on main: run `npm run read-sensors --prefix
  packages/intentionsutil` and land the resulting non-null reading on
  strategy-graph-native-dispatch via graph-commit — that run is the round's
  fresh reading, and read-sensors writes readings into every node as a side
  effect, so the landing must be scoped to this strategy's node."
owner: ai
status: codified
parent: null
rationale: "Ratified in the 2026-08-05 /align interview; this is the instrument
  work that clears the strategy's own 2026-08-04 park. THREE ratified decisions
  to implement: (1) ONE sensor, not two -- extend readLifecycleReading with a
  defect-backlog segment and re-point LIFECYCLE_SENSOR_NAME
  (read-sensors.ts:443, used :646) at the amended RECORDED string, because
  success_signal.sensor is a single string so a two-sensor split leaves the
  second unreadable by the same exact-match mechanism (SensorRegistry.resolve,
  sensors.ts:49-59, is exact-match and throws with no fallback). (2) The band is
  a RATIO: open plus born-parked tactics serving this strategy stay at or below
  35% of all tactics serving it (measured at arming 59/197 = 30.0%; 2026-08-04
  baseline 62/178 = 34.8%). (3) Consecutive samples are DERIVED from intentions/
  git history at read time, never stored, following the
  readTacticVelocity/readTokenEconomy precedent. Until this lands the strategy's
  reading stays null and its signal cannot be validated by any number of rounds.
  Planned by the 2026-08-10 /align-tactics strategy-graph-native-dispatch
  round."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-native-signal-instrument-arm
  pr: 3060
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates:
  - strategy-graph-native-dispatch
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
## Context

`strategy-graph-native-dispatch` carries a `success_signal` whose `reading` is
permanently `null`, so the strategy's own gap can never be measured and its
`/align-tactics` fresh-reading gate never sees a fresh sample.

The cause is an exact-string drift. `SensorRegistry.resolve`
(`packages/intentionsutil/src/sensors.ts:49-59`) is an exact `Map.get` match and
**throws** `IntentionSchemaError` with no fallback on an unknown name. The batch
driver `readStoreSensors` (`packages/intentionsutil/scripts/read-sensors.ts:992-1003`)
catches that throw, buckets the node under `summary.unregistered`, and `continue`s
— so the node's `reading` and `gap` are never written at all. Verified in this
worktree at HEAD:

- The node's parsed `success_signal.sensor` is the 195-character string
  `the intention store and the router's selection log — align-tactics-census.ts enumerates the open machinery-defect population serving this strategy; the selection log carries lifecycle completions`
  (`intentions/strategy-graph-native-dispatch.md:4747-4749`, a plain multi-line
  YAML scalar that folds to one line).
- The registered constant `LIFECYCLE_SENSOR_NAME`
  (`packages/intentionsutil/scripts/read-sensors.ts:443`, registered at `:932`,
  used at `:646`) is only `the intention store and the router's selection log`.
- `readNode("intentions","strategy-graph-native-dispatch")` returns
  `reading: null, gap: null` (frontmatter `:42-43`).

The strategy's 2026-08-05 `/align` clarifications ratified the fix shape: ONE
sensor, and **the code moves to the record, not the record to the code**. The
same clarifications armed two new terms of the recorded threshold
(`intentions/strategy-graph-native-dispatch.md:4750-4754`) that the sensor does
not yet report:

1. a **defect-backlog band** — open (phase set, not `done`) plus born-parked
   tactics serving this strategy, as a percentage of *all* tactics serving it,
   at or below **35%**; and
2. that percentage **non-increasing across consecutive samples derived from
   `intentions/` git history at read time** — derived, never stored.

Intended outcome: after this lands and `read-sensors` runs on `main`, the
strategy carries a non-null, three-segment reading that reports the lifecycle
half, the router-selection half, and the armed backlog band plus its
git-derived series.

Measured in this worktree at HEAD with the census classification, to show the
mechanism produces a real, meaningful series (weekly samples, oldest→newest):

```
21d ago 22f11a20: 30/63  = 47.6%
14d ago c547246c: 33/83  = 39.8%
 7d ago abbabc42: 49/165 = 29.7%
 0d ago 6e75e0be: 66/232 = 28.4%
```

Each historical sample cost ~300-400ms (`listNodesAtRef` over ~400-560 nodes),
so four samples add ~1.4s to a `read-sensors` run.

---

### Unit 1 — Extract the census classification into `src/` as the single home

**Scope.**

New file `packages/intentionsutil/src/census.ts`. It is a **pure, fs-free**
module (no `node:fs`, no `child_process`) so it can live alongside
`attention.ts` / `coverage.ts` / `holds.ts` and be exercised on in-memory node
arrays. It exports:

```ts
export type TacticClassification = "draft" | "born-parked" | "open" | "done";

/** Verbatim semantics of align-tactics-census.ts's classify(). */
export function classifyTactic(node: IntentionNode): TacticClassification;

export interface BacklogBand {
  backlog: number;   // open + born-parked tactics serving the strategy
  total: number;     // ALL tactics serving the strategy (draft+born-parked+open+done)
  pct: number | null; // null when total === 0 (no division by zero)
}

export function strategyBacklogBand(
  nodes: IntentionNode[],
  strategyId: string,
): BacklogBand;
```

`classifyTactic` must reproduce the existing rules **exactly** (currently
`packages/intentionsutil/scripts/align-tactics-census.ts:25-30`):

```ts
if (node.phase === "done") return "done";
if (node.phase !== null) return "open";
return node.office_hours === null ? "draft" : "born-parked";
```

`strategyBacklogBand` filters `node.kind === "tactic" && node.serves.includes(strategyId)`
— the same filter as `align-tactics-census.ts:55` — then counts `open` +
`born-parked` as `backlog` and the whole filtered set as `total`.

Then **re-point** `packages/intentionsutil/scripts/align-tactics-census.ts` at
the new module: delete its local `type Classification` (`:23`) and `classify`
(`:25-30`), import `classifyTactic` and `TacticClassification` from
`../src/census.js`, and use them at `:58` and `:64`. The script's stdout format
must not change (it is consumed by `/align-tactics` Step 0).

Optionally re-export `classifyTactic` / `strategyBacklogBand` /
`TacticClassification` / `BacklogBand` from `packages/intentionsutil/src/index.ts`
for discoverability, following that file's existing per-module export-block
convention. Do **not** add it to `src/graph.ts` — nothing browser-side needs it.

New test file `packages/intentionsutil/test/census.test.ts` covering, on
in-memory `IntentionNode` fixtures:

- all four `classifyTactic` branches (`phase: "done"` → done; any other non-null
  phase → open; `phase: null` + `office_hours: null` → draft; `phase: null` +
  non-null `office_hours` → born-parked);
- `strategyBacklogBand` counts only `kind: "tactic"` nodes whose `serves`
  contains the id (a strategy node and a tactic serving a *different* strategy
  are both excluded);
- `backlog` = open + born-parked, `total` includes drafts and dones;
- `total === 0` yields `pct: null`.

**Out of scope.** Any change to `align-tactics-census.ts`'s output format, its
`headings()` helper, or its `readNodeBody` usage. Any change to `read-sensors.ts`
(that is Unit 2).

**Recommended model.** sonnet.

---

### Unit 2 — Re-point the sensor name and add the backlog segment to the lifecycle sensor

**Dependencies.** Unit 1 (imports `strategyBacklogBand` from `src/census.ts`).

**Scope.** `packages/intentionsutil/scripts/read-sensors.ts` and
`packages/intentionsutil/test/lifecycle-sensor.test.ts`.

**(a) Re-point the constant.** Replace the value of `LIFECYCLE_SENSOR_NAME`
(`read-sensors.ts:443`) with the record's verbatim 195-character string. Do
**not** retype it from the YAML source (it is a folded multi-line scalar).
Obtain it mechanically — e.g. write a throwaway file under `/tmp` and run it
with `npx tsx`:

```ts
import { readNode } from "<abs repo root>/packages/intentionsutil/src/store.js";
const n = readNode("<abs repo root>/intentions", "strategy-graph-native-dispatch");
console.log(JSON.stringify(n.success_signal!.sensor));
```

(`npx tsx -e '...'` does **not** work here — relative specifiers fail to resolve
under `[eval]`; use a file. `npx tsx` may need `dangerouslyDisableSandbox: true`:
tsx's IPC pipe `listen()` hits sandbox EPERM.)

Update the doc comment at `:442` and the block comment at `:429-440` to describe
the new three-segment format. Also update `:646`'s surrounding narration if it
names the old short string.

**(b) Current-band reader.** Add, next to the other exported halves:

```ts
/** The band the recorded threshold declares (…"at or below 35%"…). */
export const BACKLOG_BAND_PCT = 35;
/** The strategy whose tactic population the band is measured over. */
const BACKLOG_STRATEGY_ID = "strategy-graph-native-dispatch";
const BACKLOG_SERIES_WINDOW_DAYS = 28;
const BACKLOG_SERIES_STEP_DAYS = 7;

export function readBacklogBand(storeDir: string, strategyId: string): string;
```

It calls `listNodes(storeDir)` (the tolerant reader, `src/store.ts:232`) inside
`try/catch` — a failure returns `"unknown"`, never throws (the total-sensor
contract stated at `read-sensors.ts:64-68`) — then `strategyBacklogBand`, and
formats:

- normal: `` `${backlog}/${total} = ${pct.toFixed(1)}% (band ≤${BACKLOG_BAND_PCT}%)` ``
- `total === 0`: `` `0/0 = n/a (band ≤${BACKLOG_BAND_PCT}%)` ``
- load failure: `"unknown"`

**(c) Git-derived series reader.**

```ts
export function readBacklogSeries(
  repoDir: string,
  strategyId: string,
  windowDays: number = BACKLOG_SERIES_WINDOW_DAYS,
  stepDays: number = BACKLOG_SERIES_STEP_DAYS,
): string;
```

Algorithm — follow the `readTacticVelocity` (`:303-403`) /
`readLifecyclePhaseHistory` (`:483-588`) git-log precedent for failure posture,
and the injectable-window precedent (`windowDays` param) for testability:

1. For each offset `d = windowDays - stepDays; d >= 0; d -= stepDays` (so
   `28/7` → `21, 14, 7, 0`), resolve a sample commit with
   `execFileSync("git", ["-C", repoDir, "rev-list", "-1", `--before=${d} days ago`, "HEAD", "--", "intentions"], {encoding:"utf8", stdio:["ignore","pipe","ignore"]})`,
   trimmed. Wrap the whole resolution loop in `try/catch`; a git failure (not a
   repo, no commits) returns `"unknown"`.
2. Drop empty results (no commit before that instant) and **de-duplicate
   consecutive identical SHAs**, so each series element is a distinct committed
   store state rather than a repeated flat value.
3. For each surviving SHA, call
   `listNodesAtRef(repoDir, sha)` (`packages/intentionsutil/scripts/lib-store-at-ref.ts:47`)
   **inside its own `try/catch`**. This is load-bearing: that helper calls
   `listNodesStrict` (`src/store.ts:249`) and **throws** on any node unreadable
   or schema-invalid at that historical ref — which is expected as the schema
   evolves. A throwing sample degrades to the literal token `skipped`; it must
   never propagate, or the sensor breaks its total contract and aborts the whole
   `read-sensors` batch. On success, compute `strategyBacklogBand(nodes, strategyId).pct`;
   a `null` pct (no tactics served yet at that ref) also renders `skipped`.
4. Render oldest→newest, joined by `" → "`, each usable sample as
   `` `${pct.toFixed(1)}%` ``.
5. Trend verdict, appended in parentheses, computed over the **usable** samples
   only and over the **rounded** values actually displayed (so the printed
   series and the verdict can never disagree through float noise):
   - fewer than 2 usable samples → the whole return value is
     `"insufficient history"`;
   - every consecutive pair `p[i+1] <= p[i]` → `(non-increasing)`;
   - otherwise → `(increasing)`.

**(d) Compose.** Extend `readLifecycleReading` (`:638-643`) to:

```ts
export function readLifecycleReading(
  repoDir: string,
  selectionLogPath: string,
  strategyId: string = BACKLOG_STRATEGY_ID,
): string
```

deriving the store dir as `join(repoDir, "intentions")` so the current band and
the sampled history come from the same repository. Returned format (segments
joined by `"; "`, extending the existing two):

```
lifecycle: <A>; router selections: <B>; backlog: <C>; backlog series <windowDays>d: <D>
```

e.g.

```
lifecycle: tactic-legacy-router-removal implement→qa→review→done (2026-07-26); router selections: 812 records, 190 nodes; backlog: 66/232 = 28.4% (band ≤35%); backlog series 28d: 47.6% → 39.8% → 29.7% → 28.4% (non-increasing)
```

`lifecycleSensor.read()` (`:645-655`) needs no signature change — it already
passes `repoRoot`.

**(e) Tests.** In `packages/intentionsutil/test/lifecycle-sensor.test.ts`:

- Move the local `LIFECYCLE_SENSOR_NAME` constant (`:13`) to the same verbatim
  195-character string, in lockstep with `read-sensors.ts:443`. The existing
  `buildDefaultRegistry` test (`:170-175`) then continues to assert the sensor
  resolves under it.
- **Add an anti-drift guard test** — the strongest regression barrier against
  this defect recurring. Read the live committed node and assert the registered
  name equals it. Follow `packages/intentionsutil/test/committed-store.test.ts:14-21`
  exactly for the repo-root resolution and the skip-when-absent posture:

  ```ts
  const testDir = dirname(fileURLToPath(import.meta.url));
  const intentionsDir = join(dirname(dirname(dirname(testDir))), "intentions");
  describe.skipIf(!existsSync(intentionsDir))("recorded sensor name", () => {
    it("LIFECYCLE_SENSOR_NAME equals strategy-graph-native-dispatch's success_signal.sensor", () => {
      const node = readNode(intentionsDir, "strategy-graph-native-dispatch");
      expect(node.success_signal?.sensor).toBe(LIFECYCLE_SENSOR_NAME);
    });
  });
  ```

  This requires exporting `LIFECYCLE_SENSOR_NAME` from `read-sensors.ts` (mirror
  `INTENTION_STORE_SENSOR_NAME` at `:822`, which is already exported) and
  importing it in the test rather than re-declaring the literal, so the two can
  never drift.
- Update the two existing `readLifecycleReading` expectations (`:153-156` and
  `:163-166`) for the new third and fourth segments. The fixture repos built by
  `initRepo()` (`:28-36`) contain tactic files with no `serves` edge, so their
  band reads `0/0 = n/a (band ≤35%)`.
- **New `readBacklogBand` coverage** over a fixture store dir: nodes serving the
  strategy in each classification produce the expected `b/t = p%`; a store dir
  that does not exist reads `unknown`.
- **New `readBacklogSeries` coverage** over a fixture git repo built with the
  file's existing helpers (`initRepo`, `commitAll` with backdated
  `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`, `:39-44`), driven with small injected
  `windowDays`/`stepDays` (e.g. `3`/`1`) so day-spaced backdated commits produce
  distinct samples:
  - a decreasing series reads `(non-increasing)`;
  - a series that rises at any consecutive step reads `(increasing)`;
  - a commit whose `intentions/` contains a **schema-invalid** node file (so
    `listNodesStrict` throws at that ref) renders that element as `skipped`,
    the call **does not throw**, and the remaining samples still render;
  - a non-repo directory reads `unknown`;
  - a repo with only one distinct sampled store state reads
    `insufficient history`.

  If the file's hand-rolled `tacticFile()` frontmatter (`:47-51`) does not
  satisfy `validateNode` once a `serves` edge is added, build fixture nodes with
  `writeNodeFromJson` from `../scripts/write-node.js` instead — the pattern
  `packages/intentionsutil/test/store-at-ref.test.ts:7,24-34,65` already uses.

**Out of scope.** Any edit to `intentions/strategy-graph-native-dispatch.md`
(the record is authoritative; the code moves to it). Any change to the other
sensors, to `readStoreSensors`'s two-pass read/write structure (`:972-1017`), or
to `deriveGap`. Do **not** try to make `gap` become `null`: `deriveGap`
(`src/sensors.ts:98-112`) is exact string equality against a long prose
threshold, so `gap` stays non-null by design — the deliverable is a non-null
*reading*, not a met gap.

**Recommended model.** opus.

---

### Unit 3 — Post-merge on `main`: land the fresh reading, scoped to this node

**Dependencies.** Units 1 and 2, merged to `main`.

This unit changes **no files in the PR**. It is post-merge work and must be
recorded by the qa phase as a `## needs-main residue` H2 section on this
tactic's own body (the canonical heading matcher is
`packages/intentionsutil/src/transitions.ts:371-381`; the convention is
`.claude/skills/qa-fix/references/needs-main-followups.md`), which routes the
node to `main-qa` instead of `done`.

**Scope.** In a checkout of `main` synced to `origin/main`, with a clean tree:

1. `git -C <repo> fetch origin main` and confirm `HEAD == origin/main` and
   `git status --porcelain` is empty. A stale or dirty checkout silently
   produces a stale reading and breaks `graph-commit`'s rebase.
2. **Capture the CAS base blob BEFORE any edit** —
   `git -C <repo> rev-parse origin/main:intentions/strategy-graph-native-dispatch.md`
   — and keep it. (Capturing it after the write makes `--base` vacuous; see the
   ordering trap in `.claude/skills/align-tactics/references/write-path.md`,
   "Capture a base manifest".)
3. `npm run read-sensors --prefix packages/intentionsutil`.
   **Known destructive side effect:** this writes `reading` + `gap` into *every*
   node in `intentions/` that names a registered sensor, not just this one.
4. Preserve this node's file, then revert the rest — **in this order, checking
   the copy succeeded before the revert runs** (an unconditional revert after a
   failed copy destroys the reading):
   ```
   cp intentions/strategy-graph-native-dispatch.md /tmp/sgnd-reading.md   # must succeed
   git -C <repo> checkout -- intentions/
   cp /tmp/sgnd-reading.md intentions/strategy-graph-native-dispatch.md
   ```
5. Verify the result before landing: `git status --porcelain intentions/` names
   exactly one modified file, and `git diff -- intentions/strategy-graph-native-dispatch.md`
   touches only the `reading:` and `gap:` frontmatter fields — no body change, no
   `phase`/`execution`/`clarifications` change.
6. Land it:
   ```
   packages/intentionsutil/scripts/graph-commit -C <repo> \
     -m 'graph: land fresh reading on strategy-graph-native-dispatch' \
     --base strategy-graph-native-dispatch=<base-blob-from-step-2> \
     --expect strategy-graph-native-dispatch=$(git -C <repo> hash-object -- intentions/strategy-graph-native-dispatch.md) \
     strategy-graph-native-dispatch
   ```
   `graph-commit` stages exactly `intentions/<id>.md` per id, so no other node
   can ride along. `--base` is the compare-and-swap freshness check against
   `origin/main`; `--expect` is the wrong-repo targeting assertion (they are not
   interchangeable — see the usage header at
   `packages/intentionsutil/scripts/graph-commit:31-72`).
7. Confirm the landing on the remote, not locally:
   `git -C <repo> fetch origin main && git -C <repo> show origin/main:intentions/strategy-graph-native-dispatch.md | head -50`
   shows the non-null `reading:`. A local commit that was never pushed reads as
   success in the worktree and is not a landing.

**Out of scope.** Editing any other node's `reading`/`gap`; changing `rounds`,
`phase`, `attention`, or the `success_signal` itself; running `read-sensors`
from a worktree that is not `main`.

**Recommended model.** opus.

## Reuse

- `packages/intentionsutil/scripts/align-tactics-census.ts:23-30,55` —
  `classify()` and the serving-tactic filter whose semantics Unit 1 lifts into
  `src/census.ts` verbatim. Do not re-derive the rules; move them.
- `packages/intentionsutil/scripts/lib-store-at-ref.ts:47` — `listNodesAtRef`,
  the git-ref-aware store reader Unit 2 samples history through. Note its
  documented strictness (it calls `listNodesStrict` and throws on an unreadable
  node at the ref) — that is why every sample is individually guarded.
- `packages/intentionsutil/src/store.ts:232,249` — `listNodes` (tolerant, for
  the current band) and `listNodesStrict` (strict, used inside `listNodesAtRef`).
- `packages/intentionsutil/scripts/read-sensors.ts:303-403` (`readTacticVelocity`)
  and `:483-588` (`readLifecyclePhaseHistory`) — the git-log-derived, injectable-
  window, `catch → "unknown"` sensor-half precedent Unit 2 follows.
- `packages/intentionsutil/scripts/read-sensors.ts:822` —
  `INTENTION_STORE_SENSOR_NAME`, the existing precedent for exporting a
  verbatim-recorded sensor-name constant so tests can assert against it.
- `packages/intentionsutil/test/committed-store.test.ts:14-21` — the
  repo-root-from-`import.meta.url` plus `describe.skipIf(!existsSync(...))`
  pattern the Unit 2 anti-drift guard reuses.
- `packages/intentionsutil/test/store-at-ref.test.ts:7,24-34,36-60` —
  `writeNodeFromJson` fixture authoring and the fixture-repo/clone helpers, for
  the new series tests.
- `packages/intentionsutil/test/lifecycle-sensor.test.ts:19-73` — `git`,
  `initRepo`, `commitAll` (with `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`
  backdating), `driveLifecycle`, `selectionLogFile`. Extend these; do not write
  parallel helpers.
- `packages/intentionsutil/scripts/graph-commit` (usage header `:31-72`) — the
  sole landing mechanism for Unit 3, with `--base` (CAS) and `--expect`
  (wrong-repo assertion).
- `.claude/skills/align-tactics/references/write-path.md`, "Capture a base
  manifest" — the capture-base-before-editing ordering Unit 3 step 2 follows.

## Verification

Run from the repository/worktree root. Both blocks are green on this worktree at
HEAD before any change (44 files / 882 tests passing; typecheck passing), so a
failure is attributable to this work.

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
npm run lint --prefix packages/intentionsutil
```

Manual / judgment checks:

- **The defect is actually closed (the decisive check).** After Units 1-2, run
  `npm run read-sensors --prefix packages/intentionsutil` in a scratch checkout
  and confirm `strategy-graph-native-dispatch` no longer appears in the stderr
  line `skipped N nodes naming unregistered sensors: …`, and that
  `intentions/strategy-graph-native-dispatch.md` now carries a non-null
  `reading:` with all four segments (`lifecycle:`, `router selections:`,
  `backlog:`, `backlog series 28d:`). **Discard those working-tree writes** — the
  run touches every node — unless this is the Unit 3 landing run itself.
- **Band sanity.** The `backlog:` segment should read close to `66/232 = 28.4%`
  as of 2026-08-10 and inside the `≤35%` band; the series should render four
  distinct weekly percentages. A wildly different figure means the classification
  or the serving filter drifted from `align-tactics-census.ts`.
- **`gap` stays non-null.** Expected and correct — `deriveGap` is exact string
  equality against a prose threshold. Do not "fix" this.
- **Runtime.** `read-sensors` should gain roughly 1.5s (four `git archive` + parse
  passes at ~300-400ms each). A much larger regression means the series is
  sampling far more refs than intended.
- **Unit 3 landing** is observed on `origin/main`, not locally: re-fetch and
  `git show origin/main:intentions/strategy-graph-native-dispatch.md`. Confirm
  exactly one node changed in that commit
  (`git show --stat origin/main -- intentions/`).

## needs-main residue

- id: 9
- title: Unit 3 — land a fresh reading on strategy-graph-native-dispatch post-merge
- url_path: current
- expected_outcome: After this PR merges, running `npm run read-sensors --prefix packages/intentionsutil` against a clean `origin/main` checkout and landing the single-node result via `graph-commit` produces a non-null, four-segment reading (`lifecycle:`, `router selections:`, `backlog:`, `backlog series 28d:`) on `strategy-graph-native-dispatch`, verified against `origin/main` (not just locally) per this node's own Unit 3 scope.
- finding: PR #3060 ships only Units 1-2 (the code: `LIFECYCLE_SENSOR_NAME` re-point, `src/census.ts`, `readBacklogBand`/`readBacklogSeries`, the four-segment `readLifecycleReading`). Unit 3 changes no files in the PR by design — it is post-merge work per this node's own plan above ("This unit changes no files in the PR. It is post-merge work and must be recorded by the qa phase as a `## needs-main residue` section..."). It is a planned, acceptance-relevant deferral documented at merge time, not a defect discoverable by this PR's QA — only verifiable once Units 1-2 are on `main`.
- Verifiability: MACHINE
- Check: `git -C <repo> fetch origin main && git -C <repo> show origin/main:intentions/strategy-graph-native-dispatch.md | grep '^reading:'` confirms a non-null `reading:` with all four documented segments, and `git -C <repo> show --stat origin/main -- intentions/` on the landing commit shows exactly one changed node (`intentions/strategy-graph-native-dispatch.md`).
