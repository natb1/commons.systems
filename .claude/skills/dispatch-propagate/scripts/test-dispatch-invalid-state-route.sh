#!/usr/bin/env bash
# test-dispatch-invalid-state-route.sh — the lane router's ladder.
#
# The failure modes under test are exactly the ones the ratified doctrine
# forbids: spawning into a live claim, unbounded respawn, treating an UNKNOWN
# daemon read as positive evidence, and writing office_hours for a retry-shaped
# state. Every case asserts the EXIT CODE (the detector contract) and, where it
# matters, whether a spawn actually happened.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$SCRIPT_DIR/dispatch-test-fixture.sh"

# The fixture sets `set -e` for its own body. This suite's whole subject is the
# router's EXIT CODES (0 handled / 4 keep / 10 escalate / 2 usage), so nearly
# every call under test exits non-zero on purpose — under `set -e` the first one
# would abort the run and the remaining cases would silently never execute.
# Error handling here is explicit: every outcome is captured into `rc` and
# asserted.
set +e

ROUTE="$SCRIPT_DIR/dispatch-invalid-state-route"

# --- fixture ---------------------------------------------------------------
# A real git repo on `main` with an origin whose main carries intentions/, so
# the router's preconditions (primary-checkout-on-main, node present on
# origin/main) pass for real rather than being stubbed out.
isr_setup() {
  ISR_ROOT=$(mktemp -d)
  ISR_BARE=$(mktemp -d)
  ISR_SCRIPTS="$ISR_ROOT/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$ISR_SCRIPTS" "$ISR_ROOT/bin" "$ISR_ROOT/.claude/worktrees"
  # REPO_ROOT/SCRIPT_DIR are derived from the script's real location, so the
  # copy must be physical — same reason test-graph-select-target.sh copies.
  cp "$SCRIPT_DIR"/dispatch-invalid-state-route "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$ISR_SCRIPTS/"

  git init -q -b main "$ISR_ROOT"
  git -C "$ISR_ROOT" config user.email t@t
  git -C "$ISR_ROOT" config user.name t
  mkdir -p "$ISR_ROOT/intentions"
  cat > "$ISR_ROOT/intentions/tactic-fixture.md" <<'NODE'
---
id: tactic-fixture
kind: tactic
phase: implement
office_hours: null
---
# fixture
NODE
  git -C "$ISR_ROOT" add -A
  git -C "$ISR_ROOT" commit -q -m seed
  git init -q --bare -b main "$ISR_BARE"
  git -C "$ISR_ROOT" remote add origin "$ISR_BARE"
  git -C "$ISR_ROOT" push -q origin main
  git -C "$ISR_ROOT" fetch -q origin

  # Fake `claude agents --json`, payload driven by a file each case rewrites.
  cat > "$ISR_ROOT/bin/claude" <<'ISRCLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
cat "$_root/claude-payload.json"
exit 0
ISRCLAUDE
  chmod +x "$ISR_ROOT/bin/claude"
  # Empty-read corroboration stub: lib-claude-agents.sh only trusts an
  # exactly-`[]` payload when a daemon process is visible.
  cat > "$ISR_ROOT/bin/pgrep-visible" <<'ISRPGREP'
#!/usr/bin/env bash
exit 0
ISRPGREP
  chmod +x "$ISR_ROOT/bin/pgrep-visible"

  # Spawner stub that LOGS its argv, so "did we spawn, and with what" is an
  # assertion rather than an inference. It lives in the scripts dir so the
  # router's provenance check (real dir == scripts dir) passes.
  cat > "$ISR_SCRIPTS/spawn-stub" <<'ISRSPAWN'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "${ISR_SPAWN_LOG:?}"
exit "${ISR_SPAWN_RC:-0}"
ISRSPAWN
  chmod +x "$ISR_SCRIPTS/spawn-stub"
  ISR_SPAWN_LOG="$ISR_ROOT/spawn.log"
  : > "$ISR_SPAWN_LOG"

  # The intervention skill, present by default so the tier is armed. Cases that
  # test the inert path remove it.
  mkdir -p "$ISR_ROOT/.claude/skills/dispatch-invalid-state"
  echo "# skill" > "$ISR_ROOT/.claude/skills/dispatch-invalid-state/SKILL.md"

  ISR_ROUTE="$ISR_SCRIPTS/dispatch-invalid-state-route"
  printf '%s' '[]' > "$ISR_ROOT/claude-payload.json"
}

