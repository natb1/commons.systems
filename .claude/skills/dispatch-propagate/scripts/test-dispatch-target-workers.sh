#!/usr/bin/env bash
# Tests for dispatch-target-workers -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 10379-11441.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-target-workers tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of dispatch-target-workers + dispatch-config-load
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/rl/        synthetic rate_limits.json directory
#
# All telemetry inputs are env-overridable; tests rely on the overrides rather
# than fixture files when shape matters more than the file path. The script
# defaults are baked in (weekly_pace_floor=50, weekly_terminal=100,
# weekly_terminal_windows=2, weekly_increment_cap=10, weekly_curve_power=1,
# T=33.6 exact, five_hour_target_floor=50, five_hour_target_ceiling=80,
# max_workers=8); tests that vary tunables write a
# target-workers.json into the config dir.
#
# The curve is an explicitly-anchored floor→shoulder→terminal max curve,
# evaluated in r = remaining_seconds / 18000 (remaining 5-hour windows):
#   shoulder     = terminal − cap·Nterm                 (= 100 − 10·2 = 80)
#   s            = clamp((T − r) / (T − Nterm), 0, 1)    (= clamp((33.6−r)/31.6,0,1))
#   rise         = floor + (shoulder − floor)·s^p        (= 50 + 30·s^p)
#   terminal_seg = terminal − cap·r                       (= 100 − 10·r)
#   W(r)         = max(floor, terminal_seg, rise)
# A config that violates anchor-ordering (floor > shoulder) is REJECTED by
# dispatch-config-load, so any config written here keeps floor ≤ terminal−cap·Nterm.
#
# The curve needs the elapsed fraction x of the weekly window. With
# WEEK_SECONDS=604800, x = (WEEK_SECONDS - (resets_at_weekly - now)) /
# WEEK_SECONDS, and r = (1−x)·33.6. Tests place x precisely by fixing NOW and
# choosing resets_at so remaining = resets_at - NOW lands at the desired
# fraction of WEEK_SECONDS:
#   x=0.5  → remaining=302400 → resets_at = NOW + 302400
#   x=0.25 → remaining=453600 → resets_at = NOW + 453600
#   x=1.0  → remaining≈0      → resets_at = NOW + 1 (still > now so not the
#                               "window already reset" path)
# Anchor windows place r directly: resets_at = NOW + r·18000.
# Verified canonical curve at defaults (floor=50, terminal=100, cap=10, Nterm=2, p=1):
#   W(0)=50, W(0.25)=57.97, W(0.5)=65.95, W(0.75)=73.92, W(0.9)=78.71;
#   r=2→80, r=1→90, r≈0→100.
echo ""
echo "=== dispatch-target-workers ==="

tw_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config" "$TMPDIR_TEST/rl"

  cp "$SCRIPT_DIR/dispatch-target-workers" "$TMPDIR_TEST/scripts/dispatch-target-workers"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-config-load sources lib.sh via its SCRIPT_DIR — so lib.sh must sit
  # alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-target-workers" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  # Default: point at an absent file so tests without explicit telemetry get
  # the missing-telemetry fallback unless they override env vars.
  export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/missing.json"
}

tw_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH
  unset DISPATCH_TARGET_WORKERS_NOW
  unset DISPATCH_TARGET_WORKERS_USED_WEEKLY
  unset DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY
  unset DISPATCH_TARGET_WORKERS_USED_5H
  unset DISPATCH_TARGET_WORKERS_RESETS_AT_5H
}

# write_rl <file-name> <used_weekly> <resets_weekly> <used_5h> <resets_5h>
#   Write a rate_limits.json with the four telemetry fields. Set any of the
#   four to the literal string "absent" to omit the surrounding block.
write_rl() {
  local name="$1" uw="$2" rw="$3" u5="$4" r5="$5"
  local path="$TMPDIR_TEST/rl/$name"
  local seven=""
  local five=""
  if [[ "$uw" != "absent" && "$rw" != "absent" ]]; then
    seven="\"seven_day\":{\"used_percentage\":$uw,\"resets_at\":$rw}"
  fi
  if [[ "$u5" != "absent" && "$r5" != "absent" ]]; then
    five="\"five_hour\":{\"used_percentage\":$u5,\"resets_at\":$r5}"
  fi
  local parts=()
  [[ -n "$five" ]] && parts+=("$five")
  [[ -n "$seven" ]] && parts+=("$seven")
  local joined
  joined=$(IFS=,; printf '%s' "${parts[*]}")
  printf '{%s}\n' "$joined" > "$path"
  export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$path"
}

# --- Test 1: curve reaches its terminal only at week end --------------------

echo "Test: weekly curve reaches terminal only at week end (W < terminal mid-week)"
tw_setup
# Mid-week the anchored curve W is well below the week-end terminal, so
# used_weekly just below the terminal is far ahead of pace → gate closed → N=0.
# Only at week end does the terminal segment lift W to ~terminal and let that
# used_weekly come under pace. Probe with used_weekly = 89 at several x.
#   x=0.5  → W=65.95 → used_weekly=89 is far ahead of pace → gate closed → N=0
#   x=0.75 → W=73.92 → used_weekly=89 still ahead of pace  → gate closed → N=0
#   x=1.0  → terminal_seg→100 → used_weekly=89 → hw≈11>0 → gate open → N>=1
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
for spec in "0.5:0" "0.75:0" "1.0:ge1"; do
  x="${spec%%:*}"; want="${spec##*:}"
  r=$(tw_resets_for_x "$x")
  write_rl "curve.json" 89 "$r" 0 99999999
  result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
  if [[ "$want" == "ge1" ]]; then
    TOTAL=$((TOTAL + 1))
    if (( result >= 1 )); then
      PASS=$((PASS + 1)); echo "  PASS: x=$x used_weekly=89 under pace → N=$result (>=1)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: x=$x used_weekly=89 expected N>=1, got $result"
    fi
  else
    assert_eq "curve x=$x used_weekly=89 ahead of pace → N=0" "$want" "$result"
  fi
