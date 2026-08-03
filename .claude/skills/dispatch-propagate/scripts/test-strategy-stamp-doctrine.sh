#!/usr/bin/env bash
# Doctrine ratchet for the strategy_fingerprint stamp-coverage fix
# (tactic-strategy-fingerprint-stamp-coverage). Unit 2 wired transition-node
# to seed/refresh each tactic's execution.strategy_fingerprint map on every
# forward (not strategy-stale) transition, via apply-node-transition.ts, and
# Unit 3 reconciled the align-tactics/align-strategy doctrine that previously
# described this as an unimplemented "bootstrap-interim hand-stamp" gap. A
# later fix pass closed two further gaps that let the mint-time doctrine
# regress silently: write-path.md's earlier step-1 mint passage could drift
# out of sync with its own "Closed: the mint-to-first-transition window"
# section (commit 307fac5e reconciled it), and tactic-target.md /
# align-strategy/SKILL.md never mentioned the mint-time flags at all (commit
# 0d4c09a8 added them). This suite guards all of it so no part can silently
# regress: the router-side mechanism (assertions 1-2), the write-path.md
# doctrine that describes it (assertions 3-4, 6-7), write-node.ts's
# implementation of the mint-time flags (assertion 5), and the sibling
# doctrine docs that reference them (assertions 8-9).
#
# Modeled on test-align-tactics-write-path-freshness.sh: a prose/fenced-block
# guard over skill doctrine and script text, not a functional test harness —
# one assertion per requirement so a regression in any one is legible on its
# own.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "=== strategy_fingerprint stamp-coverage doctrine guard ==="
#
# If an expectation below legitimately changes (e.g. the guard construction
# moves, or the doctrine wording changes), update this row AND confirm the
# underlying behavior still holds — never drop a row or an assertion just to
# make this suite green (.claude/rules/test-integrity.md).

GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
TRANSITION_NODE="$GUARD_ROOT/.claude/skills/dispatch-propagate/scripts/transition-node"
WRITE_PATH="$GUARD_ROOT/.claude/skills/align-tactics/references/write-path.md"
WRITE_NODE="$GUARD_ROOT/packages/intentionsutil/scripts/write-node.ts"
TACTIC_TARGET="$GUARD_ROOT/.claude/skills/align-tactics/references/tactic-target.md"
ALIGN_STRATEGY_SKILL="$GUARD_ROOT/.claude/skills/align-strategy/SKILL.md"

# --- 1. transition-node constructs --strategy-fingerprint in APPLY_FLAGS ----
#
# Bind to the APPLY_FLAGS-building region specifically (not a file-global
# occurrence), so this fails if the flag construction is deleted from where
# transition-node actually assembles its call to apply-node-transition.ts.

