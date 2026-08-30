---
id: tactic-worker-self-close-configurable
kind: tactic
statement: "Make worker-session auto-close configurable via a default-off
  operator escape hatch on the shared self-close primitive (default:
  auto-close)"
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-19 /align-strategy interview
  (configurable-auto-close clarification on strategy-graph-native-dispatch);
  finalized 2026-07-29 /align-tactics. An operator debugging a worker session
  whose pass DECLARED a terminal disposition has no way to keep it short of
  racing the Stop hook, because dispatch-self-close reaps every declared exit.
  This tactic adds the author's off-by-default escape hatch that keeps those
  sessions for local inspection, without weakening the disposable-session
  doctrine (the toggle is never router substrate). It carries the design decided
  in the interview: symmetric suppression across every declared disposition,
  shared-primitive placement, unchanged foreground gate, the router continuation
  lane left exempt, and the documented worktree-claim-hold consequence. The
  draft's original premise (reap on every terminal exit) and its 2026-07-26
  re-scope (reap iff the exit transitioned or parked) are both superseded by the
  2026-07-29 declared-vs-undeclared clarification; the toggle's mechanism is
  unchanged, only the baseline it layers on top of moved. That narrowed default
  is already live in dispatch-self-close, which reads only the node-terminal
  marker's node= line and ignores its disposition= member, and
  tactic-graph-node-session-reap has since closed to done — so this tactic adds
  the escape hatch alone, and must not re-introduce a disposition enumeration."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Make worker-session auto-close configurable via a default-off operator escape hatch on the shared self-close primitive (default: auto-close)

Finalized 2026-07-29 by `/align-tactics` (tactic-target finalize) into a 2-unit
plan. The 2026-07-19 `/align-strategy` draft context is superseded by the
reconciled Context section below — see the node rationale for the two premise
shifts (2026-07-26 re-scope, then the 2026-07-29 declared-vs-undeclared
reframe) that moved the baseline this toggle layers on top of.

## Context

`dispatch-self-close`
(`.claude/skills/dispatch-propagate/scripts/dispatch-self-close`) is the single
shared primitive that reaps a managed background job (`claude rm <job-id>`).
Every reap path in the repo funnels through its one exit at
`dispatch-self-close:216` — it is the ONLY `claude rm` call site outside tests
(verified by grep across `.claude/skills/dispatch-propagate/scripts` and
`.claude/hooks`). Callers: `.claude/hooks/dispatch-stop.sh:100-117` (node-worker
lane, passes `--node <node-id>`), `dispatch-finalize-phase` (legacy gh
issue-worker lane, no flag), and the retired router's own self-invocation
(session name `dispatch-*`).

Today the script has TWO gates and no config check at all:

1. `dispatch-self-close:160-196` — ROUTER continuation invariant, gated on
   `[[ "$SESSION_NAME" == dispatch-* ]]`. About chain liveness.
2. `dispatch-self-close:197-214` — NODE-WORKER terminal-disposition invariant
   (`elif [[ -n "$REQUIRE_NODE" ]]`): reap iff `$CLAUDE_JOB_DIR/node-terminal`
   declares `node=<this node>`; otherwise HOLD. This is the already-implemented
   "declared-vs-undeclared" default — an UNDECLARED terminal exit (crash, error,
   clean-but-silent) is already KEPT for debugging.

What is missing is the operator escape hatch: an operator debugging a session
that DID declare a terminal disposition has no way to keep it, short of racing
the Stop hook. This tactic adds a **default-off keep-all toggle** that layers on
top of the declared/undeclared default: when the toggle says "do not auto-close",
the sessions the default would reap are kept too. When absent (the default),
behavior is byte-for-byte what it is today.

Doctrinal framing carried from `strategy-graph-native-dispatch` (2026-07-19
configurable-auto-close clarification, amended 2026-07-19 reap-scope-narrowing
and 2026-07-29 declared-vs-undeclared):

- Auto-close remains the doctrinal default for every DECLARED terminal
  disposition. The toggle only ever moves sessions from "reaped" to "kept",
  never the reverse.
