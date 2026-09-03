---
question: How are rejected alternatives recorded?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: a690b78059fc71af0d30081475052a0b71ce3460
under:
  - commons.systems/disposition-graph/node
---

## Disposition

The author, 2026-09-03:
> The under edge disposition lists 'rejected' as prose under 'rationale' - it may make sense to record rejected dispositions, but this seems too ad-hoc.

## Proposal

### Sitting on purpose, 2026-09-03

**Rejected alternatives**

Today they are prose in the rationale, which the author finds ad hoc, and the authority section is to project them. Decision records (Nygard, 2011; MADR) keep the considered options as structure with the reason each lost; IBIS keeps every position with the arguments against it. A list on the node gives the projector the structure and keeps the rationale to why the standing answer stands.

Options:
- (recommended) A rejected list on the node, each entry one alternative answer and why it lost, projected in the authority section; the rationale keeps only why the standing answer stands — authority ratified; boldness moderate; persistence standing; a schema change
- Rejected alternatives as nodes of their own with a rejected class — authority ratified; boldness high; persistence standing
- Prose in the rationale, as now — authority ratified; boldness low; persistence standing

Feeds: `node`, `under`, `projection`, `purpose`, `authority`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Every draft in this batch writes its rejected alternatives as rationale prose, and node's draft states that pattern: 'The rationale says why, and which alternatives were rejected and for what reason.' Adopting option 1 means rewriting purpose, authority, node, instruments, readings, namespaces, projection and model before they are recorded. The option does not say so. Suggested edit: state the ordering consequence in the facts.
- The option says 'the rationale keeps only why the standing answer stands'. Several rationales argue by elimination, so the reason the answer stands is the reason the alternatives fell; readings' rationale reduces to 'parsimony of mechanism against parsimony of files'. Splitting them can leave the rationale without its argument. Suggested edit: say that a rationale may cite its rejected entries.
- The option does not say what a rejected entry contains: a title and a reason, or the alternative answer's text; nor whether an entry is versioned if the alternative is later adopted. The proposals in this batch already use title, dash and reason, which is structure by convention.

On the three facts: Ratified, moderate boldness, standing, and a schema change, is right. The facts should add that adopting it requires rewriting eight drafts in this same batch before any of them is recorded.

Strongest counter-argument (weak): The author's objection was that the '### Rejected' section 'seems too ad-hoc' as a projection source, and projection's draft already answers it by projecting the alternatives into the authority section. If the projector can read them from the rationale prose, the schema change buys structure for the projector at the price of a field every node must maintain and that will accumulate entries nobody prunes, which is the drift the record resists; if it cannot, the change is required. The proposal does not say which, so the case for option 1 rests on an unstated fact about the projector. Establishing that fact is cheap and would settle the question without a schema change.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The counter-argument says 'the case for option 1 rests on an unstated fact about the projector' and that establishing it is cheap. Established: packages/disposition/browser-template.html line 439 matches a rationale heading with /^rejected\b/i and renders it as a '.rejected' section, so the projector already reads rejected alternatives from rationale prose and no schema change is required for the projection the author asked for. That fact belongs in the node and materially favours option 3.
- Every draft in this batch writes its rejected alternatives as rationale prose, and node's draft states the pattern: 'The rationale says why, and which alternatives were rejected and for what reason.' Adopting option 1 means rewriting purpose, authority, node, instruments, readings, namespaces, projection and model before they are recorded. The option does not say so.
- The option says 'the rationale keeps only why the standing answer stands'. Several rationales argue by elimination, so the reason the answer stands is the reason the alternatives fell; readings' rationale reduces to 'parsimony of mechanism against parsimony of files'. Suggested edit: say a rationale may cite its rejected entries.
- The option does not say what a rejected entry contains, nor whether an entry is versioned if the alternative is later adopted. The Proposals in this batch already use title, dash and reason, which is structure by convention.

On the three facts: The frontmatter recommendation (ratified, moderate) is right for option 1 as stated. Now that the projector fact is established, the facts should say that option 1 is optional rather than required, and that adopting it requires rewriting eight drafts in this batch before any is recorded.

Strongest counter-argument (moderate): The author's objection was that the '### Rejected' section 'seems too ad-hoc' as a projection source, and the projector already reads it, so the schema change buys structure for the projector at the price of a field every node must maintain and that will accumulate entries nobody prunes — the drift the record resists elsewhere. With the projector fact now established, option 3 (prose in the rationale, as now) answers the author's objection at zero cost, provided the browser's heading match is documented as the contract rather than left as an accident of the template.

The session's reply: Validated: the browser renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, which favours the third option; the first option would rewrite eight drafts before recording, and a rationale may cite its rejected entries. Stage ruling.
