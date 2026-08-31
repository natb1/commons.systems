#!/usr/bin/env bash
# test-topic-usage-writer.sh — dependency-free dry-run unit test for
# topic-usage-writer.mjs (daily local producer for the office-hours topic-usage
# collection; #2505).
#
# Runs the producer ONLY in --dry-run, so firebase-admin and
# @google-cloud/secret-manager are NEVER imported and no network/credentials are
# touched. Each case builds a FIXTURE projects tree (DISPATCH_AUDIT_PROJECTS_ROOT)
# whose project dir name begins with the pinned DISPATCH_AUDIT_PROJECT_PREFIX,
# a pinned DISPATCH_TOPIC_USAGE_NOW, a temp state dir, and dummy member emails
# — so the producer drives the real aggregate-usage.sh subprocess
# hermetically (no session carries an issue stamp, so no `gh` call) and the suite
# is fully deterministic.
#
# Usage: bash test-topic-usage-writer.sh
# Exit 0 = all passed; non-zero = one or more failures.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRITER_MJS="$SCRIPT_DIR/topic-usage-writer.mjs"
AGG="$SCRIPT_DIR/aggregate-usage.sh"

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

# Common config for the valid cases. GROUP_ID + a dummy member-email override.
export DISPATCH_TOPIC_USAGE_GROUP_ID="grp-1"
export DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE="a@b.com,c@d.com"
export DISPATCH_TOPIC_USAGE_AGGREGATE_SCRIPT="$AGG"

# Hermetic defaults so the fail-closed (assert_fail) cases — which do NOT set
# their own per-subshell overrides — never walk the real $HOME/.claude/projects
# or $HOME/.local/state. The valid cases export their own roots inside ( … )
# subshells, so these globals only cover the fail cases. Without this, a
# malformed real sidecar (#2504 actively writes them on the fleet) would make the
# SECRET_OVERRIDE case fail with the wrong diagnostic.
GLOBAL_ROOT=$(mktemp -d)
GLOBAL_STATE=$(mktemp -d)
export DISPATCH_AUDIT_PROJECTS_ROOT="$GLOBAL_ROOT"
export DISPATCH_TOPIC_USAGE_STATE_DIR="$GLOBAL_STATE"
# aggregate-usage.sh selects project dirs by name prefix, deriving the
# default from this repo's main root. Pin it to the fixture prefix so the
# harness never shells out to git, and so every "-home-x…" fixture dir below
# is in scope. Exported once at top level: the per-case subshells override
# only DISPATCH_AUDIT_PROJECTS_ROOT, and inherit this.
export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
trap 'rm -rf "$GLOBAL_ROOT" "$GLOBAL_STATE"' EXIT

# ---------------------------------------------------------------------------
# Fixture helpers.  Transcripts (and their sidecars) live under a project dir
# whose name begins with DISPATCH_AUDIT_PROJECT_PREFIX so aggregate-usage.sh
# scans them.
# touch uses an explicit UTC instant (Z) so the mtime lands inside the UTC --day
# window regardless of the harness timezone.
# ---------------------------------------------------------------------------

# write_transcript <path> <input> <cc> <cr> <out>
# A minimal non-file-issue session: a first user line + one assistant line with
# the given usage. No dispatch-stamp -> artifact null -> "other"/"none" buckets,
# no gh call.
write_transcript() {
  local f="$1" in="$2" cc="$3" cr="$4" out="$5"
  printf '%s\n' '{"type":"user","message":{"content":"hi"}}' > "$f"
  printf '{"type":"assistant","gitBranch":"x","message":{"model":"claude-opus-4-8","usage":{"input_tokens":%s,"cache_creation_input_tokens":%s,"cache_read_input_tokens":%s,"output_tokens":%s}}}\n' \
    "$in" "$cc" "$cr" "$out" >> "$f"
  jq . "$f" >/dev/null
}

