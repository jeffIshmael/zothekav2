"use client";

import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string;
  
  const { data: session } = useSession();
  const [kycDone, setKycDone] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleAgree = () => {
    // We redirect to sign in, and NextAuth will bring them back to this exact page after auth
    if (!session) {
      signIn("google", { callbackUrl: window.location.href });
    } else {
      setAgreed(true);
    }
  };

  const handleDeny = () => {
    setDenied(true);
  };

  const simulateKyc = () => {
    alert("KYC Process Verified!");
    setKycDone(true);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 w-full">
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 text-center shadow-card text-brand-black w-full max-w-xl">
        
        {!denied && !agreed && (
          <div className="mb-6 w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto text-3xl">
            🤝
          </div>
        )}

        {denied ? (
          <>
            <div className="mb-6 w-16 h-16 bg-brand-yellow/10 text-brand-yellow rounded-full flex items-center justify-center mx-auto text-3xl">
              🥺
            </div>
            <h1 className="text-2xl font-bold mb-4">Oh no!</h1>
            <p className="text-muted mb-8">
              Your friend is going to be a bit sad that you couldn't join their package this time.
            </p>
            <button 
              onClick={() => router.push("/app")}
              className="w-full py-4 rounded-xl bg-background border border-border text-brand-black font-semibold hover:bg-gray-50 transition"
            >
              Go to Homepage
            </button>
          </>
        ) : !agreed ? (
          <>
            <h1 className="text-2xl font-bold mb-4">You're Invited!</h1>
            <p className="text-muted mb-8">
              Your friend has invited you to share a Spotify account and split the cost.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleDeny}
                className="flex-1 py-3 rounded-xl border border-brand-red text-brand-red font-semibold hover:bg-brand-red/10 transition"
              >
                Deny
              </button>
              <button 
                onClick={handleAgree}
                className="flex-1 py-3 rounded-xl bg-brand-green text-white font-semibold hover:bg-brand-green-dark transition"
              >
                Proceed
              </button>
            </div>
          </>
        ) : !kycDone ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Verification Required</h1>
            <p className="text-muted mb-8">
              Before you can pay your portion, we need to verify your identity.
            </p>
            <button 
              onClick={simulateKyc}
              className="w-full py-4 rounded-xl bg-brand-green/10 text-brand-green font-semibold hover:bg-brand-green/20 transition"
            >
              Simulate KYC Verification
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Pay Your Portion</h1>
            <p className="text-muted mb-8">
              You are paying your split for the Spotify account.
            </p>
            <div className="bg-brand-black text-white p-5 rounded-xl mb-8 flex items-center justify-between shadow-inner">
              <span className="font-semibold text-white/80">Amount Due:</span>
              <span className="font-bold text-brand-green text-xl">3,000 MWK</span>
            </div>
            <button 
              onClick={() => {
                alert("Payment simulated successfully!");
                router.push("/app/success?solo=true"); // Reusing success page for copayer
              }}
              className="w-full py-4 rounded-xl bg-brand-green text-white font-bold text-lg hover:bg-brand-green-dark transition"
            >
              Simulate Payment
            </button>
          </>
        )}

      </div>
    </div>
  );
}