if [[ ! -f "$TRANSITION_NODE" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: transition-node constructs --strategy-fingerprint in APPLY_FLAGS: file missing: .claude/skills/dispatch-propagate/scripts/transition-node"
else
  actual=$(awk '
    /^APPLY_FLAGS=\(/ { insec = 1 }
    insec { buf = buf $0 "\n" }
    insec && /^if !.*apply-node-transition\.ts/ { insec = 0 }
    END {
      if (index(buf, "--strategy-fingerprint") > 0) { print "present" } else { print "absent" }
    }
  ' "$TRANSITION_NODE")
  assert_eq "transition-node constructs --strategy-fingerprint within its APPLY_FLAGS build" \
    "present" "$actual"
fi

# --- 2. That construction is guarded on the not-stale branch -----------------
#
# The append must be conditioned on STRATEGY_STALE being false — grep for both
# the guard variable/literal and the flag within a small window of each other,
# so removing the `if [[ "$STRATEGY_STALE" == "false" ...` guard (e.g.
# hoisting the append unconditionally) fails this even though assertion 1
# above would still pass.

if [[ ! -f "$TRANSITION_NODE" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: transition-node guards --strategy-fingerprint on the not-stale branch: file missing"
else
  actual=$(awk '
    /STRATEGY_STALE.*==.*"false"/ { guard_line = NR }
    /--strategy-fingerprint/ {
      if (guard_line > 0 && (NR - guard_line) <= 5) { found = 1 }
    }
    END { if (found) { print "guarded" } else { print "unguarded" } }
  ' "$TRANSITION_NODE")
  assert_eq "transition-node guards the --strategy-fingerprint append on STRATEGY_STALE == \"false\"" \
    "guarded" "$actual"
fi

# --- 3. write-path.md names the router/transition-node as the seeding producer ----

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md names transition-node as the seeding producer: file missing: .claude/skills/align-tactics/references/write-path.md"
else
  actual=$(awk '
    /transition-node/ { has_transition_node = 1 }
    /seed/ || /SEED/ || /seeds/ { has_seed = 1 }
    END {
      if (has_transition_node && has_seed) { print "present" } else { print "absent" }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md names transition-node as the live router's seeding producer" \
    "present" "$actual"
fi

# --- 4. write-path.md still forbids the bare-string form ---------------------
#
# Confirms Unit 3's doc edits did not accidentally drop the never-emit-bare-
# string rule while reconciling the surrounding paragraph.

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md forbids the bare-string form: file missing"
else
  actual=$(tr '\n' ' ' < "$WRITE_PATH" | grep -coE -- 'bare-string form is deprecated-legacy — never emit' || true)
  if [[ "$actual" -gt 0 ]]; then actual="present"; else actual="absent"; fi
  assert_eq "write-path.md still forbids emitting the bare-string stamp form" "present" "$actual"
fi

# --- 5. write-node.ts implements the MINT-time stamp flags ------------------
#
# The mint-to-first-transition window is closed by write-node.ts accepting the
# same keyed flag pair as apply-node-transition.ts. Bind to the parseArgs
# switch specifically, so deleting the flag cases (leaving only the prose
# header comment) fails this.

if [[ ! -f "$WRITE_NODE" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-node.ts implements the mint-time stamp flags: file missing: packages/intentionsutil/scripts/write-node.ts"
else
  actual=$(awk '
    /^export function parseArgs\(/ { insec = 1 }
    insec && /case "--strategy-fingerprint":/ { has_fp = 1 }
    insec && /case "--strategy-sha":/ { has_sha = 1 }
    insec && /^}/ && NR > 1 { insec = 0 }
    END { if (has_fp && has_sha) { print "present" } else { print "absent" } }
  ' "$WRITE_NODE")
  assert_eq "write-node.ts parseArgs accepts --strategy-fingerprint and --strategy-sha" \
    "present" "$actual"
fi

# --- 6. write-path.md documents the window as CLOSED, not deferred ----------
#
# The doc previously described the gap as deferred future work. It now must
# name write-node.ts's mint-time flags as the closure. Guards against a
# revert-by-doc-edit that leaves the code in place but tells sessions the stamp
# is somebody else's job.

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md documents the mint-time stamp: file missing"
else
  actual=$(awk '
    /Closed: the mint-to-first-transition window/ { closed = 1 }
    /write-node\.ts/ && /--strategy-fingerprint/ { names_flag = 1 }
    /--strategy-fingerprint <strategy-id>=<hash>/ { names_flag = 1 }
    /Closing this window is deferred/ { still_deferred = 1 }
    END {
      if (closed && names_flag && !still_deferred) { print "closed" } else { print "open" }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md documents the mint-to-first-transition window as closed by write-node.ts's flags" \
    "closed" "$actual"
fi

# --- 7. write-path.md's step-1 mint instruction agrees with the mint-time-stamp section ----
#
# Binds to the step-1 region specifically — the block from "1. **Frontmatter
# via `write-node.ts`.**" up to (not including) "2. **Freshness assertion" —
# so a file-global --strategy-fingerprint mention elsewhere (e.g. the
# "Closed" section itself) cannot satisfy this: the step-1 passage must
# itself point to the mint-time flags. Also requires the absence of the
# negative instruction ("should not, hand-stamp") that previously told the
# session to skip the stamp and defer it to the first transition.

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md's step-1 mint instruction agrees with the mint-time-stamp section: file missing"
else
  actual=$(awk '
    /^1\. \*\*Frontmatter via `write-node\.ts`\.\*\*/ { insec = 1 }
    insec { buf = buf $0 "\n" }
    insec && /^2\. \*\*Freshness assertion/ { insec = 0 }
    END {
      has_flag = (index(buf, "--strategy-fingerprint") > 0 || index(buf, "mint-time stamp") > 0)
      has_negative = (index(buf, "should not, hand-stamp") > 0)
      if (has_flag && !has_negative) { print "agrees" } else { print "disagrees" }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md's step-1 mint instruction directs the session to pass the mint-time flags, not skip them" \
    "agrees" "$actual"
fi

# --- 8. tactic-target.md mentions the mint-time flags ------------------------
#
# tactic-target.md previously never mentioned write-node.ts's mint-time
# --strategy-fingerprint/--strategy-sha flags at all. Guards against that
# silently regressing back out.

if [[ ! -f "$TACTIC_TARGET" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: tactic-target.md mentions the mint-time flags: file missing: .claude/skills/align-tactics/references/tactic-target.md"
else
  actual=$(awk '
    /write-node\.ts/ { has_write_node = 1 }
    /--strategy-fingerprint/ || /mint-time stamp/ { has_flag = 1 }
    END {
      if (has_write_node && has_flag) { print "present" } else { print "absent" }
    }
  ' "$TACTIC_TARGET")
  assert_eq "tactic-target.md mentions write-node.ts's mint-time stamp flags" \
    "present" "$actual"
fi

# --- 9. align-strategy/SKILL.md mentions the mint-time flags -----------------
#
# Same gap as assertion 8, in the sibling align-strategy/SKILL.md doctrine.

if [[ ! -f "$ALIGN_STRATEGY_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: align-strategy/SKILL.md mentions the mint-time flags: file missing: .claude/skills/align-strategy/SKILL.md"
else
  actual=$(awk '
    /write-node\.ts/ { has_write_node = 1 }
    /--strategy-fingerprint/ || /mint-time stamp/ { has_flag = 1 }
    END {
      if (has_write_node && has_flag) { print "present" } else { print "absent" }
    }
  ' "$ALIGN_STRATEGY_SKILL")
  assert_eq "align-strategy/SKILL.md mentions write-node.ts's mint-time stamp flags" \
    "present" "$actual"
fi

report_results
