---
id: tactic-decision-log-append-noncompact-corruption
kind: tactic
statement: decision_log_append appends whatever JSON string a caller hands it
  verbatim, so dispatch-invalid-state/SKILL.md Step 7's instruction to build the
  record with jq -n (no -c) produces pretty-printed multi-line JSON that lands
  in routing-decisions.jsonl as multiple physical lines, breaking the JSONL
  one-object-per-line contract and intermittently tripping
  dispatch-fleet-watch's tick-staleness reader into a false watch-unknown fleet
  alarm
owner: ai
status: codified
parent: null
rationale: Root-caused during the /align-tactics
  tactic-fleet-alarm-watch-unknown session (2026-08-05/06) investigating a fired
  watch-unknown alarm reporting "last decision-log line has no parseable .ts".
  Direct inspection of
  $HOME/.local/share/commons-dispatch/routing-decisions.jsonl found lines
  10956-10969 hold a single JSON object pretty-printed across 14 physical lines
  instead of one compact line. The field set matches exactly the payload
  dispatch-invalid-state/SKILL.md Step 7 (lines 263-268) instructs a session to
  hand-build with `jq -n` (no -c flag) -- jq -n pretty-prints by default.
  decision_log_append (lib-decision-log.sh:76-108) does not validate or compact
  its input before appending via printf, so the multi-line string landed
  verbatim as multiple JSONL lines, permanently corrupting the log at that
  position (append-only, never rewritten). tail -n 1 caught one fragment of that
  block as the newest line at watch time, which jq cannot parse -- the actual
  trigger for the fleet alarm. The scripted callsite
  dispatch-invalid-state-route:522-542 already uses jq -c -n and is not
  implicated. Per tactic-fleet-alarm-node-park-clobber-loop's own doctrine, this
  is filed as its own new tactic rather than as any write to the alarm node
  itself, which the align-tactics session made no graph write to.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-decision-log-append-noncompact-corruption
  pr: 3061
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T12:55:13Z
    mergeCommitSha: efde7eebd7866eac9f83a153e00889866bdfe1aa
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: "residue item 15 (silent-drop tradeoff acceptance) is WAIT: the
    acceptance criterion is absence of operator friction from
    decision_log_append's silent-drop-on-invalid-input behavior in production,
    an event that has not had time to occur or fail to occur yet -- PR #3061
    merged 2026-08-10T12:55:13Z, so no production window has elapsed; earliest
    useful re-check is after roughly 2 weeks of production dispatch-tick
    activity (~2026-08-24), reviewing routing-decisions.jsonl and
    dispatch-fleet-watch alarm history for any sign a malformed decision-log
    payload silently vanished and caused operator confusion or a missed
    audit-trail entry"
  since: 2026-08-10
  recommendation: no author decision needed at this time -- re-selection only,
    once the production window above has elapsed
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
## Context

