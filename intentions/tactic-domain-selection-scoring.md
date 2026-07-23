---
id: tactic-domain-selection-scoring
kind: tactic
statement: Draft the 2026-07 domain-selection scoring dossier — score every raw
  delegation record against strategy-domain-selection's four criteria, with a
  select-or-defer draft recommendation per record
owner: ai
status: codified
parent: null
rationale: "Minted 2026-07-11 by the /align-tactics round on
  strategy-domain-selection as the round's instrument tactic: the strategy's
  reading is null and its sensor is owner review at office-hours, which has
  never fired because no scorable dossier has ever been put in front of the
  owner. This tactic drafts that dossier from the raw records' recorded axes; it
  drafts, never decides — the select-or-defer decision is
  tactic-domain-selection-owner-review (born-parked, blocked_by this tactic),
  which is the round's validates-terminal."
reading: null
gap: null
serves:
  - strategy-domain-selection
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-domain-selection-scoring
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: e8bfd621082c91d5522fdde6bc85a01b86434ba41050391283992af28154c21f
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Draft the 2026-07 domain-selection scoring dossier — score every raw delegation record against strategy-domain-selection's four criteria, with a select-or-defer draft recommendation per record

## Context

`strategy-domain-selection`'s success signal requires every raw delegation
record scored against its four selection criteria each review cycle (threshold:
"no raw record sits unscored across a review cycle"). Its `reading` is null —
the sensor ("owner review at office-hours") has never fired, because nothing
has ever put a scorable dossier in front of the owner. This tactic is the
2026-07 round's instrument: it drafts the scoring dossier that makes the owner
review runnable. The owner decision itself is
`tactic-domain-selection-owner-review` (born-parked, `blocked_by` this tactic);
this tactic drafts, never decides. Scope derivation is the strategy's
clarification 1 (recorded 2026-07-11): every `kind: delegation` record at
`status: raw` at round time — not the rationale's standing-candidates snapshot.

## Units of work

### Unit 1 — author the scoring dossier into this node's body

**Scope**: Append a `## Scoring dossier — 2026-07 round` section to this node's
own body (`intentions/tactic-domain-selection-scoring.md`, below
`## Verification`). The diff is this one file — a state-only intentions write.

- Enumerate the in-scope records at implement time with
  `grep -l '^status: raw' intentions/delegation-*.md` — re-derive, do not trust
  this planning-time list. As of 2026-07-11 that is 8 records:
  `delegation-banking`, `delegation-cloud-backup`, `delegation-communications`,
  `delegation-connectivity`, `delegation-health-records`,
  `delegation-media-libraries`, `delegation-mobile-platform`,
  `delegation-web-analytics`.
- Open the dossier with a short preamble: the scope rule (status `raw` at round
  time, per strategy clarification 1) and the status-excluded records with
  their one-line reasons (`delegation-client-income` — refining, non-software
  recovery, strategy minted directly 2026-07-02; `delegation-knowledge-notes`
  — refining, selected 2026-07-02 into strategy-recover-knowledge).
