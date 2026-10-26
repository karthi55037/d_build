import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdminSession } from "@/lib/auth";
import AdminProducts from "./products";
import SignOutButton from "./sign-out-button";

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#faf9f6]" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  if (!(await isAdminSession())) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-[#faf9f6] px-5 py-8 text-neutral-900 md:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b pb-6">
        <div>
          <Link href="/" className="text-xl font-black tracking-tighter">
            FORM<span className="text-orange-800">/</span>STUDIO
          </Link>
          <p className="mt-2 text-sm text-neutral-600">Product management</p>
        </div>
        <SignOutButton />
      </header>
      <AdminProducts />
    </main>
  );
}
