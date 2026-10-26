import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { findOrderById } from "@/lib/store";

export default function OrderConfirmation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#faf9f6]" />}>
      <OrderConfirmationContent params={params} />
    </Suspense>
  );
}

async function OrderConfirmationContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const order = await findOrderById(id);
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-[#faf9f6] px-5 py-16 text-neutral-900">
      <section className="mx-auto max-w-xl border border-neutral-200 bg-white p-8">
        <p className="text-xs tracking-widest text-orange-800">ORDER PLACED</p>
        <h1 className="mt-3 text-3xl font-semibold">Thank you for your order.</h1>
        <p className="mt-4 text-sm text-neutral-600">Order reference: {order.id}</p>
        <ul className="mt-8 divide-y">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.quantity}`} className="flex justify-between gap-4 py-4 text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t pt-5 font-medium">
          <span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span>
        </p>
        <p className="mt-5 text-xs text-neutral-500">This order is saved. Online payment is not configured.</p>
        <Link href="/" className="mt-8 inline-block underline">Continue shopping</Link>
      </section>
    </main>
  );
}
