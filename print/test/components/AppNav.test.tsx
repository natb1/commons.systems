import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { AppNav, NAV_LINKS } from "../../src/components/AppNav.tsx";
import type { User } from "../../src/auth.js";

const mockUser = {
  displayName: "Test User",
  email: "t@e.com",
} as unknown as User;

describe("AppNav links", () => {
  // PageShell renders the ds <Nav> from NAV_LINKS now, not AppNav; the
  // Library/About coverage relocates to the exported NAV_LINKS const.
  it("exposes the Library link in NAV_LINKS", () => {
    expect(NAV_LINKS).toContainEqual({ href: "/", label: "Library" });
  });

  it("exposes the About link in NAV_LINKS", () => {
    expect(NAV_LINKS).toContainEqual({ href: "/about", label: "About" });
  });

  it("renders commons.systems home link", () => {
    const html = renderToStaticMarkup(
      <AppNav
        user={null}
        onSignIn={() => {}}
        onSignOut={() => {}}
        localFolderSlot={document.createElement("span")}
      />,
    );
    expect(html).toContain('href="https://commons.systems/"');
    expect(html).toContain("commons.systems");
  });
});

describe("AppNav auth swap", () => {
  it("shows sign-in and hides sign-out when user is null", () => {
    const html = renderToStaticMarkup(
      <AppNav
        user={null}
        onSignIn={() => {}}
        onSignOut={() => {}}
        localFolderSlot={document.createElement("span")}
      />,
    );
    expect(html).toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
  });

  it("shows user-display and sign-out and hides sign-in when user is set", () => {
    const html = renderToStaticMarkup(
      <AppNav
        user={mockUser}
        onSignIn={() => {}}
        onSignOut={() => {}}
        localFolderSlot={document.createElement("span")}
      />,
    );
    expect(html).toContain('id="user-display"');
    expect(html).toContain("Test User");
    expect(html).toContain('id="sign-out"');
    expect(html).not.toContain('id="sign-in"');
  });
});

describe("AppNav local-folder mount-survival", () => {
  it("imperatively-injected slot content survives auth re-render", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const slot = document.createElement("span");
    slot.id = "local-folder";
    // Imperatively inject content (as initLocalFolder does in production):
    slot.innerHTML = '<button class="local-folder-button">Folder</button>';

    const root = createRoot(container);
    flushSync(() =>
      root.render(
        <AppNav
          user={null}
          onSignIn={() => {}}
          onSignOut={() => {}}
          localFolderSlot={slot}
        />,
      ),
    );
    expect(container.querySelector("#local-folder .local-folder-button")).not.toBeNull();

    // Re-render with a DIFFERENT user (the auth-change path):
    flushSync(() =>
      root.render(
        <AppNav
          user={mockUser}
          onSignIn={() => {}}
          onSignOut={() => {}}
          localFolderSlot={slot}
        />,
      ),
    );
    // The imperatively-injected button must SURVIVE the nav re-render untouched:
    expect(container.querySelector("#local-folder .local-folder-button")).not.toBeNull();

    root.unmount();
    document.body.removeChild(container);
  });
});
