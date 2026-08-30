---
id: tactic-review-stall-predicate-subprocess-spawn
kind: tactic
statement: Stop spawning a node --import tsx/esm subprocess per candidate per
  tick in reconcile-graph-review-stall to evaluate the pure reviewStallRoute
  predicate, by adding the documented superset cost-guard pre-filter (ci ==
  failing || mergeable == CONFLICTING) that already ships on the sibling
  graph-select-target callsite — leaving transitions.ts the single source of
  truth for the routing decision
owner: ai
status: codified
parent: null
rationale: null
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

# Stop spawning a `node --import tsx/esm` subprocess per candidate per tick to evaluate the pure `reviewStallRoute` predicate

## Context

**Where this came from.** Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`). Original finding: inside
`reconcile-graph-review-stall`'s per-candidate loop, a fresh `node --import tsx/esm -e`
subprocess is spawned for every candidate on every tick, solely to evaluate what is a pure
two-string boolean function of values the shell has already computed. It happens inside
`dispatch-select-tick` while the tick holds `dispatch.lock`, so it directly extends the
window during which the whole fleet is serialized behind the tick. It is an N+1 process
spawn over a set that grows with the graph, amplified by every-tick execution, for zero I/O.

**Adversarial verdict** (carried forward): not adversarially verified — a cost/scaling
advisory finding, not a `Required` security finding, so the adversarial-verify step was
skipped for it (cost findings are always `Deferred`, never `Required`).

**Source PR**: #2920.

### Corrections to the original finding — measured on `origin/main` 1f7dc676, 2026-08-19

All five are load-bearing for the plan below. Each was re-measured in this worktree; do not
trust the numbers or anchors in the pre-finalize draft narrative, which this section replaces.

1. **The line anchor is dead.** The draft cited `reconcile-graph-review-stall:220`. The file
   is now 340 lines; the per-candidate predicate spawn is at **lines 258-266**:

   ```bash
   ROUTE=$( (cd "$REPO_ROOT" && node --import tsx/esm -e '
     const { reviewStallRoute } = await import("./packages/intentionsutil/src/transitions.js");
     const ci = process.argv[1];
     const mergeable = process.argv[2];
     process.stdout.write(String(reviewStallRoute(ci, mergeable)));
   ' "$VERDICT" "$MERGEABLE") ) || {
     echo "reconcile-graph-review-stall: reviewStallRoute eval failed for $id" >&2
     continue
   }
   ```

   It sits inside the `while IFS=$'\t' read -r id pr; do` loop that opens at **line 216**.
   **Locate it by the symbol `reviewStallRoute`, never by line number** — a sibling tactic
   is editing the same file concurrently (see correction 5) and these anchors will drift.

2. **The per-spawn cost is ~100 ms, not the 0.5-1 s the draft claimed.** Measured, 3 runs
   each, this worktree: the exact `node --import tsx/esm -e '…reviewStallRoute…'` one-liner
   costs **131 / 100 / 100 ms**; a bare `node --import tsx/esm -e 'void 0'` costs
   **93 / 92 / 91 ms**. The 0.5-1 s figure belongs to the *enumeration* spawn at line 188,
   which additionally parses the whole `intentions/` store (~376 ms of store parse) — a
   different subprocess owned by a different tactic. So this spawn is ~92 ms of tsx bootstrap
   plus ~8 ms to transpile and import `transitions.js`. Size the fix to ~100 ms × candidates,
   not to seconds.

3. **`CAP` does not bound the spawn count.** `CAP="${GRAPH_REVIEW_STALL_CAP:-3}"`
   (`reconcile-graph-review-stall:118`) and the `[[ "$ACTED" -ge "$CAP" ]] && break` at
   **line 220** bound the nodes *acted on*, not the nodes *examined*. A candidate whose route
   is `null` (the overwhelmingly common case — a reviewed node waiting on auto-merge is green
   and MERGEABLE on every tick until something regresses) never increments `ACTED`, so the
   loop reaches the spawn for **every** candidate, every tick, forever. The N+1 is real and
   uncapped.

4. **The candidate set is small today: 4 nodes at `phase: review` in `intentions/` at
   1f7dc676.** So the honest win today is ~0-400 ms per tick of lock-hold, not seconds. This
   plan is sized to that: one ~9-line guard copied verbatim from an already-shipped sibling,
   plus three regression cases in an existing harness. **No new primitive, no new module, no
   batching layer.** If a future reader is tempted to build something larger here, correction
   2 and this count are why they should not.

5. **A sibling tactic is editing this same file right now.**
   `tactic-review-stall-listnodes-duplicate-scan` is at `phase: implement` and rewrites the
   enumeration block at `reconcile-graph-review-stall:188-207` (plus `graph-auto-merge`,
   `reconcile-graph-merged`, `reconcile-graph.ts`, `dispatch-select-tick`). Its own plan says
   verbatim: "This tactic owns the NODE ENUMERATION only. Do not fold … the per-candidate
   predicate subprocess into this work." The two changes are in different regions of the same
   file (enumeration at ~188-207 vs. the loop body at ~250-270) and should merge cleanly;
   whichever lands second must `git merge origin/main` early and re-locate its anchors by
   symbol.

**Intended outcome.** The common case — a reviewed node whose PR is green and MERGEABLE —
costs **zero** subprocesses in this sweep. The predicate's decision stays in TypeScript,
unchanged and un-duplicated. The change is a verbatim application of a guard that already
ships on the sibling callsite for the same function.

## Design

### Greenfield

**Add the documented superset pre-filter that already ships on the sibling callsite. Do not
reimplement the routing rule in bash, and do not batch.**

`reviewStallRoute` (`packages/intentionsutil/src/transitions.ts:301`) is a one-line delegate:
`return interruptRoute("review", ci, mergeable)`. `interruptRoute`'s body
(`transitions.ts:349-353`) is:

```ts
if (mergeable === "CONFLICTING") return "conflict";
if (fixInterrupt(phase, ci)) return "fix";
return null;
```

The doc comment above `interruptRoute` (`transitions.ts:342-347`) already publishes the
exploitable property, in these words:

> A `null` return means no interrupt is due. The only two conditions that can produce a
> non-null route are `ci === "failing"` and `mergeable === "CONFLICTING"` — a superset
> invariant a shell caller may exploit as a cheap pre-filter
> (`ci === "failing" || mergeable === "CONFLICTING"`) before paying for a full call, and
> which a later test pins so that optimization stays correct.

That test exists and is exhaustive: `packages/intentionsutil/test/transitions.test.ts:295`,
`it("returns null whenever neither a failing verdict nor CONFLICTING holds (the shell
pre-filter's superset invariant)")`, looping phases × `{passing, unknown}` ×
`{MERGEABLE, UNKNOWN}`. **Do not author a duplicate of that test.**

The other consumer of the same function already carries the guard.
`.claude/skills/dispatch-propagate/scripts/graph-select-target`, function
`_gate_maybe_interrupt` (opens at **line 759**), lines **765-772**:

```bash
  # Cost guard, NOT the routing rule: interruptRoute returns null unless CI is
  # failing or the PR is CONFLICTING, so skip the node subprocess when neither
  # holds (the overwhelmingly common case). This condition MUST stay a
  # superset of interruptRoute's non-null conditions; the transitions.test.ts
  # case named for "the shell pre-filter's superset invariant" pins that.
  if [[ "$_CI_VERDICT" != "failing" && "$_CI_MERGEABLE" != "CONFLICTING" ]]; then
    return 1
  fi
```

The review-stall sweep is the one remaining bridge callsite that lacks it. This is reuse to
copy, not a design to invent.

**Why this is not the "ONE IMPLEMENTATION, NOT TWO" anti-pattern.**
`.claude/skills/dispatch-propagate/scripts/dispatch-review-plan-gate:1-31` warns that a bash
copy of decision rules "would drift from the first, and the direction it would drift is
toward being cheaper." That warning is about *deciding* in bash. This guard decides nothing:
it only skips a call whose answer TypeScript has *published and test-pinned* as `null`.
Every route that is actually taken is still computed by `reviewStallRoute` in the same
subprocess as today. The boundary the `FIX_ATTEMPT_CAP` / `CONFLICT_ATTEMPT_CAP` bash mirrors
respect (`graph-select-target:661-673` — mirrors narrate, they never decide) is respected
here too, and more strictly: nothing is mirrored at all, only a superset skip.

**Why not batching.** The tactic statement offered "or batching all candidates through one
subprocess call." Rejected, and this is the recorded decision, not an open question:

- Batching still pays ~100 ms on **every** tick, including the quiet ticks that are the
  entire population today. The guard pays **zero** on those ticks.
- Batching is a genuinely new pattern in this script family — no existing callsite passes an
  array of tuples to one node process and reads back N decisions (checked `graph-auto-merge`,
  `dispatch-eval-finding`, `dispatch-fleet-watch`: all loop-and-spawn). New shape, new
  failure modes (partial output, ordering, per-id error attribution), for a set of 4.
- The residual the guard does not remove — a candidate that genuinely regressed — is bounded
  by how many PRs are simultaneously red or conflicting, which is small and is the case where
  paying 100 ms is obviously fine.

If the candidate population ever grows such that the *regressed* subset alone is large, batch
then. Not now.

### The guard's shape: keep the full documented superset, do not narrow to `ci == failing`

This is the one real judgment call in the unit, and the choice is recorded here so the
implementer does not relitigate it.

In **this** sweep the `conflict` route is a deliberate retired no-op
(`reconcile-graph-review-stall:296-303`, `tactic-graph-router-conflict-routing`: the selector
handles CONFLICTING via `execution.conflict` on every tick, so acting here would
double-handle). So `mergeable == CONFLICTING` currently falls straight to `continue` with
nothing staged. It is therefore tempting to narrow the guard to `ci == failing` alone and
skip the spawn for conflicting PRs too.

**Do not.** Keep `[[ "$VERDICT" != "failing" && "$MERGEABLE" != "CONFLICTING" ]]`:

- The superset (`failing` OR `CONFLICTING`) is the invariant `transitions.ts:342-347`
  documents and `transitions.test.ts:295` pins. `ci == failing` alone is *not* pinned by
  anything — it would rely on the local, incidental fact that this sweep's `conflict` arm is
  currently retired.
- `tactic-review-stall-conflict-lane` (open draft, `phase: null`) proposes un-retiring exactly
  that arm — routing a CONFLICTING reviewed node into the conflict resolution lane instead of
  no-oping. Clarification 135 records conflict-outranks-CI as doctrine everywhere. A narrower
  guard would silently become wrong the moment that lands, and would fail silently (the sweep
  would just stop seeing conflicts), which is the worst failure shape for this script.
- Symmetry with `_gate_maybe_interrupt` means one rule to review, one comment to keep in step,
  one test name to grep for.

The cost of the wider guard is that a CONFLICTING-but-green candidate still spawns once per
tick and then hits the retired `conflict) continue`. That set is the same one the selector is
already handling every tick, and it is small. Accepted.

### Placement: after the existing edge validation, before the spawn

The guard belongs **after** both existing normalizations and **before** the `ROUTE=` spawn.
Both of the following must keep running for every candidate — they are the
projection-change alarm, not an optimization, and skipping them would trade a cheap
subprocess for a silent sensor failure:

- `case "$MERGEABLE" in MERGEABLE|CONFLICTING|UNKNOWN) ;; *) …loud stderr…; continue ;; esac`
  at **lines 244-251** (its comment: an out-of-union value "would silently route to `null`
  and the sweep would stop recovering with no signal at all").
- `case "$RAW_VERDICT" in passing|failing) VERDICT="$RAW_VERDICT" ;; *) VERDICT="unknown" ;;
  esac` at **lines 252-257**.

Everything above the guard — `refresh_lock`, `gh_pr_view_rest`, the `STATE != OPEN` skip,
`HEAD_SHA`, `dispatch_ci_verdict_rest` — is untouched by this tactic.

### Composition with the adjacent CI-verdict tactic (ordering-sensitive — read this)

`tactic-review-stall-ci-verdict-cache-miss` (open draft, `phase: null`) proposes reading
`.mergeable` **first** so that a CONFLICTING PR short-circuits without calling
`dispatch_ci_verdict_rest` at all. That reorders the very two variables this guard reads. The
composition rule, stated so neither tactic silently breaks the other:

- **If this tactic lands first** (the expected order): the CI tactic must not weaken the
  guard. Its short-circuit is only legal on a path that has *already decided a non-null
  route* (CONFLICTING ⇒ `conflict`), i.e. it **bypasses** the guard rather than evaluating it
  with an unset `$VERDICT`. The guard must never be evaluated with `$VERDICT` unassigned —
  under `set -u` that is a crash, and without it an empty string would read as "not failing"
  and could suppress a real `fix` route.
- **If the CI tactic lands first**: this guard slots in unchanged, immediately before the
  `ROUTE=` spawn, on whichever path still reaches that spawn with both `$VERDICT` and
  `$MERGEABLE` assigned.
- Either way, neither tactic does the other's work in its own PR.

### Brownfield migration

None required. The change is additive, behavior-preserving by the pinned superset invariant,
confined to one loop body in one script, and needs no data migration, no config, and no
coordinated rollout. Skipping straight to the greenfield shape *is* the migration.

---

## Unit 1 — add the superset cost guard to `reconcile-graph-review-stall`

**Recommended model**: `sonnet`

**Scope.**

- **File changed**: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`
  — one insertion, no deletions.
- Insert the guard immediately **after** the `RAW_VERDICT`/`VERDICT` normalization
  `case` (ends at **line 257** on 1f7dc676 — locate it by the string `RAW_VERDICT`, not by
  line number) and immediately **before** the `ROUTE=$( (cd "$REPO_ROOT" && node --import
  tsx/esm -e '…reviewStallRoute…'` spawn (**lines 258-266**; locate by `reviewStallRoute`).
- The inserted text, adapted from `graph-select-target:765-772` — the only adaptation is
  `return 1` → `continue`, because this callsite is a loop body and the sibling is a function:

  ```bash
    # Cost guard, NOT the routing rule: reviewStallRoute (interruptRoute at the
    # fixed phase "review") returns null unless CI is failing or the PR is
    # CONFLICTING, so skip the node subprocess when neither holds — the
    # overwhelmingly common case, since a reviewed node waiting on auto-merge
    # reads green and MERGEABLE on every tick until something regresses. This
    # condition MUST stay a superset of reviewStallRoute's non-null conditions;
    # the transitions.test.ts case named for "the shell pre-filter's superset
    # invariant" pins that. Deliberately NOT narrowed to `ci == failing` even
    # though this sweep's `conflict` arm is a retired no-op today: that retirement
    # is local and reversible (tactic-review-stall-conflict-lane), while the
    # superset is the documented, test-pinned property. Verbatim sibling of
    # graph-select-target's _gate_maybe_interrupt guard — keep the two in step.
    if [[ "$VERDICT" != "failing" && "$MERGEABLE" != "CONFLICTING" ]]; then
      continue
    fi
  ```

- Behavior equivalence to verify by reading, not by guessing: the skipped path's only
  observable effect today is the `*)` arm of `case "$ROUTE"`, which is `continue`
  (locate it by its comment `null — no regression; nothing to route`). Nothing
  between the guard's insertion point and that arm has a side effect. So the guard
  is observationally identical on the skipped path.

  > **⚠ That equivalence is CONDITIONAL, and one sibling unit in this same PR
  > breaks it.** The proof holds only while nothing between the guard and the `*)`
  > arm has a side effect — it is a statement about `origin/main`, not an
  > invariant. `tactic-autonomous-ci-pending-liveness-bound` Unit 3 (PR5's U18)
  > plants a CI-pending strike counter and a `hold-node` route on exactly that
  > stretch. Landed *below* this guard, that counter is unreachable for its whole
  > target population — a pending candidate folds to `VERDICT="unknown"` on a
  > `MERGEABLE` PR, so the guard `continue`s first — and it would be dead code
  > that reads as shipped. **The resolution is on U18's side, and it is recorded
  > there**: U18 lands *above* this guard, immediately after the
  > `case "$RAW_VERDICT"` normalization fold. **Do not widen this guard to
  > accommodate it** — widening breaks the binding-superset rule the
  > `transitions.test.ts` "shell pre-filter's superset invariant" case pins, and
  > fails this node's own verify grep fence. Before landing any further unit into
  > this loop body, re-read this bullet and re-establish the no-side-effect
  > premise for the new code; it does not carry itself forward.
- **Explicitly out of scope in this unit — do not touch:**
  - `graph-select-target` — already carries this guard (lines 765-772). Editing it duplicates
    shipped work.
  - `reconcile-graph-review-stall:188-207`, the `listNodesStrict` candidate enumeration. It is
    O(1) per tick, its cost is a different order of magnitude (correction 2), and it is owned
    by `tactic-review-stall-listnodes-duplicate-scan`, currently at `phase: implement`.
  - `reconcile-graph-review-stall:288`, `node --import tsx/esm "$UTIL_SCRIPTS/apply-fix-state.ts"`
    — per *acted-on* candidate (rare, capped at `CAP`) and it does real graph I/O.
  - The `gh_pr_view_rest` fetch and the `dispatch_ci_verdict_rest` call — owned by
    `tactic-review-stall-pr-json-duplicate-fetch` and
    `tactic-review-stall-ci-verdict-cache-miss` respectively.
  - `packages/intentionsutil/src/transitions.ts` — no TypeScript change is needed or wanted.
    The invariant is already documented there and already pinned.
  - `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` — the sweep's invocation
    at ~line 563 is unchanged.
  - `tactic-reconcile-review-stall-base-pin`'s subject matter (the `--base` pinning), a
    correctness defect, not a cost one.

**Dependencies.** None.

---

## Unit 2 — pin the guard with regression cases in the existing harness

**Recommended model**: `sonnet`

**Scope.**

- **File changed**: `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh`
  — append new cases **after the whole existing Case 10 block** (its `10a` / `10b` /
  `10c` sub-cases and the `--node` usage-error tail that closes `10c`) and
  **immediately before the `# Case 11:` banner comment**. Locate both ends by banner
  text: `# Case 10c: without the flag, existing behavior is unchanged` opens the
  last existing sub-case, and
  `# Case 11: graph-select-target's interrupt gates roll their write back` opens
  what must stay below you. No line numbers — five sibling PR5 units edit this file,
  so any number cited here is stale before it is read. No other test file changes.
- There is **no** standalone `test-reconcile-graph-review-stall.sh`; all coverage of this
  script lives in Case 10 of the above file. Extend it; do not build a new harness.
- CI discovery is automatic: `run-unit-tests.sh:88` sets `RUN_PR_SCRIPTS=true` on any changed
  path under `.claude/skills/dispatch-propagate/scripts/`, and `:190-198` loops
  `for test_script in "$SCRIPTS"/test-*.sh`. No yml or registration list to update.

**Reuse verbatim, with no changes** (all in the same file):

- `build_seed_repo` / `new_origin` / `init_and_push` / `clone_with_node_modules`
  (the four fixture builders defined near the top of the file, above `Case 1`) —
  build a real repo + bare origin + a clone carrying the *real*
  `packages/intentionsutil/src`, so `node --import tsx/esm` runs the **actual**
  `reviewStallRoute`, not a stub. This is what makes a spawn-count assertion meaningful.
- `review_stall_gh_stub <bin-dir> <fixture-dir>` (defined under the `# Case 10:` banner) — the `gh` stub for the
  two REST surfaces the sweep polls. It writes `$fixdir/checkruns-red.json` (one failing
  check-run) and serves it for every sha, and serves an inline-defaulted OPEN/MERGEABLE PR
  unless `$fixdir/pr-<n>.json` exists.
- `review_stall_node <file> <id> <pr>` (defined immediately after `review_stall_gh_stub`, above the `# Case 10a:` banner) — a minimal tactic at
  `phase: review` with the `reviewed` marker, an OPEN pr, `execution.fix: null`.
- The graph-commit stub + assertion conventions from **Case 10c** (banner `# Case 10c: without the flag, existing behavior is unchanged`): a fake
  `graph-commit` that does `printf '%s\n' "\$@" >"$WORK/t10X-argv.txt"; exit 0`, and
  frontmatter assertions via `grep -qE '^\s*since:' file.md` (the marker that
  `apply-fix-state --set-fix` wrote), plus `ok`/`no` for reporting.
- Fixture variation is done by **overwriting the fixture files** the stub already reads —
  this file's existing convention. Do **not** add a second stub function.

**The counting `node` shim** (the one genuinely new piece):

- Place a `node` wrapper first on `PATH` (same `$BIN10x` dir the `gh` stub lives in). It must:
  1. Append one line to a log file when **and only when** any argument contains the string
     `reviewStallRoute`.
  2. `exec` the **real** node for everything, with all arguments intact.
- Bake the real interpreter's absolute path into the shim at creation time
  (`command -v node` in the generating shell, interpolated into the heredoc) so the shim
  cannot recurse into itself.
- The filter on `reviewStallRoute` is what keeps the shim from counting the other two node
  calls the sweep makes: the enumeration `-e` script (contains `listNodesStrict`) and
  `apply-fix-state.ts`. Neither contains the string.

**The three cases to add.** *Names allocated 2026-08-30 to avoid a collision:* only
`Case 10`, `10a`, `10b` and `10c` exist on `origin/main`.
`tactic-review-stall-ci-verdict-cache-miss` Unit 2 (PR5's U10) owns **`10d`**; this
unit owns **`10e`, `10f`, `10g`**, numbered in run order. Do not rename them back —
an earlier revision called them `10e` / `10d` / `10f`, which both collided with U10's
case and required `10e` to run before `10d`. Fixture-dir and bin-dir variables follow
the case name (`$FIX10E`/`$BIN10E`, `$FIX10F`/`$BIN10F`, `$FIX10G`/`$BIN10G`).

- **Case 10e — the counter is real (run this one FIRST; it is the anti-vacuity control).**
  Two candidates, default **red** `checkruns-red.json`, default MERGEABLE PRs. Assert: rc 0,
  both nodes recovered (`^recovered t-rs1 -> fix`, `^recovered t-rs2 -> fix`), both files
  gained `since:`, **and the shim log has exactly 2 lines** (`wc -l`). Without this, Case 10f
  passes vacuously the moment the shim's match string goes stale.
- **Case 10f — the guard holds: green + MERGEABLE spawns nothing.** Same two candidates, but
  overwrite `$FIX10F/checkruns-red.json` with a passing run
  (`{"check_runs":[{"name":"unit-tests","status":"completed","conclusion":"success","id":1,"app":{"slug":"github-actions"}}]}`).
  Assert: rc 0; **the shim log file does not exist** (mirroring
  `test-graph-select-target.sh:1190-1192`'s `[ -f … ] && echo 1 || echo 0` shape); no
  `recovered` line on stdout; neither node file gained `since:`; the graph-commit argv file
  does not exist.
- **Case 10g — the guard stays a superset: CONFLICTING + green still reaches the predicate.**
  One candidate, green check-runs, plus a per-PR override `$FIX10G/pr-201.json` in the **raw
  REST** shape with `"mergeable": false` (`gh_pr_view_rest` maps `false` → `CONFLICTING`,
  `lib.sh:1232-1238`). Assert: the shim log has exactly 1 line (the guard let it through);
  rc 0; no `recovered` line and no `since:` write (the retired `conflict` arm no-ops). Name
  the assertion for the superset invariant so a future narrowing of the guard fails a test
  whose message says why — this is the case that will break if someone later "optimizes" the
  guard down to `ci == failing`.

**Shell conventions that apply to the added lines** (this file *is* a `.sh`, so
`lint-prose-rules.sh` enforces them on net-new lines): never `echo "$JSON_VAR" | jq` — use
`<<<"$VAR"` or `printf '%s'`. Keep double-quoted strings on one line inside heredocs.

**Explicitly out of scope**: `packages/intentionsutil/test/transitions.test.ts` — the
superset invariant is already pinned there at line 295, exhaustively. Adding a second copy is
a defect, not coverage. Also out of scope: `test-dispatch-select-tick.sh` (its stubs at
`:143` and `:867` assert the sweep's *invocation* from the tick and are unaffected) and
`test-graph-select-target.sh` (the sibling guard's own pins at `:1160-1192` are unaffected).

**Dependencies.** Unit 1.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/graph-select-target:759-772` —
  `_gate_maybe_interrupt`'s cost guard. **The source text to copy.** The only shipped
  instance of this exact guard.
- `packages/intentionsutil/src/transitions.ts:301` (`reviewStallRoute`), `:342-353`
  (`interruptRoute` + the doc comment publishing the superset invariant) — the single
  documented home of the routing rule and of the property this guard exploits. Read, do not
  edit.
- `packages/intentionsutil/test/transitions.test.ts:295` — the existing exhaustive pin of the
  superset invariant. Reuse by *citing* it in the guard comment; do not duplicate it.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:244-251` and
  `:252-257` — the `MERGEABLE` closed-union validation and the `VERDICT` normalization. Both
  already isolate exactly the two clean bash string variables the guard needs, at exactly the
  point it needs them. No new plumbing.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:661-673`
  (`FIX_ATTEMPT_CAP` / `CONFLICT_ATTEMPT_CAP`) and
  `dispatch-graph-execute:138-145` (`CONFLICT_STRIKE_CAP`) — the codebase's mirrored-constant
  convention and its never-decide-only-narrate boundary. Read for the doctrine; this change
  mirrors nothing, so no drift comment of that family is needed.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-plan-gate:1-31` and
  `test-dispatch-review-plan-gate.sh:98-99` — the "ONE IMPLEMENTATION, NOT TWO" counter-
  precedent. Read before touching the guard; the Design section above records why a superset
  skip is not the thing that doctrine forbids.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — the four
  top-of-file fixture builders (`new_origin`, `build_seed_repo`, `init_and_push`,
  `clone_with_node_modules`); `review_stall_gh_stub()` and `review_stall_node()`
  (both under the `# Case 10:` banner); **Case 10c**'s stub + assertion shape; and
  the `npx` interception shim inside **Case 11** — the one whose tail is
  `exec node --import tsx/esm "${args[@]}"`, which is the structural template for
  the counting `node` shim's `exec`-the-real-one tail. *(All cited by construct:
  five sibling PR5 units edit this file.)*
- `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh:1170-1192` — Cases 3
  and 4 there are the assertion shapes to mirror: "still reaches the cascade" (superset) and
  "spawns no node subprocess" (guard holds).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1228-1244` (`gh_pr_view_rest`'s jq
  projection) — the `mergeable: true|false|null` → `MERGEABLE|CONFLICTING|UNKNOWN` mapping
  the Case 10g fixture depends on.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,190-198` — the auto-discovery
  that makes the new cases run in CI with no registration.

## Verification

Run from the repo/worktree root.

The shell harnesses spawn `node --import tsx/esm` (npm cache) and do real git work. If a
fence fails with `Read-only file system`, `EROFS`, or an npm-cache error, retry that command
with `dangerouslyDisableSandbox: true` — that is a sandbox artifact, not a test failure.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
npm test --prefix packages/intentionsutil
```

The `intentionsutil` suite must stay green **unchanged** — in particular
`transitions.test.ts:295`, the superset-invariant pin the guard leans on. If that test needed
editing, the guard is wrong, not the test.

```verify
grep -q 'MUST stay a superset of reviewStallRoute' .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall
```

```verify
grep -q 'VERDICT" != "failing" && "$MERGEABLE" != "CONFLICTING"' .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall
```

Both greps are **positive** assertions that fail on `origin/main` today and pass only after
Unit 1 — check that they fail before the change, so they are not vacuous.

**Manual / judgment checks** (not auto-runnable):

- **Confirm Case 10e's counter is not vacuous by breaking it on purpose.** Temporarily change
  the shim's match string to something that cannot occur (e.g. `zzzNotAString`) and re-run
  the harness: Case 10e must go **red**. Revert. A spawn-count assertion whose counter never
  fires is worse than no assertion, and this is the only way to know which one you have.
- **Read the diff for accidental scope.** `git diff --stat` must show exactly two files:
  `reconcile-graph-review-stall` and `test-graph-write-rollback.sh`. Any hit on
  `graph-select-target`, `transitions.ts`, `transitions.test.ts`, `dispatch-select-tick`, or
  the enumeration block at `reconcile-graph-review-stall:188-207` means a sibling tactic's
  scope was absorbed — back it out.
- **Merge `origin/main` early**, before writing anything.
  `tactic-review-stall-listnodes-duplicate-scan` is in flight against the same file
  (correction 5). After merging, re-locate the insertion point by the symbols
  `RAW_VERDICT` and `reviewStallRoute`, never by the line numbers in this plan.
- **Observe in production, one tick.** After merge, on a tick where at least one node sits at
  `phase: review` with the `reviewed` marker and a green PR, confirm the review-stall sweep
  still emits nothing (no `review-stall:` lines in the tick output) and that the tick's
  lock-hold window did not grow. The absolute saving is small by correction 4 — the check is
  that nothing broke, not that a number moved.
- **Read the guard comment as a stranger would.** It must make a future reader who wants to
  narrow it to `ci == failing` stop and read `tactic-review-stall-conflict-lane` first. If it
  does not, rewrite it until it does.

## Notes carried forward

- This node is `claude_eligible` machinery work on an owned bash script plus its shell test
  suite. **No product surface, no user-facing copy, no data-viz** — no `/dataviz` unit here.
- The four sibling drafts on this same file must not be absorbed:
  `tactic-review-stall-ci-verdict-cache-miss` (adjacent and ordering-sensitive — the
  composition rule is recorded in the Design section above),
  `tactic-review-stall-pr-json-duplicate-fetch`,
  `tactic-review-stall-listnodes-duplicate-scan` (now `phase: implement`), and
  `tactic-reconcile-review-stall-base-pin` (a correctness defect, not a cost one).
  `tactic-review-stall-conflict-lane` is the one whose future landing this plan's guard shape
  is deliberately chosen to survive.
