---
id: tactic-terminal-disposition-sweep-park-without-cas
kind: tactic
statement: "lib-frozen-session-park's sweeps invoke park-node with no --base CAS
  token, so their already-parked guard is a bare read-then-write: a specific
  office_hours park that lands between the guard and the write is silently
  overwritten with generic boilerplate, destroying the author-facing reason and
  recommendation an office-hours reviewer needs"
owner: ai
status: codified
parent: null
rationale: "CONFIRMED 2026-08-04 by direct diff, with a line-level root cause.
  THE DEFECT: both sweeps in
  `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` gate on
  an `already parked` check (step (8), `:487-495` and `:995-1001`) that reads
  `git show origin/main:intentions/<id>.md` and skips the candidate when
  `office_hours` is non-null. That guard is correct in shape but ADVISORY ONLY,
  because the write it guards passes no compare-and-swap token: the call sites
  build `park_args+=(\"$name\" \"$reason\" \"$recommendation\")` (step (12), and
  `:524` in the frozen sweep) and invoke `park-node` WITHOUT `--base`.
  `park-node` without `--base` sets `office_hours` unconditionally, so any park
  that lands in the window between the guard's read and the sweep's write is
  overwritten rather than refused. THE EVIDENCE: four clobbers on `origin/main`
  in the four days to 2026-08-04, each a specific park immediately followed by a
  generic `session ended without declaring a disposition` park on the same node
  -- `tactic-attention-surface-graph-read` (specific 1c09ccf1, clobbered 351s
  later), `tactic-explicit-node-reservation-sweep-policy` (ac4c24f7, 441s),
  `tactic-office-hours-select-fresh-main` (69cf82b3, 809s), and
  `tactic-test-decision-log-prod-leak` (754c2916, 28817s -- the long gap is a
  legitimate later re-park, not this race). `git diff ac4c24f7 bc1a2df4 --
  intentions/tactic-explicit-node-reservation-sweep-policy.md` shows both
  `reason` and `recommendation` replaced wholesale. THE CONSEQUENCE: the
  replacement text instructs the reader to `Read the session's transcript or
  attach the held job` -- but the sweep only fires on sessions that are already
  terminal, and the reap that follows deletes the job dir, so the boilerplate
  points at evidence the same lifecycle destroys. What is lost is precisely the
  author-decision content office-hours exists to consume. WHY IT COMPOUNDS: the
  sweep only ever sees these nodes because `qa-main`'s WAIT-park path and
  `qa-fix` never call `mark-node-terminal` (tracked as
  tactic-qa-fix-node-terminal-declaration), so the session never declares a
  disposition, `dispatch-self-close` holds it, and the sweep adopts it as a
  candidate. That gap supplies the candidates; this defect turns each one into
  data loss. Distinct from tactic-self-close-reap-silent-noop, which is about a
  reap that declines silently, not a park that overwrites. NOT A NEW DOCTRINE:
  the repository already specifies the correct shape in the diagnosis-time
  compare-and-swap reference -- capture each node's base blob at diagnosis time
  and pin it through `park-node --base`, routing an exit-3 stale-diagnosis
  refusal back to re-diagnosis. These sweeps predate or bypass that contract."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.03
  rationale: >-
    Bug-ledger tracking node under the standing priority order (token-efficiency
    first, bug-ledger second). Boost 12 matches the other bug-ledger nodes in
    this cluster; re-simulated over the live store after writing to confirm 0
    tier changes and 0 value drift onto non-target nodes.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 12 to 0.03 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-terminal-disposition-sweep-park-without-cas
  pr: 3042
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T16:48:30Z
    mergeCommitSha: 4725a16b61ab48921c0a74aa5d3bc9ae4ac26e82
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 12
---
# lib-frozen-session-park's sweeps invoke park-node with no --base CAS token, so their already-parked guard is a bare read-then-write: a specific office_hours park that lands between the guard and the write is silently overwritten with generic boilerplate, destroying the author-facing reason and recommendation an office-hours reviewer needs

## Context

**The defect.** Both sweeps in
`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` gate on an
"already parked" check that reads `git show origin/main:intentions/<id>.md` and
skips the candidate when `office_hours` is non-null —
`frozen_session_sweep` step (8) at `:486-496`, and
`terminal_without_disposition_sweep` step (8) at `:995-1005`. That guard is
correct in shape but **advisory only**, because the write it guards passes no
compare-and-swap token: the call sites invoke `park-node` with positionals only
(`:522-524` in the frozen sweep; `park_args` built at `:1102-1109` in the
terminal sweep), with no `--base`. `park-node` without `--base` sets
`office_hours` unconditionally, so any park that lands in the window between the
guard's read and the sweep's write is **overwritten rather than refused**.

