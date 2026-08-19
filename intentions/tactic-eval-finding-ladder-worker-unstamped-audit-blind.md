---
id: tactic-eval-finding-ladder-worker-unstamped-audit-blind
kind: tactic
statement: Detached dispatch workers are born with no .dispatch-stamp.json
  sidecar, so aggregate-usage.sh --node scans zero files and a whole finished
  phase is unmeasurable — the SessionStart hook does fire and git works, but the
  hook process runs with cwd in the main checkout (branch main), so
  dispatch-stamp-session Mode A worker-branch gate correctly no-ops and every
  git read it takes is from the wrong tree
owner: ai
status: codified
parent: null
rationale: >-
  Auto-created by dispatch-eval-finding as an evaluation finding ledger entry.
  Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.


  (Finalized 2026-08-18 by an /align-tactics per-node round.) Two things changed
  at finalize. FIRST, the recorded root cause was REFUTED and rewritten: the
  drift review captured this very session hook result verbatim, which shows
  SessionStart:startup does fire for detached claude --bg workers and that local
  git works — both uncertainties the hook own header block named as untested
  resolve NEGATIVE. The actual defect is that the hook process does not run in
  the session own working tree, so Mode A reads branch main and no-ops. The
  statement above carries the corrected cause; the body carries the measurement.
  SECOND, serves widened to name the artifact owner honestly: the EVALUATION
  CONTRACT (node-scope measurement, the sidecar sweep trigger) is owned by
  strategy-recursive-self-improvement, while the ARTIFACTS this fix edits — the
  SessionStart hook, dispatch-stamp-session, settings.json hook registration and
  run-unit-tests.sh — are dispatch-surface artifacts owned by
  strategy-graph-native-dispatch. Same split, and same reasoning, as
  tactic-rsi-session-sweep-trigger and tactic-ladder-per-phase-evaluation.
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Is the defect still live at finalize time, and has any sibling already
      fixed it?
    answer: "(Verified 2026-08-18 /align-tactics drift review.) The defect is still
      live and no sibling has fixed it. Measured on this worktree: the newest
      `.dispatch-stamp.json` anywhere under `~/.claude/projects` is dated
      2026-08-14 — the same day this finding was recorded — out of 1682 total,
      with ZERO written in the four days since, so the writer is still stopped
      fleet-wide rather than intermittently failing. `grep -rn
      dispatch-stamp-session .claude/skills --include=SKILL.md` returns exactly
      two call sites (qa-fix/SKILL.md:138, review-fix/SKILL.md:215) and BOTH are
      Mode B (`--backfill-pr`), which assumes a sidecar already exists and
      therefore never mints one; no phase skill carries a Mode A call.
      `.claude/settings.json` still registers only the `startup|resume`
      SessionStart matcher, and `.claude/hooks/stamp-dispatch-session.sh:27-32`
      still carries its own unresolved ESCALATION block prescribing this exact
      fix as 'NOT implemented'. Plan against the fix being wholly unbuilt."
  - question: What does moving the mint off "session birth" cost, given the launcher
      cannot mint on the worker behalf?
    answer: "(Recorded 2026-08-18 /align-tactics drift review.) A worker-side mint
      shifts the sidecar's write moment from 'session birth' to 'phase-skill
      Step 0', which is a real but accepted narrowing of the carrier described
      in condition 13 and clarification 48. The launcher cannot mint:
      `dispatch-graph-execute:210,237,322` spawn every phase worker through
      `dispatch-spawn-job --no-verify`, which skips the registry re-query
      entirely (dispatch-spawn-job:290-320), and `claude --bg` returns no
      structured session id, so the spawning session never learns the child's id
      synchronously — the same limitation `dispatch-ladder-run:119-145` already
      reasoned about and worked around by naming its evaluator by
      node+phase+launch-epoch. The consequence to accept knowingly: a worker
      that dies before reaching its skill's first scripted step stays unstamped,
      so condition 15's counted-skip denominator retains a residual hole for
      very-early-death sessions. This does not gate the fix — it bounds what the
      fix claims."
  - question: Which reading is the acceptance metric for this fix, and which one
      must NOT be used?
    answer: "(Recorded 2026-08-18 /align-tactics drift review.) Do not use
      `window.sidecar_present_rate` as this node's acceptance metric. The hook's
      own header (`.claude/hooks/stamp-dispatch-session.sh:19-26`) names that
      rate as the monitor for this gap, but sibling finding
      tactic-eval-finding-sidecar-monitor-post-filter-self-conceals records that
      aggregate-usage.sh reports `sidecar_eligible: 0` / `rate: null` —
      indistinguishable from 'no workers scanned' — precisely when stamping has
      failed, so the instrument self-conceals in the failing case. Verify
      instead against the direct contract at aggregate-usage.sh:1432-1440: a
      `--node <id>` scan over a stamped ladder-phase session returns non-zero
      `files_scanned`, with the sibling `<stem>.dispatch-stamp.json` carrying
      `node_id == <id>`. Two further scope bounds: this node's own body records
      that align-tactics workers additionally sit in a project directory
      aggregate-usage.sh structurally never scans
      (tactic-eval-finding-align-tactics-worker-transcript-unscanned), so
      align-tactics is the wrong phase to demonstrate the fix on; and with
      dispatch currently paused, live end-to-end confirmation is a deferred
      observe-in-production step — the auto-runnable half is fixture coverage
      following test-dispatch-stamp-session.sh's mktemp-subshell pattern for a
      `tactic-*` branch."
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: unmeasured_phase_price_proxy_usd
      value: 81.94
      unit: usd
      window: tactic-align-review-skill align-tactics 2026-08-14T14:57:37Z/15:13:37Z
      sensor: transcript jq aggregate
      measured: 2026-08-14
    - metric: unmeasured_phase_turns
      value: 314
      unit: assistant turns
      window: tactic-align-review-skill align-tactics 2026-08-14T14:57:37Z/15:13:37Z
      sensor: transcript jq aggregate
      measured: 2026-08-14
    - metric: node_scoped_files_scanned
      value: 0
      unit: files
      window: tactic-align-review-skill align-tactics 2026-08-14T14:57:37Z/15:13:37Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: phase_skills_minting_a_sidecar
      value: 0
      unit: of 7 phase skills
      window: origin/main de347430
      sensor: grep dispatch-stamp-session
      measured: 2026-08-14
    - metric: worktree_sessions_without_sidecar
      value: 13
      unit: of 13 sessions
      window: 2026-08-14 worktree project dirs (indicative, needs fleet-scope
        confirmation)
      sensor: filesystem
      measured: 2026-08-14
    - metric: node_scope_files_scanned
      value: 0
      unit: files
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: fleet_sidecars_written_during_run
      value: 0
      unit: sidecars
      window: 2026-08-14T15:12:03Z..16:54:23Z fleet-wide
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: newest_fleet_sidecar_epoch
      value: 1786736340
      unit: epoch_seconds
      window: fleet-wide as of 2026-08-18; 1682 sidecars total, newest
        2026-08-15T02:19Z
      sensor: filesystem
      measured: 2026-08-18
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Finding: detached workers are born unstamped, so `aggregate-usage.sh --node` sees nothing

