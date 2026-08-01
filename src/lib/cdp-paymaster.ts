import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { CdpClient, toEvmDelegatedAccount } from "@coinbase/cdp-sdk";
import crypto from "crypto";

export function getTreasuryPrivateKey(): `0x${string}` {
  const secret = process.env.WALLET_SECRET;
  if (!secret) {
    if (process.env.TREASURY_PRIVATE_KEY) {
       return process.env.TREASURY_PRIVATE_KEY as `0x${string}`;
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
    return hex as `0x${string}`;
  } catch (e) {
    if (process.env.TREASURY_PRIVATE_KEY) {
       return process.env.TREASURY_PRIVATE_KEY as `0x${string}`;
    }
    throw new Error("Invalid WALLET_SECRET format and no fallback TREASURY_PRIVATE_KEY");
  }
}

export function getTreasuryAccount() {
  return privateKeyToAccount(getTreasuryPrivateKey());
}

export function getClients() {
  const account = getTreasuryAccount();
  const paymasterUrl = process.env.PAYMASTER_URL;

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  return { account, publicClient, paymasterUrl };
}

let cdpClient: CdpClient | null = null;
function getCdpClient() {
  if (!cdpClient) {
    cdpClient = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID!,
      apiKeySecret: process.env.CDP_API_KEY_SECRET!,
      walletSecret: process.env.WALLET_SECRET || "",
    });
  }
  return cdpClient;
}

export async function getCdpSmartAccount() {
  const account = getTreasuryAccount();
  const cdp = getCdpClient();
  const privateKey = getTreasuryPrivateKey();
  const address = account.address;
  const name = `zotheka-${address.slice(2, 29).toLowerCase()}`;

  let serverAccount;
  try {
    serverAccount = await cdp.evm.getAccount({ address });
  } catch {
    try {
      serverAccount = await cdp.evm.importAccount({ privateKey, name });
    } catch (error: any) {
      if (String(error).toLowerCase().includes("already")) {
        serverAccount = await cdp.evm.getAccount({ address });
      } else {
        throw error;
      }
    }
  }

  let isDelegated = false;
  try {
    await cdp.evm.getSmartAccount({ address, owner: serverAccount });
    isDelegated = true;
  } catch {
    isDelegated = false;
  }

  if (!isDelegated) {
    const { delegationOperationId } = await cdp.evm.createEvmEip7702Delegation({
      address,
      network: "base",
      enableSpendPermissions: false,
    });
    await cdp.evm.waitForEvmEip7702DelegationOperationStatus({
      delegationOperationId,
    });
  }

  const delegated = toEvmDelegatedAccount(serverAccount);

  return { delegated, paymasterUrl: process.env.PAYMASTER_URL! };
}
