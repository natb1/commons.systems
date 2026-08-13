#!/usr/bin/env bash
#
# test-dispatch-eval-finding.sh — unit-test harness for dispatch-eval-finding,
# the evaluation finding ledger's write surface.
#
# Fixture shape is test-dispatch-fleet-alarm.sh's: every graph-touching call is
# dependency-injected through the SUT's DISPATCH_EVAL_FINDING_* command
# overrides, so the suite never touches the real intentions/ store, never runs
# tsx, and never reaches a git remote. The SUT is copied into a miniature repo
# root so its SCRIPT_DIR/../../../.. math resolves inside the fixture, beside a
# tiny git repo whose refs/remotes/origin/main stands in for the real remote.
#
# Coverage, weighted to the two DELIBERATE DIVERGENCES from dispatch-fleet-alarm
# that this ledger depends on:
#
#   (1)  slug shape is an addressing guard, not a taxonomy: a malformed slug is
#        refused with no graph read, an unknown-but-well-shaped one is accepted
#        (divergence 1 — the key is NOT a closed enum).
#   (2)  --list emits open AND retired entries, the similarity judgment's input.
#   (3)  absent -> mint: exact node JSON (ledger_entry, first_seen,
#        recurrence_count 1, attention null, pace_exempt true), graph-commit
#        WITHOUT --base, body spliced over the placeholder.
#   (4)  a second occurrence with a BYTE-IDENTICAL body still commits and moves
#        the count to 2, and mints NO second node. This is the divergence-2
#        consequence: fleet-alarm's cmp -s body-identity gate would swallow
#        exactly this write, which is the whole payload here.
#   (5)  a retired (phase done) entry RESUMES — count 7 -> 8, phase cleared back
#        to null, first_seen preserved, graph-commit called WITH --base (a CAS
#        update of the existing node, never a fresh mint).
#   (6)  a caller-supplied impact record is upserted by (metric, window) —
#        rewritten, not appended — while the script's own recurrence_count
#        record is preserved and incremented.
#   (7)  --retire completes to phase done with measured_impact INTACT.
#   (8)  the in-flight guard: a non-null execution records nothing, exits 0
#        noop, and says the occurrence was NOT COUNTED.
#   (9)  usage refusals: missing --sensor, a malformed --impact-file, and an
#        --impact-file carrying a recurrence_count record (the metric the script
#        owns) are all exit 64 with no graph write.
#   (10) the named silent-PASS invariant — a graph-commit that exits 0 without
#        landing must make the SUT exit 1, not 0.
#   (11) a doctrine ratchet over the SUT source: no cmp -s body-identity gate,
#        no minimum-refresh-interval brake, no `absent|retired` mint-over case
#        label, and the BOUNDED-WAIT mutex verb rather than the sibling's
#        non-blocking one. Re-introducing any of those silently understates the
#        recurrence count, which is the one metric the ledger exists to carry.
#   (12) a CONTENDED mutex is WAITED for, not skipped: with the lock held by a
#        background holder that releases inside the wait budget, the SUT blocks
#        and then lands. This is divergence 3 — the caller is a fire-and-forget
#        per-phase evaluator with no next pass, so the sibling's immediate skip
#        would silently drop the occurrence.
#   (13) and the wait is BOUNDED: a holder that outlives the budget still gets
#        the `skipped-locked` disposition, but the log line must state the loss
#        outright (not counted, nothing will re-invoke) rather than the sibling's
#        benign "re-invoke to record it".
#
# Run under bash -c, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUT="$HARNESS_DIR/dispatch-eval-finding"
[[ -f "$SUT" ]] || { echo "error: dispatch-eval-finding not found at $SUT" >&2; exit 1; }
# The SUT's verify_landed() delegates to the real verify-landed primitive, which
# is NOT copied into the miniature fixture repo — its `--blob` mode is pure git
# plumbing (no tsx), so it is safe to run directly against the fixture's `-C`
# path. Resolved from HARNESS_DIR (this file's real on-disk location).
REAL_VERIFY_LANDED="$HARNESS_DIR/../../../../packages/intentionsutil/scripts/verify-landed"
[[ -x "$REAL_VERIFY_LANDED" ]] || { echo "error: verify-landed not found at $REAL_VERIFY_LANDED" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

# assert_eq / assert_contains and the PASS/FAIL/TOTAL counters come from the
# shared harness, which also sources lib-test-decision-log-guard.sh — that
# redirects DISPATCH_DECISION_LOG_DIR into a per-run tmp sandbox, which is what
# keeps this suite off the production routing-decision log. Sourcing it is the
# isolation test-decision-log-isolation.sh's Part B ratchet requires; the
# sibling test-dispatch-fleet-alarm.sh predates the harness and is allowlisted
# instead, which that file's own comment marks as the less-preferred route.
# shellcheck source=test-helpers.sh
source "$HARNESS_DIR/test-helpers.sh"

# Not in the shared harness; defined here against its counters so a negative
# assertion tallies identically to a positive one.
assert_not_contains() { # <label> <needle> <haystack>
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$haystack" != *"$needle"* ]]; then
    PASS=$((PASS + 1)); echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: $label"
    echo "    expected NOT to contain: $needle"
    echo "    actual: $haystack"
  fi
}

# --- fixture repo root -------------------------------------------------------
FR="$WORK/repo"
FR_SCRIPTS="$FR/.claude/skills/dispatch-propagate/scripts"
LOG="$WORK/logs"
BIN="$WORK/bin"
mkdir -p "$FR_SCRIPTS" "$FR/intentions" "$LOG" "$BIN"
cp "$SUT" "$FR_SCRIPTS/dispatch-eval-finding"
chmod +x "$FR_SCRIPTS/dispatch-eval-finding"
# The SUT sources lib.sh from its own directory for the graph-write mutex.
cp "$HARNESS_DIR/lib.sh" "$FR_SCRIPTS/lib.sh"
EVAL_FINDING="$FR_SCRIPTS/dispatch-eval-finding"
LOCK_FILE="$WORK/graph-write.lock"

git -C "$FR" init -q
git -C "$FR" config user.email fixture@test
git -C "$FR" config user.name fixture
# The fixture's copy of the SUT is scaffolding, not repo content.
printf '.claude/\n' > "$FR/.git/info/exclude"
printf 'fixture\n' > "$FR/README.md"
git -C "$FR" add README.md
git -C "$FR" commit -q -m init
git -C "$FR" update-ref refs/remotes/origin/main HEAD

# --- stubs -------------------------------------------------------------------
cat > "$BIN/stub-classify" <<'STUB'
#!/usr/bin/env bash
# usage: stub-classify <id> — print the fabricated classification.
echo "classify $1" >> "$STUB_LOG/classify.log"
printf '%s\n' "${STUB_STATE:-absent}"
STUB

cat > "$BIN/stub-list" <<'STUB'
#!/usr/bin/env bash
# usage: stub-list <intentions-dir> — stands in for the listNodes one-liner.
echo "list $*" >> "$STUB_LOG/list.log"
printf '%s\n' "${STUB_LIST_JSON:-[]}"
STUB

cat > "$BIN/stub-write-node" <<'STUB'
#!/usr/bin/env bash
# usage: stub-write-node --file <json>. Records the JSON it was handed, then
# writes the node markdown the real writeNode would produce — YAML frontmatter
# between two `---` fences plus the generated `# <statement>` placeholder body.
echo "write-node $*" >> "$STUB_LOG/write-node.log"
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in --file) file="$2"; shift 2 ;; *) shift ;; esac
done
cp "$file" "$STUB_LOG/write-node-input.json"
id=$(jq -r .id "$file")
statement=$(jq -r '.statement // "placeholder"' "$file")
phase=$(jq -r '.phase // "null"' "$file")
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
# usage: stub-dump-node --out-dir <dir> <id>. Writes <dir>/<id>.json (content
# from $STUB_NODE_JSON) and a base manifest, and prints the manifest path.
echo "dump-node $*" >> "$STUB_LOG/dump-node.log"
outdir=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in --out-dir) outdir="$2"; shift 2 ;; *) id="$1"; shift ;; esac
done
mkdir -p "$outdir"
# Built in two steps, never as a `${STUB_NODE_JSON:-{...}}` default: the JSON
# contains `{}` and bash would end the parameter expansion at that first `}`,
# leaking the tail of the default into the file as literal text.
json="${STUB_NODE_JSON:-}"
[[ -n "$json" ]] || json=$(printf '{"id":"%s","phase":null,"execution":null,"attributes":{}}' "$id")
printf '%s\n' "$json" > "$outdir/$id.json"
printf '%s=deadbeef\n' "$id" > "$outdir/base-manifest.txt"
printf '%s\n' "$outdir/base-manifest.txt"
STUB

