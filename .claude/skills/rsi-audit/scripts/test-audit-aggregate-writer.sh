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
  "window": {"days": 7, "since": "2026-06-03 12:00:00", "until": "2026-06-10 12:00:00", "files_scanned": 42, "files_failed": 1, "sidecar_eligible": 3, "sidecar_present": 2, "sidecar_present_rate": 0.6666666666666666},
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
  '{"days":7,"since":"2026-06-03 12:00:00","until":"2026-06-10 12:00:00","files_scanned":42,"files_failed":1,"sidecar_eligible":3,"sidecar_present":2}' \
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

# --- Case 8b: routing_recommendations (advisory projection) -----------------
# The fixture PAYLOAD has NO by_phase_outcome (windows predating the outcome
# envelope lack it), so the field must be present and EMPTY — never a failure.
assert_eq "doc has routing_recommendations" "true" \
  "$(jq -c '.doc | has("routing_recommendations")' <<<"$OUT")"
assert_eq "routing_recommendations empty without by_phase_outcome" "[]" \
  "$(jq -c '.doc.routing_recommendations' <<<"$OUT")"

# With a qa entry grounded on hit_rate (fixes_applied in the numerator — the
# open qa accounting gap), the recommendation MUST be tagged untrusted.
WITH_QA_OUTCOME=$(jq -c '.by_phase_outcome = {"qa": {"sessions": 4, "findings_surfaced": 10, "fixes_applied": 1, "hit_rate": 0.1}}' <<<"$PAYLOAD")
QA_OUT=$(printf '%s' "$WITH_QA_OUTCOME" | node "$WRITER_MJS" --dry-run 2>/dev/null)
assert_eq "qa recommendation entry present" "qa" \
  "$(jq -r '.doc.routing_recommendations[0].phase' <<<"$QA_OUT")"
assert_eq "qa hit_rate recommendation is untrusted" "true" \
  "$(jq -c '.doc.routing_recommendations[0].untrusted' <<<"$QA_OUT")"
assert_eq "qa yield_metric unverified" '{"name":"hit_rate","value":0.1,"verified":false}' \
  "$(jq -c '.doc.routing_recommendations[0].yield_metric' <<<"$QA_OUT")"
assert_eq "qa current_model from static map" "sonnet" \
  "$(jq -r '.doc.routing_recommendations[0].current_model' <<<"$QA_OUT")"
assert_eq "untrusted entry recommends no model change" "null" \
  "$(jq -c '.doc.routing_recommendations[0].recommended_model' <<<"$QA_OUT")"

# A review entry on hit_rate has no known accounting gap → verified/trusted.
WITH_REVIEW_OUTCOME=$(jq -c '.by_phase_outcome = {"review": {"sessions": 3, "findings_surfaced": 10, "fixes_applied": 8, "hit_rate": 0.8}}' <<<"$PAYLOAD")
REVIEW_OUT=$(printf '%s' "$WITH_REVIEW_OUTCOME" | node "$WRITER_MJS" --dry-run 2>/dev/null)
assert_eq "review hit_rate recommendation is trusted" "false" \
  "$(jq -c '.doc.routing_recommendations[0].untrusted' <<<"$REVIEW_OUT")"

# --- Case 9: fail-closed validation branches --------------------------------
# Each branch must exit non-zero and print exactly the matching one-line stderr
# diagnostic prefixed "audit-aggregate-writer:". assert_fail captures both the
# exit code and stderr so a wrong-but-still-failing branch can't pass silently.
#
# stdin is the otherwise-valid PAYLOAD unless a case overrides it, so the only
# thing under test in each case is the single injected fault.
assert_fail() {
  local name="$1" expected_diag="$2"; shift 2
  # "$@" is the env-prefixed node invocation; run it with the valid PAYLOAD on
  # stdin, capturing stderr and the exit code.
  local err rc
  err=$(printf '%s' "$PAYLOAD" | "$@" 2>&1 >/dev/null) && rc=0 || rc=$?
  if [[ "$rc" -eq 0 ]]; then
    FAIL=$((FAIL + 1))
    printf 'FAIL %s\n      expected: non-zero exit\n      actual:   exit 0\n' "$name"
    return
  fi
  if [[ "$err" == *"$expected_diag"* ]]; then
    PASS=$((PASS + 1))
    printf 'ok   %s\n' "$name"
  else
    FAIL=$((FAIL + 1))
    printf 'FAIL %s\n      expected diag substring: %s\n      actual stderr:           %s\n' \
      "$name" "$expected_diag" "$err"
  fi
}

