---
id: tactic-review-stall-ci-verdict-cache-miss
kind: tactic
statement: Short-circuit a CONFLICTING candidate in
  reconcile-graph-review-stall's per-candidate loop on the .mergeable value
  already in hand, skipping the dispatch_ci_verdict_rest check-runs fetch and
  the reviewStallRoute subprocess spawn for a route the sweep discards as a
  retired no-op; the per-node head-sha memo the original finding also proposed
  is deliberately scoped out (rationale in the body)
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

# Skip the redundant per-candidate dispatch_ci_verdict_rest REST fetch in reconcile-graph-review-stall by reading .mergeable first (CONFLICTING short-circuits without a CI call)

## Context

**Origin.** Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`). Not adversarially verified — it
is a cost/scaling advisory finding, not a `Required` security finding, so the
adversarial-verify step was skipped for it (cost findings are always `Deferred`,
never `Required`).

**The budget at risk is the fleet's shared GitHub REST quota (5000/hr), not model
tokens.**

**The defect.** `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`
polls each stranded reviewed-awaiting-merge candidate on every sweep. Its
per-candidate loop (lines 216–306) already has the PR's `.mergeable` in hand at
line 238, but does not branch on it: it unconditionally reads `.headRefOid` (line
250), pays a full paginated `repos/{owner}/{repo}/commits/<sha>/check-runs` REST
fetch through `dispatch_ci_verdict_rest` (line 252), and then spawns a
`node --import tsx/esm` subprocess (lines 258–265) to evaluate `reviewStallRoute`.

For a `CONFLICTING` candidate that entire sequence is **100% waste**: the sweep's
`conflict` route is a *deliberate retired no-op* (`conflict)` arm at line 297,
`continue`, nothing staged), because `tactic-graph-router-conflict-routing`
(phase done) moved CONFLICTING routing wholly to the selector's `pending-merge`
candidate path — see the sweep's own header comment at lines 23–29. The sweep pays
a REST fetch and a subprocess spawn purely to compute a route it then throws away.

**Why the shared cache never covers it (verified 2026-08-19).** `DISPATCH_CI_VERDICT_CACHE`
has exactly one producer, `dispatch-select-tick:296–304`, which `mktemp -d`s the
directory and `rm -rf`s it on EXIT; `dispatch-ladder-run` unsets the variable
outright before every reconciler call (`dispatch-ladder-run:1128, 1161, 1195`, per
its cache note at 261–268, which cites this node by path). The memo is therefore
**per-tick and cannot survive across ticks at all.**

**Refinement of the original cost claim — measured this session, and load-bearing
for the scope decision below.** The sweep is invoked from `dispatch-select-tick:563`,
which is *before* `graph-select-target --top "$GAP"` at `dispatch-select-tick:1121`,
and it inherits the tick's **exported** cache dir. So on a tick that reaches
selection, the sweep's fetch *warms* the cache that the selector's
`_gate_pending_merge` → `_read_pr_ci` (`graph-select-target:719–735`, which calls
`dispatch_ci_verdict_rest` unconditionally) later hits — the two reads share one
fetch when the verdict is terminal. The saving from skipping the sweep's fetch is
therefore:

- **Unconditional elimination** on any tick that never reaches Step 3 — the
  autonomous path `exit 0`s at `dispatch-select-tick:848–853` on
  `concurrency-cap` / `at-cap-ceiling-full` / `live-read-unverified`, all *after*
  the sweep has already run. A paced-out, paused, or at-ceiling fleet is a
  standing operating mode, not an edge case.
- **Unconditional elimination** on the `/dispatch-ladder` path, where
  `dispatch-ladder-run` unsets the cache before calling
  `reconcile-graph-review-stall --node`, so nothing downstream can reuse the fetch.
- **Unconditional elimination** whenever the verdict is non-terminal (`pending`),
  since a pending verdict is deliberately never cached (`lib.sh:827–839`) — the
  sweep and the selector each pay their own fetch today.
- On a tick that does reach selection *and* the verdict is terminal, the fetch
  **moves** to the selector rather than disappearing; the subprocess spawn is still
  saved outright.

**The waste is not bounded by the sweep cap.** `GRAPH_REVIEW_STALL_CAP`
(default 3, `reconcile-graph-review-stall:118`) bounds nodes *acted on*: `ACTED` is
incremented only in the `fix` arm, and the `break` at line 220 tests `ACTED`. A
`CONFLICTING` candidate never increments it, so an arbitrary number of conflicting
stranded PRs can each pay a full fetch + spawn in one sweep.

**Correctness proof the fix rests on (do not re-derive it in shell).**
`interruptRoute` (`packages/intentionsutil/src/transitions.ts:349–353`), which
`reviewStallRoute` (:301–303) delegates to at the fixed phase `"review"`, reads
`if (mergeable === "CONFLICTING") return "conflict"` *before* consulting CI at all.
Its doc-comment at transitions.ts:342–348 explicitly sanctions this optimization:
the only two conditions producing a non-null route are `ci === "failing"` and
`mergeable === "CONFLICTING"` — "a superset invariant a shell caller may exploit as
a cheap pre-filter … before paying for a full call, and which a later test pins so
that optimization stays correct." That pinning test exists:
`packages/intentionsutil/test/transitions.test.ts:295` — *"returns null whenever
neither a failing verdict nor CONFLICTING holds (the shell pre-filter's superset
invariant)"*. Cite it; do not restate the precedence rule in bash.

**Intended outcome.** One paginated `check-runs` fetch (plus any orphan-path
`check-suites` follow-ups) and one `node --import tsx/esm` subprocess are removed
per CONFLICTING stranded candidate per sweep, with byte-identical routing outcomes
for every candidate, and no new state of any kind introduced.

### The terminal-only cache decision, and its accepted residual cost (2026-08-13) — carried forward, still binding

PR #3073's `/code-review high` rounds re-raised the verdict-cache miss while adding
the orphaned-check-run rule (`tactic-orphaned-check-run-pins-pending-ci-guard`,
phase done). That rule forced an explicit decision about *what*
`dispatch_ci_verdict_rest` may memoize: a sha classified `pending` while its check
suite was still running must be recomputed once the suite concludes, or the orphan
rule is shadowed by the very cache entry the orphan produced.

**The decision taken: the cache stays terminal-only.** Only a verdict that cannot
change again is memoized; a non-terminal verdict is recomputed on every read. This
is deliberate and **is not to be re-litigated as a caching bug** — it is what makes
the orphan rule sound. It is stated in code at `lib.sh:822–839`, with
`dispatch_ci_verdict_rest` defined at `lib.sh:840`. (The `lib.sh:829–831` anchor in
the original finding is stale; so was the `:214` anchor for the call site, now
line 252.)

**The accepted cost**, stated plainly so a later reader does not re-discover it as a
defect: roughly 2–3 redundant `check-runs` refetches per in-flight PR per tick. That
is the price of correctness under the terminal-only rule, and it was weighed and
accepted rather than overlooked. This node fixes the residual at the *caller* — the
only place left that can fix it — by not making the call at all.

### Fix 2 (persist the last-swept `headRefOid` per node) is deliberately SCOPED OUT — decision and rationale

The original finding proposed a second fix: persist the last-swept `headRefOid` per
node and skip candidates whose head sha is unchanged since the previous sweep
concluded no regression. **It is not planned here.** The reasoning, recorded so a
later round does not re-propose it without new evidence:

1. **No durable store exists.** Measured: there is no `DISPATCH_STATE_DIR` or
   equivalent in the dispatch scripts; `DISPATCH_CI_VERDICT_CACHE` is the only cache
   and it is per-tick ephemeral. Fix 2 requires inventing a durable ledger (dir,
   atomic write, invalidation, sweep, test-override env var, docs) modeled on
   `lib-reservation-ledger.sh` / `lib-standdown-recheck.sh`. It must **not** be node
   frontmatter — a graph write per tick costs far more than the REST call it saves.
2. **The memo may only fire on terminal `passing`.** The sweep concludes "no
   regression" when the route is null, which happens for `passing` *and* for
   `unknown` (pending, or a fetch failure — see the `case "$RAW_VERDICT"` block at
   lines 253–256). Memoizing an `unknown` would pin the node forever — precisely the
   defect `tactic-ci-verdict-cache-invalidation` (a separate raw draft) records
   against the shared cache. So the memo is terminal-`passing`-only, consistent with
   the terminal-only rule ratified above.
3. **Terminal-passing unchanged-sha candidates are the shortest-lived members of the
   stranded set.** A candidate that is `passing` *and* `MERGEABLE` is exactly the one
   `graph-auto-merge` is about to land, so it leaves the enumeration almost
   immediately. The long-lived stranded candidates — conflicting, blocked, or pending
   — are the ones the memo structurally cannot fire on.
4. **Its saving overlaps Fix 1's accounting.** On ticks that reach selection the
   selector re-reads CI for these same nodes anyway, so the memo saves nothing there;
   its saving is confined to capped/paused ticks, which are precisely the ticks under
   the *least* REST pressure (no workers are spawning).

A durable ledger plus an invalidation story, for a memo that fires only on
candidates about to exit the set, on the ticks where the budget is least contended,
does not pay for itself. **Fix 1 stands alone.** If a future measurement shows
otherwise, reopen this with the measurement, not with the original prose.

### Option (f) — using `mergeStateStatus == CLEAN` as a pre-filter — is REFUTED by measurement

An earlier note suggested `gh_pr_view_rest`'s already-projected `mergeStateStatus`
(`lib.sh:1195–1245`, uppercased from REST `.mergeable_state`) might imply `passing`
and serve as a zero-extra-call filter. Measured against the live repo this session:

- `repos/natb1/commons.systems/branches/main/protection` returns **404 Branch not
  protected**; the enforcement is an active **ruleset** (id 12884700) whose
  `required_status_checks` are exactly **three** contexts — `acceptance`, `lint`,
  `unit-tests` (not four, as older prose says).
- `dispatch_classify_rollup` (`lib.sh:708`) is **required/non-required blind**: it
  resolves `failing` if *any* check run has a failing conclusion, over all rows.

So `CLEAN` (required checks satisfied) and `passing` (every check run green) are
**not the same partition**: a PR with a failing *non-required* check is `CLEAN` but
`failing` by the sweep's own classifier. Adopting `CLEAN` as a skip filter would
suppress genuine fix routing. **Do not adopt it, in this node or a sibling.**

### Write-set overlap warning (clarification 110's invisible-write-set hazard)

Four sibling raw drafts target the **same per-candidate loop**. All are `phase: null`
today, so none is in flight and there is no live conflict — but a future round must
not land them blind against each other:

- `tactic-review-stall-pr-json-duplicate-fetch` — eliminate the duplicate
  `gh_pr_view_rest` that `reconcile-graph-merged` already made (same line 236 fetch).
- `tactic-review-stall-predicate-subprocess-spawn` — stop spawning a
  `node --import tsx/esm` subprocess per candidate to evaluate `reviewStallRoute`
  (same lines 258–265). **Note the interaction:** this node's Unit 1 already removes
  that spawn for the CONFLICTING subset; that sibling still owns the remaining
  subset.
- `tactic-review-stall-listnodes-duplicate-scan`.
- `tactic-reconcile-review-stall-base-pin`.

Also: `tactic-review-stall-conflict-lane` (raw draft, from strategy clarification
134) proposes making this sweep **enter** the conflict lane on CONFLICTING, which
directly contradicts the retired no-op that `tactic-graph-router-conflict-routing`
(done) landed and which this plan builds on. **That node appears stale, but
reconciling it is not this node's job — note the tension and do not edit it.**

One more corpus-hygiene observation from this round's drift review, recorded here
because a per-node tactic-target session never writes the serving strategy's
frontmatter (`references/tactic-target.md`): `tactic-ci-verdict-cache-invalidation`
(raw draft) is substantially **superseded in code** — its recommended fix, making
`DISPATCH_CI_VERDICT_CACHE` terminal-only so a memoized non-terminal verdict cannot
pin a long-lived poller, shipped under `tactic-orphaned-check-run-pins-pending-ci-guard`
(PR #3073, phase done) without that draft being closed or pruned. It wants a
close/prune disposition in a future strategy-target round. Again: noted, not this
node's work, and **do not edit it here.**

---

## Units of work

### Unit 1 — Short-circuit the per-candidate CI fetch on `CONFLICTING`

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`.

