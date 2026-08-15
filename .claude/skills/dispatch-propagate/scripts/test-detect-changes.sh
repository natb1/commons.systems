#!/usr/bin/env bash
# Tests for detect-changes.sh (+ list-go-modules.sh) -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Originally mis-homed as a trailing section of
# test-dispatch-jit-calendar-import.sh: this section was added to the monolith after the
# tactic's manifest, under a non-standard '----' banner the extractor's '====' boundary
# detector missed, so it landed in the wrong file; this moves it to its own home.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
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

# --- graph ---
dc_setup
assert_eq "detect-changes: graph=true for packages/intentionsutil path"  "true"  "$(dc_run graph 'packages/intentionsutil/src/sensors.ts')"
assert_eq "detect-changes: graph=true for validate-graph.ts"             "true"  "$(dc_run graph 'packages/intentionsutil/scripts/validate-graph.ts')"
assert_eq "detect-changes: graph=true for an intentions/ node"           "true"  "$(dc_run graph 'intentions/tactic-x.md')"
assert_eq "detect-changes: graph absent for unrelated path"              "false" "$(dc_run graph 'README.md')"
assert_eq "detect-changes: graph absent for another package"             "false" "$(dc_run graph 'packages/ds/src/x.ts')"
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

# --- empty diff sets none of the keys ---
dc_setup
assert_eq "detect-changes: empty diff leaves nix unset"        "false" "$(dc_run nix)"
assert_eq "detect-changes: empty diff leaves playwright unset" "false" "$(dc_run playwright)"
assert_eq "detect-changes: empty diff leaves rules unset"      "false" "$(dc_run rules)"
assert_eq "detect-changes: empty diff leaves graph unset"      "false" "$(dc_run graph)"
assert_eq "detect-changes: empty diff leaves go unset"         "false" "$(dc_run go)"
dc_teardown

# <<< END MOVED <<<

report_results
