---
id: tactic-graph-auto-merge-office-hours-hold-observability
kind: tactic
statement: graph-auto-merge's office-hours hold is a silent, unbounded merge
  veto — surface the held merge-candidate population to the fleet-alarm signal
  and escalate a mass park or a long-stuck park, so a false park does not
  silently drain the node-lane merge queue
owner: ai
status: codified
parent: null
rationale: "Drafted by /review-fix during the review pass on PR #3033
  (tactic-graph-auto-merge-office-hours-gate), whose red-team finder observed
  that the office_hours gate that PR added makes office_hours a hard, indefinite
  merge veto with no escalation path and no bound: the sweep only prints `held
  <id> (office-hours)` to a tick log, never demotes, never alerts, and never
  expires the hold. That matters more than an ordinary missing metric because
  office_hours is written AUTONOMOUSLY by producers that could not previously
  block a merge at all — the terminal-without-disposition sweep, fleet-alarm and
  unclaimed-hold parks, and Stop-hook backstop parks — and false parks are a
  recurring failure mode here, so one sweep parking many nodes in a single pass
  converts the whole node-lane merge queue into a no-op with nothing reporting
  it. The finding was filed Deferred (advisory) and so never went through the
  review-fix Workflow's adversarial skeptic gate, which runs only on Required
  findings. It was independently re-confirmed against origin/main ff064d7e
  during the 2026-08-20 /align-tactics finalize round: the gate is at
  .claude/skills/dispatch-propagate/scripts/graph-auto-merge:322-329 (the
  draft's :134 anchor is stale — the file grew), dispatch-select-tick:518-523
  and dispatch-tick:649-655 relay its stdout to journald without parsing it, and
  dispatch-ladder-run:1136-1138 is the only parsing consumer and is single-node
  scoped. So the observation is no longer unverified, though it has still never
  been adversarially attacked. That round also settled two scope questions and
  recorded them in the plan: \"escalate\" is bounded to REPORTING (a
  find-or-create fleet-alarm node) and may never expire, demote, or auto-clear a
  park — the hold itself is correct and stays; and the draft's \"across many
  consecutive ticks\" is discharged as a wall-clock age off the node's own
  office_hours.since, because dispatch-fleet-watch runs on a 5-minute systemd
  timer rather than per tick and no tick counter exists to bind to. The round's
  four immaterial drift observations ride on
  tactic-graph-auto-merge-hold-observability-drift-observations."
reading: null
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
# graph-auto-merge's office-hours hold is a silent, unbounded merge veto — surface the held merge-candidate population to the fleet-alarm signal and escalate a mass park or a long-stuck park, so a false park does not silently drain the node-lane merge queue

## Provenance

- **Source PR:** #3033 (`tactic-graph-auto-merge-office-hours-gate`, `phase: main-qa`,
  code landed on `origin/main`). This node builds ON that gate; it is not a blocker.
- **Finding source:** `red-team` finder, `/review-fix` pass on PR #3033.
- **Bucket:** Deferred (advisory). It was **never routed through the adversarial
  skeptic verify gate** — that gate runs only on `Required` findings. No skeptic has
  weighed in. The finding was independently re-confirmed against `origin/main`
  `ff064d7e` while this plan was authored (see Context), so it is no longer an
  unverified observation, but it has still never been adversarially attacked.

## Context

`.claude/skills/dispatch-propagate/scripts/graph-auto-merge` refuses to merge any
`phase: review` tactic whose `office_hours` field is non-null. The gate is at
**`graph-auto-merge:322-329`** (marker comment
`# ---- office_hours park gate (fail closed, before any GitHub sensing) -----`), and
its entire output is `echo "held $id (office-hours)"` at **:328**. The node's original
anchor of `:134` is stale — the file grew; the doctrine paragraph describing the gate is
at `:57-64`, and the stdout protocol is documented at `:125-138`.

That hold is correct and must stay (see **Scope discipline** at the end). What is missing
is any way to notice it. Re-measured this round:

1. `dispatch-select-tick:518-523` captures graph-auto-merge's whole stdout into
   `GRAPH_MERGE_OUT` and re-emits every line with the literal prefix `merge: `
   (`:521`). **Nothing parses it.** It is prose for journald.
2. `dispatch-tick:649-655` does the same on the PAUSED-branch drain only.
3. `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1136-1138` is the only
   parsing consumer — it greps `^held $NODE_ID ` and `halt 11 throw`s. It is
   **single-node scoped** (`--node "$NODE_ID"`), so it structurally cannot see a
   fleet-wide held count.

So: no counter, no aggregate, no alarm, no expiry — journald prose only. A plain
`held <id> (office-hours)` line is byte-indistinguishable from the pre-existing
freshness holds (`missing-stamp`, `scope-stale`) and the `sync-cap` hold, so even a
reader watching the log cannot separate a park stall from a stamp problem.

Why this matters more than an ordinary missing metric: `office_hours` is written
**autonomously** by several producers that could not previously block a merge at all —
the terminal-without-disposition sweep, fleet-alarm / unclaimed-hold parks, and the
Stop-hook backstop parks — and false parks are a recurring failure mode in this system.
PR #3033 promoted that autonomously-written field into a hard, indefinite merge veto. A
single sweep parking many nodes in one pass therefore converts the entire node-lane merge
queue into a no-op, indefinitely, with nothing anywhere reporting it.

