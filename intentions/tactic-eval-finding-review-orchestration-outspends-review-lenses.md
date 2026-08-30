---
id: tactic-eval-finding-review-orchestration-outspends-review-lenses
kind: tactic
statement: The review phase orchestrator session itself consumed 109 turns and
  37.47 dollars of the phase 76.09 dollar price proxy — 2.7 times what all five
  review lenses spent combined — because roughly 830 of the 1026 second phase is
  fixed setup, hand-off and marker plumbing that does not scale down with the
  delta, so a 1-file +2/-2 comment-only re-review spent 82 percent of its cost
  outside the review itself and returned 0 actionable findings
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications:
  - question: What is the phase status of the three sibling entries this node's body
      carves out of its own scope, and does that change what this node's
      verification may claim?
    answer: "(Recorded 2026-08-19 /align-tactics per-node finalize.) Carve-out
      status at planning time: the three component entries this node body
      excludes from its own scope are at mixed phases —
      tactic-eval-finding-review-fix-workflow-args-rederived-each-pass is phase
      implement (in flight, covers the ~100s of re-deriving the Workflow arg
      contract), while
      tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-\
      lane and tactic-eval-finding-workflow-file-writes-cost-subagent-roundtrips
      are both still phase null (unplanned drafts). The carve-out stands
      regardless — this node's scope remains the orchestrator's own Step 1
      classifier sequence and Step 7 marker/sidecar/envelope tail — but roughly
      270s and $5.50 of the measured 830s/$62 will NOT be recovered by this node
      landing, so its verification must not claim them."
  - question: The body records as an open question whether the orchestrator's script
      sequence can be collapsed, deferring it to the skill that owns the
      decision. Is an author ruling actually owed?
    answer: "(Verified 2026-08-19 against the live files during the /align-tactics
      per-node finalize.) The 'open question' this entry records — whether the
      orchestrator's script sequence can be collapsed — is answerable from
      existing precedent rather than by an author ruling. The collapse sites are
      still open: review-fix/SKILL.md issues Step 1's classifier scripts as
      separate sequential calls at lines 67 (dispatch-derive-node-target), 132
      (dispatch-context-pack/dispatch-pack-scalars), 298-299
      (dispatch-changed-files | dispatch-security-surface), 312
      (dispatch-api-call-site), 333 (dispatch-review-base) and 346
      (dispatch-blast-radius); and Step 7's terminal tail is duplicated
      near-verbatim between review-fix/references/terminal-actions.md and
      qa-fix/references/terminal-disposition.md. The repo already carries three
      collapse precedents to reuse rather than reinvent: dispatch-context-pack
      (its own header states it collapses a phase skill's 4-8 call live-state
      preamble into a single scripted call), dispatch-finalize-phase (five
      ordered steps behind one idempotent call), and dispatch-pack-scalars'
      key=value stdout convention parsed by the shared `sed -n 's/^key=//p'`
      idiom. Because the Step 7 tail is shared boilerplate, any wrapper built
      for it should be shared with qa-fix rather than review-fix-only;
      implement/SKILL.md:125-126,246-247 is the precedent that a
      phase-appropriate reduced tail is already accepted. New sibling scripts
      are auto-tested by a matching test-dispatch-<name>.sh under the same
      scripts directory (run-unit-tests.sh:186-204) with no separate
      registration."
  - question: May the statement's 2.7-to-1 orchestrator-vs-lenses ratio be used as
      this node's verification target?
    answer: (Recorded 2026-08-19 /align-tactics per-node finalize.) The measured
      ratio in this entry's statement is a moving baseline and must not be used
      as this node's verification target. The '2.7 times what all five review
      lenses spent combined' figure rests on a $13.72 five-lens denominator that
      tactic-review-domain-lens-consolidation and
      tactic-review-api-cost-lens-merge (both phase main-qa) are actively
      shrinking by merging the lens roster, and
      tactic-rsi-lane-token-attribution (phase implement) is revising the
      rsi-family attribution methodology that produced the price-proxy numbers.
      What this node remediates — the ~830s/$62 fixed orchestration floor that
      does not scale down with the delta — is independent of both, so
      verification should measure the floor directly (script invocations and
      setup wall clock at Step 1 and Step 7 on a minimal delta) rather than
      attempting to reproduce the ratio.
  - question: This node still carries attributes.ledger_entry and a rationale naming
      dispatch-eval-finding, both retired by the strategy on 2026-08-14. Are
      they fixed here?
    answer: "(Recorded 2026-08-19 /align-tactics per-node finalize.) This node's
      frontmatter marker and rationale are stale against the strategy's
      2026-08-14 amendment and are left for their own carriers rather than fixed
      here: attributes.ledger_entry as a class marker and dispatch-eval-finding
      as a writer private to strategy-recursive-self-improvement were both
      retired that date (clarification 33's amendment; condition 21), with
      tactic-eval-finding-ledger (phase implement) owning the retirement and
      tactic-finding-search-all-producers (phase null) owning the single
      find-or-recur surface. Nothing in this node's plan depends on that
      migration. The one consequence that does bind: durability now keys on the
      node CARRYING attributes.measured_impact — never prune a node that holds
      measurements — so this node's eleven measured_impact entries must survive
      its transition to done, so that a later recurrence resumes
      recurrence_count rather than restarting at 1."
  - question: Does this entry duplicate
      tactic-eval-finding-review-plan-cheapen-requires-unanimity, given both
      were surfaced from the same measured episode?
    answer: "(Recorded 2026-08-19 /align-tactics per-node finalize, resolving the
      gather scan's near-duplicate flag.) The overlap with
      tactic-eval-finding-review-plan-cheapen-requires-unanimity (phase done) is
      real but already reconciled and is NOT the duplicate-root-cause defect
      this strategy's success_signal measures. Both entries were surfaced from
      the SAME measured episode — the 2026-08-13 review phase of
      tactic-attention-namespaced-rank, PR #3075/#3088, a 1-file +2/-2
      comment-only delta costing $76.09 price proxy, 248 turns, 0 actionable
      findings — but they attribute it to two distinct root causes and this
      node's body already cross-references the other by name: the sibling owns
      the DEPTH question (review-plan cheapens only on unanimity, so one raise
      signal pinned effort at high), and this node owns the FLOOR (the ~830s/$62
      of setup, hand-off and marker plumbing paid before and after any reviewer
      runs, independent of the effort level chosen). Because they share one
      episode, their projected savings must not be summed: the sibling's fix
      reduces reviewer spend within the $13.72 lens denominator, this node's
      reduces the $62 orchestration floor, and the $76.09 total is the shared
      ceiling for both."
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: phase_price_proxy_usd
      value: 76.09
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: orchestrator_session_price_proxy_usd
      value: 37.47
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: review_lens_price_proxy_usd
      value: 13.72
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: review_share_of_phase_price
      value: 18
      unit: percent
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: phase_turns
      value: 248
      unit: turns
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: review_wall_clock_s
      value: 205
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: orchestration_wall_clock_s
      value: 830
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: phase_elapsed_s
      value: 1026
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: findings_actionable
      value: 0
      unit: findings
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: review-fix result.json
      measured: 2026-08-14
    - metric: delta_changed_files
      value: 1
      unit: files
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: dispatch-review-base
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
## Observed (the measurement this node exists to carry)

`tactic-attention-namespaced-rank`, phase `review`, ladder run started
2026-08-13T22:44:24Z, phase launched 22:44:48Z, `awaited/reviewed` 23:01:54Z
with `elapsed_s=1026 await_repolls=0 window_s=1800`.

This was the first live run of the narrowed re-review base (PR #3088,
`a272ea9c`). The narrowing worked: `review_base_source=sidecar-rebased`,
`target=3cc80c54..HEAD`, delta **1 file, +2/-2, comment-only**
(`packages/intentionsutil/test/store.test.ts`). The unnarrowed review would have
been 23 files; the naive two-dot range would have been 70.

Against that 4-line delta the phase spent, per `aggregate-usage.sh --node` with
the `--since 1786661064` selection (17 sessions):

| | turns | price proxy |
| --- | --- | --- |
| **orchestrator worker** (`launch_skill=review-fix`) | **109** | **$37.47** |
| the 5 review lenses (Lane B fan-out, opus) | 50 | $13.72 |
| `/review-plan` Opus pre-pass | 15 | $3.92 |
| `/code-review` detached pre-stage | 25 | $3.88 |
| 7 post-processing / plumbing subagents | 26 | $12.44 |
| PR-comment composer | 23 | $4.65 |
| **phase total** | **248** | **$76.09** ($18.09 cost) |

**The orchestrator session alone outspends every reviewer combined, 2.7 to 1.**
Only $13.72 of $76.09 — 18% — was spent looking at the diff.

Wall clock divides the same way. From the worker transcript
(`6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`, 328 entries, 41 Bash calls, 2 Agent,
1 Workflow), 22:44:35 → 23:01:50:

- ~205s actual review depth — 101s `/code-review` pre-stage
  (`wall_clock_s=101` in its own `summary.txt`) + 104s of parallel Lane B lenses
  (22:53:07 → 22:54:51).
- ~830s orchestration: 173s Step 1 setup (15 Bash calls),
  108s `/review-plan`, 100s re-deriving the Workflow arg contract,
  ~113s of Workflow plumbing subagents, 78s PR-comment composition,
  70s phase-log rework, 66s `transition-node`, 27s sidecar + envelope.

None of that 830s scales with delta size. At the 3h26m / 32-subagent incident
this plan was written to fix, the floor was invisible. On a 4-line delta it is
**80% of the runtime and 82% of the spend**.

Yield for the whole $76.09: **10 findings surfaced, 0 actionable, 0 fixes**
(`result.json`: `findings_surfaced=10 findings_actionable=0 fixes_applied=0`,
all 10 dispositioned `Informational`).

### Evidence a later session cannot rediscover

- Worker transcript: `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl` under
  `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/`.
- Workflow journal + 12 subagent transcripts:
  `.../6b9f36ea-.../subagents/workflows/wf_ffefa101-347/`.
- `result.json` and `summary.txt` under the node worktree's
  `tmp/review-result-*` and `tmp/code-review-*` — both are worktree-local and
  will not survive a sweep.

---

## Context

### What this node is, and is not

The subject is `/review-fix`'s own **orchestration floor** — the cost the phase
pays *before and after* any reviewer runs. It is **not** the review-*depth*
question, which is settled and closed on
`tactic-eval-finding-review-plan-cheapen-requires-unanimity` (phase `done`). Do
not reopen depth.

`strategy-recursive-self-improvement`'s rationale (amended 2026-08-14) cites this
node's numbers verbatim — "830 of 1026 seconds and $37.47 of $76.09 spent outside
a review that returned 0 actionable findings" — as evidence for cost-gating the
`/rsi` evaluator's trigger. That is a cross-application of the *number* to a
different subject. It does **not** discharge this node, whose subject is
`/review-fix`'s own floor. Do not treat the strategy amendment as the fix.

### The root cause, stated mechanically

Claude Code's Bash tool **does not persist shell state between calls** — working
directory persists, environment variables and shell functions do not. Every
variable `.claude/skills/review-fix/SKILL.md` binds in one fenced block
(`$MERGE_BASE`, `$PR_NUM`, `$N`, `$REVIEW_BASE`, `$SURFACE_OUT`, …) is gone by
the next Bash call. There are **five separate `bash` fences before Step 2** —
`SKILL.md:51` (branch split + front door), `:115` (context-pack + pack-scalars),
`:143` (scalar parsing), `:214` (`dispatch-stamp-session`, needs a sandbox
override so it cannot merge with its neighbours), `:291` (the Step 1 scans) —
and they are variable-coupled across the boundary. The orchestrator's only two
options are to concatenate them into one enormous call or to **re-derive**. The
measured 15 Bash calls at Step 1, and the observed three `dispatch-derive-node-target`
invocations, are that re-derivation.

The greenfield answer is therefore not "batch the prose harder". It is: **the
phase's derived context lives in a file on disk, not in shell variables** — one
compound emitter writes `key=value` lines once, and every later step re-reads
them with the established `sed -n 's/^key=//p'` idiom. That is exactly the shape
`dispatch-context-pack` already proved (its own header: it collapses "a phase
skill's 4-8 call live-state preamble into a single scripted call") and that
`dispatch-pack-scalars` already proved for the emitter half. This plan extends
that precedent to the half of Step 0/1 it has not yet reached. No brownfield
migration path is needed: the change is confined to one skill's prose plus one
new sibling script, and it is backwards-compatible because it binds the same
variable names the rest of the skill already reads.

### What is already discharged — do NOT re-plan these

Verified against this worktree at `origin/main` on 2026-08-19. Locate by symbol
and heading; `.claude/skills/review-fix/SKILL.md` is 1328 lines today and moves
every round.

- **The context pack is ALREADY COLLAPSED.** The "Idempotency preamble"
  (~`SKILL.md:43`) states the single `dispatch-context-pack --pr --diff` call
  "replaces both the old idempotency PR fetch and Step 1's diff capture", and
  Step 1 (~`SKILL.md:275`) forbids a fresh `git fetch` / `git diff` for the diff
  text.
- **The third `dispatch-derive-node-target` call ("purely to re-extract
  `PR_NUM`") is ALREADY PREVENTED.** The preamble makes ONE call
  (~`SKILL.md:67`), captures stdout as `DERIVE_OUT`, and parses `PR_NUM`,
  `NODE_JSON`, `NODE_BODY` from that same payload; ~`SKILL.md:139` says "Do not
  re-resolve any of these later".

### Sibling carve-outs — do NOT touch these files or re-plan their scope

- `tactic-eval-finding-review-fix-workflow-args-rederived-each-pass`
  (`status: codified`, `phase: implement`) owns `ARGS_CONTRACT` in
  **`.claude/workflows/review-fix.js`** and the SKILL-side args blocks pointing
  at it. **`.claude/workflows/review-fix.js` is a decoy for this node — leave it
  alone.**
- `tactic-eval-finding-workflow-file-writes-cost-subagent-roundtrips`
  (`phase: null`) owns the "subagents that exist only to write result JSON" cost.
- `tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-lane`
  (`phase: null`) owns `dispatch-write-phase-log`'s `<issue-num>` parameter —
  that is **Step 7 item 3**. Unit 3 below carves it out explicitly: item 3 keeps
  its own separate Bash call and its command line is not edited.
- `tactic-eval-finding-detached-code-review-dies-with-launcher`
  (`phase: implement`) owns the detached `/code-review` pre-stage. Do not touch
  `dispatch-code-review` or its lock sidecar.

### Correction to a prior caveat on this node (verified 2026-08-19)

An earlier note on this node claimed skill-directory `test-*.sh` files "are not
auto-discovered" and that a new one "will silently never run in CI". **That is
inverted, and the inversion matters for where a test must be wired.** Measured:

- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-204` runs
  `for test_script in "$SCRIPTS"/test-*.sh` — a **glob**, not a name list —
  skipping only `test-helpers.sh`.
- The same script (`:88`) sets `RUN_PR_SCRIPTS=true` automatically when any
  changed path matches `.claude/skills/dispatch-propagate/scripts/*`.
- `.github/workflows/unit-tests.yml:44` runs `run-unit-tests.sh` on every PR.

So a new `test-*.sh` whose **SUT is inside that scripts dir** is auto-discovered
*and* auto-triggered. The real hole is the opposite one, and it is documented in
place at `.github/workflows/unit-tests.yml:233-241`: suites whose SUT lives
**outside** that directory (`.claude/workflows/*.js`, `.claude/hooks/*.sh`,
`packages/intentionsutil/scripts/*`, and **the doctrine prose of other skills'
`SKILL.md`**) get no `RUN_PR_SCRIPTS` trigger and must be wired **unconditionally
in `unit-tests.yml`** — "Keep this list in sync when adding a suite whose SUT is
outside that scripts dir." Since Units 2 and 3 change `review-fix/SKILL.md`
prose, their prose suite must be wired there.

### Intended outcome

Cut the fixed per-pass orchestrator turn count on the review phase's Step 0/1
and Step 7 bookends, without changing what the phase does, what it reviews, or
what it records. Target: preamble + Step 1 falls from a measured 15 Bash calls
(minimum 5 by construction, plus one guaranteed sandbox-denial retry) to **2**;
the Step 7 clean path falls from 8 ordered calls to **5**.

---

## Unit 1 — Remove the guaranteed sandbox denial in `assert-node-selection`

The front-door call at `review-fix/SKILL.md:~67` runs
`dispatch-derive-node-target`, whose Step 5 calls
`.claude/skills/dispatch-propagate/scripts/assert-node-selection`, which launches
the gate with `npx tsx` at **`assert-node-selection:118`**:

```
GATE_FP=$(cd "$REPO_ROOT" && npx tsx packages/intentionsutil/scripts/check-node-selection.ts \
```

**Reproduced twice in this planning session.** The `npx tsx` CLI opens an IPC
pipe and dies under this sandbox:

```
Error: listen EPERM: operation not permitted /tmp/claude-1000/tsx-1000/17.pipe
    at Server.listen (node:net:2120:5)
    at createIpcServer (.../node_modules/tsx/dist/cli.mjs:53:31515)
```

`assert-node-selection` then exits 1 and `dispatch-derive-node-target` fails.
`review-fix/SKILL.md` carries `dangerouslyDisableSandbox` annotations at many
callsites but **none** on the line-67 front-door call, so a compliant session
runs it sandboxed, is denied, and retries — **one wasted Bash turn on every
single review pass**, and the first of the three `dispatch-derive-node-target`
calls the measurement counted.

### Scope

**Change:** `.claude/skills/dispatch-propagate/scripts/assert-node-selection:118`
— swap the launcher from `npx tsx` to the sandbox-safe
`node --import tsx/esm` form. Keep everything else about the line identical:
the `cd "$REPO_ROOT" &&` prefix, the argument list, the `GATE_FP=$(...)` capture,
and the deliberate absence of `set -e` around it (`GATE_RC=$?` at `:119` and the
`case` on `0 | 12|13 | *` at `:121-133` must keep working byte-for-byte).

Add a short comment above the line recording *why* the launcher form is
load-bearing (the EPERM above), so a later edit does not swap it back.

**Why (b), not (a).** The two candidates were: (a) annotate the review-fix
callsite with `dangerouslyDisableSandbox: true`; (b) fix the launcher. (b) is
chosen and (a) is rejected on three measured grounds:

1. **(b) is verified to work.** Probed sandboxed in this planning session:
   `node --import tsx/esm packages/intentionsutil/scripts/check-node-selection.ts`
   returns the script's own usage line and exits cleanly. `npx tsx` on the same
   file dies EPERM.
2. **(b) has direct in-family precedent.** `dispatch-derive-node-target:179`
   (its own Step 4) already uses `node --import tsx/esm -e '...'`. And
   `graph-commit`'s `run_merge_node()` already made exactly this migration —
   recorded verbatim at `packages/intentionsutil/scripts/test-transition-node.sh:309-311`:
   "`node --import tsx/esm` (previously `npx tsx`)".
3. **(b) is strictly wider and needs no rule change.** It removes the denial for
   every caller of `assert-node-selection`, not just review-fix. (a) would need a
   matching entry in `.claude/rules/sandbox.md`, whose own text says an
   always-on override "carries no signal" — adding a pre-emptive override for a
   fixable cause is the anti-pattern that file names.

**Also change:** `.claude/rules/sandbox.md` — add one short subsection under the
existing exceptions material recording the general fact: `npx tsx` opens an IPC
pipe under `/tmp/claude-*/tsx-*/` and dies `EPERM` in this sandbox; use
`node --import tsx/esm <script>` instead of adding a pre-emptive override. Keep
it to a few lines and match the file's existing voice.

**Out of scope.** Five other `npx tsx` callsites carry the same latent defect —
`dispatch-invalid-state-followup:378,449`, `dispatch-graph-main-red-sync:175,177`,
`dispatch-invalid-state-route:369`, `dispatch-fleet-alarm:307,312`, and
`packages/intentionsutil/scripts/office-hours-graph:212,241,285`. **Do not sweep
them in this unit.** They sit on lanes this node does not own, and
`dispatch-fleet-alarm`'s form is an env-var-overridable `CMD` array whose tests
stub `npx` by name (`test-dispatch-fleet-alarm.sh:138,185`;
`test-dispatch-graph-main-red-sync.sh:83`) — changing the default would break
those stubs for zero benefit on this node's measured subject. Recorded here as a
standing observation for a future finding, not as work.

Also out of scope: `dispatch-derive-node-target`'s exit-code contract (0–5) and
the `review-fix/SKILL.md` `case` that branches on it — unchanged.

**Recommended model:** sonnet

---

## Unit 2 — `dispatch-review-scan`: one compound emitter for the Step 0/1 derived context

### Scope

**New file:** `.claude/skills/dispatch-propagate/scripts/dispatch-review-scan`
(executable, `#!/usr/bin/env bash`), sited beside `dispatch-pack-scalars` as a
sibling, following that script's header convention exactly: a `Usage:` line,
then a bulleted list naming **every** `key=value` line it emits and when each is
omitted, then an anchoring/security block.

**Invocation shape** (arguments, not inherited shell state — that is the whole
point):

```
dispatch-review-scan --n <N> --target-kind <issue|node> --pr-num <PR> \
  --out tmp/review-scan-<N>.env
```

It performs, internally and in this order, exactly what
`review-fix/SKILL.md:115-360` performs today across four fences:

1. `dispatch-context-pack "$PACK_TARGET" --pr --phase-log --diff [--pr-is-number]`
   → `tmp/pack-<N>.txt` (`--pr-is-number` on the node lane only, per the existing
   `case "$TARGET_KIND"` at `SKILL.md:~150`).
2. `dispatch-pack-scalars --phase-log-out tmp/phase-log-in-<N>.md < tmp/pack-<N>.txt`.
3. `dispatch-stamp-session --backfill-pr "$PR_NUM"` (non-fatal; the script exits
   0 on any miss — preserve that).
4. `MERGE_BASE=$(git merge-base HEAD origin/main)`.
5. `dispatch-changed-files < tmp/pack-<N>.txt | dispatch-security-surface`.
6. `git diff "$MERGE_BASE"...HEAD | dispatch-api-call-site`.
7. `git rev-parse HEAD` → `reviewed_head`.
8. `dispatch-review-base --merge-base "$MERGE_BASE"`.
9. `git diff "$REVIEW_BASE"..HEAD | dispatch-blast-radius`.
10. `git diff --name-only "$REVIEW_BASE"..HEAD` → repeated
    `review_changed_file=<path>` lines (the repeated-line convention
    `dispatch-pack-scalars` already uses for `closes_issue=`).

Steps 6 and 9 are the only two full-diff traversals; today there are **three**
(`SKILL.md:311`, `:346`, `:360`) plus the pack's own. Step 10 reuses step 9's
range with `--name-only`, which is cheap; do not add a third content traversal.

**Emitted keys** — the union of every variable Step 1 binds today, so the rest of
the skill reads the same names:

`pr_num`, `labels`, `closes_issue` (0..n), `phase_log` **or** `phase_log_path`
(exactly one), `changed_file_count`, `pack_path`, `merge_base`, `surface`,
`deps`, `app_or_rules`, `api_call_site`, `reviewed_head`, `review_base`,
`review_base_source`, `review_base_recorded` (sidecar-rebased only),
`blast_radius_file` (0..n), `blast_radius_truncated`, `blast_radius_generic`,
`review_changed_file` (0..n).

`blast_radius_generic` is **mandatory, not optional detail** — the reasoning at
`SKILL.md:349-353` is load-bearing and must be carried into the new script's
header: a symbol dropped as too-widely-referenced produces no reading-list entry
and does *not* set `truncated`, so without it a delta that changes a shared
helper looks byte-identical to one with no out-of-diff callers at all.

**Four hard constraints the implementation MUST preserve** (each already
documented in place; carry the reasoning into the new script's header):

- **`merge_base` is computed by a direct `git merge-base HEAD origin/main` and is
  NEVER parsed from the pack's `=== DIFF (base <sha>) ===` header** (#1522 — a
  forged header in an attacker-controlled PR body must not reach the
  dependency-audit baseline). See `SKILL.md:275-281` and
  `dispatch-pack-scalars:34-40`.
- **The diff TEXT never enters the orchestrator's context.** The pack stays on
  disk; every classifier is fed by a pipe and yields scalars. The output file
  contains scalars and paths only — never diff hunks, never PR body text beyond
  the scalars `dispatch-pack-scalars` already extracts.
- **The output file is PARSED, never `source`d.** Its values derive from
  attacker-controllable PR text, and the Bash tool runs zsh. Consumers use
  `sed -n 's/^key=//p'` — the idiom `dispatch-security-surface` and
  `SKILL.md:140-148` already use. Say this explicitly in the script header.
- **SIGPIPE discipline on piped diffs.** Follow `dispatch-api-call-site:37-46`
  (`grep -cE ... || true`, never `-qE`) and `dispatch-blast-radius:133-140,196-199`
  (`awk NR<=n`, never `head -n N`). Under `pipefail` a short-circuiting reader on
  a large diff turns exit 141 into a false negative.

`pr_num=none` handling is unchanged in meaning: the pack exits 0 either way and
the no-PR condition is detected by the scalar, never by exit code
(`SKILL.md:~152`). The script propagates that scalar; the **skill** keeps the
hard stop.

**Sandbox:** one callsite, `dangerouslyDisableSandbox: true` — `dispatch-context-pack`
calls `gh` (network) and `dispatch-stamp-session` writes under
`~/.claude/projects`, outside the write-allowlist. Every other internal step is
read-only git or pure stdin. Document this on the `Usage:` line.

**Edited file:** `.claude/skills/review-fix/SKILL.md`.

- The front door at `~:51-139` (`dispatch-derive-node-target`, its exit-code
  `case`, and the `DERIVE_OUT` parse for `PR_NUM`/`NODE_JSON`/`NODE_BODY`) stays
  **exactly as it is** — its 0/1/2/3/4/5 contract drives six distinct
  skill-level dispositions and must not be folded into the scan.
- Replace the four fences at `~:115`, `~:143`, `~:214` and `~:291` with **one**
  `dispatch-review-scan` call plus **one** parse block that binds the same
  variable names Step 2 onward already reads: `MERGE_BASE`, `PACK_PR_NUM`,
  `LABELS`, `CLOSES_ISSUES`, `PHASE_LOG_PATH`, `surface`, `deps`,
  `app_or_rules`, `api_call_site`, `REVIEWED_HEAD`, `REVIEW_BASE`,
  `REVIEW_BASE_SOURCE`, `REVIEW_BASE_RECORDED`, `blast_radius_files`,
  `blast_radius_truncated`, `blast_radius_generic`, `review_changed_files`.
  Downstream consumers at `SKILL.md:409-423`, `:438-439`, `:461-465`, `:875-894`
  and `:1274-1302` are **not** edited — they must keep working unchanged.
- Add one paragraph stating the file-not-shell-variables rule for later steps:
  re-read `tmp/review-scan-$N.env` with `sed -n 's/^key=//p'` rather than
  assuming a variable survived the last Bash call.
- Keep the "Re-entry check" prose at `~:219-232` intact — it reads `LABELS` /
  `NODE_JSON`, both still bound.
- Preserve the `REVIEWED_HEAD` semantics note at `SKILL.md:1298-1307` verbatim:
  it is the **Step 1** HEAD, recorded at Step 7, precisely because Lane A's
  `--fix` and Lane B's fix fan-out commit *during* the pass.

**New file:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-review-scan.sh`
— sources `dispatch-test-fixture.sh` (`SCRIPT_DIR`, `assert_eq`,
`report_results`, PR/pack builders) and follows the fixture-then-`assert_eq`
shape of `test-dispatch-pack-scalars.sh` / `test-dispatch-changed-files.sh`. Must
cover, at minimum: every key present on a normal pack; the `pr_num=none` path;
the `phase_log=` vs `phase_log_path=` exclusivity; repeated
`review_changed_file=`/`blast_radius_file=` lines; `blast_radius_generic` emitted
even when `blast_radius_truncated` is false; and a **poisoned-pack fixture** in
which the PR body contains a forged `=== DIFF (base <forged-sha>) ===` header,
asserting `merge_base` is the real `git merge-base` and not the forged sha. SUT
is inside the scripts dir, so this file is auto-discovered — no wiring needed.

**New file:** `.claude/skills/dispatch-propagate/scripts/test-review-fix-orchestration-floor.sh`
— prose assertions over `.claude/skills/review-fix/SKILL.md`. For this unit:
assert the region between the "Idempotency preamble" heading and the "### 2."
heading contains **at most two** `dispatch-review-scan`-or-front-door script
invocations and **no** direct `dispatch-context-pack`, `dispatch-pack-scalars`,
`dispatch-changed-files`, `dispatch-api-call-site`, `dispatch-blast-radius` or
`dispatch-review-base --merge-base` callsite; and assert the `#1522` merge-base
prohibition sentence still appears. Model it on `test-review-fix-diff-context.sh`.

**Wiring:** because this suite's SUT (`review-fix/SKILL.md`) is **outside** the
scripts dir, add it to `.github/workflows/unit-tests.yml` beside the existing
`Run review-fix …` steps (~lines 243-260), per the in-file instruction at
`:233-241`.

**Out of scope:** `.claude/workflows/review-fix.js` (sibling-owned); the Workflow
arg contract; `/review-plan`; `dispatch-code-review`; anything in Step 2–6.

**Recommended model:** opus

**Dependencies:** Unit 1 (the front door must be sandbox-clean before the call
count is re-measured; otherwise the retry turn masks the saving).

---

## Unit 3 — Batch the Step 7 terminal tail into four ordered Bash calls

### Scope

**Edited files:** `.claude/skills/review-fix/SKILL.md` "### 7. Gate on local
lint, apply the terminal label, then write the marker (or park on deviation)"
(~`:1249-1318`) and `.claude/skills/review-fix/references/terminal-actions.md`.

This is a **prose-only** change: it edits how the eight items are grouped into
Bash calls. No script is edited, no flag changes, no ordering changes.

The eight items today are: (1) flush unpushed commits, (2) `run-lint.sh`,
(3) phase-log write, (4) `dispatch-complete-phase`, (5) `dispatch-review-base --record`,
(6) `dispatch-mark-complete` / `dispatch-mark-deviation`, (7) `dispatch-emit-outcome`,
(8) `dispatch-finalize-phase`. Group them on the **clean, no-deviation** path as:

- **Call A (sandboxed):** items 1 + 2. Both sandboxed
  (`terminal-actions.md:28-29,54`). Item 2's `run-lint.sh` result gates items 4
  and 6; the model reads it from the combined output. Red still means fix and
  re-run — **never mark**, per `.claude/rules/test-integrity.md`. Keep
  `terminal-actions.md:54-57`'s instruction that a sandbox-shaped failure
  (`EROFS`, read-only) is retried with the override while a real non-zero exit is
  a genuine red.
- **Item 3 stays its own call**, unbatched and with its command line untouched —
  carved out for `tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-lane`.
  It must still PRECEDE item 4.
- **Call B (`dangerouslyDisableSandbox: true`):** items 4 + 5. Both already
  require the override (`terminal-actions.md:163`; `SKILL.md:1281-1290` — the
  `.review-base` sidecar is written *beside* the worktree, which nothing mounts).
  Item 5 is non-fatal: log and continue.
- **Call C (sandboxed):** items 6 + 7. `dispatch-emit-outcome` is pure and must
  stay sandboxed (`terminal-actions.md:251-253,312-313`).
- **Call D (`dangerouslyDisableSandbox: true`):** item 8 alone, and **absolutely
  last** — it self-closes the session (`terminal-actions.md:347`).

**Hard constraints on the batching — state each in the edited prose:**

- **Ordering is unchanged.** 1→2→3→4→5→6→7→8. Batching groups adjacent items; it
  never reorders them.
- **Sandbox mode may not be mixed within one call.** A and C are sandboxed; B and
  D carry the override. This is why the grouping is 2/1/2/2/1 and not one call.
- **Conditionality is unchanged.** Items 2, 3, 5 and 7 run **only when the
  Workflow ran this session** and are skipped on re-entry. On the re-entry path
  Call A degrades to item 1 alone, Call B to item 4 alone, Call C to item 6
  alone. Say this explicitly — a batched call must not silently run a
  re-entry-skipped item. `REVIEWED_HEAD` does not exist on re-entry
  (`SKILL.md:1291-1297`); substituting the current HEAD is a silent permanent
  review hole and remains forbidden.
- **The deviation path is NOT batched.** When `result.deviation === true`, item 6
  becomes the three-action recommend sequence (Opus recommendation subagent →
  `dispatch-write-recommendation` → `dispatch-mark-deviation`,
  `terminal-actions.md:202-207`), and item 8 does not run at all. Leave that
  branch's call structure exactly as it is, including the redaction discipline at
  `terminal-actions.md:222-240`.

**Extend** `test-review-fix-orchestration-floor.sh` (created in Unit 2) with a
structural assertion that all eight numbered items still appear in Step 7 in
order, each still naming its script — so a future batching edit cannot silently
drop one. Assert the ordered sequence of the eight script/command tokens, not
merely that each appears somewhere.

**Out of scope:** any change to `dispatch-write-phase-log`'s invocation or its
`<issue-num>` parameter; `dispatch-finalize-phase`'s internals;
`escalation-recommend.md`.

**Recommended model:** sonnet

**Dependencies:** Unit 2 (creates the shared prose suite and its `unit-tests.yml`
wiring; Unit 3 extends both).

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-pack-scalars:1-368` — the
  canonical compound `key=value` emitter and the header-documentation convention
  (`Usage:` line, then a bulleted list of every emitted key and when it is
  omitted, then the anchoring rules). `dispatch-review-scan` follows this shape
  and is sited beside it.
- `.claude/skills/dispatch-propagate/scripts/dispatch-context-pack:1-4` — the
  precedent for exactly this collapse: its header states it folds "a phase
  skill's 4-8 call live-state preamble into a single scripted call". Called by
  `dispatch-review-scan`, not reimplemented.
- `.claude/skills/dispatch-propagate/scripts/dispatch-changed-files:1-43`,
  `dispatch-security-surface:1-119`, `dispatch-api-call-site:1-53`,
  `dispatch-blast-radius:1-214`, `dispatch-review-base:1-265` — all five are
  **called** by the new script, never reimplemented. `dispatch-api-call-site:37-46`
  and `dispatch-blast-radius:133-140,196-199` are the SIGPIPE idioms to copy.
- `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target:179` —
  the in-family `node --import tsx/esm -e '...'` launcher form Unit 1 adopts.
- `packages/intentionsutil/scripts/test-transition-node.sh:309-311` — the
  recorded precedent that `graph-commit` already made this same launcher
  migration for `merge-node.ts`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:1-40` —
  `SCRIPT_DIR`, `assert_eq`, `report_results`, PR/rollup builders; sourced by
  every `test-dispatch-*.sh`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-pack-scalars.sh` and
  `test-dispatch-changed-files.sh` — the poisoned-pack fixture idiom to reuse for
  the forged-`=== DIFF (base …) ===` case.
- `.claude/skills/dispatch-propagate/scripts/test-review-fix-diff-context.sh:1-121`
  — the model for a prose-assertion suite over a review-fix surface, including
  its own note on why such coverage must live in an unconditionally-wired suite.
- `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh:11-17`
  — runs the SUT **in place** so it invokes the real gate with no `npx`/`gh`
  stubbing; this is why Unit 1's launcher swap is genuinely exercised by it.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,186-204` and
  `.github/workflows/unit-tests.yml:44,233-260` — the discovery/wiring facts
  above.
- `.claude/skills/dispatch-propagate/scripts/run-lint.sh` and `run-unit-tests.sh`
  — the existing local gates; run both before pushing.

---

## Verification

### Auto-runnable

Unit 1 — the negated grep **fails today** (`assert-node-selection:118` contains
`npx tsx`), so it is not a vacuous assertion:

```verify
if grep -n 'npx tsx' .claude/skills/dispatch-propagate/scripts/assert-node-selection; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/assert-node-selection"; exit 1; fi
grep -n 'node --import tsx/esm' .claude/skills/dispatch-propagate/scripts/assert-node-selection || exit 1
.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh
```

Unit 2:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-review-scan.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-review-fix-orchestration-floor.sh || exit 1
grep -n 'test-review-fix-orchestration-floor.sh' .github/workflows/unit-tests.yml
```

Unit 3 (the same suite, extended with the Step 7 ordering assertion):

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-orchestration-floor.sh
```

Whole-change gates, both run from the worktree root:

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts || exit 1
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

`run-lint.sh` also runs `.github/scripts/check-type-safety-escapes.sh` and
`lint-prose-rules.sh`. The latter mechanically enforces the
`echo "$JSON" | jq` prohibition on net-new added lines in committed `.sh` files —
`dispatch-review-scan` and its test must use `<<<"$VAR"`, `printf '%s'`, or a
direct pipe (see `.claude/rules/shell-json.md`).

### Manual and observe-in-production

1. **Confirm the sandbox denial is gone (Unit 1).** From a worktree root, run
   `node --import tsx/esm packages/intentionsutil/scripts/check-node-selection.ts`
   with **no** `dangerouslyDisableSandbox`. It must print its usage line, not an
   `EPERM ... .pipe` stack. Then run `dispatch-derive-node-target <node-id>
   --expect-phase review --pr-mode required` sandboxed against a real node and
   confirm it no longer needs a retry. Before this change the same probe with
   `npx tsx` dies at `Server.listen` with
   `EPERM: operation not permitted /tmp/claude-1000/tsx-1000/<n>.pipe`.

2. **Confirm the compound scan is behaviour-preserving (Unit 2).** On a real
   worktree with an open PR at phase `review`, run the *old* Step 1 fences by
   hand and capture every bound variable, then run `dispatch-review-scan` and
   diff its `tmp/review-scan-<N>.env` against those values. `merge_base`,
   `review_base`, `review_base_source`, `surface`, `deps`, `app_or_rules`,
   `api_call_site`, `reviewed_head` and the `review_changed_file` set must match
   exactly. A mismatch on `review_base_source` in particular means the sidecar
   resolution moved and the narrowed re-review is at risk — that is a hard stop,
   not a nit.

3. **Confirm the diff text stayed out of context (Unit 2).** Inspect
   `tmp/review-scan-<N>.env` and confirm it contains only `key=value` lines —
   no diff hunks, no `+`/`-` lines, no PR body prose. This is the property the
   pipe-through-a-classifier discipline exists to hold.

4. **Confirm Step 7 still completes in order (Unit 3).** Watch one real review
   phase reach terminus and check the phase artifacts in order: the
   `dispatch:reviewed` label (or node marker) applied, the `.review-base`
   sidecar written beside the worktree, the completion marker present, the
   outcome envelope emitted, and the session self-closed last. Then force the
   re-entry path (re-run the skill on an already-`reviewed` PR) and confirm
   items 2, 3, 5 and 7 are skipped and nothing in the batched calls ran them.

5. **Re-measure the floor.** After all three units land, run
   `aggregate-usage.sh --node <node-id>` over the next review phase and compare
   the orchestrator worker's turn count against the 109-turn baseline recorded
   above. The target is preamble + Step 1 at **2** Bash calls (front door, then
   scan) versus a measured 15, and the Step 7 clean path at **5** versus 8.
   Report the delta as a measured recurrence update on this node rather than as
   a new node.

6. **Judgment call the implementer owns.** If the compound-scan diff comparison
   in step 2 cannot be made to match exactly — most likely on the
   `sidecar-rebased` path, where `dispatch-review-base` creates a *synthetic*
   merge commit and so is not idempotent across two invocations — do **not**
   loosen the assertion. Compare `review_base_source` and `review_base_recorded`
   (which are stable) rather than the synthetic `review_base` sha, and record why
   in the test's header.

7. **Committing under `.claude/`.** Units 1–3 edit files under
   `.claude/skills/`, `.claude/rules/` and `.github/workflows/`, which sit in the
   sandbox's read-only carve-outs for tree-updating operations. `Write`/`Edit`
   work; the **commit** may be refused. Retry the commit with
   `dangerouslyDisableSandbox: true` if it fails read-only — do not pre-empt it.
