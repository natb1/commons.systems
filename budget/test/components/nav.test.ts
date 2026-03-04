import { describe, it, expect } from "vitest";
import type { User } from "firebase/auth";
import { renderNav } from "../../src/components/nav";

const mockUser = {
  displayName: "Test User",
  email: "test@example.com",
} as User;

const mockGroups = [
  { id: "household", name: "household" },
  { id: "work", name: "work" },
];

describe("renderNav", () => {
  it("returns HTML with a link to the home route", () => {
    const html = renderNav(null);
    expect(html).toContain('href="#/"');
  });

  it("returns HTML with a link to the about route", () => {
    const html = renderNav(null);
    expect(html).toContain('href="#/about"');
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

  it("renders group select when user has groups", () => {
    const html = renderNav(mockUser, mockGroups, "household");
    expect(html).toContain('id="group-select"');
    expect(html).toContain("household");
    expect(html).toContain("work");
  });

  it("marks selected group in dropdown", () => {
    const html = renderNav(mockUser, mockGroups, "work");
    expect(html).toContain('value="work" selected');
    expect(html).not.toContain('value="household" selected');
  });

  it("does not render group select when user is null", () => {
    const html = renderNav(null, mockGroups, "household");
    expect(html).not.toContain('id="group-select"');
  });

  it("does not render group select when groups is empty", () => {
    const html = renderNav(mockUser, [], null);
    expect(html).not.toContain('id="group-select"');
  });
});
