import { isAdminRequest, requestHasSameOrigin } from "@/lib/auth";
import { createProduct, listAdminProducts } from "@/lib/store";
import { parseProductInput, readJson } from "@/lib/validation";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Sign in to manage products." }, { status: 401 });
  }
  const products = await listAdminProducts();
  return Response.json(products, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Sign in to manage products." }, { status: 401 });
  }
  const input = parseProductInput(await readJson(request));
  if (!input) {
    return Response.json({ error: "Enter valid product details." }, { status: 400 });
  }
  try {
    const product = await createProduct(input);
    return Response.json(product, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return Response.json({ error: "A product with this URL slug already exists." }, { status: 409 });
    }
    throw error;
  }
}
