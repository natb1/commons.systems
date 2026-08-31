---
id: tactic-phase-evidence-fingerprint-bound
kind: tactic
statement: Bind phase-completion evidence (phase-log entry, qa-done marker, QA
  PR comment) to the scope fingerprint it was produced under, so a re-entry that
  finds evidence from a different fingerprint re-runs the phase instead of
  ratifying it
owner: ai
status: codified
parent: null
rationale: "Found 2026-07-25 diagnosing repeated /qa-fix sessions. A demotion
  wipes execution.markers to [] but the qa phase-log entry and the finalized QA
  PR comment SURVIVE it, so the re-entry session reads them as 'a prior session
  died before the terminal transition' and takes a transition-only pass over QA
  it never ran. This defeats the recorded net guarantee of
  strategy-graph-native-dispatch's Fingerprint & Freeze section — merge requires
  an unbroken implement/qa/review chain against the MERGE-TIME scope fingerprint
  — by reporting the chain unbroken when it was broken and papered over.
  Observed live after a false demotion: the PR #2958 re-entry transitioned with
  zero re-verification; the PR #2965 re-entry re-verified only partially. Both
  misdiagnosed the cause, concluding the prior transition 'never ran' when it
  had landed and been reverted by dispatch-graph-scope-sweep — the misdiagnosis
  is itself evidence that nothing binds the evidence to a fingerprint.
  Independent of tactic-transition-node-stamp-landed-body: that one stops the
  FALSE demotions; this one is what makes a GENUINE scope drift safe, since
  today a real drift would equally license ratifying stale QA evidence against
  changed scope."
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
  branch: tactic-phase-evidence-fingerprint-bound
  pr: 2975
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by:
  - tactic-scope-fingerprint-plan-substance
  - tactic-transition-node-stamp-landed-body
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Bind phase-completion evidence to the scope fingerprint it was produced under

## Context

Phase-completion evidence in the graph lane is **unbound**: nothing records the
scope fingerprint the evidence was produced under, so a re-entering session
cannot tell "this phase completed" from "this phase completed against a
*different* scope".

Three durable evidence surfaces exist today, and each one is trusted
unconditionally on re-entry:

1. **`execution.markers`** (`packages/intentionsutil/src/schema.ts:406`) — a bare
   `string[]` of `planned` / `qa-done` / `reviewed`
   (`packages/intentionsutil/src/transitions.ts:29-37`). `/review-fix`'s node lane
   short-circuits Steps 1–6 on the presence of `reviewed`
   (`.claude/skills/review-fix/references/node-lane.md:36-63`); the selector and
   the worker-start gate skip a review candidate on the same bare presence
   (`packages/intentionsutil/src/router.ts:298`,
   `packages/intentionsutil/scripts/check-node-selection.ts:246-259`).
2. **The `<!-- dispatch:qa-summary -->` PR comment** — written mid-phase at
   `/qa-fix` Step 2 (`.claude/skills/qa-fix/SKILL.md:263-270`), finalized at Step 4
   (`.claude/skills/qa-fix/references/pr-comment-summary.md:96-110`). The resume
   contract says items it already marks resolved are **not re-derived**
   (`.claude/skills/qa-fix/references/idempotency-preamble.md:46-59`).
3. **The `<!-- dispatch:phase-log -->` entry** — upserted per (phase, attempt) by
   `.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log:97-156`,
   read back as `PRIOR_PHASE_LOG` advisory context by the next worker.

`demote-node-to-implement` wipes `execution.markers` to `[]`
(`packages/intentionsutil/scripts/apply-node-transition.ts:191-194`) but has no
reach into the two PR comments — they survive every demotion. A re-entered
session therefore sees "no markers, but a finalized QA summary and a qa
phase-log entry", concludes a prior session died just before the terminal
transition, and takes a transition-only pass over QA it never ran. Observed
live: the PR #2958 re-entry transitioned with zero re-verification; the PR #2965
re-entry re-verified only partially. Both sessions diagnosed the cause as "the
prior transition never ran" when it had in fact landed and been reverted by
`dispatch-graph-scope-sweep` — the misdiagnosis is itself the symptom of unbound
evidence.

The consequence is a doctrine regression, not just a wasted tick: the recorded
net guarantee of `strategy-graph-native-dispatch` §Fingerprint & Freeze is that
**merge requires an unbroken implement/qa/review chain against the merge-time
scope fingerprint**. Today a broken-and-papered-over chain reports as unbroken.

