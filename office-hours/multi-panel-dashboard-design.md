# Office Hours multi-panel dashboard — design proposal

Extend the office-hours display (the `office-hours/` Vite app) to show four
panels on one screen — token usage, the office-hours queue, mergeable PRs with
a per-PR merge button, and budget status from localhost — laid out on a grid
when there's room and collapsing to a single-column list when space is tight.

## The load-bearing constraint: budget forces a locally-served context

Start from the budget panel, because it is the tightest constraint and the rest
of the architecture is *derived* from it, not freely chosen.

"Budget data from localhost" collides with the budget privacy invariant
(transaction data never leaves the user's machine — see the `/budget` skill and
`reference_budget_network_share`). Two consequences are non-negotiable:

1. **Budget cannot route through Firestore.** The pattern that feeds token usage
   and queue metrics today — a local sampler (`usage-sample-writer.mjs`,
   Firebase Admin SDK) writes snapshots to `office-hours/{env}/…`, and the
   deployed app reads them — is **off the table for budget.** Even a summary is
   budget data.
2. **A deployed `https://` page cannot fetch `http://localhost:NNNN`.** Browsers
   block it as mixed content. So the budget panel only works when the dashboard
   **is itself served from localhost**, same-origin with (or proxied to) the
   local budget endpoint.

That single fact forces a locally-served run-context. Once the dashboard must be
servable locally anyway, the other privileged concerns fall into the same
context for free: the GitHub token that authorizes a merge is held locally
rather than shipped into a browser SPA, and the office-hours queue / PR list can
be read live from GitHub instead of via the Firestore sampler.

The architecture is therefore not a menu choice — it is derived from the budget
constraint. **If the four panels were presented as fitting the existing deployed
Firestore app, the proposal would be wrong**: the budget panel cannot work that
way.

## Greenfield: one codebase, two run-contexts

Build to the ideal shape regardless of migration cost (per the design-proposals
rule). The ideal is **one app, two contexts** — *not* two apps. The panels, the
grid, and the shell are identical across contexts; duplicating the shell into a
separate "operator console" is the inferior design.

| Context | Served at | Token usage | Office-hours queue | Mergeable PRs | Budget |
|---|---|---|---|---|---|
| **Deployed** (Firebase, today) | `https://…` | live (Firestore) | live (Firestore sampler) | read-only list (Firestore sampler) | "local mode only" placeholder |
| **Local operator** | `http://localhost` | live | live (GitHub direct) | live + **merge actions** | live (localhost endpoint) |

Same components everywhere; only the **data adapter** and **action gating**
differ by context. A panel is available, read-only, or degraded depending on the
context it renders in — never silently empty.

### Component model — a panel registry replaces sequential `appendChild`

`app-view.ts` today hard-codes the composition:

```ts
container.appendChild(renderCapacityBand(...));
container.appendChild(renderPacePositionPanel(...));
container.appendChild(renderHistoryBand(...));
container.appendChild(renderReminderList(...));
```

Replace it with a registry rendered into a grid. Each panel declares its
identity, its data source, and where it's actionable:

```ts
interface Panel<T> {
  id: string;
  title: string;
  load(ctx: Context): Promise<T | PanelError>;   // adapter — Firestore | GitHub | localhost
  render(data: T, ctx: Context): HTMLElement;
  availableIn: Context["kind"][];                  // gate per run-context
}
```

`renderApp` becomes: for each panel available in the current context, render its
card into a `.panel-grid` container; panels not available render an explicit
degraded card (not omission).

### Responsive layout is pure CSS — no JS, no media queries

The "grid when wide, list when tight" ask is one declaration:

```css
.panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 1rem;
  align-items: start;
}
```

`auto-fit` collapses surplus tracks (use `auto-fit`, **not** `auto-fill`, which
leaves phantom empty columns); `minmax(min(100%, 22rem), 1fr)` lets a card take
the full row when the viewport is narrower than 22rem, giving a single-column
list automatically. No `@media`, no resize listener. Tall panels (the usage
history chart) can opt into `grid-column: 1 / -1` to span the full width.

### Data sources & per-panel behavior