- The toggle is **symmetric**: one switch covering every declared disposition
  (advance, demote, park, fix-attempt, align-round, no-claim, conflict-resolved,
  conflict-hold, park-clear). Do NOT re-introduce a disposition enumeration —
  `dispatch-self-close` reads only `^node=` and ignores `disposition=` by
  design; enumerations went stale twice already.
- **Foreground-safe gate unchanged.** `dispatch-self-close:139-144`
  (`CLAUDE_JOB_DIR` unset → no-op) is untouched and must run BEFORE any config
  read. Interactive `/align` and `/office-hours` sessions are never affected.
- **Router path exempt.** The toggle must NOT touch the ROUTER
  continuation-invariant path (`dispatch-self-close:160-196`). That path is
  about chain liveness, not operator inspection; a router held alive by a debug
  knob would wedge routing.
- **Documented consequence — the claim-hold.** A kept-alive session keeps
  `worktree_has_live_session` TRUE, so the node-id worktree claim stays held and
  the router will NOT select that node's next phase until the operator manually
  runs `claude rm <job-id>`. Leaving the toggle on stalls every affected node.
  This must appear as a prominent one-line caution wherever the flag is
  documented.

### Greenfield design (chosen)

A new `dispatch-config-load` config type, `worker-sessions`, read from
`<project-root>/dispatch.config/worker-sessions.json`:

```json
{ "auto_close": false }
```

- `auto_close` — boolean, required when the file is present. `false` = keep
  declared-terminal worker sessions alive (the debug hold). `true` (redundant
  with the absent-file default) = auto-close.
- **Absent file → auto-close ON.** This type therefore INVERTS
  `dispatch-config-load`'s generic absent→inert convention, exactly as
  `auto-merge` does (`dispatch-config-load:192-207`). The header schema block
  must say so explicitly, and must cross-reference `force-opus`
  (`dispatch-config-load:209-225`) as the convention this type does NOT follow.
  Rationale for the inverted form over a `keep-worker-sessions` opt-in type: the
  field name states its polarity at the read site (`.auto_close`), `auto-merge`
  already establishes and documents the inverted convention, `worker-sessions`
  is an extensible home for future worker-session lifecycle fields, and the node
  author's own recommendation names this file.
- Env override `DISPATCH_SELF_CLOSE_AUTO_CLOSE` (`true`/`false`), matching the
  script's existing `DISPATCH_SELF_CLOSE_*` prefix
  (`dispatch-self-close:98-105,113-114`). Precedence, mirroring
  `dispatch-sweep:88-115`: **config file value → env var → baked default
  `true`**.
- No brownfield migration path is needed: this is a net-new, absent-by-default
  flag whose default reproduces current behavior exactly. There is no sentinel
  or prior mechanism to migrate, and no other reap path to gate.

Two sequenced units follow.

---

## Unit 1 — Add the `worker-sessions` config type to `dispatch-config-load`

### Scope

All edits are inside
`.claude/skills/dispatch-propagate/scripts/` unless noted.

**`dispatch-config-load`** — three coordinated edits, matching the file's own
"adding a type" shape:

1. Usage strings: add `worker-sessions` to the type list at
   `dispatch-config-load:10` (header `# Usage:` line) and to the `echo "error:
   usage: ..."` line at `dispatch-config-load:328`.
2. Type allowlist: add `worker-sessions` to the `case "$CONFIG_TYPE" in` arm at
   `dispatch-config-load:326`
   (`projects|jit|statements|target-workers|epic|auto-merge|force-opus|strict-preflight|sweep|selection-lock|census`).
3. Header schema block: add a `# ---- Schema: worker-sessions.json ----` prose
   block immediately AFTER the `force-opus` block (`dispatch-config-load:209-225`)
   and before the `strict-preflight` block. Copy the shape of the `auto-merge`
   block (`dispatch-config-load:192-207`) for its inverted-convention wording.
   Content: gates whether `dispatch-self-close` auto-closes a worker job whose
   pass declared a terminal disposition; read by `dispatch-self-close`; INVERTS
   the generic absent→inert convention (absent → no-config → auto-close ON);
   `auto_close` boolean required when present; a one-line CAUTION that
   `auto_close: false` holds each affected node's worktree claim until a manual
   `claude rm`; and a pointer to `worker-sessions.example.json`.
