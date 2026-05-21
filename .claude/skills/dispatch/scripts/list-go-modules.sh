#!/usr/bin/env bash
set -euo pipefail

# Print each Go module's directory (one per go.mod found in the repo),
# relative to the repo root, sorted. The go-tests CI job and detect-changes.sh
# both consume this, so the change gate and the test runner agree on the
# module set from a single definition — adding a Go module needs no edit here.
cd "$(git rev-parse --show-toplevel)"
find . -name go.mod -not -path './node_modules/*' \
  -exec dirname {} \; | sed 's|^\./||' | sort
