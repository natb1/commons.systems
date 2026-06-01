---
name: security-review-fix
description: Security phase — classify the diff's changed surface, then fan out only the relevant security subagents (skip entirely for docs-only diffs), run CodeQL and the dependency audit inline when relevant, classify findings, apply the required fixes, post a PR comment, apply the dispatch:security-reviewed label, and mark the PR ready
---

# Security Review and Fix

The `security` phase of the issue workflow, dispatched by `/dispatch-propagate`. This skill
owns the full structured security review for the dispatch workflow: classify the
diff's changed surface, fan out the relevant security subagents directly (a
docs-only diff skips the fan-out entirely), run CodeQL and the dependency audit
inline when relevant, de-duplicate and classify the findings, implement the
required fixes, commit and push, post a PR comment, apply the
`dispatch:security-reviewed` label, and mark the PR ready.

This is the workflow's **terminal actionable phase** — it marks the PR ready
itself, so there is no separate `ready` phase after it.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, launch the review subagents directly via the Agent
tool, run the CodeQL and dependency-audit scans inline, and launch implementation
subagents.

## Idempotency preamble

Before running any step, resolve the PR number and its labels from the current
branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is carried through to Steps 4, 5, and 6 — do not re-resolve. If the PR
already carries the `dispatch:security-reviewed` label — an interrupted prior
run — **skip Steps 1–5 entirely** and go straight to Step 6 to ensure the PR is
ready. Otherwise run all steps in order.

## Steps

