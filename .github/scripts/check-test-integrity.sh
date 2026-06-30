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
# Test files the basename loop below already exempted. The import-based loop
# (issue #2637) MUST skip these so EXEMPT_DECL_REMOVED is not double-counted —
# over-subtraction could drive DECL_REMOVED negative, flip DECL_NET positive,
# and MASK a real weakening elsewhere in the same PR.
BASENAME_EXEMPT_FILES=()

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
      # Record for the import-based loop's double-counting guard.
      BASENAME_EXEMPT_FILES+=("$test_file")
    else
      NON_EXEMPT_DELETED+=("$test_file")
    fi
  done <<< "$DELETED_FILES"
fi

# ---------------------------------------------------------------------------
# Import-based co-deletion exemption (issue #2637).
#
# The basename exemption above fires only when a non-test impl file of MATCHING
# BASENAME was co-DELETED. It misses legitimate dead-code cleanup where the
# subject symbols were removed from a MODIFIED source file (no whole-file
# deletion). Motivating case PR #2633: CachedRangeReader/fetchArchiveBuffer/
# getChunk/putChunk were removed from a modified image-archive.ts plus their
# tests (net -14 declarations); all changed files were MODIFIED, so the basename
# path did not apply and the PR could land only via human override-merge.
#
# Rule (file-granular): exempt a test file's removed declarations when EVERY
# symbol that file STOPPED IMPORTING in this PR is now ABSENT from the post-PR
# non-test source tree. If the imported subject is gone, deleting the test that
# exercised it is cleanup, not weakening.
#
# Correctness spine — two conservatism axes, BOTH directions stated:
#
#   * Removed-import extraction. UNDER-capture is DANGEROUS: missing a
#     still-imported, still-existing symbol could wrongly exempt and let
#     weakening slip. OVER-capture is SAFE: an extra name merely has to also be
#     proven absent, which biases toward FIRING. Hence we parse the WHOLE old
#     and new blobs and take a true OLD-minus-NEW set difference — NOT a parse
#     of raw removed diff lines. That is why a symbol merely re-imported on a
#     reformatted line nets out: PR #2633's removed line
#       import { createImageArchiveRenderer, CachedRangeReader } from "…"
#     dropped CachedRangeReader but createImageArchiveRenderer survives on the
#     new line, so the set difference correctly yields only CachedRangeReader.
#
#   * Existence check. FALSE-ABSENT is DANGEROUS: a missed declaration/export
#     form reads as "gone" → wrongly exempt → masks weakening. FALSE-PRESENT is
#     SAFE for soundness (it only over-fires, hurting efficacy): a bare
#     substring would match `Cache` inside `CacheManager` and over-fire
#     ("Hole 1"). Hence we match WORD-BOUNDARY declaration/export forms, never
#     bare substrings, against the post-PR tree (HEAD) minus the test globs.
#
#   * Bias when uncertain → FIRE. Any still-present removed-import symbol, any
#     unverifiable (namespace/default) removed import, or an empty removed-import
#     set ⇒ NOT exempt.
#
# Double-counting guard: files already exempted by the basename loop are in
# BASENAME_EXEMPT_FILES and skipped here (see the note at its declaration).
#
# set -e safety: every git grep / git show / grep here either runs in an
# `if …; then` CONDITION (where a no-match exit 1 is harmless) or carries
# `|| true`, mirroring the existing guards at :77/:78/:97.
# ---------------------------------------------------------------------------

# Pure-exclude pathspecs for the existence check: the post-PR tree minus tests.
EXCLUDE_PATHSPECS=()
for g in "${TEST_GLOBS[@]}"; do
  EXCLUDE_PATHSPECS+=(":(exclude)$g")
done

