# Issue and PR References

## Conversational output: append URLs

In conversational responses to the user — status updates, summaries,
explanations — keep the inline reference as `#N`. When a response refers to one
or more issues or PRs, append their GitHub URLs at the end under a `References:`
header, one labeled entry per distinct number:

```
...status text mentioning #659 and PR #665...

References:
- #659: https://github.com/natb1/commons.systems/issues/659
- #665: https://github.com/natb1/commons.systems/pull/665
```

Deduplicate: list each number once, regardless of how often it appears. A bare
`#N` is unclickable plain text in the terminal; the appended URL renders as a
clickable link the user can open directly.

URL formats:

- Issue: `https://github.com/natb1/commons.systems/issues/<N>`
- PR: `https://github.com/natb1/commons.systems/pull/<N>`

## GitHub-rendered artifacts: keep `#N`, append nothing

Commit messages, PR bodies, and issue bodies keep the bare `#N` form and append
no `References:` list. GitHub auto-links `#N` in those contexts, and `Closes #N`
drives GitHub's auto-close behavior — see
`.claude/skills/ref-create-pr/SKILL.md`.
