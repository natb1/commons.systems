---
name: security-review
description: Structured security review of a branch's pending changes — fans out 7 parallel subagents across 6 security domains plus a red team, then returns one classified findings report; applies no fixes and posts nothing
---

# Security Review

A structured, parallel-subagent security review of the pending changes on the
current branch. This project skill overrides the built-in `/security-review`.

`/security-review-fix` (the `security` phase wrapper) invokes this skill via the
Skill tool as its findings source — see `security-review-fix/SKILL.md` Step 2(a).
That wrapper triages this report, applies fixes, posts the PR comment, applies the
`dispatch:security-reviewed` label, and marks the PR ready.

## Findings-only contract

The skill's return value is a structured classified findings report and nothing
else. It applies no fixes, edits no files, commits nothing, and posts no PR
comment or summary. `/security-review-fix` Step 2(a) depends on this contract:
it consumes the returned report unchanged and owns every write action.

## No `context:` key — runs in the caller's thread

This skill has **no `context:` key** because Step 2 launches 7 subagents via the
Agent tool, which requires running in the caller's thread — the same reason
`/security-review-fix` and `/implement-unit` omit `context:`.

It has **no `model:` key**: the orchestrator inherits the caller's model, and
each subagent is launched with an explicit `model: sonnet`.

## Step 1 — Diff under review

Review the diff against the merge-base with `origin/main`. Git runs sandboxed —
`origin` is HTTPS to an allowlisted host, so no `dangerouslyDisableSandbox` is
needed:

```bash
git fetch origin main
MERGE_BASE=$(git merge-base HEAD origin/main)
git diff "$MERGE_BASE"...HEAD
```

Capture the changed-file list (`git diff --name-only "$MERGE_BASE"...HEAD`) and
`MERGE_BASE`. Both are passed into every subagent's shared preamble.

If the diff is empty, skip Step 2 — see **Edge cases**.

## Step 2 — Launch 7 parallel subagents

Fan out all 7 subagents in a **single message with 7 Agent tool calls**. Every
subagent uses `subagent_type: general-purpose` and `model: sonnet`.

Each subagent prompt is a **shared preamble** plus a **domain charge**.

### Shared preamble (identical for all 7)

- The merge-base SHA (`MERGE_BASE`) and the changed-file list from Step 1.
- The per-finding schema from **Per-finding schema** below — restated in full so
  the subagent emits exactly those fields.
- The findings-only constraint: the subagent reports findings only. It edits no
  files, commits nothing, and posts nothing.
- Review only the pending changes (the diff vs `MERGE_BASE`), but Read full files
  for the context needed to judge each change.

### Domain charges

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
4. **Dependency audit** — run `npm audit`, check for known CVEs and outdated
   packages with security patches. This **complements** CodeQL — report what
   `npm audit` surfaces; do not re-derive CodeQL's code-scanning output. See
   **CodeQL is out of scope** below.
5. **Firebase-specific** — Firestore rules permissiveness (overly broad
   `allow` conditions, missing field constraints), emulator-only code reachable
   on production paths, Firebase API key or config exposure. This
   **complements** CodeQL rather than re-deriving it.
6. **Secrets scan** — hardcoded keys/tokens/credentials in the changed code,
   `.env` files committed to git, secrets leaking into build output.
7. **Red team** — construct concrete attack scenarios against the changed code:
   pick an attacker goal, trace a path through the diff to reach it, and report
   each viable scenario as a finding. Build scenarios from the code under
   review rather than pattern-matching a checklist of known vulnerabilities.

## Step 3 — Aggregate and de-duplicate

The orchestrator merges all subagent findings into one set.

When two findings name the **same root issue at the same location**, collapse
them into one finding: union their OWASP and STRIDE tags, take the highest
confidence among them, and note which domains flagged it. Distinct issues — even
at the same file — stay separate.

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
  - OWASP: <category> · STRIDE: <type> · Confidence: <level>
  - Fix: <recommended fix>
- ...

## Out of scope
_None._

## False positive
- ...
```

The report is the skill's final reply. Write no file, post no PR comment.
`/security-review-fix` consumes the returned text directly.

## CodeQL is out of scope

This skill does **not** fetch CodeQL `code-scanning/alerts`. That aggregation
already lives in `/security-review-fix` (shipped via #770, closing #53), which
gathers CodeQL alerts independently and combines them with this report. The
dependency-audit and Firebase-specific subagents **complement** CodeQL — they
report what `npm audit` and a Firebase-config review surface, and do not
re-derive CodeQL's code-scanning output.

## Edge cases

- **Empty diff** — skip Step 2 and return a report whose three sections each
  render `_None._`.
- **A subagent finds nothing** — record that domain as clean; it contributes no
  findings.
- **A subagent fails** — re-launch it once. If it fails again, note partial
  coverage in the report (name the domain that could not be reviewed).
- **`npm audit` sandbox or network failure** — retry the dependency-audit
  subagent's `npm audit` with `dangerouslyDisableSandbox: true`. If it still
  fails, report the dependency audit as "could not run" in the report rather
  than silently dropping that domain.
