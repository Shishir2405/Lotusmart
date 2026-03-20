// GET  /api/products/[id]/reviews — list reviews for a product (public)
// POST /api/products/[id]/reviews — submit a review (auth required)

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser, requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, createdResponse } from "@/lib/api-response";
import Review from "@/modules/reviews/review.model";
import Product from "@/modules/products/product.model";
import Order from "@/modules/orders/order.model";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 10));

    const [reviews, total] = await Promise.all([
      Review.find({ product: id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name avatar")
        .lean(),
      Review.countDocuments({ product: id }),
    ]);

    // Rating summary
    const summary = await Review.aggregate([
      { $match: { product: new (await import("mongoose")).default.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
          dist: {
            $push: "$rating",
          },
        },
      },
    ]);

    const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: summary[0]?.dist?.filter((d: number) => d === r).length ?? 0,
    }));

    return successResponse({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        average: summary[0]?.average ? Math.round(summary[0].average * 10) / 10 : 0,
        count: summary[0]?.count ?? 0,
        distribution: ratingDist,
      },
    });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const { rating, title, comment, images } = body;

    if (!rating || rating < 1 || rating > 5)
      throw ApiError.badRequest("Rating must be between 1 and 5");
    if (!comment?.trim())
      throw ApiError.badRequest("Review comment is required");

    const product = await Product.findById(id).lean();
    if (!product || !product.isActive)
      throw ApiError.notFound("Product not found");

    // Check for duplicate
    const existing = await Review.findOne({ product: id, user: authUser.userId });
    if (existing)
      throw ApiError.conflict("You have already reviewed this product");

    // Check if verified purchase
    const purchasedOrder = await Order.findOne({
      user: authUser.userId,
      "items.product": id,
      orderStatus: "delivered",
    }).lean();

    const review = await Review.create({
      product: id,
      user: authUser.userId,
      rating: Number(rating),
      title: title?.trim(),
      comment: comment.trim(),
      images: images ?? [],
      isVerifiedPurchase: !!purchasedOrder,
    });

    // Update product rating aggregate
    const agg = await Review.aggregate([
      { $match: { product: new (await import("mongoose")).default.Types.ObjectId(id) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (agg[0]) {
      await Product.findByIdAndUpdate(id, {
        $set: {
          "ratings.average": Math.round(agg[0].avg * 10) / 10,
          "ratings.count": agg[0].count,
        },
      });
    }

    const populated = await review.populate("user", "name avatar");
    return createdResponse(populated, "Review submitted");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
