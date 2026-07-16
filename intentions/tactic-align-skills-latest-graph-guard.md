---
id: tactic-align-skills-latest-graph-guard
kind: tactic
statement: Enforce a non-skippable pre-analysis freshness guard for the
  interactive align skills — cut their session worktree from freshly-fetched
  origin/main so analysis cannot begin on a stale checkout
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-08 /align-strategy round (the
  read-side-freshness clarification and condition landed on
  strategy-graph-native-dispatch): the interactive align skills analyzed a
  36-commit-behind local checkout and presented superseded doctrine as current
  until the author caught it. The failure was not an absent method but that
  nothing forced one. The narrow 'read served-virtue and tradition doctrine at
  origin/main' clause in tactic-align-strategy-alignment-tests became redundant
  once the whole session checkout is guaranteed fresh; that tactic has since
  merged (PR #2867), so no live merge remains — this finalize records the
  redundancy in the plan below rather than editing a landed node."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 (further refined): elevated to the same
    tier as the tactics that directly edit
    .claude/skills/align-strategy/SKILL.md and
    .claude/skills/align-tactics/SKILL.md (boost 3, added on top of the
    strategy's own boost 5, authored 8) — even though this tactic's own fix is a
    freshness-guard mechanism rather than a SKILL.md prose edit, the author has
    directed it ranks alongside the direct skill-edit tactics, above
    curriculum-execution tooling (boost 7) and the rest of
    strategy-graph-native-dispatch's subtree (inherited 5, unboosted)."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Enforce a non-skippable pre-analysis freshness guard for the interactive align skills — cut their session worktree from freshly-fetched origin/main so analysis cannot begin on a stale checkout

## Context

The interactive align skills read the graph before acting, and every read
comes from the session's local working tree. When that tree lags origin/main,
every read is stale: `/align-strategy`'s Step 1.2 overlap grep and `readNode`
of the edited node, `/align-tactics`' two-sided drift review, `/align-init`'s
orientation reads at origin/main, `grounding-research`'s node sweep. The
2026-07-08 graph-function round ran against a 36-commit-behind checkout and
presented superseded doctrine (a pre-amendment `tradition-plato` that still
said "Forms declined") as current — caught only because the author happened to
know a later reading session had amended it. The write path was never the
problem: `graph-commit` rebases every write onto origin/main before it lands.
The gap is the *read* path, before any analysis.

The failure was not an absent method but that nothing forced one. The fix is
therefore not "add a fetch step to SKILL.md prose" — that is exactly the form
that failed, since the next session skips a prose step the same way this one
did. The guard must be non-skippable: enforced at a point the flow cannot
proceed past, and homed in owned tooling rather than skippable prose (the
greenfield-delegation / mechanical-floor lens — `strategy-graph-native-dispatch`
lines 647–651).

**What already exists (reuse-first, do not rebuild).** The router's
`provision-node-worktree`
(`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`) *already*
guarantees freshness for the path that uses it: it runs `git fetch origin main`
(line 73) **before** any worktree work and cuts a brand-new node's worktree
from `origin/main` (line 111: `git worktree add -b "$NODE_ID" "$WT"
origin/main`), then merges origin/main into a re-entered tree (line 124). A
failed fetch is `exit 2` — offline is already a hard fail there. So the
"fresh-cut provisioning" lead mechanism the author chose is, for that path,
already implemented; the work is to *route the align skills exclusively through
it and close the two holes that bypass it*:

- **Hole 1 — the bare `EnterWorktree` alternative.** Both `/align-strategy`
  Step 0 (`.claude/skills/align-strategy/SKILL.md:72-78`) and `/align-tactics`
  Step 0 (`.claude/skills/align-tactics/SKILL.md:63-69`) offer native
  `EnterWorktree` *or* `provision-node-worktree` as equal choices.
  `EnterWorktree`'s default `fresh` mode branches from the **local**
  remote-tracking ref `origin/main` and does **not** run `git fetch` first, so
  it can start on a stale local `origin/main` — the exact hole. Same wording,
  same hole, in `grounding-research` Step 0
  (`.claude/skills/grounding-research/SKILL.md:30-36`).
- **Hole 2 — an already-entered existing worktree.** A session already sitting
  in a worktree (`/align-init` reads at origin/main without provisioning;
  `office-hours` points the human at an existing worktree) gets no freshness
  check at all.

**Greenfield ideal, for the record** (`.claude/rules/design-proposals.md`): the
strongest possible enforcement is a `PreToolUse` hook that blocks the first
graph read / `graph-commit` until a per-session freshness stamp exists — making
the guard non-skippable independent of whether the session remembered to run
anything. That is deliberately **not** this tactic's scope: the author's
recorded 2026-07-08 lead choice is fresh-cut provisioning plus a preflight
hard-fail primitive, which is one PR and closes both holes above. If prose
invocation of the preflight later proves skippable in practice, the hook is the
ratchet (`strategy-graph-native-dispatch` condition 2 — a stable check
graduates into enforced tooling); record it as a follow-up tactic then, not
now.

Reconciliation (drift review): the narrow "read the served-virtue rationales
and tradition records at origin/main" clause in
`tactic-align-strategy-alignment-tests` (its scope point 1) becomes redundant
once the whole session checkout is guaranteed fresh — but that tactic has since
**merged** (PR #2867), so there is nothing live to reconcile; this plan records
the redundancy and touches no landed node. `tactic-align-entrypoint-consolidation`
(a *raw* draft, non-landed — does not supersede live work per the
greenfield-relevance gate) would later rename `.claude/skills/align-strategy/` →
`.claude/skills/align/` and fold in `align-init`; because this guard's mechanism
lives in a shared script and the SKILL.md edits are small Step-0 insertions,
it survives that rename and the edits repoint trivially — no ordering gate
needed.

## Units of work

### Unit 1 — Preflight freshness primitive `assert-worktree-fresh`

**Recommended model:** opus — the hard-fail / offline / sandbox semantics are
judgment-heavy and security-adjacent (a wrong branch here silently re-opens the
stale-read hole this whole tactic exists to close).

**Scope.** New extensionless bash script
`.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` (extensionless
+ `#!/usr/bin/env bash` shebang matches the sibling `provision-node-worktree`
convention; `is_shell_script` at `.claude/skills/dispatch-propagate/scripts/lib.sh:37-50`
lints it via shebang). Behavior:

- `set -euo pipefail`; resolve the project root via `resolve_project_root`
  from `lib.sh` (reuse — do not re-derive), and take an optional
  `<worktree-path>` argument defaulting to the cwd, mirroring
  `dispatch-merge-main`'s per-worktree-path interface.
- Run `git -C "$WT" fetch origin main`. A **read-only** fetch to `github.com`
  is sandbox-allowlisted and does not itself merge (`.claude/rules/sandbox.md`
  line 16), so the script does not internally set any sandbox flag; the caller
  runs it with `dangerouslyDisableSandbox: true` only if a sandboxed fetch
  fails (standard sandbox fallback). Correcting the draft's premise: the guard
  performs **no** tree-updating merge, so it does **not** require
  `dangerouslyDisableSandbox` for the FETCH_HEAD case the way a
  `merge --ff-only` would (contrast `dispatch-select-tick`, sandbox.md
  lines 47–51).
- **Offline is a hard fail.** If `git fetch` exits non-zero, print a clear
  one-line error to stderr and `exit 1` — never proceed on unverified local
  state (`.claude/rules/code-style.md`: clear errors over defensive
  fallbacks).
- Compute behind-count `git -C "$WT" rev-list --count HEAD..origin/main`. If
  `> 0`, print e.g. `assert-worktree-fresh: HEAD is N commit(s) behind
  origin/main — freshen (merge origin/main) before analysis` to stderr and
  `exit 1`. If `0`, `exit 0` (a short OK note to stderr is fine; stdout stays
  quiet so callers can consume it).
- Conform to the committed-script lint (`lint-prose-rules.sh`): no
  `echo "$VAR" | jq` (irrelevant here — no jq), no raw `gh` porcelain (none
  used). Resolve dirs via `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"`.

**Out of scope:** any merge/fast-forward of the tree (the primitive only
*detects* staleness and refuses; freshening is the session's job); modifying
`provision-node-worktree` (it already fetches+cuts fresh — reuse, don't
touch).

### Unit 2 — Test the primitive

**Recommended model:** sonnet — mechanical test-writing against an existing
harness with explicit fixtures.

**Dependencies:** Unit 1.

**Scope.** Add test cases for `assert-worktree-fresh` following the
copy-into-a-git-fixture template already in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` (the
`graph-select-target` block ≈ lines 42760–42843 is the pattern: build a temp
git repo, run the script with env overrides, `assert_eq`). Cover three cases:

1. **Fresh** — a worktree whose HEAD equals a local `origin/main` fixture ref →
   exit 0.
2. **Stale** — origin/main ahead by ≥1 commit → exit non-zero, message names
   the behind-count.
3. **Offline / unreachable origin** — fetch fails → exit non-zero (hard fail,
   not a silent pass).

Because the script fetches a real `origin`, the fixture sets up a local bare
repo as `origin` (fetch-from-file, no network) so the fresh/stale cases exercise
the real `git fetch` + `rev-list --count` path; the offline case points `origin`
at a nonexistent path. Register the suite: `test-dispatch-scripts.sh` is already
a CI step at `.github/workflows/unit-tests.yml:190-191`, so adding cases to it
needs no new workflow wiring.

**Out of scope:** a separate `test-*.sh` file (reuse the existing suite — one
fewer CI step to register).

### Unit 3 — Route the align skills through the guard

**Recommended model:** opus — cross-cutting instruction-design across multiple
SKILL.md files where the exact wording determines whether the guard is actually
non-skippable; the reader is a fresh autonomous session with no other context.

**Dependencies:** Unit 1 (the script must exist before the prose can mandate
it).

**Scope.** Rewrite the claim/isolate step of each interactive graph-reading
align skill so the sanctioned worktree entry is fetch-enforcing, with
consistent wording across skills:

- `.claude/skills/align-strategy/SKILL.md` Step 0 (`:72-78`) and
  `.claude/skills/align-tactics/SKILL.md` Step 0 (`:63-69`) and
  `.claude/skills/grounding-research/SKILL.md` Step 0 (`:30-36`): change the
  "create or re-enter it — native `EnterWorktree` … or the
  `provision-node-worktree` … primitive" language so that (a)
  `provision-node-worktree` is the **preferred** path precisely because it
  fetches origin/main and cuts fresh, and (b) when a session instead uses
  native `EnterWorktree` **or** re-enters an existing worktree, running
  `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` (which
  hard-fails on staleness) is the **mandatory first action before any graph
  read** — not optional prose. State the offline-is-hard-fail contract inline
  so the reader does not treat a failed fetch as license to proceed.
- `.claude/skills/align-init/SKILL.md`: `/align-init` reads at origin/main
  (`:84`) and diffs `git diff origin/main` (`:199`) without a fetch, so its
  local `origin/main` ref can be stale. Add a first-step invocation of
  `assert-worktree-fresh` (or, minimally, the `git fetch origin main` it
  guarantees) before those reads.
- `.claude/skills/office-hours/SKILL.md`: read-only and hands off to a human;
  it should point the human at freshly-fetched state — add a one-line note that
  the human's target worktree be freshened (or the graph re-read at freshly
  fetched origin/main) before review. Keep it advisory: office-hours takes no
  fix/graph action.

Keep every edit a small Step-0 insertion; do not restructure the skills.

**Out of scope:** the doctrinal-consistency and steelman tests
(`tactic-align-strategy-alignment-tests`, merged); the headless router tick
(already freshens via `dispatch-select-tick`); the `PreToolUse` hook (future
ratchet, see Context); any change to `provision-node-worktree`.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree` — already
  fetches origin/main (line 73) and cuts fresh (line 111); the preferred entry
  path, unchanged.
- `.claude/skills/dispatch-propagate/scripts/lib.sh` — `resolve_project_root`
  (path resolution) and `is_shell_script` (`:37-50`, shebang-based lint scope).
- `.claude/skills/dispatch-propagate/scripts/dispatch-merge-main` — the
  per-`<worktree-path>`-argument interface shape to mirror for the new script.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — the
  `assert_eq` / `setup` / temp-git-fixture harness (the `graph-select-target`
  block as template).
- `.claude/rules/sandbox.md` (fetch vs merge sandbox rules, lines 16 & 47–51),
  `.claude/rules/code-style.md` (clear errors over fallbacks),
  `.claude/rules/shell-json.md` (committed-script lint conventions).

## Verification

Auto-runnable:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lint-prose-rules.sh
```

Manual / judgment:

- In a deliberately stale worktree (reset HEAD one commit behind a local
  origin/main fixture), run `assert-worktree-fresh` and confirm it exits
  non-zero and names the behind-count; in a fresh worktree confirm exit 0;
  with `origin` unreachable confirm the hard fail (non-zero), not a silent
  pass.
- Read each edited SKILL.md Step 0 as a fresh session would: confirm the
  fetch-enforcing path is mandatory (not one of several equal options) and the
  offline-hard-fail contract is stated inline.
- Implement-time caveat: `.claude/skills/**` edits are agent-behavior config —
  dispatch **auto mode denies the commit** of Unit 3's SKILL.md changes (and
  Unit 1/2's scripts also live under `.claude/skills/`). Land this tactic in a
  full interactive session, not an auto-mode worker.
