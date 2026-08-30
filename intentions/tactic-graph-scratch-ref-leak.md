---
id: tactic-graph-scratch-ref-leak
kind: tactic
statement: "origin's leaked refs/heads/graph/* scratch branches are collected by
  graph-scratch-sweep — an owned, TTL-gated, CAS-delete collector that
  graph-commit invokes on every run — and the leak's two causes are separated
  and made observable: writers SIGKILLed before the EXIT trap ever fires, and
  trap deletes that failed silently into `|| true`"
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours drain sitting. Verified the
  same day with 'git ls-remote origin refs/heads/graph/**': exactly 10 orphaned
  scratch refs on origin, spanning 2026-07-05 to 2026-07-28 — so the leak is
  ongoing, not a one-time historical residue. Examples with their tip commit
  dates: refs/heads/graph/tactic-align-strategy-skill-prune-3251902
  (2026-07-05), refs/heads/graph/tactic-grounding-gap-analysis-3891250
  (2026-07-10), refs/heads/graph/tactic-strategy-fingerprint-stamp-shape-1396011
  (2026-07-23), refs/heads/graph/tactic-drain-disposition-diagnosis-cas-431144
  (2026-07-25), and
  refs/heads/graph/tactic-drain-disposition-diagnosis-cas-733697 with a tip from
  2026-07-28 11:19:53, hours before this filing. graph-commit names each scratch
  branch 'graph/$ref_id-$$' (graph-commit:1392) and deletes it in its EXIT-trap
  cleanup with 'git push origin --delete \"$SCRATCH_BRANCH\" >&2 || true'
  (graph-commit:350) — best-effort, failure swallowed, and never reached at all
  if the writer is SIGKILLed or the process dies outside the trap. The
  accumulation is therefore a SIGNAL that writers are dying mid-landing, which
  is the more valuable half of this node: test-graph-commit.sh already asserts
  the invariant this violates (case 1, 'scratch branch deleted on origin after
  landing', asserted via scratch_refs() at test-graph-commit.sh:447/477-480), so
  the mechanism is known-good under a clean exit and the leaked refs are
  evidence about writer mortality, not about the delete call. One ref,
  refs/heads/graph/tactic-align-tactics-skill-prune-manual, carries no '-<pid>'
  suffix and so was not produced by graph-commit's own naming — it needs a
  separate provenance check before being swept. AMENDED 2026-08-20 by the
  /align-tactics per-node finalize round, which re-measured every claim above
  against origin/main. Three corrections. (1) COUNT: there are now 14 refs, not
  10 — nine of the original ten survive,
  graph/tactic-drain-disposition-diagnosis-cas-733697 is gone by an
  unestablished cause, and five are new; the newest tip is
  2026-08-18T21:41:43-04:00, so the leak grew straight through the three graph
  write-path PRs that landed since filing. (2) THE DIAGNOSIS IS NARROWER THAN
  THIS RATIONALE ASSUMED, and that is the round's main finding: classifying each
  leaked tip by reachability from origin/main splits the population 7 REACHABLE
  / 7 orphan. A REACHABLE tip means the landing SUCCEEDED and only the delete
  did not happen — so it is NOT true that every leaked ref marks a writer that
  never reached its trap, as the sentence above states. Half of them reached it
  and the `|| true` ate the failure, which is the silent-write-failure shape
  clarification 93 forbids and is invisible today. The statement and plan were
  scoped to the two populations accordingly. (3) PROVENANCE QUESTION CLOSED:
  graph/tactic-align-tactics-skill-prune-manual is commit 3c8ce0e5, a hand-run
  stamping push by the author on 2026-07-05, and it is REACHABLE from main — its
  content landed, so it needs no special-casing and deleting it loses nothing.
  Every path:line anchor cited in the original filing was also stale
  (graph-commit has grown to 4012 lines) and is corrected in the plan body."
reading: null
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
## Context

`packages/intentionsutil/scripts/graph-commit` lands every intention-node edit by
pushing the candidate SHA to a throwaway branch on `origin`, waiting for the four
required check contexts to stamp that exact SHA, and then fast-forwarding `main`.
The branch is named for the node plus the writer's PID:

```sh
local ref_id="${ALL_IDS[0]//[!A-Za-z0-9-]/-}"
SCRATCH_BRANCH="graph/$ref_id-$$"          # graph-commit:3761-3762
```

and is removed only inside the script's EXIT trap:

```sh
if [[ "$SCRATCH_PUSHED" -eq 1 && -n "$SCRATCH_BRANCH" ]]; then
  git push origin --delete "$SCRATCH_BRANCH" >&2 || true   # graph-commit:902-904
fi
```

That delete is best-effort twice over: it is skipped entirely when no trap fires
(SIGKILL, session reap, harness timeout), and when it does run its failure is
swallowed by `|| true`. `cleanup()`'s own comment already states the first half in
terms — *"Deliberately incomplete: a SIGKILL fires no trap at all, so this cannot be
the only defense"* (`graph-commit:865-867`) — and the header block says the same about
the sibling orphan-commit problem (`graph-commit:86-87`). Nothing collects what is
left behind: **there is no production sweeper anywhere in the repo.** The only code
that deletes an abandoned `refs/heads/graph/**` ref is `drop_scratch_refs()`, a
test-only helper (`test-graph-commit.sh:1104-1109`).

### Measured state, 2026-08-20 (re-measured this round against origin)

`git ls-remote origin` lists **14** refs under `refs/heads/graph/`, up from the 10
recorded when this node was filed on 2026-07-28. The newest tip is
`2026-08-18T21:41:43-04:00`, two days ago — the leak is live, and it grew straight
through the three graph write-path PRs that landed since filing. Each tip, with
whether it is reachable from `origin/main`:

| tip (committer date) | reachable from main? | ref under `refs/heads/graph/` |
| --- | --- | --- |
| 2026-07-05T10:26:26 | REACHABLE | `graph/tactic-align-strategy-skill-prune-3251902` |
| 2026-07-05T10:53:46 | REACHABLE | `graph/tactic-align-tactics-skill-implqa-3432988` |
| 2026-07-05T18:51:55 | REACHABLE | `graph/tactic-align-tactics-skill-prune-manual` |
| 2026-07-07T11:38:14 | orphan | `graph/tactic-review-lows-attention-tools-2907955` |
| 2026-07-07T11:38:43 | orphan | `graph/strategy-diversify-income-2897651` |
| 2026-07-10T15:41:47 | REACHABLE | `graph/tactic-grounding-gap-analysis-3891250` |
| 2026-07-10T15:41:54 | orphan | `graph/tactic-budget-overlap-anchor-merge-3891520` |
| 2026-07-23T10:50:34 | REACHABLE | `graph/tactic-strategy-fingerprint-stamp-shape-1396011` |
| 2026-07-25T13:36:31 | orphan | `graph/tactic-drain-disposition-diagnosis-cas-431144` |
| 2026-07-30T14:15:14 | orphan | `graph/tactic-graph-commit-noop-landing-false-failure-3991690` |
| 2026-08-05T16:19:16 | REACHABLE | `graph/tactic-align-tactics-mark-terminal-skipped-4104969` |
| 2026-08-11T11:01:12 | orphan | `graph/tactic-align-skill-draft-selectability-stale-prose-1453511` |
| 2026-08-13T10:35:26 | REACHABLE | `graph/tactic-eval-finding-eval-since-bound-excludes-worker-1110231` |
| 2026-08-18T21:41:43 | orphan | `graph/tactic-eval-finding-main-dirt-halts-ladder-as-violation-1144084` |

`git ls-remote origin 'refs/graph/*'` returns **nothing** — no landing lock is held
right now, and the two namespaces are confirmed disjoint against the live remote, not
only in the test at `test-graph-commit.sh:2004-2007`.

### The diagnosis this node was filed to settle

The 7-REACHABLE / 7-orphan split is the discriminator, and it closes the question:
**there are two populations with two different causes, and neither is fixable by
trying harder inside the trap.**

1. **REACHABLE (7 refs) — the landing SUCCEEDED.** The content is on `main`; the
   writer got all the way past the fast-forward push. What did not happen is the
   delete. Either the process died in the window between the push and the trap, or
   the trap ran and `git push origin --delete` failed and the `|| true` ate the
   evidence. **Today those two are indistinguishable, and that indistinguishability
   is itself the defect** — it is exactly the silent-write-failure shape
   clarification 93 forbids ("every graph write that fails to land surfaces a
   diagnostic naming the node and the failure, and no call site may swallow the
   error"). The remedy is to report the failure. Note that the same file already
   contains the loud variant of this identical operation, with the rationale written
   out (`graph-commit:2884-2890`): *"No `|| true` here, unlike cleanup()'s
   best-effort delete … Fail loudly instead (code-style.md)."*

2. **orphan (7 refs) — the landing NEVER happened.** The writer died mid-stamp: no
   trap, nothing on `main`, ref stranded. This is not a hypothesis — the suite
   already reproduces it and asserts it as expected behaviour: cases 54/55
   (`test-graph-commit.sh:2684-2733`) SIGKILL a writer parked inside `await_checks()`
   and assert `scratch_refs()` is non-empty, *"the kill landed after the scratch push
   (no cleanup ran — the branch survives)"*. No in-process defense can close this
   window; only an out-of-band collector can.

So the answer to "why do writers keep leaking these" is: **half the leak is writer
mortality that no trap can cover, and half is a swallowed delete failure that no one
can currently see.** The fix is one collector plus one diagnostic — and the collector
must *report* the two-population split rather than silently tidying it away, because
the accumulation is the only sensor the fleet has for writer mortality (the node's own
caution: *"the sweep alone restores the namespace but discards the reading"*).

The provenance question this node left open is also now **answered**.
`graph/tactic-align-tactics-skill-prune-manual` — the one ref with no `-<pid>` suffix,
so not produced by graph-commit's naming — is commit `3c8ce0e5`, authored by Nathan
Buesgens on 2026-07-05, subject `graph: clear dangling tactic-align-tactics-skill
blocked_by edges (tactic-legacy-router-removal, tactic-graph-router-selector) after
prune`, touching two `intentions/` files and nothing else. It is a hand-run stamping
push with a hand-chosen branch name, and it is REACHABLE from `main` — its content
landed. It needs no special-casing and deleting it loses nothing.

### Greenfield, and why this node is not it

The ideal design is that `refs/heads/graph/**` **does not exist**. That is
`graph/tactic-graph-ref-split`: under its plumbing landing loop the commit is built against a
throwaway index and fast-forwarded onto `origin/graph-main` as a CAS push, with no
scratch branch and no CI stamp, so there is nothing to leak and nothing to sweep. That
remains the ratified greenfield and this plan does not compete with it.

It is also not the critical path here. Measured: `tactic-graph-ref-split` is
`phase: implement` with 37 `blocked_by` edges — 14 done, 23 still open, 10 of those
carrying an `office_hours` park — and clarification 237 records the reading that those
blockers may encode "a quiescence wish rather than real dependencies" as an *open
question* (`tactic-graph-refsplit-blocker-audit`), not a settled finding. That same
clarification set the precedent for exactly this situation: ref-split "stays the
greenfield; it is not the critical path for this invariant", and a same-class fix
needing none of its blockers was deliberately carried separately
(`tactic-graph-commit-plumbing-default`).

So the **achievable greenfield for this node** is the second-best shape, and it is
chosen on its own terms rather than as a compromise: **make the scratch namespace
self-healing by construction, owned by its only producer.** The sweep lives beside
`graph-commit`, is invoked by `graph-commit` itself, and is deleted in the same
cutover that deletes the scratch mechanism. Three consequences follow, and each is a
reason to prefer this over a dispatch-side reaper:

- **Cadence tracks production exactly.** The only thing that creates these refs is a
  `graph-commit` invocation, so sweeping on invocation means the collector runs
  precisely as often as the leak is produced — never more, never less.
- **It is reachable in every operating mode.** `graph-commit` runs under a paused
  fleet, under manual dispatch, from `/dispatch-ladder`, and from interactive align
  sessions. Clarification 96 is the cautionary record for the alternative: the
  reservation sweep was wired only into paths that reach selection, so in the standing
  paused + manual-only mode nothing swept it. A `dispatch-tick` arm would reintroduce
  that exact hazard and buy nothing, so **this plan deliberately does not add one.**
- **It dies with the mechanism.** When ref-split lands, `graph-scratch-sweep` and its
  cases are deleted alongside the scratch branch. A `TODO(tactic-graph-ref-split)`
  pointer in the script records that contract (pointer-only TODO per clarification 28).

There is **no brownfield migration** to write: no sweeper exists to migrate from. The
14-ref backlog needs no separate operation either — every one of them is weeks old, so
the first `graph-commit` invocation after this lands collects them all.

### Costs accepted, stated up front

- **One extra network round trip per `graph-commit` invocation** (a single wildcard
  fetch of `refs/heads/graph/*`). Deletes cost a second round trip only when something
  is actually stale, which in steady state is never. Condition 24 makes round-trip
  count a first-class cost, so this is a deliberate charge against a script that
  already spends a fetch, several `ls-remote`s, a scratch push, N check polls and a
  fast-forward push per run.
- The obvious saving — folding the scan refspec into the existing
  `git fetch origin main` at `graph-commit:3812` — is **rejected**: `MAIN_SHA` is
  `git rev-parse FETCH_HEAD` on the next line, and a multi-refspec fetch writes
  multiple `FETCH_HEAD` lines in no guaranteed order. `MAIN_SHA` is load-bearing for
  the base-freshness check, the far-ahead rebuild and the nothing-staged blob
  comparison; it is not worth one round trip. (This repo already contains a session
  that ran the combined form ad hoc — see the residue note in Unit 1.)

---

## Unit 1 — `graph-scratch-sweep`: the owned collector primitive

### Scope

**New file: `packages/intentionsutil/scripts/graph-scratch-sweep`** (executable bash,
no extension, sibling of `graph-commit`; matching `set -euo pipefail` and
`graph-commit: `-prefixed stderr conventions).

**Contract.** Enumerate every `refs/heads/graph/*` ref on `origin`, delete the ones
older than a TTL using a compare-and-swap delete, classify what it deleted as
REACHABLE-from-`main` or orphan, print one summary line, and **always exit 0**.

**CLI:**

```
graph-scratch-sweep [--repo <path>] [--main-sha <sha>] [--apply] [--list]
```

- `--repo <path>` — repo to run git from. Resolve exactly as `graph-commit` does:
  from the flag, else from cwd, **never** from the script's own location
  (`graph-commit:3677` uses `git -C "$RESOLVE_FROM" rev-parse --show-toplevel`; copy
  that). A `graph-commit`-family script that infers its repo from its own path is a
  recorded recurrence — do not reintroduce it.
- `--main-sha <sha>` — origin/main tip to classify reachability against. When absent,
  the script runs its own `git fetch origin main` and uses `FETCH_HEAD`. Present so
  `graph-commit` can hand over the tip it already pinned and spend no extra fetch.
- `--list` (default) — read-only: print the classification table and the summary, delete
  nothing.
- `--apply` — perform the deletes.

**Steps:**

1. **Scan — one round trip.**
   `git fetch --prune --no-tags origin '+refs/heads/graph/*:refs/graph-scratch-scan/*'`.
   A single fetch yields names, SHAs and the objects needed to date and classify them;
   an `ls-remote`-then-fetch pair would be two. Use a private `refs/graph-scratch-scan/`
   namespace — outside `refs/remotes/` so it can never be mistaken for a real
   remote-tracking ref, and outside both `refs/heads/graph/` and `refs/graph/`.
   Delete the whole scan namespace on exit via an EXIT trap **in addition to** the
   `--prune`. Concrete reason to do both: this repo's shared `.git` still carries
   `refs/remotes/origin-graph/landing-lock`, left by a 2026-08-09 ad-hoc
   `git fetch origin main 'refs/graph/*:refs/remotes/origin-graph/*'`, pointing at a
   lock payload (`holder=nixos-2217343-219215348 expiry=1786331245`) that expired and
   vanished from `origin` eleven days ago. An un-pruned scan fetch leaves exactly this.

2. **Age.** For each scanned ref take `%(committerdate:unix)` via
   `git for-each-ref --format='%(refname) %(objectname) %(committerdate:unix)' refs/graph-scratch-scan/`.
   Resolve `now` **once before the loop** from `GRAPH_SCRATCH_SWEEP_NOW_EPOCH` when set
   and integer-valued, else `date +%s` — the same test seam and integer-guard shape as
   `reservation_sweep` (`lib-reservation-ledger.sh:615-624`, inside `reservation_sweep()` at `:589`). A ref is **stale** when
   `now - committerdate > ttl`.

3. **TTL.** `GRAPH_SCRATCH_SWEEP_TTL_SECONDS`, integer-guarded with a regex check and
   a fallback to the baked default **14400 (4 h)**. Derivation, which belongs in the
   header comment: a live writer's scratch ref cannot outlive one `try_land()` call,
   bounded by `MAX_PUSH_ATTEMPTS` (5) × `CHECK_TIMEOUT_SECONDS` (180 s) plus
   `MAX_ORPHAN_RESTAMPS` (2) extra stamp cycles ≈ 21 minutes
   (`graph-commit:343, 355, 361`). The lock wait is outside that window because the
   scratch push happens after the lock is held. 4 h is ~11× the worst case. Tests move
   `now` forward rather than shrinking the TTL, so no unsafe-TTL floor is needed.

4. **Delete — CAS, not blind.** For each stale ref, delete with a lease against the
   exact SHA the scan observed:
   `git push --force-with-lease=refs/heads/graph/<name>:<observed-sha> origin :refs/heads/graph/<name>`.
   This is the same primitive `lock_release()` already uses on this remote
   (`graph-commit:2695`), so it is proven here. **It is the load-bearing safety
   property, not tidiness:** if a live writer re-pushed that branch between the scan
   and the delete — which a rebased retry attempt does — the lease fails, the ref
   survives, and the sweep prints a `lease-stale` skip line instead of deleting a
   branch a writer is mid-stamp against. That matters concretely because
   `graph-commit:2884-2890` `die`s when its own re-stamp delete fails, so a sweep that
   force-deleted under a live writer would kill that writer's run.
   Issue one push carrying every stale refspec with its own `--force-with-lease=` flag
   (one round trip); if that push exits non-zero, fall back to one push per ref so a
   single contended ref cannot block the rest, and report each outcome.

5. **Cap.** `GRAPH_SCRATCH_SWEEP_MAX_DELETES`, integer-guarded, default **25** —
   bounds both blast radius and the latency any single invocation can add.

6. **Classify and report.** For each ref, `git merge-base --is-ancestor <sha> <main-sha>`
   decides REACHABLE vs orphan. Print one line per acted-on ref and one summary line
   with a greppable prefix matching the file's existing self-diagnosis idiom
   (`detect_pre_existing_orphan`'s `graph-commit: orphan-detected: …` at
   `graph-commit:1499`), e.g.:

   ```
   graph-commit: scratch-sweep: swept 14 stale scratch ref(s) — 7 landed-then-not-deleted (REACHABLE from main: the delete failed or the writer died after the fast-forward), 7 died-mid-landing (orphan: content never landed); 0 left in place (still within the 14400s TTL), 0 skipped (lease stale — a live writer moved the ref)
   ```

   The REACHABLE/orphan counts are the writer-mortality reading, which is why they are
   in the summary rather than being tidied away. Deliberately **stderr only, no durable
   sensor file** — `graph-commit`'s stderr is captured by its callers (job dirs, ladder
   logs) and the greppable prefix is enough. Building a persisted latch here (the
   `repo-health` JSON shape) would be gold-plating for a mechanism scheduled for
   deletion by ref-split.

7. **Exit contract: always 0.** Every failure — the fetch, a push, a malformed ref —
   prints a named diagnostic and the sweep continues. This is a backstop collector; a
   hygiene failure must never abort a caller's landing, on the same footing as the
   other best-effort steps in `cleanup()`. Reconciling this with `code-style.md`: the
   rule this obeys is *never silent*, and the rule it deliberately does not obey is
   *never non-fatal*, because fatality here would make landing correctness depend on
   hygiene. Say so in the header comment — a reviewer will ask.

8. **Namespace guard.** The script constructs every remote refspec from the literal
   prefix `refs/heads/graph/` and never widens to `refs/graph/`. Add an explicit
   assertion that any candidate refname starts with `refs/heads/graph/` before it is
   put on a delete refspec.

9. **Retirement pointer.** Header comment carrying
   `TODO(tactic-graph-ref-split)`: under the ref-split plumbing landing loop there is
   no scratch branch, so this script and its cases are deleted in that cutover rather
   than ported.

**New test cases in `packages/intentionsutil/scripts/test-graph-commit.sh`** (append
after case 83, which begins at `:3705` and is the file's last case, so these are
84 onward — renumber if the file has moved). Put them here rather than in a new file:
this suite already owns `$ORIGIN`, `make_clone`, `scratch_refs()` (`:990`),
`drop_scratch_refs()` (`:1104-1109`), `lock_ref_exists()` (`:991`) and `plant_lock()`
(`:1936`), and it is the sole CI registration point
(`.github/workflows/unit-tests.yml:331` runs it directly). A new `test-*.sh` would need
new CI wiring, which is a recorded trap.

- New helper `plant_scratch_ref() { # <name> <sha> }` — `git -C "$ORIGIN" update-ref
  refs/heads/graph/<name> <sha>`, modelled on `plant_lock()` at `:1936` (which uses
  `commit-tree` + `update-ref` against the bare `$ORIGIN` for exactly this purpose).
- **Case 84 — TTL gate.** Plant two scratch refs. Run `graph-scratch-sweep --apply`
  with `GRAPH_SCRATCH_SWEEP_NOW_EPOCH` set far in the future for the first invocation
  and at the real `now` for the second; assert the far-future run deletes both and the
  real-now run deletes neither. Assert via `scratch_refs()`, not a fresh git call.
- **Case 85 — the landing lock is never touched.** `plant_lock` a live lock, plant a
  stale scratch ref, sweep with a far-future `NOW_EPOCH`, assert the scratch ref is
  gone and `lock_ref_exists` still holds. This is the runtime complement of the
  static disjointness assertion at `:2004-2007`.
- **Case 86 — lease safety.** Plant a stale ref; run the sweep with a test seam
  `GRAPH_SCRATCH_SWEEP_LEASE_STALE_FOR=<refname>` that makes the sweep offer a bogus
  lease SHA for that one ref; assert the ref **survives**, a `lease-stale` skip line is
  printed, and the exit code is still 0. Implement the seam in the script (a
  documented, test-only override of the observed SHA) so the real CAS path is what
  runs — a source grep would not prove this.
- **Case 87 — the mortality reading.** Plant one ref at a commit that IS an ancestor of
  `$ORIGIN`'s `main` and one at an orphan commit; sweep with a far-future `NOW_EPOCH`;
  assert the summary line reports 1 REACHABLE and 1 orphan.
- **Case 88 — `--list` is read-only.** Plant a stale ref, run with no `--apply`, assert
  it is still present, the classification line is printed, and the exit code is 0.
- Every new case must leave the origin clean (`drop_scratch_refs`) so the end-of-suite
  assertion at `:3722-3727` (`no graph/** scratch branches remain on origin after all
  cases`) still passes.

**Out of scope for this unit:** any change to `graph-commit` (Unit 2); any
`dispatch-tick` / `dispatch-sweep` wiring (rejected above with reasons); any change to
how `main` is stamped or protected; `refs/graph/landing-lock`, owned by
`graph/tactic-graph-commit-landing-lock` (phase done).

### Recommended model

opus

---

## Unit 2 — `graph-commit`: invoke the collector, and stop swallowing its own delete failure

### Scope

Three edits in `packages/intentionsutil/scripts/graph-commit` (4012 lines at the time
of writing; re-verify each anchor before editing), plus one test case.

**Edit A — invoke the sweep at startup, on every path.** In `main()`, immediately
after the `detect_pre_existing_orphan` call at `:3818`. That placement is chosen, not
incidental: it is after `MAIN_SHA` is pinned at `:3813` (its fetch at `:3812`), so the sweep gets the tip for
free via `--main-sha` and spends no fetch of its own, after `REPO_ROOT` is resolved at
`:3677`, and **before** the landing lock is claimed inside `try_land()`, so the sweep
never runs inside the critical section and cannot serialize against other writers. It
also mirrors the idiom already at that spot — announce a self-diagnosed leak condition
at startup on EVERY path, including the otherwise-silent nothing-staged one.

```sh
# Collect scratch refs earlier runs leaked. A SIGKILL fires no trap, so cleanup()'s
# delete never runs for a writer killed mid-stamp; and when it does run its failure is
# reported but not retried. Neither is fixable in-process, so the namespace is swept by
# its own producer, once per invocation. Outside the landing lock by construction: this
# runs before try_land() claims it.
# TODO(tactic-graph-ref-split): deleted with the scratch mechanism at that cutover.
if [[ "${GRAPH_SCRATCH_SWEEP:-1}" != "0" ]]; then
  if ! "$SCRIPT_DIR/graph-scratch-sweep" --repo "$REPO_ROOT" --main-sha "$MAIN_SHA" --apply >&2; then
    echo "graph-commit: scratch-sweep exited non-zero — its contract is ALWAYS-0, so this is a sweep bug, not a landing failure; continuing (hygiene never blocks a landing)" >&2
  fi
fi
```

Resolve the sibling via the existing `SCRIPT_DIR` (`graph-commit:332`), which is
already the sanctioned way this file locates siblings (`MERGE_NODE_SCRIPT` at `:336`).
No `|| true` — a non-zero exit is impossible by the sweep's contract, so if one
happens it is reported loudly rather than swallowed.

`GRAPH_SCRATCH_SWEEP=0` is the opt-out, for tests that must not have their planted
refs collected.

**Regression risk to check, not assume:** cases 53-57 (`test-graph-commit.sh:2618-2854`)
deliberately leave orphaned scratch refs and later cases run `graph-commit` again in
the same `$ORIGIN`. With `GRAPH_SCRATCH_SWEEP_NOW_EPOCH` unset those planted refs are
seconds old against a 4 h TTL, so they must not be swept — confirm by running the whole
suite, and if any pre-existing case does break, set `GRAPH_SCRATCH_SWEEP=0` for that
case rather than shortening the TTL.

**Edit B — make the trap's delete failure observable.** Replace `graph-commit:902-904`:

```sh
  if [[ "$SCRATCH_PUSHED" -eq 1 && -n "$SCRATCH_BRANCH" ]]; then
    git push origin --delete "$SCRATCH_BRANCH" >&2 \
      || echo "graph-commit: scratch-delete-failed: could not delete $SCRATCH_BRANCH on origin — it is now a leaked scratch ref and graph-scratch-sweep will collect it once it passes the TTL. This says nothing about whether this run's content landed; read the verdict line for that." >&2
  fi
```

Still non-fatal — `cleanup()` must return `$rc` and a hygiene failure must not mask the
real exit status — but no longer silent. This is the point of the diagnosis above: the
REACHABLE half of the leaked population is currently indistinguishable between "writer
died after the fast-forward" and "delete failed and nobody heard", and this edit
separates them going forward. Follow the in-file precedent's reasoning at
`graph-commit:2884-2890`, which makes the identical operation loud (there it `die`s,
because there the re-stamp is a lie without it; here correctness does not depend on the
delete, so reporting is the right strength).

**Edit C — reconcile the two stale comments.** `cleanup()`'s header at
`graph-commit:846-851` currently reads *"The remote delete is best-effort — a leftover
scratch branch is harmless and would be overwritten by the next same-PID run — so its
failure never masks the real exit status."* That is now half-wrong in a way this node
exists to correct: PIDs recycle across machines rarely enough that in practice the
branches accumulate indefinitely (14 of them, spanning six weeks). Rewrite it to say
the delete is best-effort and non-fatal, that its failure is now REPORTED, and that
`graph-scratch-sweep` is the collector for both this path's failures and the SIGKILL
path that never reaches the trap at all. Extend the header block's defense summary at
`graph-commit:89-94`, which today names detection-plus-recovery for orphan *commits*
only, to name the scratch-ref leak and its collector alongside them.

**New test case in `test-graph-commit.sh`** (case 89, or next free number):
plant a scratch ref, run `run_gc` on a happy-path edit with
`GRAPH_SCRATCH_SWEEP_NOW_EPOCH` set far in the future, and assert both that the edit
landed (`origin_show`) and that the planted ref is gone (`scratch_refs()`) — proving
the startup call site actually fires on a normal landing path, not only when invoked
standalone. Clean up with `drop_scratch_refs` so `:3722-3727` still passes.

**Out of scope for this unit:** the sweep script itself (Unit 1); any change to the
landing lock, the check-stamp cycle, `await_checks`, or the rebase/push retry loop; any
change to how `main` is stamped or protected.

### Dependencies

Unit 1 (the script must exist before `graph-commit` invokes it).

### Recommended model

sonnet

---

## Reuse

- `packages/intentionsutil/scripts/graph-commit:2695` — `lock_release()`'s
  `git push --force-with-lease="$LOCK_REF:$LOCK_SHA" origin ":$LOCK_REF"`. The exact
  CAS-delete form Unit 1 step 4 needs, already proven against this remote.
- `packages/intentionsutil/scripts/graph-commit:2537-2695` — the landing lock's
  distributed CAS + TTL-steal design (`build_lock_commit`, `read_lock_payload`,
  `lock_claim_or_renew`, `lock_release`). The in-file precedent for reclaiming shared
  remote git-ref state abandoned by a dead writer; the header prose at `:2537-2560`
  is the model for the sweep's own header.
- `packages/intentionsutil/scripts/graph-commit:1491-1500` — `detect_pre_existing_orphan()`,
  the "announce a self-diagnosed leak condition at startup on EVERY path" idiom, and
  the `graph-commit: <tag>: …` greppable stderr prefix the sweep's summary copies.
- `packages/intentionsutil/scripts/graph-commit:2884-2890` — the loud, `die`-on-failure
  variant of the same `git push origin --delete "$SCRATCH_BRANCH"`, with its written
  rationale contrasting itself against `cleanup()`'s swallowed one. The argument Edit B
  reuses.
- `packages/intentionsutil/scripts/graph-commit:332` (`SCRIPT_DIR`) and `:336`
  (`MERGE_NODE_SCRIPT`) — how this file locates and invokes a sibling script.
- `packages/intentionsutil/scripts/graph-commit:3677` — repo resolution from
  `-C`/`--repo`/cwd via `git -C "$RESOLVE_FROM" rev-parse --show-toplevel`, never from
  the script's own location. Copy this; the inverse is a recorded recurrence.
- `packages/intentionsutil/scripts/graph-commit:343, 355, 361-370` —
  `MAX_PUSH_ATTEMPTS`, `MAX_ORPHAN_RESTAMPS`, `CHECK_TIMEOUT_SECONDS`,
  `LOCK_TTL_SECONDS`. The constants the sweep's TTL derivation is argued from.
- `packages/intentionsutil/scripts/test-graph-commit.sh:990` — `scratch_refs()`, the
  namespace-enumeration accessor every new assertion should go through.
- `packages/intentionsutil/scripts/test-graph-commit.sh:991` — `lock_ref_exists()`, for
  case 85.
- `packages/intentionsutil/scripts/test-graph-commit.sh:1104-1109` —
  `drop_scratch_refs()`, the enumerate-and-delete loop shape and the per-case teardown.
- `packages/intentionsutil/scripts/test-graph-commit.sh:1936-1947` — `plant_lock()`,
  the `commit-tree` + `update-ref`-into-bare-`$ORIGIN` seeder that `plant_scratch_ref()`
  is modelled on.
- `packages/intentionsutil/scripts/test-graph-commit.sh:2004-2007` — the lock/scratch
  namespace-disjointness assertion; case 85 is its runtime complement.
- `packages/intentionsutil/scripts/test-graph-commit.sh:2684-2733` — cases 54/55, the
  SIGKILL harness that already produces a genuine orphaned scratch ref. Nothing new
  needs building for the kill path.
- `packages/intentionsutil/scripts/test-graph-commit.sh:3722-3727` — the end-of-suite
  "no scratch branches left behind anywhere" check every new case must not break.
- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:615-624` (in `reservation_sweep()`, `:589`) —
  `reservation_sweep`'s resolve-`now`-once, `*_NOW_EPOCH` test seam, and
  integer-guard-with-regex-fallback pattern for TTL knobs. Copy the shape, not the file
  (the sweep lives in `packages/intentionsutil/scripts/`, not `dispatch-propagate`).
- `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:1-210` (header; `session_reap_sweep()` at `:482`) — the closest
  sibling sweep: reclaims state a killed session's own cleanup never reached, with an
  ALWAYS-0 / fail-safe-means-keep contract and one summary line. Its header is the
  template for the sweep's diagnosis write-up.
- `.github/workflows/unit-tests.yml:331` — the sole CI registration for
  `test-graph-commit.sh`. New cases inside that file need no new CI wiring; a new test
  file would.

## Verification

```verify
bash -n packages/intentionsutil/scripts/graph-scratch-sweep || exit 1
bash -n packages/intentionsutil/scripts/graph-commit || exit 1
packages/intentionsutil/scripts/test-graph-commit.sh
```

The suite is the one CI runs (`.github/workflows/unit-tests.yml:331`) and it must end
with `passed: N  failed: 0`, including the pre-existing SIGKILL cases 53-57 and the
end-of-suite `no graph/** scratch branches remain on origin after all cases` assertion.

Also run the repo lint before pushing:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / observe-in-production, after merge.** These cannot be automated because they
read the live `origin`:

1. Baseline before the first post-merge `graph-commit` run:
   `git ls-remote origin 'refs/heads/graph/*' | wc -l` — expect **14** (the count
   measured 2026-08-20; it may have grown).
2. Let one `graph-commit` invocation run (any node write, or invoke the sweep
   standalone: `packages/intentionsutil/scripts/graph-scratch-sweep --repo <repo> --apply`).
   Read its stderr for the `graph-commit: scratch-sweep:` summary and **record the
   REACHABLE / orphan split** — that split is the writer-mortality reading this node
   exists to preserve, and a run reporting a large orphan count is evidence that
   writers are still dying mid-landing at a rate worth a separate tactic.
3. Re-count: `git ls-remote origin 'refs/heads/graph/*' | wc -l` — expect only refs of
   writers currently in flight (0-2), because every one of the 14 is weeks past a 4 h
   TTL.
4. Re-count again several days later. The steady-state expectation is that the count
   stays bounded by concurrent-writer count rather than growing monotonically. If it
   grows again, the sweep is not being reached on some path and that is a new finding,
   not a re-run of this one.
5. Judgment call, deliberately left to a human: if step 2 reports a **REACHABLE** count
   that keeps rising after this lands, that means `git push origin --delete` is failing
   against `origin` for a reason Edit B now names in the log. Read those
   `graph-commit: scratch-delete-failed:` lines before concluding anything — the whole
   point of Edit B is that this class was previously invisible, so its first
   measurements are new information rather than a regression.

**Do NOT touch.** `refs/graph/landing-lock` is deliberately outside
`refs/heads/graph/**` and is owned by `tactic-graph-commit-landing-lock` (phase done);
`test-graph-commit.sh:2004-2007` asserts the namespaces stay disjoint, and case 85 adds
the runtime guard. Never widen any sweep glob from `refs/heads/graph/*` to
`refs/graph/*`. Confirmed against the live remote this round: `refs/graph/*` on
`origin` is currently empty, so a widened glob would silently do nothing today and
delete a live lock the moment a writer holds one.
