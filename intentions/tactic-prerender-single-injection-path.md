---
id: tactic-prerender-single-injection-path
kind: tactic
statement: Collapse the blog prerender to the PageShell single-root injection
  path, retiring the legacy regex/string injection
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review:
  packages/blog/src/prerender.ts carries two injection paths — the legacy
  regex/string injection at marked template sites (function-form String.replace,
  the class that produced tactic-blog-prerender-injection) and the opt-in ds
  PageShell single-root path landing uses. Fellspiral remains on the legacy
  path; collapsing to PageShell removes the injection-bug class. Retained as a
  draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-prerender-single-injection-path
  pr: 3016
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  security: true
---
# Collapse the blog prerender to the PageShell single-root injection path, retiring the legacy regex/string injection

## Context

`packages/blog/src/prerender.ts` carries **two** hydration-injection paths (see
its header doc, `prerender.ts:41-44` and `:81-84`):

- The **legacy** path: regex/string `String.replace` injectors at marked
  template sites — `injectMain` (`:188`), `injectInfoPanel` (`:233`),
  `injectNav` (`:242`), `injectFooter` (`:251`), `injectHomeExtra` (`:260`),
  `stripHomeExtra`. This is the class that produced the
  `tactic-blog-prerender-injection` defect (regex injection into HTML).
- The **PageShell single-root** path: `injectRoot` (`:202`) replaces one empty
  `<div id="${mount}"></div>` placeholder with the SSR-rendered `BlogPageShell`
  (`prerender.ts:9`), which already carries nav, panel, hero, and footer, so the
  legacy per-region injectors are skipped (`:81-84`).

`landing`'s blog uses the PageShell path; **fellspiral remains on the legacy
path**. Collapsing fellspiral onto PageShell and deleting the legacy injectors
removes the regex-injection bug class entirely — the owned-substrate correctness
burden the strategy accepts, discharged by shrinking to one audited path.

Off the strategy's signal path (no `validates` flag) — it hardens owned
substrate but does not touch the dependency-justification reading.

## Unit 1 — Migrate fellspiral's blog prerender onto BlogPageShell

**Scope.** Move fellspiral's prerender call from the legacy per-region injectors
to the `injectRoot`/`BlogPageShell` single-root path (the same options shape
`landing` passes — the shell renders nav/panel/hero/footer, so the
`injectMain`/`injectInfoPanel`/`injectNav`/`injectFooter`/`injectHomeExtra`
options are dropped). Ensure fellspiral's template has the single
`<div id="${mount}"></div>` mount placeholder the PageShell path expects, and
that `BlogPageShell` reproduces fellspiral's nav/hero/footer regions. Preserve
the byte-match hydration contract (the prerendered DOM must match the client's
first render — strategy clarification 5 names this the prerender byte-match
hydration contract).

Out of scope: landing (already migrated); changing `BlogPageShell`'s public
props beyond what fellspiral needs.

**Recommended model:** opus (hydration byte-match correctness across two render
paths; a mismatch is a runtime hydration bug, per the memory note on
flaky-hydration).

**Dependencies:** none.

## Unit 2 — Delete the legacy injectors and their template markers

**Scope.** Once no caller uses them (Unit 1 was the last consumer via
fellspiral), delete `injectMain`, `injectInfoPanel`, `injectNav`,
`injectFooter`, `injectHomeExtra`, and `stripHomeExtra` from
`packages/blog/src/prerender.ts`, plus the corresponding options fields
(`prerender.ts:69-124`) and any now-dead template markers. Keep `injectRoot`
and the `<head>` SEO injectors (those run on both paths regardless — `:84`,
`:124`). Confirm knip reports no newly-dead exports afterward.

Out of scope: the SEO `<head>` injectors; `injectRoot`.

**Recommended model:** opus (dead-code removal gated on proving no remaining
caller across both apps; a missed caller is a prerender break).

**Dependencies:** Unit 1 (must land first — it is the last legacy-path caller).

## Reuse

- Single-root injection: `injectRoot` (`packages/blog/src/prerender.ts:202`)
  and `BlogPageShell` (`prerender.ts:9`).
- The `landing` blog prerender call is the reference for the options shape the
  PageShell path takes.

## Verification

```verify
npx vitest run --project blog --root .
npx vitest run --project fellspiral --root .
```

Existing prerender/hydration tests must stay green; add a fellspiral prerender
test asserting the rendered root is the single PageShell mount (no legacy
per-region markers remain in the output).

Manual (preview deploy): load a fellspiral blog post and the blog index,
confirm no hydration mismatch warning in the console (byte-match contract) and
that nav, hero, info panel, and footer all render correctly from the
prerendered HTML before JS runs (disable JS to check the prerendered shell).
