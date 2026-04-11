#!/usr/bin/env bash
# Attach a markdown rendering to an existing media document.
# Verifies the document exists and the GCS destination is unoccupied, then uploads
# the .md file to GCS and patches the Firestore document's markdownPath field.
# Usage: attach-markdown.sh <docId> <mdFile>
set -euo pipefail

BUCKET="gs://commons-systems.firebasestorage.app"
PROJECT="commons-systems"
# Targets production only -- no environment parameter by design
COLLECTION_PATH="print/prod/media"

usage() {
  cat >&2 <<EOF
Usage: attach-markdown.sh <docId> <mdFile>

Arguments:
  docId       Firestore document ID of the media item
  mdFile      Local path to the markdown file to attach
EOF
  exit 1
}

for cmd in gsutil gcloud curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: required command not found: $cmd" >&2
    exit 1
  fi
done

if [ $# -ne 2 ]; then
  usage
fi

DOC_ID="$1"
MD_FILE="$2"

if [ ! -f "$MD_FILE" ]; then
  echo "error: file not found: ${MD_FILE}" >&2
  exit 1
fi

if [[ "$MD_FILE" != *.md ]]; then
  echo "error: file must have .md extension: ${MD_FILE}" >&2
  exit 1
fi

# Get auth token
if ! TOKEN="$(gcloud auth print-access-token 2>&1)"; then
  echo "error: failed to get auth token. Run 'gcloud auth login' first." >&2
  exit 1
fi

# Verify document exists
DOC_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION_PATH}/${DOC_ID}"
DOC_RESP_FILE=$(mktemp)
trap 'rm -f "$DOC_RESP_FILE"' EXIT
DOC_HTTP=$(curl -sS -o "$DOC_RESP_FILE" -w '%{http_code}' "$DOC_URL" \
  --config <(echo "header = \"Authorization: Bearer ${TOKEN}\""))

if [ "$DOC_HTTP" -lt 200 ] || [ "$DOC_HTTP" -ge 300 ]; then
  echo "error: document '${DOC_ID}' not found (HTTP ${DOC_HTTP})" >&2
  exit 1
fi

FILENAME="$(basename "$MD_FILE")"
# Full GCS object path for upload
GCS_DEST="${BUCKET}/${COLLECTION_PATH}/${FILENAME}"
# Firestore markdownPath value, resolved relative to the app storage namespace
STORAGE_PATH="media/${FILENAME}"

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

# Upload markdown file to GCS
echo "Uploading ${FILENAME} to GCS..."
gsutil -h "Content-Type:text/markdown" cp "$MD_FILE" "$GCS_DEST"

echo ""
echo "=== GCS Object ==="
gsutil stat "$GCS_DEST"

# Patch Firestore document to set markdownPath
echo ""
echo "Patching Firestore document..."

PATCH_BODY=$(jq -n --arg mp "$STORAGE_PATH" '{
  fields: {
    markdownPath: { stringValue: $mp }
  }
}')

RESP_FILE=$(mktemp)
trap 'rm -f "$DOC_RESP_FILE" "$RESP_FILE"' EXIT
HTTP_CODE=$(curl -sS -o "$RESP_FILE" -w '%{http_code}' -X PATCH \
  "${DOC_URL}?updateMask.fieldPaths=markdownPath" \
  --config <(echo "header = \"Authorization: Bearer ${TOKEN}\"") \
  -H "Content-Type: application/json" \
  -d "$PATCH_BODY")

if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
  echo "error: Firestore PATCH returned HTTP ${HTTP_CODE}:" >&2
  cat "$RESP_FILE" >&2
  echo "" >&2
  echo "The markdown file was uploaded to GCS at: ${GCS_DEST}" >&2
  echo "To clean up: gsutil rm ${GCS_DEST}" >&2
  exit 1
fi

echo ""
echo "=== Updated Document ==="
echo "Document ID: ${DOC_ID}"
echo "markdownPath: ${STORAGE_PATH}"
echo ""
echo "Done."
