---
id: tactic-review-sitting-code-review-lock-design
kind: tactic
statement: "Office-hours review sitting: re-validate the flock-based locking
  mechanism recorded on strategy-token-economy (2026-08-13) and carried by
  tactic-code-review-detached-node-lock — the author delegated the design choice
  to Claude and holds it on trust, not on verification"
owner: human
status: raw
parent: null
rationale: "Created 2026-08-13 by the /align round that raised the built-in
  /code-review from `low` to `high`, under the align deferral mechanics: every
  deferral produces exactly one review item, born parked, landed in the same
  graph-commit as the record it enrolls, and naming the enrolled node's id so
  the coverage sensor (tactic-review-curriculum-coverage-sensor) can derive
  frontier linkage mechanically. Enrolled nodes: strategy-token-economy (the
  clarification carrying the mechanism) and
  tactic-code-review-detached-node-lock (the carrier that would build it). No
  other deferral occurred in that round — every other author answer was either a
  plain acceptance or the author's own ruling, including two that overrode
  Claude's recommendation."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked at record time as the curriculum-frontier entry for content
    the author accepted on trust rather than endorsing. In the 2026-08-13 /align
    round the author declined the offered options for how a detached
    /code-review run holds its node and instead delegated the choice —
    'Recommend the best greenfield locking mechanism' — so the recorded
    mechanism is Claude's articulation, not an author-verified decision. What is
    held on trust: that a kernel-released flock held by the detached child is
    the best greenfield mechanism, on the argument that it delegates
    release-exactly-when-the-holder-dies to the kernel while a
    pid-plus-timestamp sidecar needs staleness heuristics and carries a
    pid-reuse window, a heartbeat needs a second process that can itself die,
    and a graph-layer lock needs a reaper, would strand a node forever when the
    child dies, and puts runtime machinery in the graph that condition 4 keeps
    out. Two limits were recorded rather than buried and are the natural agenda
    for the sitting: flock is advisory, so it binds only claimers that check and
    a human entering the worktree by hand bypasses it; and flock availability
    plus setsid fd-inheritance inside a dispatch worktree are UNVERIFIED. This
    is a text-less deferral — Claude's own comparative analysis, with no
    grounding tradition text — so it enrolls as an office-hours sitting rather
    than a reading chunk."
  since: 2026-08-13
  recommendation: Read strategy-token-economy's 2026-08-13 clarification on what
    holds the node during a detached run, then decide whether the flock
    mechanism survives your own reading against the three alternatives it
    declined. If tactic-code-review-detached-node-lock has by then measured
    flock availability and setsid fd-inheritance in a dispatch worktree, take
    that measurement as the sitting's evidence; if it has not, the sitting can
    resolve to requiring that probe before the mechanism is built. Either ratify
    the mechanism with a dated clarification, or amend it and re-plan the
    carrier.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Office-hours review sitting: re-validate the flock-based locking mechanism recorded on strategy-token-economy (2026-08-13) and carried by tactic-code-review-detached-node-lock — the author delegated the design choice to Claude and holds it on trust, not on verification
