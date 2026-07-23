# Step 5 follow-up filing detail

Referenced from Step 5. Two follow-up paths (5a, 5b), the node-lane draft-node
supersession, the static-label guarantee, and the follow-ups-filed counting rule.
Skip a path when its bucket is empty.

## Node-target lane (`TARGET_KIND=node`) — supersedes 5a/5b entirely

A node target files **no gh issue**: new work never enters the graph through gh
(strategy condition 1). The prepared `result.deferred_filings` and
`result.security_followup_input` structures are instead written as **draft
tactic nodes** — `status: raw`, no `phase`, `serves` the same strategy this
tactic serves — batched per component, one `write-node.ts` build plus one
`graph-commit`. Each draft's body records the finding provenance:
`file:line`, failure scenario, adversarial verdict, and the source PR
(`execution.pr`). `body` is not a `write-node.ts` input field — the script
discards unknown keys, and a new node's body is always regenerated from
`statement` as a `# <statement>` placeholder
(`packages/intentionsutil/src/store.ts:47`). So write each draft's provenance as
a separate step, folded into the one-build-plus-one-commit sequence above:

1. Run `write-node.ts` with only the frontmatter fields above (including
   `status: raw`).
2. Then edit each `intentions/<draft-id>.md` directly, replacing the generated
   `# <statement>` placeholder that appears after the closing `---` fence with
   the provenance content (`file:line`, failure scenario, adversarial verdict,
   and `execution.pr`).
3. Then run `graph-commit`.

These hand-authored bodies are durable across any later frontmatter-only rewrite
of these nodes: `writeNode` calls `readExistingTacticBody`
(`packages/intentionsutil/src/store.ts:84-88`), which reads a `tactic` node's
on-disk body verbatim and reuses it instead of regenerating the placeholder
whenever the file already exists — so a subsequent write that only touches
frontmatter preserves the provenance written in step 2. Skip the
`dispatch:review-followup` label, the
`<!-- dispatch:source-pr -->` marker, and the orphan-retriage machinery
entirely — drafts are inert until a later `/align-tactics` round finalizes
them, and that round re-validates the provenance against what actually merged.
Use the worktree's own `packages/intentionsutil/scripts/write-node.ts` +
`graph-commit` (the graph-tick worker applies the reset-dance a PR-branch
worktree needs). Then skip to Step 6. The legacy lane (`TARGET_KIND=issue`)
runs 5a/5b below unchanged.

## Follow-ups-filed counting rule

`result.followups_deferred` is the count of Step-5a filing subagents the Workflow queued (not yet filed); it drives the Step-5a fan-out and is NOT the value emitted to `--followups-filed`. Track instead how many Step-5a and Step-5b follow-ups were ACTUALLY filed this run — count only NEW `<disposition>` records (EXISTING records returned by `/file-issue` were not filed this phase). Use the already-captured `<N>` records from the "Capture each `<N>`" lines in 5a and 5b for this count; introduce no new tracking mechanism. Pass that count, not `result.followups_deferred`, as the `--followups-filed` total.

## Source-PR marker and static label

Every follow-up filed in this step receives (a) a
`<!-- dispatch:source-pr <PR_NUM> -->` body marker recording which PR's review
surfaced the finding, and (b) the static `dispatch:review-followup` label. The
marker is the machine key read by the `dispatch-retriage-orphaned-followups`
scan (gated by the static label as a cheap server-side pre-filter) to park
orphaned follow-ups when PR #<PR_NUM> is later closed without merging — without
the marker, such follow-ups silently point at code that never landed on main.

The static label must exist before the 5a/5b subagents add it: a missing label
makes every `--add-label dispatch:review-followup` a silent no-op AND makes the
`dispatch-retriage-orphaned-followups` scan's server-side `--label` pre-filter
match nothing, so orphaned follow-ups become permanently invisible to re-triage.
Guarantee its presence with a single create-on-not-found in THIS main thread,
**before** the 5a/5b fan-out — run it once when either bucket is non-empty (it is
race-free here because the fan-out has not started, so the parallel subagent adds
in 5a/5b stay plain idempotent `--add-label` calls with no per-subagent create
dance). Use `dangerouslyDisableSandbox: true` — `gh` needs network, see
`.claude/rules/sandbox.md`:

