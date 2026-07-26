---
id: tactic-main-red-sync-completion-test
kind: tactic
statement: Add a direct test for dispatch-graph-main-red-sync's green-main completion path
owner: ai
status: codified
parent: null
rationale: "Retained review residue from PR #2919 (tactic-graph-main-self-heal):
  dispatch-graph-main-red-sync's green-main recovery-completion logic (dump-node
  -> jq phase=done -> write-node -> graph-commit --base, gated on
  execution===null) is untested — test-dispatch-scripts.sh fakes the whole
  script and scopes its internals out. The plan's own verification section
  deferred this to manual simulated-red-sha runs. Finalized by a 2026-07-22
  /align-tactics per-node pass: no drift found (dispatch-graph-main-red-sync
  unchanged since the residue was recorded; no superseding node exists). That
  same finalize pass surfaced a live production bug: this tactic's own id starts
  with the literal string dispatch-graph-main-red-sync used as a bare startsWith
  prefix to find open main-red-episode latch nodes, so the live tick mistook
  this tactic for one of its own latches and mechanically auto-completed it
  mid-session, racing this session's graph-commit landing and forcing a
  park/recovery. Fixed same-day in PR #2941 by anchoring the match to the exact
  tactic-main-red-<8-hex-shortsha> shape; the plan below adds an explicit
  regression case (f) for it."
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
execution:
  branch: tactic-main-red-sync-completion-test
  pr: 2941
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a direct test for dispatch-graph-main-red-sync's green-main completion path

Deferred from the `/review-fix` pass on PR #2919 (`tactic-graph-main-self-heal`),
review disposition `Deferred` (code-review residue). Finalized by a
`/align-tactics tactic-main-red-sync-completion-test` per-node pass
(2026-07-22): no drift found — `dispatch-graph-main-red-sync` is unchanged
since this residue was recorded, and no other node in the graph supersedes
this test.

**Note on this node's own history:** during finalize, this tactic's own id
(starting with the literal string `tactic-main-red-`) collided with the bare
`startsWith` prefix `dispatch-graph-main-red-sync` used to find real
`tactic-main-red-<shortsha>` episode latches, so the live production tick
mechanically auto-completed this node mid-decomposition, racing the
finalize's own `graph-commit` and forcing a park/recovery. Fixed same-day in
PR #2941 by anchoring the match to the exact 8-hex-shortsha shape; case (f)
below is the regression test for it.

**2026-07-23 queue audit — reset to `implement`.** The same live bug fired a
SECOND time and auto-completed this node to `phase: done` (commit `c9dcb954`,
a bare `phase: implement -> done` flip with no work delivered), leaving it on
neither the dispatch nor the office-hours queue while its PR sat open and
unmerged. The audit reset `phase` to `implement` and pointed `execution` at
branch `tactic-main-red-sync-completion-test` / PR #2941. **The anchor fix is
already committed on that branch** (`51f190b9`), so the "Edit ONLY
`test-dispatch-scripts.sh`" scope below applies to the REMAINING work: the
test section, including case (f). Do not re-apply the script fix. The branch
was 120 commits behind `main` and CI was red on 4 pre-existing `guard-halt`
fixture failures fixed on main by #2916 (`72d12dac`); `origin/main` was
merged in (`3183f5be`) and the full suite passes locally (3022/3022).

## Context

