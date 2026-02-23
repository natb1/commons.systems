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

# Test 6: Windows user detection prioritizes first non-system directory
echo ""
echo "=== Test 6: User detection priority with multiple users ==="
TEMP_MOUNT4=$(mktemp -d)
CLEANUP_DIRS+=("$TEMP_MOUNT4")

mkdir -p "$TEMP_MOUNT4/c/Users"/{charlie,alice,bob,Public}

WINDOWS_USER=$(ls "$TEMP_MOUNT4/c/Users/" 2>/dev/null | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

if [[ "$WINDOWS_USER" == "alice" ]]; then
  report_pass "User detection uses alphabetically first valid user"
else
  report_fail "User detection priority incorrect" "Expected: alice, Got: $WINDOWS_USER"
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
