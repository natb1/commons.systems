# commons.systems — Project Charter

## Diagnosis

Many modern challenges stem from a specific institutional pathology: institutions that have outlived their original purpose but cannot scale back down.

### The Institutional Ratchet

Institutions arise to solve genuine problems — emergencies, coordination failures, technical barriers that individuals cannot address alone. A pandemic requires public health infrastructure. A financial system requires standardized exchange. Complex software requires platforms. At their origin, these institutions are responses to real needs.

To operate at the scale the problem demands, an institution must accumulate stabilizing mechanisms — each one genuinely necessary, each one a ratchet tooth that is easy to add and hard to remove:

- **Shared language.** Definitions, categories, vocabulary that shape how participants perceive problems — making it harder to recognize when the original problem has changed.
- **Legitimacy and standards.** Credentials, authority, training, certification, compliance frameworks. Systems get built on top of these, calcifying them into orthodoxy and gatekeeping.
- **Funding.** Dues, taxes, fees, revenue — and the justification cycles they require, which incentivize problem persistence so the institution can demonstrate ongoing need.
- **Personnel and knowledge.** People whose careers are organized around the institution; institutional memory that becomes canon resisting revision.
- **Infrastructure and legal frameworks.** Physical systems, regulations, and contracts purpose-built around the institution's continued existence.
- **Cultural identity.** Shared purpose and community that participants derive from belonging.

None of these are pathological additions. You cannot coordinate a pandemic response without shared terminology, build infrastructure without engineering standards, or allocate resources without accounting. The ratchet is how institutions become capable enough to solve the original problem.

### Why the Ratchet Only Goes One Way

The pathology is not in the accumulation — it is in the inability to reverse it. When the original problem diminishes or changes, each ratchet tooth resists removal for its own reasons. A standard is hard to retire because systems depend on it. A credential is hard to eliminate because careers are organized around it. A definition is hard to revise because it is embedded in law, process, and shared understanding. A funding mechanism is hard to dismantle because the justification cycle has become self-referential.

The aggregate weight of these interlocking mechanisms produces what looks like a survival instinct without requiring one. Everything required to *build* an institution at scale becomes a reason the institution *cannot unbuild itself* when that scale is no longer warranted. Rather than scaling down to match the actual problem, the institution redefines the problem to match its current scale.

In technology, this pathology manifests as platform bloat. A platform solves a real barrier — building software from scratch was prohibitively expensive — and in doing so accumulates engineering teams, product organizations, data pipelines, compliance departments, sales teams, and investor expectations. When coding agents make it feasible for individuals to build their own software, the platform cannot scale down: its teams need to ship features, grow metrics, and keep data flowing to justify themselves. Non-functional requirements (cloud storage, account creation, data collection) exist because the business model demands them, not because the user's problem requires them. The platform cannot offer a simpler, more secure solution without dismantling the infrastructure it built to operate at scale.

### Required vs. Parasitic Institutions

Institutions are tools, not enemies. The goal is not to eliminate them but to distinguish two kinds:

- A **required** institution solves a problem you cannot currently solve yourself, with understood costs.
- A **parasitic** institution manufactures the conditions that prevent you from solving the problem yourself, and redefines the problem to justify its continued existence.

The same ratchet effects that make institutions capable of solving large problems make them unable to stand down once those problems are solved. The work is developing the discernment to tell the two apart, and the capability to ratchet down once an institution's purpose is served.

## Principles

### Philosophical Mobility Over Detachment

The goal is not forced detachment from institutions. That would be dogma, and dogma requires power to maintain. Instead, the goal is *philosophical mobility*: the capability to move between depending on an institution and operating without it, choosing each mode based on what the situation actually requires rather than what you have grown unable to leave. Adopt institutions when they are genuinely helpful (in a crisis, when they improve quality of life with few compromises) while always assessing how to de-institutionalize, individualize, and unwind.

The test is not "how detached am I?" but "can I move between modes when I choose?" Like physical mobility, you don't always need to move, but atrophy of the ability to move is the real danger.

### Show, Not Tell

Philosophical arguments about institutional capture fail to propagate because they try to convert rather than select — they appeal to reason in a world that responds to lived experience.

