#!/usr/bin/env bash
# Ratchet: no new three-dot diff baselines in committed shell/CI code.
# Usage: ./test-diff-base-doctrine.sh [--repo-root <dir>]
#
# WHY THIS EXISTS
#
# `git diff A...B` expands to `git diff $(git merge-base A B) B`. When
# merge-base(A, B) == B the range is EMPTY, and every caller reads an empty
# diff as "nothing changed, clean pass". That state is not exotic: on a push to
# `main`, actions/checkout leaves refs/remotes/origin/main pointing AT the
# pushed commit, so the range is HEAD..HEAD. Nine change-detection and gating
# scripts carried that spelling, so every post-merge run of them was
# structurally vacuous — including the REQUIRED test-integrity gate, which
# exists to notice deleted tests and could not see a test deleted in a commit
# pushed to main.
#
# The fix routed all nine through resolve-diff-base.sh. This suite is the
# ratchet that keeps them there: the failure mode it guards is a NEW call site
# spelling the baseline inline again, which no unit test of any individual
# script would ever notice.
#
# KEYED ON THE SHAPE, NOT THE LITERAL
#
# The pattern matches a three-dot range with ANY left-hand spelling — a literal
# ref, a quoted variable, a brace expansion. Keying on the literal string
# `origin/main` is exactly how the first sweep of this defect missed two sites:
# they had already been refactored to hold the base in a variable, while
# keeping the vacuity intact.
#
# TWO ESCAPES, NEITHER OF THEM A LINE NUMBER
#
# A line-numbered allowlist rots on the next edit to an unrelated part of the
# file and then either fires spuriously or, worse, silently stops covering the
# line it was pinned to. So:
#
#   1. A same-line `# diff-base-ok: <reason>` marker, with a non-empty reason.
#      This is the repo's standing suppression idiom — see
#      .claude/rules/type-safety-suppression-marker.md for the `<sensor>-ok:`
#      family. It is what the test harnesses for this very defect use: each one
#      spells the old vacuous range on purpose, to assert it comes back empty.
#      A reproduction and a regression look identical to a regex; only the
#      author can say which it is, and the marker is where they say it.
#
#   2. A whole-file path entry in ALLOWLIST below, for the few production
#      scripts whose merge-base semantics are correct rather than incidental.
#
# Lines that are entirely a comment are skipped before either escape applies: a
# comment cannot be a call site, and most of this repo's occurrences are prose
# explaining the defect. Flagging those would train readers to ignore the
# sensor, which is the one outcome a ratchet cannot survive.
set -euo pipefail

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"

# Shared assertion helpers and report_results. Sourcing this is also what
# satisfies test-decision-log-isolation.sh, the meta-check that every suite in
# this directory route its routing-decision-log writes into a tmp sandbox.
# shellcheck source=test-helpers.sh
source "$SELF_DIR/test-helpers.sh"

REPO_ROOT=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo-root)
      if [ "$#" -lt 2 ]; then
        echo "test-diff-base-doctrine: --repo-root requires an argument" >&2
        exit 2
      fi
      REPO_ROOT="$2"; shift 2 ;;
    *)
      echo "test-diff-base-doctrine: unknown argument: $1" >&2
      exit 2 ;;
  esac
done

if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(cd "$SELF_DIR/../../../.." && pwd)"
fi

