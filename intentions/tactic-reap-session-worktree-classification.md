---
id: tactic-reap-session-worktree-classification
kind: tactic
statement: Classify a reap candidate by node kind before any worktree path is
  resolved, so the reap never attributes a checkout under .claude/worktrees/ to
  a session whose node cannot own one
owner: ai
status: codified
parent: null
rationale: >-
  Split out of tactic-session-reap-authorization-durability's migration step 1
  at

  the 2026-08-10 office-hours sitting, but deliberately NOT on the scope that
  node

  recorded. That park proposed making lib-session-reap.sh read a recorded
  worktree

  path instead of deriving "$worktrees_root/$name", calling it small and

  independent; measurement falsified both halves. provision-node-worktree:131

  composes WT="$PROJECT_ROOT/.claude/worktrees/$NODE_ID" — the same path

  lib-session-reap.sh derives at :286-294 — so the derivation is correct by

  construction for provisioned worktrees and the recorded fix addresses nothing

  there. Worse, implemented literally it is destructive: the recorded cwd for a

  repo-root session IS the repo root, so the sweep's `git worktree remove`

  (lib-session-reap.sh:374) would be aimed at the MAIN CHECKOUT. Recording why
  that

  remedy must never be implemented, and pinning it with a test, is this node's

  core product.


  The second population is real and is documented in code: a session registered

  under a bare node id may run at the repo root with no worktree by design —

  dispatch-graph-execute:205-217 spawns with --cwd "$PROJECT_ROOT" under the
  bare

  node-id session name, office-hours-graph:344-358 gates worktree provisioning
  on

  node_kind_on_main and launches non-tactic parks at the repo root, and

  office-hours-select.ts:44-52 documents the same split. The reap cannot tell
  those

  from a tactic worker: it attributes $worktrees_root/$name to both and lets

  directory presence decide.


  HARM CLAIM CORRECTED 2026-08-19 (/align-tactics finalize round; the whole node
  —

  statement, rationale, attention.rationale, body, and Verification — was

  reconciled in that round per strategy condition 8). This node was filed
  asserting

  that repo-root sessions make the sweep DECLINE, with
  tactic-fleet-alarm-busy-stall

  declining every ~15 minutes as live, ongoing harm. That attribution is false
  and

  is retracted. lib-session-reap.sh:387-391 logs SESSION_REAP_NO_WORKTREE for an

  absent derived worktree, touches no checkout, and proceeds to `claude rm`;
  that

  arm landed in 0e953cad on 2026-08-05, five days before this node was filed.
  All 54

  REAP_DECLINED lines in tmp/dispatch-sweep.log carry claude_rm_rc=1 — the
  daemon

  refusing removal, not a worktree-gate effect — and all fall between 2026-08-06
  and

  2026-08-09T23:01:29Z, with none in the ten days since while the reap arm kept

  running daily. That symptom belongs to tactic-self-close-reap-silent-noop and
  is

  out of scope here.


  So this node is SAFETY HARDENING plus a REGRESSION GUARD, not a live-bug fix.
  What

  survives the correction and keeps it non-vacuous: (a) the preventive guard
  above,

  whose only protection today is the incidental, unnamed, untested [[ -d
  "$wt_path" ]]

  check; (b) a real latent defect — any directory at
  .claude/worktrees/<non-tactic-id>

  (a hand-cut checkout, a leftover, a name collision) is today run through the

  reap-safety gates and then removed as if it were that session's work product;
  and

  (c) a hand-removed tactic worktree currently lands in the same vacuous-gates
  branch

  as a repo-root session, so the session reaps with the reap-safety triple never

  evaluated. Positive classification makes all three declinable, and each is
  testable

  today.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.05
  rationale: >-
    Filed at the 2026-08-10 office-hours sitting above the 20-band its parent
    and

    siblings sit in, because unlike them it is not blocked on any author
    question. The

    author's instruction at that sitting was to split it out precisely so it
    would not

    wait behind the claim-anchor ratification.


    PRIORITY GROUND CORRECTED 2026-08-19 (/align-tactics finalize round): the
    filing

    also cited "measured, ongoing waste today (a node declining every ~15
    minutes)" as

    a reason for the elevated placement. That harm claim was falsified this
    round —

    the decline was a daemon-side `claude rm` refusal owned by

    tactic-self-close-reap-silent-noop, and it stopped on 2026-08-09. The

    not-blocked-on-an-author-question ground stands; the ongoing-waste ground
    does

    not. The boost magnitude is left exactly as authored rather than renumbered
    here —

    re-ranking is an author decision, not an autonomous one.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 50 to 0.05 so this
    boost

    can no longer lift the node out of its parent strategy's band. The bound - a
    tactic

    boost is namespaced to its strategy's rank and must never cause the tactic
    to

    outrank a tactic of a higher-ranked strategy - is recorded doctrine on

    strategy-recursive-self-improvement but is NOT yet enforced by the resolver;

    tactic-attention-namespaced-rank makes it structural. Until then the flat
    additive

    sum defeats it, so the magnitudes are compressed by hand onto a
    0.01-per-level

    ladder that preserves the original ordering WITHIN the band. Original
    magnitude

    preserved at attributes.pre_namespacing_boost for restoration.
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 50
---

