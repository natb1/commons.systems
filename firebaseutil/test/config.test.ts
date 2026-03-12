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

  it("has authDomain fallback in Node.js", () => {
    expect(firebaseConfig.authDomain).toBe(
      "commons-systems.firebaseapp.com",
    );
  });

  it("has appId", () => {
    expect(firebaseConfig.appId).toBe(
      "1:1043497797028:web:2aa63913a15aa053062d31",
    );
  });
});
