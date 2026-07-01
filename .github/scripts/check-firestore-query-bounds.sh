#!/usr/bin/env bash
# Full-repo Firestore getDocs query-bounds decay sensor.
#
# Flags every unbounded `getDocs(...)` call in the repository's TS/TSX sources.
# Unlike the diff-scoped type-safety sensor, this is a FULL-REPO scan: it walks
# `git ls-files` and reads each file's WHOLE contents, so it catches decay
# anywhere in the tree, not just on a PR's added lines.
#
# A `getDocs` site is UNBOUNDED (and therefore flagged) unless one of these
# holds:
#
#   1. The associated Firestore query carries a `limit(...)` clause. The query
#      is either inline (`getDocs(query(...))`) or a variable resolved by
#      scanning backward for its nearest `const q = query(...)` assignment
#      within the enclosing function. `limit(` is detected over the whole
#      associated query span (all its physical lines concatenated).
#
#   2. A `// query-bounds-ok: <reason>` marker with a NON-EMPTY reason appears
#      either on the `getDocs` line itself or on any single physical line of the
#      resolved query span.
#
# Suppression: append `// query-bounds-ok: <reason>` to the getDocs line (the
# required escape hatch for shapes like a ternary-branched query where a static
# `limit(` scan can't prove boundedness). A NON-EMPTY reason suppresses the
# site; an empty reason (`// query-bounds-ok:` with nothing after) does NOT.
#
# Epic convention (D3): `// query-bounds-ok: <reason>` is a member of the shared
# `// <sensor>-ok: <reason>` decay-sensor marker family under parent epic #2686.
# Sibling sensors adopt the same marker shape rather than invent ad-hoc
# microsyntaxes.
#
# Subtle correctness point: `limit(` is detected over the CONCATENATED query
# span, but the suppression marker is detected PER PHYSICAL LINE. Running the
# marker check over a concatenated span would let an empty-reason marker on one
# line see the NEXT line's code as its "reason" and wrongly suppress. The two
# detections deliberately differ.
#
# Limitation: a stray `limit(` inside a comment inside the query span is an
# accepted false-negative (out of scope, like the type-safety sensor's trailing
# line-comment limitation). Backward variable resolution stops at a function
# boundary; an unresolved variable is flagged conservatively.
#
# Invocation:
#   check-firestore-query-bounds.sh
#       Default (CI) path. Walks `git ls-files` over TS/TSX sources (excluding
#       test/spec files and packages/rules-test), scans each file's full
#       contents, and collects every violation across the whole repo.
#
#   check-firestore-query-bounds.sh --scan-stdin [<filename>]
#       Core path. Reads ONE file's full contents on STDIN and scans it; no git
#       state is touched. The optional <filename> (default `<stdin>`) is used
#       only to label `::error file=...` annotations. This is the testable entry
#       point.
#
# Exit codes (both paths): 1 if any violation was found, 0 otherwise. All
# violations across the whole scan are collected; the scan does not stop on the
# first match.
#
# NOTE: the awk core targets mawk (Ubuntu CI default), so it avoids `\s`, `\b`,
# `\d`, `gensub()`, and `length(array)`, which mawk does not support.
set -euo pipefail

