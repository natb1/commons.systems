---
id: tactic-graph-read-at-ref-cli
kind: tactic
statement: Expose storeAtRef as a CLI — read node fields and query nodes by
  predicate at a git ref (default origin/main) — so the doctrine-mandated fresh
  read has a scripted path instead of hand-rolled `git show
  origin/main:intentions/<id>.md` plus sed
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-11 in the /align round that widened the
  mechanical-floor doctrine to session-facing graph operations. Highest measured
  yield of the four primitives retained that round. storeAtRef
  (packages/intentionsutil/scripts/lib-store-at-ref.ts) already exists and has
  five script consumers (office-hours-select.ts, read-sensors.ts, verify-landed,
  render-rsi-plan.ts, and its own test), but there is NO CLI, while dump-node.ts
  resolves its store from import.meta.url and so reads the worktree copy. The
  gap is therefore structural: doctrine repeatedly mandates reading at
  origin/main and no script can do it, so every compliant read is hand-written
  shell. Measured in the 2026-08-10/11 corpus: 270 Bash calls hand-rolled `git
  show origin/main:intentions/`, 369 occurrences; sessions were observed writing
  full-graph scans as bash loops over `git ls-tree` plus per-node `git show`
  plus `sed`. The query half (phase, blocked_by, serves, body match) is what
  those loops were reimplementing per session."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Is this node's rationale still accurate — specifically its claim that
      dump-node.ts resolves its store from import.meta.url and so reads the
      worktree copy?
    answer: '(Recorded 2026-08-21 /align-tactics tactic-mode round; verified at
      origin/main 875b68d4.) NO — that clause is REFUTED, but the node is NOT
      stale by resolution and its deliverable survives intact. REFUTED:
      dump-node.ts now REQUIRES `--dir <intentions-dir>` with no default and
      derives its repo root from that argument via `git rev-parse
      --show-toplevel`; its own header says so in the past tense ("It used to
      resolve <repoRoot>/intentions from import.meta.url, which made the tree
      READ a property of WHICH COPY of this script ran rather than of what the
      caller asked for"). The conversion landed in fe0b1c4d, PR #3095 "pr1:
      graph write-path integrity", 2026-08-15T11:45:20-04:00, which also carried
      the sibling tactic-explicit-ref-graph-reads to phase done;
      validate-graph.ts, write-node.ts and clear-park converted in the same
      change. SURVIVING, re-verified live this round: (1) lib-store-at-ref.ts
      still has NO CLI entrypoint — no process.argv handling and no
      `import.meta.url === pathToFileURL(process.argv[1])` main guard anywhere
      in the file; (2) no CLI wrapper for it exists anywhere else in the repo;
      (3) dump-node.ts, even with --dir required, reads a MATERIALIZED
      DIRECTORY, never an arbitrary git ref, so it still cannot perform the
      doctrine-mandated read at origin/main. THE THESIS HOLDS; ONLY ITS
      SUPPORTING SENTENCE MUST BE REWRITTEN: the gap is "no CLI exposes a read
      AT A REF", not "dump-node.ts reads the wrong tree". Any plan must
      re-derive its premise from the current tree rather than from the rationale
      as written.'
  - question: Is this node's storeAtRef consumer count accurate?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode round; verified at
      origin/main 875b68d4.) No — it is overstated, and one named consumer no
      longer exists. The rationale claims \"five script consumers
      (office-hours-select.ts, read-sensors.ts, verify-landed,
      render-rsi-plan.ts, and its own test)\". render-rsi-plan.ts does not exist
      anywhere in the repository: it was deleted by the rsi-family collapse, PR
      #3074 (merged 2026-08-13, retire commit 0f94b85f), two days AFTER this
      node's 2026-08-11 rationale was written. THE LIVE SET is THREE production
      consumers, confirmed by reading each call site rather than by grepping
      filenames: office-hours-select.ts (real import, line 90), read-sensors.ts
      (real import, line 54), and verify-landed (a bash script reaching the
      helper through an INLINE dynamic `await import(libPath)` shim at line 242
      — itself further evidence for this node's premise, since a shell script
      had to hand-roll a JS shim precisely because no CLI exists). Plus its own
      test packages/intentionsutil/test/store-at-ref.test.ts, plus
      packages/intentionsutil/scripts/test-park-node.sh, which COPIES the lib
      into a seeded harness (line 231) and is a test dependency, not a
      production consumer. METHOD WARNING, recorded because this session got it
      wrong first: a plain grep for
      `lib-store-at-ref|readNodeAtRef|listNodesAtRef` also matches clear-park,
      .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run,
      test-lib-frozen-session-park.sh and test-lib-standdown-recheck.sh — in ALL
      FOUR the only hits are PROSE COMMENTS describing verify-landed's
      behaviour, not imports. This round's own caller note initially claimed
      five live consumers on that basis and was wrong; the correct figure is
      three. The argument the count supports — a load-bearing helper with no CLI
      — is unaffected."
  - question: Is serving-strategy clarification 242 still accurate about which
      explicit-ref readers are unconverted, and does its scope ruling for this
      node still bind?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode round; verified at
      origin/main 875b68d4.) The PARTITION RULING STANDS AND STILL GOVERNS; only
      its unconverted-files list is stale. Clarification 242 rules that
      \"tactic-graph-read-at-ref-cli adds a NEW CLI (storeAtRef) rather than
      editing these readers, so it is separable under any shape\". That
      separability rests on this node adding a NEW ARTIFACT, not on the four
      readers' conversion state, so it is untouched by what follows. STALE: 242
      lists validate-graph.ts:73, write-node.ts:18-22, dump-node.ts:35-40 and
      clear-park:99-100 as \"Still unconverted as of this sitting\". All four
      are converted on the current tree, and those line anchors have drifted.
      SETTLED BY COMMIT TIMESTAMPS — the ruling was NOT already behind when
      made: clarification 242 landed in 42884460 at 2026-08-14T22:35:04-04:00;
      the conversion landed in fe0b1c4d (PR #3095) at 2026-08-15T11:45:20-04:00,
      roughly THIRTEEN HOURS LATER. It was accurate when written and was
      overtaken the following morning. Promoting this correction into the
      strategy's own record is an office-hours/author job; a per-node session
      cannot write the strategy, so it is recorded here."
  - question: What failure mode does a query CLI inherit from listNodesAtRef, and
      must the plan decide it explicitly?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode round; verified at
      origin/main 875b68d4.) It inherits an ALL-OR-NOTHING enumeration failure,
      and yes — the plan must state the choice rather than leave it implicit.
      listNodesAtRef is STRICT by deliberate design: it calls listNodesStrict,
      not the tolerant listNodes, so a single malformed or unvalidatable node
      ANYWHERE in the store at that ref propagates its IntentionSchemaError
      uncaught and fails the whole enumeration. The helper's own header records
      why: it serves gate and selection callers where absence from the
      enumerated set carries load-bearing \"pass\" semantics (blockersComplete
      reads an absent blocked_by id as complete), so silently skipping a bad
      node would be worse than failing. That is correct for gate callers and a
      real ergonomic problem for an interactive query CLI, where one unrelated
      bad sibling blocks every query. NOTE THE ASYMMETRY: readNodeAtRef is
      deliberately NOT built on listNodesAtRef for exactly this blast-radius
      reason (its single-node path uses `git cat-file -e` + `git show`), so the
      single-node read mode does NOT inherit the problem — only the
      predicate/enumeration mode does. The plan should decide and record whether
      query mode keeps strict semantics or offers a tolerant flag."
  - question: Does any sibling tactic already claim or implement this deliverable —
      is this node a duplicate?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode round; verified at
      origin/main 875b68d4.) No. All fifteen files under intentions/ mentioning
      storeAtRef, lib-store-at-ref, listNodesAtRef or readNodeAtRef were
      checked, and every near neighbour scopes itself narrowly and to a
      different concern: tactic-graph-execute-fresh-main-read (phase qa) uses
      the helper as the MODEL for materializing a store at a ref, not as a
      drop-in, for a check-node-selection.ts freshness gate;
      tactic-office-hours-select-fresh-main (phase main-qa) is a
      freshness-provenance slice; tactic-graph-refsplit-read-coherence
      (born-parked) is about refreshing the shared GRAPH_WT after a land so a
      session can read its own write back;
      tactic-graph-worktree-implicit-invocation (codified, phase implement) — a
      sibling minted in this node's own 2026-08-11 round — addresses
      worktree-path restatement, not ref reads; and
      tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land
      (codified, phase implement) is one consumer's stale-read defect and would
      be a CONSUMER of this CLI rather than a duplicate of it. COVERAGE BOUND,
      recorded rather than left implicit: the rationale's corpus figures (270
      Bash calls hand-rolling `git show origin/main:intentions/`, 369
      occurrences) are a 2026-08-10/11 measurement over 797 session transcripts
      and 164MB. Re-running that scan was out of proportion for this pass, so
      those numbers stand as plausible-but-unconfirmed, NOT as re-verified
      fact."
  - question: What is the serving strategy's maintenance-burden band actually doing,
      measured over git history rather than asserted from a single sample?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode round; verified at
      origin/main 875b68d4.) It is breached and RISING, and the rise is almost
      entirely self-generated. Rather than take one sample, this round REPLAYED
      the band at each of the last 40 intentions-touching commits through
      listNodesAtRef + strategyBacklogBand — the derivation the condition itself
      specifies. Monotonically non-decreasing across all 40: 96/302 = 31.79%
      (c9bf5320, 2026-08-20T13:59) → 140/316 = 44.30% (875b68d4,
      2026-08-21T14:40), crossing the 35% ceiling at 9bb5bb8b (2026-08-20T14:59,
      108/308 = 35.06%) and never returning. THE DENOMINATOR IS FLAT AT 316 for
      the last 20 of those commits while the numerator went 127 → 140 (draft 92
      → 79, born-parked 44 → 56, open 83 → 84, done 97 → 97) — so not one point
      of the recent rise is new tactics being filed; every point is a park
      converting its own draft target. Because classifyTactic (census.ts:13-18)
      scores born-parked as backlog and draft as neither, FINALIZING a draft
      would have raised the numerator by exactly the same 1 — the band cannot
      distinguish a park from a finalize, so every disposition of a draft except
      pruning looks identical to it. SECOND FINDING: `done` for this strategy
      has been frozen at 97 since 5f8dbc0a (2026-08-19T15:41), and the band was
      healthy at 21-25% for the eight days 2026-08-11 → 2026-08-19 before
      breaking inside 48 hours. Dispatch has been PAUSED since 2026-08-10 11:51,
      so the non-increasing limb cannot recover by execution while every
      /align-tactics selection adds to the numerator. ROBUSTNESS, four ways, all
      still above the ceiling at 875b68d4: excluding the 13 id-suffix
      observation carriers (/-drift-observations$/) → 127/303 = 41.91%;
      excluding the 29 reason-self-described carriers → 111/287 = 38.68%;
      excluding every tactic-invalid-state-rc-* node → 138/310 = 44.52% (it
      RISES); all three together → 113/285 = 39.65%. Removing the entire 36-node
      post-2026-08-20 park wave from BOTH sides → 104/280 = 37.14%, still
      breached. COUNTING NOTE: 21 born-parked reasons mention the band but 7 are
      observation carriers merely discussing it; the blocked-on-the-band count
      is 15 including this node."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "PARKED on TWO independent grounds, neither of which is a defect in this
    node. NO PLAN WAS AUTHORED. This node's deliverable was verified live this
    round and SURVIVES intact: lib-store-at-ref.ts still has no CLI entrypoint
    (no process.argv handling, no import.meta.url main guard), no CLI wrapper
    for it exists anywhere else in the repo, and dump-node.ts — even with --dir
    now required — reads a MATERIALIZED DIRECTORY, never an arbitrary git ref,
    so it cannot perform the doctrine-mandated read-at-origin/main this node
    exists to script. The gap is real and unfilled. GROUND A — SIDE A: a
    recorded condition of the serving strategy has failed, measured.
    strategy-graph-native-dispatch ARMED (2026-08-05) a maintenance-burden band:
    \"the open machinery-defect population — open (phase set, not done) plus
    born-parked tactics serving this strategy — stays at or below 35% of all
    tactics serving this strategy, and is non-increasing across consecutive
    samples derived from intentions/ git history at read time.\" It measures
    FALSE ON BOTH LIMBS. CEILING: re-measured on the CALLER thread through the
    canonical census functions (listNodesAtRef from
    packages/intentionsutil/scripts/lib-store-at-ref.ts feeding
    strategyBacklogBand/classifyTactic from
    packages/intentionsutil/src/census.ts, imported directly rather than shelled
    out) at origin/main 875b68d4: 140/316 = 44.30%, a 9.30-point breach of the
    35% ceiling. NON-INCREASING: this round did NOT rely on commit-message
    prose. It REPLAYED the band at every one of the last 40 intentions-touching
    commits via listNodesAtRef, exactly as the condition specifies (\"derived
    from intentions/ git history at read time\"). The series is monotonically
    NON-DECREASING across all 40, from 96/302 = 31.79% (c9bf5320,
    2026-08-20T13:59) to 140/316 = 44.30% (875b68d4, 2026-08-21T14:40). It
    crossed the ceiling at 9bb5bb8b (2026-08-20T14:59, 108/308 = 35.06%) and has
    never returned. THE DECISIVE MEASUREMENT, which prior rounds on this
    condition did not have — THE DENOMINATOR IS FLAT. From 481572f1
    (2026-08-21T13:12) through 875b68d4 (2026-08-21T14:40) the denominator never
    moved off 316 across 20 consecutive commits while the numerator rose 127 →
    140. Not one point of that rise came from new tactics being filed. Over the
    same window: draft 92 → 79, born-parked 44 → 56, open 83 → 84, done 97 → 97.
    Every point is a park converting its own draft target into the numerator it
    is measured by. This is the compounding loop stated as a measurement rather
    than as a worry: classifyTactic (census.ts:13-18) scores born-parked as
    backlog and draft as neither, so a Side-A park moves its own target INTO the
    numerator — and, sharper, FINALIZING a draft to phase implement raises the
    numerator by exactly the same 1, so the band cannot distinguish a park from
    a finalize. Every disposition of a draft except pruning looks identical to
    this condition. SECOND DECISIVE MEASUREMENT — NOTHING IS COMPLETING. `done`
    for this strategy has been FROZEN at 97 since 5f8dbc0a (2026-08-19T15:41).
    Over those two days the backlog went 74/293 = 25.26% → 140/316 = 44.30%. The
    band was HEALTHY (21–25%) for the eight days from 2026-08-11 to 2026-08-19
    and broke inside 48 hours; this is not slow degradation. The mechanism is
    not in doubt: dispatch is PAUSED and has been since 2026-08-10 11:51
    (sentinel $XDG_DATA_HOME/commons-dispatch/paused; dispatch_pause_state
    reports \"paused\" on the caller thread). So the non-increasing limb cannot
    recover by execution — no tactic can reach done while the fleet is paused —
    while every /align-tactics selection that runs adds to the numerator. The
    condition is being driven by exactly one process. THE BREACH IS NOT MERELY
    SELF-INFLICTED BOOKKEEPING — measured four ways at 875b68d4, every one still
    above the ceiling: excluding the 13 observation carriers by the mechanically
    reproducible id-suffix criterion (/-drift-observations$/) leaves 127/303 =
    41.91%; excluding all born-parked nodes whose reason self-describes as an
    \"observation carrier\" (29 nodes) leaves 111/287 = 38.68%; excluding every
    auto-minted tactic-invalid-state-rc-* node leaves 138/310 = 44.52% (it RISES
    — those nodes are more denominator than numerator); excluding all three
    classes together leaves 113/285 = 39.65%. Counterfactual on the park wave
    itself: removing all 36 nodes born-parked on or after 2026-08-20 from BOTH
    sides leaves 104/280 = 37.14% — still breached. The one counterfactual that
    would pass, 104/316 = 32.91%, requires treating those 36 as if they were
    still undispositioned drafts, which is not a reachable steady state, and —
    per the finalize-equals-park identity above — would have failed identically
    had the lane finalized them instead of parking them. The condition text
    makes this an author decision, not something a session re-resolves: \"A
    burden growing without bound is this condition FAILING (which parks the
    strategy for an author decision), not merely more work to do.\" Conditions
    are human-decided, and a per-node tactic-target session may not write the
    serving strategy — which is why this park lands on the tactic and names the
    strategy-level failure inside it. THIS IS THE FIFTEENTH NODE PARKED ON THIS
    ONE CONDITION: tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect,
    tactic-align-tactics-migration-tightening-split,
    tactic-graph-refsplit-blocker-audit, tactic-align-tactics-premise-preflight,
    tactic-node-scope-files-overlap-gate, tactic-invalid-state-rc-f1c843b1,
    tactic-graph-refsplit-read-coherence, tactic-invalid-state-rc-fa3075ec,
    tactic-session-reap-authorization-durability,
    tactic-qa-main-node-terminal-declaration, tactic-align-audit-legacy-review,
    and this node. (Counted at 875b68d4 as born-parked nodes serving this
    strategy whose reason is BLOCKED ON the band — 21 reasons mention it, but 7
    are observation carriers that merely discuss it and must not be counted.)
    One ruling clears all fifteen. A RECORD-COMPLETENESS DEFECT ON THE STRATEGY,
    which this session may not fix: the strategy's stored `reading` still says
    \"backlog: 58/236 = 24.6% (band <=35%); backlog series 28d: 47.6% -> 38.2%
    -> 31.4% -> 24.6% (non-increasing)\", a real measurement taken 2026-08-11
    (reproduced exactly at bced71da: 58/236 = 24.58%) and now stale by ~20
    points and 80 tactics. Because the strategy's `gap` is DERIVED from that
    stored reading (deriveGap, packages/intentionsutil/ src/sensors.ts), the
    strategy's own record currently understates its own condition failure and
    reads as though the band were holding. Refreshing it is an
    author/office-hours action. GROUND B — SIDE B: two MATERIAL premises this
    node's plan would depend on are unrecorded by the serving strategy, and each
    independently fixes a contract this plan would have to commit to. Both were
    surfaced by the drift review and then re-verified on the caller thread. B1.
    DEFAULT-REF DURABILITY. This node's statement bakes in \"at a git ref
    (default origin/main)\". But tactic-graph-ref-split (status codified, phase
    implement, IN FLIGHT) is scoped to move the canonical intention graph off
    main entirely — its statement reads \"the intention graph lands on a
    dedicated graph-main branch ... graph-commit becomes plumbing-based CAS push
    against origin/graph-main\". A second, independent sibling
    (tactic-graph-execute-fresh-main-read, phase qa) already records the
    direction that a ref must not be hardcoded, for exactly this reason.
    VERIFIED THIS ROUND on the caller thread: `git ls-remote --heads origin`
    shows NO graph-main branch (the `graph/<node-id>-<n>` refs that do exist are
    graph-commit's per-node scratch branches, an unrelated mechanic), so
    ref-split has NOT landed and origin/main is still the correct default TODAY.
    The ambiguity is the default's DURABILITY, not its present correctness — and
    it is material because it decides whether this CLI ships a literal or an
    accessor. The strategy records nothing about which ref a new read primitive
    should default to, nor whether a new primitive may hardcode a ref an
    in-flight sibling is scoped to retire. B2. BODY-MATCH SCOPE. The node names
    four query predicates — phase, blocked_by, serves, and BODY MATCH — while
    framing the deliverable as merely exposing an existing helper (\"Expose
    storeAtRef as a CLI\"). The fourth predicate has no read-at-ref primitive
    behind it. VERIFIED on the caller thread: readNode deliberately drops the
    markdown body (\"Only the YAML frontmatter ... is authoritative; the
    markdown body is ignored\", packages/intentionsutil/src/ store.ts,
    readNode's doc comment), so BOTH listNodesAtRef and readNodeAtRef — which
    parse through readNode/ listNodesStrict — return frontmatter-only
    IntentionNode values, and no readNodeBodyAtRef exists anywhere in the repo
    (grep for /BodyAtRef/ across packages/ and .claude/ returns nothing). SIZING
    CORRECTION this session makes to the drift review, which called this \"no
    existing primitive to call\": the WORKING-TREE half does exist —
    readNodeBody(dir, id) and extractBody are already in store.ts, immediately
    below readNode, and are what tacticScopeFingerprint hashes. So the net-new
    work is a ref-aware wrapper over an existing body reader, not a from-scratch
    fence parser. It is still work BELOW the CLI layer, which is what makes the
    premise material: it contradicts the node's own pure-wrapper framing and
    enlarges the deliverable. Recommend: rule the band ONCE for the whole
    strategy at office hours, then answer B1 and B2 in the same sitting and
    re-run /align-tactics tactic-graph-read-at-ref-cli. See
    office_hours.recommendation for the specific dispositions and the six
    clarifications this round landed on this node, none of which needs
    re-derivation."
  since: 2026-08-21
  recommendation: "THREE decisions are owed, all at one office-hours sitting.
    Nothing about THIS node is defective — its deliverable was re-verified live
    at origin/main 875b68d4 and its plan is otherwise ready to author, so once
    these are ruled the re-run needs no re-derivation: six dated clarifications
    on this node carry every corrected fact. DECISION 1 (strategy-scope, clears
    fifteen nodes at once) — RULE THE MAINTENANCE-BURDEN BAND. Do NOT answer
    this per node: a per-node answer just re-opens the queue at the next
    selection, and fifteen nodes are now parked on this single condition. Three
    dispositions, and the ruling should name WHAT BECOMES OF THE FIFTEEN
    ALREADY-PARKED NODES either way. (a) RE-AFFIRM 35% and treat the breach as
    real: then the lane stays closed and the remediation is to un-pause dispatch
    and drain, because `done` has been frozen at 97 since 2026-08-19 and the
    ratio cannot fall while nothing completes. (b) RE-DECLARE the band against
    the grown population: the ceiling was armed 2026-08-05 at 59/197 = 30.0%
    when the strategy had 197 serving tactics; it now has 316, and the
    composition has shifted — this may be a number that no longer measures what
    it was chosen to measure. (c) ACCEPT the breach with a stated remediation
    and a date, which re-opens the lane immediately. BEFORE CHOOSING, WEIGH THE
    MEASURED FEEDBACK LOOP — it is the strongest argument that the metric, not
    the machinery, is what broke. The denominator has been FLAT at 316 for the
    last 20 consecutive intentions commits while the numerator rose 127 → 140,
    so every point of the rise is a park converting its own draft target. And
    because classifyTactic scores born-parked as backlog and draft as neither,
    FINALIZING a draft raises the numerator by exactly the same 1 that parking
    it does — so this band cannot distinguish success from failure on a draft.
    Every disposition except pruning looks identical to it. A band with that
    property will read as breached under ANY sustained /align-tactics activity,
    which is what the last 40 commits show. If (b) is chosen, consider whether
    the numerator should exclude born-parked nodes awaiting an AUTHOR decision
    (as opposed to open defects the machinery owns), since those are a queue on
    the human, not a machinery defect — that single change would separate the
    two things this one ratio currently conflates. ALSO OWED IN THE SAME
    SITTING, and cheap once you are there: refresh the strategy's stored
    `reading`. It still says 58/236 = 24.6% and calls the series non-increasing.
    That was accurate on 2026-08-11 and is now stale by ~20 points and 80
    tactics; because `gap` is derived from it (deriveGap,
    packages/intentionsutil/src/sensors.ts), the strategy currently reads as
    though its own band were holding. No autonomous lane may write the
    strategy's frontmatter, so this can only be fixed by you. DECISION 2
    (node-scope, B1) — DEFAULT REF. Should this CLI hardcode `origin/main` as
    its default, or resolve it through a single shared canonical-graph-ref
    accessor that tactic-graph-ref-split can repoint in one place at cutover?
    Context for the choice: ref-split is codified and at phase implement, and is
    scoped to move the graph to origin/graph-main; no graph-main branch exists
    on origin yet, so origin/main is correct today. If you choose hardcoded, the
    follow-on question is whether this new file is accepted into ref-split's
    cutover scope — that cutover already carries 37 recorded blockers, so adding
    a file to it is not free. RECOMMENDED: the accessor. It is a few lines, it
    is the shape clarification 194 (R3) already adopted for reads generally, and
    it makes the CLI survive the cutover without being enrolled in it. DECISION
    3 (node-scope, B2) — IS BODY MATCH IN SCOPE? The node names four predicates
    (phase, blocked_by, serves, body match) but frames itself as a pure CLI
    wrapper. Those cannot both hold: readNode drops the markdown body, so
    neither listNodesAtRef nor readNodeAtRef returns it, and no
    readNodeBodyAtRef exists. (a) YES — then this node also adds a body-carrying
    read-at-ref primitive. Sizing, measured this round: readNodeBody(dir, id)
    and extractBody already exist in packages/intentionsutil/src/store.ts, so
    this is a ref-aware wrapper over an existing reader, not a new parser —
    modest, but it is library work below the CLI and it touches the durable-body
    contract. (b) NO — then strike `body match` from the statement and rationale
    and ship the frontmatter-only three. Note that the corpus evidence
    motivating this node (clarification 218: sessions hand-rolling `git ls-tree`
    + per-node `git show` + `sed` full-graph scans) is partly ABOUT
    body-grepping, so (b) narrows the node away from some of its own
    justification — worth deciding deliberately rather than by default.
    SEQUENCING: Decision 1 gates whether ANY plan may be authored; Decisions 2
    and 3 fix the CLI contract. If you rule 1 as (a) re-affirm, 2 and 3 can wait
    — but ruling all three together costs little and makes the re-run a single
    clean planning pass."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Expose storeAtRef as a CLI — read node fields and query nodes by predicate at a git ref (default origin/main) — so the doctrine-mandated fresh read has a scripted path instead of hand-rolled `git show origin/main:intentions/<id>.md` plus sed

## Status — PARKED to office_hours, 2026-08-21 (no plan authored)

This node is still a draft. A `/align-tactics` tactic-mode round ran on
2026-08-21 and parked it on two independent grounds rather than finalizing it;
see `office_hours.reason` for the full statement and
`office_hours.recommendation` for the three decisions owed. Six dated
`clarifications` on this node carry every fact this round verified — a re-run
after the ruling needs to re-derive none of them.

**Nothing about this node is defective.** Its deliverable was re-verified live
at `origin/main` 875b68d4 and survives intact.

## The deliverable, re-verified 2026-08-21 at origin/main 875b68d4

The gap this node names is real and unfilled:

- `packages/intentionsutil/scripts/lib-store-at-ref.ts` exports exactly two
  functions — `listNodesAtRef(repoRoot, ref)` and
  `readNodeAtRef(repoRoot, ref, id)` — and has **no CLI entrypoint**: no
  `process.argv` handling and no `import.meta.url === pathToFileURL(process.argv[1])`
  main guard anywhere in the file.
- No CLI wrapper for it exists anywhere else in the repo.
- `dump-node.ts`, even now that `--dir` is required, reads a **materialized
  directory** — never an arbitrary git ref — so it cannot perform the
  doctrine-mandated read at `origin/main`.

Locate these by **symbol**, not by line number; the anchors drift.

## Three corrections a re-plan must not rediscover

1. **The rationale's `import.meta.url` clause is refuted.** `dump-node.ts` no
   longer resolves its store from `import.meta.url`; `--dir` is required and
   the repo root comes from it. Landed by `fe0b1c4d` (PR #3095), 2026-08-15.
   The node's thesis survives — the gap is *"no CLI exposes a read at a ref"*,
   **not** *"dump-node.ts reads the wrong tree"* — but the supporting sentence
   must be rewritten. See clarification 1.
2. **The consumer count is three, not five,** and `render-rsi-plan.ts` no
   longer exists (deleted by PR #3074, 2026-08-13). The live set is
   `office-hours-select.ts`, `read-sensors.ts`, and `verify-landed`. Note the
   grep trap recorded in clarification 2: four other files match a naive grep
   but contain only prose comments, and this round's own caller note got it
   wrong that way before checking each call site.
3. **Clarification 242's partition ruling still binds** — this node "adds a NEW
   CLI (storeAtRef) rather than editing these readers, so it is separable under
   any shape" — but its unconverted-files list is stale. The ruling was not
   behind when made; it was overtaken thirteen hours later. See clarification 3.

## Author-ratified scope boundary (serving-strategy clarification 242)

**In scope:** a new CLI entry point over the existing `listNodesAtRef` /
`readNodeAtRef`.

**Out of scope, ruled:** `validate-graph.ts`, `write-node.ts`, `dump-node.ts`,
`clear-park` (owned by `tactic-explicit-ref-graph-reads`, phase done);
`demote-node-to-implement` (owned by `tactic-demote-node-stale-local-read`);
`transition-node` (claimed by `tactic-graph-ref-split`); `graph-commit` (a
writer, already ratified shape).

**Adjacent but distinct — not duplicates, do not absorb:**
`tactic-graph-refsplit-read-coherence` (GRAPH_WT refresh after a land),
`tactic-graph-execute-fresh-main-read` (the `check-node-selection.ts` slice),
`tactic-office-hours-select-fresh-main` (freshness provenance).

## 2026-08-21 round record

Ran the `align-tactics` Workflow in `mode: "tactic"` — six subagents, 564k
tokens, zero agent deaths. It returned `proceed: false` with two parks and no
plan. Both parks are folded into this node's single `office_hours` block.

**Ground A — Side A, the armed maintenance-burden band fails on both limbs.**
Rather than take one sample, this round **replayed the band at each of the last
40 intentions-touching commits** through `listNodesAtRef` +
`strategyBacklogBand` — the derivation the condition itself specifies. It is
monotonically non-decreasing across all 40, 96/302 = 31.79% → 140/316 = 44.30%,
crossing the 35% ceiling at `9bb5bb8b` (2026-08-20T14:59) and never returning.
Two findings prior rounds on this condition did not have:

- **The denominator is flat at 316** for the last 20 of those commits while the
  numerator rose 127 → 140. Not one point of the recent rise is new tactics
  being filed; every point is a park converting its own draft target.
- **`done` has been frozen at 97 since 2026-08-19T15:41,** and the band was
  healthy at 21–25% for the eight days before breaking inside 48 hours.
  Dispatch has been paused since 2026-08-10 11:51, so the non-increasing limb
  cannot recover by execution.

The breach survives every exclusion tested (carriers, rc nodes, the whole park
wave); figures in clarification 6.

**Ground B — Side B, two material unrecorded premises.** The default-ref
durability question (`tactic-graph-ref-split` is scoped to move the graph to
`origin/graph-main`; no such branch exists yet) and the body-match scope
question (`readNode` drops the body, so no read-at-ref primitive backs the
fourth named predicate). Both re-verified on the caller thread.

**Coverage bound, recorded rather than left implicit.** The rationale's corpus
figures — 270 Bash calls hand-rolling `git show origin/main:intentions/`, 369
occurrences — are a 2026-08-10/11 measurement over 797 session transcripts.
Re-running that scan was out of proportion for this pass, so those numbers
stand as plausible-but-unconfirmed, **not** as re-verified fact.

**Where the observations landed, and why.** All six clarifications are on
**this node**, not on the serving strategy. A tactic-target session never
writes the serving strategy's frontmatter, and no observation carrier was
minted: a `-drift-observations` node is born-parked, which would write into the
very backlog numerator this park is about. Since this node is itself now in the
office-hours queue, the observations reach the same sitting a carrier would
have.
