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

1. **Landing page hero ([#277](https://github.com/natb1/commons.systems/issues/277))** — The front door to commons.systems. A visitor should understand what the project is in five seconds without reading the charter or the README.
2. **Blog post: the agentic workflow ([#223](https://github.com/natb1/commons.systems/issues/223))** — The most legible demonstration of what agentic coding makes possible. Concrete numbers, concrete artifacts, concrete before/after. This is the findable content with the highest signal for both practitioners and the broader audience.
3. **Plugin distribution ([#440](https://github.com/natb1/commons.systems/issues/440))** — Turns the PR workflow from internal plumbing into a distributable gift. Serves practitioners directly and makes the workflow forkable without cloning the whole repo.
4. **Shallow fork documentation for budget ([#442](https://github.com/natb1/commons.systems/issues/442))** — The charter says forkability without documentation is a hollow gift. Budget is the flagship artifact for the "users" audience. Someone who wants to fork it and make it theirs should be able to.
