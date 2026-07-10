---
id: tactic-copy-change-audit-instrument
kind: tactic
statement: Ship a copy-change audit script that enumerates merged diffs touching
  in-scope copy paths over a commit range, so the office-hours owner audit of
  the copy-approval signal is repeatable rather than unbounded git archaeology
owner: ai
status: codified
parent: null
rationale: "strategy-author-approved-copy has reading: null, and its success
  sensor is an owner audit of merged copy changes at office-hours. Per
  /align-tactics Step 2.1, round 1 must ship the instrument that makes that
  sensor runnable — without it the round produces no fresh reading and the
  strategy dead-ends at the round cap. Path-based enumeration (keyed on in-scope
  copy file paths, not tactic text) is robustly mechanizable and matches the
  sensor's literal wording. This tactic produces the reading, so it carries the
  validates edge."
reading: null
gap: null
serves:
  - strategy-author-approved-copy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-copy-change-audit-instrument
  pr: 2800
  attempts: {}
  markers:
    - planned
    - qa-passed
    - reviewed
  strategy_fingerprint: c24f27f4d6208c07c5844c87fc747377755784a30749a9c39c578aa9ee7f5d1c
validates:
  - strategy-author-approved-copy
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Ship a copy-change audit script that enumerates merged diffs touching in-scope copy paths over a commit range, so the office-hours owner audit of the copy-approval signal is repeatable rather than unbounded git archaeology

## Context

`strategy-author-approved-copy` requires that every merged change to in-scope
copy trace to a recorded author approval. Its `success_signal` sensor is an
"owner audit of merged copy changes at office-hours" and its `reading` is
`null` — the signal has never been measured. Per `/align-tactics` Step 2.1
(instrument-first when unmeasurable), round 1 must ship the instrument that
makes this sensor runnable. Without it, the owner would have to hand-scan the
entire merge history for copy touches, and the round produces no fresh
reading.

The instrument is a script that enumerates merged diffs touching **in-scope
copy paths** (not tactic text — path-based enumeration is robustly
mechanizable) over a commit range, printing each changed in-scope file with
the commit(s) that touched it. The owner runs it at office-hours, then checks
each listed change against the approval record (a completed gate tactic or a
dated `clarifications` entry on the strategy). This turns the audit from
unbounded git archaeology into a repeatable, bounded enumeration.

In-scope copy per the strategy's scope clarification: landing, about page, app
heroes and onboarding text, README, and blog posts. Explicitly excluded:
in-app UI strings, practitioner reference docs (SCHEMA.md, package READMEs),
and GitHub issue/PR prose.

Deliberately **out of scope** for this tactic: mechanizing whether a change
was *approved* (that stays a human check against the graph at office-hours);
gating or blocking anything in CI; the planning-time gate mechanism itself
(that is `tactic-copy-approval-planning-rule`, the sibling tactic this round).
This tactic only enumerates the changes the audit must review.

## Unit 1 — copy-change audit script

**Recommended model:** sonnet

**Scope.** Add a new bash script
`.claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh` that:

- Accepts an optional `--base <ref>` argument (default `origin/main`) and an
  optional `--head <ref>` argument (default `HEAD`), and enumerates files
  changed between them with `git diff --name-only "$BASE"..."$HEAD"` — the
  same three-dot merge-base diff form used by
  `.claude/skills/dispatch-propagate/scripts/detect-changes.sh:11` and
  `get-changed-apps.sh:46`.
- Filters the changed-file list to the in-scope copy paths with a single
  `grep -E` on an explicit, commented path allowlist. Ground the allowlist in
  the actual repo layout (verified in this repo):
  - `^README\.md$` — the README.
  - `^landing/post/` and `^fellspiral/post/` — blog posts
    (`landing/post/*.md`, `fellspiral/post/*.md`).
  - `^landing/index\.html$` and `^fellspiral/index\.html$` — site shells with
    narrative copy.
  - `^landing/src/pages/` — narrative pages (`About.tsx` lives here).
  - `^landing/src/hero-config\.tsx$`, `^landing/src/site-config\.ts$`,
    `^fellspiral/src/site-config\.ts$` — hero and onboarding/site copy.
- For each matching file, prints the file path followed by the short hashes
  and subjects of the commits in the range that touched it
  (`git log --oneline "$BASE".."$HEAD" -- "$file"`), so the owner can jump to
  the exact change.
- Prints a clear "no in-scope copy changes in <range>" line and exits 0 when
  the filtered set is empty (the expected steady state — a clean audit), and
  lists the changes and exits 0 when non-empty (enumeration is report-only; it
  never fails the audit — approval-checking is the human's job).
- Carries a header comment block documenting: the in-scope path allowlist and
  why each entry is copy (mirroring the strategy's scope clarification), that
  the allowlist is the single place to widen scope when a later clarification
  does, and that the script enumerates *changes to review*, not *approval
  status*.

Keep the path allowlist as one clearly-delimited, commented block so widening
in-scope copy later (a future strategy clarification) is a one-place edit.

**Out of scope for this unit:** wiring the script into any automated flow,
CI check, or the office-hours skill; parsing approval records. The script is a
standalone tool the owner invokes.

**Reuse.**
- `.claude/skills/dispatch-propagate/scripts/detect-changes.sh` — the
  `git diff --name-only <base>...HEAD` + `grep -qE '^<path>/'` pattern for
  path-category detection; copy its diff/grep structure.
- `.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh` — the
  `--base` arg-parsing scaffold (lines 17–35) and the `origin/main` default,
  and the `set -euo pipefail` + `SCRIPT_DIR`/`REPO_ROOT` header convention.
- Model the file header and naming on the existing audit/scan scripts in the
  same dir (`dispatch-reclaim-audit`, `dispatch-drift-scan`).

## Verification

Prose (the script is a git-diff enumerator; verify by driving it against real
history):

- Run `bash .claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh
  --base <a-ref-before-a-known-README-or-blog-edit>` and confirm the touched
  in-scope file appears with its commit(s).
- Run it over a range containing only non-copy changes (e.g. a range of
  `packages/**` or `intentions/**` commits) and confirm it reports no in-scope
  copy changes and exits 0.
- Confirm a changed excluded path (e.g. an `office-hours/src/**` UI string, a
  `packages/**/README.md`, or a `SCHEMA.md` edit) does **not** appear in the
  output — the allowlist must not over-match.

```verify
bash -n .claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh
```
