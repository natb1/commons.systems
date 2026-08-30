---
id: tactic-quiet-app-heroes
kind: tactic
statement: Replace production app heroes with the landing hero (no demo cards),
  visible only when viewing public demo data — removing all fork/onboarding
  chips and inline onboarding paths
owner: ai
status: codified
parent: null
rationale: "The immediately-actionable half of the tier gate, from the
  2026-07-06 interview: it implements the quiet state, removing invitations
  rather than adding them, so it is consumable by /align-tactics now — no tier
  declaration required. Stale onboarding paths in production give
  counterproductive signals until then."
reading: null
gap: null
serves:
  - strategy-user-onboarding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Replace production app heroes with the landing hero (no demo cards), visible only when viewing public demo data — removing all fork/onboarding chips and inline onboarding paths

## Context

`strategy-user-onboarding` holds production apps quiet until tier-2 (user)
entry is declared on `strategy-progressive-validation` (not yet declared as of
2026-07-06). Today the print and budget app heroes ship live, stale onboarding
invitations that predate the current design and send counterproductive
signals: a user who follows a stale fork/onboarding chip is burned, a
`virtue-respect-for-persons` failure worse than no invitation at all.

This tactic implements the quiet state — it *removes* invitations rather than
adding them, so it is consumable now with no tier-2 declaration required
(strategy clarification, 2026-07-06). Both app heroes are replaced with the
same hero the landing page renders (the capability statement only, no project
demo cards), shown only when viewing public demo data — never over a user's
own data. The retained chip/onboarding concepts live behind the tier-2 gate in
`tactic-restore-onboarding-chips` (born-parked) and are out of scope here.

The signal is not validated by this tactic (no `validates` edge): onboarding
completions cannot be sensed while surfaces are correctly quiet. This tactic
establishes and holds the quiet precondition.

## Reuse

- `landing/src/hero-config.tsx` — `buildShowcaseHero(projects, overflow)` builds
  the ds `<Hero>` with the exact target copy: headline `"Build with
  commons.systems. Learn to run without."`, subline `"Code you understand. Data
  you control. A roadmap you set."`, ctas `[{label:"Learn More", href:"/about"},
  {label:"Source", href:"https://github.com/natb1/commons.systems"}]`. Reuse
  this copy; the quiet hero differs only by passing `cards={[]}` (no demo cards).
- `@commons-systems/ds` `Hero` (`packages/ds/src/templates/Hero.tsx`) —
  `HeroProps` accepts `headline`, `subline`, `ctas`, `cards` (pass `[]`). This
  is the single hero component both landing and the apps should render.
- Greenfield note (`.claude/rules/design-proposals.md`): the headline/subline/
  ctas copy is now duplicated across landing + two apps. The ideal shape
  extracts a shared cardless-hero builder (e.g. `buildQuietHero()` in
  `@commons-systems/components` or a small shared config) that both apps import,
  so the approved copy has one home. Acceptable brownfield alternative: define
  the same `<Hero>` props inline in each app (small, contained). Prefer the
  shared builder if it lands cleanly without touching landing's rendering.

## Unit 1 — Print: replace the chip hero with the landing-style ds Hero, gated to public demo data

**Recommended model:** sonnet

