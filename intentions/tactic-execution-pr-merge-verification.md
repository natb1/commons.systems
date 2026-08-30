---
id: tactic-execution-pr-merge-verification
kind: tactic
statement: Record a completion sha at the done-transition so merge-verification
  gates need not trust execution.pr alone — a closed-unmerged PR can sit on a
  legitimately complete node
owner: ai
status: codified
parent: null
rationale: "tactic-graph-native-dispatch-fold: PR #2925 is closed-unmerged while
  its content reached main via six out-of-band commits. execution.pr therefore
  under-determines completion, weakening the scripted census verify-merged-only
  prune (tactic-census-scripted-tick depends on a trustworthy completion
  signal)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-execution-pr-merge-verification
  pr: 2965
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-25T19:24:10Z
    mergeCommitSha: d33e35838f49d22fba0c9f5ea25176b6c665b3a1
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Record a completion sha at the done-transition so merge-verification gates need not trust execution.pr alone — a closed-unmerged PR can sit on a legitimately complete node

## Context

**The problem.** A tactic node's `execution.pr` under-determines completion. GitHub's REST pull-request API **never** reports `state: "MERGED"` — a genuinely-merged PR still reports `state: "closed"`, and the *only* signal distinguishing merged-from-abandoned is a non-null `merged_at`. This is locked in by the existing byte-compat test at `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:1981-1999`, which asserts a merged PR projects `.state == "CLOSED"` (not `"MERGED"`) while `.mergedAt` carries the timestamp.

Because of this, `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:70-83` has a **dead `MERGED)` case**: `.state` is never `"MERGED"`, so every terminal PR — merged or abandoned — falls into `CLOSED)` and is reported to `reconcile-graph.ts` uniformly as `"closed"`, discarding the `MERGED_AT` it already fetched (line 73). Downstream, `packages/intentionsutil/scripts/reconcile-graph.ts` Pass 3 (lines 128-176) transitions the node to `phase: "done"` and **deletes it from disk (`rmSync`) in the same instant**, recording zero completion evidence and drawing no distinction between "verified merged" and "abandoned." This is exactly what let `tactic-graph-native-dispatch-fold`'s PR #2925 slip through: closed-unmerged, but its content had reached `main` via six out-of-band commits — the reconciler had no mechanism to know that, and a genuinely-abandoned tactic would have been silently deleted the same way.

**The fix direction (proven safe).** `packages/intentionsutil/src/router.ts` already treats a `phase: "done"` node that remains present on disk as fully non-blocking: `isOpenTactic` (`router.ts:120-124`) returns false for `phase: "done"` regardless of file presence, and `blockersComplete` (`router.ts:156-168`, line 165) treats a present-but-done blocker as complete — its comment explicitly names "the transient window between the done transition and its prune." So we can **stop deleting at the done-transition**: instead record whatever completion evidence exists (full evidence for genuinely-merged; none for closed-unmerged), leave the node present, and let the separate scripted census tick (the sibling `tactic-census-scripted-tick`, already committed at `intentions/tactic-census-scripted-tick.md`, phase `implement`) do verification + edge-repair + deletion on a later tick using the evidence landed here.

**What this tactic lands:** a `completion` evidence object on `Execution`, populated at the merged/main-qa transitions in `reconcile-graph.ts`, threaded from the `mergedAt` + `merge_commit_sha` that `reconcile-graph-merged` reads from GitHub — plus a documented manual/office-hours backfill path (via `write-node.ts`) for the PR #2925-style out-of-band case. Round-stamping stays exactly where it is (at the done-transition in `reconcile-graph.ts`), per `tactic-census-scripted-tick`'s design decision 3.

**Scope note on the sibling.** `tactic-census-scripted-tick`'s Unit 1 reads this field and its own scope says it MUST re-verify the field's name/shape against `schema.ts` at its implementation time. So the concrete names below (`completion`, `mergedAt`, `mergeCommitSha`, `graphCommitSha`) are authoritative here — the sibling adapts to them, not the other way around.

