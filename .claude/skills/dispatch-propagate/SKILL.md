---
name: dispatch-propagate
description: Autonomous dispatch chain router — selects the next task, resolves its worktree, and spawns a /dispatch-worker to run one phase, throttled by the concurrency-cap gate. The user-typed /dispatch is a thin shim that runs these instructions with the gate bypassed.
---

# Dispatch (propagate)

The dispatch chain router. Each `/dispatch-propagate` is a `claude --bg`
background job rooted in `worktrees/main`: it selects the single most pressing
task, resolves its worktree, spawns a `/dispatch-worker <N>` background job to
run one phase there, and exits. The worker runs that phase, then spawns a fresh
router and self-deletes (see reference.md *Chain mechanics*). The router runs no
phase skill itself.

`/dispatch-propagate` takes an **optional issue-or-PR-number argument** (leading
`#` optional). With an argument it targets that issue and skips the queue scan;
a PR number resolves to the issue that PR closes.

A tick is two scripted orchestrator calls with one model-decision seam between
them:

1. `dispatch-select-tick` — acquires the lock, syncs `main`, runs the JIT
   engine and the Calendar JIT importer, and selects the target. Emits one
   **decision line**.
2. The model routes on that line (Table 1). Only three outcomes need the model:
   a `main-broken` / `jit-reminder` sub-skill invocation, or — for a real
   target — a call to `dispatch-materialize-spawn`.