done
tw_teardown

# --- Test 2: W matches the canonical curve at x=0.5 -------------------------

echo "Test: weekly curve value W(0.5)=65.95 closes the gate at the boundary"
tw_setup
# x=0.5 → W=65.95. used_weekly=66 (>65.95) → hw<0 → gate closed → N=0.
# used_weekly=65 (<65.95) → hw>0 → gate open → N>=1 (just under pace).
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 66 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "W(0.5)=65.95; used_weekly=66 at/over pace → N=0" "0" "$out"
write_rl "rl.json" 65 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: used_weekly=65 just under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: used_weekly=65 expected N>=1, got $out"
fi
tw_teardown

# --- Test 3: increment cap sets the terminal slope and shoulder -------------

echo "Test: weekly_increment_cap_pct sets the terminal slope and shoulder"
tw_setup
# cap no longer clamps a smooth curve — it sets the terminal-segment slope AND
# the shoulder (shoulder = terminal − cap·Nterm). With cap=5 (admissible:
# shoulder = 100 − 5·2 = 90 ≥ floor 50), at r=2 the rise reaches the shoulder
# (s=1 → rise=90) and terminal_seg = 100 − 5·2 = 90, so W=90 at r=2 (vs the
# default cap=10 → W=80 at r=2). Place r=2 via resets_at = NOW + 2·18000.
# used_weekly=89 (<90) → under pace → N>=1; used_weekly=91 (>90) → ahead → N=0.
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_increment_cap_pct": 5}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$((TW_NOW + 2 * 18000))
write_rl "rl.json" 89 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: cap=5 r=2 W=90; used_weekly=89 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cap=5 used_weekly=89 expected N>=1, got $out"
fi
write_rl "rl.json" 91 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "cap=5 r=2 W=90; used_weekly=91 ahead → N=0" "0" "$out"
tw_teardown

# --- Test 4: weekly_pace_floor sets the early-week floor --------------------

echo "Test: weekly_pace_floor_pct sets the curve's early-week floor"
tw_setup
# The floor is the curve's value early in the week: at x=0 (r=33.6), s=0 →
# rise=floor and terminal_seg is deeply negative, so W=floor. With
# weekly_pace_floor_pct=60 (admissible: 60 ≤ shoulder 80), W(0)=60 (vs the
# default floor 50). Place x=0 via resets_at = NOW + 604800.
# used_weekly=59 (<60) → under pace → N>=1; used_weekly=61 (>60) → ahead → N=0.
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_pace_floor_pct": 60}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$((TW_NOW + 604800))
write_rl "rl.json" 59 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: floor=60 W(0)=60; used_weekly=59 under pace → N=$out"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: floor=60 used_weekly=59 expected N>=1, got $out"
fi
write_rl "rl.json" 61 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "floor=60 W(0)=60; used_weekly=61 ahead → N=0" "0" "$out"
tw_teardown

# --- Test 5: remaining <= 0 (window already reset) prints 0 -----------------

