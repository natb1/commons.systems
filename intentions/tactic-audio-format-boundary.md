---
id: tactic-audio-format-boundary
kind: tactic
statement: "Unify the audio format boundary: aac is accepted by the legacy cloud
  MIME map but absent from the AUDIO_FORMATS union"
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review: the catalog
  restricts to a closed union of DRM-free formats (mp3, m4a, flac, ogg, wav in
  audio/src/types.ts) enforced at every boundary, but the legacy cloud MIME map
  (audio/src/storage.ts) still accepts aac — a format that cannot then
  round-trip the app's own boundaries. Decide: add aac to the union or drop it
  from the map. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-recover-attention
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
attributes: {}
---
# Unify the audio format boundary: aac is accepted by the legacy cloud MIME map but absent from the AUDIO_FORMATS union
