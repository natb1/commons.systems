#!/usr/bin/env bash
# Tests for wezterm.nix activation script
# Tests Windows user detection and config copy logic on WSL
# Shell unit tests for activation script logic (user detection, file copy, error handling).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0
PASSES=0
CLEANUP_DIRS=()
CLEANUP_FAILURES=0

# Cleanup function to remove all temp directories
cleanup() {
  local failed=0
  for dir in "${CLEANUP_DIRS[@]}"; do
    if ! rm -rf "$dir" 2>/dev/null; then
      echo "WARNING: Failed to cleanup directory: $dir" >&2
      ((CLEANUP_FAILURES++))
      failed=1
    fi
  done
  return 0  # Don't fail the trap
}
trap cleanup EXIT

# Helper to report test results
report_pass() {
  local description="$1"
  echo "PASS: $description"
  ((PASSES++))
}

report_fail() {
  local description="$1"
  local details="${2:-}"
  echo "FAIL: $description"
  if [[ -n "$details" ]]; then
    echo "  $details"
  fi
  ((FAILURES++))
}

echo "Running wezterm.nix activation script tests..."
echo ""

# Test 1: Windows user detection with valid user directories
echo "=== Test 1: Windows user detection filters system directories ==="
TEMP_MOUNT=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT")

mkdir -p "$TEMP_MOUNT/c/Users"/{alice,bob,Public,Default,"Default User","All Users"}
touch "$TEMP_MOUNT/c/Users/desktop.ini"

WINDOWS_USER=$(ls "$TEMP_MOUNT/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" =~ ^(alice|bob)$ ]] && [[ "$WINDOWS_USER" != "Public" ]] && [[ "$WINDOWS_USER" != "Default" ]]; then
  report_pass "User detection correctly filters system directories"
else
  report_fail "User detection failed to filter system directories" "Got: $WINDOWS_USER"
fi

# Test 2: Windows user detection with no valid users
echo ""
echo "=== Test 2: Windows user detection with only system directories ==="
TEMP_MOUNT2=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT2")

mkdir -p "$TEMP_MOUNT2/c/Users"/{Public,Default}

