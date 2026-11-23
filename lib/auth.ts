import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: "user" | "admin";
  name: string;
}

export const AUTH_COOKIE_NAME = "token";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
      ? process.env.JWT_SECRET
      : "default_fallback_jwt_secret_food_delivery_app_at_least_32_chars_2026";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.id === "string" &&
      typeof payload.email === "string" &&
      (payload.role === "user" || payload.role === "admin") &&
      typeof payload.name === "string"
    ) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

export function extractTokenFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function verifyAuthFromRequest(request: Request): Promise<AuthTokenPayload | null> {
  const cookieHeader = request.headers.get("cookie");
  const token = extractTokenFromHeader(cookieHeader);
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
