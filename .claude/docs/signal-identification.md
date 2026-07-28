# Signal Identification

Signal identification is the parse-time half of the feedback arm. For each
intention node, it decides what observable says the intention is met and how to read
it: first which category the observable falls into (feasibility), then, when a sensor
must be built, whether it is worth building (economics). It does not act on readings
and it does not own the node — it reads one node and emits a signal spec.

No entry point runs this step today. It was the parse-time half of the retired
`/align-init` skill's feedback arm; the rung-5 design it belonged to is retained by
the intention node `tactic-align-audit-legacy-review`
(`intentions/tactic-align-audit-legacy-review.md`), which decides whether a future
`/align-audit` re-consumes this contract. The verbatim pre-deletion source is
`.claude/skills/align-init/SKILL.md` at `origin/main` commit `44493733` — read it
there rather than duplicating it here.

This doc is the single source of truth for the signal-identification contract. The
`ref-signal-identification` skill, the #2371 `align-signal-assessor` role, and #2372
(the rung-detecting router, which wires this contract into the align loop and is
blocked by this issue) are all written against the field set, enums, and procedure
defined here. Do not change them in one place without changing this doc.

Signal identification runs at parse time, per intention node. It consumes the schema's
`success_signal` (`{observable, sensor, threshold, is_proxy}`), `reading`, and `gap`
fields (defined in `intentionsutil/src/schema.ts`); it does not redefine them. Per Unit
1, `reading` is the current measured value of the `success_signal` observable — `null`
until a sensor populates it — and `gap` is the shortfall between `reading` and
`threshold`.

## The two axes

Two things run through the feedback arm, and nothing downstream should conflate them.

- **Identification** — deciding, for an intention, *what* observable says it is met and
  *how* to read it. This is the classifier's job, and it is *this* contract. It produces
  a signal spec; it does not look at readings.
- **Feedback** — what the loop *does* once readings exist: the five feedback effects
  (re-prioritize, falsify proxies, detect drift, surface candidates, confirm
  push-downs). This is context only — it acts on readings the identification step's
  sensors later produce.

One step produces the signal spec; the other acts on the readings. Keep them
unconflated, the same way delegability keeps decomposition (which produces the node)
separate from delegation (which positions it).

The contract answers two questions, in series:

1. **WHAT** — classify. Given current tooling, what observable says this node is met,
   and where does it come from?
2. **WORTH** — economics. When the observable needs a sensor built, is building it worth
   the cost?

WORTH is consulted only for the `instrument` category. An observable that is already
instrumented has nothing to build, and a proxy is the fallback chosen precisely because
no directly-observable sensor exists — neither has an economic question to ask.

## Input contract

The evaluation reads the node fields below. It consumes them; it never writes them. The
node schema is defined in `intentionsutil/src/schema.ts`; this contract reads the fields
by name.

| Field | Semantics |
|---|---|
| `statement` | What the intention is. The primary classifier input — the observable is identified against this. |
| `rationale` | Why the intention exists. Disambiguates a node toward `proxy` when it reveals the intention resists direct observation. |
| `owner` | `human` \| `ai` \| `procedure`. The current owner. Read for context. |
| `status` | `raw` \| `refining` \| `delegated` \| `codified`. Read for context — a `codified` node's signal is later watched for drift (feedback effect 3). |
| `success_signal` | Any `{observable, sensor, threshold, is_proxy}` already named on the node. Read for context — an observable already named can be confirmed rather than re-derived. |
| `tooling_goals[]` | Investments already named on the node. A `ToolingGoal{kind:"sensor"}` already present is read for context — do not re-emit a sensor goal that already exists. |

`parent`, `reading`, `gap`, and `id` are read for context and echo only (`id` is echoed
into the output as `node_id`; `reading` and `gap` are what the feedback effects later
act on). They are not classifier inputs.

## Signal-identification classifier

