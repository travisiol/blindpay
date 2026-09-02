import type { Metadata } from "next";
import Link from "next/link";
import { IconBack, IconExternal } from "@/components/Icons";
import { robinhoodChain } from "@/lib/chain";
import { explorerAddress, short } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { CREATE_TOKENS, TOKENS } from "@/lib/tokens";
import { VAULT_ADDRESS } from "@/lib/vault";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Contracts, key derivation, the claim signature scheme, and exactly what this does and does not hide.",
};

function AddressLink({ address }: { address: `0x${string}` }) {
  return (
    <a className="mono-link" href={explorerAddress(address)} target="_blank" rel="noreferrer">
      {short(address)} <IconExternal />
    </a>
  );
}

export default function DocsPage() {
  return (
    <main className="stage-main docs-main">
      <div className="docs-wrap stagger">
        <Link className="back" href="/">
          <IconBack />
          back
        </Link>
        <h1 className="docs-h1">Docs</h1>
        <p className="app-lede">
          The reference: contracts, keys, how a claim is authorised, and what is and is not
          hidden. For this in plain words, read{" "}
          <Link className="mono-link" href="/how">
            how it works
          </Link>
          .
        </p>

        <section className="docs-card">
          <h2 className="hud-label">protocol</h2>
          <p>
            An invoice is nothing but an address whose private key was generated in the
            recipient&apos;s browser. To pay one, a payer calls{" "}
            <code>pay(invoice, token, amount)</code>: the tokens land in the shared vault and{" "}
            <code>claimable[invoice][token]</code> goes up by whatever actually arrived, after the
            fee. To release them, anyone calls{" "}
            <code>claim(invoice, token, to, deadline, signature)</code>. The contract recovers the
            EIP-712 signer and refuses the call unless it matches the invoice address. Permission
            rides in the signature rather than in the sender, which is why any wallet can broadcast
            the claim and pay for it.
          </p>
          <p>
            Each signature works once, because a per-invoice nonce is part of the signed struct.
            It only pays out to the destination it was signed for, because <code>to</code> is part
            of it too. And it stops working at its <code>deadline</code>. Intercept one in flight
            and there is nothing useful to do with it.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">keys</h2>
          <p>
            Connect a wallet and one signature over a fixed message becomes the root:{" "}
            <code>seed = keccak(signature)</code>, with invoice N keyed by{" "}
            <code>keccak(seed, N)</code>. Sign the same message on another device and every
            invoice that wallet ever made comes back. Only the resulting public addresses leave
            the browser. Skip the wallet and the root is 32 random bytes held in this
            browser&apos;s storage, with the backup button under the create form as the sole other
            copy anywhere. Lose both and the money is gone. Nothing is kept on a server, which is
            the point.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">contracts</h2>
          <dl className="fees">
            <div>
              <dt>network</dt>
              <dd>
                {robinhoodChain.name} · id {robinhoodChain.id}
              </dd>
            </div>
            <div>
              <dt>vault</dt>
              <dd>
                {VAULT_ADDRESS ? (
                  <AddressLink address={VAULT_ADDRESS} />
                ) : (
                  <span className="unset">not deployed yet</span>
                )}
              </dd>
            </div>
            <div>
              <dt>fee pool</dt>
              <dd>
                {siteConfig.feePool ? (
                  <AddressLink address={siteConfig.feePool} />
                ) : (
                  <span className="unset">not set</span>
                )}
              </dd>
            </div>
            <div>
              <dt>fee</dt>
              <dd>0.5% on payment · ceiling 1%, enforced on chain</dd>
            </div>
          </dl>
          <p className="fine">
            Pooled balances are out of the owner&apos;s reach. <code>rescue</code> is limited on
            chain to the surplus that no invoice has a claim on, and the fee ceiling is a constant
            the owner has no way to raise.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">assets</h2>
          <dl className="fees">
            {Object.values(TOKENS).map((token) => (
              <div key={token.key}>
                <dt>
                  {token.symbol}
                  {CREATE_TOKENS.includes(token.key) ? "" : " · paying existing links only"}
                </dt>
                <dd>
                  <AddressLink address={token.address} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="fine">
            These come from the chain&apos;s own registry and should be checked against a fork
            before anything real depends on them. The vault keeps an allowlist, so a token wearing
            the right ticker at the wrong address gets rejected.
          </p>
        </section>

        <section className="docs-card">
          <h2 className="hud-label">privacy model</h2>
          <p>
            What stays hidden is the connection between an invoice and you. Keys never leave the
            browser. An invoice address shows up on chain only once someone pays it. The vault&apos;s{" "}
            <code>Claimed</code> event does not record where the money went. Your note never
            enters the link, and the link&apos;s payload lives in the URL fragment, which browsers
            do not send anywhere.
          </p>
          <p>
            What is visible is what any chain makes visible: who paid, how much, when, and which
            address a claim paid out to. Because the vault is pooled, an incoming payment and an
            outgoing claim are two transactions against one busy contract rather than an obvious
            pair on a single-use address. Claim into a fresh wallet and there is nothing linking
            the two ends.
          </p>
        </section>
      </div>
    </main>
  );
}
