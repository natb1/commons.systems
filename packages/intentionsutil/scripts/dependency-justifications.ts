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
};
