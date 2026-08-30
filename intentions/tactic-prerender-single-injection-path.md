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
  fix:
    since: 2026-08-03
    attempt: 1
    pushed_sha: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/fix-checks: PR #3016 (tactic-prerender-single-injection-path) fails
    test-integrity (Signal 2: 12 net test declarations removed in
    packages/blog/test/prerender.test.ts and prerender-static.test.ts) for
    legitimate dead-code cleanup — the deleted legacy injector functions
    (injectMain/injectInfoPanel/injectNav/injectFooter/injectHomeExtra/stripHom\
    eExtra) were never directly imported by those test files, so the check's
    import-based co-deletion exemption can't detect they're gone. Same residual
    class as tactic-test-integrity-waiver (still status:raw, no check-side
    lookup implemented). Needs an author decision: approve via override-merge
    once review is clean, or direct the tests be restored (reverting Unit 2).
    type-safety-sensor also fails on prerender.ts:65 (doc-comment false
    positive, \"as SoftwareApplication\" inside a /** */ block) — trivial, left
    for a later fix-checks pass since the PR is blocked on the test-integrity
    call regardless."
  since: 2026-08-03
  recommendation: >-
    # Office-hours recommendation: `tactic-prerender-single-injection-path` (PR
    #3016)


    ## The decision you need to make


    PR #3016 deletes 12 net test declarations across
    `packages/blog/test/prerender.test.ts` and
    `packages/blog/test/prerender-static.test.ts`. Those tests exercised the
    legacy regex/string injectors (`injectMain`, `injectInfoPanel`, `injectNav`,
    `injectFooter`, `injectHomeExtra`, `stripHomeExtra`) that Unit 2 removes
    from `packages/blog/src/prerender.ts` as part of migrating `fellspiral` onto
    the PageShell single-root path. The `test-integrity` check fires on the
    deletion and cannot be talked out of it mechanically.


    Two options, and only these two:


    1. **Approve the deletions as legitimate dead-code cleanup.** The tests
    cover behavior that no longer exists. There is no live mechanical waiver
    path today, so the supported resolution is an author override-merge once the
    rest of review is clean.

    2. **Direct that the tests be restored.** This means reverting Unit 2's
    dead-code removal — the legacy injectors stay in
    `packages/blog/src/prerender.ts` so their tests have something to test. That
    undoes the point of the tactic.


    ## Why the check can't decide this itself


    `check-test-integrity.sh` has a co-deletion exemption for exactly this case,
    but it only fires when every symbol a test file *directly imported* is gone.
    The deleted injectors were internal helpers reached through config fields
    (`homeExtraHtml`, `footerHtml`, `panelHtml`, `stripHero`), never imported by
    name — so the test files' `import { ... } from "../src/prerender"` line is
    textually identical before and after, the removed-import set is empty, and
    the exemption is structurally unreachable. Not a bug in the diff; a gap in
    the exemption's shape.


    This class is already named in the graph:
    `intentions/tactic-test-integrity-waiver.md` (first case: PR #2835 on
    `tactic-analytics-vitals-delivery`). It sketches an `execution.waivers`
    field the check would look up, but it's still `status: raw` — the check-side
    lookup isn't wired up. So even if you approve, there's nothing to record the
    approval *into* that the script would honor. Worth noting: this is the
    second instance of the class, which is a decent argument for promoting that
    tactic out of `raw`.


    ## What to look at


    - `packages/blog/src/prerender.ts` — confirm the deleted injectors have no
    remaining callers and the PageShell path covers what they did.

    - `packages/blog/test/prerender.test.ts`,
    `packages/blog/test/prerender-static.test.ts` — spot-check that the removed
    cases are all legacy-injector behavior, and that nothing testing surviving
    behavior went out with them. That's the real question behind the approval.


    ## Secondary, no action needed


    `type-safety-sensor` also fails, flagging
    `packages/blog/src/prerender.ts:65` for a net-new `as <Type>` cast. It's a
    false positive: line 65 is a `/** */` doc comment containing the phrase "as
    SoftwareApplication", and the sensor's regex only strips trailing `//`
    comments, not block comments. A later automated fix-checks pass will reword
    the comment or add a `// type-safety-ok:` marker. It was left alone because
    the PR is stuck on the test-integrity call regardless.
  session_type: other
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
npx vitest run --project blog --root . || exit 1
npx vitest run --project fellspiral --root .
```

Existing prerender/hydration tests must stay green; add a fellspiral prerender
test asserting the rendered root is the single PageShell mount (no legacy
per-region markers remain in the output).

Manual (preview deploy): load a fellspiral blog post and the blog index,
confirm no hydration mismatch warning in the console (byte-match contract) and
that nav, hero, info panel, and footer all render correctly from the
prerendered HTML before JS runs (disable JS to check the prerendered shell).