## Context

`aggregate-usage.sh --node <id>` is the instrument condition 14 of
`strategy-recursive-self-improvement` mandates, and the sidecar sweep of condition 13 /
clarification 48 keys the whole lane-agnostic evaluator trigger on the same file. Both read
`<transcript-stem>.dispatch-stamp.json` next to a session transcript and match on `.node_id`
(`.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1432-1442`). When that sidecar is missing,
a finished phase is invisible to the instrument: `files_scanned: 0`, `sessions: 0`, and every
per-session lens (`turns`, `peak_context`, `price_proxy_usd`, `hit_ratio`, `outcome`,
`permission_friction`) is unreadable at node scope.

### Recurrence log

- **Recurrence 1–2** (`tactic-attention-per-tier-boost-migration`, `align-tactics` phase,
  2026-08-14). `--node` returned `{files_scanned: 0, sessions: 0, sidecar_eligible: 0,
  sidecar_present: 0}`. Positive control taken before recording the absence: 1681 sidecars existed
  fleet-wide, so the scan path worked; the same document scoped `--session
  adaffcf8-1144-41bf-b038-e0cddc37f89e` returned `files_scanned: 7`; and
  `grep -rl tactic-attention-per-tier-boost-migration ~/.claude/projects
  --include='*.dispatch-stamp.json'` matched nothing. Zero sidecars were written anywhere on the
  machine during the whole 102-minute run — a stopped writer, not a per-node accident.
