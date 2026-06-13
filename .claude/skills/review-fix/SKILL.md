---
name: review-fix
description: Review phase — the workflow's single terminal review pass. Runs the combined /review-fix fan-out through the Workflow tool: surface-conditional finders (code-review, review, security domain reviewers) in parallel → code dedup → classify → adversarial-verify (Required findings refuted by 2 skeptics before any Opus fix runs) → Opus fix fan-out → deferred/follow-up filing prep. Returns a compact disposition summary; applies fixes via one /commit-merge-push, files blocked_by follow-ups, posts one PR comment, and applies the dispatch:reviewed label
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by the dispatch chain. This
skill consolidates what were three separate review phases — code-review, review,
and security — into one pass over a single diff. It invokes the **Workflow tool**
on `.claude/workflows/review-fix.js`, which fans out surface-conditional finders,
deduplicates and classifies findings in code, adversarially verifies `Required`
findings before spending an Opus fix, and prepares filing structures. The skill
retains all bash/gh/git work the Workflow cannot do: the idempotency preamble,
diff capture, inline scans, the single `/commit-merge-push`, follow-up filing,
the PR comment, the `dispatch:reviewed` label, and the marker.

This is the workflow's **terminal actionable phase** — applying
`dispatch:reviewed` is its terminal action, so there is no separate phase after
it. Promotion of the PR to ready is owned by the router's
`dispatch-reconcile-ready`, which reconciles the draft↔ready bit to
`dispatch:reviewed ∧ CI passing ∧ mergeable == MERGEABLE` on every tick — this
skill never readies the PR itself. Resulting chain: `qa -> review -> done`.

**Sanctioned Workflow caller.** This skill invokes the Workflow tool directly
(see Step 2). The Workflow runs in the background and returns a compact
disposition summary; this skill never sees raw findings.

Run `gh` commands (directly or via `post-pr-comment.sh` / `dispatch-complete-phase`)
and `npx`-backed scans (CodeQL, the dependency audit) with
`dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## Idempotency preamble

Before running any step, hydrate the PR and diff context in **one** call. This
single `dispatch-context-pack --pr --diff` call replaces both the old idempotency
PR fetch and Step 1's diff capture — review-fix has no `origin/main` merge between
the preamble and Step 1 (the dispatch tick merges `origin/main` before spawning
this skill), so one combined call up top is correct. The branch encodes the issue
number as `<N>-…`, so derive `N` from it first (the pack takes the issue number,
not the branch). Use `dangerouslyDisableSandbox: true` — the pack calls `gh`:

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
N="${BRANCH%%-*}"
.claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --pr --diff \
  | tee "tmp/pack-$N.txt"
```

The `tee` keeps the output on disk at `tmp/pack-$N.txt` so Step 1 feeds it to
`dispatch-changed-files` without a second pack call. Read these from the
output — do not re-resolve any of them later:

- **`PR_NUM`** and the **labels** line from the `=== PR ===` section (used by the
  `dispatch:reviewed` re-entry check below and carried through to every later
  step). If that section prints the single line `PR: none` (the pack exits 0 in
  both cases — detect no-PR by this line, never by exit code), the branch has no
  open PR — **stop with a clear error**: review-fix requires an open PR, and
  every later step (the Workflow `pr_num` arg, Step 6's `post-pr-comment.sh`)
  needs a non-empty PR number.
- The PR **body** from the `=== PR ===` section — Step 2 parses its `Closes #N`
  line(s) to resolve the issue(s) this PR implements (`implementing_issues`). There
  is no `PR_JSON`; the body lives only in this pack output.
- **`MERGE_BASE`** — read it from the `=== DIFF (base <sha>) ===` header line. This
  `<sha>` is exactly the value the old `git merge-base HEAD origin/main` produced.
- The **changed-file list** — extracted by `dispatch-changed-files` from the
  `=== DIFF ===` section (same list Step 1 reads via the script).

If the labels line already includes `dispatch:reviewed` — an interrupted prior
run — **skip Steps 1–6** and go straight to Step 7, which flushes any unpushed
commits and writes the marker. `dispatch:reviewed` is this skill's terminal
action and is already applied, so re-entry is a no-op beyond Step 7's terminal
flush. Routing re-entry through Step 7 means its flush guard also carries any
commits an interrupted prior run left stranded — the flush that lets the router
resolve `mergeable == MERGEABLE` and promote the PR to ready.

On this re-entry path the Workflow has not run — Step 7 treats the deviation
criterion as not met (`result.deviation` is absent) and writes the phase-completed
marker. Otherwise run all steps in order.

## Steps

### 1. Capture the diff context and run the inline bash scans

All reviews look at the same diff — and the preamble's single
`dispatch-context-pack --pr --diff` call already captured it. Do **not** run a
fresh `git fetch` / `git merge-base` / `git diff` here. `MERGE_BASE` is the `<sha>`
read from the pack's `=== DIFF (base <sha>) ===` header (keep this variable name —
it is referenced downstream by the dependency audit and the Workflow `merge_base`
arg). Dropping `git fetch origin main` is valid by #1426 design: the phase-entry
merge already keeps `origin/main` current and the pack does no fetch of its own.

