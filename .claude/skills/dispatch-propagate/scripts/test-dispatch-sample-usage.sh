#!/usr/bin/env bash
# Tests for dispatch-sample-usage and its writer usage-sample-writer.mjs (run
# here only in --dry-run) -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 24765-25156.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== dispatch-sample-usage / usage-sample-writer ==="

# Writer side of #1007 (epic #1005's Capacity view). Two scripts under test:
#   usage-sample-writer.mjs — firebase-admin writer; run here ONLY in --dry-run,
#     so firebase-admin is NEVER imported and no network/credentials are touched.
#     The DISPATCH_USAGE_SAMPLES_NOW seam pins sampledAt/expireAt for determinism.
#   dispatch-sample-usage — the local sampler. Its rate-limits path, busy-worker
#     count (CLAUDE_AGENTS_CMD), target-workers binary, and writer binary are all
#     replaced by seams/fakes, so the sampler tests never hit a real daemon or
#     firebase-admin either: a FAKE writer captures the assembled payload.

su_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/fix"
  # Copy everything the two scripts source/exec so default SCRIPT_DIR resolution
  # works; the sampler tests still override the writer + target via seams.
  cp "$SCRIPT_DIR/usage-sample-writer.mjs" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/dispatch-sample-usage" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/dispatch-target-workers" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/"
  chmod +x "$TMPDIR_TEST/scripts/usage-sample-writer.mjs" \
           "$TMPDIR_TEST/scripts/dispatch-sample-usage" \
           "$TMPDIR_TEST/scripts/dispatch-target-workers" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"
}
su_teardown() {
  rm -rf "$TMPDIR_TEST"; TMPDIR_TEST=""
  unset DISPATCH_USAGE_SAMPLES_ENABLED DISPATCH_USAGE_SAMPLES_GROUP_ID \
    DISPATCH_USAGE_SAMPLES_NAMESPACE DISPATCH_USAGE_SAMPLES_TTL_DAYS \
    DISPATCH_USAGE_SAMPLES_PROJECT_ID DISPATCH_USAGE_SAMPLES_NOW \
    DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD \
    DISPATCH_USAGE_SAMPLES_WRITER CLAUDE_AGENTS_CMD \
    DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE DISPATCH_USAGE_SAMPLES_SECRET_NAME
}

# Fixed epoch for writer determinism: sampledAt=1780600000, TTL 60d →
# expireAt=1780600000 + 60*86400 = 1785784000.
SU_NOW=1780600000
SU_EXPIRE=1785784000   # SU_NOW + 60*86400

WRITER() { printf '%s' "$1" | "$TMPDIR_TEST/scripts/usage-sample-writer.mjs" --dry-run; }

# Write a fake `claude` that prints a fixed JSON blob for any args (the lib calls
# `claude agents --json` with and without --cwd). $1=dest $2=json-literal.
su_write_fake_claude() {
  printf '#!/usr/bin/env bash\nprintf %%s %s\n' "'$2'" > "$1"
  chmod +x "$1"
}

# --- WRITER (--dry-run) cases ----------------------------------------------

# W1 — full valid payload + valid config (default namespace + TTL) → exit 0;
# all 9 schema fields + expireAt present; spot-checked values match input/config;
# sampledAt/expireAt epochs match NOW and NOW+TTL*86400.
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com,c@d.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
W1_PAYLOAD='{"fiveHourUsedPct":4,"weeklyUsedPct":84,"fiveHourResetsAt":1780867800,"weeklyResetsAt":1780880400,"activeWorkers":1,"targetWorkers":3}'
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W1 valid → exit 0" "0" "$rc"
assert_eq "writer W1 → has all schema fields + expireAt" "1" \
  "$(jq -e 'has("sampledAt") and has("fiveHourUsedPct") and has("weeklyUsedPct") and has("fiveHourResetsAt") and has("weeklyResetsAt") and has("activeWorkers") and has("targetWorkers") and has("groupId") and has("memberEmails") and has("expireAt")' <<<"$out" >/dev/null 2>&1 && echo 1 || echo 0)"
assert_eq "writer W1 → fiveHourUsedPct" "4" "$(jq -r '.fiveHourUsedPct' <<<"$out")"
assert_eq "writer W1 → weeklyUsedPct" "84" "$(jq -r '.weeklyUsedPct' <<<"$out")"
assert_eq "writer W1 → activeWorkers" "1" "$(jq -r '.activeWorkers' <<<"$out")"
assert_eq "writer W1 → targetWorkers" "3" "$(jq -r '.targetWorkers' <<<"$out")"
assert_eq "writer W1 → groupId" "grp-1" "$(jq -r '.groupId' <<<"$out")"
assert_eq "writer W1 → memberEmails" '["a@b.com","c@d.com"]' "$(jq -c '.memberEmails' <<<"$out")"
assert_eq "writer W1 → sampledAt epoch == NOW" "$SU_NOW" \
  "$(date -u -d "$(jq -r '.sampledAt' <<<"$out")" +%s)"
