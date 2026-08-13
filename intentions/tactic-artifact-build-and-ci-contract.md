---
id: tactic-artifact-build-and-ci-contract
kind: tactic
statement: Build the claude-artifact delivery pipeline — a workspace-resident
  single-file build plus the CI contract check and headless from-disk render
  smoke that make publishing boring
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-08-13 /align round that recorded claude
  artifacts as a production delivery substrate. The round answered the author's
  CI question structurally: no CI job can publish an artifact (the Artifact tool
  exists only inside a Claude session), but everything up to publish is
  mechanizable, and nothing mechanizes it today. This is the actuator
  tooling_goal the round added to strategy-owned-web-platform. Retained as a
  draft for /align-tactics."
reading: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications:
  - question: Which of the five units landed, and where?
    answer: "ALL FIVE, in PR #3084 (2026-08-13). (1) Workspace
      `artifacts/plan-view`, registered in the root manifest — covered by the
      vitest project list, the eslint layering rule, knip and detect-changes
      with no registration step, which was the point. Named UNSCOPED
      (`plan-view`, not `@commons-systems/*`) so the layering rule treats it as
      a dependency-graph root: nothing may import an artifact. (2) Single-file
      build, `scripts/build.mjs`. (3) Contract check,
      `scripts/check-artifact.mjs`, with 12 negative tests. (4) From-disk render
      smoke, `scripts/render-smoke.mjs`, run in all three viewer theme states.
      (5) `detect-changes.sh` emits `artifact=true`, consumed by the new
      `artifact-check` job in unit-tests.yml via
      `.claude/skills/dispatch-propagate/scripts/run-artifact-check.sh`, which
      discovers artifact workspaces from the manifest rather than a
      hand-maintained list."
    date: "2026-08-13"
  - question: Which recorded assumptions were wrong, and what replaced them?
    answer: "Three, all found 2026-08-13 while building it. (a)
      `.design-sync/resync.mjs` DOES NOT EXIST — `.design-sync/`
      holds config.json, conventions.md and NOTES.md only; the converter lives
      in a transient gitignored `.ds-sync/`. What was reusable is the SHAPE in
      NOTES.md, not a script. (b) The claim that esbuild leaves an absolute
      `url(/fonts/...)` alone is wrong — esbuild tries to RESOLVE it and fails
      the build. That is the good failure: the silent wrong-typeface outcome the
      round worried about is unreachable by accident, and a resolve plugin
      points the five specifiers at the real woff2 for `dataurl` inlining. (c)
      The zero-external-hosts check cannot be a bare-word scan for
      fetch/WebSocket: the plan view bakes 400+ human-written node statements
      into the page and several contain the phrase `git fetch` — 20 false
      positives on the first run. It matches CALL syntax and skips the inert
      `application/json` data block."
    date: "2026-08-13"
  - question: What did building the contract check reveal about the theme
      clause specifically?
    answer: "(2026-08-13.) That it cannot be expressed as a regex, which is worth recording
      because the obvious implementation passes exactly the page the clause
      exists to reject. `/:root\\s*\\{[^}]*--/` matches
      `@media (prefers-color-scheme: dark){:root{--fg:#fff}}` as happily as a
      top-level rule — so a palette defined ONLY inside a media query passes,
      and that page renders wrong in the viewer's unstamped system-default
      state. `hasBareRootTokens` scans brace depth instead and skips at-rule
      blocks and `:root[data-theme=...]` qualifiers. Caught by its own negative
      test, not in review. Separately: CSS `light-dark()` on a bare `:root` —
      which is how @commons-systems/ds already authors its colour tokens —
      satisfies the clause structurally, needing only `color-scheme` driven per
      theme state. That is a cleaner answer than duplicating a palette under
      `prefers-color-scheme` and is worth preferring in future artifacts."
    date: "2026-08-13"
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Delivered in PR #3084; held so the router does not select it for a
    decomposition round while the PR is open. Unpark to dispose of it on merge
    — all five units landed, so retirement rather than replanning is the likely
    disposition."
  since: "2026-08-13"
pace_exempt: false
rounds: null
attributes: {}
---
# Build the claude-artifact delivery pipeline — a workspace-resident single-file build plus the CI contract check and headless from-disk render smoke that make publishing boring

## Context

`strategy-owned-web-platform` recorded (2026-08-13) that a class of production
surface is delivered as a **published claude artifact** — a page deployed to
claude.ai by the Claude Code Artifact tool. Read that node's clarifications on
the practice, the runtime constraints, the CI answer, and orphaning before
planning this; they are the contract, and this node is the machinery.

The first consumer is `tactic-plan-view-table` (the office-hours plan view,
serving `strategy-attention-surface`). Scope was deliberately held to that one
surface, so this pipeline must work for one artifact well before it works for
many.

