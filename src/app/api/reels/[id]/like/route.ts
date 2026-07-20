import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Reel from "@/modules/reels/reel.model";

type Params = { params: Promise<{ id: string }> };

/**
 * Public like toggle for a reel. There is no per-user auth here (likes work
 * like view counts), so the client owns the per-device "already liked" state
 * and tells us which way to move the counter via `{ liked: boolean }`:
 *   liked === true  -> +1
 *   liked === false -> -1 (floored at 0 so it can never go negative)
 * Returns the fresh count so the UI can reconcile against concurrent likes.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Reel not found");
    }

    let liked = true;
    try {
      const body = await request.json();
      if (body && typeof body.liked === "boolean") liked = body.liked;
    } catch {
      // No/invalid body — default to a like (+1).
    }

    // Only decrement when there's something to decrement, so the count can't be
    // driven negative by repeated unlikes. Increment is unconditional.
    const filter = liked
      ? { _id: id, isActive: true }
      : { _id: id, isActive: true, likes: { $gt: 0 } };
    const updated = await Reel.findOneAndUpdate(
      filter,
      { $inc: { likes: liked ? 1 : -1 } },
      { new: true, projection: { likes: 1 } },
    ).lean();

    if (!updated) {
      // Either the reel doesn't exist/isn't active, or it's an unlike at 0.
      const exists = await Reel.exists({ _id: id, isActive: true });
      if (!exists) throw ApiError.notFound("Reel not found");
      return successResponse({ likes: 0 }, "Like updated");
    }

    return successResponse({ likes: updated.likes ?? 0 }, "Like updated");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
