#!/usr/bin/env bash
# parse-job-extract.sh — parse a budget parse-job issue body and resolve the
# named statement file under a shared statements directory.
#
# A parse-job issue is filed by dispatch-statements-scan with a body that always
# carries exactly these two backtick-wrapped lines (the data itself is NEVER in
# the issue — only the filename and the content hash):
#
#   - File: `<base>`
#   - sha256: `<hash>`
#
# This helper keeps the body-parsing, recursive file lookup, and hash
# verification OUT of the model (per the greenfield + delegation lens): the
# SKILL.md just calls a subcommand and reads its stdout.
#
# Subcommands:
#
#   parse [<body-file>]
#     Read the issue body (from <body-file>, or stdin if omitted) and print two
#     lines to stdout:
#       file=<base>
#       sha256=<hash>
#     Exit non-zero with a clear diagnostic if the `- File:` or `- sha256:` line
#     is missing or malformed.
#
#   locate <dir> <base> <hash>
#     Recursively find a file named <base> under <dir>, verify its sha256 equals
#     <hash>, and print the resolved ABSOLUTE path to stdout. Exit non-zero with
#     a clear diagnostic on: not-found, ambiguous (more than one match), or sha
#     mismatch.
#
#   resolve [<body-file>] --dir <dir>
#     Convenience: `parse` then `locate` in one call. Prints three lines:
#       file=<base>
#       sha256=<hash>
#       path=<abs-path>
#
# Per .claude/rules/code-style.md every failure is a clear, descriptive error on
# stderr with a non-zero exit — never a silent fallback. The caller (the
# /budget-parse-job handler) maps any non-zero exit to a dispatch-mark-deviation
# escalation.
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
usage:
  parse-job-extract.sh parse [<body-file>]
  parse-job-extract.sh locate <dir> <base> <hash>
  parse-job-extract.sh resolve [<body-file>] --dir <dir>
EOF
}

# ---- extract_field <label> — read body from stdin, print the backtick value --
# Matches a line of the exact dispatch-statements-scan form:
#   - <label>: `<value>`
# <label> is "File" or "sha256". Prints <value> on success (exit 0); prints
# nothing and exits 1 when no such line is present.
extract_field() {
  local label="$1" body="$2" value
  # grep the first matching line, then strip everything up to the opening
  # backtick and the trailing backtick. The leading "- " and label are fixed by
  # the scan's body template.
  value=$(printf '%s\n' "$body" \
    | grep -m1 -E "^- ${label}: \`[^\`]+\`[[:space:]]*$" || true)
  if [[ -z "$value" ]]; then
    return 1
  fi
  # Strip "- <label>: `" prefix and "`" suffix.
  value="${value#*\`}"
  value="${value%\`*}"
  printf '%s' "$value"
}

