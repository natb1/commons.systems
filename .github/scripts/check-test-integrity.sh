#!/usr/bin/env bash
# Check for test-integrity violations in the current PR vs the resolved
# baseline (origin/main on a branch, HEAD^1 on a push to main).
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
# Usage: check-test-integrity.sh [--repo-root <dir>]
#   --repo-root names the checkout to check. It defaults to the repo containing
#   the CWD, and a divergence between that and the repo this script file lives
#   in is a hard error naming the flag.
#
# Requires: git, grep, bash, and the sibling resolve-diff-base.sh (also pure
# bash + git — no node/nix/npm needed).
set -euo pipefail

# Test file globs passed as pathspecs to git diff.
TEST_GLOBS=(
  '*.test.ts'
  '*.test.tsx'
  '*.spec.ts'
  '*.spec.tsx'
)

# ---------------------------------------------------------------------------
# Baseline resolution — see resolve-diff-base.sh.
#
# This gate's whole job is to notice a deleted or disabled test, so a vacuous
# EMPTY diff is the one outcome it must never produce silently. It used to spell
# its range `origin/main...HEAD` in six places; on a push to `main`
# actions/checkout leaves origin/main pointing AT the pushed commit, so all six
# expanded to HEAD..HEAD, the `[ -z "$DIFF" ]` check below returned exit 0, and
# deleting a test file in a commit pushed to main passed this gate in silence.
# --at-remote-tip first-parent asks what the push introduced.
#
# The tree is NAMED (--repo-root, then -C on every diff) rather than inherited
# from the process CWD: this script had no repo root at all and was entirely
# cwd-relative, so invoking it by absolute path from another checkout diffed
# that checkout instead — usually clean, hence empty, hence green.
# ---------------------------------------------------------------------------
REPO_ROOT=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo-root)
      if [ "$#" -lt 2 ]; then
        echo "check-test-integrity: --repo-root requires an argument" >&2
        exit 1
      fi
      REPO_ROOT="$2"
      shift 2
      ;;
    *)
      echo "check-test-integrity: unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# SCRIPT_REPO_ROOT is the checkout this script FILE lives in. It locates the
# helper — a tool, which must sit beside this script — and never decides which
# tree to check. Those are different questions.
SCRIPT_REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RESOLVE_DIFF_BASE="$SCRIPT_REPO_ROOT/.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh"

if [ -z "$REPO_ROOT" ]; then
  if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "check-test-integrity: could not resolve a repo root from $PWD" >&2
    echo "  pass --repo-root to name the tree to check" >&2
    exit 1
  fi
  # Both sides of this comparison must come from `rev-parse --show-toplevel`,
  # which returns the SYMLINK-RESOLVED path. SCRIPT_REPO_ROOT comes from
  # `cd … && pwd`, which is LOGICAL — it keeps whatever symlinked spelling $PWD
  # or $0 carried. Comparing the two normalizations makes one checkout reached
  # through a symlink (macOS /tmp -> /private/tmp, a symlinked workspace) read
  # as two different trees and abort on the tree it is standing in. Same
  # contract, same spelling, as resolve-diff-base.sh's own self-vs-CWD root
  # compare-and-abort.
  SCRIPT_GIT_ROOT="$(git -C "$SCRIPT_REPO_ROOT" rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$SCRIPT_GIT_ROOT" ] && [ "$SCRIPT_GIT_ROOT" != "$REPO_ROOT" ]; then
    echo "check-test-integrity: script lives in $SCRIPT_GIT_ROOT but the CWD resolves to $REPO_ROOT;" >&2
    echo "  pass --repo-root to name the tree to check" >&2
    exit 1
  fi
else
  # NORMALIZE an explicit --repo-root to the work tree's TOPLEVEL. Every git
  # call below is `git -C "$REPO_ROOT"`, and git resolves a pathspec relative to
  # that directory's PREFIX within the repo. A --repo-root naming a
  # SUBDIRECTORY therefore scopes $TEST_GLOBS and $EXCLUDE_PATHSPECS to that
  # subdirectory while resolve-diff-base.sh (which normalizes) returns a base
  # for the whole repo: a test deleted anywhere outside it falls out of $DIFF,
  # the `[ -z "$DIFF" ]` early exit reads "nothing touched test files", and this
  # required gate passes having examined part of a tree. Measured: from a
  # subdirectory prefix, `git diff --diff-filter=D --name-only <base>..HEAD --
  # '*.test.ts'` returns nothing for a test deleted in a sibling directory.
  RAW_REPO_ROOT="$REPO_ROOT"
  if ! REPO_ROOT="$(git -C "$RAW_REPO_ROOT" rev-parse --show-toplevel 2>/dev/null)"; then
    echo "check-test-integrity: --repo-root '$RAW_REPO_ROOT' is not inside a git work tree" >&2
    exit 1
  fi
