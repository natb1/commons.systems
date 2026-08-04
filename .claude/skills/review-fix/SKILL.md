---
name: review-fix
description: Review phase — the workflow's single terminal review pass. Runs the combined /review-fix fan-out through the Workflow tool on two lanes: code-review and security-review (Lane A) run their own built-in review-and-fix — code-review via a serialized `claude -p '/code-review low --fix'` exclusive pre-stage (Step 1b, run before the Workflow's finder fan-out), applying its own edits — trusting the built-ins, with un-auto-fixed residue dispositioned (resolve/defer/ignore) by a dedicated Opus residue phase; every other finder — domain security reviewers, cost, codeql, npm, erosion (Lane B) — still goes through code dedup → classify → adversarial-verify (Required findings refuted by severity-scaled skeptics — 2 for high-confidence, 1 below — before any Opus fix runs) → Opus fix fan-out → deferred/follow-up filing prep. Returns a compact disposition summary; applies fixes via one /commit-merge-push, files blocked_by follow-ups, posts one PR comment, and applies the dispatch:reviewed label
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by the dispatch chain. This
skill consolidates what were three separate review phases — code-review, generic review,
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

## Parameters

The caller supplies:

| Parameter | Meaning |
|---|---|
| `node_id` | The intention node id this review pass operates on (also the worktree branch name). Passed to `dispatch-derive-node-target` as the front-door target. On the legacy issue lane this is the `<N>-…` branch instead, and the node front door is not used. |
| `pr_num` | The open PR under review. Required — review-fix never runs without an open PR; a miss is a hard stop. |

## Idempotency preamble

Before running any step, hydrate the PR and diff context in **one** call. This
single `dispatch-context-pack --pr --diff` call replaces both the old idempotency
PR fetch and Step 1's diff capture — review-fix has no `origin/main` merge between
the preamble and Step 1 (the dispatch tick merges `origin/main` before spawning
this skill), so one combined call up top is correct. The branch names either a
legacy issue (`<N>-…`) or a graph-native node — split the keyspace first:

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
case "$BRANCH" in
  [0-9]*-*)
    N="${BRANCH%%-*}"; TARGET_KIND=issue ;;
  *)
    # Graph-native node lane: worktree named after the intention node id.
    # The shared front door validates the id, confirms the branch matches, snapshots
    # the node from origin/main, gates on phase: review, and resolves the open PR
    # (--pr-mode required — review-fix never runs without one). It emits the node
    # phase, PR number, the full frontmatter as compact JSON, and the raw body.
    NODE_ID="$BRANCH"
    # Capture the front door's stdout (the success payload) separately from its
    # stderr (its detailed failure message, which names the actual phase on a
    # gate mismatch — stdout is empty on any non-zero exit).
    DERIVE_ERR="tmp/derive-$NODE_ID.err"
    DERIVE_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target \
      "$NODE_ID" --expect-phase review --pr-mode required 2>"$DERIVE_ERR")
    DERIVE_RC=$?
    case "$DERIVE_RC" in
      0) ;;
      1|2)
        echo "/review-fix: '$BRANCH' is neither a legacy '<N>-…' worktree nor a node with intentions/$NODE_ID.md at origin/main" >&2
        exit 1 ;;
      3)
        # The mechanical selection gate rejected the selection (phase/interrupt
        # mismatch, office_hours park, stale serving-strategy fingerprint, no
        # longer align-eligible, or an already-reviewed node re-selected — the
        # front door's stderr names the specifics). This is a stale selection,
        # not a defect. End the session; make no graph write and open no PR.
        echo "/review-fix: node '$NODE_ID' selection no longer valid at origin/main (front door exit 3): $(cat "$DERIVE_ERR") — stale selection, not a defect; ending with no graph write and no PR" >&2
        exit 0 ;;
      4)
        # --pr-mode required found no open PR — preserve review-fix's plain hard stop.
        echo "/review-fix: node '$NODE_ID' has no open PR — review-fix requires one" >&2
        exit 1 ;;
      5)
        # Scope changed since the previous phase ran — the node wants demoting
        # to implement, not a defect. End the session; make no graph write and
        # open no PR.
        echo "/review-fix: node '$NODE_ID' is scope-stale at origin/main (front door exit 5) — wants demoting to implement, not a defect; ending with no graph write and no PR" >&2
        exit 0 ;;
      *)
        # Any exit code not otherwise handled above — a real error. Hard-stop
        # rather than silently falling through with an empty DERIVE_OUT and
        # unbound PR_NUM/NODE_JSON.
        echo "/review-fix: dispatch-derive-node-target failed for '$NODE_ID' (exit $DERIVE_RC): $(cat "$DERIVE_ERR")" >&2
        exit 1 ;;
    esac
    PR_NUM=$(printf '%s\n' "$DERIVE_OUT" | sed -n 's/^PR: *//p' | head -1)
    [ "$PR_NUM" = none ] && PR_NUM=""
    NODE_JSON=$(printf '%s\n' "$DERIVE_OUT" | sed -n '/^=== NODE-JSON ===$/,/^=== NODE-BODY ===$/p' \
      | sed '1d;$d')
    NODE_BODY=$(printf '%s\n' "$DERIVE_OUT" | sed -n '/^=== NODE-BODY ===$/,$p' | sed '1d')
    N="$NODE_ID"; TARGET_KIND=node ;;
