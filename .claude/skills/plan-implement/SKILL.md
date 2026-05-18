---
name: plan-implement
description: Implement phase — plan logical units of work, build each one, and open a draft PR
---

# Plan and Implement

The `implement` phase of the issue workflow, dispatched by `/dispatch`. Plans the
work as an ordered list of logical units, builds each unit, and opens a draft PR.
One draft PR with a `Closes #N` line is the implement→verify transition marker.

**The main thread never edits files.** It plans and delegates: every code change
happens in a subagent. Each unit is built by `/implement-unit`, which launches an
implementation subagent and forks `/commit-merge-push`.

## Steps

### 1. Plan logical units

**Idempotency guard — check this first.** If an approved plan for this dispatch is
already present in context (typical after `showClearContextOnPlanAccept` fires — the
user accepted a plan and then cleared the context, causing this skill to be
re-invoked), skip planning and resume at Step 2. The plan persists across context
clears, so the unit list remains visible even though the planning conversation is
gone.

Otherwise, invoke `EnterPlanMode` and produce a plan whose implementation section is
an **ordered list of logical units of work**. Each unit specifies:

1. **Scope.** What files/behavior change, what is explicitly out of scope.
2. **Model.** `opus` or `sonnet`, chosen per the model-selection heuristic in
   `/implement-unit` — see that skill for the heuristic (it is the canonical home;
   do not restate it here).
3. **Dependencies.** Any prior units that must complete first, so build order is
   explicit.

Each unit becomes one commit. The user reviews and approves the plan.

The plan must include a **plan preface** per `ref-memory-management`'s Clean Context
Planning Rule: the plan assumes execution in a clean context, lists every skill from
the issue state's `active_skills` to re-invoke before executing, and records that
the active workflow step is the `implement` phase of `/dispatch`.

### 2. Build each unit

For each approved unit, in dependency order, invoke `/implement-unit` via the Skill
tool, passing:

- `model` — the unit's planned model.
- `scope` — the unit's scope.
- `context` — the plan and issue context the unit needs.
- `commit_intent` — the "why" of this unit's change.

`/implement-unit` launches the implementation subagent, forks `/commit-merge-push`,
and recovers from merge / pre-commit / push errors. This is a normal in-session loop
— **do not clear context between units**.

### 3. Open the draft PR

After every unit is committed and pushed, create the draft PR (use
`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh pr create --draft --title "<short summary>" --body "$(cat <<'EOF'
Closes #<primary-issue>
Closes #<sub-issue-or-blocker>   # repeat for each implemented issue
EOF
)"
```

The body has one `Closes #N` line per issue implemented in this PR — the primary
issue plus any implemented sub-issues or blockers. This draft PR is the
implement→verify transition marker.

### 4. Stop

Stop. `/loop /dispatch` advances to the `verify` phase.

## Requirement changes mid-session

If the user revises a requirement during this session, invoke `/new-requirement` —
it clarifies, updates remote issues, re-syncs `CLAUDE.local.md`, and revises this
plan. Do not handle re-sync inline.
