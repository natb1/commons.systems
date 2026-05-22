---
name: security-review-structured
description: Structured security review subtask invoked by /security-review-fix — fans out 9 parallel subagents (6 security domains, a red team, the built-in /security-review scan, and the PR's CodeQL alerts), classifies every finding, and returns one report; applies no fixes and posts nothing
---

# Structured Security Review

A structured, parallel-subagent security review of the pending changes on the
current branch. `/security-review-fix` (the `security` phase wrapper) invokes
this skill via the Skill tool as its single findings source — see
`security-review-fix/SKILL.md` Step 2.

This is a separate subtask skill, **not** an override of the built-in
`/security-review`. It runs under its own non-colliding name and invokes the
built-in `/security-review` as one of its nine Step 2 subagents.
`/security-review-fix` triages the report this skill returns, applies fixes,
posts the PR comment, applies the `dispatch:security-reviewed` label, and marks
the PR ready.

## Findings-only contract

The skill's return value is a structured classified findings report and nothing
else. It applies no fixes, edits no files, commits nothing, and posts no PR
comment or summary. `/security-review-fix` depends on this contract: it consumes
the returned report unchanged and owns every write action.

## No `context:` key — runs in the caller's thread

This skill has **no `context:` key** because Step 2 launches 9 subagents via the
Agent tool, which requires running in the caller's thread — the same reason
`/security-review-fix` and `/implement-unit` omit `context:`.

It has **no `model:` key**: the orchestrator inherits the caller's model, and
each subagent is launched with an explicit `model: sonnet`.

## Step 1 — Diff under review and PR number

Review the diff against the merge-base with `origin/main`. Git runs sandboxed —
`origin` is HTTPS to an allowlisted host, so no `dangerouslyDisableSandbox` is
needed:

```bash
git fetch origin main
MERGE_BASE=$(git merge-base HEAD origin/main)
git diff "$MERGE_BASE"...HEAD
```

Capture the changed-file list (`git diff --name-only "$MERGE_BASE"...HEAD`) and
`MERGE_BASE` — both feed every diff-reviewing subagent's preamble.

Resolve the PR number for the current branch — the CodeQL subagent (Step 2)
needs it (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh pr view "$(git rev-parse --abbrev-ref HEAD)" --json number -q .number
```

If the branch has no open PR the command prints nothing — pass that fact to the
CodeQL subagent so it reports "could not run" instead of fetching with an
invalid ref.

If the diff is empty, skip Step 2 — see **Edge cases**.

## Step 2 — Launch 9 parallel subagents

Fan out all 9 subagents in a **single message with 9 Agent tool calls**. Every
subagent uses `subagent_type: general-purpose` and `model: sonnet`, and every
subagent emits findings in the **Per-finding schema** below — so Step 3
aggregates all nine outputs uniformly.

### Shared preamble (in every subagent prompt)

- The **Per-finding schema** restated in full, so the subagent emits exactly
  those fields.
- The findings-only constraint: the subagent reports findings only. It edits no
  files, commits nothing, and posts nothing.

### Subagents 1–7 — the diff reviewers (6 domains + red team)

Each of these seven also receives `MERGE_BASE` and the changed-file list from
Step 1, plus the instruction: review only the pending changes (the diff vs
`MERGE_BASE`), but Read full files for the context needed to judge each change.

1. **Input validation** — injection in the changed code: SQL/NoSQL injection,
   XSS, command injection, path traversal. Check that external input is
   validated and escaped at every boundary it crosses.
2. **Auth & access control** — Firestore rules coverage for paths the diff
   touches, missing auth checks, privilege escalation. Confirm each new or
   changed Firestore path has a matching rule block and that client code does
   not assume access the rules do not grant.
3. **Data exposure** — API responses returning more fields than the caller
   needs, PII in logs (`console.log` and similar), internal details (stack
   traces, config, paths) leaked in error messages.
4. **Dependency audit** — run `npm audit`; check for known CVEs and outdated
   packages with security patches.
5. **Firebase-specific** — Firestore rules permissiveness (overly broad `allow`
   conditions, missing field constraints), emulator-only code reachable on
   production paths, Firebase API key or config exposure.
6. **Secrets scan** — hardcoded keys/tokens/credentials in the changed code,
   `.env` files committed to git, secrets leaking into build output.
7. **Red team** — construct concrete attack scenarios against the changed code:
   pick an attacker goal, trace a path through the diff to reach it, and report
   each viable scenario as a finding. Build scenarios from the code under review
   rather than pattern-matching a checklist of known vulnerabilities.

### Subagent 8 — built-in `/security-review` scan

Invoke the built-in `/security-review` skill via the Skill tool and return its
findings normalized to the **Per-finding schema**. If the built-in cannot spawn
its own subtasks from inside a subagent, run its review inline instead.
Normalize each built-in finding:

- **Confidence** — from the built-in's severity: `high`/`medium`/`low` severity
  maps to `high`/`medium`/`low` confidence.
- **OWASP** and **STRIDE** — inferred from the finding's category and
  description.
- **Location**, **Description**, **Recommended fix** — carried through directly.

### Subagent 9 — CodeQL code-scanning alerts

Fetch the PR's open code-scanning alerts from GitHub Advanced Security (use
`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh api --paginate "repos/{owner}/{repo}/code-scanning/alerts?state=open&ref=refs/pull/<pr-num>/head"
```

`<pr-num>` is the PR number from Step 1; `{owner}/{repo}` resolve automatically.
`--paginate` covers repos with many alerts; the `ref` filter scopes to the PR —
it includes pre-existing alerts in code the PR did not change. Normalize each
alert to the **Per-finding schema**:

- **Location** — from `most_recent_instance.location` (path and lines).
- **Description** — from `rule.description` / `most_recent_instance.message`;
  include the alert `number`, `rule.id`, and `html_url` so the finding is
  traceable.
- **OWASP** and **STRIDE** — inferred from `rule` (id, tags, description).
- **Confidence** — from `rule.security_severity_level`: `critical`/`high` →
  `high`, `medium` → `medium`, `low` or null → `low`.
- **Recommended fix** — the rule's remediation guidance.

If Step 1 found no PR, this subagent reports the CodeQL scan as "could not run
(no PR ref)" and returns no findings. An empty alert array is normal — no open
CodeQL alerts — and is not an error.

## Step 3 — Aggregate and de-duplicate

The orchestrator merges all nine subagents' findings into one set.

De-duplication matters here: subagents 8 and 9 (built-in scan, CodeQL) overlap
the six domain subagents, so the same issue often arrives from several sources.
When two or more findings name the **same root issue at the same location**,
collapse them into one: union their OWASP and STRIDE tags, take the highest
confidence among them, and record which subagents flagged it. Distinct issues —
even in the same file — stay separate.

## Step 4 — Classify each finding

Classify each de-duplicated finding into exactly one of:

| Classification | Meaning |
|---|---|
| `required` | A real vulnerability or weakness in the changed code that should be fixed. |
| `out-of-scope` | A genuine concern, but in pre-existing code the diff did not touch, or otherwise outside this PR's scope. |
| `false-positive` | Not an actual vulnerability — a misread of the code or a non-issue. |

`/security-review-fix` triages against exactly these three buckets.

## Per-finding schema

Every finding — emitted by subagents in Step 2 and carried through to the report
— has these fields:

- **Location** — `path:line`.
- **Description** — what the issue is and why it is a risk.
- **OWASP** — the OWASP Top 10 (2021) category (e.g. `A01:2021 Broken Access
  Control`, `A03:2021 Injection`).
- **STRIDE** — one of Spoofing, Tampering, Repudiation, Information Disclosure,
  Denial of Service, Elevation of Privilege.
- **Confidence** — `high`, `medium`, or `low`.
- **Recommended fix** — the concrete change that resolves the finding.
- **Classification** — `required`, `out-of-scope`, or `false-positive` (set by
  the orchestrator in Step 4).

## Step 5 — Return the report

Return one markdown report grouped by classification. Render **all three**
sections every time — `Required`, `Out of scope`, `False positive` — using
`_None._` for the body of any empty section. Within each section, order findings
by confidence, highest first.

```
## Required
- **<path:line>** — <description>
  - OWASP: <category> · STRIDE: <type> · Confidence: <level> · Flagged by: <subagent(s)>
  - Fix: <recommended fix>
- ...

## Out of scope
_None._

## False positive
- ...
```

`Flagged by` names the subagent(s) that surfaced the finding (e.g. `CodeQL`,
`Input validation`, `Red team`) so `/security-review-fix` can identify
CodeQL-sourced findings without a separate listing.

The report is the skill's final reply. Write no file, post no PR comment.
`/security-review-fix` consumes the returned text directly.

## Edge cases

- **Empty diff** — skip Step 2 and return a report whose three sections each
  render `_None._`.
- **A subagent finds nothing** — record that subagent as clean; it contributes
  no findings.
- **A subagent fails** — re-launch it once. If it fails again, note partial
  coverage in the report (name the subagent whose domain could not be reviewed).
- **`npm audit` sandbox or network failure** — retry the dependency-audit
  subagent's `npm audit` with `dangerouslyDisableSandbox: true`. If it still
  fails, report the dependency audit as "could not run" rather than silently
  dropping that domain.
- **CodeQL fetch failure** — retry the `gh api` fetch once with
  `dangerouslyDisableSandbox: true`. If it still fails, report the CodeQL scan
  as "could not run" rather than dropping it silently. An empty alert array is
  not a failure — it means no open alerts.
