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
#   aaa  came-and-went      single assistant line at T-3600 (last work < reclaim T)
#   bbb  slow-boot-artifact single assistant line at T+60  (first work just after T,
#                           within GRACE=300 → premature reclaim of a still-booting
#                           worker)
#   ccc  alive-across       two assistant lines at T-3600 and T+3600 (first<=T<=last
#                           → a live worker falsely reclaimed)
#   ddd  genuine-strand     NO project dir at all → no contemporaneous worker
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
    printf '%s host dispatch-tick[111]: lib-reservation-ledger: reclaimed reservation aaa (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[112]: lib-reservation-ledger: reclaimed reservation bbb (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[113]: lib-reservation-ledger: reclaimed reservation ccc (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[114]: lib-reservation-ledger: reclaimed reservation ddd (dead-session-stranded)\n' "$T"
    printf '%s host dispatch-tick[115]: lib-reservation-ledger: reclaimed reservation eee (live-worker-redundant)\n' "$T"
    printf '%s host dispatch-tick[116]: lib-reservation-ledger: reclaimed reservation fff (live-worker-redundant)\n' "$T"
  } > "$SWEEP_LOG"

  # --- projects tree: dirs ending with worktrees-<wt> -------------------------
  # The audit matches a project dir whose basename ENDS WITH worktrees-<wt>.
  # The .jsonl must be a DIRECT child (find -maxdepth 1). No project dir for ddd.

  # aaa — came-and-went: single line BEFORE T (last work < T).
  local aaa_dir="$ROOT/-home-x-worktrees-aaa"
  mkdir -p "$aaa_dir"
  emit_assistant "$aaa_dir/sess.jsonl" "2026-06-01T11:00:00+00:00"  # T-3600

  # bbb — slow-boot-artifact: single line just AFTER T (first - T = 60 <= 300).
  local bbb_dir="$ROOT/-home-x-worktrees-bbb"
  mkdir -p "$bbb_dir"
  emit_assistant "$bbb_dir/sess.jsonl" "2026-06-01T12:01:00+00:00"  # T+60

  # ccc — alive-across: lines on BOTH sides of T (first <= T <= last).
  local ccc_dir="$ROOT/-home-x-worktrees-ccc"
  mkdir -p "$ccc_dir"
  emit_assistant "$ccc_dir/sess.jsonl" "2026-06-01T11:00:00+00:00"  # T-3600
  emit_assistant "$ccc_dir/sess.jsonl" "2026-06-01T13:00:00+00:00"  # T+3600

  # ddd — genuine-strand: deliberately NO project dir.

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

report_results
exit $FAIL
