---
id: tactic-graph-commit-landing-signal-unreliable
kind: tactic
statement: graph-commit and clear-park must emit a trustworthy landing signal --
  today both the exit code and the log text can each report the opposite of what
  actually landed, so no caller can tell a landed write from an orphaned one
  without re-parsing origin/main
owner: ai
status: codified
parent: null
rationale: "Measured three times in a single session on 2026-08-05 (bootstrap
  monitor pass), in BOTH directions. Direction A -- false failure: a run exited
  144 with its commit created locally but never pushed, leaving an orphaned
  commit that had NOT reached origin/main while the caller saw a non-zero exit.
  Direction B -- false success signal inverted: a run whose log ended `[remote
  rejected] ... landing-lock ... already exists`, which reads unambiguously as a
  failure, had in fact ALREADY LANDED the write on origin/main. Apparent cause
  in both: a background wrapper killed while graph-commit blocks waiting on a
  contended refs/graph/landing-lock, so the process dies at an indeterminate
  point in a sequence that is not atomic across local-commit / lock-acquire /
  push / lock-release. Cost today: every caller must independently re-fetch and
  PARSE origin/main to learn what happened (this is invariant I2 of the
  bootstrap plan, and it exists solely because of this defect); the tribal
  remedy is `git reset --hard origin/main` in the graph worktree and re-run,
  with a standing rule never to push the orphan. That rule is unwritten,
  unenforced, and one wrong push away from a lost-update. Remedy shape: make the
  landing signal authoritative -- either an atomic land-or-fail with a signal
  derived from the post-push remote state rather than from local exit status, or
  an explicit machine-readable verdict the caller can trust without re-parsing.
  Dedup: a find-or-create check over the 514-node graph found NO owner. The
  three nearest nodes are all phase:done and each covers a DIFFERENT cause --
  tactic-graph-commit-noop-landing-false-failure (a no-op run reporting a false
  'main busy'), tactic-graph-commit-staleness-silent-revert (a missing -C
  producing a false POSITIVE), and tactic-graph-commit-landing-lock (the lock
  ref's own lifecycle). None addresses the exit-code-and-log-both-lie failure
  mode under a killed wrapper."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-graph-commit-landing-signal-unreliable
  pr: 3050
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T15:46:50Z
    mergeCommitSha: 94037673a00a834bf5a3ad044a850e10901eee69
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# graph-commit and clear-park must emit a trustworthy landing signal -- today both the exit code and the log text can each report the opposite of what actually landed, so no caller can tell a landed write from an orphaned one without re-parsing origin/main

## Context

`packages/intentionsutil/scripts/graph-commit` is the single write primitive
that lands intention-node edits on `main`. Its caller-facing signal — the exit
code and the last lines of its stderr — is derived from **this process's own
local view**, never from a post-push read of `origin/main`. Both halves of that
signal have been observed reporting the opposite of reality.

**Measured three times in a single session on 2026-08-05 (bootstrap monitor
pass), in BOTH directions:**

- **Direction A — false failure.** A run exited 144 with its commit created
  locally but never pushed, leaving an orphaned commit that had NOT reached
  `origin/main`. Caller saw a non-zero exit and no way to tell whether the
  commit had landed.
- **Direction B — a failure-shaped log over a landed write.** A run whose log
  ended `[remote rejected] ... landing-lock ... already exists` — which reads
  unambiguously as a failure — had in fact ALREADY LANDED the write on
  `origin/main`. That line is emitted by `lock_claim_or_renew`'s lost-create
  race path (`graph-commit:1372-1380`), which is deliberately left
  un-redirected and is benign; as the *last* line of a killed run's log it
  reads as the terminal outcome.

Apparent cause in both: a background wrapper killed while graph-commit blocks
on a contended `refs/graph/landing-lock`, so the process dies at an
indeterminate point in a sequence that is not atomic across local-commit /
lock-acquire / stamp / push / lock-release. `cleanup()`'s own comment
(`graph-commit:563-608`, ~576-579) already records that a SIGKILL fires no trap
at all, so trap coverage cannot be the defense; and
`trap 'exit 130' INT TERM` (`graph-commit:2103`) covers INT/TERM only.

**The mechanism, precisely.** `try_land()` (`graph-commit:1456-1544`) derives
its return value from *its own* `git push origin "$sha:main"` rc
(`graph-commit:1527`). `land()` (`:1561`) maps that to 0/11/12, and `main()`
(`:2222-2236`) maps those straight to exit 0/1. `park_and_exit()` (`:1754`)
prints its load-bearing confirmation `(office_hours set on the origin/main
content)` (`:1862`, `:1864`) on the local `prc==0` of the same push. Nothing
anywhere re-reads `origin/main` after pushing.

**Cost today.** Every caller must independently re-fetch and parse
`origin/main` to learn what happened — this is invariant I2 of the bootstrap
plan, and it exists *solely* because of this defect. There are now **five
independent in-repo implementations** of that same post-land re-read, three
mutually inconsistent in technique, plus two live call sites with no check at
all (enumerated under ## Reuse). The tribal remedy for an orphan is
`git reset --hard origin/main` in the graph worktree and re-run, with a
standing rule never to push the orphan. That rule is unwritten, unenforced,
and one wrong push away from a lost update.

**Intended outcome.** After this change, graph-commit's and clear-park's exit
code and terminal log line are both derived from a post-push read of
`origin/main`, and one shared, tested primitive answers "did this actually
land?" for every caller — replacing five hand-rolled copies and the tribal
recovery rule.

### Greenfield design (what this plan builds)

1. **`origin/main` is the sole verdict source.** One primitive,
   `verify-landed`, answers the landing question for any node id from remote
   state alone. It is **three-valued** — `landed` / `not-landed` / `unknown` —
   with distinct exit codes, because a fetch failure must never be rendered as
   "not landed" (that direction makes fail-safe callers re-write forever) and
   must never be rendered as "landed".
2. **The producer speaks the same verdict.** graph-commit emits exactly one
   `graph-commit: verdict: <status> …` line on every terminal path and derives
   its exit code from that verdict, not from the local push rc. This fixes both
   directions: a run whose push loop exhausted but whose content is on
   `origin/main` exits 0; a run whose push "succeeded" but whose content is not
   on `origin/main` exits 1.
3. **The verdict predicate is ancestry, not blob equality.** `git merge-base
   --is-ancestor <pushed-sha> origin/main` is the only predicate that survives
   graph-commit's own layer-2/3 auto-merge, which legitimately changes landed
   content away from the writer's snapshot. Blob equality against the intended
   content is the *fallback*, reported distinctly as `landed-equivalent` (a
   peer landed identical content).
4. **Orphan containment, honestly scoped.** Git has no atomic commit-and-push,
   so "a killed process leaves no orphan commit" is not literally achievable.
   The achievable invariant is: *the orphan window is as small as the design
   permits, an orphan is never mistaken for a landing, and its recovery is
   scripted and written down rather than tribal.* Concretely — defer the local
   commit until the landing lock is held (which removes the entire lock-wait
   window, up to `LOCK_WAIT_SECONDS`, where the observed incidents died), and
   make graph-commit name any orphan it detects or leaves, with the sanctioned
   recovery (re-run the same invocation; never hand-push).

No brownfield migration path is needed: exit codes stay `0/1/2/3`, only the
*mapping* of outcomes onto them changes, so no caller's exit-code handling
breaks. The one text contract that changes (land-align-round's prose needle)
has exactly one consumer and its ratchet test, both updated in Unit 5.

### Explicitly out of scope

- **Lock semantics.** The TTL-steal design (`lock_claim_or_renew`,
  `graph-commit:1350-1418`) already recovers correctly from a killed lock
  holder; R2's "no held lock" property is met today. Do not touch it.
- **`tactic-graph-ref-split`.** That tactic (phase `implement`, not landed)
  would replace the CI-stamp-and-lock landing design outright. This fix must
  work correctly under the CURRENT interim lock-based graph-commit and must not
  assume ref-split's simplification.
- **`resolve-hold:422-436` ("Verify A").** It already performs a correct
  post-land verification. Converting it to the shared primitive is pure churn
  with no behavior change; leave it.
- **Graph writes.** This plan authors code only. Retiring invariant I2 has
  fan-out into other node bodies that cite it as standing doctrine
  (`tactic-fleet-watchdogs-session-scoped`,
  `tactic-reclaim-audit-journal-unit-filter`,
  `tactic-phase-terminal-requires-disposition`). Reconciling those node bodies
  is downstream work for a later round, not this PR.

---

## Unit 1 — `readNodeAtRef` + the `verify-landed` primitive

**Scope.**

- `packages/intentionsutil/scripts/lib-store-at-ref.ts` — add
  `readNodeAtRef(repoRoot: string, ref: string, id: string): IntentionNode |
  null`. Same posture as the existing `listNodesAtRef` (`:48-79`): `repoRoot`
  is a parameter, never resolved from `import.meta.url`. Implementation:
  `git -C <repoRoot> show <ref>:intentions/<id>.md` into a `mkdtempSync` dir as
  `intentions/<id>.md`, then `readNode(<tmp>/intentions, id)` from
  `../src/store.js`; `rmSync` in a `finally`. Return `null` when the path does
  not exist at `ref` (a pruned/absent node — a real answer, not an error);
  throw with a descriptive message on any other git or parse failure.
  **Do not** reuse `listNodesAtRef` here: it is STRICT over the whole 500+ node
  store, so one unrelated malformed node would fail the verification of a
  healthy one.
- `packages/intentionsutil/test/store-at-ref.test.ts` — extend with
  `readNodeAtRef` cases (present, absent, malformed-throws).
- **New:** `packages/intentionsutil/scripts/verify-landed` — executable bash,
  no extension, styled after `park-node` / `clear-park`. Contract:

  ```
  usage: verify-landed [-C <repo-path>] [--no-fetch] [--json] <spec> [<spec>...]

  spec forms:
    <id>=<blobsha>    origin/main:intentions/<id>.md must be exactly <blobsha>
    <id>=absent       the node must be absent from origin/main (a landed prune)
    <id>@<jq-filter>  the jq filter over the node's JSON as of origin/main must
                      evaluate to true (e.g. 'tactic-foo@.office_hours != null')
  ```

  - Repo resolution: `-C` else cwd, via `git rev-parse --show-toplevel` —
    mirroring `graph-commit`'s `main()` resolution (`:1990-2044`) and for the
    same reason (`tactic-graph-commit-staleness-silent-revert`). NEVER resolve
    from the script's own location.
  - `git fetch origin main` first unless `--no-fetch`; a fetch failure yields
    `unknown`, never `not-landed`.
  - `=<blobsha>` and `=absent` modes are **pure git** (`git rev-parse
    origin/main:intentions/<id>.md`) — no node, no tsx — so the hot path stays
    cheap. Only `@<jq-filter>` shells out to a small tsx entry that calls
    `readNodeAtRef` and prints JSON, piped to `jq -e`.
  - Output: one line per spec on stdout, then exactly one terminal line:
    `verify-landed: verdict=landed|not-landed|unknown ids=<csv> main=<sha>`.
    `--json` additionally prints one JSON object with `{verdict, main, specs:
    [{id, mode, status, observed, expected}]}`.
  - Exit codes: **0** = every spec satisfied (`landed`); **4** = the read
    succeeded and at least one spec is definitively unsatisfied
    (`not-landed`); **1** = could not determine (`unknown` — fetch failed, git
    error, tsx/jq failure); **2** = usage error. The 0/4/1 split is the whole
    point: collapsing `unknown` into either answer reintroduces the defect.
  - It never writes: no fetch-into-worktree, no `git show > file`, no index
    touch. (This is why it cannot be built on `dump-node.ts`, whose
    `intentionsDir` is resolved from its own file location — `dump-node.ts:37-40`
    — so it can only ever read the script's own checkout's working tree, which
    is why `resolve-hold` has to overwrite the local file first.)
  - Must not hold inherited fds: document that callers holding a flock fd (see
    `dispatch-fleet-alarm`'s `9>&-` discipline, `:485-487`) should close it
    across this call.
- **New:** `packages/intentionsutil/scripts/test-verify-landed.sh` — bare
  `git init --bare` origin + clone harness in the style of
  `test-park-node.sh`. Cases: blob-equal → `landed`/0; blob-differs →
  `not-landed`/4; absent-and-expected-absent → `landed`/0;
  present-but-expected-absent → `not-landed`/4; unreachable origin →
  `unknown`/1 (assert the word `not-landed` does NOT appear); jq predicate
  true → 0 and false → 4; bad spec → 2; `--json` shape parses under `jq`.
- `.github/workflows/unit-tests.yml` — add a step running
  `packages/intentionsutil/scripts/test-verify-landed.sh`, alongside the
  existing block at `:251-260`.

Out of scope for this unit: any change to graph-commit or to any caller.

**Recommended model.** opus

---

## Unit 2 — graph-commit derives its terminal verdict from `origin/main`

**Dependencies.** Unit 1.

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

- New globals near `MAIN_SHA` (`:330`):
  - `PUSHED_SHA=""` — set in `try_land()` immediately **before**
    `git push origin "$sha:main"` (`:1527`), so a surviving process knows which
    sha it intended to land regardless of how that push reported.
  - `VERDICT_EMITTED=0` — once-only guard.
- New function `emit_verdict_and_exit <context>`, placed after
  `check_state_phrase()` (`:1163`). It:
  1. Returns immediately if `VERDICT_EMITTED` is 1 (re-entrancy from `die()`
     inside the verdict path).
  2. `git fetch origin main` (mandatory — this process's own push made the
     pinned `MAIN_SHA` stale). Failure ⇒ verdict `unknown`.
  3. Computes the verdict:
     - `landed` — `PUSHED_SHA` non-empty and
       `git merge-base --is-ancestor "$PUSHED_SHA" FETCH_HEAD`; or `HEAD` is
       already `FETCH_HEAD` on the nothing-to-push path.
     - `landed-equivalent` — ancestry false, but for every id the
       `FETCH_HEAD:intentions/<id>.md` blob equals the intended blob
       (`git hash-object "$SNAP_DIR/<id>.md"` from `snapshot()`, `:654`) and
       every `--prune` id is absent at `FETCH_HEAD`. A peer landed identical
       content; the caller's intent is satisfied.
     - `parked` — the park path only: `PUSHED_SHA` (the parking commit) is an
       ancestor of `FETCH_HEAD`.
     - `not-landed` — the read succeeded and none of the above holds.
     - `refused` — `ALL_IDS` is empty (usage/pre-flight death before any write
       was attempted); no fetch needed.
     - `unknown` — the fetch or a git read failed.
  4. Prints exactly one line, in the established cause-then-evidence shape the
     terminal `try_land()` message already uses (`:1537-1542`):
     `graph-commit: verdict: <status> ids=<csv> pushed=<sha|none> main=<sha> context=<context>`
     — optionally followed by the reason phrase. **This line is the caller
     contract**; document it as such in the header block
     (`graph-commit:1-70`), next to the existing `-C` / `--base` / `--expect`
     documentation.
  5. Exits: `landed`/`landed-equivalent` → **0**; everything else → **1**
     (usage errors keep their own exit 2, `--base` staleness its exit 3 — see
     below). `unknown` NEVER exits 0.
- Rewire the terminal paths to route through it, replacing the local-rc-derived
  exits:
  - `main()`'s `rc==0` branch (`:2223-2232`) → `emit_verdict_and_exit
    push-reported-success`. If verification says `not-landed`, this now exits 1
    with `verdict: not-landed` instead of a false success.
  - `main()`'s `rc==11` busy branch (`:2233-2236`) → `emit_verdict_and_exit
    busy-exhausted`. **This is the Direction B fix**: if the content is on
    `origin/main`, exit 0 with `verdict: landed` or `landed-equivalent`, even
    though the loop reported exhaustion.
  - `main()`'s nothing-to-push early exit (`:2205-2209`) →
    `emit_verdict_and_exit noop`.
  - `park_and_exit()`'s post-`land` branch (`:1846-1873`) → verify **before**
    printing the confirmation. Emit the legacy load-bearing substring
    `(office_hours set on the origin/main content)` only on
    `verdict: parked`; on `not-landed`/`unknown` emit the existing
    "office_hours set locally but not pushed to main" error plus the verdict
    line. Then `emit_verdict_and_exit park`. Keep the legacy substring
    verbatim in this unit (Unit 5 migrates its consumer); the point of this
    unit is that it is now only printed when it is TRUE.
  - `die()` (`:347-350`) → emit a verdict before exiting. Guard for the
    pre-`ALL_IDS` case (verdict `refused`). `die()` must keep exiting non-zero
    in every case; a `die()` whose write nonetheless landed emits
    `verdict: landed` in the log **but still exits 1** — a die is an
    environment failure the caller must see, and the verdict line is what tells
    it whether a retry would be a no-op. Document that asymmetry inline.
  - Usage errors (exit 2) and `--base` staleness (exit 3) keep their codes
    unchanged; they may emit `verdict: refused` for uniformity.
- Update the `die()` message at `:2189` (the nothing-staged / mis-pointed `-C`
  guard) to name the second possible cause it currently omits: a commit already
  created locally by a prior killed run. Today it offers only the mis-pointed
  `-C` explanation — which is exactly how a `/qa-main` session was misdirected.

Out of scope: any change to which local operations happen in what order (that
is Unit 3), and any caller.

**Recommended model.** opus

---

## Unit 3 — orphan containment: commit under the lock, and name every orphan

**Dependencies.** Unit 2.

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

- **Shrink the orphan window.** Move the local commit from `main()`
  (`:2167-2169`, `if id_files_dirty; then commit_files; fi`) into `try_land()`
  (`:1456`), placed immediately after a successful `lock_claim_or_renew` and
  **before** `git pull --rebase origin main`. Use the same idempotent guard
  (`if id_files_dirty; then commit_files; fi`) so retry iterations are no-ops.
  This removes the entire lock-wait window — up to `LOCK_WAIT_SECONDS`
  (`:240`), which defaults to `MAX_PUSH_ATTEMPTS * (CHECK_TIMEOUT_SECONDS +
  30)` — from the interval in which a kill can leave an orphan. That window is
  where all three observed incidents died.
  - Preconditions to preserve, verify each still holds: `assert_clean_outside_ids`
    (`:1933`), `assert_expected_content`, `check_base_freshness` (`:478`) and
    `ensure_intentions_only_base` (`:927`) all run before `land()` today and
    none of them requires the commit to exist — leave them where they are.
  - `park_and_exit()`'s own `commit_files` (`:1843-1845`) stays; with the move,
    `land()` will also try it and find the tree clean (a no-op). Confirm it is
    a no-op rather than removing it.
  - The residual window — commit → stamp → push — cannot be removed (git has
    no atomic commit-and-push). Say so in the header comment rather than
    implying the orphan is impossible.
- **Detect a pre-existing orphan at startup.** After `MAIN_SHA` is pinned
  (`:2128-2129`), if `git rev-list --count "$MAIN_SHA..HEAD"` > 0, print
  `graph-commit: orphan-detected: <n> local commit(s) not on origin/main
  (<shas>) — re-running this invocation rebases and lands them; do NOT
  `git push` them by hand`. Today the equivalent message exists only inside the
  nothing-staged branch (`:2216-2220`); hoist the detection so it also fires on
  the ordinary dirty-tree path.
- **Name any orphan left behind.** On a `not-landed` or `unknown` verdict where
  `git rev-list --count <main>..HEAD` > 0, `emit_verdict_and_exit` appends:
  `orphan=<sha> — committed locally, NOT on origin/main. Recovery: re-run this
  same graph-commit invocation from <REPO_ROOT>; it rebases onto origin/main
  and lands it. NEVER `git push` this commit to main by hand — it bypasses the
  rebase/layer-2 merge ladder and can clobber a concurrent landing.`
- **Write the recovery rule into the header** (`graph-commit:1-70`), retiring
  the tribal one: re-running the same invocation is the sanctioned recovery
  (the nothing-staged branch at `:2196-2220` already lands `HEAD` after
  rebasing, which is exactly that path); `git reset --hard origin/main` is only
  for abandoning the write, not a prerequisite for retrying it.

Out of scope: lock semantics, TTL, steal behavior — unchanged.

**Recommended model.** opus

---

## Unit 4 — clear-park and park-node derive their own success from the verdict

**Dependencies.** Units 1, 2.

**Scope.**

- `packages/intentionsutil/scripts/clear-park:296-298` — today the script
  inherits graph-commit's exit code wholesale ("graph-commit failed …; the
  office_hours write was rolled back"). Replace with: **always** run
  `verify-landed -C "$REPO_ROOT" "$NODE_ID@.office_hours == null"` after
  graph-commit returns, regardless of graph-commit's rc (that is the Direction
  B case — graph-commit can report failure over a landed clear), and derive
  clear-park's exit from the verdict:
  - `landed` → exit 0, and **set `MUTATED=0` before returning** so the EXIT
    trap's `restore_node` (`:191-197`) does not put the pre-clear copy back
    over a clear that actually landed.
  - `not-landed` → exit 1 with a distinct message naming the graph-commit rc
    and the verdict.
  - `unknown` → exit 1 with a distinct message stating the landing could not be
    determined and that the node must be re-read from `origin/main` before any
    retry — never claim a rollback happened.
- `packages/intentionsutil/scripts/park-node` — same treatment at its
  post-`graph-commit` exit path (`:398`/`:412`), with the predicate
  `.office_hours != null`. Preserve every existing exit-code meaning:
  absent-on-origin/main stays exit 1 (`:319-325`), stale-`--base` stays exit 3
  (`:335`), usage stays exit 2. Also address the noted HEAD-moved local
  detection (`:252-283`): keep it, but it is no longer the evidence of landing
  — the verdict is.
- `packages/intentionsutil/scripts/test-park-node.sh` — extend with a case
  asserting a park whose graph-commit reports failure but whose write is on
  origin/main exits 0, and a case asserting an undeterminable verdict does not
  exit 0.

Out of scope: `transition-node`, `demote-node-to-implement`, `hold-node`,
`resolve-park`, `merge-node` — same class, but each is a separate adoption; do
not widen the PR.

**Recommended model.** sonnet

---

## Unit 5 — adopt the shared verdict at the five hand-rolled call sites

**Dependencies.** Units 1, 2, 4.

**Scope.**

- `packages/intentionsutil/scripts/land-align-round:162` — replace the prose
  needle `grep -qF -- "(office_hours set on the origin/main content)"` with a
  grep for the structured line
  (`grep -qE '^graph-commit: verdict: parked'` on `ERR_FILE`), and confirm the
  rc==0 path with `verdict: landed|landed-equivalent`. Gate on the verdict
  line, not on the rc — since Unit 2, the rc is *derived from* the verdict, so
  the verdict line is the primary. Update the surrounding comment block
  (`:163-176`) to describe the new contract.
- `packages/intentionsutil/scripts/test-land-align-round.sh:21,74` — update
  the ratchet to extract the **new** needle from graph-commit's real source
  (keep the technique: extract from source, never hardcode twice).
- `packages/intentionsutil/scripts/graph-commit:1846-1873` — once the consumer
  is migrated, the legacy substring may be dropped; if kept for one release,
  say so explicitly in the comment. Prefer dropping it: this PR migrates the
  only consumer and its test.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:1332-1388`
  (`terminal_disposition_sweep`) — replace the inline
  `git show | awk | grep -qE '^office_hours:…'` confirmation with
  `verify-landed`. **Preserve the fail-safe exactly**: `unknown` is treated as
  NOT landed, the `park-not-landed` greppable line is still printed, the
  escalation markers are still KEPT, and the park is still not counted. The
  documented rationale at `:769-789` (deleting escalation markers on a bare
  exit 0 converts a recoverable failure into an unrecoverable one) stays and
  should be cited from `verify-landed`'s own doc header.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:660-666`
  (`frozen_session_sweep`) — a live gap: it counts `rc==0` as parked with no
  confirmation at all. Add the same `verify-landed` confirmation and the same
  fail-safe.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:705-711`
  (`standdown_recheck_sweep`) — same live gap, same fix. Its pre-check at
  `~640-660` already uses the frontmatter-scoped idiom; leave the pre-check
  alone, fix the post-park confirmation.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:480-504`
  (`verify_landed()`) — delegate to the shared script. Keep the `9>&-` fd
  discipline at the call (`:487`) so the graph-write mutex fd is not inherited
  and pinned by a forked credential helper.
- `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` applies to
  net-new added lines in committed `.sh` files: never `echo` a captured JSON
  variable into `jq` — use `jq <<<"$VAR"` or `--jq` (see
  `.claude/rules/shell-json.md`). The `--json` consumers added here must obey
  it.

Out of scope: `resolve-hold:422-436` (already correct — see ## Context).

**Recommended model.** sonnet

---

## Unit 6 — kill-path regression coverage

**Dependencies.** Units 1-5.

**Scope.** `packages/intentionsutil/scripts/test-graph-commit.sh` — new cases
appended after the existing lock cases (30-32, `:1346-1402`). Reuse the
harness as-is: the bare `$ORIGIN` + clones, `set_mode`, `run_gc`
(`:632-661`), `plant_lock` (`:1346-1357`), and the `blocked-green` sentinel
mode (`:457-460`), which deterministically blocks a writer inside
`await_checks()` until `$GC_SENTINEL` appears.

Kill mechanics (state these in a harness helper so all cases share them):
launch the writer with `setsid` so the whole graph-commit process tree is its
own process group, capture the pgid, and kill it with `kill -9 -- -<pgid>`.
**Do not** poll with `pgrep -f` — a `pgrep -f graph-commit` in this harness
matches the poll loop's own command line and never exits; wait on a
filesystem-observable condition (the planted lock's presence, or the scratch
ref appearing on `$ORIGIN`) instead.

Cases:

1. **Killed while waiting on a LIVE lock leaves no orphan.** `plant_lock` with
   a far-future expiry, start the writer, wait until it is demonstrably
   blocked, SIGKILL the group. Assert: `git -C <clone> rev-list --count
   origin/main..HEAD` is `0` (Unit 3's property — the commit is only made once
   the lock is held), and `origin_sha` is unchanged.
2. **Killed mid-stamp leaves a detectable, recoverable orphan.**
   `set_mode blocked-green`, start the writer, wait until the scratch ref
   exists on `$ORIGIN`, SIGKILL the group. Assert: a local commit DOES exist
   (the residual window is real); `verify-landed` in that clone reports
   `verdict=not-landed` and exits 4; a plain re-run of the identical
   graph-commit invocation lands the content and exits 0 — i.e. the tribal
   `git reset --hard` is not required.
3. **Direction B — exhausted loop over an already-landed write exits 0.**
   Arrange a writer whose pushes to main are rejected until its attempts are
   exhausted (existing busy-main machinery) while a peer clone lands the
   identical content. Assert exit **0** and a
   `graph-commit: verdict: landed-equivalent` line — where today the run exits
   1 with a rejection as its last log line.
4. **A `not-landed` verdict names the orphan and the recovery.** Assert the
   `orphan=` line appears and contains both "re-run" and a prohibition on
   pushing by hand.
5. **Verdict-line uniqueness.** For a happy-path run, a busy run, and a park
   run, assert exactly one `graph-commit: verdict: ` line is emitted.

Also extend `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`
and `test-lib-standdown-recheck.sh` with a case per newly-guarded sweep:
`park-node` exits 0 but nothing landed ⇒ markers KEPT, park not counted, the
distinct `park-not-landed` line printed.

**Recommended model.** opus

---

## Reuse

Existing code to build on, not re-derive:

- `packages/intentionsutil/scripts/lib-store-at-ref.ts:48-79`
  (`listNodesAtRef`) — the established "read the store at a git ref, never from
  the local worktree" helper and its stated failure posture. `readNodeAtRef`
  (Unit 1) is its single-node sibling and belongs in the same file.
- `packages/intentionsutil/src/store.js` `readNode` / `writeNode` — the
  canonical parser. All node reads go through it; never scrape frontmatter with
  a fresh inline `awk`.
- `packages/intentionsutil/scripts/resolve-hold:301-320` (`read_node_json`) and
  `:422-436` ("Verify A") — the cleanest existing post-land verification
  (fetch → `dump-node.ts` → `jq`, not fetch → `git show` → `awk` → `grep`).
  Model the primitive's *semantics* on it; do not reuse `dump-node.ts` itself,
  whose `intentionsDir` is resolved from its own file location
  (`dump-node.ts:37-40`) and so cannot read an arbitrary `-C` repo at a ref.
- `packages/intentionsutil/scripts/resolve-hold:254-269`
  (`refresh_from_origin`) — the `rev-parse -q --verify origin/main:intentions/<id>.md`
  existence-plus-blob-sha idiom. Reuse the git plumbing shape; drop the
  worktree-mutating `git show > file` half (the primitive must be read-only).
- `packages/intentionsutil/scripts/office-hours-graph:187-200`
  (`node_kind_on_main`) — the codebase's canonical frontmatter-scoped,
  column-0-anchored field read. `lib-standdown-recheck.sh` explicitly comments
  that this "should be shared and has not been"; the new primitive is where
  that sharing lands.
- `packages/intentionsutil/scripts/graph-commit:295` (`LAST_LAND_REASON`),
  `:1163-1174` (`check_state_phrase`), `:1537-1542` (`try_land`'s terminal
  message) — the established cause-then-evidence diagnostic idiom, with
  observations attributed to the SHA they were read on. New verdict messaging
  follows this shape.
- `packages/intentionsutil/scripts/graph-commit:2181-2195` — the existing
  per-id `HEAD:intentions/<id>.md` vs `$MAIN_SHA:intentions/<id>.md` blob
  comparison. This is already the ground-truth-over-local-state primitive;
  it is the fallback half of Unit 2's verdict (`landed-equivalent`).
- `packages/intentionsutil/scripts/graph-commit:654` (`snapshot()`) and
  `SNAP_DIR/<id>.md` — the surviving copy of the writer's intended content on
  every fail-closed path; hash it for the `landed-equivalent` comparison
  rather than re-deriving intent.
- `packages/intentionsutil/scripts/graph-commit:1990-2044` (`main()`'s
  `-C`/`--repo` resolution) — the caller-derived repo resolution fixed by
  `tactic-graph-commit-staleness-silent-revert`. `verify-landed` must resolve
  identically.
- `packages/intentionsutil/scripts/graph-commit:1350-1418`
  (`lock_claim_or_renew` / `read_lock_payload` / `lock_release`) — evidence
  that lock recovery is NOT the gap: TTL-steal already recovers from a killed
  holder. Cite; do not modify.
- `packages/intentionsutil/scripts/graph-commit:563-608` (`cleanup()`, its
  SIGKILL note at ~576-579) and `:2103` (`trap 'exit 130' INT TERM`) — the
  in-repo record of exactly what trap coverage can and cannot do, and why the
  verdict must come from `origin/main`.
- `packages/intentionsutil/scripts/test-graph-commit.sh` — the bare-origin /
  `set_mode` / `run_gc` (`:632-661`) / `plant_lock` (`:1346-1357`) /
  `blocked-green` sentinel (`:457-460`) harness. Build the kill cases on it;
  do not invent new kill-timing infrastructure.
- `packages/intentionsutil/scripts/test-land-align-round.sh` — the established
  technique of extracting the load-bearing needle from graph-commit's own
  source rather than hardcoding it twice. Keep the technique when the needle
  changes.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:769-789`
  — the best existing prose statement of *why* an exit code may not authorize
  destroying escalation evidence. Reuse that framing verbatim in
  `verify-landed`'s doc header rather than re-deriving it.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:480-504`
  (`verify_landed()`) — a fifth independent implementation, and the closest in
  shape to the new primitive; its `9>&-` fd discipline (`:485-487`) is a
  constraint the shared primitive's callers must honor.
- `git merge-base --is-ancestor <sha> origin/main` — the established ad hoc
  remedy used elsewhere in this codebase for exactly this class of problem (a
  claimed "landed" that wasn't). Unit 2 formalizes it as the verdict predicate
  instead of leaving it tribal.

## Verification

Every check below runs from the worktree root.

```verify
packages/intentionsutil/scripts/test-verify-landed.sh
```

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

```verify
packages/intentionsutil/scripts/test-land-align-round.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-standdown-recheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

Manual / judgment checks:

- **Confirm the new CI steps are wired.** `.github/workflows/unit-tests.yml`
  must gain a step for `test-verify-landed.sh` in the block at `:251-260`. A
  new bash test that CI never runs is not coverage.
- **Confirm the verdict line is a real contract, not prose.** Grep
  graph-commit's source for `verdict:` and confirm every terminal exit path
  (`main()`'s three exits, `park_and_exit`, `die()`) routes through the single
  emitter, and that no path can exit 0 on an `unknown` verdict.
- **Confirm the fail-safe direction at each adopted sweep.** For every site
  changed in Unit 5, read the code and confirm `unknown` is treated as NOT
  landed (markers kept, nothing counted, nothing deleted) — the inverse would
  silently destroy escalation evidence, which is the failure
  `lib-frozen-session-park.sh:769-789` exists to prevent.
- **Observe in production.** After merge, watch the first several real
  graph-commit runs in the dispatch logs (journald / session transcripts —
  note that `stdout` from these scripts does not reach journald; grep the
  worker transcripts) and confirm: exactly one `graph-commit: verdict:` line
  per run; no run exits 0 without a `landed`/`landed-equivalent` verdict; and
  any `orphan=` line that appears is followed, on the caller's retry, by a
  clean landing without a manual `git reset --hard`. This is the only check
  that exercises the real contended landing lock — the harness fakes it.
- **Judgment call left to the implementer.** If moving `commit_files` into
  `try_land()` (Unit 3) turns out to break `ensure_intentions_only_base`'s
  far-ahead PR-branch rebuild or `park_and_exit`'s ordering in a way the tests
  surface, ship Units 1, 2, 4, 5, 6 without the move and record the residual
  window explicitly in the header — the verdict (Unit 2) is the load-bearing
  half of this tactic; the window shrink is the secondary half. Do not weaken
  or skip a test to make the move fit (`.claude/rules/test-integrity.md`).

## needs-main residue

- **id:** 10
- **Title:** Observe real dispatch traffic post-merge
- **URL path:** current
- **Expected outcome:** Over real dispatch traffic post-merge, every terminal
  `graph-commit`/`clear-park`/`park-node` run emits exactly one well-formed
  verdict line matching `origin/main` reality in both directions, and any
  `orphan=` recovery instructions actually recover the commit when followed.
- **Finding:** Explicitly called out in this node's own Verification section
  as a production-only check not assertable at merge time — the original
  defect was only observed under real concurrent dispatch load (three
  occurrences in one session on 2026-08-05). All 8 script-verifiable QA items
  (verify-landed's own suite, graph-commit's verdict emitter and its full
  suite including the new SIGKILL kill-path regressions, the Direction B
  regression, clear-park/park-node's unconditional verify-landed adoption,
  the five other adopting call sites and their suites, the CI wiring, and
  `readNodeAtRef` coverage) passed at or above the PR's self-reported counts.
  A second judgment item (verdict-taxonomy coherence across every consumer)
  was independently audited in code and confirmed already-satisfied — no
  unhandled status, `unknown` is fail-safe everywhere a destructive action
  follows. Only this production-observation item remains, and it cannot be
  settled before merge by construction.
- **Verifiability:** WAIT — awaiting several real post-merge
  `graph-commit`/`clear-park`/`park-node` invocations under live dispatch
  traffic to accumulate before the check can run.
- **Check:** grep dispatch worker session transcripts (not journald — stdout
  from these scripts does not reach journald) for `graph-commit: verdict:`
  lines after merge; confirm exactly one per run; confirm no run exits 0
  without a `landed`/`landed-equivalent` verdict; confirm any `orphan=` line
  is followed, on the caller's retry, by a clean landing without a manual
  `git reset --hard`.
