

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import type { ITokenPayload } from "@/types";

const COOKIE_NAME = "lotusmart-auth-token";

// Allowed origins for API requests
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "https://lotusmart.in",
  "https://www.lotusmart.in",
  "https://admin.lotusmart.in",
].filter(Boolean);

// Production domain split: admin lives on its own subdomain.
const MAIN_HOSTS = ["lotusmart.in", "www.lotusmart.in"];
const ADMIN_HOST = "admin.lotusmart.in";

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

  // Client-side XHR/fetch — require one of our own clients' custom headers.
  // "LotusApp" = the mobile app, "LotusWeb" = this website's own browser
  // client (see src/lib/channel.ts, which relies on that distinction to
  // scope product visibility by channel — don't collapse these back into
  // one value).
  if (requestedWith !== "LotusApp" && requestedWith !== "LotusWeb") {
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
  const hostname = (request.headers.get("host") || "").split(":")[0];
  const onAdminHost = hostname === ADMIN_HOST;
  const onMainHost = MAIN_HOSTS.includes(hostname);

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

  // ---------- Admin subdomain routing (production only) ----------

  // On the main domain, bounce legacy /admin* and /admin-login links
  // over to the admin subdomain.
  if (onMainHost) {
    if (adminLoginPattern.test(pathname)) {
      const url = new URL(request.url);
      url.hostname = ADMIN_HOST;
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (matchesAny(pathname, adminPatterns)) {
      const url = new URL(request.url);
      url.hostname = ADMIN_HOST;
      url.pathname = pathname.replace(/^\/admin/, "") || "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // On the admin subdomain, alias the two clean entry points ("/" and
  // "/login") to the underlying /admin/dashboard and /admin-login pages.
  // Deep links keep using /admin/* (e.g. admin.lotusmart.in/admin/orders),
  // which already works unchanged.
  let canonicalPathname = pathname;
  let needsRewrite = false;
  if (onAdminHost) {
    if (pathname === "/login") {
      canonicalPathname = "/admin-login";
      needsRewrite = true;
    } else if (pathname === "/") {
      canonicalPathname = "/admin/dashboard";
      needsRewrite = true;
    }
  }

  function toAdminUrl(path: string): URL {
    const url = new URL(request.url);
    if (onAdminHost) {
      url.hostname = ADMIN_HOST;
      url.pathname = path.replace(/^\/admin/, "") || "/dashboard";
    } else {
      url.pathname = path;
    }
    return url;
  }

  // ---------- Page route protection ----------
  const user = await verifyAuth(request);


  if (adminLoginPattern.test(canonicalPathname)) {

    if (user && user.role === "admin") {
      return NextResponse.redirect(toAdminUrl("/admin/dashboard"));
    }
    if (needsRewrite) {
      return NextResponse.rewrite(new URL(canonicalPathname, request.url));
    }
    return NextResponse.next();
  }


  if (matchesAny(canonicalPathname, adminPatterns)) {
    if (!user) {
      const loginUrl = onAdminHost
        ? new URL("/login", request.url)
        : new URL("/admin-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "admin") {
      const homeUrl = new URL("/", request.url);
      if (onAdminHost) homeUrl.hostname = MAIN_HOSTS[0];
      return NextResponse.redirect(homeUrl);
    }
    if (needsRewrite) {
      return NextResponse.rewrite(new URL(canonicalPathname, request.url));
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
    // Admin subdomain clean entry points ("/" -> dashboard, handled only
    // when the request host is admin.lotusmart.in)
    "/",
  ],
};
