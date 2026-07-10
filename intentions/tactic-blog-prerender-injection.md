---
id: tactic-blog-prerender-injection
kind: tactic
statement: "packages/blog prerender: use function-form String.replace at the
  three injection sites so post title/description $-sequences are not
  interpreted"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. prerender.ts:276,442,504 use
  string/template String.replace, so a post description containing $& injects a
  literal </head> mid-attribute at build time (reproduced), silently corrupting
  the SEO-critical prerendered surface. Line 200 already documents the
  function-replacement contract these three sites missed. Serves
  strategy-recover-publishing: owned publishing infrastructure must render
  author content faithfully."
reading: null
gap: null
serves:
  - strategy-recover-publishing
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-blog-prerender-injection
  pr: 2820
  attempts: {}
  markers: []
  strategy_fingerprint: d20db0a44e3f83b98133d241bc8915d2ef34944e9f54c6b2e0f2dfc017366328
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# packages/blog prerender: function-form replace at the injection sites

## Context

`packages/blog/src/prerender.ts` uses string/template `String.replace` at
three injection sites, so JS `$`-patterns in post titles/descriptions are
interpreted. Verified 2026-07-05 (reproduced): `previewDescription:
"Save $& more"` prerenders a literal `</head>` mid-attribute at build time on
the SEO-critical surface. Line 200 already documents the function-replacement
contract these sites missed; `escapeHtml` amplifies it (`$'` -> `$&#39;`).

## Unit 1 — function replacers

**Recommended model:** sonnet

Scope:
- `prerender.ts:276,442,504-507`: convert `injectBeforeHead` and both
  `<title>` replacements to function-form replacers (`() => value`) so the
  replacement string is never pattern-interpreted.
- Add a test with a description containing `$&`, `$'`, and `$$` asserting the
  literal text survives in the prerendered output.

## Verification

- The new test passes; a prerender of a post whose description contains
  `$`-sequences produces the exact bytes with no injected markup.
