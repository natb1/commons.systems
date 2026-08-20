---
id: tactic-sandbox-config-lock-phantom-mount-blocks-git-config-writes
kind: tactic
statement: "The sandbox enforces read-only .git/config by bind-mounting BOTH
  config and config.lock read-only onto themselves — and because a bind mount
  must have an existing target, mounting config.lock CREATES it, so git's
  exclusive-create lock protocol always finds the lock already held and reports
  a permanent, intended denial as the transient error 'could not lock config
  file .git/config: File exists'; every git config write therefore fails
  repo-wide, EnterWorktree aborts and rolls back because git worktree add's
  upstream-tracking write is incidental collateral, and the residue presents as
  a 0-byte unowned lock file that invites an rm against a mount point"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-14 while opening a worktree to record an unrelated
  finding: EnterWorktree failed with 'error: could not lock config file
  .git/config: File exists / error: unable to write upstream branch
  configuration / [worktree-create] ERROR: unexpected error on line 150 (exit
  255)', and git worktree list confirmed no worktree was left behind — creation
  is rolled back, so the harness's standard isolation path is unusable. The
  stale-lock reading is wrong. /proc/self/mountinfo carries TWO read-only bind
  mounts here, config and config.lock, each mounted onto itself: '638 635 8:48
  .../.git/config.lock .../.git/config.lock ro,nosuid,nodev,relatime'. The
  config mount is the deliberate carve-out — .claude/settings.json grants
  allowWrite ['.git'] wholesale, and making config read-only claws back the one
  file inside that grant which could subvert the sandbox (core.hooksPath and
  friends). The defect is the ENFORCEMENT MECHANISM's side effect, not the
  policy: a bind mount requires its target to exist, so the sandbox materialises
  config.lock, and git acquires a config write lock by creating config.lock with
  O_CREAT|O_EXCL. It is always already there. Confirmed by direct probe rather
  than inference: 'git config --local sandboxprobe.value 1' emits 'could not
  lock config file .git/config: File exists' and writes nothing. So the denial
  is deterministic and permanent, never intermittent, and its diagnostic names
  the one cause it is not. Two consequences compound. (1) Misdiagnosis: the
  residue is a 0-byte r--r--r-- regular file with no holder and a fresh mtime —
  indistinguishable from a crashed git's leftover — so the reflex remedy is rm,
  which fails EBUSY/EPERM against a mount point and burns a diagnosis cycle. (2)
  Collateral scope: worktree-create.sh:150 runs 'git worktree add -b $BRANCH
  $NEW_PATH origin/main', and branching from a remote-tracking ref makes git
  auto-write branch.<name>.merge. That config write is incidental to the
  operation's purpose, yet it aborts the whole creation. Passing --no-track
  writes no config and succeeds, which is the workaround this session used to
  create its own worktree. This also explains two long-standing symptoms
  previously carried as folklore: 'git push -u' printing 'unable to write
  upstream branch configuration' while THE REF STILL LANDS (the push is a
  network op to an allowlisted host; only the follow-up config write failed, so
  the error reads like a failed push and invites a wasted retry), and 'git
  branch -D' warning 'update of config-file failed' while succeeding. It further
  falsifies checked-in doctrine: .claude/rules/sandbox.md:23-25 states git
  worktree add is 'Sandbox-safe only from a session whose own rw mount covers
  the destination — i.e. from the repo-root checkout', but it fails from the
  repo-root checkout too, for this unrelated reason. Distinct from
  tactic-sandbox-bare-allowlist-path-mismatch (phase null), whose root cause is
  an allowlist path resolving to the wrong directory so a write falls outside
  the grant: here the path is squarely INSIDE the grant and is denied by a
  carve-out mount, and the failure is a fabricated lock rather than a read-only
  filesystem error. No node on the graph mentions config.lock, and none covers
  the phantom-mount class at all — the sibling case of /dev/null mounted over
  config.worktree, which makes a worktree read as falsely dirty, is likewise
  unrecorded."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  first_seen: 2026-08-14
  measured_impact:
    - metric: sandboxed_git_config_write_success_rate
      value: 0
      unit: percent
      window: 2026-08-14 direct probe (git config --local sandboxprobe.value 1)
      sensor: align
      measured: 2026-08-14
    - metric: enterworktree_creation_failures
      value: 1
      unit: occurrences
      window: 2026-08-14 session opening a worktree to record a finding
      sensor: align
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time (first recorded occurrence)
      sensor: align
      measured: 2026-08-14
    - metric: checked_in_doctrine_statements_falsified
      value: 1
      unit: statements
      window: .claude/rules/sandbox.md:23-25
      sensor: align
      measured: 2026-08-14
---

# The sandbox fabricates a git config lock, then reports it as a stale one

Recorded 2026-08-14 as an ordinary draft tactic under the find-before-minting
discipline. A search of the whole open tactic set found **no** node mentioning
`config.lock`, and no node covering the phantom-mount class at all; the nearest
sibling is dispositioned in the rationale.

