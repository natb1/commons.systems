// Office-hours read-side types and parser for the project-signals snapshot.
// Wire shape mirrors functions/src/project-signals.ts (the source of truth).
// Types are declared here independently — there is no shared types package.

import { logError } from "@commons-systems/errorutil/log";

// ---------------------------------------------------------------------------
// Wire-shape interfaces — must match functions/src/project-signals.ts exactly.
// ---------------------------------------------------------------------------

export interface ProjectSignalsSnapshot {
  computedAt: Date; // required; a Firestore Timestamp on the wire
  groupId: string; // required
  memberEmails: string[]; // required; denormalized auth field the rules read
  github?: GithubSignals;
  ga4?: Ga4AppSignals[]; // per app (app:propertyId config pairs)
  gsc?: GscSignals; // single site
  psi?: PsiUrlSignals[]; // per deployed-app URL
}

export interface GithubSignals {
  repo: string; // owner/name
  stars: number;
  forks: number;
  watchers: number;
  // Per-fork identity + activity for the fork-and-derivative review. Optional in
  // the same style as `traffic`: absent when the producer could not enumerate
  // forks. `pushedAt > createdAt` is the drive-by-vs-active discriminator.
  forksDetail?: Array<{
    owner: string;
    repoUrl: string;
    createdAt: string;
    pushedAt: string;
    stars: number;
  }>;
  traffic?: {
    clonesCount: number;
    clonesUniques: number;
    viewsCount: number;
    viewsUniques: number;
    topReferrers: Array<{ referrer: string; count: number; uniques: number }>;
  };
}

export interface Ga4AppSignals {
  app: string;
  pageViews: number;
  sessions: number;
  bounceRate: number;
  topReferralSources: Array<{ source: string; sessions: number }>;
  topLandingPages: Array<{ page: string; sessions: number; views: number }>;
  webVitals: Array<{ metric: string; avg: number; goodPct: number }>;
}

export interface GscSignals {
  site: string;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  devices: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export interface PsiUrlSignals {
  url: string;
  strategy: "mobile" | "desktop";
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcp: string;
  cls: string;
  tbt: string;
  fcp: string;
}

// ---------------------------------------------------------------------------
// Timestamp → Date helper (matches queue-metrics.ts)
// ---------------------------------------------------------------------------

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Per-source lenient parsers — a malformed sub-object degrades to undefined
// (key omitted), never fails the whole parse.
// ---------------------------------------------------------------------------

function parseGithubSignals(raw: unknown): GithubSignals | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const d = raw as Record<string, unknown>; // type-safety-ok: lenient parse
  const repo = typeof d.repo === "string" ? d.repo : null;
  const stars = typeof d.stars === "number" && Number.isFinite(d.stars) ? d.stars : null;
  const forks = typeof d.forks === "number" && Number.isFinite(d.forks) ? d.forks : null;
  const watchers = typeof d.watchers === "number" && Number.isFinite(d.watchers) ? d.watchers : null;
  if (repo === null || stars === null || forks === null || watchers === null) return undefined;

  let forksDetail: GithubSignals["forksDetail"] | undefined;
  if (Array.isArray(d.forksDetail)) {
    const entries = (d.forksDetail as unknown[]).flatMap((f) => { // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any
      if (typeof f !== "object" || f === null) return [];
      const fi = f as Record<string, unknown>; // type-safety-ok: lenient parse
      const owner = typeof fi.owner === "string" ? fi.owner : null;
      const repoUrl = typeof fi.repoUrl === "string" ? fi.repoUrl : null;
      const createdAt = typeof fi.createdAt === "string" ? fi.createdAt : null;
      const pushedAt = typeof fi.pushedAt === "string" ? fi.pushedAt : null;
      const stars = typeof fi.stars === "number" && Number.isFinite(fi.stars) ? fi.stars : null;
      if (owner === null || repoUrl === null || createdAt === null || pushedAt === null || stars === null) return [];
      return [{ owner, repoUrl, createdAt, pushedAt, stars }];
    });
    // Omit the key entirely when no valid entries survive (mirrors traffic's
    // all-or-nothing omission); a partial list of valid forks is kept.
    if (entries.length > 0) forksDetail = entries;
  }

