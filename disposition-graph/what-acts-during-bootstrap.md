---
question: What acts while nothing in the record is ratified?
stage: review
facts:
  - name: answer
    options:
      - name: shim-and-grant
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"
      - name: deferred-as-the-resting-state
        source: review
        ref: "2026-09-05"
      - name: grant-expires-at-exit
        source: author
        ref: "2026-09-03"
      - name: nothing-acts
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "the record would have to be built by an agent forbidden to act on any of it, and the first sitting could not be run"
      - name: a-bootstrap-class
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-03"
        status: passed
        reason: "the author's words of 2026-09-04 make the grant a persistent rule of the authority node and no class, and the authority node passed the same option over on that ground"
    recommends: shim-and-grant
    boldness: high
    against: "The five rule files under `.claude/rules/` that every session loads are projections of unanswered nodes and are declared as no shim, so this answer says the doctrine the record is running on today acts on nothing and is on the frontier for liquidation."
    stands: shim-and-grant
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
review:
  verdict: kickback
  strength: strong
  date: 2026-09-05
  of: 42f6beeb104b6f994c8387a07e5a063e7e98002e
  commit: e137c5b39b32108284065dc7910ab60856123ed0
  against: "Five rule files under `.claude/rules/` are what every session is actually bound by today, and this answer grounds none of them: they are projections of unanswered nodes, no node declares them a shim, and no grant covers a session that merely loads them. By this answer's own second paragraph they are therefore among 'every artifact standing outside them', which is 'unsupported implementation, on the frontier and liquidated through reconciliation' — as are the operating skills' rules and the 'How a recommendation is made' section of CLAUDE.md that the author granted on 2026-09-04. Read strictly, the answer says the doctrine the machine is running on right now acts on nothing and is slated for liquidation, and it supplies no mechanism by which a projected rule acts. That is the live half of the counter-argument authority's own reading raised, that the classes and their two bootstrap substitutes describe none of the record's present operation; moving the clause into a node of its own restates it rather than answers it, and putting `deferred-as-the-resting-state` on the list asks the author to choose against a status quo their record cannot presently account for."
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
depends:
  - commons.systems/disposition-graph/authority
defines:
  - term: bootstrap
    gloss: "The state of this record until its global tier is ruled, in which a declared shim and the author's grant are the only things that act."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, at which `greenfield` is swapped with `main` and the shims that carried the state are gone."
  - term: bootstrap authority
    gloss: "The author's grant, given in their words for one named reconciliation of one unanswered node; the term is the author's, and the grant is the thing this node calls a grant."
---
## Disposition

The author, 2026-09-03, on bootstrap authority:
> also record the concept of bootstrap authority as an alignment shim - unanswered nodes may be reconciled by alignment with explicit bootstrap authority, but that authority expires on bootstrap exit

The author, 2026-09-04, on the viable-options node, on what unanswered is:
> Is "unanswered" just an authority - as in no authority granted for reconciliation. Or, more precicely, explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority.

## Answer

Two things act, and no class does. A shim declared on the record is applied
by default, as the evaluation node says, and it stands in for a materialization
the record has not yet made, as the transience node defines it; a prompt is
required only to bypass one. And a grant is the author's word, given for one
named reconciliation of one unanswered node, never assumed, never carried over
from an earlier grant, and never read from the announcement of one, as the
authority node says; the grant is what the author's words call bootstrap
authority, and the two names are one thing. Nothing else acts by right: a
recommendation on an unanswered node is a draft and grounds no work, and a
class the AI writes for itself is not a grant.