**Measured baseline (this worktree, `origin/main` ff064d7e):** running graph-auto-merge's
exact candidate filter over `./intentions` today yields **0 clean candidates and 0 parked
candidates**. The steady state is empty, which is why the thresholds below sit where they
do: steady state must be silent, a mass park must fire at once, and a lone park must fire
once it outlives a human's plausible drain latency.

**Why this is not a duplicate counter.** Clarifications 146 and 153 record the author's
ruling that a lane must not author a second counting surface when a sibling already owns
one. The nearest sibling is `tactic-frozen-session-debug-count` (`phase: done`), whose
`claude_agents_count_held_for_debug`
(`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1051-1116`) counts
**sessions** held for debug, keyed on a terminal-state enumeration. This node's population
is **graph nodes held out of a merge queue** — disjoint members, disjoint producers,
disjoint remedy. Likewise `unclaimed-hold` (fleet-watch predicate 5) counts **separate
born-parked hold nodes** (`attributes.hold_kind` + `hold_for`, blocking a different source
via `blocked_by`) — see `packages/intentionsutil/src/hold-alerts.ts` and
`packages/intentionsutil/src/hold-sweep.ts:71-140`. The nodes this plan counts have no
hold node and no `blocked_by` edge: they **are** the merge candidate, parked directly on
their own record. Neither existing counter sees them.

**Intended outcome.** A sixth `dispatch-fleet-watch` predicate, `merge-queue-parked`, that
enumerates exactly graph-auto-merge's candidate set with the parked branch kept instead of
skipped, and raises a `dispatch-fleet-alarm` graph node when either (a) too many
merge-ready nodes are parked at once, or (b) any one of them has been parked too long.
Plus the removal of the third hand-rolled copy of that candidate predicate.

### Greenfield design (what this plan builds)

