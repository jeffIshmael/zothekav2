import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import crypto from "crypto";

export function getTreasuryAccount() {
  const secret = process.env.WALLET_SECRET;
  if (!secret) {
    if (process.env.TREASURY_PRIVATE_KEY) {
       return privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY as `0x${string}`);
    }
    throw new Error("WALLET_SECRET or TREASURY_PRIVATE_KEY is not set");
  }

  try {
    const pem = `-----BEGIN EC PRIVATE KEY-----\n${secret}\n-----END EC PRIVATE KEY-----`;
    const privateKey = crypto.createPrivateKey({
      key: pem,
      format: "pem",
    });

    const jwk = privateKey.export({ format: "jwk" });
    const hex = "0x" + Buffer.from(jwk.d!, "base64url").toString("hex");
    return privateKeyToAccount(hex as `0x${string}`);
  } catch (e) {
    if (process.env.TREASURY_PRIVATE_KEY) {
       return privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY as `0x${string}`);
    }
    throw new Error("Invalid WALLET_SECRET format and no fallback TREASURY_PRIVATE_KEY");
  }
}

export function getClients() {
  const account = getTreasuryAccount();
  const paymasterUrl = process.env.PAYMASTER_URL;

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(paymasterUrl || undefined),
  });

  return { account, publicClient, walletClient, paymasterUrl };
}
