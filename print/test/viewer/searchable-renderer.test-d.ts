/**
 * Compile-time contract: a renderer missing renderResult is NOT assignable to
 * SearchableRenderer. This file is included in tsconfig.json (not in vitest's
 * test glob) so tsc enforces it on every `npm run build`.
 *
 * Vacuity: temporarily add `renderResult: async () => {}` to the literal below
 * and verify tsc reports the @ts-expect-error directive as UNUSED — confirming
 * the sole cause of the error is the missing method.
 */
import type { ContentRenderer, SearchableRenderer } from "../../src/viewer/types";

// Pin the exact SearchableRenderer signatures so no other type mismatch can
// satisfy the @ts-expect-error vacuously.
declare const _base: ContentRenderer;
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
