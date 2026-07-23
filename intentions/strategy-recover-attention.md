---
id: strategy-recover-attention
kind: strategy
statement: Recover attention allocation with owned reading and listening tools
owner: human
status: codified
parent: strategy-recover-author-autonomy
rationale: >-
  The domain strategy aimed at the graph's motivating specimen: take back what
  reaches my attention from services whose intent replaced mine
  (delegation-attention-services). The consumer-side artifacts are print — a
  local-first PDF/EPUB reader, library, and booklet imposition tool; read and
  bind your own books without a reader app that tracks your pages — and audio —
  a local-first player for long-form listening (podcasts, lectures, audiobooks);
  listen without a platform deciding what you hear next.


  The honest current state, stated rather than smoothed: print carries the
  author's daily reading; audio is early and has not yet displaced platform
  listening. That asymmetry is the working edge of this strategy, not a footnote
  — the recovery is real exactly as far as the owned tools actually carry the
  attention.
reading: reading defaults to owned tools (print carries the author's daily
  reading); listening has not displaced platform services
gap: reading "reading defaults to owned tools (print carries the author's daily
  reading); listening has not displaced platform services" does not meet
  threshold "reading and listening both default to owned tools; platform
  services are deliberate exceptions, not defaults"
serves: []
recovers:
  - delegation-attention-services
clarifications:
  - question: Why do the reader/player apps ship PWA manifests but no service worker?
    answer: "The manifests exist chiefly so an installed PWA persists the File
      System Access folder permission across browser restarts — not for offline.
      An offline app shell is deliberately deferred: service-worker
      precache/invalidation is a maintenance tar pit, and the ownership claim is
      carried by the files themselves (budget data stays readable via budget-etl
      dump without the app at all). Revisit if offline reading/listening becomes
      a real use pattern; until then no-SW is a decision, not an omission.
      Recorded 2026-07-07 interview."
  - question: How do the owned tools handle cloud media and player state?
    answer: Cloud media is fetched whole into a shared 500 MB LRU IndexedDB blob
      cache (cleared on sign-out) rather than streamed — one egress per item and
      offline-ish availability once cached; ranged/MediaSource streaming is the
      known better shape if long-form file sizes demand it. Persisted queue and
      playback position are deliberately local-only in the .commons-audio
      sidecar — there is no server-side listening log, a privacy posture most
      players get wrong, at the cost of no cross-device position sync. Recorded
      2026-07-07 interview.
  - question: What product boundaries keep the owned reader/player tools
      ownership-preserving?
    answer: "Three standing rules found consistently in the code and confirmed at
      interview: every catalog item is restricted to DRM-free open formats
      (epub/pdf/image-archive; mp3/m4a/flac/ogg/wav) and carries a one-click
      download of the exact original bytes; print items may carry a markdown
      companion with download/copy actions so a plain-text form stays available;
      and local on-disk folders are first-class equals of the cloud library
      behind one shared MediaSource contract (paged union in a single cursor
      space), so the cloud is optional rather than primary. Recorded 2026-07-07
      interview."
tooling_goals: []
success_signal:
  observable: the share of the author's reading and listening attention carried by
    owned tools rather than engagement-funded services
  sensor: owner review at office-hours
  threshold: reading and listening both default to owned tools; platform services
    are deliberate exceptions, not defaults
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: Office-hours review of strategy-recover-attention is blocked on the
    author defining and implementing the audio critical path (a critical path to
    playing a gym playlist from the phone via the owned audio player). The
    remaining signal-path item — owned audio player displacing platform
    listening — cannot advance until that critical path is defined in a future
    requirement-discovery office-hours session and then implemented.
    Requirement-discovery work; a human must define the path.
  since: 2026-07-23
  recommendation: Define the gym-playlist-from-phone critical path (playing a gym
    playlist from the phone via the owned audio player) in a future
    requirement-discovery office-hours session, then plan and implement it.
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - open formats (PDF, EPUB, RSS, plain audio files) remain obtainable outside
      platform apps
---
# Recover attention allocation with owned reading and listening tools
