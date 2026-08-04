#!/usr/bin/env bash
# Tests for dispatch-security-surface -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 21958-22157.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-security-surface ===
# ============================================================================

echo "Test: dispatch-security-surface"

# empty input → surface=empty
out=$(printf '' | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: empty input" "surface=empty
deps=false
app_or_rules=false" "$out"

# README.md → docs
out=$(printf '%s\n' "README.md" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: docs-only README" "surface=docs
deps=false
app_or_rules=false" "$out"

# .claude/skills/foo/SKILL.md + docs/guide.md → docs
out=$(printf '%s\n' ".claude/skills/foo/SKILL.md" "docs/guide.md" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: .claude skill md + docs md both docs" "surface=docs
deps=false
app_or_rules=false" "$out"

# LICENSE (no extension) → docs
out=$(printf '%s\n' "LICENSE" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: LICENSE no extension" "surface=docs
deps=false
app_or_rules=false" "$out"

# LICENSE.md (doc extension) → docs (matched by the doc-extension branch)
out=$(printf '%s\n' "LICENSE.md" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: LICENSE.md doc extension" "surface=docs
deps=false
app_or_rules=false" "$out"

# A code file named like a license must NOT be classified docs — a code
# extension on a license-style basename must not skip the security fan-out.
out=$(printf '%s\n' "src/auth/NOTICE.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: NOTICE.ts is code not docs" "surface=code
deps=false
app_or_rules=true" "$out"

out=$(printf '%s\n' "AUTHORS.go" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: AUTHORS.go is code not docs" "surface=code
deps=false
app_or_rules=true" "$out"

out=$(printf '%s\n' "LICENSE.sh" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: LICENSE.sh is code not docs" "surface=code
deps=false
app_or_rules=false" "$out"

# README.md + blank line → docs (blank-line tolerance)
out=$(printf 'README.md\n\n' | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: docs with trailing blank line" "surface=docs
deps=false
app_or_rules=false" "$out"

# README.md + tab-only line → docs (tab whitespace filtered)
out=$(printf 'README.md\n\t\nCHANGELOG.md\n' | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: docs with tab-only blank line" "surface=docs
deps=false
app_or_rules=false" "$out"

# SKILL.md + .claude/skills/x/scripts/bar.sh → code (non-doc extension)
out=$(printf '%s\n' "SKILL.md" ".claude/skills/x/scripts/bar.sh" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: SKILL.md + .claude sh script → code, no app_or_rules" "surface=code
deps=false
app_or_rules=false" "$out"

# package.json → code + deps
out=$(printf '%s\n' "package.json" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: package.json → deps=true" "surface=code
deps=true
app_or_rules=false" "$out"

# package-lock.json → code + deps
out=$(printf '%s\n' "package-lock.json" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: package-lock.json → deps=true" "surface=code
deps=true
app_or_rules=false" "$out"

# functions/package.json (nested) → code + deps
out=$(printf '%s\n' "functions/package.json" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: functions/package.json nested → deps=true" "surface=code
deps=true
app_or_rules=false" "$out"

# budget/src/index.ts → code + app_or_rules
out=$(printf '%s\n' "budget/src/index.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: budget ts → app_or_rules=true" "surface=code
deps=false
app_or_rules=true" "$out"

# budget-etl/main.go → code + app_or_rules
out=$(printf '%s\n' "budget-etl/main.go" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: go file → app_or_rules=true" "surface=code
deps=false
app_or_rules=true" "$out"

# firestore.rules → code + app_or_rules
out=$(printf '%s\n' "firestore.rules" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: firestore.rules → app_or_rules=true" "surface=code
deps=false
app_or_rules=true" "$out"

# storage.rules → code + app_or_rules
out=$(printf '%s\n' "storage.rules" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: storage.rules → app_or_rules=true" "surface=code
deps=false
app_or_rules=true" "$out"

# .claude/foo.ts → code but NOT app_or_rules (.claude/ exclusion)
out=$(printf '%s\n' ".claude/foo.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: .claude ts excluded from app_or_rules" "surface=code
deps=false
app_or_rules=false" "$out"

# .github/workflows/ci.yml → code, no deps, no app_or_rules
out=$(printf '%s\n' ".github/workflows/ci.yml" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: github workflow yml → code no app_or_rules" "surface=code
deps=false
app_or_rules=false" "$out"

# landing/src/app.tsx + package-lock.json → code + deps + app_or_rules
out=$(printf '%s\n' "landing/src/app.tsx" "package-lock.json" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tsx + package-lock → deps=true app_or_rules=true" "surface=code
deps=true
app_or_rules=true" "$out"

# README.md + print/src/x.ts → code + app_or_rules (mixed doc + source)
out=$(printf '%s\n' "README.md" "print/src/x.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: readme + ts → code app_or_rules=true" "surface=code
deps=false
app_or_rules=true" "$out"

# storage.rules + package-lock.json → code + deps + app_or_rules (covers the
# short-circuit when both flags fire from a rules file rather than app source)
out=$(printf '%s\n' "storage.rules" "package-lock.json" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: storage.rules + package-lock → deps=true app_or_rules=true" "surface=code
deps=true
app_or_rules=true" "$out"

# non-.claude shell script → code, no app_or_rules (APP_RE misses .sh, so
# app_or_rules stays false independent of the .claude/ exclusion)
out=$(printf '%s\n' "budget-etl/scripts/run.sh" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: non-.claude sh → code no app_or_rules" "surface=code
deps=false
app_or_rules=false" "$out"

# src/foo.test.ts → tests
out=$(printf '%s\n' "src/foo.test.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tests .test.ts" "surface=tests
deps=false
app_or_rules=false" "$out"

# landing/src/app.spec.tsx → tests
out=$(printf '%s\n' "landing/src/app.spec.tsx" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tests .spec.tsx" "surface=tests
deps=false
app_or_rules=false" "$out"

# budget-etl/main_test.go → tests
out=$(printf '%s\n' "budget-etl/main_test.go" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tests _test.go" "surface=tests
deps=false
app_or_rules=false" "$out"

# src/__tests__/foo.ts → tests
out=$(printf '%s\n' "src/__tests__/foo.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tests __tests__ dir" "surface=tests
deps=false
app_or_rules=false" "$out"

# test/fixtures/x.json → tests
out=$(printf '%s\n' "test/fixtures/x.json" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tests test/ dir prefix" "surface=tests
deps=false
app_or_rules=false" "$out"

# .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh → tests
out=$(printf '%s\n' ".claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: tests test-*.sh script" "surface=tests
deps=false
app_or_rules=false" "$out"

# mixed README.md + src/foo.test.ts → code (not all-docs, not all-tests);
# .test.ts still carries the .ts extension so app_or_rules=true
out=$(printf '%s\n' "README.md" "src/foo.test.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: mixed doc+test → code" "surface=code
deps=false
app_or_rules=true" "$out"

# mixed src/foo.test.ts + src/bar.ts → code (a real source file present)
out=$(printf '%s\n' "src/foo.test.ts" "src/bar.ts" | "$SCRIPT_DIR/dispatch-security-surface")
assert_eq "surface: mixed test+source → code" "surface=code
deps=false
app_or_rules=true" "$out"

# <<< END MOVED <<<

report_results
