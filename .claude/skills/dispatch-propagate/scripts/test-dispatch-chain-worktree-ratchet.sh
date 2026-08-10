#!/usr/bin/env bash
# Tests for dispatch-chain-worktree-ratchet -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 18501-18558.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch chain: no EnterWorktree/ExitWorktree mid-session (ratchet for #839)
# ============================================================================
echo "=== dispatch chain: no EnterWorktree/ExitWorktree mid-session ==="
#
# Regression guard for #839: the dispatch chain — router /dispatch-propagate and the
# phase skills it spawns — must not call EnterWorktree or ExitWorktree. A phase
# skill is born in its target worktree (cwd set by dispatch-launch-worker); any
# mid-session worktree switch is at best a no-op and at worst an error. The
# router runs in worktrees/main and materializes the target worktree explicitly
# (git worktree add).

PROJECT_ROOT_FOR_GUARD=$(cd "$SCRIPT_DIR/../../../.." && pwd)

# Map of chain-skill SKILL.md → allowed count of EnterWorktree+ExitWorktree
# substring mentions (grep -oE counts each occurrence, not each line). The scan
# covers each skill's SKILL.md AND any references/*.md it splits normative
# doctrine into (tactic-thin-oversized-skill-bodies): a worktree-switch
# instruction relocated out of the thinned SKILL.md body into a reference file
# would otherwise evade this guard.
declare -A CHAIN_GUARD_EXPECTED=(
  [".claude/skills/dispatch-propagate/SKILL.md"]=0
  # Phase skills do not call EnterWorktree/ExitWorktree (#868): they write the
  # phase-completed marker and stop; the Stop hook (`.claude/hooks/dispatch-stop.sh`)
  # owns post-phase disposition (label management, router spawn, self-close).
  # This supersedes #824's terminal ExitWorktree action:"keep" pattern.
  [".claude/skills/qa-fix/SKILL.md"]=0
  [".claude/skills/office-hours/SKILL.md"]=0
  [".claude/skills/plan-issue/SKILL.md"]=0
  [".claude/skills/implement/SKILL.md"]=0
  [".claude/skills/review-fix/SKILL.md"]=0
  [".claude/skills/fix-checks/SKILL.md"]=0
  [".claude/skills/implement-unit/SKILL.md"]=0
  [".claude/skills/commit-merge-push/SKILL.md"]=0
)

for relpath in "${!CHAIN_GUARD_EXPECTED[@]}"; do
  abspath="$PROJECT_ROOT_FOR_GUARD/$relpath"
  expected="${CHAIN_GUARD_EXPECTED[$relpath]}"
  if [[ ! -f "$abspath" ]]; then
    TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
    echo "  FAIL: chain-guard: file missing: $relpath"
    continue
  fi
  # Scan the SKILL.md body plus any references/*.md the skill splits normative
  # doctrine into, so relocated worktree-switch instructions cannot evade the guard.
  guard_files=("$abspath")
  refs_dir="$(dirname "$abspath")/references"
  if [[ -d "$refs_dir" ]]; then
    while IFS= read -r ref_md; do
      guard_files+=("$ref_md")
    done < <(find "$refs_dir" -type f -name '*.md' | sort)
  fi
  actual=$({ grep -hoE 'EnterWorktree|ExitWorktree' "${guard_files[@]}" || true; } | wc -l | tr -d ' ')
  assert_eq "chain-guard: $relpath: EnterWorktree/ExitWorktree count (SKILL.md + references)" \
    "$expected" "$actual"
done

# <<< END MOVED <<<

report_results
