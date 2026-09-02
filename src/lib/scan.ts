import { erc20Abi, type Address, type Hex } from "viem";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "./wagmiConfig";
import { invoiceKey } from "./keys";
import { TOKEN_ADDRESSES, TOKEN_KEYS, type TokenKey } from "./tokens";
import { VAULT_ADDRESS, vaultAbi } from "./vault";

export type Balances = Partial<Record<TokenKey, bigint>>;

export type InvoiceRecord = {
  index: number;
  address: Address;
  /** Waiting in the vault, releasable with a claim signature. */
  claimable: Balances;
  /** Sent straight to the invoice address, outside the vault. */
  stranded: Balances;
  nonce: bigint;
};

const STOP_AFTER_EMPTY = 20;
const BATCH = 10;

const hasAny = (b: Balances) => Object.values(b).some((v) => v && v > 0n);

/** An invoice that has ever been paid or claimed. */
export const isActive = (r: InvoiceRecord) =>
  r.nonce > 0n || hasAny(r.claimable) || hasAny(r.stranded);

async function probe(vault: Address, address: Address, index: number): Promise<InvoiceRecord> {
  const [[inVault, nonce], held] = await Promise.all([
    Promise.all([
      readContract(wagmiConfig, {
        address: vault,
        abi: vaultAbi,
        functionName: "balances",
        args: [address, TOKEN_ADDRESSES],
      }),
      readContract(wagmiConfig, {
        address: vault,
        abi: vaultAbi,
        functionName: "claimNonce",
        args: [address],
      }),
    ]),
    Promise.all(
      TOKEN_ADDRESSES.map((token) =>
        readContract(wagmiConfig, {
          address: token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
      ),
    ),
  ]);

  const claimable: Balances = {};
  const stranded: Balances = {};
  TOKEN_KEYS.forEach((key, i) => {
    if (inVault[i] > 0n) claimable[key] = inVault[i];
    if (held[i] > 0n) stranded[key] = held[i];
  });
  return { index, address, claimable, stranded, nonce };
}

/**
 * Walk a seed's invoices in order until twenty in a row have never seen a
 * payment. Reads only; nothing but public addresses reaches the RPC.
 */
export async function scanInvoices(
  seed: Hex,
  { maxIndex = 200 }: { maxIndex?: number } = {},
): Promise<InvoiceRecord[]> {
  const vault = VAULT_ADDRESS;
  if (!vault) return [];
  const out: InvoiceRecord[] = [];
  let empty = 0;
  let cursor = 0;
  while (cursor < maxIndex && empty < STOP_AFTER_EMPTY) {
    const indexes = Array.from(
      { length: Math.min(BATCH, maxIndex - cursor) },
      (_, i) => cursor + i,
    );
    const batch = await Promise.all(
      indexes.map((i) => probe(vault, invoiceKey(seed, i).address, i)),
    );
    for (const rec of batch) {
      out.push(rec);
      if (isActive(rec)) empty = 0;
      else empty += 1;
      if (empty >= STOP_AFTER_EMPTY) break;
    }
    cursor += indexes.length;
  }
  return out;
}

export function nextIndexFromChain(records: InvoiceRecord[]): number {
  const active = records.filter(isActive);
  return active.length ? Math.max(...active.map((r) => r.index)) + 1 : 0;
}
