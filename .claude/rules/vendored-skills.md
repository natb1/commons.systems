# Vendored Skills

A **vendored** skill is one whose source of truth is outside this repository —
today, a skill synced from the claude.ai account under
`~/.claude/skills/synced/<bucket>/`. It is committed here only because cloud
[routines](https://code.claude.com/docs/en/routines) can use *"skills committed
to the cloned repository"* and nothing else: a routine-fired session never sees
account-synced skills.

Everything else under `.claude/skills/` is **repo-authored** and owned here.

## Mark the directory, never rename it

Discovery under `.claude/skills/` is one level deep, and the immediate child
directory name *is* the command name. Measured on Claude Code 2.1.251:
`.claude/skills/probeflat/SKILL.md` resolves as `/probeflat`;
`.claude/skills/vendor/probenested/SKILL.md` resolves as nothing at all. So
neither a grouping directory (`.claude/skills/vendor/morning/`) nor a name
prefix (`.claude/skills/vendor-morning/`) is available — the first hides the
skill, the second renames the command out from under every caller that types
`/morning`.

Distinguish by provenance instead. A vendored skill directory carries
`.upstream.json` at its root; a repo-authored one carries no marker:

```json
{
  "origin": "claude.ai account skill, synced to ~/.claude/skills/synced/<bucket>/morning",
  "vendored_at": "2026-08-29",
  "reason": "Cloud routines can only use skills committed to the cloned repository.",
  "files": { "SKILL.md": "<sha256>", "assets/fonts/x.woff2": "<sha256>" }
}
```

`files` lists every file in the directory except `.upstream.json` itself, each
with its sha256 as vendored. List the vendored skills with:

```
ls -d .claude/skills/*/ | while read -r d; do [ -f "$d.upstream.json" ] && echo "$d"; done
```

## Never hand-edit a vendored skill

The hashes make the directory upstream-owned: an edit here is silently
destroyed the next time the skill is re-vendored, and it diverges from the copy
that runs in every non-routine session, where the account-synced original is
what loads.

- **Re-syncing upstream**: copy the new files in, then recompute every hash in
  `files` and bump `vendored_at`. That is the only change that rewrites hashes.
- **Forking it**: delete `.upstream.json` and rename the directory to a name
  this repo owns. It becomes repo-authored, and its command name changes with
  the directory — update every caller that invokes it, including any routine
  prompt.

`.claude/skills/dispatch-propagate/scripts/lint-vendored-skills.sh` enforces
both halves, unconditionally on every PR via `run-lint.sh`.

## Shadowing is silent, and CI cannot see it

A project skill overrides a personal, bundled, or account-synced skill of the
same name, with no warning at any level. CI has none of those other roots on
disk, so no check here can detect the clash — only the marker makes the
intentional case (a vendored copy deliberately shadowing its own synced
original) legible to a reader.

Before naming a **new repo-authored** skill, check the name against the
bundled and synced skills listed in a live session. Claiming one of those
names silently replaces it everywhere in this repo.