4. Validator branch: in the big `case "$CONFIG_TYPE" in` validation switch
   (starts `dispatch-config-load:374`), add a `worker-sessions)` arm. Copy the
   `force-opus)` arm verbatim (`dispatch-config-load:542-556`) and rename the
   field `enabled` → `auto_close` in all three places (the `has()` check, the
   type check, and the two error strings).

**New file** `.claude/skills/dispatch-propagate/scripts/worker-sessions.example.json`:

```json
{
  "auto_close": false
}
```

(Every config type has a sibling `<type>.example.json`; 11 exist today, none
missing. Show the operator-meaningful form — the opt-out — as
`force-opus.example.json` shows `{"enabled": false}`.)

**Loader tests** in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh`: add
five cases immediately after the `force-opus` loader tests (Tests 7p–7t),
reusing the existing `config_setup` / `config_teardown` helpers, which copy
`dispatch-config-load` + `lib.sh` into a scratch `scripts/` dir and export
`DISPATCH_CONFIG_DIR`). Mirror the force-opus cases one-for-one:

- valid `{"auto_close":true}` → exit 0, `.auto_close == true`
- valid `{"auto_close":false}` → exit 0, `.auto_close == false`
- file absent → exit 0, stdout exactly `no-config`
- `{}` (missing required field) → exit 1, stderr mentions `auto_close`
- `{"auto_close":"yes"}` (wrong type) → exit 1, stderr mentions `auto_close`

**Out of scope for this unit:** any change to `dispatch-self-close`, to
`.claude/hooks/dispatch-stop.sh`, to `mark-node-terminal`
(`packages/intentionsutil/scripts/mark-node-terminal` — the marker format and
its writers are unaffected; the toggle gates only what `dispatch-self-close`
does after the marker check has already resolved), to `dispatch-sweep`, or to
any other config type's schema or validator.

### Recommended model

sonnet

---

## Unit 2 — Gate the reap on the toggle in `dispatch-self-close`, plus tests and docs

### Scope

**`.claude/skills/dispatch-propagate/scripts/dispatch-self-close`** — the only
behavior change in this plan.

1. **Hoist `SCRIPT_DIR`.** It is currently computed inside the router branch at
   `dispatch-self-close:161`. Compute it once at top level (just after the arg
   parse loop ends at line 137, before `JOB_ID=` at line 139) and delete the
   in-branch duplicate at line 161, leaving the router's `source
   "$SCRIPT_DIR/lib-claude-agents.sh"` (line 163) working unchanged. It is a
   pure `BASH_SOURCE` expression, so hoisting is behavior-neutral.

2. **Resolve the toggle**, placed AFTER the `CLAUDE_JOB_DIR` gate
   (`dispatch-self-close:141-144`) so an interactive session never reads config,
   and BEFORE the invariant branches. Follow `dispatch-sweep:88-115` verbatim in
   shape — capture stderr into the output var with `2>&1`, branch on the loader's
   exit status, then apply precedence config → env → default:

   ```bash
   AUTO_CLOSE=true
   AUTO_CLOSE_ERR=""
   if CFG_OUT=$("$SCRIPT_DIR/dispatch-config-load" worker-sessions 2>&1); then
     val=""
     if [[ "$CFG_OUT" != "no-config" ]]; then
       val=$(jq -r '.auto_close // empty' <<<"$CFG_OUT" 2>/dev/null)
     fi
     if [[ "$val" == "true" || "$val" == "false" ]]; then
       AUTO_CLOSE="$val"
     elif [[ "${DISPATCH_SELF_CLOSE_AUTO_CLOSE:-}" == "true" \
          || "${DISPATCH_SELF_CLOSE_AUTO_CLOSE:-}" == "false" ]]; then
       AUTO_CLOSE="$DISPATCH_SELF_CLOSE_AUTO_CLOSE"
     fi
   else
     AUTO_CLOSE=false
     AUTO_CLOSE_ERR="$CFG_OUT"
   fi
   ```

   Note `jq -r '.auto_close // empty'` on a literal `false` yields empty (jq's
   `//` treats `false` as absent), so the sketch above must instead use
   `jq -r 'if has("auto_close") then .auto_close else empty end'` — implement
   with that form, or any equivalent that distinguishes a present `false` from
   an absent field. Get this right; it is the polarity-critical line.

   Use `<<<` here-strings, never `echo "$VAR" | jq` (`.claude/rules/shell-json.md`;
   mechanically linted). The script runs `set -uo pipefail` and has no `-e`, so
   guard every unset read with `${VAR:-}` as the existing code does.