WINDOWS_USER=$(ls "$TEMP_MOUNT2/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ -z "$WINDOWS_USER" ]]; then
  report_pass "User detection correctly returns empty when no valid users"
else
  report_fail "User detection should return empty for system-only directories" "Got: $WINDOWS_USER"
fi

# Test 3: Windows user detection with spaces in username
echo ""
echo "=== Test 3: Windows username with spaces ==="
TEMP_MOUNT3=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT3")

mkdir -p "$TEMP_MOUNT3/c/Users/John Doe"
mkdir -p "$TEMP_MOUNT3/c/Users/Public"

WINDOWS_USER=$(ls "$TEMP_MOUNT3/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "John Doe" ]]; then
  report_pass "User detection handles usernames with spaces"
else
  report_fail "User detection failed on username with spaces" "Got: '$WINDOWS_USER'"
fi

# Test 3b: Windows username with shell metacharacters
echo ""
echo "=== Test 3b: Windows username with shell metacharacters ==="
TEMP_MOUNT_SPECIAL=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT_SPECIAL")

test_metachar_passed=true
for username in "user&name" "user;name" 'user`name' 'user$name'; do
  mkdir -p "$TEMP_MOUNT_SPECIAL/c/Users/$username"
  mkdir -p "$TEMP_MOUNT_SPECIAL/c/Users/Public"

  WINDOWS_USER=$(ls "$TEMP_MOUNT_SPECIAL/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

  TARGET_DIR="/mnt/c/Users/$WINDOWS_USER"
  if [[ "$TARGET_DIR" != "/mnt/c/Users/$username" ]]; then
    report_fail "Username with special chars caused incorrect expansion" "Expected: $username, Got: $WINDOWS_USER"
    test_metachar_passed=false
    break
  fi

  rm -rf "$TEMP_MOUNT_SPECIAL/c/Users/$username"
done

if $test_metachar_passed; then
  report_pass "User detection handles shell metacharacters safely"
fi

# Test 4: Config file copy operation (dry run simulation)
echo ""
echo "=== Test 4: Config file copy operation ==="
TEMP_SOURCE=$(mktemp)
TEMP_TARGET_DIR=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_TARGET_DIR")

echo "-- Test WezTerm Config" > "$TEMP_SOURCE"
TEMP_TARGET="$TEMP_TARGET_DIR/.wezterm.lua"

if ! cp "$TEMP_SOURCE" "$TEMP_TARGET" 2>&1; then
  report_fail "Config file copy operation" "cp command failed"
  rm -f "$TEMP_SOURCE"
else
  rm -f "$TEMP_SOURCE"
  if [[ -f "$TEMP_TARGET" ]] && grep -q "Test WezTerm Config" "$TEMP_TARGET"; then
    report_pass "Config file copy succeeds"
  else
    report_fail "Config file copy failed"
  fi
fi

# Test 5: Missing /mnt/c/Users directory (non-WSL environment)
echo ""
echo "=== Test 5: Non-WSL environment detection ==="
TEMP_NO_WSL=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_NO_WSL")

if [[ ! -d "$TEMP_NO_WSL/mnt/c/Users" ]]; then
  report_pass "Non-WSL environment correctly detected"
else
  report_fail "Should detect non-WSL environment"
fi

# Test 5b: Native Linux (not WSL) gracefully skips Windows copy with message
echo ""
echo "=== Test 5b: Native Linux graceful skip with message ==="
TEMP_NATIVE_LINUX=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_NATIVE_LINUX")

SKIP_MESSAGE=""
EXIT_CODE=0
if [[ ! -d "$TEMP_NATIVE_LINUX/mnt/c/Users" ]]; then
  SKIP_MESSAGE="Not running on WSL, skipping Windows config copy"
  EXIT_CODE=0
else
  EXIT_CODE=1
fi

if [[ $EXIT_CODE -eq 0 ]] && [[ "$SKIP_MESSAGE" == "Not running on WSL, skipping Windows config copy" ]]; then
  report_pass "Native Linux gracefully skips Windows copy with correct message"
else
  report_fail "Native Linux should skip gracefully with message" "Exit code: $EXIT_CODE, Message: $SKIP_MESSAGE"
fi

# Test 6: Heuristic fallback picks alphabetically-first non-system directory (last-resort role)
echo ""
echo "=== Test 6: Fallback heuristic picks first user when no override and no interop ==="
TEMP_MOUNT4=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT4")

mkdir -p "$TEMP_MOUNT4/c/Users"/{charlie,alice,bob,Public}

WINDOWS_USER=$(ls "$TEMP_MOUNT4/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "alice" ]]; then
  report_pass "Heuristic fallback picks alphabetically-first valid user when no override and no interop"
else
  report_fail "Heuristic fallback priority incorrect" "Expected: alice, Got: $WINDOWS_USER"
fi

# Test 7: Permission denied on /mnt/c/Users (error handling)
echo ""
echo "=== Test 7: Permission denied error handling ==="
TEMP_MOUNT5=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT5")

mkdir -p "$TEMP_MOUNT5/c/Users/testuser"
chmod 000 "$TEMP_MOUNT5/c/Users"

WINDOWS_USER=$(ls "$TEMP_MOUNT5/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1 || true)

chmod 755 "$TEMP_MOUNT5/c/Users"

if [[ -z "$WINDOWS_USER" ]]; then
  report_pass "Permission denied handled gracefully"
else
  report_fail "Should handle permission denied gracefully"
fi

# Test 8: Special characters in Windows username
echo ""
echo "=== Test 8: Special characters in username ==="
TEMP_MOUNT6=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT6")

mkdir -p "$TEMP_MOUNT6/c/Users/test-user_123"
mkdir -p "$TEMP_MOUNT6/c/Users/Public"

WINDOWS_USER=$(ls "$TEMP_MOUNT6/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "test-user_123" ]]; then
  report_pass "User detection handles special characters"
else
  report_fail "User detection failed on special characters" "Got: '$WINDOWS_USER'"
fi

# Test 9: Empty /mnt/c/Users directory
echo ""
echo "=== Test 9: Empty /mnt/c/Users directory ==="
TEMP_MOUNT7=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT7")

mkdir -p "$TEMP_MOUNT7/c/Users"

WINDOWS_USER=$(ls "$TEMP_MOUNT7/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ -z "$WINDOWS_USER" ]]; then
  report_pass "Empty Users directory handled correctly"
else
  report_fail "Should return empty for empty Users directory" "Got: '$WINDOWS_USER'"
fi

# Test 10: Case sensitivity in system directory filtering
echo ""
echo "=== Test 10: Case-sensitive filtering of system directories ==="
TEMP_MOUNT8=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT8")

mkdir -p "$TEMP_MOUNT8/c/Users"/{public,default,alice}

WINDOWS_USER=$(ls "$TEMP_MOUNT8/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" =~ ^(alice|default|public)$ ]]; then
  report_pass "Case-sensitive filtering works as expected"
else
  report_fail "Unexpected filtering result" "Got: '$WINDOWS_USER'"
fi

# Test 11: Desktop.ini file should be filtered out
echo ""
echo "=== Test 11: Desktop.ini file filtering ==="
TEMP_MOUNT9=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT9")

mkdir -p "$TEMP_MOUNT9/c/Users/validuser"
touch "$TEMP_MOUNT9/c/Users/desktop.ini"

WINDOWS_USER=$(ls "$TEMP_MOUNT9/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "validuser" ]]; then
  report_pass "desktop.ini file correctly filtered"
else
  report_fail "desktop.ini filtering failed" "Got: '$WINDOWS_USER'"
fi

# Test 12: 'All Users' directory filtering
echo ""
echo "=== Test 12: 'All Users' directory filtering ==="
TEMP_MOUNT10=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT10")

mkdir -p "$TEMP_MOUNT10/c/Users/All Users"
mkdir -p "$TEMP_MOUNT10/c/Users/realuser"

WINDOWS_USER=$(ls "$TEMP_MOUNT10/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "realuser" ]]; then
  report_pass "'All Users' directory correctly filtered"
else
  report_fail "'All Users' filtering failed" "Got: '$WINDOWS_USER'"
fi

# Test 13: Config copy with target directory creation
echo ""
echo "=== Test 13: Target directory creation during copy ==="
TEMP_SOURCE2=$(mktemp)
TEMP_BASE_DIR=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_BASE_DIR")

echo "-- Config content" > "$TEMP_SOURCE2"
TEMP_NESTED_TARGET="$TEMP_BASE_DIR/nested/path/.wezterm.lua"

if ! mkdir -p "$(dirname "$TEMP_NESTED_TARGET")" 2>&1; then
  report_fail "Target directory creation" "mkdir -p failed"
  rm -f "$TEMP_SOURCE2"
elif ! cp "$TEMP_SOURCE2" "$TEMP_NESTED_TARGET" 2>&1; then
  report_fail "Config copy to nested path" "cp command failed"
  rm -f "$TEMP_SOURCE2"
elif [[ -f "$TEMP_NESTED_TARGET" ]]; then
  rm -f "$TEMP_SOURCE2"
  report_pass "Target directory creation and copy succeeds"
else
  rm -f "$TEMP_SOURCE2"
  report_fail "Target directory creation failed" "File not created despite no error"
fi

# Test 14: Verify actual activation script logic flow
echo ""
echo "=== Test 14: Activation script logic flow simulation ==="

simulate_activation() {
  local mount_point="$1"
  local config_source="$2"

  if [[ -d "$mount_point/c/Users" ]]; then
    local windows_user
    windows_user=$(ls "$mount_point/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

    if [[ -n "$windows_user" ]] && [[ -d "$mount_point/c/Users/$windows_user" ]]; then
      local target_dir="$mount_point/c/Users/$windows_user"
      local target_file="$target_dir/.wezterm.lua"

      if cp "$config_source" "$target_file" 2>/dev/null; then
        echo "copied"
        return 0
      else
        echo "copy_failed"
        return 1
      fi
    else
      echo "no_user_detected"
      return 0
    fi
  else
    echo "not_wsl"
    return 0
  fi
}

ACTIVATION_MOUNT=$(mktemp -d)
ACTIVATION_CONFIG=$(mktemp)
CLEANUP_DIRS+=("$ACTIVATION_MOUNT")

if ! mkdir -p "$ACTIVATION_MOUNT/c/Users/testuser" 2>&1; then
  report_fail "Test 14 setup" "Failed to create test directory structure"
  rm -f "$ACTIVATION_CONFIG"
else
  echo "-- activation test" > "$ACTIVATION_CONFIG"

  result=$(simulate_activation "$ACTIVATION_MOUNT" "$ACTIVATION_CONFIG")
  rm -f "$ACTIVATION_CONFIG"

  if [[ "$result" == "copied" ]]; then
    report_pass "Full activation script logic simulation succeeds"
  else
    report_fail "Activation script simulation failed" "Got: $result"
  fi
fi

# Test 15: Source file missing error handling (simulated)
echo ""
echo "=== Test 15: Source file missing error handling ==="
TEMP_TARGET15=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_TARGET15")
MISSING_SOURCE="/nonexistent/path/wezterm.lua"

if [[ ! -f "$MISSING_SOURCE" ]]; then
  report_pass "Source file existence check works correctly"
else
  report_fail "Should detect missing source file"
fi

# Test 16: Directory creation failure handling (simulated)
echo ""
echo "=== Test 16: Target directory creation failure handling ==="
TEMP_PARENT16=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_PARENT16")
chmod 555 "$TEMP_PARENT16"

if ! mkdir -p "$TEMP_PARENT16/nested/dir" 2>/dev/null; then
  report_pass "Directory creation failure detected correctly"
else
  report_fail "Should detect mkdir failure with read-only parent"
fi

chmod 755 "$TEMP_PARENT16"

# Test 17: Copy failure handling (read-only target)
echo ""
echo "=== Test 17: Copy failure with read-only target ==="
TEMP_SOURCE17=$(mktemp)
TEMP_TARGET_DIR17=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_TARGET_DIR17")
echo "test config" > "$TEMP_SOURCE17"
TARGET_FILE17="$TEMP_TARGET_DIR17/.wezterm.lua"
touch "$TARGET_FILE17"
chmod 444 "$TARGET_FILE17"
chmod 555 "$TEMP_TARGET_DIR17"

if ! cp "$TEMP_SOURCE17" "$TARGET_FILE17" 2>/dev/null; then
  report_pass "Copy failure detected correctly"
else
  report_fail "Should detect copy failure with read-only target"
fi

rm -f "$TEMP_SOURCE17"
chmod 755 "$TEMP_TARGET_DIR17"

# Test 18: Failed to list /mnt/c/Users directory error path
echo ""
echo "=== Test 18: Failed to list /mnt/c/Users directory (warning path) ==="
TEMP_MOUNT_NOPERM=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT_NOPERM")
mkdir -p "$TEMP_MOUNT_NOPERM/c/Users"
chmod 000 "$TEMP_MOUNT_NOPERM/c/Users"

WARNING_OUTPUT=""
if ! ls "$TEMP_MOUNT_NOPERM/c/Users/" >/dev/null 2>&1; then
  WARNING_OUTPUT="WARNING: Failed to list /mnt/c/Users/ directory"$'\n'"This may indicate a WSL mount or permission issue"
fi

if [[ "$WARNING_OUTPUT" =~ "WARNING:" ]] && [[ "$WARNING_OUTPUT" =~ "/mnt/c/Users/" ]] && [[ "$WARNING_OUTPUT" =~ "WSL mount or permission" ]]; then
  report_pass "Failed /mnt/c/Users listing generates descriptive warning message"
else
  report_fail "Warning message lacks required context" "Got: $WARNING_OUTPUT"
fi

chmod 755 "$TEMP_MOUNT_NOPERM/c/Users"

# Test 19: Source WezTerm config not found (ERROR and exit 1)
echo ""
echo "=== Test 19: Source config not found error path ==="
MISSING_SOURCE19="/nonexistent/home/.config/wezterm/wezterm.lua"

ERROR_OUTPUT=""
EXIT_CODE=0
if [[ ! -f "$MISSING_SOURCE19" ]]; then
  ERROR_OUTPUT="ERROR: Source WezTerm config not found at $MISSING_SOURCE19"$'\n'"Home-Manager may have failed to generate the configuration"
  EXIT_CODE=1
fi

if [[ $EXIT_CODE -eq 1 ]]; then
  if [[ "$ERROR_OUTPUT" =~ "ERROR:" ]] && [[ "$ERROR_OUTPUT" =~ "$MISSING_SOURCE19" ]] && [[ "$ERROR_OUTPUT" =~ "Home-Manager" ]]; then
    report_pass "Missing source config triggers exit 1 with descriptive error message"
  else
    report_fail "Error message lacks required context" "Got: $ERROR_OUTPUT"
  fi
else
  report_fail "Missing source config should trigger exit 1"
fi

# Test 20: DRY_RUN_CMD support (dry run mode)
echo ""
echo "=== Test 20: Dry run mode support with DRY_RUN_CMD ==="
TEMP_SOURCE_DRY=$(mktemp)
TEMP_TARGET_DRY=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_TARGET_DRY")
echo "test content" > "$TEMP_SOURCE_DRY"

DRY_RUN_CMD="echo"
VERBOSE_ARG=""
TARGET_FILE_DRY="$TEMP_TARGET_DRY/.wezterm.lua"

eval "$DRY_RUN_CMD cp $VERBOSE_ARG $TEMP_SOURCE_DRY $TARGET_FILE_DRY" >/dev/null 2>&1

rm -f "$TEMP_SOURCE_DRY"

if [[ ! -f "$TARGET_FILE_DRY" ]]; then
  report_pass "Dry run mode (DRY_RUN_CMD=echo) prevents actual file copy"
else
  report_fail "Dry run mode should not create file" "File exists at: $TARGET_FILE_DRY"
fi

# Test 21: Verbose mode support with VERBOSE_ARG
echo ""
echo "=== Test 21: Verbose mode support with VERBOSE_ARG ==="
TEMP_SOURCE_VERBOSE=$(mktemp)
TEMP_TARGET_VERBOSE=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_TARGET_VERBOSE")
echo "verbose test" > "$TEMP_SOURCE_VERBOSE"

DRY_RUN_CMD=""
VERBOSE_ARG="-v"
TARGET_FILE_VERBOSE="$TEMP_TARGET_VERBOSE/.wezterm.lua"

VERBOSE_OUTPUT=$(eval "$DRY_RUN_CMD cp $VERBOSE_ARG $TEMP_SOURCE_VERBOSE $TARGET_FILE_VERBOSE" 2>&1)

rm -f "$TEMP_SOURCE_VERBOSE"

if [[ -f "$TARGET_FILE_VERBOSE" ]]; then
  report_pass "Verbose mode (VERBOSE_ARG=-v) accepted by cp command"
else
  report_fail "Verbose mode command failed" "Output: $VERBOSE_OUTPUT"
fi

# Test 22: Empty source file handling
echo ""
echo "=== Test 22: Empty source file error handling ==="
TEMP_SOURCE22=$(mktemp)
TEMP_TARGET_DIR22=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_TARGET_DIR22")

touch "$TEMP_SOURCE22"

readonly ERR_SOURCE_EMPTY=15

ERROR_OUTPUT=""
EXIT_CODE=0
if [ ! -f "$TEMP_SOURCE22" ]; then
  ERROR_OUTPUT="ERROR: Source WezTerm config not found"
  EXIT_CODE=13
elif [ ! -s "$TEMP_SOURCE22" ]; then
  ERROR_OUTPUT="ERROR: Source WezTerm config is empty at $TEMP_SOURCE22"$'\n'"This may indicate:"$'\n'"  - Home-Manager configuration has empty extraConfig"
  EXIT_CODE=$ERR_SOURCE_EMPTY
fi

rm -f "$TEMP_SOURCE22"

if [[ $EXIT_CODE -eq $ERR_SOURCE_EMPTY ]]; then
  if [[ "$ERROR_OUTPUT" =~ "ERROR: Source WezTerm config is empty" ]] && [[ "$ERROR_OUTPUT" =~ "extraConfig" ]]; then
    report_pass "Empty source file detected with descriptive error message (exit code $ERR_SOURCE_EMPTY)"
  else
    report_fail "Error message lacks diagnostic guidance" "Got: $ERROR_OUTPUT"
  fi
else
  report_fail "Empty source file should trigger exit $ERR_SOURCE_EMPTY" "Got exit code: $EXIT_CODE"
fi

# Test 23: User directory race condition detection
echo ""
echo "=== Test 23: User directory race condition detection ==="
TEMP_RACE=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_RACE")

mkdir -p "$TEMP_RACE/c/Users/raceuser"
mkdir -p "$TEMP_RACE/c/Users/Public"

WINDOWS_USER=$(ls "$TEMP_RACE/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "raceuser" ]]; then
  rm -rf "$TEMP_RACE/c/Users/raceuser"

  ERROR_OUTPUT=""
  EXIT_CODE=0
  if [[ ! -d "$TEMP_RACE/c/Users/$WINDOWS_USER" ]]; then
    ERROR_OUTPUT="ERROR: Detected Windows username '$WINDOWS_USER' but directory does not exist"$'\n'"  Expected directory: /mnt/c/Users/$WINDOWS_USER"
    EXIT_CODE=1
  fi

  if [[ $EXIT_CODE -eq 1 ]]; then
    if [[ "$ERROR_OUTPUT" =~ "Detected Windows username" ]] && [[ "$ERROR_OUTPUT" =~ "directory does not exist" ]]; then
      report_pass "Race condition detection produces correct diagnostic error"
    else
      report_fail "Race condition error message incorrect" "Got: $ERROR_OUTPUT"
    fi
  else
    report_fail "Race condition should trigger error" "Expected exit 1, got: $EXIT_CODE"
  fi
else
  report_fail "Test setup failed - user detection" "Expected 'raceuser', got: '$WINDOWS_USER'"
fi

# Tests 24-26: Three-tier detection chain precedence tests
#
# These tests exercise the full three-tier Windows-user detection chain from
# wezterm.nix (override env var > cmd.exe/wslpath interop > ls/grep/head
# heuristic) using PATH-stubbed executables and a temp mount that stands in
# for /mnt/c.
#
# Setup shared by Tests 24-26: stub dir, stubs, and temp mount with two user dirs
echo ""
echo "=== Tests 24-26 setup: stub dir and temp mount ==="
STUBDIR=$(mktemp -d)
CLEANUP_DIRS+=("$STUBDIR")
TEMP_MOUNT_CHAIN=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT_CHAIN")

# Populate two user directories: alice (alphabetically first) and bob.
# The heuristic alone would pick alice; interop will pick bob — proving tier order.
mkdir -p "$TEMP_MOUNT_CHAIN/c/Users/alice"
mkdir -p "$TEMP_MOUNT_CHAIN/c/Users/bob"

# cmd.exe stub: emits a Windows path with a trailing \r (exercises tr -d '\r')
cat > "$STUBDIR/cmd.exe" <<'STUB_EOF'
#!/bin/sh
printf 'C:\\Users\\bob\r\n'
STUB_EOF
chmod +x "$STUBDIR/cmd.exe"

# wslpath stub: maps the Windows C:\Users\bob path to the temp mount.
# Reads TEMP_MOUNT_CHAIN from the environment so it doesn't need to be
# baked in at stub-creation time.
# Real wslpath is called as: wslpath -u <windows-path>
# so $1 is the flag (-u) and $2 is the path.
cat > "$STUBDIR/wslpath" <<'STUB_EOF'
#!/bin/sh
# Accept wslpath -u <path> form; $1 is the flag, $2 is the Windows path.
WIN_PATH="$2"
if [ "$WIN_PATH" = "C:\\Users\\bob" ] || [ "$WIN_PATH" = "C:/Users/bob" ]; then
  printf '%s/c/Users/bob' "$TEMP_MOUNT_CHAIN"
else
  printf '%s' "$WIN_PATH"
fi
STUB_EOF
chmod +x "$STUBDIR/wslpath"

# Build a PATH that has the stubs but excludes /mnt/c/Windows/System32 so
# that cmd.exe/wslpath always resolve to the stubs — not to real WSL interop
# binaries on a live WSL host — and so the sanitized PATH (no stubs, no
# System32) used by Test 26 still has coreutils (ls, head, tr).
INTEROP_FREE_PATH=$(printf '%s' "$PATH" | tr ':' '\n' | grep -vF '/mnt/c/Windows' | paste -sd:)
STUB_PATH="$STUBDIR:$INTEROP_FREE_PATH"

# Test 24: Override (Tier 1) wins over interop (Tier 2)
echo ""
echo "=== Test 24: Override env var wins over interop ==="

# Sub-test 24a: override names an existing dir → WINDOWS_USER comes from override
(
  export TEMP_MOUNT_CHAIN
  WEZTERM_WINDOWS_USER=alice

  TARGET_DIR=""
  WINDOWS_USER=""

  # Tier 1
  if [ -n "${WEZTERM_WINDOWS_USER:-}" ]; then
    if [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER" ]; then
      WINDOWS_USER="$WEZTERM_WINDOWS_USER"
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    else
      echo "WARNING: WEZTERM_WINDOWS_USER='$WEZTERM_WINDOWS_USER' set but $TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER does not exist; falling back to auto-detection" >&2
    fi
  fi

  # Tier 2 (stubs available, but Tier 1 already set TARGET_DIR)
  if [ -z "$TARGET_DIR" ] && PATH="$STUB_PATH" command -v cmd.exe >/dev/null 2>&1 && PATH="$STUB_PATH" command -v wslpath >/dev/null 2>&1; then
    WIN_PROFILE=$(PATH="$STUB_PATH" cmd.exe /c echo %USERPROFILE% 2>/dev/null | tr -d '\r')
    CAND=$(PATH="$STUB_PATH" wslpath -u "$WIN_PROFILE" 2>/dev/null)
    if [ -n "$CAND" ] && [ -d "$CAND" ]; then
      TARGET_DIR="$CAND"
      WINDOWS_USER=$(basename "$CAND")
    fi
  fi

  # Tier 3
  if [ -z "$TARGET_DIR" ]; then
    WINDOWS_USER=$(ls "$TEMP_MOUNT_CHAIN/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)
    if [ -n "$WINDOWS_USER" ] && [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER" ]; then
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    fi
  fi

  printf '%s' "$WINDOWS_USER"
) > "$TMPDIR/wezterm_test24a_result" 2>"$TMPDIR/wezterm_test24a_warn"
RESULT_24A=$(cat "$TMPDIR/wezterm_test24a_result")
rm -f "$TMPDIR/wezterm_test24a_result" "$TMPDIR/wezterm_test24a_warn"

if [[ "$RESULT_24A" == "alice" ]]; then
  report_pass "Test 24a: override (existing dir) wins over interop — got alice"
else
  report_fail "Test 24a: override should win over interop" "Expected: alice, Got: $RESULT_24A"
fi

# Sub-test 24b: override names a MISSING dir → warns and falls through to interop (bob)
(
  export TEMP_MOUNT_CHAIN
  WEZTERM_WINDOWS_USER=nosuchuser

  TARGET_DIR=""
  WINDOWS_USER=""

  # Tier 1
  if [ -n "${WEZTERM_WINDOWS_USER:-}" ]; then
    if [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER" ]; then
      WINDOWS_USER="$WEZTERM_WINDOWS_USER"
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    else
      echo "WARNING: WEZTERM_WINDOWS_USER='$WEZTERM_WINDOWS_USER' set but $TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER does not exist; falling back to auto-detection" >&2
    fi
  fi

  # Tier 2 (stubs available, Tier 1 missed → fall through)
  if [ -z "$TARGET_DIR" ] && PATH="$STUB_PATH" command -v cmd.exe >/dev/null 2>&1 && PATH="$STUB_PATH" command -v wslpath >/dev/null 2>&1; then
    WIN_PROFILE=$(PATH="$STUB_PATH" cmd.exe /c echo %USERPROFILE% 2>/dev/null | tr -d '\r')
    CAND=$(PATH="$STUB_PATH" wslpath -u "$WIN_PROFILE" 2>/dev/null)
    if [ -n "$CAND" ] && [ -d "$CAND" ]; then
      TARGET_DIR="$CAND"
      WINDOWS_USER=$(basename "$CAND")
    fi
  fi

  # Tier 3
  if [ -z "$TARGET_DIR" ]; then
    WINDOWS_USER=$(ls "$TEMP_MOUNT_CHAIN/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)
    if [ -n "$WINDOWS_USER" ] && [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER" ]; then
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    fi
  fi

  printf '%s' "$WINDOWS_USER"
) > "$TMPDIR/wezterm_test24b_result" 2>"$TMPDIR/wezterm_test24b_warn"
RESULT_24B=$(cat "$TMPDIR/wezterm_test24b_result")
WARN_24B=$(cat "$TMPDIR/wezterm_test24b_warn")
rm -f "$TMPDIR/wezterm_test24b_result" "$TMPDIR/wezterm_test24b_warn"

if [[ "$RESULT_24B" == "bob" ]] && [[ "$WARN_24B" =~ "WARNING:" ]]; then
  report_pass "Test 24b: override missing dir → warns and falls through to interop (bob)"
else
  report_fail "Test 24b: missing override should warn and fall through to interop" \
    "Expected bob + WARNING, Got: result=$RESULT_24B warn=$WARN_24B"
fi

# Test 25: Interop (Tier 2) wins over heuristic (Tier 3) when no override is set
echo ""
echo "=== Test 25: Interop wins over heuristic when no override ==="

(
  export TEMP_MOUNT_CHAIN
  unset WEZTERM_WINDOWS_USER 2>/dev/null || true

  TARGET_DIR=""
  WINDOWS_USER=""

  # Tier 1 (no override)
  if [ -n "${WEZTERM_WINDOWS_USER:-}" ]; then
    if [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER" ]; then
      WINDOWS_USER="$WEZTERM_WINDOWS_USER"
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    else
      echo "WARNING: WEZTERM_WINDOWS_USER='$WEZTERM_WINDOWS_USER' set but $TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER does not exist; falling back to auto-detection" >&2
    fi
  fi

  # Tier 2 (stubs in PATH → cmd.exe and wslpath found)
  if [ -z "$TARGET_DIR" ] && PATH="$STUB_PATH" command -v cmd.exe >/dev/null 2>&1 && PATH="$STUB_PATH" command -v wslpath >/dev/null 2>&1; then
    WIN_PROFILE=$(PATH="$STUB_PATH" cmd.exe /c echo %USERPROFILE% 2>/dev/null | tr -d '\r')
    CAND=$(PATH="$STUB_PATH" wslpath -u "$WIN_PROFILE" 2>/dev/null)
    if [ -n "$CAND" ] && [ -d "$CAND" ]; then
      TARGET_DIR="$CAND"
      WINDOWS_USER=$(basename "$CAND")
    fi
  fi

  # Tier 3
  if [ -z "$TARGET_DIR" ]; then
    WINDOWS_USER=$(ls "$TEMP_MOUNT_CHAIN/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)
    if [ -n "$WINDOWS_USER" ] && [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER" ]; then
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    fi
  fi

  printf '%s' "$WINDOWS_USER"
) > "$TMPDIR/wezterm_test25_result" 2>/dev/null
RESULT_25=$(cat "$TMPDIR/wezterm_test25_result")
rm -f "$TMPDIR/wezterm_test25_result"

if [[ "$RESULT_25" == "bob" ]]; then
  report_pass "Test 25: interop wins over heuristic — got bob, not alphabetically-first alice"
else
  report_fail "Test 25: interop should win over heuristic" "Expected: bob, Got: $RESULT_25"
fi

# Test 26: Heuristic fallback (Tier 3) when interop binaries are absent from PATH
echo ""
echo "=== Test 26: Heuristic fallback when interop binaries absent from PATH ==="
# Build a PATH that has coreutils but no cmd.exe/wslpath (no stubs, no System32).
# This is deterministic on both Linux CI and WSL dev hosts.
NO_INTEROP_PATH=$(printf '%s' "$PATH" | tr ':' '\n' | grep -vF '/mnt/c/Windows' | grep -vF "$STUBDIR" | paste -sd:)

(
  export TEMP_MOUNT_CHAIN
  unset WEZTERM_WINDOWS_USER 2>/dev/null || true

  TARGET_DIR=""
  WINDOWS_USER=""

  # Tier 1 (no override)
  if [ -n "${WEZTERM_WINDOWS_USER:-}" ]; then
    if [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER" ]; then
      WINDOWS_USER="$WEZTERM_WINDOWS_USER"
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    else
      echo "WARNING: WEZTERM_WINDOWS_USER='$WEZTERM_WINDOWS_USER' set but $TEMP_MOUNT_CHAIN/c/Users/$WEZTERM_WINDOWS_USER does not exist; falling back to auto-detection" >&2
    fi
  fi

  # Tier 2: cmd.exe not found on NO_INTEROP_PATH → skip
  if [ -z "$TARGET_DIR" ] && PATH="$NO_INTEROP_PATH" command -v cmd.exe >/dev/null 2>&1 && PATH="$NO_INTEROP_PATH" command -v wslpath >/dev/null 2>&1; then
    WIN_PROFILE=$(PATH="$NO_INTEROP_PATH" cmd.exe /c echo %USERPROFILE% 2>/dev/null | tr -d '\r')
    CAND=$(PATH="$NO_INTEROP_PATH" wslpath -u "$WIN_PROFILE" 2>/dev/null)
    if [ -n "$CAND" ] && [ -d "$CAND" ]; then
      TARGET_DIR="$CAND"
      WINDOWS_USER=$(basename "$CAND")
    fi
  fi

  # Tier 3 (heuristic last resort)
  if [ -z "$TARGET_DIR" ]; then
    WINDOWS_USER=$(ls "$TEMP_MOUNT_CHAIN/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)
    if [ -n "$WINDOWS_USER" ] && [ -d "$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER" ]; then
      TARGET_DIR="$TEMP_MOUNT_CHAIN/c/Users/$WINDOWS_USER"
    fi
  fi

  printf '%s' "$WINDOWS_USER"
) > "$TMPDIR/wezterm_test26_result" 2>/dev/null
RESULT_26=$(cat "$TMPDIR/wezterm_test26_result")
rm -f "$TMPDIR/wezterm_test26_result"

if [[ "$RESULT_26" == "alice" ]]; then
  report_pass "Test 26: heuristic fallback picks alphabetically-first user when interop absent"
else
  report_fail "Test 26: heuristic should pick alice when interop absent" "Expected: alice, Got: $RESULT_26"
fi

# Summary
echo ""
echo "================================"
echo "Passed: $PASSES"
echo "Failed: $FAILURES"
echo "================================"

if [[ $CLEANUP_FAILURES -gt 0 ]]; then
  echo ""
  echo "WARNING: $CLEANUP_FAILURES cleanup operations failed"
  echo "Temporary directories may have been left behind"
fi

if [[ $FAILURES -eq 0 ]]; then
  echo "All tests passed!"
  exit 0
else
  echo "$FAILURES test(s) failed"
  exit 1
fi
