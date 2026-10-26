import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import AddToCartButton from "@/app/products/[slug]/add-to-cart-button";
import { findProductBySlug } from "@/lib/store";

export default function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#faf9f6]" />}>
      <ProductDetailsContent params={params} />
    </Suspense>
  );
}

async function ProductDetailsContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <header className="flex items-center justify-between border-b px-5 py-5 md:px-12">
        <Link href="/" className="text-2xl font-black tracking-tighter">
          FORM<span className="text-orange-800">/</span>STUDIO
        </Link>
        <Link href="/#shop" className="text-sm underline">Back to shop</Link>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2 md:py-16">
        <div className="relative min-h-[420px] bg-neutral-200 md:min-h-[650px]">
          <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs tracking-[0.25em] text-orange-800">{product.category.toUpperCase()}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl">₹{product.price.toLocaleString("en-IN")}</p>
          <p className="mt-6 max-w-lg leading-7 text-neutral-600">{product.description}</p>
          <p className="mt-5 text-sm text-neutral-500">
            {product.stock > 0 ? `${product.stock} in stock` : "Currently sold out"}
          </p>
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </section>
    </main>
  );
}
