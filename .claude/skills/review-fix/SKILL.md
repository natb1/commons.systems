---
name: review-fix
description: Review phase — the workflow's single terminal review pass. Run /code-review max --fix, /review, and the full surface-gated security fan-out as direct subagents over the same diff, unify and de-duplicate the findings, apply the in-scope fixes via one /commit-merge-push, file meaningful out-of-scope findings as blocked_by follow-ups, post one PR comment covering every finding, apply the dispatch:reviewed label, and mark the PR ready
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by the dispatch chain. This
skill consolidates what were three separate review phases — code-review, review,
and security — into one pass over a single diff. It runs all three generic
reviews as direct subagents, unifies and de-duplicates their findings into one
disposition table, applies the in-scope fixes via one `/commit-merge-push`, files
meaningful out-of-scope findings as `blocked_by` follow-ups, posts **one** PR
comment, applies the `dispatch:reviewed` label, and marks the PR ready.

This is the workflow's **terminal actionable phase** — it marks the PR ready
itself, so there is no separate phase after it. Resulting chain: `qa -> review
-> done`.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
launch the three review subagents directly via the Agent tool, run the CodeQL and
dependency-audit scans inline, fork `/commit-merge-push`, and launch
implementation and follow-up-issue subagents. Every review is a **direct child**
of this skill: there is no intermediate orchestrator and no nesting.

Run `gh` commands (directly or via `post-pr-comment.sh` / `dispatch-complete-phase`)
and `npx`-backed scans (CodeQL, the dependency audit) with
`dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## Idempotency preamble

Before running any step, resolve the PR number, its labels, and its body from the
current branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is carried through to every later step — do not re-resolve. The PR body
stays in `PR_JSON` (`echo "$PR_JSON" | jq -r .body`); Step 6 parses its
`Closes #N` line(s) to resolve the issue(s) this PR implements.

If the printed labels already include `dispatch:reviewed` — an interrupted prior
run — **skip Steps 1–7** and go straight to Step 8, which flushes any unpushed
commits, readies the PR, and writes the marker. `dispatch:reviewed` is this
skill's terminal action and is already applied, so re-entry is a no-op beyond
Step 8's terminal flush and readying the PR. Routing re-entry through Step 8
(rather than readying the PR inline) means its flush guard also carries any
commits an interrupted prior run left stranded.

On this re-entry path the unified finding set is not in context — Step 8 treats
the deviation criterion as not met and writes the phase-completed marker.
Otherwise run all steps in order.

## Steps

### 1. Run the three generic reviews as direct subagents over the same diff

All three reviews look at the same diff — the branch's pending changes against
the merge-base with `origin/main`. Capture that diff context once; every review
needs it. Git runs sandboxed — `origin` is HTTPS to an allowlisted host, so no
`dangerouslyDisableSandbox` is needed:

```bash
git fetch origin main
MERGE_BASE=$(git merge-base HEAD origin/main)
git diff --name-only "$MERGE_BASE"...HEAD
```

Launch the three reviews as direct child subagents of this skill (no intermediate
orchestrator, no nesting). The code-review and review subagents launch
unconditionally; the security pass is surface-gated (1c below). Each review
returns a **schema-bounded finding set** (the **Per-finding schema** below) that
the parent **immediately serializes to a file under `tmp/`** — one file per
review source (e.g. `tmp/findings-code-review.json`, `tmp/findings-review.json`,
`tmp/findings-security.json`). See **Context-budget discipline** below for why
this serialization is not optional.

#### 1a. `/code-review max --fix` — a single NON-ISOLATED subagent

Fork a subagent via the Agent tool (`subagent_type: general-purpose`,
`model: sonnet`) that invokes the built-in `/code-review` skill via the Skill
tool with the `max` effort argument (the highest thoroughness available) and the
`--fix` flag inside the subagent. It applies in-scope fixes to the working tree
and surfaces findings with the skill's own (fixed vs skipped) disposition.

The subagent boundary is the control-flow guarantee: the parent never sees the
inner Skill's prompt template, so it remains on this step when the Agent call
returns. The subagent inherits the parent's worktree filesystem — working-tree
edits made by `/code-review` inside the subagent surface on disk for Step 5's
`/commit-merge-push` with no additional plumbing. **Do not set `isolation:` on
this subagent: an isolated worktree would silently capture `/code-review`'s edits
in a discarded copy, leaving the commit step with nothing to commit.** The
subagent passes the inner skill no output contract and returns its natural output
as-is. Keep the "once it returns, continue" wording inside the **subagent's**
prompt as defense-in-depth for the inner Skill invocation; any "final reply" /
"nothing else" wording in `/code-review`'s prompt scopes only to its findings
deliverable.

