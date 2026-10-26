import { findProductBySlug } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const product = await findProductBySlug(slug);
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
  return Response.json(product, {
    headers: { "Cache-Control": "no-store" },
  });
}
