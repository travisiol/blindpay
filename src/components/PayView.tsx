"use client";

import { useMemo, useState } from "react";
import { useConnection, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { erc20Abi, maxUint256, type Hex } from "viem";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { decodeLink } from "@/lib/invoices";
import { TOKENS } from "@/lib/tokens";
import { VAULT_ADDRESS, isVaultConfigured, vaultAbi } from "@/lib/vault";
import { useHash } from "@/lib/storage";
import { errorText, explorerAddress, explorerTx, fmt, parse, short } from "@/lib/format";
import { robinhoodChain } from "@/lib/chain";
import { WalletGate } from "./ConnectButton";
import { CopyButton, MiniCopy } from "./Copy";
import { IconCopy, IconExternal, IconSend } from "./Icons";
import { Mark } from "./Mark";

type Stage = "idle" | "approving" | "paying" | "done";

/**
 * The page a payer lands on. The invoice rides in the URL fragment, which
 * never reaches a server, so it is read in the browser after mount.
 */
export function PayView() {
  const hash = useHash();
  const payload = useMemo(() => (hash === undefined ? undefined : decodeLink(hash)), [hash]);

  const { address } = useConnection();
  const { mutateAsync: writeContract } = useWriteContract();
  const [typed, setTyped] = useState("");
  const [stageState, setStage] = useState<Stage>("idle");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = payload ? TOKENS[payload.t] : null;
  const vault = VAULT_ADDRESS;
  const configured = isVaultConfigured();

  // A fixed-amount link decides the amount; an open one takes what is typed.
  const amount = payload?.m && token ? fmt(BigInt(payload.m), token.decimals) : typed;

  const { data: balance } = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!(address && token) },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && vault ? [address, vault] : undefined,
    query: { enabled: !!(address && token && vault) },
  });
  const parsed = token && amount.trim() ? parse(amount, token.decimals) : 0n;
  const { data: quote } = useReadContract({
    address: vault ?? undefined,
    abi: vaultAbi,
    functionName: "quote",
    args: [parsed],
    query: { enabled: !!(token && parsed > 0n && vault) },
  });
  const { isSuccess: mined } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    query: { enabled: !!txHash },
  });
  const stage: Stage = mined && stageState === "paying" ? "done" : stageState;

  if (payload === undefined) return null;

  if (!payload || !token) {
    return (
      <div className="pay-single">
        <Mark size={90} />
        <h1 className="pane-title">This link is unreadable</h1>
        <p className="app-lede">
          The invoice lives in the part of the link after the <code>#</code>. If it was trimmed on
          the way, ask the sender for the whole thing.
        </p>
      </div>
    );
  }

  const needsApproval = configured && parsed > 0n && (allowance === undefined || allowance < parsed);

  const pay = async () => {
    if (!address || !vault) return;
    setError(null);
    if (parsed <= 0n) {
      setError("Enter an amount first.");
      return;
    }
    try {
      if (needsApproval) {
        setStage("approving");
        const approveHash = await writeContract({
          address: token.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [vault, maxUint256],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        for (let i = 0; i < 12; i++) {
          const current = await readContract(wagmiConfig, {
            address: token.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, vault],
          });
          if (current >= parsed) break;
          await new Promise((r) => setTimeout(r, 800));
        }
        await refetchAllowance();
      }
      setStage("paying");
      const hash = await writeContract({
        address: vault,
        abi: vaultAbi,
        functionName: "pay",
        args: [payload.a, token.address, parsed],
      });
      setTxHash(hash);
    } catch (e) {
      setError(errorText(e));
      setStage("idle");
    }
  };

  if (stage === "done") {
    return (
      <div className="pay-single">
        <Mark size={110} />
        <h1 className="pane-title">Payment sent</h1>
        <p className="app-lede">
          {amount} {token.symbol} is now waiting for the recipient. Where they take it from here
          is not visible to you, and not visible to anyone reading the chain.
        </p>
        {txHash ? (
          <a className="btn btn-quiet" href={explorerTx(txHash)} target="_blank" rel="noreferrer">
            <IconExternal />
            View transaction
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pay-card-wide stagger">
      <div className="pay-head">
        <div>
          <p className="hud-label neon">payment request</p>
          <h1 className="pay-amount-title">
            {payload.m
              ? `${fmt(BigInt(payload.m), token.decimals)} ${token.symbol}`
              : `Any amount of ${token.symbol}`}
          </h1>
        </div>
        <Mark size={54} />
      </div>

      <dl className="fees">
        <div>
          <dt>asset</dt>
          <dd>
            {token.name} ·{" "}
            <a
              href={explorerAddress(token.address)}
              target="_blank"
              rel="noreferrer"
              className="mono-link"
            >
              canonical
            </a>
          </dd>
        </div>
        <div>
          <dt>invoice</dt>
          <dd className="addr-row">
            <span className="mono-link">{short(payload.a)}</span>
            <MiniCopy value={payload.a} title="Copy invoice address" />
          </dd>
        </div>
        {quote ? (
          <div className="total">
            <dt>recipient gets</dt>
            <dd>
              {fmt(quote[1], token.decimals)} {token.symbol}
            </dd>
          </div>
        ) : null}
      </dl>

      {payload.m ? null : (
        <label className="field">
          <span className="field-label">amount to send</span>
          <div className="amount-row">
            <input
              className="input big"
              inputMode="decimal"
              value={typed}
              onChange={(e) => setTyped(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <span className="amount-unit">{token.symbol}</span>
          </div>
        </label>
      )}

      {address && balance !== undefined ? (
        <p className="fine">
          you hold {fmt(balance, token.decimals)} {token.symbol}
        </p>
      ) : null}

      {configured ? null : (
        <p className="notice">
          The vault is not live on this network yet, so paying through it is closed. You can
          still settle this invoice by sending {token.symbol} straight to the address below.
        </p>
      )}

      <WalletGate big label="Connect wallet to pay">
        <button
          type="button"
          className="btn btn-neon big"
          onClick={pay}
          disabled={stage !== "idle" || !configured}
        >
          <IconSend />
          {stage === "approving"
            ? "Approve in your wallet…"
            : stage === "paying"
              ? "Confirming…"
              : needsApproval
                ? `Approve & send ${token.symbol}`
                : `Send ${token.symbol}`}
        </button>
      </WalletGate>

      {error ? <p className="app-error">{error}</p> : null}

      <details className="pay-manual">
        <summary>or send by hand</summary>
        <p className="fine">
          Transfer {token.symbol} on {robinhoodChain.name} to the invoice address. It reaches the
          same place, minus the contract&apos;s fee handling.
        </p>
        <code className="link-box">{payload.a}</code>
        <CopyButton value={payload.a} label="Copy address" icon={<IconCopy />} />
      </details>
    </div>
  );
}