Normalize the subagent's output to the **Per-finding schema** — each finding
carries its `disposition` of `fixed` (applied to the working tree by
`/code-review`) or `skipped` (the wrapper classifies it in Step 2) — and serialize
the finding set to `tmp/findings-code-review.json`.

#### 1b. `/review` — a findings-only subagent

Fork a subagent via the Agent tool (`subagent_type: general-purpose`,
`model: sonnet`) that invokes the built-in `/review` skill via the Skill tool
inside the subagent and returns its output verbatim — the generic PR review. It
produces findings; it applies no fixes. The subagent boundary is the control-flow
guarantee: the parent never sees the inner Skill's prompt template, so it remains
on this step when the Agent call returns. `/review` is built-in and uneditable:
the subagent passes the inner skill no output contract and returns its natural
output as-is. Keep the "once it returns, continue" wording inside the
**subagent's** prompt as defense-in-depth for the inner Skill invocation; any
"final reply" / "nothing else" wording in `/review`'s prompt scopes only to its
findings deliverable.

Normalize the subagent's output to the **Per-finding schema** and serialize the
finding set to `tmp/findings-review.json`.

#### 1c. The full security pass — surface-gated, exactly as the security phase ran it

Classify the changed surface, then fan out only the reviewers the surface
warrants. Classify the changed-file list with `dispatch-security-surface` — a
pure stdin→stdout classifier (no `gh`/git/network, so it runs sandboxed-fine):

```bash
SURFACE_OUT=$(git diff --name-only "$MERGE_BASE"...HEAD \
  | .claude/skills/dispatch-propagate/scripts/dispatch-security-surface)
surface=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^surface=//p')
deps=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^deps=//p')
app_or_rules=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^app_or_rules=//p')
```

- `surface` is `empty` (no changed files), `docs` (every changed path is
  documentation — markdown/text/license, no executable, config, dependency, or
  rules surface), or `code` (anything else).
- `deps` is `true` when the diff touches `package.json` / `package-lock.json`.
- `app_or_rules` is `true` when the diff touches application source
  (`.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs`/`.go` outside `.claude/`) or a
  Firestore / Storage rules file.

**`surface=empty` or `surface=docs`** → launch no security reviewers and run no
inline scans. Serialize an empty security finding set to
`tmp/findings-security.json`. Record a one-line "no attack surface" note for the
Step 7 PR comment: for `docs`, `Security review: no attack surface — docs-only
diff (no executable, config, dependency, or Firestore-rules changes).`; for
`empty`, `Security review: no attack surface — diff is empty (no changed files
detected).` The rest of the skill still runs end-to-end (the empty security
finding set contributes nothing to the disposition).

**`surface=code`** → fan out the security reviewers below in **a single message,
one Agent tool call per reviewer**. Every reviewer is a direct child of this
skill; there is no intermediate orchestrator. Every reviewer uses
`subagent_type: general-purpose` and `model: sonnet`, and emits findings in the
**Per-finding schema** below, so the aggregation step treats every output
uniformly. CodeQL and the dependency audit are **not** subagents — they run
inline in this parent thread (see their subsections below), consistent with the
dispatch convention of direct subagents and no nesting.

##### Shared preamble (in every security subagent prompt)

- The **Per-finding schema** restated in full, so the subagent emits exactly
  those fields.
- The findings-only constraint: the subagent reports findings only. It edits no
  files, commits nothing, and posts nothing.
- `MERGE_BASE` and the changed-file list, plus the instruction: review only the
  pending changes (the diff vs `MERGE_BASE`), but Read full files for the context
  needed to judge each change.

##### Reviewers that run on every code diff

These four launch whenever `surface=code`, regardless of `app_or_rules` —
command injection in a bash script and hardcoded secrets in config are real
attack surface even when no application code changed:

- **Input validation** — injection in the changed code: SQL/NoSQL injection,
  XSS, command injection, path traversal. Check that external input is validated
  and escaped at every boundary it crosses.
- **Secrets scan** — hardcoded keys/tokens/credentials in the changed code,
  `.env` files committed to git, secrets leaking into build output.
