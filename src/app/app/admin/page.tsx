"use client";

import { useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import {
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Activity,
  Clock,
  Wallet,
} from "lucide-react";

export default function AdminDashboard() {
  const { email, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Not Full" | "Awaiting Upgrade" | "Completed">("Awaiting Upgrade");
  const [errorMsg, setErrorMsg] = useState("");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase())
    : ["jeffishmael141@gmail.com", "goodingispaul@gmail.com"];

  if (!authLoading && (!email || !adminEmails.includes(email.toLowerCase()))) {
    notFound();
  }

  // Withdraw state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [treasury, setTreasury] = useState<any>(null);
  const [withdrawKsh, setWithdrawKsh] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Activity log state
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    if (email) {
      fetchPurchases();
      fetchTreasury();
      fetchActivity();
    }
  }, [email]);

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/purchases`, {
        headers: { "X-User-Email": email || "" },
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

  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: { "X-User-Email": email || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setActivity(data);
      } else {
        setActivityError("Couldn't load admin activity.");
      }
    } catch (e) {
      console.error("Activity fetch error", e);
      setActivityError("Couldn't load admin activity.");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleComplete = async (purchaseId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/purchases/${purchaseId}/complete`, {
        method: "POST",
        headers: { "X-User-Email": email || "" },
      });
      if (res.ok) {
        fetchPurchases();
        fetchActivity();
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
          providerId: treasury?.network,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdraw failed");
      setWithdrawSuccess(true);
      fetchTreasury();
      fetchActivity();
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

  const tabs: { label: typeof activeTab; count?: number }[] = [
    { label: "Not Full", count: notFull.length },
    { label: "Awaiting Upgrade", count: awaitingUpgrade.length },
    { label: "Completed", count: completed.length },
  ];

  const currentList = activeTab === "Not Full" ? notFull : activeTab === "Awaiting Upgrade" ? awaitingUpgrade : completed;

  const kshBalance = treasury?.balanceUsdc != null ? treasury.balanceUsdc * (treasury?.indicativeRate || 130) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-green">Operations</p>
          <h1 className="text-3xl font-black tracking-tight text-brand-black">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Manage Spotify purchases, treasury, and team activity.</p>
        </div>

        {treasury && (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">
              <Wallet className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Treasury</p>
              <p className="text-xl font-black leading-tight text-brand-black">
                ${treasury.balanceUsdc?.toFixed(2)}
                <span className="ml-1 text-xs font-bold text-muted">USDC</span>
              </p>
              {kshBalance != null && (
                <p className="text-xs font-semibold text-muted">
                  ≈ KSh {kshBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setShowWithdraw(true);
                setWithdrawSuccess(false);
                setErrorMsg("");
                setWithdrawKsh("");
              }}
              className="flex shrink-0 items-center gap-2 rounded-full bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green-dark"
            >
              <ArrowRightLeft className="h-4 w-4" /> Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.label
                ? "bg-brand-black text-white"
                : "bg-brand-gray/30 text-muted hover:bg-brand-gray/50 hover:text-brand-black"
            }`}
          >
            {tab.label}
            {!!tab.count && (
              <span
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] ${
                  activeTab === tab.label ? "bg-white/20 text-white" : "bg-brand-black/10 text-brand-black"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted">
            No orders found in this category.
          </div>
        ) : (
          currentList.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-lg font-black text-brand-black">{p.product_name}</h3>
                    {p.is_peer ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Group
                      </span>
                    ) : (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                        Solo
                      </span>
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

              <div className="mb-4 rounded-xl bg-brand-gray/30 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Target Account (Initiator)</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-muted">Spotify Email</p>
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-brand-black">{p.target_email}</p>
                      <CopyBtn text={p.target_email} />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted">Spotify Password</p>
                    <div className="flex items-center gap-2">
                      <p className="truncate rounded-md border border-border bg-white px-2 py-0.5 font-mono text-sm text-brand-black">
                        {p.target_password || "N/A"}
                      </p>
                      {p.target_password && <CopyBtn text={p.target_password} />}
                    </div>
                  </div>
                </div>
              </div>

              {p.is_peer && p.participants && p.participants.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Group Members (Invite These)</p>
                  <div className="space-y-2">
                    {p.participants.map((pt: any) => (
                      <div key={pt.id} className="flex items-center justify-between rounded-lg bg-brand-gray/10 p-3 text-sm">
                        <div>
                          <p className="font-bold text-brand-black">{pt.user_email}</p>
                          <p className="text-xs text-muted">Spotify: {pt.target_email}</p>
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

      {/* Admin Activity Log */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-green" />
          <h2 className="text-lg font-black text-brand-black">Admin Activity</h2>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          {activityLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : activityError ? (
            <div className="flex items-center gap-2 px-5 py-8 text-sm text-muted">
              <AlertCircle className="h-4 w-4" /> {activityError}
            </div>
          ) : activity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">No admin activity recorded yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((a, i) => (
                <li key={a.id ?? i} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gray/40 text-xs font-black text-brand-black">
                    {a.admin_email?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-black">
                      <span className="font-bold">{a.admin_email}</span> {a.action}
                      {a.detail ? <span className="text-muted"> — {a.detail}</span> : null}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-2xl font-black text-brand-black">Withdraw to KSH</h2>
            <p className="mb-6 text-sm text-muted">Funds will be sent to your Safaricom M-PESA ({treasury?.phone}).</p>

            {withdrawSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-brand-green" />
                <h3 className="mb-2 text-xl font-bold text-brand-black">Withdrawal Initiated!</h3>
                <p className="mb-6 text-sm text-muted">Your transaction has been submitted to ElementPay and the blockchain.</p>
                <button onClick={() => setShowWithdraw(false)} className="w-full rounded-full bg-brand-black px-4 py-3 font-bold text-white">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Amount in KES</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-bold text-brand-black">KSh</span>
                    <input
                      type="number"
                      value={withdrawKsh}
                      onChange={e => setWithdrawKsh(e.target.value)}
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
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-xs font-bold">{errorMsg}</p>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button onClick={() => setShowWithdraw(false)} className="flex-1 rounded-full bg-brand-gray/50 py-3 font-bold text-brand-black hover:bg-brand-gray">
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawKsh}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-green py-3 font-bold text-white hover:bg-brand-green-dark disabled:opacity-50"
                  >
                    {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
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
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-md p-1.5 text-muted transition hover:bg-brand-black/10 hover:text-brand-black"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}