To classify the changed surface, extract the changed-file list from the pack's
`=== DIFF` section — already on disk at `tmp/pack-$N.txt` from the preamble's
`tee` — via `dispatch-changed-files`, which anchors on the DIFF section so a
PR/issue body containing bare `--- files ---`/`--- hunks ---` markers cannot
poison the list. Pipe that directly to the `dispatch-security-surface` classifier
(no `dangerouslyDisableSandbox` needed — both are pure stdin→stdout). Capture
that classifier output as `SURFACE_OUT` in the same block, then extract the
fields exactly as before:

```bash
SURFACE_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-changed-files < "tmp/pack-$N.txt" \
  | .claude/skills/dispatch-propagate/scripts/dispatch-security-surface)
surface=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^surface=//p')
deps=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^deps=//p')
app_or_rules=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^app_or_rules=//p')
```

Correctness note: the pack's `--diff` uses two-dot `git diff $base` (working-tree,
includes uncommitted) where review-fix previously used three-dot
`$MERGE_BASE...HEAD` (committed only); on a clean post-merge worktree the
changed-file **set** is identical. The `--- files ---` list is never truncated
(only hunk bodies are capped), so the security-surface feed is complete regardless
of diff size.

- `surface` is `empty` (no changed files), `docs` (every changed path is
  documentation — markdown/text/license, no executable, config, dependency, or
  rules surface), or `code` (anything else).
- `deps` is `true` when the diff touches `package.json` / `package-lock.json`.
- `app_or_rules` is `true` when the diff touches application source
  (`.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs`/`.go` outside `.claude/`) or a
  Firestore / Storage rules file.

Set `security_note` for the Workflow `args`:
- `surface=docs`: `Security review: no attack surface — docs-only diff (no executable, config, dependency, or Firestore-rules changes).`
- `surface=empty`: `Security review: no attack surface — diff is empty (no changed files detected).`
- `surface=code`: omit `security_note` (leave it unset).

#### Dependency audit (inline, when `deps=true`)

Run inline in this parent thread — not a subagent — when `deps=true`. The `deps`
gate already confirms the diff touches `package.json` / `package-lock.json`, so
produce the differential audit directly (use a private temp dir):

```bash
AUDIT_DIR=$(mktemp -d)
trap 'rm -rf "$AUDIT_DIR"' EXIT
# MERGE_BASE is already set above — reuse it here.

# Audit HEAD (current working tree)
npm audit --json > "$AUDIT_DIR/audit-head.json"

# Audit MERGE_BASE lockfile without modifying the working tree
mkdir -p "$AUDIT_DIR/baseline"
git show "$MERGE_BASE":package-lock.json > "$AUDIT_DIR/baseline/package-lock.json"
git show "$MERGE_BASE":package.json      > "$AUDIT_DIR/baseline/package.json"
npm audit --package-lock-only --json --prefix "$AUDIT_DIR/baseline" \
  > "$AUDIT_DIR/audit-baseline.json"
```

