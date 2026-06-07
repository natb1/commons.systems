---
name: roadmap
description: Structured roadmap reassessment — five personas analyze project state against the charter, debate the synthesis, and produce roadmap recommendations plus a backlog issue-triage. Interactive mode stops for user feedback before proposing edits; autonomous mode (the roadmap jit) posts a report and closes the review issue.
user-invocable: true
---

# Roadmap

Five personas analyze project state independently, synthesize priorities, debate
the synthesis, re-synthesize, triage the open backlog, and produce recommended
edits to `ROADMAP.md`, `CHARTER.md`, and the issue backlog.

This skill runs in one of two modes:

- **Interactive** — a human runs `/roadmap` (optionally with a focus question).
  The skill stops for user feedback after re-synthesis, then presents proposed
  edits with the backlog triage results. Nothing is posted to GitHub; no issue
  is closed.
- **Autonomous** — the JIT engine runs `/roadmap` against a `jit:roadmap` review
  issue via the skill-running jit-reminder path (`dispatch-jit-reminder`). This
  is an **office-hours session**, like every jit summary session: after claiming
  the issue (`Status` → `In Progress`), `dispatch-jit-reminder` invokes this
  skill with the issue's `<repo> <num>` as its arguments and lets it own the
  rest of the session. There is **no** user-feedback stop — the skill posts the
  full report as a comment on the review issue and closes it, anchoring the next
  cadence cycle.

