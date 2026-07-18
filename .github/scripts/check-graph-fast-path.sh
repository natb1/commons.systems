#!/usr/bin/env bash
# Verify a graph/** fast-path push is intentions/-only, anchored to the pushed
# commit SHAs rather than to a moving ref.
#
# WHY NOT a three-dot `git diff origin/main...HEAD`: graph-commit pushes a
# scratch SHA to trigger this workflow, then fast-forwards that SAME SHA onto
# main. actions/checkout re-fetches origin/main at job start. If origin/main has
# already advanced to CONTAIN HEAD by that fetch (a race), merge-base(origin/main,
# HEAD) == HEAD, the three-dot diff is empty, and the guard false-fails a
# genuinely valid push. The push-event payload's commit list is frozen at push
# time and immune to where main's tip later stands, so we anchor to it instead.
#
# Contract: read env PUSHED_COMMITS (a JSON array of SHA strings), operate on the
# current git repo (CWD), signal pass/fail via exit code (0 = pass, non-zero =
# reject). Every pushed commit is examined — the fast path stamps required checks
# green without real CI, so a multi-commit push must not slip a non-intentions
# commit through by only inspecting HEAD.
set -euo pipefail

# Require jq (clear error over fallback, code-style.md; matches the
# graph-commit `command -v` convention).
if ! command -v jq >/dev/null 2>&1; then
  echo "::error::jq is required to parse PUSHED_COMMITS but was not found on PATH."
  exit 1
fi

# Parse the JSON array of pushed commit SHAs.
mapfile -t SHAS < <(printf '%s' "${PUSHED_COMMITS:-}" | jq -r '.[]')

# Fail-closed on an empty commit list. An empty `commits` array occurs only in
# the degenerate "scratch SHA already reachable from another ref at push time"
# case (a re-push of an already-landed SHA). Today's three-dot guard ALSO
# false-fails in that same case, so refusing here is not a new regression — it is
# the intended fail-closed behavior. Falling back to head_commit.id or an
# origin/main range would fail OPEN and defeat the guard's purpose.
if [ "${#SHAS[@]}" -eq 0 ]; then
  echo "::error::PUSHED_COMMITS is empty — no pushed commits to verify. Refusing to fast-path (fail-closed)."
  exit 1
fi

BAD_PATHS=""
NONREGULAR=""
ANY_CHANGES=""

for sha in "${SHAS[@]}"; do
  # Reject merge commits (>1 parent): `git diff-tree` without -m/-c prints
  # NOTHING for a merge commit, so its changes would silently go unexamined.
  # The guard sits over attacker-influenceable push content, so this must be
  # explicit. `rev-list --no-walk --parents` prints "<commit> <parent>..." — the
  # parent count is the word count minus one.
  parents_line=$(git rev-list --no-walk --parents "$sha")
  nwords=$(printf '%s\n' "$parents_line" | wc -w)
  nparents=$(( nwords - 1 ))
  if [ "$nparents" -gt 1 ]; then
    echo "::error::graph/** fast path rejects merge commits. $sha has $nparents parents."
    exit 1
  fi

  # Collect changed entries. --root makes a parentless (first) commit show as
  # all-adds instead of printing nothing; -r recurses into subtrees to real file
  # paths; --no-commit-id drops the leading commit-SHA-only header line. Each
  # line: ":<srcmode> <dstmode> <srcsha> <dstsha> <status>\t<path>".
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    ANY_CHANGES="yes"
    # Destination mode is whitespace field 2 (field 1 is ":<srcmode>").
    dstmode=$(printf '%s' "$line" | awk '{print $2}')
    # Path is everything after the first TAB (a path could contain a space).
    path=${line#*$'\t'}
    if [ "$dstmode" = "120000" ] || [ "$dstmode" = "160000" ]; then
      NONREGULAR+="$sha: $line"$'\n'
    fi
    case "$path" in
      intentions/*) ;;
      *) BAD_PATHS+="$sha: $path"$'\n' ;;
    esac
  done < <(git diff-tree --no-commit-id --raw -r --root "$sha")
done

if [ -n "$BAD_PATHS" ]; then
  echo "::error::graph/** fast path only accepts intentions/-only pushes. Non-intentions/ paths changed:"
  printf '%s' "$BAD_PATHS"
  exit 1
fi

if [ -n "$NONREGULAR" ]; then
  echo "::error::graph/** fast path only accepts regular files under intentions/. Symlink/gitlink entries changed:"
  printf '%s' "$NONREGULAR"
  exit 1
fi

# Exit 0 requires a non-empty union of changed paths. If every pushed commit was
# a no-op (empty diff), there is nothing to fast-path — fail-closed, matching the
# old guard's "-z CHANGED" rejection.
if [ -z "$ANY_CHANGES" ]; then
  echo "::error::No changes across the pushed commits — nothing to fast-path."
  exit 1
fi

exit 0
