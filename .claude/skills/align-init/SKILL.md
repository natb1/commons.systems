---
name: align-init
description: Fork/plugin-consumer entrypoint for the intention-graph harness — on-demand, `/align-init` orients the practitioner (virtues, strategies, tactics, delegations), validates the tooling deployment, reviews inherited virtue roots via the Socratic rung-0 interview, and hands off to `/align-strategy`; the scheduled (align jit) trigger runs the rung-5 dialectic engine unchanged (structural roles drive the dialectic, perspectives feed it — it synthesizes priorities, a contrarian challenges, it re-synthesizes, triages the backlog, and produces roadmap recommendations plus per-priority delegability findings) and posts a report that closes the review issue.
user-invocable: true
---

# Align Init

`/align-init` is the entrypoint for forks and consuming repos, and the home of
the scheduled periodic review. It replaces the legacy `/align` skill:

- The legacy **rung-0** intent interview carries forward into the on-demand
  virtue-review step (Step 3 below).
- The legacy **refine-workflow** branch is superseded by `/align-strategy`
  (`.claude/skills/align-strategy/SKILL.md`) — decomposing roots into
  persistent goals is now the strategy interview's job, reached via Step 4.
- The legacy **rung-5 dialectic engine** carries over unchanged as the
  scheduled periodic review, invoked by the `align` jit trigger.

The skill runs on one of two **triggers**:

- **On-demand** — a human runs `/align-init` (no arguments). Run the
  four-step fork-entrypoint flow: orient, validate deployment, review
  virtues, delegate to `/align-strategy`. Nothing is posted to GitHub; no
  issue is created or closed anywhere in this flow.
- **Scheduled** — the JIT engine runs this skill against a `jit:align` review
  issue via the skill-running jit-reminder path (`dispatch-jit-reminder`).
  This is an **office-hours session**, like every jit summary session: after
  claiming the issue (`Status` → `In Progress`), `dispatch-jit-reminder`
  invokes this skill with the issue's `<repo> <num>` as its arguments and
  lets it own the rest of the session. The scheduled trigger **always runs
  the rung-5 dialectic engine** — a background jit job has no human to
  interview. There is no user-feedback stop: the skill posts the full report
  as a comment on the review issue and closes it, anchoring the next cadence
  cycle.

Run every `gh`-calling command, and every script that calls `gh` or `curl`,
with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## Trigger detection

The skill takes optional arguments. Detect the trigger from them:

- **Two arguments** where the first matches `owner/repo` (a `/`-containing
  slug) and the second is digits (`<repo> <num>`) → **scheduled** trigger
  against that `jit:align` review issue. This is how `dispatch-jit-reminder`
  invokes the skill (same contract as `/digest`). Before doing anything else,
  verify the issue actually carries a `jit:align` label:

  ```bash
  gh issue view <num> --repo <repo> --json labels
  ```

  Run with `dangerouslyDisableSandbox: true`. If the issue's labels do
  **not** include `jit:align`, **STOP** with a clear error — this skill must
  not post to or close an issue that is not an align-review jit issue.

  Then go to **## Rung-5: the dialectic engine**.

- **Otherwise** → **on-demand** trigger. Run the fork-entrypoint flow below
  (Steps 1–4). Any argument text is treated as context for the virtue
  interview, not as a mode switch.

## Step 1 — Orient

**First, verify the checkout is fresh.** This flow reads at `origin/main` and
diffs against it without fetching first, so a stale local `origin/main` would
mislead the orientation. Before anything else, run:

```bash
.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh
```

A non-zero exit means the checkout is stale **or** the `git fetch` itself
failed; either way, stop and freshen (`git fetch origin main && git merge
origin/main`) before continuing. This applies only to the **on-demand** trigger
flow (Steps 1–4); the scheduled/jit trigger runs on a router-provisioned
worktree already freshened via a different path.

Give the practitioner a one-screen description of what they have deployed: a
harness for long-horizon autonomous workflows built around the **intention
graph** — the versioned store under `intentions/` whose node kinds are
defined by the `intentions/kind-*.md` nodes:

