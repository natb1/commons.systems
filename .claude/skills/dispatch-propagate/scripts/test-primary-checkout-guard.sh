#!/usr/bin/env bash
# test-primary-checkout-guard.sh — tests for assert_primary_checkout_on_main
# (lib.sh). Verifies the guard returns 0 silently when the primary checkout
# is on `main`, and returns non-zero with a repair-command error to stderr
# when it is on a feature branch.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
source "$SCRIPT_DIR/lib.sh"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

REPO="$WORK/repo"
git init --quiet "$REPO"
git -C "$REPO" -c user.email=test@test -c user.name=test commit --quiet --allow-empty -m "init"
git -C "$REPO" branch -M main

# ---- Test case 1: passes silently on a `main` checkout --------------------

STDERR_FILE="$WORK/stderr-main"
if assert_primary_checkout_on_main "$REPO" 2>"$STDERR_FILE"; then
  TOTAL=$((TOTAL + 1))
  PASS=$((PASS + 1))
  echo "  PASS: exits 0 on main checkout"
else
  TOTAL=$((TOTAL + 1))
  FAIL=$((FAIL + 1))
  echo "  FAIL: exits 0 on main checkout — got non-zero exit"
fi

assert_eq "prints nothing to stderr on main checkout" "" "$(cat "$STDERR_FILE")"

# ---- Test case 2: fails with repair message on a feature-branch checkout --

git -C "$REPO" checkout --quiet -b some-feature-branch

STDERR_FILE2="$WORK/stderr-feature"
set +e
assert_primary_checkout_on_main "$REPO" 2>"$STDERR_FILE2"
STATUS=$?
set -e

TOTAL=$((TOTAL + 1))
if [ "$STATUS" -ne 0 ]; then
  PASS=$((PASS + 1))
  echo "  PASS: exits non-zero on feature-branch checkout"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: exits non-zero on feature-branch checkout — got exit 0"
fi

STDERR_CONTENT="$(cat "$STDERR_FILE2")"
assert_contains "stderr names the offending branch" "some-feature-branch" "$STDERR_CONTENT"
assert_contains "stderr includes the repair command" "switch main" "$STDERR_CONTENT"

report_results