**Intended outcome.** Every piece of phase-completion evidence carries the scope
fingerprint it was produced under, and every reader that would *ratify* evidence
first compares that fingerprint to the current one. A mismatch re-runs the phase
(via the existing demote-to-implement disposition) instead of ratifying it.

### Greenfield design (what to build)

Evidence is a typed, fingerprint-bound record on the node, and the GitHub
comments are **non-authoritative renderings** of it:

- `execution.markers` entries widen from `string` to
  `string | { marker, fingerprint, sha }`. The object form is *bound* evidence:
  it names the phase-start scope fingerprint the worker actually verified and the
  `origin/main` sha that fingerprint was read at.
- The authoritative answer to "did this phase complete?" comes only from the
  node's bound markers. No PR comment is ever trust-bearing for that question.
- The one artifact that legitimately needs its own binding is the **mid-phase**
  `<!-- dispatch:qa-summary -->` flush: it is written before any marker exists,
  so it cannot be gated on node-side evidence. It (and the phase-log entry
  alongside it) carries a machine-readable `<!-- dispatch:scope-fingerprint
  <hash> -->` line, and readers discount it on mismatch.
- The comparand — the node's **current** scope fingerprint at `origin/main` — is
  emitted once, by the shared front door
  (`.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target`), so no
  skill re-snapshots or re-derives it.

This is the same shape the codebase already uses for strategy stamps:
`StrategyStampValue = string | { hash, sha }`
(`packages/intentionsutil/src/schema.ts:343`) with `stampHash`
(`packages/intentionsutil/src/transitions.ts:344-346`) as the single home of the
shape discrimination, and `isFingerprintStale`
(`packages/intentionsutil/src/transitions.ts:365-377`) as the comparator. Reuse
that pattern rather than inventing a parallel one.

### Brownfield migration (how to get there)

Live nodes carry bare-string markers and comments with no binding line. Those
are **unbound**, not stale — "unknown provenance", not "different scope".

Policy, matching the existing missing-stamp bootstrap precedent verbatim in
spirit (`packages/intentionsutil/scripts/check-node-selection.ts:329-339` and
`.claude/skills/dispatch-propagate/scripts/transition-node:26-32`): **unbound
evidence fails OPEN** — it is treated as valid, exactly as today, so no in-flight
node stalls on merge. Bound evidence with a mismatched fingerprint fails
**closed** (re-run). Nodes accumulate bound markers from their next transition
onward; the flip of unbound-to-fail-closed is deliberately **out of scope for
this PR** and is recorded as a code comment at the policy site, not implemented.

### Explicit boundary against the two same-day sibling tactics

All three were recorded 2026-07-25 from one incident family. This tactic must not
absorb either:

- `tactic-transition-node-stamp-landed-body` owns the *stamp-content* defect:
  `refresh_stamp` (`.claude/skills/dispatch-propagate/scripts/transition-node:85-98`,
  called at :183) reads the worktree **after** `graph-commit`'s cleanup trap has
  `git reset --hard`-ed it back to the PR-branch tip
  (`packages/intentionsutil/scripts/graph-commit:301-303`), so it stamps the
  pre-edit fingerprint. That stops **false** demotions. **Do not touch
  `refresh_stamp`, `graph-commit`'s trap, or the stamp file format in this PR.**
- `tactic-scope-fingerprint-plan-substance` owns *what* is hashed — narrowing
  `tacticScopeFingerprint` to plan substance so machinery body appends are not
  scope drift by construction. **Do not change
  `packages/intentionsutil/src/router.ts:109-111` or its inputs in this PR.**
- **This** tactic makes a **genuine** drift safe: it is what stops stale evidence
  from being ratified once a real scope change has happened, independent of
  whether the drift detection that preceded it was correct.

---

## Unit 1 — Fingerprint-bound marker entries in the schema and pure layer

**Scope.**

`packages/intentionsutil/src/schema.ts`:
- Add, next to `StrategyStampValue` (`schema.ts:343`):
  `export type MarkerEntry = string | { marker: string; fingerprint: string; sha: string };`
  with a doc comment stating the bare-string form is legacy/unbound and fails
  open.
- Change `Execution.markers: string[]` → `markers: MarkerEntry[]`
  (`schema.ts:406`).
