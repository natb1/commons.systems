# Sandbox

This is a standard Claude Code repository: the working tree at the repo root is
the git root (`.git` is a normal directory inside it), and Claude Code native
worktrees live under `.claude/worktrees/`. (It was formerly a
bare-repo-with-worktrees layout keyed on a `.bare` common dir; that was retired
2026-07-21 — older `.bare`-referencing notes are historical.)

One path is in the sandbox write-allowlist — `sandbox.filesystem.allowWrite`
in `.claude/settings.json` — relative to the project root:

- `.git` — the git directory (index, objects, refs, and worktree registrations
  under `.git/worktrees/`). The worktree checkouts live under the working tree
  (`.claude/worktrees/`), but only the session's **own** worktree is writable.
  The sandbox is a mount namespace with a read-only root; writability comes from
  per-session rw bind-mounts on that one worktree and on `<repo>/.git`. Nothing
  mounts `.claude/worktrees/` itself, so a **sibling** worktree's checkout
  inherits the read-only root.

Most git operations work **without** `dangerouslyDisableSandbox`:

- `git add` / `git commit` — write to the index and objects under the writable `.git` dir.
- `git worktree add` — registers under `.git/worktrees/` and creates the checkout
  under the working tree. Sandbox-safe only from a session whose own rw mount
  covers the destination — i.e. from the repo-root checkout. From a
  **worktree-isolated** session the new checkout lands under
  `<repo>/.claude/worktrees/`, which that session's mounts do not cover (see
  above), so it fails read-only and needs `dangerouslyDisableSandbox: true`
  like any other write there. (`git worktree remove` needs the override from
  anywhere; see the next section.)
- `git push` / `git fetch` — use HTTPS to `github.com`, an allowlisted host.

Tree-updating ops (`merge`, `checkout`, `rebase`, `reset`, `worktree remove`)
require care — see the next section.

If the `.git` allowlist entry is missing, the matching write fails read-only —
e.g. `Unable to create '.git/worktrees/<branch>/index.lock': Read-only file
system` on a commit.

## Tree-updating git ops touching read-only paths

`git merge`, `git checkout`, `git rebase`, `git reset`, and `git worktree remove`
update the working tree **non-transactionally**: they write files one at a time
and abort on the first failure. When such an op touches files under the read-only
`denyWithinAllow` carve-out paths — `.claude/skills/`, `.claude/hooks/`, and the
other `.claude/` config carve-outs — it:

1. Writes the writable files successfully.
2. Aborts with an error like:

```
error: unable to unlink old '.claude/skills/...': Read-only file system
```

3. Leaves HEAD unmoved.

The result: the already-written writable files are left modified-but-uncommitted,
indistinguishable from a stray manual edit.

**Such ops must run with `dangerouslyDisableSandbox: true`.**

Canonical case: `dispatch-select-tick` (run by the headless `dispatch-tick`)
runs `git fetch origin main && git merge --ff-only origin/main` on the `main`
worktree. `origin/main` frequently carries `.claude/skills/**` changes (the
dispatch skills are actively developed), so this sync routinely hits the hazard.
It must run with `dangerouslyDisableSandbox: true`.

Canonical case: `git worktree remove` on a **sibling** worktree, whose checkout is
under the read-only root. Sandboxed, it deletes what it can — including the
target's `.git` file — then aborts:

```
error: failed to delete '.../tactic-...': Read-only file system
error: failed to delete '.git/worktrees/tactic-...': Device or resource busy
```

The `Device or resource busy` half has its own cause: the sandbox overlays
`/dev/null` onto `.git/worktrees/<name>/config.worktree`, and a mount point cannot
be unlinked. Retrying does not recover — the second attempt fails validation with
`'.../.git' is not a .git file, error code 7`, because the first attempt already
destroyed the file the second validates against. So set
`dangerouslyDisableSandbox: true` on the *first* attempt. Once partially deleted,
recover with `rm -rf <path>` then `git worktree prune`.

Run it **without** `--force`, so git's own clean-check still gates the removal, and
confirm `git rev-list --count origin/main..<branch>` is 0 **after a fresh fetch** —
a stale local `origin/main` makes an unmerged branch look merged.

## gh CLI (GitHub API)

`gh` uses the macOS Security framework for TLS certificate validation, which sandbox blocks:

```
tls: failed to verify certificate: x509: OSStatus -26276
```

Use `dangerouslyDisableSandbox: true` on **all** Bash calls that invoke `gh` directly or via scripts
(e.g., `post-pr-comment.sh`). Apply this from the start — do not wait for a TLS error before
setting it.

## npm cache writes

`npx` downloads packages to `~/.npm/_cacache/`, which sandbox blocks:

```
EROFS: read-only file system, open '~/.npm/_cacache/tmp/...'
```

Use `dangerouslyDisableSandbox: true` on Bash calls that run `npx` for packages not
already cached (e.g., `npx firebase-tools`, `npx playwright test`), or scripts that
invoke them (e.g., `run-qa-server.sh`).

## Network namespace isolation

Sandboxed Bash calls run in an isolated network namespace. Servers started with
`dangerouslyDisableSandbox: true` listen on the host network — sandboxed `curl`,
`ss -tlnp`, and health checks cannot reach them.

Use `dangerouslyDisableSandbox: true` on Bash calls that check local server
connectivity (e.g., `curl http://localhost:*`, `ss -tlnp`, readiness polls).

## claude agents --json

`claude agents --json` lists live Claude sessions. It reaches the local Claude
daemon over a Unix socket, which the sandbox's network-namespace isolation
blocks. A sandboxed call does not error — it returns an empty `[]`,
indistinguishable from a genuine "no live sessions" result. A caller that
trusts that `[]` would wrongly conclude a worktree is free.

