# intentions/

Every file here is one node of a self-describing intention graph. Start at
[`kind-kind.md`](kind-kind.md) — the graph defines its own structure, layers,
and edge semantics. Schema and tooling: `packages/intentionsutil/`
([SCHEMA.md](../packages/intentionsutil/SCHEMA.md)); `tactic-*.md` leaves are
regenerated from GitHub by `npx tsx packages/intentionsutil/scripts/backfill.ts`.
