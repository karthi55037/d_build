"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingBag } from "lucide-react";
import type { CartLine, Product } from "@/lib/store";

type Cart = { items: CartLine[]; subtotal: number };
type Order = {
  id: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  status: string;
};

const emptyCart: Cart = { items: [], subtotal: 0 };
const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "The request could not be completed.");
  }
  return body as T;
}

export default function Storefront({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );
  const filtered = useMemo(() => products.filter((product) =>
    (category === "All" || product.category === category) &&
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  ), [category, products, search]);
  const count = cart.items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    void fetch("/api/cart", { cache: "no-store" })
      .then((response) => readResponse<Cart>(response))
      .then((value) => {
        setCart(value);
        setCartReady(true);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Unable to load your cart.");
        setCartReady(true);
      });
  }, []);

  async function updateCart(product: Product, quantity: number) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      setCart(await readResponse<Cart>(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your cart.");
    } finally {
      setBusy(false);
    }
  }

  async function checkout(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          address: formData.get("address"),
        }),
      });
      const placedOrder = await readResponse<Order>(response);
      setOrder(placedOrder);
      setCart(emptyCart);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to place your order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <div className="bg-black py-2 text-center text-xs tracking-widest text-white">
        FREE SHIPPING ON ORDERS OVER ₹1,999
      </div>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-[#faf9f6] px-5 py-5 md:px-12">
        <Link href="/" className="text-2xl font-black tracking-tighter">
          FORM<span className="text-orange-800">/</span>STUDIO
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#shop">Shop</a>
          <a href="#about">Our story</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <label className="flex items-center gap-2">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="w-20 bg-transparent text-sm outline-none sm:w-28"
            />
          </label>
          <button onClick={() => setCartOpen(true)} className="flex items-center gap-2" aria-label={`Open bag, ${count} items`}>
            <ShoppingBag size={21} aria-hidden="true" />
            <span className="text-sm">Bag ({count})</span>
          </button>
        </div>
      </header>

      <section className="grid md:min-h-[510px] md:grid-cols-2">
        <div className="flex flex-col justify-center px-7 py-16 md:px-16">
          <p className="mb-5 text-xs tracking-[0.25em] text-orange-800">THE EVERYDAY COLLECTION</p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tighter md:text-7xl">
            Less noise.<br />Better clothes.
          </h1>
          <p className="mt-5 max-w-sm leading-7 text-neutral-600">
            Everyday essentials. Modern fits, timeless colours, and effortless style.
          </p>
          <a href="#shop" className="mt-8 w-fit bg-black px-7 py-4 text-sm text-white hover:bg-orange-900">
            Explore collection →
          </a>
        </div>
        <div className="relative h-[400px] md:h-full">
          <Image
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=85"
            alt="Fashion collection"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-7xl px-5 py-16 md:px-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs tracking-widest text-orange-800">CURATED FOR YOU</p>
            <h2 className="text-3xl font-semibold">Shop essentials</h2>
          </div>
          <span className="text-sm text-neutral-500">{filtered.length} products</span>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`shrink-0 border px-4 py-2 text-sm ${category === item ? "border-black bg-black text-white" : "border-neutral-300 hover:border-black"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {filtered.map((product) => (
            <article key={product.id} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
                <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </Link>
                <button
                  disabled={busy || !cartReady || product.stock === 0}
                  onClick={() => updateCart(
                    product,
                    (cart.items.find((item) => item.product.id === product.id)?.quantity ?? 0) + 1,
                  )}
                  className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-white py-3 text-sm hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} aria-hidden="true" /> {product.stock === 0 ? "Sold out" : "Add to bag"}
                </button>
              </div>
              <div className="flex justify-between gap-2 pt-4">
                <div>
                  <Link href={`/products/${product.slug}`} className="text-sm font-medium hover:underline">{product.name}</Link>
                  <p className="mt-1 text-xs text-neutral-500">{product.category}</p>
                </div>
                <span className="shrink-0 text-sm">{money(product.price)}</span>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <p className="py-10 text-center">No matching products found.</p>}
        {error && <p className="mt-5 text-center text-sm text-red-800" role="alert">{error}</p>}
      </section>

      <section id="about" className="bg-[#e9e3d9] px-6 py-20 text-center">
        <p className="text-xs tracking-widest text-orange-900">OUR PHILOSOPHY</p>
        <h2 className="mt-5 text-3xl font-medium md:text-5xl">Good clothes don&apos;t need to shout.</h2>
        <p className="mt-5 text-sm text-neutral-600">Versatile pieces. Thoughtful design. Everyday comfort.</p>
      </section>

      <footer className="bg-black px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row">
          <span className="font-black">FORM/STUDIO</span>
          <span className="text-xs text-neutral-400">© 2026 FORM/STUDIO · ORDERS ARE SAVED SECURELY</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setCartOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#faf9f6] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-5">
              <h2 className="text-xl font-semibold">Your bag ({count})</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close shopping bag">Close ✕</button>
            </div>

            {order ? (
              <div className="py-10">
                <p className="text-xs tracking-widest text-orange-800">ORDER PLACED</p>
                <h3 className="mt-3 text-2xl font-semibold">Thank you for your order.</h3>
                <p className="mt-3 text-sm text-neutral-600">Order reference: {order.id}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {order.items.map((item) => (
                    <li key={`${item.name}-${item.quantity}`} className="flex justify-between gap-3">
                      <span>{item.name} × {item.quantity}</span><span>{money(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 flex justify-between border-t pt-4 font-medium">
                  <span>Subtotal</span><span>{money(order.subtotal)}</span>
                </p>
                <p className="mt-4 text-xs text-neutral-500">Your order is recorded. Online payment is not configured.</p>
                <Link href={`/orders/${order.id}`} className="mt-6 inline-block underline">View order confirmation</Link>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  {cart.items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-4 border-b py-5">
                      <div className="relative h-20 w-16 shrink-0 bg-neutral-200">
                        <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <Link href={`/products/${product.slug}`} className="text-sm hover:underline">{product.name}</Link>
                        <p className="mt-2">{money(product.price)}</p>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => updateCart(product, quantity - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                      ><Minus size={16} /></button>
                      <span aria-label={`Quantity ${quantity}`}>{quantity}</span>
                      <button
                        disabled={busy || quantity >= product.stock}
                        onClick={() => updateCart(product, quantity + 1)}
                        aria-label={`Increase ${product.name} quantity`}
                      ><Plus size={16} /></button>
                    </div>
                  ))}
                  {count === 0 && <p className="py-10 text-center text-neutral-500">Your bag is empty.</p>}
                </div>

                {count > 0 && (
                  <form
                    action={checkout}
                    className="border-t pt-5"
                  >
                    <div className="mb-4 flex justify-between">
                      <span>Subtotal</span><span>{money(cart.subtotal)}</span>
                    </div>
                    <label className="mb-3 block text-sm">
                      Full name
                      <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2" />
                    </label>
                    <label className="mb-3 block text-sm">
                      Email
                      <input name="email" required type="email" maxLength={254} autoComplete="email" className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2" />
                    </label>
                    <label className="mb-4 block text-sm">
                      Delivery address
                      <textarea name="address" required minLength={8} maxLength={1000} autoComplete="street-address" rows={3} className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2" />
                    </label>
                    {error && <p className="mb-3 text-sm text-red-800" role="alert">{error}</p>}
                    <button disabled={busy} className="w-full bg-black py-4 text-white disabled:opacity-40">
                      {busy ? "Processing…" : "Place order"}
                    </button>
                    <p className="mt-3 text-center text-xs text-neutral-500">
                      Stock and prices are verified before saving. No online payment is configured.
                    </p>
                  </form>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
