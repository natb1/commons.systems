---
id: tactic-dispatch-conflict-rename
kind: tactic
statement: "Rename the fix-conflicts skill to dispatch-conflict with zero
  behavior change: a scoped skill/slash-command rename that preserves the
  fix-conflicts dispatch phase token, label keyspace, and routing everywhere
  else, clearing the renamed file for tactic-dispatch-conflict-greenfield's
  graph-native lane addition"
owner: ai
status: codified
parent: null
rationale: "Split out of tactic-dispatch-conflict-greenfield during its
  2026-07-22 /align-tactics finalize. Two independent Explore/Plan fan-outs (one
  designing the work as a single tactic, one evaluating a split) both
  independently found the same fact: the rename is not a trivial mv — it
  requires discriminating the fix-conflicts SKILL NAME (renamed) from the
  fix-conflicts PHASE TOKEN (unchanged: dispatch-mark-complete's --phase
  argument, the dispatch:fix-conflicts-attempt-<n> label keyspace,
  dispatch-phase-model, dispatch-preflight.sh, and the Stop hook's #831
  non-advancement invariant all key on the phase string, which stays
  fix-conflicts) across roughly 15 reference sites, plus locating one legacy
  worker-prompt emitter whose exact call site neither fan-out could pin by grep
  alone. That is a real, mechanical, sonnet-tier unit of work in its own right,
  disjoint from the judgment-heavy opus-tier work of designing the new
  graph-native conflict lane. Splitting follows this skill's own
  leaf-tactic-is-one-PR rule: bundling a wide mechanical reference sweep with a
  novel-architecture unit would bury the judgment-heavy diff in review noise and
  risk-concentrate an unrelated unknown (the emitter location) inside the harder
  PR. Lands first (no dependencies) so tactic-dispatch-conflict-greenfield's
  Lane 2 work has a renamed file to build on. Off-path BACKLOG work per
  strategy-graph-native-dispatch clarification 69 (same rank class as the tactic
  it was split from), serving the same records-vs-executes dispatch-* naming
  convention as tactic-dispatch-skill-rename (clarification 67) but landed
  independently of that tactic, which is blocked on unrelated work
  (tactic-dispatch-skill-input-contract) and explicitly defers this skill's
  rename to whichever tactic actually does it (its own roster table annotates
  the dispatch-conflict row \"behavior redesign — see
  tactic-dispatch-conflict-greenfield\")."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-dispatch-conflict-rename
  pr: 2937
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-07-22
    attempt: 1
    pushed_sha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Rename the fix-conflicts skill to dispatch-conflict with zero behavior change

## Context

`.claude/skills/fix-conflicts/SKILL.md` is today's legacy issue-lane-only
merge-conflict resolver. `tactic-dispatch-conflict-greenfield` is adding a new
graph-native lane to it (renamed `dispatch-conflict`), per the dispatch-*
skill-naming convention (strategy-graph-native-dispatch clarification 67). This
tactic performs **only** the rename and its reference sweep — zero behavior
change to the existing (issue-lane) skill — so the new-lane work lands as its
own, cleanly reviewable, judgment-heavy PR on top of an already-renamed file.

**The one design decision that bounds this whole tactic:** rename only the
*skill*/slash-command identity (`fix-conflicts` → `dispatch-conflict`). Do
**not** rename the dispatch **phase token** `fix-conflicts` — it is load-bearing
across `dispatch-mark-complete`'s `--phase` argument, the
`dispatch:fix-conflicts-attempt-<n>` label keyspace, `dispatch-phase-model`,
`dispatch-preflight.sh`'s exemption list, `dispatch-ci-ready`, and the Stop
hook's #831 non-advancement invariant. Renaming the phase token would explode
this tactic's blast radius into the entire dispatch chain state machine, for no
benefit. Every site below is one or the other — treat the two as strictly
distinct and never conflate them.

## Units of work

### Unit 1 — Move the skill directory and rewrite its self-identity

**Scope:**
- `git mv .claude/skills/fix-conflicts/ .claude/skills/dispatch-conflict/`.
- `SKILL.md` frontmatter: `name: fix-conflicts` → `name: dispatch-conflict`;
  rewrite `description` (keep it accurate to the still-single-lane behavior —
  do not describe a second lane here, that is the next tactic's job).
- Rewrite in-prose self-references to the skill's own name/invocation
  (`/fix-conflicts` → `/dispatch-conflict`) throughout the body — the skill
  title, the opening paragraph, and any other first-person self-reference.
- **Leave the Step-1 branch-detection hard exit exactly as it is today**
  (`case "$BRANCH" in [0-9]*-*) ... ; *) echo ... exit 1 ;; esac`) — do **not**
  add any "defer to a second lane" branch here. That branch is only coherent
  once the second lane exists to defer to; adding it prematurely would leave a
  dead-end path. `tactic-dispatch-conflict-greenfield` (blocked_by this tactic)
  replaces this exit with the lane-discrimination preamble when it adds Lane 2.
- **Leave every phase-token occurrence inside the skill body unchanged**,
  specifically the `--phase fix-conflicts` marker call and the
  `dispatch:fix-conflicts-attempt-<n>` label-counter logic (both steps
  currently in the skill) — these are phase-token, not skill-name.

**Recommended model:** `sonnet` — a verbatim directory move plus a
well-specified, small self-reference rewrite with a clear diff shape.

**Dependencies:** none.

### Unit 2 — Retarget the skill→phase recovery map (skill-name key, phase-token value unchanged)

**Scope:**
- `.claude/skills/dispatch-propagate/scripts/dispatch-recover-dispatched-phase`:
  the `case "$SKILL"` map's `fix-conflicts)` arm becomes
  `dispatch-conflict) echo "fix-conflicts"` — the case **key** is the renamed
  skill directory name; the **echoed value** is the unchanged phase token. Also
  update the header's worked example if it names `fix-conflicts` as the skill.
- Confirm the script's own skill-directory extraction (whatever pattern reads
  the invoking skill's directory name, e.g. a `.claude/skills/[a-z-]+` grep or
  transcript scan) picks up the new directory name automatically post-Unit-1;
  if it hardcodes `fix-conflicts` anywhere beyond the case arm, fix that too.

**Recommended model:** `sonnet`.

**Dependencies:** Unit 1 (retargets the renamed directory name).

### Unit 3 — Locate and retarget the legacy worker-prompt emitter (the one unconfirmed site)

**Scope:** Something in the legacy dispatch-chain launch path (reachable from
`dispatch-tick`, NOT `dispatch-graph-execute` — that script is the graph-node
lane and has no `fix-conflicts` routing arm at all, confirming today's
fix-conflicts is issue-lane-only) constructs the literal worker directive
`/fix-conflicts` to hand to a freshly spawned worker session when the phase is
`fix-conflicts`. Locate that exact construction site (it was not pinned by a
single grep during planning — search the legacy issue-lane dispatch scripts,
e.g. `dispatch-route`, any `dispatch-graph-execute`-sibling legacy emitter, and
`reference.md:87`'s documented claim that "the worker invokes `/fix-conflicts`
as a normal in-place phase skill").
- If it is a **literal string** `/fix-conflicts`, change it to
  `/dispatch-conflict`.
- If it is **derived from the phase token** (e.g. `/$PHASE` where
  `PHASE=fix-conflicts`), this is the one place where phase-token and
  skill-name genuinely need separate values — introduce an explicit
  phase→skill-command mapping (parity with Unit 2's reverse-direction map)
  rather than continuing to conflate them; do not rename the phase token to
  make this site simpler.

**Recommended model:** `sonnet` if the site is a literal string (simple
find/replace); escalate to `opus` if it is derived from the phase token and a
new mapping must be introduced (unfamiliar-subsystem, design-judgment case per
the model-selection heuristic).

**Dependencies:** Unit 1.

### Unit 4 — Sweep remaining reference sites (skill-name only, discriminating from phase-token)

**Scope:** Update every remaining prose/comment/doc reference to the skill by
name (not the phase token) to `dispatch-conflict`:
- `.claude/skills/dispatch-propagate/reference.md`
- `.claude/skills/qa-fix/SKILL.md`, `.claude/skills/review-fix/SKILL.md`
  (cross-references to the fix-conflicts phase-worker skill by name)
- Comment lines in `.claude/skills/dispatch-propagate/scripts/dispatch-tick`,
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` (its
  comment describing why node-lane conflicts park rather than routing to
  `/fix-conflicts`), `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`
- `.claude/skills/dispatch-propagate/escalation-recommend.md` (the per-phase
  model-tier list naming `fix-conflicts`)
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh` — add
  `dispatch-conflict` to the worker-classification command-name alternation so
  renamed-skill sessions still classify as `worker` in token-audit reports.
- Top-level `README.md`, if it names the skill.
- Stale node-body skill-path pointers across `intentions/*.md` — same cleanup
  class as `tactic-align-init-rename-stale-node-refs` (do not touch this
  tactic's own sibling `tactic-dispatch-conflict-greenfield`'s body; that
  tactic updates its own cross-references itself in the same landing round).
- **Do not touch** any site that is genuinely the phase token: `dispatch-mark-complete`,
  `dispatch-phase-model`, `dispatch-preflight.sh`, `dispatch-ci-ready`, the
  `dispatch:fix-conflicts-attempt-*` label strings, and the Stop hook.

**Recommended model:** `sonnet` — mechanical, wide but well-specified
find-and-replace; each site requires only the skill-name/phase-token
discrimination judgment already fully specified above, not novel design.

**Dependencies:** Units 1-3 (sweeps references to the now-final renamed name
and confirmed emitter fix).

### Unit 5 — Update tests asserting the skill-invocation tag

**Scope:** In the dispatch scripts' test suite (the recovery-map test
exercising `dispatch-recover-dispatched-phase`), change the input skill tag
from `/fix-conflicts` to `/dispatch-conflict` while leaving the **expected
output** (the phase token `fix-conflicts`) unchanged. Leave every test that
asserts phase-token behavior (phase-model routing, preflight exemption,
attempt-label capping) untouched — those test the unchanged phase token, not
the renamed skill.

**Recommended model:** `sonnet`.

**Dependencies:** Units 2-3 (exercises the updated map and emitter).

## Reuse

- The existing `case "$SKILL"` skill→phase recovery map
  (`dispatch-recover-dispatched-phase`) — this tactic edits one arm's key, not
  its structure.
- The existing `case "$kind:$phase"` router directive map
  (`dispatch-graph-execute`) has **no** `fix-conflicts`/`dispatch-conflict`
  arm today (confirmed: issue-lane-only) — nothing to touch there in this
  tactic; the graph-native lane arrives with `tactic-dispatch-conflict-greenfield`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-token-audit`'s existing
  worker-classification alternation pattern in `aggregate-usage.sh` — extend
  it, do not restructure it.

## Verification

```verify
# The rename landed cleanly: new skill present, old one gone, no dangling path refs.
test -f .claude/skills/dispatch-conflict/SKILL.md
! test -e .claude/skills/fix-conflicts
! grep -rn 'skills/fix-conflicts\|/fix-conflicts' --exclude-dir=.git . || \
  grep -rn 'skills/fix-conflicts\|/fix-conflicts' --exclude-dir=.git . | grep -v 'dispatch:fix-conflicts-attempt'

# Frontmatter name matches the new directory (skill auto-discovery contract).
grep -q '^name: dispatch-conflict$' .claude/skills/dispatch-conflict/SKILL.md

# The phase token is deliberately UNCHANGED (routing/labels stay intact).
grep -q -- '--phase fix-conflicts' .claude/skills/dispatch-conflict/SKILL.md
grep -q 'dispatch:fix-conflicts-attempt' .claude/skills/dispatch-conflict/SKILL.md

# Recovery map routes the renamed skill back to the stable phase token.
grep -q 'dispatch-conflict) echo "fix-conflicts"' \
  .claude/skills/dispatch-propagate/scripts/dispatch-recover-dispatched-phase
```

```verify
# Full dispatch script suite stays green (phase routing, preflight, recovery).
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Manual / judgment steps:
- Confirm the Unit-3 emitter site: trace the legacy `fix-conflicts`-phase
  worker launch from `dispatch-tick` through to wherever it hands the worker
  session its opening directive, and confirm it now reads `/dispatch-conflict`.
- Confirm every surviving grep hit for the string `fix-conflicts` anywhere in
  the repo is a genuine phase-token/label/attempt-counter use, not a stray
  skill-name reference — this discrimination is the only real judgment call in
  this otherwise-mechanical tactic.
- Confirm `.claude/skills/dispatch-conflict/SKILL.md`'s Steps (the renamed
  Lane 1) are byte-identical in behavior to the pre-rename `fix-conflicts`
  skill except for the frontmatter `name`/`description` and in-prose
  self-references — no other line's meaning should have moved.
