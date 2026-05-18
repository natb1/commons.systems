# Sandbox

Two paths are in the sandbox write-allowlist — `sandbox.filesystem.allowWrite`
in `.claude/settings.json` — both relative to a worktree's project root:

- `../../.bare` — the shared git common dir (index, objects, refs, and worktree
  registrations under `.bare/worktrees/`).
- `../../worktrees` — the worktree checkouts themselves. `git worktree remove`
  deletes a worktree's *working directory* in addition to its `.bare/`
  registration, so the container of all worktrees must be writable too.

So git operations work **without** `dangerouslyDisableSandbox`: `git add`,
`git commit`, `git merge`, `git checkout`, `git rebase`, and
`git worktree add`/`remove`. `git push` / `git fetch` work sandboxed too — the
`origin` remote is HTTPS to `github.com`, an allowlisted host.

If either entry is missing, the matching write fails read-only — e.g.
`Unable to create '.bare/worktrees/<branch>/index.lock': Read-only file system`
on a commit, or `failed to delete '.../worktrees/<branch>': Read-only file
system` from `git worktree remove`.

## gh CLI (GitHub API)

`gh` uses the macOS Security framework for TLS certificate validation, which sandbox blocks:

```
tls: failed to verify certificate: x509: OSStatus -26276
```

Use `dangerouslyDisableSandbox: true` on **all** Bash calls that invoke `gh` directly or via scripts
(e.g., `issue-state-read`, `issue-state-write`, `post-pr-comment.sh`). Apply this from the start —
do not wait for a TLS error before setting it.

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
- `npx vitest run --root print` (vitest `--root` flag)
- For tests, deploys, QA: use the wrapper scripts which handle directory context

### `git -C /path` is auto-approved for worktrees

`git -C <path>` is auto-approved by the PreToolUse hook when the path resolves
to a directory under the worktrees root and the git subcommand is permitted by
`settings.json`. Paths outside the worktrees directory are rejected.

### Avoid inline env var prefixes

`VAR=value command` breaks prefix matching.

```bash
# Bad — breaks allowedTools matching
VITE_GITHUB_BRANCH="75-prototype-print-viewer" npm run build --prefix print

# Good — use wrapper scripts that set env vars internally
.claude/skills/ref-pr-workflow/scripts/run-qa-server.sh print
.claude/skills/ref-pr-workflow/scripts/run-preview-deploy.sh print pr-146
.claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh print
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