1. **Classify the surface, then fan out conditionally.** Review the branch's
   pending changes — the diff against the merge-base with `origin/main` — but
   launch only the reviewers the changed surface warrants. A docs-only diff
   launches none; a code diff launches the unconditional-on-code reviewers, plus
   the app-domain reviewers when the diff touches application code or Firestore
   rules.

   First, capture the diff context every reviewer needs. Git runs sandboxed —
   `origin` is HTTPS to an allowlisted host, so no `dangerouslyDisableSandbox` is
   needed:

   ```bash
   git fetch origin main
   MERGE_BASE=$(git merge-base HEAD origin/main)
   git diff --name-only "$MERGE_BASE"...HEAD
   ```

   Classify the changed-file list with `dispatch-security-surface` — a pure
   stdin→stdout classifier (no `gh`/git/network, so it runs sandboxed-fine):

   ```bash
   SURFACE_OUT=$(git diff --name-only "$MERGE_BASE"...HEAD \
     | .claude/skills/dispatch-propagate/scripts/dispatch-security-surface)
   surface=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^surface=//p')
   deps=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^deps=//p')
   app_or_rules=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^app_or_rules=//p')
   ```

   - `surface` is `empty` (no changed files), `docs` (every changed path is
     documentation — markdown/text/license, no executable, config, dependency,
     or rules surface), or `code` (anything else).
   - `deps` is `true` when the diff touches `package.json` / `package-lock.json`.
   - `app_or_rules` is `true` when the diff touches application source
     (`.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs`/`.go` outside `.claude/`) or a
     Firestore / Storage rules file.

   **`surface=empty` or `surface=docs`** → launch no reviewers and run no inline
   scans. The classified finding set is empty (no required fixes). Step 4's PR
   comment is a single line describing the surface: for `docs`, `Security review:
   no attack surface — docs-only diff (no executable, config, dependency, or
   Firestore-rules changes).`; for `empty`, `Security review: no attack surface —
   diff is empty (no changed files detected).` Continue to Steps 3–7 normally:
   `/commit-merge-push` is a no-op,
   the label and ready-flip still apply, and the empty finding set means the
   Step 7 deviation criterion is trivially not met, so the marker is written.

   **`surface=code`** → fan out the reviewers below in **a single message, one
   Agent tool call per reviewer**. Every reviewer is a direct child of this
   skill; there is no intermediate orchestrator. Every reviewer uses
   `subagent_type: general-purpose` and `model: sonnet`, and emits findings in
   the **Per-finding schema** below, so the aggregation step treats every output
   uniformly. CodeQL and the dependency audit are **not** subagents — they run
   inline in this parent thread (see their subsections below), consistent with
   the dispatch convention of direct subagents and no nesting.

   ### Shared preamble (in every subagent prompt)

   - The **Per-finding schema** restated in full, so the subagent emits exactly
     those fields.
   - The findings-only constraint: the subagent reports findings only. It edits
     no files, commits nothing, and posts nothing.
   - `MERGE_BASE` and the changed-file list, plus the instruction: review only
     the pending changes (the diff vs `MERGE_BASE`), but Read full files for the
     context needed to judge each change.

   ### Reviewers that run on every code diff

   These four launch whenever `surface=code`, regardless of `app_or_rules` —
   command injection in a bash script and hardcoded secrets in config are real
   attack surface even when no application code changed:

   - **Input validation** — injection in the changed code: SQL/NoSQL injection,
     XSS, command injection, path traversal. Check that external input is
     validated and escaped at every boundary it crosses.
   - **Secrets scan** — hardcoded keys/tokens/credentials in the changed code,
     `.env` files committed to git, secrets leaking into build output.
   - **Red team** — construct concrete attack scenarios against the changed
     code: pick an attacker goal, trace a path through the diff to reach it, and
     report each viable scenario as a finding. Build scenarios from the code
     under review rather than pattern-matching a checklist of known
     vulnerabilities.
   - **Built-in `/security-review` scan** — fork a subagent that invokes the
     built-in `/security-review` skill via the Skill tool inside the subagent
     and returns its output normalized to the **Per-finding schema**. The
     subagent boundary is the control-flow guarantee: the parent never sees the
     inner Skill's prompt template, so this skill remains on Step 1 when the
     Agent call returns. The subagent passes the inner skill no output contract.
     Keep the "once it returns, continue" wording inside the **subagent's**
     prompt as defense-in-depth for the inner Skill invocation; any "final
     reply" / "nothing else" wording in `/security-review`'s prompt scopes only
     to its findings deliverable.

     Normalize each built-in finding:

     - **Confidence** — from the built-in's severity: `high`/`medium`/`low`
       severity maps to `high`/`medium`/`low` confidence.
     - **OWASP** and **STRIDE** — inferred from the finding's category and
       description.
     - **Location**, **Description**, **Recommended fix** — carried through
       directly.

   ### App-domain reviewers (only when `app_or_rules=true`)

   These three are structurally N/A when the diff touches no application code or
   Firestore rules, so launch them only when `app_or_rules=true`:

   - **Auth & access control** — Firestore rules coverage for paths the diff
     touches, missing auth checks, privilege escalation. Confirm each new or
     changed Firestore path has a matching rule block and that client code does
     not assume access the rules do not grant.
   - **Data exposure** — API responses returning more fields than the caller
     needs, PII in logs (`console.log` and similar), internal details (stack
     traces, config, paths) leaked in error messages.
   - **Firebase-specific** — Firestore rules permissiveness (overly broad
     `allow` conditions, missing field constraints), emulator-only code
     reachable on production paths, Firebase API key or config exposure.

   ### Dependency audit (inline, when `deps=true`)

   Run inline in this parent thread — not a subagent — when `deps=true`. The
   `deps` gate already confirms the diff touches `package.json` /
   `package-lock.json`, so produce the differential audit directly (use a
   private temp dir):

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

   Report only advisories whose advisory ID appears in
   `$AUDIT_DIR/audit-head.json` but not in `$AUDIT_DIR/audit-baseline.json` —
   these are CVEs the PR's dependency changes newly expose. Also flag any
   dependency the PR adds or upgrades whose resolved version skips a published
   security-patch release for that package. Normalize each into the
   **Per-finding schema**.

   ### CodeQL alerts (inline, when `surface=code`)

   Run inline in this parent thread — not a subagent — whenever `surface=code`.
   Fetch the PR's open code-scanning alerts from GitHub Advanced Security (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   gh api --paginate "repos/{owner}/{repo}/code-scanning/alerts?state=open&ref=refs/pull/<pr-num>/head"
   ```

   `<pr-num>` is the PR number from the idempotency preamble; `{owner}/{repo}`
   resolve automatically. `--paginate` covers repos with many alerts; the `ref`
   filter scopes to the PR — it includes pre-existing alerts in code the PR did
   not change. Normalize each alert to the **Per-finding schema**:

   - **Location** — from `most_recent_instance.location` (path and lines).
   - **Description** — from `rule.description` /
     `most_recent_instance.message`; include the alert `number`, `rule.id`, and
     `html_url` so the finding is traceable.
   - **OWASP** and **STRIDE** — inferred from `rule` (id, tags, description).
   - **Confidence** — from `rule.security_severity_level`:
     `critical`/`high` → `high`, `medium` → `medium`, `low` → `low`. For
     non-security rules (`security_severity_level` is null), fall back to
     `rule.severity` (always present): `error` → `medium`, `warning`/`note` →
     `low`. This preserves signal from non-security rules instead of
     collapsing them all to `low`.
   - **Recommended fix** — the rule's remediation guidance.

   If the branch has no open PR (`gh pr view` exited non-zero in the idempotency
   preamble), skip the fetch and record the CodeQL scan as "could not run (no PR
   ref)" with no findings. An empty alert array is normal — no open CodeQL alerts
   — and is not an error.

   ### Aggregate, de-duplicate, and classify

   Once the launched reviewers return — together with the inline CodeQL and
   dependency-audit results — merge their findings into one set.

   De-duplication matters here: the built-in `/security-review` scan and the
   inline CodeQL alerts overlap the domain reviewers, so the same issue often
   arrives from several sources. When two or more findings name the **same root
   issue at the same location**, collapse them into one: pick the most specific
   OWASP category and STRIDE element across the duplicates (a single value each
   per the Per-finding schema), take the highest confidence among them, and
   record which reviewers flagged it. Distinct issues — even in the same file —
   stay separate.

   Then classify each de-duplicated finding into exactly one of:

   | Classification | Meaning |
   |---|---|
   | `required` | A real vulnerability or weakness in the changed code that should be fixed. |
   | `out-of-scope` | A genuine concern, but in pre-existing code the diff did not touch, or otherwise outside this PR's scope. |
   | `false-positive` | Not an actual vulnerability — a misread of the code or a non-issue. |

   The classified finding set is the input to Step 2 and the audit trail for
   the Step 4 PR comment.

2. **Apply the required fixes.** Implement fixes for the findings classified
   `required` in Step 1 — launch implementation subagent(s) via the Agent tool,
   constrained to **working-tree edits only — no commits, no pushes**. Choose
   each subagent's model per `/implement-unit`'s model-selection heuristic (see
   that skill — it is the canonical home; do not restate it here).
   `out-of-scope` and `false-positive` findings get no code change but are
   still carried to the Step 4 PR comment with their disposition.

3. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool to
   commit the Step 2 fixes and push. If Step 2 produced no code changes (no
   actionable findings), this invocation also runs with no pending changes —
   `/commit-merge-push` tolerates that and creates no commit.

4. **Post a PR comment.** Reuse the `PR_NUM` captured in the preamble — do not
   re-resolve.

   Write the comment body to a file under the repo's `tmp/` directory. The body
   summarizes **every** finding from Step 1 and its disposition — fixed (with
   the fix's commit SHA) or not fixed (with the reason). CodeQL-sourced findings
   are identified by their `rule.id` and alert `number`, linked via their
   `html_url`; there is no separate CodeQL listing. The body file **must** live
   under `tmp/` because `post-pr-comment.sh` restricts paths to that directory.
   Then post it (use `dangerouslyDisableSandbox: true` — the script invokes
   `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
   ```

5. **Apply the `dispatch:security-reviewed` label** via `dispatch-complete-phase`
   (use `dangerouslyDisableSandbox: true` — the script calls `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" security
   ```

   The PR number passed here is **expected** to differ from the worktree's
   `<issue>-…` branch issue number — the PR↔issue linkage was established
   earlier in the tick (by `dispatch-resolve-arg`, `dispatch-find-pr`, or
   `dispatch-select-target`), so the dispatching session must **not** pause to
   re-confirm the mismatch.

   This skill **owns** its `dispatch:security-reviewed` label — unlike the generic
   `/security-review`, which `/dispatch-propagate` cannot make dispatch-aware — so
   `/dispatch-propagate` does not apply the label after this skill returns.

6. **Mark the PR ready.** Flip the draft to ready-for-review (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   gh pr ready "$PR_NUM"
   ```

   This is the workflow's terminal PR-state action.

