// Browser-safe entry (`@commons-systems/intentionsutil/graph`): re-exports
// only the fs-free modules — schema, attention, goals, errors — so browser
// consumers (e.g. the office-hours graph read layer) can validate nodes,
// resolve attention, and project goals without pulling in `store.js`'s
// `node:fs` dependency. The root barrel (`index.ts`) additionally exports the
// Node-only store, rungs, and sensors modules and stays host-side. Precedent:
// the React-free `.ts` subpath added for non-JSX consumers of
// `@commons-systems/ds`.

export {
  validateNode,
  validateGraph,
  OWNERS,
  STATUSES,
  TOOLING_KINDS,
  PHASES,
  SUPERSEDED_STATUS,
  isSuperseded,
  isRetired,
} from "./schema.js";
export type {
  IntentionNode,
  IntentionNodeInput,
  Owner,
  Status,
  SuccessSignal,
  Clarification,
  ToolingGoal,
  ToolingKind,
  Attention,
  Phase,
  Execution,
  OfficeHours,
  Rounds,
} from "./schema.js";
export { resolveAttention, compareRankKeyDesc } from "./attention.js";
export type { ResolvedAttention, RankKey } from "./attention.js";
export { IntentionSchemaError } from "./errors.js";
export {
  projectGoals,
  activeFrontier,
  realizationForOwner,
  renderFrontier,
} from "./goals.js";
export type { Goal, Realization } from "./goals.js";