Use `dangerouslyDisableSandbox: true` on every Bash call that runs
`claude agents --json` directly, or that runs a script sourcing
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` (whose
`claude_sessions_under` / `worktree_has_live_session` helpers shell out to it).

## pass / GPG pinentry

`pass show <path>` decrypts a GPG-encrypted secret store entry. GPG cannot
prompt for a passphrase via pinentry in Claude's non-interactive shell — if
the gpg-agent cache is cold, the command fails with
`gpg: decryption failed: No pinentry`.

For workflows that need a `pass`-managed secret (e.g. `BUDGET_ETL_PASSWORD`
for the `budget` skill):

1. Warm the cache once in your interactive host shell:
   `pass show <path>` (enter the GPG passphrase when pinentry prompts).
2. Then export the value into Claude's shell:
   `export VAR="$(pass show <path>)"`.

Auto-warming the gpg-agent cache from within Claude is out of scope; the
secret backend (`pass` / GPG) is not changed by this rule.

## Command pattern matching

`allowedTools` rules match from the start of the command string. Patterns that
break prefix matching cause permission prompts. Avoid these patterns:

### Avoid `cd && command` for write/execute commands

As of Claude Code 2.1.111, read-only commands starting with `cd <project-dir> &&`
are auto-approved (e.g. `cd print && ls`, `cd print && git status`).

For commands that execute code or modify files, `cd /path && command` still
doesn't match rules like `Bash(npx vitest:*)`. Use flags that accept a directory
instead:
- `npm run build --prefix print` (npm `--prefix` flag)
- `npm ci --prefix print`
- For tests, deploys, QA: use the wrapper scripts which handle directory context

For app vitest suites, do **not** root at the app directory (`--root print`):
that scopes vite's `server.fs.allow` to `print/`, so root-hoisted `?url` asset
imports (e.g. `pdfjs-dist`'s worker, hoisted to the worktree-root `node_modules`
by npm workspaces) are denied and correct changes false-fail. Instead root at the
worktree/repo root and select the app with `--project`:

- Generic form: `npx vitest run --project <app> --root <repo_root>`
- From a worktree root: `npx vitest run --project print --root .`

Rooting at the repo root keeps `server.fs.allow` covering the hoisted-to-root
`node_modules`, so those `?url` asset imports resolve. This is also what CI's
`run-unit-tests.sh` runs (`npx vitest run --project <app> --root "$REPO_ROOT"`),
and it is the form plan-verification (```verify```) blocks for app test suites
should use. The `Bash(npx vitest:*)` wildcard already matches it.

### `git -C /path` is auto-approved for worktrees

Only outside a worktree-isolated session. There, the PreToolUse hook approves
`git -C <path>` when the path is under the worktrees root and the subcommand is
permitted by `settings.json`; paths outside it are rejected.

From a **worktree-isolated session, every `git -C` to a path other than its own
worktree is refused** — including a sanctioned sibling under `.claude/worktrees/`:

```
This session is isolated in the worktree .../<A>, but this command redirects
git to the shared checkout via -C. Refusing to run it
```

That is a Claude Code built-in, a separate and earlier gate than the PreToolUse
hook, so the hook's approval never reaches it. It keys on the **`-C` flag**, not
on where the flag points — relocating a scratch checkout under `.claude/worktrees/`
changes nothing, and the message says "the shared checkout" even when the target is
a sibling worktree. A second variant refuses compound commands as too complex to
verify that they stay inside the worktree; break those into plain separate commands.

Alternatives that do work from an isolated session:

- `git worktree list` and `git worktree remove <abs path>` are not blocked — they
  take a path argument rather than redirecting git.
- Read committed state from your own worktree: `git show origin/main:<path>`.
- Compare a foreign checkout's content with path-based tools: `cmp`,
  `git hash-object <abs path>`, `grep`.
- Let the target worktree's own scripts manage its repo — invoke its copy by
  absolute path; `graph-commit`, `dump-node.ts` and `write-node.ts` resolve
  `REPO_ROOT` from the script's own location.

### Avoid inline env var prefixes

`VAR=value command` breaks prefix matching.

```bash
# Bad — breaks allowedTools matching
VITE_GITHUB_BRANCH="75-prototype-print-viewer" npm run build --prefix print

# Good — use wrapper scripts that set env vars internally
.claude/skills/dispatch-propagate/scripts/run-qa-server.sh print
.claude/skills/dispatch-propagate/scripts/run-preview-deploy.sh print pr-146
.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh print
```

### Avoid double quotes spanning newlines in heredoc commit messages

The `allowedTools` glob matcher does naive quote-tracking on command strings.
When a heredoc body contains a balanced `"..."` pair followed by another `"`
that opens on one line and closes on the next, the matcher misreads the inner
closing `"` as ending the outer command delimiter — causing the rest of the
command to fall outside the pattern match and triggering a permission prompt.

```bash
# Bad — "irrelevant" balances the matcher's quote state, then "contains
# opens on this line and closes on the next, confusing the matcher
git commit -m "$(cat <<'EOF'
Fix "irrelevant" to "contains
  no metacharacters"
EOF
)"
```

Workaround: avoid double quotes in commit message heredocs. Use single quotes
or rephrase to keep quoted text on a single line.

```bash
# Good — single quotes avoid the matcher bug
git commit -m "$(cat <<'EOF'
Fix 'irrelevant' to 'contains no metacharacters'
EOF
)"

# Good — quoted text stays on one line
git commit -m "$(cat <<'EOF'
Fix "irrelevant" to "contains no metacharacters"
EOF
)"
```

### CI polling

`sleep && gh run view` loops create repeated permission prompts. Use `gh run watch`
(single command, pre-approved) instead.
