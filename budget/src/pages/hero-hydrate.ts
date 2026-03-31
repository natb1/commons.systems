export function hydrateHero(el: HTMLElement): void {
  el.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-opens]",
    );
    if (!btn) return;
    const targetId = btn.dataset.opens;
    if (!targetId) return;
    const target = document.getElementById(targetId) as HTMLDetailsElement | null;
    if (target) target.open = true;
  });
}
