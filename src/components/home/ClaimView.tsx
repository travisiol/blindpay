"use client";

import { useEffect, useState } from "react";
import { useChainId, useConnection, useSignMessage, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { TOKENS, type TokenKey } from "@/lib/tokens";
import {
  VAULT_ADDRESS,
  claimDeadline,
  claimDomain,
  claimTypes,
  isVaultConfigured,
  vaultAbi,
} from "@/lib/vault";
import { LOCAL_OWNER, invoiceKey, localSeed, sessionSeed, unlockSeed } from "@/lib/keys";
import { invoiceStore } from "@/lib/invoices";
import { scanInvoices } from "@/lib/scan";
import { useStorageValue } from "@/lib/storage";
import { errorText, fmt, short } from "@/lib/format";
import { ConnectButton } from "../ConnectButton";
import { copyText } from "../Copy";
import { IconBack, IconCopy, IconDownload, IconWallet } from "../Icons";
import { Mark } from "../Mark";
import { RestoreFold } from "./RestoreFold";

type Claimable = {
  key: string;
  index: number;
  address: Address;
  token: TokenKey;
  balance: bigint;
  seed: Hex;
  note?: string;
  localId?: string;
};

type Stranded = Omit<Claimable, "note" | "localId">;

type Found = { claimables: Claimable[]; stranded: Stranded[]; pending: number };

/**
 * Everything waiting on the wallet's seed and on this browser's local seed.
 * Pure: reads the chain and local storage, touches no component state.
 */
async function loadInvoices(address: Address | undefined, walletSeed: Hex | null): Promise<Found | null> {
  const sources: { seed: Hex; owner: string }[] = [];
  if (walletSeed && address) sources.push({ seed: walletSeed, owner: address });
  const local = localSeed.get();
  if (local) sources.push({ seed: local, owner: LOCAL_OWNER });
  if (!sources.length) return null;

  const claimables: Claimable[] = [];
  const stranded: Stranded[] = [];
  let pending = 0;
  for (const src of sources) {
    const stored = invoiceStore.list(src.owner);
    const byIndex = new Map(stored.map((inv) => [inv.index, inv]));
    const records = await scanInvoices(src.seed);
    for (const rec of records) {
      for (const [tk, bal] of Object.entries(rec.claimable) as [TokenKey, bigint][]) {
        claimables.push({
          key: `${src.owner}-${rec.index}-${tk}`,
          index: rec.index,
          address: rec.address,
          token: tk,
          balance: bal,
          seed: src.seed,
          note: byIndex.get(rec.index)?.note || undefined,
          localId: byIndex.get(rec.index)?.id,
        });
      }
      for (const [tk, bal] of Object.entries(rec.stranded) as [TokenKey, bigint][]) {
        stranded.push({
          key: `s-${src.owner}-${rec.index}-${tk}`,
          index: rec.index,
          address: rec.address,
          token: tk,
          balance: bal,
          seed: src.seed,
        });
      }
    }
    const active = new Set(
      records
        .filter(
          (r) =>
            r.nonce > 0n ||
            claimables.some((c) => c.seed === src.seed && c.index === r.index),
        )
        .map((r) => r.index),
    );
    pending += stored.filter((inv) => !active.has(inv.index) && !inv.sweptAt).length;
  }
  claimables.sort((a, b) => a.index - b.index);
  stranded.sort((a, b) => a.index - b.index);
  return { claimables, stranded, pending };
}

export function ClaimView({ onBack }: { onBack: () => void }) {
  const { address } = useConnection();
  const chainId = useChainId();
  const { mutateAsync: signMessage } = useSignMessage();
  const { mutateAsync: writeContract } = useWriteContract();

  // Both seeds live in storage; storage is the source of truth.
  const seed = useStorageValue(() => (address ? sessionSeed.get(address) : null), null);
  const hasLocal = !!useStorageValue(() => localSeed.get(), null);

  const [found, setFound] = useState<Found | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: string; to: Address } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!seed && !hasLocal) return;
    let cancelled = false;
    loadInvoices(address, seed)
      .then((result) => {
        if (!cancelled) setFound(result);
      })
      .catch((e) => {
        if (!cancelled) setError(errorText(e));
      });
    return () => {
      cancelled = true;
    };
  }, [address, seed, hasLocal]);

  const refresh = async () => {
    setFound(await loadInvoices(address, seed));
  };

  const unlock = async () => {
    if (!address) return;
    setError(null);
    setBusy("unlock");
    try {
      // Writes the seed to session storage, which re-runs the load above.
      await unlockSeed(address, (message) => signMessage({ message }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const claim = async (item: Claimable) => {
    if (!address) return;
    setError(null);
    setBusy(item.key);
    try {
      const vault = VAULT_ADDRESS;
      if (!vault) throw new Error("The vault contract is not configured for this network yet.");
      const token = TOKENS[item.token];
      const { privateKey } = invoiceKey(item.seed, item.index);
      const deadline = claimDeadline();
      const nonce = await readContract(wagmiConfig, {
        address: vault,
        abi: vaultAbi,
        functionName: "claimNonce",
        args: [item.address],
      });
      const signature = await privateKeyToAccount(privateKey).signTypedData({
        domain: claimDomain(chainId, vault),
        types: claimTypes,
        primaryType: "Claim",
        message: {
          invoice: item.address,
          token: token.address,
          to: address,
          nonce,
          deadline,
        },
      });
      const hash = await writeContract({
        address: vault,
        abi: vaultAbi,
        functionName: "claim",
        args: [item.address, token.address, address, deadline, signature],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      if (item.localId) invoiceStore.markSwept(item.localId, address);
      setDone({ amount: `${fmt(item.balance, token.decimals)} ${token.symbol}`, to: address });
      await refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const copyKey = (item: Stranded) => {
    const { privateKey } = invoiceKey(item.seed, item.index);
    void copyText(privateKey);
    setCopiedKey(item.key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const list = found?.claimables ?? [];
  const stranded = found?.stranded ?? [];
  const pending = found?.pending ?? 0;

  return (
    <div className="panel-wrap">
      <button type="button" className="back" onClick={onBack}>
        <IconBack />
        back
      </button>

      <div className="claim-wrap stagger">
        <h2 className="pane-title">Claim a payment</h2>

        {!address && !hasLocal ? (
          <div className="claim-empty">
            <Mark size={96} />
            <p className="app-lede">
              Connect the wallet that created the invoices. It proves they are yours.
            </p>
            <ConnectButton big />
            <RestoreFold onRestored={refresh} />
          </div>
        ) : address && !seed && !hasLocal ? (
          <div className="claim-empty">
            <Mark size={96} />
            <p className="app-lede">
              Sign one message to prove you are the recipient. It authorises no transaction and
              moves nothing.
            </p>
            <button
              type="button"
              className="btn btn-neon big"
              onClick={unlock}
              disabled={busy === "unlock"}
            >
              <IconWallet />
              {busy === "unlock" ? "Check your wallet…" : "Sign to continue"}
            </button>
            <RestoreFold onRestored={refresh} />
          </div>
        ) : (
          <>
            {done ? (
              <p className="claim-done">
                <span className="dot" /> {done.amount} sent to {short(done.to)}
              </p>
            ) : null}

            {isVaultConfigured() ? null : (
              <p className="notice">
                The vault is not live on this network yet, so there is nothing to read balances
                from and claiming stays closed. Your invoices and their keys are safe in this
                browser in the meantime.
              </p>
            )}

            {list.length ? (
              <ul className="claim-list">
                {list.map((item) => {
                  const token = TOKENS[item.token];
                  return (
                    <li key={item.key}>
                      <div>
                        <span className="hud-label">
                          invoice № {String(item.index + 1).padStart(4, "0")}
                        </span>
                        <b>
                          {fmt(item.balance, token.decimals)} {token.symbol}
                        </b>
                        {item.note ? <span className="fine">{item.note}</span> : null}
                      </div>
                      {address ? (
                        <button
                          type="button"
                          className="btn btn-neon"
                          onClick={() => claim(item)}
                          disabled={busy === item.key}
                        >
                          <IconDownload />
                          {busy === item.key ? "Claiming…" : "claim"}
                        </button>
                      ) : (
                        <ConnectButton label="Connect to claim" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="app-lede">
                {found === undefined
                  ? "Reading the chain…"
                  : pending
                    ? `Nothing has arrived yet. ${pending} invoice${pending > 1 ? "s are" : " is"} still waiting to be paid.`
                    : "No payments waiting on this wallet."}
              </p>
            )}

            {stranded.length ? (
              <div className="stranded">
                <p className="hud-label">sent outside the vault</p>
                <ul className="claim-list">
                  {stranded.map((item) => {
                    const token = TOKENS[item.token];
                    return (
                      <li key={item.key}>
                        <div>
                          <span className="hud-label">on {short(item.address)}</span>
                          <b>
                            {fmt(item.balance, token.decimals)} {token.symbol}
                          </b>
                        </div>
                        <button type="button" className="btn btn-quiet" onClick={() => copyKey(item)}>
                          <IconCopy />
                          {copiedKey === item.key ? "key copied" : "copy invoice key"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="fine">
                  Someone paid this invoice with a plain transfer instead of the payment page, so
                  it sits on the invoice address itself and the vault cannot release it. Import
                  the copied key into any wallet, send it a little ETH for gas, and move the
                  tokens wherever you like.
                </p>
              </div>
            ) : null}

            {address ? null : <ConnectButton big />}

            {address && !seed ? (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={unlock}
                disabled={busy === "unlock"}
              >
                <IconWallet />
                {busy === "unlock" ? "Check your wallet…" : "Also check this wallet's invoices"}
              </button>
            ) : null}

            {error ? <p className="app-error">{error}</p> : null}

            <p className="fine">
              Funds go to the wallet you are connected with. To keep the payment unlinked from
              your public history, use a wallet that has nothing else in it.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
