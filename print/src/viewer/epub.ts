import ePub, { type Book, type Rendition, type Location, type NavItem } from "epubjs";
import type { ContentRenderer, OutlineEntry, SearchResult } from "./types.js";

export function createEpubRenderer(
  onError?: (err: unknown) => void,
): ContentRenderer {
  let book: Book | null = null;
  let rendition: Rendition | null = null;
  let containerDiv: HTMLDivElement | null = null;
  let _chapterCount = 0;
  let _chapterIndex = 0;
  let _subPage = 1;
  let _subPageTotal = 1;
  let _atStart = true;
  let _atEnd = false;
  let _currentCfi = "";
  let destroyed = false;
  let locationsReady: Promise<void> | null = null;
  let searchGeneration = 0;
  const MAX_RESULTS = 100;
  const GENERATE_CHARS = 1024;
  const outlineHrefMap = new WeakMap<OutlineEntry, string>();

  function mapNavItems(items: NavItem[]): OutlineEntry[] {
    return items.map((item) => {
      const children = item.subitems ? mapNavItems(item.subitems) : [];
      const entry: OutlineEntry = { title: item.label, children };
      outlineHrefMap.set(entry, item.href);
      return entry;
    });
  }

  // epub.js next()/prev() resolve before the relocated event fires.
  // Callers await this to get updated position state. The 5s timeout
  // prevents a permanent hang if epub.js fails to emit the event.
  function waitForRelocated(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!rendition) { resolve(); return; }
      const timer = setTimeout(() => { reportError(new Error("waitForRelocated: timed out after 5s")); resolve(); }, 5000);
      rendition.once("relocated", () => { clearTimeout(timer); resolve(); });
    });
  }

  // epub.js percent-based navigation requires a generated locations index,
  // which is expensive. Generate it lazily on first use and memoize the promise.
  function ensureLocations(): Promise<void> {
    if (!book) return Promise.resolve();
    if (!locationsReady) {
      locationsReady = book.locations.generate(GENERATE_CHARS).then(() => {}).catch((err) => {
        locationsReady = null;
        return Promise.reject(err);
      });
    }
    return locationsReady;
  }

  return {
    async init(containerEl: HTMLElement, source: string | ArrayBuffer, initialPosition?: string): Promise<void> {
      if (book) throw new Error("EPUB renderer already initialized");

      containerDiv = document.createElement("div");
      containerDiv.className = "viewer-epub-container";
      containerEl.appendChild(containerDiv);

      book = ePub(source);
      rendition = book.renderTo(containerDiv, {
        width: "100%",
        height: "100%",
        flow: "paginated",
      });

      await book.ready;
      await book.loaded.spine;

      if (destroyed) return;

      // spine.length exists at runtime but is missing from the epubjs type declarations.
      _chapterCount = (book.spine as unknown as { length: number }).length;
      if (_chapterCount === 0) throw new Error("EPUB spine is empty — no chapters to render");

      // epub.js creates blob: URLs for EPUB stylesheets without setting a MIME type.
      // Browsers ignore stylesheets served without text/css, so we fetch each blob,
      // read its CSS text, and replace the <link> with an inline <style> element.
      // These blob URLs are epub.js-owned and cached/reused across chapters, so the
      // hook must not revoke them — epub.js revokes them itself in book.destroy().
      rendition.hooks.content.register(async (contents: { document: Document }) => {
        try {
          const doc = contents.document;
          if (!doc) throw new Error("epub.js content hook received contents without a document");
          const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
          const blobLinks = links.filter((link) => {
            const href = link.getAttribute("href");
            return href && href.startsWith("blob:");
          });
          const results = await Promise.all(
            blobLinks.map(async (link) => {
              const href = link.getAttribute("href")!;
              const response = await fetch(href);
              if (!response.ok) throw new Error(`Failed to fetch EPUB blob stylesheet: ${response.status} ${response.statusText}`);
              return { link, cssText: await response.text() };
            }),
          );
          for (const { link, cssText } of results) {
            const style = doc.createElement("style");
            style.textContent = cssText;
            if (!link.parentNode) throw new Error("EPUB stylesheet link has no parent node");
            link.parentNode.insertBefore(style, link);
            link.remove();
          }
        } catch (err) {
          reportError(err instanceof Error ? err : new Error("EPUB content hook failed", { cause: err }));
          throw err;
        }
      });

      rendition.on("relocated", (location: Location) => {
        _chapterIndex = location.start.index;
        _subPage = location.start.displayed.page;
        _subPageTotal = location.start.displayed.total;
        _atStart = location.atStart;
        _atEnd = location.atEnd;
        _currentCfi = location.start.cfi;
      });

      rendition.on("displayerror", onError ?? ((err: unknown) => {
        reportError(new Error("EPUB display error", { cause: err }));
      }));

      await rendition.display(initialPosition ?? undefined);
      if (!initialPosition) {
        _chapterIndex = 0;
        _subPage = 1;
      }
    },

    async goToPage(page: number): Promise<void> {
      if (!rendition || !book || page < 1 || page > _chapterCount) return;
      const spineItem = book.spine.get(page - 1);
      if (!spineItem) return;
      await rendition.display(spineItem.href);
    },

    async goToPosition(position: string): Promise<void> {
      if (!rendition) return;
      await rendition.display(position);
      // epub.js does not reliably emit 'relocated' for display(cfi), so the
      // persistent relocated handler may never update the position state.
      // Read the current location directly after display() resolves.
      // currentLocation() may return a Location or a Promise<Location>
      // depending on epub.js version/load state — normalize with Promise.resolve.
      // At runtime it returns a Location ({ start, atStart, atEnd }) — the same
      // shape as the relocated event — but the epubjs types declare a flat
      // DisplayedLocation, so cast (mirroring the spine.length cast above).
      const loc = (await Promise.resolve(rendition.currentLocation())) as unknown as Location;
      if (loc?.start) {
        _chapterIndex = loc.start.index;
        _subPage = loc.start.displayed.page;
        _subPageTotal = loc.start.displayed.total;
        _atStart = loc.atStart;
        _atEnd = loc.atEnd;
        _currentCfi = loc.start.cfi;
      }
    },

    async goToFraction(fraction: number): Promise<void> {
      if (!rendition || !book) return;
      await ensureLocations();
      if (destroyed) return;
      const clamped = Math.max(0, Math.min(1, fraction));
      const cfi = book.locations.cfiFromPercentage(clamped);
      const relocated = waitForRelocated();
      await rendition.display(cfi);
      await relocated;
    },

    async next(): Promise<void> {
      if (!rendition || _atEnd) return;
      const relocated = waitForRelocated();
      await rendition.next();
      await relocated;
    },

    async prev(): Promise<void> {
      if (!rendition || _atStart) return;
      const relocated = waitForRelocated();
      await rendition.prev();
      await relocated;
    },

    get pageCount() {
      return _chapterCount;
    },
    get currentPage() {
      return _chapterIndex + 1;
    },
    get canGoNext() { return _chapterCount > 0 && !_atEnd; },
    get canGoPrev() { return _chapterCount > 0 && !_atStart; },
    get position() {
      return _currentCfi;
    },
    get positionLabel() {
      return `Ch. ${_chapterIndex + 1}/${_chapterCount} — p. ${_subPage}/${_subPageTotal}`;
    },

    async search(query: string): Promise<SearchResult[]> {
      if (!book || destroyed || query.trim() === "") return [];
      const gen = ++searchGeneration;

      await book.loaded.navigation;
      if (gen !== searchGeneration || destroyed) return [];

      // spine.length exists at runtime but is missing from the epubjs type declarations.
      const length = (book.spine as unknown as { length: number }).length;
      const results: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      for (let i = 0; i < length; i++) {
        const section = book.spine.get(i);
        if (!section) continue;

        // section.load() returns a Promise at runtime; the .d.ts mistypes it as Document.
        await (section.load(book.load.bind(book)) as unknown as Promise<unknown>);
        try {
          // section.find() returns Array<{cfi, excerpt}> at runtime; the .d.ts mistypes it as Array<Element>.
          const matches = section.find(query) as unknown as Array<{ cfi: string; excerpt: string }>;
          const navItem = book.navigation.get(section.href);
          const label = navItem?.label ?? `Ch. ${i + 1}`;
          for (const match of matches) {
            if (results.length >= MAX_RESULTS) break;
            const matchStart = match.excerpt.toLowerCase().indexOf(lowerQuery);
            if (matchStart === -1) continue;
            results.push({
              location: match.cfi,
              label,
              snippet: match.excerpt,
              matchStart,
              matchLength: query.length,
            });
          }
        } finally {
          section.unload();
        }

        if (results.length >= MAX_RESULTS) break;
        if (gen !== searchGeneration || destroyed) break;
      }

      return results;
    },

    clearSearch(): void {
      ++searchGeneration;
    },

    async goToResult(result: SearchResult): Promise<void> {
      if (!rendition) return;
      // Abort any in-flight search() before navigating. A concurrent search's
      // section.load() emits "relocated" events that would otherwise consume the
      // once("relocated") listener below before rendition.display() fires its own,
      // stranding waitForRelocated() until its 5s timeout.
      ++searchGeneration;
      const relocated = waitForRelocated();
      await rendition.display(result.location);
      await relocated;
    },

    async getOutline(): Promise<OutlineEntry[]> {
      if (!book) return [];
      await book.loaded.navigation;
      const toc = book.navigation.toc;
      if (!toc || toc.length === 0) return [];
      return mapNavItems(toc);
    },

    async goToOutlineEntry(entry: OutlineEntry): Promise<void> {
      if (!rendition) return;
      const href = outlineHrefMap.get(entry);
      if (!href) throw new Error("Outline entry not found in href map");
      const relocated = waitForRelocated();
      await rendition.display(href);
      await relocated;
    },

    destroy(): void {
      destroyed = true;
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
      if (book) {
        book.destroy();
        book = null;
      }
      if (containerDiv) {
        containerDiv.remove();
        containerDiv = null;
      }
    },
  };
}
