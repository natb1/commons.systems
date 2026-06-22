# Delegability Evaluation

The delegability evaluation is the core of `/align`'s per-intention loop. For each
intention node, it decides where execution can and should be owned along the
human → AI → procedure continuum: first whether ownership *can* move (feasibility),
then whether it *should* move (economics). It does not decompose intentions and it
does not own the node — it reads one node and emits a recommendation.

This doc is the single source of truth for the delegability contract. The
`ref-delegability` skill, the #2370 delegability-assessor role, and the dialectic
engine (#2370, which is blocked by this issue) are all written against the field
set, enums, and formula defined here. Do not change them in one place without
changing this doc.

## The two axes

Two axes run through `/align`, and nothing downstream should conflate them.

- **Decomposition** — intention → sub-intention → goal. Breaking a broad intention
  into narrower pieces until each is concrete enough to act on. This is *not* this
  contract's job; it is context only. The delegability evaluation receives a node
  that decomposition already produced.
- **Delegation** — human → AI → procedure. A continuum applied per intention, never
  a single global rung the whole tree sits on. Two sibling nodes can land at
  different points. This contract evaluates one node's position on this axis.

The evaluation answers two questions, in series:

1. **CAN** — feasibility. Where on the delegation axis could this node be owned,
   given current tooling?
2. **SHOULD** — economics. Given that it *can* move, is moving it worth the cost?

SHOULD is consulted only when CAN ≠ `c`. A node that needs fresh human judgment
every time has nothing to push down, so there is no economic question to ask.

## Input contract

The evaluation reads the node fields below. It consumes them; it never writes them.
The node schema is defined by sibling #2366. This contract reads the fields by name;
if #2366 finalizes the schema with renamed or restructured fields, update this table
— the evaluation depends on the listed semantics, not the exact key spelling.

| Field | Semantics |
|---|---|
| `statement` | What the intention is. The primary CAN input — feasibility is judged against this. |
| `rationale` | Why the intention exists. Disambiguates a node toward `c` when it reveals the work needs fresh judgment each time. |
| `owner` | `human` \| `ai` \| `procedure`. The current owner. The recommendation is a *target relative to this* — "push down" means move below it, "hold" means stay. |
| `status` | `raw` \| `refining` \| `delegated` \| `codified`. Gates eligibility — a node still being refined may not be ready for a delegation recommendation. |
| `clarifications[]` | Resolved ambiguities. A clarification that removes ambiguity can move a node off `c`. |
| `tooling_goals[]` | Investments already named on this node. Read for context — the evaluation does not write it. The output `tooling_goal` (see [Output contract](#output-contract)) is a recommendation; the caller should append a non-null output `tooling_goal` here if it is not already present, do not duplicate an entry that already says the same thing. |
| `success_signal` | The observable that says the intention is met. An explicit observable / sensor / threshold pushes a node toward `a` — work with a checkable output is more systematizable. |

`parent`, `reading`, `gap`, and `id` are read for context and echo only (`id` is
echoed into the output as `node_id`). They are not decision inputs.

## CAN classifier (feasibility)

CAN produces exactly one of `a` / `b` / `c`. The classifier is AI judgment, not a
script — there is no deterministic rule that decides ambiguity. The boundary is
drawn *relative to current tooling*, and it moves down over time: work that needs a
human today becomes AI-ownable once an agent has the right instructions, and
AI-owned work becomes a procedure once it is scripted. That downward movement is
the self-improvement the loop is built to capture.

| Category | Means | Target owner | Test |
|---|---|---|---|
| `a` | Well-defined; inputs, outputs, and rules are enumerable. | `procedure` | Could a competent engineer script this to be correct every time, given current tooling? |
| `b` | Needs broad pattern recognition within a learnable frame. | `ai` | Too contextual to script, but would a skilled agent with good instructions do it reliably? |
| `c` | Too ambiguous; each instance needs fresh judgment. | `human` (refine further) | Does each instance need genuinely novel judgment that resists both scripting and instruction? |

### Decision procedure

The order is fixed so two assessors converge on the same category. The most
systematizable category that fits wins.

1. Test `a` first. If a competent engineer could script this to be correct every
   time given current tooling, the category is `a`.
2. Else test `b`. If it is too contextual to script but a skilled agent with
   instructions would do it reliably, the category is `b`.
3. Else the category is `c`.

Each result carries a `category` plus a mandatory `rationale` naming which test
passed or failed and why. The rationale is what lets a reader audit the call rather
than trust it.

### The "not-yet" escape

When a node is `c` now — or only confidently `b` — but the assessor can name a
concrete tooling investment that would move it lower on the axis, the honest output
says so. The canonical phrasing is: **human-for-now, plus a tooling-goal to make it
AI-ownable.** Rather than pretend a node is more delegable than it is, the
evaluation records what would change that.

The boundary moving down applies in both directions:

- `c → b` or `c → a` — a node that needs a human today, plus the investment that
  would make it AI-ownable or scriptable.
- `b → a` — a node an agent can own today, plus the investment that would let it be
  scripted instead.

A confidently-`b` node that tooling could push to `a` may carry a tooling-goal too.
The `tooling_goal` is a structured object (see [Output contract](#output-contract)),
not free text — a downstream consumer files it as work, so it needs a goal, the
category it would unlock, and a rough cost.

## SHOULD economics (push-down ROI)

SHOULD is consulted only when CAN ≠ `c`. It decides whether a *feasible* push-down
is *worth it*. The named ROI inequality is load-bearing — #2370 depends on it
literally:

```
push_down_is_worth_it  ⟺  build + (run × frequency) + maintenance
                            <  (manual_cost × frequency) + attention_value_freed
```

| Term | Meaning |
|---|---|
| `build` | One-time cost to codify or instruct — write the script, write the agent instructions. |
| `run` | Marginal cost of one automated execution once built. |
| `frequency` | How many times the node executes over the horizon it matters. |
| `maintenance` | Upkeep over that horizon. "Maintainable" means *safe to abandon* — the artifact can be left untouched without breaking. The TECHNICAL perspective owns this term. |
| `manual_cost` | Cost of one by-hand execution at the current owner level. |
| `attention_value_freed` | The higher-order attention the push-down frees — the human capacity returned to work only a human can do. This is why greedy codification is correct when the checks pass: every push-down compounds by freeing attention for the next one. |

### Decline rule

When the left side is not strictly less than the right, the push-down is declined
even though CAN says it is feasible (`roi_verdict: decline`) — a rarely-used,
expensive-to-codify intention stays human- or AI-owned even when it could be
proceduralized.

### Perspectives intrinsic to delegation

Two perspectives are always consulted on a SHOULD decision. They estimate the terms;
they do not by themselves decide. They reuse the existing roadmap agents:

| Perspective | Derived from | Estimates |
|---|---|---|
| FINANCIAL | `.claude/agents/roadmap-finance.md` — cost analysis, break-even, sustainability | the left-side costs (`build`, `run`), `manual_cost`, and `frequency` |
| TECHNICAL | `.claude/agents/roadmap-engineering.md` — impact × risk × effort, forkability, "safe to abandon" | `maintenance`, and a veto if the codified artifact would not be safe to abandon |

### Greedy codification

Greedy codification is correct when a push-down survives CAN, clears the ROI
inequality, and the consistency layer does not veto it. Those three checks, in that
order (CAN → ROI → consistency, matching the SKILL.md steps), together absorb the old
"don't over-codify" worry — CAN keeps the unscriptable unscripted, the ROI inequality
rejects the not-worth-it push-downs, and the consistency layer catches the ratchet
teeth. When all three pass, push down, because the freed attention compounds.

## Consistency / veto layer

A consistency-tester derived from `.claude/agents/roadmap-auditor.md` — charter
compliance and ratchet risk — runs over the recommendation. It does not produce the
recommendation; it can veto one. A push-down that is CAN-feasible and ROI-positive is
still declined if it conflicts with a standing intention or a charter principle — for
example, if codifying it creates a ratchet tooth that resists later removal. Its
output is an optional `veto` field carrying a reason.

## Output contract

This is the exact shape #2370 consumes.

**Carrier (provisional serialization — see note).** A stable marker line immediately
followed by a fenced `json` block, reusing the dispatch marker convention so a
persisted consumer can grep it deterministically:

    <!-- delegability:eval:v1 -->
    ```json
    { "schema": "delegability.eval.v1", "node_id": "...", ... }
    ```

> NOTE: the carrier is provisional; the field set is the contract. The
> marker-comment carrier is borrowed from `outcome-envelope.md`, whose marker exists
> because the envelope is persisted to a PR comment and re-grepped across sessions.
> #2370's delegability-assessor may instead be a reasoning-time subagent that returns
> a structured object — the repo's Workflow `schema:` pattern — where the natural
> carrier is the returned JSON, not an HTML-marked block. The **field set, enums, and
> invariants** below are the stable contract; the marker-comment carrier is a
> provisional serialization #2370 may revise. Do not treat the marker as immutable.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `schema` | string | no | const `"delegability.eval.v1"` |
| `node_id` | string | no | echoes the input node's `id` |
| `recommended_owner` | string | no | enum `{human, ai, procedure}` |
| `can_category` | string | no | enum `{a, b, c}` |
| `confidence` | string | no | enum `{high, medium, low}` |
| `rationale` | string | no | prose naming which CAN test decided the category |
| `roi_verdict` | string | no | always one of enum `{push_down, decline, n/a}` — never JSON `null`; the string `"n/a"` (not `null`) when `can_category == c` |
| `roi_rationale` | string | yes | which side of the inequality won, with the financial and technical inputs; `null` when `roi_verdict == n/a` |
| `tooling_goal` | object | yes | present iff the assessor named a concrete investment to move the boundary down; else `null` |
| `veto` | object | yes | present iff a veto fired (consistency layer or TECHNICAL "safe to abandon"); else `null` |

Nested shapes:

- `tooling_goal` = `{ "goal": string, "moves_category_to": enum {a, b}, "rough_cost": string }`
- `veto` = `{ "by": enum {consistency, technical}, "reason": string }` — `consistency`
  when the auditor/consistency layer fires (charter compliance, ratchet risk),
  `technical` when the TECHNICAL perspective fires (the codified artifact would not be
  safe to abandon).

### Strict validation and invariants

The always-present fields are `schema`, `node_id`, `recommended_owner`,
`can_category`, `confidence`, and `rationale`. An object missing any of these is
treated as absent — re-run required — never coerced into defaults, the same discipline
as the outcome-envelope reader.

#2370 can rely on these invariants:

- `can_category == c` ⟹ `recommended_owner == human` and `roi_verdict == "n/a"`.
- `roi_verdict == "decline"` ⟹ `recommended_owner` does not move below the input
  `owner` (a declined push-down leaves ownership where it was).
- `tooling_goal != null` ⟹ the boundary could move: `can_category == c`, OR
  `confidence == low`, OR the named investment lowers a confidently-`b` node toward
  `a` (`moves_category_to: a`).
- `veto != null` ⟹ `roi_verdict == "decline"`. A veto overrides a ROI-positive
  push-down: the emitted `roi_verdict` is set to `decline` (not left as `push_down`),
  and `recommended_owner` holds ownership in place at the input `owner`.

## Worked examples

Each example runs CAN → SHOULD → output end-to-end, and includes the full
output-contract JSON so its trace is verifiable.

### `a`, push_down — greedy codification is correct

Node: `statement` = "normalize every bank-statement date to ISO-8601",
`owner` = `ai`, with a `success_signal` of "every row's date matches `YYYY-MM-DD`".

- **CAN.** Inputs, outputs, and rules are fully enumerable — parse a date, emit
  ISO-8601. A competent engineer scripts this correctly every time. Category `a`,
  high confidence.
- **SHOULD.** `build` is trivial (a small parser), `run` is near-zero, `frequency` is
  high (every statement, every month), `maintenance` is low and the artifact is safe
  to abandon. Left side ≪ right side. `push_down`.

```json
{
  "schema": "delegability.eval.v1",
  "node_id": "node-bankdate-iso",
  "recommended_owner": "procedure",
  "can_category": "a",
  "confidence": "high",
  "rationale": "CAN test a passed: inputs, outputs, and the normalization rule are fully enumerable; a competent engineer would script this to be correct every time.",
  "roi_verdict": "push_down",
  "roi_rationale": "Left side ≪ right side: trivial build, near-zero run, high frequency, low maintenance and safe to abandon (TECHNICAL); manual_cost × frequency dominates (FINANCIAL).",
  "tooling_goal": null,
  "veto": null
}
```

### `b`, decline — feasible but net-negative (decline rule)

Node: `statement` = "draft a tone-matched reply to a rare inbound partnership email",
`owner` = `human`.

- **CAN.** Too contextual to script — each email is different — but a skilled agent
  with instructions about voice and partnership terms would draft it reliably.
  Category `b`, medium confidence.
- **SHOULD.** `build` to instruct the agent on tone and partnership judgment is
  non-trivial; `frequency` is a few per year; `attention_value_freed` is small (a
  rare task). Left side > right side. `decline` — ownership stays `human`, matching
  the input `owner`.

```json
{
  "schema": "delegability.eval.v1",
  "node_id": "node-partnership-reply",
  "recommended_owner": "human",
  "can_category": "b",
  "confidence": "medium",
  "rationale": "CAN test b passed: too contextual to script, but a skilled agent with tone and partnership instructions would draft it reliably.",
  "roi_verdict": "decline",
  "roi_rationale": "Left side > right side: non-trivial build to instruct tone (FINANCIAL), frequency only a few per year, small attention_value_freed; maintenance modest but unjustified at this frequency (TECHNICAL).",
  "tooling_goal": null,
  "veto": null
}
```

### `c` + tooling_goal — not-yet (the "not-yet" escape)

Node: `statement` = "decide which roadmap epic to prioritize next quarter",
`owner` = `human`.

- **CAN.** Each instance needs fresh judgment — strategy, charter fit, timing — that
  resists both scripting and instruction. Category `c`. `recommended_owner` is
  `human`, `roi_verdict` is `n/a` (nothing feasible to push down yet), so
  `roi_rationale` is `null`.
- **Not-yet.** The assessor names a concrete investment that would make the next
  iteration AI-ownable: a charter-scored backlog ranker. That moves the category
  toward `b`, at a medium rough cost. Carried as `tooling_goal`.

```json
{
  "schema": "delegability.eval.v1",
  "node_id": "node-quarter-prioritization",
  "recommended_owner": "human",
  "can_category": "c",
  "confidence": "high",
  "rationale": "CAN test a and b failed: each quarter's prioritization needs genuinely novel judgment about strategy and charter fit that resists both scripting and instruction.",
  "roi_verdict": "n/a",
  "roi_rationale": null,
  "tooling_goal": {
    "goal": "build a charter-scored backlog ranker",
    "moves_category_to": "b",
    "rough_cost": "medium"
  },
  "veto": null
}
```

### `b`, push_down then veto — consistency overrides a ROI-positive push-down

Node: `statement` = "auto-merge any green dependency-bump PR without review",
`owner` = `ai`.

- **CAN.** Too contextual to fully script — judging which bumps are safe — but a
  skilled agent with merge-policy instructions would handle it reliably. Category `b`,
  high confidence.
- **SHOULD.** `build` is modest, `frequency` is high, `attention_value_freed` is real.
  Left side < right side. ROI alone says `push_down`.
- **Consistency / veto.** The auditor fires: codifying auto-merge creates a ratchet
  tooth — once merges run unattended they resist later re-introduction of review, and
  this conflicts with the standing change-control charter principle. The push-down is
  vetoed. `roi_verdict` is overridden to `decline`, `recommended_owner` holds at the
  input `owner` (`ai`), and `veto` carries the reason.

```json
{
  "schema": "delegability.eval.v1",
  "node_id": "node-autodep-merge",
  "recommended_owner": "ai",
  "can_category": "b",
  "confidence": "high",
  "rationale": "CAN test b passed: too contextual to fully script, but a skilled agent with merge-policy instructions would judge which dependency bumps are safe to merge reliably.",
  "roi_verdict": "decline",
  "roi_rationale": "ROI alone clears (modest build, high frequency, real attention_value_freed: left side < right side), but the consistency layer vetoed, so the verdict is overridden to decline.",
  "tooling_goal": null,
  "veto": {
    "by": "consistency",
    "reason": "Codifying unattended auto-merge creates a ratchet tooth that resists later re-introduction of review, conflicting with the change-control charter principle."
  }
}
```
