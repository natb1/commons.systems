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

A command that fails loudly under the sandbox — TLS error, `EROFS`,
`Read-only file system` — should be **retried** with
`dangerouslyDisableSandbox: true`, never run with it pre-emptively: an
always-on override carries no signal. The sections below are the known
exceptions — read them first, since a few must be pre-emptive because the first
sandboxed attempt already does damage (`git worktree remove`, `graph-commit`) or
fails silently with nothing to retry on (`claude agents --json`). Two former entries — `gh`
TLS failure and npm-cache `EROFS` — were deleted as **refuted on this host**
(measured); prose elsewhere still citing either as a reason to pre-empt the
override is stale.

## Tree-updating git ops touching read-only paths

`git merge`, `git checkout`, `git rebase`, `git reset`, and `git worktree remove`
update the working tree **non-transactionally** — file by file, aborting on the
first failure. Against the read-only `denyWithinAllow` carve-outs
(`.claude/skills/`, `.claude/hooks/`, the other `.claude/` config paths) such an
op writes the writable files, aborts, and leaves HEAD unmoved — so the written
files are left modified-but-uncommitted, indistinguishable from a stray manual
edit:

```
error: unable to unlink old '.claude/skills/...': Read-only file system
error: failed to delete '.../tactic-...': Read-only file system
error: failed to delete '.git/worktrees/tactic-...': Device or resource busy
```

(`Device or resource busy`: the sandbox overlays `/dev/null` onto
`.git/worktrees/<name>/config.worktree`, and a mount point cannot be unlinked.)

**Such ops must run with `dangerouslyDisableSandbox: true`** — set on the
**first** attempt, because a half-deleted worktree cannot be recovered by
retrying: the retry fails `'.../.git' is not a .git file, error code 7`, the
first attempt having destroyed the file the second validates against. Recover a
half-deleted worktree with `rm -rf <path>` then `git worktree prune`.

The main-checkout sync lives in code — run `sync_main_checkout` (`lib.sh`)
rather than hand-running the git command; its header carries the requirement,
and `dispatch-select-tick` is its canonical caller.

**Worktree removal has no wrapper script — use the built-in tooling.**
`ExitWorktree`, session-exit cleanup, and `git worktree remove <abs path>` are
the removal paths. Anything routed through the `WorktreeRemove` hook
(`.claude/hooks/worktree-remove.sh`, registered in `.claude/settings.json`)
recovers a torn removal on its own: it separates a removal git **refused**
(checkout intact — kept, and safe to retry) from a **torn** one (checkout partly
destroyed — unrecoverable by retry), and repairs the torn case in place with
`rm -rf` + `git worktree prune`. A **hand-run** `git worktree remove` gets none
of that, so apply the recovery in the paragraph above yourself if it tears.

There was a `remove-worktree` wrapper under
`.claude/skills/dispatch-propagate/scripts/` until 2026-08-29. It was deleted:
nothing ever called it, and its content safety gate compared the branch against
`origin/main` **symmetrically**, so a branch merely far *behind* main read as
carrying unlanded work and could not be removed at all. The live reap path
(`lib-session-reap.sh`) never had that bug — it checks `rev-list --count
origin/main..HEAD` first and skips the content diff when the branch is an
ancestor.

## graph-commit

`graph-commit` lands a node edit by rebasing it onto an `intentions/`-only base.
That internal rebase is exactly a tree-updating git op of the kind the previous
section describes, wearing a wrapper — so it meets the same read-only carve-outs
and aborts the same way. Measured 2026-08-30:

```
error: unable to unlink old '.claude/skills/align-audit/SKILL.md': Read-only file system
```

The failure is not what makes this an exception; plenty of commands fail loudly
and are fine to retry. What makes it one is that the aborted rebase **reverted
the uncommitted node edit in the working tree**. There is nothing left to retry
on — the edit a second attempt would land no longer exists. That is the same
criterion `git worktree remove` meets one section up: the first sandboxed
attempt has already done the damage, so a retry cannot be the recovery.

