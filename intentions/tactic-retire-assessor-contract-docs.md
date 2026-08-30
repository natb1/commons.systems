---
id: tactic-retire-assessor-contract-docs
kind: tactic
statement: Retire the two superseded assessor contracts —
  .claude/docs/delegability.md, .claude/docs/signal-identification.md, and their
  ref-delegability / ref-signal-identification skills — whose headers still name
  tactic-align-audit-legacy-review as the pending decider for a
  decision the 2026-07-23 sitting already made
owner: ai
status: codified
parent: null
rationale: "Residue found while pruning tactic-align-audit-legacy-review (this
  /align-tactics tactic-target round). That sitting's Decision 1 recorded that
  the delegability.eval.v1 and signal.eval.v1 assessor contracts are superseded
  by native graph fields (owner, success_signal, reading, router gates), and
  that both retired rung-5 engines retire wholesale with no graft into
  /align-audit. The two contract docs and their ref-* skills were never
  reconciled with that decision: their headers still frame the decision as
  pending and cite the node as its home. That node is NOT pruned: this round's
  prune never landed, and the 2026-08-28 author sitting re-authorized it under
  D1 without executing it, so the headers misdescribe a settled decision today
  and go dangling as well once the prune lands. Per
  strategy-graph-native-dispatch's sole-tracker rule the residue
  lands as a tactic, rather than as an out-of-scope edit inside an
  /align-tactics round whose only artifacts are intentions/*.md nodes."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Retire the two superseded assessor contracts — .claude/docs/delegability.md, .claude/docs/signal-identification.md, and their ref-delegability / ref-signal-identification skills — whose headers still name tactic-align-audit-legacy-review as the pending decider for a decision the 2026-07-23 sitting already made

One PR. Deletes two docs and two skill directories and corrects two surviving
prose pointers; no code, no tests, no runtime surface. Filed 2026-08-18 by the `/align-tactics
tactic-align-audit-legacy-review` round. (That round was ORIGINALLY described
here as having pruned the node these files cite. It did not — the prune was
owed, not performed, and as of 2026-08-29 the node is still on `origin/main`.
Corrected by the reference sweep `tactic-align-legacy-review-reference-sweep`.)

## Context

`.claude/docs/delegability.md` and `.claude/docs/signal-identification.md`
define the `delegability.eval.v1` and `signal.eval.v1` contracts — the
per-intention-node assessor outputs that were the core of the retired
`/align-init` skill's rung-5 dialectic. `.claude/skills/ref-delegability/` and
`.claude/skills/ref-signal-identification/` are thin reference skills written
entirely against those two docs.

Three independent facts make all four files dead:

1. **The engines they belong to are retired, wholesale.** The 2026-07-23
   office-hours sitting on `tactic-align-audit-legacy-review` (author present)
   resolved Decision 1: both retired engines retire wholesale, there is no
   contrarian/consistency graft into `/align-audit`, and "the
   `delegability.eval.v1` and `signal.eval.v1` assessor contracts are superseded
   by native graph fields (owner, success_signal, readings, router gates)."
   The surviving records of that decision are the clarification on
   `intentions/tactic-align-audit-skill.md` (points 2 and 3) and the
   `Is the 2026-07-09 successor-cadence deferral ratified?` clarification on
   `intentions/strategy-explicit-intent.md`.
2. **Their entry point no longer exists.** `tactic-align-entrypoint-consolidation`
   is `phase: done` (PR #2983, merged 2026-08-04); `.claude/skills/align-init/`
   is gone from the tree. Both docs already say so in their own headers ("No
   entry point runs this evaluation today").
3. **Their stated forward pointer is now dangling.** Both headers say the
   rung-5 design "is retained by the intention node
   `tactic-align-audit-legacy-review`
   (`intentions/tactic-align-audit-legacy-review.md`), which decides whether a
   future `/align-audit` re-consumes this contract" —
   `.claude/docs/delegability.md:9-15` and
   `.claude/docs/signal-identification.md:9-16`. That decision was made
   (fact 1). The node itself is **not** pruned: the `/align-tactics` round that
   filed this tactic never landed its prune — this file was recovered
   unversioned from that round's worktree on 2026-08-28 — and the 2026-08-28
   author sitting re-authorized the prune under D1 without executing it. So the
   pointer is stale on its **decided** limb today, and becomes dangling as well
   once D1's prune lands. Neither limb depends on the other: the headers
   misdescribe a settled decision whether or not the node survives.

Greenfield (`.claude/rules/design-proposals.md`): building today, none of these
four files would exist — the contract they specify has no consumer, no entry
point, and a decided-against future. So delete them rather than restamp their
headers with a "superseded" note; a corrected header would preserve ~750 lines
of specification for a contract nothing may implement. Nothing here needs a
brownfield migration path: the change is a single-PR deletion with no
backwards-incompatibility, because there is no live caller to break.

Recoverability is already covered and needs no duplication into the graph: the
pre-deletion `/align-init` source is at `origin/main` commit `44493733`, both
docs and both skills stay in git history, and the pruned node is recoverable
the same way (`validateGraphProseRefs` classifies a pruned id as `pruned`, not
`missing`, so prose citations of it elsewhere keep resolving).

## Unit 1 — delete the two contract docs and the two ref-* skills

**Recommended model:** sonnet

Mechanical deletion with a verified-no-live-consumer precondition. No design
judgment: the retirement decision is already recorded (see Context), this unit
only executes it.

**Scope — delete these four paths:**

- `.claude/docs/delegability.md`
- `.claude/docs/signal-identification.md`
- `.claude/skills/ref-delegability/` (the whole directory — `SKILL.md` and any
  siblings)
- `.claude/skills/ref-signal-identification/` (the whole directory)

**Explicitly out of scope:**

- Any other `.claude/docs/*` or `ref-*` skill. In particular
  `ref-memory-management`, `ref-github-issues`, `ref-issue-labels`,
  `ref-diagnosis-time-cas` are untouched — they are separate retirements or
  live references with their own dispositions.
- `packages/intentionsutil/scripts/read-sensors.ts:28`, which mentions
  `.claude/docs/signal-identification.md` in a comment. Correcting that comment
  is Unit 2, not this unit — keep the deletion commit purely a deletion.
- Any intentions node. This tactic changes no graph content; the graph-side
  decision already landed.
- `/align-audit` and `intentions/tactic-align-audit-skill.md`. The sitting
  declined the graft; nothing about the audit changes here.

**Precondition to re-verify before deleting** (the tree may have moved since
2026-08-18): confirm no live consumer has appeared. Run

```bash
LC_ALL=C git grep -an \
  -e 'ref-delegability' \
  -e 'ref-signal-identification' \
  -e 'delegability\.eval\.v1' \
  -e 'signal\.eval\.v1' \
  -e 'docs/delegability' \
  -e 'docs/signal-identification' \
  -- .
rc=$?
[ "$rc" -le 1 ] || { echo "sweep ERRORED (git grep rc=$rc) — re-run before judging"; exit 1; }
[ "$rc" -eq 1 ] && echo "(no hits)"
exit 0
```

and read every hit. As of 2026-08-18 the only hits outside the four
to-be-deleted paths were: `packages/intentionsutil/scripts/read-sensors.ts:28`
(a comment — Unit 2), `intentions/tactic-drain-disposition-diagnosis-cas.md`
(`phase: done`, citing the two `SKILL.md` files only as a format/tone template
for its own already-completed Unit 4 — historical, no live dependency), and
`intentions/tactic-align-audit-legacy-review.md` (**still present** on
`origin/main` as of 2026-08-29 — expect it, and do not read its presence as a
live consumer; D1's prune is owed but unexecuted, and now carries a structural
`blocked_by` edge to `tactic-align-legacy-review-reference-sweep`, so it cannot
run until that sweep ships). If the sweep now shows a hit that is
none of those — an executable caller, an agent definition, or a skill that
loads either doc — **stop and park to office_hours** rather than deleting: a
live consumer would mean the retirement decision has been overtaken, which is
an author call, not this unit's.

## Unit 2 — correct the surviving prose pointer in `read-sensors.ts`

**Recommended model:** sonnet

**Dependencies:** Unit 1 (delete first, then fix the reference the deletion
orphans — doing it in this order keeps Unit 1's diff a pure deletion).

**Scope:** `packages/intentionsutil/scripts/read-sensors.ts:28` carries a
comment citing `.claude/docs/signal-identification.md` as the definition source
for the sensor/proxy distinction. Rewrite that comment so it no longer points
at a deleted file — state the distinction inline, or cite the live definition
in `packages/intentionsutil/src/schema.ts` (`success_signal`'s
`{observable, sensor, threshold, is_proxy}` shape) instead. Comment text only;
do not change `read-sensors.ts` behavior.

**Out of scope:** every other line of `read-sensors.ts`, and its
readings-writing side effect.

## Unit 3 — retire the pending-decision framing in `/align-audit`'s own skill

**Recommended model:** sonnet

**Dependencies:** none on Units 1–2 (a different file, a different claim); may
run in the same PR.

Added 2026-08-28. The original filing missed this site, so its "one surviving
prose pointer" count was one short.

**Scope:** `.claude/skills/align-audit/SKILL.md` — the
**Folding in the retired dialectic / improvement-pass components** bullet in the
out-of-scope list (at `:329-334` on `origin/main` `59ea8410`; re-locate it by
the bullet's **heading text**, not the line number, which moves). It reads:

> whether components of the retired rung-5 dialectic and the retired
> `/align-strategy` improvement pass belong in `/align-audit` is a pending
> inclusion decision owned by the born-parked office-hours sitting
> `tactic-align-audit-legacy-review`. Author this skill **without** them; that
> sitting amends it if it decides to fold them in.

Every clause of that is now false. The decision is **not pending** — the
2026-07-23 sitting resolved it (Context fact 1). The node is **not born-parked**
— it is `office_hours: null` on `origin/main`. And no future amendment is
coming, because the sitting decided **against** the graft.

Rewrite the bullet to record the decision as **settled and negative**: the
retired rung-5 dialectic and the retired `/align-strategy` improvement pass are
**not** folded into `/align-audit`, decided 2026-07-23, and this skill is
authored without them permanently. Cite the two surviving records of that
decision named in Context fact 1 — the clarification on
`intentions/tactic-align-audit-skill.md` (points 2 and 3) and the
`Is the 2026-07-09 successor-cadence deferral ratified?` clarification on
`intentions/strategy-explicit-intent.md` — **not** the pruned-or-pruning node,
which is the stale pointer being removed.

**Out of scope:** every other bullet in that list, and every other section of
`align-audit/SKILL.md`. Do not use this unit to re-open the graft decision;
recording it is the whole job.

**Why this cannot wait for D1's prune.** The bullet is wrong on its
*decided/pending* limb today, independent of whether the node it names still
exists. D1's prune only adds a second defect on top.

## Reuse

Nothing to build, so there is no implementation to reuse. Two existing facts to
reuse rather than re-derive:

- The retirement decision itself — read it from
  `intentions/tactic-align-audit-skill.md`'s 2026-07-23 clarification and
  `intentions/strategy-explicit-intent.md`'s successor-cadence-ratified
  clarification. Do not re-litigate it from the docs' own headers, which are the
  stale artifact this tactic removes.
- The recoverability anchor — `origin/main` commit `44493733` holds the
  pre-deletion `.claude/skills/align-init/SKILL.md`. Cite it; do not copy any of
  it into the tree.

## Verification

Both units are deletions and a comment edit, so the bar is "nothing that was
alive is now broken."

Machine checks:

```verify
test ! -e .claude/docs/delegability.md
test ! -e .claude/docs/signal-identification.md
test ! -e .claude/skills/ref-delegability
test ! -e .claude/skills/ref-signal-identification
```

Unit 3's check is the **absence of the node id** from the skill, not the
absence of a phrase: the id is a single unsplittable token, so a negated grep
for it cannot vacuously pass when the surrounding prose rewraps (the trap a
phrase-level `! grep` falls into). Unit 3's rewrite cites the two surviving
records instead of this node, so the id must be gone:

```verify
! grep -n "tactic-align-audit-legacy-review" .claude/skills/align-audit/SKILL.md
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

The residual-reference sweep must come back empty of live consumers — re-run
Unit 1's `grep` after both units land and confirm every remaining hit is inside
`intentions/` prose or git history, never an executable path:

```verify
hits=$(LC_ALL=C git grep -an \
  -e 'ref-delegability' \
  -e 'ref-signal-identification' \
  -e 'docs/delegability' \
  -e 'docs/signal-identification' \
  -- . ':(exclude)intentions'); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: residual references to the retired assessor contract docs remain outside intentions/"; exit 1; }
echo OK
```

Manual/judgment checks, which no suite covers:

- Confirm the deleted skills are gone from the session's available-skills
  listing (they are directory-discovered, so a stale entry means a directory
  survived).
- Read `read-sensors.ts`'s rewritten comment once as a fresh reader and confirm
  it stands on its own without the deleted doc.

**Landing caveat** (inherited from `tactic-align-audit-skill`'s recorded
caveat): `.claude/skills/**` edits are agent-behavior config, and dispatch auto
mode denies the *commit* — not the file write. If the commit is denied, park to
office_hours for interactive landing rather than working around the denial.
