#!/usr/bin/env bash
# Doctrine ratchet: every node-lane terminal path of every dispatch-tick-
# reachable phase skill must declare a terminal disposition — either the
# explicit `mark-node-terminal` call, or one of the primitives that call it on
# the caller's behalf (`transition-node`, `park-node`). Built for
# tactic-qa-fix-node-terminal-declaration, after `/qa-fix`'s fix-finalize path
# was found to freeze its own node on every successful auto-fix (job c20b2f8d,
# node tactic-graph-select-target-node-tests, PR #2985): it called only
# `dispatch-mark-complete --phase qa` (the LEGACY gh-issue marker), which
# `dispatch-self-close --node` never reads, so the node froze on every
# success, not intermittently. The missing call itself landed in PR #2986
# (`.claude/skills/qa-fix/references/auto-fix-lane.md:194`); THIS file is the
# static, CI-time complement that catches the *next* dropped declaration before
# it ships.
#
# Modeled directly on test-dispatch-conflict-lane3-cwd-ratchet.sh (section
# extraction, fenced-block-only invocation counting) and
# test-dispatch-chain-worktree-ratchet.sh (the SKILL.md + references/*.md
# file-set expansion, the `declare -A <key>=<count>` inventory idiom). The
# per-file fence toggle tolerates indented fences
# (`/^[[:space:]]*```/`, test-fix-checks-cas-guard.sh's pattern) — several of
# these skills nest their recipes inside numbered/bulleted lists, so a
# column-0-only toggle (the lane3 ratchet's pattern) silently drops indented
# fences and undercounts. Confirmed live: align-tactics/SKILL.md:134's
# `no-claim` call sits under 5 spaces of list indent and is invisible to a
# column-0 toggle.
#
# NOT a replacement for the runtime backstop. `terminal_without_disposition_sweep`
# (.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:577-700,
# wired into dispatch-tick at :383-392 and :591-594) reads
# `claude agents --json --all` for worker rows still present in a *terminal*
# session state — by construction, sessions that ended without declaring — and
# parks their nodes to office_hours. It is the run-time detector: it catches an
# undeclared session AFTER it has already frozen a slot for one tick, and it
# turns every occurrence into a spurious office-hours park. This file is the
# author-time preventer: it fails CI before an undeclaring lane ever ships, so
# the runtime backstop's park never has to fire for THIS defect class again.
#
# If an expectation below legitimately changes (a skill grows a new node-lane
# terminal path, or drops one), update the assertion AND confirm by hand that
# the new/changed path still declares one way or another — never delete a row,
# or bump a count, just to make this suite green. Every FAIL message below
# states what changed and what the next author must decide.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "=== node-lane terminal-declaration coverage ratchet ==="

NTC_ROOT="${NODE_TERMINAL_COVERAGE_ROOT:-$(cd "$SCRIPT_DIR/../../../.." && pwd)}"
NTC_EXECUTE="$NTC_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute"

# --- shared helpers ----------------------------------------------------------

