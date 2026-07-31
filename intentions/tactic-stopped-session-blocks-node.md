---
id: tactic-stopped-session-blocks-node
kind: tactic
statement: A session that has stopped but has not been claude rm'd must continue
  to block its node's concurrent execution — the router's occupancy path queries
  claude agents --json without --all, so a done-but-not-removed session is
  invisible to it and the node becomes selectable again while the held debugging
  artifact is never inspected
owner: ai
status: codified
parent: null
rationale: "AUTHOR-STATED REQUIREMENT (2026-07-30, dispatch-pipeline bootstrap):
  a session that is stopped but not claude rm'd must continue to block that
  node's concurrent execution. Releasing the node is an explicit human act
  (claude rm <id>), not something that happens by the session merely finishing.
  Today the system does the opposite, by explicit design: claude agents --json
  lists only ACTIVE sessions and --all adds completed ones (state done), and the
  router's occupancy path never passes --all. Filed as a NEW node during the
  bootstrap after confirming three adjacent nodes each miss this predicate:
  tactic-claim-containment-durable-anchor is the closest (anchoring the freeze
  in durable state would incidentally satisfy this) but its stated trigger is
  registry LOSS, not the registry deliberately hiding done rows, and it is a
  much larger redesign; tactic-frozen-session-debug-count is observability only
  — it makes accumulation visible, never blocking;
  tactic-graph-node-session-reap runs the opposite direction, removing sessions
  on terminal exit, where this node is about ones that linger. Filed separately
  so the cheap fix (teach the occupancy check to count a done-but-not-removed
  session as occupied) does not wait on the expensive redesign. Scoped small
  deliberately. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks. blocked_by is empty, so the Wave A
  promotion lifts no blocker and cannot compound. Finalized 2026-07-31 via
  /align-tactics (tactic mode, draft/raw finalize): planned into a full
  clean-session plan (Units 1-4 in the body) that adds a distinct REGISTERED
  (`--all`) view alongside the existing ACTIVE view rather than flipping the
  shared claude_agents_list_all wholesale, since that helper also backs
  reservation_sweep's dead-router reclaim and flipping it would let done rows
  immortalize reservation markers and stall the fleet."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is a live containment hole that silently voids the doctrine
    tactic-router-failure-fuses records, so an undeclared pass stops holding its
    node the moment its session goes done, and the node is re-selected with the
    debugging artifact still unexamined. Observed exactly this way during the
    bootstrap Stage 4 drain. blocked_by is empty, so this promotion lifts no
    blocker and cannot compound — contrast the 65.33 sum
    tactic-dispatch-test-monolith-split produced when it kept its own boost
    while being lifted. Finalized 2026-07-31 via /align-tactics: status ->
    codified, phase -> implement, boost preserved unchanged at 50 per the
    finalize contract (do not renumber at finalize time)."
phase: review
execution:
  branch: tactic-stopped-session-blocks-node
  pr: 2998
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A stopped-but-not-removed session must keep blocking its node

## Context

**The requirement** (author-stated, 2026-07-30, dispatch-pipeline bootstrap): a
session that has *stopped* but has not been `claude rm`'d must continue to block
its node's concurrent execution. Releasing the node is an explicit human act
(`claude rm <id>`), never something that happens because the session merely
finished.

