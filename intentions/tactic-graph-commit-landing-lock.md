---
id: tactic-graph-commit-landing-lock
kind: tactic
statement: graph-commit serializes the rebase→stamp→push critical section behind
  a CAS-claimed lock ref with TTL steal — interim mitigation, deleted when
  tactic-graph-ref-split lands
owner: ai
status: codified
parent: null
rationale: "Retained draft from the 2026-07-19 /align-strategy round
  (strategy-graph-native-dispatch clarification 80), finalized 2026-07-18 by an
  /align-tactics per-node pass into a full clean-session implementation plan.
  Rebase-retry exhaustion — MAX_PUSH_ATTEMPTS=5 burned with zero progress,
  observed three times on 2026-07-19 — is landing contention on the single
  linear main ref, not same-node edit contention, so it is orthogonal to the
  2026-07-13 merge ladder (tactic-graph-commit-auto-serialization owns the
  content-merge layers 1-3). Git's server-side ref update is already an atomic
  compare-and-swap, so ref integrity is never at risk; what dies on each losing
  attempt is the stamp investment: branch protection requires the four checks
  green on the exact SHA, so every retry re-buys 30-180s of CI whose
  vulnerability window is the entire stamp duration. The lock protects the stamp
  investment, not ref atomicity — writers queue instead of racing blindly.
  Explicitly interim per the ratified greenfield direction (design-proposals
  rule): it exists only because the stamp is expensive, and is deleted when the
  ref split (tactic-graph-ref-split) removes the stamp."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# graph-commit serializes the rebase→stamp→push critical section behind a CAS-claimed lock ref with TTL steal — interim mitigation, deleted when tactic-graph-ref-split lands

Finalized 2026-07-18 by an /align-tactics per-node pass. Retained draft context
(2026-07-19 /align-strategy round; strategy clarification 80 is the deciding
record) is subsumed by the plan below.

## Context

`packages/intentionsutil/scripts/graph-commit` is the sole write primitive that
lands intention-node edits on `main`. Its `try_land()` function
(graph-commit:459-508) runs up to `MAX_PUSH_ATTEMPTS` (default 5,
`GRAPH_COMMIT_MAX_ATTEMPTS`) of: `git pull --rebase origin main` → push the
commit to a throwaway `graph/**` scratch branch → `await_checks()` polls the
four branch-protection-required checks (`acceptance`, `preview-and-smoke`,
`lint`, `unit-tests`) green on that exact SHA (30-180s via
`CHECK_TIMEOUT_SECONDS`) → `git push origin "$sha:main"`.

When two or more `graph-commit` invocations race to land at the same time,
only one can win the final `push $sha:main` (git's own fast-forward rejection
is the referee). Today, the loser has already spent the full 30-180s CI-stamp
cost for nothing: it re-buys that same cost on every retry until either it
wins or `MAX_PUSH_ATTEMPTS` is exhausted. This was observed 3 times on
2026-07-19 — concurrent writers burned all 5 attempts with zero progress and
failed with "main busy — retry later" even though each individual attempt's
content was fine; the failure was pure landing CONTENTION on the single
`main` ref, not a content conflict (content conflicts are a separate,
already-landed mechanism — `tactic-graph-commit-auto-serialization` — and are
unaffected by this change).

This tactic adds a CAS-claimed lock ref (`refs/graph/landing-lock`) with
TTL-based steal that serializes the rebase→stamp→push critical section across
concurrent `graph-commit` invocations. A writer that can't claim the lock
waits/backs off cheaply instead of burning a CI stamp cycle it's very likely
to lose. This is interim mitigation: it will be deleted when a separate,
out-of-scope future tactic (`tactic-graph-ref-split`) restructures the ref
layout to remove the contention at its root. Do not attempt that
restructuring here — this plan is additive only, around the existing
critical section.

The lock lives at `refs/graph/landing-lock`, which is NOT under `refs/heads/`,
so it never triggers `.github/workflows/graph-fast-path.yml` (that workflow's
trigger is `on: push: branches: ['graph/**']`, i.e. `refs/heads/graph/**`
only — confirmed by reading the workflow file directly).

## Unit 1: Design and implement the lock primitive functions

**Scope**

