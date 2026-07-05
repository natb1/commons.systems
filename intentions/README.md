# intentions/

Every file here is one node of a self-describing intention graph. Start at
[`kind-kind.md`](kind-kind.md) — the graph defines its own structure, layers,
and edge semantics. Schema and tooling: `packages/intentionsutil/`
([SCHEMA.md](../packages/intentionsutil/SCHEMA.md)). The graph is the sole
store — no external system feeds or mirrors it. The current direction is to
migrate the dispatch router onto the graph
(`tactic-graph-native-dispatch.md`), with the legacy GitHub router draining
its existing queue in parallel over disjoint state; integration with an
external tracking system such as GitHub is a separate strategy, design TBD.
