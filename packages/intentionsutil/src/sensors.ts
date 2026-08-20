import type { IntentionNode } from "./schema.js";
import { IntentionSchemaError } from "./errors.js";

// --- Sensor registry -------------------------------------------------------

/**
 * A sensor reads the current measured value of a node's `success_signal`
 * observable and returns it as a string — the value that populates the node's
 * `reading` field. Synchronous by contract: a sensor's `read` does whatever IO
 * it needs internally (Unit 6's local-first sensors), but exposes a pure
 * string-returning surface so the feedback helpers stay testable.
 */
export interface Sensor {
  name: string;
  read(node: IntentionNode): string;
}

/**
 * A name-keyed registry of sensors. Resolution is PER NODE: a node names its
 * sensor via `success_signal.sensor`, and a caller resolves that name here.
 *
 * This registry is deliberately empty on construction — it hardcodes no global
 * default sensor set. Unit 6 (the read-sensors driver) is what registers the
 * concrete local-first sensors; this core only provides the lookup mechanism.
 */
export class SensorRegistry {
  private readonly sensors = new Map<string, Sensor>();

  /** Register a sensor under its `name`. A later registration overwrites. */
  register(sensor: Sensor): void {
    this.sensors.set(sensor.name, sensor);
  }

  /**
   * The set of names under which sensors are currently registered — a read-only
   * snapshot; mutating it does not touch the registry. Lets a sensor that must
   * know the registry's membership (the intention-store sensor) derive it from
   * the registry itself rather than duplicating the registered-name list by hand.
   */
  names(): ReadonlySet<string> {
    return new Set(this.sensors.keys());
  }

  /**
   * Resolve a sensor by name. Throws `IntentionSchemaError` naming the missing
   * sensor (and the registered names) on an unregistered name — no silent skip,
   * no fallback (per `.claude/rules/code-style.md`: clear errors over fallbacks).
   */
  resolve(name: string): Sensor {
    const sensor = this.sensors.get(name);
    if (sensor === undefined) {
      const registered = [...this.sensors.keys()].sort();
      const known = registered.length === 0 ? "(none registered)" : registered.join(", ");
      throw new IntentionSchemaError(
        `No sensor registered under name "${name}". Registered sensors: ${known}.`
      );
    }
    return sensor;
  }
}

/**
 * Resolve a node's named sensor and read it. Convenience for callers (Unit 6's
 * driver) that have a registry and want the node's current measurement.
 *
 * Throws `IntentionSchemaError` if the node has no `success_signal` (there is no
 * sensor name to resolve), and propagates `resolve`'s throw for an unregistered
 * sensor name.
 */
export function readNodeSignal(node: IntentionNode, registry: SensorRegistry): string {
  if (node.success_signal === null) {
    throw new IntentionSchemaError(
      `Node "${node.id}" has no success_signal, so it names no sensor to read.`
    );
  }
  return registry.resolve(node.success_signal.sensor).read(node);
}

/**
 * One registered sensor name that no node records verbatim, plus the nodes the
 * orphan is plausibly attributable to.
 *
 * `candidateNodeIds` is a NODE-SCOPED attribution, not a proof: the nodes whose
 * own recorded sensor is a reword of `name` (one string is a case-insensitive
 * prefix of the other, which is the shape of the 2026-08-12 drift — an /align
 * round appending a clause to the recorded sensor). It is empty when the orphan
 * is attributable to no node at all — a registered constant nobody ever bound,
 * which is a defect in the REGISTRY rather than in any node, and so says
 * nothing about whatever write is in flight.
 */
export interface UnboundSensorName {
  name: string;
  candidateNodeIds: string[];
}

/**
 * The nodes whose recorded sensor looks like a reworded copy of `name`.
 *
 * A node already recording some OTHER registered name verbatim is bound to that
 * sensor and is not a candidate. Prefix (not substring) matching keeps this
 * selective: it matches the append/trim reword shape and little else.
 */
function rewordCandidates(
  name: string,
  nodes: IntentionNode[],
  registeredNames: ReadonlySet<string>
): string[] {
  const key = name.trim().toLowerCase();
  if (key === "") {
    return [];
  }
  return nodes
    .filter((node) => {
      const sensor = node.success_signal?.sensor;
      if (sensor === undefined || registeredNames.has(sensor)) {
        return false;
      }
      const recorded = sensor.trim().toLowerCase();
      if (recorded === "") {
        return false;
      }
      return recorded.startsWith(key) || key.startsWith(recorded);
    })
    .map((node) => node.id)
    .sort();
}

