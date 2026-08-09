---
id: tactic-qa-fix-node-terminal-declaration
kind: tactic
statement: /qa-fix's fix-finalize path declares no node-terminal marker, so
  every successful qa auto-fix freezes its own node — add the missing
  declaration and a mechanical guard that every phase skill's node-lane terminal
  path declares
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-29 /align-strategy interview from a live freeze
  (job c20b2f8d, node tactic-graph-select-target-node-tests, PR #2985). /qa-fix
  Step 3.7's fix-finalize path is a one-job-one-node terminal disposition of
  exactly the fix-attempt class — it lands and pushes fix commits, finalizes the
  qa-summary PR comment, writes a phase-log entry, emits a completed_with_fixes
  outcome envelope, and then deliberately does NOT transition, because a fixing
  pass must leave phase: qa so CI restarts and the chain re-QAs. It declares no
  marker, so dispatch-self-close holds the job and the node freezes;
  dispatch-sweep's node arm cannot free it either (it needs node-completion
  evidence AND no live session). See the 2026-07-29 declared-vs-undeclared
  clarification on strategy-graph-native-dispatch for the governing doctrine and
  the crash-only adopt/diverge."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
  tier: 1
phase: qa
execution:
  branch: tactic-qa-fix-node-terminal-declaration
  pr: 3044
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-08-09
    attempt: 4
    pushed_sha: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Mechanical coverage guard: every node-lane terminal path must declare

## Context

**The defect class.** `dispatch-self-close --node <id>` reaps a node worker's
background job only on positive evidence that the pass reached a terminal
disposition: a `$CLAUDE_JOB_DIR/node-terminal` marker naming that node, written
by `packages/intentionsutil/scripts/mark-node-terminal`. Absent the marker it
**HOLDs** — the job stays alive, `worktree_has_live_session` stays TRUE, and the
router will not re-select the node
(`.claude/skills/dispatch-propagate/scripts/dispatch-self-close:203-220`). That
fail-direction is deliberate and correct (`:63-79`). The hazard is the mirror
image: a lane that *completed its pass* and merely **omitted** the declaration
freezes its own node with no failure to debug.

**The confirmed live instance.** Job `c20b2f8d`, node
`tactic-graph-select-target-node-tests`, PR #2985. `/qa-fix`'s Step 3.7
fix-finalize path landed and pushed fix commits, finalized the qa-summary PR
comment, wrote a phase-log entry, and emitted a `completed_with_fixes` outcome
envelope — then deliberately did **not** transition, because a fixing pass must
leave `phase: qa` so the pushed commits restart CI and the chain re-QAs. It
called only `dispatch-mark-complete --phase qa`, which writes the *legacy*
`phase-completed` marker that `dispatch-self-close --node` never reads. So every
successful qa auto-fix froze its own node, and the re-QA the fix path's own
design depends on could never happen. This fired on **every** successful auto-fix,
not intermittently.

**Unit 1 of the original draft is DONE — do not re-implement it.** The missing
`mark-node-terminal "$N" fix-attempt` call landed 2026-07-30 in PR #2986, out of
band, as part of the dispatch-pipeline bootstrap. Verified on `origin/main`:
`.claude/skills/qa-fix/references/auto-fix-lane.md:178-187` carries the call as
Step 6, after the PR comment, the phase marker, and the outcome envelope, with
the timing-invariant rationale inline; `.claude/skills/qa-fix/SKILL.md:417-420`
carries the condensed prose mirror. `fix-attempt` is the correct existing
disposition member ("retried by design",
`packages/intentionsutil/scripts/mark-node-terminal:26`); no enum change was or
is needed.

**What remains, and why.** The record's accepted residual —
`dispatch-self-close:75-79`, "two of the terminal lanes declare via SKILL.md
prose … a dropped line means the job is HELD" — priced a dropped declaration as
a rare, recoverable slip. This defect re-priced it: when the dropping lane is a
routine *success* path, the price is a **guaranteed deadlock on every success**.
The 2026-07-29 declared-vs-undeclared clarification on
`strategy-graph-native-dispatch` therefore requires this tactic to carry a
mechanical guard, not only the missing call. That guard is this plan's entire
remaining scope.

