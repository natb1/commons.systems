---
id: tactic-review-skill-body-decomposition
kind: tactic
statement: Decompose the review-fix parent session — keep the bulk payloads out
  of its context
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-31 review-fix token audit interview. The
  parent review worker averaged 184,468 peak context with 14 of 19 sessions over
  150k, while every workflow subagent stayed comfortably under — the fan-out is
  decomposed, the parent session is not. See clarification 16 on
  strategy-token-economy. Finalized 2026-08-03: re-diagnosed against the live
  files, which had diverged from the draft's premises by four intervening
  commits (7d344a07 thinned review-fix/SKILL.md 1172->434 lines on 2026-07-22,
  BEFORE the audit window, and did not fix the parent-context problem; 7c772829
  added the Step 1b code-review pre-stage; 778a1c94 added the fail-closed
  instrument-substitution guard; cf913dea added Lane-A residue-disposition death
  handling). The finalized plan targets three payloads verified to still cross
  into the parent today — the teed context pack (including up to 60k chars of
  raw diff via dispatch-context-pack), the Workflow's five-unbounded-array
  return, and the two remaining un-scripted inline scans (CodeQL alert fetch,
  npm audit differential) — rather than the draft's original per-call
  probe-count framing, which could not be re-derived from the live,
  already-scripted bash blocks. Step 7's terminal actions are kept inline
  (dispatch-finalize-phase self-closes the session); Step 5's node-lane filing
  is split so only the bulky read forks to a subagent while graph-commit stays
  in the parent. Sequencing: sibling
  tactic-token-audit-whole-session-phase-attribution should land after this
  tactic (or the audit should be re-baselined), since this tactic changes the
  parent-session shape the attribution fix would otherwise be evaluated
  against."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.01
  rationale: >-
    Author-directed 2026-08-01: prioritize review-phase token/agent-cost
    reduction. Puts this tactic ahead of the undecomposed baseline and on par
    with other tier-2 improvement work, without contending with active
    reliability fixes (top-of-band ~55-61).


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.01 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-review-skill-body-decomposition
  pr: 3025
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T00:00:19Z
    mergeCommitSha: 7d64646be6cc323ee0ab320b77d3ed7dd492caf2
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Decompose the review-fix parent session — keep the bulk payloads out of its context

## Context

The `/review-fix` parent worker session is the single most context-expensive
stage in the dispatch chain. Measured over 18 `/review-fix` runs, 2026-07-27 to
2026-07-31:

| stage | avg peak ctx | max | over 150k |
|---|---|---|---|
| **parent review worker (skill body)** | **184,468** | 262,215 | **14 of 19** |
| find:code-review | 122,359 | 170,400 | 3 of 18 |
| residue | 108,120 | 177,314 | 2 of 17 |
| fix | 89,473 | 139,024 | 0 of 14 |
| classify | 83,434 | 130,300 | 0 of 16 |
| verify | 72,583 | 117,943 | **0 of 129** |
| dedup | 46,862 | 54,158 | 0 of 19 |

Every Workflow subagent stays comfortably under 150k. Only the parent is
consistently over — 74% of its sessions. The Workflow's fan-out is already well
decomposed; the parent session is not.

