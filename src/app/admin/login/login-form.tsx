"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm({ enabled }: { enabled: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Sign-in failed.");
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="mt-6 space-y-4">
      <label className="block text-sm">
        Username
        <input
          name="username"
          required
          maxLength={128}
          autoComplete="username"
          disabled={!enabled || busy}
          className="mt-1 w-full border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          maxLength={1024}
          autoComplete="current-password"
          disabled={!enabled || busy}
          className="mt-1 w-full border border-neutral-300 px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-800" role="alert">{error}</p>}
      <button
        disabled={!enabled || busy}
        className="w-full bg-black py-3 text-white disabled:opacity-40"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
