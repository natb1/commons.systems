#!/usr/bin/env bash
#
# test-dispatch-fleet-alarm.sh — unit-test harness for dispatch-fleet-alarm.
#
# Dependency-injects every graph-touching call through the SUT's
# DISPATCH_FLEET_ALARM_* command overrides (the $systemctl_cmd pattern used by
# test-dispatch-daemon-liveness.sh), so the suite never touches the real
# intentions/ store, never runs tsx, and never reaches a git remote. The fixture
# is a miniature repo root — the SUT is copied into it so its
# SCRIPT_DIR/../../../.. math resolves inside the fixture — plus a tiny local
# git repo whose refs/remotes/origin/main stands in for the real remote (a local
# `update-ref` is enough; `git rev-parse origin/main:<path>` only resolves a
# ref). This mirrors test-dispatch-graph-main-red-sync.sh's fixture shape.
#
# Coverage: unknown-kind refusal; absent -> mint (exact node JSON shape,
# graph-commit WITHOUT --base); open + identical body -> no commit at all;
# open + differing body -> graph-commit --base <manifest>; --resolve with a
# non-null execution -> no write; --resolve with the node absent from
# origin/main -> hard refusal with a stderr diagnostic and a clean tree; the
# named silent-PASS invariant — a graph-commit that exits 0 without landing must
# make the SUT exit 1, not 0; and the MINIMUM REFRESH INTERVAL — a second
# re-detection with a DIFFERING body inside the interval must not commit, which
# is the brake that holds when a caller's body churns every pass. Fault
# injection on the mint rollback path (splice_body / restore_from_blob): (12) a
# writer that reports success but never creates the file rolls back cleanly;
# (13) the same with a 0-byte body file, reproducing the live incident's exact
# artifact; (14) a writer that creates a file with no frontmatter is caught by
# splice_body's positive shape assertion and rolled back; (15) a writer killed
# mid-write (0-byte file, non-zero exit) is a regression pin — the write-node
# exit alone short-circuits into rollback and graph-commit is never invoked;
# (16) a doctrine ratchet asserting the SUT source no longer contains the
# swallowed-status or truncate-before-write idioms the earlier three cases were
# written to catch. Rollback-honesty cases: (17) a node file that PRE-EXISTED
# the pass, with no origin/main blob, is never deleted by the rollback — it
# exits 70 (dirty residue) instead of claiming a clean rollback; (18) a rollback
# that cannot run (restore_from_blob returning non-zero) exits 70 and says
# ROLLBACK FAILED rather than logging a rollback that never happened; (19) an
# unresolvable refs/remotes/origin/main is an environment error (exit 69,
# nothing read or written), not an empty pre-write blob; (20) a ratchet against
# reintroducing an unchecked restore_from_blob call; (22) --resolve REFUSES on a
# node carrying a non-null office_hours — the park guard, which stops ruling
# (b)'s park-aware classify() (a parked node now reads `open`) from being turned
# around into --resolve mechanically completing a human's park.
#
# Every run injects DISPATCH_FLEET_ALARM_STATE_DIR (so the suite never writes
# the real ~/.local/share stamp) and pins
# DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL=0, so cases that are not ABOUT the
# rate limit are never silently gated by it. The rate-limit case sets its own
# interval and keeps the state dir across the two runs.
#
# Run under bash -c, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUT="$HARNESS_DIR/dispatch-fleet-alarm"
[[ -f "$SUT" ]] || { echo "error: dispatch-fleet-alarm not found at $SUT" >&2; exit 1; }
# The SUT's verify_landed() delegates to the real verify-landed primitive
# (packages/intentionsutil/scripts/verify-landed), which is NOT copied into
# the miniature fixture repo below — its `<id>=<blobsha>` mode is pure git
# plumbing (no tsx), so it is safe to run directly against the fixture's `-C`
# path without any stubbing. Resolved from HARNESS_DIR (this test file's real
# on-disk location), the same 4-up convention the SUT itself uses for its own
# REPO_ROOT, since the fixture's copy of the SUT resolves that math inside a
# repo that has no packages/ tree at all.
REAL_VERIFY_LANDED="$HARNESS_DIR/../../../../packages/intentionsutil/scripts/verify-landed"
[[ -x "$REAL_VERIFY_LANDED" ]] || { echo "error: verify-landed not found at $REAL_VERIFY_LANDED" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <label> <expected> <actual>
  if [[ "$2" == "$3" ]]; then ok "$1"; else no "$1 (expected '$2', got '$3')"; fi
}
assert_contains() { # <label> <needle> <haystack>
  if [[ "$3" == *"$2"* ]]; then ok "$1"; else no "$1 (expected to contain '$2', got '$3')"; fi
}
assert_not_contains() { # <label> <needle> <haystack>
  if [[ "$3" != *"$2"* ]]; then ok "$1"; else no "$1 (expected NOT to contain '$2', got '$3')"; fi
}
# assert_absent_or_valid <label> <node-file> — the tactic's success invariant:
# after a failed mint the node file is EITHER fully absent OR fully valid
# double-fenced frontmatter. Never partial, never 0-byte.
assert_absent_or_valid() {
  local label="$1" f="$2"
  if [[ ! -e "$f" ]]; then ok "$label (absent)"; return; fi
  if [[ ! -s "$f" ]]; then no "$label (file exists but is 0 bytes)"; return; fi
  if [[ "$(head -n 1 "$f")" == "---" ]] \
     && awk '/^---$/{c++} END{exit (c>=2)?0:1}' "$f"; then
    ok "$label (valid frontmatter)"
  else
    no "$label (file exists with malformed frontmatter)"
  fi
}

