import type { Address } from "viem";

export type TokenKey = "USDG" | "NVDA" | "AAPL" | "TSLA" | "AMZN";

export type Token = {
  key: TokenKey;
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
};

/**
 * Canonical token addresses on Robinhood Chain, carried over from the
 * reference deployment. Re-verify against the chain's registry before real
 * funds touch them: a matching ticker at another address is not the same
 * asset, and the vault's allowlist will refuse it.
 */
export const TOKENS: Record<TokenKey, Token> = {
  USDG: {
    key: "USDG",
    symbol: "USDG",
    name: "Global Dollar",
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    decimals: 6,
  },
  NVDA: {
    key: "NVDA",
    symbol: "NVDA",
    name: "Nvidia · Robinhood Token",
    address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
    decimals: 18,
  },
  AAPL: {
    key: "AAPL",
    symbol: "AAPL",
    name: "Apple · Robinhood Token",
    address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    decimals: 18,
  },
  TSLA: {
    key: "TSLA",
    symbol: "TSLA",
    name: "Tesla · Robinhood Token",
    address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
    decimals: 18,
  },
  AMZN: {
    key: "AMZN",
    symbol: "AMZN",
    name: "Amazon · Robinhood Token",
    address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
    decimals: 18,
  },
};

export const TOKEN_KEYS = Object.keys(TOKENS) as TokenKey[];
export const TOKEN_ADDRESSES: Address[] = TOKEN_KEYS.map((k) => TOKENS[k].address);

export function isTokenKey(value: unknown): value is TokenKey {
  return typeof value === "string" && value in TOKENS;
}

/** Assets new invoices may be issued in. The rest only pay existing links. */
export const CREATE_TOKENS: TokenKey[] = (
  process.env.NEXT_PUBLIC_BLINDPAY_CREATE_TOKENS ?? "NVDA,USDG"
)
  .split(",")
  .map((s) => s.trim())
  .filter(isTokenKey);