# --- CORE SCANNER -----------------------------------------------------------
# Reads ONE file's full contents on stdin, emits `::error file=...,line=N::...`
# annotations for unbounded getDocs sites, and returns 1 if any were found.
scan_file() {
  local fname="${1:-<stdin>}"
  awk -v fname="$fname" '
    { arr[NR] = $0 }

    END {
      n = NR
      violations = 0

      for (i = 1; i <= n; i++) {
        line = arr[i]

        # ANCHORED getDocs call. Leading anchor stops mockGetDocs( from
        # matching; getDoc( without the trailing s never matches.
        if (line !~ /(^|[^A-Za-z0-9_$])getDocs\(/) continue

        # (a) getDocs-line marker escape hatch: a non-empty reason on the
        # getDocs line itself passes the site.
        if (has_marker(line)) continue

        # (b) Extract the getDocs argument.
        match(line, /(^|[^A-Za-z0-9_$])getDocs\(/)
        after = substr(line, RSTART + RLENGTH)   # text right after the "("
        sub(/^[ \t]+/, "", after)

        inline = 0
        variable = 0
        id = ""

        if (after ~ /^query[ \t]*\(/) {
          inline = 1
        } else if (match(after, /^[A-Za-z_$][A-Za-z0-9_$]*/)) {
          id = substr(after, RSTART, RLENGTH)
          rest = substr(after, RSTART + RLENGTH)
          sub(/^[ \t]+/, "", rest)
          if (rest ~ /^\)/) variable = 1
          else inline = 1
        } else {
          inline = 1
        }

        # (b/c) Build the associated query span (array of physical line
        # indices) and decide.
        spanCount = 0
        flagged = 0

        if (inline) {
          # Gather line i forward to the statement terminator.
          for (k = i; k <= n; k++) {
            spanCount++
            span[spanCount] = k
            if (arr[k] ~ /;[ \t\r]*$/) break
          }
        } else {
          # VARIABLE: scan backward for the nearest assignment within the
          # enclosing function.
          idre = id
          gsub(/\$/, "\\$", idre)
          assignRe = "(^|[^A-Za-z0-9_$])" idre "[ \t]*=([^=>]|$)"
          assignAt = 0
          for (j = i - 1; j >= 1; j--) {
            if (arr[j] ~ assignRe) { assignAt = j; break }
            # Function-boundary markers stop the backward scan.
            if (arr[j] ~ /(^|[^A-Za-z0-9_$])function([^A-Za-z0-9_$]|$)/ ||
                arr[j] ~ /=>/ ||
                arr[j] ~ /(^|[^A-Za-z0-9_$])async([^A-Za-z0-9_$]|$)/ ||
                arr[j] ~ /^[ \t]*}[ \t]*$/) break
          }
          if (assignAt == 0) {
            # Unresolved variable -> conservative flag.
            flagged = 1
          } else {
            # Gather from the assignment line forward to the terminator.
            for (k = assignAt; k <= n; k++) {
              spanCount++
              span[spanCount] = k
              if (arr[k] ~ /;[ \t\r]*$/) break
            }
          }
        }

        if (flagged) {
          emit(fname, i)
          continue
        }

        # (c) limit() over the CONCATENATED span.
        joined = ""
        for (s = 1; s <= spanCount; s++) joined = joined arr[span[s]] "\n"
        hasLimit = (joined ~ /limit[ \t]*\(/)

        # (d) marker PER PHYSICAL LINE over {getDocs line i} U {span lines}.
        hasMarker = 0
        if (has_marker(arr[i])) hasMarker = 1
        for (s = 1; s <= spanCount && !hasMarker; s++) {
          if (has_marker(arr[span[s]])) hasMarker = 1
        }

        if (!hasLimit && !hasMarker) emit(fname, i)
      }

      if (violations > 0) exit 1
    }

    # Non-empty query-bounds-ok marker present on this single physical line?
    function has_marker(text,    rest) {
      if (match(text, /\/\/[ \t]*query-bounds-ok:/)) {
        rest = substr(text, RSTART + RLENGTH)
        if (rest ~ /[^ \t\r\n]/) return 1
      }
      return 0
    }

    function emit(path, line) {
      gsub(/,/, "%2C", path)
      printf "::error file=%s,line=%d::Unbounded Firestore getDocs query (add a limit() or a // query-bounds-ok: <reason> marker).\n", path, line
      violations++
    }
  '
}

# --- ENTRY POINTS -----------------------------------------------------------

# Core path: scan one file piped on stdin, no git state.
if [ "${1:-}" = "--scan-stdin" ]; then
  scan_file "${2:-<stdin>}"
  exit $?
fi

if [ -n "${1:-}" ]; then
  echo "Unknown argument: $1" >&2
  exit 1
fi

# Default path: full-repo wrapper. No origin/main, no fetch-depth.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# Enumerate TS/TSX sources, dropping test/spec files and the rules-test package.
# `grep -v` returns non-zero when it filters everything out; the `|| true`
# guard keeps an empty match set from aborting the pipeline under `set -e`.
files="$(git ls-files -- '*.ts' '*.tsx' \
  | grep -vE '(/(test|tests)/|\.test\.tsx?$|\.spec\.tsx?$|^packages/rules-test/)' || true)"

found=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  # OR the per-file exit codes: any violation makes the whole run exit 1. Do
  # not let a single file's non-zero exit abort the loop.
  if ! scan_file "$f" < "$f"; then
    found=1
  fi
done <<EOF
$files
EOF

exit "$found"
