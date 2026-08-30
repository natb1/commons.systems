---
id: tactic-provision-worktree-script-tests
kind: tactic
statement: Add script-level test coverage for provision-node-worktree's
  worker-start gate integration (selected-phase arg, exit 12/13 pass-through,
  scope-fingerprint stamp write) in test-provision-node-worktree.sh
owner: ai
status: codified
parent: null
rationale: "Surfaced during Unit 2 of tactic-worker-start-revalidation
  (2026-07-07): that unit added the `<selected-phase>` positional arg, the
  check-node-selection.ts prelude call, the exit-12/13 pass-through, and the
  `<fingerprint> <sha>` stamp write to provision-node-worktree, with no
  script-level test for any of it. The gate's VERDICT logic is well covered
  (check-node-selection.ts's own unit tests) and the sibling wrapper
  assert-node-selection is covered by test-assert-node-selection.sh against the
  real gate; the uncovered surface is this wrapper's bash plumbing — argument
  forwarding, exit-code mapping, and the stamp bytes — sitting untested between
  two well-tested endpoints. (Rationale reconciled 2026-08-19 /align-tactics
  tactic-mode finalize, per the whole-node amendment-completeness bar.) Two
  claims in the original draft rationale were true on 2026-07-07 and are now
  false, and are dropped rather than left standing: (1) 'no
  provision-node-worktree test harness exists there (plan anchor drift)' —
  tactic-provision-exit11-worktree-residue Unit 2 has since built
  .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh as
  the purpose-built harness (17 cases, CI-wired at
  .github/workflows/unit-tests.yml:287), and its own header explicitly reserves
  this node's gate-plumbing coverage; (2) the recommendation to fold this in as
  a UNIT of tactic-graph-router-transitions — that carrier has landed and been
  pruned (no node file remains), so the draft's own recorded fallback applies
  and this tactic is planned standalone against the existing harness."
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

# provision-node-worktree gate plumbing: script-level test coverage

## Context

`provision-node-worktree` is the graph lane's one-command worktree provisioning
primitive. Before it touches a worktree it runs the **worker-start
re-validation gate** — a `check-node-selection.ts` call whose verdict decides
whether the selection is still valid. That gate integration is bash plumbing
added by `tactic-worker-start-revalidation` Unit 2, and it has **no
script-level test today**:

- the second positional arg (`<selected-phase>`) and the exact argv the gate is
  handed (including `--dir` and `--stamp`);
- the exit-12 (stale-selection) / exit-13 (scope-stale) **pass-through**;
- the "any other non-zero gate exit maps to exit 2" mechanical-error branch;
- the `<scope-fingerprint> <origin-main-sha>` **stamp write**, which happens
  only on gate exit 0.

The gate's own *verdict logic* is well covered by `check-node-selection.ts`'s
unit tests, and the *other* wrapper (`assert-node-selection`) is covered by
`test-assert-node-selection.sh`, which drives the **real** gate. Neither covers
this wrapper's bash plumbing. That is the gap this node closes.

The gate's outputs are the router's contract: a false exit-2 where a 12 was
owed turns a benign stale selection into an office-hours park, and a missing or
malformed stamp silently disarms the transition-time scope gate (a stamp that
is absent "fails open" per `check-node-selection.ts`'s bootstrap policy, so a
regression here is invisible rather than loud). Untested plumbing between two
well-tested endpoints is exactly where that regression can land unnoticed.

Intended outcome: seven new cases appended to the existing
`test-provision-node-worktree.sh` harness, pinning arg forwarding, the usage
arity gate, both pass-through exits, the mechanical-error branch, and the stamp
bytes — with the harness's existing 17 cases unchanged and still green.

### Corrections to this node's earlier draft (measured 2026-08-19 on `origin/main` 24831933)

Three claims that were true when this node was first drafted are now false, and
are corrected here rather than left standing:

1. **The host file exists and is CI-wired.**
   `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`
   is a real ~650-line harness with 17 numbered cases, created by
   `tactic-provision-exit11-worktree-residue` Unit 2 (that node is `phase:
   done`). It runs in CI as its own step at
   `.github/workflows/unit-tests.yml:287`. **New cases appended to it ride that
   step — no new CI wiring is owed, and none should be added.** The earlier
   "no provision-node-worktree test harness exists there (plan anchor drift)"
   framing (and the frontmatter `rationale` that repeats it) is stale.

2. **The host file already reserves this node's coverage.** Its header (lines
   6–17) records the deliberate deviation off `test-dispatch-scripts.sh` and
   says it "creates the fixture scaffolding
   tactic-provision-worktree-script-tests can extend for the
   check-node-selection gate-plumbing coverage (arg forwarding, exit 12/13
   pass-through, stamp write) that this file does NOT cover"; lines 43–45
   repeat the same hand-off. The two sides already point at each other.

