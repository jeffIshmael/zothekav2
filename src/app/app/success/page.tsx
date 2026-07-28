"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const invite = searchParams?.get("invite");
  const split = searchParams?.get("split");
  const isSolo = searchParams?.get("solo");

  const [origin, setOrigin] = useState("");
  const [showToast, setShowToast] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteLink = `${origin}/app/invite/${invite}`;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 text-center shadow-card">
      <div className="mb-6 mx-auto w-16 h-16 bg-brand-green/10 text-brand-green flex items-center justify-center rounded-full text-3xl">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-extrabold mb-4 text-brand-black">Payment Successful!</h2>
      
      {isSolo ? (
        <p className="text-muted text-lg max-w-md mx-auto">
          Your Spotify account details have been securely stored. Our team is processing your upgrade.
        </p>
      ) : (
        <>
          <p className="text-muted text-lg max-w-md mx-auto mb-8">
            You've paid your portion of <strong>{split} MWK</strong>. Now, invite your friends to pay the rest!
          </p>

          <div className="bg-brand-black border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-mono text-brand-green truncate max-w-full">
              {inviteLink}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                setShowToast("Copied to clipboard!");
                setTimeout(() => setShowToast(""), 3000);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 transition rounded-lg text-sm font-semibold shrink-0 text-white"
            >
              Copy Link
            </button>
          </div>
        </>
      )}

      <div className="mt-10">
        <a href="/app" className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-brand-green px-8 py-3.5 font-bold text-white transition hover:bg-brand-green-dark">
          Return to Dashboard
        </a>
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-black text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 z-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {showToast}
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="px-4 pt-8 max-w-3xl mx-auto w-full">
      <Suspense fallback={<div className="text-center p-10 text-white">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
