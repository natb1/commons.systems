---
id: tactic-park-cause-sensor-instrument
kind: tactic
statement: Migrate the park-cause signal clause from
  strategy-graph-native-dispatch to strategy-discovered-requirements and
  implement the sensor that reads it, in one PR that changes the node,
  read-sensors.ts's LIFECYCLE_SENSOR_NAME and its test guard together
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-12 /align interview that recorded the
  self-consistency condition on strategy-graph-native-dispatch. That round
  appended a park-cause sensor to this strategy's success_signal.sensor prose,
  on the author's decision to register a sensor rather than defer its design.
  MEASURED THAT ROUND: the align-strategy-census sensor counter read 19/53
  sensor-naming strategies with 45 unregistered both BEFORE and AFTER the append
  — proving the append de-registered nothing (the recorded hazard it was checked
  against), but equally proving it registered nothing: this strategy's sensor
  prose was already one of the 45 unregistered, because read-sensors matches the
  ENTIRE success_signal.sensor string against a set of registered Sensor names
  (packages/intentionsutil/scripts/read-sensors.ts:1226, exact full-string
  match), and no Sensor is registered under this strategy's long prose string.
  So the observable and threshold are recorded but no reading will ever be
  produced for them until a Sensor is implemented and registered under that
  exact name. This tactic is that work. It was filed by the recording session
  itself rather than deferred, because leaving a recorded sensor with no
  instrument would reproduce precisely the defect the same round's new condition
  forbids — a round leaving output a downstream session cannot act on. Scope
  note for the planning session: decide deliberately whether to register under
  the existing long prose string or to shorten success_signal.sensor to a stable
  short name, which is a rewording of registered-sensor prose and therefore
  carries the de-registration hazard in its own right. RE-POINTED AND WIDENED
  2026-08-14 by the round that closed out the 2026-08-13 re-homing. serves moves
  from strategy-graph-native-dispatch to strategy-discovered-requirements,
  because the signal this tactic instruments now lives there: the 2026-08-13
  /align round carried the /align recording-round charter, and with it the
  park-cause observable and threshold, onto strategy-discovered-requirements,
  whose success_signal.sensor records itself as UNINSTRUMENTED and names this
  tactic as the one that would implement it. Scope widens from 'implement a
  sensor' to 'perform the migration', because the clause is NOT merely
  uninstrumented — it is still physically embedded in
  strategy-graph-native-dispatch's success_signal.sensor and threshold, so the
  same signal is now recorded in two places and read in neither. That is the
  residue the 2026-08-13 round could not land: graph-commit is intentions/-only,
  and the sensor string is mirrored character-for-character by read-sensors.ts's
  LIFECYCLE_SENSOR_NAME (packages/intentionsutil/scripts/read-sensors.ts:475)
  under a test guard, so removing the clause from the node without the paired
  code change breaks the guard. This tactic is the PR-lane carrier for that
  pair."
reading: null
serves:
  - strategy-discovered-requirements