Run every `gh`-calling command, and every script that calls `gh` or `curl`, with
`dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## Mode detection

The skill takes optional arguments. Detect the mode from them:

- **Two arguments** where the first matches `owner/repo` (a `/`-containing slug)
  and the second is digits (`<repo> <num>`) → **autonomous mode** against that
  `jit:roadmap` review issue. This is how `dispatch-jit-reminder` invokes the
  skill (same contract as `/digest`). Before doing anything else, verify the
  issue actually carries a `jit:roadmap` label:

  ```bash
  gh issue view <num> --repo <repo> --json labels
  ```

  Run with `dangerouslyDisableSandbox: true`. If the issue's labels do **not**
  include `jit:roadmap`, **STOP** with a clear error — this skill must not post
  to or close an issue that is not a roadmap-review jit issue.

- **Otherwise** → **interactive mode**. Treat any argument text as the
  **focus question** (see below), carried through every phase.

## Focus Question (interactive mode)

If the user provides input after `/roadmap`, treat it as a **focus question**
that narrows the scope of the entire assessment. Store the focus question and
include it in every phase:

- **Phase 2:** Prepend the focus question to each agent's input: "Focus
  Question: {question}. Weight your analysis toward answering this question. You
  should still produce your full assessment, but prioritize analysis relevant to
  the focus question."
- **Phase 3:** After merging priority lists, add a dedicated section: "### Focus
  Question Response" that directly answers the user's question based on the
  synthesized findings.
- **Phase 4:** Each agent's review should also evaluate whether the synthesis
  adequately answered the focus question.
- **Phase 5:** The re-synthesis "Focus Question Response" section should
  incorporate review feedback.
- **Phase 6:** Present the focus question response as the first section, before
  the synthesis.

If no input is provided, run the full broad assessment.

In autonomous mode there is no focus question — always run the full broad
assessment.

**Personas:**
| Agent | Lens | Produces priorities? |
|---|---|---|
| Product | User value, charter alignment, competitive analysis | Yes |
| Marketing | Discoverability, distribution, brand, competitive positioning | Yes |
| Engineering | Technical health, workflow sustainability, forkability | Yes |
| Finance | Cost sustainability, dependency economics, monetization | Yes |
| Auditor | Charter compliance, dependency health, ratchet risk | No (findings/warnings that can veto priorities) |

## Assessment window (both modes)

The assessment evaluates `ROADMAP.md` and **all work completed since the last
roadmap review** against `CHARTER.md`. Compute the window-start timestamp first:

- **Autonomous mode:** the review issue anchors the window.

  ```bash
  WINDOW_START=$(.claude/skills/dispatch-propagate/scripts/dispatch-digest-window <repo> <num>)
  ```

  Run with `dangerouslyDisableSandbox: true` — it calls `gh`. It prints the
  `closedAt` of the previous closed `jit:roadmap` issue (steady state), or this
  issue's own `createdAt` when no prior closed review exists (cold start).

- **Interactive mode:** resolve the roadmap-review repo from the jit config and
  find the newest closed review issue's `closedAt`.

  ```bash
  JIT_JSON=$(.claude/skills/dispatch-propagate/scripts/dispatch-config-load jit)
  ```

  If this prints `no-config` (no `jit.json` present), there is no review history
  to anchor on: set `WINDOW_START` to empty and note **"no prior roadmap review
  — full project history"** in the assessment. Otherwise select the jit whose
  `skill == roadmap` and read its `repo`; find the newest closed `jit:roadmap`
  issue in that repo and use its `closedAt` as `WINDOW_START`:

  ```bash
  REVIEW_REPO=$(jq -r '.jits[] | select(.skill == "roadmap") | .repo' <<<"$JIT_JSON" | head -n1)
  if [[ -z "$REVIEW_REPO" ]]; then
    WINDOW_START=""
  else
    WINDOW_START=$(gh issue list --repo "$REVIEW_REPO" --label jit:roadmap \
      --state closed --limit 100 --json closedAt \
      --jq 'max_by(.closedAt) | .closedAt // empty')
  fi
  ```

  Run the `gh` call with `dangerouslyDisableSandbox: true`. If no closed
  `jit:roadmap` issue exists, leave `WINDOW_START` empty and note **"no prior
  roadmap review — full project history"**. If `REVIEW_REPO` is empty (no jit
  entry with `skill == "roadmap"`), treat this the same as the no-config case.

Pass `WINDOW_START` into the persona context (Phase 1): instruct the personas to
evaluate `ROADMAP.md` and **all work completed since `WINDOW_START`** (or the
full project history when there is no prior review) against `CHARTER.md`.

## Phase 1: Gather Context

Run the gather-context script. It writes output to a file and prints the path:

```bash
.claude/skills/roadmap/scripts/gather-context.sh
```

This script also calls `fetch-analytics.sh` to append GA4 and Search Console
data. Run it with `dangerouslyDisableSandbox: true` — both scripts make network
calls to Google's OAuth and API hosts, which the sandbox's network namespace
isolation blocks (see `.claude/rules/sandbox.md`).

Read the output file at the printed path. Store the contents as a single block
to pass to each agent, together with the `WINDOW_START` instruction above.

### Analytics setup

`gather-context.sh` calls `fetch-analytics.sh`, which reads credentials from env
vars at runtime. No credentials are stored in the repo.

**Required OAuth env vars** (all three must be set or the GA4 + Search Console
fetch is skipped):
- `GOOGLE_ANALYTICS_CLIENT_ID` — OAuth 2.0 client id
- `GOOGLE_ANALYTICS_CLIENT_SECRET` — OAuth 2.0 client secret
- `GOOGLE_ANALYTICS_REFRESH_TOKEN` — long-lived refresh token carrying both required scopes

**Config env vars** (optional, with defaults):
- `ROADMAP_GA4_PROPERTY_IDS` — comma-separated `app:propertyId` pairs, e.g. `landing:111,budget:222,print:333`. When unset, the GA4 section is skipped (Search Console still runs).
- `ROADMAP_SEARCH_CONSOLE_SITE` — Search Console property string. Default: `sc-domain:commons.systems`.

**Exporting from `pass`:** per the pinentry guidance in `.claude/rules/sandbox.md`, warm the gpg-agent cache once in an interactive shell (`pass show google-analytics/client-id`), then export each value:

```bash
export GOOGLE_ANALYTICS_CLIENT_ID="$(pass show google-analytics/client-id)"
export GOOGLE_ANALYTICS_CLIENT_SECRET="$(pass show google-analytics/client-secret)"
export GOOGLE_ANALYTICS_REFRESH_TOKEN="$(pass show google-analytics/refresh-token)"
```

**One-time refresh-token bootstrap:** use the Google OAuth 2.0 Playground at `developers.google.com/oauthplayground`, configured with your own client id/secret, requesting both scopes `https://www.googleapis.com/auth/analytics.readonly` and `https://www.googleapis.com/auth/webmasters.readonly`. See the `fetch-analytics.sh` header comment for the full step-by-step.

