---
name: dispatch-propagate
description: "Retired: the autonomous dispatch tick is now the headless dispatch-tick script (launched by dispatch-spawn-tick); see /dispatch for the manual entry point."
---

# Dispatch (propagate) — retired

The autonomous dispatch tick no longer runs as a model session. It is the
headless `.claude/skills/dispatch-propagate/scripts/dispatch-tick` script, which
runs `dispatch-select-tick` then `dispatch-materialize-spawn` with no
model-decision seam.

`dispatch-spawn-tick` launches that script as a transient `systemd-run --user`
unit. The worker Stop-hook (`.claude/hooks/dispatch-stop.sh`) and the reseed
timers (`dispatch-schedule-reseed`, `dispatch-schedule-target-reseed`) drive the
chain by calling `dispatch-spawn-tick` — there is no per-tick `claude --bg`
router session anymore. Model sessions exist only for workers (the phase skills
doing real judgment).

The routing this skill used to document — selecting the target, gating on the
concurrency budget, materializing the worktree, and spawning the worker — now
lives in the `dispatch-tick` script header and in `reference.md`.

A human runs `/dispatch [<N>]` to invoke one tick interactively and relay its
result.
