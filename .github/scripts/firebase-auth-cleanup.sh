#!/usr/bin/env bash
# Remove temp credentials created by firebase-auth.sh
set -euo pipefail
rm -f "${CREDS_FILE:-}"
