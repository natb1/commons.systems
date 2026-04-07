# Roadmap

## Strategy

commons.systems propagates through useful artifacts — tools that solve real problems better than their institutional alternatives in at least one dimension the user cares about. The philosophy is embedded in the architecture (local-first, forkable, deliberate dependencies), not argued in text. Four audiences engage at progressive depth: the author uses tools daily, users encounter tools that work, practitioners fork and adapt, collaborators read the [charter](CHARTER.md). For the full diagnosis and principles, see [CHARTER.md](CHARTER.md).

### Prioritizing work

Work is prioritized by progressive validation. Each tier is a prerequisite for the next — and each tier adds ratchet teeth that resist removal. Only advance to the next tier when the previous one validates the need.

1. **Does it solve the author's own problem?** Personal utility is the foundation. An artifact the author doesn't use cannot honestly demonstrate anything. Ratchet cost: minimal — personal tools can be abandoned freely. Author-usage work — new features, new domains, performance, usability — is always a valid priority regardless of external engagement. Tier 1 is the prerequisite for everything else, not something to freeze while waiting for tier 2.
2. **Does it reach other users?** Demonstrated utility validates the claim that individuals can own their tools. Ratchet cost: documentation, data formats, hosting expectations. Accept these only when the author's genuine use proves the artifact works. Distribution work (discoverability, content, SEO) belongs here — but so does performance and usability work, which serves both author experience and the quality of what users encounter.
3. **Can practitioners fork and adapt it?** Extractable, documented artifacts let others practice progressive detachment. Ratchet cost: shared conventions, terminology, patterns. Accept these only when user adoption proves the artifacts are worth adapting.
4. **Does it advance the philosophy for collaborators?** A body of practitioner experience validates the thesis. Ratchet cost: legitimacy, cultural identity, institutional structure. Accept these only when practitioner experience proves the method works.

Work that serves multiple tiers simultaneously is high leverage. The agentic coding workflow (including the skill system) is both the author's daily development tool (tier 1) and the most distinctive artifact for practitioner distribution (tier 3). Performance improvements serve both author usability (tier 1) and the quality of artifacts users encounter (tier 2). Recognizing dual-tier work prevents the error of deprioritizing author-usage improvements as "polish" when they also serve distribution.

