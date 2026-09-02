import { robinhoodChain } from "./chain";

/** Base units to a decimal string, trimmed to `maxFrac` places. */
export function fmt(value: bigint, decimals: number, maxFrac = 4): string {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const rem = value % base;
  if (rem === 0n) return whole.toString();
  const frac = rem
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFrac)
    .replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

/** Decimal string to base units. Extra places are truncated, not rounded. */
export function parse(text: string, decimals: number): bigint {
  const [whole, fracRaw = ""] = text.trim().split(".");
  const frac = (fracRaw + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
}

export const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export const explorerAddress = (address: string) =>
  `${robinhoodChain.blockExplorers.default.url}/address/${address}`;

export const explorerTx = (hash: string) =>
  `${robinhoodChain.blockExplorers.default.url}/tx/${hash}`;

/** First line of an error, with wallet refusals said plainly. */
export function errorText(error: unknown): string {
  const message =
    (error as { message?: string } | null)?.message ?? "Something went wrong.";
  return /user rejected|denied|cancell?ed/i.test(message)
    ? "You cancelled that in your wallet."
    : message.split("\n")[0];
}