if ! git -C "$REPO_ROOT" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "test-diff-base-doctrine: $REPO_ROOT is not a git checkout" >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# The allowlist. Every entry is a repo-relative path with a recorded reason —
# an unexplained entry is indistinguishable from an unfixed site.
# ---------------------------------------------------------------------------
#
#   packages/intentionsutil/scripts/graph-commit
#       Two deliberate sites. Both compare a node edit against a base it is
#       genuinely being rebased ONTO, where the merge-base is the point; each
#       carries its own in-file comment, and #3037 is actively moving them, so
#       any line anchor here would be stale on arrival.
#
#   .claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh
#       Audits what a branch added relative to its fork point. The fork point
#       is the intended base, so the merge-base is correct rather than
#       incidental.
#
#   .claude/skills/review-fix/SKILL.md
#       Prose, not executed. The MERGE_BASE it documents is already an explicit
#       merge-base.
#
#   .github/scripts/check-graph-fast-path.sh
#       The match is inside a comment explaining why that script deliberately
#       does NOT use a three-dot range.
#
#   .claude/skills/dispatch-propagate/scripts/test-diff-base-doctrine.sh
#       This file. The patterns below are the ratchet's own subject matter.
#
ALLOWLIST=(
  "packages/intentionsutil/scripts/graph-commit"
  ".claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh"
  ".claude/skills/review-fix/SKILL.md"
  ".github/scripts/check-graph-fast-path.sh"
  ".claude/skills/dispatch-propagate/scripts/test-diff-base-doctrine.sh"
)

# ---------------------------------------------------------------------------
# KNOWN_UNMIGRATED — NOT an allowlist. These carry the defect.
#
# Five skill documents instruct an agent to run a three-dot range for
# changed-file detection. They are genuine instances, out of scope for the
# change that introduced this ratchet (which converted the nine executable call
# sites), and listed here so the ratchet can go green on that work without
# blessing them.
#
# The distinction is load-bearing, not bookkeeping: an entry here is a to-do,
# and the check below asserts each one STILL matches. Fix one and the ratchet
# fails until its entry is deleted, so this list can only shrink. An ALLOWLIST
# entry carries no such obligation — those are correct as they stand.
# ---------------------------------------------------------------------------
KNOWN_UNMIGRATED=(
  ".claude/skills/qa-fix/SKILL.md"
  ".claude/skills/qa-fix/references/auto-fix-lane.md"
  ".claude/skills/qa-fix/references/idempotency-preamble.md"
  ".claude/skills/review-fix/references/code-review-invocation.md"
  ".claude/skills/review-fix/references/terminal-actions.md"
)

is_skipped() {
  local path="$1" entry
  for entry in "${ALLOWLIST[@]}"; do
    [ "$path" = "$entry" ] && return 0
  done
  for entry in "${KNOWN_UNMIGRATED[@]}"; do
    [ "$path" = "$entry" ] && return 0
  done
  return 1
}

# Thin wrappers over test-helpers.sh's shared counters. This suite's checks are
# predicates rather than expected/actual comparisons, so assert_eq would just
# make every call site say "yes"/"yes"; these keep the same tally and the same
# PASS:/FAIL: output shape that report_results totals up.
pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo "  FAIL: $1" >&2; }

# Sweep A — a three-dot range on a line that also invokes git.
PAT_A='git[^|;&]*(diff|rev-list|log|merge-base|cherry)[^|;&]*[A-Za-z0-9_"$}{/.^~-]\.\.\.'

# Sweep B — a three-dot range on a line with no `git` on it, which is how a
# range hides in a multi-line command or an array element.
PAT_B='[A-Za-z0-9_"$}{^~-]\.\.\.(HEAD|"\$|origin/)'

SCAN_FILE="$(mktemp)"
HITS_FILE="$(mktemp)"
trap 'rm -f "$SCAN_FILE" "$HITS_FILE"' EXIT

