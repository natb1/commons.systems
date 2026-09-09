---
question: What becomes of a tradition an expert could not reach?
stage: periagogic
facts:
  - name: answer
    options:
      - name: named-on-the-ref-and-resumed
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/35
      - name: unreached-tradition-is-recorded-on-the-answer-fact
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/35
          - words/2026-09-08/36
    recommends: unreached-tradition-is-recorded-on-the-answer-fact
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
review:
  survey:
    date: 2026-09-09
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "a449e72df5924ffdbd13120b72aee719cfdf1eef5798dd7551308669db243267"
      answer: "7f9ebdd664bf1023597e309048b41a2317cd349972435e477255c10edae44d4e"
      options: "685112b4b4957143535ac1bf77272d21cf8d982ea6bc61879a9119968a240192"
      rivals: "6a3ed10ccfbe8df2f037668d546f1dd04c0da8db06db90d2f25283276745fdb7"
      words: "32273d94e937e6685263fc232915d5de900824761a0c3de8780ab12059eb6cb7"
form: rule
under:
  - commons.systems/disposition-graph/readings
depends:
  - commons.systems/disposition-graph/expert-instructions
  - commons.systems/disposition-graph/round-termination
---

## Facts

### answer

The recommendation is `named-on-the-ref-and-resumed`, at low boldness. Low because
the option is the author's own words of 2026-09-08 at `words/2026-09-08/35` and the
AI adds nothing to them but the placement; the content the option would carry is
owed and is what the node's design must write, which is why this node stands at the
periagogic stage with the option recorded and its content not.

The question exists because the record has a rule for the tradition an expert read
and none for the tradition it did not. `readings` says how a reference to tradition
is recorded: its source, its locus, and the relation it bears to an option, one of
adopted, diverged, or chosen over. `stub-traditions`, beneath it, asks which
traditions the record already reads without a node, which is the converse case:
those were read and not minted. Both take a reading as given. What neither says is
what the record does with a tradition nobody read, and that is a different object.
It has no locus, because the locus is what was not reached; it has no relation,
because a relation is what a reading finds; so writing it as a reading would launder
an absence into a finding, which `readings` forbids. `evaluation` is silent on it
rather than contrary to it: its rule that every tradition surfaced is recorded as a
reading says nothing about the tradition that was not surfaced, so this node fills a
gap in that answer and contradicts none of it, and no option is owed there.

What the silence costs is measurable on the sitting that queued this node. The
expert convened to read tradition against `round-termination` on 2026-09-08 named
some forty further loci it did not open, and they are held in that sitting's own
store, which `session-state` says does not outlive the sitting. On the record as it
stands they are lost at the sitting's end, and the next sitting pays the budget
again to rediscover which of them it has not read.

#### named-on-the-ref-and-resumed

A tradition an expert could not reach is recorded on the disposition ref, named,
with what it was expected to bear on and what stopped the reading, and it stays
there to be resumed in a later round of probing and dialogue with the experts. What
an expert's budget cut off is carried by the record and not by the expert's context
or by the session that launched it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is
owed.

**Content.**

```markdown
---
question: What becomes of a tradition an expert could not reach?
form: rule
under:
  - commons.systems/disposition-graph/readings
---

## Answer

A tradition an expert could not reach is recorded on the ref, named and with what
stopped the reading, and stays there to be resumed in a later round of probing and
dialogue with the experts.
```

#### unreached-tradition-is-recorded-on-the-answer-fact

The tradition is written on the answer fact of the node it was to be read against,
named, with what it was expected to bear on, what stopped the reading, and the
expert that could not reach it. The fact is the locus because an unreached tradition
bears on no option, and the expert's return is the source because no other party can
say what it did not open.

**AI support.** The author's words at `words/2026-09-08/35` fix that such a tradition
is recorded and that it is resumed, and leave where it is written open; this option
answers that and nothing more. The answer fact is where the option list lives, so it
is the smallest place in the record that holds every option the tradition might have
borne on without asserting that it bore on any of them, and it is already the unit
the record uses for everything else about a question's alternatives. Naming the
expert follows `words/2026-09-08/36`, which makes an expert an identified party whose
support and divergence the record keeps per option: an unreached tradition is that
same party's account of what it could not do, and an account with no author cannot be
resumed by asking anyone.