Bootstrap is the state of this record until its global tier is ruled, and it
is not a licence: what a session may do in it is exactly what the two rules
above allow, and every artifact standing outside them is unsupported
implementation, on the frontier and liquidated through reconciliation. The
state does not end in one act. It ends node by node, as rulings accumulate and
each node's class begins to act in place of the shim or the grant that carried
it. Bootstrap exit is the moment every condition the record declares for it is
met, and this node mints none: the global tier is ruled; the coverage node has
ruled what the record covers, as materialization declares; the second direction
and the drain of the legacy record are complete and the reconciliation shim's
remaining clauses are discharged, as work-loop declares; and every landing made
under that shim has passed the code-review instrument, as review declares. The
swap of `greenfield` with `main` is what happens at exit and is no condition of
it. Whether those clauses should move here, to the node that defines the term,
and be cited where they now stand, is recorded as an option on work-loop. The
grant does not expire at exit: reconciling an unanswered node on the author's
explicit word is the rule at any time, as the authority node holds, and that
strikes the expiry the author's words of 2026-09-03 gave it, quoted above; the
divergence is recorded here, and `grant-expires-at-exit` keeps the author's own
side of it on the list.

## Rationale

The question is authority's neighbour and not authority's own: that node
answers who may change an answer, and this one answers what binds a session
while the answer to that question reaches nothing. It is minted here because
the rule has to survive the sitting that wrote it, be cited, and be read by
sessions that never saw the question, which is what makes a disposition
rather than a probe. Until 2026-09-05 the rule lived as one clause in
authority's answer, where a reader looking for what governs a session today
would not find it.

The clause it carries is the reply authority's own reading of 2026-09-05
recorded to the counter-argument that the classes describe none of the
record's present operation. That counter-argument is the ground of the
option `deferred-as-the-resting-state`, and it is not answered by putting
the clause in its own node: it asks for a resting state in which the AI's
recommendation acts by default under a review that is owed, which is what
the retired deferred stamp did and what the `approval-directed-agents`
reading describes. This answer refuses that resting state and pays for it in
the author's attention, one grant at a time; the author may prefer the other
side, and the option is on the list for that reason.

## Facts

### answer

The recommendation is `shim-and-grant`, at high boldness, which in this
record means low confidence. The two rules are the record's own words, from
the evaluation node, the transience node and the authority node, and gathering
them here invents nothing. What is the AI's, and what the boldness marks, is
that bootstrap ends node by node rather than in one act, and that the record's
declared liquidation conditions, and not this node, say when it is over. No
ruling of the author's fixes either, and the record's stopgaps date themselves
by this term, so a wrong answer here mis-dates every one of them. The one place
the answer departs from the author's words is the expiry, which is why their
side of it is on the list as `grant-expires-at-exit` and the case against the
whole answer is on the fact.

#### deferred-as-the-resting-state

Deferred returns as the state the AI may write for itself: a recommendation
on an unanswered node acts, under a review that is owed, until the author
rules. This is what the record carried until 2026-09-03, when the author
classified the deferred stamps the bootstrap had written as unanswered, and
what approval-direction describes as action pending approval. The
`approval-directed-agents` reading supports deferred as a class the author
confers and expressly refuses it as a resting state, calling it approval-
direction with a debt attached and a date on it, so this option diverges from
that reading rather than resting on it, and the reading records the
divergence. Viable and not chosen: it makes the machine run without a grant
per reconciliation, which is the cost this answer accepts, and the author's
own remedy of 2026-09-02 for unearned authority was a rollback to deferred
for review, not a halt. It is not dominated, and the choice between the two
is the author's.

#### grant-expires-at-exit

The grant is a bootstrap expedient and goes at bootstrap exit, after which an
unanswered node is reconciled only through the dialectic. These are the
author's words of 2026-09-03, quoted above, and the standing answer strikes
them on the AI's own judgment, that a rule requiring the author's explicit
word to reconcile an unanswered node is right at any time and not a stopgap;
authority's rationale records the strike and says the author may strike the
line in turn. The option is here so the author rules on their own words rather
than on the AI's amendment of them.

#### nothing-acts

Nothing acts until a ruling reaches it, shims and grants included. Passed
over: the record would then have to be built by an agent forbidden to act on
any of it, and the first sitting could not be run.

#### a-bootstrap-class

Bootstrap authority is a fourth class beside ratified, delegated and
deferred, which the authority node would then define. Passed over on the
same ground that node passed it over: the author's words of 2026-09-04 make
the grant a persistent rule about reconciliation authority, and a rule is
not a class.

