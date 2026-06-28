declare module "virtual:office-hours-intention-tree-seed" {
  import type { Owner, Status, ExecutionTracker } from "@commons-systems/intentionsutil";
  // Mutable (no readonly/Readonly wrappers) so the assignments in
  // intention-tree.ts type cleanly — getDemoIntentionTree passes `.nodes` to
  // buildTree(SlimIntentionNode[]) and assigns `.trackers` to a
  // Record<string, ExecutionTracker>, both of which reject readonly sources.
  const seedIntentionTree: {
    nodes: Array<{
      id: string;
      statement: string;
      owner: Owner;
      status: Status;
      parent: string | null;
    }>;
    frontierIds: string[];
    trackers: Record<string, ExecutionTracker>;
  };
  export default seedIntentionTree;
}
