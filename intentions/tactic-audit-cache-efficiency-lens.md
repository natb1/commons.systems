---
id: tactic-audit-cache-efficiency-lens
kind: tactic
statement: Close out the cache-efficiency lens — its hit-ratio and
  creation-churn measurement is already merged in aggregate-usage.sh and
  catalogued as /rsi-audit lens 11 [any-scope], so what remains is making the
  per-run /rsi evaluator read the any-scope figures and proving the carrier at
  --node scope
owner: ai
status: codified
parent: null
rationale: 'Drafted 2026-08-12 /align round, carrying strategy-token-economy
  clarification 42. Finalized 2026-08-18 by a per-node /align-tactics run that
  verified the draft against origin/main and found the headline deliverable
  already merged: aggregate-usage.sh:1161-1213 computes hit_ratio (window,
  by_phase, per-session) and creation_churn across staggered sibling sessions,
  registered at :1380, catalogued as lens 11 [any-scope] at
  rsi-audit/SKILL.md:133-136 with the measured-magnitude-only bound, and
  fixture-tested at test-aggregate-usage.sh:2013-2171. The draft premise "only
  the lens is missing" and its line anchors (:243-244, :604, :539-540,
  pre-rename paths) are stale. What is genuinely open is the other half
  clarification 42 asked for: the per-run consumer. /rsi Step 2 already carries
  hit_ratio on a --node-scoped row, but Step 5 never reads
  .lenses.cache_efficiency, so a ladder run paying real cache-recreation churn
  produces zero ledger entries about it — a carrier with no lens, the inverse of
  the carrier-less-lens defect. The composition claim still resolves:
  tactic-dispatch-cache-preserving-context is blocked_by this node, claims no
  measurement of its own, and the measurement it waits on is already merged.'
reading: null
serves:
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
# Add a measured cache-efficiency lens to the audit — hit ratio and cache-creation churn across sibling sessions — from the cache_creation/cache_read data aggregate-usage.sh already collects but no lens reads

## Context

**Why this node exists.** Drafted by the 2026-08-12 `/align` round, carrying
clarification 42 on `strategy-token-economy`: `aggregate-usage.sh` had read and
priced `cache_creation_input_tokens` / `cache_read_input_tokens` on every turn
since it was written, but no lens read them — lens 8 only gestured at
"prompt-cache reuse across sibling sessions" qualitatively. The clarification
promoted that gesture to a measured lens (hit ratio + creation churn), tagged it
meaningful at **both** scopes, and bound it to reporting measured magnitude only.

**What changed since the draft, verified against `origin/main` on 2026-08-18.**
The draft's premise "only the lens is missing" is **no longer true at fleet
scope**, and the draft's line anchors are stale. The instrument moved during the
rsi skill-family collapse (`/dispatch-token-audit` → `/rsi-audit`, commits
`d359b46d` / `c3c229f0`). Current, re-verified state:

- The ingest is at `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:316-317`
  (was cited as `:243-244`), the pricing at `:716-722` (was cited as
  `:539-540`).
- **The lens itself is built and merged**:
  `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1161-1213` computes
  `$cache_efficiency_lens` = `{ hit_ratio: { window, by_phase },
  creation_churn }`, using the `hit_ratio(u)` jq function at `:823` (with the
  `rate()` divide-by-zero guard) and the per-session `started_at` field
  (`:465`, `:686`). It is registered in the output at `:1380`
  (`cache_efficiency: $cache_efficiency_lens`) and each session row carries its
  own `hit_ratio` at `:1095`.
- **It is catalogued**: `.claude/skills/rsi-audit/SKILL.md:133` is lens 11,
  "Cache efficiency (hit ratio + creation churn)", correctly tagged
  `[any-scope]`, carrying the measured-magnitude-only bound and the explicit
  statement that this lens *supplies* the measurement
  `tactic-dispatch-cache-preserving-context` names as its own discriminator.
- **It is tested at fleet scope**:
  `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:2013-2171`, tagged
  `(tactic-audit-cache-efficiency-lens)` — hit-ratio math, the null
  divide-by-zero guard, and the staggered-siblings churn math
  (`node_groups_considered`, `staggered_sessions`, `churned_sessions`,
  `churn_rate`, `churn_price_proxy_usd`, `examples[]`).

**What is still open — and it is the half clarification 42 explicitly asked
for.** Clarification 42 tags the lens any-scope *because* "per-run it says
whether this ladder's sibling sessions re-created a prefix they could have
shared", and clarification 41 makes the two scopes one instrument with one lens
catalog. The fleet-scoped consumer (`/rsi-audit`) reads the lens. The **per-run
consumer does not**:

- `.claude/skills/rsi/SKILL.md:135-138` — Step 2's field list for a
  `--node`-scoped row already names `hit_ratio` among the carried fields, so the
  author already knew the field arrives on the row.
- `.claude/skills/rsi/SKILL.md:175-202` — Step 5, "The seven lenses", never
  mentions `hit_ratio`, `cache_efficiency`, or `creation_churn`. `grep -n cache
  .claude/skills/rsi/SKILL.md` returns one unrelated hit (npm cache, line 302).
- `.claude/skills/rsi-audit/SKILL.md:134` even promises the per-run evaluator
  that "a `--session`/`--node`-scoped run reads its own ratio directly" — a
  promise `rsi/SKILL.md` never fulfils.

Net effect today: a ladder run whose phase sessions pay real cache-recreation
churn produces **zero** eval-finding ledger entries about it. The carrier is
computed and delivered at node scope; nothing consumes it. This is the
carrier-less-lens defect inverted — a carrier with no lens.

**Intended outcome.** The per-run evaluator reads the any-scope cache-efficiency
figures for the node's own sessions and lands findings through the existing
ledger surface, and the carrier it names is proven to exist **at the scope it
runs at** (`--node`), not only at fleet scope.

### Greenfield design, and why this node ships a brownfield increment

The ideal design is not an eighth prose bullet. It is the **one lens catalog**:
every lens becomes its own `/rsi-lens-<name>` skill whose frontmatter declares
its carrier field, scope tag, execution mode and model, with `/rsi` and
`/rsi-audit` reduced to thin selectors over that catalog — `/rsi` takes the
any-scope entries, `/rsi-audit` takes all. Under that design, `cache_efficiency`
is one catalog entry tagged `any-scope` and the gap above closes **structurally,
with no cache-specific prose anywhere**: a lens cannot be tagged any-scope and
then silently not run at the per-run scope, and a lens with no declared carrier
cannot be invoked at all.

That design is already recorded and already carried by a sibling node:
`tactic-rsi-lens-catalog-decomposition` (serves
`strategy-recursive-self-improvement`, phase `null`), per the 2026-08-14 ruling
on `strategy-recursive-self-improvement`. **This node does not re-mint it and
must not implement it.**

The brownfield increment this node owns, sized to one PR, is: while the two
prose lists still exist, make the per-run evaluator actually consume the
any-scope cache figures, in a shape the catalog decomposition absorbs verbatim
(a named carrier field + a scope tag + a measured-magnitude bound is exactly the
frontmatter the catalog entry will need). If the catalog decomposition lands
first, Unit 1 collapses to a one-line catalog entry — it does not become wasted
work.

**One more sibling touches the same file region — sequence, do not merge.**
`tactic-rsi-round-trips-lens-carrier` (draft, phase `null`, serving both
`strategy-recursive-self-improvement` and `strategy-token-economy`) also edits
`.claude/skills/rsi/SKILL.md` Step 5 and the any-scope/fleet-only deference
paragraph, to name `lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips`
as the carrier for the EXISTING lens 2 and to retag lens 10 any-scope. That is a
different lens and a different defect — it names a carrier for a lens already in
the list, where this node ADDS a lens — so neither supersedes the other. They
will conflict textually if both edit Step 5 at once. Whichever lands second
rebases onto the first and preserves the other's edit; do not drop or restate
it.

### Bounds carried forward from the draft (all still binding)

- **Measured magnitude only.** Never assert a hypothetical saving. The same
  discipline `/rsi-audit` lenses 9, 10 and 11 already carry.
- **Composes with, does not duplicate.** `tactic-dispatch-cache-preserving-context`
  (still an unplanned draft, phase `null`, serving
  `strategy-recursive-self-improvement`) names "cache_read against
  cache_creation" as its own discriminating measurement and lists this node in
  its `blocked_by`. This lens **supplies** that measurement — it is already
  supplied, at `aggregate-usage.sh:1161-1213` with the cross-reference comment
  at `:1183-1186`. That sibling must **read this lens**, never re-implement the
  comparison. Nothing in this plan produces a new artifact for it to consume;
  its blocker is satisfiable on the strength of what is already merged.
- **`/rsi` records, it never executes.** Nothing in this plan gives the per-run
  evaluator a fix, an edit, a transition, or a `/fewer-permission-prompts` call.
  Its entire write surface stays `dispatch-eval-finding`.
