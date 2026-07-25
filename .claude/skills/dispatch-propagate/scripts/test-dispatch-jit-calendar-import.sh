#!/usr/bin/env bash
# Tests for dispatch-jit-calendar-import -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 18632-19482.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# dispatch-jit-calendar-import tests
# ============================================================================
#
# These tests mirror the JIT-engine harness: each test gets a fresh tmp tree,
# a curl PATH stub for OAuth + Calendar API endpoints, and a gh PATH stub
# extended with issue close + body-bearing issue list. "now" is pinned via
# DISPATCH_CALENDAR_NOW; TZ is pinned to UTC so "today" boundaries are
# deterministic on any host.

# A fixed reference epoch — 2026-05-26T15:00:00Z, a Tuesday at 15:00 UTC.
# Today UTC: [2026-05-26T00:00:00Z .. 2026-05-27T00:00:00Z) = [1779753600 ..
# 1779840000). Events placed at 16:00Z / 17:00Z today and at 15:00Z tomorrow
# anchor the Rule-1 / Rule-2 / both-rules / not-fired cases.
CAL_NOW_EPOCH=1779807600

cal_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/scripts" "$STUB_DIR" "$TMPDIR_TEST/bin" \
    "$TMPDIR_TEST/config" "$TMPDIR_TEST/state"

  cp "$SCRIPT_DIR/dispatch-jit-calendar-import" \
    "$TMPDIR_TEST/scripts/dispatch-jit-calendar-import"
  cp "$SCRIPT_DIR/dispatch-config-load" \
    "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-jit-calendar-import and dispatch-config-load source lib.sh via
  # their SCRIPT_DIR — so lib.sh must sit alongside them. Sourced, not
  # executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  cp "$SCRIPT_DIR/dispatch-project-item-add" \
    "$TMPDIR_TEST/scripts/dispatch-project-item-add"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" \
           "$TMPDIR_TEST/scripts/dispatch-config-load" \
           "$TMPDIR_TEST/scripts/dispatch-project-item-add"

  # projects.json so dispatch-project-item-add resolves the project key.
  cat > "$TMPDIR_TEST/config/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 1,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  export DISPATCH_CALENDAR_STATE_DIR="$TMPDIR_TEST/state"
  export DISPATCH_CALENDAR_NOW="$CAL_NOW_EPOCH"
  export TZ=UTC
  export GOOGLE_CALENDAR_CLIENT_ID="fake-id"
  export GOOGLE_CALENDAR_CLIENT_SECRET="fake-secret"
  export GOOGLE_CALENDAR_REFRESH_TOKEN="fake-refresh"
  export CALENDAR_REPO="fixture-owner/fixture-repo"
  export CALENDAR_PROJECT_KEY="test-project"
  export CALENDAR_LABEL="jit:calendar"
  export CALENDAR_LOOKAHEAD="7d"
  export CALENDAR_DEBOUNCE="15m"

  # curl PATH stub. Switches on URL substring and serves fixture bodies.
  # Logs every invocation to curl-calls.log so tests can assert call counts
  # and verify the debounce path makes none.
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
echo "$args" >> "$STUB_DIR/curl-calls.log"

if [[ "$args" == *"oauth2.googleapis.com/token"* ]]; then
  if [[ -f "$STUB_DIR/oauth-fail.flag" ]]; then
    exit 22
  fi
  echo '{"access_token":"fake-access-token","expires_in":3599}'
  exit 0
fi

# More specific (events) must precede the bare-calendar pattern.
if [[ "$args" == *"calendar/v3/calendars/primary/events"* ]]; then
  if [[ -f "$STUB_DIR/events.json" ]]; then
    cat "$STUB_DIR/events.json"
  else
    echo '{"items":[]}'
  fi
  exit 0
fi

if [[ "$args" == *"calendar/v3/calendars/primary"* ]]; then
  if [[ -f "$STUB_DIR/calendar.json" ]]; then
    cat "$STUB_DIR/calendar.json"
  else
    echo '{"defaultReminders":[]}'
  fi
  exit 0
fi

echo "curl stub: unknown URL in args: $args" >&2
exit 1
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

  # gh PATH stub. Extends the JIT-engine stub with REST close (PATCH .../issues/<N>
  # + POST .../issues/<N>/comments, #2256) + a body-bearing issue list reading
  # open-issues.json.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