3. **The earlier `## Placement` recommendation is void.** It proposed folding
   this work into `tactic-graph-router-transitions`. **There is no such node**
   in `intentions/` (the only `graph-router-*` nodes are
   `tactic-graph-router-conflict-routing`,
   `tactic-graph-router-live-worker-read-robust`,
   `tactic-graph-router-live-worker-visibility`). Its stated precondition is
   moot and the purpose-built host in (1) is the shared-fixture home that note
   was reaching for. **This node is planned standalone.**

### Verified system-under-test anchors

In `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`
(~455 lines; **locate by symbol, not by line number — the file moves**):

- `set -uo pipefail` at line ~98. **No `-e`**, which is why `GATE_RC=$?`
  after the command substitution works at all.
- Usage gate, ~lines 111–120:
  ```
  NODE_ID="${1:-}"
  SELECTED_PHASE="${2:-}"
  if [[ $# -ne 2 || -z "$NODE_ID" || -z "$SELECTED_PHASE" ]]; then
    echo "usage: provision-node-worktree <node-id> <selected-phase>" >&2
    exit 2
  fi
  ```
  Note `-ne 2`: **three** args also exits 2. A separate node-id slug regex
  check below it also exits 2 (already covered indirectly; not this node's
  scope).
- `sync_main_checkout "$PROJECT_ROOT"` (from `lib.sh`) runs **before** the
  gate; its failures exit 2 and are already covered by cases 15–16.
- Gate call and stamp, ~lines 179–195:
  ```
  STAMP_PATH="$PROJECT_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"
  GATE_FP=$(cd "$PROJECT_ROOT" && npx tsx packages/intentionsutil/scripts/check-node-selection.ts \
    "$NODE_ID" "$SELECTED_PHASE" --dir "$PROJECT_ROOT/intentions" --stamp "$STAMP_PATH")
  GATE_RC=$?
  if [[ "$GATE_RC" -eq 12 || "$GATE_RC" -eq 13 ]]; then
    exit "$GATE_RC"
  fi
  if [[ "$GATE_RC" -ne 0 ]]; then
    echo "provision-node-worktree: check-node-selection failed (exit $GATE_RC)" >&2
    exit 2
  fi
  ORIGIN_SHA=$(git -C "$PROJECT_ROOT" rev-parse origin/main)
  printf '%s %s\n' "$GATE_FP" "$ORIGIN_SHA" >"$STAMP_PATH"
  ```
  Three consequences the earlier draft did not name:
  - **(a)** the gate receives **six** argv items after `npx`: `tsx`,
    `packages/intentionsutil/scripts/check-node-selection.ts`, `<node-id>`,
    `<selected-phase>`, `--dir <PROJECT_ROOT>/intentions`,
    `--stamp <STAMP_PATH>` — eight lines in the argv journal. The `--stamp`
    flag appears nowhere in the earlier draft.
  - **(b)** a gate exit that is **neither 0 nor 12/13** (e.g. 1) maps to **exit
    2** with `provision-node-worktree: check-node-selection failed (exit N)` —
    an entirely untested branch.
  - **(c)** on 12/13 the SUT writes **no stderr of its own** (the comment says
    the gate already emitted the reason). A test must therefore assert
    **pass-through of the gate's stderr**, and assert the SUT-authored
    `check-node-selection failed` line is **absent**.
  - The stamp is written **only on gate exit 0**, so it must be asserted
    **absent (or unchanged)** on the 12/13 and mechanical-error paths.