Insert a short-circuit immediately **after** the `.mergeable` validation `case`
block (lines 244–249, the arm that rejects an unexpected projection value) and
**before** `HEAD_SHA=$(jq -r '.headRefOid' <<<"$PR_JSON")` at line 250:

- When `MERGEABLE == CONFLICTING`, `continue` the loop without reading `HEAD_SHA`,
  without calling `dispatch_ci_verdict_rest` (line 252), and without spawning the
  `node --import tsx/esm` `reviewStallRoute` evaluation (lines 258–265).
- The skip must produce **no stdout** — the file's stdout protocol (header, "one
  line per tactic acted on; NOTHING for a skip") is contractual and existing test
  assertions read it. Do **not** add a stderr line either: the retired `conflict)`
  arm is silent today and the observable behavior must stay byte-identical.
- `ACTED` must **not** be incremented (it is not today either), and the loop must
  `continue`, never `break` — an unrelated red-CI candidate later in the
  enumeration must still be recovered.

The comment on the short-circuit is the deliverable's other half. It must state, in
this order: (a) that `interruptRoute`
(`packages/intentionsutil/src/transitions.ts:349–353`) returns `"conflict"` for
`CONFLICTING` *before* consulting CI, so the CI verdict cannot change the outcome;
(b) that the superset invariant is documented at transitions.ts:342–348 and pinned
by `packages/intentionsutil/test/transitions.test.ts:295`, so this shell pre-filter
is sanctioned rather than a re-derivation; (c) that the `conflict` route is a
retired no-op owned by the selector's `pending-merge` path
(`tactic-graph-router-conflict-routing`), so nothing is lost by never computing it;
and (d) that `dispatch_ci_verdict_rest`'s memo is per-tick (`lib.sh:822–839`,
`dispatch-select-tick:296–304`) and the ladder driver unsets it entirely
(`dispatch-ladder-run:1128, 1161, 1195`), which is why this call is a structural
cache miss on the paths that matter.

