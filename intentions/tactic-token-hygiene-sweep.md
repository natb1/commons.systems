---
id: tactic-token-hygiene-sweep
kind: tactic
statement: read-before-edit preamble line in the fix-lane subagent prompts — the
  one hygiene item with a repo-controlled landing spot
owner: ai
status: codified
parent: null
rationale: "Finalized and narrowed from the 2026-07-04 interview draft by
  /align-tactics round 1: the payload-discipline item is already satisfied in
  the qa skills, the EnterWorktree item has no repo-controlled landing spot, and
  the qa-verify item was reinterpreted and split to
  tactic-main-qa-triage-before-provision."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  phase: review
  execution:
    strategy_fingerprint: 10f0314e331696714d42b26313b80c5a289d68ab0e3ce4d614bf2c97a94d4a67
    branch: tactic-token-hygiene-sweep
    pr: 2782
    attempts:
      qa: 1
    markers:
      - qa-done
---
# read-before-edit preamble line in the fix-lane subagent prompts — the one hygiene item with a repo-controlled landing spot

## Context

The `File has not been read yet` edit rejection fired 143 times across
126 sessions in the 2026-06-26→07-03 window — the audit's clearest
scriptable win. The landing spots are where implementation subagents are
prompted, since the phase skills themselves delegate edits:

- `implement-unit/SKILL.md:41-51` (Step 1 subagent launch) — the one
  skill whose subagent performs the edits; the constraint block at lines
  44-45 is where the line lands.
- qa-fix's fix lane constructs `/implement-unit` invocations at
  `qa-fix/SKILL.md:852-888`; review-fix's Workflow fix fan-out at
  `review-fix/SKILL.md:~301` — both forward unit context into subagent
  prompts and should carry the same line.

Items examined and deliberately dropped (recorded, not silent):

- **EnterWorktree double-entry (29×/29 sessions):** dispatch phase skills
  are EnterWorktree-free by ratchet
  (`test-dispatch-scripts.sh:27354-27394` asserts zero mentions), and the
  offending preamble is harness-injected in background jobs — no
  repo-controlled landing spot. Revisit if the count persists in the next
  audit window.
- **Screenshot/payload discipline:** already satisfied —
  `qa-main/SKILL.md:171-181` (cheapest-read-first) and
  `qa-fix/SKILL.md:456-468` (minimize browser payload).
- **qa-verify boots:** reinterpreted by drift review; split to
  `tactic-main-qa-triage-before-provision`.

## Unit 1 — the preamble line

**Recommended model:** sonnet

Scope:
- `implement-unit/SKILL.md` Step 1 constraint block (lines 44-45): add
  "Read any file with the Read tool before your first Edit or Write to it
  in this session — the edit is rejected otherwise and the retry burns
  the tokens twice."
- Forward the same sentence where fix-lane subagent prompts are built:
  `qa-fix/SKILL.md:852-888` (unit prompt construction) and review-fix's
  Workflow fix-agent prompt (`review-fix/SKILL.md` Step 2 fan-out).
- Keep phrasing identical at all three sites so a future consolidation
  can grep for it.
- No test surface beyond the existing skill-prose ratchets; verify by
  grep.

## Dependencies

None.

## Reuse

- Existing constraint block phrasing in `implement-unit/SKILL.md:44-45`.

## Verification

```verify
grep -c "before your first Edit" .claude/skills/implement-unit/SKILL.md .claude/skills/qa-fix/SKILL.md .claude/skills/review-fix/SKILL.md
```

Manual: the next audit window's `tool_errors` shows the
`File has not been read yet` signature falling from its 143×/126-session
baseline.

## Implementation notes

Single unit; implement in a subagent with `model: sonnet`; supply this
Context and Scope; constrain to working-tree edits. SKILL.md commits can
hit the auto-mode agent-behavior gate — expect a grant prompt.
`strategy_fingerprint` recipe (interim until tactic-graph-dispatch-schema
lands): sha256 hex of `JSON.stringify({statement, clarifications,
conditions, serves, success_signal, tooling_goals})` as loaded by
intentionsutil `listNodes`.

## main-qa residue (qa 2026-07-06)

- The next dispatch-token-audit window (after 2026-07-06) should show the 'File has not been read yet' tool_errors signature falling from its 143x/126-session baseline (2026-06-26 to 2026-07-03 window), now that implement-unit/SKILL.md, qa-fix/SKILL.md, review-fix/SKILL.md (prose), and .claude/workflows/review-fix.js (the actual fix-agent prompt builder) all carry the read-before-edit line. This is the plan's own stated manual verification step and can only be observed against real future dispatch sessions, not verified pre-merge.
