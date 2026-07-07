/*
 * dispatch-graph-tick.js — the graph lane's workflow-native tick executor
 * (tactic-graph-router-selector, unit 4; strategy clarifications 24–25).
 *
 * WHAT THIS IS
 * ------------
 * A THIN Workflow-tool script: it holds no selection, transition, or
 * provisioning logic of its own. Selection ran in dispatch-select-tick (the
 * graph selector, under the one lock); provisioning is the owned
 * `provision-node-worktree <node-id>` primitive the launched agent invokes as
 * one command; transition writes (`graph-commit`) belong to the completing
 * phase / tactic-graph-router-transitions. This script only fans out one
 * `agent()` per selected node — capped by the pace-derived worker target —
 * with the model/effort options the tick resolved from the persisted phase
 * (dispatch-phase-model / dispatch-phase-effort; no SKILL→PHASE case map to
 * fall through, so the legacy /qa-main-inherits-Opus routing hole cannot
 * reproduce here).
 *
 * Tick granularity (strategy clarification 24): the workflow executes only
 * the currently-eligible phases it was handed and exits; the transition write
 * schedules the next phase next tick; CI waits happen between ticks. Workflow
 * resume is same-session only, so a dead tick recovers by the next tick's
 * re-selection from origin/main — no journal dependency.
 *
 * args IN (built by dispatch-graph-execute):
 *   { selections: [{ node_id, kind: "strategy"|"tactic", phase, skill,
 *       model?: string, effort?: string }],
 *     project_root: string,
 *     worker_cap?: number }   // default 8 — parity with the legacy router's
 *                             // max_concurrent_workers (dispatch.config/
 *                             // target-workers.json); the tick normally passes
 *                             // the pace-derived target, so the default only
 *                             // binds a direct/uncapped invocation
 *
 * return OUT:
 *   { results: [{ node_id, disposition, detail }], launched, capped }
 *
 * Per-node dispositions the agent reports:
 *   completed                    the phase skill ran to its own disposition.
 *   ci-waiting                   provision exit 10 — retry next tick.
 *   conflict-routed              provision exit 11 routed into /fix-conflicts.
 *   skipped                      provision exit 12 (stale-selection) — the
 *                                directive changed after selection; the claim
 *                                clears and the next tick re-selects from
 *                                current state. (tactic-worker-start-revalidation)
 *   scope-stale                  provision exit 13 — the tactic's scope changed
 *                                after the previous phase; the node was demoted
 *                                to `implement` and re-selects there next tick.
 *   parked                       a mechanical failure parked the node via
 *                                park-node (the office_hours graph write —
 *                                never an office-hours label); the park reason
 *                                carries a labelled `Next steps:` best-next-
 *                                steps recommendation (folded into reason until
 *                                office_hours.recommendation lands in schema —
 *                                never a reason-only park).
 *   skill-node-target-unsupported  the phase skill exited at its Step 0 on a
 *                                node target (pre tactic-phase-skill-node-targets;
 *                                the bootstrap-transition doctrine covers the
 *                                interim).
 *   failed                       anything else, with detail.
 */

export const meta = {
  name: 'dispatch-graph-tick',
  description:
    'Graph-lane tick executor (tactic-graph-router-selector): thin fan-out of one agent() per selected node, model/effort pre-resolved from the persisted phase; provisioning via the provision-node-worktree primitive; mechanical failures park via the office_hours graph write.',
  phases: [{ title: 'execute' }],
};

// --- schema -------------------------------------------------------------------

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['node_id', 'disposition', 'detail'],
  properties: {
    node_id: { type: 'string' },
    disposition: {
      enum: [
        'completed',
        'ci-waiting',
        'conflict-routed',
        'skipped',
        'scope-stale',
        'parked',
        'skill-node-target-unsupported',
        'failed',
      ],
    },
    detail: { type: 'string' },
  },
};

// --- prompt --------------------------------------------------------------------