isr_teardown() { rm -rf "$ISR_ROOT" "$ISR_BARE"; }

# Run the router against the fixture. Echoes nothing; returns its exit code.
isr_run() {
  PATH="$ISR_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$ISR_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$ISR_ROOT/bin/pgrep-visible" \
  DISPATCH_INVALID_STATE_REPO_ROOT="$ISR_ROOT" \
  DISPATCH_INVALID_STATE_SPAWN_JOB="$ISR_SCRIPTS/spawn-stub" \
  DISPATCH_INVALID_STATE_FLEET_LATCH=0 \
  DISPATCH_STANDDOWN_DIR="$ISR_ROOT/standdown" \
  ISR_SPAWN_LOG="$ISR_SPAWN_LOG" ISR_SPAWN_RC="${ISR_SPAWN_RC:-0}" \
  "$ISR_ROUTE" "$@" >/dev/null 2>&1
}

payload() { printf '%s' "$1" > "$ISR_ROOT/claude-payload.json"; }
spawn_count() { wc -l < "$ISR_SPAWN_LOG" | tr -d ' '; }

# --- Case: usage errors ----------------------------------------------------
echo "Test: dispatch-invalid-state-route — argv validation"
isr_setup
isr_run --node "Bad Id" --kind terminal-session; rc=$?
assert_eq "route: an invalid node id is a usage error" "2" "$rc"
isr_run --node tactic-fixture --kind not-a-kind; rc=$?
assert_eq "route: an unknown kind is a usage error" "2" "$rc"
isr_run --kind terminal-session; rc=$?
assert_eq "route: a missing --node is a usage error" "2" "$rc"
assert_eq "route: no spawn happened on any usage error" "0" "$(spawn_count)"
isr_teardown

# --- Case: the mechanical tier's keep verdicts ------------------------------
# Every one of these is POSITIVE evidence to do nothing. None may spawn.
echo "Test: dispatch-invalid-state-route — the mechanical tier keeps on free / live / unknown"
isr_setup

payload '[]'
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: a free worktree keeps (the state resolved itself)" "4" "$rc"

payload '[{"sessionId":"s1","status":"busy","name":"tactic-fixture","state":"working"}]'
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: a LIVE claim keeps — never spawn into one" "4" "$rc"

# UNKNOWN: the daemon read fails outright.
cat > "$ISR_ROOT/bin/claude" <<'ISRFAIL'
#!/usr/bin/env bash
exit 1
ISRFAIL
chmod +x "$ISR_ROOT/bin/claude"
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: an UNKNOWN daemon read keeps — no positive evidence" "4" "$rc"

assert_eq "route: none of the keep verdicts spawned an intervention" "0" "$(spawn_count)"
isr_teardown

# --- Case: a free observation resets the attempt sidecar --------------------
echo "Test: dispatch-invalid-state-route — a free observation clears the attempt sidecar"
isr_setup
printf '2\n' > "$ISR_ROOT/.claude/worktrees/tactic-fixture.invalid-state-attempts"
payload '[]'
isr_run --node tactic-fixture --kind terminal-session
assert_eq "route: the sidecar is cleared when the state resolves itself" \
  "absent" "$([[ -f "$ISR_ROOT/.claude/worktrees/tactic-fixture.invalid-state-attempts" ]] && echo present || echo absent)"
isr_teardown

# --- Case: stand-down interlock and done-but-parked --------------------------
echo "Test: dispatch-invalid-state-route — stand-down and done-but-parked are valid states"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'

