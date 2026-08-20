---
id: tactic-eval-finding-in-flight-guard-permanent-after-execution-completes
kind: tactic
statement: The in-flight guard gates on execution == null, but execution stays
  non-null after a fix merges — so a ledger entry fixed through the normal
  dispatch pipeline can never record another occurrence, dropping every future
  recurrence to a fire-and-forget caller
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry; finalized to phase implement by /align-tactics on 2026-08-19 with a
  full clean-session plan in the body. It remains a ledger entry — similar
  findings MERGE into this node, a recurrence updates
  attributes.measured_impact, and a second node is never minted. The body
  carries the original finding re-anchored to current line numbers, the
  tightened fix predicate (the finding's own proposed predicate was refined, see
  the body), and the three units that repair it.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: permanently-unrecordable-ledger-entries
      value: 5
      unit: nodes
      window: graph-wide
      sensor: "git grep -L '^execution: null' over intentions/tactic-eval-finding-*.md
        at origin/main"
      measured: 2026-08-19
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: git grep over intentions
      measured: 2026-08-14
---
Recorded 2026-08-14, surfaced by inspecting why `tactic-eval-finding-lock-wait`
reports `in_flight: true` on `--list` while sitting at `phase: done` with its fix
merged since 2026-08-13. Planned 2026-08-19; the diagnosis below is the original
finding, re-anchored to current line numbers and with the fix predicate
tightened (see "Refining the node's own proposed predicate").

## Context

### The defect

`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` gates three
mutating paths on one predicate — `execution == null`:

```
dispatch-eval-finding:978    --retire
dispatch-eval-finding:1046   --resolved-by --body-file
dispatch-eval-finding:1208   the recurrence-record path
```

and `list_entries` derives its reported `in_flight` the same way at
`dispatch-eval-finding:457` (`in_flight: n.execution !== null`). (The finding was
recorded against lines 936/1004/1166/453; the logic and its comments are
unchanged, the line numbers only shifted. Locate each site by its quoted text,
not by the number.)

`execution` is non-null from the moment a node is dispatched, and it **stays**
non-null after the fix merges — the completion is recorded *inside* it
(`execution.completion.mergedAt`), not by clearing it. Confirmed in this tree:
`packages/intentionsutil/scripts/apply-node-transition.ts:163` seeds
`node.execution ?? defaultExecution(id)` and never nulls it;
`packages/intentionsutil/scripts/reconcile-graph.ts:199,230` writes
`node.execution.completion` at the main-qa/done transitions and leaves the rest
in place. The only writes of `execution: null` anywhere are node *creation*
(`dispatch-eval-finding:1140`, `packages/intentionsutil/scripts/hold-node-decide.ts:114`).
There is no transition that returns it to null.

So a ledger entry that was fixed through the normal dispatch pipeline is
permanently un-recordable. Every future occurrence hits the recurrence guard,
prints `skipped-in-flight`, and exits 0 to a fire-and-forget caller
(`/rsi`, spawned by `dispatch-ladder-run`) that never re-invokes. The occurrence
is dropped, forever, silently in effect. That is the same class of loss condition
9 of `strategy-recursive-self-improvement` forbids ("an occurrence must never be
silently dropped") and clarification 52 generalizes to threshold skips — this is
a third instance of the same rule, not yet named in doctrine text.

### Why the guard is right and the predicate is wrong

The guard's stated justification (`dispatch-eval-finding:1204-1206`, and the
header section "THE IN-FLIGHT GUARD" at `:131-142`):

> Rewriting the body of a node a PR is working changes its (statement, body)
> scope fingerprint and mis-parks that session, so the occurrence is dropped
> instead — loudly, never silently.

That is correct for a **live** PR: `tacticScopeFingerprint` hashes
(statement, body), and a working session would be mis-parked. It is vacuous once
the work has landed — there is no session left to mis-park.

`execution != null` is being used to mean "a fix is in flight". It actually means
"a fix has ever been dispatched".

### Refining the node's own proposed predicate

