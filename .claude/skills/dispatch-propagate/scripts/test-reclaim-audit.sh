#!/usr/bin/env bash
# Self-contained unit test for dispatch-reclaim-audit (#1454).
#
# Builds a fixture sweep log + projects tree under a temp dir, points the audit
# at them via DISPATCH_RECLAIM_SWEEP_LOG and DISPATCH_RECLAIM_PROJECTS_ROOT, runs
# the audit in --json mode, and asserts the cause buckets and the reclaim rate.
#
# The fixture is engineered so the four dead-session-stranded reclaim EVENTS land
# one each in came-and-went / slow-boot-artifact / alive-across / genuine-strand:
#
#   1001-aaa  came-and-went      single assistant line at T-3600 (last work < reclaim T)
#   1002-bbb  slow-boot-artifact single assistant line at T+60  (first work just after T,
#                                within GRACE=300 → premature reclaim of a still-booting
#                                worker)
#   1003-ccc  alive-across       two assistant lines at T-3600 and T+3600 (first<=T<=last
#                                → a live worker falsely reclaimed)
#   1004-ddd  genuine-strand     NO project dir at all → no contemporaneous worker
#
# TIMEZONE SUBTLETY: iso_to_epoch is `date -d`, which reads a zoneless timestamp
# in the runner's local TZ. The slow-boot bucket's +60s delta sits close to the
# 300s GRACE boundary, so a TZ mismatch between the reclaim ts (UTC) and the
# transcript ts (local) would shift the delta by hours and flip the bucket.
# Every timestamp here — reclaim events AND transcripts — carries an explicit
# +00:00 zone, so the deltas are exact regardless of the runner's TZ.
#
# Usage: bash test-reclaim-audit.sh
# Exit 0 = all passed; non-zero = one or more failures.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- test helpers -----------------------------------------------------------

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

report_results() {
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"
}

# --- harness ----------------------------------------------------------------

ROOT=""
SWEEP_LOG=""

# Reclaim event timestamp shared by all four dead events (each on its own wt).
T="2026-06-01T12:00:00+00:00"

# emit_assistant — append an assistant transcript line with the given timestamp.
# $1 jsonl path; $2 ISO timestamp.
emit_assistant() {
  printf '%s\n' \
    "{\"type\":\"assistant\",\"timestamp\":\"$2\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"x\"}]}}" \
    >> "$1"
}

setup() {
  ROOT=$(mktemp -d)

  # --- sweep log: 4 dead-session-stranded + 2 live-worker-redundant -----------
  # Line shape mirrors `journalctl -o short-iso` of the sweep's stderr:
  #   <ISO-ts> host dispatch-tick[pid]: lib-reservation-ledger: reclaimed reservation <wt> (<reason>)
  # The audit parses field 1 as the ISO ts and seds <wt> from the message body.
  SWEEP_LOG="$ROOT/sweep.txt"
  {
    printf '%s host dispatch-tick[111]: lib-reservation-ledger: reclaimed reservation 1001-aaa (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[112]: lib-reservation-ledger: reclaimed reservation 1002-bbb (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[113]: lib-reservation-ledger: reclaimed reservation 1003-ccc (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[114]: lib-reservation-ledger: reclaimed reservation 1004-ddd (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[115]: lib-reservation-ledger: reclaimed reservation 1005-eee (live-worker-redundant)\n' "$T"
    printf '%s host dispatch-tick[116]: lib-reservation-ledger: reclaimed reservation 1006-fff (live-worker-redundant)\n' "$T"
  } > "$SWEEP_LOG"

  # --- projects tree: dirs ending with worktrees-<wt> -------------------------
  # The audit matches a project dir whose basename ENDS WITH worktrees-<wt>.
  # The .jsonl must be a DIRECT child (find -maxdepth 1). No project dir for ddd.

  # 1001-aaa — came-and-went: single line BEFORE T (last work < T).
  local aaa_dir="$ROOT/-home-x-worktrees-1001-aaa"
  mkdir -p "$aaa_dir"
  emit_assistant "$aaa_dir/sess.jsonl" "2026-06-01T11:00:00+00:00"  # T-3600

  # 1002-bbb — slow-boot-artifact: single line just AFTER T (first - T = 60 <= 300).
  local bbb_dir="$ROOT/-home-x-worktrees-1002-bbb"
  mkdir -p "$bbb_dir"
  emit_assistant "$bbb_dir/sess.jsonl" "2026-06-01T12:01:00+00:00"  # T+60

  # 1003-ccc — alive-across: lines on BOTH sides of T (first <= T <= last).
  local ccc_dir="$ROOT/-home-x-worktrees-1003-ccc"
  mkdir -p "$ccc_dir"
  emit_assistant "$ccc_dir/sess.jsonl" "2026-06-01T11:00:00+00:00"  # T-3600
  emit_assistant "$ccc_dir/sess.jsonl" "2026-06-01T13:00:00+00:00"  # T+3600

  # 1004-ddd — genuine-strand: deliberately NO project dir.

  # Validate the fixture transcript lines are well-formed JSON.
  jq . "$aaa_dir/sess.jsonl" >/dev/null
  jq . "$bbb_dir/sess.jsonl" >/dev/null
  jq . "$ccc_dir/sess.jsonl" >/dev/null

  # The audit windows transcript discovery with `find -newermt "$SINCE"`; touch
  # every .jsonl to now so a wide --days window includes them.
  touch "$aaa_dir/sess.jsonl" "$bbb_dir/sess.jsonl" "$ccc_dir/sess.jsonl"

  export DISPATCH_RECLAIM_SWEEP_LOG="$SWEEP_LOG"
  export DISPATCH_RECLAIM_PROJECTS_ROOT="$ROOT"
}