fi

DIFF_BASE=$("$RESOLVE_DIFF_BASE" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)

# ---------------------------------------------------------------------------
# Capture diff — exit clearly on failure (never silently narrow to HEAD~1).
# ---------------------------------------------------------------------------
# STDOUT ONLY into $DIFF. `$(git … 2>&1)` splices git's stderr into the VALUE,
# and git writes to stderr on its SUCCESS path too (GIT_TRACE=1, an ambiguous
# refname, a CRLF advisory). Those lines match neither `^+` nor `^-`, so the
# signal counters below ignore them — but they make $DIFF non-empty, which
# defeats the `[ -z "$DIFF" ]` clean-pass early exit and runs the whole gate
# over text git never meant as diff output. Same contract, same reason, as
# resolve-diff-base.sh's git_capture and get-changed-apps.sh's merge-base
# capture. Errors are not swallowed: the failure path quotes the stderr file and
# the success path forwards it to the log.
DIFF=""
DIFF_ERR_FILE=$(mktemp)
DIFF_RC=0
DIFF=$(git -C "$REPO_ROOT" diff --unified=0 "$DIFF_BASE"..HEAD -- "${TEST_GLOBS[@]}" 2>"$DIFF_ERR_FILE") \
  || DIFF_RC=$?
if [ "$DIFF_RC" -ne 0 ]; then
  DIFF_ERR=$(cat "$DIFF_ERR_FILE")
  rm -f "$DIFF_ERR_FILE"
  cat >&2 <<EOF
ERROR: check-test-integrity: 'git diff ${DIFF_BASE}..HEAD' failed in $REPO_ROOT.

This is a required blocking gate. The diff against the resolved baseline must
be computable. CI checks out with fetch-depth: 0 so origin/main is always
present. If this is a local run, fetch first:

  git fetch origin main

Raw error from git:
$DIFF_ERR
EOF
  exit 1
fi
if [ -s "$DIFF_ERR_FILE" ]; then
  cat "$DIFF_ERR_FILE" >&2
fi
rm -f "$DIFF_ERR_FILE"

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
DELETED_FILES=$(git -C "$REPO_ROOT" diff --diff-filter=D --name-only "$DIFF_BASE"..HEAD -- "${TEST_GLOBS[@]}")

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
  DELETED_ALL=$(git -C "$REPO_ROOT" diff --diff-filter=D --name-only "$DIFF_BASE"..HEAD)
  # The `|| true` below guards ONLY grep's no-match exit, never the git call:
  # under `set -o pipefail` a single `|| true` on the whole pipeline made a git
  # failure indistinguishable from "no implementation files were deleted".
  DELETED_IMPL=$(printf '%s\n' "$DELETED_ALL" \
    | grep -vE '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
  while IFS= read -r test_file; do
    [ -z "$test_file" ] && continue
    base_name=$(basename "$test_file" | sed -E 's/\.(test|spec)\.(ts|tsx|js|jsx)$//')
    # HERE-STRING, not a pipe. `grep -q` exits at the FIRST match, closing the
    # pipe while the writer is still writing; once $DELETED_IMPL exceeds the
    # 64 KiB pipe buffer the writer takes SIGPIPE, the pipeline's status under
    # `set -o pipefail` becomes 141, and this `if` reads FALSE on a list that
    # MATCHED. Measured: a 618 KB list whose first line matches gives "not
    # matched" through the pipe and "matched" through the here-string. The
    # inverted answer denies the co-deletion exemption, so a large feature
    # removal that deletes implementations alongside their tests fails this
    # required gate with a bogus Signal 3 violation. Same fix, same reason, as
    # detect-changes.sh's category tests.
    if grep -qE "(^|/)${base_name}\.(ts|tsx|js|jsx)$" <<<"$DELETED_IMPL"; then
      FILE_DIFF=$(git -C "$REPO_ROOT" diff --unified=0 "$DIFF_BASE"..HEAD -- "$test_file")
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
#     ("Hole 1"). Hence we parse each mentioning file's EXPORTED/DECLARED names
#     with EXPORT_AWK (declaration, default, and brace re-export forms — brace
#     blocks joined across lines) and test EXACT set membership, never a bare
#     substring and never an interpolated regex (so `$`-bearing identifiers like
#     `$factory` match literally), against the post-PR tree (HEAD) minus tests.
#
#   * Bias when uncertain → FIRE. Any still-present removed-import symbol, any
#     unverifiable (namespace/default) removed import, or an empty removed-import
#     set ⇒ NOT exempt. The exemption credit is symbol-granular: only removed
#     test declarations whose block references a gone symbol are exempted, so a
#     co-removed test for a still-present symbol cannot ride along.
#
# Double-counting guard: files already exempted by the basename loop are in
# BASENAME_EXEMPT_FILES and skipped here (see the note at its declaration).
#
# set -e safety: every git grep / git show / grep here either runs in an
# `if …; then` CONDITION (where a no-match exit 1 is harmless) or carries
# `|| true`, mirroring the existing guards at :182/:183/:202.
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
  # Order matters: classify an OPEN brace block first, so a member name that
  # merely contains "from" as a substring (fromEntries, dateFromNow) cannot be
  # misread as a complete single-line import. A complete single-line import has
  # both "{" and "}" (or no brace at all), so it never matches this branch.
  if ($0 ~ /\{/ && $0 !~ /\}/) { buf = $0; collecting = 1; next }  # open brace block
  # "from" as a keyword is followed by whitespace then the module-path quote;
  # a member substring like fromEntries is "from" followed by a letter, so the
  # whitespace anchor /from[ \t]/ does not match it.
  if ($0 ~ /from[ \t]/) { process($0); next }            # complete single-line
  process($0); next                                      # side-effect / no-from
}
collecting {
  buf = buf " " $0
  # A multi-line brace block always closes with "}" before its "from '...'"
  # clause, so "}" alone terminates collection. A bare /from/ substring test
  # here would prematurely end on any continuation member containing "from".
  if ($0 ~ /\}/) { process(buf); buf = ""; collecting = 0 }
  next
}
END { if (collecting) process(buf) }
'

