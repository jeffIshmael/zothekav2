"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReferralSignInPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const ref = params?.ref as string;
    if (ref) {
      // Save the referral code to localStorage to be picked up during sign-in
      localStorage.setItem("zotheka_referrer", ref);
    }
    // Redirect to the actual sign-in page
    router.replace("/app/sign-in");
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-green">
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl border border-white/25 bg-white/15 text-2xl font-extrabold text-white">
        Z
      </div>
    </div>
  );
}
