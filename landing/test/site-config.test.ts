import { describe, it, expect, beforeEach } from "vitest";
import { updateStaticPageMeta } from "@commons-systems/blog/og-meta";
import { ABOUT_PAGE_META, NAV_LINKS, PERSON, SITE_DEFAULTS, SITE_URL } from "../src/site-config";

describe("SITE_DEFAULTS", () => {
  it("description stays within 160 chars (Google SERP truncation threshold)", () => {
    expect(SITE_DEFAULTS.description.length).toBeLessThanOrEqual(160);
  });

  it("image is an absolute path starting with /", () => {
    expect(SITE_DEFAULTS.image.startsWith("/")).toBe(true);
  });

  it("image is a .png asset", () => {
    expect(SITE_DEFAULTS.image.endsWith(".png")).toBe(true);
  });
});

describe("NAV_LINKS", () => {
  it("includes the About link", () => {
    expect(NAV_LINKS).toContainEqual({ href: "/about", label: "About", align: "end" });
  });

  it("includes the Home link", () => {
    expect(NAV_LINKS).toContainEqual({ href: "/", label: "Home" });
  });
});

describe("ABOUT_PAGE_META", () => {
  it("title is 'About'", () => {
    expect(ABOUT_PAGE_META.title).toBe("About");
  });

  it("url is the root-relative path /about", () => {
    expect(ABOUT_PAGE_META.url).toBe("/about");
  });

  it("type is 'profile'", () => {
    expect(ABOUT_PAGE_META.type).toBe("profile");
  });
});

describe("PERSON", () => {
  it("email is nathan@natb1.com", () => {
    expect(PERSON.email).toBe("nathan@natb1.com");
  });

  it("jobTitle is set", () => {
    expect(PERSON.jobTitle).toBe("Independent contractor");
  });

  it("sameAs links to GitHub", () => {
    expect(PERSON.sameAs).toContain("https://github.com/natb1");
  });
});

// Regression for the doubled-origin bug: exercises the real SITE_URL + ABOUT_PAGE_META
// constant + updateStaticPageMeta, the exact production path from main.ts SPA navigation.
describe("ABOUT_PAGE_META rendered via updateStaticPageMeta", () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove());
    document.head.querySelectorAll('meta[name^="twitter:"]').forEach((el) => el.remove());
    document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
    document.title = "";
  });

  it("renders og:url as a single, non-doubled origin", () => {
    updateStaticPageMeta(SITE_URL, ABOUT_PAGE_META, "commons.systems");
    const ogUrl = document
      .querySelector<HTMLMetaElement>('meta[property="og:url"]')
      ?.getAttribute("content");
    expect(ogUrl).toBe("https://commons.systems/about");
  });
});
