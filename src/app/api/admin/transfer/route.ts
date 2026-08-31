import { NextRequest, NextResponse } from "next/server";
import {
  getTreasuryBalances,
  sendTreasuryUsdcTransfer,
} from "@/lib/cdp-paymaster";
import { isAddress } from "viem";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function isAdmin(email: string) {
  const adminEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return adminEmails.split(",").map(e => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amountUsdc, destination } = body;

    if (!email || !isAdmin(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!destination || !isAddress(destination)) {
      return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });
    }

    if (!amountUsdc || isNaN(Number(amountUsdc)) || Number(amountUsdc) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { balanceUsdc, balanceEth } = await getTreasuryBalances();

    if (Number(amountUsdc) > balanceUsdc) {
      return NextResponse.json({ error: "Insufficient USDC balance" }, { status: 400 });
    }

    if (balanceEth < 0.00005) {
      return NextResponse.json(
        { error: "Insufficient ETH for gas. Top up the treasury wallet on Base." },
        { status: 400 }
      );
    }

    const amountToTransfer = BigInt(Math.floor(Number(amountUsdc) * 1e6));
    const hash = await sendTreasuryUsdcTransfer(destination as `0x${string}`, amountToTransfer);

    await pool.query(
      `INSERT INTO admin_logs (id, admin_email, action, details) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), email, "TRANSFER", `EOA transfer ${amountUsdc} USDC to ${destination}`]
    );

    return NextResponse.json({
      status: "success",
      txHash: hash,
    });
  } catch (error: any) {
    console.error("Admin Transfer POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
