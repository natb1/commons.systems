---
id: tactic-eval-finding-align-tactics-worker-transcript-unscanned
kind: tactic
statement: dispatch-graph-execute spawns the align-tactics phase with --cwd
  PROJECT_ROOT so the worker top-level transcript lands in the main-checkout
  project directory, which aggregate-usage.sh candidate-file find restricts away
  by matching only *worktrees* and *--bare directories — so the orchestrating
  turn that writes the plan is unreachable at every scope (--node, --session and
  fleet) and every align-tactics evaluation ever produced has measured only
  subagents
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: worker_transcript_bytes_unscanned
      value: 1416037
      unit: bytes
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: session_scope_rows_returned_excluding_worker
      value: 7
      unit: sessions
      window: session adaffcf8-1144-41bf-b038-e0cddc37f89e
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: measured_subagent_price_proxy_usd
      value: 65.92
      unit: usd
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: measured_subagent_turns
      value: 257
      unit: turns
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed on `tactic-attention-per-tier-boost-migration`, `align-tactics` phase, 2026-08-14

Minting the missing `dispatch-stamp` sidecar
(`tactic-eval-finding-ladder-worker-unstamped-audit-blind`) would still not make
the `align-tactics` phase measurable. Its worker transcript is not in a
directory `aggregate-usage.sh` ever looks at.

## The mechanism

`dispatch-graph-execute:205-212` spawns the `align-tactics` phase — and only
this phase, plus the strategy lane — with `--cwd "$PROJECT_ROOT"`, deliberately:

```sh
if [[ "$kind" == "strategy" || "$phase" == "align-tactics" ]]; then
  # /align-tactics owns its own worktree claim/entry … Spawn cwd=PROJECT_ROOT
  # and let the skill enter its worktree.
  if "$SCRIPT_DIR/dispatch-spawn-job" --no-verify --name "$id" \
      --cwd "$PROJECT_ROOT" …
```

Claude Code keys a session's **top-level** transcript on its *launch* cwd, so
the worker's own `.jsonl` lands in the main-checkout project directory
`~/.claude/projects/-home-n8-natb1-commons-systems/`. Only after the skill runs
`EnterWorktree` do its **nested** artifacts (subagents, workflows, tool-results)
land under `…--claude-worktrees-<node-id>/<sid>/`.

`aggregate-usage.sh:1456-1459` builds its candidate file list from exactly two
kinds of project directory:

```sh
find "$PROJECTS_ROOT" -mindepth 1 -maxdepth 1 -type d \
  \( -name '*worktrees*' -o -name '*--bare' \) -print0 \
| xargs -0 -r -I{} env TZ=UTC find {} -name '*.jsonl' …
```

`-home-n8-natb1-commons-systems` matches neither glob. The `--session` and
`--node` filters are applied *inside* that loop, so **no scope can reach the
file** — not `--session`, not `--node`, not a fleet run.

## The measurement, with its positive control

This phase's worker is session `adaffcf8-1144-41bf-b038-e0cddc37f89e`.

- Its top-level transcript exists and is substantial:
  `~/.claude/projects/-home-n8-natb1-commons-systems/adaffcf8-1144-41bf-b038-e0cddc37f89e.jsonl`,
  **1,416,037 bytes**, mtime 2026-08-14 12:36 local.
- Its nested artifacts are under
  `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-per-tier-boost-migration/adaffcf8-…/`.
- `aggregate-usage.sh --session adaffcf8-1144-41bf-b038-e0cddc37f89e` returns
  `files_scanned: 7` — **six `agent-*.jsonl` subagents plus the workflow
  `journal`, and not the worker.** No session row carries the worker's id.

That is the positive control the absence needs: the instrument demonstrably
sees this exact session's family, and demonstrably cannot see the session
itself.

## What is lost, and why it matters most here

Everything the orchestrating turn did: its `turns`, `peak_context`, `hit_ratio`,
its `dispatch.outcome.v1` object, its `permission_friction`, and all of its own
token spend. This evaluation could report only the six-subagent fan-out —
$65.92 price proxy / $17.15 cost / 257 turns — with the orchestrator's share
unknown and unbounded.

The phase this hits is the worst possible one. `align-tactics` is the phase
lens 5 (plan-quality yield) exists to measure, and the plan is written by the
orchestrating turn — the exact turn that is invisible. Every `align-tactics`
evaluation the ladder has ever produced, on every node, has measured only
subagents.

## What would have to change

Either widen the candidate-directory glob at `aggregate-usage.sh:1457-1458` to
include the plain project-root directory, or spawn `align-tactics` with a cwd
whose project directory the glob already matches. The first is the smaller
change and also fixes the strategy lane, which has the same shape. Related but
distinct: `tactic-eval-finding-eval-since-bound-excludes-worker` drops the
worker via the `started_at` filter *after* it has been scanned; this entry is
about the file never being scanned at all, so fixing that one does not fix this.
