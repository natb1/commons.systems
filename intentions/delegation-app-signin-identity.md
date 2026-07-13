---
id: delegation-app-signin-identity
kind: delegation
statement: App sign-in identity delegated to GitHub OAuth via Firebase Auth
owner: human
status: codified
parent: null
rationale: "Every deployed app signs in exactly one way: GitHub OAuth through
  Firebase Auth (packages/authutil hardcodes GithubAuthProvider). Sign-in is the
  only path to household-shared media and author drafts, so every household
  member needs a GitHub (Microsoft) account to reach family attachments — an
  imported requirement the ledger should carry. This is distinct from
  delegation-github's code-hosting scope: that record's recovery path (re-host
  git) does not cover login identity. Authorization itself is deliberately
  provider-agnostic — email-based group membership (memberEmails) — so the
  capture is confined to the sign-in step. Trajectory: retiring.
  strategy-firebase-demo-saas records all Firebase production use as deprecated
  in direction, with auth mostly redundant under local-first; the sign-in
  surface shrinks as user data migrates to local-first files readable without
  any account, and the demo app becomes the remaining consumer. Recorded
  2026-07-07 by the /align-strategy comprehensive code review."
reading: null
gap: null
serves:
  - strategy-household-shared-attachments
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
  delegatee: GitHub (Microsoft), brokered by Firebase Auth (Google)
  delegated: app sign-in for all deployed apps — the only login path to
    household-shared media and author drafts
  origin: chosen
  divergence:
    level: low
    imported:
      - a GitHub account requirement for every household member who reaches
        shared media
      - GitHub OAuth terms and availability
      - Firebase Auth as the OAuth broker
    contradictions:
      - household members must hold a developer-platform account to reach family
        attachments — friction against the household-consent posture this
        delegation serves
  irreversibility:
    recovery_path: authorization is email-based and provider-agnostic
      (memberEmails); swapping or adding a provider is an authutil code change
      plus user re-auth — no data migration
    recovery_cost: low; days — the provider is hardcoded in one shared package
      (packages/authutil/src/firebase-auth.ts)
    gated: false
    last_exercised: null
  classification: platform
  non_delegable_floor: authorization stays email-based and provider-agnostic;
    local-first user data stays readable without any sign-in
  review_trigger: the local-first migration removing an app's auth surface; GitHub
    OAuth policy changes hostile to individual-scale or household use
  last_assessed: 2026-07-07
  household:
    shared: true
    basis: The rationale states sign-in is the only path to household-shared media
      and author drafts, and every household member needs a GitHub account to
      reach family attachments.
    consent: []
    preferences: []
---
# App sign-in identity delegated to GitHub OAuth via Firebase Auth
