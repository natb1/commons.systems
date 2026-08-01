---
id: tactic-ensure-units-respect-manual-disable
kind: tactic
statement: dispatch-schedule-reseed's ensure_healer_units and
  ensure_watcher_units calls run unconditionally on every reseed cycle and
  silently re-enable a manually-disabled watchdog timer within roughly 15-30
  minutes, with no sentinel or opt-out mechanism to honor an intentional disable
owner: ai
status: raw
parent: null
rationale: "Confirmed 2026-08-01 during a fleet investigation session:
  dispatch-fleet-watch.timer was deliberately disabled (systemctl --user disable
  --now) as a containment step, then journald showed 'systemctl[...]: Created
  symlink .../dispatch-fleet-watch.timer' firing again roughly 27 minutes later
  -- with no human re-enabling it. Traced to
  .claude/skills/dispatch-propagate/scripts/dispatch-schedule-reseed:421-422,
  which calls ensure_healer_units(\"$MAIN_WORKTREE\") and
  ensure_watcher_units(\"$MAIN_WORKTREE\") unconditionally as part of every
  reseed cycle, from inside dispatch-tick's own run. Neither function checks
  whether a human deliberately disabled the timer -- both just systemctl --user
  enable --now it if it is not already enabled. This means any manual disable of
  either watchdog timer is a temporary, not durable, containment measure: the
  fleet's own scheduling infrastructure undoes operator intervention on its own
  schedule."
reading: null
gap: "Not yet decided: the exact shape of the opt-out mechanism. Ruling 10 in
  the governing plan (strategy-graph-native-dispatch bootstrap plan) already
  established the precedent -- a live sentinel file under
  $XDG_DATA_HOME/commons-dispatch/ (the existing 'paused' sentinel pattern) --
  but whether to (a) add a similarly-named per-timer sentinel file that both
  ensure_*_units functions check before their enable --now call, or (b)
  something else, has not been decided. Also open: whether ensure_healer_units
  and ensure_watcher_units should share one helper for this check (they
  currently appear to be separate functions with parallel logic) to avoid fixing
  one and missing the other. Needs an /align-tactics round to decide scope and
  implement."
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: a deliberate systemctl --user disable --now of
    dispatch-fleet-watch.timer or dispatch-heal.timer survives a full
    dispatch-schedule-reseed cycle without being silently re-enabled
  sensor: "manual test: disable a timer, wait one full reseed interval (or force a
    reseed cycle), confirm systemctl --user is-active still reports
    inactive/disabled"
  threshold: the timer stays disabled across at least one full reseed cycle when
    the new opt-out sentinel is present; ensure_*_units still self-heals a
    poisoned or failed unit when NO opt-out sentinel is present (the existing
    bug-B/bug-O healing behavior must be unaffected)
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# dispatch-schedule-reseed's ensure_healer_units and ensure_watcher_units calls run unconditionally on every reseed cycle and silently re-enable a manually-disabled watchdog timer within roughly 15-30 minutes, with no sentinel or opt-out mechanism to honor an intentional disable
