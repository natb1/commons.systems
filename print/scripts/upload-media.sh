#!/usr/bin/env bash
# Upload a media file to GCS and create the corresponding Firestore document.
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

# Validate required tools
for cmd in gsutil gcloud curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: required command not found: $cmd" >&2
    exit 1
  fi
done

# Parse positional args
if [ $# -lt 3 ]; then
  usage
fi

FILE_PATH="$1"
TITLE="$2"
MEDIA_TYPE="$3"
shift 3

# Validate file exists
if [ ! -f "$FILE_PATH" ]; then
  echo "error: file not found: ${FILE_PATH}" >&2
  exit 1
fi

# Validate mediaType
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
  if [ ${#EMAILS[@]} -lt 1 ] || [ ${#EMAILS[@]} -gt 3 ]; then
    echo "error: private mode requires 1-3 email addresses (got ${#EMAILS[@]})" >&2
    usage
  fi
fi

FILENAME="$(basename "$FILE_PATH")"
GCS_DEST="${BUCKET}/${COLLECTION_PATH}/${FILENAME}"
ADDED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Upload file to GCS
echo "Uploading ${FILENAME} to GCS..."
gsutil cp "$FILE_PATH" "$GCS_DEST"

# Set GCS metadata
echo "Setting GCS metadata..."
if [ "$PUBLIC" = true ]; then
  gsutil setmeta -h "x-goog-meta-publicDomain:true" "$GCS_DEST"
else
  META_ARGS=(-h "x-goog-meta-publicDomain:false")
  for i in "${!EMAILS[@]}"; do
    META_ARGS+=(-h "x-goog-meta-member_${i}:${EMAILS[$i]}")
  done
  gsutil setmeta "${META_ARGS[@]}" "$GCS_DEST"
fi

# Verify GCS upload
echo ""
echo "=== GCS Object ==="
gsutil stat "$GCS_DEST"

# Build Firestore document JSON
echo ""
echo "Creating Firestore document..."

# Build memberEmails array
MEMBER_VALUES=""
if [ "$PUBLIC" = false ]; then
  for email in "${EMAILS[@]}"; do
    if [ -n "$MEMBER_VALUES" ]; then
      MEMBER_VALUES="${MEMBER_VALUES},"
    fi
    MEMBER_VALUES="${MEMBER_VALUES}{\"stringValue\":\"${email}\"}"
  done
fi

FIRESTORE_BODY=$(jq -n \
  --arg title "$TITLE" \
  --arg mediaType "$MEDIA_TYPE" \
  --argjson publicDomain "$PUBLIC" \
  --arg storagePath "media/${FILENAME}" \
  --arg addedAt "$ADDED_AT" \
  --argjson memberValues "[$MEMBER_VALUES]" \
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

TOKEN="$(gcloud auth print-access-token)"
FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION_PATH}"

RESPONSE=$(curl -sf -X POST "$FIRESTORE_URL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$FIRESTORE_BODY")

DOC_ID=$(echo "$RESPONSE" | jq -r '.name | split("/") | last')

echo ""
echo "=== Firestore Document ==="
echo "Document ID: ${DOC_ID}"
echo "Path: ${COLLECTION_PATH}/${DOC_ID}"
echo ""
echo "Done."