Advisories whose ID appears in `$AUDIT_DIR/audit-head.json` but **not** in
`$AUDIT_DIR/audit-baseline.json` are CVEs the PR's dependency changes newly
expose — normalize each into the **Per-finding schema** with
`introduced_by_diff=true`; these are in-scope and classify `required`. Also flag
any dependency the PR adds or upgrades whose resolved version skips a published
security-patch release.

Advisories whose ID appears in **both** head and baseline rated `high` or
`critical` are pre-existing — the diff did not introduce them. Normalize each into
the **Per-finding schema** with `introduced_by_diff=false` and classify
`out-of-scope`: they feed the follow-up-filing step (Step 6), not the PR's
required-fix set. Pre-existing advisories rated `moderate` or `low` are below the
meaningfulness threshold — do not surface them.

#### CodeQL alerts (inline, when `surface=code`)

Run inline in this parent thread — not a subagent — whenever `surface=code`.
Fetch the PR's open code-scanning alerts from GitHub Advanced Security (use
`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh api --paginate "repos/{owner}/{repo}/code-scanning/alerts?state=open&ref=refs/pull/<pr-num>/head"
```

`<pr-num>` is the PR number from the idempotency preamble; `{owner}/{repo}`
resolve automatically. `--paginate` covers repos with many alerts; the `ref`
filter scopes to the PR — it includes pre-existing alerts in code the PR did not
change. Normalize each alert to the **Per-finding schema**:

- **Location** — from `most_recent_instance.location` (path and lines).
- **Description** — from `rule.description` / `most_recent_instance.message`;
  include the alert `number`, `rule.id`, and `html_url` so the finding is
  traceable.
- **OWASP** and **STRIDE** — inferred from `rule` (id, tags, description).
- **Confidence** — from `rule.security_severity_level`: `critical`/`high` →
  `high`, `medium` → `medium`, `low` → `low`. For non-security rules
  (`security_severity_level` is null), fall back to `rule.severity` (always
  present): `error` → `medium`, `warning`/`note` → `low`. This preserves signal
  from non-security rules instead of collapsing them all to `low`.
- **Recommended fix** — the rule's remediation guidance.

If the branch has no open PR (the pack's `=== PR ===` section printed `PR: none`),
skip the fetch and record the CodeQL scan as "could not run (no PR
ref)" with no findings. An empty alert array is normal — no open CodeQL alerts —
and is not an error.

Collect normalized CodeQL and npm findings into `prescanned_findings` to pass to
the Workflow.

### 2. Build `args` and invoke the Workflow

Collect the fields for the Workflow invocation. Parse `Closes #N` from the pack's
`=== PR ===` body to resolve `implementing_issues`:

```
args = {
  pr_num:              <PR_NUM>,
  merge_base:          <MERGE_BASE>,
  changed_files:       [ ...the changed-file list from the pack's === DIFF section (same list dispatch-changed-files extracts)... ],
  surface:             "empty" | "docs" | "code",
  deps:                <true|false>,
  app_or_rules:        <true|false>,
  prescanned_findings: [ ...normalized CodeQL + npm findings in Per-finding schema... ],
  implementing_issues: [ <N>, ... ],    // parsed from Closes #N lines; [] if none
  security_note:       <string or omit> // set for empty/docs; omit for code
}
```

**Invoke the Workflow tool on `.claude/workflows/review-fix.js`**, passing `args`.
The Workflow is a sanctioned call from this skill — no `ultracode` keyword needed.
The Workflow runs in the background and returns one compact disposition summary:

```
result = {
  dispositions:         [ {id, short_desc, location, bucket, sources:[...],
                            recommended_fix?, codeql_ref?:{rule_id,alert_number,html_url}} ],
  fixed:                [ {id, location, fix_summary, touched_files:[...]} ],
  deferred_filings:     [ {title, body, blocker_issue_nums:[N,...]|"independent"} ],
  security_followup_input: [ ...codeql/npm out-of-scope subset... ],
  verify_report:        [ {id, location, verdict, skeptic_votes, rationale} ],
  deviation:            <bool>,
  security_note?:       <string>
}
```

The Workflow's fix-authoring agents (non-isolated, Opus) have already edited the
working tree by the time `result` is returned. The skill's context never holds raw
findings — only this compact summary.