- Per record, a `### <delegation-id>` subsection with exactly four criterion
  lines and one draft line:
  - The four criteria, from `intentions/strategy-domain-selection.md`'s
    rationale (quote its bold lead questions, don't paraphrase): (1) where is
    institutional dependency most painful for the author — business-model
    misalignment visible to the author; (2) where has agentic coding shifted
    the cost-benefit for problems the author faces; (3) where can autonomy
    plausibly be recovered — local-first viable, commoditized tech over
    network effects, open standards, no institutional coordination required
    at scale; (4) where is the demonstration most legible because the author
    genuinely uses it.
  - Score each criterion `strong` / `moderate` / `weak` / `absent`, with a
    one-sentence evidence cite drawn from the record's own frontmatter
    (`attributes.divergence`, `attributes.irreversibility`,
    `attributes.classification`, `rationale`) — the records carry first-pass
    axes precisely so this scoring needs no re-research.
  - A closing line: `Draft: select — <the recovery shape a minted strategy
    would own>` or `Draft: defer — <reason>; interim path: <the record's
    recorded interim path, if any>` (e.g. strategy-realign-attachments for
    delegation-communications; right-of-access exports for
    delegation-health-records). A deferral must be explicit and name its
    interim path where the record has one — never silent.
- Out of scope: any edit to the delegation records, to
  `strategy-domain-selection`, or to `tactic-domain-selection-owner-review`;
  any actual select/defer decision (drafts only — the owner decides at the
  review tactic); minting recovery strategies; re-assessing the records' own
  divergence/irreversibility axes.

**Recommended model**: opus

## Reuse

- The delegation records' recorded axes (`attributes.divergence`,
  `attributes.irreversibility`, `attributes.classification`) as the whole
  evidence base — `intentions/delegation-*.md`; no re-research.
- The criteria text: `intentions/strategy-domain-selection.md` rationale.
- Draft-then-ratify pattern reference:
  `intentions/tactic-readme-copy-approval.md` (born-parked gate) with the
  draft carried in the blocked tactic's body.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose checks: every record returned by
`grep -l '^status: raw' intentions/delegation-*.md` appears exactly once in the
dossier; each entry carries all four criterion lines and exactly one `Draft:`
line; every `Draft: defer` on a record with a recorded interim path names that
path; the diff against the merge base touches only
`intentions/tactic-domain-selection-scoring.md`.

## Scoring dossier — 2026-07 round

Drafted 2026-07-11 by tactic-domain-selection-scoring. This dossier scores every
delegation record that was `status: raw` at round time against
strategy-domain-selection's four selection criteria and attaches a
select-or-defer *draft* per record. It drafts only — the select-or-defer decision
belongs to the owner at tactic-domain-selection-owner-review (born-parked,
`blocked_by` this tactic). Evidence is drawn from each record's own recorded axes
(`attributes.divergence`, `attributes.irreversibility`,
`attributes.classification`, `rationale`); no record's axes were re-assessed.

**Scope rule** (strategy-domain-selection clarification 1, 2026-07-11): every
`kind: delegation` record at `status: raw` at round time — not the strategy
rationale's standing-candidates snapshot. Enumerated at implement time via
`grep -l '^status: raw' intentions/delegation-*.md`: 8 records —
delegation-banking, delegation-cloud-backup, delegation-communications,
delegation-connectivity, delegation-health-records, delegation-media-libraries,
delegation-mobile-platform, delegation-web-analytics.

**Status-excluded** (not `raw` at round time, so out of scope this round):

- delegation-client-income — `refining`; non-software recovery, a strategy was
  minted directly for it 2026-07-02 (strategy-diversify-income), so it never
  enters this software-shaped selection.
- delegation-knowledge-notes — `refining`; already selected 2026-07-02 into
  strategy-recover-knowledge.

The four criteria are strategy-domain-selection's bold lead questions, quoted
verbatim. Each is scored **strong / moderate / weak / absent** with a one-line
evidence cite; each record closes with exactly one `Draft:` line.

### delegation-banking

