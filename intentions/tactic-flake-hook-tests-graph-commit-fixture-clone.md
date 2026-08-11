---
id: tactic-flake-hook-tests-graph-commit-fixture-clone
kind: tactic
statement: Make test-graph-commit.sh's fixture setup fail loudly so a transient
  git clone failure reports one clear error instead of cascading into 11
  misleading test failures
owner: ai
status: raw
parent: null
rationale: "Found by the 2026-08-11 rsi iteration while driving
  tactic-pause-disables-merge-lane through qa. A transient git clone failure
  while building fixture writer-B's clone was swallowed silently — make_clone
  (packages/intentionsutil/scripts/test-graph-commit.sh:372) does not check git
  clone's exit status, and the harness runs under `set -uo pipefail` with no -e
  (:261). Every later case needing that clone then hit run_gc's `cd \"$clone\"
  || exit 99` and was counted as a product failure: 73 passed, 11 failed, and
  not one failure line named the actual cause. The mis-signal is the cost.
  /fix-checks had to spend a full ~45-minute session to conclude 'flake', and
  its fix commit 74548a2b is a bare merge of origin/main with no code change — a
  whole session plus a 23-check CI re-run to retry a clone. The harness already
  sets the opposite precedent one screen earlier: mktemp is guarded `|| { echo
  ...; exit 1; }` at :273. This extends that existing convention to the rest of
  the fixture bootstrap rather than introducing a new one."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Make test-graph-commit.sh's fixture setup fail loudly so a transient git clone failure reports one clear error instead of cascading into 11 misleading test failures

Fingerprint: hook-tests — packages/intentionsutil/scripts/test-graph-commit.sh:372

Reproduce command: `packages/intentionsutil/scripts/test-graph-commit.sh`
(the `hook-tests` CI job's "Run graph-commit tests" step runs this file directly).

Failure excerpt (CI, PR #3068, run 31504662056, head c20803c0):

```
fatal: failed to copy file to '/tmp/tmp.pbvenvDbDF/b/.git/objects/71/33b6de5618621748fd248b88c808410a00bc6a': No such file or directory
fatal: cannot change to '/tmp/tmp.pbvenvDbDF/b': No such file or directory
FAIL: non-overlapping merge (rcA=0 rcB=99)
FAIL: overlap conflict handling (rc=99)
FAIL: overlap snapshot preservation (snap='')
...
passed: 73  failed: 11
```

recurred on PR #3068 / run https://github.com/natb1/commons.systems/actions/runs/31504662056

Confirmed transient: the immediately following run on 74548a2b — whose only
diff from the failing head is a merge of origin/main, no code change — passed
all 23 checks.

## Context

Two separable defects produced this failure, and they want different remedies.

1. **The trigger** — `git clone` of the scratch bare origin into writer-B's
   clone failed partway through copying the object database. This is a runner
   filesystem hiccup against ephemeral `mktemp -d` scratch state, not a
   property of the code under test.
2. **The cascade — the real defect.** The failure was invisible. The harness
   continued for another ~27 seconds producing 11 FAIL lines, none of which
   named a missing clone. Anyone reading the CI output (human, `/fix-checks`,
   or the flake classifier) sees eleven independent-looking failures in
   graph-commit's merge, conflict, prune and parking behavior — the exact
   symptoms of a real regression in the script under test.

The cost is attributable and large: one full `/fix-checks` session that
produced no code change, plus a complete 23-check CI re-run. That is why this
node serves strategy-token-economy — the same reasoning as the sibling
tactic-flake-unit-tests-select-tick.

A note on doctrine, because Unit 2 sits near a rule: `.claude/rules/code-style.md`
says to prefer clear errors over defensive fallbacks. The anti-pattern it names
is *burying* a failure behind a silent default. Unit 1 is squarely that rule
applied — it converts a buried failure into a clear error. Unit 2's bounded
retry does not bury anything: it announces the retry on stderr and still dies
loudly with Unit 1's message if the retry also fails. It is scoped to a
known-transient infrastructure operation on throwaway scratch state, never to
business logic.

## Unit 1 — Fail loudly on fixture setup

**Recommended model: sonnet.** Small, mechanical, fully specified shell change
in one file, with an in-file precedent to copy.

### Scope

File: `packages/intentionsutil/scripts/test-graph-commit.sh`.

The harness deliberately does not run under `set -e` (`:261` is
`set -uo pipefail`) because it must run every case and tally failures. That is
correct for *cases* and wrong for *fixture setup*: a setup failure is not a test
result and must abort the run.

Add an explicit exit-status check that aborts the whole run with a single
diagnostic naming fixture setup, at each of these unguarded sites:

- `:372` — `git clone -q "$ORIGIN" "$1"` inside `make_clone`, plus the two
  `git -C "$1" config …` calls that follow at `:373-374`. Guarding `make_clone`
  itself covers every caller: writer-A (`:376`), writer-B (`:377`), and the
  mid-suite clones such as `W53` (`:2265`).
- `:286` — `git init -q --bare "$ORIGIN"`, and the `git -C "$ORIGIN"`
  `symbolic-ref` / `config` calls at `:287`, `:293-294`.
- `:296-300` and `:367-368` — the `$SEED` repo bootstrap: `mkdir -p`,
  `git init`, `config`, `git add -A`, `git commit -qm seed`, and
  `git -C "$SEED" push -q origin main`.

The diagnostic must name the operation and the destination, e.g.
`error: fixture setup failed: git clone "$ORIGIN" -> "$1"`, and exit non-zero
immediately. Use `exit 1`, matching the `mktemp` and `setsid` guards — not
`exit 99`, which is `run_gc`'s per-case sentinel and would be read as a case
result.

**Out of scope:** any change to graph-commit itself; the `set -uo pipefail`
line at `:261` (do not add `-e` — it would abort the run on the first genuine
FAIL and destroy the tally); the per-case `|| exit 99` guards at `:755`,
`:827`, `:1434`, `:1453`, which are correct as they stand.

### Reuse

Copy the guard form already used in this file — do not invent a new one:

- `packages/intentionsutil/scripts/test-graph-commit.sh:273` —
  `WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }`
- `packages/intentionsutil/scripts/test-graph-commit.sh:271` —
  `command -v setsid >/dev/null || { echo "error: setsid not found …" >&2; exit 1; }`

A small `setup_or_die() { "$@" || { echo "error: fixture setup failed: $*" >&2; exit 1; }; }`
helper defined next to those guards is acceptable and preferable to repeating
the idiom at a dozen sites.

## Unit 2 — Retry the fixture clone once, still loudly

**Recommended model: sonnet.** Same file, same idiom, few lines.

**Dependencies:** Unit 1 must land first — Unit 2 falls through to Unit 1's
abort path when the retry fails, and has no defined failure behavior without it.

### Scope

File: `packages/intentionsutil/scripts/test-graph-commit.sh`, `make_clone` at
`:370-374` only.

Wrap the `git clone` in a bounded single retry: on first failure, remove any
partial destination directory (`rm -rf "$1"`), print
`warning: fixture clone failed, retrying once: <dst>` to stderr, and try once
more. If the second attempt fails, fall through to Unit 1's abort. Do not loop,
do not sleep-and-poll, do not retry any other setup operation.

The partial-directory cleanup matters: the observed failure left
`/tmp/tmp.pbvenvDbDF/b` in a state where `.git/objects/…` was missing, so a
retry into the existing directory would fail differently.

**Out of scope:** retrying test cases, graph-commit invocations, or the
`$SEED` push. Only the scratch-clone construction is retried.

### Reuse

Unit 1's `setup_or_die` helper for the terminal failure; the existing
`sync_clone` helper at `:741` shows the file's `git -C` idiom.

## Verification

Both units are verified by the same suite — it is the very suite this node
repairs, so it must be run after each unit, not only at the end.

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

Expect `failed: 0` and a non-zero `passed:` count. A run reporting `passed: 0`
is a vacuous pass, not a success — setup guards firing during normal startup
would look exactly like that, so read the tally rather than the exit code alone.

**Unit 1, manual (judgment, not auto-runnable).** Force a setup failure and
confirm the new behavior: temporarily point `ORIGIN` at a nonexistent path, or
make the clone destination unwritable, then run the harness. It must print
exactly one `error: fixture setup failed: …` line naming the operation, exit
non-zero, and print **no** `FAIL:` lines. Revert the temporary edit afterward.

**Unit 2, auto.** The retry path must not fire on a healthy run — confirm no
`warning: fixture clone failed` line appears in the clean run above. If one
does, the retry is triggering spuriously and the change is wrong.

**Unit 2, manual (judgment).** Simulate a transient failure by making the first
clone attempt fail and the second succeed — e.g. a PATH shim for `git` that
fails its first `clone` invocation and then delegates to the real `git`. The
suite must print the warning once and then complete with the full normal tally.

## What this does not fix

The underlying runner filesystem hiccup is not addressed and is not in scope —
it is not reproducible on demand and not owned by this repository. This node's
claim is narrower and checkable: when that hiccup recurs, CI reports one
accurate line instead of eleven misleading ones, and one retry usually means it
does not report anything at all.