## What happened

Opening a worktree the ordinary way, to record an unrelated finding:

```
error: could not lock config file .git/config: File exists
error: unable to write upstream branch configuration
[worktree-create] ERROR: unexpected error on line 150 (exit 255)
```

`git worktree list` showed no new worktree — creation is rolled back. The
harness's standard isolation path was simply unavailable.

## The stale-lock reading is wrong

`.git/config.lock` presents as a 0-byte `r--r--r--` regular file with no holder
and a fresh mtime. That is exactly what a crashed git leaves behind, so the
reflex is to delete it. It is not leftover state. `/proc/self/mountinfo`
carries two read-only bind mounts, each onto itself:

```
… /home/n8/…/.git/config      /home/n8/…/.git/config      ro,nosuid,nodev,relatime
… /home/n8/…/.git/config.lock /home/n8/…/.git/config.lock ro,nosuid,nodev,relatime
```

`rm` against a mount point fails `EBUSY`/`EPERM`, so the reflex remedy costs a
diagnosis cycle and yields nothing.

## Where the seam is

**The policy is right and is not what this node disputes.**
`.claude/settings.json` grants `allowWrite: [".git"]` wholesale. `.git/config`
is the one file inside that grant which could subvert the sandbox itself — set
`core.hooksPath` and arbitrary code runs on the next git operation — so clawing
it back read-only is correct.

The defect is in **how** the carve-out is enforced. A bind mount requires an
existing target, so mounting `config.lock` **creates** it. Git acquires a config
write lock by creating `config.lock` with `O_CREAT|O_EXCL`. It is always already
there. Confirmed by direct probe rather than inference:

```
$ git config --local sandboxprobe.value 1
error: could not lock config file .git/config: File exists
$ git config --local --get sandboxprobe.value
(nothing — no write occurred)
```

So a **permanent, intended, deterministic** denial is reported as a
**transient, accidental** one. Had only `config` been mounted, the same write
would have been denied truthfully — a read-only-filesystem error naming the
real cause. The extra `config.lock` mount adds no protection that the `config`
mount does not already provide, and it is the sole source of the false
diagnostic.

| | what is true | what the error says |
|---|---|---|
| cause | sandbox policy carve-out | another process holds the lock |
| duration | permanent, every call | transient, retry later |
| remedy | `--no-track`, or don't write config | delete the stale lock |

## Collateral: worktree creation is incidental damage

`.claude/hooks/worktree-create.sh:150` runs

```
git worktree add -b "$BRANCH" "$NEW_PATH" origin/main
```

Branching from a remote-tracking ref makes git auto-write
`branch.<name>.merge`. That config write is **incidental** to what the command
is for — the checkout and the registration both succeed — yet it aborts and
rolls back the whole creation. Passing `--no-track` writes no config and
succeeds; that is how this session created its own worktree.

## It also explains two symptoms previously carried as folklore

- **`git push -u` prints `unable to write upstream branch configuration` — but
  the ref lands.** The push is a network op to an allowlisted host; only the
  follow-up config write failed. The message reads like a failed push, so the
  reflex is to retry or re-diagnose, both wasted. Confirm with `git ls-remote`
  before doing either.
- **`git branch -D` warns `update of config-file failed` while succeeding.**
  Only the tracking-config cleanup failed.

## It falsifies checked-in doctrine

`.claude/rules/sandbox.md:23-25` states that `git worktree add` is

> "Sandbox-safe only from a session whose own rw mount covers the destination —
> i.e. from the repo-root checkout."

It fails from the repo-root checkout too, for a reason unrelated to mount
coverage. A fix must correct that passage, not merely add a new one beside it.

## Scope of a fix

- **`worktree-create.sh:150`** — pass `--no-track` so worktree creation writes
  no config. This is the one-line change that restores `EnterWorktree`.
  Note the hook lives under `.claude/hooks/`, itself a read-only carve-out, so
  the edit needs the usual override and its own test run
  (`.claude/hooks/test-worktree-remove.sh` and siblings — a hook change runs
  **all** hook test suites).
- **`.claude/rules/sandbox.md`** — correct the `git worktree add` claim at
  :23-25 and document the phantom-lock class alongside the existing `/dev/null`
  over `config.worktree` note.
- **Upstream-facing observation, not ours to land:** the mount set is produced
  by the harness, not by this repo's config. Dropping the `config.lock` mount
  while keeping the `config` mount would preserve the policy exactly and
  restore a truthful error. Worth reporting rather than working around
  indefinitely.

## Honest limit on the evidence

The probe establishes that config writes fail and that the mounts exist. It
does **not** establish that the harness *intends* the `config.lock` mount as
policy rather than as an artifact of how the carve-out list is expanded — the
mount set was read, not its generator. The remedy above is therefore stated as
a report upstream, not as a defect claim against a specific harness line.
