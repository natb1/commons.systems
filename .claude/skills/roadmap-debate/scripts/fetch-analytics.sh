#!/usr/bin/env bash
# fetch-analytics.sh — fetch Google Analytics 4 (GA4) and Google Search Console
# data and emit a single formatted text block to stdout, for consumption by the
# roadmap-debate skill's Phase 1 context gathering.
#
# GA4 metrics (per deployed app, 30-day window): page views, sessions, bounce
# rate; top-10 referral sources by sessions; top-10 landing pages. Search
# Console metrics (commons.systems domain, 28-day window): top search queries
# (clicks/impressions/CTR/position); top pages; device breakdown.
#
# OAuth — no credentials are stored in this file. The Google OAuth client
# credentials and refresh token are read at runtime from three env vars:
#
#   GOOGLE_ANALYTICS_CLIENT_ID
#   GOOGLE_ANALYTICS_CLIENT_SECRET
#   GOOGLE_ANALYTICS_REFRESH_TOKEN
#
# The refresh token must carry both required read-only scopes:
#
#   https://www.googleapis.com/auth/analytics.readonly
#   https://www.googleapis.com/auth/webmasters.readonly
#
# Per the pass/GPG section of .claude/rules/sandbox.md, source them from the
# secret store before invoking this script, e.g.
#
#   export GOOGLE_ANALYTICS_CLIENT_ID="$(pass show google-analytics/client-id)"
#   export GOOGLE_ANALYTICS_CLIENT_SECRET="$(pass show google-analytics/client-secret)"
#   export GOOGLE_ANALYTICS_REFRESH_TOKEN="$(pass show google-analytics/refresh-token)"
#
# (Warm the gpg-agent cache once in an interactive shell first, as that rule
# describes.) With any of the three env vars unset the script prints a warning
# to stderr and exits 0 with no stdout — the no-config path. Personas note the
# absence of analytics data rather than guessing.
#
# One-time refresh-token bootstrap (done by the user, not by this script):
#   1. Create a Google Cloud project and an OAuth 2.0 Client ID of type
#      "Desktop app". Note the client id and client secret.
#   2. Enable the Google Analytics Data API and the Search Console API on the
#      project.
#   3. Run the consent flow once interactively (the simplest path is the
#      Google OAuth 2.0 Playground at developers.google.com/oauthplayground
#      configured with your own client id/secret and BOTH scopes above) and
#      capture the refresh token it issues.
#   4. Store all three values in pass under stable paths and source them as
#      env vars before invoking /roadmap-debate.
#
# Config env vars (with defaults):
#   ROADMAP_GA4_PROPERTY_IDS    App→property map, comma-separated app:propertyId
#                               pairs, e.g. "landing:111,budget:222,print:333".
#                               When unset, the GA4 section is skipped (warning
#                               on stderr); Search Console still runs.
#   ROADMAP_SEARCH_CONSOLE_SITE Search Console property string.
#                               Default: sc-domain:commons.systems.
#
# Sandbox: callers MUST wrap this script with dangerouslyDisableSandbox: true —
# it makes `curl` calls to Google's OAuth and API hosts, which the sandbox's
# network namespace isolation blocks (see .claude/rules/sandbox.md). The script
# itself sets nothing sandbox-related.
#
# Degradation contract (per .claude/rules/code-style.md): the no-config gate is
# legitimate edge-validation. Past that, the script degrades rather than failing
# the parent — per-API failures print a clear warning LINE into the output block
# and continue, surfacing the error at the boundary instead of burying it in a
# safe default. The script always exits 0.
set -euo pipefail

# ---- Step 0: no-config gate -------------------------------------------------
# Any of the three OAuth env vars unset/empty → warn on stderr, no stdout,
# exit 0. Unlike dispatch-jit-calendar-import (which exits silently), this
# script surfaces the skip to the parent so roadmap-debate Phase 1 can log it.
if [[ -z "${GOOGLE_ANALYTICS_CLIENT_ID:-}" \
   || -z "${GOOGLE_ANALYTICS_CLIENT_SECRET:-}" \
   || -z "${GOOGLE_ANALYTICS_REFRESH_TOKEN:-}" ]]; then
  echo "(analytics: credentials not configured — set GOOGLE_ANALYTICS_CLIENT_ID, GOOGLE_ANALYTICS_CLIENT_SECRET, and GOOGLE_ANALYTICS_REFRESH_TOKEN)"
  exit 0
fi

# ---- Step 1: resolve config env vars with defaults --------------------------
ROADMAP_GA4_PROPERTY_IDS="${ROADMAP_GA4_PROPERTY_IDS:-}"
ROADMAP_SEARCH_CONSOLE_SITE="${ROADMAP_SEARCH_CONSOLE_SITE:-sc-domain:commons.systems}"