mkdir -p "$ISR_ROOT/standdown"
touch "$ISR_ROOT/standdown/tactic-fixture"
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: a stood-down node keeps (the interlock owns it)" "4" "$rc"
rm -f "$ISR_ROOT/standdown/tactic-fixture"

# done-but-parked: phase and office_hours are ORTHOGONAL (2026-08-04 ruling).
cat > "$ISR_ROOT/intentions/tactic-fixture.md" <<'DONEPARKED'
---
id: tactic-fixture
kind: tactic
phase: done
office_hours: {reason: waiting, since: 2026-08-01T00:00:00Z}
---
# fixture
DONEPARKED
git -C "$ISR_ROOT" add -A >/dev/null 2>&1
git -C "$ISR_ROOT" commit -q -m parked
git -C "$ISR_ROOT" push -q origin main
git -C "$ISR_ROOT" fetch -q origin
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: done-but-parked keeps — a VALID state, never invalid" "4" "$rc"
assert_eq "route: neither valid state spawned an intervention" "0" "$(spawn_count)"
isr_teardown

# --- Case: the intervention tier, its cap, and the inert path ----------------
echo "Test: dispatch-invalid-state-route — the intervention tier and its attempt cap"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'

# Skill absent -> the tier is INERT and today's behavior is preserved exactly.
rm -rf "$ISR_ROOT/.claude/skills/dispatch-invalid-state"
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: terminal with the skill absent escalates (tier inert)" "10" "$rc"
assert_eq "route: the inert tier spawned nothing" "0" "$(spawn_count)"

# Skill present -> intervene, and record the attempt.
mkdir -p "$ISR_ROOT/.claude/skills/dispatch-invalid-state"
echo "# skill" > "$ISR_ROOT/.claude/skills/dispatch-invalid-state/SKILL.md"
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: terminal with the skill present intervenes" "0" "$rc"
assert_eq "route: exactly one intervention was spawned" "1" "$(spawn_count)"
assert_eq "route: the attempt sidecar records the first attempt" \
  "1" "$(cat "$ISR_ROOT/.claude/worktrees/tactic-fixture.invalid-state-attempts")"

# The spawn's argv is load-bearing: --cwd must be the PROJECT ROOT (never the
# node worktree — two recorded stale-skill-body deadlocks), and --name must be
# the node id (it is what obliges the session to declare a disposition).
spawn_argv=$(head -1 "$ISR_SPAWN_LOG")
case "$spawn_argv" in
  *"--name tactic-fixture"*) name_ok=yes ;; *) name_ok="no: $spawn_argv" ;;
esac
assert_eq "route: the spawn passes --name <node-id>" "yes" "$name_ok"
case "$spawn_argv" in
  *"--cwd $ISR_ROOT "*) cwd_ok=yes ;; *) cwd_ok="no: $spawn_argv" ;;
esac
assert_eq "route: the spawn's --cwd is the project root, not the node worktree" "yes" "$cwd_ok"
case "$spawn_argv" in
  *"/dispatch-invalid-state tactic-fixture"*) prompt_ok=yes ;; *) prompt_ok="no: $spawn_argv" ;;
esac
assert_eq "route: the spawn invokes /dispatch-invalid-state <node-id>" "yes" "$prompt_ok"

# Attempts 2 and 3 still intervene; the 4th is over the cap.
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: the second attempt still intervenes" "0" "$rc"
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: the third attempt still intervenes" "0" "$rc"
assert_eq "route: three interventions were spawned in total" "3" "$(spawn_count)"
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: the fourth attempt is over the cap and escalates" "10" "$rc"
assert_eq "route: the over-cap attempt spawned nothing further" "3" "$(spawn_count)"
isr_teardown

