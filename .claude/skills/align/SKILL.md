---
name: align
description: On-demand, `/align` detects the entry rung from repo state and routes — `rung-0` runs a Socratic intent interview that seeds principle roots, `refine-workflow` decomposes existing roots into a goal frontier, `rung-5` runs the dialectic engine over the charter-level intent (two orthogonal layers — structural roles drive the dialectic, perspectives feed it; it synthesizes priorities, a contrarian challenges, it re-synthesizes, triages the backlog, and produces roadmap recommendations plus per-priority delegability findings); the scheduled (align jit) trigger always runs the rung-5 dialectic and posts a report that closes the review issue.
user-invocable: true
---

# Align

`/align` meets a repository at whatever alignment depth it already has. On the
on-demand trigger it **detects an entry rung** from repo state and routes; the
**rung-5 dialectic engine** — a decompose → assess → synthesize → challenge →
re-synthesize loop over a set of evaluative perspectives that triages the open
backlog and produces recommended re-prioritizations, edits to the `strategy-*`
doctrine nodes, and edits to the issue backlog —
is one of those branches (the deepest), not the skill's sole identity. See
**## Rung routing** for the entry-rung detector and the branches.

Two constraints bound the routing:

- Detection picks an **entry depth** — the depth this invocation starts at
  because the structure for shallower depths already exists. It does **not**
  impose a global delegation ladder. Delegation stays a per-intention continuum
  (human → AI → procedure) decided node-by-node — the orthogonality bullets
  below say this; routing does not change it.
- The rungs are **alignment depths** (the arc: refine workflow → codify skills →
  automate → owned loop), **not** the dispatch phase chain
  (`plan → implement → qa → review`). "Rung N" means "this invocation enters at
  depth N because the structure for depth < N already exists," never "the
  project is at maturity N."

The engine keeps **two orthogonal layers** and never conflates them:

- **Structural roles** drive the dialectic itself — decomposer,
  consistency-tester, delegability-assessor, contrarian. They are universal:
  they apply regardless of what the project is.
- **Perspectives** are the evaluative lenses the roles run over — the intrinsic
  financial and technical perspectives (always applied) plus the charter-derived
  perspectives the charter currently calls for (today: product and marketing).

The same orthogonality runs through the two axes the engine reasons about, which
must never be conflated:

- **Decomposition** — intention → sub-intention → goal. Breaking a broad
  intention into narrower pieces until each is concrete enough to act on.
- **Delegation** — human → AI → procedure. A continuum applied per intention,
  never a single global rung the whole tree sits on.

The rung-5 engine operates at the project's **charter-level intent**. The
intention graph is now populated — principle roots and a goal frontier exist —
so rung-5 is reached by the on-demand detector (or run unconditionally on the
scheduled trigger), not assumed. The engine reads the intention graph's
principle roots (`intentions/principle-*.md`), the `strategy-*` doctrine nodes,
the active-frontier view (generated from the intention graph), all work completed
since the last review, and analytics, the same inputs the assessment has always
used.

This skill runs on one of two **triggers**:

- **On-demand** — a human runs `/align` (optionally with a focus question). The
  skill stops for user feedback after re-synthesis, then presents proposed edits
  with the backlog triage results. Nothing is posted to GitHub; no issue is
  closed.
- **Scheduled** — the JIT engine runs `/align` against a `jit:align` review
  issue via the skill-running jit-reminder path (`dispatch-jit-reminder`). This
  is an **office-hours session**, like every jit summary session: after claiming
  the issue (`Status` → `In Progress`), `dispatch-jit-reminder` invokes this
  skill with the issue's `<repo> <num>` as its arguments and lets it own the
  rest of the session. There is **no** user-feedback stop — the skill posts the
  full report as a comment on the review issue and closes it, anchoring the next
  cadence cycle.

