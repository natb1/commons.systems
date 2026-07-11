---
id: tactic-recovery-drill-github
kind: tactic
statement: "Walk the GitHub recovery path: one export/import round-trip of the
  issue graph"
owner: ai
status: codified
parent: null
rationale: "The drill strategy-exercise-recovery-paths names for
  delegation-github: export the issue/PR relationship data the dispatch chain
  depends on, import it into a substitute, record what survived, and flip
  last_exercised."
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-recovery-drill-github
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 4ee635b8acf77f2cb701ca3625baa5edf2209e23bf04d30e72650eb7b94f36fa
validates:
  - strategy-exercise-recovery-paths
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Walk the GitHub recovery path: one export/import round-trip of the issue graph

## Context

`delegation-github` (recovery_path: re-host — git portable by design;
issues/PR relationships export via API) has `last_exercised: null`: the
export/import path has never been walked, so it is a hope, not a path.
The drill `strategy-exercise-recovery-paths` names for it: export the
issue/PR data the workflow depends on, import it into a substitute forge,
record what survived and what did not, and flip the record's
`last_exercised`. Scope note: the intention graph (`intentions/`) is now
the source-of-truth issue tracker, so the load-bearing GitHub-only data
has shrunk to PRs, CI, and the historical issue corpus — the drill should
measure exactly what of that survives a migration. Per the strategy's
2026-07-11 clarification, the drill stops short of production cutover:
the substitute forge is stood up, loaded, and inspected, not adopted.

## Unit 1 — export: archive the issue/PR graph via the API

**Recommended model:** opus

Implement in a subagent (`model: opus`), working-tree edits only, passing
this unit's context and scope in the prompt.

Scope:

- A script `ops/recovery-drills/github-export.sh` (new directory; `ops/`
  already holds `monitoring/` and `scripts/`) that exports, via `gh api`
  (REST by default per the repo's rate-limit conventions), for
  `natb1/commons.systems`: issues (all states, bodies, labels,
  milestones), issue comments, PRs (all states, bodies, review threads
  optional), sub-issue relationships and issue dependencies
  (blocked_by/blocking — the endpoints the `ref-github-issues` skill
  documents), releases, and the repo metadata the Actions wiring depends
  on (workflow file list only; secrets are explicitly not exportable —
  record that as a known gap, not a surprise).
- Output: a timestamped local archive directory of raw JSON pages (NOT
  committed — the archive is point-in-time; add it to `.gitignore` under
  e.g. `ops/recovery-drills/archives/`), plus a committed summary manifest
  (counts per entity type) the drill report cites.
- Paginate correctly (`--paginate`), fail loud on any non-200 (no
  fallbacks, `.claude/rules/code-style.md`), and follow
  `.claude/rules/shell-json.md` (no `echo "$VAR" | jq`; the repo lint
  enforces it on committed `.sh` files).
- Out of scope: git data itself (full clones already exist locally —
  `delegation-github`'s non_delegable_floor — and `git clone --mirror` is
  the trivial leg; note it in the report, do not re-implement it).

## Unit 2 — import: load the archive into a substitute forge and diff

**Recommended model:** opus

Dependencies: Unit 1.

Implement in a subagent (`model: opus`), working-tree edits only.

Scope:

- Stand up a local Gitea (`nix run nixpkgs#gitea` or `nix shell
  nixpkgs#gitea` — no Docker required; a throwaway data dir under the
  archive directory). Servers listen on the host network: run the server
  and its health checks with sandbox disabled per
  `.claude/rules/sandbox.md`.
- Use Gitea's built-in GitHub migration (repo + issues + PRs + labels +
  milestones + releases, authenticated with the drill token) as the
  import leg. This is deliberate: the drill measures what a real
  substitute's own tooling preserves, not what a bespoke importer could
  theoretically preserve.
- Diff the imported result against the Unit 1 manifest: per entity type,
  imported count vs exported count, and an explicit survived/lost list
  for the relationship data (sub-issue links, issue dependencies, issue
  types) — expected to be lost, since Gitea's migrator predates those
  GitHub APIs. Actions workflows import as files but do not run — record
  the porting cost estimate rather than porting them.
- Deliverable: `ops/recovery-drills/github-drill-report.md` — date, time
  spent, survived/lost table, the measured recovery friction, and the
  residual dependence assessment (what the dispatch chain would actually
  lose today, given the graph is the issue tracker of record).

## Unit 3 — flip the record

**Recommended model:** sonnet

Dependencies: Unit 2.

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope: update `intentions/delegation-github.md` via
`packages/intentionsutil/scripts/write-node.ts` (full node JSON; never
hand-edit YAML): set
`attributes.irreversibility.last_exercised` to the drill date and refresh
`attributes.irreversibility.recovery_cost` with the measured cost from the
report. Land the node edit via
`packages/intentionsutil/scripts/graph-commit delegation-github`
(state-only fast path) — node edits never ride the code PR.

## Reuse

- `gh api` + `gh_retry`-style bounded retries (see
  `packages/intentionsutil/scripts/graph-commit` for the logging shape).
- `ref-github-issues` skill: the sub-issue and dependency endpoints.
- `packages/intentionsutil/scripts/write-node.ts` and `graph-commit` for
  the record flip.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: run the export against the live repo and confirm the manifest
counts are plausible (issues in the thousands, non-zero dependencies);
run the Gitea migration and spot-check five issues (bodies, labels,
comments render) and one PR; confirm the report's survived/lost table is
filled from measured counts, not assumptions; confirm
`delegation-github`'s `last_exercised` is a real date on `origin/main`
after the graph-commit.
