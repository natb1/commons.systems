# Sandbox

Sandbox mode restricts writes to `.bare/`, causing git index operations to fail inside worktrees:

```
fatal: Unable to create '.bare/worktrees/<branch>/index.lock': Read-only file system
```

Use `dangerouslyDisableSandbox: true` on Bash calls that write to the git index: `git add`, `git commit`, `git merge`, `git checkout`, `git rebase`, `git push`.

Read-only git ops (`git log`, `git diff`, `git status`, `git show`) work without disabling sandbox.

## npm cache writes

`npx` downloads packages to `~/.npm/_cacache/`, which sandbox blocks:

```
EROFS: read-only file system, open '/home/n8/.npm/_cacache/tmp/...'
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
