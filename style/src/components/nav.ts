import { escapeHtml } from "@commons-systems/htmlutil";

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

export interface NavUser {
  readonly displayName: string | null;
  readonly email: string | null;
}

class AppNavElement extends HTMLElement {
  #links: NavLink[] = [];
  #user: NavUser | null = null;
  #showAuth = true;

  set links(v: NavLink[]) {
    this.#links = v;
    this.#render();
  }
  get links(): NavLink[] {
    return this.#links;
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

  #render(): void {
    let linksContainer = this.querySelector(".nav-links") as HTMLSpanElement | null;
    if (!linksContainer) {
      linksContainer = document.createElement("span");
      linksContainer.className = "nav-links";
      linksContainer.style.display = "contents";
      this.prepend(linksContainer);
    }

    linksContainer.innerHTML = this.#links
      .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
      .join("");

    let authContainer = this.querySelector(".nav-auth") as HTMLSpanElement | null;
    if (!authContainer) {
      authContainer = document.createElement("span");
      authContainer.className = "nav-auth";
      authContainer.style.display = "contents";
      this.append(authContainer);
    }

    if (!this.#showAuth) {
      authContainer.innerHTML = "";
      return;
    }

    if (this.#user) {
      const display = escapeHtml(this.#user.displayName ?? this.#user.email ?? "User");
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