- Add `function validateMarkers(value: unknown, field: string): MarkerEntry[]`
  modeled on `validateCompletion` (`schema.ts:545-554`) and `validateIdArray`
  (`schema.ts:231-236`): require an array; for each item, a `string` passes
  through `requireString`, a plain object (`isPlainObject`, `schema.ts:215`) must
  carry `marker`, `fingerprint`, `sha` all via `requireString`, and anything else
  throws `IntentionSchemaError`.
- Wire it at `schema.ts:564`, replacing
  `validateIdArray(value.markers, …)`. **Leave `validateIdArray` in place** — it
  is still used by `serves` / `recovers` / `validates` / `blocked_by`
  (`schema.ts:638-663`).

`packages/intentionsutil/src/transitions.ts`, in the existing
`--- Execution markers ---` section (`transitions.ts:19-37`):
- `markerName(entry: MarkerEntry): string` — the single home of the shape
  discrimination, mirroring `stampHash` (`transitions.ts:344-346`).
- `markerBinding(entry: MarkerEntry): { fingerprint: string; sha: string } | null`
  — `null` for the bare-string form.
- `hasMarker(markers: MarkerEntry[], name: string): boolean` and
  `findMarker(markers, name): MarkerEntry | undefined`.
- `markerEvidenceStale(markers: MarkerEntry[], name: string, currentFingerprint: string): boolean`
  — `false` when the marker is absent (nothing to ratify), `false` when present
  but unbound (legacy grandfather, mirroring `isScopeStale`'s null-stamp
  fail-open at `transitions.ts:331-334`), `true` only when present **with** a
  binding whose `fingerprint !== currentFingerprint`. Its doc comment records the
  deferred fail-closed flip, wording modeled on
  `check-node-selection.ts:333-338`.
- `staleChainMarkers(markers: MarkerEntry[], currentFingerprint: string, phases?: string[]): string[]`
  — the merge-time chain check: for each phase in `phases` (default
  `["implement", "qa"]`), look up its marker name in `PHASE_COMPLETION_MARKER`
  (`transitions.ts:33-37`) and include it when `markerEvidenceStale` is true.
  Returns `[]` when the chain is intact or wholly unbound.
- Widen `addMarker(execution, marker, binding?)` (`transitions.ts:202-205`):
  idempotency now keyed on `markerName` (an already-present *name* is a no-op
  regardless of entry shape); with a `binding` it appends the object form, without
  one the bare string. Insertion order and no-duplicates behavior unchanged.

Mechanical reader updates (the widened element type breaks these):
- `packages/intentionsutil/src/router.ts:298` —
  `t.execution?.markers.includes(REVIEWED_MARKER)` → `hasMarker(t.execution?.markers ?? [], REVIEWED_MARKER)`.
  **No fingerprint compare here**: the pure selector has no body (`readNode`
  deliberately drops it, `router.ts:100-108`), so it cannot compute the
  comparand. The execute-side gate owns that (Unit 3).
- `packages/intentionsutil/scripts/apply-fix-state.ts:226-229` — `.includes(…)` →
  `hasMarker(…)`; `.filter((m) => m !== REVIEWED_MARKER)` →
  `.filter((m) => markerName(m) !== REVIEWED_MARKER)`.
- `packages/intentionsutil/scripts/check-node-selection.ts:137-152` — `readMarkers`
  returns `MarkerEntry[]`; the squatter branch at :149 drops its
  `typeof m === "string"` filter in favor of keeping strings **and** plain objects
  that carry a string `marker` (a malformed squatter entry is still dropped, not
  crashed). Line :246's `.includes(...)` → `hasMarker(...)`.

Tests:
- `packages/intentionsutil/test/transitions.test.ts` — `addMarker` with and
  without a binding (including re-add of the same name in the other shape being a
  no-op), `markerName`/`markerBinding` on both shapes, `markerEvidenceStale` for
  absent / unbound / bound-match / bound-mismatch, `staleChainMarkers` returning
  `[]` for an intact chain and the mismatching names otherwise.
- `packages/intentionsutil/test/schema.test.ts` — `validateMarkers` accepts both
  shapes, rejects an object missing `fingerprint`, rejects a number.
- `packages/intentionsutil/test/store.test.ts` — `writeNode` → `readNode`
  round-trip preserves a bound marker entry through the YAML serialization.

**Out of scope.** `tacticScopeFingerprint` and its inputs; `refresh_stamp`; the
stamp file format (`parseScopeStamp`, `transitions.ts:303-321`); any comment
format (Unit 4); `node-merge.ts` (it merges `execution` as one opaque field,
`node-merge.ts:63` — no per-element widening needed).