echo "$args" >> "$STUB_DIR/gh-calls.log"
case "$args" in
  "label create "*)
    ;;
  "api -X POST "*/issues/*/comments*)
    # gh_issue_close_rest --comment sub-call (#2256): POST .../issues/<N>/comments.
    # MUST precede the generic issue-list REST branch below.
    echo "$args" >> "$STUB_DIR/gh-issue-comment-rest-calls.log"
    echo '{}'
    ;;
  "api -X PATCH "*/issues/[0-9]*)
    # gh_issue_close_rest sentinel (#2256): PATCH .../issues/<N> (state=closed).
    # MUST precede the generic issue-list REST branch below.
    echo "$args" >> "$STUB_DIR/gh-issue-close-rest-calls.log"
    echo '{}'
    ;;
  "api -X POST "*/issues\ *)
    # gh_issue_create_rest sentinel (#2256): POST .../issues (new issue creation).
    # MUST precede the generic issue-list REST branch below, whose pattern would
    # otherwise swallow this POST. Echoes html_url so the script's URL→number
    # parse keeps working (matches the prior porcelain stub's URL echo).
    echo "$args" >> "$STUB_DIR/gh-issue-create-rest-calls.log"
    echo '{"number":777,"html_url":"https://github.com/fixture-owner/fixture-repo/issues/777"}'
    ;;
  *"api "*"repos/"*"/issues"*)
    # gh_issue_list_rest (#2258): the calendar import's open-issue dedup scan now
    # hits REST (gh api [--paginate] repos/<repo>/issues?state=open&...) WITH
    # --include-body, so the helper's projection carries `body`. Serve the SAME
    # open-issues.json fixture jq-remapped to REST snake_case, preserving `body`
    # so the helper remaps back to identical camelCase data.
    if [[ -f "$STUB_DIR/open-issues.json" ]]; then
      jq 'map({number, pull_request: null, created_at: (.createdAt // null), closed_at: (.closedAt // null), labels: (.labels // [])} + (if has("body") then {body} else {} end) + (if has("title") then {title} else {} end))' "$STUB_DIR/open-issues.json"
    else
      echo '[]'
    fi
    ;;
  "project item-add "*)
    echo '{"id":"PVTI_cal001","title":"Cal issue","type":"Issue"}'
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"
  PATH="$TMPDIR_TEST/bin:$PATH"

  # Default calendar metadata fixture — popup 10 minutes before, used when
  # an event sets reminders.useDefault = true. Tests that need a different
  # default override this file.
  cat > "$STUB_DIR/calendar.json" <<'EOF'
{"defaultReminders":[{"method":"popup","minutes":10}]}
EOF
}

cal_teardown() {
  rm -rf "$TMPDIR_TEST"
  PATH="$SAVED_PATH"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_CALENDAR_STATE_DIR
  unset DISPATCH_CALENDAR_NOW
  unset TZ
  unset GOOGLE_CALENDAR_CLIENT_ID
  unset GOOGLE_CALENDAR_CLIENT_SECRET
  unset GOOGLE_CALENDAR_REFRESH_TOKEN
  unset CALENDAR_REPO
  unset CALENDAR_PROJECT_KEY
  unset CALENDAR_LABEL
  unset CALENDAR_LOOKAHEAD
  unset CALENDAR_DEBOUNCE
}

# --- Test 1: no config — silent no-op ---------------------------------------

echo "Test: dispatch-jit-calendar-import with no OAuth env vars is a silent no-op"
cal_setup
unset GOOGLE_CALENDAR_REFRESH_TOKEN
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "no-config exits 0" "0" "$rc"
assert_eq "no-config prints nothing" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/curl-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-config made zero curl calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-config made zero curl calls"
  echo "    curl-calls.log: $(cat "$STUB_DIR/curl-calls.log")"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-config made zero gh calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-config made zero gh calls"
  echo "    gh-calls.log: $(cat "$STUB_DIR/gh-calls.log")"
fi
cal_teardown

# --- Test 2: debounce within window — skipped with zero network calls -------

