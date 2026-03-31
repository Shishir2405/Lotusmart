

import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import { verifyToken } from "@/lib/jwt";
import type { ITokenPayload } from "@/types";

const COOKIE_NAME = "lotusmart-auth-token";


export async function getAuthUser(
  request: NextRequest,
): Promise<ITokenPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}


export async function requireAuth(
  request: NextRequest,
): Promise<ITokenPayload> {
  const user = await getAuthUser(request);
  if (!user) {
    throw ApiError.unauthorized("Authentication required. Please log in.");
  }
  return user;
}


export async function requireAdmin(
  request: NextRequest,
): Promise<ITokenPayload> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw ApiError.forbidden(
      "Access denied. Admin privileges are required.",
    );
  }
  return user;
}


export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, 
  });
}


export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
