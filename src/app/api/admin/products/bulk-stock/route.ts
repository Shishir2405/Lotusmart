

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import Product from "@/modules/products/product.model";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();

    
    if (body.updates && Array.isArray(body.updates)) {
      const bulkOps = body.updates.map(
        (u: { id: string; stock?: number; lowStockThreshold?: number }) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(u.id) },
            update: {
              $set: {
                ...(u.stock !== undefined && { stock: u.stock }),
                ...(u.lowStockThreshold !== undefined && {
                  lowStockThreshold: u.lowStockThreshold,
                }),
              },
            },
          },
        }),
      );

      const result = await Product.bulkWrite(bulkOps);

      const slugs = await Product.find({
        _id: { $in: body.updates.map((u: { id: string }) => new mongoose.Types.ObjectId(u.id)) },
      })
        .select("slug")
        .lean();
      revalidatePath("/");
      revalidatePath("/products");
      slugs.forEach((p) => p.slug && revalidatePath(`/products/${p.slug}`));

      return successResponse(
        { modifiedCount: result.modifiedCount },
        "Stock updated successfully",
      );
    }

    
    if (body.operation && body.productIds && body.quantity !== undefined) {
      const { operation, productIds, quantity } = body as {
        operation: "add" | "reduce" | "set";
        productIds: string[];
        quantity: number;
      };

      if (!["add", "reduce", "set"].includes(operation)) {
        throw ApiError.badRequest("Invalid operation. Use add, reduce, or set.");
      }

      if (typeof quantity !== "number" || quantity < 0) {
        throw ApiError.badRequest("Quantity must be a non-negative number.");
      }

      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw ApiError.badRequest("productIds must be a non-empty array.");
      }

      const objectIds = productIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      let bulkOps;

      switch (operation) {
        case "set":
          bulkOps = objectIds.map((oid) => ({
            updateOne: {
              filter: { _id: oid },
              update: { $set: { stock: quantity } },
            },
          }));
          break;

        case "add":
          bulkOps = objectIds.map((oid) => ({
            updateOne: {
              filter: { _id: oid },
              update: { $inc: { stock: quantity } },
            },
          }));
          break;

        case "reduce":
          
          bulkOps = objectIds.map((oid) => ({
            updateOne: {
              filter: { _id: oid },
              update: [
                {
                  $set: {
                    stock: {
                      $max: [0, { $subtract: ["$stock", quantity] }],
                    },
                  },
                },
              ],
            },
          }));
          break;
      }

      const result = await Product.bulkWrite(bulkOps);

      const slugs = await Product.find({ _id: { $in: objectIds } })
        .select("slug")
        .lean();
      revalidatePath("/");
      revalidatePath("/products");
      slugs.forEach((p) => p.slug && revalidatePath(`/products/${p.slug}`));

      return successResponse(
        { modifiedCount: result.modifiedCount },
        `Stock ${operation} operation completed successfully`,
      );
    }

    throw ApiError.badRequest(
      "Invalid request body. Provide either 'updates' array or 'operation' with 'productIds' and 'quantity'.",
    );
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
