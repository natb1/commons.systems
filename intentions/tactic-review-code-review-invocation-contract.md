---
id: tactic-review-code-review-invocation-contract
kind: tactic
statement: Make the /code-review invocation actually run — replace the rejected
  Skill-tool call with the claude -p user-turn entry point, restore --fix, adopt
  --comment, and parse findings from text
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-31 review-fix token audit interview and
  corrected by its 2026-07-31 follow-up investigation, which supersedes this
  node's original direction to drop --fix. Measured: all 18 invocations of
  Skill(code-review, 'max --fix') were rejected with disable-model-invocation,
  so the built-in never ran and the finder hand-rolled a review in its place.
  See clarifications 22 and 24 on strategy-token-economy."
reading: null
gap: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 55
  override: null
  rationale: "Author-directed 2026-07-31: top-of-band boost so the /code-review
    invocation fix is picked immediately after
    tactic-lane-instrument-substitution-guard (56). The built-in has never run
    in dispatch — all 18 Skill(code-review, 'max --fix') calls across
    07-27..07-31 were rejected with disable-model-invocation and the finder
    hand-rolled a review reported as the built-in's, so every review-phase
    quality claim since 07-27 rests on an agent reviewing itself. Ranked one
    below the generic guard by this node's own stated ordering, and without a
    blocked_by edge so a guard stall cannot deadlock it. Top-of-band, not
    maximum: trunk-health work still outranks it (strategy-main-health = 101).
    Part of the interim 50/20/10 scale's inventory — convert to a tier/bug_fix
    mark when tactic-attention-tier-ranking and tactic-attention-boost-scripts
    retire the interim scale; do not orphan this boost."
  tier: 1
phase: done
execution:
  branch: tactic-review-code-review-invocation-contract
  pr: 3007
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-03T03:00:25Z
    mergeCommitSha: 7c7728296e47420017e4e9949dffc26fba7d3e62
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

# Make the /code-review invocation actually run — replace the rejected Skill-tool call with the claude -p user-turn entry point, restore --fix, adopt --comment, and parse findings from text

## Context

The dispatch `review` phase claims to run the built-in `/code-review`. It never has.

`/code-review` ships inside the Claude Code CLI bundle and its frontmatter carries
`disable-model-invocation: true`, which blocks the `Skill` tool for any model-driven
agent. Across 18 review-fix runs (2026-07-27 → 07-31, CLI 2.1.220 throughout), 19 of
20 code-review finder transcripts issued `Skill(skill: "code-review", args: "max --fix")`
and **every one was rejected**:

```
<tool_use_error>Skill code-review cannot be used with Skill tool due to
disable-model-invocation</tool_use_error>
```

40 rejection events in the corpus. The finder then wrote *"The built-in `/code-review`
skill is not model-invocable in this environment. I'll perform the review directly at
max effort"* and ran ~39 tool calls of its own review. The workflow reported that output
under the built-in's name. Undetected for four days; a strategy divergence was recorded
on the strength of it. `/security-review` is unaffected (no `disable-model-invocation`
mark; 17 of 18 invocations succeeded).

The vendor-documented contract (`https://code.claude.com/docs/en/code-review`):

- Syntax: `/code-review [low|medium|high|xhigh|max|ultra] [--fix] [--comment] [<target>]`
- `--fix` applies findings to the working tree after the review; `--comment` posts
  findings as inline PR comments.
- Since v2.1.218 the review runs as a background subagent with its own context window;
  its `--fix` edits land outside session checkpoints.
- **Scripted entry point, given explicitly by the docs: `claude -p '/code-review ultra'`.**
  A `-p` run is a *user turn*, which is why it can invoke a `disable-model-invocation`
  skill where a subagent cannot.
- In a `-p` run findings return **as text**, never through `ReportFindings`. The
  per-finding `outcome` values (`fixed` / `skipped` / `no_change_needed`) that the
  current finder prompt maps populate only when findings are re-reported after being
  fixed later in the same session — which this lane never does.

Independent corroboration outside the transcripts: the installed CLI binary
(`claude --version` = 2.1.220) contains the literal strings `disable-model-invocation`,
the `ReportFindings` tool description, and user-facing retry text
`Tell the user to retry /code-review ultra, or use /review for a local review instead`.

Intended outcome: the built-in actually runs, its invocation success is established
mechanically rather than narrated, its applied fixes are derived from a before/after
`git diff` rather than any agent's self-report, and it runs as an **exclusive stage
before** the owned lenses (it writes the working tree, so it must not run concurrently
with the parallel finder fan-out).

**Live state confirmed in the working tree at plan time** (all line numbers below are
against current `origin/main`):

- `.claude/workflows/review-fix.js:452-478` — `finderPrompt`'s `code-review` branch,
  line 454 says *"Invoke the built-in `/code-review` skill via the Skill tool with the
  `max` effort argument AND the `--fix` flag"*, lines 456-470 map the dead
  `fixed`/`skipped`/`no_change_needed` outcomes.
- `.claude/workflows/review-fix.js:540-600` — `phase('finders')`; `agentFinderSet`
  emits `code-review` first, it is filtered into `qualityFinders` (line 550) and
  launched as wave 1 / throttle probe. It is **inside** the parallel fan-out today,
  not serialized before it.
