---
id: tactic-graph-router-live-worker-read-robust
kind: tactic
statement: The router's live-worker read tolerates an empty or partial `claude
  agents --json` result — a momentary undercount neither inflates spawn headroom
  nor lets the per-node occupancy check skip a node that already has a live
  worker — closing the duplicate-dispatch path that put two /implement workers
  on one node and one worktree
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-21: a manual dispatch tick launched a SECOND
  /implement worker for tactic-primary-checkout-main-guard while a worker was
  already live in that node's worktree — `claude agents --json` showed two busy
  sessions (pids 139471, 164656) sharing one checkout. The tick's fan-out
  printed `live=1` though at least 6 workers were live (the immediately-prior
  tick alone had launched 6). Root cause (code read): dispatch-select-tick's
  --manual branch computes LIVE_COUNT = claude_agents_count_busy_workers +
  reservation_count (dispatch-select-tick:684-686), and the downstream per-node
  occupancy exclusion (worktree_has_live_session) reads the SAME `claude agents
  --json` source. That read is known-unreliable: the daemon Unix socket is
  blocked under sandbox and returns an empty `[]` indistinguishable from a
  genuine no-sessions result (see .claude/rules/sandbox.md, `claude agents
  --json` section), and sessions.json is roughly 50% stale. A single
  empty/partial read therefore both inflates HEADROOM (MAX_WORKERS-1 →
  over-spawn) AND makes the per-node check miss the already-live worker, so a
  top-ranked node gets dispatched twice. This complements
  tactic-graph-router-live-worker-visibility (the --standalone
  lock+headroom+claim cycle, PR #2918): that closes the missing-lock /
  missing-headroom path for external manual/emulated callers; this hardens the
  underlying live-worker READ that BOTH the count and the per-node dedup trust,
  so an undercount cannot defeat the fleet count or the per-node occupancy
  exclusion even through the locked daemon path. blocked_by that tactic so it
  lands on top of the --standalone mode rather than racing it. Author-directed
  2026-07-21: filed as a new dependent tactic (not folded into the mid-QA
  router-visibility node) and boosted to top rank."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 10
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: demoted from the pre-bootstrap 85-90
    band to 10. These are ordinary improvements, not integrity defects; at 85-90
    they outranked strategy-main-health (101 resolved) and flooded the selector
    hot band. Interim scaffolding only; tactic-attention-tier-ranking and
    tactic-attention-boost-scripts retire this numeric scheme."
  tier: 1
phase: main-qa
execution:
  branch: tactic-graph-router-live-worker-read-robust
  pr: 3010
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-03T22:01:11Z
    mergeCommitSha: dd56eb369aa6cfad23cc2219686ea1e747383c5f
    graphCommitSha: null
validates: []
blocked_by:
  - tactic-graph-router-live-worker-visibility
office_hours:
  reason: "Awaited event not yet occurred: a dispatch-select-tick cold start
    against a genuinely idle fleet (empty claude agents --json array), which
    would exercise Unit 1's corroboration probe against the real daemon/process
    table for the first time in production. Checked journalctl --user -t
    dispatch-tick since the 2026-08-03T22:01:11Z merge through 2026-08-04T03:46Z
    (~5h45m): 8 tick runs 22:01-23:46 UTC (~15min cadence), each emitting a
    normal 'graph <count> node:kind:phase ...' decision line, zero occurrences
    of concurrency-cap or live-read-unverified in that window. But every sampled
    tick found the fleet already busy (implement/qa/review/align-tactics/main-qa
    work continuously in flight across many nodes) -- no tick observed a truly
    empty live-worker set, so the probe path this item watches for was never
    confirmed exercised. No tick activity 23:46-03:46 (this /qa-main session was
    the outstanding spawn from the last tick). Re-check after the fleet next
    drains to zero live workers between ticks (e.g. an overnight/low-activity
    window) and grep the same window for live-read-unverified."
  since: 2026-08-04
  recommendation: "No author decision needed -- re-selection only, once a
    genuinely idle-fleet cold start has occurred post-merge. Lane-M commands
    run: journalctl --user -u 'dispatch-tick*' --since '2026-08-03 22:01:00' (0
    entries -- dispatch-tick is not a systemd timer unit, it's spawned
    per-cycle); journalctl --user -t dispatch-tick --since '2026-08-03 22:01:00'
    | grep -E 'graph [0-9]+ |concurrency-cap' (8 normal graph-decision lines, no
    concurrency-cap); journalctl --user --since '2026-08-03 22:01:00' | grep -iE
    'concurrency-cap|live-read-unverified' (0 matches). Result category: healthy
    tick activity throughout the observed window, no regression signal, but the
    specific idle-fleet cold-start scenario this item names has not yet
    occurred."
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---

# The router's live-worker read tolerates an empty/partial `claude agents --json` so a momentary undercount never inflates headroom or skips the per-node occupancy check

## Context

On 2026-07-21 a manual dispatch tick launched a **second** `/implement` worker for
`tactic-primary-checkout-main-guard` while a worker was already live in that node's
worktree — two `claude` sessions editing one checkout. The tick's fan-out line printed
`live=1` while at least six workers were live.

Root cause: every dispatch-admission decision trusts one point-in-time read of
`claude agents --json`, and that read has an ambiguity it cannot see. When the caller
cannot reach the Claude daemon's Unix socket — the documented sandboxed case
(`.claude/rules/sandbox.md`, "claude agents --json") — the command **exits 0 and prints
`[]`**, byte-identical to a genuine "no live sessions" answer. Every existing UNKNOWN
guard in `lib-claude-agents.sh` keys on a *hard* failure (non-zero exit, whitespace-only
output, non-array JSON). A successfully-parsed **empty array** sails through all of them
as a definite zero.

That one bad sample compounds across four consumers, verified against current
`origin/main`:

1. `claude_agents_count_busy_workers`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1023`) returns `0`,
   so `LIVE_COUNT = BUSY + RESV` is undercounted and `HEADROOM = MAX_WORKERS − LIVE_COUNT`
   is inflated (`dispatch-select-tick:644-647` autonomous, `:743-745` manual).
