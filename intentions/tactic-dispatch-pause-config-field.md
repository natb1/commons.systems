---
id: tactic-dispatch-pause-config-field
kind: tactic
statement: Replace the dispatch pause sentinel file with a
  dispatch.config/*.json boolean field as the sole mechanism, failing closed on
  any config read error
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-26 /align-strategy interview (pause-field and
  XDG-divergence clarifications on strategy-graph-native-dispatch). The author
  requires dispatch scheduling pause to be configurable alongside max concurrent
  workers, the weekly usage target floor, and worker auto-close; those three
  already resolve through dispatch-config-load, while pause alone is a
  filesystem sentinel. Carries the design decided in the interview:
  sole-mechanism replacement (no dual path), fail-closed error handling,
  verbatim preservation of spawn-gating-only semantics and the manual-dispatch
  override, and migration of the two in-repo references to the old sentinel
  path. Multi-entry serves is honest rather than nearest-fit: pause semantics
  are owned by strategy-graph-native-dispatch, the dispatch.config/ artifact
  shape by strategy-owned-orchestration."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-owned-orchestration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Replace the dispatch pause sentinel with a dispatch.config field

## Context

Three of the four operator-facing dispatch parameters already resolve through
`dispatch-config-load`: `max_concurrent_workers` (default 8,
`.claude/skills/dispatch-propagate/scripts/dispatch-target-workers:226`),
`weekly_pace_floor_pct` (default 50, same file:219), and the worker auto-close
toggle (drafted as `tactic-worker-self-close-configurable`). Pause alone is a
filesystem sentinel — presence of
`${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused`
(`.claude/skills/dispatch-propagate/scripts/dispatch-tick:266`).

The 2026-07-26 `/align-strategy` round resolved that pause becomes a
`dispatch.config/*.json` boolean field and that the field is the **sole**
mechanism — the sentinel is deleted, not kept as a dual path. See the
pause-field, XDG-divergence, and steelman clarifications of that date on
`strategy-graph-native-dispatch`, and the amended condition 16 (the
paused-scheduling standing-mode condition).

## Scope

- **Field and default.** Add the boolean to `dispatch.config/`, default
  `false` (not paused) — matching today's absent-sentinel default. Whether it
  lands in `target-workers.json` or a new file is a plan-time decision; a new
  file keeps pace-curve config and operating-mode config separable.
  Add the matching `*.example.json` entry alongside
  `.claude/skills/dispatch-propagate/scripts/target-workers.example.json`.
- **Fail closed.** Pause evaluation must treat **any** config resolve/read/parse
  failure as **paused**. `dispatch-config-load` exits 2 outside a git repo
  (`dispatch-config-load:342-344`), exits 1 on invalid JSON, and prints
  `no-config` at exit 0 when the file is absent (`:351-354`). Once
  `tactic-dispatch-config-template` makes `dispatch.config` a symlink into a
  private instance repo, a dangling symlink or unmounted checkout would
  otherwise silently **resume the fleet**. The old `[[ -e "$FLAG" ]]` test had
  no such failure mode, so this is net-new risk introduced by the migration.
  Follows `.claude/rules/code-style.md` and matches `dispatch-tick`'s existing
  fail-loud stance when `lib-reservation-ledger.sh` fails to load
  (`dispatch-tick:288-296`).
- **Semantics preserved verbatim.** The field gates worker **spawning** only and
  never reservation-ledger bookkeeping; `dispatch --manual` still **overrides**
  the pause; the ledger reap that runs on the paused branch *ahead of* the
  short-circuit (`dispatch-tick:267-300`) is unchanged.
- **Migrate both in-repo references** to the sentinel path:
  1. `dispatch-tick:266-267` — the `DISPATCH_PAUSE_FLAG` resolution and the
     `-e` test.
  2. `intentions/tactic-manual-path-reservation-sweep.md:68` — a **body**
     citation of `$XDG_DATA_HOME/commons-dispatch/paused`.
- Keep a test seam equivalent to today's `DISPATCH_PAUSE_FLAG` override so the
  dispatch test suite can drive pause state without touching real config.

## Out of scope

- Moving `dispatch.config/` to `$XDG_CONFIG_HOME`. The 2026-07-26 round
  **diverged** from literal XDG deliberately; `dispatch.config/` stays
  project-root-resolved with the instance-repo symlink.
- Any change to `max_concurrent_workers` or `weekly_pace_floor_pct`, which are
  already configurable and already carry the required defaults.
- The pace curve's own semantics, and the `--exhausted` hard floor.

## Dependency note

`tactic-manual-path-reservation-sweep` is at phase `qa`. Its body must **not**
be edited from an interview round — a body edit trips that tactic's own
`.scope-fingerprint` custody gate and demotes it back to `implement`. Sequence
the citation update **after** it lands, or fold it into this tactic's own PR
once that node reaches `done`.

## Reuse

- `dispatch-config-load` (`.claude/skills/dispatch-propagate/scripts/`) — the
  existing config read path, including its `DISPATCH_CONFIG_DIR` test seam.
- `resolve_project_root` (`.claude/skills/dispatch-propagate/scripts/lib.sh:1837`).
- The existing paused branch in `dispatch-tick:267-300`, including its
  `reservation_sweep` call — reuse as-is, only the condition changes.

## Verification

- The dispatch test suite covering the paused branch, extended with cases for:
  field absent (not paused), field `true` (paused), field `false` (not paused),
  invalid JSON (**paused** — fail closed), and config dir unresolvable
  (**paused** — fail closed).
- A manual check that `dispatch --manual` still overrides a `true` field, and
  that the reservation ledger is still swept on a paused tick.
- `grep -rn 'commons-dispatch/paused'` over the repo returns no live code
  references once migration completes.