echo "Test: weekly window already reset (remaining<=0) prints 0"
tw_setup
# resets_at_weekly <= now → remaining<=0 → Stage 1 prints 0 and exits.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "rl.json" 0 "$TW_NOW" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "remaining==0 → 0" "0" "$out"
# Strictly negative remaining too.
write_rl "rl.json" 0 $((TW_NOW - 100)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "remaining<0 → 0" "0" "$out"
tw_teardown

# --- Test 6: binary gate closed when used_weekly >= W (at/over pace) → N=0 ---

echo "Test: binary gate closed (at/over pace) yields N=0 regardless of 5h usage"
tw_setup
# x=0.5 → W=65.95. used_weekly=70 (>65.95) → hw<0 → gate closed → N=0,
# regardless of the 5-hour ramp. The over-pace pause overrides 5h headroom —
# this is the intentional weekly-pace throttle.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
# Full 5h headroom (used_5h=0) — gate still closed.
write_rl "rl.json" 70 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "over pace (used_weekly=70 > W=65.95), used_5h=0 → gate closed → N=0" "0" "$out"
# Low non-zero 5h usage (used_5h=10, deep in the max-workers band) — gate still
# closed, so the open-gate ramp value is irrelevant.
write_rl "rl.json" 70 "$r" 10 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "over pace (used_weekly=70 > W=65.95), used_5h=10 → gate closed → N=0" "0" "$out"
tw_teardown

# --- Test 7: binary gate is magnitude-independent over weekly headroom hw ----

echo "Test: open gate gives the same N for any positive hw; at-pace gives 0"
tw_setup
# The weekly gate is binary: any hw>0 opens it and the 5-hour ramp alone decides
# N — the headroom magnitude does NOT scale N. x=0.5 → W=65.95, defaults
# floor5=50, ceil5=80, span=30. Hold used_5h=65 → h5=80-65=15 →
# N=round(8*15/30)=4 whenever the gate is open.
#   used_weekly=11 → hw=54.95 (open) → N=4
#   used_weekly=21 → hw=44.95 (open) → N=4   (same N — magnitude-independent)
#   used_weekly=66 → hw<0     (at/over pace) → gate closed → N=0
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 65 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "gate open hw=54.95, used_5h=65 → N=4" "4" "$out"
write_rl "rl.json" 21 "$r" 65 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "gate open hw=44.95, used_5h=65 → N=4 (magnitude-independent)" "4" "$out"
write_rl "rl.json" 66 "$r" 65 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "at/over pace, used_5h=65 → gate closed → N=0" "0" "$out"
tw_teardown

# --- Test 8 (AC): linear 5h ramp under pace; floor(1)/ceiling(max) endpoints --

echo "Test: under pace, N is a linear ramp on used_5h over [floor5,ceil5]"
tw_setup
# Under pace (gate open) the 5-hour ramp alone decides N. Defaults floor5=50,
# ceil5=80, span=30, max_workers=8; h5 = ceil5 - used_5h;
# N = clamp(round(8*h5/30),1,8). x=0.5, used_weekly=11 → hw=54.95>0 → gate open.
# Canonical curve:
#   used_5h=50 → h5=30 → N=8     (at floor → max)
#   used_5h=55 → h5=25 → N=round(6.67)=7
#   used_5h=60 → h5=20 → N=round(5.33)=5
#   used_5h=65 → h5=15 → N=4
#   used_5h=70 → h5=10 → N=round(2.67)=3
#   used_5h=75 → h5=5  → N=round(1.33)=1
#   used_5h=80 → h5=0  → N=0     (at ceiling → zero)
# Plus endpoints:
#   used_5h=40 → h5=40 → N=clamp(round(10.67),1,8)=8  (below floor → max)
#   used_5h=79 → h5=1  → N=clamp(round(0.27),1,8)=1   (rounds to 0 but clamps ≥1)
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
declare -A n_expected=([40]=8 [50]=8 [55]=7 [60]=5 [65]=4 [70]=3 [75]=1 [79]=1 [80]=0)
for u5 in 40 50 55 60 65 70 75 79 80; do
  write_rl "nsweep.json" 11 "$r" "$u5" 99999999
  result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
  assert_eq "ramp under pace used_5h=$u5 → ${n_expected[$u5]}" "${n_expected[$u5]}" "$result"
done
unset n_expected
tw_teardown

# --- Test 9: missing rate_limits.json file → 1 + stderr note ----------------

echo "Test: missing-telemetry-fallback prints 1 with a stderr note"
tw_setup
# Default rate-limits path points at a non-existent file.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "missing rate_limits.json → 1" "1" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"dispatch-target-workers"* && "$err" == *"fallback"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing rate_limits.json stderr has fallback note"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing rate_limits.json stderr has fallback note"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 10: only five_hour present → fallback (no weekly anchor) ----------

echo "Test: missing-seven-day-fallback prints 1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
# seven_day omitted → no weekly anchor → fallback 1.
write_rl "rl.json" absent absent 30 13600
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "seven_day absent → fallback 1" "1" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly anchor"* || "$err" == *"seven_day"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: seven_day-absent stderr names the weekly anchor"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: seven_day-absent stderr names the weekly anchor"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 11: only seven_day present → 5h gate uses used_5h=0 ---------------

echo "Test: missing-five-hour treats used_5h=0 → ramp gives max workers"
tw_setup
# seven_day only at x=0.5 (W=65.95): used_weekly=11 → hw=54.95>0 → gate open. 5h
# block absent → used_5h treated as 0 → 0 <= floor5=50 → ramp gives max workers = 8.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "five_hour absent; under pace + used_5h=0 → max workers N=8" "8" "$out"
tw_teardown

# --- Test 12: config-file tunables are honored ------------------------------

echo "Test: config max_concurrent_workers tunable raises the absolute cap"
tw_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"max_concurrent_workers": 16}
EOF
# x=0.5, used_weekly=11 → hw=54.95>0 → gate open. used_5h=0 <= floor5=50 → ramp
# gives max workers = 16.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "config max_concurrent_workers=16 → 16" "16" "$out"
tw_teardown

# --- Test 13: config five_hour_target_floor_pct narrows the ramp span --------

echo "Test: config five_hour_target_floor_pct narrows the ramp span"
tw_setup
# Raising floor5 from 50 to 60 narrows the span (ceil5 - floor5 = 80-60 = 20),
# steepening the ramp. x=0.5, used_weekly=11 → hw=54.95>0 → gate open. used_5h=72 →
# h5 = 80-72 = 8 → N=clamp(round(8*8/20),1,8)=round(3.2)=3 (vs default span=30 →
# round(8*8/30)=round(2.13)=2).
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_floor_pct": 60}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 72 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "floor5=60 span=20; under pace used_5h=72 h5=8 → N=3" "3" "$out"
tw_teardown

# --- Test 14: per-field env override wins over file -------------------------

echo "Test: per-field env override wins over rate_limits.json"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
# File says used_5h=99 (over ceil5 → N=0); env override replaces with used_5h=0.
# used_weekly=11 → hw=54.95>0 → gate open. used_5h=0 <= floor5 → ramp → N=8.
write_rl "rl.json" 11 "$r" 99 99999999
export DISPATCH_TARGET_WORKERS_USED_5H=0
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "env override replaces used_5h → N=8" "8" "$out"
tw_teardown

# --- Test 15: per-field env override of resets_at_weekly places x -----------

echo "Test: per-field env override of resets_at_weekly drives the curve"
tw_setup
# File supplies used_weekly; env override supplies resets_at_weekly to place
# x=0.5. used_weekly=66 > W(0.5)=65.95 → hw<0 → at/over pace → gate closed → N=0.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "rl.json" 66 99999999 0 99999999
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY=$(tw_resets_for_x 0.5)
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "env resets override x=0.5; used_weekly=66 at/over pace → N=0" "0" "$out"
tw_teardown

# --- Test 16: rejected config field → defaults used -------------------------

echo "Test: out-of-range config field rejected; baked-in defaults used"
tw_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_ceiling_pct": 0}
EOF
# five_hour_target_ceiling_pct=0 is rejected by dispatch-config-load (must be
# > 0). dispatch-target-workers silently ignores a failed config-load and uses
# the baked-in defaults (floor5=50, ceil5=80). x=0.5, used_weekly=11 →
# hw=54.95>0 → gate open. used_5h=0 <= floor5 → ramp → N=8.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "rejected config → defaults → N=8" "8" "$out"
tw_teardown

