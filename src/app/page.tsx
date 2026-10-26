import { Suspense } from "react";
import { connection } from "next/server";
import { listProducts } from "@/lib/store";
import Storefront from "@/app/storefront";

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#faf9f6]" />}>
      <StorefrontPage />
    </Suspense>
  );
}

async function StorefrontPage() {
  await connection();
  const products = await listProducts();
  return <Storefront products={products} />;
}
