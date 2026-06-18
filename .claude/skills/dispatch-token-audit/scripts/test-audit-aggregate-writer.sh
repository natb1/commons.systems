#!/usr/bin/env bash
# test-audit-aggregate-writer.sh — dependency-free dry-run unit test for
# audit-aggregate-writer.mjs (writer side of #1862).
#
# Runs the writer ONLY in --dry-run, so firebase-admin and
# @google-cloud/secret-manager are NEVER imported and no network/credentials are
# touched. The DISPATCH_AUDIT_AGGREGATES_NOW seam pins computedAt/expireAt and
# DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE supplies dummy member emails, so the
# suite is fully deterministic and runs without node_modules.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRITER_MJS="$SCRIPT_DIR/audit-aggregate-writer.mjs"

PASS=0
FAIL=0
assert_eq() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    printf 'ok   %s\n' "$name"
  else
    FAIL=$((FAIL + 1))
    printf 'FAIL %s\n      expected: %s\n      actual:   %s\n' "$name" "$expected" "$actual"
  fi
}

# Fixed epoch for determinism. NOTE: this NOW is deliberately on a DIFFERENT
# calendar day than the window.until below, so the doc-id test proves the id
# uses window.until's date, not the writer clock.
#   NOW   = 1780600000 = 2026-06-04T... UTC
#   TTL   = 365 days (default) → expireAt = NOW + 365*86400 = 1812136000
AA_NOW=1780600000
AA_EXPIRE=1812136000   # AA_NOW + 365*86400

# Representative aggregate JSON (the aggregate-usage.sh output shape). Includes
# the unbounded arrays the writer MUST drop (sessions/tool_sequences/
# payload_bytes/tool_errors) so we can assert their absence in the doc. window
# .until is 2026-06-10 (a different day than NOW's 2026-06-04).
PAYLOAD='{
  "window": {"days": 7, "since": "2026-06-03 12:00:00", "until": "2026-06-10 12:00:00", "files_scanned": 42, "files_failed": 1},
  "price_model": {"note": "proxy", "input_per_mtok": 15, "cache_creation_per_mtok": 18.75, "cache_read_per_mtok": 1.5, "output_per_mtok": 75},
  "totals": {"input": 100, "cache_creation": 200, "cache_read": 300, "output": 400, "sessions": 5, "turns": 50, "price_proxy_usd": 1.23},
  "by_session_type": {"worker": {"input": 1}},
  "by_phase": {"review-fix": {"input": 10, "cache_creation": 20, "cache_read": 30, "output": 40, "turns": 5, "price_proxy_usd": 0.5}},
  "by_model": {"opus": {"input": 11, "cache_creation": 21, "cache_read": 31, "output": 41, "turns": 6, "price_proxy_usd": 0.6}},
  "by_phase_model": {"x": {"input": 1}},
  "tool_errors": {"sig": {"count": 3}},
  "tool_sequences": {"top": [1, 2, 3], "distinct": 99},
  "payload_bytes": {"total": 12345, "by_tool": [{"tool": "Read"}]},
  "lenses": {"context_over_120k": {"sessions": 2}},
  "sessions": [{"id": "abc", "turns": 9}]
}'

run_writer() { printf '%s' "$PAYLOAD" | node "$WRITER_MJS" --dry-run; }

export DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE="a@b.com,c@d.com"
export DISPATCH_AUDIT_AGGREGATES_GROUP_ID="grp-1"
export DISPATCH_AUDIT_AGGREGATES_NOW="$AA_NOW"

# --- Case 1: valid payload → exit 0, envelope shape -------------------------
if OUT=$(run_writer 2>/dev/null); then RC=0; else RC=$?; fi
assert_eq "valid payload → exit 0" "0" "$RC"
assert_eq "envelope has id + doc" "1" \
  "$(jq -e 'has("id") and has("doc")' <<<"$OUT" >/dev/null 2>&1 && echo 1 || echo 0)"

# --- Case 2: curated subset present -----------------------------------------
assert_eq "doc has curated fields" "1" \
  "$(jq -e '.doc | has("window") and has("totals") and has("byPhase") and has("byModel") and has("priceModel") and has("windowDays") and has("computedAt") and has("groupId") and has("memberEmails") and has("expireAt")' <<<"$OUT" >/dev/null 2>&1 && echo 1 || echo 0)"

