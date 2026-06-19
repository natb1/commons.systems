#!/usr/bin/env bash
# Check for test-integrity violations in the current PR vs origin/main.
#
# Three signals — all measured as NET changes across the whole diff so a
# test moved between files within a single PR nets to zero:
#
#   Signal 1 — Disabling-skip additions (net > 0 → violation)
#     Added lines matching (it|test|describe).skip("title"…) or (xit|xdescribe)(
#     MINUS removed such lines.
#     Playwright runtime-conditional skips like test.skip(testInfo.project…) are
#     NOT flagged because their first arg is an expression, not a string literal —
#     the discriminator is a quote character immediately after the opening paren.
#
#   Signal 2 — Test-declaration removals (net removed > 0 → violation)
#     Removed lines matching (it|test|describe)[.each(...)]( MINUS added such
#     lines. A net-negative count means fewer test declarations → flag.
#     This also catches the common skip-CONVERSION: removing `it("x", …)` while
#     adding `it.skip("x", …)` — the removed line matches; the added line does
#     NOT (`.skip` breaks the bare-call pattern).
#
#   Signal 3 — Whole test-file deletion
#     Any test file (*.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx) fully deleted
#     in this PR.
#
# Exit contract: 0 = clean, 1 = violation. Silent on clean pass.
# On violation: cat >&2 <<EOF remediation block (mirrors check-playwright-version-sync.sh).
#
# Requires: git, grep, bash (no node/nix/npm needed — git diff + grep only).
set -euo pipefail

# Test file globs passed as pathspecs to git diff.
TEST_GLOBS=(
  '*.test.ts'
  '*.test.tsx'
  '*.spec.ts'
  '*.spec.tsx'
)

# ---------------------------------------------------------------------------
# Capture diff — exit clearly on failure (never silently narrow to HEAD~1).
# ---------------------------------------------------------------------------
DIFF=""
if ! DIFF=$(git diff --unified=0 origin/main...HEAD -- "${TEST_GLOBS[@]}" 2>&1); then
  cat >&2 <<EOF
ERROR: check-test-integrity: 'git diff origin/main...HEAD' failed.

This is a required blocking gate. The diff against origin/main must be
computable. CI checks out with fetch-depth: 0 so origin/main is always
present. If this is a local run, fetch first:

  git fetch origin main

Raw error from git:
$DIFF
EOF
  exit 1
fi

# Empty diff — nothing touched test files. Clean pass.
if [ -z "$DIFF" ]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Extract added/removed lines (excluding diff header lines +++ / ---).
# The || true guards protect set -e when grep finds no matches.
# ---------------------------------------------------------------------------
ADDED_LINES=$(printf '%s\n' "$DIFF" | grep '^+' | grep -v '^+++' || true)
REMOVED_LINES=$(printf '%s\n' "$DIFF" | grep '^-' | grep -v '^---' || true)

# ---------------------------------------------------------------------------
# Signal 1: Disabling-skip additions
#   Pattern A: (it|test|describe).skip( followed by a string-literal first arg
#              (quote char immediately after the open paren).
#   Pattern B: (xit|xdescribe)(
#
# The quote-char discriminator ['"`] after the open paren excludes
# test.skip(testInfo.project.name !== "desktop", "desktop only") — there,
# the character after '(' is 't', not a quote.
# ---------------------------------------------------------------------------
SKIP_PAT_A='(it|test|describe)\.skip[[:space:]]*\([[:space:]]*["'"'"'`]'
SKIP_PAT_B='\b(xit|xdescribe)[[:space:]]*\('

SKIP_ADDED=0
SKIP_REMOVED=0

if [ -n "$ADDED_LINES" ]; then
  SKIP_ADDED=$(printf '%s\n' "$ADDED_LINES" | grep -cE "$SKIP_PAT_A|$SKIP_PAT_B" || true)
fi
if [ -n "$REMOVED_LINES" ]; then
  SKIP_REMOVED=$(printf '%s\n' "$REMOVED_LINES" | grep -cE "$SKIP_PAT_A|$SKIP_PAT_B" || true)
fi

SKIP_NET=$((SKIP_ADDED - SKIP_REMOVED))

# ---------------------------------------------------------------------------
# Signal 2: Test-declaration removals
#   Matches: it( / test( / describe( / it.each(...)( / test.each(...)(
#   Does NOT match: it.skip( (no '.skip' in the pattern) — so a
#   skip-conversion (it → it.skip) is caught here as a net removal.
# ---------------------------------------------------------------------------
DECL_PAT='\b(it|test|describe)(\.each\([^)]*\))?[[:space:]]*\('

DECL_ADDED=0
DECL_REMOVED=0

if [ -n "$ADDED_LINES" ]; then
  DECL_ADDED=$(printf '%s\n' "$ADDED_LINES" | grep -cE "$DECL_PAT" || true)
fi
if [ -n "$REMOVED_LINES" ]; then
  DECL_REMOVED=$(printf '%s\n' "$REMOVED_LINES" | grep -cE "$DECL_PAT" || true)
fi

DECL_NET=$((DECL_ADDED - DECL_REMOVED))

# ---------------------------------------------------------------------------
# Signal 3: Whole test-file deletion
# ---------------------------------------------------------------------------
DELETED_FILES=$(git diff --diff-filter=D --name-only origin/main...HEAD -- "${TEST_GLOBS[@]}" 2>/dev/null || true)

# ---------------------------------------------------------------------------
# Evaluate signals and report
# ---------------------------------------------------------------------------
VIOLATION=0
VIOLATION_MSGS=()

if [ "$SKIP_NET" -gt 0 ]; then
  VIOLATION=1
  VIOLATION_MSGS+=("  - Signal 1: $SKIP_NET net disabling-skip(s) added (.skip / xit / xdescribe)")
fi

if [ "$DECL_NET" -lt 0 ]; then
  VIOLATION=1
  NET_REMOVED=$((-DECL_NET))
  VIOLATION_MSGS+=("  - Signal 2: $NET_REMOVED net test declaration(s) removed")
fi

if [ -n "$DELETED_FILES" ]; then
  VIOLATION=1
  while IFS= read -r f; do
    VIOLATION_MSGS+=("  - Signal 3: test file deleted: $f")
  done <<< "$DELETED_FILES"
fi

if [ "$VIOLATION" -eq 0 ]; then
  exit 0
fi

# Build the message lines for the heredoc
MSG_LINES=""
for msg in "${VIOLATION_MSGS[@]}"; do
  MSG_LINES="${MSG_LINES}${msg}
"
done

cat >&2 <<EOF
ERROR: Test-integrity violation

This PR weakens the test suite. CI cannot auto-merge it.

Violations detected:
${MSG_LINES}
DO NOT skip or delete tests to make CI pass. The correct responses are:

  1. RESTORE the removed or disabled test, then fix the underlying code so
     the test passes — this is the preferred path.

  2. ESCALATE to office-hours if the test is genuinely obsolete or the fix
     requires scope beyond this PR. Document why in the PR body.

Re-deleting or re-disabling the test will re-trigger this check and re-block
auto-merge. fix-checks will route you here again.
EOF
exit 1
