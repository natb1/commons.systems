---
id: tactic-model-portability-inventory
kind: tactic
statement: "Committed model-portability inventory: enumerate every
  Anthropic/Claude-specific coupling in the workflow, classified by
  migration-gating severity"
owner: ai
status: codified
parent: null
rationale: "The portability clause of strategy-open-weight-readiness's rationale
  — the skill system is markdown and scripts, so the discipline is mostly
  refusing vendor-specific features that would gate a migration — has no
  recorded baseline: nothing enumerates where the workflow IS vendor-coupled
  today. delegation-anthropic-claude lists imported divergences (including the
  Workflow-primitive runtime semantics) but not a file-level inventory. This
  tactic produces the structural half of the strategy's gap picture: a
  committed, path-anchored inventory the owner reviews at office-hours alongside
  drill results. Report-only by design — enforcement (a CI lint ratchet per
  strategy-owned-orchestration's enforcement-tiers clarification) is a later
  round's decision, informed by this inventory plus the first drill report. Off
  the signal path (the reading comes from drills), so it carries no validates
  edge and derived attention demotes it. Minted 2026-07-11 /align-tactics
  round."
reading: null
gap: null
serves:
  - strategy-open-weight-readiness
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-model-portability-inventory
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 2cf5eeaaedc3a1cd6a41f5fa11f7f4516125aa8e1afac140674754eeb72030f9
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Committed model-portability inventory: enumerate every Anthropic/Claude-specific coupling in the workflow, classified by migration-gating severity

## Context

`strategy-open-weight-readiness` keeps the open-weight recovery substrate warm.
Its rationale's portability clause — "the skill system is markdown and scripts,
so the discipline is mostly refusing vendor-specific features that would gate a
migration" — currently has no recorded baseline: nothing enumerates where the
workflow is in fact vendor-coupled today. The delegation record
`intentions/delegation-anthropic-claude.md:50` already names the newest coupling
("orchestration runtime semantics — the dispatch tick's fan-out executes on the
Claude Code Workflow primitive") as an imported divergence, but there is no
file-level inventory anywhere.

This tactic produces that baseline: a committed, path-and-line-anchored
inventory of every Anthropic/Claude-specific coupling across the workflow,
classified by what breaks on a non-Claude harness and how costly the migration
is. The owner reads it at office-hours alongside recorded drill results (the
strategy's sensor) — the inventory is the structural half of the capability-gap
picture; the drills are the empirical half.

Report-only by design: no enforcement lint and no code change in this tactic.
Enforcement (a CI lint ratchet, per `strategy-owned-orchestration`'s
enforcement-tiers clarification) is a later round's decision, informed by this
inventory plus the first drill report
(`intentions/tactic-recovery-drill-open-weight.md`).

## Units of work

Implement each unit in a subagent launched with the unit's Recommended model,
supplying this Context and the unit's Scope; constrain it to working-tree edits.

### Unit 1 — Author `ops/model-portability.md`

**Scope.** One new file: `ops/model-portability.md` (the `ops/` directory
exists and holds operational material — `ops/monitoring`, `ops/scripts`). No
other file changes; no code changes; no lint; no harness recommendation beyond
noting whether an open equivalent exists.

Survey the workflow surface — `.claude/skills/**` (SKILL.md bodies and
`scripts/`), `.claude/rules/**`, `dispatch.config/**`, and
`packages/intentionsutil/**` (expected portable; confirm) — and inventory every
Anthropic/Claude-specific coupling. Seed classes and known anchors (verify each
and extend by fresh grep; do not treat this list as exhaustive):

- **(a) Model-id routing** — the audit-written policy artifact
  `dispatch.config/phase-model-policy.json` read by
  `.claude/skills/dispatch-propagate/scripts/dispatch-phase-model:20` and
  consumed at
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:95`;
  per-unit `Recommended model: sonnet|opus` plan tags whose heuristic lives at
  `.claude/skills/implement-unit/SKILL.md:31`; model names embedded in
  `.claude/skills/review-fix/SKILL.md`, `.claude/skills/qa-fix/SKILL.md`,
  `.claude/skills/office-hours/SKILL.md`, `.claude/skills/fix-checks/SKILL.md`,
  `.claude/skills/dispatch-conflict/SKILL.md`,
  `.claude/skills/commit-merge-push/SKILL.md`.
- **(b) Harness/CLI mechanics** — the `claude --bg` spawn primitive
  (`.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:2`,
  `dispatch-spawn-tick:6`), session liveness via `claude agents --json`
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:6`) and the
  local Claude daemon socket it implies.
- **(c) Workflow-primitive semantics** — `agent()` fan-out contracts invoked
  through the Workflow tool (`.claude/skills/review-fix/SKILL.md:10`,
  `.claude/skills/qa-fix/SKILL.md`); this is the divergence
  `intentions/delegation-anthropic-claude.md:50` records.
- **(d) Built-in harness features skills assume** — Explore/Plan subagents,
  the Skill tool, `AskUserQuestion`, `EnterWorktree`, the sandbox permission
  model (`.claude/rules/sandbox.md`), hook enforcement (`settings.json`
  hooks).
- **(e) Portable-by-construction counter-list** — plain-markdown skill bodies,
  plain bash scripts, the intentions graph and `packages/intentionsutil` (pure
  TypeScript over files), CI workflows.

For each coupled item record: the anchor (`path:line`), what breaks on a
non-Claude harness, a migration-cost class (mechanical rename / adapter needed
/ architectural), and whether an open equivalent exists. Close the document
with a short "what would gate a migration today" summary ordered by severity —
this summary is what the office-hours review reads next to drill reports.

**Recommended model:** opus

**Dependencies:** none.

## Reuse

- `intentions/delegation-anthropic-claude.md` `attributes.divergence.imported`
  — the seed taxonomy of already-acknowledged couplings.
- `strategy-owned-orchestration`'s enforcement-tiers clarification
  (`intentions/strategy-owned-orchestration.md`) — the reason this tactic is
  report-only.
- Plain `grep -rn` over `.claude/` — no new tooling; the survey is grep plus
  judgment.

## Verification

```verify
# `ops/model-portability.md` is Unit 1's OWN deliverable — a forward reference.
# Until Unit 1 lands, this fence is RED, and that is the correct reading.
# As written it was GREEN with the file absent: `test -f` was non-final so its
# status was discarded, and the missing operand made `grep -oE` exit 2 into an
# empty stream whose trailing `while` loop then exited 0.
DOC=ops/model-portability.md
test -f "$DOC" || { echo "FAIL: $DOC does not exist (Unit 1 has not landed)"; exit 1; }
# every repo path cited in the inventory resolves
cited=$(LC_ALL=C grep -aoE '(\.claude|dispatch\.config|packages|intentions|ops)/[A-Za-z0-9_./-]+' "$DOC"); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: grep errored (rc=$rc)"; exit 1; }
missing=$(printf '%s\n' "$cited" | LC_ALL=C sed 's/:[0-9]*$//' | sort -u \
  | while IFS= read -r p; do [ -n "$p" ] || continue; [ -e "$p" ] || echo "$p"; done)
[ -z "$missing" ] || { printf '%s\n' "$missing" | sed 's/^/MISSING: /'; echo "FAIL: the inventory cites paths that do not resolve"; exit 1; }
echo OK
```

Prose checks (judgment, at review): the inventory covers all five classes
above; every entry carries a `path:line` anchor; the closing summary orders
gating items by severity; the document makes no code changes and recommends no
specific replacement harness (that choice is the author's, informed by drill
data). End-to-end: the owner can read `ops/model-portability.md` at
office-hours next to a drill report and state the current structural
migration gap without opening any other file.
