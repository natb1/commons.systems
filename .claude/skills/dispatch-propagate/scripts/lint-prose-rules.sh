#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)

# Source lib.sh for is_shell_script (used to scope both rules to shell scripts).
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Detect: echo "$VAR" | jq  (quoted variable form only — see .claude/rules/shell-json.md)
# Covers optional echo flags (echo -e / echo -n) and the braced ${VAR} form, both
# of which are the same anti-pattern. Single-quoted to prevent the shell from
# interpreting \$ as $ (which would make \$ an ERE end-anchor, breaking the match).
PATTERN='echo([[:space:]]+-[a-zA-Z]+)?[[:space:]]+"\$\{?[A-Za-z_][A-Za-z0-9_]*\}?"[[:space:]]*\|[[:space:]]*jq'

# Detect: net-new raw gh issue/pr porcelain that should use the lib.sh REST helpers.
# Banned set: gh issue (view|edit|create|close|comment|list) and gh pr (view|edit|merge|list).
# `gh pr ready` is deliberately excluded. Built from non-contiguous ERE alternatives
# so this assignment line cannot match itself.
PORCELAIN_PATTERN='(^|[^[:alnum:]_])gh[[:space:]]+issue[[:space:]]+(view|edit|create|close|comment|list)([[:space:]]|$)|(^|[^[:alnum:]_])gh[[:space:]]+pr[[:space:]]+(view|edit|merge|list)([[:space:]]|$)'

# Allow-marker for the porcelain rule: a standalone comment on the line immediately
# preceding a call suppresses that one call. Reason text after the token is optional.
ALLOW_RE='^[[:space:]]*#[[:space:]]*lint-allow:[[:space:]]*gh-rest-porcelain\b'

