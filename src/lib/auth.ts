import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "formstudio_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function adminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD_HASH &&
    process.env.SESSION_SECRET &&
    Buffer.byteLength(process.env.SESSION_SECRET) >= 32,
  );
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifySignedValue(value: string | undefined, cookieName: string) {
  if (!value) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return false;

  let expectedSignature: string;
  try {
    expectedSignature = sign(payload);
  } catch {
    return false;
  }
  if (!constantTimeEqual(signature, expectedSignature)) return false;

  if (cookieName === "cart") {
    return /^[0-9a-f-]{36}$/i.test(payload) ? payload : false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
    };
    if (
      session.sub !== process.env.ADMIN_USERNAME ||
      typeof session.exp !== "number" ||
      session.exp <= Date.now()
    ) {
      return false;
    }
    return session.sub;
  } catch {
    return false;
  }
}

function cookieValue(cookieHeader: string | null, name: string) {
  const prefix = `${name}=`;
  const entry = cookieHeader?.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : undefined;
}

export function isAdminRequest(request: Request) {
  return Boolean(verifySignedValue(cookieValue(request.headers.get("cookie"), SESSION_COOKIE), "admin"));
}

export async function isAdminSession() {
  const store = await cookies();
  return Boolean(verifySignedValue(store.get(SESSION_COOKIE)?.value, "admin"));
}

export function requestHasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string) {
  const encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!encoded) return false;
  const [algorithm, salt, expected, extra] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expected || extra !== undefined || !/^[a-f0-9]{32,}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expected)) {
    return false;
  }
  const actual = scryptSync(password, Buffer.from(salt, "hex"), 64).toString("hex");
  return constantTimeEqual(actual, expected.toLowerCase());
}

export function createAdminSession() {
  const username = process.env.ADMIN_USERNAME;
  if (!username) throw new Error("ADMIN_USERNAME is required.");
  const payload = Buffer.from(
    JSON.stringify({ sub: username, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function signCartId(id: string) {
  return `${id}.${sign(id)}`;
}

export function getCartIdFromRequest(request: Request) {
  const token = verifySignedValue(cookieValue(request.headers.get("cookie"), "formstudio_cart"), "cart");
  return typeof token === "string" ? token : null;
}

export function getCartCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export { SESSION_COOKIE };