# --- Test 16b: just-under-pace + high 5h usage → ramp decides N --------------

echo "Test: gate barely open (hw≈1) + high 5h usage → ramp value, not 0"
tw_setup
# x=0.5 → W=65.95. used_weekly=65 → hw=0.95 (>0) → gate just barely open. With
# the gate open the 5-hour ramp alone sets N: used_5h=70 → h5=80-70=10 →
# N=clamp(round(8*10/30),1,8)=round(2.67)=3. The thin weekly headroom does NOT
# pull N down — this is the key behavior change from the old coupled model.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 65 "$r" 70 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "just under pace (hw=0.95), used_5h=70 → ramp N=3" "3" "$out"
tw_teardown

# --- Test 16c: dynamic catch-up ceiling — saturated regime (headline) --------

echo "Test: end-of-week deficit saturates ceil5_eff to 100 → ramp lifts N above 0"
tw_setup
# Headline behavior: near end-of-week the static ceil5=80 would gate N=0 at high
# 5h usage, but the dynamic catch-up ceiling lifts the ramp so work continues.
# Pin r exactly via the resets override (resets = NOW + remaining), like Test 15.
#   remaining=18000 → r=1. used_weekly=88, used_5h=85.
#   Stage 1: W = max(smooth, envelope=100-10*1=90) = 90. hw=90-88=2>0 → gate open.
#   Stage 3: D = terminal-used_weekly = 100-88 = 12. D/r = 12 (>wcap=10) →
#     100*D/(r*wcap) = 100*12/(1*10) = 120 → clamp(120,80,100) = ceil5_eff=100.
#     span=100-50=50, h5=100-85=15 → N=int(8*15/50+0.5)=int(2.9)=2.
#   (Static ceiling 80 → h5=80-85=-5 → N=0.)
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY=$((TW_NOW + 18000))
write_rl "rl.json" 88 99999999 85 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "r=1, D/r=12 → ceil5_eff=100; used_5h=85 → N=2 (static 80 → 0)" "2" "$out"
tw_teardown

# --- Test 16d: dynamic catch-up ceiling — effective regime (8<D/r<=10) -------

echo "Test: end-of-week deficit lifts ceil5_eff into the ramp → N=1 (static → 0)"
tw_setup
# Effective (non-saturated) regime: ceil5_eff lands strictly between ceil5 and
# 100. Pin r exactly via the resets override.
#   remaining=45000 → r=2.5. used_weekly=77, used_5h=90.
#   Stage 1: smooth curve dominates (envelope=100-10*2.5=75 < smooth). At
#     remaining=45000, x=(604800-45000)/604800≈0.9256 → W≈79.45. hw≈2.45>0 → open.
#   Stage 3: D = 100-77 = 23. D/r = 9.2 → 100*23/(2.5*10) = 92 →
#     clamp(92,80,100) = ceil5_eff=92. span=92-50=42, h5=92-90=2 →
#     N=int(8*2/42+0.5)=int(0.881)=0... clamp(0,1,8)? No: int(8*2/42+0.5)=int(0.881)=0,
#     but the round is 8*2/42=0.381, +0.5=0.881, int=0 → then clamp(0,1,8)=1.
#   (Static ceiling 80 → h5=80-90=-10 → N=0.)
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY=$((TW_NOW + 45000))
write_rl "rl.json" 77 99999999 90 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "r=2.5, D/r=9.2 → ceil5_eff=92; used_5h=90 → N=1 (static 80 → 0)" "1" "$out"
tw_teardown

# --- Test 16e: dynamic ceiling inert mid-week (accelerator-only invariant) ---

echo "Test: mid-week ceil5_eff clamps to ceil5 → behavior identical to today"
tw_setup
# Accelerator-only invariant: mid-week the large remaining-window count r makes
# the catch-up term tiny, so ceil5_eff clamps down to the static ceil5=80 and
# Stage 3 behaves exactly as it did before this change. Use tw_resets_for_x 0.5
# (remaining=302400 → r≈16.8), matching the mid-week probes elsewhere.
#   used_weekly=11 → gate open (W(0.5)=31, hw=20>0).
#   D = 100-11 = 89. D/r = 89/16.8 ≈ 5.3 → 100*D/(r*wcap) = 10*D/r ≈ 53 (<ceil5=80)
#     → clamp(53,80,100) = ceil5_eff=80 (static).
# Sub-assertion A: used_5h=70 → h5=80-70=10 → N=clamp(round(8*10/30),1,8)=3
#   (byte-identical to Test 16b's mid-week ramp value).
# Sub-assertion B: used_5h=85 → h5=80-85=-5 → N=0 (no end-of-week lift mid-week).
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 70 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "mid-week ceil5_eff=80; used_5h=70 → N=3 (matches Test 16b)" "3" "$out"
write_rl "rl.json" 11 "$r" 85 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "mid-week ceil5_eff=80; used_5h=85 → N=0 (no mid-week lift)" "0" "$out"
tw_teardown

# --- Test 17: non-numeric used_weekly sanitized fail-closed → 1 -------------

echo "Test: non-numeric used_weekly is treated as missing → conservative fallback"
tw_setup
# A corrupt/tampered used_weekly ("abc") must NOT coerce to 0. It is sanitized
# to missing, dropping the weekly anchor → fallback 1.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
export DISPATCH_TARGET_WORKERS_USED_WEEKLY=abc
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY=$(tw_resets_for_x 0.5)
export DISPATCH_TARGET_WORKERS_USED_5H=2
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-numeric used_weekly → fallback 1 (not max_workers)" "1" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"non-numeric value"* && "$err" == *"WEEKLY_USED"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric used_weekly stderr names the field"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric used_weekly stderr names the field"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 18: non-integer NOW sanitized → weekly anchor missing → 1 ---------

