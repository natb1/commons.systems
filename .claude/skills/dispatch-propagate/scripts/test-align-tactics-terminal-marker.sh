#!/usr/bin/env bash
# Doctrine ratchet for the /align-tactics terminal-marker bundling mandate
# (tactic-align-tactics-mark-terminal-skipped, Unit 1). /align-tactics used to
# land its round with a bare `graph-commit` call and then, a turn or more
# later, was told by SKILL.md prose to separately call `mark-node-terminal
# <node-id> align-round`. A session that died in between left the round landed
# on main with no declared disposition, so dispatch-tick's
# terminal-without-disposition sweep parked the node (confirmed 3x in
# production). `packages/intentionsutil/scripts/land-align-round` closes that
# gap by writing the marker in the SAME process as the land — the same
# guarantee park-node and transition-node already carry.
#
# Modeled on test-align-tactics-write-path-freshness.sh: a prose/fenced-block
# guard over skill doctrine, not a functional harness over a script (that is
# packages/intentionsutil/scripts/test-land-align-round.sh).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "=== align-tactics: terminal-marker bundling doctrine guard ==="
#
# Each requirement gets its own assertion rather than one pass/fail, so a
# regression in any one of them is legible on its own.
#
# If an expectation below legitimately changes (a rewording, a moved step),
# update the row AND confirm the guarantee still holds at every site — never
# drop a row or an assertion just to make this suite green
# (.claude/rules/test-integrity.md).

GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
WRITE_PATH="$GUARD_ROOT/.claude/skills/align-tactics/references/write-path.md"
ALIGN_TACTICS_SKILL="$GUARD_ROOT/.claude/skills/align-tactics/SKILL.md"
LAND_ALIGN_ROUND="$GUARD_ROOT/packages/intentionsutil/scripts/land-align-round"

