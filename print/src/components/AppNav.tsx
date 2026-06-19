import { Nav } from "@commons-systems/ds";
import type { User } from "../auth.js";

export interface AppNavProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  localFolderSlot: HTMLElement;
}

// Verbatim replacement for the old imperative <app-nav> custom element
// (components/src/nav.ts), composing the ds Nav. The `end` slot reproduces the
// production right-aligned chrome in DOM order: home link, the imperatively
// managed local-folder mount, then the auth control.
export function AppNav(props: AppNavProps) {
  return (
    <Nav
      links={[
        { href: "/", label: "Library" },
        { href: "/about", label: "About" },
      ]}
      end={
        <>
          <a href="https://commons.systems/">commons.systems</a>
          <span
            ref={(el) => {
              if (el && !el.contains(props.localFolderSlot))
                el.appendChild(props.localFolderSlot);
            }}
          />
          {props.user ? (
            <>
              <span id="user-display">
                {props.user.displayName || props.user.email || "User"}
              </span>
              <a
                href="#"
                id="sign-out"
                onClick={(e) => {
                  e.preventDefault();
                  props.onSignOut();
                }}
              >
                Logout
              </a>
            </>
          ) : (
            <a
              href="#"
              id="sign-in"
              onClick={(e) => {
                e.preventDefault();
                props.onSignIn();
              }}
            >
              Login
            </a>
          )}
        </>
      }
    />
  );
}
