#!/usr/bin/env bash
# Tests for dispatch-review-plan-gate — the bash-callable seam that binds the
# /review-plan verdict's effort BEFORE /review-fix Step 1b launches the review.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "Test: dispatch-review-plan-gate"

SUT="$SCRIPT_DIR/dispatch-review-plan-gate"
f() { printf '%s\n' "$1" | sed -n "s/^$2=//p"; }

# WHY THIS SEAM EXISTS. Step 1b consumes the effort and runs BEFORE the Step 2
# Workflow, so a gate living only in review-fix.js executes too late to
# constrain anything — it would log a constrained level while Step 1b had
# already launched the real review at whatever the verdict asked for. These rows
# pin that the constraint is reachable from bash, at Step 1a, with the same
# rules the Workflow uses.

# --- fail-open: every failure path yields today's behaviour exactly -----------
# effort high / 5400s / 10 attempts is byte-identical to the pre-change lane.
out=$(printf '' | "$SUT")
assert_eq "empty stdin → high" "high" "$(f "$out" effort)"
assert_eq "empty stdin → today's deadline" "5400" "$(f "$out" deadline_s)"
assert_eq "empty stdin → today's poll cap" "10" "$(f "$out" poll_cap)"
assert_eq "empty stdin → reason says fail-open" "true" \
  "$(printf '%s\n' "$out" | grep -c '^effort_reason=fail-open' | grep -q 1 && echo true || echo false)"

out=$(printf 'this is prose, not a verdict\n' | "$SUT")
assert_eq "unparseable stdin → high" "high" "$(f "$out" effort)"
assert_eq "unparseable stdin → today's deadline" "5400" "$(f "$out" deadline_s)"

out=$(printf '   \n\n' | "$SUT")
assert_eq "whitespace-only stdin → high" "high" "$(f "$out" effort)"

out=$(printf 'null' | "$SUT")
assert_eq "JSON null verdict → high" "high" "$(f "$out" effort)"

out=$(printf '{}' | "$SUT")
assert_eq "verdict with no effort → high" "high" "$(f "$out" effort)"

# --- it ALWAYS exits 0 -------------------------------------------------------
# A non-zero exit would make the caller's $(...) empty under `set -e`, turning a
# depth SUGGESTION into a failed review phase.
rc=0; printf '' | "$SUT" >/dev/null 2>&1 || rc=$?
assert_eq "empty stdin exits 0" "0" "$rc"
rc=0; printf 'garbage{' | "$SUT" >/dev/null 2>&1 || rc=$?
assert_eq "malformed JSON exits 0" "0" "$rc"

# --- the rules actually bind -------------------------------------------------
out=$(printf '{"effort":"ultra","raise":["contract-delta"]}' | "$SUT")
assert_eq "out-of-band ultra → rejected to high" "high" "$(f "$out" effort)"
assert_eq "out-of-band ultra → reason says rejected, not clamped" "true" \
  "$(printf '%s\n' "$out" | grep -q 'rejected, not clamped' && echo true || echo false)"

out=$(printf '{"effort":"low","irreversible":true,"raise":[],"cheapen":["a","b"]}' | "$SUT")
assert_eq "irreversibility floor beats a unanimous cheapen" "xhigh" "$(f "$out" effort)"

out=$(printf '{"effort":"low","raise":["contract-delta"],"cheapen":["small"]}' | "$SUT")
assert_eq "one raise signal blocks a cheapen" "high" "$(f "$out" effort)"

out=$(printf '{"effort":"low","raise":[],"cheapen":["test-only","mechanical"]}' | "$SUT")
assert_eq "unanimous cheapen is honoured" "low" "$(f "$out" effort)"

# --- THE DEADLINE SCALES WITH THE EFFORT -------------------------------------
# This is the whole reason the gate must bind here. dispatch-code-review KILLS a
# run past its deadline and `claude -p` buffers all output, so a killed run
# yields ZERO bytes. Raising effort without raising the deadline converts an
# expensive review into a total loss.
out=$(printf '{"effort":"xhigh","raise":["migration"]}' | "$SUT")
assert_eq "xhigh → effort" "xhigh" "$(f "$out" effort)"
assert_eq "xhigh → deadline scales up" "10800" "$(f "$out" deadline_s)"
assert_eq "xhigh → poll cap scales up in step" "20" "$(f "$out" poll_cap)"

out=$(printf '{"effort":"max","raise":["credentials"]}' | "$SUT")
assert_eq "max → deadline scales up" "16200" "$(f "$out" deadline_s)"
assert_eq "max → poll cap scales up in step" "30" "$(f "$out" poll_cap)"

out=$(printf '{"effort":"low","raise":[],"cheapen":["test-only"]}' | "$SUT")
assert_eq "low → deadline scales down" "2160" "$(f "$out" deadline_s)"
assert_eq "low → poll cap scales down in step" "4" "$(f "$out" poll_cap)"