### authority

Ratified, at moderate boldness: this node says what an agent may act on
while the record is empty, which is capture-shaped on its face — an answer
that widened it would let the AI grant itself the authority the rest of the
record withholds. Moderate because the two rules it gathers are already the
author's, and only the sentence about how the state ends is new.

## Account

### Minted from authority's reading, 2026-09-05

The clean-context reading of the authority node, 2026-09-05, on the sentence
that node then carried:

> This one sentence settles what binds every session running today — 137
> nodes, none ruled, `.claude/rules/` projected from unanswered global
> nodes, both operating skills declared shims — and no node in the record
> asks it. It is not a probe: the AI answered it here, and the answer would
> have to stand, be cited, and be read by sessions that never saw the
> question (survival and scope tests). CLAUDE.md's own stopgap names its
> liquidation as the moment 'rules are reconciled', which depends on this
> rule.

Validated on the alignment thread and accepted. The node is minted here with
that sentence as its recommended option; authority's answer now cites it and
keeps only the half that is authority's own, that neither a shim nor a grant
names a class. The counter-argument authority's reading raised, that the
answer names no exit from a record of unanswered nodes, is answered by the
second paragraph of this node's answer and put to the author as the option
`deferred-as-the-resting-state`.

This node is global tier, so a rule file is projected from it; the
projection is owed on the implementation ref and is not this sitting's graph
landing.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Findings:

