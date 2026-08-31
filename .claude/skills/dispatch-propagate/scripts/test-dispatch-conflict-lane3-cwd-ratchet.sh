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
#   * helper scripts are invoked by absolute path under $PROJECT_ROOT — except
#     the $PROJECT_ROOT bootstrap itself and, for the permissions.allow prefix
#     match, `graph-commit` and `dispatch-mark-complete`, whose repo-relative
#     spelling is load-bearing; each exception carries its own compensating
#     assertion (see sections 6/6b/6c),
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
# "at least one" — for shapes that MUST appear but may legitimately repeat.
# Shell variables do not survive between Bash tool calls (only cwd does), so the
# $PROJECT_ROOT/$WT bootstrap is expected to be re-derived per fenced block; an
# exactly-one assertion would forbid the very remedy the doctrine prescribes.
at_least_one() { [[ "$(count_matches "$1" "$2")" -ge 1 ]] && echo yes || echo no; }

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
#
# The SECOND deliberate exception is `graph-commit`. PR #3136 (a4a964b8,
# 2026-08-29) spelled that call repo-relative ON PURPOSE: `.claude/settings.json`
# carries `"Bash(packages/intentionsutil/scripts/graph-commit:*)"` in
# `permissions.allow`, and that matcher is a PREFIX match against the literal
# command string as typed. A `"$PROJECT_ROOT/packages/…"` spelling does not match
# it, so the call falls through to the auto-mode permission classifier — the
# bypass #3136 exists to close (`.claude/rules/sandbox.md`, "Command pattern
# matching": "re-spelling a call site silently re-exposes it to the classifier").
# The expectation legitimately changed; the PROPERTY this row guards — the
# invocation cannot be pointed at the node's stale worktree — did not, and is
# re-asserted for graph-commit in section 6b below via its `-C "$PROJECT_ROOT"`.
#
# The THIRD deliberate exception is `dispatch-mark-complete`, by the same
# mechanism: `.claude/settings.json` carries
# `"Bash(.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete:*)"` in
# `permissions.allow`, a PREFIX match against the literal command string as
# typed, so a `"$PROJECT_ROOT/.claude/skills/…"` spelling misses it and the call
# falls through to the auto-mode classifier. The PROPERTY this row guards — the
# invocation cannot be pointed at the node's stale worktree — still holds, but by
# a DIFFERENT compensation from graph-commit's: dispatch-mark-complete writes
# only the phase-completed marker under $CLAUDE_JOB_DIR and touches no checkout
# at all, so there is no write to mis-target and no `-C` to pass. The
# *resolution* of the relative path is safe for the separate reason that Lane 3's
# session cwd IS the primary checkout — the very property section 7 of this suite
# enforces. Section 6c below asserts that compensation.
#
# Note, pre-answered: this `grep -v` is unanchored, so a future line carrying
# both `dispatch-mark-complete` and a second, genuinely-bad relative invocation
# would be filtered whole. The `graph-commit` exclusion above has the identical
# shape; matching it is deliberate, so the exceptions stay legible as one pattern
# rather than three.
RELATIVE_INVOCATIONS=$(grep -nE '(^|[|(&] *)(\.claude/skills|packages/intentionsutil/scripts)/' <<<"$LANE3_FENCED" \
  | grep -v 'lib-graph-worktree.sh' \
  | grep -v 'packages/intentionsutil/scripts/graph-commit' \
  | grep -v '\.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete' || true)
assert_eq "lane3: no bare relative helper-script invocation in a fenced block" \
  "" "$RELATIVE_INVOCATIONS"

# --- 6b. the graph-commit exception is compensated by -C "$PROJECT_ROOT" ----
# graph-commit resolves its repo root from `-C`/`--repo`, else **cwd** — never
# from its own location (packages/intentionsutil/scripts/graph-commit:38). With
# the relative spelling excepted above, `-C "$PROJECT_ROOT"` is the ONLY thing
# keeping the write off whatever cwd the block has, i.e. potentially $WT. So
# every fenced graph-commit invocation must carry it, on the SAME line as the
# command (that one canonical agent-typed spelling is also what the
# permissions.allow prefix match and section 6's exception key on).
GRAPH_COMMIT_CALLS=$(count_matches '(^|[|(&] *)packages/intentionsutil/scripts/graph-commit( |$)' "$LANE3_FENCED")
# Non-vacuity: if Lane 3 ever stops invoking graph-commit, the exception carved
# above is dead weight and this row says so rather than passing silently.
assert_eq "lane3: the graph-commit exception is non-vacuous (Lane 3 still invokes it)" \
  "yes" "$([[ "$GRAPH_COMMIT_CALLS" -ge 1 ]] && echo yes || echo no)"
GRAPH_COMMIT_UNSCOPED=$(grep -nE '(^|[|(&] *)packages/intentionsutil/scripts/graph-commit( |$)' <<<"$LANE3_FENCED" \
  | grep -vE 'graph-commit +(-C|--repo) +"\$PROJECT_ROOT"' || true)
assert_eq "lane3: every fenced graph-commit invocation carries -C \"\$PROJECT_ROOT\"" \
  "" "$GRAPH_COMMIT_UNSCOPED"

