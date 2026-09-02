import { isAddress, type Address } from "viem";
import { isTokenKey, type TokenKey } from "./tokens";

export type StoredInvoice = {
  id: string;
  index: number;
  /** Wallet address, or LOCAL_OWNER for wallet-less invoices. */
  owner: string;
  token: TokenKey;
  /** Base units as a decimal string; "" means any amount. */
  amount: string;
  /** The one-time invoice address the payer sees. */
  stealth: Address;
  note: string;
  createdAt: number;
  sweptAt?: number;
  sweptTo?: Address;
};

const STORE_KEY = "blindpay.invoices.v1";

function readAll(): StoredInvoice[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as StoredInvoice[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: StoredInvoice[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {}
}

/** The browser-local record of invoices. Notes live here and nowhere else. */
export const invoiceStore = {
  list(owner: string): StoredInvoice[] {
    const key = owner.toLowerCase();
    return readAll()
      .filter((inv) => inv.owner.toLowerCase() === key)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  nextIndex(owner: string): number {
    const list = this.list(owner);
    return list.length ? Math.max(...list.map((inv) => inv.index)) + 1 : 0;
  },
  add(inv: StoredInvoice) {
    writeAll([...readAll(), inv]);
  },
  update(id: string, patch: Partial<StoredInvoice>) {
    writeAll(readAll().map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)));
  },
  markSwept(id: string, to: Address) {
    this.update(id, { sweptAt: Date.now(), sweptTo: to });
  },
  remove(id: string) {
    writeAll(readAll().filter((inv) => inv.id !== id));
  },
};

export type LinkPayload = { v: 1; a: Address; t: TokenKey; m: string };

function base64url(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(text: string): string {
  const padded =
    text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

/**
 * The payment link. Everything rides in the fragment, which browsers never
 * send to a server, ours included.
 */
export function invoiceLink(inv: StoredInvoice, origin: string): string {
  const payload: LinkPayload = { v: 1, a: inv.stealth, t: inv.token, m: inv.amount };
  return `${origin}/i#${base64url(JSON.stringify(payload))}`;
}

export function decodeLink(hash: string): LinkPayload | null {
  try {
    const raw = hash.replace(/^#/, "");
    if (!raw) return null;
    const payload = JSON.parse(fromBase64url(raw)) as Partial<LinkPayload>;
    if (payload.v !== 1) return null;
    if (typeof payload.a !== "string" || !isAddress(payload.a, { strict: true })) return null;
    if (!isTokenKey(payload.t)) return null;
    if (typeof payload.m !== "string") return null;
    if (payload.m !== "" && !/^\d+$/.test(payload.m)) return null;
    return payload as LinkPayload;
  } catch {
    return null;
  }
}
