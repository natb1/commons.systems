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
 * so only the byte ranges pdf.js asks for are read (not the whole file).
 *
 * pdf.js never surfaces a range read that fails to call `onDataRange` — it just
 * blocks forever waiting for the outstanding range, so `getDocument().promise`
 * would never settle. To make a failed read observable, a rejected read settles
 * the `error` promise; callers race it against their pdf.js work so the failure
 * propagates to `extractMetadata`'s try/catch (which yields `{}`).
 */
export class BlobRangeTransport extends pdfjsLib.PDFDataRangeTransport {
  /** Rejects with the first failing range read; never resolves. */
  readonly error: Promise<never>;
  private rejectError!: (reason: unknown) => void;

  constructor(private blob: Blob) {
    super(blob.size, null);
    this.error = new Promise<never>((_, reject) => {
      this.rejectError = reject;
    });
    // Attach a no-op handler so a read failure that fires after the caller's
    // race has already settled does not surface as an unhandled rejection.
    this.error.catch(() => {});
  }

  requestDataRange(begin: number, end: number): void {
    this.blob
      .slice(begin, end)
      .arrayBuffer()
      .then((buf) => {
        this.onDataRange(begin, new Uint8Array(buf));
      })
      .catch((err: unknown) => {
        this.rejectError(err);
      });
  }
}

async function extractPdf(blob: Blob): Promise<{ title?: string; pageCount?: number }> {
  // Range transport reads only the byte ranges pdf.js requests from the Blob.
  const transport = new BlobRangeTransport(blob);
  let doc: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    const extract = (async () => {
      doc = await pdfjsLib.getDocument({
        range: transport,
        disableStream: true,
        disableAutoFetch: true,
      }).promise;
      const pageCount = doc.numPages;
      const { info } = await doc.getMetadata();
      const title = cleanTitle((info as { Title?: string }).Title);
      return title !== undefined ? { title, pageCount } : { pageCount };
    })();
    // Race the transport's error channel: a failed range read never reaches
    // pdf.js, so without this the extract promise would hang indefinitely.
    return await Promise.race([extract, transport.error]);
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