**Recommended model.** opus — cross-cutting type change with a
legacy-compatibility policy and several coupled readers.

## Unit 2 — Bind the phase-start fingerprint at every marker write

**Scope.**

`packages/intentionsutil/scripts/compute-freshness.ts`:
- Extend `FreshnessResult` (`:67-72`) with
  `stampedFingerprint: string | null`, `stampedSha: string | null`,
  `currentFingerprint: string | null`. Populate from the parsed stamp (`:90`) and
  `scopeFp` (`:88`); all three `null` in the node-not-on-main early return
  (`:78-80`).
- Update the `Stdout` contract comment in the header (`:26-28`).

`packages/intentionsutil/scripts/apply-node-transition.ts`:
- Add `--evidence-fingerprint <hash>` and `--evidence-sha <sha>` to `parseArgs`
  (`:63-127`), following the existing `--strategy-fingerprint` / `--strategy-sha`
  pairing rules verbatim (`:92-119`): `--evidence-fingerprint` **requires**
  `--evidence-sha`, else throw a descriptive error. Unlike
  `--strategy-fingerprint` this value is **not** keyed by strategy id — it is one
  scope fingerprint for the node.
- Thread it into the marker write at `:186-189`: `addMarker(execution, marker,
  binding)` where `binding` is `{ fingerprint, sha }` when both flags were given
  and `undefined` otherwise (the unbound grandfather path used when no stamp
  exists). Do **not** change the stdout JSON shape (`:145-152`).
- Update the usage header (`:19-38`).

`.claude/skills/dispatch-propagate/scripts/transition-node`:
- Read the new fields alongside the existing ones at `:135-137`:
  `STAMPED_FP="$(jq -r '.stampedFingerprint // empty' <<<"$FRESH")"`,
  `STAMPED_SHA="$(jq -r '.stampedSha // empty' <<<"$FRESH")"`.
- At the `APPLY_FLAGS` assembly (`:154-156`), append
  `--evidence-fingerprint "$STAMPED_FP" --evidence-sha "$STAMPED_SHA"` **only**
  when both are non-empty (i.e. `STAMP_MISSING` is false). When the stamp is
  missing, bind nothing — we do not know what the worker verified, and inventing
  the current fingerprint would record a falsehood.
- Add a short comment stating **why the stamp's fingerprint, not a fresh
  recompute**: the stamp is the scope the phase worker actually ran against; the
  forward path is only reached when `SCOPE_STALE` is false (`:144-151`), so on a
  clean forward transition the two agree, and where they could differ the stamp is
  the honest value.

Tests:
- `packages/intentionsutil/test/apply-node-transition.test.ts` — the new flags
  produce a bound marker entry; `--evidence-fingerprint` without
  `--evidence-sha` throws; neither flag reproduces today's bare-string marker.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — this
  harness already copies the real `transition-node`, `apply-node-transition.ts`
  and `compute-freshness.ts` into a throwaway clone (`:47`, `:84`, Case 1 at
  `:127-162`). Add a case that seeds the node **plus** a matching
  `.claude/worktrees/<id>.scope-fingerprint` stamp, lets the transition succeed
  (stub `graph-commit` to exit 0), and asserts the landed
  `intentions/<id>.md` carries the marker in bound object form with the stamp's
  fingerprint; and a second case with **no** stamp file asserting the bare-string
  form.

**Dependencies.** Unit 1.

**Recommended model.** sonnet — rote flag threading against an explicit
in-repo template, with the design decision already fixed by this plan.

## Unit 3 — Make the ratification gates fingerprint-aware

**Scope.**

`packages/intentionsutil/scripts/check-node-selection.ts`:
- Hoist the scope-fingerprint computation (`scopeFp` /
  `readNodeBody`, currently `:318`) to immediately after the node read, so both
  check 2 and check 5 share it. Verify no ordering side effect: `readNodeBody`
  only throws when the node file is absent, which the earlier existence check
  already rules out.
- Change check 2's reviewed-marker short-circuit (`:246-259`): fire
  `EXIT_STALE_SELECTION` only when the `reviewed` marker is **not**
  fingerprint-stale (`!markerEvidenceStale(readMarkers(node), REVIEWED_MARKER, scopeFp)`).
  A **stale** reviewed marker must fall through so check 5 (`:322-350`) returns
  `EXIT_SCOPE_STALE` (13) — the demote-to-implement disposition — instead of
  exit 12, which merely drops the worker and leaves the stale evidence in place
  to be ratified by the next re-entry. Record that routing reason in the
  comment.

