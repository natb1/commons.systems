---
id: tactic-blocked-session-invisible-to-census
kind: tactic
statement: "The reap/health census classifies sessions on `state: done` alone,
  so a session in any other non-`working` state — `blocked`, `stopped` — is
  invisible to every health probe; when such a session sits in the MAIN CHECKOUT
  it holds the shared tree dirty indefinitely, which blocks
  `dispatch-select-tick`'s `--ff-only` sync and every `graph-commit`, stalling
  the whole fleet while `HELD_FOR_DEBUG_COUNT` reads `n=0`"
owner: ai
status: codified
parent: null
rationale: "Confirmed live 2026-08-09 by direct measurement, after the fleet
  produced nothing for ~71 hours (last `origin/main` commit 2026-08-06 11:08
  EDT; commits/day went 168 -> 219 -> 207 -> 20 -> 0 -> 0 -> 0). THE DEFECT:
  background session `f2416fda` (`name: sync-repair`, `cwd:
  /home/n8/natb1/commons.systems` — the MAIN CHECKOUT, not a worktree) entered
  `state: blocked` on 2026-08-06 when its `/commit-merge-push` run died on `API
  Error: Unable to connect to API (ENOTIMP)`. It had already made local commit
  `6886ffa9` and left one tracked file modified. It then sat `blocked` for three
  days with nobody to answer it — a background session in `blocked` has, by
  definition, no interlocutor, so the state is ABSORBING, not transient. THE
  BLIND SPOT: `HELD_FOR_DEBUG_COUNT` counts terminal (`state: done`) sessions
  and correctly read `n=0` for the entire outage, because `blocked` is not
  `done`. Every other health probe agreed. The one symptom that did fire —
  `dispatch-fleet-watch` reporting `busy-stall: finding` — is a KNOWN false
  positive when the pace curve is closed (owned by
  tactic-fleet-watch-busy-stall-pace-blind), so it was discounted; the `note: at
  least one dispatch-fleet-alarm graph write FAILED this pass` line printed
  directly beneath it went unread. A true defect sat inside the blind spot of a
  probe already discounted as noisy. THE CONSEQUENCE: the stale HEAD made
  `graph-commit` CORRECTLY refuse every `dispatch-fleet-alarm` write — `error:
  graph-commit: the resolved repo (/home/n8/natb1/commons.systems) holds
  intentions/tactic-fleet-alarm-busy-stall.md content differing from origin/main
  but has nothing staged to commit` — 3 failed attempts per fleet-watch pass,
  every ~2 minutes, for three days. Nothing was corrupted; the guard did its
  job. What failed is that no probe could SEE the cause. THE FIX DIRECTION
  (greenfield): the reap/health census must classify on the full session state
  space, not on `done` alone. Minimum: count and surface non-`working` sessions
  broken down BY STATE, so `blocked`/`stopped` are visible rather than folded
  into a silent remainder; and treat a non-`working` session whose `cwd` is the
  main checkout as its own alarm, because that session can dirty the tree every
  other path depends on. Reaping policy for `blocked` is a SEPARATE judgment and
  is deliberately not decided here — a blocked session may hold real evidence,
  so surface first, decide second. THE GENERAL LESSON, recorded as invariant I22
  on the bootstrap plan: `state: done` is the discriminator for REAPING, not for
  HEALTH. A second lesson (I23): a known-noisy alarm does not license ignoring
  the rest of the pass — read the `note:` and `error:` lines even when the
  headline finding is a known false positive."
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
    Band 2 of the bootstrap three-band interim scale (50/20/10). A real,
    measured defect that stranded the entire fleet for 71 hours and was
    invisible to every health probe for its full duration — well above the
    undecomposed baseline. Not band 1: the fleet-stalling condition itself is
    now cleared by hand, and the pace curve (not this defect) governs when work
    resumes, so this is the observability gap that let the outage run undetected
    rather than an active outage.


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
phase: done
execution:
  branch: tactic-blocked-session-invisible-to-census
  pr: 3054
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---

# A non-`working` session in the main checkout is invisible to every health probe

## Context

### What happened

The fleet produced nothing for ~71 hours (last `origin/main` commit 2026-08-06
11:08 EDT; confirmed by direct measurement 2026-08-09). Two independent things
were in play, and only one was a defect:

1. **The pace pause was correct.** `seven_day.used_percentage: 91` after the
   08-03/04/05 fan-out; the curve held `target_n: 0` exactly as designed. This
   is not a bug and must never be "fixed" by any unit below.
2. **The main checkout was left dirty and one commit ahead** by a background
   session nobody could see.

Background session `f2416fda` (`name: sync-repair`) ran `/commit-merge-push`
with `cwd` set to the **main checkout** rather than a worktree — that is how
`dispatch-tick:704` spawns it (`dispatch-spawn-job --name sync-repair --cwd
"$MAIN_WORKTREE"`). Its API call failed (`ENOTIMP`), the session went
`state: blocked`, and it stopped there — having already written local commit
`6886ffa9` and left `intentions/tactic-fleet-alarm-busy-stall.md` modified in
the tree. A background session in `blocked` has no one to unblock it. The state
is absorbing.

### Why nothing surfaced it

`HELD_FOR_DEBUG_COUNT` read `n=0` for the entire outage. That reading was
*correct* for what the counter measures, and it was blind for **two independent
reasons**, not one:

- **State blindness.** `claude_agents_count_held_for_debug`
  (`lib-claude-agents.sh:1397-1477`) matches only
  `CLAUDE_AGENTS_TERMINAL_STATES_JQ` (`lib-claude-agents.sh:407-411`:
  `done/stopped/killed/failed/errored/error/cancelled/canceled/terminated`),
  which deliberately **excludes** `blocked` — that exclusion is correct and
  load-bearing (see `lib-claude-agents.sh:1381-1386`), because two other
  consumers rely on `blocked` reading as a live claim. The census simply has no
  term for any *other* non-`working` state.
- **Keyspace blindness (not previously recorded on this node).** Every existing
  census function filters names on `^[0-9]+-|^tactic-|^strategy-`. The literal
  string `sync-repair` matches **none** of those. So even had that session been
  `state: done`, `HELD_FOR_DEBUG_COUNT` would still have read `n=0`. Fixing the
  state axis alone would NOT have surfaced this incident. Both axes must widen
  together.

The only probe that fired was `dispatch-fleet-watch`:

```
busy-stall:           finding  0 busy workers for 257700s (limit 2700s)
result: finding (1)
note: at least one dispatch-fleet-alarm graph write FAILED this pass
```

`busy-stall` is a known false positive whenever the pace curve is closed —
owned by `tactic-fleet-watch-busy-stall-pace-blind` — so the finding was
discounted, and the `note:` line beneath it went unread for three days.

### The blast radius

The dirty tracked file made `graph-commit` refuse every `dispatch-fleet-alarm`
write, three attempts per pass, every ~2 minutes:

```
error: graph-commit: the resolved repo (/home/n8/natb1/commons.systems) holds
intentions/tactic-fleet-alarm-busy-stall.md content differing from origin/main
but has nothing staged to commit ... refusing to emit a false 'landed'
```

The guard behaved correctly and nothing was corrupted. A dirty tracked file in
the main checkout also blocks `dispatch-select-tick`'s
`git merge --ff-only origin/main` (`dispatch-select-tick:358-364`), so the
autonomous tick's own recovery path was closed at the same time.

### The third defect: Decision A defers forever

`dispatch-select-tick:328-346` (Decision A) reads
`sessions=$(claude_sessions_under "$MAIN_WORKTREE")` and then

```
awk -F'\t' '$4=="sync-repair" && $3!="stopped"{f=1} END{exit !f}'
```

Two problems, of different kinds:

- **No age bound, no escalation.** A `blocked` session's `.status` projects as
  `idle` (or empty) — never `"stopped"` — so `$3!="stopped"` holds forever.
  This is *not* a status-classification bug: the fixtures at
  `test-lib-claude-agents.sh:1195-1246` confirm a `state:"blocked"` row carries
  `status:"idle"`, and treating that as "not stopped" is right. The defect is
  purely the **absent age bound**: the tick emits `sync-repair-pending`
  indefinitely, never reaches the fetch/merge probe, and therefore never bumps
  `sync_repair_*` attempts (`lib.sh:1922-1969`) — so the 3-attempt
  `sync-broken` escalation cap in that same script (`dispatch-select-tick:395-415`)
  is structurally unreachable.
- **ACTIVE-view only.** `claude_sessions_under` (`lib-claude-agents.sh:578-631`)
  queries `claude agents --json --cwd <path>` **without** `--all` (contract at
  `lib-claude-agents.sh:57-71`), so a `done`/`stopped` session sitting in the
  main checkout is invisible to it entirely.

### Two corrections to earlier reuse notes (read before implementing)

1. **`worktree_occupancy_state` is NAME-keyed, not cwd-keyed.** An earlier
   gather note called "call `worktree_occupancy_state` on the main checkout" the
   minimum fix. It is **wrong and would silently no-op.** That function
   (`lib-claude-agents.sh:1057-1172`) matches `claude_agents_list_registered`'s
   column 3 (`.name`) against `basename "$pth"` (and `office-hours-<N>` for a
   numeric prefix). For the main checkout the basename is the repo directory
   name (`commons.systems`); no session is ever named that, so the function
   returns `free` unconditionally. It also never reads `.cwd` at all — and
   `claude_agents_list_registered` does not even project `.cwd`
   (`lib-claude-agents.sh:888-891` projects `sessionId, status, name, state`).
   A cwd-keyed registered-view lister does not exist and must be added.
2. **`sync-repair` is outside the worker keyspace** — see "Keyspace blindness"
   above. Do not assume the existing counters would have caught a terminal
   sync-repair session.

### Intended outcome

- The reap/health census classifies on the **full session state space and the
  full session keyspace**, so `blocked`, `stopped`, and non-worker job sessions
  appear in the census output rather than falling into a silent remainder. An
  `n=0` held-for-debug count must never again read as "no stuck sessions".
- A stuck non-`working` session **in the main checkout** raises its own
  attributed alarm on the graph, because that session can dirty the tree every
  other path depends on — a categorically larger blast radius than a
  worktree-scoped one.
- Decision A's defer is **age-bounded**, so a stuck main-checkout session ends
  at the existing `sync-broken` escalation instead of an unbounded silent defer.

### Recorded invariants (carried forward — do not drop)

- **I22.** `state: done` is the discriminator for **REAPING**, not for
  **HEALTH**. Every unit below must preserve that distinction: nothing here adds
  `blocked` to `CLAUDE_AGENTS_TERMINAL_STATES_JQ`, and nothing here reaps a
  `blocked` session.
- **I23.** A known-noisy alarm does not license ignoring the rest of the pass.
  The `note: at least one dispatch-fleet-alarm graph write FAILED this pass`
  line beneath a discounted headline finding must still be read. See "Explicitly
  out of scope" for how this is (not) actioned here.

### Reaping policy for `blocked` is deliberately NOT decided here