assert_eq "writer W1 → expireAt epoch == NOW + TTL*86400" "$SU_EXPIRE" \
  "$(date -u -d "$(jq -r '.expireAt' <<<"$out")" +%s)"
su_teardown

# W2 — null resets pass through as JSON null; exit 0, no crash.
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
W2_PAYLOAD='{"fiveHourUsedPct":4,"weeklyUsedPct":84,"fiveHourResetsAt":null,"weeklyResetsAt":null,"activeWorkers":0,"targetWorkers":2}'
if out=$(WRITER "$W2_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W2 null resets → exit 0" "0" "$rc"
assert_eq "writer W2 → fiveHourResetsAt null" "null" "$(jq -r '.fiveHourResetsAt' <<<"$out")"
assert_eq "writer W2 → weeklyResetsAt null" "null" "$(jq -r '.weeklyResetsAt' <<<"$out")"
su_teardown

# W3 — empty secret override → non-zero exit (fail-closed).
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE=""
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W3 empty secret override → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
su_teardown

# W4 — bad namespace (not office-hours/<env>) → non-zero exit.
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NAMESPACE="evil/prod"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W4 bad namespace → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
su_teardown

# W5 — TTL out of [30,90] → non-zero exit (above and below range).
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
export DISPATCH_USAGE_SAMPLES_TTL_DAYS="100"
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W5 TTL above range → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
export DISPATCH_USAGE_SAMPLES_TTL_DAYS="10"
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W5 TTL below range → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
su_teardown

# W5b — non-integer TTL string → non-zero exit.
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
export DISPATCH_USAGE_SAMPLES_TTL_DAYS="abc"
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W5b non-integer TTL → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
su_teardown

# W6 — missing groupId → non-zero exit.
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
if out=$(WRITER "$W1_PAYLOAD" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "writer W6 missing groupId → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
su_teardown

# W7 — DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE unset in --dry-run → non-zero
# exit; writer prints "usage-sample-writer: --dry-run requires
# DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE".
su_setup
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
# SECRET_OVERRIDE deliberately unset
if out=$(WRITER "$W1_PAYLOAD" 2>&1); then rc=0; else rc=$?; fi
assert_eq "writer W7 unset secret override in dry-run → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "writer W7 → diagnostic message contains DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE" "1" \
  "$([[ "$out" == *"DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE"* ]] && echo 1 || echo 0)"
su_teardown

# W8 — empty DISPATCH_USAGE_SAMPLES_SECRET_NAME → non-zero exit; writer prints
# "DISPATCH_USAGE_SAMPLES_SECRET_NAME must be non-empty".
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
export DISPATCH_USAGE_SAMPLES_SECRET_NAME=''
if out=$(WRITER "$W1_PAYLOAD" 2>&1); then rc=0; else rc=$?; fi
assert_eq "writer W8 empty SECRET_NAME → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "writer W8 → diagnostic mentions must be non-empty" "1" "$([[ "$out" == *"DISPATCH_USAGE_SAMPLES_SECRET_NAME must be non-empty"* ]] && echo 1 || echo 0)"
su_teardown

# W9 — slash in DISPATCH_USAGE_SAMPLES_SECRET_NAME → non-zero exit; writer prints
# "DISPATCH_USAGE_SAMPLES_SECRET_NAME must not contain a slash".
su_setup
export DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE="a@b.com"
export DISPATCH_USAGE_SAMPLES_GROUP_ID="grp-1"
export DISPATCH_USAGE_SAMPLES_NOW="$SU_NOW"
export DISPATCH_USAGE_SAMPLES_SECRET_NAME='a/b'
if out=$(WRITER "$W1_PAYLOAD" 2>&1); then rc=0; else rc=$?; fi
assert_eq "writer W9 slash SECRET_NAME → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "writer W9 → diagnostic mentions must not contain a slash" "1" "$([[ "$out" == *"DISPATCH_USAGE_SAMPLES_SECRET_NAME must not contain a slash"* ]] && echo 1 || echo 0)"
su_teardown

# --- SAMPLER cases (fakes only; no real daemon / firebase) ------------------

# S1 — opt-in OFF: DISPATCH_USAGE_SAMPLES_ENABLED unset → exit 0 (no-op); writer
# NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
# DISPATCH_USAGE_SAMPLES_ENABLED deliberately unset (opt-in switch off)
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S1 opt-in off → exit 0" "0" "$rc"
assert_eq "sampler S1 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S2 — happy path: fixture rate_limits.json + one busy worker + target 3 →
# exit 0; the captured payload exactly matches the expected assembled object.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' '{"five_hour":{"used_percentage":4,"resets_at":1780867800},"seven_day":{"used_percentage":84,"resets_at":1780880400}}' \
  > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\necho 3\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S2 happy path → exit 0" "0" "$rc"
assert_eq "sampler S2 → writer invoked" "1" "$([[ -e "$INVOKED" ]] && echo 1 || echo 0)"
got=$(jq -S . "$CAPTURE")
want=$(printf '%s' '{"fiveHourUsedPct":4,"weeklyUsedPct":84,"fiveHourResetsAt":1780867800,"weeklyResetsAt":1780880400,"activeWorkers":1,"targetWorkers":3}' | jq -S .)
assert_eq "sampler S2 → captured payload canonical" "$want" "$got"
su_teardown

# S3 — missing telemetry: rate_limits.json path does not exist → non-zero exit;
# writer NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\necho 3\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/does-not-exist.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S3 missing telemetry → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "sampler S3 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S4 — worker count UNKNOWN: fake claude prints a non-array ({}) so
# claude_agents_count_busy_workers returns 1 → non-zero exit; writer NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' '{"five_hour":{"used_percentage":4,"resets_at":1780867800},"seven_day":{"used_percentage":84,"resets_at":1780880400}}' \
  > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" '{}'
printf '#!/usr/bin/env bash\necho 3\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S4 worker count unknown → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "sampler S4 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S5 — target-workers exits non-zero → non-zero exit; writer NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' '{"five_hour":{"used_percentage":4,"resets_at":1780867800},"seven_day":{"used_percentage":84,"resets_at":1780880400}}' \
  > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\nexit 1\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S5 target-workers failure → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "sampler S5 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S6 — target-workers prints non-integer → non-zero exit; writer NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' '{"five_hour":{"used_percentage":4,"resets_at":1780867800},"seven_day":{"used_percentage":84,"resets_at":1780880400}}' \
  > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\necho not-a-number\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S6 target-workers non-integer → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "sampler S6 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S7 — invalid JSON in rate_limits.json → non-zero exit; writer NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' 'not valid json {{' > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\necho 3\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S7 invalid JSON → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "sampler S7 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S8 — missing used_percentage in rate_limits.json → non-zero exit; writer NOT invoked.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' '{"five_hour":{},"seven_day":{}}' > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\necho 3\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S8 missing used_percentage → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "sampler S8 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# S9 — writer returns non-zero → non-zero exit (fail-closed; no doc written).
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
printf '#!/usr/bin/env bash\n: > %s\nexit 1\n' "'$INVOKED'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
printf '%s\n' '{"five_hour":{"used_percentage":4,"resets_at":1780867800},"seven_day":{"used_percentage":84,"resets_at":1780880400}}' \
  > "$TMPDIR_TEST/fix/rate_limits.json"
su_write_fake_claude "$TMPDIR_TEST/fix/fake-claude" \
  '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-foo"}]'
printf '#!/usr/bin/env bash\necho 3\n' > "$TMPDIR_TEST/fix/fake-target"
chmod +x "$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_ENABLED="1"
export DISPATCH_USAGE_SAMPLES_RATE_LIMITS_PATH="$TMPDIR_TEST/fix/rate_limits.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fix/fake-claude"
export DISPATCH_USAGE_SAMPLES_TARGET_WORKERS_CMD="$TMPDIR_TEST/fix/fake-target"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S9 writer failure → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
su_teardown

# S10 — opt-in switch set to a non-"1" value ("true") → exit 0 (no-op); writer
# NOT invoked. Locks in the ==1 truthiness contract.
su_setup
INVOKED="$TMPDIR_TEST/fix/invoked"
CAPTURE="$TMPDIR_TEST/fix/payload.json"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\necho fake-id\n' "'$INVOKED'" "'$CAPTURE'" \
  > "$TMPDIR_TEST/fix/fake-writer"
chmod +x "$TMPDIR_TEST/fix/fake-writer"
export DISPATCH_USAGE_SAMPLES_ENABLED="true"
export DISPATCH_USAGE_SAMPLES_WRITER="$TMPDIR_TEST/fix/fake-writer"
if out=$("$TMPDIR_TEST/scripts/dispatch-sample-usage" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sampler S10 ENABLED=true (non-1) → exit 0" "0" "$rc"
assert_eq "sampler S10 → writer NOT invoked" "1" "$([[ ! -e "$INVOKED" ]] && echo 1 || echo 0)"
su_teardown

# <<< END MOVED <<<

report_results