Run every `gh`-calling command, and every script that calls `gh` or `curl`, with
`dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## Trigger detection

The skill takes optional arguments. Detect the trigger from them:

- **Two arguments** where the first matches `owner/repo` (a `/`-containing slug)
  and the second is digits (`<repo> <num>`) → **scheduled** trigger against that
  `jit:align` review issue. This is how `dispatch-jit-reminder` invokes the
  skill (same contract as `/digest`). Before doing anything else, verify the
  issue actually carries a `jit:align` label:

  ```bash
  gh issue view <num> --repo <repo> --json labels
  ```

  Run with `dangerouslyDisableSandbox: true`. If the issue's labels do **not**
  include `jit:align`, **STOP** with a clear error — this skill must not post
  to or close an issue that is not an align-review jit issue.

- **Otherwise** → **on-demand** trigger. Treat any argument text as the
  **focus question** (see below), carried through every phase.

## Rung routing (on-demand only)

The **scheduled trigger always runs rung-5 unconditionally** — a background jit
job has no human to interview, so no shallower rung is reachable. Rung detection
is nested strictly **inside** the on-demand branch, so this holds by
construction.

On the **on-demand** trigger, run the detector and branch on its output:

```bash
RUNG=$(npx tsx intentionsutil/scripts/detect-rung.ts)
```

This is a local read of the intention graph — no `gh`, no network — so it runs
in-sandbox. It prints exactly one of `rung-0` / `refine-workflow` / `rung-5`.

Branch on `RUNG` into one of three **mutually-exclusive terminal** gates. This
is the detection-preamble → mutually-exclusive-branch pattern that
`.claude/skills/fix-checks/SKILL.md` and `.claude/skills/implement/SKILL.md`
use: a detector runs first, then exactly one terminal branch handles the run.

- `rung-0` → go to **## Rung-0: intent interview**. The repo has no principle
  roots; seed them.
- `refine-workflow` → go to **## Refine-workflow**. Roots exist but there is no
  actionable goal frontier; decompose them.
- `rung-5` → proceed to **## Rung-5: the dialectic engine** below (the existing
  engine body).

"automate" is **not** one of the detected rungs — it is the per-intention
delegability push-down the rung-5 engine performs (see **## Automate
(per-intention push-down)**), per the per-intention-continuum constraint.

## Rung-0: intent interview

The detector returned `rung-0`: the practitioner's repo has **no principle
roots**. Run a Socratic dialectic that produces **root intention nodes**
(`intentions/principle-*.md`).

This same `/align` ran on **this** repository to seed its own principle roots —
`intentions/principle-*.md` (the six roots like
`intentions/principle-show-not-tell.md`). The practitioner is about to do the
same on **their own** repo. Always their own repo, never a toy sandbox.

Run the elicitation as a **normal conversation turn**: pose **one** question at
a time, the practitioner replies in prose, and you capture the free-form answer.
This is open-ended capture, not a menu — do **not** use `AskUserQuestion` for
the elicitation itself.

Reserve `AskUserQuestion` for the **bounded gate only** — e.g. "write these N
principles / refine one / add another / stop." That is the same use
`.claude/skills/new-requirement/SKILL.md` and
`.claude/skills/office-hours/SKILL.md` make of it: option-picks, not free-form
capture.

Persist each resolved principle through the validated write CLI. It reads one
node as JSON and validates it via `writeNode`/`validateNode` (rejecting a bad
enum, a missing statement, or an unsafe id), landing a real
`intentions/principle-*.md` on the practitioner's own repo:

```bash
echo '{"id":"principle-<slug>","statement":"<one-line principle>","owner":"human","status":"codified","parent":null,"rationale":"<why>"}' \
  | npx tsx intentionsutil/scripts/write-node.ts
```

Root shape: `id` is `principle-<slug>`, `parent` is `null`, `owner` is `human`,
`status` is `codified` — matching the existing roots. The CLI is the single
node-authoring gate; never hand-author the markdown.

The elicited free text carries shell metacharacters, so do **not** inline it
unquoted. Either write the JSON to a temp file and pass `--file <path>`, or pipe
it via stdin from a heredoc:

```bash
cat > "$TMPDIR/principle.json" <<'JSON'
{"id":"principle-<slug>","statement":"<one-line principle>","owner":"human","status":"codified","parent":null,"rationale":"<why>"}
JSON
npx tsx intentionsutil/scripts/write-node.ts --file "$TMPDIR/principle.json"
```

Verification for this section is **behavioral / manual**: it requires an
interactive interview and is not auto-verifiable. Do not place it in any
`verify` block.

## Refine-workflow

The detector returned `refine-workflow`: principle roots exist, but there is no
actionable **goal frontier**. Run a bounded **in-thread** decomposition pass —
the same Socratic mechanism as rung-0, but starting from the **existing** roots
— eliciting sub-intentions and concrete goals.

Persist each elicited node as a **child** through the same write CLI, this time
**with** a `parent` (the id of the root or sub-intention it refines) and an
owner/status suited to its depth (a fresh goal leaf is `status: raw`):

```bash
echo '{"id":"<child-slug>","statement":"<one-line goal>","owner":"human","status":"raw","parent":"principle-<slug>","rationale":"<why>"}' \
  | npx tsx intentionsutil/scripts/write-node.ts
