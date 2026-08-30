---
id: tactic-rsi-round-trips-lens-carrier
kind: tactic
statement: Re-tag the phase_standup lens any-scope and make
  lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips the named
  carrier for /rsi's unnecessary-round-trips lens, so the per-phase evaluator
  reads the field the instrument already computes
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-08-14 /align round on lens carriers. This is
  the small, immediately-shippable half of that round's finding and must not
  wait on the catalog decomposition: aggregate-usage.sh already computes the
  number that would have caught an 830-second orchestration overhead, and only a
  mis-scoped tag plus a missing carrier reference keep the per-phase evaluator
  from reading it. Serves both strategies honestly — the evaluator surface is
  strategy-recursive-self-improvement's, while the phase_standup lens itself is
  strategy-token-economy clarification 12's artifact. Finalized 2026-08-18 by an
  /align-tactics tactic-mode round into two sonnet units: Unit 1 re-tags lens 10
  and narrows the median discriminator in .claude/skills/rsi-audit/SKILL.md
  (plus two stale fleet-only assertions in aggregate-usage.sh comments); Unit 2
  names the carrier in /rsi lens 2 and fixes Step 2's parenthetical gloss, which
  independently re-asserted the over-wide reading and would have kept the lens
  skipped even after the retag."
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Re-tag the phase_standup lens any-scope and make `lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips` the named carrier for /rsi's unnecessary-round-trips lens

## Context

