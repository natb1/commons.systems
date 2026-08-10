---
id: delegation-identity-root
kind: delegation
statement: The identity root delegated to Cloudflare — domains, DNS, and the
  credentials that control them
owner: human
status: codified
parent: null
rationale: "Cloudflare holds the registrations and DNS for the owned domains;
  local pass/GPG holds the secrets; the Google account root (audited with
  delegation-communications) sits behind several vendor logins. This record
  exists because the identity root gates every other recovery path: owned
  domains are what make strategy-realign-attachments' provider swaps a DNS
  change, and account custody is what every re-host and export assumes. The
  attachment itself is low-divergence — a fee-aligned vendor on portable terms
  (registrar transfer, standard zone export) — so the risk concentrates on the
  irreversibility axis: lockout or loss of the root is not one more capture, it
  is loss of the mobility substrate itself. Axis resolution
  (tactic-delegation-classification-derivation, 2026-08-04): recovery_cost
  resolved to `moderate` — the recorded assessment was days: transfer locks and
  DNS propagation, with no data re-formatting."
reading: null
gap: null
serves: []
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
attributes:
  delegatee: Cloudflare (registrar and DNS); local pass/GPG for secrets
  delegated: domain registrations, DNS zones, and custody of the credentials that
    control them
  origin: chosen
  divergence:
    level: low
    imported:
      - terms of service
      - pricing
    contradictions: []
  irreversibility:
    recovery_path: substitute — registrar transfer plus standard zone export
    recovery_cost: moderate
    gated:
      level: partial
      note: a transfer runs through the account being recovered from
    last_exercised: null
  non_delegable_floor: custody of the domains and the root credentials — losing
    the root gates every other recovery path in this graph
  review_trigger: Cloudflare terms or pricing changes; any lockout incident on an
    account root; registrar-transfer policy changes
  last_assessed: 2026-07-02
  household:
    shared: false
    basis: Domain registrations and DNS for the owned project domains, held as
      author infrastructure; not a household-shared attachment.
    consent: []
    preferences: []
---
# The identity root delegated to Cloudflare — domains, DNS, and the credentials that control them