# cap × await == deadline, at every level the gate can emit.
for spec in '{"effort":"low","raise":[],"cheapen":["x"]}' \
            '{"effort":"medium","raise":[],"cheapen":["x"]}' \
            '{"effort":"high"}' \
            '{"effort":"xhigh","raise":["x"]}' \
            '{"effort":"max","raise":["x"]}'; do
  o=$(printf '%s' "$spec" | "$SUT")
  d=$(f "$o" deadline_s); c=$(f "$o" poll_cap); a=$(f "$o" await_s)
  assert_eq "cap × await == deadline for $(f "$o" effort)" "$d" "$(( c * a ))"
done

# --- ONE IMPLEMENTATION, NOT TWO ---------------------------------------------
# The script must not re-implement the rules in bash — it slices and evals the
# same `review plan gate` region of review-fix.js that test-review-plan-gate.sh
# covers. A bash copy would drift, and the direction it would drift is cheaper.
probe=$(node "$SCRIPT_DIR/review-fix-review-plan-probe.mjs")
for spec_key in 'low:{"effort":"low","raise":[],"cheapen":["test-only","no-contract-delta","small"]}:effort_low_ok' \
                'ultra:{"effort":"ultra","raise":["contract-delta"]}:effort_ultra' \
                'irrev:{"effort":"low","irreversible":true,"raise":[],"cheapen":["test-only","mechanical","small","no-contract-delta"]}:effort_irreversible_cheapen'; do
  label=${spec_key%%:*}
  rest=${spec_key#*:}
  spec=${rest%:*}
  key=${rest##*:}
  bash_effort=$(f "$(printf '%s' "$spec" | "$SUT")" effort)
  js_effort=$(printf '%s' "$probe" | jq -r ".${key}.effort")
  assert_eq "bash seam agrees with the JS gate ($label)" "$js_effort" "$bash_effort"
done

# The script's hardcoded fail-open constants must match the JS defaults, or a
# fail-open run would silently use a different deadline than a gated one.
assert_eq "fail-open effort matches REVIEW_PLAN_DEFAULT_EFFORT" \
  "$(printf '%s' "$probe" | jq -r '.default_effort')" \
  "$(f "$(printf '' | "$SUT")" effort)"
assert_eq "fail-open deadline matches REVIEW_PLAN_DEADLINES.high" \
  "$(printf '%s' "$probe" | jq -r '.deadlines.high')" \
  "$(f "$(printf '' | "$SUT")" deadline_s)"
assert_eq "fail-open await matches REVIEW_PLAN_AWAIT_S" \
  "$(printf '%s' "$probe" | jq -r '.await_s')" \
  "$(f "$(printf '' | "$SUT")" await_s)"

# --- a broken review-fix.js fails OPEN, it does not crash the phase -----------
# The slice is the single source of truth, so losing it must degrade to today's
# defaults rather than take the review down.
BROKEN=$(mktemp -d)
mkdir -p "$BROKEN/scripts" "$BROKEN/workflows"
cp "$SCRIPT_DIR/dispatch-review-plan-gate" "$BROKEN/scripts/"
cp "$SCRIPT_DIR/review-fix-review-plan-gate.mjs" "$BROKEN/scripts/"
# The script resolves review-fix.js at ../../../workflows/ relative to itself.
mkdir -p "$BROKEN/a/b/workflows" "$BROKEN/a/b/c/scripts"
cp "$SCRIPT_DIR/dispatch-review-plan-gate" "$BROKEN/a/b/c/scripts/"
cp "$SCRIPT_DIR/review-fix-review-plan-gate.mjs" "$BROKEN/a/b/c/scripts/"
printf 'const x = 1;\n' > "$BROKEN/a/b/workflows/review-fix.js"   # no sentinels
out=$(printf '{"effort":"low","raise":[],"cheapen":["x"]}' | "$BROKEN/a/b/c/scripts/dispatch-review-plan-gate")
assert_eq "sentinel-less review-fix.js → fail-open high" "high" "$(f "$out" effort)"
assert_eq "sentinel-less review-fix.js → today's deadline" "5400" "$(f "$out" deadline_s)"
rm -f "$BROKEN/a/b/workflows/review-fix.js"
out=$(printf '{"effort":"low","raise":[],"cheapen":["x"]}' | "$BROKEN/a/b/c/scripts/dispatch-review-plan-gate")
assert_eq "missing review-fix.js → fail-open high" "high" "$(f "$out" effort)"
rm -rf "$BROKEN"

# --- the reason is always a single line --------------------------------------
# The caller parses with `sed -n 's/^effort_reason=//p'`; a newline would split
# the reason across keys.
out=$(printf '{"effort":"low","raise":["a\nb"],"cheapen":["c"]}' | "$SUT")
assert_eq "reason stays on one line" "1" "$(printf '%s\n' "$out" | grep -c '^effort_reason=')"
assert_eq "output is exactly the five documented keys" "5" \
  "$(printf '%s\n' "$out" | grep -c '^[a-z_]*=')"

report_results