The original finding proposed: "refuse only when the execution is non-null **and
incomplete** (`completion` null, or phase not `done`)". Read literally as an OR,
that is still wrong and merely shifts the bug by one occurrence: the recurrence
path itself clears `phase` back to `null` on a retired entry
(`dispatch-eval-finding:1259`, `.phase = (if .phase == "done" then null else .phase end)`),
so the *second* recurrence on lock-wait would find `phase != "done"` and be
refused again. Keying on `completion` alone is also wrong in the other
direction: nothing clears `completion` when a node is re-dispatched, so a node
that recurs and is dispatched a second time would carry a stale landed-completion
while a live session owned it, and the guard would go blind exactly when it is
needed.

**The predicate this plan adopts** is the canonical "a live ladder run owns this
node" test the repo already has:

> in-flight ⟺ `execution != null` **and** the node is an OPEN tactic —
> `phase` non-null and not `"done"`.

That is `classifyTactic(node) === "open"` from
`packages/intentionsutil/src/census.ts:12-17` (exported, fs-free, doc comment
explicitly invites reuse), and the same rule `router.ts:137-146`'s private
`isOpenTactic` uses to decide dispatchability. Checked against every reachable
state:

| node state | today | after |
|---|---|---|
| `execution: null` (the ordinary ledger draft) | allow | allow |
| execution set, phase `implement`/`qa`/`review`/`main-qa`/`fix` | refuse | refuse (a live session owns it) |
| execution set, phase `done` (the lock-wait case) | **refuse — the defect** | allow |
| execution set, phase `null` (an entry resumed by a recurrence write) | **refuse** | allow (no shift-by-one) |
| execution set + landed `completion`, re-dispatched to phase `implement` | refuse | refuse (phase, not completion, decides) |

The `execution != null` conjunct is deliberately kept rather than dropped in
favour of the phase test alone. Dropping it would newly refuse a node at phase
`implement` with `execution: null` (an align-tactics-finalized plan not yet
stamped), i.e. it would create *new* dropped occurrences — the opposite of this
node's purpose. Narrowing only.

### Population was one at record time; it is five today

The two routes by which a ledger finding gets fixed diverge here:

