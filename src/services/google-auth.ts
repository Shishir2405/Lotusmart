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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
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