**Graceful degradation:** when any required OAuth env var is unset, `fetch-analytics.sh` prints a parenthetical note to stdout (captured in the context file) explaining that credentials are not configured, then exits 0. Personas see the explanation in the analytics section rather than a silent empty block. When `ROADMAP_GA4_PROPERTY_IDS` is unset but credentials are set, a similar inline note marks the GA4 section as skipped; Search Console data still runs.

In autonomous mode the analytics env vars are typically unset (no interactive
`pass` warm-up). That is fine — the personas note the absence of analytics data
rather than guessing.

## Phase 2: Independent Assessments

Read all 5 agent definition files:
- `.claude/agents/roadmap-product.md`
- `.claude/agents/roadmap-marketing.md`
- `.claude/agents/roadmap-engineering.md`
- `.claude/agents/roadmap-finance.md`
- `.claude/agents/roadmap-auditor.md`

Launch **5 agents in parallel** in a single message using the Agent tool
(`subagent_type: "general-purpose"`). Each agent receives:
1. Its persona prompt (from the agent definition file)
2. The full gathered context from Phase 1 (including the `WINDOW_START`
   instruction: evaluate work completed since the last roadmap review against
   the charter)
3. Instruction to produce output in the exact format specified in the agent
   definition

The Marketing agent prompt additionally includes: "Read `.claude/skills/brand/SKILL.md` and use it as reference for your Brand Review section."

Wait for all 5 to complete. Store each agent's output.

## Phase 3: Synthesize

Process outputs in this order (synthesis hierarchy). Before synthesizing, verify each agent produced valid output in the expected format. If any agent output is missing, empty, or does not contain the required sections, note this explicitly in the synthesis and adjust the merging weights accordingly.

1. **Auditor first.** Read the Auditor output. Extract all findings and warnings. Any Critical-severity finding can veto a priority.
2. **Flag conflicts.** Identify where auditor warnings contradict priorities from other personas. Document each conflict.
3. **Merge priority lists.** Combine the 4 priority lists (Product, Marketing, Engineering, Finance) using weighted ranking:
   - Items appearing in 3+ lists rank highest
   - Items appearing in 2 lists rank by combined scores
   - Items in 1 list rank by that persona's score, discounted
   - Auditor warnings adjust rankings: Critical finding vetoes the priority (removes from list), Warning adds a note
   - **Tier-1 protection:** Author-usage work (new features, new domains, performance, usability) is always a valid priority per the charter's tier progression. The synthesis must not deprioritize tier-1 work based on lack of external engagement — tier 1 is the prerequisite for everything else, not something to freeze while waiting for tier 2. Work that serves multiple tiers simultaneously (e.g., performance improves both author usability and distribution quality; the skill system is both the author's tool and a practitioner artifact) is high leverage and should be recognized as such.
4. **Produce unified synthesis.** For each priority in the merged list:
   - Which personas advocated for it and why
   - Which personas opposed or didn't mention it
   - Auditor findings that apply
   - Charter alignment assessment
   - Rationale for its final ranking

## Phase 4: Review

Launch **5 agents in parallel** again in a single message. Each receives:
1. Its original persona prompt
2. Its Phase 2 output (so it remembers its own assessment)
3. The Phase 3 synthesis

Each agent produces exactly three sections:
- `## Agreement` — what the synthesis got right, with specific references
- `## Disagreement` — what the synthesis got wrong, with specific arguments
- `## Missing` — what the synthesis omitted that matters

Instruction to each agent: "Produce substantive feedback. Agreement without analysis is not helpful. If you agree with everything, explain why the synthesis is robust rather than just saying you agree."

Wait for all 5 to complete.

## Phase 5: Re-Synthesize

Take the Phase 3 synthesis and all five Phase 4 review outputs. Produce an updated synthesis that incorporates the review feedback:

1. **Updated unified priority list.** Re-rank priorities based on review feedback. Where a ranking changed from Phase 3, note which agent's feedback caused the change and why.
2. **Consolidated gap analysis.** Merge all five agents' Gap Analysis outputs from Phase 2 into two groups:
   - **Missing issues** — issues that should be on the backlog but aren't. Note which agents flagged each and through what lens.
   - **Scope refinements** — existing issues that need scope changes. Note which agents flagged each.
3. **Unresolved disagreements.** List priority-affecting disagreements that persist after incorporating review feedback. For each:
   - The disagreement
   - Which personas are on each side
   - What information would resolve it

## Backlog issue-triage (both modes)

Enumerate every **open** issue in `natb1/commons.systems` carrying **neither**
`help wanted` **nor** any `jit:*` label — the un-queued, non-reminder backlog:

```bash
gh issue list --repo natb1/commons.systems --state open --json number,title,labels,body --limit 200
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

Triage produces **recommendations only**. It never mutates issues directly in
either mode. Present the results as a table: issue number, title, recommendation,
rationale.

## Roadmap recommendations (both modes)

From the Phase 5 synthesis, produce recommended edits. These are the deliverable
content for both the interactive proposed-edits step (Phase 7) and the
autonomous report.

### 1. Draft ROADMAP.md Update
A complete draft of ROADMAP.md incorporating the synthesis (and user feedback in
interactive mode). Follow the existing ROADMAP.md structure:
- Strategy section (update only if assessment warrants it)
- Current assessment (update date, stats, what's working/not working, bottleneck)
- Priorities (new ranked list with the schema: why, audience, distribution, done-when, signal)
- Feedback loop (update triggers and metrics)

### 2. Proposed Charter Revisions
If any persona or the auditor identified charter sections that need updating, list specific proposed edits with rationale. If none, state "No charter revisions proposed."

### 3. Existing Issues to Update
For each existing issue that needs scope refinement (from gap analysis and synthesis):
- Issue number
- Current scope summary
- Proposed change
- Rationale

### 4. New Issues to File
For each gap identified (issues that should exist but don't):
- Proposed title
- Body draft
- Labels
- Which agents flagged it
- Rationale

## Terminal behavior

### Interactive mode

**Phase 6: Stop for User Feedback.** Present three sections to the user:
1. Updated synthesis (the re-synthesized priority list from Phase 5)
2. Unresolved disagreements (from Phase 5)
3. Consolidated gap analysis (from Phase 5)

**STOP. Ask the user for feedback before proceeding.** Do not continue until the
user responds.

**Phase 7: Propose Edits.** After receiving user feedback, incorporate it and
present the roadmap recommendations above (Draft ROADMAP.md Update, Proposed
Charter Revisions, Existing Issues to Update, New Issues to File), **plus** the
backlog issue-triage table as an added section alongside the proposed edits. No
issue is closed; nothing is posted to GitHub.

### Autonomous mode

**No user-feedback stop.** Compose the full report:
- the assessment window covered (`WINDOW_START` → now, or "full project history"
  on cold start);
- the re-synthesized priorities (Phase 5);
- the recommended ROADMAP.md updates, proposed charter revisions, and
  existing-issue / new-issue recommendations (Roadmap recommendations §1–4);
- the backlog issue-triage table.

Write the report to `$CLAUDE_JOB_DIR/tmp/roadmap-report.md` — item titles and
issue bodies may carry shell metacharacters, so write the body to the file and
never inline it into a command. Then post it as a comment on the review issue
and close the issue:

```bash
mkdir -p "$CLAUDE_JOB_DIR/tmp"
gh issue comment <num> --repo <repo> --body-file "$CLAUDE_JOB_DIR/tmp/roadmap-report.md"
gh issue close <num> --repo <repo>
```

Run both with `dangerouslyDisableSandbox: true` — they call `gh`. Closing the
review issue anchors the next cadence cycle: per the JIT engine, the next
`jit:roadmap` review issue is created `remindAfterClose` (7d) after this
`closedAt`.

The posted comment is a GitHub-rendered artifact: per
`.claude/rules/issue-references.md`, keep bare `#N` references and append **no**
`References:` list. Never place a closing keyword (`close`/`fix`/`resolve` and
their variants) adjacent to any `#N` in the report.

Then the session ends — the posted report is the office-hours session's output.