2. `claude_agents_list_all` (`lib-claude-agents.sh:632`) returns success with zero rows, so
   `reservation_sweep` (`lib-reservation-ledger.sh:524`) sees an empty live set and rule (c)
   **reclaims outstanding markers** — the `RESV` term collapses too. *Both* terms of
   `LIVE_COUNT` are destroyed by the same read, which the node body's original diagnosis
   did not record.
3. `claude_agents_list_registered` (`lib-claude-agents.sh:675`) returns zero rows, so
   `worktree_has_live_session` (`:798`) reaches its `return 1` at `:877` — "definitely
   free". Its fail-safe branch at `:874` only covers hard failures, so the per-node
   occupancy exclusion in `graph-select-target:684` skips nothing.
4. `claude_session_id_is_live` (`lib-claude-agents.sh:895`) resolves `absent` → `return 1`,
   so the landed stand-down protocol concludes the *winner* is dead and stands the wrong
   session down.

`dispatch-spawn-job`'s Step 2 dedup (`dispatch-spawn-job:261-282`) is the documented
"last-line defense", and it is genuinely independent in one respect — it queries
`claude_sessions_under` **live**, bypassing the tick snapshot. But it consumes the same
ambiguous read, so it too was defeated on 2026-07-21.

**Intended outcome.** A successfully-parsed *empty* registry read is treated as a definite
answer only when a socket-independent probe corroborates that the daemon is visible to
this process; otherwise it folds into the **existing** UNKNOWN contract. Because two of
the four consumers already fail closed on UNKNOWN (occupancy → "occupied"; sweep →
"reclaim nothing"), the fix lands almost entirely at the read boundary. The remaining
half — `dispatch-select-tick` / `graph-select-target` deliberately failing **open** on
UNKNOWN (`GAP` stays 1 / `TOP` clamps to 1) — is flipped to a conservative deferral. A
conservative miss costs one deferred tick; the permissive miss costs a duplicate worker on
a shared worktree.

