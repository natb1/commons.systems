---
name: roadmap-debate
description: Structured roadmap reassessment — five personas analyze project state through different lenses, debate synthesis, produce draft ROADMAP.md update
user-invocable: true
---

# Roadmap Debate

Five personas analyze project state independently, synthesize priorities, debate the synthesis, and produce a draft ROADMAP.md update.

**Personas:**
| Agent | Lens | Produces priorities? |
|---|---|---|
| Product | User value, charter alignment, competitive analysis | Yes |
| Marketing | Discoverability, distribution, brand, competitive positioning | Yes |
| Engineering | Technical health, workflow sustainability, forkability | Yes |
| Finance | Cost sustainability, dependency economics, monetization | Yes |
| Auditor | Charter compliance, dependency health, ratchet risk | No (findings/warnings that can veto priorities) |

## Phase 1: Gather Context

Collect project state for all personas:

```bash
cat CHARTER.md
cat ROADMAP.md
gh issue list --state open --json number,title,labels --limit 200
gh issue list --state closed --json number,title,closedAt --limit 100
gh api repos/{owner}/{repo} --jq '{stargazers_count, forks_count, watchers_count}'
```

Store all gathered context as a single block to pass to each agent.

## Phase 2: Independent Assessments

Read all 5 agent definition files:
- `.claude/agents/roadmap-product.md`
- `.claude/agents/roadmap-marketing.md`
- `.claude/agents/roadmap-engineering.md`
- `.claude/agents/roadmap-finance.md`
- `.claude/agents/roadmap-auditor.md`

Launch **5 agents in parallel** in a single message using the Agent tool (`subagent_type: "general-purpose"`). Each agent receives:
1. Its persona prompt (from the agent definition file)
2. The full gathered context from Phase 1
3. Instruction to produce output in the exact format specified in the agent definition

The Marketing agent prompt additionally includes: "Read `.claude/skills/brand/SKILL.md` and use it as reference for your Brand Review section."

Wait for all 5 to complete. Store each agent's output.

## Phase 3: Synthesize

Process outputs in this order (synthesis hierarchy). Before synthesizing, verify each agent produced valid output in the expected format. If any agent output is missing, empty, or does not contain the required sections, note this explicitly in the synthesis and adjust the merging weights accordingly.

1. **Auditor first.** Read the Auditor output. Extract all findings and warnings. Any Critical-severity finding can veto a priority.
2. **Flag conflicts.** Identify where auditor warnings contradict priorities from other personas. Document each conflict.
3. **Merge priority lists.** Combine the 4 priority lists (Product, Marketing, Engineering, Finance) using weighted ranking:
   - Items appearing in 3+ lists rank highest
   - Items appearing in 2 lists rank by combined scores
   - Items in 1 list rank by that persona's score, discounted
   - Auditor warnings adjust rankings: Critical finding vetoes the priority (removes from list), Warning adds a note
4. **Produce unified synthesis.** For each priority in the merged list:
   - Which personas advocated for it and why
   - Which personas opposed or didn't mention it
   - Auditor findings that apply
   - Charter alignment assessment
   - Rationale for its final ranking

## Phase 4: Review

Launch **5 agents in parallel** again in a single message. Each receives:
1. Its original persona prompt
2. Its Phase 2 output (so it remembers its own assessment)
3. The Phase 3 synthesis

Each agent produces exactly three sections:
- `## Agreement` — what the synthesis got right, with specific references
- `## Disagreement` — what the synthesis got wrong, with specific arguments
- `## Missing` — what the synthesis omitted that matters

Instruction to each agent: "Produce substantive feedback. Agreement without analysis is not helpful. If you agree with everything, explain why the synthesis is robust rather than just saying you agree."

Wait for all 5 to complete.

## Phase 5: Final Draft

Incorporate review feedback from Phase 4, then present the complete output:

### 1. Persona Assessments
Each persona's original Phase 2 output, labeled by persona.

### 2. Synthesis
The Phase 3 unified priority list with rationale.

### 3. Review Feedback
Each persona's Phase 4 response (Agreement, Disagreement, Missing), labeled by persona.

### 4. Draft ROADMAP.md Update
A complete draft of ROADMAP.md incorporating the synthesis. Follow the existing ROADMAP.md structure:
- Strategy section (update only if assessment warrants it)
- Current assessment (update date, stats, what's working/not working, bottleneck)
- Priorities (new ranked list with the schema: why, audience, distribution, done-when, signal)
- Feedback loop (update triggers and metrics)

### 5. Proposed Charter Revisions
If any persona or the auditor identified charter sections that need updating, list specific proposed edits with rationale. If none, state "No charter revisions proposed."

### 6. Unresolved Disagreements
List any priority-affecting disagreements that Phase 4 review did not resolve. For each:
- The disagreement
- Which personas are on each side
- What information would resolve it
