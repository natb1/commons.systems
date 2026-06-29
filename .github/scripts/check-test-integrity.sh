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
#
# Single-line comment lines (`+ // it(...)` / `- // it(...)`) are excluded so
# that commenting-out a test is NOT scored as a live declaration. Without this,
# replacing `it('x', fn)` with `// it('x', fn)` would net DECL_REMOVED=1 /
# DECL_ADDED=1 → zero → a complete evasion of Signal 2. The `\b` word boundary
# in DECL_PAT is satisfied by the space after `//`, so the comment line would
# otherwise match. Dropping commented lines from the ADDED set means a
# comment-out shows as a net declaration removal (Signal 2 fires); dropping them
# from the REMOVED set means un-commenting a test is not penalized.
# ---------------------------------------------------------------------------
ADDED_LINES=$(printf '%s\n' "$DIFF" | grep '^+' | grep -v '^+++' | grep -vE '^\+[[:space:]]*//' || true)
REMOVED_LINES=$(printf '%s\n' "$DIFF" | grep '^-' | grep -v '^---' | grep -vE '^-[[:space:]]*//' || true)

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
SKIP_PAT_A='\b(it|test|describe)\.skip[[:space:]]*\([[:space:]]*["'"'"'`]'
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
#   Matches: it( / test( / describe( / it.each(...)( / test.each`...`( / etc.
#   Does NOT match: it.skip( (no '.skip' in the pattern) — so a
#   skip-conversion (it → it.skip) is caught here as a net removal.
#
# Two OR-ed alternatives so every declaration form is counted independently:
#   - `\b(it|test|describe)[[:space:]]*\(` — plain calls AND the closing `(` of
#     any `.each(...)` / `.each` ... form (the function call's own open paren).
#   - `\b(it|test|describe)\.each\b` — `.each` declarations whose argument is a
#     nested call (`it.each(getCases())('t', fn)`) or a template literal
#     (`` test.each`${a}`('t', fn) ``), where the earlier alternative's `[^)]*`
#     /paren-balancing would otherwise miss the line.
# A single line is counted once by grep -cE regardless of how many alternatives
# match, so plain calls are not double-counted.
# ---------------------------------------------------------------------------
DECL_PAT='\b(it|test|describe)[[:space:]]*\(|\b(it|test|describe)\.each\b'

DECL_ADDED=0
DECL_REMOVED=0

if [ -n "$ADDED_LINES" ]; then
  DECL_ADDED=$(printf '%s\n' "$ADDED_LINES" | grep -cE "$DECL_PAT" || true)
fi
if [ -n "$REMOVED_LINES" ]; then
  DECL_REMOVED=$(printf '%s\n' "$REMOVED_LINES" | grep -cE "$DECL_PAT" || true)
fi

# ---------------------------------------------------------------------------
# Signal 3: Whole test-file deletion
# ---------------------------------------------------------------------------
DELETED_FILES=$(git diff --diff-filter=D --name-only origin/main...HEAD -- "${TEST_GLOBS[@]}" 2>/dev/null || true)

# ---------------------------------------------------------------------------
# Co-deletion exemption: a test file deleted alongside its implementation file
# is not a test-integrity violation — it is an intentional feature removal.
# Exclude such files from Signal 2 (declaration removal count) and Signal 3.
#
# Matching: strip the .test/.spec suffix to get the base name (e.g.
# usage-history-chart.test.ts → usage-history-chart), then check whether any
# non-test file with that base name was also deleted in this PR. If so, the
# test file and its declarations are exempt from both signals.
# ---------------------------------------------------------------------------
EXEMPT_DECL_REMOVED=0
NON_EXEMPT_DELETED=()

if [ -n "$DELETED_FILES" ]; then
  DELETED_IMPL=$(git diff --diff-filter=D --name-only origin/main...HEAD 2>/dev/null \
    | grep -vE '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
  while IFS= read -r test_file; do
    [ -z "$test_file" ] && continue
    base_name=$(basename "$test_file" | sed -E 's/\.(test|spec)\.(ts|tsx|js|jsx)$//')
    if printf '%s\n' "$DELETED_IMPL" | grep -qE "(^|/)${base_name}\.(ts|tsx|js|jsx)$"; then
      FILE_DIFF=$(git diff --unified=0 origin/main...HEAD -- "$test_file" 2>/dev/null || true)
      if [ -n "$FILE_DIFF" ]; then
        FILE_REMOVED=$(printf '%s\n' "$FILE_DIFF" | grep '^-' | grep -v '^---' | grep -vE '^-[[:space:]]*//' || true)
        if [ -n "$FILE_REMOVED" ]; then
          FILE_DECL_REMOVED=$(printf '%s\n' "$FILE_REMOVED" | grep -cE "$DECL_PAT" || true)
          EXEMPT_DECL_REMOVED=$((EXEMPT_DECL_REMOVED + FILE_DECL_REMOVED))
        fi
      fi
    else
      NON_EXEMPT_DELETED+=("$test_file")
    fi
  done <<< "$DELETED_FILES"
fi

# Correct Signal 2 for co-deleted test files.
DECL_REMOVED=$((DECL_REMOVED - EXEMPT_DECL_REMOVED))
DECL_NET=$((DECL_ADDED - DECL_REMOVED))

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

if [ "${#NON_EXEMPT_DELETED[@]}" -gt 0 ]; then
  VIOLATION=1
  for f in "${NON_EXEMPT_DELETED[@]}"; do
    VIOLATION_MSGS+=("  - Signal 3: test file deleted: $f")
  done
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

  2. ESCALATE to office-hours if the fix requires scope beyond this PR.
     Document why in the PR body.

Re-deleting or re-disabling the test will re-trigger this check and re-block
auto-merge. fix-checks will route you here again.
EOF
exit 1