echo "Test: non-integer NOW drops the weekly anchor → fallback 1"
tw_setup
# A malformed NOW must not let awk coerce garbage; the weekly anchor is dropped
# and the script falls back to 1.
export DISPATCH_TARGET_WORKERS_NOW="not-a-number"
write_rl "rl.json" 11 99999999 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-integer NOW → fallback 1" "1" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"NOW"* && "$err" == *"non-integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer NOW stderr names NOW"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer NOW stderr names NOW"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 19: non-numeric resets_at_weekly → weekly anchor missing → 1 ------

echo "Test: non-numeric resets_at_weekly drops the weekly anchor → fallback 1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY="garbage"
export DISPATCH_TARGET_WORKERS_USED_WEEKLY=11
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-numeric resets_at_weekly → fallback 1" "1" "$out"
tw_teardown

# --- Test 20: weekly_curve_power back-loads the curve (p=2) -----------------

echo "Test: weekly_curve_power=2 back-loads spend (lower W early-week)"
tw_setup
# With p=2 the rise term is back-loaded: rise = 50 + 30·s^2. At x=0.5,
# r=16.8 → s=(33.6−16.8)/31.6=0.5316, s^2=0.2826 → rise=50+30·0.2826=58.48, and
# terminal_seg=100−10·16.8=−68, floor=50, so W=58.48 (lower than the p=1
# W(0.5)=65.95 — back-loaded). used_weekly=57 (<58.48) under pace → N>=1;
# used_weekly=60 (>58.48) ahead → N=0.
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_curve_power": 2}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 57 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: p=2 W(0.5)=58.48; used_weekly=57 under pace → N=$out"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: p=2 used_weekly=57 expected N>=1, got $out"
fi
write_rl "rl.json" 60 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "p=2 W(0.5)=58.48; used_weekly=60 ahead → N=0" "0" "$out"
tw_teardown

# --- Test 21: end-to-end AC smoke — early-week no stall ---------------------

echo "Test: early-week AC smoke used_weekly=20, used_5h=2 → N>=1 (no stall)"
tw_setup
# Issue AC: at x≈0.5 (mid-week) with used_weekly=20, used_5h=2, the chain must
# not stall. x=0.5 → W=65.95, hw=45.95>0 → gate open. used_5h=2 <= floor5=50 →
# ramp gives max workers = 8 (>=1).
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 20 "$r" 2 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: early-week smoke used_weekly=20 used_5h=2 → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: early-week smoke expected N>=1, got $out"
fi
tw_teardown

# --- Test 22: terminal segment floors W in the final windows ----------------

echo "Test: terminal segment pins W toward weekly_terminal across the final windows"
tw_setup
# The terminal segment floors W from the end of the week:
#   terminal_seg = weekly_terminal - cap*remaining_windows
# with defaults (terminal=100, cap=10) it evaluates to 80 at r=2, 90 at r=1,
# 100 at r=0 (r = remaining_seconds / 18000). At r=2 the rise also reaches the
# shoulder (s=1 → rise=80), so W=80 exactly. Place r by remaining-window count
# (resets_at = NOW + r*18000) and hold used_5h=0 so 5h headroom is full and
# N>=1 whenever the gate is open.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"