# Compute the whole-repo unified-0 diff of added lines against origin/main.
# Scope is broadened to ALL files (no pathspec); the per-file is_shell_script
# guard below restricts both rules to shell scripts. This broadened scope applies
# to BOTH the echo-into-jq rule and the gh-rest-porcelain rule — safe because both
# are net-new-only (only this PR's added lines are scanned; pre-existing sites in
# extensionless shell scripts are not retroactively flagged).
# Run from REPO_ROOT so that relative paths in diff output are consistent.
#
# The baseline comes from resolve-diff-base.sh rather than being spelt
# `origin/main...HEAD` inline. --at-remote-tip first-parent because this linter
# runs on pushes to `main` too (run-lint.sh:145, inside the required `lint`
# job), where actions/checkout leaves origin/main pointing AT the pushed
# commit: the three-dot diff was then EMPTY and the linter reported a clean
# pass without inspecting a single line. A violation committed straight to main
# was never looked at.
DIFF_BASE=$("$SCRIPTS/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
if ! DIFF=$(git -C "$REPO_ROOT" diff "$DIFF_BASE"..HEAD --unified=0); then
  echo "ERROR: could not diff ${DIFF_BASE}..HEAD in $REPO_ROOT" >&2
  exit 1
fi

# Old-side revision of that diff. Needed to classify removals from files the
# branch deleted or renamed away: their content is only on this side.
#
# This REUSES the already-resolved base rather than recomputing it. It used to
# call `git merge-base origin/main HEAD` independently — a second source of
# truth for the same value, which disagrees with the first if refs move
# mid-run, and which had no answer at all in the push-to-main shape where the
# diff base is HEAD^1 rather than a merge base.
MERGE_BASE="$DIFF_BASE"

# Shebang test for old-side paths, mirroring lib.sh's is_shell_script. Kept
# local because is_shell_script reads the WORKING TREE, which no longer has the
# file when the branch deleted it -- exactly the relocation case below.
OLD_SHEBANG_RE='^#!.*/(env[[:space:]]+(-S[[:space:]]+)?)?(ba|z)?sh([[:space:]]|$)'
declare -A OLD_SHELL_CACHE=()

# Is the old-side path a shell script? Same scoping the addition side applies
# via is_shell_script, evaluated against the merge-base blob for deleted paths.
old_path_is_shell() {
  local path="$1" cached blob first verdict=1
  cached="${OLD_SHELL_CACHE[$path]:-}"
  if [[ -n "$cached" ]]; then
    [[ "$cached" == yes ]]
    return
  fi
  if [[ "$path" == *.sh ]]; then
    verdict=0
  elif is_shell_script "$path"; then
    verdict=0
  elif blob=$(git -C "$REPO_ROOT" show "$MERGE_BASE:$path" 2>/dev/null); then
    first="${blob%%$'\n'*}"
    if [[ "$first" =~ $OLD_SHEBANG_RE ]]; then verdict=0; fi
  fi
  if [[ "$verdict" -eq 0 ]]; then
    OLD_SHELL_CACHE["$path"]=yes
  else
    OLD_SHELL_CACHE["$path"]=no
  fi
  return "$verdict"
}

# Hunk header regex: @@ -a[,b] +c[,d] @@ ...
# Stored in a variable to avoid bare-word regex splitting issues under set -e.
HUNK_RE='^@@ -[0-9]+(,[0-9]+)? \+([0-9]+)(,[0-9]+)? @@'

CURRENT_PATH=""
LINE_NUM=0
SKIP_FILE=true
PREV_WAS_ALLOW=0
VIOLATIONS=()
PORCELAIN_VIOLATIONS=()

# Relocation exemption for the porcelain rule -- see the check site below for the
# full rationale. Count every REMOVED line in this same diff, keyed by exact
# content. A line that is merely relocated appears in the diff BOTH as a removal
# (from its old home) and as an addition (in its new home); a genuinely new call
# appears only as an addition. Counting rather than set-membership is deliberate:
# it makes the exemption a MULTISET match, so adding three copies of a line that
# was removed only once still reports the two net-new copies.
# The index is scoped to shell scripts on the OLD side, mirroring the
# is_shell_script scoping the addition side applies: a porcelain-shaped line
# removed from a .md doc or a .js workflow is not a relocated shell call, and
# must not excuse a net-new call added to a .sh file.
declare -A REMOVED_LINES=()
REMOVAL_PATH=""
REMOVAL_SKIP=true
while IFS= read -r rline; do
  # '--- a/<path>' old-file headers carry the old-side path (or /dev/null for a
  # file the branch created, which has no removals).
  if [[ "$rline" == '--- '* ]]; then
    rrest="${rline#--- }"
    if [[ "$rrest" == '/dev/null' ]]; then
      REMOVAL_PATH=""
      REMOVAL_SKIP=true
    else
      REMOVAL_PATH="${rrest#a/}"
      if old_path_is_shell "$REMOVAL_PATH"; then REMOVAL_SKIP=false; else REMOVAL_SKIP=true; fi
    fi
    continue
  fi
  # Other '---'-prefixed lines are not content lines either.
  [[ "$rline" == '---'* ]] && continue
  [[ "$rline" == '-'* ]] || continue
  [[ "$REMOVAL_SKIP" == true ]] && continue
  rcontent="${rline:1}"
  # An empty removed line is an invalid associative-array subscript, and can
  # never match the porcelain pattern anyway.
  [[ -z "$rcontent" ]] && continue
  REMOVED_LINES["$rcontent"]=$(( ${REMOVED_LINES["$rcontent"]:-0} + 1 ))
done <<<"$DIFF"

while IFS= read -r line; do
  # +++ header: new-file path (or /dev/null for deleted files)
  if [[ "$line" == '+++ '* ]]; then
    rest="${line#+++ }"
    if [[ "$rest" == '/dev/null' ]]; then
      CURRENT_PATH=""
      # Deleted file: nothing to scan for this file.
      SKIP_FILE=true
    else
      # Strip leading b/ prefix from diff paths
      CURRENT_PATH="${rest#b/}"
      # Scope both rules to shell scripts. is_shell_script runs under set -e and
      # returns 1 for non-shell files; guard it so a return-1 does not abort.
      if is_shell_script "$CURRENT_PATH"; then SKIP_FILE=false; else SKIP_FILE=true; fi
    fi
    LINE_NUM=0
    PREV_WAS_ALLOW=0
    continue
  fi

  # --- header: ignore (marks old-file side)
  if [[ "$line" == '--- '* ]]; then
    PREV_WAS_ALLOW=0
    continue
  fi

  # Hunk header: extract the new-side start line number
  if [[ "$line" =~ $HUNK_RE ]]; then
    LINE_NUM="${BASH_REMATCH[2]}"
    PREV_WAS_ALLOW=0
    continue
  fi

  # Added content line: starts with + but NOT ++
  if [[ "$line" == '+'* ]] && [[ "$line" != '++'* ]]; then
    # Strip the leading +
    content="${line:1}"

    # Files that are not shell scripts (or deleted): scan nothing.
    if [[ "$SKIP_FILE" == true ]]; then
      LINE_NUM=$(( LINE_NUM + 1 ))
      continue
    fi

    # Comment lines (first non-whitespace character is #): skipped by both content
    # rules, but the porcelain allow-marker is tracked here.
    if [[ "$content" =~ ^[[:space:]]*# ]]; then
      if [[ "$content" =~ $ALLOW_RE ]]; then
        PREV_WAS_ALLOW=1
      else
        PREV_WAS_ALLOW=0
      fi
      LINE_NUM=$(( LINE_NUM + 1 ))
      continue
    fi

    # echo-into-jq rule (ignores the allow-marker — always checked).
    if [[ "$content" =~ $PATTERN ]]; then
      VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: ${content}")
    fi

    # gh-rest-porcelain rule. Suppressed for this line when the immediately
    # preceding line is the allow-marker. The marker may be a net-new added line
    # (PREV_WAS_ALLOW) OR a pre-existing line not present in the unified-0 diff —
    # the latter happens when a future PR edits only the call line. Consult the
    # working-tree file at LINE_NUM-1 to catch the pre-existing-marker case.
    if [[ "$content" =~ $PORCELAIN_PATTERN ]]; then
      suppressed=$PREV_WAS_ALLOW
      if [[ "$suppressed" -eq 0 ]] && [[ "$LINE_NUM" -gt 1 ]]; then
        prev_line=$(sed -n "$(( LINE_NUM - 1 ))p" "$REPO_ROOT/$CURRENT_PATH")
        if [[ "$prev_line" =~ $ALLOW_RE ]]; then suppressed=1; fi
      fi
      # Relocation exemption. The rule's contract is net-NEW porcelain: moving an
      # existing call between files adds no call site, so the repo-wide count of
      # raw porcelain is unchanged and there is nothing for the author to migrate.
      # Without this, any large file split reports every moved line -- including
      # lines that have sat on origin/main unflagged for months -- and the only
      # ways out are editing moved content or burying it under allow-markers.
      # Consuming one removal per exempted addition keeps the check honest: a
      # genuinely new call has no matching removal and is still reported.
      # Evaluated LAST, after both allow-marker sources: a line an allow-marker
      # already suppresses must not spend removal budget that a later, genuinely
      # relocated copy of the same line needs.
      if [[ "$suppressed" -eq 0 ]] && [[ ${REMOVED_LINES["$content"]:-0} -gt 0 ]]; then
        REMOVED_LINES["$content"]=$(( REMOVED_LINES["$content"] - 1 ))
        suppressed=1
      fi
      if [[ "$suppressed" -eq 0 ]]; then
        PORCELAIN_VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: ${content}")
      fi
    fi

    # Any non-comment added line resets the allow-marker.
    PREV_WAS_ALLOW=0

    LINE_NUM=$(( LINE_NUM + 1 ))
    continue
  fi

  # Everything else (diff headers, index lines, - lines): ignore.
  # Do not advance the new-side line counter for these.
  # Reset the allow-marker so its suppression cannot carry across any
  # intervening non-added diff line (removed/context/index) to a later call.
  PREV_WAS_ALLOW=0

done <<<"$DIFF"

FAILED=0

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  FAILED=1
  echo "FAIL: echo-into-jq violations found in net-new shell-script lines:" >&2
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
fi

if [[ ${#PORCELAIN_VIOLATIONS[@]} -gt 0 ]]; then
  FAILED=1
  echo "FAIL: net-new raw gh issue/pr porcelain found in committed shell scripts:" >&2
  for v in "${PORCELAIN_VIOLATIONS[@]}"; do
    echo "  $v" >&2
  done
  cat >&2 <<'REMEDIATION'

Remediation — replace raw `gh issue/pr` porcelain with the REST helper in lib.sh.
The token-to-helper mapping (subcommand on the left, helper on the right):

    issue view     gh_issue_view_rest
    issue edit     gh_issue_edit_rest
    issue create   gh_issue_create_rest
    issue close    gh_issue_close_rest
    issue comment  gh_issue_comment_rest
    issue list     gh_issue_list_rest
    pr view        gh_pr_view_rest
    pr edit        gh_issue_edit_rest   (PRs are issues in REST — serves the --body edit; see gh_issue_edit_rest in lib.sh)
    pr merge       gh_pr_merge_rest
    pr list        gh_pr_list_rest

Exceptions:
  - Genuine GraphQL-only fields (closingIssuesReferences,
    closedByPullRequestsReferences) have no REST equivalent and are the
    intended documented exceptions.
  - To suppress this rule for one deliberate call, put the marker comment
    `# lint-allow: gh-rest-porcelain <reason>` on the line immediately
    preceding the call.

Why this matters: the REST helpers share the gh GraphQL rate-limit bucket more
sparingly and keep mutation/read paths uniform after the #2260 migration.
REMEDIATION
fi

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi

echo "PASS: no net-new echo-into-jq or gh-rest-porcelain violations in added shell-script lines"
