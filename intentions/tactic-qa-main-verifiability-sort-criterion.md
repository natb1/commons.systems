---
id: tactic-qa-main-verifiability-sort-criterion
kind: tactic
statement: qa-main's cannot-verify branch sorts needs-main residue on whether an
  item is reachable by Claude-in-Chrome rather than on whether it is
  machine-verifiable at all, so every git, journal, log or shell check that the
  browser tool cannot perform is parked to office_hours as cannot-verify —
  waking the author for items no author is needed for, and producing exactly the
  mis-sort the graph's own greenfield design calls a mis-sort by construction
owner: ai
status: codified
parent: null
rationale: "The bootstrap plan recorded this as an open seam with no owning
  node; this node is that owner. On 2026-07-31 four office_hours parks were
  opened by /qa-main on four different nodes, and all four gave the same reason
  — 'not browser-verifiable', typically adding that url_path is the placeholder
  'current' rather than a real route. All four were then machine-verified in a
  single session with journalctl, ls, jq, git show and grep, no browser and no
  author input. Results: tactic-frozen-session-debug-count item 10 PASS on eight
  consecutive dispatch-sweep log lines;
  tactic-router-spawn-window-duplicate-worker items 9 and 10 PASS, item 10 on
  direct live-ledger observation during a real spawn window;
  tactic-standdown-winner-liveness item 1 PASS on 21 post-merge tick sweeps.
  Only two of the seven items across those four nodes were genuinely
  author-required — a defaults ruling and a contract-surface ruling — and both
  were answered by the author in minutes once separated from the research the
  machine could do. So the sort produced roughly five false parks out of seven
  items. The graph's greenfield design is explicit that this is the wrong
  predicate. This node's earlier office_hours park was drained after two
  2026-07-31 /align-strategy interviews recorded expressly to unblock it
  (intentions/strategy-graph-native-dispatch.md:3507-3572, ratifying the
  corrected predicate and the owner sort mark; :3573-3640, ratifying the WAIT
  third outcome; :3792 onward, the calendar-release amendment) — these interview
  citations supersede this node's own earlier, now-stale line citations into
  that same file (a growing file whose line numbers do not survive same-day
  sibling edits; the earlier citations pointed at :2192-2229 and :3182-3188
  ranges that have since shifted and must not be trusted by a future reader).
  RULINGS, verbatim in substance: (1) WHERE THE SORT MARK LIVES — no new field,
  no schema change: the existing required-core owner field is the mark (owner:
  ai = machine-verifiable, owner: human = author-required), already live and
  correct on standalone tactic-mainqa-* nodes; interim, while a source tactic
  still carries a '## needs-main residue' body section, each residue bullet
  carries an explicit Verifiability: sub-line (MACHINE|AUTHOR|WAIT), a
  convention that retires with that section. (2) THE PREDICATE IS CORRECTED — an
  item is author-required ONLY IF it cannot be machine-checked at all; a git,
  journal, log, shell or filesystem check that no browser can perform is
  MACHINE, not AUTHOR; a park reason citing browser-reachability must be
  REJECTED by the lane rather than written. The LIVE predicate sites to correct
  are qa-main/SKILL.md (the Step 4.0 triage section) and
  qa-fix/references/needs-main-followups.md (the node-target-lane framing and
  the autonomous|human routing criteria) — and explicitly NOT
  dispatch-main-qa-triage, which is dead code on the node lane (its only
  remaining caller sits in the retired legacy issue lane). SCOPE BOUNDARY: the
  WAIT hold mechanism itself (the router.ts:343-355 draft-candidate exclusion,
  the dispatch-sweep predicate, the attempts/cap counter, re-arm) is OUT OF
  SCOPE here — it is owned by sibling tactic-wait-calendar-release (unplanned as
  of this round). This tactic lands the sort MARK and, until that sibling lands,
  routes its WAIT outcome to the same terminal action a deploy-lag cannot-verify
  takes today (an office_hours park naming the awaited event), never a
  browser-reachability claim. At least four further sibling nodes carry the same
  misroute and must re-sort the same way once this lands:
  tactic-drain-disposition-diagnosis-cas, tactic-mechanical-park-producers
  (currently parked at phase main-qa under the OLD predicate — a live end-to-end
  fixture for this fix, not necessarily a discrepancy if it drains before this
  merges), tactic-main-post-merge-validation and
  tactic-execution-pr-merge-verification. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is the root cause of a park class that has already stalled at least eight
    nodes in main-qa, each park costing an author interrupt for work a machine
    can do, and the strategy tracks mis-sort rate as a measured threshold.
    blocked_by is empty, so this promotion lifts no blocker and cannot compound.
    Finalized 2026-07-31 via a tactic-target /align-tactics round: status is now
    codified and phase implement, carrying a full clean-session plan (Units 1-3)
    in the body; the boost value is preserved unchanged from the bootstrap
    re-scale."
  tier: 1
phase: main-qa
execution:
  branch: tactic-qa-main-verifiability-sort-criterion
  pr: 3009
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-01T03:17:01Z
    mergeCommitSha: df0c436a655decfddadba7631388bdbfc36667a3
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

## Context