**The evidence (CONFIRMED 2026-08-04 by direct diff).** Four clobbers on
`origin/main` in the four days to 2026-08-04, each a specific park immediately
followed by a generic `session ended without declaring a disposition` park on
the same node:

| node | specific park | gap to clobber |
|---|---|---|
| `tactic-attention-surface-graph-read` | `1c09ccf1` | 351s |
| `tactic-explicit-node-reservation-sweep-policy` | `ac4c24f7` | 441s |
| `tactic-office-hours-select-fresh-main` | `69cf82b3` | 809s |
| `tactic-test-decision-log-prod-leak` | `754c2916` | 28817s (the long gap is a legitimate later re-park, not this race) |

`git diff ac4c24f7 bc1a2df4 -- intentions/tactic-explicit-node-reservation-sweep-policy.md`
shows both `reason` and `recommendation` replaced wholesale.

**The consequence.** The replacement text instructs the reader to "Read the
session's transcript or attach the held job" — but the sweep only fires on
sessions that are already terminal, and the reap that follows deletes the job
dir, so the boilerplate points at evidence the same lifecycle destroys. What is
lost is precisely the author-decision content office-hours exists to consume.

**Why it compounds.** The sweep only ever sees these nodes because `qa-main`'s
WAIT-park path and `qa-fix` never call `mark-node-terminal` (tracked as
`tactic-qa-fix-node-terminal-declaration`), so the session never declares a
disposition, `dispatch-self-close` holds it, and the sweep adopts it as a
candidate. That gap supplies the candidates; this defect turns each one into
data loss. Distinct from `tactic-self-close-reap-silent-noop`, which is about a
reap that declines silently, not a park that overwrites.

**Why the recorded "no pin needed" carve-out is wrong, and must be reversed.**
Two places in the repo currently assert these exact two sweeps do NOT need a
`--base` pin, reasoning that the guard-to-write gap is "a handful of
subprocesses":

