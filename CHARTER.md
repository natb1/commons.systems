# commons.systems — Project Charter

## Diagnosis

Many modern challenges stem from a specific institutional pathology: institutions that have outlived their original purpose but persist because they structurally cannot scale back down.

### The Institutional Ratchet

Institutions arise to solve genuine problems — emergencies, coordination failures, technical barriers that individuals cannot address alone. A pandemic requires public health infrastructure. A financial system requires standardized exchange. Complex software requires platforms. At their origin, these institutions are responses to real needs.

To operate at the scale the problem demands, an institution must accumulate stabilizing mechanisms — each one genuinely necessary, each one a ratchet tooth that is easy to add and hard to remove:

- **Shared language.** People must agree on what the problem is, which requires definitions, categories, vocabulary. These shape how participants perceive problems, making it harder to recognize when the original problem has changed.
- **Legitimacy.** Some basis for why this group coordinates the response — credentials, authority structures, legal standing. These become gatekeeping mechanisms that determine who is allowed to define the problem.
- **Standards.** Common processes so effort is fungible across the institution — training, certification, compliance frameworks. Systems are built on top of standards, so standards calcify into orthodoxy.
- **Funding.** Dues, taxes, fees, revenue — which require accounting, oversight, and justification cycles. Justification cycles incentivize problem persistence: the institution must demonstrate ongoing need to maintain its funding.
- **Knowledge preservation.** Documentation, institutional memory, onboarding processes. Institutional memory becomes canon that resists revision.
- **Personnel.** People whose expertise, careers, and livelihoods are organized around the institution's continued operation.
- **Infrastructure.** Physical and technical systems purpose-built for the institution's function.
- **Legal frameworks.** Regulations, contracts, and compliance structures that assume the institution's existence.
- **Cultural identity.** Shared purpose, professional identity, and community that participants derive from belonging to the institution.

This list is illustrative, not a taxonomy. Different institutions will have different ratchet profiles — some are heavy on legal frameworks and light on cultural identity, others the reverse. The point is the pattern, not the specific teeth.

None of these are pathological additions. You cannot coordinate a pandemic response without shared terminology. You cannot build infrastructure without engineering standards. You cannot allocate resources without accounting. The ratchet is how institutions become capable enough to solve the original problem.

### Why the Ratchet Only Goes One Way

The pathology is not in the accumulation — it is in the structural inability to reverse it. When the original problem diminishes or changes, the institution cannot easily scale back down because each ratchet tooth is resistant to removal for its own reasons. A standard is hard to retire because systems depend on it. A credential is hard to eliminate because careers are organized around it. A definition is hard to revise because it is embedded in law, process, and shared understanding. A funding mechanism is hard to dismantle because the justification cycle has become self-referential.

The aggregate weight of these interlocking stabilization mechanisms produces what looks like a survival instinct, but requires no conspiracy and no emergent consciousness. It is simpler than that: everything required to *build* an institution at scale becomes a reason the institution *cannot unbuild itself* when that scale is no longer warranted. Rather than scaling down to match the actual problem, the institution redefines the problem to match its current scale.

This is not a claim that institutions are inherently bad. Institutions are tools. The claim is narrower: the same ratchet effects that make institutions capable of solving large problems make them structurally unable to stand down once those problems are solved. The goal is not to eliminate institutions but to develop the discernment to distinguish *required* institutions (still solving the problem that justifies their scale) from *parasitic* ones (redefining problems to justify their continued existence), and the capability to ratchet down from institutions once their purpose is served.

### Platform Bloat as a Specific Case

In technology, this pathology manifests as platform bloat. A platform arises because building software from scratch was prohibitively expensive. The platform solves a real barrier — and in doing so, accumulates its own ratchet: engineering teams, product organizations, data pipelines, compliance departments, sales teams, investor expectations. Each one necessary to operate the platform at scale. Each one a constituency that requires the platform to persist.

When the original barrier shifts — when coding agents make it feasible for individuals to build and maintain their own software — the platform cannot easily scale down. The engineering team needs to ship features to justify their roles. The product managers need to grow metrics. The data pipeline team needs data flowing through the system. The result: platforms accept compromised functionality and even compromised security to enable platform capture. Non-functional requirements (cloud storage, internet connectivity, account creation) exist because the business model demands them, not because the user's problem requires them.