Add a new, self-contained section to `packages/intentionsutil/scripts/graph-commit`,
inserted after the existing `await_checks()` function (graph-commit:397-439)
and before `try_land()` (graph-commit:441). Header it `# --- Landing lock
(distributed CAS lock with TTL steal) ---` with a comment block explaining the
design (mirror the prose density of the existing `await_checks()`/`try_land()`
comments).

1. **New env-var tunables**, added near the existing tunable block
   (graph-commit:78-86, right after `CHECK_TIMEOUT_SECONDS`):
   ```
   LOCK_REF="refs/graph/landing-lock"
   LOCK_TTL_SECONDS="${GRAPH_COMMIT_LOCK_TTL_SECONDS:-$((CHECK_TIMEOUT_SECONDS + 60))}"
   LOCK_POLL_SECONDS="${GRAPH_COMMIT_LOCK_POLL_SECONDS:-5}"
   LOCK_WAIT_SECONDS="${GRAPH_COMMIT_LOCK_WAIT_SECONDS:-$((MAX_PUSH_ATTEMPTS * (CHECK_TIMEOUT_SECONDS + 30)))}"
   ```
   `LOCK_REF` is a fixed constant (not a `local`, not overridable — the exact
   ref name is part of this design and must not vary between callers or the
   lock is meaningless). `LOCK_TTL_SECONDS` defaults to 240s (180+60): long
   enough that one full rebase+scratch-push+`await_checks()`+final-push cycle
   at default settings never lapses, short enough that a genuinely dead holder
   wedges the fleet for at most ~4 minutes past its last renewal.
   `LOCK_POLL_SECONDS` (default 5s) is how often a waiter re-observes a live
   foreign lock. `LOCK_WAIT_SECONDS` (default 1050s = 5×210) bounds the TOTAL
   time one invocation will spend waiting on lock contention before giving up
   — sized close to what the pre-existing code could already burn in its
   worst case (5 attempts × ~180-210s), so this change does not make the
   worst-case "busy main, retry later" latency meaningfully worse, only the
   common case faster.

2. **New globals**, added near the existing `SCRATCH_BRANCH`/`SCRATCH_PUSHED`
   declarations (graph-commit:113-117):
   ```
   LOCK_HOLDER_ID="${GRAPH_COMMIT_LOCK_HOLDER_ID:-$(hostname -s 2>/dev/null || hostname 2>/dev/null || echo host)-$$-$RANDOM$RANDOM}"
   LOCK_SHA=""
   LOCK_HELD=0
   LOCK_WAIT_DEADLINE=0
   ```
   `LOCK_HOLDER_ID` is computed once, at script load, exactly like
   `MAX_PUSH_ATTEMPTS` etc. are computed once at load time — it is NOT scoped
   to `main()`. The env override exists solely so tests can assign two writer
   clones distinct, stable holder ids (and can plant a "dead holder" whose id
   never appears from a live process). `LOCK_SHA` is the SHA of the lock
   commit THIS process currently believes it owns (empty until first
   claimed). `LOCK_HELD` is 1 iff this process currently holds the lock.
   `LOCK_WAIT_DEADLINE` is set once per `try_land()` invocation (by Unit 2),
   not here.

3. **Payload encoding** — a lock claim is a single orphan (parentless) git
   commit object:
   - Tree: git's universal empty-tree SHA
     `4b825dc642cb6eb9a060e54bf8d69288fbee4904` (present in every git object
     database; needs no local tree/blob write).
   - Commit message, exactly two lines:
     ```
     graph-commit-lock v1
     holder=<LOCK_HOLDER_ID> expiry=<unix_epoch_seconds>
     ```
   - Author/committer: whatever `git commit-tree` picks up from the ambient
     `user.name`/`user.email` config (already required to be set for
     `graph-commit` to function at all, since it commits node edits) — no
     special identity handling needed.
   - Rationale (per the reuse findings — no existing ref-payload convention
     exists in this repo to follow): a commit message is trivially both
     written (`git commit-tree <empty-tree> -m ... -m ...`) and read
     (`git show -s --format=%B <ref-or-sha>`) with plain shell, requires no
     new tooling (no `git mktag`, no JSON), and — because it is parentless —
     a `git fetch` of just this one ref never walks any history, so reading
     the current claim is always a cheap, constant-size fetch regardless of
     how many times the lock has changed hands.

