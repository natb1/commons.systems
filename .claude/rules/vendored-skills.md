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

## Two enforcement tiers, because CI is blind to the interesting half

`lint-vendored-skills.sh` runs in two tiers. The split is not cosmetic: the two
failures that actually matter are invisible to a CI runner, which has no Claude
skill roots on disk.

| | Checks | Where |
| --- | --- | --- |
| default | **Integrity** — committed content vs the digests in `.upstream.json`, required marker keys, no unlisted files | `run-lint.sh`, every PR |
| `--local` | integrity **+ drift + shadow** | `.githooks/pre-commit` |

- **Drift** — the vendored copy vs the live account-synced original. Integrity
  alone cannot see this: a copy that faithfully matches its own recorded hashes
  is still stale the moment upstream moves.
- **Shadow** — a repo-authored skill name that silently overrides a personal or
  account-synced skill. A project skill wins over both with no warning at any
  level, so the clash is otherwise undetectable until behavior changes.

Skill roots come from `CLAUDE_CONFIG_DIR` (default `~/.claude`). When that root
is absent, `--local` says so and downgrades to integrity rather than failing —
a machine without the account skills synced is not a broken checkout.

Bundled skills are out of scope for the shadow check: their location is not
portably discoverable from a script. Before naming a **new repo-authored**
skill, check the name against the bundled skills listed in a live session.

### Installing the hook

The devshell installs it. `flake.nix`'s `devShells.default.shellHook` sets
`core.hooksPath` to `.githooks` on entry, so `nix develop` (or direnv's
`use flake`) is all a clone needs. Git will not read a repo-controlled hooks
path on its own, and nix is this repo's single path for environment
configuration, so the claim belongs there and nowhere else.

It is claimed only when `core.hooksPath` is unset — a developer who points it
somewhere of their own keeps that. A failed `git config` (a read-only `.git`,
as in some sandboxes) warns rather than aborting shell entry, so the fallback
is the same one command by hand:

```
git config core.hooksPath .githooks
```

Editing `flake.nix` does turn on the nix-gated `nixos-build` and `darwin-build`
CI jobs. That cost is real and was the reason an earlier revision of this rule
asked for the manual command instead; it is paid once here rather than by every
clone forever.

The hook only runs on commits that touch `.claude/skills/`. Drift can also
appear with no commit at all — upstream moves on its own — and blocking an
unrelated commit on that would stall work nobody involved caused. To see that
case, run the check directly:

```
.claude/skills/dispatch-propagate/scripts/lint-vendored-skills.sh --local
```

`git commit --no-verify` bypasses a single commit.