# write_sidecar <path> <topics-json> <type> <in> <cc> <cr> <out> <measured_at>
write_sidecar() {
  local f="$1" topics="$2" type="$3" in="$4" cc="$5" cr="$6" out="$7" at="$8"
  jq -nc --argjson topics "$topics" --arg type "$type" \
    --argjson in "$in" --argjson cc "$cc" --argjson cr "$cr" --argjson out "$out" \
    --arg at "$at" \
    '{schema:"file-issue.attribution.v1",session_id:"sid",topics:$topics,type:$type,
      tokens:{input:$in,cache_creation:$cc,cache_read:$cr,output:$out},measured_at:$at}' \
    > "$f"
}

# price-proxy of a token bucket using price-model.json rates (single source of
# truth). Mirrors aggregate-usage.sh price(u) and the producer's priceProxy().
PM="$SCRIPT_DIR/price-model.json"
price_proxy() {
  local in="$1" cc="$2" cr="$3" out="$4"
  jq -n --slurpfile pm "$PM" --argjson in "$in" --argjson cc "$cc" --argjson cr "$cr" --argjson out "$out" \
    '($pm[0]) as $r | ($in*$r.input + $cc*$r.cacheCreation + $cr*$r.cacheRead + $out*$r.output)/1e6'
}

# =========================================================================
# Cases 1-5 + count-once: single-day run (sentinel == today -> today only).
# =========================================================================
R1=$(mktemp -d)
S1=$(mktemp -d)        # state dir; pre-seed a sentinel so the run is single-day.
printf '2026-06-10\n' > "$S1/topic-usage-grp-1.last-day"

DAY="2026-06-10"
NOW=$(date -u -d "$DAY 12:00:00" +%s)

WT="$R1/-home-x-worktrees-2505-fixture"
mkdir -p "$WT"
# Non-file-issue session (other/none), distinct usage so "other" is non-zero.
write_transcript "$WT/sess-plain.jsonl" 10 0 0 0
# File-issue session: transcript + sidecar (topics dispatch, type bug). The
# transcript is EXCLUDED by --exclude-sidecar-sessions; only its priced sidecar
# is folded back, into dispatch / bug.
write_transcript "$WT/sess-fileissue.jsonl" 999999 999999 999999 999999
write_sidecar "$WT/sess-fileissue.file-issue-attribution.json" \
  '["dispatch"]' "bug" 1000 2000 4000 500 "${DAY}T09:00:00Z"
touch -d "${DAY}T12:00:00Z" "$WT/sess-plain.jsonl" "$WT/sess-fileissue.jsonl"

OUT1=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R1"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S1"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW"
  node "$WRITER_MJS" --dry-run 2>/dev/null
)
RC1=$?

# Case 1: valid run -> exit 0, stdout is a JSON array of {id, doc}.
assert_eq "valid run -> exit 0" "0" "$RC1"
assert_eq "stdout is a JSON array" "array" "$(jq -r 'type' <<<"$OUT1")"
assert_eq "one element (single-day normal run)" "1" "$(jq 'length' <<<"$OUT1")"
assert_eq "element[0] has id + doc" "1" \
  "$(jq -e '.[0] | has("id") and has("doc")' <<<"$OUT1" >/dev/null 2>&1 && echo 1 || echo 0)"

# Case 2: docId = ${groupId}-${day} (no -Nd suffix); doc.date == day.
assert_eq "docId = group-day (no -Nd suffix)" "grp-1-2026-06-10" "$(jq -r '.[0].id' <<<"$OUT1")"
assert_eq "doc.date == day" "2026-06-10" "$(jq -r '.[0].doc.date' <<<"$OUT1")"

# Case 3: camelCase projection — a topic bucket has EXACTLY the curated keys
# (keys-equality proves no extra/snake keys); byType has bug/enhancement/none;
# doc has no expireAt / TTL field.
assert_eq "topic bucket keys exactly the curated subset" \
  '["cacheCreation","cacheRead","input","output","priceProxyUsd"]' \
  "$(jq -c '.[0].doc.byTopic.dispatch | keys' <<<"$OUT1")"
assert_eq "byTopic has all 9 topic buckets" \
  '["audio","budget","dispatch","fellspiral","landing","other","print","security","testing infrastructure"]' \
  "$(jq -c '.[0].doc.byTopic | keys' <<<"$OUT1")"