- **What is lost.** Recovery is only possible via `--session <sid>`, and the ladder never records
  a session id: `dispatch-graph-execute` spawns every phase with `--name <node-id>`
  (`dispatch-graph-execute:210-211,237-238,322-323`), and `dispatch-spawn-job --no-verify` returns
  as soon as the `claude --bg` kick's exit code is known (`dispatch-spawn-job:284-298`), so no
  session id ever propagates back — the same structural limit `dispatch-ladder-run:119-145` already
  records for `spawn_phase_eval`. In recurrence 2 the id was recoverable only because
  `lib-frozen-session-park` happened to print `session=adaffcf8-…` while sweeping an un-reaped
  worker. A phase that reaps cleanly is unmeasurable outright.
- **2026-08-18/19 (this planning session).** The drought is still running: 1682 sidecars exist and
  the newest anywhere is `stamped_at 2026-08-15T02:19Z` — nothing for ~4 days, including for this
  very session, a detached `claude --bg` worker on branch
  `tactic-eval-finding-ladder-worker-unstamped-audit-blind` (its transcript exists at
  `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-eval-finding-ladder-worker-unstamped-audit-blind/259c8e70-….jsonl`
  with no sibling `.dispatch-stamp.json`).

### Root cause — measured, and NOT what this node previously recorded

The node previously recorded the cause as "the SessionStart hook does not mint stamps for
`claude --bg` workers". **That is refuted.** This session's own transcript carries the hook result
verbatim:

```
{"hookName":"SessionStart:startup","hookEvent":"SessionStart","exitCode":0,"durationMs":309,
 "command":"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stamp-dispatch-session.sh",
 "stderr":"dispatch-stamp-session: branch 'main' is not a worker or graph-native branch
           (^[0-9]+- / graph-* / tactic-* / strategy-*); skipping stamp\n"}
```

So:

1. `SessionStart:startup` **does** fire for detached `claude --bg` workers — uncertainty (a) in
   `.claude/hooks/stamp-dispatch-session.sh:9-31` is resolved, negative.
2. Local `git` access works — uncertainty (b) is resolved, negative. Run by hand from this
   worktree, `dispatch-stamp-session --session-id probe-sid --transcript-path /tmp/…/probe.jsonl`
   wrote a correct sidecar (`branch` and `node_id` =
   `tactic-eval-finding-ladder-worker-unstamped-audit-blind`, `repo natb1/commons.systems`,
   `base_sha dcf1baa6…`). The mint primitive is not broken.
3. **The actual defect: the hook process does not run in the session's own working tree.** The
   worker is born with cwd = its worktree (`dispatch-spawn-job` `cd`s into `--cwd` before
   `claude --bg`), but the hook executed with cwd = the *main checkout*, which is on `main`, so
   Mode A's worker-branch gate (`dispatch-stamp-session:211-222`) correctly no-ops. Every git read
   in Mode A — `git rev-parse --abbrev-ref HEAD` (:206), `--show-toplevel` (:247), `rev-parse HEAD`
   (:261), `git remote get-url origin` (:270) — is taken from ambient cwd, which the hook does not
   control. The hook command itself is `"$CLAUDE_PROJECT_DIR"/.claude/hooks/…`, and
   `CLAUDE_PROJECT_DIR` resolved to the main checkout for this worker.
4. It is not a CLI-version regression: a stamped worker session from 2026-08-14
   (`09888b78-…`, `sessionKind: bg`) ran the same version `2.1.231`. The hook's cwd follows the
   launching context, which is exactly why the fix must resolve the tree from the **payload**, not
   from ambient cwd.
5. **Live mis-attribution hazard, not yet realized.** Because the sidecar *path* comes from the
   payload's `transcript_path` while the *content* comes from ambient cwd, a hook running in a main
   checkout that happened to be on a `tactic-*`/`graph-*` branch would mint a sidecar for someone
   else's session carrying the **wrong** `node_id` — worse than absence. Audited 2026-08-18: all
   1682 existing sidecars have `.branch` consistent with their project-dir path, so no
   misattribution has occurred yet.

### Why this went unnoticed for four days