/**
 * Find every registered sensor name that is NOT still recorded, character for
 * character, as some node's `success_signal.sensor`.
 *
 * `resolve` above matches by exact string, so a node whose sensor prose is
 * reworded — an /align round appending a clause, say — silently de-registers
 * its sensor: the node's new prose resolves to nothing, and the registered name
 * measures nothing. Nothing else on the graph write path notices, so this is
 * the check that does.
 *
 * Forward direction ONLY. A registered name must have a node; a node's sensor
 * name need NOT be registered — most recorded sensors in the store are
 * deliberately unimplemented prose, and asserting the reverse would fail on all
 * of them.
 *
 * `unboundNames` declares the registered names that name no node — generic
 * adapters (`vitest`, `git`) any node may adopt but none currently does. Add a
 * name there only when the sensor is genuinely node-agnostic; a node-bound
 * sensor that lands there stops being guarded.
 *
 * Returns a DIAGNOSTIC, sorted by name, and throws nothing — the caller picks
 * the severity. That split exists because the severity is not the same in every
 * context: an unbound registered name is a defect in the registry, which the CI
 * of the change that registered it must fail on
 * (`validateRegisteredSensorNames` below), but which must NOT deny an unrelated
 * writer the graph write path (`scripts/validate-graph.ts`, which reports it).
 */
export function findUnboundRegisteredSensorNames(
  nodes: IntentionNode[],
  registeredNames: Iterable<string>,
  unboundNames: Iterable<string> = []
): UnboundSensorName[] {
  const registered = new Set(registeredNames);
  const recorded = new Set(
    nodes
      .map((node) => node.success_signal?.sensor)
      .filter((sensor): sensor is string => sensor !== undefined)
  );
  const unbound = new Set(unboundNames);
  return [...registered]
    .filter((name) => !unbound.has(name) && !recorded.has(name))
    .sort()
    .map((name) => ({
      name,
      candidateNodeIds: rewordCandidates(name, nodes, registered),
    }));
}

/**
 * Render `findUnboundRegisteredSensorNames`'s diagnostic as an operator-facing
 * message, so the fatal and the reporting call sites say the same thing.
 */
export function formatUnboundSensorNames(unbound: UnboundSensorName[]): string {
  const list = unbound
    .map(({ name, candidateNodeIds }) => {
      const attribution =
        candidateNodeIds.length === 0
          ? " — attributable to no node; the registered constant was never bound"
          : ` — possibly reworded on: ${candidateNodeIds.join(", ")}`;
      return `  - "${name}"${attribution}`;
    })
    .join("\n");
  return (
    `Registered sensor name(s) not recorded by any node's success_signal.sensor:\n${list}\n` +
    `A sensor resolves by exact string match, so a reworded node sensor de-registers it ` +
    `and the reading goes silent. Re-sync the node prose and the registered constant in the ` +
    `same change, or declare the name unbound if no node is meant to name it.`
  );
}

/**
 * Assert that every registered sensor name is still recorded verbatim by some
 * node — `findUnboundRegisteredSensorNames` at fatal severity.
 *
 * Throws `IntentionSchemaError` naming every orphaned registration.
 *
 * Use this where the CHANGE that can orphan a name is in scope: the unit suite
 * runs it against the live store (`test/lifecycle-sensor.test.ts`), so a PR
 * touching `packages/intentionsutil` — the home of both the registered
 * constants and this rule — fails on its own branch. Do NOT use it on the graph
 * write path, which must not be denied over a defect in the registry: see
 * `findUnboundRegisteredSensorNames`.
 */
export function validateRegisteredSensorNames(
  nodes: IntentionNode[],
  registeredNames: Iterable<string>,
  unboundNames: Iterable<string> = []
): void {
  const orphaned = findUnboundRegisteredSensorNames(nodes, registeredNames, unboundNames);
  if (orphaned.length > 0) {
    throw new IntentionSchemaError(formatUnboundSensorNames(orphaned));
  }
}

// --- Mechanical gap derivation ---------------------------------------------

/**
 * Derive the mechanical gap for a node from its `reading` vs its
 * `success_signal.threshold`.
 *
 * NOTE: nuanced gap judgment — does this reading *really* satisfy the intent? —
 * is the assessor's job. This is only the simple, total mechanical rule used by
 * the deterministic feedback-effect predicates below. The total rule:
 *
 *  - `success_signal == null` → `null`. No signal means no threshold to derive a
 *    gap against.
 *  - `reading == null` → a gap string noting the reading is missing. An
 *    uninstrumented/unread signal IS a known shortfall: we do not yet know the
 *    threshold is met.
 *  - else → `null` IFF the trimmed, case-insensitive reading equals the trimmed,
 *    case-insensitive threshold; otherwise a gap string. Equality is the only
 *    "met" condition — no numeric or fuzzy parsing.
 */
export function deriveGap(node: IntentionNode): string | null {
  const signal = node.success_signal;
  if (signal === null) {
    return null;
  }
  if (node.reading === null) {
    return `no reading yet (threshold: ${signal.threshold})`;
  }
  const reading = node.reading.trim().toLowerCase();
  const threshold = signal.threshold.trim().toLowerCase();
  if (reading === threshold) {
    return null;
  }
  return `reading "${node.reading}" does not meet threshold "${signal.threshold}"`;
}

// --- Feedback-effect helpers (effects #2–#5) -------------------------------
// Effect #1 (re-prioritize by gap) is realized by goals.ts::projectGoals — see
// .claude/docs/signal-identification.md. It is not reimplemented here.