```bash
# Ensure the static label exists once, in the single-threaded parent. `gh label
# create` is idempotent in effect: it exits non-zero with an "already exists"
# message when the label is already present (the common case), which is benign.
# Any OTHER failure is a real error worth surfacing.
create_out=$(gh label create "dispatch:review-followup" \
  --color "5319e7" \
  --description "dispatch: review-fix out-of-scope follow-up (source PR in body marker)" \
  2>&1) || [[ "$create_out" == *"already exists"* ]] \
  || echo "review-fix: warning: could not ensure dispatch:review-followup label: $create_out" >&2
```

## 5a. Deferred code-review findings → `/file-issue` with a blocked-by link

The Workflow prepares `result.deferred_filings`, each entry carrying `title`,
`body`, and `blocker_issue_nums` (the implementing issue numbers from
`Closes #N`, or `"independent"`). The main thread also passes the run-level
`PR_NUM` (the PR under review, captured in the preamble) into each fork prompt
alongside `title`, `body`, and `blocker_issue_nums`. For each entry, fork a
subagent (`subagent_type: general-purpose`, `model: sonnet`). When these
subagents return, this is mid-tail — continue to Step 6 without a closing
summary. The subagent:

1. Invokes `/file-issue` with a leading `--follow-up` token prepended to the
   `$INPUT` it builds from the finding's `title` and `body` (the token must come
   first so file-issue's leading-token strip recognizes it and classifies a non-bug
   finding as `enhancement`). `/file-issue` runs the full pipeline: duplicate
   detection, 8-category evaluation, decomposition gate, type/topic classification,
   issue creation, `@me` assignment, and the `help wanted` label. `/file-issue` ends
   with a `===FILE-ISSUE-RESULTS===` … `===FILE-ISSUE-RESULTS-END===` block; read
   every `<disposition> <N>` record line between the sentinels and iterate steps 2–4
   over each. A single finding normally yields one record; a finding that legitimately
   separates into multiple issues yields several — link them all.
2. For each record, for a non-independent finding, record a `blocked_by` dependency
   **on the new issue `<N>`, targeting each blocker issue number** from
   `blocker_issue_nums`. The target is the GitHub **issue** — never the PR number,
   and the dependency is the API relationship, never body text. Use the
   `ref-github-issues` dependencies API (database-ID resolution with `gh api`,
   `--input` JSON; see `ref-github-issues`, do not restate the syntax). On an
   `EXISTING <N>` record, first list `<N>`'s current `blocked_by` (same
   dependencies API — see `ref-github-issues`) and skip the POST for any blocker
   already present, so a duplicate does not error. An `independent` finding records
   no dependency.
3. Appends the source-PR body marker via read-modify-write, then adds the static
   `dispatch:review-followup` label, to each `<N>` (use `dangerouslyDisableSandbox:
   true` — `gh` needs network, see `.claude/rules/sandbox.md`):

   ```bash
   # (a) Read-modify-write: `gh issue edit --body` REPLACES the whole body, so
   # fetch the current body and append the marker as the last line — never pass
   # the marker alone, which would clobber the finding content /file-issue wrote.
   BODY=$(gh issue view <N> --json body -q .body)
   gh issue edit <N> --body "$BODY

   <!-- dispatch:source-pr <PR_NUM> -->"
   # (b) Add the static label. The main thread ensured it exists once at the top
   # of Step 5 (create-on-not-found, before this fan-out), so adding it here is a
   # plain idempotent, race-free `--add-label` — NO per-subagent create dance.
   gh issue edit <N> --add-label "dispatch:review-followup"
   ```
4. Returns every `<N>` to this thread.

Capture each `<N>` against its source finding for the Step 7 comment.

## 5b. Meaningful out-of-scope CodeQL alerts / npm advisories → `dispatch-security-followup` → `/file-issue`

The Workflow prepares `result.security_followup_input` (the codeql/npm out-of-scope
subset). Pipe it through `dispatch-security-followup` with `PR_NUM` (pure — no
network/git/gh, runs sandboxed-fine):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-security-followup "$PR_NUM" \
  < <(printf '%s' '<result.security_followup_input as JSON array>')
