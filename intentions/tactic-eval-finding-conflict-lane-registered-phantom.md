---
id: tactic-eval-finding-conflict-lane-registered-phantom
kind: tactic
statement: "FALSIFIED (2026-08-13, see body): this entry claimed the
  conflict-lane session registered with the daemon and then died before writing
  any file. It did not — it left an 850KB transcript and SUCCEEDED, resolving
  five conflicts and pushing 855a060e. The zero-trace evidence was an artifact
  of the eval passing UTC bounds to find -newermt, which parses them as local
  time. Superseded by tactic-ladder-await-phase-only-completion-test (the real
  defect behind the halt) and tactic-eval-finding-utc-bounds-local-newermt (the
  search bug)."
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: conflict-lane-launch-to-stalled-elapsed-s
      value: 734
      unit: seconds
      window: single-run
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  falsified: true
  falsified_on: 2026-08-13
---
## Finding: conflict-lane launch verifies "registered" yet produces zero filesystem trace

**Observed in:** `tactic-attention-namespaced-rank`, phase `qa`, the ladder's second
qa-phase attempt (the first attempt had already thrown `held-session` at
02:32:16Z and was evaluated separately; this eval's `--since 1786592808`
scopes strictly to the second attempt).

**Timeline (from `events.jsonl`):**
- `2026-08-13T03:46:48Z` — `launched tactic-attention-namespaced-rank tactic qa
  /dispatch-conflict`. This exact echo (`launched $NODE_ID $KIND $PHASE
  /dispatch-conflict`) only fires from `dispatch-ladder-advance`'s
  `conflict-lane` case AFTER `verify_launch "$PROJECT_ROOT" "$NODE_WT"`
  returns true (`LAUNCH_VERIFY_STATE=registered`) — every other verify outcome
  (`absent`/`unknown`) routes to `launch_unverified`, which emits a `throw
  ... launch-unverified` / `launch-unverifiable` disposition instead, and no
  such throw is in the ledger. So the daemon's `claude agents --json` registry
  affirmatively reported a session registered for this node within the ~24s
  verify budget.
- `2026-08-13T03:59:02Z` (734s later) — `halt ... stalled ... the worker
  stopped with no graph change; read its transcript before re-running`, from
  `dispatch-ladder-await`.

**The contradiction:** despite the daemon-side registration passing, no file
of any kind was created or modified anywhere under `~/.claude/projects` during
the entire `[03:46:48Z, 03:59:02Z]` window — confirmed with an unscoped
`find ~/.claude/projects -newermt ... -not -newermt ...` spanning both
candidate cwds (`PROJECT_ROOT` and the node's worktree) with margin on both
ends. Specifically: no `*.jsonl` transcript, no session directory, and no
`*.dispatch-stamp.json` sidecar (the `SessionStart` hook that writes the
stamp never fired). The node's own `execution.conflict` attempt counter is
still `null` — the conflict lane never got far enough to record an attempt.

**Why this matters:** `dispatch-ladder-advance`'s post-launch verification
(added to catch exactly the "`claude --bg` exits 0 having started nothing"
class of failure — see its own inline comments at lines 276–297) treats daemon
registration as sufficient evidence a worker is real, and lets the ladder
commit to the full await window on that basis. This run shows registration is
not sufficient: a session can register with the daemon and then die before
ever touching disk, producing a phantom that the existing verification cannot
distinguish from a healthy worker. The ladder then burns the entire
`dispatch-ladder-await` `TIMEOUT_S` window (540s, i.e. 9 minutes — the
observed 734s implies either a repoll or `BOOT_GRACE_S` stacked on top) before
declaring `stalled`, and the halt's own remediation ("read its transcript
before re-running") is unfollowable because no transcript was ever written.

**What would have to change:** the post-launch check would need a second,
cheaper confirmation beyond registry presence — e.g. polling for the
`*.dispatch-stamp.json` sidecar (written at `SessionStart`) to appear within a
short window (tens of seconds) after registration, before committing to the
full multi-minute await budget. This is a recommendation for the finding's
author to weigh, not a rule this eval job may apply.

---

## FALSIFIED (2026-08-13)

Everything above this line is wrong in its central claim, and is kept only as
the audit trail of a finding that was raised and disproved. Written by the
attended `/dispatch-ladder` thread that conducted the run, after reading the
transcript the finding above reports as nonexistent.

### The session was not a phantom, and it did not fail

It left, at minimum:

- `~/.claude/projects/-home-n8-natb1-commons-systems/675bbbc1-85dd-4e23-bb95-35543051163b.jsonl`
  — an 850 KB transcript whose first user message is stamped
  `2026-08-13T03:46:48.315Z` (the launch instant itself) and whose last write is
  `03:59:00Z`;
- the matching session directory, a `~/.claude/session-env/675bbbc1-…` entry,
  and two `~/.claude/security/…675bbbc1…` files.

It also **succeeded**: it resolved five conflicts against `c3c229f0`, `git rm`'d
three files `origin/main` had already retired, pushed merge commit `855a060e`,
and flipped PR #3075 from `CONFLICTING` to `MERGEABLE`/`CLEAN` with all 23
checks passing. `execution.conflict` remained `null` because Lane 3 never writes
that counter — not because the lane died.

### Why the search saw nothing

`find -newermt` parses a bare timestamp in the **local** zone. The bounds were
taken from `events.jsonl`, which stamps UTC, and passed through unconverted, so
on this host (EDT, `-0400`) the window sat about four hours in the future and
could not match any file that existed. Reproduced:

```
$ find ~/.claude/projects -name '675bbbc1*.jsonl' -newermt '2026-08-13 03:46:48'
        (no output — the eval's window)
$ find ~/.claude/projects -name '675bbbc1*.jsonl' -newermt '2026-08-12 23:46:48'
/home/n8/.claude/projects/.../675bbbc1-….jsonl        (the same instant, local)
```

Filed as [[tactic-eval-finding-utc-bounds-local-newermt]].

### What the halt actually was

The real defect is in the consumer, not the launcher:
[[tactic-ladder-await-phase-only-completion-test]]. `dispatch-ladder-await`
decides completion from `origin/main` graph state alone, while the conflict lane
completes via a branch push and job-dir markers — so a *successful* lane can
only ever read as `stalled`. The same run then reproduced it a second time with
a `/qa-fix` fixing pass, confirming it is structural rather than specific to
conflicts.

### What survives

Two observations from the original hold and are carried into the superseding
nodes:

- **No `*.dispatch-stamp.json` sidecar** was written for this session, confirmed
  with correct local-time bounds. `aggregate-usage.sh --node` scopes on that
  sidecar, so the conflict lane's usage is genuinely unmeasurable — an empty
  selection there is a missing measurement, not a zero.
- **734s elapsed from launch to halt** is a real number. Its reading is not: it
  is the await observing a live, working session, not a timeout burned on a
  phantom. The original also measures it against `TIMEOUT_S=540`/`POLL_S=15`,
  while this run's ledger records `timeout_s=1800 poll_s=60`.
