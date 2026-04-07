#!/usr/bin/env bash
# Claude Code hook: UserPromptSubmit — marks a session as active.
# Reads {session_id, cwd, ...} JSON from stdin.
set -euo pipefail
exec "$(dirname "$0")/update-session.sh" false