- `.claude/workflows/review-fix.js:621-648` — `codeReviewResult` / `laneAFixed` /
  `laneAResidue` capture.
- No `claude -p` invocation exists anywhere in this repo (repo-wide grep returned
  nothing). This is a genuinely new invocation shape for the codebase — hence Unit 1
  is gating.

### Design: greenfield

The `/review-fix` Workflow (`.claude/workflows/review-fix.js`) is a pure-JS sandbox —
its own header states *"No filesystem, no gh, no git, no node:*"*. It therefore
**cannot** shell `claude -p` itself. The invocation must live in the bash the SKILL
owns, as a serialized stage before the Workflow call. That placement is not a
compromise — it is what makes the "exclusive stage before the owned lenses"
requirement structural rather than a fan-out ordering convention:

```
SKILL Step 1   capture diff context / MERGE_BASE / surface     (unchanged)
SKILL Step 1b  dispatch-code-review  ← NEW exclusive stage, hard-stops on failure
SKILL Step 2   Workflow(review-fix.js)  ← owned lenses fan out here, after 1b returns
```

The invocation, its success verification, and its before/after diff capture go in one
new testable script, `dispatch-code-review`. It writes the raw findings **text** to a
file and prints only a compact machine-readable summary on stdout, so the skill's
context still never holds raw findings (a standing property of this skill — see
SKILL.md:307-309). The Workflow receives the *path* plus the mechanically-derived
touched-file list, and one cheap Sonnet subagent (which does have `Read`) turns the
text into the existing `{ fixed, residue }` envelope, with `fixed[]` constrained by the
git-derived file list rather than by anything the review claimed.

No brownfield migration path is needed beyond unit ordering: the four units below are
each individually landable and green (Unit 3 is additive — the current Workflow ignores
an unknown `args` field — and Unit 4 consumes what Unit 3 emits).

---

## Unit 1 — Verify the entry point (GATING; nothing else may land until this passes)

### Scope

Investigation + one new documentation file. **No behavior change.**

Create `.claude/skills/review-fix/references/code-review-invocation.md` recording, as
measured facts with the commands that produced them:

1. That `claude -p '/code-review max'` runs to completion inside a real dispatch
   worktree and returns findings as text. Record the exact command line, exit status,
   wall-clock duration, and the first ~20 lines of output shape (headings, per-finding
   format) — the structuring prompt in Unit 4 depends on that shape.
2. **Permission mode.** A `-p` run must be able to write files (`--fix`) and shell `gh`
   (`--comment`). Determine and record which flag combination is required —
   `--permission-mode acceptEdits`, `--permission-mode auto`, or none. Cross-reference:
   `dispatch-spawn-job` passes `--permission-mode auto` on its `claude --bg` spawns
   (`.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:294`).
3. **Sandbox.** Record whether the Bash call needs `dangerouslyDisableSandbox: true`.
   Prior expectation from `.claude/rules/sandbox.md` (`## gh CLI`, `## claude agents
   --json`, `## Network namespace isolation`): yes — `--comment` shells `gh`, and a
   nested session touches the local Claude daemon and the network beyond the allowlist.
   Confirm rather than assume, and record whether the **auto-mode permission classifier
   in a headless worker** actually permits a `dangerouslyDisableSandbox: true` Bash call
   to a repo script. (Known hazard: the classifier denies calls framed as sandbox
   bypasses.) If the classifier denies it, that is a Unit 1 failure — park.
4. **`--fix` + `--comment` together.** Confirm both flags in one invocation is accepted
   and that `--comment` resolves the PR from the branch without an explicit PR argument
   (or record the argument it needs).
5. **Cost and attribution.** The nested `-p` run is a *separate session*. Record its
   token cost and how `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`
   attributes its turns — specifically whether they land in the literal `"<none>"`
   bucket (`aggregate-usage.sh:298`, second producing branch at `:814`). This is the
   direct input to `strategy-token-economy` condition 2 (attributability) and
   clarification 23 (75% of review-worker turns currently untagged, the largest single
   line item). Record the reading; do not attempt to fix attribution in this node.
