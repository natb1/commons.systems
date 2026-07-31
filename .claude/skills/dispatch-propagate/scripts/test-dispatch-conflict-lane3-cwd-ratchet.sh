#!/usr/bin/env bash
# Doctrine ratchet for .claude/skills/dispatch-conflict/SKILL.md's Lane 3.
#
# Modeled on test-dispatch-chain-worktree-ratchet.sh and
# test-fix-checks-cas-guard.sh: a prose/fenced-block guard over another skill's
# SKILL.md rather than a functional harness over a script.
#
# WHY: dispatch-graph-execute's provision-exit-11 branch spawns
# /dispatch-conflict's Lane 3 with `--cwd` on the PRIMARY CHECKOUT (not the
# node's own worktree, which is guaranteed stale on that path — its origin/main
# merge is what just failed). A session reads its skill body and every
# relatively-invoked helper script from its spawn cwd, so spawning in the node's
# worktree made Lane 3 read its own instructions out of a known-stale tree. That
# caused two live incidents: an unresolved conflict (stale body missing
# office_hours handling) and a full deadlock on 2026-07-30 (body predating the
# terminal-declaration contract, so no node-terminal marker was ever written and
# the session held a worker slot for over an hour).
#
# Consequence for the skill text, which this ratchet enforces: after that --cwd
# change, EVERY implicit-cwd dependency in Lane 3 must be explicit —
#   * git operations on the node's branch go through `git -C "$WT"`,
#   * helper scripts are invoked by absolute path under $PROJECT_ROOT,
#   * the contamination guard is passed the explicit "$WT" worktree path,
#   * the resolver subagent's worktree root comes from the resolved $WT, NEVER
#     from `git rev-parse --show-toplevel` (which from the primary checkout
#     returns the WRONG checkout — the lost-work failure implement-unit Step 1
#     documents).
#
# If an expectation below legitimately changes, update the assertion AND confirm
# the property it guards still holds another way — never delete a row to make
# the suite green.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "=== dispatch-conflict: Lane 3 explicit-cwd doctrine ratchet ==="

RATCHET_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
RATCHET_SKILL="$RATCHET_ROOT/.claude/skills/dispatch-conflict/SKILL.md"