# awk program: print the tagged import bindings of a TS/JS source blob, one per
# line. `N:<name>` = a NAMED binding's IMPORTED (source) name — the symbol to
# existence-check. `U:<name>` = a namespace (`import * as ns`) or default
# (`import Foo from`) binding, whose name is NOT a source symbol we can check;
# its presence in the removed set forces a bias-to-fire.
#
# Multi-line `import { … }` blocks are joined into one logical statement before
# member extraction — THE reason to parse the whole blob, not diff lines. Only
# brace blocks span lines; namespace/default/side-effect imports are single-line.
# `import { Foo as Bar }` yields `Foo` (left of `as`). `import type { A }`
# yields `A` (type-only imports participate).
IMPORT_AWK='
function emit_named(brace,   names, n, i, name) {
  n = split(brace, names, ",")
  for (i = 1; i <= n; i++) {
    name = names[i]
    gsub(/^[ \t]+/, "", name); gsub(/[ \t]+$/, "", name)
    sub(/^type[ \t]+/, "", name)
    sub(/[ \t]+as[ \t]+.*$/, "", name)
    gsub(/^[ \t]+/, "", name); gsub(/[ \t]+$/, "", name)
    if (name != "") print "N:" name
  }
}
function process(stmt,   lb, rb, pre, name) {
  lb = index(stmt, "{")
  if (lb > 0) {
    rb = index(stmt, "}")
    if (rb > lb) emit_named(substr(stmt, lb + 1, rb - lb - 1))
    # A default binding can precede the brace: import Foo, { Bar } from "…"
    pre = substr(stmt, 1, lb - 1)
    sub(/^[ \t]*import[ \t]+/, "", pre)
    sub(/^type[ \t]+/, "", pre)
    gsub(/[ \t]/, "", pre)
    sub(/,$/, "", pre)
    if (pre != "" && pre != "type") print "U:" pre
    return
  }
  if (stmt ~ /import[ \t]*\*[ \t]*as[ \t]+/) {
    name = stmt
    sub(/^.*import[ \t]*\*[ \t]*as[ \t]+/, "", name)
    sub(/[ \t].*$/, "", name)
    gsub(/[^A-Za-z0-9_$]/, "", name)
    if (name != "") print "U:" name
    return
  }
  if (stmt ~ /^[ \t]*import[ \t]+[A-Za-z_$]/) {
    name = stmt
    sub(/^[ \t]*import[ \t]+/, "", name)
    sub(/[ \t].*$/, "", name)
    gsub(/[^A-Za-z0-9_$]/, "", name)
    if (name != "" && name != "type") print "U:" name
  }
}
/^[ \t]*import[ \t]/ {
  if (collecting) { process(buf); buf = ""; collecting = 0 }
  if ($0 ~ /from/) { process($0); next }                 # complete single-line
  if ($0 ~ /\{/ && $0 !~ /\}/) { buf = $0; collecting = 1; next }  # open brace block
  process($0); next                                      # side-effect / no-from
}
collecting {
  buf = buf " " $0
  if ($0 ~ /\}/ || $0 ~ /from/) { process(buf); buf = ""; collecting = 0 }
  next
}
END { if (collecting) process(buf) }
'

# Candidate test files changed vs origin/main (Modified files too, not just
# deletions). || true guards set -e if the diff is empty.
IMPORT_CANDIDATES=$(git diff --name-only origin/main...HEAD -- "${TEST_GLOBS[@]}" 2>/dev/null || true)