echo "Test: dispatch-jit-calendar-import debounce within window skips with no network"
cal_setup
# Pre-seed state: last run 5 minutes ago — within the 15m default debounce.
printf '{"lastRun": %s}\n' "$((CAL_NOW_EPOCH - 300))" \
  > "$TMPDIR_TEST/state/dispatch-jit-calendar-state.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "debounce exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: debounced"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce reports debounced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce reports debounced"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/curl-calls.log" && ! -f "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce made zero curl + gh calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce made zero curl + gh calls"
  [[ -f "$STUB_DIR/curl-calls.log" ]] && echo "    curl-calls.log: $(cat "$STUB_DIR/curl-calls.log")"
  [[ -f "$STUB_DIR/gh-calls.log" ]] && echo "    gh-calls.log: $(cat "$STUB_DIR/gh-calls.log")"
fi
cal_teardown

# --- Test 3: Rule 1 — today's event files one issue --------------------------

echo "Test: dispatch-jit-calendar-import Rule 1 (today's event) files one issue"
cal_setup
# Event today: starts 16:00Z, ends 17:00Z, no overrides, useDefault=true.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-today",
      "status": "confirmed",
      "summary": "Today meeting",
      "description": "Discuss plan",
      "location": "Office",
      "htmlLink": "https://calendar.google.com/event?eid=evt-today",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "rule-1 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-today)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: rule-1 reports created #777 (evt-today)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rule-1 reports created #777 (evt-today)"
  echo "    actual: $out"
