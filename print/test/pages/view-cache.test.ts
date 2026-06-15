import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// view.ts transitively imports firestore/storage/auth/viewer modules that require
// Firebase env vars at module load time. Stub those out so the real media-cache
// path (which is what this test exercises) is not blocked.
vi.mock("../../src/firestore.js", () => ({
  getMediaItem: vi.fn(),
}));
vi.mock("../../src/storage.js", () => ({
  getMediaDownloadUrl: vi.fn(),
}));
vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));
vi.mock("../../src/viewer/shell.js", () => ({
  renderViewerShell: vi.fn().mockReturnValue('<div class="viewer">mock viewer</div>'),
  initViewer: vi.fn().mockReturnValue(() => {}),
}));
vi.mock("../../src/viewer/pdf.js", () => ({
  createPdfRenderer: vi.fn().mockReturnValue({}),
}));
vi.mock("../../src/viewer/epub.js", () => ({
  createEpubRenderer: vi.fn().mockReturnValue({}),
}));
vi.mock("../../src/viewer/image-archive.js", () => ({
  createImageArchiveRenderer: vi.fn().mockReturnValue({}),
}));
vi.mock("../../src/markdown-actions.js", () => ({
  wireMarkdownActions: vi.fn(),
}));
vi.mock("../../src/library.js", () => ({
  isLocalId: vi.fn().mockReturnValue(false),
  getLocalItem: vi.fn(),
  resolveLocalBlob: vi.fn(),
}));

import { resolveFileSource } from "../../src/pages/view.js";
import { getFile, closeDb } from "../../src/media-cache.js";

beforeEach(async () => {
  await closeDb();
  const req = indexedDB.deleteDatabase("print-media-cache");
  await new Promise<void>((resolve) => {
    req.onsuccess = () => resolve();
  });
  if (typeof globalThis.reportError !== "function") {
    globalThis.reportError = () => {};
  }
  vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  await closeDb();
});

describe("resolveFileSource caching", () => {
  it("caches the file after a first view even when the returned buffer is transferred", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(bytes, { status: 200 }));

    const storagePath = "users/u1/doc.pdf";
    const result = await resolveFileSource("https://example.test/doc.pdf", storagePath);

    // Simulate pdf.js's worker transfer: detach the returned buffer synchronously,
    // before yielding again. On unfixed code, the still-pending putFile(buf) would
    // observe the detached buffer at store.put and reject with DataCloneError.
    structuredClone(result, { transfer: [result as ArrayBuffer] });
    expect((result as ArrayBuffer).byteLength).toBe(0);

    await vi.waitFor(async () => {
      expect(await getFile(storagePath)).not.toBeNull();
    });
    expect(new Uint8Array((await getFile(storagePath))!)).toEqual(bytes);
  });
});
