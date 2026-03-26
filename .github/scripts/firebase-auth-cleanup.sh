#!/usr/bin/env bash
# Remove temp credentials created by firebase-auth.sh.
# Reads CREDS_FILE set via GITHUB_ENV in the auth step.
set -euo pipefail
rm -f "${CREDS_FILE:-}"
