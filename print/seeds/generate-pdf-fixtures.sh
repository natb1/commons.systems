#!/usr/bin/env bash
# Download public-domain Plato PDFs from prod storage and truncate to seed page counts.
# Outputs: print/seeds/pdf-fixtures/{phaedrus-1p.pdf, republic-3p.pdf}
#
# Requires: gsutil (authenticated), node with pdf-lib
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/pdf-fixtures"
TMPDIR_LOCAL="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_LOCAL"' EXIT

BUCKET="gs://commons-systems.firebasestorage.app/print/prod/media"

echo "Downloading PDFs from prod storage..."
gsutil cp "$BUCKET/phaedrus-david-horan-translation-7-nov-25.pdf" "$TMPDIR_LOCAL/phaedrus-full.pdf"
gsutil cp "$BUCKET/republic-i-to-x-david-horan-translation-22-nov-25.pdf" "$TMPDIR_LOCAL/republic-full.pdf"

mkdir -p "$FIXTURES_DIR"

echo "Truncating PDFs..."
node --input-type=module <<'SCRIPT'
import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

const tmpDir = process.env.TMPDIR_LOCAL;
const outDir = process.env.FIXTURES_DIR;

async function truncate(inputPath, outputPath, maxPages) {
  const bytes = readFileSync(inputPath);
  const src = await PDFDocument.load(bytes);
  const totalPages = src.getPageCount();
  const keepPages = Math.min(maxPages, totalPages);

  const dst = await PDFDocument.create();
  const indices = Array.from({ length: keepPages }, (_, i) => i);
  const pages = await dst.copyPages(src, indices);
  for (const page of pages) dst.addPage(page);

  const out = await dst.save();
  writeFileSync(outputPath, out);
  console.log(`  ${outputPath}: ${keepPages}/${totalPages} pages (${out.byteLength} bytes)`);
}

await truncate(`${tmpDir}/phaedrus-full.pdf`, `${outDir}/phaedrus-1p.pdf`, 1);
await truncate(`${tmpDir}/republic-full.pdf`, `${outDir}/republic-3p.pdf`, 3);
SCRIPT

echo "Done. Fixtures written to $FIXTURES_DIR"