`dispatch-fleet-watch`'s tick-staleness predicate (`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:354-359`) reads the newest routing decision with `tail -n 1 "$DECISION_LOG_FILE" | jq -r '.ts'`. If that line has no parseable `.ts`, it reports `V_TICK=unknown` rather than a false "clear" — deliberately conservative, per the predicate's own design (see the sibling node `tactic-fleet-alarm-watch-unknown`'s body: "An unreadable input is reported as UNKNOWN, never as clear"). On 2026-08-05 this fired for real and minted a `watch-unknown` fleet alarm.

Root-caused during the `/align-tactics tactic-fleet-alarm-watch-unknown` session that investigated the alarm (2026-08-05/06): `$HOME/.local/share/commons-dispatch/routing-decisions.jsonl` is a JSONL file — one compact JSON object per line — but lines 10956–10969 of the live log hold a *single* JSON object **pretty-printed across 14 physical lines** (`{`, then one `"key": "value"` per line, then `}`). `tail -n 1` at the moment that entry was the newest line therefore returned one fragment line (observed: literally `}`), which `jq` cannot parse as an object — exactly the "no parseable .ts" condition. The condition was already transient by the time this was investigated (later entries had since been appended, so the file's *current* last line parses fine), which is why re-running the predicate by hand no longer reproduces it — but the malformed 14-line block is permanent in the log (append-only, never rewritten), and the same *class* of corruption can recur any time a caller repeats the mistake below, transiently tripping this alarm again whenever the bad entry happens to be the newest line at watch time.

The malformed entry's field set (`lane`, `kind`, `node`, `dead_session`, `dead_job`, `classification`, `act`, `reap_verdict`, `followup_node`, `followup_state`, `cause_slug`, `disposition`) matches exactly the payload `.claude/skills/dispatch-invalid-state/SKILL.md` Step 7 (lines 263–268) instructs an interactive session to hand-build: "One record via `decision_log_append` ..., built with `jq -n`: node id, dead `sid`/`jid`, classification, act taken, reap verdict, follow-up node id and its mint/update state, and the declared disposition." `jq -n` pretty-prints by default (no `-c`/`--compact-output`), so a session following that instruction literally produces multi-line JSON. `decision_log_append` (`.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:76-108`) does not validate its input — it appends whatever string it is handed verbatim via `printf '%s\n' "$json" >> "$DECISION_LOG_FILE"` (lines 97 and 102, one per flock/no-flock branch) — so the multi-line string landed in the log exactly as multiple physical lines, corrupting the JSONL contract.

The scripted call site in the same lane, `dispatch-invalid-state-route`'s `_log_decision` (`.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-route:522-542`), already builds its JSON with `jq -c -n` (line 525) and is not implicated — this is specific to the hand-authored path in SKILL.md Step 7, composed with the shared writer's lack of a compact-output guarantee. This is a distinct, narrowly-scoped defect from the already-tracked `tactic-fleet-alarm-node-park-clobber-loop` (which is about the router wrongly emitting `tactic-fleet-alarm-*` nodes as `/align-tactics` candidates) — do not conflate the two.

Fix both the immediate instruction (so the documented path stops producing bad output) and the shared writer (so no caller — this one, a future one, or an ad-hoc interactive one — can corrupt the log this way again, per this repo's push-validation-into-the-shared-library convention).

1. **Fix the SKILL.md instruction to request compact output explicitly**

   - Scope: `.claude/skills/dispatch-invalid-state/SKILL.md`, Step 7 (around lines 263–268). Change "built with `jq -n`" to explicitly require compact single-line output — e.g. "built with `jq -nc`" (or "`jq -n --compact-output`") — so a session following the instruction literally cannot reproduce this corruption. Out of scope: any other Step in this SKILL.md, and any other decision-log callsite (the scripted ones already use `-c`, confirmed by grep during planning: `dispatch-invalid-state-route:525` uses `jq -c -n`).
   - Recommended model: sonnet.
   - Dependencies: none.

2. **Make `decision_log_append` guarantee single-line output regardless of caller input (defense in depth)**

   - Scope: `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh`, function `decision_log_append` (lines 76–108). Before each `printf '%s\n' "$json" >> "$DECISION_LOG_FILE"` (lines 97 and 102), canonicalize the caller's `$json` through `jq -c .` and use the canonicalized result in the `printf`. If `jq -c .` fails (the caller handed non-JSON, or something unparseable), drop the append silently — consistent with the function's existing documented contract that it is non-fatal and "ALWAYS returns 0" on any internal failure (see the header comment above the function and the `2>/dev/null || true` / `return 0` already in place). Do this once, reused by both the flock and no-flock branches, rather than duplicating the `jq -c` call at each `printf` site.

     This does not conflict with the file's own "no read/parse path here by design" note (header comment, around line 33: "The decision log is WRITE-ONLY through this helper... There is no read/parse path here by design"). That note scopes what the helper does with the *log file* (it never reads back prior entries to parse them) — it says nothing about validating the *argument* passed in on each call, which is what this unit adds. Note this distinction inline as a comment at the new `jq -c` call so a future reader does not mistake it for reopening that boundary.

     Also update the header's caller-contract line (line 8, "Callers build a complete JSON object with `jq -n`/`jq -c` and hand the string to `decision_log_append`") to state that `decision_log_append` itself now guarantees single-line, valid-JSON output on disk regardless of whether the caller passed compact or pretty JSON — callers may still use either `jq -n` or `jq -nc`, since the helper normalizes either way, but non-JSON input is now silently dropped rather than corrupting the log.
   - Recommended model: sonnet.
   - Dependencies: none (independent of unit 1; either order, may land in the same commit).

## Reuse

- `dispatch-invalid-state-route:525`'s `jq -c -n ... '{...}'` invocation is the existing correct pattern for unit 1's SKILL.md wording — cite it as the reference, don't invent new phrasing.
- Reuse the existing non-fatal-failure idiom already in `decision_log_append` (the outer `{ ... } 2>/dev/null || true` block and `return 0`) for unit 2's `jq -c .` failure path — no new error-handling mechanism needed.
- `test-lib-standdown-recheck.sh` and `test-lib-frozen-session-park.sh` are the templates for unit 2's test: they `source dispatch-test-fixture.sh`, override the relevant env var (`DISPATCH_DECISION_LOG_FILE` here, already supported by `lib-decision-log.sh:63`), and assert on file contents written to a scratch dir — follow the same shape for a new `test-lib-decision-log-compact.sh`. `run-unit-tests.sh` (lines ~190) globs `test-*.sh` in the scripts directory automatically, so a new file needs no separate registration.

## Verification

Manual: re-read `.claude/skills/dispatch-invalid-state/SKILL.md` Step 7 after unit 1 and confirm the instruction now reads `jq -nc` or `jq -n --compact-output` (not bare `jq -n`).

```verify
# Unit 2 regression: decision_log_append must never write more than one
# physical line per call, even when handed pretty-printed JSON.
set -euo pipefail
SCRIPT_DIR="$(cd .claude/skills/dispatch-propagate/scripts && pwd)"
TMP_LOG_DIR="$(mktemp -d)"
export DISPATCH_DECISION_LOG_DIR="$TMP_LOG_DIR"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-decision-log.sh"

PRETTY_JSON=$(jq -n '{ts: "2026-01-01T00:00:00Z", site: "test", node: "tactic-x"}')
decision_log_append "$PRETTY_JSON"

LINE_COUNT=$(wc -l < "$DECISION_LOG_FILE")
if [[ "$LINE_COUNT" -ne 1 ]]; then
  echo "FAIL: expected 1 line, got $LINE_COUNT" >&2
  exit 1
fi

LAST_TS=$(tail -n 1 "$DECISION_LOG_FILE" | jq -r '.ts // empty')
if [[ "$LAST_TS" != "2026-01-01T00:00:00Z" ]]; then
  echo "FAIL: appended line did not round-trip through jq: $LAST_TS" >&2
  exit 1
fi

echo "OK: pretty-printed input normalized to one compact line"
rm -rf "$TMP_LOG_DIR"
```

Also run the existing suite once unit 2 lands, to confirm no regression in rotation/concurrency behavior:

```verify
.claude/skills/dispatch-propagate/scripts/test-decision-log-isolation.sh
```