# Fenced-content extractor: strips fence delimiters, keeps only lines that sit
# strictly BETWEEN a pair of ``` markers. Indentation-tolerant (see header):
# a fence marker may sit under list-item indent, so the toggle matches
# leading whitespace before the backticks, not only column 0.
ntc_fenced_only() {
  awk '
    /^[[:space:]]*```/ { infence = !infence; next }
    infence { print }
  ' "$1"
}

# ntc_skill_files <skill-dir-name> — echoes SKILL.md plus every references/*.md,
# one path per line, so a declaration relocated out of a thinned SKILL.md body
# into a reference file cannot evade the count (mirrors
# test-dispatch-chain-worktree-ratchet.sh's file-set expansion).
ntc_skill_files() {
  local skill="$1" abspath refs_dir
  abspath="$NTC_ROOT/.claude/skills/$skill/SKILL.md"
  echo "$abspath"
  refs_dir="$NTC_ROOT/.claude/skills/$skill/references"
  if [[ -d "$refs_dir" ]]; then
    find "$refs_dir" -type f -name '*.md' | sort
  fi
}

# ntc_fenced_count <pattern> <skill> — fenced-block-invocation count of
# <pattern> (an extended regex) across a skill's whole file set. Prose
# mentions of a command name are not invocations, so this counts only what
# survives ntc_fenced_only.
ntc_fenced_count() {
  local pattern="$1" skill="$2" f all_fenced=""
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    all_fenced="$all_fenced
$(ntc_fenced_only "$f")"
  done < <(ntc_skill_files "$skill")
  { grep -coE "$pattern" <<<"$all_fenced" || true; } | head -1
}
# grep -c on a HERE-STRING (one "file") never prints a name prefix, so a
# single `grep -c` line is already the count; no awk/name-split needed. Kept
# as a distinct helper (vs. inlining) so every Part below reads identically.

if [[ ! -f "$NTC_EXECUTE" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: node-terminal-coverage: file missing: .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute"
  report_results
  exit 1
fi

# ============================================================================
# Part A — reachable-skill-set drift tripwire
# ============================================================================
# A new phase->skill mapping added to dispatch-graph-execute's case statement
# without registering that skill's terminal paths in Parts B/C/D below must
# fail here, loudly, with the remediation named.

REACHABLE_ACTUAL=$(grep -oE 'SKILL="/[a-z-]+"' "$NTC_EXECUTE" \
  | sed -E 's/SKILL="(.*)"/\1/' | sort -u | tr '\n' ' ' | sed 's/ $//')
REACHABLE_EXPECTED="/align-tactics /dispatch-conflict /fix-checks /implement /qa-fix /qa-main /review-fix"

assert_eq "Part A: dispatch-graph-execute's SKILL=\"...\" case-arm set (a new one un-registered here fails) — a new node-worker-reachable skill was added; register its node-lane terminal paths in this ratchet's inventory" \
  "$REACHABLE_EXPECTED" "$REACHABLE_ACTUAL"

# /dispatch-conflict is reachable two ways: a `tactic:conflict) SKILL="/dispatch-conflict"`
# case arm (counted in REACHABLE_ACTUAL above) AND a separate literal Lane 3
# spawn string on the provision-exit-11 path that does not assign SKILL=, so
# that spawn arm is asserted here too.
LANE3_SPAWN_COUNT=$(grep -coE '"/dispatch-conflict \$id"' "$NTC_EXECUTE" || true)
assert_eq "Part A: dispatch-graph-execute's literal /dispatch-conflict Lane 3 spawn arm still present" \
  "1" "$LANE3_SPAWN_COUNT"

# ============================================================================
# Part B — declaration-site inventory: mark-node-terminal fenced-invocation
# count per reachable skill, including dispatch-conflict — reachable both via
# the tactic:conflict case arm and the literal Lane 3 spawn string above.
# ============================================================================
# Baselines re-derived against THIS tree at implementation time (the planning-
# time baselines in the node body are NOT trusted blind, per the plan's own
# instruction) using the fenced-block-only, indentation-tolerant extraction
# above. Each row names which terminal path(s) each call belongs to.

declare -A NTC_MARK_TERMINAL_EXPECTED=(
  # align-round (SKILL.md, decomposition-round completion) + no-claim
  # (SKILL.md, the exit-12 stale-selection early exit). Two calls, two paths.
  [align-tactics]=2
  # Lane 3 only: conflict-resolved (Step 9, SKILL.md:1281) + conflict-hold
  # (Step 10, SKILL.md:1361), each ALSO illustrated once earlier in the doc's
  # Step 7/8 walkthrough (SKILL.md:903, :926) — four fenced occurrences total.
  # Lane 2 declares NEITHER path; see the registered GAP rows below.
  [dispatch-conflict]=4
  # fix-attempt (SKILL.md, Step 9 node lane) — the skill's one node-lane
  # terminal path.
  [fix-checks]=1
  # /implement's node-lane terminal paths declare via transition-node /
  # park-node only (see Part C) — no direct mark-node-terminal call.
  [implement]=0
  # THREE, not the plan-time-baseline ONE: two `no-claim` pre-flight bailouts
  # (SKILL.md:90 front-door exit 3 "stale selection", SKILL.md:100 front-door
  # exit 5 "scope-stale, wants demoting") that the node body's coverage table
  # did not enumerate as separate terminal paths, PLUS the one `fix-attempt`
  # call the table DID track (references/auto-fix-lane.md:194, the fix-
  # finalize path). Re-derivation corrects the stale count; the coverage
  # table's three-path enumeration (clean-pass/escalation/fix-finalize) covers
  # the OUTER dispositions, while these two SKILL.md no-claim exits are an
  # inner front-door gate reachable from any of them.
  [qa-fix]=3
  # /qa-main's node-lane terminal paths declare via transition-node / park-node
  # only (see Part C) — no direct mark-node-terminal call.
  [qa-main]=0
  # /review-fix's node-lane terminal paths declare via transition-node /
  # park-node only (see Part C) — no direct mark-node-terminal call.
  [review-fix]=0
)

for skill in "${!NTC_MARK_TERMINAL_EXPECTED[@]}"; do
  actual=$(ntc_fenced_count 'mark-node-terminal' "$skill")
  assert_eq "Part B: $skill: mark-node-terminal fenced-invocation count (a change here means a terminal path was added/removed or a call was dropped — confirm which, then update this count)" \
    "${NTC_MARK_TERMINAL_EXPECTED[$skill]}" "$actual"
done

# ============================================================================
# Part C — legacy-completion tripwire (the load-bearing half): pin
# dispatch-mark-complete / transition-node / park-node+office-hours-reason
# fenced-invocation counts, so a NEW call site to any of these forces a
# deliberate revisit of how that new terminal path declares. This is the
# tripwire that would have caught the original defect: /qa-fix's Step 3.7
# fix-finalize path added a dispatch-mark-complete call site, which changes
# this count, which forces the author to state how the new path declares
# (modeled on test-fix-checks-cas-guard.sh:81-86's "forces a deliberate
# revisit" idiom).
# ============================================================================

declare -A NTC_MARK_COMPLETE_EXPECTED=(
  [align-tactics]=0    # graph-native only; no legacy gh-issue marker anywhere.
  [dispatch-conflict]=4 # Lane 2 resolved/ambiguous + Lane 3 Step 9 + Step 7's config-grant walkthrough mention.
  [fix-checks]=1        # legacy issue-lane-only Step 9 call; node lane writes NO dispatch-mark-complete.
  [implement]=1         # legacy issue-lane completion; node lane declares via transition-node.
  [qa-fix]=3            # clean-pass, escalate-finalize, fix-finalize — each phase-qa completion site.
  [qa-main]=0           # graph-native only; declares via transition-node/park-node (Part C below).
  [review-fix]=1        # legacy issue-lane completion; node lane declares via transition-node/park-node.
)
for skill in "${!NTC_MARK_COMPLETE_EXPECTED[@]}"; do
  actual=$(ntc_fenced_count 'dispatch-mark-complete' "$skill")
  assert_eq "Part C: $skill: dispatch-mark-complete fenced-invocation count (a new call site means a new terminal path — state how THAT path declares, then update this count)" \
    "${NTC_MARK_COMPLETE_EXPECTED[$skill]}" "$actual"
done

declare -A NTC_TRANSITION_NODE_EXPECTED=(
  [align-tactics]=0
  [dispatch-conflict]=0
  [fix-checks]=0
  [implement]=1   # transition-node lands the advance/demote write and declares mark-node-terminal internally.
  [qa-fix]=1      # the clean-pass advance write.
  [qa-main]=2     # the pass (advance) and broken (advance to a new bug tactic) writes.
  [review-fix]=1  # the clean-pass advance write.
)
for skill in "${!NTC_TRANSITION_NODE_EXPECTED[@]}"; do
  actual=$(ntc_fenced_count 'transition-node' "$skill")
  assert_eq "Part C: $skill: transition-node fenced-invocation count (a new call site is a new declaring path — confirm it still declares, then update this count)" \
    "${NTC_TRANSITION_NODE_EXPECTED[$skill]}" "$actual"
done

declare -A NTC_PARK_NODE_EXPECTED=(
  [align-tactics]=0
  [dispatch-conflict]=1 # Step 7's config-grant park-node call.
  [fix-checks]=1        # the needs-human escalation park.
  [implement]=0
  [qa-fix]=0            # qa-fix escalates via office-hours-reason plumbing counted separately by Part C's mark-complete/transition rows, not a direct park-node call in this file set.
  [qa-main]=0
  [review-fix]=0
)
for skill in "${!NTC_PARK_NODE_EXPECTED[@]}"; do
  actual=$(ntc_fenced_count 'park-node|office-hours-reason' "$skill")
  assert_eq "Part C: $skill: park-node/office-hours-reason fenced-invocation count (a new call site is a new declaring path — confirm it still declares via park-node, then update this count)" \
    "${NTC_PARK_NODE_EXPECTED[$skill]}" "$actual"
done

# ============================================================================
# Part D — timing-invariant assertion, where a section boundary is
# unambiguous (a "## " or "### " heading). Asserts the mark-node-terminal
# invocation is the LAST durable-action invocation in its section: it must
# appear at or after every dispatch-mark-complete / dispatch-emit-outcome /
# graph-commit / hold-node / post-pr-comment.sh call in the SAME fenced
# section content. This mechanizes condition 14's timing invariant ("declare
# as the LAST durable action of the pass, never earlier — Stop fires on every
# turn yield").
# ============================================================================

# ntc_section <file> <start-heading-regex> — from the first matching heading
# line (inclusive) to the next "## " or "### " heading (exclusive) or EOF.
ntc_section() {
  local file="$1" start="$2"
  awk -v start="$start" '
    $0 ~ start { insec = 1; print; next }
    insec && /^#{2,3} / { exit }
    insec { print }
  ' "$file"
}

# ntc_assert_terminal_last <label> <section-text> — within the section's
# FENCED content only, assert mark-node-terminal's last matching line index
# is >= every other durable-action pattern's last matching line index (i.e.
# it never appears strictly before another durable write). If
# mark-node-terminal does not appear in the section at all, that is a
# membership failure the Part B/C counts above already catch — skip silently
# here to avoid a duplicate, confusing failure message.
ntc_assert_terminal_last() {
  local label="$1" section="$2" fenced last_terminal other other_last
  fenced=$(awk '
    /^[[:space:]]*```/ { infence = !infence; next }
    infence { print }
  ' <<<"$section")
  last_terminal=$({ grep -nE 'mark-node-terminal' <<<"$fenced" || true; } | tail -1 | cut -d: -f1)
  [[ -z "$last_terminal" ]] && return 0
  for other in 'dispatch-mark-complete' 'dispatch-emit-outcome' 'dispatch-write-phase-log' 'graph-commit' 'hold-node' 'post-pr-comment[.]sh'; do
    other_last=$({ grep -nE "$other" <<<"$fenced" || true; } | tail -1 | cut -d: -f1)
    [[ -z "$other_last" ]] && continue
    TOTAL=$((TOTAL + 1))
    if [[ "$last_terminal" -ge "$other_last" ]]; then
      PASS=$((PASS + 1))
      echo "  PASS: Part D: $label: mark-node-terminal (fenced line $last_terminal) is not before $other (fenced line $other_last)"
    else
      FAIL=$((FAIL + 1))
      echo "  FAIL: Part D: $label: mark-node-terminal (fenced line $last_terminal) appears BEFORE $other (fenced line $other_last) in the same section — Stop fires on every turn yield, so the terminal marker must be the LAST durable action, or the hook can reap the job before the other write lands"
    fi
  done
}

