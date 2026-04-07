---
name: roadmap-debate
description: Structured roadmap reassessment — five personas analyze project state, debate synthesis, stop for user feedback, then propose edits
user-invocable: true
---

# Roadmap Debate

Five personas analyze project state independently, synthesize priorities, debate the synthesis, re-synthesize, and stop for user feedback before proposing edits to ROADMAP.md, CHARTER.md, and the issue backlog.

## Focus Question

If the user provides input after `/roadmap-debate`, treat it as a **focus question** that narrows the scope of the entire debate. Store the focus question and include it in every phase:

- **Phase 2:** Prepend the focus question to each agent's input: "Focus Question: {question}. Weight your analysis toward answering this question. You should still produce your full assessment, but prioritize analysis relevant to the focus question."
- **Phase 3:** After merging priority lists, add a dedicated section: "### Focus Question Response" that directly answers the user's question based on the synthesized findings.
- **Phase 4:** Each agent's review should also evaluate whether the synthesis adequately answered the focus question.
- **Phase 5:** The re-synthesis "Focus Question Response" section should incorporate review feedback.
- **Phase 6:** Present the focus question response as the first section, before the synthesis.

If no input is provided, run the full broad assessment as before.

**Personas:**
| Agent | Lens | Produces priorities? |
|---|---|---|
| Product | User value, charter alignment, competitive analysis | Yes |
| Marketing | Discoverability, distribution, brand, competitive positioning | Yes |
| Engineering | Technical health, workflow sustainability, forkability | Yes |
| Finance | Cost sustainability, dependency economics, monetization | Yes |
| Auditor | Charter compliance, dependency health, ratchet risk | No (findings/warnings that can veto priorities) |

## Phase 1: Gather Context

Run the gather-context script. It writes output to a file and prints the path:

```bash
.claude/skills/roadmap-debate/scripts/gather-context.sh
```

Read the output file at the printed path. Store the contents as a single block to pass to each agent.

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
   - **Tier-1 protection:** Author-usage work (new features, new domains, performance, usability) is always a valid priority per the charter's tier progression. The synthesis must not deprioritize tier-1 work based on lack of external engagement — tier 1 is the prerequisite for everything else, not something to freeze while waiting for tier 2. Work that serves multiple tiers simultaneously (e.g., performance improves both author usability and distribution quality; the skill system is both the author's tool and a practitioner artifact) is high leverage and should be recognized as such.
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

## Phase 5: Re-Synthesize

Take the Phase 3 synthesis and all five Phase 4 review outputs. Produce an updated synthesis that incorporates the review feedback:

1. **Updated unified priority list.** Re-rank priorities based on review feedback. Where a ranking changed from Phase 3, note which agent's feedback caused the change and why.
2. **Consolidated gap analysis.** Merge all five agents' Gap Analysis outputs from Phase 2 into two groups:
   - **Missing issues** — issues that should be on the backlog but aren't. Note which agents flagged each and through what lens.
   - **Scope refinements** — existing issues that need scope changes. Note which agents flagged each.
3. **Unresolved disagreements.** List priority-affecting disagreements that persist after incorporating review feedback. For each:
   - The disagreement
   - Which personas are on each side
   - What information would resolve it

## Phase 6: Stop for User Feedback

Present three sections to the user:
1. Updated synthesis (the re-synthesized priority list from Phase 5)
2. Unresolved disagreements (from Phase 5)
3. Consolidated gap analysis (from Phase 5)

**STOP. Ask the user for feedback before proceeding.** Do not continue to Phase 7 until the user responds.

## Phase 7: Propose Edits

After receiving user feedback, incorporate it and propose concrete edits:

### 1. Draft ROADMAP.md Update
A complete draft of ROADMAP.md incorporating the synthesis and user feedback. Follow the existing ROADMAP.md structure:
- Strategy section (update only if assessment warrants it)
- Current assessment (update date, stats, what's working/not working, bottleneck)
- Priorities (new ranked list with the schema: why, audience, distribution, done-when, signal)
- Feedback loop (update triggers and metrics)

### 2. Proposed Charter Revisions
If any persona or the auditor identified charter sections that need updating, list specific proposed edits with rationale. If none, state "No charter revisions proposed."

### 3. Existing Issues to Update
For each existing issue that needs scope refinement (from gap analysis and synthesis):
- Issue number
- Current scope summary
- Proposed change
- Rationale

### 4. New Issues to File
For each gap identified (issues that should exist but don't):
- Proposed title
- Body draft
- Labels
- Which agents flagged it
- Rationale
