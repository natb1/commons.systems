import { describe, it, expect } from "vitest";
import { ABOUT_PAGE_META, NAV_LINKS, PERSON, SITE_DEFAULTS } from "../src/site-config";

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
    expect(NAV_LINKS).toContainEqual({ href: "/about", label: "About" });
  });

  it("includes the Home link", () => {
    expect(NAV_LINKS).toContainEqual({ href: "/", label: "Home" });
  });
});

describe("ABOUT_PAGE_META", () => {
  it("title is 'About'", () => {
    expect(ABOUT_PAGE_META.title).toBe("About");
  });

  it("url ends with /about", () => {
    expect(ABOUT_PAGE_META.url.endsWith("/about")).toBe(true);
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