if [[ ! -f "$RATCHET_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: lane3 ratchet: file missing: .claude/skills/dispatch-conflict/SKILL.md"
  report_results
  exit 1
fi

# --- section extraction -----------------------------------------------------
# Lane 3 runs from its "## Lane 3 — ..." heading to the next "## " heading or
# EOF (it is currently the last section; the awk handles either).
LANE3=$(awk '
  /^## Lane 3/ { inlane = 1; print; next }
  inlane && /^## / { exit }
  inlane { print }
' "$RATCHET_SKILL")

# The "### Who enters each lane" section, to the next "### " heading or EOF.
WHO=$(awk '
  /^### Who enters each lane/ { inwho = 1; print; next }
  inwho && /^### / { exit }
  inwho { print }
' "$RATCHET_SKILL")

# Fenced code-block CONTENT of the Lane 3 section only (fence delimiters
# dropped). Prose mentions of a command are not invocations, so every
# invocation-shaped assertion below runs against this, not the whole section.
LANE3_FENCED=$(awk '
  /^```/ { infence = !infence; next }
  infence { print }
' <<<"$LANE3")

if [[ -z "$LANE3" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: lane3 ratchet: could not extract the '## Lane 3' section"
  report_results
  exit 1
fi

count_matches() { grep -cE "$1" <<<"$2" || true; }

# --- 1. no cwd-derived worktree root ---------------------------------------
# `git rev-parse --show-toplevel` from Lane 3's session returns $PROJECT_ROOT
# (the primary checkout), not the node's worktree. The subagent brief must use
# the explicitly resolved $WT instead.
assert_eq "lane3: no 'git rev-parse --show-toplevel' anywhere in the Lane 3 section" \
  "0" "$(count_matches 'git rev-parse --show-toplevel' "$LANE3")"

# --- 2. every fenced git invocation is explicitly addressed -----------------
# Bare `git <subcmd>` in a fence would run against whatever cwd the session has.
# Every one must carry `-C "$WT"` (the node's branch) or `-C "$PROJECT_ROOT"`
# (the primary checkout's own freshening merge).
BARE_GIT=$(grep -nE '(^|[|(&] *)git +[a-z]' <<<"$LANE3_FENCED" \
  | grep -vE 'git +-C +"\$(WT|PROJECT_ROOT)"' || true)
assert_eq "lane3: every fenced git invocation carries -C \"\$WT\" or -C \"\$PROJECT_ROOT\"" \
  "" "$BARE_GIT"

# The node-branch subcommands specifically must target $WT, never $PROJECT_ROOT.
NODE_GIT_BAD=$(grep -nE 'git +-C +"\$PROJECT_ROOT" +(add|commit|push|log|diff|reset)\b' <<<"$LANE3_FENCED" || true)
assert_eq "lane3: node-branch git subcommands never target \$PROJECT_ROOT" \
  "" "$NODE_GIT_BAD"

# --- 3. contamination-guard calls pass the explicit worktree path -----------
# Unit 2 added the optional third positional [worktree-path]. Without it the
# guard derives its "launching worktree" from cwd, finds it equal to the primary
# checkout, and SKIPs — going vacuous exactly where the hazard is highest. Both
# calls must pass the SAME "$WT" (the snapshot filename is keyed on it).
GUARD_CALLS=$(count_matches 'subagent-contamination-guard" (baseline|check) dispatch-conflict "\$WT"' "$LANE3_FENCED")
assert_eq "lane3: both subagent-contamination-guard calls pass \"\$WT\"" \
  "2" "$GUARD_CALLS"
assert_eq "lane3: no subagent-contamination-guard call omits the worktree path" \
  "0" "$(grep -cE 'subagent-contamination-guard' <<<"$LANE3_FENCED" \
          | { read -r n; echo $((n - GUARD_CALLS)); })"

# --- 4. freshness is asserted on the primary checkout, never on $WT ---------
# On the exit-11 path $WT is behind origin/main BY CONSTRUCTION — that staleness
# IS the conflict being resolved — so asserting freshness there would fail 100%
# of the time. The skill must both do the right thing and say so.
assert_eq "lane3: assert-worktree-fresh is run against \"\$PROJECT_ROOT\"" \
  "1" "$(count_matches 'assert-worktree-fresh" "\$PROJECT_ROOT"' "$LANE3_FENCED")"
assert_eq "lane3: assert-worktree-fresh is never run against \$WT" \
  "0" "$(count_matches 'assert-worktree-fresh"? +"?\$WT' "$LANE3_FENCED")"
assert_eq "lane3: prose states the never-against-\$WT prohibition" \
  "1" "$(count_matches 'Never run .assert-worktree-fresh. against .\$WT.' "$LANE3")"

# --- 5. dispatch-run-verification: script from $PROJECT_ROOT, blocks in $WT --
# dispatch-run-verification runs each verify block via bash in the CURRENT
# working directory, so the blocks must run against the merged node tree — via a
# SCOPED subshell that never mutates the session's cwd — while the script itself
# still comes from the fresh primary checkout.
assert_eq "lane3: dispatch-run-verification runs inside a 'cd \"\$WT\"' subshell" \
  "1" "$(count_matches '^\( *cd "\$WT" &&' "$LANE3_FENCED")"
assert_eq "lane3: dispatch-run-verification is named by a \$PROJECT_ROOT-prefixed path" \
  "1" "$(count_matches '"\$PROJECT_ROOT/\.claude/skills/dispatch-propagate/scripts/dispatch-run-verification"' "$LANE3_FENCED")"

# --- 6. helper scripts are invoked by absolute path under $PROJECT_ROOT -----
# A relative `.claude/…` or `packages/…` invocation resolves against whatever cwd
# the block has — potentially $WT, the stale tree this change exists to stop
# reading from. The one deliberate exception is the bootstrap that resolves
# $PROJECT_ROOT itself, which cannot yet reference it.
RELATIVE_INVOCATIONS=$(grep -nE '(^|[|(&] *)(\.claude/skills|packages/intentionsutil/scripts)/' <<<"$LANE3_FENCED" \
  | grep -v 'lib-graph-worktree.sh' || true)
assert_eq "lane3: no bare relative helper-script invocation in a fenced block" \
  "" "$RELATIVE_INVOCATIONS"
assert_eq "lane3: the \$PROJECT_ROOT bootstrap sources lib-graph-worktree.sh" \
  "1" "$(count_matches '^PROJECT_ROOT=\$\(source \.claude/skills/dispatch-propagate/scripts/lib-graph-worktree\.sh && resolve_main_worktree\)' "$LANE3_FENCED")"
assert_eq "lane3: \$WT is derived from \$PROJECT_ROOT and \$SOURCE_ID" \
  "1" "$(count_matches '^WT="\$PROJECT_ROOT/\.claude/worktrees/\$SOURCE_ID"' "$LANE3_FENCED")"

# --- 7. "Who enters each lane" records the primary-checkout --cwd -----------
# Whitespace-normalized: the sentence legitimately wraps across source lines.
WHO_FLAT=$(tr '\n' ' ' <<<"$WHO" | tr -s ' ')
assert_eq "who-enters: Lane 3 bullet says --cwd is on the primary checkout" \
  "1" "$(count_matches '`--cwd` on the \*\*primary checkout\*\*' "$WHO_FLAT")"
assert_eq "who-enters: Lane 3 bullet no longer names the node's worktree as --cwd" \
  "0" "$(count_matches '<project-root>/\.claude/worktrees/<node-id>' "$WHO")"

report_results
