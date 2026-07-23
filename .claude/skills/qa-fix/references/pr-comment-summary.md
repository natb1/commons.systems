# Step 4 — PR-comment summary and phase-log

This reference carries the full composition detail for the Step 4 PR-comment
summary and the qa phase-log write in `SKILL.md`. The body holds the terse
"finalize the `<!-- dispatch:qa-summary -->` comment and write the phase-log"
control flow.

`PR_NUM` was resolved in the idempotency preamble — reuse it; do not re-resolve.

Write a markdown summary to `tmp/qa-fix-summary-<n>.md` (where `<n>` is the
Step-0-resolved issue number `<N>`) with a first line of `<!-- dispatch:qa-summary
-->` — the same marker the Step-2 incremental flush uses, so this phase-end
post **finalizes that same comment in place** rather than stacking a second.
Include:
- Items executed (across all three lanes).
- PASS / FAIL / SKIP counts.
- **Deferred to office-hours** — each `needs-human-judgment` item **whose
  disposition class is `needs-human`** (i.e. neither `needs-main` nor
  `already-satisfied`), listed so the `/office-hours` walkthrough can pick them
  up. A `needs-human-judgment` item the triage classified `needs-main` is filed
  as a follow-up per Step 3.6 instead (see the filed-follow-ups sub-list below)
  and is **not** deferred to office-hours. A `needs-human-judgment` item the
  Workflow classified `already-satisfied` is dropped as PASS (in
  `result.already_satisfied`) and is likewise **not** deferred to office-hours.
- List of bugs found (if any), each with the item title and the finding.
- When the walkthrough lane ran: the GIF filename (`tmp/qa-fix-walkthrough-<n>.gif`).
- **Disposition triage** — include this section only when the residue list was
  non-empty (i.e. Step 3.5 ran). For each **disposition item**, list its `class`
  from `result.dispositions`. For `needs-human` items — plus planned-deferral
  items, now `needs-main` — choose the verify source by joining the disposition
  back to the in-memory residue list by `id` and reading
  `residue[item].planned_deferral`:
  - **Aesthetic items** (`dispositions[item].aesthetic === true`): use
    `dispositions[item].verify` (which will be `n/a`) directly — no
    `verify_report` entry exists for them.
  - **Planned-deferral items** (`residue[item].planned_deferral === true`): these
    classify `needs-main` (not `needs-human`) and are filed as a `blocked_by`
    follow-up in Step 3.6. Use `dispositions[item].verify` (which will be `n/a`)
    directly — they are excluded from the skeptic candidate set and have no
    `verify_report` entry. The deferral reason rides `residue[item].finding`, which
    flows into the `needs-main` follow-up body (measured downstream), rather than
    awaiting an office-hours walkthrough.
  - **All other non-aesthetic, non-planned-deferral `needs-human` items**: include
    the verify verdict and rationale from the matching entry in
    `result.verify_report` (matched by `id`).

  If the residue list was empty (Step 3.5 was skipped), omit this section entirely. If
  `result.dispositions` is empty (every residue item was `already-satisfied`),
  skip the per-item enumeration and the `needs-main` handling prose below — there
  are no disposition items and no `needs-main` items to describe; only the
  **Assessed by Opus (already satisfied)** sub-section applies.

  When `result.dispositions` contains any item, always state the `needs-main`
  handling: **"`needs-main` items are filed as `blocked_by` follow-ups (Step 3.6)
  and dropped from the escalation set, so they do not park this PR."**

  The remaining terminal-behavior prose is **conditional** on which Step-3.7 path
  this pass took:
  - **Fixing pass** (Step 3.7 took the fix finalize path): say which items
    actually landed and which were deferred. List only the units confirmed
    landed (the ones counted into the `fixes_applied_count` tally) — **not** the
    full planned opus-fixable set. Note the dimension difference: the outcome
    envelope's `fixes_applied` is the number of resolved opus-fixable finding
    IDs, while this PR comment lists the *units* that landed; the listed landed
    units collectively resolved `fixes_applied_count` findings (so a reader does
    not re-read `fixes_applied` as a count of the listed units). Any opus-fixable
    unit whose `/implement-unit` invocation
    did not reach its Step 4 (errored, died, or returned without a landed
    commit, so it was not counted) goes in a separate "failed to land" list,
    not the fixed list — e.g. **"Fixed this pass: \<opus-fixable items where
    /implement-unit landed a commit, i.e. that contributed to fixes_applied_count>;
    failed to land: \<opus-fixable items where /implement-unit did not reach
    its Step 4>; deferred to re-QA: \<needs-human items>; filed as follow-ups:
    \<needs-main items>."** The fixed commits restart CI and the chain re-QAs
    once it passes; the deferred `needs-human` items re-surface on a later
    pass, while the `needs-main` items were already filed in Step 3.6.
  - **Non-fixing pass** (no opus-fixable items, so residue escalates; or the
    Step-3.7 escalate finalize path fired) — keep the existing escalation
    framing: every `opus-fixable`/`needs-human` residue item escalates to
    office-hours below, exactly as before, while `needs-main` items were filed as
    follow-ups (Step 3.6) and dropped from the escalation set.
