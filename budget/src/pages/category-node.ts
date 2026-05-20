/** A node in the spending/credits category tree: a category and its rolled-up totals. */
export interface CategoryNode {
  name: string;
  fullPath: string;
  value: number;
  count: number;
  children: CategoryNode[];
}
