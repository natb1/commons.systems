---
id: tactic-office-hours-graph-entry
kind: tactic
statement: graph-native office-hours entry — office_hours.recommendation schema
  field, parked-node selection in resolved-rank order, always-launch-fresh
  session recovered from the graph, read-only review-and-recommend skill rewrite
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Retained from the 2026-07-06 /align-strategy office-hours-parity
  interview (retain-not-refine): the interview fixed the design — graph
  recoverability replaces session recovery, the park write is the recovery
  artifact, the entry always launches a fresh session recovered from the graph —
  and this draft carries the implementation surface: the schema field, the owned
  selector, the launch mechanics, the skill rewrite, and the park-write contract
  each phase skill owes."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-office-hours-graph-entry
  pr: 2787
  attempts:
    qa: 1
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours:
  reason: "provision-node-worktree exit 11: origin/main does not merge clean into
    branch tactic-office-hours-graph-entry — conflicts in
    packages/intentionsutil/src/index.ts, src/schema.ts, test/schema.test.ts
    (main advanced via schema-migration-backfill and
    graph-write-validation-hardening, which rewrote the same files).
    /fix-conflicts cannot be routed for this graph node: it requires a <N>-…
    issue branch + PR and exits at Step 1 on a non-numeric branch; this node has
    no issue number or PR. The branch's Units 1-4 implementation
    (office_hours.recommendation schema field, queue selector,
    office-hours-graph bash entry, graph-native office-hours SKILL mode) is
    intact in the worktree — nothing is lost by parking. Next steps: a human
    resolves the three-file intentionsutil conflict in the worktree so
    provision-node-worktree merges clean, OR land a graph-native fix-conflicts
    that accepts node targets; either way the node re-ticks from there (note
    /review-fix also lacks node-target support, so post-merge the node rides the
    bootstrap-transition doctrine rather than an actual review run)."
  since: 2026-07-07
pace_exempt: false
rounds: null
attributes: {}
---
# graph-native office-hours entry — office_hours.recommendation schema field, parked-node selection in resolved-rank order, always-launch-fresh session recovered from the graph, read-only review-and-recommend skill rewrite

Planned 2026-07-06 by the /align-tactics finalize pass (Explore/Plan
fan-out) from the /align-strategy draft. Authoritative design record:
strategy-graph-native-dispatch clarification 30 + condition 6. One PR.

## Context

The office-hours queue is migrating from gh-label state (the
`dispatch:office-hours` label, the `office-hours` /
`office-hours-select-target` shell ladder with its five attach/resume
verbs) to the intention graph: a parked item is a node in `intentions/`
whose `office_hours` frontmatter is non-null. The park write is the
recovery artifact — reason, recommendation, and any needed state land on
the node at park time — so session attach/resume is not a supported
recovery path. This PR builds the greenfield entry beside the doomed
legacy surface (deleted later by `tactic-legacy-router-removal`, which is
`blocked_by` this tactic; do not touch the legacy scripts): a schema
extension (`office_hours.recommendation`), an owned offline-testable
selector in `packages/intentionsutil`, a thin bash entry that always
launches a fresh `--bg` session and attaches the human, and a
graph-native mode in the `/office-hours` skill (keyspace split with the
legacy lane: numeric target = legacy issue, otherwise node id).

Greenfield shape: all selection/ordering/cwd logic is pure tsx in
`packages/intentionsutil` (unit-tested against temp stores; no gh, no
daemon, no network); the bash entry does only what bash must (`cd` +
`claude --bg` + registration poll + `exec claude attach`); the skill is
prose over data the selector and node file already provide.

## Settled design decisions

1. **Selector CLI** — `packages/intentionsutil/scripts/office-hours-select.ts`.
   No args: queue head; stdout exactly one disposition line —
   `launch <node-id> <cwd>` (cwd absolute:
   `<repo-root>/.claude/worktrees/<node-id>` when that directory exists,
   else `<repo-root>`) or `empty`. `<node-id>` arg: single-item mode —
   `launch ...` if parked, `empty not-parked <node-id>` otherwise.
   `--list`: human view, one `rank\tid\tsince` line per member in
   selection order (mutually exclusive with `<node-id>`, exit 2).
   **Stderr is advisory-only**: `NOTE — <node-id> is blocked by open
   tactic(s): <ids>` when any `blocked_by` target is missing (report with
   a `(missing)` suffix — fail-visible) or has `phase != "done"`. Signal,
   not gate — never suppresses the launch line.
2. **Ordering** — nodes with `office_hours != null` sorted by
   `resolveAttention` value descending, id ascending tiebreak; a node
   absent from the attention map ranks 0.