# --- fixture repo root -------------------------------------------------------
FR="$WORK/repo"
FR_SCRIPTS="$FR/.claude/skills/dispatch-propagate/scripts"
LOG="$WORK/logs"
BIN="$WORK/bin"
mkdir -p "$FR_SCRIPTS" "$FR/intentions" "$LOG" "$BIN"
cp "$SUT" "$FR_SCRIPTS/dispatch-fleet-alarm"
chmod +x "$FR_SCRIPTS/dispatch-fleet-alarm"
# The SUT sources lib.sh from its own directory for the graph-write mutex
# (graph_write_lock_file / graph_write_lock_acquire), so the fixture needs the
# real library beside the copied SUT. It is sourced, never run.
cp "$HARNESS_DIR/lib.sh" "$FR_SCRIPTS/lib.sh"
FLEET_ALARM="$FR_SCRIPTS/dispatch-fleet-alarm"
# Every run takes the graph-write mutex; point it at the fixture so the suite
# never contends with a real fleet instrument on the developer's checkout.
LOCK_FILE="$WORK/graph-write.lock"

git -C "$FR" init -q
git -C "$FR" config user.email fixture@test
git -C "$FR" config user.name fixture
# The fixture's copy of the SUT is scaffolding, not repo content — keep it out
# of `git status` so the clean-tree assertion in case (6) means what it says.
printf '.claude/\n' > "$FR/.git/info/exclude"
printf 'fixture\n' > "$FR/README.md"
git -C "$FR" add README.md
git -C "$FR" commit -q -m init
git -C "$FR" update-ref refs/remotes/origin/main HEAD

# --- stubs -------------------------------------------------------------------
# All three write-path stubs record their argv to $LOG and are driven per-case
# by STUB_* env vars read at call time.

cat > "$BIN/stub-classify" <<'STUB'
#!/usr/bin/env bash
# usage: stub-classify <id> — print the fabricated classification.
echo "classify $1" >> "$STUB_LOG/classify.log"
printf '%s\n' "${STUB_STATE:-absent}"
STUB

cat > "$BIN/stub-write-node" <<'STUB'
#!/usr/bin/env bash
# usage: stub-write-node --file <json>. Stands in for
# `npx tsx write-node.ts --file`: records the JSON it was handed, then writes
# the node markdown the real writeNode would produce — YAML frontmatter between
# two `---` fences plus the generated `# <statement>` placeholder body.
#
# STUB_WN_SHAPE selects a fault-injection shape instead of the normal write
# (unset/default leaves the normal path byte-identical to before):
#   none     — write NOTHING and exit 0. Models a writer that reported success
#              without creating the file.
#   zero     — truncate the node file to 0 bytes and exit 1. Models a writer
#              killed mid-write.
#   no-fence — write a fence-less file and exit 0. Models a file that exists
#              but has no frontmatter.
echo "write-node $*" >> "$STUB_LOG/write-node.log"
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in --file) file="$2"; shift 2 ;; *) shift ;; esac
done
cp "$file" "$STUB_LOG/write-node-input.json"
id=$(jq -r .id "$file")
statement=$(jq -r .statement "$file")
phase=$(jq -r '.phase // "null"' "$file")
case "${STUB_WN_SHAPE:-}" in
  none)
    exit 0
    ;;
  zero)
    : > "$STUB_INTENTIONS/$id.md"
    exit 1
    ;;
  no-fence)
    printf 'garbage\n' > "$STUB_INTENTIONS/$id.md"
    exit 0
    ;;
esac
{
  printf -- '---\n'
  printf 'id: %s\n' "$id"
  printf 'kind: tactic\n'
  printf 'phase: %s\n' "$phase"
  printf -- '---\n'
  printf '# %s\n' "$statement"
} > "$STUB_INTENTIONS/$id.md"
STUB

cat > "$BIN/stub-dump-node" <<'STUB'
#!/usr/bin/env bash
# usage: stub-dump-node --out-dir <dir> <id>. Stands in for
# `npx tsx dump-node.ts`: writes <dir>/<id>.json (content from $STUB_NODE_JSON)
# and a base manifest, and prints the manifest path on stdout.
echo "dump-node $*" >> "$STUB_LOG/dump-node.log"
outdir=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in --out-dir) outdir="$2"; shift 2 ;; *) id="$1"; shift ;; esac
done
mkdir -p "$outdir"
printf '%s\n' "${STUB_NODE_JSON:-{\"id\":\"$id\",\"phase\":null,\"execution\":null\}}" > "$outdir/$id.json"
printf '%s=deadbeef\n' "$id" > "$outdir/base-manifest.txt"
printf '%s\n' "$outdir/base-manifest.txt"
STUB

cat > "$BIN/stub-graph-commit" <<'STUB'
#!/usr/bin/env bash
# usage: stub-graph-commit -C <repo> [--base <manifest>] -m <msg> <id>.
# STUB_GC_EXIT   — exit with this code instead of landing (default 0).
# STUB_GC_LAND=1 — actually land: commit intentions/ and move the fixture's
#                  origin/main ref, so the SUT's post-write blob verification
#                  can confirm the write. With STUB_GC_LAND unset the stub
#                  exits 0 having landed NOTHING — the silent-PASS shape the
#                  SUT's verification exists to catch.
echo "graph-commit $*" >> "$STUB_LOG/graph-commit.log"
repo=""
while [[ $# -gt 0 ]]; do
  case "$1" in -C) repo="$2"; shift 2 ;; *) shift ;; esac