- `.claude/skills/ref-diagnosis-time-cas/SKILL.md:18-24` ("NOT needed for
  immediate mechanical parks … e.g. `dispatch-tick`'s `frozen_session_sweep`
  and `terminal_without_disposition_sweep`").
- The inline comment at `lib-frozen-session-park.sh:506-509` ("No … `--base`
  (there is no diagnosis/execution gap to pin — park-node's own fresh
  origin/main re-read is the correct guard here)").

That reasoning is contradicted by the four confirmed clobbers above (gaps
351s–809s) and by the sweep loop structure, re-verified this round:

1. Each sweep does a **lazy fetch ONCE per sweep** (step (6), `if (( fetched ==
   0 ))` — `:466-469` and `:974-977`), then loops over N candidates.
2. Each candidate's guard read (`git show origin/main:…`, `:474` and `:982`) is
   served from that **single** fetch — it is never re-fetched per candidate.
3. Each candidate's `park-node` invocation is wall-clock-bounded by
   `park_timeout` (default 120s) and can itself block for tens of seconds on a
   contended graph-commit landing lock (`GRAPH_COMMIT_LOCK_WAIT_SECONDS`,
   default 60s here).

So as the loop advances, elapsed wall-clock since the one sweep-start fetch
compounds: by the time a later candidate's guard read is evaluated,
`origin/main` as read by `git show` is not current — it is whatever that single
fetch captured, potentially minutes stale. `park-node`'s OWN internal fetch (its
`FRESH_BLOB` resolution, `packages/intentionsutil/scripts/park-node:201-213`)
**is** genuinely fresh at write time, but `park-node` has no "already parked"
check of its own — it unconditionally overwrites `office_hours` on whatever it
reads at `FRESH_BLOB`. The guard's stale verdict ("not parked, as of the sweep's
one fetch") therefore survives all the way to an unconditional write. That is
exactly the clobber. Leaving either doc claim uncorrected would misdirect a
future reader back toward the no-pin design this round deliberately reverses.

**Greenfield design, and why it is a small change.** The correct shape is the
one the repo already specifies: capture the node's base blob **at the same read
that made the skip/park decision**, and pin it through `park-node --base`,
routing an exit-3 `stale-diagnosis` refusal back to re-diagnosis rather than to
a retry-without-base. `park-node` already implements that contract end to end
(read in full this round):

- `--base` accepts a bare 40-hex blob sha, an `<id>=<sha>` pair, or a manifest
  file (`park-node:118-193`); `--base ''` is a hard usage error (exit 2), never
  a silent degradation to an unpinned park.
- It resolves `PINNED_BASE` **before** any network call, fetches `origin/main`,
  resolves `FRESH_BLOB` via `git rev-parse "origin/main:intentions/$NODE_ID.md"`
  (`:205`), and **exits 3 with `stale-diagnosis` on stderr before any mutation**
  if `PINNED_BASE != FRESH_BLOB` (`:218-221`). Nothing is written, nothing to
  roll back.
- `clear-park` (`packages/intentionsutil/scripts/clear-park`) mirrors the same
  contract and already exists on `origin/main`. It is **not** called by either
  in-scope sweep, so no `clear-park` call site is touched here.

So the whole implementation is **caller-side, in one file**: resolve the blob
sha at each sweep's per-candidate guard read using the same `git rev-parse`
expression `park-node` itself uses (so the two values are bit-for-bit
comparable), and thread it into the existing `park-node` call as
`--base "<name>=<blobsha>"`. No new CAS logic, no new git plumbing, no change to
`park-node`.

**No brownfield migration path is needed.** The change is backwards-compatible
in both directions (an unpinned `park-node` call still works; a pinned one only
adds a refusal), it lands in a single PR, and there is no persisted state to
migrate. A CAS refusal is a *correct* new outcome, not a regression: the node it
refuses to overwrite is already parked with better text than the sweep would
have written.

---

## Unit 1 — Thread a diagnosis-time `--base` pin through both sweeps, and give exit 3 its own outcome

### Scope

Changes `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
and the mechanical argument-index assertions in
`.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh` that
the new flag shifts. Nothing else.

**(1a) `frozen_session_sweep` — capture the base at the guard read.**
Immediately after step (7)'s `git show` succeeds (`:473-477`, which sets
`body`), add a sibling resolution of the same path's blob sha. Declare and
assign on **separate lines** — `local x=$(...)` masks the command's exit status,
and the surrounding code already splits for this reason (`:473-474`):

```bash
      # (7b) Diagnosis-time base (ref-diagnosis-time-cas). The decision this
      # sweep is about to make — "not parked, so park it" — is made against the
      # blob read HERE, from a ref last fetched once at step (6). Pin that exact
      # blob through park-node's --base so a park landing in the window between
      # this read and the write below is REFUSED (exit 3) rather than
      # overwritten. `rev-parse` is the identical expression park-node resolves
      # FRESH_BLOB with (park-node:205), so the two are bit-for-bit comparable;
      # hashing $body instead would not match, because command substitution
      # strips its trailing newlines.
      local diagnosis_blob
      if ! diagnosis_blob=$(git -C "$repo_root" rev-parse "origin/main:intentions/${name}.md" 2>/dev/null); then
        printf 'lib-frozen-session-park: keeping %s (could not resolve the origin/main blob sha for intentions/%s.md; refusing to park without a compare-and-swap base)\n' "$name" "$name" >&2
        continue
      fi
```

Placement is load-bearing: it must sit **at** the guard read, not just before
the park call, or the pin re-introduces the window it exists to close.

**(1b) `frozen_session_sweep` — thread the pin.** Replace the flat positional
invocation at `:522-524` with an array carrying the flag first (`park-node`'s
parse is leading-flags-only, `park-node:89-143` — the first non-flag argument
ends flag parsing and everything after is verbatim free text):

```bash
      local -a park_args=(--base "$name=$diagnosis_blob" "$name" "$reason" "$recommendation")
      local rc=0
      GRAPH_COMMIT_LOCK_WAIT_SECONDS="$lock_wait" \
        "$timeout_bin" "$park_timeout" "$park_node" "${park_args[@]}" >/dev/null </dev/null || rc=$?
```

Use the `<id>=<sha>` form, not the bare sha: `park-node:178-185` rejects a pair
whose id does not match the node id, so the pair form is a free guard against a
mis-threaded `$name`.

**(1c) `terminal_without_disposition_sweep` — same two edits.** Capture
`diagnosis_blob` right after the step (7) `git show` at `:981-985`, with the
same split-declaration form and the same keep-on-failure branch. Then extend the
existing `park_args` array at `:1102-1106` — it already conditionally prepends
`--pr`, so this is a minimal extension of the established pattern:

```bash
      local -a park_args=()
      if [[ -n "$pr" ]]; then
        park_args+=(--pr "$pr")
      fi
      park_args+=(--base "$name=$diagnosis_blob")
      park_args+=("$name" "$reason" "$recommendation")
```

Keep `--pr` first so the existing "`--pr` is first" assertion
(test file `:1143`) stays true and only the argument **count** and the
positional offsets move.

**(1d) Give exit 3 its own outcome at BOTH call sites.** `park-node`'s exit 3 is
not an ordinary park failure and must not read as one. Insert a dedicated branch
between the `rc == 0` branch and the `rc == 124` branch at both rc ladders
(`:525-539` frozen, `:1110-1179` terminal). Required properties, all four:

1. A distinctly greppable log line naming the stale-diagnosis condition —
   distinguishable from both `parked ` and `park failed for `, so an operator
   scanning tick logs can tell "raced, will self-heal" from "genuinely broken,
   needs attention". Do **not** reuse the generic branch's `will retry next
   tick` wording verbatim (that wording happens to be correct — the next tick's
   fresh fetch re-diagnoses — but it reads as an ordinary failure).
2. **Do not** increment `parked_count`. Nothing was parked.
3. Leave the job's escalation markers exactly where the existing failure path
   leaves them (terminal sweep only — the frozen sweep has no markers). The
   marker deletion at `:1154-1157` is reachable only from the confirmed-landed
   branch and must stay that way.
4. Record the decision through the existing logger with a new disposition
   string `stale-diagnosis` — `_frozen_session_log_decision "$name" "$sid"
   "$idle" "stale-diagnosis"` (`:328-…`) and
   `_terminal_disposition_log_decision "$name" "$sid" "$idle"
   "stale-diagnosis"` (`:552-576`).

Suggested frozen-sweep line (mirror it in the terminal sweep, adding "keeping
the escalation markers"):

```bash
      elif (( rc == 3 )); then
        printf 'lib-frozen-session-park: stale-diagnosis skip for %s — intentions/%s.md on origin/main changed after this sweep read it (pinned base %s); park-node REFUSED rather than overwriting a park that landed in the meantime. Nothing was written; the next tick re-reads and re-decides\n' \
          "$name" "$name" "$diagnosis_blob" >&2
        _frozen_session_log_decision "$name" "$sid" "$idle" "stale-diagnosis"
```

Never convert an exit-3 refusal into a retry-without-base, and never into a
second park — per `.claude/skills/ref-diagnosis-time-cas/SKILL.md:73-83`, the
node is already parked or already under human review, and re-parking it would
misrecord a race as a mechanical failure.

**(1e) Mechanical test updates so the suite stays green.** Adding two leading
arguments shifts every positional index the suite asserts on. All of these are
in `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`
and are part of THIS unit — leaving them for a later unit would land a red
suite, which `.claude/rules/test-integrity.md` forbids:

- The fake `park-node`'s node-id extraction inside `td_write_park_node`
  (`:744-747`) currently handles only `--pr`:
  `node="$1"; [ "$node" = "--pr" ] && node="$3"`. Replace with a general
  leading-flag skip so it survives any flag set:
  ```bash
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --*) shift 2 ;;
      *) break ;;
    esac
  done
  node="$1"
  ```
  (Mind the heredoc: the surrounding block escapes `$` as `\$`.)
- Add an `fs_park_arg <n>` helper mirroring `td_park_arg` (`:887-890`), then
  replace the three inline `head -n1` reads at `:259`, `:315`, `:579` with
  `fs_park_arg 3`.
- Frozen-sweep argc: `:258` `ARGC=3` → `ARGC=5`.
- Terminal-sweep index shifts (all `+2` unless the assertion is about `--pr`,
  which stays at 1–2): `:909` arg 1→3; `:950` arg 1→3; `:1054` `ARGC=3`→`ARGC=5`;
  `:1055` arg 2→4; `:1056` arg 3→5; `:1080` arg 2→4; `:1103` arg 2→4; `:1125`
  arg 2→4; `:1142` `ARGC=5`→`ARGC=7`; `:1145` arg 3→5; `:1161` `ARGC=3`→`ARGC=5`;
  `:1162` arg 1→3; `:1178` arg 2→4; `:1180` arg 3→5; `:1417` arg 1→3; `:1472`
  arg 1→3.

Re-derive each index from the actual file at implementation time rather than
trusting this list blindly — treat it as the exhaustive set to *check*, not as
line numbers to apply sight-unseen.

**(1f) Correct the stale claims in this file's own prose (the code half of the
carve-out reversal).** Rewrite the step (10) comment at `:506-509` — the "No
`--base` (there is no diagnosis/execution gap to pin)" sentence is now false and
must state the opposite with the reason (single per-sweep fetch + per-candidate
wall clock ⇒ a real, minutes-wide window). Also amend the header's fail-safe
posture paragraph at `:42-46`, whose closing clause "a real, **unparked** node
file on origin/main" now understates the guarantee: it should say the node must
still be unparked **at write time**, enforced by the compare-and-swap pin rather
than by the read alone. `terminal_without_disposition_sweep`'s step (12) comment
(`:1086-1101`) carries no equivalent false claim — it only needs the `--base`
plumbing described, not a retraction (grep-confirmed: exactly one such comment
exists in the file).

### Explicitly out of scope

- `packages/intentionsutil/scripts/park-node` and
  `packages/intentionsutil/scripts/clear-park` — the `--base` contract is
  complete and correct on `origin/main`; this unit adds a **caller**, not a third
  copy of pin-resolution logic. (This is why the draft sibling
  `tactic-park-node-clear-park-base-pin-dedup`, about duplicated pin-resolution
  between those two primitives, is not a blocker here.)
- The grace windows, the park caps
  (`DISPATCH_TERMINAL_DISPOSITION_PARK_MAX`), the fetch budget, and the
  confirm-landed step (13) at `:1111-1166`.
- The marker-writing gap in the `qa-main` / `qa-fix` park paths that supplies
  these candidates (`tactic-qa-fix-node-terminal-declaration`).
- The reap path (`dispatch-self-close`, `lib-session-reap.sh`).
- **`lib-standdown-recheck.sh:700`** — a third same-class site: an "already
  parked → keep" guard (documented at its `:131`) followed by an unpinned
  `"$park_node" "$node" "$reason" "$recommendation"`. It has the identical
  defect shape and will need the identical fix, but this tactic's recorded scope
  is `lib-frozen-session-park.sh` only. Do **not** widen this PR to cover it;
  see the surfaced premise about it needing its own node.

### Recommended model

`opus` — per the model-selection heuristic in
`.claude/skills/implement-unit/SKILL.md` ("Model-selection heuristic").

---

## Unit 2 — Regression coverage: the pin is captured at the guard read, and a real race is refused rather than clobbering

### Scope

Adds tests to
`.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh`
only. No production file changes. The fixture already fakes everything the
sweeps touch (see the file header at `:1-23`): the registry via
`CLAUDE_AGENTS_CMD`, the transcript store via
`DISPATCH_*_PROJECTS_ROOT`, the graph via `DISPATCH_*_REPO_ROOT` (a scratch git
repo whose `refs/remotes/origin/main` is set by hand — the sweep only ever
*reads* `git show origin/main:` and its fetch is non-fatal, so no real remote is
needed), `park-node` via `DISPATCH_*_PARK_NODE`, and the clock via
`DISPATCH_*_NOW_EPOCH`. Follow the existing per-test shape:
`fs_setup`/`td_setup` → build state → `fs_run`/`td_run` → `assert_eq` →
`fs_teardown`/`td_teardown`.

Add these tests, appended after the existing final test in each sweep's section:

**(2a) The pin is present and equals the pre-park `origin/main` blob — frozen
sweep.** Before `fs_run`, capture
`EXPECTED=$(git -C "$FS_REPO" rev-parse origin/main:intentions/<name>.md)`.
After the run, assert `fs_park_arg 1` == `--base` and `fs_park_arg 2` ==
`<name>=$EXPECTED`.

**(2b) Same for the terminal sweep, with `--pr` also present.** Assert the full
threaded shape: `td_park_arg 1` == `--pr`, `2` == the number, `3` == `--base`,
`4` == `<name>=<sha>`, `5` == the node id, and `ARGC=7`. This is the ordering
regression guard — `park-node`'s leading-flags-only parse means a flag appearing
*after* the first positional would be silently swallowed as free text rather
than erroring.

**(2c) Exit 3 is its own outcome — terminal sweep.** `td_write_park_node 3`.
Assert: the sweep returns 0; stderr contains `stale-diagnosis`; stderr does
**not** contain `park failed for`; the summary line reports `parked=0`; the
decision-log disposition (via `td_log_dispositions`) is `stale-diagnosis`; and
the escalation markers written with `td_write_job_file` still exist on disk.

**(2d) Exit 3 is its own outcome — frozen sweep.** `fs_write_park_node 3`, same
assertions minus the markers, using `fs_log_dispositions`.

**(2e) The end-to-end race — THE regression test for this defect.** Add a new
landing mode to `td_write_park_node` (it already takes a `<landing-mode>` third
argument with modes `land`/`none`/`delete`/`body`, `:711-760`). Add `race`,
which faithfully emulates a concurrent writer plus real `park-node`'s CAS:

1. On invocation, **first** land a *specific* park onto the node on
   `origin/main` — rewrite `office_hours: null` into a block whose `reason` and
   `recommendation` carry distinctive sentinel strings — and republish
   `refs/remotes/origin/main`. This is the concurrent writer landing inside the
   sweep's guard-to-write window.
2. Then compare its own received `--base` value against the now-current
   `git rev-parse origin/main:intentions/<node>.md`. On mismatch, append
   `RACED=1` to the park log and `exit 3` **without writing anything further**
   — exactly `park-node:218-221`. On match, write the generic text and exit 0.

Assert, after `td_run`:
- The sweep returns 0.
- The node on `origin/main` still carries **both** sentinel strings
  byte-for-byte (read it back with
  `git -C "$TD_REPO" show origin/main:intentions/<name>.md`; compare the exact
  strings, not a substring of a folded YAML line).
- The generic `ended without declaring a disposition` text is **absent** from
  the node.
- The disposition logged is `stale-diagnosis`; `parked=0`; markers retained.
- **Non-vacuity control:** the park log contains `RACED=1`. Without this
  assertion the test would pass trivially if the fake never actually advanced
  `origin/main`, or if the sweep stopped calling `park-node` at all — either of
  which would make the test green while proving nothing. Assert the race fired.

**Deliberately not tested:** the "could not resolve the blob sha" keep-branch
from (1a)/(1c). It is unreachable in the fixture whenever the preceding
`git show` of the same path succeeded; the branch exists for
`.claude/rules/code-style.md`'s clear-error-over-fallback posture, not because a
reachable input produces it. Do not contrive a fixture to force it.

### Dependencies

Unit 1.

### Recommended model

`sonnet` — per the model-selection heuristic in
`.claude/skills/implement-unit/SKILL.md` ("Model-selection heuristic").

---

## Unit 3 — Reverse the falsified carve-out in the diagnosis-time-CAS reference

### Scope

Changes `.claude/skills/ref-diagnosis-time-cas/SKILL.md` only (95 lines total).

Replace the "NOT needed for immediate mechanical parks" paragraph at `:18-24`,
which names `frozen_session_sweep` and `terminal_without_disposition_sweep` by
name as the canonical *exemption*. Its stated reason — "Their
diagnosis→execution window is a handful of subprocesses, and `park-node`'s own
fresh `origin/main` re-read is the correct guard at that scale" — is false in
both halves, and the replacement must say why:

- The window is **not** a handful of subprocesses. Both sweeps fetch
  `origin/main` **once per sweep** and then loop over N candidates, each
  candidate's guard read served from that one fetch, each candidate's
  `park-node` call bounded by a 120s `timeout` over a 60s landing-lock wait.
  Observed windows: 351s, 441s, 809s.
- `park-node`'s own fresh re-read is **not** the guard for this hazard. It
  protects against a *stale local copy* diverging from `origin/main`; it does
  nothing for an *already-current* park that lands in the caller's own
  guard-to-write window, because `park-node` has no already-parked check of its
  own — absent `--base` it overwrites `office_hours` unconditionally.

Rewrite "When this applies" so the rule is stated by **shape, not by caller
class**: any caller that makes a decision from a read of a node and later writes
that node must capture the blob at the deciding read and pin it through
`--base`. The batched-drain interview gap is the *widest* instance of that
shape, not the only one. Recast the two sweeps from a named exemption into a
**worked example of a caller that needed the pin and did not have it**, citing
the four dated clobbers, and state the only genuine exemption: a caller with no
guard decision at all — an unconditional park that would write the same thing
regardless of what it read — because that is not a compare-and-swap situation.

Leave `:26-57` (the three-step protocol), `:59-71` (the exit-code contract), and
`:73-95` (the re-diagnosis loop and the "why not just `graph-commit --base`"
rationale) unchanged — all four remain correct. One optional touch-up: `:54-57`
still hedges that `clear-park` "may not exist yet on `origin/main`"; it does
exist (`packages/intentionsutil/scripts/clear-park`, via the landed
`tactic-clear-park-primitive`). Dropping that hedge is in scope as a one-line
correction; nothing else in the file is.

### Explicitly out of scope

Any other skill or reference doc, and the inline comments inside
`lib-frozen-session-park.sh` — those belong to Unit 1 (1f), so that the code and
the comment describing it move in the same commit.

### Dependencies

Unit 1 — the doc must not describe the pin as landed before it is.

### Recommended model

`sonnet` — per the model-selection heuristic in
`.claude/skills/implement-unit/SKILL.md` ("Model-selection heuristic").

---

## Reuse

- **`packages/intentionsutil/scripts/park-node:118-193`** — `--base` flag
  parsing and resolution (`BASE_SUPPLIED`, `PINNED_BASE`). Accepts a bare 40-hex
  blob sha, an `<id>=<sha>` pair, or a manifest file path. `--base ''` is a hard
  usage error (exit 2), never a silent no-op. **The callee contract is complete
  — do not modify it.**
- **`packages/intentionsutil/scripts/park-node:194-221`** — the
  `PINNED_BASE` vs `FRESH_BLOB` stale-diagnosis check that exits 3 *before any
  mutation*. This is the guard that closes the bug once callers pass `--base`;
  no refusal logic is written in the sweep.
- **`packages/intentionsutil/scripts/park-node:205`** — the exact expression to
  reuse for capturing the base:
  `git -C "$REPO_ROOT" rev-parse "origin/main:intentions/$NODE_ID.md"`. Using
  the identical expression is what makes the caller's pin and the callee's
  `FRESH_BLOB` bit-for-bit comparable. Cheaper and more correct here than
  `dump-node.ts`, whose manifest form exists for the multi-node interview case.
- **`packages/intentionsutil/scripts/dump-node.ts:55-59`** (`hashNodeFile`) —
  the alternative blob-capture idiom (hash the on-disk file). **Not** used here:
  the sweep never writes the node locally before parking, and hashing the
  `$body` command substitution would not match, because command substitution
  strips trailing newlines.
- **`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:1102-1106`**
  — the existing `park_args` array with its conditional `--pr` prepend. Unit 1
  extends this pattern rather than inventing one; the frozen sweep's flat
  positional call (`:522-524`) is array-ified to match.
- **`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:328-…`
  and `:552-576`** — `_frozen_session_log_decision` /
  `_terminal_disposition_log_decision`. Both already take a free-form
  `<disposition>` string, so `stale-diagnosis` needs no logger change.
- **`.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh:711-760`**
  (`td_write_park_node`) — the fake `park-node` that logs argv and mutates
  `origin/main`. Unit 2's `race` mode is a new case in its existing
  `<landing-mode>` switch, not a new fake.
- **`.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh:887-890`**
  (`td_park_arg`) — the positional-argument reader; Unit 1 adds the `fs_park_arg`
  mirror the frozen-sweep tests currently lack.
- **`.claude/skills/ref-diagnosis-time-cas/SKILL.md:59-83`** — the exit-code
  contract table and the re-diagnosis loop. Cite these for the expected exit-3
  behavior rather than re-deriving them.
- **`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-205`** —
  collects `$SCRIPTS/test-*.sh` by glob, so
  `test-lib-frozen-session-park.sh` is already a CI gate; no runner registration
  is needed for the new tests.

## Verification

The suite is green at the base commit (209/209 passed, measured this round), so
any failure after the change is attributable to the change.

```verify
bash -n .claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh && bash -n .claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