This is a small, additive, backward-compatible change (a new optional field with the same additive posture as `fix`). No brownfield migration phase is needed: existing `Execution` literals that omit `completion` validate unchanged (normalized to `null`), and no persisted node carries the field yet.

## Unit 1 — Add the `Completion` evidence object to the schema

**Recommended model:** sonnet

**Scope.** `packages/intentionsutil/src/schema.ts` only (plus its test). Additive, following the `fix`/`FixState` precedent exactly.

1. **Add a `Completion` interface** next to `FixState` (which is at `schema.ts:371-375`), with a JSDoc block mirroring `FixState`'s convention (required fields, `T | null` for nullable, per-field null semantics):
   ```ts
   export interface Completion {
     mergedAt: string | null;       // GitHub PR merged_at, FULL ISO-8601 w/ time
     mergeCommitSha: string | null; // GitHub merge_commit_sha (the sha on the base)
     graphCommitSha: string | null; // manually-backfilled out-of-band landing sha
   }
   ```
   JSDoc must state: (a) recorded at the done-transition so a merge-verification gate need not trust `execution.pr` alone; (b) two independent sufficient proofs — a real PR merge (`mergedAt` + `mergeCommitSha`; REST never reports state `"MERGED"`, so a non-null `merged_at` is the merge signal) OR a `graphCommitSha` backfilled by an authoring/office-hours session for the out-of-band case (content reached `main` via commits, not the recorded PR — the session knows the sha; it is never derived mechanically from `graph-commit`, which prints no sha to stdout); (c) all three `null` on a node reconciled-to-done without evidence (abandoned/unverifiable), which census flags rather than silently prunes.

2. **CRITICAL — do NOT use `requireDateString`/`optionalDateString` for `mergedAt`.** Those enforce strict `YYYY-MM-DD` (regex `^\d{4}-\d{2}-\d{2}$`, `schema.ts:431-441`) and will REJECT GitHub's full timestamp `"2026-07-11T12:00:00Z"`. Use `optionalString` (nullable non-empty string, no format check) for all three fields. There is no sha-format validator in the file and none is warranted — `optionalString` is correct for the shas too.

3. **Add `validateCompletion`** next to `validateFixState` (`schema.ts:499-509`), following its exact pattern (`if (value == null) return null;` → `isPlainObject` guard → build field-by-field):
   ```ts
   function validateCompletion(value: unknown, field: string): Completion | null {
     if (value == null) return null;
     if (!isPlainObject(value)) {
       throw new IntentionSchemaError(`Expected object or null for ${field}, got ${typeof value}`);
     }
     return {
       mergedAt: optionalString(value.mergedAt, `${field}.mergedAt`),
       mergeCommitSha: optionalString(value.mergeCommitSha, `${field}.mergeCommitSha`),
       graphCommitSha: optionalString(value.graphCommitSha, `${field}.graphCommitSha`),
     };
   }
   ```

4. **Add the field to the `Execution` interface** (`schema.ts:377-390`), after `fix?:` (line 389), using the identical additive-optional posture as `fix` — copy that JSDoc idea verbatim (optional at the type level so pre-existing literals need no update; `validateExecution` always normalizes to a validated object or `null`):
   ```ts
   completion?: Completion | null;
   ```

5. **Wire it into `validateExecution`** (`schema.ts:511-523`) — add one line to the returned object, after `fix:` (line 521):
   ```ts
   completion: validateCompletion(value.completion, `${field}.completion`),
   ```

**Out of scope:** any change to `reconcile-graph*`, `lib.sh`, or how the field is populated — this unit only adds the type + validator.

**Test.** `packages/intentionsutil/test/schema.test.ts`:
- **Update the existing default-nullables case** (`schema.test.ts:98-115`): the `.toEqual` at lines 107-114 must gain `completion: null` (mirrors exactly how `fix: null` was added to that same expectation — the input at line 105 omits `completion`, so the validator must default it to `null`).
- **Add a new case** constructing `execution: { …, completion: { mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "feedface", graphCommitSha: null } }` and asserting it round-trips intact (this specifically guards that the full ISO-8601 timestamp is NOT rejected — the trap in step 2).
- **Add a case** with `completion: { mergedAt: null, mergeCommitSha: null, graphCommitSha: "abc123" }` (the manual/out-of-band path) round-tripping intact.

