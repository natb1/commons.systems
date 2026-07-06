---
id: tactic-blog-platform-bloat
kind: tactic
statement: "Author and publish the landing-blog essay \"Platform Bloat: Solving
  Problems that Platforms Don't\" — the personal-finance case study for
  recovering autonomy from the platform-capture business model."
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-06 from GitHub issue #223 (label: landing) so the
  legacy issue can be closed with the idea preserved in the graph. Born-parked:
  an essay in the author's voice is author-owned creative work, not
  claude-executable. The full draft prose, prerequisites, and
  acceptance/syndication criteria are retained verbatim in the node body for the
  author to complete. Secondary connection: the budget-tool case study also
  demonstrates strategy-recover-finance; the serving strategy
  (recover-publishing vs the demonstrated domain) is for the author to ratify at
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
  reason: "Author-owned creative writing: the essay must be written in the
    author's own voice; not claude-decidable or claude-executable. At
    office-hours, ratify the serving strategy and either write the post or
    decompose it into implement-ready tactics. Draft prose and acceptance
    criteria are retained in the node body."
  since: 2026-07-06
pace_exempt: false
rounds: null
attributes: {}
---
# Author and publish the landing-blog essay "Platform Bloat: Solving Problems that Platforms Don't" — the personal-finance case study for recovering autonomy from the platform-capture business model.

## Retained draft — from GitHub issue #223 (migrated 2026-07-06, author to complete)

> Original issue body, preserved verbatim below as the draft/spec for this
> post. The author completes it. Checkbox state reflects the issue at migration
> time. This node is born-parked to office-hours because writing it is
> author-owned creative work, not claude-executable.

---

# Platform Bloat: Solving Problems that Platforms Don't

[Recovering autonomy](https://commons.systems/post/recovering-autonomy-with-coding-agents) from platforms (e.g. SAAS) is one of the greatest strategic value propositions for autonomous agents. Beyond that, there is a broad domain of high value, solvable technical problems that go unsolved only because the implementation is not aligned with the platform capture business model.

## Case Study: Personal Finance
Personal finance platforms exist, but they face significant challenges.

The people who need the most help managing a budget are not the people with the most disposable income for quality of life services. The wealthy will have the income to hire accountants, and the privilege to be less strict about their budget. For the target market this means either: take on a non-trivial expense, or wonder how else their attention and data are being monetized. Even if the service is subsidized for public good, how sustainable is that subsidy?

Personal financial data is one of the most sensitive digital assets ordinary people are responsible for. The loss of data could be embarrassing, or lead to identity theft. A platform that is responsible for managing this data must meet a similar level of security compliance as a bank, or investment institution. Ordinary people have no practical way to evaluate compliance with these standards, or audit how the data will be used.

## Platform Bloat
For individuals with the ability to create their own budgeting solutions using coding agents the first problem is solved. The solution has intrinsic value to the developer, there is no need to exploit platform capture to mine additional value.

The security problem is more daunting, and in fact it is this FUD that many platforms will trade in to justify their existence. Before panicking, consider the source of this security risk. The risk of disclosure stems from the non-functional requirement to store financial data on a third party system. This exposes the data to disclosure risk not just with the third party, but because that integration happens via the internet, the disclosure risk is expanded to all actors with access to the internet. This would be an unacceptable risk for the financial data of most organizations.

Why does this non-functional requirement exist? There is some minor functional convenience to accessing your aggregate financial data via the internet (as opposed to a keeping it in a local file, for example). However, the primary reason this requirement exists is to enable the platform capture described in the first point.

> For legacy platforms it is the norm to accept compromised functionality, even compromised security to enable platform capture. The result is platform bloat.

Not all platforms rely on platform capture to the same extent. Platforms that serve as a gateway to novel technology for business purposes can do so at a premium, and can therefore rely less on platform capture. The more dependent a solution is on platform capture, the more it will be compromised by platform bloat. Recovering autonomy from platforms using coding agents avoids this bloat entirely.

## Budget Tool
Using agentic coding I am able to develop and maintain my own [budget](https://budget.commons.systems) tool with some key advantages over adopting a third-party solution.
- The cost of ownership is significantly less than third-party solutions.
- The data is stored in password protected file on an encrypted disk that I own. This is more secure than what is available using third-party solutions, and with more development effort I could reasonably achieve a level of security for my personal finances comparable to the standards used by large enterprises.
- The interface is built to my specification, things are where I put them, and it does not look like generic SAAS.
- My solution will continue to work regardless of whether a third-party is able to maintain a subsidy, or achieve a target revenue.

## Prerequisites

- [ ] Landing page hero (#277) ships first — the blog post links to commons.systems
- [ ] Google Search Console verified (#508) — enables organic search measurement after publication

## Acceptance criteria

*(Amended 2026-07-04, intention-graph alignment: fellspiral is the tabletop
blog where the philosophy stays invisible in the content
(`intentions/strategy-tabletop-storytelling.md`) — an institutional-capture
essay there breaks that node. This post belongs on the landing blog, matching
the issue's `landing` label.)*

- [ ] Published on the landing blog (`landing/post/`) with concrete claims
      (apps built, timeline, workflow description)

## Syndication

*(Replaces the original distribution checklist, which predated
`intentions/delegation-social-publishing.md` — review trigger: "publishing
anything platform-first" — and `strategy-own-audience`. Distribution success
is measured by `strategy-own-audience`'s signal, not submission counts, so the
former "at least two distribution channels" and 24-hour engagement criteria
are dropped.)*

- [ ] POSSE syndication with canonical links back, per
      `intentions/tactic-indieweb-audience.md`
- [ ] Shared within the IndieWeb / local-first / self-hosting venues named by
      `tactic-join-indieweb`, as participation rather than a submission
      campaign