teardown() {
  unset DISPATCH_RECLAIM_SWEEP_LOG DISPATCH_RECLAIM_PROJECTS_ROOT
  if [[ -n "$ROOT" && -d "$ROOT" ]]; then
    rm -rf "$ROOT"
  fi
}

trap teardown EXIT

# --- run -------------------------------------------------------------------

setup

echo "Running dispatch-reclaim-audit against fixture (--json)..."
# --days wide so the touched transcripts fall inside the window.
OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json)

echo ""
echo "--- assertions ---"

# RATE: four dead-session-stranded events (one per distinct wt).
assert_eq "sweep.dead_session_stranded_events" "4" \
  "$(jq '.sweep.dead_session_stranded_events' <<<"$OUT")"
assert_eq "sweep.live_worker_redundant_events" "2" \
  "$(jq '.sweep.live_worker_redundant_events' <<<"$OUT")"
assert_eq "sweep.dead_session_stranded_distinct_worktrees" "4" \
  "$(jq '.sweep.dead_session_stranded_distinct_worktrees' <<<"$OUT")"

# RATE, reason-generic table: the retained scalars above are DERIVED from it, so
# the two must agree on the same fixture.
assert_eq "sweep.reclaim_events_total" "6" \
  "$(jq '.sweep.reclaim_events_total' <<<"$OUT")"
assert_eq 'reclaim_events_by_reason["dead-session-stranded"]' "4" \
  "$(jq '.sweep.reclaim_events_by_reason["dead-session-stranded"]' <<<"$OUT")"
assert_eq 'reclaim_events_by_reason["live-worker-redundant"]' "2" \
  "$(jq '.sweep.reclaim_events_by_reason["live-worker-redundant"]' <<<"$OUT")"
assert_eq "sweep.reclaim_events_reason_unparsed" "0" \
  "$(jq '.sweep.reclaim_events_reason_unparsed' <<<"$OUT")"
# A reason absent from the window is absent from the object, not zero-valued —
# the key set is data, not schema. Reading it as 0 is what a consumer must do.
assert_eq 'reclaim_events_by_reason["spawn-handoff-expired"] // 0 (absent)' "0" \
  "$(jq '.sweep.reclaim_events_by_reason["spawn-handoff-expired"] // 0' <<<"$OUT")"

# CAUSE buckets: exactly one event in each.
assert_eq 'cause_buckets["came-and-went"]' "1" \
  "$(jq '.cause_buckets["came-and-went"]' <<<"$OUT")"
assert_eq 'cause_buckets["slow-boot-artifact"]' "1" \
  "$(jq '.cause_buckets["slow-boot-artifact"]' <<<"$OUT")"
assert_eq 'cause_buckets["alive-across"]' "1" \
  "$(jq '.cause_buckets["alive-across"]' <<<"$OUT")"
