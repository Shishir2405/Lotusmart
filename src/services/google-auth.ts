import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return _jwks;
}

export interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  // Native iOS/Android and web mint ID tokens with DIFFERENT audiences (their
  // own platform OAuth client), so accept all configured client IDs. This is
  // why the mobile app's Google sign-in was failing with an `aud` mismatch.
  const audiences = [
    process.env.GOOGLE_CLIENT_ID, // web
    process.env.GOOGLE_IOS_CLIENT_ID, // iOS native (create an iOS OAuth client)
    process.env.GOOGLE_ANDROID_CLIENT_ID, // Android native
  ].filter(Boolean) as string[];
  if (audiences.length === 0) {
    throw new Error("No Google client IDs are configured (set GOOGLE_CLIENT_ID)");
  }

  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: GOOGLE_ISSUERS,
    audience: audiences,
  });

  const email = payload.email as string | undefined;
  const sub = payload.sub as string | undefined;
  if (!email || !sub) {
    throw new Error("Google ID token is missing email or subject");
  }

  return {
    sub,
    email,
    email_verified: Boolean(payload.email_verified),
    name: payload.name as string | undefined,
    given_name: payload.given_name as string | undefined,
    family_name: payload.family_name as string | undefined,
    picture: payload.picture as string | undefined,
  };
}
