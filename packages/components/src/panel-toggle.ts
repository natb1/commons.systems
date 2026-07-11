export interface PanelToggleHandle {
  close(): void;
  destroy(): void;
}

export function initPanelToggle(
  panel: HTMLElement,
  toggle: HTMLElement,
): PanelToggleHandle {
  const controller = new AbortController();
  const { signal } = controller;

  const close = (): void => {
    // Restore focus to the toggle only when focus was inside the closing panel,
    // so an Escape/outside-click close does not leave focus stranded on a
    // now-hidden element. Skip when focus already moved elsewhere (e.g. an
    // outside click landed on another focusable element) to avoid yanking it.
    const restoreFocus = panel.contains(document.activeElement);
    panel.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      toggle.focus();
    }
  };

  toggle.addEventListener(
    "click",
    () => {
      const isOpen = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        close();
      }
    },
    { signal },
  );

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      if (
        panel.classList.contains("open") &&
        !panel.contains(target) &&
        !toggle.contains(target)
      ) {
        close();
      }
    },
    { signal },
  );

  return {
    close,
    destroy(): void {
      controller.abort();
    },
  };
}