# Classify a reap candidate by node kind before any worktree path is resolved

## Context

`session_reap_node` in `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh`
is the single proven act that removes a node worktree and then reaps its session.
It decides which worktree belongs to a candidate by **deriving** a path from the
session name:

```
    local worktrees_root="${DISPATCH_SESSION_REAP_WORKTREES_ROOT:-$repo_root/.claude/worktrees}"

    # (7) The worktree. Its path is derived, never taken from the registry's
    # `cwd`: provision-node-worktree puts a node's checkout at exactly
    # <project-root>/.claude/worktrees/<node-id> on a branch of the same name.
    local wt_path="$worktrees_root/$name"
    local branch="$name"
    local wt_present=0
    [[ -d "$wt_path" ]] && wt_present=1
```

(`lib-session-reap.sh:286`, `:288-294`, verified at `55b986d9`; the file is 646
lines.)

The derivation is correct **for the population it describes**.
`provision-node-worktree:131` composes `WT="$PROJECT_ROOT/.claude/worktrees/$NODE_ID"`
and its header (`:14-25`) states the same convention, so for a provisioned tactic
worker the derived path cannot be wrong.

**But the session registry contains a second population.** A session registered
under a bare node id may run at the **repo root**, with no worktree at all, by
design:

- `dispatch-graph-execute:205-217` — for `kind == strategy` (and for a frozen
  tactic re-entering at `phase == align-tactics`) it spawns
  `dispatch-spawn-job --no-verify --name "$id" --cwd "$PROJECT_ROOT" …`. The
  session NAME is the bare node id; the cwd is the repo root.
- `office-hours-graph:344-358` — the office-hours launch arm gates worktree
  provisioning on `node_kind_on_main`, and for any non-tactic node logs
  `node $node_id is a $node_kind node — no worktree (engagement is a graph edit …).
  Launching in $cwd under the bare node-id session name.`
- `office-hours-select.ts:44-52` documents the same split in its stdout
  disposition contract.

So the reap has no way to tell a strategy/delegation/virtue/tradition session —
which structurally **cannot** own a checkout under `.claude/worktrees/` — from a
tactic worker that does. It attributes `$worktrees_root/$name` to both and lets
directory presence decide. Today that is benign only by luck: no directory
normally exists at `.claude/worktrees/<strategy-id>`, so the code falls into the
absent-worktree arm. Put any directory there — a hand-cut checkout, a leftover
from an earlier ladder run, a name collision — and the sweep will run the
reap-safety gates against it and then `git worktree remove` it as if it were that
session's own work product.

**This is safety hardening plus a regression guard, not a live-bug fix.** State
that plainly; do not inherit an "ongoing waste" framing (see the correction
below).

