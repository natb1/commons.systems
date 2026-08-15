---
id: tactic-autonomous-body-write-wholesale-replace
kind: tactic
statement: Two autonomous scripts replace a node's entire markdown body while
  keeping its frontmatter, and one of them does it on edit paths where the node
  already exists — make an unattended body write an append or a targeted splice,
  never a wholesale replace
owner: ai
status: raw
parent: null
rationale: Minted 2026-08-15 on author ruling, from the per-site write-site
  sweep recorded on tactic-finding-search-all-producers. The 2026-08-14 doctrine
  round recorded dispatch-graph-census's wholesale body overwrite as
  legal-but-unmonitored and described it as the only such site; the sweep
  measured a second, and a worse one. dispatch-eval-finding's splice_body
  (.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:743-761)
  keeps the frontmatter fence and concatenates $BODY_FILE over everything after
  it. At the mint (:1127) that is correct - a create authors its own body. But
  the same helper runs on the recurrence path (:1223) and the resolved path
  (:1027), where the node already exists and its body may carry hand-authored
  analysis from an earlier session or an office-hours sitting.
  dispatch-graph-census:133-140 does the equivalent on every run after the
  first. Both are unattended. The body is half of tacticScopeFingerprint
  (router.ts:131-133), so this is a scope-substance write performed with no
  human ruling on it, which is the same class this round's four violators belong
  to - it was simply missed because the sweep that found them enumerated
  frontmatter writers and not body writers. Neither site is malicious or
  obviously wrong in its own lane; the defect is that neither can tell an
  authored body from a generated one.
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Two autonomous scripts replace a node's entire markdown body while keeping its frontmatter, and one of them does it on edit paths where the node already exists — make an unattended body write an append or a targeted splice, never a wholesale replace

## Draft context (2026-08-15 /align correction round, per-site sweep)

This is a **draft**, not a plan. It records the measurement and the shape of the
fix; it has not been decomposed and carries no verification block yet.

## The two sites, measured

**`dispatch-eval-finding`** —
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:743-761`:

```
splice_body() {
  awk '{print} /^---$/{c++; if(c==2) exit}' "$NODE_FILE" > "$tmp"   # keep frontmatter
  cat "$BODY_FILE" >> "$tmp"                                        # replace everything after
  mv "$tmp" "$NODE_FILE"
}
```

It has guards worth crediting — it refuses a file whose frontmatter fence is
incomplete, and it rolls back from a captured blob on failure. What it has no
way to do is distinguish a body it generated from one a human wrote. Callers:

- `:1127` — the **mint**. Correct: a create authors its own body.
- `:1223` — the **recurrence** path. The node already exists.
- `:1027` — the **resolved** path, guarded by `[[ -n "$BODY_FILE" ]]`. The node
  already exists.

**`dispatch-graph-census:133-140`** does the equivalent on every run after the
first. The 2026-08-14 round recorded this one as legal-but-unmonitored and
described it as the only such site. That description was too narrow, and the
error was the same one this round exists to correct: the sweep that produced it
enumerated *frontmatter* writers and never asked which callers write bodies.

## Why it belongs on the violator ladder

The markdown body is half of `tacticScopeFingerprint`
(`packages/intentionsutil/src/router.ts:131-133`) — the pair
`(statement, body)`. So a body write is a scope-substance write. Both sites
perform one **unattended**, which is the defining property of this round's four
violations; they were missed only because the census enumerated the wrong
surface, not because they were judged and excused.

Note what this does *not* claim. Neither script is wrong in its own lane, and
neither has been observed destroying authored content. The defect is structural:
the capability exists, it runs with no human ruling on it, and nothing detects
it if it fires.

## Shape of the fix (not yet decomposed)

The greenfield answer is that an unattended body write should be one of two
things and never a third:

1. an **append** below a marked generated region, or
2. a **targeted splice** into a delimited block the writer owns,

with a wholesale replace reserved for creates, where there is no prior body to
lose. A shared body-write helper is the obvious carrier, since both sites want
the same three guarantees (frontmatter fence intact, prior authored content
preserved, rollback on failure) and `dispatch-eval-finding` has already written
two of the three by hand.

Open, for decomposition: whether the delimiter is a marker comment pair or the
first `##` heading; and whether existing generated bodies need a one-time
migration to carry the marker, or the helper can treat an unmarked body as
wholly authored and refuse to touch it (the fail-safe reading, and probably the
right one).

## Provenance

Found by the per-site write-site classification recorded on
`tactic-finding-search-all-producers`, which measured 47 write calls across 27
callers. That node holds the full roster; this one holds the defect.
