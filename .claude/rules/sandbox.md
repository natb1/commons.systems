# Sandbox

Sandbox mode restricts writes to `.bare/`, causing git index operations to fail inside worktrees:

```
fatal: Unable to create '.bare/worktrees/<branch>/index.lock': Read-only file system
```

Use `dangerouslyDisableSandbox: true` on Bash calls that write to the git index: `git add`, `git commit`, `git merge`, `git checkout`, `git rebase`, `git push`.

Read-only git ops (`git log`, `git diff`, `git status`, `git show`) work without disabling sandbox.
