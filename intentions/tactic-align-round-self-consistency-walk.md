---
id: tactic-align-round-self-consistency-walk
kind: tactic
statement: "/align Step 6 gains a self-consistency walk over the round's own
  output: before landing, verify no draft tactic's authored scope depends on a
  node the same round's blocked_by edges order after it"
owner: ai
status: raw
parent: null
rationale: "Recorded in the 2026-08-11 /align interview that codified the
  draft-review gate. A round can author an edge that contradicts a scope the
  same round authors — the inverted blocked_by of 8249f664 is the recorded
  instance — and no gate catches it, because /align's Step 6 walks requirement
  coverage, not the round's own internal consistency. The artifact this touches
  is the /align skill itself, whose charter strategy-discovered-requirements
  owns (re-homed 2026-08-13). Serves narrowed to that strategy alone 2026-08-14:
  the second edge to strategy-graph-native-dispatch existed only because the
  self-consistency condition was recorded there, and the author's ratifying
  round moved the condition here, so the sole remaining reason for the edge
  dissolved. No dispatch artifact is touched by this tactic."
reading: null
serves:
  - strategy-discovered-requirements
recovers: []
clarifications:
  - question: Does the serving strategy's self-consistency condition describe
      shipped enforcement, or only an assignment?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.) NO — read
      \"tactic-align-round-self-consistency-walk implements it\" as \"is
      assigned to implement it\", not as a guarantee already in force. Verified
      this round at worktree HEAD 481572f1: `grep -n -i 'self-consist'
      .claude/skills/align/SKILL.md` returns zero hits, and Step 6
      (`.claude/skills/align/SKILL.md:759-777`, \"Step 6 — Requirements coverage
      check\") carries only the pre-existing clause-coverage walk of the
      author's original text against recorded elements. No check anywhere in
      that file compares a round's own blocked_by edges against the scopes the
      same round authors. The condition's present-tense phrasing is a live
      over-read risk for any reader auditing whether the inverted-blocked_by
      failure mode of 8249f664 is currently gated: it is not."
  - question: Is this check already covered by existing mechanical validation —
      validateGraph rule 15 or align-tactics.js's resolveTempRefs?
    answer: (Recorded 2026-08-21 /align-tactics per-node drift review.) NO — it is
      genuinely new, and the two nearest neighbours were checked directly.
      `checkBlockedByCycles` (`packages/intentionsutil/src/schema.ts:1502-1546`,
      invoked as validateGraph rule 15 at `:1694`) is a whole-graph
      WHITE/GRAY/BLACK DFS that rejects only a literal blocked_by cycle;
      `resolveTempRefs` (`.claude/workflows/align-tactics.js:369-447`) re-runs
      the same cycle DFS scoped to one round's own tactic batch before any disk
      write. Neither compares a draft tactic's authored scope prose against
      blocked_by ORDER, so the failure this tactic targets — a scope that
      depends on a node the same round's edges order after it, with no cycle
      present — passes both today. The reusable part is the traversal scaffold
      (generalized from cycle-membership to a reachability/topo-order query),
      not the check.
  - question: Where would a Step 6 self-consistency walk get the round's own output
      set from?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.) Nowhere
      that exists today — it must build its own tracking. Measured this round:
      /align Step 4 (`.claude/skills/align/SKILL.md:479-521`) writes draft
      tactics one at a time through `write-node.ts`, reusing the same
      `$TMPDIR/tactic-draft.json` scratch filename per byproduct, so nothing on
      disk accumulates the round's ids, blocked_by edges or scopes across the
      loop; the only place all of the round's node ids appear together is the
      `graph-commit` argv at `.claude/skills/align/SKILL.md:576-590`, which is a
      shell argument list at land time carrying no edge or scope data and not
      inspectable beforehand. Two viable shapes, both with in-repo precedent: a
      per-round manifest under `$TMPDIR` mirroring the `dump-node.ts --out-dir`
      mechanic (`.claude/skills/align/SKILL.md:545-554`), or re-reading by a
      tracked id list via `readNode(intentionsDir, id)`
      (`packages/intentionsutil/scripts/write-node.ts`). Also corrected here:
      the mechanical-floor doctrine sentence (\"scripts carry what is
      mechanical, skill prose carries only what needs judgment\") sits at
      `.claude/skills/align/SKILL.md:194-196`, not at the `:189-190` cited in
      this round's gather evidence."
  - question: Which in-flight sibling shares this tactic's edit surface, and what
      does that imply for the plan's line anchors?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.)
      tactic-align-strategy-new-steps-revision, a sibling under the same serving
      strategy, measured this round at the same band 8.000 and selectable at the
      align-tactics rung. Its authored scope is a contiguous edit to Step 2 of
      the same skill file — the 2.3 doctrinal-consistency gate and 2.5 steelman
      challenge, anchored in its own body at `SKILL.md:258-296` — while this
      tactic's surface is Step 5's pre-write gate and bundling rule
      (`.claude/skills/align/SKILL.md:532-536`, `:576-599`) and Step 6
      (`:759-777`). The regions do not overlap, so this is an ordering hazard
      rather than a conflict: whichever lands first shifts every line anchor
      below it, so this node's plan must state its anchors by heading and quoted
      text as well as by `path:line`, and re-locate them at implement time
      rather than trusting the numbers."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "SIDE A — a recorded condition on the serving strategy has failed,
    measured this round, so this node cannot be planned against it.
    strategy-discovered-requirements' authored-boost condition holds that the
    boost of 8 encodes a RELATION the scalar cannot carry — 'ranks above the rsi
    cluster's band' — and instructs that 'if the rsi cluster's band reaches 8 or
    above, this figure is stale and must be re-derived rather than defended',
    with re-derivation owed on edge churn and not only on rerank events.
    MEASUREMENT (independent, this round, not inherited from the sibling park's
    prose): `npx tsx packages/intentionsutil/scripts/select-targets.ts --dir
    intentions` run in this node's own worktree at HEAD 481572f1 (byte-identical
    to origin/main at provision time) puts two rsi-cluster tactics at band
    11.333 — tactic-rsi-lens-catalog-decomposition (serves
    strategy-recursive-self-improvement, phase implement) and
    tactic-supersession-edge-and-terminal (second serves edge to the same
    strategy, validates it) — while strategy-discovered-requirements' children
    sit at band 8.000: this node, tactic-align-strategy-new-steps-revision and
    tactic-park-cause-sensor-instrument. The relation the condition encodes is
    inverted. MECHANISM is the condition's own SECOND, quieter staleness path,
    confirmed rather than assumed: strategy-recursive-self-improvement's
    authored boost is unchanged at 6
    (intentions/strategy-recursive-self-improvement.md:1920-1922), and both
    11.333 nodes carry attention: null
    (intentions/tactic-rsi-lens-catalog-decomposition.md:37,
    intentions/tactic-supersession-edge-and-terminal.md:26), so the band
    accumulated through lineage/reverse-blocked_by compounding with no author
    acting. The strategy has not been re-derived since: no 2026-08-2x dated
    amendment exists anywhere in intentions/strategy-discovered-requirements.md.
    PRECEDENT: the direct sibling tactic-align-review-skill, same strategy and
    same band, was parked for exactly this failure in commit a89740c2 (verified
    on main this round); this node was left unparked only because that round was
    per-node and could reach one node. The re-derivation write lands on the
    STRATEGY, and this is a per-node session that may not write strategy
    substance — which is why the park lands on this tactic and names the
    strategy's record as the incomplete half rather than targeting the strategy.
    NOTHING ELSE BLOCKS THIS NODE, each checked: the non-delegable-interview
    condition holds (.claude/skills/align/SKILL.md frontmatter still pins the
    whole-session opus, non-delegable dialectic); the record-as-sole-carrier
    condition holds; the draft-review-gate condition holds AS WRITTEN —
    graph-commit carries no --review or --ack flag, matching the condition's own
    'NOT YET BUILT' disclosure, and its scope clause excludes an /align-tactics
    decomposition anyway; and the self-consistency condition is unbuilt, but
    that is this node's own job, not a dead premise. The work itself is real and
    unduplicated: no self-consistency walk exists in
    .claude/skills/align/SKILL.md, and neither validateGraph rule 15 nor
    align-tactics.js's resolveTempRefs performs a scope-versus-order check. The
    round's four immaterial Side-B observations landed as clarifications on THIS
    node rather than as a born-parked carrier, because an escalating round's
    target already reaches the office-hours queue the carrier would route to."
  since: 2026-08-21
  recommendation: "Run an /align round on strategy-discovered-requirements to
    re-derive the authored boost of 8 against the freshly measured field (rsi
    cluster at band 11.333; this strategy's children at 8.000), and either
    restate the number so the intended relation holds again or record that the
    author now accepts ranking below the rsi cluster. Two nodes are waiting on
    that one ruling — this node and tactic-align-review-skill (parked a89740c2
    for the identical failure) — so disposition them together; a third and
    fourth child, tactic-align-strategy-new-steps-revision and
    tactic-park-cause-sensor-instrument, sit at the same band 8.000 and will hit
    the same wall on their next selection. Worth ruling on at the same sitting,
    since it is the second time this condition has fired through its edge-churn
    path with no author action: whether a scalar boost should carry a relation
    at all, or whether the relation belongs in the mechanism (a declared 'rank
    above <node>' edge the selector resolves) rather than in a condition a human
    must re-measure. FOUR immaterial drift observations from this round are
    recorded as dated clarifications on this node (numbers 1-4); none blocks the
    ruling above, and each is paste-ready if the sitting wants any of them
    promoted onto the strategy — a per-node session may not write strategy
    clarifications, which is why they landed here. Once the boost is re-derived,
    re-select this node; the round found the work itself real, unduplicated and
    ready to plan."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# /align Step 6 gains a self-consistency walk over the round's own output: before landing, verify no draft tactic's authored scope depends on a node the same round's blocked_by edges order after it

## Round record — 2026-08-21 `/align-tactics` per-node finalize, PARKED

This node is **not planned**. An `/align-tactics <tactic-id>` finalize ran
against it on 2026-08-21 from a worktree at `481572f1` and parked it on Side-A
drift: the serving strategy's authored-boost condition is measured false, and
the re-derivation it demands is a write on `strategy-discovered-requirements`
that a per-node session may not make. The measurement, the mechanism, and the
precedent sibling park are in `office_hours.reason`; the ruling being asked for
is in `office_hours.recommendation`. Nothing in this section restates them.

The round did **not** stop at the park. It confirmed the work itself is real,
unduplicated, and ready to plan once the boost is re-derived, and it recorded
what the plan will need as clarifications 1-4 in frontmatter. Read those before
re-planning — they are this node's substitute for a retained draft body, which
this node never had:

1. The condition's present-tense "implements it" is an **assignment**, not
   shipped enforcement — nothing in `.claude/skills/align/SKILL.md` performs
   this check today.
2. The check is **not** a duplicate of `validateGraph` rule 15 or
   `resolveTempRefs`; both reject only literal `blocked_by` cycles. What is
   reusable is the DFS traversal scaffold, not the check.
3. `/align` holds **no round-output manifest** — Step 4 writes drafts one at a
   time through a reused scratch filename, and the round's ids appear together
   only as the `graph-commit` argv. The walk must build its own tracking; two
   in-repo shapes with precedent are named there.
4. `tactic-align-strategy-new-steps-revision` edits a **different region of the
   same file**, so this node's plan must anchor by heading and quoted text as
   well as `path:line`, and re-locate at implement time.

Those four are immaterial Side-B drift observations. They landed here, on the
target, rather than in a born-parked observation carrier: an escalating round's
target already reaches the same office-hours sitting a carrier would route to,
so a carrier would add a node to the queue to say what this node can say
itself. They are **not** on the serving strategy, because a per-node session may
not write strategy `clarifications` — if the sitting judges any of them worth
promoting there, the text is paste-ready as written.


## Author ruling, 2026-08-29 — DESCOPED from PR20; this node stays parked

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 7 — Position 9 Units 1 and 3 are
descoped").**

> **Ruled: DESCOPE UNITS 1 AND 3**, ship the rest of Position 9. The two units
> stay parked pending the strategy and need a follow-up position later. PR20 ships
> partial rather than fabricating a strategy the author has not written.

This node is PR20 Unit 3. **It is not built in that PR, and its 2026-08-21 park
stands** — parked on `strategy-discovered-requirements`' authored-boost-of-8
condition, whose encoded relation this round measured inverted (two rsi-cluster
tactics at band 11.333 against this strategy's children at 8.000), and which the
strategy has not re-derived since.

**Two independent stops.** The 2026-08-28 maintenance-burden band ruling — (c)
accept with remediation — un-parks only nodes parked **solely** on the band. This
node is not one of them. **Do not clear this park on the strength of that ruling.**

**And this unit is not a "~200 byte draft".** That annotation was struck from the
plan on 2026-08-30. This node carries four planning clarifications and its work is
real and unduplicated: no self-consistency walk exists in
`.claude/skills/align/SKILL.md`, and neither `validateGraph` rule 15 nor
`align-tactics.js`'s `resolveTempRefs` performs a scope-versus-order check.