- **Virtues** (`virtue-*`) — permanent dispositions; the roots of the graph.
  They never complete; everything else justifies itself against them.
- **Strategies** (`strategy-*`) — persistent, condition-bearing,
  signal-carrying goals. A strategy records the author's intent, the
  circumstances it is contingent on (`attributes.conditions`), and the
  `success_signal` that would validate it.
- **Tactics** (`tactic-*`) — transient, completable, delegable work. Each
  claude-eligible tactic carries a full clean-session plan in its node body
  and is walked through execution phases by the dispatch router.
- **Delegations** — attachment records: which work is handed to whom
  (human → AI → procedure), with the divergence/irreversibility axes that
  bound capture risk.

The router reads the graph at `origin/main` and schedules eligible tactics
autonomously; the align skill family (`/align-init`, `/align-strategy`,
`/align-tactics`) is the human interface that populates it. Keep the
orientation to one screen — the schema reference is
`packages/intentionsutil/SCHEMA.md` for anyone who wants depth.

## Step 2 — Validate deployment

Confirm the tooling actually works in this checkout before interviewing
anyone. All three checks are local — no `gh`, no network:

```bash
# intentionsutil installed and its tests pass
npm test --prefix packages/intentionsutil

# store readable and the graph clean (validateGraph: dangling refs, cycles, schema)
npx tsx packages/intentionsutil/scripts/validate-graph.ts

# router heartbeat wired (Linux deployments; the daemon hosts the dispatch tick)
systemctl --user is-active dispatch-claude-daemon.service
```

Failure handling, per the clear-errors rule (`.claude/rules/code-style.md`):

- **Tests fail or `npx tsx` cannot resolve** — the workspace is not
  installed; have the practitioner run `npm ci` at the repo root and rerun.
- **`validate-graph.ts` errors** — a missing or unreadable `intentions/`
  directory, or a schema violation. Report the exact error; do not proceed
  to the virtue interview over a broken store.
- **Daemon inactive** — the router will never tick, so recorded work will
  sit unscheduled. Point the practitioner at the home-manager module
  (`nix/home/claude-code.nix`, instance template
  `examples/office-hours-nate/flake.nix`) and continue — the interview
  itself does not need the daemon, but say clearly that nothing dispatches
  until the heartbeat is wired.

## Step 3 — Review virtues

Forks begin with the upstream repo's virtue roots — inherited virtues and
strategies are assumed preserved. Detect whether any roots exist (the
carried-forward rung-0 detection):

```bash
RUNG=$(npx tsx packages/intentionsutil/scripts/detect-rung.ts)
```

This is a local read of the intention graph — no `gh`, no network — so it
runs in-sandbox. It prints a rung token; `rung-0` means **no virtue roots
exist** (bare repo).

- **`rung-0`** — seed the roots from scratch via the intent interview below.
- **Anything else** — roots exist. Present each inherited root
  (`intentions/virtue-*.md`: id and one-line statement), confirm the
  practitioner recognizes and keeps them, then run the same interview for
  **additional or ambiguous** virtues — dispositions the fork holds that the
  upstream roots do not capture, or inherited statements the practitioner
  reads differently than upstream intended.

### The intent interview (carried rung-0 flow)

Run the elicitation as a **normal conversation turn**: pose **one** question
at a time — Socratic, open-ended — the practitioner replies in prose, and
you capture the free-form answer. This is open-ended capture, not a menu —
do **not** use `AskUserQuestion` for the elicitation itself.

Reserve `AskUserQuestion` for the **bounded gate only** — e.g. "write these
N virtues / refine one / add another / stop." That is the same use
`.claude/skills/new-requirement/SKILL.md` and
`.claude/skills/office-hours/SKILL.md` make of it: option-picks, not
free-form capture.

Persist each resolved virtue through the validated write CLI. It reads one
node as JSON and validates it via `writeNode`/`validateNode` (rejecting a
bad enum, a missing statement, a missing `kind`, or an unsafe id), landing a
real `intentions/virtue-*.md` on the practitioner's own repo. The elicited
free text carries shell metacharacters, so never inline it unquoted — write
the JSON to a temp file and pass `--file`, or pipe it via a heredoc:

```bash
cat > "$TMPDIR/virtue.json" <<'JSON'
{"id":"virtue-<slug>","kind":"virtue","statement":"<one-line virtue>","owner":"human","status":"codified","parent":null,"rationale":"<why>"}
JSON
npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/virtue.json"
```

Root shape: `id` is `virtue-<slug>`, `kind` is `virtue`, `parent` is `null`,
`owner` is `human`, `status` is `codified` — matching the existing roots.
The CLI is the single node-authoring gate; never hand-author the markdown.

**Commit and push.** Land the interview's nodes through `graph-commit` — the
only write path for graph state, never a hand-rolled `git commit`/`git push`
(same discipline as `/align-strategy` Step 5):

```bash
packages/intentionsutil/scripts/graph-commit -m 'graph: seed virtue roots' virtue-<slug> [<virtue-id> ...]
```

Run with `dangerouslyDisableSandbox: true` (it pushes and polls checks). If
it exits 1 having printed a parking message, tell the practitioner and stop
— do not retry automatically.

Verification for this step is **behavioral / manual**: it requires an
interactive interview and is not auto-verifiable. Do not place it in any
`verify` block.

## Step 4 — Delegate to `/align-strategy`

Hand off to `/align-strategy` (invoke it via the Skill tool, carrying any
requirement text the practitioner has already voiced) — recording strategies
under a dialectic interview is that skill's job, not this one's. See
`.claude/skills/align-strategy/SKILL.md`.

When it returns, confirm at least one **new or updated** strategy exists —
an `intentions/strategy-*.md` created or modified during this session (e.g.
`git log --oneline -- intentions/` since the session started, or compare
`git diff origin/main --stat -- intentions/`). If none exists, tell the
practitioner plainly: **the dispatch router has no work until a strategy is
recorded** — the graph has roots but no goal for `/align-tactics` to
decompose, so nothing will ever become schedulable.

That ends the on-demand flow. No GitHub issue is created anywhere in it.

## Rung-5: the dialectic engine

The scheduled trigger runs the engine unconditionally: virtue roots and a
goal frontier exist, and there is no human to interview. Everything below is
the carried-forward legacy engine — a decompose → assess → synthesize →
challenge → re-synthesize loop over a set of evaluative perspectives that
triages the open backlog and produces recommended re-prioritizations, edits
to the `strategy-*` doctrine nodes, and edits to the issue backlog.

The engine keeps **two orthogonal layers** and never conflates them:

- **Structural roles** drive the dialectic itself — decomposer,
  consistency-tester, delegability-assessor, contrarian. They are universal:
  they apply regardless of what the project is.
- **Perspectives** are the evaluative lenses the roles run over — the
  intrinsic financial and technical perspectives (always applied) plus the
  charter-derived perspectives the charter currently calls for (today:
  product and marketing).

The same orthogonality runs through the two axes the engine reasons about,
which must never be conflated:

- **Decomposition** — intention → sub-intention → goal. Breaking a broad
  intention into narrower pieces until each is concrete enough to act on.
- **Delegation** — human → AI → procedure. A continuum applied per
  intention, never a single global rung the whole tree sits on.

The engine operates at the project's **charter-level intent**. It reads the
intention graph's virtue roots (`intentions/virtue-*.md`, defined by the
`kind-*` nodes), the `strategy-*` nodes, the active-frontier view (generated
from the intention graph), all work completed since the last review, and
analytics — the same inputs the assessment has always used.

## The two layers

**Structural roles** (drive the dialectic):

| Role | Agent def | What it does |
|---|---|---|
| Decomposer | `align-decomposer` | At rung-5, reads the intention graph's virtue roots and emits the **perspective roster** for the run — which charter-derived perspectives the charter currently calls for. It does not decompose a tree (there is none at rung-5). |
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

Product and marketing are the **current** charter-derived materialization,
**not a hardcoded fixed five**. The roster grows and shrinks as the
charter's standing intentions change — the decomposer derives it each run.