- ## Answer, second paragraph (validations 2 and 3; wrong action by an executor). 'bootstrap exit names the moment the global tier is ruled and the last shim standing in for a projection is liquidated'. The record already carries bootstrap exit conditions, and none of them is this one. work-loop.md:61 makes the reconciliation shim liquidate only when, among nine other clauses, 'the second direction, every artifact on the implementation ref that no node justifies supported by a disposition or pruned, and the drain of every legacy tactic node, transcribed to this graph or pruned, are complete'; materialization.md:52 makes the greenfield shim liquidate '`greenfield` is swapped with `main` at bootstrap exit, after whatever on `main` is to survive has been reconciled into `greenfield` under a supporting disposition, and the coverage node has been ruled on what the record covers'; review.md:84 puts the code-review instrument 'at bootstrap exit for every landing made under the reconciliation shim'. The author's own words say the same: work-loop.md:77, "'Resolves in both directions' this is required for bootstrap exit, but not transition", and vocabulary-view.md:25, 'Before bootstrap exit technical repo vocabulary like disposition, ratified, doctine will need to be recorded on the onboarding path of the graph'. The global tier is six nodes (materialization, delegation, evaluation, session-context, authority, and this one), so as drafted bootstrap exit arrives on six rulings plus a shim liquidation, while coverage stands at the periagogic stage. A session reading this node would hold the greenfield/main swap due, which materialization's own review calls an irreversible deletion of a tree the author has forbidden sessions to read. Suggested edit: either the sentence gathers what the record declares — 'bootstrap exit is the moment the global tier is ruled, the coverage node has ruled what the record covers, the second direction and the legacy drain are complete, and the declared shims are liquidated' — or it says that this node names the state while the declared liquidation conditions name the moment, and cites work-loop and materialization for them.
- ## Answer, second paragraph, final clause (validation 2; contradiction with the ancestor this node's `depends` names). 'after which an unanswered node is reconciled only through the dialectic'. The parent says the opposite: authority.md:114, 'reconciling anything under it takes an explicit grant from the author for that reconciliation, given in their words and never assumed, never carried over from an earlier grant, and never read from the announcement of one; that is a standing rule of this record and not a shim, and it does not expire.' Authority's rationale records the non-expiry as a divergence the AI took: authority.md:124, 'The bootstrap-authority shim declared here on 2026-09-03 is liquidated into the standing rule above, which strikes its expiry at bootstrap exit against the author's words of that day quoted above ... and the author may strike this line', the words being authority.md:207, 'unanswered nodes may be reconciled by alignment with explicit bootstrap authority, but that authority expires on bootstrap exit'; viable-options.md:538 carries the same as probe 2. This draft re-imposes the expiry the parent struck, silently, on the very node to which authority hands 'what else acts while nothing is ratified, and how that state ends'. Suggested edit: delete the clause, or replace it with 'and the grant, which does not expire, remains the only way an unanswered node is reconciled', and record the divergence from the author's words of 2026-09-03 here, where the state's end is now answered.
- ## Answer, first paragraph (validations 3 and 5; the term's defining node). 'A shim declared on the record is applied by default, as the evaluation node says, and it stands in for a projection the record does not yet make'. transience, whose `defines` holds `shim`, says at transience.md:100 'A shim, when an artifact or a text stands in for a materialization not yet made ... on the node it instruments or projects, as that node's interim instrument or projection.' Four of the record's declared shims stand in for something that is not a projection: review.md:84, an instrument; materialization.md:50, the `greenfield` ref; namespaces.md:40, the mount of `commons.systems/public` at `natb1.com/public`; ruling-transport.md:42, a session launch control. The narrowing is load-bearing, since the bootstrap exit criterion is built on it. Note also that the gloss is not evaluation's: evaluation's answer says only 'A shim declared on the record is applied by default; a prompt is required only to bypass it', and 'a stopgap artifact standing in for a projection' is the wording of its still-pending option `two-kinds-of-shim` (evaluation.md:83), not of its answer. Suggested edit: 'and it stands in for a materialization the record has not yet made, as the transience node defines it'.
- ## Answer, second paragraph (validation 3; the criterion is circular for the record's largest shim). 'the last shim standing in for a projection is liquidated'. materialization.md:52 gives the greenfield shim the liquidation condition '`greenfield` is swapped with `main` at bootstrap exit'. If that shim falls under the criterion, bootstrap exit is defined by the liquidation of a shim whose own liquidation is bootstrap exit; if it does not, exit is declared with the record's most consequential shim still standing. Suggested edit: drop the shim limb from the definition and let the declared liquidation conditions carry it, or name which shims the criterion covers and exempt those whose condition is exit itself.
- ## Facts, `### answer`, `#### deferred-as-the-resting-state` (validation 4; a tradition cited against its recorded reading). 'what the `approval-directed-agents` reading describes as action pending approval'. That reading's answer says the opposite twice: 'On an unanswered node nothing acts, which is the record refusing the approach where no approval has ever been given for anything', and 'Deferred is therefore approval-direction with a debt attached and a date on it, rather than approval-direction as a resting state.' Its `bears` entries point at commons.systems/disposition-graph/viable-options#grant-from-a-ruling and commons.systems/disposition-graph/authority#authority-derived, both `adopted`, and none at this node, so the support is claimed in prose and recorded nowhere. Suggested edit: restate as 'the `approval-directed-agents` reading supports deferred as a class the author confers and expressly refuses it as a resting state, so this option diverges from it', and record a `bears` entry on that reading naming this node's answer fact and this option with relation `diverged`.
- ## Answer, second paragraph, first sentence (validation 1; the definition leaves a state unnamed). 'Bootstrap is the state of this record while no ruling reaches its global tier'. Read literally, one ruling on any one of the six global-tier nodes ends bootstrap, while bootstrap exit as this same paragraph defines it has not happened; nothing says what acts in the interval, and the paragraph's own claim that the state 'ends node by node' contradicts a definition that ends it at the first ruling. Suggested edit: 'Bootstrap is the state of this record until its global tier is ruled', so that the state holds up to the exit the paragraph then names.
- Frontmatter `defines`, and the term the record actually uses (validation 3; vocabulary). `defines: - bootstrap - bootstrap exit`, both bare, so the browser links two terms to a page with no gloss — the defect materialization's own review names at materialization.md:219, materialization being the one node that writes `{term, gloss}` pairs. More consequential: what this answer calls 'a grant' the author and the record call bootstrap authority — un-aligned-children.md:47, 'unless the author grants bootstrap authority explicitly, as the author did on 2026-09-03 for this ruling and for the lockfile'; transience.md:104, 'it carries none for reconciliation unless the author grants bootstrap authority explicitly'; and the author's own words on authority, un-aligned-children, transience, growth, delegation, lockfile, frontier-consistency, review-model and review-cost. growth.md:433 and un-aligned-children.md:138 both record that the term is defined nowhere. This node is its home, and it mints a second name for it without saying they are the same. Suggested edit: give both `defines` entries a gloss, add `bootstrap authority` to `defines`, and say in `## Answer` that the grant is what the author's words call bootstrap authority.
- Validation 15, merge, concerning commons.systems/disposition-graph/work-loop. The question 'what are the conditions of bootstrap exit?' is today carried inside another node's dialogue: work-loop's reconciliation shim liquidation condition, which work-loop.md:237 describes as running 'to three long clauses covering all batched validation, four bootstrap exit conditions, the second direction and the legacy drain', with the `split-the-shim` option named as the vehicle and the session recording that it 'declined to decide it twice'. This draft answers that question in one clause of `## Answer` without gathering what the shim already holds. Proposed as an option on commons.systems/disposition-graph/work-loop, answer fact, named `exit-conditions-cited-not-carried`, prose: 'the bootstrap exit clauses of the reconciliation shim's liquidation condition move to the what-acts-during-bootstrap node, which defines `bootstrap exit`, and the shim's condition cites that node instead of restating them; what stays on the shim is the validation the reconciliation loop itself skipped.' The alternative shape, a node of its own under this one asking what the conditions of bootstrap exit are, is the same finding met at the other end. The review proposes and neither merges nor edits.
- ## Facts, both facts (validation 3; the AI's own case against is absent). '### answer ... The recommendation is `shim-and-grant`, at high boldness, which in this record means low confidence.' Neither fact carries `against`, though the encoding provides for it — dialogue's recommended `every-part-in-the-record`: '`against`, the strongest case against that recommendation in one line and in the AI's own words' — and the sibling drafts of this round carry one (work-loop.md:39). On a fact at high boldness whose own rationale says 'the author may prefer the other side', the strongest case belongs beside the recommendation and not only inside an option. Suggested edit: add to the answer fact `against: "the five rule files under .claude/rules/ that every session loads are projections of unanswered nodes and are declared as no shim, so this answer says the doctrine the record is running on today acts on nothing."`
- No `## Disposition` section (validation 1; the words the answer rests on). The node carries none, while its answer and its facts rest on the author's words of 2026-09-02 ('must be rolled back to deferred for review', quoted at authority.md:9), of 2026-09-03 ('that authority expires on bootstrap exit', authority.md:207) and of 2026-09-04 ('bootstrap authority is not a shim, but a persistent disposition about reconciliation authority', authority.md:124). The frontier-consistency node's fourteenth validation allows that 'a quotation may be carried on a child as the ground of the part it answers', and the words bearing most directly on this node's own new content — the expiry at bootstrap exit — are the ones missing from it. Suggested edit: add `## Disposition` carrying the author's words of 2026-09-03 with their date, so that the divergence the second finding names is visible on the node that now owns how the state ends.

