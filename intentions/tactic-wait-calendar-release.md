---
id: tactic-wait-calendar-release
kind: tactic
statement: Give the WAIT hold node a calendar release predicate —
  attributes.wait_until, swept by a tick sweep predicate, re-armed in place
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-31 /align-strategy calendar-blocking round
  (second round of that date). The WAIT hold node ratified earlier the same day
  has a shape, a counter and a cap but no release predicate for an event with no
  readable signal — the deploy-lag case it was created for. This node carries
  the implementing work for the calendar-release clarification recorded that
  round; that clarification, not this node, is the authoritative record of the
  decisions. Distinct from tactic-qa-main-verifiability-sort-criterion, which
  owns the machine-verifiable-vs-author-required SORT: this node owns the HOLD
  MECHANISM the sort's third outcome routes into. Finalized 2026-08-06 by an
  /align-tactics tactic-mode round; the node body now carries the full
  clean-session plan (8 units). That round corrected one inherited error in the
  record: the named sweep host. `dispatch-sweep` reaps merged/closed worktrees
  and stranded worker sessions and writes no graph node state at all, so the
  wait_until predicate belongs instead to the per-tick sweep family sourced into
  `dispatch-tick` (the `stale_hold_recheck_sweep` lineage) — the statement was
  amended from 'swept by dispatch-sweep' to 'swept by a tick sweep predicate'
  accordingly. The strategy's one-framework rule is honored either way: no
  second sweep is created. The same round recorded, as clarifications on the
  serving strategy, the producer-wiring boundary against
  tactic-qa-main-verifiability-sort-criterion (this node owns the qa-phase mint,
  the /qa-main re-arm, and flipping that sibling's interim park branch) and the
  decision to key the router exclusion and the enumerator on
  `attributes.wait_until` presence with a resolvable source, never on a bare
  `tactic-wait-` id prefix — which would collide with this node's own id."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-wait-calendar-release
  pr: 3051
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix:
    since: 2026-08-11
    attempt: 1
    pushed_sha: null
  conflict: null
  completion:
    mergedAt: 2026-08-20T16:31:30Z
    mergeCommitSha: 38934c61ca55eba061e156d27ec4fd64af8e4956
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Give the WAIT hold node a calendar release predicate — attributes.wait_until, swept by a tick sweep predicate, re-armed in place

## Context

The strategy's WAIT hold node (ratified 2026-07-31, first `/align-strategy`
round of that date) gives the qa/main-qa lanes a third outcome besides pass and
park: an *observation has not happened yet* hold that must never wake a human.
It has a shape (a `tactic` node born `office_hours: null` with no phase, held by
its source's `blocked_by`), an attempt counter and a finite cap — but no release
predicate for an event with **no readable signal**, which is exactly the
deploy-lag case that motivated it. The second round of the same date settled the
predicate: **calendar time**, `attributes.wait_until`, read by one more
predicate on the existing per-tick sweep family, releasing the node to
`phase: done` (which clears the source through `blockersComplete`), re-armed in
place on a repeat not-yet-observed verdict, and parking to the author when the
cap is exhausted. That clarification — not this node — is the authoritative
record of the decisions; this plan implements them.

Nothing of it exists yet. Verified against HEAD `51a2ad90` this round:

- `packages/intentionsutil/src/officeHours.ts:82` — `if (n.office_hours === null) continue;`.
  An `office_hours`-null WAIT is absent from the human queue **by construction**,
  not by a filter that can fail open. No change needed; this is the "never wakes
  a human" property, and it is why the rejected alternative (a non-null
  `office_hours` with a new `session_type` filtered out of the queue) stays
  rejected.
- `packages/intentionsutil/src/router.ts:237` — `blockersComplete` returns false
  for any blocker present with `phase !== "done"`. A phase-less WAIT genuinely
  holds its source, and setting the WAIT's own `phase: done` is *sufficient* to
  release it — no `blocked_by` edge removal is needed (unlike `resolve-hold`,
  which must strip the edge because a hold is cleared by two independent facts).
  No change needed.
- `packages/intentionsutil/src/router.ts:519-521, 572-573` — the draft-candidate
  loop skips only `subtreeParentIds` before emitting an `/align-tactics`
  candidate for any `isDraft` node (`router.ts:147`: `phase === null ||
  phase === "draft"`). **The WAIT exclusion the design calls mandatory is
  ABSENT.** Without it the router spawns an `/align-tactics` worker on every
  armed WAIT node, every tick.
- No `attributes.wait_until` reader, writer, validator or producer exists
  anywhere in `packages/` or `.claude/skills/`.

Two corrections to the pre-plan draft body, both carried into the plan below:

1. **Line anchors had drifted.** The draft cited `router.ts:343-355` (draft
   loop) and `router.ts:168-175` (`blockersComplete`); at HEAD those are
   `router.ts:569-599` and `router.ts:237-243`. The mechanisms are exactly as
   described — only the numbers moved.
