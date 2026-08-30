---
id: tactic-outcome-envelope-node-lane-parity
kind: tactic
statement: "the dispatch outcome envelope (dispatch-emit-outcome /
  dispatch:outcome:v1) has no graph-native node-lane parity: it hard-requires a
  positive-integer --issue and carries no node_id field, unlike the session
  sidecar stamp which already supports both"
owner: ai
status: codified
parent: null
rationale: "Discovered 2026-07-16 during a /qa-fix pass on
  tactic-graph-frozen-tactic-dispatch (PR #2883, the node lane's own first-ever
  bootstrap through the frozen-tactic-dispatch capability it defines). The
  qa-fix node lane resolves N to the node id (a non-numeric string), yet Step
  6/Escalation instruct emitting the outcome envelope with --issue \"$N\"
  against .claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome, which
  unconditionally requires --issue to be a positive integer (_require_pos_int,
  no --node-id alternative) and whose envelope schema
  (.claude/docs/outcome-envelope.md field table) has no node_id field at all.
  The session worked around it by reusing the PR number for --issue, which
  .claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh's pooled
  by_phase_outcome reduce does not read (it keys only on .outcome.phase and sums
  counts), so no pooled metric is corrupted -- but a per-session debug dump of
  the envelope shows an 'issue' field that is actually a PR number, and the
  field is semantically wrong on the node lane. This is not an isolated qa-fix
  oversight: review-fix/SKILL.md has the identical unresolved contradiction --
  its own idempotency preamble states 'On the node lane ... never pass --issue'
  (line 64-65), yet its own emit-outcome call templates at the deviation and
  no-deviation completion paths (lines ~923, ~961) unconditionally include
  --issue <N> with no node-lane branch. Distinct from
  tactic-token-audit-node-attribution (merged, PR #2777): that tactic gave the
  per-SESSION dispatch-stamp-session sidecar (<sid>.dispatch-stamp.json) node_id
  parity and the aggregate-usage.sh by_node join -- a different, already-solved
  channel. This tactic is the outcome-envelope's OWN per-RUN
  findings/fixes/disposition channel (the dispatch:outcome:v1 JSON block
  dispatch-emit-outcome prints), which was never touched by that work and still
  has zero node-lane awareness -- no node_id field in the schema, script, or
  aggregate-usage.sh's envelope parsing (lines ~322-370, ~706-728). Fix shape:
  add a nullable node_id field to the envelope (mirroring the sidecar's shape),
  make --issue optional when --node-id is supplied (or vice versa) in
  dispatch-emit-outcome, update the field table and worked example in
  .claude/docs/outcome-envelope.md, extend aggregate-usage.sh's envelope
  parse/by_phase_outcome to carry node_id through (not required for the pooled
  phase metric, but should be available for a future by-node join analogous to
  the sidecar's), and fix qa-fix/SKILL.md's and review-fix/SKILL.md's node-lane
  emit-outcome call sites to pass --node-id \"$N\" instead of reusing the PR
  number for --issue. Same shape as the five gaps
  tactic-graph-node-lane-write-hardening (PR #2882) already tracked and fixed
  for the node lane's authoring/transition convention -- this is a sixth, in the
  outcome-envelope's own emit path, discovered after that tactic's scope had
  already closed. SECOND CONFIRMED MEMBER OF THE SAME FAMILY, folded in
  2026-07-29 (/align-strategy round on strategy-graph-native-dispatch):
  dispatch-write-phase-log has the identical bug shape — qa-fix/SKILL.md's and
  review-fix/SKILL.md's node-lane phase-log writes pass \"$N\" (the node id)
  while the script validates its issue-num positionally as a positive integer
  and hard-rejects anything else. Confirmed live twice: 2026-07-18 on a
  /review-fix re-entry pass over PR #2882 (exit 2, 'issue-num must be a positive
  integer'), and again 2026-07-29 on a /qa-fix pass over PR #2985, where the
  session again worked around it by passing the resolved numeric $PR_NUM. The
  author confirmed this node is the node of record for the whole numeric-arg
  family rather than just the emit-outcome instance, so dispatch-write-phase-log
  is tracked here as an added unit instead of being filed as a duplicate tactic;
  the interim workaround for any such call site stays uniform — pass the
  resolved numeric $PR_NUM in place of $N for the script's numeric arg, never a
  per-script variant. DISJOINT from tactic-qa-fix-node-terminal-declaration
  (serving strategy-graph-native-dispatch), which fixes a different defect in
  the adjacent lines of the same qa-fix node-lane terminal section — a missing
  mark-node-terminal declaration on the fix-finalize path. The two must not be
  planned as one unit, but if both are in flight simultaneously they will
  conflict textually in that file region."
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
    Author-directed 2026-08-03: prioritize progression of token-efficiency work
    ahead of bug-fix work and ahead of the undecomposed baseline. Matches the
    boost 20 already carried by the review-phase token-cost cluster
    (tactic-review-skill-body-decomposition and its siblings). Simulated over
    the live store before writing: 0 tier changes, 0 value drift onto non-target
    nodes, resolves to 20.00.


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
  branch: tactic-outcome-envelope-node-lane-parity
  pr: 3030
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T02:45:28Z
    mergeCommitSha: e05c1e78d1dc81a95cb2a6128f0a5740ac5ec65c
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
# Outcome envelope node-lane parity

## Context

The dispatch outcome envelope (`dispatch-emit-outcome` → the
`<!-- dispatch:outcome:v1 -->` JSON block) is the per-run findings/fixes/
disposition channel the token audit reads to compute per-phase hit rates
(`.claude/docs/outcome-envelope.md`). It predates the graph-native node lane
and has **no** node-lane parity: `dispatch-emit-outcome` unconditionally
requires `--issue` to be a positive integer
(`_require_pos_int issue`, script line 205), and the envelope schema has no
`node_id` field at all (doc field table, `outcome-envelope.md:41-55`).

On the node lane the dispatch target `$N` is a non-numeric intention-node id,
not an issue number. Both phase skills already declare "never pass `--issue`"
on the node lane (`review-fix/SKILL.md:64-65`, and qa-fix's Node-target lane
at `qa-fix/SKILL.md:196-217, 304`), yet their own `dispatch-emit-outcome`
call templates still hardcode `--issue "$N"` / `--issue <N>` with no node-lane
branch — a live contradiction. A `/qa-fix` node-lane run on
`tactic-graph-frozen-tactic-dispatch` (PR #2883) had to work around it by
passing the PR number for `--issue`; that value is semantically wrong (an
`issue` field carrying a PR number) even though the pooled `by_phase_outcome`
reduce keys only on `.outcome.phase` and does not read it, so no pooled metric
was corrupted.

This is the sixth node-lane gap in the family
`tactic-graph-node-lane-write-hardening` (PR #2882) tracked — discovered after
that tactic's scope had closed — and it is the outcome-envelope's own emit
channel, distinct from the per-session sidecar's node_id parity already solved
by `tactic-token-audit-node-attribution` (PR #2777). The fix mirrors the
sidecar's dual `issue`/`node_id` shape exactly (`dispatch-stamp-session:15-19`:
`issue:<N|null>, node_id:<string|null>`): the envelope gains a nullable
`node_id`, `dispatch-emit-outcome` accepts `--node-id` as an alternative to
`--issue` (exactly one required), the doc records the field, the reader carries
it through, and both SKILLs branch their emit call sites on the lane.

Intended outcome: a node-lane phase emits a correct envelope whose `issue` is
`null` and `node_id` is the node id — no PR-number-in-`issue` workaround, and a
`node_id` available for a future by-node join analogous to the sidecar's
`by_node` aggregate.

## Reuse

- `_require_pos_int` and the `--arg`/`--argjson` nullable-field pattern already
  in `dispatch-emit-outcome`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome:197-254`) —
  add `--node-id` handling in the same shape (`node_id_arg=(--arg node_id ...)`
  / `(--argjson node_id null)`), do not invent a new idiom.
- The node-id slug regex `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` with the numeric-prefix
  reject, already used verbatim in
  `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:52-53` —
  reuse it for the `--node-id` validator (same message convention: "expected a
  lowercase node-id slug; numeric-prefixed names are the legacy gh lane").
- The dual `issue`/`node_id` nullable shape and its documentation prose in
  `dispatch-stamp-session:15-38` — mirror it in the envelope doc.
- `test-helpers.sh` (`assert_eq`, `assert_contains`, `report_results`), already
  sourced by `test-emit-outcome.sh` — add cases in the existing suite style.
- The `envelope_block` / `envelope_block_pretty` fixture helpers in
  `test-aggregate-usage.sh:62-63` — build a node_id fixture with them.

## Units of work

### Unit 1 — `dispatch-emit-outcome`: accept `--node-id`, emit `node_id`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome`
and its test `.claude/skills/dispatch-propagate/scripts/test-emit-outcome.sh`.

- Add a `NODE_ID=""` var and a `--node-id) ... NODE_ID="$2"; shift 2` parser arm
  (after the `--issue` arm, ~line 107); update the usage heredoc + header
  comment (lines 4-16, 71-91) to document `--node-id` as the alternative to
  `--issue`.
- Replace the unconditional `_require issue "$ISSUE"` (line 155) and
  `_require_pos_int issue "$ISSUE"` (line 205) with an **exactly-one-of**
  contract: exactly one of `--issue` / `--node-id` must be non-empty (error to
  stderr + exit 2 when both or neither are given — a clear error, per
  `.claude/rules/code-style.md`, not a fallback). When `ISSUE` is set, keep
  `_require_pos_int issue`; when `NODE_ID` is set, validate it with a new
  `_require_node_id` using the reused slug regex above.
- Bind both fields in the jq call (lines 263-291): `issue` as `--argjson issue
  "$ISSUE"` when set else `--argjson issue null`; add `node_id` as `--arg
  node_id "$NODE_ID"` when set else `--argjson node_id null`. Place `node_id`
  immediately after `issue` in the object literal (line 280) so field order
  still matches the doc table (Unit 2 puts `node_id` right after `issue`).
- `test-emit-outcome.sh`: add a Suite-3 block covering — (a) `--node-id
  tactic-foo` with no `--issue` → exit 0, JSON `issue==null`,
  `node_id=="tactic-foo"`; (b) `--issue 42` with no `--node-id` → exit 0, JSON
  `issue==42`, `node_id==null`; (c) neither → exit 2; (d) both → exit 2; (e)
  numeric `--node-id 42` → exit 2 (slug reject). The existing `COMMON` array
  passes `--issue 1907`; keep the existing suites unchanged (they stay
  issue-lane, proving no regression).

**Recommended model.** sonnet — well-specified, single-file shell change with a
clear diff shape plus explicit test cases; reuses existing validators and idioms.

### Unit 2 — `outcome-envelope.md`: document `node_id` and the issue/node_id alternative

**Scope.** `.claude/docs/outcome-envelope.md` only.

- Field table (lines 41-55): change the `issue` row's Nullable from `no` to
  `yes` and its Notes to "the dispatch issue number on the issue lane, or `null`
  on the node lane"; add a `node_id` row immediately after it — `string | yes |
  the intention-graph node id on the node lane, or `null` on the issue lane`.
- Add a short prose sentence under the table: exactly one of `issue` / `node_id`
  is non-null — the issue lane sets `issue` (node_id null), the node lane sets
  `node_id` (issue null) — mirroring the session sidecar's dual shape
  (`dispatch-stamp-session`).
- Worked example (lines 200-219): add `"node_id": null` immediately after the
  `"issue"` line so the example stays field-complete and matches emit order.
  Add a second, node-lane worked example block (or a one-line variant note)
  showing `"issue": null, "node_id": "tactic-…"`.
- Carrier-shape example (lines 17-22) needs no change (it is an ellipsis).

**Dependencies.** Unit 1 (the field name `node_id` and emit order are fixed by
Unit 1; the doc must match).

**Recommended model.** sonnet — documentation edit tracking a settled schema.

### Unit 3 — `aggregate-usage.sh`: carry `node_id` through, test it

**Scope.**
`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh` and its test
`.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh`.

- No structural reduce change is required: the parsed `$outcome` is the **whole**
  envelope object (`aggregate-usage.sh:372-374`) and rides untouched into the
  per-session `outcome:` field (line 423) and into `by_phase_outcome`, so a
  `node_id` key already survives parsing. The strict-count validation
  (lines 371-374) checks only the three rate-feeding counts and does not strip
  extra keys, so `node_id` passes through unharmed.
- Make that guarantee explicit and durable: add a comment at the envelope-parse
  block (near line 357) noting that `node_id`, when present, is carried through
  on `.outcome.node_id` and is available for a future by-node-outcome join
  analogous to the sidecar's `by_node` (lines 588-594) — no reduce change now
  (YAGNI; the pooled phase metric keys on `.phase`).
- `test-aggregate-usage.sh`: add one fixture session whose envelope carries a
  non-null `node_id`, and assert the per-session summary surfaces
  `.outcome.node_id == "<the id>"` (a regression guard that the passthrough is
  not lost). Reuse `envelope_block_pretty`.

**Dependencies.** Unit 1 (defines the `node_id` field the fixture emits).

**Recommended model.** sonnet — a comment + one jq-fixture test assertion, no
logic change.

### Unit 4 — qa-fix + review-fix SKILLs: branch emit calls on the lane

**Scope.** `.claude/skills/qa-fix/SKILL.md` (three emit-outcome templates at
~1047, ~1368, ~1483) and `.claude/skills/review-fix/SKILL.md` (two templates at
~923, ~961). No other files.

- At each `dispatch-emit-outcome` template, replace the hardcoded
  `--issue "$N"` / `--issue <N>` with a lane-conditional: on the node lane
  (`TARGET_KIND=node`), pass `--node-id "$N"` and omit `--issue`; on the issue
  lane, keep `--issue "$N"` and omit `--node-id`. Prefer one normative sentence
  stating the substitution rule for all emit sites in each SKILL (qa-fix in its
  Node-target lane section near line 304; review-fix in its node-lane preamble
  at lines 64-65, which already says "never pass `--issue`" — extend it to name
  the `--node-id "$N"` substitution at the emit sites), then annotate each
  template inline so a fresh session reading only that block still branches
  correctly. Keep the surrounding count/disposition/`--base-sha` guidance
  unchanged.
- Do not alter the envelope's sandbox note ("do not pass
  `dangerouslyDisableSandbox`") — `dispatch-emit-outcome` stays pure.

**Dependencies.** Unit 1 (the `--node-id` flag must exist before the SKILLs
reference it).

**Recommended model.** sonnet — rote wiring across two SKILL files against a
now-existing flag; the diff shape is explicit and the node-lane preambles
already state the intent.

## Verification

Auto-runnable:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-emit-outcome.sh || exit 1
bash .claude/skills/rsi-audit/scripts/test-aggregate-usage.sh || exit 1
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The two test scripts are auto-discovered and run by
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh` in CI (the
`test-*.sh` globs over the dispatch and token-audit script dirs); running them
directly is the CI-equivalent check. `run-lint.sh` enforces the prose rules on
committed `.sh` (including the `jq`/`echo` control-char rule) over the edited
scripts.

Manual smoke checks (prose — quick shell one-liners against the built script):

- `dispatch-emit-outcome --phase qa --repo natb1/commons.systems --node-id
  tactic-foo --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0
  --followups-filed 0 --subagents-launched 0 --disposition completed` prints an
  envelope with `"issue": null, "node_id": "tactic-foo"` and exits 0.
- The same call with `--issue 42` and no `--node-id` prints `"issue": 42,
  "node_id": null`.
- Passing neither, or both, exits 2 with a clear message; a numeric
  `--node-id 42` exits 2 (slug reject).
- Read-review the two SKILLs: every `dispatch-emit-outcome` template honors its
  own node-lane "never pass `--issue`" preamble.