# --- 1. write-path.md names land-align-round in the tactic-target recipe -----
#
# The single-node tactic-target land recipe is the one a per-node finalize
# session follows; it must name the wrapper, not a bare graph-commit.

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md names land-align-round in the tactic-target recipe: file missing: .claude/skills/align-tactics/references/write-path.md"
else
  actual=$(awk '
    /^## Capture a base manifest/ { insec = 1; next }
    insec && /^## / { insec = 0 }
    insec { buf = buf $0 "\n" }
    END {
      if (index(buf, "land-align-round") > 0) { print "present" } else { print "absent" }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md names land-align-round in the single-node tactic-target land recipe" "present" "$actual"
fi

# --- 2. write-path.md names land-align-round in the Step 4 land section ------

if [[ ! -f "$WRITE_PATH" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: write-path.md names land-align-round in the Step 4 land section: file missing"
else
  actual=$(awk '
    /^## Per node \(tactic or gate\)/ { insec = 1; next }
    insec && /^## / { insec = 0 }
    insec { buf = buf $0 "\n" }
    END {
      if (index(buf, "land-align-round") > 0) { print "present" } else { print "absent" }
    }
  ' "$WRITE_PATH")
  assert_eq "write-path.md names land-align-round in Step 4 (\"Land via graph-commit\") of 'Per node (tactic or gate)'" \
    "present" "$actual"
fi

# --- 3. SKILL.md no longer carries a standalone align-round marker call ------
#
# The marker is now written by land-align-round in the same process as the
# land. A standalone fenced `mark-node-terminal ... align-round` command in
# SKILL.md would resurrect the separated-call failure mode.

if [[ ! -f "$ALIGN_TACTICS_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: SKILL.md carries no standalone align-round marker command: file missing: .claude/skills/align-tactics/SKILL.md"
else
  n=$(grep -cE '^[[:space:]]*(packages/intentionsutil/scripts/)?mark-node-terminal .* align-round[[:space:]]*$' "$ALIGN_TACTICS_SKILL" || true)
  if [[ "$n" -eq 0 ]]; then actual="absent"; else actual="present ($n)"; fi
  assert_eq "align-tactics SKILL.md carries no standalone 'mark-node-terminal ... align-round' command" "absent" "$actual"
fi

# --- 4. SKILL.md STILL carries the exit-12 no-claim marker call --------------
#
# Asserted alongside row 3 deliberately: without it, the ratchet could be
# satisfied by deleting the wrong marker call. The exit-12 path lands nothing,
# so it stays a bare prose call and is explicitly out of land-align-round's
# scope.

if [[ ! -f "$ALIGN_TACTICS_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: SKILL.md still carries the exit-12 no-claim marker command: file missing"
else
  n=$(grep -cE '^[[:space:]]*(packages/intentionsutil/scripts/)?mark-node-terminal .* no-claim[[:space:]]*$' "$ALIGN_TACTICS_SKILL" || true)
  if [[ "$n" -gt 0 ]]; then actual="present"; else actual="absent"; fi
  assert_eq "align-tactics SKILL.md still carries the exit-12 'mark-node-terminal ... no-claim' command" "present" "$actual"
fi

# --- 4b. the MECHANICAL-ERROR path also reaps ------------------------------
#
# Row 4 only asserts the marker is present SOMEWHERE, so it stays green even if
# a path loses it. This pins the specific path that used to lack it.
#
# check-node-selection maps every throw to the config-class exit 2 — a
# malformed store among them. That exit lands in the "any other non-zero"
# bullet. When that bullet said only "report and stop", the session ended with
# no terminal disposition: dispatch-self-close then held the node worker alive
# and graph-select-target skipped the node as `live-session` from that point
# on, so it became permanently unselectable and consumed a job slot forever.
# The gate runs at Step 0, before any graph write, so a session that fails it
# did nothing and lost nothing — the same reasoning the 12 and 15 bullets use.

if [[ ! -f "$ALIGN_TACTICS_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: mechanical-error bullet carries the no-claim marker: file missing"
else
  # The bullet's own text, up to the next top-level list item.
  # HERE-STRING, never `printf | grep -q`. Under `set -o pipefail` grep -q
  # exits on its FIRST match, the writer takes SIGPIPE, the pipeline reports
  # 141, and a PRESENT marker is scored "absent" — a false failure that grows
  # more likely as the bullet's prose grows. Same shape already fixed in
  # test-helpers.sh on 2026-08-13.
  block=$(awk '/any other non-zero/{f=1} f{print} f && /^   \*\*Deliberately not gated/{exit}' "$ALIGN_TACTICS_SKILL")
  if grep -qE 'mark-node-terminal .* no-claim' <<<"$block"; then
    actual="present"
  else
    actual="absent"
  fi
  assert_eq "align-tactics SKILL.md: the 'any other non-zero' bullet reaps with 'mark-node-terminal ... no-claim'" "present" "$actual"

  # The `13` bullet is the one path the skill explicitly NAMES a mechanical
  # error, so it is the one most likely to be "tidied" back to report-and-stop.
  block13=$(awk '/^   - `13` —/{f=1} f{print} f && /^   - `15` —/{exit}' "$ALIGN_TACTICS_SKILL")
  if grep -qE 'mark-node-terminal .* no-claim' <<<"$block13"; then
    actual13="present"
  else
    actual13="absent"
  fi
  assert_eq "align-tactics SKILL.md: the exit-13 bullet also reaps with 'mark-node-terminal ... no-claim'" "present" "$actual13"
fi

# --- 5. SKILL.md states validate-graph.ts runs AFTER the marker --------------
#
# Ordering matters: the marker is written by the land itself, so validation now
# runs after it. A validate-graph.ts failure on an already-landed round is a
# follow-up, not a reason to hold the session alive.

if [[ ! -f "$ALIGN_TACTICS_SKILL" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: SKILL.md states validate-graph.ts runs after the marker: file missing"
else
  actual=$(awk '
    { buf = buf $0 "\n" }
    END {
      lar = index(buf, "land-align-round")
      # Matched without the leading `validate-graph.ts` so the inline code
      # backticks around it are not part of the needle.
      vg = index(buf, "runs AFTER the marker")
      if (lar > 0 && vg > 0) { print "stated" }
      else { print "missing: land-align-round=" (lar>0) " after-marker=" (vg>0) }
    }
  ' "$ALIGN_TACTICS_SKILL")
  assert_eq "align-tactics SKILL.md states validate-graph.ts runs AFTER the land-align-round marker" "stated" "$actual"
fi

# --- 6. land-align-round exists and is executable ----------------------------

if [[ ! -f "$LAND_ALIGN_ROUND" ]]; then
  TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
  echo "  FAIL: land-align-round exists and is executable: file missing: packages/intentionsutil/scripts/land-align-round"
elif [[ -x "$LAND_ALIGN_ROUND" ]]; then
  assert_eq "land-align-round exists and is executable" "executable" "executable"
else
  assert_eq "land-align-round exists and is executable" "executable" "not-executable"
fi

report_results
