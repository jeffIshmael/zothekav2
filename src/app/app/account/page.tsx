"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { User, CreditCard, Info, FileText, Shield, LogOut, ChevronRight, ExternalLink, AlertTriangle, Share2, Copy, HelpCircle, Lock } from "lucide-react";
import { useAppData } from "@/lib/app-data";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function AccountPage() {
  const router = useRouter();
  const { email, signOut } = useAuth();
  
  const { kycVerified, kycPhone, loading: dataLoading } = useAppData();
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showRewardsInfo, setShowRewardsInfo] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const referralCode = "VHJDGA"; // Mock code
  const referralLink = `${origin}/app/sign-in/${referralCode}`;

  const copyReferral = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied!");
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/app/sign-in");
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-2xl font-extrabold text-brand-black">Account</h1>

      {!kycVerified && !dataLoading && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/10 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="flex-1 text-sm font-semibold text-brand-yellow">Verify your identity to unlock features</p>
          <Link href="/app/kyc" className="shrink-0 text-xs font-bold underline underline-offset-2 text-brand-yellow hover:opacity-80">
            Verify Now
          </Link>
        </div>
      )}

      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">Account</p>
      <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card flex flex-col divide-y divide-border">
        {/* Profile Details */}
        <button
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-brand-black">Profile Details</span>
              {kycVerified === false && (
                <span className="mt-0.5 w-fit rounded-full bg-brand-yellow/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
                  Incomplete
                </span>
              )}
            </div>
          </div>
          {kycVerified === false ? (
            <Link 
              href="/app/kyc" 
              className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-brand-yellow/90"
              onClick={(e) => e.stopPropagation()}
            >
              Verify
            </Link>
          ) : (
            <ChevronRight className="h-5 w-5 text-muted" />
          )}
        </button>

      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">Invite & Earn</p>
      <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card flex flex-col divide-y divide-border">
        <div className="flex flex-col px-4 py-4 hover:bg-background transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <Share2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-brand-black">Invite Friends</span>
                <span className="text-xs font-medium text-muted">Share your link and earn rewards</span>
              </div>
            </div>
            <button 
              onClick={() => setShowRewardsInfo(!showRewardsInfo)} 
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-muted/10 hover:text-brand-black transition"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showRewardsInfo ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="rounded-xl bg-brand-green/10 p-3 text-sm text-brand-green-dark border border-brand-green/20">
              <p><strong>How it works:</strong> Whenever someone signs up using your link, they become your referee. You will earn a <strong>1% reward</strong> on every successful purchase they make on the platform!</p>
            </div>
          </div>
          
          {kycVerified ? (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 truncate rounded-xl bg-background border border-border px-3 py-2.5 text-xs font-mono text-muted">
                {referralLink}
              </div>
              <button 
                onClick={copyReferral}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-green-dark"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 px-4 py-3 text-sm font-semibold text-brand-yellow">
              <Lock className="h-4 w-4" />
              Complete KYC to unlock your invite link
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">Legal & Info</p>
      <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card flex flex-col divide-y divide-border">
        {/* About */}
        <Link
          href="/app/about"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted">
              <Info className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">About Zotheka</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        {/* T&C */}
        <Link
          href="/app/terms"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Terms & Conditions</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        {/* Privacy */}
        <Link
          href="/app/privacy"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Privacy Policy</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        {/* X (Twitter) */}
        <Link
          href="https://x.com/zotheka_xyz"
          target="_blank"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              <XIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-brand-black">Follow us on X</span>
              <span className="text-xs font-medium text-muted">@zotheka_xyz</span>
            </div>
          </div>
          <ExternalLink className="h-5 w-5 text-muted" />
        </Link>

        {/* Contact Us */}
        <Link
          href="https://chat.whatsapp.com/LTDWDk77lSc886A8fPGzgk?mode=gi_t"
          target="_blank"
          className="flex items-center justify-between px-4 py-4 text-left hover:bg-background transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center">
              <Image src="/images/icons8-whatsapp.svg" alt="WhatsApp" width={32} height={32} />
            </div>
            <span className="text-[15px] font-semibold text-brand-black">Contact Us</span>
          </div>
          <ExternalLink className="h-5 w-5 text-muted" />
        </Link>

      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-red/20 bg-brand-red/5 py-4 text-center text-[15px] font-bold text-brand-red transition hover:bg-brand-red/10"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>

      {/* Profile Details Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45">
          <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => setProfileModalOpen(false)} />
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl p-6">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border absolute top-2 left-1/2 -translate-x-1/2" />
            
            <div className="flex items-center justify-between mt-4 mb-6">
              <h2 className="text-xl font-extrabold text-brand-black">Profile Details</h2>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-muted"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Email</p>
                <p className="text-[15px] font-semibold text-brand-black truncate">{email}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Phone Number</p>
                <p className="text-[15px] font-semibold text-brand-black truncate">{kycPhone || "Not set"}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">KYC Status</p>
                  <p className="text-[15px] font-semibold text-brand-black">
                    {kycVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
                {kycVerified ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-white">✓</span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-white">!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}