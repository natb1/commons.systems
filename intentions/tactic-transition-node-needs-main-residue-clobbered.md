---
id: tactic-transition-node-needs-main-residue-clobbered
kind: tactic
statement: transition-node's unconditional origin/main refresh of
  intentions/<id>.md overwrites an uncommitted worktree body edit before it is
  ever read, so qa-fix's `## needs-main residue` append never reaches
  origin/main and the review -> main-qa routing it exists to drive never fires
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
# transition-node's unconditional origin/main refresh of intentions/<id>.md overwrites an uncommitted worktree body edit before it is ever read, so qa-fix's `## needs-main residue` append never reaches origin/main and the review -> main-qa routing it exists to drive never fires

## Provenance

- **Source:** review-fix pass on PR #2973 (`tactic-transition-node-stamp-landed-body`), finding `deferred-filing` (code-review lens, residue phase).
- **Location:** `.claude/skills/dispatch-propagate/scripts/transition-node`, the refresh-before-read block.
- **Failure scenario:** `.claude/skills/qa-fix/SKILL.md:355-358` documents the node-target lane as appending a `## needs-main residue` section to `intentions/<node-id>.md` and states "That append rides in the Step-4 `transition-node` commit." It does not ride in. `transition-node` unconditionally does `git show origin/main:intentions/$NODE_ID.md > $REPO_ROOT/intentions/$NODE_ID.md` as its first action (introduced in #2939) — before `read_node_json`, before the freshness gate, before anything else. An uncommitted worktree body edit sitting there is destroyed with no diagnostic, so the residue never reaches origin/main, `hasNeedsMainResidue` reads false at the `review` hop, the node routes `review -> done` instead of `review -> main-qa`, and the post-merge verification the residue exists to drive never happens.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — Lane A (`code-review`) residue finding, dispositioned `Deferred` by the residue phase without a separate verify pass (Lane A findings are pre-vetted by the built-in `/code-review` skill's own internal review).
- **Recommended fix:** Decide and record the real contract, then make it enforceable — option (a): have `transition-node` preserve an uncommitted body edit across its origin/main refresh (refresh only the frontmatter, or detect a dirty `intentions/<id>.md` and merge/refuse rather than clobber); option (b): change `/qa-fix` Step 3.6 to land the residue via its own `graph-commit` (plus a `restamp-scope-fingerprint --from-rev origin/main` call so the scope-custody stamp follows) BEFORE invoking `transition-node` in Step 4, and update the skill text to describe that sequence. Either way, add a guard so a silently-discarded worktree node edit is impossible — e.g. `transition-node` fails loud when `intentions/<id>.md` is dirty relative to its index/HEAD state rather than overwriting it. Context: the comments in `transition-node`'s `refresh_stamp()` and in `test-graph-write-rollback.sh` Case 5 were corrected on PR #2973 to state the current (clobbering) behavior accurately, and Case 5 now lands its fixture residue on origin/main out-of-band, so nothing in the test suite asserts the broken premise — this follow-up is only about the production behavior.
- **Source PR:** #2973
