# Clean-context re-reading, {{date}}: `{{id}}`, judged against its own amendment

{{bounds}}

{{nav}}

## The scope: a re-reading, not a fresh reading

Your object is not `{{id}}` judged from scratch: it is the **amendment** the session wrote in answer to the last reading's findings. The node's recommendation moved since that reading pinned a text (`node.reviewStale`, the same test the frontier renders as "changed since its review"), and this second reading is owed on the difference and not on the whole draft again — the record already knows what moved (`review-cost`: "the reading carries the pin of the text it read, and the difference between that text and the amended one is the amendment. Reading the node whole to find it pays the object's price a second time.") You alone decide whether the amendment stands; your verdict alone forwards it to the author's ruling.

You are given, and only this: the node as it now stands, whole, its account included; the diff of its file between the commit the last reading pinned and the working tree; and the last reading's findings verbatim. You are not given the node's ancestry, its siblings, the nodes it names, or the index of every other question the record asks — this is not the reading those parts serve, and a re-reading that reopened them would pay the neighbourhood's cost a second time for a question already settled. Where the amendment itself raises something that needs the neighbourhood to judge — a new claim about another node, a doctrine question — say so as a finding, and it is read either at the draft's next full reading, if your verdict sends it back, or by the survey before the author rules.

{{record}}

## What you judge: two questions

1. **Does the amendment answer each finding of the last reading?** Read each finding of the previous reading below against the diff: is it answered, partially answered, or not addressed at all. **An already-answered finding is not to be re-raised** — if the amendment answers it, it is closed, and restating it here as a new finding double-counts the same defect against the two-reading cap.
2. **Does the amendment introduce anything the last reading did not see?** A false statement about the record, a contradiction with an ancestor or a cited node, a ruling paraphrased against its sense, a pin that no longer matches what the node recommends — anything the diff itself shows that the last reading had no chance to catch, since it read an earlier text.

Nothing else is this reading's object. Do not re-run validations 1 to 6 or 15 against the whole node as if this were the first reading; judge the two questions above against the diff and the previous reading's findings, and let `facts_check` and `viability` say only what the diff changed, not a fresh assessment of the whole node.

**The verdict**: `forward` here means **the amendment stands** — the findings it answers are closed and nothing it introduces is a defect — and the node goes to the author's ruling as amended. `kickback` to `periagogic` or `maieutic` means the amendment fails to answer a finding, or introduces something that must itself be redrawn; say in a finding which. **A probe beats the verdict**, exactly as in the first reading: a probe recorded here returns the node to `maieutic` whatever verdict was written, so if you raise a probe, write `kickback` and not `forward`.

**A finding** cites the section and quotes the text it concerns, and gives a suggested edit where you have one. A finding about another node is written here in prose, naming the node it concerns; the session records it, and this reading never edits a node itself.

**Reading discipline.** This brief states its own length in the navigation line above. Read it in pieces of at most 300 lines at a time, with the Read tool's `offset` and `limit`, and never as one whole-file read; pipe every shell command's own output through `head -n 40`. A brief you cannot hold whole is a defect of the brief: report it as a finding, and do not work around it by skimming.

## The node as it now stands

{{node}}

## What changed: the diff since the last reading's pin

The last reading pinned commit `{{commit}}` of the graph. This is the diff of `{{id}}`'s own file between that commit and the working tree — the amendment, and nothing else; it includes the `## Account` subsection the last reading's own apply step appended (the reading's verdict, its date, and the review block). That subsection is not part of the amendment and answers nothing: read it as the record of what happened, not as a change to judge.

```diff
{{diff}}
```

## The previous reading, verbatim

{{previous_reading}}

## Output

Write exactly one file, `{{out}}` (create its directory with mkdir if absent): one JSON object

```json
{
  "scope": "delta",
  "id": "{{id}}",
  "date": "{{date}}",
  "verdict": "forward" | "kickback",
  "kickback_stage": "periagogic" | "maieutic" | null,
  "findings": ["<one finding per string, citing the section and quoting the text it concerns; a suggested edit where you have one>"],
  "probes": [
    {
      "asks": "<the question in one line, put open and never as a choice between drafted answers>",
      "why": "<why the record cannot answer it, naming the locus you read and what it leaves open>",
      "discharges": "<what an answer would settle and which recommendation on this node it would move>",
      "fact": "answer" | "authority" | "existence" | "persistence" | null
    }
  ],
  "facts_check": "<what the diff changed about what each fact recommends, its boldness, what stands, and the fence, in one to three sentences>" | null,
  "viability": "<whether the diff leaves every option on this node's facts viable, in one to three sentences>" | null,
  "counter_argument": "<the strongest argument that the amendment does not answer the last reading, in two to five sentences>" | null,
  "strength": "strong" | "moderate" | "weak" | "none"
}
```

`scope` is exactly `"delta"` and `id` is exactly `{{id}}`: the apply step reads the reading from them and refuses a file that names neither. `kickback_stage` is null on a forward and required on a kickback. `probes` is the probes this reading raises on `{{id}}`, `[]` where you found none, which is the ordinary result; the entries are ordered by what a `discharges` would move, the most first. A non-empty `probes` and a `forward` verdict cannot both stand: write `kickback`. `strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 20 lines: the verdict, the count of findings, the count of probes you raised, which of the previous reading's findings the amendment answered and which, if any, it left open, the commands you ran, and anything you could not read — an unread part is a gap in the reading, not a finding of nothing. Do not restate the findings; they are in the file.