**The contrarian-concentration trade.** Phase 4 is a *single* concentrated
adversarial pass (the contrarian), replacing the old 5-way per-persona
review. This is a deliberate concentration: one challenger free of any
single lens's commitments, on the bet that it produces sharper challenges
than five reviewers each defending their own assessment. It is the intended
model change, not a regression.

## Assessment window

The assessment evaluates the active-frontier view and **all work completed
since the last align review** against the intention graph. The review issue
anchors the window — compute the window-start timestamp first:

```bash
WINDOW_START=$(.claude/skills/dispatch-propagate/scripts/dispatch-digest-window <repo> <num>)
```

Run with `dangerouslyDisableSandbox: true` — it calls `gh`. It prints the
`closedAt` of the previous closed `jit:align` issue (steady state), or this
issue's own `createdAt` when no prior closed review exists (cold start). On
cold start, note **"no prior align review — full project history"** in the
assessment.

Pass `WINDOW_START` into the perspective context (Phase 1): instruct the
perspectives to evaluate the active-frontier view and **all work completed
since `WINDOW_START`** (or the full project history when there is no prior
review) against the intention graph.

## Phase 1: Gather context

Run the gather-context script. It writes output to a file and prints the
path:

```bash
.claude/skills/align-init/scripts/gather-context.sh
```

This script also calls `fetch-analytics.sh` and `fetch-psi.sh` to append
GA4, Search Console, and PageSpeed Insights data. Run it with
`dangerouslyDisableSandbox: true` — all three scripts make network calls to
Google's OAuth and API hosts, which the sandbox's network namespace
isolation blocks (see `.claude/rules/sandbox.md`).

Read the output file at the printed path. Store the contents as a single
block to pass to each perspective, together with the `WINDOW_START`
instruction above.

### Analytics setup

`gather-context.sh` calls `fetch-analytics.sh`, which reads credentials from
env vars at runtime. No credentials are stored in the repo.

**Required OAuth env vars** (all three must be set or the GA4 + Search
Console fetch is skipped):
- `GOOGLE_ANALYTICS_CLIENT_ID` — OAuth 2.0 client id
- `GOOGLE_ANALYTICS_CLIENT_SECRET` — OAuth 2.0 client secret
- `GOOGLE_ANALYTICS_REFRESH_TOKEN` — long-lived refresh token carrying both required scopes

**Config env vars** (optional, with defaults):
- `ALIGN_GA4_PROPERTY_IDS` — comma-separated `app:propertyId` pairs, e.g. `landing:111,budget:222,print:333`. When unset, the GA4 section is skipped (Search Console still runs).
- `ALIGN_SEARCH_CONSOLE_SITE` — Search Console property string. Default: `sc-domain:commons.systems`.

**Exporting from `pass`:** per the pinentry guidance in
`.claude/rules/sandbox.md`, warm the gpg-agent cache once in an interactive
shell (`pass show google-analytics/client-id`), then export each value:

```bash
export GOOGLE_ANALYTICS_CLIENT_ID="$(pass show google-analytics/client-id)"
export GOOGLE_ANALYTICS_CLIENT_SECRET="$(pass show google-analytics/client-secret)"
export GOOGLE_ANALYTICS_REFRESH_TOKEN="$(pass show google-analytics/refresh-token)"
```

**One-time refresh-token bootstrap:** use the Google OAuth 2.0 Playground at
`developers.google.com/oauthplayground`, configured with your own client
id/secret, requesting both scopes
`https://www.googleapis.com/auth/analytics.readonly` and
`https://www.googleapis.com/auth/webmasters.readonly`. See the
`fetch-analytics.sh` header comment for the full step-by-step.

