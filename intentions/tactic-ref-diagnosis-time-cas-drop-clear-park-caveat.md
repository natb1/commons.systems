---
id: tactic-ref-diagnosis-time-cas-drop-clear-park-caveat
kind: tactic
statement: ref-diagnosis-time-cas/SKILL.md still carries the provisional caveat
  that clear-park may not exist yet on origin/main, stale now that
  tactic-clear-park-repo-targeting-guard has landed clear-park --base with
  park-node's exact shape and exit-code contract, so an operator reading it
  could wrongly conclude the --base pin is unavailable and skip it during a
  drain interview
owner: ai
status: raw
parent: null
rationale: null
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
# ref-diagnosis-time-cas/SKILL.md still carries the provisional caveat that clear-park may not exist yet on origin/main, stale now that tactic-clear-park-repo-targeting-guard has landed clear-park --base with park-node's exact shape and exit-code contract, so an operator reading it could wrongly conclude the --base pin is unavailable and skip it during a drain interview

## Provenance

- **Source:** review-fix pass on PR #2988 (`tactic-clear-park-repo-targeting-guard`), finding `residue-5` (code-review lens, residue phase).
- **Location:** `.claude/skills/ref-diagnosis-time-cas/SKILL.md:50` (immediately after the batch-manifest note).
- **Failure scenario:** The reference still carries a provisional paragraph: "`clear-park` is described here even though it may not exist yet on `origin/main` — it lands via the sibling tactic `tactic-clear-park-primitive`, mirroring park-node's `--base <blobsha>|<id>=<blobsha>|<manifest-file>` shape exactly." That caveat is stale once `tactic-clear-park-repo-targeting-guard` lands: `clear-park` now accepts a leading `--base` in exactly the documented shape, with park-node's exit contract — exit 0 landed, exit 1 write/graph-commit failure or node absent from origin/main, exit 2 usage error including a malformed, empty, or unresolvable `--base`, exit 3 `stale-diagnosis` when the pinned base no longer matches origin/main (nothing written). Risk of leaving it: a drain operator reading the reference may assume `clear-park --base` is still unimplemented and skip the pin, dropping the compare-and-swap protection during the human interview window — the exact gap the mechanism exists to close.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — Lane A (`code-review`) residue finding, dispositioned `Deferred` by the residue phase without a separate verify pass (Lane A findings are pre-vetted by the built-in `/code-review` skill's own internal review).
- **Recommended fix:** Delete the provisional paragraph and state plainly that `clear-park` accepts `--base <blobsha>|<id>=<blobsha>|<manifest-file>` with the same exit-code contract as `park-node`. The existing exit-code table already says "applies identically to clear-park" and needs no change. Deliberately left out of the source tactic: its Unit 3 scope explicitly excludes `.claude/skills/**` because editing it trips a separate commit-permission gate (and the path is in the sandbox's read-only carve-out) — this needs a lane that can commit config, or a human edit.
- **Source PR:** #2988