4. **Helper: `build_lock_commit`** — `build_lock_commit <expiry_unix_ts>` →
   prints a new commit SHA to stdout:
   ```bash
   build_lock_commit() {
     local expiry="$1"
     git commit-tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 \
       -m "graph-commit-lock v1" \
       -m "holder=$LOCK_HOLDER_ID expiry=$expiry"
   }
   ```

5. **Helper: `read_lock_payload`** — `read_lock_payload <ref-or-sha>` reads a
   already-fetched ref/sha's message and sets two globals `LOCK_OBS_HOLDER`
   and `LOCK_OBS_EXPIRY` (parsed from the second message line via bash's
   `[[ ... =~ ... ]]` regex, no external `grep`/`sed` needed):
   ```bash
   read_lock_payload() {
     local ref="$1" body line2
     body="$(git show -s --format=%B "$ref")"
     line2="$(printf '%s\n' "$body" | tail -n1)"
     if [[ "$line2" =~ ^holder=([^[:space:]]+)\ expiry=([0-9]+)$ ]]; then
       LOCK_OBS_HOLDER="${BASH_REMATCH[1]}"
       LOCK_OBS_EXPIRY="${BASH_REMATCH[2]}"
     else
       die "malformed landing-lock payload on $ref: '$line2'"
     fi
   }
   ```
   A malformed payload is a broken-environment condition (someone/something
   wrote to `refs/graph/landing-lock` outside this mechanism) — `die()`, per
   `.claude/rules/code-style.md`'s clear-errors-over-fallbacks convention, not
   a silent skip.