### 3. Commit the Workflow's working-tree edits via one commit-merge-push

Call the script first (use `dangerouslyDisableSandbox: true` — git writes +
`git push` over HTTPS; see `.claude/rules/sandbox.md`). Compute the changed files:

```bash
git status --porcelain
```

- **If empty** → call `commit-merge-push --merge-only`. Even with no code changes
  this still pushes `origin HEAD`, carrying any pending local merge left by
  `dispatch-merge-main` / `/fix-conflicts` to origin (the no-op-push contract this
  step relies on — Step 7's flush guard is the authoritative backstop only when
  this entire step is skipped).
- **If non-empty** → call:

  ```bash
  .claude/skills/dispatch-propagate/scripts/commit-merge-push \
    --intent "review fixes for #<N>" \
    --file "<path>" [--file "<path>" ...]
  ```

  Quote every `--file` value and pass one `--file` per path; never interpolate the
  raw `git status --porcelain` output as a single bare word. Iterate the changed
  files into separate quoted arguments with a safe loop, e.g.:

  ```bash
  args=()
  while IFS= read -r path; do
    args+=(--file "$path")
  done < <(git status --porcelain | sed 's/^...//')
  .claude/skills/dispatch-propagate/scripts/commit-merge-push \
    --intent "review fixes for #<N>" "${args[@]}"
  ```

  This lands all Workflow fix edits as **one commit** rather than a model-judged
  split; the fork fallback (script exit 5) handles any genuine multi-unit case.

On a non-zero exit, fall back to the fork — the canonical fork recipe
`/implement-unit` Step 2 documents (`subagent_type` is `general-purpose`, never
the skill name; `model: sonnet`).

On exit 0, capture the fix commit SHA(s) for the Step 6 PR comment — **except**
when `--merge-only` was used (empty working tree): that path pushes but creates no
new commit, so there is no fix SHA to record. In that case omit the SHA from the
Step 6 comment or note that no code changes were applied.

### 4. Disposition table

Every finding from every source appears exactly once in one of these buckets. The
Workflow's classifier preserves **both** vocabularies: the security pass's
`required` / `out-of-scope` / `false-positive` axis and the code-review/review
`Fixed` / `Informational` / `Dismissed` / `Deferred` axis.

| Bucket | Source vocabulary | Meaning |
|---|---|---|
| Fixed | code-review/review | A concrete, in-scope code change applicable to this PR — applied by the Workflow's Opus fix agents. |
| Required | security | A real vulnerability or weakness in the changed code. Adversarially verified; upheld Required findings applied by the Workflow's Opus fix agents. |
| Refuted | security | A Required finding refuted by the adversarial-verify step — dropped before any Opus fix, recorded in verify_report. |
| Informational | code-review/review | FYIs, notes, observations surfaced for human reference; no change required. |
| Dismissed | code-review/review | Nits, incorrect findings, or not applicable; no change, each with a one-line rationale. |
| False-positive | security | Not an actual vulnerability — a misread of the code or a non-issue; each with a one-line rationale. |
| Deferred | code-review/review | Valid but out of scope for this PR; filed as a `blocked_by` follow-up in Step 6. |
| Out-of-scope | security | A genuine concern, but in pre-existing code the diff did not touch; meaningful CodeQL/npm out-of-scope findings are filed as `security` follow-ups in Step 6. |

A finding is **never Dismissed/Disregarded purely because the change is small.**
If a code-review/review finding is a real improvement within the PR's scope,
classify it Fixed and implement it — regardless of how trivial the diff is.
Dismissed is for false positives, trivially wrong findings, or style preferences
that are not actual improvements; smallness alone never qualifies (out-of-scope
items go to Deferred, not Dismissed). When a code-review/review finding is
ambiguous, default to Informational rather than inventing a code change.

### 5. File meaningful out-of-scope findings as blocked_by follow-ups

Two follow-up paths, both filing `blocked_by` tracking issues so meaningful
out-of-scope findings do not evaporate when the PR merges. The Workflow has
prepared filing structures in `result.deferred_filings` and
`result.security_followup_input`; this skill executes the actual `gh` calls.
Skip a path when its bucket is empty.

