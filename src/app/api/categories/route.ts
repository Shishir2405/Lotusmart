

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { createdResponse, errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import { getDepth, MAX_CATEGORY_DEPTH } from "@/modules/products/category.tree";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const includeSubcategories =
      searchParams.get("includeSubcategories") === "true";
    const flat = searchParams.get("flat") === "true";

    // Flat mode returns every active category regardless of depth, so the
    // client can build an arbitrarily deep tree itself. Avoids N populate
    // hops and keeps the route cheap.
    if (flat) {
      const all = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
      return successResponse(all, "Categories fetched successfully");
    }

    const query = Category.find({ isActive: true, parent: null }).sort({
      sortOrder: 1,
      name: 1,
    });

    if (includeSubcategories) {
      // Populate TWO levels of children so the full 3-level taxonomy
      // (top → sub → sub-sub) reaches the navbar / homepage. A single-hop
      // populate silently dropped every grandchild.
      query.populate({
        path: "children",
        match: { isActive: true },
        options: { sort: { sortOrder: 1, name: 1 } },
        populate: {
          path: "children",
          match: { isActive: true },
          options: { sort: { sortOrder: 1, name: 1 } },
        },
      });
    }

    const categories = await query.lean({ virtuals: includeSubcategories });

    return successResponse(categories, "Categories fetched successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}


export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const { name, description, image, parent, isActive, sortOrder } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw ApiError.badRequest("Category name is required");
    }

    
    if (parent) {
      const parentDoc = await Category.findById(parent).lean();
      if (!parentDoc) {
        throw ApiError.badRequest("Parent category not found");
      }
      if ((await getDepth(parent)) + 1 > MAX_CATEGORY_DEPTH) {
        throw ApiError.badRequest("Maximum 3 category levels allowed");
      }
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      image,
      parent: parent ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    });

    return createdResponse(category, "Category created successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
