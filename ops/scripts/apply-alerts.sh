#!/usr/bin/env bash
# Apply the Firestore read_count monitoring alert and the monthly budget alert
# to the prod commons-systems GCP project. Requires project-owner GCP auth
# (`gcloud auth login`). Orchestrates gcloud calls only; never run in CI.
# See issue #2688 and .claude/docs/monitoring-alerts.md for rationale and the
# owner apply/verify runbook.
#
# Idempotent ONLY for the notification channel (list-before-create). Re-running
# steps 2 and 3 creates DUPLICATE policy/budget resources, so the owner runs
# this once. See .claude/docs/monitoring-alerts.md.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROJECT="commons-systems"
OWNER_EMAIL="nathan@natb1.com"

usage() {
  cat >&2 <<EOF
Usage: apply-alerts.sh

Applies the Firestore read_count monitoring alert and the monthly budget alert
to the prod ${PROJECT} GCP project. Requires project-owner GCP auth
(gcloud auth login). Run once — steps 2 and 3 are not idempotent.
EOF
}

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      usage
      exit 0
      ;;
  esac
done

for cmd in gcloud jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: required command not found: $cmd" >&2
    exit 1
  fi
done

# 1. Resolve-or-create the owner email notification channel (prerequisite for
#    BOTH alerts). List first so re-runs reuse an existing channel.
CHANNEL_ID="$(gcloud beta monitoring channels list \
  --project="$PROJECT" \
  --filter='type="email" AND labels.email_address="'"$OWNER_EMAIL"'"' \
  --format='value(name)')"

if [[ -z "$CHANNEL_ID" ]]; then
  CHANNEL_ID="$(gcloud beta monitoring channels create \
    --project="$PROJECT" \
    --type=email \
    --display-name="Owner email (#2688)" \
    --channel-labels=email_address="$OWNER_EMAIL" \
    --format='value(name)')"
fi

if [[ -z "$CHANNEL_ID" ]]; then
  echo "error: could not resolve or create the notification channel" >&2
  exit 1
fi

# 2. Create the read_count monitoring policy, injecting the channel via flag.
gcloud monitoring policies create \
  --project="$PROJECT" \
  --policy-from-file="$SCRIPT_DIR/../monitoring/firestore-read-count-alert.json" \
  --notification-channels="$CHANNEL_ID"

# 3. Create the monthly budget from the param file.
BUDGET_FILE="$SCRIPT_DIR/../monitoring/budget-alert.json"
DISPLAY_NAME="$(jq -r '.displayName' "$BUDGET_FILE")"
AMOUNT="$(jq -r '.budgetAmount' "$BUDGET_FILE")"
CURRENCY="$(jq -r '.currencyCode' "$BUDGET_FILE")"
PROJECT_ID="$(jq -r '.projectId' "$BUDGET_FILE")"

# Resolve the billing account. describe returns `billingAccounts/XXXX`; the
# --billing-account flag wants the bare id, so strip the prefix.
BILLING_ACCOUNT="$(gcloud billing projects describe "$PROJECT" \
  --format='value(billingAccountName)')"
BILLING_ACCOUNT="${BILLING_ACCOUNT#billingAccounts/}"
if [[ -z "$BILLING_ACCOUNT" ]]; then
  echo "error: could not resolve billing account for $PROJECT" >&2
  exit 1
fi

# One --threshold-rule=percent=P flag per element of thresholdPercents.
THRESHOLD_FLAGS=()
while IFS= read -r pct; do
  THRESHOLD_FLAGS+=("--threshold-rule=percent=$pct")
done < <(jq -r '.thresholdPercents[]' "$BUDGET_FILE")

# `--all-updates-rule-monitoring-notification-channels` only exists on the beta
# (and alpha) track, so budget creation must run on `gcloud beta`, not stable.
gcloud beta billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="$DISPLAY_NAME" \
  --budget-amount="${AMOUNT}${CURRENCY}" \
  --filter-projects="projects/$PROJECT_ID" \
  "${THRESHOLD_FLAGS[@]}" \
  --all-updates-rule-monitoring-notification-channels="$CHANNEL_ID"

# 4. Done summary.
echo "Done."
echo "  Notification channel: $CHANNEL_ID"
echo "  Read-count monitoring policy: created"
echo "  Monthly budget: created"
echo "Verify both per the runbook in .claude/docs/monitoring-alerts.md (#2688)."