`/rsi` evaluates one finished dispatch-ladder phase against seven lenses
(`.claude/skills/rsi/SKILL.md:175-207`). Six of the seven name a mechanical
carrier field a reader can query. Lens 2, "Unnecessary round trips"
(`.claude/skills/rsi/SKILL.md:184-186`), names none — it is stated as pure prose
("turns that produced no state change: repeated reads of the same file, a re-run
of a command whose answer was already in hand, `await-repoll` counts against a
phase that was already finished"). A carrier-less lens has no route to its own
evidence: `/rsi` Step 2 forbids hand-reading transcripts (they are multi-megabyte
`.jsonl`), and Step 3's per-session digest is a narrow escape hatch, not a lens
input. So the lens reliably does not run.

**The carrier already exists and is already computed.**
`aggregate-usage.sh` computes

```
lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips
```

at `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1254-1345` — the median
leading consecutive run of "scriptable" (mechanical) tool calls at phase boot,
per qualifying worker session. The script's own docstring states the expected
values at `aggregate-usage.sh:1272-1275`: **qa ~6-7, review ~3-4**, and adds that
wildly different numbers signal the phase→skill filter needs revisiting rather
than necessarily a bug.

**Two doc-level facts, not code, keep the evaluator from reading it.**

1. `.claude/skills/rsi-audit/SKILL.md:131` tags lens 10 (per-phase standup cost)
   **`[fleet-only]`**.
2. `.claude/skills/rsi/SKILL.md:140-145` instructs the scoped caller to skip
   fleet-only figures and explicitly not to re-litigate the tagging — and its own
   parenthetical restatement ("a pooled rate, a **median**, a cross-session
   recurrence") re-asserts the over-wide reading independently of the tag.

So the instrument computed the answer and the evaluator was told not to look.

### Why the fleet-only tag is wrong for this field

The `/rsi-audit` scope condition on `strategy-recursive-self-improvement`
(condition 8) carves out "pooled outcome rates, medians, cross-session
recurrence" as fleet-only — which tags *every* median fleet-only. Its 2026-08-14
amendment narrows that: **tag by what the median is a median OF, never by the word
"median."** A median whose per-session term is itself a rate or a cross-session
quantity is fleet-only as intended; a median of **raw per-session counts**
degenerates at n=1 to that one session's own count and stays meaningful.

`scriptable_round_trips` is `median($runs)` where each element of `$runs` is one
session's own leading-consecutive-scriptable-call count (`aggregate-usage.sh:797`
for the helper, `:1298-1345` for the array construction). Raw per-session counts →
any-scope. `judgment_calls` is the same shape (`median($jud_counts)`).

**Lens 9 (`lenses.baseline_context`, `.claude/skills/rsi-audit/SKILL.md:129`)
stays `[fleet-only]` and this is deliberately NOT the obvious call** — record it
so the next reader does not "fix" it. `median_boot_tokens` is also literally a
median of raw per-session token counts, structurally identical in shape. It stays
fleet-only because its per-session term is a cross-session quantity in disguise:
boot tokens are dominated by the shared always-loaded init footprint
(`CLAUDE.local.md` + `.claude/rules/*`, named on that same line), nearly constant
across sessions, so the "per-session" draws are repeated samples of one fleet-wide
artifact size, not independent per-session behavior. That is the amendment's
*cross-session quantity* branch, not its *raw count* branch.

The field is also computed over the **whole scoped document**, not the
`started_at`-filtered subset `/rsi` Step 2 builds — so reading it sidesteps
`tactic-eval-finding-eval-since-bound-excludes-worker` (recurrence 5, the ledger's
highest), which otherwise drops the orchestrator session row where boot overhead
lives.

### Evidence it would have fired

Review phase of `tactic-attention-namespaced-rank`, 2026-08-13, PR #3075,
`elapsed_s=1026`. Roughly 830 of 1026 seconds and $37.47 of $76.09 were spent
outside the review itself; the orchestrator session alone outspent all five review
lenses combined 2.7 to 1, and 7 of its 12 subagents reviewed nothing. Step 1
opened with 15 Bash calls and invoked `dispatch-derive-node-target` three times
(sandbox-denied, override, then again merely to re-extract `PR_NUM`). Against a
documented expectation of ~3-4, that is a visibly wrong number available without
reading a single transcript.

Caveat for anyone re-deriving these figures: the "one-file +2/-2 delta" quoted
alongside them is the **review phase's own bounded re-review window**
(`target=3cc80c54..HEAD`), recorded on the sibling ledger node
`intentions/tactic-eval-finding-review-orchestration-outspends-review-lenses.md:79-157`
— not PR #3075's full diff, which is +1740/-1366 across 23 files. The two are
consistent once the delta is read as the re-review scope.

### Intended outcome

After this change the per-phase evaluator's lens 2 has a named, queryable carrier;
the scope doctrine states the *median of what* discriminator once, in the place
that governs it; and no site in the repo still asserts `phase_standup` is
unreadable at `--session`/`--node` scope. This is prose-and-comment work only — no
jq logic, no new field, no new script.

### Greenfield vs. what this tactic does

The ideal design, already ruled by the author and carried by the sibling tactic
`tactic-rsi-lens-catalog-decomposition`, is structural: every lens becomes its own
`/rsi-lens-<name>` skill declaring its carrier field, scope tag, execution mode and
model in frontmatter, so a carrier-less lens becomes one that **cannot be invoked**
rather than one that quietly does not run; `/rsi` and `/rsi-audit` reduce to thin
selectors over that catalog. That is the large half and is explicitly out of scope
here.

This tactic is the small half and **must not be blocked on it**: the number that
would have caught an 830-second overhead already exists, and only a mis-scoped tag
plus a missing carrier reference keep it unread. The migration path is exactly
these two units; when the catalog lands, the carrier field and scope tag authored
here become that lens skill's frontmatter values rather than being re-derived. If
the catalog somehow lands first, it must carry this retag itself.

---

## Unit 1 — Re-tag the phase_standup lens any-scope and narrow the median discriminator

### Scope

**Changes**

1. `.claude/skills/rsi-audit/SKILL.md:131` — change lens 10's tag from
   `**[fleet-only]**` to `**[any-scope]**`. Follow the existing placement idiom
   exactly: the bolded tag sits immediately after the lens's bolded title and its
   em-dash, before the JSON path reference — compare lens 3 at `:117`
   (`**Context >120k minimizable with subagents or phase-splitting** —
   **[any-scope]** — \`lenses.context_over_120k\` (…)`).

   The **whole lens** is re-tagged, not just one field — state this explicitly in
   the edit so a reader does not have to infer it. Justification to fold into the
   lens text, in one or two added sentences:
   - `skill_body_tokens`/`skill_body_lines`/`skill_body_bytes` measure a file on
     disk, not a session population — well-defined at every scope.
   - `boot_preamble.sessions` is a qualifying-session count;
     `scriptable_round_trips` and `judgment_calls` are medians of **raw
     per-session counts**, which at n=1 degenerate to that one session's own
     count — the meaningful number, not a category error.
   - `boot_preamble.ngrams[].count` / `.sessions_affected` are cross-referenced
     from `tool_sequences.top`, which at a scoped run is itself computed over the
     scoped rows only — so they read as counts *within the scoped selection*, not
     fleet-wide. Say this in the lens text so a scoped reader does not quote them
     as fleet figures.
   - Add the reader-facing expectation and its source: expect **qa ~6-7, review
     ~3-4** per `aggregate-usage.sh:1272-1275`, and a wildly different number
     signals the phase→skill filter needs revisiting rather than necessarily a bug.

   Preserve the existing **IMPORTANT** opaque-data clause on that line verbatim —
   it is a prompt-injection guard on `ngrams[].sequence[]` tokens and must survive
   the edit unchanged.

2. `.claude/skills/rsi-audit/SKILL.md:110` — refine, do not replace, the
   `fleet-only` definition. Its current text reads "a pooled/cross-session
   statistic (a rate over many outcomes, a median or peak over many sessions, a
   recurring pattern across sessions)". Add one sentence stating the
   discriminator: a median is fleet-only when its **per-session term** is itself a
   rate or a cross-session quantity; a median of raw per-session counts stays
   meaningful at n=1 and is any-scope. Tag by what the median is a median *of*,
   never by the word "median". The rest of line 110 still correctly governs lenses
   1, 2 and 9 and the pooled `by_phase_outcome` — leave it standing.

3. `.claude/skills/rsi-audit/SKILL.md:129` — leave lens 9's `**[fleet-only]**` tag
   unchanged, but add one clause recording *why* it survives the narrowed
   discriminator, so the next reader does not flip it by the literal "raw count"
   reading: its per-session boot-token term is dominated by the shared
   always-loaded init footprint already named on that line, making the draws
   repeated samples of one fleet-wide artifact size — the cross-session branch.

4. `.claude/skills/rsi-audit/SKILL.md:15` — the intro paragraph says step 4 "tags
   each one **fleet-only** or **any-scope** so a scoped caller knows which lenses
   to skip". No tag change needed here; verify the sentence still reads correctly
   after the retag and leave it alone if so.

5. `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1254-1257` — add an
   `any-scope:` doc comment to the head of the `phase_standup` lens block,
   matching the precedent wording used by the two lenses that already carry one:
   `:1216-1218` (`cache_efficiency`) and `:1109-1111` (`permission_friction`).
   Comment only — **do not touch a single line of jq**.

6. `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:112-122` — inside the
   `SCOPING (--session/--node) BEHAVIOR CONTRACT` block, item 2 enumerates "the
   fleet denominators the persisted aggregate feeds" and currently lists
   `lenses.phase_standup` at `:116` among figures that "cannot be reconstructed
   from one session or node's worth of data". Remove `lenses.phase_standup` from
   that enumeration and leave the rest of the list (`by_phase_outcome` rates,
   `lenses.baseline_context` median/peak, cross-session `tool_errors`) intact.
   **The no-Firestore-persist behavior for scoped runs is unchanged** — it rests on
   the `window.days is null` validation reason stated in the same block; only the
   stale justification clause moves.

**Out of scope**

- Any change to the jq program's computation, field names, emitter guard
  (`:1300-1306`), phase→skill map (`:1281`), or classifier (`:802-813`).
- Retagging any other lens. Lenses 1, 2 (`tool_errors`, `tool_sequences.top`) are
  not median-bearing and stay `[fleet-only]`; lenses 3-8, 11, 12 are already
  `[any-scope]`; pooled `by_phase_outcome` (`:277`) stays `[fleet-only]` as a
  pooled rate; the parked-population survey (`:200`, `:242`) is a structural queue
  survey the discriminator does not apply to at all and stays fleet-only by
  definition. Check each against the test rather than retagging in bulk.
- The `--since` bound defect itself (`tactic-eval-finding-eval-since-bound-excludes-worker`,
  its own ledger entry, already at phase done) — do not reopen or conflate.
- The per-lens skill decomposition (`tactic-rsi-lens-catalog-decomposition`).

**Recommended model:** sonnet.

---

## Unit 2 — Name the carrier in /rsi lens 2 and stop Step 2 from re-forbidding it

### Scope

**Changes**

1. `.claude/skills/rsi/SKILL.md:184-186` — extend lens 2, "Unnecessary round
   trips", to name its carrier. Keep the existing prose (repeated reads, re-run
   commands, `await-repoll` counts) and add a clause naming
   `lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips` from the
   Step 2 `--node` document as the lens's mechanical carrier, with the documented
   expectation (**qa ~6-7, review ~3-4**) so a reader can tell a normal boot from
   a bloated one, and with the obligation that follows: report the measured number
   against the expectation every run.

   Match the seven-lens idiom in this file — bold title, em-dash, flat prose
   naming concrete fields in backticks. **Do not** import rsi-audit's
   `**[any-scope]**` bracket-tag convention; that belongs only to rsi-audit's step
   4 lens table. Lens 6 (`:193-197`) is the closest structural sibling: it names a
   concrete field (`elapsed_s` against `window_s`) then states the obligation that
   follows.

   Two mechanics to state in the added clause, both load-bearing:
   - Read the field from the **full** `--node` document, **not** from the
     `started_at`-filtered subset built at `.claude/skills/rsi/SKILL.md:126-134` —
     `phase_standup` is computed over the whole scoped document. That is precisely
     why it sidesteps the `--since` bound that otherwise drops the orchestrator
     session row.
   - `boot_preamble.sessions: 0` means the phase→`by_skill` filter did not match,
     which is an **unmeasured lens, not a zero** — the same doctrine Step 2
     already states for an empty selection at `.claude/skills/rsi/SKILL.md:135-139`.
     Report it as unmeasured and say why; never report `scriptable_round_trips: 0`
     from a zero-session phase as a clean result.

   Note for the implementer: `phase_standup` is currently mentioned **nowhere** in
   `.claude/skills/rsi/SKILL.md` (verified by grep), so this is a net-new
   reference, not an edit to an existing one.