**AI divergence.** A fact accumulates unreached traditions with every round and this
option fixes no bound on the list, so a long-lived node grows a section whose entries
may have been reached since, by another expert or another sitting, with nothing here
striking them. The strike belongs with the reading that resolves the absence, and
`readings` says how a reading is recorded and not how one retires an entry standing
elsewhere; the option does not mint that rule and the gap is named rather than
closed. And the locus is the fact the tradition was to be read against, so a
tradition unreached against three questions is written three times. That is faithful
to what each expert reported and it is not a list of the traditions this record has
not read, which is a different object and one no fact can hold.

**Content.**

From: named-on-the-ref-and-resumed

```diff
@@ -7,6 +7,21 @@
 
 ## Answer
 
-A tradition an expert could not reach is recorded on the ref, named and with what
-stopped the reading, and stays there to be resumed in a later round of probing and
-dialogue with the experts.
+A tradition an expert could not reach is recorded on the answer fact of the
+disposition it was to be read against, named, with what it was expected to bear on,
+what stopped the reading, and the expert that could not reach it, and it stays there
+to be resumed in a later round of probing and dialogue with the experts.
+
+The locus is the fact and not an option, because an unreached tradition bears on no
+option. A relation to an option is what a reading finds, and a reading is what the
+budget stopped, so writing the tradition beside an option would assert the very
+relation the absence consists of. The fact is the smallest thing the record holds
+that the tradition was to be read against, the expert having been convened on the
+question and not on one answer to it, and it is where the next round's expert will
+look, the fact being what it is convened on in turn.
+
+The source is the expert's return. An unreached tradition has no other author: the
+only party that can say what it did not open is the party that was reading, so the
+record takes the naming from the expert's report and the main thread writes it onto
+the fact, as it writes every other conclusion a unit returns. Nothing derives the
+list and nothing can, an absence not being computable from what is present.
```

### authority

The recommendation is `ratified`, at low boldness.

The reading `class-recommendation` calls for: the capture-shaped limb. The party
that would set this answer is the AI, and the answer decides whether an expert must
declare what it failed to reach. A report that omits its gaps is indistinguishable
from a report that had none, because the gap is precisely what is not in it, so the
author cannot audit the omission from the outside and the AI is checked by nothing
but the rule. That is the shape the limb names. The irreversible limb is touched
and is not the ground: an unrecorded gap can be rediscovered by running the survey
again, so what is lost is the budget and not the tradition.

## Account

### Queued, 2026-09-08

Minted in the alignment sitting of 2026-09-08 under the grant at `words/2026-09-08/2`
as refined at `words/2026-09-08/22`, from the author's words at `words/2026-09-08/35`,
which were given while the sitting was in hand and are queued as `movements` and the
alignment skill's queue rule require.

Placed under `readings` because that node owns how a reference to tradition is
recorded, and this is the same question asked of the reference that was never made.
It is a sibling of `stub-traditions` and its converse: that node asks which
traditions the record reads without a node, this one what becomes of a tradition the
record did not read at all.

Its `depends` names two nodes. `expert-instructions`, because the budget is a fact of
what an expert is given and the expert's return is where a gap would be declared, so
where this obligation is written depends on whether there is a standard expert text
to write it in. `round-termination`, because "further rounds" is what the author's
words rest the resumption on, and that a round does not end is that node's answer at
`words/2026-09-08/34`: were a round to end on a verdict there would be no later round
to resume in, and the tracking would be an archive rather than a queue.

The periagogic object is `readings` and its answer on what a reading records;
`stub-traditions` and its enumeration; `expert-instructions`, minted the same day,
and its account of what an expert is given; `transience` and `session-state`, which
own the rule that state not on the ref dies with the sitting, and which this
disposition extends from the author's words to the AI's unfinished reading;
`evaluation`, whose global-tier answer runs every evaluation against tradition; and
the sitting's own store, where the two instances in hand are held.

That last reading was wrong when it was written and the correction is recorded here
rather than made silently. It named the store's residuals R12 and R14 together as the
population this node would move onto the ref. R12 is not: it is some forty-five
traditions the survey of 2026-09-08 forwarded *with* loci and verification status, and
a tradition that was read has a locus and a relation and can be written as a reading,
so what it lacks is a reading node and the debt is `readings`' and `stub-traditions`',
not this node's. The distinction is the whole of why this node exists, so blurring it
in the node's own account was the one error that made the mint look redundant. This
node's population is what has neither locus nor relation because nobody looked: the
loci the tradition reading on the terminator named and did not open, which is R14's
object under a description R14 does not give it, and whatever the telemetry lookup of
the same day would have read had it not reported its WebSearch budget exhausted at
200/200. Whether all forty of R14's loci are unopened, or only some, was exactly the
split the survey was asked to return; it returned it the same day, and the set is
enumerated in the section below.

