#!/usr/bin/env bash
# lint-verify-fence-paths.sh — fail at the commit that orphans a fence-named path.
#
# THE INCIDENT CLASS THIS CLOSES: a script named inside a ```verify fence in a
# live (non-`done`) intention-node body was deleted, and nothing caught it.
# Each downstream node then hit the deletion at its OWN verification gate, as a
# generic "No such file or directory" — which every phase lane treats as an
# ambiguous failure, so the lane reverts and parks the node for human review.
# The signal arrived once per node, late, disguised, and expensive.
#
# This checker moves the signal to the commit that DELETES the file, in CI,
# loudly: for every non-`done` node it extracts the ```verify blocks (via the
# shared lib-verify-fence.sh parser, the same walk dispatch-run-verification
# runs) and asserts that every path-like token in them still exists.
#
# `done` nodes are NEVER scanned: their bodies are historical archives by
# design and may legitimately name paths that no longer exist.
#
# It is wired into run-lint.sh UNCONDITIONALLY — not behind a changed-files
# flag. That is deliberate: the failure mode is a DELETION, and any
# changed-files gate that stats the path on disk (lib.sh's `is_shell_script`,
# which drives RUN_PROSE) returns false for a deleted file, leaving exactly the
# case this guard exists to catch uncovered.
#
# TOKEN RULE (deliberately narrow — a false positive here would recreate the
# very park problem the guard prevents). Each verify-block line is split on
# whitespace; a token is a candidate only if ALL hold:
#   - it contains `/`
#   - it contains none of  $ * ? { } ( )   (no variables, no globs, no subshell)
#   - it is not a URL (no `://`)
#   - its first path segment is an existing top-level entry of the repo
#     (read live from the repo root, never a hardcoded list)
# A trailing `:<line>` or `:<line>-<line>` anchor is stripped before the
# existence test. Everything else is ignored.
#
# ORPHAN vs FORWARD REFERENCE: a missing path is reported only if git history
# shows it once existed. Plans legitimately name files their own unit will
# CREATE, and those never existed — flagging them would park the node this
# guard protects. See the `git log -1` check below.
#
# Output: one `<node-id>: <path>` line per miss on stdout; that message IS the
# remediation (it names exactly what to fix and where). Exit 1 if any miss
# survives the baseline, else exit 0 with no output.
#
# Usage:
#   lint-verify-fence-paths.sh [--intentions-dir DIR] [--repo-root DIR]
#                              [--baseline FILE]
#
# Exit codes:
#   0  no violations (or every violation is grandfathered by the baseline)
#   1  at least one new violation
#   2  bad usage / unreadable input
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-verify-fence.sh
source "$SCRIPT_DIR/lib-verify-fence.sh"

REPO_ROOT=""
INTENTIONS_DIR=""
BASELINE_FILE="$SCRIPT_DIR/verify-fence-path-baseline.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      [[ $# -lt 2 ]] && { echo "lint-verify-fence-paths.sh: --repo-root requires an argument" >&2; exit 2; }
      REPO_ROOT="$2"; shift 2 ;;
    --intentions-dir)
      [[ $# -lt 2 ]] && { echo "lint-verify-fence-paths.sh: --intentions-dir requires an argument" >&2; exit 2; }
      INTENTIONS_DIR="$2"; shift 2 ;;
    --baseline)
      [[ $# -lt 2 ]] && { echo "lint-verify-fence-paths.sh: --baseline requires an argument" >&2; exit 2; }
      BASELINE_FILE="$2"; shift 2 ;;
    -h|--help)
      echo "usage: lint-verify-fence-paths.sh [--intentions-dir DIR] [--repo-root DIR] [--baseline FILE]"
      echo "  0  no violations   1  at least one new violation   2  bad usage"
      exit 0 ;;
    *)
      echo "lint-verify-fence-paths.sh: unexpected argument: $1" >&2
      echo "usage: lint-verify-fence-paths.sh [--intentions-dir DIR] [--repo-root DIR] [--baseline FILE]" >&2
      exit 2 ;;
  esac
done

if [[ -z "$REPO_ROOT" ]]; then
  if ! REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"; then
    echo "lint-verify-fence-paths.sh: could not resolve the repo root" >&2
    exit 2
  fi
fi
[[ -n "$INTENTIONS_DIR" ]] || INTENTIONS_DIR="$REPO_ROOT/intentions"

if [[ ! -d "$INTENTIONS_DIR" ]]; then
  echo "lint-verify-fence-paths.sh: not a directory: $INTENTIONS_DIR" >&2
  exit 2
fi

# --- Grandfather baseline ---------------------------------------------------
# Same rollout pattern as packages/intentionsutil/prose-ref-baseline.json and
# plan-body-baseline.json: a JSON array of {id, path} objects naming violations
# that already existed when this check landed, so introducing the check does not
# retroactively break main. It ships EMPTY (a sibling unit swept every live
# violation first) and it must NOT grow: a newly orphaned fence path is a
# violation to FIX, not a baseline entry to add.
declare -A BASELINE=()
if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "lint-verify-fence-paths.sh: baseline file not found: $BASELINE_FILE" >&2
  exit 2
fi
if ! BASELINE_KEYS="$(jq -r 'if (type == "array") and (all(.[]; type == "object" and (.id | type == "string") and (.path | type == "string")))
                             then (.[] | "\(.id)|\(.path)")
                             else error("expected a JSON array of {id, path} objects") end' "$BASELINE_FILE" 2>&1)"; then
  echo "lint-verify-fence-paths.sh: malformed baseline: $BASELINE_FILE: $BASELINE_KEYS" >&2
  exit 2
fi
while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  BASELINE["$key"]=1
done <<<"$BASELINE_KEYS"

# --- Top-level repo entries -------------------------------------------------
# Read live rather than hardcoded, so the leading-segment filter tracks the repo
# instead of a stale guess.
declare -A TOPLEVEL=()
for entry in "$REPO_ROOT"/* "$REPO_ROOT"/.*; do
  base="$(basename "$entry")"
  [[ "$base" == "." || "$base" == ".." ]] && continue
  [[ -e "$entry" ]] || continue
  TOPLEVEL["$base"]=1
done

# Read a node file's frontmatter `phase` value (empty when absent). Only the
# leading `---` block is inspected, so a `phase:` line in the BODY (e.g. prose
# documenting the phase enum) is never mistaken for frontmatter.
node_phase() {
  local file="$1"
  awk '
    NR == 1 { if ($0 != "---") exit; next }
    $0 == "---" { exit }
    /^phase:[[:space:]]*/ {
      sub(/^phase:[[:space:]]*/, "")
      sub(/[[:space:]]+$/, "")
      print
      exit
    }
  ' "$file"
}