2. `.claude/skills/rsi/SKILL.md:140-145` — the "Which lenses are meaningful at
   this scope is already decided" paragraph stays, including its
   do-not-re-litigate instruction and its `by_phase_outcome` guidance. Fix only
   its parenthetical gloss, which currently reads "A fleet-only figure (a pooled
   rate, a median, a cross-session recurrence)". Left as-is it independently
   re-asserts the over-wide reading and would still tell a reader to skip
   `scriptable_round_trips` even after Unit 1's retag. Restate it to defer to the
   tag: a fleet-only figure is a pooled rate, a cross-session recurrence, or a
   median whose per-session term is itself a rate or a cross-session quantity —
   and the authority is the tag on the lens in
   `.claude/skills/rsi-audit/SKILL.md` step 4, which the evaluator follows rather
   than re-deriving.

**Out of scope**

- Any change to `/rsi`'s Step 1, Step 3, Step 4, Step 6, or the other six lenses.
- Any change to `/rsi`'s write surface or declared remediation list. `/rsi` is
  record-only ("Records; never executes." — `.claude/skills/rsi/SKILL.md:3`); this
  unit adds a *read*, and must not add a fix, edit, transition, merge, or label
  step.
- Adding a `[any-scope]`/`[fleet-only]` bracket-tag column to `/rsi`'s seven-lens
  list.

