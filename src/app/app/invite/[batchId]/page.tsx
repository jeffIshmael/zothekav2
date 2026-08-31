"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppData } from "@/lib/app-data";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const batchId = params?.batchId as string;

    const { ready, authenticated, login } = usePrivy();
    const { email } = useAuth();
    const { minAmount, kycVerified, kycPhone, refresh } = useAppData();
    const isMalawian = kycPhone && (kycPhone.startsWith("+265") || kycPhone.startsWith("265") || kycPhone.startsWith("0"));

    const [denied, setDenied] = useState(false);
    const [targetEmail, setTargetEmail] = useState("");
    const [joining, setJoining] = useState(false);
    const [promptSent, setPromptSent] = useState(false);

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const isBelowMin = inviteDetails?.splitAmountMwk ? inviteDetails.splitAmountMwk < minAmount : false;
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [inviteError, setInviteError] = useState("");
    
    const [showToast, setShowToast] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("error");

    const triggerToast = (msg: string, type: "success" | "error" = "error") => {
        setShowToast(msg);
        setToastType(type);
        setTimeout(() => setShowToast(""), 3000);
    };

    // Refresh KYC data on mount in case user just returned from /kyc
    useEffect(() => {
        if (authenticated) {
            refresh();
        }
    }, [authenticated, refresh]);

    useEffect(() => {
        if (!batchId) return;
        const fetchInvite = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/invites/${batchId}`);
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
            triggerToast("Please provide a valid Spotify email.");
            return;
        }

        setJoining(true);
        // Simulate prompt sent to phone UX before making the actual request 
        // (since ElementPay sandbox auto-settles dummy numbers instantly)
        setPromptSent(true);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            const res = await fetch(`${API_BASE_URL}/invites/${batchId}/join`, {
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
                triggerToast(err.error || "Failed to join");
                setJoining(false);
                return;
            }

            // At this point, the join API succeeded and sandbox auto-settled.
            setJoining(true); 

            // Poll for payment success
            const checkStatus = async () => {
                const pollRes = await fetch(`${API_BASE_URL}/purchases`, {
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
                        const detailRes = await fetch(`${API_BASE_URL}/purchases/${purchase.id}`, {
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
            triggerToast(err.message || "An error occurred");
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

                {(!kycVerified || (kycPhone && !isMalawian) || isBelowMin) && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-yellow/20 bg-brand-yellow/10 p-4">
                        <div className="flex flex-col text-left">
                            <span className="text-[15px] font-semibold text-brand-black">
                                {!kycVerified ? "Identity Verification" : !isMalawian ? "Malawian Number Required" : "Amount Too Small"}
                            </span>
                            <span className="mt-1 w-fit rounded-full bg-brand-yellow/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-600">
                                {!kycVerified ? "Required to pay" : !isMalawian ? "This service is restricted to Malawi" : `Minimum ${minAmount.toLocaleString()} MWK`}
                            </span>
                        </div>
                        {!kycVerified && (
                            <button
                                onClick={() => router.push(`/app/kyc?returnUrl=/app/invite/${batchId}`)}
                                className="rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-yellow/90"
                            >
                                Verify Now
                            </button>
                        )}
                    </div>
                )}

                <>
                    {kycVerified !== false && isMalawian && (
                        <p className="text-center text-[13px] text-muted font-medium mb-3">
                            Payment prompt will be sent to <span className="font-bold text-brand-black">{kycPhone || "your registered number"}</span>
                        </p>
                    )}
                    <button
                        onClick={handleJoinAndPay}
                        disabled={kycVerified === false || !isMalawian || isBelowMin || joining || !targetEmail}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg transition shadow-card flex items-center justify-center gap-2 ${kycVerified === false || !isMalawian || isBelowMin ? "bg-gray-300 opacity-60 cursor-not-allowed" : "bg-brand-green hover:bg-brand-green-dark"}`}
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
                <button
                    onClick={() => router.push("/app")}
                    className="mt-6 flex w-full items-center justify-center text-xs font-bold text-muted transition hover:text-brand-black"
                >
                    &lt; Back to home
                </button>
                </>
            </div>

            {showToast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 z-50 flex items-center gap-2 ${toastType === 'error' ? 'bg-brand-red text-white' : 'bg-brand-black text-white'}`}>
                    <svg className={`w-4 h-4 ${toastType === 'error' ? 'text-white' : 'text-brand-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {toastType === 'error' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        )}
                    </svg>
                    {showToast}
                </div>
            )}
        </div>
    );
}