- **Red team** — construct concrete attack scenarios against the changed code:
  pick an attacker goal, trace a path through the diff to reach it, and report
  each viable scenario as a finding. Build scenarios from the code under review
  rather than pattern-matching a checklist of known vulnerabilities.
- **Built-in `/security-review` scan** — fork a subagent that invokes the
  built-in `/security-review` skill via the Skill tool inside the subagent and
  returns its output normalized to the **Per-finding schema**. The subagent
  boundary is the control-flow guarantee: the parent never sees the inner Skill's
  prompt template, so this skill remains on Step 1 when the Agent call returns.
  The subagent passes the inner skill no output contract. Keep the "once it
  returns, continue" wording inside the **subagent's** prompt as defense-in-depth
  for the inner Skill invocation; any "final reply" / "nothing else" wording in
  `/security-review`'s prompt scopes only to its findings deliverable.

  Normalize each built-in finding:

  - **Confidence** — from the built-in's severity: `high`/`medium`/`low`
    severity maps to `high`/`medium`/`low` confidence.
  - **OWASP** and **STRIDE** — inferred from the finding's category and
    description.
  - **Location**, **Description**, **Recommended fix** — carried through
    directly.

##### App-domain reviewers (only when `app_or_rules=true`)

These three are structurally N/A when the diff touches no application code or
Firestore rules, so launch them only when `app_or_rules=true`:

- **Auth & access control** — Firestore rules coverage for paths the diff
  touches, missing auth checks, privilege escalation. Confirm each new or changed
  Firestore path has a matching rule block and that client code does not assume
  access the rules do not grant.
- **Data exposure** — API responses returning more fields than the caller needs,
  PII in logs (`console.log` and similar), internal details (stack traces,
  config, paths) leaked in error messages.
- **Firebase-specific** — Firestore rules permissiveness (overly broad `allow`
  conditions, missing field constraints), emulator-only code reachable on
  production paths, Firebase API key or config exposure.

##### Dependency audit (inline, when `deps=true`)

Run inline in this parent thread — not a subagent — when `deps=true`. The `deps`
gate already confirms the diff touches `package.json` / `package-lock.json`, so
produce the differential audit directly (use a private temp dir):

