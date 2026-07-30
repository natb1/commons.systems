---
id: tactic-park-node-clear-park-base-pin-dedup
kind: tactic
statement: park-node and clear-park carry byte-identical --base pin-resolution
  blocks (manifest-file branch, <id>=<sha> pair branch, bare-sha branch, 40-hex
  validation, and the BASE_SUPPLIED empty-value guard) that have already drifted
  once in spirit — the guard had to be hand-applied to both call sites — so
  extract one sourced helper both scripts call
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# park-node and clear-park carry byte-identical --base pin-resolution blocks (manifest-file branch, <id>=<sha> pair branch, bare-sha branch, 40-hex validation, and the BASE_SUPPLIED empty-value guard) that have already drifted once in spirit — the guard had to be hand-applied to both call sites — so extract one sourced helper both scripts call

## Provenance

- **Source:** review-fix pass on PR #2988 (`tactic-clear-park-repo-targeting-guard`), finding `residue-1` (code-review lens, residue phase).
- **Location:** `packages/intentionsutil/scripts/clear-park:104` and the identical block in `packages/intentionsutil/scripts/park-node`.
- **Failure scenario:** `park-node` and `clear-park` now each carry a ~34-line `--base` resolution block — the leading-flags-only parse arms plus the manifest-file branch, `<id>=<sha>` branch, bare-sha branch, 40-hex validation, and the `BASE_SUPPLIED` empty-value guard — differing only in the script name inside the error strings. This violates the norm the same change set states for `graph-commit`, where `add_base_pair`/`parse_base_arg` were refactored into `add_blob_pair`/`parse_blob_arg` precisely so `--base` and `--expect` "share one parser instead of maintaining two copies that can drift." The copies have already drifted once in spirit: the empty-value guard had to be applied twice by hand this same PR. `resolve-park` is the obvious next copy if it ever gains a `--base`.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — Lane A (`code-review`) residue finding, dispositioned `Deferred` by the residue phase without a separate verify pass (Lane A findings are pre-vetted by the built-in `/code-review` skill's own internal review).
- **Recommended fix:** Extract a sourced helper (e.g. `packages/intentionsutil/scripts/lib-base-pin.sh`) exposing `resolve_base_pin <script-name> <base-arg> <node-id>` that echoes the resolved 40-hex sha or exits 2 with the script-name-prefixed message, sourced by both `park-node` and `clear-park`. Harness prerequisite: `packages/intentionsutil/scripts/test-park-node.sh`'s `make_clone` seeds each clone by copying specific script files into `packages/intentionsutil/scripts/`. Any new sourced file must be added to that copy list (and to `test-graph-commit.sh`'s equivalent if it grows a dependency), or every `park-node` / `clear-park` case goes red. Verify with `packages/intentionsutil/scripts/test-park-node.sh` and `packages/intentionsutil/scripts/test-graph-commit.sh`, both registered in CI.
- **Source PR:** #2988
