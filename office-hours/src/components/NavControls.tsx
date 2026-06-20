import type { User } from "firebase/auth";

import { signIn, signOut } from "../firebase.js";

export interface NavControlsProps {
  /** The signed-in user, or null. Owned by App. */
  user: User | null;
}

/**
 * The DS Nav `end` slot for office-hours: the auth control (Login when signed
 * out; user-display + Logout when signed in).
 *
 * Reproduces the exact DOM the old `<app-nav>` custom element emitted — the e2e
 * specs query `#sign-in`, `#sign-out`, and `#user-display`. office-hours shows
 * no home link and no in-app nav links, so this slot is auth-only.
 */
export function NavControls({ user }: NavControlsProps) {
  return (
    <span className="nav-auth">
      {user ? (
        <>
          <span id="user-display">
            {user.displayName || user.email || "User"}
          </span>
          <a
            href="#"
            id="sign-out"
            onClick={(e) => {
              e.preventDefault();
              void signOut();
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
            void signIn();
          }}
        >
          Login
        </a>
      )}
    </span>
  );
}
