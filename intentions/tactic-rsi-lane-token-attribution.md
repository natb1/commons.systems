---
id: tactic-rsi-lane-token-attribution
kind: tactic
statement: Make rsi-family session spend attributable in /rsi-audit — widen
  transcript discovery from two directory-name shapes to the repo's project-dir
  prefix, and add the rsi family to the whole-session attribution allowlist — so
  the strategy's per-workflow spend condition can be read at all
owner: ai
status: codified
parent: null
rationale: "Drafted 2026-08-11 from the /rsi-research dry run; finalized and
  re-measured 2026-08-18. The strategy's fit function is value per token with
  spend attributed across dispatch, office-hours and rsi, and its threshold
  requires consecutive /rsi-audit windows to keep dispatch dominating that fold.
  The fold is unreadable today, and the 2026-08-18 re-measurement CORRECTS the
  draft's account of why. The draft blamed aggregate-usage.sh's hardcoded
  worker_skills allowlist, which carries no rsi-family skill. That is real but
  secondary: per-turn attributionSkill coverage on rsi sessions is partial and
  erratic, not absent (measured across the 11 real /rsi transcripts: one at
  96/96 tagged, one at 0/483, the rest mixed). The BINDING defect is discovery —
  aggregate-usage.sh only scans project directories named *worktrees* or
  *--bare*, and dispatch-ladder-run spawns every /rsi eval with --cwd
  PROJECT_ROOT (the main checkout), so all 11 transcripts have never been
  scanned at any scope in any window. A worker_skills-only fix would have
  changed nothing observable. Two further draft premises are retired here:
  bucketing already landed correctly (spend.ts maps rsi to the dispatch bucket
  per strategy clarification 41, rsi-audit to the rsi bucket), and the
  research-lane half of the original statement has no carrier at all (no
  /rsi-research skill, no cron wrapper), so it is deferred to
  tactic-rsi-research-skill as a recorded design constraint rather than built
  blind."
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: an /rsi-audit run over a window containing rsi-family sessions
    reports their spend in the buckets WORKFLOW_SKILLS already defines — /rsi
    under dispatch, /rsi-audit under rsi — where before the change those
    transcripts were not scanned at all, so window.files_scanned read 0 for them
    at every scope
  sensor: .claude/skills/rsi-audit/scripts/aggregate-usage.sh —
    window.files_scanned, the new window.project_prefix and
    window.project_dirs_scanned fields, by_phase, and the <none> bucket's
    price_proxy_usd, read at --session scope over a named /rsi transcript whose
    own totals are recorded independently from the transcript; then
    packages/intentionsutil/scripts/attribute-spend.ts over a fleet aggregate
    for the rendered dispatch/office-hours/rsi/other fold
  threshold: "a named /rsi session reading window.files_scanned == 0 before the
    change reads files_scanned > 0 after it, with its spend under
    by_phase[\"rsi\"] within 10% of that session's independently recorded
    totals; and the allowlist half is grand-total invariant — the amount leaving
    <none> equals the amount arriving in the rsi bucket. A bucket that populates
    while <none> holds steady is double-counting, which refutes the change
    rather than partially satisfying it. NOT a threshold on the rendered rsi
    SHARE: attributing /rsi turns raises the DISPATCH share by design (strategy
    clarification 41), so the draft's original 'rsi's share stops reading 0.0%'
    clause is retired as falsified."
  is_proxy: false
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  reference:
    source: endogenous -- the 2026-08-11 /rsi-research dry run (spec correction C5
      on tactic-rsi-research-skill) and the 2026-08-11 queue_summary reading on
      strategy-recursive-self-improvement
    claimed_effect: "the recorded per-workflow spend attribution is unreadable for
      the rsi family, so the conditions written against it cannot be evaluated.
      Re-measured 2026-08-18: the cause is transcript DISCOVERY (the
      *worktrees*/*--bare* project-dir glob never reaching the main-checkout
      project dir where every ladder-spawned /rsi session lands), with the
      worker_skills allowlist a secondary partial-coverage gap. The
      research-lane half of the original claim is unbuilt and deferred."
    confidence: measured in this harness, not imported; re-measured 2026-08-18
      against all 11 real /rsi transcripts, which corrected the draft's stated
      mechanism
  priority: P0 -- prerequisite for the measurement tactics drafted alongside it;
    the strategy's per-workflow spend threshold is unreadable until it lands
---
# Make rsi-family session spend attributable in `/rsi-audit`, so the strategy's per-workflow spend condition can be read at all

## Context

`strategy-recursive-self-improvement`'s fitness function is value per token **with spend attributed across dispatch, office-hours, and rsi**, and its threshold requires that "consecutive /rsi-audit windows keep dispatch dominating the per-workflow fold". Today that fold cannot be read, because the instrument that produces it never reads the transcripts in question.

### What was already true, and what has changed since this node was drafted

This node was drafted 2026-08-11, before the 2026-08-13 rsi collapse (PR 3074). Three of its original premises are now corrected on the record:

1. **Path drift.** The audit script moved: `.claude/skills/dispatch-token-audit/` no longer exists. Everything lives under `.claude/skills/rsi-audit/scripts/`.
2. **Bucketing is already correct and needs no change.** `packages/intentionsutil/src/spend.ts:53-107` (`WORKFLOW_SKILLS`) already maps `"rsi" → dispatch` (line ~88, with the rationale inline) and `"rsi-audit" → rsi` (line ~106). This matches strategy clarification 41: /rsi's spend belongs in the **dispatch** bucket by design (the ladder spawns it, it fires once per phase, so it scales with dispatch volume — bucketed under rsi the "rsi spend approaching dispatch" deviation trigger would fire permanently and mean nothing); `/rsi-audit` is what the rsi bucket counts. The original draft's framing — "bucket rsi as rsi" — is **wrong and is retired here**. The defect is not the mapping. The defect is that no `by_phase` key named `rsi` or `rsi-audit` ever reaches the mapping.
3. **`render-rsi-plan.ts` and `rsi-plan.md` were deleted** in the collapse. The fold is now rendered by `packages/intentionsutil/scripts/attribute-spend.ts` and read as a sensor segment by `readWorkflowSpend` in `packages/intentionsutil/scripts/read-sensors.ts:1544-1601`. Neither needs a change once the buckets populate.

### The measured root cause (re-measured 2026-08-18, on this host)

There are **two** independent blockers, and the draft only named one.

**Blocker A — discovery. This is the binding one.** `aggregate-usage.sh:1456-1459` is the entire discovery surface:

```
find "$PROJECTS_ROOT" -mindepth 1 -maxdepth 1 -type d \
  \( -name '*worktrees*' -o -name '*--bare' \) -print0 \
| xargs -0 -r -I{} env TZ=UTC find {} -name '*.jsonl' -newermt "$SINCE" ! -newermt "$UNTIL" -print0
```

`--session` / `--node` filters (`:1421-1441`) are applied only to files this `find` already yielded, so a transcript outside those two directory-name shapes is unreachable **at every scope**.

`dispatch-ladder-run:418,647-656` spawns every /rsi eval with `--cwd "$PROJECT_ROOT"` where `PROJECT_ROOT` is `resolve_main_worktree` (`lib-graph-worktree.sh:27-38`) — the **main checkout**. Claude Code keys a session's transcript directory on launch cwd, and `/rsi`'s SKILL.md never enters a worktree. So every ladder-spawned /rsi transcript lands in the project dir `-home-n8-natb1-commons-systems`, whose name contains neither `worktrees` nor `--bare`.

Measured: 11 transcripts in that directory carry a first-user `<command-name>/rsi</command-name>` block. **Zero of them have ever been scanned by the audit, at any scope, in any window.**

**Blocker B — whole-session re-key.** `worker_skills` (`aggregate-usage.sh:446-448`) contains no rsi-family entry:

```
def worker_skills: ["plan-issue","implement","qa-fix","review-fix","fix-checks",
  "fix-conflicts","dispatch-conflict","qa-main","budget-parse-job","resolve-epic",
  "office-hours","align-strategy","align-tactics","align-init","align"];
```

That single list is consumed twice — by the session-type classifier (`:498`, a first-user command match types the session `"worker"`) and by whole-session attribution (`:519,529`, folding every turn onto `$launch_skill`). `worker_cmd_re` (`:449`) is built mechanically by `join("|")`, so extending the array is the entire mechanism; the trailing `</command-name>` literal makes the `rsi` / `rsi-audit` alternation unambiguous, exactly as the existing `align` / `align-tactics` pair already is.

The draft asserted that *every* rsi turn falls to `<none>` for want of this list. **Measurement refutes that as a general claim** and shows why the fix is still needed: per-turn `attributionSkill` coverage on rsi sessions is *partial and erratic*. Across the 11 sessions — `96 rsi / 0 none`, `99 rsi / 161 none`, `67/27`, `81/83`, `73/4`, `23/0`, `95/0`, `65/40`, `110/0`, and one session at **`0 rsi / 483 none`**. So Blocker B is real but is a partial-coverage repair, not a total one; Blocker A is what makes the whole population invisible.

The 2026-08-11 `queue_summary` reading on the strategy recorded the visible symptom faithfully — rsi's 7d share rendering 0.0% with `<none>` the largest single bucket at 4747.37 price proxy over 12008 turns — and the current strategy reading still shows `dispatch 91% / office-hours 0% / rsi 0% / other 9%`. That reading is not a measurement of rsi spend; it is a measurement of what the instrument happens to look at.

### The research-lane half: no carrier, out of scope

The draft's statement also covers the research lane. Confirmed 2026-08-18: **`/rsi-research` does not exist** — `.claude/skills/` contains only `rsi` and `rsi-audit`, there is no cron wrapper and no scheduled harness job, and `intentions/tactic-rsi-research-skill.md` is the sole repo-wide reference. Strategy condition 4 says the same ("the lane remains UNBUILT"). There is nothing to attribute and nothing to verify, so this plan does not build lane attribution; it records the design constraint below so the lane is born measurable.

The draft's proposed mechanism for the lane is also **not reusable as written**. `<stem>.file-issue-attribution.json` (read at `aggregate-usage.sh:1411-1418` under `--exclude-sidecar-sessions`) is an **exclusion** sidecar belonging to the retired `/file-issue` skill (`.claude/skills/file-issue/scripts/file-issue-usage-snapshot`) — present means *drop the session from every bucket*, the opposite of labelling it. Reusing it would delete lane spend from the fold rather than attribute it.

**Design constraint recorded for `tactic-rsi-research-skill` (carry forward; do not implement here):** the lane becomes attributable with a one-line `worker_skills` addition and a one-line `WORKFLOW_SKILLS` addition **iff** its cron wrapper spawns it (a) with a first user message of the form `<command-name>/rsi-research</command-name>`, and (b) with a cwd under the repo root, so Unit 1's discovery prefix covers it. Its bucket is `rsi` under `WORKFLOW_SKILLS` (condition 3 compares the lane's spend against dispatch, which requires it to be its own visible share, and the lane is the harness improving itself, not dispatch measuring itself). The draft's separate observation still stands and must be designed around: the lane's real cost sits in nested `subagents/workflows/wf_*/agent-*.jsonl` under an anonymous headless session id — the measured dry-run cycle was 108 subagents, ~364k output + ~44.7M cache-read tokens. `aggregate-usage.sh:1397-1407` already resolves a nested subagent transcript to its **parent** stem for every sidecar-keyed check, so nested spend folds onto the parent session correctly once the parent is discovered and typed.

### Intended outcome

After this change, an `/rsi-audit` run over any window reports rsi-family spend in the buckets `spend.ts` already defines, `attribute-spend.ts` prints a fold whose rows are not silently missing a whole workflow, and the strategy's per-workflow spend condition becomes readable and falsifiable for the first time.

### Out of scope (explicit)

- **What the audit measures, its pricing model, or any bucket semantics.** This tactic makes existing spend *visible*; it does not reduce it and does not re-bucket anything.
- **Per-turn `attributionSkill` emission.** That is harness-supplied at runtime and is out of reach from `aggregate-usage.sh` (see `intentions/tactic-token-audit-whole-session-phase-attribution.md`).
- **`--node` scoping for rsi-eval sessions.** `stamp-dispatch-session.sh` (`.claude/hooks/`, the sole caller of `dispatch-stamp-session` Mode A, wired at `.claude/settings.json:111-117`) gates on branch and explicitly excludes `main` — so a ladder-spawned /rsi session running in the main checkout gets no `.dispatch-stamp.json`, and `--node` returns nothing for it. That is a separate, upstream defect already recorded by `tactic-eval-finding-ladder-worker-unstamped-audit-blind`. Fleet-scope attribution — what this strategy's threshold actually reads — does not depend on it.
- **Minting or editing any other graph node.** Note for a future round only, no action here: `tactic-eval-finding-align-tactics-worker-transcript-unscanned` (status raw, phase null) records Blocker A from the align-tactics angle and proposes the same glob widen as "the smaller change" that "also fixes the strategy lane, which has the same shape". Landing Unit 1 closes that finding's mechanism too; it should be recur-merged, not double-fixed.

---

## Unit 1 — Widen transcript discovery from two name shapes to a repo-derived project-dir prefix

### Scope

**Changes** — `.claude/skills/rsi-audit/scripts/aggregate-usage.sh`:

- **`:1456-1459`** — replace the `\( -name '*worktrees*' -o -name '*--bare' \)` predicate with a prefix predicate over a single resolved variable: match a directory whose name is **exactly** `$PROJECT_PREFIX` **or** begins with `$PROJECT_PREFIX-`. Keep the surrounding `find … -print0 | xargs -0 -r -I{} env TZ=UTC find {} -name '*.jsonl' -newermt … -print0` pipeline unchanged.
  - The `-` separator matters: `<prefix>` alone is the main checkout, `<prefix>--bare` is the router/heartbeat dir, `<prefix>--claude-worktrees-<name>` is each worktree — all three begin with `<prefix>-` or equal `<prefix>`. A neighbouring project such as `-home-n8-commons-systems` or `-home-n8` does **not**, and stays excluded. A bare `startswith` without the `-` would falsely capture a sibling repo named with the prefix as a substring.
- **Near `:187`** (`PROJECTS_ROOT="${DISPATCH_AUDIT_PROJECTS_ROOT:-$HOME/.claude/projects}"`) — add the prefix resolution:
  - `PROJECT_PREFIX="${DISPATCH_AUDIT_PROJECT_PREFIX:-$(…derive…)}"`. Use `:-` so the derivation runs **only** when the override is unset — the test harness must never shell out to git.
  - Derivation: take the **main** repo root, not the invoking checkout. `SCRIPT_DIR` is already computed at `:136`; resolve the checkout root as `$SCRIPT_DIR/../../../..`, then take `dirname "$(git -C "<checkout root>" rev-parse --path-format=absolute --git-common-dir)"`. In this repo's standard layout `.git` is a real directory at the main root, so `--git-common-dir` resolves to `<main>/.git` from a worktree too. Encode the resulting absolute path the way Claude Code names project dirs: replace `/` and `.` with `-` (`tr '/.' '--'`), e.g. `/home/n8/natb1/commons.systems` → `-home-n8-natb1-commons-systems`, and `<main>/.claude/worktrees/X` → `-home-n8-natb1-commons-systems--claude-worktrees-X`. Verified against the live directory names on this host.
  - Per `.claude/rules/code-style.md`: if the git call fails or the derived prefix is empty, `echo` a descriptive error to stderr and `exit 2`. **No fallback to the old glob** — a silent fallback would reproduce exactly the invisible-undercount this unit exists to remove.
- **`:1475-1499`** — add two fields to **both** branches of the `WINDOW_JSON` assembly (unbounded and fixed-days): `project_prefix` (the resolved string) and `project_dirs_scanned` (count of candidate directories the `find` yielded). This makes the document self-describing about what it looked at — the property whose absence hid this defect for months. Count the directories in the same `find` pass or a cheap sibling call; do not restructure the pipeline for it. `audit-aggregate-writer.mjs` projects a fixed field list from `window` (`:278-283`) and ignores extras, so no writer change is needed.
- **`:9-18`** — rewrite the `WHAT IT SCANS` header block: it currently documents "Two kinds are scanned: per-issue worktree dirs whose name matches `*worktrees*`; the router/heartbeat dir whose name matches `*--bare`". Replace with the prefix rule, name `DISPATCH_AUDIT_PROJECT_PREFIX` as the test/override seam alongside the existing `DISPATCH_AUDIT_PROJECTS_ROOT` entry at `:49`, and state plainly that the main-checkout project directory is now in scope and why (dispatch spawns ladder evals and the align phases with `--cwd $PROJECT_ROOT`).

**Changes** — `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh`:

- In `setup()` (from `:103`) and in **every** other fixture root that exports `DISPATCH_AUDIT_PROJECTS_ROOT` (`:265, 682, 699, 720, 740, 757, 810, 866, 915`, and the later lens roots — grep the file for `DISPATCH_AUDIT_PROJECTS_ROOT` and cover all of them), also `export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"`. Every fixture project directory in the file already begins with `-home-x` (verified: `-home-x--bare`, `-home-x-worktrees-999-fixture`, and ~26 siblings), so all existing assertions keep passing unchanged.
- Add a **new fixture directory with no `worktrees` and no `--bare` in its name** — e.g. `$ROOT/-home-x-main-checkout` — holding one session transcript with usage. Assert that its turns appear in the aggregate. The suite today has no such directory by construction, which is precisely why Blocker A was never regression-guarded; this fixture is the guard.
- Add an assertion that a directory **outside** the prefix (e.g. `$ROOT/-home-y-other-project`) is **not** scanned, and one that `-home-xzz-neighbour` (prefix as substring, no `-` separator) is **not** scanned.
- Assert `window.project_prefix` and `window.project_dirs_scanned` are present and correct on at least one existing fixture run.

**Not in scope for this unit:** any change to `worker_skills`, to bucket mapping, or to which cwd a spawner uses. Changing `dispatch-ladder-run`'s `--cwd` is explicitly rejected — /rsi reads the graph at main and needs the main checkout; widening the reader is the smaller and more general change, and it is the one the sibling finding independently recommended.

### Recommended model

opus

---

## Unit 2 — Add the rsi family to `worker_skills` so untagged rsi turns re-key onto their launch skill

### Scope

**Changes** — `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:446-448`: add `"rsi"` and `"rsi-audit"` to the `worker_skills` array. That is the whole mechanism — `worker_cmd_re` at `:449` is built from the array by `join("|")`, the classifier at `:498` and the whole-session fold at `:519,529` both read it, and the comment block at `:440-445` already declares the list the single source that must be updated when a skill joins the set. Update that comment so it names the rsi family rather than implying dispatch phase skills only.

Confirmed against real transcripts: a ladder-spawned /rsi session's **first** `type=="user"` message content is exactly `<command-name>/rsi</command-name>` (preceded only by non-user metadata lines — `last-prompt`, `custom-title`, `agent-name`, `mode`, `permission-mode`, `file-history-snapshot` — which `$firstuser` already skips). Alternation ordering is safe: the trailing `</command-name>` literal forces `rsi-audit` to win over `rsi` by backtracking, the same way `align-tactics` already coexists with `align`.

**Changes** — `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh`, two new fixtures modelled exactly on the existing `implement` worker fixture at `:107-170`:

1. **Whole-session re-key.** In the new main-checkout-shaped directory from Unit 1, write `sess-rsi.jsonl` whose line 1 is `{"type":"user","message":{"content":"<command-name>/rsi</command-name>"}}` followed by assistant turns carrying usage, **with `attributionSkill` absent or `"<none>"` on most of them** — this mirrors the measured worst case (one real session: 483 turns, 0 tagged). Assert `by_phase["rsi"].turns` and `.cost_usd` equal the hand-computed totals, and assert `by_phase["<none>"]` does **not** absorb those turns. Also assert `sessions[].whole_session_attributed == true` for it (the flag emitted at `:691`).
2. **Multi-phase guard.** A session whose first-user command is `<command-name>/align</command-name>` but which carries **both** `align` and `rsi` per-turn attributions — this shape exists in the wild (one real main-checkout session: 248 `align` + 101 `rsi` turns). `$tagged_phase_skills` has length 2, so `$whole_session` must be **false** and per-turn attribution must be preserved. Assert both buckets keep their own turns and `whole_session_attributed == false`. Without `rsi` in `worker_skills` this session would silently fold whole onto `align`; the guard is what stops it, and it is only armed once `rsi` is listed.

**Invariance assertion (the refutation condition, made mechanical).** Re-keying is a pure relabel of the same rows (`:529` — "same turns, same per-turn models, same usage objects"). Assert that the aggregate's grand totals — total turns and total price proxy — are **identical** with and without the fixture's per-turn tags, i.e. the amount that leaves `<none>` equals the amount that arrives in `rsi`. A bucket that populates while `<none>` holds steady is double counting, not attribution, and that is a refutation of the change rather than a partial success.

### Recommended model

sonnet

### Dependencies

Unit 1 (its fixtures live in the main-checkout-shaped directory Unit 1 introduces, and the realistic /rsi case is unreachable without Unit 1's discovery widen).

---

## Unit 3 — Map `dispatch-ladder` into the dispatch bucket so the widened fold is not distorted by its own driver

### Scope

**Changes** — `packages/intentionsutil/src/spend.ts:56-89`: add `"dispatch-ladder"` to the `dispatch` array, next to the existing `"rsi"` entry and its explanatory comment. The ladder is the driver that spawns the evaluator; leaving the driver in `other` while its evaluator sits in `dispatch` is incoherent, and the file's own doc comment (`:45-52`) states the map "must be extended when a new skill joins one of the three workflows".

Measured tag histogram for the newly-discovered main-checkout directory: `<none>` 19308, `align-tactics` 13083, `align-strategy` 2002, `dispatch-conflict` 1714, `align` 1510, `rsi` 810, `dispatch-invalid-state` 474, **`dispatch-ladder` 332**, `dispatch-diagnose-main` 199, `dataviz` 131, `artifact-design` 124, `office-hours` 120, `artifact-capabilities` 120, `fix-checks` 110, `dispatch-emulate` 104, `implement` 62, `update-config` 14. Every one of these except `dispatch-ladder`, `dispatch-emulate`, and the author-tooling skills is already mapped.

- **`dispatch-emulate` is deliberately NOT added.** It has no carrier anywhere in the tree (no skill directory, no workflow, no command) — it is a retired name, and mapping a skill that cannot recur would be dead configuration.
- **`dataviz`, `artifact-design`, `artifact-capabilities`, `update-config` are deliberately NOT added.** They are author tooling, not one of the three workflows, and `other` is rendered rather than dropped by design (`spend.ts:49-52`).

**Changes** — `packages/intentionsutil/test/spend.test.ts` (mapping assertions at `:7-13`): add `expect(workflowOfSkill("dispatch-ladder")).toBe("dispatch")`, and one assertion that an author-tooling skill (e.g. `"dataviz"`) still resolves to `"other"` — so the "other is a rendered remainder, not a dumping ground" contract stays explicit.

**Not in scope:** any change to `attributeSpend`, `spendDeviation`, `renderSpendFold`, or `read-sensors.ts`. `spendDeviation` (`attribute-spend.ts:90-108`) already excludes `other` from rivalry and already documents that a large `other` means the map needs extending rather than that a workflow is outspending dispatch — that behaviour is correct and stays.

### Recommended model

sonnet

---

## Reuse

- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:446-449` — `worker_skills` / `worker_cmd_re`. Extending the array is the whole of Unit 2; the regex is derived mechanically and needs no separate edit.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:498,504,519,529,691` — the existing session-type classifier, `$launch_skill` capture, multi-phase guard, `$arows` re-key, and `whole_session_attributed` output flag. No new attribution mechanism is introduced by any unit.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1397-1407` — `session_stem` resolution, which already folds a nested subagent transcript onto its parent session for every sidecar-keyed check. Reuse as-is; it is what will make the future research lane's 108-subagent cost fold onto the lane session once that lane exists.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:136,187` — existing `SCRIPT_DIR` and `PROJECTS_ROOT`/`DISPATCH_AUDIT_PROJECTS_ROOT` env-override pattern. `DISPATCH_AUDIT_PROJECT_PREFIX` follows the identical shape; do not invent a different override convention.
- `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh` — the hand-rolled `assert_eq` / `assert_close` harness (`:20-53`), the `mktemp` fixture-tree builder (`setup()` from `:103`), and the `implement` worker fixture (`:107-170`) as the template for both new fixtures. No test framework is introduced.
- `packages/intentionsutil/src/spend.ts:53-107,114,124-148` — `WORKFLOW_SKILLS`, `workflowOfSkill`, `attributeSpend`. Already correct for `rsi` and `rsi-audit`; Unit 3 adds one array entry and nothing else.
- `packages/intentionsutil/scripts/attribute-spend.ts` — the fold renderer and deviation check. Unchanged; it is the read surface used in Verification.
- `packages/intentionsutil/scripts/read-sensors.ts:1544-1601` — `readWorkflowSpend` / `readRsiReading` / `rsiSensor`. Unchanged. Note for anyone tempted to touch it: `RSI_SENSOR_NAME` is the full verbatim `success_signal.sensor` prose string from `intentions/strategy-recursive-self-improvement.md` frontmatter — do not shorten or paraphrase it, or the sensor silently de-registers.
- `.claude/skills/rsi-audit/scripts/audit-aggregate-writer.mjs:278-283` — projects a fixed `window` field list, so Unit 1's two new fields need no writer change.

## Verification

Auto-runnable:

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

```verify
npm test --prefix packages/intentionsutil
```

Manual, and this is the acceptance test that makes the change falsifiable — a **measured comparison against known sessions**, run at three states:

1. Pick two real /rsi transcripts in the main-checkout project directory. Find them with `grep -rl "command-name>/rsi<" ~/.claude/projects/-home-n8-natb1-commons-systems/`. Choose one that is **fully per-turn tagged** and one that is **entirely untagged** (as of 2026-08-18: `b61e836b-6d73-4155-bb6f-0615cd363770` at 96/96 tagged, and `bf613665-ca83-4081-8ecd-18bb106d5345` at 0/483 tagged; if reaping has removed them, re-select by running `jq -r 'select(.type=="assistant") | .attributionSkill // "<none>"' <file> | sort | uniq -c` over the grep hits). Record each session's own totals independently from its transcript.
2. **Before any change**, run `aggregate-usage.sh --session <id>` for each. Expected: `window.files_scanned == 0` for both — the pre-change baseline is not "understated", it is *nothing*, which is the observation that justifies this tactic.
3. **After Unit 1**, re-run both. Expected: `files_scanned > 0`; `window.project_prefix` names the encoded main repo root; the tagged session's spend appears under `by_phase["rsi"]` within 10% of the independently recorded totals; the untagged session's spend appears under `by_phase["<none>"]`.
4. **After Unit 2**, re-run both. Expected: both sessions report entirely under `by_phase["rsi"]`; `by_phase["<none>"]` for the untagged session drops to approximately zero; and the **grand totals are unchanged from step 3**. If the `rsi` bucket populates but `<none>` does not shrink by the corresponding amount, the change is double-counting rather than attributing — that is a refutation, not a partial success.
5. **Fleet read.** Run `aggregate-usage.sh --days 7 --json-out /tmp/usage-audit.json`, then `npx tsx packages/intentionsutil/scripts/attribute-spend.ts /tmp/usage-audit.json`. Expected: a four-row fold plus TOTAL, with a non-zero rsi row (from any `/rsi-audit` runs in the window) and dispatch carrying the /rsi evals. Record the printed fold in the round's notes.

Judgment calls and caveats to observe, not to automate:

- **The widen is a one-time step change, not a marginal correction.** The main-checkout directory alone holds roughly 19.3k untagged turns plus 13k `align-tactics`, 2k `align-strategy`, and 1.7k `dispatch-conflict` turns that no window has ever counted. Every fleet figure — totals, shares, medians, the `other` row — moves discontinuously at this commit. Windows measured before and after are **not comparable**, and any persisted aggregate written under `DISPATCH_AUDIT_AGGREGATES_ENABLED` before this change should be read as a different instrument. Say so explicitly wherever the next reading is recorded.
- **Watch the `other` row after step 5.** `other` is a rendered remainder by design and is excluded from `spendDeviation`'s rivalry check, so a large `other` cannot produce a false deviation flag — but it does mean `WORKFLOW_SKILLS` wants extending. Unit 3 removes the one clearly-misfiled entry (`dispatch-ladder`). If `other` is still material after that, record what dominates it as an observation for the next round; do not reach for further mappings inside this tactic.
- **Do not read `--node` results for rsi-eval sessions as evidence of anything.** They have no `.dispatch-stamp.json` (the SessionStart hook's branch gate excludes `main`), so `--node` returns zero files for them regardless of these units. That is `tactic-eval-finding-ladder-worker-unstamped-audit-blind`'s territory.
- **The project-dir encoding rule** (`/` and `.` → `-`) was verified against the live directory names on this host only. If the derivation ever produces a prefix that matches no directory on a machine where sessions demonstrably exist, that is a bug in the derivation, not an empty window — Unit 1's `project_dirs_scanned` field is what makes the difference visible.