The bottleneck is **not** SKILL-body prose. `.claude/skills/review-fix/SKILL.md`
was already thinned 1172 → 434 lines by commit `7d344a07` (2026-07-22, PR #2927)
*before* the audit window that produced the table above, and the parent context
problem persisted. (It has since grown back to 675 lines via additive commits;
that is a separate, smaller concern this tactic does not address.) The bottleneck
is **payload volume crossing into the parent's context** — bulk text that the
parent reads once, never uses directly, and then pays for on every subsequent
turn as a cache-read prefix.

This plan was authored against the **live** files on 2026-08-03, after the audit
window and after four commits that changed the parent session's shape:
`7c772829` (2026-08-02, added Step 1b — a serialized `claude -p '/code-review low
--fix'` pre-stage with its own tool calls, before the Workflow fan-out),
`778a1c94` (fail-closed instrument-substitution guard), `cf913dea` (2026-08-03,
Lane-A residue-disposition death handling), and `7d344a07` above. The three units
below are re-diagnosed against the current shape, not inherited from the draft.

Three payloads cross into the parent, in the order they arrive:

1. **The context pack, including the raw diff** — `SKILL.md:126-128` pipes
   `dispatch-context-pack --pr --phase-log --diff` through `tee`, so the *entire*
   pack lands in the parent's context **and** on disk. That pack carries the PR
   body, the phase-log comment, and up to `DISPATCH_CONTEXT_DIFF_CAP` (default
   **60,000 chars**, `dispatch-context-pack:266`) of raw diff hunks. The parent
   needs five small things out of it; nothing in the parent ever reads the hunks.
   This arrives on roughly the third turn and is therefore resident for the whole
   session. **Unit 1.**

2. **The Workflow return payload** — `.claude/workflows/review-fix.js:2256-2285`
   returns five unbounded per-finding arrays (`dispositions`, `fixed`,
   `deferred_filings`, `security_followup_input`, `verify_report`) alongside six
   scalars that are already computed just above it at `:2238-2247`. Measured, 11
   of 19 runs returned **26,074 to 63,531 chars** (roughly 6.5k-16k tokens) of
   this directly into a parent already near 150k. Largest observed single
   payload: 63,531 chars. `SKILL.md:494-513` documents the shape the parent
   receives. **Unit 2.**

3. **Raw scan JSON from the inline scans** —
   `references/inline-scans.md:44-70` fetches `gh api --paginate
   repos/{owner}/{repo}/code-scanning/alerts` with no redirect, so the full
   alert JSON (one object per open alert, each carrying complete `rule` metadata
   and `most_recent_instance`) enters the parent's context and the model
   hand-normalizes each alert. `references/inline-scans.md:13-26` redirects two
   `npm audit --json` runs to files but then requires the model to compute the
   head-vs-baseline advisory diff, which means reading both. Contrast
   `references/inline-scans.md:83-91`, where erosion is already scripted:
   `dispatch-review-erosion` emits `{"findings":[...]}` already in the
   per-finding schema, and no raw metric data reaches the parent. **Unit 3.**

**Intended outcome.** The parent review session becomes a thin bookend: it
computes args, invokes the Workflow, and runs the mechanical terminal sequence.
Every step that must read bulk data reads it inside a subagent that pays for it
once and discards it. Target: parent peak context below 150k for the majority of
runs.

**Binding constraint (`strategy-token-economy` attributes.conditions #5).** None
of the three units changes any lens, any finder prompt, any severity threshold,
any classifier rule, or any disposition bucket. They change *where bytes live*,
not what is detected. A change that reduces detection is not a throughput gain
even if it reduces allowance draw — if an implementer finds themselves narrowing
a trigger or dropping a finder to hit the context target, stop and park; that is
outside this tactic's sanctioned lever.

**Node lane only.** `TARGET_KIND=node` is the only lane that executes in
production — GitHub Issues are disabled repo-wide. The legacy `TARGET_KIND=issue`
paths (`references/followup-filing.md:88-91` for 5a and `:166-169` for 5b) are
largely dead. Every unit below scopes to the node lane and leaves the issue-lane
prose untouched.

---

## Unit 1 — Stop teeing the context pack into the parent's context

### Scope

**Changes:**

- **New script** `.claude/skills/dispatch-propagate/scripts/dispatch-pack-scalars`
  — a pure stdin→stdout extractor, no `git`, no `gh`, no network, modeled exactly
  on `.claude/skills/dispatch-propagate/scripts/dispatch-changed-files` (read that
  file in full first — it is 44 lines and defines the anchoring convention this
  script must copy). It reads a full `dispatch-context-pack` output on stdin and
  prints only `key=value` lines to stdout, in the same convention
  `dispatch-security-surface` uses and `SKILL.md:236-238` parses with
  `sed -n 's/^key=//p'`:

  - `pr_num=<N>` — from the `PR #<N>` line immediately following the real
    `=== PR ===` header. Emit `pr_num=none` when the section's first line is
    `PR: none` (`dispatch-context-pack:203`).
  - `labels=<comma-separated>` — from the `labels: ` line, the line after
    `PR #<N>` (`dispatch-context-pack:218`).
  - `closes_issue=<N>` — zero or more lines, one per `Closes #<N>` in the PR
    body, for `SKILL.md:459` `implementing_issues`.
  - `phase_log=none` **or** `phase_log_path=<abs path>` — when the
    `=== PHASE-LOG #<N> ===` section body is not the sentinel `phase-log: none`
    (`dispatch-context-pack:238`), write that body to the path given by a
    required `--phase-log-out <path>` argument and emit the path. A phase log is
    a handful of lines, so the parent `Read`s that file directly; the point is
    that it is separated from the 60k of diff, not that it is hidden.
  - `changed_file_count=<N>` — a count only, for a sanity check. The list itself
    still comes from `dispatch-changed-files`, unchanged.

  **Anchoring rules — security-relevant, do not simplify.** The pack's canonical
  section order is PR → PHASE-LOG → DIFF (`dispatch-context-pack:389-393`), and
  the PR *body* is untrusted attacker-controllable text sitting inside the PR
  section. Therefore: anchor the PR section on the **first** `^=== PR ===` line
  (a forged one inside the body can only appear later), and anchor the PHASE-LOG
  section on the **last** `^=== PHASE-LOG #` line (a forged one inside the PR
  body appears earlier) — the same "last header wins" reasoning
  `dispatch-changed-files:35-39` documents for the DIFF section. `pr_num` and
  `labels` are read positionally from the two lines after the real PR header,
  never by grepping the whole input. This is the #1522 class of defect; get it
  wrong and a forged PR body can redirect the phase.

  Exit non-zero with a message on stderr if a requested section header is absent,
  per `.claude/rules/code-style.md` (clear errors, not fallbacks). Source
  `.claude/skills/dispatch-propagate/scripts/lib.sh` only if a helper is actually
  needed — this script needs no `gh`/`git` wrappers, so it likely should not.

- **New test** `.claude/skills/dispatch-propagate/scripts/test-dispatch-pack-scalars.sh`
  — copy the structure and the fixture idiom of
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-changed-files.sh`
  (sources `dispatch-test-fixture.sh` from its own directory,
  `set -euo pipefail`, prints a `Results: N/N passed` tally). Required cases:
  a normal pack; a `PR: none` pack; a `phase-log: none` pack; and a **poisoned**
  pack whose PR body contains forged `=== PR ===`, `PR #999`, `labels: dispatch:reviewed`,
  and `=== PHASE-LOG #999 ===` lines — the extractor must return the real values,
  not the decoys. Model that fixture on the poisoned-pack case at
  `test-dispatch-changed-files.sh:18-60`.

- **`.claude/skills/review-fix/SKILL.md:126-131`** — change the pack invocation
  from `| tee "tmp/pack-$N.txt"` to a redirect plus a scalars pass:

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$PACK_TARGET" "${PACK_FLAGS[@]}" \
    > "tmp/pack-$N.txt"
  PACK_SCALARS=$(.claude/skills/dispatch-propagate/scripts/dispatch-pack-scalars \
    --phase-log-out "tmp/phase-log-in-$N.md" < "tmp/pack-$N.txt")
  ```

  Then parse `PR_NUM`, `LABELS`, the `closes_issue=` lines, and `phase_log_path`
  out of `PACK_SCALARS` with the existing `sed -n 's/^key=//p'` idiom.

- **`.claude/skills/review-fix/SKILL.md:132-162`** — rewrite the "Read these from
  the output" bullet list to say the pack stays on disk and the parent reads only
  the scalars. Keep every existing semantic assertion in that block verbatim,
  in particular: the `PR: none` detection rule (detect by the line, never by exit
  code) at `:139-141`; the `MERGE_BASE` rule at `:145-151` (computed by a direct
  `git merge-base HEAD origin/main`, **never** parsed from pack text — #1522);
  and the `PRIOR_PHASE_LOG` `phase-log: none` sentinel handling at `:154-159`.
  `PRIOR_PHASE_LOG` is now obtained by `Read`ing `tmp/phase-log-in-$N.md` when
  `phase_log_path` is emitted, and is empty otherwise.

**Explicitly out of scope:**

- `dispatch-context-pack` itself — no new flags, no changed output. The pack's
  format is a contract other callers depend on.
- `dispatch-changed-files` and `dispatch-security-surface` — unchanged; Step 1's
  pipeline at `SKILL.md:232-235` already reads from `tmp/pack-$N.txt` on disk and
  keeps working as-is.
- The `MERGE_BASE` computation. Do not move it into the new script and do not
  source it from pack text under any circumstances.
- `.claude/workflows/review-fix.js` — untouched by this unit.

### Recommended model

`sonnet` — per the model-selection heuristic at
`.claude/skills/implement-unit/SKILL.md` ("Model-selection heuristic",
lines 31-39). The diff shape is fully determined: one new ~60-line bash script
with a spelled-out output contract and anchoring rule, one test file cloned from
an existing template, and one localized SKILL.md edit.

---

## Unit 2 — Return a path plus scalars from the Workflow; read the detail inside subagents

### Scope

This unit is **atomic**: changing the Workflow's return shape without
simultaneously rewiring its consumers breaks the review phase. Land the
`review-fix.js` change and every `SKILL.md` / reference-file consumer change in
one unit.

**Changes:**

- **`.claude/workflows/review-fix.js:2256-2285`** — replace the five bulky arrays
  in the returned object with one path. New return shape:

  ```
  { result_path,            // absolute path to the full JSON, written by the dump agent below
    deviation, security_note?, coverage_incomplete, coverage_note?,
    instrument_failures,    // small, bounded — one entry per failed instrument receipt; keep inline
    findings_surfaced, findings_actionable, fixes_applied, followups_deferred,
    subagents_launched, disposition }
  ```

  The six scalar fields are **already computed** at `:2238-2247` and `:2249-2254`
  — they are the compact index this tactic asks for; they need no invention, only
  the removal of the arrays that sit beside them. `instrument_failures` stays
  inline because it is bounded by the instrument roster (a handful of entries at
  most) and Step 7's deviation branch reads it.

- **Writing the full result to disk.** `review-fix.js` **cannot** do this itself.
  Its file-header contract at `:16-17` states: *"No filesystem, no gh, no git, no
  `node:*` — the skill does all of that around the call."* The dump must
  therefore be a final `agent()` call — the file's one generic subagent-spawn
  primitive, defined and used ~14 times (see `:862-864` for the finder launch and
  `:1568-1574` for the fix launch). `general-purpose` agents launched through it
  already have Write access (the fix agents at `:1568` edit the working tree), so:

  - Add a required `result_out_dir` field to `args` (absolute path, supplied by
    the skill — mirror the `--out-dir tmp/code-review-$N` convention
    `dispatch-code-review` uses and `SKILL.md:334` passes). Document it in the
    `args IN:` block at `review-fix.js:19-32`.
  - Immediately before the `return`, spawn one `agent()` with `model: 'sonnet'`,
    `agentType: 'general-purpose'`, `label: 'dump'`, whose prompt embeds the full
    result object as JSON text and instructs it to write that text verbatim to
    `<result_out_dir>/result.json` with the Write tool at the given absolute path,
    then return `{ path, bytes }`. It reviews nothing, edits nothing else.
  - **Fail loud, never silently degrade.** If the dump agent returns no path, or
    a path that is not the one requested, throw — do not fall back to returning
    the arrays inline. A silent fallback would restore exactly the payload this
    unit removes, undetectably. This is the `.claude/rules/code-style.md`
    "clear errors over defensive fallbacks" rule, and it mirrors the
    load-bearing `*)` catch-all reasoning already documented at
    `SKILL.md:391-405`.
  - Update the `return OUT` documentation block at `review-fix.js:34-45`.

- **`.claude/skills/review-fix/SKILL.md:442-476`** (Step 2, `args`) — add
  `result_out_dir: "<abs>/tmp/review-result-$N"` to the `args` block and add a
  bash line creating that directory before the Workflow call, alongside the
  existing `RUN_STARTED_AT` capture at `:449-451`.

- **`.claude/skills/review-fix/SKILL.md:493-513`** (the documented `result`
  shape) — rewrite to the new shape above. Keep the `coverage_incomplete` /
  `coverage_note` three-cause explanation at `:514-520` verbatim, and keep the
  "three sources of working-tree edits" paragraph at `:521-526` verbatim — both
  are still true and neither depends on the arrays.

- **`.claude/skills/review-fix/SKILL.md:596-620` + `references/followup-filing.md:7-43`**
  (Step 5, node lane) — the parent no longer holds `result.deferred_filings` or
  `result.security_followup_input`. Fork **one** subagent, using the canonical
  fork recipe at `.claude/skills/implement-unit/SKILL.md:152-161` (Agent tool;
  `subagent_type: general-purpose`, **never** the skill name; `model: sonnet` set
  explicitly on the Agent call) — the same recipe `SKILL.md:572-574` already
  points at for the Step 3 fallback. Prompt it in the shape of
  `review-fix.js:663-700` (`codeReviewParsePrompt`): *"Read the file at
  `<result_path>` with the Read tool (absolute path, use it as given)"*.

  **The subagent authors files only; it does not commit.** It runs
  `packages/intentionsutil/scripts/write-node.ts` for the draft frontmatter and
  then edits each `intentions/<draft-id>.md` body per the three-step procedure at
  `followup-filing.md:17-27`, and returns
  `{ node_ids: [...], count: <N> }`. The parent then runs the single
  `graph-commit` inline. This split is deliberate: `graph-commit` is
  worktree-sensitive and overlapping/mis-rooted invocations corrupt state, and a
  subagent's working directory is not reliably the parent's — so the risky commit
  stays in the parent, where `SKILL.md` already establishes the worktree, while
  the bulky read moves out. Pass the worktree root as an absolute path in the
  prompt regardless, and require the subagent to use absolute paths throughout.

  The returned `count` is the value the follow-ups-filed counting rule at
  `followup-filing.md:47` requires — count only NEW records, never
  `result.followups_deferred`. That rule is unchanged; only its source moves.

- **`.claude/skills/review-fix/SKILL.md:622-637` + `references/pr-comment.md`
  (whole file, 88 lines)** (Step 6) — the parent no longer holds
  `result.dispositions`, `result.verify_report`, or `result.security_note`. Fork
  one subagent (same recipe, `model: sonnet`) handed: `result_path`, `PR_NUM`,
  the fix commit SHA(s) captured at `SKILL.md:590-594`, and the absolute worktree
  root. It reads `result.json` itself, composes the body file under `tmp/` (the
  `post-pr-comment.sh` path restriction at `pr-comment.md:31-33` still applies),
  posts or edits the marker comment, and returns `{ comment_id }`.

  **Preserve the durability mechanism, not the wording.** `pr-comment.md:8-27`
  describes composing incrementally "as each disposition resolves". In the
  current architecture that cannot literally happen in the parent: the Workflow
  returns after *all* dispositions have resolved (`review-fix.js:2256`), so the
  parent has only ever had one shot at composing. What is real and must survive
  is the resume behavior: the first-line `<!-- dispatch:review-fix -->` marker,
  create-via-`post-pr-comment.sh`-then-`PATCH`-in-place, and re-finding the same
  comment on a resumed run via `dispatch_marker_comment_id` (`lib.sh`) so a
  duplicate is never stacked. Require all of that in the subagent prompt, and
  update `pr-comment.md`'s prose to describe what actually happens rather than
  leaving a claim the code cannot honor.

  Keep the full per-bucket body organization at `pr-comment.md:35-63` and the
  partial-coverage rule at `:65-72` — including the untriaged-Lane-A-residue
  Deferred case at `:52-57`, which `cf913dea` added and which is still live.

- **`.claude/skills/review-fix/SKILL.md:639-670` + `references/terminal-actions.md`**
  (Step 7) — **stays inline in the parent.** Do not fork it. `dispatch-finalize-phase`
  must run as the absolute last action *in this session* because it self-closes it
  (`SKILL.md:664-665`, `terminal-actions.md:196-222`), and both
  `.claude/hooks/dispatch-stop.sh` and the router's chain propagation watch this
  specific session ending here. Forking it would require redesigning that
  contract, which is out of scope. Step 7's only change: it now reads the counts
  for `dispatch-emit-outcome` from the returned scalars (they are already the
  right numbers) and the follow-ups-filed total from Step 5's subagent return.

**Explicitly out of scope:**

- The `dispatch-finalize-phase` self-close contract, `.claude/hooks/dispatch-stop.sh`,
  and the router's chain propagation.
- Any finder prompt, any classifier rule, any severity threshold, any disposition
  bucket, any lens. The dedup/classify/verify/fix/residue pipeline is untouched.
- The Step 1b `/code-review` pre-stage (`SKILL.md:278-441`) — it already follows
  this exact pattern (paths in `args`, raw text never in the parent's context,
  `SKILL.md:468-474`) and is the model being generalized here, not a target.
- The `instrumentVerdict` / `INSTRUMENTS` sentinel block in `review-fix.js` —
  do not move or renumber the `// >>> instrument gate:` / `// <<< instrument gate <<<`
  sentinel comments; `review-fix-instrument-probe.mjs:33-35` slices on them and
  fails loudly if either appears other than exactly once.
- The legacy `TARGET_KIND=issue` 5a/5b paths.

### Dependencies

None on Unit 1 (they touch disjoint regions), but land Unit 1 first — it is the
smaller, lower-risk change and it establishes the on-disk-plus-scalars pattern
this unit generalizes.

### Recommended model

`opus` — per the heuristic at `.claude/skills/implement-unit/SKILL.md:31-39`.
This is a cross-cutting change spanning a Workflow script's return contract and
four consumer sites, with ordering and durability constraints (self-close
contract, marker re-find on resume, `graph-commit` locality) that the plan
deliberately leaves judgment room around.

---

## Unit 3 — Script the two inline scans that pass raw JSON through the parent

### Scope

Erosion is already scripted and is the template: `dispatch-review-erosion` emits
`{"findings":[...]}` already in the per-finding schema, and no raw metric data
touches the parent (`references/inline-scans.md:83-91`). Bring the other two
inline scans to the same shape.

**Changes:**

- **New script** `.claude/skills/dispatch-propagate/scripts/dispatch-review-codeql`
  — takes the PR number as a positional argument, runs the paginated alert fetch
  currently written out at `references/inline-scans.md:50-52`, and emits
  `{"findings":[...]}` on stdout with every alert already normalized to the
  per-finding schema. Transcribe the normalization rules from
  `references/inline-scans.md:54-70` exactly — they are fully specified there:
  `Location` from `most_recent_instance.location`; `Description` from
  `rule.description` / `most_recent_instance.message` plus the alert `number`,
  `rule.id`, `html_url`; `OWASP`/`STRIDE` inferred from `rule`; `Confidence` from
  `rule.security_severity_level` with the documented `rule.severity` fallback for
  non-security rules (`error` → `medium`, `warning`/`note` → `low`) — that
  fallback exists to preserve non-security-rule signal instead of collapsing it
  to `low`, so do not drop it; `Recommended fix` from the rule's remediation
  guidance. Preserve the no-PR case at `:72-76`: emit
  `{"findings":[],"status":"skipped-no-pr"}` and exit 0. An empty alert array is
  normal and is not an error.

- **New script** `.claude/skills/dispatch-propagate/scripts/dispatch-review-npm-audit`
  — takes `MERGE_BASE` as a positional argument (**never** an inline `VAR=val`
  prefix, per `.claude/rules/sandbox.md` "Avoid inline env var prefixes"; this is
  the same calling convention `dispatch-review-erosion` uses at
  `inline-scans.md:89-90`). It performs the head-vs-baseline audit currently
  written out at `references/inline-scans.md:13-26` — its own `mktemp -d` with a
  `trap ... EXIT` cleanup, `npm audit --json` at HEAD, `git show
  "$MERGE_BASE":package-lock.json` / `package.json` into a baseline dir, then
  `npm audit --package-lock-only --json --prefix <baseline>` — and emits only the
  normalized differential on stdout: advisories present at head but not at
  baseline as `introduced_by_diff=true` (in-scope, classify `required`);
  advisories present in both and rated `high`/`critical` as
  `introduced_by_diff=false` (out-of-scope, feeds follow-up filing); advisories
  present in both and rated `moderate`/`low` **omitted entirely** — they are
  below the meaningfulness threshold (`inline-scans.md:38-42`). Also surface the
  "dependency added or upgraded whose resolved version skips a published
  security-patch release" case from `:36-37`. Raw `npm audit` JSON never reaches
  stdout.

  `MERGE_BASE` arrives as an argument and is used as-is. Do **not** recompute it
  and do **not** derive it from any pack text — `SKILL.md:145-151` and `:221-225`
  document why (a forged `=== DIFF (base <sha>) ===` header in a PR body must
  never reach the dependency-audit baseline; #1522). This is the single most
  security-sensitive line in the unit.

- **New tests** `test-dispatch-review-codeql.sh` and
  `test-dispatch-review-npm-audit.sh` in the same scripts directory, following
  `test-dispatch-changed-files.sh`'s structure (source `dispatch-test-fixture.sh`,
  `set -euo pipefail`, `Results: N/N passed` tally). Both scripts must accept
  fixture JSON through a documented test seam (an env-var-overridable input path,
  in the manner of `DISPATCH_AUDIT_PROJECTS_ROOT` in
  `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:33-35`) so the
  tests run offline with no `gh` and no `npm` network access. Required cases:
  empty alert array; a security-severity alert; a non-security alert exercising
  the `rule.severity` fallback; the no-PR skip; a newly-introduced advisory; a
  pre-existing `critical` advisory; a pre-existing `moderate` advisory that must
  be omitted.

- **`.claude/skills/review-fix/references/inline-scans.md:7-91`** — replace the
  two inline command blocks with the two script calls, keeping each block's
  sandbox note intact (`dangerouslyDisableSandbox: true` for the CodeQL fetch
  because `gh` needs network, and for the npm audit because `npm` writes the npm
  cache — see `.claude/rules/sandbox.md`). Keep the erosion block at `:83-91`
  unchanged. Keep the closing "Collect normalized CodeQL, npm, and erosion
  findings into `prescanned_findings`" instruction — the parent still assembles
  `prescanned_findings`, but now from three already-normalized `{"findings":[...]}`
  streams rather than by hand-normalizing raw API output.

**Explicitly out of scope:**

- The `deps=true` / `surface=code` gating at `SKILL.md:263-273` — unchanged; the
  scripts run under exactly the same conditions as the inline blocks did.
- The per-finding schema itself (`references/schema-edge-cases-notes.md`) — the
  scripts emit the existing schema; they do not extend it.
- `dispatch-review-erosion` — already correct.
- The `MERGE_BASE` computation site at `SKILL.md:221-225`.

### Dependencies

None. Independent of Units 1 and 2; can land in any order relative to them.

### Recommended model

`opus` — per the heuristic at `.claude/skills/implement-unit/SKILL.md:31-39`.
Although the normalization rules are written out, the unit creates two new
scripts on the security-sensitive dependency-audit and code-scanning paths, has
to design an offline test seam for two network/npm-dependent tools, and carries
the #1522 baseline-integrity constraint.

---

## Interaction to watch

This tactic changes **where** review work is measured: it moves turns and payload
out of the parent session and into subagent transcripts.
`tactic-token-audit-whole-session-phase-attribution` is fixing whole-session
phase attribution for the parent session shape **as it exists today** — 2,241 of
2,992 turns (75%) across 19 review-worker sessions fell to the `<none>` bucket,
the single largest line in the audit window at $1,319, so `review-fix` measured
$614 phase-tagged against $754 true cost.

Sequence the two, or re-baseline the audit after both land. Otherwise the
attribution fix is evaluated against a session shape that changed underneath it,
and neither result is trustworthy. That tactic is `status: raw`, `phase: null`
as of 2026-08-03 — it has not started, so sequencing it *after* this one is the
cheaper order.

Secondary note for whoever picks that up: after Unit 2, the parent's own turn
count drops but three new subagent transcripts appear per run (dump, Step 5
filing, Step 6 comment). The `<none>` bucket's composition will shift, so a
before/after comparison must be made on total spend across parent **plus**
subagents, never on the parent line alone.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-changed-files` — the pure
  stdin→stdout extraction template and, critically, the last-header-wins
  anchoring convention documented at its lines 28-40. Unit 1's new script copies
  both.
- `.claude/skills/dispatch-propagate/scripts/dispatch-security-surface` — the
  `key=value`-per-line output contract that `SKILL.md:236-238` already parses
  with `sed -n 's/^key=//p'`. Unit 1 emits this shape; do not invent JSON.
- `.claude/skills/dispatch-propagate/scripts/dispatch-code-review:105-182` — the
  `--out-dir` convention (one directory per run, one file per artifact,
  absolute-path resolution). Unit 2's `result_out_dir` follows it.
- `.claude/skills/review-fix/SKILL.md:468-474` — `args.code_review = { status,
  findings_path, patch_path, touched_files }`, the existing "write the bulk to
  disk, pass a path plus a few authoritative scalars" pattern on the *input*
  side. Unit 2 replicates it on the *return* side.
- `.claude/workflows/review-fix.js:663-700` (`codeReviewParsePrompt`) — the
  consumer half: hand a subagent the absolute path and tell it *"Read the file
  ... with the Read tool (absolute path, use it as given)"*. Units 2's Step 5 and
  Step 6 subagent prompts use this shape.
- `.claude/workflows/review-fix.js:862-864` and `:1568-1574` — the `agent(prompt,
  { model, agentType, schema, label, phase })` primitive. Unit 2's dump step uses
  this same primitive; do not add a new spawn mechanism.
- `.claude/skills/implement-unit/SKILL.md:152-161` — the canonical subagent fork
  recipe (`subagent_type: general-purpose`, never the skill name; `model` set
  explicitly on the Agent call, because a skill's own frontmatter model does not
  propagate to a spawned subagent). `SKILL.md:572-574` already points at it for
  Step 3's fallback; Units 2's Step 5/6 forks reuse the same recipe and wording.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-changed-files.sh` —
  the per-script test template, including the poisoned-pack fixture at lines
  18-60 that Unit 1's anti-forgery case clones.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — the
  shared fixture every `test-*.sh` in that directory sources.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-erosion` (called at
  `references/inline-scans.md:83-91`) — the already-correct "scan → normalized
  `{"findings":[...]}`" shape Unit 3's two new scripts match.
- `.claude/skills/dispatch-propagate/scripts/lib.sh` — the shared `gh`/`git`
  wrapper library every `dispatch-*` bash script sources. Check its exports
  before hand-rolling any `gh` call in Unit 3; in particular
  `dispatch_marker_comment_id` is what Unit 2's Step 6 subagent must use to
  re-find the review comment on resume.
- `.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs` —
  the sentinel-slice-and-eval pattern for testing pure helpers inside
  `review-fix.js` (which cannot be imported: top-level await plus injected
  globals). If Unit 2 wants direct coverage of the new return assembly, extend
  this pattern with a new sentinel pair rather than writing an ad-hoc eval, and
  wire the driver into the `hook-tests` job at
  `.github/workflows/unit-tests.yml:212-214` — `run-unit-tests.sh` has no mapping
  for `.claude/workflows/*`, so a PR touching only `review-fix.js` triggers no
  suite otherwise.

## Verification

### Auto-runnable

The three review-fix Workflow probe suites must stay green — they are the only
CI coverage for `review-fix.js`, and Unit 2 edits that file:

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh
```

The extraction-script suites — the existing one must not regress, and Unit 1's
new one must pass:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-changed-files.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-pack-scalars.sh
```

Unit 3's two new suites:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-review-codeql.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-review-npm-audit.sh
```

Prose-rule lint over the changed shell scripts (enforces, among other things, the
`jq`/`echo` control-char rule from `.claude/rules/shell-json.md` on net-new lines
in committed `.sh` files):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The sentinel-integrity assertion Unit 2 must not break — each sentinel exactly
once in `review-fix.js`:

```verify
test "$(grep -c '^// >>> instrument gate:' .claude/workflows/review-fix.js)" = 1 && test "$(grep -c '^// <<< instrument gate <<<' .claude/workflows/review-fix.js)" = 1
```

The bulky arrays must be gone from the Workflow's return — this is the whole
point of Unit 2, and a silent fallback that reinstates them would otherwise be
invisible:

```verify
if grep -nE '^\s*(dispositions|deferred_filings|security_followup_input|verify_report),\s*$' .claude/workflows/review-fix.js; then echo "FAIL: the forbidden pattern is still present in .claude/workflows/review-fix.js"; exit 1; fi
```

The pack must no longer be teed into the parent's context:

```verify
if grep -n 'tee "tmp/pack-' .claude/skills/review-fix/SKILL.md; then echo "FAIL: the forbidden pattern is still present in .claude/skills/review-fix/SKILL.md"; exit 1; fi
```

### Manual / observe-in-production

**Behavioral parity — the phase must still do exactly what it did.** After each
unit lands, watch the next live `/review-fix` pass on a real PR and confirm, once
and exactly once per run: the `reviewed` marker appears in the node's
`execution.markers`; the follow-up draft tactic nodes are created and land in one
`graph-commit`; and exactly one `<!-- dispatch:review-fix -->` PR comment exists
with the same bucket structure as before. A duplicated comment means Step 6's
marker re-find was broken by the fork; a missing marker means Step 7's inline
sequence was disturbed.

**Resume parity.** Kill a `/review-fix` session after Step 2 returns but before
Step 7 completes, then let the chain re-enter. The re-entry path
(`SKILL.md:196-208`) must still skip Steps 1-6 to Step 7's terminal flush, and
must not post a second PR comment. This is the path most at risk from Unit 2,
because `result` is absent on re-entry and Steps 5/6 are now subagents.

**Detection parity (condition 5).** Compare the finding sets of the first two or
three post-change runs against the pre-change baseline on comparable diffs.
Unit 3 in particular re-implements normalization that a model previously did by
hand — a CodeQL alert class or an npm advisory class that silently stops
appearing is a detection reduction, which condition 5 forbids regardless of the
context savings. If detection drops, revert Unit 3 and re-plan it; do not accept
the trade.

**The context measurement itself.** The baseline is 184,468 avg peak context with
14 of 19 sessions over 150k. Re-measure with the token audit after at least 5
post-change runs have accumulated:

```
.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh --days 7 --json-out tmp/audit.json
jq '[.sessions[] | select(.type=="worker" and (.phases|has("review-fix")))]
    | {n: length,
       avg_peak: (if length==0 then null else (([.[].peak_context]|add)/length|floor) end),
       over_150k: ([.[]|select(.peak_context>150000)]|length),
       max_peak: ([.[].peak_context]|max)}' tmp/audit.json
```

`aggregate-usage.sh` classifies a `/review-fix` parent worker as `type=="worker"`
(`aggregate-usage.sh:308-320`) and exposes `peak_context` per session
(`:322`, `:799`); the `phases` map (`:803`) keys by attribution skill. Targets:
`avg_peak` materially below 184,468, and `over_150k` a minority of `n`.

Two caveats on reading that number. First, per-turn attribution is currently
breached — 75% of review-worker turns fall to `<none>` — so the `phases` filter
undercounts sessions; cross-check the count against the number of PRs that
actually reached `reviewed` in the window before drawing a conclusion. Second,
the number is not comparable across the attribution fix; see "Interaction to
watch".

**Return-payload size.** The Workflow's return must be under roughly 2k tokens in
every run — down from a measured 26,074-63,531 chars in 11 of 19. After Unit 2,
inspect `tmp/review-result-<node-id>/result.json` on a live run: its size is the
payload that used to cross into the parent, and the parent's own turn recording
the Workflow return should now be a few hundred bytes.

## needs-main residue

Filed by `/qa-fix` on PR #3025 (2026-08-03). Four items could not be verified
in-session: three require post-merge live-run data, and the fourth (item-12) is
a planned-deferral re-confirmation classified `needs-main` by the Step 3.5
disposition Workflow rather than dropped as already-satisfied. Drained by
`tactic-main-qa-phase` after `review → main-qa` fires (post-merge).

### item-12-live-run-parity-reconfirm — needs-main residue filing (items 13/14/15) survives through the qa-fix attempt-2 commits
- URL path: current
- Expected outcome: the three items above were re-homed by Unit 7 onto
  `tactic-mainqa-review-skill-body-decomposition-machine` and remain
  present, unmodified, and discoverable THERE, while item-12 itself remains
  here — so `tactic-main-qa-phase` still finds all four post-merge, now
  across the two nodes rather than in this one section.
- Finding: confirmed present and unmodified in the qa-fix session's own working
  tree as of attempt 2/3 — but this recovery commit is the first time the
  section actually lands on `origin/main`: the original filing (local commit
  91862e5a) was never pushed/merged to `origin/main`, so this append also
  restores items 13/14/15, not only item-12.
- Verifiability: MACHINE
- Check: `grep -c '^- \*\*item-1[345]-' intentions/tactic-mainqa-review-skill-body-decomposition-machine.md` — expect `3`; and `grep -c '^### item-12-' intentions/tactic-review-skill-body-decomposition.md` — expect `1`. Four asserted in total, unchanged from the pre-migration `expect 4`: Unit 7 MOVED items 13/14/15, it did not drop them, so this check still fails if any of the four disappears.

### item-16-post-reimplementation-reconfirm — needs-main residue (items 12/13/14/15) survives the scope-drift demotion and re-implementation cycle
- URL path: current
- Expected outcome: items 13 (context reduction), 14 (resume parity) and 15 (detection parity) were re-homed by Unit 7 onto `tactic-mainqa-review-skill-body-decomposition-machine` and remain present and unmodified there; items 12 (their prior survival confirmation) and 16 remain here. All five survived the scope-drift demotion and re-implementation cycle, so `tactic-main-qa-phase` still finds all five post-merge, now across the two nodes rather than in this one section.
- Finding: confirmed present and unmodified at `origin/main` as of this qa-fix pass (a fresh 15-item triage authored against the re-implemented code, same three units/design as the original filing). This pass's own independent triage separately verified: the two new scan scripts (`dispatch-review-codeql`, `dispatch-review-npm-audit`) match the pre-change `inline-scans.md` prose with no detected narrowing, and the Workflow's own detection machinery (instrument gate, adversarial-verify vote counts, disposition buckets) is unchanged — both were classified `already-satisfied` by the Step 3.5 disposition Workflow and dropped as PASS, so neither required a new needs-main entry. Only the live-run context-reduction measurement (this pass's own triage item, re-classified `needs-main`) remains genuinely un-verifiable pre-merge, and it duplicates item-13 above rather than warranting a sixth distinct entry.
- Verifiability: MACHINE
- Check: `grep -c '^- \*\*item-1[345]-' intentions/tactic-mainqa-review-skill-body-decomposition-machine.md` — expect `3`; and `grep -c '^### item-1[26]-' intentions/tactic-review-skill-body-decomposition.md` — expect `2`. Five asserted in total, unchanged from the pre-migration `expect 5`.
