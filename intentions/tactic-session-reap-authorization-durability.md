---
id: tactic-session-reap-authorization-durability
kind: tactic
statement: The session-reap sweep must derive its authorization from durable
  state, not from a job dir with an independent lifetime -- gates 3 and 4 both
  read `<jobs-root>/<jid>/`, so a terminal session whose job dir is absent or
  nameless can never become a sweep candidate and its registration strands
  forever, holding its node against every launch path
owner: ai
status: raw
parent: null
rationale: "Measured 2026-08-05 while reaping the fleet by hand at the author's
  instruction; ELEVEN terminal sessions had accumulated unreaped, the oldest
  holding a node whose PR merged 2026-07-26 -- roughly ten days. Every one was
  safe to reap: worktree clean, `git diff origin/main HEAD -- . ':!intentions'`
  EMPTY, and its PR MERGED, which is gate 6 in full. So the reap-safety gate was
  never the blocker; the sweep never considered these sessions AT ALL. THE
  MECHANISM, read off lib-session-reap.sh's own gate list (lines 75-101): gate 3
  requires `<jobs-root>/<jid>/state.json`'s `.name` to equal the node id, and
  gate 4 requires a valid `<jobs-root>/<jid>/node-terminal` marker naming that
  node. Both read the job dir, keyed on the registry `.id`. The session
  REGISTRATION and the JOB DIR therefore have independent lifetimes, and the
  registration outlives the dir. Once the dir is gone or nameless there is no
  path back: the sweep's candidate set cannot include the session, so it is not
  merely delayed but permanently stranded -- an absorbing state. THE CENSUS,
  taken on the live host the same night: 27 job dirs under ~/.claude/jobs.
  TWENTY of them have an EMPTY `.name` in state.json, so gate 3 is unsatisfiable
  for them by construction. Exactly ONE carries a `node-terminal` marker at all,
  so gate 4 is satisfiable for at most one. The sweep's candidate set is thus
  close to empty regardless of how clean the worktrees are -- which is exactly
  what eleven stranded sessions look like from the outside. WHY IT IS NOT
  COSMETIC, and this is the part that makes it a containment defect rather than
  tidiness: tactic-stopped-session-blocks-node (phase: done) deliberately
  establishes that a stopped-but-not-removed session MUST continue to block its
  node's concurrent execution, and worktree_has_live_session reads the
  REGISTERED view precisely so a node is never double-booked. That posture is
  correct. Its consequence is that every stranded registration is a node held
  out of selection indefinitely. Two of the eleven sat on ONE node
  (tactic-phase-terminal-requires-disposition), which is the duplicate-session
  invalid state the 2026-08-05 concurrency ruling governs, reached by accretion
  rather than by a racing launch. The plan's own standing verification criterion
  -- no node worktree carries more than one registered session -- was failing
  because of this, and could not be made to pass by any autonomous path. IT ALSO
  FALSIFIES A RECORDED PREMISE. tactic-terminal-declaration-verified-
  against-node states that the marker-missing direction `fails safe
  (dispatch-self-close HOLDs)` and is `the opposite (safe) direction` of the
  defect it covers. Against wrongly reaping, yes. Against slot exhaustion, no:
  missing evidence strands the node forever and no fuse fires, because nothing
  is watching for a session that the sweep never enumerated. `Fails safe` is
  true only with respect to the loss it was reasoned about. Dedup: a
  find-or-create pass found NO owner. The three nearest are each a DIFFERENT
  link in the same chain -- tactic-qa-fix-node-terminal-declaration (phase: qa)
  covers a skill that never WRITES the marker;
  tactic-terminal-declaration-verified-against-node (raw) covers a marker
  written while the graph write FAILED, the false-positive direction; and
  tactic-stopped-session-blocks-node (done) establishes the blocking posture
  that makes stranding costly. None addresses the marker's STORAGE outliving
  neither the session nor the claim. Fix directions to weigh at planning time:
  (a) derive the terminal disposition from durable node state at origin/main --
  phase, execution.markers, execution.pr merge state -- so authorization needs
  no job dir, which is the same remedy
  tactic-terminal-declaration-verified-against-node reaches for from the other
  side and would close both directions at once; (b) keep the marker but write it
  somewhere with the session's lifetime rather than the job's; (c) add a
  reconciling arm that enumerates TERMINAL registrations with no job dir and
  routes them to the invalid-state lane, which already owns the no-declaration
  class, so the absorbing state at least drains."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a containment defect that
    strands worker slots and manufactures duplicate-session invalid states by
    accretion -- same band as the other dispatch-containment fixes."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "(/align-tactics tactic-target drift review, 2026-08-09, immediately
    after the same day's office-hours ratification.) The ratified design is
    accepted; ONE material premise inside it is unratified and the plan's shape
    depends on it: THE COST OF THE CLAIM WRITE SITE. The ratification says
    'provision-node-worktree writes a claim (session id, job id, ACTUAL worktree
    path, claimed_at)'. Verified on this checkout 2026-08-09: that path performs
    NO graph write today (no graph-commit / write-node / writeNode anywhere in
    .claude/skills/dispatch-propagate/scripts/provision-node-worktree; its only
    claim-time write is reservation_mark_spawned into the file ledger at
    dispatch-graph-execute:159). So the ratified site adds a whole graph-commit
    to EVERY node-worker spawn, and graph-commit's own header
    (packages/intentionsutil/scripts/graph-commit:11-27) prices one invocation
    as commit → pull --rebase origin main → push to a graph/** scratch branch →
    poll four required CI checks green on the SHA (~30-60s) → fast-forward onto
    main, all inside a GLOBAL landing lock (refs/graph/landing-lock;
    graph-commit:237-240, wait bound MAX_PUSH_ATTEMPTS*(CHECK_TIMEOUT+30)).
    Every spawn would therefore pay a CI-stamped landing and concurrent spawns
    would serialize behind one global lock. The strategy's contention condition
    prices intentions/ write cost as 'total resolution cost — retries plus model
    spend — stays negligible at fleet concurrency', so this is a recorded,
    human-decided condition the design pushes against. The sitting weighed the
    design only against two CORRECTNESS alternatives (inferring authorization
    from durable node phase; relocating the marker to durable storage) and did
    not address cost. This is not a nit invented by this session: the sibling
    tactic-claim-containment-durable-anchor has been born-parked since
    2026-07-31 on EXACTLY this question ('where the durable claim anchor
    lives'), its park text prices option (a) — the graph field, i.e. verbatim
    the design ratified here — with this same spawn-path cost against this same
    condition, and that park is still unresolved. Planning now would decide a
    sibling's parked author question by side effect, on the one axis the author
    has never ruled on. WHY IT GATES THE PLAN RATHER THAN BEING PLAN-INTERNAL:
    the answer selects the write site, and the write site IS migration step 2
    (the first schema step). Options to put to the author: (a) as ratified —
    per-spawn write in provision-node-worktree, accepting one CI-stamped,
    lock-serialized graph-commit per spawn; (b) batch a tick's claims into ONE
    graph-commit issued by the selection loop (graph-commit already accepts
    multiple node ids), amortizing the landing but moving the write off
    provision-node-worktree and leaving a spawn briefly unclaimed; (c) a
    different anchor (the reservation-ledger extension or the reconciler-derived
    shape recorded as options (b)/(c) in
    tactic-claim-containment-durable-anchor's park). RECOMMENDATION: run ONE
    office-hours sitting that answers this single question and, in the same
    sitting, clears tactic-claim-containment-durable-anchor's park with the same
    answer — the two are the identical question and answering them together
    costs one sitting instead of two. Two further things that sitting should
    settle, both recorded here so a fresh session need not re-derive them.
    FIRST, SUBSUMPTION: the ratified claim/release record satisfies
    tactic-claim-containment-durable-anchor's whole statement (anchoring the
    freeze in durable graph state instead of the daemon-backed registry read at
    lib-claude-agents.sh:770-876) as well as
    tactic-terminal-declaration-verified-against-node's, which the ratification
    already names; the strategy's router-failure-containment condition names
    those same two tactics as the two whose landing closes its containment
    limbs, and tactic-router-failure-fuses (raw, born-parked 2026-08-03) records
    an ordering precondition on both. A per-node session cannot edit any of
    them, so their closure/pruning and the fuses node's ordering blocker must be
    re-evaluated by that sitting or a follow-up /align-tactics round once this
    node's implementation lands. SECOND, SPLIT STEP 1: migration step 1 (make
    lib-session-reap.sh read a recorded worktree path instead of deriving
    \"$worktrees_root/$name\" — still unfixed at lib-session-reap.sh:288-291) is
    independent of the claim schema, small, and causing active harm today (it is
    the defect that made tactic-fleet-alarm-busy-stall decline every 15 minutes
    for two hours); consider splitting it into its own tactic so it is not held
    behind this ratification. Everything else needed to plan is already gathered
    and needs no re-derivation: Execution's additive optional-field precedent
    (schema.ts:518-539 with fix/conflict/completion, validators at 649-676, call
    site validateExecution at 697-711), apply-fix-state.ts /
    apply-conflict-state.ts as the CLI-primitive template, applyNodeTransition's
    single-writeNode transaction boundary
    (apply-node-transition.ts:132-135,163-164,200-201) as the shape that makes
    release-with-disposition atomic, reap gates 3/4 at
    lib-session-reap.sh:541-572 and the byte-identical marker check at
    dispatch-self-close:203-220 that must be dual-read in migration step 3,
    mark-node-terminal:53-79's eight-member enum versus the ratified five-member
    release enum (mapping still to be worked out) plus its three test files
    (test-mark-node-terminal.sh, test-align-tactics-terminal-marker.sh,
    test-dispatch-terminal-gap-audit.sh) that step 5 must retire or repoint, and
    dispatch-terminal-gap-audit as the existing report-only diagnostic to extend
    for migration step 4's observe pass."
  since: 2026-08-09
  recommendation: null
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Session-reap authorization must outlive the job dir
