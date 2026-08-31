import { NextRequest, NextResponse } from "next/server";
import {
  getClients,
  getTreasuryBalances,
  sendTreasuryUsdcTransfer,
  USDC_ADDRESS,
} from "@/lib/cdp-paymaster";
import { Pool } from "pg";
import crypto from "crypto";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function isAdmin(email: string) {
  const adminEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return adminEmails.split(",").map(e => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email || !isAdmin(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { address, balanceUsdc, balanceEth } = await getTreasuryBalances();

    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = res.rows[0];

    let indicativeRate = 130;
    let minAmount = 150;

    if (API_KEY) {
      try {
        const rateRes = await fetch(`${ELEMENTPAY_API}/partner/rates/indicative?pair=USDC_KES&direction=OffRamp`, {
          headers: { "X-API-Key": API_KEY },
        });
        const rateData = await rateRes.json();
        if (rateData?.data?.rate) {
          indicativeRate = rateData.data.rate;
        }

        const catalogRes = await fetch(`${ELEMENTPAY_API}/partner/catalog?country=KE&order_type=OffRamp`, {
          headers: { "X-API-Key": API_KEY },
        });
        const catalogData = await catalogRes.json();
        if (catalogData?.data?.offramp?.countries?.KE?.payment_methods?.mobile_money?.providers) {
          const mpesa = catalogData.data.offramp.countries.KE.payment_methods.mobile_money.providers.find(
            (p: any) => p.name.includes("M-PESA")
          );
          if (mpesa?.min_amount) {
            minAmount = mpesa.min_amount;
          }
        }
      } catch (e) {
        console.error("Failed to fetch rate or catalog", e);
      }
    }

    return NextResponse.json({
      address,
      balanceUsdc,
      balanceEth,
      indicativeRate,
      minAmount,
      phone: user?.kyc_phone || "",
      network: "7ea6df5c-6bba-46b2-a7e6-f511959e7edb",
      kycVerified: user?.kyc_verified || false,
    });
  } catch (error: any) {
    console.error("Admin Payout GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amountUsdc, phone, providerId } = body;

    if (!email || !isAdmin(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
    }

    const { balanceEth } = await getTreasuryBalances();
    if (balanceEth < 0.00005) {
      return NextResponse.json(
        { error: "Insufficient ETH for gas. Top up the treasury wallet on Base." },
        { status: 400 }
      );
    }

    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = res.rows[0];
    if (!user) {
      return NextResponse.json({ error: "Admin KYC not found" }, { status: 404 });
    }

    let dob = "01/01/1990";
    if (user.kyc_dob) {
      const parts = user.kyc_dob.split("-");
      if (parts.length === 3) {
        dob = `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }

    let customerName = user.name || "Admin User";
    if (!customerName.trim().includes(" ")) {
      customerName += " User";
    }

    let safeAmountUsdc = Number(amountUsdc) * 1.02;

    const quotePayload = {
      order_type: "OffRamp",
      customer: {
        uid: `admin-${user.id}`,
        name: customerName,
        email: user.email,
        phone: phone,
        dob: dob,
        address: "Nairobi",
        country: "KE",
        id_number: user.kyc_id_number || "12345678",
        id_type: user.kyc_id_type || "NATIONAL_ID",
      },
      payment_method: {
        type: "mobile_money",
        phone_number: phone,
        network_id: providerId,
      },
      asset: {
        currency: "USDC",
        network: "BASE",
        token: USDC_ADDRESS,
      },
      crypto_amount: safeAmountUsdc,
      country: "KE",
      currency: "KES",
      refund_address: getClients().account.address,
    };

    const quoteRes = await fetch(`${ELEMENTPAY_API}/partner/orders/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(quotePayload),
    });

    const quoteData = await quoteRes.json();
    if (!quoteRes.ok) {
      return NextResponse.json({ error: quoteData.message || "Failed to create quote" }, { status: 400 });
    }
    const quoteId = quoteData.data.quote_id;

    const acceptRes = await fetch(`${ELEMENTPAY_API}/partner/orders/${quoteId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    });
    const acceptData = await acceptRes.json();
    if (!acceptRes.ok) {
      return NextResponse.json({ error: acceptData.message || "Failed to accept quote" }, { status: 400 });
    }

    const orderPayload = acceptData.data || {};
    const depositAddress =
      orderPayload.order?.wallet_address || orderPayload.accepted?.payment_instructions?.wallet_address;
    if (!depositAddress) {
      return NextResponse.json({ error: "No deposit address returned from ElementPay" }, { status: 500 });
    }

    const amountToTransfer = BigInt(Math.floor(Number(safeAmountUsdc) * 1e6));
    const hash = await sendTreasuryUsdcTransfer(depositAddress as `0x${string}`, amountToTransfer);

    await pool.query(
      `INSERT INTO admin_logs (id, admin_email, action, details) VALUES ($1, $2, $3, $4)`,
      [
        crypto.randomUUID(),
        email,
        "WITHDRAWAL",
        `EOA offramp ${amountUsdc} USDC to KSH (Order: ${quoteId})`,
      ]
    );

    return NextResponse.json({
      status: "success",
      order: orderPayload,
      txHash: hash,
    });
  } catch (error: any) {
    console.error("Admin Payout POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
