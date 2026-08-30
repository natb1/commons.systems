---
id: tactic-review-api-cost-lens-merge
kind: tactic
statement: Merge the firebase and cost review lenses into one api-cost lens and
  widen its trigger so it samples every diff touching an API or query call site
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-31 review-fix token audit interview. Author
  ruled api-cost review a priority whose zero-finding windows read as sampling
  error, not zero yield; the lens fired on only 5 of 18 runs. Deliberately
  raises this lens's draw. Two 2026-08-03 author rulings on
  strategy-token-economy fixed the design this tactic finalizes: findings split
  into a security-classified sub-pattern (rules-permissiveness /
  emulator-reachability / key-exposure) and an advisory sub-pattern (query-cost
  / amplifier / N+1), and the trigger is a dedicated diff-content api_call_site
  gate rather than the shared app_or_rules boolean."
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
  branch: tactic-review-api-cost-lens-merge
  pr: 3031
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T16:57:43Z
    mergeCommitSha: 7aecba983181ab9f432497aae0d9e62ecba5c94c
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Merge the firebase and cost review lenses into one api-cost lens and widen its trigger so it samples every diff touching an API or query call site

## Context

Author ruling, 2026-07-31 (token-audit interview): api-cost review is a
PRIORITY. A zero-finding window is read as sampling error, not as zero yield,
because an api-cost overrun has high impact on overall goals. This lens is the
standing exception to the yield-per-draw ranking that governs every other
review lens — it is kept and *widened* even though it found nothing in the
measured window.

Measured over 18 review-fix runs, 2026-07-27 → 2026-07-31 (source: the
2026-07-31 token-audit transcripts; not reproducible from repo state):

| lens | agents | draw | findings | fired on |
|---|---|---|---|---|
| `firebase` | 5 | $6.46 | 0 | 5 of 18 runs |
| `cost` | 5 | $7.32 | 5 | 5 of 18 runs |

Together 0.9% + 1.0% of review-fix spend. The zero-finding result is
uninformative precisely BECAUSE the lens only fired on 5 of 18 runs — that is
the sampling gap, and the correct response is more sampling, not less.
Increased draw (from ~$14 toward ~$25-30 proxy per 4-day window) is the
INTENT, not a regression. Per the 2026-08-03 author ruling that figure is an
expected range, **not** a Verification gate: the realized draw is measured and
recorded after the fact, never asserted as a threshold.

Two later author rulings (both 2026-08-03) fix the design and supersede the
earlier draft of this node:

1. **Split classification.** Merge at the lens/trigger level, but SPLIT
   classification by sub-pattern. One `api-cost` finder emits
   security-classified findings (OWASP/STRIDE filled, Required-eligible,
   verify-eligible) for rules-permissiveness / emulator-reachability /
   key-exposure, and advisory findings (OWASP/STRIDE empty, always Deferred,
   never verify-eligible) for query-cost / amplifier / N+1. Both collapsed
   alternatives were put to the author and declined. Wholly-advisory would
   demote firebase's rules-permissiveness, emulator-code-on-production-paths
   and API-key-exposure checks from merge-blocking security findings to
   non-blocking follow-ups — a detection AND escalation reduction the
   quality-preservation condition forbids as an efficiency lever.
   Wholly-security-classified would make cost/scaling findings merge-blocking
   and verify-eligible, breaking cost's documented non-escalation invariant
   exactly as the merge widens the lens's fire rate.
2. **Trigger predicate.** The lens gets its OWN diff-content gate, decoupled
   from the shared `app_or_rules` boolean. `dispatch-security-surface` reads a
   newline-separated *path list* on stdin and classifies via extension/name
   regexes alone (`RULES_RE` at
   `.claude/skills/dispatch-propagate/scripts/dispatch-security-surface:32`,
   `APP_RE` at `:35`); it never inspects diff content, so "touches an API or
   query call site" is not expressible there. Two alternatives were declined:
   relaxing the shared `app_or_rules` predicate (it ALSO selects the `auth` and
   `data-exposure` domain-sweep sections, so relaxing it would silently widen
   SECURITY review scope to every code diff including `.claude/` tooling), and
   a per-lens gate keyed on a widened PATH rule (still does not express the
   call-site requirement). The fire rate that results is a tunable design
   property of the pattern list, **not** a measurement — nobody has counted
   how many runs contain such a call site. The realized fire rate must be
   recorded after landing.

