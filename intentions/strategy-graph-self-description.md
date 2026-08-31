---
id: strategy-graph-self-description
kind: strategy
statement: The graph describes itself — kind nodes are the sole schema
  authority, and drift between code and kind nodes is a guarded defect
owner: human
status: refining
parent: strategy-explicit-intent
rationale: "The 2026-07-09 full-graph review found the self-description contract
  broken one tier below the roots: SCHEMA.md documented graph rules 1-9 while
  schema.ts enforces 1-15; kind-kind's field list omitted the seven first-class
  dispatch fields (phase, execution, validates, blocked_by, office_hours,
  pace_exempt, rounds) and five common dialectic fields; 'three edge fields
  carry the graph' ignored the two validated dispatch edges; and status carried
  three kind-local meanings under a central enum claiming one. The root cause is
  two competing authorities: a package doc and the kind nodes both claim to
  define the schema, so every schema change can land in one and not the other.
  Greenfield: the kind nodes are the sole schema authority — each kind declares
  its fields, its status vocabulary, and its markdown body's function; SCHEMA.md
  is deprecated and deleted (packages/intentionsutil docs keep only a pointer to
  kind-kind); schema.ts validates from kind-node declarations where practical;
  and a mechanical drift guard in CI compares what the code enforces against
  what the kinds declare, so the next drift is a red check, not a review
  finding. This strategy also owns the serialization and derived-state doctrine
  the same review confirmed: defaults are omitted at write (a stored default is
  noise that fingerprints the authoring tool), and derived values are never
  stored (gap and delegation classification join attention as derive-on-read).
  serves is empty by the sub-strategy inheritance rule (kind-strategy): this
  node adds no virtue claim beyond its parent strategy-explicit-intent."