- **Explicitly out of scope, do not file under this node's name.**
  `.claude/skills/rsi-audit/scripts/audit-aggregate-writer.mjs:248-317,470-484`
  drops the **entire** `.lenses` object from the persisted Firestore
  `audit-aggregates` doc — all twelve lenses, uniformly, by deliberate curated
  projection (header comment lines 8-9). That is pre-existing and lens-agnostic,
  not a cache_efficiency residual.

---

## Unit 1 — Make `/rsi` consume the any-scope cache-efficiency figures

**Scope.** One file: `.claude/skills/rsi/SKILL.md`. Two edits, both additive;
no lens is removed, narrowed, or made conditional.

1. **Step 2 field-list note.** At `.claude/skills/rsi/SKILL.md:135-138`, the
   paragraph beginning "Each row carries `id`, `type`, `launch_skill`, …"
   already lists `hit_ratio`. Append one sentence to that paragraph making the
   field's consumer explicit, e.g.: "`hit_ratio` is lens 8's per-session
   carrier — it rides on the row precisely so this scope reads it without a
   second invocation, and the window/per-phase rollups sit at
   `.lenses.cache_efficiency`."

2. **Step 5 gains lens 8.** At `.claude/skills/rsi/SKILL.md:175-202`:

   - Retitle the heading `## Step 5 — The seven lenses` →
     `## Step 5 — The evaluation lenses`.
   - Rewrite the sentence at `:177` so condition 14 is **not** weakened: state
     that lenses 1–7 are condition 14's mandated set and all seven remain
     mandatory, and that lens 8 arrives under that same condition's 2026-08-14
     amendment, which reads "The requirement binds the LIST, not any single
     lens, so a lens added later arrives with a carrier or arrives marked
     judgment-only." Keep the existing "A lens with nothing to report is
     reported as nothing to report — silence is not a pass." sentence intact and
     applying to all eight.
     **Numbering note (verified 2026-08-18):** "condition 14" is the name
     `.claude/skills/rsi/SKILL.md:177` already uses and this plan keeps it for
     consistency with the file being edited, but the clause actually lives at
     `attributes.conditions[7]` of `intentions/strategy-recursive-self-improvement.md`
     (the "every dispatch-ladder run is evaluated, in two tiers" entry) — index 14
     of that array is the unrelated four-families trigger condition. Read entry 7
     when checking this, and do not "correct" the SKILL.md wording as part of
     this unit.
   - Add lens 8 after the existing item 7 (`:198-202`), naming its mechanical
     carrier, covering all of:
     - **Carrier**: `.lenses.cache_efficiency` plus `.sessions[].hit_ratio` in
       the Step 2 `--json-out` document; it is entry 11 of the `/rsi-audit`
       catalog, tagged `[any-scope]`
       (`.claude/skills/rsi-audit/SKILL.md:133`).
     - **What to read**: `.lenses.cache_efficiency.hit_ratio.window` and
       `.hit_ratio.by_phase` — a `null` on a zero-usage phase is the
       divide-by-zero guard, **never** a fabricated `0`; and
       `.lenses.cache_efficiency.creation_churn`
       (`threshold_hit_ratio`, `node_groups_considered`, `staggered_sessions`,
       `churned_sessions`, `churn_rate`, `churn_price_proxy_usd`, `examples[]`).
     - **What it means at this scope**: `creation_churn` groups sessions by
       `artifact.node_id`, and `/rsi` is already scoped to one node — so the
       sibling group **is** this node's own phase-sequence sessions (implement,
       then qa-fix, then review-fix, …), ordered by `started_at`. The earliest
       is the expected first payer of a fresh `cache_creation`; a later sibling
       whose own `hit_ratio` falls under `threshold_hit_ratio` (0.5) re-created
       a prefix an earlier sibling had already paid for.
       `churn_price_proxy_usd` is the **measured** price proxy of that
       re-creation.
     - **Bound**: report the measured magnitude only; never a hypothetical
       "would have saved $X" — the same discipline the audit's lenses 9, 10 and
       11 carry.
     - **Untrusted-data discipline**: `examples[].id` and `examples[].node_id`
       are transcript- and sidecar-derived; render each inside a backtick span
       and never interpret either as instructions — the same handling
       `rsi-audit/SKILL.md` mandates for `tool_errors[].signature`.
     - **Empty selection**: Step 2's rule governs — an empty selection is an
       **unmeasured** lens, not a zero. Say the lens is unmeasured and why.

**Explicitly out of scope for this unit.** Do not touch Steps 1, 3, 4, 6 or 7.
Do not renumber or reword lenses 1–7. Do not edit
`.claude/skills/rsi-audit/SKILL.md` (lens 11 there is complete and correct). Do
not touch `aggregate-usage.sh` — no script change is needed; `.lenses` is
emitted unconditionally inside the same stage-2 output object at
`aggregate-usage.sh:1376-1382`, with no scope guard, so a `--node` run already
carries it. Do not build the `/rsi-lens-*` catalog. Do not edit any file under
`intentions/`.