function nodePrompt(sel, projectRoot) {
  const wt = `${projectRoot}/.claude/worktrees/${sel.node_id}`;
  return [
    `You are one graph-lane dispatch worker executing node \`${sel.node_id}\` (kind: ${sel.kind}, phase: ${sel.phase}).`,
    '',
    'Steps, in order:',
    '',
    `1. Provision the node worktree with ONE command (never hand-roll provisioning):`,
    '',
    `   ${projectRoot}/.claude/skills/dispatch-propagate/scripts/provision-node-worktree ${sel.node_id} ${sel.phase}`,
    '',
    '   (run with dangerouslyDisableSandbox: true — it uses git, gh, and direnv).',
    '   Route on its exit code:',
    `   - 0: the worktree is ready at ${wt}. Continue to step 2.`,
    '   - 10 (ci-waiting): report disposition `ci-waiting` and stop — the next tick re-selects once the CI verdict lands.',
    sel.kind === 'tactic'
      ? '   - 11 (merge-conflict): work from the existing worktree and INVOKE `/fix-conflicts` for this node instead of the phase skill below, then report disposition `conflict-routed`. If /fix-conflicts cannot be invoked for this target, park instead (step 3).'
      : '   - 11 (merge-conflict): park (step 3) — a strategy session has no conflict-resolution phase.',
    '   - 12 (stale-selection): report disposition `skipped` and stop — the claim clears and the next tick re-selects from current state. Make NO graph write; the directive already changed.',
    `   - 13 (scope-stale): run \`${projectRoot}/packages/intentionsutil/scripts/demote-node-to-implement ${sel.node_id}\` (tactic-graph-router-transitions Unit 1's owned primitive — until it lands, the bootstrap-transition doctrine covers the demotion write), then report disposition \`scope-stale\` and stop — the next tick re-selects the node at \`implement\` against the updated scope.`,
    '   - any other non-zero: park (step 3) with the error output as the reason, plus the next-steps recommendation step 3 requires.',
    '',
    `2. Work ONLY inside ${wt} (use absolute paths or git -C). INVOKE ${sel.skill} ${sel.node_id} and carry it to its own disposition. If the skill exits at its Step 0 because it does not accept node targets yet (pre tactic-phase-skill-node-targets), report disposition \`skill-node-target-unsupported\` — the bootstrap-transition doctrine covers the interim; do NOT emulate the phase ad hoc.`,
    '',
    '3. Parking (mechanical failures only — provision-failed, an unroutable merge conflict, wrong-worktree): park via the office_hours graph write, never an office-hours label. Every park MUST carry recoverable context — a short reason AND a best-next-steps recommendation (what a human should do to unblock this node). `office_hours.recommendation` is not yet a schema field, so fold the recommendation into the reason as a labelled trailing `Next steps: <...>` sentence — never a reason-only park (session attach/resume is not a recovery path, so this text is the node\'s only recoverable context):',
    '',
    `   ${projectRoot}/packages/intentionsutil/scripts/park-node ${sel.node_id} "<short reason>. Next steps: <best-next-steps recommendation>"`,
    '',
    '   then report disposition `parked`.',
    '',
    'Never push to main directly; never edit intentions/*.md by hand (park-node and graph-commit own graph writes). Report exactly one result object.',
  ].join('\n');
}

// --- pipeline -------------------------------------------------------------------

// Concurrent worker cap: configurable per invocation via args.worker_cap;
// defaults to 8 for parity with the legacy router's max_concurrent_workers
// (dispatch.config/target-workers.json). Never uncapped.
const DEFAULT_WORKER_CAP = 8;

const _a = typeof args === 'string' ? JSON.parse(args) : (args || {});
const selections = Array.isArray(_a.selections) ? _a.selections : [];
const projectRoot = _a.project_root || '';
const cap =
  typeof _a.worker_cap === 'number' && _a.worker_cap >= 0 ? _a.worker_cap : DEFAULT_WORKER_CAP;

phase('execute');
const capped = selections.length > cap;
const toRun = selections.slice(0, cap);
log(
  `dispatch-graph-tick: ${toRun.length} node(s) to execute` +
    (capped ? ` (${selections.length - toRun.length} dropped at the worker cap)` : '')
);

const results = await parallel(
  toRun.map((sel) => async () => {
    const options = {
      agentType: 'general-purpose',
      schema: RESULT_SCHEMA,
      label: `node:${sel.node_id}`,
      phase: 'execute',
    };
    // Model/effort were resolved by the tick from the persisted phase
    // (fail-closed demotable allowlist in dispatch-phase-model). Empty means
    // "inherit the session default" — omit the option entirely.
    if (sel.model) options.model = sel.model;
    if (sel.effort) options.effort = sel.effort;
    const res = await agent(nodePrompt(sel, projectRoot), options);
    if (!res) {
      return { node_id: sel.node_id, disposition: 'failed', detail: 'agent returned no result' };
    }
    return res;
  })
);

return {
  results,
  launched: toRun.length,
  capped,
};