# (a) unset GROUP_ID → required-and-non-empty error.
assert_fail "unset GROUP_ID → fail-closed" \
  "audit-aggregate-writer: DISPATCH_AUDIT_AGGREGATES_GROUP_ID is required and must be non-empty" \
  env -u DISPATCH_AUDIT_AGGREGATES_GROUP_ID node "$WRITER_MJS" --dry-run

# (b) TTL_DAYS=20 → out-of-range [30, 730] error.
assert_fail "TTL_DAYS=20 (below range) → fail-closed" \
  "audit-aggregate-writer: DISPATCH_AUDIT_AGGREGATES_TTL_DAYS 20 is outside the allowed range [30, 730]" \
  env DISPATCH_AUDIT_AGGREGATES_TTL_DAYS=20 node "$WRITER_MJS" --dry-run

# (b') TTL_DAYS=abc → non-integer error (the other TTL branch).
assert_fail "TTL_DAYS=abc (non-integer) → fail-closed" \
  'audit-aggregate-writer: DISPATCH_AUDIT_AGGREGATES_TTL_DAYS "abc" is not an integer' \
  env DISPATCH_AUDIT_AGGREGATES_TTL_DAYS=abc node "$WRITER_MJS" --dry-run

# (c) stdin that is not JSON → parse error. Override stdin via a dedicated run.
NOT_JSON_ERR=$(printf 'not json' | node "$WRITER_MJS" --dry-run 2>&1 >/dev/null) && NOT_JSON_RC=0 || NOT_JSON_RC=$?
assert_eq "stdin not JSON → exit non-zero" "1" "$([[ "$NOT_JSON_RC" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "stdin not JSON → diagnostic" "1" \
  "$([[ "$NOT_JSON_ERR" == *'audit-aggregate-writer: stdin is not valid JSON'* ]] && echo 1 || echo 0)"

# (c') stdin missing by_phase → bucket-map object error (malformed payload field).
NO_BY_PHASE=$(jq -c 'del(.by_phase)' <<<"$PAYLOAD")
MISSING_ERR=$(printf '%s' "$NO_BY_PHASE" | node "$WRITER_MJS" --dry-run 2>&1 >/dev/null) && MISSING_RC=0 || MISSING_RC=$?
assert_eq "stdin missing by_phase → exit non-zero" "1" "$([[ "$MISSING_RC" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "stdin missing by_phase → diagnostic" "1" \
  "$([[ "$MISSING_ERR" == *'audit-aggregate-writer: payload field by_phase must be a JSON object'* ]] && echo 1 || echo 0)"

# (c'') stdin missing window.sidecar_eligible → finite-number error (fail-closed).
NO_ELIGIBLE=$(jq -c 'del(.window.sidecar_eligible)' <<<"$PAYLOAD")
NO_ELIGIBLE_ERR=$(printf '%s' "$NO_ELIGIBLE" | node "$WRITER_MJS" --dry-run 2>&1 >/dev/null) && NO_ELIGIBLE_RC=0 || NO_ELIGIBLE_RC=$?
assert_eq "stdin missing window.sidecar_eligible → exit non-zero" "1" "$([[ "$NO_ELIGIBLE_RC" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "stdin missing window.sidecar_eligible → diagnostic" "1" \
  "$([[ "$NO_ELIGIBLE_ERR" == *'audit-aggregate-writer: payload field window.sidecar_eligible must be a finite number'* ]] && echo 1 || echo 0)"

# (c''') stdin missing window.sidecar_present → finite-number error (fail-closed).
NO_PRESENT=$(jq -c 'del(.window.sidecar_present)' <<<"$PAYLOAD")
NO_PRESENT_ERR=$(printf '%s' "$NO_PRESENT" | node "$WRITER_MJS" --dry-run 2>&1 >/dev/null) && NO_PRESENT_RC=0 || NO_PRESENT_RC=$?
assert_eq "stdin missing window.sidecar_present → exit non-zero" "1" "$([[ "$NO_PRESENT_RC" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "stdin missing window.sidecar_present → diagnostic" "1" \
  "$([[ "$NO_PRESENT_ERR" == *'audit-aggregate-writer: payload field window.sidecar_present must be a finite number'* ]] && echo 1 || echo 0)"