# --- Case 3: unbounded arrays ABSENT ----------------------------------------
assert_eq "doc omits sessions" "false" "$(jq -c '.doc | has("sessions")' <<<"$OUT")"
assert_eq "doc omits tool_sequences" "false" "$(jq -c '.doc | has("tool_sequences")' <<<"$OUT")"
assert_eq "doc omits payload_bytes" "false" "$(jq -c '.doc | has("payload_bytes")' <<<"$OUT")"
assert_eq "doc omits tool_errors" "false" "$(jq -c '.doc | has("tool_errors")' <<<"$OUT")"
# Also dropped: by_session_type, by_phase_model, lenses, and price_model.note.
assert_eq "doc omits by_session_type" "false" "$(jq -c '.doc | has("by_session_type")' <<<"$OUT")"
assert_eq "doc omits lenses" "false" "$(jq -c '.doc | has("lenses")' <<<"$OUT")"
assert_eq "priceModel omits note" "false" "$(jq -c '.doc.priceModel | has("note")' <<<"$OUT")"

# --- Case 4: curated values match input -------------------------------------
assert_eq "window meta projected" \
  '{"days":7,"since":"2026-06-03 12:00:00","until":"2026-06-10 12:00:00","files_scanned":42,"files_failed":1}' \
  "$(jq -c '.doc.window' <<<"$OUT")"
assert_eq "totals projected" \
  '{"input":100,"cache_creation":200,"cache_read":300,"output":400,"sessions":5,"turns":50,"price_proxy_usd":1.23}' \
  "$(jq -c '.doc.totals' <<<"$OUT")"
assert_eq "byPhase projected" \
  '{"review-fix":{"input":10,"cache_creation":20,"cache_read":30,"output":40,"turns":5,"price_proxy_usd":0.5}}' \
  "$(jq -c '.doc.byPhase' <<<"$OUT")"
assert_eq "byModel projected" \
  '{"opus":{"input":11,"cache_creation":21,"cache_read":31,"output":41,"turns":6,"price_proxy_usd":0.6}}' \
  "$(jq -c '.doc.byModel' <<<"$OUT")"
assert_eq "priceModel projected (4 rates only)" \
  '{"input_per_mtok":15,"cache_creation_per_mtok":18.75,"cache_read_per_mtok":1.5,"output_per_mtok":75}' \
  "$(jq -c '.doc.priceModel' <<<"$OUT")"

# --- Case 5: usage-samples-convention fields --------------------------------
assert_eq "windowDays" "7" "$(jq -r '.doc.windowDays' <<<"$OUT")"
assert_eq "groupId" "grp-1" "$(jq -r '.doc.groupId' <<<"$OUT")"
assert_eq "memberEmails" '["a@b.com","c@d.com"]' "$(jq -c '.doc.memberEmails' <<<"$OUT")"
assert_eq "computedAt epoch == NOW" "$AA_NOW" \
  "$(date -u -d "$(jq -r '.doc.computedAt' <<<"$OUT")" +%s)"
assert_eq "expireAt epoch == NOW + TTL*86400" "$AA_EXPIRE" \
  "$(date -u -d "$(jq -r '.doc.expireAt' <<<"$OUT")" +%s)"

# --- Case 6: deterministic doc id uses window.until date, not NOW -----------
ID=$(jq -r '.id' <<<"$OUT")
# window.until is 2026-06-10; NOW (1780600000) is 2026-06-04 → id must say 06-10.
assert_eq "doc id = group-untilDate-Nd" "grp-1-2026-06-10-7d" "$ID"
assert_eq "doc id uses window.until date not NOW" "1" \
  "$([[ "$ID" == *"2026-06-10"* && "$ID" != *"2026-06-04"* ]] && echo 1 || echo 0)"

# --- Case 7: idempotency — id STABLE across two runs of the same payload ----
if OUT2=$(run_writer 2>/dev/null); then :; fi
ID2=$(jq -r '.id' <<<"$OUT2")
assert_eq "doc id stable across two runs" "$ID" "$ID2"

# --- Case 8: NOW does not affect the doc id (re-run with a different NOW) ----
# Re-run with NOW on yet another day; the id must NOT change (pure fn of payload).
OUT3=$(printf '%s' "$PAYLOAD" | DISPATCH_AUDIT_AGGREGATES_NOW=1790000000 node "$WRITER_MJS" --dry-run 2>/dev/null)
ID3=$(jq -r '.id' <<<"$OUT3")
assert_eq "doc id unchanged when NOW changes" "$ID" "$ID3"

# --- Summary ----------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