On the facts and what they recommend: The answer fact recommends `shim-and-grant`, which is also `stands`, so no `## Recommendation` fence is present and none is owed; the option is listed, and high boldness is right, since the whole second paragraph is the AI's and, as findings 1, 2, 4 and 6 show, is wrong against the record. The authority fact recommends `ratified` at moderate, which I agree with: authority's own escalation rule sends a class 'toward ratified where being wrong is expensive, irreversible, or capture-shaped', and this node decides what an agent may act on while nothing is ruled. No `existence` or `persistence` fact is owed — the node declares no shim and changes no shape — no `review` block exists yet, so no pin is stale, and neither fact carries `against`, which finding 9 asks for.

On the viability of the options: On the answer fact the four listed options are each viable or correctly passed: `deferred-as-the-resting-state` is genuinely not dominated and is rightly kept open, and the two passed-over reasons check out (authority.md:20 and :138 for `a-bootstrap-class`; the first-sitting argument for `nothing-acts`). Two viable options are missing. `grant-expires-at-exit`: the two rules act as drafted and the grant expires at bootstrap exit, as the author said on 2026-09-03 — 'unanswered nodes may be reconciled by alignment with explicit bootstrap authority, but that authority expires on bootstrap exit' — an expiry authority's rationale struck on the AI's own judgment while saying 'the author may strike this line', so now that this node owns how the state ends, the author's own words belong on its list rather than only as probe 2 on viable-options. `exit-from-the-declared-conditions`: bootstrap exit is not minted here but read off the liquidation conditions the record already declares — work-loop's reconciliation shim, materialization's greenfield swap gated on the coverage ruling, review's code-review instrument — so this node says what acts and the shims say when they stop. The authority fact's three options are the reserved vocabulary and are complete.