The classifier produces exactly one of `existing_sensor` / `instrument` / `proxy`. It is
AI judgment, not a script — there is no deterministic rule that decides whether an
intention is directly observable. The boundary is drawn *relative to current tooling*,
and it moves over time: an uninstrumented observable becomes an `existing_sensor` once
the sensor is built, and a proxy can be retired once the real observable becomes
reachable.

| Category | Means | Action | Test |
|---|---|---|---|
| `existing_sensor` | The observable is already instrumented; a sensor reads it today. | Wire the existing sensor in. | Is there a sensor already producing this reading, so no new tooling is needed? |
| `instrument` | The observable is directly observable but uninstrumented. | Emit a sensor tooling-goal (`ToolingGoal{kind:"sensor"}`). | Is the thing the intention cares about directly measurable, just not yet wired to a sensor? |
| `proxy` | The intention is not directly observable. | Pick an explicit, flagged proxy (`is_proxy: true`). | Does no directly-observable signal exist, so the best available reading stands in for the real thing? |

### Decision procedure

The order is fixed so two assessors converge on the same category. The most
systematizable category that fits wins.

1. Test `existing_sensor` first. If a sensor already produces this reading, the category
   is `existing_sensor`.
2. Else test `instrument`. If the observable is directly measurable but not yet wired to
   a sensor, the category is `instrument`.
3. Else the category is `proxy`.

Each result carries a `category` plus a mandatory `rationale` naming which test passed or
failed and why. The rationale is what lets a reader audit the call rather than trust it.

## WORTH economics (sensor ROI)

WORTH is consulted only for the `instrument` category — `existing_sensor` has nothing to
build, and `proxy` is the fallback chosen precisely because no directly-observable sensor
exists. It decides whether a *buildable* sensor is *worth building*. The headline
principle: **don't build a sensor costlier than the decision it informs.**

The named inequality is load-bearing; #2372 depends on it literally:

```
instrument_is_worth_it  ⟺  build + (run × frequency) + maintenance
                            <  decision_value × decision_frequency
```

| Term | Meaning |
|---|---|
| `build` | One-time cost to write and wire the sensor. |
| `run` | Marginal cost of one reading once the sensor is built. |
| `frequency` | How many times the sensor reads over the horizon it matters. |
| `maintenance` | Upkeep over that horizon. "Maintainable" means *safe to abandon* — the sensor can be left untouched without breaking. The TECHNICAL perspective owns this term. |
| `decision_value` | The value of the decision the reading informs — what acting on the reading is worth. |
| `decision_frequency` | How often that decision is made over the horizon. |

### Decline rule

When the left side is not strictly less than the right, the instrument is declined
(`economics_verdict: decline`) even though the observable *could* be instrumented. The
node stays with a proxy or no signal until the decision the reading informs is worth the
sensor — a reading no one will act on, or acts on too rarely, does not earn its build and
maintenance cost.

### Perspectives intrinsic to the economics call

Two perspectives are consulted on a WORTH decision. They estimate the terms; they do not
by themselves decide. They reuse the existing align agents:

| Perspective | Derived from | Estimates |
|---|---|---|
| FINANCIAL | `.claude/agents/align-financial.md` | `build`, `run`, `decision_value`, and `decision_frequency` |
| TECHNICAL | `.claude/agents/align-technical.md` | `maintenance`, and a "safe to abandon" concern on a sensor that would rot if left untouched |

## Local-first / no-mining principle

Prefer signals about one's *own* execution — CI results, test pass rates, the author's
own use of an artifact — over signals gathered by watching users. A sensor that observes
your own pipeline is the default the classifier reaches for first.

An external or analytics sensor — site analytics, user-behavior tracking, anything that
reads activity beyond one's own execution — is a flagged, opt-in choice, never the
default. This is a charter-aligned constraint on *which* sensors the classifier may
reach for: when a local-execution signal and a user-surveillance signal both exist, the
local one wins, and the surveillance one is reached for only with explicit opt-in.

