import { FOOTER_HTML } from "@commons-systems/ds/templates/footer";

export { FOOTER_HTML };

class AppFooterElement extends HTMLElement {
  connectedCallback(): void {
    if (!this.innerHTML.trim()) {
      this.innerHTML = FOOTER_HTML;
    }
  }
}

if (!customElements.get("app-footer")) {
  customElements.define("app-footer", AppFooterElement);
}

export type { AppFooterElement };
