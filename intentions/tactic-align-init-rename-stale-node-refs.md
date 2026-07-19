---
id: tactic-align-init-rename-stale-node-refs
kind: tactic
statement: Fix stale .claude/skills/align/ path references left in intention
  node bodies after the /align -> /align-init skill rename (e.g.
  tactic-sync-reader-skill body pointer to align/SKILL.md,
  tactic-dispatch-script-hardening body pointer to
  align/scripts/gather-context.sh)
owner: ai
status: codified
parent: null
rationale: "Deferred (low-severity, out-of-sweep-scope) findings from the
  terminal review of PR #2781 (tactic-align-init-skill) during the 2026-07-07
  graph-native router tick: the reference sweep was scoped to code, not
  intentions/ node bodies. One of the two refs is also captured as a main-qa
  residue on tactic-align-init-skill."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix stale .claude/skills/align/ path references left in intention node bodies after the /align -> /align-init skill rename (e.g. tactic-sync-reader-skill body pointer to align/SKILL.md, tactic-dispatch-script-hardening body pointer to align/scripts/gather-context.sh)

## Context

PR #2781 (`tactic-align-init-skill`) deleted the legacy `.claude/skills/align/`
skill directory and replaced it with `.claude/skills/align-init/`. That PR's
terminal review swept code for lingering `align/` path references but was
scoped to code, not `intentions/` node bodies — so two already-landed tactic
node bodies were left citing the deleted `align/` directory as a `path:line`
anchor. A stale anchor in a landed node's body silently misdirects a future
reader (or an `/implement-unit` session that trusts the anchor) to a
nonexistent path. This tactic corrects both citations to their current,
verified location.

A repo-wide sweep (`grep -rln '\.claude/skills/align/' intentions/*.md`,
2026-07-18) turned up 5 hits total, not just the 2 named in the statement.
The other 3 are **not** stale and are explicitly out of scope — do not touch
them:

- `intentions/tactic-align-entrypoint-consolidation.md:58` — a **draft,
  forward-looking** proposal to rename `align-strategy/` → `align/` in a
  *future* PR. Not yet landed; the `align/` mention describes a planned
  future path, not a broken current one.
- `intentions/tactic-align-curriculum-maintenance.md:112` — a **conditional**
  clause: "if `tactic-align-entrypoint-consolidation` ... has landed by
  implement time, apply the clause to ... `.claude/skills/align/SKILL.md`."
  Same forward-looking future path as above, correctly conditioned.
- `intentions/tactic-graph-native-dispatch.md:197` — **accurate history**:
  "Retire legacy `/align`. Delete `.claude/skills/align/` ..." describes the
  now-completed deletion itself (the action PR #2781 carried out). The
  directory it names correctly no longer exists — that is the point of the
  sentence, not a defect.

## Scope

One unit, two independent one-line body edits (no code changes, no frontmatter
changes on the target files beyond the body text below).

1. **`intentions/tactic-dispatch-script-hardening.md:114`** — change:

   ```
   - `.claude/skills/align/scripts/gather-context.sh:71` via
   ```

   to:

   ```
   - `.claude/skills/align-init/scripts/gather-context.sh:74` via
   ```

   Verified via `git show f1ba56bc^:.claude/skills/align/scripts/gather-context.sh`
   (the pre-deletion blob): line 71 there was
   `gh_issue_list_rest --state closed --limit 100 --include-title` — the exact
   call this unit's finding describes. The equivalent call in the current
   `.claude/skills/align-init/scripts/gather-context.sh` (confirmed present)
   is now at line 74 (`--paginate` was added by this same tactic's Unit 4,
   which already landed via PR #2840 — `phase: done` on that node — so this
   edit is purely a historical-record path/line correction, not a reopen of
   the unit). Out of scope: any other text in that node's Unit 4 section.

2. **`intentions/tactic-sync-reader-skill.md:344`** — change:

   ```
   paths. Invocation style precedent: `.claude/skills/align/SKILL.md:106`.
   ```

   to:

   ```
   paths. Invocation style precedent: `.claude/skills/align-init/SKILL.md:141`.
   ```

   Verified via `git show d967eda8^:.claude/skills/align/SKILL.md` (the
   pre-deletion blob): line 106 there was the
   `RUNG=$(npx tsx intentionsutil/scripts/detect-rung.ts)` invocation example
   under "Rung routing" — the `npx tsx <script>` capture-and-branch style the
   citation is illustrating. That exact invocation now lives in
   `.claude/skills/align-init/SKILL.md` under "Step 3 — Review virtues", at
   line 141 (`RUNG=$(npx tsx packages/intentionsutil/scripts/detect-rung.ts)`
   — confirmed present, same script, same style, just relocated and given a
   `packages/` path prefix). Out of scope: any other text in that node's
   Reuse section.

**Recommended model:** sonnet — two mechanical, pre-verified text
substitutions with no design judgment left to make; the replacement text and
target lines are already confirmed above.

## Reuse

- `write-node.ts` preserves an existing node's body verbatim across a
  frontmatter-only rewrite, so these two edits are plain body `Edit` calls on
  the target files — no `write-node.ts` frontmatter touch needed on either
  target node (their frontmatter is unaffected by this fix).
- `dump-node.ts` + `graph-commit --base` (the standard base-manifest pattern
  this skill's Step 5 uses) for landing, since both targets are pre-existing
  nodes.

## Verification

- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes after
  the edit (body-only changes; frontmatter untouched, so no schema rule is at
  risk, but this confirms no stray syntax broke `intentions/*.md` parsing).
- `grep -rn '\.claude/skills/align/' intentions/tactic-dispatch-script-hardening.md intentions/tactic-sync-reader-skill.md` — must return nothing (both stale hits gone).
- Manual: confirm both new targets exist and contain the cited content —
  `sed -n '74p' .claude/skills/align-init/scripts/gather-context.sh` shows
  the closed-issues paginate call; `sed -n '141p' .claude/skills/align-init/SKILL.md`
  shows the `RUNG=$(npx tsx ...)` invocation line. (These are restated from
  this planning session's own verification above — re-run them at implement
  time in case either target file changes again before this unit executes.)

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