recovers: []
clarifications:
  - question: Why is this node parked rather than planned?
    answer: "(Measured 2026-08-21 on the caller thread of this /align-tactics
      per-node round, at worktree HEAD 76abc77a.) The serving strategy's
      authored-boost condition measures FALSE. The condition holds that the
      boost of 8 encodes the relation \"ranks above the rsi cluster's band\" and
      instructs that \"if the rsi cluster's band reaches 8 or above, this figure
      is stale and must be re-derived rather than defended\". Re-measured
      independently this round by importing listNodesStrict
      (packages/intentionsutil/src/store.ts) and resolveAttention
      (packages/intentionsutil/src/attention.ts) directly over all 749 nodes
      rather than shelling out to a script: SIX
      strategy-recursive-self-improvement tactics resolve to band 11.333 —
      tactic-finding-search-all-producers, tactic-rsi-audit-threshold-table,
      tactic-rsi-lens-catalog-decomposition, tactic-rsi-session-sweep-trigger,
      tactic-rsi-trigger-threshold-gate and
      tactic-supersession-edge-and-terminal — while ALL FIVE
      strategy-discovered-requirements children, this node included, sit at band
      8.000, and 11.333 is the maximum band in the graph. The relation is not
      merely stale but INVERTED: the rsi cluster now outranks the /align cluster
      by 3.333. The strategy's stored rationale still records the rsi cluster's
      best band as 7.5 and says the author \"confirmed the figure rather than
      holding it on trust\" on 2026-08-14 at origin/main b1ebf766; that reading
      is seven days stale and wrong by 3.833. One completeness note the drift
      review omitted: a seventh node, tactic-audit-instrument-scoping, also
      bands 11.333, but it serves strategy-token-economy and so falls outside
      the rsi cluster the condition names — it does not change the verdict."
  - question: Which staleness path fired, and would an authored rerank fix it?
    answer: "(Measured 2026-08-21.) The boost condition fired through its SECOND
      staleness path, not its first, so no authored rerank is the cause and none
      would fix it. strategy-recursive-self-improvement still carries boosts {1:
      6}, unchanged since its 2026-08-11 rationale, and
      strategy-rsi-delegated-prioritization still carries +1 for a resolved
      score of 7.5 at band 6 — both exactly as the strategy recorded them. The
      11.333 comes from lineage compounding across a DUAL serves edge:
      resolveAttention reports tactic-rsi-lens-catalog-decomposition with
      bandSource \"tactic-rsi-intervention-special-cases\" and sources
      [strategy-recursive-self-improvement, strategy-graph-native-dispatch],
      i.e. 6 + 5.333 = 11.333, and that tactic hands its resolved score down as
      its children's band. This is precisely the path the 2026-08-14 ratifying
      round added — \"band derives from a parent's RESOLVED score, the parent
      relation includes reverse-blocked_by, and score compounds over lineage —
      so a node can drift above 8 purely by accumulating edges\" — now with a
      worked instance inside the rsi cluster itself rather than only in the
      attention-surface cohort the condition cites. Re-derivation is owed on
      edge churn, and the churn has happened. CONSEQUENCE for the owed ruling:
      re-stating the scalar alone will not prevent recurrence, because nothing
      an author does to the number blocks further lineage compounding."
  - question: Is this node's mandated atomic triad still intact?
    answer: "(Verified live 2026-08-21 against worktree HEAD 76abc77a.) NO — two of
      its three legs are already discharged, so the node's central justification
      no longer holds for the work that remains. LIFECYCLE_SENSOR_NAME, now
      declared at packages/intentionsutil/scripts/read-sensors.ts:485, carries
      only the three-clause store-and-selection-log string;
      strategy-graph-native-dispatch's success_signal.sensor matches it; and the
      anti-drift guard is GREEN (npx vitest run --root packages/intentionsutil
      test/lifecycle-sensor.test.ts → 22/22 passed). The constant's doc comment
      at read-sensors.ts:471-484 records the drop and instructs \"Restore the
      clause here only if this file grows the reading it names.\" The SOLE
      surviving residue is the threshold clause at
      intentions/strategy-graph-native-dispatch.md:6696-6697 (\"and parks
      attributable to an upstream recording round's own record gap trend to
      zero\"), and it is uncoupled from code: grep for that text across
      read-sensors.ts and lifecycle-sensor.test.ts hits only the explanatory doc
      comment at read-sensors.ts:477, and the anti-drift guard at
      lifecycle-sensor.test.ts:330-332 compares LIFECYCLE_SENSOR_NAME against
      success_signal.sensor ONLY, never the threshold. So the migration half
      needs no paired code change and no PR lane; only the sensor-implementation
      half retains genuine node+code atomicity, through
      validateRegisteredSensorNames
      (packages/intentionsutil/src/sensors.ts:211-219), which requires the new
      registered constant be recorded verbatim by some node's
      success_signal.sensor. PROVENANCE, corrected by the caller before landing:
      the drift review attributed the removal to commit 242e981f (2026-08-13
      21:31) and concluded that the 2026-08-14 round which widened this node
      \"ran a day later and wrote its ground against an already-false state\".
      That is wrong on both legs. 242e981f is not an ancestor of HEAD — it sat
      on an unmerged PR branch and was squashed away — and the change reached
      main only as 1092a403, a single-parent squash-merge of PR #3090 dated
      2026-08-14 11:29. This node's widening landed as d5770f6e at 2026-08-14
      10:45, forty-four minutes EARLIER. The widening round was therefore
      overtaken by a race, not written against landed state it ignored. The
      substantive finding stands; the fault attribution does not."
  - question: Can the park-cause reading be implemented from what the record and
      schema provide today?
    answer: "(Measured 2026-08-21 over the live store, 749 nodes, 230 parked.) Not
      without an author ruling, because the reading has no structured input, no
      recorded attribution rule, and a vacuous obvious implementation.
      OfficeHours (packages/intentionsutil/src/schema.ts:702-707) carries
      exactly four fields — reason, since, recommendation, session_type — with
      reason free prose and no cause code, so the three-park count the strategy
      cites from 2026-08-12 was a hand read rather than a mechanical
      classification. Measured against today's 230 parks: the phrase \"upstream
      recording round\" appears in ZERO park reasons and \"record gap\" in
      exactly ONE (tactic-align-tactics-immaterial-drift-redirect), against 79
      reasons that mention align-tactics at all and 8 whose reason OPENS with
      \"SIDE A\" under the predicate /^\\s*SIDE A/. (The drift review reported
      14 for that last figure; it does not reproduce under that predicate, and
      the caller's 8 is the measured value.) A keyword or first-line classifier
      — the only reusable shape the gather phase found, analogous to
      align-tactics-census.ts's office_hours.reason first-line extraction, with
      no existing classifier to inherit — would read 0 or 1 today against the
      recorded threshold \"parks attributable to an upstream recording round's
      own record gap trend to zero\", and would therefore report the serving
      strategy's success signal MET on the day the sensor is registered,
      independent of the phenomenon it is meant to detect. Whatever rule the
      sensor adopts silently becomes the operative definition of that
      author-recorded threshold, so it is author-reserved substance and is owed
      a ruling before planning: either a recorded phrase/heuristic with its
      false-negative rate stated, or a structured cause field on OfficeHours so
      the count is mechanical."
  - question: Which anchors in this node's rationale and body have drifted?
    answer: "(Re-verified 2026-08-21.) Three, all immaterial to the claims they
      support, corrected here so a planning session does not chase them. (1)
      LIFECYCLE_SENSOR_NAME is cited at
      packages/intentionsutil/scripts/read-sensors.ts:475; the constant is now
      declared at line 485, and 475 falls inside its doc comment, which spans
      463-484. The file has grown to 1765 lines. (2) The \"exact full-string
      match\" against registered Sensor names is cited at read-sensors.ts:1226;
      that line now sits inside makeLadderTerminusSensor's read() body, and the
      actual verbatim match lives in packages/intentionsutil/src/sensors.ts at
      SensorRegistry.resolve, a Map<string, Sensor>.get, reached from the driver
      at read-sensors.ts:1709. (3) The body cites the test guard at
      test/lifecycle-sensor.test.ts:326-330; it is at 330-332. Both underlying
      claims — that registry resolution is a verbatim full-string match, and
      that any drift between the recorded sensor prose and the registered
      constant silently de-registers the sensor — hold in substance and were
      re-confirmed by reading the code. Two figures in the body are also stale
      and are corrected here rather than left to be trusted: it states
      strategy-graph-native-dispatch has \"184 open children\", which does not
      reproduce (measured 316 serving, 84 open, exactly 1 carrying any
      execution.strategy_fingerprint —
      tactic-strategy-fingerprint-stamp-coverage, still at phase qa); and it
      states \"45 of 53 sensor-naming strategies were unregistered\", which is a
      stored 2026-08-10 reading (measured fresh by direct registry probe: 68
      nodes name a sensor, 10 registered and 58 unregistered; strategies only,
      55 name a sensor and 8 are registered). The freeze-cost conclusion the
      body draws from its figure is unaffected."
  - question: How many of the serving strategy's children are now parked on this
      same condition, and why does each arrive separately?
    answer: "(Recorded 2026-08-21 by this round.) This is the THIRD of the serving
      strategy's children parked on the same authored-boost condition within one
      day, so the condition wants a single ruling for the whole strategy rather
      than a park per node. tactic-align-review-skill (parked in commit
      a89740c2) and tactic-align-round-self-consistency-walk (parked in commit
      3313bc46) precede it; both office_hours reasons open \"SIDE A — a recorded
      condition on the serving strategy has failed\", both name the identical
      authored-boost condition, and both carry the identical recommendation to
      run an /align round on strategy-discovered-requirements to re-derive the
      boost. (The drift review cited 481572f1 as the second sibling's park
      commit; that is wrong — 481572f1 parks
      tactic-supersession-retirement-sweep on a different condition entirely.
      481572f1 is the HEAD that sibling round MEASURED at, which its own commit
      message quotes, and the two were conflated. The park commit is 3313bc46.)
      The fourth child, tactic-align-strategy-new-steps-revision, is at phase
      implement and has simply not reached selection; the fifth,
      tactic-align-strategy-new-steps-drift-observations, is a born-parked
      observation carrier explicitly marked not dispatchable work. Each child
      arrives at the wall separately because a per-node tactic-target session
      may not write strategy substance — it can neither re-derive the boost nor
      amend the condition — so the only exit available from this path is a park
      naming the fact. One /align round on the strategy clears all of them at
      once. Also settled here rather than left to be re-litigated: the
      gather-phase corpus contradicted itself on the migration's state, one
      reuse note holding that the removal \"already discharges scope items 1+2\"
      and one corpus hit holding the clause \"exists in two places
      simultaneously right now: strategy-graph-native-dispatch's
      success_signal.sensor/threshold (original, still live)\". Settled by
      direct file read rather than by preferring one witness — the sensor half
      is discharged, the threshold half is not."
  - question: Is the serving strategy's recorded zero-freeze-cost finding still true?
    answer: "(Re-measured 2026-08-21, discharging a follow-up the gather phase
      explicitly left open for a reviewer.) No — it was true when recorded and
      is now stale. The serving strategy's ratifying-round clarification records
      a FREEZE COST of zero for its 2026-08-14 edit on the ground that \"its
      three serving tactics are all phase-null and unstamped\". Measured now,
      the strategy has FIVE serving tactics, not three, and they are no longer
      uniformly phase-null: tactic-align-review-skill (phase null, parked),
      tactic-align-round-self-consistency-walk (phase null, parked),
      tactic-align-strategy-new-steps-drift-observations (phase null,
      born-parked carrier), tactic-park-cause-sensor-instrument (phase null,
      this node) and tactic-align-strategy-new-steps-revision (phase IMPLEMENT).
      A further edit to the strategy would freeze the one child sitting at phase
      implement. That said, the practical cost remains nil today: measured
      directly, ZERO of the five carries any execution.strategy_fingerprint, so
      nothing is stamped for the freeze to bite on. Immaterial to this node's
      plan; recorded because the gather phase flagged the claim as unverified
      and asked for a direct re-check, and because the owed /align round will
      itself edit this strategy."
  - question: What is this round's own health, and what did the caller correct in
      the drift review before landing?
    answer: "(Recorded 2026-08-21 by the caller, so the round's coverage is
      auditable rather than asserted.) ROUND HEALTH: the Workflow fan-out ran
      cleanly — six subagents, zero errors, zero empty results (three reuse
      hunts, the clause-coverage gather, and the drift review; one reuse hunt
      deliberately consolidated its findings into a sibling call and returned an
      empty candidate list with a note saying so). A full Side-B sweep was
      therefore performed, and this round's coverage is normal rather than
      degraded — better-evidenced than the two sibling parks on this same
      condition, both of which disclosed a died clause-coverage agent. This
      matters because the drift review's own returned text asserted the opposite
      — \"no Workflow fan-out ran this round, so no full Side-B drift sweep is
      claimed\" — which is false for this round and appears to be boilerplate
      carried over from those sibling rounds. FOUR CORRECTIONS the caller made
      to the drift review's text before landing it, each re-measured rather than
      reasoned: (1) that false coverage-bound claim, corrected as above; (2) the
      provenance of the clause removal — the drift review blamed the 2026-08-14
      widening round for writing against already-landed state, when the removal
      reached main 44 minutes AFTER that round landed (see the atomic-triad
      clarification); (3) the count of park reasons opening with \"SIDE A\",
      reported as 14, measured as 8; (4) the second sibling's park commit, cited
      as 481572f1, which actually parks a different node on a different
      condition — the correct commit is 3313bc46. The substantive verdict — park
      on Side A plus a folded material requirement-ambiguity — survives every
      correction, and no correction weakens it. Recorded at this length because
      two of the four were factual claims about OTHER rounds' conduct, and an
      uncorrected blame narrative in a park reason is read by the sitting as
      established fact."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    Parked to office_hours on two independent grounds, either of which alone
    blocks authoring this node's plan.


    (A) SIDE A — a recorded condition on the serving strategy has failed,
    measured. strategy-discovered-requirements' authored-boost condition holds
    that the boost of 8 encodes a RELATION the scalar cannot carry — "ranks
    above the rsi cluster's band" — and instructs that "if the rsi cluster's
    band reaches 8 or above, this figure is stale and must be re-derived rather
    than defended", with re-derivation owed on edge churn and not only on rerank
    events. MEASURED FALSE 2026-08-21 at worktree HEAD 76abc77a (byte-identical
    to origin/main), independently rather than inherited from the sibling parks,
    and re-verified a second time on the caller thread by importing
    listNodesStrict (packages/intentionsutil/src/store.ts) and resolveAttention
    (packages/intentionsutil/src/attention.ts) directly over all 749 nodes: SIX
    strategy-recursive-self-improvement tactics resolve to band 11.333 —
    tactic-finding-search-all-producers, tactic-rsi-audit-threshold-table,
    tactic-rsi-lens-catalog-decomposition, tactic-rsi-session-sweep-trigger,
    tactic-rsi-trigger-threshold-gate and tactic-supersession-edge-and-terminal
    — against a trigger of 8, while ALL FIVE strategy-discovered-requirements
    children, this target included, sit at band 8.000. 11.333 is the maximum
    band in the whole graph. The relation is not merely stale but INVERTED: the
    rsi cluster outranks the /align cluster by 3.333, and the strategy's stored
    rationale still records the rsi cluster's best band as 7.5 (author-confirmed
    2026-08-14 at origin/main b1ebf766), seven days stale and wrong by 3.833.
    COMPLETENESS NOTE added by the caller: a SEVENTH node,
    tactic-audit-instrument-scoping, also bands 11.333, but it serves
    strategy-token-economy and is therefore outside the rsi cluster the
    condition names; it does not change the verdict and is recorded so the
    cohort is not later re-derived as six-of-six. MECHANISM: this fired through
    the condition's SECOND staleness path, so no authored rerank caused it and
    none would fix it — strategy-recursive-self-improvement still carries boosts
    {1: 6} unchanged since 2026-08-11 and strategy-rsi-delegated-prioritization
    still resolves 7.5 at band 6, exactly as recorded; the 11.333 comes from
    lineage compounding across a dual serves edge, resolveAttention reporting
    tactic-rsi-lens-catalog-decomposition with bandSource
    "tactic-rsi-intervention-special-cases" and sources
    [strategy-recursive-self-improvement, strategy-graph-native-dispatch], i.e.
    6 + 5.333. THIRD node parked on this one condition in a single day —
    tactic-align-review-skill (parked a89740c2) and
    tactic-align-round-self-consistency-walk (parked 3313bc46) precede it with
    the identical condition and the identical recommendation — so the boost
    wants ONE ruling for the whole strategy rather than a park per child. A
    per-node tactic-target session may not write strategy substance, so it can
    neither re-derive the boost nor amend the condition; that is why each child
    arrives here separately.


    (B) FOLDED MATERIAL REQUIREMENT-AMBIGUITY on deliverable class and
    mechanism, two items, both owed author ratification. (B1) This node's
    statement mandates "one PR that changes the node, read-sensors.ts's
    LIFECYCLE_SENSOR_NAME and its test guard together", grounded on the clause
    being "still physically embedded in strategy-graph-native-dispatch's
    success_signal.sensor and threshold". Verified live: half of that is
    REFUTED. The park-cause clause is already gone from both
    LIFECYCLE_SENSOR_NAME (now declared at read-sensors.ts:485) and that node's
    success_signal.sensor, and the anti-drift guard is GREEN (npx vitest run
    --root packages/intentionsutil test/lifecycle-sensor.test.ts → 22/22
    passed). So the two legs of the mandated triad that this node exists to
    carry — the constant and the guard expectation — are already discharged. The
    sole residue is the THRESHOLD clause at
    intentions/strategy-graph-native-dispatch.md:6696-6697, which no code
    mirrors (the only non-intentions hit is the doc comment at
    read-sensors.ts:477) and no test guards (lifecycle-sensor.test.ts:330-332
    asserts success_signal.sensor only). So the migration half is a pure
    intentions/ edit graph-commit can carry and needs no PR lane, and the node's
    "PR-lane carrier for that pair" justification does not survive for it; only
    the sensor-implementation half retains genuine node+code atomicity, via
    validateRegisteredSensorNames (src/sensors.ts:211-219). Whether this node
    stays one PR-lane carrier, splits, or narrows to the sensor alone is a scope
    ruling the author owes. (B2) The sensor's attribution rule is unrecorded and
    the obvious implementation is vacuous. OfficeHours (schema.ts:702-707)
    carries only a free-text reason with no cause code, and the strategy's cited
    three-park count from 2026-08-12 was a hand read. Measured across today's
    230 parked nodes: "upstream recording round" appears in ZERO park reasons
    and "record gap" in exactly ONE
    (tactic-align-tactics-immaterial-drift-redirect), against 79 reasons
    mentioning align-tactics and 8 whose reason OPENS with "SIDE A" (predicate
    /^\s*SIDE A/; the drift review reported 14, which does not reproduce under
    that predicate — the caller's measured figure is the one to trust). A
    keyword classifier — the only reusable shape available — would read 0 or 1
    against a threshold of "trend to zero", certifying the strategy's success
    signal MET on registration day regardless of the phenomenon. The
    classification rule silently becomes the operative definition of an
    author-recorded threshold, so it is author-reserved substance and must be
    ruled before it is planned: a recorded phrase/heuristic with its
    false-negative rate stated, or a structured cause field on OfficeHours
    making the count mechanical.


    CORRECTION TO THE DRIFT REVIEW'S OWN ACCOUNT, made by the caller before
    landing and recorded rather than silently applied. The drift review asserted
    that commit 242e981f (2026-08-13 21:31) removed the clause and that "the
    2026-08-14 round that widened this node's scope ran a day later and wrote
    its ground against an already-false state". That blame narrative is REFUTED
    on both legs. 242e981f is NOT an ancestor of HEAD — it lived on an unmerged
    PR branch and was squashed away; the change reached main only as 1092a403
    ("Fix the open evaluation-finding ledger, and merge its one duplicate pair
    (#3090)"), a single-parent squash-merge dated 2026-08-14 11:29. The round
    that widened this node landed as d5770f6e at 2026-08-14 10:45 — FORTY-FOUR
    MINUTES BEFORE the removal reached main. So the widening round was not
    written against an already-false state and could not have observed the
    change: it was overtaken, not negligent. The substantive conclusion is
    unchanged — the constant and guard legs are discharged today — but the
    finding is one of a race between two same-morning rounds, not of a round
    ignoring landed state, and the sitting should read it that way.


    COVERAGE BOUND, stated rather than implied, and CORRECTED. The drift
    review's returned text claimed "no Workflow fan-out ran this round, so no
    full Side-B drift sweep is claimed". That is FALSE for this round and is
    corrected here: the Workflow fan-out DID run — six subagents, zero errors,
    zero empty results (three reuse hunts, of which one deliberately
    consolidated its findings into a sibling call and returned an empty
    candidate list with a note saying so; plus the clause-coverage gather and
    the drift review). So a full Side-B sweep WAS performed and this round's
    Side-B coverage is normal, not degraded — notably better-evidenced than the
    two sibling parks on this same condition, both of which disclosed a died
    clause-coverage agent. Separately, every quantitative claim above — band
    values, the boost fields, the bandSource/sources trace, the 230-park census
    and phrase incidence, the sensor-string and threshold file state, the guard
    run, the commit ancestry and timestamps, and the cited line anchors — was
    re-measured directly on the caller thread against worktree HEAD 76abc77a
    rather than taken from the drift review's prose.
  since: 2026-08-21
  recommendation: "Run ONE /align round on strategy-discovered-requirements; it
    clears this park and both sibling parks at once, and only an /align round
    can, because a per-node /align-tactics session may not write strategy
    substance. That round owes four things. (i) RE-DERIVE the authored boost of
    8 against the measured field — the rsi cluster now bands 11.333 and this
    strategy's five children all band 8.000, so the relation the condition
    encodes is inverted by 3.333 — and either restate the number so the intended
    relation holds again or record that the author now accepts ranking below the
    rsi cluster. Note the boost fired through the condition's second, no-author
    staleness path, so re-deriving the scalar alone will not stop recurrence;
    consider whether the condition should name a mechanism rather than a number.
    (ii) RULE ON THIS NODE'S DELIVERABLE CLASS, given that two of the three legs
    of its mandated atomic triad — the LIFECYCLE_SENSOR_NAME constant and the
    test-guard expectation — are already discharged and the guard is green. The
    live options are: keep it as one PR-lane carrier; split it into a pure
    intentions/ threshold-deletion plus a code-only sensor PR (the node's own
    \"Preferred decomposition\" paragraph, which is now the only
    mechanically-available shape); or narrow it to the sensor alone and let the
    threshold deletion ride any /align round. (iii) FIX THE PARK-CAUSE
    ATTRIBUTION RULE before the sensor is planned — either record a
    phrase/heuristic together with its false-negative rate, or add a structured
    cause field to OfficeHours so the count is mechanical. Without this the
    sensor is vacuous: it would read 0 or 1 against a \"trend to zero\"
    threshold and certify the strategy's signal MET on registration day. (iv)
    CORRECT THE STRATEGY'S OWN success_signal.sensor PROSE, which still asserts
    the park-cause clause \"is currently registered as part of
    strategy-graph-native-dispatch's lifecycle sensor string\" — measured false
    since the clause was removed, and unwritable from a per-node session, which
    is why it is named here rather than fixed. If the sitting wants the cheapest
    partial progress instead, the threshold-clause deletion at
    intentions/strategy-graph-native-dispatch.md:6696-6697 is safe to land on
    its own today: nothing in code mirrors it and no test guards it."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate the park-cause signal clause from strategy-graph-native-dispatch to strategy-discovered-requirements and implement the sensor that reads it, in one PR that changes the node, read-sensors.ts's LIFECYCLE_SENSOR_NAME and its test guard together

## Why this is one PR and not two

The park-cause clause is recorded in **two** places today and read in
**neither**. Splitting the work would leave one of those states standing:

- `strategy-graph-native-dispatch.success_signal.sensor` still carries the
  clause "a park-cause reading over `office_hours.reason` across parked nodes
  counts `/align-tactics` parks attributable to an upstream recording round's
  own record gap", and its `threshold` still carries the matching "parks
  attributable to an upstream recording round's own record gap trend to zero".
- `strategy-discovered-requirements.success_signal` carries the same observable
  and the same threshold, with its `sensor` field stating in prose that it is
  UNINSTRUMENTED and that migrating the clause "needs a paired code change
  outside `intentions/` and is owed".

The 2026-08-13 round that re-homed the `/align` charter deliberately left the
clause behind, because `graph-commit` lands `intentions/` only — it would have
pushed the node edit and silently dropped the code half. That is the same
mechanism recorded on
tactic-align-skill-draft-selectability-stale-prose, which cost a
false "done" and a reverted phase. This tactic is the PR-lane carrier that lets
the pair land together.

### Binding sequencing ruling (2026-08-14) — the PR carries the graph edit too

Do **not** read "graph-commit cannot carry the code half" as "the graph half
must therefore land separately, by graph-commit." It must not. A normal PR
branch may edit `intentions/` freely; the direct-push restriction is a rule
about what an `/align` round may push, not a claim that PRs cannot touch the
store. Precedent: `717742b9` ("Instrument dependency-justification audit as
strategy-owned-web-platform's sensor") landed the strategy's `success_signal`
edit, a new sensor implementation, and its `read-sensors.ts` registration in
**one** commit — the exact shape this work needs. Mixed graph+code commits are
ordinary here (6 in the last 400).

Both split orderings are mechanically illegal, so this is not a stylistic
preference:

- **Code first, graph after.** `test/lifecycle-sensor.test.ts:326-330` reads
  the real node out of `intentions/` and asserts
  `node.success_signal.sensor === LIFECYCLE_SENSOR_NAME`. A branch that changes
  only the constant still carries the old node string, so the guard is red on
  the PR and it cannot merge.
- **Graph first, code after.** The same guard then fails on `main` the moment
  `graph-commit` pushes the node edit — a red trunk until the follow-up lands.

The atomic unit is therefore exactly: gnd's `sensor` + `threshold`, the
`LIFECYCLE_SENSOR_NAME` constant, and the guard's expectation, in one commit.

**Preferred decomposition — split at the coupling, not at the file type.**
Scope steps 3 and 4 (implement the park-cause `Sensor`, register it under a
short name) have *no* coupling to the guard at all, because the driver iterates
NODES: a registered sensor that no node names simply never fires, so it is inert
until something declares it. Land them as a code-only PR first, reviewed on the
sensor's own merits. Then land the swap as a second, deliberately tiny mixed PR
(two node fields, one constant, one expectation) where the whole diff is the
risky part and nothing else competes for the reviewer's attention.

**Fingerprint cost, measured 2026-08-14 — negligible, do not let it drive the
design.** Editing either `success_signal` changes that strategy's
`strategyFingerprint` and freezes its stamped open children.
`strategy-discovered-requirements` has 4 open children and **0** carry a
non-null stamp; `strategy-graph-native-dispatch` has 184 open children and
exactly **1** does — `tactic-strategy-fingerprint-stamp-coverage`, itself at
`phase: qa` and itself the tactic that exists to raise stamp coverage. Re-measure
before landing rather than trusting these numbers, but at this coverage the
freeze argument cannot justify contorting the sequence.

## The coupling that forces the code change

`packages/intentionsutil/scripts/read-sensors.ts:475` defines
`LIFECYCLE_SENSOR_NAME` as a string literal mirroring
`strategy-graph-native-dispatch`'s `success_signal.sensor`
**character-for-character**, including the curly apostrophe in "round's" and the
parenthetical "(the reading that surfaced three such parks on 2026-08-12)".
`read-sensors` matches the ENTIRE `success_signal.sensor` string against
registered `Sensor` names by exact full-string equality, so any edit to the node
string de-registers the lifecycle sensor unless the constant changes in the same
commit. `packages/intentionsutil/test/lifecycle-sensor.test.ts` guards the
equality, so an unpaired edit fails CI rather than silently de-registering — the
guard is working as intended and must not be weakened to let a partial change
through.

## Scope

1. Remove the park-cause clause from
   `strategy-graph-native-dispatch.success_signal.sensor` and the matching
   trend-to-zero clause from its `threshold`, leaving the lifecycle sensor
   describing only what it actually reads (the census population and the
   selection log).
2. Update `LIFECYCLE_SENSOR_NAME` to the new exact string, and update the test
   guard's expectation to match.
3. Give `strategy-discovered-requirements.success_signal.sensor` a real
   registered sensor name in place of its UNINSTRUMENTED prose, and register a
   `Sensor` under exactly that name.
4. Implement the reading: a park-cause count over `office_hours.reason` across
   parked nodes, counting `/align-tactics` parks attributable to an upstream
   recording round's own record gap. The 2026-08-12 reading that surfaced three
   such parks is the worked example to reproduce.

**Naming decision reserved for the planning session** (carried over from this
node's original scope note, and now sharper because the target strategy is
changing anyway): register under a stable SHORT name rather than a long prose
string. The long-prose-as-name convention is what left this signal unregistered
in the first place — 45 of 53 sensor-naming strategies were unregistered for
exactly this reason. Since step 3 is writing a new `sensor` value regardless,
the usual "rewording carries a de-registration hazard" objection does not apply
to `strategy-discovered-requirements`; it applies only to step 1's edit of
`strategy-graph-native-dispatch`, which step 2 pairs.

## Out of scope

Any change to what the threshold *means*, to the backlog band, or to the other
two clauses of the lifecycle sensor. Also out of scope: re-registering the other
44 unregistered sensor strings — that is the general problem this instance is a
member of, not this tactic's job.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

The lifecycle-sensor guard must be green (there is **no** `intentionsutil`
vitest project — `--project intentionsutil` errors with "No projects matched";
this package runs its own `vitest run` via its `test` script). Then `npx tsx packages/intentionsutil/scripts/read-sensors.ts`
producing a non-null reading for the new sensor name and the lifecycle sensor
still producing its reading. Confirm with
`npx tsx packages/intentionsutil/scripts/align-strategy-census.ts intentions`
that the registered-sensor counter increases by one and nothing else
de-registers.

## Round record — 2026-08-21 `/align-tactics` per-node finalize, PARKED

This node was selected as a draft/raw tactic target and **not** finalized. No
plan was authored and no `phase` was set; the round parked on Side A plus a
folded material requirement-ambiguity. Everything above this heading is the
**pre-park** text and several of its claims are now measured false — read this
section and the node's `clarifications` before acting on any of it.

**The sections above that no longer hold.** "Why this is one PR and not two"
and the "Binding sequencing ruling (2026-08-14)" are dissolved for the work
that remains. Both rest on the park-cause clause still sitting in
`strategy-graph-native-dispatch.success_signal.sensor` with
`LIFECYCLE_SENSOR_NAME` mirroring it under a test guard. Measured at HEAD
`76abc77a`: the clause is gone from both, and the guard is green (22/22). The
ruling's two "mechanically illegal" orderings are therefore no longer illegal —
there is nothing left to pair. Scope items 1 (sensor half) and 2 are
**discharged**; what remains of item 1 is the `threshold` clause alone, which
no code mirrors and no test guards.

**What is actually left**, in the order it could be done today:

1. Delete the trailing threshold clause at
   `intentions/strategy-graph-native-dispatch.md:6696-6697`. Pure `intentions/`,
   zero code coupling, landable by `graph-commit` on its own.
2. Replace `strategy-discovered-requirements.success_signal.sensor`'s
   UNINSTRUMENTED prose with a real registered name — **blocked** on the
   attribution ruling below.
3. Implement and register the `Sensor` — **blocked** on the same ruling.

Steps 2 and 3 retain a genuine node+code atomicity requirement through
`validateRegisteredSensorNames` (`packages/intentionsutil/src/sensors.ts:211-219`),
which is the only surviving reason this node might still want a PR lane.

**Why it is blocked, not merely re-scoped.** The reading has no attribution
rule and the obvious implementation is vacuous: `OfficeHours`
(`packages/intentionsutil/src/schema.ts:702-707`) carries free-text `reason`
with no cause code, and across today's 230 parked nodes the phrase "upstream
recording round" appears **zero** times. A keyword classifier would read 0
against a "trend to zero" threshold and certify the serving strategy's signal
MET on registration day. Whatever rule the sensor adopts becomes the operative
definition of an author-recorded threshold, so it is author-reserved.

**Verification block status.** The ` ```verify ` fence above is still runnable
and still passes, but it no longer verifies this node's work — it asserts the
guard that the already-landed change made green. Any round that re-scopes this
node owes that block a rewrite.

**Round health.** The Workflow fan-out ran clean: six subagents, zero errors,
zero empty results, so a full Side-B sweep was performed. The caller corrected
four factual errors in the drift review's returned text before landing it —
a false "no fan-out ran" coverage claim, a wrong blame narrative about the
2026-08-14 widening round, a park-reason count, and a mis-cited sibling park
commit. All four corrections, and the measurements behind them, are recorded in
the final clarification.
