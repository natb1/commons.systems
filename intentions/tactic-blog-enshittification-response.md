---
id: tactic-blog-enshittification-response
kind: tactic
statement: Author and publish the landing-blog essay responding to the
  enshittification critique of coding agents — demonstrating what recovered
  autonomy looks like in practice rather than arguing against the critique.
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-06 from GitHub issue #475 (label: landing) so the
  legacy issue can be closed with the idea preserved in the graph. Born-parked:
  a philosophical essay in the author's voice is author-owned creative work, not
  claude-executable. The full requirements, the intention-graph nodes the post
  should engage, and the acceptance criteria are retained verbatim in the node
  body. Secondary connection: the post engages strategy-philosophical-grounding
  and strategy-show-not-tell; the serving strategy is for the author to ratify
  at office-hours."
reading: null
gap: null
serves:
  - strategy-recover-publishing
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Author-owned creative writing: the essay must be written in the
    author's own voice; not claude-decidable or claude-executable. At
    office-hours, ratify the serving strategy and either write the post or
    decompose it into implement-ready tactics. Requirements and acceptance
    criteria are retained in the node body."
  since: 2026-07-06
pace_exempt: false
rounds: null
attributes: {}
---
# Author and publish the landing-blog essay responding to the enshittification critique of coding agents — demonstrating what recovered autonomy looks like in practice rather than arguing against the critique.

## Retained draft — from GitHub issue #475 (migrated 2026-07-06, author to complete)

> Original issue body, preserved verbatim below as the draft/spec for this
> post. The author completes it. Checkbox state reflects the issue at migration
> time. This node is born-parked to office-hours because writing it is
> author-owned creative work, not claude-executable.

---

## Context

Posts like [The Pinnacle of Enshittification](https://blogs.gentoo.org/mgorny/2026/04/05/the-pinnacle-of-enshittification-or-large-language-models/) argue that LLMs are fundamentally unethical — trained on stolen work, deployed to displace workers, and serving corporate capture. This critique is influential in the open source community and represents a common framing that conflates all LLM use with the worst corporate practices.

The commons.systems project is a structural counterexample. A blog post that responds to this framing — not by arguing against it, but by demonstrating what recovered autonomy looks like in practice — fills a gap in the current content.

## Requirements

Write a blog post in `landing/post/` that:

- Acknowledges the legitimate concerns (data scraping, environmental cost, displacement, slop) without dismissing or minimizing them
- Distinguishes between LLMs deployed for platform capture vs. coding agents used as construction tools for individual autonomy
- Uses commons.systems and its artifacts (budget tool, this blog, open source skills) as concrete examples — show, not tell
- Addresses the 'is it worth losing our humanity' framing by demonstrating that coding agents can reduce dependence on institutions, not increase it
- Follows the brand voice: direct, honest about limitations, practical, gift-oriented. No tech evangelism, no startup hype, no moral urgency
- Does not attack the source post or its author — engage with the arguments, not the person

### Intention-graph principles to engage

*(Repointed 2026-07-04: CHARTER.md was deleted — its principles migrated to
the intention graph under `intentions/`. The node ids below are the current
authoritative anchors.)*

The post should draw on these intention nodes:

- **Construction tool, not runtime dependency** (`virtue-progressive-detachment`) — the coding agent builds the thing; the thing does not need the agent to keep running. If the agent became unavailable tomorrow, every tool already built keeps working. This directly counters the 'unsustainable industry' argument — the outputs survive the tool.
- **The attachment ledger** (`kind-delegation`, `strategy-complete-ledger`) — not all LLM use is equal. The graph audits every delegation and classifies where capture is detected versus where the dependency is a tool; the enshittification critique conflates all LLM use with captured deployment. *(This replaces the old charter's "required vs parasitic institutions" framing, which was not carried into the graph by name.)*
- **Philosophical mobility** (`virtue-philosophical-mobility`) — the goal is not forced rejection of LLMs. The test is 'can I move between modes when I choose?' Blanket rejection is the same structural rigidity as blanket adoption.
- **The privilege gradient** (`delegation-anthropic-claude`) — honest acknowledgment that progressive detachment requires resources and technical capacity; the delegation record states the unbounded-cost dependency plainly. The post should not overclaim accessibility.
- **Agentic coding as temporary window** (`delegation-anthropic-claude`, `strategy-open-weight-readiness`) — acknowledge that individual access to coding agents could be gated behind enterprise pricing. The structural mitigations are the construction/runtime distinction and a warm open-weight recovery substrate.
- **Show, not tell** (`strategy-show-not-tell`) — philosophical arguments about institutional capture fail to propagate. The post itself should demonstrate, not argue. The delegation ledger (`intentions/delegation-*.md`) is the concrete example of honest dependency management.

## Acceptance criteria

- [ ] New markdown file in `landing/post/` with frontmatter matching existing post format
- [ ] Post is listed in Firestore seed data (`landing/seeds/firestore.ts`)
- [ ] Post renders correctly on the local dev server
- [ ] Post passes the brand voice check (no banned terminology, correct register)
- [ ] Content engages with at least 3 of the 7 arguments from the enshittification critique (data scraping, environmental cost, worker displacement, copyright, community fracturing, lack of intelligence, harm/addiction)
- [ ] Content includes at least 2 concrete examples from commons.systems artifacts
- [ ] `npm run build --prefix landing` succeeds
- [ ] Existing e2e tests pass (`npx playwright test --project landing`)


