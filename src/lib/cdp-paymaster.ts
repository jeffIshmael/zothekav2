import { createPublicClient, createWalletClient, http, erc20Abi } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { CdpClient, toEvmDelegatedAccount } from "@coinbase/cdp-sdk";
import crypto from "crypto";

export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

/**
 * SECURITY — EIP-7702 / ERC-4337 delegation incident (blog reference)
 * ------------------------------------------------
 * We previously used CDP EIP-7702 delegation + paymaster user operations for
 * treasury USDC transfers. Signing that authorization delegated execution on our
 * EOA; a malicious/broad executor swept the full USDC balance — not just the
 * intended transfer amount. This was not a private-key leak (key stayed in env).
 *
 * Similar risks can apply to ERC-4337 smart accounts when approving session keys,
 * batched user ops, or spend permissions without strict scoping.
 *
 * Admin transfer + withdraw now use plain EOA transactions (gas paid in ETH).
 * Do NOT re-enable getCdpSmartAccount() for treasury flows without a security review.
 */

export function getTreasuryPrivateKey(): `0x${string}` {
  if (process.env.TREASURY_PRIVATE_KEY) {
    return process.env.TREASURY_PRIVATE_KEY as `0x${string}`;
  }

  const secret = process.env.WALLET_SECRET;
  if (!secret) {
    throw new Error("TREASURY_PRIVATE_KEY or WALLET_SECRET is not set");
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
    throw new Error("Invalid WALLET_SECRET format");
  }
}

export function getTreasuryAccount() {
  return privateKeyToAccount(getTreasuryPrivateKey());
}

function getBaseTransport() {
  return http(process.env.BASE_RPC_URL || undefined);
}

export function getClients() {
  const account = getTreasuryAccount();

  const publicClient = createPublicClient({
    chain: base,
    transport: getBaseTransport(),
  });

  return { account, publicClient };
}

export function getTreasuryWalletClient() {
  const account = getTreasuryAccount();
  const publicClient = createPublicClient({
    chain: base,
    transport: getBaseTransport(),
  });
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: getBaseTransport(),
  });

  return { account, publicClient, walletClient };
}

export async function getTreasuryBalances() {
  const { account, publicClient } = getClients();

  const [usdcRaw, ethWei] = await Promise.all([
    publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    }),
    publicClient.getBalance({ address: account.address }),
  ]);

  return {
    address: account.address,
    balanceUsdc: Number(usdcRaw) / 1e6,
    balanceEth: Number(ethWei) / 1e18,
  };
}

/** Plain EOA ERC-20 transfer — treasury pays gas in ETH. */
export async function sendTreasuryUsdcTransfer(
  to: `0x${string}`,
  amountUsdc6: bigint
) {
  const { walletClient, publicClient } = getTreasuryWalletClient();

  const hash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amountUsdc6],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`USDC transfer reverted: ${hash}`);
  }

  return hash;
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

/**
 * @deprecated Unsafe for treasury — see EIP-7702 incident note above.
 * Retained only for reference; admin routes must not call this.
 */
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
