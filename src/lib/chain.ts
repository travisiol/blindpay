import { defineChain } from "viem";

/**
 * Robinhood Chain. Chain id 4663 and the public RPC were confirmed live on
 * 2026-09-01 (`eth_chainId` → 0x1237). Override through env if you run a
 * private endpoint.
 */
export const ROBINHOOD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID ?? 4663,
);

const RPC_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
  "https://rpc.mainnet.chain.robinhood.com";

const EXPLORER_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_EXPLORER_URL ??
  "https://robinhoodchain.blockscout.com";

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Blockscout", url: EXPLORER_URL } },
  contracts: {
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
  testnet: false,
});
