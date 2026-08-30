---
id: tactic-target-workers-max-silent-corrupt-fallback
kind: tactic
statement: dispatch-target-workers silently substitutes its baked-in defaults
  (max_concurrent_workers = 8) when dispatch-config-load fails on a
  corrupt/unreadable dispatch.config/target-workers.json, so no caller-side
  fail-closed guard can ever engage for the realistic config-tamper case
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

# dispatch-target-workers silently substitutes its baked-in defaults (max_concurrent_workers = 8) when dispatch-config-load fails on a corrupt/unreadable dispatch.config/target-workers.json, so no caller-side fail-closed guard can ever engage for the realistic config-tamper case

## Context

Surfaced by the review-fix pass on PR #3034 (`tactic-pace-exempt-ceiling-fanout`), as a `red-team` finding classified `Deferred` — valid, but out of scope for that PR because the defect is in `dispatch-target-workers`, not in the caller that PR changed.

### The finding

`dispatch-target-workers` sets every tunable to a baked-in default *before* reading config, then loads config inside a bare `if` with stderr discarded:

```bash
MAX_WORKERS=8                                                    # :226
CONFIG_JSON=""                                                   # :237
if CONFIG_OUT=$("$SCRIPT_DIR/dispatch-config-load" target-workers 2>/dev/null); then   # :238  THE SWALLOW
  if [[ "$CONFIG_OUT" != "no-config" ]]; then                    # :239
    CONFIG_JSON="$CONFIG_OUT"
  fi
fi
```

`dispatch-config-load` has a **three-way** contract (its own header, `dispatch-config-load:16-22`):

- stdout `<normalized JSON>`, exit 0 — file present and valid;
- stdout `no-config`, exit 0 — file absent, feature inert;
- exit 1 — file present but invalid JSON or schema-invalid;
- exit 2 — usage error or environment misconfiguration (`resolve_project_root` failed and `DISPATCH_CONFIG_DIR` is unset, `dispatch-config-load:343`).

`dispatch-target-workers` collapses that three-way signal into two. On exit 1 or 2 the `if` simply does not enter, the loader's descriptive stderr is thrown away by `2>/dev/null`, and every tunable keeps its baked-in default. `--max` then prints `8` on exit 0 (`:269-272`) — a perfectly valid integer, indistinguishable from a deliberately configured ceiling of 8.

`dispatch.config/` is untracked and lives outside every git worktree — no PR review, no CI, no branch protection covers it — so any process able to write that one file can truncate or corrupt it, and a dangling instance-repo symlink produces the same result.

### Why the existing consumer guard does not save us