# ---- Step 2: exchange the refresh token for an access token ----------------
TOKEN_RC=0
TOKEN_RESPONSE=$(curl -sf -X POST \
  --data-urlencode "client_id=${GOOGLE_ANALYTICS_CLIENT_ID}" \
  --data-urlencode "client_secret=${GOOGLE_ANALYTICS_CLIENT_SECRET}" \
  --data-urlencode "refresh_token=${GOOGLE_ANALYTICS_REFRESH_TOKEN}" \
  --data-urlencode "grant_type=refresh_token" \
  "https://oauth2.googleapis.com/token" 2>/dev/null) || TOKEN_RC=$?
if [[ "$TOKEN_RC" -ne 0 ]]; then
  echo "analytics: skipped (token exchange failed: curl exit $TOKEN_RC)" >&2
  exit 0
fi
ACCESS_TOKEN=$(printf '%s' "$TOKEN_RESPONSE" | jq -r '.access_token // empty')
if [[ -z "$ACCESS_TOKEN" ]]; then
  ERR=$(printf '%s' "$TOKEN_RESPONSE" | jq -r '.error_description // .error // "no access_token in response"')
  echo "analytics: skipped (token exchange failed: $ERR)" >&2
  exit 0
fi

# ---- helper: extract an .error.message reason from a JSON response ----------
# Prints the API error message if the response carries an `.error` object,
# otherwise prints nothing. Used to surface per-API failures at the boundary.
api_error_reason() {
  printf '%s' "$1" | jq -r 'if .error then (.error.message // "unknown API error") else empty end' 2>/dev/null
}

# ---- Step 3: GA4 per app ----------------------------------------------------
# Read the app→property map from ROADMAP_GA4_PROPERTY_IDS. When unset, skip ONLY
# the GA4 section — Search Console still runs.
if [[ -z "$ROADMAP_GA4_PROPERTY_IDS" ]]; then
  echo "(GA4: skipped — ROADMAP_GA4_PROPERTY_IDS not set)"
