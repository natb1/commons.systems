#!/usr/bin/env bash
# Doctrine ratchet for the /align-tactics write path's freshness-assertion
# mandate (tactic-node-body-stale-in-worker-worktree, Unit 3). A worker's
# worktree pins intentions/ at provision time; nothing re-syncs it mid-session,
# so a wholesale body Edit landed against a stale base silently discards a
# concurrent edit to the same node. Unit 2 mandated assert-node-fresh
# immediately before that body Edit across three doctrine files
# (references/write-path.md, references/tactic-target.md, SKILL.md). This
# suite is the guard that a future edit cannot silently drop that mandate.
#
# Modeled on test-fix-checks-cas-guard.sh: a prose/fenced-block guard over
# skill doctrine, not a functional test harness over a script.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "=== align-tactics: write-path freshness assertion doctrine guard ==="
#
# assert-node-fresh (.claude/skills/dispatch-propagate/scripts/assert-node-fresh)
# is the per-node, pre-write freshness primitive that catches a worker whose
# worktree-pinned view of its own node went stale. It is only a guard if the
# doctrine actually calls it, in the right place, with a real disposition on
# refusal. The assertions below bind to each of those three requirements
# individually rather than a single pass/fail, so a regression in any one of
# them is legible on its own.
#
# If an expectation below legitimately changes (e.g. the doctrine's wording is
# reworded, or the step moves), update this row AND confirm every site still
# carries the step — never drop a row or an assertion just to make this suite
# green (.claude/rules/test-integrity.md).

GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
WRITE_PATH="$GUARD_ROOT/.claude/skills/align-tactics/references/write-path.md"
TACTIC_TARGET="$GUARD_ROOT/.claude/skills/align-tactics/references/tactic-target.md"
ALIGN_TACTICS_SKILL="$GUARD_ROOT/.claude/skills/align-tactics/SKILL.md"
ASSERT_NODE_FRESH="$GUARD_ROOT/.claude/skills/dispatch-propagate/scripts/assert-node-fresh"

# --- 1. write-path.md mentions assert-node-fresh at all ---------------------

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md mentions assert-node-fresh: file missing: .claude/skills/align-tactics/references/write-path.md"
else
  actual=$(grep -cF -- 'assert-node-fresh' "$WRITE_PATH" || true)
  if [[ "$actual" -gt 0 ]]; then actual="present"; else actual="absent"; fi
  assert_eq "write-path.md mentions assert-node-fresh" "present" "$actual"
fi

# --- 2. Ordering within the "Per node (tactic or gate)" section -------------
#
# A file-global occurrence count would stay correct even if the step drifted
# to the wrong position in the sequence — exactly the regression this
# assertion exists to catch — so this binds to byte ordering within the
# section, not a count.

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md orders assert-node-fresh between write-node.ts and the body Edit: file missing"
else
  actual=$(awk '
    /^## Per node \(tactic or gate\)/ { insec = 1; next }
    insec && /^## / { insec = 0 }
    insec { buf = buf $0 "\n" }
    END {
      wn = index(buf, "write-node.ts --dir")
      anf = index(buf, "assert-node-fresh")
      ed = index(buf, "Plan body via `Edit`")
      if (wn == 0 || anf == 0 || ed == 0) {
        print "missing-marker: write-node.ts=" wn " assert-node-fresh=" anf " body-edit=" ed
      } else if (wn < anf && anf < ed) {
        print "ordered"
      } else {
        print "misordered: write-node.ts=" wn " assert-node-fresh=" anf " body-edit=" ed
      }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md orders assert-node-fresh between write-node.ts and the body Edit within 'Per node (tactic or gate)'" \
    "ordered" "$actual"
fi

# --- 3. tactic-target.md mentions assert-node-fresh --------------------------

if [[ ! -f "$TACTIC_TARGET" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: tactic-target.md mentions assert-node-fresh: file missing: .claude/skills/align-tactics/references/tactic-target.md"
else
  actual=$(grep -cF -- 'assert-node-fresh' "$TACTIC_TARGET" || true)
  if [[ "$actual" -gt 0 ]]; then actual="present"; else actual="absent"; fi
  assert_eq "tactic-target.md mentions assert-node-fresh" "present" "$actual"
fi

# --- 4. SKILL.md mentions assert-node-fresh ----------------------------------

if [[ ! -f "$ALIGN_TACTICS_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: align-tactics SKILL.md mentions assert-node-fresh: file missing: .claude/skills/align-tactics/SKILL.md"
else
  actual=$(grep -cF -- 'assert-node-fresh' "$ALIGN_TACTICS_SKILL" || true)
  if [[ "$actual" -gt 0 ]]; then actual="present"; else actual="absent"; fi
  assert_eq "align-tactics SKILL.md mentions assert-node-fresh" "present" "$actual"
fi

# --- 5. write-path.md states the refusal disposition -------------------------
#
# A refusal must resolve to exactly one of a bounded retry or an office_hours
# park — never a silent fourth exit. Bind to both concepts appearing in the
# same section as assert-node-fresh, not just anywhere in the file.

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md states the refusal disposition (bounded retry + office_hours): file missing"
else
  actual=$(awk '
    /^## Per node \(tactic or gate\)/ { insec = 1; next }
    insec && /^## / { insec = 0 }
    insec { buf = buf $0 "\n" }
    END {
      anf = index(buf, "assert-node-fresh")
      retry = (index(buf, "bounded retry") > 0)
      oh = (index(buf, "office_hours") > 0)
      if (anf > 0 && retry && oh) { print "disposition-present" }
      else { print "disposition-missing: assert-node-fresh=" (anf>0) " bounded-retry=" retry " office_hours=" oh }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md states the refusal disposition (bounded retry + office_hours) alongside assert-node-fresh" \
    "disposition-present" "$actual"
fi

# --- 6. assert-node-fresh exists and is executable ---------------------------

if [[ ! -f "$ASSERT_NODE_FRESH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: assert-node-fresh exists and is executable: file missing: .claude/skills/dispatch-propagate/scripts/assert-node-fresh"
elif [[ -x "$ASSERT_NODE_FRESH" ]]; then
  assert_eq "assert-node-fresh exists and is executable" "executable" "executable"
else
  assert_eq "assert-node-fresh exists and is executable" "executable" "not-executable"
fi

report_results