assert_eq "byType keys == bug/enhancement/none" \
  '["bug","enhancement","none"]' \
  "$(jq -c '.[0].doc.byType | keys' <<<"$OUT1")"
assert_eq "doc has NO expireAt field" "false" "$(jq -c '.[0].doc | has("expireAt")' <<<"$OUT1")"
assert_eq "computedAt epoch == NOW" "$NOW" \
  "$(date -u -d "$(jq -r '.[0].doc.computedAt' <<<"$OUT1")" +%s)"
assert_eq "memberEmails projected from override" '["a@b.com","c@d.com"]' \
  "$(jq -c '.[0].doc.memberEmails' <<<"$OUT1")"
assert_eq "groupId" "grp-1" "$(jq -r '.[0].doc.groupId' <<<"$OUT1")"

# Case 5: THE COUNT-ONCE / double-count assertion.
# The file-issue session's tokens are ABSENT from the scan (excluded), so
# byTopic.dispatch comes ONLY from the priced sidecar fold (the plain session
# resolves to "other", never dispatch). Expected dispatch price = the sidecar's
# own priced tokens, NOT double.
SIDECAR_PRICE=$(price_proxy 1000 2000 4000 500)
assert_eq "count-once: byTopic.dispatch.priceProxyUsd == sidecar price (not double)" \
  "$SIDECAR_PRICE" "$(jq '.[0].doc.byTopic.dispatch.priceProxyUsd' <<<"$OUT1")"
assert_eq "count-once: byTopic.dispatch.input == sidecar input" "1000" \
  "$(jq '.[0].doc.byTopic.dispatch.input' <<<"$OUT1")"
assert_eq "count-once: byType.bug.priceProxyUsd == sidecar price" \
  "$SIDECAR_PRICE" "$(jq '.[0].doc.byType.bug.priceProxyUsd' <<<"$OUT1")"
assert_eq "count-once: byType.bug.input == sidecar input" "1000" \
  "$(jq '.[0].doc.byType.bug.input' <<<"$OUT1")"
# Negative half: the excluded transcript's huge usage NEVER appears in dispatch.
# (999999 would blow up priceProxyUsd if the scan had counted it.)
assert_eq "count-once: dispatch input is exactly the sidecar's (excluded scan = 0)" "1000" \
  "$(jq '.[0].doc.byTopic.dispatch.input' <<<"$OUT1")"
# The plain session (input=10) landed in "other" via the scan — proves the scan
# ran and attributed the non-file-issue session, distinct from the fold.
assert_eq "scan attributed plain session to other (input=10)" "10" \
  "$(jq '.[0].doc.byTopic.other.input' <<<"$OUT1")"
assert_eq "byType.none.input from scan (plain session)" "10" \
  "$(jq '.[0].doc.byType.none.input' <<<"$OUT1")"

# Case 4: idempotent docId — two dry-runs of the same fixture+NOW produce the
# same id (and identical docs).
OUT1B=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R1"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S1"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW"
  node "$WRITER_MJS" --dry-run 2>/dev/null
)
assert_eq "idempotent docId across two runs" \
  "$(jq -r '.[0].id' <<<"$OUT1")" "$(jq -r '.[0].id' <<<"$OUT1B")"
assert_eq "idempotent doc across two runs" \
  "$(jq -S '.[0].doc' <<<"$OUT1")" "$(jq -S '.[0].doc' <<<"$OUT1B")"

# Dry-run is side-effect-free: the sentinel content is untouched (still the
# pre-seeded value), and no extra state files were created.
assert_eq "dry-run leaves sentinel untouched" "2026-06-10" "$(cat "$S1/topic-usage-grp-1.last-day")"

rm -rf "$R1" "$S1"

