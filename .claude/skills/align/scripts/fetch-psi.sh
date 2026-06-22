#!/usr/bin/env bash
# fetch-psi.sh — query the PageSpeed Insights (PSI / Lighthouse lab) API once per
# deployed-app URL and emit a single formatted text block to stdout, for
# consumption by the align skill's Phase 1 context gathering.
#
# PSI returns synthetic ("lab") Lighthouse results that are always available
# regardless of real traffic, so this feed works in autonomous /align runs
# even when no app has measurable RUM. Per URL it reports the four Lighthouse
# category scores (performance, SEO, accessibility, best practices, each 0-100)
# and the core lab metrics (LCP, CLS, TBT, FCP). When the response carries a
# CrUX field-data block (real-world Chrome UX data), that is summarized too.
#
# PAGESPEED_API_KEY — OPTIONAL. The PSI API works keyless at low volume (it is
# rate-limited per source IP). This is the no-config default that makes the feed
# available in autonomous /align runs where no interactive `pass` warm-up
# happens. Set the key only to raise the rate limit; when set it is passed as the
# `key` query param. Per the pass/GPG section of .claude/rules/sandbox.md, source
# it from the secret store before invoking, e.g.
#
#   export PAGESPEED_API_KEY="$(pass show pagespeed/api-key)"
#
# (Warm the gpg-agent cache once in an interactive shell first, as that rule
# describes.) With the key unset the script prints a one-line keyless note to
# stdout and PROCEEDS — it does not exit.
#
# Config env vars (with defaults):
#   ALIGN_PSI_URLS     Comma-separated list of https:// URLs to test.
#                        Default: the five canonical custom-domain app URLs
#                        (commons.systems, budget., print., audio., fellspiral.).
#   ALIGN_PSI_STRATEGY PSI strategy: "mobile" or "desktop". Default: mobile.
#
# Sandbox: callers MUST wrap this script with dangerouslyDisableSandbox: true —
# it makes `curl` calls to www.googleapis.com, which the sandbox's network
# namespace isolation blocks (see .claude/rules/sandbox.md). The script itself
# sets nothing sandbox-related.
#
# Degradation contract (per .claude/rules/code-style.md): the script degrades
# rather than failing the parent. A malformed/non-https URL prints a skip note
# and is dropped; a per-URL fetch failure or timeout prints a clear warning LINE
# into the output block and continues, surfacing the error at the boundary
# instead of burying it in a safe default. The script always exits 0.
set -euo pipefail

# ---- Step 1: resolve config env vars with defaults --------------------------
# PAGESPEED_API_KEY is optional — keyless is the no-config default.
PAGESPEED_API_KEY="${PAGESPEED_API_KEY:-}"
ALIGN_PSI_URLS="${ALIGN_PSI_URLS:-https://commons.systems,https://budget.commons.systems,https://print.commons.systems,https://audio.commons.systems,https://fellspiral.commons.systems}"
ALIGN_PSI_STRATEGY="${ALIGN_PSI_STRATEGY:-mobile}"

if [[ -z "$PAGESPEED_API_KEY" ]]; then
  echo "(PSI: running keyless — set PAGESPEED_API_KEY for higher rate limits)"
fi

# Build the conditional key arg into an array so it is only appended when set.
KEY_ARGS=()
[[ -n "$PAGESPEED_API_KEY" ]] && KEY_ARGS=(--data-urlencode "key=$PAGESPEED_API_KEY")

# ---- helper: extract an .error.message reason from a JSON response ----------
# Prints the API error message if the response carries an `.error` object,
# otherwise prints nothing. Used to surface per-URL failures at the boundary.
# The reason is echoed into the context file the align personas read, and its
# text is server-controlled, so strip newlines/carriage returns and truncate to
# stop a crafted API response from forging section markers (prompt injection).
api_error_reason() {
  printf '%s' "$1" | jq -r 'if .error then (.error.message // "unknown API error") else empty end' 2>/dev/null \
    | tr '\r\n' '  ' | cut -c1-200
}

