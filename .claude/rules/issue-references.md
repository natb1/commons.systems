# Issue and PR References

## Conversational output: use full URLs

When mentioning a GitHub issue or PR in conversational responses to the user
— status updates, summaries, explanations — reference it by full GitHub URL,
not a bare `#N`. In the terminal `#N` is unclickable plain text; a URL renders
as a clickable link the user can open directly.

URL formats:

- Issue: `https://github.com/natb1/commons.systems/issues/<N>`
- PR: `https://github.com/natb1/commons.systems/pull/<N>`

## GitHub-rendered artifacts: keep `#N`

Commit messages, PR bodies, and issue bodies keep the bare `#N` form. GitHub
auto-links `#N` in those contexts, and `Closes #N` drives GitHub's auto-close
behavior — see `.claude/skills/ref-create-pr/SKILL.md`.