**Dependencies:** Unit 1. Landing this unit alone would point lens 2 at a field
that `.claude/skills/rsi-audit/SKILL.md:131` still tags `[fleet-only]`, leaving the
two skills in direct contradiction.

**Recommended model:** sonnet.

---

## Reuse

- `.claude/skills/rsi-audit/SKILL.md:110-111` — the canonical `fleet-only` /
  `any-scope` tag definitions and the bolded-token placement idiom. Refine line
  110; do not invent a new tag vocabulary.
- `.claude/skills/rsi-audit/SKILL.md:117` (lens 3) — the exact
  `**Title** — **[any-scope]** — \`json.path\` (…)` shape to copy for the lens 10
  retag.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1216-1218` and `:1109-1111`
  — existing `any-scope:` doc-comment wording to copy verbatim in shape for the
  `phase_standup` block ("every figure is a per-session count … so a
  `--session`/`--node` run's own numbers are well-defined").
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:797-800` — the existing
  0-for-empty-list `median($L)` helper already used by both lens 9 and lens 10. No
  new median implementation is needed anywhere.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1281` — the existing
  `$phase_skill` map (`{implement, fix→fix-checks, qa→qa-fix, review→review-fix,
  main-qa→qa-main}`). Reuse as-is when documenting the phase→skill filter; do not
  restate a second mapping.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1300-1306` — the existing
  emitter guard, already scope-safe by construction (it operates on already-scoped
  `$rows`) and already degrading to `sessions: 0` gracefully. No change needed to
  make the lens any-scope.