**Anchor caveat, carried forward and discharged.** Every line number in the
2026-07-31 draft of this node and in the strategy clarifications is stale — the
2026-08-01 domain-sweep fold (PR #3024) and PRs #3007 / #3028 shifted
`review-fix.js` by tens of lines, and three readings of the same anchors
disagree. Every `path:line` below was re-verified by grep at
`30f67736` (2026-08-03). Concurrent editors of this same file exist
(`tactic-review-skill-body-decomposition` PR #3025 was red at plan time), so
**merge `origin/main` before starting and re-grep any anchor that does not
match**.

**Not idempotent-complete.** At `30f67736`, `firebase` and `cost` are still
two separate agent names throughout `review-fix.js`, and no `api-cost` or
`api_call_site` identifier exists anywhere in the repo. All six units below are
unstarted.

### Greenfield design

One Lane-B finder agent named `api-cost`, gated on a diff-content
`api_call_site` flag, whose brief is composed of two labelled sections that
carry the two existing Source names verbatim:

- Section `firebase` → Source `firebase`, OWASP/STRIDE filled, stays in
  `SEC_SOURCES`, ordinary Required / Refuted / Out-of-scope path.
- Section `cost` → Source `cost`, OWASP/STRIDE empty, stays OUT of
  `SEC_SOURCES`, always Deferred.

This is exactly the shape the already-landed `domain-sweep` fold uses
(`sweepDomains` / `sweepSections`, `review-fix.js:747-756`), so the merge is a
second instance of an established pattern rather than new machinery. The
classification boundary — the `SEC_SOURCES` set and the `Required`-only
verify-eligibility filter — is reused **unchanged**; those two structures are
the exact mechanism the cost non-escalation invariant already rests on, and the
merge deliberately does not touch them. No brownfield migration path is needed:
the change is a single PR against a workflow file and its test vectors, with no
persisted state and no backwards-compatibility surface.

### Known defect from the draft — re-assessed and closed, no fix needed

The draft flagged that the adversarial-skeptic prompt gives every non-erosion
finding the "FALSE POSITIVE / not-exploitable" brief
(`review-fix.js:1865-1874`, with the only carve-out being
`Source === 'erosion'` at `:1829`), and asked whether that systematically
refutes cost-shaped findings. Under the split design it does not, and no fix
is warranted:

- Advisory findings carry Source `cost`, are always bucket `Deferred`, and are
  therefore excluded from `requiredFindings` (`review-fix.js:1751-1753`, which
  filters `bucket === 'Required'` or the literal erosion carve-out). They never
  reach the skeptic gate at all.
- Security-classified findings carry Source `firebase` and ARE genuine
  exploitability claims (overly broad `allow` conditions, emulator code on
  production paths, key exposure). The generic exploitability brief is
  *correct* for them.

Unit 4 must record this reasoning as a comment near the merged finder so the
question is not re-opened. **Do not** add a Source-conditional skeptic brief.

### Downstream dependency, still open

`tactic-mainqa-review-cost-finder` (phase `main-qa`, parked to office_hours
since 2026-07-05 for passive observation of a live Firestore-scan finding)
carries an observation checklist for the cost lens. It is a still-pending
downstream check, not an already-closed gate — its checklist must still pass
against the merged lens, but this tactic does not block on it.

---

## Unit 1 — `dispatch-api-call-site`: the diff-content gate

**Scope.**

Create `.claude/skills/dispatch-propagate/scripts/dispatch-api-call-site`
(no extension, `chmod +x`, `#!/usr/bin/env bash`, `set -euo pipefail`) — a pure
stdin→stdout classifier that reads a unified diff on stdin and prints exactly
one `key=value` line:

```
api_call_site=true|false
```

Model it structurally on
`.claude/skills/dispatch-propagate/scripts/dispatch-security-surface` (same
header-comment style, same "No network access, no git, no gh — pure stdin →
stdout classification" property, same `printf` key=value stdout convention that
callers parse with `sed -n 's/^key=//p'`). It is a sibling of that script, not
an edit to it: the author explicitly declined putting a diff-content probe
inside `dispatch-security-surface`, which is path/extension-only by contract.

Detection rule — **added lines only**:

- Consider only lines matching `^\+`, excluding the `^\+\+\+` file header.
  Context and removed lines are ignored: removing a query is not a new cost or
  API risk, and matching context lines would fire on almost every diff to a
  file that happens to contain a `fetch` elsewhere.
- Emit `true` when any considered line matches the call-site pattern set:
  `fetch(`, `axios` , `getDocs(`, `getDoc(`, `addDoc(`, `setDoc(`,
  `updateDoc(`, `deleteDoc(`, `onSnapshot(`, `query(`, `collection(`,
  `collectionGroup(`, `XMLHttpRequest`. Use one extended-regex
  `grep -qE` over the filtered stream.
- Emit `false` otherwise, including on empty stdin. Exit 0 in both cases —
  this is a classifier, not a check.

Record in the header comment that the pattern list is a **tunable design
property, not a measurement**: no one has counted how many runs contain such a
call site, and the realized fire rate is to be recorded after landing (see
`## Verification`). Also record the one deliberate omission: bare amplifier
patterns (`setInterval` / `setTimeout` / polling) do NOT fire the gate on their
own. A diff that adds only an amplifier over a pre-existing query will be
missed. This was considered and left out because `setTimeout` appears in nearly
every code diff and would collapse the gate into "always true", destroying the
predicate's meaning. Revisit only with measured fire-rate data.

Create `.claude/skills/dispatch-propagate/scripts/test-api-call-site.sh`
(name it `test-dispatch-api-call-site.sh`, `chmod +x`) modelled on
`.claude/skills/dispatch-propagate/scripts/test-dispatch-security-surface.sh` —
source `dispatch-test-fixture.sh` from `$FIXTURE_DIR` the same way, use
`assert_eq`, end with `report_results`. Cases, at minimum:

- empty stdin → `api_call_site=false`
- a diff whose only `+` line is `+const x = 1;` → `false`
- `+  const snap = await getDocs(collection(db, 'jobs'));` → `true`
- `+  const r = await fetch(url);` → `true`
- a diff where the pattern appears ONLY on a context line (` const r = await
  fetch(url);`, leading space) → `false` (this is the load-bearing case)
- a diff where the pattern appears only on a removed line (`-  await
  getDocs(q);`) → `false`
- a diff whose `+++ b/src/fetch-helpers.ts` header contains `fetch` but whose
  body does not → `false` (guards the `^\+\+\+` exclusion)
- markdown-only diff mentioning `fetch(` in prose inside a `+` line → `true`
  (accepted false positive; assert it so the behavior is pinned and visible,
  with a comment saying the surface gate upstream already excludes docs-only
  diffs)

CI vector: the SUT lives under
`.claude/skills/dispatch-propagate/scripts/`, so `run-unit-tests.sh`'s
`RUN_PR_SCRIPTS` auto-detect already runs `test-*.sh` in that directory when a
path there changes. **No `.github/workflows/unit-tests.yml` edit is needed for
this unit** (unlike the `review-fix.js` probes, whose SUT is outside that
directory and which are therefore wired unconditionally in the `hook-tests`
job at `.github/workflows/unit-tests.yml:184-225`).

**Out of scope.** Any edit to `dispatch-security-surface` or its test. Any
change to `surface` / `deps` / `app_or_rules` semantics.

**Recommended model.** sonnet

---

## Unit 2 — Thread `api_call_site` through the review-fix args-build site

**Scope.**

`.claude/skills/review-fix/SKILL.md` only.

1. Step 1, in the fenced bash block at `:237-249` (immediately after the
   `app_or_rules=$(...)` line at `:247`): add the new flag's computation,
   reusing `MERGE_BASE`, which is already computed at `:241`:

   ```bash
   api_call_site=$(git diff "$MERGE_BASE"...HEAD \
     | .claude/skills/dispatch-propagate/scripts/dispatch-api-call-site \
     | sed -n 's/^api_call_site=//p')
   ```

   Both `git diff` and the classifier are read-only / pure stdin, so no
   `dangerouslyDisableSandbox` is needed. Note in prose that this is the ONE
   deliberate exception to Step 1's "do not run a fresh `git diff` here"
   instruction at `:219-221`: that instruction exists to stop the diff *text*
   being re-read into the skill's context, and this pipeline never brings the
   diff into context — it passes through a classifier and yields a single
   boolean.

2. Add a bullet to the flag glossary after the `app_or_rules` bullet at
   `:255-257`:

   > - `api_call_site` is `true` when the diff **adds** a line containing an
   >   API or query call site (`fetch`/`axios`/`getDocs`/`getDoc`/`query`/
   >   `collection`/…). It is computed from diff CONTENT, deliberately
   >   decoupled from `app_or_rules` — relaxing `app_or_rules` would also widen
   >   the `auth` and `data-exposure` domain-sweep sections, silently expanding
   >   security review scope to every code diff.

3. Step 2, the `args = { … }` block at `:456-474`: add
   `api_call_site: <true|false>,` on the line after `app_or_rules:` (`:462`),
   with the same inline-comment style used by its neighbours.

4. Step 1's "Finder agents" bullet at `:270-272` currently says the Workflow
   fans out "surface/`app_or_rules`-gated finders" — extend to
   "surface / `app_or_rules` / `api_call_site`-gated finders".

**Out of scope.** Any `review-fix.js` edit (Unit 4). Any change to how
`MERGE_BASE`, `surface`, `deps` or `app_or_rules` are computed.

**Dependencies.** Unit 1 (the script must exist before SKILL.md invokes it).

**Recommended model.** sonnet

---

## Unit 3 — `dispatch-review-finders`: the normative source-roster spec

**Scope.**

`.claude/skills/dispatch-propagate/scripts/dispatch-review-finders` and its
paired test `test-dispatch-review-finders.sh`.

This script is the declared normative spec for `agentFinderSet`'s mapping
("this script is the normative spec for that inline JS logic", in its own
header). It emits SOURCE names, not agent names — a distinction its header
already documents for the domain-sweep fold. The merge does not change which
Sources exist; it changes what GATES two of them.

1. Add a fourth stdin key, `api_call_site=<true|false>`, defaulting to
   `false`, parsed in the same `while IFS= read -r line` / `case` loop that
   handles `surface` / `deps` / `app_or_rules`.
2. Move `firebase` and `cost` out of the `app_or_rules` block and into a new
   `if [[ "$api_call_site" == "true" ]]` block, still nested inside the
   `surface == "code"` branch and still emitted in the same fixed roster order
   (after `data-exposure`, before `codeql`). `auth` and `data-exposure` stay
   gated on `app_or_rules`, unchanged.
3. Update the header roster comment block accordingly, and add a NOTE
   paragraph — in the style of the existing domain-sweep NOTE — recording that
   `firebase` and `cost` are now emitted by ONE agent named `api-cost` in
   `review-fix.js`, that this script remains the normative SOURCE-name spec and
   not an agent-name spec, and that `api_call_site` is computed from diff
   content at the review-fix args-build site rather than by
   `dispatch-security-surface`.

Test updates in `test-dispatch-review-finders.sh`:

- `:38` and `:42` assert the app-domain trio `(auth|data-exposure|firebase)`
  and the 7-reviewer count under `app_or_rules=true`. Both must be rewritten:
  with `api_call_site` absent (default false), `app_or_rules=true` now yields
  6 of those reviewers and `firebase` is absent.
- The four `cost` cases at `:65-79` are all keyed on `app_or_rules`; re-key
  them onto `api_call_site`.
- Add the new matrix cases: `code` + `app_or_rules=false` +
  `api_call_site=true` → both `firebase` and `cost` present and `auth` /
  `data-exposure` absent (this is the decoupling, and is the most important
  new assertion); `docs` / `tests` surface + `api_call_site=true` → both
  absent (the `surface == code` gate still dominates).

**Out of scope.** `review-fix.js`. The `codeql` / `npm` / `erosion` gating.

**Dependencies.** Unit 1 (flag name and semantics).

**Recommended model.** sonnet

---

## Unit 4 — Merge the two agents into one `api-cost` finder in `review-fix.js`

**Scope.** `.claude/workflows/review-fix.js` only. Four edits.

**(a) The gate** — `agentFinderSet`, `:519-531`, inside the
`>>> domain sweep gate <<<` sentinel region (`:518` / `:532`). Current body:

```js
function agentFinderSet(surface, app_or_rules) {
  const set = [];
  if (surface === 'code') {
    set.push('input-validation', 'domain-sweep', 'red-team', 'security-review');
    if (app_or_rules) {
      set.push('firebase', 'cost');
    }
  }
  return set;
}
```

Becomes a three-parameter form: `agentFinderSet(surface, app_or_rules,
api_call_site)`, with the `app_or_rules` push replaced by
`if (api_call_site) { set.push('api-cost'); }`. The `surface === 'code'` gate
stays — a non-code surface launches no agent finders at all, and this lens is
not an exception to that. `app_or_rules` remains a parameter because
`sweepSections` still consumes it; it simply no longer gates this lens. Extend
the function's leading comment to record the merge and the decoupling, in the
same register as the existing domain-sweep comment at `:508-517`.

Update the sole call site at `:960`:
`const finderNames = agentFinderSet(_a.surface, _a.app_or_rules, _a.api_call_site);`

**(b) The brief** — inside the `>>> domain sweep brief <<<` sentinel region
(`:726` / `:757`), so the existing probe can slice it without a new sentinel
pair. Update that region's opening comment to say it now holds the api-cost
brief as well.

- Extract the cost pattern text now living inline in
  `finderPrompt(name === 'cost')` at `:866-886` into a module-scope
  `const COST_BRIEF` placed in this region, **verbatim** — the three numbered
  Firestore patterns (unbounded/growing-collection `getDocs` scans; new
  high-frequency amplifiers layered over scans; N+1 `getDoc` loops) and the
  query×amplifier interaction paragraph. `COST_BRIEF` must be pure text: it
  may NOT reference `ctx`, `SCHEMA_BLURB`, `args`, or any Workflow global,
  because the probe evals this region standalone. The `'Set Source "cost" and
  OWASP "" and STRIDE ""…'` line at `:883` does not move into `COST_BRIEF` —
  it becomes part of the section wrapper below.
- `DOMAIN_PROMPTS.firebase` at `:738-739` stays exactly as it is and is
  reused as the other section. Do not reword it.
- Add, next to `sweepDomains` / `sweepSections` (`:747-756`) and modelled
  directly on them:

```js
function apiCostDomains() {
  return ['firebase', 'cost'];
}

function apiCostSections() {
  return [
    `Section "firebase" (set Source "firebase" on findings from this section, and FILL OWASP and STRIDE — these are security findings): ${DOMAIN_PROMPTS.firebase}`,
    `Section "cost" (set Source "cost" and OWASP "" and STRIDE "" on findings from this section — cost findings are ADVISORY, never security-classified): ${COST_BRIEF}`,
  ].join('\n');
}
```

`apiCostDomains()` takes no argument: both sections are always briefed
whenever the lens fires. Its ORDER is load-bearing — see (c).

**(c) The prompt and the Source clamp.**

- Replace the `if (name === 'cost')` branch at `:866-886` with
  `if (name === 'api-cost')`, built on the `domain-sweep` branch at
  `:887-906` as the template: the "work the sections in order and report on
  each independently — a clean result in one section is never a reason to
  shorten another" instruction, `apiCostSections()`, `ctx`, the
  Source-enum enforcement sentence naming exactly `"firebase"` and `"cost"`
  and forbidding invented or combined source names, and the `SCHEMA_BLURB`
  tail. State the OWASP/STRIDE split explicitly in the enforcement sentence,
  since unlike `domain-sweep` (where every section fills OWASP/STRIDE) this
  agent's two sections differ.
- Extend the `laneBAllowedSources` ternary at `:1333-1334`:

```js
const laneBAllowedSources = (name) =>
  name === 'domain-sweep'
    ? sweepDomains(_a.app_or_rules)
    : name === 'api-cost'
      ? apiCostDomains()
      : [name];
```

  This is load-bearing and is why `apiCostDomains()` returns `firebase`
  first: the SOURCE CLAMP relabels an off-brief Source to `allowedList[0]`
  (`:1344-1348`), so an unrecognized Source escalates to the security-
  classified lens rather than being demoted to advisory — the fail-safe
  direction. Add a comment saying so. Note in the same comment the residual
  risk the split design accepts: within its briefed set the agent chooses
  freely, so it could self-tag a rules-permissiveness finding as `cost`; the
  section wrapper's explicit per-sub-pattern text is the mitigation, and
  `classify` still runs downstream.
- Update the generic fallback branch's comment at `:907`
  (`// input-validation | red-team | firebase`) to drop `firebase` — it is no
  longer an agent name, only a Source name.

**(d) The closed-defect note.** Add a comment beside the merged finder
recording the skeptic-brief re-assessment verbatim from `## Context` above —
that advisory `cost` findings never reach `requiredFindings` (`:1751-1753`)
and that the generic exploitability brief (`:1865-1874`) is correct for
`firebase`-Source findings, so no Source-conditional skeptic brief is to be
added.

**Explicitly out of scope — do not touch.**

- The `Source` enum at `:92-107`. Both `firebase` and `cost` stay. No
  `api-cost` Source is ever emitted — `api-cost` is an AGENT name only.
- `SEC_SOURCES` at `:1514-1524`. `firebase` stays in; `cost` stays out. This
  asymmetry IS the split-classification mechanism, reused unchanged.
- `requiredFindings` at `:1751-1753` and the erosion carve-out.
- `buildVerifyPrompt` / the skeptic briefs at `:1809-1878`.
- `LANE_A` at `:375`. `api-cost` is a Lane-B finder.

**Dependencies.** Unit 2 must land first or in the same PR. If this unit lands
alone, `_a.api_call_site` is `undefined` → falsy → the lens never fires and
firebase/cost coverage silently drops to zero. Sequence Unit 2 before Unit 4,
or ship them together.

**Recommended model.** opus

---

## Unit 5 — Extend the probe and its CI test vector

**Scope.**

`.claude/skills/dispatch-propagate/scripts/review-fix-domain-sweep-probe.mjs`
and `.claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh`.

`review-fix.js` is a Workflow-tool script (top-level await, injected globals)
that cannot be imported by node, and `run-unit-tests.sh` has no mapping for
`.claude/workflows/*`. This probe's slice-and-eval harness is therefore the
ONLY coverage vector; it is wired unconditionally in the `hook-tests` job at
`.github/workflows/unit-tests.yml:218`. Reuse it — do not invent a second
mechanism, and do not add a new sentinel pair (Unit 4 places the new code
inside the two existing sentinel regions).

Probe (`review-fix-domain-sweep-probe.mjs`):

- Extend the destructure and the eval'd return object at `:98` / `:102` to
  also export `apiCostDomains`, `apiCostSections`, and `COST_BRIEF`.
- The `results.roster_*` calls at `:108-112` pass two arguments; add the third.
  Keep the existing five cases (third arg `false`) and add:
  `roster_code_app_call = agentFinderSet('code', true, true)`,
  `roster_code_noapp_call = agentFinderSet('code', false, true)`,
  `roster_tests_call = agentFinderSet('tests', true, true)`.
- Add `results.api_cost_domains`, `results.api_cost_sections`,
  `results.brief_firebase = DOMAIN_PROMPTS.firebase`, `results.cost_brief`.
- Update the header comment block (`:4`, `:20-27`) to say the regions now also
  cover the api-cost merge.

Test (`test-review-fix-domain-sweep.sh`):

- `:31-32` asserts `roster_code_app` includes `"firebase","cost"` — rewrite to
  `["input-validation","domain-sweep","red-team","security-review"]` (the lens
  no longer fires on `app_or_rules` alone).
- Add: `roster_code_app_call` and `roster_code_noapp_call` both end in
  `"api-cost"`; `roster_tests_call` is `[]`; neither `"firebase"` nor
  `"cost"` appears as an AGENT name in any roster (mirror the existing
  `flatten | any(. == "secrets")` assertions at `:41-46`).
- `:110` pins the call site with
  `grep -c 'agentFinderSet(_a.surface, _a.app_or_rules)'` — update to the
  three-argument form. This pin is what stops a silent narrowing of the
  fan-out, so it must not simply be deleted.
- Add containment assertions in the style of `:60-76`: `api_cost_sections`
  contains `brief_firebase`; contains `cost_brief`; carries the literal
  `set Source "firebase"`; carries the literal `set Source "cost"`; carries
  `OWASP "" and STRIDE ""` in the cost section only.
- Add a pin that `apiCostDomains()` is `["firebase","cost"]` in that order
  (the clamp-fallback direction depends on it) and that the `api-cost` branch
  exists in `finderPrompt`
  (`grep -c "if (name === 'api-cost')"`), mirroring `:105-107`.
- Add a pin that `laneBAllowedSources` routes `api-cost` through
  `apiCostDomains()`.
- The two exact-membership assertions at `:149` (Source enum) and `:156`
  (`SEC_SOURCES`) must remain **unchanged and passing** — they are the
  mechanical proof that the merge did not collapse the classification
  boundary. If either needs editing, the implementation is wrong.

**Out of scope.** New `.github/workflows/unit-tests.yml` steps (this suite is
already wired at `:218`).

**Dependencies.** Unit 4.

**Recommended model.** sonnet

---

## Unit 6 — Cost non-escalation clamp and the doctrine record

**Scope.**

1. `.claude/workflows/review-fix.js`, immediately after the `deduped = deduped.map(...)`
   classification block that ends at `:1547`: add a deterministic clamp.
   Today the "cost is never `Required`" invariant is enforced only by prompt
   text in the classify brief (`:1480-1486`) — there is no harness-side check.
   The merge raises the odds of a mislabel, because ONE agent now emits both
   Sources and a single wrong `bucket` from `classify` would make an advisory
   finding merge-blocking and verify-eligible. Force it:

   ```js
   // Cost non-escalation invariant (disposition-table.md): a Source "cost"
   // finding is ADVISORY — never Required, never verify-eligible. Prompt text
   // alone enforced this before the api-cost merge; with one agent now emitting
   // both Sources, clamp it harness-side.
   deduped = deduped.map((f) => {
     if (f.Source === 'cost' && (f.bucket === 'Required' || f.bucket === 'Fixed')) {
       log(`classify: COST CLAMP — cost finding classified "${f.bucket}"; coerced to Deferred (non-escalation invariant).`);
       return Object.assign({}, f, { bucket: 'Deferred', security_class: 'none' });
     }
     return f;
   });
   ```

   Place it BEFORE `requiredFindings` is computed at `:1751`.

2. `.claude/skills/review-fix/references/disposition-table.md:75-85` — the
   `**Source "cost" findings are ADVISORY**` paragraph. Keep every existing
   sentence (never `Fixed`, never `Required`, never verify-eligible, always
   `Deferred`, unclassified falls back to `Deferred`). Append: the `cost`
   Source is now emitted by the merged `api-cost` finder alongside
   security-classified `firebase` findings from the same agent; the split is by
   sub-pattern (rules-permissiveness / emulator-reachability / key-exposure →
   `firebase`, security-classified; query-cost / amplifier / N+1 → `cost`,
   advisory); and the invariant is now clamped harness-side, not merely
   briefed.

3. `.claude/skills/review-fix/SKILL.md:589-590` — the one-line cost-advisory
   summary in §4. Extend it with the same one-sentence split statement, and
   update the skill's `description` frontmatter (`:3`), which enumerates Lane-B
   finders as "domain security reviewers, cost, codeql, npm, erosion", to name
   the merged lens.

**Out of scope.** `SEC_SOURCES` membership; the `Source` enum; the classify
prompt's existing cost rules at `:1480-1486` (they stay — the clamp backstops
them, it does not replace them).

**Dependencies.** Unit 4.

**Recommended model.** sonnet

---

## Reuse

- `.claude/workflows/review-fix.js:747-756` — `sweepDomains` / `sweepSections`.
  The direct template for `apiCostDomains` / `apiCostSections`: split one
  agent's brief into labelled per-subsection sections whose Source each
  section self-tags.
- `.claude/workflows/review-fix.js:887-906` — the
  `finderPrompt('domain-sweep')` branch. Template for the merged agent's
  prompt: "work the sections in order, report each independently, never
  shorten one because another was clean" + Source-enum enforcement +
  `SCHEMA_BLURB` tail.
- `.claude/workflows/review-fix.js:866-886` — the existing `cost` brief.
  Reused **verbatim** as `COST_BRIEF`, never rewritten.
- `.claude/workflows/review-fix.js:738-739` — `DOMAIN_PROMPTS.firebase`.
  Reused verbatim as the other section (today it is reachable only through the
  generic fallback branch at `:907-913` and has never been composed with cost).
- `.claude/workflows/review-fix.js:1333-1348` — `laneBAllowedSources` and the
  SOURCE CLAMP. Existing precedent for one agent legitimately emitting several
  Sources; extend the ternary rather than weakening the clamp.
- `.claude/workflows/review-fix.js:1514-1524` (`SEC_SOURCES`) and
  `:1751-1753` (`requiredFindings`). Reused **unchanged** — these two are the
  entire classification-split mechanism.
- `.claude/workflows/review-fix.js:1809-1878` — `buildVerifyPrompt`'s
  `isErosion` carve-out. Read for the re-assessment; deliberately NOT extended.
- `.claude/skills/dispatch-propagate/scripts/dispatch-security-surface` —
  structural template for the new classifier: pure stdin→stdout, `printf`
  `key=value` output parsed by `sed -n 's/^key=//p'`. Reused as a shape, never
  edited (the author ruled out a diff-content probe inside it).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-security-surface.sh`
  and `dispatch-test-fixture.sh` — `assert_eq` / `report_results` harness for
  the new test.
- `.claude/skills/review-fix/SKILL.md:237-249` — the `MERGE_BASE` +
  `SURFACE_OUT` capture block and its `sed` key=value idiom, reused for the new
  flag; `:456-474`'s `args` table, extended with one field.
- `.claude/skills/dispatch-propagate/scripts/review-fix-domain-sweep-probe.mjs`
  and `test-review-fix-domain-sweep.sh` — the slice-and-eval CI vector for
  sentinel-wrapped `review-fix.js` regions. Reused, not duplicated.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-finders` — the
  declared normative spec for `agentFinderSet`; must move in lockstep.

## Verification

Auto-runnable:

```verify
node --check .claude/workflows/review-fix.js
```

```verify
node .claude/skills/dispatch-propagate/scripts/review-fix-domain-sweep-probe.mjs
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-domain-sweep.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-api-call-site.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-review-finders.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-security-surface.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The `dispatch-security-surface` suite is included as a control: it must stay
green untouched, proving the path classifier was not modified.

Manual / judgment checks:

- **Classification boundary intact.** Confirm by inspection that
  `test-review-fix-domain-sweep.sh`'s two exact-membership assertions — the
  `Source` enum (`:149`) and `SEC_SOURCES` (`:156`) — passed *without being
  edited*. Editing either to make the suite green means the merge collapsed the
  security/advisory split and the change must be reworked.
- **Brief content preserved.** Diff `COST_BRIEF` against the pre-change
  `finderPrompt('cost')` body (`git show HEAD~:.claude/workflows/review-fix.js`)
  and confirm all three Firestore patterns and the query×amplifier paragraph
  survive verbatim; same for `DOMAIN_PROMPTS.firebase`. Dropping either loses
  coverage.
- **Fire rate (observe in production).** On the first several post-merge
  review-fix runs, grep the run logs for `find:api-cost` and record how many
  runs fired the lens. The gate is the statement's semantics — the lens fires
  on diffs touching an API or query call site — and the bar is that it fires on
  **materially more than 5 of 18** comparable runs. Do NOT assert a dollar
  ceiling or floor: per the 2026-08-03 ruling the ~$25-30 proxy per 4-day
  window is an expected consequence, not a threshold. Record the realized fire
  rate and the realized draw in this node's post-merge residue — the fire rate
  was UNMEASURED at plan time and is a tunable property of the pattern list.
- **Split observed live.** On the first run that produces api-cost findings,
  confirm from the PR comment that `firebase`-Source findings carry filled
  OWASP/STRIDE and are eligible for `Required`, and that `cost`-Source findings
  carry empty OWASP/STRIDE and land in `Deferred`. If the COST CLAMP log line
  (`classify: COST CLAMP`) appears, the classify agent mislabelled — note the
  frequency; a recurring clamp means the section wrapper's wording needs
  tightening.
- **Downstream checklist.** `tactic-mainqa-review-cost-finder`'s observation
  checklist (a live review whose diff contains an unbounded Firestore scan)
  must still pass against the merged lens. That node is parked at `main-qa` for
  passive observation and is a pending downstream check, not a blocker on this
  tactic.
