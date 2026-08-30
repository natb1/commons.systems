---
id: tactic-dispatch-pause-config-field
kind: tactic
statement: Replace the dispatch pause sentinel file with a
  dispatch.config/*.json boolean field as the sole mechanism, failing closed on
  any config read error
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-26 /align-strategy interview (the pause-field,
  XDG-divergence and steelman clarifications on strategy-graph-native-dispatch,
  and the amended paused-scheduling standing-mode condition). The author
  requires dispatch scheduling pause to be durable operator configuration read
  through dispatch-config-load, like the other operator-facing dispatch
  parameters, rather than a filesystem sentinel. Carries the design decided in
  that interview: sole-mechanism replacement (no dual path, no compatibility
  shim), fail-closed error handling at the gate, verbatim preservation of
  spawn-gating-only semantics and the manual-dispatch override, and migration of
  every in-repo reference to the old sentinel path. Reconciled 2026-08-19 at
  finalize against origin/main 0a27c7cb, which corrected three premises the
  2026-07-26 record carried: (a) the uniformity argument is two parameters, not
  three — max_concurrent_workers and weekly_pace_floor_pct resolve through the
  loader today, while the worker auto-close toggle is unbuilt and is the sibling
  being built to this same pattern (2026-07-29 loader-tense clarification); (b)
  the sentinel now has two live code sites, not one — dispatch-tick's GATE and
  lib-pause-state.sh's out-of-band INSTRUMENT helper, which did not exist when
  this node was recorded and which must fail OPEN (tri-state unknown, still
  emitting) exactly where the gate fails closed; and (c) the live fleet is
  paused through the sentinel right now, so a naive cutover would silently
  resume it and the migration must open with an operator cutover step.
  Multi-entry serves is honest rather than nearest-fit: pause semantics are
  owned by strategy-graph-native-dispatch, the dispatch.config/ artifact shape
  by strategy-owned-orchestration."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-owned-orchestration
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
# Replace the dispatch pause sentinel with a dispatch.config field

## Context

Dispatch scheduling pause is the last operator-facing dispatch parameter that is
not read through `dispatch-config-load`. It is a filesystem sentinel: the tick
resolves `DISPATCH_PAUSE_FLAG` (default
`${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused`) and gates on the
file's existence. Every other operator parameter that resolves through the
loader lives in `<project-root>/dispatch.config/<type>.json`.

The 2026-07-26 `/align-strategy` round (pause-field, XDG-divergence, and
steelman clarifications on `strategy-graph-native-dispatch`, and the amended
paused-scheduling standing-mode condition) resolved that pause becomes a
`dispatch.config/*.json` boolean field and that the field is the **sole**
mechanism — the sentinel is deleted, not kept as a dual path or a compatibility
shim. Default `false` (not paused), matching today's absent-sentinel default.
The move is a deliberate reclassification of pause from runtime state to durable
operator configuration, justified by that same condition: paused-scheduling is a
STANDING operating mode, not a degraded or temporary one.

The uniformity argument is **two parameters, not three**. The 2026-07-29
loader-tense clarification corrected the earlier "three already resolve through
`dispatch-config-load`" claim: only `max_concurrent_workers` and
`weekly_pace_floor_pct` do (both under the `target-workers` type,
`.claude/skills/dispatch-propagate/scripts/dispatch-config-load` line 10's type
list). The worker auto-close toggle does **not** — it is unbuilt, and
`tactic-worker-self-close-configurable` (phase `implement`) is the node building
it to this same pattern. Any earlier prose in this node asserting the
three-parameter version is superseded by this paragraph.

### State measured 2026-08-19 against origin/main `0a27c7cb`

Two live code sites read the sentinel, plus one live prose site:

1. **The GATE** — `.claude/skills/dispatch-propagate/scripts/dispatch-tick:421-422`:
   ```
   DISPATCH_PAUSE_FLAG="${DISPATCH_PAUSE_FLAG:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused}"
   if [[ -z "$MANUAL" && -e "$DISPATCH_PAUSE_FLAG" ]]; then
   ```
   The `--manual` override is the `-z "$MANUAL"` conjunct inside that same test,
   not a separate branch. The paused branch now spans roughly `:422-630` and does
   substantially more than the 2026-07-26 prose described: `reservation_sweep`,
   the frozen-session sweep, stand-down surfacing, stale-hold re-check,
   office_hours escalation, a paused banner at `:527`, and a node-lane
   merge/reconcile drain bounded by `DISPATCH_PAUSED_DRAIN_TIMEOUT_S`
   (default 600, `:607`). Header prose describing the paused branch and naming
   the sentinel: `:76`, `:151`, `:401-419`, `:416`, `:527`, `:531`.
2. **The INSTRUMENT** — `.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh`
   (103 lines), the canonical tri-state pause reader for every out-of-band
   instrument, landed by `tactic-fleet-watchdogs-session-scoped`. Sentinel
   expression at `:8` (header) and `:74` (live default in `dispatch_pause_state`).
   Its own header at `:17-19` names this tactic explicitly: "When
   `tactic-dispatch-pause-config-field` lands (moving the pause flag from a
   sentinel file to a config field), this file is the ONE file that migrates
   every one of those callers at once." Treat that as a standing instruction.
3. **A stale forward-reference** — `dispatch-select-tick:915-924`, a comment
   stating the config field is "not yet built, tracked by
   `tactic-dispatch-pause-config-field`, so dispatch-tick still resolves
   `DISPATCH_PAUSE_FLAG` today". It goes false the moment this lands.

Downstream consumers of `lib-pause-state.sh` need **no** functional change
(they depend only on its stdout contract), but their prose and tests do:
`dispatch-fleet-watch:163` (env-var doc), `:327-331` (sources the helper,
hard-fails at exit 69 if it cannot), `:735` (the `unknown` reason string, which
quotes "the sentinel's parent directory ... is not searchable");
`packages/intentionsutil/scripts/read-sensors.ts:1465-1479` (`readPauseState`
shells `bash -c 'source <lib> && dispatch_pause_state'` with `cwd: repoRoot`);
`lib-unit-disable-state.sh:9, :17-21, :119` (cross-reference prose calling this
the "global pause sentinel", plus a deliberate `set -uo pipefail` divergence
note that must stay true).

`.claude/skills/dispatch-propagate/scripts/dispatch-config-load` is 779 lines.
Anchors: type allowlist `:326`; the two usage strings `:10` and `:328`;
`DISPATCH_CONFIG_DIR` seam / `resolve_project_root` / exit 2 at `:339-345`;
`CONFIG_FILE` resolution and absent-file `no-config` exit 0 at `:349-354`;
invalid-JSON exit 1 at `:358-363`; empty-file exit 1 at `:366-370`; the
`force-opus` single-boolean validator arm at `:542-556`; the `force-opus` header
schema prose block at `:209-225` (`strict-preflight` at `:227-243` is equally
close). Eleven types exist today: `projects`, `jit`, `statements`,
`target-workers`, `epic`, `auto-merge`, `force-opus`, `strict-preflight`,
`sweep`, `selection-lock`, `census`. Eleven matching `*.example.json` siblings
sit in the same directory. There is no `pause` member anywhere.

### Greenfield design

One new loader type, `pause`, backing `<project-root>/dispatch.config/pause.json`:

```json
{ "paused": true }
```

The field is named `paused`, not `enabled`. This is a **deliberate divergence**
from the single-boolean convention of `force-opus` / `strict-preflight` /
`auto-merge`, and it must be documented as such in the new schema prose block.
Reason: this is the one config field where an operator misreading polarity
silently resumes a fleet that was deliberately stopped. `"enabled": true` in a
file named `pause.json` is ambiguous between "pause is enabled" and "dispatch is
enabled"; `"paused": true` is not.

Two readers, deliberately **not** collapsed into one:

- The **gate** (`dispatch-tick`) fails **CLOSED**. Any config resolve/read/parse
  failure ⇒ PAUSED. This is net-new risk introduced by the migration: the old
  `[[ -e "$FLAG" ]]` test had no such failure mode, whereas
  `dispatch-config-load` exits 2 outside a git repo, exits 1 on invalid or empty
  JSON, and — once `tactic-dispatch-config-template` makes `dispatch.config/` a
  symlink into a private instance repo — a dangling symlink or unmounted
  checkout is a live possibility. Fail-closed follows
  `.claude/rules/code-style.md` and matches `dispatch-tick`'s existing stance of
  failing loud when `lib-reservation-ledger.sh` fails to load.
- The **instrument** (`lib-pause-state.sh`) keeps its tri-state contract
  (`paused` / `not-paused` / `unknown`, printed to stdout, ALWAYS `return 0`)
  and still emits on `unknown`. Strategy clarification 172 is explicit that
  condition 16's fail-closed default is **inverted** for out-of-band
  instruments: silencing on an unreadable input is exactly the silent-PASS
  failure that helper exists to close. Do not collapse the two readers into one
  fail-closed helper — that regresses clarification 172.

Mapping under the config field:

| `dispatch-config-load pause` result | gate | instrument |
| --- | --- | --- |
| exit 0, `no-config` (file absent) | not paused | `not-paused` |
| exit 0, valid JSON, `"paused": false` | not paused | `not-paused` |
| exit 0, valid JSON, `"paused": true` | **paused** | `paused` |
| exit 1 (invalid JSON, empty file, schema failure) | **paused** | `unknown` |
| exit 2 (no project root and `DISPATCH_CONFIG_DIR` unset) | **paused** | `unknown` |
| script missing / not executable / any other nonzero | **paused** | `unknown` |

There is no brownfield migration path to propose. The scope is one PR, and the
ratified design is explicitly sole-mechanism: a dual path (read the field, fall
back to the sentinel) is the thing the 2026-07-26 round ruled out. The only
sequencing subtlety is the live-state cutover below, which is operator action,
not a code compatibility layer.

### Standing conventions this plan inherits (clarification 140) — do not re-invent

- **Adding a loader type is a FOUR-PART edit**, because every existing type
  carries all four: (a) the type allowlist at `:326` **plus both** usage strings
  at `:10` and `:328`, (b) a validator `case` arm, (c) a header schema prose
  block, (d) a `<type>.example.json` sibling in the same scripts directory. A
  type that lands with only the allowlist entry is silently unvalidated. There
  is no fifth site: `dispatch-config-load:777-779` prints every validated type's
  JSON verbatim with no per-type normalization.
- **The absent-key test must be** `jq -r 'if has("<key>") then .<key> else empty end'`,
  **never** `jq -r '.<key> // empty'` — `//` treats a literal `false` as absent
  and collapses an explicit operator opt-out into the default. Clarification 140
  states this as a standing convention generalizing to every boolean config
  field, "pause included".

### Live-state hazard — the fleet is paused right now

Measured on this host 2026-08-19: `~/.local/share/commons-dispatch/paused`
**exists** (0 bytes, mtime 2026-08-10 11:51), and
`strategy-recursive-self-improvement`'s `attributes.pause` records a standing
author-directed pause since 2026-08-10 with `mechanism: sentinel`.
Meanwhile `<project-root>/dispatch.config/` is a real **git-untracked**
directory holding exactly one file, `target-workers.json` (`{"max_concurrent_workers": 3}`).
It is not yet the instance-repo symlink, and nothing in this repo can commit a
value into it.

Because an absent config file resolves to `no-config` ⇒ default false ⇒ NOT
paused, landing this migration without first writing the field would **silently
resume a deliberately paused fleet** at the next timer tick. Unit 1 therefore
opens with an operator cutover step that writes `{"paused": true}` into the live
`dispatch.config/` **before** any code lands. Writing it early is harmless: the
field is unread until the gate migrates.

## Unit 1 — Operator cutover: write the live pause value before any code lands

### Scope

Before writing a line of code, write the live pause value so the merge cannot
resume the fleet:

- Create `/home/n8/natb1/commons.systems/dispatch.config/pause.json` containing
  exactly `{"paused": true}` (pretty-printed or not; the loader normalizes).
  That directory is the shared project-root `dispatch.config/`, resolved by
  `resolve_project_root` (`.claude/skills/dispatch-propagate/scripts/lib.sh:2034`)
  from any worktree, so all worktrees see one file.
- **Sandbox note**: the project-root `dispatch.config/` is outside this session's
  worktree, so the write fails read-only under the sandbox. Retry the single
  `printf`/`tee` write with `dangerouslyDisableSandbox: true` after observing
  the read-only failure. This directory is git-untracked — the file is host
  state, never a repo artifact, and must not be added to the PR.
- Verify the file is well-formed with `jq . <path>` before proceeding.
- Do **not** delete the sentinel in this unit. The sentinel stays until the
  migrated gate is merged (Unit 5).

Out of scope: any repo file. This unit produces no commit.

**Recommended model**: sonnet

## Unit 2 — Add the `pause` type to `dispatch-config-load`

### Scope

Four-part edit to `.claude/skills/dispatch-propagate/scripts/dispatch-config-load`,
plus its suite:

1. Add `pause` to the type allowlist at `:326` and to **both** usage strings at
   `:10` and `:328`. All three lists must stay byte-identical in content. Place
   `pause` consistently in all three (append after `census` or keep alphabetical
   — pick one and apply it to all three).
2. Add a validator `case` arm for `pause` inside the big
   `case "$CONFIG_TYPE" in ... esac`. Copy the `force-opus` arm at `:542-556`
   verbatim and change the field name from `enabled` to `paused`: top-level must
   be an object; `paused` required; `paused` must be a boolean. Use the
   `has("paused")` form, never `.paused // empty`.
3. Add a `---- Schema: pause.json ----` header prose block, modeled on the
   `force-opus` block at `:209-225`. It must state THREE things the other blocks
   do not:
   - the field is named `paused`, not `enabled`, and why (polarity legibility on
     the one field whose misreading resumes a stopped fleet);
   - the absent-file convention: absent ⇒ `no-config` ⇒ **not paused** (dispatch
     runs), matching the historical absent-sentinel default — the same generic
     convention `force-opus` follows, explicitly NOT `auto-merge`'s inversion;
   - the **third convention** this type introduces, which no existing type has:
     the *caller* on the gating path treats any nonzero exit from this script as
     PAUSED (fail closed), while the out-of-band instrument treats the same
     nonzero exit as `unknown`. The loader itself does not implement either
     behavior — it only reports — and the block must say so, so a future reader
     does not look for fail-closed logic inside this file.
4. Add `.claude/skills/dispatch-propagate/scripts/pause.example.json` containing:
   ```json
   {
     "paused": false
   }
   ```
   matching the two-space-indent shape of `force-opus.example.json`.
5. Add a five-test block to
   `.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh`,
   copying the force-opus template at `:951-1017`: valid `true`, valid `false`,
   file absent ⇒ `no-config` at exit 0, missing `paused` field ⇒ exit 1,
   `paused` of wrong type (e.g. the string `"true"`) ⇒ exit 1. Use the existing
   `config_setup` / `config_teardown` helpers (`:18-38`) and `assert_eq`.
   Add one extra case beyond the template: `{"paused": false}` must round-trip
   with `false` present in the printed JSON, proving the `has()` form did not
   collapse an explicit `false` into absence.

Out of scope: any behavior change to the eleven existing types; any change to
`dispatch-config-load`'s exit-code contract (`:19-20`).

**Recommended model**: sonnet

**Dependencies**: none (may run in parallel with Unit 1, but must not merge
before Unit 1's file exists on the host).

## Unit 3 — Migrate the gate in `dispatch-tick` (fail closed)

### Scope

`.claude/skills/dispatch-propagate/scripts/dispatch-tick`:

- Replace the `DISPATCH_PAUSE_FLAG` resolution at `:421` and the existence test
  at `:422` with a `dispatch-config-load pause` read. Shape it on the existing
  call-site precedent at `dispatch-auto-merge:65-73` (capture stdout, branch on
  nonzero, then `no-config` check, then `jq -r`), with one critical difference:
  **the error branch must set the paused flag and continue, never `exit 1`**.
  `dispatch-tick` has unconditional duties on the paused branch (reservation
  sweep, frozen-session sweep, stand-down surfacing, stale-hold re-check,
  node-lane drain) that must still run when the config read fails — mirroring
  how the sentinel gate never aborted the tick on an unreadable directory.
  `dispatch-spawn-job:249-256` is the opposite precedent (it aborts); do not
  copy its control flow.
- Resolve the loader robustly: invoke it as `"$SCRIPT_DIR/dispatch-config-load"`
  with the working directory pinned to `$SCRIPT_DIR` (a subshell `cd`), so
  `resolve_project_root` succeeds regardless of the tick's own cwd. Today the
  systemd unit sets `WorkingDirectory=$main_worktree` (`lib.sh:2977`, `:3228`)
  so cwd happens to be inside the repo, but the gate must not depend on that —
  an unresolvable project root would otherwise fail closed and pause the fleet
  permanently. `DISPATCH_CONFIG_DIR`, when set, is honored by the loader itself
  and needs no passthrough logic.
- Preserve the `--manual` override **verbatim**: the migrated condition must
  remain equivalent to `[[ -z "$MANUAL" ]] && <paused>`, with `--manual` still
  overriding a `true` field. `MANUAL` is checked before the config read only if
  that does not change observable behavior; the safest form keeps a single
  combined test as today.
- Parse with `jq -r 'if has("paused") then .paused else empty end'`. Treat a
  jq failure or an empty/non-`true`/non-`false` result as **paused** (belt and
  braces — the validator already guarantees the field, so this branch should be
  unreachable).
- Reword the paused banner at `:527`. It currently reads
  `dispatch-tick: paused (sentinel present at $DISPATCH_PAUSE_FLAG); no scheduling this tick; draining node-lane merge/reconcile only`.
  Keep the leading `dispatch-tick: paused (` substring, and change the
  parenthetical to name the config source and, on a fail-closed read, the reason
  — e.g. `(dispatch.config/pause.json: paused)` and
  `(dispatch.config/pause.json UNREADABLE — failing closed: <loader stderr>)`.
  The fail-closed variant must be distinguishable in the journal from a
  deliberate pause; an operator who cannot tell the two apart cannot repair the
  config.
- Update the pause-related header prose that names the sentinel: `:76`, `:151`,
  `:401-419` (the whole "Pause sentinel" block comment, including "Resume by
  removing the flag file" and "The path is overridable for tests" — both go
  false), `:416`, `:531`. Rename the block heading from "Pause sentinel" to
  something naming the config field. Leave every UNRELATED `sentinel` mention
  alone — `dispatch-tick` also has a headless-liveness sentinel (`:177-198`,
  `:343-377`) and a statements sentinel (`:226-229`) that have nothing to do
  with pause.
- Update the stale forward-reference comment at `dispatch-select-tick:915-924`
  so it states the mechanism as landed rather than pending, keeping its
  spawning-not-bookkeeping point intact.
- **Semantics preserved verbatim**: the field gates worker SPAWNING and
  scheduling only, never reservation-ledger bookkeeping; the paused-branch
  `reservation_sweep` ahead of the `exit 0` is unchanged; the paused-branch
  node-lane merge/reconcile drain (`:531-630`) is unchanged. This split is not
  merely design intent — `tactic-pause-disables-merge-lane` shipped a fix for a
  real regression where pause over-gated that drain, so it is regression-
  sensitive tested behavior. Do not touch the drain.

`.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh` (1458 lines):

- Setup at `:120-126`: replace the `export DISPATCH_PAUSE_FLAG="$TMPDIR_TEST/paused"`
  seam with `export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"` plus
  `mkdir -p "$TMPDIR_TEST/config"`, and update the comment explaining why the
  seam exists (so a real host pause file cannot fire the guard).
- The fixture copies `dispatch-tick` and `lib.sh` into `$TMPDIR_TEST` (`:46-47`).
  Add `cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/dispatch-config-load"`
  and `chmod +x` it, since the migrated gate invokes it via `$SCRIPT_DIR`.
  `lib.sh` is already copied alongside, which is what `dispatch-config-load`
  itself sources.
- Replace all **22** `: > "$TMPDIR_TEST/paused"` fixture writes (`:381, 429, 452,
  484, 498, 517, 541, 560, 577, 598, 621, 659, 685, 719, 741, 1248, 1273, 1303,
  1329, 1408, 1436`, plus the setup line) with a helper that writes
  `{"paused":true}` to `$DISPATCH_CONFIG_DIR/pause.json`. Define the helper once
  near the fixture rather than inlining a printf 21 times.
- Update the teardown var-unset list at `:297` (`DISPATCH_PAUSE_FLAG` →
  `DISPATCH_CONFIG_DIR`).
- Update the **6** banner assertions that grep `'paused (sentinel present'`
  (`:407, 434, 456, 522, 523, 748`) to the new banner substring. `:523` computes
  a line number from the match to assert banner-before-drain ordering — keep
  that ordering assertion working.
- Add new cases: field absent ⇒ NOT paused (tick proceeds to scheduling);
  `{"paused": false}` ⇒ NOT paused; invalid JSON in `pause.json` ⇒ **paused**
  and the fail-closed banner variant printed; `DISPATCH_CONFIG_DIR` pointing at
  a nonexistent directory ⇒ `no-config` ⇒ NOT paused (this is the loader's
  absent-file path, not an error); `--manual` with `{"paused": true}` ⇒ override
  still schedules.

Out of scope: `lib-pause-state.sh` and every instrument (Unit 4); the
`max_concurrent_workers` / `weekly_pace_floor_pct` config; the pace curve and
the `--exhausted` hard floor.

**Recommended model**: opus

**Dependencies**: Unit 2.

## Unit 4 — Migrate the instrument `lib-pause-state.sh` (tri-state preserved)

### Scope

`.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh`:

- Rewrite `dispatch_pause_state`'s body (`:73-100`) to read the config field
  instead of testing sentinel-file existence. Invoke
  `dispatch-config-load pause` as a **subprocess** (never source it — that would
  pull `lib.sh`'s 4241 lines into every instrument caller's shell). Resolve its
  path from the library's own location, captured at source time inside the
  existing `_LIB_PAUSE_STATE_LOADED` guard:
  `_LIB_PAUSE_STATE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"`,
  and run the loader in a subshell `cd`-ed to that directory so
  `resolve_project_root` succeeds regardless of the caller's cwd.
- Map results per the table in Context: `no-config` or `"paused": false` ⇒
  `not-paused`; `"paused": true` ⇒ `paused`; any nonzero exit, missing script,
  or unparseable output ⇒ `unknown`. **Always `return 0`** — the token, not the
  exit code, is the contract.
- Preserve the file's other properties exactly: safe to source multiple times;
  the load guard; `set -uo pipefail` (NOT `set -e` — it must return, never exit;
  `lib-unit-disable-state.sh:119` documents this as a deliberate divergence and
  that note must stay true).
- Rewrite the header (`:1-64`). The parent-directory-searchability explanation
  (`:47-53`) is obsolete and must go. The `Environment:` block (`:54-59`) must
  name `DISPATCH_CONFIG_DIR` instead of `DISPATCH_PAUSE_FLAG`. The
  gate-vs-instrument argument (`:20-29`) is the file's reason for existing and
  must be **kept and updated**, not deleted — it is clarification 172's polarity
  inversion in prose. Replace the `:17-19` "when this tactic lands" sentence
  with a statement that it HAS landed and this file is the single instrument
  read point for the config field.
- Update the `dispatch-tick` cross-reference at `:6-12`, which cites
  "around dispatch-tick:291-292" (already stale; the gate is at `:421-422` today
  and moves again in Unit 3). Cite the gate by its block name rather than a line
  number so it cannot go stale again.

`.claude/skills/dispatch-propagate/scripts/test-lib-pause-state.sh` (83 lines) —
rewrite all four cases onto a scratch `DISPATCH_CONFIG_DIR` fixture modeled on
`test-dispatch-config-load.sh:18-38`:

- `{"paused": true}` ⇒ `paused`, and `dispatch_pause_state` still returns 0.
- `{"paused": false}` ⇒ `not-paused`.
- `pause.json` absent (config dir exists, empty) ⇒ `not-paused`.
- config dir nonexistent ⇒ `not-paused` (loader's absent-file path).
- invalid JSON in `pause.json` ⇒ **`unknown`** (loader exit 1).
- `paused` field missing from a valid object ⇒ **`unknown`** (schema exit 1).
- The root-uid skip at `:68-72` (for the `chmod 000` case) has no analog under a
  JSON field and should be deleted along with that case — replaced by the two
  `unknown` cases above, which are root-invariant. This is a genuine improvement
  in coverage, not a weakened test.

Consumer prose and tests (no functional change to the consumers themselves):

- `dispatch-fleet-watch:163` — the env-var doc line naming `DISPATCH_PAUSE_FLAG`.
- `dispatch-fleet-watch:735` — the `unknown` reason string, which asserts "the
  sentinel's parent directory exists but is not searchable". Reword to name an
  unreadable/invalid `pause.json`. Keep the sentence that follows ("Every
  predicate was evaluated anyway (pause silences nothing when pause itself is
  unreadable)") — that is clarification 172's guarantee.
- `dispatch-fleet-watch:326-336` — the source-and-read block needs no logic
  change; verify the `exit 69` hard-fail path still behaves.
- `test-dispatch-fleet-watch.sh`: the header seam doc at `:16-17`; the env
  passthrough at `:171` (`DISPATCH_PAUSE_FLAG="$PAUSEFLAG"` →
  `DISPATCH_CONFIG_DIR="$PAUSEDIR"` or equivalent); case 3's pause fixture; case
  4 at `:265-280`, whose `chmod 000 "$PAUSEDIR"` becomes "write malformed
  `pause.json`" to produce `unknown`; and **case 17, the DOCTRINE RATCHET at
  `:655-665`**. That ratchet greps `dispatch-fleet-watch`'s source for writes to
  `$DISPATCH_PAUSE_FLAG` and fails if the watcher ever pauses the fleet itself.
  If `DISPATCH_PAUSE_FLAG` disappears, the ratchet's grep passes **vacuously**.
  Retarget its pattern to writes of `pause.json` / `$DISPATCH_CONFIG_DIR` so it
  still fails on a real violation. Prove the retargeted pattern is live by
  temporarily adding such a write and confirming the ratchet reports `no`, then
  removing it.
- `packages/intentionsutil/scripts/read-sensors.ts:1465-1479` — no code change
  (it depends only on the stdout contract, and its `cwd: repoRoot` means
  `resolve_project_root` resolves after the migration). Update any doc comment
  naming "the sentinel path".
- `lib-unit-disable-state.sh:9, :17-21` — the "global pause sentinel"
  cross-reference wording; `:119`'s `set -uo pipefail` divergence note must
  remain accurate.

Out of scope: turning the instrument fail-closed; adding a second reader;
changing any consumer's decision logic.

**Recommended model**: opus

**Dependencies**: Unit 2. Independent of Unit 3, but the two touch adjacent
prose and should land in the same PR.

## Unit 5 — CI enumeration and post-merge sentinel removal

### Scope

CI: `.github/workflows/unit-tests.yml` enumerates `dispatch-propagate` test
scripts individually — its own comment at `:238` states the `test-*.sh` glob is
NOT applied to that directory — and it lists **none** of
`test-dispatch-config-load.sh`, `test-lib-pause-state.sh`,
`test-dispatch-tick.sh`, `test-dispatch-fleet-watch.sh`.

- Add enumerated steps for `test-dispatch-config-load.sh` and
  `test-lib-pause-state.sh` alongside the existing entries (pattern at `:243-291`).
  Both are hermetic: they drive scratch `DISPATCH_CONFIG_DIR` fixtures and need
  no `claude` binary, no network, and no host state.
- Before adding either, run it from a clean environment (`env -i` with only
  `PATH`/`HOME` set) to confirm hermeticity. If a suite turns out to depend on
  host state, do **not** add it and do **not** weaken it — record the specific
  dependency in the PR body as a follow-up. `test-dispatch-tick.sh` and
  `test-dispatch-fleet-watch.sh` are deliberately left out of CI by this unit;
  they are large and spawn-heavy, and adding them is a separate decision.

Post-merge operator step (prose, not code): once the PR is merged and the
migrated gate is live on `main`, delete the now-dead sentinel
`~/.local/share/commons-dispatch/paused`. Verify FIRST that
`dispatch.config/pause.json` still reads `{"paused": true}` and that both
readers report paused (see Verification). Removing the sentinel before the
migrated code is live would resume the fleet.

Out of scope: adding `test-dispatch-tick.sh` / `test-dispatch-fleet-watch.sh` to
CI; any change to `run-unit-tests.sh`'s glob behavior.

**Recommended model**: sonnet

**Dependencies**: Units 2, 3, 4.

## Deferred residue — do NOT edit these from this round

- `intentions/tactic-manual-path-reservation-sweep.md:103` carries a body
  citation of `$XDG_DATA_HOME/commons-dispatch/paused`. That node is at phase
  **main-qa** (the earlier "phase qa" note in this body is superseded; the
  conclusion is unchanged). A body edit trips its own `.scope-fingerprint`
  custody gate and demotes it. Leave it. Once that node reaches `done`, the
  citation can be updated by whoever touches it next; it is historical prose and
  breaks nothing in the meantime.
- These graph bodies also cite the sentinel and will read as history after this
  lands. Record, do not touch: `tactic-fleet-watchdogs-session-scoped` `:243`,
  `:313`, `:670`, `:682`, `:1030`; `tactic-graph-ref-split` `:185`, `:189-190`;
  `tactic-dispatch-config-untracked-pace-curve` `:30`; `tactic-retire-bare-layout`
  `:167`; `tactic-sweep-timer-unit-dir-leak` `:131`; `tactic-heartbeat-sweep-before-pause`
  `:65`, `:91`; and `strategy-recursive-self-improvement` `:2374`
  (`attributes.pause.mechanism` / `.sentinel_path`) — a durable-layer strategy
  record no autonomous lane may edit. The author will want to update that last
  one by hand after cutover; flag it in the PR body.

## Sibling coordination (notes, not `blocked_by` — clarification 140 ruled no hard dependency)

- `tactic-worker-self-close-configurable` (phase `implement`) adds a
  `worker-sessions` type carrying an `auto_close` boolean to the **same**
  `case` statement, the same allowlist, and the same two usage strings. Likely
  textual conflict; whichever lands second inherits the convention rather than
  re-inventing it. If it has already landed when this runs, follow its arm's
  shape.
- `tactic-dispatch-config-template` (phase `implement`) makes `dispatch.config/`
  a symlink into a private instance repo — precisely the dangling-symlink
  failure mode the fail-closed gate exists for. If it lands first, verify the
  gate's exit-2 fail-closed path against the symlinked directory.

## Out of scope (whole tactic)

- Moving `dispatch.config/` to `$XDG_CONFIG_HOME`. The 2026-07-26 round
  **deliberately diverged** from the literal XDG Base Directory Specification;
  `dispatch.config/` stays project-root-resolved with the instance-repo symlink
  convention. That round accepted, on the record, that this change LOWERS the
  repo's literal XDG usage.
- Any change to `max_concurrent_workers` or `weekly_pace_floor_pct`.
- The pace curve's semantics and the `--exhausted` hard floor. (A pace pin to
  target 0 is NOT a substitute for pause: it auto-releases at the weekly window
  roll, and pause is a standing mode that must not silently lift.)
- Keeping `DISPATCH_PAUSE_FLAG` as an operator or compatibility path. It is
  retired entirely; `DISPATCH_CONFIG_DIR` is the sole test seam, matching every
  other config type and matching the precedent set for the sibling toggle
  (a pre-existing env var survives "only as the test seam and never as a second
  operator path" — and here not even that).

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-config-load` — the config
  read path itself: `DISPATCH_CONFIG_DIR` seam (`:339-345`), project-root
  resolution, `no-config` convention (`:349-354`), JSON/schema validation
  (`:358-370`), documented 0/1/2 exit contract (`:19-20`), verbatim JSON print
  (`:777-779`).
- `dispatch-config-load:542-556` (`force-opus` validator arm) — byte-identical
  single-boolean template; also mirrored at `:557+` (`strict-preflight`).
- `dispatch-config-load:209-225` (`force-opus` schema prose) — header block
  template, including its explicit warning against confusing the generic
  absent⇒inert convention with `auto-merge`'s inversion.
- `.claude/skills/dispatch-propagate/scripts/force-opus.example.json` — example
  file shape.
- `.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge:65-73` — the
  call-site pattern for consuming a boolean config type (capture, branch on
  nonzero, `no-config` check, `jq -r`). Adapt the error branch to fail closed
  and continue rather than exit.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:2034` `resolve_project_root`.
- `.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh` — the existing
  tri-state contract and its gate-vs-instrument argument; rewrite the body, keep
  the contract and the reasoning.
- The existing paused branch in `dispatch-tick` (`:422-630`) including its
  `reservation_sweep`, sweeps, and node-lane drain — reuse as-is; only the
  condition and the banner change.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh:18-38`
  (`config_setup`/`config_teardown`) and `:951-1017` (the five-test per-boolean
  block) — fixture and test templates for every new suite case.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` —
  `assert_eq`, `TOTAL`/`PASS`, `report_results`, already used by both pause
  suites.

## Verification

All four suites below must pass. None of them runs in CI today (Unit 5 adds two
of them), so they must be invoked explicitly.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-pause-state.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

The loader must accept the new type and round-trip an explicit `false` (this
fence FAILS today — `pause` is not an accepted type — and passes after Unit 2):

```verify
d=$(mktemp -d)
printf '{"paused": false}' > "$d/pause.json"
out=$(DISPATCH_CONFIG_DIR="$d" .claude/skills/dispatch-propagate/scripts/dispatch-config-load pause)
printf '%s' "$out" | grep -q '"paused": false' || exit 1
printf '{"paused": true}' > "$d/pause.json"
out=$(DISPATCH_CONFIG_DIR="$d" .claude/skills/dispatch-propagate/scripts/dispatch-config-load pause)
printf '%s' "$out" | grep -q '"paused": true' || exit 1
rm -f "$d/pause.json"
out=$(DISPATCH_CONFIG_DIR="$d" .claude/skills/dispatch-propagate/scripts/dispatch-config-load pause)
[ "$out" = "no-config" ] || exit 1
printf 'not json' > "$d/pause.json"
DISPATCH_CONFIG_DIR="$d" .claude/skills/dispatch-propagate/scripts/dispatch-config-load pause && exit 1
rm -rf "$d"
```

The instrument must report the tri-state from the config field (FAILS today —
the helper reads a sentinel file and ignores `DISPATCH_CONFIG_DIR`):

```verify
d=$(mktemp -d)
printf '{"paused": true}' > "$d/pause.json"
s=$(DISPATCH_CONFIG_DIR="$d" bash -c 'source .claude/skills/dispatch-propagate/scripts/lib-pause-state.sh && dispatch_pause_state')
[ "$s" = "paused" ] || exit 1
printf '{"paused": false}' > "$d/pause.json"
s=$(DISPATCH_CONFIG_DIR="$d" bash -c 'source .claude/skills/dispatch-propagate/scripts/lib-pause-state.sh && dispatch_pause_state')
[ "$s" = "not-paused" ] || exit 1
printf 'not json' > "$d/pause.json"
s=$(DISPATCH_CONFIG_DIR="$d" bash -c 'source .claude/skills/dispatch-propagate/scripts/lib-pause-state.sh && dispatch_pause_state')
[ "$s" = "unknown" ] || exit 1
rm -rf "$d"
```

Live-code sentinel residue must be gone. Both fences FAIL today (matches exist
in `dispatch-tick`, `dispatch-select-tick`, `lib-pause-state.sh`, and their
suites) and pass after the migration. They are scoped to live code — the graph
bodies under `intentions/` legitimately retain the historical string and are
deliberately excluded:

```verify
for p in .claude/skills .claude/workflows packages .github; do
  test -e "$p" || { echo "FAIL: verify path missing: $p"; exit 1; }
done
hits=$(LC_ALL=C git grep -an 'commons-dispatch/paused' -- .claude/skills .claude/workflows packages .github); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: live-code references to commons-dispatch/paused remain"; exit 1; }
echo OK
```

```verify
for p in .claude/skills .claude/workflows packages .github; do
  test -e "$p" || { echo "FAIL: verify path missing: $p"; exit 1; }
done
hits=$(LC_ALL=C git grep -an 'DISPATCH_PAUSE_FLAG' -- .claude/skills .claude/workflows packages .github); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: live-code references to DISPATCH_PAUSE_FLAG remain"; exit 1; }
echo OK
```

The four-part loader edit must be complete — the type must appear in all three
lists, have an example sibling, and have a schema prose block (FAILS today):

```verify
test -f .claude/skills/dispatch-propagate/scripts/pause.example.json || exit 1
grep -c 'pause' .claude/skills/dispatch-propagate/scripts/dispatch-config-load || exit 1
sed -n '1,20p' .claude/skills/dispatch-propagate/scripts/dispatch-config-load | grep -q 'pause' || exit 1
grep -q 'Schema: pause.json' .claude/skills/dispatch-propagate/scripts/dispatch-config-load || exit 1
awk '/^case "\$CONFIG_TYPE" in/,/^esac/' .claude/skills/dispatch-propagate/scripts/dispatch-config-load | grep -q 'pause'
```

### Manual checks (judgment / host state — not auto-runnable)

1. **Cutover ordering.** Before merge, confirm
   `/home/n8/natb1/commons.systems/dispatch.config/pause.json` exists and parses
   as `{"paused": true}`. Confirm the sentinel
   `~/.local/share/commons-dispatch/paused` still exists (it is still the live
   gate until merge).
2. **Post-merge, before deleting the sentinel**, from the main checkout:
   - `.claude/skills/dispatch-propagate/scripts/dispatch-config-load pause`
     prints `{"paused": true}` at exit 0.
   - `bash -c 'source .claude/skills/dispatch-propagate/scripts/lib-pause-state.sh && dispatch_pause_state'`
     prints `paused`.
   - `packages/intentionsutil/scripts/read-sensors.ts`'s rsi sensor line reports
     `pause: paused` (it shells the helper with `cwd: repoRoot`).
   - `dispatch-fleet-watch` reports pause-quiet predicates (tick-staleness and
     busy-stall quiet, daemon-liveness still evaluated), not `watch-unknown`.
3. **Then** delete `~/.local/share/commons-dispatch/paused` and re-run the three
   reads in step 2 — all must still report paused, now sourced only from the
   config field. This is the proof that the field is the sole mechanism.
4. **Fail-closed check on the live host** (do this with the fleet already
   paused, so a mistake cannot resume it): temporarily move
   `dispatch.config/pause.json` aside and replace it with invalid JSON, run one
   `dispatch-tick` manually, and confirm it logs the fail-closed banner variant
   and schedules nothing; confirm `dispatch_pause_state` prints `unknown` and
   `dispatch-fleet-watch` still emits (exit 2 / `watch-unknown`), never silently
   passing. Restore the valid file immediately.
5. **`--manual` override**: with `{"paused": true}` in place, confirm an
   explicit `dispatch --manual` run still overrides the pause and reaches
   selection, and that a paused autonomous tick still sweeps the reservation
   ledger and still drains the node lane (a reviewed, green, unparked node-lane
   PR still merges).
6. **Author follow-up**: `strategy-recursive-self-improvement`'s
   `attributes.pause` records `mechanism: sentinel` and a `sentinel_path`. That
   is a durable-layer record no autonomous lane may edit — surface it in the PR
   body so the author can update it to name the config field.
