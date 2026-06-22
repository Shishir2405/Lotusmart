import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import Feedback from "@/modules/feedback/feedback.model";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function clean(v: unknown, max = 4000): string {
  return String(v ?? "").trim().slice(0, max);
}

// Public — app testers submit feedback (used for Google Play production access).
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const email = clean(body.email, 255).toLowerCase();
    const rating = Number(body.rating);
    const bug = clean(body.bug);

    if (!EMAIL_RE.test(email)) throw ApiError.badRequest("A valid email is required");
    if (!Number.isFinite(rating) || rating < 1 || rating > 5)
      throw ApiError.badRequest("Please give an overall rating (1–5 stars)");
    if (!bug) throw ApiError.badRequest("Please tell us about any bug/crash (type “None” if there wasn't one)");

    const partsTried = Array.isArray(body.partsTried)
      ? body.partsTried.filter((x: unknown): x is string => typeof x === "string").slice(0, 20)
      : [];

    const npsRaw = body.nps;
    const nps =
      npsRaw === "" || npsRaw === null || npsRaw === undefined
        ? undefined
        : Math.max(0, Math.min(10, Number(npsRaw)));

    const doc = await Feedback.create({
      name: clean(body.name, 120) || undefined,
      email,
      phoneModel: clean(body.phoneModel, 160) || undefined,
      rating,
      partsTried,
      bug,
      confusing: clean(body.confusing) || undefined,
      liked: clean(body.liked) || undefined,
      improve: clean(body.improve) || undefined,
      nps: Number.isFinite(nps as number) ? nps : undefined,
    });

    return successResponse({ id: doc._id }, "Thank you! Your feedback was submitted.", 201);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

// Admin — read submissions (to summarise tester feedback for Google).
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(200, Number(searchParams.get("limit") ?? 50));

    const [items, total] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Feedback.countDocuments(),
    ]);

    return paginatedResponse(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
