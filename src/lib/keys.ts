import { encodePacked, keccak256, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { notifyStorage } from "./storage";

/**
 * The one message a wallet signs to unlock its invoice keys. Every key is
 * derived from this signature, so the text is frozen: change a character
 * and every invoice ever issued becomes unrecoverable.
 */
export const DERIVATION_MESSAGE = [
  "BlindPay — key derivation v1",
  "",
  "Signing this proves you own this wallet and unlocks the invoice keys that",
  "belong to it. It authorises no transaction and moves no funds.",
  "Only sign this on BlindPay.",
].join("\n");

const LOCAL_SEED_KEY = "blindpay.localseed.v1";
const SESSION_SEED_KEY = "blindpay.seed.v1";
const SEED_CHECK_KEY = "blindpay.seedcheck.v1";

/** Owner label for invoices made without a wallet. */
export const LOCAL_OWNER = "local";

/** The wallet-less seed: 32 random bytes that live in this browser only. */
export const localSeed = {
  get(): Hex | null {
    try {
      return localStorage.getItem(LOCAL_SEED_KEY) as Hex | null;
    } catch {
      return null;
    }
  },
  getOrCreate(): Hex {
    const existing = this.get();
    if (existing) return existing;
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const seed = ("0x" +
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) as Hex;
    try {
      localStorage.setItem(LOCAL_SEED_KEY, seed);
    } catch {}
    notifyStorage();
    return seed;
  },
  restore(seed: Hex) {
    try {
      localStorage.setItem(LOCAL_SEED_KEY, seed);
    } catch {}
    notifyStorage();
  },
};

export function masterSeed(signature: Hex): Hex {
  return keccak256(
    encodePacked(["string", "bytes"], ["blindpay.master.v1", signature]),
  );
}

export function invoiceKey(
  seed: Hex,
  index: number,
): { privateKey: Hex; address: Address } {
  const privateKey = keccak256(
    encodePacked(["bytes32", "uint32"], [seed, index]),
  );
  return { privateKey, address: privateKeyToAccount(privateKey).address };
}

/** Seed for a connected wallet, kept for the tab's lifetime only. */
export const sessionSeed = {
  get(address: string): Hex | null {
    try {
      return sessionStorage.getItem(
        `${SESSION_SEED_KEY}.${address.toLowerCase()}`,
      ) as Hex | null;
    } catch {
      return null;
    }
  },
  set(address: string, seed: Hex) {
    try {
      sessionStorage.setItem(`${SESSION_SEED_KEY}.${address.toLowerCase()}`, seed);
    } catch {}
    notifyStorage();
  },
  clear(address: string) {
    try {
      sessionStorage.removeItem(`${SESSION_SEED_KEY}.${address.toLowerCase()}`);
    } catch {}
    notifyStorage();
  },
};

/**
 * keccak of the seed, kept so a later signature can be checked against the
 * one the invoices were made with. Stores nothing that reveals the seed.
 */
const seedCheck = {
  get(address: string): string | null {
    try {
      return localStorage.getItem(`${SEED_CHECK_KEY}.${address.toLowerCase()}`);
    } catch {
      return null;
    }
  },
  set(address: string, seed: Hex) {
    try {
      localStorage.setItem(
        `${SEED_CHECK_KEY}.${address.toLowerCase()}`,
        keccak256(seed),
      );
    } catch {}
  },
};

/**
 * Turn one wallet signature into the seed every invoice key derives from.
 * The first time a wallet is used it signs twice: some wallets sign the
 * same message differently each time, and keys made with one of those
 * could never be recovered.
 */
export async function unlockSeed(
  address: Address,
  sign: (message: string) => Promise<Hex>,
): Promise<Hex> {
  const cached = sessionSeed.get(address);
  if (cached) return cached;

  const seed = masterSeed(await sign(DERIVATION_MESSAGE));
  const check = seedCheck.get(address);
  if (check === null) {
    if (masterSeed(await sign(DERIVATION_MESSAGE)) !== seed) {
      throw new Error(
        "This wallet signed the same message two different ways, so invoice keys made with it could never be recovered. Use a regular wallet account for BlindPay.",
      );
    }
    seedCheck.set(address, seed);
  } else if (keccak256(seed) !== check) {
    throw new Error(
      "This signature does not match the one your invoices were created with. Make sure you are connected with the same account as before.",
    );
  }
  sessionSeed.set(address, seed);
  return seed;
}