**Today the system does the opposite, by design.** `claude agents --json` lists
only active sessions; `--all` additionally surfaces terminal rows (`state:
"done"`, and per the in-repo comment at
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:363`,
"done/stopped/etc"). The dispatch router's occupancy path never passes `--all`,
so a done-but-not-removed session is invisible to it: the node becomes
selectable again, a second worker is spawned onto it, and the held session — the
debugging artifact the containment doctrine exists to preserve — is never
inspected. Observed during the bootstrap Stage 4 drain: session `c0a852b4`, name
`tactic-graph-tick-node-lane-auto-merge`, deadlocked at 17:02:38Z, went `done`,
dropped out of the default listing, and the node was re-selected and re-worked
by the 18:16:09Z tick with the session still registered.

This silently voids the containment doctrine: a pass that declares neither
progression, bounded retry, nor park "has not ended", so its node should stay
frozen behind the concurrency controls. That freeze currently expires on its own
at exactly the moment the pass stops.

**Intended outcome.** The router's occupancy predicate treats *registration* —
not liveness — as the claim, so the node stays blocked until a human runs
`claude rm`. The pace budget, the spawn-registration race, and the
reservation-ledger's dead-router reclaim keep using the *active* view, because
each of those asks a genuinely different question.

### Greenfield design: two named views, never one derived from the other

The daemon registry answers two different questions, and every consumer must
name which one it is asking:

| view | query | question | consumers |
|---|---|---|---|
| **REGISTERED** | `claude agents --json --all` | "Is this node/worktree spoken for?" Registration *is* the claim; release is `claude rm`. | `worktree_has_live_session` — i.e. the node concurrency gate, worktree reuse, and worktree removal |
| **ACTIVE** | `claude agents --json` | "Is a process running right now?" | pace/concurrency budget, spawn-registration race, dead-router reservation reclaim |

Two design rules fall out, and both are load-bearing:

1. **Do not reconstruct ACTIVE from REGISTERED client-side.** A filter like
   `select(.state != "done")` guesses at the daemon's terminal-state set, which
   the repo's own comment (`lib-claude-agents.sh:363`) says is "done/stopped/etc".
   The daemon owns the definition of "active"; ask it. So the two views are two
   queries and — for the tick — two snapshots, not one snapshot plus a filter.
2. **Do not flip the shared `claude_agents_list_all` wholesale.** It also backs
   `reservation_sweep` (`.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:418`),
   whose rule (c) reclaims a marker when the *reserving* session id is no longer
   in the live set. Reserving sessions are routers (`dispatch-<short-id>`) that
   routinely go `done`. If done rows became visible there, those markers would
   be immortal, `reservation_count` would climb monotonically, and
   `LIVE_COUNT = busy_workers + reservations` (`dispatch-select-tick:640-644`)
   would pin at the ceiling and stall the whole fleet. The flip must be confined
   to the occupancy predicate.

In the fully-greenfield naming, the two accessors would be
`claude_agents_list_active` and `claude_agents_list_registered`. The existing
name `claude_agents_list_all` is actively misleading — its `_all` suffix means
*machine-wide*, **not** `--all`, and the tactic node calls it out as "a trap for
a reader skimming for the fix site".

**Brownfield migration path (what this plan executes).** The rename of
`claude_agents_list_all` → `claude_agents_list_active` is a mechanical change
across `lib-reservation-ledger.sh`, `dispatch-graph-scope-sweep`, and four test
files that stub the symbol by name — real churn, zero behavior change, and a
missed stub override fails silently. So this plan adds the REGISTERED view as a
new sibling (`claude_agents_list_registered`), switches the one occupancy
predicate onto it, and leaves `claude_agents_list_all` as the ACTIVE view under
its legacy name with an explicit disambiguating comment. The rename is
deliberately **out of scope** here and should be a separate mechanical PR; the
tactic is scoped small on purpose.

### Two design questions the tactic asks to be settled

- **Accumulation.** A `done` session blocks until a human `rm`s it, so an
  unattended fleet can accumulate permanently-blocked nodes. That is the
  intended trade: containment over throughput. **Do not add a timeout** — a
  timeout reintroduces exactly the silent expiry this work removes. The pressure
  valve is operator *visibility*: this plan emits a one-line stderr diagnostic
  naming the held session id and `claude rm <id>` as the release act, and
  `tactic-frozen-session-debug-count` (separate, in flight) supplies the
  aggregate count. Blocking + visibility + explicit human release is the
  coherent design; any one alone is incomplete. Note the blocked node does *not*
  throttle the fleet: `claude_agents_count_busy_workers` stays on the ACTIVE
  view and a `done` row is not `status == "busy"`, so held nodes are skipped
  rather than counted against the budget. Unit 3 asserts this.
- **Worktree coupling.** `claude rm <id>` deletes the session *and* its
  worktree; `stop` does not. **This plan does not rely on that coupling.**
  `worktree_has_live_session` is name-keyed on the worktree basename, so after
  `claude rm` the registry row is gone and the node unblocks regardless of
  whether the worktree survived; if the worktree went too,
  `dispatch-resolve-worktree` re-provisions it on the next selection. The
  coupling is a convenience, not a dependency — say so in the header comment.

---

## Unit 1 — Add the REGISTERED view and switch the occupancy predicate onto it

**Scope.** One file: `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`
(663 lines; sourceable helper, load-guarded by `_LIB_CLAUDE_AGENTS_LOADED`, sets
`set -uo pipefail`, functions **return**, never `exit`).

Add three functions, modeled byte-for-byte on their ACTIVE counterparts so the
UNKNOWN contract is preserved exactly:

1. `_claude_agents_raw_registered()` — sibling of `_claude_agents_raw`
   (`:199`). Reads `DISPATCH_AGENTS_SNAPSHOT_ALL` when set **and** readable
   (`cat` it, `return 0`); otherwise
   `"${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null`, returning
   that command's status. Same structure and same fallback semantics as `:199-206`.

2. `claude_agents_snapshot_capture_registered() <path>` — sibling of
   `claude_agents_snapshot_capture` (`:211-220`): same missing-argument guard
   and message shape, but `agents --json --all >"$pth" 2>/dev/null`.

3. `claude_agents_list_registered()` — sibling of `claude_agents_list_all`
   (`:438-467`), reading `_claude_agents_raw_registered` instead of
   `_claude_agents_raw`. Identical UNKNOWN handling: non-zero raw read → `return 1`;
   zero exit with empty/whitespace-only output → `return 1`; a non-array →
   `jq` `error(...)` → `return 1`. Projection is **four** tab-separated columns:
   `[.sessionId, .status, .name, .state] | @tsv`. Columns 1–3 are byte-identical
   to `claude_agents_list_all` so any awk keyed on `$1`/`$3` is unaffected;
   `.state` is appended purely for the operator diagnostic below. (`.state` is
   absent on some fakes → `null` → `@tsv` renders an empty field; that is fine
   and must not be guarded against with a `//` default, which would invent a
   value.)

Then change **`worktree_has_live_session` (`:550-585`) and nothing else**:

- `:565` — replace `if ! all=$(claude_agents_list_all); then` with
  `if ! all=$(claude_agents_list_registered); then`. The UNKNOWN → `return 0`
  (occupied, fail-safe) branch is unchanged.
- `:578-580` — the awk match is already keyed on `$3 == base || $3 == oh` with
  the `exclude_sid` skip on `$1`; leave that expression alone. Change it only to
  also capture the matched row's `$1` and `$4` so the caller can emit the
  diagnostic — e.g. have awk `print $1 "\t" $4` for the matched row and exit 0,
  with the shell capturing it. Keep the `exit`-on-first-match short-circuit and
  the `END { exit !found }` semantics.
- On a match whose captured state is exactly `done`, emit **one** line to stderr
  before `return 0`, naming the worktree, the session id, and the release act,
  e.g.:
  `lib-claude-agents: <path> held by a done-but-not-removed session <sid> — release it with 'claude rm <sid>' (a stopped session keeps blocking its node by design)`.
  Any other state (including empty) → return 0 silently, exactly as today.

Header-comment work in the same file (this is a doc-heavy library; the comments
are the contract):

- Insert a new **"ACTIVE vs REGISTERED"** section into the header block
  (near the `Tick snapshot:` paragraph at `:154-175`) stating the two views,
  which functions serve which, and the two design rules above — in particular
  *why* `claude_agents_list_all` must NOT be flipped (the `reservation_sweep`
  rule-(c) / `LIVE_COUNT` stall argument), and that its `_all` suffix means
  machine-wide, not `--all`.
- Document `DISPATCH_AGENTS_SNAPSHOT_ALL` alongside `DISPATCH_AGENTS_SNAPSHOT`
  at `:154-175`: which functions read it, that it is captured by `dispatch-tick`,
  and that unset/unreadable falls back to the live `--all` query bit-for-bit.
- Update the `claude_sessions_with_name_all` contract block at `:48-68`. Its
  "SCOPED TO THE OFFICE-HOURS SELECTOR ONLY … making `done` sessions newly
  visible there would change those decisions" (`:58-62`) is now **partly
  false**: changing that decision for `worktree_has_live_session` is exactly
  this requirement. Rewrite it to say the office-hours helpers stay on a direct
  `--all` query for **freshness** (they back the attach path and must not read a
  tick-old snapshot), and that occupancy now has its own registered view.
- Add the worktree-coupling note (`claude rm` deletes session + worktree; this
  predicate does not depend on that) and the no-timeout rule to the
  `worktree_has_live_session` contract block at `:99-118`.

**Out of scope for this unit and the whole plan** — each of these stays on the
ACTIVE view, and the reason belongs in a comment at its definition:
`claude_agents_count_busy_workers` (`:600`; a done session burns no tokens —
counting it would throttle the fleet), `claude_agents_list_all` (`:438`) and
therefore `reservation_sweep` and `dispatch-graph-scope-sweep`,
`claude_sessions_under` (`:222`) and `verify_agent_registered_under` (`:625`;
the registration race needs a *live* successor — matching a stale `done` row of
the same name would falsely report success), `claude_sessions_with_name`
(`:266`), and `live_session_claimed_nums` (`:491`; node sessions are named
`tactic-*`/`strategy-*` and match neither `^[0-9]+-` nor `^office-hours-[0-9]+$`,
so it contributes nothing on the graph lane). Also out of scope: renaming
`claude_agents_list_all`, and any change to `dispatch-graph-scope-sweep` (a
demote is a graph write, not concurrent execution).

**Recommended model.** opus — the change is small in lines but the correctness
argument is entirely about which consumer asks which question, with a
fleet-stall failure mode one call site away.

---

## Unit 2 — Capture the registered snapshot once per tick

**Scope.** One file: `.claude/skills/dispatch-propagate/scripts/dispatch-tick`,
at the `#1452` snapshot block, `:392-414`.

Today the block sources `lib-claude-agents.sh` (`:403`), captures
`claude_agents_snapshot_capture "$_SNAPSHOT_FILE"` into
`$DISPATCH_TICK_WORKSPACE/agents-snapshot.json` (`:404-406`), and on success
exports `DISPATCH_AGENTS_SNAPSHOT`; on failure it `rm -f`s the partial file,
logs one line, and leaves the variable unset so every read falls back to its
live per-call path.

Add a **second, independent** capture immediately after, with the identical
fail-safe shape:

```
_SNAPSHOT_ALL_FILE="$DISPATCH_TICK_WORKSPACE/agents-snapshot-all.json"
if claude_agents_snapshot_capture_registered "$_SNAPSHOT_ALL_FILE"; then
  export DISPATCH_AGENTS_SNAPSHOT_ALL="$_SNAPSHOT_ALL_FILE"
else
  rm -f "$_SNAPSHOT_ALL_FILE"
  echo "dispatch-tick: registered (--all) agents snapshot capture failed; occupancy checks will use live per-call reads" >&2
fi
```

Both files live under the same `mktemp -d` workspace the existing
EXIT/INT/TERM trap removes — no new cleanup. The two captures are independent:
either may fail without affecting the other. Extend the block's comment to say
the tick now issues **two** daemon queries — one per view — and why that is
correct rather than one query plus a client-side filter (Unit 1's design rule 1).

Why this unit is mandatory rather than an optimization: `worktree_has_live_session`
reaches the daemon through the snapshot whenever `DISPATCH_AGENTS_SNAPSHOT` is
set, so **without a second snapshot the Unit 1 flip is defeated inside a tick** —
the registered accessor would fall back to a live `--all` query on every probe
(correct, but hundreds of round-trips) only because it deliberately does not read
the active snapshot. Capturing the second snapshot restores one-query-per-view.

**Out of scope.** No other producer. Non-tick callers (the
`.claude/hooks/worktree-remove.sh` guard at `:83`, a manually run
`graph-select-target`) leave `DISPATCH_AGENTS_SNAPSHOT_ALL` unset and take the
live `--all` path — one extra round-trip on a cold path, which is acceptable.

**Recommended model.** sonnet — a mechanical, well-patterned addition mirroring
an adjacent block in the same file.

**Dependencies.** Unit 1 (`claude_agents_snapshot_capture_registered` must exist).

---

## Unit 3 — Tests: the `--all`-faithful fake proves the occupancy flip

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh` (643 lines;
runs under `set -euo pipefail`, sources `dispatch-test-fixture.sh` at `:6-8`,
sources the SUT at `:23`, ends with `report_results` at `:643`). Append the new
cases just before the `# <<< END MOVED <<<` marker at `:641`.

**Use the existing `--all`-faithful fake — do not extend `write_fake_claude`.**
`write_fake_claude` (`:40-53`) is argv-blind: it `cat`s the same payload
regardless of flags, so it structurally cannot express "`--all` reveals `done`
rows, no `--all` hides them" and would let a `--all`-forgetting regression pass.
The faithful fake already exists:
`office_hours_state_fake_claude` in
`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:1490-1528`
(contract comment at `:1473-1484`). It is already in scope in this file via the
`:6-8` source — no new source line. It scans **all** of argv for the literal
`--all` (not a fixed position); present → emits the full payload including
`done` rows; absent → pipes through `jq -c 'map(select(.state != "done"))'`
(`:1517-1518`). Args are `name:state[:cwd]` pairs; `sessionId` is `s-<name>`,
job `id` is `j-<name>`, `status` is `"busy"` when `state == "working"` else
JSON `null`. It exports **both** `CLAUDE_AGENTS_CMD` and
`OFFICE_HOURS_CLAUDE_CMD` (`:1527-1528`).

Quote the `:1473-1484` rationale in the new tests' own comments rather than
re-deriving it.

**Preconditions the fake needs.** It writes `$TMPDIR_TEST/bin/claude` and
`$TMPDIR_TEST/claude-payload.json`, and the fake resolves its payload as
`$(dirname "$0")/../claude-payload.json` — so the `bin/` dir must be exactly one
level under `TMPDIR_TEST`. `ca_setup` (`:28-31`) sets neither `TMPDIR_TEST` nor
`bin/`. Add a dedicated minimal pair next to it, modeled on `lock_setup` /
`lock_teardown` (`dispatch-test-fixture.sh:1546-1563`) and
`test-dispatch-project-helpers.sh:32-35`:

```
ca_all_setup()    { TMPDIR_TEST=$(mktemp -d); mkdir -p "$TMPDIR_TEST/bin"; }
ca_all_teardown() { rm -rf "$TMPDIR_TEST"; TMPDIR_TEST=""; \
                    unset CLAUDE_AGENTS_CMD OFFICE_HOURS_CLAUDE_CMD DISPATCH_AGENTS_SNAPSHOT_ALL; }
```

This is deliberately more minimal than `test-office-hours-select-target.sh:51-64`'s
setup (which also copies script/config dirs this file does not need).

Also add `unset DISPATCH_AGENTS_SNAPSHOT_ALL` to the existing `ca_teardown`
(`:33-38`) and to the fixture's global teardown at
`dispatch-test-fixture.sh:1241` (the line already unsetting
`DISPATCH_AGENTS_SNAPSHOT DISPATCH_TRACE_CACHE_DIR`), so the new export cannot
leak across tests.

**Cases to add** (each wrapped in `if … then rc=0; else rc=$?; fi` per the
file's `set -e` convention at `:16-21`, asserted with `assert_eq`):

1. **The requirement.** `mkdir -p "$TMPDIR_TEST/wt/tactic-foo"`;
   `office_hours_state_fake_claude "tactic-foo:done"`;
   `worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo"` → **occupied**.
2. **The discriminator that makes case 1 non-vacuous.** With the same fake,
   `claude_agents_list_all` returns rc 0 and stdout that does **not** contain
   `tactic-foo` — proving the fake genuinely hides the `done` row without
   `--all`, so if a future edit drops `--all` from the registered accessor,
   case 1 turns red. Assert both halves; case 1 alone would pass against an
   argv-blind fake.
3. **`claude_agents_list_registered` shape.** Same fake with a `working` row and
   a `done` row: rc 0, both names present, and the `done` row's 4th column is
   `done` while columns 1–3 match `claude_agents_list_all`'s projection for the
   working row.
4. **The fleet is not throttled by a held node.** With only
   `"tactic-foo:done"` registered, `claude_agents_count_busy_workers` returns
   rc 0 and prints `0`. This is the guard on Unit 1's "out of scope" boundary —
   containment must not consume budget.
5. **Dead-router reclaim is unaffected.** With `"dispatch-abc:done"` registered,
   `claude_agents_list_all` returns rc 0 and empty stdout — the property
   `reservation_sweep` rule (c) depends on. Comment it as the fleet-stall guard.
6. **The snapshot path.** Write a JSON array containing a `done` row named after
   the worktree basename to a temp file, `export DISPATCH_AGENTS_SNAPSHOT_ALL=<that file>`,
   point `CLAUDE_AGENTS_CMD` at a nonexistent path, and assert
   `worktree_has_live_session` still reports **occupied** — proving the
   registered accessor reads the snapshot and never falls through to the daemon
   when it is set.
7. **UNKNOWN fail-safe preserved.** `CLAUDE_AGENTS_CMD` pointing at a
   nonexistent binary with `DISPATCH_AGENTS_SNAPSHOT_ALL` unset:
   `claude_agents_list_registered` → rc 1 with empty stdout;
   `worktree_has_live_session` → **occupied**. Repeat for a fake that exits 0
   printing nothing (whitespace-only ⇒ UNKNOWN) and for one printing a
   non-array (`{}`).
8. **`exclude_sid` still applies on the registered view.** With
   `"tactic-foo:done"` (so `sessionId` is `s-tactic-foo`),
   `worktree_has_live_session "<wt>" "s-tactic-foo"` → **free**, and with no
   second argument → **occupied**. This proves the self-exclusion seam
   (`:191-213`) was not silently dropped by the switch.
9. **The `done` diagnostic.** Capture stderr from case 1 and assert it contains
   both the session id and the string `claude rm` — the operator pressure valve
   is a contract, not a nicety.

**Out of scope.** Do not modify the existing cases at `:55-213` (including the
`stopped`/`paused` occupancy cases at `:156-180`, which stay green because
`write_fake_claude` is argv-blind and returns its payload for `--all` too), and
do not port them to the new fake.

**Recommended model.** opus — the tests must be non-vacuous by construction, and
the discriminator case (2) is the whole point.

**Dependencies.** Units 1 and 2.

---

## Unit 4 — Record the doctrine in the dispatch reference

**Scope.** One file: `.claude/skills/dispatch-propagate/reference.md`. Add a
short subsection near the existing liveness/reservation prose (the
`claude agents --json` UNKNOWN / reservation-sweep paragraph ending at `:396`
and the `claude_agents_count_busy_workers` paragraph at `:399-406`) covering:

- The ACTIVE vs REGISTERED split, in one table, with the consumer list from
  Unit 1's Context table.
- The release contract: a stopped-but-not-removed session keeps blocking its
  node; the only release is `claude rm <id>`; **there is no timeout, and one must
  not be added** — a timeout reintroduces the silent expiry this work removed.
- The pressure valve: operator visibility (the per-skip stderr diagnostic here,
  plus the aggregate count `tactic-frozen-session-debug-count` delivers
  separately). Blocking + visibility + explicit human release is the design;
  any one alone is incomplete.
- The blast radius of the flip: `worktree_has_live_session` is also the guard on
  worktree removal in `dispatch-sweep` (`:398`, `:450`, `:478`) and in the
  `.claude/hooks/worktree-remove.sh` hook (`:83`), so the same change keeps the
  held worktree — the debugging artifact — from being swept. This is intended,
  and it is the half of the tactic that makes the artifact inspectable.
- The `claude rm` / worktree coupling note: the predicate does not depend on it.

**Out of scope.** No graph-node writes of any kind; no edits to
`intentions/**`. No changes to `.claude/rules/*`.

**Recommended model.** sonnet — prose against a settled design.

**Dependencies.** Unit 1.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:1490-1528`
  — `office_hours_state_fake_claude()`. The `--all`-faithful fake `claude`.
  Already implements exactly the property Unit 3 must assert; already in scope
  in `test-lib-claude-agents.sh` via its `:6-8` source. **Do not** extend
  `write_fake_claude` to add `--all` awareness — that would duplicate this
  logic a second time in-repo.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:1473-1484`
  — the fake's "`--all` FAITHFULNESS" contract comment. Cite it directly in the
  new tests rather than re-deriving the rationale.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:1546-1563`
  (`lock_setup` / `lock_teardown`) and
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-project-helpers.sh:32-35`
  — the minimal `TMPDIR_TEST=$(mktemp -d); mkdir -p "$TMPDIR_TEST/bin"` setup /
  teardown pattern to copy for `ca_all_setup` / `ca_all_teardown`.
- `.claude/skills/dispatch-propagate/scripts/test-office-hours-select-target.sh:51-64,84-95,101-111`
  — working call sites showing the `office_hours_state_fake_claude "<name>:<state>[:<cwd>]"`
  invocation shape and its preconditions.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:199-206`
  (`_claude_agents_raw`), `:211-220` (`claude_agents_snapshot_capture`),
  `:438-467` (`claude_agents_list_all`) — the three functions the new registered
  siblings must mirror structurally, including the exact UNKNOWN branches.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:309-346`
  (`claude_sessions_with_name_all`) — the proven `agents --json --all` query +
  jq-array-guard shape. `--all` is not a new capability here; only the scope of
  the occupancy path changes.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:392-414` — the
  existing `#1452` snapshot capture block, whose fail-safe shape Unit 2 mirrors
  exactly (partial-file `rm -f`, one stderr line, leave the export unset, never
  abort the tick).
- `.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh:16-21,28-38`
  — the file's `set -e`-safe `if … rc=$?` assertion convention and the existing
  `ca_setup`/`ca_teardown` pair the new pair sits beside.

## Verification

Run the four suites whose SUT this change touches, plus the two that stub the
symbols involved. `run-unit-tests.sh` auto-globs `test-*.sh` under
`.claude/skills/dispatch-propagate/scripts/` when any file in that directory
changes, so all of these run in CI on this PR; run them directly here.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-sweep.sh
```

The `worktree-remove` hook consumes `worktree_has_live_session` directly and is
wired unconditionally in CI (`.github/workflows/unit-tests.yml:248`); its fake
`claude` (`.claude/hooks/test-worktree-remove.sh:25-37`) is argv-blind, so it
must stay green unchanged — a red here means the registered accessor broke the
UNKNOWN or empty-array contract:

```verify
.claude/hooks/test-worktree-remove.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / observe-in-production checks** (these need a real daemon, so they run
with `dangerouslyDisableSandbox: true` — a sandboxed `claude agents --json`
returns `[]` indistinguishably from "no sessions", per `.claude/rules/sandbox.md`):

1. **Reproduce the two-listing disagreement** that is the defect's signature.
   With at least one done-but-not-removed session present:

   ```bash
   diff <(claude agents --json       | jq -r '.[].name' | sort) \
        <(claude agents --json --all | jq -r '.[].name' | sort)
   ```

   A non-empty diff names the sessions that were previously invisible to
   occupancy. Pick one whose name is a node id.

2. **Confirm the node is now held.** Run
   `.claude/skills/dispatch-propagate/scripts/graph-select-target --node <that-node-id>`
   and confirm it reports `live-session` on stderr and selects nothing, and that
   the new library diagnostic naming the session id and `claude rm <sid>` appears.
   Before this change the same invocation would select the node.

3. **Confirm the release act works.** `claude rm <sid>`, then re-run step 2 and
   confirm the node is selectable again. Confirm the row is gone from
   `claude agents --json --all` (not merely re-stated) — the whole design rests
   on `rm` removing the registration.

4. **Confirm the artifact survives.** With the done session still registered,
   run `.claude/skills/dispatch-propagate/scripts/dispatch-sweep` and confirm it
   logs a KEEP for that worktree rather than removing it.

5. **Confirm the fleet is not throttled** — a judgment call best made over a few
   real ticks. Watch two or three `dispatch-tick` runs with at least one held
   node present and confirm the router log's
   `router: N effective live (B busy + R reserved)` line does not include the
   held session in `B`, and that `R` is not climbing monotonically across ticks.
   A climbing `R` would mean the reservation sweep started seeing `done` rows —
   i.e. the flip leaked past `worktree_has_live_session` — and is the one
   failure mode that stalls the whole fleet.
