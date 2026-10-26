import { isAdminRequest, requestHasSameOrigin } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/store";
import { parseProductInput, readJson } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Sign in to manage products." }, { status: 401 });
  }
  const { id } = await context.params;
  const input = parseProductInput(await readJson(request));
  if (!input) {
    return Response.json({ error: "Enter valid product details." }, { status: 400 });
  }
  try {
    const updated = await updateProduct(id, input);
    if (!updated) return Response.json({ error: "Product not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return Response.json({ error: "A product with this URL slug already exists." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Sign in to manage products." }, { status: 401 });
  }
  const { id } = await context.params;
  const deleted = await deleteProduct(id);
  if (!deleted) return Response.json({ error: "Product not found." }, { status: 404 });
  return Response.json({ ok: true });
}
