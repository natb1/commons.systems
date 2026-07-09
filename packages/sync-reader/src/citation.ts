// Map a citation range to a contiguous span of spine sections.
//
// Section-granularity only: a page-level span within one book still selects the
// whole containing section(s), never a sub-section slice. The citation families
// seen in the curriculum are:
//   - Stephanus:      "VII 514a-521b"  (roman book + page-letter span)
//   - Bekker/Academy: "4:429", "6:434-437" (volume:page), "II.5-6" (book.chapter)
//   - plain chapter/book: "ch. 2", "IV"
// A parse or match failure returns `unmapped` with a human-readable reason
// quoting the range and the nearest TOC labels considered — no fallback.

import type { TocEntry } from "./epub-read.js";
import { tokenize } from "./matching.js";

export type MapResult =
  | { kind: "sections"; spineIndices: number[] }
  | { kind: "unmapped"; reason: string };

const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 } as const;

/** Parse a lowercase roman numeral to a number, or null if not one. */
function romanToNumber(s: string): number | null {
  if (!/^[ivxlcdm]+$/.test(s)) return null;
  let total = 0;
  let prev = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const val = ROMAN[s[i] as keyof typeof ROMAN];
    if (val < prev) total -= val;
    else {
      total += val;
      prev = val;
    }
  }
  return total > 0 ? total : null;
}

type ParsedRange =
  | { kind: "designator"; forms: Set<string> } // book/chapter label forms to match
  | { kind: "page"; page: number } // volume:page → select by page bracket
  | { kind: "fail"; reason: string };

/** Build the set of label-token forms (arabic + roman) for a designator number. */
function designatorForms(n: number): Set<string> {
  return new Set([String(n), numberToRoman(n)]);
}

function numberToRoman(n: number): string {
  const table: [number, string][] = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
    [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  let rem = n;
  for (const [v, s] of table) {
    while (rem >= v) {
      out += s;
      rem -= v;
    }
  }
  return out;
}

function parseRange(range: string): ParsedRange {
  const r = range.trim().toLowerCase();

  // volume:page (or volume:page-page) — take the page (second number).
  const vp = r.match(/(\d+)\s*:\s*(\d+)/);
  if (vp) return { kind: "page", page: Number(vp[2]) };

  // chapter reference: "ch. 2", "chapter 2".
  const ch = r.match(/\bch(?:apter|\.)?\s*(\d+)/);
  if (ch) return { kind: "designator", forms: designatorForms(Number(ch[1])) };

  // leading roman book/part (optionally prefixed): "VII 514a", "II.5-6", "IV".
  const rb = r.match(/^(?:book\s+|bk\.?\s+|part\s+)?([ivxlcdm]+)\b/);
  if (rb) {
    const n = romanToNumber(rb[1]);
    if (n !== null) return { kind: "designator", forms: designatorForms(n) };
  }

  // leading arabic book: "4 ...", "book 4".
  const ab = r.match(/^(?:book\s+|bk\.?\s+|part\s+)?(\d+)\b/);
  if (ab) return { kind: "designator", forms: designatorForms(Number(ab[1])) };

  return { kind: "fail", reason: "no recognizable book/chapter/page designator" };
}

/** Spine span from a matched entry through the next same-or-shallower entry. */
function spanFrom(entry: TocEntry, ordered: TocEntry[], spineLength: number): MapResult {
  if (entry.spineIndex < 0) {
    return { kind: "unmapped", reason: `TOC entry "${entry.label}" has no spine mapping` };
  }
  const next = ordered.find((e) => e.spineIndex > entry.spineIndex);
  const end = next ? next.spineIndex - 1 : spineLength - 1;
  const indices: number[] = [];
  for (let i = entry.spineIndex; i <= end && i < spineLength; i++) indices.push(i);
  return { kind: "sections", spineIndices: indices };
}

function nearestLabels(toc: TocEntry[]): string {
  return toc
    .slice(0, 6)
    .map((e) => `"${e.label}"`)
    .join(", ");
}

/**
 * Resolve `range` to spine indices against `toc`. Returns the containing
 * section span, or `unmapped` with a reason naming the range and the TOC
 * labels considered.
 */
export function mapRangeToSections(
  range: string,
  toc: TocEntry[],
  spineLength: number,
): MapResult {
  const parsed = parseRange(range);
  if (parsed.kind === "fail") {
    return { kind: "unmapped", reason: `range "${range}": ${parsed.reason}` };
  }

  const ordered = [...toc]
    .filter((e) => e.spineIndex >= 0)
    .sort((a, b) => a.spineIndex - b.spineIndex);
  if (ordered.length === 0) {
    return { kind: "unmapped", reason: `range "${range}": no spine-mapped TOC entries` };
  }

  if (parsed.kind === "designator") {
    const hits = ordered.filter((e) =>
      tokenize(e.label).some((tok) => parsed.forms.has(tok)),
    );
    if (hits.length === 1) return spanFrom(hits[0], ordered, spineLength);
    if (hits.length === 0) {
      return {
        kind: "unmapped",
        reason: `range "${range}": no TOC entry matches designator {${[...parsed.forms].join(", ")}}; nearest: ${nearestLabels(toc)}`,
      };
    }
    return {
      kind: "unmapped",
      reason: `range "${range}": designator matches multiple TOC entries (${hits.map((h) => `"${h.label}"`).join(", ")})`,
    };
  }

  // page bracket: choose the section whose start page is the greatest value
  // <= the cited page. A section label may carry both a volume and a page
  // (e.g. "Second Section 4:406"); the page is the larger number, so bracket
  // on the maximum numeric token in the label.
  let chosen: { entry: TocEntry; start: number } | null = null;
  for (const entry of ordered) {
    const nums = tokenize(entry.label)
      .map((t) => Number(t))
      .filter((n) => Number.isFinite(n));
    const start = nums.length > 0 ? Math.max(...nums) : null;
    if (start === null || start > parsed.page) continue;
    if (chosen === null || start > chosen.start) chosen = { entry, start };
  }
  if (chosen === null) {
    return {
      kind: "unmapped",
      reason: `range "${range}": page ${parsed.page} precedes every numbered TOC entry; nearest: ${nearestLabels(toc)}`,
    };
  }
  return spanFrom(chosen.entry, ordered, spineLength);
}