# --- Case: --no-intervene skips the tier entirely ---------------------------
echo "Test: dispatch-invalid-state-route — --no-intervene goes straight to escalate"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'
isr_run --node tactic-fixture --kind terminal-session --no-intervene; rc=$?
assert_eq "route: --no-intervene escalates" "10" "$rc"
assert_eq "route: --no-intervene spawned nothing" "0" "$(spawn_count)"
isr_teardown

# --- Case: a failed spawn escalates without burning the budget ---------------
echo "Test: dispatch-invalid-state-route — a failed kick escalates and does not consume an attempt"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'
ISR_SPAWN_RC=1
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: a failed spawn escalates" "10" "$rc"
# The cap counts interventions actually LAUNCHED. Counting failures would let a
# broken spawner silently burn a node's whole intervention budget.
assert_eq "route: a failed spawn does not increment the attempt sidecar" \
  "absent" "$([[ -f "$ISR_ROOT/.claude/worktrees/tactic-fixture.invalid-state-attempts" ]] && echo present || echo absent)"
ISR_SPAWN_RC=0
isr_teardown

# --- Case: the retry/human class discrimination -----------------------------
# The standing rule from the 2026-07-25 clarification: a retry-shaped state
# routes to hold-node/blocked_by, NEVER office_hours on the source.
echo "Test: dispatch-invalid-state-route — a retry-class kind can never reach an office_hours write"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'
for k in provision-conflict worktree-residue fix-attempt-cap; do
  PATH="$ISR_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$ISR_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$ISR_ROOT/bin/pgrep-visible" \
  DISPATCH_INVALID_STATE_REPO_ROOT="$ISR_ROOT" \
  DISPATCH_INVALID_STATE_SPAWN_JOB="$ISR_SCRIPTS/spawn-stub" \
  DISPATCH_INVALID_STATE_FLEET_LATCH=0 \
  DISPATCH_INVALID_STATE_WRITE_OFFICE_HOURS=1 \
  ISR_SPAWN_LOG="$ISR_SPAWN_LOG" \
  "$ISR_ROUTE" --node tactic-fixture --kind "$k" >/dev/null 2>&1; rc=$?
  assert_eq "route: retry-class kind $k refuses an office_hours write" "2" "$rc"
done
assert_eq "route: no retry-class call spawned anything" "0" "$(spawn_count)"

# The router makes NO escalation write of any kind: no park-node, no hold-node,
# no claude rm, no graph-commit outside the fleet-latch block. This is a
# structural assertion, not a behavioural one — it is the doctrine grep.
invocations=$(grep -nE '^[^#]*(park-node|hold-node|claude rm)' "$ROUTE" | grep -v 'printf' | wc -l | tr -d ' ')
assert_eq "route: no park-node/hold-node/claude-rm invocation anywhere in the script" "0" "$invocations"
gc=$(grep -cE '^[^#]*graph-commit' "$ROUTE" | tr -d ' ')
assert_eq "route: graph-commit appears exactly once (the Unit 6 fleet latch)" "1" "$gc"
isr_teardown

# --- Case: preconditions ----------------------------------------------------
echo "Test: dispatch-invalid-state-route — preconditions escalate rather than acting"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'
git -C "$ISR_ROOT" checkout -q -b not-main
isr_run --node tactic-fixture --kind terminal-session; rc=$?
assert_eq "route: a primary checkout off main escalates" "10" "$rc"
git -C "$ISR_ROOT" checkout -q main

isr_run --node tactic-absent-from-main --kind terminal-session; rc=$?
assert_eq "route: a node absent from origin/main escalates" "10" "$rc"
assert_eq "route: no precondition failure spawned anything" "0" "$(spawn_count)"
isr_teardown