# r=2: W = max(floor 50, terminal_seg 80, rise 80) = 80 exactly.
# used_weekly=79 (<80) under pace → N>=1; used_weekly=81 (>80) ahead → N=0.
write_rl "env.json" 79 $((TW_NOW + 2 * 18000)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: r=2 W=80; used_weekly=79 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: r=2 used_weekly=79 expected N>=1, got $out"
fi
write_rl "env.json" 81 $((TW_NOW + 2 * 18000)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "r=2 W=80; used_weekly=81 ahead → N=0" "0" "$out"

# r=1: terminal_seg = 100 - 10*1 = 90 governs (rise=80). used_weekly=88 (<90)
# under pace → N>=1; used_weekly=90 at the terminal_seg → N=0. Pin W=90 at r=1.
write_rl "env.json" 88 $((TW_NOW + 1 * 18000)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: r=1 terminal_seg W=90; used_weekly=88 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: r=1 used_weekly=88 expected N>=1 (W=90), got $out"
fi
write_rl "env.json" 90 $((TW_NOW + 1 * 18000)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "r=1 terminal_seg W=90; used_weekly=90 at target → N=0" "0" "$out"

# r=0: terminal_seg = 100 - 10*0 ≈ 100 governs (rise=80). used_weekly=95 (<100)
# under pace → N>=1; used_weekly=100 at the terminal_seg → N=0. Pin W~=100 at
# r=0. Use tw_resets_for_x 1.0 (remaining=1s) so Stage 1 does NOT take the
# remaining<=0 early-exit.
r=$(tw_resets_for_x 1.0)
write_rl "env.json" 95 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: r=0 terminal_seg W~=100; used_weekly=95 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: r=0 used_weekly=95 expected N>=1 (W~=100), got $out"
fi
write_rl "env.json" 100 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "r=0 terminal_seg W~=100; used_weekly=100 at target → N=0" "0" "$out"
tw_teardown

# --- Test 22b: non-default weekly_terminal_pct flows through end-to-end ------

echo "Test: non-default weekly_terminal_pct=95 caps the terminal target at 95"
tw_setup
# The terminal target is the configurable weekly_terminal_pct, not a baked-in
# 100. With weekly_terminal_pct=95 (cap=10, Nterm=2): shoulder = 95 - 10*2 = 75
# (admissible, ≥ floor 50). At r=0 the terminal_seg = 95 - 10*0 ≈ 95 governs and
# the rise plateaus at the shoulder 75, so W=95. used_weekly=93 (<95) under pace
# → N>=1; used_weekly=97 ahead of the 95 target → N=0. The used_weekly=97 probe
# is DISCRIMINATING: the default terminal=100 would lift W to 100, putting
# used_weekly=97 under pace (N>=1) — so N=0 confirms the knob value is honored.
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_terminal_pct": 95}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 1.0)
write_rl "term95.json" 93 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: terminal=95 r=0 W=95; used_weekly=93 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: terminal=95 used_weekly=93 expected N>=1 (W=95), got $out"
fi
write_rl "term95.json" 97 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "terminal=95 r=0 W=95; used_weekly=97 ahead of 95 target → N=0" "0" "$out"
tw_teardown

# --- Test 23: mid-week tick follows the rise segment ------------------------

echo "Test: mid-week tick follows the rise segment of the anchored curve"
tw_setup
# At x=0.5 the remaining is 302400s → r=16.8 → terminal_seg = 100 - 10*16.8 =
# -68 and floor=50, so the rise segment governs: rise = 50 + 30*s^1 with
# s=(33.6-16.8)/31.6=0.5316 → rise=65.95 = W(0.5). The gating boundary matches
# the canonical W(0.5)=65.95 (Test 2): used_weekly=66 → hw<0 → N=0 (at/over
# pace); used_weekly=65 → hw>0 → N>=1.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "midweek.json" 66 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "mid-week rise W(0.5)=65.95; used_weekly=66 at/over pace → N=0" "0" "$out"
write_rl "midweek.json" 65 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: mid-week rise W(0.5)=65.95; used_weekly=65 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: mid-week used_weekly=65 expected N>=1, got $out"
fi
tw_teardown

# --- Test 24: --exhausted — 5h window at 100% with future reset → exhausted --
#
# Exhausted mode reads telemetry directly and reports `exhausted` when EITHER
# window is at/near 100% used (>= exhaustion_threshold_pct, default 98) with
# resets_at in the future, else `ok`. It is independent of the pace/ramp math
# and fails OPEN on missing/invalid telemetry.

echo "Test: --exhausted 5h used=100, resets in future → exhausted"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
# 5h pinned at 100%, weekly comfortably under; both resets in the future.
write_rl "exh.json" 30 $((TW_NOW + 302400)) 100 $((TW_NOW + 3600))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: 5h=100 future reset → exhausted" "exhausted" "$out"
tw_teardown

# --- Test 25: --exhausted — weekly used=99 (>=98) future reset → exhausted ---

echo "Test: --exhausted weekly used=99, resets in future → exhausted"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "exh.json" 99 $((TW_NOW + 302400)) 30 $((TW_NOW + 3600))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: weekly=99 future reset → exhausted" "exhausted" "$out"
tw_teardown

# --- Test 26: --exhausted — both windows used=50 → ok -----------------------

echo "Test: --exhausted both windows used=50 → ok"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "exh.json" 50 $((TW_NOW + 302400)) 50 $((TW_NOW + 3600))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: both=50 → ok" "ok" "$out"
tw_teardown

# --- Test 27: --exhausted — 5h used=100 but resets_at <= now → ok ------------
#
# A window already past its reset is not "out of tokens" — the window has
# refilled. resets_at in the past must NOT count as exhausted.

echo "Test: --exhausted 5h used=100 but window already reset → ok"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
# 5h reset is in the PAST (<= now); weekly under pace with a future reset.
write_rl "exh.json" 30 $((TW_NOW + 302400)) 100 $((TW_NOW - 1))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: 5h=100 past reset → ok" "ok" "$out"
tw_teardown

# --- Test 28: --exhausted — missing rate_limits.json → ok (fail open) -------
#
# The OPPOSITE of count mode's fallback-to-1: unknown usage is not genuine
# exhaustion, so priority work is never suppressed on absent telemetry.

echo "Test: --exhausted missing rate_limits.json → ok (fail open)"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
# tw_setup points RATE_LIMITS_PATH at an absent file by default; no write_rl.
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: missing telemetry → ok" "ok" "$out"
tw_teardown

# --- Test 29: --exhausted — threshold from config (95): 96→exhausted, 94→ok -

echo "Test: --exhausted exhaustion_threshold_pct config 95 gates at 95"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"exhaustion_threshold_pct": 95}
EOF
# used=96 (>= 95) with a future reset → exhausted.
write_rl "exh.json" 96 $((TW_NOW + 302400)) 30 $((TW_NOW + 3600))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: threshold 95, weekly=96 → exhausted" "exhausted" "$out"
# used=94 (< 95) → ok.
write_rl "exh.json" 94 $((TW_NOW + 302400)) 30 $((TW_NOW + 3600))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>/dev/null)
assert_eq "--exhausted: threshold 95, weekly=94 → ok" "ok" "$out"
tw_teardown

# --- Test: --reopen-at pace-curve crossing (#1050) --------------------------
#
# Reopen mode prints the epoch at which the rising pace curve W crosses the
# flat used_weekly (when a pace-curve pause lifts), or `none` when the pace
# curve is not the blocker (under pace, missing weekly anchor, etc.).

echo "Test: --reopen-at pace pause → numeric crossing strictly inside the window"
tw_setup
# x=0.5 → W=65.95. used_weekly=70 > 65.95 → pace pause (gate closed, target 0)
# while still below the week-end terminal (70 < 100). The reopen epoch is where
# the rising curve W meets used_weekly=70, later than NOW but before the reset.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "reopen.json" 70 "$r" 0 99999999
result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --reopen-at 2>/dev/null)
TOTAL=$((TOTAL + 1))
if [[ "$result" =~ ^[0-9]+$ ]] && (( result > TW_NOW )) && (( result < r )); then
  PASS=$((PASS + 1)); echo "  PASS: pace pause crossing $result strictly in (TW_NOW=$TW_NOW, r=$r)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: pace pause crossing expected digits in ($TW_NOW, $r), got '$result'"
fi
# Sanity sub-check: feeding the crossing back as NOW, the curve has caught up,
# so reopen reports either `none` or essentially the same epoch (lenient — the
# point is self-consistency, not exactness).
if [[ "$result" =~ ^[0-9]+$ ]]; then
  again=$(env DISPATCH_TARGET_WORKERS_NOW="$result" \
    DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH" \
    "$TMPDIR_TEST/scripts/dispatch-target-workers" --reopen-at 2>/dev/null)
  TOTAL=$((TOTAL + 1))
  if [[ "$again" == "none" ]] || { [[ "$again" =~ ^[0-9]+$ ]] \
      && (( again >= TW_NOW )) && (( again <= result + 60 )); }; then
    PASS=$((PASS + 1)); echo "  PASS: crossing fed back is self-consistent (again='$again')"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: crossing fed back not self-consistent (again='$again', result=$result)"
  fi
fi
tw_teardown

echo "Test: --reopen-at under pace → none"
tw_setup
# x=0.75 → W=57. used_weekly=10 < 57 → under pace, target already >= 1, so the
# pace curve is not the blocker → reopen reports none.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.75)
write_rl "reopen.json" 10 "$r" 0 99999999
result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --reopen-at 2>/dev/null)
assert_eq "--reopen-at under pace → none" "none" "$result"
tw_teardown

echo "Test: --reopen-at missing weekly anchor → none"
tw_setup
# No weekly telemetry at all (tw_setup points the path at an absent file). The
# crossing cannot be computed without the weekly anchor → none.
unset DISPATCH_TARGET_WORKERS_NOW \
      DISPATCH_TARGET_WORKERS_USED_WEEKLY \
      DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY
result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --reopen-at 2>/dev/null)
assert_eq "--reopen-at missing anchor → none" "none" "$result"
tw_teardown