# =========================================================================
# 2-topic sidecar: full cost folds into BOTH topics (total-to-all-labels).
# Single-day normal run; the sidecar is the only contributor.
# =========================================================================
R3=$(mktemp -d)
S3=$(mktemp -d)
printf '2026-06-11\n' > "$S3/topic-usage-grp-1.last-day"
DAY3="2026-06-11"
NOW3=$(date -u -d "$DAY3 12:00:00" +%s)
WT3="$R3/-home-x-worktrees-2topic"
mkdir -p "$WT3"
write_transcript "$WT3/sess-2t.jsonl" 555555 0 0 0
write_sidecar "$WT3/sess-2t.file-issue-attribution.json" \
  '["dispatch","security"]' "enhancement" 100 200 300 400 "${DAY3}T08:00:00Z"
touch -d "${DAY3}T12:00:00Z" "$WT3/sess-2t.jsonl"

OUT3=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R3"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S3"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW3"
  node "$WRITER_MJS" --dry-run 2>/dev/null
)
PRICE_2T=$(price_proxy 100 200 300 400)
assert_eq "2-topic: dispatch gets FULL cost" "$PRICE_2T" \
  "$(jq '.[0].doc.byTopic.dispatch.priceProxyUsd' <<<"$OUT3")"
assert_eq "2-topic: security gets FULL cost (total-to-all-labels)" "$PRICE_2T" \
  "$(jq '.[0].doc.byTopic.security.priceProxyUsd' <<<"$OUT3")"
assert_eq "2-topic: dispatch input full" "100" "$(jq '.[0].doc.byTopic.dispatch.input' <<<"$OUT3")"
assert_eq "2-topic: security input full" "100" "$(jq '.[0].doc.byTopic.security.input' <<<"$OUT3")"
assert_eq "2-topic: byType.enhancement gets full cost" "$PRICE_2T" \
  "$(jq '.[0].doc.byType.enhancement.priceProxyUsd' <<<"$OUT3")"
rm -rf "$R3" "$S3"

# =========================================================================
# Case 6: first-run backfill (sentinel ABSENT) over fixtures spanning >=2 days.
# =========================================================================
R2=$(mktemp -d)
S2=$(mktemp -d)        # empty state dir -> no sentinel -> backfill.
NOW2=$(date -u -d "2026-06-20 12:00:00" +%s)
WT2="$R2/-home-x-worktrees-backfill"
mkdir -p "$WT2"
write_transcript "$WT2/sess-d1.jsonl" 5 0 0 0
write_transcript "$WT2/sess-d2.jsonl" 7 0 0 0
touch -d "2026-06-15T12:00:00Z" "$WT2/sess-d1.jsonl"
touch -d "2026-06-18T12:00:00Z" "$WT2/sess-d2.jsonl"

ERR2=$(mktemp)
OUT2=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R2"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S2"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW2"
  node "$WRITER_MJS" --dry-run 2>"$ERR2"
)
assert_eq "backfill: one element per available day (2 days)" "2" "$(jq 'length' <<<"$OUT2")"
assert_eq "backfill: days are the transcript mtime days, ascending" \
  '["2026-06-15","2026-06-18"]' "$(jq -c '[.[].doc.date]' <<<"$OUT2")"
assert_eq "backfill: docIds match the days" \
  '["grp-1-2026-06-15","grp-1-2026-06-18"]' "$(jq -c '[.[].id]' <<<"$OUT2")"
assert_eq "backfill: a log line names the covered range" "1" \
  "$(grep -cF 'covering 2 day(s) 2026-06-15..2026-06-18' "$ERR2" >/dev/null && echo 1 || echo 0)"

# Case 6b: backfill cap drops older days and LOGS the drop (no silent truncate).
ERR2B=$(mktemp)
OUT2B=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R2"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S2"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW2"
  export DISPATCH_TOPIC_USAGE_BACKFILL_CAP="1"
  node "$WRITER_MJS" --dry-run 2>"$ERR2B"
)
assert_eq "backfill cap=1: only the most-recent day kept" \
  '["2026-06-18"]' "$(jq -c '[.[].doc.date]' <<<"$OUT2B")"
assert_eq "backfill cap=1: dropped day is logged (no silent truncate)" "1" \
  "$(grep -cF 'dropped 1 older day(s): 2026-06-15' "$ERR2B" >/dev/null && echo 1 || echo 0)"
