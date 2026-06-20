import { Nav, type NavLink } from "@commons-systems/ds";

const HOME_HREF = "https://commons.systems/";
const HOME_LABEL = "commons.systems";

/** Minimal user shape for the nav, decoupled from any auth provider. The driver
 *  passes firebase's currentUser structurally — never import the firebase User. */
export interface BlogNavUser {
  displayName: string | null;
  email: string | null;
}

export interface BlogNavProps {
  links: NavLink[];
  showHomeLink: boolean;
  showAuth: boolean;
  user: BlogNavUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

// React replacement for the old imperative <app-nav> custom element
// (components/src/nav.ts), composing the ds Nav. The `end` slot reproduces the
// old right-aligned chrome in DOM order: the home link (gated by showHomeLink),
// then the auth control (gated by showAuth). The #sign-in/#sign-out/#user-display
// ids, the "Login"/"Logout" copy, and the click→callback wiring are preserved
// verbatim so the driver's auth behavior and any selectors survive the swap.
export function BlogNav(props: BlogNavProps) {
  const { links, showHomeLink, showAuth, user, onSignIn, onSignOut } = props;
  return (
    <Nav
      links={links}
      end={
        <>
          {showHomeLink && <a href={HOME_HREF}>{HOME_LABEL}</a>}
          {showAuth &&
            (user ? (
              <>
                <span id="user-display">
                  {user.displayName || user.email || "User"}
                </span>
                <a
                  href="#"
                  id="sign-out"
                  onClick={(e) => {
                    e.preventDefault();
                    onSignOut();
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
                  onSignIn();
                }}
              >
                Login
              </a>
            ))}
        </>
      }
    />
  );
}