# --- 6c. the dispatch-mark-complete exception is compensated by cwd-independence
# Unlike graph-commit there is no `-C` to assert: dispatch-mark-complete writes
# only under $CLAUDE_JOB_DIR and touches no checkout, so the compensation is that
# there is no checkout-targeted write to get wrong. What must be guarded instead
# is that the bypass really is closed (no $PROJECT_ROOT-prefixed spelling comes
# back) and that the Step 9 compensating note itself is present where an
# executing agent reads it — in the lane's own prose, not only here.
MARK_COMPLETE_CALLS=$(count_matches '(^|[|(&] *)\.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete( |$)' "$LANE3_FENCED")
# Non-vacuity, mirroring 6b: if Lane 3 ever stops invoking it, the exception
# carved in section 6 is dead weight and this row says so.
assert_eq "lane3: the dispatch-mark-complete exception is non-vacuous (Lane 3 still invokes it)" \
  "yes" "$([[ "$MARK_COMPLETE_CALLS" -ge 1 ]] && echo yes || echo no)"
# The bypass itself: no $PROJECT_ROOT-prefixed spelling may survive. The pattern
# is deliberately QUOTE-AGNOSTIC. Requiring the literal `"` at both ends would
# let an UNQUOTED $PROJECT_ROOT/.claude/.../dispatch-mark-complete regression
# walk straight through, and section 6 cannot catch that one either: its pattern
# anchors on a line-leading (or |(&-leading) `.claude/skills`, which a
# $PROJECT_ROOT-prefixed path does not have.
assert_eq "lane3: no \$PROJECT_ROOT-prefixed dispatch-mark-complete invocation remains" \
  "0" "$(count_matches '\$PROJECT_ROOT/\.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete' "$LANE3_FENCED")"
# The compensating property must be stated in the lane's prose, not only here.
#
# NOT keyed on the bare word 'cwd-independent'. Lane 3 has carried that word
# since BEFORE this exception existed — the "Both write under $CLAUDE_JOB_DIR
# and are cwd-independent" sentence is present at the base commit of the PR that
# added this section — so a row keyed on it stays GREEN with the entire Step 9
# compensating note deleted. Measured, not reasoned: deleting that note left
# this suite 24/24. Key the rows on text only the note itself supplies.
assert_eq "lane3: Step 9 prose cites the dispatch-mark-complete permissions.allow entry" \
  "yes" "$(at_least_one 'Bash\(\.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete:\*\)' "$LANE3")"
assert_eq "lane3: Step 9 prose states dispatch-mark-complete needs no -C compensation" \
  "yes" "$(at_least_one 'needs no `-C` compensation' "$LANE3")"
# And the sandbox half of the same note (finding 2): cwd-independence is not
# permission. Both job-dir marker writes need the pre-emptive override.
assert_eq "lane3: Step 9 prose separates cwd-independence from sandbox-safety" \
  "yes" "$(at_least_one 'Cwd-independent is not sandbox-safe' "$LANE3")"

assert_eq "lane3: the \$PROJECT_ROOT bootstrap sources lib-graph-worktree.sh" \
  "yes" "$(at_least_one '^PROJECT_ROOT=\$\(source \.claude/skills/dispatch-propagate/scripts/lib-graph-worktree\.sh && resolve_main_worktree\)' "$LANE3_FENCED")"
assert_eq "lane3: \$WT is derived from \$PROJECT_ROOT and a source id" \
  "yes" "$(at_least_one '^WT="\$PROJECT_ROOT/\.claude/worktrees/(\$SOURCE_ID|<literal-source-id>)"' "$LANE3_FENCED")"

# --- 8. the bootstrap is declared non-persistent across Bash tool calls ------
# The Bash tool persists only the WORKING DIRECTORY between calls; shell
# variables do not. Lane 3 spans ~12 separate calls, so a $WT/$PROJECT_ROOT set
# once in Step 1 would expand EMPTY in every later one (`git -C ""`, and helper
# paths rooted at `/`). The skill must say so and prescribe re-derivation or
# literal substitution — assertion 6 above deliberately allows repeats so that
# remedy is expressible.
assert_eq "lane3: prose states shell variables do not survive between Bash tool calls" \
  "yes" "$(at_least_one 'do not survive between Bash tool calls' "$LANE3")"
assert_eq "lane3: prose prescribes re-deriving or substituting literals per call" \
  "yes" "$(at_least_one 'Re-run the bootstrap at the top of that same call' "$LANE3")"

# --- 7. "Who enters each lane" records the primary-checkout --cwd -----------
# Whitespace-normalized: the sentence legitimately wraps across source lines.
WHO_FLAT=$(tr '\n' ' ' <<<"$WHO" | tr -s ' ')
assert_eq "who-enters: Lane 3 bullet says --cwd is on the primary checkout" \
  "1" "$(count_matches '`--cwd` on the \*\*primary checkout\*\*' "$WHO_FLAT")"
assert_eq "who-enters: Lane 3 bullet no longer names the node's worktree as --cwd" \
  "0" "$(count_matches '<project-root>/\.claude/worktrees/<node-id>' "$WHO")"

report_results
