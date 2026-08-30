---
id: tactic-review-domain-lens-consolidation
kind: tactic
statement: Fold the secrets, auth, and data-exposure review lenses into one Opus
  sweep agent carrying all three briefs as sections
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-31 review-fix token audit interview.
  Measured $41.55 across three separate Opus agents for 2 confirmed findings,
  each re-reading the same diff. Author approved the fold and explicitly
  retained Opus, declining an unevidenced Sonnet demotion (condition 3 routing
  approval). Finalized 2026-08-03: classification confirmed homogeneous (all
  three sources already SEC_SOURCES with OWASP/STRIDE filled, unlike the sibling
  tactic-review-api-cost-lens-merge's classification conflict), so this is a
  pure agent-consolidation change with no author ruling blocker."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.01
  rationale: >-
    Author-directed 2026-08-01: prioritize review-phase token/agent-cost
    reduction. Puts this tactic ahead of the undecomposed baseline and on par
    with other tier-2 improvement work, without contending with active
    reliability fixes (top-of-band ~55-61).


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.01 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-review-domain-lens-consolidation
  pr: 3024
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-03T18:15:42Z
    mergeCommitSha: 7deaf80b09354c578bb2aeb8462b5110047e1df1
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: "Both needs-main items await events that have not occurred yet: item 15
    awaits the next live /review-fix run on an app_or_rules code-surface diff
    post-merge (source PR #3024 merged 2026-08-03T18:15:42Z, ~1h ago) —
    journalctl for dispatch-claude-daemon.service since the merge shows no
    activity, and the one PR merged after (#3011, 19:00:41Z) carries no
    'domain-sweep'/'find:domain'/'wave 2' mention in its 11 review comments, so
    no post-merge run with the new finder has happened yet; item 16 awaits the
    next /dispatch-token-audit window with post-merge runs, which needs a
    comparable audit window (the baseline was 18 runs over 5 days) and cannot
    exist after only ~1h. Earliest useful re-check: after the next app_or_rules
    PR clears /review-fix post-merge for item 15, and after the next multi-day
    /dispatch-token-audit window for item 16."
  since: 2026-08-03
  recommendation: No author decision needed for either item — both are WAIT holds
    on elapsed time/events, not judgment calls. Re-select this node once the
    awaited events have occurred; no research beyond this session's re-assert is
    required.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Fold the secrets, auth, and data-exposure review lenses into one Opus sweep agent carrying all three briefs as sections

## Context

Surfaced by the 2026-07-31 review-fix token-audit interview. Measured over 18
review-fix runs, 2026-07-27 to 2026-07-31:

| lens | agents | draw | findings | upheld | avg peak ctx |
|---|---|---|---|---|---|
| `secrets` | 16 | $22.60 | 5 | 2 | 63,542 |
| `auth` | 5 | $10.19 | 5 | 0 | 73,613 |
| `data-exposure` | 5 | $8.76 | 4 | 0 reached verify | 67,089 |

$41.55 across three separate Opus agents for 2 confirmed findings. Each agent
independently re-reads the same diff — that repeated context derivation, not
the lens content, is the waste. The fix is one agent that reads the diff once
and carries all three briefs as labelled sections.

These lenses DO surface findings `/security-review` misses, but that test is
nearly vacuous: `/security-review` produced **1 finding across all 18 runs**.

**Model tier — author ruling (2026-07-31).** The author approved the fold and
explicitly RETAINED Opus, declining a Sonnet demotion. Recorded rationale:
there is no evidence on Sonnet's detection quality for these lenses — no
Sonnet arm has ever run — and a lens that quietly stops finding things is
indistinguishable from a clean diff. Condition 3 of `strategy-token-economy`
requires routing changes be grounded in verified yield metrics and explicitly
approved; an unevidenced demotion meets neither bar. A tier change later needs
a measured A/B on the same diffs, not an assumption. **No unit below may
change the finder's model.**

**Quality-preservation constraints carried into the plan** (condition 5 of the
serving strategy: structural restructuring is the sanctioned lever, removing a
lens is not):

- Every brief is preserved verbatim. The saving is one diff read instead of
  three, never a shorter checklist.
- Each finding still sets its own `Source` (`secrets`, `auth`, or
  `data-exposure`) so per-lens yield stays measurable in the next audit — do
  NOT collapse them to a single source name, or this decision becomes
  unauditable next window.
- `red-team` and `input-validation` are NOT part of this fold — they carry the
  security signal (27 confirmed findings between them) and stay separate.
- The trigger asymmetry is preserved exactly (see below). This fold changes
  agent COUNT, never coverage.

**Trigger asymmetry — the load-bearing detail, verified against live code**
(`.claude/workflows/review-fix.js:490-502`): `secrets` fires whenever
`surface === 'code'` (unconditional, pushed at :496), while `auth` and
`data-exposure` fire ONLY when `app_or_rules` is also true (pushed at :498).
The merged finder must not widen auth/data-exposure to fire when
`app_or_rules` is false, and must not suppress secrets when it is false. The
design below keeps a single agent name and varies only which brief sections
its prompt carries, derived from the same `app_or_rules` predicate.

**Classification homogeneity confirmed — no policy question here.** All three
lenses already fall through the generic `finderPrompt` branch (:778-785), all
fill OWASP/STRIDE, and all three are already members of `SEC_SOURCES`
(:1357-1366). Unlike the sibling `tactic-review-api-cost-lens-merge` (parked
to office_hours on exactly that question), there is no cross-classification
conflict to rule on. This is a pure agent-consolidation, not a
classification-policy change, and it must stay that way: no unit below may
touch the `Source` enum (:92-107), `SEC_SOURCES` (:1357-1366), `LANE_A`
(:355), the adversarial-skeptic briefs (:1429-1454), or the disposition table.

**Sibling-tactic interaction (not a dependency).**
`tactic-review-api-cost-lens-merge` is office_hours-parked and, when it lands,
will edit the same `agentFinderSet` lines (it merges `firebase` + `cost` into
`api-cost`). Neither blocks the other; whichever lands second resolves a small
textual conflict in `set.push(...)`. Do not implement any part of that tactic
here.

---

## Unit 1 — Fold the three lenses into one `domain-sweep` finder

**Recommended model:** opus

### Scope

Single file: `.claude/workflows/review-fix.js`.

**(a) `agentFinderSet` — `.claude/workflows/review-fix.js:490-502`.** Replace
the three lens names with the one merged agent name, keeping position and the
existing gate structure:

```js
  if (surface === 'code') {
    set.push('input-validation', 'domain-sweep', 'red-team', 'security-review');
    if (app_or_rules) {
      set.push('firebase', 'cost');
    }
  }
```

`domain-sweep` sits where `secrets` sat (unconditional on `surface === 'code'`)
because secrets is the unconditional member of the trio; `auth` and
`data-exposure` are no longer separate entries at all. Add a short comment
recording that this function's returned names are now AGENT names, and that
one agent (`domain-sweep`) covers three finding SOURCES — the mapping from
source to agent is no longer 1:1. Extend the existing head comment block
(:480-489, which already explains why `code-review`/`codeql`/`npm`/`erosion`
are absent) rather than starting a new one.

Wrap the whole `agentFinderSet` function in probe sentinels, on their own
lines immediately before `function agentFinderSet(` and immediately after its
closing brace:

```
// >>> domain sweep gate: sliced + eval'd by review-fix-domain-sweep-probe.mjs >>>
// <<< domain sweep gate <<<
```

Each sentinel string must appear EXACTLY ONCE in the file — the probe in Unit
2 fails loudly otherwise. This mirrors the existing instrument-gate sentinels
at :357 / :451.

**(b) Section builders — immediately after `DOMAIN_PROMPTS`
(`.claude/workflows/review-fix.js:635-648`).** `DOMAIN_PROMPTS` itself is
unchanged: all six entries stay, verbatim, including `secrets` (:638-639),
`auth` (:642-643) and `data-exposure` (:644-645). Add two pure functions
directly beneath it:

```js
function sweepDomains(app_or_rules) {
  return app_or_rules ? ['secrets', 'auth', 'data-exposure'] : ['secrets'];
}

function sweepSections(app_or_rules) {
  return sweepDomains(app_or_rules)
    .map((d) => `Section "${d}" (set Source "${d}" on findings from this section): ${DOMAIN_PROMPTS[d]}`)
    .join('\n');
}
```

`sweepDomains` is the single source of truth for the trigger asymmetry and is
what Unit 2's probe asserts against. Wrap `DOMAIN_PROMPTS` + both functions in
a second sentinel pair (again exactly once each in the file):

```
// >>> domain sweep brief: sliced + eval'd by review-fix-domain-sweep-probe.mjs >>>
// <<< domain sweep brief <<<
```

The slice must be self-contained and pure — no reference to `diffContext`,
`SCHEMA_BLURB`, `args`, or any injected Workflow global inside the sentinels.

**(c) `finderPrompt` — `.claude/workflows/review-fix.js:733-785`.** Add one
new branch after the `cost` branch (:757-777) and before the generic fallback
(:778-785), following the file's existing one-branch-per-special-cased-finder
style:

```js
  if (name === 'domain-sweep') {
    return [
      'You are a findings-only security reviewer running the domain lenses listed below in ONE',
      'pass over the same diff. Work the sections in order and report on each independently —',
      'a clean result in one section is never a reason to shorten another.',
      sweepSections(args.app_or_rules),
      ctx,
      'Set "Source" on EACH finding to the section it came from — exactly one of "secrets",',
      '"auth", "data-exposure". Never invent a combined source name. Fill OWASP and STRIDE for',
      'every finding.',
      SCHEMA_BLURB,
    ].join('\n');
  }
```

`ctx` is the already-computed `diffContext(args)` at the top of `finderPrompt`
(:734) — reuse it, do not re-derive diff-scope framing. `SCHEMA_BLURB`
(:588-599) is reused verbatim as the trailing output contract. `args` here is
the normalized `_a` object, so `args.app_or_rules` is the same value
`agentFinderSet` was called with at :831 — that is what keeps the prompt's
section list and the gate in lockstep.

Update the generic-branch comment at :778 to read
`// input-validation | red-team | firebase` (the three names that still reach
it).

**Explicitly out of scope for this unit — do not touch:**

- `FINDING_ITEM_SCHEMA`'s `Source` enum (:92-107). `secrets`, `auth`, and
  `data-exposure` stay; `domain-sweep` is deliberately NOT added — it is an
  agent name, never a finding source, and leaving it out of the enum is what
  structurally prevents the agent from emitting it.
- `SEC_SOURCES` (:1357-1366) — all three sources keep their security
  classification and verify-eligibility.
- `LANE_A` (:355) — `domain-sweep` is Lane B by absence, so `launchFinder`
  (:861-868) hands it `FINDINGS_SCHEMA` and `model: 'opus'` with zero changes.
- The wave filters (:841-842) — `domain-sweep !== 'security-review'`, so it
  lands in `waveTwoFinders` automatically and stays probe-gated.
- The Lane-B gather (:1192-1197) — it appends `res.findings` verbatim and
  never stamps `Source` from the finder name, which is precisely what makes
  per-finding source attribution work unchanged.
- `INSTRUMENTS` (:374-385) — `domain-sweep` is not a named instrument, so the
  gate stays inert for it (the existing `lane-b` fixture pins that behavior).
- `subagentsLaunched` (:827, :872, :890) — it counts array length, so the drop
  from 8 to 6 finders on an `app_or_rules` diff is automatic.
- Any model-tier change anywhere (author ruling above).

---

## Unit 2 — CI-vector probe and driver test for the fold

**Recommended model:** sonnet

**Dependencies:** Unit 1 (the sentinels and functions must exist).

### Scope

`.claude/workflows/review-fix.js` is a Workflow-tool script (top-level await,
injected globals), so it cannot be imported by node, and `run-unit-tests.sh`
has no mapping for `.claude/workflows/*` — a PR touching only that file
triggers no vitest suite. The established answer is a slice-and-eval probe run
by the `hook-tests` job. Two working precedents to copy structurally:
`.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs`
and `.claude/skills/dispatch-propagate/scripts/review-fix-residue-death-probe.mjs`.

**(a) New file
`.claude/skills/dispatch-propagate/scripts/review-fix-domain-sweep-probe.mjs`**
(mode 755). Copy the residue-death probe's structure verbatim where it
applies: resolve the target with
`fileURLToPath(new URL('../../../workflows/review-fix.js', import.meta.url))`,
`readFileSync`, a `countOccurrences` fail-loud check that each sentinel
appears exactly once (exit 1 with a named message otherwise), slice strictly
between the end of the START sentinel and the start of the END sentinel,
`.trim()` the slice, exit 1 on an empty slice.

Difference from the two precedents: this probe slices TWO regions (`domain
sweep gate` and `domain sweep brief`). Factor the sentinel-pair handling into
one local `sliceBetween(source, START, END)` helper called twice, then eval
the two slices concatenated (gate slice first, brief slice second) inside a
single IIFE that returns
`{ agentFinderSet, sweepDomains, sweepSections, DOMAIN_PROMPTS }`. Keep the
`// eslint-disable-next-line no-eval` + `// type-safety-ok:` comment pattern
the precedents carry, with a one-line reason (the slices hold several
top-level statements, so `new Function('return ' + src)()` does not apply).

Print one JSON object to stdout with these keys:

- `roster_empty` — `agentFinderSet('empty', false)`
- `roster_docs` — `agentFinderSet('docs', true)`
- `roster_tests` — `agentFinderSet('tests', true)`
- `roster_code_noapp` — `agentFinderSet('code', false)`
- `roster_code_app` — `agentFinderSet('code', true)`
- `domains_noapp` — `sweepDomains(false)`
- `domains_app` — `sweepDomains(true)`
- `sections_noapp` — `sweepSections(false)`
- `sections_app` — `sweepSections(true)`
- `brief_secrets` / `brief_auth` / `brief_data_exposure` — the three raw
  `DOMAIN_PROMPTS` entries, so the driver can assert verbatim inclusion
  without hardcoding the brief text.

**(b) New file
`.claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh`**
(mode 755), modeled on
`.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh`:
`set -euo pipefail`, `FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"`, source
`dispatch-test-fixture.sh` (supplies `assert_eq`, `report_results`,
`SCRIPT_DIR`, `REPO_ROOT`), run the probe once into `out`, then assert with
`jq`. Per `.claude/rules/shell-json.md` (mechanically linted for net-new lines
in committed `.sh` files) never `echo` the captured JSON into `jq` — use
`printf '%s' "$out" | jq ...` or `jq ... <<<"$out"`.

Assertions — the trigger asymmetry is the point, so pin it from both sides:

1. `roster_code_noapp` equals exactly
   `["input-validation","domain-sweep","red-team","security-review"]`.
2. `roster_code_app` equals exactly
   `["input-validation","domain-sweep","red-team","security-review","firebase","cost"]`.
3. `roster_empty`, `roster_docs`, `roster_tests` are each `[]`.
4. None of `secrets`, `auth`, `data-exposure` appears in ANY roster (they are
   sources now, never agent names).
5. `domains_noapp` equals `["secrets"]`; `domains_app` equals
   `["secrets","auth","data-exposure"]`.
6. `sections_noapp` contains `brief_secrets` verbatim and contains NEITHER
   `brief_auth` NOR `brief_data_exposure` (use `jq` `contains`).
7. `sections_app` contains all three briefs verbatim.
8. `sections_noapp` and `sections_app` each contain the literal
   `set Source "secrets"`; `sections_app` also contains `set Source "auth"`
   and `set Source "data-exposure"`.

Grep-based anti-regression assertions against
`$REPO_ROOT/.claude/workflows/review-fix.js` (same style as
test-review-fix-instrument.sh's call-site greps — they exist because fixture
cases alone cannot catch a call site being removed):

9. The `domain-sweep` branch is present in `finderPrompt`:
   `grep -c "if (name === 'domain-sweep')"` is `1`.
10. `sweepSections(args.app_or_rules)` is actually CALLED:
    `grep -c 'sweepSections(args.app_or_rules)'` is `1`.
11. `domain-sweep` is NOT a member of `LANE_A`:
    `grep -c "LANE_A = new Set(\['code-review', 'security-review'\])"` is `1`.
12. All three source names survive in the `Source` enum and in `SEC_SOURCES` —
    `grep -c "^        'secrets',"` etc. is brittle; instead assert
    `grep -c "'data-exposure',"` is `2` (enum + SEC_SOURCES), and likewise
    that `'auth',` appears twice and `'secrets',` twice. Adjust the expected
    counts to whatever the post-Unit-1 file actually contains, and comment WHY
    each count is what it is, so a future edit that drops one site fails here.
13. `domain-sweep` never appears inside the Source enum block — assert
    `grep -c "'domain-sweep'"` equals the number of legitimate sites (the
    `agentFinderSet` push and the `finderPrompt` branch), documented inline.

**(c) CI wiring — `.github/workflows/unit-tests.yml`, `hook-tests` job.** Add
a step immediately after the existing `Run review-fix residue-death coverage
tests` step (line 213-214), matching its two-line shape:

```yaml
      - name: Run review-fix domain-sweep tests
        run: .claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh
```

This job runs unconditionally on every PR and is the ONLY CI vector for
`.claude/workflows/*` — without this step the unit has no coverage at all.

**Out of scope:** any change to `run-unit-tests.sh`, to `knip.jsonc`
(`.claude/**` is already in `ignoreFiles`), or to the existing
instrument/residue-death probes and their tests.

---

## Unit 3 — Documentation lockstep

**Recommended model:** sonnet

**Dependencies:** Unit 1.

### Scope

**(a) `.claude/skills/review-fix/references/inline-scans.md`** — the
human-readable mirror of `DOMAIN_PROMPTS` + `agentFinderSet`. Current shape:
intro at :98-118 ("Four are gated on `surface=code` alone; four additionally
require `app_or_rules=true`"), the `surface === 'code'` list at :120-133
(`input-validation` :121, `secrets` :124, `red-team` :126, `security-review`
:130), and the `app_or_rules` list at :135-155 (`auth` :136, `data-exposure`
:140, `firebase` :143, `cost` :146).

Rewrite so the doc describes agents accurately without losing a single lens
description:

- Keep every lens bullet's text verbatim. Do not shorten or merge the prose.
- Under `surface === 'code'`, replace the standalone **secrets** bullet with a
  **domain-sweep** entry that states: one Opus agent, one read of the diff,
  carrying the secrets brief always and additionally the auth and
  data-exposure briefs when `app_or_rules=true`; each finding carries its own
  `Source` (`secrets` / `auth` / `data-exposure`), so the three lenses remain
  separately measurable. Nest the three verbatim briefs under it.
- Under `surface === 'code' && app_or_rules=true`, remove the now-duplicated
  standalone **auth** and **data-exposure** bullets and cross-reference the
  domain-sweep entry; `firebase` and `cost` bullets stay untouched.
- Fix the counts in the :108-110 intro sentence to match the new agent roster
  (four agents on a bare code surface, six when `app_or_rules=true`).
- State the reason for the fold in one sentence (three agents re-reading one
  diff was the waste) so the doc explains itself.

**(b) `.claude/skills/dispatch-propagate/scripts/dispatch-review-finders`** —
header comment only, no behavior change. This script is the normative spec for
the finder-SOURCE roster and its output must NOT change: `secrets`, `auth`,
and `data-exposure` remain sources, with unchanged gating (:74-89), and
`test-dispatch-review-finders.sh` must keep passing untouched. Extend the
existing "Consumer:" note (:35-46, which already explains that `agentFinderSet`
excludes `code-review`/`codeql`/`npm`/`erosion`) with a paragraph recording
that the JS agent fan-out now maps `secrets` + `auth` + `data-exposure` onto
ONE agent (`domain-sweep`) whose brief sections follow the same per-source
gating this script emits — so source roster and agent roster are deliberately
no longer 1:1, and nothing about this script's stdout changes.

**(c) `.claude/skills/review-fix/references/schema-edge-cases-notes.md`** —
the `Source` enum listing at :16-17 is unchanged and must stay unchanged
(verify, do not edit). Check :32-36 and :105-117 for prose asserting a
one-agent-per-source fan-out and correct only what the fold makes false.

**(d) Sweep for stale claims.** `grep -rn "data-exposure" .claude` and
`grep -rn "'secrets'" .claude` and confirm every remaining hit is either a
SOURCE reference (correct, leave alone) or already updated. Known hits at plan
time: `review-fix.js` (Unit 1), `inline-scans.md` (this unit),
`schema-edge-cases-notes.md:17` (enum, unchanged),
`dispatch-review-finders` + `test-dispatch-review-finders.sh` (source roster,
unchanged), `dispatch-review-dedup:15-16` (source list in a header comment,
unchanged), `review-fix/SKILL.md:357,373` (references the secrets LENS by name
in a redaction rule — still true, the lens still exists; leave alone).

**Out of scope:** `disposition-table.md` (no disposition changes), the
`/review-fix` SKILL.md body, and any doc for the `api-cost` sibling merge.

---

## Reuse

- `.claude/workflows/review-fix.js:635-648` — `DOMAIN_PROMPTS`. The three
  briefs are reused verbatim as the merged prompt's sections; do not
  re-author them.
- `.claude/workflows/review-fix.js:588-599` — `SCHEMA_BLURB`, the canonical
  trailing output contract used by every Lane-B finder prompt.
- `.claude/workflows/review-fix.js:623-632` — `diffContext(args)`, the shared
  "review ONLY the pending diff against merge_base" builder.
- `.claude/workflows/review-fix.js:76-123` — `FINDING_ITEM_SCHEMA` /
  `FINDINGS_SCHEMA`. Unchanged; the merged agent emits against the existing
  schema, with `Source` varying per finding instead of per agent.
- `.claude/workflows/review-fix.js:861-868` — `launchFinder`. No edit needed:
  Lane-B membership is by absence from `LANE_A` (:355), so the merged finder
  already gets `model: 'opus'`, `general-purpose`, and `FINDINGS_SCHEMA`.
- `.claude/workflows/review-fix.js:1801-1868` — `residuePrompt`, the in-file
  precedent for "one Opus agent, several source-specific prose sections up
  front, one shared schema, provenance carried on each returned item". Model
  the merged prompt's shape on it rather than inventing a new pattern.
- `.claude/skills/dispatch-propagate/scripts/review-fix-residue-death-probe.mjs`
  and `review-fix-instrument-probe.mjs` — copy the slice-and-eval probe
  structure (sentinel counting, fail-loud, IIFE eval).
- `.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh` —
  copy the driver-test structure (fixture sourcing, `jq` assertions, grep-based
  call-site anti-regression checks).
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` —
  `assert_eq`, `report_results`, `SCRIPT_DIR`, `REPO_ROOT`.
- `.claude/skills/review-fix/references/inline-scans.md:120-155` — existing
  lens prose, reused verbatim in the rewritten doc.

## Verification

```verify
node --check .claude/workflows/review-fix.js
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-review-finders.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The domain-sweep test is the mechanical proof of the two invariants this
tactic turns on: the trigger asymmetry (`app_or_rules=false` yields exactly a
secrets-only sweep, never an auth/data-exposure sweep) and verbatim brief
preservation. The `dispatch-review-finders` test passing UNCHANGED is the
proof that the source roster and its gating were not disturbed — if that test
needed editing, the fold leaked from the agent layer into the source layer and
the change is wrong.

Manual and observe-in-production checks, in order:

1. **First live review-fix run on an `app_or_rules` diff.** Confirm in the
   run log that `finders: wave 2 = launching 5 finder(s)` (down from 7) and
   that a single `find:domain-sweep` agent appears where three did. Confirm
   the PR comment's findings carry `Source` values among `secrets`, `auth`,
   `data-exposure` — not a merged name. A finding emitted with an invalid
   Source would be rejected by `FINDINGS_SCHEMA` and could null the whole
   payload, so an empty domain-sweep result on a diff with obvious secrets is
   the failure signature to watch for on the first few runs.
2. **First live run on a non-`app_or_rules` code diff.** Confirm the sweep
   agent ran and its prompt carried only the secrets section — i.e. no
   auth/data-exposure findings appear on a diff that would never have been
   auth-reviewed before. This is the widening regression the asymmetry exists
   to prevent, checked in production as well as in the test.
3. **Next `/dispatch-token-audit` window.** Per-lens FINDING yield must still
   resolve by `Source` in the audit's join. Per-lens DRAW no longer resolves
   separately — one agent, one cost line — and that is the intended saving,
   not a defect; record the combined `find:domain-sweep` draw against the
   $41.55 three-agent baseline. Judgment call for the author at that point:
   the fold is a win if combined draw falls materially while combined
   confirmed findings hold at or above the 2-per-window baseline. A combined
   confirmed count below 2 over a comparable window is the signal to revisit,
   and the response is prompt strengthening (per-section reporting discipline),
   never a model-tier change without a measured A/B.
4. **Attribution caveat when reading that audit.** Review-phase sessions are a
   known partially-unattributed bucket (~75% of turns unattributed in the
   2026-07-31 measurement), so the measured saving is a lower bound on the real
   one and should not be compared against differently-attributed windows.
