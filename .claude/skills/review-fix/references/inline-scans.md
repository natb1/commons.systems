# Step 1 inline scans and finder agents

Referenced from Step 1. The parent-thread inline scans (dependency audit, CodeQL,
erosion) and the surface-conditional finder-agent roster. Collect normalized
CodeQL, npm, and erosion findings into `prescanned_findings` to pass to the
Workflow.

## Dependency audit (inline, when `deps=true`)

Run inline in this parent thread — not a subagent — when `deps=true`. The `deps`
gate already confirms the diff touches `package.json` / `package-lock.json`, so
produce the differential audit directly. `dispatch-review-npm-audit` does the
whole thing — its own temp dir, the HEAD audit, the `git show`-materialized
`MERGE_BASE` baseline, and the differential — and emits ONLY the normalized
result (use `dangerouslyDisableSandbox: true` — `npm` writes the npm cache, see
`.claude/rules/sandbox.md`):

```bash
# MERGE_BASE is already set above — reuse it here.
# Pass as positional arg (not an inline VAR=val prefix — breaks allowlist matching).
NPM_AUDIT_JSON=$(.claude/skills/dispatch-propagate/scripts/dispatch-review-npm-audit "$MERGE_BASE")
```

The script emits `{"findings":[...]}` with `Source="npm"` already in the
per-finding schema. Raw `npm audit` JSON never reaches this thread. Extract the
`findings` array for `prescanned_findings`.

**A non-zero exit means the dependency audit could not run — it does NOT mean
"no new advisories".** When `npm audit` cannot audit the tree (desynchronized or
hand-edited `package-lock.json`, a downgraded `lockfileVersion`, an unresolvable
workspace, an unreachable registry) npm emits a well-formed JSON *error*
document; the script rejects it and exits non-zero with npm's error text on
stderr rather than differencing it to an empty finding set. Check the exit code
and, on failure, report "dependency audit could not run" (with the stderr text)
as the outcome of this scan — never treat the empty `NPM_AUDIT_JSON` as a clean
audit.

The same non-zero refusal fires when the diff adds or modifies an `.npmrc`
(anywhere in the tree, tracked or untracked). An `.npmrc` decides which registry
answers the advisory query, so a diff that carries one can choose its own
verdict — a hostile or merely private registry returns a well-formed, empty
report the script cannot distinguish from a clean audit. The script pins
`--registry`, `--userconfig`, and `--globalconfig` on both audits, but a scoped
`@scope:registry=` override survives that, so a diffed `.npmrc` is reported as
"dependency audit could not be trusted" and the `.npmrc` change is reviewed by
hand.

The differential rules the script applies, unchanged: advisories present at head
but **not** at `MERGE_BASE` are CVEs the PR's dependency changes newly expose —
emitted with `introduced_by_diff=true` in the Description; these are in-scope and
classify `required`. Where such an advisory reports a published fix, the
Description also leads with `skipped_published_patch=true` — the resolved version
skipped a published security-patch release. Advisories present in **both** head
and baseline rated `high` or `critical` are pre-existing — emitted with
`introduced_by_diff=false` and classified `out-of-scope`: they feed the
follow-up-filing step (Step 6), not the PR's required-fix set. Pre-existing
advisories rated `moderate` or `low` are below the meaningfulness threshold and
the script omits them entirely.

## CodeQL alerts (inline, when `surface=code`)