`window.sidecar_present_rate` (`aggregate-usage.sh:1343-1349`) is the monitor the hook header names
as the escalation trigger, but it reports `eligible: 0 / rate: null` in exactly the failure case —
the read-side mirror of this finding, owned by the sibling
`tactic-eval-finding-sidecar-monitor-post-filter-self-conceals`. That sibling is **out of scope
here** and stays filed. Also out of scope and still true:
`tactic-eval-finding-align-tactics-worker-transcript-unscanned` — for the `align-tactics` phase
specifically, minting a sidecar is **necessary but not sufficient**, because that worker's
transcript lives in a project directory `aggregate-usage.sh` structurally never scans.

### Intended outcome

Every detached dispatch worker session — ladder phase, scheduled-tick worker, and the unattended
intervention lanes — is born with a correct `<stem>.dispatch-stamp.json` carrying its own
`node_id`, written mechanically, with a second independent write that catches any session the first
one missed. `aggregate-usage.sh --node <id>` then returns non-zero `files_scanned` for a finished
phase, and the sidecar sweep condition 13 depends on has a real denominator.

### Design — greenfield, and the alternatives that were rejected

**Greenfield: one stamp writer, taking its working tree as an argument, driven only by hooks.**
`dispatch-stamp-session` stops inferring the tree from ambient cwd and takes `--repo-dir`
explicitly (the same lesson already applied to `dump-node.ts --dir`, `validate-graph`'s positional
store, and `graph-commit -C`). The hook resolves the session's real working tree from the payload it
already receives and passes it in. The same hook is bound a second time to `Stop` as an
idempotent-create backstop. No skill prose, no per-lane duplication, no new instrument.

Rejected alternatives (each is what the pre-2026-08-18 record proposed, and each is now refutable):

- **A per-phase-skill scripted mint** — the ESCALATION written into
  `.claude/hooks/stamp-dispatch-session.sh:27-32`. Rejected on two measurements: (i) sandboxed Bash
  cannot write under `~/.claude/projects` (`touch /home/n8/.claude/projects/probe…` →
  `Read-only file system`), so every such call site must remember
  `dangerouslyDisableSandbox: true`, and a forgotten one fails **silently, exit 0**; (ii) it needs
  the same paragraph maintained in 7+ SKILL.md bodies and still misses lanes with no such
  chokepoint (`/rsi`, `dispatch-invalid-state`, `diagnose-main`, `jit-reminder`). The hook path is
  unsandboxed and lane-agnostic; prose is neither.
- **A mint inside `dispatch-context-pack`** (mechanical, one edit, 7 callers) — rejected for the
  same sandbox reason: the script runs inside the sandbox, so the write is denied and no-ops.
- **A launcher-side mint** in `dispatch-spawn-job` / `dispatch-graph-execute` — structurally
  impossible, see the anchors above.
- **Backfilling the ~4 days of unstamped transcripts** — out of scope: `repo`/`base_sha` would be
  fabricated join keys. A `node_id`-only backfill (derivable from the project-dir path) can be
  filed separately if the lost window is ever needed.

No brownfield migration path is required: both flags are additive, the sidecar stays `schema: 1`,
existing sidecars remain valid, and the two Mode B call sites
(`.claude/skills/qa-fix/references/idempotency-preamble.md:9-18`,
`.claude/skills/review-fix/SKILL.md:212-216`) are untouched.

### Execution hazards a fresh session must know

- `.claude/hooks/`, `.claude/skills/`, `.claude/settings.json` are read-only carve-outs under the
  sandbox (`denyWithinAllow`). Edits to those paths need `dangerouslyDisableSandbox: true`; a
  sandboxed write fails `Read-only file system`.
- Committing hook/settings changes can be denied in auto mode (the denial is on the **commit**, not
  the Write). If that happens, park to office-hours — do not work around it.
- Do **not** hand-run the mint against a real session's transcript path while testing; write probe
  sidecars to a temp path so the measurement corpus stays clean.

---

## Unit 1 — `dispatch-stamp-session`: explicit `--repo-dir`, plus `--only-if-absent`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session` only.

- Add `--repo-dir <path>` to the argument loop (the `while [[ $# -gt 0 ]]` block at lines ~78-118,
  same shape as `--session-id`). Empty/absent keeps today's behavior (ambient cwd) so legacy
  callers are unchanged. A supplied value that is not a directory is a caller bug → `exit 2` with a
  clear message (per `.claude/rules/code-style.md`: clear errors, not fallbacks).