3. `dispatch-materialize-spawn` — runs the explicit-path guards, resolves the
   worktree, merges `origin/main` into it (so the worker reads up-to-date skill
   files), writes the recovery marker, gates on CI and the concurrency budget,
   spawns the worker, and releases the lock after the worker registers (#945).
   Emits one **terminal token** (Table 2). A merge conflict is handed back for an
   auto-resolve attempt (§2a), not parked by the script.

Run `/dispatch-propagate` from any worktree; selection ignores cwd. The router
never enters a worktree. Run **every** Bash call here with
`dangerouslyDisableSandbox: true` — the orchestrators call `gh`, query the
Claude daemon over a Unix socket, and write tmp state (see
`.claude/rules/sandbox.md`).

## 1. Select the target

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-select-tick [<issue-or-PR-number>]
```

Run with `dangerouslyDisableSandbox: true` **and** `timeout: 600000` (ms) — the
script's lock acquisition uses `--wait`, which blocks on contention up to
`DISPATCH_LOCK_WAIT_TIMEOUT` (default 300 s), exceeding the default Bash
timeout.

The script passes through any JIT `created`/`skipped`/`debounced` lines
(prefixed `jit: `) and any Calendar importer `calendar: ...` lines, then prints
the decision as its **last** line. Report any `jit:` and `calendar:` lines, then
route on the decision (Table 1).

The **lock disposition is the script's responsibility**: it holds the lock on
the four target lines plus `main-broken`/`jit-reminder`, releases it on
`empty`/`sync-failed`/`resolver-failed`, and never touches it on `busy`. The
model never releases the lock for a select-tick outcome.

### Table 1 — routing the select-tick decision line

| Decision line | Do this | Disposition |
|---|---|---|
| `busy` | The wait timeout elapsed — another tick holds the lock. The script's **stderr** names the elapsed time and the holding sessionId; report them (mandatory — a silent stop would hide the wedge). | `notify busy-lock-timeout` |
| `sync-failed` | `git fetch` / `merge --ff-only` failed on `main`; report the error. | `notify sync-failed` |
| `resolver-failed` | The explicit argument did not resolve to one issue; report the script's stderr. | `notify resolver-failed` |
| `empty` | Nothing eligible. Report verbatim: "queue empty — closing; the office-hours queue or a new issue will re-seed the chain". | `drain empty-queue` |
| `main-broken <sha>` | Invoke `/dispatch-diagnose-main <sha>` — it enumerates the failing checks, fetches logs, summarizes the likely cause, and releases the lock itself. | `notify main-broken` |
| `jit-reminder <repo> <num> <project> <item-id>` | Invoke `/dispatch-jit-reminder <repo> <num> <project> <item-id>`. The sub-skill claims the item, releases the lock, summarizes for the user, and stops the tick — a terminal-disposition bypass. | **Stop here**: no materialize-spawn, no self-close |
| `explicit <num>` | `dispatch-materialize-spawn <num> explicit` | route on Table 2 |
| `pr <num> <branch> <phase>` | Set `N=${branch%%-*}` (the issue the PR closes — never the PR `<num>`), then `dispatch-materialize-spawn <N> queue` | route on Table 2 |
| `issue <num>` | `dispatch-materialize-spawn <num> queue` | route on Table 2 |

For a `busy` stop, recommend the user verify the recorded holder is still live:

    claude agents --json | jq '.[] | select(.sessionId == "<holder>")'

## 2. Materialize and spawn

For a real target, call (with `dangerouslyDisableSandbox: true`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-materialize-spawn <N> <explicit|queue>
```

`<N>` is always the **issue** number (for a `pr` row, the branch-prefix `N`
derived above — never the PR number). The script prints supporting detail (a
path, a blocker list, the CI line) and the **terminal token** as its last line.
The lock disposition is again the script's responsibility — it releases the lock
at every stop, and on the proceed path only after the spawned worker has
registered (#945), so the next tick cannot re-select during the boot gap. Route
on the token (Table 2).

### Table 2 — routing the materialize-spawn terminal token

| Terminal token | User-visible report (the model emits it) | Disposition |
|---|---|---|
| `propagate` | none — the chain moved forward silently | `propagate` |
| `notify target-blocked` | The named target is closed or has an open blocker (the script printed which and already applied `dispatch:office-hours` to the issue). | `notify` |
| `resolve merge-conflict` | `origin/main` does not merge cleanly into the resolved worktree; `dispatch-merge-main` aborted the merge (tree left clean) and the script printed `issue:` / `worktree:` / `mode:` detail. Run the auto-resolve attempt (§2a). | `propagate` (resolved, after re-spawn) or `notify` (ambiguous) |
| `notify spawn-failed` | `dispatch-spawn-worker` exited non-zero — a worker was spawned but did not register. | `notify` |
| `drain worktree-conflict` | The target worktree cannot be safely entered (the script printed the `path:` detail): "worktree at `<path>` for issue `<N>` cannot be entered; closing — the next baton-pass or office-hours hand-off will re-seed". | `drain` |
| `drain ci-waiting` | The target PR's CI is still in progress (the script printed the `#<N>:` line); echo it. | `drain` |
| `drain concurrency-cap` | The live worker count already meets the budget; a cap-keyed re-seed is scheduled (see reference.md *The #725 cap-keyed re-seed*). | `drain` |

## 2a. Auto-resolve a merge conflict (before parking)

The `resolve merge-conflict` token means `dispatch-merge-main` found
`origin/main` does not merge cleanly into the resolved worktree and aborted the
merge, leaving the tree clean. Attempt an `opus`-subagent auto-resolve before
parking. The script printed `issue: <N>`, `worktree: <path>`, and `mode: <explicit|queue>`
— use them. Run every Bash call here with `dangerouslyDisableSandbox: true`.

1. Reproduce the conflict: `git -C <worktree> merge origin/main` (re-creates the
   markers `dispatch-merge-main` aborted; a non-zero exit is expected).
2. Gather context for the subagent: the conflicting hunks (the conflicted files /
   `git -C <worktree> diff`), both sides' commit messages (`git -C <worktree> log`
   on `HEAD` and on `origin/main` since their merge-base), the PR description if
   one exists (`dispatch-find-pr <N>` → `gh pr view`; there may be none in the
   `implement` phase), and the issue body (`gh issue view <N>`, or
   `CLAUDE.local.md`).
3. Launch an `opus` subagent (Agent tool, `model: opus`) with that context and an
   explicit two-state output contract — it must end its reply with exactly one of:
   - `resolved` — it removed all conflict markers, saved the files, and left a
     clean working-tree resolution.
   - `ambiguous <reason>` — the conflict needs human judgment; it made **no**
     edits. `<reason>` is a one-line explanation.
   Judgment criteria stay informal — the subagent's own call given the full
   context, not a codified rule list.
4. Route on the verdict:
   - **`resolved`** → `git -C <worktree> commit --no-edit` (completes the merge
     commit locally; no push — consistent with `dispatch-merge-main`'s local-only
     contract), then re-run `dispatch-materialize-spawn <N> <mode>` (using the
     `issue:` and `mode:` values printed above) and route on its Table-2
     token. It now sails through: `dispatch-merge-main` returns up-to-date →
     `propagate`.
   - **`ambiguous <reason>`** → `git -C <worktree> merge --abort` (restore the
     clean tree), `dispatch-apply-office-hours <N> "<reason>"`, then apply the
     `notify merge-conflict` disposition (§3): report the variance and do **not**
     self-close. This is #944's escalation, now triggered on the ambiguous
     verdict; the worker is never spawned into a conflicted tree.

## 3. Terminal disposition

The tick ends with one of three disposition **kinds**. The **only** silent path
is `propagate`; every other disposition emits a user-visible report first (a
silent `notify` or `drain` is a defect).

- **`propagate`** — the chain advanced. Self-close
  (`dangerouslyDisableSandbox: true`):

      .claude/skills/dispatch-propagate/scripts/dispatch-self-close

- **`notify <reason>`** — report the variance, then **do not self-close**. The
  session stays in `claude agents` until the user closes it, so the variance is
  visible rather than buried in a closed transcript. For `notify target-blocked`
  the script already parked the issue with `dispatch:office-hours`;
  `notify merge-conflict` is reached via §2a's ambiguous branch, where the agent
  applied `dispatch:office-hours` before this disposition.

- **`drain <reason>`** — emit the mandatory report, then self-close (same
  command as `propagate`).

`dispatch-self-close` removes the managed background job by job-id; it is a
no-op when `CLAUDE_JOB_DIR` is unset (interactive session), so an interactive
`/dispatch-propagate` reaching a terminal disposition does not stop the user's
conversation.

The `jit-reminder` outcome (Table 1) does not reach this section — the sub-skill
stops the tick directly. The router does **not** spawn a successor itself; the
worker's Stop hook (`.claude/hooks/dispatch-stop.sh`) spawns a fresh router back
in `worktrees/main` when the worker session ends.

Deep "why" — chain mechanics, the lock's two scopes and marker-based reclaim,
the selection ladder, the Step-5 marker, the spawn-cwd trade-off, concurrency
budgeting, and the #725 cap-keyed re-seed — lives in reference.md.