6. **Core function: `lock_claim_or_renew`** — no arguments; returns 0 once
   this process holds a live claim (setting `LOCK_SHA`/`LOCK_HELD=1`), or
   returns 1 if `LOCK_WAIT_DEADLINE` (set by the caller before the first call
   — see Unit 2) has passed without acquiring:
   ```bash
   lock_claim_or_renew() {
     local remote_sha now expiry new_sha
     while :; do
       remote_sha="$(git ls-remote origin "$LOCK_REF" | cut -f1)"
       now="$(date +%s)"

       if [[ -z "$remote_sha" ]]; then
         # No one holds it: try to CREATE it. A non-force push to a ref that
         # does not yet exist is git's own atomic CAS on "still absent" — it
         # is rejected if a concurrent writer created the ref first, in which
         # case we fall through and re-observe as "exists".
         new_sha="$(build_lock_commit "$((now + LOCK_TTL_SECONDS))")"
         if git push origin "$new_sha:$LOCK_REF" >&2 2>/dev/null; then
           LOCK_SHA="$new_sha"; LOCK_HELD=1
           return 0
         fi
         continue
       fi

       read_lock_payload "$remote_sha" 2>/dev/null || {
         # Object not yet in our local odb — fetch it once, then re-read.
         git fetch -q origin "$LOCK_REF" >&2
         read_lock_payload FETCH_HEAD
       }

       if [[ "$LOCK_OBS_HOLDER" == "$LOCK_HOLDER_ID" ]]; then
         # Renewing our own still-recorded claim.
         new_sha="$(build_lock_commit "$((now + LOCK_TTL_SECONDS))")"
         if git push --force-with-lease="$LOCK_REF:$remote_sha" origin "$new_sha:$LOCK_REF" >&2; then
           LOCK_SHA="$new_sha"; LOCK_HELD=1
           return 0
         fi
         # Lease rejected: we were slow enough that someone else already
         # reclaimed it out from under us. Re-observe from scratch.
         continue
       fi

       if [[ "$LOCK_OBS_EXPIRY" -gt "$now" ]]; then
         # Live, foreign holder: wait, don't steal.
         if [[ "$now" -ge "$LOCK_WAIT_DEADLINE" ]]; then
           return 1
         fi
         sleep "$LOCK_POLL_SECONDS"
         continue
       fi

       # Expired: steal, atomically, only if the ref still equals what we
       # just observed (guards a simultaneous-steal race against another
       # waiter that observed the same expiry).
       new_sha="$(build_lock_commit "$((now + LOCK_TTL_SECONDS))")"
       if git push --force-with-lease="$LOCK_REF:$remote_sha" origin "$new_sha:$LOCK_REF" >&2; then
         LOCK_SHA="$new_sha"; LOCK_HELD=1
         return 0
       fi
       continue
     done
   }
   ```
   Note: `git ls-remote` returning a SHA does not guarantee the corresponding
   commit object is already in the LOCAL odb (it's a remote-side query) —
   `read_lock_payload "$remote_sha"` will fail locally the first time a given
   SHA is observed, hence the `git fetch -q origin "$LOCK_REF"` fallback
   before re-reading via `FETCH_HEAD`. Implementers should verify this
   fetch-then-read sequencing works against a real bare-remote-backed clone
   (the test harness in Unit 3 is exactly this shape) and adjust the exact
   incantation if `git show -s --format=%B <sha>` needs the object fetched by
   SHA rather than by ref name in this repo's git version — the
   SHA-vs-FETCH_HEAD distinction is a mechanical detail, not a design
   decision.

7. **Core function: `lock_release`** — no-op unless we hold the lock;
   best-effort:
   ```bash
   lock_release() {
     [[ "$LOCK_HELD" -eq 1 ]] || return 0
     git push --force-with-lease="$LOCK_REF:$LOCK_SHA" origin ":$LOCK_REF" >&2 || true
     LOCK_HELD=0
     LOCK_SHA=""
   }
   ```
   The `--force-with-lease` on a delete refspec is an atomic "delete only if
   the remote still equals `$LOCK_SHA`" — this process never deletes a lock
   it no longer actually owns (e.g. after losing a steal race, or after its
   own `LOCK_WAIT_SECONDS` timeout). Always non-fatal (`|| true`) so a
   release failure never masks the caller's real exit status, mirroring the
   existing scratch-branch delete's discipline at graph-commit:233-235.

**Out of scope for Unit 1:** does not call any of these new functions from
anywhere yet (that's Unit 2) — `try_land()`, `cleanup()`, `main()` are
untouched by this unit. Does not touch `check_base_freshness()`,
`snapshot()`, `ensure_intentions_only_base()`, `rebase_in_progress()`,
`park_write()`, `commit_files()`, `assert_staged_safe()`, `id_files_dirty()`,
or the scratch-branch mechanism (`SCRATCH_BRANCH` naming, push, or delete).
Does not implement `tactic-graph-ref-split` — no change to node-file storage
or the `graph/**` scratch-branch stamping approach; the lock is purely
additive.

**Recommended model:** opus. This is a brand-new distributed-locking
primitive with zero repo precedent: the payload encoding, the three-way CAS
decision (absent / expired / live), the steal-after-expiry race, and the
self-renewal-vs-foreign-steal distinction are all novel design judgment calls
made above — but the actual line-by-line git-plumbing implementation of what's
specified here is mechanical. If in practice the assigned implementer finds
the design section above under-specified in a place that requires a genuine
new tradeoff (not just a shell syntax detail), that residual ambiguity is
exactly why this unit is opus rather than sonnet.

## Unit 2: Wire the lock into `try_land()` and `cleanup()`

**Dependencies:** Unit 1.

**Scope**

Mechanical integration of Unit 1's already-fully-specified functions into the
existing control flow. No new design decisions — every call site and its
exact placement is specified below.

1. **`try_land()` (graph-commit:459-508):**
   - At the top of the function body, before the `for (( attempt=1; ...))`
     loop (i.e., right after the `local attempt sha ck` declaration), add:
     `LOCK_WAIT_DEADLINE=$(( $(date +%s) + LOCK_WAIT_SECONDS ))`.
   - As the FIRST statement inside the `for` loop body, before the existing
     `if ! git pull --rebase origin main >&2; then` (graph-commit:462), add:
     ```bash
     if ! lock_claim_or_renew; then
       echo "graph-commit: could not claim the landing lock within ${LOCK_WAIT_SECONDS}s (main busy — another writer is landing); giving up" >&2
       break
     fi
     ```
     The `break` exits the `for` loop early (before `MAX_PUSH_ATTEMPTS` is
     necessarily exhausted) and falls through to the existing trailing block
     (graph-commit:506-507) — see the message tweak below.
   - Immediately before the existing final push, `if git push origin
     "$sha:main" >&2; then` (graph-commit:501), add a cheap re-check that
     this process still owns the lock (guards the case where a slow
     `await_checks()` poll cycle let the TTL lapse and a waiter already stole
     it):
     ```bash
     if [[ "$(git ls-remote origin "$LOCK_REF" | cut -f1)" != "$LOCK_SHA" ]]; then
       echo "graph-commit: landing lock no longer held (stolen after expiry) before the main push on attempt $attempt/$MAX_PUSH_ATTEMPTS; re-claiming and retrying" >&2
       LOCK_HELD=0
       continue
     fi
     ```
   - Inside the `if git push origin "$sha:main" >&2; then` success block,
     immediately before `return 0`, add `lock_release`.
   - On the conflict path, immediately before `return 10`
     (graph-commit:466), add `lock_release`.
   - Reword the trailing "exhausted" block (graph-commit:506-507) to account
     for both the pre-existing exhaustion cause and the new lock-wait-timeout
     cause, and release the lock there too:
     ```bash
     lock_release
     echo "error: graph-commit: could not land on main — main busy (landing-lock contention or required checks never stamped green) after $attempt/$MAX_PUSH_ATTEMPTS attempt(s); retry later" >&2
     return 11
     ```
     (`$attempt` here reflects however many loop iterations actually ran,
     whether they were consumed by real rebase/stamp/push cycles or ended
     early via the lock-wait `break` — this is intentionally the SAME return
     code (11) and the SAME caller-visible exit-1 "busy main, retry later"
     contract as before; only the internal cause and the logged detail
     differ. Do not introduce a new exit code or a different top-level
     message for the lock-wait-timeout case — the task's failure-mode
     requirement is that this composes with, not replaces, the existing
     semantics.)
   - The `die()` call for a non-conflict rebase/fetch failure
     (graph-commit:468) and the `die()` for a concluded check failure
     (graph-commit:493) are UNCHANGED — they still bypass `try_land()`'s
     normal returns and exit the whole script, relying on `cleanup()`'s EXIT
     trap (next bullet) to release the lock as a backstop.

2. **`cleanup()` (graph-commit:219-237):** add a lock-release call alongside
   the existing scratch-branch delete, guarded and best-effort in the same
   style:
   ```bash
   if [[ "$LOCK_HELD" -eq 1 ]]; then
     lock_release
   fi
   ```
   Placed anywhere in `cleanup()` after the `rc=$?` capture (so it can never
   alter the function's return code) — e.g. immediately after the existing
   scratch-branch-delete block (graph-commit:233-235), before `return "$rc"`.
   In the common paths (success, conflict, exhausted) `try_land()` will
   already have called `lock_release` itself and reset `LOCK_HELD=0`, so this
   becomes a no-op backstop; it only does real work when the script dies
   before reaching try_land()'s own release calls (the two `die()` paths
   named above, or any other unexpected `die()`).

**Out of scope for Unit 2:** does not change `land()`'s (graph-commit:522-533)
three-way return-code mapping (0/11/12) — `try_land()` still returns exactly
0, 10, or 11 as before, just via slightly different internal paths. Does not
change `main()`'s exit-1/park-on-conflict logic (graph-commit:673-713) at
all — it consumes `land()`'s return code exactly as before and has no
knowledge the lock exists. Does not change `await_checks()`, the
scratch-branch push/stamp mechanism, or any of the argument-parsing/
validation code in `main()` (graph-commit:568-622).

**Recommended model:** sonnet. Every call site, its exact insertion point,
and its exact code are fully specified above; this is wiring an
already-designed primitive into an existing, well-understood control-flow
shape, following the file's own established patterns (e.g. `cleanup()`'s
existing best-effort-guarded-delete style).

## Unit 3: Extend the functional test harness

**Dependencies:** Units 1 and 2 (tests the real implementation, not a mock).

**Scope**

Add new cases to `packages/intentionsutil/scripts/test-graph-commit.sh`,
appended after the existing case 16 / before the final "no scratch branches
left behind" check (test-graph-commit.sh:471-495), reusing the file's
existing scaffolding verbatim: the same `$ORIGIN` bare repo, the same
`run_gc()` helper (test-graph-commit.sh:161-172) and its
`GC_POLL`/`GC_TIMEOUT`/`GC_ATTEMPTS` env-override convention (extend it with
analogous `GC_LOCK_TTL`/`GC_LOCK_POLL`/`GC_LOCK_WAIT` knobs exported the same
way, defaulting into `GRAPH_COMMIT_LOCK_TTL_SECONDS`/
`GRAPH_COMMIT_LOCK_POLL_SECONDS`/`GRAPH_COMMIT_LOCK_WAIT_SECONDS`), the same
`make_clone`/`set_mode`/`gh_calls`/`sync_clone`/`edit_line` helpers, and the
same `ok`/`no` result accounting. Do NOT build a second scratch-repo harness
or a new file — this file's setup (throwaway bare origin seeded from a copy
of the real `graph-commit` at its true repo-relative path, two independent
writer identities, no-network `gh`/`npx` PATH shims) already covers
everything a lock test needs, since lock claim/renew/steal/release are pure
`git push`/`git fetch`/`git ls-remote` calls against `$ORIGIN` — no new shim
is needed.