fi
# The created issue carries the marker and the configured label.
TOTAL=$((TOTAL + 1))
create_args=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || echo "")
if [[ "$create_args" == *"event=evt-today"* \
   && "$create_args" == *"start=2026-05-26T16:00:00Z"* \
   && "$create_args" == *"end=2026-05-26T17:00:00Z"* \
   && "$create_args" == *"labels[]=jit:calendar"* ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: rule-1 issue body carries marker and labels[]=jit:calendar"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: rule-1 issue body carries marker and labels[]=jit:calendar"
  echo "    gh-issue-create-rest-calls.log: $create_args"
fi
# project item-add was called.
TOTAL=$((TOTAL + 1))
gh_calls=$(cat "$STUB_DIR/gh-calls.log")
if [[ "$gh_calls" == *"project item-add"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: rule-1 invoked project item-add"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rule-1 invoked project item-add"
  echo "    gh-calls.log: $gh_calls"
fi
cal_teardown

# --- Test 4: Rule 1 — declined event is excluded -----------------------------

echo "Test: dispatch-jit-calendar-import excludes declined events"
cal_setup
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-declined",
      "status": "confirmed",
      "summary": "Declined meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "attendees": [
        {"email": "other@example.com", "responseStatus": "accepted"},
        {"email": "self@example.com", "self": true, "responseStatus": "declined"}
      ],
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "declined exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: declined event filed no issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: declined event filed no issue"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
cal_teardown

# --- Test 5: Rule 2 — passed reminder files one issue -----------------------

echo "Test: dispatch-jit-calendar-import Rule 2 (passed reminder) files one issue"
cal_setup
# Event tomorrow 15:00Z. With reminders.useDefault=false and overrides
# minutes=1500, trigger = start - 90000 = 1779804000 = NOW - 3600 < NOW.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-tomorrow",
      "status": "confirmed",
      "summary": "Tomorrow meeting",
      "start": {"dateTime": "2026-05-27T15:00:00Z"},
      "end":   {"dateTime": "2026-05-27T16:00:00Z"},
      "reminders": {
        "useDefault": false,
        "overrides": [{"method": "popup", "minutes": 1500}]
      }
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "rule-2 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-tomorrow)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: rule-2 reports created #777 (evt-tomorrow)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rule-2 reports created #777 (evt-tomorrow)"
  echo "    actual: $out"
fi
cal_teardown

# --- Test 6: Rule 2 — future reminder only files nothing --------------------

echo "Test: dispatch-jit-calendar-import skips events whose reminder is still in the future"
cal_setup
# Same tomorrow event, but the only reminder is 30 min — trigger is well in
# the future, and Rule 1 doesn't apply (start is past today's end).
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-future-reminder",
      "status": "confirmed",
      "summary": "Tomorrow meeting future reminder",
      "start": {"dateTime": "2026-05-27T15:00:00Z"},
      "end":   {"dateTime": "2026-05-27T16:00:00Z"},
      "reminders": {
        "useDefault": false,
        "overrides": [{"method": "popup", "minutes": 30}]
      }
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "future-reminder exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: future-reminder filed no issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: future-reminder filed no issue"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
cal_teardown

# --- Test 7: an event matching both rules yields exactly one issue ----------

echo "Test: dispatch-jit-calendar-import dedups an event matching both rules to one issue"
cal_setup
# Event today (Rule 1 satisfied) AND with a 120-min reminder whose trigger is
# already in the past (Rule 2 satisfied) — exactly one issue must result.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-both",
      "status": "confirmed",
      "summary": "Both-rules meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {
        "useDefault": false,
        "overrides": [{"method": "popup", "minutes": 120}]
      }
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "both-rules exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# Count create invocations, not log lines: the --body arg contains embedded
# newlines, so one create spans multiple lines in the log.
create_lines=0
[[ -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]] \
  && create_lines=$(grep -cE "^api -X POST repos/[^ ]*/issues " "$STUB_DIR/gh-issue-create-rest-calls.log")
if [[ "$create_lines" -eq 1 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: both-rules filed exactly one issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: both-rules filed exactly one issue"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>&1)"
fi
cal_teardown

# --- Test 8: open-issue guard + closed prior does NOT suppress --------------

echo "Test: dispatch-jit-calendar-import skips events whose ID has an open issue"
cal_setup
# Two events: evt-suppress already has an open issue; evt-fresh is new.
# A closed prior for evt-fresh is NOT visible to --state open, so the open
# scan returns only evt-suppress — evt-fresh must still be filed.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-suppress",
      "status": "confirmed",
      "summary": "Already-open meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    },
    {
      "id": "evt-fresh",
      "status": "confirmed",
      "summary": "Fresh meeting",
      "start": {"dateTime": "2026-05-26T18:00:00Z"},
      "end":   {"dateTime": "2026-05-26T19:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
cat > "$STUB_DIR/open-issues.json" <<'EOF'
[
  {
    "number": 42,
    "body": "Existing reminder.\n\n<!-- dispatch:calendar event=evt-suppress start=2026-05-26T16:00:00Z end=2026-05-26T17:00:00Z -->"
  }
]
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "open-guard exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
create_lines=0
[[ -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]] \
  && create_lines=$(grep -cE "^api -X POST repos/[^ ]*/issues " "$STUB_DIR/gh-issue-create-rest-calls.log")
if [[ "$create_lines" -eq 1 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard filed only evt-fresh (one create)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard filed only evt-fresh (one create)"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>&1)"
fi
TOTAL=$((TOTAL + 1))
create_args=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || echo "")
if [[ "$create_args" == *"event=evt-fresh"* && "$create_args" != *"event=evt-suppress"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard filed evt-fresh and not evt-suppress"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard filed evt-fresh and not evt-suppress"
  echo "    gh-issue-create-rest-calls.log: $create_args"
fi
cal_teardown

# --- Test 9: past-event issue is closed -------------------------------------

echo "Test: dispatch-jit-calendar-import closes past-event issues"
cal_setup
# An open issue whose recorded end is yesterday — must be closed.
cat > "$STUB_DIR/open-issues.json" <<'EOF'
[
  {
    "number": 91,
    "body": "Past reminder.\n\n<!-- dispatch:calendar event=evt-past start=2026-05-25T10:00:00Z end=2026-05-25T11:00:00Z -->"
  }
]
EOF
# No upcoming events.
echo '{"items":[]}' > "$STUB_DIR/events.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "close-past exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: closed #91 (evt-past)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-past reports closed #91 (evt-past)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-past reports closed #91 (evt-past)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
# REST close (#2256): the PATCH closes issues/91 and the --comment fires a prior
# POST .../issues/91/comments.
close_args=$(cat "$STUB_DIR/gh-issue-close-rest-calls.log" 2>/dev/null || echo "")
comment_args=$(cat "$STUB_DIR/gh-issue-comment-rest-calls.log" 2>/dev/null || echo "")
if [[ "$close_args" == *"PATCH"*"issues/91"* && "$comment_args" == *"issues/91/comments"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-past invoked REST close of issues/91 with a comment"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-past invoked REST close of issues/91 with a comment"
  echo "    gh-issue-close-rest-calls.log: $close_args"
  echo "    gh-issue-comment-rest-calls.log: $comment_args"
fi
cal_teardown

# --- Test 9b: marker forgery via event description is not trusted -----------
# An attacker who controls an event's description can embed a fake
# <!-- dispatch:calendar ... --> marker. Because the description is placed in
# the issue body BEFORE the canonical marker (appended last), parse_marker must
# take the LAST match. A first-match parse would let the fake marker spoof
# another event's identity: close the wrong issue and suppress the victim
# event's reminder. This test pins the last-match defense end to end.

echo "Test: dispatch-jit-calendar-import ignores a forged marker embedded ahead of the real one"
cal_setup
# Open issue #92: its real marker (evt-real, end in the FUTURE → must not close)
# is preceded by a forged marker claiming evt-victim with a PAST end.
cat > "$STUB_DIR/open-issues.json" <<'EOF'
[
  {
    "number": 92,
    "body": "Existing reminder.\n\n<!-- dispatch:calendar event=evt-victim start=2020-01-01T00:00:00Z end=2020-01-01T00:00:00Z -->\n\n<!-- dispatch:calendar event=evt-real start=2026-05-26T16:00:00Z end=2026-05-26T17:00:00Z -->"
  }
]
EOF
# A real today event whose ID matches the forged marker's victim claim. With the
# last-match defense, evt-victim is NOT in the open-event set, so it is filed.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-victim",
      "status": "confirmed",
      "summary": "Victim meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "forged-marker exits 0" "0" "$rc"
# Defense 1: the issue with the future real end is NOT closed (the forged past
# end must not drive a close).
TOTAL=$((TOTAL + 1))
close_args=$(cat "$STUB_DIR/gh-issue-close-rest-calls.log" 2>/dev/null || echo "")
if [[ "$close_args" != *"issues/92"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: forged past-end marker does not close issue #92"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: forged past-end marker does not close issue #92"
  echo "    gh-issue-close-rest-calls.log: $close_args"
fi
# Defense 2: the forged victim ID does not suppress the real victim event — it
# is still filed (a first-match parse would have skipped it as already-open).
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-victim)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: forged marker does not suppress the real evt-victim reminder"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: forged marker does not suppress the real evt-victim reminder"
  echo "    actual: $out"
fi
cal_teardown

# --- Test 10: env-var overrides for CALENDAR_REPO + CALENDAR_LABEL ----------

echo "Test: dispatch-jit-calendar-import honors CALENDAR_REPO and CALENDAR_LABEL overrides"
cal_setup
export CALENDAR_REPO="custom-owner/custom-repo"
export CALENDAR_LABEL="custom-label"
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-override",
      "status": "confirmed",
      "summary": "Override-check meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "overrides exits 0" "0" "$rc"
gh_calls=$(cat "$STUB_DIR/gh-calls.log")
TOTAL=$((TOTAL + 1))
# REST create (#2256): --repo lands as the repos/<owner>/<repo>/issues path
# segment; --label lands as labels[]=<name>.
if [[ "$gh_calls" == *"repos/custom-owner/custom-repo/issues"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: overrides used repos/custom-owner/custom-repo/issues"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: overrides used repos/custom-owner/custom-repo/issues"
  echo "    gh-calls.log: $gh_calls"
fi
TOTAL=$((TOTAL + 1))
if [[ "$gh_calls" == *"labels[]=custom-label"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: overrides used labels[]=custom-label"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: overrides used labels[]=custom-label"
  echo "    gh-calls.log: $gh_calls"
fi
cal_teardown

# --- Test 11: all-day event files an issue with "all-day" title -------------

echo "Test: dispatch-jit-calendar-import files all-day events with date-only start/end"
cal_setup
# All-day event today — Google Calendar uses start.date / end.date (no time)
# and end is exclusive. Tomorrow's date end makes it cover today.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-allday",
      "status": "confirmed",
      "summary": "Birthday",
      "start": {"date": "2026-05-26"},
      "end":   {"date": "2026-05-27"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "all-day exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-allday)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: all-day reports created #777 (evt-allday)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: all-day reports created #777 (evt-allday)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
create_args=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || echo "")
if [[ "$create_args" == *"event=evt-allday"* \
   && "$create_args" == *"start=2026-05-26"* \
   && "$create_args" == *"end=2026-05-27"* \
   && "$create_args" == *"(all-day)"* \
   && "$create_args" != *"(00:00)"* ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: all-day title and body carry (all-day), not (00:00)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: all-day title and body carry (all-day), not (00:00)"
  echo "    gh-issue-create-rest-calls.log: $create_args"
fi
cal_teardown

# --- Test 12: Rule 1 — late-night event in the 23:00–midnight window ---------

echo "Test: dispatch-jit-calendar-import files a today event starting after 23:00 local"
cal_setup
# Event today starting 23:30Z — inside the final hour before midnight. Its only
# reminder (default popup 10m) triggers at 23:20Z, still in the future, so Rule 2
# does not fire: the event qualifies via Rule 1 alone. This locks in the
# END_OF_TODAY_LOCAL = next-midnight boundary; a 23:00 boundary would silently
# drop it.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-late-night",
      "status": "confirmed",
      "summary": "Late night call",
      "start": {"dateTime": "2026-05-26T23:30:00Z"},
      "end":   {"dateTime": "2026-05-26T23:45:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "late-night exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-late-night)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: late-night event filed via Rule 1"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: late-night event filed via Rule 1"
  echo "    actual: $out"
fi
cal_teardown

# ---------------------------------------------------------------------------
# Tests for detect-changes.sh
# ---------------------------------------------------------------------------
#
# Integration tests that run the REAL detect-changes.sh and the REAL
# list-go-modules.sh against a stubbed `git` and a fake repo tree. The fake
# tree carries go.mod files at the three module roots so list-go-modules.sh
# performs genuine module discovery and detect-changes.sh builds its runtime
# `grep -E` alternation regex from that discovery (PR #745). Nothing here
# re-implements the detection logic.

dc_setup() {
  TEST_TMP="$(mktemp -d)"
  cp "$SCRIPT_DIR/detect-changes.sh" "$TEST_TMP/"
  cp "$SCRIPT_DIR/list-go-modules.sh" "$TEST_TMP/"
  chmod +x "$TEST_TMP/detect-changes.sh" "$TEST_TMP/list-go-modules.sh"

  # Fake repo root whose go.mod files drive genuine module discovery.
  FAKE_REPO="$TEST_TMP/repo"
  mkdir -p "$FAKE_REPO/budget-etl" \
           "$FAKE_REPO/scaffolding/firebase" \
           "$FAKE_REPO/retired-tui"
  : > "$FAKE_REPO/budget-etl/go.mod"
  : > "$FAKE_REPO/scaffolding/firebase/go.mod"
  : > "$FAKE_REPO/retired-tui/go.mod"

  # Per-test inputs/outputs.
  DC_CHANGED="$TEST_TMP/changed.txt"
  : > "$DC_CHANGED"
  GITHUB_OUTPUT="$TEST_TMP/github_output.txt"
  export GITHUB_OUTPUT
  : > "$GITHUB_OUTPUT"

  STUB_BIN="$TEST_TMP/bin"
  mkdir -p "$STUB_BIN"
  ORIG_PATH="$PATH"
  export PATH="$STUB_BIN:$PATH"

  # Stub git: diff cats the per-test changed-files list; show-toplevel echoes
  # the fake repo root (so list-go-modules.sh discovers the fake modules).
  cat > "$STUB_BIN/git" <<GITEOF
#!/usr/bin/env bash
set -euo pipefail
cmd="\$1"; shift || true
case "\$cmd" in
  diff)
    cat "$DC_CHANGED"
    ;;
  rev-parse)
    echo "$FAKE_REPO"
    ;;
  *)
    echo "unexpected git: \$cmd \$*" >&2
    exit 1
    ;;
esac
GITEOF
  chmod +x "$STUB_BIN/git"
}

dc_teardown() {
  export PATH="$ORIG_PATH"
  unset GITHUB_OUTPUT
  rm -rf "$TEST_TMP"
}

# Write a changed-files list, run detect-changes.sh, then print "true" if the
# given output key was emitted as "<key>=true", else "false".
dc_run() {
  local key="$1"; shift
  printf '%s\n' "$@" > "$DC_CHANGED"
  : > "$GITHUB_OUTPUT"
  "$TEST_TMP/detect-changes.sh" >/dev/null 2>&1
  if grep -qx "${key}=true" "$GITHUB_OUTPUT"; then
    echo "true"
  else
    echo "false"
  fi
}

# --- nix ---
dc_setup
assert_eq "detect-changes: nix=true for *.nix file"        "true"  "$(dc_run nix 'nix/foo.nix')"
assert_eq "detect-changes: nix=true for flake.nix"         "true"  "$(dc_run nix 'flake.nix')"
assert_eq "detect-changes: nix=true for flake.lock"        "true"  "$(dc_run nix 'flake.lock')"
assert_eq "detect-changes: nix absent for unrelated path"  "false" "$(dc_run nix 'README.md')"
dc_teardown

# --- playwright ---
dc_setup
assert_eq "detect-changes: playwright=true for package-lock.json"    "true"  "$(dc_run playwright 'package-lock.json')"
assert_eq "detect-changes: playwright=true for flake.lock"           "true"  "$(dc_run playwright 'flake.lock')"
assert_eq "detect-changes: playwright=true for version-sync script"  "true"  "$(dc_run playwright '.github/scripts/check-playwright-version-sync.sh')"
assert_eq "detect-changes: playwright absent for unrelated path"     "false" "$(dc_run playwright 'README.md')"
dc_teardown

# --- rules ---
dc_setup
assert_eq "detect-changes: rules=true for firestore.rules"         "true"  "$(dc_run rules 'firestore.rules')"
assert_eq "detect-changes: rules=true for storage.rules"           "true"  "$(dc_run rules 'storage.rules')"
assert_eq "detect-changes: rules=true for packages/rules-test/ path"        "true"  "$(dc_run rules 'packages/rules-test/x')"
assert_eq "detect-changes: rules=true for detect-changes.sh self"  "true"  "$(dc_run rules '.claude/skills/dispatch-propagate/scripts/detect-changes.sh')"
assert_eq "detect-changes: rules=true for firebase.json"           "true"  "$(dc_run rules 'firebase.json')"
assert_eq "detect-changes: rules=true for package.json"            "true"  "$(dc_run rules 'package.json')"
assert_eq "detect-changes: rules absent for unrelated path"        "false" "$(dc_run rules 'README.md')"
dc_teardown

# --- go (the core of #749: regex must cover every discovered module root) ---
dc_setup
assert_eq "detect-changes: go=true for budget-etl module"           "true"  "$(dc_run go 'budget-etl/main.go')"
assert_eq "detect-changes: go=true for scaffolding/firebase module" "true"  "$(dc_run go 'scaffolding/firebase/x.go')"
assert_eq "detect-changes: go=true for retired-tui module"         "true"  "$(dc_run go 'retired-tui/y.go')"
assert_eq "detect-changes: go absent for non-Go path"               "false" "$(dc_run go 'README.md')"
dc_teardown

# --- combined multi-file diff sets multiple categories ---
dc_setup
assert_eq "detect-changes: combined diff sets nix=true" "true" "$(dc_run nix 'flake.nix' 'budget-etl/main.go')"
assert_eq "detect-changes: combined diff sets go=true"  "true" "$(dc_run go  'flake.nix' 'budget-etl/main.go')"
dc_teardown

# --- empty diff sets none of the four keys ---
dc_setup
assert_eq "detect-changes: empty diff leaves nix unset"        "false" "$(dc_run nix)"
assert_eq "detect-changes: empty diff leaves playwright unset" "false" "$(dc_run playwright)"
assert_eq "detect-changes: empty diff leaves rules unset"      "false" "$(dc_run rules)"
assert_eq "detect-changes: empty diff leaves go unset"         "false" "$(dc_run go)"
dc_teardown

# <<< END MOVED <<<

report_results
