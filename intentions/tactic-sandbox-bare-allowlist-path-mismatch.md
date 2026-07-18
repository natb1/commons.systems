---
id: tactic-sandbox-bare-allowlist-path-mismatch
kind: tactic
statement: "The sandbox write-allowlist's .bare entry is off by one directory
  level: allowWrite '../../.bare' resolves to the nonexistent .claude/.bare,
  while the real git common dir is repo-root .bare — so every git-metadata write
  (FETCH_HEAD, index.lock, ORIG_HEAD) from a .claude/worktrees/* session fails
  read-only and silently requires dangerouslyDisableSandbox, contradicting
  .claude/rules/sandbox.md's doctrine that git add/commit/fetch/worktree ops
  work without the override."
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-18 during the /align-strategy follow-up-tracking
  pass that ran after the /review-fix terminal re-entry flush on
  tactic-graph-node-lane-write-hardening (PR #2882). The re-entry flush hit
  read-only-filesystem failures on git fetch
  (.bare/worktrees/<branch>/FETCH_HEAD) that were only worked around with
  dangerouslyDisableSandbox; investigating the workaround revealed the root
  cause is a checked-in sandbox-config path mismatch, not a one-off. Empirically
  confirmed: a sandboxed write to /home/n8/natb1/commons.systems/.bare fails
  read-only while a write to .claude/worktrees succeeds. Recorded as a
  bug-report draft tactic (graph is the sole bug tracker,
  strategy-graph-native-dispatch clarification 28) for a later /align-tactics
  round to finalize into a fix unit."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Fix the sandbox `.bare` write-allowlist path mismatch

## Finding

**Source:** operator observation during the `/align-strategy` follow-up-tracking
pass after the `/review-fix` terminal re-entry flush on
`tactic-graph-node-lane-write-hardening` (PR #2882). Not a `/review-fix`
finder output — surfaced while diagnosing why the re-entry flush needed
`dangerouslyDisableSandbox`.

**Location:** `.claude/settings.json` → `sandbox.filesystem.allowWrite`
(`../../.bare`); doctrine at `.claude/rules/sandbox.md` ("Sandbox" section).

**Root cause:** The two allowlist entries are `../../.bare` and
`../../worktrees`, resolved relative to a worktree's project root. Worktrees
are created under `<repo>/.claude/worktrees/<name>` (`provision-node-worktree`
/ `EnterWorktree`), but the git common dir is at repo-root `<repo>/.bare` — one
level shallower than `.claude/`. From `<repo>/.claude/worktrees/<name>`:

- `../../worktrees` → `<repo>/.claude/worktrees` — **correct** (the name
  `worktrees` happens to sit at the same relative depth, so this resolves
  right by coincidence).
- `../../.bare` → `<repo>/.claude/.bare` — **wrong**: that path does not exist;
  the real common dir is `<repo>/.bare`, which the correct entry
  `../../../.bare` would reach.

**Empirical confirmation (2026-07-18):**

- Sandboxed `touch /home/n8/natb1/commons.systems/.bare/.probe` →
  `Read-only file system` (outside the allowlist).
- Sandboxed `touch /home/n8/natb1/commons.systems/.claude/worktrees/.probe` →
  succeeds (allowlisted).
- `git rev-parse --git-common-dir` from a `.claude/worktrees/*` worktree →
  `/home/n8/natb1/commons.systems/.bare`; this worktree's `.git` gitdir →
  `…/.bare/worktrees/<name>` (so FETCH_HEAD / index.lock / ORIG_HEAD all land
  under the un-allowlisted repo-root `.bare`).

**Failure scenario:** Every git-metadata write from a `.claude/worktrees/*`
session — `git fetch` (FETCH_HEAD), `git add`/`git commit` (index.lock),
graph-commit's reset-dance (ORIG_HEAD) — fails read-only unless the caller
sets `dangerouslyDisableSandbox: true`. This directly contradicts
`.claude/rules/sandbox.md`'s stated doctrine that `git add`/`git commit`/
`git fetch`/`git push`/`git worktree add`/`git worktree remove` work
*without* the override. The doctrine is currently false for every
`.claude/worktrees/*` checkout, so operators either burn a failed sandboxed
attempt then retry, or (worse) trust the doc and mis-diagnose the read-only
error as something else.

## Candidate fixes (greenfield decision for the /align-tactics round)

Three ways to realign the layout and the allowlist; pick one:

1. **Widen the allowlist depth** — change the `.bare` entry to `../../../.bare`
   (match where the bare actually lives relative to `.claude/worktrees/<name>`).
   Smallest diff; leaves the bare at repo root. Must confirm it does not
   over-broaden writes for a *main*-checkout caller (whose project root is the
   repo root, where `../../../.bare` resolves outside the repo).
2. **Move the bare under `.claude/.bare`** — make the on-disk layout match the
   existing `../../.bare` entry. Larger operational change (re-point every
   registered worktree's gitdir).
3. **Create worktrees at `<repo>/worktrees/<name>`** — the depth the current
   `../../.bare` + `../../worktrees` pair was written for. Changes the worktree
   provisioning convention repo-wide.

Whichever is chosen, **reconcile `.claude/rules/sandbox.md`** so its
"git ops work without override" doctrine matches reality (either the paths are
fixed and the doctrine holds again, or the doctrine is amended to state the
override is required for `.claude/worktrees/*` sessions).

## Scope note

`/align-strategy` records graph nodes only and never edits config, so no
`.claude/settings.json` / `sandbox.md` change was made in the recording pass
(author decision 2026-07-18). This node carries the finding for a later
`/align-tactics` round to finalize into a fix unit.