2. **The named sweep host was wrong.** The draft and the clarification say
   "`dispatch-sweep` — it already reads `nodeMinAgeSeconds` from its config".
   `nodeMinAgeSeconds` is real (`.claude/skills/dispatch-propagate/scripts/dispatch-sweep:139-152`,
   `sweep.example.json`), but that script's job is reaping merged/closed
   **worktrees** and stranded **sessions**, fired from the worker Stop hook via
   `dispatch-spawn-sweep`; it never touches graph node phase or attributes. The
   per-tick sweep family the WAIT predicate actually belongs to — the one landed
   by `tactic-denied-command-parks-node` (PR #2994) and extended since — is the
   set of sweeps `dispatch-tick` sources and runs before selection:
   `standdown_recheck_sweep`, `stale_hold_recheck_sweep`, `frozen_session_sweep`,
   `terminal_without_disposition_sweep`. The closest structural analog is
   `stale_hold_recheck_sweep` (`lib-stale-hold-recheck.sh`): enumerate graph
   nodes through a pure TS enumerator, evaluate one predicate, resolve through a
   dedicated CLI, always return 0. **This plan hosts the WAIT predicate there.**
   That is still "one framework, several predicates" — the framework is the
   per-tick sweep family, and each predicate has had its own `lib-*.sh` file
   since `lib-standdown-recheck.sh`, which records why (independent fail-safe
   postures must not be coupled).

Intended outcome: a WAIT node can be armed, holds its source for a bounded
calendar interval, releases itself, is re-armed in place with a surviving
attempt count, and escalates to the author exactly once at the cap — all in
owned, offline-testable code with no per-node model spend.

**Explicitly out of scope, and why.** `.claude/skills/qa-main/SKILL.md:449-473`
carries a forward pointer: *"when `tactic-wait-calendar-release` lands … this
branch emits a WAIT hold node instead of parking. Do not mint a WAIT hold node
before then."* Flipping that branch is the natural producer wiring, and it is
**deliberately not planned here**: a dispatch worker running in auto mode cannot
commit an edit under `.claude/skills/**` (the auto-mode classifier denies it as
self-modification of agent-behaviour-controlling files — sibling files under
`.claude/skills/**/scripts/` commit fine, which is why the sweep library and
`dispatch-tick` edits below are in scope). An autonomous unit that edits
`qa-main/SKILL.md` would burn its attempts and park. The producer flip is
therefore left as a follow-up for an interactive/office-hours session, and this
tactic ships the mechanism plus a **manually invocable** producer CLI
(`arm-wait`) so the flip is a prose edit against a live, tested primitive rather
than a design round. Record that follow-up when this node reaches `done`.

## Vocabulary this plan fixes (read before any unit)

A **WAIT node** is a `kind: tactic` node with:

| field | value |
|---|---|
| `id` | `tactic-wait-<source-id-without-leading-"tactic-">` — the canonical derivation, load-bearing (see U1) |
| `phase` | `null` while armed; `"done"` after release. Never any other value. |
| `office_hours` | `null` while armed (this is what keeps it out of the human queue); non-null only after the cap-park |
| `owner` | `"ai"` |
| `status` | `"codified"` |
| `serves` | copied verbatim from the source node |
| `blocked_by` | `[]` (the edge points the other way: `source.blocked_by` names the WAIT) |
| `attributes.wait_for` | the source node id |
| `attributes.wait_until` | ISO-8601 UTC instant, `YYYY-MM-DDTHH:MM:SSZ` |
| `attributes.wait_attempts` | positive integer, `1` at mint, incremented on each re-arm |
| `attributes.wait_reason` | non-empty string: the awaited event, verbatim, for the cap-park's `office_hours.reason` |
| `attributes.wait_recommendation` | non-empty string: what the author should do at cap, for `office_hours.recommendation` |

Two deliberate divergences from the clarification's literal wording, both
recorded here so a later round does not read them as drift:

- The counter is `attributes.wait_attempts`, not `attributes.attempts`.
  `attributes` is a shared passthrough bag (`schema.ts:294` `validateAttributes`
  only checks plain-object shape), so every WAIT field carries the `wait_`
  prefix as one namespaced family — exactly as `hold_kind`/`hold_for` do
  (`packages/intentionsutil/src/hold-sweep.ts:113-118`). An unprefixed
  `attempts` would collide with the next feature that wants that word.
- `wait_reason` / `wait_recommendation` are written **at mint**, not composed at
  cap time. This is how the strategy's standing condition — *an author-lane
  post-merge verification node carries at birth everything a fresh office-hours
  sitting needs* — is honoured by a node that is born `office_hours: null` by
  construction. The context is recorded at birth; only its promotion into
  `office_hours` waits for the cap.

Lifecycle, end to end:

```
arm-wait <source> --until <iso> ...   → mint: WAIT phase null, wait_attempts 1,
                                        source.blocked_by += wait id  (ONE graph-commit)
  ... source is not selectable (blockersComplete false) ...
tick sweep: now >= wait_until, wait_attempts < cap
                                      → release-wait: WAIT phase done  (ONE graph-commit)
  ... source is selectable again; /qa-main re-runs the check ...
still not observed → arm-wait <source> --until <later>   → re-arm IN PLACE:
                                        phase back to null, wait_until pushed,
                                        wait_attempts += 1, source.blocked_by UNCHANGED
  ... repeat ...
tick sweep: now >= wait_until, wait_attempts >= cap
                                      → park-node <wait-id> <wait_reason> <wait_recommendation>
                                        (the WAIT itself parks; the source stays held)
```

`WAIT_ATTEMPT_CAP = 4` (four arms ≈ four days at the 24h default) — a stipulated
starting value, owned by the sweep, not by whoever authors the node.

**The recorded residual risk is CLOSED by this plan, not accepted.** The draft
recorded it as accepted-not-mitigated: a census that prunes a released WAIT
between release and re-arm resets `wait_attempts` to 1 and the cap becomes
unreachable. It is mechanically enumerable — `computeDebt`
(`packages/intentionsutil/scripts/graph-census-debt.ts:115-152`) puts every
`phase === "done"` node into `donePresent`, which *is* the owed-prune batch the
census agent drains, and Rule 13 forces the source's `blocked_by` edge to be
removed in the same commit as a prune, permanently breaking re-arm. U3 excludes
a released WAIT whose source is still present and not `done` from `donePresent`.
That is a one-predicate change in owned, offline-testable code, so there is no
reason to carry the risk.

---

## Unit 1 — `src/waits.ts`: the WAIT vocabulary

**Scope.** New file `packages/intentionsutil/src/waits.ts`, plus
`packages/intentionsutil/test/waits.test.ts`. Nothing else changes.

Mirror `packages/intentionsutil/src/holds.ts:1-140` closely — it is the
single-source-of-truth module pattern for exactly this. Export:

- `WAIT_ATTEMPT_CAP = 4` — the finite cap. One constant, imported by both the
  enumerator (U2) and the shell sweep (U7, via the enumerator's classification),
  so the cap has one home.
- `WAIT_ID_PREFIX = "tactic-wait-"` and
  `waitIdFor(sourceId: string): string` — `` `tactic-wait-${sourceId.replace(/^tactic-/, "")}` ``,
  asserting the result against the node-id slug shape
  `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` and **throwing** when it does not fit, copied
  verbatim from `holds.ts:63,79-89` (the slug shape
  `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:79` enforces).
  Carry over `holdIdFor`'s doc note about why the throw is a non-match rather
  than a failure.
- `WAIT_UNTIL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/` and
  `parseWaitUntil(value: unknown): number | null` — returns epoch ms, or `null`
  when the value is not a string, fails the regex, or `Date.parse` yields `NaN`.
  Deliberately NOT `schema.ts:577-592`'s `requireDateString` (`YYYY-MM-DD`): a
  24h default with tick-granularity re-checks needs sub-day precision, and the
  clarification specifies ISO 8601.
- `isWaitNode(node: IntentionNode): boolean` — `kind === "tactic"` AND
  `attributes.wait_for` is a non-empty string AND `node.id === waitIdFor(wait_for)`.
  The id binding is the same **security property** `isCanonicalHoldId`
  (`hold-sweep.ts:44-69`) documents, and its doc comment must be adapted, not
  dropped: the sweep enumerates BY node id while a downstream writer derives the
  id from the source, so a decoy node carrying `wait_*` attributes under a
  non-canonical id would otherwise have its classification applied to a
  different node.
- `WAIT_RELEASE_SENTENCE` — the load-bearing closing sentence every WAIT body
  ends with, the analog of `holds.ts:66-68`'s `RESOLUTION_SENTENCE`:
  ``"the tick sweep releases this node to `phase: done` when `attributes.wait_until` passes — do not clear the source's `blocked_by` by hand, and do not park this node while it is armed."``

Out of scope: any store/git/network access (this module is pure and
browser-safe, like `holds.ts`), any schema change (U3), any consumer.

**Recommended model.** sonnet.

---

## Unit 2 — `src/wait-sweep.ts`: the pure classifying enumerator

**Scope.** New file `packages/intentionsutil/src/wait-sweep.ts` plus
`packages/intentionsutil/test/wait-sweep.test.ts`. Mirror
`packages/intentionsutil/src/hold-sweep.ts:1-140` — pure, zero fs/git/network,
decides everything from the `nodes` array it is handed.

Export `listWaitCandidates(nodes: IntentionNode[], nowMs: number): WaitCandidate[]`,
`WaitCandidate = { waitId, sourceId, attempts, waitUntil, cls }`, sorted by
`waitId` ascending, with
`WaitClass = "due" | "waiting" | "capped" | "malformed"`.

Ladder, in this order:

1. Skip any node where `isWaitNode(node)` is false (U1).
2. Look up `attributes.wait_for` in the same array. Source **absent** → emit
   nothing (an orphan WAIT has nothing to hold; the census will collect it).
3. Source present but `source.blocked_by` does not contain the WAIT id → emit
   nothing (already detached).
4. `node.phase === "done"` → emit nothing. This is the normal, quiescent
   post-release state; unlike a hold's `edge-residue`, the surviving edge is
   **by design** (it is what makes re-arm-in-place work), so it is not debt and
   must not be reported as such.
5. `node.phase !== null` (any ladder phase) → `malformed`. U3's validate rule
   makes this unlandable, so it can only appear in a hand-edited tree; report it,
   never act on it.
6. `parseWaitUntil(attributes.wait_until) === null` → `malformed`. Same posture:
   an unparseable deadline is reported, never treated as due. **Never** default a
   missing/garbled `wait_until` to "now" — that is the silent-pass failure class
   this strategy already tracks five members of.
7. `attempts` = `attributes.wait_attempts` when it is an integer `>= 1`, else
   `malformed` (not a silent default to 1 — a corrupted counter must not silently
   restart the cap).
8. `node.office_hours !== null` → emit nothing. The cap-park already fired; the
   author owns it now, and the sweep must not re-park or release it.
9. `nowMs >= waitUntil` and `attempts >= WAIT_ATTEMPT_CAP` → `capped`.
10. `nowMs >= waitUntil` → `due`.
11. Otherwise → `waiting`.

Out of scope: any I/O, the CLI wrapper (U5), the shell sweep (U7).

**Recommended model.** sonnet.
**Dependencies.** Unit 1.

---

## Unit 3 — validate-graph Rule 22 and the owed-prune exclusion

**Scope.** `packages/intentionsutil/src/schema.ts`,
`packages/intentionsutil/scripts/graph-census-debt.ts`, and their tests
(`test/schema.test.ts`, `test/graph-census-debt.test.ts`).

**(a) Rule 22 — WAIT-node shape.** Add `checkWaitNodeShape(node, problems)` next
to `checkTierMarkShape` (`schema.ts:1082-1104`) and call it from `validateGraph`'s
per-node block alongside the Rule 19/20 calls at `schema.ts:1286-1289`. It fires
**only** when `node.kind === "tactic"` and `attributes.wait_for` is present, and
rejects:

- `wait_for` not a non-empty string;
- `node.id !== waitIdFor(wait_for)` (a `waitIdFor` throw is itself a violation,
  reported with its message);
- `wait_until` absent, or failing `WAIT_UNTIL_RE` / `Date.parse`;
- `wait_attempts` present and not an integer `>= 1`;
- `wait_reason` / `wait_recommendation` absent or not non-empty strings;
- `phase` neither `null` nor `"done"`.

That last clause is why the router needs **no** exclusion in its executable-tactic
loop (`router.ts:524-558`): a WAIT can never carry a ladder phase on `main`, so
there is no phase worker to suppress. Prefer this clear write-path error to a
silent selector skip (`.claude/rules/code-style.md`).

`schema.ts` must import from `./waits.js`; keep the import type-only where
possible so the browser-safe graph barrel is unaffected (`waits.ts` is pure, so
a value import is also safe — `holds.ts` is already imported this way by
`hold-sweep.ts`).

**Bootstrap check (do this before writing the rule):** grep confirms no node in
`intentions/` carries `wait_for`/`wait_until` today, so this tightening cannot
retro-fail CI. Re-run the grep at implementation time; if a WAIT node has landed
in the meantime, reconcile it in the same commit.

**(b) Owed-prune exclusion.** In `computeDebt`
(`graph-census-debt.ts:115-152`), the `if (n.phase === "done") donePresent.push(n.id)`
line becomes conditional: skip a node that `isWaitNode(n)` **and** whose
`attributes.wait_for` resolves in `nodes` to a node with `phase !== "done"`. A
released WAIT whose source is still open is a live re-arm target, not owed debt;
pruning it resets the counter and (per Rule 13) strips the source's edge, making
the cap unreachable. A released WAIT whose source is gone or itself done stays
in `donePresent` — it genuinely is debt. Add a doc comment naming this node id
so the exception is not later read as a bug.

Out of scope: any change to Rules 1-20; any change to the census node's body or
threshold logic.

**Recommended model.** opus — `validateGraph` is graph-wide blast radius and
`computeDebt` drives what a census agent deletes.
**Dependencies.** Unit 1.

---

## Unit 4 — the router draft-candidate exclusion

**Scope.** `packages/intentionsutil/src/router.ts` and
`packages/intentionsutil/test/router.test.ts`. This is the change the WAIT design
calls mandatory and which is confirmed absent at HEAD.

Build a `waitNodeIds: Set<string>` in the same single pre-pass shape as
`subtreeParentIds` (`router.ts:519-521`) — `for (const t of tactics) if (isWaitNode(t)) waitNodeIds.add(t.id);`
— and skip it in the draft branch of the frozen-tactic loop, immediately beside
the existing container skip at `router.ts:572-573`:

```ts
    if (isDraft(t)) {
      if (subtreeParentIds.has(t.id)) continue; // permanent container, not an undecomposed draft
      if (waitNodeIds.has(t.id)) continue;      // armed calendar WAIT, not an undecomposed draft
```

with a comment naming *why*: an armed WAIT is phase-less **and**
`office_hours`-null by construction, so both existing gates pass it through and
the router would spawn an `/align-tactics` worker on it every tick.

Import `isWaitNode` from `./waits.js`. Do **not** overload `phase` or
`office_hours` to carry the exclusion — the whole point of the rejected
alternative is that `office_hours` must stay null.

Tests, added to `router.test.ts` alongside the existing `subtreeParentIds` cases:
an armed WAIT node emits **no** candidate; its source emits none either (blocked);
a released WAIT (`phase: done`) emits none and its source **does** emit its real
phase candidate; a node with `wait_*` attributes under a non-canonical id is
**not** excluded (it is not a WAIT — it is an ordinary draft, and Rule 22 will
have refused it at the write path anyway).

Out of scope: the executable-tactic loop (see U3(a)), the strategy loop, any
attention/precedence change.

**Recommended model.** sonnet.
**Dependencies.** Unit 1.

---

## Unit 5 — `wait-node-decide.ts` and `list-recheckable-waits.ts`

**Scope.** Two new files under `packages/intentionsutil/scripts/`, plus
`test/wait-node-decide.test.ts`.

**(a) `wait-node-decide.ts`** — the network-free DECISION half of arm/re-arm,
mirroring `hold-node-decide.ts:1-200` (read it first; this is a close structural
copy, decision/land split included).

```
node --import tsx/esm wait-node-decide.ts --source <id> --until <iso>
  --reason-file <f> --recommendation-file <f> [--body-file <f>]
  [--now <iso>] [--intentions <dir>]
```

Stdout: one JSON object
`{ disposition, wait_id, node?, node_body?, node_body_append?, source_blocked_by, source_edge_needed }`.

Dispositions (the analog of `NONE`/`EXISTING`/`REOPENED`):

- `NONE` — no node at `waitIdFor(source)`. Emit a fully-constructed WAIT node
  (`wait_attempts: 1`, `office_hours: null`, `phase` omitted, `serves` copied
  verbatim from the source per `hold-node-decide.ts:110-112`) plus its body.
- `REARM` — a node exists at `phase === "done"`. Emit `phase: null`, `wait_until`
  set to `--until`, `wait_attempts` incremented, `wait_reason`/`wait_recommendation`
  refreshed from the files, and a dated `## Arm <now>` stanza to append
  (`occurrenceStanza`, `hold-node-decide.ts:74-90`, is the template).
- `EXTEND` — a node exists at `phase === null` and `office_hours === null`, i.e.
  still armed. Emit only `wait_until` (pushed to `--until`) and the stanza;
  **`wait_attempts` is NOT incremented** — an extension of a live wait is not a
  new attempt, and incrementing here would let a chatty caller exhaust the cap
  without a single observation ever being taken.
- Throw (exit 2) when the source is absent from the store, when `--until` is not
  a valid `WAIT_UNTIL_RE` instant, when `--until` is not strictly in the future
  relative to `--now`, or when the existing node carries a non-null
  `office_hours` (the cap-park fired; the author owns it, and re-arming would
  erase the escalation — `clear-park` first).

`source_blocked_by` / `source_edge_needed` follow `hold-node-decide.ts:180-190`
exactly: the edge is added idempotently on `NONE` and is left untouched on
`REARM`/`EXTEND` (`source.blocked_by` never churns — the doctrine's re-arm
requirement).

The body it builds must state, at minimum: the awaited event, the source id, the
concrete re-check recipe (from `--body-file` when supplied), the current
`wait_until` and attempt count, and `WAIT_RELEASE_SENTENCE` as its closing line.

**(b) `list-recheckable-waits.ts`** — thin CLI over `listWaitCandidates`, copied
near-verbatim from `list-recheckable-holds.ts:1-72`, including its `listNodesStrict`
comment (strict enumeration is load-bearing: the tolerant `listNodes` would drop
an unreadable node file and let the sweep report a clean pass over a lossy read).

```
node --import tsx/esm list-recheckable-waits.ts --dir <intentions-dir> [--now <iso>]
```

Stdout: one TSV line per candidate,
`<wait-id>\t<source-id>\t<attempts>\t<wait-until>\t<class>`. Exit 0 on success,
exit 2 on usage error or malformed store. `--now` defaults to
`new Date().toISOString()` and exists as the test seam.

Out of scope: any write, any git, any `gh`.

**Recommended model.** sonnet.
**Dependencies.** Units 1, 2.

---

## Unit 6 — `arm-wait` and `release-wait`: the landing halves

**Scope.** Two new bash scripts under `packages/intentionsutil/scripts/`, two new
harnesses `test-arm-wait.sh` / `test-release-wait.sh` beside them, and two new
steps in `.github/workflows/unit-tests.yml`.

**(a) `arm-wait`** — model on `packages/intentionsutil/scripts/hold-node:1-120`
(same decision/land split, same flag-parsing shape, same one-commit rule):

```
arm-wait <source-node-id> --until <iso> --reason-file <f> --recommendation-file <f> [--body-file <f>]
```

It must reproduce, not reinvent, `hold-node`'s invariants:

- **fetch `origin/main` and overwrite the local node file(s) before reading** —
  this script routinely runs from a far-behind worktree;
- pass `graph-commit` a `--base <id>=<blobsha>` compare-and-swap token per
  **pre-existing** file (use `dump-node.ts --out-dir` and hand its
  `base-manifest.txt` straight to `graph-commit --base`); a first mint's WAIT
  file is legitimately absent and gets no token;
- write only through `write-node.ts` (the single validation gate) — never
  hand-authored markdown;
- land the WAIT node and the source's `blocked_by` edge in **ONE**
  `graph-commit` invocation (both ids passed positionally);
- restore every touched `intentions/<id>.md` on any non-landing exit path, with
  `park-node`'s conditional-restore guard (`park-node:36-54`): decline the
  restore when HEAD has moved or the file no longer hashes to what this script
  wrote, or the "rollback" becomes an uncommitted revert of a landed commit and
  a fleet-wide dirty tree.

Stdout: one line — `armed <wait-id> (<disposition>)`. Exit codes on `park-node`'s
scheme: 0 landed; 1 write/`graph-commit` failure (refused CAS included); 2 usage
error.

**(b) `release-wait`** — the sweep's write path:

```
release-wait <wait-node-id> [--base <blobsha>|<id>=<blobsha>|<manifest-file>]
```

Same fresh-`origin/main` + `--base` + rollback scaffolding, but a single node and
a single `graph-commit`: read the WAIT node, **re-assert** it is armed
(`isWaitNode` true, `phase === null`, `office_hours === null`, and
`now >= wait_until` — the sweep's classification is re-verified here rather than
trusted, since minutes can pass between enumeration and write), set
`phase: "done"`, write through `write-node.ts`, land, then **re-read from
`origin/main` and assert the write survived** (`resolve-hold`'s post-land
re-read; `graph-commit`'s layer-2 union has a documented history of silently
dropping parts of a write). Refuse with a distinct non-zero exit when the
re-assert fails, so the sweep reports `resolve-failed` and retries next tick
rather than forcing a release.

The **cap-park needs no new script**: the sweep calls the existing
`packages/intentionsutil/scripts/park-node <wait-id> <wait_reason> <wait_recommendation>`
(`park-node:88`), on the WAIT node's own id — never the source's. That keeps a
single `office_hours` writer in the tree, with its fresh-main, CAS and rollback
already proven.

Harness shape: copy `packages/intentionsutil/scripts/test-park-node.sh` /
`test-hold-node.sh` (throwaway `mktemp -d` repo, real `src/` + a `node_modules`
symlink, a stubbed remote). Cases at minimum: fresh mint; re-arm from `done`
increments; extend while armed does **not** increment; source edge added once and
never duplicated; re-arm refused on a parked WAIT; stale `--base` refused with
nothing landed and a clean tree; `release-wait` on an armed-but-not-yet-due node
refused; `release-wait` post-land re-read failure reported.

**CI wiring is mandatory and easy to miss:** `run-unit-tests.sh` only globs
`test-*.sh` inside `.claude/skills/dispatch-propagate/scripts/`, so a suite whose
SUT lives in `packages/intentionsutil/scripts/` runs in CI **only** when wired
unconditionally in `.github/workflows/unit-tests.yml` — see the comment at
`.github/workflows/unit-tests.yml:196-203` and the existing `test-park-node.sh` /
`test-hold-node.sh`-class steps at lines 251-261. Add both new suites there.

Out of scope: `graph-commit` itself; `park-node`; any `gh` call (these scripts
stay gh-free).

**Recommended model.** opus — fresh-main refresh, compare-and-swap, rollback and
post-land verification are the hazard class `resolve-hold`/`park-node` document
at length.
**Dependencies.** Units 1, 3, 5.

---

## Unit 7 — `lib-wait-recheck.sh`: the tick sweep predicate

**Scope.** New `.claude/skills/dispatch-propagate/scripts/lib-wait-recheck.sh`
exporting `wait_recheck_sweep`, plus
`.claude/skills/dispatch-propagate/scripts/test-lib-wait-recheck.sh`. Model on
`lib-stale-hold-recheck.sh:1-421` and its harness
`test-lib-stale-hold-recheck.sh` — read both in full before writing; the header
contract is the specification, not decoration.

Carry over its three rules verbatim in substance:

1. **Containment and observability only, never a gate.** `return 0` on every
   path — unresolvable repo root, failed enumeration, unqueryable daemon, failed
   `release-wait`, failed `park-node`.
2. **No graph write of its own.** Every mutation goes through `release-wait` or
   `park-node`, which own the fresh-`origin/main` refresh, the CAS token and the
   post-land re-read. Do not hand-roll a node write here.
3. **Fail-safe means KEEP.** Any uncertainty — an inspection that could not run,
   a daemon that could not be queried — leaves the WAIT armed and reports it.
   For a calendar wait the failure direction that matters is *releasing early*;
   a wait held one tick too long costs a tick.

Per-candidate ladder, in this order:

- a. either id fails `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` or carries `/`, `..`, or a
  control character → `unsafe-id`, skip (both ids become path components below);
- b. class `malformed` → `skip-malformed`, counted, never acted on, one loud
  stderr line naming the node (this is the visible surface for a corrupt
  `wait_until` / `wait_attempts`);
- c. class `waiting` → `observing (until=<iso>)`, skip;
- d. **CLAIM CHECK, for the SOURCE id and the WAIT id alike** —
  `reservation_exists <id>` (lib-reservation-ledger.sh) OR
  `worktree_has_live_session "$ROOT/.claude/worktrees/<id>"`
  (lib-claude-agents.sh) → `observing-claimed`, skip. Both, because a release
  makes the source selectable and a cap-park mutates the WAIT — never mutate a
  node another session holds. `worktree_has_live_session` is fail-safe by
  construction (an unqueryable daemon reports OCCUPIED); do not "fix" that;
- e. per-pass cap first: at `DISPATCH_WAIT_RECHECK_MAX` write attempts already
  spent → `deferred (cap=<n>)`, skip. Both `release-wait` and `park-node` push
  through `graph-commit`'s landing lock, so an unbounded batch would serialize N
  lock-contended pushes inside one tick; the sweep is idempotent and runs every
  tick, so deferral is free;
- f. class `due` → `release-wait <wait-id>`; class `capped` →
  `park-node <wait-id> <wait_reason> <wait_recommendation>` (the two attribute
  strings read out of the node with `jq` — and per `.claude/rules/shell-json.md`
  never via `echo "$JSON" | jq`; use `jq <<<"$JSON"`). Exit 0 → `released` /
  `capped-parked`. Non-zero → `resolve-failed (rc=<n>)`, the WAIT is KEPT, the
  sweep continues to the next candidate and still returns 0.

Environment seams, mirroring the sibling exactly:
`DISPATCH_WAIT_RECHECK_REPO_ROOT` (default `resolve_main_worktree`),
`DISPATCH_WAIT_RECHECK_ENUM`, `DISPATCH_WAIT_RECHECK_RELEASE`,
`DISPATCH_WAIT_RECHECK_PARK`, `DISPATCH_WAIT_RECHECK_MAX` (integer-guarded,
default 3). Emit one greppable stderr line per candidate, a best-effort
decision-log JSONL record, and **exactly one** summary line on every return path:

```
lib-wait-recheck: sweep complete (candidates=N released=N capped=N observing=N
  malformed=N failed=N deferred=N status=<ok|enumeration-failed|repo-unresolvable>)
```

`status=ok candidates=0` must be textually distinguishable from
`status=enumeration-failed` — an enumeration that could not run must never read
as "no waits".

Add the header's own **WHY ITS OWN FILE** note: this is deliberately not an
extension of `lib-stale-hold-recheck.sh`. A hold is born **parked**
(`office_hours` set) and resolves by two independent facts; a WAIT is born
`office_hours`-**null** and releases by one. Merging them would couple two
independent fail-safe postures — the same precedent `lib-standdown-recheck.sh`
and `lib-stale-hold-recheck.sh` each record about the other.

Sandbox note in the header: rule (d) reaches the local Claude daemon over a Unix
socket, so callers run this with `dangerouslyDisableSandbox: true`
(`.claude/rules/sandbox.md`); a sandboxed pass reads every node as unclaimed,
which is a false-**release** risk.

Harness: copy `test-lib-stale-hold-recheck.sh`'s fixture idiom (scratch repo,
real `src/`, `node_modules` symlink so the REAL enumerator runs under tsx;
session registry driven by `DISPATCH_AGENTS_SNAPSHOT_ALL`, ledger by
`DISPATCH_RESERVATION_DIR`; only the writers stubbed). Cases: due → release stub
invoked once with the wait id; not-yet-due → observing; capped → park stub
invoked with wait id + both strings, release stub never; claimed source →
observing-claimed; claimed WAIT → observing-claimed; malformed `wait_until` →
skip-malformed, no writer invoked; already-parked WAIT → not enumerated;
enumerator exit 2 → `status=enumeration-failed`, distinguishable from the empty
store; a failing writer → `failed=1`, the pass continues and returns 0; per-pass
cap defers the excess; unresolvable repo root → `status=repo-unresolvable`; and
**every** case asserts return 0 and exactly one summary line.

This harness's SUT is inside `.claude/skills/dispatch-propagate/scripts/`, so
`run-unit-tests.sh`'s glob picks it up — no `unit-tests.yml` edit needed for
this one.

Out of scope: `dispatch-sweep` (the worktree/session reaper — do not touch it),
any second sweep loop, any change to `lib-stale-hold-recheck.sh`.

**Recommended model.** opus — fail-safe posture, ordering, and claim-check
correctness are exactly the judgment-heavy class.
**Dependencies.** Units 5, 6.

---

## Unit 8 — wire the sweep into `dispatch-tick`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-tick`, **two**
call sites — both are live and both are required:

- the **paused branch** (`dispatch-tick:300-412`), immediately after the
  `stale_hold_recheck_sweep` block at lines 366-378. That `exit 0` is the only
  autonomous path that never reaches `dispatch-select-tick`'s own sweeps, so a
  WAIT would otherwise never release while dispatch is paused — and
  paused-with-manual-dispatch is a supported standing operating mode, not a
  degraded one.
- the **normal path** (`dispatch-tick:560-635`), immediately after the
  `stale_hold_recheck_sweep` block at lines 586-602 — i.e. after the
  `claude agents` snapshot capture (so the sweep's registry reads reuse this
  tick's single snapshot instead of a round-trip per probe) and **before** Step 1
  selection, so a WAIT released this tick has already landed on `main` and this
  tick's own selection can pick up the just-unblocked source.

Use the established idempotent-source + `declare -f` guard + loud-failure idiom
verbatim (`dispatch-tick:369-378`):

```bash
if ! declare -f wait_recheck_sweep >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/lib-wait-recheck.sh"
fi
if declare -f wait_recheck_sweep >/dev/null 2>&1; then
  wait_recheck_sweep 1>&2
else
  echo "dispatch-tick: lib-wait-recheck.sh failed to load; calendar-wait re-check NOT run this tick" >&2
fi
```

Never `|| true` the call: `dispatch-tick` does not use `set -e`, so a swallowed
exit 127 would silently disable the predicate forever
(`.claude/rules/code-style.md`).

Out of scope: `dispatch-select-tick`, `dispatch-sweep`, the JIT engine. Note in
passing (do **not** act on it here): `dispatch-jit-engine` and
`dispatch-jit-calendar-import` remain wired into `dispatch-select-tick:980,993`
as unreachable code — no `jit.json` exists and both file GitHub issues, which are
disabled repo-wide. Whether to retire that code or re-home it on `wait_until` is
deliberately not decided by this tactic.

**Recommended model.** sonnet — rote wiring with an exact template.
**Dependencies.** Unit 7.

---

## Reuse

Every item below is an existing implementation to copy or call, not to
re-derive.

- `packages/intentionsutil/src/holds.ts:33-140` — vocabulary-module pattern:
  `HOLD_KINDS`/`KIND_SLUGS`/`isHoldKind`, the `holdIdFor` derivation + slug-shape
  assertion, `RESOLUTION_SENTENCE`. U1 mirrors this file.
- `packages/intentionsutil/src/hold-sweep.ts:44-69, 106-140` —
  `isCanonicalHoldId`'s security doc comment and `listHoldCandidates`' pure
  filter/classify/sort shape. U2 mirrors both.
- `packages/intentionsutil/src/router.ts:147` `isDraft`, `:153` `isOpenTactic`,
  `:237-243` `blockersComplete`, `:519-521` + `:572-573` `subtreeParentIds` —
  the predicates U4 extends; `blockersComplete` needs no change at all.
- `packages/intentionsutil/src/officeHours.ts:82` — the null-`office_hours` skip
  that keeps an armed WAIT out of the human queue. Read-only evidence; do not
  touch it.
- `packages/intentionsutil/src/schema.ts:294` `validateAttributes` (passthrough —
  which is *why* U3 needs an explicit rule), `:1082-1104` `checkTierMarkShape`
  (the rule-function template), `:1286-1289` (the per-node rule call site).
- `packages/intentionsutil/scripts/graph-census-debt.ts:115-152` `computeDebt` —
  the `donePresent` accumulation U3(b) narrows.
- `packages/intentionsutil/scripts/hold-node-decide.ts:1-200` — the pure
  decision half: disposition enum, `occurrenceStanza`, `buildHoldNode` (note
  `serves` copied verbatim from the source, `office_hours`/`phase` handling), and
  the `source_blocked_by` / `source_edge_needed` output contract. U5(a) mirrors it.
- `packages/intentionsutil/scripts/list-recheckable-holds.ts:1-72` — the thin TSV
  CLI: `--dir` parsing, `listNodesStrict` (with its comment), stdout format,
  exit 2, `import.meta.url` main-guard. U5(b) copies it.
- `packages/intentionsutil/scripts/hold-node:1-120` — the bash lander:
  fresh-`origin/main` refresh, `dump-node.ts` → `--base` manifest, decision/land
  split, one `graph-commit` per cycle. U6(a) mirrors it.
- `packages/intentionsutil/scripts/park-node:23-98` — fresh-main invariant, the
  conditional write-failure rollback, the `--base` diagnosis-time pin, and the
  `park-node <id> <reason> [recommendation]` CLI itself, which U7 calls directly
  for the cap escalation (no second `office_hours` writer).
- `packages/intentionsutil/scripts/resolve-hold` (header) — the post-land re-read
  that asserts a write survived `graph-commit`'s layer-2 union. U6(b) reuses it.
- `packages/intentionsutil/scripts/write-node.ts:34` `writeNodeFromJson`,
  `packages/intentionsutil/scripts/dump-node.ts` (`--out-dir`, `base-manifest.txt`),
  `packages/intentionsutil/scripts/graph-commit` (`-C`, `-m`, `--base`) — the
  three primitives every graph write funnels through.
- `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh:1-421` —
  the whole sweep contract U7 copies: always-return-0, no own write, fail-safe
  keeps, the claim-check on both ids, the per-pass write cap, the env test seams,
  the one-line-per-candidate + one summary-line output.
- `.claude/skills/dispatch-propagate/scripts/test-lib-stale-hold-recheck.sh:1-60`
  — the fixture idiom (scratch repo, real enumerator under tsx, stubbed writers,
  snapshot/ledger env seams) U7's harness copies.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:369-378` and `:586-602`
  — the sweep-registration idiom U8 copies, at both call sites.
- `packages/intentionsutil/scripts/test-park-node.sh` / `test-hold-node.sh` —
  the CAS-guard harness shape U6's suites copy;
  `.github/workflows/unit-tests.yml:196-203, 251-261` — the comment explaining
  why, and the place where, a `packages/intentionsutil/scripts/` suite must be
  wired.
- Deliberately **not** reused: `holds.ts`'s `HOLD_KINDS` / `KIND_RECHECK` (a WAIT
  is born `office_hours: null`, a hold born parked — it does not belong in that
  enum, and there is only one wait kind); `dispatch-sweep` (a worktree/session
  reaper, not a graph-state sweep); `mark-node-terminal` (its disposition
  vocabulary is about session declarations, not node phases);
  `dispatch-config-load sweep` (the attempt cap lives in `waits.ts` and the
  per-pass cap in an env override, matching `DISPATCH_HOLD_RECHECK_MAX` — no new
  config file or key).

## Verification

Auto-runnable:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
packages/intentionsutil/scripts/test-arm-wait.sh
```

```verify
packages/intentionsutil/scripts/test-release-wait.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-wait-recheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Notes on the auto-runnable set: `validate-graph` takes the intentions directory
**explicitly** — its default is cwd-relative and a bare invocation from the wrong
cwd passes vacuously. The vitest invocation roots at the repo root and selects
the workspace with `--project packages/intentionsutil` (the project name is the
workspace directory path, per the root `vitest.config.ts`); never
`--root packages/intentionsutil`.

Manual / judgment checks, in this order:

1. **The router exclusion is real, not just unit-tested.** In a scratch fixture
   store containing one source at `phase: main-qa` with
   `blocked_by: [tactic-wait-<src>]` and one armed WAIT, run
   `node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts`
   (or `check-node-selection.ts` against each id) and confirm **neither** node is
   emitted — the WAIT is not an `/align-tactics` candidate and the source is
   blocked. Then flip the WAIT to `phase: done` and confirm the source, and only
   the source, becomes selectable. This is the failure the whole tactic exists to
   prevent, and it is worth seeing directly rather than only through
   `router.test.ts`.
2. **One full arm → release → re-arm → cap cycle by hand**, in a throwaway clone
   with a local bare remote (the `test-park-node.sh` fixture shape), driving the
   real `arm-wait` / the real sweep with `DISPATCH_WAIT_RECHECK_REPO_ROOT` and a
   `--now` pushed past each deadline: assert after each step that
   `source.blocked_by` is byte-identical to what it was at mint,
   `wait_attempts` increments only on re-arm-from-`done`, and the cap step lands
   `office_hours` on the **WAIT** node with the source's `office_hours` still
   null. `source.blocked_by` never churning is the doctrinal property the whole
   re-arm-in-place design rests on.
3. **The parked WAIT reaches the author, and only then.** With the cap-parked
   fixture, run
   `node --import tsx/esm packages/intentionsutil/scripts/office-hours-select.ts`
   and confirm the WAIT appears in the queue; re-run it against the *armed*
   fixture and confirm it does not. This is the "never wakes a human until the
   cap" property, checked at the queue rather than inferred from
   `officeHours.ts:82`.
4. **Census safety.** Run
   `node --import tsx/esm packages/intentionsutil/scripts/graph-census-debt.ts --intentions <fixture>`
   against a released WAIT whose source is still open and confirm the WAIT id is
   absent from `donePresent`; then mark the source `done` and confirm it appears.
   The failure this closes is silent (a census agent prunes the node and the cap
   becomes unreachable), so it must be observed, not assumed.
5. **Observe in production, after merge.** For at least two consecutive
   `dispatch-tick` runs with no WAIT node in the store, confirm exactly one
   `lib-wait-recheck: sweep complete (candidates=0 … status=ok)` line per tick in
   the tick journal — one line, `status=ok`, never `enumeration-failed`, and no
   change in tick duration. Grep the journal for the sweep name; a missing line
   means the `declare -f` guard fired and the predicate is silently absent.
   `dispatch-tick`'s sweep stdout does not reach journald reliably — the sweep
   writes to stderr precisely so it does.
6. **Judgment call left to the implementer:** `WAIT_ATTEMPT_CAP = 4` and the 24h
   default duration are stipulated starting values, not measured from a deploy
   cadence. If implementation surfaces a concrete reason to prefer another
   number, change the constant in `waits.ts` and say so in the PR body; do not
   spread the value to a second home.

## Sequencing note for sibling nodes

- `.claude/skills/qa-main/SKILL.md:449-473`'s WAIT branch keeps parking (the
  interim shape) until an **interactive** session flips it to call `arm-wait`.
  Its forward pointer's precondition — the sweep predicate, the attempts/cap, and
  the `router.ts` draft-candidate exclusion — is satisfied by this tactic. The
  flip itself is a skill-body edit an autonomous worker cannot commit; file it as
  a follow-up when this node reaches `done`.
