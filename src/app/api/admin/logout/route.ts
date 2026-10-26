import { NextResponse } from "next/server";
import {
  getAdminCookieOptions,
  requestHasSameOrigin,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...getAdminCookieOptions(), maxAge: 0 });
  return response;
}