/**
 * A measured reading for a node, produced by a sensor. Used as input to the
 * effects that act on fresh readings (#4 surface candidates, #5 confirm
 * push-downs).
 */
export interface Reading {
  node_id: string;
  reading: string;
}

/**
 * A QUARANTINED candidate intention surfaced by effect #4. It is structurally
 * NOT an `IntentionNode` — it carries no `id`/`owner`/`status` node-core — so it
 * cannot be passed to `writeNode`/`validateNode` as a node. The practitioner
 * must RATIFY a candidate (turn it into a real node) before it enters the store;
 * the loop never auto-writes live nodes (an acceptance criterion of #2371).
 */
export interface IntentionCandidate {
  statement: string;
  provenance: string;
  source_node_id: string | null;
}

/**
 * Effect #2 — falsify proxy goals. Returns the proxy nodes whose reading
 * contradicts intent.
 *
 * Mechanical rule: a node with `success_signal.is_proxy === true` that has a
 * non-null `reading` (it was actually measured) AND a non-null `deriveGap`
 * (it still falls short of threshold). This flags proxies with a measured
 * reading that does not meet threshold; a proxy whose reading meets threshold
 * has a null `deriveGap` and is NOT flagged. The converse case — a proxy that
 * reads "met" yet the intention is plainly not met — is not mechanically
 * detectable here. A proxy not yet read (reading null) is also NOT flagged —
 * there is nothing to contradict yet, even though `deriveGap` returns a "no
 * reading yet" string. The gap is computed via `deriveGap` — there is no
 * stored `node.gap` field to read — so the predicate is self-contained and
 * total.
 */
export function findFalsifiedProxies(nodes: IntentionNode[]): IntentionNode[] {
  return nodes.filter(
    (node) =>
      node.success_signal?.is_proxy === true &&
      node.reading !== null &&
      deriveGap(node) !== null
  );
}

/**
 * Effect #3 — detect codification drift. Returns the `status: "codified"` nodes
 * whose signal now fails its threshold (`deriveGap(node) !== null`).
 *
 * A codified node with `success_signal == null` has `deriveGap === null` and is
 * NOT flagged — there is nothing to drift against. Note the deliberate
 * asymmetry with effect #2: this rule has NO `reading !== null` guard, so a
 * codified node carrying a signal but no reading yet (uninstrumented/unread) is
 * flagged as drift — under this mechanical rule, an unread codified signal is a
 * shortfall, surfaced for review.
 */
export function findCodificationDrift(nodes: IntentionNode[]): IntentionNode[] {
  return nodes.filter((node) => node.status === "codified" && deriveGap(node) !== null);
}

/**
 * Effect #4 — surface new intention candidates. Pure, no IO, takes no directory.
 *
 * Trigger rule: a reading whose `node_id` has NO matching node in `nodes`
 * reveals an unaddressed need — a signal pointing at a gap no node yet covers —
 * so it is surfaced as a quarantined candidate carrying provenance (the reading
 * text and its orphan node_id). A reading that matches an existing node yields
 * no candidate.
 *
 * This NEVER writes nodes; it returns `IntentionCandidate` records the
 * practitioner must ratify first.
 */
export function surfaceCandidates(
  nodes: IntentionNode[],
  readings: Reading[]
): IntentionCandidate[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  return readings
    .filter((r) => !nodeIds.has(r.node_id))
    .map((r) => ({
      statement: `unaddressed need surfaced by reading: ${r.reading}`,
      provenance: `reading "${r.reading}" for unmatched node_id "${r.node_id}"`,
      source_node_id: r.node_id,
    }));
}

/**
 * Effect #5 — confirm push-downs (author-use gate). Returns the pushed-down
 * nodes a fresh author-use reading confirms.
 *
 * A pushed-down node = `owner` is `"procedure"` or `"ai"` AND `status` is
 * `"delegated"` or `"codified"`. It is CONFIRMED only when an author-use reading
 * shows the artifact is used and holding: there is a matching `readings` entry
 * for the node's id with a non-null reading, AND `deriveGap` of the node
 * evaluated against THAT author-use reading is null (used and holding). Until
 * such a reading exists, the push-down stays provisional and is not returned.
 *
 * The gap is evaluated against the author-use reading — not the node's stored
 * `reading` — by deriving over a shallow copy with `reading` set to the readings
 * entry, keeping the function pure.
 */
export function confirmPushDowns(nodes: IntentionNode[], readings: Reading[]): IntentionNode[] {
  const readingByNodeId = new Map(readings.map((r) => [r.node_id, r.reading]));
  return nodes.filter((node) => {
    const isPushedDown =
      (node.owner === "procedure" || node.owner === "ai") &&
      (node.status === "delegated" || node.status === "codified");
    if (!isPushedDown) {
      return false;
    }
    const authorUseReading = readingByNodeId.get(node.id);
    if (authorUseReading === undefined) {
      return false;
    }
    return deriveGap({ ...node, reading: authorUseReading }) === null;
  });
}
