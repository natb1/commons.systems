#!/usr/bin/env bash
# Doctrine ratchet for the strategy_fingerprint stamp-coverage fix
# (tactic-strategy-fingerprint-stamp-coverage). Unit 2 wired transition-node
# to seed/refresh each tactic's execution.strategy_fingerprint map on every
# forward (not strategy-stale) transition, via apply-node-transition.ts, and
# Unit 3 reconciled the align-tactics/align-strategy doctrine that previously
# described this as an unimplemented "bootstrap-interim hand-stamp" gap. This
# suite guards both halves so neither can silently regress: the router-side
# mechanism (assertions 1-2) and the doctrine that describes it (assertions
# 3-4).
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

report_results