assert_eq 'cause_buckets["genuine-strand"]' "1" \
  "$(jq '.cause_buckets["genuine-strand"]' <<<"$OUT")"
assert_eq 'cause_buckets["unclassified-no-timestamp"]' "0" \
  "$(jq '.cause_buckets["unclassified-no-timestamp"]' <<<"$OUT")"

# POPULATION groupings derived from the buckets.
assert_eq 'populations["benign-not-death"] = came-and-went + slow-boot' "2" \
  "$(jq '.populations["benign-not-death"]' <<<"$OUT")"
assert_eq 'populations["genuine-death"] = genuine-strand' "1" \
  "$(jq '.populations["genuine-death"]' <<<"$OUT")"
assert_eq 'populations["false-reclaim-of-live"] = alive-across' "1" \
  "$(jq '.populations["false-reclaim-of-live"]' <<<"$OUT")"

# SWEEP STATUS SENTINELS on the fixture-file path: the read succeeded, and there
# is no live journal behind a pre-captured file to cross-check against.
assert_eq "fixture-path sweep.status" '"ok"' \
  "$(jq '.sweep.status' <<<"$OUT")"
assert_eq "fixture-path sweep.crosscheck" '"skipped"' \
  "$(jq '.sweep.crosscheck' <<<"$OUT")"
assert_eq "fixture-path sweep.available (legacy key)" "true" \
  "$(jq '.sweep.available' <<<"$OUT")"

# --- journalctl-path test: -t (identifier) filter, not -u (unit) filter -----
#
# The fixture path above sets DISPATCH_RECLAIM_SWEEP_LOG, which the script reads
# via `cat` and never invokes journalctl — it cannot regression-test the filter
# flag itself. This test leaves DISPATCH_RECLAIM_SWEEP_LOG unset so the script
# takes the live journalctl path, and points DISPATCH_RECLAIM_JOURNALCTL_CMD at a
# stub that models the real host bug: a `-u dispatch-tick` (unit) filter finds
# nothing, while the corrected `-t dispatch-tick` (syslog identifier) filter
# returns the sweep lines. The stub reuses the exact six fixture lines from
# setup() above (same $SWEEP_LOG content) and logs its full argv for inspection.

echo ""
echo "Running dispatch-reclaim-audit against fixture (journalctl path, -t filter)..."

JOURNALCTL_ARGV_LOG="$ROOT/journalctl-argv.log"

# The six fixture reclaim lines, reused as canned journalctl stub responses.
# Same shape as the $SWEEP_LOG fixture built in setup().
RECLAIM_FIXTURE_LINES=(
  "111 1001-aaa dead-session-stranded"
  "112 1002-bbb dead-session-stranded"
  "113 1003-ccc dead-session-stranded"
  "114 1004-ddd dead-session-stranded"
  "115 1005-eee live-worker-redundant"
  "116 1006-fff live-worker-redundant"
)

# reclaim_lines — print the first N fixture reclaim lines. No `head`: truncating
# a pipe under `set -o pipefail` would fail the producer on SIGPIPE.
reclaim_lines() {
  local n="$1" i pid wt reason
  for (( i = 0; i < n; i++ )); do
    read -r pid wt reason <<<"${RECLAIM_FIXTURE_LINES[$i]}"
    printf '%s host dispatch-tick[%s]: lib-reservation-ledger: reclaimed reservation %s (%s)\n' \
      "$T" "$pid" "$wt" "$reason"
  done
}

# make_journalctl_stub — author a journalctl stub responding to THREE argv
# shapes, so both the identifier-filtered read and the unfiltered cross-check
# probe can be modelled independently:
#   -u dispatch-tick        → the host bug: the unit filter finds nothing.
#   -t dispatch-tick        → the corrected identifier filter (canned file).
#   --grep (no -u/-t)       → the audit's unfiltered cross-check probe.
# Canned responses are served from files on disk so no quoting from this test
# file has to survive the heredoc.
#   $1 stub path  $2 filtered-response file  $3 unfiltered-probe response file
#   $4 exit code for the -t read  $5 exit code for the --grep probe
make_journalctl_stub() {
  local stub="$1" filtered_file="$2" unfiltered_file="$3" filtered_rc="$4" probe_rc="$5"
  cat > "$stub" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$JOURNALCTL_ARGV_LOG"
if [[ " \$* " == *" -u dispatch-tick "* ]]; then
  exit 0
fi
if [[ " \$* " == *" -t dispatch-tick "* ]]; then
  [[ $filtered_rc -eq 0 ]] || exit $filtered_rc
  cat -- "$filtered_file"
  exit 0
fi
if [[ " \$* " == *" --grep "* ]]; then
  [[ $probe_rc -eq 0 ]] || exit $probe_rc
  cat -- "$unfiltered_file"
  exit 0
fi
exit 0
STUB
  chmod +x "$stub"
}

