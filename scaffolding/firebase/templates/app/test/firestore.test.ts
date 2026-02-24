import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "test-ns",
}));

import { getMessages, getNotes } from "../src/firestore";

describe("getMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockOrderBy.mockReturnValue("mock-order");
    mockQuery.mockReturnValue("mock-query");
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMessages();

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "ns/test-ns/messages",
    );
  });

  it("orders results by createdAt", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getMessages();

    expect(mockOrderBy).toHaveBeenCalledWith("createdAt");
  });

  it("maps Firestore documents to Message objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "greeting-1",
          data: () => ({
            text: "Welcome",
            author: "system",
            createdAt: "2026-01-01T00:00:00Z",
          }),
        },
        {
          id: "greeting-2",
          data: () => ({
            text: "Hello",
            author: "system",
            createdAt: "2026-01-01T00:01:00Z",
          }),
        },
      ],
    });

    const messages = await getMessages();

    expect(messages).toEqual([
      {
        id: "greeting-1",
        text: "Welcome",
        author: "system",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "greeting-2",
        text: "Hello",
        author: "system",
        createdAt: "2026-01-01T00:01:00Z",
      },
    ]);
  });
});

describe("getNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockOrderBy.mockReturnValue("mock-order");
    mockQuery.mockReturnValue("mock-query");
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getNotes();

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "ns/test-ns/notes",
    );
  });

  it("orders results by createdAt", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getNotes();

    expect(mockOrderBy).toHaveBeenCalledWith("createdAt");
  });

  it("maps Firestore documents to Note objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "note-1",
          data: () => ({
            text: "First note",
            createdAt: "2026-01-01T00:00:00Z",
          }),
        },
        {
          id: "note-2",
          data: () => ({
            text: "Second note",
            createdAt: "2026-01-01T00:01:00Z",
          }),
        },
      ],
    });

    const notes = await getNotes();

    expect(notes).toEqual([
      {
        id: "note-1",
        text: "First note",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "note-2",
        text: "Second note",
        createdAt: "2026-01-01T00:01:00Z",
      },
    ]);
  });
});
