

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { channelProductFilter } from "@/lib/channel";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import Product from "@/modules/products/product.model";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { slug } = await params;

    const category = await Category.findOne({ slug, isActive: true })
      .populate({
        path: "children",
        match: { isActive: true },
        options: { sort: { sortOrder: 1, name: 1 } },
      })
      .lean({ virtuals: true });

    if (!category) {
      throw ApiError.notFound(`Category "${slug}" not found`);
    }

    
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true,
      ...(await channelProductFilter(request)),
    });

    return successResponse(
      { ...category, productCount },
      "Category fetched successfully",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
