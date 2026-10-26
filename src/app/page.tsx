import { Suspense } from "react";
import { connection } from "next/server";
import { MongoServerSelectionError } from "mongodb";
import { getPreviewProducts, listProducts, type Product } from "@/lib/store";
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
  let products: Product[];
  let readOnly = false;
  try {
    products = await listProducts();
  } catch (error) {
    if (!(error instanceof MongoServerSelectionError)) {
      throw error;
    }
    console.error("MongoDB is unavailable; showing the read-only catalog preview.", error);
    products = getPreviewProducts();
    readOnly = true;
  }
  return <Storefront products={products} readOnly={readOnly} />;
}
