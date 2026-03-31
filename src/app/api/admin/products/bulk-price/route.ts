

import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";

interface PriceUpdate {
  id: string;
  price: number;
  pricePerKg?: number;
  pricePerGram?: number;
  compareAtPrice?: number;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();

    const body = await request.json();
    const { updates } = body as { updates: PriceUpdate[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      throw ApiError.badRequest("No price updates provided");
    }

    if (updates.length > 200) {
      throw ApiError.badRequest("Maximum 200 updates per request");
    }

    
    for (const update of updates) {
      if (!update.id || !mongoose.isValidObjectId(update.id)) {
        throw ApiError.badRequest(`Invalid product ID: ${update.id}`);
      }
      if (update.price !== undefined && (typeof update.price !== "number" || update.price < 0)) {
        throw ApiError.badRequest(`Invalid price for product ${update.id}`);
      }
    }

    const now = new Date();

    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(update.id) },
        update: {
          $set: {
            ...(update.price !== undefined && { price: update.price }),
            ...(update.pricePerKg !== undefined && { pricePerKg: update.pricePerKg }),
            ...(update.pricePerGram !== undefined && { pricePerGram: update.pricePerGram }),
            ...(update.compareAtPrice !== undefined && { compareAtPrice: update.compareAtPrice }),
            lastPriceUpdate: now,
          },
        },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);

    return successResponse(
      {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        updatedAt: now.toISOString(),
      },
      `${result.modifiedCount} product price(s) updated successfully`,
    );
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