The words are an observation and a rule, and only the rule is durable. That the
expert's web search budget is fixed and was exhausted is a fact of the harness and
of the day, and it will change. The rule it grounds does not depend on it: any
expert has some bound, the record cannot see which bound stopped it, and what the
rule fixes is that the bound's effect is declared rather than absorbed into a report
that reads as complete. The sitting has an instance in hand and does not yet have
the list: the expert that read tradition against `round-termination` has been asked
to return its unreached loci as such, separated from what it verified and from what
it asserted without verifying, and that return is this node's first tracked set,
recorded below.

### The first tracked set, 2026-09-08

Forty-one loci, returned by the expert that read tradition against
`round-termination` when it was asked to separate what it had opened from what it
had not. This is the node's rule applied to itself before the node is answered: the
author's words say an unreached tradition is recorded on the ref, named and with
what stopped the reading, and here it is, so that the set survives a sitting that
is about to end. It is put in the account because that is where the record can hold
it today, and that placement is wrong in a way named below.

Each entry gives the source as the record has it, what it was expected to bear on,
and what stopped the reading. Two tags divide them. `[named]` is a locus the record
named and never opened: nothing rests on it, and the cost of the gap is only that
the reading was not made. `[evidence]` is heavier -- a citation the record already
uses as evidence and that cannot be shown to have been opened -- and there are seven
of these, which is the finding this list exists to have produced.

1. van Eemeren and Grootendorst, Speech Acts in Argumentative Discussions (Foris
   1984), p. 190 -- whether the three ad hominem variants are their taxonomy or
   Walton's attribution -- no digital text found; cited only at second hand.
   [named]
2. van Eemeren and Grootendorst 1990, edition not fixed -- where the
   resolve/settle contrast first enters their vocabulary -- no digital text
   found. [named]
3. van Eemeren and Grootendorst, Studies in Pragma-Dialectics (1994), pp. 27-28
   -- higher-order conditions before the 2004 restatement -- deprioritised once
   2004 p. 189 was browser-confirmed. [named]
4. Walton, A Pragmatic Theory of Fallacy (Alabama 1995), pp. 118-23 -- illicit
   dialectical shifts, the tradition's name for changing the game mid-exchange
   -- surfaced only through correcting SEP's mis-citation; never returned to.
   [named]
5. Lorenzen and Lorenz, Dialogische Logik (1978) -- whether the dialogue-game
   ancestor of formal dialectic defines a draw -- German, no digital copy found.
   [named]
6. Barth and Krabbe, From Axiom to Dialogue (1982) -- the same draw question in
   English -- no digital text found. [named]
7. Mackenzie, Question-begging in non-cumulative systems, Journal of
   Philosophical Logic (1979) -- whether a commitment store has a defined
   terminal state -- deprioritised. [named]
8. Rescher, Dialectics (SUNY 1977) -- Rescher's formal account of when a
   disputation ends, where Pluralism failed -- bibliographic record only, no
   full text reached. [named]
9. Rescher, Dialectics: A Classical Approach to Inquiry (Ontos 2007) -- the same
   -- no digital text found. [named]
10. Aumann, Agreeing to Disagree, Annals of Statistics 4(6): 1236-39 (1976) --
   whether agents with common priors can knowingly persist in divergence; the
   formal limit case of the "different principles" escape -- deprioritised in
   favour of the dialectical tradition, though named in the author's own
   question. [named]
11. Geanakoplos and Polemarchakis, We can't disagree forever (1982) -- whether
   iterated exchange forces convergence -- never returned to. [named]
12. Elga, Reflection and Disagreement, Nous 41(3) (2007) -- equal-weight;
   whether preserved peer divergence is rationally permissible -- budget;
   deprioritised. [named]
13. Kelly, The Epistemic Significance of Disagreement (2005) -- the
   total-evidence rival to equal-weight -- never returned to. [named]
14. Christensen, Epistemology of Disagreement: The Good News (2007) -- the same
   cluster -- never returned to. [named]
15. Feldman and Warfield eds., Disagreement (OUP 2010) -- the anthology route to
   entries 12-14 -- named as a route, never opened. [named]