- **Filed follow-ups** — include this sub-list only when Step 3.6 ran. For each
  `needs-main` item, list its follow-up: `#<followup-N>` (newly filed), or
  "already tracked by #<N>" (an existing tracking issue was found via
  `dispatch-followup-exists`), using the `identifier`→`<N>` mappings Step 3.6
  captured. Record each follow-up's **route** from the `identifier`→`route`
  map: an `autonomous` follow-up routed to the `/qa-main` handler (`main-qa`
  only), versus a `human` follow-up routed to office-hours human review
  (`main-qa` + `dispatch:office-hours`).
- **Assessed by Opus (already satisfied)** — include this sub-list only when
  `result.already_satisfied` is non-empty. For each item in
  `result.already_satisfied`, list its `title` and `rationale`. These items had
  their acceptance criterion provably met at QA time — no code defect exists and
  no human input is needed — so they are dropped as PASS and do not park the PR.

Finalize the `<!-- dispatch:qa-summary -->` comment in place (use
`dangerouslyDisableSandbox: true` — these invoke `gh`). Re-find it by marker
via `dispatch_marker_comment_id` (`lib.sh`); edit it if it exists (the Step-2
flush created it), else create it once:
```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
CID=$(dispatch_marker_comment_id "$PR_NUM" '<!-- dispatch:qa-summary -->')
if [ -n "$CID" ]; then
  gh api "repos/${REPO}/issues/comments/${CID}" -X PATCH --field body=@tmp/qa-fix-summary-<n>.md
else
  .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/qa-fix-summary-<n>.md
fi
```

## Write the qa phase-log entry

After the summary is posted, write a terse "what-failed / what-changed" digest to
the issue's cross-phase handoff note so the next worker (a re-QA tick, or a later
phase) inherits what this pass found. Compose the entry body first into
`tmp/phase-log-entry-<n>.md` (`<n>` = the Step-0-resolved `<N>`): a
one-line-per-finding digest of what failed and what changed; a clean pass writes
a body like `failed: none`. Then write it (use `dangerouslyDisableSandbox: true`
— the script invokes `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log \
  "$N" --phase qa --attempt "$ATTEMPT_N" < tmp/phase-log-entry-<n>.md
```

**Attempt-stability is critical:** tag the entry with the **same** `ATTEMPT_N`
resolved in the preamble — the value the summary used — **not** a freshly
recomputed one. The upsert keys on (phase, attempt), so a stable attempt number
is what makes re-entry idempotent: a crash-rerun of the *same* logical attempt
re-resolves the same `ATTEMPT_N` and upserts the same inner-marker section in
place rather than appending a duplicate. (A genuine new attempt — after the Step
3.7 fixing gate has applied a new `dispatch:qa-fix-attempt-<n>` label — resolves
a higher `ATTEMPT_N` and appends a new section; that cross-attempt append is the
intended handoff, not a duplicate.)

**This write is NOT a terminal action.** It must **precede** the
`dispatch:qa-done` label apply / completion marker, which remain the last
durable actions on every path (the Step 3.7 fix-finalize marker, the Step 3.7
escalate-finalize deviation, and the Step 6 clean-pass `qa-done` + marker all
run after Step 4). The marker / label ordering is preserved — `qa-done` stays
terminal.