`tactic-pace-exempt-ceiling-fanout` (PR #3034) added the fail-closed guard at `dispatch-select-tick:786-806`: when `$MAX_WORKERS` does not match `^[0-9]+$`, `PACE_GAP=0` and `PACE_LANE_CLOSED="at-cap-ceiling-unreadable"`. That guard is correct **and stays correct** — but it can never fire for this corruption path, because a corrupt config never yields a non-numeric value. It yields the numeric default `8`.

An operator who had hardened the fleet to `max_concurrent_workers: 1` silently gets a ceiling of 8. Since `MAX_WORKERS` is now the sole bound on the at-cap pace-exempt lane, one tick could admit up to 8 gate-exempt workers instead of the pre-#3034 hardcoded `--top 1`. The routing-decision log shows an ordinary `pace-exempt-bypass-at-cap` with `gap: 8`; nothing flags the tampering. The same silent substitution also poisons the pace curve itself — `weekly_pace_floor_pct`, `weekly_terminal_pct`, `five_hour_target_*`, `exhaustion_threshold_pct` all revert to defaults in count mode with no signal at all.

**Adversarial verdict:** not independently re-verified by a skeptic pass (the finding was classified `Deferred`, not `Required`, so it did not enter `tactic-pace-exempt-ceiling-fanout`'s adversarial-verify stage); confirmed by direct reading of the source, and re-verified against the working tree at `9606210a` while authoring this plan — the anchors below are measured, not remembered.

**Source PR:** #3034.

### Intended outcome

`dispatch-target-workers` stops absorbing a config **failure** into a config **default**. "File absent" (legitimately inert, defaults intended) and "file present but unreadable/invalid" (an environment fault) become distinguishable at the process boundary: the first keeps today's behavior exactly, the second exits non-zero with the loader's own diagnostic reaching stderr. Every caller then gets a signal it can act on.

### Greenfield design (adopted)

The loader failure is fatal for the **whole script, all four modes** (count / `--reopen-at` / `--exhausted` / `--max`), using the capture-and-propagate idiom already established in this exact family:

```bash
CFG=""
CFG_RC=0
CFG=$("$SCRIPT_DIR/dispatch-config-load" <type>) || CFG_RC=$?
if [[ "$CFG_RC" -ne 0 ]]; then exit "$CFG_RC"; fi
if [[ "$CFG" == "no-config" ]]; then ... fi
```

(`dispatch-jit-engine:66-78`, `dispatch-statements-scan:104-114` — both carry the same doctrine comment: `"no-config" → silent no-op. A non-zero exit → the loader already printed its error; propagate a hard failure.`)

All-modes rather than `--max`-only, deliberately: a `--max`-only carve-out would fail loudly about the ceiling while continuing to mis-pace the entire fleet from defaults the operator did not choose. That is the same defect one field over. `.claude/rules/code-style.md` ("prefer clear errors over defensive fallbacks") and this strategy's own condition 16 as amended 2026-07-26 ("any config resolve/read/parse failure is treated as paused, never as not-paused") both point one way.

**Brownfield migration: none required.** The change is behavior-preserving for every input that is not already broken — valid config and absent config are byte-identical before and after. Only the already-faulted case changes, and it changes from silent-wrong to loud-stop. No config schema change, no new field, no operator action, no compatibility shim. The fleet still never writes the operator's config file (read-time resolution only — the 2026-07-11 human/machine config split).

### Consequence for callers — accepted, and the narrative it replaces

After the fix, on a corrupt `target-workers.json` the **autonomous** lane of `dispatch-select-tick` fails at the *earlier* `TARGET_N` guard, not at the pace-exempt ceiling guard:

- `:716 TARGET_N=$("$SCRIPT_DIR/dispatch-target-workers")` — no `|| fallback`, and `dispatch-select-tick` is `set -uo pipefail` (NOT `set -e`, `:95-97`), so `TARGET_N` is left empty;
- `:729-735` the existing numeric guard fires → `release_lock`, `DLOG_DISPOSITION="internal-error"`, `DLOG_SKIP_REASON="non-numeric-target"`, exit 2.

So the whole tick fails closed, which is strictly stronger containment than closing only the pace-exempt lane. This **supersedes** the earlier framing that the fix would make `at-cap-ceiling-unreadable` fire for the config-tamper case: it will not, and should not. `at-cap-ceiling-unreadable` remains the guard for the residual causes it was written for — `dispatch-target-workers` missing, non-executable, or crashed mid-run (already covered by `test-dispatch-select-tick.sh:622-640`, item 9).

Two other lanes keep their existing, deliberately different postures and are **not** changed here:

- `dispatch-select-tick:1007` and the other `--exhausted` reads use `|| EXHAUSTED="ok"` — fail open. On the explicit-node lane (`:1000-1012`) a corrupt config therefore still lets a deliberate human dispatch through. That is consistent with the recorded "human dispatch is sovereign" rule (clarification 173, lane 2) and is out of scope.
- `graph-select-target:393-395,410` fails open to `--top 1` on an unreadable ceiling. Clarification 179 records that this divergence is scoped to that caller and is explicitly not license for the autonomous lane; it stays as-is.

### Verified anchors (measured at `9606210a`, all paths repo-root-relative)

Prefer locating by the quoted symbol/string over the line number — earlier revisions of this body carried anchors that had drifted.

`.claude/skills/dispatch-propagate/scripts/dispatch-target-workers` (595 lines):

- `:205-215` — mode-arg parsing (`""` | `--reopen-at` | `--exhausted` | `--max`); an unrecognized arg prints to stderr and exits 2.
- `:218-227` — the baked-in default block; `MAX_WORKERS=8` at `:226`, set before any config read.
- `:231-236` — the comment block explaining the `// empty` per-field override convention (mentions that a future boolean tunable would need the schema validator to catch it first).
- `:237-242` — `CONFIG_JSON=""` / the swallowing `if` / the `!= "no-config"` inner test. **This is the edit site.**
- `:244-263` — the per-field `jq -r '.<field> // empty'` override loop; `:259-260` is `max_concurrent_workers` → `MAX_WORKERS`.
- `:265-272` — the `--max` short-circuit (`echo "$MAX_WORKERS"; exit 0`), placed before the telemetry load.
- `:488` — `-v max_workers="$MAX_WORKERS"` in the count-mode awk. Not to be touched.
- `:86-113` — the header's config-schema doc block (`max_concurrent_workers default 8` at `:106`).

`.claude/skills/dispatch-propagate/scripts/dispatch-config-load` (779 lines):

- `:16-22` — the stdout/exit-code contract quoted above. Cite it; do not re-derive it.
- `:24-26` — `DISPATCH_CONFIG_DIR` override; when set and non-empty the script does not require a git repo. This is the test seam.
- `:337-343` — the `resolve_project_root` failure → `exit 2` path.
- `:146-150`, `:574` — the `target-workers.json` schema block and the comment noting `dispatch-target-workers` substitutes a baked-in default per absent field.

`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` (1173 lines):

- `:95-97` — `set -uo pipefail`, deliberately not `set -e`.
- `:716` — autonomous `TARGET_N` read (no fallback).
- `:725` — `MAX_WORKERS=$(... --max 2>/dev/null) || MAX_WORKERS=""`, the hoisted ceiling read, deliberately non-fatal.
- `:729-735` — the `TARGET_N` numeric guard → `internal-error` / `non-numeric-target`, exit 2.
- `:786-806` — the pace-exempt fail-closed ceiling guard (`at-cap-ceiling-full` / `at-cap-ceiling-unreadable`) and the comments at `:768-785`, `:790-800` explaining why nothing heavier than a bare `echo` may live in the else branch (the `main-broken` probe and the reseed below must stay reachable). **Do not touch.**
- `:935-943` — the `--manual` lane's combined `TARGET_N` / `--max` read and numeric guard (note: no `2>/dev/null` on that `--max` read).
- `:142` — `--arg max_workers "${MAX_WORKERS:-}"` in `_dlog_select_emit`.

Other `dispatch-target-workers` consumers, all already tolerant of a non-zero exit (verified, no change needed): `dispatch-sample-usage:137-145` (prints "failed; skipping capacity sample", exit 1), `dispatch-schedule-convergence-reseed:110-122` (`|| TARGET_N=""` then a numeric guard → exit 2), `dispatch-schedule-reseed:160` (`--reopen-at` behind its own no-op path), `graph-select-target:325,393-395`.

### Tests and CI

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-target-workers.sh` (1076 lines, 46 tests, `set -euo pipefail`) is the suite. `tw_setup` (`:54-70`) mktemps a tree, copies `dispatch-target-workers`, `dispatch-config-load` and `lib.sh` into `scripts/` (chmod +x only the two executables — `lib.sh` is sourced), and exports `DISPATCH_CONFIG_DIR` plus a deliberately-missing `DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH`. `tw_teardown` (`:72-82`) rm -rf's the tree and unsets all six env vars.
- Tests write configs with `cat > "$DISPATCH_CONFIG_DIR/target-workers.json"` (eight sites: `:168,195,355,375,416,572,679,789`). **Every one writes valid JSON today**, so no existing test enters the new failure path.
- Assertions use `assert_eq "<label>" "<want>" "<got>"` from **`dispatch-test-fixture.sh:51-63`** — this suite sources `dispatch-test-fixture.sh` only, *not* `test-helpers.sh` (a different ~20-suite family). `dispatch-test-fixture.sh` provides `PASS`/`FAIL`/`TOTAL` and `report_results`; it has **no** `assert_contains` in scope, so stderr-substring assertions use the inline pattern from `test-dispatch-config-load.sh:230-243`.
- `grep -c -- '--max' test-dispatch-target-workers.sh` returns **0**: there is no `--max` test at all today. Adding the first ones is the natural verification hook.
- `test-dispatch-config-load.sh:230-243` (Test 4, invalid JSON → exit 1 + stderr) and `:570-587` (Test 10, `target-workers.json` with `"weekly_pace_floor_pct": "fifty"` → exit 1 naming the field) already prove the loader side is correct. The defect is entirely on the consumer side.
- CI: `run-unit-tests.sh:186-201` globs `"$SCRIPTS"/test-*.sh` and runs every one when `RUN_PR_SCRIPTS=true`, which is set when the PR touches any path under `.claude/skills/dispatch-propagate/scripts/*`. The SUT lives there, so this suite runs in CI for this PR. **Do NOT add an entry to `.github/workflows/unit-tests.yml`** — that explicit list (see its comment at `:233-238`) is only for suites whose SUT lives outside that scripts dir; a redundant entry is noise.

### Relationship to sibling nodes — do not absorb their scope

- **`tactic-config-unreadable-latch`** (draft; `phase: null`, `status: raw`) owns unifying the three config-read failure *sites* in `dispatch-select-tick` behind one durable, operator-visible latch (the `tactic-main-red-*` shape). It is **downstream** of this fix and out of scope here: build no latch, no graph-node writer, no retry. That tactic assumes the unreadable case is already *detected* at each call site; today it is not, because `dispatch-target-workers` absorbs the failure and emits its own numeric default. This node closes the detection gap so that node has something to latch onto. **Sequencing: this node first.**
- **`tactic-pace-exempt-ceiling-fanout`** (phase `main-qa`, `office_hours` set) owns the `:786-806` consumer guard. That guard is correct as written; this fix is upstream of it. Do not redesign it, and do not delete `at-cap-ceiling-unreadable` — it still covers the crashed/missing-binary cases.
- **`tactic-worker-cap-config-durability`** (phase `done`) already landed the routing-log `max_workers` field and the `:725` hoist, and established that `dispatch.config/target-workers.json` is untracked with a baked-in default of 8. Reuse that framing; its own failure mode (provenance/staleness of a deliberately-set value) is different and not superseded.
- **`tactic-dispatch-config-untracked-pace-curve`** (raw) owns the untracked-and-not-gitignored deletion risk on the same file, and **`tactic-dispatch-config-instance-repo`** owns git-tracking/provenance for `dispatch.config/`. Both out of scope.

### Strategy constraints that bind this fix

- The human/machine config split (2026-07-11): the fleet never writes the operator's config file. Read-time resolution only.
- Condition 16 as amended 2026-07-26 — pause evaluation fails **closed** on any config resolve/read/parse failure. That is the recorded precedent; a `--max` fix that failed open would contradict it.
- Clarification 179 — the autonomous at-cap pace-exempt lane fails closed on an unreadable ceiling, and `graph-select-target --standalone`'s fail-open-to-1 posture is explicitly not license for the autonomous lane.
- Clarification 107 — `dispatch.config/` stays project-root-resolved via `resolve_project_root`, with `DISPATCH_CONFIG_DIR` as the single documented override point. Do not move config resolution.
- `.claude/rules/code-style.md` — prefer clear errors over defensive fallbacks. The current `2>/dev/null` plus pre-set default is exactly the anti-pattern that rule names.
- `.claude/rules/shell-json.md` — is mechanically linted for net-new added lines in committed `.sh` files. Never `echo "$VAR" | jq`; use `<<<"$VAR"` or `printf '%s'`.

---

## Unit 1 — Make `dispatch-target-workers` propagate a config-load failure instead of substituting defaults

**Scope**

Single file: `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers`.

Replace the swallowing load block at `:237-242` — currently:

```bash
CONFIG_JSON=""
if CONFIG_OUT=$("$SCRIPT_DIR/dispatch-config-load" target-workers 2>/dev/null); then
  if [[ "$CONFIG_OUT" != "no-config" ]]; then
    CONFIG_JSON="$CONFIG_OUT"
  fi
fi
```

— with the capture-and-propagate shape used verbatim by `dispatch-jit-engine:66-78` and `dispatch-statements-scan:104-114`:

```bash
CONFIG_JSON=""
CONFIG_OUT=""
CONFIG_RC=0
CONFIG_OUT=$("$SCRIPT_DIR/dispatch-config-load" target-workers) || CONFIG_RC=$?
if [[ "$CONFIG_RC" -ne 0 ]]; then
  exit "$CONFIG_RC"
fi
if [[ "$CONFIG_OUT" != "no-config" ]]; then
  CONFIG_JSON="$CONFIG_OUT"
fi
```

Three required properties:

1. **No `2>/dev/null`** on the loader call — `dispatch-config-load`'s own descriptive stderr must reach the caller's stderr unmodified. Do not wrap it, do not re-print it, do not prefix it. (The `dispatch-auto-merge:65-68` / `dispatch-spawn-job:249-252` variant adds a script-prefixed line and flattens the exit code to 1; prefer the `jit-engine`/`statements-scan` form here, which preserves the loader's own 1-vs-2 distinction — 1 = corrupt file, 2 = environment fault — so callers and operators can tell them apart.)
2. **Exit code preserved**, not flattened: `exit "$CONFIG_RC"`.
3. **`no-config` unchanged**: an absent file still means "defaults are intended", exit 0, and every baked-in default at `:218-227` stands. This is the branch that must remain byte-equivalent in behavior.

The guard sits **before** the mode dispatch's effect, i.e. it applies to all four modes (count, `--reopen-at`, `--exhausted`, `--max`). That is deliberate — see "Greenfield design (adopted)" above. The `--max` short-circuit at `:265-272` needs **no** edit: once the load block cannot fall through on failure, `MAX_WORKERS` at that point is either a configured value or an intentional default.

Also update, in the same file:

- The comment block at `:231-236` — state the three-way contract explicitly and name `dispatch-config-load:16-22` as its home, replacing any wording that implies a failed load is tolerable.
- The header usage/exit-code prose near `:27-40` and the config-schema block at `:86-113` — add one line that a **present but invalid/unreadable** `target-workers.json` makes the script exit with the loader's own code (1 or 2) in every mode, printing nothing on stdout; an **absent** file is inert and uses defaults.

**Out of scope** (do not touch): the per-field `// empty` override loop at `:244-263`; the count-mode awk at `:488` and every other stage of the count/reopen/exhausted pipeline; `dispatch-select-tick` in any respect, including the `:786-806` guard and the `2>/dev/null` at `:725` (the same diagnostic already reaches stderr from the unredirected `:716` count-mode call one line earlier, so removing it would only duplicate noise); `graph-select-target`; `dispatch-config-load` itself; the `dispatch.config/target-workers.json` schema; any `.github/workflows/*.yml`.

**Recommended model:** sonnet

---

## Unit 2 — First `--max` tests, plus corrupt-config coverage for `--max` and count mode

**Scope**

Single file: `.claude/skills/dispatch-propagate/scripts/test-dispatch-target-workers.sh`. Append a new test section before the closing `report_results` (currently the last line, after the `# <<< END MOVED <<<` marker). Use `tw_setup` / `tw_teardown` (`:54-82`) verbatim and `assert_eq` from `dispatch-test-fixture.sh:51-63`.

Five cases:

1. **`--max` with no config file** (the `no-config` path) → prints `8`, exit 0. `tw_setup` alone already leaves `$DISPATCH_CONFIG_DIR` empty. This is the regression fence proving the fix did not break the intended-defaults path.
2. **`--max` with a valid config** → `printf '{"max_concurrent_workers": 3}\n' > "$DISPATCH_CONFIG_DIR/target-workers.json"`, expect `3`, exit 0. (Mirrors the existing valid-config writes at `:355` etc.)
3. **`--max` with corrupt JSON** → `printf 'not valid json {{{\n' > "$DISPATCH_CONFIG_DIR/target-workers.json"`, expect **exit 1**, **empty stdout** (assert the captured stdout is the empty string — this is the actual defect assertion: it must never be `8`), and stderr non-empty. Use the inline capture pattern from `test-dispatch-config-load.sh:230-243`:

   ```bash
   rc=0
   out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --max 2>"$TMPDIR_TEST/err.txt") || rc=$?
   assert_eq "--max corrupt config: exits 1" "1" "$rc"
   assert_eq "--max corrupt config: prints nothing (never the default 8)" "" "$out"
   ```

   Because the suite is `set -euo pipefail`, every invocation expected to fail **must** be written as `out=$(...) || rc=$?` — a bare command substitution would abort the whole suite.
4. **`--max` with schema-invalid JSON** → `printf '{"max_concurrent_workers": "eight"}\n' > ...` (valid JSON, rejected by the loader's schema — the shape proven by `test-dispatch-config-load.sh:570-587`), expect exit 1 and empty stdout.
5. **count mode with corrupt JSON** → same corrupt file, no mode arg, expect exit 1 and empty stdout. This is the all-modes half of the contract: it must not print `1` (the missing-telemetry fallback) or any other integer.

For case 3, also assert the loader's diagnostic survived — read `$TMPDIR_TEST/err.txt` and check it is non-empty using the `TOTAL=$((TOTAL+1))` / `if [[ ... ]]; then PASS=...; else FAIL=...; fi` inline form from `test-dispatch-config-load.sh:230-243` (there is no `assert_contains` in `dispatch-test-fixture.sh`'s scope). Keep the substring check loose (non-empty, or a stable fragment such as `target-workers`) rather than pinning the loader's exact wording.

Call `tw_teardown` at the end of every case. Do not add a `write_rl` call — `--max` short-circuits before the telemetry load (`:265-272`), and count-mode case 5 fails before telemetry matters.

**Out of scope**: modifying any of the 46 existing tests; touching `dispatch-test-fixture.sh`, `test-helpers.sh`, `test-dispatch-config-load.sh`, or `test-dispatch-select-tick.sh`; adding a new test file; adding an entry to `.github/workflows/unit-tests.yml`.

**Recommended model:** sonnet

**Dependencies:** Unit 1.

---

## Unit 3 — Make `test-dispatch-sample-usage.sh` hermetic against the host's real `dispatch.config/`

**Scope**

Single file: `.claude/skills/dispatch-propagate/scripts/test-dispatch-sample-usage.sh`.

`su_setup` (`:24-38`) copies `dispatch-target-workers`, `dispatch-config-load` and `lib.sh` into its tmp scripts dir but — unlike `tw_setup` (`test-dispatch-target-workers.sh:66`), `rr_setup` (`test-dispatch-refresh-rate-limits.sh:30`) and the reseed suite (`test-dispatch-schedule-reseed.sh:54`) — never exports `DISPATCH_CONFIG_DIR`. So `dispatch-config-load` resolves the **real** `<project-root>/dispatch.config/`. That is harmless today (a failed load is swallowed), but after Unit 1 a developer whose machine-local `target-workers.json` is invalid would see this suite go red for reasons unrelated to its SUT.

Add to `su_setup`, matching the sibling suites:

```bash
mkdir -p "$TMPDIR_TEST/config"
export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
```

and add `unset DISPATCH_CONFIG_DIR` to `su_teardown` (`:40-48`), alongside the existing unsets.

**Out of scope**: any assertion in that suite; the other suites (all already hermetic — verified: `test-dispatch-refresh-rate-limits.sh:30`, `test-dispatch-schedule-reseed.sh:54`, `test-dispatch-target-workers.sh:66` each export `DISPATCH_CONFIG_DIR` to an empty tmp dir; `test-dispatch-schedule-convergence-reseed.sh` and `test-graph-select-target.sh` stub `dispatch-target-workers` outright and never reach the loader).

**Recommended model:** sonnet

**Dependencies:** Unit 1.

---

## Reuse

- **`.claude/skills/dispatch-propagate/scripts/dispatch-jit-engine:66-78`** — the canonical `CFG` / `CFG_RC` capture-and-propagate idiom, including the doctrine comment. Copy the shape and adapt the wording; do not invent a new one.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-statements-scan:104-114`** — the identical idiom in a second script, confirming it is the established convention rather than a one-off.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-config-load:16-22`** — the three-way stdout/exit-code contract. Cite verbatim in the updated comments; do not re-derive it.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge:65-68`** and **`dispatch-spawn-job:249-252`** — the simpler `|| { echo err; exit 1; }` variant. Considered and **not** chosen (it flattens the loader's 1-vs-2 distinction); `dispatch-spawn-job:249-252`'s comment citing `code-style.md` is a good model for the rationale wording.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-sweep:105-129`** and **`dispatch-graph-census:53-68`** — the contrasting "log-and-default" family. Deliberately **not** reused for the failure half (defaulting is exactly the defect); the `^[0-9]+$` integer-guard idiom in `dispatch-sweep` is the same one already used at `dispatch-select-tick:786`.
- **`.claude/skills/dispatch-propagate/scripts/test-dispatch-target-workers.sh:54-82`** — `tw_setup` / `tw_teardown`, reused verbatim by Unit 2.
- **`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:51-63`** — `assert_eq` plus the `PASS`/`FAIL`/`TOTAL` globals and `report_results`. This is the fixture in scope for this suite; `test-helpers.sh` is a different family and must not be sourced here.
- **`.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh:230-243`** — the inline `rc=0; out=$(cmd 2>&1 1>/dev/null) || rc=$?` + `TOTAL/PASS/FAIL` stderr-substring pattern, reused by Unit 2 case 3.
- **`.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh:570-587`** — the `target-workers.json` schema-invalid fixture shape, reused by Unit 2 case 4.
- **`.claude/skills/dispatch-propagate/scripts/test-dispatch-refresh-rate-limits.sh:18-37`** — the `DISPATCH_CONFIG_DIR` setup/teardown pattern Unit 3 copies.

## Verification

Run the SUT's own suite plus every suite that copies or stubs `dispatch-target-workers`, since Unit 1 changes that script's failure behavior for all of them. All of these resolve their own `SCRIPT_DIR`, so they are cwd-independent.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-target-workers.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-sample-usage.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-refresh-rate-limits.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-schedule-reseed.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-schedule-convergence-reseed.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

Structural checks on Unit 1's edit. The first fence **must fail before the fix** (the string is present at `dispatch-target-workers:238` today) and pass after — it is not vacuous:

```verify
if grep -q 'dispatch-config-load" target-workers 2>/dev/null' .claude/skills/dispatch-propagate/scripts/dispatch-target-workers; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/dispatch-target-workers"; exit 1; fi
```

```verify
grep -q 'CONFIG_RC' .claude/skills/dispatch-propagate/scripts/dispatch-target-workers
```

```verify
grep -q 'exit "$CONFIG_RC"' .claude/skills/dispatch-propagate/scripts/dispatch-target-workers
```

End-to-end behavioral check, self-contained and repo-runnable (reproduces the defect against the real scripts through the `DISPATCH_CONFIG_DIR` seam, and asserts the fixed contract):

```verify
set -u
S=.claude/skills/dispatch-propagate/scripts
D=$(mktemp -d)
mkdir -p "$D/scripts" "$D/config"
cp "$S/dispatch-target-workers" "$S/dispatch-config-load" "$S/lib.sh" "$D/scripts/"
chmod +x "$D/scripts/dispatch-target-workers" "$D/scripts/dispatch-config-load"
export DISPATCH_CONFIG_DIR="$D/config"
export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$D/absent.json"
absent=$("$D/scripts/dispatch-target-workers" --max)
[ "$absent" = "8" ] || { echo "FAIL: absent config should still yield 8, got '$absent'"; exit 1; }
printf '{"max_concurrent_workers": 3}\n' > "$D/config/target-workers.json"
valid=$("$D/scripts/dispatch-target-workers" --max)
[ "$valid" = "3" ] || { echo "FAIL: valid config should yield 3, got '$valid'"; exit 1; }
printf 'not valid json {{{\n' > "$D/config/target-workers.json"
rc=0
bad=$("$D/scripts/dispatch-target-workers" --max 2>/dev/null) || rc=$?
[ "$rc" -ne 0 ] || { echo "FAIL: corrupt config must exit non-zero, exited 0 printing '$bad'"; exit 1; }
[ -z "$bad" ] || { echo "FAIL: corrupt config must print nothing, printed '$bad'"; exit 1; }
rc=0
cnt=$("$D/scripts/dispatch-target-workers" 2>/dev/null) || rc=$?
[ "$rc" -ne 0 ] || { echo "FAIL: count mode must exit non-zero on corrupt config, printed '$cnt'"; exit 1; }
rm -rf "$D"
echo "OK"
```

Lint (also runs in CI, and enforces `.claude/rules/shell-json.md` on net-new lines in committed `.sh` files):

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / judgment checks** (prose, not auto-runnable):

- Confirm on a live host that `dispatch-config-load`'s stderr actually reaches the journal when a tick runs against a corrupted config — i.e. that the diagnostic is not lost between `dispatch-target-workers`, `dispatch-select-tick:716`, and the systemd unit's log capture. The expected sequence in the journal is the loader's own message followed by `dispatch-select-tick: dispatch-target-workers returned non-numeric target ''` and a routing-decision record with `disposition=internal-error`, `skip_reason=non-numeric-target`.
- Confirm the routing-decision log's `max_workers` field is empty (not `8`) on that path — `dispatch-select-tick:142` emits `${MAX_WORKERS:-}`, and the `:725` read now fails. An empty field is the correct "unreadable" signal; a `8` would mean the fix did not take.
- Restore a valid `dispatch.config/target-workers.json` and confirm one normal tick selects as before. `dispatch.config/` is machine-local and untracked — the implementer must not commit, create, or modify any file under it, and must restore whatever was there before any manual experiment.
- Judgment call left to the implementer: if a fourth or later `dispatch-config-load` consumer is found still swallowing the loader's exit code while auditing, record it as a finding for `tactic-config-unreadable-latch` rather than fixing it here.