```

Then project the result and present the goal frontier as the alignment artifact:

```bash
npx tsx intentionsutil/scripts/frontier-view.ts
```

No standalone decomposer agent is invoked here — the judgment is in-thread.
`align-decomposer` deliberately does **not** decompose a tree. The real artifact
is the child intention/goal nodes plus the projected frontier, on the
practitioner's own repo. A refined goal can then be pushed down per **## Automate
(per-intention push-down)**.

## Rung-5: the dialectic engine

The detector returned `rung-5` (or the scheduled trigger ran unconditionally):
principle roots and a goal frontier exist. Run the dialectic engine below over
the charter-level intent.

## Focus question (on-demand only)

If the user provides input after `/align`, treat it as a **focus question** that
narrows the scope of the entire assessment. Store the focus question and include
it in every phase:

- **Phase 2:** Prepend the focus question to each perspective's input: "Focus
  Question: {question}. Weight your analysis toward answering this question. You
  should still produce your full assessment, but prioritize analysis relevant to
  the focus question."
- **Phase 3:** After merging priority lists, add a dedicated section: "### Focus
  Question Response" that directly answers the user's question based on the
  synthesized findings.
- **Phase 4:** The contrarian should also evaluate whether the synthesis
  adequately answered the focus question.
- **Phase 5:** The re-synthesis "Focus Question Response" section should
  incorporate the contrarian's challenge.
- **Terminal behavior:** present the focus question response as the first
  section, before the synthesis.

If no input is provided, run the full broad assessment. On the scheduled trigger
there is no focus question — always run the full broad assessment.

## The two layers

The engine's roster is two orthogonal layers. Keep them distinct — a structural
role is not a perspective and a perspective is not a structural role.

**Structural roles** (drive the dialectic):

| Role | Agent def | What it does |
|---|---|---|
| Decomposer | `align-decomposer` | At rung-5, reads the intention graph's principle roots and emits the **perspective roster** for the run — which charter-derived perspectives the charter currently calls for. It does not decompose a tree (there is none at rung-5). |
| Consistency-tester | `align-consistency` | The **veto layer**: charter compliance, dependency health, ratchet risk. Produces findings/warnings, not priorities. A critical finding can veto a priority. |
| Delegability-assessor | `align-delegability-assessor` | For one synthetic intention node, runs CAN → SHOULD → consistency and emits one `delegability.eval.v1` object (see `.claude/docs/delegability.md`). |
| Contrarian | `align-contrarian` | One concentrated adversarial pass over the synthesis. |

**Perspectives** (the evaluative lenses):

| Perspective | Agent def | Applied | Produces priorities? |
|---|---|---|---|
| Financial | `align-financial` | **Intrinsic — ALWAYS.** Intrinsic to delegation (estimates the push-down ROI cost terms). | Yes |
| Technical | `align-technical` | **Intrinsic — ALWAYS.** Intrinsic to delegation (estimates `maintenance`, holds the "safe to abandon" veto). | Yes |
| Product | `align-product` | **Charter-derived** — the current materialization the charter calls for today. | Yes |
| Marketing | `align-marketing` | **Charter-derived** — the current materialization the charter calls for today. | Yes |

Product and marketing are the **current** charter-derived materialization, **not
a hardcoded fixed five**. The roster grows and shrinks as the charter's standing
intentions change — the decomposer derives it each run.

**The contrarian-concentration trade.** Phase 4 is a *single* concentrated
adversarial pass (the contrarian), replacing the old 5-way per-persona review.
This is a deliberate concentration: one challenger free of any single lens's
commitments, on the bet that it produces sharper challenges than five reviewers
each defending their own assessment. It is the intended model change, not a
regression.

## Assessment window (both triggers)

The assessment evaluates the active-frontier view and **all work completed since
the last align review** against the intention graph. Compute the window-start
timestamp first:

- **Scheduled trigger:** the review issue anchors the window.

  ```bash
  WINDOW_START=$(.claude/skills/dispatch-propagate/scripts/dispatch-digest-window <repo> <num>)
  ```

  Run with `dangerouslyDisableSandbox: true` — it calls `gh`. It prints the
  `closedAt` of the previous closed `jit:align` issue (steady state), or this
  issue's own `createdAt` when no prior closed review exists (cold start).

- **On-demand trigger:** resolve the align-review repo from the jit config and
  find the newest closed review issue's `closedAt`.

  ```bash
  JIT_JSON=$(.claude/skills/dispatch-propagate/scripts/dispatch-config-load jit)
  ```

  If this prints `no-config` (no `jit.json` present), there is no review history
  to anchor on: set `WINDOW_START` to empty and note **"no prior align review —
  full project history"** in the assessment. Otherwise select the jit whose
  `skill == "align"` and read its `repo`; find the newest closed `jit:align`
  issue in that repo and use its `closedAt` as `WINDOW_START`:

  ```bash
  REVIEW_REPO=$(jq -r '.jits[] | select(.skill == "align") | .repo' <<<"$JIT_JSON" | head -n1)
  if [[ -z "$REVIEW_REPO" ]]; then
    WINDOW_START=""
  else
    WINDOW_START=$(gh issue list --repo "$REVIEW_REPO" --label jit:align \
      --state closed --limit 100 --json closedAt \
      --jq 'max_by(.closedAt) | .closedAt // empty')
  fi
  ```

  Run the `gh` call with `dangerouslyDisableSandbox: true`. If no closed
  `jit:align` issue exists, leave `WINDOW_START` empty and note **"no prior
  align review — full project history"**. If `REVIEW_REPO` is empty (no jit
  entry with `skill == "align"`), treat this the same as the no-config case.

Pass `WINDOW_START` into the perspective context (Phase 1): instruct the
perspectives to evaluate the active-frontier view and **all work completed since
`WINDOW_START`** (or the full project history when there is no prior review)
against the intention graph.

## Phase 1: Gather context

Run the gather-context script. It writes output to a file and prints the path:

```bash
.claude/skills/align/scripts/gather-context.sh
```

This script also calls `fetch-analytics.sh` and `fetch-psi.sh` to append GA4,
Search Console, and PageSpeed Insights data. Run it with
`dangerouslyDisableSandbox: true` — all three scripts make network calls to
Google's OAuth and API hosts, which the sandbox's network namespace isolation
blocks (see `.claude/rules/sandbox.md`).

Read the output file at the printed path. Store the contents as a single block
to pass to each perspective, together with the `WINDOW_START` instruction above.

### Analytics setup

`gather-context.sh` calls `fetch-analytics.sh`, which reads credentials from env
vars at runtime. No credentials are stored in the repo.

**Required OAuth env vars** (all three must be set or the GA4 + Search Console
fetch is skipped):
- `GOOGLE_ANALYTICS_CLIENT_ID` — OAuth 2.0 client id
- `GOOGLE_ANALYTICS_CLIENT_SECRET` — OAuth 2.0 client secret
- `GOOGLE_ANALYTICS_REFRESH_TOKEN` — long-lived refresh token carrying both required scopes

**Config env vars** (optional, with defaults):
- `ALIGN_GA4_PROPERTY_IDS` — comma-separated `app:propertyId` pairs, e.g. `landing:111,budget:222,print:333`. When unset, the GA4 section is skipped (Search Console still runs).
- `ALIGN_SEARCH_CONSOLE_SITE` — Search Console property string. Default: `sc-domain:commons.systems`.

**Exporting from `pass`:** per the pinentry guidance in `.claude/rules/sandbox.md`, warm the gpg-agent cache once in an interactive shell (`pass show google-analytics/client-id`), then export each value:

```bash
export GOOGLE_ANALYTICS_CLIENT_ID="$(pass show google-analytics/client-id)"
export GOOGLE_ANALYTICS_CLIENT_SECRET="$(pass show google-analytics/client-secret)"
export GOOGLE_ANALYTICS_REFRESH_TOKEN="$(pass show google-analytics/refresh-token)"
```

**One-time refresh-token bootstrap:** use the Google OAuth 2.0 Playground at `developers.google.com/oauthplayground`, configured with your own client id/secret, requesting both scopes `https://www.googleapis.com/auth/analytics.readonly` and `https://www.googleapis.com/auth/webmasters.readonly`. See the `fetch-analytics.sh` header comment for the full step-by-step.

