"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiUploadLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiDraggable,
  RiFolderLine,
  RiFolderOpenLine,
  RiFolder2Line,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import axios from "axios";
import toast from "@/components/ui/toast";
import { normalizeImageUrl } from "@/utils/helpers";
import { useUpload } from "@/hooks/useUpload";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: { _id: string; name: string; slug: string } | string | null;
  isActive: boolean;
  sortOrder: number;
}

interface TreeNode {
  category: Category;
  children: TreeNode[];
  level: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  image: "",
  parent: "",
  isActive: true,
  sortOrder: 0,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getParentId(cat: Category): string | null {
  if (!cat.parent) return null;
  if (typeof cat.parent === "string") return cat.parent;
  return cat.parent._id;
}

function buildTree(categories: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // init nodes
  for (const cat of categories) {
    map.set(cat._id, { category: cat, children: [], level: 0 });
  }

  // link parent → children
  for (const cat of categories) {
    const node = map.get(cat._id)!;
    const pid = getParentId(cat);
    if (pid && map.has(pid)) {
      const parent = map.get(pid)!;
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // sort children by sortOrder
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.category.name.localeCompare(b.category.name));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      result.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Level colours / styles                                             */
/* ------------------------------------------------------------------ */

const levelStyles = [
  { bg: "bg-white", border: "border-neutral-200", accent: "text-neutral-900", icon: RiFolderOpenLine, iconColor: "text-amber-500" },
  { bg: "bg-[#FAFAF9]", border: "border-neutral-150", accent: "text-neutral-800", icon: RiFolderLine, iconColor: "text-blue-500" },
  { bg: "bg-[#F7F6F0]", border: "border-neutral-100", accent: "text-neutral-700", icon: RiFolder2Line, iconColor: "text-emerald-500" },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { upload, uploading } = useUpload({ target: "categories" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [addingToParent, setAddingToParent] = useState<string | null>(null);

  /* ---------- data ---------- */

  const fetchCategories = useCallback(() => {
    setLoading(true);
    axios
      .get<{ data: Category[] }>("/api/admin/categories")
      .then((r) => setCategories(r.data.data))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const tree = useMemo(() => buildTree(categories), [categories]);

  /* ---------- collapse / expand ---------- */

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => {
    const allIds = categories.filter((c) => !getParentId(c) || categories.some((ch) => getParentId(ch) === c._id)).map((c) => c._id);
    setCollapsed(new Set(allIds));
  };

  const expandAll = () => setCollapsed(new Set());

  /* ---------- form ---------- */

  const openCreate = (parentId?: string | null) => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, parent: parentId ?? "" });
    setAddingToParent(parentId ?? null);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      image: cat.image ?? "",
      parent: getParentId(cat) ?? "",
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setAddingToParent(null);
    setForm(EMPTY_FORM);
  };

  /* ---------- upload ---------- */

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const uploaded = await upload(file);
    if (uploaded) {
      setForm((f) => ({ ...f, image: uploaded.url }));
      toast.success("Image uploaded");
    }
  };

  /* ---------- submit ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    // Prevent deeper than 3 levels
    if (form.parent) {
      const parentCat = categories.find((c) => c._id === form.parent);
      if (parentCat) {
        const grandParentId = getParentId(parentCat);
        if (grandParentId) {
          const grandParent = categories.find((c) => c._id === grandParentId);
          if (grandParent && getParentId(grandParent)) {
            toast.error("Maximum 3 levels allowed");
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        image: form.image || undefined,
        parent: form.parent || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      if (editTarget) {
        await axios.patch(`/api/admin/categories/${editTarget._id}`, payload);
        toast.success("Category updated");
      } else {
        await axios.post("/api/admin/categories", payload);
        toast.success("Category created");
      }

      closeForm();
      fetchCategories();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to save";
      toast.error(msg ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- toggle active ---------- */

  const toggleActive = async (cat: Category) => {
    try {
      await axios.patch(`/api/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, isActive: !cat.isActive } : c)),
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  /* ---------- delete ---------- */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/categories/${deleteTarget._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      toast.success("Category deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to delete";
      toast.error(msg ?? "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- drag & drop ---------- */

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (targetId !== dragId) setDropTargetId(targetId);
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) {
      setDragId(null);
      return;
    }

    // Prevent dropping a parent into its own child
    const isDescendant = (parentId: string, childId: string): boolean => {
      const child = categories.find((c) => c._id === childId);
      if (!child) return false;
      const pid = getParentId(child);
      if (pid === parentId) return true;
      if (pid) return isDescendant(parentId, pid);
      return false;
    };

    if (isDescendant(sourceId, targetId)) {
      toast.error("Cannot move a category into its own subcategory");
      setDragId(null);
      return;
    }

    // Check level depth — target becomes parent, so target must be at level 0 or 1
    const targetCat = categories.find((c) => c._id === targetId);
    if (targetCat) {
      const targetParent = getParentId(targetCat);
      if (targetParent) {
        const targetGrandParent = categories.find((c) => c._id === targetParent);
        if (targetGrandParent && getParentId(targetGrandParent)) {
          toast.error("Maximum 3 levels — cannot nest deeper");
          setDragId(null);
          return;
        }
      }
    }

    // Also check if the dragged item has children → moving it under level 1 would exceed 3 levels
    const sourceHasChildren = categories.some((c) => getParentId(c) === sourceId);
    const sourceHasGrandchildren = sourceHasChildren && categories.some((c) => {
      const pid = getParentId(c);
      return pid && categories.some((p) => p._id === pid && getParentId(p) === sourceId);
    });

    if (targetCat) {
      const targetLevel = getParentId(targetCat) ? (categories.some((c) => c._id === getParentId(targetCat) && getParentId(c)) ? 2 : 1) : 0;
      if (sourceHasGrandchildren && targetLevel > 0) {
        toast.error("Cannot move — would exceed 3 levels");
        setDragId(null);
        return;
      }
      if (sourceHasChildren && targetLevel > 1) {
        toast.error("Cannot move — would exceed 3 levels");
        setDragId(null);
        return;
      }
    }

    try {
      // Move the dragged category to be a child of target
      await axios.patch(`/api/admin/categories/${sourceId}`, {
        parent: targetId,
        sortOrder: 0,
      });
      toast.success("Category moved");
      fetchCategories();
    } catch {
      toast.error("Failed to move category");
    } finally {
      setDragId(null);
    }
  };

  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId) return;

    const sourceCat = categories.find((c) => c._id === sourceId);
    if (!sourceCat || !getParentId(sourceCat)) {
      setDragId(null);
      return; // already root
    }

    try {
      await axios.patch(`/api/admin/categories/${sourceId}`, { parent: null });
      toast.success("Moved to root level");
      fetchCategories();
    } catch {
      toast.error("Failed to move category");
    } finally {
      setDragId(null);
    }
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropTargetId(null);
  };

  /* ---------- parent options for form ---------- */

  const parentOptions = useMemo(() => {
    // For the form: show categories that are at level 0 or level 1 (so result is at most level 2)
    const result: { id: string; name: string; level: number }[] = [];
    const flat = flattenTree(tree);
    for (const node of flat) {
      // Skip the category being edited + prevent self-reference
      if (editTarget && node.category._id === editTarget._id) continue;
      // Only allow up to level 1 as parent (so child will be at level 2 max)
      if (node.level <= 1) {
        result.push({ id: node.category._id, name: node.category.name, level: node.level });
      }
    }
    return result;
  }, [tree, editTarget]);

  /* ---------- stats ---------- */

  const rootCount = tree.length;
  const subCount = categories.filter((c) => {
    const pid = getParentId(c);
    return pid && !categories.some((p) => p._id === pid && getParentId(p));
  }).length;
  const leafCount = categories.length - rootCount - subCount;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {categories.length} total &middot; {rootCount} root &middot; {subCount} sub &middot; {leafCount} leaf
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button leftIcon={<RiAddLine />} onClick={() => openCreate()}>
            Add Category
          </Button>
        </div>
      </div>

      {/* Drag hint */}
      <p className="text-xs text-neutral-400 mb-3">
        Drag &amp; drop categories to reorganise. Drop on a category to nest it inside.
      </p>

      {/* Tree */}
      <div
        className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault();
          setDropTargetId("__root__");
        }}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={handleDropOnRoot}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5" rounded="md" />
                <Skeleton className="w-8 h-8" rounded="lg" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <RiFolderOpenLine size={40} className="text-neutral-200 mb-3 mx-auto" />
            <p className="text-neutral-400 text-sm">No categories yet. Add one to get started.</p>
          </div>
        ) : (
          <div className={`divide-y divide-neutral-50 ${dropTargetId === "__root__" && dragId ? "ring-2 ring-inset ring-blue-200" : ""}`}>
            {tree.map((node) => (
              <TreeRow
                key={node.category._id}
                node={node}
                collapsed={collapsed}
                toggleCollapse={toggleCollapse}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onToggleActive={toggleActive}
                onAdd={openCreate}
                dragId={dragId}
                dropTargetId={dropTargetId}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== Create / Edit Modal ===== */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? `Edit: ${editTarget.name}` : addingToParent ? "New Subcategory" : "New Category"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Fresh Vegetables"
              required
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Parent Category
              </label>
              <select
                value={form.parent}
                onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white"
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.level === 0 ? "" : "  └ "}
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short category description..."
          />

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Image
            </label>
            {form.image ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                  <Image
                    src={normalizeImageUrl(form.image)}
                    alt="Category"
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image: "" }))}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label
                className={`flex items-center gap-3 w-fit px-4 py-2.5 border border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-[#E84672] transition-colors text-sm text-neutral-400 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <RiUploadLine size={16} />
                {uploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <Input
              label="Sort Order"
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
            <div className="flex items-center gap-2 pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded accent-[#E84672]"
                />
                <span className="text-sm text-neutral-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-neutral-100">
            <Button type="submit" isLoading={saving} leftIcon={<RiCheckLine />}>
              {editTarget ? "Save Changes" : "Create Category"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Delete Confirm Modal ===== */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-800">{deleteTarget?.name}</span>? This
            action cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <Button variant="danger" onClick={handleDelete} isLoading={deleting} leftIcon={<RiDeleteBinLine />}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree Row (recursive)                                               */
/* ------------------------------------------------------------------ */

function TreeRow({
  node,
  collapsed,
  toggleCollapse,
  onEdit,
  onDelete,
  onToggleActive,
  onAdd,
  dragId,
  dropTargetId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  node: TreeNode;
  collapsed: Set<string>;
  toggleCollapse: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggleActive: (cat: Category) => void;
  onAdd: (parentId: string) => void;
  dragId: string | null;
  dropTargetId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
}) {
  const { category: cat, children, level } = node;
  const hasChildren = children.length > 0;
  const isCollapsed = collapsed.has(cat._id);
  const isBeingDragged = dragId === cat._id;
  const isDropTarget = dropTargetId === cat._id;
  const style = levelStyles[Math.min(level, 2)];
  const IconComp = style.icon;
  const canAddChild = level < 2; // max 3 levels (0, 1, 2)

  return (
    <div>
      {/* Row */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, cat._id)}
        onDragOver={(e) => onDragOver(e, cat._id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, cat._id)}
        onDragEnd={onDragEnd}
        className={`
          flex items-center gap-3 px-4 py-3 transition-all group cursor-default select-none
          ${style.bg}
          ${isBeingDragged ? "opacity-40" : ""}
          ${isDropTarget ? "ring-2 ring-inset ring-blue-400 bg-blue-50/50" : ""}
          hover:bg-[#F7F6F0]
        `}
        style={{ paddingLeft: `${16 + level * 32}px` }}
      >
        {/* Drag handle */}
        <span className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 shrink-0">
          <RiDraggable size={16} />
        </span>

        {/* Collapse toggle */}
        <button
          onClick={() => hasChildren && toggleCollapse(cat._id)}
          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${hasChildren ? "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200" : "text-transparent"}`}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isCollapsed ? <RiArrowRightSLine size={16} /> : <RiArrowDownSLine size={16} />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          )}
        </button>

        {/* Icon / Image */}
        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white border border-neutral-100">
          {cat.image ? (
            <Image src={normalizeImageUrl(cat.image)} alt={cat.name} width={32} height={32} className="object-cover w-full h-full" />
          ) : (
            <IconComp size={16} className={style.iconColor} />
          )}
        </div>

        {/* Name & slug */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${style.accent} truncate`}>{cat.name}</p>
          <p className="text-[11px] text-neutral-400 font-mono truncate">{cat.slug}</p>
        </div>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full shrink-0">
            {children.length} sub
          </span>
        )}

        {/* Status badge */}
        <button onClick={() => onToggleActive(cat)} className="shrink-0">
          <Badge variant={cat.isActive ? "success" : "neutral"} dot>
            {cat.isActive ? "Active" : "Inactive"}
          </Badge>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {canAddChild && (
            <button
              onClick={() => onAdd(cat._id)}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-neutral-400 hover:text-emerald-600 transition-colors"
              title="Add subcategory"
            >
              <RiAddLine size={15} />
            </button>
          )}
          <button
            onClick={() => onEdit(cat)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <RiEditLine size={15} />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <RiDeleteBinLine size={15} />
          </button>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && !isCollapsed && (
          <motion.div
            key={`children-${cat._id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TreeRow
                key={child.category._id}
                node={child}
                collapsed={collapsed}
                toggleCollapse={toggleCollapse}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                onAdd={onAdd}
                dragId={dragId}
                dropTargetId={dropTargetId}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