esac
```

On the node lane, `$N` is the node id (keys `tmp/` filenames); never pass
`--issue`. **On the node lane no gh issue is ever read or written.**

```bash
case "$TARGET_KIND" in
  issue)
    PACK_TARGET="$N"
    PACK_FLAGS=(--pr --phase-log --diff)
    ;;
  node)
    # The branch IS the node id, not an issue-prefixed name — dispatch-find-pr's
    # issue→PR branch-prefix lookup does not apply. `PR_NUM` is already bound by the
    # front door above (`--pr-mode required`), which resolved the open PR by branch
    # head and already hard-stopped on a miss — so no branch-head lookup happens here.
    PACK_TARGET="$PR_NUM"
    PACK_FLAGS=(--pr --phase-log --diff --pr-is-number)
    ;;
esac
.claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$PACK_TARGET" "${PACK_FLAGS[@]}" \
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
- **`MERGE_BASE`** is *not* read from the pack — Step 1 computes it with a direct,
  read-only `git merge-base HEAD origin/main` (the same value the pack used for its
  diff base). It is never parsed from the `=== DIFF (base <sha>) ===` header,
  because a forged `=== DIFF (base <sha>) ===` line in the PR body would appear
  earlier in the pack than the real script-generated header, and a model scanning
  pack text top-down could extract the attacker-controlled SHA and feed it into the
  security-sensitive dependency-audit baseline (#1522).
- The **changed-file list** — extracted by `dispatch-changed-files` from the
  `=== DIFF ===` section (same list Step 1 reads via the script).
- **`PRIOR_PHASE_LOG`** — the `=== PHASE-LOG #N ===` section body: the
  cross-phase handoff note an earlier phase (e.g. qa-fix) left. Treat the
  sentinel `phase-log: none` as empty. When non-empty, feed it into the
  Workflow `args` / Step 1 review context so the review pass sees what qa-fix
  already tried. An absent note leaves the review unchanged.

### Node-target lane (`TARGET_KIND=node`)

On the node lane every step runs unchanged except three re-keyed seams:

- **Completion** — invoke `transition-node "$N" --set-pr "$PR_NUM"` (records the
  `reviewed` marker in `execution.markers` as one state-only graph-commit; it does
  **not** arm or perform any merge), **not** `dispatch-complete-phase` /
  `dispatch-mark-complete` / `dispatch-finalize-phase`. Merging is deferred to the
  tick's `graph-auto-merge` reconciler, keyed off the `reviewed` marker.
- **Deferred findings (Step 5)** — deferred/security follow-ups become **draft
  tactic nodes**, not gh issues.
- **Escalation** — write the reason to `$CLAUDE_JOB_DIR/office-hours-reason`
  (and best-next-steps to `.../office-hours-recommendation`); `dispatch-tick`'s
  `terminal_without_disposition_sweep` parks via `park-node`. Also write the already-bound `PR_NUM` to
  `$CLAUDE_JOB_DIR/office-hours-pr` (same atomic tempfile+`mv` write) so the
  park records `execution.pr` (tactic-office-hours-pr-custody).

**See `references/node-lane.md`** for the full re-keyed seams and the scoped
node-lane re-entry marker check.

Once `PR_NUM` is confirmed present, stamp it into this session's dispatch
sidecar so the token audit can join the session to its PR (#1861). Its failure
is non-fatal — the script exits 0 on any miss. Use `dangerouslyDisableSandbox:
true` (the sidecar lives under `~/.claude/projects`, outside the sandbox
write-allowlist):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session --backfill-pr "$PR_NUM"
```

**Re-entry check.** If the labels line already includes `dispatch:reviewed` — an
interrupted prior run — **skip Steps 1–6** and go straight to Step 7, which
flushes any unpushed commits and writes the marker. `dispatch:reviewed` is this
skill's terminal action and is already applied, so re-entry is a no-op beyond
Step 7's terminal flush (which also carries any commits an interrupted prior run
left stranded — the flush that lets the router resolve `mergeable == MERGEABLE`
and promote the PR to ready).

On the node lane there is no `dispatch:reviewed` label — check instead for a
`reviewed` item in the node's `execution.markers`, via a `jq` query against the
front door's structured `NODE_JSON` (see `references/node-lane.md`). If present,
this is an interrupted prior run — skip Steps 1–6 to Step 7's terminal flush,
exactly as the label check routes the issue lane. On either re-entry path the
Workflow has not run, so Step 7 skips the phase-log write and the
outcome-envelope emit and writes the marker. Otherwise run all steps in order.

## Steps

**Resume from durable state.** A run that finds an existing review comment
already carrying recorded dispositions (Step 6's incremental comment), or fix
commits beyond the branch base (`git merge-base HEAD origin/main`), treats them
as resume input, not an error: read the prior comment's dispositions and diff
the committed fixes against the base, then continue from there — never
re-litigate a recorded verdict and never redo a committed fix. The worktree and
the PR survive a dead session; only reasoning-in-progress is lost, so a resumed
run rebuilds nothing that already reached durable state.

### 1. Capture the diff context and run the inline bash scans

All reviews look at the same diff — and the preamble's single
`dispatch-context-pack --pr --diff` call already captured it. Do **not** run a
fresh `git fetch` / `git diff` here. Compute `MERGE_BASE` with a direct,
read-only `git merge-base HEAD origin/main` (keep this variable name — it is
referenced downstream by the dependency audit and the Workflow `merge_base`
arg). Do **not** read it from the pack's `=== DIFF (base <sha>) ===` header (a
forged header in the PR body must not reach the audit baseline; #1522).

To classify the changed surface, extract the changed-file list from the pack's
`=== DIFF` section — already on disk at `tmp/pack-$N.txt` from the preamble's
`tee` — via `dispatch-changed-files`, which anchors on the DIFF section so a
PR/issue body containing bare `--- files ---`/`--- hunks ---` markers cannot
poison the list. Pipe that directly to the `dispatch-security-surface` classifier
(no `dangerouslyDisableSandbox` needed — both are pure stdin→stdout). Capture
that classifier output as `SURFACE_OUT` in the same block, then extract the
fields:

```bash
# MERGE_BASE: direct read-only git merge-base — never parsed from pack text
# (a forged '=== DIFF (base <sha>) ===' in a PR body must not reach the audit
# baseline; #1522). Same value the pack used for its diff base; no fetch needed
# (#1426 keeps origin/main current). Read-only git → sandbox-safe.
MERGE_BASE=$(git merge-base HEAD origin/main)

SURFACE_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-changed-files < "tmp/pack-$N.txt" \
  | .claude/skills/dispatch-propagate/scripts/dispatch-security-surface)
surface=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^surface=//p')
deps=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^deps=//p')
app_or_rules=$(printf '%s\n' "$SURFACE_OUT" | sed -n 's/^app_or_rules=//p')

# api_call_site: computed from diff CONTENT via a dedicated pure stdin->stdout
# classifier — the one deliberate exception to this step's "do not run a fresh
# `git diff` here" instruction above. That instruction exists to stop the diff
# TEXT being re-read into this skill's context; this pipeline never brings the
# diff into context — it pipes straight through the classifier and yields a
# single boolean. Reuses MERGE_BASE (computed just above). Both `git diff` and
# the classifier are read-only / pure stdin, so no dangerouslyDisableSandbox.
api_call_site=$(git diff "$MERGE_BASE"...HEAD \
  | .claude/skills/dispatch-propagate/scripts/dispatch-api-call-site \
  | sed -n 's/^api_call_site=//p')
```

- `surface` is `empty` (no changed files), `docs` (every changed path is
  documentation — markdown/text/license, no executable, config, dependency, or
  rules surface), `tests` (every changed path is a test file — no production
  source, config, dependency, or rules surface), or `code` (anything else).
- `deps` is `true` when the diff touches `package.json` / `package-lock.json`.
- `app_or_rules` is `true` when the diff touches application source
  (`.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs`/`.go` outside `.claude/`) or a
  Firestore / Storage rules file.
- `api_call_site` is `true` when the diff **adds** a line containing an API or
  query call site (`fetch`/`axios`/`getDocs`/`getDoc`/`query`/`collection`/…).
  It is computed from diff CONTENT, deliberately decoupled from
  `app_or_rules` — relaxing `app_or_rules` would also widen the `auth` and
  `data-exposure` domain-sweep sections, silently expanding security review
  scope to every code diff.

Set `security_note` for the Workflow `args`:
- `surface=docs`: `Security review: no attack surface — docs-only diff (no executable, config, dependency, or Firestore-rules changes).`
- `surface=tests`: `Security review: no attack surface — test-only diff (every changed path is a test file).`
- `surface=empty`: `Security review: no attack surface — diff is empty (no changed files detected).`
- `surface=code`: omit `security_note` (leave it unset).

**Then run the surface-conditional inline scans and finder agents:**

- **Dependency audit** — inline in this parent thread when `deps=true`.
- **CodeQL alerts** — inline when `surface=code`.
- **Erosion metrics** — inline when `surface=code`.
- **Finder agents** — the Workflow fans out surface / `app_or_rules` /
  `api_call_site`-gated finders when `surface=code` (the always-on
  `code-review` quality finder runs on every surface).

Collect normalized CodeQL, npm, and erosion findings into `prescanned_findings`
to pass to the Workflow. **See `references/inline-scans.md`** for the exact
command block, normalization rules, and the per-finder roster and descriptions.

### 1b. Run the built-in `/code-review` as an exclusive pre-stage

`dispatch-code-review` shells `claude -p '/code-review <effort> --fix
[--comment]'` — the `-p` user-turn entry point is the only way to invoke a
skill marked `disable-model-invocation`, which the built-in `/code-review`
carries (see `references/code-review-invocation.md` for the full measured
contract). Because `--fix` **writes the working tree**, this stage must run
to completion before any owned lens fans out — **never inside** the Step 2
Workflow's parallel finder fan-out, which would race concurrent writers
against the same tree. This is why it is its own serialized step between
Step 1 and Step 2, not a finder inside the Workflow.

`MERGE_BASE` is already bound by Step 1 above — reuse it; do not recompute or
hand-roll a second target formatter. Pass it as the **rev-range**
`"$MERGE_BASE..HEAD"`, never as the bare `"$MERGE_BASE"` SHA. The built-in
resolves a bare SHA to *that single commit's* diff, not to the diff from that
commit to `HEAD`: measured live, `claude -p '/code-review low <bare-sha>'`
reviewed only the one commit at that SHA (a 1-file graph phase-bump), while
`claude -p '/code-review low <sha>..HEAD'` reviewed the PR's full accumulated
diff (9 non-test files, 3 findings). A bare SHA therefore reviews the
phase-transition commit that *started* the review phase and returns
`status=ok` with vacuous findings — the exact silently-reviews-nothing defect
this stage exists to eliminate. `dispatch-code-review` now rejects a
non-range `--target` with exit 2, so this is enforced, not just documented.

Do **not** pass `--effort` to `dispatch-code-review` here — leave it at the
script's own default (`low`). This is deliberate, not an oversight: Unit 1's
measured investigation (`references/code-review-invocation.md` §1.2, §5.4, §7)
found that `max` effort against a real, non-trivial diff ran over 39 minutes
without completing — `claude -p` buffers all output until the run completes,
so the timeout was a total loss of ~$372 of price-proxy spend for zero bytes
of output — and that `medium` effort did not complete within 300s either.
Only `low` effort is measured to reliably complete (14-30s observed). Raising
the effort level for this lane is an open follow-up for
`strategy-token-economy`, not settled by this node.

Run this call with `dangerouslyDisableSandbox: true` and `timeout: 600000`
(it is a nested `claude` session — `--comment` shells `gh` and it touches the
local Claude daemon; see `.claude/rules/sandbox.md`):

```bash
CR_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-code-review \
  --target "$MERGE_BASE..HEAD" --out-dir "tmp/code-review-$N" 2>"tmp/code-review-$N.err")
CR_RC=$?
```

**Hard stop on any non-zero `CR_RC`**, following the same stdout/stderr-split,
case-on-exit-code idiom this file already uses for the front door
(`DERIVE_OUT`/`DERIVE_ERR`, preamble above) and for `commit-merge-push`
(Step 3):

```bash
CR_ERR="tmp/code-review-$N.err"
CR_LOG="tmp/code-review-$N/output.txt"
case $CR_RC in
  0) ;;
  1) echo "/review-fix: 'claude -p /code-review' exited non-zero (see $CR_ERR, $CR_LOG)" >&2; exit 1 ;;
  2) echo "/review-fix: dispatch-code-review argument/empty-output error (see $CR_ERR)" >&2; exit 1 ;;
  3) echo "/review-fix: /code-review is unavailable — rejection signature in output (see $CR_ERR, $CR_LOG)" >&2; exit 1 ;;
  4) echo "/review-fix: 'claude -p /code-review' timed out (see $CR_ERR, $CR_LOG)" >&2; exit 1 ;;
  *) echo "/review-fix: dispatch-code-review exited unexpectedly ($CR_RC) — script missing, non-executable, sandbox-denied, signalled, or aborted under 'set -euo pipefail' (see $CR_ERR)" >&2; exit 1 ;;
esac
```

The `*)` catch-all is **load-bearing, not defensive padding**. The script's
documented exit codes are 0/1/2/3/4, but a stale worktree checked out before
this node landed yields 127 (missing script), a lost `+x` bit or a sandbox
denial yields 126, a signal yields 128+n (130 on SIGINT), and a `set -euo
pipefail` abort inside the script (e.g. `mkdir -p` on an unwritable
`--out-dir`) yields whatever the failing builtin returned. Every one of those
leaves `CR_OUT` **empty**. Without the catch-all they fall through the `case`
untouched, Step 2 builds `code_review` from empty parses, and the Workflow's
hard contract check passes on a review that never ran — reinstating the exact
silent substitution this node exists to eliminate. Never delete this branch,
and never replace it with a warning that continues.

The failure messages deliberately name the artifact **paths** rather than
`cat`-ing them. The captured text is a code review of the pending diff and
routinely quotes the reviewed lines verbatim — including anything the roster's
`secrets` finder exists to catch. Keep it on disk; see the redaction rule
below before any of it reaches a durable record.

**A failure here fails the phase.** This pass never degrades to an
agent-performed review, never retries with a substitute, and never reports
substituted output under the built-in's name — that is the exact four-day
silent-substitution defect this node's Context section documents and exists
to fix. Exit 3 in particular means the instrument itself is unavailable.

**Redaction rule for the office-hours park reason.** Never copy the nested
session's captured output verbatim into the park reason. On the node lane the
reason is written to `$CLAUDE_JOB_DIR/office-hours-reason`, persisted by
`park-node` into the graph node file, and pushed to `origin/main` in this
**public** repository — permanently, in git history. The captured text is a
review *of the pending diff* and routinely quotes the reviewed lines; a diff
that carries a credential (the reason the finder roster has a dedicated
`secrets` lens) would publish that credential on any exit-1/3/4 path.

The reason must instead carry, in this order:

1. The exit code and what it means (`3` = instrument unavailable, `4` =
   timeout, `1` = nested session exited non-zero, `2` = argument/empty output,
   anything else = unexpected exit — see the catch-all above).
2. The `--target` passed above and the effort level (`low`).
3. The on-disk paths of the full, unredacted evidence — `tmp/code-review-$N.err`
   and `tmp/code-review-$N/output.txt` — so the human reviewer can read it in
   the worktree, where it never leaves the machine.
4. A **bounded, redacted excerpt** — at most a few lines, enough to identify
   the failure mode. Apply the same redaction discipline
   `dispatch-diagnose-main` applies to its "redacted likely-cause summary"
   (`.claude/skills/dispatch-diagnose-main/SKILL.md`, "Redaction rule"): quote
   only the error category and the matched rejection signature, never raw diff
   lines, environment-variable values, or any string that looks like a token,
   credential, or key — even one that appears already masked. Also neutralize
   any `close`/`fix`/`resolve` keyword adjacent to a `#N`, per
   `.claude/rules/issue-references.md`, before the text reaches the node file.

Fidelity is preserved by the paths in (3), not by pasting the payload into a
pushed record.

Parse the summary with the same `sed -n 's/^key=//p'` idiom Step 1 uses for
`SURFACE_OUT`:

```bash
CR_STATUS=$(printf '%s\n' "$CR_OUT" | sed -n 's/^status=//p')
CR_FINDINGS=$(printf '%s\n' "$CR_OUT" | sed -n 's/^findings_path=//p')
CR_PATCH=$(printf '%s\n' "$CR_OUT" | sed -n 's/^patch_path=//p')
CR_TOUCHED=$(printf '%s\n' "$CR_OUT" | sed -n 's/^touched_file=//p')
```

`CR_FINDINGS` and `CR_PATCH` are each a single absolute path (one
`findings_path=` line, one `patch_path=` line). `CR_TOUCHED` collects
potentially multiple `touched_file=` lines — one per file the built-in's
`--fix` actually touched, derived by `dispatch-code-review` from a
before/after `git diff`, never from the review's own self-report of what it
fixed.

**Then gate on what the script actually emitted, not on `CR_RC` alone.** The
exit-code `case` above cannot see a truncated or empty `CR_OUT` — a killed
pipeline, a redirect that lost stdout, or any of the undocumented exits the
`*)` branch now catches leaves the parses empty while `CR_RC` may still be
absent or zero. `dispatch-code-review` emits `status=ok` as the **first** line
of its summary and only ever on the success path (Step 7 of the script), so
that line, plus a non-empty `findings_path=` and `patch_path=`, is the
evidence that the built-in ran:

```bash
if [ "$CR_STATUS" != ok ] || [ -z "$CR_FINDINGS" ] || [ -z "$CR_PATCH" ]; then
  echo "/review-fix: dispatch-code-review summary is incomplete (status='$CR_STATUS' findings='$CR_FINDINGS' patch='$CR_PATCH') — the built-in /code-review did not verifiably run (see $CR_ERR)" >&2
  exit 1
fi
```

`$CR_STATUS` — never the literal string `ok` — is what Step 2 puts in
`args.code_review.status`. Hardcoding the literal would make the Workflow's
hard contract check (`review-fix.js`: `_a.code_review.status !== 'ok'`) a
tautology that passes on a review that never ran.

Do **not** recompute `surface` or `changed_files` after this pre-stage. The
built-in's `--fix` edits are uncommitted working-tree changes to files
already in the diff, and the Lane-B finder prompt tells each finder to diff
against `merge_base` — a `git diff <merge_base>` run by a Workflow subagent
already includes these working-tree edits. This is deliberate; a later reader
should not "fix" it by adding a recompute step.

### 2. Build `args` and invoke the Workflow

Collect the fields for the Workflow invocation. Parse `Closes #N` from the pack's
`=== PR ===` body to resolve `implementing_issues`. Workflow scripts cannot call
`new Date()` / `Date.now()` themselves (the runtime throws — it would break
resume), so capture the instrument-verification lower-bound timestamp here in
bash, immediately before invoking the Workflow, and pass it through as
`run_started_at`:

```bash
RUN_STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
```

```
args = {
  pr_num:              <PR_NUM>,
  merge_base:          <MERGE_BASE>,
  changed_files:       [ ...the changed-file list from the pack's === DIFF section (same list dispatch-changed-files extracts)... ],
  surface:             "empty" | "docs" | "tests" | "code",
  deps:                <true|false>,
  app_or_rules:        <true|false>,
  api_call_site:       <true|false>,    // from `api_call_site` above; decoupled from app_or_rules
  prescanned_findings: [ ...normalized CodeQL + npm + erosion findings in Per-finding schema... ],
  implementing_issues: [ <N>, ... ],    // parsed from Closes #N lines; [] if none
  run_started_at:      <RUN_STARTED_AT>, // ISO8601 lower bound for the instrument-invocation transcript verifier
  security_note:       <string or omit>, // set for empty/docs/tests; omit for code
  prior_phase_log:     <string or omit>, // PRIOR_PHASE_LOG from the preamble; omit when phase-log: none
  code_review: {
    status:         <CR_STATUS>,          // the parsed `status=` line — NEVER a hardcoded "ok"
    findings_path:  <CR_FINDINGS>,        // absolute path; the Workflow's reader subagent reads it
    patch_path:     <CR_PATCH>,           // absolute path to the before/after patch
    touched_files:  [ <CR_TOUCHED lines> ] // git-derived; the AUTHORITATIVE fixed[] constraint
  }
}
```

When `PRIOR_PHASE_LOG` is non-empty, pass it as `prior_phase_log` so the review
finders see what an earlier phase (e.g. qa-fix) already tried; omit the field
when the preamble read the `phase-log: none` sentinel.

`code_review` carries **paths, not findings** — Step 1b's raw review text at
`CR_FINDINGS` is never read into this skill's own context; only the path
crosses into `args`, preserving the property this file already asserts below
("The skill's context never holds raw findings — only this compact summary,"
Step 2's Workflow-invocation prose). The current Workflow (`review-fix.js`)
does not read this field yet — it is additive here, consumed once the
Workflow is rewired.

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
  instrument_failures:  [ {instrument, reason} ],
  coverage_incomplete:  <bool>,
  coverage_note?:       <string>,
  security_note?:       <string>
}
```

`coverage_incomplete` / `coverage_note` are the generic degraded-coverage
signal, covering three causes: (1) the security probe wave skipped because
both quality finders died, (2) an unverified instrument, and (3) Lane-A
residue left undispositioned because the residue-disposition agent died;
when more than one co-occurs in the same run, `coverage_note` is a
space-joined composition of the causes.

The Workflow's fix-authoring agents (non-isolated, Opus) have already edited the
working tree by the time `result` is returned — this includes THREE sources
of edits merged into the one envelope above: the shared Lane-B Opus fix fan-out,
Lane-A code-review's own Step 1b `claude -p '/code-review low --fix'`
pre-stage edits (already applied and committed-to-diff before this Workflow
call even starts — see Step 1b), and the residue phase's applied
resolve-dispositioned fixes. The skill's context never holds raw
findings — only this compact summary. **See
`references/schema-edge-cases-notes.md`** for the full model split across
finder/fix/classify stages (#1172, #2872, tactic-review-phase-trust-builtin-review).

### 3. Commit the Workflow's working-tree edits via one commit-merge-push

The Workflow returning (Step 2), `/commit-merge-push` (Step 3), `/file-issue`
(Step 5), and `dispatch-complete-phase` applying `dispatch:reviewed` (Step 7)
returning, are mid-tail — not the end of the turn. Continue
through Steps 3–7; the pass ends only after `dispatch:reviewed` is applied and the
Step 7 marker is written (this skill's terminal action — see the preamble and Step
7). Do not emit a closing summary; the next message is the next tool call.

Call the script first (use `dangerouslyDisableSandbox: true` — git writes +
`git push` over HTTPS; see `.claude/rules/sandbox.md`). Compute the changed files:

```bash
git status --porcelain
```

- **If empty** → call `commit-merge-push --merge-only`. Even with no code changes
  this still pushes `origin HEAD`, carrying any pending local merge left by
  `dispatch-merge-main` / `/dispatch-conflict` to origin (the no-op-push contract this
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

Every finding from every source appears exactly once in one of eight buckets. The
Workflow's classifier preserves **both** vocabularies: the security pass's
`required` / `out-of-scope` / `false-positive` axis and the code-review
`Fixed` / `Informational` / `Dismissed` / `Deferred` axis. For `code-review` and
`security-review` (Lane A) sources, the buckets are populated by their own outcome
and the residue phase's disposition — this pipeline's classify/verify/fix stages
run only over Lane-B sources. `Source "cost"` findings are ADVISORY and always
route to `Deferred` (never `Fixed`, `Required`, or verify-eligible). A finding is
**never** Dismissed purely because the change is small.

**See `references/disposition-table.md`** for the full bucket table, the Lane-A
population rules, the smallness rule, and the cost-advisory disposition.

### 5. File meaningful out-of-scope findings as blocked_by follow-ups

Two follow-up paths, both filing `blocked_by` tracking issues so meaningful
out-of-scope findings do not evaporate when the PR merges. The Workflow has
prepared filing structures in `result.deferred_filings` and
`result.security_followup_input`; this skill executes the actual `gh` calls.
Skip a path when its bucket is empty.

- **`TARGET_KIND=issue` (legacy lane)** — run 5a (deferred code-review findings →
  `/file-issue` with a blocked-by link) and 5b (meaningful out-of-scope CodeQL /
  npm findings → `dispatch-security-followup` → `/file-issue`). Before the 5a/5b
  fan-out, ensure the static `dispatch:review-followup` label exists once in this
  main thread. Every follow-up gets a `<!-- dispatch:source-pr <PR_NUM> -->` body
  marker and that static label.
- **`TARGET_KIND=node`** — supersedes 5a/5b entirely: file **no gh issue**; write
  the prepared structures as **draft tactic nodes** (`status: raw`, no `phase`,
  `serves` this tactic's strategy) via one `write-node.ts` build + body-edit +
  `graph-commit`.

Track how many follow-ups were ACTUALLY filed this run (count only NEW records)
for the Step 7 `--followups-filed` total — do not use `result.followups_deferred`.

**See `references/followup-filing.md`** for the full node-lane draft-node
procedure, the static-label guarantee block, the follow-ups-filed counting rule,
and the complete 5a/5b subagent recipes. Then continue to Step 6.

### 6. Post exactly one PR comment — composed incrementally

Reuse the `PR_NUM` captured in the preamble — do not re-resolve. There is exactly
**one** comment covering **every** finding from `result.dispositions` and its
bucket — but **compose it incrementally**, not only at phase end, so a dead
session leaves the resolved-so-far dispositions already on the PR (condition 9:
phase progress whose only home is the session is a defect). Give the comment a
first-line marker `<!-- dispatch:review-fix -->`; create it via `post-pr-comment.sh`
as soon as the first disposition resolves, edit it in place as each subsequent
disposition resolves, and finalize it at phase end with the complete bucket set. A
resumed run re-finds the same comment by its marker (`dispatch_marker_comment_id`,
`lib.sh`) rather than posting a duplicate.

**See `references/pr-comment.md`** for the incremental-compose bullets, the
per-bucket body organization, the partial-coverage line, and the create/edit
flush commands.

### 7. Apply the terminal label, then write the marker (or park on deviation)

The terminal actions run in this order (the mechanical bookend of the phase):

1. **Flush any unpushed local commits** — `git fetch origin "$BRANCH"`; if
   `git rev-list --count "origin/$BRANCH..HEAD"` is non-zero, `git push origin
   HEAD`. This is the chain's last push point; it runs **unconditionally** and
   sandboxed (origin is HTTPS to an allowlisted host — no
   `dangerouslyDisableSandbox`). Without it the PR stays `CONFLICTING` and the
   router can never promote it.
2. **Write the handoff note (phase-log)** — only when the Workflow ran this
   session; it must PRECEDE the `dispatch:reviewed` apply. On re-entry call the
   writer with `--reentry true </dev/null` (preserves the prior entry verbatim).
3. **Apply `dispatch:reviewed`** via `dispatch-complete-phase "$PR_NUM" review`
   (use `dangerouslyDisableSandbox: true`). This skill owns the label; it is
   applied regardless of whether any fixes were made. This skill does **not**
   ready the PR — the router's `dispatch-reconcile-ready` owns promotion.
4. **Write the phase-completed marker, or park on deviation.** Deviation fires
   when `result.deviation === true` (a high-confidence Required+Upheld finding
   left unresolved): skip the marker, run the in-session recommend step, and call
   `dispatch-mark-deviation`. No deviation: call `dispatch-mark-complete`.
5. **Emit the outcome envelope** (`dispatch-emit-outcome`, sandboxed) — only when
   the Workflow ran this session; skip on re-entry.
6. **`dispatch-finalize-phase <N> --pr "$PR_NUM"`** as the ABSOLUTE LAST action
   (no-deviation success path only) — it self-closes the session, so all prior
   steps must complete first.

**See `references/terminal-actions.md`** for the full commands, exact flags,
sandbox notes, re-entry gating, and the rationale behind each terminal action.

## Per-finding schema, edge cases, and notes

The per-finding field schema, the edge-case handling (empty/docs/test diffs,
finder failures, scan-tool failures), and the background rationale (the #1172 /
#2872 model split, the #1857 probe-wave throttle short-circuit) are reference
material the orchestrator does not need in-context up front. **See
`references/schema-edge-cases-notes.md`.**