```

It applies the threshold and emits a JSON array of `{identifier, title, body}`
follow-ups (empty when none qualify). CodeQL emits one follow-up per alert; npm
emits one follow-up per vulnerable package. Each `identifier` — CodeQL
`rule.id` + alert number, or `npm advisories in <package>` — is embedded
verbatim in the `title`. Before filing, the per-follow-up subagent runs
`dispatch-followup-exists "<identifier>"`, a deterministic exact-identifier
existence check spanning all issue states (`--state all`, open and closed), so
the same alert or package is never re-filed across repeated runs or multiple PRs.

**Meaningfulness threshold** (documented to keep follow-up noise low):

- CodeQL: an alert classified `out-of-scope` with `security_severity_level` of
  `critical`, `high`, or `medium`.
- npm: a package qualifies if any of its `out-of-scope`,
  not-introduced-by-diff (`introduced_by_diff=false`) advisories is rated
  `high` or `critical`. The follow-up is grouped per package (one issue per
  vulnerable package) because `npm audit` reports each GHSA in a coordinated
  disclosure as a separate advisory on the same package node, all fixed by a
  single version bump.
- `required` and `false-positive` findings are never filed.

For each emitted follow-up, fork a subagent (`subagent_type: general-purpose`,
`model: sonnet`); run them in parallel (multiple Agent calls in one message). When
these subagents return, this is mid-tail — continue to Step 6 without a closing
summary. Each subagent:

1. Runs the deterministic existence check (use `dangerouslyDisableSandbox: true`
   — `gh` needs network, see `.claude/rules/sandbox.md`), passing the follow-up's
   `identifier`:

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-followup-exists "<identifier>"
   ```

   If it prints an issue number, an open or closed tracking issue already covers
   this identifier — skip `/file-issue` entirely: do not file, do not re-label.
   Record the follow-up as already-tracked, mapping its `identifier` to the
   existing issue `#<N>` for the Step 7 comment, and return that `<N>`. Otherwise
   proceed to the next step.
2. Invokes `/file-issue` with a leading `--follow-up` token first, then the
   follow-up's `title` on the next line and its `body` after (the `--follow-up`
   token is a classification no-op for a security follow-up, which never carries
   `enhancement`, but is passed for consistency). `/file-issue` owns duplicate
   detection, creation, `@me` assignment, the `help wanted` label, and type + topic
   classification; it ends with a `===FILE-ISSUE-RESULTS===` …
   `===FILE-ISSUE-RESULTS-END===` block. Read the `<disposition> <N>` record(s)
   between the sentinels — a single machine-keyed follow-up normally yields one
   record; iterate step 3 over each if more.
3. Applies the topic, type, and static review-followup labels to each `<N>`,
   then appends the source-PR body marker via read-modify-write (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   gh issue edit <N> --add-label security --add-label bug --add-label "dispatch:review-followup"
   ```

   Since `/file-issue` (step 2) now classifies and applies a type label at creation via `ref-issue-labels`, and a `dispatch-security-followup` body describes an identified failure mode — a CodeQL alert at a specific location, or named npm advisories with severities — the classifier already applies `bug`; this `--add-label bug` is therefore idempotent reinforcement, `--add-label security` adds the topic, and exactly one type label results with no atomic type-swap needed. The `dispatch:review-followup` label was ensured present once by the main thread at the top of Step 5 (create-on-not-found, before this fan-out), so adding it here is idempotent and race-free — no per-subagent create-on-not-found dance. Then append the source-PR marker (read-modify-write, same recipe as 5a — `gh issue edit --body` REPLACES the whole body, so never pass the marker alone):

   ```bash
   BODY=$(gh issue view <N> --json body -q .body)
   gh issue edit <N> --body "$BODY

   <!-- dispatch:source-pr $PR_NUM -->"
   ```

4. Returns `<N>` mapped to the follow-up's `identifier`.

Capture each `<N>` against its source finding for the Step 7 comment.

The 5a and 5b follow-up subagents touch only GitHub and the working tree never,
so they may be fanned out in the same message as one another (Step 3's
`/commit-merge-push` has already returned by this point).
