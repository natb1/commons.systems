export function hydrateHero(el: HTMLElement): void {
  const chips = el.querySelectorAll<HTMLButtonElement>("button.hero-chip[data-panel]");
  const panels = el.querySelectorAll<HTMLElement>(".hero-chip-panel");

  function showPanel(panelId: string): void {
    panels.forEach((p) => {
      p.hidden = p.id !== panelId;
    });
    chips.forEach((c) => {
      c.setAttribute("aria-expanded", String(c.dataset.panel === panelId));
      c.classList.toggle("hero-chip--active", c.dataset.panel === panelId);
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const panelId = chip.dataset.panel!;
      const panel = el.querySelector<HTMLElement>(`#${panelId}`);
      if (panel && !panel.hidden) {
        // Toggle off if already open
        panel.hidden = true;
        chip.setAttribute("aria-expanded", "false");
        chip.classList.remove("hero-chip--active");
      } else {
        showPanel(panelId);
      }
    });
  });

  el.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button.inline-chip[data-opens]",
    );
    if (!btn) return;
    const targetId = btn.dataset.opens;
    if (targetId) showPanel(targetId);
  });
}

export function mountHero(
  container: HTMLElement,
  renderFn: () => string,
): HTMLElement {
  container.innerHTML = renderFn();
  const heroEl = container.querySelector<HTMLElement>("#hero");
  if (!heroEl) throw new Error("#hero element not found");
  hydrateHero(heroEl);
  return heroEl;
}
