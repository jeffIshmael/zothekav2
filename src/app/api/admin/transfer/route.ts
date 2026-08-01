import { NextRequest, NextResponse } from "next/server";
import { getClients } from "@/lib/cdp-paymaster";
import { erc20Abi, encodeFunctionData, isAddress } from "viem";
import { Pool } from "pg";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

    // 1. EIP-7702 Transaction with CDP SDK
    const { getCdpSmartAccount } = await import("@/lib/cdp-paymaster");
    const { delegated, paymasterUrl } = await getCdpSmartAccount();
    
    // Check balance first
    const { publicClient, account } = getClients();
    const balanceRaw = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    });
    const balanceUsdc = Number(balanceRaw) / 1e6;

    if (Number(amountUsdc) > balanceUsdc) {
      return NextResponse.json({ error: "Insufficient USDC balance" }, { status: 400 });
    }

    const amountToTransfer = BigInt(Math.floor(Number(amountUsdc) * 1e6)); 

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [destination as `0x${string}`, amountToTransfer],
    });

    const { userOpHash } = await delegated.sendUserOperation({
        network: "base",
        calls: [{
            to: USDC_ADDRESS as `0x${string}`,
            data,
        }],
        paymasterUrl,
    });

    const result = await delegated.waitForUserOperation({ userOpHash });
    
    if (result.status !== "complete") {
        throw new Error(`User operation failed: ${userOpHash}`);
    }

    const hash = result.transactionHash;

    // 2. Log to admin_logs
    await pool.query(
      `INSERT INTO admin_logs (id, admin_email, action, details) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), email, "TRANSFER", `Transferred ${amountUsdc} USDC to ${destination}`]
    );

    return NextResponse.json({
      status: "success",
      txHash: hash
    });

  } catch (error: any) {
    console.error("Admin Transfer POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
