import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getCartCookieOptions,
  getCartIdFromRequest,
  requestHasSameOrigin,
  signCartId,
} from "@/lib/auth";
import { getCart, setCartQuantity } from "@/lib/store";
import { parseCartUpdate, readJson } from "@/lib/validation";

export async function GET(request: Request) {
  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return Response.json({ items: [], subtotal: 0 });
  }
  const cart = await getCart(cartId);
  return Response.json(cart, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return Response.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const update = parseCartUpdate(await readJson(request));
  if (!update) {
    return Response.json({ error: "Provide a valid product and quantity." }, { status: 400 });
  }

  const cartId = getCartIdFromRequest(request) ?? randomUUID();
  const result = await setCartQuantity(cartId, update.productId, update.quantity);
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 409 });
  }

  const cart = await getCart(cartId);
  const response = NextResponse.json(cart, {
    headers: { "Cache-Control": "no-store" },
  });
  if (!getCartIdFromRequest(request)) {
    response.cookies.set("formstudio_cart", signCartId(cartId), getCartCookieOptions());
  }
  return response;
}
