// Every future intentions/ graph edit is CI-checked through this test
// (run-unit-tests.sh → npx vitest run --project packages/intentionsutil).

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";
import { resolveAttention } from "../src/attention.js";
import { validateGraph } from "../src/schema.js";
import { listNodesStrict } from "../src/store.js";

// The test file lives at packages/intentionsutil/test/, so repo root is three
// dirname() calls up from this file's own location — same pattern as
// packages/intentionsutil/scripts/frontier-view.ts.
const testDir = dirname(fileURLToPath(import.meta.url));
const intentionsDir = join(dirname(dirname(dirname(testDir))), "intentions");

// Skip cleanly when the directory is absent: the package test suite must stay
// self-contained when run outside the repo (e.g. in an isolated npm pack or
// a stripped CI cache that does not include the intentions/ store).
describe.skipIf(!existsSync(intentionsDir))("committed intentions/ store", () => {
  // STRICT enumeration throughout. This suite is the only graph-integrity gate
  // that runs on ordinary PR CI (`validate-graph.ts` runs solely from the
  // graph-fast-path workflow, gated to intentions/-only graph/** pushes). Under
  // the tolerant `listNodes` a committed node file that is 0-byte, truncated,
  // carrying merge-conflict markers, or schema-invalid would be silently
  // dropped and CI would go green — and a corrupt tactic is typically
  // referenced by nothing (edges point upward via serves/parent), so no
  // dangling-edge error compensates.
  it("every committed node file reads and validates: listNodesStrict does not throw", () => {
    listNodesStrict(intentionsDir);
  });

  it("whole-graph integrity: validateGraph does not throw", () => {
    validateGraph(listNodesStrict(intentionsDir));
  });

  it("attention resolution: resolveAttention does not throw", () => {
    resolveAttention(listNodesStrict(intentionsDir));
  });
});
