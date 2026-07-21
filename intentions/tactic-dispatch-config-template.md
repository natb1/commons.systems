---
id: tactic-dispatch-config-template
kind: tactic
statement: "office-hours-nate template: record the dispatch.config/
  instance-repo convention — tracked human-edited config, gitignored
  machine-written artifacts, symlink lookup"
owner: ai
status: codified
parent: null
rationale: "The claude-executable half of the dispatch.config/ migration
  (strategy clarification of 2026-07-11 on the operator-config home; drafted at
  tactic-dispatch-config-instance-repo). Every monorepo read already funnels
  through dispatch-config-load with a DISPATCH_CONFIG_DIR seam, so no script
  behavior changes — the deliverable is the recorded convention: the
  examples/office-hours-nate template gains the dispatch.config/ directory shape
  (.gitignore for machine-written artifacts, README with the symlink bootstrap
  and pointers to the canonical *.example.json schemas), so the human migration
  sitting (tactic-dispatch-config-instance-repo, blocked on this) follows a
  written procedure instead of reconstructing the design. Minted 2026-07-11
  /align-tactics round."
reading: null
gap: null
serves:
  - strategy-owned-orchestration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-dispatch-config-template
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint:
    strategy-owned-orchestration:
      hash: 5676f66f6e8500eb8752095c960615ded3fc06d00df9ab5c3038af3f9b700aec
      sha: bc642990d1344d4418bafdc924ef77e3903b0b61
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# office-hours-nate template: record the dispatch.config/ instance-repo convention — tracked human-edited config, gitignored machine-written artifacts, symlink lookup

## Context

`strategy-owned-orchestration` records (2026-07-07 interview clarification)
that private operator config belongs in the version-controlled instance repo
(natb1/office-hours-nate; `examples/office-hours-nate/` is the in-repo
template), and that the git-untracked `dispatch.config/` is transitional
operator state. The 2026-07-11 decomposition decided the retained design
questions (strategy clarification, 2026-07-11):

- **Human-edited fleet-behavior config migrates, tracked** —
  `target-workers.json`, `auto-merge.json`, `epic.json`, plus any
  operator-authored optional configs from the `dispatch-config-load` set
  (projects, jit, statements, sweep, force-opus, strict-preflight,
  selection-lock) — so pace-curve pins and auto-merge gating get reviewable
  history.
- **Machine-written control artifacts stay in the SAME directory but
  gitignored in the instance repo** — `phase-model-policy.json` (written
  unconditionally by `/dispatch-token-audit` step 7; delete-to-revert
  semantics) and the `*.bak.*` / `*.prepause*` backups. Regenerable outputs;
  no auto-commit machinery.
- **Lookup is a host symlink**: `<project-root>/dispatch.config` →
  `<instance-checkout>/dispatch.config`. `dispatch-config-load` resolves the
  same project-root path through the symlink unchanged, and
  `DISPATCH_CONFIG_DIR` stays the test seam
  (`.claude/skills/dispatch-propagate/scripts/dispatch-config-load:23-28`).
  No script behavior changes.

This tactic lands the convention in the template so the human migration
sitting (`tactic-dispatch-config-instance-repo`, blocked on this tactic)
follows a written procedure instead of reconstructing the design.
Single-source discipline: do NOT duplicate the `*.example.json` files — the
canonical schema set stays at
`.claude/skills/dispatch-propagate/scripts/*.example.json`; the template
points at them.

## Unit 1 — template dir + README section + loader doc note

Recommended model: sonnet

Scope:

- New `examples/office-hours-nate/dispatch.config/.gitignore` listing the
  machine-written set: `phase-model-policy.json`, `*.bak.*`, `*.prepause*`.
- New `examples/office-hours-nate/dispatch.config/README.md` (short): which
  files belong here (the human-edited list above), a pointer to the
  canonical `*.example.json` schemas in
  `.claude/skills/dispatch-propagate/scripts/`, and the
  machine-written/gitignored distinction with the delete-to-revert note for
  `phase-model-policy.json`.
- Extend `examples/office-hours-nate/README.md` with a "dispatch.config"
  section, matching the file's existing numbered-steps register: copy this
  directory into the private instance repo; populate from live values; on
  the host, replace the untracked `<project-root>/dispatch.config` with a
  symlink to the instance checkout; verify with
  `.claude/skills/dispatch-propagate/scripts/dispatch-config-load target-workers`.
- Add a brief note to `dispatch-config-load`'s header comment (the config
  location block, `:12-14`): the directory is expected to become a symlink
  into the operator's instance repo once migrated; the `DISPATCH_CONFIG_DIR`
  override is unchanged.

Out of scope:

- Any behavior change to `dispatch-config-load` or its tests.
- The actual migration (private-repo commits, host symlink) — the human
  sitting at `tactic-dispatch-config-instance-repo`.
- Moving `phase-model-policy.json`'s write path in `/dispatch-token-audit`.
- Duplicating `*.example.json` contents into the template.

## Reuse

- `examples/office-hours-nate/README.md` — extend its structure and
  register (the nix instance-flake steps); do not fork the style.
- The canonical example configs at
  `.claude/skills/dispatch-propagate/scripts/*.example.json`.
- The schema documentation already inside `dispatch-config-load`'s header.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: create a temp dir containing a valid `target-workers.json`, symlink a
second path to it, and run
`DISPATCH_CONFIG_DIR=<symlinked-path> .claude/skills/dispatch-propagate/scripts/dispatch-config-load target-workers`
— prints the normalized JSON, demonstrating the through-symlink read the
convention relies on (expected to pass unchanged today).

## Implementation notes

Single unit; implement in a subagent launched with `model: sonnet`; supply
this Context and the Unit 1 Scope in the subagent prompt; constrain it to
working-tree edits only.