`/qa-main`'s node lane drains a source tactic's `## needs-main residue` body
section after its PR merges. Today it sorts every residue item on **whether the
read-only Claude-in-Chrome flow can reach it**, and routes everything else to
`cannot-verify` → an `office_hours` park. The live sites that encode that
predicate:

- `.claude/skills/qa-main/SKILL.md:112-119` — "residue is pre-triaged verifiable
  … (`qa-fix` Step 3.6 records only machine/browser-verifiable items as
  residue)… **If a residue item nonetheless has no `url_path` or names a
  non-browser outcome, route it straight to cannot-verify below.**"
- `.claude/skills/qa-fix/references/needs-main-followups.md:32-35` — "Only
  machine/browser-verifiable items become residue…"
- `.claude/skills/qa-fix/references/needs-main-followups.md:65-80` — the
  `autonomous` route is defined as "an objective check observable on public
  deployed prod that `/qa-main`'s read-only Claude-in-Chrome flow can perform".

The measured consequence, recorded on this node's own body: on 2026-07-31 four
`/qa-main` parks on four different nodes all gave the same ground ("not
browser-verifiable", usually adding that `url_path` is the placeholder
`current`). All four were then machine-verified in one session with
`journalctl`, `ls`, `jq`, `git show` and `grep` — no browser, no author input.
Of the seven residue items across them, **five were machine-verifiable and were
parked anyway**; two were genuine author rulings, and both were answered in
minutes once the machine-answerable research was separated out and attached.

The graph's own design says this predicate is wrong, and the correction is
already ratified — see `intentions/strategy-graph-native-dispatch.md:3507-3572`
(2026-07-31 `/align-strategy` interview, ratifying the office_hours park on this
node). Its two rulings, verbatim in substance:

1. **Where the sort mark lives.** No new field, no schema change: the existing
   required-core `owner` field is the mark (`owner: ai` = machine-verifiable,
   `owner: human` = author-required). *Interim*, while source tactics still
   carry a `## needs-main residue` body section, one node can carry mixed-class
   items, which a single per-node `owner` cannot express — so **each residue
   bullet carries an explicit `Verifiability:` sub-line valued `MACHINE`,
   `AUTHOR` or `WAIT`**, alongside its existing `Expected outcome:` and
   `Finding:` lines. That interim convention retires with the residue section
   itself.
2. **The predicate is corrected.** "An item is author-required ONLY IF it cannot
   be machine-checked AT ALL. A git, journal, log, shell or filesystem check
   that no browser can perform is MACHINE, not AUTHOR. A park reason citing
   browser-reachability — including the recurring 'url_path names a repo script,
   not a web page' form — must be REJECTED by the lane rather than written."
   And explicitly: correct the **live prose sites** (`qa-main/SKILL.md:112-119`,
   `needs-main-followups.md:32` and `:65-72`) and **not**
   `dispatch-main-qa-triage`, which despite its header is dead code on the node
   lane (`qa-main/SKILL.md:117` skips it; its only caller is the retired issue
   lane).

Intended outcome: a residue item that a shell/git/journal/log/filesystem check
can settle is **verified by this lane**, not parked; only an item that needs
credentials Claude lacks, a subjective product/UX judgment, or the user's
product intent reaches the author — and when it does, it arrives with the
machine-answerable research already done and attached, so the author gives a
yes/no rather than picking up an assignment. The strategy's threshold for this
is at most 1 cannot-verify park in 20 `owner: ai` main-qa nodes
(`intentions/strategy-graph-native-dispatch.md:3530-3533`).

**Scope boundary — the WAIT outcome.** The lane gains a third classification,
`WAIT` (a valid check whose event simply has not happened yet, e.g. deploy lag).
The **hold mechanism** a WAIT routes into is owned by a different node,
`intentions/tactic-wait-calendar-release.md` (raw, unplanned) — the
`attributes.wait_until` sweep predicate, the `attempts`/cap, the re-arm, and the
**required** `packages/intentionsutil/src/router.ts:343-355` draft-candidate
exclusion (verified absent today). That node's own rationale states the split:
"Distinct from tactic-qa-main-verifiability-sort-criterion, which owns the
machine-verifiable-vs-author-required SORT: this node owns the HOLD MECHANISM
the sort's third outcome routes into." **This plan must not implement, duplicate
or pre-empt any of that**, and must not make `/qa-main` mint WAIT hold nodes:
without the router exclusion, every phase-less `office_hours`-null node the lane
minted would be emitted by the router as an `/align-tactics` candidate and spawn
an align worker. Until that node lands, a `WAIT` item takes the same terminal
action a deploy-lag `cannot-verify` takes today (an `office_hours` park), but
with a reason that names the awaited event and the earliest useful re-check —
never a browser-reachability claim. The prose records the one-line change that
flips it to the hold once the mechanism exists.

**Execution-mode constraint — read before starting.** Units 2 and 3 edit files
under `.claude/skills/**`. A dispatch worker running in auto mode cannot commit
those: the auto-mode classifier flags edits to agent-behavior-controlling files
(`SKILL.md`, `.claude/hooks/**`) as self-modification and denies them, and
individual `Edit` calls to those paths can also be denied. Sibling files under
`.claude/skills/**/scripts/` commit fine. So: do **Unit 1 first** (scripts only —
it lands autonomously), and if the classifier blocks Unit 2/3, **park
immediately** naming the file class and asking for a narrow scoped grant — do
not spend retries hunting a workaround (no `sed`, no `Write` detour, no
`/update-config`). Get every protected-path edit into the working tree and
`git add`-ed **before** asking for the grant; do not plan post-grant steps that
require re-editing a protected file.