**Web Vitals field metrics:** `fetch-analytics.sh` emits a "Web Vitals (field RUM, 30-day)" block per deployed app showing five Core Web Vitals from real users — LCP, CLS, INP, FCP, TTFB — each as an average value and a `% good` rating share over the 30-day window. Data comes from the `web_vitals` GA4 event instrumented in #1493 (web-vitals library → GA4). This requires a **one-time GA4 custom-definitions setup** in each property listed in `ALIGN_GA4_PROPERTY_IDS`: register two event-scoped custom dimensions (`metric_name`, `metric_rating`) and one custom metric (`metric_value`) via the GA4 Admin UI (Admin → Custom definitions). When registering `metric_value`, set **Unit of measurement: Standard** (an integer count — the producer emits `Math.round(value)`, so values are integers) and leave the default **Standard** measurement type so GA4 aggregates it with **SUM**. `fetch-analytics.sh` computes the per-metric average itself as a weighted mean (`([$g[].val] | add) / $total`) over the SUM-aggregated values; do not register `metric_value` with AVG aggregation, which would make the GA4 API return pre-averaged values and produce wrong averages. Registration is not retroactive and GA4 reporting latency is ~24-48 h, so field metrics appear only after both the apps are deployed (emitting `web_vitals` events) and the definitions are registered — and only after that latency window.