unset DISPATCH_RECLAIM_SWEEP_LOG

# --- case A: healthy live-journal path -------------------------------------
# The -t identifier filter and the unfiltered --grep probe agree (6 lines each)
# → crosscheck ok, exit 0. This is what distinguishes a genuine measurement from
# the silent undercount asserted in case C below.
reclaim_lines 6 > "$ROOT/lines6.txt"
make_journalctl_stub "$ROOT/journalctl-stub-ok" "$ROOT/lines6.txt" "$ROOT/lines6.txt" 0 0
export DISPATCH_RECLAIM_JOURNALCTL_CMD="$ROOT/journalctl-stub-ok"

JOURNALCTL_RC=0
JOURNALCTL_OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json) || JOURNALCTL_RC=$?

echo ""
echo "--- assertions (journalctl -t filter path, cross-check agrees) ---"

assert_eq "journalctl-path sweep.dead_session_stranded_events" "4" \
  "$(jq '.sweep.dead_session_stranded_events' <<<"$JOURNALCTL_OUT")"
assert_eq "journalctl-path sweep.live_worker_redundant_events" "2" \
  "$(jq '.sweep.live_worker_redundant_events' <<<"$JOURNALCTL_OUT")"
assert_eq "journalctl-path sweep.source contains -t dispatch-tick" "1" \
  "$(jq '(.sweep.source | test("-t dispatch-tick")) | if . then 1 else 0 end' <<<"$JOURNALCTL_OUT")"
assert_eq "journalctl-path sweep.status" '"ok"' \
  "$(jq '.sweep.status' <<<"$JOURNALCTL_OUT")"
assert_eq "journalctl-path sweep.crosscheck" '"ok"' \
  "$(jq '.sweep.crosscheck' <<<"$JOURNALCTL_OUT")"
assert_eq "journalctl-path exit code" "0" "$JOURNALCTL_RC"

# --- case A, argv assertions: pin the CONSTRUCTED command -------------------
# `.sweep.source` asserted above is a hand-maintained display string inside
# dispatch-reclaim-audit, decoupled from the real invocation — it proves nothing
# about the flags actually passed to journalctl. These assertions read the stub's
# own argv log instead, so a revert to the `-u` unit filter, a dropped `--grep`
# probe, or an unbounded (open-ended) window fails here directly rather than only
# via the downstream counts.
ARGV_TOTAL_LINES=$(grep -c '' "$JOURNALCTL_ARGV_LOG" || true)
ARGV_T_LINES=$(grep -c -- '-t dispatch-tick' "$JOURNALCTL_ARGV_LOG" || true)
ARGV_U_LINES=$(grep -c -- '-u dispatch-tick' "$JOURNALCTL_ARGV_LOG" || true)
ARGV_GREP_LINES=$(grep -c -- '--grep' "$JOURNALCTL_ARGV_LOG" || true)
ARGV_UNTIL_LINES=$(grep -c -- '--until' "$JOURNALCTL_ARGV_LOG" || true)

assert_eq "journalctl argv: identifier read used -t dispatch-tick" "1" \
  "$(( ARGV_T_LINES >= 1 ? 1 : 0 ))"
assert_eq "journalctl argv: never invoked with the -u unit filter" "0" \
  "${ARGV_U_LINES:-0}"
assert_eq "journalctl argv: unfiltered --grep cross-check probe ran" "1" \
  "$(( ARGV_GREP_LINES >= 1 ? 1 : 0 ))"
assert_eq "journalctl argv: both probes invoked" "1" \
  "$(( ARGV_TOTAL_LINES >= 2 ? 1 : 0 ))"
