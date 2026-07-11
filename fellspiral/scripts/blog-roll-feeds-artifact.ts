import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LatestPost } from "@commons-systems/blog/blog-roll/types";

// Absolute path of the build-time blog-roll feed snapshot. `vite.config.ts`'s
// feedFetchPlugin writes it at build end; the post-build tsx prerender
// (scripts/prerender.ts) reads it and passes it as `buildTimeFeeds`, so the
// prerendered info-panel hydrates from the SAME data the client's
// `virtual:blog-roll-feeds` bundle inlines. Resolved relative to THIS module so
// both importers (vite.config at the app root, prerender under scripts/) agree
// regardless of their own location. Lives under `tmp/` (root .gitignore's
// `**/tmp/`) — a build scratch artifact, not deployed content.
const here = dirname(fileURLToPath(import.meta.url));
export const BLOG_ROLL_FEEDS_ARTIFACT = join(
  here,
  "..",
  "tmp",
  "blog-roll-feeds.json",
);

/**
 * Read the build-time feed snapshot the vite `feedFetchPlugin` persisted (it
 * inlines the same data into the client via `virtual:blog-roll-feeds`, which the
 * standalone tsx prerender cannot import). Returned as `buildTimeFeeds`, it makes
 * the prerendered info-panel byte-match the client's first render — the
 * InfoPanelRegion initializer is a pure function of `data`, so identical
 * `blogRoll` + `buildTimeFeeds` on both sides means no hydration mismatch on the
 * panel root (the prod bug #2173 failure class).
 *
 * Fails loudly rather than silently prerendering empty feeds:
 *  - a missing/malformed artifact is a build misconfiguration (the vite build
 *    must run before the prerender);
 *  - a **parity assertion** requires the artifact's ids to match `expectedIds`
 *    exactly. `expectedIds` is the blogRoll id-space the client hydrates (the
 *    feed registry), so any drift — stale artifact, registry change, partial
 *    write — would resurface an SSR/client mismatch and fails the build instead.
 */
export function readBlogRollFeedsArtifact(
  expectedIds: readonly string[],
  artifactPath: string = BLOG_ROLL_FEEDS_ARTIFACT,
): Record<string, LatestPost | null> {
  let raw: string;
  try {
    raw = readFileSync(artifactPath, "utf8");
  } catch (err) {
    throw new Error(
      `Blog-roll feed artifact not found at ${artifactPath}. It is written by ` +
        `feedFetchPlugin during \`vite build\`; run the vite build before the ` +
        `prerender (see fellspiral/package.json "build").`,
      { cause: err },
    );
  }
  // Boundary parse of a build artifact this module's own writer (feedFetchPlugin)
  // produced; the id-set parity assertion below validates its keys.
  const feeds = JSON.parse(raw) as Record<string, LatestPost | null>; // type-safety-ok: boundary parse of a self-produced build artifact validated by the parity assertion below

  const wantIds = [...expectedIds].sort();
  const gotIds = Object.keys(feeds).sort();
  const equal =
    wantIds.length === gotIds.length && wantIds.every((id, i) => id === gotIds[i]);
  if (!equal) {
    throw new Error(
      `Blog-roll feed parity check failed: artifact ids [${gotIds.join(", ")}] ` +
        `do not match the expected blogRoll ids [${wantIds.join(", ")}]. The ` +
        `prerendered info-panel would diverge from the client hydration.`,
    );
  }
  return feeds;
}
