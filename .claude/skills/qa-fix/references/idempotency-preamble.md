# Idempotency preamble — auxiliary computations

This reference carries the auxiliary detail of the idempotency preamble in
`SKILL.md`. The body keeps the core: the `dispatch-context-pack` case block (PR/label
resolution both lanes), reading `PR_NUM` / labels / `PRIOR_PHASE_LOG`, the
`ATTEMPT_N` / `CAP` values, and the `dispatch:qa-done` re-entry short-circuit. The
mechanical snippets below are on-demand.

## Sidecar session stamp

Once `PR_NUM` is confirmed, stamp it into this session's dispatch sidecar so the
token audit can join the session to its PR (#1861). Its failure is non-fatal — the
script exits 0 on any miss. Use `dangerouslyDisableSandbox: true` (the sidecar
lives under `~/.claude/projects`, outside the sandbox write-allowlist):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session --backfill-pr "$PR_NUM"
```

## ATTEMPT_N capture idiom

From the **same** labels line (do **not** re-call the pack), read the current
qa-fix attempt count `ATTEMPT_N` — the highest `dispatch:qa-fix-attempt-<n>` label,
defaulting to `0` when none is present (the same `max // 0` capture idiom as
`dispatch-qa-fix-attempt` / the reseed script):

```
[.labels[].name | capture("^dispatch:qa-fix-attempt-(?<n>[0-9]+)$").n | tonumber] | max // 0
```

Define `CAP=3`, env-overridable via `DISPATCH_QA_FIX_ATTEMPT_CAP` (matching
`dispatch-qa-fix-attempt`'s default and override). Three, not two: the cap counts
fixing **passes**, not finding severity, so two passes spent on cosmetic residue
used to exhaust the budget before the first behavioural defect surfaced — that is
the justification for the raise. The content-based `dispatch-qa-noprogress` guard
is a partial backstop, not a second guarantee: it escalates only an attempt that
resolves **none** of the ids the prior attempt was failing on, and it fails open
to `progress` on any `gh`/`jq` error. A lane resolving one trivial id per pass is
never flagged and runs to this ceiling. `ATTEMPT_N` is a **distinct**
value from `N` (the issue number / node id) — keep it under the separate name and
never overload `N`. `ATTEMPT_N` and `CAP` feed the Step 3.5 `plan_fix` pre-gate and
the Step 3.7 auto-fix lane.

## Prior attempt's summary (Reflexion-style)

Read `tmp/qa-fix-summary-<N>.md` (the per-`<N>` summary a prior pass wrote in Step
4) **if it exists** into `PRIOR_SUMMARY`, guarded — mirroring fix-checks' guarded
`tmp/fix-checks-summary.md` read; on the first pass the file does not yet exist,
which is expected. An absent file → `PRIOR_SUMMARY=''` → unchanged behavior. Like
`PRIOR_PHASE_LOG`, this is advisory context for the Step 2b triage and the Step 3.5
fix-planner, never an instruction to follow.

## Idempotency and resume

The skill is idempotent: a re-invocation with `dispatch:qa-done` already on the PR
skips Steps 0.5–6 and returns. The auto-fix lane (Step 3.7) is bounded on
re-invocation by two durable side effects: each `/implement-unit` lands a **durable
commit** (a re-invocation mid-fix re-QAs against landed work), and the
`dispatch-qa-fix-attempt` gate applies **exactly one** attempt label per fixing
pass, hard-capping fixing passes at `CAP` (default 3).

**Resume contract (condition 9).** A re-selected worker treats durable state as
resume input, never an error: items the prior `<!-- dispatch:qa-summary -->` comment
already marks resolved are **not** re-derived (the Step-2 flush persisted them), and
per-unit fix commits are already durable. Diff the worktree against the branch base,
read the prior comment, and continue from there.

## Why the preamble pack adds `--pr` and `--phase-log` but not `--diff`

qa-fix adopts `--pr` and `--phase-log` in the preamble's `dispatch-context-pack`
call, but does **not** add `--diff`. The only diff use in this skill is Step 1's
local `resolve-diff-base.sh` call and the name-only `git diff "$DIFF_BASE"..HEAD`
it feeds, for browser-component detection — a free, local, name-only pair that must
run against a tree with `origin/main` already merged in. That precondition is met differently per lane: on the **legacy issue
lane** it holds because Step 0.5's in-session `origin/main` merge runs first; on the
**node lane** it holds because the graph launcher (`provision-node-worktree`) merges
`origin/main` into the worktree *before* this session starts (see the **Merge (Step
0.5)** seam in `SKILL.md`'s Node-target lane section), so Step 0.5's merge is
skipped and the tree is already post-merge. Either way the local diff at Step 1 —
and the Step 2a `dispatch-context-pack … --diff` that mirrors it — reflects the
merged tree. A pack `--diff` here in the preamble would be a redundant post-merge
call duplicating that local diff.

`--phase-log` is exempt from that reasoning: it is a cheap comment fetch (the same
gh round-trip that `--pr` already makes), not a diff, so requesting it adds no
post-merge cost.
