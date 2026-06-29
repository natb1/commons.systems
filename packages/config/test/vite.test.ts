import { describe, it, expect } from "vitest";
import { createAppConfig, createLibConfig } from "../vite.js";

describe("createAppConfig", () => {
  it("includes firebase dedupe in base config", () => {
    const config = createAppConfig();
    expect(config.resolve?.dedupe).toContain("firebase");
    expect(config.resolve?.dedupe).toContain("firebase/app");
    expect(config.resolve?.dedupe).toContain("firebase/firestore");
  });

  it("includes happy-dom test environment", () => {
    const config = createAppConfig();
    expect(config.test?.environment).toBe("happy-dom");
  });

  it("sets build target to es2022", () => {
    const config = createAppConfig();
    expect(config.build?.target).toBe("es2022");
  });

  it("strips legal comments from bundles", () => {
    const config = createAppConfig();
    expect(config.esbuild?.legalComments).toBe("none");
  });

  it("includes test file pattern", () => {
    const config = createAppConfig();
    expect(config.test?.include).toContain("test/**/*.test.ts");
  });

  it("merges overrides into base config", () => {
    const config = createAppConfig({
      server: { proxy: { "/api/example": { target: "http://localhost:5001" } } },
    });
    expect(config.server?.proxy?.["/api/example"]?.target).toBe(
      "http://localhost:5001",
    );
    expect(config.resolve?.dedupe).toContain("firebase");
  });

  it("concatenates dedupe arrays from overrides", () => {
    const config = createAppConfig({
      resolve: { dedupe: ["pdfjs-dist", "epubjs"] },
    });
    expect(config.resolve?.dedupe).toContain("firebase");
    expect(config.resolve?.dedupe).toContain("pdfjs-dist");
    expect(config.resolve?.dedupe).toContain("epubjs");
  });
});

describe("createLibConfig", () => {
  it("includes test file pattern", () => {
    const config = createLibConfig();
    expect(config.test?.include).toContain("test/**/*.test.ts");
  });

  it("does not include firebase dedupe", () => {
    const config = createLibConfig();
    expect(config.resolve?.dedupe).toBeUndefined();
  });

  it("does not set test environment by default", () => {
    const config = createLibConfig();
    expect(config.test?.environment).toBeUndefined();
  });

  it("merges test environment override", () => {
    const config = createLibConfig({
      test: { environment: "happy-dom" },
    });
    expect(config.test?.environment).toBe("happy-dom");
    expect(config.test?.include).toContain("test/**/*.test.ts");
  });
});
