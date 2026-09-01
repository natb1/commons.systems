# Greenfield Evaluation

> **Projection notice (2026-09-01).** This file is a hand-materialized
> projection of graph doctrine — sources: the full-frontier definition, the
> dual-perspective rule, and the overrule algebra on
> `intentions/strategy-explicit-intent.md` (all author-ratified 2026-08-31).
> The greenfield target is rules materialized from doctrine mechanically;
> until that machinery exists this file is a declared shim (liquidation
> condition: rules-materialization live). If this file conflicts with the
> graph at `origin/main`, the graph wins — treat the conflict as a
> stale-projection frontier item, not as two authorities.

## Evaluate the full solution frontier

Every design evaluation, proposal, or review evaluates the **full solution
frontier** — never "ideal design given implicit constraints". Nothing is
sacred: no doctrine is implied, especially not by the incumbent
implementation. Existing code and artifacts are evidence of past decisions,
not authority over future ones.

## Ratified is changeable; lesser dispositions more so

Ratified doctrine requires only an author interview to change — `/align` is
that interview. Never treat "ratified" as immutable: when a better design
exists, surface it and let the author rule. Delegated and deferred
dispositions do not even require an interview — AI may overrule them on best
judgment during execution or rsi — but every such override enters the author
review queue: an override of a deferred disposition inherits the deferred
stamp, and an override of a delegated disposition becomes deferred (the
overrule algebra on `strategy-explicit-intent`; the superseded stamp survives
in the record — clarifications append, never rewrite).

## Evaluate twice: fresh judgment and tradition

Every evaluation runs both lenses: fresh-perspective best judgment, and
reference to tradition — searching for the relevant software-engineering or
other tradition, including pre-agent traditions that were shelved only by
human constraints. Record tradition references with each resolution.

## Ground execution in the tradition, not just the record

When executing under a strategy whose doctrine cites a tradition, ground the
work against the strategy AND the tradition itself. The tradition reference
is a pointer into context the recording round deliberately compressed away —
consult it; never re-derive the design from the summary alone. Defer to the
tradition only inside its recorded support scope: tradition references
encode both where the tradition supports the strategy and where the strategy
deliberately diverges, and a recorded divergence is an author decision the
tradition cannot overrule. An unrecorded conflict between tradition and
strategy is a frontier item — defer to neither silently. A tradition edge —
supporting or contradicting — is itself a disposition, carrying the same
authority categories (ratified / delegated / deferred) and the same overrule
rules as any other disposition; the tradition as text never overrules
anything — changes to an edge flow through the disposition algebra. (Ratified
2026-09-01, `strategy-graph-native-dispatch`.)

## Adversarial review is part of the work

Adversarially review your own recorded output — graph writes, designs,
plans — as part of producing it, not as an optional pass the author must
request.