`dispatch-graph-main-red-sync`
(`.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync`,
~112 lines) reads open `tactic-main-red-*` graph nodes, and — only when
`repo-health --main-broken-sha` reports main green AND a node's
`execution === null` — mechanically completes each node to `phase: "done"` via
`dump-node.ts` → `jq` → `write-node.ts` → `graph-commit`, with that whole
per-node completion subshell redirected `1>&2` so no completion chatter leaks
onto its stdout (whose contract is: the initial-read open node ids, one per
line, nothing else). The existing test at
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:~21290-21770`
fakes the WHOLE script and only tests caller wiring; the script's real
internal logic (green-and-null→complete, non-null→skip, red→skip,
probe-fail→skip, stdout-purity) is untested. This adds a direct bash-harness
test exercising the real script against fakes for the graph store,
`repo-health`, `dump-node.ts`/`write-node.ts` (via a fake `npx`), and
`graph-commit`.

**Adversarial verdict:** not independently verified (this is code-review
residue, already confirmed by `/code-review`'s own internal review pass — per
the review-fix disposition table, Lane-A findings are not re-run through the
shared adversarial-verify step).

**Source PR:** #2919 (`tactic-graph-main-self-heal`).

## Unit of work (one unit, one PR)

### Scope

- Edit ONLY
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.
- Insert one new `# ===`-delimited test section between the end of the
  `assert-worktree-fresh` section (after the line
  `rm -rf "$AWF_ROOT" "$AWF_BARE" "$AWF_CLONE" "$AWF_OFFLINE"`, currently
  around line 31133) and the `# === summary ===` block that precedes
  `report_results` (currently around line 31135-31138). The section builds its
  own dedicated fixture (mktemp root + `rm -rf` at the end), following the
  per-section fixture style of the two sections immediately above it
  (`graph-select-target` around lines 31005-31063 and `assert-worktree-fresh`
  around lines 31075-31133) — do **not** use the file's global `setup`/
  `teardown` (those build a flat tree; this test needs a nested
  miniature-repo tree).
- Out of scope: do **not** modify the existing wholesale-fake wiring test at
  ~21290-21770. Do **not** test the internals of
  `dump-node.ts`/`write-node.ts`/`graph-commit`/`repo-health`/`store.ts` —
  those have their own suites; this test asserts only CALL/NO-CALL and
  argument shape at the fake boundary, plus stdout purity.

### Recommended model

**sonnet** — all fake source is given verbatim below; the two judgment points
(ESM `package.json` placement, `tsx` resolution via a `node_modules` symlink)
are fully specified and pre-verified in this plan.

### Fixture design

The real script derives
`REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"` (4 levels up from its own
on-disk location) and `cd`s there before every store read / completion call.
So the fixture is a miniature repo root with the script copied to
`<root>/.claude/skills/dispatch-propagate/scripts/`, making its relative-path
math resolve inside the fixture. Fakes are driven by env vars per case; the
fake `store.js` is plain ESM JS (no `.md` fixtures, no YAML parsing needed).

**ESM fact (verified against the real repo):** the real repo's root
`package.json` has no `"type"` field, but `packages/intentionsutil/package.json`
has `"type": "module"`. Node picks module-vs-commonjs for
`<root>/packages/intentionsutil/src/store.js` by walking up to the nearest
`package.json`. The fixture must contain
`<root>/packages/intentionsutil/package.json` with `{"type":"module"}`, or
`export function` in the fake `store.js` throws a CommonJS SyntaxError.

**tsx resolution fact:** the script runs `node --import tsx/esm -e '...'` with
cwd=`<root>` (the fixture root has no `node_modules`), so `tsx/esm` won't
resolve there on its own. Symlink the real repo's `node_modules` into the
fixture root: `ln -s "$REAL_REPO_ROOT/node_modules" "$root/node_modules"`
where `REAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"` (`$SCRIPT_DIR`
here is the TEST FILE's own dir, i.e. the existing top-of-file variable at
`test-dispatch-scripts.sh:8`). tsx passes plain `.js` through unchanged. (The
symlink-pwd hazard noted in the `graph-select-target` section's comment,
around line 31001, is about symlinking the SCRIPT under test itself — not
about a `node_modules` symlink, which is safe here.)

**Sandbox note for the implementing session:** running `npx tsx ...` may need
`dangerouslyDisableSandbox: true` (tsx's IPC pipe under `/tmp/claude-*` can hit
`EPERM` under the sandbox) — verify empirically per `.claude/rules/sandbox.md`
if the verification run below fails with an `EPERM`/`listen` error.

### Exact section to insert (verbatim; adapt only surrounding whitespace)

