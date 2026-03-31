import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import User from "@/modules/users/user.model";
import Product from "@/modules/products/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30"; 
    const days = Math.min(365, Number(range));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      recentOrders,
      revenueByDay,
      ordersByStatus,
      topProducts,
    ] = await Promise.all([
      
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      
      Order.countDocuments({ createdAt: { $gte: since } }),

      
      User.countDocuments({ role: "customer" }),

      
      Product.countDocuments({ isActive: true }),

      
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),

      
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),

      
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            units: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return successResponse({
      summary: {
        revenue: totalRevenue[0]?.total ?? 0,
        orders: totalOrders,
        users: totalUsers,
        products: totalProducts,
      },
      recentOrders,
      revenueByDay,
      ordersByStatus,
      topProducts,
    });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