7. **Write the phase-completed marker (or park on deviation), then stop.**

   Check for deviation first: if any finding classified `required` with
   Confidence `high` remains unresolved after the Step 2 fix pass, the
   deviation criterion fires. `CLAUDE_JOB_DIR` unset = interactive run; skip
   both branches. On idempotent re-entry (Steps 1–5 were skipped), the Step 2
   finding set is not in context — treat the deviation criterion as not met and
   write the marker.

   **Deviation fires** (a high-confidence `required` finding is still
   unresolved) — skip the phase-completed marker. Write a one-line reason
   instead, atomic via tempfile + mv:

   ```bash
   if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
     printf '%s\n' "/security-review-fix: high-confidence required finding(s) left unresolved after fixes" \
       > "$CLAUDE_JOB_DIR/office-hours-reason.tmp"
     mv "$CLAUDE_JOB_DIR/office-hours-reason.tmp" \
        "$CLAUDE_JOB_DIR/office-hours-reason"
   fi
   ```

   The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads marker-absence as
   Branch A and applies `dispatch:office-hours` to the issue, surfacing the
   reason in the why-comment, so the parked item explains which criterion
   fired. Do not apply the `dispatch:office-hours` label inline — the
   Stop hook owns label application.

   **No deviation** (all high-confidence `required` findings resolved, or none
   existed) — write the phase-completed marker, atomic via tempfile + mv:

   ```bash
   if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
     printf 'phase=security\npr=%s\n' "$PR_NUM" \
       > "$CLAUDE_JOB_DIR/phase-completed.tmp"
     mv "$CLAUDE_JOB_DIR/phase-completed.tmp" \
        "$CLAUDE_JOB_DIR/phase-completed"
   fi
   ```

   Then **stop**. The Stop hook reads the marker and advances the chain.
   `gh pr ready` (Step 6) is still the workflow's terminal *PR-state* action
   and runs regardless of deviation — only the marker is skipped when the
   deviation criterion fires.

