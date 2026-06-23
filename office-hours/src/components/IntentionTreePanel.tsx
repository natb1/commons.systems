import { Badge } from "@commons-systems/ds";
import type { BadgeProps } from "@commons-systems/ds";
import type { IntentionTreeNode, IntentionTreeView } from "../intention-tree.js";
import type { Status } from "@commons-systems/intentionsutil";

/**
 * Renders the project's single intention hierarchy as a nested tree panel for
 * the office-hours dashboard (issue #2374). Mirrors the QueueMetricsPanel
 * structure and conventions.
 *
 * The view is build-time generated (no Firestore, no owner tier) and passed in
 * as a single prop. Frontier nodes are visually emphasised; each frontier node
 * carries a per-node execution overlay drawn from the trackers map (most
 * frontier nodes are untracked today — this is surfaced as a calm affordance,
 * not an error).
 */

export interface IntentionTreePanelProps {
  view: IntentionTreeView;
  className?: string;
}

const STATUS_VARIANT: Record<Status, BadgeProps["variant"]> = {
  codified: "success",
  delegated: "accent",
  refining: "neutral",
  raw: "neutral",
};

export function IntentionTreePanel(props: IntentionTreePanelProps) {
  const { view } = props;

  function renderNode(node: IntentionTreeNode) {
    const isFrontier = view.frontierIds.has(node.id);
    const liClass = [
      "intention-node",
      isFrontier ? "intention-node--frontier" : "",
    ]
      .filter(Boolean)
      .join(" ");

    let trackerEl: JSX.Element | null = null;
    if (isFrontier) {
      const tracker = view.trackers[node.id];
      if (tracker !== undefined) {
        const issueStateVariant: BadgeProps["variant"] =
          tracker.state === "open" ? "accent" : "success";
        const prChips =
          tracker.linked_prs.length > 0
            ? tracker.linked_prs.map((pr) => {
                const prVariant: BadgeProps["variant"] =
                  pr.state === "merged"
                    ? "success"
                    : pr.state === "open"
                      ? "accent"
                      : "neutral";
                return (
                  <span key={pr.number} className="intention-pr">
                    <Badge variant={prVariant}>
                      PR #{pr.number} {pr.state}
                    </Badge>
                  </span>
                );
              })
            : null;
        trackerEl = (
          <div className="intention-tracker">
            <Badge variant={issueStateVariant}>
              issue #{tracker.issue_number} {tracker.state}
            </Badge>
            {prChips}
          </div>
        );
      } else {
        trackerEl = (
          <div className="intention-tracker intention-tracker--untracked">
            not yet tracked
          </div>
        );
      }
    }

    return (
      <li key={node.id} className={liClass}>
        <div className="intention-node-row">
          <span className="intention-node-statement">{node.statement}</span>
          <span className="intention-node-badges">
            <Badge variant="neutral">{node.owner}</Badge>
            <Badge variant={STATUS_VARIANT[node.status]}>{node.status}</Badge>
            {isFrontier && <Badge variant="accent">frontier</Badge>}
          </span>
        </div>
        {trackerEl}
        {node.children.length > 0 && (
          <ul className="intention-node-list">
            {node.children.map(renderNode)}
          </ul>
        )}
      </li>
    );
  }

  const rootClass = ["intention-tree", props.className].filter(Boolean).join(" ");

  return (
    <section className={rootClass}>
      <h2 className="intention-tree-heading">INTENTION TREE</h2>
      {view.tree.length === 0 ? (
        <p className="empty">No intentions yet.</p>
      ) : (
        <ul className="intention-node-list">
          {view.tree.map(renderNode)}
        </ul>
      )}
    </section>
  );
}