# awk program: print the PUBLIC exported/declared names of a TS/JS source blob,
# one per line, for the existence check. Mirror of IMPORT_AWK but on the export
# side, so it must be LINE-oriented AND brace-aware:
#
#   * Declaration forms: export [default] [async] const|let|var|function|class|
#     type|interface|enum NAME  → NAME.
#   * Named-export braces: export { A, w as Widget }  → A and Widget. The PUBLIC
#     name is the one RIGHT of `as` (the import side reads the left/source name;
#     the export side exposes the right name). Multi-line `export {\n A,\n }`
#     blocks are joined before member extraction — the reason a line-by-line
#     `git grep` cannot see them (the original NAMED_EXPORT_FORM false-absent).
#
# The caller checks EXACT set membership (grep -xF) against these names, never a
# regex, so identifier characters that are ERE-special — notably `$` in
# `$factory`/`React$1` — are matched literally (the old interpolated-`$X` ERE
# miscompile). Emitting only real export/declaration forms (not bare word hits)
# keeps a comment mention of a deleted symbol from reading as "present".
EXPORT_AWK='
function emit_members(brace,   names, n, i, name) {
  n = split(brace, names, ",")
  for (i = 1; i <= n; i++) {
    name = names[i]
    gsub(/^[ \t]+/, "", name); gsub(/[ \t]+$/, "", name)
    sub(/^type[ \t]+/, "", name)          # export { type Foo }
    sub(/^.*[ \t]+as[ \t]+/, "", name)    # public name is right of `as`
    gsub(/[^A-Za-z0-9_$].*$/, "", name)   # keep the leading identifier only
    if (name != "") print name
  }
}
collecting_export {
  if ($0 ~ /\}/) {
    rb = index($0, "}")
    emit_members(ebuf " " substr($0, 1, rb - 1))
    collecting_export = 0; ebuf = ""
  } else {
    ebuf = ebuf " " $0
  }
  next
}
/^[ \t]*export[ \t{]/ {
  if ($0 ~ /export[ \t]*\{/) {                  # named-export brace
    lb = index($0, "{")
    if ($0 ~ /\}/) {
      rb = index($0, "}")
      emit_members(substr($0, lb + 1, rb - lb - 1))
    } else {
      ebuf = substr($0, lb + 1); collecting_export = 1   # open multi-line block
    }
    next
  }
  line = $0
  sub(/^[ \t]*export[ \t]+/, "", line)          # anchored — never greedy-bite a
  sub(/^default[ \t]+/, "", line)               # trailing-"export" identifier
  sub(/^async[ \t]+/, "", line)
  if (line ~ /^(const|let|var|function|class|type|interface|enum)[ \t]+/) {
    sub(/^(const|let|var|function|class|type|interface|enum)[ \t]+/, "", line)
    gsub(/[^A-Za-z0-9_$].*$/, "", line)
    if (line != "") print line
  }
  next
}
END { if (collecting_export) emit_members(ebuf) }
'

# awk program: count removed test declarations whose block REFERENCES a gone
# (REMOVED_NAMED) symbol — the symbol-granular credit that replaces the raw
# F_DECL_REMOVED file-granular credit. Gone names arrive space-separated in
# GONE (-v, so `$`-names are literal). A "block" runs from one removed `it(` /
# `test(` / `describe(` line up to the next; it is credited only if some
# identifier token in the block is a gone symbol. This denies credit to a
# co-removed test for a STILL-IMPORTED or inline-helper symbol (the red-team
# over-exemption), while still crediting legitimate gone-symbol cleanup.
ATTRIB_AWK='
BEGIN { n = split(GONE, g, " "); for (i = 1; i <= n; i++) if (g[i] != "") goneset[g[i]] = 1 }
function flush() { if (in_block && block_refs) credited++ }
{
  if ($0 ~ /(^|[^A-Za-z0-9_$.])(it|test|describe)[ \t]*\(/ ||
      $0 ~ /(^|[^A-Za-z0-9_$.])(it|test|describe)\.each([ \t]|\(|`|$)/) {
    flush(); in_block = 1; block_refs = 0
  }
  s = $0
  while (match(s, /[A-Za-z_$][A-Za-z0-9_$]*/)) {
    tok = substr(s, RSTART, RLENGTH)
    if (tok in goneset) block_refs = 1
    s = substr(s, RSTART + RLENGTH)
  }
}
END { flush(); print credited + 0 }
'

# Candidate test files changed vs the resolved baseline (Modified files too,
# not just deletions). An empty diff is a zero exit, so this needs no guard —
# and the `|| true` it used to carry hid a genuine git failure as "no
# candidates".
IMPORT_CANDIDATES=$(git -C "$REPO_ROOT" diff --name-only "$DIFF_BASE"..HEAD -- "${TEST_GLOBS[@]}")

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
  # anything to exempt. Mirror the comment-exclusion filters at :183/:284.
  F_DIFF=$(git -C "$REPO_ROOT" diff --unified=0 "$DIFF_BASE"..HEAD -- "$F")
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
  # OLD blob: F changed vs the RESOLVED BASELINE, so it normally existed there;
  # an empty OLD (F added-in-PR) yields an empty removed set ⇒ no exemption
  # (fire) — the no-defensive-fallback path. NEW blob absent ⇒ F deleted in PR ⇒
  # new set empty (EXPECTED, not an error).
  #
  # The old side is $DIFF_BASE, NOT `origin/main`. It must be the SAME revision
  # F_DIFF above was computed against, or the two disagree: on a push to `main`
  # $DIFF_BASE is HEAD^1 while origin/main IS HEAD, so `origin/main:$F` returned
  # the NEW content, OLD_TAGS == NEW_TAGS, the removed-import set came back
  # empty, and this whole exemption was structurally dead there — a dead-code
  # cleanup that passed the gate on its branch failed it again on `main` after
  # merge. Same "second source of truth for one value" defect lint-prose-rules.sh
  # removed by setting MERGE_BASE="$DIFF_BASE".
  #
  # -C "$REPO_ROOT" on every call below for the same reason as the diffs: the
  # tree read must be the one NAMED, not whichever repository the process CWD
  # happens to sit in.
  OLD_SRC=$(git -C "$REPO_ROOT" show "$DIFF_BASE:$F" 2>/dev/null || true)
  NEW_SRC=$(git -C "$REPO_ROOT" show "HEAD:$F" 2>/dev/null || true)
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
  # HERE-STRING, not a pipe, for the same reason as the co-deletion loop at
  # :281: `grep -q` exits at the first match and SIGPIPEs its writer, so past
  # the 64 KiB pipe buffer the pipeline returns 141 under `set -o pipefail` and
  # this `if` reads FALSE on tags that DID contain a `U:`. That skips the
  # bias-to-fire guard below — the dangerous direction.
  if grep -q '^U:' <<<"$REMOVED_TAGS"; then
    HAS_UNVERIFIABLE_REMOVED_IMPORT=1
  fi

  # (a) Empty removed-import set ⇒ no exemption (closes vacuous-true).
  if [ -z "$REMOVED_NAMED" ]; then continue; fi
  # (b) A removed namespace/default import is unverifiable ⇒ bias to fire.
  if [ "$HAS_UNVERIFIABLE_REMOVED_IMPORT" -eq 1 ]; then continue; fi

  # (c) Existence check: exempt only if EVERY removed-import symbol is ABSENT
  # from the post-PR non-test tree (HEAD minus test globs). Two steps per symbol:
  #   1. Fast literal pre-check — does X appear at all? `git grep -F` (fixed
  #      string) keeps `$`-bearing identifiers literal; a no-match (exit 1, in the
  #      if-condition) means X is absent everywhere ⇒ this symbol stays absent.
  #   2. For each mentioning file, parse its EXPORTED/DECLARED names with
  #      EXPORT_AWK (brace-aware, so multi-line `export { … }` is seen) and test
  #      EXACT membership. This rejects a bare comment/usage mention of X (only
  #      real export forms emit a name) and matches `$`-names literally.
  # A MATCH ⇒ symbol present ⇒ NOT exempt (bias to fire).
  all_absent=1
  for X in $REMOVED_NAMED; do
    # rc 0 = matched, rc 1 = no match (the "absent" answer this step wants),
    # anything else = git failed. A blanket `|| true` here would render a
    # failure indistinguishable from "absent", and absent is the direction that
    # WRONGLY EXEMPTS — the one bias this whole block says it must never take.
    #
    # git's stderr is NOT redirected. It was `2>/dev/null` back when the call
    # carried `|| true` and nothing downstream cared why it failed; now that
    # rc > 1 aborts a REQUIRED gate, discarding the reason would leave the
    # operator with a bare `rc=128` and no diagnosis — the same buried-error
    # shape the DIFF capture above and get-changed-apps.sh's merge-base capture
    # both exist to avoid. rc 0 and rc 1 write nothing, so nothing is added to
    # the log on the ordinary paths.
    set +e
    X_FILES=$(git -C "$REPO_ROOT" grep -lF -e "$X" HEAD -- "${EXCLUDE_PATHSPECS[@]}")
    x_grep_rc=$?
    set -e
    if [ "$x_grep_rc" -gt 1 ]; then
      echo "ERROR: check-test-integrity: 'git grep' failed (rc=$x_grep_rc) in $REPO_ROOT" >&2
      echo "  while checking whether the removed-import symbol '$X' still exists." >&2
      echo "  git's own error is immediately above this message." >&2
      exit 1
    fi
    [ -z "$X_FILES" ] && continue   # X mentioned nowhere ⇒ absent
    found=0
    while IFS= read -r XF; do
      [ -z "$XF" ] && continue
      # `git grep -l … HEAD` prefixes each path with `HEAD:`, so XF is already a
      # rev:path spec usable directly by git show (no extra `HEAD:` prefix).
      XF_SRC=$(git -C "$REPO_ROOT" show "$XF" 2>/dev/null || true)
      # The membership test reads a here-string, never a pipe. `grep -qxF`
      # exits at the FIRST match, closing the pipe while awk is still writing;
      # once the export list exceeds the 64 KiB pipe buffer awk takes SIGPIPE,
      # the pipeline returns 141 under `set -o pipefail`, and this `if` reads
      # FALSE — X reads as ABSENT on a file that EXPORTS it. False-absent is
      # the direction this block declares dangerous: it wrongly exempts, and a
      # real test weakening passes the gate. A generated barrel re-exporting a
      # few thousand names reaches that size. Same fix, same reason, as the
      # co-deletion loop at :281 and detect-changes.sh's category tests.
      XF_EXPORTS=$(printf '%s\n' "$XF_SRC" | awk "$EXPORT_AWK")
      if grep -qxF -- "$X" <<<"$XF_EXPORTS"; then
        found=1
        break
      fi
    done <<< "$X_FILES"
    if [ "$found" -eq 1 ]; then
      all_absent=0
      break
    fi
  done

  if [ "$all_absent" -eq 1 ]; then
    # Every removed-import subject is gone → deleting tests that exercised them
    # is cleanup. Credit is SYMBOL-GRANULAR (not the raw F_DECL_REMOVED): only
    # removed declarations whose block references a gone symbol are exempted, so
    # a co-removed test for a still-imported or inline-helper symbol is NOT swept
    # in (red-team over-exemption). Attributed ≤ F_DECL_REMOVED, so the global
    # DECL_REMOVED subtraction cannot go negative.
    GONE_SP=$(printf '%s\n' "$REMOVED_NAMED" | tr '\n' ' ')
    F_ATTRIB=$(printf '%s\n' "$F_REMOVED" | awk -v GONE="$GONE_SP" "$ATTRIB_AWK" || true)
    [ -z "$F_ATTRIB" ] && F_ATTRIB=0
    EXEMPT_DECL_REMOVED=$((EXEMPT_DECL_REMOVED + F_ATTRIB))
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