```bash
# ============================================================================
# Test: dispatch-graph-main-red-sync — real internal completion logic
# (tactic-main-red-sync-completion-test)
# ============================================================================
# Exercises the REAL script (not the wholesale fake at ~21290): green+null ->
# complete; execution non-null -> skip (never preempt in-flight fix); red ->
# skip; probe-fail(UNKNOWN) -> skip; and stdout purity (only node ids, proving
# the completion subshell's `1>&2` redirect). Fixture is a miniature repo root
# so the script's SCRIPT_DIR/../../../.. math resolves inside it (same style as
# the graph-select-target / assert-worktree-fresh sections above). store.js is a
# fake plain-ESM module driven by env vars; npx (dump-node/write-node) and
# graph-commit are faked and only logged. node_modules is symlinked so
# `node --import tsx/esm` resolves tsx (which passes the plain-JS fake through).
echo "Test: dispatch-graph-main-red-sync — real completion internals"
REAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MRS_ROOT=$(mktemp -d)
MRS_SCRIPTS="$MRS_ROOT/.claude/skills/dispatch-propagate/scripts"
MRS_LOG="$MRS_ROOT/logs"
mkdir -p "$MRS_SCRIPTS" "$MRS_ROOT/bin" "$MRS_LOG" \
         "$MRS_ROOT/packages/intentionsutil/src" \
         "$MRS_ROOT/packages/intentionsutil/scripts"
ln -s "$REAL_REPO_ROOT/node_modules" "$MRS_ROOT/node_modules"
# Real script under test — physical copy (REPO_ROOT derives from its location).
cp "$SCRIPT_DIR/dispatch-graph-main-red-sync" "$MRS_SCRIPTS/dispatch-graph-main-red-sync"
chmod +x "$MRS_SCRIPTS/dispatch-graph-main-red-sync"
# type:module so the fake store.js is treated as ESM (else `export` throws).
printf '{"type":"module","name":"fixture-intentionsutil"}\n' \
  > "$MRS_ROOT/packages/intentionsutil/package.json"
# Fake ESM store: ignores dir; listNodes/readNode driven by env vars.
cat > "$MRS_ROOT/packages/intentionsutil/src/store.js" <<'STORE'
export function listNodes(_dir) {
  return JSON.parse(process.env.FAKE_NODES || "[]");
}
export function readNode(_dir, id) {
  const map = JSON.parse(process.env.FAKE_EXECUTIONS || "{}");
  const execution = Object.prototype.hasOwnProperty.call(map, id) ? map[id] : null;
  return { id, phase: "implement", execution };
}
STORE
# Fake repo-health sibling (resolved via the script's SCRIPT_DIR). Mirrors the
# arg-dispatch stub at test-dispatch-scripts.sh:21281-21291.
cat > "$MRS_SCRIPTS/repo-health" <<'HEALTH'
#!/usr/bin/env bash
case "$1" in
  --main-broken-sha)
    if [[ -n "${FAKE_HEALTH_EXIT:-}" && "${FAKE_HEALTH_EXIT}" != "0" ]]; then
      exit "${FAKE_HEALTH_EXIT}"
    fi
    printf '%s' "${FAKE_MAIN_BROKEN_SHA:-}"
    ;;
esac
exit 0
HEALTH
chmod +x "$MRS_SCRIPTS/repo-health"
# Fake npx: only `npx tsx <path-ending dump-node.ts|write-node.ts> ...`; anything
# else fails loudly so an unexpected real-npx call can't be silently masked.
cat > "$MRS_ROOT/bin/npx" <<'NPX'
#!/usr/bin/env bash
if [[ "$1" != "tsx" ]]; then
  echo "fake npx: unexpected invocation: $*" >&2; exit 3
fi
shift
script="$1"; shift
case "$script" in
  *dump-node.ts)
    outdir=""; id=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --out-dir) outdir="$2"; shift 2 ;;
        *) id="$1"; shift ;;
      esac
    done
    echo "dump-node $id --out-dir $outdir" >> "$FAKE_LOG_DIR/dump-node.log"
    printf '{"id":"%s","phase":"implement"}\n' "$id" > "$outdir/$id.json"
    printf 'base-manifest-line\n' > "$outdir/base-manifest.txt"
    printf '%s\n' "$outdir/base-manifest.txt"   # stdout -> MANIFEST var
    ;;
  *write-node.ts)
    file=""
    while [[ $# -gt 0 ]]; do
      case "$1" in --file) file="$2"; shift 2 ;; *) shift ;; esac
    done
    echo "write-node --file $file" >> "$FAKE_LOG_DIR/write-node.log"
    printf 'wrote node -> %s\n' "$file"
    ;;
  *) echo "fake npx: unexpected tsx script: $script" >&2; exit 3 ;;
esac
exit 0
NPX
chmod +x "$MRS_ROOT/bin/npx"
# Fake graph-commit — run as a direct relative-path exec from cwd=REPO_ROOT.
cat > "$MRS_ROOT/packages/intentionsutil/scripts/graph-commit" <<'GC'
#!/usr/bin/env bash
base=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base) base="$2"; shift 2 ;;
    -m) shift 2 ;;
    *) id="$1"; shift ;;
  esac
done
echo "graph-commit $id --base $base" >> "$FAKE_LOG_DIR/graph-commit.log"
exit 0
GC
chmod +x "$MRS_ROOT/packages/intentionsutil/scripts/graph-commit"

MRS_SCRIPT="$MRS_SCRIPTS/dispatch-graph-main-red-sync"
# 8 lowercase hex chars — must match the real script's anchored
# `^tactic-main-red-[0-9a-f]{8}$` filter (see dispatch-graph-main-red-sync's
# MAIN_RED_ID regex, fixed alongside this test's own genesis: a bare
# startsWith("tactic-main-red-") prefix test previously matched ANY tactic id
# merely beginning with that string — including this very tactic's own id,
# tactic-main-red-sync-completion-test — causing the live script to
# mechanically auto-complete it as though it were a real main-red-episode
# latch. A non-8-hex MRS_ID here (e.g. a 6-char "abc123") would silently fail
# to be recognized as "open" at all and every assertion below would break in
# a confusing way — keep it exactly 8 hex chars.
MRS_ID="tactic-main-red-cafebabe"
count_matches() { # <file> <pattern> -> single count (0 if file missing)
  if [[ -f "$1" ]]; then grep -c -- "$2" "$1" || true; else echo 0; fi
}
run_mrs() { # env vars come from caller (NAME=value words); clears logs first.
  # NOTE: caller-supplied NAME=value words arrive here via "$@" — a bash
  # function's "$@" is a runtime expansion, NOT literal source text, so bash's
  # assignment-prefix parsing (which only recognizes NAME=value written
  # literally before a command) does NOT apply to it; passing "$@" directly
  # before the script name would make those words the SCRIPT'S ARGUMENTS, not
  # environment variables. The external `env` command sidesteps this: env
  # parses its OWN leading NAME=value arguments (real runtime strings, not
  # source-level assignment-prefix parsing) and exports them for the command
  # it execs.
  rm -f "$MRS_LOG"/*.log
  env PATH="$MRS_ROOT/bin:$SAVED_PATH" FAKE_LOG_DIR="$MRS_LOG" \
    FAKE_NODES="[{\"id\":\"$MRS_ID\",\"phase\":\"implement\"}]" \
    "$@" "$MRS_SCRIPT" 2>/dev/null
}

# (a) open + green + execution null -> completion attempted, id still on stdout.
out=$(run_mrs FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS='{}')
assert_eq "main-red-sync(a): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(a): dump-node ran for the id" "1" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(a): write-node ran"           "1" "$(count_matches "$MRS_LOG/write-node.log" "$MRS_ID.patched.json")"
assert_eq "main-red-sync(a): graph-commit ran for the id" "1" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (b) open + green + execution non-null -> completion SKIPPED (no preempt).
out=$(run_mrs FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS="{\"$MRS_ID\":{\"prNumber\":7}}")
assert_eq "main-red-sync(b): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(b): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(b): write-node NOT run"   "0" "$(count_matches "$MRS_LOG/write-node.log" "$MRS_ID")"
assert_eq "main-red-sync(b): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (c) open + red (non-empty sha) -> no completion attempted at all.
out=$(run_mrs FAKE_MAIN_BROKEN_SHA="deadbeef" FAKE_EXECUTIONS='{}')
assert_eq "main-red-sync(c): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(c): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(c): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (d) probe failure (repo-health exit 1) -> MB_SHA=UNKNOWN -> no completion.
out=$(run_mrs FAKE_HEALTH_EXIT=1 FAKE_EXECUTIONS='{}')
assert_eq "main-red-sync(d): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(d): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(d): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (e) stdout purity is proven by the exact-equality assertion in case (a): the
# completion tools ran yet stdout equals ONLY the id — so the `) 1>&2` redirect
# held. A regression would leak dump-node/graph-commit chatter and fail (a).

# (f) a tactic id that merely STARTS WITH "tactic-main-red-" but is NOT the
# exact <8-hex> shortsha shape must be ignored entirely — it is not an open
# latch node at all, so it must not appear on stdout and must not be
# completed. Regression test for the anchored-regex fix (a bare startsWith
# prefix test previously matched this shape and caused
# tactic-main-red-sync-completion-test itself to be mistakenly auto-completed
# mid-decomposition).
LOOKALIKE_ID="tactic-main-red-sync-completion-test"
out=$(rm -f "$MRS_LOG"/*.log; env PATH="$MRS_ROOT/bin:$SAVED_PATH" FAKE_LOG_DIR="$MRS_LOG" \
  FAKE_NODES="[{\"id\":\"$LOOKALIKE_ID\",\"phase\":\"implement\"}]" \
  FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS='{}' "$MRS_SCRIPT" 2>/dev/null)
assert_eq "main-red-sync(f): non-shortsha lookalike id produces no stdout" "" "$out"
assert_eq "main-red-sync(f): dump-node NOT run for lookalike" "0" "$(count_matches "$MRS_LOG/dump-node.log" "$LOOKALIKE_ID")"
assert_eq "main-red-sync(f): graph-commit NOT run for lookalike" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$LOOKALIKE_ID")"

rm -rf "$MRS_ROOT"
```

