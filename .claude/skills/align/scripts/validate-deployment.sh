#!/usr/bin/env bash
# validate-deployment.sh — pre-interview deployment sanity check for the
# /align skill funnel ("Validate deployment" step, .claude/skills/align/SKILL.md).
# Confirms the tooling actually works in this checkout BEFORE interviewing
# anyone. Performs three LOCAL checks — no `gh` calls, no network access:
#
#   1. Workspace installed — `npm test --prefix packages/intentionsutil`.
#      FATAL on failure: the intentionsutil workspace is not installed (tests
#      fail, or `node --import tsx/esm` cannot resolve). Remediation: run `npm ci` at the
#      repo root and rerun this script.
#   2. Graph clean — `node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
#      "$REPO_ROOT/intentions"`. The store directory is a REQUIRED argument
#      (strategy-graph-native-dispatch clarification 194/242): passing it
#      explicitly is what makes a missing/unreadable intentions/ a loud failure
#      rather than an empty node list validated as clean.
#      FATAL on failure: dangling refs, cycles, or a schema violation in the
#      `intentions/` graph (or a missing/unreadable `intentions/` directory).
#      The exact underlying error is printed; do not proceed to interview over
#      a broken store.
#   3. Router heartbeat — `systemctl --user is-active dispatch-claude-daemon.service`
#      (Linux deployments; the daemon hosts the dispatch tick). NON-FATAL: an
#      inactive (or absent, e.g. non-systemd/non-Linux) daemon does not block
#      the interview — the interview itself does not need the daemon — but the
#      script prints a clear note that nothing dispatches until the heartbeat
#      is wired, pointing at the home-manager module (nix/home/claude-code.nix)
#      and the instance template (examples/office-hours-nate/flake.nix).
#
# Usage: .claude/skills/align/scripts/validate-deployment.sh
# Run from anywhere inside the repo; resolves the repo root itself via
# `git rev-parse --show-toplevel` and runs each check from there.
#
# Exit-code contract:
#   0 — checks 1 and 2 both passed (regardless of check 3's daemon status).
#   1 — check 1 (workspace installed) failed.
#   2 — check 2 (graph clean) failed.
#   (Check 3 never affects the exit code — it is non-fatal by design.)
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "validate-deployment: not inside a git repository — cannot resolve repo root" >&2
  exit 1
}
cd "$REPO_ROOT"

overall_rc=0

echo "=== 1/3: Workspace installed (npm test --prefix packages/intentionsutil) ==="
if npm test --prefix packages/intentionsutil; then
  echo "validate-deployment: workspace installed — OK"
else
  echo "validate-deployment: FATAL — packages/intentionsutil workspace is not installed (tests failed, or node --import tsx/esm could not resolve). Run 'npm ci' at the repo root ($REPO_ROOT) and rerun this script." >&2
  overall_rc=1
fi
echo

echo "=== 2/3: Graph clean (node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts \"$REPO_ROOT/intentions\") ==="
if node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts "$REPO_ROOT/intentions"; then
  echo "validate-deployment: graph clean — OK"
else
  echo "validate-deployment: FATAL — the intentions graph failed validation (dangling refs, cycles, schema violation, or a missing/unreadable intentions/ directory). See the validate-graph.ts output above for the exact error. Do not proceed to interview over a broken store." >&2
  # A workspace-install failure already dominates the exit code; only escalate
  # to 2 when check 1 passed but check 2 failed, so the more fundamental
  # failure (1) is what callers see when both are broken.
  if [[ "$overall_rc" -eq 0 ]]; then
    overall_rc=2
  fi
fi
echo

echo "=== 3/3: Router heartbeat (systemctl --user is-active dispatch-claude-daemon.service) ==="
if ! command -v systemctl >/dev/null 2>&1; then
  echo "validate-deployment: NOTE (non-fatal) — 'systemctl' is not available on this system (non-systemd or non-Linux deployment), so the dispatch-claude-daemon heartbeat cannot be checked here. The interview itself does not need the daemon, but nothing dispatches until the heartbeat is wired. See the home-manager module (nix/home/claude-code.nix) and the instance template (examples/office-hours-nate/flake.nix)."
elif systemctl --user is-active --quiet dispatch-claude-daemon.service; then
  echo "validate-deployment: dispatch-claude-daemon.service is active — OK"
else
  echo "validate-deployment: NOTE (non-fatal) — dispatch-claude-daemon.service is not active. The interview itself does not need the daemon, but nothing dispatches until the heartbeat is wired. See the home-manager module (nix/home/claude-code.nix) and the instance template (examples/office-hours-nate/flake.nix)."
fi
echo

if [[ "$overall_rc" -eq 0 ]]; then
  echo "validate-deployment: all fatal checks passed"
else
  echo "validate-deployment: one or more fatal checks failed (exit $overall_rc) — see FATAL lines above" >&2
fi

exit "$overall_rc"
