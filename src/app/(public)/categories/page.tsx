import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  RiHomeLine,
  RiArrowRightLine,
  RiFolderLine,
} from "react-icons/ri";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import { normalizeImageUrl } from "@/utils/helpers";

export const metadata: Metadata = {
  title: "All Categories — LotusMart",
  description:
    "Browse every category, subcategory, and sub-subcategory on LotusMart in one place.",
  alternates: {
    canonical: "https://lotusmart.in/categories",
  },
};

interface CategoryLite {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parent: string | null;
  sortOrder: number;
}

interface CategoryNode extends CategoryLite {
  children: CategoryNode[];
}

const FALLBACK_IMAGE = "/images/categories/nuts-seeds.jpg";

async function loadCategories(): Promise<CategoryNode[]> {
  try {
    await connectDB();
    const docs = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("_id name slug image description parent sortOrder")
      .lean();

    const rows: CategoryLite[] = (docs as unknown as CategoryLite[]).map(
      (c) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        image: c.image,
        description: c.description,
        parent: c.parent ? String(c.parent) : null,
        sortOrder: c.sortOrder ?? 0,
      }),
    );

    const byId = new Map<string, CategoryNode>();
    rows.forEach((r) => byId.set(r._id, { ...r, children: [] }));

    const roots: CategoryNode[] = [];
    byId.forEach((node) => {
      if (node.parent && byId.has(node.parent)) {
        byId.get(node.parent)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortByOrder = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      nodes.forEach((n) => sortByOrder(n.children));
    };
    sortByOrder(roots);

    return roots;
  } catch {
    return [];
  }
}

function countLeaves(node: CategoryNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((acc, c) => acc + countLeaves(c), 0);
}

function NestedList({
  nodes,
  depth,
}: {
  nodes: CategoryNode[];
  depth: number;
}) {
  if (nodes.length === 0) return null;

  if (depth === 0) {
    return null;
  }

  return (
    <ul
      className="space-y-1"
      style={{
        paddingLeft: depth === 1 ? 0 : `${Math.min(depth - 1, 3) * 0.9}rem`,
        borderLeft: depth > 1 ? "1px solid #EBE8D8" : "none",
        marginLeft: depth > 1 ? "0.2rem" : 0,
      }}
    >
      {nodes.map((child) => (
        <li key={child._id} className="py-0.5">
          <Link
            href={`/categories/${child.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.8rem] font-semibold text-neutral-600 transition-colors hover:bg-[#FFF1F3] hover:text-[#E84672]"
          >
            <RiFolderLine
              size={11}
              className="text-neutral-300 group-hover:text-[#E84672]"
            />
            {child.name}
            {child.children.length > 0 && (
              <span className="text-[0.65rem] font-bold text-neutral-300">
                ({child.children.length})
              </span>
            )}
          </Link>
          {child.children.length > 0 && (
            <div className="mt-1">
              <NestedList nodes={child.children} depth={depth + 1} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function CategoriesPage() {
  const tree = await loadCategories();

  const totalTop = tree.length;
  const totalAll = tree.reduce((acc, n) => acc + countLeaves(n), 0);

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      <div
        className="w-full py-12 md:py-16"
        style={{
          background:
            "linear-gradient(135deg, #FFF8F0 0%, #FDEEF2 50%, #E8EDDD 100%)",
          borderBottom: "1px solid #EBE8D8",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <nav
            className="flex items-center gap-2 text-[0.78rem] font-medium mb-8"
            style={{ color: "#B8AE86" }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-[#E84672] transition-colors"
            >
              <RiHomeLine size={13} />
              Home
            </Link>
            <span>/</span>
            <span style={{ color: "#78716c" }}>Categories</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Shop by Category
            </span>
          </div>
          <h1 className="text-[clamp(1.75rem,3.5vw,2.6rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900 mb-3">
            Explore every collection
          </h1>
          <p
            className="max-w-2xl text-[0.88rem] leading-relaxed font-medium"
            style={{ color: "#a8a29e" }}
          >
            {totalTop > 0
              ? `${totalTop} top collection${totalTop === 1 ? "" : "s"} · ${totalAll} subcategor${totalAll === 1 ? "y" : "ies"} — click any to browse its products.`
              : "Categories will appear here once an admin adds them."}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        {tree.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 border border-neutral-100 text-center">
            <RiFolderLine size={36} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-500">
              No categories yet. An admin can add them in the admin panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tree.map((top) => (
              <div
                key={top._id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white transition-shadow hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                style={{ border: "1px solid #EBE8D8" }}
              >
                <Link
                  href={`/categories/${top.slug}`}
                  className="group relative block h-40 w-full overflow-hidden"
                >
                  <Image
                    src={
                      top.image
                        ? normalizeImageUrl(top.image)
                        : FALLBACK_IMAGE
                    }
                    alt={top.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                    <p className="mb-0.5 text-[0.6rem] font-black tracking-[0.2em] uppercase text-white/70">
                      {top.children.length} subcategor
                      {top.children.length === 1 ? "y" : "ies"}
                    </p>
                    <h2 className="text-lg font-black leading-tight tracking-tight text-white">
                      {top.name}
                    </h2>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  {top.description && (
                    <p className="mb-3 text-[0.78rem] leading-relaxed text-neutral-500">
                      {top.description}
                    </p>
                  )}

                  {top.children.length > 0 ? (
                    <NestedList nodes={top.children} depth={1} />
                  ) : (
                    <p className="text-xs text-neutral-300 italic">
                      No subcategories yet.
                    </p>
                  )}

                  <Link
                    href={`/categories/${top.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 self-start text-[0.78rem] font-bold transition-colors hover:gap-2"
                    style={{ color: "#E84672" }}
                  >
                    View all <RiArrowRightLine size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
