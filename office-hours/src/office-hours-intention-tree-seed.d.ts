declare module "virtual:office-hours-intention-tree-seed" {
  import type { Owner, Status } from "@commons-systems/intentionsutil";
  // Mutable (no readonly/Readonly wrappers) so the assignments in
  // intention-tree.ts type cleanly — getDemoIntentionTree passes `.nodes` to
  // buildTree(SlimIntentionNode[]), which rejects readonly sources.
  const seedIntentionTree: {
    nodes: Array<{
      id: string;
      statement: string;
      owner: Owner;
      status: Status;
      parent: string | null;
    }>;
    frontierIds: string[];
  };
  export default seedIntentionTree;
}
