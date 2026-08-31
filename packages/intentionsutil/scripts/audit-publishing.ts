// Audit the owned publication surfaces to produce the machine-verifiable half of
// the `strategy-recover-publishing` signal reading. For each owned surface it
// enumerates the published pieces from that surface's live RSS feed, checks each
// piece is publicly readable with no account (unauthenticated GET → HTTP 200 with
// the piece's title present in the prerendered body), and prints an attestation
// checklist only the owner can complete ("no piece is platform-first").
//
// Report-only: it does NOT write `reading`/`gap` onto any node. The owner review
// at office-hours consumes this report, completes the attestation checklist, and
// stamps `reading`/`gap` on `intentions/strategy-recover-publishing.md`.
//
// Deliberately NOT registered in `read-sensors.ts`'s default registry: that
// registry is local-first no-network by design; this instrument fetches live
// production URLs. Run from a network-enabled shell:
//   node --import tsx/esm packages/intentionsutil/scripts/audit-publishing.ts
//
// Exit 0 when every piece passes the no-account check; exit 1 when any fails
// (the failure list is the gap evidence). A fetch failure, non-200 on a
// surface's feed.xml, or a feed with zero items is a FATAL error naming the URL
// (clear errors over fallbacks) — an owned surface with no published pieces or
// an unreachable feed means the instrument cannot produce an honest reading.

import { pathToFileURL } from "node:url";

/** Narrow an unknown thrown value to a message string without a type cast. */
function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// --- Surfaces --------------------------------------------------------------
// Hardcoded owned surfaces. Values must match `landing/src/site-config.ts:6`
// and `fellspiral/src/site-config.ts:6`.
export interface Surface {
  name: string;
  siteUrl: string;
}

export const SURFACES: Surface[] = [
  { name: "landing", siteUrl: "https://commons.systems" },
  { name: "fellspiral", siteUrl: "https://fellspiral.commons.systems" },
];

// --- IO contract -----------------------------------------------------------
// `fetchText` performs an UNAUTHENTICATED GET (no cookies, no auth headers).
// Injected in tests so the pure core never touches the network.
export interface FetchResult {
  status: number;
  body: string;
}
export type FetchText = (url: string) => Promise<FetchResult>;

// --- Result shapes ---------------------------------------------------------
export interface PieceResult {
  title: string;
  url: string;
  pubDate: string;
  /** True when the unauthenticated GET returned 200 with the title in the body. */
  noAccountReadable: boolean;
}
export interface SurfaceResult {
  name: string;
  siteUrl: string;
  pieces: PieceResult[];
}
export interface AuditSummary {
  surfaces: SurfaceResult[];
  /** True when every piece on every surface passed the no-account check. */
  allPass: boolean;
}

// --- Feed parsing ----------------------------------------------------------
// Reverse of `escapeHtml` (`packages/htmlutil`): unescape the five entities it
// produces. `&amp;` is undone LAST so an already-escaped `&lt;` (`&amp;lt;`)
// round-trips correctly.
export function unescapeHtml(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
}

/**
 * Parse `<item>` blocks out of our own generator's RSS (shape from
 * `packages/blog/src/feed-rss.ts`). A simple string/regex extraction is fine —
 * the feed is our generator's output, not arbitrary XML. Titles and links are
 * emitted through `escapeHtml`, so they are unescaped here.
 */
export function parseFeedItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(block);
    const link = /<link>([\s\S]*?)<\/link>/.exec(block);
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block);
    if (!title || !link) continue;
    items.push({
      title: unescapeHtml(title[1].trim()),
      link: unescapeHtml(link[1].trim()),
      pubDate: pubDate ? pubDate[1].trim() : "",
    });
  }
  return items;
}

// --- Core audit ------------------------------------------------------------

/**
 * Enumerate and audit every published piece across the given surfaces. Pure
 * except for the injected `fetchText`. Throws a fatal error naming the URL when
 * a surface's feed cannot be honestly enumerated (fetch failure, non-200, or
 * zero items). Per-piece failures are recorded as findings, not thrown.
 */
export async function auditSurfaces(
  surfaces: Surface[],
  fetchText: FetchText,
): Promise<AuditSummary> {
  const results: SurfaceResult[] = [];
  let allPass = true;

  for (const surface of surfaces) {
    const feedUrl = `${surface.siteUrl}/feed.xml`;

    let feed: FetchResult;
    try {
      feed = await fetchText(feedUrl);
    } catch (err) {
      throw new Error(
        `audit-publishing: failed to fetch feed ${feedUrl}: ${errMessage(err)}`,
      );
    }
    if (feed.status !== 200) {
      throw new Error(
        `audit-publishing: feed ${feedUrl} returned HTTP ${feed.status} (expected 200)`,
      );
    }

    const items = parseFeedItems(feed.body);
    if (items.length === 0) {
      throw new Error(
        `audit-publishing: feed ${feedUrl} enumerated zero published pieces — cannot produce an honest reading`,
      );
    }

    const pieces: PieceResult[] = [];
    for (const item of items) {
      let noAccountReadable = false;
      try {
        const resp = await fetchText(item.link);
        noAccountReadable = resp.status === 200 && resp.body.includes(item.title);
      } catch {
        // A fetch failure on a piece is a finding, not a fatal error.
        noAccountReadable = false;
      }
      if (!noAccountReadable) allPass = false;
      pieces.push({
        title: item.title,
        url: item.link,
        pubDate: item.pubDate,
        noAccountReadable,
      });
    }

    results.push({ name: surface.name, siteUrl: surface.siteUrl, pieces });
  }

  return { surfaces: results, allPass };
}

// --- Report ----------------------------------------------------------------

/** Escape the four characters that would break a markdown table cell. */
function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

/** Render the audit summary as a markdown report (stdout). */
export function formatReport(summary: AuditSummary): string {
  const lines: string[] = [];
  lines.push("# Publishing audit — strategy-recover-publishing");
  lines.push("");

  for (const surface of summary.surfaces) {
    lines.push(`## ${surface.name} (${surface.siteUrl})`);
    lines.push("");
    lines.push("| Title | URL | pubDate | no-account-readable |");
    lines.push("| --- | --- | --- | --- |");
    for (const p of surface.pieces) {
      lines.push(
        `| ${cell(p.title)} | ${cell(p.url)} | ${cell(p.pubDate || "—")} | ${p.noAccountReadable ? "yes" : "no"} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Attestation checklist (owner)");
  lines.push("");
  lines.push(
    "Only the owner can complete this — whether a piece appeared on a platform",
  );
  lines.push("before its owned domain is not machine-knowable.");
  lines.push("");
  for (const surface of summary.surfaces) {
    for (const p of surface.pieces) {
      lines.push(
        `- [ ] ${surface.name}: ${p.title} — platform-first? (owned domain first; platform posts at most syndicated copies)`,
      );
    }
  }
  lines.push("");
  lines.push(
    "Result lands via the owner: stamp `reading`/`gap` on `intentions/strategy-recover-publishing.md` (write-node.ts + graph-commit).",
  );
  lines.push("");

  return lines.join("\n");
}

// --- Main ------------------------------------------------------------------

/** Unauthenticated GET wired to global `fetch` — no cookies, no auth headers. */
const liveFetchText: FetchText = async (url) => {
  const resp = await fetch(url, { redirect: "follow" });
  const body = await resp.text();
  return { status: resp.status, body };
};

export async function main(): Promise<number> {
  const summary = await auditSurfaces(SURFACES, liveFetchText);
  process.stdout.write(formatReport(summary));
  return summary.allPass ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`${errMessage(err)}\n`);
      process.exit(1);
    },
  );
}
