"use client";

import { useMemo, useState } from "react";
import { useConnection, useReadContract, useSignMessage } from "wagmi";
import type { Hex } from "viem";
import { CREATE_TOKENS, TOKENS, type TokenKey } from "@/lib/tokens";
import { VAULT_ADDRESS, isVaultConfigured, vaultAbi } from "@/lib/vault";
import { LOCAL_OWNER, invoiceKey, localSeed, unlockSeed } from "@/lib/keys";
import { invoiceLink, invoiceStore, type StoredInvoice } from "@/lib/invoices";
import { nextIndexFromChain, scanInvoices } from "@/lib/scan";
import { useClientValue, useStorageValue } from "@/lib/storage";
import { errorText, explorerAddress, fmt, parse, short } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { ConnectButton } from "../ConnectButton";
import { CopyButton } from "../Copy";
import { IconBack, IconCopy, IconDownload, IconExternal, IconFile, IconUpload } from "../Icons";
import { Mark } from "../Mark";
import { QrCode } from "../QrCode";

/** Used until the vault answers, and whenever there is no vault to ask. */
const DEFAULT_FEE_BPS = 50;

/** Next unused index per seed, so one chain scan serves a whole session. */
const chainNext = new Map<Hex, number>();

async function allocateIndex(seed: Hex, owner: string): Promise<number> {
  let fromChain = chainNext.get(seed);
  if (fromChain === undefined) fromChain = nextIndexFromChain(await scanInvoices(seed));
  const next = Math.max(invoiceStore.nextIndex(owner), fromChain);
  chainNext.set(seed, next + 1);
  return next;
}

export function CreateView({ onBack }: { onBack: () => void }) {
  const { address } = useConnection();
  const { mutateAsync: signMessage } = useSignMessage();
  const { data: feeBpsOnChain } = useReadContract({
    address: VAULT_ADDRESS ?? undefined,
    abi: vaultAbi,
    functionName: "feeBps",
    query: { enabled: isVaultConfigured(), staleTime: 60_000 },
  });
  const feeBps = feeBpsOnChain ?? DEFAULT_FEE_BPS;

  const [tokenKey, setTokenKey] = useState<TokenKey>(CREATE_TOKENS[0] ?? "NVDA");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<StoredInvoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const origin = useClientValue(() => window.location.origin, "");
  const backupKey = useStorageValue(() => (address ? null : localSeed.get()), null);

  const token = TOKENS[tokenKey];
  const link = created && origin ? invoiceLink(created, origin) : "";

  const split = useMemo(() => {
    if (!amount.trim()) return null;
    const gross = parse(amount, token.decimals);
    const fee = (gross * BigInt(feeBps)) / 10000n;
    return { fee, net: gross - fee };
  }, [amount, token.decimals, feeBps]);

  const create = async () => {
    setError(null);
    setBusy(true);
    try {
      const owner = address ?? LOCAL_OWNER;
      const seed = address
        ? await unlockSeed(address, (message) => signMessage({ message }))
        : localSeed.getOrCreate();
      const index = await allocateIndex(seed, owner);
      const { address: stealth } = invoiceKey(seed, index);
      const inv: StoredInvoice = {
        id: `${owner.toLowerCase()}-${index}`,
        index,
        owner,
        token: tokenKey,
        amount: amount.trim() ? parse(amount, token.decimals).toString() : "",
        stealth,
        note: note.trim(),
        createdAt: Date.now(),
      };
      invoiceStore.add(inv);
      setCreated(inv);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ url: link, title: `${siteConfig.wordmark} invoice` }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(link);
    }
  };

  return (
    <div className="panel-wrap">
      <button type="button" className="back" onClick={onBack}>
        <IconBack />
        back
      </button>

      <div className="split">
        <section className="pane stagger">
          <h2 className="pane-title">New invoice</h2>

          <label className="field">
            <span className="field-label">asset</span>
            <div className="seg" role="group" aria-label="Asset">
              {CREATE_TOKENS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={key === tokenKey ? "on" : ""}
                  onClick={() => setTokenKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span className="field-label">how much</span>
            <div className="amount-row">
              <input
                className="input big"
                inputMode="decimal"
                placeholder={tokenKey === "USDG" ? "250.00" : "1.5"}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              />
              <span className="amount-unit">{token.symbol}</span>
            </div>
            <span className="field-hint">leave empty to accept any amount</span>
          </label>

          <label className="field">
            <span className="field-label">note for you</span>
            <input
              className="input"
              placeholder="design work, march"
              maxLength={60}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <span className="field-hint">stays in this browser, never in the link</span>
          </label>

          <button type="button" className="btn btn-neon big" onClick={create} disabled={busy}>
            <IconFile />
            {busy
              ? address
                ? "Sign in your wallet…"
                : "Creating…"
              : created
                ? "Create another"
                : "Create invoice"}
          </button>

          {address ? null : (
            <p className="field-hint">
              No wallet needed: this browser keeps the invoice key. Connect one to make your
              invoices recoverable on any device.
            </p>
          )}

          <div className="row">
            {address ? null : <ConnectButton quiet label="Connect wallet" />}
            {backupKey ? (
              <CopyButton value={backupKey} label="copy backup key" icon={<IconDownload />} />
            ) : null}
          </div>

          {error ? <p className="app-error">{error}</p> : null}
        </section>

        <section className="pane stagger">
          <h2 className="pane-title">Preview</h2>

          <div className={`qr-frame ${created ? "ready" : ""}`}>
            {created && link ? (
              <QrCode value={link} />
            ) : (
              <div className="qr-empty">
                <Mark size={72} />
                <span className="fine">your link appears here</span>
              </div>
            )}
          </div>

          {created && link ? (
            <>
              <div className="link-row">
                <code className="link-box">{link}</code>
              </div>
              <div className="row">
                <CopyButton value={link} label="Copy link" icon={<IconCopy />} />
                <button type="button" className="btn btn-quiet" onClick={share}>
                  <IconUpload />
                  share
                </button>
                <a
                  className="btn btn-quiet"
                  href={explorerAddress(created.stealth)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconExternal />
                  {short(created.stealth)}
                </a>
              </div>
            </>
          ) : (
            <p className="fine">
              Fill the amount and create the invoice. The QR and link show up here instantly.
            </p>
          )}

          <dl className="fees">
            <div>
              <dt>they send</dt>
              <dd>{amount.trim() ? `${amount} ${token.symbol}` : "-"}</dd>
            </div>
            <div>
              <dt>our fee · {(Number(feeBps) / 100).toFixed(2)}%</dt>
              <dd>{split ? `${fmt(split.fee, token.decimals)} ${token.symbol}` : "-"}</dd>
            </div>
            <div className="total">
              <dt>you claim</dt>
              <dd>{split ? `${fmt(split.net, token.decimals)} ${token.symbol}` : "-"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