FOUND=0
declare -A SEEN=()

for file in "$INTENTIONS_DIR"/*.md; do
  [[ -e "$file" ]] || continue
  node_id="$(basename "$file" .md)"

  # Archive exemption: a `done` node's body is a historical record.
  [[ "$(node_phase "$file")" == "done" ]] && continue

  body="$(tr -d '\0' < "$file")"
  declare -a blocks=()
  unclosed=0
  extract_verify_blocks "$body" blocks unclosed
  # An unclosed fence is an authoring problem for dispatch-run-verification to
  # report (exit 5), not a dead path — nothing to check here.
  [[ "$unclosed" -eq 1 ]] && continue
  [[ "${#blocks[@]}" -eq 0 ]] && continue

  for block in "${blocks[@]}"; do
    while IFS= read -r line; do
      declare -a tokens=()
      read -r -a tokens <<<"$line" || true
      for token in "${tokens[@]:-}"; do
        [[ -z "$token" ]] && continue
        # Strip surrounding shell quoting/backticks and trailing separators;
        # they are punctuation of the surrounding command, not part of a path.
        while [[ "$token" == [\"\'\`]* ]]; do token="${token#?}"; done
        while [[ "$token" == *[\"\'\`,\;] ]]; do token="${token%?}"; done
        [[ -z "$token" ]] && continue

        [[ "$token" == */* ]] || continue
        [[ "$token" == *'://'* ]] && continue
        case "$token" in
          *'$'*|*'*'*|*'?'*|*'{'*|*'}'*|*'('*|*')'*) continue ;;
        esac

        # Leading path segment must be a real top-level entry of the repo.
        # (Empty when the token is absolute — an absolute path is not a
        # repo-relative reference, so it is ignored.)
        head_seg="${token%%/*}"
        [[ -n "$head_seg" ]] || continue
        [[ -n "${TOPLEVEL["$head_seg"]:-}" ]] || continue

        # Strip a trailing `:<line>` / `:<line>-<line>` anchor.
        stripped="$token"
        if [[ "$stripped" =~ ^(.*):[0-9]+(-[0-9]+)?$ ]]; then
          stripped="${BASH_REMATCH[1]}"
        fi
        [[ -n "$stripped" ]] || continue

        [[ -e "$REPO_ROOT/$stripped" ]] && continue

        # A missing path is only an ORPHAN if it once existed. A plan's verify
        # block routinely names files the unit will CREATE (its own new test
        # file, a new script) — those never existed, have no git history, and
        # flagging them would be a false positive that parks the very node the
        # guard exists to protect. `git log -1 -- <path>` over HEAD's history is
        # the exact discriminator: empty for a forward reference, non-empty for
        # a path a commit created and a later commit deleted — including the
        # deleting commit itself, which is when this guard must fire.
        if [[ -z "$(git -C "$REPO_ROOT" log -1 --format=%H -- "$stripped" 2>/dev/null)" ]]; then
          continue
        fi

        key="$node_id|$stripped"
        [[ -n "${SEEN[$key]:-}" ]] && continue
        SEEN["$key"]=1
        [[ -n "${BASELINE[$key]:-}" ]] && continue

        echo "$node_id: $stripped"
        FOUND=1
      done
    done <<<"$block"
  done
done

exit "$FOUND"
