---
name: intention-emit
description: Emit a tactic node into a chain-compatible GitHub issue via /file-issue, then stamp a discoverable node-id↔issue mapping and record an execution tracker — reads intention node files, never rewrites them.
---

# Intention Emit

The tree→GitHub **emit** path: a tactic node becomes a chain-compatible GitHub
issue (via the existing `/file-issue` skill), gets a discoverable
node-id↔issue stamp, and gets an execution-tracker record. Emission is not
restricted to a leaf — an epic-rooted tactic (a tactic subtree whose root
mirrors a GitHub issue hierarchy) emits the same way as any other tactic.

This is the EMIT half of the tree↔GitHub sync. Its mirror image is the
read-only `refresh.ts` (Unit 4), which reads GitHub execution state back into
`trackers/<node-id>.json`. The graph is the authoritative source of truth for
all data; GitHub is an optional, derived projection that this skill emits
into. During the transition, execution state still syncs from GitHub — the
gh-derived fields via backfill, and issue open/closed, linked PRs, and
dispatch labels via `refresh.ts` and `trackers/`; emit itself READS intention
node files (via `readNode`) and never rewrites them.

## Architectural note: only one step is an agent step

`/file-issue` is a **SKILL, not a script** — there is no scriptable entrypoint
for GitHub issue creation, because issue creation runs the full quality pipeline
(duplicate detection, 8-category evaluation, decomposition gate, type/topic
classification) that only the Skill can perform. So:

- **Step 2 (create the issue) is an irreducible agent/Skill step.** It must be
  driven by a forked subagent that invokes `/file-issue` via the Skill tool.
- **Steps 1, 3, 4, and 5 are pure scripts** — node read + mapping resolution,
  sentinel parse, relationship wiring (`gh api`), and stamp + tracker record
  (existing Unit 3 / Unit 4 scripts).

Keep that boundary crisp: do not try to "scriptify" step 2, and do not push
scriptable work (steps 1/3/4/5) into the subagent.

## Inputs

- `<id>` — the intention node id to emit (a file `intentions/<id>.md` must
  exist, except on the `tactic-<N>` link path where no node file is required).
- `--blocked-by <B>` — OPTIONAL. An explicit GitHub issue number this emitted
  issue is blocked by. This is **not** a node field — `blocked_by` does not
  exist in the intention-node schema — it is a caller-supplied argument, applied
  best-effort in step 4. When absent, step 4 wires no dependency.

Paths used below:

- `intentionsDir` = `intentions/` (the node store)
- `trackersDir` = `trackers/` (the execution-tracker store)

## Sandbox

