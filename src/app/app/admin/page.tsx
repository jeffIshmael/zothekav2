"use client";

import { useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { Loader2, ArrowRightLeft, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

export default function AdminDashboard() {
  const { email, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Not Full" | "Awaiting Upgrade" | "Completed">("Awaiting Upgrade");
  const [errorMsg, setErrorMsg] = useState("");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS 
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase())
    : ["jeffishmael141@gmail.com", "goodnpaul@gmail.com"];

  if (!authLoading && (!email || !adminEmails.includes(email.toLowerCase()))) {
    notFound();
  }

  // Withdraw State
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [treasury, setTreasury] = useState<any>(null);
  const [withdrawKsh, setWithdrawKsh] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    if (email) {
      fetchPurchases();
      fetchTreasury();
    }
  }, [email]);

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/purchases`, {
        headers: { "X-User-Email": email || "" }
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data);
      } else {
        setErrorMsg("Unauthorized to view dashboard.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreasury = async () => {
    try {
      const res = await fetch(`/api/admin/withdraw?email=${email}`);
      if (res.ok) {
        setTreasury(await res.json());
      }
    } catch (e) {
      console.error("Treasury fetch error", e);
    }
  };

  const handleComplete = async (purchaseId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/purchases/${purchaseId}/complete`, {
        method: "POST",
        headers: { "X-User-Email": email || "" }
      });
      if (res.ok) {
        fetchPurchases(); // refresh
      }
    } catch (e) {
      console.error("Complete error", e);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawKsh || isNaN(Number(withdrawKsh))) return;
    setWithdrawing(true);
    setErrorMsg("");
    try {
      const usdcAmt = Number(withdrawKsh) / (treasury?.indicativeRate || 130);
      const res = await fetch("/api/admin/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amountUsdc: usdcAmt.toFixed(6),
          phone: treasury?.phone,
          providerId: treasury?.network
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdraw failed");
      setWithdrawSuccess(true);
      fetchTreasury();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  // Grouping logic
  const notFull = purchases.filter(p => p.status !== "COMPLETED" && p.joined_peers < p.total_peers);
  const awaitingUpgrade = purchases.filter(p => p.status !== "COMPLETED" && (!p.is_peer || p.joined_peers >= p.total_peers));
  const completed = purchases.filter(p => p.status === "COMPLETED");

  const currentList = activeTab === "Not Full" ? notFull : activeTab === "Awaiting Upgrade" ? awaitingUpgrade : completed;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-black">Admin Dashboard</h1>
          <p className="text-muted">Manage Spotify purchases and treasury.</p>
        </div>
        
        {treasury && (
          <div className="flex items-center gap-4 rounded-2xl bg-brand-gray/30 p-4 border border-border">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Treasury (USDC)</p>
              <p className="text-xl font-black text-brand-black">${treasury.balanceUsdc?.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => { setShowWithdraw(true); setWithdrawSuccess(false); setErrorMsg(""); setWithdrawKsh(""); }}
              className="rounded-full bg-brand-green px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-green-dark shadow-sm flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" /> Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border mb-6 no-scrollbar">
        {["Not Full", "Awaiting Upgrade", "Completed"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`whitespace-nowrap py-3 px-6 text-sm font-bold transition ${activeTab === tab ? "border-b-2 border-brand-green text-brand-green" : "text-muted hover:text-brand-black"}`}
          >
            {tab}
            {tab === "Awaiting Upgrade" && awaitingUpgrade.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                {awaitingUpgrade.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted">
            No orders found in this category.
          </div>
        ) : (
          currentList.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-brand-black">{p.product_name}</h3>
                    {p.is_peer ? (
                       <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Group</span>
                    ) : (
                       <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Solo</span>
                    )}
                  </div>
                  <p className="text-sm text-muted">Initiator: {p.initiator_email}</p>
                </div>
                
                <div className="text-left md:text-right">
                  <p className="text-sm font-bold text-brand-black">{p.total_amount_mwk.toLocaleString()} MWK Total</p>
                  {p.is_peer && (
                    <p className={`text-xs font-bold ${p.joined_peers >= p.total_peers ? "text-brand-green" : "text-brand-yellow"}`}>
                      {p.joined_peers} / {p.total_peers} Members Paid
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-brand-gray/30 p-4 mb-4">
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Target Account (Initiator)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted mb-1">Spotify Email</p>
                    <div className="flex items-center gap-2">
                       <p className="font-semibold text-brand-black truncate">{p.target_email}</p>
                       <CopyBtn text={p.target_email} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Spotify Password</p>
                    <div className="flex items-center gap-2">
                       <p className="font-mono text-sm bg-white border border-border px-2 py-0.5 rounded-md text-brand-black truncate">
                         {p.target_password || "N/A"}
                       </p>
                       {p.target_password && <CopyBtn text={p.target_password} />}
                    </div>
                  </div>
                </div>
              </div>

              {p.is_peer && p.participants && p.participants.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Group Members (Invite These)</p>
                  <div className="space-y-2">
                    {p.participants.map((pt: any) => (
                      <div key={pt.id} className="flex items-center justify-between bg-brand-gray/10 rounded-lg p-3 text-sm">
                        <div>
                          <p className="font-bold text-brand-black">{pt.user_email}</p>
                          <p className="text-muted text-xs">Spotify: {pt.target_email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{pt.amount_mwk.toLocaleString()} MWK</span>
                          <CopyBtn text={pt.target_email} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Awaiting Upgrade" && (
                <div className="flex justify-end border-t border-border pt-4">
                  <button
                    onClick={() => handleComplete(p.id)}
                    className="rounded-full bg-brand-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-brand-black mb-1">Withdraw to KSH</h2>
            <p className="text-sm text-muted mb-6">Funds will be sent to your Safaricom M-PESA ({treasury?.phone}).</p>
            
            {withdrawSuccess ? (
               <div className="text-center py-6">
                 <CheckCircle2 className="w-16 h-16 text-brand-green mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-brand-black mb-2">Withdrawal Initiated!</h3>
                 <p className="text-sm text-muted mb-6">Your transaction has been submitted to ElementPay and the blockchain.</p>
                 <button onClick={() => setShowWithdraw(false)} className="w-full rounded-full bg-brand-black px-4 py-3 font-bold text-white">Close</button>
               </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Amount in KES</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-bold text-brand-black">KSh</span>
                    <input 
                      type="number" 
                      value={withdrawKsh}
                      onChange={(e) => setWithdrawKsh(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl bg-brand-gray/30 py-3 pl-14 pr-4 font-black text-brand-black outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  {withdrawKsh && (
                    <p className="mt-2 text-xs font-medium text-brand-green">
                      Estimated Cost: ~{(Number(withdrawKsh) / (treasury?.indicativeRate || 130)).toFixed(2)} USDC
                    </p>
                  )}
                </div>

                {errorMsg && (
                   <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-red-600">
                     <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                     <p className="text-xs font-bold">{errorMsg}</p>
                   </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowWithdraw(false)} className="flex-1 rounded-full bg-brand-gray/50 py-3 font-bold text-brand-black hover:bg-brand-gray">
                    Cancel
                  </button>
                  <button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawKsh}
                    className="flex-1 rounded-full bg-brand-green py-3 font-bold text-white hover:bg-brand-green-dark disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button 
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 hover:bg-brand-black/10 rounded-md transition text-muted hover:text-brand-black"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
