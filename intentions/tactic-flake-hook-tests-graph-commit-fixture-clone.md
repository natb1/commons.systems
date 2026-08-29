---
id: tactic-flake-hook-tests-graph-commit-fixture-clone
kind: tactic
statement: Stop test-graph-commit.sh fixture clones from racing source-side git
  object relocation, and make any remaining fixture-setup failure fail loudly,
  so a clone failure cannot cascade into 11 misleading product-test failures
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
  the fixture bootstrap rather than introducing a new one. (Amended 2026-08-12
  after the fix was written and verified; it is open as PR #3071, CI green,
  unmerged at the time of writing. ROOT CAUSE, now confirmed rather than
  suspected: make_clone ran `git clone -q \"$ORIGIN\" \"$1\"` — a local-PATH
  clone, which hardlink/copies $ORIGIN/objects file-by-file and races a
  source-side loose-to-pack relocation triggered right after the seed push. The
  object MOVES rather than vanishing, which is exactly why 73 later assertions
  reading $ORIGIN still passed while precisely the 11 $B-dependent cases died at
  run_gc s `cd \"$clone\" || exit 99`. TRANSIENCE, corrected in BOTH directions:
  the statement s original word transient was falsified by the two consecutive
  identical CI reproductions recorded in the clarification above — but
  deterministic, the wording that clarification reached for, is also wrong. A
  third CI run of the unchanged suite, on PR #3068 s 2026-08-12 head, passed
  hook-tests green. So this is a genuine race with a high but not certain hit
  rate, not a guaranteed failure. That matters for how the fix is validated: a
  single green hook-tests run is WEAK evidence either way, and the real argument
  for the fix is mechanical rather than statistical — --no-local removes the
  racing code path instead of making it win more often. WHAT THE FIX DOES (all
  three changes, fixture SETUP only, no assertion touched): (1) make_clone
  clones with --no-local, routing through upload-pack, which streams a single
  pack and is immune to source-side object relocation; --no-hardlinks was
  considered and REJECTED because it keeps the same per-file copy loop and only
  forces the branch that already failed. (2) `gc.auto 0` and `receive.autogc
  false` on the scratch $ORIGIN and $SEED, silencing the only asynchronous
  writer those repos can have. (3) The loud-failure check this node was
  originally scoped for: make_clone now tests git clone s exit status and aborts
  with a single `error: fixture setup failed: ...` line, extending the mktemp
  guard idiom at :271-273. So this node s original scope is the third item, and
  the widening the clarification called for is items 1 and 2. VERIFIED: local
  suite passed 84, failed 0. Case 30 (dead-holder steal) was checked by name,
  because --no-local no longer hands a fresh clone $ORIGIN s refs/graph/**
  objects for free — it passes because graph-commit s lock path does its own
  ls-remote/fetch of refs/graph/landing-lock rather than relying on the clone
  carrying it.)"
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications:
  - question: Is the fixture clone failure actually transient, and does the
      loud-failure fix cover everything wrong here?
    answer: "(Measured 2026-08-12 during the /align round that recorded
      /dispatch-emulate; observed on PR #3070, a one-paragraph SKILL.md prose
      change that cannot touch graph-commit fixtures.) NO on both counts, and
      this node's framing needs widening. TRANSIENCE. The statement above calls
      the clone failure transient. It is not, at least not now: hook-tests
      failed on the PR, was re-run with `gh run rerun --failed`, and failed
      AGAIN with the identical signature — a different temp directory each time,
      the same `fatal: failed to copy file to '<tmp>/b/.git/objects/<xx>/<sha>':
      No such file or directory` followed by every dependent case dying on
      `fatal: cannot change to '<tmp>/b'`. Both runs reported `passed: 73
      failed: 11`, the exact cascade this node exists to stop presenting. So it
      reproduces deterministically in the CI runner. THE DISCRIMINATOR that
      makes this diagnosable rather than a guess: the SAME suite, run locally at
      the same commit (origin/main ccfa8028 plus the one prose commit), reports
      `passed: 84 failed: 0`. Local green, CI red, twice, on a change that
      touches only markdown. That rules out a code regression and localizes the
      fault to the CI environment's local-clone behavior, not to graph-commit
      and not to the test's assertions. TWO DEFECTS, NOT ONE. This node covers
      the reporting defect — a swallowed fixture failure cascading into 11
      misleading product failures — and that fix stands and is still worth
      landing exactly as scoped: with `set -uo pipefail` and no `-e`, the
      harness walks past a failed fixture clone. But underneath it there is a
      SECOND defect this node does not cover: whatever makes `git clone` of
      fixture `b` fail in the runner in the first place. 'failed to copy file
      ... No such file or directory' on a local clone is a source-side symptom —
      the object the clone is copying is not where the clone expects it — so the
      candidates are the local-clone hardlink/copy path against a source repo
      being mutated concurrently, or runner filesystem behavior the local path
      does not exercise. Diagnosing that is separate work; it is named here so a
      session that lands the loud-failure fix does not read a now-clear one-line
      error as the whole problem solved. OPERATIONAL CONSEQUENCE while both
      stand: hook-tests is a required check, so this currently blocks any PR
      that runs it — #3070 included — independent of the PR's content. Per the
      test-integrity rule the suite was not weakened, skipped, or worked around
      in this session."
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr15-graph-commit-simplification
  pr: 3136
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-29T23:45:52Z
    mergeCommitSha: a4a964b8e80bcac307d089b001a5419b1ed46fd8
    graphCommitSha: null
  lane_pass: null
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

## What shipped — 2026-08-29, both units

Landed in #3136 (merge commit `a4a964b8`), Position 2 of the dispatch/RSI
serialized window.

**Unit 1 — fixture setup fails loudly.** A `setup_or_die` helper — the form this
node's Reuse section sanctioned — now wraps every fixture-setup operation the
node listed: the `$ORIGIN` `init --bare`, `symbolic-ref` and four `config`
calls; the `$SEED` bootstrap (`mkdir -p`, `init`, four `config`, `remote add`,
the second `mkdir -p`, the `cp` of `graph-commit`); the seed `add`/`commit`/
`push`; and both `config` calls inside `make_clone`. The `store.js` truncation
takes an inline guard in the same voice, since a redirect cannot take
`setup_or_die`. It uses `exit 1`, and `set -uo pipefail` is untouched — no `-e`
was added, so the tally survives.

**Unit 2 — bounded single clone retry.** `make_clone` prints
`warning: fixture clone failed, retrying once: …` to stderr, `rm -rf`s the
partial directory, retries exactly once, and falls through to Unit 1's abort
message. No loop, no sleep, nothing else retried.

**The cascade proof.** With a PATH-shimmed `git` that always fails `clone`, the
suite now prints four lines ending in `error: fixture setup failed: git clone …`
and exits 1 with **zero `FAIL:` lines** — where it previously reported 11
misattributed case failures. With a shim that fails only once, one `warning:`
line and then a full green run. On a healthy run no warning line appears, so the
retry is not firing spuriously.

### Already landed elsewhere, correctly not re-implemented

#3071 had already landed the clone race itself: `--no-local`, `gc.auto 0` /
`receive.autogc false`, and `make_clone`'s own exit check. This node's "what the
fix does" rationale lists those *alongside* the loud-failure check, which reads
as though all four were outstanding. Only the loud-failure widening and the
bounded retry actually were; the shipped change builds on #3071 rather than
duplicating it.

### Corrections to this node's own text

- "VERIFIED: local suite passed **84**, failed 0" is stale — the suite is now
  **124 passed / 0 failed**.
- The body's "Confirmed transient: the immediately following run … passed all 23
  checks" is **stale and contradicted by this node's own clarification**, which
  falsified "transient" with two consecutive identical CI reproductions and then
  also rejected "deterministic" via a third green run. The settled reading is a
  genuine race with a high but not certain hit rate. Do not quote the
  "Confirmed transient" line.
- `make_clone` is cited at `:372`; it is now near `:518`. The `$SEED` bootstrap,
  `mktemp` guard, `set -uo pipefail` and `sync_clone` anchors have all drifted
  too. Locate by symbol.
- The "What this does not fix" section stands unchanged and correctly: the
  underlying runner filesystem behavior remains out of scope and unaddressed.
  This change makes the failure legible, it does not remove the race.

**Verification:** `test-graph-commit.sh` 124/0; `run-lint.sh` clean. The two
manual judgment checks — forcing a setup failure, and shimming a single clone
failure — were performed by the implementing session with the results quoted
above; the clean-run figure was independently re-run at 124/0.