# SCOPE: things that RUN. Shell, workflows, the intentionsutil scripts, and
# skill bodies — a SKILL.md is an instruction an agent executes, so a range
# spelled there is a live call site even though the file is markdown.
#
# Deliberately NOT all markdown. plans/, docs/ and intentions/ quote this
# defect constantly by way of explaining it; scanning them would bury the
# signal under its own documentation. intentions/ is doubly excluded — those
# are recorded node bodies, history that must not be rewritten to satisfy a
# linter.
#
# EXTENSION GLOBS ALONE ARE NOT ENOUGH. Most of this repo's executables carry
# NO extension — `dispatch-tick`, `graph-select-target`, `commit-merge-push`,
# `transition-node`, `.githooks/pre-commit` and 140-odd siblings are bash with a
# `#!/usr/bin/env bash` line and a bare name. `*.sh` cannot see any of them, so
# a scope written only in extensions leaves the single largest body of runnable
# shell in the repo outside the ratchet: a new three-dot baseline landing in
# `dispatch-tick` would pass this suite silently. The intentionsutil scripts
# were already covered by a whole-DIRECTORY pathspec for exactly this reason;
# the entries below extend that treatment to every other directory whose
# contents are executed.
#
# Whole-directory pathspecs also pull in .mjs/.js/.json siblings. That is not
# collateral — the workflow .js files under .claude/workflows/ are executed by
# the Workflow tool, and a .json fixture that pins a baseline string is a call
# site by proxy.
#
# Only TRACKED files, so an untracked scratch script never fails the ratchet.
git -C "$REPO_ROOT" ls-files -z \
  -- '*.sh' '*.bash' '*.yml' '*.yaml' \
     'packages/intentionsutil/scripts/*' \
     '.claude/skills/*/scripts/*' \
     '.claude/hooks/*' \
     '.claude/workflows/*' \
     '.github/scripts/*' \
     '.githooks/*' \
     '.claude/skills/*.md' \
  > "$SCAN_FILE"

# A line that is entirely a comment (first non-blank char is `#`) is prose, not
# a call site.
COMMENT_ONLY='^[0-9]+:[[:space:]]*#'

# The suppression marker, with a NON-EMPTY reason. `# diff-base-ok:` alone does
# not suppress — an unexplained suppression is the thing this guards against.
MARKER='#[[:space:]]*diff-base-ok:[[:space:]]*[^[:space:]]'

