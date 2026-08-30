---
id: strategy-financial-sustainability
kind: strategy
statement: Fund the project as a managed, reversible attachment
owner: human
status: codified
parent: strategy-reversible-institution
rationale: >-
  Reaching beyond the author costs resources the author cannot supply alone;
  those resources come from institutions that contract for the project's help.
  Funding is the most dangerous ratchet tooth — its justification cycles can
  incentivize problem persistence — but it is a legitimate tooth on the same
  terms as any other: accept it when it builds validated capability, and keep it
  reversible.


  The contracting model delivers a built, forkable artifact first, then trains
  the institution's own people to maintain and extend it: the buyer ends the
  engagement as a practitioner who can leave. Paying buys speed and guidance; it
  never gates the gift. The project grows no payroll — subcontracts among
  independent practitioners, engaged per project, so when demand falls the
  coordination simply stops and the project degrades to referrals by inaction,
  not by an act of will.


  Revenue is necessary but never sufficient evidence: falling revenue is an
  honest signal to degrade; rising revenue is ambiguous (a genuine need and a
  manufactured one both produce it) and counts only alongside the tier signals —
  above all whether buyers leave with migration freedom. That the buyer leaves
  free — trained, holding a forkable artifact, owing nothing — is
  respect-for-persons content, which is why this strategy serves that virtue
  directly. Sustainability is a runway rule: monthly spend is unsustainable when
  projected runway falls below the horizon needed to reach revenue
  self-sufficiency; the default response is to slow down, not pay more. The
  runway reading itself comes from the owned budgeting pipeline —
  strategy-recover-finance supplies this strategy's sensor.
reading: null
serves:
  - virtue-alignment-of-attachments
  - virtue-respect-for-persons
  - virtue-right-livelihood
recovers: []
clarifications:
  - question: How does the round map the two-part sensor (budget app accounts plus
      the private horizon config) onto instrument and reading?
    answer: "Split at the privacy boundary. The app-side instrument
      (tactic-budget-runway-instrument) computes and displays projected runway
      in months — latest liquid net worth from computeNetWorth over
      statement-anchored accounts, divided by trailing monthly spend derived
      from the 12-week average (computeAverageWeeklySpending x 52/12) — and
      never reads the horizon. The time-to-revenue-self-sufficiency horizon
      stays in the private natb1/office-hours-nate repo, and the
      runway-vs-horizon comparison happens at office-hours when the author takes
      the reading (tactic-runway-first-reading). Default available-funds set:
      every statement-fed account in the snapshot (what computeNetWorth already
      covers); the author ratifies or narrows that set at the first reading.
      Immaterial to gating: the instrument is useful under any account-set
      choice and the ratification is built into the reading tactic. Recorded
      2026-07-11 /align-tactics round."
  - question: Why does this strategy also serve virtue-right-livelihood?
    answer: "Re-homed 2026-08-30 (author-ratified, via the legacy-null migration's
      adjacent-doctrine path — this strategy's original framing predates the
      three-state model and carried state null). The livelihood motive was
      always real and unstated: funding the project is also how the author eats,
      and hiding that flow kept every monetization decision's motivation profile
      dishonest to the capture model. The serves set is now [alignment, respect,
      right-livelihood] — a genuinely mixed profile, coherent under
      strategy-graph-mounts' decomposition corollary (one node, because the
      motivations rise and fall together here). The rationale's 'paying buys
      speed and guidance; it never gates the gift' is the strategy-level shadow
      of the pending virtue-knowledge-as-gift root — the scholastic
      wage-for-labor resolution (sell the labor, never the truth) already
      operating; when that sibling's pending review ratifies, the gift clause's
      root-level home is that node. (decision: author-ratified, 2026-08-30)"
tooling_goals: []
success_signal:
  observable: projected runway (available funds / trailing monthly spend) against
    time-to-revenue-self-sufficiency
  sensor: the budget app's accounts plus the horizon config in the private
    natb1/office-hours-nate repo
  threshold: runway stays above the self-sufficiency horizon; a breach triggers
    reassessment before continuing at current spend
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - institutions will contract for built-then-handed-over artifacts
    - independent practitioners are available to subcontract per project, so no
      payroll is ever required
---
# Fund the project as a managed, reversible attachment
