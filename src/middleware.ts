// Next.js Edge Middleware — route protection for LotusMart

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import type { ITokenPayload } from "@/types";

const COOKIE_NAME = "lotusmart-auth-token";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify the JWT from the cookie and return the payload.
 * Returns `null` when the token is missing or invalid.
 */
async function verifyAuth(
  request: NextRequest,
): Promise<ITokenPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "lotusmart",
      audience: "lotusmart",
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as ITokenPayload["role"],
    };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Route definitions
// ──────────────────────────────────────────────

/** Routes that require the user to be authenticated (customer or admin). */
const protectedPatterns = [
  /^\/account(\/|$)/,
  /^\/orders(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/wishlist(\/|$)/,
];

/** Routes that require admin role. */
const adminPatterns = [/^\/admin(\/|$)/];

/** Routes that authenticated users should be redirected away from. */
const guestOnlyPatterns = [/^\/login(\/|$)/, /^\/register(\/|$)/];

/** Admin login — unauthenticated users go here for admin access. */
const adminLoginPattern = /^\/admin-login(\/|$)/;

function matchesAny(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(pathname));
}

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifyAuth(request);

  // ── Admin login page ──────────────────────
  if (adminLoginPattern.test(pathname)) {
    // If already authenticated as admin, redirect to dashboard
    if (user && user.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── Admin routes ───────────────────────────
  if (matchesAny(pathname, adminPatterns)) {
    if (!user) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── Protected customer routes ──────────────
  if (matchesAny(pathname, protectedPatterns)) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Guest-only routes (login / register) ───
  if (matchesAny(pathname, guestOnlyPatterns)) {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ──────────────────────────────────────────────
// Matcher config — only run middleware on relevant paths
// ──────────────────────────────────────────────
export const config = {
  matcher: [
    "/account/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/wishlist/:path*",
    "/admin/:path*",
    "/admin-login",
    "/login",
    "/register",
  ],
};