# --- Case 11: the sidecar_eligible REDEFINITION discriminators --------------
#
# aggregate-usage.sh redefined window.sidecar_eligible from "every worker
# session" to "every STAMPABLE worker session" without renaming the key, so the
# persisted series has two different denominators under one name. A reader
# plotting sidecar_present / sidecar_eligible across the cutover sees a step up
# and reads it as coverage improving, when only the denominator shrank.
#
# The discriminators the aggregate emits alongside it must therefore reach the
# stored row, and their PRESENCE is what dates the row. So this is asserted from
# both sides:
#   - a PRE-cutover payload (the shared $PAYLOAD, which has none of them) must
#     round-trip with them genuinely ABSENT — a fabricated 0/false would claim
#     the old row measured an empty ineligible population;
#   - a POST-cutover payload must round-trip with all four PRESENT and equal to
#     what the aggregate emitted.

# Pre-cutover: absent in, absent out. `has()` distinguishes absent from null,
# which a value comparison could not.
assert_eq "pre-cutover row omits sidecar_ineligible_unstampable_branch" "false" \
  "$(jq -c '.doc.window | has("sidecar_ineligible_unstampable_branch")' <<<"$OUT")"
assert_eq "pre-cutover row omits sidecar_ineligible_branch_unknown" "false" \
  "$(jq -c '.doc.window | has("sidecar_ineligible_branch_unknown")' <<<"$OUT")"
assert_eq "pre-cutover row omits project_dirs_scanned" "false" \
  "$(jq -c '.doc.window | has("project_dirs_scanned")' <<<"$OUT")"
assert_eq "pre-cutover row omits sidecar_coverage_measurable" "false" \
  "$(jq -c '.doc.window | has("sidecar_coverage_measurable")' <<<"$OUT")"

# Post-cutover: the shape aggregate-usage.sh emits today.
POST_CUTOVER=$(jq -c '.window += {
  "sidecar_ineligible_unstampable_branch": 285,
  "sidecar_ineligible_branch_unknown": 4,
  "project_dirs_scanned": 12,
  "sidecar_coverage_measurable": true
}' <<<"$PAYLOAD")
POST_OUT=$(printf '%s' "$POST_CUTOVER" | node "$WRITER_MJS" --dry-run 2>/dev/null)
assert_eq "post-cutover window projects all four discriminators" \
  '{"days":7,"since":"2026-06-03 12:00:00","until":"2026-06-10 12:00:00","files_scanned":42,"files_failed":1,"sidecar_eligible":3,"sidecar_present":2,"sidecar_ineligible_unstampable_branch":285,"sidecar_ineligible_branch_unknown":4,"project_dirs_scanned":12,"sidecar_coverage_measurable":true}' \
  "$(jq -c '.doc.window' <<<"$POST_OUT")"

# A --node-scope row carries sidecar_coverage_measurable:false, and false must
# survive as false rather than being dropped as falsy — a dropped false reads as
# a pre-cutover row whose coverage numbers are plottable, which they are not.
NODE_SCOPE=$(jq -c '.window += {"sidecar_coverage_measurable": false}' <<<"$PAYLOAD")
NODE_OUT=$(printf '%s' "$NODE_SCOPE" | node "$WRITER_MJS" --dry-run 2>/dev/null)
assert_eq "sidecar_coverage_measurable:false survives (not dropped as falsy)" "false" \
  "$(jq -c '.doc.window.sidecar_coverage_measurable' <<<"$NODE_OUT")"
assert_eq "sidecar_coverage_measurable:false is present, not absent" "true" \
  "$(jq -c '.doc.window | has("sidecar_coverage_measurable")' <<<"$NODE_OUT")"

# Present-but-wrong-typed is a broken producer, not an old one → fail closed.
BAD_TYPE=$(jq -c '.window += {"sidecar_ineligible_branch_unknown": "seven"}' <<<"$PAYLOAD")
BAD_TYPE_ERR=$(printf '%s' "$BAD_TYPE" | node "$WRITER_MJS" --dry-run 2>&1 >/dev/null) && BAD_TYPE_RC=0 || BAD_TYPE_RC=$?
assert_eq "wrong-typed discriminator → exit non-zero" "1" "$([[ "$BAD_TYPE_RC" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "wrong-typed discriminator → diagnostic" "1" \
  "$([[ "$BAD_TYPE_ERR" == *'audit-aggregate-writer: payload field window.sidecar_ineligible_branch_unknown must be a finite number when present'* ]] && echo 1 || echo 0)"

# (d) --dry-run without SECRET_OVERRIDE → the dry-run-only guard.
assert_fail "dry-run without SECRET_OVERRIDE → fail-closed" \
  "audit-aggregate-writer: --dry-run requires DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE" \
  env -u DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE node "$WRITER_MJS" --dry-run

# --- Summary ----------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
