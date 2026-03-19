// JWT utilities using the `jose` library (Edge-runtime compatible)

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import type { ITokenPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

function getSecretKey(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error(
      "Please define the JWT_SECRET environment variable in .env.local",
    );
  }
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Parse a human-readable duration string like "7d", "2h", "30m" into
 * a value compatible with jose's `setExpirationTime`.
 */
function parseExpiry(expiresIn: string): string {
  // jose accepts strings like "2h", "7d", "15m", etc. directly
  return expiresIn;
}

/**
 * Create a signed JWT for the given payload.
 */
export async function signToken(payload: ITokenPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseExpiry(JWT_EXPIRES_IN))
    .setIssuer("lotusmart")
    .setAudience("lotusmart")
    .sign(getSecretKey());

  return token;
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<ITokenPayload> {
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
  } catch (error) {
    throw new Error(
      `Invalid or expired token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Decode a JWT *without* verifying the signature.
 * Useful for reading claims on the client side where secret isn't available.
 */
export function decodeToken(token: string): ITokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
