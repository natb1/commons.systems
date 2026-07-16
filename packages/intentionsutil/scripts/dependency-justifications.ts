// Recorded justifications for the workspace's third-party runtime dependencies.
//
// This is the data file `dependency-audit.ts` cross-checks each collected
// third-party runtime dependency against. It is the human-reviewed record the
// strategy-owned-web-platform success signal quantifies over ("every third-party
// runtime dependency of the apps and shared packages carries a recorded
// justification").
//
// SHAPE (kept stable and easy to extend — a later unit populates the complete
// set): a `const` map keyed by the EXACT dependency name as it appears in a
// workspace member's `dependencies`. Each entry records:
//   - justification: why this third-party runtime dependency is carried.
//   - upstream: health of the upstream project. `"live"` = actively maintained;
//     `"archived"` = repo archived / no longer developed; `"stale"` = alive but
//     effectively unmaintained / we patch around it; any other string is
//     allowed for finer notes, but only `"archived"`/`"stale"` are counted as
//     dead-upstream by the audit.
//
// SCOPE OF THIS SEED: only a couple of illustrative entries plus the one real
// dead-upstream case the audit must be able to surface (`epubjs`). Completeness
// — a justification for every third-party runtime dependency — is deliberately
// out of scope for this unit and is the next unit's job. Do NOT add entries for
// dependencies that are not runtime `dependencies` of some workspace member: e.g.
// `critters` is a root devDependency used by criticalcssutil's build step, not a
// runtime dependency of any app, so it does not belong here.

export interface DependencyJustification {
  /** Why this third-party runtime dependency is carried. */
  justification: string;
  /**
   * Upstream health. `"live"` | `"archived"` | `"stale"` are the recognized
   * values; `"archived"` and `"stale"` are counted as dead-upstream by the
   * audit. Any other string is permitted for finer notes but is treated as
   * not-dead-upstream.
   */
  upstream: "live" | "archived" | "stale" | string;
}

export const dependencyJustifications: Record<string, DependencyJustification> = {
  react: {
    justification: "Core UI runtime for the React-based apps (print, office-hours, and others).",
    upstream: "live",
  },
  firebase: {
    justification:
      "Firebase client SDK — auth, Firestore, and hosting integration used across the apps.",
    upstream: "live",
  },
  epubjs: {
    justification:
      "print's EPUB renderer. Upstream is effectively unmaintained; we patch around its behavior in-app.",
    upstream: "stale",
  },
  "react-dom": {
    justification:
      "React's DOM renderer, paired with react — createRoot in the app entrypoints (print, office-hours, audio, budget, landing main.tsx).",
    upstream: "live",
  },
  "@google-cloud/secret-manager": {
    justification:
      "office-hours-snapshot/src/run.ts dynamically imports SecretManagerServiceClient to fetch secrets at runtime (functions declares it too but knip.jsonc baselines that copy as unused).",
    upstream: "live",
  },
  "@observablehq/plot": {
    justification:
      "Declarative charting library for office-hours queue/history charts, budget's financial charts, and packages/ds chart components.",
    upstream: "live",
  },
  "d3-hierarchy": {
    justification:
      "budget: hierarchy/tree layout (import { hierarchy, tree } from d3-hierarchy) for its hierarchical spend visualizations.",
    upstream: "live",
  },
  "d3-interpolate": {
    justification:
      "budget: interpolateRgb color interpolation for chart color ramps.",
    upstream: "live",
  },
  "d3-scale": {
    justification:
      "budget: declared but no code imports it — knip.jsonc baselines it as unused (budget's charts use d3-hierarchy/interpolate/shape, not d3-scale). A deletion candidate, kept per no-bulk-delete.",
    upstream: "live",
  },
  "d3-scale-chromatic": {
    justification:
      "budget: declared but never imported — knip.jsonc baselines it as unused. A deletion candidate, kept per no-bulk-delete.",
    upstream: "live",
  },
  "d3-shape": {
    justification:
      "budget: pie/arc shape generators (import { pie, arc } from d3-shape) for its donut/pie charts.",
    upstream: "live",
  },
  dompurify: {
    justification:
      "fellspiral/landing: client-side HTML sanitization (DOMPurify.sanitize) of Markdown rendered through the shared @commons-systems/blog pipeline before innerHTML injection.",
    upstream: "live",
  },
  marked: {
    justification:
      "fellspiral/landing: Markdown-to-HTML rendering of blog posts via the shared @commons-systems/blog marked-config.",
    upstream: "live",
  },
  "firebase-admin": {
    justification:
      "Firebase Admin SDK — server-side Firestore access in office-hours-snapshot, firestoreutil seeding/merge helpers, and Cloud Functions.",
    upstream: "live",
  },
  "firebase-functions": {
    justification:
      "Firebase Cloud Functions SDK — defines the HTTPS/scheduled functions (feed-proxy, webmention, project-signals, dispatch-queue-metrics).",
    upstream: "live",
  },
  "missing.css": {
    justification:
      "Classless CSS baseline stylesheet imported once in each app entrypoint (office-hours, audio, budget, fellspiral, landing, print main.tsx).",
    upstream: "live",
  },
  "music-metadata": {
    justification:
      "audio: parseBuffer extracts embedded tags/metadata from audio files (audio/src/local-metadata.ts).",
    upstream: "live",
  },
  "pdfjs-dist": {
    justification:
      "print: PDF rendering and text-layer extraction (pdfjsLib + TextLayer) for the PDF viewer and metadata reader.",
    upstream: "live",
  },
  typescript: {
    justification:
      "packages/firebase-audit: uses the TypeScript compiler API (import ts from \"typescript\") at runtime to statically resolve and walk module imports for the firebase-reachability audit — a genuine runtime dependency, not just the build toolchain.",
    upstream: "live",
  },
  unzipit: {
    justification:
      "print: unzip() reads zip-based archives (image archives / comic books) in the viewer and metadata reader.",
    upstream: "live",
  },
  yaml: {
    justification:
      "parse/stringify YAML — office-hours graph-source parsing and intentionsutil's intention-node store.",
    upstream: "live",
  },
};