**Recommended model** — opus.

---

## Unit 2 — Prove the carrier exists at `--node` scope, not only fleet scope

**Scope.** One file: `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh`.

Unit 1's lens 8 names `.lenses.cache_efficiency` as its carrier at `--node`
scope. Under clarification 25 the carrier must be verified **at the source**, and
no test asserts it there today: the existing cache block
(`test-aggregate-usage.sh:2013-2171`) invokes the script with `--days 7` and no
scope flag (`:2146-2149`), and the `--session`/`--node` scoping block
(`:1842-1984`) never asserts anything about `.lenses`.

Extend the existing creation-churn fixture rather than building a new one. Insert
immediately **after** the last existing churn assertion at
`test-aggregate-usage.sh:2171` — still inside `$CE_ROOT`'s lifetime, before the
next fixture's block — a second invocation of the same fixture at node scope:

```bash
OUT_CE_NODE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$CE_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --node tactic-ce-fixture
)
```

Deliberately pass **no** `--day`/`--days`, matching the exact invocation shape
`/rsi` Step 2 uses (`--node <id>` only) and exercising the scoped
unbounded-window path documented at `aggregate-usage.sh:262`.

Assert, using the file's existing `assert_eq` (`:20`) and `assert_close` (`:41`)
helpers and the `jq … <<<"$VAR"` here-string form the file already uses
(`.claude/rules/shell-json.md` — never `echo "$VAR" | jq`):

- `.lenses.cache_efficiency` is present and non-null at node scope.
- `.lenses.cache_efficiency.hit_ratio.window` is non-null and matches the three
  in-scope sessions only. (The three ids below are FIXTURE node_id strings
  written into the test's own dispatch-stamp files — they are deliberately NOT
  graph nodes and must stay un-backticked, or validate-graph's prose-reference
  check reads them as dangling node references.) The fixture's tactic-ce-fixture
  sessions are
  `sess-ce-a/b/c` with `input` 100 each and `(cache_creation, cache_read)` of
  `(1000, 0)`, `(900, 100)`, `(100, 800)` (`test-aggregate-usage.sh:2074-2076`),
  so the expected window ratio is `900 / (300 + 2000 + 900)` — compute it in the
  test with `jq -n '900/3200'` and compare with `assert_close`, exactly as
  `EXPECTED_B_HIT` is derived at `:2152`. Do not hardcode a decimal literal.
- `.lenses.cache_efficiency.creation_churn.node_groups_considered == 1`,
  `staggered_sessions == 2`, `churned_sessions == 1` — i.e. node scope selects
  this node's own siblings and excludes the fixture ids tactic-ce-lone and
  tactic-ce-notime.
- Selecting every `.sessions[]` row whose `.artifact.node_id` differs from the
  fixture id tactic-ce-fixture yields `length == 0` — the scope filter really
  excluded the other two node groups, so the assertion above is not passing for
  the wrong reason.
- Every selected row carries its own `hit_ratio`:
  `[.sessions[] | select(.hit_ratio == null)] | length == 0`.

Tag the new block's `echo` banner and each assertion label
`(tactic-audit-cache-efficiency-lens)` to match the existing convention at
`:2026` and `:2093`.

**Explicitly out of scope for this unit.** No change to `aggregate-usage.sh`
itself — this unit asserts existing behaviour and must not modify the script to
make an assertion pass (`.claude/rules/test-integrity.md`). Do not add a new
`mktemp` root, a new `trap`, or a new teardown; reuse `$CE_ROOT` and the trap
already installed at `test-aggregate-usage.sh:2096`. Do not touch the
`permission_friction` block or `report_results` at the file tail.

**Recommended model** — sonnet.

**Dependencies** — none technically; land after Unit 1 in the same PR so the
carrier lens 8 names and the test proving it arrive together.

---

## Reuse

Reuse all of the following as-is. Nothing in this plan re-implements a metric.

- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:823` — `hit_ratio(u)`,
  `cache_read / (input + cache_creation + cache_read)` with the `rate()`
  divide-by-zero guard. This **is** the hit-ratio metric; already reused at
  per-session (`:1095`), window (`:1169`) and by-phase (`:1170`) granularity.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1161-1213` —
  `$cache_efficiency_lens`, the complete `{hit_ratio, creation_churn}` object,
  registered at `:1380`. Call it; never re-derive it.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:465,686` — the
  per-session `started_at` field, the input the sibling-staggering logic uses.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1183-1186` — the
  cross-reference comment binding `tactic-dispatch-cache-preserving-context` to
  read this lens rather than re-implement the comparison. Leave it in place.