```bash
AUDIT_DIR=$(mktemp -d)
trap 'rm -rf "$AUDIT_DIR"' EXIT
# MERGE_BASE is already set in the Step 1 git commands above — reuse it here.

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

##### CodeQL alerts (inline, when `surface=code`)

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

If the branch has no open PR (`gh pr view` exited non-zero in the idempotency
preamble), skip the fetch and record the CodeQL scan as "could not run (no PR
ref)" with no findings. An empty alert array is normal — no open CodeQL alerts —
and is not an error.

Serialize the security finding set — the returned security-reviewer findings
together with the inline CodeQL and dependency-audit findings, each in the
**Per-finding schema** — to `tmp/findings-security.json`.

### 2. Aggregate, de-duplicate, and classify in a dedicated subagent

**Run the unification in its OWN subagent** — `subagent_type: general-purpose`,
`model: sonnet`. The subagent reads the three `tmp/` finding files written in
Step 1 and returns one **compact disposition summary** (see the **Disposition
table** below). The parent passes the subagent only the three file paths and the
disposition schema; it does **not** paste the raw findings into the prompt. The
parent holds only the file paths plus the returned summary — never the three
reviews' raw finding sets simultaneously (see **Context-budget discipline**).

The unification subagent:

1. Merges the findings from all three files into one set.
2. De-duplicates. The built-in `/security-review` scan, the inline CodeQL alerts,
   and the domain reviewers overlap each other and the code-review/review passes,
   so the same issue often arrives from several sources. When two or more findings
   name the **same root issue at the same location**, collapse them into one: pick
   the most specific OWASP category and STRIDE element across the duplicates (a
   single value each per the Per-finding schema), take the highest confidence
   among them, and record which sources flagged it. Distinct issues — even in the
   same file — stay separate.
3. Classifies every de-duplicated finding into the **Disposition table** below,
   preserving both vocabularies (the security `required`/`out-of-scope`/
   `false-positive` axis and the code-review/review `Fixed`/`Informational`/
   `Dismissed`/`Deferred` axis).

It returns a compact summary: for each finding, a short description, its
location, its disposition bucket, its source(s), and — for findings that need
later handling — the per-finding handling fields Steps 5–7 require (the composed
follow-up title/body for Deferred findings, the serialized
`codeql`/`npm` follow-up array for out-of-scope security findings, the
recommended fix for required/Fixed findings, and the `required`-with-`high`-
confidence flag for the Step 8 deviation check). It must **not** echo every
finding's full prose back — the summary is bounded.

### 3. One disposition table

Every finding from every source appears exactly once, de-duplicated, in one of
these buckets. The table preserves **both** classification vocabularies: the
security pass's `required` / `out-of-scope` / `false-positive` axis and the
code-review/review `Fixed` / `Informational` / `Dismissed` / `Deferred` axis.

| Bucket | Source vocabulary | Meaning |
|---|---|---|
| Fixed | code-review/review | A concrete, in-scope code change applicable to this PR. Code-review findings already `fixed` by `/code-review` in Step 1a land here; review/code-review findings the wrapper decides to implement also land here (applied in Step 5). |
| Required | security | A real vulnerability or weakness in the changed code that should be fixed (applied in Step 5). |
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

### 4. Context-budget discipline (correctness-critical)

The merged parent session never resets between the three reviews. Naively holding
all three reviews' raw findings in the parent would stack their context and
routinely trip auto-compaction mid-review — a token cost and, worse, a
correctness risk for the one phase that marks the PR ready with no human
checkpoint (compaction can drop a finding before it is fixed or commented).

So the parent must **never** hold all three reviews' raw findings in context
simultaneously:

- Each review subagent (Step 1) returns a schema-bounded finding set that the
  parent **immediately serializes to a `tmp/` file** and then drops from working
  context.
- The unified de-dup + classification (Step 2) runs in its **own subagent** that
  reads those `tmp/` files and returns a **compact disposition summary**.
- After Step 2 the parent holds only the `tmp/` file paths plus the compact
  summary.

This keeps the parent's peak context close to a single phase's (~70–90k) rather
than the stacked ~138k that would trip auto-compaction.

### 5. Apply the required/Fixed fixes, then one commit-merge-push

`/code-review max --fix` (Step 1a) already applied its own fixes to the working
tree. This step applies the **remaining** required/Fixed fixes — the Fixed-bucket
findings from `/review` and the `required`-bucket findings from the security pass
that are not already on disk.

For each such finding, launch an implementation subagent via the Agent tool,
constrained to **working-tree edits only — no commits, no pushes**. Choose each
subagent's model per `/implement-unit`'s model-selection heuristic (see that
skill — it is the canonical home; do not restate it here). Informational,
Dismissed, false-positive, Deferred, and out-of-scope findings are **not**
implemented here. If there are no remaining required/Fixed findings to apply,
skip the implementation subagents.

Then fork **one** `/commit-merge-push` via the Agent tool to commit every pending
working-tree change — `/code-review`'s Step 1a edits plus these implementation
edits — and push. If there were no code changes at all, `/commit-merge-push`
tolerates the no-op and creates no commit. Even on that no-op it pushes `origin
HEAD`, so it carries any pending local merge (left by `dispatch-merge-main` /
`/dispatch-resolve-conflict`) to origin; Step 8's flush guard is the
authoritative backstop when this fork is skipped entirely. Capture the resulting
fix commit SHA(s) for the Step 7 comment.

### 6. File meaningful out-of-scope findings as blocked_by follow-ups

Two follow-up paths, both filing `blocked_by` tracking issues so meaningful
out-of-scope findings do not evaporate when the PR merges. Skip a path when its
bucket is empty.

#### 6a. Deferred code-review/review findings → `/file-issue` with a blocked-by link

First resolve the PR's **implementing issue(s)**: parse the `Closes #N` line(s)
from the PR body captured in `PR_JSON` (`echo "$PR_JSON" | jq -r .body`). These
are the issue(s) this PR's work delivers.

Then, for **each** Deferred finding, assess — as a required sub-step, never
skipped — what the new tracking issue is blocked by:

- Deferred because it depends on or builds on this PR's changes → **blocked by
  the PR's implementing issue(s)**.
- Blocked by some other identifiable open issue → **blocked by that issue**.
- Unrelated pre-existing code with no sequencing constraint → **independent**.
- When unsure, prefer recording the dependency over leaving the issue unlinked.

