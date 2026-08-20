---
id: tactic-allowlist-coverage-invocation-form-observation
kind: tactic
statement: "Observation carrier: allowlist coverage for a sanctioned script is
  an invocation-form question spanning two matchers, not a single-pattern
  question - decide whether strategy-owned-orchestration's wrapper-to-matcher
  doctrine should record it"
owner: human
status: delegated
parent: null
rationale: Immaterial Side-B drift surfaced by the 2026-08-20 /align-tactics
  per-node finalize of tactic-graph-commit-invocation-classifier-bypass. A
  per-node tactic-target session may not write clarifications onto its serving
  strategy (strategy-graph-native-dispatch clarification 118 is OVERTURNED
  2026-08-15; clarification 245 binds), so the observation is carried here as a
  born-parked node for a human to promote, mechanize, or drop at office hours.
reading: null
serves:
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
office_hours:
  reason: "Observation carrier, not executable work - do NOT dispatch this node.
    The 2026-08-20 /align-tactics finalize of
    tactic-graph-commit-invocation-classifier-bypass surfaced one immaterial
    premise that generalizes past that node and is addressed to
    strategy-owned-orchestration's own record, which a per-node tactic-target
    session is forbidden to write. Verbatim, for paste-ready promotion:
    '(Recorded 2026-08-20 /align-tactics per-node finalize, extending the
    2026-07-21 classifier-bypass doctrine.) A `Bash(<cmd>:*)` entry feeds TWO
    distinct approval mechanisms with different matching rules, and the spelling
    chosen determines which invocation forms are covered. The harness static
    allowedTools matcher matches from the start of the command string, so a
    full-relative-path entry
    (`Bash(packages/intentionsutil/scripts/graph-commit:*)`) covers only the
    worktree-local relative form. The repo own PreToolUse hook is separate:
    .claude/hooks/approve-workflow-commands.sh:49-61 harvests every single-token
    entry into ALLOWED_CMDS, and is_allowed_cmd() (lines 117-131) approves when
    the invoked token basename equals the entry OR the token equals the entry
    exactly - its SCRIPT_RE fast path (line 26) covers only
    `.claude/skills/*/scripts/*`, which graph-commit is not under. Consequence:
    absolute-path invocations (the shape sandbox.md prescribes from a worktree,
    e.g. dispatch-conflict Lane 3
    `\"$PROJECT_ROOT/packages/intentionsutil/scripts/graph-commit\" -C
    \"$PROJECT_ROOT\" ...`) are approved by the hook only via a bare-basename
    entry. Allowlist coverage is an invocation-form question, not a
    single-pattern question.' Status note so the disposition is made on accurate
    state: nothing from this observation was landed on
    strategy-owned-orchestration by that round, and its substance IS already
    scheduled for mechanization - Unit 3 of
    tactic-graph-commit-invocation-classifier-bypass writes the two-gate
    doctrine into .claude/rules/sandbox.md, and Unit 4 pins the spelling with a
    CI regression test. So the only open question is whether the strategy's own
    clarification record should carry it too."
  since: 2026-08-20
  recommendation: Pick one of three dispositions at office hours. (1) DROP - judge
    that Unit 3's .claude/rules/sandbox.md note plus Unit 4's CI test fully
    discharge the observation, since doctrine that is mechanically enforced does
    not also need a clarification; then prune this node. (2) CLARIFY-ONLY -
    append the verbatim text above as a dated clarification on
    strategy-owned-orchestration via an /align-strategy sitting or a
    strategy-target /align-tactics round, extending the 2026-07-21
    classifier-bypass clarification, because the two-matcher distinction is
    doctrine that outlives any one script's allowlist entry; then prune this
    node. (3) MECHANIZE FURTHER - decide the invocation-form rule should bind
    every sanctioned script rather than just the graph-write pair, and mint a
    real tactic to sweep .claude/settings.json for entries whose spelling does
    not match their documented call sites. Note (2) soft-freezes every open
    child of strategy-owned-orchestration (clarifications is an allowlist member
    of strategyFingerprint), so prefer (1) unless the doctrine value is judged
    to outweigh a re-plan sweep.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier: allowlist coverage for a sanctioned script is an invocation-form question spanning two matchers, not a single-pattern question - decide whether strategy-owned-orchestration's wrapper-to-matcher doctrine should record it
