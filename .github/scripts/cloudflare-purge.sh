#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:?Usage: cloudflare-purge.sh <app-name>}"

: "${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required}"
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"

# Domain mapping: landing uses bare domain, others use subdomain
if [ "$APP_NAME" = "landing" ]; then
  DOMAIN="commons.systems"
else
  DOMAIN="${APP_NAME}.commons.systems"
fi

# Find changed source files that produce non-hashed outputs
CHANGED=$(git diff --name-only HEAD~1 HEAD -- "${APP_NAME}/public/" "${APP_NAME}/index.html") || true

if [ -z "$CHANGED" ]; then
  echo "No non-hashed files changed for ${APP_NAME}. Skipping Cloudflare purge."
  exit 0
fi

# Map file paths to production URLs
URLS=()
while IFS= read -r file; do
  [ -z "$file" ] && continue
  # Skip content-hashed assets (defensive)
  case "$file" in */assets/*) continue ;; esac

  case "$file" in
    "${APP_NAME}/index.html")
      URLS+=("https://${DOMAIN}/" "https://${DOMAIN}/index.html")
      ;;
    "${APP_NAME}/public/"*)
      relative="${file#"${APP_NAME}/public/"}"
      URLS+=("https://${DOMAIN}/${relative}")
      ;;
  esac
done <<< "$CHANGED"

# Deduplicate
readarray -t URLS < <(printf '%s\n' "${URLS[@]}" | sort -u)

if [ ${#URLS[@]} -eq 0 ]; then
  echo "No purge-eligible URLs for ${APP_NAME}."
  exit 0
fi

echo "Purging ${#URLS[@]} URL(s) for ${APP_NAME}:"
printf '  %s\n' "${URLS[@]}"

# Batch into groups of 30 (Cloudflare free-tier limit per call)
BATCH_SIZE=30
for ((i = 0; i < ${#URLS[@]}; i += BATCH_SIZE)); do
  BATCH=("${URLS[@]:i:BATCH_SIZE}")
  JSON_ARRAY=$(printf '%s\n' "${BATCH[@]}" | jq -R . | jq -s '.')
  RESPONSE=$(curl -sf -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"files\": ${JSON_ARRAY}}")

  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  if [ "$SUCCESS" != "true" ]; then
    echo "ERROR: Cloudflare purge failed: $RESPONSE" >&2
    exit 1
  fi
done

echo "Cloudflare cache purge complete for ${APP_NAME}."