scan() {
  local label="$1" pattern="$2" rel
  : > "$HITS_FILE"
  while IFS= read -r -d '' rel; do
    case "$rel" in
      intentions/*|node_modules/*) continue ;;
    esac
    if is_skipped "$rel"; then continue; fi
    [ -f "$REPO_ROOT/$rel" ] || continue
    LC_ALL=C grep -anE "$pattern" "$REPO_ROOT/$rel" 2>/dev/null \
      | LC_ALL=C grep -vE "$COMMENT_ONLY" \
      | LC_ALL=C grep -vE "$MARKER" \
      | sed "s|^|$rel:|" >> "$HITS_FILE" || true
  done < "$SCAN_FILE"

  if [ ! -s "$HITS_FILE" ]; then
    pass "$label: no un-allowlisted three-dot diff baselines"
    return
  fi
  fail "$label: three-dot diff baseline(s) found"
  sed 's/^/    /' "$HITS_FILE" >&2
  cat >&2 <<'EOF'

    A three-dot range is vacuous whenever the left side is an ancestor of the
    right — which is every push to `main`, because actions/checkout leaves
    origin/main pointing at the pushed commit. The diff comes back empty and
    the caller reads that as a clean pass.

    Resolve the baseline explicitly instead:

      DIFF_BASE=$(.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh \
        --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
      git -C "$REPO_ROOT" diff --name-only "$DIFF_BASE"..HEAD

    Note the TWO dots on the diff: the helper has already resolved the base.

    If the three-dot range is deliberate — you are reproducing the vacuity in a
    test, or diffing against a genuine fork point rather than a moving remote
    tip — say so on the same line:

      ... origin/main...HEAD   # diff-base-ok: asserts the old range is empty

    The reason must be non-empty. For a whole file whose merge-base semantics
    are correct throughout, add its path to ALLOWLIST in
    .claude/skills/dispatch-propagate/scripts/test-diff-base-doctrine.sh with a
    comment saying why.
EOF
}

echo "=== Sweep A: three-dot range on a git command line ==="
scan "sweep A" "$PAT_A"

echo "=== Sweep B: three-dot range with no git on the line ==="
scan "sweep B" "$PAT_B"

# ---------------------------------------------------------------------------
# Self-test: the SCOPE. Two green sweeps say nothing about what was swept, and
# the failure this guards is exactly that — the pathspecs above once listed
# only extension globs, so every extensionless executable in the repo (the
# majority of its runnable shell) was outside the ratchet and a new three-dot
# baseline there would have passed silently. Pin representative members of each
# class the scope claims to cover, and one deliberate exclusion, so a pathspec
# edit that narrows coverage fails here instead of going quietly green.
# ---------------------------------------------------------------------------
echo "=== Self-test: the scan scope covers what it claims ==="
SCAN_LINES="$(tr '\0' '\n' < "$SCAN_FILE")"

# HERE-STRING, not a pipe. `grep -Fxq` exits at the first match, and once
# $SCAN_LINES exceeds the 64 KiB pipe buffer the writer takes SIGPIPE and the
# pipeline returns 141 under `set -o pipefail` — so an anchor that IS in scope
# reads as absent and this self-test false-fails. The scan list is ~38 KB today,
# which is why it has not fired yet; it grows with the repo, and the failure
# would look like a scope regression rather than a plumbing bug.
in_scope() {
  LC_ALL=C grep -Fxq "$1" <<<"$SCAN_LINES"
}

# Each entry is a live file; if one is renamed, fix the entry rather than
# dropping it — a missing anchor is how a scope check stops checking.
for scoped in \
  ".claude/skills/dispatch-propagate/scripts/dispatch-tick" \
  ".claude/skills/dispatch-propagate/scripts/transition-node" \
  ".claude/skills/dispatch-ladder/scripts/dispatch-ladder-run" \
  ".claude/workflows/align-tactics.js" \
  ".githooks/pre-commit" \
  "packages/intentionsutil/scripts/graph-commit" \
  ".github/scripts/check-test-integrity.sh" \
  ".claude/skills/qa-fix/SKILL.md"
do
  if [ ! -f "$REPO_ROOT/$scoped" ]; then
    fail "scope anchor no longer exists (repoint it): $scoped"
  elif in_scope "$scoped"; then
    pass "in scope: $scoped"
  else
    fail "NOT scanned — the pathspecs no longer reach it: $scoped"
  fi
done

# The exclusions are a decision, not an oversight: plans/ and intentions/ quote
# this defect constantly while explaining it, and intentions/ node bodies are
# recorded history. Pin them out so a broadening edit has to be deliberate.
for unscoped in \
  "plans/dispatch-rsi-sequence.md"
do
  if [ ! -f "$REPO_ROOT/$unscoped" ]; then
    fail "exclusion anchor no longer exists (repoint it): $unscoped"
  elif in_scope "$unscoped"; then
    fail "wrongly in scope — prose about the defect will bury the signal: $unscoped"
  else
    pass "excluded as intended: $unscoped"
  fi
done

# ---------------------------------------------------------------------------
# Self-test: the patterns must actually match the shapes they claim to, or the
# two green sweeps above are vacuous in exactly the way they exist to prevent.
# ---------------------------------------------------------------------------
echo "=== Self-test: the patterns match every spelling of the defect ==="
SA1='git diff --name-only origin/main'
SA1="$SA1...HEAD"
SA2='git diff "$BASE"'
SA2="$SA2...HEAD"
SA3='CHANGED=$(git diff --name-only ${REF}'
SA3="$SA3...HEAD)"
SA4='git rev-list --count origin/main'
SA4="$SA4...HEAD"

for probe in "$SA1" "$SA2" "$SA3" "$SA4"; do
  if printf '%s\n' "$probe" | LC_ALL=C grep -qE "$PAT_A"; then
    pass "sweep A matches: $probe"
  else
    fail "sweep A MISSED: $probe"
  fi
done

SB1='  origin/main'
SB1="$SB1...HEAD \\"
SB2='  "$BASE"'
SB2="$SB2...HEAD \\"

for probe in "$SB1" "$SB2"; do
  if printf '%s\n' "$probe" | LC_ALL=C grep -qE "$PAT_B"; then
    pass "sweep B matches: $probe"
  else
    fail "sweep B MISSED: $probe"
  fi
done

# And must NOT match a two-dot range, or the ratchet would flag the fix itself.
for probe in \
  'git diff --name-only "$DIFF_BASE"..HEAD' \
  'git diff --unified=0 "$DIFF_BASE"..HEAD -- "$F"'
do
  if printf '%s\n' "$probe" | LC_ALL=C grep -qE "$PAT_A"; then
    fail "sweep A false-positive on a two-dot range: $probe"
  else
    pass "sweep A ignores: $probe"
  fi
done

# ---------------------------------------------------------------------------
# The two escapes must behave: the marker suppresses only with a reason, and a
# comment-only line is skipped. Untested escapes are how a ratchet quietly
# stops ratcheting.
# ---------------------------------------------------------------------------
echo "=== Self-test: the escapes ==="
LIVE="$SA1"
SUPPRESSED="$SA1   # diff-base-ok: reproduction, asserts the range is empty"
BARE_MARKER="$SA1   # diff-base-ok:"
COMMENTED="12:  # $SA1 is what this used to be"

if printf '%s\n' "$SUPPRESSED" | LC_ALL=C grep -qE "$MARKER"; then
  pass "marker with a reason suppresses"
else
  fail "marker with a reason did NOT suppress"
fi

if printf '%s\n' "$BARE_MARKER" | LC_ALL=C grep -qE "$MARKER"; then
  fail "bare 'diff-base-ok:' with no reason wrongly suppresses"
else
  pass "bare 'diff-base-ok:' with no reason does not suppress"
fi

if printf '%s\n' "9:$LIVE" | LC_ALL=C grep -qE "$MARKER"; then
  fail "an unmarked line wrongly reads as suppressed"
else
  pass "an unmarked line is not suppressed"
fi

if printf '%s\n' "$COMMENTED" | LC_ALL=C grep -qE "$COMMENT_ONLY"; then
  pass "a comment-only line is skipped"
else
  fail "a comment-only line was NOT skipped"
fi

if printf '%s\n' "9:$LIVE" | LC_ALL=C grep -qE "$COMMENT_ONLY"; then
  fail "a live code line wrongly reads as a comment"
else
  pass "a live code line is not read as a comment"
fi

# ---------------------------------------------------------------------------
# Every allowlist entry must still exist. A stale entry is a hole: the path it
# names is gone, but a future file at that path would be silently exempt.
# ---------------------------------------------------------------------------
echo "=== Allowlist entries all still exist ==="
for entry in "${ALLOWLIST[@]}"; do
  if [ -f "$REPO_ROOT/$entry" ]; then
    pass "allowlist path exists: $entry"
  else
    fail "allowlist path is stale (remove it): $entry"
  fi
done

# ---------------------------------------------------------------------------
# Every KNOWN_UNMIGRATED entry must STILL match. This is what makes that list a
# to-do rather than a second allowlist: the moment one is converted, this fails
# and says to delete the entry, so the list only ever shrinks.
# ---------------------------------------------------------------------------
echo "=== Known-unmigrated entries still carry the defect ==="
for entry in "${KNOWN_UNMIGRATED[@]}"; do
  if [ ! -f "$REPO_ROOT/$entry" ]; then
    fail "known-unmigrated path is gone (remove the entry): $entry"
    continue
  fi
  if LC_ALL=C grep -anE "$PAT_A|$PAT_B" "$REPO_ROOT/$entry" 2>/dev/null \
       | LC_ALL=C grep -vE "$COMMENT_ONLY" \
       | LC_ALL=C grep -vqE "$MARKER"; then
    pass "still unmigrated (entry earns its place): $entry"
  else
    fail "$entry no longer matches — it was migrated. DELETE its KNOWN_UNMIGRATED entry."
  fi
done

report_results
