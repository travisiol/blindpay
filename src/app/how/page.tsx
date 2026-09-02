import type { Metadata } from "next";
import Link from "next/link";
import { IconBack } from "@/components/Icons";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Hand someone a link, let the money land behind it, and collect it to a wallet nobody can tie back to you.",
};

export default function HowPage() {
  return (
    <main className="stage-main docs-main">
      <div className="docs-wrap stagger">
        <Link className="back" href="/">
          <IconBack />
          back
        </Link>
        <h1 className="docs-h1">How it works</h1>
        <p className="app-lede">
          Hand someone a link. The money lands behind it. You collect it to whatever wallet you
          feel like, and the two halves cannot be tied together. Four steps, and no account at
          any point.
        </p>

        <section className="docs-card">
          <h2 className="hud-label">1 · create an invoice</h2>
          <p>
            Choose an asset, name an amount or leave it open, and press the button. There is no
            sign-up and you do not need a wallet: the key behind the invoice is generated here in
            your browser, and the backup button under the form hands you the only copy that
            matters. Connect a wallet instead and one signature rebuilds every invoice you have
            ever issued, on any machine.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">2 · share the link</h2>
          <p>
            Paste the link or show the QR wherever you like: a chat window, an email, a printed
            invoice, a sticker. Everything the payer needs sits after the hash mark in the URL,
            and that fragment is the one part of an address a browser keeps to itself. It never
            reaches our side, so there is no log of who opened which invoice because there is
            nothing to log.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">3 · they pay</h2>
          <p>
            Your payer opens the link, reads exactly what you asked for, connects a wallet and
            sends, all on one screen. The tokens settle inside the shared vault, booked against
            your invoice. What they can see is the invoice; what they cannot see is you. The
            address they paid is used once and reveals nothing about where the balance travels
            next.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">4 · claim it anywhere</h2>
          <p>
            Open Claim, connect any wallet at all (its only job is paying gas) and press the
            button. The invoice key signs the release and the vault forwards the balance to
            whatever address you named. Point it at an empty wallet and the payment never touches
            your public history. That is where the trail stops.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">want the internals?</h2>
          <p>
            Addresses, the signature scheme, how keys are derived and exactly what stays private
            are all written up in the{" "}
            <Link className="mono-link" href="/docs">
              docs
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