**Graceful degradation:** when any required OAuth env var is unset, `fetch-analytics.sh` prints a parenthetical note to stdout (captured in the context file) explaining that credentials are not configured, then exits 0. Perspectives see the explanation in the analytics section rather than a silent empty block. When `ALIGN_GA4_PROPERTY_IDS` is unset but credentials are set, a similar inline note marks the GA4 section as skipped; Search Console data still runs. For the Web Vitals block specifically: if the custom definitions have not been registered yet, the GA4 Data API returns an error and the script surfaces it as an inline `(GA4 runReport failed …)` note; if no `web_vitals` events have landed, the script emits a `(web-vitals field metrics: no web_vitals events … yet)` note. In both cases the script still exits 0.

On the scheduled trigger the analytics env vars are typically unset (no
interactive `pass` warm-up). That is fine — the perspectives note the absence of
analytics data rather than guessing.

### Web performance setup

`gather-context.sh` calls `fetch-psi.sh`, which queries the PageSpeed Insights
API. Unlike the GA4 feed, PSI runs **keyless by default** — no credentials are
required and the section is populated on the scheduled trigger without any
interactive `pass` warm-up.

**Optional API key env var:**
- `PAGESPEED_API_KEY` — raises the PSI rate limit. When unset, the script runs
  keyless (rate-limited but functional). To set it, warm the gpg-agent cache
  once in an interactive shell, then export:

```bash
export PAGESPEED_API_KEY="$(pass show pagespeed/api-key)"
```

**Config env vars** (optional, with defaults):
- `ALIGN_PSI_URLS` — comma-separated list of app URLs to audit. Default:
  `https://commons.systems,https://budget.commons.systems,https://print.commons.systems,https://audio.commons.systems,https://fellspiral.commons.systems`
- `ALIGN_PSI_STRATEGY` — `mobile` (default) or `desktop`.

**Graceful degradation:** per-URL failures or timeouts emit an inline warning
in the context file; the script always exits 0. Perspectives see a partial or
empty section rather than a missing one. Unlike GA4 (which is silently skipped
when credentials are absent), the PSI section is always attempted.

## Phase 1.5: Decompose

Read the decomposer agent definition `.claude/agents/align-decomposer.md` and
launch it (Agent tool, `subagent_type: "general-purpose"`, the def's prompt
inline) over the intention graph's principle roots. At rung-5 it does not decompose a tree — it reads the
intention graph's principle roots and emits the **perspective roster**:
the charter-derived perspectives the charter calls for today.

From the roster, decide which perspective agents to load for Phase 2:

- **ALWAYS load the intrinsic perspectives** — `align-financial` and
  `align-technical`. They are intrinsic to delegation, not charter-derived; the
  decomposer does not list them, but they apply every run regardless.
- **Load each charter-derived perspective the roster names IF an
  `align-<perspective>` agent def exists** (e.g. `product` →
  `.claude/agents/align-product.md`, `marketing` →
  `.claude/agents/align-marketing.md`).
- **For any named perspective with NO `align-<perspective>` agent def**, do
  **not** block the run. Surface it as a **tooling-goal** —
  "define `align-<perspective>` perspective" — and carry it into the
  recommendations' "New Issues to File" (see Recommendations). This is the
  self-growing frontier: a named-but-undefined perspective becomes work to
  define it, not a silent gap.

Today the charter-derived materialization is product + marketing. Frame it that
way — not as a hardcoded five.

## Phase 2: Independent assessments

Read each loaded perspective's agent definition and the consistency-tester's:
- the intrinsic perspectives: `.claude/agents/align-financial.md`,
  `.claude/agents/align-technical.md`
- each charter-derived perspective the decomposer's roster named and that has a
  def (today: `.claude/agents/align-product.md`,
  `.claude/agents/align-marketing.md`)
- the consistency-tester: `.claude/agents/align-consistency.md`