## The structural fact that shapes everything

**CI cannot publish.** The Artifact tool exists only inside a Claude session;
there is no CLI and no API in this repo. So unlike `prod-deploy.yml` shipping a
Firebase target, the final step is a human-or-agent session action. The whole
value of this node is making that final step carry no risk: everything
checkable is checked before anyone publishes.

## Units

### 1. A workspace for artifact sources

Artifact source goes in a workspace package, **not** a loose file. This is not
tidiness — it is how coverage happens at all. The repo's quality mechanisms are
generated from the workspace manifest: the root vitest project list, the eslint
`no-restricted-imports` layering rule (`packages/config/eslint.config.js`),
knip, and `detect-changes.sh`'s path triggers. A new workspace is covered by
all of them with **no registration step**; a loose root file is covered by none
of them, which is exactly how `dispatch-scaling-dashboard.html` came to sit at
the repo root untested for two months (see
`tactic-retire-dispatch-scaling-dashboard`).

### 2. A single-file build

Emit **one** self-contained file: all CSS and JS inlined, all assets as `data:`
URIs. Required because the artifact viewer enforces a strict CSP blocking every
external host — CDN scripts, external stylesheets, remote fonts and images,
`fetch`/XHR/WebSockets alike.

**Reuse, do not reinvent.** `.design-sync/resync.mjs` already bundles
`packages/ds/src/index.ts` from TypeScript source via esbuild into a
self-contained bundle with inlined fonts, for the claude.ai design canvas.
There is no `dist/` build in `packages/ds` and none is needed. This build is
the same shape with a different output target. `.design-sync/NOTES.md` carries
the gotchas — most importantly that `packages/ds/package.json`'s
`"types": "src/index.ts"` is load-bearing for component extraction, and that
the DS's IBM Plex woff2 are referenced by **absolute** `url("/fonts/...")` and
must be inlined as `data:` URIs or the page silently falls down the
`--font-mono` fallback stack.

Write the page **content only** — no `<!DOCTYPE>`, `<html>`, `<head>`, or
`<body>` tags: the publish step wraps the file in its own skeleton, and the
file also gets a minimal CSS reset.

### 3. The CI contract check

A script, run in CI, asserting the built file satisfies the artifact contract:

- exactly one output file, self-contained;
- **zero** external-host references (the check that actually protects against a
  page that renders locally and breaks under the viewer's CSP);
- size at or under the **16MB** rendered-page cap, with `data:` URIs counted;
- a `<title>` present **within the first 8KB** — only that prefix is scanned;
- a favicon supplied at publish (one or two emoji), and stable across
  redeploys;
- theme tokens defined on **bare `:root`**, with dark redefinitions guarded
  (`:root:not([data-theme="light"])` under `prefers-color-scheme: dark`, and
  `:root[data-theme="dark"]`) — the viewer has three theme states, and a colour
  whose only definition lives inside a media query renders wrong in one of
  them;
- `body` carries an explicit token background — the viewer paints its own
  ground behind the page, so a transparent body borrows the host's theme;
- no horizontal page scroll: wide content scrolls inside its own
  `overflow-x: auto` container.

Follow the repo's clear-errors-over-fallbacks rule: fail with the remediation
inline, the way `lint-prose-rules.sh` does.

### 4. Headless from-disk render smoke

Because a correctly built artifact is self-contained, it **opens from
`file://` with the network disabled** — so it can be genuinely acceptance
tested, not merely linted. Open the built file in playwright with network
blocked and assert it renders its key regions. Playwright is already in the
repo. **Recorded environment caveat:** on this NixOS host the cached
ms-playwright chromium cannot run (dynamically linked for generic linux);
`DS_CHROMIUM_PATH` pointing at the nix-patched chromium is **required**, not a
cache-miss fallback — see `.design-sync/NOTES.md`.

### 5. Wire the path triggers

Add the artifact workspace to `detect-changes.sh` so the contract check and
render smoke run when it changes, in the same style as the existing
`packages/ds/` trigger that gates `storybook-smoke`.

## Out of scope

Publishing. Any attempt to automate the Artifact tool call from CI. Also out of
scope: migrating any other surface to this substrate — the round that recorded
the practice deliberately scoped it to the plan view as the single first
instance.

## Verification

- A deliberately broken build (an external `<script src>`, an oversized
  payload, a missing `<title>`) fails the contract check with a readable
  message naming the violated clause.
- The built plan view opens from `file://` with the network disabled and
  renders rows.
- Touching the artifact workspace triggers the new CI job; touching an
  unrelated app does not.
- The artifact source is picked up by vitest/eslint/knip with no entry added to
  any hand-maintained list.

Recorded 2026-08-13.
