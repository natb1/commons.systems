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

/**
 * Range transport that serves pdf.js's data requests by slicing the source Blob,
 * so only the byte ranges pdf.js asks for are read (not the whole file). Read
 * errors are left to reject so extractMetadata's try/catch yields `{}`.
 */
export class BlobRangeTransport extends pdfjsLib.PDFDataRangeTransport {
  constructor(private blob: Blob) {
    super(blob.size, null);
  }

  requestDataRange(begin: number, end: number): void {
    void this.blob
      .slice(begin, end)
      .arrayBuffer()
      .then((buf) => {
        this.onDataRange(begin, new Uint8Array(buf));
      });
  }
}

async function extractPdf(blob: Blob): Promise<{ title?: string; pageCount?: number }> {
  // Range transport reads only the byte ranges pdf.js requests from the Blob.
  let doc: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    doc = await pdfjsLib.getDocument({
      range: new BlobRangeTransport(blob),
      disableStream: true,
      disableAutoFetch: true,
    }).promise;
    const pageCount = doc.numPages;
    const { info } = await doc.getMetadata();
    const title = cleanTitle((info as { Title?: string }).Title);
    return title !== undefined ? { title, pageCount } : { pageCount };
  } finally {
    // Destroy the document — and its backing worker — even if getMetadata throws.
    await doc?.destroy();
  }
}

async function extractEpub(blob: Blob): Promise<{ title?: string; pageCount?: number }> {
  const { entries } = await unzip(blob);
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
 * Extract `{ title?, pageCount? }` from a Blob, range-reading only the bytes
 * needed. Read-only: never writes back, so extraction works even when the source
 * folder is not writable. Tolerant of untrusted/malformed file contents — any
 * failure (corrupt PDF, malformed or missing container.xml/OPF) is logged and
 * reported as `{}` so the caller can fall back to the filename stem.
 */
export async function extractMetadata(
  blob: Blob,
  mediaType: MediaType,
): Promise<{ title?: string; pageCount?: number }> {
  try {
    if (mediaType === "pdf") return await extractPdf(blob);
    if (mediaType === "epub") return await extractEpub(blob);
    return {};
  } catch (err) {
    logError(err, { operation: "extractMetadata", mediaType });
    return {};
  }
}
