import { escapeHtml } from "@commons-systems/htmlutil";

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

/** Minimal user shape for the nav, decoupled from any auth provider. */
export interface NavUser {
  readonly displayName: string | null;
  readonly email: string | null;
}

class AppNavElement extends HTMLElement {
  #links: NavLink[] = [];
  #user: NavUser | null = null;
  #showAuth = true;

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
      .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
      .join("");

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

customElements.define("app-nav", AppNavElement);

export type { AppNavElement };
