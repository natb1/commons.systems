const DESKTOP_QUERY = "(min-width: 768px)";

export function initScrollIndicator(container: HTMLElement): void {
  document.querySelector(".sidebar-scroll-track")?.remove();

  const track = document.createElement("div");
  track.className = "sidebar-scroll-track";
  const thumb = document.createElement("div");
  thumb.className = "sidebar-scroll-thumb";
  track.appendChild(thumb);
  document.body.appendChild(track);

  function update(): void {
    if (!container.isConnected) {
      ro.disconnect();
      track.remove();
      return;
    }
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const overflows = scrollHeight > clientHeight;

    if (!isDesktop || !overflows) {
      track.style.display = "none";
      container.classList.remove("sidebar-overflow-top", "sidebar-overflow-bottom");
      return;
    }

    track.style.display = "block";

    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    container.classList.toggle("sidebar-overflow-top", !atTop);
    container.classList.toggle("sidebar-overflow-bottom", !atBottom);

    const rect = container.getBoundingClientRect();
    track.style.top = `${rect.top}px`;
    track.style.left = `${rect.right - 5}px`;
    track.style.height = `${rect.height}px`;
    const ratio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(ratio * rect.height, 20);
    const maxScroll = scrollHeight - clientHeight;
    const thumbTop = (scrollTop / maxScroll) * (rect.height - thumbHeight);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.top = `${thumbTop}px`;
  }

  const ro = new ResizeObserver(update);
  ro.observe(container);
  container.addEventListener("scroll", update, { passive: true });
  window.addEventListener("scroll", update, { passive: true });
  update();
}
