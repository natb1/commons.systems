---
id: tactic-blog-maintaining-alignment
kind: tactic
statement: 'Author and publish the landing-blog post "Harness engineering:
  maintaining alignment for long-horizon agentic workflows" — a keyword-targeted
  bridge post that leads with the alignment thesis and serves as the narrative
  entrypoint to /align.'
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-06 from GitHub issue #2050 (label: landing; part of
  the closed positioning epic #2048) so the legacy issue can be closed with the
  idea preserved in the graph. Born-parked: an essayistic post in the author's
  voice — with per-citation primary-source verification required — is
  author-owned creative work, not claude-executable. The full motivation,
  2026-06-22 concept-change note, detailed acceptance criteria (some already
  checked), and file targets are retained verbatim in the node body. Secondary
  connection: the post's discoverability/positioning purpose serves
  strategy-own-audience; the serving strategy is for the author to ratify at
  office-hours."
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
  reason: "Author-owned creative writing with primary-source citation
    verification: the post must be written in the author's own voice and every
    citation re-verified; not claude-decidable or claude-executable. At
    office-hours, ratify the serving strategy and either write the post or
    decompose it into implement-ready tactics. Motivation, concept-change note,
    and acceptance criteria are retained in the node body."
  since: 2026-07-06
pace_exempt: false
rounds: null
attributes: {}
---
# Author and publish the landing-blog post "Harness engineering: maintaining alignment for long-horizon agentic workflows" — a keyword-targeted bridge post that leads with the alignment thesis and serves as the narrative entrypoint to /align.

## Retained draft — from GitHub issue #2050 (migrated 2026-07-06, author to complete)

> Original issue body, preserved verbatim below as the draft/spec for this
> post. The author completes it. Checkbox state reflects the issue at migration
> time. This node is born-parked to office-hours because writing it is
> author-owned creative work, not claude-executable.

---

Part of #2048.

## Motivation

A keyword-targeted bridge post on commons.systems that introduces **maintaining
alignment** as the real bottleneck of long-horizon agentic work, and serves as the
narrative entrypoint to the pending `/align` skill (#2100). It speaks the field's
vocabulary (harness engineering, long-horizon autonomy) for discoverability, but
**leads with the alignment thesis**: once frontier models are capable enough to
delegate to, the part that doesn't come in the box is defining your intentions and
keeping a running system aligned to them. Matches the voice of
`landing/post/recovering-autonomy-with-coding-agents.md` (short, essayistic,
first-person, one pull-quote).

> **Concept change (2026-06-22).** This issue originally specced a field report
> titled "harness engineering in practice" (`harness-engineering-in-practice.md`).
> The concept was reframed to lead with the AI-research **alignment** thesis and to
> act as an introduction to `/align` (#2100). The harness-engineering vocabulary,
> the failure-mode mapping, and the citation cluster are retained as supporting
> evidence and discoverability — no longer the post's identity. New slug:
> `maintaining-alignment-long-horizon-agents`. The prior `<!-- dispatch:plan -->`
> comment plans the old post and is **stale** — re-plan against this body before any
> autonomous implement runs.

## Acceptance criteria

### Registration & build

- [x] New `landing/post/maintaining-alignment-long-horizon-agents.md` registered in
  `landing/seeds/firestore.ts` (`posts`: id, title, `published: true`,
  `publishedAt`, filename, `previewDescription`)
- [x] Post appears in `dist/sitemap.xml` and `dist/feed.xml` after build; renders
  correctly

### Angle & content

- [ ] **Leads with the alignment thesis**: capability is largely solved by frontier
  models + state-of-the-art harnesses; the remaining bottleneck is defining
  intentions and maintaining alignment over long horizons. Arc is **theory opening**
  (incl. the paperclip sidebar) → **practical introduction to the dispatch /
  office-hours codebase** → **lands on `/align`**
- [ ] Serves as the **narrative entrypoint to `/align`** (#2100): describes it as the
  recursive intention-alignment system — re-align the next step + push execution
  ownership one level down (human → AI → procedure); the decomposition vs.
  delegation axes. Reference it as a concept/entrypoint, **not a clickable command**
  (the skill is pending; no link that 404s)
- [ ] Retains the harness vocabulary as **supporting evidence**: guides = skills/rules
  (feedforward), sensors = qa/review (computational CI vs. inferential review),
  steering loop = the two queues. Use **outer/user harness**
- [ ] Retains the **failure-mode → mechanism table**, reframed as *alignment decay*
  over a long horizon, using the exact published vocabulary — reasoning drift,
  context rot, premature victory, self-evaluation bias, error compounding,
  slop/verbosity creep — and which mechanism contains each. Carries the SEO-dense
  discoverability
- [ ] Engages the live debate (Anthropic's *shrink-as-models-improve* vs. the
  reliability literature's *intrinsic degradation* — *Beyond pass@1*, *SlopCodeBench*)
  — **optional**, may be trimmed for length
- [ ] Differentiation stated as integration/framing, not per-pattern invention;
  comparables (Code Conductor, Claude Plan Orchestrator) use the source-verified
  framings from #2049, not the refutable versions

### Links & discovery

- [ ] Outbound links to the cluster (attributed correctly): **Böckeler** (on
  martinfowler.com), Anthropic (both the long-running-agents and the harness-design
  pieces), OpenAI (harness engineering), LangChain (anatomy of an agent harness),
  Hashimoto, METR, the canonical awesome-harness-engineering list. Optional: Addy
  Osmani
- [ ] `previewDescription` written for the target queries (alignment + harness +
  autonomous coding agent); **keywords ride on `previewDescription` / OG / meta — the
  body stays first-person essayistic with no keyword stuffing**, and the homepage is
  not repositioned

### Quality gates

- [ ] **Every external citation, author, date, stat, and arXiv ID is verified against
  its primary source before merge; none are search-only** (the carried-over citations
  from the closed PR #2107 draft, incl. arXiv IDs `2603.29231` and `2603.24755`, are
  not yet re-verified)
- [ ] Reads cleanly against the `brand` skill and `.claude/rules/writing-style.md`

## Files

- `landing/post/maintaining-alignment-long-horizon-agents.md` (new),
  `landing/seeds/firestore.ts`