After writing this, verify the ESM claim empirically from the fixture root
before trusting the full test run:

```bash
(cd "$MRS_ROOT" && node --import tsx/esm -e \
  'import("./packages/intentionsutil/src/store.js").then(m=>console.log(Object.keys(m)))')
```

should print `[ 'listNodes', 'readNode' ]`. If it instead throws a
CommonJS/`export` SyntaxError, the `packages/intentionsutil/package.json`
`"type":"module"` is missing or misplaced — fix that (do **not** rename the
module; the import specifier is hardcoded in the script under test). If it
throws "Cannot find package 'tsx'", the `node_modules` symlink is wrong.

### Reuse

- `assert_eq`, `PASS`/`FAIL`/`TOTAL`, `report_results`, `SAVED_PATH` — the
  file's existing globals (`test-dispatch-scripts.sh:17-47`); `$SCRIPT_DIR`
  (line 8) is the test file's own dir. Reuse them; do not redeclare.
- repo-health arg-dispatch fake pattern:
  `test-dispatch-scripts.sh:21281-21291`.
- Per-section miniature-repo fixture (mktemp root, copy script into nested
  `.claude/.../scripts/`, `rm -rf` cleanup, symlink-pwd hazard comment):
  `test-dispatch-scripts.sh` around lines 31005-31063 and 31075-31133.
