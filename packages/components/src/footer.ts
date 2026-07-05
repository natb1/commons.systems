import { FOOTER_HTML } from "@commons-systems/ds/templates/footer";

export { FOOTER_HTML };

if (typeof HTMLElement !== "undefined" && !customElements.get("app-footer")) {
  class AppFooterElement extends HTMLElement {
    connectedCallback(): void {
      if (!this.innerHTML.trim()) {
        this.innerHTML = FOOTER_HTML;
      }
    }
  }

  customElements.define("app-footer", AppFooterElement);
}

export type AppFooterElement = HTMLElement;
