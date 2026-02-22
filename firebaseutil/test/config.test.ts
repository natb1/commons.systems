import { describe, it, expect } from "vitest";
import { firebaseConfig } from "../src/config";

describe("firebaseConfig", () => {
  it("has projectId", () => {
    expect(firebaseConfig.projectId).toBe("commons-systems");
  });

  it("has apiKey", () => {
    expect(typeof firebaseConfig.apiKey).toBe("string");
    expect(firebaseConfig.apiKey.length).toBeGreaterThan(0);
  });

  it("has authDomain", () => {
    expect(firebaseConfig.authDomain).toBe(
      "commons-systems.firebaseapp.com",
    );
  });
});