Then **remove the now-unreachable `conflict)` arm** of the `case "$ROUTE"` statement
(line 297 and its comment block), folding its rationale into the new short-circuit
comment so the retired-no-op decision keeps exactly one home. After the
short-circuit, `reviewStallRoute` can only return `"fix"` or `null` for the values
that reach it; the existing `*) continue ;;` arm (lines 304–306) still absorbs
anything unexpected as a silent no-op, so removing the arm cannot change behavior
even if `interruptRoute` were to return `"conflict"` some other way.

Also update the header comment block (lines 23–29) where it describes the conflict
route: it must now say that a CONFLICTING candidate is skipped **before** the CI
fetch rather than routed and discarded.

**Explicitly out of scope for this unit:** any change to `dispatch_ci_verdict_rest`
or its cache (`lib.sh`); any change to `transitions.ts` or its tests; any new
durable state, ledger, directory, or env var (see the Fix-2 scope-out above); the
duplicate `gh_pr_view_rest` at line 236; the `node --import tsx/esm` spawn on the
non-CONFLICTING path; `graph-select-target`; `dispatch-select-tick`;
`dispatch-ladder-run`; and any edit to sibling intention nodes.

**Recommended model:** sonnet.

### Unit 2 — Pin the short-circuit with a behavior test that counts REST calls

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — the
review-stall harness is the **`Case 10` block**, running from the banner comment
`# Case 10: reconcile-graph-review-stall --node <id> narrows the sweep to one node`
down to (not including) the `# Case 11:` banner; it holds sub-cases `10a`, `10b`,
`10c` and the `--node` usage-error tail. It is the established test home for this
script, so **extend it, do not add a new file**. *(Anchors here are construct
citations on purpose: five sibling PR5 units edit this same file, so any line
number drifts within the PR. Locate by banner text, never by number.)* Per
`.claude/rules/sandbox.md`, skill `test-*.sh` files are not auto-discovered, and
this one is not wired into CI — see Verification.

