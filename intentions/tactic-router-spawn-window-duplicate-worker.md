---
id: tactic-router-spawn-window-duplicate-worker
kind: tactic
statement: The router's per-node claim must stay in force from selection until
  the spawned worker is observable as a live session — dispatch-graph-execute
  clears the reservation marker at spawn time while the worker is still booting,
  so for the whole boot window the node is covered by neither the ledger nor
  worktree_has_live_session and any concurrent tick re-selects it and launches a
  second worker into the same worktree
owner: ai
status: codified
parent: null
rationale: "Observed live 2026-07-30 during the dispatch-pipeline bootstrap: two
  /implement sessions ran concurrently on
  tactic-graph-commit-intentions-base-stale-restore, in ONE shared worktree, and
  the author had to stop one by hand. Journal proof: tick PID 1626465 (transient
  unit dispatch-reseed-1785441281.service) selected the node at 16:08:38 EDT and
  launched at 16:08:56; tick PID 1805464 (dispatch-heartbeat.service) selected
  the SAME node at 16:10:26 and launched at 16:10:29 — 90s after the first
  worker was already running. The 20:10:26Z graph-selection.jsonl entry skips
  two other nodes for live-session and one for pr-merged-awaiting-reconcile, but
  does not skip this one, and the reservation ledger directory was empty. The
  two guards in graph-select-target (reservation_exists at :664,
  worktree_has_live_session at :669) are meant to be a single continuous claim
  but actually abut with a gap: dispatch-graph-execute deletes the marker on
  spawn (:193, :218, :289), and the spawned session does not appear in claude
  agents under its node-id name for well over a tick interval. The existing boot
  grace (DISPATCH_RESERVATION_BOOT_GRACE_S, default 30s) already encodes exactly
  this intent for reservation_sweep, but it only protects markers that still
  exist — so it never applies to this path, and lengthening it is NOT the fix.
  Filed as a new node rather than folded into
  tactic-graph-router-live-worker-read-robust: that node shares the symptom but
  names a different mechanism (an empty or partial claude agents --json read
  causing an undercount), and here the read is correct — the session genuinely
  has not registered yet, so read robustness cannot close a latency window.
  tactic-claim-dedup-only deliberately KEEPS spawn-dedup while dropping
  edit-gating; it assumes spawn-dedup is sound, and this node is the evidence
  that it is not. tactic-stopped-session-blocks-node is the same lifecycle
  defect at the other end — the claim released too early at session END rather
  than at spawn START. Amplifier worth recording:
  tactic-sweep-timer-unit-dir-leak's 203/EXEC storm drives OnFailure into
  dispatch-tick-recover, which fires transient dispatch-reseed-*.service ticks
  far more often than the 15-minute heartbeat, so the fleet hits this window
  much more often while that defect is live. Interim attention scaffolding only
  — tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks. blocked_by is empty, so this Wave A
  promotion lifts no blocker and cannot compound. Second occurrence,
  2026-07-30T23:57Z, on tactic-dispatch-test-monolith-split (review lane): a
  duplicate fired 814 seconds (13m34s) apart — NOT this mechanism; the reserving
  session was still state:working with cwd on that worktree for the entire gap,
  and the live-session read demonstrably ran and returned NOT live for this node
  specifically while correctly skipping sibling nodes in the same decision. That
  is the tactic-graph-router-live-worker-read-robust mechanism (or a third,
  unidentified defect), not this tactic's spawn window — do not merge the two
  nodes. Third occurrence, 2026-07-31T01:03Z, on
  tactic-graph-commit-noop-landing-false-failure (fix lane): IS the documented
  spawn window, at 6 seconds — the tightest yet observed, corroborated on
  graph-selection.jsonl and the journal. Planning-round finding (2026-07-31
  /align-tactics): the minimal fix of simply deleting dispatch-graph-execute's
  reservation_clear calls and relying on reservation_sweep to reclaim the marker
  once the worker registers is NOT sufficient on its own — the autonomous and
  manual tick lanes stamp the marker's session= with a synthetic
  headless:<INVOCATION_ID> value (dispatch-tick:354) that never appears in
  `claude agents --json`, so a left-in-place marker is reclaimed by rule (c)
  dead-session-stranded the moment the 30s boot grace expires (measured from
  selection, not spawn) — which reopens the window at t+30s, before the 90s
  occurrence-1 gap. The landed plan instead has dispatch-graph-execute re-stamp
  the marker `origin=spawned` with a spawn-time timestamp on a successful kick,
  and adds a new session-liveness-independent sweep rule (bounded by
  DISPATCH_RESERVATION_HANDOFF_TTL_S, default 300s) sitting between the existing
  boot-grace and TTL rules; the existing age-independent rule (a) (marker
  basename ∈ live-session-names → reclaim) still releases the claim the instant
  the worker registers, so no new mechanism is needed for the happy path.
  Aftermath is a separate node: tactic-standdown-winner-liveness (filed
  2026-07-31) covers what happens after a duplicate — the loser stands down, the
  winner dies before pushing, and the loser waits forever on a dead session."
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
    is a live correctness defect that duplicates autonomous workers onto one
    worktree, burning tokens on redundant work and putting two writers on one
    checkout, which is exactly the concurrent-edit hazard the write-path band
    exists to protect. Observed live during the bootstrap and required a human
    stop; a second, tighter (6s) recurrence confirmed it 2026-07-31. blocked_by
    is empty, so this promotion lifts no blocker and cannot compound. Finalized
    to phase: implement 2026-07-31 via /align-tactics."
