// Auth utility helpers for LotusMart API route handlers

import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import { verifyToken } from "@/lib/jwt";
import type { ITokenPayload } from "@/types";

const COOKIE_NAME = "lotusmart-auth-token";

// ──────────────────────────────────────────────
// Extract & verify user from request
// ──────────────────────────────────────────────

/**
 * Extract and verify the JWT from the auth cookie.
 * Returns the decoded payload, or `null` if no valid token is present.
 */
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

/**
 * Same as `getAuthUser` but throws 401 if not authenticated.
 */
export async function requireAuth(
  request: NextRequest,
): Promise<ITokenPayload> {
  const user = await getAuthUser(request);
  if (!user) {
    throw ApiError.unauthorized("Authentication required. Please log in.");
  }
  return user;
}

/**
 * Same as `requireAuth` but also verifies the user has the `admin` role.
 */
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

// ──────────────────────────────────────────────
// Cookie management
// ──────────────────────────────────────────────

/**
 * Set the auth JWT as an httpOnly, secure cookie on the response.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches JWT_EXPIRES_IN default)
  });
}

/**
 * Clear the auth cookie (used on logout).
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
