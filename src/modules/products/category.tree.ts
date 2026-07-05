import Category from "./category.model";

// The taxonomy is capped at 3 levels: top (0) → sub (1) → sub-sub (2).
export const MAX_CATEGORY_DEPTH = 2;

/** Number of ancestors above a category (top-level = 0). null/undefined = 0. */
export async function getDepth(categoryId: string | null | undefined): Promise<number> {
  if (!categoryId) return 0;
  let depth = 0;
  const seen = new Set<string>([String(categoryId)]);
  let current = await Category.findById(categoryId).select("parent").lean();
  while (current?.parent) {
    const pid = String(current.parent);
    if (seen.has(pid)) break; // defend against a pre-existing cycle
    seen.add(pid);
    depth++;
    current = await Category.findById(pid).select("parent").lean();
  }
  return depth;
}

/** Height of a category's subtree — 0 for a leaf, 1 if it has children, etc. */
export async function getSubtreeHeight(categoryId: string): Promise<number> {
  const children = await Category.find({ parent: categoryId }).select("_id").lean();
  if (!children.length) return 0;
  let max = 0;
  for (const child of children) {
    max = Math.max(max, 1 + (await getSubtreeHeight(String(child._id))));
  }
  return max;
}

/**
 * True if re-parenting `nodeId` under `newParentId` would create a cycle —
 * i.e. the new parent is the node itself or one of its descendants.
 */
export async function wouldCreateCycle(nodeId: string, newParentId: string): Promise<boolean> {
  if (String(nodeId) === String(newParentId)) return true;
  let steps = 0;
  let current = await Category.findById(newParentId).select("parent").lean();
  while (current) {
    if (String(current._id) === String(nodeId)) return true;
    if (!current.parent) break;
    current = await Category.findById(current.parent).select("parent").lean();
    if (++steps > 20) break;
  }
  return false;
}
