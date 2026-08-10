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

# code + app_or_rules=false → app-domain trio absent (firebase rides
# app_or_rules OR api_call_site; both false here)
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(auth|data-exposure|firebase)$' || true)
assert_eq "finders: code !app → app-domain trio absent" "0" "$n"

# code + app_or_rules=true + deps=false → 7 security reviewers present, firebase
# among them: firebase is the SECURITY half of the merged api-cost lens and keeps
# its app_or_rules trigger. Gating it on api_call_site alone would drop it on
# exactly the diffs it reviews (Firestore rules permissiveness, emulator-only code
# on production paths, Firebase key/config exposure) — none of which the
# api_call_site pattern set matches.
n=$(printf 'surface=code\ndeps=false\napp_or_rules=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(input-validation|secrets|red-team|security-review|auth|data-exposure|firebase)$')
assert_eq "finders: code+app → 7 security reviewers" "7" "$n"

# code + app_or_rules=true + deps=false → firebase present even with
# api_call_site unset (defaults false)
n=$(printf 'surface=code\ndeps=false\napp_or_rules=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^firebase$')
assert_eq "finders: code+app !api_call_site → firebase present" "1" "$n"

# ...and cost absent in that same case: only the ADVISORY half moved to the
# api_call_site gate.
n=$(printf 'surface=code\ndeps=false\napp_or_rules=true\napi_call_site=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: code+app !api_call_site → cost absent" "0" "$n"

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

# cost finder: present when surface=code + api_call_site=true
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$')
assert_eq "finders: code+api_call_site → cost present" "1" "$n"

# cost finder: absent when surface=code + api_call_site=false
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\napi_call_site=false\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: code !api_call_site → cost absent" "0" "$n"

# cost finder: absent on docs surface even with api_call_site=true
n=$(printf 'surface=docs\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: docs surface → cost absent" "0" "$n"

# cost finder: absent on tests surface even with api_call_site=true
n=$(printf 'surface=tests\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -c '^cost$' || true)
assert_eq "finders: tests surface → cost absent" "0" "$n"

# code + app_or_rules=false + api_call_site=true → firebase and cost present,
# auth and data-exposure absent (the widen: api_call_site adds cost, and adds
# firebase on diffs outside the app/rules path set, without touching auth or
# data-exposure)
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(firebase|cost)$')
assert_eq "finders: code !app+api_call_site → firebase+cost present" "2" "$n"
n=$(printf 'surface=code\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(auth|data-exposure)$' || true)
assert_eq "finders: code !app+api_call_site → auth/data-exposure absent" "0" "$n"

# docs surface + api_call_site=true → firebase and cost both absent (surface==code
# gate still dominates)
n=$(printf 'surface=docs\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(firebase|cost)$' || true)
assert_eq "finders: docs+api_call_site → firebase/cost absent" "0" "$n"

# tests surface + api_call_site=true → firebase and cost both absent (surface==code
# gate still dominates)
n=$(printf 'surface=tests\ndeps=false\napp_or_rules=false\napi_call_site=true\n' | "$SCRIPT_DIR/dispatch-review-finders" | grep -cE '^(firebase|cost)$' || true)
assert_eq "finders: tests+api_call_site → firebase/cost absent" "0" "$n"

# <<< END MOVED <<<

report_results