**The runtime backstop already exists — do not rebuild it.**
`terminal_without_disposition_sweep`
(`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:577-700`,
landed for `tactic-phase-terminal-requires-disposition`) reads
`claude agents --json --all` for worker rows still present in a *terminal* state
— by construction, sessions that ended without declaring — and parks their nodes
to `office_hours`. It is wired into `dispatch-tick` at both call sites
(`dispatch-tick:383-392` on the paused branch and `:591-594` on the scheduling
path). It converts a silent deadlock into a human interrupt at run time. It
cannot see a lane nobody has run yet, and it turns every run of an undeclaring
success path into a spurious office-hours park. The guard this tactic builds is
its **static, CI-time complement**: catch the missing declaration when the lane
is authored, before it ships. State this relationship in the new file's header
so a future session does not collapse the two.

**Feasibility, and the recorded fallback.** The 2026-07-29 interview flagged
"whether node-lane terminal-declaration coverage is mechanically checkable at
reasonable cost" as unverified and endorsed it anyway, with the recorded fallback
that the unit **shrinks to a documented audit** rather than growing scope.
Planning-time investigation resolves this in favor of the mechanical check: the
repo already carries four working *doctrine ratchets* — bash suites that assert
structural properties of another skill's `SKILL.md` prose, using a shared
fixture, awk section extraction, and fenced-block-only invocation scanning
(`test-fix-checks-cas-guard.sh`, `test-dispatch-chain-worktree-ratchet.sh`,
`test-dispatch-conflict-lane3-cwd-ratchet.sh`,
`test-align-tactics-write-path-freshness.sh`, all in
`.claude/skills/dispatch-propagate/scripts/`). Unit 1 below is one more member of
that family, and its declared inventory *is* the documented audit the fallback
contemplated — kept from rotting by the checker. The fallback is therefore
superseded, not exercised. If, at implementation time, the completeness scan
proves to have irreducible false positives, degrade to the pinned-count
tripwires alone (Part C below) plus the inventory comment block; do **not** grow
this into a refactor of the skills themselves.

### Audit finding carried forward — the coverage table has a second gap

The 2026-07-30 bootstrap ran the full node-lane terminal audit and found a
**second** non-declaring lane, still live on `origin/main`:
`/dispatch-conflict`'s **Lane 2** — the graph-native node-conflict lane. Its
`resolved` path (`.claude/skills/dispatch-conflict/SKILL.md:592-672`; the
recorded anchor `530-606` has drifted) calls only
`dispatch-mark-complete --phase fix-conflicts` after `write-node.ts` +
`graph-commit`, never `mark-node-terminal`; the SKILL.md text at `:660-672`
explains why no other primitive covers it. Its sibling `ambiguous` path
(`:673-731`; recorded anchor `608-664` has drifted) declares nothing either, by
explicit design ("there is **no marker to write**").

Why it was not fixed alongside the `/qa-fix` call, and stays out of scope here:
Lane 2 is phase-agnostic and **not reachable by the autonomous fleet** —
`SKILL.md:80-81` and `:454-455` both state that no dispatch tick enters Lane 2,
and only Lane 3 is auto-spawned (`dispatch-graph-execute:321`). It strands
nothing today. It would deadlock the moment a human or a future router ran Lane 2
as a managed `--node` background job, since `.claude/hooks/dispatch-stop.sh`
gates purely on the job name matching an `intentions/<id>.md` id, regardless of
which skill ran inside it. **Accepted risk, recorded rather than fixed.** Unit 1
registers both Lane 2 paths as explicit, reasoned GAP rows so the risk is
machine-visible and cannot be lost; filing the Lane 2 fix as its own tactic is an
author/office-hours follow-up, not this tactic's work.

Corrected coverage table (as re-surveyed at planning time; the original draft's
`/dispatch-conflict` row was wrong because it surveyed Lane 3 only):

| skill | node-lane terminal paths | declares? |
|---|---|---|
| `/qa-fix` | clean-pass, escalation, fix-finalize | **all three** — fix-finalize since PR #2986 |
| `/fix-checks` | fix-attempt | yes, explicit `mark-node-terminal` |
| `/align-tactics` | align-round, no-claim | yes, explicit |
| `/dispatch-conflict` Lane 3 | conflict-resolved, conflict-hold | yes, explicit |
| `/dispatch-conflict` **Lane 2** | resolved, ambiguous | **no — registered GAP, not fleet-reachable** |
| `/review-fix` | clean-pass, deviation-park | yes, via `transition-node` / `park-node` |
| `/implement`, `/qa-main` | clean-pass, escalation | yes, via `transition-node` / `park-node` |

