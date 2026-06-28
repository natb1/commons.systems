import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
// Value imports use RELATIVE SOURCE PATHS, not the bare "@commons-systems/intentionsutil"
// specifier. vite bundles vite.config.ts (and this plugin) via esbuild but EXTERNALIZES
// bare workspace specifiers; Node's ESM loader then cannot load intentionsutil's TS-only
// source (its internal `.js` imports resolve only to `.ts` on disk), which breaks both
// `vite build` and vitest at config-load time. A relative path is inlined by esbuild
// (it resolves `.js`→`.ts` and recursively bundles the source) instead of externalized.
// This is the only office-hours module that value-imports intentionsutil; it runs in Node
// at build time, never in the browser bundle.
import { listNodes } from "../../packages/intentionsutil/src/store.js";
import { activeFrontier } from "../../packages/intentionsutil/src/goals.js";
import { listTrackers } from "../../packages/intentionsutil/src/tracker.js";
import type { ExecutionTracker } from "@commons-systems/intentionsutil";

const VIRTUAL_MODULE_ID = "virtual:office-hours-intention-tree-seed";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

/**
 * Walk up the directory chain from `startDir` until a directory containing an
 * `intentions` subdirectory is found; that directory is the repo root.
 *
 * Why a marker-walk instead of a fixed `dirname()` count (as
 * intentionsutil/scripts/frontier-view.ts uses): this plugin file's RUNTIME
 * location differs between its two execution contexts, so no fixed depth is
 * correct for both:
 *   - Under vitest, the test imports the plugin SOURCE directly, so
 *     `import.meta.url` resolves to office-hours/src/vite-plugin-intention-tree-seed.ts
 *     (depth: repo/office-hours/src/).
 *   - Under `vite build`, vite bundles vite.config.ts and its imported local
 *     plugins into a single temp file written to the PROJECT ROOT
 *     (office-hours/vite.config.ts.timestamp-*.mjs), so `import.meta.url`
 *     resolves to that temp file (depth: repo/office-hours/) — one level
 *     shallower.
 * Resolving from process.cwd() is also unsafe: cwd is `office-hours` under
 * `vite build` but the repo root under `vitest run --root .`. The marker-walk
 * is depth- and cwd-independent and works under both.
 */
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, "intentions"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        "office-hours-intention-tree-seed: could not locate repo root (no 'intentions' dir found walking up from " +
          startDir +
          ")",
      );
    }
    dir = parent;
  }
}

export function officeHoursIntentionTreeSeedPlugin(): Plugin {
  let moduleCode: string | undefined;

  return {
    name: "office-hours-intention-tree-seed",
    buildStart() {
      const repoRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));
      const intentionsDir = join(repoRoot, "intentions");
      const trackersDir = join(repoRoot, "trackers");

      const nodes = listNodes(intentionsDir);
      const frontierIds = activeFrontier(nodes).map((n) => n.id);

      // Guard the trackers dir: the store is sparse, and listTrackers does a
      // readdirSync that throws on a missing dir. A missing dir or zero
      // trackers must serialize an empty tracker map, never throw.
      // (listTrackers already filters non-`.json` entries, so README.md is
      // ignored.)
      const trackerList = existsSync(trackersDir) ? listTrackers(trackersDir) : [];
      const trackers: Record<string, ExecutionTracker> = {};
      for (const t of trackerList) trackers[t.node_id] = t;

      // Slim each node to ONLY the fields the panel consumes, stripping
      // rationale/reading/gap/clarifications/success_signal/tooling_goals
      // (bundle size + #2371 deferral).
      const slimNodes = nodes.map((n) => ({
        id: n.id,
        statement: n.statement,
        owner: n.owner,
        status: n.status,
        parent: n.parent,
      }));

      // The data is fully JSON-safe (strings/enums; ExecutionTracker.refreshed_at
      // is a string), so plain JSON.stringify suffices — no Date handling.
      moduleCode = `export default ${JSON.stringify({ nodes: slimNodes, frontierIds, trackers })};\n`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        if (!moduleCode) {
          throw new Error("office-hours-intention-tree-seed: load called before buildStart");
        }
        return moduleCode;
      }
    },
  };
}