else
  IFS=',' read -r -a GA4_PAIRS <<<"$ROADMAP_GA4_PROPERTY_IDS"
  for pair in "${GA4_PAIRS[@]}"; do
    [[ -z "$pair" ]] && continue
    APP="${pair%%:*}"
    PROPERTY_ID="${pair#*:}"
    if [[ -z "$APP" || -z "$PROPERTY_ID" || "$APP" == "$pair" ]]; then
      echo "(GA4 skipped for '${pair}': not a valid app:propertyId pair)"
      continue
    fi
    echo "--- GA4: ${APP} ---"
    RUN_REPORT_URL="https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport"

    # (a) Overview metrics: page views, sessions, bounce rate (30-day window).
    OVERVIEW_BODY=$(jq -n '{
      dateRanges: [{startDate: "30daysAgo", endDate: "today"}],
      metrics: [{name: "screenPageViews"}, {name: "sessions"}, {name: "bounceRate"}]
    }')
    RC=0
    OVERVIEW_RESP=$(curl -sf -X POST \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$OVERVIEW_BODY" \
      "$RUN_REPORT_URL" 2>/dev/null) || RC=$?
    OVERVIEW_ERR=$(api_error_reason "$OVERVIEW_RESP")
    if [[ "$RC" -ne 0 ]]; then
      echo "(GA4 runReport failed for ${APP}: curl exit $RC)"
    elif [[ -n "$OVERVIEW_ERR" ]]; then
      echo "(GA4 runReport failed for ${APP}: ${OVERVIEW_ERR})"
    else
      PAGE_VIEWS=$(printf '%s' "$OVERVIEW_RESP" | jq -r '.rows[0].metricValues[0].value // "n/a"')
      SESSIONS=$(printf '%s' "$OVERVIEW_RESP" | jq -r '.rows[0].metricValues[1].value // "n/a"')
      BOUNCE_RATE=$(printf '%s' "$OVERVIEW_RESP" | jq -r '.rows[0].metricValues[2].value // "n/a"')
      echo "Page views: ${PAGE_VIEWS}"
      echo "Sessions: ${SESSIONS}"
      echo "Bounce rate: ${BOUNCE_RATE}"
    fi

    # (b) Top-10 referral sources by sessions.
    REFERRAL_BODY=$(jq -n '{
      dateRanges: [{startDate: "30daysAgo", endDate: "today"}],
      dimensions: [{name: "sessionSource"}],
      metrics: [{name: "sessions"}],
      orderBys: [{metric: {metricName: "sessions"}, desc: true}],
      limit: 10
    }')
    RC=0
    REFERRAL_RESP=$(curl -sf -X POST \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$REFERRAL_BODY" \
      "$RUN_REPORT_URL" 2>/dev/null) || RC=$?
    REFERRAL_ERR=$(api_error_reason "$REFERRAL_RESP")
    if [[ "$RC" -ne 0 ]]; then
      echo "(GA4 runReport failed for ${APP}: curl exit $RC)"
    elif [[ -n "$REFERRAL_ERR" ]]; then
      echo "(GA4 runReport failed for ${APP}: ${REFERRAL_ERR})"
    else
      echo "Top referral sources (by sessions):"
      printf '%s' "$REFERRAL_RESP" \
        | jq -r '.rows[]? | "  \(.dimensionValues[0].value): \(.metricValues[0].value)"'
    fi

    # (c) Landing-page performance.
    LANDING_BODY=$(jq -n '{
      dateRanges: [{startDate: "30daysAgo", endDate: "today"}],
      dimensions: [{name: "landingPage"}],
      metrics: [{name: "sessions"}, {name: "screenPageViews"}],
      orderBys: [{metric: {metricName: "sessions"}, desc: true}],
      limit: 10
    }')
    RC=0
    LANDING_RESP=$(curl -sf -X POST \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$LANDING_BODY" \
      "$RUN_REPORT_URL" 2>/dev/null) || RC=$?
    LANDING_ERR=$(api_error_reason "$LANDING_RESP")
    if [[ "$RC" -ne 0 ]]; then
      echo "(GA4 runReport failed for ${APP}: curl exit $RC)"
    elif [[ -n "$LANDING_ERR" ]]; then
      echo "(GA4 runReport failed for ${APP}: ${LANDING_ERR})"
    else
      echo "Top landing pages:"
      printf '%s' "$LANDING_RESP" \
        | jq -r '.rows[]? | "  \(.dimensionValues[0].value): \(.metricValues[0].value) sessions, \(.metricValues[1].value) views"'
    fi
  done
fi

# ---- Step 4: Search Console -------------------------------------------------
# URL-encode the site string. Colons become %3A; forward slashes become %2F.
# Both are required: sc-domain:commons.systems has only colons (no slashes), while
# https:// URL properties also have slashes that must be percent-encoded for the
# site identifier to be a valid single URL path segment.
ENCODED_SITE="${ROADMAP_SEARCH_CONSOLE_SITE//:/%3A}"
ENCODED_SITE="${ENCODED_SITE//\//%2F}"
SC_URL="https://searchconsole.googleapis.com/webmasters/v3/sites/${ENCODED_SITE}/searchAnalytics/query"

# 28-day window, computed with GNU date in YYYY-MM-DD.
SC_START=$(date -d '28 days ago' +%F)
SC_END=$(date -d today +%F)

echo "--- Search Console ---"

# Search queries — rows carry clicks/impressions/ctr/position.
QUERY_BODY=$(jq -n --arg start "$SC_START" --arg end "$SC_END" '{
  startDate: $start,
  endDate: $end,
  dimensions: ["query"],
  rowLimit: 25
}')
RC=0
QUERY_RESP=$(curl -sf -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$QUERY_BODY" \
  "$SC_URL" 2>/dev/null) || RC=$?
QUERY_ERR=$(api_error_reason "$QUERY_RESP")
if [[ "$RC" -ne 0 ]]; then
  echo "(Search Console query failed: curl exit $RC)"
elif [[ -n "$QUERY_ERR" ]]; then
  echo "(Search Console query failed: ${QUERY_ERR})"
else
  echo "Top search queries:"
  printf '%s' "$QUERY_RESP" \
    | jq -r '.rows[]? | "  \(.keys[0]): \(.clicks) clicks, \(.impressions) impressions, CTR \(.ctr), pos \(.position)"'
fi

# Pages.
PAGE_BODY=$(jq -n --arg start "$SC_START" --arg end "$SC_END" '{
  startDate: $start,
  endDate: $end,
  dimensions: ["page"],
  rowLimit: 25
}')
RC=0
PAGE_RESP=$(curl -sf -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAGE_BODY" \
  "$SC_URL" 2>/dev/null) || RC=$?
PAGE_ERR=$(api_error_reason "$PAGE_RESP")
if [[ "$RC" -ne 0 ]]; then
  echo "(Search Console query failed: curl exit $RC)"
elif [[ -n "$PAGE_ERR" ]]; then
  echo "(Search Console query failed: ${PAGE_ERR})"
else
  echo "Top pages:"
  printf '%s' "$PAGE_RESP" \
    | jq -r '.rows[]? | "  \(.keys[0]): \(.clicks) clicks, \(.impressions) impressions, CTR \(.ctr), pos \(.position)"'
fi

# Device breakdown.
DEVICE_BODY=$(jq -n --arg start "$SC_START" --arg end "$SC_END" '{
  startDate: $start,
  endDate: $end,
  dimensions: ["device"]
}')
RC=0
DEVICE_RESP=$(curl -sf -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$DEVICE_BODY" \
  "$SC_URL" 2>/dev/null) || RC=$?
DEVICE_ERR=$(api_error_reason "$DEVICE_RESP")
if [[ "$RC" -ne 0 ]]; then
  echo "(Search Console query failed: curl exit $RC)"
elif [[ -n "$DEVICE_ERR" ]]; then
  echo "(Search Console query failed: ${DEVICE_ERR})"
else
  echo "Device breakdown:"
  printf '%s' "$DEVICE_RESP" \
    | jq -r '.rows[]? | "  \(.keys[0]): \(.clicks) clicks, \(.impressions) impressions, CTR \(.ctr), pos \(.position)"'
fi

exit 0
