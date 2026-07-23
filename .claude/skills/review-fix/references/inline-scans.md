# Step 1 inline scans and finder agents

Referenced from Step 1. The parent-thread inline scans (dependency audit, CodeQL,
erosion) and the surface-conditional finder-agent roster. Collect normalized
CodeQL, npm, and erosion findings into `prescanned_findings` to pass to the
Workflow.

## Dependency audit (inline, when `deps=true`)

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

## CodeQL alerts (inline, when `surface=code`)

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

## Erosion metrics (inline, when `surface=code`)

Run inline in this parent thread — not a subagent — whenever `surface=code`.
Pipe the changed-file list into `dispatch-review-erosion`, passing `MERGE_BASE`
as the positional argument (no `dangerouslyDisableSandbox` needed — jscpd is now
a local devDependency invoked via `node_modules/.bin/jscpd`, not an `npx` fetch):

```bash
# MERGE_BASE is already set above — reuse it here.
# Pass as positional arg (not an inline VAR=val prefix — breaks allowlist matching).
EROSION_JSON=$(.claude/skills/dispatch-propagate/scripts/dispatch-changed-files < "tmp/pack-$N.txt" \
  | .claude/skills/dispatch-propagate/scripts/dispatch-review-erosion "$MERGE_BASE")
```

The script emits `{"findings":[...]}` with `Source="erosion"` already in the
per-finding schema. Extract the `findings` array for `prescanned_findings`.

Collect normalized CodeQL, npm, and erosion findings into `prescanned_findings`
to pass to the Workflow.

## Finder agents (when `surface=code`)

The Workflow fans out agent finders based on `surface` and `app_or_rules`. The
`code-review` quality finder always runs — via `/code-review max --fix`,
applying its own working-tree edits directly; only its un-auto-fixed residue is
dispositioned (resolve/defer/ignore) by the new residue phase. When `surface === 'code'`, the following
domain finders also run. Four are gated on `surface=code` alone; four additionally
require `app_or_rules=true` (application/functions/rules source):

`code-review` and `security-review` are Lane A: they trust the built-in
`/code-review` and `/security-review` skills to do their own review-and-fix
rather than feeding the shared dedup/classify/verify/fix pipeline below — see
the "Disposition table" (Step 4) and the Model split note for how their output
reaches this skill's disposition set.

**`surface === 'code'`** (any code-surface diff):
- **input-validation** — Hunt injection in the changed code: SQL/NoSQL injection, XSS,
  command injection, path traversal. Check that external input is validated and escaped
  at every boundary it crosses.
- **secrets** — Hardcoded keys/tokens/credentials in the changed code, `.env` files
  committed to git, secrets leaking into build output.
- **red-team** — Construct concrete attack scenarios against the changed code. Pick an
  attacker goal, trace a path through the diff to reach it, and report each viable
  scenario as a finding. Build scenarios from the code under review, not a checklist of
  known vulnerabilities.
- **security-review** — Invokes the built-in `/security-review` skill for a broad
  security pass. It has no `--fix` flag, so it stays findings-only as before — but its
  entire output is now residue, dispositioned (resolve/defer/ignore) by the new
  residue phase rather than feeding the shared dedup/classify/verify/fix pipeline.

**`surface === 'code' && app_or_rules=true`** (app/functions/rules source):
- **auth** — Auth and access control: Firestore rules coverage for paths the diff touches,
  missing auth checks, privilege escalation. Confirm each new or changed Firestore path
  has a matching rule block and that client code does not assume access the rules do not
  grant.
- **data-exposure** — API responses returning more fields than the caller needs, PII in
  logs (console.log and similar), internal details (stack traces, config, paths) leaked
  in error messages.
- **firebase** — Firebase-specific: Firestore rules permissiveness (overly broad `allow`
  conditions, missing field constraints), emulator-only code reachable on production
  paths, Firebase API key or config exposure.
- **cost** — Cost/scaling lens: flags three Firestore cost/scaling patterns introduced in
  the diff: (1) unbounded queries — `getDocs`/collection scans with no `limit()` over a
  collection that grows without bound; (2) new high-frequency amplifiers layered over
  collection scans — a new interval, scheduler, polling loop, or refresh (e.g. a 5-minute
  refresh) placed over a query that scans a growing collection (the query×amplifier
  interaction); (3) N+1 `getDoc` loops. Reasons about the interaction between a query and
  its amplifier (call frequency × collection growth), not just the static shape of a
  single query — a query that is cheap per call becomes a cost/scaling risk once a new
  refresh or interval runs it repeatedly over a growing collection. Sets Source "cost",
  OWASP "", STRIDE "" (non-security). Findings are ADVISORY — see the cost disposition
  note in Step 4.
