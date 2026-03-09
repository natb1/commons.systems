# Sandbox

Sandbox mode restricts writes to `.bare/`, causing git index operations to fail inside worktrees:

```
fatal: Unable to create '.bare/worktrees/<branch>/index.lock': Read-only file system
```

Use `dangerouslyDisableSandbox: true` on Bash calls that write to the git index: `git add`, `git commit`, `git merge`, `git checkout`, `git rebase`, `git push`.

Read-only git ops (`git log`, `git diff`, `git status`, `git show`) work without disabling sandbox.

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

### Avoid `cd && command`

`cd /path && command` doesn't match rules like `Bash(npx vitest:*)`.

Use flags that accept a directory instead:
- `npm run build --prefix print` (npm `--prefix` flag)
- `npm ci --prefix print`
- `npx vitest run --root print` (vitest `--root` flag)
- For tests, deploys, QA: use the wrapper scripts which handle directory context

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

### CI polling

`sleep && gh run view` loops create repeated permission prompts. Use `gh run watch`
(single command, pre-approved) instead.
