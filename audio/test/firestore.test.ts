import { describe, it, expect, vi } from "vitest";

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "audio/test",
}));

import { NAMESPACE } from "../src/firestore";

describe("firestore", () => {
  it("re-exports NAMESPACE from firebase config", () => {
    expect(NAMESPACE).toBe("audio/test");
  });
});