A blocked session may hold real evidence — the transcript of `f2416fda` is what
identified the `ENOTIMP` trigger. **Surface first, decide second.** No unit below
kills, `claude rm`s, or parks a `blocked` session. Unit 4 changes only whether
the *tick* waits on it.

### Explicitly out of scope (instructions to sibling nodes)

- **Reaping/parking policy for `blocked` sessions.** Not decided here (above).
- **I23 remediation.** `dispatch-fleet-watch`'s `ALARM_FAILED` flag
  (`dispatch-fleet-watch:742-748, 913`) prints its `note:` line *after* the
  `result:` line and does **not** affect the exit code, so a failing graph write
  is invisible to any exit-code-driven consumer. That is a real defect and a
  genuine sibling to this one, but it is a change to the watcher's *reporting
  contract*, not to session classification. A sibling node should own it. Do not
  fold it into Unit 3.
- **`dispatch-escalate-sync-broken`'s gh-issue lane.** GitHub Issues are
  disabled repo-wide (legacy router removed 2026-07-26, PR #2960); that script's
  find-or-create issue payload (`dispatch-escalate-sync-broken:200-239`) can
  never succeed, and its call sites at `dispatch-select-tick:407,410` already
  wrap it in `|| true`. **Do not invest new diagnostic logic there** — it lands
  in an unreachable payload. Route every new human-visible diagnostic through
  `dispatch-fleet-alarm`'s graph-node surface instead. Retiring that lane is an
  adjacent cleanup for a separate node.
- **`tactic-fleet-watch-busy-stall-pace-blind`** (the pace-blind busy-stall
  false positive). Untouched here. Unit 3 adds a *sixth* predicate; it must not
  modify predicate 3.
- **The pace curve.** `target_n: 0` under a closed curve is correct behavior.
  No unit touches pace logic.

### Not a duplicate of (dedup re-run 2026-08-09 against every session/census node on `origin/main`)

- `tactic-stopped-session-blocks-node` (`phase: done`) — `done`-but-not-removed
  sessions invisible to the router's **occupancy** path (no `--all`). Occupancy,
  not health; worktree-scoped. Its REGISTERED-vs-ACTIVE view split is the design
  precedent Unit 1 follows.
- `tactic-frozen-session-debug-count` (`phase: done`) — introduced the
  held-for-debug count itself, scoped to terminal worker-keyspace sessions. This
  node is about what that count cannot see.
- `tactic-park-node-rollback-dirty-tree-blocks-tick-sync` (`phase: done`) — a
  *producer* of main-checkout dirt (park-node's rollback). This node is about
  the absence of detection, whatever the producer.
- `tactic-provision-residue-live-session-check`,
  `tactic-standdown-clear-no-worktree-live-session` (both `phase: null`) — both
  concern **live** sessions and node worktrees.
- `tactic-fleet-watch-duplicate-session-predicate`,
  `tactic-duplicate-session-mechanical-resolution` (both `phase: null`) —
  concurrency/duplicate claims, node-worktree scoped.
- `tactic-invalid-state-lane` (`phase: done`) — NODE-level invalid-state
  handling. This node is session/tree-level on the shared main checkout, a
  different axis; Unit 3 plugs into the existing `dispatch-fleet-alarm` surface
  rather than inventing a third detection point.

None is main-checkout-scoped, and none counts the full session state space.

### Related nodes

- `tactic-fleet-watch-busy-stall-pace-blind` — the noisy alarm whose known-false
  status is *why* this went unnoticed.
- `tactic-session-reap-authorization-durability`,
  `tactic-terminal-declaration-verified-against-node` — two directions of the
  reap-authorization seam; this node is health classification, not reap
  authorization.

### Standing sandbox constraint (applies to every unit and to manual verification)

`claude agents --json` reaches the local Claude daemon over a Unix socket. A
**sandboxed** call does not error — it returns `[]` with exit 0, which every
function here reads as a definite "no sessions". Any manual probe run must use
`dangerouslyDisableSandbox: true`, or it reproduces exactly the blind spot this
node exists to close. See `.claude/rules/sandbox.md`. The automated suites below
stub `claude` via `CLAUDE_AGENTS_CMD`/`PATH` and are sandbox-safe.

---

## Unit 1 — Registered-view, cwd-keyed session lister + full-state census breakdown

### Scope

**Changes** — `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`,
adding two new functions inside the existing
`if [[ -z "${_LIB_CLAUDE_AGENTS_LOADED:-}" ]]` guard block, placed immediately
after `claude_agents_list_blocked_workers` (which ends at
`lib-claude-agents.sh:1572`):

**1a. `claude_agents_list_sessions_in_cwd_all <path>`**

- Queries `"${CLAUDE_AGENTS_CMD:-claude}" agents --json --all` **directly**
  (not via `_claude_agents_raw_registered`, and not via `--cwd`), for the same
  reason `claude_agents_count_held_for_debug` does
  (`lib-claude-agents.sh:1389-1396`): the non-`--all` tick snapshot lacks the
  terminal rows this function exists to find. Copy that function's comment
  rationale rather than restating it loosely.
- **No keyspace filter.** This is the fix for keyspace blindness: `sync-repair`,
  `diagnose-main`, jit job names, and human interactive sessions must all be
  visible. State this explicitly in the header comment, with the
  `sync-repair`-does-not-match-`^[0-9]+-|^tactic-|^strategy-` reason.
- Filters on `.cwd == <path>` — **exact string equality**, never a prefix or
  substring test (a prefix test on the project root would match every worktree
  under `.claude/worktrees/`, i.e. the entire fleet).
- Projects `sessionId<TAB>id<TAB>name<TAB>state<TAB>status` TSV, mirroring
  `claude_agents_list_terminal_workers`'s projection shape
  (`lib-claude-agents.sh:1519-1522`). Carry forward that function's `.id` note
  verbatim in substance: `.id` is the registry's own job id and is a DISTINCT
  value from the sessionId; consumers needing `~/.claude/jobs/<id>` must key on
  it, never on `${sessionId%%-*}`.
- Return contract, identical in shape to its siblings and stated in the header:
  `return 0` = daemon queried successfully, stdout is zero or more TSV lines
  (zero matches is a definite "none", NOT a failure); `return 1` = UNKNOWN
  (`claude` missing, non-zero exit, whitespace-only stdout, non-array JSON) with
  empty stdout. Callers MUST treat UNKNOWN as "cannot reconcile", never as
  "none".
- Empty `<path>` argument: print the usage line to stderr and `return 1`,
  matching `claude_sessions_under`'s empty-arg handling
  (`lib-claude-agents.sh:579-583`).

**1b. `claude_agents_count_by_state`**

- Same direct `--all` query (one query; do NOT add a second daemon round-trip —
  if both functions are called in one pass that is two queries total and
  acceptable, but neither may query twice internally).
- Emits one `state<TAB>count` line per distinct state, sorted by state, over
  **every** registered session — again with **no keyspace filter**, plus a
  parallel keyspace-partitioned view. Concretely, emit lines of the form
  `<keyspace><TAB><state><TAB><count>` where `<keyspace>` is `worker` (name
  matches `^[0-9]+-|^tactic-|^strategy-`) or `other` (everything else,
  including routers `dispatch-*`, `sync-repair`, jit and diagnose jobs, and
  unnamed/human sessions). Nothing may fall into an unemitted remainder.
- The state key is `(.state // .status) // "<none>"` — the same resolution
  `claude_agents_count_held_for_debug` uses (`lib-claude-agents.sh:1428-1432`),
  with the literal `<none>` bucket for a row carrying neither, so a stateless
  row is *visible* rather than silently dropped.
- **Prepend `$CLAUDE_AGENTS_TERMINAL_STATES_JQ` and use `terminal_states` to
  emit an additional `terminal` roll-up row per keyspace** — do NOT re-list the
  nine states. The header comment at `lib-claude-agents.sh:395-411` explicitly
  warns that consumers previously each carried their own copy and must not
  drift. **Do not add `blocked` to that enum** (invariant I22): two other
  consumers depend on `blocked` reading as a live claim.
- Same `return 0` / `return 1` UNKNOWN contract as 1a.

**Out of scope for this unit:** no call sites change; no existing function's
behavior changes; `CLAUDE_AGENTS_TERMINAL_STATES_JQ` is read, never edited;
`claude_agents_list_registered`'s projection is left alone (adding `.cwd` there
would change a shared 4-column contract that `worktree_occupancy_state`'s awk
depends on positionally at `lib-claude-agents.sh:1129-1131`).

**Tests** — extend
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh`, following
the existing `ca_setup` / `write_fake_claude '<json>' <rc>` / `assert_eq` /
`ca_teardown` idiom used at `test-lib-claude-agents.sh:1188-1250`. Required
cases:

- `list_sessions_in_cwd_all`: exact-cwd match emits only the matching rows; a
  row whose cwd is a *prefix-extended* path (`/main/.claude/worktrees/x`) is NOT
  matched when querying `/main`; a `sync-repair`-named row **is** emitted
  (keyspace-filter-free ratchet); a `state:"blocked"` row with
  `status:"idle"` is emitted with `state` column `blocked`; a terminal
  `{"state":"done"}` row with no `.status` key is emitted; `[]` → rc 0 + empty
  stdout; daemon rc 1 → rc 1 + empty stdout; non-array JSON → rc 1; missing
  `<path>` → rc 1.
- `count_by_state`: a mixed registry produces the expected sorted
  `keyspace/state/count` lines including an `other`/`blocked` row for a
  `sync-repair` session — this is the **regression ratchet for the incident**;
  a stateless row lands in `<none>`; the `terminal` roll-up counts `done` and
  `errored` together but NOT `blocked`; `[]` → rc 0 with empty stdout;
  daemon rc 1 → rc 1.

### Reuse

`CLAUDE_AGENTS_TERMINAL_STATES_JQ` (`lib-claude-agents.sh:407`);
`claude_agents_count_held_for_debug` (`:1397`) for the direct-`--all` query
shape and the `(.state // .status)` resolution;
`claude_agents_list_terminal_workers` (`:1479`) for the TSV projection and the
`.id` contract; `claude_agents_list_blocked_workers` (`:1534`) for the
`return 0` empty-stdout convention.

### Recommended model

`opus` — the UNKNOWN/fail-direction contract and the shared-enum reuse
constraint are judgment-heavy, and getting the exact-vs-prefix cwd match wrong
would match the entire fleet.

---

## Unit 2 — Surface the by-state breakdown in the sweep census

### Scope

**Changes** — `.claude/skills/dispatch-propagate/scripts/dispatch-sweep`,
`:568-590` only.

- Keep `HELD_FOR_DEBUG_COUNT` exactly as it is (`:581-590`) — it is a distinct,
  correctly-scoped metric and other readers know its shape.
- **Preserve the `PLACEMENT` comment block at `:551-566` verbatim.** It
  documents why this metric runs after `session_reap_sweep` (`:566`) — so the
  metric reports the state the sweep *leaves behind*. The new lines go in the
  same position, after `session_reap_sweep`, before `exit 0` (`:592`).
- Add, immediately after the `HELD_FOR_DEBUG_COUNT` log line, a
  `SESSION_STATE_CENSUS` block calling `claude_agents_count_by_state`:
  - rc 0 → one `log` line per emitted row, e.g.
    `SESSION_STATE_CENSUS: keyspace=other state=blocked n=1`. Emitting one line
    per row (not a single joined line) keeps each fact greppable in
    `tmp/dispatch-sweep.log` and journald.
  - rc 0 with **zero rows** → `log "SESSION_STATE_CENSUS: none (empty registry)"`.
  - rc 1 → `log "SESSION_STATE_CENSUS: UNKNOWN (daemon unqueryable)"`. UNKNOWN
    must be logged distinctly from zero, exactly as the existing block does at
    `:588` — "daemon unqueryable" and "zero sessions" are different facts.
- Carry forward the existing sandbox caveat comment (`dispatch-sweep:575-580`)
  to cover the new block too: an `n=0` reading from a sandboxed run means "not
  measured", not "nothing stuck".
- This is **observability only**. Nothing downstream branches on it; the sweep
  must not gain a new exit code or a new side effect.

**Out of scope:** the worktree arm, `session_reap_sweep`, and any reap decision.

**Tests** — extend
`.claude/skills/dispatch-propagate/scripts/test-dispatch-sweep.sh` with cases
asserting the three log shapes (rows / none / UNKNOWN) using the suite's
existing fake-`claude` stub mechanism, and asserting that `dispatch-sweep` still
exits 0 in all three.

### Reuse

`claude_agents_count_by_state` (Unit 1); the existing `log` helper and
UNKNOWN-vs-zero logging convention in `dispatch-sweep:581-590`.

### Recommended model

`sonnet` — rote wiring of an existing helper into an existing log block with an
explicit line-shape spec.

### Dependencies

Unit 1.

---

## Unit 3 — `main-checkout-held` alarm: an attributed graph node for a stuck session in the shared tree

### Scope

**3a. New alarm kind** —
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm`:

- Add `main-checkout-held` to the closed `KINDS` array at `:180`. That is the
  only edit needed: the anchored id regex is built from the array at `:241` and
  the validation loop at `:230-232` reads it, so no second place lists kinds.
- Node id becomes tactic-fleet-alarm-main-checkout-held.
- Extend `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh`
  with the kind-acceptance case in whatever shape that suite already asserts the
  existing kinds (mint / refresh / resolve round-trip for the new kind, and that
  an unknown kind still exits 64).

**3b. Predicate 6 in `dispatch-fleet-watch`** —
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch`:

Add a sixth predicate, `main-checkout-held`, wired exactly like predicate 5
(`:618-694`), touching these sites:

- Header predicate list `:26-32` — add line 6.
- Predicate body: place after predicate 5's block, before the
  `# === Reporting ===` divider at `:696`.
- `B_MAIN="${B_MAIN:-$D_MAIN}"` alongside `:701-705`.
- `note_verdict "$V_MAIN" "main-checkout-held: $B_MAIN"` alongside `:719-723`.
- `dispatch_predicate "$V_MAIN" main-checkout-held ...` alongside `:828-834`.
- `--json` predicates object (`:853-895`) and the human-readable printf block
  (`:898-905`), matching the existing column alignment.

**Predicate logic — a CONJUNCTION, deliberately:**

```
finding  ⇔  (main checkout tree is dirty OR ahead of origin/main)
            AND (≥1 registered session with cwd == main checkout whose state is
                 NOT `working`/`busy`, and whose transcript idle age ≥ grace)
```

Why a conjunction and not the session alone: an **interactive human session
running in the repo root registers with `cwd` == the main checkout** and sits
`idle`/`blocked` for hours as a matter of course. Alarming on the session alone
would mint a graph node against normal human use. The harm condition is the
shared tree being unusable; the session is the *attribution*. Together they are
exactly the incident and nothing else.

- **Grace:** `DISPATCH_FLEET_WATCH_MAIN_HELD_GRACE_S`, default `1800`. Mirror
  the comparison convention at `lib-frozen-session-park.sh:495-529`
  (`if (( idle < grace )); then observe else act`), **including** its
  deliberate treatment of a negative/future-stamped idle as `< grace` (observe,
  do not act).
- **Idle measurement:** source `lib-standdown-recheck.sh` and call
  `_standdown_session_idle_s <sid> <NOW>` (`lib-standdown-recheck.sh:321-355`).
  Its own comment flags that it is triplicated (a second and third copy live at
  `lib-frozen-session-park.sh:495-529` and `:1069-1094`) and that extraction is
  a follow-up. **Do not write a fourth copy.** It returns rc 1 with no output on
  no-match = UNKNOWN; treat UNKNOWN idle as "cannot judge this row" — the row
  contributes to neither `finding` nor `clear`, and if it is the *only*
  candidate row the verdict is `unknown`, never `clear`.
- **Source guard:** use `dispatch-tick`'s guarded-source idiom
  (`dispatch-tick:354, 388, 406, 531, 578`) — a load failure logs loudly and
  yields `unknown` for this predicate; it never aborts the pass. Nothing in this
  script may exit early (the header's single most important property,
  `dispatch-fleet-watch:12-18`).
- **Session read:** `claude_agents_list_sessions_in_cwd_all "$MAIN_ROOT"` from
  Unit 1. This reads the REGISTERED (`--all`) view, so gate on **`SNAPSHOT_ALL_OK`**,
  not `SNAPSHOT_OK` — the same reasoning spelled out for predicate 5 at
  `:596-617`. Note that Unit 1's function queries `--all` directly rather than
  through `DISPATCH_AGENTS_SNAPSHOT_ALL`; `SNAPSHOT_ALL_OK` is still the correct
  readability gate because it certifies the same view. State that in a comment.
- **`MAIN_ROOT`:** `resolve_main_worktree` (`lib-graph-worktree.sh:27`, already
  sourced at `:299-302` and already used by predicate 5 as `HOLD_ROOT`). Reuse
  `HOLD_ROOT` if it is in scope rather than re-resolving.
- **Tree read — three-way, never two-way:** run
  `git -C "$MAIN_ROOT" status --porcelain --untracked-files=no` and
  `git -C "$MAIN_ROOT" rev-list --count HEAD --not --remotes` separately,
  capturing each rc. A **failed** git command is `unknown`, not `clear` and not
  `finding` — mirror the three-way pattern at `lib-worktree-residue.sh:185`.
  `worktree_in_sync` (`lib-worktree-in-sync.sh:38-78`) is the canonical
  definition of "clean AND zero unpushed" and is the precedent for *what* to
  check, but do **not** call it here: it collapses "git failed" into the same
  non-zero return as "dirty", which is the wrong fail direction for an alarm
  (see `dispatch-fleet-watch:596-608`). Also note it sets `-uo pipefail` in the
  caller on source.
- **FAIL DIRECTION, restated for this predicate:** an unreadable daemon or an
  unreadable tree must yield `unknown`, never `clear`. A `clear` here does not
  merely suppress the alarm — `dispatch_predicate` (`:764-772`) sends
  `--resolve --kind main-checkout-held` on `clear`, closing an already-open
  alarm node. A false all-clear is the exact failure this watcher exists to
  prevent.
- **Pause:** evaluated **regardless of pause**, like predicates 2, 4 and 5. A
  dirty shared tree is not a consequence of pausing, and this incident happened
  *during* a correct pause. Do not make this predicate `quiet` under pause.

**Body-stability contract (`B_MAIN`) — this is load-bearing.** Per
`dispatch-fleet-watch:64-82` and the min-refresh brake at
`dispatch-fleet-alarm:38-62`, the alarm **body** carries condition IDENTITY only.

- `B_MAIN` (→ graph node body): the sorted set of `<name>:<state>` pairs for the
  offending sessions, the main checkout path, and the threshold *names*. Sort so
  the same set always renders the same bytes regardless of registry ordering.
- `D_MAIN` (→ stdout / journald / `--json`): the live reading — session **ids**,
  idle seconds, the porcelain line count, the unpushed-commit count.
- **Never** in `B_MAIN`: sessionIds, idle ages, commit shas, counts,
  timestamps. The operator needs the sessionId to act, so the body should say
  *"the offending session id and its idle age are in this pass's journald
  output"* — the same phrasing precedent as the `daemon-degraded` body at
  `:791-801`.

**Alarm statement:** `"A stuck session is holding the shared main checkout
dirty"`. Body should name the concrete blast radius (blocks
`dispatch-select-tick`'s `--ff-only` sync and every `graph-commit`) and state
plainly that **the recommended act is to inspect the session's transcript
first** — a `blocked` session may hold the only evidence of why it died. Do not
recommend a blind `claude rm`.

**Out of scope:** predicate 3 (`busy-stall`) is untouched. This predicate takes
no fix action, writes no park, and removes no session — `dispatch-fleet-watch`
never fleet-halts (`:84-89`, ratcheted by grep assertions in its suite).

**Tests** — extend
`.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh`:

- dirty tree + blocked session past grace → `finding`, alarm raised with kind
  `main-checkout-held`.
- dirty tree + blocked session **within** grace → `clear` (not yet stuck).
- dirty tree + a `working`/busy session → `clear` (someone is actively working).
- **clean tree + blocked session → `clear`** (the human-interactive-session
  no-noise case).
- unreadable registered snapshot → `unknown`, contributes to
  `watch-unknown`, and **no** `--resolve` is sent.
- git status failure → `unknown`, no `--resolve`.
- **body-stability case**: two passes whose *readings* differ (different idle
  ages, different porcelain counts) emit **byte-identical** bodies — mirror the
  existing body-stability case the suite already runs for the other predicates.
- the existing never-fleet-halt grep assertions still pass.

### Reuse

`dispatch-fleet-alarm` `KINDS` (`:180`) and its find-or-create/min-refresh
machinery; `dispatch_predicate` / `note_verdict` / `raise_alarm` /
`resolve_alarm` (`dispatch-fleet-watch:711-772`); predicate 5 (`:618-694`) as
the structural template; `_standdown_session_idle_s`
(`lib-standdown-recheck.sh:321-355`); the grace convention at
`lib-frozen-session-park.sh:495-529`; `resolve_main_worktree`
(`lib-graph-worktree.sh:27`); `claude_agents_list_sessions_in_cwd_all` (Unit 1);
`dispatch-tick`'s guarded-source idiom (`:354`).

### Recommended model

`opus` — fail-direction reasoning, the resolve-on-clear hazard, the
body-stability contract, and the conjunction's false-positive economics are all
judgment calls the plan constrains but cannot fully mechanize.

### Dependencies

Unit 1.

---

## Unit 4 — Bound Decision A's defer so the existing `sync-broken` escalation is reachable

### Scope

**Changes** — `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`,
`:328-346` only (plus the header decision-line prose at `:30-31` and the sourcing
lines at `:298-302`).

Replace the unbounded name-and-status defer with a **bounded, attributed** one:

1. Read main-checkout sessions via
   `claude_agents_list_sessions_in_cwd_all "$MAIN_WORKTREE"` (Unit 1), the
   REGISTERED view. Keep `claude_sessions_under` **only** if the implementer
   finds a concrete need; the registered view is a strict superset for this
   question and the ACTIVE-only read is precisely what hid a `stopped` holder
   (contract at `lib-claude-agents.sh:57-71`).
2. **Fail OPEN on UNKNOWN (rc 1), unchanged.** The current code falls through to
   the merge when `claude_sessions_under` returns rc 1, matching the concurrency
   gate's fail-open philosophy — the comment at `:328-336` explains why
   (`dispatch-spawn-job`'s own dedup fails *closed* on UNKNOWN, so no duplicate
   repair is spawned, and git's `index.lock` contains the rare race). **Preserve
   that reasoning and that behavior**, and preserve the comment.
3. **Defer (`sync-repair-pending`, exit 0) only when** a main-checkout session is
   genuinely active: state resolves to `working`, or status is `busy`. An active
   session is legitimately mutating the tree and the tick must wait.
4. **Defer also when** a non-`working` session is present but its transcript idle
   age is **below** `DISPATCH_MAIN_CHECKOUT_STUCK_GRACE_S` (default `1800`) —
   via `_standdown_session_idle_s` (`lib-standdown-recheck.sh:321-355`), sourced
   with `dispatch-tick`'s guarded-source idiom (`dispatch-tick:354`). An UNKNOWN
   idle (rc 1, no transcript found) folds to **defer** — fail-safe, matching that
   helper's documented "caller must keep" contract.
5. **Beyond the grace, DO NOT defer.** Fall through to the existing
   fetch/`merge --ff-only` probe at `:348-364` unchanged. Set
   `DLOG_SKIP_REASON` to an attributed value naming the stuck session's name and
   state (e.g. `main-checkout-stuck:sync-repair:blocked`) so the decision log
   records *why* the defer was declined, and emit a stderr line naming the
   sessionId.

**Why falling through is the correct escalation, not a hazard** — record this
reasoning in the code comment:

- `merge --ff-only` on a dirty tree **fails**; it does not corrupt anything.
- A failed merge bumps `sync_repair_bump_attempts` (`lib.sh:1953-1969`) and emits
  `sync-failed` (`:417-424`).
- `dispatch-tick` reads `sync-failed` and calls
  `dispatch-spawn-job --name sync-repair` (`dispatch-tick:693-706`), whose dedup
  (`dispatch-spawn-job:261-269`) sees the existing live `sync-repair` name and
  returns `deduped` — **no duplicate repair session is spawned**, which is the
  desired outcome.
- After 3 such ticks the attempt cap at `:395-415` fires:
  `repo-health --set-sync-broken --reason merge-failed` latches durably, and the
  tick emits `sync-broken`. **That is the escalation the current code can never
  reach**, and reaching it is this unit's entire point.

**Grace default rationale:** 1800s is 2× `DISPATCH_FROZEN_SESSION_GRACE_S`'s 900
(`lib-frozen-session-park.sh:496`) — a legitimate `/commit-merge-push` run in the
main checkout can idle on a slow push or a CI wait, and the cost of waiting an
extra 30 minutes is far below the cost of a spurious `sync-broken` latch.
Document the reasoning and the env-var name in the script header.

**Out of scope:** `repo-health`'s record shape (`:348-371`) is unchanged — no new
key. `dispatch-escalate-sync-broken` is unchanged (see "Explicitly out of
scope"). No new decision line is added to the `:26-48` enum; the existing
`sync-repair-pending` / `sync-failed` / `sync-broken` lines carry every outcome.
Do not touch Decision B or the `--manual` path.

**Tests** — extend
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`,
stubbing `claude` and the transcript-mtime source
(`DISPATCH_STANDDOWN_PROJECTS_ROOT`):

- live `working` session in main → `sync-repair-pending`, tree untouched,
  attempt counter unchanged (existing behavior preserved).
- `blocked` session in main, idle **< grace** → `sync-repair-pending`
  (existing behavior preserved).
- **`blocked` session in main, idle ≥ grace → falls through to the merge probe**;
  on a dirty tree the attempt counter increments and the decision line is
  `sync-failed`. **This is the incident regression ratchet.**
- same, on the 3rd attempt → `sync-broken` and `repo-health --set-sync-broken`
  invoked — proving the cap is now reachable.
- `stopped`/`done` session in main (REGISTERED-view-only row, invisible to
  `claude_sessions_under`) with idle ≥ grace → falls through. This is the case
  the ACTIVE-only read structurally could not see.
- no transcript for the session (idle UNKNOWN) → `sync-repair-pending`
  (fail-safe defer).
- daemon UNKNOWN (rc 1) → falls through to the merge (fail-open preserved).

### Reuse

`claude_agents_list_sessions_in_cwd_all` (Unit 1); `_standdown_session_idle_s`
(`lib-standdown-recheck.sh:321-355`); the grace convention at
`lib-frozen-session-park.sh:495-529`; `sync_repair_read_attempts` /
`sync_repair_bump_attempts` / `sync_repair_reset_attempts` (`lib.sh:1922-1969`);
`repo-health --set-sync-broken` / `--sync-broken-latched` / `--clear-sync-broken`
(`repo-health:348-371`); `dispatch-tick`'s guarded-source idiom (`:354`).

### Recommended model

`opus` — this is the concurrency/ordering-sensitive unit. Getting the fail-open
vs fail-safe directions crossed either stalls the fleet again or spawns a second
writer into a tree a live session is mutating.

### Dependencies

Unit 1.

---

## Reuse

Existing code every unit builds on, with paths:

- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:407` —
  `CLAUDE_AGENTS_TERMINAL_STATES_JQ`, the single shared terminal-state enum.
  Prepend it as a jq `def`; never re-list the states; never add `blocked` (I22).
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1397` —
  `claude_agents_count_held_for_debug`: the direct-`--all` query pattern and the
  `(.state // .status) // ""` state resolution.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1479` —
  `claude_agents_list_terminal_workers`: TSV projection shape and the `.id`
  job-dir contract.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1534` —
  `claude_agents_list_blocked_workers`: the `state == "blocked"` predicate and
  the rc-0-with-empty-stdout convention.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:578` —
  `claude_sessions_under` (ACTIVE view) and its contract note at `:57-71`
  explaining what it structurally cannot see.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:321` —
  `_standdown_session_idle_s <sid> <now>`; already triplicated (see
  `lib-frozen-session-park.sh:495-529` and `:1069-1094`) — call it, never copy it.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:495-529` —
  the grace-comparison convention, including negative-idle handling.
- `.claude/skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh:38` —
  `worktree_in_sync`: canonical "clean AND zero unpushed" definition (reference
  only; not called — see Unit 3).
- `.claude/skills/dispatch-propagate/scripts/lib-worktree-residue.sh:185` —
  three-way `unknown` pattern for a failed `git status`.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` —
  `resolve_main_worktree`.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1922-1969` —
  `sync_repair_attempts_file` / `_read_` / `_bump_` / `_reset_attempts`.
- `.claude/skills/dispatch-propagate/scripts/repo-health:348-371` — the durable
  label-free `sync_broken` latch (read/set/clear); reused as-is, not extended.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:180` — the
  closed `KINDS` enum and the find-or-create + min-refresh alarm machinery.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:618-694,
  711-772` — predicate 5 as the structural template, plus `note_verdict` /
  `dispatch_predicate` / `raise_alarm` / `resolve_alarm`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:354` — the guarded
  `source "$SCRIPT_DIR/lib-*.sh" || { log loudly; continue }` idiom.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:261-269` — the
  live-name dedup that makes Unit 4's fall-through safe.
- `.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh:1188-1250` —
  the `ca_setup` / `write_fake_claude` / `assert_eq` / `ca_teardown` harness, and
  the fixtures proving a `blocked` row carries `status:"idle"`.

**Coding-rule constraint that bites here:** `lib-claude-agents.sh` is a
committed `.sh` file, so `lint-prose-rules.sh` (run by `run-lint.sh` in CI)
mechanically rejects net-new `echo "$JSON" | jq` lines. Use a here-string
(`jq ... <<<"$out"`), `printf '%s'`, or a direct pipe — the shape every existing
function in that file already uses. See `.claude/rules/shell-json.md`.

## Verification

The shell suites under `.claude/skills/dispatch-propagate/scripts/` are wired
into CI automatically: `run-unit-tests.sh:88` sets `RUN_PR_SCRIPTS=true` for any
changed path under that directory, and `:187-196` globs `test-*.sh` there. No
`.github/workflows/unit-tests.yml` edit is needed (the explicit list at
`:203-246` exists only for suites whose SUT lives *outside* that directory).

All suites stub `claude` via `CLAUDE_AGENTS_CMD`/`PATH` and need no live daemon,
so they run correctly sandboxed.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-sweep.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh || exit 1
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

### Manual / observe-in-production checks

Every command below **must** run with `dangerouslyDisableSandbox: true` — a
sandboxed `claude agents --json` returns `[]` with exit 0 and would vacuously
"pass" every one of these.

1. **Census breadth, live.** Run `dispatch-sweep` on the real machine and read
   `tmp/dispatch-sweep.log`. Confirm `SESSION_STATE_CENSUS` lines appear, that
   their per-keyspace counts sum to the row count of
   `claude agents --json --all | jq length`, and that nothing is missing — the
   whole point is that no session falls into an unemitted remainder. Cross-check
   against `claude agents --all` by eye.
2. **Keyspace ratchet, live.** With any non-worker-named session running (a
   router `dispatch-*` is the easiest), confirm it appears under
   `keyspace=other` and that `HELD_FOR_DEBUG_COUNT` is unchanged by its
   presence. This is the axis the incident proved was blind.
3. **Alarm precision, negative case.** With an ordinary interactive session open
   in the repo root and a **clean** main checkout, run `dispatch-fleet-watch`
   and confirm `main-checkout-held: clear`. If this fires, the conjunction is
   wrong and the alarm will mint graph nodes against normal human use.
4. **Alarm, positive case.** In a scratch clone, dirty a tracked file, point
   `resolve_main_worktree` at it, stub a `blocked` session with a
   backdated transcript mtime, and confirm the pass reports `finding` and that
   tactic-fleet-alarm-main-checkout-held is minted. Then run a second pass
   with a different idle age and confirm **no second commit** is pushed (the
   `cmp -s` body-identity gate holds).
5. **Decision A, end to end.** Judgment call — verify on the real fleet only
   after the units land: the next time a main-checkout session goes
   non-`working`, confirm the tick logs the attributed
   `main-checkout-stuck:<name>:<state>` skip reason, that
   `tmp/sync-repair-attempts` increments across ticks, and that the third tick
   latches `repo-health --sync-broken-latched` → `latched`. Confirm no second
   `sync-repair` session was spawned (`claude agents --all | grep sync-repair`
   shows exactly one).
6. **I22 preserved.** Confirm no `blocked` session was reaped, killed, or parked
   by any of this. Grep the sweep log for `REAP` lines naming a blocked session:
   there must be none.

