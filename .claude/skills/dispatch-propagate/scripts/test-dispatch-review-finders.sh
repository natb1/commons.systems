#!/usr/bin/env bash
# Tests for dispatch-review-finders -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22514-22583.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-review-finders ===
# ============================================================================

echo "Test: dispatch-review-finders"

# empty surface → exactly code-review
out=$(printf 'surface=empty\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders")
assert_eq "finders: empty → code-review only" "code-review" "$out"

# docs surface → exactly code-review
out=$(printf 'surface=docs\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders")
assert_eq "finders: docs → code-review only" "code-review" "$out"

# code + app_or_rules=false + deps=false → 4 always-on security finders present
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(input-validation|secrets|red-team|security-review)$')
assert_eq "finders: code !app → 4 always-on security finders" "4" "$n"

# code + app_or_rules=false → codeql present
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^codeql$')
assert_eq "finders: code !app → codeql present" "1" "$n"

# code + app_or_rules=false → npm absent
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^npm$' || true)
assert_eq "finders: code !app !deps → npm absent" "0" "$n"

# code + app_or_rules=false → app-domain trio absent
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(auth|data-exposure|firebase)$' || true)
assert_eq "finders: code !app → app-domain trio absent" "0" "$n"

# code + app_or_rules=true + deps=false → 7 security reviewers present
n=$(printf 'surface=code\ndeps=false\napp_or_rules=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(input-validation|secrets|red-team|security-review|auth|data-exposure|firebase)$')
assert_eq "finders: code+app → 7 security reviewers" "7" "$n"

# code + app_or_rules=true + deps=false → npm absent
n=$(printf 'surface=code\ndeps=false\napp_or_rules=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^npm$' || true)
assert_eq "finders: code+app !deps → npm absent" "0" "$n"

# deps=true on a code surface → npm present
n=$(printf 'surface=code\ndeps=true\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^npm$')
assert_eq "finders: deps=true → npm present" "1" "$n"

# codeql gating: present on code surface
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^codeql$')
assert_eq "finders: code surface → codeql present" "1" "$n"

# codeql gating: absent on docs surface
n=$(printf 'surface=docs\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^codeql$' || true)
assert_eq "finders: docs surface → codeql absent" "0" "$n"

# tests surface → exactly code-review (no security finders)
out=$(printf 'surface=tests\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders")
assert_eq "finders: tests → code-review only" "code-review" "$out"

# cost finder: present when surface=code + app_or_rules=true
n=$(printf 'surface=code\ndeps=false\napp_or_rules=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$')
assert_eq "finders: code+app → cost present" "1" "$n"

# cost finder: absent when surface=code + app_or_rules=false
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: code !app → cost absent" "0" "$n"

# cost finder: absent on docs surface
n=$(printf 'surface=docs\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: docs surface → cost absent" "0" "$n"

# cost finder: absent on tests surface
n=$(printf 'surface=tests\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: tests surface → cost absent" "0" "$n"

# <<< END MOVED <<<

report_results