When choosing a new domain, the same chain applies — enter domains where the author has a genuine problem first. Within a domain, prioritize depth (solving the author's problem well) before breadth (reaching new audiences).

When choosing a new domain, these criteria help identify where the author's problem is also a good candidate for recovering autonomy:

1. **Where is institutional dependency most painful *for the author*?** Look for domains where the platform's business model is visibly misaligned with the author's interest.
2. **Where has agentic coding shifted the cost-benefit *for problems the author faces*?** Look for domains where building your own solution was previously infeasible but is now tractable.
3. **Where can autonomy plausibly be recovered?** Good candidates share traits like: local-first data storage is viable, the platform's value comes from commoditized technology rather than network effects, open standards exist, or the problem does not inherently require institutional coordination at scale. Not all traits need to be present — the question is whether an individual can realistically own the solution.
4. **Where is the demonstration most legible *because the author genuinely uses it*?** The before/after of recovered autonomy should be obvious to someone who has never thought about institutional capture.

## Current assessment

**As of April 2026.** The project is two months old. Five apps are deployed (budget, print, fellspiral, landing, audio). The agentic coding workflow is mature: 12-step PR pipeline, wiggum loops, forked contexts, CI/CD, acceptance tests. ~430 issues closed, ~230 commits. 0 forks, 1 star.

**What's working:** Artifact production velocity is high. One person with an agent is building and shipping deployed apps at a pace that demonstrates what the charter claims about agentic coding shifting the cost-benefit. All deployed apps are in active author use (tier 1 validated). The agentic workflow — including the skill system — is the author's daily development tool and the project's most distinctive artifact.

**What isn't working:** Nobody can find the artifacts. Zero forks, zero external engagement, no content connecting the deployed tools to the audiences that would use them. The landing page has no hero. The key blog post explaining the pattern is unwritten. The workflow is not yet distributable as a plugin.

**Bottleneck:** Discoverability. The project is producing artifacts into a vacuum. The next phase focuses on making existing work findable while continuing to deepen author-usage artifacts.

## Priorities

### 1. Landing page hero ([#277](https://github.com/natb1/commons.systems/issues/277))

- **Why:** The front door to commons.systems. Show-not-tell requires something to show visitors. Must ship before the blog post so that shared links land on a meaningful page.
- **Validation tier:** All four.
- **Distribution:** Every other artifact links back here. This is the destination, not the channel.
- **Done when:** A visitor understands what the project is in five seconds. Shared links render meaningful preview cards on social platforms (OG metadata, meta description included).
- **Signal:** Bounce rate on the landing page after blog post submission.

### 2. Blog post: the agentic workflow ([#223](https://github.com/natb1/commons.systems/issues/223))

- **Why:** The most legible demonstration of what agentic coding makes possible. The only planned artifact designed to be found by people who do not already know the project exists. The 12-month failure-condition clock starts when this ships. The competitive position — "agentic coding as platform replacement" — is distinct from generic AI productivity content.
- **Validation tier:** Users and practitioners.
- **Distribution:** Submit to Hacker News, r/ClaudeAI, r/selfhosted. Share in Claude Code community channels.
- **Done when:** Published on fellspiral with concrete claims (apps built, timeline, workflow description) and submitted to at least two channels. Landing page hero ships first.
- **Signal:** GitHub traffic referrers and unique visitors two weeks after submission. Did people arrive and look around?

### 3. PageSpeed and usability ([#486](https://github.com/natb1/commons.systems/issues/486))

- **Why:** Performance and usability serve both author experience and the quality of artifacts visitors encounter. Slow, janky apps undermine the "better than the institutional alternative" claim. Meta descriptions, security headers, cache headers, and preconnect hints are table-stakes for distribution.
- **Validation tier:** Author (tier 1) and users (tier 2).
- **Distribution:** Every page that loads fast and renders correctly in social sharing is a distribution asset.
- **Done when:** All deployed apps pass Core Web Vitals and have proper meta/OG tags, security headers, and cache headers.
- **Signal:** PageSpeed scores; social share card rendering.

### 4. Budget professional features ([#452](https://github.com/natb1/commons.systems/issues/452))

- **Why:** Account reconciliation, income statements, cash flow views, and budget variance decomposition are features the author needs for personal finances. Budget is the flagship demonstration of recovered autonomy — it must be genuinely better than platform alternatives for the author.
- **Validation tier:** Author.
- **Distribution:** The quality of the artifact is the distribution — a budget tool the author actually relies on is a more honest demonstration than a feature-sparse prototype.
- **Done when:** The author uses budget as their primary personal finance tool with these capabilities.
- **Signal:** Author usage continuity.

### 5. Daily productivity app ([#456](https://github.com/natb1/commons.systems/issues/456))

- **Why:** Daily agenda, feed aggregation, message integration, and goal tracking solve the author's own coordination problem. New domain where institutional dependency is painful and agentic coding has shifted the cost-benefit.
- **Validation tier:** Author.
- **Distribution:** Becomes a distributable artifact only after the author validates it through daily use.
- **Done when:** The author uses the productivity app daily.
- **Signal:** Author usage continuity.

### 6. Plugin distribution ([#440](https://github.com/natb1/commons.systems/issues/440))

- **Why:** Turns the PR workflow from internal plumbing into a distributable gift. The agentic workflow — including the skill system — is both the author's daily tool and the most distinctive artifact for practitioners. Scope must enable a practitioner to use the workflow, not just read about it.
- **Validation tier:** Practitioners.
- **Distribution:** Referenced in the blog post. Listed wherever Claude Code plugins are discoverable. Mentioned in README.
- **Done when:** A practitioner can install the plugin and run the PR workflow on their own repo without reading the monorepo source.
- **Signal:** Plugin installs or clones from people who are not the repo owner.
- **Gate:** Not a priority until the user-facing workflow is clearly distributed (blog post shipped, engagement signal received).

### 7. Shallow fork documentation for budget ([#442](https://github.com/natb1/commons.systems/issues/442))

- **Why:** The charter says forkability without documentation is a hollow gift. Budget is the flagship artifact for demonstrating recovered autonomy in personal finance. The blocker is not documentation alone but mechanical extractability — budget depends on internal `@commons-systems/*` packages with no extraction mechanism. Scope must enable a practitioner to use the fork, not just read about it.
- **Validation tier:** Users who want to own their budget tool; practitioners who want to see the pattern applied.
- **Distribution:** Linked from the budget app itself and from the blog post.
- **Done when:** Someone can fork the budget tool, understand the architectural decisions, and deploy their own instance with an agent's help.
- **Signal:** Forks of the repo or derivative budget projects.
- **Gate:** Not a priority until the user-facing workflow is clearly distributed.

### 8. Wind-down criteria ([#444](https://github.com/natb1/commons.systems/issues/444))

- **Why:** The charter's Assumption 6 says "define what 'purpose served' looks like before the ratchet has a chance to form." Defining exit criteria is a charter obligation. Must ship before tier 3 work advances.
- **Validation tier:** Collaborators.
- **Done when:** CHARTER.md includes concrete, testable wind-down criteria.

## Feedback loop

The first signal is internal: is the author using the artifacts? If any deployed app stops being useful to the author, that is a tier-1 failure that precedes any external measurement.

After the blog post (#223) ships, check GitHub traffic (views, clones, referrers) and engagement (forks, stars, issues from new people) at two weeks. The charter defines a 12-month failure condition: zero forks, zero derivative projects, zero unsolicited engagement after active publishing and building. The clock on "active publishing" starts when the blog post ships — that is the first artifact designed to be found.

After the blog post ships, reassess whether the bottleneck has shifted. If traffic increases but engagement doesn't, the problem is the artifacts themselves, not discoverability. If traffic doesn't increase, the problem is the channels or the content. Blog post engagement signal is the gate for tier 3 priorities (plugin distribution and fork documentation).

This document should be revisited after each priority ships or when new information changes the assessment. If priorities haven't changed in three months and no priority has shipped, that is a signal — either the priorities are wrong, the scope is too large, or the project has stalled.

## How this document works

This roadmap applies the [charter's](CHARTER.md) strategy to current conditions. It changes frequently — whenever a priority ships, the assessment shifts, or new information changes what matters most. The charter constrains this document; this document operationalizes the charter.

Each priority follows a consistent schema: why (traced to strategy), validation tier (which audience tier this serves — author, users, practitioners, or collaborators), distribution (how people encounter it), done-when (testable completion criteria), and signal (what to check afterward). The distribution field is the key discipline — if you can't say where people will find an artifact, building it is premature.

The feedback loop section prevents the roadmap from becoming a static wishlist. It defines when and how to reassess, connecting short-term signals (traffic after a blog post) to the charter's long-term success indicators (forks, derivative projects, unsolicited engagement).

Status tracking (in progress, blocked, done) belongs on the [project board](https://github.com/users/natb1/projects/2/views/1), not here. This document is for deciding what to do and why, not for tracking progress.
