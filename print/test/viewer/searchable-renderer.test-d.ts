/**
 * Compile-time contract: a renderer missing renderResult is NOT assignable to
 * SearchableRenderer. This file is included in tsconfig.json (not in vitest's
 * test glob) so tsc enforces it on every `npm run build`.
 *
 * The spread source `_base` below is an explicit object literal listing only the
 * REQUIRED ContentRenderer members (annotated `satisfies ContentRenderer`, which
 * keeps its narrow inferred type rather than re-widening to ContentRenderer's
 * optional surface). Because `_base` carries no `renderResult` key, the spread
 * provably cannot supply renderResult — so the suppress-error directive below can only be
 * satisfied by the intended missing-member mismatch, never vacuously.
 *
 * Vacuity (one-time / manual check, not CI-enforced): temporarily add
 * `renderResult: async () => {}` to the literal below and run
 * `tsc --noEmit -p print/tsconfig.json`; tsc should then report that
 * directive as unused (TS2578) — confirming the sole cause of
 * the error is the missing method.
 */
import type { ContentRenderer, SearchableRenderer } from "../../src/viewer/types";

// Pin the exact SearchableRenderer signatures so no other type mismatch can
// satisfy the @ts-expect-error vacuously.
const _base = {
  init: async (_c: HTMLElement, _s: string | ArrayBuffer, _p?: string) => {},
  goToPage: async (_p: number) => {},
  goToPosition: async (_p: string) => {},
  next: async () => {},
  prev: async () => {},
  pageCount: 0,
  currentPage: 0,
  canGoNext: false,
  canGoPrev: false,
  position: "",
  positionLabel: "",
  destroy: () => {},
} satisfies ContentRenderer;
const _search: SearchableRenderer["search"] = async () => ({ results: [], truncated: false });
const _goToResult: SearchableRenderer["goToResult"] = async () => {};
const _clearSearch: SearchableRenderer["clearSearch"] = () => {};

// @ts-expect-error: a renderer missing renderResult is not assignable to SearchableRenderer
export const _missingRenderResult: SearchableRenderer = {
  ..._base,
  search: _search,
  goToResult: _goToResult,
  clearSearch: _clearSearch,
};