**Run `graph-commit` with `dangerouslyDisableSandbox: true` on the first
attempt.** The cost of getting this wrong is re-authoring a reverted node body
from memory, and the tree no longer holds a copy to recover it from.

Keep the `-m` message **single-line**. A multi-line message wants a
`$(cat <file>)` substitution, and the worktree-isolation guard refuses any
command containing command substitution — measured: a bare `echo hello $(date
+%Y)` draws "this command is too complex to verify that it stays inside the
worktree". Put the long rationale in the node body, which is where a reader
looks for it anyway.

## npx tsx

`npx tsx <script>` dies under the sandbox before it runs anything:

```
Error: listen EPERM: operation not permitted /tmp/claude-1000/tsx-1000/17.pipe
    at createIpcServer (.../node_modules/tsx/dist/cli.mjs:53:31515)
```

The `tsx` CLI wrapper opens an IPC socket at startup, which the sandbox's
network-namespace isolation denies. It throws in `createIpcServer`, before the
wrapper parses its arguments, so the failure is a property of the spelling and
not of the script — every `npx tsx` invocation dies identically.

Spell it `node --import tsx/esm <script>` instead. That loads the same tsx ESM
loader in-process and opens no socket. Measured 2026-08-30 against
`validate-graph.ts`: unsandboxed the two spellings produce identical output and
the same exit code, and sandboxed the `node --import` form still produces it
while `npx tsx` never reaches the script at all.

This is not a workaround to reach for once `npx tsx` has failed — it is the
better spelling outright, and it **removes** a `dangerouslyDisableSandbox`
requirement rather than working around one. `npx tsx` can only run with the
override, which costs a permission-classifier round trip on every call and
spends the signal an override is meant to carry. `node --import tsx/esm` needs
neither.

**The repo is mixed, and no sweep has been done.** Measured 2026-08-30 under
`packages/intentionsutil/scripts/`: 40 files carry `node --import tsx/esm`, 32
still carry `npx tsx`. Under `intentions/` the stale form leads, 107 node bodies
to 59. Expect to meet `npx tsx` and translate it rather than assuming the file
is wrong about something else.

What one PR corrected was four *call sites in tool documentation*, not four
headers: the `Usage:` headers of `write-node.ts`, `dump-node.ts` and
`validate-graph.ts`, plus a single in-body citation in `read-sensors.ts` whose
own header was already correct. Sibling tools such as `merge-node.ts` and
`graph-commit` document the working spelling too. So do not read "the tool
headers are fixed" as a guarantee — check the one in front of you.

The practical consequence: when a verification fence goes red with `listen
EPERM`, this is the cause, and the repair is the fence's spelling, not the
script it invokes.

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
are auto-approved; write/execute commands are not — `cd /path && command` still
misses rules like `Bash(npx vitest:*)`. Use a directory flag instead:
`npm run build --prefix print`.

For app vitest suites, root at the worktree/repo root and select the app with
`--project`: `npx vitest run --project <app> --root <repo_root>`, or from a
worktree root `npx vitest run --project print --root .`. Rooting at the app dir
(`--root print`) scopes vite's `server.fs.allow` to `print/`, so root-hoisted
`?url` asset imports (`pdfjs-dist`'s worker, hoisted to the root `node_modules`
by npm workspaces) are denied and correct changes false-fail. The repo-root form
is what CI's `run-unit-tests.sh` runs, is what plan-verification (```verify```)
blocks should use, and `Bash(npx vitest:*)` already matches it.

### `git -C /path` is auto-approved for worktrees

Only outside a worktree-isolated session, where the PreToolUse hook approves it
— and there only for paths under the worktrees root, and only for subcommands
`settings.json` permits. From a
**worktree-isolated session every `git -C` to a path other than its own worktree
is refused** — including a sanctioned sibling under `.claude/worktrees/`:

```
This session is isolated in the worktree .../<A>, but this command redirects
git to the shared checkout via -C. Refusing to run it
```