16. Habermas, Moral Consciousness and Communicative Action (1990) -- whether
   discourse ethics permits a terminus short of consensus, (D) and (U) --
   deprioritised after TCA I Fig. 18 answered admissibility. [named]
17. Habermas, Theory of Communicative Action vol. II -- lifeworld background as
   an analogue of common ground -- never returned to. [named]
18. Habermas, "fairness-regulating procedures" -- who certifies the terminating
   condition; shipped as one of five limb-A instruments -- locus
   unreconstructable: the expectation is recoverable, the citation is not.
   [evidence]
19. Perelman and Olbrechts-Tyteca, The New Rhetoric (1958/1969) -- the universal
   audience as an idealized third judge -- budget; deprioritised. [named]
20. Toulmin, The Uses of Argument (1958) -- field-dependent warrants, "different
   agents with different principles" in an older vocabulary -- never returned
   to. [named]
21. Wittgenstein, On Certainty -- whether an exchange terminates when the
   parties reach propositions not further arguable -- named in passing, never
   opened. [named]
22. MacIntyre, Whose Justice? Which Rationality? (1988) -- whether parties in
   different traditions can adjudicate between them at all -- never returned to.
   [named]
23. Kuhn, incommensurability, edition not fixed -- the same bearing -- named in
   passing, no edition ever fixed. [named]
24. Rawls, Political Liberalism (1993/2005), Lecture IV -- modus vivendi against
   overlapping consensus, the distinction Rescher's acquiescence occupies --
   never opened. [named]
25. Grice, Logic and Conversation (1975) -- the cooperative default that makes
   silence readable as assent -- deprioritised. [named]
26. Lewis, Scorekeeping in a Language Game, Journal of Philosophical Logic 8
   (1979) -- whether accommodation is automatic, the mechanism by which a
   divergence goes unnoticed -- named, never opened. [named]
27. Grosz and Sidner (1986) -- the negative-evidence default in computational
   dialogue -- named only inside Clark and Brennan's parenthesis. [named]
28. Litman and Allen (1987) -- the same -- the same. [named]
29. Hintikka, interrogative model of inquiry, edition never fixed -- whether
   termination is defined by exhausting the question set rather than by
   agreement -- unlocated, deprioritised. [named]
30. Knight and Leveson, An experimental evaluation of the assumption of
   independence in multiversion programming, IEEE TSE (1986) -- whether
   independently produced artefacts actually fail independently; the strongest
   available support for the `n-version-programming` node -- named, never
   opened. [named]
31. Chen and Avizienis (1978) -- the origin of N-version programming -- never
   returned to. [named]
32. Stigler, The Theory of Economic Regulation, Bell Journal 2(1) (1971) --
   whether AI-convenes-the-experts is capture in the technical sense -- named in
   analysis, never opened. [named]
33. No source was ever named -- whether the segregation-of-duties principle
   survives when one party both proposes and selects the check -- the reading
   never got as far as naming a source; the expectation can be re-derived, there
   is no name to keep. [named]
34. Dalkey and Helmer, Delphi (RAND 1963) -- whether Delphi terminates on
   convergence or on a fixed round count; why the Delphi limb of the survey's
   first finding is unverified -- never opened. [named]
35. Chambers, Registered Reports (Cortex 2013) -- the programmatic statement
   behind the mechanism claim -- deprioritised once the claim was narrowed.
   [named]
36. Kahneman and Klein, Conditions for Intuitive Expertise: A Failure to
   Disagree, American Psychologist 64(6) (2009) -- who certifies the terminus in
   adversarial collaboration -- cannot be shown to have been opened; no unit
   report covers it. [evidence]
37. Civil Procedure Rules (England and Wales) Part 35, rr. 35.3 and 35.12 -- who
   certifies that experts' recorded common ground is genuine -- cannot be shown
   to have been opened; no unit report covers it. [evidence]
38. RFC 7282, On Consensus and Humming in the IETF (2014) -- an operating
   instrument where one party declares the terminus -- cannot be shown to have
   been opened; no unit report covers it. [evidence]
39. van Rooyen et al., BMJ (1999) -- what the trial actually manipulated; the
   correction of the survey's second finding rests on it -- cannot be shown to
   have been opened; no unit report covers it. [evidence]
40. van Rooyen et al. (2010 follow-up) -- the same -- cannot be shown to have
   been opened; no unit report covers it. [evidence]
