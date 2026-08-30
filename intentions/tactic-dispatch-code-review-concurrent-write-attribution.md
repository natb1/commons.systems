---
id: tactic-dispatch-code-review-concurrent-write-attribution
kind: tactic
statement: dispatch-code-review's before/after git-stash-create window has no
  exclusivity lock on the reviewed worktree, so any concurrent writer active
  during the nested claude -p /code-review invocation has its edits silently
  attributed to the built-in review's fixed[] output and committed/pushed under
  review-fix's name
owner: ai
status: raw
parent: null
rationale: "Surfaced as a red-team finding (red-team-4) during the review-fix
  pass on PR #3007 (tactic-review-code-review-invocation-contract), verified
  upheld by the review Workflow's adversarial skeptic, and deferred rather than
  auto-fixed because closing it requires a worktree-locking mechanism (flock or
  reuse of worktree_has_live_session) beyond a same-pass Opus fix's scope."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    SCOPE MOSTLY LANDED, RESIDUAL UNRATIFIED — no plan authored, no phase
    written.

    Parked by the 2026-08-19 /align-tactics per-node (tactic-mode) run. Every
    claim

    below was verified against origin/main 43cf33f6 in this run, not taken from
    the

    node body's word.


    WHAT SHIPPED. The node's named failure mode — a concurrent writer active
    DURING

    the nested `claude -p '/code-review --fix'` invocation being silently
    attributed

    to the review's fixed[] output — is closed. PR #3078 (merge fbb9be83,

    2026-08-13, carried by the SIBLING node
    tactic-review-effort-max-detached-resume-poll,

    status codified / phase done) shipped exactly the mechanism this node's own

    'Shape of a fix' bullet 1 proposes:


    - `WORKTREE_CODE_REVIEW_LOCK_SUFFIX` / `worktree_code_review_lock_path`
      (lib-claude-agents.sh:1066-1083) derive a
      `<worktrees-root>/<worktree-basename>.code-review-lock` sidecar, beside the
      reviewed tree rather than inside it.
    - dispatch-code-review:393-422 resolves it from GIT_ROOT and hard-exits
    rather
      than running unlocked when `flock` is missing inside a dispatch worktree.
    - :1089-1099 launches the detached child under `setsid ... flock -w 1 -E
    111`,
      so the KERNEL holds the lock for the child's whole lifetime and releases it on
      any death — the property no bookkeeping file has.
    - :1131-1139 reports a lost acquire as its own exit 6, never folded into
    exit 1.

    - `worktree_occupancy_state` (lib-claude-agents.sh:1194-1226) probes the
    lock
      BEFORE the daemon query and reports `live` with reason `code-review-lock`, so
      every existing dispatch claim path inherits the exclusion through the one
      predicate they already route through.

    Bullet 1 is landed in full, and keyed on the reviewed WORKTREE rather than
    on

    $OUT_DIR as the node proposed — strictly better. The script's own header at

    dispatch-code-review:121-157 names this node's failure scenario verbatim

    ("`git diff <before-image>` attributes the intruder's changes to the
    review") as

    the thing that lock closes. Bullet 2 ("Consider whether the before-image
    should

    also record a hash/manifest of tracked files outside the diff") was recorded
    as

    undecided and remains unlanded.


    EVERY LOCATION ANCHOR IN THE NODE BODY IS STALE. dispatch-code-review is now

    1411 lines; the body-cited :141 and :227 are header-comment prose about kill

    sites, and review-fix/SKILL.md:263-271 is now the deferred-finding

    carry-forward rule, not the exclusivity assertion. The real sites today:

    before-image capture at dispatch-code-review:951-995, launch at :1102, Step
    6

    derivation at :1338-1370, caller-discipline prose at
    review-fix/SKILL.md:613-620,

    and the allow-list consumer at review-fix.js:1893-1909 (the body cites

    review-fix.js:1080).


    WHAT ACTUALLY REMAINS — three windows, verified this run.


    (a) PRE-LAUNCH. `BEFORE` (`git stash create`, falling back to `git rev-parse

    HEAD`) and the untracked-before snapshot are both computed in the PARENT at

    :967-995, before `"${LAUNCH_CMD[@]}" &` at :1102 even forks — so the child's

    flock is not yet held. A write landing in fork/exec latency + the `flock -w
    1`

    wait + the up-to-10s RUN_PIDFILE poll (LAUNCH_ATTEMPTS=50 x

    LAUNCH_INTERVAL_S=0.2, :1111-1127) is in neither baseline and is

    indistinguishable from the review's own edit at Step 6.


    (b) POST-RELEASE. Step 6's `git diff --name-only "$BEFORE"`, the `comm -13`

    untracked union, and `git diff "$BEFORE" > fix.patch` (:1338-1370) run in
    the

    COLLECTING invocation and take no lock — the child's flock released when it

    exited. When the collecting call is a later, separate Bash invocation in

    review-fix's bounded re-invocation loop (up to CR_POLL_CAP attempts at
    effort

    `high`), there is real wall-clock exposure covered only by

    review-fix/SKILL.md:613-620's prose ("Between the launching call and the

    collecting call the session must do nothing else"), which is caller
    discipline

    for ONE orchestrating session and says nothing about a second worker.


    (c) NOT-A-DISPATCH-WORKTREE. When GIT_ROOT's parent is not a

    `.claude/worktrees` root, LOCK_FILE stays empty and the entire run is
    unlocked

    — by EXPLICIT recorded design (:403-414, "there is no dispatch claim to

    protect"), for the test suite's throwaway repo and hand-run reviews in a
    plain

    clone.


    WHY THIS PARKS RATHER THAN PLANS. Planning the node as written authors units

    that rebuild a shipped lock — dead work. Planning the residual substitutes
    new,

    narrower scope for the author's ratified scope: (c) is already an accepted
    race,

    so whether (a) and (b) are defects to close or races to accept on the same

    ground is precisely an author judgment, not a mechanical implementation
    choice.

    Note also that review-fix.js:1893-1909 (`allowedTouched = new
    Set(cr.touched_files

    || [])`) trusts touched_files completely and has no independent signal to

    distinguish a concurrent writer from the review's own edit, so any fix must
    land

    upstream in dispatch-code-review's derivation — the consumer side is not a
    place

    to hedge.


    THIRD INSTANCE OF THE SAME SHAPE. A draft whose recorded substance shipped
    under

    a sibling carrier node has now parked three times with no ratified
    convention:

    tactic-audit-permission-friction (2026-08-18, 9ced5777),

    tactic-code-review-detached-node-lock (2026-08-19, 63640767 — fully landed
    under

    the same PR #3078), and this node. This is the first PARTIALLY landed case,
    which

    is a further wrinkle the graph does not record: the ratified fix shape is
    shipped,

    the ratified failure mode is narrowed but not eliminated, and no recorded
    rule

    says whether that is a completion record, a re-scope, or a plan.
  since: 2026-08-19
  recommendation: >-
    Two author rulings, then re-run /align-tactics on this node.


    RULING 1 — which of residual windows (a) and (b) are in scope. Three
    options,

    in ascending cost:

      (i)  Accept (a) and (b) on the same ground (c) is already accepted, and
           retire this node as a completion record. Cheapest, and defensible: the
           exposure in (a) is bounded by fork/exec + a 1s flock wait + a <=10s
           poll, and (b) is bounded by review-fix's own serialized Step 1b.
      (ii) Add a fail-closed re-check rather than widening the lock — in the shape
           of the existing "ABSENT is not CLEAN" guard at dispatch-code-review:883-920:
           once the lock is confirmed held (RUN_PIDFILE appears), re-snapshot
           HEAD + `git status --porcelain` and exit 2 on divergence from the
           pre-launch baseline, rather than silently unioning the difference into
           touched-files.txt. This is bullet 2 of the node body, made concrete.
      (iii) Widen the lock's span so the PARENT acquires the sidecar flock before
           the before-image capture at :967 and holds it through Step 6's
           derivation at :1338-1370. Note this is structurally harder than it
           looks: the collecting call is a SEPARATE process invocation, so a
           parent-held flock cannot span it without a lock the parent re-acquires
           on each invocation — which then races the child's own hold.

    Reuse, do not re-derive: `worktree_code_review_lock_path`

    (lib-claude-agents.sh:1066-1083) is the single canonical sidecar derivation

    shared by writer and reader. Any fix must key off it rather than adding a
    second

    lock mechanism — a second mechanism would also cut against

    strategy-graph-native-dispatch's recorded condition that concurrent-session

    detection stay in the shared claimed-set predicate rather than in guards

    embedded per phase skill.


    RULING 2 — the standing convention for a draft whose substance shipped under
    a

    sibling carrier. Rule on this node together with
    tactic-audit-permission-friction

    (9ced5777) and tactic-code-review-detached-node-lock (63640767) in one
    sitting,

    and record the outcome as a clarification on strategy-graph-native-dispatch
    so a

    fourth instance is dispositioned mechanically instead of parking again. The

    ruling must cover the PARTIALLY-landed case this node introduces: retire as
    a

    completion record plus file a fresh node for the verified residual, versus
    author

    re-statement of this node down to its residual, versus plan-as-is.


    If ruling 1 lands on (i), the mechanical close for this node is the same as
    the

    sibling's: there is no separate PR to stamp (the work landed under

    tactic-review-effort-max-detached-resume-poll / PR #3078), so move `status:
    raw`

    -> `codified` and `phase: null` -> `done` via dump-node.ts + jq-patch +

    write-node.ts + `graph-commit -C <repo-root>` — the phase ladder has no

    null->done transition, so transition-node cannot do it.


    Do NOT prune: this run's verified three-window residual analysis and the
    stale

    anchor corrections above are the only written record of them.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# dispatch-code-review's before/after git-stash-create window has no exclusivity lock on the reviewed worktree, so any concurrent writer active during the nested claude -p /code-review invocation has its edits silently attributed to the built-in review's fixed[] output and committed/pushed under review-fix's name

Draft finding, not yet decomposed — recorded per the standing rule that findings
land as graph nodes, never journald or plan prose alone.

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-code-review:141` (the `git stash create` before-image capture) through `dispatch-code-review:227` (the invocation), and `.claude/skills/review-fix/SKILL.md:263-271` (the exclusivity assertion in prose).
- **Source PR**: #3007 (`tactic-review-code-review-invocation-contract`), surfaced by the red-team finder during that PR's own `/review-fix` pass.
- **Failure scenario**: The script captures a before-image (`git stash create`) and, after the nested `claude -p '/code-review ... --fix'` session returns, derives `touched-files.txt` and `fix.patch` from a plain `git diff` against that before-image — attributing *everything* that changed in the window to the built-in's own edits. Nothing enforces the "exclusive stage, no concurrent writer" assumption SKILL.md states as a design property: no lock file, no `worktree_has_live_session` check, no PID/session guard. This project's own worktrees are documented to host concurrent sessions (duplicate `/implement` workers on one worktree, background jobs, `qa-fix` running the PR's own build/test scripts in the same tree). Any writer active in that window — a stray background job, a leftover test artifact, or the PR's own build script — has its edits folded into `touched-files.txt`, which becomes the `allowedTouched` allow-list (`review-fix.js:1080`) that authorizes `fixed[]` entries, gets captured into `fix.patch`, and is committed and pushed by Step 3 attributed to the review.
- **Adversarial verdict** (from the review-fix Workflow's `red-team-4` skeptic pass): classified `Deferred` — real and code-verified, but closing it needs a genuine exclusivity mechanism (e.g. `flock` on a lockfile under the out-dir, or reusing the existing `worktree_has_live_session` check) rather than a same-pass text/logic fix, so it was not auto-fixed by the Opus fix stage in PR #3007.

## Shape of a fix (not yet decided — decompose in `/align-tactics`)

1. Take an exclusive lock (e.g. `flock` on a lockfile under `$OUT_DIR`, or reuse `worktree_has_live_session`) around the invoke/verify window in `dispatch-code-review`, and abort with a distinct exit code if it cannot be acquired.
2. Consider whether the before-image should also record a hash/manifest of tracked files outside the diff, so an unexpected mutation to an untouched file is detectable even without a lock.


## Author ruling, 2026-08-29 — the sibling-carrier convention, and what it does NOT settle here

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 1").** The standing convention
for a draft whose substance shipped under a sibling carrier is: **completion
record** — stamp `execution.completion` with the carrier PR's merge facts, move
`status: raw → codified` and `phase: null → done`, do not prune. That discharges
this park's RULING 2, and it is the same ruling applied to
`tactic-code-review-detached-node-lock`, `tactic-review-cheap-fix-disposition`
and `tactic-audit-permission-friction`.

**It does NOT discharge this park's RULING 1.** This is the partially-landed
case: the ratified fix shape shipped, but the ratified failure mode is **narrowed,
not eliminated**, and both residual windows are verified live at origin/main —
not speculative:

- **(a) PRE-LAUNCH.** The `BEFORE` image (`git stash create`) and the untracked
  snapshot are computed in the parent at `dispatch-code-review:967-995`, **before**
  `"${LAUNCH_CMD[@]}" &` at `:1102` forks — so the child's `flock` is not yet held.
  Exposure = fork/exec + `flock -w 1` + a <=10s `RUN_PIDFILE` poll (`:1111-1127`).
- **(b) POST-RELEASE.** Step 6's derivation at `:1338-1370` runs in the
  **collecting** invocation and takes no lock — the child's flock released on exit.
  Covered only by prose caller discipline in `.claude/skills/review-fix/SKILL.md`
  — section "1b. Run the built-in `/code-review` as an exclusive pre-stage", the
  paragraph beginning "Between the launching call and the collecting call the
  session must do nothing else". (That prose was formerly under a section titled
  "the detached await contract"; the SKILL was rewritten 2026-08-29 and the old
  anchor no longer resolves. Re-anchored 2026-08-30.)
- **The consumer trusts the derivation completely.**
  `.claude/workflows/review-fix.js:1893-1909` does
  `allowedTouched = new Set(cr.touched_files || [])`, so a concurrent writer's
  edits are indistinguishable from the review's own.

Until RULING 1 is answered, **this node is not closed** and planning it as written
is dead work — authoring units that rebuild a shipped lock. The three options, in
ascending cost, stay on the park unchanged: (i) accept (a) and (b) on the same
ground (c) is already accepted, and retire this node as a completion record;
(ii) add a fail-closed re-check in the shape of the existing "ABSENT is not CLEAN"
guard at `dispatch-code-review:883-920`; (iii) widen the lock's span so the PARENT
acquires the sidecar flock before the before-image capture and holds it through
Step 6.