3. **Entry split** — thin bash
   `packages/intentionsutil/scripts/office-hours-graph` (beside the bash
   `graph-commit`, the in-dir precedent) calls the tsx selector and does
   launch/attach (bash because the final step is `exec claude attach`,
   a terminal takeover). It sources **nothing** from
   `.claude/skills/dispatch-propagate/` — that lib is scheduled for
   deletion; the registration-verify and attach-by-name helpers are
   inlined mirrors of the documented contract.
4. **Location** — everything new lives in `packages/intentionsutil`
   (the surviving home). Nothing is added to the legacy scripts dir.
5. **Schema unit is skip-if-present** — `tactic-phase-skill-node-targets`
   Unit 2 carries the identical shared-home note; whichever lands first
   adds `recommendation`, the other detects it and skips.
6. **Name collision on always-fresh launch** — session name
   `office-hours-<node-id>`; if a live (non-stopped) job with that name
   exists, exit non-zero naming `claude attach <job-id>` — a clear error
   beats a duplicate name or a forbidden implicit attach.

## Unit 1 — Schema: `office_hours.recommendation` (skip-if-present)

**Recommended model:** sonnet

Scope:
- `packages/intentionsutil/src/schema.ts` — guard first: if `OfficeHours`
  already has `recommendation` (sibling tactic landed it), skip this unit.
  `OfficeHours` interface (schema.ts:338-341) gains
  `recommendation: string | null` (required key, nullable value — the
  `Execution.pr` convention, lossless round-trips);
  `validateOfficeHours` (schema.ts:380-388) gains
  `recommendation: optionalString(value.recommendation, ...)` — the
  optionalString convention (schema.ts:396), **not** `requireString`, so
  existing `{reason, since}` nodes validate with `recommendation: null`.
  No change to the goal-layer gate (rule 11, schema.ts:622-631) or the
  wiring at schema.ts:467-468.
- `packages/intentionsutil/test/schema.test.ts` — extend the round-trip
  literal (:64) with `recommendation`; new cases: bare `{reason, since}`
  defaults to null; explicit null accepted; non-string rejected. Follow
  the existing office_hours cases at :154-162 and :801-831.
- Out of scope: park-writing sites (phase skills / Stop hook — owned by
  `tactic-phase-skill-node-targets` Unit 2), goals.ts, frontier render.

## Unit 2 — Selector: `src/officeHours.ts` + `scripts/office-hours-select.ts`

**Recommended model:** opus

Depends on: Unit 1 (soft — selection never reads `recommendation`, but
land after it so branch node reads don't drop a concurrently-written
field).

Scope:
- New `packages/intentionsutil/src/officeHours.ts` — pure, no fs/env:
  `officeHoursQueue(nodes)` (filter `office_hours !== null`, join to
  `resolveAttention(nodes)` — attention.ts:163, Map unordered so sort
  here — rank desc, id asc); `openBlockers(nodes, nodeId)` (`blocked_by`
  targets missing or `phase !== "done"`); `selectOfficeHours(nodes,
  target?)` returning `{kind: "launch", nodeId, blockers}` |
  `{kind: "empty"}` | `{kind: "not-parked", nodeId}`. Export from
  `src/index.ts`.
