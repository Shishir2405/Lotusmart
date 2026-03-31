

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const q = request.nextUrl.searchParams.get("q");

    if (!q || q.trim().length < 2) {
      throw ApiError.badRequest(
        "Search query must be at least 2 characters long",
      );
    }

    const products = await Product.find(
      {
        isActive: true,
        $text: { $search: q.trim() },
      },
      {
        score: { $meta: "textScore" },
        name: 1,
        slug: 1,
        price: 1,
        images: 1,
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .lean();

    const results = products.map((p) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images[0] ?? null,
    }));

    return successResponse(results, "Search results");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