`.claude/skills/dispatch-propagate/scripts/transition-node` — merge-time chain gate:
- Add `staleChainMarkers: string[]` to `compute-freshness.ts`'s `FreshnessResult`
  (extended in Unit 2), computed by calling the pure `staleChainMarkers` from
  Unit 1 against the snapshot node's `execution.markers` and `scopeFp`. **Reuse
  `compute-freshness.ts` rather than adding a new CLI** — it already reads the
  snapshot node and computes the fingerprint, and it is already copied into the
  bash harness.
- In `transition-node`, immediately after the scope-stale branch (`:144-151`) and
  **before** the `apply-node-transition.ts` mutation (`:161-165`), add: when
  `PHASE == review` and `staleChainMarkers` is non-empty, delegate to
  `"$UTIL_SCRIPTS/demote-node-to-implement" "$NODE_ID"` exactly as the scope-stale
  branch does, print
  `demoted <id> -> implement (broken evidence chain: <names>)`, and exit 0.
  Gating on `PHASE == review` (rather than on the post-apply `ARM_MERGE`) keeps
  the check ahead of the mutation, so the rollback trap (`:113-127`) is never
  involved. A demote is chosen over a hold because it is self-clearing: the
  re-selected implement worker re-establishes custody, where a hold would stall.
- Extend the header's freshness-gate list (`:26-32`) and the stdout outcome-line
  list (`:36-41`) with the new gate and outcome.

Tests:
- `packagesity/intentionsutil/test/check-node-selection.test.ts` — a
  bound-and-matching `reviewed` marker still exits 12; a bound-and-mismatching
  one exits 13 (not 12); a legacy unbound one exits 12 (grandfathered).
- A `computeFreshness` test asserting `staleChainMarkers` for intact / mismatched
  / unbound chains — add to the file that already covers `computeFreshness`, or
  create `packages/intentionsutil/test/compute-freshness.test.ts` if none exists
  (`grep -rl computeFreshness packages/intentionsutil/test/`).
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — a
  case where a `phase: review` node carries a `qa-done` marker bound to a
  fingerprint that no longer matches its body, asserting `transition-node` prints
  the `broken evidence chain` line, does **not** call `graph-commit` for a
  transition, and leaves the tree clean. Copy `demote-node-to-implement` into the
  harness alongside the scripts already copied at `:47`/`:84`, or stub it and
  assert it was invoked.

**Out of scope.** `router.ts:298` stays presence-only (no body available in the
pure selector — see Unit 1). No change to `demote-node-to-implement` itself.

**Dependencies.** Units 1 and 2.

**Recommended model.** opus — the disposition/ordering choices (exit 12 vs 13
routing, gate placement relative to the mutation and the rollback trap) are the
substance of the unit.

## Unit 4 — Bind the durable artifacts and make re-entry fingerprint-aware

**Scope.**

`.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target` — emit the
comparand once, for every phase skill:
- In the existing single `node --import tsx/esm -e` call (`:139-144`), add
  `tacticScopeFingerprint(readNode(dir, id).statement, readNodeBody(dir, id))` to
  the emitted `COMBINED_JSON`.
- Emit `SCOPE-FINGERPRINT: <hash>` as a new line directly after the `PR:` line
  (`:183-188`), and add it to the `Stdout` block in the header (`:32-39`).
