import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pdfjs-dist BEFORE importing local-metadata. The module does:
//   import * as pdfjsLib from "pdfjs-dist"
//   import "./viewer/pdf.js"   ← side-effect that sets workerSrc
// We mock both so local-metadata.ts loads cleanly with no real worker setup.

const mockDestroy = vi.fn().mockResolvedValue(undefined);
const mockGetMetadata = vi.fn();
const mockGetDocument = vi.fn();

vi.mock("pdfjs-dist", () => {
  class PDFDataRangeTransport {
    length: number;
    constructor(length: number, _initialData: unknown) {
      this.length = length;
    }
    onDataRange(_begin: number, _chunk: Uint8Array): void {}
  }
  return {
    default: {},
    getDocument: (...args: unknown[]) => mockGetDocument(...args),
    GlobalWorkerOptions: { workerSrc: "" },
    version: "0.0.0",
    PDFDataRangeTransport,
  };
});

// No-op the side-effect import of ./viewer/pdf.js (which sets workerSrc)
vi.mock("../src/viewer/pdf.js", () => ({}));

// Mock errorutil/log so logError calls don't throw
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

import { parseContainerXml, parseOpfTitle, extractMetadata, BlobRangeTransport } from "../src/local-metadata.js";

// ---------------------------------------------------------------------------
// parseContainerXml
// ---------------------------------------------------------------------------

