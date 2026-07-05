---
id: delegation-mobile-platform
kind: delegation
statement: The mobile surface delegated to Apple — iOS, the App Store, and the phone
owner: human
status: raw
parent: null
rationale: "The phone runs iOS: the mobile OS, the App Store's gating of what
  may run, notification-mediated attention, and capture and sync of photos,
  messages, and location all pass through Apple. Recorded 2026-07-02 by the
  completeness sweep (strategy-complete-ledger) — delegation-os-hardware covers
  only the dev machine, and the phone was the largest live attachment with no
  record. The notification surface is the mobile half of
  delegation-attention-services' specimen: what reaches attention on the phone
  is set by apps and their push machinery, not by the owned queue
  strategy-recover-discovery is building. A future-candidate capture, raw per
  kind-delegation, standing as a candidate input to strategy-domain-selection.
  Axes below are a first pass, not an assessment."
reading: null
gap: null
serves: []
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  delegatee: Apple (iOS, the App Store, iCloud)
  delegated: the mobile computing surface — what software may run, what reaches
    attention on the phone, and photo/message/location capture and sync
  origin: chosen
  divergence:
    level: moderate
    imported:
      - App Store gating of what may run
      - ecosystem lock-in and services push
      - notification-mediated engagement
    contradictions: []
  irreversibility:
    recovery_path: substitute — platform switch to Android (degoogled builds exist);
      data leaves via vendor-mediated exports (iCloud export, photo library
      download)
    recovery_cost: unassessed — app repurchase, migration friction, household messaging ties
    gated: partially — the export paths are the vendor's own, and iOS has no
      sideloading path
    last_exercised: null
  classification: platform
  non_delegable_floor: unassessed
  review_trigger: App Store or iCloud policy shifts that narrow export, or
    selection as a recovery domain (strategy-domain-selection)
  last_assessed: 2026-07-02
---
# The mobile surface delegated to Apple — iOS, the App Store, and the phone
