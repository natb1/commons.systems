# Step 6 PR-comment composition detail

Referenced from Step 6. Post exactly **one** PR comment covering **every** finding
in `.dispositions` and its bucket. This procedure is executed by the **Step-6
subagent**, not the main thread: it Reads the JSON at `result.result_path`
(absolute path, used exactly as given) and takes `.dispositions`, `.fixed`,
`.verify_report`, `.security_note`, `.coverage_incomplete`, and `.coverage_note`
from it. Every `result.<field>` named below is a field of that file.

Three inputs come from the **main thread**, not from that file — the subagent
re-resolves none of them:

- `PR_NUM`.
- the Step-3 fix commit SHA(s), or the note that `--merge-only` ran and there is
  no fix commit.
- the **Step-5 follow-up references**, keyed to the finding each covers: the
  follow-up issue numbers filed in 5a/5b on the issue lane, or the draft-node ids
  written on the node lane. `result.json` carries only the prepared filing inputs
  (`.deferred_filings`, `.security_followup_input`) — the records are filed after
  the Workflow returns, so the filed numbers/ids exist only in the main thread.
  Step 5 therefore runs to completion before this subagent is forked. When a
  bucket entry has no handed-in reference, say so in its line rather than
  inventing a number.

## Compose once, post or edit in place

There is exactly **one** comment, composed in a single pass from the complete
`result.json`. The Workflow returns only after every disposition has resolved
(the dump agent runs last, right before its return), so there is no partial state
to flush incrementally — the composer has the full bucket set on its first and
only pass.

What must hold (the durability mechanism, unchanged):

- The comment body's **first line** is the marker `<!-- dispatch:review-fix -->`
  (the marker-comment anchor pattern `dispatch-write-plan` /
  `dispatch-qa-noprogress` use — first line only, matched by `startswith`, never
  `contains`).
- **Create** it via `post-pr-comment.sh`, which returns the new comment ID.
- On a **resumed run**, re-find the existing comment by its marker via the
  `dispatch_marker_comment_id` helper (`lib.sh`) and **edit that comment in
  place** — `gh api repos/{owner}/{repo}/issues/comments/<id> -X PATCH --field
  body=@tmp/<file>` (use `dangerouslyDisableSandbox: true`) — rather than posting
  a duplicate. Never call `post-pr-comment.sh` a second time for the same PR;
  that stacks a duplicate comment.
- Return the comment ID and a one-line digest (`{ comment_id, digest_line }`) to
  the main thread. `digest_line` is a single terse "what the review found /
  fixed" line drawn from the buckets just composed — the main thread never reads
  `result.json`, so this return is its only per-finding source for the Step-7
  phase-log entry.

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
  follow-up issue `#<N>` from Step 5a — taken from the Step-5 follow-up
  references the main thread handed in (on the node lane the reference is the
  draft-node id, since that lane files no gh issue). A Deferred entry may also be an
  *untriaged* Lane-A residue item the residue phase never reached (the
  residue-disposition agent died before triaging it) rather than a
  deliberate defer decision — its follow-up is filed the same way, via
  Step 5.
- **Out-of-scope (security)** — pre-existing CodeQL/npm findings; each meaningful
  one references its follow-up issue `#<N>` from Step 5b — again from the handed-in
  Step-5 references (matched by the security `identifier`; a draft-node id on the
  node lane), never from `result.json`. CodeQL-sourced findings
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

## Post

Then post it (use `dangerouslyDisableSandbox: true` — these invoke `gh`).
When no marker comment exists yet, create it and capture its ID:

```bash
CID=$(.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>)
```

When one already exists — a resumed run — recover `CID` by re-finding the
`<!-- dispatch:review-fix -->` marker comment (`dispatch_marker_comment_id`,
`lib.sh`) and edit that comment in place (never a second `post-pr-comment.sh` —
that would stack a duplicate):

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh api "repos/${REPO}/issues/comments/${CID}" -X PATCH --field body=@tmp/<file>
```

Return `{ comment_id: <CID>, digest_line: "<one-line found/fixed summary>" }` to
the main thread.
