// Pure id-reference-scanning primitives shared by the digest's DANGLING-REFS
// table (`./digest.ts`). Extracted so the id-shape regex construction,
// classification, and text-scanning logic have one home instead of being
// inlined inside a single table function — no behavior change from the
// digest's DANGLING-REFS output (see `./digest.ts` for the extractor's
// documented requirements and the 2026-07-09 prototype misfires that shaped
// them).

function sortedIds(ids: Iterable<string>): string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// The kind-prefix alternation, regex-escaped and id-sorted. Kind prefixes are
// DERIVED from the vocabulary (never a hardcoded kind list), so the extractor
// tracks whatever kinds the graph actually holds. Shared by every
// prefix-derived matcher so escaping and ordering never drift between them (ids
// are only path-safety validated, so a prefix can contain a regex metacharacter).
export function escapedPrefixAlt(prefixes: Set<string>): string {
  return sortedIds(prefixes)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}

/**
 * Builds the four regexes the id-ref extractor needs from a single
 * kind-prefix alternation, so they never drift out of sync with each other.
 */
export function buildIdRefMatchers(prefixes: Set<string>): {
  idShape: RegExp;
  backtickRe: RegExp;
  wildcardRe: RegExp;
  anchoredIdShape: RegExp;
} {
  const alt = escapedPrefixAlt(prefixes);
  // Boundaries reject [\w-] on either side so a real id inside a longer compound
  // (e.g. `tactic-x` inside `tactic-x-v2`) does not match.
  const idShape = new RegExp(`(?<![\\w-])(?:${alt})-[a-z0-9]+(?:-[a-z0-9]+)*(?![\\w-])`, "g");
  // Backtick-quoted content: `...` on a single line.
  const backtickRe = /`([^`\n]+)`/g;
  // Family wildcard inside backticks: <prefix>-...-*
  const wildcardRe = new RegExp(`^(?:${alt})-[a-z0-9-]+-\\*$`);
  // Anchored id-shape test for a whole backtick span, built once from the same
  // escaped alternation (hoisted out of any per-match loop over it).
  const anchoredIdShape = new RegExp(`^(?:${alt})-[a-z0-9]+(?:-[a-z0-9]+)*$`);
  return { idShape, backtickRe, wildcardRe, anchoredIdShape };
}

/** Classifies a single reference id against the current store and deleted-id sets. */
export function classifyRef(
  ref: string,
  storeIds: Set<string>,
  deletedIds: Set<string>,
): "live" | "pruned" | "missing" {
  return storeIds.has(ref) ? "live" : deletedIds.has(ref) ? "pruned" : "missing";
}

/**
 * Scans `text` for id references and returns the distinct ids found, per the
 * extractor's matching semantics:
 *
 *  - A `missing`-eligible reference must be BACKTICK-QUOTED and id-shaped. A
 *    bare kind-prefix token in flowing prose is never treated as a reference —
 *    that over-matched compounds like `tactic-only`.
 *  - A non-backticked token counts only when it is in `vocab` (current store
 *    ids ∪ deleted ids), so it can only ever resolve to `live`/`pruned`.
 *  - A family wildcard span (e.g. `` `tactic-x-*` ``) is excluded from the
 *    returned set — callers resolve wildcards against member nodes separately.
 *  - `selfId` (the node the text belongs to) is excluded — a node never
 *    references itself.
 */
export function extractIdRefs(
  text: string,
  matchers: ReturnType<typeof buildIdRefMatchers>,
  vocab: Set<string>,
  selfId: string,
): Set<string> {
  const refs = new Set<string>();

  // Explicit backtick references (the only source of `missing` classifications).
  for (const m of text.matchAll(matchers.backtickRe)) {
    const t = m[1].trim();
    if (matchers.wildcardRe.test(t)) continue; // family wildcard span — excluded
    if (t !== selfId && matchers.anchoredIdShape.test(t)) {
      refs.add(t);
    }
  }

  // Vocabulary references anywhere in prose (live/pruned only — a token not in
  // vocab is skipped, so prose compounds never become `missing`).
  for (const m of text.matchAll(matchers.idShape)) {
    const t = m[0];
    if (t === selfId) continue;
    if (vocab.has(t)) refs.add(t);
  }

  return refs;
}
