/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import "../../src/components/nav";
import type { AppNavElement } from "../../src/components/nav";

function createNav(): AppNavElement {
  const el = document.createElement("app-nav") as AppNavElement;
  document.body.appendChild(el);
  return el;
}

describe("AppNavElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders links", () => {
    const nav = createNav();
    nav.links = [
      { href: "#/", label: "Home" },
      { href: "#/about", label: "About" },
    ];
    const links = nav.querySelectorAll(".nav-links a");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("#/");
    expect(links[0].textContent).toBe("Home");
    expect(links[1].getAttribute("href")).toBe("#/about");
    expect(links[1].textContent).toBe("About");
  });

  it("renders sign-in link when user is null", () => {
    const nav = createNav();
    nav.links = [{ href: "#/", label: "Home" }];
    nav.user = null;
    expect(nav.querySelector("#sign-in")).toBeTruthy();
    expect(nav.querySelector("#sign-out")).toBeNull();
  });

  it("renders user display and sign-out when user is set", () => {
    const nav = createNav();
    nav.user = { displayName: "Test User", email: "test@example.com" };
    expect(nav.querySelector("#user-display")?.textContent).toBe("Test User");
    expect(nav.querySelector("#sign-out")).toBeTruthy();
    expect(nav.querySelector("#sign-in")).toBeNull();
  });

  it("falls back to email when displayName is null", () => {
    const nav = createNav();
    nav.user = { displayName: null, email: "test@example.com" };
    expect(nav.querySelector("#user-display")?.textContent).toBe("test@example.com");
  });

  it("falls back to 'User' when both displayName and email are null", () => {
    const nav = createNav();
    nav.user = { displayName: null, email: null };
    expect(nav.querySelector("#user-display")?.textContent).toBe("User");
  });

  it("hides auth section when showAuth is false", () => {
    const nav = createNav();
    nav.user = { displayName: "Test", email: null };
    nav.showAuth = false;
    expect(nav.querySelector("#user-display")).toBeNull();
    expect(nav.querySelector("#sign-in")).toBeNull();
    expect(nav.querySelector("#sign-out")).toBeNull();
  });

  it("shows auth section when showAuth is set back to true", () => {
    const nav = createNav();
    nav.user = { displayName: "Test", email: null };
    nav.showAuth = false;
    nav.showAuth = true;
    expect(nav.querySelector("#user-display")?.textContent).toBe("Test");
  });

  it("dispatches sign-in event", () => {
    const nav = createNav();
    nav.user = null;
    let fired = false;
    nav.addEventListener("sign-in", () => { fired = true; });
    (nav.querySelector("#sign-in") as HTMLElement).click();
    expect(fired).toBe(true);
  });

  it("dispatches sign-out event", () => {
    const nav = createNav();
    nav.user = { displayName: "Test", email: null };
    let fired = false;
    nav.addEventListener("sign-out", () => { fired = true; });
    (nav.querySelector("#sign-out") as HTMLElement).click();
    expect(fired).toBe(true);
  });

  it("sign-in event bubbles", () => {
    const nav = createNav();
    nav.user = null;
    let fired = false;
    document.body.addEventListener("sign-in", () => { fired = true; });
    (nav.querySelector("#sign-in") as HTMLElement).click();
    expect(fired).toBe(true);
  });

  it("escapes HTML in user displayName", () => {
    const nav = createNav();
    nav.user = { displayName: "<script>alert(1)</script>", email: null };
    const display = nav.querySelector("#user-display")!;
    expect(display.textContent).toBe("<script>alert(1)</script>");
    expect(display.innerHTML).not.toContain("<script>");
  });

  it("escapes HTML in link hrefs and labels", () => {
    const nav = createNav();
    nav.links = [{ href: '"><script>', label: "<b>XSS</b>" }];
    const link = nav.querySelector(".nav-links a")!;
    expect(link.innerHTML).not.toContain("<b>");
    expect(link.innerHTML).not.toContain("<script>");
  });

  it("preserves non-managed children between containers", () => {
    const nav = createNav();
    nav.links = [{ href: "#/", label: "Home" }];
    nav.user = null;

    const custom = document.createElement("select");
    custom.id = "group-select";
    nav.insertBefore(custom, nav.querySelector(".nav-auth"));

    // Re-render by setting user
    nav.user = { displayName: "Test", email: null };

    expect(nav.querySelector("#group-select")).toBe(custom);
    expect(nav.querySelector("#user-display")).toBeTruthy();
  });

  it("managed containers are span elements", () => {
    const nav = createNav();
    nav.links = [{ href: "#/", label: "Home" }];
    const linksContainer = nav.querySelector(".nav-links");
    const authContainer = nav.querySelector(".nav-auth");
    expect(linksContainer?.tagName).toBe("SPAN");
    expect(authContainer?.tagName).toBe("SPAN");
  });
});
