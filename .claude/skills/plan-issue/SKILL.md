---
name: plan-issue
description: Plan phase — autonomously plan a no-PR issue into an ordered unit breakdown via the built-in Explore/Plan subagents, persist the plan to the issue, and apply dispatch:planned (no user gate; escalates to office-hours only on genuine ambiguity)
---

# Plan Issue

The `plan` phase of the issue workflow, dispatched by `/dispatch-propagate` —
sibling to `/qa-fix` and `/review-fix`. It plans a no-PR issue into an ordered
list of logical units of work and **persists the plan to the issue** as a
`<!-- dispatch:plan -->` comment, then applies `dispatch:planned`. The
`implement` phase (`/implement`) reads that
comment in a fresh worker and builds from it.

This is the autonomous front half of what `/plan-implement` previously did inline. It
replaces plan mode: there is **no `EnterPlanMode`/`ExitPlanMode`**, no
user-approval gate, and no context-clear-on-accept. The phase boundary *is* the
context clear — the persisted plan comment is the only carrier between this phase
and the build. The user is pulled in only when planning hits genuine ambiguity or
a major scope deviation, via `AskUserQuestion` → office-hours.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fan out the built-in `Explore` and `Plan` subagents directly (no orchestrator
skill, no nesting). The exploration and design subagents are direct children of
this session.

Run `gh` commands and the scripts that invoke `gh` (`dispatch-context-pack`,
`dispatch-drift-scan`, `dispatch-read-plan`, `dispatch-write-plan`,
`dispatch-apply-planned`, `dispatch-mark-complete`, `dispatch-plan-finalize`)
with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## The running session has no plan mode

The built-in plan-mode workflow normally injects its instructions as tool
guidance when `EnterPlanMode` is active. This session does **not** enter plan
mode, so it never receives them. The adopted plan-mode instructions are therefore
reproduced **verbatim in the appendix** below — follow them as the authority for
how to explore, design, review, and shape the plan artifact, with the two
substitutions the appendix documents.

## Idempotency preamble and target resolution

`/plan-issue` operates in place — the **current worktree dictates the target**.
The session must be in a target worktree: the current branch is `<N>-…`, where
`<N>` is the issue number. The router (`/dispatch-propagate`) is responsible for
entering the target worktree; this skill never switches.

```bash
BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$BRANCH" in
  [0-9]*-*) N="${BRANCH%%-*}" ;;
  *)
    echo "/plan-issue: current branch '$BRANCH' is not a target worktree (expected '<N>-…')" >&2
    exit 1
    ;;
esac
```

Then check whether a plan was already persisted, keying the skip on the **plan
comment** — the durable record of the expensive planning work — not on the
`dispatch:planned` label. Read the persisted plan, capturing its stdout (use
`dangerouslyDisableSandbox: true` — `dispatch-read-plan` calls `gh`). The script
exits non-zero with a clear diagnostic when no `<!-- dispatch:plan -->` comment
exists; treat that non-zero exit as "no plan comment":

```bash
EXISTING_PLAN=$(.claude/skills/dispatch-propagate/scripts/dispatch-read-plan "$N") \
  && HAVE_PLAN=1 || HAVE_PLAN=0
```

**Plan comment exists** (`HAVE_PLAN=1`) — a prior session already did the
expensive planning (explore / design / persist), and that work is durable.
**Skip Steps 1–6.** Re-finalize so the *current* session writes its own marker
and the chain advances — pipe the already-read plan back through finalize so
there is no second fetch (`dangerouslyDisableSandbox: true` — `dispatch-plan-finalize`
calls `gh`):

```bash
printf '%s' "$EXISTING_PLAN" | \
  .claude/skills/dispatch-propagate/scripts/dispatch-plan-finalize "$N"
```

Then **stop**. `dispatch-plan-finalize` runs three steps in order:
`dispatch-write-plan` re-writes the identical comment (a harmless refresh, never
a second comment), then `dispatch-mark-complete` writes **this** session's
marker, then `dispatch-apply-planned` re-adds the label idempotently. With the
marker now present, `dispatch-stop.sh` Branch B advances the chain to
`implement`.

**No plan comment** (`HAVE_PLAN=0`) — a genuine fresh run, or a crash before the
plan was ever persisted. Run all the steps below in order.