- Fixed on a **separate** branch and closed with `--resolved-by` / `--retire`
  (the fourteen slugs of PR #3090): `execution` stays null, the entry keeps
  working, and a later recurrence resumes the count as designed.
- Dispatched as its **own** tactic with its own PR (`tactic-eval-finding-lock-wait`,
  PR #3074): `execution` is set for good, and the entry is dead to the recorder.

Nothing steers between the two routes, so the second is available to every
future entry. Verified in this tree:
`intentions/tactic-eval-finding-lock-wait.md` carries `phase: done`,
`execution.pr: 3074`, `execution.completion.mergedAt: 2026-08-13T03:26:48Z`;
`intentions/tactic-eval-finding-eval-finding-list-misses-nonledger.md` carries
`phase: done`, `execution: null`.

Re-measured 2026-08-19, five days after `first_seen`. The population is no
longer one:

```
git grep -L '^execution: null' origin/main -- 'intentions/tactic-eval-finding-*.md'
  → tactic-eval-finding-eval-finding-forward-crossref-fails-ci
  → tactic-eval-finding-lock-wait
  → tactic-eval-finding-noop-verdict-hides-dropped-node-edit
  → tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening
  → tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes
```

All five carry `phase: done` with a populated `execution` block, so all five are
un-recordable today; four of them carry `attributes.ledger_entry: true` and are
genuine ledger entries (lock-wait is the misnamed fix tactic described under
"the naming collision" below). Three of the four were dispatched together on
`branch: pr1-graph-write-path`, PR #3095. `attributes.measured_impact`'s
`permanently-unrecordable-ledger-entries` figure is updated from 1 to 5 with
this round. The growth rate — one to five in five days, with nothing steering
between the two fix routes — is the reason this is a repair rather than a
curiosity.

The irony is load-bearing: lock-wait exists **because** `dispatch-eval-finding`
silently dropped occurrences when a fire-and-forget caller could not re-invoke.
Its own fix shipping is what made it permanently unable to record a recurrence
of the same class of loss.

### Explicitly out of scope (carried forward, not fixed here)

1. **The sibling copies of the same predicate in other scripts.**
   `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:599`
   (`--resolve` guard) and
   `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:130-143`
   (the recovery-completion loop, which fleet-alarm's comment says it copied
   from) carry structurally identical `execution == null` gates with the same
   permanent-stick behaviour. They are named here so the next reader does not
   have to rediscover them. Do **not** change them in this tactic's PR: they are
   different scripts with different suites and their own semantics
   (`dispatch-graph-main-red-sync`'s loop *completes* nodes rather than
   recording occurrences, so the correct predicate there may differ). Record
   them as a distinct ledger finding through `dispatch-eval-finding` rather than
   minting a node by hand.

2. **The naming collision.** `tactic-eval-finding-lock-wait` is not a ledger
   entry at all — it is the *fix tactic* for the lock-wait defect, carrying the
   ledger's id prefix, and `attributes: {}` with no `ledger_entry`, which is why
   `--list` also flags it `unregistered: true` with `recurrence_count: 0`
   (that flag is `dispatch-eval-finding:402-415` working exactly as specified,
   not a defect). Renaming it out of the `tactic-eval-finding-` prefix would
   clear the confusing `--list` row, but it is a graph write with inbound-edge
   consequences, it is **not** a fix for the predicate, and it must not be
   mistaken for one. Not done here.

3. **`packages/intentionsutil/scripts/list-conflict-nodes.ts:47-48`** uses
   `execution == null` as a *structural-shape* filter (skip nodes with no
   execution block before reading conflict-shaped fields), not as an
   in-flight proxy. Left alone deliberately; noted so a fixer sweeping for the
   pattern does not "fix" a correct site.

4. **Consolidating the five private find-or-recur writers** (condition 20 of the
   serving strategy) is `tactic-finding-search-all-producers`' job, not this
   one. `dispatch-eval-finding` is still the live, sole writer both
   `.claude/skills/rsi/SKILL.md` and `.claude/skills/rsi-audit/SKILL.md` call,
   so it is the correct file to patch today. If that consolidation lands first,
   this fix moves with the guard rather than being dropped.

### Intended outcome

A ledger entry whose fix landed through the ordinary dispatch pipeline records
its next occurrence instead of dropping it, `--list`'s `in_flight` stops
contradicting its own `state: retired` on the same row, and a genuinely live
ladder run is still protected from a body rewrite that would stale its scope
stamp.

---

## Unit 1 — narrow the in-flight predicate to one shared "open tactic" test

**Recommended model:** opus (a doctrine-dense script whose header prose is
load-bearing; the change is small but the reconciliation of five comment blocks
and the failure-mode handling need judgment).

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`.

1. **Add one bash predicate helper** in the `# --- Helpers ---` section that
   begins at `dispatch-eval-finding:707`, alongside `classify()` (`:714`),
   `origin_blob`, `restore_from_blob`, `run_graph_commit`. Model its shape on
   `origin_main_ref_ok()` at `:499` — a plain function, no echoed output, answer
   by exit code only. It takes the dumped-node JSON path as a parameter, because
   the three callsites do **not** share one operand file (`--retire` reads
   `$TMP_DIR/$ID.json`; the other two read `$TMP_DIR/base/$ID.json`):

   ```bash
   # node_fix_in_flight <node-json>
   #   rc 0  a LIVE ladder run owns this node's lifecycle — refuse the write.
   #   rc 1  nothing is working it — the write is safe.
   #   rc 2+ the JSON could not be read or parsed — the caller must treat this
   #         as fatal, never as "not in flight".
   node_fix_in_flight() {
     jq -e '.execution != null and .phase != null and .phase != "done"' \
       "$1" >/dev/null 2>&1
   }
   ```

   `jq -e` already yields 0 for a true result, 1 for `false`/`null`, and 2+ on a
   read/parse error, so the three-way contract needs no extra branching inside
   the helper — but it **must** be documented in the helper's comment, because
   today's inline form (`! jq -e … && refuse`) folds a jq error into "refuse"
   and the new form must not fold it into "allow".

   Document in the same comment that this is the bash spelling of
   `classifyTactic(node) === "open"` from
   `packages/intentionsutil/src/census.ts:12-17` (`phase === "done" → done`;
   `phase !== null → open`; otherwise draft/born-parked), and that the
   `execution != null` conjunct is kept deliberately so the change is a pure
   narrowing.

2. **Replace all three callsites** with the helper, preserving each site's
   existing stderr message and `skipped-in-flight` stdout token verbatim, and
   adding an explicit fatal branch for rc ≥ 2. Because `if`/`!` swallow the
   exact status, use the capture-then-`case` form at each site, e.g. for the
   recurrence path (`:1208`):

   ```bash
   node_fix_in_flight "$TMP_DIR/base/$ID.json"; IN_FLIGHT=$?
   case "$IN_FLIGHT" in
     0) log "$ID has a live ladder run on phase $(jq -r '.phase' "$TMP_DIR/base/$ID.json") (a session owns its lifecycle) — THIS OCCURRENCE WAS NOT COUNTED; re-record it after that work lands"
        printf 'skipped-in-flight\n'; exit 0 ;;
     1) : ;;
     *) log "could not read $TMP_DIR/base/$ID.json to test the in-flight guard; refusing to write rather than guessing"
        exit 1 ;;
   esac
   ```

   The three sites and their existing messages:
   - `:978` (`--retire`) — keep "refusing to complete it mechanically; NOTHING
     WAS RECORDED, this retirement is LOST, not deferred…". Note in a comment
     that this path is reached only when `classify()` returned `open`, so the
     behaviour change here is confined to an entry at `phase: null` with a
     non-null `execution` (a resumed entry); a `phase: done` entry short-circuits
     to `noop` at `:967-971` before the guard.
   - `:1046` (`--resolved-by` + `--body-file`) — keep the "…and `--body-file`
     would rewrite its body, staling that session's scope stamp…" message and
     keep the `[[ -n "$BODY_FILE" ]] &&` caller-side conditional; only the
     predicate changes.
   - `:1208` (the recurrence path) — keep "THIS OCCURRENCE WAS NOT COUNTED".

3. **Reconcile `list_entries`' `in_flight`** at `:457`. Import the canonical
   classifier into the embedded node script (it already does
   `await import("./packages/intentionsutil/src/store.js")` at `:424`, and
   `census.ts` is fs-free and process-free by design, so it imports cleanly):

   ```js
   const { classifyTactic } = await import("./packages/intentionsutil/src/census.js");
   …
   in_flight: n.execution !== null && classifyTactic(n) === "open",
   ```

   Do **not** change the neighbouring `state:` field (`n.phase === "done" ?
   "retired" : "open"`): its draft→`open` mapping is existing contract that
   `--list-retirable` and the similarity judgment read, and changing it is out of
   scope. Add a short comment saying `in_flight` and `state` are now derived from
   the same `phase` fact and can no longer contradict each other on one row.

4. **Reconcile the header prose** so nothing in the file still asserts the old
   rule:
   - `:131-142` "THE IN-FLIGHT GUARD" — rewrite. An entry whose `execution` is
     non-null **and whose `phase` is an open ladder phase** is being worked;
     an entry at `phase: done` (or back at `phase: null` after a resume) has no
     session left to mis-park, and refusing it was permanently dropping every
     later occurrence of a finding fixed through the ordinary pipeline. Name
     the failing case (`tactic-eval-finding-lock-wait`, PR #3074) and say
     plainly that `execution != null` means "a fix has ever been dispatched",
     not "a fix is in flight".
   - `:212-221` the `skipped-in-flight` stdout-protocol entry — restate the
     condition as "a live ladder run owns the node" rather than "`execution` is
     non-null". Keep every other word of the protocol (it is still a LOST
     occurrence, still not `noop`).
   - `:1204-1206` and `:1040-1045`, the two inline justification comments — keep
     the `tacticScopeFingerprint` reasoning, add the one sentence that makes it
     conditional on the run still being live.

**Out of scope for this unit:** `dispatch-fleet-alarm`,
`dispatch-graph-main-red-sync`, `list-conflict-nodes.ts`, any change to
`packages/intentionsutil/`, the `state:` field's semantics, and any graph write
(no node rename, no ledger entry minted by hand).

---

## Unit 2 — test the narrowed predicate, both directions

**Recommended model:** sonnet (explicit cases, an existing harness, fixture
shapes given verbatim below).

**Dependencies:** Unit 1.

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh`
(1068 lines today; 177/177 assertions pass at plan time — measured 2026-08-19).
Add cases and extend two existing ones. Do not weaken or delete any existing
assertion.

Harness facts the implementer needs (no re-reading required):
- `run_ef <ENV=v …> -- <SUT args>` at `:274-296` sets `RC`, `SOUT` (stdout only)
  and `OUT` (stderr+stdout). Env overrides go **before** the `--`.
- `STUB_STATE` fakes `classify()`'s answer (`absent|open|retired`);
  `STUB_NODE_JSON` is the JSON `stub-dump-node` writes; `STUB_GC_LAND=1` makes
  the graph-commit stub actually land so verification passes.
- `log_lines <basename>` (`:297-299`) reads a stub's log — assert `""` to prove
  no write happened. `written '<jq filter>'` (`:300-302`) queries the last
  write-node input JSON. `assert_not_contains` is defined locally at `:115-125`.
- The existing in-flight fixture `INFLIGHT_JSON` at `:429-433` is
  `{"id":…,"phase":"implement","execution":{"pr":123},…}` — **it stays refused
  under the new predicate**, so cases (8), (8b) and (16) must remain green with
  no edits to their assertions. If any of them goes red, the predicate was
  widened, not narrowed; fix the code, never the test.

New cases (append after case (20) at `:1040`, following the file's
`# --- (N) title ---` section convention and adding one entry per case to the
case index in the header comment at `:19-86`):

- **(21) a MERGED-and-done entry records a recurrence — the reported defect.**
  Fixture mirroring `intentions/tactic-eval-finding-lock-wait.md`:

  ```
  {"id":"tactic-eval-finding-stop-hook-hold-loop","phase":"done",
   "execution":{"branch":"b","pr":3074,"attempts":{},"markers":[],
     "strategy_fingerprint":null,
     "completion":{"mergedAt":"2026-08-13T03:26:48Z",
       "mergeCommitSha":"c3c229f0de63db09df7dc01ce02177f3d1b56c95",
       "graphCommitSha":null}},
   "statement":"s",
   "attributes":{"ledger_entry":true,"first_seen":"2026-08-01",
     "measured_impact":[{"metric":"recurrence_count","value":3,
       "unit":"occurrences","window":"all-time","sensor":"rsi",
       "measured":"2026-08-13"}]}}
  ```

  Run with `STUB_STATE=retired STUB_GC_LAND=1` and the record form
  (`--slug … --statement s --body-file "$BODY" --sensor rsi --now 2026-08-19`).
  Assert: `RC` 0; `SOUT` is `landed`, **not** `skipped-in-flight`;
  `recurrence_count` moved 3 → 4; `phase` cleared to `null` (the resume);
  graph-commit was called with `--base`.

- **(22) a RESUMED entry (phase null, execution non-null) is recordable AND
  retirable — no shift-by-one.** Same fixture as (21) with `"phase":null` and
  `recurrence_count` 4. Two runs:
  - record with `STUB_STATE=open STUB_GC_LAND=1` → `landed`, count 4 → 5;
  - `--retire --slug "$SLUG"` with `STUB_STATE=open STUB_GC_LAND=1` → `landed`,
    `written '.phase'` is `done`, `measured_impact` length unchanged.

  This is the case the finding's own loose "completion null, or phase not done"
  wording would have got wrong; assert it explicitly.

- **(23) a live ladder run is still refused when a stale completion is present.**
  Fixture: `"phase":"implement"` with a **landed** `completion` block (a node
  re-dispatched after a recurrence). `STUB_STATE=open`. Assert `SOUT` is
  `skipped-in-flight`, `log_lines write-node.log` and `log_lines
  graph-commit.log` are both empty, and `OUT` contains `NOT COUNTED`. This is
  the assertion that stops a future "just check `completion`" simplification.

- **(24) doctrine ratchet over the SUT source**, in the style of case (11)
  (`:495-509`) which does `SRC="$(cat "$SUT")"` and asserts on it:
  - `assert_not_contains` `"jq -e '.execution == null'"` — the bare predicate is
    gone from every guard;
  - `assert_contains` `node_fix_in_flight` — the shared helper exists;
  - `assert_contains` `classifyTactic` — `--list` derives `in_flight` from the
    canonical classifier.

Extend two existing cases:

- **(15) `--list` membership** (`:606-787`, the only case exercising the REAL
  `list_entries()` JS against a fixture `intentions/` dir, invoked as
  `DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list`). Add a fifth
  fixture node `tactic-eval-finding-merged-example.md` copying the frontmatter
  shape of the existing fixtures (`:618-651`) but with `phase: done`,
  `attributes.ledger_entry: true`, and the full `execution:` block from
  `intentions/tactic-eval-finding-lock-wait.md:24-34` (branch/pr/attempts/
  markers/strategy_fingerprint/fix/conflict/completion — it must pass
  `validateNode`, which the other fixtures' comment at `:610-613` explains is
  why every field is present). Bump the "exactly the three … rows" count
  assertion at `:762` to four. Assert on that row: `state` is `retired` **and**
  `in_flight` is `false` — the two fields no longer contradict each other,
  which is the exact `--list` row the finding was surfaced by.

- **(16) `--resolved-by`** (`:789-887`). Add one run: the (21) merged fixture
  with `--resolved-by '#3074' --body-file "$BODY"` and `STUB_GC_LAND=1` →
  `landed` (the body refresh is now allowed once the work has landed), while the
  existing `INFLIGHT_JSON` sub-case at `:864-873` keeps its
  `skipped-in-flight` result untouched.

**Out of scope for this unit:** any change to the SUT, any new test file, and
any entry in `.github/workflows/unit-tests.yml` — `run-unit-tests.sh:88` sets
`RUN_PR_SCRIPTS=true` for any changed path under
`.claude/skills/dispatch-propagate/scripts/`, and `:186-196` globs `test-*.sh`
from that directory, so both files are auto-discovered.

---

## Unit 3 — reconcile the two calling skills' prose

**Recommended model:** sonnet (prose edits at named lines, no logic).

**Dependencies:** Unit 1.

**Scope.** Two files, prose only:

1. `.claude/skills/rsi/SKILL.md:256-266`. The sentence "**`skipped-in-flight`
   (not `noop`) means the entry's `execution` is non-null — it is being worked by
   a PR…**" is now wrong as a definition. Restate: the entry has a **live ladder
   run** on it (`execution` set and `phase` an open ladder phase). Keep every
   operational instruction as-is — it is still an uncounted occurrence, still
   must be reported, still must not be retried inside the same job.

2. `.claude/skills/rsi-audit/SKILL.md:184`. This line is stale in two ways and
   both must be fixed: it says the in-flight guard reports **`noop`** (it has
   reported `skipped-in-flight` since the ledger-fixes unit D2 — see
   `test-dispatch-eval-finding.sh:35-40`), and it defines the condition as
   "the entry's `execution` is non-null and a PR already owns its lifecycle".
   Rewrite to list `skipped-in-flight` as its own outcome word alongside
   `landed` / `noop` / `skipped-locked`, define it as a live ladder run owning
   the node, and say it is a LOST occurrence that belongs in the report's
   ledger-landing subsection — matching the wording already in
   `.claude/skills/rsi/SKILL.md`.

**Out of scope:** any behavioural instruction change to either skill, any
frontmatter change (both skills' remediation lists are author-owned per the
serving strategy's condition 19), and `.claude/settings.json`.

**Operational caveat for the implementing session:** every file this plan
touches is under `.claude/skills/`, which the sandbox's `denyWithinAllow` list
covers. `Write`/`Edit` work; the **commit** is what auto-mode may deny, and a
tree-updating git op against these paths needs `dangerouslyDisableSandbox: true`
on its first attempt (see `.claude/rules/sandbox.md`). Do not pre-emptively
disable the sandbox for ordinary reads, greps, or the test runs.

---

## Reuse

- `packages/intentionsutil/src/census.ts:12-17` — `classifyTactic(node)`:
  exported, fs-free, process-free; `"open"` ⟺ `phase` non-null and not `"done"`.
  Imported directly by Unit 1's `list_entries` change; its rule is the
  documented source for the bash helper's jq expression.
- `packages/intentionsutil/src/router.ts:137-146` — `isOpenTactic`, the
  module-private twin of the same rule, cited in comments as corroboration that
  "open ladder phase" is the repo's existing meaning of in-flight. Not exported;
  do not export it for this change.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:499`
  `origin_main_ref_ok()` — the style precedent for the new helper: plain bash
  function, exit-code-only answer, no echoed output.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:707`
  `# --- Helpers ---` — the insertion point. The helper belongs here, **not** in
  `lib.sh`: it has one consumer, and `lib.sh` is `cp`-ed standalone by ~17 CI
  fixtures (`lib.sh:2017-2030`), so its contents carry a copyability constraint
  this predicate has no reason to inherit.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` —
  `run_ef` (`:274-296`), `log_lines` / `written` (`:297-302`),
  `assert_not_contains` (`:115-125`), the source-ratchet pattern of case (11)
  (`:495-509`), the `INFLIGHT_JSON` fixture (`:429-433`), the `RETIRED_JSON`
  fixture (`:377-395`) as the shape to copy for the merged fixture, and the
  real-`list_entries` fixture block of case (15) (`:606-787`).
- `intentions/tactic-eval-finding-lock-wait.md:24-34` — the verbatim, schema-valid
  `execution:` + `completion:` YAML to copy into the case-(15) fixture node.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,186-196` —
  the existing auto-discovery that already covers both changed files.

## Verification

Baseline measured 2026-08-19 before any change: the suite is 177/177 green, and
all three fenced greps below **fail** today (counts are 3, 0, and absent
respectively), so none of them can pass vacuously.

The full suite must be green, with every pre-existing assertion untouched:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

The bare `execution == null` guard is gone from every mutating path:

```verify
test "$(grep -cF "jq -e '.execution == null'" .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding)" -eq 0
```

The three callsites plus the definition all go through one helper:

```verify
test "$(grep -c 'node_fix_in_flight' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding)" -ge 4
```

`--list` derives `in_flight` from the canonical classifier rather than a fourth
private copy of the rule:

```verify
grep -q 'classifyTactic' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding
```

The repo lint (which runs the type-safety escape check and the shell-JSON prose
rule over net-new committed lines) stays clean:

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / judgment checks, in order:

1. **Read the four reconciled comment blocks** (`:131-142`, `:212-221`,
   `:1040-1045`, `:1204-1206`) end to end and confirm no sentence still defines
   in-flight as "`execution` is non-null". Prose that contradicts the shipped
   predicate is the defect this node exists to stop recurring, one layer up.
2. **Confirm the real-world case flips.** After the change lands on `origin/main`,
   run `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding --list`
   against the live `intentions/` store and check the
   `tactic-eval-finding-lock-wait` row: `state` `retired` with `in_flight`
   `false`. Its other three flags (`unregistered: true`,
   `recurrence_count: 0`, and the missing `ledger_entry` attribute) are the
   prefix-versus-attribute disagreement working as designed at
   `dispatch-eval-finding:402-415` and must be **unchanged** — a fix that also
   clears those has done something else.
3. **Do not attempt a live end-to-end recurrence write** to prove the record
   path. Firing a real occurrence at `tactic-eval-finding-lock-wait` would
   fabricate a ledger figure to test a script; the stubbed cases (21)–(23) cover
   the write path, and check 2 covers the observable.
4. **Post-merge, note the two named sibling scripts** (`dispatch-fleet-alarm:599`,
   `dispatch-graph-main-red-sync:130-143`) still carry the un-narrowed predicate.
   If a session later observes an occurrence dropped by either, record it
   through `dispatch-eval-finding` as a distinct finding — do not fold it onto
   this node, whose scope is the eval-finding guard alone.