# ---- Step 2: per-URL loop ---------------------------------------------------
IFS=',' read -r -a PSI_URLS <<<"$ALIGN_PSI_URLS"
for URL in "${PSI_URLS[@]}"; do
  [[ -z "$URL" ]] && continue
  # Validate each URL before it reaches a curl arg or the context file. Require a
  # plain https:// URL with no '?'/'#'/space/CR/LF — those could restructure the
  # request or forge section markers in the output (same rationale as the Search
  # Console site guard in fetch-analytics.sh).
  if [[ ! "$URL" =~ ^https://[A-Za-z0-9._/-]+$ ]]; then
    echo "(PSI skipped for '${URL}': must be an https:// URL)"
    continue
  fi

  echo "--- PSI: ${URL} (${ALIGN_PSI_STRATEGY}) ---"

  RC=0
  RESP=$(curl -sf -G --max-time 60 \
    --data-urlencode "url=$URL" \
    --data-urlencode "strategy=$ALIGN_PSI_STRATEGY" \
    --data-urlencode "category=performance" \
    --data-urlencode "category=seo" \
    --data-urlencode "category=accessibility" \
    --data-urlencode "category=best-practices" \
    "${KEY_ARGS[@]}" \
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" 2>/dev/null) || RC=$?
  REASON=$(api_error_reason "$RESP")
  if [[ "$RC" -ne 0 ]]; then
    echo "(PSI failed for ${URL}: curl exit $RC)"
    continue
  elif [[ -n "$REASON" ]]; then
    echo "(PSI failed for ${URL}: ${REASON})"
    continue
  fi

  # A 200 with a non-JSON body (e.g. a proxy/CDN error page) passes both checks
  # above; reject it here so metric extraction never emits silently-empty values.
  if ! printf '%s' "$RESP" | jq empty 2>/dev/null; then
    echo "(PSI failed for ${URL}: response is not valid JSON)"
    continue
  fi

  # Category scores (0-100 integers; null/absent → n/a). Use `round` (not floor)
  # to match Lighthouse's own displayed rounding and avoid a float off-by-one,
  # e.g. score 0.29 parses as 0.28999… which would floor to 28.
  PERF=$(printf '%s' "$RESP" | jq -r '(.lighthouseResult.categories.performance.score | if . == null then "n/a" else (. * 100 | round) end)')
  SEO=$(printf '%s' "$RESP" | jq -r '(.lighthouseResult.categories.seo.score | if . == null then "n/a" else (. * 100 | round) end)')
  A11Y=$(printf '%s' "$RESP" | jq -r '(.lighthouseResult.categories.accessibility.score | if . == null then "n/a" else (. * 100 | round) end)')
  BP=$(printf '%s' "$RESP" | jq -r '(.lighthouseResult.categories["best-practices"].score | if . == null then "n/a" else (. * 100 | round) end)')
  echo "Performance: ${PERF}"
  echo "SEO: ${SEO}"
  echo "Accessibility: ${A11Y}"
  echo "Best practices: ${BP}"

  # Lab metrics (displayValue strings; sanitized + truncated).
  LCP=$(printf '%s' "$RESP" | jq -r '((.lighthouseResult.audits["largest-contentful-paint"].displayValue // "n/a") | gsub("[\\r\\n]"; " "))[0:200]')
  CLS=$(printf '%s' "$RESP" | jq -r '((.lighthouseResult.audits["cumulative-layout-shift"].displayValue // "n/a") | gsub("[\\r\\n]"; " "))[0:200]')
  TBT=$(printf '%s' "$RESP" | jq -r '((.lighthouseResult.audits["total-blocking-time"].displayValue // "n/a") | gsub("[\\r\\n]"; " "))[0:200]')
  FCP=$(printf '%s' "$RESP" | jq -r '((.lighthouseResult.audits["first-contentful-paint"].displayValue // "n/a") | gsub("[\\r\\n]"; " "))[0:200]')
  echo "LCP: ${LCP}"
  echo "CLS: ${CLS}"
  echo "TBT: ${TBT}"
  echo "FCP: ${FCP}"

  # CrUX field data — present only when this origin/page has enough real-world
  # Chrome UX samples. Iterate its metric keys (each metric name is a known
  # constant; .category is server-controlled, so sanitize + truncate it).
  HAS_CRUX=$(printf '%s' "$RESP" | jq -r 'if (.loadingExperience.metrics // {} | length) > 0 then "yes" else "no" end')
  if [[ "$HAS_CRUX" == "yes" ]]; then
    echo "CrUX field data:"
    printf '%s' "$RESP" \
      | jq -r '.loadingExperience.metrics | to_entries[] | "  \((.key | gsub("[\\r\\n]"; " "))[0:200]): \(.value.percentile // "n/a"), \(((.value.category // "n/a") | gsub("[\\r\\n]"; " "))[0:200])"' 2>/dev/null || true
  else
    echo "(no CrUX field data)"
  fi
done

exit 0
