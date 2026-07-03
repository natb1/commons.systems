# intentions/

Every file here is one node of a self-describing intention graph. Start at
[`kind-kind.md`](kind-kind.md) — the graph defines its own structure, layers,
and edge semantics. Schema and tooling: `packages/intentionsutil/`
([SCHEMA.md](../packages/intentionsutil/SCHEMA.md)); gh-backed `tactic-*.md`
nodes are reconciled from GitHub by
`npx tsx packages/intentionsutil/scripts/backfill.ts`. The graph is the
authoritative source of truth for all data and GitHub is an optional, derived
projection; the current direction is to (1) make the graph a correct source of
truth for all data, (2) migrate the dispatch router from GitHub onto the graph,
and (3) optionally re-establish full GitHub integration.