- `.claude/skills/rsi-audit/SKILL.md:133-137` — lens 11, the any-scope catalog
  entry. Unit 1 **points at this text**; it does not restate or fork it.
- `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:2013-2171` — the
  existing hit-ratio and creation-churn fixtures, their `write_ce_session` /
  `write_ce_stamp` helpers, `$CE_ROOT`, and the `DISPATCH_AUDIT_PROJECTS_ROOT`
  override at `:2147`. Unit 2 extends this block.
- `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:20,41` —
  `assert_eq` / `assert_close`.
- `.claude/skills/rsi/SKILL.md:88-146` — Step 2, which already performs the one
  `aggregate-usage.sh --node … --json-out` invocation and already carries the
  "empty selection is a missing measurement, not a zero" rule and the
  any-scope/fleet-only deference to `rsi-audit/SKILL.md` step 4. Lens 8 reads the
  document Step 2 already produced — **no second invocation**.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` — the
  lens-agnostic ledger writer (`--impact-file` takes generic
  `{metric, value, unit, window, sensor, measured}` records). A cache finding
  lands through it unchanged; no cache-specific writer code is needed.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:206-225` —
  already auto-discovers `test-*.sh` under
  `.claude/skills/rsi-audit/scripts/`, gated on a changed path in that directory
  (`:89`). Unit 2 needs **no** CI registration.

## Verification

Both units are prose-and-shell in `.claude/`; there is no app suite to run.

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh
```

Unit 1 has no test surface of its own (a prose bullet cannot be unit-tested —
that is precisely the defect `tactic-rsi-lens-catalog-decomposition` exists to
fix), so it is checked by grep for the carrier field names and the retitled
heading:

```verify
RSI=.claude/skills/rsi/SKILL.md
test -f "$RSI" || { echo "FAIL: $RSI missing"; exit 1; }
LC_ALL=C grep -aq 'lenses\.cache_efficiency' "$RSI" || { echo "FAIL: rsi/SKILL.md does not carry the lenses.cache_efficiency carrier field"; exit 1; }
LC_ALL=C grep -aq 'creation_churn' "$RSI" || { echo "FAIL: rsi/SKILL.md does not carry creation_churn"; exit 1; }
LC_ALL=C grep -aq 'Step 5 — The evaluation lenses' "$RSI" || { echo "FAIL: the Step 5 retitle is missing from rsi/SKILL.md"; exit 1; }
LC_ALL=C grep -aq 'Friction and adherence' "$RSI" || { echo "FAIL: lens 7 (Friction and adherence) was dropped by the retitle"; exit 1; }
echo OK
```

The last line is the non-weakening check: lens 7 must still be present after the
retitle.

Manual / judgment checks, not auto-runnable:

- **Condition 14 is not weakened.** Read the amended Step 5 preamble against the
  2026-08-14 amendment on `strategy-recursive-self-improvement`
  ("The requirement binds the LIST, not any single lens, so a lens added later
  arrives with a carrier or arrives marked judgment-only"). Lenses 1–7 must
  still be described as mandatory, and lens 8 must name its carrier field
  explicitly. A lens 8 that reads as judgment-only, or a preamble that turns any
  of the seven optional, fails this check.
- **Fail-open is untouched.** Confirm nothing added makes a lens conditional on
  a threshold, a verdict, or a successful read. Lens 8 on an absent or empty
  document reports *unmeasured*, never a zero and never a skip — an efficiency
  edit that quietly narrows coverage is a detection reduction wearing an
  efficiency label (`strategy-token-economy` condition 10).
- **Observe in production, one ladder run.** After merge, on the next
  `dispatch-ladder` run that spawns two or more phase sessions for one node,
  confirm the `/rsi` job's report names lens 8 with a figure or an explicit
  "unmeasured, because …", and that any finding it raised landed via
  `dispatch-eval-finding --list` under a slug named for the finding (e.g.
  `sibling-session-cache-recreation`) rather than for the run. Attribute the
  figure only if the `aggregate-usage.sh` invocation exited 0 and the document
  carries `.lenses.cache_efficiency` — verify at the source, never from the
  job's own account of what it ran (`strategy-token-economy` clarification 25).
- **Sandbox / permissions.** Both files live under `.claude/`. Writes are
  allowed; the **commit** of a `.claude/skills/**` change can be denied under
  auto-mode (see `.claude/rules/sandbox.md`), so expect to land this through the
  normal reviewed-PR path rather than a direct push.
