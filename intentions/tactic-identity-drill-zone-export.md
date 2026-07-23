---
id: tactic-identity-drill-zone-export
kind: tactic
statement: "Identity-root drill, export half: export every Cloudflare DNS zone
  into owned custody"
owner: human
status: delegated
parent: null
rationale: "Half of the drill strategy-exercise-recovery-paths names for
  delegation-identity-root: a standard zone export, exercisable today with no
  second custodian required. delegation-identity-root's recovery_path is
  'registrar transfer plus standard zone export' and its last_exercised is null;
  this half proves the export leg. The record's last_exercised flips when both
  halves (this and tactic-identity-drill-break-glass) have been walked."
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-exercise-recovery-paths
blocked_by: []
office_hours:
  reason: "Author-only: requires the author-held Cloudflare credentials — the
    exact custody surface the drill exercises. Under 30 author-minutes."
  since: 2026-07-11
  recommendation: From the Cloudflare dashboard (or API), export each owned zone
    (BIND-format zone file); store the exports in owned custody beside the
    pass/GPG store plus one offline copy. While in the dashboard, note each
    domain's registrar-transfer lock state — that is the 'partially gated' leg
    of the record's irreversibility. Record friction/time in a dated note; flip
    delegation-identity-root's last_exercised only when
    tactic-identity-drill-break-glass also completes.
pace_exempt: false
rounds: null
attributes: {}
---
# Identity-root drill, export half: export every Cloudflare DNS zone into owned custody
