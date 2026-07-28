"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/app-data";

const KSH_TO_USD_RATE = 130;
const CONCIERGE_FEE_USD = 1;
const CONCIERGE_FEE_INTERVAL = 5;

const SPOTIFY_PACKAGES = [
  { id: "individual", name: "Individual", priceKsh: 470, desc: "1 Premium account", maxUsers: 1 },
  { id: "student", name: "Student", priceKsh: 260, desc: "1 verified Premium account", maxUsers: 1 },
  { id: "duo", name: "Duo", priceKsh: 600, desc: "2 Premium accounts", maxUsers: 2 },
  { id: "family", name: "Family", priceKsh: 720, desc: "Up to 6 Premium accounts", maxUsers: 6 },
];

export default function HomePage() {
  const { user } = usePrivy();
  const { client } = useSmartWallets();
  const { email } = useAuth();
  const { rate, kycVerified, kycFirstName, kycPhone } = useAppData();
  const router = useRouter();



  const [targetEmail, setTargetEmail] = useState("");
  const [targetPassword, setTargetPassword] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState("individual");
  const [isSolo, setIsSolo] = useState(true);
  const [friendsCount, setFriendsCount] = useState(2);
  const [paying, setPaying] = useState(false);
  const [paymentPrompting, setPaymentPrompting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedBatchId, setGeneratedBatchId] = useState("");
  const [showToast, setShowToast] = useState(false);

  const selectedPkg = SPOTIFY_PACKAGES.find((p) => p.id === selectedPkgId)!;
  const baseUsd = selectedPkg.priceKsh / KSH_TO_USD_RATE;
  const serviceFeeUsd = Math.max(1, Math.floor(baseUsd / CONCIERGE_FEE_INTERVAL)) * CONCIERGE_FEE_USD;
  const totalUsd = baseUsd + serviceFeeUsd;

  const baseMwk = Math.ceil(baseUsd * rate);
  const serviceFeeMwk = Math.ceil(serviceFeeUsd * rate);
  const totalMwk = baseMwk + serviceFeeMwk;

  const members = isSolo ? 1 : friendsCount;
  const splitMwk = Math.ceil(totalMwk / members);

  // If a package is changed, ensure the friendsCount is within bounds
  useEffect(() => {
    if (!isSolo && selectedPkg.maxUsers === 1) {
      setIsSolo(true);
    } else if (!isSolo && friendsCount > selectedPkg.maxUsers) {
      setFriendsCount(selectedPkg.maxUsers);
    }
  }, [selectedPkgId, isSolo, friendsCount, selectedPkg.maxUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetPassword) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    // Bypassing KYC check for demo purposes
    // if (kycVerified === false) {
    //   setVerifyModalOpen(true);
    //   return;
    // }

    setPaying(true);
    setErrorMsg("");
    setPaymentPrompting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_ZOTHEKA_WEB_URL?.replace(/\/$/, "") ?? "http://localhost:5000";
      const payload = {
        productName: selectedPkg.name,
        targetEmail,
        targetPassword,
        amountMwk: totalMwk,
        isPeer: !isSolo,
        totalPeers: members
      };

      const res = await fetch(`${baseUrl}/api/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": email || ""
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to initiate purchase.");
      }

      const data = await res.json();
      const purchaseId = data.purchaseId;
      if (!isSolo) {
        setGeneratedBatchId(data.batchId);
      }

      // Poll for payment success
      const checkStatus = async () => {
        const pollRes = await fetch(`${baseUrl}/api/purchases/${purchaseId}`, {
          headers: {
            "X-User-Email": email || ""
          }
        });
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          // Find our participant record
          const myParticipant = pollData.participants?.find((p: any) => p.email === email);
          if (myParticipant) {
            if (myParticipant.status === "PAID") {
              return true; // Success
            }
            if (myParticipant.status === "FAILED") {
              throw new Error("Payment failed or was cancelled.");
            }
          }
        }
        return false;
      };

      let attempts = 0;
      let success = false;
      while (attempts < 20 && !success) { // Poll for ~1 minute
        success = await checkStatus();
        if (success) break;
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }

      if (!success) {
        throw new Error("Payment timeout. Please check your transaction history.");
      }

      setPaymentPrompting(false);
      
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Always show success modal now
      setShowSuccessModal(true);
      
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      setPaymentPrompting(false);
    } finally {
      setPaying(false);
    }
  };

  const isMalawian = kycPhone && (kycPhone.startsWith("+265") || kycPhone.startsWith("265") || kycPhone.startsWith("0"));
  // Bypassing KYC check for demo purposes
  const isFormValid = targetEmail.trim().length > 0 && targetPassword.length > 0;

  const displayName = kycFirstName || (email ? email.split("@")[0] : "there");

  return (
    <div className="px-4 pt-4 pb-20">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-green text-sm font-extrabold text-white overflow-hidden">
            <Image src="/images/icon.png" alt="Zotheka" width={36} height={36} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Zotheka</p>
            <p className="text-sm font-bold text-brand-black leading-tight">
              Hello, {displayName} 👋
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (kycVerified === false) setVerifyModalOpen(true);
          }}
          className="relative flex items-center transition hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-bold uppercase text-white border border-border">
            {email ? email.charAt(0).toUpperCase() : "U"}
          </div>
          {kycVerified === false && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-yellow text-[9px] font-black text-white ring-2 ring-background">
              !
            </span>
          )}
        </button>
      </header>



      <div className="mb-6 rounded-2xl bg-surface p-4 shadow-card border border-border">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
            <Image src="/images/spotify.webp" alt="Spotify" width={48} height={48} className="object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-black">Spotify Premium</h2>
            <p className="text-sm text-muted">Manual upgrade & sharing</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted leading-relaxed">
          Provide your login details securely. We will manually upgrade your account. You can pay solo or split the cost with peers!
        </p>

        {(!kycVerified || (kycPhone && !isMalawian)) && (
          <div className="mt-3 rounded-lg bg-brand-yellow/20 p-2 text-xs font-semibold text-brand-black">
            {!kycVerified
              ? "You must complete KYC verification to use this service."
              : "This service is optimized for Malawian numbers."}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-brand-black">Login Details</label>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="Spotify Email"
            disabled={paying}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-green"
          />
          <input
            type="password"
            value={targetPassword}
            onChange={(e) => setTargetPassword(e.target.value)}
            placeholder="Spotify Password"
            disabled={paying}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-brand-black">Select Package</label>
          <div className="grid grid-cols-2 gap-3">
            {SPOTIFY_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`relative flex flex-col items-start justify-center rounded-xl border p-4 text-left transition overflow-hidden ${selectedPkgId === pkg.id
                    ? "border-brand-green bg-brand-green/10"
                    : "border-border bg-surface hover:border-brand-green/50"
                  }`}
              >
                {selectedPkgId === pkg.id && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="font-bold text-brand-black mt-1 pr-6">{pkg.name}</span>
                <span className="text-[10px] text-muted">{pkg.desc}</span>
                <span className="mt-2 text-xs font-bold text-brand-green">
                  {((pkg.priceKsh / KSH_TO_USD_RATE) * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK / mo
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedPkg.maxUsers > 1 && (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-brand-black">Payment Option</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsSolo(true)}
                className={`flex-1 rounded-xl border p-3 text-sm font-bold transition ${isSolo ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-border bg-surface text-brand-black"}`}
              >
                Pay Solo
              </button>
              <button
                type="button"
                onClick={() => setIsSolo(false)}
                className={`flex-1 rounded-xl border p-3 text-sm font-bold transition ${!isSolo ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-border bg-surface text-brand-black"}`}
              >
                Split with Peers
              </button>
            </div>

            {!isSolo && (
              <div className="mt-3 rounded-xl border border-border bg-surface p-4">
                <label className="mb-2 block text-xs font-bold text-muted">Total members (including you)</label>
                <div className="relative">
                  <select
                    value={friendsCount}
                    onChange={(e) => setFriendsCount(parseInt(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 pr-10 text-sm font-bold text-brand-black outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  >
                    {Array.from({ length: selectedPkg.maxUsers - 1 }).map((_, i) => {
                      const count = i + 2;
                      return (
                        <option key={count} value={count}>
                          {count} members
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted font-medium">Package Cost</span>
            <span className="font-bold">{baseMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK</span>
          </div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted font-medium">Processing Fee</span>
            <span className="font-bold">{serviceFeeMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-bold text-brand-black">Total Amount</span>
            <span className={isSolo ? "text-lg font-black text-brand-green" : "font-black text-brand-black"}>
              {totalMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK
            </span>
          </div>
          {!isSolo && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand-black">Your Share</span>
                <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-black uppercase text-brand-green">
                  ÷ {members} Peers
                </span>
              </div>
              <span className="text-lg font-black text-brand-green">
                {splitMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-500">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={paying || !isFormValid}
          className="w-full rounded-full bg-brand-green px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-50 flex flex-col items-center justify-center"
        >
          {paying ? (
            "Processing..."
          ) : !isFormValid ? (
            "Fill details to pay"
          ) : (
            <>
              <span>Pay {splitMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK</span>
              {kycPhone && <span className="text-[10px] font-medium text-white/80">via {kycPhone}</span>}
            </>
          )}
        </button>
      </form>

      {paymentPrompting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-xl">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-brand-green border-t-transparent"></div>
            <h3 className="text-xl font-bold text-brand-black">Check Your Phone</h3>
            <p className="mt-2 text-sm text-muted">
              A prompt for <strong>{splitMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWK</strong> has been sent to your registered mobile money number. Enter your PIN to complete the payment.
            </p>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-xl relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20">
              <svg className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-black">Payment Successful</h3>
            
            {isSolo ? (
              <p className="mt-2 text-sm text-muted">
                Your details have been received and are in line for processing. You will see the update in your purchases shortly.
              </p>
            ) : (
              <div className="mt-4 flex flex-col items-center">
                <p className="text-sm font-semibold text-brand-black mb-1">Waiting for others to join</p>
                <div className="flex w-full overflow-hidden rounded-full bg-brand-green/20 h-2.5 mb-2">
                  <div className="bg-brand-green h-full" style={{ width: `${(1 / members) * 100}%` }}></div>
                </div>
                <p className="text-xs font-bold text-brand-green">1 out of {members} peers joined</p>
                <p className="mt-3 text-xs text-muted">
                  Your purchase will be processed as soon as all peers have paid their portion.
                </p>
                {generatedBatchId && (
                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}/app/invite/${generatedBatchId}`;
                      navigator.clipboard.writeText(link);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 2500);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green/10 py-2.5 text-sm font-bold text-brand-green transition hover:bg-brand-green/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Invite Link
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/app/purchases");
              }}
              className="mt-6 w-full rounded-full bg-brand-green px-4 py-3 font-bold text-white transition hover:bg-brand-green-dark"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-brand-black"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-brand-black mb-2">Verify Account</h3>
            <p className="text-sm text-muted mb-6">
              You need to verify your identity to unlock features.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/app/kyc"
                className="w-full rounded-full bg-brand-yellow px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-yellow/90"
              >
                Verify Now
              </Link>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="w-full rounded-full px-4 py-3 text-sm font-bold text-muted transition hover:bg-background"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-brand-black px-4 py-2 text-sm font-bold text-white shadow-lg animate-in fade-in slide-in-from-bottom-5">
          Invite link copied!
        </div>
      )}
    </div>
  );
}