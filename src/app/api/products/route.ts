import { listProducts } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const products = await listProducts({
    category: url.searchParams.get("category") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  });
  return Response.json(products, {
    headers: { "Cache-Control": "no-store" },
  });
}
