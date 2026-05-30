# Sandbox

Two paths are in the sandbox write-allowlist — `sandbox.filesystem.allowWrite`
in `.claude/settings.json` — both relative to a worktree's project root:

- `../../.bare` — the shared git common dir (index, objects, refs, and worktree
  registrations under `.bare/worktrees/`).
- `../../worktrees` — the worktree checkouts themselves. `git worktree remove`
  deletes a worktree's *working directory* in addition to its `.bare/`
  registration, so the container of all worktrees must be writable too.

Most git operations work **without** `dangerouslyDisableSandbox`:

- `git add` / `git commit` — write to the index and objects under the writable `../../.bare` common dir.
- `git worktree add` / `git worktree remove` — operate on the writable `../../worktrees` container and `../../.bare`.
- `git push` / `git fetch` — use HTTPS to `github.com`, an allowlisted host.

Tree-updating ops (`merge`, `checkout`, `rebase`, `reset`) require care — see the next section.

If either allowlisted entry is missing, the matching write fails read-only — e.g.
`Unable to create '.bare/worktrees/<branch>/index.lock': Read-only file system`
on a commit, or `failed to delete '.../worktrees/<branch>': Read-only file
system` from `git worktree remove`.

## Tree-updating git ops touching read-only paths

`git merge`, `git checkout`, `git rebase`, and `git reset` update the working tree
**non-transactionally**: they write files one at a time and abort on the first
failure. When such an op touches files under the sandbox's read-only
`denyWithinAllow` carve-out paths — `.claude/skills/`, `config/`, and `.git`
(read-only even on the `main` worktree) — it:

1. Writes the writable files successfully.
2. Aborts with an error like:

```
error: unable to unlink old '.claude/skills/...': Read-only file system
```

3. Leaves HEAD unmoved.

The result: the already-written writable files are left modified-but-uncommitted,
indistinguishable from a stray manual edit.

**Such ops must run with `dangerouslyDisableSandbox: true`.**

Canonical case: `/dispatch-propagate` Step 1 runs
`git fetch origin main && git merge --ff-only origin/main` on the `main` worktree.
`origin/main` frequently carries `.claude/skills/**` changes (the dispatch skills
are actively developed), so this sync routinely hits the hazard. It must run with
`dangerouslyDisableSandbox: true`.

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
for the `budget-etl` skill):

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