Personal finance illustrates this clearly. The people who most need budget tools have the least disposable income for quality-of-life services. Platforms must monetize through data extraction or attention capture, which means the platform's business model is structurally misaligned with the user's actual interest: financial privacy and control. The security risk of disclosure isn't a technical inevitability — it's a ratchet tooth. Removing cloud storage would eliminate the data pipeline team, the security compliance department, and the advertising revenue stream. The platform literally cannot offer a simpler, more secure solution without dismantling the infrastructure it built to operate at scale.

## Principles

### Philosophical Mobility Over Detachment

The goal is not forced detachment from institutions. That would be dogma, and dogma requires power to maintain. Instead, the goal is *philosophical mobility* — the capability to adopt institutions when they are genuinely helpful (in a crisis, when they improve quality of life with few compromises) while always assessing how to de-institutionalize, individualize, and unwind.

The test is not "how detached am I?" but "can I move between modes when I choose?" Like physical mobility, you don't always need to move, but atrophy of the ability to move is the real danger.

### Show, Not Tell

Philosophical arguments about institutional capture fail to propagate for the same reason philosophical arguments generally fail: they play the power game badly. They try to convert rather than select. They appeal to reason in a world that responds to emotional resonance and lived experience.

The propagation strategy is therefore *demonstration, not argument*. Build artifacts that are genuinely useful — to the author first, then to others. The author's daily use is what makes the demonstration honest rather than performative. People encounter a tool that solves their problem better than the institutional alternative. They experience recovered autonomy before they have a name for it. The philosophy is embedded in the experience, available to those who want it, invisible to those who don't.

This means:

- **Public artifacts** (blog posts, tools, demos) never require philosophical buy-in. They are useful or they aren't.
- **Selection over conversion.** Offer the gift at multiple levels of depth. People self-select into the level that matches their capacity and interest.
- **The philosophy is not the product.** Someone who forks the budget tool and never thinks about institutional capture should still get real value.

### Required vs. Parasitic Institutions

Not all dependencies are equal. The project acknowledges deliberate dependencies where the institution provides genuine value:

- **Open standards** (HTML, JavaScript, Go, git) — freely available, no lock-in
- **Measured infrastructure choices** (GitHub, Firebase, Claude) — deliberate lock-in with understood costs and exit paths

The distinction between a required and a parasitic institution: a required institution solves a problem you cannot currently solve yourself, with understood costs. A parasitic institution manufactures the conditions that prevent you from solving the problem yourself.

### Progressive Detachment

Complete detachment is impossible and not the goal. The goal is progressive — map your dependencies, identify which serve you and which feed on you, and incrementally take ownership where the cost-benefit favors it. Agentic coding shifts that cost-benefit calculation dramatically by making it feasible for individuals to build and maintain software that previously required institutional platforms.

An important distinction: the coding agent is a *construction tool*, not a *runtime dependency*. The outputs of agentic coding — local-first tools built on standard web technologies — do not depend on continued access to the agent that built them. If the agent became unavailable tomorrow, every tool already built would keep working. You would lose the ability to iterate as quickly, but you would not lose what you have built. This is by design: the agent builds capability, it does not become infrastructure.

### Open Source as Gift, Not Offering

Open source got captured because it gave gifts to systems rather than people. Linux runs surveillance capitalism's servers. GitHub was bought for $7.5 billion. The lesson: optimize for human freedom, not code freedom.

Gifts in this project are designed to transfer *capability*, not just tools. The budget tool's progressive disclosure — easy (analyze locally), medium (write a parser), hard (fork and host) — is structured so that each level increases the user's autonomy rather than their dependency on the project.

Forkability is central to this, but forkability without documentation is a hollow gift. A fork becomes a maintenance burden if the recipient cannot understand the architectural decisions behind it. The project has an ongoing obligation to maintain enough documentation that shallow forks — taking one component without understanding the whole — are viable. The composable, skill-based architecture supports this: someone forking the budget tool does not need to understand the PR workflow skills, and someone adopting the agentic workflow does not need the budget tool. And because the tools are built with coding agents, the maintenance burden of a fork is lower than traditional software — you can point an agent at your fork and iterate in a way that was not feasible before.

## Dependency Self-Assessment