#### 5a. Deferred code-review/review findings → `/file-issue` with a blocked-by link

The Workflow prepares `result.deferred_filings`, each entry carrying `title`,
`body`, and `blocker_issue_nums` (the implementing issue numbers from
`Closes #N`, or `"independent"`). For each entry, fork a subagent (`subagent_type:
general-purpose`, `model: sonnet`). The subagent:

1. Invokes `/file-issue`, which runs the full pipeline: duplicate detection,
   8-category evaluation, decomposition gate, type/topic classification, issue
   creation, `@me` assignment, and the `help wanted` label. `/file-issue` ends with
   a `===FILE-ISSUE-RESULTS===` … `===FILE-ISSUE-RESULTS-END===` block; read every
   `<disposition> <N>` record line between the sentinels and iterate steps 2–3 over
   each. A single finding normally yields one record; a finding that legitimately
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
3. Returns every `<N>` to this thread.

Capture each `<N>` against its source finding for the Step 7 comment.

#### 5b. Meaningful out-of-scope CodeQL alerts / npm advisories → `dispatch-security-followup` → `/file-issue`

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
`model: sonnet`); run them in parallel (multiple Agent calls in one message). Each
subagent:

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
2. Invokes `/file-issue` with the follow-up's `title` on the first line and its
   `body` after. `/file-issue` owns duplicate detection, creation, `@me`
   assignment, the `help wanted` label, and type + topic classification; it ends
   with a `===FILE-ISSUE-RESULTS===` … `===FILE-ISSUE-RESULTS-END===` block. Read
   the `<disposition> <N>` record(s) between the sentinels — a single machine-keyed
   follow-up normally yields one record; iterate step 3 over each if more.
