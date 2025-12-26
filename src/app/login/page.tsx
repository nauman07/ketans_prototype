"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendMagicLink() {
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setMsg(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Prototype uses email OTP (magic link). SMS OTP can be added later.
        </p>

        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-50"
          onClick={sendMagicLink}
          disabled={!email}
        >
          Send login link
        </button>

        {sent && <p className="text-sm">Check your email for the login link.</p>}
        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </div>
    </div>
  );
}
