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
# Symmetric false-negative path: a `// type-safety-ok:` marker *inside a string
# literal* on the same line as a real hatch will suppress that hatch
# (`process()` matches the marker against the full raw line before any string
# stripping). The marker prefix is project-specific and unlikely to appear in
# strings by accident, so the practical risk is low.
#
# Invocation:
#   check-type-safety-escapes.sh [--repo-root <dir>]
#       Default (CI) path. Diffs TS/JS files against the baseline
#       resolve-diff-base.sh resolves, and scans the unified diff. Hard-errors
#       if that baseline is unresolvable.
#
#       --repo-root names the checkout to scan. It defaults to the repo
#       containing the CWD, and a divergence between that and the repo this
#       script file lives in is a hard error naming the flag — running one
#       checkout's copy of this script against a different checkout is a
#       routine dispatch pattern, but only safe when the target is named.
#       run-lint.sh:229 passes it explicitly, mirroring what it already does
#       for lint-verify-fence-paths.sh at :179.
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

    # Old-side header "--- a/<path>" arms the new-side header rule. A line
    # beginning "+++ " is only a file header when it immediately follows a
    # "--- " line; otherwise it is an added source line (e.g. "++ x; const y =
    # z as any;") that must be scanned, not consumed as a header.
    /^--- / { in_diff_header = 1; next }

    # File header for the new side: "+++ b/<path>", only when armed by a
    # preceding "--- " line.
    in_diff_header && /^\+\+\+ / {
      path = substr($0, 5)            # strip "+++ "
      sub(/^b\//, "", path)           # strip the "b/" prefix
      if (path == "/dev/null") path = ""
      in_diff_header = 0
      next
    }
    { in_diff_header = 0 }            # any other line disarms the header rule

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

    # "\ No newline at end of file" marker: not a real source line, so it must
    # NOT advance the new-file counter.
    /^\\/  { next }

    # Anything else (context line " ", etc.) advances the counter. With -U0
    # there are no context lines, but handle them anyway.
    { line++ }

    END { if (violations > 0) exit 1 }

    function emit(path, line, hatch) {
      gsub(/,/, "%2C", path)
      printf "::error file=%s,line=%d::Net-new type-safety escape hatch (%s). Suppress with `// type-safety-ok: <reason>` if intentional.\n", path, line, hatch
      violations++
    }

    function process(content, path, line,    rest, code) {
      # 1. SUPPRESSION (first). A non-empty reason after the marker suppresses
      #    the whole line. An empty reason does not.
      if (match(content, /\/\/[ \t]*type-safety-ok:/)) {
        rest = substr(content, RSTART + RLENGTH)
        if (rest ~ /[^ \t\r\n]/) return    # non-empty reason -> suppressed
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
      if (!(code ~ /^[ \t]*(import|export)[^{]*\{/) &&
          !(code ~ /[ \t]from[ \t]*['"'"'"]/)) {
        if (code ~ /(^|[^A-Za-z0-9_$])as[ \t]+(unknown|string|number|boolean|object|symbol|bigint|never|null|undefined|void|[A-Z_$])/) {
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
REPO_ROOT=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo-root)
      if [ "$#" -lt 2 ]; then
        echo "check-type-safety-escapes: --repo-root requires an argument" >&2
        exit 1
      fi
      REPO_ROOT="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# SCRIPT_REPO_ROOT is the checkout this script FILE lives in. It is used to
# locate resolve-diff-base.sh — a tool, which must exist next to this script —
# and never to decide which tree to scan. Those are different questions, and
# conflating them is what made this script scan repoA when invoked by absolute
# path from repoB.
SCRIPT_REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RESOLVE_DIFF_BASE="$SCRIPT_REPO_ROOT/.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh"

if [ -z "$REPO_ROOT" ]; then
  # Default to the CALLER's CWD, with a divergence guard — the same contract
  # lint-verify-fence-paths.sh:168-181 and resolve-diff-base.sh apply. This
  # script used to pin the tree to its own on-disk location unconditionally,
  # so `repoA/.github/scripts/check-type-safety-escapes.sh` run from repoB
  # scanned repoA: usually clean, hence an empty diff, hence a vacuous pass.
  if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "check-type-safety-escapes: could not resolve a repo root from $PWD" >&2
    echo "  pass --repo-root to name the tree to scan" >&2
    exit 1
  fi
  # Both sides of this comparison must come from `rev-parse --show-toplevel`,
  # which returns the SYMLINK-RESOLVED path. SCRIPT_REPO_ROOT comes from
  # `cd … && pwd`, which is LOGICAL — it keeps whatever symlinked spelling $PWD
  # or $0 carried. Comparing the two normalizations makes one checkout reached
  # through a symlink (macOS /tmp -> /private/tmp, a symlinked workspace) read
  # as two different trees and abort on the tree it is standing in.
  SCRIPT_GIT_ROOT="$(git -C "$SCRIPT_REPO_ROOT" rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$SCRIPT_GIT_ROOT" ] && [ "$SCRIPT_GIT_ROOT" != "$REPO_ROOT" ]; then
    echo "check-type-safety-escapes: script lives in $SCRIPT_GIT_ROOT but the CWD resolves to $REPO_ROOT;" >&2
    echo "  pass --repo-root to name the tree to scan" >&2
    exit 1
  fi
fi

# Baseline resolution — see resolve-diff-base.sh. It subsumes the
# `rev-parse --verify origin/main` guard that used to live here (its diagnostic
# is strictly more informative), and it additionally refuses the case that
# guard could not see: HEAD already contained in origin/main, where the old
# `origin/main...HEAD` range was EMPTY and the `[ -z "$diff_output" ]` self-noop
# below turned that into exit 0. --at-remote-tip first-parent because this
# sensor runs on pushes to `main` too, unconditionally, inside the REQUIRED
# `lint` job (run-lint.sh:229) as well as the type-safety-sensor jobs.
DIFF_BASE=$("$RESOLVE_DIFF_BASE" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)

# Diff the new side of TS/JS changes only. --diff-filter=d drops deletions so
# we never scan removed files. -U0 keeps the diff to added/removed lines.
# -C "$REPO_ROOT" is what makes the tree scanned the one NAMED, rather than
# whichever repository the process CWD happens to sit in.
diff_output="$(git -C "$REPO_ROOT" diff --no-color -U0 --diff-filter=d "$DIFF_BASE"..HEAD \
  -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs')"

# Self-noop: nothing in scope changed.
if [ -z "$diff_output" ]; then
  exit 0
fi

printf '%s\n' "$diff_output" | scan_diff
exit $?
