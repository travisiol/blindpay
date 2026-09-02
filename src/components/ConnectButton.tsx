"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useConnect, useConnection, useConnectors, useSwitchChain } from "wagmi";
import { clsx } from "clsx";
import { robinhoodChain } from "@/lib/chain";
import { IconWallet } from "./Icons";

/**
 * Whether a wallet is actually reachable in this browser. wagmi registers
 * the injected connector whether or not anything is there to inject, so a
 * real provider is looked for instead: `window.ethereum` for older wallets
 * and the EIP-6963 announcement for current ones. Starts optimistic so the
 * server and first client render agree, then corrects itself.
 */
export function useWalletAvailable(): boolean {
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    let found = typeof window !== "undefined" && "ethereum" in window;
    const onAnnounce = () => {
      found = true;
      setAvailable(true);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const timer = window.setTimeout(() => setAvailable(found), 400);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);
  return available;
}

type Props = {
  label?: string;
  className?: string;
  big?: boolean;
  quiet?: boolean;
  /** Drops the helper text underneath, for tight places like the nav bar. */
  compact?: boolean;
};

export function ConnectButton({
  label = "Connect wallet",
  className,
  big,
  quiet,
  compact,
}: Props) {
  const { address, isConnected, chainId } = useConnection();
  const connectors = useConnectors();
  const { mutate: connect, isPending: connecting, error } = useConnect();
  const { mutate: switchChain, isPending: switching } = useSwitchChain();
  const available = useWalletAvailable();
  const cls = clsx("btn", quiet ? "btn-quiet" : "btn-neon", big && "big", className);

  if (isConnected && address && chainId !== robinhoodChain.id) {
    return (
      <button
        type="button"
        className={cls}
        disabled={switching}
        onClick={() => switchChain({ chainId: robinhoodChain.id })}
      >
        <IconWallet />
        {switching ? "Switching…" : `Switch to ${robinhoodChain.name}`}
      </button>
    );
  }

  const connector = connectors[0];
  const canConnect = available && !!connector;

  return (
    <span className={clsx("connect-wrap", big && "big")}>
      <button
        type="button"
        className={cls}
        disabled={!canConnect || connecting}
        onClick={() => connector && connect({ connector })}
        title={canConnect ? undefined : "No browser wallet detected on this device"}
      >
        <IconWallet />
        {connecting ? "Connecting…" : canConnect ? label : "No wallet found"}
      </button>
      {error && !compact ? (
        <span className="app-error">{error.message.split("\n")[0]}</span>
      ) : null}
      {!canConnect && !error && !compact ? (
        <span className="fine">Install a browser wallet to connect.</span>
      ) : null}
    </span>
  );
}

/** Renders its children once a wallet is connected on the right chain. */
export function WalletGate({ children, ...props }: Props & { children: ReactNode }) {
  const { address, isConnected, chainId } = useConnection();
  if (isConnected && address && chainId === robinhoodChain.id) return <>{children}</>;
  return <ConnectButton {...props} />;
}
