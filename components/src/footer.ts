export const FOOTER_HTML =
  `<p>Created with <a href="https://github.com/natb1/commons.systems" target="_blank" rel="noopener">commons.systems</a> | &copy; 2026 RUMOR.ML <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" class="cc-badge"></a></p>`;

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
