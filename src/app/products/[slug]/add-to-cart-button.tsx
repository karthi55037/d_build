"use client";

import { useState } from "react";

type Cart = { items: Array<{ product: { id: string }; quantity: number }>; subtotal: number };

export default function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function addToCart() {
    setBusy(true);
    setMessage("");
    try {
      const cartResponse = await fetch("/api/cart", { cache: "no-store" });
      const cart = await cartResponse.json() as Cart;
      if (!cartResponse.ok) throw new Error("Unable to load your cart.");
      const currentQuantity = cart.items.find((item) => item.product.id === productId)?.quantity ?? 0;
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: currentQuantity + 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to add this item.");
      setMessage("Added to your bag.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to add this item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        disabled={busy || stock === 0}
        onClick={addToCart}
        className="mt-8 w-full bg-black px-7 py-4 text-sm text-white hover:bg-orange-900 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Adding…" : stock === 0 ? "Sold out" : "Add to bag"}
      </button>
      {message && <p className="mt-3 text-sm" role="status">{message}</p>}
    </div>
  );
}
