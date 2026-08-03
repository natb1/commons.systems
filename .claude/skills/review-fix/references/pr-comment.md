# Step 6 PR-comment composition detail

Referenced from Step 6. Post exactly **one** PR comment covering **every** finding
from `result.dispositions` and its bucket. Reuse the `PR_NUM` captured in the
preamble — do not re-resolve.

## Compose incrementally

There is still exactly **one** comment — but **compose it incrementally**, not
only at phase end, so a dead session leaves the resolved-so-far dispositions
already on the PR (condition 9: phase progress whose only home is the session is
a defect):

- Give the comment body a first-line marker `<!-- dispatch:review-fix -->` (the
  marker-comment anchor pattern `dispatch-write-plan` / `dispatch-qa-noprogress`
  use — first line only, matched by `startswith`, never `contains`).
- **Create** the comment as soon as the first finder/verify disposition
  resolves, via `post-pr-comment.sh` (which returns the new comment ID). Capture
  that ID.
- **Edit it in place** as each subsequent disposition resolves — rewrite the
  body file and `gh api repos/{owner}/{repo}/issues/comments/<id> -X PATCH
  --field body=@tmp/<file>` (use `dangerouslyDisableSandbox: true`). A resumed
  run re-finds the same comment by its marker via the `dispatch_marker_comment_id`
  helper (`lib.sh`) rather than posting a duplicate.
- The phase-end pass then only **finalizes** the same comment — one last
  edit-in-place with the complete bucket set below; it does not post a second
  comment.

## Body organization

Write the comment body to a file under the repo's `tmp/` directory. The body file
**must** live under `tmp/` because `post-pr-comment.sh` restricts paths to that
directory. Organize the body by disposition bucket, omitting any bucket with no
entries (on a docs-only / empty diff the security note from `result.security_note`
stands in for the security buckets):

- **Fixed** — code-review findings implemented; one line per finding plus
  the fix commit SHA from Step 3.
- **Required (security)** — security findings fixed; one line per finding plus the
  fix commit SHA, or the reason if left unresolved.
- **Refuted (adversarial-verify dropped)** — Required findings refuted by the
  adversarial-verify step; one line per entry from `result.verify_report` with
  verdict and rationale. These were **not** fixed; include the skeptic rationale
  so the audit trail explains the drop.
- **Informational** — surfaced for human reference; no action.
- **Dismissed** — code-review false positives or nits; each with a
  one-line rationale.
- **False-positive (security)** — each with a one-line rationale.
- **Deferred** — out-of-scope code-review findings; each references its
  follow-up issue `#<N>` from Step 5a. A Deferred entry may also be an
  *untriaged* Lane-A residue item the residue phase never reached (the
  residue-disposition agent died before triaging it) rather than a
  deliberate defer decision — its follow-up is filed the same way, via
  Step 5.
- **Out-of-scope (security)** — pre-existing CodeQL/npm findings; each meaningful
  one references its follow-up issue `#<N>` from Step 5b. CodeQL-sourced findings
  are identified by their `rule.id` and alert number (from `codeql_ref`), linked
  via their `html_url`.

If a security reviewer or inline scan could not run (re-launch / retry exhausted),
note partial coverage here — name the reviewer or scan whose domain could not be
reviewed. When `result.coverage_incomplete` is true, include `result.coverage_note`
in this partial-coverage line — the note names the cause: a throttled
probe wave, an unverified instrument, or Lane-A residue left undispositioned
by a dead residue-disposition agent — and may name more than one, when
multiple causes co-occur in the same run. If every bucket is
empty and there was no security note, the comment is still well-formed (render
empty buckets as `_None._`).

## Flush

Then flush it (use `dangerouslyDisableSandbox: true` — these invoke `gh`).
On the **first** flush, create the marker comment and capture its ID:

```bash
CID=$(.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>)
```

On every **subsequent** flush and the phase-end finalize, edit the same comment
in place (never a second `post-pr-comment.sh` — that would stack a duplicate):

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh api "repos/${REPO}/issues/comments/${CID}" -X PATCH --field body=@tmp/<file>
```

A resumed run recovers `CID` by re-finding the `<!-- dispatch:review-fix -->`
marker comment (`dispatch_marker_comment_id`, `lib.sh`) instead of re-creating it.