- Route every git read through it: lines 206 (`git rev-parse --abbrev-ref HEAD`), 247
  (`git rev-parse --show-toplevel`), 261 (`git rev-parse HEAD`), 270 (`git remote get-url origin`)
  become `git -C "$REPO_DIR" …` with `REPO_DIR="${REPO_DIR:-.}"`. Keep each existing
  no-op-and-exit-0 guard exactly as it is — those implement the documented
  never-block-session-start discipline (header note at lines 60-64).
- Add `--only-if-absent` (Mode A only): if the resolved sidecar path
  `${TRANSCRIPT_PATH%.jsonl}.dispatch-stamp.json` (line 283) already exists, exit 0 immediately
  without re-deriving anything. This protects the birth-time `base_sha` the audit joins on and makes
  the flag a true create-if-missing. Combining it with `--backfill-pr` is incoherent → `exit 2`,
  matching the existing mode-mixing guard at lines 122-128.
- Update the header usage block (lines 1-70) to document both flags, including the sentence that
  `--repo-dir` is the caller-supplied working tree because a hook process does not necessarily run
  in the session's own tree.

**Out of scope.** The sidecar schema (stays `schema: 1`), the worker-branch gate at 211-222, Mode B,
`aggregate-usage.sh`, and any call site.

**Tests.** Extend `.claude/skills/dispatch-propagate/scripts/test-dispatch-stamp-session.sh` using
its existing per-case subshell + `mktemp -d` + fake-git-repo fixture (pattern at lines 22-45; it
sources `dispatch-test-fixture.sh` and needs no `setup()` copy). New cases:
(a) `--repo-dir "$d"` invoked from a *different* cwd stamps `$d`'s branch/`base_sha`/`repo`;
(b) `--repo-dir` on a `tactic-<x>` branch yields `node_id == "tactic-<x>"` and `issue == null`;
(c) `--repo-dir /nonexistent` exits 2;
(d) `--only-if-absent` over an existing sidecar leaves it byte-identical (assert a pre-set `.pr` and
`.base_sha` survive) and exits 0;
(e) `--only-if-absent` with no sidecar writes one;
(f) `--only-if-absent --backfill-pr 5` exits 2.

**Recommended model.** sonnet.

## Unit 2 — the hook resolves the session's own worktree, and gains a `Stop` backstop

**Scope.**

`.claude/hooks/stamp-dispatch-session.sh`:

- Parse `hook_event_name` and `cwd` from the payload next to the existing `session_id` /
  `transcript_path` reads (lines 36-38), using the same `printf '%s' "$STDIN_JSON" | jq -r …`
  idiom — never `echo "$VAR" | jq` (`.claude/rules/shell-json.md`, mechanically linted).
