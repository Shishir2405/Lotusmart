import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getWarehouses, createWarehouse } from "@/services/shipmozo";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const result = await getWarehouses();

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Failed to fetch warehouses");
    }

    return successResponse(result.data);
  } catch (err) {
    console.error("[Shipmozo get-warehouses]", (err as any)?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const { address_title, name, phone, email, address_line_one, address_line_two, pin_code } = body;

    if (!address_title || !address_line_one || !pin_code) {
      throw ApiError.badRequest("address_title, address_line_one, and pin_code are required");
    }

    const result = await createWarehouse({
      address_title,
      name,
      phone: phone ? Number(phone) : undefined,
      email,
      address_line_one,
      address_line_two,
      pin_code: Number(pin_code),
    });

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Failed to create warehouse");
    }

    return successResponse(result.data, "Warehouse created");
  } catch (err) {
    console.error("[Shipmozo create-warehouse]", (err as any)?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
