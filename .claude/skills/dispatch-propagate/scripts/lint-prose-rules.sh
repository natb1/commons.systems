#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Detect: echo "$VAR" | jq  (quoted variable form only — see .claude/rules/shell-json.md)
# Single-quoted to prevent the shell from interpreting \$ as $ (which would make
# \$ an ERE end-anchor, breaking the match).
PATTERN='echo[[:space:]]+"\$[A-Za-z_][A-Za-z0-9_]*"[[:space:]]*\|[[:space:]]*jq'

# Compute the unified-0 diff of added lines in .sh files against origin/main.
# Run from REPO_ROOT so that relative paths in diff output are consistent.
if ! DIFF=$(git -C "$REPO_ROOT" diff origin/main...HEAD --unified=0 -- '*.sh'); then
  echo "ERROR: could not diff origin/main...HEAD for *.sh files" >&2
  exit 1
fi

# Hunk header regex: @@ -a[,b] +c[,d] @@ ...
# Stored in a variable to avoid bare-word regex splitting issues under set -e.
HUNK_RE='^@@ -[0-9]+(,[0-9]+)? \+([0-9]+)(,[0-9]+)? @@'

CURRENT_PATH=""
LINE_NUM=0
VIOLATIONS=()

while IFS= read -r line; do
  # +++ header: new-file path (or /dev/null for deleted files)
  if [[ "$line" == '+++ '* ]]; then
    rest="${line#+++ }"
    if [[ "$rest" == '/dev/null' ]]; then
      CURRENT_PATH=""
    else
      # Strip leading b/ prefix from diff paths
      CURRENT_PATH="${rest#b/}"
    fi
    LINE_NUM=0
    continue
  fi

  # --- header: ignore (marks old-file side)
  if [[ "$line" == '--- '* ]]; then
    continue
  fi

  # Hunk header: extract the new-side start line number
  if [[ "$line" =~ $HUNK_RE ]]; then
    LINE_NUM="${BASH_REMATCH[2]}"
    continue
  fi

  # Added content line: starts with + but NOT ++
  if [[ "$line" == '+'* ]] && [[ "$line" != '++'* ]]; then
    # Strip the leading +
    content="${line:1}"

    # Skip comment lines (first non-whitespace character is #)
    trimmed="${content#"${content%%[! ]*}"}"
    if [[ "$trimmed" == '#'* ]]; then
      LINE_NUM=$(( LINE_NUM + 1 ))
      continue
    fi

    # Test against the anti-pattern
    if [[ "$content" =~ $PATTERN ]]; then
      VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: ${content}")
    fi

    LINE_NUM=$(( LINE_NUM + 1 ))
    continue
  fi

  # Everything else (diff headers, index lines, - lines): ignore.
  # Do not advance the new-side line counter for these.

done <<<"$DIFF"

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo "FAIL: echo-into-jq violations found in net-new .sh lines:" >&2
  for v in "${VIOLATIONS[@]}"; do
    echo "  $v" >&2
  done
  cat >&2 <<'REMEDIATION'

Remediation — replace the offending line with one of:

  jq -r .field <<<"$VAR"            # here-string: no escape interpretation
  gh ... --json field --jq .field   # let gh filter its in-memory JSON
  printf '%s' "$VAR" | jq -r .field # printf does not interpret escapes

Why this matters (.claude/rules/shell-json.md): zsh's builtin echo interprets
backslash escapes (\t, \n, \uXXXX) by default. A bash script committed here
may be sourced into zsh; using echo-into-jq is banned project-wide for
uniformity and review clarity. The original recurrence (#1170) was interactive
zsh Bash-tool usage, which is not a committed file — this rule is a project
convention for committed .sh files, not a claim that the bug occurs in bash.

See: .claude/rules/shell-json.md
REMEDIATION
  exit 1
fi

echo "PASS: no net-new echo-into-jq violations in added .sh lines"
