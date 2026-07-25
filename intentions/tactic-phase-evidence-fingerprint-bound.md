---
id: tactic-phase-evidence-fingerprint-bound
kind: tactic
statement: Bind phase-completion evidence (phase-log entry, qa-done marker, QA
  PR comment) to the scope fingerprint it was produced under, so a re-entry that
  finds evidence from a different fingerprint re-runs the phase instead of
  ratifying it
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-25 diagnosing repeated /qa-fix sessions. A demotion
  wipes execution.markers to [] but the qa phase-log entry and the finalized QA
  PR comment SURVIVE it, so the re-entry session reads them as 'a prior session
  died before the terminal transition' and takes a transition-only pass over QA
  it never ran. This defeats the recorded net guarantee of
  strategy-graph-native-dispatch's Fingerprint & Freeze section — merge requires
  an unbroken implement/qa/review chain against the MERGE-TIME scope fingerprint
  — by reporting the chain unbroken when it was broken and papered over.
  Observed live after a false demotion: the PR #2958 re-entry transitioned with
  zero re-verification; the PR #2965 re-entry re-verified only partially. Both
  misdiagnosed the cause, concluding the prior transition 'never ran' when it
  had landed and been reverted by dispatch-graph-scope-sweep — the misdiagnosis
  is itself evidence that nothing binds the evidence to a fingerprint.
  Independent of tactic-transition-node-stamp-landed-body: that one stops the
  FALSE demotions; this one is what makes a GENUINE scope drift safe, since
  today a real drift would equally license ratifying stale QA evidence against
  changed scope."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 95
  override: null
  rationale: "Author-directed 2026-07-25 /align-strategy round ('boost both to top
    rank'): this and tactic-transition-node-stamp-landed-body rank at the top of
    normal work — above the current top tactic band (90) and the 85 band below
    it, and below the strategy-main-health emergency ceiling (boost 100), which
    the 2026-07-13 write-path guard keeps dominant and which this round does not
    disturb."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Bind phase-completion evidence (phase-log entry, qa-done marker, QA PR comment) to the scope fingerprint it was produced under, so a re-entry that finds evidence from a different fingerprint re-runs the phase instead of ratifying it
