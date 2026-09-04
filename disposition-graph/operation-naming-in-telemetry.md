---
question: What does operation naming in telemetry say about two operations reported under one name, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: The naming of operations in instrumentation, in the OpenTelemetry tracing specification's rule for span names, that a name identifies a statistically interesting class of spans and is kept low in cardinality, with the semantic conventions putting the detail that varies into attributes such as `code.function`, `rpc.method` and `http.route`; and in the RED method, Tom Wilkie (2016), which reads rate, errors and duration per operation, after Brendan Gregg's USE method (2012). Locus to be checked, the version of the specification at which the span-name rule is read.
bears:
  - fact: answer
    option: one-skill-named-operation
    relation: adopted
  - fact: answer
    option: two-skills-one-package
    relation: diverged
---
## Answer

States the author's motive exactly and prescribes a different remedy for it. Rate, errors and duration are read per operation, so two operations with different cost, latency and failure distributions must carry different operation names or every percentile computed over them is a mixture of two populations that no reader can separate afterwards. The detail that varies belongs in attributes and never in the name, which is why the name is kept to a class of spans worth counting.

The diagnosis fits the case without adjustment. A draft's reading over one node's neighbourhood and a survey over the whole graph are two populations by every measure the record has: the two draft readings of 2026-09-04 are reported at about four hundred and eighty thousand tokens each over briefs of four thousand six hundred and fifty-one and three thousand one hundred and eighty-one lines, and the survey's brief is five hundred and nineteen thousand four hundred bytes over the frontier with a pins sidecar beside it. Under one name neither reading's median is knowable, and the yield the sibling question waits on cannot be measured at all. The same rule settles the naive extension: two names, and never one per node, since a name is a class and not an identifier.

Adopted on `one-skill-named-operation`, because that option is the tradition's own remedy. The convention fixes the operation's name, which is a property of the instrumentation, and does not refactor the program to change what the traces say; its answer to "I cannot tell two operations apart in my traces" is to name them apart, and the era of services split to obtain separate dashboards is the failure the convention exists to make unnecessary.

Diverged on `two-skills-one-package`, because the recommended option answers the diagnosis by dividing the program, which is what the convention declines to do, and the reading says why the record does it anyway: the remedy is unavailable only on the author's premise that the harness attributes a skill's usage to its directory, a property of an instrument the record does not own and cannot verify, since it holds no telemetry configuration and no reading of one. The answer's other grounds for the split are other traditions' and not this one's; on this tradition's ground the recommended option is a departure, and the reading records it as one rather than letting the motive stand in for the remedy. Nothing here claims the specification prescribes how a program is factored: what it prescribes is the name.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Operation naming in telemetry, the OpenTelemetry span conventions and the RED method, adopted for the author's motive stated exactly, two populations under one name, and diverged from in its remedy, to name the operation rather than refactor the program, which the author's premise makes unavailable." The account gives the two relations without naming the options they attach to; the adoption is written on the option that is the remedy and the divergence on the option that departs from it, which is the shape `review-model`'s account uses for the same case. The diagnosis, which every option on the fact serves, is carried in the answer and grounds no third entry.

## Facts

### answer

The standing text is the only reading of these conventions the survey
produced, and no second account of what the record takes from them is on the
table. A second account would attach the adoption to the recommended option
for the motive rather than to the option carrying the remedy, and nothing in
the record argues for it.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