  let traffic: GithubSignals["traffic"] | undefined;
  const t = d.traffic;
  if (typeof t === "object" && t !== null) {
    const td = t as Record<string, unknown>; // type-safety-ok: lenient parse
    const clonesCount = typeof td.clonesCount === "number" && Number.isFinite(td.clonesCount) ? td.clonesCount : null;
    const clonesUniques = typeof td.clonesUniques === "number" && Number.isFinite(td.clonesUniques) ? td.clonesUniques : null;
    const viewsCount = typeof td.viewsCount === "number" && Number.isFinite(td.viewsCount) ? td.viewsCount : null;
    const viewsUniques = typeof td.viewsUniques === "number" && Number.isFinite(td.viewsUniques) ? td.viewsUniques : null;
    const topReferrers = Array.isArray(td.topReferrers)
      ? (td.topReferrers as unknown[]).flatMap((r) => { // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any
          if (typeof r !== "object" || r === null) return [];
          const ri = r as Record<string, unknown>; // type-safety-ok: lenient parse
          const referrer = typeof ri.referrer === "string" ? ri.referrer : null;
          const count = typeof ri.count === "number" && Number.isFinite(ri.count) ? ri.count : null;
          const uniques = typeof ri.uniques === "number" && Number.isFinite(ri.uniques) ? ri.uniques : null;
          if (referrer === null || count === null || uniques === null) return [];
          return [{ referrer, count, uniques }];
        })
      : null;
    if (clonesCount !== null && clonesUniques !== null && viewsCount !== null && viewsUniques !== null && topReferrers !== null) {
      traffic = { clonesCount, clonesUniques, viewsCount, viewsUniques, topReferrers };
    }
  }

  return { repo, stars, forks, watchers, ...(forksDetail ? { forksDetail } : {}), ...(traffic ? { traffic } : {}) };
}

function parseGa4Signals(raw: unknown): Ga4AppSignals[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const results: Ga4AppSignals[] = [];
  for (const item of raw as unknown[]) { // type-safety-ok: Array.isArray early-return above narrows to any[]; cast to unknown[] avoids implicit any
    if (typeof item !== "object" || item === null) continue;
    const d = item as Record<string, unknown>; // type-safety-ok: lenient parse
    const app = typeof d.app === "string" ? d.app : null;
    const pageViews = typeof d.pageViews === "number" && Number.isFinite(d.pageViews) ? d.pageViews : null;
    const sessions = typeof d.sessions === "number" && Number.isFinite(d.sessions) ? d.sessions : null;
    const bounceRate = typeof d.bounceRate === "number" && Number.isFinite(d.bounceRate) ? d.bounceRate : null;
    if (app === null || pageViews === null || sessions === null || bounceRate === null) continue;

    const topReferralSources = Array.isArray(d.topReferralSources)
      ? (d.topReferralSources as unknown[]).flatMap((r) => { // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any
          if (typeof r !== "object" || r === null) return [];
          const ri = r as Record<string, unknown>; // type-safety-ok: lenient parse
          const source = typeof ri.source === "string" ? ri.source : null;
          const s = typeof ri.sessions === "number" && Number.isFinite(ri.sessions) ? ri.sessions : null;
          if (source === null || s === null) return [];
          return [{ source, sessions: s }];
        })
      : [];

    const topLandingPages = Array.isArray(d.topLandingPages)
      ? (d.topLandingPages as unknown[]).flatMap((r) => { // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any
          if (typeof r !== "object" || r === null) return [];
          const ri = r as Record<string, unknown>; // type-safety-ok: lenient parse
          const page = typeof ri.page === "string" ? ri.page : null;
          const s = typeof ri.sessions === "number" && Number.isFinite(ri.sessions) ? ri.sessions : null;
          const views = typeof ri.views === "number" && Number.isFinite(ri.views) ? ri.views : null;
          if (page === null || s === null || views === null) return [];
          return [{ page, sessions: s, views }];
        })
      : [];

    const webVitals = Array.isArray(d.webVitals)
      ? (d.webVitals as unknown[]).flatMap((r) => { // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any
          if (typeof r !== "object" || r === null) return [];
          const ri = r as Record<string, unknown>; // type-safety-ok: lenient parse
          const metric = typeof ri.metric === "string" ? ri.metric : null;
          const avg = typeof ri.avg === "number" && Number.isFinite(ri.avg) ? ri.avg : null;
          const goodPct = typeof ri.goodPct === "number" && Number.isFinite(ri.goodPct) ? ri.goodPct : null;
          if (metric === null || avg === null || goodPct === null) return [];
          return [{ metric, avg, goodPct }];
        })
      : [];

    results.push({ app, pageViews, sessions, bounceRate, topReferralSources, topLandingPages, webVitals });
  }
  // Return undefined (omit key) if no valid entries parsed
  return results.length > 0 ? results : undefined;
}

