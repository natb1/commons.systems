import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeUser } from "./helpers/make-user";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "print/test",
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: (ns: string, col: string) => `${ns}/${col}`,
}));

import { getMedia } from "../src/firestore";

const validEpub = {
  id: "phaedrus",
  data: () => ({
    title: "Phaedrus",
    mediaType: "epub",
    publicDomain: true,
    sizeBytes: 500_000,
    tags: { genre: "philosophy" },
    sourceNotes: "Platonic Foundation: https://www.platonicfoundation.org/translation/phaedrus",
  }),
};

const validPdf = {
  id: "republic",
  data: () => ({
    title: "The Republic",
    mediaType: "pdf",
    publicDomain: true,
    sizeBytes: 1_200_000,
    tags: { genre: "philosophy", era: "classical" },
    sourceNotes: "Platonic Foundation: https://www.platonicfoundation.org/translation/republic",
  }),
};

const validCbz = {
  id: "comic-1",
  data: () => ({
    title: "Amazing Comic",
    mediaType: "cbz",
    publicDomain: false,
    sizeBytes: 25_000_000,
    tags: {},
    sourceNotes: "Private GCS bucket: rml-media/print/comic-1.cbz",
  }),
};

const testUser = makeUser({ uid: "user-123" });

describe("getMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockWhere.mockImplementation((...args: unknown[]) => ({ _where: args }));
    mockQuery.mockImplementation((...args: unknown[]) => ({ _query: args }));
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "print/test/media",
    );
  });

  it("runs single publicDomain query for unauthenticated user", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(null);

    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
  });

  it("runs two queries for authenticated user (public + memberUids)", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(testUser);

    expect(mockWhere).toHaveBeenCalledTimes(2);
    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
    expect(mockWhere).toHaveBeenCalledWith("memberUids", "array-contains", "user-123");
    expect(mockGetDocs).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when snapshot has no docs", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const result = await getMedia(null);

    expect(result.items).toEqual([]);
    expect(result.skippedCount).toBe(0);
  });

  it("maps valid documents to MediaMeta objects", async () => {
    mockGetDocs.mockResolvedValue({ docs: [validEpub] });

    const { items } = await getMedia(null);

    expect(items).toEqual([
      {
        id: "phaedrus",
        title: "Phaedrus",
        mediaType: "epub",
        publicDomain: true,
        sizeBytes: 500_000,
        tags: { genre: "philosophy" },
        sourceNotes: "Platonic Foundation: https://www.platonicfoundation.org/translation/phaedrus",
      },
    ]);
  });

  it("merges results from both queries for authenticated user", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [validEpub, validPdf] })
      .mockResolvedValueOnce({ docs: [validCbz] });

    const { items } = await getMedia(testUser);

    expect(items).toHaveLength(3);
  });

  it("deduplicates items appearing in both query results", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [validEpub] })
      .mockResolvedValueOnce({ docs: [validEpub, validCbz] });

    const { items } = await getMedia(testUser);

    expect(items).toHaveLength(2);
    const ids = items.map((i) => i.id);
    expect(ids).toContain("phaedrus");
    expect(ids).toContain("comic-1");
  });

  it("sorts results client-side by title for unauthenticated user", async () => {
    const zeta = {
      id: "zeta",
      data: () => ({
        title: "Zeta Book",
        mediaType: "pdf",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    const alpha = {
      id: "alpha",
      data: () => ({
        title: "Alpha Book",
        mediaType: "epub",
        publicDomain: true,
        sizeBytes: 200,
        tags: {},
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [zeta, alpha] });

    const { items } = await getMedia(null);

    expect(items[0].title).toBe("Alpha Book");
    expect(items[1].title).toBe("Zeta Book");
  });

  it("sorts results client-side by title for authenticated user", async () => {
    const zeta = {
      id: "zeta",
      data: () => ({
        title: "Zeta Book",
        mediaType: "pdf",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    const alpha = {
      id: "alpha",
      data: () => ({
        title: "Alpha Book",
        mediaType: "epub",
        publicDomain: true,
        sizeBytes: 200,
        tags: {},
      }),
    };
    mockGetDocs
      .mockResolvedValueOnce({ docs: [zeta] })
      .mockResolvedValueOnce({ docs: [alpha] });

    const { items } = await getMedia(testUser);

    expect(items[0].title).toBe("Alpha Book");
    expect(items[1].title).toBe("Zeta Book");
  });

  it("filters out documents with missing title", async () => {
    const noTitle = {
      id: "no-title",
      data: () => ({
        mediaType: "pdf",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [validEpub, noTitle] });

    const { items, skippedCount } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("phaedrus");
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("no-title"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("filters out documents with empty title", async () => {
    const emptyTitle = {
      id: "empty-title",
      data: () => ({
        title: "",
        mediaType: "pdf",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [emptyTitle] });

    const { items, skippedCount } = await getMedia(null);

    expect(items).toHaveLength(0);
    expect(skippedCount).toBe(1);
    consoleError.mockRestore();
  });

  it("filters out documents with invalid mediaType", async () => {
    const badType = {
      id: "bad-type",
      data: () => ({
        title: "Bad Type Book",
        mediaType: "txt",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [badType] });

    const { items, skippedCount } = await getMedia(null);

    expect(items).toHaveLength(0);
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("bad-type"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("filters out documents with missing mediaType", async () => {
    const noType = {
      id: "no-type",
      data: () => ({
        title: "No Type Book",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [noType] });

    const { items, skippedCount } = await getMedia(null);

    expect(items).toHaveLength(0);
    expect(skippedCount).toBe(1);
    consoleError.mockRestore();
  });

  it("treats non-boolean publicDomain as false", async () => {
    const badPublic = {
      id: "bad-public",
      data: () => ({
        title: "Bad Public",
        mediaType: "pdf",
        publicDomain: "yes",
        sizeBytes: 100,
        tags: {},
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [badPublic] });

    const { items } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(items[0].publicDomain).toBe(false);
  });

  it("defaults sizeBytes to 0 when not a number", async () => {
    const noSize = {
      id: "no-size",
      data: () => ({
        title: "No Size",
        mediaType: "epub",
        publicDomain: true,
        tags: {},
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [noSize] });

    const { items } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(items[0].sizeBytes).toBe(0);
  });

  it("defaults tags to empty object when missing", async () => {
    const noTags = {
      id: "no-tags",
      data: () => ({
        title: "No Tags",
        mediaType: "epub",
        publicDomain: true,
        sizeBytes: 100,
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [noTags] });

    const { items } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(items[0].tags).toEqual({});
  });

  it("defaults sourceNotes to empty string when missing", async () => {
    const noNotes = {
      id: "no-notes",
      data: () => ({
        title: "No Notes",
        mediaType: "epub",
        publicDomain: true,
        sizeBytes: 100,
        tags: {},
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [noNotes] });

    const { items } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(items[0].sourceNotes).toBe("");
  });

  it("defaults tags to empty object when tags is an array", async () => {
    const arrayTags = {
      id: "array-tags",
      data: () => ({
        title: "Array Tags",
        mediaType: "epub",
        publicDomain: true,
        sizeBytes: 100,
        tags: ["a", "b"],
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [arrayTags] });

    const { items } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(items[0].tags).toEqual({});
  });

  it("increments skippedCount for each invalid document", async () => {
    const bad1 = {
      id: "bad1",
      data: () => ({ mediaType: "pdf", publicDomain: true, sizeBytes: 0 }),
    };
    const bad2 = {
      id: "bad2",
      data: () => ({ title: "OK", mediaType: "invalid", publicDomain: true, sizeBytes: 0 }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [bad1, bad2, validEpub] });

    const { items, skippedCount } = await getMedia(null);

    expect(items).toHaveLength(1);
    expect(skippedCount).toBe(2);
    consoleError.mockRestore();
  });
});
