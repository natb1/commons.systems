# Roadmap

## Strategy

commons.systems propagates through useful artifacts — tools that solve real problems better than their institutional alternatives in at least one dimension the user cares about. The philosophy is embedded in the architecture (local-first, forkable, deliberate dependencies), not argued in text. Three audiences engage at different depths: users encounter tools, practitioners fork and adapt, collaborators read the [charter](CHARTER.md). For the full diagnosis and principles, see [CHARTER.md](CHARTER.md).

### Choosing what to work on

When choosing a new domain to enter, ask:

1. **Where is institutional dependency most painful?** Look for domains where the platform's business model is visibly misaligned with the user's interest.
2. **Where has agentic coding shifted the cost-benefit?** Look for domains where building your own solution was previously infeasible but is now tractable.
3. **Where is the demonstration most legible?** The before/after of recovered autonomy should be obvious to someone who has never thought about institutional capture.

These criteria guide domain selection. They do not determine sequencing — an artifact nobody encounters cannot demonstrate anything, so delivery and discoverability are priorities alongside building.

## Current assessment

**As of April 2026.** The project is two months old. Four apps are deployed (budget, print, fellspiral, landing). The agentic coding workflow is mature: 12-step PR pipeline, wiggum loops, forked contexts, CI/CD, acceptance tests. ~430 issues closed, ~230 commits.

**What's working:** Artifact production velocity is high. One person with an agent is building and shipping deployed apps at a pace that demonstrates what the charter claims about agentic coding shifting the cost-benefit.

**What isn't working:** Nobody can find the artifacts. Zero forks, zero external engagement, no content connecting the deployed tools to the audiences that would use them. The landing page has no hero. The key blog post explaining the pattern is unwritten. The workflow — the most distinctive artifact — is not yet distributable as a plugin.

**Bottleneck:** Discoverability. The project is producing artifacts into a vacuum. The next phase focuses on making existing work findable before starting new domains.

## Priorities

### 1. Landing page hero ([#277](https://github.com/natb1/commons.systems/issues/277))

- **Why:** The front door to commons.systems. Show-not-tell requires something to show visitors.
- **Audience:** All three — users see tools, practitioners see the workflow, collaborators see the charter.
- **Distribution:** Every other artifact links back here. This is the destination, not the channel.
- **Done when:** A visitor to commons.systems understands what the project is in five seconds without reading the charter or the README.
- **Signal:** Bounce rate on the landing page after blog post submission (is the front door keeping people?).

### 2. Blog post: the agentic workflow ([#223](https://github.com/natb1/commons.systems/issues/223))

- **Why:** The most legible demonstration of what agentic coding makes possible. Concrete numbers, concrete artifacts, concrete before/after.
- **Audience:** Practitioners primarily; broader technical audience secondarily.
- **Distribution:** Submit to Hacker News, r/ClaudeAI, r/selfhosted. Share in Claude Code community channels.
- **Done when:** Published on fellspiral with concrete claims (apps built, timeline, workflow description) and submitted to at least two channels.
- **Signal:** GitHub traffic referrers and unique visitors two weeks after submission. Did people arrive and look around?

### 3. Plugin distribution ([#440](https://github.com/natb1/commons.systems/issues/440))

- **Why:** Turns the PR workflow from internal plumbing into a distributable gift. The workflow is the most distinctive artifact — it should be usable without cloning the whole repo.
- **Audience:** Practitioners.
- **Distribution:** Referenced in the blog post. Listed wherever Claude Code plugins are discoverable. Mentioned in README.
- **Done when:** A practitioner can install the plugin and run the PR workflow on their own repo without reading the monorepo source.
- **Signal:** Plugin installs or clones from people who are not the repo owner.

### 4. Shallow fork documentation for budget ([#442](https://github.com/natb1/commons.systems/issues/442))

- **Why:** The charter says forkability without documentation is a hollow gift. Budget is the flagship artifact for demonstrating recovered autonomy in personal finance.
- **Audience:** Users who want to own their budget tool; practitioners who want to see the pattern applied.
- **Distribution:** Linked from the budget app itself and from the blog post.
- **Done when:** Someone can fork the budget tool, understand the architectural decisions, and deploy their own instance with an agent's help.
- **Signal:** Forks of the repo or derivative budget projects.

## Feedback loop

After each priority ships, check GitHub traffic (views, clones, referrers) and engagement (forks, stars, issues from new people). The charter defines a 12-month failure condition: zero forks, zero derivative projects, zero unsolicited engagement after active publishing and building. The clock on "active publishing" starts when the blog post (#223) ships — that is the first artifact designed to be found.

After priorities 1 and 2 ship, reassess whether the bottleneck has shifted. If traffic increases but engagement doesn't, the problem is the artifacts themselves, not discoverability. If traffic doesn't increase, the problem is the channels or the content. Update the assessment and reprioritize accordingly.

This document should be revisited after each priority ships or when new information changes the assessment. If priorities haven't changed in three months and no priority has shipped, that is a signal — either the priorities are wrong, the scope is too large, or the project has stalled.

## How this document works

This roadmap applies the [charter's](CHARTER.md) strategy to current conditions. It changes frequently — whenever a priority ships, the assessment shifts, or new information changes what matters most. The charter constrains this document; this document operationalizes the charter.

Each priority follows a consistent schema: why (traced to strategy), audience (from the charter's three tiers), distribution (how people encounter it), done-when (testable completion criteria), and signal (what to check afterward). The distribution field is the key discipline — if you can't say where people will find an artifact, building it is premature.

The feedback loop section prevents the roadmap from becoming a static wishlist. It defines when and how to reassess, connecting short-term signals (traffic after a blog post) to the charter's long-term success indicators (forks, derivative projects, unsolicited engagement).

Status tracking (in progress, blocked, done) belongs on the [project board](https://github.com/users/natb1/projects/2/views/1), not here. This document is for deciding what to do and why, not for tracking progress.