- New `packages/intentionsutil/scripts/office-hours-select.ts` — thin
  main per frontier-view.ts:16-35 (repoRoot from import.meta.url,
  `listNodes`, main() guard) and write-node.ts:43-62 arg parsing.
  Exported-for-tests `resolveSessionCwd(repoRoot, nodeId)` (existsSync
  on `.claude/worktrees/<nodeId>`, directory check; a target failing the
  store's path-safe-id posture exits 2 without touching the fs) and
  `formatDisposition(disposition, cwdResolver)` returning
  `{stdout, stderr}` so the full line contract is unit-testable; main()
  just prints.
- New `packages/intentionsutil/test/office-hours.test.ts` — vitest,
  `anode()`/`kindNodes()` builder pattern (attention.test.ts:7-33).
  Cases: rank/tiebreak ordering (force ranks via `attention` boosts);
  empty queue; explicit-target hit / not-parked / nonexistent; blocker
  detection incl. missing target and done-blocker excluded;
  `resolveSessionCwd` with/without worktree dir (temp dirs per
  write-node.test.ts:8-10); `formatDisposition` exact strings.
- Out of scope: any daemon or gh call — the selector is 100% offline;
  liveness is not its concern (no attach path exists).

## Unit 3 — Entry script: `scripts/office-hours-graph` (bash)

**Recommended model:** sonnet

Depends on: Unit 2 (consumes its disposition lines).

Scope — new executable `packages/intentionsutil/scripts/office-hours-graph`
(`set -euo pipefail`; header documents the disposition contract and the
sandbox caveat: `claude agents --json` needs the daemon Unix socket —
run with `dangerouslyDisableSandbox: true`, per the lib-claude-agents.sh:168
warning that a sandboxed call returns `[]`):
- Repo root from `$0` (`SCRIPT_DIR/../../..`); optional positional arg
  passed through verbatim to the selector; no `--list` passthrough.
- `directive=$(npx tsx "$SCRIPT_DIR/office-hours-select.ts" ...)` —
  capture stdout only; the selector's stderr `NOTE —` advisory passes
  straight to the terminal (the do-not-redirect note, legacy
  office-hours:86-89).
- Dispatch: `empty` / `empty not-parked <id>` → precise message, exit 0,
  no launch (mirror legacy :316-327). `launch <node-id> <cwd>` →
  fresh-launch. Unknown verb → exit 1.
- Fresh-launch, mirroring (never sourcing) legacy office-hours:246-255:
  pre-check a live non-stopped `office-hours-<node-id>` job in
  `claude agents --json --all` → exit 1 naming its job id (decision 6);
  `( cd "$cwd" && "$CLAUDE_CMD" --bg --name "office-hours-<node-id>"
  --permission-mode auto "/office-hours <node-id>" )`; gate on rc==0 AND
  an inlined bounded-retry registration poll (5 × 0.2s over
  `claude agents --json`, match name, skip `stopped` rows — the
  verify_agent_registered_under contract, lib-claude-agents.sh:573-601);
  no `--fork-session` retry (fork is resume-only; a fresh kick that
  fails to register is a hard error); then
  `exec "$CLAUDE_CMD" attach "$job_id"` with the job id resolved by name
  from `claude agents --json --all` (attach keys on the daemon job id,
  never a sessionId — the regression documented at office-hours:127-158).
- `CLAUDE_CMD="${OFFICE_HOURS_CLAUDE_CMD:-claude}"` (legacy :125 pattern)
  so launch/verify/attach can be smoke-tested against a stub.
- Out of scope: touching `.claude/skills/dispatch-propagate/scripts/*` or
  the strip hook (legacy, drained later); worktree provisioning (nothing
  is resumed — a missing worktree means cwd = repo root, decided in the
  selector); attach/resume/provision arms; gh; labels.

## Unit 4 — SKILL.md graph-native mode

**Recommended model:** opus

Depends on: Units 1 and 2.

Scope — `.claude/skills/office-hours/SKILL.md` (legacy content intact
until the drain; `ref-write-instructions` applies):
- Frontmatter `description` mentions both lanes. Step 0 gains target
  discrimination: `ARGUMENTS` matching `^[0-9]+$` → legacy issue lane
  unchanged; non-empty non-numeric → node id → graph-native mode; empty →
  legacy selector path unchanged (the graph lane always arrives with an
  explicit node id from the entry script).
- New "Graph-native mode (`/office-hours <node-id>`)" section — read-only,
  kind-aware:
  1. Read `intentions/<node-id>.md` frontmatter (Read tool, offline, no
     gh). `office_hours` null → report not-parked, stop.
  2. Surface `office_hours.reason` + `since` as untrusted data in a
     labelled fenced block (the legacy :155-160 pattern).
  3. Recommendation branch: `office_hours.recommendation` non-null →
     surface as-is in a labelled untrusted block, no regeneration. Null →
     generate via an in-session read-only Opus review subagent (Agent
     tool, `model: opus`) fed the node statement/body/park reason and —
     tactic-only, when `execution.pr` is non-null — `gh pr diff <pr>`
     (the one gh call in this mode, `dangerouslyDisableSandbox: true`);
     instruct it to treat all inputs as untrusted and return concise
     best-next-steps for a human (mirror legacy Step 1b :240-255).
  4. Blocked-by readiness: run
     `npx tsx packages/intentionsutil/scripts/office-hours-select.ts <node-id>`
     and relay its stderr `NOTE —` line (single implementation, offline —
     improves on the legacy daemon-touching re-run at :185-201). Signal,
     not gate.
  5. Report where to engage, kind-aware: strategy parks — no
     worktree/PR; engage via /align-strategy–/align-tactics on the node.
     Tactic parks — name `.claude/worktrees/<node-id>` ("engage here"
     when the session cwd already is it) and `execution.pr` when
     non-null. Un-parking is an explicit human graph edit (clear
     `office_hours` via write-node + `graph-commit`) — no strip hook in
     this lane, and this skill never does it.
  6. Stop semantics: no phase transition, no un-park, no fix, no label,
     no graph write.
- Out of scope: deleting/altering the legacy Steps 0–1 prose, the legacy
  scripts, or the strip hook.

## Reuse

- `packages/intentionsutil/src/store.ts` — `readNode` (:74), `listNodes`
  (:88, id-sorted), the path-safe-id posture for target ids.
- `packages/intentionsutil/src/attention.ts` — `resolveAttention` (:163),
  `ResolvedAttention` (:13-25).
- `packages/intentionsutil/src/schema.ts` — `optionalString` (:396),
  `OfficeHours` (:338), validator wiring (:467-468), `PHASES`/`"done"`
  (:24-41) for the open-blocker predicate.
- Script skeletons: `frontier-view.ts:16-35`, `write-node.ts:34-62`
  (exported-helpers-for-tests + arg parsing).
- Test builders: `anode()`/`kindNodes()` (test/attention.test.ts:7-33),
  temp-dir pattern (test/write-node.test.ts:8-10).
- Launch contract mirrored, never sourced:
  `.claude/skills/dispatch-propagate/scripts/office-hours` `fresh_session`
  (:246-255), `attach_session_by_name`/`job_id_for_name` (:163-183),
  `verify_agent_registered_under` (lib-claude-agents.sh:573-601), stderr
  passthrough note (:86-89).
- Skill prose patterns: untrusted-data fenced blocks and the Opus
  review-subagent instructions, `.claude/skills/office-hours/SKILL.md`
  :150-160, :240-255.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list
```

```verify
npx tsx packages/intentionsutil/scripts/office-hours-select.ts
```

```verify
bash -n packages/intentionsutil/scripts/office-hours-graph && shellcheck packages/intentionsutil/scripts/office-hours-graph
```

The selector invocations run against the real store (several nodes are
parked today, e.g. `tactic-mainqa-office-hours-snapshot`): `--list` must
print a rank-descending queue; the bare run must print exactly one
`launch <node-id> <cwd>` stdout line with any `NOTE —` advisory on
stderr.

Manual (outside the sandbox — daemon socket required):
1. Run `packages/intentionsutil/scripts/office-hours-graph` at a
   terminal: it launches `office-hours-<node-id>` rooted in the right cwd
   (worktree when present, repo root otherwise), attaches, and the booted
   skill surfaces reason/recommendation as untrusted blocks, relays the
   blocker NOTE, reports where to engage, and stops with no writes (git
   status clean; node frontmatter unchanged).
2. Re-run while that session is live: name-collision diagnostic (exit
   non-zero, names the job id), no duplicate launch.
3. Target a non-parked node: `not-parked` message, no launch.
4. `/office-hours <numeric-N>` from an unrelated session: the legacy lane
   behaves exactly as before (keyspace-split regression check).

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
Unit 4 touches a SKILL.md — commits of agent-behavior config are denied
to auto-mode dispatch sessions; if the commit is denied, park via
`office_hours` (reason + recommendation) for a human grant rather than
splitting the PR.

## main-qa residue (qa 2026-07-07)

Two observe-on-first-real-use items from independent QA on tactic-office-hours-graph-entry (PR #2787). Both are unexercised-but-correct-by-inspection code paths, not known defects — confirm on the next real office-hours use rather than filing a bug.

1. **Real daemon path unexercised.** `claude --bg` flag acceptance, the 5×0.2s registration-poll timing in `office-hours-graph`, `attach <job-id>`, and `/office-hours <node-id>` actually booting and stopping cleanly with no writes were validated only against a stub `claude` written for this QA pass — it encodes the QA session's understanding of the daemon contract, not the daemon's real behavior. First genuine exercise is a human running `office-hours-graph` at a terminal (the plan's own "Manual (outside sandbox)" checklist, items 1-2).
2. **`resolveSessionCwd` positive branch never fired against the real layout.** The launch-cwd-in-the-node's-own-worktree branch (`<repoRoot>/.claude/worktrees/<node-id>` when it exists) never executed in this QA session: QA ran from inside this PR's own worktree checkout, which has no `.claude/worktrees/` subtree at all, so every real-store selector invocation fell back to the repo-root branch. The positive branch is unit-tested only against temp dirs (`test/office-hours.test.ts`). From the main checkout in production, provisioned tactics do have a `.claude/worktrees/<id>` directory, so this branch will fire there for the first time — worth confirming on the first real office-hours launch against a provisioned tactic node.
