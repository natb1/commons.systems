---
id: strategy-autonomous-execution
kind: strategy
statement: Run tactical execution through an owned autonomous dispatch chain
owner: human
status: codified
parent: strategy-owned-orchestration
rationale: >-
  The dispatch workflow is a project in its own right and carries its intentions
  here like any other. The autonomous chain — issue to plan to implement to
  review to QA — converts tactical execution into strategic attention: intent
  enters as issues, the chain does the tactical work, and the human engages at
  escalation points rather than in every step. The office-hours app is its
  observability surface: backlog runway, capacity band, escalations, and the
  intention tree itself.


  The whole chain is skills and scripts in the repo, forkable and locally run —
  no platform runtime, per its parent strategy-owned-orchestration. That makes
  it the artifact most distinctive for practitioner distribution: dual-tier in
  the strategy-progressive-validation sense, the author's daily development tool
  and the thing a practitioner would most plausibly fork.


  That hand-off only holds if the chain runs unattended: the daemon must keep
  ticking while the human is away — logged out, no interactive session — which
  is what makes "engage only at escalation points" real rather than "engage only
  while a terminal happens to be open".
reading: null
gap: null
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: What makes unattended execution safe at the harness layer?
    answer: "A composite invariant spanning two config systems that no single file
      states: (a) Bash runs sandboxed by default with the write-allowlist
      confined to the git substrate (.bare, worktrees) while denyWithinAllow
      makes agent-behavior config — .claude/skills/, hooks, settings.json, .git
      — read-only even to an approved session (.claude/settings.json); (b) the
      PreToolUse hook auto-approves any script under .claude/skills/*/scripts/
      by path convention (.claude/hooks/approve-workflow-commands.sh), which is
      safe only because of (a): a session that could write that tree could mint
      its own approvals. Neither half is safe without the other; changing either
      requires re-checking the pair. Recorded 2026-07-07 interview."
  - question: Why do the dispatch lifecycle hooks swallow errors (trap-all, exit 0)
      when the code-style rule says clear errors over defensive fallbacks?
    answer: "A deliberate, reasoned inversion of the repo's own default: a broken
      hook must never wedge every session, block prompt submission, or halt
      session start, so lifecycle hooks fail open to passthrough with
      degradation recorded via stderr plus durable label/sidecar state. The one
      exception is worktree-create, which is allowed to fail (with
      registered-worktree rollback). The approval hook fails open only to a
      permission prompt, never to allow. Recorded 2026-07-07 interview."
  - question: What keeps the chain from suppressing its own failure signals?
    answer: "Test integrity (.claude/rules/test-integrity.md): a failing test is
      never weakened, skipped, or deleted by an autonomous session — fix the
      code or escalate to office-hours; there is no self-serve escape hatch.
      This is what keeps CI signal trustworthy when most merges see no human
      review — a load-bearing condition of the chain, not a style preference.
      Human override-merge skips only pre-merge review, never QA. Recorded
      2026-07-07 interview."
  - question: How do secrets reach the chain?
    answer: "Secrets never live in the repo or Claude-readable config: they resolve
      at runtime from the GPG-encrypted pass store, and the gpg-agent cache is
      warmed only interactively by the human — auto-warming from within a
      session is deliberately out of scope. Every secret-needing workflow (e.g.
      budget parse jobs) is therefore structurally semi-autonomous. It looks
      like a missing feature; it is a security posture, recorded so a future
      session does not fix it. Recorded 2026-07-07 interview."
  - question: Are PR preview deploys part of the autonomous chain?
    answer: "No — preview capability is retained, but author-requested only. The
      automatic preview-and-smoke job (.github/workflows/pr-checks.yml: per-app
      Firebase preview channels + smoke + bot comment on every PR, with
      merge-time cleanup in prod-deploy.yml) is to be removed from the dispatch
      workflow; a dedicated skill performs on-demand preview deploys when the
      author explicitly asks — for example while reproducing an
      office-hours-parked QA finding. Every-PR previews spend deploy minutes,
      hosting-channel quota, and credential exposure on artifacts the autonomous
      path never looks at. Change drafted at tactic-preview-deploy-on-demand.
      Recorded 2026-07-07 interview."
  - question: How is CI verification kept fast enough for the autonomous chain?
    answer: "Change-scoping is a standing requirement, not an optimization to be
      traded away: PR verification and prod deploys run only against apps a diff
      actually reaches (get-changed-apps.sh change detection; prod deploys diff
      from the last-prod-deploy tag so a failed deploy retries from the last
      successful marker, workflow_dispatch as the deploy-everything override,
      paths-ignore skipping non-app paths). Scoping correctness is load-bearing
      — an incomplete dirty map ships untested code — which is what
      tactic-ci-change-detection-transitive fixes; the answer to a detection gap
      is completing the map, never abandoning scoping for test-everything.
      Recorded 2026-07-07 interview."
  - question: Does the backlog-drain success signal prove the autonomous chain is
      running unattended?
    answer: No. An interactive `claude agents` invocation spawns its own transient
      daemon (a child of that process, tagged --origin transient) that keeps
      background jobs running; on 2026-07-08 this masked a dead managed
      dispatch-claude-daemon.service for roughly a day. So durability needs a
      distinct liveness observable on the managed lingering daemon, read while
      no interactive session is substituting for it. Recorded 2026-07-08
      interview.
  - question: Is running a managed daemon about pinning the chain to the latest
      claude-code binary?
    answer: No — the transient daemon already re-execs the current claude binary on
      each launch, so it is never stale; it is the managed systemd daemon that
      must be restarted onto the new store path after an upgrade (tracked
      separately by tactic-mainqa-dispatch-daemon-restart). The reason to run a
      managed lingering daemon is unattended durability across logout, a facet
      distinct from version-pinning. Recorded 2026-07-08 interview.
  - question: What must "keeps ticking while I'm away" survive?
    answer: Logout and the absence of any interactive session — persistence via
      systemd linger (users.users.n8.linger = true), independent of an
      interactive claude agents process whose transient daemon dies with it.
      Surviving host reboot and machine sleep / network drop are explicitly out
      of scope for this requirement. Recorded 2026-07-08 interview.
tooling_goals:
  - kind: sensor
    statement: a managed dispatch daemon liveness sensor that reports whether the
      lingering dispatch-claude-daemon.service is up and ticking unattended,
      distinguishing it from a transient (--origin transient) daemon spawned by
      an interactive claude agents session
success_signal:
  observable: attention economics — the managed lingering dispatch daemon drains
    the backlog unattended (across logout, with no interactive claude agents
    session substituting a transient daemon) while human escalations stay
    bounded
  sensor: the office-hours dashboard (backlog runway, capacity band, escalation
    queue) plus a managed-daemon liveness check that distinguishes the lingering
    user unit from a transient interactive daemon
  threshold: the managed daemon runs continuously across logout and backlog runway
    stays inside the capacity band without escalation volume exceeding
    office-hours capacity
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - frontier-agent access remains economical at individual scale
    - escalation volume stays within office-hours capacity
    - "the sandbox/approval-boundary coupling holds: agent-behavior config stays
      read-only to sessions while skill scripts are auto-approved by path"
    - "the chain cannot suppress its own failure signals: test integrity is
      enforced — fix or escalate, never weaken"
    - the dispatch daemon runs as a lingering systemd user service
      (users.users.n8.linger = true), persisting across logout — not a transient
      daemon tied to an interactive claude agents session
---
# Run tactical execution through an owned autonomous dispatch chain
