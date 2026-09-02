import { createConfig, http, injected } from "wagmi";
import { robinhoodChain } from "./chain";

/** Injected wallets only: no WalletConnect project, no relay, nothing hosted. */
export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
