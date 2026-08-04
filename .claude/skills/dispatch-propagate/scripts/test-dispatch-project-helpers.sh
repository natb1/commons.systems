#!/usr/bin/env bash
# Tests for the three dispatch project helpers -- dispatch-project-item-add,
# dispatch-project-status-read and dispatch-project-status-write (there is no
# script literally named dispatch-project-helpers; the trio is exercised
# together against a shared gh stub, with dispatch-config-load staged alongside
# as the catalog loader they resolve). Moved verbatim from
# test-dispatch-scripts.sh (tactic-dispatch-test-monolith-split). Original
# section: 13418-13636.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch project-helper tests (item-add / status-read / status-write)
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of the loader + the three project helpers
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/stub/      gh stub fixtures (item-list / field-list / view)
#   $TMPDIR_TEST/bin/       the gh PATH stub
#
# DISPATCH_CONFIG_DIR points at the synthetic config so the loader resolves the
# catalog without a git repo. The helpers resolve each other and the loader via
# SCRIPT_DIR, so all four scripts are co-located. The gh stub's item-edit case
# mutates item-list.json so a follow-up item-list reflects the Status change.

proj_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" \
    "$TMPDIR_TEST/config"

  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-config-load sources lib.sh via its SCRIPT_DIR — so lib.sh must sit
  # alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  cp "$SCRIPT_DIR/dispatch-project-item-add" \
    "$TMPDIR_TEST/scripts/dispatch-project-item-add"
  cp "$SCRIPT_DIR/dispatch-project-status-read" \
    "$TMPDIR_TEST/scripts/dispatch-project-status-read"
  cp "$SCRIPT_DIR/dispatch-project-status-write" \
    "$TMPDIR_TEST/scripts/dispatch-project-status-write"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load" \
           "$TMPDIR_TEST/scripts/dispatch-project-item-add" \
           "$TMPDIR_TEST/scripts/dispatch-project-status-read" \
           "$TMPDIR_TEST/scripts/dispatch-project-status-write"

  # Config fixture: one project, key example-project.
  cat > "$TMPDIR_TEST/config/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "example-project",
      "owner": "example-owner",
      "number": 1,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"

  # gh stub fixtures.
  cat > "$STUB_DIR/item-list.json" <<'EOF'
{
  "items": [
    {
      "id": "PVTI_item001",
      "content": {
        "type": "Issue",
        "number": 42,
        "repository": "https://github.com/example-owner/example-repo",
        "url": "https://github.com/example-owner/example-repo/issues/42"
      },
      "status": "Todo"
    }
  ],
  "totalCount": 1
}
EOF
  cat > "$STUB_DIR/field-list.json" <<'EOF'
{
  "fields": [
    { "id": "PVTF_title", "name": "Title", "type": "ProjectV2Field" },
    {
      "id": "PVTSSF_status",
      "name": "Status",
      "type": "ProjectV2SingleSelectField",
      "options": [
        { "id": "opt_todo", "name": "Todo" },
        { "id": "opt_inprogress", "name": "In Progress" },
        { "id": "opt_done", "name": "Done" }
      ]
    }
  ],
  "totalCount": 2
}
EOF
  cat > "$STUB_DIR/project-view.json" <<'EOF'
{ "id": "PVT_project001", "number": 1, "title": "Example Project" }
EOF

  # gh PATH stub.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "project item-add "*)
    echo "$args" >> "$STUB_DIR/gh-item-add.log"
    echo '{"id":"PVTI_added001","title":"Added issue","type":"Issue"}'
    ;;
  "project item-list "*)
    cat "$STUB_DIR/item-list.json"
    ;;
  "project field-list "*)
    cat "$STUB_DIR/field-list.json"
    ;;
  "project view "*)
    cat "$STUB_DIR/project-view.json"
    ;;
  "project item-edit "*)
    echo "$args" >> "$STUB_DIR/gh-item-edit.log"
    # Parse --id, --single-select-option-id, and --date out of the args.
    item_id=""
    option_id=""
    date_val=""
    set -- $args
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --id) item_id="$2"; shift 2 ;;
        --single-select-option-id) option_id="$2"; shift 2 ;;
        --date) date_val="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    if [[ -n "$option_id" ]]; then
      # Map the option id back to its option name via field-list.json.
      option_name=$(jq -r --arg oid "$option_id" \
        '.fields[] | .options[]? | select(.id == $oid) | .name' \
        "$STUB_DIR/field-list.json")
      # Set the matching item's status key so a follow-up item-list reflects it.
      tmp=$(mktemp)
      jq --arg iid "$item_id" --arg sname "$option_name" \
        '.items |= map(if .id == $iid then .status = $sname else . end)' \
        "$STUB_DIR/item-list.json" > "$tmp"
      mv "$tmp" "$STUB_DIR/item-list.json"
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"
  PATH="$TMPDIR_TEST/bin:$PATH"
}

proj_teardown() {
  rm -rf "$TMPDIR_TEST"
  PATH="$SAVED_PATH"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_CONFIG_DIR
}

# --- Test 1: adder adds an issue and prints the item id ----------------------

echo "Test: dispatch-project-item-add adds an issue and prints the item id"
proj_setup
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-project-item-add" example-project \
  https://github.com/example-owner/example-repo/issues/99 2>/dev/null) || rc=$?
assert_eq "adder exits 0" "0" "$rc"
assert_eq "adder prints the new item id" "PVTI_added001" "$out"
proj_teardown

# --- Test 2: reader returns the item id and Status value ---------------------

echo "Test: dispatch-project-status-read returns the item id and Status"
proj_setup
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-project-status-read" example-project \
  https://github.com/example-owner/example-repo/issues/42 2>/dev/null) || rc=$?
assert_eq "reader exits 0" "0" "$rc"
item_id=$(printf '%s' "$out" | jq -r '.itemId')
assert_eq "reader returns the item id" "PVTI_item001" "$item_id"
status=$(printf '%s' "$out" | jq -r '.status')
assert_eq "reader returns the Status value" "Todo" "$status"
proj_teardown

# --- Test 3: reader fails when the issue is not on the project ---------------

echo "Test: dispatch-project-status-read fails for an issue not on the project"
proj_setup
rc=0
"$TMPDIR_TEST/scripts/dispatch-project-status-read" example-project \
  https://github.com/example-owner/example-repo/issues/777 \
  >/dev/null 2>&1 || rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: reader exits non-zero for an absent issue"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: reader exits non-zero for an absent issue"
  echo "    expected: non-zero, actual: 0"
fi
proj_teardown

# --- Test 4: writer sets Status; change is visible via the reader ------------

echo "Test: dispatch-project-status-write sets Status, visible via the reader"
proj_setup
rc=0
"$TMPDIR_TEST/scripts/dispatch-project-status-write" example-project \
  https://github.com/example-owner/example-repo/issues/42 "In Progress" \
  >/dev/null 2>&1 || rc=$?
assert_eq "writer exits 0" "0" "$rc"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-project-status-read" example-project \
  https://github.com/example-owner/example-repo/issues/42 2>/dev/null) || rc=$?
assert_eq "reader after write exits 0" "0" "$rc"
status=$(printf '%s' "$out" | jq -r '.status')
assert_eq "writer change is visible via the reader" "In Progress" "$status"
proj_teardown

# <<< END MOVED <<<

report_results
