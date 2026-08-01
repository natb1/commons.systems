---
id: tactic-fleet-watchdogs-session-scoped
kind: tactic
statement: the two instruments that watch fleet health — the unit-poisoning
  healer and the health watcher — run as shells scoped to whichever operator
  session launched them, so they die with that session and nothing reports the
  gap; and the watcher compounds this by evaluating its session predicates over
  every registered session rather than only those in the node keyspace, so an
  ordinary human session sitting at a permission prompt trips FINDING-G, and the
  watcher exits by design and leaves the fleet unwatched
owner: ai
status: codified
parent: null
rationale: "Filed 2026-07-31 as the owed tracking node for bug-ledger rows O and
  P of the bootstrap plan, which had a detect command and an exit criterion but
  no node. Row O: neither instrument is a systemd unit, so each dies silently
  with its launching session. Four observed unwatched gaps, three of them long —
  3h on 07-30, 6.7h earlier on 07-31, and 8.2h on 07-31 between the healer
  logging `watchdog exiting; heals=23` at 07:51:41Z and a relaunch at 16:03Z.
  Nothing anywhere reports that the watcher is absent, so the absence is only
  ever discovered by an operator remembering to look, which is precisely the
  babysitting the fleet is supposed to remove. Row P: the watcher's predicates
  ran over the whole `claude agents --json --all` array. A session is only
  capable of holding a node when its name is a node id — that is what
  worktree_has_live_session keys on — so any session named anything else cannot
  be an instance of F, G, H, D or J. Without that filter the watcher flagged the
  operator's own monitoring session as FINDING-G at 14:56Z, and a separate human
  analysis session as FINDING-D/J at 15:35Z and again as FINDING-G at 16:34Z.
  Because a violation exits by contract, every spurious hit converts row P into
  a fresh instance of row O. Worth recording how the fix went wrong the first
  two times: the exclusion was bolted onto one predicate at a time, so fixing
  the terminal predicate at 15:35Z left FINDING-G to fire on the same session an
  hour later. The filter belongs at the input boundary, applied once to the
  session array, not restated per predicate. A third instance of the same class
  surfaced while diagnosing this one: `ps -eo pid,args` run under the Claude
  sandbox returns no rows at all, so the check `are the watchdogs still running`
  fails open to `they are dead` — an operator who trusts it launches a duplicate
  healer on top of a live one, and two heal loops race each other in exactly the
  way the runbook already warns about, one instance's `disable --now` killing
  the other's `start` with SIGTERM. Observed live at 16:38Z. That makes at least
  five members of one class in this pipeline — a check whose failure mode is a
  silent PASS on the signal that matters. The others on record: the Monitor tool
  under sandbox, where `claude agents --json` returns [] and a duplicate-worker
  check reports green; dispatch-reclaim-audit failing open to zero counts, owned
  by tactic-reclaim-audit-journal-unit-filter; dispatch-stop.sh parking under
  `>/dev/null 2>&1` and exiting 0 by contract, owned by
  tactic-phase-terminal-requires-disposition; and graph-commit's exit 0 not
  being evidence anything landed, which is invariant I2. Direction for planning,
  not a plan: promote both instruments to systemd user units, so that neither
  depends on an operator session existing. Scope boundary, and the reason this
  node is narrower than the instruments are today — roughly half of what the
  watcher currently polls is scaffolding standing in for fleet capabilities that
  did not exist when it was written, and those predicates migrate INTO the tick
  sweep rather than being rebuilt here. Specifically: the blocked-worker check
  is superseded by frozen_session_sweep in tactic-denied-command-parks-node,
  which is strictly better because it parks the node rather than merely
  reporting; the terminal-without-disposition and duplicate-worker checks are
  superseded by tactic-phase-terminal-requires-disposition and
  tactic-router-spawn-window-duplicate-worker; and the stranded-park-marker
  check is ELIMINATED rather than migrated, because the marker exists only as an
  artifact of the dispatch-stop.sh backstop that
  tactic-phase-terminal-requires-disposition deletes. Do not re-implement any of
  those here — the plan's architectural rule is one sweep framework with several
  predicates, and a second implementation of a predicate is the failure it
  forbids. What endures is the part no sweep can cover: a check that runs INSIDE
  dispatch-tick structurally cannot report that dispatch-tick has stopped
  running, so tick staleness, daemon liveness (dispatch-daemon-liveness exists
  as a script with a test suite and nothing whatsoever schedules it), and a
  sustained BUSY=0 stall need an observer that is not part of what it observes
  and that survives the fleet being down. The healer endures too, but as a LANE
  rather than as a bug-B fixture: a standing self-heal path for any defect whose
  permanent fix is queued, idle and no-op when nothing needs healing — as it
  should be now that tactic-sweep-timer-unit-dir-leak has merged as #2999,
  absent new findings. That lane carries a second job worth keeping explicit:
  its log is the rate signal by which a queued permanent fix is judged, since
  the heal log going quiet for a full day IS bug B's exit criterion, so the
  stopgap is also the measuring instrument for the fix that replaces it. The
  healer targets the very units it would itself live in, so a
  dispatch-heal.service must be resilient to its own ExecStart being rewritten —
  that hazard is the defect #2999 fixed, so this work is now unblocked, but the
  resilience requirement stands as a design constraint rather than a scheduling
  one. Fold in the keyspace filter as a property of whatever the watcher
  becomes, and give every such instrument the general rule this class demands:
  state explicitly what it prints when it cannot see, and never let that equal
  healthy. An instrument that cannot read its input must report UNKNOWN, not OK
  — the repo's code-style rule already says prefer clear errors over defensive
  fallbacks. Interim attention scaffolding only — tactic-attention-tier-ranking
  replaces the numeric scheme with lexicographic (tier, rank) and max-lifting,
  and tactic-attention-boost-scripts converts these boosts to tier/bug_fix
  marks."
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
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is the monitoring layer every other bug-ledger row is detected through, and
    it fails in the two worst directions available to an instrument: it
    disappears without saying so, and it reports a violation that is not one.
    Bug B's node showed what the absence costs — 23 unit-poisoning heals in a
    single overnight window were only caught because a watcher happened to be
    running. blocked_by is empty, so this promotion lifts no blocker and cannot
    compound; the one candidate blocker, tactic-sweep-timer-unit-dir-leak, is
    already phase done and therefore takes no inflow from this edge."
phase: qa
execution:
  branch: tactic-fleet-watchdogs-session-scoped
  pr: 3008
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

# tactic-fleet-watchdogs-session-scoped

## Context

Two instruments watch the dispatch fleet's health. Neither is in the repo. Both
exist only as scratch shells in an operator session's job directory:

- `/home/n8/.claude/jobs/c20b2f8d/tmp/heal-units.sh` — the unit-poisoning
  healer. A `while … sleep 60` loop with a deadline argument. Detects a
  `dispatch-heartbeat.service` / `dispatch-sweep-periodic.service` whose
  `ExecStart=` points at a vanished `/tmp/tmp.*` fixture (a test harness
  rewrote the live host units), or a unit in `failed`, and re-runs
  `ensure_sweep_timer` + `ensure_heartbeat_units` to repair it.
- `/home/n8/.claude/jobs/c20b2f8d/tmp/fleet-health-watch.sh` — the health
  watcher. A `while … sleep 300` loop that evaluates seven predicates over
  `claude agents --json --all` plus three out-of-band checks, and **exits
  non-zero on the first violation by design**.

