#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

WT_PATH="$(git rev-parse --show-toplevel)"
echo "Cleaning up QA processes for worktree: $WT_PATH"
kill_worktree_processes "$WT_PATH"
cleanup_stale_hub
echo "Done."