Launch them **all in parallel** in a single message using the Agent tool
(`subagent_type: "general-purpose"`, each def's prompt inline). Each receives:
1. Its perspective/role prompt (from the agent definition file)
2. The full gathered context from Phase 1 (including the `WINDOW_START`
   instruction: evaluate work completed since the last align review against the
   charter)
3. Instruction to produce output in the exact format specified in the agent
   definition
4. The focus question, prepended per the Focus question section (on-demand only)

The marketing perspective's prompt additionally includes: "Read
`.claude/skills/brand/SKILL.md` and use it as reference for your Brand Review
section."

The delegability-assessor does **not** run in this batch — it runs in Phase 3
over the synthesized priorities, fed the financial, technical, and consistency
outputs gathered here.

Wait for all to complete. Store each agent's output.

## Phase 3: Synthesize

Process outputs in this order. Before synthesizing, verify each agent produced
valid output in the expected format. If any agent output is missing, empty, or
does not contain the required sections, note this explicitly in the synthesis
and adjust the merging weights accordingly.

1. **Consistency-tester first (the veto layer).** Read the consistency-tester
   output. Extract all findings and warnings. Any Critical-severity finding can
   veto a priority. Identify where consistency warnings contradict priorities
   from the perspectives, and document each conflict.

2. **Merge priority lists.** Combine the priority lists from the loaded
   priority-producing perspectives (financial, technical, product, marketing)
   using weighted ranking:
   - Items appearing in 3+ lists rank highest
   - Items appearing in 2 lists rank by combined scores
   - Items in 1 list rank by that perspective's score, discounted
   - Consistency findings adjust rankings: a Critical finding vetoes the
     priority (removes from list), a Warning adds a note
   - **Tier-1 protection:** Author-usage work (new features, new domains,
     performance, usability) is always a valid priority per the charter's tier
     progression. The synthesis must not deprioritize tier-1 work based on lack
     of external engagement — tier 1 is the prerequisite for everything else,
     not something to freeze while waiting for tier 2. Work that serves multiple
     tiers simultaneously (e.g., performance improves both author usability and
     distribution quality; the skill system is both the author's tool and a
     practitioner artifact) is high leverage and should be recognized as such.

   This produces the **merged top-priority list**.

3. **Delegability over the merged top-priority set.** For each priority in the
   merged list, construct a synthetic intention node and run the
   delegability-assessor over it. Read
   `.claude/agents/align-delegability-assessor.md` and launch one assessor per
   priority (Agent tool, `subagent_type: "general-purpose"`, the def's prompt
   inline). Build each synthetic node as:

   | Node field | Source |
   |---|---|
   | `statement` | the priority's one-line "What". |
   | `rationale` | the priority's "Why" (charter/audience trace). |
   | `owner` | default `human` (a top-level charter priority is human-decided by default) unless the synthesis states it is already AI- or procedure-owned. |
   | `success_signal` | the priority's "done-when / signal" (the intention node's `success_signal` field). |
   | `status` | `refining` (synthetic stand-in; no transitions are persisted). |
   | `node_id` | a synthetic slug, e.g. `rung5-<short-slug>` (not persisted). |
   | `clarifications[]`, `tooling_goals[]` | empty (no tree to read). |

   Feed each assessor the perspective estimates the
   `delegability.eval.v1` contract consumes, drawn from Phase 2:
   - **FINANCIAL inputs** (`build`, `run`, `manual_cost`, `frequency`) ← the
     `align-financial` output already gathered in Phase 2.
   - **TECHNICAL inputs** (`maintenance`, plus the "safe to abandon" veto) ← the
     `align-technical` output from Phase 2.
   - **Consistency veto** ← the consistency-tester output from step 1.

   Each assessor emits exactly one `delegability.eval.v1` object per the contract
   in `.claude/docs/delegability.md`. Collect them; they feed the Delegability
   findings section of the recommendations, and any emitted `tooling_goal`
   objects feed "New Issues to File".

4. **Produce unified synthesis.** For each priority in the merged list:
   - Which perspectives advocated for it and why
   - Which perspectives opposed or didn't mention it
   - Consistency findings that apply
   - Charter alignment assessment
   - Its delegability finding (recommended owner + verdict)
   - Rationale for its final ranking

## Phase 4: Contrarian challenge