3. **Fail direction on a loader failure = KEEP** (the `else` arm above sets
   `AUTO_CLOSE=false`). Justification to record in a comment: this branch's
   documented fail direction is HOLD (`dispatch-self-close:70-78`) — a held job
   is visible in `claude agents --json` and clearable by hand, a wrongly-reaped
   one is gone. A malformed `worker-sessions.json` or an unresolvable project
   root therefore holds and prints the loader diagnostic, rather than silently
   reaping. This deliberately differs from `dispatch-spawn-job:249-259`'s
   force-opus consumer, which may fall back safely because its failure mode is
   only a model choice.

4. **The gate**, inserted immediately before `exec "$CLAUDE_CMD" rm "$JOB_ID"`
   (`dispatch-self-close:216`), explicitly excluding the router lane:

   ```bash
   # Operator escape hatch (default-off keep-all). Applies to every NON-router
   # path that reaches the reap: the --node marker-matched reap and the legacy
   # unconditional fallthrough. The ROUTER continuation path is exempt by
   # design — it is about chain liveness, not operator inspection.
   if [[ "$SESSION_NAME" != dispatch-* && "$AUTO_CLOSE" != "true" ]]; then
     msg="dispatch-self-close: keeping — worker auto-close is disabled (dispatch.config/worker-sessions.json auto_close=false, or DISPATCH_SELF_CLOSE_AUTO_CLOSE=false)${AUTO_CLOSE_ERR:+ [config error: $AUTO_CLOSE_ERR]}. Job '$JOB_ID' stays alive; its node-id worktree claim stays HELD until you run: claude rm $JOB_ID"
     echo "$msg"
     echo "$msg" >&2
     exit 0
   fi
   ```

   Print to BOTH stdout and stderr, exiting 0, mirroring the existing park
   message (`dispatch-self-close:191-196`) and hold message
   (`dispatch-self-close:206-211`) — the Stop hook silences stdout and lets
   stderr through (`.claude/hooks/dispatch-stop.sh:112-116`).

   **Do not touch:** the `CLAUDE_JOB_DIR` gate (`dispatch-self-close:139-144`),
   the router branch body (`dispatch-self-close:160-196`), or the marker check
   (`dispatch-self-close:197-214`). Do not rewrite line 216 itself into the
   branch; the router path still reaches it unchanged.

5. **Header docs** in the same file: add `DISPATCH_SELF_CLOSE_AUTO_CLOSE` to the
   env-override list (`dispatch-self-close:98-105`); add two rows to the
   Behavior table (`dispatch-self-close:88-96`) — `auto_close=false, non-router
   → keep: print reason, exit 0 WITHOUT claude rm`, and `router → unaffected by
   auto_close`; and add a short third section after Invariant 2 describing the
   escape hatch, its config file, its precedence chain, its fail-toward-keep
   direction, and the claim-hold caution.

**`.claude/skills/dispatch-propagate/scripts/test-dispatch-self-close.sh`** —
extend the existing `dispatch-self-close` block:

