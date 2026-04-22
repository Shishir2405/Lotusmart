

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import type { ITokenPayload } from "@/types";

const COOKIE_NAME = "lotusmart-auth-token";

// Allowed origins for API requests
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "https://lotusmart.in",
  "https://www.lotusmart.in",
].filter(Boolean);

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return new TextEncoder().encode(secret);
}


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


// ---------- API route protection ----------

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((allowed) => origin === allowed);
}

function getOriginFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.origin;
  } catch {
    return null;
  }
}

function blockApiRequest(message: string) {
  return NextResponse.json(
    { success: false, message },
    { status: 403 },
  );
}

function protectApiRoute(request: NextRequest): NextResponse | null {
  // Allow preflight CORS requests
  if (request.method === "OPTIONS") return null;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const effectiveOrigin = origin || getOriginFromReferer(referer);
  const requestedWith = request.headers.get("x-requested-with");

  // No origin/referer — server-side render or direct navigation.
  // Allow: server components need this for internal API calls.
  if (!effectiveOrigin) return null;

  // Client-side XHR/fetch — require the custom header
  if (requestedWith !== "LotusApp") {
    return blockApiRequest("Forbidden");
  }

  // Validate origin is from an allowed domain
  if (!isAllowedOrigin(effectiveOrigin)) {
    return blockApiRequest("Forbidden");
  }

  return null; // all checks passed
}


// ---------- Page route protection ----------

const protectedPatterns = [
  /^\/account(\/|$)/,
  /^\/orders(\/|$)/,
  /^\/complete-profile(\/|$)/,
];


const adminPatterns = [/^\/admin(\/|$)/];


const guestOnlyPatterns = [/^\/login(\/|$)/, /^\/register(\/|$)/];


const adminLoginPattern = /^\/admin-login(\/|$)/;

function matchesAny(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(pathname));
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------- API route protection ----------
  if (pathname.startsWith("/api/")) {
    const blocked = protectApiRoute(request);
    if (blocked) return blocked;

    // Add CORS headers to API responses
    const response = NextResponse.next();
    const origin = request.headers.get("origin");
    if (origin && isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-device-id");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // ---------- Page route protection ----------
  const user = await verifyAuth(request);


  if (adminLoginPattern.test(pathname)) {

    if (user && user.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }


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


  if (matchesAny(pathname, protectedPatterns)) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }


  if (matchesAny(pathname, guestOnlyPatterns)) {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    // API routes
    "/api/:path*",
    // Page routes
    "/account/:path*",
    "/orders/:path*",
    "/complete-profile",
    "/admin/:path*",
    "/admin-login",
    "/login",
    "/register",
  ],
};
