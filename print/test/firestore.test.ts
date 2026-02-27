import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeUser } from "./helpers/make-user";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "print/test",
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: (ns: string, col: string) => `${ns}/${col}`,
}));

vi.mock("../src/is-authorized.js", () => ({
  isAuthorized: vi.fn(),
}));

import { getMedia } from "../src/firestore";
import { isAuthorized } from "../src/is-authorized";

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

const natb1User = makeUser({ screenName: "natb1" });
const otherUser = makeUser({ screenName: "other", providerDisplayName: "other-name" });

describe("getMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockOrderBy.mockReturnValue("mock-order");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
  });

  it("queries the correct namespaced collection path", async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "print/test/media",
    );
  });

  it("uses orderBy('title') for admin queries", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(natb1User);

    expect(mockOrderBy).toHaveBeenCalledWith("title");
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("uses where filter for non-admin queries", async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(null);

    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
    expect(mockOrderBy).not.toHaveBeenCalled();
  });

  it("uses where filter for non-admin signed-in user", async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMedia(otherUser);

    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
    expect(mockOrderBy).not.toHaveBeenCalled();
  });

  it("returns empty array when snapshot has no docs", async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    mockGetDocs.mockResolvedValue({ docs: [] });

    const result = await getMedia(null);

    expect(result.items).toEqual([]);
    expect(result.skippedCount).toBe(0);
  });

  it("maps valid documents to MediaMeta objects", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
    mockGetDocs.mockResolvedValue({ docs: [validEpub] });

    const { items } = await getMedia(natb1User);

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

  it("returns all media types for admin", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
    mockGetDocs.mockResolvedValue({ docs: [validEpub, validPdf, validCbz] });

    const { items } = await getMedia(natb1User);

    expect(items).toHaveLength(3);
  });

  it("sorts non-admin results client-side by title", async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
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

  it("does not sort admin results client-side", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items } = await getMedia(natb1User);

    // Admin results keep Firestore order (orderBy), not re-sorted client-side
    expect(items[0].title).toBe("Zeta Book");
    expect(items[1].title).toBe("Alpha Book");
  });

  it("filters out documents with missing title", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items, skippedCount } = await getMedia(natb1User);

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
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items, skippedCount } = await getMedia(natb1User);

    expect(items).toHaveLength(0);
    expect(skippedCount).toBe(1);
    consoleError.mockRestore();
  });

  it("filters out documents with invalid mediaType", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items, skippedCount } = await getMedia(natb1User);

    expect(items).toHaveLength(0);
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("bad-type"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("filters out documents with missing mediaType", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items, skippedCount } = await getMedia(natb1User);

    expect(items).toHaveLength(0);
    expect(skippedCount).toBe(1);
    consoleError.mockRestore();
  });

  it("treats non-boolean publicDomain as false", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items } = await getMedia(natb1User);

    expect(items).toHaveLength(1);
    expect(items[0].publicDomain).toBe(false);
  });

  it("defaults sizeBytes to 0 when not a number", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items } = await getMedia(natb1User);

    expect(items).toHaveLength(1);
    expect(items[0].sizeBytes).toBe(0);
  });

  it("defaults tags to empty object when missing", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items } = await getMedia(natb1User);

    expect(items).toHaveLength(1);
    expect(items[0].tags).toEqual({});
  });

  it("defaults sourceNotes to empty string when missing", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items } = await getMedia(natb1User);

    expect(items).toHaveLength(1);
    expect(items[0].sourceNotes).toBe("");
  });

  it("defaults tags to empty object when tags is an array", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items } = await getMedia(natb1User);

    expect(items).toHaveLength(1);
    expect(items[0].tags).toEqual({});
  });

  it("increments skippedCount for each invalid document", async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
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

    const { items, skippedCount } = await getMedia(natb1User);

    expect(items).toHaveLength(1);
    expect(skippedCount).toBe(2);
    consoleError.mockRestore();
  });
});
