import { Nav } from "@commons-systems/ds";
import type { User } from "../auth.js";

export interface AppNavProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  localFolderSlot: HTMLElement;
}

// Stub AppNav (Unit 3 makes this verbatim — home link, #user-display, exact
// ordering). For now it composes the ds Nav with the two app links, mounts the
// imperatively-managed localFolderSlot as an opaque DOM node, and renders a
// minimal Login/Logout control so the tree builds and is navigable.
export function AppNav(props: AppNavProps) {
  return (
    <Nav
      links={[
        { href: "/", label: "Library" },
        { href: "/about", label: "About" },
      ]}
      end={
        <>
          <span
            ref={(el) => {
              if (el && !el.contains(props.localFolderSlot))
                el.appendChild(props.localFolderSlot);
            }}
          />
          {props.user ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                props.onSignOut();
              }}
            >
              Logout
            </a>
          ) : (
            <a
              href="#"
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