`dispatch-self-close:52-79`'s own caller enumeration is independently stale in
the same comment block: it omits `/qa-fix`'s `fix-attempt` caller, and its
"two of the terminal lanes declare via SKILL.md prose" count no longer holds.
Unit 2 reconciles it.

## Units of work

### Unit 1 — the node-lane terminal-declaration coverage ratchet

**Recommended model:** `opus`

**Scope.**

Create `.claude/skills/dispatch-propagate/scripts/test-node-terminal-coverage.sh`
(new file, executable, `#!/usr/bin/env bash`, `set -euo pipefail`), modeled
directly on `.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`
and `.claude/skills/dispatch-propagate/scripts/test-dispatch-chain-worktree-ratchet.sh`.
It sources the shared fixture
`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` for
`assert_eq` / `report_results` / `SCRIPT_DIR`, derives its repo root as
`$(cd "$SCRIPT_DIR/../../../.." && pwd)`, and honors an override
`NODE_TERMINAL_COVERAGE_ROOT` (default: the derived root) so the negative control
in `## Verification` can point it at a mutated copy. It is read-only: greps and
awk only, no network, no `gh`, no `claude`.

Scanning rules, non-negotiable because both known defects turn on them:

- Scan each skill's `SKILL.md` **plus every** `references/*.md` **together** —
  `/qa-fix`'s declaration is fenced only in `references/auto-fix-lane.md:186`
  while `SKILL.md:417-420` states it in prose, so a `SKILL.md`-only scan reads it
  as absent. `test-dispatch-chain-worktree-ratchet.sh:57-66` already implements
  exactly this file-set expansion (`find "$refs_dir" -name '*.md' | sort`);
  reuse that idiom.
- Count **fenced-block invocations only**, never prose mentions. The lane3
  ratchet's awk fence-toggle
  (`test-dispatch-conflict-lane3-cwd-ratchet.sh:69-72`) is the reference
  implementation. Prose mentions of a command are not invocations.

Four parts:

- **Part A — reachable-skill-set drift tripwire.** Extract every `SKILL="/…"`
  assignment from `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`
  (today at `:182-188`) and assert the deduplicated sorted set equals exactly
  `/align-tactics /fix-checks /implement /qa-fix /qa-main /review-fix`, plus
  `/dispatch-conflict` added from the Lane 3 spawn arm at
  `dispatch-graph-execute:319-323` (which does not use a `SKILL=` assignment —
  assert its literal spawn string separately). A new phase→skill mapping added
  without registering that skill's terminal paths must fail here. Failure message
  must name the remediation: "a new node-worker-reachable skill was added —
  register its node-lane terminal paths in this ratchet's inventory".
- **Part B — declaration-site inventory.** A `declare -A` map, one row per
  reachable skill, pinning the exact fenced-invocation count of
  `mark-node-terminal` across that skill's `SKILL.md` + `references/*.md`. Each
  row carries a comment naming which terminal path each call belongs to. Baselines
  measured at planning time against `origin/main` (**re-derive at implementation
  time — do not trust these blind**): `align-tactics=2`, `dispatch-conflict=4`,
  `fix-checks=1`, `implement=0`, `qa-fix=1`, `qa-main=0`, `review-fix=0`.
- **Part C — legacy-completion tripwire (the load-bearing half).** A second
  `declare -A` map pinning the exact fenced-invocation count of
  `dispatch-mark-complete` per reachable skill, each row commented with which
  lane that site serves and how that lane declares (or that it is a registered
  GAP). Planning-time baselines: `align-tactics=0`, `dispatch-conflict=4`,
  `fix-checks=1`, `implement=1`, `qa-fix=3`, `qa-main=0`, `review-fix=1`. This is
  the tripwire that would have caught the original defect: adding `/qa-fix`'s
  Step 3.7 fix-finalize path added a `dispatch-mark-complete` site, which changes
  the count, which forces a deliberate revisit in which the author must state how
  the new path declares. Pair it with the same-shaped counts for
  `transition-node` (`implement=1`, `qa-fix=1`, `qa-main=2`, `review-fix=1`,
  others `0`) and for `park-node`/`office-hours-reason`
  (`dispatch-conflict=1`, `fix-checks=1`, others `0`) so an implicit-declaration
  path cannot be added or removed silently either. Model the tripwire comment
  wording on `test-fix-checks-cas-guard.sh:81-86`, which already uses this idiom
  ("forces a deliberate revisit of the guard when a new … call site is added").