### Verified harness scaffolding (already present — do not re-scaffold)

In `test-provision-node-worktree.sh`:

- **Fixture** (lines ~59–118): bare `$ORIGIN` + `$MAIN_WT` main checkout, a
  real `intentions/` store on `origin/main` from the seed commit
  (`intentions/prov-seed-node.md`, lines ~80–85),
  `DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT"` so `resolve_main_worktree` skips the
  `git worktree list` walk, SUT + `lib-graph-worktree.sh` /
  `lib-worktree-residue.sh` / **real** `lib.sh` copied into `$SUT_DIR`, and a
  `dispatch-ci-ready` stub that always exits 0.
- **`npx` shim** (lines ~119–155): journals full argv one-per-line to
  `$NPX_LOG` (**truncated per invocation** — the SUT calls the gate exactly
  once per run, so the log always describes the run that just happened; an
  empty log means the gate was never reached), copies the `--dir` directory to
  `$NPX_DIR_COPY`, then `echo "test-fixed-fingerprint"; exit 0`. Written via an
  **unquoted** `<<STUB` heredoc that interpolates `$NPX_LOG` / `$NPX_DIR_COPY`
  at setup time and escapes runtime expansions as `\$@`, `\$a`.
- **`direnv` shim** + `$DIRENV_LOG` (lines ~161–171).
- **`npx_logged_dir()`** (lines ~157–159): awk helper reading the `--dir` value
  back out of `$NPX_LOG`. Three call sites (cases 14, 17).
- **`wt_path()`** (line ~173) and the stamp path convention
  `$(wt_path <id>).scope-fingerprint`.
- **`run_prov <id> [phase]`** (lines ~204–218): sets `PROV_OUT` / `PROV_STDERR`
  / `PROV_RC`, and **always passes exactly two args** (`phase` defaults to
  `implement`). Zero-/one-/three-arg usage cases therefore cannot go through
  it — see Unit 1.
- **`advance_origin_main()`** (lines ~535–548): separate-clone push helper used
  by cases 14–17.
- Assertions come from `test-helpers.sh` (`assert_eq`, `assert_contains`,
  `assert_file_contains`, `assert_file_exists`, `report_results`).
  **There is no `assert_not_contains`** in either file — negative assertions in
  this harness use the existing
  `assert_eq "<label>" "no" "$([[ ... ]] && echo yes || echo no)"` idiom
  (cases 11, 12, 14). Use that; do not add a new helper.
  `assert_contains` is deliberately `[[ == *needle* ]]`, never `echo | grep -q`
  (SIGPIPE-141 hazard documented at `test-helpers.sh:30-40`) — keep using it as
  `assert_contains label needle haystack`.

### Explicitly out of scope

- **Exit 11 (merge-conflict)** — already asserted by existing cases 1 and 8. No
  new regression case; adding one would be redundant.
- **Exit 10 (ci-waiting)** — currently unreachable in this harness because
  `dispatch-ci-ready` is stubbed to always exit 0. Covering it means
  parameterizing that stub as well. **Named here as an out-of-scope follow-up**,
  not attempted in this node. (This replaces the earlier draft's vague
  "10 / 11 unchanged" bullet, which was wrong about 10 and redundant about 11.)
- **The gate's verdict logic** — covered by `check-node-selection.ts`'s own
  unit tests. This node shims the gate and asserts *forwarding, exit mapping
  and stamp bytes only*. Do not build a real-gate fixture here; that is what
  `test-assert-node-selection.sh` is (it runs the **real**
  `check-node-selection.ts` in-place, deliberately un-stubbed, because its
  point is plumbing **plus** verdict). Keep that split.
