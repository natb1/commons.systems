---
id: tactic-fork-derivative-instrument
kind: tactic
statement: "instrument: fork & derivative digest — fetch-forks.sh assembles
  fork, derivative-search, and traffic evidence for the owner's office-hours
  built-to-be-left reading"
owner: ai
status: codified
parent: null
rationale: "strategy-owned-orchestration's reading is null, so round 1 must buy
  its own instrument (strategy-graph-native-dispatch clarification 3: an
  unmeasurable strategy first buys its instrument). The recorded sensor is fork
  and derivative review at office-hours — human judgment over external activity
  — so per the external-sensor doctrine (read-sensors.ts header; the
  local-first/no-mining principle) the instrument is a flagged opt-in fetch
  script in .claude/skills/align-init/scripts/, never a default-registry sensor
  and never an automatic reading write. It mechanically assembles what the
  observable names — forks, derivative projects, independent-adaptation evidence
  — and the owner judges the pursued-tier threshold at the sitting
  (tactic-fork-derivative-first-reading). Minted 2026-07-11 /align-tactics
  round."
reading: null
gap: null
serves:
  - strategy-owned-orchestration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-fork-derivative-instrument
  pr: 2855
  attempts: {}
  markers: []
  strategy_fingerprint: cdd3e771c3dc1c1953b1e8b52163c954a63bc94ce64994ad03fdd24f7a234575
validates:
  - strategy-owned-orchestration
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# instrument: fork & derivative digest — fetch-forks.sh assembles fork, derivative-search, and traffic evidence for the owner's office-hours built-to-be-left reading

## Context

`strategy-owned-orchestration`'s success signal: observable "forks, derivative
projects, practitioners adapting the workflow independently — never revenue,
never assertion"; sensor "fork and derivative review at office-hours";
threshold "the built-to-be-left claim is asserted only while such signals
exist at the pursued tier"; `is_proxy: false`. The strategy's `reading` is
null, so round 1 must buy its own instrument.

The sensor is human review over **external** activity (other people's forks
and repositories), so two doctrine points fix the shape
(`packages/intentionsutil/scripts/read-sensors.ts:14-28`):

- it must NOT be registered in `buildDefaultRegistry` (local-first
  own-execution sensors only);
- external sensors live as flagged, opt-in fetch scripts in
  `.claude/skills/align-init/scripts/fetch-*.sh` — `fetch-analytics.sh` and
  `fetch-psi.sh` are the two existing instances, invoked under the
  external/opt-in banner in
  `.claude/skills/align-init/scripts/gather-context.sh:82-98` with `|| true`
  guards.

The digest mechanically assembles the evidence; the owner judges the
threshold at the office-hours sitting (`tactic-fork-derivative-first-reading`,
blocked on this tactic, records the reading). The repo is public with 2 forks
and 1 star as of 2026-07-11, so live data exists to render.

## Unit 1 — fetch-forks.sh digest script

Recommended model: sonnet

Scope:

- New `.claude/skills/align-init/scripts/fetch-forks.sh`, executable,
  mirroring `fetch-psi.sh`'s conventions: a single formatted text block to
  stdout, a header comment documenting config env vars and error posture.
- Repo slug from `FORK_DIGEST_REPO` env, default `natb1/commons.systems`
  (fork-friendly, like the `ALIGN_*` envs in the sibling scripts).
- Sections, all via `gh api` (REST). JSON handling per
  `.claude/rules/shell-json.md`: `gh --jq` or `jq <<<"$VAR"` — never
  `echo "$VAR" | jq` (the CI prose linter rejects it on net-new lines).
  1. **REPO** — `gh api /repos/<slug>`: `forks_count`, `stargazers_count`,
     `subscribers_count`.
  2. **FORKS** — `gh api /repos/<slug>/forks --paginate`: per fork
     `full_name`, `created_at`, `pushed_at`, and an adaptation
     discriminator: `gh api /repos/<slug>/compare/<default_branch>...<fork_owner>:<default_branch>`
     for `ahead_by`/`behind_by` (commits the fork carries beyond upstream —
     the mechanical hint that a fork is adapted, not idle). Tolerate a 404 on
     the compare (renamed default branch, detached history) with a per-fork
     "compare unavailable" note; the fork still lists.
  3. **DERIVATIVES** — `gh api '/search/repositories?q=commons.systems'`
     excluding `<slug>` itself and the section-2 fork set, plus a code search
     for the distinctive package name outside this repo:
     `gh api '/search/code?q=intentionsutil+-repo:<slug>'`. Print
     `total_count` and the top ~10 hits each (repo full_name + description /
     file path). These are candidate derivatives for the human to judge —
     print them plainly, no scoring.
  4. **TRAFFIC** — `gh api /repos/<slug>/traffic/clones` and
     `/repos/<slug>/traffic/views` (14-day windows): push-access-only
     endpoints, so on HTTP 403 print a parenthetical "(traffic requires push
     access — skipped)" and continue. Every other failure is fatal.
- Error posture: `gh` missing/unauthenticated, or any non-optional API call
  failing → descriptive error to stderr and non-zero exit
  (`.claude/rules/code-style.md`: clear errors over defensive fallbacks; this
  is an operator-run script). This deliberately differs from
  `fetch-analytics.sh`'s exit-0 no-config path: gh auth is this repo's
  baseline tooling, not an optional credential set.
- Wire the script into `gather-context.sh` beside `fetch-psi.sh` (same
  external/opt-in banner comment, same `|| true` guard) so `/align` context
  packs carry the digest too.

Out of scope:

- Registering anything in `buildDefaultRegistry`
  (`packages/intentionsutil/scripts/read-sensors.ts:545`) — the recorded
  sensor is the owner's review; no automatic `reading` write for this
  strategy.
- Writing `reading`/`gap` on the strategy — that is the sitting's job
  (`tactic-fork-derivative-first-reading`).
- Any GA4/PSI changes; any webhook, cron, or polling automation.

## Reuse

- Formatted-block, env-config, and header conventions:
  `.claude/skills/align-init/scripts/fetch-psi.sh`,
  `.claude/skills/align-init/scripts/fetch-analytics.sh`.
- External/opt-in invocation banner:
  `.claude/skills/align-init/scripts/gather-context.sh:82-98`.
- JSON-in-shell rules: `.claude/rules/shell-json.md`.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: with `gh auth status` green, run
`.claude/skills/align-init/scripts/fetch-forks.sh` — the digest lists the
live fork set (2 forks as of 2026-07-11) with created/pushed dates and
ahead-by counts, a derivative-search section with total counts, and either
traffic numbers or the 403 skip note. Then run the external block of
`gather-context.sh` and confirm the digest block appears in its output.

## Implementation notes

Single unit; implement in a subagent launched with `model: sonnet`; supply
this Context and the Unit 1 Scope in the subagent prompt; constrain it to
working-tree edits only.
