#!/usr/bin/env bash
# Upload a media file to GCS and create the corresponding Firestore document.
# Targets the commons-systems production project and bucket. No dry-run or staging mode.
# Usage: upload-media.sh <file> <title> <mediaType> [--public | <email1> [email2] [email3]]
set -euo pipefail

BUCKET="gs://commons-systems.firebasestorage.app"
PROJECT="commons-systems"
COLLECTION_PATH="print/prod/media"

usage() {
  cat >&2 <<EOF
Usage: upload-media.sh <file> <title> <mediaType> [--public | <email1> [email2] [email3]]

Arguments:
  file        Local file path to upload
  title       Display title for the media item
  mediaType   One of: epub, pdf, image-archive

Mode (pick one):
  --public              Mark as public domain (no emails required)
  <email1> [email2] ... 1-3 member email addresses (private mode)
EOF
  exit 1
}

for cmd in gsutil gcloud curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: required command not found: $cmd" >&2
    exit 1
  fi
done

if [ $# -lt 3 ]; then
  usage
fi

FILE_PATH="$1"
TITLE="$2"
MEDIA_TYPE="$3"
shift 3

if [ ! -f "$FILE_PATH" ]; then
  echo "error: file not found: ${FILE_PATH}" >&2
  exit 1
fi

case "$MEDIA_TYPE" in
  epub|pdf|image-archive) ;;
  *)
    echo "error: invalid mediaType: ${MEDIA_TYPE} (must be epub, pdf, or image-archive)" >&2
    exit 1
    ;;
esac

# Parse mode: --public or 1-3 emails
PUBLIC=false
EMAILS=()

if [ $# -eq 0 ]; then
  echo "error: must specify --public or 1-3 email addresses" >&2
  usage
fi

if [ "$1" = "--public" ]; then
  PUBLIC=true
  shift
  if [ $# -gt 0 ]; then
    echo "error: --public does not accept email arguments" >&2
    usage
  fi
else
  EMAILS=("$@")
  if [ ${#EMAILS[@]} -gt 3 ]; then
    echo "error: private mode requires 1-3 email addresses (got ${#EMAILS[@]})" >&2
    usage
  fi
  for email in "${EMAILS[@]}"; do
    if [[ ! "$email" =~ ^[^[:space:][:cntrl:]@]+@[^[:space:][:cntrl:]@]+$ ]]; then
      echo "error: invalid email format: ${email}" >&2
      exit 1
    fi
  done
fi

FILENAME="$(basename "$FILE_PATH")"
GCS_DEST="${BUCKET}/${COLLECTION_PATH}/${FILENAME}"
ADDED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Check for existing object at destination
if STAT_OUTPUT=$(gsutil stat "$GCS_DEST" 2>&1); then
  echo "error: object already exists at ${GCS_DEST}" >&2
  echo "Rename the file or remove the existing object: gsutil rm ${GCS_DEST}" >&2
  exit 1
fi
if ! echo "$STAT_OUTPUT" | grep -q "No URLs matched"; then
  echo "error: could not verify object status at ${GCS_DEST}:" >&2
  echo "$STAT_OUTPUT" >&2
  exit 1
fi

# Upload file to GCS with metadata
echo "Uploading ${FILENAME} to GCS..."
META_ARGS=()
if [ "$PUBLIC" = true ]; then
  META_ARGS+=(-h "x-goog-meta-publicDomain:true")
else
  META_ARGS+=(-h "x-goog-meta-publicDomain:false")
  for i in "${!EMAILS[@]}"; do
    META_ARGS+=(-h "x-goog-meta-member_${i}:${EMAILS[$i]}")
  done
fi
gsutil "${META_ARGS[@]}" cp "$FILE_PATH" "$GCS_DEST"

# Verify GCS upload
echo ""
echo "=== GCS Object ==="
gsutil stat "$GCS_DEST"

# Build Firestore document JSON
echo ""
echo "Creating Firestore document..."

# Build memberEmails array as JSON via jq
if [ ${#EMAILS[@]} -eq 0 ]; then
  MEMBER_JSON="[]"
else
  MEMBER_JSON=$(printf '%s\n' "${EMAILS[@]}" | jq -R '{ stringValue: . }' | jq -s '.')
fi

FIRESTORE_BODY=$(jq -n \
  --arg title "$TITLE" \
  --arg mediaType "$MEDIA_TYPE" \
  --argjson publicDomain "$PUBLIC" \
  --arg storagePath "media/${FILENAME}" \
  --arg addedAt "$ADDED_AT" \
  --argjson memberValues "$MEMBER_JSON" \
  '{
    fields: {
      title: { stringValue: $title },
      mediaType: { stringValue: $mediaType },
      tags: { mapValue: { fields: {} } },
      publicDomain: { booleanValue: $publicDomain },
      sourceNotes: { stringValue: "" },
      storagePath: { stringValue: $storagePath },
      groupId: { nullValue: null },
      memberEmails: { arrayValue: { values: $memberValues } },
      addedAt: { stringValue: $addedAt }
    }
  }')

if ! TOKEN="$(gcloud auth print-access-token 2>&1)"; then
  echo "error: failed to get auth token. Run 'gcloud auth login' first." >&2
  echo "The file was already uploaded to GCS at: ${GCS_DEST}" >&2
  echo "To clean up: gsutil rm ${GCS_DEST}" >&2
  exit 1
fi
FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION_PATH}"

RESP_FILE=$(mktemp)
trap 'rm -f "$RESP_FILE"' EXIT
HTTP_CODE=$(curl -sS -o "$RESP_FILE" -w '%{http_code}' -X POST "$FIRESTORE_URL" \
  --config <(echo "header = \"Authorization: Bearer ${TOKEN}\"") \
  -H "Content-Type: application/json" \
  -d "$FIRESTORE_BODY")

if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
  echo "error: Firestore API returned HTTP ${HTTP_CODE}:" >&2
  cat "$RESP_FILE" >&2
  echo "" >&2
  echo "The file was uploaded to GCS at: ${GCS_DEST}" >&2
  echo "To clean up: gsutil rm ${GCS_DEST}" >&2
  exit 1
fi

RESPONSE=$(cat "$RESP_FILE")

DOC_ID=$(echo "$RESPONSE" | jq -r '.name | split("/") | last')
if [ -z "$DOC_ID" ] || [ "$DOC_ID" = "null" ]; then
  echo "error: unexpected Firestore response — could not extract document ID" >&2
  echo "Raw response: $RESPONSE" >&2
  exit 1
fi

echo ""
echo "=== Firestore Document ==="
echo "Document ID: ${DOC_ID}"
echo "Path: ${COLLECTION_PATH}/${DOC_ID}"
echo ""
echo "Done."
