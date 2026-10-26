import { getCartIdFromRequest, requestHasSameOrigin } from "@/lib/auth";
import { createOrder } from "@/lib/store";
import { parseCheckoutCustomer, readJson } from "@/lib/validation";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const customer = parseCheckoutCustomer(await readJson(request));
  if (!customer) {
    return Response.json({ error: "Enter a valid name, email, and delivery address." }, { status: 400 });
  }
  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return Response.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const result = await createOrder(cartId, customer);
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: result.status });
  }
  return Response.json(result.order, { status: 201 });
}