**Dependencies:** none.

## Unit 2 — Pass `merge_commit_sha` through `gh_pr_view_rest`

**Recommended model:** sonnet

**Scope.** `.claude/skills/dispatch-propagate/scripts/lib.sh`, function `gh_pr_view_rest` (defined ~1093-1142), jq projection at **lines 1126-1141**. GitHub's REST pull payload includes `.merge_commit_sha` (a standard field, present when merged) but the projection does not currently pass it through (confirmed: repo-wide grep for `mergeCommitOid`/`mergeCommitSha`/`merge_commit_sha` returns zero hits). Add one line to the jq object, alongside the existing `mergedAt: .merged_at` at line 1131:
```
mergeCommitSha: .merge_commit_sha,
```
Also extend the function-header comment block (the field list ~1085-1090, e.g. after the `headRefOid` note) with a one-line description: `mergeCommitSha: the base commit the PR landed as (REST merge_commit_sha; null until merged)`.

**Out of scope:** any behavioral change; this is a pure additive projection field.

**Test.** `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, the existing merged-PR case at **lines 1981-1999**. That stub JSON (lines 1986-1995) is a merged PR but currently has no `merge_commit_sha` key. Add `"merge_commit_sha": "feedface0004"` to the stub object, and add one assertion after line 1998:
```
assert_eq "pr: merged PR mergeCommitSha passthrough" "feedface0004" "$(jq -r '.mergeCommitSha' <<<"$pv4")"
```
Optionally add a `.mergeCommitSha == null` assertion to the closed-unmerged case above it (the stub near lines 1975-1978 has no `merge_commit_sha`, so it should project `null`).

**Dependencies:** none (independent of Unit 1).

## Unit 3 — Fix the reconciler: classify merged-vs-closed by `mergedAt`, record completion evidence, stop deleting at the done-transition

**Recommended model:** opus

This is the judgment-heavy core. It changes two coupled contracts at once (the `--pr-states` input JSON and the `Plan` output JSON), so both the bash wrapper and the TS driver change together in this single unit to avoid any broken intermediate state.

### 3a. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` (bash wrapper)

**Fix the dead-`MERGED` classifier** at lines **70-83**. Replace the `case "$STATE"` block. The dead `MERGED)` case (lines 72-78) must go; branch on `mergedAt` presence instead. Capture `mergedAt` AND the new `mergeCommitSha` up front, keep the grace-window check for the merged case:
```bash
STATE=$(jq -r '.state' <<<"$PR_JSON")
MERGED_AT=$(jq -r '.mergedAt // empty' <<<"$PR_JSON")
MERGE_SHA=$(jq -r '.mergeCommitSha // empty' <<<"$PR_JSON")
case "$STATE" in
  OPEN) : ;;  # nothing to reconcile
  *)          # terminal (REST reports merged PRs as CLOSED, never MERGED)
    if [[ -n "$MERGED_AT" ]]; then
      AGE=$(( NOW - $(date -u -d "$MERGED_AT" +%s) ))
      [[ "$AGE" -ge "$GRACE" ]] || continue   # still settling — next sweep
      STATES=$(jq -c --arg id "$id" --arg ma "$MERGED_AT" --arg sha "$MERGE_SHA" \
        '. + {($id): {state:"merged", mergedAt:$ma, mergeCommitSha:$sha}}' <<<"$STATES")
    else
      STATES=$(jq -c --arg id "$id" '. + {($id): {state:"closed"}}' <<<"$STATES")
    fi ;;
esac
```
This makes the `--pr-states` JSON shape (documented at `reconcile-graph.ts:27`) go from flat `Record<string,string>` to `Record<string, {state:"merged"|"closed"; mergedAt?:string; mergeCommitSha?:string}>`. That contract is an internal wrapper-to-script contract, not persisted state — free to change.