cmd_parse() {
  local body
  if [[ $# -gt 1 ]]; then
    echo "parse-job-extract.sh parse: at most one body-file argument" >&2
    usage
    exit 2
  fi
  if [[ $# -eq 1 ]]; then
    if [[ ! -f "$1" ]]; then
      echo "parse-job-extract.sh parse: body file not found: $1" >&2
      exit 2
    fi
    body=$(cat "$1")
  else
    body=$(cat)
  fi

  local file sha
  if ! file=$(extract_field "File" "$body"); then
    echo "parse-job-extract.sh parse: no '- File: \`<name>\`' line in issue body" >&2
    exit 1
  fi
  if ! sha=$(extract_field "sha256" "$body"); then
    echo "parse-job-extract.sh parse: no '- sha256: \`<hash>\`' line in issue body" >&2
    exit 1
  fi

  # The scan rejects control characters at file time, but the body is untrusted
  # input here — re-validate the parsed basename so a poisoned issue cannot
  # smuggle a path separator or control char into the downstream find.
  if [[ "$file" == */* ]]; then
    echo "parse-job-extract.sh parse: File value '$file' must be a bare basename, not a path" >&2
    exit 1
  fi
  if [[ "$file" == *[$'\001'-$'\037']* ]]; then
    echo "parse-job-extract.sh parse: File value contains control characters" >&2
    exit 1
  fi
  if [[ ! "$sha" =~ ^[0-9a-fA-F]{64}$ ]]; then
    echo "parse-job-extract.sh parse: sha256 value '$sha' is not a 64-hex-char digest" >&2
    exit 1
  fi

  printf 'file=%s\n' "$file"
  printf 'sha256=%s\n' "$sha"
}

cmd_locate() {
  if [[ $# -ne 3 ]]; then
    echo "parse-job-extract.sh locate: requires <dir> <base> <hash>" >&2
    usage
    exit 2
  fi
  local dir="$1" base="$2" want="$3"

  if [[ ! -d "$dir" ]]; then
    echo "parse-job-extract.sh locate: directory not found: $dir" >&2
    exit 1
  fi
  if [[ "$base" == */* ]]; then
    echo "parse-job-extract.sh locate: base '$base' must be a bare basename" >&2
    exit 1
  fi

  # Recursive find by exact basename. -print0 + mapfile -d '' is whitespace- and
  # newline-safe. Regular files only.
  local matches=()
  mapfile -d '' -t matches < <(find "$dir" -type f -name "$base" -print0)

  if [[ "${#matches[@]}" -eq 0 ]]; then
    echo "parse-job-extract.sh locate: no file named '$base' found under '$dir'" >&2
    exit 1
  fi
  if [[ "${#matches[@]}" -gt 1 ]]; then
    {
      echo "parse-job-extract.sh locate: ambiguous — ${#matches[@]} files named '$base' under '$dir':"
      printf '  %s\n' "${matches[@]}"
    } >&2
    exit 1
  fi

  local found="${matches[0]}"
  local got
  if ! got=$(sha256sum "$found" 2>/dev/null | awk '{print $1}') || [[ -z "$got" ]]; then
    echo "parse-job-extract.sh locate: sha256sum failed for '$found'" >&2
    exit 1
  fi
  # Case-insensitive hex comparison.
  if [[ "${got,,}" != "${want,,}" ]]; then
    echo "parse-job-extract.sh locate: sha256 mismatch for '$found': expected $want, got $got" >&2
    exit 1
  fi

  # Emit the absolute path.
  local abs
  abs=$(cd "$(dirname "$found")" && pwd)/"$(basename "$found")"
  printf '%s\n' "$abs"
}

cmd_resolve() {
  # resolve [<body-file>] --dir <dir>
  local body_file="" dir=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dir)
        [[ $# -ge 2 ]] || { echo "parse-job-extract.sh resolve: --dir requires a value" >&2; exit 2; }
        dir="$2"; shift 2 ;;
      *)
        if [[ -z "$body_file" ]]; then
          body_file="$1"; shift
        else
          echo "parse-job-extract.sh resolve: unexpected argument '$1'" >&2
          usage; exit 2
        fi ;;
    esac
  done
  if [[ -z "$dir" ]]; then
    echo "parse-job-extract.sh resolve: --dir <dir> is required" >&2
    usage; exit 2
  fi

  local parsed file sha
  if [[ -n "$body_file" ]]; then
    parsed=$(cmd_parse "$body_file")
  else
    parsed=$(cmd_parse)
  fi
  file=$(printf '%s\n' "$parsed" | sed -n 's/^file=//p')
  sha=$(printf '%s\n' "$parsed" | sed -n 's/^sha256=//p')

  local path
  path=$(cmd_locate "$dir" "$file" "$sha")

  printf 'file=%s\n' "$file"
  printf 'sha256=%s\n' "$sha"
  printf 'path=%s\n' "$path"
}

main() {
  local sub="${1:-}"
  shift || true
  case "$sub" in
    parse)   cmd_parse "$@" ;;
    locate)  cmd_locate "$@" ;;
    resolve) cmd_resolve "$@" ;;
    -h|--help|"")
      usage
      [[ -z "$sub" ]] && exit 2 || exit 0 ;;
    *)
      echo "parse-job-extract.sh: unknown subcommand '$sub'" >&2
      usage
      exit 2 ;;
  esac
}

main "$@"