- **Part D — timing-invariant assertion, where it is cheap.** For each skill
  whose node-lane terminal is a *literal* `mark-node-terminal` call —
  `/qa-fix` (`references/auto-fix-lane.md`, the "Fix finalize path" section),
  `/fix-checks` (`SKILL.md:820-834`), `/align-tactics` (`SKILL.md:98` and
  `:318`), `/dispatch-conflict` Lane 3 (`SKILL.md:1281`, `:1361`) — extract the
  enclosing section with awk and assert the `mark-node-terminal` invocation is
  the **last** durable-action invocation in that section, i.e. it appears after
  any `dispatch-mark-complete`, `dispatch-emit-outcome`,
  `dispatch-write-phase-log`, `graph-commit`, or PR-comment call in the same
  section. This mechanizes condition 14's timing invariant ("declare as the LAST
  durable action of the pass, never earlier — `Stop` fires on every turn yield").
  Where a section boundary makes the ordering ambiguous, assert only the
  membership (call present in the section) and say so in a comment rather than
  writing a brittle ordering assertion.
- **GAP rows.** `/dispatch-conflict` Lane 2's two paths are registered as
  explicit gaps: assert that the section headings
  `### \`resolved\` — write back, clear the park, land`
  (`SKILL.md:592`) and
  `### \`ambiguous <reason>\` — confirm the existing park, report, stop`
  (`SKILL.md:673`) still exist, and carry a mandatory in-file reason string
  stating that Lane 2 is not fleet-reachable (`SKILL.md:80-81`, `:454-455`;
  only Lane 3 is auto-spawned, `dispatch-graph-execute:319-323`) and that it
  would deadlock if ever run as a managed `--node` job. A gap row whose heading
  no longer resolves must fail — the record cannot rot silently.

Wire it into CI by adding one step to `.github/workflows/unit-tests.yml`,
adjacent to the other ratchet steps (the block at `:196-236`, immediately after
the `Run dispatch-conflict Lane 3 cwd doctrine ratchet` step at `:225-226`):

```yaml
      - name: Run node-lane terminal-declaration coverage ratchet
        run: .claude/skills/dispatch-propagate/scripts/test-node-terminal-coverage.sh
```

Wire it **unconditionally there**, not into
`.claude/skills/dispatch-propagate/scripts/run-lint.sh`. `run-lint.sh`'s
auto-detect only sets `RUN_PROSE=true` when a changed path `is_shell_script`
(`run-lint.sh:64-72`), so a PR touching only `SKILL.md` files would skip a lint
wired there and merge green — precisely the CI-vector trap `unit-tests.yml`
already documents in the comment at `:198-206` for suites whose SUT lives outside
`.claude/skills/dispatch-propagate/scripts/`. This ratchet's SUTs are other
skills' `SKILL.md` prose, so it belongs in that unconditional block, and its
cost is a few hundred milliseconds of grep.

**Out of scope for this unit.**

- Changing any skill's behavior. This unit adds a checker and CI wiring only; no
  `SKILL.md` under `.claude/skills/{qa-fix,fix-checks,align-tactics,implement,qa-main,review-fix,dispatch-conflict}/`
  is edited.
- **Fixing `/dispatch-conflict` Lane 2.** It is registered as a GAP, per the
  audit finding above. Do not add `mark-node-terminal` calls to
  `SKILL.md:592-731`.
- Building any runtime detector.
  `terminal_without_disposition_sweep`
  (`lib-frozen-session-park.sh:577-700`) already exists and is wired into
  `dispatch-tick:383-392,591-594`. Do not touch `lib-frozen-session-park.sh`,
  `dispatch-tick`, or `dispatch-sweep`.