## Per-finding schema

Every finding — emitted by subagents in Step 1 and carried through to the
classified set — has these fields:

- **Location** — `path:line`.
- **Description** — what the issue is and why it is a risk.
- **OWASP** — the OWASP Top 10 (2021) category (e.g. `A01:2021 Broken Access
  Control`, `A03:2021 Injection`).
- **STRIDE** — one of Spoofing, Tampering, Repudiation, Information Disclosure,
  Denial of Service, Elevation of Privilege.
- **Confidence** — `high`, `medium`, or `low`.
- **Recommended fix** — the concrete change that resolves the finding.
- **Classification** — `required`, `out-of-scope`, or `false-positive` (set by
  the orchestrator after dedup).

## Edge cases

- **Empty or docs-only diff** — `surface` is `empty` or `docs`; launch no
  reviewers, run no inline scans, and carry an empty finding set into Step 2.
- **A subagent finds nothing** — record that reviewer as clean; it contributes
  no findings.
- **A subagent fails** — re-launch it once. If it fails again, note partial
  coverage in the Step 4 PR comment (name the reviewer whose domain could not
  be reviewed).
- **`npm audit` sandbox or network failure** — the dependency audit runs inline;
  retry its `npm audit` with `dangerouslyDisableSandbox: true`. If it still
  fails, report the dependency audit as "could not run" rather than silently
  dropping that domain.
- **CodeQL fetch failure** — the CodeQL fetch runs inline; retry the `gh api`
  fetch once with `dangerouslyDisableSandbox: true`. If it still fails, report
  the CodeQL scan as "could not run" rather than dropping it silently. An empty
  alert array is not a failure — it means no open alerts.

## Notes

Marking the PR ready (Step 6) is the workflow's terminal PR-state action;
writing the phase-completed marker (Step 7) is the dispatch chain's hand-off
cue. After this change the dispatch workflow has no human checkpoint before a PR
goes ready — the per-phase PR-comment summaries are the audit trail. This is an
intentional trade-off for an autonomous `/dispatch-propagate` background-job run.

The skill is idempotent: a re-invocation with `dispatch:security-reviewed` already
on the PR skips Steps 1–5, ensures the PR is ready (Step 6), and then runs the
deviation check at Step 7. On re-entry the Step 2 finding set is not in context;
treat the deviation criterion as not met (no unresolved findings visible) and
write the phase-completed marker.