The project applies its own diagnostic framework to its own dependencies. For the current technical state of the project, see the [README](https://github.com/natb1/commons.systems/blob/main/README.md). For current priorities, see [ROADMAP.md](ROADMAP.md).

This assessment is not a one-time exercise — it should be revisited as conditions change.

| Dependency | What problem it solves | Required or parasitic? | Exit path | Ratchet risk |
|---|---|---|---|---|
| **GitHub** | Version control hosting, issue tracking, collaboration, discoverability | Required. Self-hosting git is feasible but loses discoverability and collaboration tooling that currently justifies the dependency. | Migrate to self-hosted Gitea or similar. Repo is standard git; history and code are fully portable. Issues and PRs are the main lock-in surface. | Medium. GitHub's terms could change. Microsoft acquisition has not yet produced hostile conditions for this use case, but the ratchet exists. |
| **Firebase** | Hosting and deployment infrastructure | Required, but narrowly. Provides hosting convenience; the local-first architecture means data never depends on Firebase. | Static hosting is commodity infrastructure. Migration to Cloudflare Pages, Netlify, or self-hosted is straightforward. | Low. The architecture was designed so that Firebase is a deployment convenience, not a data dependency. |
| **Claude (Anthropic)** | Agentic coding — generating and maintaining software | Required as a construction tool. Not a runtime dependency. All outputs function independently of Claude. | Alternative LLMs exist and are improving (open-source models, competing providers). The agentic workflow skills are Claude-specific but the *pattern* is portable. | Medium-high. If Anthropic restricts access or pricing becomes uneconomical, iteration velocity drops. But nothing already built breaks. |
| **Open standards** (HTML, JS, Go, git) | Core technology stack | Required. No meaningful alternative at this layer. | N/A — these are the substrate, not institutional dependencies. | Negligible. |

This table is itself a ratchet tooth of the project (it creates a framework that resists revision). It should be updated when dependencies change and pruned if it becomes a compliance exercise rather than a genuine assessment.

## Strategy

### Artifact-First Propagation

The project propagates through useful artifacts, not philosophical arguments. These criteria apply in order of audience tiers. An artifact must first solve the author's real problem before it can credibly claim to solve others'. Each criterion adds ratchet exposure — documentation for progressive depth creates maintenance obligations, and "better than the institutional alternative" creates expectations of continued operation. Accept these teeth only when the previous tier validates the need.

Each artifact should:

1. **Solve a real problem** that a user arrived with, independent of any philosophical framing.
2. **Be better than the institutional alternative** in at least one dimension the user cares about (cost, privacy, control, fit).
3. **Embed the philosophy in the architecture** — local-first data storage, deliberate dependencies, forkability — so the user practices progressive detachment by using the tool, whether or not they recognize it.
4. **Offer progressive depth** — easy entry point for immediate utility, deeper engagement for those who want to understand or modify.

### Audiences and Ratchet Exposure

Four audiences engage at progressive depth. Each tier validates the previous — and each tier adds ratchet teeth. This is the project's own diagnosis applied to itself: the same stabilizing mechanisms that make institutions capable of solving problems make them unable to stand down. Reaching each audience tier is a choice to accept more teeth in exchange for more reach.

**The author** uses the tools daily. Personal utility is the prerequisite for honest demonstration — you cannot show what you do not practice. Ratchet exposure is minimal: if the author stops needing a tool, nothing resists its removal. If the project fails to reach any other audience, artifacts that solve the author's own problems still justify the work.

**Users** encounter tools that work. They use them because the author's genuine use produced something functional and considered. The tool is the gift. Ratchet exposure increases: documentation, data formats, and hosting create expectations. If a user depends on an artifact but cannot migrate away from it, the dependency is parasitic by this project's own definition — the gift has become a lock-in mechanism.

**Practitioners** fork the repo. They adapt the workflow, make different choices, practice progressive detachment through building. Practitioners need evidence from users that the artifacts are worth adapting. Ratchet exposure increases further: shared terminology, conventions, and patterns form. If these calcify into orthodoxy that practitioners cannot deviate from, the project is producing the same institutional capture it diagnoses.

**Collaborators** read this charter. They share the diagnosis and help identify what to build next. Collaborators need a body of practitioner experience to build philosophy around — a charter without demonstrated practice is theory. Ratchet exposure is highest: legitimacy, cultural identity, and shared purpose form. Collaboration exists because recognizing and decoupling from parasitic institutions is a social need. If that need is served — or if it never materializes — the collaborative structure itself resists standing down. An institution dedicated to fighting institutions that has outlived its purpose is the diagnosis made recursive.

Skipping tiers does not just produce hollow claims — it accumulates ratchet teeth before the previous tier proves they are required. Building for practitioners before users find it useful creates documentation and conventions that exist to serve an audience that has not validated the underlying artifacts. Building for collaborators before practitioners exist creates legitimacy and cultural identity around undemonstrated practice.

### Scope

This project demonstrates progressive detachment in domains where individuals can plausibly recover autonomy. Domain selection is an operational decision that belongs in [ROADMAP.md](ROADMAP.md).

What the project offers is a worked example of the *method*: diagnose the ratchet, identify which teeth are required and which are parasitic, build alternatives where feasible, share them as gifts. Whether that method transfers to domains that require institutional coordination at scale is an open question that this project cannot answer alone, and does not claim to.

### Success and Failure

commons.systems is itself an institution. It has a charter, a codebase, a public presence, and (potentially) contributors and users. This is not a contradiction of the philosophy — the diagnosis was never "institutions are bad" but "institutions that cannot scale back down become parasitic."

To the extent that commons.systems is a non-parasitic institution — one that scales to meet a real need and remains structurally capable of scaling back down — institutional indicators of health are appropriate. The architecture is designed to prevent the ratchet from locking: the CC-BY-SA license means the work persists even if the project stops. The forkable architecture means no one depends on the upstream. The local-first design means users are not locked in. These are structural preconditions for an institution that *can* stand down when its purpose is served.

**Observable indicators that the project is serving its purpose:**

- The author actively uses the deployed artifacts in daily life (tier 1 — prerequisite for all other indicators)
- Forks of the repository (public on GitHub)
- Derivative projects — people building their own alternatives to institutional dependencies, whether or not they reference this project
- Unsolicited engagement from people who encountered the work independently
- Blog posts, discussions, or tools that reference or build on the pattern
- Contributors who engage with the charter and help identify what to build next

**Failure conditions that should trigger strategic revision:**

- After twelve months of active publishing and building, zero forks, zero derivative projects, and zero unsolicited engagement from people who encountered the work independently. This is evidence the demonstration is not demonstrating.
- The project develops a user base that depends on it and cannot easily migrate away. This is the ratchet forming.
- The dependency self-assessment reveals a dependency has shifted from required to parasitic, and the project cannot or does not act on that assessment. This is the project failing its own test.
- The author stops using an artifact but continues maintaining it for others. This is the project's own ratchet forming — the artifact persists because of accumulated obligations (documentation, user expectations, hosting) rather than because it serves the author's need. The honest response is to archive the artifact and transfer maintenance to users who depend on it, not to sustain it out of obligation.
- The charter becomes a document that is maintained for its own sake rather than revised or pruned in response to what the project actually needs. This is institutional memory calcifying into canon.

The willingness to define failure conditions is itself a form of philosophical mobility — it means the project is not locked into its current approach by its own ratchet.

## Assumptions and Risks

This section captures the counter-arguments, unresolved tensions, and structural risks that the project must remain honest about. It is intended to be a living record: entries should be added as new risks are identified, updated as conditions change, and removed when they are resolved or no longer relevant. If this section grows without bound or is never pruned, that is itself a signal.

### The Privilege Gradient

**Risk:** Progressive detachment requires resources — time, technical knowledge, hardware. Those most exploited by institutional capture often have the least capacity to build alternatives. The "show not tell" strategy inherently selects for people who can see the show.

**Current response:** The project does not currently have a mechanism for reaching people without technical capacity, and claiming otherwise would be dishonest. The bet is that demonstrating the pattern at the technical layer influences what people with broader reach (journalists, educators, policy advocates) consider possible, and *they* translate it into forms accessible to wider audiences. This is the selection-over-conversion principle applied to the privilege gradient: build something good enough that people with different capabilities carry the pattern into their own contexts.

**Status:** Unresolved. The theory of change has a real gap here. Monitor whether the pattern actually propagates beyond technical practitioners.

### Agentic Coding as Temporary Window

**Risk:** The project's viability depends on coding agents remaining accessible and economical for individual use. AI development trends toward consolidation — models are expensive to train, providers control pricing. If costs rise or access is gated behind enterprise agreements, the cost-benefit calculation that makes individual software ownership competitive could flip back.

**Current response:** The capability of generating software from natural language intent is unlikely to disappear. Open-source models are improving, local inference is becoming more feasible, and competitive dynamics in the AI market make simultaneous price increases across all providers unlikely. More importantly, the architecture distinguishes construction from runtime: the agent builds the thing, the thing does not need the agent to keep running. Loss of agent access reduces iteration velocity but does not destroy what has been built.

**Status:** Acknowledged. The distinction between construction tool and runtime dependency is a structural mitigation. Monitor the economics of agentic coding access.

### Infrastructure Provider Hostility

**Risk:** GitHub, Firebase, and Claude are required dependencies today. Each could change terms, raise prices, or restrict use in ways hostile to this project.

**Current response:** The dependency self-assessment maps exit paths for each. The architecture is designed so that the hardest migration (GitHub, due to issues and collaboration tooling) is feasible if not convenient, and the easiest (Firebase, due to local-first data architecture) is straightforward. Loss of Claude reduces iteration velocity but breaks nothing already built.

**Status:** Monitored via dependency self-assessment. Reassess when conditions change.

### Forking Without Support

**Risk:** The invitation to fork sounds like a gift, but a fork becomes a maintenance burden if the recipient cannot understand the architectural decisions behind it. Without institutional support (documentation, community, maintained upstream), the fork is a liability.

**Current response:** The composable, skill-based architecture means forks can be shallow — take one component without understanding the whole. Agentic coding reduces fork maintenance burden because an agent can iterate on unfamiliar code more effectively than a human reading it cold. The project has an ongoing obligation to maintain documentation sufficient for shallow forks to be viable.

**Status:** Partially addressed by architecture. Documentation quality is an ongoing obligation to monitor.

### Scale Limits

**Risk:** If progressive detachment only works for problems where individuals can plausibly build their own alternatives, and the problems causing the most human suffering require institutional coordination at scale, then the project is a lifestyle optimization for technical professionals, not a response to the institutional pathology it diagnoses.

**Current response:** This is accurate, and the project should not overclaim. The project demonstrates the *method* of progressive detachment in tractable domains. Whether the method transfers to harder domains is unproven. The project's credibility depends on being honest about this scope.

**Status:** Accepted as a scope limitation. Not a problem to solve but a boundary to be honest about.

### The Project's Own Ratchet

**Risk:** commons.systems could develop its own institutional ratchet — accumulating contributors, documentation, process, and cultural identity that make it structurally unable to scale back down or wind itself down when its purpose is served.

**Current response:** The architecture is designed to prevent lock-in: CC-BY-SA licensing, forkable structure, local-first data, no user accounts. The audience tier progression provides an additional structural check: each tier adds ratchet teeth (documentation, conventions, legitimacy, cultural identity), and the project should only accept teeth when the previous tier validates the need. If the project finds itself building for collaborators before practitioners exist, or maintaining artifacts for users the author no longer uses, those are early signals that the ratchet is forming. The failure conditions defined in the Success and Failure section include detecting the ratchet forming. The strongest test of the project's philosophy will be whether it can identify when its purpose is served and actually stand down.

**Status:** Theoretical for now. The test comes later. Define what "purpose served" looks like before the ratchet has a chance to form.

## How this document works

This charter captures the project's diagnosis, principles, and strategy. It changes rarely — when the understanding of the problem shifts, when a principle proves wrong, or when the approach needs revision. Frequent edits are a signal that the charter is either too specific (capturing operational decisions that belong in [ROADMAP.md](ROADMAP.md)) or too fragile (encoding assumptions that haven't been tested).

The charter is not a plan. It does not say what to build next or in what order. Those decisions live in [ROADMAP.md](ROADMAP.md), which applies the charter's strategy to current conditions. The charter constrains the roadmap; the roadmap operationalizes the charter.

The Assumptions and Risks section is the primary maintenance surface. Its entries are structural tensions in the project's theory of change, not operational risks. They belong here because they challenge the diagnosis and principles directly — a reader should encounter the counterarguments alongside the claims. Entries should be added when new risks are identified, updated when conditions change, and removed when resolved. If other sections need frequent revision, that suggests either the diagnosis was wrong or the project has outgrown its original framing — both worth confronting directly rather than patching around.

Fork it. Argue with it. Discard the parts that don't serve you. The only failure would be treating it as dogma rather than a departure point.
