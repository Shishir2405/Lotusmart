

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


function parseExpiry(expiresIn: string): string {
  
  return expiresIn;
}


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
      permissions: payload.permissions as ITokenPayload["permissions"],
      isSuperAdmin: payload.isSuperAdmin as boolean | undefined,
    };
  } catch (error) {
    throw new Error(
      `Invalid or expired token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}


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
      permissions: payload.permissions,
      isSuperAdmin: payload.isSuperAdmin,
    };
  } catch {
    return null;
  }
}
