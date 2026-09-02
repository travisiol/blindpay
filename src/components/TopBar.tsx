"use client";

import Link from "next/link";
import { useState } from "react";
import { useConnection, useDisconnect } from "wagmi";
import { siteConfig } from "@/lib/site-config";
import { short } from "@/lib/format";
import { copyText } from "./Copy";
import { ConnectButton } from "./ConnectButton";
import { IconCheck, IconX } from "./Icons";
import { Mark } from "./Mark";
import { robinhoodChain } from "@/lib/chain";

function CaChip({ address }: { address: string }) {
  const [state, setState] = useState<"copied" | "failed" | null>(null);
  return (
    <button
      type="button"
      className={`ca-chip ${state ?? ""}`}
      title={address}
      aria-label={`Copy the contract address ${address}`}
      onClick={async () => {
        setState((await copyText(address)) ? "copied" : "failed");
        setTimeout(() => setState(null), 1800);
      }}
    >
      <span className="ca-label">CA</span>
      <span className="ca-value">
        {state === "copied" ? "copied" : state === "failed" ? "press ⌘C" : short(address)}
      </span>
      {state === "copied" ? (
        <IconCheck />
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="11" height="11" rx="2.5" />
          <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
        </svg>
      )}
    </button>
  );
}

/**
 * The wallet, always reachable from the bar: connect from any page, and once
 * connected the chip is also how you disconnect.
 */
function WalletChip() {
  const { address, isConnected, chainId } = useConnection();
  const { mutate: disconnect } = useDisconnect();

  if (!isConnected || !address) {
    return <ConnectButton compact quiet label="Connect" className="top-connect" />;
  }
  const wrongChain = chainId !== robinhoodChain.id;
  return (
    <button
      type="button"
      className={`ca-chip account-chip ${wrongChain ? "wrong-chain" : ""}`}
      title={wrongChain ? `Connected to the wrong network` : "Disconnect wallet"}
      onClick={() => disconnect({})}
    >
      <span className="dot" />
      <span className="ca-value">{wrongChain ? "wrong network" : short(address)}</span>
    </button>
  );
}

export function TopBar() {
  return (
    <header className="top-bar">
      <Link className="top-mark" href="/" aria-label={siteConfig.wordmark}>
        <Mark size={34} />
        <span className="wordmark">{siteConfig.name}</span>
      </Link>
      <nav className="top-nav" aria-label="Site">
        {siteConfig.ca ? <CaChip address={siteConfig.ca} /> : null}
        <WalletChip />
        <Link className="top-link" href="/docs">
          docs
        </Link>
        <Link className="top-link" href="/how">
          how it works
        </Link>
        {siteConfig.x ? (
          <a
            className="top-x"
            href={siteConfig.x}
            target="_blank"
            rel="noreferrer"
            aria-label={`${siteConfig.wordmark} on X`}
          >
            <IconX />
          </a>
        ) : null}
      </nav>
    </header>
  );
}