6. **Session-registry interference.** Confirm the nested session does **not** make the
   worktree look occupied to `claude agents --json` / `worktree_has_live_session`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`) for the duration —
   a false "occupied" reading would block subsequent worker spawns into that worktree.
   Run the check with `dangerouslyDisableSandbox: true` (a sandboxed
   `claude agents --json` silently returns `[]`).
7. **Duration.** Record the observed wall-clock for a `max`-effort run. The Bash tool
   caps at 600 000 ms, so this determines the timeout Unit 2 hardcodes.
8. **Exact unavailability strings.** Record verbatim any error text the CLI emits when
   the command is unavailable or refuses (induce it by invoking a bogus command name,
   e.g. `claude -p '/code-review-nope max'`). Unit 2 turns these into reject patterns.

**Out of scope for this unit:** any edit to `review-fix.js`, `SKILL.md`, or any script.

### Failure handling — this is a hard gate

If `claude -p '/code-review max'` does not work, or the classifier denies the call, or
`--fix` cannot write: **stop. Do not land Units 2-4. Do not fall back to an
agent-performed review** — that is the exact defect
`tactic-lane-instrument-substitution-guard` exists to prevent. Escalate to office-hours
carrying the verbatim captured output as the recorded reason.

### Recommended model

opus

---

## Unit 2 — `dispatch-code-review`: the verified invocation primitive

### Scope

Two new files, no wiring (nothing calls the script yet, so this unit lands green on its
own):

- `.claude/skills/dispatch-propagate/scripts/dispatch-code-review` (new, executable,
  `#!/usr/bin/env bash`, `set -euo pipefail`)
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh` (new,
  executable)

`run-unit-tests.sh` auto-discovers every `test-*.sh` in that directory and auto-selects
the `--pr-scripts` bucket whenever a file under
`.claude/skills/dispatch-propagate/scripts/*` changes
(`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,185-200`), so no
runner wiring is needed.

#### Script CLI

```
dispatch-code-review --target <rev-range> --out-dir <dir> [--effort max] [--no-comment]
```

- `--target` — the diff target passed through to `/code-review` (the SKILL passes
  `$MERGE_BASE`).
- `--out-dir` — directory for the durable artifacts; created if absent.
- `--effort` — default `max`.
- `--no-comment` — omit `--comment` (used by the test suite; the SKILL never passes it).

#### Behavior, in order

1. **Resolve the CLI.** `CLAUDE_CMD="${DISPATCH_CODE_REVIEW_CLAUDE_CMD:-claude}"` —
   mirrors `dispatch-spawn-job:221` (`DISPATCH_SPAWN_JOB_CLAUDE_CMD`) so the test suite
   can stub it.

2. **Idempotent resume.** If `$OUT_DIR/summary.txt` exists and contains `status=ok`,
   re-print it and exit 0 **without re-invoking**. The nested session is expensive and
   review-fix's Steps preamble (SKILL.md:191-198) already mandates resume-from-durable-
   state; re-running a completed review on a resumed pass would double the cost and
   re-post duplicate `--comment` comments.

3. **Capture the before-image.**
   ```bash
   BEFORE=$(git stash create)
   [[ -z "$BEFORE" ]] && BEFORE=$(git rev-parse HEAD)
   ```
   `git stash create` writes a commit object capturing the worktree + index **without
   touching either**, and prints nothing on a clean tree. This is the mechanical ground
   truth for "what the built-in changed", per `strategy-token-economy` clarification 25
   — not any agent's report. (`.git` is sandbox-writable per `.claude/rules/sandbox.md`,
   so the object write is fine.) Also snapshot untracked paths:
   `git status --porcelain --untracked-files=all | awk '$1=="??"{print $2}'`, since
   `stash create` does not capture them.

4. **Invoke**, capturing stdout+stderr combined, wrapped in a hard timeout so the call
   fails cleanly inside the Bash tool's 600 000 ms budget rather than being killed by
   the harness:
   ```bash
   set +e
   timeout "${DISPATCH_CODE_REVIEW_TIMEOUT:-540}"s \
     "$CLAUDE_CMD" -p "$PROMPT" $PERM_FLAGS >"$OUT_DIR/output.txt" 2>&1
   rc=$?
   set -e
   ```
   where `PROMPT` is `/code-review <effort> --fix [--comment] <target>` and `PERM_FLAGS`
   is whatever Unit 1 determined (default `--permission-mode acceptEdits`). Do **not**
   build the prompt by string-splicing unvalidated input — validate `--target` against
   `^[A-Za-z0-9._/@^~-]+$` and reject otherwise (exit 2), so the target cannot inject
   additional arguments.

5. **Verify at the source** — exit status *plus* output signature, the pattern
   `commit-merge-push`'s `do_push()` uses
   (`.claude/skills/dispatch-propagate/scripts/commit-merge-push:200-213`: capture
   combined output, grep for a known failure signature, decide the exit code):
   - `rc == 124` (timeout) → exit **4**
   - `rc != 0` → exit **1**
   - output empty after whitespace strip → exit **2**
   - output matches any reject pattern → exit **3**. Patterns, as a bash array so the
     set is one greppable list:
     - `cannot be used with Skill tool due to disable-model-invocation`
     - `use /review for a local review instead`
     - `Unknown slash command`
     - plus every verbatim string Unit 1 recorded in its point 8.

   On any non-zero exit, write a one-line diagnostic naming the exit reason **and** the
   captured output to stderr; print nothing to stdout. This makes a rejected or absent
   instrument loud, per the substitution invariant.

6. **Derive the applied edits mechanically.**
   ```bash
   git diff --name-only "$BEFORE" > "$OUT_DIR/touched-files.txt"
   git diff "$BEFORE" > "$OUT_DIR/fix.patch"
   ```
   Union in any newly-untracked path that was not in the pre-image snapshot.

7. **Emit the compact summary** to stdout and to `$OUT_DIR/summary.txt` (one `key=value`
   per line, `sed -n 's/^key=//p'`-parseable, matching the house style of
   `dispatch-security-surface`). **Findings text never reaches stdout** — only its path:
   ```
   status=ok
   exit_code=0
   findings_path=<absolute path>/output.txt
   patch_path=<absolute path>/fix.patch
   touched_files_count=2
   touched_file=path/a.ts
   touched_file=path/b.ts
   ```
   Paths are absolute (`cd "$OUT_DIR" && pwd`) — a Workflow subagent's cwd drifts from
   the session's, so a relative path would not resolve for the Unit 4 reader.

#### Exit-code table (document it in the script header)

| code | meaning |
|---|---|
| 0 | invoked, verified, summary on stdout |
| 1 | `claude -p` exited non-zero |
| 2 | invalid arguments, or empty output |
| 3 | output carries a rejection / unavailability signature |
| 4 | timed out |

#### Test coverage (`test-dispatch-code-review.sh`)

Source `dispatch-test-fixture.sh` (`assert_eq` / `report_results` / setup-teardown) the
way `test-dispatch-changed-files.sh:6-8` does. Build a fake `claude` per case, exported
via `DISPATCH_CODE_REVIEW_CLAUDE_CMD`, in a throwaway git repo:

1. **Happy path with edits** — fake writes to a tracked file and prints findings text →
   exit 0, `status=ok`, `touched_files_count=1`, the edited path present, `output.txt`
   holds the text, `fix.patch` non-empty.
2. **Happy path, no edits** — fake prints findings, touches nothing → exit 0,
   `touched_files_count=0`, `fix.patch` empty.
3. **Non-zero exit** → exit 1; stderr carries the fake's output.
4. **Empty output, exit 0** → exit 2.
5. **Rejection string, exit 0** — fake prints
   `Skill code-review cannot be used with Skill tool due to disable-model-invocation`
   → exit 3. *This is the regression test for the four-day silent substitution.*
6. **`Unknown slash command`, exit 0** → exit 3.
7. **Idempotent resume** — run twice against the same `--out-dir`; the fake appends to a
   call-counter file; assert the counter is `1` after the second run and the summary is
   byte-identical.
8. **Argument injection** — `--target 'HEAD; rm -rf /'` → exit 2, and the fake records
   zero invocations.
9. **Timeout** — fake sleeps past `DISPATCH_CODE_REVIEW_TIMEOUT=1` → exit 4.

Never `echo` a captured JSON/text variable into another parser — use here-strings
(`.claude/rules/shell-json.md`; mechanically linted for net-new `.sh` lines by
`lint-prose-rules.sh`).

**Out of scope:** any edit to `review-fix.js` or `SKILL.md`.

### Recommended model

sonnet

### Dependencies

Unit 1.

---

## Unit 3 — Wire the exclusive pre-stage into `/review-fix` (additive)

### Scope

`.claude/skills/review-fix/SKILL.md` only. Additive: the new `code_review` field in
`args` is ignored by the current Workflow, so this unit lands green before Unit 4.

1. **New Step 1b**, inserted between Step 1 (ends at SKILL.md:260) and Step 2 (begins at
   SKILL.md:261), titled *"Run the built-in `/code-review` as an exclusive stage"*. It
   must state, in prose, why it is its own serialized step: the built-in **writes the
   working tree**, so it runs to completion before any owned lens fans out — never
   inside the parallel finder fan-out. Body:

   ```bash
   CR_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-code-review \
     --target "$MERGE_BASE" --out-dir "tmp/code-review-$N" 2>"tmp/code-review-$N.err")
   CR_RC=$?
   ```

   Run this call with `dangerouslyDisableSandbox: true` and `timeout: 600000` (nested
   `claude` session; `--comment` shells `gh`; see `.claude/rules/sandbox.md`).

   `MERGE_BASE` is already bound by Step 1 (SKILL.md:220-226) and is the same value
   `diffContext(args)` uses as the Workflow-side diff base — one target formatter, not
   two.

2. **Hard stop on any non-zero `CR_RC`.** Use the established stdout/stderr-split,
   case-on-exit-code idiom already in this file (the `DERIVE_OUT`/`DERIVE_ERR` front-door
   block, SKILL.md:66-93, and the `commit-merge-push` invocation at SKILL.md:322-323):

   ```bash
   case $CR_RC in
     0) ;;
     1) echo "/review-fix: 'claude -p /code-review' exited non-zero: $(cat "tmp/code-review-$N.err")" >&2; exit 1 ;;
     2) echo "/review-fix: dispatch-code-review argument/empty-output error: $(cat "tmp/code-review-$N.err")" >&2; exit 1 ;;
     3) echo "/review-fix: /code-review is unavailable — rejection signature in output: $(cat "tmp/code-review-$N.err")" >&2; exit 1 ;;
     4) echo "/review-fix: 'claude -p /code-review' timed out" >&2; exit 1 ;;
   esac
   ```

   State explicitly, in prose next to the block: **a failure here fails the phase.** The
   pass never degrades to an agent-performed review, never retries with a substitute, and
   never reports substituted output under the built-in's name. Exit 3 in particular means
   the instrument is unavailable — the office-hours park reason must carry the verbatim
   stderr.

3. **Parse the summary** with the same `sed -n 's/^key=//p'` idiom Step 1 uses for
   `SURFACE_OUT` (SKILL.md:234-237):

   ```bash
   CR_FINDINGS=$(printf '%s\n' "$CR_OUT" | sed -n 's/^findings_path=//p')
   CR_PATCH=$(printf '%s\n' "$CR_OUT" | sed -n 's/^patch_path=//p')
   CR_TOUCHED=$(printf '%s\n' "$CR_OUT" | sed -n 's/^touched_file=//p')
   ```

4. **Extend the Step 2 `args` block** (SKILL.md:265-278) with one field, documented in
   the same table style:

   ```
   code_review: {
     status:         "ok",
     findings_path:  <CR_FINDINGS>,        // absolute path; the Workflow's reader subagent reads it
     patch_path:     <CR_PATCH>,           // absolute path to the before/after patch
     touched_files:  [ <CR_TOUCHED lines> ] // git-derived; the AUTHORITATIVE fixed[] constraint
   }
   ```

   Add a sentence: the skill passes **paths, not findings** — the raw review text is
   never read into this skill's context, preserving the property asserted at
   SKILL.md:307-309.

5. **Do not** recompute `surface` or `changed_files` after the pre-stage. The built-in's
   `--fix` edits are uncommitted working-tree changes to files already in the diff, and
   the Lane-B finder prompt (`diffContext`, `review-fix.js:432-444`) tells each finder to
   diff against `merge_base` — a `git diff <merge_base>` from a subagent already includes
   working-tree edits. Say so explicitly so a later reader does not "fix" it. Surface
   reclassification is out of scope.

6. **Frontmatter description** (SKILL.md:3): replace *"code-review via `/code-review max
   --fix`"* with wording naming the `claude -p` user-turn entry point and the exclusive
   pre-stage placement.

**Out of scope:** `review-fix.js` (Unit 4), the `references/*.md` prose (Unit 4).

### Recommended model

sonnet

### Dependencies

Units 1, 2.

---

## Unit 4 — Rewire the Workflow: no Skill call, no dead outcome mapping, diff-derived `fixed[]`

### Scope

- `.claude/workflows/review-fix.js`
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-finders` (header comment only)
- `.claude/skills/review-fix/references/inline-scans.md`
- `.claude/skills/review-fix/references/schema-edge-cases-notes.md`
- `.claude/skills/review-fix/references/disposition-table.md`

#### 4a. Delete the Skill-tool invocation and the dead outcome mapping

Delete the entire `if (name === 'code-review') { ... }` branch of `finderPrompt`
(`review-fix.js:452-478`) — the Skill-tool instruction at line 454 and the
`fixed`/`skipped`/`no_change_needed` outcome mapping at lines 456-470. Those outcomes are
structurally unavailable in a `-p` run: they populate only when findings are re-reported
after being fixed later in the same session, which this lane never does.

**Do not merely delete** — replace with the structuring prompt in 4c.

#### 4b. Remove code-review from the parallel fan-out; re-point the throttle probe

- `agentFinderSet` (`review-fix.js:295-308`): drop the unconditional
  `const set = ['code-review']` seed; start from `[]`. Extend the existing exclusion
  comment — which already documents why `codeql`/`npm`/`erosion` are absent ("NOT
  agents") — to cover `code-review` for the same structural reason: *it is not an agent
  finder; it runs as the exclusive `claude -p` pre-stage in SKILL.md Step 1b, before this
  fan-out.* On a non-`code` surface the function now returns `[]`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-finders` remains the
  normative source for "code-review always runs, regardless of surface" and its **emitted
  output does not change** (so its existing tests are untouched). Add a header note only:
  code-review is still always-on, but it is invoked as the serialized pre-stage rather
  than as an agent in the Workflow fan-out — which is why the JS mirror `agentFinderSet`
  excludes it, alongside `codeql`/`npm`/`erosion`.
- Throttle probe (`review-fix.js:549-600`): `code-review` was wave 1 and doubled as the
  probe. Re-point the probe at `security-review` — the other always-on-when-`surface=code`
  Lane-A finder — and rename `qualityFinders`/`qualityDead` to `probeFinders`/`probeDead`.
  Wave 2 stays the remaining security/domain lenses. When `finderNames` is empty (every
  non-`code` surface) skip the fan-out entirely and leave `coverage_incomplete === false`;
  there is nothing to probe *for*, because there is no wave 2. Update `coverage_note` text
  accordingly ("Security finders skipped: the security-review probe finder failed (model
  likely throttled).").

#### 4c. Structure the text output, with `fixed[]` constrained by the git diff

Replace the `codeReviewResult` capture (`review-fix.js:621-624`) with:

1. **Fail loudly on a missing contract.** If `_a.code_review` is absent or its `status`
   is not `"ok"`, throw with a message naming `dispatch-code-review` and instructing the
   caller to run SKILL.md Step 1b. The Workflow must never proceed as if the built-in ran.
   (Per `.claude/rules/code-style.md`: a clear error, not a defensive fallback to an empty
   lane.)

2. **One Sonnet structuring subagent**, launched with the existing `LANE_A_SCHEMA`
   (`review-fix.js:184-219`) — the `{ fixed, residue }` envelope the rest of the pipeline
   already consumes is unchanged, so `laneAFixed` (`:642-648`), `laneAResidue` (`:651-663`),
   the residue phase, and `RESIDUE_SCHEMA`'s `source: 'code-review'` enum all keep working:

   ```js
   const cr = _a.code_review;
   const parsed = await agent(codeReviewParsePrompt(cr), {
     model: 'sonnet',
     agentType: 'general-purpose',
     schema: LANE_A_SCHEMA,
     label: 'parse:code-review',
     phase: 'finders',
   });
   subagentsLaunched += 1;
   ```

   Sonnet, not Opus: this is mechanical text→JSON structuring, the same tier as `dedup`
   and `classify` — the *reasoning* was done by the built-in. Increment
   `subagentsLaunched` at the launch site, matching the accumulator convention at
   `review-fix.js:150-158`.

   `codeReviewParsePrompt(cr)` must say, in substance:

   - Read the file at `<cr.findings_path>`. It is the verbatim text output of a
     `claude -p '/code-review max --fix --comment'` run against this branch. Read the
     patch at `<cr.patch_path>` for the edits it applied. Use absolute paths as given.
   - **Authoritative constraint:** the built-in's applied edits are exactly the files in
     this list — `<cr.touched_files>`. This list came from a before/after `git diff`, not
     from any report. If the list is empty, `fixed` **must** be `[]` regardless of what
     the text claims. Never infer a fix from the review's prose.
   - Every finding covered by a hunk in the patch → `fixed[]`, with `location`,
     `fix_summary` (drawn from the finding's own text), and `touched_files` (a **subset**
     of the authoritative list).
   - Every other reported finding → `residue[]`, with `location`, `description`,
     `severity` (map the built-in's severity; default `medium` when unclear), `category`,
     `exploit_scenario` (`""` for a non-security finding — code-review findings are not
     necessarily exploits), `recommended_fix`.
   - You edit nothing, commit nothing, push nothing.
   - Append the existing `LANE_A_BLURB` (`review-fix.js:406-421`) rather than restating
     the field list.

3. **Mechanical enforcement in JS after the agent returns** — the agent's compliance is
   not trusted:
   ```js
   const allowed = new Set(cr.touched_files || []);
   const rawFixed = (parsed && parsed.fixed) || [];
   const keptFixed = allowed.size === 0
     ? []
     : rawFixed.filter((e) => (e.touched_files || []).length > 0
         && e.touched_files.every((f) => allowed.has(f)));
   ```
   `log()` the count of dropped entries and the reason. `keptFixed` feeds `laneAFixed`
   exactly as before. This is `strategy-token-economy` clarification 25 applied
   concretely: no yield is credited to the instrument that is not visible in the diff it
   produced.

#### 4d. Documentation

- `references/inline-scans.md:96-107` — the finder-agent roster prose still says the
  `code-review` quality finder "always runs — via `/code-review max --fix`" as part of the
  Workflow fan-out. Rewrite: code-review runs as the exclusive `claude -p` pre-stage in
  SKILL.md Step 1b; the Workflow's agent fan-out contains only the surface-gated lenses
  plus `security-review`.
- `references/schema-edge-cases-notes.md:31-34` (edge cases — "The code-review agent still
  runs"), `:67-80` (model split — "the always-on `code-review` finder now runs
  `/code-review max --fix`"), `:88-95` (probe-wave note — "Wave 1 launches only the single
  always-on `code-review` quality finder"). Update all three to the new topology, and add
  the structuring agent to the model split as a Sonnet mechanical stage.
- `references/disposition-table.md:19-32` — the note on how `code-review`'s buckets are
  populated "differently from the rest of this table: code-review's own outcome …".
  Replace the outcome-mapping description with the diff-derived `fixed[]` / text-parsed
  `residue[]` source.

**Out of scope:** the shared Lane-B pipeline (dedup / classify / verify / fix), the
residue phase, `security-review`'s branch of `finderPrompt` (it is unaffected — no
`disable-model-invocation` mark, 17/18 invocations succeeded), and any change to
`LANE_A_SCHEMA` / `RESIDUE_SCHEMA` shapes.

### Recommended model

opus

### Dependencies

Units 1, 2, 3.

### Merge-order note

`tactic-lane-instrument-substitution-guard` (attention boost 56, ranked to land just
before this node, deliberately with **no** `blocked_by` edge so a guard stall cannot
deadlock this one) has its own Unit 2 targeting the *same* `finderPrompt` `code-review`
branch this unit deletes — it adds "an unavailable instrument is terminal" language
there. Expect a merge conflict at `review-fix.js:452-478`. **Resolution: deletion wins** —
the branch ceases to exist, and its terminal-condition requirement is carried instead by
the Step 1b `case $CR_RC` hard stop (Unit 3, item 2) and the exit-3 rejection detection
(Unit 2, step 5), which are the same invariant enforced mechanically rather than by
prompt. If the guard has **not** landed when this unit merges, nothing is lost: this
unit's mechanism is strictly stronger for this lane.

---

## Reuse

- `.claude/workflows/review-fix.js:432-444` — `diffContext(args)` already computes the
  merge-base/changed-files target string. `MERGE_BASE` (SKILL.md:220-226) is the same
  value; pass it straight through as `<target>`. Do not hand-roll a second target
  formatter.
- `.claude/workflows/review-fix.js:184-219` — `LANE_A_SCHEMA`, the `{ fixed, residue }`
  envelope. Reused unchanged as the structuring agent's schema, so the whole downstream
  Lane-A path (`laneAFixed` `:642-648`, `laneAResidue` `:651-663`, the residue phase,
  `RESIDUE_SCHEMA`'s `source` enum) needs no change.
- `.claude/workflows/review-fix.js:406-421` — `LANE_A_BLURB`, the field-list prose.
  Append it to the structuring prompt rather than restating the fields.
- `.claude/skills/dispatch-propagate/scripts/commit-merge-push:200-213` — `do_push()`:
  capture combined stdout+stderr, grep a known failure signature, decide the exit code.
  The template for Unit 2's step-5 verification.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:71,221,290-335` — the
  existing "shell the claude CLI and mechanically verify it worked" primitive:
  `CLAUDE_CMD="${DISPATCH_SPAWN_JOB_CLAUDE_CMD:-claude}"` overridability, capture the
  exit code, fail loudly with the captured output in the error message,
  `--permission-mode auto` on the spawn. Different mode (`--bg` async vs `-p` sync) but
  the conventions transfer directly.
- `.claude/skills/review-fix/SKILL.md:66-93` and `:322-323` — the
  `DERIVE_OUT`/`DERIVE_ERR` stdout/stderr-split, case-on-exit-code idiom, and the
  script-invocation pattern. Unit 3's `case $CR_RC` block follows it rather than
  inventing a new error convention.
- `.claude/skills/review-fix/SKILL.md:234-237` — the `sed -n 's/^key=//p'` summary-parsing
  idiom used for `SURFACE_OUT`. Unit 2's stdout format is designed for it.
- `.claude/skills/dispatch-propagate/scripts/dispatch-security-surface` — the house
  `key=value`-lines-on-stdout convention Unit 2's summary mirrors.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — `assert_eq`,
  `report_results`, setup/teardown. Source it exactly as
  `test-dispatch-changed-files.sh:6-8` does. Fake-CLI-on-`$PATH` precedent:
  `test-dispatch-spawn-job.sh:165-185`.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,185-200` — auto-discovers
  every `test-*.sh` in the scripts dir and auto-selects the `--pr-scripts` bucket on any
  change under that path. No runner wiring needed.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-finders` — the single
  normative source for "code-review always runs, regardless of surface". Update its
  header there; do not scatter a second surface check into the new bash stage.
- `.claude/rules/sandbox.md` (`## gh CLI`, `## claude agents --json`,
  `## Network namespace isolation`) — the existing, already-documented
  `dangerouslyDisableSandbox: true` requirement for `gh` and claude-daemon-touching calls.
  Cite it; do not re-derive it.
- `.claude/rules/shell-json.md` — never `echo` a captured variable into a parser; use
  here-strings. Mechanically linted for net-new `.sh` lines by `lint-prose-rules.sh` via
  `run-lint.sh`.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:298,814` — the
  `attributionSkill` → `"<none>"` bucketing. Unit 1 reads the nested session's attribution
  against it; this node changes nothing there.

## Verification

Auto-runnable:

```verify
node --check .claude/workflows/review-fix.js
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

No `Skill`-tool invocation of code-review may survive anywhere in the workflows —
a source-tree grep is meaningful here because the *instruction* lives in committed
prompt text (unlike the rejection string, which only ever appears in tool results):

```verify
test -d .claude/workflows || { echo "FAIL: .claude/workflows missing"; exit 1; }
raw=$(LC_ALL=C git grep -ani 'skill tool' -- .claude/workflows); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
hits=$(printf '%s\n' "$raw" | LC_ALL=C grep -i 'code-review')
if [ -n "$hits" ]; then
  echo "FAIL: a Skill-tool code-review instruction is still present in .claude/workflows/"
  printf '%s\n' "$hits"
  exit 1
fi
echo "PASS: no Skill-tool code-review instruction in .claude/workflows/"
```

The dead per-finding outcome vocabulary must be gone from the code-review path:

```verify
if grep -n 'no_change_needed' .claude/workflows/review-fix.js; then
  echo "FAIL: dead ReportFindings outcome mapping still present in review-fix.js"
  exit 1
fi
echo "PASS: outcome mapping removed"
```

Manual and observe-in-production:

- **Unit 1 gate (blocking, manual).** Run `claude -p '/code-review max'` in a real
  dispatch worktree with `dangerouslyDisableSandbox: true`. It must return findings at a
  zero exit status. Record every item in Unit 1's list — permission mode, sandbox need,
  auto-mode-classifier acceptance, `--fix`+`--comment` compatibility, cost, attribution
  bucket, session-registry interference, duration, unavailability strings — in
  `references/code-review-invocation.md`. **If it does not work, stop and park.**
- **A real review pass.** Run `/review-fix` on a live PR with a code surface. In the
  transcript, confirm: (a) the `dispatch-code-review` call appears **before** the Workflow
  invocation and returns `status=ok` at exit 0; (b) no Skill-tool rejection anywhere;
  (c) the Workflow's finder fan-out contains no `find:code-review` label and exactly one
  `parse:code-review`.
- **`fixed[]` provenance (clarification 25).** On a pass where the built-in applied
  edits, `fixed[]` must be non-empty, and every entry's `touched_files` must appear in
  `tmp/code-review-<N>/touched-files.txt` and correspond to a real hunk in
  `tmp/code-review-<N>/fix.patch`. On a pass where the built-in applied nothing,
  `fixed[]` must be `[]` even if the review text narrates fixes.
- **Induced-failure drill (the substitution guard, end to end).** Point
  `DISPATCH_CODE_REVIEW_CLAUDE_CMD` at a stub that prints
  `Skill code-review cannot be used with Skill tool due to disable-model-invocation` and
  exits 0. Confirm the phase **fails** at Step 1b with the verbatim string in the stop
  message, and that the Workflow never runs and no findings are produced. Repeat with a
  bogus command name to exercise the real CLI's unavailability path.
- **`--comment` side effect.** Confirm inline PR comments appear on the PR from the
  nested run, and that they do not collide with or duplicate the skill's own single
  Step 6 PR comment. Judgment call: if the two comment surfaces read as redundant to a
  human, note it for a follow-up rather than removing `--comment` in this node.
- **Cost and attribution, observed in production.** After 3-5 real passes, run
  `/dispatch-token-audit 3d` and compare the review phase's cost and the `"<none>"`
  attribution share against the pre-change baseline recorded in Unit 1. A nested session
  is a new cost line; record whether it materially moves `strategy-token-economy`
  condition 2. Do not tune it in this node — file a follow-up if it does.

## needs-main residue

QA pass on PR #3007 (2026-07-31): 7 of 10 triaged items were script-verifiable and
all PASSED (primitive executable + `low`-effort default; real reject-pattern
`Unknown command: ` in active use, not the originally-predicted string; `fixed[]`
mechanically constrained to git-derived `touched_files`; zero surviving Skill-tool
`code-review` instructions or `no_change_needed` vocabulary; Step 1b documented as
an exclusive hard-stopping pre-stage; `review-fix.js` throws loudly when
`args.code_review` is missing; `test-dispatch-code-review.sh` 21/21 and the full
`--pr-scripts` bucket pass — a sandboxed run mass-false-failed
`test-dispatch-select-tick.sh` via the known `$CLAUDE_JOB_DIR`/mktemp sandbox
artifact, confirmed not a regression by a `dangerouslyDisableSandbox` re-run going
green). The remaining 3 items require a live nested `claude -p` session, real PR
activity, or multi-pass production observation the node's own Verification section
already scopes as manual/observe-in-production — the disposition Workflow
classified all three `needs-main`:

1. **A real nested `claude -p '/code-review low --fix'` run actually completes and
   writes the working tree on this PR's diff.** Not walked in the QA session:
   requires a live multi-minute nested session with real spend. Best verified when
   `/review-fix` actually runs on this PR (post-merge or on a subsequent real
   review pass), not synchronously inside `qa-fix`.
2. **`--comment` actually posts the review as a PR comment.** Planned deferral —
   the PR's own "Out of scope" section defers this to this PR's first real
   `/review-fix` pass (no PR existed during Unit 1's investigation).
3. **Effort level `low` is the right cost/quality point for the review phase.**
   Planned deferral — the PR's own "Out of scope" section defers effort-level
   tuning to the `strategy-token-economy` follow-up; needs 3-5 real passes plus a
   `/dispatch-token-audit` run to inform.

## Office-hours sitting 2026-08-09 — all three residue items closed

**Disposition: closed. Item 3 answered against `low`; the replacement work is
filed as its own node.** Author ruling at the 2026-08-09 sitting. `phase: done`,
park cleared.

| item | outcome |
|---|---|
| 1 — nested `code-review low --fix` pre-stage completes and writes the tree on a real PR diff | PASS, confirmed across three merged PRs |
| 2 — `--comment` actually posts a PR comment | CONTRADICTED; carried by `tactic-review-code-review-invocation-contract-main-qa-regression` |
| 3 — is `low` the right cost/quality point? | ANSWERED: no |

### Item 2 is not closed here, it is owned elsewhere

Zero inline comments and zero reviews were observed across all three merged PRs
despite `--comment` on every run. That defect is already filed as
`tactic-review-code-review-invocation-contract-main-qa-regression`, which at the
sitting read `phase: implement`, `status: raw`, unparked — i.e. moving. Nothing
about item 2 is discharged by closing this node.

### Item 3 — `low` does not hold; `max` directed

The author ruled that `low` is not the right cost/quality point for the review
phase and directed `max`. The token-audit evidence the park called for was not
gathered: the author decided on quality grounds without it, so the audit spend
was not incurred.

**`max` cannot be reached by changing the effort argument.** This is a measured
constraint, surfaced at the sitting from this node's own reference doc
(`.claude/skills/review-fix/references/code-review-invocation.md` section 1.2):
a `max` review of a real diff ran 2363 s (39 m 23 s), produced no output, and
was killed with `exit=143` and 0 bytes captured. It exceeds both the Bash tool's
600 000 ms cap and the proposed `DISPATCH_CODE_REVIEW_TIMEOUT:-540`. Because
`claude -p` buffers all output until completion, a timed-out run is a total loss
of a very expensive run, not a degraded result. The doc's own conclusion is
explicit: run it detached with a resume-poll, or drop the effort — and
`Design this deliberately; do not just raise the timeout constant.`

**Filed as `tactic-review-effort-max-detached-resume-poll`** (`status: raw`,
`attention.boost: 20`), which couples the effort raise and the detached
resume-poll harness into ONE deliverable so `max` can never land without the
harness that makes it viable. That node, not this one, carries the remaining
work.

### Park recommendation already discharged

The park told the operator to release a frozen slot with `git worktree remove …`
plus `claude rm 361f3b83-0fa7-4ea0-828c-0d611f68eaf3`. Verified at the sitting:
the session is absent from `claude agents --json --all` and the worktree does not
exist. Do not re-run those commands.