New cases to add:

- **Case 17 — contention is now cheap, not exhausting:** two writers (`A`,
  `B`) both edit the SAME node concurrently in `green` mode with realistic
  (not artificially tiny) `GC_TIMEOUT`/`GC_POLL`; run `A`'s `graph-commit` in
  the background, and while it's mid-flight, run `B`'s. Assert both
  eventually exit 0 (or one exits 0 and the other's edit auto-merges/lands on
  a subsequent rebase, matching the existing non-overlap-merge semantics of
  case 3) AND — the actual regression check for the bug this tactic fixes —
  assert via `gh_calls`/`CALL_LOG` that the total number of `gh` check-run
  polls across both writers is close to what ONE clean landing cycle would
  cost, not `2×` or more (i.e. the loser did NOT independently re-poll checks
  from scratch while the winner held the lock; it waited on the lock
  instead).
- **Case 18 — dead-holder steal:** using a throwaway helper clone, directly
  `git push` a lock commit to `refs/graph/landing-lock` (mirroring
  `build_lock_commit`'s exact commit-tree/message shape from Unit 1, with an
  `expiry=` already in the past and a `holder=` value that will never renew,
  e.g. `holder=dead-holder-test`). Then run a real writer's `graph-commit`
  with a short `GC_LOCK_POLL`; assert it steals the expired lock and lands
  successfully well within one `GC_LOCK_POLL` cycle (not the full
  `GC_LOCK_WAIT` timeout).
