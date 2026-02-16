---
name: write-instructions
description: Invoke when editing Claude configuration files (CLAUDE.md, .claude/rules/*.md, .claude/agents/*.md, .claude/skills/*/SKILL.md) to ensure instructions follow best practices
---

# Writing Claude Instructions

When writing or editing Claude configuration files, instructions, or documentation:

## Core Principles

**Every line must add value.** Remove filler, obvious information, and redundancy.

**Be concise and dense.** Pack maximum information into minimum words. 

**Be specific, not vague.** Replace general statements with concrete guidance:
- ❌ "Follow good practices for error handling"
- ✅ "Log errors with context; don't swallow exceptions silently"

**Use examples when helpful.** Show, don't just tell:
```markdown
Replace "leverages" with "uses"
Replace "synergy" with specific collaboration details
```

**Omit the obvious.** Don't state what Claude already knows or what's self-evident from context.

**Structure for scanning.** Use headers, bullets, and formatting so Claude can quickly locate relevant sections.

**Write imperatively.** "Use X" not "You should use X" or "It's recommended to use X".

## Anti-Patterns to Avoid

- Introductory fluff ("This document describes...", "The purpose of this is...")
- Restating the same point multiple ways
- Explaining why something is important instead of just stating the rule
- Hedging language ("try to", "consider", "if possible") when you mean "do this"
- Placeholder content in md file ("TODO", "to be determined", "more details later")

## Quality Check

Before finalizing any Claude instruction file, verify:
1. Could any line be removed without losing information?
2. Is every instruction actionable and specific?
3. Would examples clarify any complex points?
4. Does the structure make information easy to find?
