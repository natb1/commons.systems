import { useEffect, useRef, useState } from "react";
import { Input } from "@commons-systems/ds";
import type { UseViewerControllerResult } from "./useViewerController.js";
import type { SearchResult } from "./types.js";
import { isSearchable } from "./types.js";

/**
 * Search panel wired to the viewer controller. Replaces the imperative
 * renderSearchSection + initSearch in search.ts. Returns null when the
 * renderer does not support search (replaces the old "search-hidden" class).
 *
 * All hooks are called unconditionally (rules-of-hooks); the early return is
 * placed AFTER the hook block.
 */
export function SearchPanel({ controller }: { controller: UseViewerControllerResult }) {
  const { searchable, getRenderer, onSearchNavigate } = controller;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [countText, setCountText] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentQuery = useRef("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyed = useRef(false);

  // Stable ref for the native "search" listener so it never closes over stale
  // executeSearch — captures the latest version on every render.
  const runSearchRef = useRef(() => {});

  async function executeSearch(query: string) {
    if (destroyed.current) return;
    const trimmed = query.trim();
    if (trimmed === currentQuery.current) return;
    currentQuery.current = trimmed;

    if (!trimmed) {
      getRenderer()?.clearSearch?.();
      setResults([]);
      setCountText("");
      setActiveIndex(-1);
      return;
    }

    try {
      const renderer = getRenderer();
      if (!renderer || !isSearchable(renderer)) return;
      const { results, truncated } = await renderer.search(trimmed);
      if (destroyed.current || trimmed !== currentQuery.current) return;
      setResults(results);
      setActiveIndex(-1);
      if (truncated) {
        setCountText(`First ${results.length} results shown — refine your search`);
      } else {
        setCountText(results.length === 1 ? "1 result" : `${results.length} results`);
      }
    } catch (err) {
      setCountText("Search failed");
      setResults([]);
      setActiveIndex(-1);
      reportError(new Error("Search failed", { cause: err }));
    }
  }

  // Keep runSearchRef current on every render so the attached native listener
  // always calls the latest executeSearch.
  runSearchRef.current = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    const val = inputRef.current?.value ?? "";
    executeSearch(val).catch(() => {
      // errors are handled inside executeSearch
    });
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (!value.trim()) {
      currentQuery.current = "";
      getRenderer()?.clearSearch?.();
      setResults([]);
      setCountText("");
      setActiveIndex(-1);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      executeSearch(value).catch(() => {
        // errors are handled inside executeSearch
      });
    }, 300);
  }

  function handleResultClick(i: number) {
    setActiveIndex(i);
    const renderer = getRenderer();
    if (!renderer || !isSearchable(renderer)) return;
    renderer
      .goToResult(results[i]!)
      .then(() => {
        onSearchNavigate();
      })
      .catch((err: unknown) => {
        setCountText("Navigation failed");
        reportError(new Error("Go to result failed", { cause: err }));
      });
  }

  // Attach native "search" listener (fires on Enter in <input type="search">).
  // Re-run when searchable flips so the input is present.
  useEffect(() => {
    if (!searchable) return;
    const input = inputRef.current;
    if (!input) return;
    function handleSearchEvent() {
      runSearchRef.current();
    }
    input.addEventListener("search", handleSearchEvent);
    return () => {
      input.removeEventListener("search", handleSearchEvent);
    };
  }, [searchable]);

  // Cleanup on unmount: cancel any pending timer + mark destroyed.
  useEffect(() => {
    return () => {
      destroyed.current = true;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, []);

  // Rules-of-hooks: all hooks above; conditional return below.
  if (!searchable) return null;

  return (
    <div className="viewer-search">
      <div className="viewer-search-input-wrap">
        <Input
          className="viewer-search-input"
          ref={inputRef}
          type="search"
          placeholder="Search…"
          aria-label="Search document"
          onChange={handleChange}
        />
        <span className="viewer-search-count">{countText}</span>
      </div>
      <ul className="viewer-search-results" role="listbox" aria-label="Search results">
        {results.map((result, i) => {
          const before = result.snippet.slice(0, result.matchStart);
          const match = result.snippet.slice(result.matchStart, result.matchStart + result.matchLength);
          const after = result.snippet.slice(result.matchStart + result.matchLength);
          return (
            <li
              key={i}
              className="viewer-search-result"
              role="option"
              data-index={i}
              aria-selected={i === activeIndex ? "true" : undefined}
              onClick={() => handleResultClick(i)}
            >
              <span className="viewer-search-result-label">{result.label}</span>
              <span className="viewer-search-result-snippet">
                {before}
                <mark>{match}</mark>
                {after}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
