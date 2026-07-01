import type { NavLink } from "@commons-systems/ds";
import type { User } from "../auth.js";

export interface AppNavProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  localFolderSlot: HTMLElement;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Library" },
  { href: "/about", label: "About" },
];

// The nav-end chrome for print's page shell. PageShell now owns the ds <Nav>
// itself (rendered from NAV_LINKS); AppNav supplies only the right-aligned
// nav-end fragment, in DOM order: the commons.systems home link, the
// imperatively managed local-folder mount, then the auth control.
export function AppNav(props: AppNavProps) {
  return (
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
  );
}