The behavioural gate is test (2e) inside the second block above — it is the only
check that proves the defect is closed rather than merely that a flag is
threaded. Reading its output, require all of: `RACED=1` present (the race
actually fired — without this the test is vacuous), both sentinel strings intact
on `origin/main`, the generic boilerplate absent, `parked=0`, disposition
`stale-diagnosis`, markers retained.

Note that no `shellcheck` runs over `.claude/skills/**` in CI (grep-confirmed),
so `bash -n` plus this suite are the only mechanical shell gates on the change —
review the diff for quoting and array-expansion errors that `bash -n` cannot
see, particularly inside the test fixture's nested heredocs, where `$` must be
escaped as `\$`.

**Manual / observe-in-production (post-merge, `needs-main` class).** These cannot
run pre-merge — the sweeps only execute inside the live `dispatch-tick`, against
the real `origin/main`:

1. **No new clobbers.** Run the state-aware detect below over a full day after
   the change is live and require zero `UNHEALED` rows.
2. **Refusals appear and self-heal.** Grep tick logs for `stale-diagnosis` — a
   nonzero count is the fix *working* (races are being refused), not a
   regression. For each hit, confirm the node kept its specific park text and
   that a subsequent tick either parked it correctly or correctly skipped it as
   already-parked. If a node accumulates `stale-diagnosis` on consecutive ticks
   without ever converging, that is a genuinely new failure mode and needs
   investigation, not a wider retry.