# Every probe must carry --until: an open-ended window would end at each probe's
# own invocation instant, and a reclaim landing in the gap between them would
# manufacture a false `mismatch` on a healthy filter.
assert_eq "journalctl argv: every probe bounded with --until" "$ARGV_TOTAL_LINES" \
  "${ARGV_UNTIL_LINES:-0}"

# --- case B: journalctl errors → status unavailable, exit 3 -----------------
# The read itself fails (no systemd / sandboxed). The counts are zero, but zero
# here means NOT MEASURED — the sentinel and the non-zero exit make that
# impossible for a caller to read as "zero reclaims".
make_journalctl_stub "$ROOT/journalctl-stub-err" "$ROOT/lines6.txt" "$ROOT/lines6.txt" 1 0
export DISPATCH_RECLAIM_JOURNALCTL_CMD="$ROOT/journalctl-stub-err"

ERR_RC=0
ERR_OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json 2>/dev/null) || ERR_RC=$?

echo ""
echo "--- assertions (journalctl errors → unavailable) ---"

assert_eq "journalctl-error sweep.status" '"unavailable"' \
  "$(jq '.sweep.status' <<<"$ERR_OUT")"
assert_eq "journalctl-error sweep.available (legacy key)" "false" \
  "$(jq '.sweep.available' <<<"$ERR_OUT")"
assert_eq "journalctl-error sweep.dead_session_stranded_events" "0" \
  "$(jq '.sweep.dead_session_stranded_events' <<<"$ERR_OUT")"
assert_eq "journalctl-error sweep.live_worker_redundant_events" "0" \
  "$(jq '.sweep.live_worker_redundant_events' <<<"$ERR_OUT")"
assert_eq "journalctl-error exit code" "3" "$ERR_RC"

# --- case C: silent undercount → crosscheck mismatch, exit 3 ---------------
# The direct regression lock for the reported bug's failure mode: the identifier
# filter matches only a SUBSET of the reclaim lines the journal actually holds in
# the window. Without the cross-check the audit would report the subset as a
# measurement.
reclaim_lines 2 > "$ROOT/lines2.txt"
make_journalctl_stub "$ROOT/journalctl-stub-under" "$ROOT/lines2.txt" "$ROOT/lines6.txt" 0 0
export DISPATCH_RECLAIM_JOURNALCTL_CMD="$ROOT/journalctl-stub-under"

UNDER_RC=0
UNDER_OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json 2>/dev/null) || UNDER_RC=$?

echo ""
echo "--- assertions (identifier filter undercounts the journal) ---"

assert_eq "undercount sweep.status" '"ok"' \
  "$(jq '.sweep.status' <<<"$UNDER_OUT")"
assert_eq "undercount sweep.crosscheck" '"mismatch"' \
  "$(jq '.sweep.crosscheck' <<<"$UNDER_OUT")"
assert_eq "undercount sweep.crosscheck_journal_lines" "6" \
  "$(jq '.sweep.crosscheck_journal_lines' <<<"$UNDER_OUT")"
assert_eq "undercount sweep.crosscheck_filtered_lines" "2" \
  "$(jq '.sweep.crosscheck_filtered_lines' <<<"$UNDER_OUT")"
assert_eq "undercount exit code" "3" "$UNDER_RC"

# --- case D: contradictory probes → crosscheck inconsistent, exit 0 ---------
# The unfiltered probe is a strict superset of the identifier-filtered read, so
# it can never legitimately return FEWER lines. When it does, the two probes
# contradict each other and the cross-check established nothing — it must NOT be
# graded "ok" (that is the silent coercion to a healthy state the sentinel
# exists to prevent). It does not set exit 3 either: a contradiction is not
# evidence the -t counts undercount.
make_journalctl_stub "$ROOT/journalctl-stub-incons" "$ROOT/lines6.txt" "$ROOT/lines2.txt" 0 0
export DISPATCH_RECLAIM_JOURNALCTL_CMD="$ROOT/journalctl-stub-incons"

INCONS_RC=0
INCONS_OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json 2>/dev/null) || INCONS_RC=$?

echo ""
echo "--- assertions (probes contradict → inconsistent, never ok) ---"

assert_eq "inconsistent sweep.status" '"ok"' \
  "$(jq '.sweep.status' <<<"$INCONS_OUT")"