rm -rf "$R2" "$S2" "$ERR2" "$ERR2B"

# =========================================================================
# Case 8: normal daily run — sentinel last-day == yesterday -> finalize
# yesterday (its doc was written ON yesterday, a partial-day snapshot) and
# produce today's provisional doc: [yesterday, today].
# =========================================================================
R8=$(mktemp -d)
S8=$(mktemp -d)
printf '2026-06-19\n' > "$S8/topic-usage-grp-1.last-day"   # yesterday
DAY8="2026-06-20"
NOW8=$(date -u -d "$DAY8 12:00:00" +%s)
WT8="$R8/-home-x-worktrees-daily"
mkdir -p "$WT8"
write_transcript "$WT8/sess.jsonl" 12 0 0 0
touch -d "${DAY8}T12:00:00Z" "$WT8/sess.jsonl"
OUT8=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R8"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S8"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW8"
  node "$WRITER_MJS" --dry-run 2>/dev/null
)
assert_eq "daily (last-day == yesterday): finalize yesterday + today (2 elements)" "2" \
  "$(jq 'length' <<<"$OUT8")"
assert_eq "daily (last-day == yesterday): days are [yesterday, today]" \
  '["2026-06-19","2026-06-20"]' "$(jq -c '[.[].doc.date]' <<<"$OUT8")"
assert_eq "daily: today's doc carries today's activity" "12" \
  "$(jq '.[] | select(.doc.date=="2026-06-20") | .doc.byTopic.other.input' <<<"$OUT8")"
rm -rf "$R8" "$S8"

# =========================================================================
# Case 8b: day-completeness across UTC midnight (the daily undercount fix).
# Emulates two consecutive first-ticks-after-midnight:
#   run 1 (00:45 on day D): only the early transcript exists -> day-D doc is
#     a PARTIAL snapshot (this was the OLD behavior's permanent doc).
#   run 2 (00:10 on day D+1, sentinel now D): the late transcript (23:30 on
#     day D) exists -> day-D doc is re-produced and now reflects the FULL day.
# =========================================================================
R8B=$(mktemp -d)
S8B=$(mktemp -d)
WT8B="$R8B/-home-x-worktrees-midnight"
mkdir -p "$WT8B"
DAYD="2026-06-20"

# Run 1: first tick after day-D midnight; only the early session exists.
printf '2026-06-19\n' > "$S8B/topic-usage-grp-1.last-day"
write_transcript "$WT8B/sess-early.jsonl" 11 0 0 0
touch -d "${DAYD}T00:30:00Z" "$WT8B/sess-early.jsonl"
NOW8B1=$(date -u -d "$DAYD 00:45:00" +%s)
OUT8B1=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R8B"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S8B"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW8B1"
  node "$WRITER_MJS" --dry-run 2>/dev/null
)
assert_eq "midnight run 1: day-D doc is a partial snapshot (early only)" "11" \
  "$(jq --arg d "$DAYD" '.[] | select(.doc.date==$d) | .doc.byTopic.other.input' <<<"$OUT8B1")"

# Run 2: the rest of day D happened; first tick after day D+1 midnight.
# Real mode would have written the sentinel = D after run 1.
write_transcript "$WT8B/sess-late.jsonl" 22 0 0 0
touch -d "${DAYD}T23:30:00Z" "$WT8B/sess-late.jsonl"
printf '%s\n' "$DAYD" > "$S8B/topic-usage-grp-1.last-day"
NOW8B2=$(date -u -d "2026-06-21 00:10:00" +%s)
OUT8B2=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R8B"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S8B"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW8B2"
  node "$WRITER_MJS" --dry-run 2>/dev/null
)
assert_eq "midnight run 2: re-produces day D and today's provisional" \
  '["2026-06-20","2026-06-21"]' "$(jq -c '[.[].doc.date]' <<<"$OUT8B2")"
assert_eq "midnight run 2: day-D doc reflects the FULL day (11+22)" "33" \
  "$(jq --arg d "$DAYD" '.[] | select(.doc.date==$d) | .doc.byTopic.other.input' <<<"$OUT8B2")"
