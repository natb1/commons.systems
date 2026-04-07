import { vi } from "vitest";
import type { ContentRenderer } from "../../src/viewer/types";

export function makeMockRenderer(overrides: Partial<ContentRenderer> = {}): ContentRenderer {
  let _currentPage = 1;
  const _pageCount = 10;
  return {
    init: vi.fn().mockResolvedValue(undefined),
    goToPage: vi.fn().mockImplementation(async (p: number) => { _currentPage = p; }),
    next: vi.fn().mockImplementation(async () => { if (_currentPage < _pageCount) _currentPage++; }),
    prev: vi.fn().mockImplementation(async () => { if (_currentPage > 1) _currentPage--; }),
    get pageCount() { return _pageCount; },
    get currentPage() { return _currentPage; },
    get canGoNext() { return _currentPage < _pageCount; },
    get canGoPrev() { return _currentPage > 1; },
    get position() { return String(_currentPage); },
    get positionLabel() { return `Page ${_currentPage} / ${_pageCount}`; },
    destroy: vi.fn(),
    ...overrides,
  };
}
