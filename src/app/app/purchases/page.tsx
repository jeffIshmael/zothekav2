"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";

// Dummy Data
export type MockPurchase = {
  id: string;
  productName: string;
  amountMwk: number;
  status: string;
  createdAt: string;
  isPeer: boolean;
  totalPeers?: number;
  joinedPeers?: number;
  batchId?: string;
  origin?: string;
};

export const DUMMY_PURCHASES: MockPurchase[] = [
  {
    id: "ord_123456",
    productName: "Family",
    amountMwk: 12500,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    isPeer: true,
    totalPeers: 6,
    joinedPeers: 2,
    batchId: "mock_abc123"
  },
  {
    id: "ord_654321",
    productName: "Individual",
    amountMwk: 3500,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isPeer: false
  }
];

export default function PurchasesPage() {
  const { email } = useAuth();
  const [orders, setOrders] = useState<MockPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    // Simulate API delay
    const timer = setTimeout(() => {
      if (email) {
        setOrders(DUMMY_PURCHASES);
      }
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [email]);

  const copyLink = (e: React.MouseEvent, batchId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const inviteLink = `${origin}/app/invite/${batchId}`;
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="px-4 pt-4 pb-20">
      <h1 className="text-2xl font-extrabold">My purchases</h1>
      <p className="mt-1 text-sm text-muted">Manage your Spotify packages</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-4xl opacity-30">🛍</p>
          <p className="mt-4 text-lg font-bold">No purchases yet</p>
          <p className="mt-2 text-sm text-muted">
            Your Spotify packages will appear here after checkout.
          </p>
          <Link href="/app" className="mt-6 inline-block text-sm font-semibold text-brand-green">
            Browse packages →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
            
            return (
              <li key={order.id}>
                <Link href={`/app/purchases/${order.id}`} className="block rounded-2xl bg-surface p-4 shadow-card border border-border transition hover:border-brand-green/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
                        <Image src="/images/spotify.webp" alt="Spotify" width={48} height={48} className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-black">Spotify {order.productName}</p>
                        <p className="text-xs text-muted mt-0.5">{dateStr}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      order.status === "PENDING" ? "bg-brand-yellow/10 text-brand-yellow" : "bg-brand-green/10 text-brand-green"
                    }`}>
                      {order.status === "COMPLETED" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Total Cost</p>
                      <p className="text-sm font-bold text-brand-black">{order.amountMwk.toLocaleString()} MWK</p>
                    </div>

                    {order.isPeer && order.totalPeers && order.joinedPeers !== undefined && (
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Peers Joined</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                            <div 
                              className="h-full bg-brand-green transition-all" 
                              style={{ width: `${(order.joinedPeers / order.totalPeers) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-brand-green">{order.joinedPeers}/{order.totalPeers}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {order.isPeer && order.batchId && order.joinedPeers! < order.totalPeers! && (
                    <div className="mt-4 pt-3">
                      <button 
                        onClick={(e) => copyLink(e, order.batchId!)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green/10 py-2.5 text-sm font-bold text-brand-green transition hover:bg-brand-green/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Invite Link
                      </button>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