# 1. dispatch-conflict Lane 3, Step 9 (conflict-resolved) and Step 10
#    (conflict-hold) — both unambiguous "### N. ..." headings.
DC_SKILL="$NTC_ROOT/.claude/skills/dispatch-conflict/SKILL.md"
if [[ -f "$DC_SKILL" ]]; then
  SEC9=$(ntc_section "$DC_SKILL" '^### 9[.]')
  ntc_assert_terminal_last "dispatch-conflict Lane 3 Step 9 (conflict-resolved)" "$SEC9"
  SEC10=$(ntc_section "$DC_SKILL" '^### 10[.]')
  ntc_assert_terminal_last "dispatch-conflict Lane 3 Step 10 (conflict-hold)" "$SEC10"
else
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: Part D: file missing: .claude/skills/dispatch-conflict/SKILL.md"
fi

# 2. /qa-fix's fix-finalize path — an unambiguous "## " heading in the
#    reference file it is split into.
QF_REF="$NTC_ROOT/.claude/skills/qa-fix/references/auto-fix-lane.md"
if [[ -f "$QF_REF" ]]; then
  SEC_FF=$(ntc_section "$QF_REF" '^## Fix finalize path')
  ntc_assert_terminal_last "qa-fix Fix finalize path" "$SEC_FF"
