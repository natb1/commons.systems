---
id: tactic-realign-email
kind: tactic
statement: Move email to an owned domain at a fee-aligned provider
owner: human
status: delegated
parent: null
rationale: "Finalized 2026-07-11 by /align-tactics round 1 from the
  /align-strategy-retained draft of the same id (split: provider/domain decision
  to tactic-realign-email-provider; coverage recording to
  tactic-record-email-realignment). The canonical first re-alignment: an owned
  domain preserves full mobility (a later provider swap is a DNS change) while
  swapping an engagement-funded delegatee for one whose business is the fee.
  Lowers delegation-communications' divergence now and stages a later recovery."
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
blocked_by:
  - tactic-realign-email-provider
office_hours:
  reason: "Author execution, one sitting of at most 30 minutes: create the mailbox
    at the chosen provider, point the domain's MX/SPF/DKIM/DMARC records, and
    verify send and receive on the new address. Message-history migration and
    per-login address updates are a gradual long tail, explicitly out of this
    chunk — the delegatee swap is complete at cutover."
  since: 2026-07-11
  recommendation: On completion, record provider, domain, and cutover date as a
    dated clarification on strategy-realign-attachments —
    tactic-record-email-realignment reads those facts to write
    delegation-communications' attributes.realignment entry. The cutover fires
    the record's review_trigger ('re-alignment per
    strategy-realign-attachments'); the two-axis reassessment of
    delegation-communications is a separate author review, not part of this
    chunk.
pace_exempt: false
rounds: null
attributes: {}
---
# Move email to an owned domain at a fee-aligned provider

Born-parked human gate, finalized 2026-07-11 by /align-tactics round 1 from
the /align-strategy-retained draft of the same id. This is the strategy's
canonical first re-alignment, executed by the author: the provider and domain
were fixed by tactic-realign-email-provider (this tactic is blocked_by it).

## The cutover (one sitting, ≤30 minutes)

Create the mailbox at the chosen provider, point the domain's
MX/SPF/DKIM/DMARC records, verify send and receive on the new address.
Message-history migration and per-login address updates are a gradual long
tail, explicitly out of this chunk — the delegatee swap is complete at
cutover.

## What completion means

Record provider, domain, and cutover date as a dated clarification on
strategy-realign-attachments — tactic-record-email-realignment reads those
facts to write delegation-communications' attributes.realignment entry and
land the threshold-met reading. The cutover also fires the record's
review_trigger; the two-axis reassessment of delegation-communications is a
separate author review, not part of this chunk.