while IFS= read -r F; do
  [ -z "$F" ] && continue

  # Skip files the basename loop already exempted (double-counting guard).
  already_exempt=0
  if [ "${#BASENAME_EXEMPT_FILES[@]}" -gt 0 ]; then
    for bf in "${BASENAME_EXEMPT_FILES[@]}"; do
      if [ "$bf" = "$F" ]; then already_exempt=1; break; fi
    done
  fi
  if [ "$already_exempt" -eq 1 ]; then continue; fi

  # Per-file net-removal filter: only files that net-remove declarations have
  # anything to exempt. Mirror the comment-exclusion filters at :78/:160.
  F_DIFF=$(git diff --unified=0 origin/main...HEAD -- "$F" 2>/dev/null || true)
  [ -z "$F_DIFF" ] && continue
  F_REMOVED=$(printf '%s\n' "$F_DIFF" | grep '^-' | grep -v '^---' | grep -vE '^-[[:space:]]*//' || true)
  F_ADDED=$(printf '%s\n' "$F_DIFF" | grep '^+' | grep -v '^+++' | grep -vE '^\+[[:space:]]*//' || true)
  F_DECL_REMOVED=0
  F_DECL_ADDED=0
  if [ -n "$F_REMOVED" ]; then
    F_DECL_REMOVED=$(printf '%s\n' "$F_REMOVED" | grep -cE "$DECL_PAT" || true)
  fi
  if [ -n "$F_ADDED" ]; then
    F_DECL_ADDED=$(printf '%s\n' "$F_ADDED" | grep -cE "$DECL_PAT" || true)
  fi
  if [ "$((F_DECL_REMOVED - F_DECL_ADDED))" -le 0 ]; then continue; fi

  # Removed-import set via OLD-minus-NEW whole-file parse (NOT raw diff lines).
  # OLD blob: F changed vs origin/main, so it normally existed there; an empty
  # OLD (F added-in-PR) yields an empty removed set ⇒ no exemption (fire) — the
  # no-defensive-fallback path. NEW blob absent ⇒ F deleted in PR ⇒ new set
  # empty (EXPECTED, not an error).
  OLD_SRC=$(git show "origin/main:$F" 2>/dev/null || true)
  NEW_SRC=$(git show "HEAD:$F" 2>/dev/null || true)
  OLD_TAGS=$(printf '%s\n' "$OLD_SRC" | awk "$IMPORT_AWK" | sort -u || true)
  NEW_TAGS=$(printf '%s\n' "$NEW_SRC" | awk "$IMPORT_AWK" | sort -u || true)

  if [ -z "$OLD_TAGS" ]; then
    REMOVED_TAGS=""
  elif [ -z "$NEW_TAGS" ]; then
    REMOVED_TAGS="$OLD_TAGS"
  else
    # Lines in OLD not present in NEW. grep -v returns 1 when all filtered out.
    REMOVED_TAGS=$(printf '%s\n' "$OLD_TAGS" | grep -vxF -- "$NEW_TAGS" || true)
  fi

  REMOVED_NAMED=$(printf '%s\n' "$REMOVED_TAGS" | sed -n 's/^N://p' || true)
  HAS_UNVERIFIABLE_REMOVED_IMPORT=0
  if printf '%s\n' "$REMOVED_TAGS" | grep -q '^U:'; then
    HAS_UNVERIFIABLE_REMOVED_IMPORT=1
  fi

  # (a) Empty removed-import set ⇒ no exemption (closes vacuous-true).
  if [ -z "$REMOVED_NAMED" ]; then continue; fi
  # (b) A removed namespace/default import is unverifiable ⇒ bias to fire.
  if [ "$HAS_UNVERIFIABLE_REMOVED_IMPORT" -eq 1 ]; then continue; fi

  # (c) Existence check: exempt only if EVERY removed-import symbol is ABSENT
  # from the post-PR non-test tree (HEAD minus test globs). Word-boundary
  # declaration/export forms only — never bare substrings. A git grep no-match
  # exits 1 inside the if-condition (harmless); a MATCH ⇒ symbol present ⇒ fire.
  all_absent=1
  for X in $REMOVED_NAMED; do
    DECL_FORM="(export[[:space:]]+)?(async[[:space:]]+)?(const|let|var|function|class|type|interface|enum)[[:space:]]+${X}\b"
    DEFAULT_FORM="export[[:space:]]+default[[:space:]]+(async[[:space:]]+)?(function[[:space:]]+|class[[:space:]]+)?${X}\b"
    NAMED_EXPORT_FORM="export[[:space:]]*\{[^}]*\b${X}\b[^}]*\}"
    EXIST_PAT="${DECL_FORM}|${DEFAULT_FORM}|${NAMED_EXPORT_FORM}"
    if git grep -qE "$EXIST_PAT" HEAD -- "${EXCLUDE_PATHSPECS[@]}"; then
      all_absent=0
      break
    fi
  done

  if [ "$all_absent" -eq 1 ]; then
    # All removed-import subjects are gone → deleting F's tests is cleanup.
    # Same raw-count accounting as :163 — added declarations are never credited.
    EXEMPT_DECL_REMOVED=$((EXEMPT_DECL_REMOVED + F_DECL_REMOVED))
  fi
done <<< "$IMPORT_CANDIDATES"

# Correct Signal 2 for co-deleted test files (both exemption loops above).
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
