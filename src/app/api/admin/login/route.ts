import { NextResponse } from "next/server";
import {
  adminAuthConfigured,
  createAdminSession,
  getAdminCookieOptions,
  requestHasSameOrigin,
  SESSION_COOKIE,
  verifyAdminPassword,
} from "@/lib/auth";
import { isRecord, readJson } from "@/lib/validation";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  if (!adminAuthConfigured()) {
    return Response.json({ error: "Admin authentication is not configured on the server." }, { status: 503 });
  }
  const body = await readJson(request);
  if (
    !isRecord(body) ||
    typeof body.username !== "string" || body.username.length > 128 ||
    typeof body.password !== "string" || body.password.length > 1024
  ) {
    return Response.json({ error: "Enter your admin username and password." }, { status: 400 });
  }

  const usernameMatches = body.username === process.env.ADMIN_USERNAME;
  const passwordMatches = verifyAdminPassword(body.password);
  if (!usernameMatches || !passwordMatches) {
    return Response.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(SESSION_COOKIE, createAdminSession(), getAdminCookieOptions());
  return response;
}