The candidate predicate lives **once**, as a pure exported function in
`packages/intentionsutil/src/`, and every consumer imports it: graph-auto-merge's
enumeration, the new alerting CLI, and the vitest suite. The alerting path is the proven
triple already shipped by `tactic-unclaimed-hold-alerting` — pure module → thin TSV CLI →
bash reader folded into a fleet-watch verdict — reused in shape, not extended in place.
Both alarm arms are **stateless**: the count arm needs no history at all, and the duration
arm reads the node's own `office_hours.since`, exactly as `hold-alerts.ts:52-63` does and
for the same stated reason ("two passes over the same graph agree without remembering
anything").

### Brownfield note — why "held across many consecutive ticks" became a wall-clock age

The node's original statement asks for escalation "across many consecutive ticks". There
is no tick counter to hang that on, and `dispatch-fleet-watch` does not run per tick at
all: it runs on a systemd timer (`lib.sh:3635`+ `ensure_watcher_units()`; `.timer` at
`:3725-3739`, `OnBootSec=3min`, `OnUnitActiveSec=5min`). Three options were weighed:

- **A fleet-watch `STATE_FILE` span stamp** (predicate 4's `suppression_since` shape,
  `dispatch-fleet-watch:505-586`). Rejected: that precedent is a single fleet-wide scalar,
  and this condition is per-node and multi-instance, so the state would have to become a
  per-node map with its own eviction rules — new persistence, new failure modes (its
  `:540-560` and `:554-560` branches show that both an unpersistable *and* an unclearable
  stamp must degrade to `unknown`) — for information the graph already holds.
- **A `routing-decisions.jsonl` record per held node** (`lib-decision-log.sh:81`,
  `decision_log_append` `:90`). Rejected for this node: it would give a genuine per-*tick*
  history, but the library is write-only by design (`:52-56`) and it needs a new external
  reader, i.e. more new machinery than the signal warrants. Recorded here as the option to
  revisit if a future requirement genuinely needs tick granularity rather than wall clock.
- **`office_hours.since`** — adopted. Already on every parked node
  (`packages/intentionsutil/scripts/park-node:371,377` stamps
  `{reason, since, recommendation}`; `SINCE="$(date -u +%Y-%m-%d)"`).

**Measured caveat, load-bearing for the threshold:** `since` is **day granularity**.
`schema.ts:702-707` types `OfficeHours` as `{reason, since, recommendation, session_type}`
— note the fourth field, which the node's earlier draft note omitted — and `schema.ts:930`
validates `since` through `requireDateString`, whose regex is `^\d{4}-\d{2}-\d{2}$`
(`schema.ts:741-747`). A park set today therefore reads as age 0 for the rest of that day,
and **no threshold below ~1 day is expressible from this clock**. The duration arm's
default is set at 3 days accordingly. The count arm has no such limitation and fires
within one 5-minute pass.

**Both arms ship.** The node's "or when the held count exceeds a threshold" half is the
cheap one and is the arm that actually catches the motivating failure (a mass false-park in
a single sweep); the duration arm catches the single stuck park. Neither is deferred.

---

## Unit 1 — Add the `merge-queue-parked` kind to the fleet-alarm enum

**Scope.**

- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:181` — append
  `merge-queue-parked` to the closed enum
  `KINDS=(tick-stale daemon-degraded busy-stall automerge-suppressed unclaimed-hold watch-unknown heal-fired heal-unknown)`.
  The comment above it (`:180`) states extending it is a deliberate edit here.
- Same file, the `usage()` heredoc kinds list at **`:186-189`** — add the kind there too.
  It is kept in sync **by hand**, not derived.
- Nothing else in `dispatch-fleet-alarm` changes. It is fully generic over kind once the
  enum is extended: the membership check (`:230-235`) and the anchored id regex `ID_RE`
  (`:242-248`) are both **built from the same array**, the node id is
  `tactic-fleet-alarm-$KIND` (`:236`), and mint / re-detect / resolve (`:646-819`) never
  branch on kind.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh` — add one case
  for the new kind modelled on existing case (9) at `:422-428` ("a different kind still
  commits"): prove the new kind is accepted, mints the node id
  tactic-fleet-alarm-merge-queue-parked, and is gated by its **own** per-kind rate-limit
  stamp under `DISPATCH_FLEET_ALARM_STATE_DIR` (`:145-153`), independent of other kinds.

**Out of scope.** Any change to mint/resolve/rollback logic; any change to
`DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL`; hand-creating the file
`intentions/tactic-fleet-alarm-merge-queue-parked.md` — **do not create it**. The script
mints it on first raise (confirmed: `tick-stale` and `automerge-suppressed` have no file
on disk today while other kinds do).

**Recommended model.** sonnet

---

## Unit 2 — Extract the auto-merge candidate predicate into one pure module

**Scope.**

Create `packages/intentionsutil/src/auto-merge-candidates.ts`, pure (no fs, git, network,
daemon — same contract as `packages/intentionsutil/src/hold-alerts.ts`, whose module
header states it). Two exports:

```ts
export interface AutoMergeCandidate { id: string; pr: number; parked: boolean; }

/** Exactly graph-auto-merge's Step 2 candidate filter, in the same order. */
export function listAutoMergeCandidates(nodes: IntentionNode[]): AutoMergeCandidate[]

export interface ParkedMergeCandidate {
  id: string; pr: number; since: string; ageSeconds: number;
}

/** The parked subset, aged from the node's own park timestamp. */
export function listParkedMergeCandidates(
  nodes: IntentionNode[], opts: { now: Date },
): ParkedMergeCandidate[]
```

`listAutoMergeCandidates` must replicate **exactly** the conjuncts at
`graph-auto-merge:262-279`, and nothing more:

- `n.kind === "tactic"`
- `n.phase === "review"`
- `n.execution?.pr` is neither `null` nor `undefined`
- `n.execution.conflict` is `null`/`undefined`
- `blockersComplete(n, byId)` — imported from `packages/intentionsutil/src/router.ts:240`,
  **not** reimplemented (a blocker absent from the store counts as complete; that is its
  documented precondition)
- `(n.execution?.markers ?? []).includes(REVIEWED_MARKER)` — `REVIEWED_MARKER` is exported
  from `packages/intentionsutil/src/transitions.ts:30` (`"reviewed"`). graph-auto-merge
  hard-codes the string today; `reconcile-graph-review-stall:190` already imports the
  constant. Use the constant.
- `parked` is `n.office_hours != null` — the same nullish test the inline query renders as
  `"clean" | "parked"`.
- No `--node` filtering inside the module: that is a caller-side selection filter.
- Return order = store order (`listNodesStrict`'s order), so the caller's TSV is unchanged.

`listParkedMergeCandidates` filters `parked`, parses `Date.parse(n.office_hours.since)`,
skips a `NaN` parse rather than coercing it to age 0 (`hold-alerts.ts:97-104` is the
model), computes `ageSeconds = Math.floor((opts.now.getTime() - since) / 1000)`, applies
**no** age threshold (the watcher owns thresholds, as it does for tick/busy/suppression),
and sorts by `ageSeconds` descending then `id` ascending so output is deterministic. A
negative age (a `since` in the future — clock skew or a hand-edited node) is clamped to 0
and still emitted; it must not vanish from the count arm.

Create `packages/intentionsutil/test/auto-merge-candidates.test.ts` (vitest). Use the
fixture-builder pattern from
`packages/intentionsutil/test/list-conflict-nodes.test.ts:5-45` (`anode()` filling every
required `IntentionNode` field, `exec()` for the execution record). Required cases:

1. One case per rejected conjunct: wrong `kind`, wrong `phase`, `pr: null`, non-null
   `execution.conflict`, an open (`phase !== "done"`) blocker in `blocked_by`, missing
   `reviewed` marker. Each asserts the node is absent.
2. A blocker **absent from the store** counts as complete → node is present.
3. `parked` is `true` for a non-null park record and `false` for a null one.
4. **Equivalence test (non-vacuous, required):** a fixture array of ≥10 nodes spanning
   every conjunct above, run through both `listAutoMergeCandidates` and a hard-coded local
   re-implementation of the original inline predicate as it stands at
   `graph-auto-merge:262-279` today (copy it into the test file), asserting the two produce
   identical `id\tpr\tclean|parked` row sequences. This is the only non-vacuous guard on
   Unit 4's refactor — see the Verification note about `test-graph-auto-merge.sh` stubbing
   `node`.
5. `listParkedMergeCandidates`: age arithmetic against a fixed `now`; unparseable `since`
   skipped, not aged 0; future `since` clamped to 0 and still emitted; sort order (age
   desc, then id asc); a clean candidate never appears.

**Out of scope.** Touching `reconcile-graph-review-stall`'s inline query at `:188-207` —
its filter genuinely differs (it excludes parked nodes outright, excludes `execution.fix`,
and does **not** exclude `execution.conflict`), so folding it in would change behavior on a
different sweep. It stays a separate copy; record that in the new module's header comment
so the next reader does not assume it was missed. Also out of scope:
`packages/intentionsutil/src/holds.ts` / `hold-sweep.ts` — a merge candidate parked on its
own record is not a hold node and must **not** be modelled as a `HOLD_KINDS` entry (today
`provision-conflict`, `fix-attempt-cap`, `worktree-residue`), and the `no-progress` slug in
`RESERVED_KIND_SLUGS` is reserved for `tactic-router-failure-fuses` per clarification 158 —
do not claim it.

**Recommended model.** opus

---

## Unit 3 — Thin TSV CLI over the parked-candidate enumerator

**Scope.**

Create `packages/intentionsutil/scripts/list-parked-merge-candidates.ts`, modelled
line-for-line on `packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts` (129
lines: header contract `:1-38`, `parseArgs` `:62-103`, `listNodesStrict` at `:112`,
one-line-per-record stdout `:113-118`, `main` guarded by the
`import.meta.url === pathToFileURL(process.argv[1]).href` idiom, `catch` → stderr →
`process.exit(2)`).

- Flags: `--dir <intentions-dir>` (**required**, no default — a script must not infer its
  tree, per the sandbox rule), `--now <iso8601>` (optional, defaults to `new Date()`). Any
  unknown argument is a usage error. No `--min-age-seconds` and no `--top-k`: this CLI
  reports the whole parked population and the watcher applies both thresholds, because the
  count arm needs every row regardless of age.
- Enumerate with `listNodesStrict` (`packages/intentionsutil/src/store.ts:249`), STRICT for
  the same reason `list-unclaimed-hold-alerts.ts:106-111` and `graph-auto-merge:250-253`
  give: the tolerant `listNodes` drops an unreadable node with a stderr warning and still
  exits 0, so an alerting pass would silently under-report the very thing it exists to
  catch.
- Stdout, one TSV line per parked candidate: `<id>\t<pr>\t<age-seconds>\t<since>` — nothing
  when there are none.
- Document a **COLUMN-APPEND-ONLY** contract in the header, in the spirit of
  `list-unclaimed-hold-alerts.ts:26-33`: `dispatch-fleet-watch` reads these positionally
  with a fixed-arity `IFS=$'\t' read`, so a new column is appended, never inserted or
  reordered. Name that one reader explicitly.
- Exit 0 on success, 2 on a usage error or a malformed store.
- Export the pure row-formatting function so it is unit-testable without spawning a process
  (the `conflictPrNumbers` export in `scripts/list-conflict-nodes.ts` is the precedent,
  tested by `test/list-conflict-nodes.test.ts`). Add its cases to
  `packages/intentionsutil/test/auto-merge-candidates.test.ts` rather than a new file: TSV
  field order, tab separation, and that an empty result prints nothing.

**Out of scope.** Any threshold logic, any age filtering, any ranking
(`packages/intentionsutil/src/attention.ts`'s `resolveAttention` / `compareRankKeyDesc` are
deliberately **not** used — this is a mass-park early warning, not an importance-weighted
alert; a top-K gate would suppress exactly the low-rank bulk that signals a runaway sweep).

**Dependencies.** Unit 2.

**Recommended model.** sonnet

---

## Unit 4 — Point graph-auto-merge's enumeration at the shared module

**Scope.**

`.claude/skills/dispatch-propagate/scripts/graph-auto-merge:262-279` — replace the inline
predicate body inside the existing `node --import tsx/esm -e '...'` invocation with an
import of `listAutoMergeCandidates`, keeping the surrounding shell plumbing, the
`"$NODE_FILTER"` argv passing, and the failure branch
(`|| { echo "graph-auto-merge: node enumeration failed" >&2; exit 1; }`) exactly as they
are. Target shape:

```js
const { listNodesStrict } = await import("./packages/intentionsutil/src/store.js");
const { listAutoMergeCandidates } = await import("./packages/intentionsutil/src/auto-merge-candidates.js");
const nodes = listNodesStrict("./intentions");
const only = process.argv[1] || "";
for (const c of listAutoMergeCandidates(nodes)) {
  if (only && c.id !== only) continue;
  process.stdout.write(c.id + "\t" + c.pr + "\t" + (c.parked ? "parked" : "clean") + "\n");
}
```

Keep the surrounding comment block (`:245-261`) — the STRICT-enumeration rationale, the
`blockersComplete` note, and the "`--node` arrives via `process.argv`, not the environment,
so an ambient variable can never silently narrow an unflagged sweep" note all still apply.
Amend only the sentences that describe where the predicate now lives.

**HARD CONSTRAINT — this unit must not change one byte of graph-auto-merge's stdout.**
The candidate TSV is internal, but everything downstream of it is contractual:

- `dispatch-ladder-run:1136-1138` greps `^held $NODE_ID ` and `halt 11 throw`s on a match
  (exit 11 = "engage, attended").
- `test-graph-auto-merge.sh` asserts exact strings at `:288`, `:294`, `:343-344`,
  `:411-412`, `:667`, `:679`, `:692`.
- `test-dispatch-select-tick.sh:828` asserts the `merge: ` prefix relay.
- The two office-hours cases that must keep passing verbatim: **(g)** at `:333-344`
  (a parked node yields `held tactic-g (office-hours)` and no merge call) and **(j)** at
  `:399-412` (`--node` does not bypass the gate).

**Known coverage gap — do not paper over it.** `test-graph-auto-merge.sh` stubs the `node`
binary (`:81-124`) and re-implements the candidate filter in `jq`; `:122` hard-codes the
`clean`/`parked` rule. That stub intercepts the real enumeration, so a green run of that
suite does **not** prove this refactor. The guard is Unit 2's equivalence test (case 4)
plus the real-store smoke run in Verification. Do not "fix" the stub to call the real
module: it would drag `tsx` into a suite that deliberately runs on bash + jq alone.

**Out of scope.** Every gate below the enumeration (`:319`+), the sync cap (`:95-109`,
`:165-168`, `:465-485`), the freshness gate, the `held` reason vocabulary, and
`reconcile-graph-review-stall`.

**Dependencies.** Unit 2.

**Recommended model.** opus

---

## Unit 5 — `dispatch-fleet-watch` predicate 6: `merge-queue-parked`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` only.

Add a sixth predicate whose block is structured on predicate 5 (`:604-698`) — resolve the
main checkout, run a TSV enumerator through a DI seam, parse rows positionally, fold into a
verdict — with the claimed-session ladder **removed**. A park is not a session claim, so
`reservation_exists` / `worktree_has_live_session` / `SNAPSHOT_ALL_OK` are irrelevant here
and must not be consulted; gating on a snapshot this predicate never reads would be the
same defect the `FAIL DIRECTION` note at `:598-616` describes, inverted.

### THE ONE TRAP THAT WILL BITE — do not write the literal `office_hours` in this file

`test-dispatch-fleet-watch.sh:666-671` is a **doctrine ratchet** that greps the whole
script — comments included, not the comment-stripped copy — and **fails the suite** if
`dispatch-fleet-watch` contains the literal string `office_hours`:

```
if grep -q 'office_hours' "$SCRIPT"; then
  no "ratchet: script contains an office_hours literal (a watcher must not park nodes)"
```

The sibling ratchet does the same for `blocked_by` (`:672-676`). Per
`.claude/rules/test-integrity.md`, **weakening or rescoping those ratchets is forbidden** —
they encode the NEVER-FLEET-HALT invariant (`dispatch-fleet-watch:85-108`, and the
strategy's 2026-07-31 ALARM SURFACE / NEVER FLEET-HALT ruling). Naming is the fix, and it
is sufficient: this predicate never needs the field name, because the enumerator
(TypeScript, Unit 3) holds it. Use the hyphenated prose form "office-hours" — which does
**not** match the underscore literal — and the identifiers below. Confirm with a plain
`grep -c 'office_hours' dispatch-fleet-watch` returning 0 before handing off.

### Wiring, every site (all anchors re-measured this round)

- Header predicate list `:26-31` — add
  `6. merge-queue-parked   reviewed, merge-ready node(s) held out of the auto-merge queue by an office-hours park`.
- Header env-var doc — add the two thresholds beside `DISPATCH_FLEET_WATCH_HOLD_MIN_AGE` /
  `_HOLD_TOP_K` (`:137-144`), and the new DI seam beside
  `DISPATCH_FLEET_WATCH_HOLDALERT_CMD` (`:167-186`).
- `usage()` heredoc `:200-203` — "Evaluates five predicates (…), ALWAYS all five" becomes
  six, and the kind joins the parenthetical list.
- Thresholds block `:228-232`:
  - `PARKED_MERGE_MAX_COUNT="${DISPATCH_FLEET_WATCH_PARKED_MERGE_MAX_COUNT:-3}"`
  - `PARKED_MERGE_MIN_AGE="${DISPATCH_FLEET_WATCH_PARKED_MERGE_MIN_AGE:-259200}"` (3 days;
    see the day-granularity caveat in Context)
  - **Both must be added to the integer-validation `for t in …` loop at `:233`** — an
    unvalidated threshold silently makes every comparison bogus.
- DI seam: `DISPATCH_FLEET_WATCH_PARKEDMERGE_CMD` — when set, it is executed **instead of
  the whole enumerator invocation, with no arguments appended**, exactly as
  `DISPATCH_FLEET_WATCH_HOLDALERT_CMD` is (`:634-636`). Its stdout must carry the same
  4-column TSV.
- Production invocation (mirror `:637-644`), anchored at `resolve_main_worktree`'s root:
  `node --import tsx/esm "$ROOT/packages/intentionsutil/scripts/list-parked-merge-candidates.ts" --dir "$ROOT/intentions" --now "$(date -u -d "@$NOW" +%FT%TZ)"`.
- `B_<P>` fallback default block `:707-711` — add `B_PARKED="${B_PARKED:-$D_PARKED}"`.
- `note_verdict` tally `:726-731` — add
  `note_verdict "$V_PARKED" "merge-queue-parked: $B_PARKED"`.
- `dispatch_predicate` call block `:783-841` — add one call with the statement
  `"Reviewed, merge-ready node(s) are held out of the auto-merge queue by a park"` and an
  **identity-only** body (see below).
- `--json` predicate map `:887-897` — add
  `"merge-queue-parked": { verdict: $v_parked, detail: $d_parked, parked_count: $parked_count, aged_count: $aged_count }`,
  following the `"unclaimed-hold": { verdict, detail, candidate_count }` shape at
  `:896-897`.
- Human stdout row `:905-909` — `printf '  merge-queue-parked:   %-8s %s%s\n'`, aligned
  with the existing rows.

### Verdict logic

Let `PARKED_COUNT` = rows read; `AGED_IDS` = rows whose `age >= PARKED_MERGE_MIN_AGE`.

- **unknown** (raises `watch-unknown`, resolves nothing) when: `resolve_main_worktree`
  yields nothing; the enumerator exits non-zero; or any row fails validation. Validate per
  row exactly as `:655-663` does — non-empty id, numeric age, and a path-component sanity
  check on the id (`case "$P_ID" in *..*|*/*|*[[:cntrl:]]*)`), since the id is interpolated
  into detail strings and an alarm body.
- **finding** when `PARKED_COUNT >= PARKED_MERGE_MAX_COUNT` (**count arm**) or `AGED_IDS`
  is non-empty (**duration arm**).
- **clear** when the enumerator ran cleanly and neither arm trips (including zero rows).
  Remember `clear` is not merely quiet: `dispatch_predicate` (`:770-775`) sends
  `--resolve --kind merge-queue-parked`, which **closes** an open alarm node. That is why
  every unreadable input above must be `unknown`, never `clear`.
- **Never `quiet` under pause.** The merge lane still drains while paused
  (`dispatch-tick:649-655` runs graph-auto-merge on the PAUSED branch), and a park holding
  merge-ready work is worth knowing about either way. Same posture as predicates 4 and 5,
  and the opposite of predicates 1 and 3. State the reason in the block comment so a later
  reader does not "fix" it into quiet.

### The two detail strings (`dispatch-fleet-watch:63-83`, restated `:778-782`)

- `D_PARKED` — the READING, for stdout/journald/`--json` only. Carries the counts, each id,
  its age in seconds and its park date.
- `B_PARKED` — the CONDITION IDENTITY, and the **only** thing allowed into the alarm body.
  Sorted offending ids, the arm labels, and the two threshold **names**. **No ages, no
  dates, no counts, no timestamps.** A body carrying any of those differs on every pass, so
  one sustained condition fetches/rebases/pushes to `origin/main` and arms four CI checks
  **every 5 minutes** — ~288 pushes a day per kind. Predicate 5's `:685-689` comment is the
  worked example.
  - Offender set: if the count arm tripped, every parked id; otherwise just `AGED_IDS`.
  - Render sorted and `; `-joined, exactly as `:689` does
    (`sort | tr '\n' ';' | sed 's/;$//' | sed 's/;/; /g'`).
  - **Cap the body list at 20 ids**, appending the literal ` (list truncated)` with **no
    count** when capped. This closes, for this predicate, the uncapped-rows defect tracked
    on the sibling mechanism as `tactic-hold-alerts-uncapped-alert-rows`; omitting the
    count is deliberate, so a 21st park does not churn the body. The full list is in
    `D_PARKED`, i.e. in journald and `--json`.
  - Arm labels: a sorted subset of `count`, `age`, rendered `[arms: count,age]`. Arms
    flipping IS a condition change and should refresh the body.

### Cost, stated rather than hidden

This predicate adds one `node --import tsx/esm` cold start per 5-minute watcher pass (~one
extra process and its tsx transform cost, on top of predicate 5's identical cost). The
sibling draft `tactic-fleet-watch-predicate5-cold-start` owns the fix for that class
(batching the enumerators into one process). **Do not pre-empt it here** — but keep the
invocation at a single site in the block so that later change has one call site to rewrite.
Record the cost in the block comment.

**Out of scope.** `repo-health`
(`.claude/skills/dispatch-propagate/scripts/repo-health`, a two-boolean latch whose
contract is "an absent key means CLEAR" — a count key there is a schema extension nothing
on the alarm side reads); `packages/intentionsutil/scripts/read-sensors.ts` (registry at
`:1605-1626`, **not** tick-invoked — its entry point is `npm run read-sensors`,
`package.json:18` — so it is not an alarm surface); and the `automerge-suppressed` kind
(`:505-586`), which is the **different** condition of an open `tactic-main-red-*` latch
suppressing the whole sweep — different body, different identity, different remedy. Do not
overload it.

**Dependencies.** Units 1 and 3.

**Recommended model.** opus

---

## Unit 6 — Watcher test cases for predicate 6

**Scope.** `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh` only.
Numbering continues after the existing case 24 (cases 18-24 are predicate 5's; case 17 is
the doctrine ratchet and stays last in the file). Add a `parked_row` helper beside
`hold_row` (`:552-556`) emitting real TABs for the 4-column TSV, and a `$BIN/parkedmerge`
stub beside `$BIN/holdalert` (`:113-120`) honouring `STUB_PARKEDMERGE_OUT` /
`STUB_PARKEDMERGE_RC`, wired through `DISPATCH_FLEET_WATCH_PARKEDMERGE_CMD` in the per-case
env (`new_env` / `reset_stubs`).

Cases, each asserting the printed verdict row, the exact alarm/resolve call count via
`grep -c -- '--kind merge-queue-parked --statement'` /
`'--resolve --kind merge-queue-parked'` on `$ALARMS`, and the process exit code:

1. **count arm** — 3 parked rows, all young (age 0) → one finding, no resolve, exit 1.
2. **under the count limit, all young** — 2 parked rows, age 0 → clear, exactly one
   resolve, exit 0.
3. **duration arm** — 1 parked row aged 300000s (> the 259200s default) → one finding, no
   resolve, exit 1. Proves a single long-stuck park escalates far below the count limit.
4. **empty enumeration** → clear, exactly one resolve, exit 0.
5. **enumerator fails** (`STUB_PARKEDMERGE_RC=2`) → `unknown`, **no** finding and **no**
   resolve, exactly one `watch-unknown` alarm, no bare `result: ok` line, exit 2. Modelled
   on case 21 at `:632-654`.
6. **unparseable row** (non-numeric age) → `unknown`, same assertions as (5). A failed read
   must never launder into "nothing is parked".
7. **body-stability ratchet**, modelled on case 22 (`:572-610`): two passes over the
   **same** parked ids whose ages differ between passes; assert
   `cmp -s bodies-1/merge-queue-parked.body bodies-2/merge-queue-parked.body`, assert both
   body files are non-empty first (or the ratchet is vacuous), and assert the stdout
   reading **did** change between the passes (or the byte comparison proves nothing).
   Additionally assert the body contains neither age string and does contain both node ids.
8. **not quiet under pause** — with `DISPATCH_PAUSE_FLAG` set and a parked set that trips
   an arm, the predicate still evaluates and still raises. Modelled on case 23 at
   `:611-631`.
9. **body cap** — 25 parked rows → the body contains the literal ` (list truncated)` and at
   most 20 ids, while the stdout reading names all 25.

The pre-existing case 17 doctrine ratchets (`:655-692`) must stay untouched and must still
pass — that is the check that Unit 5 kept the forbidden literal out of the watcher.

**Out of scope.** `test-graph-auto-merge.sh` (unchanged; Unit 4 must leave it green as
written), `test-dispatch-select-tick.sh`, and any new `.yml` wiring — see Verification.

**Dependencies.** Unit 5.

**Recommended model.** sonnet

---

## Reuse

- `packages/intentionsutil/src/router.ts:240` — `blockersComplete(tactic, byId)`. The
  shared blocker predicate; never reimplement it (an absent blocker reads as complete).
- `packages/intentionsutil/src/transitions.ts:30` — `REVIEWED_MARKER`.
- `packages/intentionsutil/src/store.ts:249` — `listNodesStrict`, the established
  enumerator for any reading that feeds an autonomous/alarm decision.
- `packages/intentionsutil/src/hold-alerts.ts:52-104` — the design precedent for a
  **stateless** age-based escalation read off the node's own park timestamp, and the exact
  age arithmetic (`Date.parse` → `Math.floor((now - since)/1000)`, `NaN` skipped, never
  coerced to 0).
- `packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts:1-129` — the thin-CLI
  template: required `--dir`, optional `--now`, TSV stdout, append-only column contract,
  `listNodesStrict`, exit 0/2, `pathToFileURL` main guard.
- `packages/intentionsutil/scripts/list-conflict-nodes.ts` +
  `packages/intentionsutil/test/list-conflict-nodes.test.ts:5-45` — the pattern of exporting
  a pure function from a `scripts/` CLI so it is testable, and the `anode()` / `exec()`
  fixture builders.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:604-698` — predicate 5,
  the enumerate-then-classify template: `resolve_main_worktree` (`lib-graph-worktree.sh`),
  the `*_CMD` DI seam, the positional `IFS=$'\t' read` with per-row validation, and the
  fail-direction discipline.
- Same file `:717-775` — `note_verdict`, `dispatch_predicate`, `raise_alarm`,
  `resolve_alarm`. Reused verbatim; the new predicate adds call sites, never new alarm
  plumbing.
- Same file `:505-586` — predicate 4, the threshold-gated finding/clear shape (its
  `STATE_FILE` span machinery is deliberately **not** reused; see the brownfield note).
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:14-63, :646-819` —
  find-or-create mint / re-detect / resolve, the `cmp -s` body-identity gate, and
  `DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL`. Entirely generic over kind: **zero** changes
  beyond the enum + usage append.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh:87-120, :440-654`
  — the recording alarm stub, `ALARM_BODY_DIR` body capture, and the finding/clear/unknown
  and body-stability case shapes.

## Verification

Run all of these from the worktree root.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-ladder-run.sh
```

```verify
npx vitest run --root . packages/intentionsutil/test/auto-merge-candidates.test.ts
```

```verify
npx vitest run --root . packages/intentionsutil/test/hold-alerts.test.ts packages/intentionsutil/test/router.test.ts
```

Ratchet that Unit 5 stayed clear of the forbidden literal — a positive count assertion, not
a negated grep, since a negated fence can pass vacuously:

```verify
test "$(grep -c 'office_hours' .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch)" = "0"
```

Real-store smoke for Unit 4's refactor — the enumeration still runs against the live store
and still exits 0:

```verify
node --import tsx/esm -e 'const { listNodesStrict } = await import("./packages/intentionsutil/src/store.js"); const { listAutoMergeCandidates } = await import("./packages/intentionsutil/src/auto-merge-candidates.js"); const rows = listAutoMergeCandidates(listNodesStrict("./intentions")); process.stdout.write("candidates=" + rows.length + "\n");'
```

Real-store smoke for the new CLI — runs, exits 0, and its output parses as 4-column TSV:

```verify
node --import tsx/esm packages/intentionsutil/scripts/list-parked-merge-candidates.ts --dir ./intentions | awk -F'\t' 'NF != 4 { print "bad column count: " NF; exit 1 }'
```

**Note the deliberately weak spot in that smoke pair.** At `origin/main` ff064d7e the live
store holds **0** clean and **0** parked merge candidates, so both smoke fences prove only
"it runs and exits 0" — they are structurally near-vacuous on today's data and must not be
read as behavioral coverage. The behavioral guard is Unit 2's equivalence test (case 4) and
Unit 6's stubbed cases, both non-vacuous by construction.

**CI wiring — nothing to add.**
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190` globs
`"$SCRIPTS"/test-*.sh` (skipping only `test-helpers.sh`) into the `pr-scripts` bucket,
gated by `detect-changes.sh` whose regex already includes
`^\.claude/skills/dispatch-propagate/scripts/`. Both edited harnesses are picked up with no
`.yml` change. (Contrast: `dispatch-ladder` tests are enumerated explicitly in the
`hook-tests` job, so a **new** test file there would need one — this plan adds none.)
`packages/intentionsutil` is a vitest workspace project (`vitest.config.ts` builds projects
from `package.json` workspaces), so the new test file runs under the repo-root vitest
config with no registration.

### Manual / judgment checks

- **Predicate numbering collision.** The sibling draft
  `tactic-fleet-watch-duplicate-session-predicate` (`phase: null`, not in flight) also
  claims "a sixth predicate". Whichever lands second renumbers its prose and appends its
  kind after this one in the `KINDS` array. Neither blocks the other; check that draft's
  state before starting Unit 5 and coordinate the prose only.
- **First real firing.** After merge, confirm on the next watcher pass that
  `dispatch-fleet-watch` prints a `merge-queue-parked:` row (expect `clear` in today's
  empty steady state) and that `dispatch-fleet-alarm --resolve --kind merge-queue-parked`
  is a no-op rather than an error — a `clear` verdict on a never-minted kind must not exit
  non-zero into `ALARM_FAILED`.
- **Alarm-node shape, once it first fires.** The alarm node
  (tactic-fleet-alarm-merge-queue-parked) is minted by the script on first raise; do not
  pre-create it. When it appears, confirm the body carries ids and threshold names only —
  no ages, no counts, no dates — and that a second pass over the same set produces no new
  commit on `origin/main` (the `cmp -s` gate held).
- **Watch for churn in production**, which the unit ratchet cannot catch: if the parked set
  legitimately oscillates (a park cleared and re-set), each flip is a real condition change
  and will push. If that becomes noisy, the fix is the
  `DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL` brake (3600s default), not loosening the
  body's identity.

## Scope discipline — read before implementing

This node is **observability and escalation only**.

`graph-auto-merge:57-64` records that the park gate "Never demotes: the node stays at
phase:review for a human to drain via office-hours," and clarification 98 rules that
mechanical retry holds written as parks are a **producer**-side defect with its own
disposition (`tactic-mechanical-park-producers`, `phase: done`). So:

- **Do not** plan or add an auto-expiry, an auto-demotion, a `blocked_by` rewrite, or any
  automatic clearing of a park. That would make this a new automated park consumer and
  collides with recorded doctrine.
- **Do not** let the watcher write anything but its own `tactic-fleet-alarm-<kind>` node —
  NEVER FLEET-HALT (`dispatch-fleet-watch:85-108`, and the strategy's 2026-07-31 ALARM
  SURFACE / NEVER FLEET-HALT ruling). This instrument reports; it never trips the
  correlated-dead-claims breaker and never halts selection.
- **Do** land the finding as a graph node rather than journald alone, and **do** land a
  node on an UNKNOWN reading too — that half of the same ruling is the load-bearing one: an
  instrument that cannot see must say so loudly, because silence on an unreadable input is
  indistinguishable from a healthy fleet. Routing every `unknown` through `watch-unknown`
  is what accomplishes it here.

Surface and escalate; let a human drain.
