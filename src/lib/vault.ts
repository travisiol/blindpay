import type { Address } from "viem";
import { envAddress, siteConfig } from "./site-config";

/**
 * The pooled vault. Unset means no contract has been deployed for this
 * build: creating invoices still works (keys derive locally), but paying and
 * claiming are disabled with the reason shown, and balances read as zero.
 */
export const VAULT_ADDRESS = envAddress(
  process.env.NEXT_PUBLIC_BLINDPAY_VAULT_ADDRESS,
);

export const isVaultConfigured = (): boolean => VAULT_ADDRESS !== null;

export const vaultAbi = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [
      { name: "invoice", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "invoice", type: "address" },
      { name: "token", type: "address" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [
      { name: "invoice", type: "address" },
      { name: "token", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balances",
    stateMutability: "view",
    inputs: [
      { name: "invoice", type: "address" },
      { name: "tokens", type: "address[]" },
    ],
    outputs: [{ name: "out", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "claimNonce",
    stateMutability: "view",
    inputs: [{ name: "invoice", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "quote",
    stateMutability: "view",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [
      { name: "fee", type: "uint256" },
      { name: "net", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint16" }],
  },
] as const;

export const claimTypes = {
  Claim: [
    { name: "invoice", type: "address" },
    { name: "token", type: "address" },
    { name: "to", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/** A claim signature expires an hour after it is made. */
export function claimDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 3600);
}

export function claimDomain(chainId: number, verifyingContract: Address) {
  return {
    name: siteConfig.eip712Name,
    version: "1",
    chainId,
    verifyingContract,
  } as const;
}
