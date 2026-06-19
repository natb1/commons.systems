#!/usr/bin/env bash
# Diff-scoped net-new type-safety escape-hatch sensor.
#
# Flags type-safety escape hatches that a PR *introduces* on added lines,
# relative to origin/main. It does NOT flag escape hatches that already exist
# on origin/main — only net-new ones in the branch's diff. The six hatches:
#
#   1. @ts-ignore                (comment directive)
#   2. @ts-expect-error          (comment directive)
#   3. eslint-disable[-line|-next-line]  (comment directive)
#   4. `any` in type position    (: any | as any | <any | any[] | any>)
#   5. `as <Type>` cast          (as unknown / as string / as Foo / ...; not `as const`)
#   6. non-null assertion `!`    (foo!.bar, arr[0]! ; not !=, !==, !!x, leading !foo)
#
# Suppression: append `// type-safety-ok: <reason>` to an added line. A
# NON-EMPTY reason suppresses the whole line (no rule runs on it). An empty
# reason (`// type-safety-ok:` with nothing after) does NOT suppress.
#
# Epic convention (D3): `// type-safety-ok: <reason>` is the shared suppression
# marker family for all six code-quality decay sensors (#2062-#2067). Sibling
# sensors should adopt the same `// <sensor>-ok: <reason>` shape rather than
# invent ad-hoc microsyntaxes.
#
# Accepted tradeoff (D1): editing a line that already carried a hatch shows in
# the diff as an addition, so it is flagged. Acceptable — the suppression
# marker is the escape.
#
# Limitation (D2): full string-literal / block-comment stripping in bash/awk is
# out of scope. Only a trailing `//` line-comment is stripped before the code
# rules run. Residual false positives are covered by the suppression marker.
#
# Invocation:
#   check-type-safety-escapes.sh
#       Default (CI) path. Diffs origin/main...HEAD over TS/JS files and scans
#       the unified diff. Hard-errors if origin/main is unresolvable.
#
#   check-type-safety-escapes.sh --scan-stdin
#       Core path. Reads a unified diff on STDIN and scans it; no git state is
#       touched. This is the testable entry point — Unit 2's test pipes
#       synthetic diffs through it.
#
# Exit codes (both paths): 1 if any violation was found, 0 otherwise. All
# violations across the whole diff are collected; the scan does not stop on the
# first match.
#
# NOTE: the awk core targets mawk (Ubuntu CI default), so it avoids `\s` and
# `\b`, which mawk does not support.
set -euo pipefail