## The five feedback effects

These are the *Feedback* axis — what the loop does once readings exist. Each is a
closed-loop operation over the local intentions store plus the readings its sensors
produce. They are defined here so the contract names the consumers of the signals it
identifies; acting on them belongs to #2372 and the runtime loop, not to this parse-time
step.

1. **Re-prioritize by gap.** Trigger: the frontier is projected. Reads: each frontier
   node's `gap`. Output: gap-present nodes ordered ahead of gap-absent ones. Already
   realized by `intentionsutil/src/goals.ts::projectGoals`, whose primary sort key is now
   derived attention rank (descending) with gap-present
   (`gap !== null`) first as the tie-break within equal rank. Reference it as done.

2. **Falsify proxy goals.** Trigger: an `is_proxy` signal's reading contradicts the
   underlying intention (the proxy reads "met" while the real intention plainly is not,
   or the reverse). Reads: the node's `success_signal.is_proxy`, `reading`, and the
   intention itself. Output: the proxy is flagged as falsified — it measured the wrong
   thing — and surfaced for review so a better signal can replace it.

3. **Detect codification drift.** Trigger: a `status: codified` node whose signal now
   fails its threshold. Reads: `status`, `success_signal.threshold`, `reading`. Output:
   the node is flagged for reopening — the codified procedure has drifted from the intent
   it was meant to satisfy.

4. **Surface new intention candidates.** Trigger: readings revealing an unaddressed
   need — a signal pointing at a gap no node yet covers. Reads: readings across the
   store. Output: candidate records carrying provenance (what reading prompted them),
   **quarantined** — the practitioner ratifies a candidate before it becomes a real
   intention node. The loop never auto-writes live nodes; this is an acceptance criterion
   of #2371.

5. **Confirm push-downs (author-use gate).** Trigger: an author-use reading on a node
   whose execution was pushed down (delegated or codified). Reads: the author-use signal.
   Output: a delegation push-down is confirmed only when an author-use reading shows the
   codified artifact is actually used and holding. Until such a reading arrives, the
   push-down stays provisional.

## Output contract

This is the exact shape #2372 consumes.

**Carrier (provisional serialization — see note).** A stable marker line immediately
followed by a fenced `json` block, reusing the dispatch marker convention so a persisted
consumer can grep it deterministically:

    <!-- signal:eval:v1 -->
    ```json
    { "schema": "signal.eval.v1", "node_id": "...", ... }
    ```

> NOTE: the carrier is provisional; the field set is the contract. The marker-comment
> carrier is borrowed from `outcome-envelope.md`, whose marker exists because the
> envelope is persisted to a PR comment and re-grepped across sessions. #2372's
> `align-signal-assessor` may instead be a reasoning-time subagent that returns a
> structured object — the repo's Workflow `schema:` pattern — where the natural carrier
> is the returned JSON, not an HTML-marked block. The **field set, enums, and
> invariants** below are the stable contract; the marker-comment carrier is a provisional
> serialization #2372 may revise. Do not treat the marker as immutable.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `schema` | string | no | const `"signal.eval.v1"` |
| `node_id` | string | no | echoes the input node's `id` |
| `category` | string | no | enum `{existing_sensor, instrument, proxy}` |
| `success_signal` | object | no | the chosen `{observable, sensor, threshold, is_proxy}`; invariant `is_proxy == (category == proxy)` |
| `confidence` | string | no | enum `{high, medium, low}` |
| `rationale` | string | no | prose naming which classifier test decided the category |
| `economics_verdict` | string | no | always one of enum `{instrument, decline, n/a}` — never JSON `null`; the string `"n/a"` (not `null`) for `existing_sensor` and `proxy` |
| `economics_rationale` | string | yes | which side of the inequality won, with the financial and technical inputs; `null` when `economics_verdict == "n/a"` |
| `tooling_goal` | object | yes | the sensor to build; non-null iff `category == instrument` AND `economics_verdict == "instrument"`; else `null` |