# --- #1136: rate_limits.json telemetry range bounds -------------------------
#
# Out-of-range telemetry (used_percentage > 100, or a reset epoch beyond the
# window's physically-plausible horizon) is rejected to missing so the existing
# PRESENT guards route it to the established fail-safe, rather than acting on a
# poisoned value. See issue #1136.

# used_weekly=150 (>100) → rejected → weekly anchor drops → fallback N=1 (NOT 0).
# This is the literal bug: an un-bounded used>100 yields negative headroom and
# pins the target at 0; the bound restores the conservative spawn-1 fallback.
echo "Test: #1136 used_weekly=150 (>100) → rejected → fallback N=1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 150 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "#1136 used_weekly=150 → fallback 1 (not 0)" "1" "$out"
TOTAL=$((TOTAL + 1))
if grep -q "WEEKLY_USED out of range" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 used_weekly=150 stderr names WEEKLY_USED out of range"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 used_weekly=150 stderr should name WEEKLY_USED out of range"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
tw_teardown

# used_weekly=100 is a valid fully-used reading and must be KEPT (strict `>`
# bound). Consumed → the curve runs: at x=0.5, W=31, used=100 >> pace → gate
# closed → N=0. A rejected value would instead drop the anchor → fallback N=1,
# so N=0 discriminates "consumed" from "rejected".
echo "Test: #1136 used_weekly=100 (boundary) → kept, curve runs → N=0"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 100 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "#1136 used_weekly=100 kept (curve runs) → N=0" "0" "$out"
TOTAL=$((TOTAL + 1))
if grep -q "out of range" "$TMPDIR_TEST/stderr"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 used_weekly=100 must NOT be rejected (strict >)"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
else
  PASS=$((PASS + 1)); echo "  PASS: #1136 used_weekly=100 not rejected (strict >)"
fi
tw_teardown

# used_5h=150 (>100) → rejected → 5h treated as 0 in the ramp → max 5h workers.
# DOCUMENTED INTENDED fail-open: the issue chooses "do not act on the poisoned
# value", and the weekly pace gate still bounds N. With the weekly gate open
# (used_weekly under pace), N>=1.
echo "Test: #1136 used_5h=150 (>100) → rejected → fail-open under open weekly gate → N>=1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 0 "$r" 150 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: #1136 used_5h=150 rejected, weekly open → N=$out (>=1, intended fail-open)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 used_5h=150 expected N>=1, got $out"
fi
tw_teardown

# weekly resets_at = NOW + 999999999 (far future, >8 days) → rejected → weekly
# anchor drops → fallback N=1. A far-future weekly reset can no longer feed the
# curve.
echo "Test: #1136 weekly resets_at far-future (>8d) → rejected → fallback N=1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "rl.json" 30 $((TW_NOW + 999999999)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "#1136 weekly resets far-future → fallback 1" "1" "$out"
TOTAL=$((TOTAL + 1))
if grep -q "WEEKLY_RESETS" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 weekly resets far-future stderr names WEEKLY_RESETS"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 weekly resets far-future stderr should name WEEKLY_RESETS"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
tw_teardown

# exhausted mode: 5h resets_at = NOW + 999999999 (far future, >6h) with
# used_5h=99 (>=threshold) → 5h reset rejected → window cannot be exhausted → ok
# (fail open). Weekly is benign (low usage, in-bound reset).
echo "Test: #1136 --exhausted 5h resets far-future (>6h) → rejected → ok (fail open)"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "exh.json" 30 $((TW_NOW + 302400)) 99 $((TW_NOW + 999999999))
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --exhausted 2>"$TMPDIR_TEST/stderr")
assert_eq "#1136 --exhausted 5h resets far-future → ok (fail open)" "ok" "$out"
TOTAL=$((TOTAL + 1))
if grep -q "FIVEH_RESETS" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 --exhausted 5h resets far-future stderr names FIVEH_RESETS"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 --exhausted 5h resets far-future stderr should name FIVEH_RESETS"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
tw_teardown