- **New CI wiring** — the host file is already a CI step
  (`.github/workflows/unit-tests.yml:287`).
- **Any change to `provision-node-worktree` itself.** This node adds tests
  only. If a new case goes red against current behavior, that is a finding to
  record as a separate tactic, **not** licence to edit the SUT and not licence
  to weaken the case (`.claude/rules/test-integrity.md`).

---

## Unit 1 — Parameterize the harness scaffolding

**Scope.** `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`
only. Four scaffolding changes, no new test cases, no behavior change for the
existing 17:

1. **Make the `npx` shim's verdict runtime-parameterizable** (shim heredoc,
   lines ~144–153). Today it unconditionally prints `test-fixed-fingerprint`
   and exits 0. Read three env vars **inside the shim body**, with defaults
   that preserve today's behavior exactly:
   - `GATE_RC_OVERRIDE` (default `0`),
   - `GATE_FP_OVERRIDE` (default `test-fixed-fingerprint`),
   - `GATE_STDERR_OVERRIDE` (default empty).

   Semantics, mirroring the real gate: emit `GATE_STDERR_OVERRIDE` to **stderr**
   when non-empty; emit the fingerprint on **stdout only when the exit code is
   0** (the real gate prints no fingerprint on a fail path); then
   `exit "$GATE_RC_OVERRIDE"`. Keep the existing argv journalling and `--dir`
   copy **unchanged and unconditional** — they must run before the verdict
   branch so a 12/13 case can still assert what argv the gate was handed.

   **Heredoc hazard:** the shim is written with an *unquoted* `<<STUB` so
   `$NPX_LOG` / `$NPX_DIR_COPY` interpolate at setup time. Every new runtime
   expansion must be backslash-escaped in the heredoc source
   (`\${GATE_RC_OVERRIDE:-0}`, not `${GATE_RC_OVERRIDE:-0}`), or the value is
   baked in at setup time and every case sees the same verdict. Do **not**
   switch the heredoc to quoted (`<<'STUB'`) — that would break the existing
   `$NPX_LOG`/`$NPX_DIR_COPY` interpolation.

   **Hard constraint:** with none of the three vars set, the shim must behave
   byte-identically to today (fingerprint `test-fixed-fingerprint` on stdout,
   nothing on stderr, exit 0). Cases 1–17 must not change meaning.

2. **Add an arity-passthrough runner and refactor `run_prov` onto it**
   (lines ~204–218). Add `run_prov_raw()` that forwards `"$@"` verbatim to the
   SUT under the same shimmed `PATH` / `DISPATCH_GRAPH_MAIN_WORKTREE` and sets
   the same `PROV_OUT` / `PROV_STDERR` / `PROV_RC` globals with the same
   `set +e` / `set -e` bracketing. Then redefine
   `run_prov() { run_prov_raw "$1" "${2:-implement}"; }` so all 17 existing call
   sites keep working unchanged through one shared implementation.