Read `.claude/agents/align-contrarian.md` and launch a **single**
`align-contrarian` adversarial pass over the synthesis (Agent tool,
`subagent_type: "general-purpose"`, the def's prompt inline). This **replaces**
the old 5-way per-persona review — one concentrated challenger instead of five
reviewers (the concentration trade described in The two layers).

The contrarian receives:
1. The unified synthesis from Phase 3 (priority list plus rationale)
2. The underlying perspective and consistency findings the synthesis was built
   from (so it can see which priorities rest on genuine cross-lens agreement
   versus shallow agreement no lens probed)

It produces a structured challenge: **challenged priorities** (strongest
counter-argument per priority), **unexamined assumptions**, and **consensus blind
spots** — ranked by how load-bearing the challenge is. On-demand, it also
evaluates whether the synthesis answered the focus question.

Wait for it to complete.

## Phase 5: Re-synthesize

Take the Phase 3 synthesis and the Phase 4 contrarian challenge (plus any veto
surfaced by the consistency layer). Produce an updated synthesis that
incorporates the challenge:

1. **Updated unified priority list.** Re-rank priorities in light of the
   contrarian's challenge. Where a ranking changed from Phase 3, note which
   challenge caused the change and why. Drop or demote any priority whose
   strongest counter-argument holds; keep any that survive the challenge, noting
   why they hold.
2. **Consolidated gap analysis.** Merge all perspectives' Gap Analysis outputs
   from Phase 2 into two groups:
   - **Missing issues** — issues that should be on the backlog but aren't. Note
     which perspectives flagged each and through what lens.
   - **Scope refinements** — existing issues that need scope changes. Note which
     perspectives flagged each.
3. **Unresolved disagreements.** List priority-affecting disagreements that
   persist after incorporating the challenge. For each:
   - The disagreement
   - Which perspectives are on each side
   - What information would resolve it

## Backlog issue-triage (both triggers)

Enumerate every **open** issue in `natb1/commons.systems` carrying **neither**
`help wanted` **nor** any `jit:*` label — the un-queued, non-reminder backlog:

```bash
gh issue list --repo "$REVIEW_REPO" --state open --json number,title,labels,body --limit 200
```

Run with `dangerouslyDisableSandbox: true`. Filter out any issue whose labels
include `help wanted` or a name starting with `jit:`. For each remaining issue,
recommend **exactly one** of, each with a one-line rationale:

- **add `help wanted`** — the issue is well-scoped and ready; promote it to the
  dispatch queue.
- **update the issue body** — the issue matters but its scope, framing, or
  acceptance criteria need revision before it is queue-ready.
- **close as not planned** — the issue no longer fits the charter/roadmap, is
  obsolete, or is a duplicate.

Triage produces **recommendations only**. It never mutates issues directly on
either trigger. Present the results as a table: issue number, title,
recommendation, rationale.

## Recommendations (both triggers)

From the Phase 5 synthesis, produce recommended edits. These are the deliverable
content for both the on-demand proposed-edits step and the scheduled report.

### 1. Frontier & strategy recommendations
Recommended re-prioritizations of the active frontier (which feed the *generated*
active-frontier view — there is no committed roadmap file to edit), plus proposed
edits to the `strategy-*` doctrine nodes when the prioritization or domain-selection
doctrine itself shifts:
- Frontier re-prioritizations — the new ranked priority set with each priority's
  why (charter/audience trace), audience tier, distribution, done-when, and signal.
- Strategy-node edits — proposed changes to `intentions/strategy-progressive-validation.md`
  or `intentions/strategy-domain-selection.md`, only when doctrine has shifted.

(Drop the superseded "Current assessment" deliverable — the recurring review re-derives
it each cycle — and the "Feedback loop" deliverable — the signal arm is tracked separately.)

### 2. Proposed Charter Revisions
If any perspective or the consistency-tester identified charter sections that
need updating, list specific proposed edits with rationale. If none, state "No
charter revisions proposed."

### 3. Existing Issues to Update
For each existing issue that needs scope refinement (from gap analysis and
synthesis):
- Issue number
- Current scope summary
- Proposed change
- Rationale

### 4. New Issues to File
For each gap identified (issues that should exist but don't):
- Proposed title
- Body draft
- Labels
- Which perspectives flagged it
- Rationale

Two sources feed this list beyond the perspectives' gaps:
- **Decomposer missing-perspective tooling-goals** — each "define
  `align-<perspective>` perspective" entry the decomposer surfaced in Phase 1.5.
- **Delegability tooling-goals** — each non-null `tooling_goal` object the
  delegability-assessor emitted in Phase 3 (the investment that would move a
  priority's delegation boundary down). File each as a proposed issue.

### 5. Delegability findings
For each priority in the merged top-priority set, report its
`delegability.eval.v1` result from Phase 3:
- Priority (the `statement`)
- `recommended_owner` (`human` / `ai` / `procedure`) and `can_category`
- `roi_verdict` and the one-line `roi_rationale`
- any `veto` that fired (consistency or technical), and any `tooling_goal`
  (also carried into New Issues to File above)

## Terminal behavior

### On-demand trigger

**Stop for user feedback.** Present these sections to the user:
1. The focus question response (on-demand only), if a focus question was given
2. Updated synthesis (the re-synthesized priority list from Phase 5)
3. Unresolved disagreements (from Phase 5)
4. Consolidated gap analysis (from Phase 5)

**STOP. Ask the user for feedback before proceeding.** Do not continue until the
user responds.

**Then present the recommendations.** After receiving user feedback, incorporate
it and present the recommendations above (Frontier & strategy recommendations,
Proposed Charter Revisions, Existing Issues to Update, New Issues to File,
Delegability findings), **plus** the backlog issue-triage table as an added section. No issue
is closed; nothing is posted to GitHub.

### Scheduled trigger

**No user-feedback stop.** Compose the full report:
- the assessment window covered (`WINDOW_START` → now, or "full project history"
  on cold start);
- the re-synthesized priorities (Phase 5);
- the recommended frontier & strategy updates, proposed charter revisions, and
  existing-issue / new-issue recommendations, and the Delegability findings
  (Recommendations §1–5);
- the backlog issue-triage table.

Write the report to `$CLAUDE_JOB_DIR/tmp/align-report.md` — item titles and
issue bodies may carry shell metacharacters, so write the body to the file and
never inline it into a command. Then post it as a comment on the review issue
and close the issue:

```bash
mkdir -p "$CLAUDE_JOB_DIR/tmp"
gh issue comment <num> --repo <repo> --body-file "$CLAUDE_JOB_DIR/tmp/align-report.md"
gh issue close <num> --repo <repo>
```

Run both with `dangerouslyDisableSandbox: true` — they call `gh`. Closing the
review issue anchors the next cadence cycle: per the JIT engine, the next
`jit:align` review issue is created `remindAfterClose` (7d) after this
`closedAt`.

The posted comment is a GitHub-rendered artifact: per
`.claude/rules/issue-references.md`, keep bare `#N` references and append **no**
`References:` list. Never place a closing keyword (`close`/`fix`/`resolve` and
their variants) adjacent to any `#N` in the report.

Then the session ends — the posted report is the office-hours session's output.

## Automate (per-intention push-down)

"Automate" is the delegability push-down applied **per intention**, not a global
rung. It runs on the real components the rung-5 engine already uses — no net-new
machinery.

- Run `align-delegability-assessor`
  (`.claude/agents/align-delegability-assessor.md` +
  `.claude/docs/delegability.md`), already invoked in Phase 3, over the frontier
  goals.
- For any goal whose `delegability.eval.v1` returns
  `recommended_owner: procedure` (or `ai`) with a push-down `roi_verdict`, hand
  it to the dispatch chain via `intention-emit` → `/file-issue`
  (`.claude/skills/intention-emit/SKILL.md`). The codification then runs through
  the normal `plan → implement → qa → review` dispatch chain.
- Attach `signal.eval.v1` success signals via `align-signal-assessor`
  (`.claude/agents/align-signal-assessor.md` +
  `.claude/docs/signal-identification.md`).

The rung model is **not** the dispatch phase chain. The rungs are alignment
depths; the phase chain is the dispatch workflow a codified goal runs through —
see the `### Phase model` section of
`.claude/skills/dispatch-propagate/reference.md`. Pushing a goal down emits an
issue that *enters* the phase chain; it does not move the project to a new rung.

The real artifact is the filed issues and the recorded push-down evals. The
refine-workflow branch references this subsection too — a refined goal can be
pushed down — but it lives here with the rung-5 engine.

## Migrating from /roadmap (deployed instances)

`/align` was previously named `/roadmap`; the rename shipped in #2370 (PR
#2392, already merged). The in-repo example config
(`.claude/skills/dispatch-propagate/scripts/jit.example.json`) and this skill
already use the new values — `"skill": "align"` and `"label": "jit:align"`.

A deployed instance's live `jit.json` is **not tracked in this repo**, so the
rename does not propagate to it automatically. Any deployed instance whose
live config still carries the old values will break at its next scheduled JIT
run: `dispatch-jit-engine` creates a `jit:roadmap`-labeled issue (or finds one
already open) and `dispatch-jit-reminder` invokes `/roadmap`, a skill that no
longer exists. Operators of such instances must,
if they have not already:

1. In their live `jit.json` (or equivalent deployed config), change
   `"skill": "roadmap"` to `"skill": "align"` and `"label": "jit:roadmap"` to
   `"label": "jit:align"`.
2. Close or relabel to `jit:align` any open `jit:roadmap` issues. Closing
   anchors the `remindAfterClose` timer so the next `jit:align` issue is
   created after the configured interval; relabeling to `jit:align` lets the
   existing issue be picked up immediately on the next dispatch tick.