**Drop the `--prune` consumption** (lines 107-116), since Unit 3b makes `reconcile-graph.ts` never prune. Remove the `mapfile -t PRUNE` line (107) and the prune loop (115); guard on `EDIT` only (line 109 becomes `if [[ "${#EDIT[@]}" -eq 0 ]]; then`); build `GC_ARGS` from edits only (drop line 115). Keep the `-m` message (line 114) — update its text to `graph: reconcile terminal tactics (record completion)`.

**Correct the header comment** (lines 8-15): it currently says done "PRUNES the node and its edges." Rewrite to: merged-without-residue or closed-not-merged → `done`, which now **records completion evidence (merged case) and leaves the node present** for the scripted census tick to verify and prune on a later tick; inbound-`blocked_by` repair and deletion move to census. Note that closed-unmerged transitions to `done` with **no** completion evidence, so census surfaces it as an integrity defect rather than silently deleting it.

**Manual/office-hours completion backfill** (documents the behavior this unit establishes; no new script): when a tactic's PR is closed-unmerged but its content genuinely landed out-of-band (the PR #2925 case), the reconciler transitions the node to `phase: "done"` with `execution.completion === null`, and the census tick surfaces it as an integrity defect. A human/AI session that judges the work complete backfills evidence by hand — read the node, set `execution.completion.graphCommitSha` to the sha of the out-of-band commit that landed the content (discovered via `git log`/`gh`), and write it back via `packages/intentionsutil/scripts/write-node.ts` (validate-and-write via stdin/`--file` JSON, standard contract), then `graph-commit`. Once `graphCommitSha` (or `mergedAt`) is set, the census tick's mechanical predicate verifies the node and prunes it on the next tick. `graphCommitSha` is recorded by the authoring session (which knows the sha), never derived from `graph-commit`, which prints no sha to stdout on success. Add this paragraph to the header comment block alongside the correction above.

*(Note — no change needed to `graph-select-target:355-364`: its same-tick defense-in-depth comment already reads `mergedAt != null` as the merge signal, which stays exactly correct. Leave it.)*

### 3b. `packages/intentionsutil/scripts/reconcile-graph.ts` (TS driver)

**Update the `Plan` interface** (lines 80-85): remove the `prune: string[]` field. New shape: `{ edit: string[]; deferred: {id,reason}[]; reconciled: {id,target}[] }`. (The only consumer is `reconcile-graph-merged`, updated in 3a.)

**Update the pr-states parse** (line 93): the value type is now `{ state: string; mergedAt?: string; mergeCommitSha?: string }`, not a bare string. In Pass 1 (lines 100-117), read `entry.state` where the code currently reads `state` directly (the `Object.entries` at line 103 now yields `[id, {state, mergedAt?, mergeCommitSha?}]`); keep the existing `reconcileMergedPhase(residue)` / `reconcileClosedPhase()` calls (`transitions.ts:225-231`) unchanged — they key off `entry.state === "merged"`.

**Pass 2 — main-qa transition (lines 119-126):** in addition to setting `node.phase = "main-qa"`, record the merge evidence when present (the node genuinely merged; recording it now means the eventual main-qa→done transition needs no re-fetch — `writeNode` round-trips `completion` through `validateExecution`, so later phase writes preserve it):
```ts
if (node.execution) {
  node.execution.completion = {
    mergedAt: entry.mergedAt ?? null,
    mergeCommitSha: entry.mergeCommitSha ?? null,
    graphCommitSha: null,
  };
}
```
(Carry the pr-states entry into scope here — e.g. thread `mainQaTargets` as `{id, entry}` pairs instead of bare ids.)