3. **The success path is unaffected.** Confirm ordinary parks still land: the
   `parked <id>` line and the step (13) confirmed-landed read still fire on
   unraced candidates, and escalation markers are still cleared only on a
   confirmed landing.

## Interim mitigation, until the fix lands

The defect destroys content but is fully recoverable, because the pre-clobber
commit still holds the specific text.

**1. Detect.** The detect must be STATE-AWARE. The clobber's commit pattern
stays in history forever, so a history-only scan re-reports every clobber that
has already been healed and cannot distinguish healed from live. This form
re-reads each node's CURRENT frontmatter and prints `UNHEALED` only when the
generic text is still the live park, together with the commit to restore from.
Only `UNHEALED` rows are actionable:

```bash
git fetch origin main -q
git log --since='-4 days' --format='%H%x09%ct%x09%s' origin/main -- intentions/ \
  | grep '^[0-9a-f]*\t[0-9]*\tgraph: park ' \
  | awk -F'\t' '{n=$3; sub(/^graph: park /,"",n); split(n,a," ");
      g=($3 ~ /session ended without declaring a disposition/)?1:0;
      print $1"\t"$2"\t"a[1]"\t"g}' \
  | sort -k3,3 -k2,2n \
  | awk -F'\t' '{ if ($3==p3 && $4==1 && p4==0)
      printf "%s\t%s\t%s\t%s\n", $3, ps, $1, ($2-pt); p3=$3; p4=$4; ps=$1; pt=$2 }' \
  | while IFS=$'\t' read -r node spec gen gap; do
      if git show "origin/main:intentions/$node.md" 2>/dev/null \
         | awk 'NR==1&&/^---/{f=1;next} f&&/^---[[:space:]]*$/{exit} f' \
         | grep -q 'session ended without declaring a disposition'; then
        printf '  UNHEALED %s  restore-from=%s  gap=%ss\n' "$node" "${spec:0:8}" "$gap"
      else
        printf '  healed   %s  (gap=%ss)\n' "$node" "$gap"
      fi
    done
```

A gap under the sweep grace (900s frozen, 300s terminal) is this defect. A much
larger gap is more likely a legitimate later re-park — check before restoring.

**2. Heal.** Recover the specific text from the pre-clobber commit. Parse it,
never grep, since YAML folds long values:

```bash
git show <specific-sha>:intentions/<id>.md > /tmp/claude-heal/<id>.md
# parse office_hours.reason and .recommendation via listNodes, write to files,
# then re-land, pinning the CAS token this defect fails to pin:
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir "$SCRATCH" <id>)
packages/intentionsutil/scripts/park-node --base "$BASE" <id> "$REASON" "$REC"
```

Verify by reading `office_hours` back from `origin/main` and comparing the
restored strings for byte equality — `graph-commit` exit 0 is not evidence
anything landed.

**3. Reduce exposure.** Every candidate these sweeps adopt arrives because the
session never declared a terminal disposition, so closing that gap starves this
defect of inputs without touching it. Lowering
`DISPATCH_TERMINAL_DISPOSITION_PARK_MAX` to 1 narrows but does not close the
window — a concurrent writer can still land inside a single park's own
read-to-write span, which is what three of the four observed clobbers look like.