3. Applies the topic and type labels to each `<N>` (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   gh issue edit <N> --add-label security --add-label bug
   ```

   Since `/file-issue` (step 2) now classifies and applies a type label at creation via `ref-issue-labels`, and a `dispatch-security-followup` body describes an identified failure mode — a CodeQL alert at a specific location, or named npm advisories with severities — the classifier already applies `bug`; this `--add-label bug` is therefore idempotent reinforcement, `--add-label security` adds the topic, and exactly one type label results with no atomic type-swap needed.

4. Returns `<N>` mapped to the follow-up's `identifier`.

Capture each `<N>` against its source finding for the Step 7 comment.

The 5a and 5b follow-up subagents touch only GitHub and the working tree never,
so they may be fanned out in the same message as one another (Step 3's
`/commit-merge-push` has already returned by this point).

### 6. Post exactly one PR comment

Reuse the `PR_NUM` captured in the preamble — do not re-resolve. Post **one**
comment covering **every** finding from `result.dispositions` and its bucket.

Write the comment body to a file under the repo's `tmp/` directory. The body file
**must** live under `tmp/` because `post-pr-comment.sh` restricts paths to that
directory. Organize the body by disposition bucket, omitting any bucket with no
entries (on a docs-only / empty diff the security note from `result.security_note`
stands in for the security buckets):

- **Fixed** — code-review/review findings implemented; one line per finding plus
  the fix commit SHA from Step 3.
- **Required (security)** — security findings fixed; one line per finding plus the
  fix commit SHA, or the reason if left unresolved.
- **Refuted (adversarial-verify dropped)** — Required findings refuted by the
  adversarial-verify step; one line per entry from `result.verify_report` with
  verdict and rationale. These were **not** fixed; include the skeptic rationale
  so the audit trail explains the drop.
- **Informational** — surfaced for human reference; no action.
- **Dismissed** — code-review/review false positives or nits; each with a
  one-line rationale.
- **False-positive (security)** — each with a one-line rationale.
- **Deferred** — out-of-scope code-review/review findings; each references its
  follow-up issue `#<N>` from Step 5a.
- **Out-of-scope (security)** — pre-existing CodeQL/npm findings; each meaningful
  one references its follow-up issue `#<N>` from Step 5b. CodeQL-sourced findings
  are identified by their `rule.id` and alert number (from `codeql_ref`), linked
  via their `html_url`.

If a security reviewer or inline scan could not run (re-launch / retry exhausted),
note partial coverage here — name the reviewer or scan whose domain could not be
reviewed. If every bucket is empty and there was no security note, the comment is
still well-formed (render empty buckets as `_None._`).

Then post it (use `dangerouslyDisableSandbox: true` — the script invokes `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
```

### 7. Apply the terminal label, then write the marker (or park on deviation)

**First, flush any unpushed local commits — the terminal flush of the "never
push a bare merge commit" contract.** `dispatch-merge-main` (pre-spawn) and
`/fix-conflicts` merge `origin/main` into this worktree **locally**
and never push, relying on each phase skill's own push point to carry the merge
to origin. `/review-fix` is the chain's **terminal phase**: this is the chain's
last push point — once it applies `dispatch:reviewed`, the router only flips the
PR's draft bit (it never pushes), and every later tick routes `STOP done`, so no
push point ever fires again. So any local merge left behind must be carried to
origin here — otherwise the remote branch stays behind local HEAD and GitHub
reports the PR `CONFLICTING` permanently, which keeps `dispatch-reconcile-ready`
from ever promoting the PR to ready (the predicate needs
`mergeable == MERGEABLE`, so origin must equal HEAD). This guard runs
**unconditionally**, independent of whether any findings were fixed: on a
zero-findings run Step 3's `/commit-merge-push` may be skipped entirely, so this
terminal flush is the only place the push is guaranteed and it cannot be reasoned
away.

`BRANCH` is captured in the idempotency preamble; it is in scope on both the
normal path and the re-entry path. Git runs sandboxed here — `origin` is HTTPS
to an allowlisted host, so **no `dangerouslyDisableSandbox`** (unlike the
surrounding `gh` / `dispatch-complete-phase` calls in this step). The push is a
no-op when Step 3 already pushed (HEAD `==` origin/$BRANCH) and fails safe: when
the remote branch is up to date the count is `0` and nothing is pushed; it does
real work only when no push point fired this run.

```bash
git fetch origin "$BRANCH"
AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD")
if [[ "$AHEAD" -ne 0 ]]; then
  git push origin HEAD
fi
```

Then apply the `dispatch:reviewed` label via `dispatch-complete-phase` (use
`dangerouslyDisableSandbox: true` — the script calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" review
```

The PR number passed here is **expected** to differ from the worktree's
`<issue>-…` branch issue number — the PR↔issue linkage was established earlier in
the tick (by `dispatch-resolve-arg`, `dispatch-find-pr`, or
`dispatch-select-target`), so the dispatching session must **not** pause to
re-confirm the mismatch.

This skill **owns** its `dispatch:reviewed` label — the dispatch chain does not
apply the label after this skill returns. The label is applied regardless of
whether any fixes were made, so a no-findings run still advances the workflow.

This skill does **not** ready the PR. Promotion to ready is owned by the router's
`dispatch-reconcile-ready`, which reconciles the draft↔ready bit to
`dispatch:reviewed ∧ CI passing ∧ mergeable == MERGEABLE` on every tick — so the
PR stays a draft here and the router promotes it on a later tick once the
predicate holds.

Then write the phase-completed marker — or, on deviation, the office-hours reason.
The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads this to decide propagate vs
park. `CLAUDE_JOB_DIR` unset = interactive run; skip both branches. On idempotent
re-entry (Steps 1–6 were skipped), the Workflow has not run — treat the deviation
criterion as not met and write the marker.

**Deviation criterion:** `result.deviation` is `true` — any `Required` + `Upheld`
finding with `Confidence` `high` remained unresolved after the Workflow's fix
pipeline.

**Deviation fires** (`result.deviation === true`) — skip the phase-completed
marker. Call `dispatch-mark-deviation` instead:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/review-fix: high-confidence required security finding(s) left unresolved after fixes"
```

The Stop hook reads marker-absence as Branch A and applies `dispatch:office-hours`
to the issue, surfacing the reason in the why-comment, so the parked item explains
which criterion fired. Do not apply the `dispatch:office-hours` label inline — the
Stop hook owns label application.

**No deviation** (`result.deviation === false`, or Workflow did not run on
re-entry) — call `dispatch-mark-complete`. `CLAUDE_JOB_DIR` unset = interactive
run; the script no-ops with a clear diagnostic.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
  --phase review --pr "$PR_NUM"
```

Then **stop**. The Stop hook reads the marker and advances the chain. Applying
`dispatch:reviewed` is unconditional; only the marker is skipped when the
deviation criterion fires. Promotion to ready is never this skill's job — the
router's `dispatch-reconcile-ready` owns it, reconciling the draft↔ready bit on
every tick once CI is passing and `mergeable == MERGEABLE`.

## Per-finding schema

Every finding — emitted by the Workflow's finders and inline scans, and carried
through to the unified set — has these fields:

- **Location** — `path:line`.
- **Description** — what the issue is and why it is a risk.
- **Source** — which review produced it (`code-review`, `review`,
  `input-validation`, `secrets`, `red-team`, `security-review`, `auth`,
  `data-exposure`, `firebase`, `codeql`, `npm`). Dedup in the Workflow may record
  several sources on one finding.
- **OWASP** — the OWASP Top 10 (2021) category (e.g. `A01:2021 Broken Access
  Control`, `A03:2021 Injection`). Security findings only; empty for
  code-review/review findings.
- **STRIDE** — one of Spoofing, Tampering, Repudiation, Information Disclosure,
  Denial of Service, Elevation of Privilege. Security findings only.
- **Confidence** — `high`, `medium`, or `low`.
- **Recommended fix** — the concrete change that resolves the finding.
- **Disposition** — the unified bucket from the **Disposition table**, set by the
  Workflow's classify step.

## Edge cases

- **Empty or docs-only diff** — `surface` is `empty` or `docs`; the Workflow
  launches no security finders and no security agents. The code-review and review
  agents still run. The skill still applies `dispatch:reviewed` and writes the
  marker.
- **A finder finds nothing** — record that source as clean; it contributes no
  findings to the Workflow.
- **A finder agent fails** — the Workflow retries once. If it fails again, partial
  coverage is noted in `result.dispositions` and surfaced in the Step 6 PR
  comment.
- **`npm audit` sandbox or network failure** — the dependency audit runs inline;
  retry its `npm audit` with `dangerouslyDisableSandbox: true`. If it still fails,
  report the dependency audit as "could not run" rather than silently dropping
  that domain.
- **CodeQL fetch failure** — the CodeQL fetch runs inline; retry the `gh api`
  fetch once with `dangerouslyDisableSandbox: true`. If it still fails, report the
  CodeQL scan as "could not run" rather than dropping it silently. An empty alert
  array is not a failure — it means no open alerts.

## Notes

This is the workflow's terminal actionable phase: applying `dispatch:reviewed`
(Step 7) is the terminal action and writing the phase-completed marker is the
dispatch chain's hand-off cue. The skill never readies the PR — the router's
`dispatch-reconcile-ready` reconciles readiness on every tick, promoting the PR
once CI is passing and `mergeable == MERGEABLE` (no longer a one-shot readying
action here). The dispatch workflow has no human checkpoint before a PR
goes ready — the single PR-comment summary is the audit trail. This is an
intentional trade-off for an autonomous background-job run.

The skill is idempotent: a re-invocation with `dispatch:reviewed` already on the
PR skips Steps 1–6 and runs Step 7, which flushes any unpushed commits and writes
the phase-completed marker (the Workflow is not re-run on re-entry, so the
deviation criterion is treated as not met). Readiness is the router's projection,
reconciled on later ticks — not something re-entry asserts.

**Model split (#1172).** The dispatch chain runs this `review` phase orchestrator
on **Sonnet** (via `dispatch-phase-model`, which maps `review →
claude-sonnet-4-6`). The model tiering is now owned by the Workflow's per-`agent()`
`model:` settings: finder agents (code-review, review, security domains) run on
**Sonnet**, dedup/classify/verify agents run on **Sonnet**, and **fix-authoring
Opus fix agents** (`model: opus`) write all working-tree changes. Fix-authoring is
pinned to Opus **exactly once** in the Workflow's fix phase — there is no
double-tiering. The orchestrator (this skill) authors no product code.
