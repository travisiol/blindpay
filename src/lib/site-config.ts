function envOrNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

/** An env var that must be a 20-byte hex address to count at all. */
export function envAddress(value: string | undefined): `0x${string}` | null {
  const v = envOrNull(value);
  return v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as `0x${string}`) : null;
}

export const siteConfig = {
  // `name` is the all-caps lockup (nav, OG image); `wordmark` is the
  // title-case form used in running copy and metadata. Nothing else spells
  // the name out, so a rename is these two strings plus the env prefix.
  name: "BLINDPAY",
  wordmark: "BlindPay",
  tagline: "Get paid without showing your wallet",
  description:
    "Send a link, receive stock tokens or USDG on Robinhood Chain, claim them to any address you like. The payer never sees where the money ends up.",
  seoDescription:
    "Invoice links for stock tokens and USDG on Robinhood Chain. The payment lands in a contract; claim it to any address with a signature. The payer never sees where the money ends up.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://blindpay.example",
  /** X profile URL. The nav button is hidden while unset. */
  x: envOrNull(process.env.NEXT_PUBLIC_BLINDPAY_X),
  /** Token contract address shown in the nav "CA" chip. Hidden while unset. */
  ca: envAddress(process.env.NEXT_PUBLIC_BLINDPAY_CA),
  /**
   * EIP-712 domain name the vault was deployed with. Claim signatures verify
   * against it on chain, so it has to match the contract exactly. It is not
   * a display string.
   */
  eip712Name: process.env.NEXT_PUBLIC_BLINDPAY_EIP712_NAME ?? "BlindPay",
  /** Fee pool address listed in the docs. Rendered as a dash while unset. */
  feePool: envAddress(process.env.NEXT_PUBLIC_BLINDPAY_FEE_POOL),
} as const;

export const xHandle = siteConfig.x
  ? `@${siteConfig.x.replace(/\/+$/, "").split("/").pop()}`
  : null;
