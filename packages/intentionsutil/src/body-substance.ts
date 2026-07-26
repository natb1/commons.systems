// Plan substance vs machinery output in a tactic's markdown body
// (tactic-scope-fingerprint-plan-substance Unit 1).
//
// A tactic's body carries two kinds of content: the PLAN SUBSTANCE the author
// wrote (context, scope, verification — what a phase worker executes against),
// and MACHINERY SECTIONS the dispatch machinery appends while the tactic is in
// flight (today: /qa-fix's `## needs-main residue`). Only the substance is
// scope: an append by the machinery must never read as the author changing the
// plan under a worker's feet, which is what the chain-of-custody gate demotes
// for.
//
// This module owns the boundary between the two, so the exclusion is by
// construction rather than by every writer remembering to refresh a stamp. It is
// a LEAF module — it imports nothing else from this package (router.ts and
// transitions.ts already form an ESM cycle; adding an edge into either from a
// module both need would deepen it).

/** The machinery boundary: everything at or below this line is machinery output. */
export const MACHINERY_SENTINEL =
  "<!-- machinery: dispatch-appended sections below this line are excluded from the tactic scope fingerprint -->";

/**
 * Whether a body line is the machinery sentinel. Matched loosely (an HTML
 * comment opening with the `machinery` word) so a reflowed or extended sentinel
 * still marks the boundary — the sentinel is a marker, not a checksum.
 */
export function isMachinerySentinelLine(line: string): boolean {
  return /^<!--\s*machinery\b/.test(line.trim());
}

/**
 * Whether an H2's heading TEXT names the needs-main residue section — e.g.
 * `needs-main`, `Needs-main residue`, `Needs-main QA`. The single needs-main
 * detector: `hasNeedsMainResidue` (transitions.ts) uses it for the reconciler's
 * qa → main-qa routing branch, and `planSubstance` uses it for the legacy
 * boundary rule, so the two can never disagree.
 */
export function isNeedsMainHeadingText(headingText: string): boolean {
  return /^needs-main(?:\s|$)/i.test(headingText.trim());
}

/**
 * The plan-substance region of a body: everything ABOVE the machinery boundary.
 *
 * The boundary is the first line that either
 *   (i)  is the machinery sentinel (`isMachinerySentinelLine`), or
 *   (ii) is an H2 (`/^##\s+(.*)$/`) whose heading text is a needs-main residue
 *        heading (`isNeedsMainHeadingText`).
 *
 * Rule (ii) is legacy / defense-in-depth: it classifies the already-landed
 * `## needs-main…` sections as machinery with no body rewrite, and it catches a
 * writer that appends residue without the sentinel.
 *
 * With NO boundary the body is returned byte-for-byte unchanged — load-bearing:
 * every tactic carrying no machinery section keeps exactly the fingerprint it
 * had before the rescope. With a boundary, the prefix's trailing newline run is
 * collapsed to exactly one `\n` so blank-line padding above the boundary (which
 * a writer controls, not the author) is not substance.
 */
export function planSubstance(body: string): string {
  const lines = body.split("\n");
  let offset = 0;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/);
    if (isMachinerySentinelLine(line) || (heading !== null && isNeedsMainHeadingText(heading[1]))) {
      const prefix = body.slice(0, offset);
      return prefix === "" ? "" : prefix.replace(/\n+$/, "\n");
    }
    offset += line.length + 1; // +1 for the "\n" `split` consumed
  }
  return body;
}

/**
 * Append a machinery section to a body — the only supported way to write one.
 *
 * The sentinel is inserted on the first append and reused on every later one, so
 * every machinery section lands at or below the boundary and `planSubstance` of
 * the result equals `planSubstance` of the input. Not a single byte above the
 * boundary is modified.
 *
 * `section` is the full markdown of the section (its own `## …` heading
 * included); its trailing whitespace is normalized to exactly one `\n`.
 */
export function appendMachinerySection(body: string, section: string): string {
  const base = body === "" ? "" : body.replace(/\n*$/, "\n");
  const normalizedSection = section.replace(/\s+$/, "") + "\n";
  const hasSentinel = body.split("\n").some(isMachinerySentinelLine);
  if (hasSentinel) return base + "\n" + normalizedSection;
  return base + "\n" + MACHINERY_SENTINEL + "\n\n" + normalizedSection;
}
