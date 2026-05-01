import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/modules/users/user.model";
import Cart from "@/modules/cart/cart.model";
import Wishlist from "@/modules/products/wishlist.model";
import Order from "@/modules/orders/order.model";
import { deleteAccount, restoreAccount } from "@/modules/auth/auth.service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Admin customer 360 view. Returns the user profile with every
 * associated commerce artefact (cart, wishlist, orders summary)
 * so the admin can see at a glance what the customer is doing.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const user = await User.findById(id).lean();
    if (!user) throw ApiError.notFound("User not found");

    const [cart, wishlist, recentOrders, orderStats] = await Promise.all([
      Cart.findOne({ user: id })
        .populate({ path: "items.product", select: "name slug images price stock" })
        .lean(),
      Wishlist.findOne({ user: id })
        .populate({ path: "items.product", select: "name slug images price stock" })
        .lean(),
      Order.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber total paymentStatus orderStatus createdAt items")
        .lean(),
      Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpend: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
              },
            },
            pendingOrders: {
              $sum: {
                $cond: [
                  { $in: ["$orderStatus", ["placed", "confirmed", "processing", "shipped"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const stats = orderStats[0] ?? { totalOrders: 0, totalSpend: 0, pendingOrders: 0 };

    return successResponse({
      user,
      cart: cart ?? { items: [] },
      wishlist: wishlist ?? { items: [] },
      recentOrders,
      stats: {
        totalOrders: stats.totalOrders,
        totalSpend: stats.totalSpend,
        pendingOrders: stats.pendingOrders,
      },
    });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

/**
 * Admin edit — name, phone, isVerified, role. Cannot change email
 * (email changes are a separate flow that requires re-verification).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (admin.userId === id && body.role && body.role !== "admin") {
      throw ApiError.badRequest("You cannot revoke your own admin role");
    }

    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if (typeof body.phone === "string") update.phone = body.phone.trim() || undefined;
    if (typeof body.isVerified === "boolean") update.isVerified = body.isVerified;
    if (body.role === "admin" || body.role === "customer") update.role = body.role;
    if (typeof body.profileComplete === "boolean") update.profileComplete = body.profileComplete;

    if (Object.keys(update).length === 0) {
      throw ApiError.badRequest("No editable fields provided");
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    )
      .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!user) throw ApiError.notFound("User not found");

    return successResponse({ user }, "User updated");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

/**
 * Admin soft-delete — flags the user as deleted, releases their
 * email/googleId so it can be reused, and clears the cart/wishlist
 * (those are session state, not historical record). Orders stay
 * intact and remain linked to the soft-deleted user.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const admin = await requireAdmin(request);
    const { id } = await params;

    if (admin.userId === id) {
      throw ApiError.badRequest("You cannot delete your own account");
    }

    const reason = await request
      .json()
      .then((b) => (typeof b?.reason === "string" ? b.reason : undefined))
      .catch(() => undefined);

    await deleteAccount(id, reason);
    await User.updateOne({ _id: id }, { $set: { deletedBy: admin.userId } });

    await Promise.all([Cart.deleteOne({ user: id }), Wishlist.deleteOne({ user: id })]);

    return successResponse({ id }, "User deleted");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

/**
 * Admin restore — reverses a soft-delete. Errors if another active
 * user has since claimed the original email.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const url = new URL(request.url);
    if (url.searchParams.get("action") !== "restore") {
      throw ApiError.badRequest("Unsupported action");
    }

    const user = await restoreAccount(id);
    return successResponse({ user }, "User restored");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
