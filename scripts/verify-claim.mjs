/**
 * Proves the claim path is self-consistent without a deployed contract.
 *
 * The vault authorises a release by recovering the EIP-712 signer and
 * requiring it to equal the invoice address. This script walks the same
 * road the browser does — derive a seed, derive invoice N's key, sign the
 * Claim struct — and then verifies the recovered signer really is the
 * invoice address. If that holds, the only thing left between here and a
 * working claim is the contract itself.
 *
 *   node scripts/verify-claim.mjs
 */
import { encodePacked, keccak256, recoverTypedDataAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const CHAIN_ID = 4663;
const VAULT = "0x5cd3744027AEc714380d25A5f7A09F39ACD4d6D0";
const TOKEN = "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC";
const DOMAIN_NAME = "BlindPay";

const claimTypes = {
  Claim: [
    { name: "invoice", type: "address" },
    { name: "token", type: "address" },
    { name: "to", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

const masterSeed = (signature) =>
  keccak256(encodePacked(["string", "bytes"], ["blindpay.master.v1", signature]));

const invoiceKey = (seed, index) => {
  const privateKey = keccak256(encodePacked(["bytes32", "uint32"], [seed, index]));
  return { privateKey, address: privateKeyToAccount(privateKey).address };
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const signature = `0x${"ab".repeat(65)}`;
const seed = masterSeed(signature);

console.log("\nkey derivation");
const first = invoiceKey(seed, 0);
const again = invoiceKey(masterSeed(signature), 0);
check("same signature re-derives the same invoice", first.address === again.address, first.address);
check("a different index gives a different invoice", invoiceKey(seed, 1).address !== first.address);
check(
  "a different signature gives a different invoice",
  invoiceKey(masterSeed(`0x${"cd".repeat(65)}`), 0).address !== first.address,
);

console.log("\nclaim signature");
const destination = "0x1111111111111111111111111111111111111111";
const domain = { name: DOMAIN_NAME, version: "1", chainId: CHAIN_ID, verifyingContract: VAULT };
const message = {
  invoice: first.address,
  token: TOKEN,
  to: destination,
  nonce: 0n,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
};

const account = privateKeyToAccount(first.privateKey);
const sig = await account.signTypedData({
  domain,
  types: claimTypes,
  primaryType: "Claim",
  message,
});

const recovered = await recoverTypedDataAddress({
  domain,
  types: claimTypes,
  primaryType: "Claim",
  message,
  signature: sig,
});
check("the vault recovers the invoice address", recovered === first.address, recovered);

// The contract compares the recovered signer against the invoice. Anything
// the signature does not cover is something an attacker could rewrite.
const tamper = async (label, patch) => {
  const recoveredAfter = await recoverTypedDataAddress({
    domain,
    types: claimTypes,
    primaryType: "Claim",
    message: { ...message, ...patch },
    signature: sig,
  });
  check(label, recoveredAfter !== first.address, "recovers a stranger, so the vault refuses");
};

await tamper("redirecting the payout is rejected", { to: "0x2222222222222222222222222222222222222222" });
await tamper("replaying at the next nonce is rejected", { nonce: 1n });
await tamper("stretching the deadline is rejected", { deadline: message.deadline + 86400n });
await tamper("swapping the token is rejected", { token: VAULT });

const wrongDomain = await recoverTypedDataAddress({
  domain: { ...domain, name: "Hushbook" },
  types: claimTypes,
  primaryType: "Claim",
  message,
  signature: sig,
});
check(
  "a signature made for one domain name does not work under another",
  wrongDomain !== first.address,
  "so NEXT_PUBLIC_BLINDPAY_EIP712_NAME must match the deployed contract",
);

console.log(failures ? `\n${failures} failed\n` : "\nall checks passed\n");
process.exit(failures ? 1 : 0);
