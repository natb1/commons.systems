import { escapeHtml } from "@commons-systems/htmlutil";

export interface NavLink {
  readonly href: string;
  readonly label: string;
  readonly align?: "end";
}

/** Minimal user shape for the nav, decoupled from any auth provider. */
export interface NavUser {
  readonly displayName: string | null;
  readonly email: string | null;
}

const HOME_HREF = "https://commons.systems/";
const HOME_LABEL = "commons.systems";

class AppNavElement extends HTMLElement {
  #links: NavLink[] = [];
  #user: NavUser | null = null;
  #showAuth = true;
  #showHomeLink = true;

  set links(v: NavLink[]) {
    this.#links = [...v];
    this.#render();
  }
  get links(): NavLink[] {
    return [...this.#links];
  }

  set user(v: NavUser | null) {
    this.#user = v;
    this.#render();
  }
  get user(): NavUser | null {
    return this.#user;
  }

  set showAuth(v: boolean) {
    this.#showAuth = v;
    this.#render();
  }
  get showAuth(): boolean {
    return this.#showAuth;
  }

  set showHomeLink(v: boolean) {
    this.#showHomeLink = v;
    this.#render();
  }
  get showHomeLink(): boolean {
    return this.#showHomeLink;
  }

  #ensureContainer(className: string, position: "prepend" | "append"): HTMLSpanElement {
    let el = this.querySelector(`.${className}`) as HTMLSpanElement | null;
    if (!el) {
      el = document.createElement("span");
      el.className = className;
      this[position](el);
    }
    return el;
  }

  #render(): void {
    const linksContainer = this.#ensureContainer("nav-links", "prepend");

    linksContainer.innerHTML = this.#links
      .map((l) => {
        const alignAttr = l.align === "end" ? ` data-align="end"` : "";
        return `<a href="${escapeHtml(l.href)}"${alignAttr}>${escapeHtml(l.label)}</a>`;
      })
      .join("");

    const homeContainer = this.#ensureContainer("nav-home", "append");

    if (this.#showHomeLink) {
      homeContainer.innerHTML = `<a href="${escapeHtml(HOME_HREF)}">${escapeHtml(HOME_LABEL)}</a>`;
    } else {
      homeContainer.innerHTML = "";
    }

    const authContainer = this.#ensureContainer("nav-auth", "append");

    if (!this.#showAuth) {
      authContainer.innerHTML = "";
      return;
    }

    if (this.#user) {
      const display = escapeHtml(this.#user.displayName || this.#user.email || "User");
      authContainer.innerHTML =
        `<span id="user-display">${display}</span>` +
        `<a href="#" id="sign-out">Logout</a>`;

      authContainer.querySelector("#sign-out")!.addEventListener("click", (e) => {
        e.preventDefault();
        this.dispatchEvent(new Event("sign-out", { bubbles: true }));
      });
    } else {
      authContainer.innerHTML = `<a href="#" id="sign-in">Login</a>`;

      authContainer.querySelector("#sign-in")!.addEventListener("click", (e) => {
        e.preventDefault();
        this.dispatchEvent(new Event("sign-in", { bubbles: true }));
      });
    }
  }
}

if (!customElements.get("app-nav")) {
  customElements.define("app-nav", AppNavElement);
}

export type { AppNavElement };