- `tactic-qa-main-verifiability-sort-criterion` (phase `done`) owns the
  `Verifiability: MACHINE|AUTHOR|WAIT` mark and the lane rule that a WAIT is
  never written as an `office_hours` park. It landed the mark; this node lands
  the hold the mark routes into. Nothing in that tactic changes here.
- `strategy-graph-drives-dispatch`'s "the gate releases itself as tactics close"
  clarification stands **unamended**, and that is load-bearing: under this shape a
  tactic (the WAIT) closes and the gate releases. Wall-clock is only what the
  sweep reads to decide that closure — not a new release rule, not a new edge
  type. The declined `blocked_until` field would have contradicted it. No edit to
  that strategy is owed by this work.

## needs-main residue

- **id:** 10
  **title:** Production tick observation: exactly one sweep summary line per tick with an empty WAIT store
  **url_path:** current
  **expected_outcome:** For at least two consecutive `dispatch-tick` runs with no WAIT node in the store, exactly one `lib-wait-recheck: sweep complete (candidates=0 … status=ok)` line appears per tick in the tick journal — never zero (predicate silently failed to load) and never two (double-wiring at both call sites firing in a single tick).
  **finding:** All 9 other QA plan items (independent re-runs of the 7 auto-verify commands plus live fixture checks of the router exclusion, the full arm→release→re-arm→cap lifecycle against a real bare remote, office-hours gating across all three WAIT states, and the census owed-prune exclusion) PASSed in this `/qa-fix` pass. This item is the node body's own Verification-section item 5 ("Observe in production, after merge") — by construction it requires observing at least two consecutive *live* `dispatch-tick` runs against the real production journal, which cannot be produced pre-merge on a feature-branch QA session. The mechanism's fail-safe posture (always returns 0, correctly-distinguished `status=` values across `repo-unresolvable`/`ok`/`enumeration-failed`) and the `dispatch-tick` wiring (both call sites `declare -f`-guarded, un-`|| true`'d, correctly ordered after `stale_hold_recheck_sweep` and before Step-1 selection) were independently re-verified live this pass.
  **Verifiability:** WAIT — awaited event: this PR merging to `main` and at least two subsequent live `dispatch-tick` runs completing.
  **Check:** grep the tick journal for `lib-wait-recheck: sweep complete` across ≥2 consecutive ticks; confirm exactly one such line per tick and `status=ok` (never `enumeration-failed`, never absent).