**Web Vitals field metrics:** `fetch-analytics.sh` emits a "Web Vitals
(field RUM, 30-day)" block per deployed app showing five Core Web Vitals
from real users — LCP, CLS, INP, FCP, TTFB — each as an average value and a
`% good` rating share over the 30-day window. Data comes from the
`web_vitals` GA4 event instrumented in #1493 (web-vitals library → GA4).
This requires a **one-time GA4 custom-definitions setup** in each property
listed in `ALIGN_GA4_PROPERTY_IDS`: register two event-scoped custom
dimensions (`metric_name`, `metric_rating`) and one custom metric
(`metric_value`) via the GA4 Admin UI (Admin → Custom definitions). When
registering `metric_value`, set **Unit of measurement: Standard** (an
integer count — the producer emits `Math.round(value)`, so values are
integers) and leave the default **Standard** measurement type so GA4
aggregates it with **SUM**. `fetch-analytics.sh` computes the per-metric
average itself as a weighted mean (`([$g[].val] | add) / $total`) over the
SUM-aggregated values; do not register `metric_value` with AVG aggregation,
which would make the GA4 API return pre-averaged values and produce wrong
averages. Registration is not retroactive and GA4 reporting latency is
~24-48 h, so field metrics appear only after both the apps are deployed
(emitting `web_vitals` events) and the definitions are registered — and only
after that latency window.

**Graceful degradation:** when any required OAuth env var is unset,
`fetch-analytics.sh` prints a parenthetical note to stdout (captured in the
context file) explaining that credentials are not configured, then exits 0.
Perspectives see the explanation in the analytics section rather than a
silent empty block. When `ALIGN_GA4_PROPERTY_IDS` is unset but credentials
are set, a similar inline note marks the GA4 section as skipped; Search
Console data still runs. For the Web Vitals block specifically: if the
custom definitions have not been registered yet, the GA4 Data API returns an
error and the script surfaces it as an inline `(GA4 runReport failed …)`
note; if no `web_vitals` events have landed, the script emits a
`(web-vitals field metrics: no web_vitals events … yet)` note. In both cases
the script still exits 0.

On the scheduled trigger the analytics env vars are typically unset (no
interactive `pass` warm-up). That is fine — the perspectives note the
absence of analytics data rather than guessing.

### Web performance setup

`gather-context.sh` calls `fetch-psi.sh`, which queries the PageSpeed
Insights API. Unlike the GA4 feed, PSI runs **keyless by default** — no
credentials are required and the section is populated on the scheduled
trigger without any interactive `pass` warm-up.

**Optional API key env var:**
- `PAGESPEED_API_KEY` — raises the PSI rate limit. When unset, the script
  runs keyless (rate-limited but functional). To set it, warm the gpg-agent
  cache once in an interactive shell, then export:

```bash
export PAGESPEED_API_KEY="$(pass show pagespeed/api-key)"
```

**Config env vars** (optional, with defaults):
- `ALIGN_PSI_URLS` — comma-separated list of app URLs to audit. Default:
  `https://commons.systems,https://budget.commons.systems,https://print.commons.systems,https://audio.commons.systems,https://fellspiral.commons.systems`
- `ALIGN_PSI_STRATEGY` — `mobile` (default) or `desktop`.

**Graceful degradation:** per-URL failures or timeouts emit an inline
warning in the context file; the script always exits 0. Perspectives see a
partial or empty section rather than a missing one. Unlike GA4 (which is
silently skipped when credentials are absent), the PSI section is always
attempted.

## Phase 1.5: Decompose

Read the decomposer agent definition `.claude/agents/align-decomposer.md`
and launch it (Agent tool, `subagent_type: "general-purpose"`, the def's
prompt inline) over the intention graph's virtue roots. At rung-5 it does
not decompose a tree — it reads the intention graph's virtue roots and emits
the **perspective roster**: the charter-derived perspectives the charter
calls for today.

From the roster, decide which perspective agents to load for Phase 2:

- **ALWAYS load the intrinsic perspectives** — `align-financial` and
  `align-technical`. They are intrinsic to delegation, not charter-derived;
  the decomposer does not list them, but they apply every run regardless.
- **Load each charter-derived perspective the roster names IF an
  `align-<perspective>` agent def exists** (e.g. `product` →
  `.claude/agents/align-product.md`, `marketing` →
  `.claude/agents/align-marketing.md`).
