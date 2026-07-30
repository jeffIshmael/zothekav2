"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Users, Calendar, Coins, Wallet, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePrivy } from "@privy-io/react-auth";
import { useAppData } from "@/lib/app-data";

export default function ReferralsDashboard() {
  const { getAccessToken } = usePrivy();
  const { kycWalletAddress, rate } = useAppData();
  
  const [stats, setStats] = useState({
    total_referrals: 0,
    today_referrals: 0,
    referred_emails: [] as string[],
    total_earnings_mwk: 0,
  });
  
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getAccessToken();
        if (!token) return;

        // Fetch referral stats
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/users/referral_stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }

        // Fetch USDC balance if wallet address exists
        if (kycWalletAddress) {
          const balRes = await fetch(`/api/usdc-balance?address=${kycWalletAddress}`);
          if (balRes.ok) {
            const balData = await balRes.json();
            setUsdcBalance(balData.balance || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load referral stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [getAccessToken, kycWalletAddress]);

  const usdcValueInMwk = usdcBalance * rate;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-border">
        <Link href="/app/account" className="flex items-center justify-center w-10 h-10 rounded-full bg-surface hover:bg-muted/10 transition text-brand-black">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[17px] font-bold text-brand-black">Referral Earnings</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 pt-6 space-y-6">
        
        <div className="rounded-2xl bg-brand-green/10 p-4 border border-brand-green/20">
          <p className="text-sm font-medium text-brand-green-dark">
            <strong>Note:</strong> You will get a <strong>1% reward</strong> of the payment amount of the people you refer! Share your link to grow your earnings.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-surface rounded-2xl w-full"></div>
            <div className="h-24 bg-surface rounded-2xl w-full"></div>
            <div className="h-48 bg-surface rounded-2xl w-full"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface p-4 border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 text-brand-green">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Total referrals</span>
                </div>
                <div className="mt-3 text-2xl font-black text-brand-black">
                  {stats.total_referrals}
                </div>
              </div>

              <div className="rounded-2xl bg-surface p-4 border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 text-brand-yellow">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s referrals</span>
                </div>
                <div className="mt-3 text-2xl font-black text-brand-black">
                  {stats.today_referrals}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-black p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/10 to-transparent opacity-50"></div>
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center gap-2 text-white/70">
                  <Coins className="h-4 w-4 text-brand-yellow" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Estimated Total Earnings</span>
                </div>
                <div className="mt-2 text-3xl font-black text-white">
                 {stats.total_earnings_mwk.toLocaleString()} MWK
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-green-dark p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 to-transparent opacity-50"></div>
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center gap-2 text-white/70">
                  <Wallet className="h-4 w-4 text-brand-green" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Balance</span>
                </div>
                <div className="mt-2 flex flex-col">
                  <span className="text-3xl font-black text-white">
                    {usdcValueInMwk.toLocaleString()} MWK
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Your Network</p>
              <div className="rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border">
                {stats.referred_emails.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm font-medium text-muted">
                    No referrals yet. Share your link to get started!
                  </div>
                ) : (
                  stats.referred_emails.map((email, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-black/5 text-brand-black/50">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="text-[15px] font-medium text-brand-black">{email}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
