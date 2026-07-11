---
id: tactic-dispatch-daemon-liveness-sensor
kind: tactic
statement: "instrument: managed dispatch daemon liveness sensor — a script
  reporting whether dispatch-claude-daemon.service is up and ticking unattended,
  distinguishing the managed lingering unit from a transient interactive daemon"
owner: ai
status: codified
parent: null
rationale: "Round-1 instrument for strategy-autonomous-execution (reading null —
  the strategy cannot be measured without buying its own instrument). Implements
  the strategy tooling_goals sensor: the 2026-07-08 clarification records that
  backlog drain alone cannot prove unattended execution because an interactive
  claude agents invocation spawns its own transient daemon that masks a dead
  managed dispatch-claude-daemon.service (masked it for roughly a day on
  2026-07-08). The sensor makes the success_signal liveness term readable:
  managed unit state, linger, heartbeat timer, and a daemon census that
  classifies each claude daemon process as managed (inside the unit cgroup) or
  transient. Recorded 2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-dispatch-daemon-liveness-sensor
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: f51f76ac14405b0ccbb0e47f33e0fae1e341c60a45ec9ae6b329170b7227ae05
validates:
  - strategy-autonomous-execution
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# instrument: managed dispatch daemon liveness sensor

## Context

`strategy-autonomous-execution`'s success signal needs a liveness observable
on the managed lingering daemon: an interactive `claude agents` invocation
spawns its own transient daemon that masks a dead
`dispatch-claude-daemon.service` (on 2026-07-08 it masked one for roughly a
day). Backlog drain alone therefore cannot prove unattended execution. This
tactic buys the round-1 instrument (the strategy's `reading` is null and its
`tooling_goals` names exactly this sensor): a host-side script that reports
whether the managed daemon is up and ticking unattended, distinguishing the
managed unit from a transient interactive daemon.

## Unit 1 — the dispatch-daemon-liveness script

**Recommended model:** opus

Scope:
- New executable script
  `.claude/skills/dispatch-propagate/scripts/dispatch-daemon-liveness`
  (bash; the skills-scripts path convention auto-approves it). Human-readable
  report by default, `--json` for a machine reading.
- Report fields:
  - Managed unit: `systemctl --user show dispatch-claude-daemon.service
    -p ActiveState,SubState,MainPID,ActiveEnterTimestamp,NRestarts`
    (unit defined at `nix/home/claude-code.nix:77`).
  - Linger: `loginctl show-user "$USER" --property=Linger` (expected `yes`;
    configured at `nix/nixos/configuration.nix:90`).
  - Heartbeat: `dispatch-heartbeat.timer` ActiveState + LastTriggerUSec
    (units installed by `ensure_heartbeat_units`,
    `.claude/skills/dispatch-propagate/scripts/lib.sh:2804`; docs at
    `lib.sh:2713`).
  - Daemon census: enumerate `claude daemon` processes (`pgrep -f`), classify
    each by cgroup — `/proc/<pid>/cgroup` containing
    `dispatch-claude-daemon.service` is managed; any other daemon process is
    transient (a child of an interactive `claude agents` session).
  - Verdict: `managed-live` (unit active, its MainPID hosts the daemon, no
    transient substituting), `transient-substituting` (unit inactive but a
    transient daemon is serving — the 2026-07-08 masking case), `down` (no
    daemon at all), `degraded` (unit live but linger off or heartbeat timer
    inactive). Exit 0 only on `managed-live`; distinct non-zero codes per
    verdict (clear errors over fallbacks, `.claude/rules/code-style.md`).
- Continuity: surface `ActiveEnterTimestamp` and `NRestarts` verbatim so a
  reader can assert "active since before the logout window, no restarts
  during it".
- Out of scope: office-hours app/dashboard integration (graph-fed panels are
  `tactic-attention-surface-velocity-pace`'s surface); any auto-remediation —
  this is report-only.

## Unit 2 — tests

**Recommended model:** sonnet

Dependencies: Unit 1.

Scope:
- Sibling test script (house pattern: `.github/scripts/test-firebase-auth.sh`,
  `packages/intentionsutil/scripts/test-graph-commit.sh`): dependency-inject
  the systemctl/loginctl/pgrep invocations (env-var command override, the
  `$systemctl_cmd` pattern used around `lib.sh:2775-2788`) and cover all four
  verdicts, the exit codes, and the `--json` shape. Run helpers under
  `bash -c`, not zsh.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` — the
  daemon-query contract and its UNKNOWN-fail-safe semantics. Note: the
  sandbox's network namespace blocks the daemon socket (a sandboxed query
  returns `[]` indistinguishable from "none"), so this sensor prefers
  systemd/proc facts over `claude agents --json` and must be run unsandboxed
  when it does query the daemon.
- Heartbeat unit names and install path: `lib.sh:2713-2820`.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-daemon-liveness.sh
```

Manual (host): with the managed service running, `dispatch-daemon-liveness`
reports `managed-live`; `systemctl --user stop dispatch-claude-daemon.service`,
start an interactive claude session, re-run — verdict
`transient-substituting`; then `systemctl --user start
dispatch-claude-daemon.service` and confirm `managed-live` again.

## Implementation notes

Two units, one PR; implement each unit in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.