- Extend `selfclose_setup` to also `cp
  "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/"` and `cp
  "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/"` (`chmod +x` the loader only —
  `lib.sh` is sourced), `mkdir -p "$TMPDIR_TEST/config"`, and `export
  DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"`. This is required: the script is
  run from a copied `scripts/` dir, so it resolves the loader through its own
  `SCRIPT_DIR`, and `DISPATCH_CONFIG_DIR` keeps the loader off the real repo
  config. Add `DISPATCH_CONFIG_DIR` and `DISPATCH_SELF_CLOSE_AUTO_CLOSE` to the
  `unset` list in `selfclose_teardown`.
- Add a helper `selfclose_write_worker_sessions <true|false>` that writes
  `{"auto_close":<v>}` to `$DISPATCH_CONFIG_DIR/worker-sessions.json`, alongside
  the existing `selfclose_write_state` / `selfclose_write_terminal_marker`
  helpers.
- New cases, each `selfclose_setup` … `selfclose_teardown`, asserting via the
  existing `selfclose_assert_no_rm` or by reading
  `$SPAWN_ROUTER_RM_LOG`:
  1. `--node tactic-x`, matching marker, `auto_close:false` → NO `claude rm`;
     stdout/stderr contain `keeping`.
  2. `--node tactic-x`, matching marker, `auto_close:true` → `claude rm` invoked
     (explicit-true no-regress).
  3. `--node tactic-x`, matching marker, config file absent → `claude rm`
     invoked (default no-regress).
  4. Legacy fallthrough (no `--node`, no `dispatch-*` state name),
     `auto_close:false` → NO `claude rm` (shared primitive covers the legacy
     lane).
  5. ROUTER (`selfclose_write_state "dispatch-abcd1234"` + a busy worker via
     `selfclose_set_workers "824-foo:busy"`) with `auto_close:false` → `claude
     rm` STILL invoked. This is the router-exemption regression test; it must
     fail if the gate is placed unconditionally at line 216.
  6. Env-only: no config file, `DISPATCH_SELF_CLOSE_AUTO_CLOSE=false`,
     `--node` + matching marker → NO `claude rm`.
  7. Precedence: `auto_close:true` in the file AND
     `DISPATCH_SELF_CLOSE_AUTO_CLOSE=false` → `claude rm` invoked (config wins
     over env).
  8. Malformed `worker-sessions.json` (e.g. `{"auto_close":"yes"}`), `--node` +
     matching marker → NO `claude rm`, and the message mentions the config error
     (fail-toward-keep).
  9. `--node tactic-x` with NO marker and `auto_close:false` → still the
     existing HOLD path, no `claude rm` (the toggle never makes behavior more
     aggressive).

  **Note:** `tactic-dispatch-test-monolith-split` has already landed the split
  of the old monolith into per-SUT files; the self-close block now lives in
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-self-close.sh` (as
  referenced above), and the loader cases from Unit 1 live in
  `test-dispatch-config-load.sh`.

**`.claude/skills/dispatch-propagate/reference.md`** — add a short prose
paragraph in the self-close discussion (`reference.md:573-582`, which already
narrates the router park behavior), following the inline-config style used at
`reference.md:143` (selection-lock) and `reference.md:483` (target-workers):
name `dispatch.config/worker-sessions.json` `{"auto_close": false}`, state that
absent means auto-close, state that the router lane is exempt, and give the
claim-hold caution as its own sentence — a kept session holds
`worktree_has_live_session` TRUE, so the node's next phase is not selected until
a manual `claude rm <job-id>`; leaving the flag on stalls every affected node.

**Out of scope:** `.claude/hooks/dispatch-stop.sh` (no call-site change — the
toggle lives in the primitive); `mark-node-terminal` and its disposition enum;
`dispatch-sweep` (its node arm requires no live session, and a kept session is
live, so a kept job is never reaped behind the operator's back — no second gate
needed); the frozen-session debug count (`tactic-frozen-session-debug-count`);
and any change to which dispositions are reapable.

### Dependencies

Unit 1 (the `worker-sessions` type must exist in `dispatch-config-load`, or the
consumer's loader call exits 2 on the usage guard and every reap turns into a
keep).

### Recommended model

opus

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-config-load` — THE config
  loader; do not invent a second read path. Stdout protocol: normalized JSON, or
  literal `no-config` (exit 0) when absent; exit 1 on invalid JSON/schema; exit 2
  on usage/env error. Config dir = `resolve_project_root` (`lib.sh`) +
  `/dispatch.config/`, overridable via `DISPATCH_CONFIG_DIR`.