- Parse-compatibility is already established for the existing consumers — all use
  anchored patterns (`sed -n 's/^PR: //p'` and `=== NODE-JSON ===`/`=== NODE-BODY ===`
  ranges): `.claude/skills/qa-fix/SKILL.md:88-92`,
  `.claude/skills/review-fix/SKILL.md`,
  `.claude/skills/implement/SKILL.md:80-83`,
  `.claude/skills/fix-checks/SKILL.md:87-91`,
  `.claude/skills/qa-main/SKILL.md:81-82`. Re-grep
  `grep -rln dispatch-derive-node-target .claude/skills/` at implementation time
  and confirm each consumer still parses; bind the value as `SCOPE_FINGERPRINT` in
  `/qa-fix` and `/review-fix` (the two skills whose re-entry paths change).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh`
  — update the stdout assertions (the harness seeds a node with `markers: []` at
  `:97`) and add a case asserting the emitted hash equals
  `tacticScopeFingerprint` for the seeded statement+body.

Artifact binding — both durable comments carry, as the line immediately after
their existing marker line, `<!-- dispatch:scope-fingerprint <hash> -->` using
the session's `SCOPE_FINGERPRINT`:
- `.claude/skills/qa-fix/SKILL.md:263-270` (the Step-2 flush) and
  `.claude/skills/qa-fix/references/triage-subagent.md` § Flush — the flushed
  `<!-- dispatch:qa-summary -->` comment.
- `.claude/skills/qa-fix/references/pr-comment-summary.md:10-14` (composition) —
  the Step-4 finalize writes the same binding line, so finalizing in place
  (`:96-110`) preserves it.
- The phase-log entry body: `dispatch-write-phase-log` stays **interface-stable**
  (it is deliberately content-agnostic on STDIN, `:1-28`), so the binding line
  goes into the composed entry body — `.claude/skills/qa-fix/SKILL.md:437-447`,
  `.claude/skills/qa-fix/references/pr-comment-summary.md:117-140`,
  `.claude/skills/review-fix/references/terminal-actions.md:57,69`, and
  `.claude/skills/implement/SKILL.md:418,431`.

Trust rules:
- `.claude/skills/qa-fix/references/idempotency-preamble.md:46-59` (Resume
  contract, condition 9): the prior `<!-- dispatch:qa-summary -->` comment and
  `PRIOR_PHASE_LOG` are resume input **only** when their
  `<!-- dispatch:scope-fingerprint … -->` line equals this session's
  `SCOPE_FINGERPRINT`. On a mismatch, treat both as history from a superseded
  scope: re-derive every item and **rewrite** the summary rather than
  incrementally trusting it. An **absent** binding line is grandfathered as
  today's behavior (unbound fails open), with the deferred-flip note.
- Add a node-lane `qa-done` re-entry gate to `.claude/skills/qa-fix/SKILL.md`'s
  preamble node branch, after the PARKED guard (`:103-110`), mirroring
  `.claude/skills/review-fix/references/node-lane.md:36-63` — the node lane has no
  such gate today, only the legacy label check at `:131`. Skip Steps 0.5–6 only
  when the `qa-done` marker is present **and** valid for the current fingerprint.
  Query the typed `.execution.markers` path over `NODE_JSON` (never text-scraping
  PR-body content — same discipline and rationale as `node-lane.md:44-56`),
  handling both entry shapes:

  ```bash
  QA_DONE_VALID=""
  if jq -e --arg fp "$SCOPE_FINGERPRINT" '
        [ (.execution.markers // [])[]
          | if type == "string" then { marker: ., fingerprint: null } else . end ]
        | any(.marker == "qa-done" and (.fingerprint == null or .fingerprint == $fp))
      ' <<<"$NODE_JSON" >/dev/null; then
    QA_DONE_VALID=1
  fi
  # Non-empty => valid terminal evidence for the CURRENT scope: re-entry is a
  # no-op. A qa-done marker bound to a DIFFERENT fingerprint leaves this empty,
  # so the phase re-runs in full instead of being ratified.
  ```

- `.claude/skills/review-fix/references/node-lane.md:57-63` — widen the existing
  `reviewed` jq the same way (both shapes, fingerprint compare, unbound
  grandfathered) and update the cross-reference at
  `.claude/skills/review-fix/references/terminal-actions.md:78`.

**Out of scope.** Any change to `dispatch-write-phase-log`'s flags or its
awk upsert (`:97-156`); the legacy issue lane's `dispatch:qa-done` **label**
check (`.claude/skills/qa-fix/SKILL.md:131`) — labels are not graph-lane evidence
and this tactic serves the graph lane.

**Dependencies.** Units 1 and 2.

**Recommended model.** opus — trust-boundary prose across two skills, where the
"never scrape attacker-controllable PR text" discipline and the fail-open
grandfathering must both be preserved exactly.

---

## Reuse

- `tacticScopeFingerprint(statement, body)` —
  `packages/intentionsutil/src/router.ts:109-111`. The **only** fingerprint
  algorithm; every binding value and every comparand comes from it.
- `StrategyStampValue` / `stampHash` / `isFingerprintStale` —
  `packages/intentionsutil/src/schema.ts:343`,
  `packages/intentionsutil/src/transitions.ts:344-346,365-377`. The
  string-or-object widening pattern and its single-home discrimination helper,
  copied for `MarkerEntry` / `markerName` / `markerEvidenceStale`.
- `isScopeStale` / `parseScopeStamp` —
  `packages/intentionsutil/src/transitions.ts:303-334`. The null-is-not-stale
  fail-open policy `markerEvidenceStale` mirrors, and the stamp parser (unchanged).
- `addMarker` / `PHASE_COMPLETION_MARKER` / `PLANNED_MARKER` / `QA_DONE_MARKER` /
  `REVIEWED_MARKER` — `packages/intentionsutil/src/transitions.ts:29-37,202-205`.
  The sole marker-add primitive and the marker vocabulary; extend, never
  duplicate.
- `validateCompletion` / `validateIdArray` / `isPlainObject` / `requireString` —
  `packages/intentionsutil/src/schema.ts:545-554,231-236,215,~180`. The validator
  toolkit and the nearest precedent for a typed sub-object on `Execution`.
- `computeFreshness` — `packages/intentionsutil/scripts/compute-freshness.ts:74-108`.
  Already reads the origin/main snapshot, the stamp, and the current fingerprint;
  extended here instead of adding a parallel comparator or a new CLI.
- `demote-node-to-implement` —
  `packages/intentionsutil/scripts/demote-node-to-implement`, invoked from
  `.claude/skills/dispatch-propagate/scripts/transition-node:144-151`. The
  existing "re-run instead of ratify" backward transition; the broken-chain gate
  delegates to it rather than inventing a disposition.
- `dispatch-derive-node-target` —
  `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target:139-188`.
  The one front door that snapshots `origin/main` and emits `NODE-JSON`/`NODE-BODY`;
  the current fingerprint is added to its output instead of each skill
  re-snapshotting.
- `dispatch-write-phase-log` —
  `.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log:97-156`, and
  `dispatch_marker_comment_id` — `.claude/skills/dispatch-propagate/scripts/lib.sh:308`.
  Content-agnostic upsert and shared marker-comment lookup; both reused as-is.
- `.claude/skills/review-fix/references/node-lane.md:36-63` — the typed-jq
  re-entry marker check whose shape `/qa-fix`'s new node-lane gate copies.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh:47,84,127-162`
  — the existing bash harness that runs the real `transition-node`,
  `apply-node-transition.ts` and `compute-freshness.ts` against a throwaway clone.

## Verification

Auto-runnable:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

Corpus regression — every landed node must still read and validate under the
widened `markers` shape (this is the real guard that the schema change did not
break the live graph):

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Manual / judgment:

- **Scripted reproduction of the #2958 failure mode** (do this instead of trying
  to replay the live PRs — the two cited PRs were not verified against GitHub
  during planning, and the incident depends on tick timing). In a throwaway
  intentions dir: seed a tactic at `phase: qa` with a `qa-done` marker bound to
  fingerprint `X`; confirm `check-node-selection.ts <id> review --dir … --stamp …`
  and the `/qa-fix` node-lane gate both treat it as valid. Then edit the body so
  the fingerprint becomes `Y` and re-run: the selection gate must exit 13 (not
  12), and the `QA_DONE_VALID` jq must evaluate empty so the phase re-runs.
  Finally strip the binding from the marker (bare string) and confirm both
  behave exactly as they do on `main` today — the grandfather path.
- **Artifact discounting.** On a real PR, confirm the flushed
  `<!-- dispatch:qa-summary -->` comment and the qa phase-log entry each carry a
  `<!-- dispatch:scope-fingerprint … -->` line, and that the value matches the
  front door's `SCOPE-FINGERPRINT:` output for that node.
- **Non-regression on the happy path** (judgment call, watch in production): the
  first few node-lane transitions after merge should print their normal
  `transitioned …` / `armed-merge …` lines, and the landed
  `intentions/<id>.md` should show markers in bound object form. Any
  `demoted <id> -> implement (broken evidence chain: …)` line on a node with no
  genuine scope change is a signal that the binding is recording a stale stamp —
  i.e. `tactic-transition-node-stamp-landed-body`'s defect surfacing through this
  gate, not a defect in this unit. Treat that as the trigger to land the sibling,
  not to weaken this gate.
- **Cost check.** The broken-chain gate's disposition is a full re-run of
  implement→qa→review. Confirm on the first production firing that it was a real
  chain break before it becomes routine.