The propagation strategy is therefore *demonstration, not argument*. Build artifacts that are genuinely useful — to the author first, then to others. The author's daily use is what makes the demonstration honest rather than performative. People encounter a tool that solves their problem better than the institutional alternative. They experience recovered autonomy before they have a name for it. The philosophy is embedded in the experience, available to those who want it, invisible to those who don't.

This means:

- **Public artifacts** (blog posts, tools, demos) never require philosophical buy-in. They are useful or they aren't.
- **Selection over conversion.** Offer the gift at multiple levels of depth. People self-select into the level that matches their capacity and interest.
- **The philosophy is not the product.** Someone who forks the budget tool and never thinks about institutional capture should still get real value.

### Progressive Detachment

Complete detachment is impossible and not the goal. The goal is progressive — map your dependencies, identify which serve you and which feed on you, and incrementally take ownership where the cost-benefit favors it. Agentic coding shifts that calculation dramatically by making it feasible for individuals to build and maintain software that previously required institutional platforms.

An important distinction underwrites this: the coding agent is a *construction tool*, not a *runtime dependency*. The outputs of agentic coding — local-first tools built on standard web technologies — do not depend on continued access to the agent that built them. If the agent became unavailable tomorrow, every tool already built would keep working. Iteration slows; nothing breaks. The agent builds capability; it does not become infrastructure.

### Open Source as Gift, Not Offering

Open source got captured because it optimized for *code* portability while leaving *user* portability unaddressed. Artifacts moved freely between institutions; users did not gain mobility. The license guaranteed that the code could be forked, but said nothing about whether the people running the code on your behalf had any interest aligned with yours. The lesson: optimize for human freedom, not code freedom.

Gifts in this project are designed to transfer *capability*, not just tools. The budget tool's progressive disclosure — easy (analyze locally), medium (write a parser), hard (fork and host) — is structured so that each level increases the user's autonomy rather than their dependency on the project.

Forkability is central to this, but forkability without documentation is a hollow gift — a fork becomes a maintenance burden if the recipient cannot understand the architectural decisions behind it. The project has an ongoing obligation to maintain enough documentation that shallow forks (taking one component without understanding the whole) are viable. The composable, skill-based architecture supports this: someone forking the budget tool does not need to understand the PR workflow skills, and vice versa. And because the tools are built with coding agents, the maintenance burden of a fork is lower than traditional software — you can point an agent at your fork and iterate in a way that was not feasible before.

## Strategy

### Artifact-First Propagation

The project propagates through useful artifacts, not philosophical arguments. An artifact must first solve the author's real problem before it can credibly claim to solve others'.

Each artifact should:

1. **Solve a real problem** that a user arrived with, independent of any philosophical framing.
2. **Be better than the institutional alternative** in at least one dimension the user cares about (cost, privacy, control, fit).
3. **Embed the philosophy in the architecture** — local-first data storage, deliberate dependencies, forkability — so the user practices progressive detachment by using the tool, whether or not they recognize it.
4. **Offer progressive depth** — easy entry point for immediate utility, deeper engagement for those who want to understand or modify.

### Audiences

Four audiences engage at progressive depth. Each tier validates the previous, and each adds ratchet teeth — documentation obligations, conventions, legitimacy, cultural identity. Reaching a tier is a choice to accept more teeth in exchange for more reach, and teeth should only be accepted when the previous tier validates the need.

**The author** uses the tools daily. Personal utility is the prerequisite for honest demonstration — you cannot show what you do not practice. Few teeth here: if the author stops needing a tool, nothing resists its removal. If the project fails to reach any other audience, artifacts that solve the author's own problems still justify the work.

**Users** encounter tools that work. They use them because the author's genuine use produced something functional and considered. The tool is the gift. Now documentation, data formats, and hosting create expectations. If a user depends on an artifact but cannot migrate away from it, the dependency is parasitic by this project's own definition — the gift has become a lock-in mechanism.

**Practitioners** fork the repo. They adapt the workflow, make different choices, practice progressive detachment through building. Shared terminology, conventions, and patterns form. If these calcify into orthodoxy that practitioners cannot deviate from, the project is producing the same institutional capture it diagnoses.