- Copying `graph-commit` into a fixture `packages/intentionsutil/scripts/`
  dir alongside a placeholder `store.js` (because the tool itself is faked):
  `packages/intentionsutil/scripts/test-graph-commit.sh:99-114`;
  `graph-commit` wrapper-delegation precedent:
  `packages/intentionsutil/scripts/test-park-node.sh:256-277`.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

This is a self-verifying bash harness — the exact command
`.github/workflows/unit-tests.yml` runs. Each `assert_eq` increments
`PASS`/`FAIL`; the final `report_results` call returns non-zero if any
`FAIL`, so a mismatch makes the script exit non-zero. Expect the new
`main-red-sync(a..f)` assertions in the output and `0 failed` overall.

Manual/judgment verification: if the `npx tsx` invocations inside the new
section hit a sandbox `EPERM` (tsx's IPC pipe under `/tmp/claude-*`), rerun
with `dangerouslyDisableSandbox: true` per `.claude/rules/sandbox.md` rather
than treating it as a real test failure.

## Verification

Run the full bash harness the `unit-tests` CI job runs:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

The new `dispatch-graph-main-red-sync` completion-internals section must emit
its `main-red-sync(a)` through `main-red-sync(f)` assertions, and the harness
must report `0 failed` overall (`report_results` exits non-zero on any FAIL).
Confirm case (a) proves stdout purity (only the node id, no completion
chatter), cases (b)/(c)/(d) prove the non-null / red / probe-fail skips, and
case (f) proves the anchored-regex fix ignores the non-shortsha lookalike id.
If the section's `npx tsx` calls hit a sandbox `EPERM`, rerun with
`dangerouslyDisableSandbox: true` per `.claude/rules/sandbox.md` rather than
treating it as a real failure.