- `.claude/skills/rsi/SKILL.md:193-197` (lens 6) — the field-then-obligation
  phrasing pattern for the new lens 2 carrier clause.
- `.claude/skills/rsi/SKILL.md:135-139` — the existing "an empty selection is a
  missing measurement, not a zero" doctrine to cite for the `sessions: 0` case
  rather than writing a new rule.
- `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:537-576` — the existing
  end-to-end fixture harness that already asserts `phase_standup`, including
  `scriptable_round_trips` for a qualifying phase (`implement`, `sessions: 1`,
  `scriptable_round_trips: 4`) and a non-qualifying one (`main-qa`, `sessions: 0`,
  `scriptable_round_trips: 0`). Use this for verification; do **not** write a new
  test script.

## Verification

The verified pre-change baseline on this worktree is **257/257 passed, 0 failed**.
Because both units are comment-and-prose edits, the suite must stay at 257 passing
with 0 failures — a *drop* in the total means the jq program was damaged, and a
*rise* means new assertions were added, which is out of scope here.

```verify
bash .claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

Doc-state assertions — lens 10 flipped, lens 9 held, carrier named, no stale
fleet-only claim about `phase_standup` anywhere:

```verify
set -e
grep -Fq '**Per-phase standup cost (SKILL.md body + boot preamble)** — **[any-scope]**' .claude/skills/rsi-audit/SKILL.md
grep -Fq '**Per-session boot/baseline context** — **[fleet-only]**' .claude/skills/rsi-audit/SKILL.md
grep -Fq 'scriptable_round_trips' .claude/skills/rsi/SKILL.md
grep -Fq 'phase_standup' .claude/skills/rsi/SKILL.md
test ! -e .claude/skills/rsi-audit/scripts/aggregate-usage.sh.orig || { echo "FAIL: the aggregate-usage.sh.orig scratch backup was committed"; exit 1; }
grep -q 'lenses.baseline_context' .claude/skills/rsi-audit/scripts/aggregate-usage.sh || { echo "FAIL: lenses.baseline_context absent from aggregate-usage.sh"; exit 1; }
if grep -n 'lenses.baseline_context' .claude/skills/rsi-audit/scripts/aggregate-usage.sh | sed -n '1p' | grep -q 'phase_standup'; then echo "FAIL: the first lenses.baseline_context line still mentions phase_standup"; exit 1; fi
echo OK
```

```verify
grep -c 'fleet-only' .claude/skills/rsi-audit/SKILL.md
```

The last block is informational: the count must drop by exactly one relative to
the pre-change file (lens 10's tag) — lens 9's tag, the definition bullet at
`:110`, the `by_phase_outcome` note at `:275-277`, and the parked-survey note at
`:200` all remain.

**Manual (observe-in-production).** Confirm the field is populated and
non-degenerate at `--node` scope, on the node whose overhead motivated this:

```
.claude/skills/rsi-audit/scripts/aggregate-usage.sh \
  --node tactic-attention-namespaced-rank --json-out /tmp/claude/rt/probe.json
jq '.lenses.phase_standup.review.boot_preamble
    | {sessions, scriptable_round_trips, judgment_calls}' /tmp/claude/rt/probe.json
```

Expect a non-null `scriptable_round_trips` well above the documented ~3-4 for this
node's review sessions. A `sessions: 0` result means the phase→`by_skill` filter
did not match and the retag alone is not sufficient — **record that as a finding
rather than working around it**; it is exactly the `sessions: 0` case Unit 2
instructs the evaluator to report as unmeasured. This probe reads whatever session
transcripts still exist on the host, so it is an observation, not a gate: a
transcript-aged-out empty document does not block the change.

**Judgment check.** Read the finished `.claude/skills/rsi/SKILL.md:140-145`
paragraph and `.claude/skills/rsi-audit/SKILL.md:110` side by side and confirm a
reader following them in order now *reaches* lens 10 rather than being told twice
to skip it, and that neither text invites the evaluator to re-litigate any other
lens's tag.

