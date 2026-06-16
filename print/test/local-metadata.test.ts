import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pdfjs-dist BEFORE importing local-metadata. The module does:
//   import * as pdfjsLib from "pdfjs-dist"
//   import "./viewer/pdf.js"   ← side-effect that sets workerSrc
// We mock both so local-metadata.ts loads cleanly with no real worker setup.

const mockDestroy = vi.fn().mockResolvedValue(undefined);
const mockGetMetadata = vi.fn();
const mockGetDocument = vi.fn();

vi.mock("pdfjs-dist", () => ({
  default: {},
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
  GlobalWorkerOptions: { workerSrc: "" },
  version: "0.0.0",
}));

// No-op the side-effect import of ./viewer/pdf.js (which sets workerSrc)
vi.mock("../src/viewer/pdf.js", () => ({}));

// Mock errorutil/log so logError calls don't throw
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

import { parseContainerXml, parseOpfTitle, extractMetadata } from "../src/local-metadata.js";

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

    const result = await extractMetadata(new ArrayBuffer(8), "pdf");

    expect(result).toEqual({ title: "Great Book", pageCount: 42 });
    expect(destroy).toHaveBeenCalled();
  });

  it("returns only pageCount when Title is empty/whitespace", async () => {
    const { destroy } = makeFakeDoc("   ", 10);

    const result = await extractMetadata(new ArrayBuffer(8), "pdf");

    expect(result).toEqual({ pageCount: 10 });
    expect(result.title).toBeUndefined();
    expect(destroy).toHaveBeenCalled();
  });

  it("returns only pageCount when Title is undefined", async () => {
    const { destroy } = makeFakeDoc(undefined, 5);

    const result = await extractMetadata(new ArrayBuffer(8), "pdf");

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
    const result = await extractMetadata(new ArrayBuffer(8), "pdf");
    expect(result).toEqual({});
    expect(destroy).toHaveBeenCalled();
  });

  it("returns {} and does not throw when getDocument rejects", async () => {
    mockGetDocument.mockReturnValue({ promise: Promise.reject(new Error("worker crash")) });

    const result = await extractMetadata(new ArrayBuffer(8), "pdf");
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