This mirrors the `/implement` pattern: skip the expensive work when its durable
artifact already exists, but **always write the marker** for the running session
(`/implement` skips its build when a PR already exists but still writes the
marker, to cover a same-tick crash between PR-open and marker-write). The
`dispatch:planned` label is **no longer** the idempotency signal — the persisted
plan comment is the durable signal, and the marker is always (re)written for the
running session. Recovery when a prior session crashed in the window routes
through office-hours' plan-clarification path: it is office-hours-recoverable,
**not** a fully autonomous self-heal, because the autonomous tick skips
office-hours-labelled issues.

## Steps

### 1. Pre-Planning relevance review — main thread

This is the **opening step** of `/plan-issue`. Before planning a no-PR, unplanned
target, run a creation-date-anchored drift analysis. It is the planning-time
counterpart of the creation-time relevance check; the two are deliberately
separate — the creation-time check is `$BASELINE_BRANCH`-anchored, this step is
pre-planning and `createdAt`-anchored.

Run the opening live-context call (`dangerouslyDisableSandbox: true` — it calls
`gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --issue --relations --pr
```

This is one call to the pack — plan-issue's preamble becomes this pack call plus
the `dispatch-drift-scan` call below, so "single context-pack call" means one call
*to the pack*, not one call total.

Read the `=== PR ===` section for the belt-and-suspenders no-PR check — the router
already confirmed no PR before emitting `INVOKE /plan-issue`. If the section prints
`PR #<num>`, this is an already-in-flight target that should not be re-planned:
**stop without a marker**. The Stop hook applies `dispatch:office-hours` and parks
it, since the router should not have routed a PR-bearing issue to the plan phase. If
the section prints `PR: none`, proceed. **CRITICAL**: detect the no-PR case by the
`PR: none` line, NOT by exit code — the pack exits 0 in both cases.

The `=== ISSUE #N ===` and `=== RELATIONS #N ===` sections supply the live issue
body (title/state/body/comments) and relations (blockers / sub-issues / parent /
siblings as titles + state + URL only, never full bodies) — the convention-drift and
merged-PR-overlap judgments below read from these sections.

If the pack reported `PR: none`, gather the deterministic drift evidence in one call
(`dangerouslyDisableSandbox: true` — it calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-drift-scan "$N"
```

`dispatch-drift-scan` emits, in one invocation, the three mechanical drift
inputs anchored on the issue's `createdAt`: commits to the paths the issue body
names since creation, PRs merged in the window, and the validity of the issue's
named references (paths existence-checked, names grepped — anything renamed,
moved, or removed is flagged `[ABSENT]`/`[NOT FOUND]`). It mines those
references from the single-backtick spans in the issue body; read its header for
what the heuristic does and does not cover. When the merged-PR query hits its
100-result limit the script prints a `WINDOW-TOO-WIDE` marker recommending
`/file-issue` instead of a partial scan — treat that as the too-wide-window signal in
the verdict below.

Two judgments stay with this session, after reading the script's evidence:

1. **Convention drift** — re-read `CLAUDE.md` and any `.claude/rules/*.md` whose
   domain the issue touches. Flag approaches the issue assumes that no longer
   match current conventions (e.g. a deprecated pattern, a renamed package, a
   changed config shape). The script does not mine conventions; this read is
   yours.
2. **Merged-PR overlap** — for any merged PR the script lists whose title
   plausibly relates to the issue's domain, optionally fetch its changed files
   to judge whether the overlap is incidental or substantive.

#### Three-way verdict

- **`proceed`** — drift absent or cosmetic; continue to the trivial-task skip and
  the exploration/design steps below (Step 2 onward).
- **`adjust`** — issue still wanted but references, conventions, or scope have
  shifted; invoke `/new-requirement` with the drift findings as the revised
  understanding, then continue planning (the later steps below).
- **`stop`** — codebase has moved past the need; report what changed and
  recommend closing the issue or re-running `/file-issue`, then **stop with no
  marker**. The Stop hook applies `dispatch:office-hours` to the issue because no
  completion marker was written. Do **not** apply `dispatch:planned` and do
  **not** persist a plan.

### 2. Trivial-task skip

If the issue is a typo fix, a single-line change, or a simple rename, **skip the
exploration and design subagents** (Steps 3–4) and plan it directly: write the
unit breakdown yourself, then jump to Step 6 (the gate is almost always
unnecessary for a trivial task) and Step 7 (persist + complete). The plan-comment
output schema still applies — a one-unit plan with the preface is fine.

Otherwise continue to Step 3.

### 3. Explore — built-in `Explore` subagent, direct fan-out

Launch up to **3** built-in `Explore` agents **in parallel** (a single message
with multiple Agent tool calls, `subagent_type: Explore`), using the **minimum
number** necessary — usually just 1. Reuse-first: have them actively search for
existing functions, utilities, and patterns to reuse rather than proposing new
code.

The built-in `Explore` agents skip `CLAUDE.md` and git history, so **pass the
issue scope and acceptance criteria inline** in each agent's prompt. Do **not**
re-instruct them to read files, identify critical files, or weigh trade-offs —
that is built into the agent. Give each agent a distinct search focus (e.g. one
searches for existing implementations to reuse, another explores related
components, a third investigates testing patterns). Follow the appendix's
*Exploration* block.

Collect from the agents: the relevant filenames, the code-path traces, and the
reuse candidates with their file paths. This is the exploration context Step 4
hands to the design agents.

### 4. Design — built-in `Plan` subagent, direct fan-out

Launch **1–3** built-in `Plan` agents (`subagent_type: Plan`). Use **1** for most
issues; use multiple only for large or architectural work, each with a **distinct
framing** (per the appendix's *Design* block — e.g. simplicity vs. performance vs.
maintainability for a new feature; root cause vs. workaround vs. prevention for a
bug fix). Multi-proposal designs must follow `.claude/rules/design-proposals.md`
(lead with the ideal greenfield design; add a brownfield migration path when
warranted).

In each `Plan` agent's prompt, provide:

1. The **Step-3 exploration context** — the filenames and code-path traces the
   `Explore` agents surfaced. The `Plan` agents skip `CLAUDE.md`/git too, so this
   context must be inline.
2. The **issue scope and acceptance criteria**.
3. The **`/implement-unit` model-selection heuristic, inline** (the `Plan` agent
   will not read `implement-unit/SKILL.md`, so reproduce it):

   > - **`sonnet`** for well-specified, mechanical work: small refactors with a
   >   clear diff shape, rote wiring (adding a script to a hook, renaming across
   >   files, boilerplate additions), unit-test writing with explicit cases.
   > - **`opus`** for judgment-heavy work: cross-cutting design changes, tricky
   >   concurrency / ordering, unfamiliar subsystems, units where the plan itself
   >   leaves decisions for implementation time.
   > - If unsure, pick `opus`. The cost delta matters less than a bad
   >   implementation.

4. The **plan-comment output schema** (below), so each agent returns a plan in
   the shape this skill persists.

When you launch multiple `Plan` agents, **synthesize** their proposals into a
single recommended approach in Step 5 — the persisted plan carries the
recommended approach only, not all alternatives.

### 5. Self-review — main thread

Read the **critical files** the `Explore`/`Plan` subagents flagged before
finalizing, to deepen your own understanding and confirm the plan is executable
and aligned with the issue's acceptance criteria (the appendix's *Review* block).
Resolve any disagreement between multiple `Plan` proposals here.

### 6. Clarification / deviation gate — main thread

When EITHER:

- **(a) Requirement ambiguity** — a requirement term has multiple plausible
  readings that would change the plan; or
- **(b) Major scope deviation** — exploration revealed that the work needed
  deviates substantially from the written acceptance criteria —

do **not** persist a partial plan and do **not** apply `dispatch:planned`. Instead,
call `dispatch-mark-deviation` with a clear reason (including the clarification
question or scope deviation description, so the office-hours comment tells the
user what decision is needed), then **stop**:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/plan-issue: <question or deviation description>"
```

The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads marker-absence as Branch A
and applies `dispatch:office-hours` to the issue, so the office-hours queue picks
it up. The resumed session (`/office-hours`) re-runs `/plan-issue` once the user
has resolved the ambiguity.

Note: do **not** call `AskUserQuestion` as the escalation mechanism. The
`dispatch-input-block.sh` hook *would* intercept it — this skill runs in an
`<N>-slug` worker the hook fires for — and park the issue with
`dispatch:office-hours`, but only with a generic "blocked on user input" reason.
Prefer `dispatch-mark-deviation` (the mechanism above), which carries the
specific clarification question into the office-hours why-comment so the user
knows exactly what decision is needed.

Otherwise proceed autonomously to Step 7. **Never call `ExitPlanMode`** — that is
the user-approval gate this design removes. This skill's terminus is either
auto-complete (Step 7) or marker-absent stop → office-hours.

> **Important:** Escalate ONLY on genuine ambiguity or a major scope deviation —
> not as a routine end-of-planning checkpoint. An unambiguous issue is planned
> with no user interaction. The relevance / drift re-evaluation is **already
> performed in Step 1 of this skill**; do **not** repeat it in this gate.

### 7. Persist + complete

Assemble the final plan markdown (the plan-comment output schema below) and write
it to `tmp/plan-<N>.md` first, then run the single ordered finalize call (with
`dangerouslyDisableSandbox: true` — it invokes `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-plan-finalize "$N" < tmp/plan-<N>.md
```

`dispatch-plan-finalize` runs three steps in a fixed order: it persists the plan
via a find-or-update `<!-- dispatch:plan -->` comment (never stacks a second),
then writes the phase-completed marker (no `--pr` — the plan phase has no PR),
then applies the `dispatch:planned` label **last**. The whole call is
find-or-update / idempotent, so it is safe to re-run.

The marker-before-label ordering is load-bearing: the durable label's presence
guarantees the per-session marker was written in the same session. A crash in the
window between the marker and the label leaves the label **absent**, so
`dispatch-phase` returns `plan` (not `implement`) and the issue is
office-hours-recoverable via the plan-clarification residue — instead of
dead-ending as `implement`. With `CLAUDE_JOB_DIR` unset (an interactive run) the
marker write is a clear-diagnostic no-op.

Then **stop**. The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads the marker,
re-derives the phase (now `implement`, since `dispatch:planned` is present),
advances the chain, strips any `dispatch:office-hours`, spawns the next tick, and
self-closes.

## Plan-comment output schema

The markdown written via `dispatch-write-plan` — and the shape each `Plan` agent
returns — must contain:

- A **Context** section: why this change is being made — the problem or need it
  addresses, what prompted it, and the intended outcome.
- An ordered list of **logical units of work**. Each unit specifies:
  - **Scope** — what files/behavior change, what is out of scope, with `path:line`
    anchors so the build delegates each unit to `/implement-unit` without
    re-reading source.
  - **Recommended model** — `opus` or `sonnet`, per the heuristic above.
  - **Dependencies** — prior units that must complete first, so build order is
    explicit.
- **Reuse** notes — existing functions/utilities to reuse, with their file paths.
- A **Verification** section — how to test the change end-to-end (run the code,
  use MCP tools, run tests).
- A clean-context **plan preface** (below), so the `implement` worker executes
  from the comment alone.

Include the **recommended approach only**, not all alternatives. Keep the plan
concise enough to scan quickly but detailed enough to execute. Name the critical
files to modify; for a pattern repeated across many files, describe the pattern
once and list a few representative paths rather than enumerating every line.

### Plan preface (embed verbatim in the persisted plan)

Per `ref-memory-management`'s Clean Context Planning Rule, the build session runs
in a clean context without the build skill's body, so the plan is the only
carrier of the terminal procedure. Embed a preface in the persisted plan that
records the active workflow step (the `implement` phase of `/dispatch-propagate`
for issue `<N>`, in its worktree) and the terminal procedure **verbatim** — copy
the script invocations exactly, do not paraphrase:

````markdown
## Plan preface (clean-context execution)

This plan executes in a clean build context (no skill body loaded). The active
step is the **`implement` phase of `/dispatch-propagate`** for issue **#<N>**,
in the worktree `<worktree-path>` (branch `<N>-…`). Build each unit below in
order via `/implement-unit` (one commit per unit), then run the terminal
procedure verbatim:

1. **Open the draft PR** (`dangerouslyDisableSandbox: true` — calls `gh`). Write
   the PR body prose to `tmp/pr-body.md` first, then:

   ```bash
   PR_NUM=$(.claude/skills/dispatch-propagate/scripts/dispatch-open-pr \
     <N> \
     --title "<short summary>" \
     --closes "<N>" \
     --body-file tmp/pr-body.md)
   ```

2. **Check for deviation, then write the marker (or skip it), then stop.**
   - **No deviation** (built as planned):
     ```bash
     .claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
       --phase implement --pr "$PR_NUM"
     ```
   - **Deviation** (scope shifted mid-build / plan could not be implemented as
     approved): skip the completion marker; instead:
     ```bash
     .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
       "implement: implementation deviated from the approved plan"
     ```
   Then **stop**. The Stop hook reads the marker and propagates the chain.
````

Fill `<N>`, `<worktree-path>`, and the title/closes set from the issue when you
assemble the plan.

---

## Appendix: adopted plan-mode instructions (verbatim)

This session does **not** have plan mode active, so it cannot receive these as
injected tool instructions. They are reproduced verbatim and govern Steps 3–7,
with two substitutions:

- (i) "the user's request" / "the user provided specific file paths" → the
  **issue scope / acceptance criteria** (there is no live user supplying paths).
- (ii) "Use `AskUserQuestion` to clarify any remaining questions" is the
  **escalation trigger** (Step 6: ambiguity or major scope deviation →
  office-hours), **not** a routine default.

### Exploration (built-in `Explore`)

> Focus on understanding the user's request and the code associated with their request. Actively search for existing functions, utilities, and patterns that can be reused — avoid proposing new code when suitable implementations already exist.

> **Launch up to 3 Explore agents IN PARALLEL** (single message, multiple tool calls) to efficiently explore the codebase.
> - Use 1 agent when the task is isolated to known files, the user provided specific file paths, or you're making a small targeted change.
> - Use multiple agents when: the scope is uncertain, multiple areas of the codebase are involved, or you need to understand existing patterns before planning.
> - Quality over quantity - 3 agents maximum, but you should try to use the minimum number of agents necessary (usually just 1)
> - If using multiple agents: Provide each agent with a specific search focus or area to explore. Example: One agent searches for existing implementations, another explores related components, a third investigating testing patterns

### Design (built-in `Plan`)

> **Default**: Launch at least 1 Plan agent for most tasks - it helps validate your understanding and consider alternatives
> **Skip agents**: Only for truly trivial tasks (typo fixes, single-line changes, simple renames)
> **Multiple agents**: Use up to 3 agents for complex tasks that benefit from different perspectives

> Example perspectives by task type:
> - New feature: simplicity vs performance vs maintainability
> - Bug fix: root cause vs workaround vs prevention
> - Refactoring: minimal change vs clean architecture

> In the agent prompt:
> - Provide comprehensive background context from Phase 1 exploration including filenames and code path traces
> - Describe requirements and constraints
> - Request a detailed implementation plan

### Review

> 1. Read the critical files identified by agents to deepen your understanding
> 2. Ensure that the plans align with the user's original request
> 3. Use AskUserQuestion to clarify any remaining questions with the user

> **Important:** Use AskUserQuestion ONLY to clarify requirements or choose between approaches.

### Plan artifact

> - Begin with a **Context** section: explain why this change is being made — the problem or need it addresses, what prompted it, and the intended outcome
> - Include only your recommended approach, not all alternatives
> - Ensure that the plan file is concise enough to scan quickly, but detailed enough to execute effectively
> - Name the critical files to be modified. For changes that repeat a pattern across many files, describe the pattern once and list a few representative paths — do not enumerate every file or line number
> - Reference existing functions and utilities you found that should be reused, with their file paths
> - Include a verification section describing how to test the changes end-to-end (run the code, use MCP tools, run tests)

### Intentionally NOT adopted

The built-in Phase 5 (call `ExitPlanMode`) and the rule that the turn must end
with `AskUserQuestion` or `ExitPlanMode`. That is the user-approval gate this
redesign removes — `/plan-issue`'s terminus is auto-complete (`dispatch:planned`
+ the plan comment) or `AskUserQuestion` → office-hours. **Never call
`ExitPlanMode`.**