41. Goldman, Experts: Which Ones Should You Trust?, Philosophy and
   Phenomenological Research 63(1) (2001) -- the five sources available to a
   novice, of which only track record was claimed independent -- cannot be shown
   to have been opened; no unit report covers it. [evidence]

Three entries are worse than the tag says. Entry 33 has no source at all: the
reading formed an expectation about segregation of duties and never got as far as
naming a text, so what can be re-derived is the expectation and there is nothing to
resume. Entry 18 has an expectation and an unreconstructable citation, which is the
same loss with a source that was named once and lost. And entry 10 is Aumann, named
in the author's own question and passed over in favour of the dialectical tradition,
which is the one entry on this list the author can be assumed to know is missing.

The seven `[evidence]` entries are the reason the list is worth its bytes, and they
are not the same defect as the other thirty-four. Six of them, 36 through 41, are
citations the record leans on -- who certifies a terminus in adversarial
collaboration, in the English expert-witness rules, in RFC 7282, and the two van
Rooyen trials on which a correction of the survey's own finding rests -- and no unit
report covers any of them, so the record cannot show that anyone read the thing it
cites. That is not a tradition unreached; it is a claim whose support is unverified,
and it belongs to `readings` and to whatever instrument checks a reference, not to
this node's queue. It is listed here because this is the survey that found it and
the sitting has nowhere else to put it, and it is flagged so that a later reading
does not mistake inclusion here for a decision that these are merely unread.

What this exposes about the placement is a design item and not a defect to repair
now. The account is folded at the recording on `recording`'s test, that re-running a
reading reconstructs it, and this set is precisely what re-running does not
reconstruct, since the whole content of an entry is that nobody looked. So the rule
this node recommends would, on today's encoding, produce a list that dies at the
node's own confirmation. That is the same shape as the probe question settled on
`recording` the same day, and it is the first thing the design owes when this node
leaves the periagogic stage: the tracked set needs a home that survives a recording,
and the account is not one.

### The locus named, 2026-09-08

The option `unreached-tradition-is-recorded-on-the-answer-fact` was recorded in the
alignment sitting of 2026-09-08, under the grant at `words/2026-09-08/2` as refined
at `words/2026-09-08/22`, from the author's words at `words/2026-09-08/35` and
`words/2026-09-08/36` read together. Entry 35 said that an unreached tradition is
recorded on the ref and resumed, and the option already standing carries that; what
35 left open is where on the ref, and entry 36 supplies the other half, the
identified expert who is the party the record names beside the gap.

No recommendation was moved at the recording, and the reason this account first
gave was wrong: it said the author had given the seven steps as an option and
not as a settled answer, and `words/2026-09-08/37` denies it -- they are "an
option, but also current author choice", unconfirmed. What the correction
changed on this fact is in the account below. The asymmetry between the two
options is left standing and named: `named-on-the-ref-and-resumed` carries the
placeholder support and divergence that say the record's case for it is owed,
and this one carries a written case, which makes the newer option look better
argued than the recommended one for a reason that is about what has been written
and not about what is right. The owed case is this node's, and it is on the
sitting's residue.

### The second tracked set, 2026-09-08

The expert `tradition-on-orchestration-shape`, convened the same day on the shape
`words/2026-09-08/36` sets out and grounded in tradition, was asked to separate what it
opened and verified from what it asserted without verifying and from what it did not
reach. It returned twenty-one sources opened and verified, twenty-six items asserted
from training without checking, and twenty loci not reached.

The instance is sharper than the first one and it sharpens this node's rule rather than
merely adding to it. The expert's search budget was not exhausted part-way through its
reading: it was **exhausted before the expert ran a single query**, at 200 of 200, so
the survey ran entirely on fetches of URLs the expert constructed from memory. Twenty-
five were attempted, twenty-one succeeded and four returned 404. The expert declared
the consequence itself, that its verified set is biased toward sources with predictable
public URLs and away from paywalled primary literature, which is a bias in the *shape*
of what was verified and not only in its quantity. A report that had absorbed the bound
would have read as a tradition survey of ordinary coverage; what makes the difference
visible is the declaration and nothing else, which is exactly what this node holds.

The two highest-value unreached loci are recorded here because both bear on a
disposition presently in front of the author, and the second is an asymmetry in the
evidence and not merely a gap in it.