- **For any named perspective with NO `align-<perspective>` agent def**, do
  **not** block the run. Surface it as a **tooling-goal** — "define
  `align-<perspective>` perspective" — and carry it into the
  recommendations' "New Issues to File" (see Recommendations). This is the
  self-growing frontier: a named-but-undefined perspective becomes work to
  define it, not a silent gap.

Today the charter-derived materialization is product + marketing. Frame it
that way — not as a hardcoded five.

## Phase 2: Independent assessments

Read each loaded perspective's agent definition and the
consistency-tester's:
- the intrinsic perspectives: `.claude/agents/align-financial.md`,
  `.claude/agents/align-technical.md`
- each charter-derived perspective the decomposer's roster named and that
  has a def (today: `.claude/agents/align-product.md`,
  `.claude/agents/align-marketing.md`)
- the consistency-tester: `.claude/agents/align-consistency.md`

Launch them **all in parallel** in a single message using the Agent tool
(`subagent_type: "general-purpose"`, each def's prompt inline). Each
receives:
1. Its perspective/role prompt (from the agent definition file)
2. The full gathered context from Phase 1 (including the `WINDOW_START`
   instruction: evaluate work completed since the last align review against
   the charter)
3. Instruction to produce output in the exact format specified in the agent
   definition

The marketing perspective's prompt additionally includes: "Read
`.claude/skills/brand/SKILL.md` and use it as reference for your Brand
Review section."

The delegability-assessor does **not** run in this batch — it runs in Phase
3 over the synthesized priorities, fed the financial, technical, and
consistency outputs gathered here.

Wait for all to complete. Store each agent's output.

## Phase 3: Synthesize

Process outputs in this order. Before synthesizing, verify each agent
produced valid output in the expected format. If any agent output is
missing, empty, or does not contain the required sections, note this
explicitly in the synthesis and adjust the merging weights accordingly.

1. **Consistency-tester first (the veto layer).** Read the
   consistency-tester output. Extract all findings and warnings. Any
   Critical-severity finding can veto a priority. Identify where consistency
   warnings contradict priorities from the perspectives, and document each
   conflict.

2. **Merge priority lists.** Combine the priority lists from the loaded
   priority-producing perspectives (financial, technical, product,
   marketing) using weighted ranking:
   - Items appearing in 3+ lists rank highest
   - Items appearing in 2 lists rank by combined scores
   - Items in 1 list rank by that perspective's score, discounted
   - Consistency findings adjust rankings: a Critical finding vetoes the
     priority (removes from list), a Warning adds a note
   - **Tier-1 protection:** Author-usage work (new features, new domains,
     performance, usability) is always a valid priority per the charter's
     tier progression. The synthesis must not deprioritize tier-1 work based
     on lack of external engagement — tier 1 is the prerequisite for
     everything else, not something to freeze while waiting for tier 2. Work
     that serves multiple tiers simultaneously (e.g., performance improves
     both author usability and distribution quality; the skill system is
     both the author's tool and a practitioner artifact) is high leverage
     and should be recognized as such.

   This produces the **merged top-priority list**.

3. **Delegability over the merged top-priority set.** For each priority in
   the merged list, construct a synthetic intention node and run the
   delegability-assessor over it. Read
   `.claude/agents/align-delegability-assessor.md` and launch one assessor
   per priority (Agent tool, `subagent_type: "general-purpose"`, the def's
   prompt inline). Build each synthetic node as:

   | Node field | Source |
   |---|---|
   | `statement` | the priority's one-line "What". |
   | `rationale` | the priority's "Why" (charter/audience trace). |
   | `owner` | default `human` (a top-level charter priority is human-decided by default) unless the synthesis states it is already AI- or procedure-owned. |
   | `success_signal` | the priority's "done-when / signal" (the intention node's `success_signal` field). |
   | `status` | `refining` (synthetic stand-in; no transitions are persisted). |
   | `node_id` | a synthetic slug, e.g. `rung5-<short-slug>` (not persisted). |
   | `clarifications[]`, `tooling_goals[]` | empty (no tree to read). |

   Feed each assessor the perspective estimates the `delegability.eval.v1`
   contract consumes, drawn from Phase 2:
   - **FINANCIAL inputs** (`build`, `run`, `manual_cost`, `frequency`) ← the
     `align-financial` output already gathered in Phase 2.
   - **TECHNICAL inputs** (`maintenance`, plus the "safe to abandon" veto) ←
     the `align-technical` output from Phase 2.
   - **Consistency veto** ← the consistency-tester output from step 1.

   Each assessor emits exactly one `delegability.eval.v1` object per the
   contract in `.claude/docs/delegability.md`. Collect them; they feed the
   Delegability findings section of the recommendations, and any emitted
   `tooling_goal` objects feed "New Issues to File".

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
`subagent_type: "general-purpose"`, the def's prompt inline). This
**replaces** the old 5-way per-persona review — one concentrated challenger
instead of five reviewers (the concentration trade described in The two
layers).

The contrarian receives:
1. The unified synthesis from Phase 3 (priority list plus rationale)
2. The underlying perspective and consistency findings the synthesis was
   built from (so it can see which priorities rest on genuine cross-lens
   agreement versus shallow agreement no lens probed)

It produces a structured challenge: **challenged priorities** (strongest
counter-argument per priority), **unexamined assumptions**, and **consensus
blind spots** — ranked by how load-bearing the challenge is.

Wait for it to complete.

## Phase 5: Re-synthesize

Take the Phase 3 synthesis and the Phase 4 contrarian challenge (plus any
veto surfaced by the consistency layer). Produce an updated synthesis that
incorporates the challenge:

1. **Updated unified priority list.** Re-rank priorities in light of the
   contrarian's challenge. Where a ranking changed from Phase 3, note which
   challenge caused the change and why. Drop or demote any priority whose
   strongest counter-argument holds; keep any that survive the challenge,
   noting why they hold.
2. **Consolidated gap analysis.** Merge all perspectives' Gap Analysis
   outputs from Phase 2 into two groups:
   - **Missing issues** — issues that should be on the backlog but aren't.
     Note which perspectives flagged each and through what lens.
   - **Scope refinements** — existing issues that need scope changes. Note
     which perspectives flagged each.
3. **Unresolved disagreements.** List priority-affecting disagreements that
   persist after incorporating the challenge. For each:
   - The disagreement
   - Which perspectives are on each side
   - What information would resolve it

## Backlog issue-triage

Enumerate every **open** issue in the review repo carrying **neither**
`help wanted` **nor** any `jit:*` label — the un-queued, non-reminder
backlog:

```bash
gh issue list --repo <repo> --state open --json number,title,labels,body --limit 200
```

Run with `dangerouslyDisableSandbox: true`. Filter out any issue whose
labels include `help wanted` or a name starting with `jit:`. For each
remaining issue, recommend **exactly one** of, each with a one-line
rationale:

- **add `help wanted`** — the issue is well-scoped and ready; promote it to
  the dispatch queue.
- **update the issue body** — the issue matters but its scope, framing, or
  acceptance criteria need revision before it is queue-ready.
- **close as not planned** — the issue no longer fits the charter/roadmap,
  is obsolete, or is a duplicate.

Triage produces **recommendations only**. It never mutates issues directly.
Present the results as a table: issue number, title, recommendation,
rationale.

## Recommendations

From the Phase 5 synthesis, produce recommended edits. These are the
deliverable content of the scheduled report.

### 1. Frontier & strategy recommendations
Recommended re-prioritizations of the active frontier (which feed the
*generated* active-frontier view — there is no committed roadmap file to
edit), plus proposed edits to the `strategy-*` doctrine nodes when the
prioritization or domain-selection doctrine itself shifts:
- Frontier re-prioritizations — the new ranked priority set with each
  priority's why (charter/audience trace), audience tier, distribution,
  done-when, and signal.
- Strategy-node edits — proposed changes to
  `intentions/strategy-progressive-validation.md` or
  `intentions/strategy-domain-selection.md`, only when doctrine has shifted.

(Drop the superseded "Current assessment" deliverable — the recurring review
re-derives it each cycle — and the "Feedback loop" deliverable — the signal
arm is tracked separately.)

### 2. Proposed Charter Revisions
If any perspective or the consistency-tester identified charter sections
that need updating, list specific proposed edits with rationale. If none,
state "No charter revisions proposed."

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
  `align-<perspective>` perspective" entry the decomposer surfaced in Phase
  1.5.
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

## Terminal behavior (scheduled)

**No user-feedback stop.** Compose the full report:
- the assessment window covered (`WINDOW_START` → now, or "full project
  history" on cold start);
- the re-synthesized priorities (Phase 5);
- the recommended frontier & strategy updates, proposed charter revisions,
  and existing-issue / new-issue recommendations, and the Delegability
  findings (Recommendations §1–5);
- the backlog issue-triage table.

Write the report to `$CLAUDE_JOB_DIR/tmp/align-report.md` — item titles and
issue bodies may carry shell metacharacters, so write the body to the file
and never inline it into a command. Then post it as a comment on the review
issue and close the issue:

```bash
mkdir -p "$CLAUDE_JOB_DIR/tmp"
gh issue comment <num> --repo <repo> --body-file "$CLAUDE_JOB_DIR/tmp/align-report.md"
gh issue close <num> --repo <repo>
```

Run both with `dangerouslyDisableSandbox: true` — they call `gh`. Closing
the review issue anchors the next cadence cycle: per the JIT engine, the
next `jit:align` review issue is created `remindAfterClose` (7d) after this
`closedAt`.

The posted comment is a GitHub-rendered artifact: per
`.claude/rules/issue-references.md`, keep bare `#N` references and append
**no** `References:` list. Never place a closing keyword
(`close`/`fix`/`resolve` and their variants) adjacent to any `#N` in the
report.

Then the session ends — the posted report is the office-hours session's
output.

## Automate (per-intention push-down)

"Automate" is the delegability push-down applied **per intention**, not a
global rung. It runs on the real components the rung-5 engine already uses —
no net-new machinery.

- Run `align-delegability-assessor`
  (`.claude/agents/align-delegability-assessor.md` +
  `.claude/docs/delegability.md`), already invoked in Phase 3, over the
  frontier goals.
- For any goal whose `delegability.eval.v1` returns
  `recommended_owner: procedure` (or `ai`) with a push-down `roi_verdict`,
  record it for the dispatch chain: the graph-native hand-off is a draft
  tactic node under the owning strategy, consumed by `/align-tactics`
  (`.claude/skills/align-tactics/SKILL.md`), which plans it into a
  schedulable `phase: implement` tactic. During the migration period the
  legacy `/file-issue` → `plan → implement → qa → review` chain remains
  available for issue-tracked work.
- Attach `signal.eval.v1` success signals via `align-signal-assessor`
  (`.claude/agents/align-signal-assessor.md` +
  `.claude/docs/signal-identification.md`).

The rung model is **not** the dispatch phase chain. The rungs are alignment
depths; the phase chain is the dispatch workflow a codified goal runs
through. Pushing a goal down produces work that *enters* the phase chain; it
does not move the project to a new rung.

## Migrating deployed instances

Two renames affect deployed instances' live jit config (`jit.json`), which is
**not tracked in this repo** and does not update automatically:

1. **`/roadmap` → `/align`** — shipped in #2370 (PR #2392). Instances whose
   live config still carries `"skill": "roadmap"` / `"label": "jit:roadmap"`
   must move to the `align` values first, and close or relabel any open
   `jit:roadmap` issues.
2. **`/align` → `/align-init`** — this change. The skill file moved to
   `.claude/skills/align-init/` and the legacy `.claude/skills/align/`
   directory is deleted. In the live `jit.json`, change `"skill": "align"`
   to `"skill": "align-init"`. The jit **key** (`align`) and **label**
   (`jit:align`) are unchanged, so no issue needs closing or relabeling —
   the next scheduled run simply invokes `/align-init`.

An instance that misses step 2 breaks at its next scheduled run:
`dispatch-jit-reminder` tries to invoke `/align`, a skill that no longer
exists. The in-repo example config
(`.claude/skills/dispatch-propagate/scripts/jit.example.json`) already
carries `"skill": "align-init"`.
