import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { adminAuthConfigured, isAdminSession } from "@/lib/auth";
import AdminLoginForm from "./login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#faf9f6]" />}>
      <AdminLoginContent />
    </Suspense>
  );
}

async function AdminLoginContent() {
  if (await isAdminSession()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5 py-12 text-neutral-900">
      <section className="w-full max-w-md border border-neutral-200 bg-white p-8">
        <Link href="/" className="text-xl font-black tracking-tighter">
          FORM<span className="text-orange-800">/</span>STUDIO
        </Link>
        <h1 className="mt-8 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-2 text-sm text-neutral-600">Sign in to manage the store catalog.</p>
        {!adminAuthConfigured() && (
          <p className="mt-5 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Admin sign-in is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and SESSION_SECRET in the server environment.
          </p>
        )}
        <AdminLoginForm enabled={adminAuthConfigured()} />
        <Link href="/" className="mt-6 inline-block text-sm underline">Back to shop</Link>
      </section>
    </main>
  );
}
