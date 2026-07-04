---
id: tactic-token-hygiene-sweep
kind: tactic
statement: "draft: token hygiene sweep — recurring avoidable tool errors,
  scriptable call sequences, and oversized tool-result payloads"
owner: ai
status: raw
parent: null
rationale: Draft retained from the 2026-07-04 strategy-token-economy interview
  (retain, not refine). Lower measured magnitude than the routing and
  attribution drafts; kept visible rather than dropped.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes: {}
---
# draft: token hygiene sweep — recurring avoidable tool errors, scriptable call sequences, and oversized tool-result payloads

Notes retained from the interview session (magnitudes from the
2026-06-26→07-03 audit):

- `File has not been read yet` edit-rejection: 143× across 126 sessions —
  clearest scriptable win; add a read-before-first-Edit/Write line to the
  implement/qa skill preambles.
- `Cannot enter worktree: PATH is the current working directory`: 29× across
  29 sessions — workers re-issuing EnterWorktree while already inside one;
  the bg-session "skip if cwd already under the worktrees root" check is
  being missed.
- qa-verify polling loop: a `cd …qa-verify… > cd …` two-gram occurred 405×
  in 39 sessions (~10 repeats/session) — should be one script with an
  internal wait, not per-tick tool calls.
- Payload bytes: 72.5MB total tool-result payload in the window; browser
  screenshots ~48KB each — prefer `read_page`/targeted `find` over
  screenshots in qa phases where the check is textual.
- These stay report-visible through the token-audit lenses (1, 2, 8); this
  draft exists so the fixes are schedulable rather than folklore.