| Panel | Deployed source | Local source | Action |
|---|---|---|---|
| **Token usage** | Firestore `usage-samples` (exists) | same | none |
| **Office-hours queue** | Firestore sampler | `gh`/GitHub API direct | none |
| **Mergeable PRs** | Firestore sampler (read-only list) | GitHub API direct | **merge** (local only) |
| **Budget** | — (degraded card) | `http://localhost:NNNN` summary | none |

Three constraints to bake in, not skip:

1. **Queue panel disambiguation.** The list rendered today (`renderReminderList`)
   is the JIT *reminder* queue. "The office-hours queue" most naturally means
   the `dispatch:office-hours`-labeled items — the work parked for a human —
   which is a different data source. **Recommend the `dispatch:office-hours`
   reading** given the app's name; keep the JIT reminders as a separate panel if
   still wanted. State the choice explicitly so the two aren't conflated.
2. **Merge is a destructive, outward-facing action.** The harness rule requires
   confirm-before-irreversible. The merge control is a button → confirm step →
   act, with an in-card result, never a bare one-click merge.
3. **Explicit per-panel error states** (code-style rule: clear errors over
   fallbacks). Budget needs a distinct "localhost unreachable" card; merge needs
   a "merge failed: <reason>" state; a Firestore read failure shows an error
   card. No panel silently renders empty to mask a failure.

### Does merge need a backend? Probably not — verify

GitHub's REST API supports CORS (`Access-Control-Allow-Origin: *`, auth via the
`Authorization` header rather than cookies), so a browser `PUT
/repos/{owner}/{repo}/pulls/{n}/merge` with a locally-held token should work
cross-origin without any proxy. **Verify this for the authenticated merge
endpoint at implementation time.** If it holds, the *only* thing forcing
local-serving is the budget endpoint — merge needs no daemon, just a local token
in the local context. Do not design a backend daemon into this recommendation;
the minimal integration is (a) the budget app exposing a localhost summary
endpoint, and (b) the dashboard being served from localhost in operator mode.

## Brownfield migration path

Backwards-compatible and multi-PR, so a migration path is required alongside the
greenfield (design-proposals rule). Each step ships independently.

1. **Grid refactor + wire the already-scaffolded queue-metrics panel.**
   Cheapest first step, no new data source and no new trust zone: `queue-metrics`
   already has `parse`/`serialize`/seed + `getDemoQueueMetrics`, but `renderApp`
   never composes it. Introduce the panel registry + `.panel-grid` CSS, convert
   the four existing renders, and add the queue-metrics card. Pure layout +
   wiring; no behavior change to existing panels.
2. **Token-usage panel consolidation.** Group the existing capacity / pace /
   history renders as the "token usage" panel cluster within the grid (history
   spans full width). No data change.
3. **Office-hours queue panel (`dispatch:office-hours` items).** Add a sampler
   (mirroring `usage-sample-writer.mjs`) that writes labeled-item snapshots to
   Firestore for the deployed context; the local context reads GitHub directly.
4. **Mergeable-PR panel, read-only.** Sampler-fed list in deployed context;
   GitHub-direct in local. No action yet.
5. **Local operator context + merge action + budget panel.** Add context
   detection (served-from-localhost), the GitHub-token merge action with its
   confirm step, and the budget localhost adapter with its unreachable state.
   This is the step that unlocks the privileged panels; everything before it
   ships value in the deployed app.

## Files this touches

- `office-hours/src/app-view.ts` — registry + grid composition (step 1).
- `office-hours/index.html` — `.panel-grid` CSS + per-panel card styles.
- `office-hours/src/queue-metrics.ts` + new `render` — wire existing panel (step 1).
- New panel modules: `office-hours-queue-panel.ts`, `prs-panel.ts`,
  `budget-panel.ts`, each with a data adapter + degraded/error states.
- New samplers under `.claude/skills/dispatch-propagate/scripts/` for the queue
  and PR snapshots (deployed context), mirroring `usage-sample-writer.mjs`.
- A served-from-localhost detection + local GitHub-token / budget-endpoint
  adapters (step 5).