### Correction to this node's own earlier diagnosis (measured 2026-08-19)

The prior draft of this node claimed that for repo-root sessions "the derived
path names a worktree that does not exist, and the sweep **declines** the
candidate", and cited `tactic-fleet-alarm-busy-stall` declining every ~15 minutes
as live harm. **That attribution is false and is retracted here.** The `else` arm
at `lib-session-reap.sh:387-391` reads:

```
    else
      # Absent worktree — the reap-safety gates are vacuous. See the header.
      _lsr_log "$log_file" "$log_tag" \
        "SESSION_REAP_NO_WORKTREE: name=$name session=$sid worktree=$wt_path (nothing to remove; proceeding to claude rm)"
    fi
```

An absent derived worktree does **not** decline — it logs and proceeds to
`claude rm`. Confirmed against `tmp/dispatch-sweep.log` (10.3MB, live through
2026-08-19): the actual recorded pair for the cited victim was

```
… SESSION_REAP_NO_WORKTREE: name=tactic-fleet-alarm-busy-stall … (nothing to remove; proceeding to claude rm)
… REAP_DECLINED: name=tactic-fleet-alarm-busy-stall … claude_rm_rc=1 — the daemon still reports this session after `claude rm`
```

The recurring decline was a **daemon-side** `claude rm` refusal (`rc=1`, session
still listed), not a worktree-gate effect. It has also stopped: 54 `REAP_DECLINED`
lines exist in the whole log and the last one is `2026-08-09T23:01:29Z`. That
symptom's home is `tactic-self-close-reap-silent-noop` (the `claude rm`
silent/failed-decline family) — **out of scope here**; do not widen this node to
chase it, and if the rc=1 variant does not fit that node, name a new tactic
rather than a side channel (strategy clarification 28).

Consequently the old Verification line — "`tactic-fleet-alarm-busy-stall` stops
appearing as a recurring decline in `tmp/dispatch-sweep.log`" — was **vacuous**:
it already passes and never measured this change. It is replaced below by a test
that fails on today's `HEAD`.

### The fix that must NOT be implemented

`tactic-session-reap-authorization-durability` (still `status: raw`,
`phase: null`) records the remedy for this area as "make `lib-session-reap.sh`
read a **recorded worktree path** instead of deriving it". **Implemented
literally, that is strictly worse than today's behaviour**: the recorded cwd for
a repo-root session *is the repo root*, so `git worktree remove "$wt_path"`
(`lib-session-reap.sh:374`) would be aimed at the **main checkout** for exactly
the sessions that are currently harmless. A benign false decline would become a
destructive false accept.

The registry's `cwd` is already threaded into `session_reap_node` as its 7th
positional argument (`lib-session-reap.sh:501-511` parses it, `:627` passes it),
and the function header states it is **diagnostic only**, "trailing and optional
precisely so they cannot become load-bearing". **Do not make `cwd` load-bearing.**
Beyond the destructive case above, it is also simply wrong in the other
direction: `dispatch-graph-execute:205-217` spawns an `/align-tactics` worker on a
**tactic** node with `--cwd "$PROJECT_ROOT"` and lets the skill enter its own
`.claude/worktrees/<node-id>` afterwards, so a cwd-keyed classifier would read
that genuine tactic worker as "repo root" and leak its worktree forever.

Nothing in the tree currently records why the naive fix is dangerous, and the
only thing preventing it today is the incidental, unnamed, untested
`[[ -d "$wt_path" ]]` check. Naming the class, gating on positive evidence, and
pinning both with tests is this node's whole product.

### Greenfield design

Worktree association is a **consequence of the node's kind**, read from the graph
at `origin/main`, never of directory presence and never of the session's cwd.
Ideally one owned classifier has a single home shared by every surface that asks
the question — the reap, the office-hours launch arm, and the stand-down sweep.

That shared home is **not built in this PR**, for two recorded reasons:

1. `office-hours-graph:11-13` declares outright that it "sources NOTHING from
   `.claude/skills/dispatch-propagate/`", so it cannot consume a lib that lives
   there; `reserved_owner_for` (`office-hours-graph:145-160`) is an existing
   deliberate inline mirror under the same rule.
2. `lib-standdown-recheck.sh:648-655` already inlines the identical
   frontmatter-scoped read and says so explicitly ("Same frontmatter-scoped,
   column-0-anchored idiom `node_kind_on_main` … uses, deliberately inlined here
   rather than shared").

Adding a new `lib-*.sh` and a `source` line to `lib-session-reap.sh` would also
require chasing every fixture that copies libs by explicit name
(`test-dispatch-sweep.sh:57-77` copies each one individually), a known CI-only
breakage class. **Brownfield path taken here:** a third deliberate inline mirror
in `lib-session-reap.sh`, whose header names the other two so a later
consolidation has a complete inventory. Consolidating the three mirrors into one
lib (and deciding the `packages/intentionsutil` ↔ `dispatch-propagate` dependency
direction that currently forbids it) is a **named follow-up**, not this node's
scope.

---

## Unit 1 — classify by node kind before any worktree path is resolved

**Recommended model:** opus — small in lines, but the point is a safety-critical
distinction whose naive form destroys the main checkout, and the correct signal
had to be argued against two plausible wrong ones (cwd, directory presence). It
also has to keep a 32-case existing suite green through a semantic change to its
central gate.

### Scope

**File:** `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh`
(646 lines at `55b986d9`; prefer locating by symbol — `session_reap_node`,
`wt_path`, `wt_present` — over by line, the file is actively edited).

**1a. Add the classifier.** A new function in this file, defined before
`session_reap_node`, modelled on `node_kind_on_main`
(`packages/intentionsutil/scripts/office-hours-graph:174-199`) but returning a
token instead of `exit 1`, because nothing in `lib-session-reap.sh` may ever exit
(it is bookkeeping that must never abort a sweep):

```
# node_worktree_class <repo-root> <node-id> — echo exactly ONE of:
#   node-worktree  the node is a TACTIC on origin/main. `<worktrees-root>/<id>`
#                  is authoritative and may be removed.
#   repo-root      the node is a NON-tactic kind on origin/main (strategy,
#                  delegation, virtue, tradition). It has no worktree BY DESIGN
#                  and its session runs at the repo root, so nothing under
#                  <worktrees-root> may be attributed to it.
#   unknown        intentions/<id>.md or its `kind:` could not be read at
#                  origin/main. REFUSE TO GUESS — attribute no worktree.
# ALWAYS returns 0.
```

Read `git -C "$repo_root" show "origin/main:intentions/${nid}.md"`. Scope to the
YAML frontmatter and anchor at column 0 with the same two expressions the two
existing mirrors use, so a `kind:` line in the markdown body can never be misread
as schema state:

```
frontmatter=$(awk 'NR==1&&/^---/{f=1;next} f&&/^---[[:space:]]*$/{exit} f' <<<"$body")
kind=$(sed -n 's/^kind:[[:space:]]*\([A-Za-z][A-Za-z0-9_-]*\)[[:space:]]*$/\1/p' <<<"$frontmatter" | head -1)
```

`kind == tactic` → `node-worktree`; any other non-empty kind → `repo-root`; a
failed `git show` or an unparseable/absent `kind:` → `unknown`. Do **not** fetch:
every other origin/main read in this function (the content gate at `:327`) reads
the local ref as-is, and the reap runs on the main checkout the tick already
syncs. Read the ref once per candidate — the sweep caps candidates at
`DISPATCH_SESSION_REAP_MAX` (default 8), so cost is bounded.

The function header must name the other two mirrors
(`office-hours-graph:174-199`, `lib-standdown-recheck.sh:648-655`) and say why a
third inline copy was chosen (the consolidation follow-up above).

**1b. Restructure gate (7) so a path is resolved only for the tactic class.**
Replace `lib-session-reap.sh:288-294` so `wt_path` is **empty and unusable**
unless the class is `node-worktree`:

```
    local wt_class
    wt_class=$(node_worktree_class "$repo_root" "$name")
    local wt_path="" branch="$name" wt_present=0
    if [[ "$wt_class" == "node-worktree" ]]; then
      wt_path="$worktrees_root/$name"
      [[ -d "$wt_path" ]] && wt_present=1
    fi
```

This is the structural guard: `wt_present` can only become 1 for a tactic node,
so the whole `if (( wt_present ))` block (`:296-392`) — including the
`git worktree remove` at `:374` — is unreachable for the other two classes. Add
a defensive refusal immediately before `:374` (per
`.claude/rules/code-style.md`: a clear error, not a silent fallback) that logs
and returns `skip-worktree-remove-failed` if `wt_path` is empty or
`wt_class != node-worktree`, so a future edit that reorders these blocks cannot
reintroduce the hazard silently.

**1c. Three distinguishable log lines in the else arm** (`:387-391`), via the
existing `_lsr_log` (`:206-215`):

- class `node-worktree`, directory absent → **keep the existing
  `SESSION_REAP_NO_WORKTREE` line byte-for-byte** (`wt_path` is populated in this
  branch). Tests 18 and 28 assert on it and must stay green.
- class `repo-root` → a new tag, e.g.
  `SESSION_REAP_REPO_ROOT_SESSION: name=$name session=$sid node_kind=<kind> (a non-tactic node has no worktree by design — engagement is a graph edit; nothing under $worktrees_root is attributed to this session; proceeding to claude rm)`
- class `unknown` → a new tag, e.g.
  `SESSION_REAP_NODE_KIND_UNKNOWN: name=$name session=$sid (intentions/$name.md or its column-0 kind: is unreadable at origin/main; refusing to guess whether this session owns a worktree; attributing none; proceeding to claude rm)`

**1d. Append the class to the terminal success line.** `SESSION_REAPED`
(`:429`) currently ends `worktree_present=$wt_present cwd=$cwd`. Append
` wt_class=$wt_class` at the **end**; do not reorder or rename the existing
fields — Test 32 (`test-lib-session-reap.sh:919-935`) asserts on the
`idle_seconds=` and `cwd=` substrings.

**1e. Update the function's own documentation, which is the contract.**
`session_reap_node`'s header (`:216-270`) is the single canonical statement of the
contract, and the file header's numbered gate list (`:84-95`) and its
`ABSENT WORKTREE` paragraph (`:119-127`) both describe gate (7). All three must
gain the classification step. State explicitly in the header:

- the three classes and what each does;
- that `cwd` remains diagnostic-only and **must not** become the signal, with the
  main-checkout-destruction reason and the `--cwd "$PROJECT_ROOT"` align-tactics
  counterexample from §"The fix that must NOT be implemented";
- that `unknown` attributes no worktree but still proceeds to `claude rm`.

**Why `unknown` proceeds rather than skipping.** The file's UNKNOWN→keep posture
(`skip-status-error`, `skip-diff-error`, `skip-pr-fetch-failed`) exists to protect
**worktree content** from removal. The `unknown` arm already refuses to touch any
worktree, so no content is at risk; the only remaining question is the session
registration, where keeping is the harm — strategy condition 15 makes a declared
worker left in `claude agents --json` a defect, and gate (4) already required a
`node-terminal` marker, so every candidate reaching here **declared**. Skipping
would freeze the node with nothing to debug. Proceeding is also exactly today's
behaviour for this population (no directory exists, so today's code takes the
absent-worktree arm anyway), which is why this choice adds **zero** regression
risk. If `claude rm` then declines because a real tactic worktree was left in
place, that surfaces loudly as the existing `REAP_DECLINED` line and self-heals on
the next sweep once the read succeeds.

**The token contract does not change.** `repo-root` and `unknown` both fall
through to `claude rm` and terminate at `reaped` / `declined` / `unverified`. No
new stdout token is introduced, so the enumerations at `lib-session-reap.sh:243-253`
and the verbatim re-export in `dispatch-node-reap:45-48` stay in sync with no
edit. If a later change *does* add a token, both lists must be updated together.

**1f. Keep the existing suite green — required in this same unit.** The
classifier reads `intentions/<name>.md` at `origin/main`, and the fixture repo
built by `sr_setup` (`test-lib-session-reap.sh:66-133`) seeds only
`intentions/seed.md`. Every existing worktree-bearing test would therefore
classify `unknown`, skip the removal, and fail. Fix at the single funnel:

- add `sr_node <node-id> <node-kind>` — writes `intentions/<id>.md` on `main`
  with `---\nkind: <node-kind>\n---\n` frontmatter, commits it, and re-points
  `refs/remotes/origin/main` the way `sr_setup` already does
  (`git update-ref refs/remotes/origin/main HEAD`);
- have `sr_worktree` (`test-lib-session-reap.sh:258-296`) call
  `sr_node "$name" tactic` **before** its `git worktree add`, so all ~20
  worktree-bearing tests gain a tactic node with no per-test edits. Note the
  local variable named `kind` there is the *divergence* kind (`clean|dirty|
  content|intentions|squash`) — do not shadow it.
- Committing only `intentions/` paths to `main` is safe for the content gate:
  `git diff --quiet origin/main HEAD -- . ':!intentions'` (`:327`) excludes them.
- Tests 18 and 28 (absent worktree, no `sr_worktree` call) need `sr_node
  <name> tactic` added explicitly if their assertion on the
  `SESSION_REAP_NO_WORKTREE` tag is to keep meaning "tactic node, directory
  absent" rather than "unknown kind".

**Out of scope for this unit:** gates (1)–(6) in `session_reap_sweep`, the
reap-safety content triple (7a/7b/7c), the branch-retention rule, the
`claude rm` rc=1 daemon decline, consolidating the three `kind:` mirrors, and any
change to `office-hours-graph` or `lib-standdown-recheck.sh`.

### Reuse

- `node_kind_on_main` — `packages/intentionsutil/scripts/office-hours-graph:174-199`
  (the pattern, its refuse-to-guess posture, and its exact `awk`/`sed` pair).
- The second mirror of the same idiom —
  `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:648-655`.
- `_lsr_log` — `lib-session-reap.sh:206-215`.
- `repo_root` / `worktrees_root` resolution already done at
  `lib-session-reap.sh:277-286` (`DISPATCH_SESSION_REAP_REPO_ROOT`,
  `DISPATCH_SESSION_REAP_WORKTREES_ROOT`, `resolve_project_root` from `lib.sh`).
- The launch-side mirror of this exact branch —
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:205-228` and
  `packages/intentionsutil/scripts/office-hours-graph:344-358`.
- The path convention being defended — `provision-node-worktree:14-25,131`.
- Harness — `sr_setup` / `sr_write_shims` / `sr_teardown`
  (`test-lib-session-reap.sh:66-146`), `sr_worktree` (`:258-296`).

---

## Unit 2 — tests for all three classes, including the destructive-fix guard

**Recommended model:** sonnet — mechanical, against a harness whose every needed
idiom already exists.

**Dependencies:** Unit 1.

### Scope

**File:** `.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh`
(append after Test 32, following the existing numbering and the `sr_setup` …
`sr_teardown` block shape). Cover at minimum:

1. **Tactic node, provisioned worktree — unchanged behaviour.** `sr_node
   tactic-cls-tactic tactic` + `sr_worktree … clean`; assert verdict `reaped`,
   assert `git worktree remove` WAS invoked (`sr_line_of '^git-worktree-remove '`
   is not `none`), assert `SESSION_REAPED` carries `wt_class=node-worktree`.

2. **THE REGRESSION GUARD — strategy node with a stray directory at the derived
   path.** `sr_node strategy-cls-root strategy`, then create a real worktree at
   `$SR_WTROOT/strategy-cls-root` with `sr_worktree` (or a bare `git worktree
   add`), register a session named `strategy-cls-root`, and assert:
   - `git worktree remove` was **NEVER** invoked —
     `assert_eq "… never attempted" "none" "$(sr_line_of '^git-worktree-remove ')"`,
     the idiom Test 18 already uses at `:675`;
   - the directory still exists on disk after the run;
   - `SESSION_REAP_REPO_ROOT_SESSION` was logged and `SESSION_REAP_NO_WORKTREE`
     was **not**;
   - the session still reaps (`claude rm` ran — `sr_rm_calls` is 1, `:323-328`),
     i.e. the class is not a new freeze.

   **This case must fail on today's `HEAD`** (today the directory is removed).
   That is what makes the verification below non-vacuous, and it is the guard
   against `tactic-session-reap-authorization-durability`'s recorded remedy ever
   being implemented as written. Assert on the **absence of the removal call**,
   not merely on the exit code.

3. **Unknown kind — no node file at `origin/main`.** Register a session named for
   a node with no `intentions/<id>.md`, with a directory present at the derived
   path; assert `git worktree remove` never invoked, `SESSION_REAP_NODE_KIND_UNKNOWN`
   logged, `claude rm` still ran.

4. **Unknown kind — file present, no parseable column-0 `kind:`.** Same
   assertions; proves the frontmatter parse refuses rather than defaults.

5. **A `kind:` line in the markdown BODY does not classify.** Node file whose
   frontmatter has `kind: strategy` and whose body contains a column-0
   `kind: tactic` line; assert `repo-root`. (Guards the frontmatter scoping the
   two sibling mirrors call load-bearing.)

6. **A hand-removed tactic worktree is NOT reclassified as repo-root.**
   `sr_node <id> tactic`, no worktree on disk; assert the log is
   `SESSION_REAP_NO_WORKTREE` (not `SESSION_REAP_REPO_ROOT_SESSION`) and that
   `wt_class=node-worktree` appears in `SESSION_REAPED` — the class comes from
   the graph, never from the filesystem.

7. **Direct-call coverage via `srn_run`** (`test-lib-session-reap.sh:751-935`) for
   at least the repo-root class, so `dispatch-node-reap`'s caller path — which
   invokes `session_reap_node` without the sweep's gates — is covered too.

Also add one case to
`.claude/skills/dispatch-propagate/scripts/test-dispatch-node-reap.sh` asserting
the CLI path takes no destructive action for a repo-root node, reusing
`dnr_setup` / `dnr_rm_calls` (`:30-59`, `:67-72`) and the `skip-self` precedent
(`:94-119`) for the "refuse before any daemon call, verified by the call log"
shape.

**Harness note:** the `git` PATH shim installed by `sr_write_shims`
(`test-lib-session-reap.sh:139-146`) already logs every `worktree remove` into
`$SR_CALLS` before exec'ing real git, so "assert the removal never happened" is
directly expressible — no new harness machinery is needed for it.

**Out of scope:** `test-dispatch-sweep.sh`'s wiring guard (N9a) and any change to
the sweep's own gate tests.

### Reuse

- `sr_line_of` (`test-lib-session-reap.sh:313-321`) and `sr_rm_calls` (`:323-328`)
  — the house "assert command NOT invoked" idiom.
- `sr_add_session` (`:222-226`), `sr_job` (`:236-248`), `sr_transcript` (`:251-254`),
  `sr_install_registry` (`:229-234`), `sr_mode` (`:219`), `sr_open_pr` (`:298-302`).
- `srn_run` and the direct-call block (`:751-935`); Test 18 (`:661-676`) and
  Test 28 (`:844-860`) as the closest structural templates.
- `dnr_setup` / `dnr_rm_calls` — `test-dispatch-node-reap.sh:30-59,67-72`.
- `sr_node` — added in Unit 1.

---

## Reuse

Consolidated (each is cited in the unit that uses it):

- `packages/intentionsutil/scripts/office-hours-graph:174-199` — `node_kind_on_main`,
  the canonical classifier and its refuse-to-guess posture.
- `packages/intentionsutil/scripts/office-hours-graph:344-358` — the launch-side
  tactic-vs-non-tactic branch this unit mirrors on the teardown side.
- `packages/intentionsutil/scripts/office-hours-select.ts:44-52,118-132` — the
  disposition contract documenting the same split, and `resolveSessionCwd`.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:648-655` —
  the second deliberate inline mirror of the frontmatter read.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:205-228` — the
  spawn arm that creates both populations (`--cwd "$PROJECT_ROOT"` vs `--cwd "$WT"`).
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:14-25,131` —
  the tactic-only path convention.
- `.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh:206-215` (`_lsr_log`),
  `:216-270` (the token contract header), `:277-286` (repo/worktrees root seams).
- `.claude/skills/dispatch-propagate/scripts/lib.sh` — `resolve_project_root`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-node-reap:45-48` — the
  verbatim token re-export that must stay in sync if a token is ever added.
- `.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh:66-146,
  222-328,661-676,751-935` — the fixture builders and assertion idioms.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-node-reap.sh:30-72,94-119`
  — the CLI-level fixture and the refuse-before-any-daemon-call precedent.

## Verification

CI coverage is already in place and needs no workflow edit:
`run-unit-tests.sh:88` sets `RUN_PR_SCRIPTS=true` for any changed path matching
`.claude/skills/dispatch-propagate/scripts/*`, and the `test-*.sh` glob under
`RUN_PR_SCRIPTS` (`:187`) then runs both suites below. (The explicit per-suite
list in `.github/workflows/unit-tests.yml:238-292` is only for SUTs that live
*outside* that scripts dir — this SUT does not, so do **not** add a step there.)

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-node-reap.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-sweep.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Non-vacuity check (manual, do this once during Unit 2).** Before landing Unit 1,
apply Unit 2's regression-guard case (case 2 above) against unmodified
`lib-session-reap.sh` and confirm it **FAILS** — the stray directory is removed
and `sr_line_of '^git-worktree-remove '` is not `none`. A guard that passes on
today's `HEAD` is measuring nothing (this repo has a recorded trap about
negated-grep fences that pass vacuously; the same hazard applies to an
absence-assertion whose precondition was never established). Record the observed
failure in the PR body.