Nested shape:

- `tooling_goal` = `{ "kind": "sensor", "statement": string }` — `kind`
  is always `"sensor"` (this is the schema `ToolingGoal{kind:"sensor"}` the
  `instrument` action emits), `statement` names the sensor to build.

### Strict validation and invariants

The always-present fields are `schema`, `node_id`, `category`, `success_signal`,
`confidence`, and `rationale`. An object missing any of these is treated as absent —
re-run required — never coerced into defaults, the same discipline as the
outcome-envelope reader.

#2372 can rely on these invariants:

- `category == existing_sensor` ⟹ `success_signal.is_proxy == false`,
  `tooling_goal == null`, and `economics_verdict == "n/a"`.
- `category == proxy` ⟹ `success_signal.is_proxy == true`, `tooling_goal == null`, and
  `economics_verdict == "n/a"`.
- `category == instrument` ⟹ `success_signal.is_proxy == false`; and
  `tooling_goal != null` iff `economics_verdict == "instrument"`. A declined instrument
  has `tooling_goal == null` and `economics_verdict == "decline"`.

In every case `economics_rationale` is `null` exactly when `economics_verdict == "n/a"`;
a `decline` carries a non-null `economics_rationale` explaining the declined build.

## Worked examples

Each example runs classify → economics → output end-to-end, and includes the full
output-contract JSON so its trace is verifiable.

### `existing_sensor` — wire in a sensor that already reads

Node: `statement` = "CI stays green on `main`", `owner` = `procedure`, `status` =
`codified`.

- **Classify.** CI already reports pass/fail on every push to `main` — a sensor produces
  this reading today. `existing_sensor` test passes, high confidence. The observable is
  one's own pipeline, so the local-first principle is satisfied with no opt-in.
- **Economics.** Not consulted — nothing to build. `economics_verdict` is `"n/a"`, so
  `economics_rationale` is `null`.

```json
{
  "schema": "signal.eval.v1",
  "node_id": "node-ci-green-main",
  "category": "existing_sensor",
  "success_signal": {
    "observable": "GitHub Actions conclusion on the default-branch workflow run",
    "sensor": "existing CI status check on main",
    "threshold": "every default-branch run concludes success",
    "is_proxy": false
  },
  "confidence": "high",
  "rationale": "existing_sensor test passed: CI already reports a pass/fail conclusion on every push to main, so the reading is produced by a sensor that exists today; no new tooling is needed.",
  "economics_verdict": "n/a",
  "economics_rationale": null,
  "tooling_goal": null
}
```

### `instrument`, worth it — build the sensor

Node: `statement` = "the frontier view orders gap-present goals ahead of gap-absent
ones", `owner` = `ai`, `status` = `delegated`.

- **Classify.** The ordering is directly observable — render the frontier and check the
  position of gap-present nodes — but no sensor watches it today. `existing_sensor`
  fails (nothing reads it), `instrument` passes. High confidence. The observable is the
  project's own output, so the local-first principle holds.
- **Economics.** `build` is a small assertion over `projectGoals` output, `run` is
  near-zero, `frequency` is every frontier render, `maintenance` is low and safe to
  abandon. The decision it informs — trusting the frontier ordering — is made often and
  matters. Left side ≪ right side. `instrument`, with a sensor tooling-goal.