Two edits:

1. **Make the `gh` stub call-countable.** The `review_stall_gh_stub()` function
   (locate by its definition line `review_stall_gh_stub() {`, immediately under the
   `# Case 10:` banner)
   already resolves the invoked REST `path` into a shell variable and branches on
   `*/check-runs` vs `*/pulls/*`. Append each resolved `path` to
   `"$GC_FIXTURE_DIR/gh-calls.log"` before the branch. This is additive and cannot
   disturb Cases 10a–10c, which assert on the sweep's stdout and on the
   `graph-commit` argv file, not on the stub's side effects.

2. **Add Case 10d — "a CONFLICTING candidate costs no check-runs fetch, and does not
   consume the sweep's budget."** Model it on **Case 10c** (locate by the banner
   `# Case 10c: without the flag, existing behavior is unchanged`): build a seed
   repo, copy the sweep in, seed **two** nodes with the `review_stall_node()`
   fixture helper (locate by its definition line `review_stall_node() {`) whose
   ids order the conflicting one first in the enumeration —
   e.g. `t-rsa` (PR 203) and `t-rsb` (PR 204) — push, clone, install the stub, and
   stub `graph-commit` to record its argv. Write a fixture `pr-203.json` in the
   stub's fixture dir with `mergeable: false`, `mergeable_state: "dirty"`,
   `state: "open"`, `merged_at: null`, and a distinct `head.sha` (the stub already
   prefers a `pr-<n>.json` fixture when present, and `gh_pr_view_rest` maps REST
   `mergeable: false` to the porcelain `CONFLICTING`); leave PR 204 on the stub's
   inline default (mergeable, red check-runs). Assert all of:
   - exit code 0;
   - `gh-calls.log` contains **no** `check-runs` line for PR 203's head sha (the
     REST saving — this is the assertion the whole unit exists for);
   - `gh-calls.log` *does* contain a `check-runs` line for PR 204's head sha
     (the non-CONFLICTING path is untouched);
   - stdout carries **no** line mentioning `t-rsa` (silent skip, stdout protocol
     preserved);
   - stdout carries `^recovered t-rsb -> fix` and `intentions/t-rsb.md` gained the
     fix-interrupt `since:` line, with `t-rsb` in the recorded `graph-commit` argv —
     proving the short-circuit `continue`s past the conflicting candidate rather
     than breaking the sweep or consuming `GRAPH_REVIEW_STALL_CAP`;
   - `intentions/t-rsa.md` is unmodified.

   Give the case an `ok`/`no` message naming the behavior, matching the file's
   existing style.

