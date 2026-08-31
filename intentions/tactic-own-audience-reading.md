---
id: tactic-own-audience-reading
kind: tactic
statement: "Instrument: audit script that produces the strategy-own-audience
  signal reading across the owned publication surfaces"
owner: ai
status: codified
parent: null
rationale: Authored 2026-07-06 by /align-tactics round 1. The strategy's reading
  is null and its sensor is an owner review at office-hours — this instrument
  makes that sensor runnable by assembling the per-surface threshold evidence
  (feed, webmention endpoint, syndication markup) into one report the owner
  reviews and stamps as the reading. It is the round's validates-terminal for
  reading production.
reading: null
gap: null
serves:
  - strategy-own-audience
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-own-audience
blocked_by:
  - tactic-indieweb-audience
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument: audit script that produces the strategy-own-audience signal reading across the owned publication surfaces

## Context

`strategy-own-audience` has `reading: null` and its sensor is "owner review
at office-hours" against the threshold "feeds, syndication-with-canonical-
links, and a platform-free response path exist on every owned publication
surface". A strategy that cannot be measured must first buy its own
instrument: this tactic makes that owner review runnable by producing the
per-surface evidence report the owner reviews. Without it the round cannot
produce a fresh reading.

The instrument is a small script that probes each owned publication surface
over HTTP and prints a markdown coverage table. The owner runs it (or reads
its output from the merged PR / a QA run), reviews at office-hours, and
stamps the strategy's `reading`/`gap` and round completion — the
completion-time writes stay manual in the bootstrap.

Blocked by `tactic-indieweb-audience` and `tactic-indieweb-syndication-markup`
so the reading it produces reflects the round's work rather than the known
pre-round gap.

This is exactly one PR.

## Unit 1 — audit script

**Recommended model:** sonnet

Scope:

- New `ops/scripts/audit-own-audience.ts` (run via
  `npx tsx ops/scripts/audit-own-audience.ts [--surface <url>]`), auditing
  the two owned publication surfaces (hard-coded default, one comment):
  `https://commons.systems` and `https://fellspiral.commons.systems`. Per
  surface, over plain `fetch` with a 10s timeout:
  - **Feeds leg** — the home page head contains
    `link[rel="alternate"][type="application/rss+xml"]`; its `/feed.xml`
    returns 200 with an `rss+xml` content type and an `<rss` document.
  - **Response-path leg** — the head contains `link[rel="webmention"]`; an
    empty-body `POST` to the advertised endpoint returns 400 (endpoint alive
    and validating; 404/5xx = fail).
  - **Syndication leg** — the home page markup contains `h-entry` articles,
    and at least one carries a `u-syndication` link (evidence that a post is
    syndicated with a canonical link back).
  - Output: a markdown table (surface x leg, pass/fail with a one-line
    detail) followed by a one-line summary verdict — the text the owner can
    paste into the strategy's `reading`. Exit 0 whenever every probe
    *executed* (a failed leg is a valid measurement, not a script error);
    exit non-zero with a descriptive error only when a surface is unreachable
    or a probe cannot run (clear errors over fallbacks,
    `.claude/rules/code-style.md`).
  - Parse with plain string/regex checks or a lightweight existing dep — do
    not add a new HTML-parser dependency for four substring probes.
- Tests: `ops/` is not a vitest workspace project, so do not invent new test
  infrastructure for one script — keep the check functions pure and exported
  within the script, and verification rides the smoke run below plus a live
  run. If a natural vitest home for `ops/` scripts already exists at
  implementation time, add mocked-`fetch` cases for each leg there instead.

Out of scope: writing the strategy's `reading` field (owner review does
that); scheduling/automation of the audit; any change to the surfaces
themselves.

## Reuse

- `fetch` + `AbortSignal.timeout` pattern: `functions/src/feed-proxy.ts:52-57`.
- Existing tsx script conventions: `packages/intentionsutil/scripts/*.ts`
  (arg handling, repo-root resolution from `import.meta.url`).

## Verification

```verify
node --import tsx/esm ops/scripts/audit-own-audience.ts --help
```

Prose: also run the repo typecheck entry point over the script if `ops/`
scripts are covered by one
(`.claude/skills/dispatch-propagate/scripts/run-typecheck.sh`); if not, the
tsx smoke run above plus review suffices. End-to-end:
run `npx tsx ops/scripts/audit-own-audience.ts` against production after the
blocking tactics deploy; confirm the table reports the feeds leg pass on both
surfaces, and that the webmention and syndication legs report the true
current state. The owner reviews the output at office-hours and stamps the
strategy `reading`, `gap`, and `rounds` completion.