# --- CORE SCANNER -----------------------------------------------------------
# Reads a unified diff on stdin, emits `::error file=...,line=N::...`
# annotations for net-new escape hatches, and returns 1 if any were found.
scan_diff() {
  awk '
    BEGIN { violations = 0 }

    # File header for the new side: "+++ b/<path>" (note the trailing space,
    # which distinguishes it from an added source line beginning "+++").
    /^\+\+\+ / {
      path = substr($0, 5)            # strip "+++ "
      sub(/^b\//, "", path)           # strip the "b/" prefix
      if (path == "/dev/null") path = ""
      next
    }
    /^--- / { next }                  # old-side header; ignore

    # Hunk header: "@@ -a,b +c,d @@" or "@@ -a +c @@". The new-file start line
    # is the number after the "+".
    /^@@ / {
      line = 0
      if (match($0, /\+[0-9]+/)) {
        line = substr($0, RSTART + 1, RLENGTH - 1) + 0
      }
      next
    }

    # Added line: starts with "+" but is not a "+++ " header.
    /^\+/ {
      process(substr($0, 2), path, line)
      line++
      next
    }

    # Removed line: does NOT advance the new-file counter.
    /^-/ { next }

    # Anything else (context line " ", "\ No newline...", etc.) advances the
    # counter. With -U0 there are no context lines, but handle them anyway.
    { line++ }

    END { if (violations > 0) exit 1 }

    function emit(path, line, hatch) {
      printf "::error file=%s,line=%d::Net-new type-safety escape hatch (%s). Suppress with `// type-safety-ok: <reason>` if intentional.\n", path, line, hatch
      violations++
    }

    function process(content, path, line,    s, code) {
      # 1. SUPPRESSION (first). A non-empty reason after the marker suppresses
      #    the whole line. An empty reason does not.
      if (match(content, /\/\/[ \t]*type-safety-ok:/)) {
        rest = substr(content, RSTART + RLENGTH)
        if (rest ~ /[^ \t]/) return    # non-empty reason -> suppressed
        # empty reason -> fall through and keep checking
      }

      # 2. COMMENT-BASED rules: match against the FULL line.
      if (content ~ /@ts-ignore/)        emit(path, line, "@ts-ignore")
      if (content ~ /@ts-expect-error/)  emit(path, line, "@ts-expect-error")
      if (content ~ /eslint-disable/)    emit(path, line, "eslint-disable")

      # 3. CODE rules: strip a trailing // line-comment first.
      code = content
      if (match(code, /\/\//)) code = substr(code, 1, RSTART - 1)

      # `any` in type position. Anchored so anything/many/Company do not match.
      if (code ~ /:[ \t]*any([^A-Za-z0-9_$]|$)/ ||
          code ~ /(^|[^A-Za-z0-9_$])as[ \t]+any([^A-Za-z0-9_$]|$)/ ||
          code ~ /<any([^A-Za-z0-9_$]|$)/ ||
          code ~ /any\[\]/ ||
          code ~ /any>/) {
        emit(path, line, "any in type position")
      }

      # `as <Type>` cast. Excludes import/export alias lines and `as const`.
      # `as any` is owned by the any rule above, so exclude lowercase `any`
      # from this alternation.
      if (!(code ~ /^[ \t]*(import|export)([^A-Za-z0-9_$]|$)/) &&
          !(code ~ /[ \t]from[ \t]*['"'"'"]/) &&
          !(code ~ /^[ \t]*[A-Za-z0-9_$]+[ \t]+as[ \t]+[A-Za-z0-9_$]+,?[ \t]*$/)) {
        if (code ~ /(^|[^A-Za-z0-9_$])as[ \t]+(unknown|string|number|boolean|object|symbol|bigint|[A-Z_$])/) {
          emit(path, line, "as <Type> cast")
        }
      }

      # non-null assertion `!`: a word/closing char, then `!`, not followed by `=`.
      if (code ~ /[]A-Za-z0-9_)]![^=]/ || code ~ /[]A-Za-z0-9_)]!$/) {
        emit(path, line, "non-null assertion !")
      }
    }
  '
}

# --- ENTRY POINTS -----------------------------------------------------------

# Core path: scan a diff piped on stdin, no git state.
if [ "${1:-}" = "--scan-stdin" ]; then
  scan_diff
  exit $?
fi

# Default path: thin git wrapper.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# origin/main must be resolvable. No HEAD~1 fallback — CI uses fetch-depth: 0,
# and an unresolvable baseline is a misconfigured environment, not a no-op.
if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
  echo "::error::check-type-safety-escapes: origin/main is not resolvable; cannot compute the net-new diff. Ensure the workflow checks out with fetch-depth: 0 and that origin/main is fetched." >&2
  cat >&2 <<'EOF'
ERROR: cannot resolve origin/main

This sensor diffs the branch against origin/main to find net-new type-safety
escape hatches. `git rev-parse --verify origin/main` failed, so there is no
baseline to diff against.

In CI this usually means the checkout was shallow. Use `fetch-depth: 0` (or
explicitly fetch origin/main) before running this script.
EOF
  exit 1
fi

# Diff the new side of TS/JS changes only. --diff-filter=d drops deletions so
# we never scan removed files. -U0 keeps the diff to added/removed lines.
diff_output="$(git diff --no-color -U0 --diff-filter=d origin/main...HEAD \
  -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs')"

# Self-noop: nothing in scope changed.
if [ -z "$diff_output" ]; then
  exit 0
fi

printf '%s\n' "$diff_output" | scan_diff
exit $?
