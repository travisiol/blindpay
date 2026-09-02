# BLINDPAY

Get paid without showing your wallet. Invoice links for stock tokens and
USDG on Robinhood Chain: the payment lands in a pooled vault contract, and
the recipient claims it to any address with a signature. The payer never
sees where the money ends up.

Same product, same flow and the same art direction as hushbook.xyz, rebuilt
under a new name. Routes, key scheme, link format and the contract
interface are the reference's; the body copy on `/how` and `/docs` was
rewritten from scratch, and the mark and the background scene are drawn
here rather than lifted.

## Routes

| Route   | What it is                                                              |
| ------- | ----------------------------------------------------------------------- |
| `/`     | Landing, then the create and claim views held in state (URL never moves) |
| `/i`    | The payment page. The invoice rides in the URL fragment after `#`        |
| `/how`  | Plain-words walkthrough                                                  |
| `/docs` | Contracts, keys, claim scheme, privacy model                             |
| `/app`  | Redirects to `/`; unknown routes do the same                            |

## Running it

```bash
npm install
npm run dev -- -p 3100
```

Copy `.env.example` to `.env.local`. With no vault address set the app is
in its unconfigured state: invoices can be created and links shared, but
paying and claiming are disabled with the reason shown on screen, and
balances read as zero.

## Art direction

Night desert, one eye, one green. Everything sits on `#060607`; panels are
smoked glass over the scene rather than solid cards, so the sky keeps
showing through and the page reads as one image with forms laid on top.
Acid green `#7ee31f` marks the primary action, the total on a ledger and
focus, and nothing else. Inter carries display sizes at 400–500 weight, IBM
Plex Mono carries labels, addresses and amounts. Radii are 22–24px on
panels and full pills on controls.

Moving parts, all in `src/components/`:

- `Preloader` — the mark strokes itself in, the bar fills, the screen fades.
  The wait for `document.fonts.ready` is capped at 2s: without the cap a
  stalled font request leaves a visitor staring at the loading screen.
- `EyeScene` — the hero. The lid path is interpolated between open and shut,
  the iris tracks the cursor with easing, and it closes when you reach for
  it. Every frame writes attributes onto the SVG nodes; React never
  re-renders.
- `StarField` — 150 stars on canvas, each twinkling on its own clock, dying
  and being reborn, with a shooting star every few seconds.
- `SceneBackdrop` — the dunes and the aurora, drawn as SVG. This replaces
  the reference's background video, which is not ours to copy.
- `Mark` — one path, an almond with a four-point spark cut out of it by
  `fill-rule="evenodd"`, shared by the nav, the preloader, the QR centre and
  the generated icons via `src/lib/mark.ts`.

## Connecting a wallet

The wallet is reachable from the bar on every page, and the chip is also how
you disconnect. Wrong network shows as such rather than failing silently.
Discovery is EIP-6963 with a `window.ethereum` fallback, injected wallets
only, so there is no WalletConnect project and nothing relayed through a
third party.

Claiming is a signature, not a transaction from you: the invoice key signs
an EIP-712 `Claim`, and any wallet may broadcast it and pay the gas.
`scripts/verify-claim.mjs` proves that scheme is sound without needing a
deployed contract:

```bash
node scripts/verify-claim.mjs
```

It derives a seed and an invoice key exactly as the browser does, signs a
claim, and checks the vault would recover the invoice address. Then it
tampers with the destination, the nonce, the deadline and the token, and
confirms each one recovers a stranger instead, which is what makes an
intercepted signature useless.

## What is gated, and why

- **Vault address** (`NEXT_PUBLIC_BLINDPAY_VAULT_ADDRESS`). No contract has
  been deployed for this name. The reference vault has its own EIP-712
  domain name baked in, so pointing at it would need
  `NEXT_PUBLIC_BLINDPAY_EIP712_NAME` set to match that contract exactly.
  Claim signatures verify against that name on chain.
- **Fee pool, CA chip, X link.** All env-driven and hidden or marked
  "not set" while empty, so no placeholder address can ship.
- **Token addresses** in `src/lib/tokens.ts` are the chain's canonical
  assets. Re-verify them before real funds touch them.

## Key scheme

Frozen text lives in `src/lib/keys.ts`. The derivation message and the
`blindpay.master.v1` salt must never change: every invoice key descends
from them. Storage keys are prefixed `blindpay.` so a browser that also
used the reference keeps the two apart.

The name lives in `src/lib/site-config.ts` (`name`, `wordmark`) plus the
`NEXT_PUBLIC_BLINDPAY_*` env prefix and those frozen strings.

## Notes

Storage reads go through `useSyncExternalStore` in `src/lib/storage.ts`.
Next 16 ships the React Compiler lint rules, which reject setState-in-effect
and impure calls during render; helpers in `vault.ts` and `invoices.ts` hold
the `Date.now()` calls for the same reason.
