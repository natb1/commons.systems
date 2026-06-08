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
`.claude/skills/implement/SKILL.md`.

### Closing keywords are reserved for the current PR's own issues

`Closes #N` lines drive GitHub's auto-close behavior, but GitHub does not limit
its parser to those lines — it scans the entire PR body for any closing keyword
followed by `#N` and treats every match as a close directive for this PR,
regardless of surrounding context. A keyword used as prose to narrate a
*different* PR's effect is read as this PR's own directive.

So a closing keyword may appear only on the deliberate `Closes #N` lines that
name the issues this PR closes. Never place a closing keyword adjacent to a `#N`
anywhere else in the body. The full keyword set GitHub recognizes:

- `close`, `closes`, `closed`
- `fix`, `fixes`, `fixed`
- `resolve`, `resolves`, `resolved`

The trap: paraphrasing does not help, because every form is a keyword. "PR #911
(Closes #905)" and the obvious rewrite "PR #911 (which resolved #905)" both fire
— `resolved` is a keyword too. The only safe way to narrate another PR's effect
is a bare `#N` with no preceding keyword: `PR #911 (for #905)` or `PR #911,
#905`.
