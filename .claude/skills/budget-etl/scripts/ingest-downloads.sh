#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# usage
# ---------------------------------------------------------------------------
if [[ $# -ne 2 ]]; then
  echo "usage: ingest-downloads.sh <downloads-dir> <statements-dir>" >&2
  exit 1
fi

downloads="$1"
statements="$2"

if [[ ! -d "$downloads" ]]; then
  echo "ingest-downloads: downloads dir does not exist or is not a directory: $downloads" >&2
  exit 1
fi

# Temp file for capturing identify-qfx.sh stderr per file. Cleaned on exit.
err_tmp="$(mktemp "${TMPDIR:-/tmp}/ingest-qfx-err.XXXXXX")"
trap 'rm -f "$err_tmp"' EXIT

# ---------------------------------------------------------------------------
# Enumerate statement files (non-recursive, case-insensitive extensions)
# ---------------------------------------------------------------------------
files=()
while IFS= read -r -d '' file; do
  files+=("$file")
done < <(find "$downloads" -maxdepth 1 -type f \
           \( -iname '*.qfx' -o -iname '*.ofx' -o -iname '*.csv' -o -iname '*.pdf' \) \
           -print0)

if [[ ${#files[@]} -eq 0 ]]; then
  printf 'no statement files in %s\n' "$downloads"
  exit 0
fi

# ---------------------------------------------------------------------------
# PASS 1: classify every file; accumulate failures before moving anything
# ---------------------------------------------------------------------------
# Parallel arrays: indices match between files[], institutions[], accounts[].
institutions=()
accounts=()
failures=()

for file in "${files[@]}"; do
  rc=0
  out=$("$SCRIPT_DIR/identify-qfx.sh" "$file" 2>"$err_tmp") || rc=$?
  if [[ $rc -ne 0 ]]; then
    reason="$(cat "$err_tmp" 2>/dev/null || true)"
    failures+=("$file: ${reason:-unknown error}")
  else
    # Output line: <file>\t<institution>\t<account>
    institution="$(printf '%s' "$out" | cut -f2)"
    account="$(printf '%s' "$out" | cut -f3)"
    institutions+=("$institution")
    accounts+=("$account")
  fi
done

if [[ ${#failures[@]} -gt 0 ]]; then
  printf 'ingest-downloads: classification failed for %d file(s) — nothing moved\n' \
    "${#failures[@]}" >&2
  for reason in "${failures[@]}"; do
    printf '  %s\n' "$reason" >&2
  done
  exit 1
fi

# ---------------------------------------------------------------------------
# PASS 2: move every file (all classifications succeeded)
# ---------------------------------------------------------------------------
for i in "${!files[@]}"; do
  file="${files[$i]}"
  institution="${institutions[$i]}"
  account="${accounts[$i]}"

  targetdir="$statements/$institution/$account"
  mkdir -p "$targetdir"

  base="$(basename "$file")"
  target="$targetdir/$base"

  # Collision handling: insert timestamp before the extension.
  if [[ -e "$target" ]]; then
    ts="$(date +%Y-%m-%dT%H-%M-%S)"
    ext="${base##*.}"
    stem="${base%.*}"
    if [[ "$base" == *.* && "$ext" != "$base" ]]; then
      # Has a real extension (e.g. stmt.qfx → stem=stmt, ext=qfx)
      collision="${stem}.${ts}.${ext}"
    else
      # No extension (e.g. "stmt" with no dot)
      collision="${base}.${ts}"
    fi
    target="$targetdir/$collision"
  fi

  mv "$file" "$target"
  printf '%s to %s\n' "$file" "$target"
done

exit 0
