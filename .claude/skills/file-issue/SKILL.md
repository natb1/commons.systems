---
name: file-issue
description: RETIRED — do not invoke. Superseded by /align and /align-tactics; use those instead.
---

# File Issue (RETIRED)

This skill is retired: no live code path reaches it.

Two independent facts make it unreachable. GitHub Issues are disabled
repo-wide on this repo (recorded as a strategy clarification dated 2026-07-16
and cited in `intentions/tactic-graph-native-dispatch.md` §4), so no issue can
be created. And `dispatch-select-tick`'s legacy gh-issue-queue selection path,
along with the `dispatch-select-target` and `dispatch-route` scripts, were
deleted from `origin/main` by `tactic-dispatch-legacy-rewire` (PR #2869,
merged 2026-07-18) — not by `tactic-legacy-router-removal`, which only records
the fact (see its "What actually landed" section). So no legacy issue target
is selected in the first place.

Unreachable is not the same as absent. Residual `/file-issue` invocations do
still appear in the repo — each inside a phase skill's legacy
`TARGET_KIND=issue` lane, where the same skill's graph-native node lane already
supersedes it. The list below is a snapshot of the *skill-doc* invocation sites,
not a frozen inventory; regenerate it before any sweep with:

```
grep -rn '/file-issue' .claude/skills/
```

(that grep also surfaces non-invocation mentions — dispatch script comments,
`rsi-audit` test fixtures, `align` narrative prose — which are
descriptive, not call sites.)

- `.claude/skills/qa-fix/references/needs-main-followups.md` — Step 3.6
  needs-main follow-up filing; superseded by that file's "Node-target lane"
  section. Its caller in the SKILL body is
  `.claude/skills/qa-fix/SKILL.md:362` (the legacy `TARGET_KIND=issue` lane's
  `dispatch-followup-exists` → `/file-issue` → `blocked_by` chain).
- `.claude/skills/review-fix/references/followup-filing.md` — Steps 5a and 5b;
  superseded by that file's "Node-target lane … supersedes 5a/5b entirely".
  The same two steps are also named in the SKILL body at
  `.claude/skills/review-fix/SKILL.md:390-391`.
- `.claude/skills/fix-checks/SKILL.md` — the `NONE` disposition of the flake
  find-or-file; its node lane "never calls `gh issue` or `/file-issue`", and
  the §4 coverage matrix records the graph-native home as tracked by
  `tactic-fix-checks-graph-native-flake-tracking`.
- `.claude/skills/qa-main/SKILL.md` — the broken lane's implement-chain bug
  filing, in Steps 1–6 (the legacy issue lane); the node lane writes a bug
  tactic instead.

Removing or rewiring those legacy branches is not
`tactic-legacy-router-removal`'s work. §4 of
`intentions/tactic-graph-native-dispatch.md` records where each legacy behavior
lands.

`/file-issue` was the legacy gh-issue-lane skill for filing and improving
GitHub issues: it separated multi-topic input into independent issues and ran
a full evaluation pipeline (duplicate detection, quality checks, decomposition,
type/topic classification) with no approval gate.

The intention-graph lane has superseded it:

- **`/align`** — interview-driven recording of a `strategy-*`
  intention node. This is the graph-native successor to `/file-issue`'s
  requirements-definition role.
- **`/align-tactics`** — breaks a recorded `strategy-*` intention node into
  PR-sized tactic subtrees. This is the graph-native successor to
  `/file-issue`'s epic-structuring (decomposition) role.

For any future work that would previously have gone through `/file-issue`,
use `/align` and `/align-tactics` instead.

The scripts under `.claude/skills/file-issue/scripts/` are left in place
unchanged; this retirement touches only this SKILL.md.