assert_eq "midnight run 2: day-D docId unchanged (idempotent overwrite)" "grp-1-${DAYD}" \
  "$(jq -r --arg d "$DAYD" '.[] | select(.doc.date==$d) | .id' <<<"$OUT8B2")"
rm -rf "$R8B" "$S8B"

# =========================================================================
# Case 9: N-day offline recovery — sentinel last-day > one day ago backfills
# lastDay (re-finalized: its doc was a partial-day write) plus the missed
# days lastDay+1..today. last-day is 3 days behind today, so the producer
# was offline for the intervening days.
# =========================================================================
R9=$(mktemp -d)
S9=$(mktemp -d)
printf '2026-06-17\n' > "$S9/topic-usage-grp-1.last-day"   # 3 days behind 06-20
DAY9="2026-06-20"
NOW9=$(date -u -d "$DAY9 12:00:00" +%s)
WT9="$R9/-home-x-worktrees-gap"
mkdir -p "$WT9"
# Activity on one of the missed days proves a real doc is produced for it.
write_transcript "$WT9/sess-18.jsonl" 33 0 0 0
touch -d "2026-06-18T12:00:00Z" "$WT9/sess-18.jsonl"
ERR9=$(mktemp)
OUT9=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R9"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S9"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW9"
  node "$WRITER_MJS" --dry-run 2>"$ERR9"
)
assert_eq "gap recovery: lastDay re-finalized + one element per missed day" "4" "$(jq 'length' <<<"$OUT9")"
assert_eq "gap recovery: days are lastDay..today, ascending" \
  '["2026-06-17","2026-06-18","2026-06-19","2026-06-20"]' "$(jq -c '[.[].doc.date]' <<<"$OUT9")"
assert_eq "gap recovery: docIds match the days" \
  '["grp-1-2026-06-17","grp-1-2026-06-18","grp-1-2026-06-19","grp-1-2026-06-20"]' "$(jq -c '[.[].id]' <<<"$OUT9")"
assert_eq "gap recovery: a log line names the gap" "1" \
  "$(grep -cF 'gap recovery: sentinel last-day 2026-06-17 is 3 day(s) behind today 2026-06-20' "$ERR9" >/dev/null && echo 1 || echo 0)"
assert_eq "gap recovery: covered-range log line" "1" \
  "$(grep -cF 'covering 4 day(s) 2026-06-17..2026-06-20' "$ERR9" >/dev/null && echo 1 || echo 0)"
# The missed day with activity carries that activity (input=33 -> other/none).
assert_eq "gap recovery: 2026-06-18 doc carries its day's activity (other input=33)" "33" \
  "$(jq '.[] | select(.doc.date=="2026-06-18") | .doc.byTopic.other.input' <<<"$OUT9")"
# Dry-run is side-effect-free: sentinel still the pre-seeded last-day.
assert_eq "gap recovery: dry-run leaves sentinel untouched" "2026-06-17" \
  "$(cat "$S9/topic-usage-grp-1.last-day")"
rm -rf "$R9" "$S9" "$ERR9"

# =========================================================================
# Case 10: gap recovery respects the backfill cap — when the missed range
# exceeds the cap, only the most-recent N are kept and the drop is logged
# (acceptance criterion 3; consistent with first-run cap behavior).
# =========================================================================
R10=$(mktemp -d)
S10=$(mktemp -d)
printf '2026-06-10\n' > "$S10/topic-usage-grp-1.last-day"  # lastDay + missed 06-11..06-20 = 11 days
DAY10="2026-06-20"
NOW10=$(date -u -d "$DAY10 12:00:00" +%s)
WT10="$R10/-home-x-worktrees-gapcap"
mkdir -p "$WT10"
write_transcript "$WT10/sess.jsonl" 5 0 0 0
touch -d "${DAY10}T12:00:00Z" "$WT10/sess.jsonl"
ERR10=$(mktemp)
OUT10=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R10"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S10"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW10"
  export DISPATCH_TOPIC_USAGE_BACKFILL_CAP="3"
  node "$WRITER_MJS" --dry-run 2>"$ERR10"
)
assert_eq "gap cap=3: only the 3 most-recent days kept" \
  '["2026-06-18","2026-06-19","2026-06-20"]' "$(jq -c '[.[].doc.date]' <<<"$OUT10")"