**Pass 3 — the central rewrite (lines 128-176).** Today Pass 3 does inbound-edge repair + round stamp + `rmSync` + `plan.prune`. New behavior:
1. **Stop deleting.** Remove the `rmSync` loop (lines 172-176) entirely and the now-unused `rmSync` import (line 31 → import only `readFileSync`). Remove `plan.prune` population.
2. **Remove inbound-`blocked_by` edge repair** (lines 137-144) and the `inboundBlockers` import. Justification (state in a code comment): the node now stays present at `phase: "done"`, so inbound `blocked_by` edges still resolve — `validateGraph` rule 13 only rejects edges to ABSENT ids (`schema.ts:867,886`), and the router already reads a present-done blocker as complete (`router.ts:156-168`). Edge repair is only needed at deletion time, which the census tick now owns (`tactic-census-scripted-tick` Unit 2).
3. **Write the done transition as an EDIT, not a prune.** For each `id` in `doneSet`: `readNode` → `node.phase = "done"` → for a `merged`-state entry, set `node.execution.completion` to the merge evidence (same shape as Pass 2; guard `node.execution` non-null though enumeration guarantees it) → for a `closed`-state entry, leave `completion` untouched (stays `null` — the deliberate under-determination census will flag) → `writeNode` → `editSet.add(id)`. Keep `plan.reconciled.push({ id, target: "done" })`.
4. **Keep round-stamping (lines 146-167) — but fix the "remaining children" filter.** Round-stamping stays here per `tactic-census-scripted-tick` design decision 3. **CRITICAL BUG TO FIX:** the `remaining` filter at lines 150-157 currently excludes `doneSet` ids and requires `n.phase !== null && n.phase !== "draft"` — it does **not** exclude `n.phase === "done"`. That was safe only because done nodes were always deleted (never present in `nodes`). Now that done nodes PERSIST, a previously-done-but-present sibling (from an earlier sweep) would be wrongly counted as a live "remaining" child and would block the round stamp forever. **Add `n.phase !== "done"` to that filter** so a strategy's round stamps when its last non-`done`, non-`draft` child reaches done this sweep.
5. **Simplify the edit/prune guard** (lines 178-181): `plan.edit = [...editSet].sort();` — no prune ids exist to filter out anymore.

**Out of scope:** any change to `transitions.ts` (`reconcileMergedPhase`/`reconcileClosedPhase`/`stampRound`/`hasNeedsMainResidue` are reused as-is); the census tick itself (sibling tactic); `graph-commit`.

**Correct the `reconcile-graph.ts` header comment** (lines 1-11): it describes "the done PRUNE with its inbound-blocked_by repair and the serving strategy's round stamp." Rewrite to: the done-transition now writes `phase: done` + completion evidence and leaves the node present; inbound-`blocked_by` repair and pruning moved to the scripted census tick; only round-stamping remains a done-transition concern here.

### 3c. Tests — `packages/intentionsutil/test/reconcile-graph.test.ts`

The `prStates` helper (lines 49-53) currently writes flat `Record<string,string>`. Change its signature/body to write the new nested shape: `states: Record<string, { state: string; mergedAt?: string; mergeCommitSha?: string }>`. Update every call site accordingly (e.g. `{ "tactic-done": "merged" }` → `{ "tactic-done": { state: "merged", mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "sha1" } }`; `"closed"` → `{ state: "closed" }`).

