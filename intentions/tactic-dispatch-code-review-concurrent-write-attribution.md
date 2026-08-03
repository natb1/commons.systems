---
id: tactic-dispatch-code-review-concurrent-write-attribution
kind: tactic
statement: dispatch-code-review's before/after git-stash-create window has no
  exclusivity lock on the reviewed worktree, so any concurrent writer active
  during the nested claude -p /code-review invocation has its edits silently
  attributed to the built-in review's fixed[] output and committed/pushed under
  review-fix's name
owner: ai
status: raw
parent: null
rationale: "Surfaced as a red-team finding (red-team-4) during the review-fix
  pass on PR #3007 (tactic-review-code-review-invocation-contract), verified
  upheld by the review Workflow's adversarial skeptic, and deferred rather than
  auto-fixed because closing it requires a worktree-locking mechanism (flock or
  reuse of worktree_has_live_session) beyond a same-pass Opus fix's scope."
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
# dispatch-code-review's before/after git-stash-create window has no exclusivity lock on the reviewed worktree, so any concurrent writer active during the nested claude -p /code-review invocation has its edits silently attributed to the built-in review's fixed[] output and committed/pushed under review-fix's name

Draft finding, not yet decomposed — recorded per the standing rule that findings
land as graph nodes, never journald or plan prose alone.

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-code-review:141` (the `git stash create` before-image capture) through `dispatch-code-review:227` (the invocation), and `.claude/skills/review-fix/SKILL.md:263-271` (the exclusivity assertion in prose).
- **Source PR**: #3007 (`tactic-review-code-review-invocation-contract`), surfaced by the red-team finder during that PR's own `/review-fix` pass.
- **Failure scenario**: The script captures a before-image (`git stash create`) and, after the nested `claude -p '/code-review ... --fix'` session returns, derives `touched-files.txt` and `fix.patch` from a plain `git diff` against that before-image — attributing *everything* that changed in the window to the built-in's own edits. Nothing enforces the "exclusive stage, no concurrent writer" assumption SKILL.md states as a design property: no lock file, no `worktree_has_live_session` check, no PID/session guard. This project's own worktrees are documented to host concurrent sessions (duplicate `/implement` workers on one worktree, background jobs, `qa-fix` running the PR's own build/test scripts in the same tree). Any writer active in that window — a stray background job, a leftover test artifact, or the PR's own build script — has its edits folded into `touched-files.txt`, which becomes the `allowedTouched` allow-list (`review-fix.js:1080`) that authorizes `fixed[]` entries, gets captured into `fix.patch`, and is committed and pushed by Step 3 attributed to the review.
- **Adversarial verdict** (from the review-fix Workflow's `red-team-4` skeptic pass): classified `Deferred` — real and code-verified, but closing it needs a genuine exclusivity mechanism (e.g. `flock` on a lockfile under the out-dir, or reusing the existing `worktree_has_live_session` check) rather than a same-pass text/logic fix, so it was not auto-fixed by the Opus fix stage in PR #3007.

## Shape of a fix (not yet decided — decompose in `/align-tactics`)

1. Take an exclusive lock (e.g. `flock` on a lockfile under `$OUT_DIR`, or reuse `worktree_has_live_session`) around the invoke/verify window in `dispatch-code-review`, and abort with a distinct exit code if it cannot be acquired.
2. Consider whether the before-image should also record a hash/manifest of tracked files outside the diff, so an unexpected mutation to an untouched file is detectable even without a lock.