Every step below that calls `gh`, `npx`, or otherwise touches the network must
run with `dangerouslyDisableSandbox: true`. `gh` fails TLS verification under the
sandbox, and `npx tsx` may need to fetch packages; both require the live network.
See `.claude/rules/sandbox.md`. Every `npx tsx` invocation below (step 1's node
read, step 5's refresh.ts) needs `dangerouslyDisableSandbox: true`
even when it does no network work, because the sandbox blocks tsx's IPC pipe.
Only the step 3 sentinel parse — pure shell — does not.

---

## Step 1. Resolve emit-or-link (scriptable)

Read the node and decide whether the issue already exists.

```bash
# dangerouslyDisableSandbox: true — tsx's IPC pipe is blocked by the sandbox.
# Resolve N = the mapped issue number, or null.
npx tsx -e '
  import { readNode } from "./intentionsutil/src/store.js";
  import { nodeIdToIssue } from "./intentionsutil/src/tracker.js";
  const id = process.argv[1];
  const n = nodeIdToIssue(id, "trackers");
  // readNode is the source of truth for emit-path content (statement/rationale/...)
  if (n === null) { const node = readNode("intentions", id); /* emit path */ }
' "<id>"
```

Decision rule:

- If `<id>` matches `^tactic-(\d+)$` **OR** `nodeIdToIssue(<id>, trackersDir)`
  returns a number (a tracker already maps it) → **link path**: the issue
  already exists. Set `N` = that number and jump to **step 4** (skip creation).
  Note these two conditions are the SAME result by construction:
  `nodeIdToIssue` (`intentionsutil/src/tracker.ts`) applies the `^tactic-(\d+)$`
  regex itself before checking the tracker file, so a non-null return already
  covers the `tactic-<N>` case — one check, not two.
- Otherwise → **emit path**: continue to steps 2–3 to create the issue. Read
  the node with `readNode(intentionsDir, <id>)` to obtain `statement`,
  `rationale`, `reading`, and `parent` for the steps below.

---

## Step 2. Emit via `/file-issue` (AGENT / SKILL step — NOT scriptable)

Fork a subagent (Agent tool, `subagent_type: general-purpose`, `model: sonnet`)
whose prompt invokes `/file-issue` via the Skill tool. This mirrors the
established pattern for forking a `/file-issue` subagent and parsing its sentinel
block; model the prose on:

- `.claude/skills/review-fix/SKILL.md` (~lines 437–474)
- `.claude/skills/fix-checks/SKILL.md` (~lines 188–226)

### Skill input shape

The `/file-issue` skill input MUST begin with the literal token `--follow-up`
FIRST, then `<title>`, then a newline, then `<body>`:

```
--follow-up <title>
<body>
```

- `--follow-up` FIRST classifies this non-bug node as `enhancement`.
  `/file-issue` strips the leading token before mode detection (it would
  otherwise corrupt detection — see `.claude/skills/file-issue/SKILL.md` Step 1,
  ~lines 45–58). The token must be the very first characters of the input.
- `<title>` derives from `node.statement` (a concise restatement of the goal).
- `<body>` is built from `node.rationale` and `node.reading`, and MUST frame the
  node's content under a markdown heading that is **exactly** the literal line
  `## Scope` (nothing trailing — no colon, no extra text). A later
  backfill re-extracts this section with `extractScope`
  (`intentionsutil/scripts/backfill.ts` ~lines 148–162), which matches
  `/^## Scope\s*$/`; any drift (`## Scope:`, `## scope`) silently breaks
  re-extraction. Example body:

  ```markdown
  ## Scope

  <node.rationale>

  <node.reading, if present>
  ```

### Chain compatibility is automatic

Do NOT separately apply chain labels here. `/file-issue`'s own Step 6
(~lines 377–388) applies `help wanted` + `@me` + at-most-one type label +
at-most-one topic label **by construction** on every created issue. With
`--follow-up` setting the type to `enhancement`, the resulting issue is already
chain-compatible (dispatchable). Adding labels here would duplicate that work.

The subagent runs `/file-issue` (which uses `gh` — `dangerouslyDisableSandbox:
true`) and returns its full final message, including the sentinel block, to this
thread.

---

## Step 3. Parse the sentinel block (scriptable — done by the orchestrator)

`/file-issue` ends its message with a sentinel-delimited results block (see
`.claude/skills/file-issue/SKILL.md` Step 7, ~lines 505–527):

```
===FILE-ISSUE-RESULTS===
CREATED <N>
EXISTING <N>
===FILE-ISSUE-RESULTS-END===
```

Read **every** `<disposition> <N>` line between `===FILE-ISSUE-RESULTS===` and
`===FILE-ISSUE-RESULTS-END===`. Each line is `CREATED <N>` (new issue) or
`EXISTING <N>` (a duplicate was matched, creation skipped). Do NOT assume exactly
one record — a spec can decompose or match a duplicate. Take the **PRIMARY**
record's `<N>` (the top-level issue for this node — normally the first record).
Set `N` = that number. Ignore any prose outside the sentinels; the block is
narration-proof so a stray number in a summary sentence never mis-parses.

---

## Step 4. Relationships (scriptable, best-effort)

Wire GitHub relationships with the dependencies / sub-issues REST API. Resolve
the integer **database** id with `gh api` (NOT `gh issue view --json id`, which
returns the GraphQL node id). See `.claude/skills/ref-github-issues/SKILL.md`
(sub-issues ~lines 37–49, dependencies ~lines 63–68). All `gh` calls run with
`dangerouslyDisableSandbox: true`.

### Sub-issue link from `parent`

If the node's `parent` is of the form `tactic-<P>` (the backfill stores parents in
`tactic-<N>` form), link `N` as a SUB-ISSUE of `P`:

```bash
# dangerouslyDisableSandbox: true
SUB_DB_ID=$(gh api "/repos/{owner}/{repo}/issues/<N>" --jq '.id')
gh api -X POST "/repos/{owner}/{repo}/issues/<P>/sub_issues" \
  --input - <<< "{\"sub_issue_id\": $SUB_DB_ID}"
```

If `parent` is null or not `tactic-<P>` form, wire no sub-issue link.

### `blocked_by` from the optional `--blocked-by <B>` arg

Only when the caller passed `--blocked-by <B>` (there is no node field for this).
Resolve `B`'s database id, list existing `blocked_by` to skip duplicates, then
POST:

```bash
# dangerouslyDisableSandbox: true
# Skip if <B> is already a blocker (a duplicate POST errors).
EXISTING=$(gh api "/repos/{owner}/{repo}/issues/<N>/dependencies/blocked_by" --jq '.[].number')
if ! grep -qx "<B>" <<< "$EXISTING"; then
  BLOCKER_DB_ID=$(gh api "/repos/{owner}/{repo}/issues/<B>" --jq '.id')
  gh api -X POST "/repos/{owner}/{repo}/issues/<N>/dependencies/blocked_by" \
    --input - <<< "{\"issue_id\": $BLOCKER_DB_ID}"
fi
```

These are best-effort: a failed relationship wire does not undo the created
issue, but it should surface as a clear error (see `.claude/rules/code-style.md`)
rather than be silently swallowed.

---

## Step 5. Stamp + record the mapping (scriptable)

Make the node-id↔issue mapping discoverable on the issue, and record execution
state in the tracker store. This closes the loop for a freshly-created `N` on a
non-`tactic-N` node — the number must be persisted so a later
`nodeIdToIssue(<id>, trackersDir)` resolves it.

```bash
# dangerouslyDisableSandbox: true (both touch GitHub)
# 1. Discoverable mapping comment on the issue (Unit 3 script; <N> first).
.claude/skills/dispatch-propagate/scripts/intention-stamp-node <N> <id>

# 2. Create/refresh trackers/<id>.json with issue_number = N and current
#    execution state (Unit 4 read-only refresh script).
npx tsx intentionsutil/scripts/refresh.ts <id>
```

After this, `trackers/<id>.json` exists with `issue_number = N`, and the issue
carries the `<!-- intention:node-id -->` mapping comment.

On the **link path** (step 1 took the shortcut), `N` already maps to `<id>`;
re-running the stamp is idempotent (upsert) and the refresh re-syncs state, so
running step 5 there is safe and keeps the tracker current.

---

## Step / script boundary (summary)

| Step | Kind | What runs it |
|---|---|---|
| 1. Resolve emit-or-link | **script** | `readNode` + `nodeIdToIssue` (local) |
| 2. Create the issue | **agent / Skill** | forked subagent → `/file-issue` |
| 3. Parse sentinel block | **script** (orchestrator) | string parse of the subagent message |
| 4. Relationships | **script** | `gh api` (network) |
| 5. Stamp + tracker | **script** | `intention-stamp-node` + `refresh.ts` (network) |

Only step 2 is an agent/Skill step. Everything else is pure script.

## Out of scope

- **No write to intention node files.** Emit READS them (`readNode`); it never
  calls `writeNode` or otherwise rewrites `intentions/<id>.md`. The graph
  remains the source of truth for that content; GitHub is only the derived
  projection emit writes into.
- **No change to `/file-issue`.** This procedure consumes `/file-issue` as-is,
  including its labeling and sentinel contract.
- **No dispatch-chain change.** The created issue is chain-compatible by virtue
  of `/file-issue`'s labels; emit does not modify the chain itself.