assert_eq "gap cap=3: dropped older days are logged (no silent truncate)" "1" \
  "$(grep -cF 'cap 3 dropped 8 older day(s): 2026-06-10,2026-06-11,2026-06-12,2026-06-13,2026-06-14,2026-06-15,2026-06-16,2026-06-17' "$ERR10" >/dev/null && echo 1 || echo 0)"
rm -rf "$R10" "$S10" "$ERR10"

# =========================================================================
# Case 11: corrupt sentinel — an unparseable last-day is treated as a first
# run (backfill of transcript days), logging a warning, rather than crashing
# the daily producer or silently producing nothing.
# =========================================================================
R11=$(mktemp -d)
S11=$(mktemp -d)
printf 'not-a-date\n' > "$S11/topic-usage-grp-1.last-day"
NOW11=$(date -u -d "2026-06-20 12:00:00" +%s)
WT11="$R11/-home-x-worktrees-corrupt"
mkdir -p "$WT11"
write_transcript "$WT11/sess-d1.jsonl" 5 0 0 0
write_transcript "$WT11/sess-d2.jsonl" 7 0 0 0
touch -d "2026-06-15T12:00:00Z" "$WT11/sess-d1.jsonl"
touch -d "2026-06-18T12:00:00Z" "$WT11/sess-d2.jsonl"
ERR11=$(mktemp)
OUT11=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$R11"
  export DISPATCH_TOPIC_USAGE_STATE_DIR="$S11"
  export DISPATCH_TOPIC_USAGE_NOW="$NOW11"
  node "$WRITER_MJS" --dry-run 2>"$ERR11"
)
RC11=$?
assert_eq "corrupt sentinel: exit 0 (does not crash the producer)" "0" "$RC11"
assert_eq "corrupt sentinel: falls through to first-run backfill (transcript days)" \
  '["2026-06-15","2026-06-18"]' "$(jq -c '[.[].doc.date]' <<<"$OUT11")"
assert_eq "corrupt sentinel: a warning names the invalid last-day" "1" \
  "$(grep -cF 'sentinel last-day "not-a-date" is not a valid YYYY-MM-DD' "$ERR11" >/dev/null && echo 1 || echo 0)"
rm -rf "$R11" "$S11" "$ERR11"

# =========================================================================
# Case 7: fail-closed branches. Each must exit non-zero with a matching
# one-line stderr diagnostic prefixed "topic-usage-writer:".
# =========================================================================
assert_fail() {
  local name="$1" expected_diag="$2"; shift 2
  local err rc
  err=$("$@" 2>&1 >/dev/null) && rc=0 || rc=$?
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

# (a) unset GROUP_ID -> required-and-non-empty error.
assert_fail "unset GROUP_ID -> fail-closed" \
  "topic-usage-writer: DISPATCH_TOPIC_USAGE_GROUP_ID is required and must be non-empty" \
  env -u DISPATCH_TOPIC_USAGE_GROUP_ID node "$WRITER_MJS" --dry-run

# (b) --dry-run without SECRET_OVERRIDE -> the dry-run-only guard.
assert_fail "dry-run without SECRET_OVERRIDE -> fail-closed" \
  "topic-usage-writer: --dry-run requires DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE" \
  env -u DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE node "$WRITER_MJS" --dry-run

# (c) bad NAMESPACE -> regex error.
assert_fail "bad NAMESPACE -> fail-closed" \
  'topic-usage-writer: DISPATCH_TOPIC_USAGE_NAMESPACE "not-office-hours/prod" is not a valid office-hours/<env> path' \
  env DISPATCH_TOPIC_USAGE_NAMESPACE=not-office-hours/prod node "$WRITER_MJS" --dry-run

# --- Summary ----------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
