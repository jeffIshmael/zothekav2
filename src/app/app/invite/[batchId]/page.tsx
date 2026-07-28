"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppData } from "@/lib/app-data";
import { useAuth } from "@/lib/auth";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const batchId = params?.batchId as string;

    const { ready, authenticated, login } = usePrivy();
    const { email } = useAuth();
    const { kycVerified, kycPhone } = useAppData();

    const [denied, setDenied] = useState(false);
    const [targetEmail, setTargetEmail] = useState("");
    const [joining, setJoining] = useState(false);
    const [promptSent, setPromptSent] = useState(false);

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [inviteError, setInviteError] = useState("");

    useEffect(() => {
        if (!batchId) return;
        const fetchInvite = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_ZOTHEKA_WEB_URL?.replace(/\/$/, "") ?? "";
                const res = await fetch(`${baseUrl}/api/invites/${batchId}`);
                if (!res.ok) {
                    throw new Error("Invite not found");
                }
                const data = await res.json();
                setInviteDetails(data);
            } catch (err: any) {
                setInviteError(err.message);
            } finally {
                setLoadingInvite(false);
            }
        };
        fetchInvite();
    }, [batchId]);

    const handleDeny = () => {
        setDenied(true);
    };

    const handleJoinAndPay = async () => {
        if (!targetEmail || !targetEmail.includes("@")) {
            alert("NEW_CODE_LOADED: Please provide a valid Spotify email.");
            return;
        }

        setJoining(true);
        const baseUrl = process.env.NEXT_PUBLIC_ZOTHEKA_WEB_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

        try {
            const res = await fetch(`${baseUrl}/api/invites/${batchId}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": email || "unknown@example.com"
                },
                body: JSON.stringify({ targetEmail })
            });

            if (!res.ok) {
                let errText = await res.text();
                let err;
                try {
                    err = JSON.parse(errText);
                } catch (e) {
                    console.error("Non-JSON error from server:", errText);
                    err = { error: "Server returned an unexpected error format. See console." };
                }
                alert(err.error || "Failed to join");
                setJoining(false);
                return;
            }

            // At this point, the join API succeeded, meaning the prompt has been sent.
            // Let's update the UI to indicate this.
            setJoining(true); // Ensure it's still marked as joining
            setPromptSent(true);

            // Poll for payment success
            const checkStatus = async () => {
                const pollRes = await fetch(`${baseUrl}/api/purchases`, {
                    headers: {
                        "X-User-Email": email || "unknown@example.com"
                    }
                });
                if (pollRes.ok) {
                    const purchases = await pollRes.json();
                    // Find the purchase that matches this batchId
                    const purchase = purchases.find((p: any) => p.batch_id === batchId);
                    if (purchase) {
                        // Fetch details
                        const detailRes = await fetch(`${baseUrl}/api/purchases/${purchase.id}`, {
                            headers: { "X-User-Email": email || "unknown@example.com" }
                        });
                        if (detailRes.ok) {
                            const detailData = await detailRes.json();
                            const myParticipant = detailData.participants?.find((p: any) => p.email === email);
                            if (myParticipant) {
                                if (myParticipant.status === "PAID") return true;
                                if (myParticipant.status === "FAILED") throw new Error("Payment failed");
                            }
                        }
                    }
                }
                return false;
            };

            let attempts = 0;
            let success = false;
            while (attempts < 20 && !success) {
                success = await checkStatus();
                if (success) break;
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;
            }

            if (!success) {
                throw new Error("Payment timeout.");
            }

            router.push("/app/success?solo=true");
        } catch (err: any) {
            alert(err.message || "An error occurred");
            setJoining(false);
            setPromptSent(false);
        }
    };

    if (!ready || loadingInvite) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 w-full">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
            </div>
        );
    }

    if (inviteError) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 w-full">
                <div className="bg-surface border border-border rounded-2xl p-6 text-center shadow-card text-brand-black w-full max-w-xl">
                    <div className="mb-6 w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto text-3xl">
                        ❌
                    </div>
                    <p className="text-brand-red font-bold text-lg mb-4">{inviteError}</p>
                    <button
                        onClick={() => router.push("/app")}
                        className="w-full py-4 rounded-xl bg-background border border-border text-brand-black font-semibold hover:bg-gray-50 transition"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    if (denied) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 w-full">
                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 text-center shadow-card text-brand-black w-full max-w-xl">
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
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 w-full">
                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 text-center shadow-card text-brand-black w-full max-w-xl">
                    <div className="mb-6 w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto text-3xl">
                        🤝
                    </div>
                    <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
                    <p className="text-muted mb-6">
                        <strong>{inviteDetails?.initiatorName || "A friend"}</strong> has invited you to share a <strong>Spotify {inviteDetails?.productName}</strong> package.
                    </p>
                    
                    <div className="bg-surface border border-border rounded-xl p-4 mb-8">
                        <p className="text-sm text-muted font-semibold uppercase tracking-wider mb-1">Your Split Amount</p>
                        <p className="text-2xl font-black text-brand-green">
                            {inviteDetails?.splitAmountMwk?.toLocaleString() || "0"} MWK
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleDeny}
                            className="flex-1 py-3 rounded-xl border border-brand-red text-brand-red font-semibold hover:bg-brand-red/10 transition"
                        >
                            Deny
                        </button>
                        <button
                            onClick={() => login()}
                            className="flex-1 py-3 rounded-xl bg-brand-green text-white font-semibold hover:bg-brand-green-dark transition"
                        >
                            Proceed
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 w-full">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 text-center shadow-card text-brand-black w-full max-w-xl">
                <h1 className="text-2xl font-bold mb-4">Join Package</h1>
                <p className="text-muted mb-6">
                    You're joining <strong>{inviteDetails?.initiatorName || "your friend"}'s</strong> <strong>Spotify {inviteDetails?.productName}</strong> package.
                </p>

                <div className="flex gap-4 mb-8">
                    <div className="flex-1 bg-brand-green/10 p-4 rounded-xl text-center border border-brand-green/20">
                        <p className="text-xs text-brand-green font-bold uppercase tracking-wider mb-1">Paid Peers</p>
                        <p className="text-2xl font-black text-brand-green">{inviteDetails?.joinedPeers} / {inviteDetails?.totalPeers}</p>
                    </div>
                    <div className="flex-1 bg-background border border-border p-4 rounded-xl text-center">
                        <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Amount Due</p>
                        <p className="text-2xl font-black text-brand-black">{inviteDetails?.splitAmountMwk?.toLocaleString()}</p>
                        <p className="text-xs text-muted font-semibold mt-1">MWK</p>
                    </div>
                </div>

                <div className="mb-8 text-left">
                    <label className="block text-sm font-bold text-brand-black mb-2">Spotify Account Email</label>
                    <input
                        type="email"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="Enter your Spotify email to be added"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-green transition text-brand-black placeholder:text-muted/60"
                    />
                </div>

                {kycVerified === false ? (
                    <button
                        onClick={() => router.push(`/app/kyc?returnUrl=/app/invite/${batchId}`)}
                        className="w-full py-4 rounded-xl bg-brand-black text-white font-bold text-lg hover:bg-gray-800 transition shadow-card"
                    >
                        Verify Account to Pay
                    </button>
                ) : (
                    <>
                        <p className="text-center text-[13px] text-muted font-medium mb-3">
                            Payment prompt will be sent to <span className="font-bold text-brand-black">{kycPhone || "your registered number"}</span>
                        </p>
                        <button
                            onClick={handleJoinAndPay}
                            disabled={joining || !targetEmail}
                            className="w-full py-4 rounded-xl bg-brand-green text-white font-bold text-lg hover:bg-brand-green-dark transition shadow-card disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                        {joining ? (
                            promptSent ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Prompt sent. Waiting for payment...
                                </>
                            ) : (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Processing...
                                </>
                            )
                        ) : (
                            `Secure Pay ${Math.ceil(inviteDetails?.splitAmountMwk || 0).toLocaleString()} MWK`
                        )}
                    </button>
                    <p className="text-center text-[10px] text-muted mt-4">v2.1.4</p>
                    </>
                )}
            </div>
        </div>
    );
}
