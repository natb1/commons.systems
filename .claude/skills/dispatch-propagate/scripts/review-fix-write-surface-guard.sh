#!/usr/bin/env bash
# review-fix-write-surface-guard.sh — the review-fix Step-5 node-lane
# write-surface fence, made executable.
#
# .claude/skills/review-fix/SKILL.md Step 5 ("File meaningful out-of-scope
# findings as blocked_by follow-ups", node lane) forks a subagent that writes
# draft tactic nodes under intentions/. Before the parent thread runs
# graph-commit, it must verify the subagent's ONLY effect on the tree was a
# set of new, untracked files — one per id in its returned node_ids, each at
# exactly `intentions/<id>.md`. That matters because intentions/ is the
# autonomous fleet's control plane: injected text in a finding description
# that steered the subagent into editing an EXISTING node (flipping `phase`
# to `done`, clearing a `blocked_by` gate, retargeting a plan body) would
# otherwise be pushed to main and acted on. Until this script, that check was
# a checklist in SKILL.md prose that nothing ran — a subagent (or the model
# reading the checklist) could silently skip it. This is the same check,
# extracted so it can be called and CI-tested like any other guard here.
#
# CARRIER CHANGE ONLY — this is a straight port of the prose fence in
# SKILL.md Step 5 ("Before running `graph-commit`, verify the write surface
# in this thread"). It must accept and reject exactly what that prose
# documents; do not tighten or loosen the rule while moving it.
#
# Inputs (three files, all already on disk — this script writes nothing and
# runs no git command itself, so it works identically against a real repo
# checkout or a throwaway test fixture):
#   BASELINE_FILE  — `git status --porcelain` captured before the subagent
#                    forked (SKILL.md: tmp/step5-baseline-$N.txt)
#   AFTER_FILE     — `git status --porcelain` captured after it returned
#                    (SKILL.md: tmp/step5-after-$N.txt)
#   IDS_FILE       — the subagent's returned node_ids, one per line
#                    (SKILL.md: tmp/step5-node-ids-$N.txt)
#
# Only entries that appear in AFTER but not BASELINE are in scope — computed
# the same way the prose does, `comm -13` over the two sorted files — so
# pre-existing dirt already in the tree before the fork is never this
# script's concern. Every such NEW porcelain entry must be:
#   - status exactly `??` (untracked addition). Any `M`, `D`, `R`, `A`, or
#     staged/unstaged-modified code fails the guard.
#   - a path exactly `intentions/<id>.md` for an `<id>` present in IDS_FILE.
#     Any other path — under `.claude/`, any source file, or an
#     `intentions/` file whose id was not returned — fails the guard.
# Conversely, every id in IDS_FILE must have a matching NEW `??` entry; a
# returned id with no new file means the return value and the tree disagree,
# which also fails the guard.
#
# Usage:
#   review-fix-write-surface-guard.sh <baseline-file> <after-file> <ids-file>
#
# Exit codes:
#   0  the write surface exactly matches the contract
#   1  at least one violation — each printed on stderr, naming the offending
#      path and its porcelain status (or the unmatched returned id)
#   2  bad usage / unreadable input
set -euo pipefail

usage() {
  echo "usage: review-fix-write-surface-guard.sh <baseline-file> <after-file> <ids-file>" >&2
}

if [[ $# -ne 3 ]]; then
  usage
  exit 2
fi

BASELINE_FILE="$1"
AFTER_FILE="$2"
IDS_FILE="$3"

for f in "$BASELINE_FILE" "$AFTER_FILE" "$IDS_FILE"; do
  if [[ ! -r "$f" ]]; then
    echo "review-fix-write-surface-guard.sh: cannot read '$f'" >&2
    exit 2
  fi
done

# --- the subagent's returned ids -------------------------------------------
# RETURNED_IDS is the set from IDS_FILE; ID_SATISFIED tracks, per id, whether
# a matching `?? intentions/<id>.md` entry was found among the NEW lines.
declare -A RETURNED_IDS=()
declare -A ID_SATISFIED=()
while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  RETURNED_IDS["$id"]=1
  ID_SATISFIED["$id"]=0
done < "$IDS_FILE"

# --- entries new since the baseline -----------------------------------------
# Same computation the prose specifies: only what appeared in AFTER but not
# BASELINE is the subagent's, via comm -13 over the sorted files.
declare -a VIOLATIONS=()

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  # Porcelain short format: columns 1-2 are the status, column 3 is a
  # separating space, column 4+ is the path (or "old -> new" for a rename) —
  # same 3-char strip the SKILL.md commit-merge-push step already uses
  # (`sed 's/^...//'`).
  status="${line:0:2}"
  path="${line:3}"

  if [[ "$status" != "??" ]]; then
    VIOLATIONS+=("$path: status '$status' is not an untracked addition (??)")
    continue
  fi

  if [[ "$path" =~ ^intentions/([^/]+)\.md$ ]]; then
    id="${BASH_REMATCH[1]}"
    if [[ -n "${RETURNED_IDS[$id]:-}" ]]; then
      ID_SATISFIED["$id"]=1
      continue
    fi
    VIOLATIONS+=("$path: status '??' but id '$id' is not in the subagent's returned node_ids")
    continue
  fi

  VIOLATIONS+=("$path: status '??' but the path is not intentions/<id>.md")
done < <(comm -13 <(sort "$BASELINE_FILE") <(sort "$AFTER_FILE"))

# --- returned ids with no matching new file ---------------------------------
for id in "${!RETURNED_IDS[@]}"; do
  if [[ "${ID_SATISFIED[$id]}" -ne 1 ]]; then
    VIOLATIONS+=("intentions/$id.md: returned node id '$id' has no matching ?? entry — the return value and the tree disagree")
  fi
done

if [[ "${#VIOLATIONS[@]}" -gt 0 ]]; then
  echo "review-fix-write-surface-guard.sh: write-surface violation(s):" >&2
  for v in "${VIOLATIONS[@]}"; do
    echo "  $v" >&2
  done
  exit 1
fi

exit 0