else
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: Part D: file missing: .claude/skills/qa-fix/references/auto-fix-lane.md"
fi

# 3. /fix-checks (SKILL.md's numbered Step 9) and /align-tactics (SKILL.md's
#    no-claim and align-round paths) do NOT sit under a "## "/"### " heading —
#    they are items inside a numbered/bulleted list, so ntc_section's
#    heading-bounded extraction cannot isolate them without a brittle,
#    list-item-specific pattern. Per the plan's own fallback ("where a section
#    boundary makes the ordering ambiguous, assert only the membership"),
#    assert membership only here: the invocation count already pinned in
#    Parts B/C is the ordering-independent guarantee that the call exists at
#    all; a human review (this tactic's Verification section) confirms
#    ordering by hand for these two skills instead of a brittle assertion.
echo "  NOTE: Part D: fix-checks Step 9 and align-tactics no-claim/align-round are membership-only (list-item sections, no heading boundary) — see the plan's Verification section for the by-hand ordering check"

# ============================================================================
# GAP rows — /dispatch-conflict Lane 2's two paths are registered as explicit,
# reasoned gaps, not silently uncovered. A gap row whose heading no longer
# resolves must fail: the record cannot rot silently.
# ============================================================================
if [[ -f "$DC_SKILL" ]]; then
  RESOLVED_HEADING=$(grep -cF '### `resolved` — write back, clear the park, land' "$DC_SKILL" || true)
  assert_eq "GAP: dispatch-conflict Lane 2 \`resolved\` heading still present (registered gap: not fleet-reachable per SKILL.md's 'No automatic dispatch tick enters Lane 2')" \
    "1" "$RESOLVED_HEADING"

  AMBIGUOUS_HEADING=$(grep -cF '### `ambiguous <reason>` — confirm the existing park, report, stop' "$DC_SKILL" || true)
  assert_eq "GAP: dispatch-conflict Lane 2 \`ambiguous\` heading still present (registered gap: no marker to write by design — the node stays parked from graph-commit's own write)" \
    "1" "$AMBIGUOUS_HEADING"

  # Whitespace-normalized: the sentence legitimately wraps across source lines
  # (test-dispatch-conflict-lane3-cwd-ratchet.sh's WHO_FLAT idiom).
  DC_FLAT=$(tr '\n' ' ' < "$DC_SKILL" | tr -s ' ')
  LANE2_REASON=$({ grep -coF 'No automatic dispatch tick enters Lane 2' <<<"$DC_FLAT" || true; })
  assert_eq "GAP: dispatch-conflict Lane 2 non-fleet-reachability reason text still present (the ground the gap is accepted on)" \
    "1" "$LANE2_REASON"
else
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: GAP: file missing: .claude/skills/dispatch-conflict/SKILL.md"
fi

report_results