Out of scope (owned elsewhere): the `--standalone` lock/headroom/claim cycle itself
(`tactic-graph-router-live-worker-visibility`, PR #2918, landed); the after-the-fact
duplicate detection in `claude_agents_list_duplicate_node_names` / `dispatch-standdown`;
the office-hours lane's own occupancy gate
(`office-hours-select-target:334-340`, via `claude_sessions_with_name_all`);
`graph-select-target`'s non-numeric `--max` / `TARGET_N` config-read fail-opens
(`graph-select-target:352-356,373-377`) — a config-read failure is a different failure class.

**File-class constraint (load-bearing for execution).** Every edit below is confined to
`.claude/skills/dispatch-propagate/scripts/**`. Do **not** edit any `SKILL.md`,
`.claude/hooks/**`, or `.claude/rules/**` file as part of this work: an autonomous
(auto-mode) worker's *commit* of those paths is denied by the self-modification
classifier, while sibling scripts/tests under `.claude/skills/**/scripts/` commit
normally. All contract documentation goes in the scripts' own header comments.

---

### Unit 1 — Corroborate an empty registry read at the `lib-claude-agents.sh` read boundary

**Scope.** Single file: `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`.

Add two new pieces inside the existing `_LIB_CLAUDE_AGENTS_LOADED` guard (which begins at
`:338`), placed next to `_claude_agents_raw` (`:350`) / `_claude_agents_raw_registered`
(`:380`):

1. `claude_agents_registry_reachable` — a socket-independent probe: return 0 when at least
   one `claude daemon` process is visible to this process, else 1. Implement with
   `"${CLAUDE_AGENTS_PGREP_CMD:-pgrep}" -f 'claude daemon'`, discarding stdout, keying only
   on exit status. This mirrors, and must stay consistent with, the technique and the
   command-injection idiom already used by
   `.claude/skills/dispatch-propagate/scripts/dispatch-daemon-liveness:69,150`
   (`PGREP_CMD="${DISPATCH_LIVENESS_PGREP_CMD:-pgrep}"`,
   `DAEMON_PATTERN="claude daemon"`, `"$PGREP_CMD" -f "$DAEMON_PATTERN"`). Use a **separate**
   env var (`CLAUDE_AGENTS_PGREP_CMD`) — do not reuse `DISPATCH_LIVENESS_PGREP_CMD`; the two
   are independent seams and coupling them would make one suite's fixture silently steer the
   other's SUT.

   **Do not memoize the probe result.** It runs only on the empty-array path (a busy fleet
   never reaches it), so the cost is a single `pgrep` on an idle machine, and a cached
   verdict would go stale across a daemon start and break test isolation within one shell.

2. `_claude_agents_empty_read_is_definite <raw-json>` — the classifier. Return 0 (definite,
   proceed) when the whitespace-stripped raw payload is **not** exactly `[]`; when it *is*
   exactly `[]`, return whatever `claude_agents_registry_reachable` returns. Test the raw
   payload, never the projected TSV: `claude_sessions_under`'s `--cwd` filter and
   `claude_sessions_with_name`'s client-side jq both legitimately project zero rows from a
   non-empty array, so keying on the projection would flip healthy reads to UNKNOWN.

Apply the classifier at exactly five call sites — immediately **after** the existing
whitespace-only guard and before/alongside the jq projection, so the probe runs *after* the
`claude agents` invocation. That ordering is load-bearing: the Claude bg supervisor daemon
is spawned **on demand by the first `claude` call** (see `dispatch-spawn-tick:47-52`), so
probing before the query would report "no daemon" on a genuinely idle host and defer
forever; probing after it means the query itself has already started the daemon whenever it
could reach one.

- `claude_sessions_under` (`:408`, guards at `:420-428`) → `return 1` (UNKNOWN).
- `claude_agents_list_all` (`:632`, guards at `:639-646`) → `return 1`.
- `claude_agents_list_registered` (`:675`, guards at `:683-690`) → `return 1`.
- `claude_agents_count_busy_workers` (`:1023`, guards at `:1030-1035`) → `return 1`.
- `claude_session_id_is_live` (`:895`, guards at `:910-916`) → **`return 0` with
  `CLAUDE_SESSION_ID_LIVE_STATE="unknown"`** — this function's UNKNOWN fold is inverted by
  design ("UNKNOWN folds to LIVE", `:889-891`). Do not copy the `return 1` from the others.

Emit exactly one stderr diagnostic per unverified classification, naming the remedy —
e.g. `lib-claude-agents: empty 'claude agents --json' result could not be corroborated (no
'claude daemon' process visible); treating as UNKNOWN. Run unsandboxed (dangerouslyDisableSandbox)
and check dispatch-daemon-liveness.` Without it a deferral is indistinguishable from an idle
fleet in the tick log.

Leave unchanged, and say so in the header: `claude_sessions_with_name`,
`claude_sessions_with_name_all`, `claude_sessions_with_name_prefix_all`,
`claude_job_id_for_name_all`, `claude_agents_count_held_for_debug`,
`claude_agents_list_duplicate_node_names` (the last is covered transitively — it reads
through `claude_agents_list_all` at `:967`). Also leave
`claude_agents_snapshot_capture` / `_capture_registered` (`:359`, `:389`) alone: an
uncorroborated `[]` snapshot is classified on every read, so refusing to *write* it would
only force hundreds of live round-trips per tick without changing any verdict.

**Test changes** in `.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh`
(baseline today: 182/182 pass) and the shared fixture:

- Default the probe to "daemon visible" so existing `write_fake_claude '[]' 0` cases keep
  their meaning (the fake daemon *is* answering, so a visible daemon is the consistent
  world). Two seams need it: `ca_setup` (`test-lib-claude-agents.sh:28-31`, add the stub
  alongside `CA_FAKE`, and `unset CLAUDE_AGENTS_PGREP_CMD` in `ca_teardown` at `:33-41`),
  and the shared `setup()` in
  `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` next to its existing
  `export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"` (`:333`), which 118 suites source.
  The stub is a 2-line script that exits 0.
- New cases: for each of the five hardened functions, an empty `[]` payload with an
  *unreachable* probe (stub exiting 1) yields that function's UNKNOWN, and with a *reachable*
  probe yields today's definite answer; `worktree_has_live_session` reports **occupied**
  under an uncorroborated `[]`; a **non**-empty array with an unreachable probe is still a
  definite answer (the probe must not gate healthy reads); `claude_sessions_under` on a
  `--cwd`-filtered empty result with a reachable probe still returns 0 with no rows.

**Recommended model.** opus.

---

### Unit 2 — Flip the selectors from fail-open to conservative deferral on UNKNOWN

**Scope.** Two files. No new decision-line vocabulary — reuse `concurrency-cap`, which
`dispatch-tick` and the notification suppression at `lib.sh:3434` already route correctly.

**`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`**

- Autonomous branch: the `if BUSY=$(claude_agents_count_busy_workers); then … fi` at
  `:644-708` has no `else`; the fall-through is documented at `:709`
  (`# daemon UNKNOWN (busy-worker read failed) → GAP stays 1 (fail open).`). Add an `else`
  that mirrors the existing at-cap path at `:700-705`: `release_lock`, run
  `"$SCRIPT_DIR/dispatch-schedule-reseed" 1>&2 || true`, set
  `DLOG_DISPOSITION="concurrency-cap"` and `DLOG_SKIP_REASON="live-read-unverified"`, echo a
  one-line operator diagnostic to stderr, `echo "concurrency-cap"`, `exit 0`. Replace the
  `:709` comment with the new rationale.
- Manual branch: same shape for the `if BUSY=…` at `:743-792` whose fall-through comment sits
  at `:793-794`. Mirror the **manual** exhausted path at `:765-772` instead: `release_lock`,
  **no** reseed (a manual run is one-shot; the autonomous chain owns reseeds),
  `DLOG_DISPOSITION="concurrency-cap"`, `DLOG_SKIP_REASON="manual-live-read-unverified"`,
  `echo "concurrency-cap"`, `exit 0`.
  This deliberately **overrides** the human-dispatch-is-sovereign floor-of-1 documented at
  `:711-719,787-789`. Record why in the comment: sovereignty is an override of a *known*
  ceiling, not a licence to spawn while blind — and the human's remedy is legible
  (re-run unsandboxed), unlike a silent duplicate worker.
- Leave the `NODE_ARG` branch (`:796-812`) alone: it never reads the daemon for headroom, so
  it has no fail-open to flip. Its downstream guards (`graph-select-target --node`'s
  occupancy check, `dispatch-spawn-job` Step 2) are both hardened by Unit 1.

**`.claude/skills/dispatch-propagate/scripts/graph-select-target`**

- The `--standalone` headroom block's terminal `else` at `:397-399`
  (`else (( TOP > 1 )) && TOP=1`) is the busy-read-UNKNOWN fail-open. Replace it with the
  concurrency-cap disposition already used at `:378-384`: set
  `DISPOSITION="live-read-unverified"`, echo the stderr diagnostic, `echo "empty"`,
  `exit 0`. The EXIT trap releases the lock (`:381-382`). `DISPOSITION` is free-form JSONL
  log data (`lib-decision-log.sh` validates nothing), and stdout stays the documented
  `empty` line, so no consumer changes.
- Update the block's header comment at `:315-321`, which currently states all four
  environmental reads "fail OPEN … converges on the same fail-open floor, TOP=1": the daemon
  read no longer does. Leave the `MAX_WORKERS` / `TARGET_N` non-numeric branches
  (`:352-356`, `:373-377`) failing open — different failure class, out of scope.

**Test changes.**
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh` (baseline 182/182,
**unsandboxed only** — see Verification) and
`.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` (baseline 51/51).
Reuse the existing hard-failure fixture — `dispatch-test-fixture.sh:333` points
`CLAUDE_AGENTS_CMD` at a non-executable path so `claude agents --json` exits non-zero — to
drive UNKNOWN end-to-end. Assert: autonomous tick emits `concurrency-cap` and arms the
reseed; manual tick emits `concurrency-cap` and does **not** arm it; neither spawns;
`graph-select-target --standalone` prints exactly `empty`. Add a paired
uncorroborated-empty-`[]` case (fake `claude` printing `[]` + `CLAUDE_AGENTS_PGREP_CMD` stub
exiting 1) — that is the incident's actual shape, and it must reach the same deferral.
The existing tests at `test-graph-select-target.sh:421,462` assert the *config*-read
fail-opens; they must stay green untouched.

**Dependencies.** Unit 1.

**Recommended model.** sonnet.

---

### Unit 3 — Lock in the downstream guarantees and correct the header contract

**Scope.** Regression coverage for the two consumers Unit 1 hardens transitively, plus the
contract prose that currently instructs future authors back into the bug.

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-spawn-job.sh` (baseline 86/86):
  add a case where `claude agents --json --cwd <path>` returns `[]` with an unreachable
  probe — Step 2 (`dispatch-spawn-job:267-270`) must print `deduped`, exit 0, and spawn
  nothing. This is the "last-line defense" the 2026-07-21 incident bypassed; it needs a test
  that fails without Unit 1.
- `.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh` (baseline
  78/78): add a case where the same uncorroborated `[]` reaches `reservation_sweep` — it must
  take the `claude_agents_list_all` UNKNOWN branch (`lib-reservation-ledger.sh:526-530`,
  "reclaiming nothing") and leave every marker intact, so `reservation_count` does not
  collapse alongside the busy count.
- `.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh` (baseline 83/83)
  or `test-lib-claude-agents.sh`: assert an uncorroborated `[]` makes
  `claude_session_id_is_live` report `live` with
  `CLAUDE_SESSION_ID_LIVE_STATE=unknown`, not `absent`.
- Header contract rewrite in `lib-claude-agents.sh`, all inside the top comment block:
  - `:158-166` — `claude_agents_count_busy_workers`' contract currently reads "Callers that
    gate on the count should **fail open** (proceed to spawn) — the per-worktree dedup inside
    `dispatch-spawn-job` is the last-line defense." Both halves are now false: callers defer,
    and that dedup was never independent (it consumed the same read). Replace with the
    conservative contract and name the 2026-07-21 incident.
  - `:104-146` — `worktree_has_live_session`'s block: state that an empty registry read is
    UNKNOWN unless corroborated, so "definitely no live session" now means "the daemon
    answered *and* was corroborated visible".
  - Add a short "Empty-read corroboration" section next to the existing "Sandbox" note
    (`:330-334`): the `[]`-vs-blocked-socket ambiguity, the after-the-query probe ordering and
    why it is load-bearing, the `CLAUDE_AGENTS_PGREP_CMD` seam, and the explicit list of
    functions NOT classified.
- Also correct `dispatch-select-tick:590-592`, whose autonomous-gate prose still says
  "Daemon UNKNOWN … → fail open (GAP=1); the per-worktree dedup in dispatch-spawn-job is the
  last-line defense."

Add **no** operator escape hatch (no `DISPATCH_ALLOW_UNVERIFIED_AGENTS_READ`-style
override): an env var that restores the permissive read restores the defect, and the correct
remedy — run the tick unsandboxed on the host — is already what the diagnostic says.

**Dependencies.** Units 1 and 2.

**Recommended model.** sonnet.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-daemon-liveness:54,69,150` — the
  socket-independent daemon census technique (`pgrep -f "claude daemon"`, injected via
  `DISPATCH_LIVENESS_PGREP_CMD`) and its stated rationale at `:39-44` ("the sandbox's network
  namespace blocks the daemon socket, so a sandboxed `claude agents` query returns `[]`
  indistinguishable from 'no sessions' … systemd unit state and `/proc/<pid>/cgroup` are
  readable facts that do not depend on the daemon answering"). Unit 1's corroborator is the
  minimal form of this; do not re-derive it and do not shell out to the full script (its
  `systemctl`/`loginctl` reads and its `degraded` verdict are irrelevant here).
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:885-895` —
  `CLAUDE_SESSION_ID_LIVE_STATE` / `claude_session_id_is_live`: the established pattern for
  folding a multi-valued daemon verdict into a fail-safe boolean while publishing the
  granular value. Unit 1's classifier follows the same shape.
- `lib-claude-agents.sh:798-878` (`worktree_has_live_session`) and
  `lib-reservation-ledger.sh:524-530` (`reservation_sweep`) — both already fail closed on
  UNKNOWN. Fold the new ambiguity into their existing UNKNOWN input rather than editing
  either predicate; their name-matching / `exclude_sid` / office-hours-key logic must not be
  touched.
- `dispatch-spawn-job:261-282` — the Step 2 dedup already issues a **live**,
  snapshot-bypassing `claude_sessions_under` and already fails closed on UNKNOWN. That is
  the "partial / stale-snapshot" half of this tactic's statement, already positioned at the
  admission point; Unit 1 makes it effective. No new retry or re-confirm plumbing is needed
  — do not add a second live re-check in `graph-select-target`.
- `lib-claude-agents.sh:350,380` (`_claude_agents_raw`, `_claude_agents_raw_registered`) and
  `dispatch-tick:513-546` (the two per-tick snapshot captures) — the existing one-query-per-tick
  plumbing. Classification at each query function covers snapshot and live paths alike, so
  neither the capture points nor `dispatch-tick` change.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:333` — the existing
  "daemon UNKNOWN by default" fixture (a `CLAUDE_AGENTS_CMD` pointing at a non-executable
  path) for hard-failure UNKNOWN end-to-end; and `test-lib-claude-agents.sh:46`
  (`write_fake_claude`) / `:890` (`write_fake_claude_all`) for scripted payloads. New
  scenarios need only a 2-line `pgrep` stub, no new fake-daemon plumbing.
- `dispatch-select-tick:700-705` (autonomous at-cap) and `:765-772` (manual exhausted) — copy
  these exact deferral shapes (lock release, reseed or deliberate absence of one, DLOG fields,
  `concurrency-cap` decision line) rather than inventing a new exit path.
- `graph-select-target:378-384` — the existing `concurrency-cap` → `echo "empty"` disposition
  for the `--standalone` lane.

## Verification

Run from the worktree root. All four suites below pass unmodified on today's `origin/main`
(`182/182`, `51/51`, `86/86`, `78/78`, `83/83`) — any failure is caused by this change.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-spawn-job.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**`test-dispatch-select-tick.sh` must be run with the sandbox disabled.** It is deliberately
kept out of the `verify` blocks above: sandboxed it reports `90/182 passed, 92 failed` on an
unmodified tree (a `$CLAUDE_JOB_DIR`/tmp sandbox artifact, not a regression), and
unsandboxed it reports `182/182`. Run it as a Bash call with
`dangerouslyDisableSandbox: true` and compare against the `182/182` baseline:

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`

**Manual proof of the incident scenario** (the check that most directly closes the tactic).
In a scratch shell, source `lib-claude-agents.sh`, point `CLAUDE_AGENTS_CMD` at a fake
printing `[]` and exiting 0, and point `CLAUDE_AGENTS_PGREP_CMD` at a stub exiting 1. Then
confirm all four verdicts flip to conservative: `claude_agents_count_busy_workers` returns
non-zero (UNKNOWN, not `0`); `worktree_has_live_session <any-path>` returns 0 (occupied);
`reservation_sweep` prints "daemon unqueryable; reclaiming nothing" and leaves markers in
place; `claude_session_id_is_live <sid>` returns 0 with
`CLAUDE_SESSION_ID_LIVE_STATE=unknown`. Repeat with the `pgrep` stub exiting 0 and confirm
every verdict returns to today's behavior — the probe must not change any corroborated read.

**Observe in production (required before treating this as done).** The conservative posture
introduces one new stall mode: on a genuinely idle fleet the array *is* empty, so the probe
runs on every autonomous tick, and if it were to fail on the host the fleet could never start
from idle. After merge, watch the first ticks that start from a fully idle fleet
(`journalctl --user -u dispatch-tick*`, or `dispatch-fleet-watch`) and confirm they still
reach a `graph <count> …` decision rather than repeatedly emitting `concurrency-cap` with
`live-read-unverified`. If that skip reason appears on the host path, the corroborator — not
the fleet — is what is wrong; `dispatch-daemon-liveness` is the diagnostic. A busy fleet never
reaches the probe (non-empty array), so this risk is confined to cold starts.

**Judgment call to record in the PR.** A sandboxed manual `/dispatch` now returns
`concurrency-cap` instead of spawning its one sovereign node. Confirm the stderr diagnostic
makes the remedy obvious (re-run unsandboxed) — a silent `concurrency-cap` here would read as
"fleet saturated" and is the main usability risk of this change.

## needs-main residue

### 1. Observe cold-start autonomous ticks on a fully idle fleet after merge
- URL path: current
- Expected outcome: Cold-start autonomous ticks on a genuinely idle fleet reach a normal `graph <count> …` decision rather than repeatedly emitting `concurrency-cap` with `skip_reason=live-read-unverified`.
- Finding: Not assertable at merge time — every test suite in this PR injects `CLAUDE_AGENTS_PGREP_CMD`, so the real `pgrep -f 'claude daemon'` invocation is exercised for the first time only in production, against a real idle fleet and process table. The author documents this as an explicit observe-in-production acceptance criterion (a planned deferral, not a merge-blocking check).
- Verifiability: WAIT — awaited event: the fleet reaching a genuinely idle state after this PR merges, so an autonomous `dispatch-select-tick` invocation actually exercises the corroboration probe against the real daemon/process table for the first time.
- Check: `journalctl --user -u dispatch-tick* --since -6h | grep -E 'graph [0-9]+ |concurrency-cap.*live-read-unverified'` — confirm cold-start ticks reach a `graph <count> …` decision, not a repeated `live-read-unverified` skip.