**Scope:**
- Rewrite `print/src/pages/Hero.tsx` (currently a custom chip hero: three
  easy/medium/hard chips `panel-upload`/`panel-format`/`panel-host` with two
  fork links, plus an FAQ whose first answer says "you should try creating your
  own document viewer"). Replace the entire component so it renders the ds
  `<Hero>` with the reuse copy above and `cards={[]}` — no chips, no FAQ, no
  fork links, no "built with Claude / try your own" note.
- Gate visibility to public demo data. Today `print/src/main.tsx:64`
  (`createRoot(heroContainer).render(<Hero />)`) mounts the hero
  unconditionally. Print shows public-domain items only when signed out
  (`print/src/pages/Home.tsx:12` renders the "Showing public domain items"
  notice when `!user`). Render/show the hero only when `currentUser` is null
  (public demo), and hide/remove it once a user signs in (auth state is tracked
  by `currentUser` and `onAuthStateChanged` in `print/src/main.tsx`). Do not
  show the hero over a signed-in user's own library.
- CTA targets: `"Source"` → the repo URL. `"Learn More"` → the landing About
  page (the canonical ungated service-sales surface the strategy protects) —
  use the absolute landing URL (e.g. `https://commons.systems/about`), not
  print's local `/about`, so the app hero routes users to the service-sales
  surface. (If landing's absolute About URL is not readily available, print's
  local `/about` at `print/src/main.tsx:138` is an acceptable fallback.)
- Update `print/test/pages/hero.test.tsx` to assert the new hero: the headline/
  subline/CTAs are present and the chips, FAQ, fork links, and the
  "creating your own" note are absent. Do not weaken or delete assertions to
  pass — rewrite them to the new behavior (`.claude/rules/test-integrity.md`).

**Out of scope:** the About page, the Library/Home listing, sign-in flow, the
local-folder UI.

## Unit 2 — Budget: replace the chip hero with the landing-style ds Hero

**Recommended model:** sonnet

**Dependencies:** none (independent of Unit 1; parallelizable).

**Scope:**
- Replace the budget hero content. Today `budget/src/pages/hero.ts`
  `renderHero()` returns an HTML string via `renderHeroShell`
  (`@commons-systems/components/hero-render`) with a single Easy
  `panel-analyze` chip ("Analyze your data on your own machine") whose steps
  include an inline `fork` link and a `/budget-parser` sentence, plus an FAQ
  ("you should try creating your own budgeting solution"). Remove the chip, the
  analyze-locally panel, the inline fork + `/budget-parser` sentence, and the
  FAQ entirely.
- Render the same landing-style ds `<Hero>` (reuse copy above, `cards={[]}`).
  Preferred: switch `budget/src/Hero.tsx` (currently mounts the string hero via
  `mountHero` in a `useEffect`) to render the ds React `<Hero>` directly,
  mirroring print and landing, and drop budget's use of
  `renderHero`/`mountHero`/`renderHeroShell`. Acceptable alternative: keep the
  string-render path and have `renderHero()` emit the ds `<Hero>` markup. Do
  not modify the shared `@commons-systems/components` package.
- Visibility is already correct: `budget/src/Hero.tsx` renders the hero with a
  `hidden` prop that App toggles to `true` when `source === "local"` (viewing
  the user's own data), so the hero already shows only over public/demo data.
  Preserve this gating — do not show the hero over the user's own data.
- CTA targets: `"Source"` → repo URL; `"Learn More"` → the landing About page
  (`https://commons.systems/about`). Budget has no local `/about` route
  (verified 2026-07-13), so the landing About is the correct target — it is the
  ungated service-sales surface the strategy protects.
- Update the affected hero tests to the new behavior, rewriting (never
  weakening) assertions: `budget/test/pages/hero.test.ts`,
  `budget/test/Hero.test.tsx`, and any hero assertions in
  `budget/test/prerender.test.ts` / `budget/test/use-app-state.test.tsx`.
  Assert the landing-style headline/subline/CTAs present and the chip, FAQ,
  fork link, and `/budget-parser` sentence absent.

**Out of scope:** the `source === "local"` visibility toggle logic (already
correct), the shared `@commons-systems/components` hero package, sign-in.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app print || exit 1
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app budget || exit 1
npx vitest run --project print --root . || exit 1
npx vitest run --project budget --root .
```

Manual / browser QA (the strategy requires each surface QA-walked end-to-end;
this runs under the router's qa phase):

- Print, signed out (public demo data): the hero shows the landing-style
  capability statement (headline/subline/two CTAs) with no chips, no FAQ, no
  fork links, no "built with Claude / create your own" note. "Learn More" opens
  the landing About page; "Source" opens the repo.
- Print, signed in (own library): the hero is not shown over the user's own
  data.
- Budget, viewing demo data: the same landing-style hero shows, no chip / no
  analyze-locally panel / no `/budget-parser` sentence / no FAQ.
- Budget, viewing local (own) data: the hero is hidden.
- Landing, About page, and audio/fellspiral: unchanged (no onboarding content
  was present there as of 2026-07-06).