# --- Case: the fleet latch's anchored id keyspace ---------------------------
# The bug class this guards against deadlocked auto-merge for WEEKS: an
# unanchored prefix test caught an unrelated hand-authored tactic id.
echo "Test: dispatch-invalid-state-route — the fleet-latch id reader is anchored"
LATCH_RE='^tactic-invalid-state-[0-9a-f]{8}$'
for bad in tactic-invalid-state-lane tactic-invalid-state-transcript-intervention \
           tactic-invalid-state-rc-deadbeef tactic-invalid-state-deadbee \
           tactic-invalid-state-deadbeef9; do
  if [[ "$bad" =~ $LATCH_RE ]]; then m=matched; else m=rejected; fi
  assert_eq "latch-id: the anchored reader rejects $bad" "rejected" "$m"
done
if [[ "tactic-invalid-state-deadbeef" =~ $LATCH_RE ]]; then m=matched; else m=rejected; fi
assert_eq "latch-id: the anchored reader accepts a genuine 8-hex latch id" "matched" "$m"
# The id the script actually computes must satisfy its own reader, and must be
# stable for the same (kind, slug) and different for a different one.
isr_setup
mk_id() { printf '%s' "$1" | sha256sum | cut -c1-8; }
id_a="tactic-invalid-state-$(mk_id 'terminal-session:primary-checkout-not-on-main')"
id_b="tactic-invalid-state-$(mk_id 'terminal-session:node-absent-on-origin-main')"
if [[ "$id_a" =~ $LATCH_RE ]]; then m=matched; else m=rejected; fi
assert_eq "latch-id: a computed id satisfies the anchored reader" "matched" "$m"
assert_eq "latch-id: different preconditions yield different ids" \
  "differ" "$([[ "$id_a" != "$id_b" ]] && echo differ || echo same)"
assert_eq "latch-id: the same precondition is stable across calls" \
  "$id_a" "tactic-invalid-state-$(mk_id 'terminal-session:primary-checkout-not-on-main')"
isr_teardown

# --- Case: the fleet latch mints only on CONSECUTIVE observations -----------
echo "Test: dispatch-invalid-state-route — the fleet latch needs two consecutive observations"
isr_setup
payload '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done"}]'
git -C "$ISR_ROOT" checkout -q -b not-main
# Latch enabled, but the mint itself is stubbed out by pointing the store
# elsewhere: this case asserts the OBSERVATION COUNTER, which is what decides
# whether a mint is attempted at all.
run_latched() {
  PATH="$ISR_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$ISR_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$ISR_ROOT/bin/pgrep-visible" \
  DISPATCH_INVALID_STATE_REPO_ROOT="$ISR_ROOT" \
  DISPATCH_INVALID_STATE_SPAWN_JOB="$ISR_SCRIPTS/spawn-stub" \
  DISPATCH_INVALID_STATE_FLEET_LATCH=0 \
  "$ISR_ROUTE" --node tactic-fixture --kind terminal-session 2>&1 >/dev/null
}
out1=$(run_latched)
case "$out1" in *"1/2 observations"*) o1=counted ;; *) o1="no: $out1" ;; esac
assert_eq "fleet-latch: the first failure counts but does not mint" "counted" "$o1"
out2=$(run_latched)
case "$out2" in *"would have minted tactic-invalid-state-"*) o2=threshold ;; *) o2="no: $out2" ;; esac
assert_eq "fleet-latch: the second consecutive failure reaches the mint threshold" "threshold" "$o2"

# A successful precondition pass resets the counter, so only CONSECUTIVE
# failures accumulate toward a mint.
git -C "$ISR_ROOT" checkout -q main
isr_run --node tactic-fixture --kind terminal-session --no-intervene
assert_eq "fleet-latch: a healthy pass clears the observation sidecar" \
  "absent" "$([[ -f "$ISR_ROOT/.claude/worktrees/.invalid-state-fleet-primary-checkout-not-on-main" ]] && echo present || echo absent)"
git -C "$ISR_ROOT" checkout -q not-main
out3=$(run_latched)
case "$out3" in *"1/2 observations"*) o3=restarted ;; *) o3="no: $out3" ;; esac
assert_eq "fleet-latch: the counter restarts from 1 after a healthy pass" "restarted" "$o3"
isr_teardown

report_results