phase: review
execution:
  branch: tactic-router-spawn-window-duplicate-worker
  pr: 2995
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
# The router's per-node claim must stay in force from selection until the spawned worker is observable as a live session — dispatch-graph-execute clears the reservation marker at spawn time while the worker is still booting, so for the whole boot window the node is covered by neither the ledger nor worktree_has_live_session and any concurrent tick re-selects it and launches a second worker into the same worktree

## Context

The dispatch router's per-node claim is supposed to be one continuous span:
the reservation-ledger marker covers **selection → spawn**, and a live
`claude agents` session named by the node id covers **spawn → exit**. The two
guards are read together in `graph-select-target`:

```
.claude/skills/dispatch-propagate/scripts/graph-select-target:664  if reservation_exists "$id"; then          → skip "reserved"
.claude/skills/dispatch-propagate/scripts/graph-select-target:669  if worktree_has_live_session "$NATIVE_ROOT/.claude/worktrees/$id"; then → skip "live-session"
```

They do not overlap — they abut, with a gap. `dispatch-graph-execute` deletes
the marker synchronously on a successful spawn kick, while the spawned session
has not yet registered under its node-id name. For that whole window the node
is covered by **neither** guard, and any concurrent tick re-selects it and
launches a second worker into the same worktree.

Three duplicates were observed on the live fleet (2026-07-30/31). Two of them
are this mechanism: gaps of **90 s** and **6 s** between two `launched <id>
<skill>` lines from two different tick pids, with `tmp/dispatch-reservations/`
empty and the same selection record correctly skipping *sibling* nodes for
`live-session`. (The third, an 814 s gap, is a different mechanism — see
"Explicitly out of scope".)

### The three call sites that open the window

All on a **successful** `dispatch-spawn-job` kick, all identical in shape:

- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:193` — strategy / `align-tactics` lane
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:218` — tactic lane, provision exit 0
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:289` — provision exit 11, the `/dispatch-conflict` Lane 3 kick

each reading `reservation_clear "$id" || true`.

Two *other* `reservation_clear` sites are **correct and must not change** —
they run where no spawn happened and the node genuinely should be freed for
immediate re-selection:

- `:354` — provision exit 12 (stale-selection)
- `:370` — provision exit 13 (scope-stale, before the demote)

### Why "just stop clearing the marker" is not sufficient

The obvious minimal fix — delete the three lines and let `reservation_sweep`
reclaim the marker once the worker registers — closes the 6 s window but
**not** the 90 s one. The reason is the marker's `session=` line:

- `dispatch-tick:354` exports
  `CLAUDE_CODE_SESSION_ID="${CLAUDE_CODE_SESSION_ID:-headless:${INVOCATION_ID:-…}}"`.
- `dispatch-select-tick:242` (`emit_graph_selection`) writes that value into
  every marker: `reservation_write "$id" "$id" "${CLAUDE_CODE_SESSION_ID:-}" …`.
- A `headless:*` id is **never** a live Claude session id, so it is never in
  `reservation_sweep`'s `live_ids` set.

So a left-in-place tick marker survives only the 30 s boot grace
(`lib-reservation-ledger.sh:491-498`) and is then reclaimed by rule (c),
`dead-session-stranded` (`:513-519`). From t+30 s the window is open again —
exactly where occurrence 1 fired at t+90 s.

The claim therefore needs a **handoff state** that is explicitly held past
spawn, released by an event (the worker registering) rather than by the
reserving session's liveness, and bounded by a deadline so a spawn that dies
during boot cannot pin the slot forever.

### The design (greenfield — this is the whole design; no migration path needed)

1. On a **successful spawn kick**, `dispatch-graph-execute` re-stamps the
   marker instead of deleting it: same file, `origin=spawned`, timestamp
   refreshed to **spawn time** (not selection time).
2. `reservation_sweep` gains one rule, sitting between the boot grace and the
   existing TTL rule: a marker with `origin=spawned` is **KEPT regardless of
   the reserving session's liveness** until it ages past
   `DISPATCH_RESERVATION_HANDOFF_TTL_S` (default 300 s), then reclaimed with a
   `spawn-handoff-expired` note.
3. Release stays event-driven: the existing **age-independent rule (a)**
   (`lib-reservation-ledger.sh:478-483` — marker basename ∈ live-session-names
   → reclaim `live-worker-redundant`) already fires the moment the worker
   registers, and it precedes the new rule, so a registered worker releases
   the claim at the very next sweep. The TTL is only the backstop for a spawn
   that never registers.

No back-compat concern: markers written before this change carry no
`origin=spawned` line, so the new rule simply never matches them and their
handling is byte-identical.

`reservation_sweep` already runs before every selection decision that matters
— `dispatch-select-tick:635` (autonomous lane), `:826` (explicit-node lane),
`dispatch-tick:277-292` (paused-heartbeat reap) — so no new polling, timer, or
cron primitive is introduced. The fix rides the existing per-tick sweep.

### Budget accounting (a deliberate, correct side effect)

`effective_live = busy_workers + reservation_count`. Today a node counts **0**
between spawn and registration — a budget *undercount* that lets the gate
over-spawn. Post-fix it counts 1 continuously. There is no double count: the
gate sweeps *before* it counts (`dispatch-select-tick:635` then
`reservation_count` at `:640`-ish), so a marker made redundant by a registered
worker is reclaimed in the same breath.

### Explicitly out of scope

- **Lengthening `DISPATCH_RESERVATION_BOOT_GRACE_S`.** The grace only protects
  markers that still exist; the defect is that the marker is gone. Do not
  touch its default.
- **The 814 s occurrence** (2026-07-30T23:44→23:57, `/review-fix` on
  `tactic-dispatch-test-monolith-split`). The spawned session was
  continuously `state: working` in that worktree for the entire gap, so this
  fix would not have prevented it. That is a live-session *read* defect owned
  by the sibling node `tactic-graph-router-live-worker-read-robust`, and its
  open question ("why did the live-session check succeed for two sibling nodes
  and fail for this one in the same decision?") belongs there. **Do not merge
  the two nodes, and do not claim this fix closes the duplicate-worker problem
  as a whole.** A duplicate observed after this lands is not proof this fix
  regressed.
- **`dispatch-spawn-job`'s own name-based dedup** (`--name`/`--cwd`, Step 1) —
  unchanged. It is defeated by the same registration latency, and hardening it
  is the sibling node's territory.
- **`graph-select-target`'s claimed-set gate** (`:662-673`) — no code change.
  It already does the right thing once the marker persists.
- **`dispatch-reclaim-audit`** — no code change. Its counters grep the two
  exact strings `dead-session-stranded` and `live-worker-redundant`, so a new
  third reason is additive and breaks nothing.
- **A `dispatch.config` tunable.** The deadline is an env var with a baked-in
  default, matching `CONFLICT_STRIKE_CAP`'s precedent
  (`dispatch-graph-execute:140`).

### Cross-reference to record, not to fix

`tactic-claim-dedup-only` (phase `qa`) keeps spawn-dedup while dropping
edit-gating, on the stated assumption that spawn-dedup is sound. This work is
the evidence that it was not. Note the cross-reference in the PR body; do not
edit that node here.

---

## Unit 1 — `reservation_mark_spawned` + the sweep's spawn-handoff rule

**Scope**

Changes `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh`
and `.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh`
only. No other file changes in this unit.

**1a. New primitive `reservation_mark_spawned <worktree-basename>`**, defined
next to `reservation_clear` (after `lib-reservation-ledger.sh:296`) and
documented in the header's usage list (`:25-33`) and contract block (near
`:72-92`):

- Reads the existing marker at `<ledger-dir>/<basename>`, if present, for its
  `session=` and `issue=` values using the same `sed -n 's/^session=//p' | head -n1`
  pattern the sweep uses (`:467`, `:472`, `:476`).
- Resolves the session value to the **first non-empty** of: the existing
  marker's `session=`, `${CLAUDE_CODE_SESSION_ID:-}`, then the literal
  `spawn-handoff`. It must never be empty — `reservation_write` rejects an
  empty session id (`:218-221`, asserted by Test 8 at
  `test-lib-reservation-ledger.sh:288-298`), and worse, an empty `session=`
  would land the marker on sweep rule (b) (`:484-490`), which KEEPS it forever
  and would make the slot immortal.
- Resolves the issue value to the existing marker's `issue=` if non-empty,
  else the basename.
- Delegates the write to `reservation_write "$bn" "$issue" "$session" spawned`
  — reusing its path-safety guard, `mkdir -p -m 0700`, atomic tempfile+`mv`,
  and `DISPATCH_RESERVATION_NOW` handling wholesale. **Do not hand-roll a
  second writer.**
- The timestamp is therefore refreshed to *now* = spawn time. This is
  load-bearing: selection→spawn includes `provision-node-worktree`'s git
  fetch / worktree add and can take minutes, so keeping the selection
  timestamp could hand back an already-expired handoff.
- Creates the marker if none exists (idempotent), so a caller that reached
  spawn without a ledger entry still gets covered.
- Returns 0 on success; returns 1 on a missing/unsafe basename or a write
  failure (propagating `reservation_write`'s status).

**1b. New sweep rule in `reservation_sweep`** (`:462-521`). Insert one `elif`
branch **after** the boot-grace branch (`:491-498`) and **before** the
`(c-ttl)` branch (`:499-512`). The resulting ladder, in order:

| # | condition | action |
|---|---|---|
| a | basename ∈ `live_names` | reclaim `live-worker-redundant` (age-independent) |
| b | `session=` empty | KEEP + flag `malformed` |
| — | age < `DISPATCH_RESERVATION_BOOT_GRACE_S` | KEEP |
| **a-handoff (new)** | `origin=spawned` and the timestamp parsed | age ≥ `DISPATCH_RESERVATION_HANDOFF_TTL_S` → reclaim `spawn-handoff-expired`; else KEEP |
| c-ttl | `origin` ∈ {`standalone`,`explicit`} and aged past TTL | reclaim `<origin>-ttl-expired` |
| c | reserving session ∉ `live_ids`, aged past grace | reclaim `dead-session-stranded` |
| d | otherwise | KEEP |

Rule-placement constraints the implementer must preserve:

- **After (a)** so a registered worker still releases the claim immediately.
- **Before (c)** so a `headless:*` reserving session no longer strands the
  handoff at 30 s. This is the entire point of the unit.
- An **unparseable/absent timestamp** falls through to the rules below,
  matching the boot grace's fail-safe posture at `:471` and `:491`.
- Reclaim emits exactly one stderr note in the existing style
  (`printf 'lib-reservation-ledger: reclaimed reservation %s (spawn-handoff-expired after %ss with no live worker)\n' "$bn" "$ttl" >&2`).
  It must **not** emit the `inspect tmp/dispatch-launch` diagnostic — that
  line is reserved for genuine `dead-session-stranded` reclaims and Test 5
  (`test-lib-reservation-ledger.sh:156-164`) asserts benign reclaims stay
  silent.

**1c. New env override `DISPATCH_RESERVATION_HANDOFF_TTL_S`**, default **300**,
parsed with the same `[[ "$x" =~ ^[0-9]+$ ]] || x=300` fallback as `grace` and
`ttl_s` (`:450-456`), computed once before the loop. Document it in the header
"Test overrides" block (`:151-178`) *and* state the tuning constraint there:
the value must comfortably exceed the worst observed worker-registration
latency (90 s observed on 2026-07-30), because below it the duplicate window
reopens; above it, the only cost is that one budget slot and one node stay
claimed for that long after a spawn that died during boot. Also add it to
`rl_teardown`'s `unset` list (`test-lib-reservation-ledger.sh:43-45`).

**1d. Header-comment correction.** The `(c-ttl)` prose at `:136-138` currently
asserts "A claim that DOES launch is cleared far sooner (dispatch-graph-execute
clears it on spawn…)". Rewrite it to describe the handoff: a launched claim is
re-stamped `origin=spawned` and released by rule (a) once the worker
registers, or by the handoff TTL if it never does.

**1e. Tests** — extend `test-lib-reservation-ledger.sh` in place (do **not**
add a parallel file). Reuse the existing `rl_setup` / `rl_write_fake_claude` /
`rl_teardown` fixture and the pinned epoch **1767225600** =
`2026-01-01T00:00:00Z` (the constant used by Tests A/B/C at `:358-412`). Add,
after Test C (`:412`):

1. `rl-mark-spawned-content` — `reservation_write "tactic-x" "tactic-x" "headless:abc"`,
   then `reservation_mark_spawned "tactic-x"`; assert the marker contains
   `session=headless:abc`, `issue=tactic-x`, `origin=spawned`, and the
   `DISPATCH_RESERVATION_NOW` timestamp (4 lines, in `reservation_write`'s
   documented order: session, issue, origin, timestamp).
2. `rl-mark-spawned-absent` — `reservation_mark_spawned "tactic-y"` with no
   prior marker: exits 0, writes a marker whose `session=` line is **non-empty**.
3. `rl-sweep-spawned-held` — the core regression guard for occurrence 1: a
   marker stamped `origin=spawned`, a **dead** reserving session
   (`headless:abc` absent from the fake registry), no live worker of that
   name, sweep clock **+90 s** (`1767225600 + 90`), default 300 s TTL →
   `reservation_count` is **1** (kept). Without the new rule this is reclaimed
   at +31 s as `dead-session-stranded`, which is precisely the live defect.
4. `rl-sweep-spawned-expired` — same fixture, sweep clock **+301 s** →
   count 0, and stderr matches `spawn-handoff-expired`.
5. `rl-sweep-spawned-released-by-live-worker` — same fixture at **+90 s**, but
   the fake registry now holds `{"name":"tactic-x",…}` → rule (a) reclaims it,
   stderr matches `live-worker-redundant`, and stderr must **not** match
   `inspect tmp/dispatch-launch`.
6. `rl-sweep-spawned-young` — `origin=spawned` marker at **+5 s** (inside the
   boot grace) with a dead reserving session → kept, proving the boot grace
   still short-circuits first and the new rule did not disturb it.

**Recommended model** — opus. The work is a concurrency/ordering change to a
rule ladder whose branch order is the correctness property, and the failure
mode of getting it wrong (a slot pinned forever, or the window silently
reopening at 30 s) is exactly what the unit exists to prevent.

---

## Unit 2 — `dispatch-graph-execute` hands the claim over instead of dropping it

**Dependencies** — Unit 1 (this unit calls `reservation_mark_spawned`).

**Scope**

Changes `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` only.

**2a.** Replace `reservation_clear "$id" || true` with
`reservation_mark_spawned "$id" || true` at exactly these three
successful-kick sites:

- `:193` — strategy / `align-tactics` lane
- `:218` — tactic lane, provision exit 0
- `:289` — provision exit 11, the `/dispatch-conflict` Lane 3 kick (immediately
  after `rm -f "$STRIKE_FILE"`)

Keep the `|| true`: a ledger write failure must not turn a successful launch
into a `failed` disposition, matching the existing posture. Add a one-line
comment at each site naming the reason ("hold the claim through the boot
window; `reservation_sweep` rule (a) releases it once the worker registers").

**2b.** Leave **untouched**: `:354` (exit 12, stale-selection) and `:370`
(exit 13, scope-stale) — no spawn happened there, and clearing is correct.
Also leave every "leave the reservation for the sweep" failure path as-is
(`:220-225`, `:308-315`).

**2c.** Rewrite the header contract item 4 (`:45-49`), which currently reads
"Clears the node's reservation-ledger marker on a successful kick — the live
node-id-named session carries the claim from there". It must now describe the
handoff: on a successful kick the marker is re-stamped `origin=spawned` with a
fresh timestamp, held through the boot window, and released by
`reservation_sweep` rule (a) when the worker registers or by the handoff TTL
if it never does; the marker is still cleared outright on exits 12 and 13, and
still left for the sweep on a failed kick.

**2d. Tests** — extend `test-dispatch-graph-execute.sh` in place. The harness
already exports `DISPATCH_RESERVATION_DIR="$RES_DIR"` (`:114`) and stubs
`dispatch-spawn-job` (`:75-79`), so each assertion is a couple of lines against
`$RES_DIR/<id>`. Note that `run_exec` does **not** clear `$RES_DIR` between
cases, so each new case must plant or remove its own marker first.

1. **Case 1** (`:126-139`, `tactic-foo:tactic:implement`) — plant
   `printf 'session=headless:t\nissue=tactic-foo\ntimestamp=2026-01-01T00:00:00Z\n' > "$RES_DIR/tactic-foo"`
   before `run_exec`; after it assert the marker still **exists** and that its
   contents contain `origin=spawned`.
2. **Case 3** (`:167-173`, `strategy-x:strategy:align`) — same pattern for the
   strategy lane.
3. **Case 5** (`:191-208`) — flip the existing assertion. Today
   `assert_eq "conflict-lane clears the reservation marker" "gone"` (`:207-208`)
   encodes the defect. It becomes: the marker **survives** the successful
   conflict-lane kick and carries `origin=spawned`. Update the case's banner
   comment at `:185-188` ("the reservation is cleared") to match.
4. New case — **a marker absent at spawn time is created**: `rm -f
   "$RES_DIR/tactic-nomark"`, run a `tactic:implement` spawn, assert the marker
   now exists with `origin=spawned` and a non-empty `session=` line.
5. **Cases 6 and 7 keep their current expectations**: `:273-274` must still
   assert exit 12 clears the marker; add the mirror assertion for exit 13
   (`:280-284`, fixture worktree id "tactic-d") — plant a marker, assert it is
   gone — so a future edit cannot silently convert those two into handoffs.
6. **Case 9** (`:324-326`, failed kick) — plant a marker and assert it
   **survives** without an `origin=spawned` line, pinning "a failed kick leaves
   the selection claim for the sweep, it does not stamp a handoff".

**Recommended model** — sonnet. Three one-line call swaps, one header-comment
rewrite, and explicitly enumerated test assertions against an existing fixture;
the diff shape is fully determined by this plan.

---

## Unit 3 — Correct the stale "clears it on spawn" doctrine comments

**Dependencies** — Units 1 and 2 (these comments describe the behavior those
units change).

**Scope**

Comment-only. No executable line changes, no test changes.

- `.claude/skills/dispatch-propagate/scripts/graph-select-target:59-63` — the
  `--standalone` CLAIM OBLIGATION block says a launching caller "hands the
  marker to dispatch-graph-execute (which clears it on spawn)". Change to:
  hands it to `dispatch-graph-execute`, which re-stamps it `origin=spawned` and
  lets `reservation_sweep` release it once the worker registers. The rest of
  the obligation (a caller that does **not** launch must `reservation_clear`)
  is unchanged and must stay.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:700-711` — the
  same claim appears in the in-body comment above the `--standalone`
  `reservation_write` call ("handed straight to dispatch-graph-execute, which
  clears it on spawn"). Same correction.
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:210-220` —
  `emit_graph_selection`'s header explains why the autonomous and manual lanes
  omit an origin: "their claims are consumed by the same tick's fan-out and are
  covered by rules (a)/(c)". Update to name the handoff: a claim that reaches a
  successful spawn is re-stamped `origin=spawned` by `dispatch-graph-execute`
  and covered by the handoff rule; rule (c) now only reclaims claims that never
  reached a spawn.

Do **not** change `dispatch-select-tick:727-728`'s open `--manual` sweep-gap
comment — that gap belongs to `tactic-manual-path-reservation-sweep` (PR
open, unmerged).

**Recommended model** — sonnet. Rote prose correction at three named anchors.

---

## Reuse

- `reservation_write` — `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:216-273`.
  The only marker writer: path-safety guard, `mkdir -p -m 0700`, atomic
  tempfile+`mv`, `DISPATCH_RESERVATION_NOW`, and the optional 4th `origin`
  argument (`:224-227`, `:264`). `reservation_mark_spawned` delegates to it.
- `reservation_sweep` rule (a) — `lib-reservation-ledger.sh:478-483`. The
  age-independent `live-worker-redundant` reclaim is the release trigger; no
  new release mechanism is written.
- The boot-grace branch — `lib-reservation-ledger.sh:491-498`. Copy its
  epoch-parse + `(( now - marker_epoch … ))` shape and its
  unparseable-timestamp fail-safe for the new rule.
- The `(c-ttl)` branch — `lib-reservation-ledger.sh:499-512`. The template for
  an origin-keyed, TTL-bounded, session-liveness-independent rule, including
  its env-var parse (`:450-456`) and reclaim-note wording.
- `reservation_clear` — `lib-reservation-ledger.sh:277-296`. Still the right
  primitive on exits 12/13; unchanged.
- The per-tick sweep call sites — `dispatch-select-tick:635`, `:826`,
  `dispatch-tick:277-292`. Reconciliation cadence already exists; add nothing.
- `test-lib-reservation-ledger.sh` fixture — `rl_setup` / `rl_write_fake_claude`
  / `rl_teardown` at `:32-61`, plus the pinned epoch pattern in Tests A/B/C at
  `:358-412` and the origin-TTL pattern in Tests 5b/5c/5d at `:167-254`.
- `test-dispatch-graph-execute.sh` harness — `run_exec` and its
  `DISPATCH_RESERVATION_DIR` export at `:104-120`, the `dispatch-spawn-job`
  stub at `:75-79`, and the existing marker assertions at `:207-208` / `:273-274`.
- `dispatch-reclaim-audit` — `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:194-209`.
  Read-only reference: its exact-string greps show the new reason is additive.

## Verification

Both suites run in CI: `test-dispatch-graph-execute.sh` is wired explicitly at
`.github/workflows/unit-tests.yml:222`, and `test-lib-reservation-ledger.sh` is
picked up by `run-unit-tests.sh`'s `--pr-scripts` glob
(`run-unit-tests.sh:187-204`) because the SUT lives under
`.claude/skills/dispatch-propagate/scripts/`.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

Ledger reclaim strings are also asserted by two neighbouring suites; run them
to catch an accidental rename of an existing reason:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

If any of these fail with a read-only-filesystem error from `mktemp -d`,
re-run the same command with `dangerouslyDisableSandbox: true` — the suites
write scratch dirs and fake `claude` binaries under `$TMPDIR`.

**Manual check that the three call sites moved and only those three.** After
the change, `grep -n 'reservation_clear\|reservation_mark_spawned'
.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` must show
exactly three `reservation_mark_spawned` lines (the strategy lane, the exit-0
tactic lane, the exit-11 conflict lane) and exactly two surviving
`reservation_clear` lines (exits 12 and 13). Any other distribution is wrong.

**Observe in production (post-merge, judgment call — this is the real signal).**
The defect is a live-fleet race that no unit test reproduces end to end:

1. In the tick journal, a `launched <id> <skill>` line must be followed within
   the same tick window by **no second** `launched <id>` from a different tick
   pid. The two historical fingerprints to look for are two `launched` lines
   for one node id from different pids, and two `graph-selection.jsonl` records
   naming the same id in `selected` seconds apart while skipping *sibling*
   nodes for `live-session`.
2. `tmp/dispatch-reservations/` should now be **non-empty** during a worker's
   boot window — the direct observable that the claim is being held. It was
   empty at the instant of all three recorded duplicates.
3. Watch the journal for `lib-reservation-ledger: reclaimed reservation <id>
   (spawn-handoff-expired …)` notes. A steady trickle is expected and healthy
   (workers that completed before any sweep saw them live). A *flood* means the
   handoff TTL is shorter than real registration latency — raise
   `DISPATCH_RESERVATION_HANDOFF_TTL_S`, do not revert the rule.
4. Expect the `live-worker-redundant` reclaim count reported by
   `dispatch-reclaim-audit` to rise substantially — post-fix every successful
   spawn leaves a marker for rule (a) to reclaim, where before it left none.
   That script's interpretation prose (its dead-vs-redundant ratio thesis) ages
   as a result; it is report-only and out of scope here, but say so in the PR
   body so the next reader of that report is not misled.

**Remediation runbook, if a duplicate is observed while verifying.** Both
sessions share **one** worktree. `claude rm <session-id>` deletes the session
*and its worktree*, destroying the surviving worker's checkout mid-edit. Use
`claude stop` on the **newer** session and leave the worktree to the survivor.

**What this does not verify.** A duplicate with a gap far larger than the
handoff window (the observed 814 s case) is the sibling read-defect mechanism,
not a regression of this fix. Record it against
`tactic-graph-router-live-worker-read-robust`; do not reopen this work for it.

## needs-main residue

Filed by `/qa-fix` (PR #2995). Both items are planned deferrals documented in
the PR body's own "Observe in production" section — not code defects, not
assertable at merge time. All 8 script-verifiable QA plan items in this pass
PASSed (both directly-affected test suites, both neighboring test suites, the
call-site census, syntax + primitive/env-var checks, a black-box marker
lifecycle smoke test against the real committed library, and the prose
linter). Drained after `review → main-qa`.

### 9. No duplicate-worker recurrence in the live fleet after merge

- URL path: current
- Expected outcome: No new spawn-window duplicate-worker pair is observed in
  the live fleet after merge (no two `launched <id>` tick-journal lines for
  the same node id from different tick pids within the boot window).
- Finding: Cannot be asserted at merge time — requires accumulated production
  spawn cycles observed over time via the tick journal and
  `graph-selection.jsonl`.

### 10. Ledger occupancy and reclaim-note mix look healthy in production logs

- URL path: current
- Expected outcome: `tmp/dispatch-reservations/` is non-empty during a
  worker's boot window post-merge; `live-worker-redundant` reclaims dominate
  as the normal release path; `spawn-handoff-expired` stays a rare trickle
  rather than a flood (a flood would mean the 300 s TTL needs raising, not
  that the rule is wrong).
- Finding: The trickle-vs-flood ratio and ledger-occupancy pattern only
  become meaningful after the fleet accumulates real spawn cycles post-merge;
  requires production log review over time, not a merge-time command.