cat > "$BIN/stub-graph-commit" <<'STUB'
#!/usr/bin/env bash
# usage: stub-graph-commit -C <repo> [--base <manifest>] -m <msg> <id>.
# STUB_GC_EXIT   — exit with this code instead of landing (default 0).
# STUB_GC_LAND=1 — actually land: commit intentions/ and move the fixture's
#                  origin/main ref. With it unset the stub exits 0 having landed
#                  NOTHING — the silent-PASS shape verification exists to catch.
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

# run_ef <env NAME=value ...> -- <args to the SUT ...>
#
# The two streams are captured SEPARATELY and only then concatenated as
# stderr-then-stdout into $OUT. Keeping them apart matters: the one-word stdout
# protocol has to be assertable on its own ($SOUT), because verify-landed's
# stderr diagnostics contain the token `not-landed` and a merged-stream
# "does it say landed?" assertion reads that as a success claim.
OUT=""; SOUT=""; RC=0
run_ef() {
  local -a envs=()
  while [[ $# -gt 0 && "$1" != "--" ]]; do envs+=("$1"); shift; done
  shift # drop the --
  rm -f "$LOG"/*.log "$LOG/write-node-input.json"
  env \
    STUB_LOG="$LOG" \
    STUB_INTENTIONS="$FR/intentions" \
    DISPATCH_EVAL_FINDING_CLASSIFY_CMD="$BIN/stub-classify" \
    DISPATCH_EVAL_FINDING_LIST_CMD="$BIN/stub-list" \
    DISPATCH_EVAL_FINDING_WRITE_NODE_CMD="$BIN/stub-write-node" \
    DISPATCH_EVAL_FINDING_DUMP_NODE_CMD="$BIN/stub-dump-node" \
    DISPATCH_EVAL_FINDING_GRAPH_COMMIT_CMD="$BIN/stub-graph-commit" \
    DISPATCH_EVAL_FINDING_VERIFY_LANDED_CMD="$REAL_VERIFY_LANDED" \
    DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$FR/intentions" \
    DISPATCH_EVAL_FINDING_RETRY_DELAY=0 \
    DISPATCH_EVAL_FINDING_RETRIES=1 \
    DISPATCH_GRAPH_WRITE_LOCK_FILE="$LOCK_FILE" \
    "${envs[@]}" "$EVAL_FINDING" "$@" >"$WORK/stdout.txt" 2>"$WORK/stderr.txt"
  RC=$?
  SOUT="$(cat "$WORK/stdout.txt")"
  OUT="$(cat "$WORK/stderr.txt" "$WORK/stdout.txt")"
}
log_lines() { # <logfile-basename> -> its contents (empty when absent)
  [[ -f "$LOG/$1" ]] && cat "$LOG/$1" || printf ''
}
written() { # <jq filter> -> the value from the last write-node input
  jq -r "$1" "$LOG/write-node-input.json" 2>/dev/null
}

BODY="$WORK/body.md"
printf 'The finding.\nSecond line.\n' > "$BODY"
SLUG=stop-hook-hold-loop
ID="tactic-eval-finding-$SLUG"
NODE_MD="$FR/intentions/$ID.md"

# --- (1) slug shape is an addressing guard, not a taxonomy -------------------
run_ef -- --slug 'Not A Slug' --statement x --body-file "$BODY" --sensor s
assert_eq "(1) malformed slug exits 64" "64" "$RC"
assert_eq "(1) no classify" "" "$(log_lines classify.log)"
assert_eq "(1) no graph-commit" "" "$(log_lines graph-commit.log)"
run_ef -- --slug 'under_score' --statement x --body-file "$BODY" --sensor s
assert_eq "(1) underscore slug exits 64" "64" "$RC"

# --- (2) --list emits open AND retired entries ------------------------------
LIST_JSON='[{"id":"tactic-eval-finding-a","state":"open","recurrence_count":3},{"id":"tactic-eval-finding-b","state":"retired","recurrence_count":9}]'
run_ef STUB_LIST_JSON="$LIST_JSON" -- --list
assert_eq "(2) --list exits 0" "0" "$RC"
assert_contains "(2) --list shows the open entry" '"state": "open"' "$(jq . <<<"$OUT")"
assert_contains "(2) --list shows the RETIRED entry too" '"state": "retired"' "$(jq . <<<"$OUT")"
assert_eq "(2) --list takes no mutex-guarded write" "" "$(log_lines graph-commit.log)"

# --- (3) absent -> mint ------------------------------------------------------
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- \
  --slug "$SLUG" --statement 'the Stop hook HOLDs forever when no terminal marker is written' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-01
assert_eq "(3) mint exits 0" "0" "$RC"
assert_eq "(3) stdout says landed" "landed" "$SOUT"
GC3="$(log_lines graph-commit.log)"
assert_contains "(3) graph-commit got the entry id" "$ID" "$GC3"
assert_not_contains "(3) mint passes NO --base" "--base" "$GC3"
assert_eq "(3) attributes.ledger_entry is true" "true" "$(written '.attributes.ledger_entry')"
assert_eq "(3) first_seen stamped" "2026-08-01" "$(written '.attributes.first_seen')"
assert_eq "(3) recurrence_count starts at 1" "1" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(3) recurrence record is sensor-attributed" "dispatch-phase-eval" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .sensor')"
assert_eq "(3) attention is never machine-injected" "null" "$(written '.attention')"
assert_eq "(3) pace_exempt true" "true" "$(written '.pace_exempt')"
assert_eq "(3) phase null (draft shape)" "null" "$(written '.phase')"
assert_eq "(3) body spliced over the placeholder" \
  "The finding.
Second line." "$(awk 'p; /^---$/{c++; if(c==2) p=1}' "$NODE_MD")"

# --- (4) a second occurrence with an IDENTICAL body still counts -------------
# fleet-alarm's cmp -s gate would skip this commit entirely. Here the identical
# body is the NORMAL case for a recurring finding and the count must move.
OPEN_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":null,"execution":null,
 "statement":"the Stop hook HOLDs forever when no terminal marker is written",
 "attributes":{"ledger_entry":true,"first_seen":"2026-08-01",
   "measured_impact":[{"metric":"recurrence_count","value":1,"unit":"occurrences",
     "window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-01"}]}}
JSON
)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-05
assert_eq "(4) identical-body recurrence exits 0" "0" "$RC"
assert_eq "(4) stdout says landed (NOT a no-op)" "landed" "$SOUT"
GC4="$(log_lines graph-commit.log)"
assert_contains "(4) update is a CAS write (--base)" "--base" "$GC4"
assert_eq "(4) recurrence_count moved to 2" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(4) last-seen is the measured date, not a second field" "2026-08-05" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .measured')"
assert_eq "(4) no separate last_seen attribute" "null" "$(written '.attributes.last_seen')"
assert_eq "(4) first_seen preserved" "2026-08-01" "$(written '.attributes.first_seen')"
assert_eq "(4) statement NOT rewritten on an update" \
  "the Stop hook HOLDs forever when no terminal marker is written" "$(written '.statement')"
assert_eq "(4) exactly one classify (no second node minted)" "1" \
  "$(log_lines classify.log | wc -l | tr -d ' ')"

# --- (5) a RETIRED entry resumes, never re-mints -----------------------------
RETIRED_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":"done","execution":null,
 "statement":"the Stop hook HOLDs forever when no terminal marker is written",
 "attributes":{"ledger_entry":true,"first_seen":"2026-08-01",
   "measured_impact":[{"metric":"recurrence_count","value":7,"unit":"occurrences",
     "window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-09"}]}}
JSON
)
run_ef STUB_STATE=retired STUB_GC_LAND=1 STUB_NODE_JSON="$RETIRED_JSON" -- \
  --slug "$SLUG" --statement 'ignored' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-12
assert_eq "(5) recurrence after retirement exits 0" "0" "$RC"
assert_eq "(5) count RESUMES at 8, not 1" "8" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(5) phase cleared back to null (reopened)" "null" "$(written '.phase')"
assert_eq "(5) first_seen still the original day" "2026-08-01" "$(written '.attributes.first_seen')"
assert_contains "(5) resumed via a CAS update, not a fresh mint" "--base" "$(log_lines graph-commit.log)"

# --- (6) impact records upsert by (metric, window) ---------------------------
IMPACT="$WORK/impact.json"
printf '%s\n' '[{"metric":"recoverable_tokens","value":42000,"unit":"tokens","window":"7d","sensor":"token-economy","measured":"2026-08-12"}]' > "$IMPACT"
IMPACT_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":null,"execution":null,
 "statement":"s",
 "attributes":{"ledger_entry":true,"first_seen":"2026-08-01",
   "measured_impact":[
     {"metric":"recurrence_count","value":2,"unit":"occurrences","window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-05"},
     {"metric":"recoverable_tokens","value":100,"unit":"tokens","window":"7d","sensor":"token-economy","measured":"2026-08-05"}]}}
JSON
)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$IMPACT_JSON" -- \
  --slug "$SLUG" --statement 's' --body-file "$BODY" --sensor dispatch-phase-eval \
  --impact-file "$IMPACT" --now 2026-08-12
assert_eq "(6) impact update exits 0" "0" "$RC"
assert_eq "(6) the (metric,window) record was REWRITTEN, not appended" "1" \
  "$(written '[.attributes.measured_impact[] | select(.metric=="recoverable_tokens" and .window=="7d")] | length')"
assert_eq "(6) rewritten to the new figure" "42000" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recoverable_tokens") | .value')"
assert_eq "(6) the script's own recurrence record survived and incremented" "3" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"

# --- (7) --retire keeps the metrics ------------------------------------------
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$IMPACT_JSON" -- --retire --slug "$SLUG"
assert_eq "(7) retire exits 0" "0" "$RC"
assert_eq "(7) phase done" "done" "$(written '.phase')"
assert_eq "(7) measured_impact INTACT (nothing reset)" "2" \
  "$(written '.attributes.measured_impact | length')"
assert_eq "(7) the recurrence figure is preserved for a later resume" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"

# --- (8) the in-flight guard -------------------------------------------------
INFLIGHT_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":"implement",
 "execution":{"pr":123},"statement":"s","attributes":{"ledger_entry":true}}
JSON
)
run_ef STUB_STATE=open STUB_NODE_JSON="$INFLIGHT_JSON" -- \
  --slug "$SLUG" --statement 's' --body-file "$BODY" --sensor dispatch-phase-eval
assert_eq "(8) in-flight entry exits 0" "0" "$RC"
assert_eq "(8) stdout says noop" "noop" "$SOUT"
assert_eq "(8) no write-node" "" "$(log_lines write-node.log)"
assert_eq "(8) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_contains "(8) the dropped occurrence is announced, never silent" \
  "NOT COUNTED" "$OUT"

# --- (9) usage refusals ------------------------------------------------------
run_ef -- --slug "$SLUG" --statement s --body-file "$BODY"
assert_eq "(9) missing --sensor exits 64" "64" "$RC"
assert_contains "(9) and says why" "not admissible ranking input" "$OUT"

BAD_IMPACT="$WORK/bad-impact.json"
printf '%s\n' '[{"metric":"x","value":"not-a-number","unit":"u","window":"7d","sensor":"s","measured":"2026-08-12"}]' > "$BAD_IMPACT"
run_ef -- --slug "$SLUG" --statement s --body-file "$BODY" --sensor s --impact-file "$BAD_IMPACT"
assert_eq "(9) malformed --impact-file exits 64" "64" "$RC"
assert_eq "(9) and never reaches the graph" "" "$(log_lines classify.log)"

OWNED_IMPACT="$WORK/owned-impact.json"
printf '%s\n' '[{"metric":"recurrence_count","value":99,"unit":"occurrences","window":"all-time","sensor":"s","measured":"2026-08-12"}]' > "$OWNED_IMPACT"
run_ef -- --slug "$SLUG" --statement s --body-file "$BODY" --sensor s --impact-file "$OWNED_IMPACT"
assert_eq "(9) a caller-supplied recurrence_count exits 64" "64" "$RC"
assert_contains "(9) and names the owned metric" "owns that metric" "$OUT"

# --- (10) the silent-PASS invariant -----------------------------------------
# graph-commit exits 0 having landed NOTHING (STUB_GC_LAND unset): the SUT's
# post-write blob verification must turn that into exit 1.
run_ef STUB_STATE=open STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --statement s --body-file "$BODY" --sensor s
assert_eq "(10) an unlanded graph-commit is exit 1, not 0" "1" "$RC"
assert_contains "(10) and says verification failed" "verification failed" "$OUT"
# Nothing is printed on a failure exit — the non-zero rc is the whole signal, so
# a caller polling stdout can never read an unverified write as a landed one.
# (No rollback here, deliberately, and the same as dispatch-fleet-alarm: the
# commit reported success, so whether anything landed is genuinely unknown and
# blind restoration could discard a write that did land. The rc is the escalation.)
assert_eq "(10) prints nothing on stdout — never claims 'landed'" "" "$SOUT"

# --- (11) doctrine ratchet over the SUT source -------------------------------
SRC="$(cat "$SUT")"
assert_not_contains "(11) no cmp -s body-identity gate (it would swallow the count)" \
  'cmp -s' "$SRC"
assert_not_contains "(11) no minimum-refresh-interval brake (it would drop occurrences)" \
  'MIN_REFRESH_INTERVAL' "$SRC"
assert_not_contains "(11) no absent|closed mint-over case label" 'absent|closed' "$SRC"
assert_not_contains "(11) no absent|retired mint-over case label" 'absent|retired' "$SRC"
assert_contains "(11) retired shares the RESUME path with open" 'open|retired' "$SRC"
# Divergence 3: the sibling's non-blocking verb here would restore the silent
# under-count this ledger exists to avoid.
assert_contains "(11) takes the BOUNDED-WAIT mutex verb" \
  'graph_write_lock_acquire_wait "$REPO_ROOT"' "$SRC"
assert_not_contains "(11) never the sibling's non-blocking acquire" \
  'graph_write_lock_acquire "$REPO_ROOT"' "$SRC"

# --- (12) a contended mutex is WAITED for, then the write lands --------------
# A background holder takes the same flock the SUT will contend on and keeps it
# for 3s. The SUT is given a 30s budget, so it must BLOCK and then land — the
# pre-fix behaviour (non-blocking acquire) exits `skipped-locked` at once, which
# for a fire-and-forget caller is a lost occurrence, not a deferred one.
HOLDER=""
hold_lock() { # <seconds> — hold $LOCK_FILE for that long; sets $HOLDER to its pid
  local secs="$1"
  # NOT called in a command substitution, deliberately: a background job inside
  # `$(...)` inherits the substitution's stdout pipe, so the substitution would
  # not return until the holder exited — which is the whole delay being staged.
  ( exec 9>>"$LOCK_FILE"; flock 9; sleep "$secs" ) &
  HOLDER=$!
  # Block until the flock is genuinely taken, so the SUT contends rather than
  # racing the holder to an uncontended acquire.
  local waited=0
  while (( waited < 50 )); do
    if ! ( exec 8>>"$LOCK_FILE"; flock -n 8 ) 2>/dev/null; then break; fi
    sleep 0.1; waited=$((waited + 1))
  done
}

hold_lock 3
LOCK_T0=$(date +%s)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" \
  DISPATCH_EVAL_FINDING_LOCK_WAIT=30 -- \
  --slug "$SLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-05
LOCK_ELAPSED=$(( $(date +%s) - LOCK_T0 ))
wait "$HOLDER" 2>/dev/null || true
assert_eq "(12) contended run exits 0" "0" "$RC"
assert_eq "(12) it WAITED and LANDED — never skipped-locked" "landed" "$SOUT"
assert_contains "(12) and the write really reached graph-commit" "$ID" "$(log_lines graph-commit.log)"
assert_eq "(12) the recurrence count moved (the occurrence was counted)" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
# The holder kept the lock ~3s; an uncontended pass through this fixture is
# sub-second, so a run that took at least 2s demonstrably blocked on the flock.
assert_eq "(12) it blocked on the flock rather than returning at once" "yes" \
  "$( ((LOCK_ELAPSED >= 2)) && echo yes || echo "no (${LOCK_ELAPSED}s)")"

# --- (13) the wait is BOUNDED, and the timeout says the occurrence is LOST ----
# Same contention, but the holder outlives a 1s budget. The disposition stays
# `skipped-locked` (an evaluator must not fail its phase over a ledger write),
# and nothing is read or written — but the log line must NOT read like the
# sibling's benign deferral, because no next pass exists to recover this write.
hold_lock 4
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" \
  DISPATCH_EVAL_FINDING_LOCK_WAIT=1 -- \
  --slug "$SLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-05
assert_eq "(13) a spent wait budget still exits 0" "0" "$RC"
assert_eq "(13) stdout says skipped-locked" "skipped-locked" "$SOUT"
assert_eq "(13) nothing was read" "" "$(log_lines classify.log)"
assert_eq "(13) nothing was written" "" "$(log_lines graph-commit.log)"
assert_contains "(13) the log names the uncounted occurrence" "NOT COUNTED" "$OUT"
assert_contains "(13) and says it is LOST, not deferred" "IS LOST" "$OUT"
assert_contains "(13) and that nothing will re-invoke it" "NOTHING WILL RE-INVOKE" "$OUT"
assert_contains "(13) and names the wait budget it spent" "after waiting 1s" "$OUT"
wait "$HOLDER" 2>/dev/null || true

# --- summary -----------------------------------------------------------------
# report_results is also the decision-log guard's ONLY call site, so the suite
# must end here rather than tallying by hand.
report_results
