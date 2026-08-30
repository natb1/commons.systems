---
id: tactic-clarification-citation-ids
kind: tactic
statement: Lazy clarification ids — entries gain an optional id slug when cited;
  '<node-id>#<slug>' citations resolve under a validate-graph rule
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: ordinal
  clarification citations broke twice (commit 7cb64dbc; entries 35/37 on
  strategy-graph-native-dispatch, repaired 2026-07-09 with question-anchored
  interim refs). Citations must be insertion-stable and checkable."
reading: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-clarification-citation-ids
  pr: 3041
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-clarification-citation-ids

## Context

Free-text ordinal references ("clarification 26") shift on insertion and
nothing validates them — the off-by-N class recurred twice (commit 7cb64dbc;
entries 35/37 on strategy-graph-native-dispatch, repaired 2026-07-09 with
question-anchored interim refs). Decision: lazy ids — a clarification entry
gains an id slug only when something cites it; citations use
`<node-id>#<slug>`; a validate-graph rule resolves every such citation.
Blocking constraint today: `validateNode` drops unknown keys, so the schema
change must land before any id can be stored.

## Units

### Unit 1 — Schema: optional `id` on Clarification

**Scope:**

- `packages/intentionsutil/src/schema.ts`: the `Clarification` interface
  (`schema.ts:54-57`) gains optional `id: string | null` (default null);
  `validateNode`'s clarification validation enforces kebab-case slug format
  and per-node uniqueness when present. Omit-at-default serialization applies
  if tactic-omit-default-serialization has landed (uncited entries carry no
  id line either way — that is the lazy-id point).
- Unit tests: valid slug accepted, malformed slug rejected, duplicate slugs
  within one node rejected, absent id defaults null.

**Recommended model:** sonnet

### Unit 2 — validate-graph citation resolution rule

**Scope:**

- Define the citation grammar precisely: an occurrence of
  `<node-id>#<slug>` where `<node-id>` matches an existing node id and
  `#<slug>` is a kebab-case fragment, scanned in `statement`, `rationale`,
  every clarification `question`/`answer`, and every `attributes.conditions`
  entry. Design the matcher so ordinary prose (markdown headings, GitHub
  `#123` issue refs, URLs) can never false-positive — anchor on the node-id
  prefix resolving to a real node before treating `#` as a citation.
- `validateGraph` (`packages/intentionsutil/src/schema.ts:530-720`) gains the
  rule: every citation resolves to an existing entry id on the named node;
  an unresolved citation fails naming the source node and field.
- Tests: resolving citation passes; dangling slug fails; a `#` in prose that
  does not follow a real node id is ignored.

**Recommended model:** opus

**Dependencies:** Unit 1.

### Unit 3 — Upgrade the interim question-anchored references

**Scope:**

- Convert the 2026-07-09 question-anchored repairs on
  `intentions/strategy-graph-native-dispatch.md` (and any other
  "(the ... clarification, <date>)" interim forms a grep over `intentions/`
  finds) to `<node-id>#<slug>` citations, assigning slugs to the cited
  entries via `packages/intentionsutil/scripts/write-node.ts`.
- Ordinal references elsewhere upgrade opportunistically as nodes are next
  amended — explicitly NO big-bang rewrite of 44-entry histories in this PR.

**Recommended model:** sonnet

**Dependencies:** Units 1-2.

## Reuse

- `validateGraph`'s existing per-field error conventions
  (`packages/intentionsutil/src/schema.ts:530-720`).
- `listNodes` (`packages/intentionsutil/src/store.ts:88`) for the corpus
  scan.
- `packages/intentionsutil/scripts/write-node.ts` for the Unit-3 rewrites.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: author a dangling citation locally and confirm validate-graph rejects
it naming the source field; revert. Confirm the upgraded references on
strategy-graph-native-dispatch resolve, and that uncited clarification
entries carry no id.

## needs-main residue

- id: 11; title: Remaining ordinal references graph-wide are left unmigrated;
  url_path: current; expected_outcome: Remaining "(entry N)"-style ordinal
  references graph-wide are accepted as staying vulnerable to the off-by-N
  bug class this tactic addresses, until each node is next amended
  (opportunistic upgrade), per the PR's own explicit no-big-bang-rewrite
  scope constraint (Unit 3).
  finding: This is an explicit planned deferral stated by both Unit 3 and
  the PR body itself — not a defect found by QA. Recorded here per the
  disposition workflow's needs-main routing for planned-deferral items.
  Verifiability: MACHINE
  Check: On main post-merge, `npx tsx
  packages/intentionsutil/scripts/validate-graph.ts` should remain clean
  (confirms no dangling-citation regression was introduced), and a spot
  check of `intentions/*.md` should show no big-bang rewrite of ordinal
  references was silently added beyond this PR's declared Unit 3 scope
  (the 4 sites on strategy-graph-native-dispatch's `reaping` entry, fixed
  in the qa-fix auto-fix pass).