That is a Claude Code built-in, an earlier gate than the PreToolUse hook, so the
hook's approval never reaches it. It keys on the **`-C` flag**, not on where the
flag points — relocating a scratch checkout under `.claude/worktrees/` changes
nothing, and it says "the shared checkout" even for a sibling worktree. A second
variant refuses compound commands as too complex to verify; break those into
plain separate commands.

What works instead: `git worktree list` / `git worktree remove <abs path>` (path
argument, not a redirect); `git show origin/main:<path>` for committed state;
`cmp`, `git hash-object <abs path>`, `grep` against a foreign checkout; a target
worktree's own scripts by absolute path — but those scripts no longer infer the
tree from their own location. `dump-node.ts` and `write-node.ts` require
`--dir <abs intentions path>`, `validate-graph.ts` requires the store as a
positional argument, and `clear-park` requires `-C <abs repo root>`; each exits
non-zero with a usage error when the argument is omitted. Invoking one by
absolute path alone no longer targets that worktree — pass the path explicitly.

**`graph-commit` is the exception to that list**: it is not `git`, so it is not
refused — and it *requires* the `-C`. It resolves the repo root from `-C`/`--repo`
(else **cwd**), never from its own location
(`packages/intentionsutil/scripts/graph-commit:38`). Always pass an explicit
`-C <path>` — without it you commit your own cwd's checkout, and if that one holds
the node unchanged it exits 0 as "a 'landed' that landed nothing".

Getting the command matcher-shaped is necessary but not sufficient — there are
two distinct approval gates. The static `allowedTools` prefix matcher is the
first; the auto-mode permission classifier, a separate probabilistic gate, fires
only when no static rule matches. Only a static `permissions.allow` rule resolves
at step 1 and skips the classifier — a PreToolUse hook `allow`, including
`approve-workflow-commands.sh`'s own approvals, does not. Consequently the allow
rule must be a prefix of the literal command string as typed, so each sanctioned
script gets exactly one canonical agent-typed spelling: repo-relative,
never `"$VAR/…"`, never absolute, never a `cd &&` compound. Both
`graph-commit` and `land-align-round` are in `permissions.allow` at that path
prefix — re-spelling a call site silently re-exposes it to the classifier.

Those entries match the **path only**. They are bare prefixes —
`Bash(packages/intentionsutil/scripts/graph-commit:*)` — whose trailing `:*`
matches any argument string, so the matcher never inspects the flags. `-C
<path>` is required by `graph-commit`'s own contract (it resolves its repo root
from `-C`/`--repo`, else **cwd** — see above), not by the permission gate, and
nothing mechanical rejects a call that omits it. `land-align-round` is the
standing proof: it carries the same allow entry and its documented call sites
pass no `-C` at all, so they silently target cwd. This was
observed live on 2026-07-21: a worktree-cwd compound — `cd` into the worktree,
then invoke `graph-commit` joined with `&&` — was firmly denied ("Blocked by
classifier"), and bare invocations drew transient "Stage 2 classifier error"
denials that cleared only on retry. The static allow removes
per-call classifier gating on the sole main-landing path; that's accepted
deliberately because `graph-commit`'s own `--base` compare-and-swap, bounded
rebase-retry, and landing lock — not per-call approval — are what keep it safe.

### Avoid inline env var prefixes

`VAR=value command` breaks prefix matching. Use wrapper scripts that set the env
vars internally, e.g.
`.claude/skills/dispatch-propagate/scripts/run-qa-server.sh print`.

### Avoid double quotes spanning newlines in heredoc commit messages

The `allowedTools` glob matcher does naive quote-tracking: in a heredoc commit
body, a balanced `"..."` pair followed by another `"` that opens on one line and
closes on the next makes it misread that closing `"` as ending the command
delimiter, so the rest falls outside the pattern and prompts. Use single quotes,
or keep any double-quoted text on one line.

### CI polling

`sleep && gh run view` loops create repeated permission prompts. Use `gh run watch`
(single command, pre-approved) instead.
