"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const goToApp = () => router.replace("/app");

  useEffect(() => {
    if (isAuthenticated) {
      goToApp();
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative flex-[0.54] shrink-0 overflow-hidden bg-brand-green px-6 pb-8 pt-10 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 opacity-20">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-20 w-1.5 origin-bottom rounded-full bg-white"
              style={{ transform: `rotate(${(i - 6.5) * 9}deg)` }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-2xl font-extrabold">
            Z
          </div>
        </div>

        <div className="relative mt-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Zotheka</h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90">
            Netflix, Spotify &amp; more, paid with your mobile money.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Netflix", "Spotify", "Google Play"].map((brand) => (
              <span
                key={brand}
                className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-9 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[36px] bg-surface">
        <div className="flex flex-1 flex-col px-6 pt-8 pb-6">
          <h2 className="text-xl font-extrabold">Create your account</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Sign up in seconds. Track purchases and withdraw USD to MWK anytime.
          </p>

          <div className="mt-auto pt-8 flex flex-col gap-3">
            <button
              onClick={() => signIn("google")}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-[16px] font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
            >
              Continue with Google
            </button>
            <button
              onClick={() => signIn("credentials", { email: "test@zotheka.com" })}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-[16px] font-bold text-brand-black shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
            >
              Mock Login (Dev)
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
