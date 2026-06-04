import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";
import Category from "@/modules/products/category.model";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Unified product autocomplete search.
 *
 * Uses case-insensitive partial (substring) matching instead of Mongo's
 * `$text` operator, so a prefix like "alm" matches "Almonds". Every whitespace
 * token must match somewhere (name / tags / brand / subcategory / description /
 * matching category), and results are ranked by relevance (exact > prefix >
 * contains > tag/brand/category).
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      throw ApiError.badRequest("Search query must be at least 2 characters long");
    }

    const tokens = q.split(/\s+/).filter(Boolean).slice(0, 6);
    const tokenRx = tokens.map((t) => new RegExp(escapeRegex(t), "i"));
    const fullRx = new RegExp(escapeRegex(q), "i");

    // Unified: surface products whose CATEGORY name matches the query too,
    // so searching "nuts" returns products in the Nuts category.
    const matchedCats = await Category.find(
      { isActive: true, $or: tokenRx.map((r) => ({ name: r })) },
      { _id: 1 },
    ).lean();
    const catIds = matchedCats.map((c) => c._id);

    // AND across tokens, OR across fields — each token must match somewhere.
    const and = tokenRx.map((r) => ({
      $or: [
        { name: r },
        { tags: r },
        { brand: r },
        { subcategory: r },
        { description: r },
        ...(catIds.length ? [{ category: { $in: catIds } }] : []),
      ],
    }));

    const products = await Product.find(
      { isActive: true, ...(and.length ? { $and: and } : {}) },
      {
        name: 1,
        slug: 1,
        price: 1,
        images: 1,
        tags: 1,
        brand: 1,
        subcategory: 1,
        category: 1,
      },
    )
      .limit(40)
      .lean();

    const ql = q.toLowerCase();
    const ranked = products
      .map((p) => {
        const name = (p.name ?? "").toLowerCase();
        let score = 0;
        if (name === ql) score += 100;
        else if (name.startsWith(ql)) score += 70;
        else if (fullRx.test(p.name ?? "")) score += 45;
        // reward how many query tokens hit the name (helps multi-word queries)
        score += tokenRx.filter((r) => r.test(p.name ?? "")).length * 8;
        if ((p.tags ?? []).some((t: string) => fullRx.test(t))) score += 18;
        if (p.brand && fullRx.test(p.brand)) score += 10;
        if (p.subcategory && fullRx.test(p.subcategory)) score += 8;
        if (catIds.some((id) => String(id) === String(p.category))) score += 6;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const results = ranked.map(({ p }) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images?.[0] ?? null,
    }));

    return successResponse(results, "Search results");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