Assurance cases, Goal Structuring Notation, and eliminative argumentation with
defeaters. A defeater-based confidence argument, in which confidence is built by
enumerating and discharging the reasons an argument might fail, is a direct structural
competitor to the design in `words/2026-09-08/36` step 3, which builds confidence by
accumulating support. The expert identified it as the strongest competitor it knew of
and could not open it: the Wikipedia locus returned 404 and it had no search budget to
find the right title.

Recent negative results on multi-agent debate. The expert holds the pro-debate result
and does not hold the results that qualify it, and said so: "an asymmetry in my evidence
bearing directly on C8's premise". The premise in question is the author's current
choice to strike the clean-context review in favour of an expert system, so the record's
evidence on the live question is one-sided in a direction that favours the choice, and
the expert that told us so is the one whose divergence is recorded against it.

The remaining eighteen: IEEE 1012's independence clauses, which would fix the
load-bearing term in the expert's own strongest finding; ICD 203; De Millo, Lipton and
Perlis; Ladha on correlated Condorcet votes; COPE and IESBA specifics; Knight and
Leveson; the Fagan author-and-moderator rule; the knowledge-acquisition bottleneck;
Team B; CBEST's own documents as against the ECB's account of them; the
perspective-based-reading replications; and the Delphi primary sources this record
already carries as unreached.

### The mark, and the correction that moved it, 2026-09-08

`words/2026-09-08/37` corrects the reading this sitting made of `words/2026-09-08/36`.
The sitting read the seven steps as an option emerging from the dialogue; the author
says they are "an option, but also current author choice", unconfirmed. Those are two
different marks and the record collapsed them, and the sentence stating the wrong one
was written into five node accounts before the correction arrived. It is struck above.

What follows from it here: the mark moves to `unreached-tradition-is-recorded-on-the-answer-fact`.
It moves rather than staying because the two options answer the same question, where on the ref an unreached tradition is written, and only the moved-to option answers it: the incumbent says "on the disposition ref" and leaves the locus open, while this one names the answer fact of the node the tradition was to be read against, and names the expert that could not reach it -- so nothing the
incumbent held is dropped by the move, and the fact now shows the author their own
current choice rather than the AI's reading of the option beside it. Nothing acts on
the move: this node is unanswered, and on an unanswered node a moved recommendation is
dialogue and not an act, as `evaluation` says.

One clause of the incumbent is not carried and the record should not lose it by silence: `named-on-the-ref-and-resumed` says the entry "stays there to be resumed in a later round of probing and dialogue with the experts", and the moved-to option says where the entry goes without saying that it is resumed. That is a gap in the moved-to option and is recorded here as one.

### Every expert of the sitting hit the same wall, 2026-09-08

Four experts were convened on 2026-09-08, on `growth`, on `clean-context-review`, on
`what-acts-during-bootstrap`, and the tradition expert recorded above, and each reported
the session's web-search budget exhausted at 200 of 200 before its grounding was
complete. That is a different failure from the ones this node has tracked. The earlier
entries record traditions unreached because a search returned nothing usable or because
the source was not online; these are traditions unreached because the sitting ran out of
a resource that is shared across every unit it launches, and the later a unit is launched
in a sitting the less of it there is.

The consequence for this node's rule is that the locus is right and the trigger is
incomplete. An unreached tradition is recorded on the answer fact of the node it was to
be read against, which is what the moved-to option says and this changes nothing about.
What it adds is that a sitting can now exhaust the budget for reasons that have nothing
to do with any particular node, so an entry written under this rule should say which of
the two it was, or the record will read a shared-resource exhaustion as a property of the
tradition.

The traditions named as unreached by the sitting's experts, kept here so a later round
resumes rather than rediscovers: Talmudic dialectic, on the structure of recorded
disagreement; Tibetan monastic debate, `rtsod pa`, on adversarial examination as a
training instrument rather than a decision procedure; Du et al., arXiv 2305.14325, on
multi-agent debate and whether independent reasoners converge or merely agree; the text
of the South African Constitutional Court's First Certification judgment of 6 September
1996, cited in this sitting from secondary description alone; the thirty-four
Constitutional Principles of the 1993 interim constitution, cited the same way; and
Tunisia's 2011 "Little Constitution", named as the case that most resembles this record's
position and reached least.

What the sitting should have done and did not: state the resource position in the brief.
A unit that knows how much budget remains can choose which of its traditions to spend it
on, and every one of these units learned the budget was gone by hitting the wall. That is
recorded as a requirement on `expert-instructions`, which owns what a brief carries.