3. **Add a gate-verdict runner.** `run_prov_gate <id> <phase> <rc> [fp] [stderr]`
   — same body as `run_prov_raw` but with `GATE_RC_OVERRIDE` /
   `GATE_FP_OVERRIDE` / `GATE_STDERR_OVERRIDE` set **inline on the SUT
   invocation** (not exported into the suite's own environment), so no override
   can leak into a later case. Defaults: `fp=test-fixed-fingerprint`,
   `stderr=""`.

4. **Generalize the argv reader.** Add
   `npx_logged_flag <flag>` (the existing `npx_logged_dir` awk one-liner with
   the matched token parameterized) and redefine
   `npx_logged_dir() { npx_logged_flag --dir; }` so cases 14 and 17 are
   untouched. This gives Unit 2 `npx_logged_flag --stamp` for free.

Also update the file header (lines 6–17 and 43–45): those two passages say this
file does **not** cover the gate plumbing and names this node as the future
carrier. After Unit 2 lands that is false. Reword them in **Unit 2** (not here)
so the header and the cases land together.

**Out of scope for this unit:** any new `echo "Case …"` block; any change to
the `direnv` or `dispatch-ci-ready` stubs; any change to `provision-node-worktree`.

**Recommended model:** sonnet.

---

## Unit 2 — Append the seven gate-plumbing cases

**Dependencies:** Unit 1.

**Scope.** `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`
only. Append cases **18–24** after case 17 and **before** the closing
`report_results` call (line ~650), following the existing file's conventions:
a `# ===` banner comment explaining *why* the case exists, an
`echo "Case N: …"` line, a unique `prov-case-*` node id per case, and
`assert_*` calls with `caseN`-prefixed labels.

Ordering note: cases 15–16 leave `$MAIN_WT` `reset --hard origin/main`, and
cases 11–12 put a real `.envrc` on `origin/main`. Any new case that reaches the
pass path therefore also exercises the `.envrc` provenance gate and the
`direnv` shim — which is fine (its branch is cut from `origin/main`, so the
`.envrc` matches), and is already the shape case 17 runs under. Each new case
must truncate `$NPX_LOG` (`: >"$NPX_LOG"`) before its run, as cases 14–17 do.

**Case 18 — argv forwarding (the full contract).**
`run_prov_gate "$id18" review 0` → exit 0. Assert `$(cat "$NPX_LOG")` equals
**exactly** the expected eight-line argv:
```
tsx
packages/intentionsutil/scripts/check-node-selection.ts
<id18>
review
--dir
$MAIN_WT/intentions
--stamp
$MAIN_WT/.claude/worktrees/<id18>.scope-fingerprint
```
Build the expected string with `printf` from `$MAIN_WT` / `$(wt_path "$id18")`
and compare with `assert_eq`. This single assertion pins arg **order**,
**count**, the selected-phase pass-through (`review`, not the `implement`
default), and the presence of `--stamp` — the item the earlier draft missed
entirely. Add one narrower companion assertion using
`assert_eq "case18 gate handed the stamp path" "$(wt_path "$id18").scope-fingerprint" "$(npx_logged_flag --stamp)"`
so a future argv reshuffle produces a readable failure rather than an
eight-line diff.

**Case 19 — usage arity gate (three sub-runs, one banner).** Uses
`run_prov_raw`, not `run_prov`:
- `run_prov_raw "$id19"` (one arg) → exit 2; stderr contains
  `usage: provision-node-worktree <node-id> <selected-phase>`;
  `$(cat "$NPX_LOG")` is empty (the gate was never reached).
- `run_prov_raw` (zero args) → exit 2, same stderr, gate never reached.
- `run_prov_raw "$id19" implement extra` (three args) → exit 2, same stderr,
  gate never reached. This is the `-ne 2` limb, which is easy to regress into a
  `-lt 2` and silently accept junk.

**Case 20 — exit-12 pass-through (stale-selection).**
`run_prov_gate "$id20" implement 12 "" "check-node-selection: stale-selection: phase: selected implement but node is now review"`
→ assert:
- `PROV_RC` is `12` (**not** collapsed to the generic exit 2);
- `PROV_STDERR` contains the shim's `stale-selection` line (pass-through);
- the SUT wrote **no line of its own**: `assert_eq … "no"
  "$([[ "$PROV_STDERR" == *"check-node-selection failed"* ]] && echo yes || echo no)"`;
- the stamp file `$(wt_path "$id20").scope-fingerprint` does **not** exist
  (same `yes/no` idiom against `[[ -f … ]]`);
- no worktree was created at `$(wt_path "$id20")` — the gate short-circuits
  before any worktree work;
- `$DIRENV_LOG` is empty for this run (truncate it first) — the `.envrc`
  warm-up is downstream of the gate and must not run.

**Case 21 — exit-13 pass-through (scope-stale).** Same shape as case 20 with
`rc=13` and a `scope-stale` stderr line. Keep it a separate case rather than a
loop: the two exits are separate `-eq` comparisons in the SUT and a typo can
break exactly one.

**Case 22 — mechanical gate error maps to exit 2.**
`run_prov_gate "$id22" implement 1 "" "check-node-selection: boom"` → assert
`PROV_RC` is `2`; `PROV_STDERR` contains
`provision-node-worktree: check-node-selection failed (exit 1)`; the shim's own
stderr also survives; no stamp file; no worktree. This is branch (b) above —
untested today, and the branch whose caller (`dispatch-graph-execute`'s `*)`
arm) parks the node, so a 12 misrouted here becomes a spurious office-hours
park.

**Case 23 — stamp bytes on a passing gate.**
`run_prov_gate "$id23" implement 0 case23-fingerprint` → assert exit 0; assert
`$(cat "$(wt_path "$id23").scope-fingerprint")` equals exactly
`case23-fingerprint $(git -C "$MAIN_WT" rev-parse origin/main)` — one line,
fingerprint then SHA, single space. (`$(cat …)` strips the trailing newline the
SUT's `printf` writes, so compare against the bare one-line string.) Also
assert the file has exactly one line (`wc -l` = 1, i.e. the trailing newline is
present and there is no second line). Keep the override fingerprint a
single whitespace-free token, or the two-field format assertion becomes
ambiguous.

**Case 24 — a refused gate leaves a pre-existing stamp untouched.** Pre-write
`stale-fingerprint deadbeef` to `$(wt_path "$id24").scope-fingerprint`, then
`run_prov_gate "$id24" implement 12 "" "…stale-selection…"` → assert exit 12 and
that the stamp file's contents are still `stale-fingerprint deadbeef`. This is
the realistic re-provision shape (a prior pass already stamped) and pins "the
stamp is written **only** on gate exit 0" against a future refactor that hoists
the `printf` above the exit branches.

**Header reconcile (same unit).** Rewrite the two passages in the file header
that are falsified by these cases:
- lines ~13–17: "…it also creates the fixture scaffolding
  tactic-provision-worktree-script-tests can extend for the check-node-selection
  gate-plumbing coverage (arg forwarding, exit 12/13 pass-through, stamp write)
  that this file does NOT cover" → state that that coverage **now lives here**
  (cases 18–24, `tactic-provision-worktree-script-tests`).
- lines ~43–45: "Does NOT cover the check-node-selection gate plumbing itself
  (exit 12/13 pass-through, stamp contents) — that is
  tactic-provision-worktree-script-tests." → replace with the still-true
  residue: the gate's **verdict** is not asserted here (the shim decides it);
  that is `check-node-selection.ts`'s unit tests and
  `test-assert-node-selection.sh`. Add the one remaining gap explicitly:
  **exit 10 (ci-waiting) is still uncovered** because `dispatch-ci-ready` is
  stubbed to always exit 0.

**Out of scope for this unit:** exit-10 coverage; any edit to
`provision-node-worktree`; any new CI step.

**Recommended model:** sonnet.

---

## Reuse

Everything below already exists. Extend in place; do not re-scaffold, and do
not create a new test file.

- `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`
  — **the host file.** Fixture (`$ORIGIN` / `$MAIN_WT` / `$SUT_DIR` /
  `$BIN_DIR`, `DISPATCH_GRAPH_MAIN_WORKTREE` override, seeded `intentions/`
  store, `dispatch-ci-ready` stub) at lines ~59–118; `npx` shim + `$NPX_LOG` +
  `$NPX_DIR_COPY` at ~119–155; `npx_logged_dir()` at ~157–159; `direnv` shim +
  `$DIRENV_LOG` at ~161–171; `wt_path()` at ~173; `run_prov()` at ~204–218;
  `advance_origin_main()` at ~535–548; `report_results` call at the end.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh` — `assert_eq`,
  `assert_contains`, `assert_file_contains`, `assert_file_exists`,
  `report_results` (sourced already at line ~57). Note the SIGPIPE rationale at
  lines 30–40; there is **no** `assert_not_contains` — use the existing
  `yes/no` `assert_eq` idiom for negatives.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree` — the
  SUT. Its header (lines ~46–95) is the authoritative exit-code table
  (0/2/10/11/12/13/14); quote it in case banners rather than re-deriving
  semantics.
- `.claude/skills/dispatch-propagate/scripts/assert-node-selection` (lines
  15–26) — the canonical exit-code vocabulary for 0/12/13/1/2, in prose. Use
  its wording in the new case descriptions.
- `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh` —
  the **sibling** suite for the other wrapper. Read its header (lines 1–17) to
  see why it runs the SUT in place with the **real** gate. Do not duplicate its
  approach here, and do not duplicate its verdict coverage.
- `packages/intentionsutil/scripts/check-node-selection.ts` — `EXIT_STALE_SELECTION
  = 12` / `EXIT_SCOPE_STALE = 13` (lines 58–59), the `--stamp` flag parse
  (lines ~419–422), and the "missing stamp fails OPEN during bootstrap" policy
  (lines ~384–391) — the reason a silently-missing stamp is invisible and worth
  pinning.
- `.github/workflows/unit-tests.yml:287` — the existing CI step that runs the
  host file. Confirm it is still there; add nothing.

## Verification

Primary check — the host suite, with the new cases, run exactly as CI runs it:

```verify
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

Non-regression on the shared helper file (it is sourced by the sibling suite
too, and Unit 1 touches runner/helper shapes near it):

```verify
.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh
```

Anti-vacuity floor — the case count must actually have grown. This check
**fails today** (the file has 17 `Case` banners), which is what makes it a live
assertion rather than a tautology:

```verify
test "$(grep -c '^echo "Case' .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh)" -ge 22
```

The two stale hand-off sentences must be gone from the host file's header — they
become false the moment Unit 2 lands. Both anchors below are single lines in the
file today (verified 2026-08-19: `grep -cF` returns 1 for each), so both checks
genuinely **fail today**. Do not anchor on `that is
tactic-provision-worktree-script-tests` — that phrase is line-wrapped across the
header's lines 44–45, so a `grep -F` for it matches nothing even now and the
negated check would pass vacuously:

```verify
if grep -qF 'that this file does NOT cover' .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh"; exit 1; fi
```

```verify
if grep -qF 'Does NOT cover the check-node-selection gate plumbing' .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh"; exit 1; fi
```

Manual / judgment checks (not auto-runnable):

- **Confirm the 17 pre-existing cases still assert what they asserted.** Diff
  the suite's output before and after Unit 1: with no `GATE_*_OVERRIDE` set,
  cases 1–17 must produce the identical PASS lines. A shim default that drifted
  (e.g. the fingerprint no longer reaching stdout) would show up as case 14's
  or 23's stamp assertions changing meaning rather than as an obvious failure.
- **Confirm no override leaks between cases.** Read the `run_prov_gate` body:
  the `GATE_*_OVERRIDE` assignments must be *inline on the SUT invocation*, not
  `export`ed. A leaked override would make a later case's verdict depend on
  execution order — the kind of flake that only shows up on a re-ordered file.
- **If any new case goes red against current SUT behavior, stop and record a
  finding.** Do not edit `provision-node-worktree` and do not soften the case
  (`.claude/rules/test-integrity.md`). A red new case here means the plumbing
  contract differs from what the SUT's own header documents, which is a
  separate defect worth its own tactic.
- **Sandbox note.** `provision-node-worktree` normally needs
  `dangerouslyDisableSandbox: true` from a Claude session, but the harness runs
  it against a temp fixture with shimmed `npx` / `direnv` and no network — the
  existing 17 cases pass in CI under those conditions, so new cases inherit
  that and need no special handling. If a local run fails on a `bwrap` /
  read-only error rather than an assertion, that is the sandbox, not the test:
  retry with the override.
