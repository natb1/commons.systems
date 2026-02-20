import { describe, it, expect, vi } from "vitest";
import { seed, type SeedSpec } from "../src/seed.js";

function createMockFirestore() {
  const setCalls: { path: string; data: Record<string, unknown> }[] = [];

  const mockSet = vi.fn(async (data: Record<string, unknown>) => {
    // Data is captured in the doc() call below
    setCalls[setCalls.length - 1].data = data;
  });

  const mockDoc = vi.fn((path: string) => {
    setCalls.push({ path, data: {} });
    return { set: mockSet };
  });

  const db = { doc: mockDoc } as unknown as import("firebase-admin/firestore").Firestore;

  return { db, mockDoc, mockSet, setCalls };
}

describe("seed", () => {
  it("writes documents to namespaced collection paths", async () => {
    const { db, mockDoc, mockSet } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "emulator",
      collections: [
        {
          name: "messages",
          documents: [
            { id: "msg-1", data: { text: "Hello" } },
            { id: "msg-2", data: { text: "World" } },
          ],
        },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).toHaveBeenCalledTimes(2);
    expect(mockDoc).toHaveBeenCalledWith("ns/emulator/messages/msg-1");
    expect(mockDoc).toHaveBeenCalledWith("ns/emulator/messages/msg-2");
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith({ text: "Hello" });
    expect(mockSet).toHaveBeenCalledWith({ text: "World" });
  });

  it("handles multiple collections", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "test",
      collections: [
        {
          name: "messages",
          documents: [{ id: "m1", data: { text: "Hi" } }],
        },
        {
          name: "users",
          documents: [{ id: "u1", data: { name: "Alice" } }],
        },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).toHaveBeenCalledWith("ns/test/messages/m1");
    expect(mockDoc).toHaveBeenCalledWith("ns/test/users/u1");
  });

  it("handles empty collections array", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "empty",
      collections: [],
    };

    await seed(db, spec);

    expect(mockDoc).not.toHaveBeenCalled();
  });
});