describe("parseContainerXml", () => {
  it("returns the rootfile full-path from a valid container.xml", () => {
    const xml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    expect(parseContainerXml(xml)).toBe("OEBPS/content.opf");
  });

  it("returns undefined when there is no rootfile element", () => {
    const xml = `<?xml version="1.0"?>
<container version="1.0">
  <rootfiles/>
</container>`;
    expect(parseContainerXml(xml)).toBeUndefined();
  });

  it("returns undefined when the rootfile has no full-path attribute", () => {
    const xml = `<?xml version="1.0"?>
<container>
  <rootfiles>
    <rootfile media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    expect(parseContainerXml(xml)).toBeUndefined();
  });

  it("returns undefined for an empty full-path attribute", () => {
    const xml = `<?xml version="1.0"?>
<container>
  <rootfiles>
    <rootfile full-path="" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    expect(parseContainerXml(xml)).toBeUndefined();
  });

  it("does not throw on malformed XML", () => {
    expect(() => parseContainerXml("{not xml}")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// parseOpfTitle
// ---------------------------------------------------------------------------

describe("parseOpfTitle", () => {
  it("returns title from an unprefixed <title> under metadata", () => {
    const xml = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf">
  <metadata>
    <title>My Great Book</title>
  </metadata>
</package>`;
    expect(parseOpfTitle(xml)).toBe("My Great Book");
  });

  it("returns undefined when there is no title element", () => {
    const xml = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf">
  <metadata/>
</package>`;
    expect(parseOpfTitle(xml)).toBeUndefined();
  });

  it("returns undefined for a whitespace-only title (trimmed to empty)", () => {
    const xml = `<?xml version="1.0"?>
<package>
  <metadata>
    <title>   </title>
  </metadata>
</package>`;
    expect(parseOpfTitle(xml)).toBeUndefined();
  });

  it("trims leading and trailing whitespace from the title", () => {
    const xml = `<?xml version="1.0"?>
<package>
  <metadata>
    <title>  Trimmed Title  </title>
  </metadata>
</package>`;
    expect(parseOpfTitle(xml)).toBe("Trimmed Title");
  });

  it("does not throw on malformed XML", () => {
    expect(() => parseOpfTitle("{not xml}")).not.toThrow();
  });

  // happy-dom's DOMParser does not implement getElementsByTagNameNS for XML
  // namespaces (it returns undefined). The source code's NS-lookup path is
  // correct for browsers. We stub DOMParser for these two tests so the NS branch
  // is actually exercised and locked.
  describe("namespaced dc:title path (DOMParser stub)", () => {
    const DC_NS = "http://purl.org/dc/elements/1.1/";

    function makeStubDoc(dcTitle: string | undefined, plainTitle: string | undefined) {
      return {
        getElementsByTagNameNS: vi.fn().mockImplementation((_ns: string, local: string) => {
          if (local === "title" && dcTitle !== undefined) {
            return [{ textContent: dcTitle }];
          }
          return [];
        }),
        getElementsByTagName: vi.fn().mockImplementation((tag: string) => {
          if (tag === "title" && plainTitle !== undefined) {
            return [{ textContent: plainTitle }];
          }
          return [];
        }),
      };
    }

    /** Replace the global DOMParser constructor with one that returns fakeDoc. */
    function stubDOMParser(fakeDoc: ReturnType<typeof makeStubDoc>): () => void {
      const OrigDOMParser = globalThis.DOMParser;
      function StubDOMParser(this: unknown) {
        (this as any).parseFromString = () => fakeDoc;
      }
      StubDOMParser.prototype = {};
      (globalThis as any).DOMParser = StubDOMParser;
      return () => { (globalThis as any).DOMParser = OrigDOMParser; };
    }

    it("returns the dc:title text when getElementsByTagNameNS finds it", () => {
      const fakeDoc = makeStubDoc("Great EPub Title", undefined);
      const restore = stubDOMParser(fakeDoc);

      const result = parseOpfTitle("<any xml/>");

      restore();
      expect(result).toBe("Great EPub Title");
      expect(fakeDoc.getElementsByTagNameNS).toHaveBeenCalledWith(DC_NS, "title");
    });

    it("returns undefined for a whitespace-only dc:title", () => {
      const fakeDoc = makeStubDoc("   ", undefined);
      const restore = stubDOMParser(fakeDoc);

      const result = parseOpfTitle("<any/>");

      restore();
      expect(result).toBeUndefined();
    });

    it("falls through to unprefixed <title> when NS lookup returns nothing", () => {
      // NS returns empty list; plain getElementsByTagName returns the fallback.
      const fakeDoc = makeStubDoc(undefined, "Plain Title Fallback");
      const restore = stubDOMParser(fakeDoc);

      const result = parseOpfTitle("<any/>");

      restore();
      expect(result).toBe("Plain Title Fallback");
    });

    it("prefers dc:title over a sibling plain <title> when both are present", () => {
      const fakeDoc = makeStubDoc("DC Title Wins", "Plain Title");
      const restore = stubDOMParser(fakeDoc);

      const result = parseOpfTitle("<any/>");

      restore();
      expect(result).toBe("DC Title Wins");
      // Plain title lookup must NOT be reached
      expect(fakeDoc.getElementsByTagName).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// extractMetadata — PDF path (stubbed via vi.mock on pdfjs-dist)
// ---------------------------------------------------------------------------

describe("extractMetadata — pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeFakeDoc(title: string | undefined, numPages: number) {
    const destroy = vi.fn().mockResolvedValue(undefined);
    const doc = {
      numPages,
      getMetadata: vi.fn().mockResolvedValue({ info: { Title: title } }),
      destroy,
    };
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(doc) });
    return { doc, destroy };
  }

  it("returns title and pageCount when Title is present", async () => {
    const { destroy } = makeFakeDoc("Great Book", 42);

    const result = await extractMetadata(new File([new Uint8Array(8)], "x.pdf"), "pdf");

    expect(result).toEqual({ title: "Great Book", pageCount: 42 });
    expect(destroy).toHaveBeenCalled();
  });

  it("returns only pageCount when Title is empty/whitespace", async () => {
    const { destroy } = makeFakeDoc("   ", 10);

    const result = await extractMetadata(new File([new Uint8Array(8)], "x.pdf"), "pdf");

    expect(result).toEqual({ pageCount: 10 });
    expect(result.title).toBeUndefined();
    expect(destroy).toHaveBeenCalled();
  });

  it("returns only pageCount when Title is undefined", async () => {
    const { destroy } = makeFakeDoc(undefined, 5);

    const result = await extractMetadata(new File([new Uint8Array(8)], "x.pdf"), "pdf");

    expect(result).toEqual({ pageCount: 5 });
    expect(destroy).toHaveBeenCalled();
  });

  it("calls destroy even when getMetadata throws", async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    const doc = {
      numPages: 3,
      getMetadata: vi.fn().mockRejectedValue(new Error("metadata error")),
      destroy,
    };
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(doc) });

    // extractMetadata swallows errors and returns {}
    const result = await extractMetadata(new File([new Uint8Array(8)], "x.pdf"), "pdf");
    expect(result).toEqual({});
    expect(destroy).toHaveBeenCalled();
  });

  it("returns {} and does not throw when getDocument rejects", async () => {
    mockGetDocument.mockReturnValue({ promise: Promise.reject(new Error("worker crash")) });

    const result = await extractMetadata(new File([new Uint8Array(8)], "x.pdf"), "pdf");
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// extractMetadata — non-pdf / non-epub
// ---------------------------------------------------------------------------

describe("extractMetadata — unsupported type", () => {
  it("returns {} for image-archive without throwing", async () => {
    const result = await extractMetadata(new ArrayBuffer(0), "image-archive");
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// BlobRangeTransport — range slicing behaviour
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// extractMetadata — epub bounded read (REAL unzipit, hand-rolled STORED zip)
// ---------------------------------------------------------------------------
//
// This proves the EPUB path reads only a small bounded fraction of a multi-MB
// archive: unzipit reads the EOCD + central directory from the tail and lazily
// slices only the entries whose `.text()` is requested (container.xml + OPF),
// never the multi-MB filler. We build a minimal STORED (uncompressed) zip by
// hand so no compressor dependency is needed — unzipit is read-only.

// Standard CRC-32 (polynomial 0xEDB88320), table-based, over uncompressed bytes.
const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * Assemble a minimal STORED-method zip (compression method 0, compressedSize ==
 * uncompressedSize) from the given entries. All multi-byte integer fields are
 * little-endian. Layout per entry: Local File Header (30 bytes + filename) +
 * file data; then one Central Directory File Header (46 bytes + filename) per
 * entry; then the End-Of-Central-Directory record (22 bytes).
 */
function buildStoredZip(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const push = (b: Uint8Array) => {
    chunks.push(b);
    offset += b.length;
  };

  const central: Array<{
    localOffset: number;
    crc: number;
    size: number;
    nameBytes: Uint8Array;
  }> = [];

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const size = e.data.length;
    const localOffset = offset;

    // Local File Header (signature 0x04034b50)
    const lfh = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(lfh.buffer);
    dv.setUint32(0, 0x04034b50, true); // signature
    dv.setUint16(4, 20, true); // version needed to extract
    dv.setUint16(6, 0, true); // general purpose bit flag
    dv.setUint16(8, 0, true); // compression method = STORED
    dv.setUint16(10, 0, true); // last mod file time
    dv.setUint16(12, 0, true); // last mod file date
    dv.setUint32(14, crc, true); // crc-32
    dv.setUint32(18, size, true); // compressed size
    dv.setUint32(22, size, true); // uncompressed size
    dv.setUint16(26, nameBytes.length, true); // file name length
    dv.setUint16(28, 0, true); // extra field length
    lfh.set(nameBytes, 30);
    push(lfh);
    push(e.data);

    central.push({ localOffset, crc, size, nameBytes });
  }

  const cdStart = offset;
  for (const c of central) {
    // Central Directory File Header (signature 0x02014b50)
    const cdh = new Uint8Array(46 + c.nameBytes.length);
    const dv = new DataView(cdh.buffer);
    dv.setUint32(0, 0x02014b50, true); // signature
    dv.setUint16(4, 20, true); // version made by
    dv.setUint16(6, 20, true); // version needed to extract
    dv.setUint16(8, 0, true); // general purpose bit flag
    dv.setUint16(10, 0, true); // compression method = STORED
    dv.setUint16(12, 0, true); // last mod file time
    dv.setUint16(14, 0, true); // last mod file date
    dv.setUint32(16, c.crc, true); // crc-32
    dv.setUint32(20, c.size, true); // compressed size
    dv.setUint32(24, c.size, true); // uncompressed size
    dv.setUint16(28, c.nameBytes.length, true); // file name length
    dv.setUint16(30, 0, true); // extra field length
    dv.setUint16(32, 0, true); // file comment length
    dv.setUint16(34, 0, true); // disk number start
    dv.setUint16(36, 0, true); // internal file attributes
    dv.setUint32(38, 0, true); // external file attributes
    dv.setUint32(42, c.localOffset, true); // relative offset of local header
    cdh.set(c.nameBytes, 46);
    push(cdh);
  }
  const cdSize = offset - cdStart;

  // End Of Central Directory record (signature 0x06054b50)
  const eocd = new Uint8Array(22);
  const dv = new DataView(eocd.buffer);
  dv.setUint32(0, 0x06054b50, true); // signature
  dv.setUint16(4, 0, true); // number of this disk
  dv.setUint16(6, 0, true); // disk with start of central directory
  dv.setUint16(8, central.length, true); // entries on this disk
  dv.setUint16(10, central.length, true); // total entries
  dv.setUint32(12, cdSize, true); // size of central directory
  dv.setUint32(16, cdStart, true); // offset of central directory start
  dv.setUint16(20, 0, true); // .zip file comment length
  push(eocd);

  const total = new Uint8Array(offset);
  let p = 0;
  for (const c of chunks) {
    total.set(c, p);
    p += c.length;
  }
  return total;
}

describe("extractMetadata — epub bounded read", () => {
  const FILLER_SIZE = 4 * 1024 * 1024; // 4 MB

  function buildEpubFile(): File {
    const enc = new TextEncoder();
    const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    // Title lives in a plain unprefixed <title>: happy-dom's DOMParser does not
    // implement getElementsByTagNameNS, so parseOpfTitle's NS lookup finds
    // nothing and falls through to getElementsByTagName("title").
    const opfXml = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf">
  <metadata>
    <title>Bounded Read Book</title>
  </metadata>
</package>`;

    const zipBytes = buildStoredZip([
      { name: "mimetype", data: enc.encode("application/epub+zip") },
      { name: "META-INF/container.xml", data: enc.encode(containerXml) },
      { name: "OEBPS/content.opf", data: enc.encode(opfXml) },
      // Large filler: if the implementation full-read the file, this would
      // dominate the byte count. unzipit must never slice it.
      { name: "big.bin", data: new Uint8Array(FILLER_SIZE) },
    ]);

    return new File([zipBytes], "book.epub");
  }

  it("extracts the title reading only a small bounded fraction of a multi-MB archive", async () => {
    const file = buildEpubFile();
    expect(file.size).toBeGreaterThan(FILLER_SIZE); // sanity: filler dominates

    const sliceSpy = vi.spyOn(file, "slice");
    const arrayBufferSpy = vi.spyOn(file, "arrayBuffer");

    const result = await extractMetadata(file, "epub");

    // (a) correct title extracted — EPUB has no pageCount
    expect(result).toEqual({ title: "Bounded Read Book" });

    // (b) size-independence: total bytes sliced is far below the filler size.
    // unzipit reads a fixed ~64 KB tail to scan for the EOCD record (bounded by
    // its MAX_COMMENT_SIZE = 0xffff), then the central directory and the two
    // tiny requested entries (container.xml + OPF) — never the 4 MB filler. This
    // tail+directory total is independent of the archive size, so the assertion
    // proves the read does not scale with the file.
    let totalSliced = 0;
    for (const call of sliceSpy.mock.calls) {
      const begin = (call[0] as number | undefined) ?? 0;
      const end = call[1] as number | undefined;
      totalSliced += (end ?? file.size) - begin;
    }
    expect(totalSliced).toBeLessThan(128 * 1024); // 32x below the 4 MB filler

    // (c) no full-file materialization
    expect(arrayBufferSpy).not.toHaveBeenCalled();
  });
});

describe("BlobRangeTransport", () => {
  it("slices exactly [begin, end) and delivers the chunk via onDataRange without reading the full file", async () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const file = new File([bytes], "x.pdf");

    const t = new BlobRangeTransport(file);

    const sliceSpy = vi.spyOn(file, "slice");
    const arrayBufferSpy = vi.spyOn(file, "arrayBuffer");
    const onDataRangeSpy = vi.spyOn(t, "onDataRange");

    // requestDataRange returns void; fire it then flush the internal promise chain.
    t.requestDataRange(2, 6);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(sliceSpy).toHaveBeenCalledWith(2, 6);
    expect(onDataRangeSpy).toHaveBeenCalledOnce();
    const [begin, chunk] = onDataRangeSpy.mock.calls[0] as [number, Uint8Array];
    expect(begin).toBe(2);
    expect(chunk).toBeInstanceOf(Uint8Array);
    expect(Array.from(chunk)).toEqual([2, 3, 4, 5]);
    // The slice's own arrayBuffer() was called, but the file-level full read was not.
    expect(arrayBufferSpy).not.toHaveBeenCalled();
  });
});
