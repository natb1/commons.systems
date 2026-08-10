---
name: rsi-plan
description: Refresh rsi-plan.md from graph state — draft the three queue summaries as dated records on their owning strategy nodes, run render-rsi-plan.ts, and report the mechanical staleness flags. Rendering only; it makes no judgment about what to do next and takes no dispatch action.
user-invocable: true
---

# RSI Plan

The **rendering** half of the `/rsi` loop. `/rsi` invokes this as step 1 in a
subagent; it may also be run alone to refresh the dashboard.

The split is deliberate (`strategy-recursive-self-improvement`, 2026-08-10
review round): **this skill renders, `/rsi` judges.** Drafting summaries and
regenerating the file is mechanical work that fits a subagent. Deciding what the
flags mean — which graph updates are required, whether an item is dispatch's
work or an rsi shortcut, whether an `/align` session is needed, how the task plan
should change — belongs to the `/rsi` main thread, which holds the serialized
claim and can talk to the author. **Never make those decisions here.** Report
the flags and stop.

## What is out of scope

- Deciding, recommending, or executing next steps. Report; do not route.
- Pausing or resuming dispatch. That authority is `/rsi`'s.
- Editing `rsi-plan.md` by hand, in whole or in part. Every section is
  rendered; a hand-edited section is a defect (strategy condition 5). If the
  file should say something it does not, change the **graph** and re-render.
- Any graph write other than the three `attributes.queue_summary` fields below.

## Step 1 — Sync, and confirm the store you are about to read

The render reads the store at `origin/main`, not the working tree, so a stale
remote-tracking ref renders a stale dashboard and pushes it to main as current.
Fetch first:

```bash
git fetch origin main
```

## Step 2 — Produce the usage aggregate

Per-workflow token attribution is part of the fitness function, and an absent
aggregate renders as an explicit *unavailable* line rather than as zero spend.
Produce one:

```bash
mkdir -p tmp
.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh --days 7 --json-out tmp/usage-audit.json
```

This parses local session transcripts; it needs no network. If it fails, say so
and continue — the render degrades honestly.

## Step 3 — Draft the three queue summaries

Each summary is a short prose read of one queue's current state and near-term
priorities. **The graph is the source of truth, never the `.md`**: each summary
lands on the strategy that owns its queue, and the render pulls it from there.

| queue | owning node |
|---|---|
| dispatch | `strategy-graph-native-dispatch` |
| office-hours | `strategy-attention-surface` |
| rsi | `strategy-recursive-self-improvement` |

Write each as `attributes.queue_summary: {date, summary}` on its owning node.
The field — rather than the top-level `reading` — is deliberate: `reading` is
sensor-owned, and `read-sensors.ts` overwrites it on every batch run, so a
summary parked there would be silently clobbered. `attributes.queue_summary` is
outside `strategyFingerprint`'s substance hash, so re-drafting a summary each
iteration invalidates no open child's strategy stamp.

Ground each summary in what you can read, not in recall:

- **dispatch** — open tactics by phase, the backlog band and its trend, what is
  in `review`/`main-qa` and what it is waiting on, and the pause state.
  `npx tsx packages/intentionsutil/scripts/align-tactics-census.ts` and
  `graph-census-debt.ts` are the mechanical views.
- **office-hours** — the rank-lifted parks and what they block. Canonical view:
  `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list`.
  Never hand-roll a park probe.
- **rsi** — the state of the task plan: what landed since the last iteration,
  what is in flight, what is blocked.

Keep each to a short paragraph. This is the one place in the file where a model
writes prose, so it carries what a table cannot: *why* the queue looks like this.

Land all three in ONE `graph-commit` round, following the standard edit-round
discipline — `dump-node.ts --out-dir <dir>` for the base manifest BEFORE any
edit, `write-node.ts --file <json>` to write (it preserves existing bodies), and
`graph-commit --base <manifest>` to land. Verify the landing by parsing
`origin/main`, never by exit code.

## Step 4 — Render

```bash
npx tsx packages/intentionsutil/scripts/render-rsi-plan.ts
```

Writes `rsi-plan.md` and prints one `FLAG <kind> <subject> — <detail>` line per
staleness finding on stderr. `--check` renders without writing and exits 1 if
the committed file is stale; `--json` emits `{markdown, flags}` and writes
nothing.

The flag kinds, and what each means mechanically:

| kind | meaning |
|---|---|
| `summary-missing` / `summary-stale` | a queue summary is absent or older than 7 days — step 3 did not land |
| `threshold-breach` | a measured signal's reading does not meet its recorded threshold |
| `unread-sensor` | a registered sensor has never been read — run `read-sensors.ts` |
| `task-done` / `task-parked` | an rsi task node completed or parked; the plan sequence needs re-deriving |
| `spend-deviation` | dispatch did not outpace office-hours/rsi — the fitness function's recorded expectation failed |

## Step 5 — Land the file, and report

`rsi-plan.md` is single-writer and direct-pushed to main with no PR flow — a
recorded exception to `strategy-graph-native-dispatch`'s
direct-push-restricted-to-`intentions/` condition, carried until
`tactic-rsi-direct-push-condition-reconcile` amends it (strategy condition 5).
Commit only `rsi-plan.md` and push.

Then report to the caller, and stop:

1. Every flag, verbatim, grouped by kind.
2. What changed in the file versus its previous revision (`git diff HEAD~1 -- rsi-plan.md`).
3. Anything the render could not read (a failed aggregate, an unreachable ref).

No recommendations. No next steps. The `/rsi` main thread decides.
