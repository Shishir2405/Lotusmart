

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Review from "@/modules/reviews/review.model";
import Product from "@/modules/products/product.model";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string; reviewId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { id, reviewId } = await params;

    const review = await Review.findById(reviewId);
    if (!review) throw ApiError.notFound("Review not found");

    const isOwner = review.user.toString() === authUser.userId;
    const isAdmin = authUser.role === "admin";
    if (!isOwner && !isAdmin) throw ApiError.forbidden("Access denied");

    await review.deleteOne();

    
    const agg = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    await Product.findByIdAndUpdate(id, {
      $set: {
        "ratings.average": agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0,
        "ratings.count": agg[0]?.count ?? 0,
      },
    });

    return successResponse(null, "Review deleted");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
