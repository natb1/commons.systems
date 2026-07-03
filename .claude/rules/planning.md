# Interactive Planning

This rule applies when a session uses the built-in interactive planning tool
(`EnterPlanMode` → `ExitPlanMode`). It governs the plan that tool produces.
It is advisory guidance the model follows on entering interactive planning —
not hook-enforced — so no hook alternative is proposed.

## Produce clean-session-executable plans

The plan must be self-contained: a fresh session with no memory of the planning
session must be able to execute it from the plan text alone.

Required sections match the `/plan-issue` plan-comment schema
(`.claude/skills/plan-issue/SKILL.md`, "Plan-comment output schema", lines 500–527):

- **Context** — why the change is being made (problem, need, intended outcome).
- **Scope** per unit — what files/behavior change, what is explicitly out of
  scope, with `path:line` anchors.
- **Dependencies** — prior units that must complete first (omit if none), so
  execution order is explicit in the plan text.
- **Reuse** — existing functions/utilities to reuse, with their file paths.
- **Verification** — how to test the change end-to-end. Auto-runnable checks
  (test suites, typechecks, builds) go in fenced ` ```verify ` blocks; manual
  steps, judgment calls, and observe-in-production checks stay as prose.

Do not rely on context loaded during the planning session (open files, prior
search results, skill bodies). Every fact the implementer needs must appear in
the plan text.

## Tag each unit with a model and delegate implementation to a subagent

Each logical unit of the plan must carry a **Recommended model** (`sonnet` or
`opus`), chosen per the model-selection heuristic — whose single canonical home
is `.claude/skills/implement-unit/SKILL.md` ("Model-selection heuristic",
lines 31–39; canonical home declared at lines 17–18). Do not restate the
heuristic bullets here.

The plan must also include explicit instructions to implement each unit in a
subagent launched with the unit's selected model. Mechanism: spawn a subagent
via the Agent or Task tool with `model` set to the unit's chosen value
(`model: sonnet` or `model: opus`). Supply the unit's `context` and `scope`
to the subagent prompt; constrain it to working-tree edits only.

Do not mandate `/implement-unit` or any `dispatch-*` script — those commit,
merge, and push, which is dispatch-specific behavior outside the scope of
interactive sessions.
