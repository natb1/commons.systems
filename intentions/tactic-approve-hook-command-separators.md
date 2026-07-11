---
id: tactic-approve-hook-command-separators
kind: tactic
statement: Close the two auto-approve hook command-separator bypasses (bare & in
  split-command.py; heredoc branch in approve-workflow-commands.sh)
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 code review. The dispatch fleet
  auto-approves commands over untrusted issue/PR text; both bypasses let an
  attacker-influenced payload ride inside an approved segment. Not
  router-specific, so survives legacy-router removal. Serves
  strategy-autonomous-execution: the owned dispatch chain is only safe to run
  unattended if its approval boundary holds."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-approve-hook-command-separators
  pr: 2833
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: bb618bf03a20a12d37ecdf8770a5bb917ab5c38176fdbb795db237aabf8ac55f
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Close the two auto-approve hook command-separator bypasses

## Context

The dispatch fleet's PreToolUse auto-approval processes commands whose text
can be influenced by untrusted GitHub issue/PR content. Two independent
bypasses let a payload after a command separator ride inside an
already-approved segment, executing with no human prompt. Both were verified
by reproduction in the 2026-07-05 review.

## Unit 1 — bare `&` separator in split-command.py

**Recommended model:** sonnet

Scope:
- `.claude/hooks/split-command.py:69,74`: the splitter treats `&&`, `||`,
  `|`, and `;` as separators but not a single `&`. `echo hi & rm -rf /tmp/x`
  returns the `allow` verdict; bash backgrounds `echo` and runs the payload.
  Add a bare-`&` split (excluding `&&`) so each backgrounded command is
  classified on its own.
- Add a regression test asserting `echo hi & rm -rf /x` is NOT auto-approved.

## Unit 2 — heredoc branch in approve-workflow-commands.sh

**Recommended model:** sonnet

Scope:
- `.claude/hooks/approve-workflow-commands.sh:251-262`: the multi-line
  heredoc branch bypasses split-command.py and splits only on `&&`/`||`,
  while `is_allowed_git_c` (:79-105) reads only awk fields `$1-$4`. A heredoc
  git commit with a trailing `; rm -rf /x` is auto-approved though the
  single-line form is correctly rejected. Route the heredoc branch through
  the same separator-splitting and full-line allowlist check as the
  single-line path.
- Add a regression test for the heredoc-with-trailing-`;`-payload shape.

## Verification

- Reproduce both bypasses on the pre-fix hooks; confirm the fix rejects both
  while still approving the legitimate `git -C <worktree> commit` and
  `&&`-chained forms the fleet relies on. Run the hook unit suites.