Rewrite the assertions (all current tests assert `plan.prune` / `existsSync(...).toBe(false)` — those must change because done no longer deletes):
- **"prunes a merged no-residue tactic…" (lines 56-80):** rename to "transitions a merged no-residue tactic to done, records completion, leaves it present, stamps the round." Assert: `existsSync(tactic-done.md)` is now **`true`**; `readNode("tactic-done").phase === "done"`; `readNode("tactic-done").execution.completion` deep-equals `{ mergedAt, mergeCommitSha, graphCommitSha: null }`; `plan.reconciled` contains `{id:"tactic-done", target:"done"}`; `plan.edit` contains `"tactic-done"` and `"strategy-s"`. **Edge repair no longer happens** — assert `readNode("tactic-next").blocked_by` is now **`["tactic-done"]`** (unchanged), and `plan.edit` does **not** contain `"tactic-next"`. Round still stamped: `strategy-s.rounds === {count:1, last_completed:"2026-07-10", last_aligned:null}`.
- **"routes a closed-not-merged tactic to done" (lines 82-88):** assert `existsSync(tactic-abandoned.md)` is `true`; `phase === "done"`; `execution.completion === null` (no evidence — the census-flaggable case); `plan.reconciled` contains `{id, target:"done"}`.
- **"routes a merged residue-bearing tactic to main-qa" (lines 90-102):** keep the main-qa assertions (already asserts file present + phase main-qa); ADD `readNode("tactic-residue").execution.completion` deep-equals the merge evidence object.
- **Round-stamp sibling tests (lines 104-149):** update `prStates` shape; the round-count assertions stay identical; drop the `plan.prune` assertions (assert on `plan.reconciled`/`plan.edit`/file-present instead). Note the tactics in these fixtures currently have `execution` defaulted to `null` via the `node()` builder (line 31) — a `merged` transition writing `completion` guards on `node.execution` being non-null, so **give those fixtures an `execution`** (e.g. `{ branch:"b", pr:1, attempts:{}, markers:[], strategy_fingerprint:null }`) so the completion-write path is actually exercised.
- **Add a new test:** a strategy with one child already at `phase:"done"` present on disk (no pr-states entry) plus one child transitioning to done this sweep → assert the round stamps exactly once. This directly covers the Pass-3 filter fix in 3b step 4 — without `n.phase !== "done"`, the present-done sibling would wrongly block the stamp and this test would fail.
- **"ignores…draft/done" (lines 151-158):** update `prStates` shape; assertions (`plan.reconciled` empty) stay.

**Dependencies:** Unit 1 (the `completion` field must exist), Unit 2 (`mergeCommitSha` must flow from `gh_pr_view_rest`).

## Reuse