Strongest counter-argument (strong): Five rule files under `.claude/rules/` are what every session is actually bound by today, and this answer grounds none of them: they are projections of unanswered nodes, no node declares them a shim, and no grant covers a session that merely loads them. By this answer's own second paragraph they are therefore among 'every artifact standing outside them', which is 'unsupported implementation, on the frontier and liquidated through reconciliation' — as are the operating skills' rules and the 'How a recommendation is made' section of CLAUDE.md that the author granted on 2026-09-04. Read strictly, the answer says the doctrine the machine is running on right now acts on nothing and is slated for liquidation, and it supplies no mechanism by which a projected rule acts. That is the live half of the counter-argument authority's own reading raised, that the classes and their two bootstrap substitutes describe none of the record's present operation; moving the clause into a node of its own restates it rather than answers it, and putting `deferred-as-the-resting-state` on the list asks the author to choose against a status quo their record cannot presently account for.

The session's reply: Ten findings, all validated on this thread and all accepted; the kickback to the maieutic stage is accepted and the answer is redrafted in this sitting. The definition of bootstrap exit minted here is struck. Three declarations in the record already carry conditions for it, work-loop's reconciliation shim, materialization's greenfield swap gated on the coverage ruling, and review's code-review instrument, and none of them is what this node said; as drafted it would have put the swap of `greenfield` with `main` in reach on six rulings while coverage stands at the periagogic stage, which is the irreversible act materialization's own review names. The circularity goes with it: the swap is what happens at exit and not a condition of it, and the shim limb, which made exit turn on the liquidation of a shim whose liquidation is exit, is dropped. The clause re-imposing the grant's expiry is struck outright. The parent's standing rule says the grant does not expire, authority's rationale records that as a divergence the AI took from the author's words of 2026-09-03 while saying the author may strike the line, and this node, which now owns how the state ends, is where that divergence and those words belong: they go into a `## Disposition` section verbatim and onto the answer fact as the option `grant-expires-at-exit`, source author, so the author rules on their own words rather than on a probe carried elsewhere. The shim gloss is corrected to the transience node's, a materialization not yet made, since four declared shims stand in for something that is not a projection; the wording taken for evaluation's was in fact its pending option's. The definition of bootstrap is restated as the state that holds until the global tier is ruled, so one ruling does not end it. `bootstrap`, `bootstrap exit` and `bootstrap authority` are glossed in `defines`, and the answer says that the grant is what the author's words call bootstrap authority. `deferred-as-the-resting-state` is restated as a divergence from the `approval-directed-agents` reading rather than as its support, the reading expressly refusing approval-direction as a resting state, and that reading now carries a `bears` entry on this node's option, diverged. The answer fact carries the reader's own line as its `against`: the five rule files every session loads are projections of unanswered nodes, declared as no shim, and this answer says the doctrine the record runs on today acts on nothing. That is the counter-argument at full strength, and it is the author's to weigh. The merge finding is recorded as the option `exit-conditions-cited-not-carried` on work-loop, where the clauses live. Of the two options the viability section names, `grant-expires-at-exit` is recorded; `exit-from-the-declared-conditions` is adopted into the answer rather than set beside it, since the redraft is that option. The node stands at the review stage and owes one reading, its first having been this one.