The saved `node --import tsx/esm` subprocess follows structurally from the same
`continue` and needs no separate assertion — do not stub `node`, which the
enumeration itself depends on.

**Explicitly out of scope:** re-testing the CONFLICTING-outranks-CI precedence rule
(already pinned at `packages/intentionsutil/test/transitions.test.ts:295` — cite,
do not duplicate); wiring `test-graph-write-rollback.sh` into
`.github/workflows/unit-tests.yml`; touching Cases 1–9, 10a–10c, or 11. *(An earlier
revision said "10a–10d". Only `10`, `10a`, `10b` and `10c` exist on `origin/main` —
measured with `LC_ALL=C grep -an '^# Case 10'
.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh`. `10d` is the
case **this unit adds**; `10e`–`10g` belong to
`tactic-review-stall-predicate-subprocess-spawn` Unit 2, and this unit must not touch
those either.)*

**Recommended model:** sonnet.

**Dependencies:** Unit 1.

---

## Reuse

- `packages/intentionsutil/src/transitions.ts:349–353` (`interruptRoute`) and
  `:301–303` (`reviewStallRoute`) — the single documented home of the
  CONFLICTING-outranks-failing-CI precedence rule, and the doc-comment at
  `:342–348` that explicitly sanctions the shell pre-filter this node implements.
  Cite it; never re-derive the precedence in bash.