1. **Where is institutional dependency most painful for the author?** — moderate.
   Divergence is low-moderate: imported fee structures, product upsells, and the
   bank's data practices around transaction history, with no recorded virtue
   contradiction (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — moderate. The recoverable slice — the authoritative transaction
   record — is already owned and tractable through budget-etl and
   strategy-recover-finance's statement archive (`rationale`); custody of money
   and payment rails is not a software build.
3. **Where can autonomy plausibly be recovered?** — weak. Recovery path is
   substitute — accounts replicate at competing banks and the owned statement
   archive keeps the record portable — but the authoritative record stays gated
   at the bank and money/payment-rail custody is not individually ownable
   (`attributes.irreversibility`, classification `platform`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — moderate. The owned-ledger read is genuinely used and legible, but
   that demonstration already belongs to strategy-recover-finance; the delegated
   rails themselves have no standalone recovery demo (`non_delegable_floor`:
   reading the statements).

Draft: defer — the recoverable substance (the authoritative record) is already
owned by strategy-recover-finance, and money/payment-rail custody is not
individually recoverable; interim path: the healthy machine-readable exports
feeding budget-etl (strategy-recover-finance's standing condition).

### delegation-cloud-backup

1. **Where is institutional dependency most painful for the author?** — moderate.
   Divergence is moderate: imported storage-subscription retention and Google
   account ecosystem terms, no contradiction (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — moderate. The data is files and already local-first; substituting
   any storage target is a low-effort config/habit change, not a novel build
   (`irreversibility.recovery_cost`: low).
3. **Where can autonomy plausibly be recovered?** — strong. Recovery path is
   substitute to any storage target (another provider, owned NAS, offline
   media), the data is already local-first, gating is false, cost is low, and
   the classification is `tool` (`attributes.irreversibility`, `classification`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — moderate. The restore is genuinely relied on, but the rehearsal/demo
   already belongs to strategy-durable-owned-data (`non_delegable_floor`: the
   restore itself).

Draft: defer — the recoverable substance is already inside
strategy-durable-owned-data's redundancy design; this record keeps the Drive leg
visible and its `review_trigger` is that strategy's keep-or-replace call, not
this selection; interim path: strategy-durable-owned-data's restore rehearsals,
which bound the loss.

### delegation-communications

1. **Where is institutional dependency most painful for the author?** — strong.
   Divergence is `high` — the only record importing an explicit virtue
   contradiction: it imports advertising revenue and engagement and contradicts
   virtue-alignment-of-attachments (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — moderate. Moving email to an owned domain at a fee-aligned
   provider is tractable now and already staged by strategy-realign-attachments,
   but full recovery/self-host is not yet designed (`rationale`,
   `irreversibility.recovery_path`).
3. **Where can autonomy plausibly be recovered?** — moderate. Substitute via an
   owned domain and portable protocols where they exist (SMTP/IMAP, CalDAV/ICS),
   but message history and contacts export unevenly and account-root custody
   recovery is unassessed and partially gated (`attributes.irreversibility`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — strong. Correspondence, the address book, and calendars are in daily
   genuine use; owning the domain has an obvious before/after (`delegated`).

Draft: select — the highest-scoring candidate (high divergence with an explicit
virtue contradiction and daily, legible use); recovery shape a minted strategy
would own: an owned email domain plus portable protocols (SMTP/IMAP, CalDAV/ICS)
and account-root custody, built on strategy-realign-attachments's realignment
groundwork.

### delegation-connectivity

1. **Where is institutional dependency most painful for the author?** — weak.
   Divergence is `low`: imported pricing/bundling and traffic-management
   policies, no contradiction (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — absent. Connectivity is physical last-mile infrastructure; agentic
   coding does not make building an ISP tractable.
3. **Where can autonomy plausibly be recovered?** — weak. The substitute is
   cellular tethering or fixed wireless at degraded capacity, no second wired
   provider serves the address, and a genuine option would require moving —
   inherently institutional coordination at scale (`irreversibility.recovery_path`,
   classification `platform`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — weak. Connectivity is invisible when it works; there is no legible
   recovery demonstration.

Draft: defer — physical infrastructure inherently requires institutional
coordination and is not shifted by agentic coding, so it is not individually
recoverable; interim path: the local-first artifacts keep working offline by
design (`rationale`), which bounds the loss.

### delegation-health-records

1. **Where is institutional dependency most painful for the author?** — weak.
   Divergence is `low`: imported EHR vendor workflows and portal-mediated access
   to the author's own record, no contradiction (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — moderate. Assembling an owned record store from exports is
   tractable now, though the data volume is modest.
3. **Where can autonomy plausibly be recovered?** — weak. Substitute is periodic
   export under the right of access, but export is gated `largely` — by request
   through the party recovered from — and is not local-first by default
   (`irreversibility.gated`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — moderate. Health records are genuinely used but consulted
   infrequently; the before/after is less continuous than communications.

Draft: defer — recovery is gated largely (export by request through the
provider) and divergence is low; interim path: exercise the right of access —
periodic export of records to owned files (the record's recorded interim path).

### delegation-media-libraries

1. **Where is institutional dependency most painful for the author?** — moderate.
   Divergence is `moderate`: imported subscription retention and vendor catalog
   control, no contradiction (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — weak. Owning media is mostly a purchasing/format habit rather than
   an agentic-coding build.
3. **Where can autonomy plausibly be recovered?** — moderate. Substitute to owned
   files and local libraries is local-first-viable where content is DRM-free, but
   gated partially by DRM and proprietary formats (`irreversibility.gated`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — moderate. The libraries are genuinely used; the owned-file before/after
   is moderately legible.

Draft: defer — recovery is gated by DRM and proprietary formats and divergence is
only moderate, so the reachable slice is handled by the interim path; interim
path: strategy-realign-attachments — DRM-free purchases over streaming rental
where the format allows (the record's recorded interim path).

### delegation-mobile-platform

1. **Where is institutional dependency most painful for the author?** — moderate.
   Divergence is `moderate`: App Store gating of what may run, ecosystem lock-in
   and services push, and notification-mediated engagement, no recorded
   contradiction (`attributes.divergence`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — weak. The mobile OS and App Store are not made individually
   buildable by agentic coding; recovery is a platform switch, not a build.
3. **Where can autonomy plausibly be recovered?** — weak. The substitute is a
   platform switch to a degoogled Android, data leaves only via vendor-mediated
   exports, and it is gated partially (no iOS sideloading, vendor-owned export
   paths) — still a platform, not owned (`attributes.irreversibility`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — moderate. The phone is in heavy daily use, but the recovery demo (a
   degoogled-Android migration) is a large lift and reads as a platform swap
   rather than a clean autonomy before/after.

Draft: defer — recovery is a platform substitution (Apple → degoogled Android),
not individual ownership, and the OS/App Store is not shifted by agentic coding,
so there is no local-first path; no recorded interim path — the record's
`review_trigger` watches for App Store/iCloud policy shifts that narrow export.

### delegation-web-analytics

1. **Where is institutional dependency most painful for the author?** — moderate.
   Divergence is `moderate` and is the notable axis: engagement-metric framing of
   audience value imports the engagement-optimizer's framing (the same capture
   the attention strategies resist), plus third-party measurement on owned pages
   (`attributes.divergence`, `rationale`).
2. **Where has agentic coding shifted the cost-benefit for problems the author
   faces?** — strong. Server-log or owned privacy-respecting analytics is highly
   tractable to build now, and the sites the sensor measures are already owned
   (`irreversibility.recovery_path`).
3. **Where can autonomy plausibly be recovered?** — strong. Substitute to owned
   analytics; the sites publish unchanged without the sensor, gating is false,
   and cost is low (historical series lost, capability retained); classification
   `tool` (`attributes.irreversibility`, `classification`).
4. **Where is the demonstration most legible because the author genuinely uses
   it?** — weak. The sensor is backstage project telemetry; genuinely used by the
   project, but the before/after is legible to practitioners rather than to the
   lay audience for whom criterion 4 (strategy-show-not-tell) is written.

Draft: select — three of four criteria are moderate-to-strong and recovery is
cheap and local-first; recovery shape a minted strategy would own: owned
server-log or privacy-respecting analytics replacing the GA4/Search-Console/
PageSpeed telemetry, which also resolves the engagement-framing capture the
attention strategies resist; legibility (criterion 4) is the weak axis for the
owner to weigh.
