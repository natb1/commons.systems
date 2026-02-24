import { describe, it, expect } from "vitest";
import type { User } from "firebase/auth";
import { renderNav } from "../../src/components/nav";

const mockUser = {
  displayName: "Test User",
  email: "test@example.com",
} as User;

describe("renderNav", () => {
  it("returns HTML with a link to the home route", () => {
    const html = renderNav(null);
    expect(html).toContain('href="#/"');
  });

  it("returns HTML with a link to the about route", () => {
    const html = renderNav(null);
    expect(html).toContain('href="#/about"');
  });

  it("includes a Notes link when signed out", () => {
    const html = renderNav(null);
    expect(html).toContain('href="#/notes"');
  });

  it("includes a Notes link when signed in", () => {
    const html = renderNav(mockUser);
    expect(html).toContain('href="#/notes"');
  });

  it("shows sign-in link when user is null", () => {
    const html = renderNav(null);
    expect(html).toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
  });

  it("shows sign-out link and user display when user is present", () => {
    const html = renderNav(mockUser);
    expect(html).toContain('id="sign-out"');
    expect(html).toContain('id="user-display"');
    expect(html).toContain("Test User");
    expect(html).not.toContain('id="sign-in"');
  });
});