Run inline in this parent thread — not a subagent — whenever `surface=code`.
`dispatch-review-codeql` fetches the PR's open code-scanning alerts from GitHub
Advanced Security and returns them already normalized (use
`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
CODEQL_JSON=$(.claude/skills/dispatch-propagate/scripts/dispatch-review-codeql "<pr-num>")
```

`<pr-num>` is the PR number from the idempotency preamble. The script runs
`gh api --paginate "repos/{owner}/{repo}/code-scanning/alerts?state=open&ref=refs/pull/<pr-num>/head"`
— `{owner}/{repo}` resolve automatically, `--paginate` covers repos with many
alerts, and the `ref` filter scopes to the PR (it includes pre-existing alerts in
code the PR did not change). Raw alert JSON never reaches this thread.

The script emits `{"findings":[...]}` with `Source="codeql"` already in the
per-finding schema. Extract the `findings` array for `prescanned_findings`. The
normalization it applies, unchanged:

- **Location** — from `most_recent_instance.location` (path and lines).
- **Description** — from `rule.description` / `most_recent_instance.message`;
  includes the alert `number`, `rule.id`, and `html_url` so the finding is
  traceable.
- **OWASP** and **STRIDE** — inferred from `rule` (its `external/cwe/cwe-NNN`
  tags, via a deterministic table in the script).
- **Confidence** — from `rule.security_severity_level`: `critical`/`high` →
  `high`, `medium` → `medium`, `low` → `low`. For non-security rules
  (`security_severity_level` is null), falls back to `rule.severity` (always
  present): `error` → `medium`, `warning`/`note` → `low`. This preserves signal
  from non-security rules instead of collapsing them all to `low`.
- **Recommended fix** — the rule's remediation guidance.

If the branch has no open PR (the pack's `=== PR ===` section printed `PR: none`),
pass `""` (or `none`) as `<pr-num>`: the script skips the fetch and returns
`{"findings":[],"status":"skipped-no-pr"}` — record the CodeQL scan as "could not
run (no PR ref)" with no findings. An empty alert array is normal — no open
CodeQL alerts — and is not an error.

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
to pass to the Workflow. All three scans now return the same shape — a
`{"findings":[...]}` document with the per-finding schema and `Source` already
set — so assembling `prescanned_findings` is just concatenating the `.findings`
array from each of the three script outputs. No raw API, audit, or metric JSON
crosses this thread.

## Finder agents (when `surface=code`)

The Workflow fans out agent finders based on `surface`, `app_or_rules`, and
`api_call_site`. The
Workflow's own agent fan-out contains only the surface-gated security/domain
lenses plus `security-review` — **`code-review` is not among them.** It runs as
the exclusive `claude -p '/code-review low --fix'` pre-stage in SKILL.md Step 1b,
BEFORE the Workflow is invoked at all: the `-p` user turn is the only entry point
that can invoke a `disable-model-invocation` skill, and its `--fix` writes the
working tree, so it must run to completion rather than concurrently with the
fan-out. The Workflow receives its output as `args.code_review` (paths plus the
git-derived `touched_files` list) and structures it with one Sonnet
`parse:code-review` subagent. On a non-`code` surface the Workflow launches no
agent finders at all. When `surface === 'code'`, the following domain finders
run. Four agents are gated on `surface=code` alone (`input-validation`,
`domain-sweep`, `red-team`, `security-review`) — `domain-sweep` folds what were
three separate always-vs-conditional lenses into one agent, so this is still
four AGENTS at this tier, not four lenses; one further agent, `api-cost`, runs
when `app_or_rules=true` **or** `api_call_site=true` — it folds the `firebase`
and `cost` lenses the same way, so this is one AGENT where there were two. The
folds do not change the lens content or the `Source` taxonomy — they only remove
the redundant cost of several agents each independently re-reading the same
diff, by having one agent read the diff once and carry the lenses as labelled
sections instead.

The two `api-cost` sections keep SEPARATE gates, and the agent is briefed only
on the sections whose gate is true:

- `firebase` (security) — `app_or_rules || api_call_site`. Its `app_or_rules`
  trigger is unchanged from before the fold; `api_call_site` only widens it.
  This matters: the `api_call_site` classifier matches added API/query call
  sites, and matches none of what this lens reviews (a Firestore rules diff,
  `connectFirestoreEmulator`, `apiKey`/`initializeApp`), so gating it on that
  flag alone would silently drop the reviewer on exactly the diffs it exists
  for.
- `cost` (advisory) — `api_call_site` alone.

`code-review` and `security-review` are still Lane A: they trust the built-in
`/code-review` and `/security-review` skills to do their own review-and-fix
rather than feeding the shared dedup/classify/verify/fix pipeline below — see
the "Disposition table" (Step 4) and the Model split note for how their output
reaches this skill's disposition set. They differ only in how they are invoked:
`security-review` is an agent finder inside the Workflow (and doubles as its
throttle probe, launched as wave 1); `code-review` is the Step-1b pre-stage.

**`surface === 'code'`** (any code-surface diff):
- **input-validation** — Hunt injection in the changed code: SQL/NoSQL injection, XSS,
  command injection, path traversal. Check that external input is validated and escaped
  at every boundary it crosses.
- **domain-sweep** — one Opus agent that reads the diff once and carries the domain
  lenses below as labelled sections. The `secrets` section always runs on a code
  surface; `auth` and `data-exposure` additionally run when `app_or_rules=true`
  (folded from three separate agents that each independently re-read the diff —
  see below).
  - **secrets** — Hardcoded keys/tokens/credentials in the changed code, `.env` files
    committed to git, secrets leaking into build output. Findings from this section
    carry `Source` set to exactly `secrets`, so per-lens yield stays separately
    measurable.
  - **auth** (runs only when `app_or_rules=true`) — Auth and access control:
    Firestore rules coverage for paths the diff touches, missing auth checks,
    privilege escalation. Confirm each new or changed Firestore path has a
    matching rule block and that client code does not assume access the rules do
    not grant. Findings from this section carry `Source` set to exactly `auth`,
    so per-lens yield stays separately measurable.
  - **data-exposure** (runs only when `app_or_rules=true`) — API responses
    returning more fields than the caller needs, PII in logs (console.log and
    similar), internal details (stack traces, config, paths) leaked in error
    messages. Findings from this section carry `Source` set to exactly
    `data-exposure`, so per-lens yield stays separately measurable.
- **red-team** — Construct concrete attack scenarios against the changed code. Pick an
  attacker goal, trace a path through the diff to reach it, and report each viable
  scenario as a finding. Build scenarios from the code under review, not a checklist of
  known vulnerabilities.
- **security-review** — Invokes the built-in `/security-review` skill for a broad
  security pass. It has no `--fix` flag, so it stays findings-only as before — but its
  entire output is now residue, dispositioned (resolve/defer/ignore) by the new
  residue phase rather than feeding the shared dedup/classify/verify/fix pipeline.

**`surface === 'code' && app_or_rules=true`** (app/functions/rules source):
- See **domain-sweep** above — the `auth` and `data-exposure` sections it carries
  when `app_or_rules=true`.
- The **api-cost** agent's `firebase` section (below).

**`surface === 'code'` and the `api-cost` agent fires** (`app_or_rules=true` or
`api_call_site=true`) — one agent, the sections below, each briefed only when its
own gate is true:
- **firebase** (`app_or_rules || api_call_site`) — Firebase-specific: Firestore rules permissiveness (overly broad `allow`
  conditions, missing field constraints), emulator-only code reachable on production
  paths, Firebase API key or config exposure.
- **cost** (`api_call_site` only) — Cost/scaling lens: flags three Firestore cost/scaling patterns introduced in
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