For each finding, fork a subagent via the Agent tool (`subagent_type:
general-purpose`, `model: sonnet`). Build the subagent's `$INPUT` from the
finding: a short imperative title on the first line, then the body — the finding
text, the files the finding names, the PR backlink `#<PR_NUM>` (reuse `PR_NUM`
from the idempotency preamble), and a short rationale for why the finding is out
of scope for this PR. Pass the assessed blocker issue number(s) — or an explicit
`independent` marker — into the subagent's prompt alongside `$INPUT`. The
subagent:

1. Invokes `/file-issue`, which owns duplicate detection, issue creation, `@me`
   assignment, and the `help wanted` label. `/file-issue` prints `CREATED <N>` or
   `EXISTING <N>` on its own line; the subagent parses it.
2. For a non-independent finding, records a `blocked_by` dependency **on the new
   issue `<N>`, targeting each blocker issue number** passed in. The target is the
   GitHub **issue** — never the PR number, and the dependency is the API
   relationship, never body text. Use the `ref-github-issues` dependencies API
   (database-ID resolution with `gh api`, `--input` JSON; see `ref-github-issues`,
   do not restate the syntax). On the `EXISTING <N>` path, first list `<N>`'s
   current `blocked_by` (same dependencies API — see `ref-github-issues`) and skip
   the POST for any blocker already present, so a duplicate does not error. An
   `independent` finding records no dependency.
3. Returns `<N>` to this thread.

Capture each `<N>` against its source finding for the Step 7 comment.

#### 6b. Meaningful out-of-scope CodeQL alerts / npm advisories → `dispatch-security-followup` → `/file-issue`

Meaningful out-of-scope CodeQL alerts and pre-existing npm advisories are filed
as `security`-labeled follow-up issues — otherwise they evaporate when the PR
merges. The PR's own required-fix set stays scoped to the diff (unchanged); this
only files trackers for genuine findings the diff did not introduce.

**Meaningfulness threshold** (documented to keep follow-up noise low):

- CodeQL: an alert classified `out-of-scope` with `security_severity_level` of
  `critical`, `high`, or `medium`.
- npm: a package qualifies if any of its `out-of-scope`,
  not-introduced-by-diff (`introduced_by_diff=false`) advisories is rated
  `high` or `critical`. The follow-up is grouped per package (one issue per
  vulnerable package, listing every such advisory it resolves) — because
  `npm audit` reports each GHSA in a coordinated disclosure as a separate
  advisory on the same package node, all fixed by a single version bump.
- `required` and `false-positive` findings are never filed.

Serialize the classified `codeql` and `npm` findings to a JSON array at
`tmp/security-followup-input.json` — a codeql/npm subset distinct from the full
`tmp/findings-security.json` set written in Step 1c — one object per finding
carrying `classification`, `source`, and the source's fields (CodeQL: `rule_id`,
`alert_number`, `security_severity_level`, `description`, `location`,
`html_url`; npm: `advisory_id`, `severity`, `introduced_by_diff`, `package`,
`title`, `url`), all already captured during normalization. Findings from other
sources carry no stable ID and are omitted. Pipe the array through
`dispatch-security-followup` with `PR_NUM` (pure — no network/git/gh, so it runs
sandboxed-fine):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-security-followup "$PR_NUM" \
  < tmp/security-followup-input.json
