---
id: tactic-club-benchmark-explorer-workspace
kind: tactic
statement: Bring the club benchmark explorer under the claude-artifact delivery
  practice — its source into a projects/club workspace with a deterministic
  single-file build, and artifact discovery widened past the artifacts/ prefix
  so CI's contract check and render smoke cover the page
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-28 in PR #3116, which added a preview artifact for
  the benchmark explorer and recorded the published-artifact working loop as
  .claude/rules/published-artifacts.md. That work exposed the gap it did not
  fix: the explorer's page is hand-authored HTML committed as-is at
  projects/club/claude/benchmark-explorer-src.html, which parts (1) SOURCE IN A
  WORKSPACE and (2) DETERMINISTIC SINGLE-FILE BUILD of this strategy's five-part
  practice rule out, so the artifact-check job built by
  tactic-artifact-build-and-ci-contract does not see it. Draft (phase absent):
  not selectable until decomposed."
reading: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications:
  - question: Where does the workspace live, and why not under artifacts/?
    answer: "AUTHOR RULING 2026-08-28: projects/club IS the workspace — the club
      directory itself, not a new artifacts/club. artifacts/plan-view is the
      existing precedent but its PREFIX is not the rule; this strategy's
      boundary is that apps are unscoped workspace roots and libraries are
      scoped @commons-systems/* leaves (clarification 4), and
      tactic-projects-app-relocation is already collapsing the manifest toward
      [\"projects/*\",\"packages/*\"]. A club workspace under projects/ moves
      with that collapse instead of against it. Note projects/ today holds
      document directories only — no package.json exists anywhere under it — so
      this is the first runnable workspace there and should not assume sibling
      conventions that do not yet exist."
  - question: What in CI keys on the artifacts/ prefix, and therefore has to change?
    answer: "(Read at origin/main 2026-08-28.) Two places, both prefix-keyed, both
      of which make a projects/club workspace invisible to the artifact gate
      until they are widened. (1) run-artifact-check.sh discovers workspaces by
      filtering the root manifest with w.startsWith(\"artifacts/\"). (2)
      detect-changes.sh emits artifact=true on
      ^(artifacts/|packages/ds/|intentions/|\\.claude/skills/dispatch-propagate\
      /scripts/run-artifact-check\\.sh$). Widening them is IN SCOPE for this
      tactic. Constraint from run-artifact-check.sh's own header: discovery must
      stay derived from the manifest, never a hand-maintained list — a new
      artifact workspace is meant to be covered with no registration step.
      Candidate mechanisms for planning to settle, not decided here: a marker
      field in the workspace's package.json, or the presence of
      scripts/check-artifact.mjs. Whatever is chosen must keep
      artifacts/plan-view covered."
  - question: What must survive the move unchanged?
    answer: "(Recorded 2026-08-28.) The live artifact at
      https://claude.ai/code/artifact/c90fad60-5217-4399-9bb1-17bb1c2a54ad — it
      is updated by republishing with THAT url, and publishing without it mints
      a second artifact and orphans the live one. The dev preview at
      https://claude.ai/code/artifact/ee469004-6be9-4f6f-b87a-7fffda1a9822 stays
      the preview target. The loop in .claude/rules/published-artifacts.md is
      unchanged by this work: the committed source stays the baseline, previews
      go to the second artifact, and the merged source is deployed from main.
      The build must emit the AUTHORED PAGE ONLY — the publish-time <!doctype
      html>/<head>/<body> wrapper is added by the artifact service and is
      deliberately not committed, so a build that emits a full document would
      break the contract check's expectations for this page."
  - question: What is out of scope?
    answer: "The explorer's model, calibration, copy and visual design. This is a
      relocation plus a build, and the page's rendered behavior must be
      unchanged: verify by diffing the built file against
      projects/club/claude/benchmark-explorer-src.html at the commit the work
      starts from, which was confirmed byte-identical to the live artifact on
      2026-08-28. Also out of scope: migrating any other document under
      projects/club, and the artifacts/plan-view workspace itself beyond keeping
      it covered by whatever discovery replaces the prefix filter."
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
# Bring the club benchmark explorer under the claude-artifact delivery practice — its source into a projects/club workspace with a deterministic single-file build, and artifact discovery widened past the artifacts/ prefix so CI's contract check and render smoke cover the page