reading: null
serves: []
recovers: []
clarifications:
  - question: Why deprecate SCHEMA.md rather than fix it?
    answer: "Fixing it preserves the drift mechanism: two documents claiming
      authority over one schema means every future change can land in one and
      miss the other — exactly how the 2026-07-09 findings accumulated. The
      graph is self-describing by design (kind-kind is the declared entry
      point), so the kind nodes are the one home; SCHEMA.md's still-accurate
      detail moves into the kind-node bodies and the file is deleted, with the 8
      referencing files repointed (tactic-schema-md-deprecation). Recorded
      2026-07-09 interview."
  - question: What function does a node's markdown body have, per kind?
    answer: "The 'body is a cosmetic render of statement' doctrine is retired — it
      was already false for tactics (bodies carry the authoritative
      clean-session plans). Each kind node declares its body's function, and the
      body is authoritative for that declared function while never shadowing
      frontmatter: kind → normative schema/spec detail (SCHEMA.md's replacement
      home); tactic → the execution plan; strategy → settled design and
      mechanism notes (the fold-target for clarification chains that outgrow the
      dialectic record); virtue → the extended articulation of the disposition;
      tradition → reading notes (passages, verified excerpts, chunk findings);
      delegation → the audit narrative behind the axes. The general rule lives
      on kind-kind; each kind's own declaration lives on that kind node.
      Recorded 2026-07-09 interview."
  - question: How is the status field un-overloaded?
    answer: Each kind node declares its own status vocabulary and the meanings of
      its values, exactly as kinds already own attributes; the validator checks
      a node's status against its kind's declaration instead of a central enum
      (tactic-status-kind-vocabularies). Kind-local semantics — tradition's
      on-trust/verified provenance, the tactic layer's plan-written sense —
      become legitimate declarations rather than squats on a central enum that
      claims fixed cross-kind meanings it does not own. Day-one declarations
      match current stored values, so no node changes at migration. Recorded
      2026-07-09 interview.
  - question: What keeps stored state from contradicting derived state?
    answer: "Derived values are never stored — the doctrine attention already
      follows generalizes. gap: deriveGap is a total local rule, yet 31 of 47
      signal-bearing strategies stored a contradicting null; the field leaves
      the stored model and readers call deriveGap (tactic-gap-derive-on-read).
      Delegation classification: declared 'derived from the two axes' but
      stored, and the store contradicted every consistent ordering; the axes
      become enums, the derivation rule is stated on kind-delegation, and
      classification derives on read
      (tactic-delegation-classification-derivation). Recorded 2026-07-09
      interview."
  - question: What does omit-default serialization change?
    answer: "writeNode stops serializing default-valued fields (reading: null,
      recovers: [], pace_exempt: false, ...): ~3,700 frontmatter lines across
      286 nodes are pure defaults, validateNode already applies defaults on read
      so omission is lossless and already-valid today, and the two-convention
      split (explicit nulls vs omitted) merely fingerprints which tool authored
      a file. No strict validator rejects explicit defaults — normalization is
      incremental as nodes are rewritten (tactic-omit-default-serialization).
      This also stops records-not-goals kinds (traditions, virtues, kinds,
      delegations) carrying dispatch fields their kind declares meaningless.
      Recorded 2026-07-09 interview."
  - question: How do clarification cross-references become checkable?
    answer: Ordinal citations ('clarification 26') break on insertion — the off-by-N
      class recurred twice (commit 7cb64dbc; the 2026-07-09 fixes on
      strategy-graph-native-dispatch). Clarification entries gain an optional id
      slug assigned lazily (only when something cites them); citations use
      '<node-id>#<slug>' and a validate-graph rule resolves every such citation
      (tactic-clarification-citation-ids). Until the schema lands (validateNode
      currently drops unknown keys, so ids cannot be stored yet), new and
      repaired cross-references are question-anchored — they name the entry's
      question and date, never its ordinal. Recorded 2026-07-09 interview.
  - question: Are these schema changes backwards compatible with /align-strategy,
      /align-tactics, and the emulated dispatch tick?
    answer: "Verified compatible 2026-07-09, so the tactics queue for dispatch
      rather than requiring supervised implementation. gap derive-on-read:
      /align-tactics's own eligibility rule and attention.ts both already treat
      reading-null as unvalidated independently of stored gap, so behavior is
      near-identical, and validateNode tolerates (and writeNode drops) the
      legacy stored field. Omit-default: omitted fields are valid today. Status
      vocabularies and citation ids: additive. main-qa: enum addition and node
      migration must land in one PR (the validator rejects unknown phase
      values); the selector simply never matches main-qa nodes, which is the
      intent. Classification enums: enforcement and the 21-record normalization
      land in one PR. The one non-compatibility flag is procedural:
      tactic-schema-md-deprecation edits .claude/skills/align-init/SKILL.md,
      which auto-mode blocks at commit — that tactic needs the self-modification
      office-hours lane. Recorded 2026-07-09 interview."
  - question: What did the 2026-07-11 pre-decomposition sweep observe?
    answer: "The SCHEMA.md reference census grew from the interview's 8 to 11 files:
      .claude/skills/align-tactics/SKILL.md:242 and
      .claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh:65 (both
      name SCHEMA.md as a practitioner-doc example in the copy-gate exclusion
      list) and packages/intentionsutil/SEPARABILITY.md gap 5 (whose 'extend
      SCHEMA.md' remediation this strategy supersedes). Three of the eleven live
      under .claude/skills, so the self-modification office-hours lane covers
      three files, not one — handled as the born-parked gate
      tactic-align-skill-schema-pointers, which blocks
      tactic-schema-md-deprecation so no skill file ever points at a deleted
      file. Non-null stored gap values now number 16 (the review counted 9).
      schema.ts has since gained first-class office_hours.recommendation and
      Execution objects, so born-parked recommendations and plan-time
      strategy_fingerprint stamps use real fields. All immaterial to the
      decomposition shape; recorded without interrupting the round. Recorded
      2026-07-11 /align-tactics round."
  - question: Is the kind-body schema authority machine-readable (schema-as-data,
      2026-08-31)?
    answer: "(Recorded 2026-08-31 /align doctrine-alignment round.) Ratified:
      kind-node bodies carry a structured, machine-readable schema block from
      which validateGraph derives its checks; the prose remains the rationale
      authority while the block becomes the check authority. This refines, not
      contradicts, the ratified 'kind body is the single schema authority': the
      block is part of the body - what changes is that the authoritative part
      becomes machine-consumable, closing the prose/code drift seam by
      construction instead of by review vigilance. Block format, derivation
      mechanics, and migration are delegated (tactic-kind-schema-blocks),
      migrating under the projection principle (strategy-graph-native-dispatch,
      2026-08-31). (decision: author-ratified, 2026-08-31)"
tooling_goals:
  - kind: actuator
    statement: kind-declaration-driven validation — validateGraph reads status
      vocabularies, field scoping, and body-function declarations from the kind
      nodes
  - kind: sensor
    statement: CI drift guard comparing what schema.ts enforces (fields, rules,
      enums) against what the kind nodes declare
success_signal:
  observable: the schema a fresh reader derives from kind-kind and the kind nodes
    matches what schema.ts enforces
  sensor: the CI drift guard
  threshold: guard green with SCHEMA.md deleted and every code-enforced field,
    rule, and vocabulary declared on a kind node
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - kind nodes stay the sole schema authority — no second document claims
      field or lifecycle semantics
    - the drift guard runs in CI on every change touching intentions/ or
      packages/intentionsutil
---
# The graph describes itself — kind nodes are the sole schema authority, and drift between code and kind nodes is a guarded defect
