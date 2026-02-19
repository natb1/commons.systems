import { describe, it, expect } from "vitest";
import { nsCollectionPath } from "../src/namespace.js";

describe("nsCollectionPath", () => {
  it("returns ns/{namespace}/{collectionName}", () => {
    expect(nsCollectionPath("emulator", "messages")).toBe(
      "ns/emulator/messages",
    );
  });

  it("works with prod namespace", () => {
    expect(nsCollectionPath("prod", "messages")).toBe("ns/prod/messages");
  });

  it("works with preview namespace", () => {
    expect(nsCollectionPath("preview-pr-42", "users")).toBe(
      "ns/preview-pr-42/users",
    );
  });

  it("throws on empty namespace", () => {
    expect(() => nsCollectionPath("", "messages")).toThrow(
      "namespace must not be empty",
    );
  });

  it("throws on empty collectionName", () => {
    expect(() => nsCollectionPath("emulator", "")).toThrow(
      "collectionName must not be empty",
    );
  });
});