- Any change to `packages/intentionsutil/scripts/mark-node-terminal` — including
  its disposition enum (`:73-79`). No new member is needed by this plan. (Note
  for the record, not for action: `park-clear`, claimed by the 2026-07-28
  office-hours ratification to have been added at `:67`, is **not** in the enum
  on `origin/main`; that is `tactic-office-hours-self-modification-skill`'s
  business, not this tactic's.)

### Unit 2 — reconcile `dispatch-self-close`'s Invariant-2 comment block

**Recommended model:** `sonnet`

**Dependencies:** Unit 1 (the comment points at the file Unit 1 creates).

**Scope.** Edit the header comment of
`.claude/skills/dispatch-propagate/scripts/dispatch-self-close`, lines `52-79`
only. Two corrections and one structural change:

1. **Correct the caller enumeration** at `:52-58`, which today lists
   `transition-node`, `park-node`, `/fix-checks`, `/align-tactics`, and
   `/dispatch-conflict`'s Lane 3, and **omits `/qa-fix`'s fix-finalize
   `fix-attempt` caller** (landed PR #2986,
   `.claude/skills/qa-fix/references/auto-fix-lane.md:178-187`). Add it.
2. **Correct the accepted-residual sentence** at `:75-79` — "two of the terminal
   lanes declare via SKILL.md prose" is no longer the count, and the stated price
   ("no work lost, but the node stays claimed") understates the routine-success
   case. Restate it per the 2026-07-29 re-pricing: a dropped declaration on a
   *routine success path* is a guaranteed deadlock on every success, not a rare
   slip — which is why the coverage ratchet exists.
3. **Stop hand-maintaining the list here.** Replace the enumeration's role as a
   coverage record with a pointer to
   `.claude/skills/dispatch-propagate/scripts/test-node-terminal-coverage.sh` as
   the single source of truth for which lanes declare and which are registered
   gaps. Keep enough inline detail that the invariant remains readable without
   opening the ratchet — the point is that the *authoritative inventory* has one
   home, not that the comment becomes a bare cross-reference. This closes a
   staleness class that has now fired twice in this one comment block (the
   missing `/qa-fix` caller, and the stale prose-lane count).

**Out of scope.** No behavior change to `dispatch-self-close`. Do not touch the
argument parsing (`:125-145`), the Invariant-1 router branch (`:165-200`), or
the marker-read branch (`:203-220`).

## Reuse

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`
  — the closest structural precedent: a doctrine ratchet over another skill's
  `SKILL.md`, with awk section extraction (`:52-66`) and fenced-block-only
  invocation extraction (`:69-72`). Copy both idioms.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-chain-worktree-ratchet.sh`
  — the `declare -A <FILE>=<expected count>` inventory idiom (`:31-45`) and the
  `SKILL.md` + `references/*.md` file-set expansion (`:57-66`).
- `.claude/skills/dispatch-propagate/scripts/test-fix-checks-cas-guard.sh`
  — the "pin a call-site count as a deliberate-revisit tripwire" idiom and its
  comment wording (`:81-86`).
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh`
  — shared harness: `assert_eq`, `report_results`, `SCRIPT_DIR`,
  `UTIL_SCRIPT_DIR`, and the decision-log leak guard. Source it; do not
  re-implement asserts.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:182-188,319-323`
  — the authoritative phase→skill map and the Lane 3 spawn arm; Part A derives
  the reachable-skill set from these rather than restating it.
- `packages/intentionsutil/scripts/mark-node-terminal:1-98` — the sole
  declaration primitive; its header (`:11-14`, `:26`) is the canonical statement
  of what each disposition means. Read, do not modify.
- `.claude/skills/dispatch-propagate/scripts/dispatch-self-close:203-220` — the
  marker-presence reap test the ratchet exists to protect. Read, do not modify
  (Unit 2 edits only its comment header).
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:577-700`
  — the already-landed runtime complement. Cite in the new file's header; do not
  modify or duplicate.
- `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` — precedent for
  the *ratchet-with-registered-exception* posture (its `lint-allow:` marker),
  which the GAP rows mirror. Structural precedent only; add no rule to that file.
- `.github/workflows/unit-tests.yml:196-236` — the unconditional
  outside-the-scripts-dir suite block, and its `:198-206` comment explaining why
  such suites must be wired there rather than behind a change-detector.

## Verification

Auto-runnable — the new ratchet plus the two suites whose subject it guards, and
a scripted negative control proving the ratchet actually fails when a
declaration is removed (a coverage guard that cannot fail is worthless):

```verify
set -euo pipefail
R=$(git rev-parse --show-toplevel)
RATCHET="$R/.claude/skills/dispatch-propagate/scripts/test-node-terminal-coverage.sh"

# 1. The ratchet passes against the real tree.
"$RATCHET"

# 2. Neighbouring suites still pass (Unit 2 edits dispatch-self-close's header).
"$R/.claude/skills/dispatch-propagate/scripts/test-mark-node-terminal.sh"
"$R/.claude/skills/dispatch-propagate/scripts/test-dispatch-self-close.sh"

# 3. NEGATIVE CONTROL — delete /qa-fix's fix-finalize declaration in a throwaway
#    copy of .claude/skills and assert the ratchet FAILS on it.
T=$(mktemp -d)
mkdir -p "$T/.claude"
cp -R "$R/.claude/skills" "$T/.claude/skills"
F="$T/.claude/skills/qa-fix/references/auto-fix-lane.md"
grep -v 'mark-node-terminal "$N" fix-attempt' "$F" > "$F.stripped"
mv "$F.stripped" "$F"
if NODE_TERMINAL_COVERAGE_ROOT="$T" "$RATCHET" >/dev/null 2>&1; then
  echo "NEGATIVE CONTROL FAILED: ratchet passed with /qa-fix's declaration removed" >&2
  rm -rf "$T"; exit 1
fi
rm -rf "$T"
echo "negative control OK: ratchet fails when a declaration is removed"
```

Manual and judgment steps:

- **Second negative control, by hand.** In a scratch copy, add a fourth
  `dispatch-mark-complete --phase qa` fenced invocation to
  `.claude/skills/qa-fix/references/auto-fix-lane.md` and confirm Part C's
  tripwire fails with a message that names the remediation ("a new
  `dispatch-mark-complete` call site was added — state how that terminal path
  declares, then update this count"). This is the exact shape of the original
  defect; if the ratchet is silent here, Part C is not doing its job.
- **Third negative control, by hand.** Add a bogus
  `tactic:newphase) SKILL="/some-new-skill"` arm to
  `dispatch-graph-execute`'s case statement in a scratch copy and confirm Part A
  fails.
- **False-positive review.** Read the ratchet's failure output for each of the
  seven reachable skills after deliberately perturbing one count at a time.
  Every message must state *what changed* and *what the author must decide*, not
  merely "expected 3 got 4". A ratchet whose failure text does not tell the next
  author what to do gets counts bumped to green, which destroys it.
- **CI confirmation.** Confirm the new `unit-tests.yml` step runs and passes on
  the PR, and that it is in the unconditional block (a PR touching only
  `.claude/skills/**/*.md` must still run it).
- **Not verified by this plan, deliberately:** that `/dispatch-conflict` Lane 2
  declares. It does not; it is a registered GAP. Confirm the GAP rows are present
  and their reason text names the non-fleet-reachability ground, and confirm the
  ratchet fails if the Lane 2 section headings are renamed.

## Out of scope (whole tactic)

- **`park-node`'s early-arming hazard.** Its unconditional internal
  `mark-node-terminal "$NODE_ID" park` call — recorded at line 277, now at
  `packages/intentionsutil/scripts/park-node:310-317` — violates the same timing
  invariant for a batched drain that re-parks its own primary node mid-batch. It
  relies on `mark-node-terminal`'s ownership gate to no-op for foreign nodes,
  which does not cover the own-node-mid-batch case. Pre-existing, recorded
  2026-07-28, tracked in `tactic-office-hours-self-modification-skill`'s body.
  Deliberately not pulled in.
- **Replacing the marker with reconciler-derived reapability** — the crash-only
  steelman (Candea & Fox, HotOS IX 2003). Diverged from in the 2026-07-29
  interview: turn-yield-versus-terminal is knowledge only the session holds, so a
  reconciler reading durable state cannot distinguish "yielded mid-flight" from
  "done", and removing the marker re-opens the 36e64744 incident class. See the
  declared-vs-undeclared clarification on `strategy-graph-native-dispatch`.
- **The opposite (unsafe) direction** — marker written but the graph write it
  claims never landed. That is
  `intentions/tactic-terminal-declaration-verified-against-node.md`.
- **A session that dies before its declaration call executes** — that is
  `intentions/tactic-align-tactics-mark-terminal-skipped.md`.
- **Fixing `/dispatch-conflict` Lane 2** — see the audit finding; filing it as
  its own tactic is an author/office-hours follow-up.

## Coordination

`tactic-outcome-envelope-node-lane-parity` (serves `strategy-token-economy`,
`phase: implement`) edits the **adjacent lines** of the same `/qa-fix` node-lane
terminal section — it fixes the numeric `--issue` argument on
`dispatch-emit-outcome` / `dispatch-write-phase-log`. The two defects are
disjoint in substance and must not be planned as one unit. This plan's Unit 1
does not edit `/qa-fix` at all, so the textual-conflict risk the original draft
flagged is now confined to Part B/C's *pinned counts*: if that tactic lands
between this ratchet's authoring and its merge, re-derive the counts against
fresh `origin/main` before pushing rather than assuming the baselines above.
