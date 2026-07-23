---
id: tactic-realign-email-provider
kind: tactic
statement: Choose the owned domain and fee-aligned email provider for the
  communications re-alignment
owner: human
status: delegated
parent: null
rationale: "Split 2026-07-11 by /align-tactics round 1 from the retained draft
  tactic-realign-email: the provider-and-domain decision is an author call
  (vendor-alignment judgment, cost, household constraints), chunked to one
  sitting; tactic-realign-email executes it."
reading: null
gap: null
serves:
  - strategy-realign-attachments
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
  reason: "Author decision, one sitting of at most 30 minutes: pick the owned
    domain (an already-owned domain qualifies) and the fee-aligned mail provider
    for the email re-alignment of delegation-communications. Criteria per the
    strategy: the vendor's business is the fee, and the terms are portable —
    mail on an owned domain, standard protocols (IMAP/JMAP; CalDAV/ICS for the
    calendar slice folded into the record), plain export. Candidates worth
    comparing: Fastmail, mailbox.org, Migadu, Proton (note Proton's bridge
    weakens open-protocol portability)."
  since: 2026-07-11
  recommendation: Record the outcome as a dated clarification on
    strategy-realign-attachments (domain, provider, why), then complete this
    tactic — that unblocks tactic-realign-email, the cutover.
pace_exempt: false
rounds: null
attributes: {}
---
# Choose the owned domain and fee-aligned email provider for the communications re-alignment

Born-parked human gate, split 2026-07-11 by /align-tactics round 1 from the
retained draft tactic-realign-email. The decision — which owned domain, which
fee-aligned provider — is the author's vendor-alignment judgment; the cutover
(tactic-realign-email, blocked_by this tactic) executes whatever is decided
here.

## What to decide

- The domain: an already-owned domain qualifies; the point is that the
  address survives any later provider swap as a DNS change.
- The provider: a vendor whose business is the fee, on portable terms —
  standard protocols (IMAP/JMAP; CalDAV/ICS for the calendar slice
  delegation-communications folds in), plain export, no lock-in surface.

## What completion means

Record the outcome (domain, provider, why) as a dated clarification on
strategy-realign-attachments, then complete this tactic — that unblocks the
cutover.
