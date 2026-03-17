import { describe, it, expect } from "vitest";
import { nsCollectionPath, validateNamespace, type Namespace } from "../src/namespace.js";

describe("validateNamespace", () => {
  it("accepts valid namespace and returns it", () => {
    expect(validateNamespace("app/prod")).toBe("app/prod");
  });

  it("throws on empty namespace", () => {
    expect(() => validateNamespace("")).toThrow("namespace must not be empty");
  });

  it("throws on namespace without slash", () => {
    expect(() => validateNamespace("emulator")).toThrow(
      'namespace must be in "{app}/{env}" format',
    );
  });

  it("throws on multi-slash namespace", () => {
    expect(() => validateNamespace("a/b/c")).toThrow(
      'namespace must be in "{app}/{env}" format',
    );
  });
});

describe("nsCollectionPath", () => {
  it("returns {namespace}/{collectionName}", () => {
    const ns = validateNamespace("app/emulator");
    expect(nsCollectionPath(ns, "messages")).toBe("app/emulator/messages");
  });

  it("works with prod namespace", () => {
    const ns = validateNamespace("app/prod");
    expect(nsCollectionPath(ns, "messages")).toBe("app/prod/messages");
  });

  it("works with preview namespace", () => {
    const ns = validateNamespace("app/preview-pr-42");
    expect(nsCollectionPath(ns, "users")).toBe("app/preview-pr-42/users");
  });

  it("throws on empty collectionName", () => {
    const ns = validateNamespace("app/emulator");
    expect(() => nsCollectionPath(ns, "")).toThrow(
      "collectionName must not be empty",
    );
  });
});