- Resolve `SESSION_DIR` in this order, logging one short stderr line naming which source won (the
  transcript records hook stderr, which is how this defect was finally diagnosed):
  1. **Primary — from `transcript_path`.** The transcript lives at
     `~/.claude/projects/<encoded-cwd>/<sid>.jsonl`, where `<encoded-cwd>` is the session's absolute
     cwd with every non-alphanumeric character replaced by `-`. Verified 2026-08-18:
     `printf '%s' /home/n8/natb1/commons.systems/.claude/worktrees/<node-id> | sed 's/[^A-Za-z0-9]/-/g'`
     reproduces the live directory name exactly. Encode each candidate — `$CLAUDE_PROJECT_DIR` and
     every directory matching `"$CLAUDE_PROJECT_DIR"/.claude/worktrees/*` (a plain glob; no
     `git worktree list` needed, and all worktrees live there per `.claude/rules/sandbox.md`) — and
     compare to `basename "$(dirname "$TRANSCRIPT_PATH")"`. A subagent transcript sits one level
     deeper (`<projdir>/<sid>/…`), so on no match retry once with the grandparent directory name;
     do not walk further.
  2. **Fallback — payload `.cwd`**, when non-empty and a directory.
  3. **Fallback — process cwd** (today's behavior), so nothing regresses for callers whose cwd is
     already right.
- Pass `--repo-dir "$SESSION_DIR"` to the stamp invocation at line 53.
- When `hook_event_name == "Stop"`, also pass `--only-if-absent`.
- Rewrite the header block at lines 9-31: uncertainties (a) and (b) are **resolved, both negative**
  — record the measurement (the hook fires for detached `--bg`; git works; the failure was ambient
  cwd landing in the main checkout on `main`). Replace the ESCALATION paragraph with what is now
  implemented (the `Stop` backstop) and with one sentence on why a per-phase-skill prose mint is not
  the fix (`~/.claude/projects` is read-only to sandboxed Bash, so such a call fails silently at
  exit 0). Keep the MONITOR paragraph, adding that `sidecar_present_rate` self-conceals when
  stamping fails — cross-reference `tactic-eval-finding-sidecar-monitor-post-filter-self-conceals`.

`.claude/settings.json`: add the same hook as a second entry under the existing `Stop` block
(lines 101-110, beside `dispatch-stop.sh`). Leave the `SessionStart` entry (lines 111-121)
unchanged. `Stop` firing in detached workers is verified (a 2026-08-14 bg worker transcript carries
`"hookName":"Stop"` with `dispatch-stop.sh` output), and it fires on every turn yield — which is why
`--only-if-absent` must short-circuit on the file-exists check before any git work.

New `.claude/hooks/test-stamp-dispatch-session.sh`, modeled on `.claude/hooks/test-worktree-remove.sh:1-40`
(stub binaries on `PATH`, `mktemp -d` fixtures, assertions on side effects, no network). Cases:

- SessionStart payload whose `transcript_path` encodes a worktree, with the hook's **process cwd
  set to a fake main checkout on `main`** → a sidecar is written carrying the *worktree's* branch
  and `node_id`. This is the exact regression being fixed; it must fail against the pre-fix hook.
- Unknown project dir → falls back to payload `.cwd`.
- Neither resolves → falls back to process cwd (legacy behavior preserved).
- `hook_event_name: "Stop"` with an existing sidecar → sidecar unchanged byte-for-byte.
- `hook_event_name: "Stop"` with no sidecar → sidecar created.
- Missing `session_id` / `transcript_path`, and a non-executable stamp script → exit 0, no crash.

**Out of scope.** `dispatch-stop.sh`; `dispatch-spawn-job` / `dispatch-graph-execute` / the ladder;
backfilling historical transcripts; the sidecar schema.

**Dependencies.** Unit 1 (the hook passes flags Unit 1 introduces).

**Recommended model.** opus.

## Unit 3 — run the hook test suites in CI

**Scope.** `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh` only. Today no runner ever
executes `.claude/hooks/test-*.sh`, so Unit 2's regression test would never run again after the PR —
the same silent-decay shape as the finding itself. Add, mirroring the existing `--file-issue-scripts`
bucket verbatim:

- `RUN_HOOK_SCRIPTS=false` beside the other flags (line 17) and a `--hook-scripts` case in the
  option parser (mirroring lines 48-55);
- `.claude/hooks/*) RUN_HOOK_SCRIPTS=true ;;` in the changed-file `case` (beside line 90);
- a loop over `"$REPO_ROOT/.claude/hooks"/test-*.sh` mirroring the file-issue loop (lines 224-247),
  appending `hook-scripts` to `FAILURES`;
- the new flag in the usage string (line 59) and in the "no suites matched" guard (line 246-249).

Measured baseline 2026-08-18 — all three existing hook suites are hermetic (they stub `git`,
`claude`, `pgrep`; no network, no live daemon) and green: `test-approve-workflow-commands.sh` 67/67,
`test-statusline.sh` 16/16, `test-worktree-remove.sh` 70/70. The bucket therefore imports no flakes.

**Out of scope.** `.github/workflows/*` (CI already invokes `run-unit-tests.sh`), and skill-level
test discovery generally.

**Dependencies.** Unit 2 (so its new suite is inside the bucket when it lands).

**Recommended model.** sonnet.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session:1-70,205-327` — the ONE sidecar
  writer. Mode A already resolves `node_id` correctly for a branch that *is* a node id
  (`else # The branch IS a node id`, ~line 255) and is idempotent w.r.t. `pr`/`base_sha`. Never
  re-derive repo/branch/`base_sha`/`node_id` anywhere else.
- `.claude/hooks/stamp-dispatch-session.sh:33-53` — the existing caller shape (stdin JSON → stamp
  script → always exit 0). Extend it; do not add a parallel hook.
- `.claude/hooks/worktree-remove.sh:61` (`for field in worktree_path path cwd`) and
  `.claude/hooks/statusline.sh:20,50-53` (`.workspace.current_dir` + `git -C "$cwd_raw"`) — existing
  precedent in this repo for taking a directory out of a hook payload and running git against it
  with `-C`.
- `.claude/hooks/test-worktree-remove.sh:1-40,142-146` — the hermetic hook-test fixture (stub `git`,
  stub `claude` via `CLAUDE_AGENTS_CMD`, `run_hook <payload> [cwd]`), to copy for the new suite.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-stamp-session.sh:1-45` — the subshell +
  `mktemp -d` + real-tiny-git-repo fixture for Unit 1's cases.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:17,48-55,90,224-247` — the bucket
  pattern Unit 3 mirrors.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1432-1442` (node scoping) and `:1343-1349`
  (`window.sidecar_eligible` / `sidecar_present` / `sidecar_present_rate`) — the consumer and the
  monitor. **No change needed in either**: Mode A already emits exactly the shape `--node` matches,
  which is why the fix is "make the mint fire in the right tree", not "change what is written".
- `.claude/skills/dispatch-propagate/scripts/dispatch-open-pr:64,229` — the established call shape
  for invoking `dispatch-stamp-session` from another script (stderr-only, `|| true`, never fatal).
- Do **not** add a `source` line to `.claude/skills/dispatch-propagate/scripts/lib.sh`; it must stay
  copyable alone (a prior new `source` there turned ~17 fixtures red in CI while green locally).

## Verification

Auto-runnable:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-stamp-session.sh
```

```verify
.claude/hooks/test-stamp-dispatch-session.sh
```

```verify
.claude/hooks/test-approve-workflow-commands.sh
```

```verify
.claude/hooks/test-statusline.sh
```

```verify
.claude/hooks/test-worktree-remove.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --hook-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / observe-in-production (judgment, and **post-merge only**):

- **The live check cannot run from the branch.** Measured 2026-08-18: a detached worker's hooks —
  both the registration in `settings.json` and the hook file itself — are loaded from
  `$CLAUDE_PROJECT_DIR`, which resolved to the **main checkout** even though the session's cwd was
  its own worktree. The branch copy of `.claude/hooks/stamp-dispatch-session.sh` is therefore never
  what runs. Route the end-to-end confirmation through the needs-main / main-qa lane rather than
  claiming it during the PR.
- **Post-merge probe.** From the main checkout with `dangerouslyDisableSandbox: true` (the daemon
  socket is unreachable inside the sandbox's network namespace), spawn a throwaway worker into any
  existing node worktree:
  `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job --no-verify --name stamp-probe --cwd <abs worktree path> 'Reply with ok and stop.'`
  Then assert a sidecar appeared beside that session's transcript
  (`find ~/.claude/projects -maxdepth 2 -name '*.dispatch-stamp.json' -newermt '-10 minutes'`) and
  that `jq -r .node_id` on it equals the worktree's node id — not `main`, and not some other node.
- **Instrument check.** For that node id,
  `.claude/skills/rsi-audit/scripts/aggregate-usage.sh --node <node-id> --json-out <tmp>` must
  report `window.files_scanned > 0` and a non-null `window.sidecar_present_rate`. Both are the exact
  figures that read `0` / `null` in every recurrence above, so this is the finding's own acceptance
  test.
- **Backstop caveat to eyeball once.** When `SessionStart` is missed and the `Stop` binding creates
  the sidecar, `base_sha` is HEAD at the first turn yield rather than at birth. In practice the
  first `Stop` fires within the first turn, so drift is small — but `base_sha` is documented as the
  birth-time join key (`.claude/skills/rsi-audit/otel-trial-notes.md:54-58`). On the first
  backstop-written sidecar observed in the wild, confirm nothing downstream treats it as
  authoritative session-start ground truth; if something does, file a follow-up rather than
  widening this PR.
- **Confirm the mis-attribution hazard stayed closed.** Re-run the 2026-08-18 audit (encode each
  sidecar's `.branch` and check it is a substring of its project-dir name) over the post-fix window;
  it must stay at zero mismatches.
