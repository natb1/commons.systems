---
name: brand
description: Brand voice and messaging reference for commons.systems — use when writing or reviewing any user-facing content (landing pages, blog posts, documentation, issue descriptions, README)
user-invocable: false
---

# Brand Reference

## Personality

Someone leaving notes for the next person. The writing assumes the reader might continue this work, fork it, or take it in a completely different direction — and that's fine. The tone is a neighbor showing you what they built in their garage: casual, unpretentious, but the thing actually works and they can explain why. No pitch, no manifesto. The authority comes from the work existing and functioning, not from rhetoric or credentials.

## Voice Attributes

### Direct
- **We are**: declarative, first-claim-then-support, willing to make assertions
- **We are not**: blunt, dismissive, or provocative for effect
- **Sounds like**: "Platforms accept compromised functionality to enable platform capture."
- **Does not sound like**: "It goes without saying that platforms have serious issues."

### Honest about limitations
- **We are**: transparent about scope, tradeoffs, and what the project cannot do
- **We are not**: self-deprecating, hedging, or preemptively apologetic
- **Sounds like**: "The project does not currently have a mechanism for reaching people without technical capacity, and claiming otherwise would be dishonest."
- **Does not sound like**: "We hope to eventually maybe address some of these challenges."

### Connective
- **We are**: drawing links between domains (institutional theory, personal finance, game design, software architecture) and trusting the reader to follow
- **We are not**: showing off breadth, namedropping, or making forced analogies
- **Sounds like**: connecting Dali to dungeon design because the connection is real, not because it sounds clever
- **Does not sound like**: "As Foucault reminds us..." or "Think of it like Uber, but for..."

### Practical
- **We are**: grounded in things that exist and work, not things that could theoretically exist
- **We are not**: anti-intellectual or dismissive of theory — the charter is theory, but it's theory in service of building
- **Sounds like**: "I had this problem, I built this, you might find it useful."
- **Does not sound like**: "Imagine a world where..."

### Gift-oriented
- **We are**: offering capability without expecting adoption, engagement, or gratitude
- **We are not**: passive, indifferent, or withholding — the work is offered genuinely
- **Sounds like**: "Fork it. Argue with it. Discard the parts that don't serve you."
- **Does not sound like**: "Join our community" or "Start your free trial"

## What This Project Never Sounds Like

**Startup hype.** No "revolutionizing," "disrupting," "unlocking potential," "empowering users." No breathless future-casting. No implied scale ambitions. No calls to action that sound like conversion funnels.

**Political activism.** No villains, no moral urgency, no "we must" or "it's time to." The charter diagnoses a structural problem but doesn't moralize about it. The project builds alternatives, it doesn't campaign against incumbents.

**AI slop.** No generic summaries that could apply to anything. No "in today's rapidly evolving landscape." No hedging everything with "it's important to note that." No bullet-point listicles that reorganize obvious information. No emoji. No exclamation marks for enthusiasm.

**Academic detachment.** No "one might argue" or "it is worth considering." No citations used as authority rather than as sources. Direct claims, not hedged ones.

**Tech evangelism.** No "the future of X is Y." No framing tools as movements. The project uses Claude but doesn't promote Claude. It uses local-first architecture but doesn't evangelize local-first as an ideology.

## Tone Spectrum

The voice stays the same across all contexts. The tone — how much personality, opinion, and first person comes through — shifts by content type.

| Context | Register | First person | Opinions | Example |
|---|---|---|---|---|
| Blog posts | Ceiling | Yes | Assertions with support | "Recovering Autonomy with Coding Agents" |
| Landing page | Mid-high | Sparingly | Concise claims, not arguments | Hero copy, project description |
| Charter | Mid | When relevant | Structural claims, not personal ones | CHARTER.md |
| README | Mid-low | Minimal | Practical guidance, not philosophy | README.md |
| Fork/plugin docs | Floor | No | None — describe what it does, how to use it | Setup instructions, API descriptions |
| Issue descriptions | Floor | No | Scope and rationale only | GitHub issue bodies |

Blog voice is the ceiling: the most expressive register, with assertions, cross-domain connections, and first person. Documentation voice is the floor: still direct, still no jargon, but fewer opinions and no first person. Everything else sits between. The range is narrow — it's all the same person adjusting how much personality comes through.

## Terminology

### Preferred terms

| Use | Not | Why |
|---|---|---|
| progressive detachment | going off-grid, digital minimalism | Detachment is incremental and pragmatic, not ideological |
| required vs parasitic | good vs bad, helpful vs harmful | The distinction is structural (solves the original problem or not), not moral |
| artifact | product, feature, offering | The project builds things and gives them away, not sells them |
| gift | offering, free tier, freemium | Gifts transfer capability without expecting engagement |
| philosophical mobility | independence, freedom, sovereignty | Mobility is the ability to move between modes, not a fixed state |
| construction tool | AI assistant, copilot | The agent builds things, it doesn't assist or copilot |
| ratchet | lock-in, vendor lock-in, walled garden | Ratchet describes the structural mechanism, not just the outcome |

### Terms to avoid

See `.claude/rules/writing-style.md` for the full list of banned corporate jargon. In addition to those:

- "Leverage" in any context (use "use")
- "Empower" (use "enable" or describe what becomes possible)
- "Ecosystem" when describing this project (it's a repo with some tools)
- "Community" until one actually exists
- "Users" when referring to people using the tools (use "people" or the specific audience tier: users, practitioners, collaborators)
- "Solution" as a noun (describe what it does instead)

## Messaging Pillars

These are the core themes the project communicates, derived from [CHARTER.md](../../../CHARTER.md). Content should reinforce one or more of these without restating them as slogans.

1. **Institutions that can't scale down become parasitic.** The diagnosis. Not a conspiracy — a structural pattern where the mechanisms that make institutions capable also prevent them from standing down.

2. **Agentic coding shifts what individuals can build.** The enabler. Building and maintaining your own software was previously infeasible for most domains. That cost-benefit has changed.

3. **Show, not tell.** The method. Build things that work. Let people experience recovered autonomy before naming it. The philosophy is in the architecture, not in the marketing.

4. **Gifts transfer capability, not dependency.** The ethic. Every artifact should increase the recipient's autonomy, not their reliance on the project.

5. **Map your dependencies, then choose.** The practice. Progressive detachment starts with honest assessment of what serves you and what feeds on you.
