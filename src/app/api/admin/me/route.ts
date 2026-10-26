import { isAdminRequest } from "@/lib/auth";

export async function GET(request: Request) {
  return Response.json(
    { authenticated: isAdminRequest(request) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