done
[[ "${STUB_GC_EXIT:-0}" == "0" ]] || exit "${STUB_GC_EXIT}"
if [[ "${STUB_GC_LAND:-0}" == "1" ]]; then
  git -C "$repo" add -A intentions >/dev/null 2>&1
  git -C "$repo" commit -q -m 'fixture land' >/dev/null 2>&1
  git -C "$repo" update-ref refs/remotes/origin/main HEAD
fi
exit 0
STUB

chmod +x "$BIN"/stub-*

# run_alarm <env NAME=value ...> -- <args to the SUT ...>
# Clears the logs, then runs the SUT with every seam injected. stdout+stderr are
# captured into $OUT; the exit code lands in $RC.
OUT=""; RC=0
ALARM_STATE="$WORK/alarm-state"
KEEP_ALARM_STATE=0
run_alarm() {
  local -a envs=()
  while [[ $# -gt 0 && "$1" != "--" ]]; do envs+=("$1"); shift; done
  shift # drop the --
  rm -f "$LOG"/*.log "$LOG/write-node-input.json"
  # The rate-limit stamp is cross-RUN state, so it is wiped between cases
  # unless a case is deliberately exercising it (KEEP_ALARM_STATE=1).
  [[ "$KEEP_ALARM_STATE" == "1" ]] || rm -rf "$ALARM_STATE"
  OUT=$(env \
    STUB_LOG="$LOG" \
    STUB_INTENTIONS="$FR/intentions" \
    DISPATCH_FLEET_ALARM_STATE_DIR="$ALARM_STATE" \
    DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL=0 \
    DISPATCH_FLEET_ALARM_CLASSIFY_CMD="$BIN/stub-classify" \
    DISPATCH_FLEET_ALARM_WRITE_NODE_CMD="$BIN/stub-write-node" \
    DISPATCH_FLEET_ALARM_DUMP_NODE_CMD="$BIN/stub-dump-node" \
    DISPATCH_FLEET_ALARM_GRAPH_COMMIT_CMD="$BIN/stub-graph-commit" \
    DISPATCH_FLEET_ALARM_VERIFY_LANDED_CMD="$REAL_VERIFY_LANDED" \
    DISPATCH_FLEET_ALARM_INTENTIONS_DIR="$FR/intentions" \
    DISPATCH_FLEET_ALARM_RETRY_DELAY=0 \
    DISPATCH_FLEET_ALARM_RETRIES=1 \
    DISPATCH_GRAPH_WRITE_LOCK_FILE="$LOCK_FILE" \
    "${envs[@]}" "$FLEET_ALARM" "$@" 2>&1)
  RC=$?
}
log_lines() { # <logfile-basename> -> its contents (empty when absent)
  [[ -f "$LOG/$1" ]] && cat "$LOG/$1" || printf ''
}

BODY="$WORK/body.md"
printf 'The reading.\nSecond line.\n' > "$BODY"

# --- (1) unknown kind -> exit 64, no write -----------------------------------
run_alarm -- --kind not-a-kind --statement 'x' --body-file "$BODY"
assert_eq "(1) unknown kind exits 64" "64" "$RC"
assert_eq "(1) no classify"     "" "$(log_lines classify.log)"
assert_eq "(1) no write-node"   "" "$(log_lines write-node.log)"
assert_eq "(1) no graph-commit" "" "$(log_lines graph-commit.log)"

# --- (2) absent -> mint ------------------------------------------------------
run_alarm STUB_STATE=absent STUB_GC_LAND=1 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY"
assert_eq "(2) mint exits 0" "0" "$RC"
assert_contains "(2) write-node called with --file" "--file" "$(log_lines write-node.log)"
GC2="$(log_lines graph-commit.log)"
assert_contains "(2) graph-commit got the alarm id" "tactic-fleet-alarm-tick-stale" "$GC2"
assert_not_contains "(2) mint passes NO --base" "--base" "$GC2"
# The exact node JSON shape (jq -S both sides so key order is irrelevant).
EXPECTED_JSON="$WORK/expected.json"
cat > "$EXPECTED_JSON" <<'JSON'
{
  "id": "tactic-fleet-alarm-tick-stale",
  "kind": "tactic",
  "statement": "dispatch-tick has not run for 90m",
  "owner": "ai",
  "status": "raw",
  "parent": null,
  "serves": ["strategy-autonomous-execution"],
  "recovers": [],
  "rationale": "Auto-created by dispatch-fleet-alarm from an out-of-band fleet instrument reading. See the body for the reading.",
  "reading": null,
  "gap": null,
  "clarifications": [],
  "tooling_goals": [],
  "success_signal": null,
  "attention": null,
  "phase": null,
  "execution": null,
  "validates": [],
  "blocked_by": [],
  "office_hours": null,
  "pace_exempt": true,
  "rounds": null,
  "attributes": {}
}
JSON
assert_eq "(2) node JSON matches the required shape" \
  "$(jq -S . "$EXPECTED_JSON")" "$(jq -S . "$LOG/write-node-input.json")"
# body_region — the lines between this script's owned-region markers, i.e. the
# part of a node body dispatch-fleet-alarm generates. The body may also carry
# authored content OUTSIDE the region, which the script preserves; these
# assertions are about the generated half, so they read the region rather than
# the whole body.
body_region() {
  awk -v om='<!-- generated:dispatch-fleet-alarm -->' \
      -v cm='<!-- /generated:dispatch-fleet-alarm -->' '
    $0 == om { inr = 1; next }
    $0 == cm { inr = 0; next }
    inr { print }
  ' "$1"
}

# The body placeholder was spliced away and replaced with the reading.
MINTED="$FR/intentions/tactic-fleet-alarm-tick-stale.md"
assert_eq "(2) body spliced over the placeholder" \
  "The reading.
Second line." "$(body_region "$MINTED")"
assert_contains "(2) the reading is bounded by the owned-region markers" \
  "<!-- /generated:dispatch-fleet-alarm -->" "$(cat "$MINTED")"

# --- (3) open + identical body -> NO commit ----------------------------------
# The node minted in (2) already carries exactly $BODY, so a re-detection with
# the same reading must not churn a commit.
run_alarm STUB_STATE=open STUB_GC_LAND=1 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY"
assert_eq "(3) identical-body re-detection exits 0" "0" "$RC"
assert_eq "(3) NO graph-commit at all" "" "$(log_lines graph-commit.log)"
assert_eq "(3) NO write-node"          "" "$(log_lines write-node.log)"

# --- (4) open + differing body -> graph-commit --base ------------------------
BODY2="$WORK/body2.md"
printf 'A different reading.\n' > "$BODY2"
run_alarm STUB_STATE=open STUB_GC_LAND=1 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY2"
assert_eq "(4) differing-body re-detection exits 0" "0" "$RC"
assert_contains "(4) graph-commit ran with --base" "--base" "$(log_lines graph-commit.log)"
assert_contains "(4) --base points at the dumped manifest" "base-manifest.txt" "$(log_lines graph-commit.log)"
assert_eq "(4) refreshed body landed on disk" "A different reading." \
  "$(body_region "$MINTED")"

# --- (4b) authored body content survives a refresh ---------------------------
# A parked alarm node (`office_hours != null`, `phase != "done"`) classifies
# `open`, so re-detection routes through this refresh path — and the common
# reason such a node is parked is that a human is looking at it. Their diagnosis
# lives OUTSIDE this script's owned region and must survive. Before the region
# existed, splice_body replaced everything after the closing frontmatter fence
# wholesale, so the diagnosis was discarded on the next detection tick and the
# discard was pushed to main. The guard comment above classify() claims "the
# alarm's own re-detection path still refreshes its body underneath the park, so
# nothing is lost by waiting"; this is the case that makes that true.
awk -v om='<!-- generated:dispatch-fleet-alarm -->' '
  $0 == om && !ins { print "## Human diagnosis"; print ""; print "The tick host lost its network route."; print ""; ins = 1 }
  { print }
' "$MINTED" > "$MINTED.authored" && mv "$MINTED.authored" "$MINTED"

BODY3="$WORK/body3.md"
printf 'A third reading.\n' > "$BODY3"
run_alarm STUB_STATE=open STUB_GC_LAND=1 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY3"
assert_eq "(4b) refresh with an authored body exits 0" "0" "$RC"
assert_eq "(4b) the owned region carries the new reading" "A third reading." \
  "$(body_region "$MINTED")"
assert_contains "(4b) the human's heading survived the refresh" \
  "## Human diagnosis" "$(cat "$MINTED")"
assert_contains "(4b) the human's text survived the refresh" \
  "lost its network route" "$(cat "$MINTED")"

# --- (5) --resolve with a non-null execution -> no write ---------------------
run_alarm STUB_STATE=open STUB_GC_LAND=1 \
  STUB_NODE_JSON='{"id":"tactic-fleet-alarm-tick-stale","phase":"implement","execution":{"prNumber":7}}' -- \
  --resolve --kind tick-stale
assert_eq "(5) resolve with live execution exits 0" "0" "$RC"
assert_eq "(5) no write-node"   "" "$(log_lines write-node.log)"
assert_eq "(5) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_contains "(5) diagnostic names the in-flight execution" "non-null execution" "$OUT"

# --- (6) --resolve when the node is absent from origin/main -> refusal -------
# A committed-but-not-on-origin/main node (a distinct kind, so the tick-stale
# node landed above is untouched): the working tree is clean, yet
# `git rev-parse origin/main:intentions/<id>.md` has nothing to roll back to.
ORIG_MAIN="$(git -C "$FR" rev-parse HEAD)"
printf -- '---\nid: tactic-fleet-alarm-busy-stall\nkind: tactic\nphase: null\n---\nstale\n' \
  > "$FR/intentions/tactic-fleet-alarm-busy-stall.md"
git -C "$FR" add -A intentions >/dev/null
git -C "$FR" commit -q -m 'local-only alarm node'
# origin/main deliberately left where it was — it never saw this node.
git -C "$FR" update-ref refs/remotes/origin/main "$ORIG_MAIN"
run_alarm STUB_STATE=open -- --resolve --kind busy-stall
assert_eq "(6) refusal exits 1" "1" "$RC"
assert_contains "(6) stderr diagnostic names the missing origin/main blob" \
  "does not exist on origin/main" "$OUT"
assert_eq "(6) no write-node"   "" "$(log_lines write-node.log)"
assert_eq "(6) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_eq "(6) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# Restore origin/main to HEAD for the remaining cases.
git -C "$FR" update-ref refs/remotes/origin/main HEAD

# --- (7) graph-commit exits 0 having landed nothing -> exit 1 ----------------
# The named invariant: a check whose failure mode is a silent PASS. STUB_GC_LAND
# is unset, so the stub exits 0 without moving origin/main — the SUT's post-write
# blob comparison must catch it.
BODY3="$WORK/body3.md"
printf 'Yet another reading.\n' > "$BODY3"
run_alarm STUB_STATE=open -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY3"
assert_eq "(7) unverified graph-commit exits 1" "1" "$RC"
assert_contains "(7) diagnostic names the verification failure" \
  "post-write verification failed" "$OUT"
assert_contains "(7) graph-commit was in fact invoked" "graph-commit" "$(log_lines graph-commit.log)"

# --- (8) --resolve on an open, execution-null node -> completed to done ------
# Case (7) deliberately left the node file dirty (its graph-commit stub landed
# nothing); reset it so this case starts from a clean tree, and re-point
# origin/main at HEAD so the CAS/verification path can confirm the write.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
run_alarm STUB_STATE=open STUB_GC_LAND=1 \
  STUB_NODE_JSON='{"id":"tactic-fleet-alarm-tick-stale","phase":"implement","execution":null}' -- \
  --resolve --kind tick-stale
assert_eq "(8) resolve exits 0" "0" "$RC"
assert_eq "(8) write-node got phase done" "done" "$(jq -r .phase "$LOG/write-node-input.json")"
assert_contains "(8) graph-commit ran with --base" "--base" "$(log_lines graph-commit.log)"
assert_contains "(8) resolve message" "graph: resolve fleet alarm tick-stale" "$(log_lines graph-commit.log)"
assert_eq "(8) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# --- (9) minimum refresh interval: a CHURNING body still cannot push per pass -
# The `cmp -s` gate in case (3) only holds while the caller keeps volatile
# values out of the body. This is the second, caller-independent brake: two
# re-detections with DIFFERENT bodies inside the interval must produce exactly
# one commit. Without it a body carrying a timestamp/elapsed span would
# fetch+rebase+push to origin/main on every 2-5 minute timer pass, arming the
# four required CI checks each time, precisely during an outage.
git -C "$FR" checkout -- intentions 2>/dev/null
git -C "$FR" update-ref refs/remotes/origin/main HEAD
BODY_CHURN_1="$WORK/body-churn-1.md"
BODY_CHURN_2="$WORK/body-churn-2.md"
printf 'Reading at pass one.\n' > "$BODY_CHURN_1"
printf 'Reading at pass two — a different second.\n' > "$BODY_CHURN_2"

run_alarm STUB_STATE=open STUB_GC_LAND=1 DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL=3600 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY_CHURN_1"
assert_eq "(9) first refresh exits 0" "0" "$RC"
assert_contains "(9) first refresh DID commit" "--base" "$(log_lines graph-commit.log)"

KEEP_ALARM_STATE=1
run_alarm STUB_STATE=open STUB_GC_LAND=1 DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL=3600 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY_CHURN_2"
KEEP_ALARM_STATE=0
assert_eq "(9) rate-limited refresh exits 0" "0" "$RC"
assert_eq "(9) rate-limited refresh made NO commit" "" "$(log_lines graph-commit.log)"
assert_contains "(9) diagnostic names the rate limit" "rate-limited, no commit" "$OUT"
assert_eq "(9) the churning body was NOT spliced in" "Reading at pass one." \
  "$(body_region "$MINTED")"
assert_eq "(9) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# The stamp is per KIND, not global: a different kind is not gated by it.
KEEP_ALARM_STATE=1
run_alarm STUB_STATE=absent STUB_GC_LAND=1 DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL=3600 -- \
  --kind daemon-degraded --statement 'the daemon is down' --body-file "$BODY_CHURN_2"
KEEP_ALARM_STATE=0
assert_eq "(9) a different kind still commits" "0" "$RC"
assert_contains "(9) different kind reached graph-commit" "tactic-fleet-alarm-daemon-degraded" \
  "$(log_lines graph-commit.log)"

# --- (10) graph-write mutex held by another writer -> skip, touch NOTHING ----
# The corruption class this mutex closes is two graph writers mutating the same
# checkout at once (graph-commit rebases it and can `git reset --hard` it), and
# the callers are unattended timers that can fire nine alarm writes in one pass.
# A contended pass must SKIP — not block, and above all not read-then-write
# around the other writer. Asserted on the strongest evidence available: not one
# of the three write-path stubs is invoked at all, so the SUT never even
# classified the node.
echo "Test: contended graph-write mutex -> skipped-locked, no reads, no writes"
( exec 9>>"$LOCK_FILE"; flock 9; sleep 3 ) &
LOCK_HOLDER=$!
sleep 0.3   # let the holder take the flock before the SUT contends
run_alarm STUB_STATE=absent STUB_GC_LAND=1 -- \
  --kind daemon-degraded --statement 'the daemon is down' --body-file "$BODY"
assert_eq "(10) contended pass exits 0" "0" "$RC"
assert_contains "(10) stdout says skipped-locked" "skipped-locked" "$OUT"
assert_eq "(10) no classify"     "" "$(log_lines classify.log)"
assert_eq "(10) no write-node"   "" "$(log_lines write-node.log)"
assert_eq "(10) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_eq "(10) tree left clean" "" "$(git -C "$FR" status --porcelain)"
wait "$LOCK_HOLDER" 2>/dev/null || true

# --- (11) mutex free again -> the very next pass writes normally -------------
# The mutex must not latch: once the holder exits, the next invocation proceeds.
# (Same shape as case (2), on a kind no earlier case has touched.)
run_alarm STUB_STATE=absent STUB_GC_LAND=1 -- \
  --kind daemon-degraded --statement 'the daemon is down' --body-file "$BODY"
assert_eq "(11) uncontended pass exits 0" "0" "$RC"
assert_contains "(11) stdout says landed" "landed" "$OUT"
assert_contains "(11) graph-commit ran" "tactic-fleet-alarm-daemon-degraded" "$(log_lines graph-commit.log)"

# --- (12) mint rollback: writer reports success but wrote nothing -----------
# Models a writer that reported success (exit 0) but never created the file —
# the exact swallowed-status defect: awk's fatal "cannot open" used to be
# masked by the old `{ awk ...; cat ...; } > tmp` grouping, publishing a
# malformed tmp anyway.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
run_alarm STUB_STATE=absent STUB_WN_SHAPE=none -- \
  --kind automerge-suppressed --statement 'auto-merge suppressed' --body-file "$BODY"
assert_eq "(12) mint with a no-op writer exits 1" "1" "$RC"
assert_contains "(12) diagnostic says the write was rolled back" "the write was rolled back" "$OUT"
MINT12="$FR/intentions/tactic-fleet-alarm-automerge-suppressed.md"
assert_absent_or_valid "(12) node file" "$MINT12"
if [[ -e "$MINT12.tmp" ]]; then no "(12) no .tmp residue (found $MINT12.tmp)"; else ok "(12) no .tmp residue"; fi
assert_eq "(12) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# --- (13) mint rollback: 0-byte body file (the live incident's exact shape) -
# The SUT only requires -f on --body-file, so a 0-byte body is a valid
# argument. Under the OLD code this combination — awk failing on the absent
# write, cat of an empty body still succeeding — is exactly what published a
# 0-byte intentions/<id>.md fleet-wide.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
BODY_EMPTY="$WORK/body-empty.md"
: > "$BODY_EMPTY"
run_alarm STUB_STATE=absent STUB_WN_SHAPE=none -- \
  --kind watch-unknown --statement 'watch state unknown' --body-file "$BODY_EMPTY"
assert_eq "(13) mint with a no-op writer + 0-byte body exits 1" "1" "$RC"
assert_contains "(13) diagnostic says the write was rolled back" "the write was rolled back" "$OUT"
MINT13="$FR/intentions/tactic-fleet-alarm-watch-unknown.md"
assert_absent_or_valid "(13) node file" "$MINT13"
if [[ -e "$MINT13.tmp" ]]; then no "(13) no .tmp residue (found $MINT13.tmp)"; else ok "(13) no .tmp residue"; fi
assert_eq "(13) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# --- (14) mint rollback: node file exists but has no frontmatter ------------
# awk exits 0 here (there is no failure to catch via status alone), so only
# splice_body's positive shape assertion (added alongside the Unit-2 fix)
# catches this and rolls back.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
run_alarm STUB_STATE=absent STUB_WN_SHAPE=no-fence STUB_GC_LAND=1 -- \
  --kind heal-fired --statement 'heal fired' --body-file "$BODY"
assert_eq "(14) mint with a fence-less write exits 1" "1" "$RC"
assert_contains "(14) diagnostic says the write was rolled back" "the write was rolled back" "$OUT"
MINT14="$FR/intentions/tactic-fleet-alarm-heal-fired.md"
assert_absent_or_valid "(14) node file" "$MINT14"
assert_eq "(14) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# --- (15) regression pin: writer killed mid-write ----------------------------
# This case passes even without the Unit-2 fix: write-node's non-zero exit
# short-circuits the `||` chain straight into the existing rollback, before
# splice_body or graph-commit are ever reached.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
run_alarm STUB_STATE=absent STUB_WN_SHAPE=zero -- \
  --kind heal-unknown --statement 'heal outcome unknown' --body-file "$BODY"
assert_eq "(15) mint with a killed writer exits 1" "1" "$RC"
assert_contains "(15) diagnostic says the write was rolled back" "the write was rolled back" "$OUT"
MINT15="$FR/intentions/tactic-fleet-alarm-heal-unknown.md"
assert_absent_or_valid "(15) node file" "$MINT15"
assert_eq "(15) tree left clean" "" "$(git -C "$FR" status --porcelain)"
assert_eq "(15) graph-commit never invoked" "" "$(log_lines graph-commit.log)"

# --- (16) doctrine ratchet: the two rewritten functions cannot regress ------
# Pins the Unit-2 fix so a later edit cannot silently reintroduce either
# defect: the swallowed-status `{ awk ...; cat ...; } > tmp` grouping in
# splice_body, or the truncate-before-write `show "$1" > "$NODE_FILE"` in
# restore_from_blob. Ratchet for tactic-fleet-alarm-mint-rollback-corruption.
SWALLOWED_STATUS_HITS=$(grep -Fc '; cat "$BODY_FILE"; } >' "$SUT" || true)
TRUNCATE_BEFORE_WRITE_HITS=$(grep -Fc 'show "$1" > "$NODE_FILE"' "$SUT" || true)
assert_eq "(16) no swallowed-status idiom in $SUT (tactic-fleet-alarm-mint-rollback-corruption)" \
  "0" "${SWALLOWED_STATUS_HITS:-0}"
assert_eq "(16) no truncate-before-write idiom in $SUT (tactic-fleet-alarm-mint-rollback-corruption)" \
  "0" "${TRUNCATE_BEFORE_WRITE_HITS:-0}"

# --- (17) mint rollback NEVER deletes a file this pass did not create --------
# The rollback's `rm -f "$NODE_FILE"` is only correct for a file this pass
# minted. Here the node file already exists on disk and origin/main carries no
# blob for it, so there is nothing to restore it TO — and deleting it would
# leave a dirty deletion that trips graph-commit's unrelated-dirty-file
# pre-flight for every later graph writer in the checkout (the fleet-halt the
# SUT header forbids). The file must survive, and the exit must be the dirty-
# residue code 70, not the "rolled back cleanly" 1.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
MINT17="$FR/intentions/tactic-fleet-alarm-heal-unknown.md"
printf -- '---\nid: tactic-fleet-alarm-heal-unknown\nkind: tactic\nphase: null\n---\npre-existing content\n' \
  > "$MINT17"
run_alarm STUB_STATE=closed STUB_WN_SHAPE=none STUB_GC_EXIT=1 -- \
  --kind heal-unknown --statement 'heal outcome unknown' --body-file "$BODY"
assert_eq "(17) pre-existing node file with no origin/main blob exits 70" "70" "$RC"
if [[ -e "$MINT17" ]]; then ok "(17) the pre-existing node file was NOT deleted"; else no "(17) the pre-existing node file was deleted"; fi
assert_contains "(17) diagnostic says the file was left as-is" "left as-is (NOT deleted)" "$OUT"
assert_not_contains "(17) does NOT claim a rollback happened" "the write was rolled back" "$OUT"
rm -f "$MINT17"

# --- (18) a rollback that CANNOT run must not claim it did -------------------
# restore_from_blob returns non-zero and leaves the file alone when it cannot
# write its staging tmp; every call site must branch on that instead of logging
# "the write was rolled back" over a tree it never restored. Injected by making
# $NODE_FILE.tmp a DIRECTORY, so both splice_body's and restore_from_blob's
# redirections into it fail.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
TMP_BLOCKER="$MINTED.tmp"
mkdir -p "$TMP_BLOCKER"
BODY18="$WORK/body18.md"
printf 'A reading that differs from whatever is on disk.\n' > "$BODY18"
run_alarm STUB_STATE=open STUB_GC_LAND=1 -- \
  --kind tick-stale --statement 'dispatch-tick has not run for 90m' --body-file "$BODY18"
assert_eq "(18) unrunnable rollback exits 70, not 1" "70" "$RC"
assert_contains "(18) diagnostic names the failed rollback" "ROLLBACK FAILED" "$OUT"
assert_not_contains "(18) does NOT claim the write was rolled back" "the write was rolled back" "$OUT"
rmdir "$TMP_BLOCKER"

# --- (19) an unresolvable origin/main is an environment error, not a rollback -
# origin_blob fails both when origin/main lacks the path and when origin/main
# itself does not resolve (unfetched clone, pruned/stale remote-tracking ref,
# concurrent gc). Only the first means "nothing to restore". Treating the second
# as an empty pre-write blob is what would route a mint failure into deleting a
# tracked node file, so the ref fault must exit 69 having touched nothing.
git -C "$FR" checkout -- intentions
SAVED_ORIGIN_MAIN="$(git -C "$FR" rev-parse refs/remotes/origin/main)"
git -C "$FR" update-ref -d refs/remotes/origin/main
run_alarm STUB_STATE=absent STUB_GC_LAND=1 -- \
  --kind busy-stall --statement 'the queue is stalled' --body-file "$BODY"
assert_eq "(19) unresolvable origin/main exits 69" "69" "$RC"
assert_contains "(19) diagnostic names the unresolvable ref" "origin/main does not resolve" "$OUT"
assert_eq "(19) no write-node"   "" "$(log_lines write-node.log)"
assert_eq "(19) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_eq "(19) tree left clean" "" "$(git -C "$FR" status --porcelain)"
git -C "$FR" update-ref refs/remotes/origin/main "$SAVED_ORIGIN_MAIN"

# --- (20) doctrine ratchet: no bare restore_from_blob call -------------------
# A bare call discards the status that distinguishes "restored" from "left
# dirty", which is precisely the lie cases (17) and (18) pin. Every call site
# must be status-checked (`if ! restore_from_blob ...` / `if restore_from_blob
# ...`), so no line may START with the call.
BARE_RESTORE_HITS=$(grep -cE '^[[:space:]]*restore_from_blob ' "$SUT" || true)
assert_eq "(20) no unchecked restore_from_blob call in $SUT" "0" "${BARE_RESTORE_HITS:-0}"

# --- (21) kind acceptance: main-checkout-held --------------------------------
# The KINDS enum is closed and the anchored id regex is BUILT from it, so a new
# kind is only genuinely accepted if it survives the whole round trip: mint,
# refresh with a differing body, resolve. Case (1) already pins that an unknown
# kind exits 64; the near-miss below pins that the new entry did not widen the
# enum into a prefix match.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
BODY21="$WORK/body21.md"
printf 'A stuck session is holding the shared main checkout.\n' > "$BODY21"
run_alarm STUB_STATE=absent STUB_GC_LAND=1 -- \
  --kind main-checkout-held --statement 'A stuck session is holding the shared main checkout dirty' \
  --body-file "$BODY21"
assert_eq "(21) mint exits 0" "0" "$RC"
MINT21="$FR/intentions/tactic-fleet-alarm-main-checkout-held.md"
assert_contains "(21) graph-commit got the alarm id" "tactic-fleet-alarm-main-checkout-held" \
  "$(log_lines graph-commit.log)"
assert_eq "(21) node id" "tactic-fleet-alarm-main-checkout-held" \
  "$(jq -r .id "$LOG/write-node-input.json")"
assert_eq "(21) body spliced over the placeholder" \
  "A stuck session is holding the shared main checkout." \
  "$(body_region "$MINT21")"

# Re-detection with an IDENTICAL body must not churn a commit...
run_alarm STUB_STATE=open STUB_GC_LAND=1 -- \
  --kind main-checkout-held --statement 'A stuck session is holding the shared main checkout dirty' \
  --body-file "$BODY21"
assert_eq "(21) identical-body re-detection exits 0" "0" "$RC"
assert_eq "(21) NO graph-commit on an identical body" "" "$(log_lines graph-commit.log)"

# ...and a DIFFERING body refreshes through the --base path.
BODY21B="$WORK/body21b.md"
printf 'A different set of offending sessions.\n' > "$BODY21B"
run_alarm STUB_STATE=open STUB_GC_LAND=1 -- \
  --kind main-checkout-held --statement 'A stuck session is holding the shared main checkout dirty' \
  --body-file "$BODY21B"
assert_eq "(21) differing-body refresh exits 0" "0" "$RC"
assert_contains "(21) refresh ran with --base" "--base" "$(log_lines graph-commit.log)"
assert_eq "(21) refreshed body landed on disk" "A different set of offending sessions." \
  "$(body_region "$MINT21")"

# ...and the condition resolves to phase done.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
run_alarm STUB_STATE=open STUB_GC_LAND=1 \
  STUB_NODE_JSON='{"id":"tactic-fleet-alarm-main-checkout-held","phase":"implement","execution":null}' -- \
  --resolve --kind main-checkout-held
assert_eq "(21) resolve exits 0" "0" "$RC"
assert_eq "(21) write-node got phase done" "done" "$(jq -r .phase "$LOG/write-node-input.json")"
assert_contains "(21) resolve message" "graph: resolve fleet alarm main-checkout-held" \
  "$(log_lines graph-commit.log)"
assert_eq "(21) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# The enum is still CLOSED: a near-miss of the new kind is rejected, and no
# unknown kind reaches a write.
run_alarm -- --kind main-checkout --statement 'x' --body-file "$BODY21"
assert_eq "(21) a near-miss kind still exits 64" "64" "$RC"
assert_eq "(21) near-miss made no write-node"   "" "$(log_lines write-node.log)"
assert_eq "(21) near-miss made no graph-commit" "" "$(log_lines graph-commit.log)"

# --- (22) --resolve on a PARKED node -> refusal, the park is never completed --
# The park guard (tactic-fleet-alarm-node-park-clobber-loop, ruling (b)
# follow-up). classify() is deliberately park-aware — a parked, not-done node
# reads `open` so re-detection refreshes it through the CAS path instead of
# clobbering the park. But `open` is also the state --resolve acts on, so
# without a precondition of its own --resolve would take a human's park and
# land the node at phase: "done" underneath them, their question unanswered.
# The guard sits AFTER dump-node (a read) and BEFORE any mutation, so the
# assertions below are: dump-node ran, and nothing else did.
git -C "$FR" checkout -- intentions
git -C "$FR" update-ref refs/remotes/origin/main HEAD
PARKED_JSON='{"id":"tactic-fleet-alarm-tick-stale","phase":"implement","execution":null,'
PARKED_JSON+='"office_hours":{"reason":"worker session froze; what should this alarm do?",'
PARKED_JSON+='"since":"2026-08-01","recommendation":null,"session_type":"other"}}'
run_alarm STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$PARKED_JSON" -- \
  --resolve --kind tick-stale
assert_eq "(22) resolve on a parked node exits 0" "0" "$RC"
assert_contains "(22) diagnostic names the park" "non-null office_hours" "$OUT"
assert_contains "(22) diagnostic tells the caller to clear the park first" \
  "clear the park first" "$OUT"
assert_eq "(22) no write-node — the park was not completed" "" "$(log_lines write-node.log)"
assert_eq "(22) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_contains "(22) the guard ran AFTER the read, not instead of it" \
  "dump-node" "$(log_lines dump-node.log)"
assert_eq "(22) tree left clean" "" "$(git -C "$FR" status --porcelain)"

# Control: the SAME node with office_hours explicitly null still resolves, so
# the guard narrows --resolve rather than disabling it.
run_alarm STUB_STATE=open STUB_GC_LAND=1 \
  STUB_NODE_JSON='{"id":"tactic-fleet-alarm-tick-stale","phase":"implement","execution":null,"office_hours":null}' -- \
  --resolve --kind tick-stale
assert_eq "(22) control: unparked node still resolves" "0" "$RC"
assert_eq "(22) control: write-node got phase done" "done" "$(jq -r .phase "$LOG/write-node-input.json")"

# --- results -----------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
