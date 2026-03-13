import { describe, it, expect } from "vitest";
import { firebaseConfig } from "../src/config";

describe("firebaseConfig", () => {
  it("has projectId", () => {
    expect(firebaseConfig.projectId).toBe("commons-systems");
  });

  it("has apiKey", () => {
    expect(firebaseConfig.apiKey).toBe(
      "AIzaSyCeT2nQbB_RCtu2Ybt9D3828okcodri4wc",
    );
  });

  it("has authDomain fallback in Node.js", () => {
    expect(firebaseConfig.authDomain).toBe(
      "commons-systems.firebaseapp.com",
    );
  });

  it("has storageBucket", () => {
    expect(firebaseConfig.storageBucket).toBe(
      "commons-systems.firebasestorage.app",
    );
  });

  it("has appId", () => {
    expect(firebaseConfig.appId).toBe(
      "1:1043497797028:web:2aa63913a15aa053062d31",
    );
  });
});
