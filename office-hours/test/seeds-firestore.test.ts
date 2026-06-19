import { describe, it, expect } from "vitest";
import appSeed from "../seeds/firestore";

// The firestoreutil seed runner (firestoreutil/src/seed.ts) throws
// "seed document in <collection> has empty id" on any doc with a falsy id, and
// rejects duplicate ids. The seed builder maps a discriminated union of reminder
// and merge-pr entries, so every kind must yield a non-empty, unique id — a
// regression here is only caught at emulator/preview seed time (no other unit
// test covers seeds/firestore.ts), which is what broke #1482's first CI run.
describe("office-hours firestore seed", () => {
  const items = appSeed.collections.find((c) => c.name === "items");
  const docs = items?.documents ?? [];

  it("seeds an items collection with documents", () => {
    expect(items).toBeDefined();
    expect(docs.length).toBeGreaterThan(0);
  });

  it("gives every document a non-empty id (the seed.ts:56 invariant)", () => {
    for (const doc of docs) {
      expect(doc.id).toBeTruthy();
    }
  });

  it("gives every document a unique id", () => {
    const ids = docs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders the merge-pr entry with the sync-Function doc shape", () => {
    const mergePr = docs.filter((d) => d.data.kind === "merge-pr");
    expect(mergePr.length).toBe(1);
    const { id, data } = mergePr[0];
    expect(id).toBe(`merge-pr-${data.prNumber}`);
    for (const key of [
      "kind",
      "title",
      "repo",
      "issueNumber",
      "prTitle",
      "prUrl",
      "prNumber",
      "prRepo",
      "memberEmails",
      "updatedAt",
    ] as const) {
      expect(data).toHaveProperty(key);
    }
    // memberEmails is load-bearing: getOwnerReminders filters items by
    // array-contains on the viewer's email, so an empty list would hide the item.
    expect(Array.isArray(data.memberEmails) && data.memberEmails.length).toBeTruthy();
  });
});
