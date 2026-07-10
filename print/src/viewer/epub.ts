import ePub, { type Book, type Rendition, type Location, type NavItem } from "epubjs";
import type { OutlineEntry, SearchableRenderer, SearchResult, SearchResponse } from "./types.js";
import { MAX_SEARCH_RESULTS } from "./types.js";

// epubjs ships incomplete type declarations. These narrow shapes describe the
// runtime members we use that are missing from the .d.ts, following the
// existing `as unknown as { length: number }` precedent in init().

/** A spine section, with the find/load/unload members missing from epubjs types. */
interface EpubSection {
  href: string;
  find(query: string): { cfi: string; excerpt: string }[];
  load(request: unknown): Promise<unknown>;
  unload(): void;
}

/** rendition.annotations, missing from epubjs types. */
interface EpubAnnotations {
  highlight(cfiRange: string, data?: object, cb?: () => void, className?: string, styles?: object): unknown;
  remove(cfiRange: string, type: string): void;
}

// SVG highlight fills (annotations color comes from styles, not CSS). Base
// matches the panel <mark> color (viewer.css:380); active is visually distinct.
const BASE_STYLES = { fill: "#fde68a" };
const ACTIVE_STYLES = { fill: "#f59e0b", "fill-opacity": "0.5" };

export function createEpubRenderer(
  onError?: (err: unknown) => void,
): SearchableRenderer {
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
  const GENERATE_CHARS = 1024;
  // Fallback timeout for waitForRelocated (next/prev/outline nav). epub.js emits
  // 'relocated' right after next()/prev() resolve, so this only trips when the
  // event genuinely never arrives — far below the old 30s so a missed event no
  // longer freezes the UI for half a minute. Pending waits are tracked so
  // destroy() can settle them: an un-cleared timer would run reportError long
  // after teardown, and an un-resolved promise would leave a mid-flight
  // next()/prev() hanging forever.
  const RELOCATED_TIMEOUT_MS = 5000;
  const pendingRelocations = new Set<{ timer: ReturnType<typeof setTimeout>; resolve: () => void }>();
  const outlineHrefMap = new WeakMap<OutlineEntry, string>();

  // Full-document search state.
  let _searchCfis: string[] = []; // all base-highlighted match cfis
  let _activeCfi: string | null = null; // currently-navigated match
  let _searchEpoch = 0; // monotonic guard against overlapping search() calls

  // Resolve a section's TOC label, falling back to a 1-based spine index.
  // Caller must `await book.loaded.navigation` once before invoking.
  function labelForSection(section: EpubSection, index: number): string {
    const nav = (book!.navigation as unknown as { get(target: string): NavItem | undefined });
    return nav.get(section.href)?.label ?? `Ch. ${index + 1}`;
  }

  // Build a SearchResult from an epubjs find match, enforcing the SearchResult
  // invariant (matchStart >= 0, matchLength > 0, matchStart + matchLength <= snippet.length).
  // Returns null when no valid match can be formed (caller skips it).
  function buildResult(
    match: { cfi: string; excerpt: string },
    query: string,
    label: string,
  ): SearchResult | null {
    const snippet = match.excerpt.replace(/\s+/g, " ").trim();
    let matchStart = snippet.toLowerCase().indexOf(query.toLowerCase());
    if (matchStart === -1) matchStart = 0;
    const matchLength = Math.min(query.length, snippet.length - matchStart);
    if (matchLength <= 0) return null;
    return { location: match.cfi, label, snippet, matchStart, matchLength };
  }

  // Remove all search highlights. Defined as a closure (not just an object
  // method) so search() can call it without relying on a bound `this` — the
  // UI calls renderer.search detached (search.ts captures it in a const).
  function clearSearchHighlights(): void {
    if (rendition) {
      const annotations = (rendition.annotations as unknown as EpubAnnotations);
      for (const cfi of _searchCfis) {
        annotations.remove(cfi, "highlight");
      }
      if (_activeCfi && !_searchCfis.includes(_activeCfi)) {
        annotations.remove(_activeCfi, "highlight");
      }
    }
    _searchCfis = [];
    _activeCfi = null;
  }

  function mapNavItems(items: NavItem[]): OutlineEntry[] {
    return items.map((item) => {
      const children = item.subitems ? mapNavItems(item.subitems) : [];
      const entry: OutlineEntry = { title: item.label, children };
      outlineHrefMap.set(entry, item.href);
      return entry;
    });
  }

  // epub.js next()/prev() resolve before the relocated event fires.
  // Callers await this to get updated position state. The bounded timeout
  // prevents a permanent hang if epub.js fails to emit the event.
  function waitForRelocated(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!rendition) { resolve(); return; }
      // `entry` is referenced inside the timer callback, which only runs after
      // this line has assigned it — so no placeholder/cast is needed.
      const timer = setTimeout(() => {
        pendingRelocations.delete(entry);
        // A timeout after destroy() is expected (teardown races the event), not
        // a bug — only report a genuinely missed relocation on a live renderer.
        if (!destroyed) reportError(new Error(`waitForRelocated: timed out after ${RELOCATED_TIMEOUT_MS}ms`));
        resolve();
      }, RELOCATED_TIMEOUT_MS);
      const entry = { timer, resolve };
      const settle = () => {
        clearTimeout(entry.timer);
        pendingRelocations.delete(entry);
        resolve();
      };
      pendingRelocations.add(entry);
      rendition.once("relocated", settle);
    });
  }

  // display(cfi) / display(percentage-cfi) does not reliably emit 'relocated'
  // (see the note in goToPosition), so reading the settled location directly
  // after display() resolves is the robust way to update position state — the
  // pattern goToPosition proved. Shared by goToPosition / goToFraction /
  // goToResult, all of which navigate via a cfi display() call. currentLocation()
  // may return a Location or a Promise<Location> depending on epub.js
  // version/load state — normalize with Promise.resolve. At runtime it returns a
  // Location ({ start, atStart, atEnd }); the epubjs types declare a flat
  // DisplayedLocation, so cast (mirroring the spine.length cast in init()).
  async function syncLocationFromCurrent(): Promise<void> {
    if (!rendition) return;
    const loc = (await Promise.resolve(rendition.currentLocation())) as unknown as Location; // type-safety-ok: epubjs currentLocation() returns a Location at runtime; its types declare a flat DisplayedLocation (pre-existing cast moved from goToPosition)
    if (loc?.start) {
      _chapterIndex = loc.start.index;
      _subPage = loc.start.displayed.page;
      _subPageTotal = loc.start.displayed.total;
      _atStart = loc.atStart;
      _atEnd = loc.atEnd;
      _currentCfi = loc.start.cfi;
    }
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
      // persistent relocated handler may never update the position state. Read
      // the settled location directly after display() resolves.
      await syncLocationFromCurrent();
    },

    async goToFraction(fraction: number): Promise<void> {
      if (!rendition || !book) return;
      await ensureLocations();
      if (destroyed) return;
      const clamped = Math.max(0, Math.min(1, fraction));
      const cfi = book.locations.cfiFromPercentage(clamped);
      await rendition.display(cfi);
      // display(cfi) does not reliably emit 'relocated'; read the settled
      // location directly instead of awaiting the event, which would otherwise
      // freeze "Calculating…" until the fallback timeout and then report a
      // spurious error even though the goto succeeded.
      await syncLocationFromCurrent();
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

    async search(query: string): Promise<SearchResponse> {
      const trimmed = query.trim();
      if (!book || !trimmed) {
        clearSearchHighlights();
        return { results: [], truncated: false };
      }

      const epoch = ++_searchEpoch;
      await book.loaded.navigation;

      const spineItems = (book.spine as unknown as { spineItems: EpubSection[] }).spineItems;
      const loader = (book.load as (this: Book, req: unknown) => Promise<unknown>).bind(book);

      const results: SearchResult[] = [];
      let truncated = false;
      for (let i = 0; i < spineItems.length; i++) {
        if (epoch !== _searchEpoch) break;
        const section = spineItems[i]!;
        if (epoch !== _searchEpoch) break; // superseded: load no further sections
        try {
          try {
            await section.load(loader);
          } catch (err) {
            // A single section that fails to load (corrupt/missing resource,
            // malformed EPUB) is skipped; the search continues over the
            // remaining sections.
            reportError(
              err instanceof Error
                ? err
                : new Error("EPUB search: section failed to load", { cause: err }),
            );
            continue;
          }
          try {
            const label = labelForSection(section, i);
            for (const match of section.find(trimmed)) {
              if (results.length >= MAX_SEARCH_RESULTS) { truncated = true; break; }
              const result = buildResult(match, trimmed, label);
              if (result) results.push(result);
            }
          } catch (err) {
            // The section loaded, but find()/buildResult() threw (e.g.
            // createRange() on a malformed loaded document); skip this section
            // and continue over the remaining sections.
            reportError(
              err instanceof Error
                ? err
                : new Error("EPUB search: section failed during find", { cause: err }),
            );
          }
        } finally {
          section.unload();
        }
        // Cap tripped mid-section: stop scanning further sections.
        if (truncated) break;
      }

      // A newer search started while we awaited; touch no highlight state and
      // let the UI's stale-result guard discard these.
      if (epoch !== _searchEpoch) return { results, truncated };

      // Single synchronous highlight burst after iteration.
      clearSearchHighlights();
      const annotations = (rendition!.annotations as unknown as EpubAnnotations);
      for (const result of results) {
        annotations.highlight(result.location, {}, undefined, "viewer-search-hl", BASE_STYLES);
        _searchCfis.push(result.location);
      }
      return { results, truncated };
    },

    async goToResult(result: SearchResult): Promise<void> {
      if (!rendition) return;
      const annotations = (rendition.annotations as unknown as EpubAnnotations);

      // Demote the previously active match back to base style.
      if (_activeCfi) {
        annotations.remove(_activeCfi, "highlight");
        annotations.highlight(_activeCfi, {}, undefined, "viewer-search-hl", BASE_STYLES);
      }

      await rendition.display(result.location);
      // display(cfi) does not reliably emit 'relocated'; sync position from the
      // settled location instead of awaiting the event (avoids a "Calculating…"
      // hang until the fallback timeout on the search-result nav path).
      await syncLocationFromCurrent();

      // Promote the new match to the distinct active style.
      annotations.remove(result.location, "highlight");
      annotations.highlight(result.location, {}, undefined, "viewer-search-active", ACTIVE_STYLES);
      _activeCfi = result.location;
    },

    // EPUB renders the armed result directly inside goToResult (rendition.display);
    // there is no separate single-page render step (no spread mode). Documented no-op.
    async renderResult(): Promise<void> {},

    clearSearch(): void {
      // Stand down any in-flight search(): bumping the epoch trips both of its
      // guards — the top-of-loop check stops it loading any further spine
      // sections, and the post-loop check suppresses the highlight burst — so it
      // applies no highlights for the cleared query.
      _searchEpoch++;
      clearSearchHighlights();
    },

    destroy(): void {
      destroyed = true;
      // Settle any pending waitForRelocated: clear its fallback timer (so it
      // can't run reportError after teardown) and resolve its promise (so a
      // mid-flight next()/prev()/goToOutlineEntry() doesn't hang forever).
      for (const entry of pendingRelocations) {
        clearTimeout(entry.timer);
        entry.resolve();
      }
      pendingRelocations.clear();
      // rendition.destroy() tears down annotations, so just reset tracking.
      _searchCfis = [];
      _activeCfi = null;
      _searchEpoch = 0;
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