- `dispatch-config-load:192-207` — `auto-merge` schema block: the inverted
  absent→ON convention wording to copy.
- `dispatch-config-load:209-225` and `:542-556` — `force-opus` schema block and
  15-line jq validator: the exact validator shape to copy (rename `enabled` →
  `auto_close`).
- `.claude/skills/dispatch-propagate/scripts/dispatch-sweep:88-115` — the
  config → env → baked-default precedence chain, including folding loader stderr
  into the captured var with `2>&1`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:249-259` — the
  canonical `CFG=$("$SCRIPT_DIR/dispatch-config-load" <type>)` consumer shape.
- `dispatch-self-close:98-105,113-114` — the `DISPATCH_SELF_CLOSE_*` env-override
  naming convention and `${VAR:-default}` idiom.
- `dispatch-self-close:191-196` and `:206-211` — the existing park/hold message
  style (stdout + stderr, `exit 0`) the keep message must mirror.
- `test-dispatch-config-load.sh` — `config_setup` / `config_teardown`
  for loader tests, and the force-opus loader test quintet to mirror.
- `test-dispatch-self-close.sh` — `selfclose_setup`,
  `selfclose_write_state`, `selfclose_write_terminal_marker`,
  `selfclose_set_workers`, `selfclose_set_timer`, `selfclose_assert_no_rm`,
  `selfclose_teardown`; plus `write_fake_spawn_router_claude`'s fake `claude`
  that logs `rm` argv to `$SPAWN_ROUTER_RM_LOG`.
- `.claude/skills/dispatch-propagate/scripts/*.example.json` (11 files) — the
  example-file convention.

## Verification

Both units are shell-only; the repo's bash suite is the end-to-end check. The
whole suite must pass, not just the new cases (Unit 2 changes a shared setup
helper).

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-self-close.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-config-scope.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

Manual / judgment checks:

- **Default no-regress, read from the diff:** with no `dispatch.config/worker-sessions.json`
  present, the only behavioral delta in `dispatch-self-close` must be an
  additional loader call. Confirm the pre-existing self-close tests (Tests 1–16,
  in `test-dispatch-self-close.sh`) pass unmodified except for the
  `selfclose_setup`/`selfclose_teardown` additions.
- **Polarity spot-check:** run
  `printf '{"auto_close":false}' > /tmp/claude-ws/worker-sessions.json` and
  `DISPATCH_CONFIG_DIR=/tmp/claude-ws .claude/skills/dispatch-propagate/scripts/dispatch-config-load worker-sessions`
  — it must print `{"auto_close": false}` (not `no-config`, not an error), and
  the consumer must read a present `false` as `false` rather than falling
  through to the default `true`. This is the single most likely implementation
  bug (jq's `//` operator swallows `false`).
- **Live observation (operator, out of band — do NOT leave enabled):** drop
  `dispatch.config/worker-sessions.json` with `{"auto_close": false}`, let one
  node worker complete a phase, and confirm (a) its job still appears in
  `claude agents --json`, (b) the node's phase DID advance on `origin/main`
  (the durable write happens before the reap decision), (c) the node's worktree
  claim is still held and the router does not select its next phase, and (d) a
  manual `claude rm <job-id>` releases it. Then delete the config file. Run
  every `claude agents --json` call with `dangerouslyDisableSandbox: true`
  (`.claude/rules/sandbox.md`).
- **Interactive-session safety:** running `dispatch-self-close --node tactic-x`
  from a foreground shell with `CLAUDE_JOB_DIR` unset must still print the
  "not a managed background job" diagnostic and exit 0 without reading config
  (covered by existing Test 16, but confirm the config read was placed after the
  gate, not before it).