**Collaborators** read this charter. They share the diagnosis and help identify what to build next. A charter without demonstrated practice is theory. The deepest teeth form here: a collaborator who has spent two years on the charter has a stake in the charter being right. An institution dedicated to fighting institutions that outlives its purpose is the failure mode this whole document warns about.

Skipping tiers does not just produce hollow claims — it accumulates teeth before the previous tier proves they are required. Building for practitioners before users find artifacts useful creates documentation and conventions serving an unvalidated audience. Building for collaborators before practitioners exist creates legitimacy and cultural identity around undemonstrated practice.

### Dependency Self-Assessment

The project applies its own framework to its own dependencies. The current dependency self-assessment — what each dependency solves, whether it is required or parasitic, its exit path, and its ratchet risk — is rendered on the project landing page at [commons.systems](https://commons.systems) alongside the app demonstration, where a visitor can see both what the project gives away and what it still depends on. Revisit as conditions change; prune if it becomes a compliance exercise rather than a genuine assessment.

For the current technical state of the project, see the [README](https://github.com/natb1/commons.systems/blob/main/README.md). For current priorities, see [ROADMAP.md](ROADMAP.md).

### Scope

This project demonstrates progressive detachment in domains where individuals can plausibly recover autonomy. Domain selection is an operational decision that belongs in [ROADMAP.md](ROADMAP.md). What the charter offers is a worked example of the *method*: diagnose the ratchet, identify which teeth are required and which are parasitic, build alternatives where feasible, share them as gifts.

commons.systems is itself an institution. It has a charter, a codebase, a public presence, and (potentially) contributors and users. This is not a contradiction — the diagnosis was never "institutions are bad" but "institutions that cannot scale back down become parasitic." The architecture is designed to prevent the ratchet from locking: CC-BY-SA licensing means the work persists even if the project stops; the forkable architecture means no one depends on the upstream; the local-first design means users are not locked in. These are preconditions for an institution that *can* stand down when its purpose is served.

### Success and Failure by Tier

Success and failure are tiered to match the audience structure. Each tier's success criterion is *independently sufficient* — the project can succeed at tier 1 alone and owe nothing further. Each tier's failure only applies if the project has chosen to pursue that tier's ambitions. Teeth without the validating tier below them is itself the failure.

**Tier 1 — Author.** *This tier alone is full project success.*
- **Success:** the author uses the deployed artifacts in daily life to progressively detach from institutional software.
- **Failure:** the author stops using an artifact but continues maintaining it for others. The artifact persists because of accumulated obligations rather than author need. The honest response is to archive and transfer maintenance to users who depend on it, not sustain it out of obligation.

**Tier 2 — Users.** *Only activated if the project has published artifacts for use beyond the author.*
- **Success:** users adopt artifacts and can migrate away if they choose. The gift transfers capability, not dependency.
- **Failure:** users depend on artifacts they cannot migrate from. The gift has become a lock-in mechanism — parasitic by this project's own definition.

**Tier 3 — Practitioners.** *Only activated if the project has invited forks and adaptation.*
- **Success:** forks, derivative projects, and independent adaptation by people practicing progressive detachment through their own building — whether or not they reference this project.
- **Failure (two modes):**
  - Practitioners are courted before users validate the artifacts, producing documentation and conventions that serve an unvalidated audience.
  - Shared terminology and conventions calcify into orthodoxy practitioners cannot deviate from — the project produces the same institutional capture it diagnoses.
  - Silence at this tier (zero forks, zero derivatives) after deliberate publishing: the demonstration is not demonstrating *at the tier the project chose to pursue*.

**Tier 4 — Collaborators.** *Only activated if the project has opened the charter to collective revision.*
- **Success:** shared diagnosis with contributors who help identify what to build next, grounded in a body of practitioner experience.
- **Failure (two modes):**
  - Collaborators are courted before practitioners exist, producing legitimacy and cultural identity around undemonstrated practice.
  - The collaborative structure outlives its purpose. An institution dedicated to fighting institutions that cannot stand down is the failure mode this whole document warns about. The charter becomes a document maintained for its own sake rather than revised or pruned.

**Cross-cutting failure (applies at any tier).** The dependency self-assessment reveals a dependency has shifted from required to parasitic, and the project cannot or does not act on that assessment. The project is failing its own test.

The willingness to define failure conditions is itself a form of philosophical mobility — the project is not locked into its current approach by its own ratchet.

## Assumptions and Risks

This section captures the counter-arguments and unresolved tensions the project must remain honest about. It is a living record: entries should be added as new risks are identified, updated as conditions change, and removed when resolved. If this section grows without bound or is never pruned, that is itself a signal.

Failure conditions (above) are *observable tripwires*. The entries here are *conceptual tensions* — challenges to the theory of change that may never produce a clean signal.

### The Privilege Gradient

**Risk:** Progressive detachment requires resources — time, technical knowledge, hardware. Those most exploited by institutional capture often have the least capacity to build alternatives. The "show not tell" strategy inherently selects for people who can see the show.

**Current response:** The project does not currently have a mechanism for reaching people without technical capacity, and claiming otherwise would be dishonest. The bet is that demonstrating the pattern at the technical layer influences what people with broader reach (journalists, educators, policy advocates) consider possible, and *they* translate it into forms accessible to wider audiences. This is the selection-over-conversion principle applied to the privilege gradient: build something good enough that people with different capabilities carry the pattern into their own contexts.

**Status:** Unresolved. The theory of change has a real gap here. Monitor whether the pattern actually propagates beyond technical practitioners.

### Agentic Coding as Temporary Window

**Risk:** The project's viability depends on coding agents remaining accessible and economical for individual use. AI development trends toward consolidation — models are expensive to train, providers control pricing. If costs rise or access is gated behind enterprise agreements, the cost-benefit calculation that makes individual software ownership competitive could flip back.

**Current response:** The capability of generating software from natural language intent is unlikely to disappear — open-source models are improving, local inference is becoming more feasible, and competitive dynamics make simultaneous price increases across all providers unlikely. The construction-tool-vs-runtime distinction (see Progressive Detachment) is the structural mitigation: loss of agent access slows iteration but does not destroy what has been built.

**Status:** Acknowledged. Monitor the economics of agentic coding access.

### Infrastructure Provider Hostility

**Risk:** GitHub, Firebase, and Claude are required dependencies today. Each could change terms, raise prices, or restrict use in ways hostile to this project.

**Current response:** The dependency self-assessment maps exit paths for each. The hardest migration (GitHub) is feasible if not convenient; the easiest (Firebase) is straightforward. Loss of Claude reduces iteration velocity but breaks nothing already built.

**Status:** Monitored via dependency self-assessment. Reassess when conditions change.

### Scale Limits

**Risk:** If progressive detachment only works for problems where individuals can plausibly build their own alternatives, and the problems causing the most human suffering require institutional coordination at scale, then the project is a lifestyle optimization for technical professionals, not a response to the institutional pathology it diagnoses.

**Current response:** This is accurate, and the project should not overclaim. It demonstrates the *method* of progressive detachment in tractable domains. Whether the method transfers to harder domains is unproven. Credibility depends on being honest about this scope.

**Status:** Accepted as a scope limitation. Not a problem to solve but a boundary to be honest about.

### The Project's Own Ratchet

**Risk:** commons.systems could develop its own institutional ratchet — accumulating contributors, documentation, process, and cultural identity that make it unable to scale back down when its purpose is served.

**Current response:** Architectural preventions (CC-BY-SA, forkable structure, local-first data, no user accounts) and the tier-validation discipline in Success and Failure are the structural mitigations. The deeper question is whether the project can identify when its purpose is served *at the tier it has chosen to pursue* and actually stand down.

**Status:** Theoretical for now. Define what "purpose served" looks like at each tier before the ratchet has a chance to form.

---

*This charter captures the project's diagnosis, principles, and strategy. It changes rarely. The Assumptions and Risks section is the primary maintenance surface — its entries are tensions in the project's theory of change, and they belong alongside the claims so a reader encounters the counterarguments directly. Operational decisions (what to build next, in what order) live in [ROADMAP.md](ROADMAP.md). The charter constrains the roadmap; the roadmap operationalizes the charter. Frequent edits to any section other than Assumptions and Risks signal that the diagnosis was wrong or the project has outgrown its framing — both worth confronting directly rather than patching around.*

Fork it. Argue with it. Discard the parts that don't serve you. The only failure would be treating it as dogma rather than a departure point.
