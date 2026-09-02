"use client";

import { EyeScene } from "../EyeScene";

export function Landing({ onPick }: { onPick: (view: "create" | "claim") => void }) {
  return (
    <div className="landing stagger">
      <button
        type="button"
        className="eye-stage"
        onClick={() => onPick("create")}
        aria-label="Create an invoice"
      >
        <EyeScene />
      </button>

      <h1 className="landing-h1">Get paid without showing your wallet</h1>

      <p className="landing-lede">
        Send a link, receive stock tokens or dollars, claim them to any address you like. The
        payer never sees where the money ends up.
      </p>

      <div className="landing-actions">
        <button type="button" className="btn btn-neon big" onClick={() => onPick("create")}>
          Create Invoice
        </button>
        <button type="button" className="btn big" onClick={() => onPick("claim")}>
          Claim Payment
        </button>
      </div>
    </div>
  );
}
