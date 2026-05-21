import { describe, it, expect, beforeEach } from "vitest";
import { updateCanonical } from "../src/canonical";

describe("updateCanonical", () => {
  beforeEach(() => {
    document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  });

  it("adds a canonical link when none exists", () => {
    updateCanonical("https://example.com");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el).not.toBeNull();
    expect(el!.getAttribute("href")).toBe("https://example.com/");
  });

  it("sets canonical to siteUrl/ for the homepage", () => {
    updateCanonical("https://example.com");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el!.getAttribute("href")).toBe("https://example.com/");
  });

  it("sets canonical to post URL when slug is provided", () => {
    updateCanonical("https://example.com", "hello-world");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el!.getAttribute("href")).toBe("https://example.com/post/hello-world");
  });

  it("updates existing canonical instead of duplicating", () => {
    updateCanonical("https://example.com", "post-a");
    updateCanonical("https://example.com", "post-b");
    const all = document.querySelectorAll('link[rel="canonical"]');
    expect(all).toHaveLength(1);
    expect(all[0].getAttribute("href")).toBe("https://example.com/post/post-b");
  });

  it("navigating from post back to homepage resets canonical to homepage", () => {
    updateCanonical("https://example.com", "post-a");
    updateCanonical("https://example.com");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el!.getAttribute("href")).toBe("https://example.com/");
  });

  it("encodes slugs with special characters", () => {
    updateCanonical("https://example.com", "a b");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el!.getAttribute("href")).toBe("https://example.com/post/a%20b");
  });

  it("throws when siteUrl is empty", () => {
    expect(() => updateCanonical("")).toThrow(/siteUrl is required/);
  });

  it("uses explicitPath when provided", () => {
    updateCanonical("https://example.com", undefined, "/about");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el!.getAttribute("href")).toBe("https://example.com/about");
  });

  it("explicitPath overrides slug", () => {
    updateCanonical("https://example.com", "some-post", "/about");
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el!.getAttribute("href")).toBe("https://example.com/about");
  });

  it("throws when explicitPath does not start with /", () => {
    expect(() => updateCanonical("https://example.com", undefined, "about")).toThrow(
      /explicitPath must start with/,
    );
  });
});