Both die when the operator session that launched them ends. Four unwatched
gaps were observed, the longest 8.2h on 2026-07-31 (the healer's own last log
line, `2026-07-31T07:51:41Z watchdog exiting; heals=23`, to a hand relaunch at
16:03Z). Nothing anywhere reported the absence — the gap is discovered only by
an operator remembering to look, which is exactly the babysitting the fleet
exists to remove. That is bug-ledger **row O**.

The watcher compounds it. Its session predicates ran over *every* registered
session, but only a session whose `name` is a node id can hold a node — that is
what `worktree_has_live_session` keys on. So an ordinary human session sitting
at a permission prompt tripped `FINDING-G`; the watcher then exited by
contract and left the fleet unwatched. That is **row P**, and because a
violation exits, every spurious hit is a fresh instance of row O. The fix went
wrong twice by bolting the exclusion onto one predicate at a time. The filter
belongs at the input boundary, applied once to the session array.

All of this belongs to one class the pipeline keeps producing: **a check whose
failure mode is a silent PASS on the signal that matters.** Five known members,
the newest found while diagnosing this one — `ps -eo pid,args` under the Claude
sandbox returns zero rows, so "are the watchdogs running" fails open to "they
are dead," and an operator who trusts it starts a duplicate healer that races
the live one.

**Intended outcome.** Both instruments become durable `systemd --user` units
installed by the same proven `ensure_*` idiom that installs the heartbeat and
sweep timers, so neither depends on an operator session existing. Both shrink
to the checks no in-band sweep can perform. Both answer, explicitly and in
their own tests, *what do I print when I cannot see* — and that answer is never
`OK`.

### Scope boundary — half the watcher is deleted, not rebuilt

The tactic's architectural rule is **one sweep framework, several predicates**;
a second implementation of a predicate is the failure that rule forbids. These
predicates are already owned elsewhere and **must not be reimplemented**:

| watcher check today | disposition |
|---|---|
| `FINDING-G` blocked worker | owned by `frozen_session_sweep` (`lib-frozen-session-park.sh:194-479`), reached from `dispatch-tick:346-358`. Strictly better — it *parks* the node. Delete |
| `FINDING-H` live-but-idle, `FINDING-D/J` terminal-without-disposition | owned by `tactic-phase-terminal-requires-disposition`. Delete |
| `FINDING-F` duplicate worker | fixed by `tactic-router-spawn-window-duplicate-worker` (phase done). Delete — the tactic permits at most a regression canary, and this plan declines it |
| `FINDING-J` stranded park marker | **eliminated, not migrated.** The marker is an artifact of the `dispatch-stop.sh` backstop that `tactic-phase-terminal-requires-disposition` deletes. The concept ceases to exist. Delete |

What survives is the part no in-band sweep can reach — a check running *inside*
`dispatch-tick` structurally cannot report that `dispatch-tick` stopped running:

1. **tick staleness** — age of the newest line in the routing-decisions log
2. **daemon liveness** — delegate to `dispatch-daemon-liveness`, which already
   exists with a test suite and which **nothing whatsoever schedules today**
3. **sustained `BUSY=0`** — the fleet has sessions but none are working
4. **auto-merge suppression** — `dispatch-select-tick` suppresses fan-out on a
   red episode, silently

Shrinking is the expected outcome, not a regression. Note the consequence for
row P: the predicates that fired spuriously are precisely the ones being
deleted, so row P closes mostly by deletion. Only the `BUSY=0` predicate reads
the session array at all, and the keyspace filter is still built once at that
input boundary — because the next predicate added must inherit it for free.

### Two rulings from `strategy-graph-native-dispatch` that are hard requirements

These are recorded clarifications on the serving strategy, ratifying this
node's office-hours park (2026-07-31). They are not optional and they are the
main reason this plan is larger than "write two unit files":

**ALARM SURFACE.** An out-of-band fleet instrument's finding lands as a
**find-or-create graph node**, reusing the proven `dispatch-diagnose-main` /
`tactic-main-red-<shortsha>` pattern — *never journald alone*. A journald-only
instrument has no counter, no hold, no park and no operator surface, which is
the exact defect class these instruments exist to close. **An UNKNOWN reading
lands a node too**, not only a positive finding: silence on an unreadable input
is indistinguishable from a healthy fleet. That clause is the load-bearing half
of the ruling.

**NEVER FLEET-HALT.** These instruments are explicitly excluded from tripping
the correlated-dead-claims breaker. They report; they do not halt the fleet.
Wiring fleet non-progression into a breaker scoped to something else would
convert an instrument false-positive into a total dispatch outage — and every
instrument in this pipeline has so far shipped with a silent-failure mode, so a
false halt is the likelier outcome than a true one.

**PAUSE.** Tick-staleness and sustained-`BUSY=0` stay **quiet** during a
standing pause (during a pause `dispatch-tick` exits before
`dispatch-select-tick` runs, so both would otherwise fire continuously through
a supported operating mode and train the author to ignore them).
Daemon-liveness does **not** go quiet — a paused fleet still has a live daemon.
All pause-sensitive checks read the live pause mechanism through **one shared
helper**. The live mechanism is the sentinel file at
`${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused`
(`dispatch-tick:291-292`), **not** a `dispatch.config/*.json` field — that field
does not exist in the repo and its owning node
`tactic-dispatch-pause-config-field` is `status: raw` / `phase: null`. Routing
every instrument through one helper makes the eventual migration a single edit.
**The fail-closed default is inverted for instruments**: for a *gate*, an
unreadable pause state reading as "paused" is safe (it declines to dispatch);
for an *instrument* it is not — silencing on an unreadable input is exactly the
silent-PASS failure this work exists to close. So an unreadable pause state
reports UNKNOWN and **still emits**.

### Design: greenfield vs. what this plan lands

**Ideal greenfield.** Both instruments are declared as home-manager systemd
user units alongside `dispatch-claude-daemon.service`
(`nix/home/claude-code.nix:77-105`), and no test harness is ever capable of
writing the host unit directory — every suite is sealed behind a
`DISPATCH_*_UNIT_DIR` seam. In that world the *healer does not need to exist*:
nothing poisons a unit, so nothing needs repairing. The health watcher stays,
because tick staleness and daemon death are real conditions independent of
poisoning.