```

It applies the threshold and emits a JSON array of `{identifier, title, body}`
follow-ups (empty when none qualify). CodeQL emits one follow-up per alert; npm
emits one follow-up per vulnerable package. Each `identifier` — CodeQL `rule.id`
+ alert number, or `npm advisories in <package>` — is embedded in the `title`,
so `/file-issue`'s title-keyword dedup prevents re-filing the same alert or
package across repeated runs or multiple PRs.

Tradeoff: because the npm dedup key is package-scoped, a newly disclosed
advisory on an already-filed package won't auto-file a fresh issue — the
existing "upgrade this package" issue already covers the remediation (one
version bump resolves every advisory on that package node).

For each emitted follow-up, fork a subagent (`subagent_type: general-purpose`,
`model: sonnet`); run them in parallel (multiple Agent calls in one message). Each
subagent:

1. Invokes `/file-issue` with the follow-up's `title` on the first line and its
   `body` after. `/file-issue` owns duplicate detection, creation, `@me`
   assignment, and the `help wanted` label; it prints `CREATED <N>` or
   `EXISTING <N>` on its own line — parse `<N>`.
2. Applies the topic and type labels (use `dangerouslyDisableSandbox: true` —
   `gh` needs network):

   ```bash
   gh issue edit <N> --add-label security --add-label bug
   ```

3. Returns `<N>` mapped to the follow-up's `identifier`.

Capture each `<N>` against its source finding for the Step 7 comment.

The 6a and 6b follow-up subagents touch only GitHub and the working tree never,
so they may be fanned out in the same message as one another and alongside Step
5's implementation subagents (Step 5 touches only the working tree, Step 6 only
GitHub — they do not conflict). The single `/commit-merge-push` in Step 5 runs
after the implementation subagents return.

### 7. Post exactly one PR comment

Reuse the `PR_NUM` captured in the preamble — do not re-resolve. Post **one**
comment covering **every** finding from the unified disposition and its
disposition — not three.

Write the comment body to a file under the repo's `tmp/` directory. The body file
**must** live under `tmp/` because `post-pr-comment.sh` restricts paths to that
directory. Organize the body by disposition bucket, omitting any bucket with no
entries (on a docs-only / empty diff the security note from Step 1c stands in for
the security buckets):

- **Fixed** — code-review/review findings implemented; one line per finding plus
  the fix commit SHA from Step 5.
- **Required (security)** — security findings fixed; one line per finding plus the
  fix commit SHA, or the reason if left unresolved.
- **Informational** — surfaced for human reference; no action.
- **Dismissed** — code-review/review false positives or nits; each with a
  one-line rationale.
- **False-positive (security)** — each with a one-line rationale.
- **Deferred** — out-of-scope code-review/review findings; each references its
  follow-up issue `#<N>` from Step 6a.
- **Out-of-scope (security)** — pre-existing CodeQL/npm findings; each meaningful
  one references its follow-up issue `#<N>` from Step 6b. CodeQL-sourced findings
  are identified by their `rule.id` and alert number, linked via their
  `html_url`.

If a security reviewer or inline scan could not run (re-launch / retry exhausted),
note partial coverage here — name the reviewer or scan whose domain could not be
reviewed. If every bucket is empty and there was no security note, the comment is
still well-formed (render empty buckets as `_None._`).