function parseGscSignals(raw: unknown): GscSignals | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const d = raw as Record<string, unknown>; // type-safety-ok: lenient parse
  const site = typeof d.site === "string" ? d.site : null;
  if (site === null) return undefined;

  const parseSearchRow = (key: string) => (rows: unknown[]): Array<Record<string, unknown>> =>
    rows.flatMap((r) => {
      if (typeof r !== "object" || r === null) return [];
      const ri = r as Record<string, unknown>; // type-safety-ok: lenient parse
      const k = typeof ri[key] === "string" ? ri[key] as string : null; // type-safety-ok: variable index prevents TS narrowing; typeof guard confirms string
      const clicks = typeof ri.clicks === "number" && Number.isFinite(ri.clicks) ? ri.clicks : null;
      const impressions = typeof ri.impressions === "number" && Number.isFinite(ri.impressions) ? ri.impressions : null;
      const ctr = typeof ri.ctr === "number" && Number.isFinite(ri.ctr) ? ri.ctr : null;
      const position = typeof ri.position === "number" && Number.isFinite(ri.position) ? ri.position : null;
      if (k === null || clicks === null || impressions === null || ctr === null || position === null) return [];
      return [{ [key]: k, clicks, impressions, ctr, position }];
    });

  const topQueries = Array.isArray(d.topQueries) ? parseSearchRow("query")(d.topQueries as unknown[]) as GscSignals["topQueries"] : []; // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any; outer cast asserts the parseSearchRow shape matches GscSignals
  const topPages = Array.isArray(d.topPages) ? parseSearchRow("page")(d.topPages as unknown[]) as GscSignals["topPages"] : []; // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any; outer cast asserts the parseSearchRow shape matches GscSignals
  const devices = Array.isArray(d.devices) ? parseSearchRow("device")(d.devices as unknown[]) as GscSignals["devices"] : []; // type-safety-ok: Array.isArray narrows to any[]; cast to unknown[] avoids implicit any; outer cast asserts the parseSearchRow shape matches GscSignals

  return { site, topQueries, topPages, devices };
}

function parsePsiSignals(raw: unknown): PsiUrlSignals[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const results: PsiUrlSignals[] = [];
  for (const item of raw as unknown[]) { // type-safety-ok: Array.isArray early-return above narrows to any[]; cast to unknown[] avoids implicit any
    if (typeof item !== "object" || item === null) continue;
    const d = item as Record<string, unknown>; // type-safety-ok: lenient parse
    const url = typeof d.url === "string" ? d.url : null;
    const strategy = d.strategy === "mobile" || d.strategy === "desktop" ? d.strategy : null;
    const lcp = typeof d.lcp === "string" ? d.lcp : null;
    const cls = typeof d.cls === "string" ? d.cls : null;
    const tbt = typeof d.tbt === "string" ? d.tbt : null;
    const fcp = typeof d.fcp === "string" ? d.fcp : null;
    if (url === null || strategy === null || lcp === null || cls === null || tbt === null || fcp === null) continue;

    const parseScore = (key: string): number | null => {
      const v = d[key];
      if (v === null || v === undefined) return null;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      return null;
    };

    results.push({
      url,
      strategy,
      performance: parseScore("performance"),
      seo: parseScore("seo"),
      accessibility: parseScore("accessibility"),
      bestPractices: parseScore("bestPractices"),
      lcp,
      cls,
      tbt,
      fcp,
    });
  }
  return results.length > 0 ? results : undefined;
}

// ---------------------------------------------------------------------------
// Top-level parser
// ---------------------------------------------------------------------------

/**
 * Parses a raw Firestore document map into a ProjectSignalsSnapshot. Returns
 * null and logs an error if any required field is missing or has an unexpected
 * type. Each optional source sub-object (github/ga4/gsc/psi) degrades to
 * omitted rather than failing the whole parse.
 *
 * `opts.requireMemberEmails` (default true) controls whether the source document
 * must carry the denormalized `memberEmails` auth field. A live Firestore doc
 * always carries it — the office-hours security rules evaluate it — so its
 * absence there is real drift and must reject. The offline snapshot wire
 * deliberately OMITS it (see office-hours/src/snapshot-wire.ts), so
 * `decodeSnapshot` passes false and the parsed snapshot carries an empty list,
 * matching the public-seed convention in data.ts.
 */
export function parseProjectSignals(
  data: Record<string, unknown>,
  opts: { requireMemberEmails?: boolean } = {},
): ProjectSignalsSnapshot | null {
  const requireMemberEmails = opts.requireMemberEmails ?? true;
  const computedAt = toDate(data.computedAt);
  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const memberEmails =
    Array.isArray(data.memberEmails) && data.memberEmails.every((e) => typeof e === "string")
      ? (data.memberEmails as string[]) // type-safety-ok: every() verifies element types but TS cannot narrow unknown[] to string[] via every()
      : null;

  if (computedAt === null || groupId === null || (requireMemberEmails && memberEmails === null)) {
    logError(new Error("office-hours project signals missing or invalid required fields"), {
      operation: "project-signals-validation",
    });
    return null;
  }

  // Each source is parsed leniently — a malformed sub-object degrades to
  // undefined (key omitted), never fails the whole parse.
  const github = parseGithubSignals(data.github);
  const ga4 = parseGa4Signals(data.ga4);
  const gsc = parseGscSignals(data.gsc);
  const psi = parsePsiSignals(data.psi);

  return {
    computedAt,
    groupId,
    // `[]` only on the snapshot-wire path, which strips the ACL and passes
    // requireMemberEmails:false; the Firestore path always has the real list.
    memberEmails: memberEmails ?? [],
    ...(github !== undefined ? { github } : {}),
    ...(ga4 !== undefined ? { ga4 } : {}),
    ...(gsc !== undefined ? { gsc } : {}),
    ...(psi !== undefined ? { psi } : {}),
  };
}