assert_eq "inconsistent sweep.crosscheck" '"inconsistent"' \
  "$(jq '.sweep.crosscheck' <<<"$INCONS_OUT")"
assert_eq "inconsistent sweep.crosscheck_journal_lines" "2" \
  "$(jq '.sweep.crosscheck_journal_lines' <<<"$INCONS_OUT")"
assert_eq "inconsistent sweep.crosscheck_filtered_lines" "6" \
  "$(jq '.sweep.crosscheck_filtered_lines' <<<"$INCONS_OUT")"
assert_eq "inconsistent exit code" "0" "$INCONS_RC"

export DISPATCH_RECLAIM_SWEEP_LOG="$SWEEP_LOG"
unset DISPATCH_RECLAIM_JOURNALCTL_CMD

# --- case E: reasons carrying a trailing in-paren clause --------------------
# The regression lock for the reason-generic bucketing. spawn-handoff-expired and
# <origin>-ttl-expired append ` after <N>s with no live worker` INSIDE the same
# parentheses, so the old `\(<reason>\)` anchors matched neither and both were
# counted nowhere. The fixture also carries the two ledger lines that look like
# reclaims but are not — `keeping malformed reservation` and the `(stranded
# reclaim of ...)` follow-up note — which the total must exclude.
#
# A SEPARATE sweep log: the shared $SWEEP_LOG feeds every assertion above.
CASE_E_LOG="$ROOT/sweep-clauses.txt"
{
  printf '%s host dispatch-tick[201]: lib-reservation-ledger: reclaimed reservation 2007-ggg (spawn-handoff-expired after 300s with no live worker)\n' "$T"
  printf '%s host dispatch-tick[202]: lib-reservation-ledger: reclaimed reservation 2008-hhh (spawn-handoff-expired after 300s with no live worker)\n' "$T"
  printf '%s host dispatch-tick[203]: lib-reservation-ledger: reclaimed reservation 2009-iii (standalone-ttl-expired after 600s with no live worker)\n' "$T"
  printf '%s host dispatch-tick[204]: lib-reservation-ledger: reclaimed reservation 2010-jjj (explicit-ttl-expired after 600s with no live worker)\n' "$T"
  printf '%s host dispatch-tick[205]: lib-reservation-ledger: reclaimed reservation 2011-kkk (office-hours-ttl-expired after 600s with no live worker)\n' "$T"
  printf '%s host dispatch-tick[206]: lib-reservation-ledger: reclaimed reservation 2012-lll (dead-session-stranded)\n' "$T"
  printf '%s host dispatch-tick[207]: lib-reservation-ledger: keeping malformed reservation 2013-mmm (no session= line)\n' "$T"
  printf '%s host dispatch-tick[208]: lib-reservation-ledger:   (stranded reclaim of 2012-lll — if retained, inspect tmp/dispatch-launch-2012-lll.log for the launcher last output)\n' "$T"
} > "$CASE_E_LOG"

export DISPATCH_RECLAIM_SWEEP_LOG="$CASE_E_LOG"

CLAUSE_RC=0
CLAUSE_OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json) || CLAUSE_RC=$?

echo ""
echo "--- assertions (reasons with a trailing in-paren clause) ---"

# 6, not 8: the two non-reclaim ledger lines are pinned out of the population.
assert_eq "clause sweep.reclaim_events_total (non-reclaim lines excluded)" "6" \
  "$(jq '.sweep.reclaim_events_total' <<<"$CLAUSE_OUT")"
assert_eq 'clause reclaim_events_by_reason["spawn-handoff-expired"]' "2" \
  "$(jq '.sweep.reclaim_events_by_reason["spawn-handoff-expired"]' <<<"$CLAUSE_OUT")"
assert_eq 'clause reclaim_events_by_reason["standalone-ttl-expired"]' "1" \
  "$(jq '.sweep.reclaim_events_by_reason["standalone-ttl-expired"]' <<<"$CLAUSE_OUT")"
assert_eq 'clause reclaim_events_by_reason["explicit-ttl-expired"]' "1" \
  "$(jq '.sweep.reclaim_events_by_reason["explicit-ttl-expired"]' <<<"$CLAUSE_OUT")"
