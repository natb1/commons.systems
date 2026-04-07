import { escapeHtml } from "@commons-systems/htmlutil";
import type { ContentRenderer, SearchResult } from "./types.js";

export function renderSearchSection(): string {
  return `
    <div class="viewer-search search-hidden">
      <div class="viewer-search-input-wrap">
        <input type="search" class="viewer-search-input"
               placeholder="Search\u2026" aria-label="Search document">
        <span class="viewer-search-count"></span>
      </div>
      <ul class="viewer-search-results" role="listbox" aria-label="Search results"></ul>
    </div>
  `;
}

function renderSnippet(result: SearchResult): string {
  const before = escapeHtml(result.snippet.slice(0, result.matchStart));
  const match = escapeHtml(result.snippet.slice(result.matchStart, result.matchStart + result.matchLength));
  const after = escapeHtml(result.snippet.slice(result.matchStart + result.matchLength));
  return `${before}<mark>${match}</mark>${after}`;
}

function renderResultItem(result: SearchResult, index: number): string {
  return `<li class="viewer-search-result" role="option" data-index="${index}">` +
    `<span class="viewer-search-result-label">${escapeHtml(result.label)}</span>` +
    `<span class="viewer-search-result-snippet">${renderSnippet(result)}</span>` +
    `</li>`;
}

export function initSearch(
  container: HTMLElement,
  renderer: ContentRenderer,
  onNavigate: () => void,
): (() => void) | null {
  if (!renderer.search || !renderer.goToResult) return null;

  const section = container.querySelector(".viewer-search") as HTMLElement;
  const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
  const countEl = container.querySelector(".viewer-search-count") as HTMLElement;
  const resultsList = container.querySelector(".viewer-search-results") as HTMLUListElement;

  section.classList.remove("search-hidden");

  let results: SearchResult[] = [];
  let currentQuery = "";
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  function clearResults() {
    results = [];
    resultsList.replaceChildren();
    countEl.textContent = "";
  }

  function renderResults() {
    // Safe: renderResultItem escapes all user-provided text via escapeHtml.
    resultsList.innerHTML = results.map(renderResultItem).join("");
    countEl.textContent = results.length === 1 ? "1 result" : `${results.length} results`;
  }

  function setActive(index: number) {
    const prev = resultsList.querySelector('[aria-selected="true"]');
    if (prev) prev.removeAttribute("aria-selected");
    if (index >= 0 && index < results.length) {
      const el = resultsList.children[index] as HTMLElement;
      el.setAttribute("aria-selected", "true");
      el.scrollIntoView({ block: "nearest" });
    }
  }

  async function executeSearch(query: string) {
    if (destroyed) return;
    const trimmed = query.trim();
    if (trimmed === currentQuery) return;
    currentQuery = trimmed;

    if (!trimmed) {
      renderer.clearSearch?.();
      clearResults();
      return;
    }

    const searchResults = await renderer.search(trimmed);
    if (destroyed || trimmed !== currentQuery) return;
    results = searchResults;
    renderResults();
  }

  function handleInput() {
    if (searchTimer) clearTimeout(searchTimer);
    if (!input.value.trim()) {
      currentQuery = "";
      renderer.clearSearch?.();
      clearResults();
      return;
    }
    searchTimer = setTimeout(() => {
      searchTimer = null;
      executeSearch(input.value).catch((err) => {
        reportError(new Error("Search failed", { cause: err }));
      });
    }, 300);
  }

  function handleSearchEvent() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = null;
    executeSearch(input.value).catch((err) => {
      reportError(new Error("Search failed", { cause: err }));
    });
  }

  function handleResultClick(e: Event) {
    const li = (e.target as HTMLElement).closest(".viewer-search-result") as HTMLElement | null;
    if (!li) return;
    const index = Number(li.dataset.index);
    if (index >= 0 && index < results.length) {
      setActive(index);
      renderer.goToResult(results[index]!).then(() => {
        onNavigate();
      }).catch((err) => {
        reportError(new Error("Go to result failed", { cause: err }));
      });
    }
  }

  input.addEventListener("input", handleInput);
  input.addEventListener("search", handleSearchEvent);
  resultsList.addEventListener("click", handleResultClick);

  return () => {
    destroyed = true;
    if (searchTimer) clearTimeout(searchTimer);
    input.removeEventListener("input", handleInput);
    input.removeEventListener("search", handleSearchEvent);
    resultsList.removeEventListener("click", handleResultClick);
  };
}
