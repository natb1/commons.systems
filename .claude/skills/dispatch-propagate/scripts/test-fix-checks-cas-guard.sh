#!/usr/bin/env bash
# Doctrine ratchet for .claude/skills/fix-checks/SKILL.md's node-lane completion
# recipes -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 33627-33698.
#
# Modeled on test-dispatch-chain-worktree-ratchet.sh: a prose/fenced-block guard
# over a chain skill's SKILL.md rather than a functional harness over a script.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# fix-checks: node-lane completion recipes carry the graph-write --base CAS
# guard (tactic-graph-write-recipes-base-cas / tactic-fix-checks-pushed-nothing-base)
# ============================================================================
echo "=== fix-checks: node-lane completion recipes --base CAS guard ==="
#
# The two node-lane completion recipes (record-push and pushed-nothing) in
# .claude/skills/fix-checks/SKILL.md must each refresh intentions/$N.md from
# origin/main and pass graph-commit --base before writing. graph-commit does
# whole-file replacement of intentions/<id>.md, so an unpinned write from a
# stale worktree silently reverts sibling frontmatter another writer landed
# concurrently — this happened for real on 2026-07-22 on PR #2927. The
# refresh-then---base pattern was landed by PR #2939 and is tracked by
# tactic-graph-write-recipes-base-cas and tactic-fix-checks-pushed-nothing-base.
#
# The guard binds each key to the recipe it protects: it extracts every
# ```bash fence in the skill that spends an attempt (that is what makes a
# fence a node-lane completion recipe) and asserts that fence carries the
# WHOLE documented sequence exactly once —
#
#   1. git fetch origin main            (refresh the remote-tracking ref)
#   2. FRESH_BLOB=$(git rev-parse …)    (capture the CAS base blob)
#   3. git show origin/main:… > …       (refresh the working file)
#   4. graph-commit --base "$N=…"       (pin the write to that base)
#
# A file-global occurrence count would let the totals stay correct while one
# recipe is left unguarded — exactly the regression this exists to catch — so
# the per-recipe report below is the assertion, not a count.
#
# If the expectation below legitimately changes (e.g. a new completion recipe
# is added), add its row here AND confirm every recipe still carries all four
# steps — never drop a row or a step just to make this suite green.

FIXCHECKS_GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
FIXCHECKS_GUARD_SKILL="$FIXCHECKS_GUARD_ROOT/.claude/skills/fix-checks/SKILL.md"

if [[ ! -f "$FIXCHECKS_GUARD_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: fix-checks CAS guard: file missing: .claude/skills/fix-checks/SKILL.md"
else
  actual=$(awk '
    function countsub(hay, needle,   c, p) {
      c = 0
      while ((p = index(hay, needle)) > 0) { c++; hay = substr(hay, p + length(needle)) }
      return c
    }
    /^[[:space:]]*```bash[[:space:]]*$/ { inblock = 1; buf = ""; next }
    inblock && /^[[:space:]]*```[[:space:]]*$/ {
      inblock = 0
      if (index(buf, "--spend-attempt") > 0) {
        n += 1
        printf "recipe %d: fetch=%d rev-parse=%d show=%d base=%d\n", n,
          countsub(buf, "git fetch origin main >&2"),
          countsub(buf, "FRESH_BLOB=\"$(git rev-parse \"origin/main:intentions/$N.md\""),
          countsub(buf, "git show \"origin/main:intentions/$N.md\" > \"intentions/$N.md\""),
          countsub(buf, "--base \"$N=$FRESH_BLOB\"")
      }
      next
    }
    inblock { buf = buf $0 "\n" }
  ' "$FIXCHECKS_GUARD_SKILL")
  assert_eq "fix-checks CAS guard: each attempt-spending recipe carries fetch + rev-parse + show + --base" \
    'recipe 1: fetch=1 rev-parse=1 show=1 base=1
recipe 2: fetch=1 rev-parse=1 show=1 base=1' "$actual"

  # Tripwire: forces a deliberate revisit of the guard when a new graph-commit
  # call site is added to this file (2 completion-seam invocations + 3 on the
  # flake-tracking path, as of PR #2939).
  actual=$({ grep -cF -- 'packages/intentionsutil/scripts/graph-commit' "$FIXCHECKS_GUARD_SKILL" || true; })
  assert_eq "fix-checks CAS guard: packages/intentionsutil/scripts/graph-commit call-site count" "5" "$actual"
fi

# <<< END MOVED <<<

report_results