assert_eq 'clause reclaim_events_by_reason["office-hours-ttl-expired"]' "1" \
  "$(jq '.sweep.reclaim_events_by_reason["office-hours-ttl-expired"]' <<<"$CLAUSE_OUT")"
assert_eq 'clause reclaim_events_by_reason["dead-session-stranded"]' "1" \
  "$(jq '.sweep.reclaim_events_by_reason["dead-session-stranded"]' <<<"$CLAUSE_OUT")"
# The retained named counters still derive correctly from the table.
assert_eq "clause sweep.dead_session_stranded_events (derived)" "1" \
  "$(jq '.sweep.dead_session_stranded_events' <<<"$CLAUSE_OUT")"
assert_eq "clause sweep.live_worker_redundant_events (derived)" "0" \
  "$(jq '.sweep.live_worker_redundant_events' <<<"$CLAUSE_OUT")"
assert_eq "clause sweep.reclaim_events_reason_unparsed" "0" \
  "$(jq '.sweep.reclaim_events_reason_unparsed' <<<"$CLAUSE_OUT")"
assert_eq "clause sweep.dead_session_stranded_distinct_worktrees" "1" \
  "$(jq '.sweep.dead_session_stranded_distinct_worktrees' <<<"$CLAUSE_OUT")"

# OUT-OF-SCOPE GUARD: the new reasons must stay a scalar RATE count and must not
# leak into the CAUSE analysis. Only 2012-lll (dead-session-stranded, and with no
# project dir under the projects root) reaches the buckets.
assert_eq 'clause cause_buckets["genuine-strand"]' "1" \
  "$(jq '.cause_buckets["genuine-strand"]' <<<"$CLAUSE_OUT")"
assert_eq "clause cause_buckets sum (only the dead-session event apportioned)" "1" \
  "$(jq '[.cause_buckets[]] | add' <<<"$CLAUSE_OUT")"

assert_eq "clause sweep.status" '"ok"' \
  "$(jq '.sweep.status' <<<"$CLAUSE_OUT")"
assert_eq "clause sweep.crosscheck" '"skipped"' \
  "$(jq '.sweep.crosscheck' <<<"$CLAUSE_OUT")"
assert_eq "clause exit code" "0" "$CLAUSE_RC"

export DISPATCH_RECLAIM_SWEEP_LOG="$SWEEP_LOG"

# --- case F: a reason token the parse does not recognize --------------------
# The fail-open closer. A reclaim line whose reason will not parse is counted in
# the total and reported in its own figure — never silently dropped into no
# bucket, which is exactly the blindness this change removes. It is a maintenance
# signal, not evidence of an undercount (the total is still right), so it is
# report-only and must NOT grade the run untrusted.
CASE_F_LOG="$ROOT/sweep-unparsed.txt"
printf '%s host dispatch-tick[209]: lib-reservation-ledger: reclaimed reservation 2014-nnn (Weird_Reason)\n' \
  "$T" > "$CASE_F_LOG"

export DISPATCH_RECLAIM_SWEEP_LOG="$CASE_F_LOG"

UNPARSED_RC=0
UNPARSED_OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" --days 3650 --json) || UNPARSED_RC=$?

echo ""
echo "--- assertions (unrecognized reason token → reported, not dropped) ---"

assert_eq "unparsed sweep.reclaim_events_reason_unparsed" "1" \
  "$(jq '.sweep.reclaim_events_reason_unparsed' <<<"$UNPARSED_OUT")"
assert_eq "unparsed sweep.reclaim_events_total (still counted)" "1" \
  "$(jq '.sweep.reclaim_events_total' <<<"$UNPARSED_OUT")"
assert_eq "unparsed sweep.reclaim_events_by_reason (empty table)" "{}" \
  "$(jq -c '.sweep.reclaim_events_by_reason' <<<"$UNPARSED_OUT")"
assert_eq "unparsed sweep.status" '"ok"' \
  "$(jq '.sweep.status' <<<"$UNPARSED_OUT")"
# The point of the case: reported, not graded untrusted.
assert_eq "unparsed exit code (report-only, not exit 3)" "0" "$UNPARSED_RC"

export DISPATCH_RECLAIM_SWEEP_LOG="$SWEEP_LOG"

report_results
exit $FAIL
