// Match a curriculum work reference against the epubs found on the share.
//
// The work string is "Author, Title"-shaped (e.g.
// "Kant, Groundwork of the Metaphysics of Morals"). A candidate epub matches
// when every author token appears in its normalized dc:creator set AND every
// significant title token (stopwords dropped) appears in its normalized
// dc:title. Exactly one candidate → match; zero → missing; two or more →
// ambiguous. Never guesses between two-plus candidates.

import type { EpubMeta } from "./epub-read.js";

/**
 * Normalize text for token comparison: lowercase, strip diacritics (Unicode
 * NFD minus combining marks), drop punctuation, collapse whitespace, tokenize.
 * Exported so the citation mapper normalizes TOC labels identically.
 */
export function tokenize(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

const TITLE_STOPWORDS = new Set(["the", "of", "a", "an", "and"]);

export type MatchResult =
  | { kind: "match"; index: number }
  | { kind: "missing" }
  | { kind: "ambiguous"; indices: number[] };

function isSubset(needles: string[], haystack: Set<string>): boolean {
  return needles.every((n) => haystack.has(n));
}

export function matchWork(work: string, candidates: EpubMeta[]): MatchResult {
  const commaIdx = work.indexOf(",");
  const authorPart = commaIdx === -1 ? "" : work.slice(0, commaIdx);
  const titlePart = commaIdx === -1 ? work : work.slice(commaIdx + 1);

  const authorTokens = tokenize(authorPart);
  const titleTokens = tokenize(titlePart).filter((t) => !TITLE_STOPWORDS.has(t));

  const matches: number[] = [];
  candidates.forEach((cand, index) => {
    const creatorSet = new Set(cand.creators.flatMap((c) => tokenize(c)));
    const titleSet = new Set(tokenize(cand.title));
    if (isSubset(authorTokens, creatorSet) && isSubset(titleTokens, titleSet)) {
      matches.push(index);
    }
  });

  if (matches.length === 1) return { kind: "match", index: matches[0] };
  if (matches.length === 0) return { kind: "missing" };
  return { kind: "ambiguous", indices: matches };
}