**Manual / observe-in-production, after merge.** These are judgment checks, not
gates:

- Over the following week, grep `tmp/dispatch-sweep.log` for the two new tags.
  `SESSION_REAP_REPO_ROOT_SESSION` appearing for strategy / office-hours-graph
  sessions is the change working as designed.
- `SESSION_REAP_NODE_KIND_UNKNOWN` should be rare and transient. A node id
  recurring under that tag across many sweeps is a real anomaly (a session named
  for something that is not a node on `origin/main`) and deserves its own tactic —
  file it in the graph, never in a side channel.
- Confirm no `git worktree remove` is ever issued with the repo root or an empty
  path as its argument: `grep 'SESSION_REAP_WORKTREE_REMOVED' tmp/dispatch-sweep.log`
  and check every `worktree=` value sits under `.claude/worktrees/`.
- Do **not** use "`tactic-fleet-alarm-busy-stall` stops declining" as evidence of
  anything; per the Context correction that symptom has a different cause and
  already stopped on 2026-08-09.

**Follow-ups to name in the PR body, not to implement here:**

- the `claude rm` `rc=1`-with-session-still-listed decline — nearest existing home
  `tactic-self-close-reap-silent-noop`; file a new tactic if the rc=1 variant does
  not fit there;
- consolidating the three inline `kind:`-at-`origin/main` mirrors
  (`office-hours-graph`, `lib-standdown-recheck.sh`, `lib-session-reap.sh`) into
  one owned primitive, which requires first settling the
  `packages/intentionsutil` ↔ `.claude/skills/dispatch-propagate` dependency
  direction that `office-hours-graph:11-13` currently forbids.