- **`fix` / `FixState` additive-optional precedent** — `packages/intentionsutil/src/schema.ts`: `FixState` interface (371-375), its JSDoc on additive optionality (383-388 on `fix`), `validateFixState` (499-509), the field-by-field `validateExecution` builder (511-523). Unit 1 mirrors all of these.
- **Validator helpers** — `optionalString` (nullable non-empty string, no format check — use for `mergedAt`/`mergeCommitSha`/`graphCommitSha`), `isPlainObject`, `IntentionSchemaError`, all in `schema.ts`. **Avoid** `requireDateString`/`optionalDateString` (`schema.ts:431-441`, strict `YYYY-MM-DD` — rejects timestamps).
- **Schema-test pattern for an added nullable field** — `packages/intentionsutil/test/schema.test.ts:98-115` (the `fix`-was-added pattern: one case omitting the field asserting it defaults to `null`, plus explicit-value cases).
- **Pure transition decisions (unchanged, reused as-is)** — `packages/intentionsutil/src/transitions.ts`: `reconcileMergedPhase` (225-227), `reconcileClosedPhase` (229-231), `hasNeedsMainResidue` (242-248), `stampRound` (258-260). Unit 3 keeps calling these.
- **Router present-done tolerance (the safety proof for not-deleting)** — `packages/intentionsutil/src/router.ts`: `isOpenTactic` (120-124), `blockersComplete` (156-168, line 165), `servingStrategyIds` (131-141, used by the round-stamp scan).
- **Reconciler decision/land split + `GC_ARGS` construction** — `packages/intentionsutil/scripts/reconcile-graph.ts` (Plan JSON out, no git/gh) + `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` (owns gh + the one `graph-commit`). Only call site of `reconcile-graph.ts` is `reconcile-graph-merged:96`; only call site of `reconcile-graph-merged` is `dispatch-select-tick:477`.
- **`gh_pr_view_rest` jq projection** — `.claude/skills/dispatch-propagate/scripts/lib.sh:1126-1141` (add `mergeCommitSha` next to the existing `mergedAt: .merged_at` at line 1131).
- **byte-compat test harness** — `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, merged-PR case at 1981-1999 (the proof REST reports `CLOSED` not `MERGED`).
- **reconcile-graph test builders** — `packages/intentionsutil/test/reconcile-graph.test.ts`: `node()` builder (13-47, note `execution` defaults to `null` at line 31), `prStates()` fixture writer (49-53, whose shape Unit 3c changes), the body-splice helper (40-46).

## Verification

Unit 1 (schema) and Unit 3 (reconciler + tests):

```verify
npx vitest run --project packages/intentionsutil
```

Unit 2 (and the reconcile-graph-merged bash change) — the bash test script has no section filter (no arg/section parsing at its top), so it runs wholesale:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Guard that the completion field and its passthrough are wired (fast static checks):

```verify
grep -q "completion" packages/intentionsutil/src/schema.ts || exit 1
grep -q "mergeCommitSha: .merge_commit_sha" .claude/skills/dispatch-propagate/scripts/lib.sh || exit 1
grep -q "mergedAt" .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged
```

Guard that the dead-code prune path is gone from the driver:

```verify
if grep -q "rmSync" packages/intentionsutil/scripts/reconcile-graph.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/scripts/reconcile-graph.ts"; exit 1; fi
if grep -qE "^\s*prune:" packages/intentionsutil/scripts/reconcile-graph.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/scripts/reconcile-graph.ts"; exit 1; fi
```

**Manual / observational (run against a scratch intentions dir, never the live `intentions/`):**

1. Build a scratch dir with: (a) a `phase:"review"` tactic carrying `execution.pr`, serving a strategy; (b) a survivor draft tactic listing (a) in `blocked_by`. Write a pr-states file `{ "<a>": { "state":"merged", "mergedAt":"2026-07-11T12:00:00Z", "mergeCommitSha":"deadbeef" } }` and run `node --import tsx/esm packages/intentionsutil/scripts/reconcile-graph.ts --pr-states <file> --dir <scratch> --date 2026-07-11`. Confirm: (a)'s file is **still present**, its `phase` is `"done"`, its `execution.completion` = `{mergedAt, mergeCommitSha:"deadbeef", graphCommitSha:null}`; the survivor's `blocked_by` still lists (a) (no edge repair); the strategy's round is stamped; the printed plan has no `prune` key and lists (a) + the strategy under `edit`.
2. Repeat with `{ "<a>": { "state":"closed" } }`. Confirm (a) → `phase:"done"` with `execution.completion === null`, file present.
3. Dry-run `reconcile-graph-merged` end-to-end (or inspect its `GC_ARGS` construction under `set -x`) against a scratch checkout to confirm it now issues `graph-commit` with edit ids only (no `--prune`), and that `graph-commit`/`validate-graph.ts` accepts a present `phase:"done"` node that still has an inbound `blocked_by` edge — proving the not-deleting change does not trip graph validation.

## needs-main residue

- **id:** 12
- **title:** No regression in live `reconcile-graph-merged` runs over subsequent dispatch ticks
- **url_path:** `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`
- **expected_outcome:** Real dispatch ticks reconcile terminal tactics correctly with `execution.completion` evidence recorded (merged case) or left null (closed-unmerged case); no round-stamp stall as done nodes persist across sweeps; no unbounded graph growth from never-deleted done nodes.
- **finding:** Cannot be asserted at merge time — this behavior is only observable against `main` across subsequent real dispatch ticks (a planned deferral, per the PR's own QA plan item 12).
- **disposition:** skipped by human override, 2026-07-28. `/qa-main` routed this item to cannot-verify (non-browser outcome; the consuming sibling `tactic-census-scripted-tick` was still `phase: implement`, so the described regression can't yet manifest or be observed). The author reviewed that recommendation and chose to close this node without waiting on live-tick observation, since Units 1-3's own verification (schema/lib.sh/reconciler tests) already passed. Residual risk — a round-stamp stall or unbounded `done`-node growth — is not tracked against this node going forward; watch for it when `tactic-census-scripted-tick` lands instead.