- **Case 19 — live-holder wait (no premature steal):** same planting
  technique as case 18, but with `expiry=` a few seconds in the FUTURE and a
  foreign `holder=`. Assert a real writer's `graph-commit` does NOT steal it
  immediately (assert the lock ref's SHA is unchanged immediately after the
  writer starts, before the planted expiry passes) and DOES proceed once the
  planted expiry passes (assert it lands, and lands only after at least one
  `GC_LOCK_POLL`-sized wait has elapsed).
- **Case 20 — lock-ref hygiene:** after a normal successful landing (reuse
  case 1's setup/outcome), assert `refs/graph/landing-lock` is ABSENT on
  `$ORIGIN` (`git -C "$ORIGIN" show-ref --verify --quiet
  refs/graph/landing-lock` fails) — add a `lock_ref_exists()` helper
  analogous to the existing `scratch_refs()` (test-graph-commit.sh:159),
  since `scratch_refs()`'s `refs/heads/graph/**` glob does not and must not
  match `refs/graph/landing-lock` (they are deliberately disjoint ref
  namespaces — this is itself worth a one-line assertion:
  `git -C "$ORIGIN" for-each-ref 'refs/heads/graph/**'` never lists the lock
  ref).
- Confirm the full file (all pre-existing cases 1-16 plus the new ones)
  still passes end-to-end — this is the natural regression gate and requires
  no separate case, just running the file.

**Out of scope for Unit 3:** does not build a new scratch-repo/bare-origin
harness from scratch. Does not test `tactic-graph-ref-split` (no
ref-layout-migration scenarios). Does not modify the existing `gh`/`npx`
PATH shims' behavior (test-graph-commit.sh:112-148) beyond, if needed,
sourcing the same `MODE_FILE`/`CALL_LOG` mechanism already in place — the
lock mechanism itself never calls `gh` or `npx` at all, only `git`.

**Recommended model:** sonnet. This mirrors an established, already-built
harness pattern in the same file with a well-understood shape (bare origin +
N clones + assertions on origin ref state) — no novel test-infrastructure
design is required, just applying the existing pattern to the new lock ref.

## Reuse

- `try_land()` / `await_checks()` / `cleanup()` — existing shape,
  tunable-env-var naming convention (`GRAPH_COMMIT_<THING>_SECONDS`), and
  best-effort-cleanup discipline:
  `packages/intentionsutil/scripts/graph-commit:78-86, 219-237, 397-439,
  459-508`.
- The comment at `packages/intentionsutil/scripts/graph-commit:474-479`
  explaining why the scratch branch intentionally uses plain `--force` (no
  lease) — the new lock code is the first real use of `--force-with-lease`
  in this script, precisely because unlike the scratch branch, the lock ref
  IS read and compared before every write.
- The bare-origin + two-independent-writer-clone + no-network `gh`/`npx`
  PATH-shim functional-test harness, its `run_gc()` helper and env-override
  convention, and its `ok`/`no`/`scratch_refs()` assertion helpers:
  `packages/intentionsutil/scripts/test-graph-commit.sh` (whole file; extend
  it, do not replace or duplicate it).
- `.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock` — reuse
  its DESIGN VOCABULARY only (holder id, staleness/TTL cap, dead-holder
  reclaim, explicit release as a fast path over waiting for self-healing).
  Its MECHANISM (local `flock` on a file, keyed to `CLAUDE_CODE_SESSION_ID`)
  is NOT reused — it cannot serialize across independent clones/machines,
  which the graph-commit lock must do.
- `.claude/rules/code-style.md` — clear errors over defensive fallbacks: a
  malformed lock payload dies loudly (`read_lock_payload`'s `die()` branch in
  Unit 1); a lock-wait timeout still produces the same loud, well-understood
  "busy main, retry later" exit-1 contract rather than a silently different
  failure mode.
- `.claude/rules/shell-json.md` — the general principle of capturing command
  output directly into a variable via `$(...)` rather than round-tripping it
  through `echo` applies to `read_lock_payload`'s parsing of `git show -s
  --format=%B` output, even though the payload here is plain text, not JSON.

## Verification

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```
This must report `failed: 0` and include PASS lines for all pre-existing
cases 1-16 plus the new lock cases added in Unit 3 (contention-is-cheap,
dead-holder steal, live-holder wait, lock-ref hygiene). This is the repo's
established invocation convention for this harness (the script is
executable, shebang `#!/usr/bin/env bash`, no arguments, no network or real
`gh`/`npx` required) — confirmed by reading the file directly rather than
assumed.

Manual/observational checks (not automatable in this harness, do these after
the above passes):
- Confirm `refs/graph/landing-lock` never appears in `git ls-remote --heads
  origin` output against the real repo (it must live outside `refs/heads/`
  or it would spuriously trigger `.github/workflows/graph-fast-path.yml`,
  whose trigger is `on: push: branches: ['graph/**']`) — run `git ls-remote
  origin 'refs/heads/graph/**'` and separately `git ls-remote origin
  refs/graph/landing-lock` against the real origin and confirm the lock ref
  only shows up in the second query, never the first.
- After this lands and is in active use, watch actual `graph-commit`
  invocation logs (wherever they're currently observed — the same channel
  that surfaced the 2026-07-19 exhaustion incidents) for a period of
  concurrent activity: confirm no further "could not land on main after N
  attempts" exhaustion events occur under contention that would previously
  have exhausted `MAX_PUSH_ATTEMPTS`, and confirm the new "could not claim
  the landing lock within ...s" log line (when it does appear) is rare
  relative to successful claims, not the common case.
- Spot-check that a `graph-commit` process killed mid-hold (e.g. `kill -9`
  during `await_checks()` in a manual local test, not via the automated
  harness) leaves `refs/graph/landing-lock` present but with a now-past
  `expiry=`, and that a subsequent writer steals it within one
  `GRAPH_COMMIT_LOCK_POLL_SECONDS` cycle after the TTL lapses rather than
  wedging indefinitely.

### Critical files

- `packages/intentionsutil/scripts/graph-commit`
- `packages/intentionsutil/scripts/test-graph-commit.sh`
- `.github/workflows/graph-fast-path.yml`
- `.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock`
- `.claude/rules/code-style.md`