---

## Unit 1 — `dispatch-mark-node-park`: the node-lane escalation writer that refuses a browser-reachability park reason

**Recommended model:** sonnet

**Dependencies:** none.

### Scope

Two new files, both under `.claude/skills/dispatch-propagate/scripts/` (not a
protected path — this unit commits autonomously):

1. **`dispatch-mark-node-park`** (new, executable, `#!/usr/bin/env bash`).

   Today every node-lane skill hand-writes its escalation markers inline:
   `qa-main/SKILL.md:199-209` says "Write the specific reason to
   `$CLAUDE_JOB_DIR/office-hours-reason` and the best-next-steps recommendation
   … to `$CLAUDE_JOB_DIR/office-hours-recommendation`", and
   `qa-fix/SKILL.md:189-196` says the same plus `office-hours-pr`. There is no
   script for it: `dispatch-mark-deviation` cannot be reused, because its
   primary action is a **gh** in-session `dispatch:office-hours` label park
   resolved from an `<N>-…` branch (see that script's lines 62-76), which the
   node lane forbids ("**No gh issue or label is ever read or written on this
   lane**", `qa-main/SKILL.md:90-93`). This script is the node-lane sibling, and
   it is the single home of the rejected-park-reason predicate — the enforcement
   point the ratified ruling calls for ("REJECTED by the lane rather than
   written").

   Contract:

   ```
   usage: dispatch-mark-node-park [--pr <n>] <reason> <recommendation>
   ```

   - Both positionals are **required and non-empty** — the park-recommendation
     contract (a mechanical park must carry recoverable context: a reason AND a
     best-next-steps recommendation; `office_hours.recommendation` is a
     first-class schema field, see `packages/intentionsutil/scripts/park-node:36-41`).
     Zero args, extra args, or an empty value → **exit 2** with the usage line.
   - `--pr <n>` optional, non-negative integer only (else exit 2); when given,
     write it to `$CLAUDE_JOB_DIR/office-hours-pr` so the park records
     `execution.pr` (tactic-office-hours-pr-custody).
   - **Reason validation (the point of this unit).** Before any write, test
     `<reason>` case-insensitively against a single named array of ERE patterns
     — one array, so the test file can enumerate it:
     - `browser[- ]verifiab` (covers "not browser-verifiable",
       "non-browser-verifiable", "isn't browser verifiable")
     - `non-browser`
     - `no url_path`
     - `url_path[^.]*(placeholder|'current'|"current"|repo script|not a (real )?(web )?page|not a route)`
     - `claude-in-chrome[^.]*(cannot|can not|can't|is unable|has no)`

     On a match: write **nothing**, print to stderr the matched pattern plus the
     corrected predicate and the three re-sorts, and **exit 3**:

     ```
     dispatch-mark-node-park: refusing a park reason whose operative claim is
     browser-reachability (matched: <pattern>). An item is author-required ONLY
     IF it cannot be machine-checked AT ALL — a git, journal, log, shell or
     filesystem check that no browser can perform is MACHINE, not AUTHOR
     (intentions/strategy-graph-native-dispatch.md, 2026-07-31 corrected
     predicate). Re-sort the item: MACHINE -> run the check and verify it here;
     WAIT -> name the awaited event and the earliest useful re-check; AUTHOR ->
     state the credential, subjective-judgment or product-intent barrier that
     makes it uncheckable by any tool. Nothing was written.
     ```

     No override flag: a bypass would let the lane keep writing the reasons this
     node exists to stop (clear errors over defensive fallbacks —
     `.claude/rules/code-style.md`).
   - **Writes.** Atomic tempfile + `mv` per file, exactly as
     `dispatch-mark-deviation:84-88` does, to
     `$CLAUDE_JOB_DIR/office-hours-reason`,
     `$CLAUDE_JOB_DIR/office-hours-recommendation`, and (with `--pr`)
     `$CLAUDE_JOB_DIR/office-hours-pr`. Byte format is one trailing newline per
     file (`printf '%s\n'`) — these bytes are read verbatim by
     `terminal_without_disposition_sweep`
     (`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:1016-1027`),
     which passes them straight to `park-node`.
   - **`CLAUDE_JOB_DIR` guard.** Validation always runs first. When
     `CLAUDE_JOB_DIR` is unset/empty or not a directory this is an interactive
     run: print a stderr note, skip the writes, **exit 0** — mirroring
     `dispatch-mark-deviation:78-82`.
   - Style: `set -euo pipefail`; the file is committed, so
     `.claude/rules/shell-json.md` is mechanically linted on added lines (no
     `echo "$VAR" | jq` — this script needs no jq at all).

2. **`test-dispatch-mark-node-park.sh`** (new). Follow
   `test-dispatch-mark-deferred.sh` verbatim in shape: source
   `dispatch-test-fixture.sh` from `$(cd "$(dirname "$0")" && pwd)`, use
   `assert_eq` / `assert_contains` from `test-helpers.sh`, `mktemp -d` a fake
   job dir per case, end with `report_results`. It is auto-discovered by
   `run-unit-tests.sh`'s `for test_script in "$SCRIPTS"/test-*.sh` loop (line
   ~186) whenever `.claude/skills/dispatch-propagate/scripts/*` changes — no
   registration step. Cases:
   - happy path: exit 0; both marker files exist with exact bytes; no
     `office-hours-pr` without `--pr`.
   - `--pr 42`: `office-hours-pr` contains `42`; `--pr abc` → exit 2.
   - missing arg / empty reason / empty recommendation / 3 positionals → exit 2,
     no files written.
   - **one rejection case per pattern in the array**, using the four real 2026-07-31
     park reasons from this node's evidence table as fixtures (e.g. "not
     browser-verifiable … url_path 'current'"; "url_path is the placeholder
     'current' …"; "neither has a real url_path …"; "names a repo script, not a
     web page") → exit 3, stderr contains "author-required ONLY IF", **and no
     marker file is created**.
   - negative controls that must be **accepted** (exit 0): "auth wall on
     https://commons.systems/x prevented observing the expected banner";
     "expected X absent but originating PR #123 not yet confirmed deployed
     (deploy lag)"; "needs the author's product intent on whether the default
     should be opt-in".
   - interactive run (`CLAUDE_JOB_DIR` unset) with a **rejected** reason → still
     exit 3 (validation precedes the guard); with a good reason → exit 0, no
     files.

**Out of scope for this unit:** any change to `park-node`. Deliberately: the
node lane's park is landed by `terminal_without_disposition_sweep`, and that
sweep treats a non-zero `park-node` as a retryable failure that keeps the
markers and retries **every tick** (`lib-frozen-session-park.sh:1060-1080`). A
reason-validation refusal inside `park-node` would therefore hold the node
forever in a silent retry loop. Enforcement belongs at the point of writing, in
this script. Also out of scope: converting `qa-fix`, `fix-checks`,
`review-fix`, `implement`, or `dispatch-conflict` to this script — they keep
their inline writes.

---

## Unit 2 — Correct the record-time predicate and add the `Verifiability:` residue sub-line

**Recommended model:** opus

**Dependencies:** none (independent of Unit 1; Unit 3 depends on both).

Protected path — see the execution-mode constraint in Context.

### Scope

**(a) `.claude/skills/qa-fix/references/needs-main-followups.md:32-37`** — the
node-lane residue-eligibility sentence. Current text (verbatim, lines 32-37):
"Only machine/browser-verifiable items become residue: verifiability is triaged
here at record time (the `route` computation below already classifies every
item), and a prod observation needing human judgment stays `needs-human` →
`office_hours` (the Escalation seam), never residue. This makes the legacy
boot-then-reject waste structurally impossible on the node lane."

Replace the eligibility clause with the corrected predicate, keeping the
"structurally impossible" sentence:

- Machine-verifiable means checkable by **any** tool the autonomous lane can run
  — a deployed-URL browser observation, but equally a `git`, `journalctl`, log,
  `jq`, `grep`, `ls`, filesystem or test-run check.
- Reachability by Claude-in-Chrome is **not** the criterion. An item whose check
  is a repo/journal/log/shell observation — and whose `url_path` is therefore a
  placeholder such as `current` rather than a route — **is** machine-verifiable
  and **does** become residue.
- An item is author-required (`needs-human` → `office_hours` at record time,
  never residue) **only if it cannot be machine-checked at all**: it needs
  private credentials/accounts Claude lacks, a subjective product/UX judgment,
  or the user's product intent.

**(b) `.claude/skills/qa-fix/references/needs-main-followups.md:18-37`** — the
node-lane residue **format**. Line 20-26 currently says the append carries "one
entry per `needs-main` item with its `id`, `title`, `url_path`,
`expected_outcome`, and `finding`". Add the ratified interim mark: **each
residue bullet also carries a `Verifiability:` sub-line**, alongside its
`Expected outcome:` and `Finding:` lines, valued exactly one of:

- `MACHINE` — settleable by a check the autonomous lane can run (browser **or**
  shell/git/journal/log/filesystem).
- `AUTHOR` — cannot be machine-checked at all (credentials, subjective
  product/UX judgment, product intent).
- `WAIT` — a valid machine check whose event has not occurred yet (deploy lag,
  an accumulation that needs N more ticks). State the awaited event.

Document three further points here:

- **Default:** `MACHINE`. `AUTHOR` requires naming which of the three barriers
  applies. "The browser cannot reach it" is never a barrier.
- **Optional `Check:` sub-line** for a `MACHINE` item — the concrete command or
  observation recipe (e.g. `` `journalctl -u dispatch-tick --since -2h | grep
  'sweep'` ``), so the drain runs it rather than re-deriving it. Optional
  because residue already on `origin/main` predates this convention; a lane that
  finds no `Check:` derives one from `Expected outcome:`.
- **Retirement:** this sub-line retires **with** the `## needs-main residue`
  body section itself, when the standalone `tactic-mainqa-*` node shape
  (`intentions/tactic-mainqa-record-time-routing.md`) is live and `owner: ai` /
  `owner: human` carries the sort per node. It is an interim convention, not a
  second permanent mechanism.

**(c) `.claude/skills/qa-fix/references/needs-main-followups.md:65-80`** — the
`autonomous` | `human` | uncertain route bullets (legacy lane). Rewrite the
`autonomous` bullet so it is defined by machine-checkability, not by the browser
flow: an objective check **any tool the autonomous lane can run** — a public
deployed URL observation (deployed behavior, element-or-text presence, console
errors, network responses, public analytics) **or** a repo/journal/log/shell/
filesystem check (`git`, `journalctl`, `jq`, `grep`, `ls`, a test run). Keep the
"No auth wall, no private credentials/accounts, no subjective product/UX
judgment" clause verbatim. Leave the `human` bullet (lines 73-76) unchanged —
its three grounds are already the corrected predicate's grounds. Keep
**uncertain → `human`** and its asymmetry rationale (lines 77-80), adding one
sentence: *not reachable by the browser is never a source of that uncertainty —
a check no browser can perform is `autonomous`.*

Then add a short recorded caveat immediately after the bullets: on the **legacy
issue lane** `/qa-main` still runs `dispatch-main-qa-triage`
(`qa-main/SKILL.md:299-320`), which is browser-only, so a non-browser
`autonomous` item on that lane would still exit 3 → cannot-verify. That lane is
retired (its router entry is removed; the script is dead code on the node lane
per `qa-main/SKILL.md:117`), so the divergence is **recorded, not fixed here** —
and `dispatch-main-qa-triage` is explicitly **not** edited by this plan.

**(d) `.claude/skills/qa-fix/SKILL.md:353-357`** — the Step 3.6 node-lane
summary, currently "one entry per `needs-main` item (`id`, `title`, `url_path`,
`expected_outcome`, `finding`)". Add `Verifiability:` to that field list and one
clause naming the criterion (machine-checkable-at-all, not browser-reachable),
pointing at the reference for the full rules. Keep it terse — SKILL.md carries
the control flow, the reference carries the detail.

**Out of scope:** `.claude/workflows/qa-fix.js` — its four-way classifier prompt
(lines 283-293) defines `needs-main` as "only verifiable against merged main /
production" and `needs-human` as "a pixel-level aesthetic judgment, OR a
decision that requires the user's intent". That is already the corrected
predicate; touching it is unnecessary churn. Also out of scope:
`dispatch-main-qa-triage`, `dispatch-qa-apply-main-qa-labels`, and any
`intentions/*.md` node edit (residue already landed on `origin/main` carries no
`Verifiability:` sub-line and is handled by Unit 3's absent-mark derivation, not
by a backfill).

---

## Unit 3 — `/qa-main` node lane: two verification lanes, a three-way sort, and a park that cannot cite the browser

**Recommended model:** opus

**Dependencies:** Unit 1 (the script this lane calls) and Unit 2 (the
`Verifiability:` convention this lane reads).

Protected path — see the execution-mode constraint in Context.

### Scope

All edits in `.claude/skills/qa-main/SKILL.md`. The **legacy issue lane**
(Steps 1-6, lines 228-476) stays byte-for-byte unchanged except where noted.

**(a) Lines 97-110 — "Work list & context".** Extend the parsed residue fields
to include the `Verifiability:` sub-line (and the optional `Check:` line).
Record the **derivation rule for residue that predates the convention**: when a
bullet carries no `Verifiability:` line, derive it — `AUTHOR` only if the item
needs private credentials/accounts, a subjective product/UX judgment, or the
user's product intent; `WAIT` if the check is sound but its event has not
occurred; otherwise `MACHINE`. Absent `url_path`, or a `url_path` of `current`,
is **not** evidence for `AUTHOR`.

**(b) Lines 112-119 — delete the browser pre-filter and replace it with the
sort.** This paragraph is the defect. Its last sentence — "If a residue item
nonetheless has no `url_path` or names a non-browser outcome, route it straight
to **cannot-verify** below." — must be **removed outright**, not softened.
Replacement content:

- Residue is pre-triaged **machine-verifiable** at record time (`qa-fix` Step
  3.6), so this step is a cheap re-assert, not a discovery step.
- Read each item's `Verifiability:` mark (deriving it when absent, per (a)) and
  route it: `MACHINE` → the verification lanes in (c); `AUTHOR` → the park in
  (e); `WAIT` → the wait branch in (e).
- State the criterion in one sentence: **an item is `AUTHOR` only if it cannot
  be machine-checked at all. A git, journal, log, shell or filesystem check that
  no browser can perform is `MACHINE`.**
- Keep the existing "Skip `dispatch-main-qa-triage` (it reads a gh issue)" line
  (117) — it is correct and load-bearing.

**(c) Lines 131-134 — "Verification (Steps 4a–4e) run unchanged" becomes two
lanes.** Per `MACHINE` item, pick the lane by what the check *is*, not by what
the item lacks:

- **Lane M — machine (shell/repo/journal/log/filesystem).** Run it first: it is
  the cheapest and needs no browser session (mirroring `qa-fix`'s
  shell-command-lane-first rule, `.claude/skills/qa-fix/references/execution-lanes.md:52-61`).
  Run the item's `Check:` command if present, else derive the cheapest command
  that decides `Expected outcome:`. Constraints to spell out:
  - **Read-only.** Reads of the repo (`git show`, `git log`, `grep`, `ls`,
    `jq`), the journal (`journalctl`), dispatch state files and logs, and
    idempotent read-only scripts. No writes, no pushes, no graph writes, no
    `gh` mutations.
  - **Sandbox** (`.claude/rules/sandbox.md`): `journalctl` and anything sourcing
    `lib-claude-agents.sh` (`claude agents --json`) need
    `dangerouslyDisableSandbox: true` — a sandboxed `claude agents --json`
    returns `[]`, indistinguishable from a genuine empty result. Any `gh` call
    likewise.
  - **Bounded.** At most a couple of commands per item; if the check cannot be
    decided that cheaply, the item is `WAIT` (its event has not accumulated) or
    a barrier → cannot-verify. Never open-ended investigation.
  - Record per item: the exact command(s) run, their output excerpt, and
    PASS/FAIL/undecided. This record is what the park's `recommendation` carries
    in (e).
- **Lane B — browser.** Steps 4a-4e, unchanged, for items whose check *is* an
  observation of deployed web behavior. Load browser tools **only if at least
  one item needs Lane B** — do not pay for a browser session for a repo check.
  The `DEPLOY_READY` sensor re-check (lines 121-130) applies to Lane B items and
  to any item whose expected outcome depends on the prod deploy; it stays a
  signal that can only demote.

**(d) Lines 135-141 — verdict aggregation across mixed classes.** Today the
decision tree is applied node-wide. Make it per item, then aggregate:

1. Every item `MACHINE` and every one observed to match → **pass** (lines
   142-152, `transition-node "$N"`, unchanged).
2. Any `MACHINE` item unambiguously and reproducibly contradicted, with no
   barrier and `DEPLOY_READY == merged-and-likely-deployed` → **broken** (lines
   153-197, unchanged: write the implement-chain bug tactic, then advance the
   source to `done`). Extend the bug body's provenance list to record the Lane-M
   command and output when the contradiction came from Lane M rather than from
   the browser.
3. Any item `AUTHOR` → **park**, per (e) — but only *after* every `MACHINE`
   item on the node has been run to a verdict. The asymmetric-cost rule (lines
   137-140) is unchanged: when the signal is unclear, cannot-verify.
4. Any item `WAIT` and no `AUTHOR` item → the **wait branch**, per (e).

**(e) Lines 199-209 — the cannot-verify branch.** Replace the hand-inlined
marker writes with the Unit-1 script, and split the branch in two:

- **AUTHOR park.** Call (a pure local write, **no** sandbox override):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park \
    "<reason: the credential / subjective-judgment / product-intent barrier, per item>" \
    "<recommendation: what the author must decide, plus every Lane-M result already obtained>"
  ```

  Spell out the two hard requirements:
  - The **reason** states the barrier that makes the item uncheckable by any
    tool. A reason whose operative claim is browser-reachability is **refused by
    the script (exit 3)**; on exit 3 do not reword to evade it — re-sort the
    item and take the matching branch.
  - The **recommendation** carries the machine-answerable research already done
    (Lane-M commands and outputs for every `MACHINE` item on the node), so the
    author is asked for a yes/no, not handed an assignment. This is the fourth
    bullet of this node's own scope sketch and the park-recommendation contract
    (`park-node:36-41`).

  The downstream mechanics are unchanged: `dispatch-tick`'s
  `terminal_without_disposition_sweep` reads the markers and parks the node via
  `park-node`, writing `office_hours {reason, recommendation, since}` on
  `origin/main`. Then **STOP**.

- **WAIT branch (interim).** Same script, same terminal shape, but the reason
  names **the awaited event and the earliest useful re-check** (e.g. "expected
  eight consecutive sweep lines; the journal currently holds three — re-check
  after ~2h of ticks"), and the recommendation says the item needs no author
  decision, only re-selection. Add an explicit forward-pointer note: **when
  `tactic-wait-calendar-release` lands** (the `attributes.wait_until` sweep
  predicate, the `attempts`/cap, and the `router.ts:343-355` draft-candidate
  exclusion), this branch emits a WAIT hold node instead of parking. **Do not
  mint a WAIT hold node from this plan** — without that router exclusion a
  phase-less, `office_hours`-null node is emitted as an `/align-tactics`
  candidate and spawns an align worker.

**(f) Line 3 (frontmatter `description`) and lines 15-23 (the "three terminal
exits" preamble).** Both currently describe the node lane as verification "via
Claude-in-Chrome". Update to name both lanes (machine checks and, where the
outcome is deployed web behavior, Claude-in-Chrome), and keep the three exits.
Keep the description one line.

**Out of scope:** the legacy issue lane's Step 4·0 and `dispatch-main-qa-triage`
(lines 299-322) — unchanged, per the ratified ruling;
`.claude/skills/office-hours/SKILL.md` §5 (the human main-qa review);
`park-node`; `hold-node`; anything under `packages/intentionsutil/src/`.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation` — the
  atomic tempfile+`mv` marker write (lines 84-88) and the `CLAUDE_JOB_DIR`
  guard (78-82) Unit 1 copies; also the reason-arg validation shape (46-59).
  Not reusable as-is: it does a gh in-session label park (62-76), forbidden on
  the node lane.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-mark-deferred.sh` —
  the template for Unit 1's test file (fixture sourcing, `mktemp -d` job dir,
  exit-code assertions).
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh` — `assert_eq`,
  `assert_contains`, `assert_exit_nonzero`, `report_results`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — sets
  `SCRIPT_DIR` and sources the helpers; every `test-*.sh` sources it.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh` (~line 186) —
  globs `test-*.sh` in the scripts dir, so a new test file needs no
  registration; triggered automatically when
  `.claude/skills/dispatch-propagate/scripts/*` changes (line 88).
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:1016-1080`
  — `terminal_without_disposition_sweep`: reads `office-hours-reason` /
  `-recommendation` / `-pr` verbatim and calls `park-node`. Defines the byte
  format Unit 1 must produce and the retry behavior that keeps validation out
  of `park-node`.
- `packages/intentionsutil/scripts/park-node:36-41,147-149` — the
  park-recommendation contract (`office_hours.recommendation` is first-class;
  the script never folds it into the reason).
- `.claude/skills/qa-fix/references/execution-lanes.md:52-61` — the existing
  "Shell-command lane … run this lane first, shell items are the cheapest"
  pattern Unit 3's Lane M mirrors.
- `.claude/skills/qa-main/SKILL.md:142-197` — the pass and broken terminal
  actions (`transition-node`, the implement-chain bug tactic write via
  `write-node.ts` + `graph-commit`), reused unchanged.
- `intentions/strategy-graph-native-dispatch.md:3507-3572` — the authoritative
  corrected predicate, the `owner` sort mark, the interim `Verifiability:`
  sub-line, and the enumerated edit sites. `:3573-3640` and `:3792-3888` — the
  WAIT/hold design owned by `tactic-wait-calendar-release`, quoted here only as
  the boundary.
- `.claude/rules/sandbox.md` — `journalctl`, `gh`, `claude agents --json` and
  network checks need `dangerouslyDisableSandbox: true`; a sandboxed
  `claude agents --json` returns a vacuous `[]`.
- `.claude/rules/shell-json.md` — enforced by
  `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` on net-new
  added lines in committed `.sh` files.

## Verification

Auto-runnable:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-mark-node-park.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

```verify
bash -c '
set -u
root=$(git rev-parse --show-toplevel)
cd "$root"
fail=0
qm=.claude/skills/qa-main/SKILL.md
nf=.claude/skills/qa-fix/references/needs-main-followups.md
qf=.claude/skills/qa-fix/SKILL.md
mp=.claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park

# 1. The browser-reachability predicate is gone from the three live sites.
if grep -qiF "machine/browser-verifiable" "$qm" "$nf" "$qf"; then
  echo "FAIL: machine/browser-verifiable conflation still present"; fail=1; fi
if grep -qiE "no .url_path. or names a non-browser outcome" "$qm"; then
  echo "FAIL: qa-main still routes a non-browser outcome straight to cannot-verify"; fail=1; fi
if grep -qiE "Claude-in-Chrome flow can perform" "$nf"; then
  echo "FAIL: needs-main-followups autonomous route still defined by the browser flow"; fail=1; fi

# 2. The corrected predicate and the interim mark are documented.
for f in "$qm" "$nf" "$qf"; do
  if ! grep -qF "Verifiability:" "$f"; then
    echo "FAIL: $f does not document the Verifiability sub-line"; fail=1; fi
done
for f in "$qm" "$nf"; do
  if ! grep -qiE "machine-checked at all|machine-check(able|ed) AT ALL" "$f"; then
    echo "FAIL: $f does not state the author-required-only-if-uncheckable predicate"; fail=1; fi
done
if ! grep -qiE "journal|journalctl" "$qm"; then
  echo "FAIL: qa-main does not admit a journal/log check as machine-verifiable"; fail=1; fi

# 3. The rejection guard exists, is executable, and qa-main calls it.
if [ ! -x "$mp" ]; then echo "FAIL: $mp missing or not executable"; fail=1; fi
if ! grep -qF "dispatch-mark-node-park" "$qm"; then
  echo "FAIL: qa-main cannot-verify branch does not call dispatch-mark-node-park"; fail=1; fi

# 4. dispatch-main-qa-triage is NOT edited by this change.
if ! git diff --quiet origin/main -- .claude/skills/dispatch-propagate/scripts/dispatch-main-qa-triage; then
  echo "FAIL: dispatch-main-qa-triage was modified; the ruling excludes it"; fail=1; fi

# 5. No WAIT hold mechanism was implemented here (owned by tactic-wait-calendar-release).
if ! git diff --quiet origin/main -- packages/intentionsutil/src/router.ts; then
  echo "FAIL: router.ts changed; the draft-candidate exclusion belongs to tactic-wait-calendar-release"; fail=1; fi
if grep -qF "wait_until" "$qm"; then
  echo "FAIL: qa-main references wait_until; the hold mechanism is another node scope"; fail=1; fi

# 6. Live rejection behavior, end to end.
d=$(mktemp -d)
CLAUDE_JOB_DIR="$d" "$mp" "not browser-verifiable: url_path is the placeholder current" "look at it" >/dev/null 2>&1
rc=$?
if [ "$rc" -ne 3 ]; then echo "FAIL: browser-reachability reason not refused (exit $rc, expected 3)"; fail=1; fi
if [ -e "$d/office-hours-reason" ]; then echo "FAIL: refused reason still wrote a marker"; fail=1; fi
CLAUDE_JOB_DIR="$d" "$mp" "needs the author product intent on the opt-in default" "answer yes or no; machine research attached" >/dev/null 2>&1
rc=$?
if [ "$rc" -ne 0 ]; then echo "FAIL: legitimate author-required reason refused (exit $rc)"; fail=1; fi
if [ ! -s "$d/office-hours-recommendation" ]; then echo "FAIL: recommendation marker not written"; fail=1; fi
rm -rf "$d"

if [ "$fail" -eq 0 ]; then echo "PASS: verifiability-sort corrections in place"; fi
exit $fail
'
```

Manual / judgment:

- **Replay the seven residue items** from this node's own evidence table
  (`intentions/tactic-qa-main-verifiability-sort-criterion.md:91-105`) through
  the corrected sort, reading only the amended prose. Expected:
  `tactic-frozen-session-debug-count` item 10, both
  `tactic-router-spawn-window-duplicate-worker` items, and
  `tactic-standdown-winner-liveness` item 1 sort `MACHINE`;
  `tactic-standdown-winner-liveness` item 2 and the
  `tactic-prune-conflict-recovery-silent-loss` design ruling sort `AUTHOR`; the
  observe-in-production signal on the latter sorts `WAIT`. Five of seven must
  leave the author's queue. Any item that still sorts `AUTHOR` on a
  `url_path`/browser ground means the prose edit did not land.
- **Re-sort the four siblings** named in this node's rationale —
  `tactic-drain-disposition-diagnosis-cas`, `tactic-mechanical-park-producers`,
  `tactic-main-post-merge-validation`,
  `tactic-execution-pr-merge-verification`. They must sort the same way under
  the amended prose. Note that `tactic-mechanical-park-producers` sits at
  `phase: main-qa` right now, so it may be drained under the old prose if that
  drain runs before this merges — check its state before concluding a
  discrepancy is a defect in this change.
- **Read the amended `qa-main/SKILL.md` end to end as a clean session** and
  confirm no path remains from "the browser cannot reach this" to a park: the
  only routes to `cannot-verify` should be a genuine environment barrier, an
  `AUTHOR` item naming one of the three barriers, or a `WAIT`.
- **Observe in production** (this is the strategy's own measurement, not a
  merge-time check): over the next `/qa-main` node-lane drains, no park's reason
  may cite browser reachability, and the mis-sort rate — cannot-verify parks on
  `owner: ai` nodes over all `owner: ai` main-qa nodes — must stay at or below
  1 in 20 (`intentions/strategy-graph-native-dispatch.md:3530-3533`). A single
  refused reason (`dispatch-mark-node-park` exit 3) appearing in a worker
  transcript is a **success** signal for this change, not a failure — it is the
  lane rejecting a mis-sort at the point of writing.
- **If the auto-mode classifier blocks Units 2/3**, park naming the file class
  and request a narrow scoped grant; do not attempt workarounds. Confirm before
  parking that Unit 1 landed on its own (scripts commit fine).

## needs-main residue

- id: item-15
  title: Re-sort the four named sibling nodes under the amended prose
  url_path: current
  expected_outcome: Each of `tactic-drain-disposition-diagnosis-cas`, `tactic-mechanical-park-producers`, `tactic-main-post-merge-validation`, and `tactic-execution-pr-merge-verification`, if still parked/live at merge time, sorts correctly under this PR's amended `qa-main`/`needs-main-followups.md` prose; any sibling that has already drained under the old prose by the time this checks is excluded rather than reported as a discrepancy.
  finding: Not checkable at PR-diff time — requires each sibling's live current state on `origin/main` *after* this PR merges (the amended prose only governs a node once merged). The plan itself flags the live-state check as a prerequisite to avoid manufacturing a false discrepancy against an already-drained sibling.
  Verifiability: MACHINE
  Check: For each of the four sibling ids, `git show origin/main:intentions/<sibling-id>.md | grep -A5 '^phase:'` (or `jq` against the node's frontmatter) to read its current `phase`/`office_hours` state; if still parked citing browser-reachability, that is itself evidence the amended prose has not yet propagated (expected — this PR had not merged when the park was written) rather than a defect in this PR.

- id: item-16
  title: Mis-sort rate stays at or below 1/20 across the next `/qa-main` node-lane drains
  url_path: current
  expected_outcome: Over the coming `/qa-main` node-lane drains, no park's reason cites browser reachability, and the mis-sort rate (cannot-verify parks on `owner: ai` nodes / all `owner: ai` main-qa nodes) stays at or below 1/20 (`intentions/strategy-graph-native-dispatch.md:3530-3533`).
  finding: Not checkable at merge time — this is the strategy's own downstream measurement, an accumulation over N future `/qa-main` drains that have not happened yet, not a single-visit check.
  Verifiability: WAIT
  Check: Tally `/qa-main` node-lane park reasons across subsequent drains (e.g. `journalctl` / dispatch decision logs for `dispatch-mark-node-park` exit-3 refusals, which are a **success** signal per this node's own design, vs. legitimate `AUTHOR`/`WAIT` parks) once enough drains have accumulated to compute a meaningful ratio; re-check later rather than at this single visit.
