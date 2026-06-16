import * as pdfjsLib from "pdfjs-dist";
import { unzip } from "unzipit";
import { logError } from "@commons-systems/errorutil/log";
import type { MediaType } from "./types.js";
// Side-effect import: ./viewer/pdf.js sets pdfjsLib.GlobalWorkerOptions.workerSrc
// at module load. Importing it here ensures metadata extraction reuses that same
// worker configuration without duplicating the setup.
import "./viewer/pdf.js";

const DC_NS = "http://purl.org/dc/elements/1.1/";

/** Trim a title; treat empty-after-trim as absent. */
function cleanTitle(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Parse META-INF/container.xml and return the OPF rootfile full-path, or
 * undefined if not found. DOMParser does not throw on malformed XML — it
 * returns a document whose missing element simply isn't found here.
 */
export function parseContainerXml(xml: string): string | undefined {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const rootfile = doc.getElementsByTagName("rootfile")[0];
  const fullPath = rootfile?.getAttribute("full-path");
  return fullPath && fullPath.length > 0 ? fullPath : undefined;
}

/**
 * Parse an OPF document and return its dc:title text, or undefined. Handles
 * both the namespaced `dc:title` element and an unprefixed `title`.
 */
export function parseOpfTitle(xml: string): string | undefined {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const nsTitle = doc.getElementsByTagNameNS(DC_NS, "title")[0];
  const fromNs = cleanTitle(nsTitle?.textContent);
  if (fromNs !== undefined) return fromNs;
  const plainTitle = doc.getElementsByTagName("title")[0];
  return cleanTitle(plainTitle?.textContent);
}

async function extractPdf(buf: ArrayBuffer): Promise<{ title?: string; pageCount?: number }> {
  // getDocument copies/detaches the buffer; pass a fresh Uint8Array view.
  let doc: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    const pageCount = doc.numPages;
    const { info } = await doc.getMetadata();
    const title = cleanTitle((info as { Title?: string }).Title);
    return title !== undefined ? { title, pageCount } : { pageCount };
  } finally {
    // Destroy the document — and its backing worker — even if getMetadata throws.
    await doc?.destroy();
  }
}

async function extractEpub(buf: ArrayBuffer): Promise<{ title?: string; pageCount?: number }> {
  const { entries } = await unzip(buf);
  const containerEntry = entries["META-INF/container.xml"];
  if (!containerEntry) return {};
  const opfPath = parseContainerXml(await containerEntry.text());
  if (!opfPath) return {};
  const opfEntry = entries[opfPath];
  if (!opfEntry) return {};
  const title = parseOpfTitle(await opfEntry.text());
  // No page count for EPUB — its reading position is a CFI, not a page index.
  return title !== undefined ? { title } : {};
}

/**
 * Extract `{ title?, pageCount? }` from in-memory bytes. Read-only: operates on
 * bytes already in memory, so extraction works even when the source folder is
 * not writable. Tolerant of untrusted/malformed file contents — any failure
 * (corrupt PDF, malformed or missing container.xml/OPF) is logged and reported
 * as `{}` so the caller can fall back to the filename stem.
 */
export async function extractMetadata(
  buf: ArrayBuffer,
  mediaType: MediaType,
): Promise<{ title?: string; pageCount?: number }> {
  try {
    if (mediaType === "pdf") return await extractPdf(buf);
    if (mediaType === "epub") return await extractEpub(buf);
    return {};
  } catch (err) {
    logError(err, { operation: "extractMetadata", mediaType });
    return {};
  }
}
