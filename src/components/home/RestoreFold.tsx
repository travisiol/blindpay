"use client";

import { useState } from "react";
import type { Hex } from "viem";
import { localSeed } from "@/lib/keys";
import { errorText } from "@/lib/format";

export function RestoreFold({ onRestored }: { onRestored: () => Promise<void> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    const key = value.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      setError("A backup key is 0x followed by 64 hex characters.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      localSeed.restore(key as Hex);
      await onRestored();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="pay-manual restore-fold">
      <summary>Restore from a backup key</summary>
      <p className="fine">
        Paste the backup key saved when the invoices were created without a wallet. Paid
        invoices are found on chain; unpaid links exist only in the browser that made them.
      </p>
      <div className="restore-row">
        <input
          className="input"
          placeholder="0x…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        <button type="button" className="btn btn-neon" onClick={restore} disabled={busy}>
          {busy ? "Scanning…" : "Restore"}
        </button>
      </div>
      {error ? <p className="app-error">{error}</p> : null}
    </details>
  );
}