```json
{
  "schema": "signal.eval.v1",
  "node_id": "node-frontier-gap-ordering",
  "category": "instrument",
  "success_signal": {
    "observable": "relative position of gap-present vs gap-absent nodes in projectGoals output",
    "sensor": "ordering assertion over projectGoals output (to be built)",
    "threshold": "every gap-present node precedes every gap-absent node",
    "is_proxy": false
  },
  "confidence": "high",
  "rationale": "instrument test passed: the ordering is directly observable from projectGoals output, but no sensor watches it today, so it is observable-but-uninstrumented.",
  "economics_verdict": "instrument",
  "economics_rationale": "Left side ≪ right side: small build (an assertion over projectGoals), near-zero run, frequency every frontier render, low maintenance and safe to abandon (TECHNICAL); the decision it informs — trusting the frontier ordering — is frequent and valuable (FINANCIAL).",
  "tooling_goal": {
    "kind": "sensor",
    "statement": "add an ordering assertion over projectGoals output that gap-present nodes precede gap-absent ones"
  }
}
```

### `instrument`, declined — buildable but not worth it (decline rule)

Node: `statement` = "the README's opening sentence reads well to a first-time visitor",
`owner` = `human`, `status` = `raw`.

- **Classify.** Readability of one sentence is directly observable — one could wire a
  readability-score sensor over the opening line — but none exists. `existing_sensor`
  fails, `instrument` passes. Medium confidence.
- **Economics.** `build` to write and wire a readability sensor is non-trivial, and
  `maintenance` carries a "safe to abandon" worry (a scoring dependency rots). The
  decision it informs is made rarely — the opening sentence changes a few times a year —
  so `decision_frequency` is low. Left side > right side. `decline` — stay with no
  built signal until the decision is worth the sensor.

```json
{
  "schema": "signal.eval.v1",
  "node_id": "node-readme-opening-readability",
  "category": "instrument",
  "success_signal": {
    "observable": "readability score of the README's opening sentence",
    "sensor": "readability-score sensor over the opening line (declined — not built)",
    "threshold": "opening sentence scores at or above the target reading ease",
    "is_proxy": false
  },
  "confidence": "medium",
  "rationale": "instrument test passed: the opening sentence's readability is directly observable via a readability score, but no sensor measures it today.",
  "economics_verdict": "decline",
  "economics_rationale": "Left side > right side: non-trivial build to wire a readability sensor with a maintenance/safe-to-abandon worry on the scoring dependency (TECHNICAL); the decision it informs is made only a few times a year, so decision_frequency is low (FINANCIAL). Stay with no built signal until the sentence changes often enough to justify it.",
  "tooling_goal": null
}
```

### `proxy` — no directly-observable signal exists

Node: `statement` = "the align loop actually improves roadmap quality over time",
`owner` = `human`, `status` = `raw`.

- **Classify.** "Roadmap quality" is not directly observable — there is no instrument
  that reads whether the roadmap is *good*; each judgment needs fresh human assessment.
  `existing_sensor` and `instrument` both fail. The category is `proxy`. An explicit,
  flagged proxy stands in: the share of shipped roadmap items that were not later
  reversed or abandoned — a measurable trace that *correlates* with quality without being
  it. Medium confidence. The proxy reads the project's own shipped work, so it stays
  local-first, not user surveillance.
- **Economics.** Not consulted — `proxy` is the fallback chosen because no
  directly-observable sensor exists. `economics_verdict` is `"n/a"`, so
  `economics_rationale` is `null`. Feedback effect 2 will later watch this proxy: if its
  reading reads "met" while roadmap quality plainly is not, it is flagged as falsified.

```json
{
  "schema": "signal.eval.v1",
  "node_id": "node-align-improves-roadmap",
  "category": "proxy",
  "success_signal": {
    "observable": "share of shipped roadmap items not later reversed or abandoned",
    "sensor": "tally of shipped-vs-reversed roadmap items from the issues store",
    "threshold": "the non-reversal share trends upward across review cycles",
    "is_proxy": true
  },
  "confidence": "medium",
  "rationale": "existing_sensor and instrument tests failed: roadmap quality is not directly observable and resists instrumentation, so an explicit flagged proxy — the non-reversal share of shipped items — stands in for it.",
  "economics_verdict": "n/a",
  "economics_rationale": null,
  "tooling_goal": null
}
```