**Why this plan does not land the greenfield form.** A nix-declared unit is
re-asserted only at generation-switch time; it is not immune to a running test
harness rewriting the on-disk unit file, which is the precise defect the healer
exists for. The bash `ensure_*` idiom re-asserts on **every reseed tick**, so
for these two units it is genuinely the more resilient mechanism today, and it
is already the repo's proven, tested shape with stale-unit self-heal
(`cleanup_stale_unit_pair`, landed by `tactic-sweep-timer-unit-dir-leak` as
#2999 — which also removes this tactic's former blocker, since the hazard of
the healer's own `ExecStart` being rewritten is now covered). The tactic also
requires keeping the healer as a **standing lane**, not a bug-B fixture: its
log is the rate signal by which a queued permanent fix is judged (bug B's exit
criterion is the heal log staying quiet for a full day), so the stopgap is also
the measuring instrument for the fix that replaces it.

**Explicitly out of scope**, with reasons: (a) declaring either unit in
`nix/home/claude-code.nix` — it would fight the `ensure_*` writer for ownership
of the same file path, and picking a winner is a separate decision; (b)
retiring the healer; (c) any change to `dispatch-tick`'s own pause gate at
`dispatch-tick:291-292` (fail-closed is correct for a gate); (d) migrating the
four superseded predicates into the tick sweep — their owning tactics do that;
(e) rebuilding a duplicate-worker canary.

---

## Units of work

### Unit 1 — `lib-pause-state.sh`: the single tri-state pause reader

**Scope.** New file
`.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh`, following the
per-concern `lib-*.sh` convention already used by `lib-decision-log.sh`,
`lib-standdown-recheck.sh`, and `lib-frozen-session-park.sh` (load guard
`_LIB_PAUSE_STATE_LOADED`, `set -uo pipefail` inside the guard, functions
return and never `exit`).

Export one function, `dispatch_pause_state()`, printing exactly one of three
tokens on stdout and returning 0 in all three cases (the token, not the exit
code, is the contract — a caller that reads only `$?` must not be able to
mistake `unknown` for `not-paused`):

- `paused` — the sentinel file exists.
- `not-paused` — a definite negative: either the state directory does not
  exist at all (dispatch never ran here, so there is definitely no sentinel),
  or it exists, is searchable, and the sentinel is absent.
- `unknown` — the state directory exists but cannot be searched (e.g. mode
  `000`), so the sentinel's presence cannot be determined.

Resolve the sentinel path exactly as `dispatch-tick:291-292` does:
`DISPATCH_PAUSE_FLAG="${DISPATCH_PAUSE_FLAG:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused}"`.
Reuse that variable name so a test or operator override applies uniformly.

Carry a header comment stating: this helper is the single read point for pause
state across every out-of-band instrument; when
`tactic-dispatch-pause-config-field` lands, this file is the one edit that
migrates them all; and the tri-state exists because for an *instrument* an
unreadable pause state must surface as UNKNOWN and still emit, unlike a gate,
which fails closed.

**Out of scope.** Editing `dispatch-tick`'s own `-e` check to route through
this helper. That is a gate, its fail-closed default is correct, and changing
it is a separate behavioral decision.

Also add `.claude/skills/dispatch-propagate/scripts/test-lib-pause-state.sh`
following the shape of the existing suites in this directory: `set -euo
pipefail`, `FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"`, `source
"$FIXTURE_DIR/dispatch-test-fixture.sh"` (which supplies `SCRIPT_DIR`,
`assert_eq`, `PASS`/`FAIL`/`TOTAL`, and `report_results` —
`dispatch-test-fixture.sh:18,32-50`), ending in `report_results`. Cases:
sentinel present → `paused`; state dir present and sentinel absent →
`not-paused`; state dir absent entirely → `not-paused`; state dir present but
`chmod 000` → `unknown` (skip this case with a recorded PASS when the suite
runs as root, where mode bits do not deny).

**Recommended model.** sonnet

---

### Unit 2 — `dispatch-fleet-alarm`: the find-or-create graph alarm writer

**Scope.** New executable script
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm`. This is the
shared alarm surface both instruments write through, satisfying the ALARM
SURFACE ruling. It is deliberately a separate script — the same
script-per-concern convention `dispatch-graph-main-red-sync` cites in its own
header — so both instruments reuse one node-authoring path and one test suite.

**CLI.**

```
dispatch-fleet-alarm --kind <kind> --statement <text> --body-file <path>
dispatch-fleet-alarm --resolve --kind <kind>
dispatch-fleet-alarm -h|--help
```

`--kind` is validated against a **closed enum**:
`tick-stale`, `daemon-degraded`, `busy-stall`, `automerge-suppressed`,
`watch-unknown`, `heal-fired`, `heal-unknown`. Anything else exits 64.

**Node id: `tactic-fleet-alarm-<kind>`.** The id is stable per condition kind,
so find-or-create is idempotent: one open node per ongoing condition, its body
refreshed on re-detection, closed when the condition clears. Guard the id shape
with an anchored regex built from the enum — never a bare `startsWith` prefix
test. This is the exact lesson recorded at `dispatch-graph-main-red-sync:52-58`,
where a bare `tactic-main-red-` prefix test matched an unrelated hand-authored
node and mechanically auto-completed it.

**Find-or-create, per `.claude/skills/dispatch-diagnose-main/SKILL.md:84-218`.**
Classify with a `node --import tsx/esm -e '…'` one-liner calling `readNode` from
`./packages/intentionsutil/src/store.js` — `phase === "done" || office_hours
!== null` ⇒ `closed`; a throw ⇒ `absent`; otherwise `open`. `readNode` reads
only frontmatter, so classification never touches the body.

- **absent / closed** ⇒ mint fresh. Build the node JSON to a temp file, land it
  through `npx tsx packages/intentionsutil/scripts/write-node.ts --file <path>`
  (the single validation gate), then splice the body over the generated `#
  <statement>` placeholder with the two-fence awk idiom
  (`SKILL.md:178-187`), then
  `packages/intentionsutil/scripts/graph-commit -C "$REPO_ROOT" -m "graph: fleet alarm <kind>" "$id"`.
  No `--base` — there is nothing to compare against.
- **open** ⇒ re-detection. Capture a CAS token with
  `npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir <tmp> "$id"`
  (it prints the manifest path). Extract the on-disk body with
  `awk 'p; /^---$/{c++; if(c==2) p=1}'`, `cmp -s` it against the fresh body,
  and **skip the commit entirely when they match** — a re-detection that finds
  the same condition must not churn a no-op commit. On a real diff, splice and
  land with `graph-commit --base <manifest>`.

**Node JSON shape** (every field the tactic schema validates, with its correct
value — do not leave any to runtime guessing):

```json
{
  "id": "tactic-fleet-alarm-<kind>",
  "kind": "tactic",
  "statement": "<the --statement text>",
  "owner": "ai",
  "status": "raw",
  "parent": null,
  "serves": ["strategy-autonomous-execution"],
  "recovers": [],
  "rationale": "Auto-created by dispatch-fleet-alarm from an out-of-band fleet instrument reading. See the body for the reading.",
  "reading": null,
  "gap": null,
  "clarifications": [],
  "tooling_goals": [],
  "success_signal": null,
  "attention": null,
  "phase": null,
  "execution": null,
  "validates": [],
  "blocked_by": [],
  "office_hours": null,
  "pace_exempt": true,
  "rounds": null,
  "attributes": {}
}
```

Field notes: `serves: ["strategy-autonomous-execution"]` — that strategy's
success signal is what needs a liveness observable, as `dispatch-daemon-liveness`
states in its own header (lines 6-11). `success_signal: null` deliberately —
these nodes are not registered in `read-sensors.ts`, and inventing a sensor
name that drifts from the registry would make `deriveGap` never resolve them.
`attention: null` — rank is inherited through `serves`, never machine-injected.
`pace_exempt: true` — a fleet-down finding must not be pace-gated.
`phase: null` + `status: raw` + `execution: null` is the draft shape, so the
finding enters the backlog as work exactly like a `tactic-main-red-*` node.

**`--resolve`.** Complete an open `tactic-fleet-alarm-<kind>` node to
`phase: "done"` when its condition has definitively cleared, so alarms do not
accumulate. Copy the completion recipe at `dispatch-graph-main-red-sync:95-160`
verbatim in structure, including its three load-bearing guards:

1. **Only when `execution` is null.** A node past draft with a live execution is
   an in-flight fix owning its own lifecycle; mechanical completion must never
   preempt it.
2. **Capture `git rev-parse "origin/main:intentions/<id>.md"` BEFORE mutating.**
   A node absent from `origin/main` at that instant is a hard refusal — with no
   landed blob there is nothing to roll back to, and mutating anyway leaks a
   dirty file that trips `graph-commit`'s clean-tree assertion.
3. **On any failure, restore the file from that blob first, then log.** Never
   swallow the failure with `|| true` — emit a greppable stderr diagnostic.

Use `dump-node.ts` → `jq '.phase = "done"'` → `write-node.ts --file` →
`graph-commit --base <manifest>`.

**`--resolve` never fires on an UNKNOWN reading.** Only a definite clear
resolves; UNKNOWN leaves the node open, by construction.

**Repo resolution.** Resolve `REPO_ROOT` from the script's own location
(`SCRIPT_DIR/../../../..`), the same convention as
`dispatch-graph-main-red-sync:44-46`, and pass it to `graph-commit -C`
explicitly. `write-node.ts` and `dump-node.ts` resolve `intentions/` from
`import.meta.url`, **not cwd**, so the copies invoked must be the ones inside
the checkout being mutated — running the script from a stale worktree would
write that worktree's store.

**Exit codes.** `0` alarm landed (or a no-op no-diff re-detection, or a resolve
with nothing open); `1` the graph write failed after retries — log loudly, and
the caller degrades to journald-only for that pass while still reporting the
graph-write failure itself in its own output; `64` usage/unknown kind; `69`
environment error (missing `node`/`npx`/`git`).

`graph-commit` exit 0 is not evidence anything landed (this is invariant I2 and
a named member of the silent-PASS class). After a successful commit, verify by
re-reading the node's blob on `origin/main` and comparing it to the local
`git hash-object -- intentions/<id>.md`; a mismatch is exit 1, not exit 0.

**Never fleet-halt.** This script writes exactly `intentions/<id>.md` for its
own alarm id and nothing else. It must not write `blocked_by` on any other
node, must not touch the pause sentinel, and must not write `office_hours` on
any node.

**Tests** — new `test-dispatch-fleet-alarm.sh`, same fixture shape as Unit 1.
Because the write path needs a real git remote, follow the dependency-injection
style already used by `test-dispatch-daemon-liveness.sh:1-40` and
`test-graph-commit.sh`: expose `DISPATCH_FLEET_ALARM_GRAPH_COMMIT_CMD`,
`DISPATCH_FLEET_ALARM_WRITE_NODE_CMD`, `DISPATCH_FLEET_ALARM_DUMP_NODE_CMD`,
and `DISPATCH_FLEET_ALARM_INTENTIONS_DIR`, and stub all three commands with
recording shell scripts. Cases: unknown `--kind` ⇒ exit 64 and no write; absent
node ⇒ `write-node.ts --file` called with the exact JSON shape above and
`graph-commit` called **without** `--base`; open node with an identical body ⇒
**no** `graph-commit` invocation at all; open node with a differing body ⇒
`graph-commit --base <manifest>` invoked; `--resolve` on a node with non-null
`execution` ⇒ no write; `--resolve` when the node is absent from `origin/main`
⇒ refusal with a non-empty stderr diagnostic and a clean tree; a `graph-commit`
stub exiting 0 while the post-write blob comparison mismatches ⇒ script exits
1, not 0.

**Recommended model.** opus

**Dependencies.** none

---

### Unit 3 — `dispatch-heal-units`: the healer as a one-shot

**Scope.** New executable script
`.claude/skills/dispatch-propagate/scripts/dispatch-heal-units`. This is
`heal-units.sh` rewritten as a **single pass** — the `while … sleep 60` loop
and its `DEADLINE` argument are deleted, because the timer in Unit 5 owns the
cadence and a loop that ends is precisely row O.

**Detect.** Poisoned when any managed unit's `ExecStart=` line matches
`/tmp/tmp\.`, or when `systemctl --user is-failed --quiet <unit>` is true, over
the unit set: `dispatch-heartbeat.service`, `dispatch-sweep-periodic.service`,
`dispatch-heal.service`, `dispatch-fleet-watch.service`.

**Heal.** `cd` to the main worktree, `source
.claude/skills/dispatch-propagate/scripts/lib.sh`, and run **all five**
installers in order: `ensure_recover_unit`, `ensure_sweep_timer`,
`ensure_heartbeat_units`, `ensure_healer_units`, `ensure_watcher_units` (the
last two added in Unit 5). Then `systemctl --user reset-failed` the set.

The scratch original wrapped that block in `>/dev/null 2>&1`, which is the
silent-PASS class at the fix site. **Do not.** Capture each installer's return
code and stderr and emit them to stdout/stderr (journald captures both under
the unit).

**Cross-healing topology — state it in the header.** The healer repairs the
watcher's unit and its own; the healer's own unit is additionally re-asserted
on every reseed tick by the Unit 5 call-site wiring
(`dispatch-schedule-reseed:408-418`,
`dispatch-schedule-convergence-reseed:199-208`). So no unit depends solely on
itself for repair. That is what satisfies the tactic's "resilient to its own
`ExecStart` being rewritten" constraint.

**UNKNOWN, never OK.** If the unit directory is unreadable, or `systemctl` is
not executable, or `lib.sh` fails to source, the script must **not** report a
clean pass. It emits an `heal-unknown` alarm via
`dispatch-fleet-alarm --kind heal-unknown` with a body naming what could not be
read, and exits 2. A `grep` returning no matches because the directory is
unreadable is indistinguishable from a healthy directory — probe readability
explicitly before trusting the negative.

**Alarm and rate signal.** On a heal, emit `dispatch-fleet-alarm --kind
heal-fired` with a body carrying: the timestamp, each poisoned unit and its
prior `ExecStart` value, and each installer's return code. On a clean pass,
call `dispatch-fleet-alarm --resolve --kind heal-fired` (and `--resolve --kind
heal-unknown`), so a quiet healer closes its own alarm. Log one line per pass
to journald in the exact shape `dispatch-reclaim-audit` mines for rates
(`dispatch-reclaim-audit:19-35`): a stable prefix on stdout so
`journalctl --user -t dispatch-heal-units` yields a countable event stream.
Record in the header that this log is bug B's exit-criterion instrument — the
heal log staying quiet for a full day is the criterion — so the lane is kept
even when it falls silent.

**Env seams** (mirroring `DISPATCH_SWEEP_TIMER_UNIT_DIR` /
`DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD` at `lib.sh:2772,2775`):
`DISPATCH_HEAL_UNIT_DIR`, `DISPATCH_HEAL_SYSTEMCTL_CMD`,
`DISPATCH_HEAL_MAIN_WORKTREE`, `DISPATCH_HEAL_ALARM_CMD`. Every one of these is
required for the suite to run without touching host systemd state.

**Exit codes.** `0` nothing to heal; `1` healed (a finding); `2` UNKNOWN;
`64` usage; `69` environment error.

**Tests** — new `test-dispatch-heal-units.sh`. Cases: clean units ⇒ exit 0, no
installer invoked, `--resolve` called; poisoned `ExecStart=/tmp/tmp.XXXX/…` ⇒
exit 1, all five installers invoked, `--kind heal-fired` alarm invoked with the
prior `ExecStart` in its body; `is-failed` true with clean `ExecStart` ⇒ same
heal path; unreadable unit dir ⇒ exit 2 and `--kind heal-unknown`, and
assert it does **not** exit 0; an installer returning non-zero ⇒ its return code
appears in the emitted output (proving the output is not suppressed).

**Recommended model.** sonnet

**Dependencies.** Unit 2 (invokes `dispatch-fleet-alarm`). Unit 5 supplies
`ensure_healer_units`/`ensure_watcher_units`; until Unit 5 lands, guard those
two calls with `declare -f … >/dev/null 2>&1` so the script is
independently testable — and keep the guard, since it matches the
conditional-source idiom already used at `dispatch-tick:296-353`.

---

### Unit 4 — `dispatch-fleet-watch`: the watcher as a one-shot, reduced to four checks

**Scope.** New executable script
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch`. This replaces
`fleet-health-watch.sh` and is **much smaller** than it: the loop, the deadline
argument, the `SELF_IDS` exclusion, and the four superseded session predicates
(`FINDING-F`, `-G`, `-H`, `-D/J`, `-J`) are all deleted. Deleting them is the
work; do not port them.

**Evaluate all four predicates, always. Never exit on the first violation** —
exiting early is row O's mechanism.

Each predicate returns one of three verdicts: `clear`, `finding`, or `unknown`.

1. **tick staleness.** Age of the newest line in the routing-decisions log.
   Resolve the path exactly as `lib-decision-log.sh:68` does —
   `${DISPATCH_DECISION_LOG_FILE:-${DISPATCH_DECISION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/routing-decisions.jsonl}`
   — so the test override seam already documented at `lib-decision-log.sh:45-52`
   works here for free. Threshold `DISPATCH_FLEET_WATCH_TICK_MAX_AGE`, default
   `1500` seconds. A missing/unreadable log, an unparseable last line, or a
   `.ts` that will not parse ⇒ `unknown`, **not** `clear`. Quiet under pause.
2. **daemon liveness.** Delegate to
   `"$SCRIPT_DIR/dispatch-daemon-liveness"` — do not reimplement cgroup
   classification. Map its documented exit codes
   (`dispatch-daemon-liveness:23-33`): `0` managed-live ⇒ `clear`; `2`
   transient-substituting, `3` down, `4` degraded ⇒ `finding` (carry the verdict
   string and `degraded_reason` from `--json` into the alarm body); `69` or any
   other code ⇒ `unknown`. **Not quiet under pause** — a paused fleet still has
   a live daemon.
3. **sustained `BUSY=0`.** Source `lib-claude-agents.sh` and call
   `claude_agents_count_busy_workers` (`lib-claude-agents.sh:1022-1050`). It
   already applies the node-keyspace filter
   (`test("^[0-9]+-|^tactic-|^strategy-")`, line 1042) and already returns 1 for
   UNKNOWN rather than 0 — reuse it rather than writing a `jq` pass. Because
   this pass is a one-shot with no memory, persist `busy_zero_since` (epoch
   seconds) in a small state file at
   `${DISPATCH_FLEET_WATCH_STATE_FILE:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/fleet-watch-state.json}`.
   Transitions: count > 0 ⇒ clear the timestamp, verdict `clear`; count == 0 ⇒
   set the timestamp if unset, and verdict `finding` once the elapsed span
   exceeds `DISPATCH_FLEET_WATCH_IDLE_LIMIT` (default `2700` seconds), else
   `clear`; helper returns 1 (UNKNOWN) ⇒ **leave the timestamp unchanged** —
   neither reset nor advanced, since UNKNOWN is not evidence of zero — and
   verdict `unknown`. Quiet under pause, and a paused pass clears the timestamp
   so the pause window does not count toward the stall span.
4. **auto-merge suppression.** Call
   `"$SCRIPT_DIR/dispatch-graph-main-red-sync"`. Per its own header
   (`dispatch-graph-main-red-sync:22-36`): non-empty stdout is the set of open
   `tactic-main-red-*` nodes, the literal `UNKNOWN` means the graph read failed,
   and it **always exits 0** — so branch on stdout, never on `$?`. Empty ⇒
   `clear`; `UNKNOWN` ⇒ `unknown`; a node id set ⇒ threshold-gated: record
   first-seen-suppressed in the same state file and report `finding` only after
   `DISPATCH_FLEET_WATCH_SUPPRESSION_LIMIT` (default `21600` seconds / 6h).
   A short red episode is normal and already has its own
   `tactic-main-red-<sha>` node; alarming on every one is exactly the
   train-the-author-to-ignore-it failure. Not quiet under pause.

**Keyspace filter at the input boundary.** Only predicate 3 reads the session
array, and it reads it through a helper that already filters. Nonetheless build
the filtered array **once**, in one place, and hand it to whatever reads it:
capture one snapshot per pass with `claude_agents_snapshot_capture`
(`lib-claude-agents.sh:~360`) exported as `DISPATCH_AGENTS_SNAPSHOT`, so a
future fifth predicate inherits both the single query and the filter without
restating either. Record in the header *why*: the exclusion was bolted onto one
predicate at a time and recurred; the filter is a property of the input, not of
any single test.

**Pause.** Source `lib-pause-state.sh` (Unit 1) and call `dispatch_pause_state`
**once** per pass. `paused` ⇒ predicates 1 and 3 return `quiet` (not evaluated,
not reported, and 3 clears its timestamp); 2 and 4 evaluate normally.
`unknown` ⇒ **all four evaluate and emit**, each tagged `pause=unknown`, and
the pass additionally emits a `watch-unknown` finding naming the unreadable
pause state. Silencing on an unreadable input is the failure being fixed.

**Reporting.** Per pass:

- Human-readable summary on stdout (journald captures it) — one line per
  predicate with its verdict, plus the pause state. Never print a bare `ok`
  when any predicate is `unknown`.
- For each `finding`: `dispatch-fleet-alarm --kind <kind> --statement … --body-file …`
  where kind is `tick-stale` / `daemon-degraded` / `busy-stall` /
  `automerge-suppressed`.
- If **any** predicate is `unknown`: `dispatch-fleet-alarm --kind watch-unknown`
  with a body naming every unreadable input and why. This is the load-bearing
  half of the ALARM SURFACE ruling.
- For each predicate that is definitively `clear`:
  `dispatch-fleet-alarm --resolve --kind <kind>`. A `quiet` (paused) predicate
  resolves nothing; an `unknown` resolves nothing.

**Never fleet-halt.** The script must not write the pause sentinel, must not
call `dispatch-stop`, and must not write `blocked_by` or `office_hours` on any
node. Add a doctrine-ratchet assertion in the test file: `grep` the script and
fail if it contains a write to `$DISPATCH_PAUSE_FLAG`, any `office_hours`
literal, or any `blocked_by` literal.

**Exit codes.** `0` every evaluated predicate `clear`; `1` at least one
`finding`; `2` at least one `unknown` and no `finding`; `64` usage; `69`
environment error. `--json` emits the full per-predicate reading (mirroring
`dispatch-daemon-liveness --json`) for a human running it by hand.

**Tests** — new `test-dispatch-fleet-watch.sh`, dependency-injecting every
external command the way `test-dispatch-daemon-liveness.sh:1-40` does:
`DISPATCH_FLEET_WATCH_LIVENESS_CMD`, `DISPATCH_FLEET_WATCH_REDSYNC_CMD`,
`DISPATCH_FLEET_WATCH_ALARM_CMD`, `CLAUDE_AGENTS_CMD`,
`DISPATCH_DECISION_LOG_FILE`, `DISPATCH_PAUSE_FLAG`,
`DISPATCH_FLEET_WATCH_STATE_FILE`. Cases:

- all four clear ⇒ exit 0, four `--resolve` calls, zero `--kind` calls;
- fresh decision log but liveness stub exiting 3 ⇒ exit 1, exactly one
  `--kind daemon-degraded`, and the other three still evaluated (assert the
  script did not stop at the first violation — this is the row-O regression
  guard, and it is the single most important case in this file);
- stale decision log while the pause sentinel is present ⇒ tick-stale is quiet,
  exit 0, no `tick-stale` alarm;
- pause directory `chmod 000` ⇒ every predicate still evaluated and a
  `watch-unknown` alarm emitted (assert exit is **not** 0 with a bare `ok`);
- `claude` stub exiting non-zero (UNKNOWN busy count) with a pre-set
  `busy_zero_since` ⇒ timestamp unchanged in the state file, verdict `unknown`,
  `watch-unknown` alarm, and **no** `busy-stall` alarm and **no** `--resolve`;
- `busy_zero_since` older than the limit with busy count 0 ⇒ `busy-stall`
  finding; a subsequent pass with busy count 2 ⇒ timestamp cleared and
  `--resolve --kind busy-stall`;
- red-sync stub printing `UNKNOWN` ⇒ `unknown`, not `clear`, and no
  `--resolve --kind automerge-suppressed`;
- red-sync stub printing one node id, first pass ⇒ no alarm (under threshold);
  same stub with a state-file first-seen older than the limit ⇒
  `automerge-suppressed` finding;
- the doctrine-ratchet greps above.

**Recommended model.** opus

**Dependencies.** Units 1 and 2.

---

### Unit 5 — `ensure_healer_units` / `ensure_watcher_units`, call-site wiring, host-guard extension

**Scope.**

**(a) `lib.sh`.** Add two installer functions and their stale-cleanup wrappers,
placed next to their siblings. Model them on `ensure_sweep_timer`
(`lib.sh:2734-2916`) — copy its structure, not just its idea:

1. Four path guards up front, before any write, rejecting a `main_worktree`
   containing a newline, a space, a double-quote, or a backslash, each with its
   own `WARNING:` line and `return 1` (`lib.sh:2742-2769`). Best-effort
   contract: warn to stderr and return non-zero, **never** `exit` — these run
   from tick/reseed launchers.
2. `Environment="PATH=$(strip_unit_env_path "$PATH")"` (`lib.sh:2533-2546`).
   The systemd user manager's default PATH omits the nix store, so without this
   the units cannot resolve `git`, `jq`, `node`, `npx`, or `claude` — and the
   alarm writer needs all of them.
3. `ExecStart="…"` and `Environment="…"` double-quoted; `WorkingDirectory=` the
   **bare** path (it does not unescape quotes — a quoted value makes the path
   non-absolute and systemd rejects the unit as bad-setting; see the comment at
   `lib.sh:2789-2799`).
4. `SyslogIdentifier=dispatch-heal-units` / `SyslogIdentifier=dispatch-fleet-watch`
   on each `.service`, so `journalctl --user -t <id>` is a stable rate source.
   This is the `-t` (SYSLOG_IDENTIFIER) vs `-u` (_SYSTEMD_UNIT) distinction
   `dispatch-reclaim-audit:19-30` documents — a `-u` match silently drops
   events, which is a silent PASS.
5. `SuccessExitStatus=1 2` on `dispatch-fleet-watch.service` (and `1 2` on
   `dispatch-heal.service`) so a **finding** or an **UNKNOWN** does not latch
   the unit into `failed` — findings are reported via the graph node and the
   journal, and a latched-failed unit would then be "healed" by the healer in a
   pointless loop. Only a genuine internal error (exit 69, or a signal) marks
   the unit failed.
6. Byte-for-byte content compare on **both** files **plus** `is-active` on the
   timer as the hot-path early return (`lib.sh:2833-2841`).
7. Call the stale-cleanup wrapper **before** the rewrite and **after** the hot
   path (`lib.sh:2845`).
8. Atomic write per file: `mktemp` in the same directory, `printf`, `mv`, with a
   `WARNING:` + `return 1` on each failure (`lib.sh:2852-2891`).
9. **Unconditional** `daemon-reload` on the slow path, outside both write blocks
   — the reason is spelled out at `lib.sh:2893-2903` and is load-bearing: a
   reload that failed on a prior call leaves the files on disk but unknown to
   systemd, and the content compare would then skip the write blocks forever.
10. `enable --now <timer>` (the timer, never the oneshot).
11. Env seams named for the unit, exactly mirroring `lib.sh:2772,2775`:
    `DISPATCH_HEALER_UNIT_DIR` / `DISPATCH_HEALER_SYSTEMCTL_CMD` and
    `DISPATCH_WATCHER_UNIT_DIR` / `DISPATCH_WATCHER_SYSTEMCTL_CMD`.

`cleanup_stale_healer_units` and `cleanup_stale_watcher_units` are thin
wrappers over `cleanup_stale_unit_pair` (`lib.sh:2675-2701`), exactly like
`cleanup_stale_sweep_units` (`lib.sh:2709-2733`) — do not duplicate the
sed/compare/disable logic.

**Unit content.**

```
# dispatch-heal.service
[Unit]
Description=Dispatch systemd-unit poisoning healer (timer-triggered)

[Service]
Type=oneshot
SuccessExitStatus=1 2
SyslogIdentifier=dispatch-heal-units
Environment="PATH=<sanitized>"
ExecStart="<main_worktree>/.claude/skills/dispatch-propagate/scripts/dispatch-heal-units"
WorkingDirectory=<main_worktree>
```

```
# dispatch-heal.timer
[Unit]
Description=Dispatch unit-poisoning healer timer

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
Unit=dispatch-heal.service

[Install]
WantedBy=timers.target
```

`dispatch-fleet-watch.service` / `.timer` are identical in shape, with
`SyslogIdentifier=dispatch-fleet-watch`, `ExecStart` pointing at
`dispatch-fleet-watch`, and `OnBootSec=3min` / `OnUnitActiveSec=5min` (matching
the scratch watcher's 300s cadence, and staggered off the healer so the two do
not fire together). Deliberately **no** `[Install]` on either `.service` — the
`.timer` pulls the oneshot in via `Unit=`. Deliberately **no** `Persistent=` —
it only affects `OnCalendar=` timers and is a no-op for monotonic triggers
(`lib.sh:2823-2825`).

**(b) Call-site wiring.** Add `ensure_healer_units "$MAIN_WORKTREE" || true` and
`ensure_watcher_units "$MAIN_WORKTREE" || true` immediately after the existing
`ensure_heartbeat_units` call in both launchers:
`dispatch-schedule-reseed:408-418` and
`dispatch-schedule-convergence-reseed:199-208`. The `|| true` matches the
existing best-effort posture there. This is what re-asserts the healer's own
unit on every reseed, closing the "who heals the healer" loop.

**(c) Host-guard extension** — the `tactic-sweep-timer-unit-dir-leak` (#2999)
lesson, and the reason it must not be skipped: without it, a suite that forgets
a seam silently rewrites the developer's live host units, which is bug B itself.
Extend `DISPATCH_HOST_UNIT_FILES` at `dispatch-test-fixture.sh:101-108` with
`dispatch-heal.service`, `dispatch-heal.timer`,
`dispatch-fleet-watch.service`, `dispatch-fleet-watch.timer`, and update the
comment above it (currently naming only the three existing installers). The
`dispatch-*` glob at `dispatch-test-fixture.sh:121` already catches the new
entries in the entry-set fingerprint; the explicit list is what fingerprints
their `WorkingDirectory=`.

**(d) Tests.** Add sections to the **existing**
`test-lib-systemd-units.sh` — not a new file. That file is the post-monolith-split
home for every `ensure_*` / `cleanup_stale_*` test, and one framework with
several suites is the same rule this tactic enforces elsewhere. Mirror the
`ensure_heartbeat_units` sections (which begin at
`test-lib-systemd-units.sh:231` and export
`DISPATCH_HEARTBEAT_UNIT_DIR` / `DISPATCH_HEARTBEAT_SYSTEMCTL_CMD` per test into
an `mktemp -d` sandbox). Cases per new installer: cold path writes both files and
runs `daemon-reload` + `enable --now`; hot path with byte-identical files and an
active timer is a no-op; `WorkingDirectory=` is bare and absolute (no leading
`"`); `SuccessExitStatus=1 2` and `SyslogIdentifier=` are present; each of the
four path guards (newline, space, quote, backslash) returns non-zero, emits a
`WARNING:`, and writes **no** file; `cleanup_stale_*` disables on a changed
`WorkingDirectory=`, does not disable on a matching one, returns 0 with no prior
unit, and returns 0 with a `[Service]` section lacking `WorkingDirectory=`.
Keep the closing `report_results` call as the file's last line.

**Recommended model.** sonnet

**Dependencies.** Units 3 and 4 — the `ExecStart` targets must exist and be
executable before the units are installed.

---

## Reuse

Reuse these; do not re-derive them.

- `.claude/skills/dispatch-propagate/scripts/lib.sh:2533-2546` —
  `strip_unit_env_path`. PATH sanitizer for `Environment=` lines (newline,
  double-quote, backslash). Use verbatim for both new units.
- `lib.sh:2675-2701` — `cleanup_stale_unit_pair`. The single implementation
  behind both existing stale-cleanup wrappers; compares installed
  `WorkingDirectory=` against the current main worktree and best-effort
  `disable --now`s before the caller rewrites. Wrap it; never copy it.
- `lib.sh:2709-2733` — `cleanup_stale_sweep_units`. The thin-wrapper shape to
  copy for the two new wrappers.
- `lib.sh:2734-2916` — `ensure_sweep_timer`. The direct template for both new
  installers: path guards, sanitized PATH, quoting rules, byte-for-byte +
  `is-active` hot path, stale cleanup, atomic `mktemp`+`mv`, unconditional
  `daemon-reload`, `enable --now`, and the `DISPATCH_*_UNIT_DIR` /
  `DISPATCH_*_SYSTEMCTL_CMD` seam names at lines 2772 and 2775.
- `lib.sh:2963-2994` and `lib.sh:2995+` — `cleanup_stale_heartbeat_units` /
  `ensure_heartbeat_units`. The sibling pair; consult for the `KillMode=` and
  `OnFailure=` idioms if either new unit needs them.
- `.claude/skills/dispatch-propagate/scripts/dispatch-daemon-liveness:1-278` —
  the already-built, already-tested daemon liveness sensor, with a four-verdict
  exit-code enum documented at lines 23-33 and an explicit no-silent-pass
  posture. **Nothing schedules it today.** Unit 4 is its first caller. Do not
  reimplement cgroup classification.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-daemon-liveness.sh:1-40` —
  the `DISPATCH_LIVENESS_*` command-injection test style (`$systemctl_cmd`
  idiom). Mirror it for every external command the new scripts call.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1022-1050` —
  `claude_agents_count_busy_workers`. Already keyspace-filtered (line 1042) and
  already UNKNOWN-on-failure. The `BUSY=0` predicate calls this, not its own
  `jq`.
- `lib-claude-agents.sh:~349-400` — `claude_agents_snapshot_capture` /
  `DISPATCH_AGENTS_SNAPSHOT`. One daemon query per pass, reused by every
  predicate.
- `lib-claude-agents.sh:16-260` — the repo-wide UNKNOWN fail-safe contract
  ("every accessor returns real data or exit 1/UNKNOWN; callers fold UNKNOWN
  toward the safe direction"). The watcher's "what do I print when I cannot
  see" answer models on this, not on new semantics.
- `lib-claude-agents.sh:1138-1170` — `claude_agents_list_blocked_workers`, and
  `lib-frozen-session-park.sh:194-479` — `frozen_session_sweep`. **Reference
  only, to confirm the FINDING-G predicate is already owned.** Deleting the
  watcher's copy is the work; re-implementing it is forbidden.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync` —
  invoked by Unit 4 for the auto-merge-suppression predicate (stdout protocol
  and always-exit-0 contract at lines 22-36); and its node-completion loop at
  lines 95-160 is the verbatim structural model for `--resolve`, including the
  execution-null guard, the pre-mutation `origin/main` blob capture, the
  per-iteration rollback, and the anchored-id lesson at lines 52-58.
- `.claude/skills/dispatch-diagnose-main/SKILL.md:84-218` — the find-or-create
  graph-node alarm recipe: `readNode` classification, the absent/open/closed
  cases, the `write-node.ts --file` → awk body-splice → `graph-commit` mint
  path, and the `dump-node.ts` → `cmp -s` → `graph-commit --base` re-detection
  path with its skip-the-no-op-commit rule.
- `packages/intentionsutil/scripts/write-node.ts` (`--file`),
  `dump-node.ts` (`--out-dir`, prints the manifest path),
  `graph-commit` (`-C <repo>`, `-m <msg>`, `--base <manifest>`) — the only
  sanctioned graph write path. Both `.ts` scripts resolve `intentions/` from
  `import.meta.url`, not cwd.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:291-292` — the
  canonical pause-sentinel path expression, copied into Unit 1.
- `dispatch-tick:296-353` — the `declare -f <fn> >/dev/null 2>&1 || source
  lib-X.sh` conditional-source idiom, plus its loud-failure-instead-of-swallow
  posture. Use it wherever the new scripts source a lib.
- `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:45-52,68` —
  `DECISION_LOG_FILE` resolution and the `DISPATCH_DECISION_LOG_FILE` /
  `DISPATCH_DECISION_LOG_DIR` test overrides, used by the tick-staleness
  predicate.
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:19-35` —
  the `journalctl -t <SYSLOG_IDENTIFIER>` vs `-u` rate-source reasoning and the
  just-landed "never render an unmeasurable sweep as zero" discipline (commit
  `a7b9ddcc`). The worked example for what an instrument prints on an
  unmeasurable input.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:18,32-50`
  (`SCRIPT_DIR`, `assert_eq`, `report_results`) and `:97-180` (the host-systemd
  leak guard, `DISPATCH_HOST_UNIT_FILES`, `dispatch_host_systemd_guard_check`).
- `.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh` — the
  single home for all `ensure_*` / `cleanup_stale_*` tests. New sections go
  here.
- `nix/home/claude-code.nix:77-105` — `dispatch-claude-daemon.service`. Read as
  the reference for the greenfield alternative discussed in Context; **not**
  edited by this plan.
- `intentions/tactic-sweep-timer-unit-dir-leak.md` (phase done, PR #2999) — the
  closest prior art. Its two-unit split (seal the test seams; add
  `cleanup_stale_*` and wire it in before the content-diff early return) is the
  template Unit 5 follows.

---

## Verification

Run every suite below from the worktree root.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-pause-state.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-heal-units.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/lib-pause-state.sh \
        .claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm \
        .claude/skills/dispatch-propagate/scripts/dispatch-heal-units \
        .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch \
        .claude/skills/dispatch-propagate/scripts/lib.sh
```

```verify
test -x .claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm && \
test -x .claude/skills/dispatch-propagate/scripts/dispatch-heal-units && \
test -x .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch && \
echo "PASS: all three new scripts are executable"
```

The executable-bit check is not decoration: a non-executable `ExecStart` target
makes the unit fail `203/EXEC` at fire time, which is the exact failure mode
bug B produced.

**CI wiring — do nothing.** All five suites live in
`.claude/skills/dispatch-propagate/scripts/`, and so do all their SUTs.
`run-unit-tests.sh:88,190` sets `RUN_PR_SCRIPTS=true` on any changed path under
that directory and then globs `test-*.sh` there, so these suites run
automatically. Do **not** add them to `.github/workflows/unit-tests.yml`: that
file's unconditional list (lines 197-260) exists specifically for suites whose
SUT lives *outside* that scripts directory, and the comment at lines 198-206
says so.

**Lint.** `lint-prose-rules.sh` (run via `run-lint.sh` in CI) mechanically
rejects net-new `echo "$VAR" | jq` in committed `.sh` files. Every JSON read in
these scripts must use `jq <<<"$var"`, `printf '%s' "$var" | jq`, or a direct
pipe — see `.claude/rules/shell-json.md`. The new scripts are heavy JSON
consumers, so this will fire if ignored.

### Manual verification on the host (after merge)

These are observe-in-production steps; none is auto-runnable, and all require
`dangerouslyDisableSandbox: true` — a sandboxed `systemctl` reaches no user
manager and a sandboxed `ps` returns zero rows, which is the very
fails-open-to-dead trap this tactic records.

1. Trigger unit installation: run `dispatch-schedule-reseed` (or wait for the
   next reseed), then confirm all four new files exist under
   `~/.config/systemd/user/` and that `systemctl --user list-timers` shows
   `dispatch-heal.timer` and `dispatch-fleet-watch.timer` armed with a next-fire
   time.
2. Confirm the survival property — the exit criterion's first half. Note the
   healer's `MainPID`, end the operator session that triggered installation, and
   confirm after the next timer interval that both units still fire
   (`systemctl --user show dispatch-heal.service -p NRestarts -p ExecMainStartTimestamp`).
   A reboot is the stronger form of the same check.
3. Confirm the journald rate source:
   `journalctl --user -t dispatch-heal-units -o short-iso --since -1h` yields
   this pass's lines. If it is empty while
   `journalctl --user -u dispatch-heal.service` is not, the
   `SyslogIdentifier=` is wrong — the `-t` vs `-u` trap.
4. Confirm the alarm surface end-to-end. Poison a unit deliberately
   (`sed -i 's|^ExecStart=.*|ExecStart="/tmp/tmp.deadbeef/x"|' ~/.config/systemd/user/dispatch-sweep-periodic.service && systemctl --user daemon-reload`),
   wait one healer interval, then confirm: the unit is repaired, a
   `heal-fired` journal line exists, and `intentions/tactic-fleet-alarm-heal-fired.md`
   is present on `origin/main` with the prior `ExecStart` in its body. After the
   next clean pass, confirm the node's `phase` is `done`.
5. Confirm UNKNOWN never reads as healthy — the load-bearing half of the alarm
   ruling. Run `dispatch-fleet-watch` by hand with `DISPATCH_DECISION_LOG_FILE`
   pointed at a nonexistent path: the output must name the unreadable input,
   the exit code must be 2, and a `tactic-fleet-alarm-<kind>` node (kind
   `watch-unknown`) must land. If it prints `ok`, the unit is broken in
   exactly the way this tactic exists to fix.
6. Confirm pause behavior against the live mechanism. With
   `~/.local/share/commons-dispatch/paused` present and a deliberately stale
   decision log, confirm tick-staleness stays quiet while daemon-liveness still
   evaluates. Then `chmod 000` the `commons-dispatch` directory and confirm the
   pass still emits, tagged `pause=unknown`. Restore the directory mode
   afterward.
7. Confirm never-fleet-halt by inspection: after several passes, confirm no node
   other than a `tactic-fleet-alarm-*` id was written
   (`git log --oneline --name-only -20 -- intentions/`), that the pause sentinel
   is unchanged, and that `dispatch-select-tick` still fans out normally.
8. Confirm row P is closed. With an ordinary human session running under a
   non-node name (anything not matching `^[0-9]+-|^tactic-|^strategy-`), sitting
   at a permission prompt, confirm `dispatch-fleet-watch` reports it in no
   predicate and lands no alarm. The predicates that used to flag it should not
   exist in the script at all — `grep -c 'FINDING-' dispatch-fleet-watch` must
   return 0.
9. Retire the scratch instruments once the units are confirmed live: kill the
   running `bash /home/n8/.claude/jobs/c20b2f8d/tmp/heal-units.sh` process and
   do not relaunch either scratch script. Two heal loops racing is a documented
   hazard — one instance's `disable --now` cancels the other's `start`. Verify
   the process is gone with `ps` run **unsandboxed**; a sandboxed `ps` returns
   nothing and would falsely confirm.

## needs-main residue

Filed by `/qa-fix` pass 1 on PR #3008. This item is a planned deferral — its
own acceptance criterion, as documented above, is non-assertable at merge
time and is verified downstream against the deployed host/main, per the
disposition workflow (class: `needs-main`).

### Item 7 — Host-level timer wiring behaves under real systemd

- **URL path:** current
- **Expected outcome:** `dispatch-heal.timer` and `dispatch-fleet-watch.timer`
  install, enable, fire, and complete cleanly on the real operator host; both
  instruments survive their launching operator session ending; the healer
  genuinely un-poisons a deliberately poisoned unit; the watcher's alarm
  graph-nodes read as legible/actionable.
- **Finding:** real host systemd state, real timer firing across multiple
  intervals, and the "are these alarms actually useful" judgment cannot be
  asserted at merge time from a scratch env-seamed script run. The PR body's
  own Verification section scopes "Manual host verification" out of this PR
  and defers it to this node's own "Manual verification on the host (after
  merge)" checklist (9 numbered steps, above): unit install via
  `dispatch-schedule-reseed`, session-end survival, the `-t` vs `-u` journald
  rate-source check, an end-to-end alarm-surface run via deliberate
  poisoning, the UNKNOWN-never-healthy check via an unreadable pause dir,
  live pause-state behavior, never-fleet-halt via `git log` inspection, row-P
  closure, and retiring the two scratch shell instruments still running
  under `/home/n8/.claude/jobs/c20b2f8d/tmp/`. All of it requires
  `dangerouslyDisableSandbox` and un-sandboxed `systemctl`/`ps`, and several
  steps (session survival, multi-interval firing) cannot complete inside a
  single QA session at all.

**Script-verifiable QA (pass 1) covered instead, all PASS:** all three new
scripts executable/syntax-clean; both one-shot instruments run with no
required args and never touch the real host unit directory when fully
env-seamed; the pause tri-state reader returns `unknown` (not `not-paused`)
on an unsearchable sentinel directory, and the watcher propagates that
`unknown` rather than silencing it; a multi-fault run confirmed the watcher
evaluates all four predicates and does not exit early on the first violation
(the row-O regression guard); grep across all four new/touched files found no
write path onto `blocked_by`, `office_hours`, or the pause sentinel other than
an alarm node's own initial field values; the host-unit-leak test-fixture
guard lists all four new unit filenames and the systemd-units suite (109/109)
leaves the real host directory byte-identical before/after.
