#!/usr/bin/env bash
set -euo pipefail

# Run `npm ci` with the same fetch-retry envs and 3-attempt backoff that
# ensure_deps() uses, so CI steps that call npm ci directly (bypassing
# ensure_deps) survive transient ECONNRESET failures on a cold npm cache.
# Unlike ensure_deps, this installs unconditionally in the current directory
# (no node_modules guard, no REPO_ROOT/cd) — CI checkouts always need a clean
# install.

export npm_config_fetch_retries=5
export npm_config_fetch_retry_mintimeout=20000
export npm_config_fetch_retry_maxtimeout=120000
export npm_config_fetch_timeout=600000

attempt=1
while [ "$attempt" -le 3 ]; do
  if [ "$attempt" -gt 1 ]; then
    echo "npm-ci-with-retry: npm ci attempt $attempt/3" >&2
  fi
  if npm ci; then
    exit 0
  fi
  case "$attempt" in
    1) sleep 5 ;;
    2) sleep 15 ;;
  esac
  attempt=$((attempt + 1))
done
echo "npm-ci-with-retry: npm ci failed after 3 attempts" >&2
exit 1