Then post it (use `dangerouslyDisableSandbox: true` — the script invokes `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
```

### 8. Apply the terminal label, ready the PR, then write the marker (or park on deviation)

**First, flush any unpushed local commits — the terminal flush of the "never
push a bare merge commit" contract.** `dispatch-merge-main` (pre-spawn) and
`/dispatch-resolve-conflict` merge `origin/main` into this worktree **locally**
and never push, relying on each phase skill's own push point to carry the merge
to origin. `/review-fix` is the chain's **terminal phase**: once the PR is
ready, every later tick routes `STOP done` and no push point ever fires again.
So any local merge left behind must be carried to origin here, before the PR is
readied — otherwise the remote branch stays behind local HEAD and GitHub reports
the PR `CONFLICTING` permanently. This guard runs **unconditionally**,
independent of whether any findings were fixed: on a zero-findings run Step 5's
`/commit-merge-push` may be skipped entirely, so the readiness gate is the only
place the flush is guaranteed and it cannot be reasoned away.

`BRANCH` is captured in the idempotency preamble; it is in scope on both the
normal path and the re-entry path. Git runs sandboxed here — `origin` is HTTPS
to an allowlisted host, so **no `dangerouslyDisableSandbox`** (unlike the
surrounding `gh` / `dispatch-complete-phase` calls in this step). The push is a
no-op when Step 5 already pushed (HEAD `==` origin/$BRANCH) and fails safe: when
the remote branch is up to date the count is `0` and nothing is pushed; it does
real work only when no push point fired this run.

```bash
git fetch origin "$BRANCH"
if [[ "$(git rev-list --count "origin/$BRANCH..HEAD")" -ne 0 ]]; then
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

Mark the PR ready — the workflow's terminal PR-state action (use
`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh pr ready "$PR_NUM"
```

Then write the phase-completed marker — or, on deviation, the office-hours reason.
The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads this to decide propagate vs
park. `CLAUDE_JOB_DIR` unset = interactive run; skip both branches. On idempotent
re-entry (Steps 1–7 were skipped), the unified finding set is not in context —
treat the deviation criterion as not met and write the marker.

**Deviation criterion:** any security finding classified `required` with
Confidence `high` remains unresolved after the Step 5 fix pass.

**Deviation fires** (a high-confidence `required` finding is still unresolved) —
skip the phase-completed marker. Write a one-line reason instead, atomic via
tempfile + mv:

```bash
if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
  printf '%s\n' "/review-fix: high-confidence required security finding(s) left unresolved after fixes" \
    > "$CLAUDE_JOB_DIR/office-hours-reason.tmp"
  mv "$CLAUDE_JOB_DIR/office-hours-reason.tmp" \
     "$CLAUDE_JOB_DIR/office-hours-reason"
fi
```

The Stop hook reads marker-absence as Branch A and applies `dispatch:office-hours`
to the issue, surfacing the reason in the why-comment, so the parked item explains
which criterion fired. Do not apply the `dispatch:office-hours` label inline — the
Stop hook owns label application.

**No deviation** (all high-confidence `required` findings resolved, or none
existed) — write the phase-completed marker, atomic via tempfile + mv:

```bash
if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
  printf 'phase=review\npr=%s\n' "$PR_NUM" \
    > "$CLAUDE_JOB_DIR/phase-completed.tmp"
  mv "$CLAUDE_JOB_DIR/phase-completed.tmp" \
     "$CLAUDE_JOB_DIR/phase-completed"
fi
```

Then **stop**. The Stop hook reads the marker and advances the chain. `gh pr ready`
is still the workflow's terminal *PR-state* action and runs regardless of
deviation — only the marker is skipped when the deviation criterion fires.

## Per-finding schema

Every finding — emitted by the Step 1 subagents and inline scans, and carried
through to the unified set in Step 2 — has these fields:

- **Location** — `path:line`.
- **Description** — what the issue is and why it is a risk.
- **Source** — which review produced it (`code-review`, `review`,
  `input-validation`, `secrets`, `red-team`, `security-review`, `auth`,
  `data-exposure`, `firebase`, `codeql`, `npm`). De-dup in Step 2 may record
  several sources on one finding.
- **OWASP** — the OWASP Top 10 (2021) category (e.g. `A01:2021 Broken Access
  Control`, `A03:2021 Injection`). Security findings only; empty for
  code-review/review findings.
- **STRIDE** — one of Spoofing, Tampering, Repudiation, Information Disclosure,
  Denial of Service, Elevation of Privilege. Security findings only.
- **Confidence** — `high`, `medium`, or `low`.
- **Recommended fix** — the concrete change that resolves the finding.
- **Disposition** — the unified bucket from the **Disposition table**, set by the
  Step 2 unification subagent. Security sources additionally carry the underlying
  `required` / `out-of-scope` / `false-positive` classification; code-review/review
  sources carry the `fixed` / `skipped` disposition `/code-review` emitted, which
  the unification subagent extends into Fixed / Informational / Dismissed /
  Deferred.

## Edge cases

- **Empty or docs-only diff** — `surface` is `empty` or `docs`; launch no security
  reviewers, run no inline scans, and serialize an empty security finding set. The
  code-review and review subagents still run, and the skill still applies
  `dispatch:reviewed`, readies the PR, and writes the marker.
- **A subagent finds nothing** — record that source as clean; it contributes no
  findings.
- **A subagent fails** — re-launch it once. If it fails again, note partial
  coverage in the Step 7 PR comment (name the reviewer whose domain could not be
  reviewed).
- **`npm audit` sandbox or network failure** — the dependency audit runs inline;
  retry its `npm audit` with `dangerouslyDisableSandbox: true`. If it still fails,
  report the dependency audit as "could not run" rather than silently dropping
  that domain.
- **CodeQL fetch failure** — the CodeQL fetch runs inline; retry the `gh api`
  fetch once with `dangerouslyDisableSandbox: true`. If it still fails, report the
  CodeQL scan as "could not run" rather than dropping it silently. An empty alert
  array is not a failure — it means no open alerts.

## Notes

This is the workflow's terminal actionable phase: `gh pr ready` (Step 8) is the
terminal PR-state action and writing the phase-completed marker is the dispatch
chain's hand-off cue. After this change the dispatch workflow has no human
checkpoint before a PR goes ready — the single PR-comment summary is the audit
trail. This is an intentional trade-off for an autonomous background-job run.

The skill is idempotent: a re-invocation with `dispatch:reviewed` already on the
PR skips Steps 1–7 and runs Step 8, which flushes any unpushed commits, ensures
the PR is ready, and writes the phase-completed marker (the unified finding set
is not in context on re-entry, so the deviation criterion is treated as not met).
