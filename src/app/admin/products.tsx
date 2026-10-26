"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product, ProductInput } from "@/lib/store";

type ManagedProduct = Product & { active: boolean };

const blankProduct: ProductInput = {
  name: "",
  slug: "",
  category: "T-Shirts",
  description: "",
  price: 0,
  stock: 0,
  image: "",
};

async function jsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Request failed.");
  }
  return body as T;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [form, setForm] = useState<ProductInput>(blankProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadProducts() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    setProducts(await jsonResponse<ManagedProduct[]>(response));
  }

  useEffect(() => {
    void fetch("/api/admin/products", { cache: "no-store" })
      .then((response) => jsonResponse<ManagedProduct[]>(response))
      .then(setProducts)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Unable to load products.");
      });
  }, []);

  function resetForm() {
    setForm(blankProduct);
    setEditingId(null);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
          }),
        },
      );
      await jsonResponse<unknown>(response);
      resetForm();
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  }

  function editProduct(product: ManagedProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeProduct(product: ManagedProduct) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      await jsonResponse<unknown>(response);
      if (editingId === product.id) resetForm();
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete product.");
    }
  }

  function updateField<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-10 py-8 lg:grid-cols-[minmax(280px,380px)_1fr]">
      <form onSubmit={saveProduct} className="h-fit space-y-4 border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold">{editingId ? "Edit product" : "Add product"}</h1>
        <label className="block text-sm">
          Name
          <input required minLength={2} maxLength={120} value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full border px-3 py-2" />
        </label>
        <label className="block text-sm">
          URL slug (optional)
          <input maxLength={140} value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="generated-from-name" className="mt-1 w-full border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Category
          <select value={form.category} onChange={(event) => updateField("category", event.target.value)} className="mt-1 w-full border bg-white px-3 py-2">
            {["T-Shirts", "Jeans", "Hoodies", "Jackets", "Shirts", "Trousers"].map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Description
          <textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} className="mt-1 w-full border px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Price (₹)
            <input required type="number" min={0} step={1} value={form.price} onChange={(event) => updateField("price", Number(event.target.value))} className="mt-1 w-full border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Stock
            <input required type="number" min={0} max={100000} step={1} value={form.stock} onChange={(event) => updateField("stock", Number(event.target.value))} className="mt-1 w-full border px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm">
          Unsplash image URL
          <input required type="url" value={form.image} onChange={(event) => updateField("image", event.target.value)} className="mt-1 w-full border px-3 py-2" />
        </label>
        {error && <p className="text-sm text-red-800" role="alert">{error}</p>}
        <div className="flex gap-3">
          <button disabled={busy} className="flex-1 bg-black py-3 text-white disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Save changes" : "Create product"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="border px-4">Cancel</button>}
        </div>
      </form>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Products</h2>
          <span className="text-sm text-neutral-500">{products.length} total</span>
        </div>
        <div className="space-y-3">
          {products.map((product) => (
            <article key={product.id} className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-20 shrink-0 bg-neutral-100">
                <Image src={product.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-neutral-500">{product.category} · ₹{product.price.toLocaleString("en-IN")} · Stock {product.stock}</p>
                <p className="break-all text-xs text-neutral-400">/{product.slug}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <button onClick={() => editProduct(product)} className="underline">Edit</button>
                <button onClick={() => removeProduct(product)} className="text-red-800 underline">Delete</button>
              </div>
            </article>
          ))}
          {products.length === 0 && !error && <p className="border border-neutral-200 bg-white p-6 text-sm text-neutral-600">No products found.</p>}
        </div>
      </div>
    </section>
  );
}