- `packages/intentionsutil/test/transitions.test.ts:295` — the existing test pinning
  the superset invariant the pre-filter depends on. No new TypeScript test is needed.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1195–1245` (`gh_pr_view_rest`) —
  already called once per candidate at `reconcile-graph-review-stall:236` and already
  projects both `.mergeable` (used at line 238) and `.headRefOid` (line 250). No new
  REST call is needed to obtain the short-circuit's input; the value is already in
  `PR_JSON`.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:822–839, :840`
  (`dispatch_ci_verdict_rest` and its memoisation contract) — read-only reference for
  the comment; **do not modify or repurpose this cache** (terminal-only by deliberate
  design, per the orphaned-check-run rule).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:708`
  (`dispatch_classify_rollup`) — the required/non-required-blind classifier that
  refutes option (f).
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:216–306` —
  the exact edit site; the `.mergeable` validation `case` at 244–249 is the anchor
  the short-circuit follows.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — the
  `review_stall_gh_stub()` and `review_stall_node()` fixture helpers (both defined
  between the `# Case 10:` banner and the `# Case 10a:` banner) are the existing
  fixtures Unit 2 extends; the **Case 10c** block (banner
  `# Case 10c: without the flag, existing behavior is unchanged`) is the
  structural template for the new case. Cited by construct, not by line: five
  sibling PR5 units edit this file.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:118–121`
  (the `GRAPH_REVIEW_STALL_CAP` positive-integer guard) — the house pattern to copy
  **if** a future unit ever adds a tunable. This plan adds none.

Deliberately **not** reused, and named so a later reader does not treat the omission
as an oversight: `lib-reservation-ledger.sh` and `lib-standdown-recheck.sh` are the
correct precedents for durable cross-invocation marker state, and they are the shape
Fix 2 would have copied. Fix 2 is scoped out (see Context), so no ledger is created.

---

## Verification

Both fences were run against the unmodified tree while authoring this plan and were
green (18/18 and 53/53 respectively), so a failure after the change is a real
regression, not a pre-existing red.

The sweep's shell coverage:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

The invariant the shell pre-filter rests on:

```verify
npm test --prefix packages/intentionsutil -- test/transitions.test.ts
```

**Manual / judgment checks (not auto-runnable):**

- **The new case must have teeth.** Before landing, confirm Case 10d *fails* against
  the pre-Unit-1 sweep (stash Unit 1's edit, or temporarily revert the
  short-circuit): it must report a `check-runs` call for PR 203. A case that passes
  both before and after the change is vacuous and does not pin anything.
- **CI wiring gap, deliberately left alone.** `test-graph-write-rollback.sh` is
  **not** referenced in `.github/workflows/unit-tests.yml` (which runs 31 other
  `dispatch-propagate/scripts/test-*.sh` steps). Its 24 existing review-stall
  assertions and the new one therefore run only when invoked locally, as the fence
  above does. Wiring it is a pre-existing gap affecting all 18 cases in the file, not
  something this change creates — do not expand scope to fix it here, and do not
  claim CI coverage for the new case in the PR body.
- **Observe in production.** After the change lands, on a tick where at least one
  reviewed-awaiting-merge PR is CONFLICTING, the sweep's journal output must be
  unchanged (still nothing for that node) while the tick's REST consumption drops by
  one paginated `check-runs` fetch per such candidate. Confirm no node that was
  previously recovered to `fix` stops being recovered — the routing outcome for every
  non-CONFLICTING candidate must be identical.
- **Do not re-litigate settled decisions in review.** Two are recorded above with
  their evidence: the terminal-only verdict cache (2026-08-13) and the scope-out of
  the durable `headRefOid` memo. Option (f) (`mergeStateStatus == CLEAN`) is refuted
  by the measured three-context ruleset plus the required/non-required-blind
  classifier — a review finding proposing any of the three needs new measurement, not
  a restatement.