# --- #2043: reference.md Table A / Table B literal ports ---------------------
#
# reference.md's "Concurrency budgeting" section documents the controller's
# input→output contract as two literal tables. These ports assert the exact
# target_N each table row claims, so a regression in dispatch-target-workers
# that diverges from the documented tables fails CI — the tables and the
# implementation are kept in lockstep (issue #2043 AC). The numbers below are
# transcribed from reference.md; if the script changes, these assertions catch
# the divergence. (A reviewer changing the table without the script — a
# doc-only edit — is caught in review, not here; coupling the test to the
# markdown file's prose formatting was rejected as brittle.)
#
# Both tables use the script's baked-in defaults (max_workers=8, floor5=50,
# ceil5=80, weekly defaults), which tw_setup's empty synthetic DISPATCH_CONFIG_DIR
# selects.

# Table A — weekly curve vs. elapsed (used_weekly=0, used_5h=0). With
# used_weekly=0 the weekly gate is open at every x (hw = W - 0 > 0), and
# used_5h=0 <= floor5 puts the 5h ramp at max, so target_N=8 across the whole
# week. This is the whole-week "all gates open, full headroom → max" smoke.
echo "Test: #2043 reference.md Table A — used_weekly=0,used_5h=0 → target_N=8 at every x"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
# reference.md Table A rows: elapsed x → target_N (all 8). The ~1.0 row uses
# tw_resets_for_x 1.0 (remaining=1s) so Stage 1 does not take the remaining<=0
# early-exit.
for x in 0.00 0.25 0.50 0.75 0.90 1.0; do
  r=$(tw_resets_for_x "$x")
  write_rl "tableA.json" 0 "$r" 0 99999999
  out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
  assert_eq "Table A x=$x (used_weekly=0,used_5h=0) → target_N=8" "8" "$out"
done
tw_teardown

# Table B — binary gate + 5h ramp at mid-week (x=0.5, W=65.95). The open-gate
# rows hold used_weekly=20 (hw=45.95>0) and sweep used_5h; the closed-gate rows
# hold used_5h=0 and push used_weekly at/over W.
echo "Test: #2043 reference.md Table B — mid-week gate + 5h ramp rows"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
# reference.md Table B open-gate rows: used_5h → target_N (used_weekly=20).
declare -A tableB=([50]=8 [55]=7 [60]=5 [65]=4 [70]=3 [75]=1 [80]=0)
for u5 in 50 55 60 65 70 75 80; do
  write_rl "tableB.json" 20 "$r" "$u5" 99999999
  out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
  assert_eq "Table B open gate used_weekly=20 used_5h=$u5 → target_N=${tableB[$u5]}" \
    "${tableB[$u5]}" "$out"
done
unset tableB
# reference.md Table B closed-gate rows: used_weekly at/over W=65.95 → 0.
write_rl "tableB.json" 66 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "Table B closed gate used_weekly=66 (at/over pace) → target_N=0" "0" "$out"
write_rl "tableB.json" 70 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "Table B closed gate used_weekly=70 (over pace) → target_N=0" "0" "$out"
tw_teardown

# --- #2043: non-numeric used_5h is sanitized → fail-OPEN (not fail-closed) ---
#
# Closes the gap left by Test 17 (which covers non-numeric used_weekly →
# fail-CLOSED to 1). The two used_* fields have OPPOSITE fallback semantics by
# design: used_weekly is the budget gate (missing → drop the weekly anchor →
# fallback 1), but used_5h is only the anti-burst ramp WITHIN the weekly budget
# (missing → treated as 0 → full 5h headroom → the WEEKLY-allowed count). So a
# non-numeric used_5h must NOT back off to zero; under an open weekly gate it
# yields max workers. (reference.md's "non-numeric used_* → fail-closed" wording
# is imprecise — only used_weekly fails closed; this test pins the actual,
# intended fail-open behavior for used_5h.)
echo "Test: #2043 non-numeric used_5h sanitized → fail-open (weekly-bounded), not 0"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
# used_weekly=20 → gate open at x=0.5 (hw=45.95>0). used_5h="abc" → sanitized to
# missing → treated as 0 → ramp gives max workers = 8.
write_rl "rl.json" 20 "$r" 0 99999999  # JSON used_5h=0 is overridden below by DISPATCH_TARGET_WORKERS_USED_5H=abc (per-field env override) — the env var is what exercises this path
export DISPATCH_TARGET_WORKERS_USED_5H=abc
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-numeric used_5h → fail-open max workers N=8 (not 0)" "8" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"non-numeric value"* && "$err" == *"FIVEH_USED"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric used_5h stderr names FIVEH_USED"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric used_5h stderr names FIVEH_USED"
  echo "    stderr: $err"
fi
tw_teardown

# --- #2043: --reopen-at none from a transient 5h fill (pace not the blocker) -
#
# The AC enumerates the reopen `none` no-op cases as "(target already >= 1,
# transient 5h fill, missing weekly anchor)". The under-pace and missing-anchor
# cases are covered above; this covers the transient-5h-fill case: the weekly
# gate is OPEN (used_weekly under pace) but count mode returns 0 because used_5h
# is at/over ceil5. Since hw>0 the pace curve is NOT the blocker, so reopen must
# report `none` (the 0 comes from the 5h fill, which drains on its own and is
# handled elsewhere — not a pace-curve pause with a curve crossing).
echo "Test: #2043 --reopen-at transient 5h fill (gate open, count 0) → none"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
# used_weekly=20 → under pace at x=0.5 (W=65.95, hw=45.95>0 → gate open).
# used_5h=85 >= ceil5=80 → count mode N=0. reopen: hw>0 → none.
write_rl "reopen5h.json" 20 "$r" 85 99999999
cnt=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "transient 5h fill: count mode N=0 (gate open, used_5h>=ceil5)" "0" "$cnt"
rop=$("$TMPDIR_TEST/scripts/dispatch-target-workers" --reopen-at 2>/dev/null)
assert_eq "transient 5h fill: --reopen-at → none (pace not the blocker)" "none" "$rop"
tw_teardown

# <<< END MOVED <<<

report_results
