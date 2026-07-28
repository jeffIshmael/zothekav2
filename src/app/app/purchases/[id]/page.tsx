"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";
import type { Purchase } from "../page";

type Participant = {
  email: string;
  amount_mwk: number;
  paid_at: string | null;
  status: string;
};

type PurchaseDetail = Purchase & {
  participants: Participant[];
};

export default function PurchaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { email } = useAuth();
  
  const id = params?.id as string;
  
  const [order, setOrder] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    
    async function fetchPurchase() {
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const baseUrl = process.env.NEXT_PUBLIC_ZOTHEKA_WEB_URL?.replace(/\/$/, "") ?? "";
        const res = await fetch(`${baseUrl}/api/purchases/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": email
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setOrder(data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch purchase", e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPurchase();
  }, [id, email]);

  const copyLink = () => {
    if (!order?.batch_id) return;
    const inviteLink = `${origin}/app/invite/${order.batch_id}`;
    navigator.clipboard.writeText(inviteLink);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sliceEmail = (emailStr: string) => {
    if (!emailStr) return "Anonymous";
    const parts = emailStr.split("@");
    if (parts.length !== 2) return emailStr;
    const [local, domain] = parts;
    if (local.length <= 5) return emailStr;
    const firstFive = local.slice(0, 5);
    const lastThree = local.length > 8 ? local.slice(-3) : local.slice(5);
    return `${firstFive}...${lastThree}@${domain}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 pt-12 text-center">
        <h1 className="text-xl font-bold">Purchase not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-brand-green font-semibold">
          ← Go back
        </button>
      </div>
    );
  }

  const dateStr = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  let detailedStatus = "Pending Payment";
  if (order.status === "COMPLETED") {
    detailedStatus = "Paid";
  } else if (order.is_peer && order.joined_peers !== undefined && order.total_peers !== undefined && order.joined_peers < order.total_peers) {
    detailedStatus = "Waiting to Fill";
  }

  return (
    <div className="px-4 pt-4 pb-20 max-w-lg mx-auto">
      <button 
        onClick={() => router.back()} 
        className="mb-6 flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand-black transition"
      >
        <ChevronLeft className="h-4 w-4" /> Back to purchases
      </button>

      <div className="rounded-3xl bg-surface p-6 shadow-card border border-border">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-black mb-4 shadow-md">
            <Image src="/images/spotify.webp" alt="Spotify" width={80} height={80} className="object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-black">Spotify {order.product_name}</h1>
          <p className="mt-1 font-mono text-sm text-muted">{order.id}</p>
          
          <div className="mt-6 flex flex-col items-center">
            <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
              order.status === "PENDING" ? "bg-brand-yellow/10 text-brand-yellow" : "bg-brand-green/10 text-brand-green"
            }`}>
              {detailedStatus}
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-background p-4 border border-border">
            <span className="text-sm font-semibold text-muted">Total Amount</span>
            <span className="font-bold text-brand-black">{order.total_amount_mwk.toLocaleString()} MWK</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-background p-4 border border-border">
            <span className="text-sm font-semibold text-muted">Date Created</span>
            <span className="font-bold text-brand-black">{dateStr}</span>
          </div>
        </div>

        {order.is_peer && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-lg font-bold text-brand-black mb-4">Peers ({order.joined_peers}/{order.total_peers})</h2>
            
            <div className="space-y-3">
              {order.participants?.map((peer, idx) => {
                const paidTime = peer.paid_at ? new Date(peer.paid_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "N/A";
                return (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-background p-4 border border-border">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex flex-shrink-0 h-8 w-8 items-center justify-center rounded-full bg-brand-green/10 text-brand-green text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-black truncate" title={peer.email || "Anonymous"}>
                          {sliceEmail(peer.email)}
                        </p>
                        <p className="text-[10px] font-semibold text-muted mt-0.5">Paid at {paidTime}</p>
                      </div>
                    </div>
                    <span className="font-bold text-brand-green ml-3 flex-shrink-0 whitespace-nowrap">
                      {peer.amount_mwk.toLocaleString()} MWK
                    </span>
                  </div>
                );
              })}
            </div>

            {order.joined_peers < order.total_peers && (
              <button 
                onClick={copyLink}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Invite Link
              </button>
            )}
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-black text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 z-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Invite link copied!
        </div>
      )}
    </div>
  );
}
